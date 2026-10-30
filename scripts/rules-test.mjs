import assert from 'node:assert/strict';
import {heartMaximum,startLevel,killPlayer,stepRun} from '../public/js/simulation.js';
import {createPlayer} from '../public/js/physics.js';
import {gapWidthForParty,buildLevel} from '../public/js/world.js';
import {regionForLevel} from '../public/js/campaign.js';
const hearts=[3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,10];
hearts.forEach((expected,index)=>assert.equal(heartMaximum(index+1),expected,'heart boundary '+(index+1)));
const bands=[[1,46,34],[2,67,42],[3,67,42],[4,88,50],[5,88,50],[6,109,58],[7,109,58],[8,130,66],[9,130,66],[10,151,74],[11,151,74],[12,172,82],[13,172,82],[14,180,82],[16,180,82]];
for(const [party,special,normal] of bands){
  assert.equal(gapWidthForParty(party,1),special,'team gap boundary '+party);
  assert.equal(gapWidthForParty(party,0),normal,'normal gap boundary '+party);
}
for(const party of [1,2,3,4])assert.equal(buildLevel(1,party).pits[0].w,34,'first teaching jump stays modest');
for(const [level,region] of [[1,'city'],[5,'city'],[6,'forest'],[10,'forest'],[11,'factory'],[15,'factory']])assert.equal(regionForLevel(level),region);
for(const row of [{dead:0,missing:0,hearts:5,revived:0},{dead:0,missing:1,hearts:5,revived:0},{dead:1,missing:0,hearts:4,revived:1},{dead:3,missing:0,hearts:2,revived:1}]){
  const run={players:new Map(Array.from({length:4},(_,slot)=>['p'+slot,{...createPlayer('p'+slot),slot}]))};
  startLevel(run,2,true);
  for(let i=0;i<row.dead;i++){run.tick+=10;killPlayer(run,run.players.get('p'+i),'fixture pit');}
  run.hearts-=row.missing;
  const cp=run.world.checkpoints[0],last=run.players.get('p3');
  last.x=cp.x-last.w-1;last.input={right:true};stepRun(run);
  assert.equal(run.hearts,row.hearts,JSON.stringify(row));
  assert.equal([...run.players.values()].filter(p=>!p.alive).length,row.dead-row.revived);
  if(row.dead)assert.equal(run.players.get('p0').alive,true,'oldest death revives first');
  if(row.dead>1)assert.equal(run.players.get('p1').alive,false,'later death stays down');
  run.players.delete('p2');startLevel(run,3);
  assert.equal(run.hearts,5,'full reset uses original party size after departure');
  assert.ok([...run.players.values()].every(p=>p.alive));
}
console.log('Rules PASS: explicit heart/gap/region boundary tables, zero/one/multiple-dead checkpoint recovery, oldest-first and original-party stage reset.');
