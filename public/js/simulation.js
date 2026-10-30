import { buildLevel } from './world.js';
import { createPlayer, stepPlayer, overlaps, updateCrates } from './physics.js';
import { recordRunEvent } from './telemetry.js';
import { MEMORY_FRAGMENTS } from './memories.js';
import { stepRevision, interactRevision, revisionObjective } from './revision-simulation.js';

export const heartMaximum = count => count <= 1 ? 3 : Math.min(10, 3 + Math.ceil((count - 1) / 2));
export const playersOf = run => [...run.players.values()];
const near = (a, b, distance = 28) => Math.abs(a.x + a.w / 2 - b.x - b.w / 2) < distance && Math.abs(a.y + a.h / 2 - b.y - b.h / 2) < 40;

export function makeParticipant(id, slot, world) {
  return { ...createPlayer(id, 27 + slot * 17, world.floorY - 22, slot % 3), slot, input: {}, lastInputTick: 0 };
}

export function startLevel(run, level = 1, resetRun = false) {
  if (resetRun || !run.partySize) run.partySize = run.players.size;
  run.level = level;
  run.heartMax = heartMaximum(run.partySize);
  run.hearts = run.heartMax;
  run.world = buildLevel(level, run.partySize);
  run.phase = 'playing';
  run.tick = 0;
  run.objectiveVersion = 0;
  run.runId = (run.runId || 0) + 1;
  run.deathEvents = [];
  run.stageEvents = [];
  run.respawnX=null;run.respawnY=null;
  recordRunEvent(run,'stage-start');
  run.notice = level === 1 ? 'W/S climbs ladders. E lifts debris. Use the red relay to open the long bridge.' : 'Activate every route relay. Reach the exit together.';
  for (const [id, p] of run.players) run.players.set(id, makeParticipant(id, p.slot || 0, run.world));
}

function detach(run, player, throwing = false) {
  const object = run.world.crates.find(c => c.id === player.carryId) || run.players.get(player.carryId);
  if (object) {
    object.carriedBy = null;
    object.x = Math.max(0, Math.min(run.world.width - object.w, player.x + player.face * 19));
    object.y = run.world.revision ? player.y-12 : Math.max(0, player.y - 12);
    object.vx = throwing ? player.face * (run.world.revision?3.8:2.6) : 0;
    object.vy = throwing ? -4.3 : 0;
    if(run.world.revision&&!run.players.has(object.id)){object.flightTicks=throwing?100:0;object.thrownBy=throwing?player.id:null;if(throwing){object.y=player.y+2;object.vy=-2.2;}}
    if (run.players.has(object.id)) {
      object.throwTicks = throwing ? 32 : 0; object.throwVx = object.vx;
      object.onGround = false; object.coyoteTicks = 0; object.jumpBufferTicks = 0;
      object.lastJump = !!object.input?.jump;
    }
  }
  player.carryId = null;
  if (throwing) player.gestureTicks = 18;
}

export function releaseParticipant(run, player) {
  if (player.carryId) detach(run, player);
  if (player.carriedBy) {
    const carrier = run.players.get(player.carriedBy);
    if (carrier) carrier.carryId = null;
    player.carriedBy = null;
  }
  for (const enemy of run.world.enemies) if (enemy.grabbedId === player.id) enemy.grabbedId = null;
  player.capture = null;
  player.climbing = null;
}

export function killPlayer(run, player, cause, unavoidable = false) {
  if (!player.alive || (!unavoidable && player.invulnerability > 0) || run.phase !== 'playing') return false;
  releaseParticipant(run, player);
  player.alive = false;
  player.hitTicks = 14;
  player.vx = player.vy = 0;
  player.timeDead = player.lastDeathAt = run.tick;
  run.hearts = Math.max(0, run.hearts - 1);
  run.deathEvents.push({ id: `${run.runId}:${run.tick}:${player.id}`, playerId: player.id, cause });
  if (run.deathEvents.length > 30) run.deathEvents.shift();
  recordRunEvent(run,'death',{survivor:player.slot+1,cause,x:Math.round(player.x),y:Math.round(player.y)});
  run.notice = `${cause}. One team heart lost.`;
  if (!run.hearts) run.phase = 'gameover';
  return true;
}

