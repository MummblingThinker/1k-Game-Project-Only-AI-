export const STEP_MS = 1000 / 60;

// Bound recovery after a suspended tab while keeping ordinary slow frames accurate.
export function advanceSimulation(timer, elapsedMs, step) {
  timer.remaining += Math.max(0, Math.min(1000, elapsedMs));
  while (timer.remaining + 1e-7 >= STEP_MS) {
    step(STEP_MS);
    timer.remaining -= STEP_MS;
  }
}
