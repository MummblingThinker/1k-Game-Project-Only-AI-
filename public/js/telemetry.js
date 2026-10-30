// Bounded, stage-local diagnostics. No account data, persistent storage or analytics.
export function recordRunEvent(run, type, detail = {}) {
  run.stageEvents ??= [];
  run.stageEvents.push({ tick: run.tick, seconds: Math.round(run.tick / 6) / 10, type, hearts: run.hearts, ...detail });
  if (run.stageEvents.length > 60) run.stageEvents.shift();
}

export function diagnosticReport(run) {
  if (!run?.world) return null;
  const players=[...run.players.values()];
  const alive=players.filter(p=>p.alive);
  return {
    schema:1, stage:run.level, title:run.world.title, run:run.runId || 0,
    phase:run.phase, seconds:Math.round((run.tick || 0)/6)/10,
    hearts:run.hearts, heartMaximum:run.heartMax, originalParty:run.partySize,
    lastAlive:alive.length===1?alive[0].slot+1:null,
    survivors:players.map(p=>({survivor:p.slot+1,alive:p.alive,x:Math.round(p.x),y:Math.round(p.y),captured:!!p.capture,carried:!!p.carriedBy})),
    route:{width:run.world.width,relays:run.world.switches.map(s=>({x:s.x,active:s.active})),giantX:Math.round(run.world.giant.x),boss:run.world.boss?{kind:run.world.boss.kind,phase:run.world.boss.phase,solved:run.world.boss.solved}:null},
    checkpoints:run.world.checkpoints.map(c=>({x:c.x,reachedAtSeconds:c.reachedTick==null?null:Math.round(c.reachedTick/6)/10,destroyed:c.destroyed})),
    events:(run.stageEvents || []).map(e=>({...e})),
  };
}
