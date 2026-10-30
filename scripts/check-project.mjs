import assert from 'node:assert/strict';
import { CAMPAIGN, getLevel, regionForLevel } from '../public/js/campaign.js';
import { buildLevel, gapWidthForParty } from '../public/js/world.js';
import { createPlayer, stepPlayer } from '../public/js/physics.js';

assert.equal(CAMPAIGN.length, 15, 'campaign must have 15 levels');
assert.equal(getLevel(10).title, 'Chainsaw Hollow');
assert.equal(regionForLevel(1), 'city');
assert.equal(regionForLevel(6), 'forest');
assert.equal(regionForLevel(11), 'factory');
const solo = buildLevel(1, 1);
assert.equal(solo.region,'city');
assert.ok(solo.checkpoints.every(c=>c.kind==='flag'));
assert.ok(solo.pits.every(p=>p.w>=180));
const player = createPlayer('test', 20, solo.floorY - 22);
stepPlayer(player, { right: true, jump: false }, solo, 1);
assert.ok(player.x > 20, 'right input should move the player');
const beforeJumpY = player.y;
stepPlayer(player, { right: false, jump: true }, solo, 1);
assert.ok(player.y <= beforeJumpY, 'jump should move player upward');
console.log('Project checks passed: campaign, region mapping, flag/bridge construction, and movement physics.');

// The same elapsed input must produce the same movement and jump at different draw rates.
const { advanceSimulation } = await import('../public/js/timing.js');
const cadenceResults = [1, 5, 30, 60, 120].map((hz) => {
  const p = createPlayer('cadence', 20, solo.floorY - 22);
  p.onGround = true;
  const timer = { remaining: 0 };
  let ticks = 0;
  for (let frame = 0; frame < hz * 2; frame++) {
    advanceSimulation(timer, 1000 / hz, () => {
      stepPlayer(p, { right: true, jump: ticks >= 10 && ticks < 20 }, solo, 1);
      ticks++;
    });
  }
  assert.equal(ticks, 120, `wrong tick count at ${hz}Hz`);
  return [p.x, p.y, p.vx, p.vy];
});
for (const result of cadenceResults) assert.deepEqual(result, cadenceResults[0]);
const recoveryTimer = { remaining: 0 };
let recoveryTicks = 0;
advanceSimulation(recoveryTimer, 60000, () => recoveryTicks++);
assert.equal(recoveryTicks, 60, 'returning from a suspended tab must have bounded catch-up');
console.log('Fixed-step checks passed: matching movement/jump at 1/5/30/60/120Hz and bounded tab recovery.');
const { readProgress, saveProgress } = await import('../public/js/progress.js');
let saved = null;
const storage = { getItem: () => saved, setItem: (_key, value) => { saved = value; } };
assert.equal(readProgress(storage), null);
assert.equal(saveProgress(storage, 7), true); assert.equal(readProgress(storage).stage, 7);
for (const invalid of [0,16,2.5,'7',null,Infinity]) assert.equal(saveProgress(storage, invalid), false);
for (const bad of ['{', 'null', '{"version":2,"stage":7}', '{"version":1,"stage":99}']) { saved=bad; assert.equal(readProgress(storage),null); }
const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
assert.equal(readProgress(blocked),null); assert.equal(saveProgress(blocked,7),false);
console.log('Solo stage storage PASS: validated version/stage, corrupted and blocked storage are harmless.');
const {MEMORY_FRAGMENTS,readMemories,saveMemories}=await import('../public/js/memories.js');
assert.equal(Object.keys(MEMORY_FRAGMENTS).length,14);assert.equal(new Set(Object.values(MEMORY_FRAGMENTS)).size,14);
saved=null;assert.deepEqual(readMemories(storage),[]);
assert.equal(saveMemories(storage,[15,2,2,8]),true);assert.deepEqual(readMemories(storage),[2,8,15]);
for(const invalid of [[1],[16],['2'],[2.5],null,{}])assert.equal(saveMemories(storage,invalid),false);
for(const corrupt of ['{','null','{"version":2,"stages":[2]}','{"version":1,"stages":3}']){saved=corrupt;assert.deepEqual(readMemories(storage),[]);}
saved='{"version":1,"stages":[2,2,999,"3",4]}';assert.deepEqual(readMemories(storage),[2,4]);
assert.deepEqual(readMemories(blocked),[]);assert.equal(saveMemories(blocked,[2]),false);
console.log('Memory archive PASS: 14 distinct fragments, validated/deduplicated local progress and blocked storage.');

const airborne = createPlayer('air-jump', 20, solo.floorY - 22);
airborne.onGround = true;
stepPlayer(airborne, { jump: true }, solo);
stepPlayer(airborne, { jump: false }, solo);
const risingSpeed = airborne.vy;
stepPlayer(airborne, { jump: true }, solo);
assert.ok(airborne.vy > risingSpeed, 'a second press in the air must not reset jump velocity');
console.log('Jump check passed: air-jumps are rejected; required long-bridge crossings are tested by revision-test.mjs.');
