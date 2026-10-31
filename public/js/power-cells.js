export const POWER_CELL_RADIUS = 48;

// The burst disables nearby machines; damage still comes only from the direct hit.
export function dischargePowerCell(run, cell) {
  if (!cell.used || cell.kind !== 'battery' || cell.durable || cell.animal || cell.discharged) return 0;
  cell.discharged = true;
  const x = cell.x + cell.w / 2, y = cell.y + cell.h / 2;
  run.world.breakEffects.push({x,y,tick:run.tick,kind:'emp'});
  let count=0;
  for (const robot of run.world.enemies) {
    if (robot.dead || Math.hypot(robot.x+robot.w/2-x,robot.y+robot.h/2-y)>POWER_CELL_RADIUS) continue;
    robot.stunned=Math.max(robot.stunned||0,robot.size==='big'?45:120);
    robot.phase='stunned';count++;
  }
  return count;
}
