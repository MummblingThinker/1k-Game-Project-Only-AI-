import assert from 'node:assert/strict';
import { startLevel, stepRun, interactRun, releaseParticipant } from '../public/js/simulation.js';
import { routeIntent } from './route-driver.mjs';

// Construct the original co-op geometry, then disconnect everyone except the
// last slot. Never shrink gaps, remove hazards, teleport, or refill hearts.
for(const count of [2,3,4])for(let level=1;level<=15;level++){
  const run={players:new Map(Array.from({length:count},(_,slot)=>['p'+slot,{id:'p'+slot,slot}]))};
  startLevel(run,level,true);
  const originalGaps=run.world.pits.map(p=>[p.x,p.w]);
  const survivor=run.players.get('p'+(count-1));
  for(const p of [...run.players.values()])if(p!==survivor){releaseParticipant(run,p);run.players.delete(p.id);}
  for(let tick=0;tick<24000&&run.phase==='playing';tick++){
    const command=routeIntent({...run,you:survivor,players:[...run.players.values()]});
    survivor.input=command.input;
    if(command.interact&&tick%13===0)interactRun(run,survivor.id);
    stepRun(run);
  }
  assert.equal(run.partySize,count);
  assert.deepEqual(run.world.pits.map(p=>[p.x,p.w]),originalGaps);
  assert.equal(run.phase,'victory',JSON.stringify({level,count,phase:run.phase,hearts:run.hearts,x:survivor.x,y:survivor.y,boss:run.world.boss,notice:run.notice}));
  console.log('Last survivor PASS:',JSON.stringify({level,originalParty:count,seconds:Math.round(run.tick/60),hearts:run.hearts}));
}
console.log('Last survivor PASS: 45 unchanged co-op maps completed with one connected survivor.');
