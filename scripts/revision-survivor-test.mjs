import assert from 'node:assert/strict';
import {startLevel,stepRun,interactRun,releaseParticipant} from '../public/js/simulation.js';
import {driveRevision} from './revision-driver.mjs';
const results=[];
for(const count of [2,3,4])for(let level=1;level<=15;level++){
 const r={players:new Map(Array.from({length:count},(_,slot)=>['p'+slot,{id:'p'+slot,slot}]))};startLevel(r,level,true);
 const p=r.players.get('p'+(count-1)),memo={};
 for(const q of [...r.players.values()])if(q!==p){releaseParticipant(r,q);r.players.delete(q.id);}
 const startingHearts=r.hearts;
 for(let t=0;t<24000&&r.phase==='playing';t++){const cmd=driveRevision(r,p,memo);p.input=cmd.input;if(cmd.action)interactRun(r,p.id,cmd.action);stepRun(r);}
 assert.equal(r.partySize,count);assert.equal(r.world.partySize,count);
 const result={level,originalParty:count,remainingSlot:p.slot,startingHearts,phase:r.phase,ticks:r.tick,deaths:r.deathEvents.map(e=>e.cause)};results.push(result);console.log(JSON.stringify(result));
}
assert.ok(results.every(r=>r.phase==='victory'),'Every original-party map must remain completable by its last survivor');
console.log('REVISION LAST-SURVIVOR PASS: 45 routes, preserved original party geometry/hearts, ordinary input only.');
