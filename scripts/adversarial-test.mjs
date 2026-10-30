import assert from 'node:assert/strict';
import { startLevel, stepRun, interactRun, releaseParticipant } from '../public/js/simulation.js';

const makeRun = (level, count = 4) => {
  const r = { players: new Map(Array.from({ length: count }, (_, slot) => ['p' + slot, { id: 'p' + slot, slot }])) };
  startLevel(r, level, true); return r;
};
for (const count of [2, 3, 4]) {
  const r = makeRun(2, count), all = [...r.players.values()];
  r.world.enemies = []; r.world.giant.speed = 0;
  all.forEach((p, i) => { p.x = 100; p.y = 151 - (i + 1) * p.h; });
  for (let tick = 0; tick < 120; tick++) stepRun(r);
  all.forEach((p, i) => { assert.equal(p.y, 151 - (i + 1) * p.h, 'stable stack ' + count); assert.ok(p.onGround); });
  const top = all.at(-1); top.input = { right: true, jump: true };
  for (let tick = 0; tick < 80; tick++) stepRun(r);
  assert.ok(top.x > 180 && top.alive, 'top player separates and lands');
  assert.ok(all.every(p => Number.isFinite(p.y)));
}
console.log('Adversarial PASS: stable 2/3/4-player stacks and clean jump separation.');

const seedCount=Number(process.env.ADVERSARIAL_SEEDS||120),tickLimit=Number(process.env.ADVERSARIAL_TICKS||1800);
assert.ok(Number.isInteger(seedCount)&&seedCount>=1&&seedCount<=8000);
assert.ok(Number.isInteger(tickLimit)&&tickLimit>=1&&tickLimit<=14400);
let simulatedTicks = 0;
for (let seed = 1; seed <= seedCount; seed++) {
  let randomState = seed;
  const random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
  const level = 1 + seed % 15, r = makeRun(level);
  const initialEnemyIds = r.world.enemies.map(e => e.id);
  // Scenario setup samples real floor/shelter/enemy/arena locations. After setup,
  // only input/actions and one explicit disconnect affect participants.
  const candidates = [100, ...r.world.enemies.map(e => e.x - 25), ...r.world.checkpoints.map(c => c.x + 5)];
  if (r.world.boss) {
    candidates.push(r.world.boss.x + 40);
    r.world.switches.forEach(s => { s.active = true; });
  }
  const x = candidates[seed % candidates.length];
  for (const [index, p] of [...r.players.values()].entries()) p.x = x + index * 14;
  const check = () => {
    assert.ok(r.hearts >= 0 && r.hearts <= r.heartMax, 'heart bounds');
    assert.equal(r.partySize, 4, 'original party survives departure');
    assert.deepEqual(r.world.enemies.map(e => e.id), initialEnemyIds, 'robots are not destroyed');
    const carried = new Set();
    for (const p of r.players.values()) {
      for (const n of ['x', 'y', 'vx', 'vy']) assert.ok(Number.isFinite(p[n]), 'finite player ' + n);
      if (p.carryId) {
        assert.ok(p.alive && !p.carriedBy && !p.capture, 'valid carrier');
        assert.ok(!carried.has(p.carryId), 'one carrier per object'); carried.add(p.carryId);
        const object = r.players.get(p.carryId) || r.world.crates.find(c => c.id === p.carryId);
        assert.equal(object?.carriedBy, p.id, 'symmetric carry owner');
      }
      if (p.carriedBy) assert.equal(r.players.get(p.carriedBy)?.carryId, p.id, 'no orphan passenger');
      if (p.capture) {
        const e = r.world.enemies.find(e => e.id === p.capture.enemyId);
        assert.equal(e?.grabbedId, p.id, 'symmetric capture owner');
        assert.ok(p.alive && !p.carriedBy, 'captured player alive and not carried');
        assert.ok(p.capture.struggle <= 4, 'bounded struggle');
      }
    }
    for (const c of r.world.crates) {
      assert.ok(Number.isFinite(c.x) && Number.isFinite(c.y), 'finite crate');
      if (c.carriedBy) assert.equal(r.players.get(c.carriedBy)?.carryId, c.id, 'no orphan crate');
    }
    for (const e of r.world.enemies) if (e.grabbedId) assert.equal(r.players.get(e.grabbedId)?.capture?.enemyId, e.id, 'no orphan grab');
    assert.equal(new Set(r.deathEvents.map(e => e.id)).size, r.deathEvents.length, 'unique fatal events');
  };
  try {
    for (let tick = 0; tick < tickLimit && r.phase === 'playing'; tick++) {
      for (const p of r.players.values()) {
        if (tick % 18 === 0) {
          const direction = random();
          p.input = { left: direction < .28, right: direction > .4, jump: random() < .42 };
        }
        if (random() < .025) interactRun(r, p.id, ['use', 'carry', 'drop'][Math.floor(random() * 3)]);
      }
      if (tick === 600) {
        const p = r.players.get('p3'); releaseParticipant(r, p); r.players.delete(p.id);
      }
      stepRun(r); check(); simulatedTicks++;
    }
  } catch (error) { error.message = 'seed=' + seed + ' level=' + level + ' tick=' + r.tick + ': ' + error.message; throw error; }
}
console.log('Adversarial PASS: '+seedCount+' seeded input/action/disconnect scenarios, ' + simulatedTicks + ' ticks; carry/capture ownership, finite physics, heart bounds, indestructible robots and fatal-event uniqueness.');