function recover(run, checkpoint) {
  checkpoint.active = true;
  checkpoint.reachedTick = run.tick;
  run.respawnX = checkpoint.x + 4;
  const dead = playersOf(run).filter(p => !p.alive).sort((a, b) => a.timeDead - b.timeDead);
  if (dead.length) {
    const p = dead[0];
    Object.assign(p, makeParticipant(p.id, p.slot, run.world), { x: checkpoint.x + 4, invulnerability: 90 });
    run.notice = 'Shelter reached. Longest-down teammate revived; no heart added.';
    recordRunEvent(run,'checkpoint-revive',{survivor:p.slot+1,x:checkpoint.x});
  } else {
    run.hearts = Math.min(run.heartMax, run.hearts + 1);
    run.notice = 'Shelter reached. One heart restored up to the cap.';
    recordRunEvent(run,'checkpoint-heart',{x:checkpoint.x});
  }
}

export function safeFromOrdinary(world, player) {
  if(world.revision)return !!(world.coveredWay&&player.x>=world.coveredWay.x&&player.x<world.coveredWay.x+world.coveredWay.w&&player.y>world.coveredWay.y)||!!(world.boss&&player.x>=world.boss.x);
  return world.checkpoints.some(c => !c.destroyed && player.x + player.w > c.x && player.x < c.x + c.w) ||
    (world.coveredWay && player.x >= world.coveredWay.x && player.x < world.coveredWay.x + world.coveredWay.w) ||
    (world.boss && player.x >= world.boss.x);
}

function openRelay(run, sw) {
  sw.active = true;
  const pit = run.world.pits.find(p => p.x >= sw.x && p.x - sw.x < 310);
  if (pit && !run.world.platforms.some(p => p.kind === 'switch-bridge' && p.x === pit.x))
    run.world.platforms.push({ x: pit.x, y: run.world.floorY, w: pit.w, h: 8, kind: 'switch-bridge' });
  run.objectiveVersion++;
  run.world.finish.locked = run.world.switches.some(s => !s.active) || !!(run.world.boss && !run.world.boss.solved);
  run.notice = 'Relay online. Shared route opened.';
}

