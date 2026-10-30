import assert from 'node:assert/strict';
import { createPlayer, stepPlayer } from '../public/js/physics.js';
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
  assert.equal(r.world.platforms.some(p => p.shelterX === cp.x), false, 'breach removes roof and steps');
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
  r10.world.switches.forEach(s => { s.active = true; });
  b10.pylons.forEach(s => { s.active = true; }); b10.activeRelay = 3;
  stepRun(r10); assert.equal(b10.solved, false); b10.elapsed = 2700; stepRun(r10); assert.ok(b10.solved);
  const r15 = runAt(15, 1), b15 = r15.world.boss, p15 = r15.players.get('p0');
  p15.x = b15.x + 310; b15.phase = 'stunned'; b15.timer = 400; b15.pylons.forEach(s => { s.active = true; });
  interactRun(r15, p15.id); assert.equal(b15.cycle, 1); assert.equal(b15.solved, false);
});
check('drop/carry cannot use relays, and boss waits for the living party', () => {
  const r = runAt(15), [a, b] = [...r.players.values()], boss = r.world.boss;
  r.world.switches.forEach(s => { s.active = true; });
  a.x = boss.pylons[0].x;
  assert.equal(interactRun(r, a.id), false);
  assert.equal(boss.activeRelay, 0); assert.equal(boss.phase, 'waiting');
  r.tick += 12; assert.equal(interactRun(r, a.id, 'drop'), false);
  assert.equal(boss.activeRelay, 0);
  b.x = boss.x + 20; stepRun(r); assert.notEqual(boss.phase, 'waiting');
  r.tick += 12; interactRun(r, a.id, 'carry'); assert.equal(boss.activeRelay, 0);
  r.tick += 12; assert.equal(interactRun(r, a.id), true); assert.equal(boss.activeRelay, 1);
  const r2 = runAt(1), p = r2.players.get('p0'), crate = r2.world.crates[0];
  p.x = crate.x; assert.equal(interactRun(r2, p.id, 'drop'), false);
  assert.equal(p.carryId, null); assert.equal(crate.carriedBy, null);
});
check('jump struggle is edge-triggered and shares the four-extension cap', () => {
  const r = runAt(), [a, b] = [...r.players.values()], e = r.world.enemies.find(e => e.kind === 'grabber');
  a.x = e.x; b.x = e.x + 100; stepRun(r); assert.ok(a.capture);
  a.input = { jump: true };
  for (let i = 0; i < 10; i++) stepRun(r);
  assert.equal(a.capture.struggle, 1);
  for (let i = 0; i < 12; i++) { a.input = { jump: i % 2 === 1 }; stepRun(r); }
  assert.equal(a.capture.struggle, 4);
});
check('every expanded shelter has usable ground exits and a reachable roof', () => {
  for (let level = 2; level <= 15; level++) {
    const reference = runAt(level, 1);
    for (let index = 0; index < reference.world.checkpoints.length; index++) {
      for (const direction of [-1, 1]) {
        const r = runAt(level, 1), p = r.players.get('p0'), cp = r.world.checkpoints[index];
        r.world.enemies = []; r.world.giant.speed = 0;
        p.x = cp.x + 20; p.y = 129;
        let escaped = false;
        for (let i = 0; i < 140; i++) {
          p.input = { left: direction < 0, right: direction > 0, jump: p.onGround && !p.lastJump };
          stepRun(r);
          if (direction > 0 ? p.x > cp.x + cp.w + 32 : p.x < cp.x - 32) { escaped = true; break; }
        }
        assert.ok(escaped, 'shelter exit ' + level + '/' + index + '/' + direction);
      }
      const r = runAt(level, 1), p = r.players.get('p0'), cp = r.world.checkpoints[index];
      r.world.enemies = []; r.world.giant.speed = 0;
      p.x = cp.x - 50; p.y = 129;
      let landed = false, onStep = false, aboveRoof = false;
      for (let i = 0; i < 240; i++) {
        if (p.onGround && p.y + p.h === 132) onStep = true;
        if (onStep && p.y + p.h <= 113) aboveRoof = true;
        const target = aboveRoof ? cp.x + 16 : cp.x - 28;
        p.input = { right: p.x < target - 1, left: p.x > target + 2, jump: p.onGround && !p.lastJump };
        stepRun(r);
        if (p.onGround && p.y + p.h === 113 && p.x >= cp.x && p.x < cp.x + cp.w) { landed = true; break; }
      }
      assert.ok(landed, 'reachable shelter roof ' + level + '/' + index);
    }
  }
});
check('conveyor drift respects walls and upward ceiling collisions use the head crossing', () => {
  const w = { width: 300, floors: [{ x: 0, y: 151, w: 300, h: 30 }], platforms: [{ x: 100, y: 120, w: 20, h: 31 }], crates: [], groundDrift: .45 };
  const p = createPlayer('p', 88, 129); p.onGround = true;
  for (let i = 0; i < 120; i++) stepPlayer(p, {}, w);
  assert.equal(p.x, 88); assert.equal(p.y, 129);
  w.platforms = [{ x: 80, y: 100, w: 50, h: 6 }]; w.groundDrift = 0;
  p.x = 90; p.y = 108; p.vy = -5;
  stepPlayer(p, {}, w); assert.equal(p.y, 106); assert.equal(p.vy, 0);
  p.y = 90; p.vy = -5;
  stepPlayer(p, {}, w); assert.ok(p.y < 90, 'existing overlap must not eject player downward through floor');
});
check('missing route relays cannot trap the party inside an active arena', () => {
  const r = runAt(15), boss = r.world.boss;
  for (const p of r.players.values()) p.x = boss.x + 4;
  stepRun(r); assert.equal(boss.phase, 'waiting');
  const a = r.players.get('p0'); a.input = { left: true };
  for (let i = 0; i < 10; i++) stepRun(r);
  assert.ok(a.x < boss.x, 'party can return to missed relays');
});
check('a surviving heart retries the encounter explicitly without teleporting from a shelter', () => {
  const r = runAt(10, 1), p = r.players.get('p0'), b = r.world.boss;
  r.world.switches.forEach(s => { s.active = true; }); p.x = b.x + 20; stepRun(r);
  b.elapsed = 2500; b.pylons[0].active = true; b.activeRelay = 1;
  killPlayer(r, p, 'Arena strike'); const hearts = r.hearts; stepRun(r);
  assert.ok(p.alive); assert.equal(r.hearts, hearts); assert.ok(p.x >= b.x && p.x < b.x + 100);
  assert.equal(b.phase, 'recover'); assert.equal(b.elapsed, 0); assert.equal(b.activeRelay, 0);
  assert.ok(b.pylons.every(s => !s.active)); assert.equal(b.timer, 120);
});
check('cracked salvage breaks once from a stomp or thrown crate, never from resting contact', () => {
  const r = runAt(3, 1), p = r.players.get('p0'), block = r.world.platforms.find(s => s.kind === 'breakable');
  assert.ok(block); const ids = r.world.enemies.map(e => e.id), hearts = r.hearts;
  p.x = block.x + 3; p.y = block.y - p.h - 2; p.vy = 3;
  stepRun(r);
  assert.ok(!r.world.platforms.includes(block)); assert.ok(p.vy < 0);
  assert.equal(r.world.breakEffects.length, 1); assert.equal(r.hearts, hearts);
  assert.deepEqual(r.world.enemies.map(e => e.id), ids);
  stepRun(r); assert.equal(r.world.breakEffects.length, 1);
  const other = runAt(3, 1), b = other.world.platforms.find(s => s.kind === 'breakable'), crate = other.world.crates[0];
  crate.x = b.x - 15; crate.y = 137; crate.vx = 0; crate.vy = 0;
  for (let i = 0; i < 20; i++) stepRun(other);
  assert.ok(other.world.platforms.includes(b), 'resting crate cannot break salvage');
  crate.x = b.x - 15; crate.y = 137; crate.vx = 2.6; stepRun(other);
  assert.ok(!other.world.platforms.includes(b)); assert.equal(other.world.breakEffects.length, 1);
});
check('short coyote and landing buffer help timing without granting repeated air jumps', () => {
  const w = { width: 300, floors: [{x:0,y:151,w:80,h:30},{x:180,y:151,w:120,h:30}], platforms:[], crates:[] };
  const p = createPlayer('p',80,129); p.onGround=true;
  stepPlayer(p,{right:true},w); assert.equal(p.onGround,false);
  stepPlayer(p,{right:true,jump:true},w); assert.ok(p.vy < -4);
  const rising = p.vy; stepPlayer(p,{jump:false},w); stepPlayer(p,{jump:true},w);
  assert.ok(p.vy > rising, 'cannot reset upward velocity in mid-air');
  const late = createPlayer('late',100,129); late.onGround=true;
  for(let i=0;i<8;i++)stepPlayer(late,{},w);
  stepPlayer(late,{jump:true},w); assert.ok(late.vy>0,'grace expires');
  const landing=createPlayer('landing',200,120);landing.vy=2;
  stepPlayer(landing,{jump:true},w);
  for(let i=0;i<4;i++)stepPlayer(landing,{jump:false},w);
  assert.ok(landing.vy<0,'press just before landing is buffered once');
});
console.log('Shared systems regression complete.');

