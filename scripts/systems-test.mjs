import assert from 'node:assert/strict';
import { createPlayer } from '../public/js/physics.js';
import { startLevel, stepRun, interactRun, killPlayer, releaseParticipant, safeFromOrdinary } from '../public/js/simulation.js';
const runAt = (level = 2, count = 2) => {
  const run = { players: new Map(Array.from({ length: count }, (_, slot) => [`p${slot}`, { ...createPlayer(`p${slot}`), slot }])) };
  startLevel(run, level, true); return run;
};
const check = (label, fn) => { fn(); console.log('Systems PASS: ' + label); };
check('capture expiry spends once and a real jump rescue releases without killing robot', () => {
  const r = runAt(), [a, b] = [...r.players.values()], e = r.world.enemies.find(e => e.kind === 'grabber');
  e.x = e.minX = e.maxX = 920;
  a.x = 920; b.x = 1000; stepRun(r);
  assert.ok(a.capture); assert.equal(e.grabbedId, a.id);
  b.x = e.x; b.y = e.y - b.h - 3; b.vy = 2;
  stepRun(r); assert.equal(a.capture, null); assert.equal(e.grabbedId, null); assert.ok(e.stunned > 0);
  assert.ok(a.alive); assert.ok(!e.dead);
  for (let i = 0; i < 160; i++) { a.x = 850; b.x = 1050; stepRun(r); }
  a.invulnerability = 0; a.x = e.x; a.y = 129; stepRun(r); assert.ok(a.capture);
  a.capture.remaining = .001; const hearts = r.hearts;
  stepRun(r); assert.equal(a.alive, false); assert.equal(r.hearts, hearts - 1);
  for (let i = 0; i < 20; i++) stepRun(r);
  assert.equal(r.hearts, hearts - 1);
});
check('ordinary jump contact does not stun; disconnect clears grab ownership', () => {
  const r = runAt(), [a, b] = [...r.players.values()], e = r.world.enemies.find(e => e.kind === 'grabber');
  b.x = e.x; b.y = e.y - b.h - 3; b.vy = 2; a.x = 600;
  stepRun(r); assert.equal(e.stunned, 0);
  e.grabbedId = a.id; a.capture = { remaining: 2, struggle: 0 };
  releaseParticipant(r, a); assert.equal(e.grabbedId, null); assert.equal(a.capture, null);
});
check('struggle extension is capped, not an infinite escape', () => {
  const r = runAt(), [a, b] = [...r.players.values()], e = r.world.enemies.find(e => e.kind === 'grabber');
  a.x = e.x; b.x = e.x + 100; stepRun(r); assert.ok(a.capture);
  const before = a.capture.remaining;
  for (let i = 0; i < 60; i++) { a.input = { left: i % 2 === 0, right: i % 2 === 1 }; stepRun(r); }
  assert.equal(a.capture.struggle, 4); assert.ok(a.capture.remaining < before);
});
check('safe shelter blocks ordinary attacks; giant still breaches and kills instantly', () => {
  const r = runAt(), [a, b] = [...r.players.values()], cp = r.world.checkpoints[0];
  a.x = cp.x + 6; b.x = cp.x + 20;
  assert.ok(safeFromOrdinary(r.world, a));
  r.world.enemies = [{ id: 'blast', kind: 'creeper', x: cp.x, y: 123, w: 20, h: 28, minX: cp.x, maxX: cp.x, dir: 1, speed: 0, phase: 'attack', timer: 10, targetX: cp.x, stunned: 0 }];
  stepRun(r); assert.ok(a.alive && b.alive);
  a.invulnerability = 90; r.world.giant.x = a.x - 35;
  stepRun(r); assert.ok(cp.destroyed); assert.equal(a.alive, false);
});
check('blast affects each player once, never a negative heart pool', () => {
  const r = runAt(2, 4), all = [...r.players.values()];
  for (const [i, p] of all.entries()) { p.x = 1000 + i * 6; p.y = 129; }
  r.world.enemies = [{ id: 'blast', kind: 'creeper', x: 1000, y: 123, w: 20, h: 28, minX: 1000, maxX: 1000, dir: 1, speed: 0, phase: 'attack', timer: 10, targetX: 1000, stunned: 0 }];
  stepRun(r); assert.equal(r.hearts, 1); assert.equal(r.deathEvents.length, 4);
  stepRun(r); assert.equal(r.hearts, 1);
  r.hearts = 1; const p = all[0]; p.invulnerability = 0; killPlayer(r, p, 'last heart');
  assert.equal(r.hearts, 0); assert.equal(r.phase, 'gameover');
  killPlayer(r, p, 'duplicate'); assert.equal(r.hearts, 0);
});
check('checkpoints provide exactly one benefit once; full-cap recovery cannot bank hearts', () => {
  const r = runAt(5, 4), [a, b, c] = [...r.players.values()];
  killPlayer(r, a, 'pit'); r.tick++; killPlayer(r, b, 'pit');
  const cp = r.world.checkpoints[0], before = r.hearts;
  c.x = cp.x - c.w - 1; c.input = { right: true }; stepRun(r);
  assert.ok(a.alive); assert.equal(b.alive, false); assert.equal(r.hearts, before);
  c.x = cp.x - c.w - 1; stepRun(r); assert.equal(b.alive, false); assert.equal(r.hearts, before);
  const r2 = runAt(2); const p = r2.players.get('p0'), cp2 = r2.world.checkpoints[0];
  p.x = cp2.x - p.w - 1; p.input = { right: true }; stepRun(r2); assert.equal(r2.hearts, r2.heartMax);
});
check('boss order, stun window, survival requirement and background core cycles gate exits', () => {
  const r = runAt(5, 1), p = r.players.get('p0'), boss = r.world.boss;
  p.x = boss.pylons[0].x; boss.phase = 'exposed'; boss.timer = 300;
  interactRun(r, p.id); assert.equal(boss.activeRelay, 0);
  r.tick += 12; p.x = boss.pylons[1].x; interactRun(r, p.id); assert.equal(boss.activeRelay, 1); assert.equal(boss.phase, 'stunned');
  const r10 = runAt(10, 1), b10 = r10.world.boss; r10.players.get('p0').x = b10.x + 20;
  b10.pylons.forEach(s => { s.active = true; }); b10.activeRelay = 3;
  stepRun(r10); assert.equal(b10.solved, false); b10.elapsed = 2700; stepRun(r10); assert.ok(b10.solved);
  const r15 = runAt(15, 1), b15 = r15.world.boss, p15 = r15.players.get('p0');
  p15.x = b15.x + 310; b15.phase = 'stunned'; b15.timer = 400; b15.pylons.forEach(s => { s.active = true; });
  interactRun(r15, p15.id); assert.equal(b15.cycle, 1); assert.equal(b15.solved, false);
});
console.log('Shared systems regression complete.');
