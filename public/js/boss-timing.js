// Read the authoritative countdown. This display never changes combat timing.
export function bossTiming(boss) {
  if (!boss || boss.solved || boss.phase === 'waiting') return null;
  const attack = boss.attack || '';
  let duration, label, mood = 'warning', remaining = false;
  if (attack === 'exposed') { duration = 480; label = 'Core opening remaining'; mood = 'opening'; remaining = true; }
  else if (attack === 'head-warning') { duration = 90; label = 'Head lands in'; }
  else if (attack === 'warning') { duration = 90; label = 'Arm strikes in'; }
  else if (attack.endsWith('-warning')) { duration = boss.attackDuration || (boss.hp <= boss.maxHp / 2 ? 66 : 84); label = 'Attack strikes in'; }
  else if (attack === 'strike' || attack.endsWith('-strike') || attack === 'head-slam') return {value: 1, mood: 'danger', label: 'Attack active - keep clear'};
  else return null;
  const fraction = Math.max(0, Math.min(1, (boss.attackTimer || 0) / duration));
  const seconds = Math.max(0, Math.ceil((boss.attackTimer || 0) / 60));
  return {value: remaining ? fraction : 1 - fraction, mood, label: `${label}: ${seconds} second${seconds === 1 ? '' : 's'}`};
}
