import assert from 'node:assert/strict';
import {startLevel,stepRun,interactRun} from '../public/js/simulation.js';
import {driveRevision} from './revision-driver.mjs';
const results=[];
for(let level=1;level<=15;level++){
 const r={players:new Map([['p0',{id:'p0',slot:0}]])};startLevel(r,level,true);const p=r.players.get('p0');
 let lastX=p.x,stuck=0;const memo={};
 for(let t=0;t<24000&&r.phase==='playing';t++){
   const c=driveRevision(r,p,memo);p.input=c.input;if(c.action)interactRun(r,p.id,c.action);stepRun(r);
   if(Math.abs(p.x-lastX)<.01&&!p.climbing)stuck++;else stuck=0;lastX=p.x;
   if(stuck>600)break;
   if(process.env.APPROACH_ONLY&&r.world.boss&&p.x>=r.world.boss.x)break;
 }
 const result={level,phase:r.phase,tick:r.tick,x:Math.round(p.x),y:Math.round(p.y),hearts:r.hearts,deaths:r.deathEvents.map(e=>e.cause),boss:r.world.boss&&{phase:r.world.boss.phase,hp:r.world.boss.hp,cycle:r.world.boss.cycle},stuck};
 results.push(result);console.log(JSON.stringify(result));
}
if(process.env.STRICT_ROUTES)assert.ok(results.every(r=>r.phase==='victory'),'Every real-input route must finish');