export function interactRun(run, id, action = 'use') {
  if(run.world.revision)return interactRevision(run,id,action,{detach,playersOf});
  const p = run.players.get(id);
  if (!p?.alive || p.carriedBy || p.capture || p.climbing!=null || run.phase !== 'playing') return false;
  if (run.tick - (p.lastInteractionTick ?? -60) < 12) return false;
  p.lastInteractionTick = run.tick;
  if (p.carryId) { detach(run, p, action !== 'drop'); run.notice = action === 'drop' ? 'Set down safely.' : 'Thrown. Watch the landing!'; return true; }
  if (action === 'drop') return false;
  const boss = run.world.boss;
  if (action === 'use' && boss && !boss.solved && p.x >= boss.x) {
    if (boss.phase === 'waiting') { run.notice = 'Wait for every living survivor to enter the blast door.'; return false; }
    const target = boss.pylons.find(s => !s.active && near(p, s));
    if (target) {
      if (boss.kind === 'gatewarden' && (boss.phase !== 'exposed' || target.order !== [1, 0, 2][boss.activeRelay])) {
        run.notice = boss.phase !== 'exposed' ? 'Bait the Warden slam. Relays unlock while its arm cools.' : `Wrong relay. Use relay ${[1, 0, 2][boss.activeRelay] + 1}.`;
        return false;
      }
      target.active = true;
      boss.activeRelay++;
      run.objectiveVersion++;
      if (boss.kind === 'gatewarden') { boss.phase = 'stunned'; boss.timer = 150; }
      if (boss.pylons.every(s => s.active) && boss.kind === 'background') { boss.phase = 'stunned'; boss.timer = 480; run.notice = 'COLOSSUS STUNNED. Use the central core terminal (E)!'; }
      return true;
    }
    if (boss.kind === 'background' && boss.phase === 'stunned' && Math.abs(p.x - (boss.x + 310)) < 38) {
      boss.cycle++;
      run.objectiveVersion++;
      if (boss.cycle >= 3) { boss.solved = true; boss.phase = 'escaped'; run.notice = 'Production core disabled. Escape while the Colossus reboots!'; }
      else { boss.pylons.forEach(s => { s.active = false; }); boss.activeRelay = 0; boss.phase = 'recover'; boss.timer = 180; run.notice = `Core circuit ${boss.cycle}/3 severed. Charge the three relays again.`; }
      return true;
    }
  }
  if (action === 'use') {
    const sw = run.world.switches.find(s => !s.active && near(p, s));
    if (sw) { openRelay(run, sw); return true; }
    if (run.world.memory && !run.world.memory.read && Math.abs(p.x - run.world.memory.x) < 26) {
      run.world.memory.read = true;
      run.notice = 'MEMORY: '+MEMORY_FRAGMENTS[run.level];
      return true;
    }
    const shelter=run.world.checkpoints.find(c=>!c.destroyed&&Math.abs(p.x+p.w/2-(c.x+c.w/2))<=9&&p.y>=118&&p.onGround);
    if(shelter&&run.world.platforms.some(s=>s.kind==='shelter-roof'&&s.shelterX===shelter.x)){
      p.climbing=shelter.x;p.vx=p.vy=0;
      run.notice='Climbing the shelter ladder. Move sideways to step off.';return true;
    }
  }
  const teammate = action === 'carry' && playersOf(run).find(other => other.id !== id && other.alive && !other.capture && other.climbing==null && !other.carriedBy && !other.carryId && near(p, other, 25));
  const crate = run.world.crates.find(c => !c.used && !c.carriedBy && near(p, c, 25));
  const object = teammate || crate;
  if (object) { object.carriedBy = id; p.carryId = object.id; run.notice = teammate ? 'Carrying teammate. F throws, Q drops; teammate can jump free.' : 'Crate picked up. E throws; Q drops.'; return true; }
  return false;
}

