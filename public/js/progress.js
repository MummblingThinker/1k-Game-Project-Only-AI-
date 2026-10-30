const KEY = 'tiny-teamwork-solo-stage-v1';

export function readProgress(storage) {
  try {
    const value = JSON.parse(storage.getItem(KEY));
    if (value?.version !== 1 || !Number.isInteger(value.stage) || value.stage < 1 || value.stage > 15) return null;
    return { version: 1, stage: value.stage };
  } catch { return null; }
}

export function saveProgress(storage, stage) {
  if (!Number.isInteger(stage) || stage < 1 || stage > 15) return false;
  try { storage.setItem(KEY, JSON.stringify({ version: 1, stage })); return true; }
  catch { return false; }
}
