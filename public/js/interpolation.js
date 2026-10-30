// Rendering only: collisions, actions, timers and HUD always use authoritative state.
export class SnapshotInterpolator {
  constructor() { this.clear(); }
  clear() { this.previous = new Map(); this.current = new Map(); this.at = null; this.duration = 50; this.run = null; }
  push(snapshot, now) {
    const run = `${snapshot.roomCode}/${snapshot.runId}/${snapshot.phase}`;
    const rendered = this.sample(now);
    this.duration = this.at === null ? 50 : Math.max(30, Math.min(100, now - this.at));
    this.previous = new Map(); this.current = new Map();
    for (const p of snapshot.players) {
      const before = rendered.get(p.id);
      const canBlend = run === this.run && before && before.alive === p.alive &&
        before.carriedBy === p.carriedBy && !!before.capture === !!p.capture &&
        Math.hypot(before.x - p.x, before.y - p.y) < 120;
      this.previous.set(p.id, canBlend ? before : { ...p });
      this.current.set(p.id, { ...p });
    }
    this.at = now; this.run = run;
  }
  sample(now) {
    const blend = this.at === null ? 1 : Math.max(0, Math.min(1, (now - this.at) / this.duration));
    return new Map([...this.current].map(([id,p]) => {
      const before=this.previous.get(id) || p;
      return [id,{ ...p, x: before.x + (p.x-before.x)*blend, y: before.y + (p.y-before.y)*blend }];
    }));
  }
}