function updateEnemies(run) {
  const world = run.world;
  for (const e of world.enemies) {
    // An earlier robot can kill someone during this same simulation tick.
    // Later robots must not capture dead bodies or count them as rescuers.
    const alive = playersOf(run).filter(p => p.alive && !p.carriedBy);
    if (e.stunned > 0) { e.stunned--; e.phase = 'stunned'; continue; }
    if (e.grabbedId) {
      const victim = run.players.get(e.grabbedId);
      if (!victim?.alive) { e.grabbedId = null; continue; }
      const rescuer = alive.find(p => p.id !== victim.id && !p.capture && p.vy > 0 && overlaps(p, { x: e.x - 4, y: e.y - 9, w: e.w + 8, h: 14 }));
      if (rescuer) {
        victim.capture = null; victim.invulnerability = 100;
        e.grabbedId = null; e.stunned = 150; e.phase = 'stunned'; rescuer.vy = -3.8;
        run.notice = 'RESCUED. The robot will recover. Keep moving!';
        continue;
      }
      victim.x = e.x + 4; victim.y = world.floorY - victim.h;
      victim.capture.remaining -= 1 / 60;
      const dir = victim.input?.left ? -1 : victim.input?.right ? 1 : 0;
      const jump = !!victim.input?.jump;
      if ((dir && dir !== victim.capture.lastDirection) || (jump && !victim.capture.lastJump)) {
        if (victim.capture.struggle < 4) { victim.capture.remaining += .12; victim.capture.struggle++; }
      }
      if (dir) victim.capture.lastDirection = dir;
      victim.capture.lastJump = jump;
      if (victim.capture.remaining <= 0) killPlayer(run, victim, 'Capture timer expired');
      continue;
    }
    const targets = alive.filter(p => !p.capture && p.invulnerability <= 0 && !safeFromOrdinary(world, p));
    const target = targets.find(p => Math.abs(p.x - e.x) < (e.kind === 'scanner' ? 45 : 62));
    if (e.kind === 'sentinel' || e.kind === 'scanner' || e.kind === 'creeper' || (e.kind === 'grabber' && alive.length === 1)) {
      if (e.phase === 'warning') {
        e.timer--;
        if (e.timer <= 0) { e.phase = 'attack'; e.timer = 20; }
      } else if (e.phase === 'attack') {
        for (const p of targets) if (Math.abs(p.x - e.targetX) < (e.kind === 'creeper' ? 48 : 23) && (e.kind === 'scanner' || p.y + p.h > 125)) killPlayer(run, p, e.kind === 'creeper' ? 'Blast radius' : 'Telegraphed robot strike');
        if (--e.timer <= 0) { e.phase = 'recover'; e.timer = 180; }
      } else if (e.phase === 'recover') {
        if (--e.timer <= 0) e.phase = 'patrol';
      } else if (target) { e.phase = 'warning'; e.timer = e.kind === 'creeper' ? 120 : 90; e.targetX = e.kind === 'creeper' ? e.x : target.x; }
    }
    if (e.phase === 'warning' || e.phase === 'attack') continue;
    e.phase = e.phase === 'recover' ? 'recover' : 'patrol';
    let next = e.x + e.dir * e.speed;
    if (next < e.minX || next > e.maxX || world.checkpoints.some(c => !c.destroyed && next + e.w > c.x && next < c.x + c.w) || (world.coveredWay && next + e.w > world.coveredWay.x) || (world.boss && next + e.w > world.boss.x)) { e.dir *= -1; next = e.x; }
    e.x = next;
    if ((e.kind || 'grabber') === 'grabber' && alive.length > 1) for (const p of targets) {
      if (!overlaps(p, e)) continue;
      // Solo has a readable escape window as there is no teammate to rescue.
      if (alive.length === 1) { e.phase = 'warning'; e.targetX = p.x; if ((e.soloCountdown ?? 90) <= 0) { killPlayer(run, p, 'Grabber crush'); e.soloCountdown = 90; } else e.soloCountdown = (e.soloCountdown ?? 90) - 1; }
      else { releaseParticipant(run, p); e.grabbedId = p.id; e.phase = 'grab'; p.capture = { enemyId: e.id, remaining: 3.2, lastDirection: 0, struggle: 0 }; break; }
    }
    if (!targets.some(p => overlaps(p, e))) e.soloCountdown = 90;
  }
}

function updateBoss(run) {
  const b = run.world.boss;
  if (!b || b.solved) return;
  const alive = playersOf(run).filter(p => p.alive);
  if (b.phase === 'waiting') {
    if (run.world.switches.some(s => !s.active)) return;
    if (!alive.length || !alive.every(p => p.x >= b.x)) return;
    b.phase = 'recover'; b.timer = 120;
    run.notice = b.kind === 'gatewarden' ? 'WARDEN: bait a slam, then relay 2 → 1 → 3 while exposed.' : b.kind === 'gauntlet' ? 'SURVIVE 45 seconds. Activate all three beacons; jump the warning stripes.' : 'COLOSSUS: charge three relays, then E at the central core. Repeat three times.';
  }
  b.elapsed++;
  if (b.kind === 'gauntlet' && b.elapsed >= 2700 && b.pylons.every(s => s.active)) { b.solved = true; b.phase = 'escaped'; run.notice = 'Survival lock released. Reach the facility!'; return; }
  if (b.kind === 'gatewarden' && b.pylons.every(s => s.active)) { b.solved = true; b.phase = 'escaped'; run.notice = 'Warden stunned. Blast door open. Escape!'; return; }
  if (--b.timer > 0) return;
  if (b.phase === 'warning') {
    b.phase = 'attack'; b.timer = 24;
  } else if (b.phase === 'attack') {
    b.phase = b.kind === 'gatewarden' ? 'exposed' : 'recover'; b.timer = b.kind === 'gatewarden' ? 360 : 90;
  } else if (b.phase === 'stunned' && b.kind === 'background') {
    b.pylons.forEach(s => { s.active = false; }); b.activeRelay = 0; b.phase = 'recover'; b.timer = 120;
  } else {
    b.phase = 'warning'; b.timer = b.kind === 'background' ? 110 : 90;
    b.targetX = alive[(Math.floor(b.elapsed / 120)) % alive.length]?.x ?? b.x + 300;
  }
}

