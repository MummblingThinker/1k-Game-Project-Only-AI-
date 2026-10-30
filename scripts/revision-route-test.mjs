import assert from 'node:assert/strict';
import {startLevel,stepRun,interactRun} from '../public/js/simulation.js';
import {driveRevision} from './revision-driver.mjs';
const results=[];const party=Number(process.env.TEST_PARTY||1);
for(let level=1;level<=15;level++){
 const r={players:new Map(Array.from({length:party},(_,slot)=>['p'+slot,{id:'p'+slot,slot}]))};startLevel(r,level,true);const p=r.players.get('p0');
 let lastX=p.x,stuck=0;const memos=Array.from({length:party},()=>({}));
 for(let t=0;t<24000&&r.phase==='playing';t++){
   for(const q of r.players.values()){const c=driveRevision(r,q,memos[q.slot]);q.input=c.input;if(c.action)interactRun(r,q.id,c.action);}stepRun(r);
   if(p.alive&&Math.abs(p.x-lastX)<.01&&!p.climbing)stuck++;else stuck=0;lastX=p.x;
   if(stuck>1800)break;
   if(process.env.APPROACH_ONLY&&r.world.boss&&p.x>=r.world.boss.x)break;
 }
 const result={level,phase:r.phase,tick:r.tick,x:Math.round(p.x),y:Math.round(p.y),hearts:r.hearts,deaths:r.deathEvents.map(e=>e.cause),boss:r.world.boss&&{phase:r.world.boss.phase,hp:r.world.boss.hp,cycle:r.world.boss.cycle},stuck};
 results.push(result);console.log(JSON.stringify(result));
}
if(!process.env.DIAGNOSTIC_ROUTES&&!process.env.APPROACH_ONLY)assert.ok(results.every(r=>r.phase==='victory'),'Every real-input route must finish');
