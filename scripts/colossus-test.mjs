import assert from 'node:assert/strict';
import {startLevel,stepRun,interactRun} from '../public/js/simulation.js';
import {driveRevision} from './revision-driver.mjs';
const setup=(count=1)=>{const r={players:new Map(Array.from({length:count},(_,slot)=>['p'+slot,{id:'p'+slot,slot}]))};startLevel(r,15,true);return r;};
const tick=(r,n=1)=>{for(let i=0;i<n;i++)stepRun(r);};
{
 const r=setup(),w=r.world,b=w.boss,p=r.players.get('p0');w.switches.forEach(s=>s.active=true);w.enemies=[];p.x=b.x+270;p.invulnerability=99999;
 let weapons=[],last='';
 for(let t=0;t<1400&&b.attack!=='exposed';t++){
  if(b.attack==='head-warning')p.x=b.x+600;
  tick(r);
  if(b.attack==='strike'&&last!=='strike')weapons.push(b.weapon);last=b.attack;
 }
 assert.deepEqual(weapons,['low','high','slam']);assert.equal(b.attack,'exposed');assert.ok(p.alive);
 const c=w.crates[0];Object.assign(c,{used:false,carriedBy:null,x:b.head.x+10,y:b.head.y+10,vx:3,vy:0,flightTicks:30});tick(r);
 assert.equal(b.hp,2);assert.equal(b.attack,'retreat');
 Object.assign(c,{used:false,x:b.head.x+10,y:b.head.y+10,vx:3,flightTicks:30});tick(r);assert.equal(b.hp,2,'one hit per tired opening');
 b.attack='exposed';b.attackTimer=300;p.x=b.head.x+8;p.y=b.head.y-p.h-1;p.vy=2;p.onGround=false;p.input={};
 // Put the weak head in the clear central floor lane for a falling stomp fixture.
 b.head.x=b.x+245;p.x=b.head.x+8;tick(r);assert.equal(b.hp,1);assert.ok(p.vy<0,'stomp bounces off weak head');
 b.attack='exposed';b.attackTimer=300;Object.assign(c,{used:false,carriedBy:null,x:b.head.x+10,y:b.head.y+10,vx:3,vy:0,flightTicks:30});tick(r);
 assert.equal(b.hp,0);assert.ok(b.solved);assert.equal(w.finish.locked,false);
}
console.log('COLOSSUS PASS: three attacks, exhausted head, thrown/stomp damage, one hit per window, exactly three hits unlock exit.');
for(const weapon of ['low','high','slam']){
 const r=setup(2),w=r.world,b=w.boss,[p,q]=[...r.players.values()];w.enemies=[];w.switches.forEach(s=>s.active=true);b.phase='active';b.attack='warning';b.weapon=weapon;b.attackTimer=2;b.attackX=b.x+270;
 p.x=b.x+265;q.x=b.x+580;p.y=weapon==='high'?w.floorY-77:w.floorY-p.h;q.y=w.floorY-q.h;
 if(weapon==='high'){p.climbing=w.ladders.find(l=>l.x===b.x+340).id;p.x=b.x+340;}
 if(weapon==='low'){q.y=w.floorY-130;q.invulnerability=999;}
 tick(r);assert.ok(p.alive);tick(r);assert.ok(!p.alive,weapon+' strike deals damage');assert.ok(q.alive);
}
console.log('COLOSSUS PASS: each arm marker is harmless until strike; safe positions survive.');
for(const hearts of [1,2]){
 const r=setup(),w=r.world,b=w.boss,p=r.players.get('p0');w.enemies=[];w.switches.forEach(s=>s.active=true);r.hearts=hearts;b.phase='active';b.attack='head-warning';b.attackTimer=1;b.head={x:b.x+250,y:w.floorY-42,w:64,h:42};p.x=b.x+270;p.y=w.floorY-p.h;p.invulnerability=999;
 tick(r);assert.equal(r.hearts,hearts-1);assert.equal(r.deathEvents.at(-1).cause,'Falling Colossus head');assert.equal(r.phase,hearts===1?'gameover':'playing');
}
console.log('COLOSSUS PASS: head landing crushes even shielded player and respects remaining hearts.');
for(const party of [1,2,4]){
 const r=setup(party),memos=Array.from({length:party},()=>({}));
 for(let t=0;t<24000&&r.phase==='playing';t++){
  for(const p of r.players.values()){const c=driveRevision(r,p,memos[p.slot]);p.input=c.input;if(c.action)interactRun(r,p.id,c.action);}stepRun(r);
 }
 console.log('COLOSSUS ROUTE',JSON.stringify({party,phase:r.phase,ticks:r.tick,hp:r.world.boss.hp,deaths:r.deathEvents.map(e=>e.cause)}));
 assert.equal(r.phase,'victory','full level and final boss use ordinary inputs');
}

// Both legal arena boundaries must respect the sweep, while elevation remains safe.
for(const offset of [0,1,7,8,20,628]){
 const r=setup(),w=r.world,b=w.boss,p=r.players.get('p0');w.enemies=[];w.switches.forEach(s=>s.active=true);
 b.phase='active';b.attack='strike';b.weapon='low';b.attackTimer=18;p.x=b.x+offset;p.y=w.floorY-p.h;p.invulnerability=0;
 tick(r);assert.equal(r.hearts,2,'low sweep covers arena edge '+offset);assert.equal(r.deathEvents.at(-1).cause,'Colossus low arm');
}
console.log('COLOSSUS PASS: no idle-safe strip at either arena boundary; jumping/climbing remains the escape.');
