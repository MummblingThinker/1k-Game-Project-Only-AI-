import assert from 'node:assert/strict';
import { buildLevel, REFERENCE_WIDTH, STANDARD_PURSUER_SPEED } from '../public/js/world.js';
import { createPlayer } from '../public/js/physics.js';
import { startLevel, stepRun, interactRun, killPlayer, releaseParticipant, heartMaximum } from '../public/js/simulation.js';

const runAt = (level, count = 1) => {
  const run = { players: new Map(Array.from({ length: count }, (_, slot) => [`p${slot}`, { ...createPlayer(`p${slot}`), slot }])) };
  startLevel(run, level, true);
  return run;
};
for (let party = 1; party <= 16; party++) assert.equal(heartMaximum(party), party === 1 ? 3 : Math.min(10, 3 + Math.ceil((party - 1) / 2)));
for (let id = 2; id <= 15; id++) for (let party = 1; party <= 4; party++) {
  const w = buildLevel(id, party), big = id % 5 === 0;
  assert.ok(big ? w.width / REFERENCE_WIDTH >= 5 && w.width / REFERENCE_WIDTH <= 7 : w.width === 3 * REFERENCE_WIDTH);
  assert.equal(w.checkpoints.length, big ? 2 : 1);
  assert.equal(w.giant.speed, STANDARD_PURSUER_SPEED);
  assert.ok(big ? w.giant.crossingSeconds > 210 : Math.abs(w.giant.crossingSeconds - 120) < 1e-9);
  for (const s of w.switches) assert.ok(w.floors.some(f => s.x >= f.x && s.x + s.w <= f.x + f.w), `relay ${id} must stand on floor`);
  for (const cp of w.checkpoints) assert.ok(w.floors.some(f => cp.x >= f.x && cp.x + cp.w <= f.x + f.w), `shelter ${id} needs ground exits`);
  assert.ok(w.floors.some(f => w.memory.x >= f.x && w.memory.x + 13 <= f.x + f.w), 'memory terminal has reachable floor ' + id);
  for (const block of w.platforms.filter(p => p.kind === 'breakable')) assert.ok(w.floors.some(f => block.x >= f.x && block.x + block.w <= f.x + f.w), 'salvage stands on floor ' + id);
  for (const pit of w.pits) {
    const stones = w.platforms.filter(p => p.pitIndex === pit.index).sort((a, b) => a.x - b.x);
    const points = [pit.x, ...stones.map(s => s.x + s.w / 2), pit.x + pit.w];
    for (let i = 1; i < points.length; i++) assert.ok(points[i] - points[i - 1] <= 52, `solo fallback ${id}/${party}/${pit.index}`);
  }
}

// Fixed-clock pursuit cannot warp towards a fast player and cannot enter any arena.
for (const level of [2, 5, 10, 15]) {
  const r = runAt(level), p = r.players.get('p0'); p.x = r.world.width - 100;
  r.world.giant.wakeTicks = 0;
  const x = r.world.giant.x; stepRun(r);
  assert.ok(Math.abs(r.world.giant.x - x - r.world.giant.speed) < 1e-8);
  if (r.world.boss) {
    r.world.giant.x = r.world.boss.x - 48;
    for (let i = 0; i < 500; i++) stepRun(r);
    assert.ok(r.world.giant.x + 44 < r.world.boss.x);
  }
}

