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
    gestureTicks: 0, hitTicks: 0, climbing: null, pursuerRecovery:0,
  };
}

export function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Plan an entire horizontal box chain before moving anything, so a wall at
// the far end cannot leave an earlier box embedded in its neighbor.
function pushCrates(first, nextX, world) {
  const movingRight=nextX>first.x, planned=new Map();
  const loose=(world.crates||[]).filter(c=>!c.used&&!c.carriedBy);
  function plan(crate,x) {
    if(planned.has(crate))return false;
    const proposed={...crate,x};
    if(x<0||x+crate.w>world.width||[...world.floors,...world.platforms].some(s=>overlaps(proposed,s)))return false;
    planned.set(crate,x);
    for(const other of loose) {
      if(other===crate||!overlaps(proposed,{...other,x:planned.get(other)??other.x}))continue;
      if(!plan(other,movingRight?x+crate.w:x-other.w))return false;
    }
    return true;
  }
  if(!plan(first,nextX))return false;
  for(const [crate,x] of planned){crate.x=x;crate.vx=0;}
  return true;
}

export function stepPlayer(player, input, world, dt = 1) {
  if (!player.alive) return player;
  const p = player;
  const left = !!input.left;
  const right = !!input.right;
  const jump = !!input.jump;
  p.ladderBlocked=false;

  // W/S are deliberate ladder motion, never jump aliases. Facade ladders
  // have a clear shaft; solid maze trunks keep their ladders outside the wall.
  if(world.revision && p.climbing==null && (input.up||input.down) && !p.carriedBy){
    const ladder=world.ladders.find(l=>Math.abs(p.x+p.w/2-l.x-l.w/2)<15&&p.y+p.h>=l.y-2&&p.y<l.y+l.h&&!(input.down&&p.y+p.h>=l.y+l.h)&&!(input.up&&p.y+p.h<=l.y+.5));
    if(ladder){p.climbing=ladder.id;p.vx=p.vy=0;}
  }
  if(world.revision && p.climbing!=null){
    const ladder=world.ladders.find(l=>l.id===p.climbing);
    if(!ladder||(left!==right&&!input.up&&!input.down)||(jump&&!p.lastJump)){p.climbing=null;p.vy=jump?-5.2:0;if(jump){p.lastJump=true;p.throwTicks=8;p.throwVx=left?-1.8:right?1.8:p.face*1.8;}}
    else {
      const direction=Number(!!input.down)-Number(!!input.up);
      p.x=ladder.x+(ladder.w-p.w)/2;p.y=Math.max(ladder.y-p.h,Math.min(ladder.y+ladder.h-p.h,p.y+direction*1.5*dt));
      p.vx=p.vy=0;p.onGround=false;p.lastJump=jump;
      if(p.y<=ladder.y-p.h&&direction<0){p.climbing=null;p.onGround=true;}
      if(p.y>=ladder.y+ladder.h-p.h&&direction>0){p.climbing=null;p.onGround=true;}
      if(p.invulnerability>0)p.invulnerability--;
      if(p.carryId){const c=world.crates.find(c=>c.id===p.carryId);if(c){c.x=p.x;c.y=p.y-c.h;}}
      return p;
    }
  }

  if(p.climbing!=null){
    const shelter=(world.checkpoints||[]).find(c=>c.x===p.climbing&&!c.destroyed);
    const roof=shelter&&world.platforms.find(s=>s.kind==='shelter-roof'&&s.shelterX===shelter.x);
    if(!roof||left!==right||p.carryId||p.throwTicks>0){
      // A sideways cancellation inside the hatch returns below its solid lip.
      if(roof&&p.y<roof.y+roof.h&&p.y+p.h>roof.y)p.y=roof.y+roof.h;
      p.climbing=null;p.vy=0;
    }else{
      const next={...p,x:shelter.x+shelter.w/2-p.w/2,y:Math.max(roof.y-p.h,p.y-1.2*dt)};
      const obstacles=[...world.platforms.filter(s=>s!==roof&&s.kind!=='teammate'),...(world.crates||[]).filter(c=>!c.used&&!c.carriedBy)];
      if(obstacles.some(s=>overlaps(next,s))){
        p.ladderBlocked=true;
        p.climbing=null;p.y=Math.max(p.y,roof.y+roof.h);p.vy=0;p.onGround=false;
        return p;
      }
      p.x=next.x;p.y=next.y;p.vx=p.vy=0;p.onGround=false;
      p.lastJump=jump;p.coyoteTicks=0;p.jumpBufferTicks=0;
      if(p.y===roof.y-p.h){p.climbing=null;p.onGround=true;}
      if(p.invulnerability>0)p.invulnerability=Math.max(0,p.invulnerability-dt);
      return p;
    }
  }

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
    p.vy = world.revision ? -6 : JUMP_SPEED;
    p.onGround = false;
    p.coyoteTicks = 0;
    p.jumpBufferTicks = 0;
  }
  else if(world.revision && p.jumpBufferTicks>0 && !p.onGround){
    const wall=world.platforms.find(s=>p.y+p.h>s.y+3&&p.y<s.y+s.h&&
      (Math.abs(p.x+p.w-s.x)<3||Math.abs(p.x-(s.x+s.w))<3));
    if(wall){const dir=p.x<wall.x?-1:1;p.vy=-6.2;p.throwTicks=10;p.throwVx=dir*2;p.vx=p.throwVx;p.face=dir;p.jumpBufferTicks=0;}
  }
  p.lastJump = jump;
  p.vy = Math.min(5.1, p.vy + GRAVITY * dt);

  const oldX = p.x;
  p.x += (p.vx * (world.moveScale ?? 1) + (world.groundDrift ?? 0)) * dt;
  p.x = Math.max(0, Math.min(world.width - p.w, p.x));

  // Wall/block contacts do not let the player clip through crate-sized props.
  for (const block of world.platforms) {
    if(block.oneWay)continue;
    if (overlaps(p, block) && p.y + p.h > block.y + 3) {
      if (oldX + p.w <= block.x) p.x = block.x - p.w;
      else if (oldX >= block.x + block.w) p.x = block.x + block.w;
      p.vx = 0;
    }
  }

  for (const crate of (world.crates || []).filter(c => !c.used && !c.carriedBy)) {
    if (!overlaps(p, crate) || p.y + p.h <= crate.y + 3) continue;
    const movingRight = p.x > oldX;
    const movingLeft = p.x < oldX;
    if (!movingRight && !movingLeft) continue;
    const proposed = { ...crate, x: movingRight ? p.x + p.w : p.x - crate.w };
    const blocked = !pushCrates(crate,proposed.x,world);
    p.x = movingRight ? crate.x - p.w : crate.x + crate.w;
    if (blocked) p.vx = 0;
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
    } else if (!solid.oneWay && horizontally && p.vy < 0 && p.y <= solid.y + solid.h && previousTop >= solid.y + solid.h) {
      p.y = solid.y + solid.h;
      p.vy = 0;
    }
  }
  if (p.invulnerability > 0) p.invulnerability -= dt;
  return p;
}

