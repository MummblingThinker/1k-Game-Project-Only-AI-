import { getLevel } from './campaign.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function gapWidthForParty(partySize, gapIndex = 0) {
  // A small number of gaps scale with the original lobby size; most gaps stay modest.
  // This is an early prototype tuning curve, not final balance.
  const party = clamp(Number(partySize) || 1, 1, 14);
  const groupBand = Math.floor((party - 1) / 2);
  const special = 46 + groupBand * 21;
  const medium = 34 + groupBand * 8;
  if (gapIndex === 1) return clamp(special, 46, 180);
  if (gapIndex === 3) return clamp(medium + 12, 36, 92);
  return clamp(medium, 34, 82);
}

function buildReferenceLevel(levelId = 1, partySize = 1) {
  const level = getLevel(levelId);
  const floorY = 151;
  const pits = [];
  const platforms = [];
  const floors = [];
  const crates = [];
  const enemies = [];
  const checkpoints = [];
  const switches = [];
  // Level 1 is the short submission slice; later campaign prototypes stay intact.
  const intro = level.id === 1;
  const pitStartXs = intro ? [280, 600] : [455, 930, 1430, 1880];
  const xOffsets = [];
  let offset = 0;
  const rawPits = pitStartXs.map((x, i) => {
    const scaledStart = x + offset;
    const width = gapWidthForParty(partySize, i);
    offset += width - 48;
    xOffsets.push(offset);
    return { x: scaledStart, width, index: i };
  });
  const width = (intro ? 960 : 2360) + offset;
  let cursor = 0;
  for (const p of rawPits) {
    if (p.x > cursor) floors.push({ x: cursor, y: floorY, w: p.x - cursor, h: 35 });
    pits.push({ x: p.x, y: floorY, w: p.width, h: 35, index: p.index });
    // Fallback stepping stones prevent scaled teamwork gaps becoming permanent softlocks.
    // Groups can use a throw/stack/bridge for a safer or faster crossing; a lone survivor can hop across.
    if (p.width > 55) {
      const count = Math.max(1, Math.ceil(p.width / 34) - 1);
      for (let step = 1; step <= count; step++) {
        const stoneW = 18;
        platforms.push({ x: p.x + p.width * step / (count + 1) - stoneW / 2, y: floorY - 20, w: stoneW, h: 6, kind: 'stone', pitIndex: p.index });
      }
    }
    cursor = p.x + p.width;
  }
  floors.push({ x: cursor, y: floorY, w: width - cursor, h: 35 });

  // Small ledges and climbable-looking service platforms reinforce vertical route choices.
  const ledgeXs = intro ? [150] : [245, 615, 760, 1110, 1280, 1615, 1770, 2110, 2245];
  ledgeXs.forEach((x, i) => platforms.push({
    x: x + (x > 930 ? xOffsets[1] : 0) + (x > 1430 ? xOffsets[2] : 0),
    y: i % 3 === 0 ? 114 : (i % 3 === 1 ? 128 : 104),
    w: i % 2 === 0 ? 44 : 32,
    h: 6,
    kind: 'ledge',
  }));

  // Supply crates: movable props can be used as stepping stones or thrown to make a route safer.
  (intro ? [180] : [350, 855, 1325, 1775, 2185]).forEach((x, i) => {
    const shift = x > 930 ? xOffsets[1] : 0;
    crates.push({ id: `crate-${i}`, x: x + shift, y: floorY - 14, w: 14, h: 14, vx: 0, vy: 0, carriedBy: null, used: false });
  });

  // Every level includes one checkpoint room. The long-map rule can place a second.
  checkpoints.push({ x: Math.round(width * 0.48), y: floorY - 26, w: 42, h: 26, active: false, destroyed: false });
  if (width > 2650) {
    checkpoints.length = 0;
    checkpoints.push({ x: Math.round(width / 3), y: floorY - 26, w: 42, h: 26, active: false, destroyed: false });
    checkpoints.push({ x: Math.round(width * 2 / 3), y: floorY - 26, w: 42, h: 26, active: false, destroyed: false });
  }

  switches.push({ x: intro ? rawPits[1].x - 50 : Math.round(width * 0.66), y: floorY - 12, w: 10, h: 12, active: false });
  const sentryXs = [700, 1200, 1680, 2040].map((x, i) => ({
    id: `sentry-${i}`, x: Math.min(width - 140, x + (i > 1 ? xOffsets[2] : 0)),
    baseX: Math.min(width - 140, x + (i > 1 ? xOffsets[2] : 0)),
    minX: Math.min(width - 190, x + (i > 1 ? xOffsets[2] : 0) - 30),
    maxX: Math.min(width - 90, x + (i > 1 ? xOffsets[2] : 0) + 70),
    y: floorY - 28, w: 20, h: 28, dir: i % 2 ? -1 : 1, speed: 0.25 + i * 0.025, stunned: 0,
  }));
  // The giant teaches evasion in Level 1; capture/rescue patrols begin in later prototypes.
  if (!intro) enemies.push(...sentryXs);

  return {
    id: level.id, title: level.title, region: level.palette, summary: level.summary, goal: level.goal,
    width, height: 180, floorY, floors, pits, platforms, crates, enemies, checkpoints, switches,
    finish: { x: width - 55, y: floorY - 30, w: 28, h: 30 },
    giant: { x: -42, y: floorY - 40, speed: 0.018, caught: false },
    partySize: clamp(Number(partySize) || 1, 1, 14),
  };
}

