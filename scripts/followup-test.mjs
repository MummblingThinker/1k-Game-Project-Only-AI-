import assert from 'node:assert/strict';
import {buildLevel} from '../public/js/world.js';
import {createPlayer,stepPlayer,overlaps} from '../public/js/physics.js';
import {startLevel,stepRun,interactRun,killPlayer} from '../public/js/simulation.js';
const runAt=(level=1,count=1)=>{const r={players:new Map(Array.from({length:count},(_,slot)=>['p'+slot,{id:'p'+slot,slot}]))};startLevel(r,level,true);return r;};
const tick=(r,n=1)=>{for(let i=0;i<n;i++)stepRun(r);};

{
 const r=runAt(5,2),b=r.world.boss,[a,p]=[...r.players.values()];r.world.switches.forEach(s=>s.active=true);
 a.x=b.x+200;p.x=b.x+250;a.y=318;p.y=158;a.invulnerability=p.invulnerability=9999;
 tick(r);const id=b.targetId;tick(r,500);assert.equal(b.targetId,id,'boss holds a readable target across floors instead of cycling away');
 killPlayer(r,r.players.get(id),'target departure fixture',true);tick(r);assert.notEqual(b.targetId,id);assert.ok(r.players.get(b.targetId).alive);
 console.log('FOLLOWUP PASS: Warden focus stays stable between floors and transfers when its target is lost.');
}

{
 const w=buildLevel(1),facade=w.facades[0],l=w.ladders.find(l=>l.x>facade.x&&l.x<facade.x+20),p=createPlayer('p',facade.x-20,w.floorY-22);w.crates=[];
 for(let i=0;i<22;i++)stepPlayer(p,{right:true},w);
 assert.ok(p.x>facade.x,'can walk in front of the building to its ladder');
 const ground=p.y;stepPlayer(p,{up:true},w);assert.equal(p.climbing,l.id);assert.ok(p.y<ground);
 for(let i=0;i<20;i++)stepPlayer(p,{up:true},w);const held=p.y;
 for(let i=0;i<40;i++)stepPlayer(p,{},w);assert.equal(p.y,held,'releasing W holds position');
 for(let i=0;i<10;i++)stepPlayer(p,{down:true},w);assert.ok(p.y>held,'S descends');
 for(let i=0;i<150;i++)stepPlayer(p,{up:true},w);assert.equal(p.y,l.y-p.h);
 const top=p.y;for(let i=0;i<10;i++)stepPlayer(p,{right:true},w);assert.equal(p.y,top,'roof is a real supporting surface');
 console.log('FOLLOWUP PASS: walkable facade, manual W/S, release hold and supporting roof.');
}
{
 const w=buildLevel(10),trunks=w.platforms.filter(s=>s.kind==='maze-tree');w.crates=[];
 for(const tree of trunks){
  const l=w.ladders.find(l=>l.x===tree.x-18),p=createPlayer('p',l.x,w.floorY-22);
  for(let i=0;i<25;i++)stepPlayer(p,{up:true},w);
  for(let i=0;i<80;i++)stepPlayer(p,{right:true},w);
  assert.ok(p.x+p.w<=tree.x+.01,'partial climb/drop cannot pass through trunk');assert.ok(!overlaps(p,tree));
 }
 const p=createPlayer('next',100,78),fixture={...w,width:1000,floors:[],platforms:[],ladders:[{id:'old',x:100,y:100,w:12,h:100},{id:'next',x:112,y:20,w:12,h:140}]};p.onGround=true;
 stepPlayer(p,{up:true},fixture);assert.equal(p.climbing,'next','finished ladder never steals W from next floor');
 console.log('FOLLOWUP PASS: all nine solid maze trunks reject ladder clipping; overlapping ladder endpoints select upward route.');
}
{
 for(const count of [1,2,3,4]){
  const r=runAt(5,count),p=r.players.get('p0'),cap=r.heartMax;r.world.enemies=[];r.world.giant.wakeTicks=99999;
  for(const cp of r.world.checkpoints){p.x=cp.x;p.y=cp.y+cp.h-p.h;tick(r);assert.equal(r.hearts,cap);assert.equal(r.heartMax,cap);}
 }
 const r=runAt(),p=r.players.get('p0'),l=r.world.ladders[0];p.x=l.x;p.y=l.y+l.h-p.h;interactRun(r,p.id);assert.equal(p.climbing,null,'E no longer starts automatic climbing');
 console.log('FOLLOWUP PASS: flags never raise original heart cap; solo stays at three; E does not climb.');
}
{
 for(const count of [1,2,3,4]){
  const r=runAt(1,count),p=r.players.get('p0');r.world.enemies=[];r.world.giant.wakeTicks=0;r.world.giant.x=p.x;
  for(const q of r.players.values())if(q!==p){q.x=210+q.slot*18;q.y=r.world.floorY-q.h;}
  const hearts=r.hearts;tick(r);
  if(count<=2){assert.equal(r.hearts,0);assert.equal(r.phase,'gameover');assert.ok([...r.players.values()].every(p=>!p.alive));}
  else {assert.equal(r.hearts,hearts-1);assert.equal(p.alive,false);tick(r,90);assert.equal(p.alive,true);assert.ok(p.x>r.world.giant.x+44);assert.equal(r.hearts,hearts-1);}
 }
 console.log('FOLLOWUP PASS: giant ends solo/two-survivor runs; 3+/4-player rescue spends one heart and returns safely.');
}
{
 const r=runAt(10,2),w=r.world,b=w.boss,[a,p]=[...r.players.values()];w.switches.forEach(s=>s.active=true);b.phase='active';b.bodyX=b.x-100;
 a.x=b.tree.x+b.tree.w+12;p.x=b.tree.x+40;a.y=p.y=w.floorY-a.h;
 tick(r);assert.equal(b.tree.phase,'warning','tree triggers immediately even when boss is far away');const before=b.bodyX;tick(r,10);assert.ok(b.bodyX-before>100,'boss visibly rushes to the finale');
 tick(r,60);assert.equal(b.solved,true);assert.ok(r.deathEvents.some(e=>e.playerId===p.id&&e.cause==='Falling tree'));assert.equal(a.alive,true);
 console.log('FOLLOWUP PASS: crossing triggers immediate tree finale; fast boss arrival, lethal tree and safe leading survivor.');
}

{
 const r=runAt(1,2);r.hearts=1;r.world.enemies=[];r.world.giant.wakeTicks=0;r.world.giant.x=30;tick(r);
 assert.equal(r.phase,'gameover');assert.ok([...r.players.values()].every(p=>!p.alive));assert.equal(r.deathEvents.length,2);
 const group=runAt(1,3);group.world.enemies=[];group.world.giant.wakeTicks=0;group.world.giant.x=40;
 for(const p of group.players.values())p.x=35;tick(group);
 assert.equal(group.hearts,1,'simultaneous catches spend one per person using starting survivor count');
 assert.equal(group.phase,'playing');assert.equal(group.deathEvents.length,3);assert.ok([...group.players.values()].every(p=>p.alive));
 console.log('FOLLOWUP PASS: final-heart team defeat is atomic; simultaneous 3+ catches do not depend on player iteration order.');
}
