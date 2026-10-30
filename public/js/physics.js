export const PLAYER_W = 12;
export const PLAYER_H = 22;
const GRAVITY = 0.24;
const MOVE_SPEED = 1.28;
const JUMP_SPEED = -5.2;

export function createPlayer(id = 'local', x = 26, y = 110, colorIndex = 0) {
  return {
    id, x, y, vx: 0, vy: 0, w: PLAYER_W, h: PLAYER_H,
    onGround: false, alive: true, colorIndex, face: 1, carryId: null,
    heartsLost: 0, timeDead: 0, lastJump: false, invulnerability: 0,
    coyoteTicks: 0, jumpBufferTicks: 0,
    gestureTicks: 0, hitTicks: 0,
  };
}

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function stepPlayer(player, input, world, dt = 1) {
  if (!player.alive) return player;
  const p = player;
  const left = !!input.left;
  const right = !!input.right;
  const jump = !!input.jump;

  if (p.throwTicks > 0) {
    p.vx = p.throwVx;
    p.throwTicks--;
  } else if (left !== right) {
    p.vx = left ? -MOVE_SPEED : MOVE_SPEED;
    p.face = left ? -1 : 1;
  } else {
    p.vx *= 0.65;
    if (Math.abs(p.vx) < 0.08) p.vx = 0;
  }
  p.coyoteTicks = p.onGround ? 5 : Math.max(0, (p.coyoteTicks || 0) - dt);
  p.jumpBufferTicks = jump && !p.lastJump ? 6 : Math.max(0, (p.jumpBufferTicks || 0) - dt);
  if (p.jumpBufferTicks > 0 && p.coyoteTicks > 0) {
    p.vy = JUMP_SPEED;
    p.onGround = false;
    p.coyoteTicks = 0;
    p.jumpBufferTicks = 0;
  }
  p.lastJump = jump;
  p.vy = Math.min(5.1, p.vy + GRAVITY * dt);

  const oldX = p.x;
  p.x += (p.vx * (world.moveScale ?? 1) + (world.groundDrift ?? 0)) * dt;
  p.x = Math.max(0, Math.min(world.width - p.w, p.x));

  // Wall/block contacts do not let the player clip through crate-sized props.
  for (const block of world.platforms) {
    if (overlaps(p, block) && p.y + p.h > block.y + 3) {
      if (oldX + p.w <= block.x) p.x = block.x - p.w;
      else if (oldX >= block.x + block.w) p.x = block.x + block.w;
      p.vx = 0;
    }
  }

  const previousTop = p.y;
  const previousBottom = p.y + p.h;
  p.y += p.vy * dt;
  p.onGround = false;
  const solids = [...world.floors, ...world.platforms, ...(world.crates || []).filter((c) => !c.used && !c.carriedBy)];
  if (p.carryId) {
    const carried = world.crates.find((c) => c.id === p.carryId);
    if (carried) { carried.x = p.x + (p.face > 0 ? p.w - 1 : -carried.w + 1); carried.y = p.y - carried.h + 3; carried.vx = 0; carried.vy = 0; }
  }
  for (const solid of solids) {
    const horizontally = p.x + p.w > solid.x && p.x < solid.x + solid.w;
    if (horizontally && p.vy >= 0 && previousBottom <= solid.y + 2 && p.y + p.h >= solid.y) {
      p.y = solid.y - p.h;
      p.vy = 0;
      p.onGround = true;
    } else if (horizontally && p.vy < 0 && p.y <= solid.y + solid.h && previousTop >= solid.y + solid.h) {
      p.y = solid.y + solid.h;
      p.vy = 0;
    }
  }
  if (p.invulnerability > 0) p.invulnerability -= dt;
  return p;
}

export function updateCrates(world, dt = 1) {
  for (const crate of world.crates) {
    if (crate.carriedBy) continue;
    const oldBottom = crate.y + crate.h;
    crate.vy = Math.min(4.5, (crate.vy || 0) + 0.22 * dt);
    crate.x += (crate.vx || 0) * dt;
    crate.y += crate.vy * dt;
    crate.vx *= 0.94;
    const solids = [...world.floors, ...world.platforms];
    for (const solid of solids) {
      const horizontally = crate.x + crate.w > solid.x && crate.x < solid.x + solid.w;
      if (horizontally && crate.vy >= 0 && oldBottom <= solid.y + 2 && crate.y + crate.h >= solid.y) {
        crate.y = solid.y - crate.h;
        crate.vy = 0;
      }
    }
    crate.x = Math.max(0, Math.min(world.width - crate.w, crate.x));
    // A thrown crate over a pit settles on its base as a temporary step instead of disappearing immediately.
    if (crate.y > world.height + 12) { crate.used = true; crate.y = world.floorY - crate.h; crate.vy = 0; }
  }
}