export const REFERENCE_WIDTH = 960;
export const STANDARD_PURSUER_SPEED = (REFERENCE_WIDTH * 3 + 114) / (120 * 60);
// Authored obstacle positions, rather than the same route with a palette swap.
const ROUTES = {
  2: { pits: [340, 740, 1190, 1660, 2240], ledges: [210, 600, 1020, 1530, 2100], theme: 'transit', enemy: ['grabber', 'scanner', 'grabber', 'sentinel'] },
  3: { pits: [420, 860, 1280, 1760, 2320], ledges: [180, 540, 710, 1030, 1460, 1620, 2010, 2500], theme: 'rooftops', enemy: ['scanner', 'grabber', 'scanner', 'grabber'] },
  4: { pits: [380, 990, 1530, 2130], ledges: [240, 680, 1250, 1890, 2460], theme: 'searchlights', enemy: ['sentinel', 'grabber', 'sentinel', 'creeper'] },
  5: { pits: [390, 910, 1430, 2020, 2570, 3180, 3770, 4430], ledges: [250, 750, 1210, 1780, 2350, 2910, 3520, 4160, 4700], theme: 'barricades', enemy: ['grabber', 'sentinel', 'creeper', 'grabber'] },
  6: { pits: [320, 810, 1360, 1820, 2390], ledges: [170, 580, 1110, 1630, 2150, 2580], theme: 'roots', enemy: ['grabber', 'scanner', 'grabber', 'creeper'] },
  7: { pits: [430, 760, 1140, 1740, 2210, 2530], ledges: [220, 580, 960, 1530, 1990, 2380], theme: 'river', enemy: ['scanner', 'creeper', 'grabber', 'scanner'] },
  8: { pits: [390, 950, 1410, 2050, 2490], ledges: [180, 570, 720, 1170, 1630, 1830, 2260], theme: 'canopy', enemy: ['scanner', 'scanner', 'grabber', 'scanner'] },
  9: { pits: [350, 820, 1240, 1910, 2360], ledges: [200, 610, 1070, 1640, 2130, 2600], theme: 'ranger', enemy: ['grabber', 'creeper', 'sentinel', 'grabber'] },
  10: { pits: [420, 1000, 1560, 2140, 2750, 3360, 4020, 4670], ledges: [230, 760, 1310, 1870, 2490, 3110, 3720, 4370, 4980], theme: 'covered', enemy: ['scanner', 'grabber', 'scanner', 'creeper'] },
  11: { pits: [360, 890, 1390, 1980, 2440], ledges: [190, 650, 1130, 1720, 2190, 2620], theme: 'conveyor', enemy: ['grabber', 'sentinel', 'grabber', 'creeper'] },
  12: { pits: [410, 810, 1260, 1780, 2210, 2530], ledges: [210, 600, 1020, 1510, 1990, 2390], theme: 'furnace', enemy: ['creeper', 'sentinel', 'creeper', 'sentinel'] },
  13: { pits: [380, 940, 1540, 2110, 2490], ledges: [200, 630, 1180, 1390, 1800, 2330], theme: 'prototype', enemy: ['scanner', 'creeper', 'sentinel', 'grabber'] },
  14: { pits: [330, 840, 1370, 1930, 2470], ledges: [170, 570, 1090, 1660, 2200, 2640], theme: 'powergrid', enemy: ['sentinel', 'scanner', 'creeper', 'grabber'] },
  15: { pits: [410, 1030, 1650, 2260, 2890, 3510, 4140, 4780, 5380], ledges: [240, 780, 1370, 1990, 2600, 3250, 3880, 4500, 5060, 5570], theme: 'core', enemy: ['sentinel', 'creeper', 'scanner', 'grabber'] },
};

