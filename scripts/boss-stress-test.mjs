import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {buildLevel} from '../public/js/world.js';
import {startLevel,stepRun,interactRun,killPlayer,releaseParticipant} from '../public/js/simulation.js';
import {driveRevision} from './revision-driver.mjs';
const setup=(level,party=1,seed=1)=>{const r={players:new Map(Array.from({length:party},(_,slot)=>['p'+slot,{id:'p'+slot,slot}]))};startLevel(r,level,true);r.world=buildLevel(level,party,seed);return r;};
const tick=(r,n=1)=>{for(let i=0;i<n;i++)stepRun(r);};
const arena=r=>{const w=r.world,b=w.boss;w.enemies=[];w.switches.forEach(s=>s.active=true);b.phase='active';for(const [i,p] of [...r.players.values()].entries()){p.x=b.x+200+i*70;p.y=w.floorY-p.h;}return b;};

// A missed opening must recover; simultaneous hits cannot bypass a cycle.
{
 const r=setup(15,4),b=arena(r);b.attack='exposed';b.attackTimer=1;b.head={x:b.x+450,y:r.world.floorY-42,w:64,h:42};
 tick(r);assert.equal(b.attack,'retreat');assert.equal(b.hp,3);tick(r,90);assert.equal(b.attack,'rest');assert.equal(b.roundAttacks,0);assert.equal(b.head,null);
 b.attack='exposed';b.attackTimer=300;b.head={x:b.x+450,y:r.world.floorY-42,w:64,h:42};
 for(const c of r.world.crates.slice(0,4))Object.assign(c,{x:b.head.x+4,y:b.head.y+5,vx:3,vy:0,flightTicks:30,used:false,carriedBy:null});
 tick(r);assert.equal(b.hp,2,'four simultaneous projectiles cause one hit');assert.equal(b.attack,'retreat');
 console.log('BOSS EDGE PASS: missed core resets, simultaneous projectiles cannot skip attack cycles.');
}
// Losing every player should fully reset hazards and preserve earned approach relays.
for(const level of [5,10,15]){
 const r=setup(level,2,0xfedcba98),b=arena(r);b.hp=1;
 for(const p of r.players.values())killPlayer(r,p,'wipe fixture',true);
 tick(r);assert.equal(r.phase,'playing');assert.ok([...r.players.values()].every(p=>p.alive));assert.equal(r.hearts,2);
 assert.equal(r.world.boss.phase,'waiting');assert.equal(r.world.boss.hp,r.world.boss.maxHp);
 assert.equal(r.world.seed,0xfedcba98);assert.ok(r.world.switches.every(s=>s.active));assert.ok(!r.world.enemies.some(e=>e.arena));
 assert.ok(!r.world.crates.some(c=>c.carriedBy));assert.ok(r.world.finish.locked);
}
console.log('BOSS EDGE PASS: all three encounter wipes reset hazards without resetting relays or seed.');
// A target can leave midway through an attack; remaining players retain a valid encounter.
for(const level of [5,15]){
 const r=setup(level,3),b=arena(r),p=r.players.get('p0');b.targetId=p.id;
 b.attack=level===5?'claw-warning':'head-warning';b.attackTimer=40;b.head={x:b.x+180,y:r.world.floorY-42,w:64,h:42};
 b.attackX=p.x;b.attackY=p.y;
 releaseParticipant(r,p);r.players.delete(p.id);
 for(const q of r.players.values()){q.x=b.x+580;q.invulnerability=1000;}
 tick(r,80);assert.equal(r.phase,'playing');assert.ok([...r.players.values()].every(q=>q.alive));
 if(level===5)assert.ok(r.players.has(b.targetId));assert.ok(Number.isFinite(b.bodyX)&&Number.isFinite(b.bodyY));
}
console.log('BOSS EDGE PASS: departure during marked attack keeps valid targets and finite geometry.');

// Reproducible broad seed sweep, using only ordinary movement/interact commands.
const count=Number(process.env.BOSS_SEEDS||64),results=[];let seed=0x6d2b79f5;
for(let i=0;i<count;i++){
 seed=(Math.imul(seed,1664525)+1013904223)>>>0;const party=i%4===0?4:i%4===1?2:1;
 const r=setup(5,party,seed),memo=Array.from({length:party},()=>({}));
 for(let t=0;t<24000&&r.phase==='playing';t++){
  for(const p of r.players.values()){const command=driveRevision(r,p,memo[p.slot]);p.input=command.input;if(command.action)interactRun(r,p.id,command.action);}stepRun(r);
 }
 const result={seed,party,phase:r.phase,ticks:r.tick,hp:r.world.boss.hp,hearts:r.hearts,deaths:r.deathEvents.map(e=>e.cause)};results.push(result);
 if(r.phase!=='victory')console.log('WARDEN STRESS FAILURE',JSON.stringify(result));
 if(i%16===15)console.log('Warden stress progress:',i+1,'/',count);
}
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/boss-stress.json',JSON.stringify(results,null,2));
assert.ok(results.every(r=>r.phase==='victory'),'every seeded ordinary-input Warden route must finish');
console.log('BOSS STRESS PASS:',count,'random-seed ordinary-input Warden routes at 1/2/4 players.');
