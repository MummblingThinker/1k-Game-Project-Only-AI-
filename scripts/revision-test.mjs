import assert from 'node:assert/strict';
import { buildLevel } from '../public/js/world.js';
import { startLevel,stepRun,interactRun,killPlayer,safeFromOrdinary } from '../public/js/simulation.js';
import { createPlayer,stepPlayer,overlaps } from '../public/js/physics.js';
const runAt=(level=1,count=1)=>{const r={players:new Map(Array.from({length:count},(_,slot)=>['p'+slot,{id:'p'+slot,slot}]))};startLevel(r,level,true);return r;};
const tick=(r,n=1)=>{for(let i=0;i<n;i++)stepRun(r);};
const p0=r=>r.players.get('p0');
const section=(name,fn)=>{fn();console.log('PASS',name);};
section('15 distinct routes, biome debris, dense enemies, map scale, protected swarm only at 11',()=>{
  const signatures=new Set();
  for(let id=1;id<=15;id++)for(const count of [1,2,3,4]){
    const w=buildLevel(id,count);assert.equal(w.revision,2);assert.ok(w.checkpoints.length);assert.ok(w.checkpoints.every(c=>c.kind==='flag'));
    assert.ok(!w.platforms.some(s=>s.kind==='shelter-roof'));assert.ok(w.ladders.length>=2);
    assert.ok(w.enemies.length>=(id===1?1:6),`enemy density ${id}`);
    assert.ok(new Set(w.crates.map(c=>c.kind)).size>=4,`props ${id}`);
    assert.ok(w.pits.every(p=>p.w>=180),'required bridge gaps exceed maximum jump/throw');
    assert.ok(w.width===(id===1?960:id%5?2880:id===5?5280:id===10?5760:6240));
    assert.ok(Math.abs((2880+114)/w.giant.speed/60-120)<.01);
    if(id===11)assert.equal(w.coveredWay.drones,100);else assert.equal(w.coveredWay,undefined);
    if(count===1)signatures.add(w.districts.map(d=>d.type).join(','));
  }
  assert.equal(signatures.size,15);
});
section('flags award once, have no safe room protection, solo death respawns at saved flag',()=>{
  const full=runAt(),f=p0(full),flag=full.world.checkpoints[0];f.x=flag.x;f.y=flag.y+flag.h-f.h;tick(full);assert.equal(full.hearts,4,'a full-health player still gains the promised heart');assert.equal(full.heartMax,4);
  const r=runAt(),p=p0(r),cp=r.world.checkpoints[0];r.hearts=1;p.x=cp.x;p.y=cp.y+cp.h-p.h;tick(r);
  assert.equal(cp.active,true);assert.equal(r.hearts,2);assert.equal(r.respawnX,cp.x);assert.equal(safeFromOrdinary(r.world,p),false);
  tick(r,30);assert.equal(r.hearts,2);killPlayer(r,p,'test');tick(r);assert.equal(r.hearts,1);assert.equal(p.alive,true);assert.ok(Math.abs(p.x-cp.x)<1);tick(r,30);assert.equal(r.hearts,1);
});
section('long relay bridge cannot be jumped and opens exactly once',()=>{
  const r=runAt(),w=r.world,sw=w.switches[0],pit=w.pits[0],p=p0(r);
  p.x=pit.x-15;p.y=w.floorY-p.h;p.onGround=true;
  for(let t=0;t<100&&r.phase==='playing';t++){p.input={right:true,jump:t===0};stepRun(r);}
  assert.ok(r.deathEvents.some(e=>e.cause==='Fell into a pit'));
  p.x=sw.x-10;p.y=w.floorY-p.h;p.input={};p.invulnerability=100;assert.ok(interactRun(r,p.id));tick(r,12);assert.equal(interactRun(r,p.id),false);
  assert.equal(w.platforms.filter(s=>s.kind==='switch-bridge').length,1);
  p.x=pit.x-15;p.y=w.floorY-p.h;p.input={right:true};tick(r,Math.ceil((pit.w+40)/1.28));assert.ok(p.x>pit.x+pit.w);assert.equal(p.alive,true);
});
section('pressure bridge latches for crossing, durable weights reset after pit loss',()=>{
  const r=runAt(6),w=r.world,plate=w.plates[0],weight=w.crates.find(c=>c.plateId===plate.id);
  weight.x=plate.x+4;weight.y=plate.y-weight.h;tick(r);assert.equal(plate.held,true);assert.ok(w.platforms.some(s=>s.plateId===plate.id));
  weight.x=weight.homeX;tick(r,60);assert.equal(plate.remaining,420);
  weight.y=w.height+30;tick(r);assert.equal(weight.used,false);assert.equal(weight.x,weight.homeX);
});
section('ladders reach solid roof, wall jump reverses velocity, negative altitude is supported',()=>{
  const w=buildLevel(3),l=w.ladders[0],p=createPlayer('test',l.x,l.y+l.h-22);p.climbing=l.id;
  for(let t=0;t<200;t++)stepPlayer(p,{},w);
  assert.equal(p.y,l.y-p.h);assert.equal(p.onGround,true);
  const wall=w.platforms.find(s=>s.h>60);p.x=wall.x-p.w;p.y=wall.y+30;p.onGround=false;p.coyoteTicks=0;p.lastJump=false;p.climbing=null;stepPlayer(p,{jump:true,right:true},w);assert.ok(p.vx<0);assert.ok(p.vy<0);
  const r=runAt(5),q=p0(r),c=r.world.crates[0];q.y=-100;q.x=c.x;c.carriedBy=q.id;q.carryId=c.id;interactRun(r,q.id);assert.equal(c.y,-98);
});
section('small and medium robots damaged by throws; large armor survives; props break; weights survive',()=>{
  for(const size of ['small','medium','big']){
    const r=runAt(3),w=r.world,e=w.enemies[0],c=w.crates[0];w.enemies=[e];e.kind='courier';e.size=size;e.hp=size==='big'?999:size==='medium'?3:1;e.x=900;e.y=500;e.w=20;e.h=30;e.minX=850;e.maxX=1000;e.groundY=530;
    for(let hit=0;hit<(size==='small'?1:3);hit++){c.used=false;c.carriedBy=null;c.x=e.x+4;c.y=e.y+4;c.vx=3;c.vy=0;c.flightTicks=30;c.thrownBy='p0';tick(r);}
    assert.equal(e.dead,size!=='big');assert.equal(e.hp,size==='big'?999:0);assert.equal(c.used,true);if(size==='big')assert.ok(e.stunned>0);
  }
});
section('directional detection, clear windup then charge, patrol turnaround, flying scan retained',()=>{
  const r=runAt(2),w=r.world,p=p0(r),e=w.enemies.find(e=>e.kind!=='scanner');w.enemies=[e];w.platforms=[];e.x=300;e.minX=200;e.maxX=600;e.y=w.floorY-e.h;e.groundY=w.floorY;e.dir=1;p.x=250;p.y=w.floorY-p.h;
  tick(r);assert.equal(e.phase,'patrol');p.x=360;tick(r);assert.equal(e.phase,'windup');tick(r,45);assert.equal(e.phase,'charge');
  p.x=50;e.x=e.maxX;e.dir=1;e.phase='patrol';tick(r);assert.equal(e.dir,-1);
  e.kind='scanner';e.x=300;e.y=w.floorY-80;e.phase='patrol';p.x=310;p.y=w.floorY-p.h;p.invulnerability=0;tick(r);assert.equal(e.phase,'warning');assert.equal(e.targetX,p.x);
});
section('climbing boss takes thrown damage, death emits pixels and creates final exit',()=>{
  const r=runAt(5),w=r.world,b=w.boss,p=p0(r);w.switches.forEach(s=>s.active=true);p.x=b.x+30;tick(r);assert.notEqual(b.phase,'waiting');
  p.y=w.floorY-220;b.bodyY=p.y-18;const c=w.crates[0];for(let i=0;i<8;i++){c.used=false;c.carriedBy=null;c.x=b.bodyX+10;c.y=b.bodyY+10;c.vx=3;c.vy=0;c.flightTicks=40;tick(r);}
  assert.equal(b.hp,0);assert.equal(b.solved,true);assert.ok(w.breakEffects.some(e=>e.kind==='boss'));assert.equal(w.finish.locked,false);assert.ok(w.ladders.some(l=>l.id==='final-ladder'));
});
section('chainsaw finale kills players underneath, permits safe escape, and kills boss',()=>{
  for(const under of [false,true]){const r=runAt(10),w=r.world,b=w.boss,p=p0(r);w.switches.forEach(s=>s.active=true);p.x=b.tree.x-40;p.y=w.floorY-p.h;p.invulnerability=999;tick(r);assert.equal(b.tree.phase,'warning');p.x=under?b.tree.x:b.tree.x+b.tree.w+10;tick(r,210);assert.equal(b.solved,true);assert.equal(r.deathEvents.some(e=>e.cause==='Falling tree'),under);}
});
section('foundry consoles escalate lava, retain ladder routes, switch to left escape, lava death unlocks exit',()=>{
  const r=runAt(15),w=r.world,b=w.boss,p=p0(r);w.switches.forEach(s=>s.active=true);p.x=b.x+30;tick(r);const speed=b.lavaSpeed;
  for(let i=0;i<3;i++){const s=b.pylons[i];p.x=s.x;p.y=s.y-4;p.invulnerability=1000;tick(r,12);assert.ok(interactRun(r,p.id));assert.equal(b.phaseIndex,i+1);assert.ok(b.lavaSpeed>speed);}
  assert.equal(b.phase,'breach');assert.ok(b.bodyX<b.x);tick(r,120);assert.equal(b.phase,'escape');assert.ok(w.finish.x<b.x);assert.ok(w.ladders.length>=7);assert.ok(w.platforms.some(s=>s.kind==='escape-floor'));
  p.x=w.finish.x+40;p.y=w.finish.y;tick(r);assert.equal(b.solved,true);assert.equal(w.finish.locked,false);
});
section('giant remains outside boss zone and heart death is charged once',()=>{
  const r=runAt(5),p=p0(r),w=r.world;w.giant.x=w.boss.x-65;w.giant.wakeTicks=0;p.x=w.boss.x+10;p.invulnerability=1000;tick(r,300);assert.ok(w.giant.x+44<w.boss.x);assert.equal(p.alive,true);
  const h=r.hearts;killPlayer(r,p,'fixture',true);killPlayer(r,p,'duplicate',true);assert.equal(r.hearts,h-1);
});
console.log('Current revision rule suite complete. Legacy shelter/indestructible-boss assertions are superseded, not counted as current evidence.');
