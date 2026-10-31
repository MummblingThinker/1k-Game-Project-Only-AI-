import assert from 'node:assert/strict';
import {startLevel,stepRun,interactRun} from '../public/js/simulation.js';
import {driveRevision} from './revision-driver.mjs';
// Real action cooldowns and different observation intervals. This reproduces
// the browser controller walking into a patrol while its throw was throttled.
let cases=0;
for(const delay of [0,6,12,18,24,30,45,60,90,120])for(const interval of [2,3,4,5,6]){
 const r={players:new Map([['p0',{id:'p0',slot:0}]])};startLevel(r,11,true);const p=r.players.get('p0'),memo={};let lastUse=-50;
 for(let t=0;t<4000&&r.phase==='playing'&&p.x<600;t++){
  if(t>=delay&&t%interval===0){const c=driveRevision(r,p,memo);p.input=c.input;if(c.action&&t-lastUse>=14){lastUse=t;interactRun(r,p.id,c.action);}}
  stepRun(r);
 }
 assert.ok(p.x>=600&&r.phase==='playing',JSON.stringify({delay,interval,phase:r.phase,x:p.x,deaths:r.deathEvents}));cases++;
}
console.log('GROUND CADENCE PASS:',cases,'ordinary-input Level 11 approaches with action cooldowns and varied observation/start timing.');