function breakSalvage(run, block) {
  if (!run.world.platforms.includes(block)) return;
  run.world.platforms = run.world.platforms.filter(p => p !== block);
  run.world.breakEffects ||= [];
  run.world.breakEffects.push({ x: block.x + block.w / 2, y: block.y + 6, tick: run.tick });
  run.notice = 'Cracked salvage cleared. Machines cannot be broken.';
}

function updatePressureBridges(run) {
  const world = run.world;
  for (const plate of world.plates || []) {
    const weights = [...playersOf(run).filter(p => p.alive && !p.carriedBy && !p.capture),
      ...world.crates.filter(c => !c.used && !c.carriedBy)];
    plate.held = weights.some(p => p.x + p.w > plate.x && p.x < plate.x + plate.w && Math.abs(p.y + p.h - plate.y) < 2);
    plate.remaining = plate.held ? 480 : Math.max(0, plate.remaining - 1);
    const bridge = world.platforms.find(p => p.plateId === plate.id);
    if (plate.remaining && !bridge) world.platforms.push({ x: plate.bridgeX, y: world.floorY, w: plate.bridgeW, h: 6, kind: 'pressure-bridge', plateId: plate.id });
    if (!plate.remaining && bridge) world.platforms = world.platforms.filter(p => p !== bridge);
  }
}

