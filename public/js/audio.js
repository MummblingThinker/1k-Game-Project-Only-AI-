// Original synthesized cues. No recordings, network requests, or autoplay before a gesture.
export function createGameAudio(button, slider) {
  let context, master, voices = 0, previous = null, lastCueAt = 0, lastFootstepAt = 0;
  let enabled = true, volume = .25;
  let ambience, musicAt=0, beat=0, musicZone='', ambienceMix='';
  // Original, lightweight procedural scores. Noise beds and bass oscillators
  // run through the same saved mute/volume control as every gameplay cue.
  function createAmbience(){
    if(ambience)return;
    ambience={};
    const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=buffer.getChannelData(0);let smooth=0;
    for(let i=0;i<data.length;i++){smooth=(smooth+(Math.random()*2-1)*.035)/1.025;data[i]=smooth*5;}
    for(const zone of ['city','forest','factory']){
      const gain=context.createGain(),noise=context.createBufferSource(),filter=context.createBiquadFilter();
      gain.gain.value=0;gain.connect(master);noise.buffer=buffer;noise.loop=true;
      filter.type=zone==='factory'?'bandpass':'lowpass';filter.frequency.value=zone==='forest'?1400:zone==='city'?420:190;filter.Q.value=zone==='factory'?2:.5;
      noise.connect(filter);filter.connect(gain);noise.start();
      const hum=context.createOscillator(),humGain=context.createGain();hum.type=zone==='factory'?'triangle':'sine';hum.frequency.value=zone==='factory'?55:zone==='city'?73.42:98;
      humGain.gain.value=zone==='factory'?.16:.055;hum.connect(humGain);humGain.connect(gain);hum.start();
      ambience[zone]={gain,noise,filter,hum};
    }
  }
  function score(world,state,listener){
    const zone=world.id===11&&listener.x<(world.coveredWay?.x||0)?'forest':world.region||'city';
    button.dataset.audioZone=zone;
    if(!context||context.state!=='running'||!enabled)return;
    createAmbience();
    const active=['playing','title','lobby','paused','cutscene'].includes(state),now=context.currentTime;
    if(zone!==musicZone){musicZone=zone;musicAt=now;beat=0;button.dataset.audioZone=zone;}
    const mix=zone+':'+state;if(mix!==ambienceMix){ambienceMix=mix;for(const [key,bus] of Object.entries(ambience))bus.gain.gain.setTargetAtTime(active&&key===zone?(state==='cutscene'?.13:state==='paused'?.12:.35):0,now,.45);}
    if(!active||now<musicAt)return;
    const notes=zone==='city'?[146.83,0,220,261.63,0,196,174.61,0,146.83,220,293.66,0,261.63,196,0,0]
      :zone==='forest'?[196,293.66,0,329.63,392,0,293.66,246.94,196,0,246.94,293.66,440,392,0,0]
      :[110,0,110,164.81,0,130.81,0,146.83,110,0,164.81,0,130.81,0,98,0];
    const interval=zone==='factory'?.34:zone==='forest'?.56:.44, note=notes[beat%notes.length];
    if(note)tone(note,note,zone==='forest'?.7:.28,zone==='factory'?'triangle':'sine',0,state==='cutscene'?.045:.11);
    if(beat%4===0)tone(zone==='factory'?65:zone==='forest'?98:73.42,zone==='factory'?40:zone==='forest'?98:73.42,.55,'triangle',0,.1);
    if(zone==='factory'&&beat%2===1){tone(410+(beat%3)*90,90,.085,'square',0,.025);tone(80,45,.12,'triangle',0,.15);}
    if(zone==='forest'&&beat%8===5){tone(1200,1550,.12,'sine',0,.035);tone(1450,1100,.1,'sine',.17,.025);}
    beat++;musicAt=now+interval;
  }
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
  function tone(frequency, endFrequency, duration, type = 'triangle', delay = 0, strength=.7) {
    if (!enabled || !context || context.state !== 'running' || voices >= 12 || volume === 0) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(25, endFrequency), start + duration);
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(strength, start + .008);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(gain); gain.connect(master); voices++;
    oscillator.onended = () => { voices--; oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start + duration + .02);
  }
  function cue(kind) {
    if (kind === 'jump') tone(260, 580, .1);
    else if (kind === 'death') { tone(170, 38, .35, 'sawtooth'); tone(90, 30, .3, 'triangle', .05); }
    else if (kind === 'warning') { tone(620, 430, .1, 'square'); tone(620, 430, .1, 'square', .17); }
    else if (kind === 'boss-low') { tone(180, 360, .18, 'triangle', 0, .55); tone(270, 540, .18, 'triangle', .24, .45); }
    else if (kind === 'boss-high') { tone(540, 270, .18, 'triangle', 0, .55); tone(360, 180, .18, 'triangle', .24, .45); }
    else if (kind === 'boss-slam') { tone(840, 210, .15, 'square', 0, .35); tone(840, 210, .15, 'square', .23, .35); }
    else if (kind === 'boss-head') { tone(110, 55, .5, 'sawtooth', 0, .35); tone(880, 440, .16, 'triangle', 0, .5); tone(880, 440, .16, 'triangle', .26, .5); }
    else if (kind === 'core-open') [330, 495, 660].forEach((f, i) => tone(f, f, .18, 'sine', i * .1, .45));
    else if (kind === 'power-cell') { tone(900, 100, .15, 'sawtooth', 0, .28); tone(500, 1200, .09, 'triangle', .05, .35); }
    else if (kind === 'core-hit') { tone(140, 45, .18, 'sawtooth', 0, .35); tone(660, 990, .22, 'triangle', .04, .45); }
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
      score(world,state,listener);
      const warnings = world.enemies.filter(e => e.phase === 'warning' && Math.abs(e.x - listener.x) < 260).map(e => e.id);
      if (world.boss?.phase === 'warning' && listener.x >= world.boss.x) warnings.push('boss');
      const boss=world.boss, inArena=boss&&boss.phase!=='waiting'&&listener.x>=boss.x;
      const bossAttack=inArena&&!boss.solved?(boss.kind==='chainsaw'?boss.tree?.phase:boss.attack||boss.phase):null;
      const now = { bossAttack, bossHp: boss?.hp ?? null, bossSolved: !!boss?.solved, bossKind: boss?.kind, bossWeapon: boss?.weapon, state, level: world.id, hearts, vy: player.vy, capture: !!player.capture, captureSeconds: Math.ceil(player.capture?.remaining || 0),
        empTick: world.breakEffects?.filter(e=>e.kind==='emp').at(-1)?.tick ?? -1,
        checkpoints: world.checkpoints.filter(c => c.active).length, storyVisual, breakTick: world.breakEffects?.at(-1)?.tick ?? -1,
        blasts: world.enemies.filter(e => e.kind === 'creeper' && e.phase === 'attack' && Math.abs(e.x - listener.x) < 260).map(e => e.id),
        relays: world.switches.filter(s => s.active).length + (world.boss?.activeRelay || 0), warnings };
      if (previous && previous.level === now.level) {
        if (state === 'cutscene' && storyVisual !== previous.storyVisual) cue('story');
        if (now.state === 'victory' && previous.state !== 'victory') cue('victory');
        if (state === 'gameover' && previous.state === 'playing') cue('death');
        if (state === 'playing' && previous.state === 'playing') {
          if (inArena && now.bossKind === previous.bossKind) {
            if (now.bossSolved && !previous.bossSolved) cue('victory');
            else if (now.bossHp < previous.bossHp) cue('core-hit');
            if (bossAttack && bossAttack !== previous.bossAttack) {
              if (bossAttack === 'head-warning') cue('boss-head');
              else if (bossAttack === 'exposed') cue('core-open');
              else if (bossAttack === 'warning') cue(now.bossKind==='foundry'?(now.bossWeapon==='low'?'boss-low':now.bossWeapon==='high'?'boss-high':'boss-slam'):'boss-head');
              else if (bossAttack === 'laser-warning') cue('warning');
              else if (bossAttack === 'claw-warning') cue('boss-slam');
            }
          }
          if (hearts < previous.hearts) cue('death');
          else if (now.capture && !previous.capture) cue('capture');
          else if (!now.capture && previous.capture && player.alive) cue('rescue');
          else if (now.relays > previous.relays) cue('relay');
          else if (now.checkpoints > previous.checkpoints) cue('relay');
          if (now.empTick > previous.empTick) cue('power-cell');
          else if (now.breakTick > previous.breakTick) cue('break');
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
