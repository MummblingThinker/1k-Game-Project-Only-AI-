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

export function buildLevel(levelId = 1, partySize = 1) {
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
