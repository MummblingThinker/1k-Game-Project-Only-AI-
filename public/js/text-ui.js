// Text stays at display resolution; only the world artwork uses the 320x180 canvas.
export function createTextUI() {
  const $ = (id) => document.getElementById(id);
  const hud = $('game-hud');
  const scene = $('scene-panel');
  const story = $('story-panel');
  const capturePanel = $('capture-panel');
  let previous = '';
  let previousPanel = '';
  const text = (id, value) => { const element = $(id); if (element.textContent !== value) element.textContent = value; };
  return ({ state, level, hearts, maxHearts, roomCode, isHost, capture, panel }) => {
    const signature = JSON.stringify([state, level.id, hearts, maxHearts, roomCode, isHost,
      capture?.remaining.toFixed(1), panel?.heading, panel?.caption]);
    if (signature === previous) return;
    previous = signature;
    hud.hidden = !['playing', 'paused', 'gameover', 'victory'].includes(state);
    text('hud-level', `LEVEL ${String(level.id).padStart(2, '0')} / ${level.title}`);
    text('hud-hearts', `Team hearts ${hearts} / ${maxHearts}`);
    scene.hidden = !['title', 'lobby', 'paused', 'gameover', 'ending'].includes(state);
    scene.dataset.mode = state;
    $('scene-actions').hidden=!['paused','gameover','ending'].includes(state);
    $('scene-retry').hidden=state==='ending';
    $('scene-retry').disabled=!!roomCode&&!isHost;
    text('scene-retry',roomCode&&!isHost?'Waiting for host':'Retry stage');
    text('scene-menu',roomCode?'Leave room':'Return to title');
    const copy = {
      title: ['A CO-OP PIXEL PLATFORMER', 'Tiny Teamwork', 'The Last Spark', 'Outrun the machines. Reach the exit together.', 'Press Enter or choose Start Story'],
      lobby: ['YOUR CO-OP ROOM', roomCode || '', 'Share the code with your team.', 'Everyone joins before the host starts the run.', isHost ? 'Choose Start co-op run or press Enter' : 'Waiting for the host to start'],
      paused: ['TAKE A BREATHER', 'Paused', '', 'Your solo run is paused.', 'Esc to resume / R to restart'],
      gameover: ['THE MACHINES ARE STILL OUT THERE', 'Run over', '', 'Your team is down. Try the escape again.', roomCode ? (isHost ? 'R to restart the room / Enter to leave' : 'Wait for the host to restart / Enter to leave') : 'R to try again / Enter for title'],
        ending: ['THE LAST SPARK', 'The factory is silent.', '', 'The survivors never see the red lights awaken behind them. Then, darkness.', 'Press Enter to return to title'],
    }[state];
    if (copy) {
      ['scene-kicker', 'scene-title', 'scene-subtitle', 'scene-body', 'scene-hint'].forEach((id, index) => text(id, copy[index]));
    }
    story.hidden = state !== 'cutscene' || !panel;
    if (story.hidden) previousPanel = '';
    if (!story.hidden) {
        text('story-next', roomCode ? (isHost ? 'Skip scene' : 'Host controls scene') : 'Next panel / Space');
        $('story-next').disabled = !!roomCode && !isHost;
      text('story-heading', panel.heading);
      text('story-caption', panel.caption);
      if (previousPanel !== panel.visual + panel.heading) {
        previousPanel = panel.visual + panel.heading;
        const visual = panel.visual;
        story.dataset.scene = visual;
        const detailQuadrant={survivors:'rescue',swarm:'swarm',assemblyReveal:'assembly',darkTwist:'ambush'}[visual];
        const quadrant = detailQuadrant || (['forestChase', 'gate'].includes(visual) ? 'forest'
          : ['swarm', 'factoryDoor', 'assemblyReveal'].includes(visual) ? 'factory'
          : ['celebration', 'darkTwist'].includes(visual) ? 'ending' : 'city');
          const notes = {
            invasion: ['Built to protect.', 'Ordered to obey.', 'Now, run.'],
            chase: ['Do not look back.', 'They are gaining.', 'Keep moving!'],
            survivors: ['One small spark.', 'A hand to hold.', 'Stay together.'],
            gate: ['The barricade falls.', 'Beyond the city.', 'Into the trees.'],
            forestChase: ['Branches break.', 'Red lights follow.', 'The hunt continues.'],
            treeFall: ['The saw is gaining.', 'Out of the shadow!', 'The forest fights back.'],
            swarm: ['A hundred eyes.', 'Stay beneath the roof.', 'No room for machines.'],
            factoryDoor: ['The door gives way.', 'Something is moving.', 'Listen.'],
            assemblyReveal: ['Another chassis.', 'Another awakening.', 'They never stop.'],
            celebration: ['The core is dark.', 'We made it.', 'For one breath.'],
            darkTwist: ['A light behind them.', 'Too late to turn.', 'Silence.'],
          }[visual] || ['', '', ''];
        const cells = Array.from({ length: 3 }, (_, index) => {
          const cell = document.createElement('div');
            cell.className = 'comic-cell';
          cell.style.setProperty('--panel', index);
            const art = document.createElement('div');
            art.className = 'comic-art comic-original';
            art.style.backgroundImage = `url('/assets/story/revision/${visual}.jpg')`;
            art.style.backgroundPosition = `${index*50}% 50%`;
            art.setAttribute('aria-hidden', 'true');
            const caption = document.createElement('span');
            caption.className = 'comic-note';
            caption.textContent = notes[index];
            cell.append(art, caption);
          return cell;
        });
        $('comic-panels').replaceChildren(...cells);
      }
    }
    capturePanel.hidden = state !== 'playing' || !capture;
    if (!capturePanel.hidden) {
      text('capture-heading', `Grabbed! ${Math.max(0, capture.remaining).toFixed(1)} seconds`);
      $('capture-time').value = Math.max(0, capture.remaining);
    }
  };
}
