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
    const copy = {
      title: ['A CO-OP PIXEL PLATFORMER', 'Tiny Teamwork', 'The Last Spark', 'Outrun the machines. Reach shelter together.', 'Press Enter or choose Start Story'],
      lobby: ['YOUR CO-OP ROOM', roomCode || '', 'Share the code with your team.', 'Everyone joins before the host starts the run.', isHost ? 'Choose Start co-op run or press Enter' : 'Waiting for the host to start'],
      paused: ['TAKE A BREATHER', 'Paused', '', 'Your solo run is paused.', 'Esc to resume / R to restart'],
      gameover: ['THE MACHINES ARE STILL OUT THERE', 'Run over', '', 'Your team is down. Try the escape again.', roomCode ? (isHost ? 'R to restart the room / Enter to leave' : 'Wait for the host to restart / Enter to leave') : 'R to try again / Enter for title'],
      ending: ['THE LAST SPARK', 'The factory is silent.', '', 'But red lights still glow in the dark. A new journey will be needed.', 'Press Enter to return to title'],
    }[state];
    if (copy) {
      ['scene-kicker', 'scene-title', 'scene-subtitle', 'scene-body', 'scene-hint'].forEach((id, index) => text(id, copy[index]));
    }
    story.hidden = state !== 'cutscene' || !panel;
    if (story.hidden) previousPanel = '';
    if (!story.hidden) {
      text('story-heading', panel.heading);
      text('story-caption', panel.caption);
      if (previousPanel !== panel.visual + panel.heading) {
        previousPanel = panel.visual + panel.heading;
        const visual = panel.visual;
        story.dataset.scene = visual;
        const quadrant = ['forestChase', 'gate'].includes(visual) ? 'forest'
          : ['swarm', 'factoryDoor', 'assemblyReveal'].includes(visual) ? 'factory'
          : ['celebration', 'darkTwist'].includes(visual) ? 'ending' : 'city';
        const cells = Array.from({ length: 3 }, (_, index) => {
          const cell = document.createElement('div');
          cell.className = `comic-cell comic-${quadrant}`;
          cell.style.setProperty('--panel', index);
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