export function buildLevel(levelId = 1, partySize = 1) {
  const level = getLevel(levelId);
  if (level.id === 1) {
    const world = buildReferenceLevel(1, partySize);
    world.theme = 'tutorial';
    world.giant.x = -114;
    world.giant.speed = (world.width + 114) / (120 * 60);
    world.giant.crossingSeconds = 120;
    world.giant.wakeTicks = 480;
    world.finish.locked = true;
    world.terrain = [];
    world.signs = [{ x: 100, text: 'SPACE: JUMP • E: RELAY' }, { x: 490, text: 'RED RELAY → E' }];
    return world;
  }
  const route = ROUTES[level.id];
  const milestone = level.id % 5 === 0;
  const width = milestone ? REFERENCE_WIDTH * (5 + level.id / 10) : REFERENCE_WIDTH * 3;
  const floorY = 151;
  const world = { id: level.id, title: level.title, region: level.palette, summary: level.summary, goal: level.goal,
    width, height: 180, floorY, theme: route.theme, partySize, floors: [], pits: [], platforms: [], crates: [], enemies: [],
    checkpoints: [], switches: [], terrain: [], signs: [], finish: { x: width - 55, y: 121, w: 28, h: 30, locked: true },
    giant: { x: -114, y: 111, speed: STANDARD_PURSUER_SPEED, crossingSeconds: (width + 114) / (STANDARD_PURSUER_SPEED * 60), wakeTicks: 480, caught: false } };
  let cursor = 0;
  for (const [index, x] of route.pits.entries()) {
    const w = gapWidthForParty(partySize, index % 4);
    world.floors.push({ x: cursor, y: floorY, w: x - cursor, h: 35 });
    world.pits.push({ x, y: floorY, w, h: 35, index });
    if (w > 48) {
      const count = Math.ceil(w / 30);
      for (let j = 1; j < count; j++) world.platforms.push({ x: x + w * j / count - 9, y: 137, w: 18, h: 6, kind: 'stone', pitIndex: index });
    }
    cursor = x + w;
  }
  world.floors.push({ x: cursor, y: floorY, w: width - cursor, h: 35 });
  for (const [i, x] of route.ledges.entries()) {
    world.platforms.push({ x, y: [119, 105, 124][i % 3], w: i % 2 ? 48 : 64, h: 6, kind: 'ledge' });
    if (i % 2 === 0) world.crates.push({ id: `crate-${i}`, x: x - 25, y: 137, w: 14, h: 14, vx: 0, vy: 0, carriedBy: null, used: false });
  }
  // Move shelters away from pits, with actual climbable roof/side steps.
  const positions = milestone ? [width / 3, width * 2 / 3] : [width / 2];
  for (let x of positions) {
    while (world.pits.some(p => x + 64 > p.x && x - 50 < p.x + p.w)) x += 90;
    const cp = { x: Math.round(x), y: 125, w: 48, h: 26, active: false, destroyed: false };
    world.checkpoints.push(cp);
    // Leave a full player-width of head clearance between roof and side steps.
    // Nearby decorative ledges must not form an inescapable low ceiling.
    world.platforms = world.platforms.filter(p => p.kind === 'stone' || p.x + p.w < cp.x - 50 || p.x > cp.x + cp.w + 50);
    world.platforms.push({ x: cp.x, y: 113, w: 48, h: 5, kind: 'shelter-roof', shelterX: cp.x },
      { x: cp.x - 31, y: 132, w: 15, h: 5, kind: 'step', shelterX: cp.x }, { x: cp.x + 64, y: 132, w: 15, h: 5, kind: 'step', shelterX: cp.x });
  }
  const bossX = milestone ? width - 690 : width;
  const switchXs = milestone ? [600, 1800, 3000] : [560, 1160, 2280];
  switchXs.filter(x => x < bossX - 150).forEach((x, i) => {
    const ledge = world.platforms.find(s => x + 20 >= s.x && x - 20 <= s.x + s.w);
    if (ledge) x = ledge.x + ledge.w + 32;
    const pit = world.pits.find(p => x + 20 > p.x && x < p.x + p.w);
    if (pit) x = pit.x + pit.w + 30;
    world.switches.push({ id: `relay-${i}`, x, y: 139, w: 10, h: 12, active: false, order: i });
  });
  for (const [i, kind] of route.enemy.entries()) {
    let x = 920 + i * (milestone ? 820 : 410);
    // Every patrol stays on one solid, outside shelter interiors and the arena.
    const floor = world.floors.find(f => f.x + 35 <= x && f.x + f.w - 50 >= x);
    if (!floor || x > bossX - 150 || world.checkpoints.some(c => Math.abs(c.x - x) < 100)) continue;
    world.enemies.push({ id: `robot-${i}`, kind, x, y: kind === 'scanner' ? 75 : 123, w: 20, h: 28,
      minX: Math.max(floor.x + 12, x - 60), maxX: Math.min(floor.x + floor.w - 30, x + 65),
      dir: i % 2 ? -1 : 1, speed: 0.25 + i * .025, stunned: 0, phase: 'patrol', timer: 0 });
  }
  if (['river', 'roots', 'ranger'].includes(route.theme)) world.terrain.push({ x: 980, w: 160, kind: 'water' });
  if (['conveyor', 'furnace', 'powergrid'].includes(route.theme)) world.terrain.push({ x: 1540, w: 170, kind: 'conveyor', direction: level.id % 2 ? 1 : -1 });
  if (milestone) {
    world.boss = { x: bossX, w: 650, kind: level.id === 5 ? 'gatewarden' : level.id === 10 ? 'gauntlet' : 'background',
      phase: 'waiting', timer: 0, elapsed: 0, cycle: 0, activeRelay: 0, solved: false, targetX: bossX + 320,
      pylons: [bossX + 100, bossX + 310, bossX + 520].map((x, i) => ({ x, y: 139, w: 12, h: 12, active: false, order: i })) };
    world.signs.push({ x: bossX - 80, text: 'BLAST DOOR • PURSUER CANNOT ENTER' });
    world.platforms.push({ x: bossX + 180, y: 116, w: 52, h: 6, kind: 'arena-cover' }, { x: bossX + 410, y: 108, w: 52, h: 6, kind: 'arena-cover' });
    if (level.id === 10) {
      world.coveredWay = { x: bossX - 480, w: 480, y: 65, drones: 100 };
      world.platforms.push({ x: bossX - 480, y: 65, w: 480, h: 7, kind: 'covered-roof' });
    }
  }
  world.signs.push({ x: 100, text: `${route.theme.toUpperCase()} • ${world.switches.length} RELAYS` });
  world.memory = { x: Math.round(width * .4), read: false };
  while (world.pits.some(p => world.memory.x + 20 > p.x && world.memory.x - 20 < p.x + p.w) ||
    world.platforms.some(p => world.memory.x + 24 > p.x && world.memory.x - 24 < p.x + p.w)) world.memory.x += 55;
  if ([3, 7, 9, 11, 14].includes(level.id)) {
    world.breakEffects = [];
    for (const [index, start] of [650, 1990].entries()) {
      let x = start;
      while (world.pits.some(p => x + 50 > p.x && x - 50 < p.x + p.w) ||
        world.platforms.some(p => x + 50 > p.x && x - 50 < p.x + p.w) ||
        world.switches.some(s => Math.abs(s.x - x) < 70) ||
        world.checkpoints.some(c => Math.abs(c.x - x) < 100)) x += 60;
      if (x > width - 180) continue;
      world.platforms.push({ id: 'salvage-' + index, x, y: 133, w: 20, h: 18, kind: 'breakable' });
      world.crates.push({ id: 'salvage-crate-' + index, x: x - 40, y: 137, w: 14, h: 14, vx: 0, vy: 0, carriedBy: null, used: false });
    }
  }
  if ([6, 8, 12, 13].includes(level.id)) {
    world.plates = [0, 3].map(index => {
      const pit = world.pits[index];
      const plate = { id: `plate-${index}`, x: pit.x - 70, y: floorY, w: 24, bridgeX: pit.x, bridgeW: pit.w, held: false, remaining: 0 };
      world.crates.push({ id: `plate-crate-${index}`, x: plate.x - 29, y: 137, w: 14, h: 14, vx: 0, vy: 0, carriedBy: null, used: false });
      return plate;
    });
  }
  return world;
}
