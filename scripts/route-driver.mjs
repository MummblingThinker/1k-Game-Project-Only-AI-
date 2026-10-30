// Test-only controller: reads public snapshots and returns ordinary input intentions.
export function routeIntent(s) {
  const p = s?.you, w = s?.world, b = w?.boss;
  if (!p?.alive || s.phase !== 'playing' || p.capture || p.carriedBy) return {input:{},interact:false};
  // Stagger departures so independent route bots do not all form accidental stacks.
  if (s.tick < p.slot * 100) return {input:{},interact:false};
  let target = w.switches.find(sw => !sw.active)?.x ?? w.finish.x + 2;
  if (b && !b.solved && !w.switches.some(sw => !sw.active)) {
    if (p.x < b.x) target = b.x + 30;
    else if (b.kind === 'gatewarden') target = b.pylons[[1,0,2][b.activeRelay] ?? 2].x;
    else if (b.kind === 'background' && b.phase === 'stunned') target = b.x + 310;
    else target = b.pylons.find(sw => !sw.active)?.x ?? b.x + 190;
    const leader=s.players.filter(p=>p.alive).sort((a,b)=>a.slot-b.slot)[0];
    if(p.x>=b.x && b.phase!=='waiting' && p.id!==leader?.id)target=b.x+50+p.slot*70;
    if ((b.phase === 'warning' || b.phase === 'attack') && Math.abs(p.x - b.targetX) < 90) target = b.targetX + (p.x >= b.targetX && b.targetX < b.x + b.w - 110 ? 100 : -100);
  }
  const scan=w.enemies.find(e=>e.kind==='scanner' && ['warning','attack'].includes(e.phase) && Math.abs(p.x-e.targetX)<40);
  if(scan)target=Math.max(target,scan.targetX+65);
  const pit = w.pits.some(q => p.x + p.w > q.x - 8 && p.x < q.x + q.w && !w.platforms.some(t => ['switch-bridge','pressure-bridge'].includes(t.kind) && t.x === q.x));
  const ledge = [...w.platforms,...w.crates.filter(c=>!c.used&&!c.carriedBy)].some(q => p.y + p.h > q.y + 3 && (target > p.x ? q.x >= p.x + p.w - 1 && q.x < p.x + p.w + 5 : p.x >= q.x + q.w - 1 && p.x < q.x + q.w + 5));
  const rescue = w.enemies.find(e => e.grabbedId && e.grabbedId !== p.id);
  if (rescue) target = rescue.x + 4;
  const robot = w.enemies.some(e => e.kind === 'grabber' && !e.stunned && Math.abs(p.x - e.x) < 36);
  const jumpStrike = b && b.kind !== 'background' && ((b.phase === 'warning' && b.timer < 24) || b.phase === 'attack') && Math.abs(p.x - b.targetX) < 80;
  const groundStrike=w.enemies.some(e=>e.kind!=='scanner' && ((e.phase==='warning' && e.timer<28)||e.phase==='attack') && Math.abs(p.x-e.targetX)<(e.kind==='creeper'?62:40));
  // Land on the approach ledge before attempting another gap. Walking off a
  // shelter step during an earlier jump is not a valid jump across the next pit.
  const settle=!p.onGround&&p.vy>=0&&target>p.x&&w.pits.some(q=>p.x<q.x&&p.x+p.w>q.x-28&&!w.platforms.some(t=>['switch-bridge','pressure-bridge'].includes(t.kind)&&t.x===q.x));
  // A narrow stepping stone may be occupied between two 20Hz snapshots.
  // Press shortly before landing, using the same jump buffer available to humans.
  const landingSoon=p.vy>0&&[...w.floors,...w.platforms,...w.crates.filter(c=>!c.used&&!c.carriedBy)].some(q=>p.x+p.w>q.x&&p.x<q.x+q.w&&p.y+p.h<=q.y&&q.y-p.y-p.h<=Math.max(8,p.vy*4));
  return {input:{ right: !settle&&p.x < target - 3, left: p.x > target + 5, jump: !!(p.onGround||landingSoon) && (pit || ledge || robot || jumpStrike || groundStrike) },interact:Math.abs(p.x-target)<23};
}
