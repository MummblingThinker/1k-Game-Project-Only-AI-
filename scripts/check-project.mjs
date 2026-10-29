import assert from 'node:assert/strict';
import { CAMPAIGN, getLevel, regionForLevel } from '../public/js/campaign.js';
import { buildLevel, gapWidthForParty } from '../public/js/world.js';
import { createPlayer, stepPlayer } from '../public/js/physics.js';

assert.equal(CAMPAIGN.length, 15, 'campaign must have 15 levels');
assert.equal(getLevel(10).title, 'The Covered Way');
assert.equal(regionForLevel(1), 'city');
assert.equal(regionForLevel(6), 'forest');
assert.equal(regionForLevel(11), 'factory');
assert.equal(gapWidthForParty(1, 1), 46);
assert.ok(gapWidthForParty(5, 1) > gapWidthForParty(2, 1), 'teamwork gap should scale up with party size');
assert.ok(gapWidthForParty(14, 1) <= 180, 'pit width must remain capped');
const solo = buildLevel(1, 1);
const party = buildLevel(1, 4);
assert.equal(solo.id, 1);
assert.equal(solo.region, 'city');
assert.equal(solo.checkpoints.length, 1);
assert.ok(party.pits[1].w > solo.pits[1].w);
const largeParty = buildLevel(1, 14);
for (const pit of largeParty.pits) {
  const stones = largeParty.platforms.filter((platform) => platform.kind === 'stone' && platform.x + platform.w > pit.x && platform.x < pit.x + pit.w).sort((a,b)=>a.x-b.x);
  const points = [pit.x, ...stones.map((stone) => stone.x + stone.w/2), pit.x + pit.w];
  for (let i=1;i<points.length;i++) assert.ok(points[i]-points[i-1] <= 36, `solo fallback jump too wide in pit ${pit.index}`);
}
const player = createPlayer('test', 20, solo.floorY - 22);
stepPlayer(player, { right: true, jump: false }, solo, 1);
assert.ok(player.x > 20, 'right input should move the player');
const beforeJumpY = player.y;
stepPlayer(player, { right: false, jump: true }, solo, 1);
assert.ok(player.y <= beforeJumpY, 'jump should move player upward');
console.log('Project checks passed: campaign, region mapping, gap scaling, level construction, and movement physics.');

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

// Verify a real jump arc crosses every solo Level 1 gap from a readable approach.
for (const pit of solo.pits) {
  const jumper = createPlayer('gap-test', pit.x - 20, solo.floorY - 22);
  jumper.onGround = true;
  let landed = false;
  for (let tick = 0; tick < 65; tick++) {
    stepPlayer(jumper, { right: true, jump: tick === 0 }, solo, 1);
    assert.ok(jumper.y + jumper.h <= solo.floorY + 1, `fell into pit ${pit.index}`);
    if (tick > 0 && jumper.onGround && jumper.x >= pit.x + pit.w) { landed = true; break; }
  }
  assert.ok(landed, `pit ${pit.index} must allow a normal solo jump`);
}
const airborne = createPlayer('air-jump', 20, solo.floorY - 22);
airborne.onGround = true;
stepPlayer(airborne, { jump: true }, solo);
stepPlayer(airborne, { jump: false }, solo);
const risingSpeed = airborne.vy;
stepPlayer(airborne, { jump: true }, solo);
assert.ok(airborne.vy > risingSpeed, 'a second press in the air must not reset jump velocity');
console.log('Level 1 jump checks passed: every solo pit crosses safely and air-jumps are rejected.');