export function stepRun(run) {
  if(run.world.revision)return stepRevision(run,{killPlayer,makeParticipant,playersOf,releaseParticipant});
  if (run.phase !== 'playing') return;
  run.tick++;
  const world = run.world;
  const participants = playersOf(run);
  updatePressureBridges(run);
  if (world.breakEffects) world.breakEffects = world.breakEffects.filter(e => run.tick - e.tick < 30);
  for (const p of participants) {
    p.gestureTicks = Math.max(0, (p.gestureTicks || 0) - 1);
    p.hitTicks = Math.max(0, (p.hitTicks || 0) - 1);
    if (!p.alive || p.carriedBy || p.capture) continue;
    const previousX = p.x;
    for (const block of world.platforms.filter(s => s.kind === 'breakable')) {
      if (p.vy > 2 && p.x + p.w > block.x && p.x < block.x + block.w &&
        p.y + p.h <= block.y + 3 && p.y + p.h + p.vy + .24 >= block.y) {
        breakSalvage(run, block); p.vy = -3; p.onGround = false;
      }
    }
    const supports = participants.filter(o => o.id !== p.id && o.alive && !o.carriedBy && !o.capture && p.y + p.h <= o.y + 3).map(o => ({ x: o.x, y: o.y, w: o.w, h: 2, kind: 'teammate' }));
    const playerWorld = { ...world, platforms: [...world.platforms, ...supports] };
    for (const t of world.terrain || []) if (p.onGround && p.x + p.w > t.x && p.x < t.x + t.w) {
      if (t.kind === 'water') playerWorld.moveScale = .65;
      if (t.kind === 'conveyor') playerWorld.groundDrift = t.direction * .45;
    }
    stepPlayer(p, p.input || {}, playerWorld);
    if(p.ladderBlocked)run.notice='Ladder hatch blocked. Move the crate or use a ground exit.';
    if (world.boss && world.boss.phase !== 'waiting' && !world.boss.solved) p.x = Math.max(world.boss.x, p.x);
    for (const cp of world.checkpoints) if (!cp.active && !cp.destroyed && previousX + p.w < cp.x && p.x + p.w >= cp.x) recover(run, cp);
    if (p.y > world.height - 6) killPlayer(run, p, 'Fell into a pit', true);
    p.lastX = previousX;
  }
  for (const p of participants) if (p.carriedBy) {
    const carrier = run.players.get(p.carriedBy);
    if (!carrier?.alive) { p.carriedBy = null; continue; }
    p.x = carrier.x; p.y = carrier.y - p.h - 2; p.vx = p.vy = 0;
    if (p.input?.jump) {
      carrier.carryId = null; p.carriedBy = null; p.vy = -5.2; p.invulnerability = 20;
      p.onGround = false; p.coyoteTicks = 0; p.jumpBufferTicks = 0; p.lastJump = true;
    }
  }
  const crateImpacts = world.crates.filter(c => !c.carriedBy && !c.used && (Math.abs(c.vx) > 1 || c.vy > 2));
  updateCrates(world);
  for (const c of crateImpacts) for (const block of world.platforms.filter(s => s.kind === 'breakable')) {
    if (overlaps(c, { x: block.x - 2, y: block.y - 2, w: block.w + 4, h: block.h + 4 })) breakSalvage(run, block);
  }
  updateEnemies(run);
  updateBoss(run);
  const b = world.boss;
  if (b?.phase === 'attack') for (const p of participants) {
    if (!p.alive || p.x < b.x) continue;
    const isCover = world.platforms.some(s => s.kind === 'arena-cover' && p.x >= s.x && p.x + p.w <= s.x + s.w && p.y > s.y);
    if (Math.abs(p.x - b.targetX) < (b.kind === 'background' ? 32 : 25) && !isCover && (b.kind === 'background' || p.y + p.h > 124)) killPlayer(run, p, 'Arena strike');
  }
  // Absolute, fixed-speed pursuit: no rubber-band or player-position catch-up.
  if (world.giant.wakeTicks > 0) world.giant.wakeTicks--;
  else world.giant.x = Math.min(b ? b.x - 48 : world.width, world.giant.x + world.giant.speed);
  for (const cp of world.checkpoints) if (!cp.destroyed && world.giant.x + 35 >= cp.x) {
    cp.destroyed = true;
    world.platforms = world.platforms.filter(p => p.shelterX !== cp.x);
  }
  for (const p of participants) if (p.alive && (!b || p.x < b.x) && world.giant.x + 44 > p.x + 4) killPlayer(run, p, 'The pursuer caught you', true);
  if (run.phase !== 'playing') return;
  const alive = participants.filter(p => p.alive);
  if (!alive.length) {
    // Spend the already-deducted hearts to retry the segment, without banking recovery.
    const cp = world.checkpoints.filter(c => c.active && !c.destroyed).at(-1);
    const arenaRetry = b && b.phase !== 'waiting' && !b.solved;
    const x = arenaRetry ? b.x + 24 : cp ? cp.x + 6 : 27;
    for (const p of participants) Object.assign(p, makeParticipant(p.id, p.slot, world), { x: x + p.slot * 14, invulnerability: 120 });
    world.giant.x = Math.min(world.giant.x, x - 160);
    if (arenaRetry) {
      b.phase = 'recover'; b.timer = 120; b.elapsed = 0; b.activeRelay = 0; b.cycle = 0;
      b.pylons.forEach(s => { s.active = false; });
    }
    run.notice = arenaRetry ? 'Team down. Encounter reset with remaining hearts. Get ready!' : 'Team down. Retrying the segment with remaining hearts.';
    recordRunEvent(run,'segment-retry',{x,arena:!!arenaRetry});
    return;
  }
  world.finish.locked = world.switches.some(s => !s.active) || !!(b && !b.solved);
  if (!world.finish.locked && alive.every(p => !p.capture && p.x + p.w >= world.finish.x && p.y + p.h >= 0 && p.y < world.floorY)) {
    run.phase = 'victory'; run.notice = run.level === 15 ? 'Factory disabled. The last spark survives…' : `Level ${run.level} complete. Continue together.`;
    recordRunEvent(run,'stage-clear');
  }
}