export function updateCrates(world, dt = 1) {
  for (const crate of world.crates) {
    if (crate.carriedBy || crate.used) continue;
    const oldX = crate.x;
    const oldTop = crate.y, oldBottom = crate.y + crate.h;
    crate.vy = Math.min(4.5, (crate.vy || 0) + 0.22 * dt);
    const solids = [...world.floors, ...world.platforms, ...world.crates.filter(c => c !== crate && !c.used && !c.carriedBy)];
    crate.x += (crate.vx || 0) * dt;
    for (const solid of solids) {
      if(solid.oneWay)continue;
      if (!overlaps(crate, solid)) continue;
      if (oldX + crate.w <= solid.x) { crate.x = solid.x - crate.w; crate.vx = 0; }
      else if (oldX >= solid.x + solid.w) { crate.x = solid.x + solid.w; crate.vx = 0; }
    }
    crate.y += crate.vy * dt;
    crate.vx *= world.revision&&crate.flightTicks>0 ? .995 : .94;
    for (const solid of solids) {
      const horizontally = crate.x + crate.w > solid.x && crate.x < solid.x + solid.w;
      if (horizontally && crate.vy >= 0 && oldBottom <= solid.y + 2 && crate.y + crate.h >= solid.y) {
        crate.y = solid.y - crate.h;
        crate.vy = 0;
      } else if(!solid.oneWay && horizontally && crate.vy<0 && oldTop>=solid.y+solid.h && crate.y<=solid.y+solid.h) {
        crate.y=solid.y+solid.h;crate.vy=0;
      }
    }
    crate.x = Math.max(0, Math.min(world.width - crate.w, crate.x));
    // A crate dropped below the death zone is removed from collision/weight checks.
    if (crate.y > world.height + 12) { crate.used = true; crate.y = world.floorY - crate.h; crate.vy = 0; }
  }
}
