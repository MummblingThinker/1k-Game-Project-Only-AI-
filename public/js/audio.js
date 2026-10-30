// Original synthesized cues. No recordings, network requests, or autoplay before a gesture.
export function createGameAudio(button, slider) {
  let context, master, voices = 0, previous = null, lastCueAt = 0, lastFootstepAt = 0;
  let enabled = true, volume = .25;
  try {
    const saved = JSON.parse(localStorage.getItem('tiny-teamwork-audio') || 'null');
    if (saved) { enabled = saved.enabled !== false; volume = Math.max(0, Math.min(1, Number(saved.volume) || 0)); }
  } catch {}
  const refresh = () => {
    button.textContent = enabled ? 'Sound on' : 'Sound off';
    button.setAttribute('aria-pressed', String(enabled));
    slider.value = String(Math.round(volume * 100));
    if (master && context) master.gain.setTargetAtTime(enabled ? volume * .18 : 0, context.currentTime, .03);
  };
  const save = () => { try { localStorage.setItem('tiny-teamwork-audio', JSON.stringify({ enabled, volume })); } catch {} };
  async function unlock() {
    if (!enabled) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { button.textContent = 'Sound unavailable'; button.disabled = true; return; }
    try {
      if (!context) {
        context = new Audio();
        master = context.createGain(); master.connect(context.destination);
        master.gain.value = volume * .18;
      }
      if (context.state === 'suspended') await context.resume();
      button.dataset.audioState = context.state;
    } catch { button.dataset.audioState = 'unavailable'; }
  }
  function tone(frequency, endFrequency, duration, type = 'triangle', delay = 0) {
    if (!enabled || !context || context.state !== 'running' || voices >= 12 || volume === 0) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), start + duration);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.7, start + .008);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(gain); gain.connect(master); voices++;
    oscillator.onended = () => { voices--; oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }
  function cue(kind) {
    if (kind === 'jump') tone(260, 580, .1);
    else if (kind === 'death') { tone(170, 38, .35, 'sawtooth'); tone(90, 30, .3, 'triangle', .05); }
    else if (kind === 'warning') { tone(620, 430, .1, 'square'); tone(620, 430, .1, 'square', .17); }
    else if (kind === 'capture') { tone(400, 160, .16, 'square'); tone(240, 100, .2, 'triangle', .14); }
    else if (kind === 'countdown') tone(740, 740, .06, 'square');
    else if (kind === 'blast') { tone(100, 25, .4, 'sawtooth'); tone(55, 30, .3, 'triangle'); }
    else if (kind === 'footstep') tone(65, 30, .22, 'triangle');
    else if (kind === 'break') tone(180, 65, .14, 'triangle');
    else if (kind === 'story') { tone(220, 220, .4); tone(330, 330, .5, 'triangle', .16); }
    else if (kind === 'relay' || kind === 'rescue') { tone(330, 330, .12); tone(495, 495, .15, 'triangle', .1); tone(660, 660, .2, 'triangle', .2); }
    else if (kind === 'victory') [330, 440, 550, 660].forEach((f, i) => tone(f, f, .3, 'triangle', i * .12));
  }
  button.addEventListener('click', () => { enabled = !enabled; refresh(); save(); if (enabled) { unlock().then(() => cue('relay')); } });
  slider.addEventListener('input', () => { volume = Number(slider.value) / 100; refresh(); save(); unlock(); });
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) context?.suspend().catch(() => {});
    else if (context && enabled) unlock();
  });
  refresh();
  return {
    observe({ state, world, player, listener = player, hearts, storyVisual }) {
      const warnings = world.enemies.filter(e => e.phase === 'warning' && Math.abs(e.x - listener.x) < 260).map(e => e.id);
      if (world.boss?.phase === 'warning' && listener.x >= world.boss.x) warnings.push('boss');
      const now = { state, level: world.id, hearts, vy: player.vy, capture: !!player.capture, captureSeconds: Math.ceil(player.capture?.remaining || 0),
        checkpoints: world.checkpoints.filter(c => c.active).length, storyVisual, breakTick: world.breakEffects?.at(-1)?.tick ?? -1,
        blasts: world.enemies.filter(e => e.kind === 'creeper' && e.phase === 'attack' && Math.abs(e.x - listener.x) < 260).map(e => e.id),
        relays: world.switches.filter(s => s.active).length + (world.boss?.activeRelay || 0), warnings };
      if (previous && previous.level === now.level) {
        if (state === 'cutscene' && storyVisual !== previous.storyVisual) cue('story');
        if (now.state === 'victory' && previous.state !== 'victory') cue('victory');
        if (state === 'gameover' && previous.state === 'playing') cue('death');
        if (state === 'playing' && previous.state === 'playing') {
          if (hearts < previous.hearts) cue('death');
          else if (now.capture && !previous.capture) cue('capture');
          else if (!now.capture && previous.capture && player.alive) cue('rescue');
          else if (now.relays > previous.relays) cue('relay');
          else if (now.checkpoints > previous.checkpoints) cue('relay');
          if (now.breakTick > previous.breakTick) cue('break');
          if (now.capture && previous.capture && now.captureSeconds < previous.captureSeconds) cue('countdown');
          if (now.blasts.some(id => !previous.blasts.includes(id))) cue('blast');
          if (now.vy < -3 && previous.vy >= 0) cue('jump');
          if (warnings.some(id => !previous.warnings.includes(id)) && performance.now() - lastCueAt > 250) {
            cue('warning'); lastCueAt = performance.now();
          }
          if (!world.giant.wakeTicks && Math.abs(listener.x - world.giant.x) < 260 && performance.now() - lastFootstepAt > 1100 && (!world.boss || listener.x < world.boss.x)) {
            cue('footstep'); lastFootstepAt = performance.now();
          }
        }
      }
      previous = now;
    },
  };
}