// One death charge; exclusive oldest-dead revival; full-level reset.
{
  const r = runAt(2, 4), a = r.players.get('p0'), b = r.players.get('p1'), c = r.players.get('p2');
  r.tick = 10; assert.ok(killPlayer(r, a, 'pit')); assert.equal(killPlayer(r, a, 'duplicate'), false);
  r.tick = 20; killPlayer(r, b, 'capture'); assert.equal(r.hearts, 3);
  const cp = r.world.checkpoints[0]; c.x = cp.x - c.w - 1; c.input = { right: true };
  stepRun(r); assert.ok(a.alive); assert.equal(b.alive, false); assert.equal(r.hearts, 3);
  startLevel(r, 3); assert.equal(r.hearts, 5); assert.ok([...r.players.values()].every(p => p.alive));
}
// Carry has one owner, disconnect releases, and throws use server-calculated impulse.
{
  const r = runAt(2, 2), a = r.players.get('p0'), b = r.players.get('p1');
  assert.ok(interactRun(r, a.id, 'carry')); assert.equal(b.carriedBy, a.id);
  r.tick += 12; interactRun(r, a.id, 'use'); assert.equal(b.carriedBy, null); assert.equal(b.throwVx, 2.6);
  r.tick += 12; b.x = a.x + 12; b.y = a.y; b.throwTicks = 0;
  interactRun(r, a.id, 'carry'); releaseParticipant(r, a); assert.equal(b.carriedBy, null);
}
// Real input-only playthrough. Bots read the same public geometry/phase a player sees.
function drive(r, id = 'p0') {
  const p = r.players.get(id), w = r.world, b = w.boss;
  if (!p.alive || p.capture || p.carriedBy) return;
  if (r.tick < p.slot * 35) { p.input = {}; return; }
  let target = w.switches.find(s => !s.active)?.x ?? w.finish.x + 2;
  if (b && !b.solved && !w.switches.some(s => !s.active)) {
    if (p.x < b.x) target = b.x + 30;
    else if (b.kind === 'gatewarden') target = b.pylons[[1, 0, 2][b.activeRelay] ?? 2].x;
    else if (b.kind === 'background' && b.phase === 'stunned') target = b.x + 310;
    else target = b.pylons.find(s => !s.active)?.x ?? b.x + 190;
    if ((b.phase === 'warning' || b.phase === 'attack') && Math.abs(p.x - b.targetX) < 90) target = b.targetX + (p.x >= b.targetX && b.targetX < b.x + b.w - 110 ? 100 : -100);
  }
  const pit = w.pits.find(pit => p.x + p.w > pit.x - 8 && p.x < pit.x + pit.w && !w.platforms.some(s => s.kind === 'switch-bridge' && s.x === pit.x));
  const blockedLedge = [...w.platforms,...w.crates.filter(c=>!c.used&&!c.carriedBy)].some(s => p.y + p.h > s.y + 3 && (target > p.x ? s.x >= p.x + p.w - 1 && s.x < p.x + p.w + 4 : p.x >= s.x + s.w - 1 && p.x < s.x + s.w + 4));
  const rescue = w.enemies.find(e => e.grabbedId && e.grabbedId !== p.id);
  if (rescue) target = rescue.x + 4;
  const robot = w.enemies.some(e => e.kind === 'grabber' && !e.stunned && Math.abs(p.x - e.x) < 36);
  const jumpStrike = b && b.kind !== 'background' && ((b.phase === 'warning' && b.timer < 24) || b.phase === 'attack') && Math.abs(p.x - b.targetX) < 80;
  p.input = { right: p.x < target - 3, left: p.x > target + 5, jump: !!p.onGround && (!!pit || blockedLedge || robot || jumpStrike) };
  if (Math.abs(p.x - target) < 23 && r.tick % 13 === 0) interactRun(r, p.id);
}
for (const count of [1, 2, 3, 4]) for (let level = 1; level <= 15; level++) {
  if (process.env.TEST_LEVEL && level !== Number(process.env.TEST_LEVEL)) continue;
  if (process.env.TEST_PARTY && count !== Number(process.env.TEST_PARTY)) continue;
  const r = runAt(level, count);
  for (let tick = 0; tick < 24000 && r.phase === 'playing'; tick++) {
    for (const p of r.players.values()) drive(r, p.id);
    const beforeDeaths = r.deathEvents.length;
    stepRun(r);
    if (process.env.TRACE_CAMPAIGN && r.deathEvents.length > beforeDeaths) console.log(JSON.stringify({ tick:r.tick, deaths:r.deathEvents.slice(beforeDeaths), players:[...r.players.values()].map(p=>({id:p.id,x:p.x,y:p.y,alive:p.alive,input:p.input})), boss:r.world.boss }));
  }
  const p = r.players.get('p0');
  assert.equal(r.phase, 'victory', `Level ${level}: phase=${r.phase} x=${p.x.toFixed(1)} y=${p.y.toFixed(1)} hearts=${r.hearts} boss=${JSON.stringify(r.world.boss)} notice=${r.notice}`);
  console.log(`Campaign route PASS: ${level}, party=${count}, ${Math.round(r.tick / 60)}s, hearts=${r.hearts}, boss=${r.world.boss?.kind || 'none'}`);
}
console.log('Campaign PASS: sizes, safe fallback geometry, 120-second pursuer, boss exclusion, heart/revival/reset, carry/throw/disconnect and all 15 input-only solo routes.');