export function objectiveText(run) {
  if(run.world.revision)return revisionObjective(run);
  const w = run.world, b = w.boss;
  const done = w.switches.filter(s => s.active).length;
  const hazard = w.enemies.find(e => ['warning','attack'].includes(e.phase) && playersOf(run).some(p => p.alive && Math.abs(p.x-e.targetX)<100));
  if (hazard) return hazard.kind === 'scanner' ? 'SCANNER: leave the marked column before it fires.' : `${hazard.kind === 'creeper' ? 'BLAST' : 'GROUND STRIKE'}: jump or move beyond the marked strip. Machines cannot be destroyed.`;
  if (!b || b.phase === 'waiting') {
    if(playersOf(run).some(p=>p.alive&&p.climbing!=null))return 'SHELTER LADDER: climbing to the roof. Move sideways to step off.';
    if(w.checkpoints.some(c=>!c.destroyed&&playersOf(run).some(p=>p.alive&&!p.capture&&p.y>=118&&Math.abs(p.x+p.w/2-(c.x+c.w/2))<20)))return 'SHELTER: E at the central ladder climbs to the roof. Ground exits remain open.';
    if (playersOf(run).some(p=>p.alive&&p.carryId)) return `RELAYS ${done}/${w.switches.length} • CARRYING: F throws forward / Q drops gently`;
    if (w.crates.some(c=>!c.used&&!c.carriedBy&&playersOf(run).some(p=>p.alive&&!p.capture&&Math.abs(p.x-c.x)<35&&Math.abs(p.y-c.y)<30))) return `RELAYS ${done}/${w.switches.length} • CRATE: push, jump onto it, or E to lift / Q to drop`;
  }
  const plate = w.plates?.find(s => playersOf(run).some(p => p.alive && p.x > s.x - 75 && p.x < s.bridgeX + s.bridgeW + 30));
  if (plate) return `RELAYS ${done}/${w.switches.length} • PRESSURE BRIDGE: ${plate.held ? 'HELD OPEN' : plate.remaining ? `${Math.ceil(plate.remaining / 60)}s TO CROSS` : 'stand on plate or leave a crate'} • fallback jump available`;
  if (w.platforms.some(s => s.kind === 'breakable' && playersOf(run).some(p => p.alive && Math.abs(p.x - s.x) < 90))) return `RELAYS ${done}/${w.switches.length} • CRACKED SALVAGE: stomp from above or throw a crate`;
  if (done < w.switches.length) return `ROUTE RELAYS ${done}/${w.switches.length} • E near the red terminals`;
  if (b && !b.solved) {
    if (b.phase === 'waiting') return 'Reach the blast door together. The pursuer cannot enter.';
    if (b.kind === 'gatewarden') return `WARDEN • ${b.phase.toUpperCase()} • Relay ${[1, 0, 2][b.activeRelay] + 1 || 'complete'} • bait slam, then E`;
    if (b.kind === 'gauntlet') return `SURVIVE ${Math.max(0, 45 - Math.floor(b.elapsed / 60))}s • BEACONS ${b.activeRelay}/3 • jump marked strikes`;
    return `COLOSSUS • CORE ${b.cycle}/3 • ${b.phase === 'stunned' ? 'E AT CENTRAL CORE NOW' : 'Charge 3 relays; dodge marked blasts'}`;
  }
  return 'EXIT OPEN • Every living survivor must reach the shelter.';
}
