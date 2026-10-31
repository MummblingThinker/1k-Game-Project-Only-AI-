import assert from 'node:assert/strict';
import {buildLevel} from '../public/js/world.js';
import {createPlayer,stepPlayer,overlaps} from '../public/js/physics.js';
import {startLevel,stepRun,interactRun} from '../public/js/simulation.js';
import {driveRevision} from './revision-driver.mjs';
const runAt=(level,count=1,seed=1)=>{const r={players:new Map(Array.from({length:count},(_,slot)=>['p'+slot,{id:'p'+slot,slot}]))};startLevel(r,level,true);r.world=buildLevel(level,count,seed);return r;};
const tick=(r,n=1)=>{for(let i=0;i<n;i++)stepRun(r);};
// Random layouts retain a supported ladder path for every tested seed.
const layouts=new Set();
for(let seed=1;seed<=24;seed++){
 const w=buildLevel(5,1,seed),b=w.boss;assert.deepEqual(w,buildLevel(5,1,seed));
 const ladders=w.ladders.filter(l=>l.x>=b.x);layouts.add(JSON.stringify(ladders));
 for(const l of ladders){
  const p=createPlayer('climber',l.x,l.y+l.h-22);w.crates=[];
  for(let t=0;t<100;t++)stepPlayer(p,{up:true},w);
  assert.equal(p.y+p.h,l.y,'ladder reaches its supported floor');
  assert.ok(w.platforms.some(s=>s.y===l.y&&l.x>=s.x&&l.x+12<=s.x+s.w));
 }
 assert.ok(new Set(buildLevel(5,1,seed).crates.filter(c=>c.x>=b.x).map(c=>c.kind)).size>=4);
}
assert.ok(layouts.size>20);console.log('ENCOUNTER PASS: 24 reproducible varied towers, reachable ladders, varied debris.');
for(const weapon of ['laser','claw']){
 const r=runAt(5,2),b=r.world.boss,[p,q]=[...r.players.values()];r.world.enemies=[];r.world.switches.forEach(s=>s.active=true);
 p.x=b.x+200;q.x=b.x+500;p.y=q.y=r.world.floorY-p.h;b.phase='active';b.bodyX=b.x+425;b.targetId=p.id;
 b.attack=weapon+'-warning';b.attackTimer=2;b.attackX=p.x+p.w/2;b.attackY=p.y+p.h/2;
 tick(r);assert.ok(p.alive,'warning is harmless');tick(r);assert.equal(p.alive,false);assert.equal(r.hearts,r.heartMax-1);
 assert.equal(r.deathEvents.at(-1).cause,'Warden '+weapon);assert.ok(q.alive,'safe player outside marker survives');
}
console.log('ENCOUNTER PASS: laser/claw warnings precede real bounded damage.');
{
 const r=runAt(5),w=r.world,b=w.boss,p=r.players.get('p0');w.switches.forEach(s=>s.active=true);p.x=b.x+200;b.phase='active';b.elapsed=179;b.attackTimer=10000;tick(r);
 const drone=w.enemies.find(e=>e.arena);assert.ok(drone);drone.x=p.x+50;drone.y=p.y-50;drone.phase='recover';drone.timer=100;
 const distance=Math.hypot(drone.x-p.x,drone.y-p.y);tick(r,15);assert.ok(Math.hypot(drone.x-p.x,drone.y-p.y)<distance,'drone follows player in arena');
 const c=w.crates[0];Object.assign(c,{used:false,carriedBy:null,x:drone.x,y:drone.y,vx:3,vy:0,flightTicks:30});tick(r);assert.ok(drone.dead,'throwable destroys small arena drone');
}
console.log('ENCOUNTER PASS: deployed drones pursue inside arena and can be destroyed.');
{
 const w=buildLevel(10);w.crates=[];
 for(const tree of w.platforms.filter(s=>s.kind==='maze-tree'))for(let delay=1;delay<80;delay+=5){
  const l=w.ladders.find(l=>l.x===tree.x-18),p=createPlayer('jump',l.x,w.floorY-22);
  for(let i=0;i<delay;i++)stepPlayer(p,{up:true},w);
  for(let i=0;i<90;i++){stepPlayer(p,{right:true,jump:i%12===0},w);assert.ok(!overlaps(p,tree),'ladder jump never embeds in solid tree');}
 }
}
console.log('ENCOUNTER PASS: 144 ladder-jump timings cannot clip through tree pillars.');
for(const hearts of [1,2]){
 const r=runAt(10),w=r.world,b=w.boss,p=r.players.get('p0');w.enemies=[];w.switches.forEach(s=>s.active=true);r.hearts=hearts;
 b.phase='active';b.tree.phase='falling';b.tree.timer=1;p.x=b.tree.x+40;p.y=w.floorY-p.h;p.invulnerability=0;tick(r);
 assert.ok(b.solved);assert.equal(r.hearts,hearts-1);
 if(hearts===1){assert.equal(r.phase,'gameover');assert.ok(!p.alive);}else{assert.ok(p.alive);assert.equal(p.y+p.h,w.floorY-18);assert.ok(p.x>=b.tree.x&&p.x<b.tree.x+b.tree.w);assert.equal(r.phase,'playing');}
}
console.log('ENCOUNTER PASS: falling-tree death respawns solo on log; zero hearts still ends run.');
{
 const r=runAt(6),w=r.world,p=r.players.get('p0'),a=w.crates.find(c=>c.animal);assert.ok(a);w.crates=[a];w.enemies=[];w.giant.wakeTicks=99999;p.x=a.x-8;p.y=a.y+a.h-p.h;
 assert.ok(interactRun(r,p.id));assert.equal(p.carryId,a.id);tick(r,12);assert.ok(interactRun(r,p.id,'carry'));assert.equal(a.carriedBy,null);assert.ok(a.flightTicks>0&&a.vx>0);tick(r,150);assert.equal(a.used,false);assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y));
}
console.log('ENCOUNTER PASS: animals lift, throw, land intact and retain simulation state.');
// Full approach and boss, with only normal inputs; the fixture fixes the seed, not difficulty.
for(const party of [1,2,4])for(const seed of (party===1?Array.from({length:24},(_,i)=>i+1):[3,11,23])){
 const r=runAt(5,party,seed),memos=Array.from({length:party},()=>({}));
 for(let t=0;t<22000&&r.phase==='playing';t++){
  for(const p of r.players.values()){const c=driveRevision(r,p,memos[p.slot]);p.input=c.input;if(c.action)interactRun(r,p.id,c.action);}stepRun(r);
 }
 console.log('WARDEN ROUTE',JSON.stringify({party,seed,phase:r.phase,ticks:r.tick,deaths:r.deathEvents.map(e=>e.cause)}));
 assert.equal(r.phase,'victory',`party ${party} seed ${seed}`);
}
