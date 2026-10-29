import { CAMPAIGN, getLevel, STORY_BEATS } from './campaign.js';
import { buildLevel } from './world.js';
import { createPlayer, overlaps, stepPlayer, updateCrates } from './physics.js';
import { drawGame, drawTitle, drawCutscenePanel } from './art.js';
import { NetworkClient } from './network.js';
import { advanceSimulation } from './timing.js';
import { createTextUI } from './text-ui.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;
const $ = (id) => document.getElementById(id);
const startStoryButton = $('start-story');
const playSelectedButton = $('play-selected');
const levelSelect = $('level-select');
const createRoomButton = $('create-room');
const joinRoomButton = $('join-room');
const leaveRoomButton = $('leave-room');
const roomCodeInput = $('room-code');
const roomStatus = $('room-status');
const networkPill = $('network-pill');
const liveStatus = $('live-status');
const missionTitle = $('mission-title');
const missionCopy = $('mission-copy');
const regionBadge = $('region-badge');
const resultPanel = $('result-panel');
const routeProgress = $('route-progress');
const routeLabel = $('route-label');
const heartReadout = $('heart-readout');
const updateTextUI = createTextUI();

const keys = new Set();
const justPressed = new Set();
const touchInput = { left: false, right: false, jump: false, interact: false };
let gameState = 'title';
let currentLevel = 1;
let partySize = 1;
let maxHearts = 3;
let hearts = 3;
let player = createPlayer();
let peers = [];
let world = buildLevel(1, 1);
let previousPlayerX = player.x;
let checkpointCursor = 0;
let capture = null;
let message = '';
let messageTimer = 0;
let clock = 0;
let cameraX = 0;
let startedIntro = false;
let lastFrame = performance.now();
const simulationTimer = { remaining: 0 };
let lastDeathTimestamp = 0;
let runStartedAt = 0;
let currentCutscene = null;
let cutscenePanelIndex = 0;
let cutscenePanelStart = 0;
let cutsceneDone = null;
let lastInteractionAt = 0;
let lastSnapshot = null;
let panelSignature = '';
let roomUiSignature = '';

function maxHeartForParty(n) { return Math.min(10, n <= 1 ? 3 : 3 + Math.ceil((n - 1) / 2)); }
function regionName(region) { return region === 'city' ? 'CITY' : region === 'forest' ? 'FOREST' : 'ROBOT FACTORY'; }
function announce(text, duration = 2000) { message = text; messageTimer = duration; liveStatus.textContent = text.toUpperCase(); syncTextUI(); }
function updatePanel() {
  const signature = `${currentLevel}/${hearts}`;
  if (signature === panelSignature) return;
  panelSignature = signature;
  const level = getLevel(currentLevel);
  missionTitle.textContent = level.title;
  missionCopy.textContent = level.summary;
  regionBadge.textContent = `${level.region} · LEVEL ${String(level.id).padStart(2,'0')}`;
  heartReadout.textContent = `${'♥ '.repeat(Math.max(0,hearts)).trim()}${hearts === 0 ? '—' : ''}`;
  if (!heartReadout.textContent) heartReadout.textContent = '—';
}
function buildWorld(levelId, keepHearts = false) {
  currentLevel = Math.max(1, Math.min(15, Number(levelId) || 1));
  world = buildLevel(currentLevel, partySize);
  const y = world.floorY - player.h;
  player = createPlayer(player.id || 'local', 26, y, player.colorIndex || 0);
  peers = peers.map((p) => ({ ...p, y: world.floorY - (p.h || 22), alive: true, vx: 0, vy: 0 }));
  if (!keepHearts) { maxHearts = maxHeartForParty(partySize); hearts = maxHearts; }
  capture = null;
  checkpointCursor = 0;
  previousPlayerX = player.x;
  cameraX = 0;
  world.giant.x = player.x - 140;
  world.giant.speed = 0.17;
  world.giant.caught = false;
  runStartedAt = performance.now();
  updatePanel();
}

const network = new NetworkClient({
  onStatus(text, online) {
    const pill = online ? 'CONNECTED' : 'OFFLINE';
    if (roomStatus.textContent === text && networkPill.textContent === pill) return;
    roomStatus.textContent = text;
    networkPill.textContent = online ? 'CONNECTED' : 'OFFLINE';
    networkPill.classList.toggle('online', !!online);
    networkPill.classList.toggle('offline', !online);
    leaveRoomButton.disabled = !network.inRoom;
    createRoomButton.disabled = network.inRoom;
    joinRoomButton.disabled = network.inRoom;
  },
  onState(data) {
    lastSnapshot = data;
    if (!data) {
      roomUiSignature = '';
      peers = [];
      gameState = 'title';
      keys.clear();
      startStoryButton.textContent = 'Start Story';
      startStoryButton.disabled = false;
      playSelectedButton.disabled = false;
      levelSelect.disabled = false;
      $('replay-level').textContent = 'Replay Level 1 / R';
      $('replay-level').disabled = false;
      $('result-menu').textContent = 'Return to title / Enter';
      $('room-roster').textContent = '';
      $('objective-status').textContent = 'Create or join a room to play Level 1 together.';
      partySize = 1;
      maxHearts = maxHeartForParty(1);
      hearts = maxHearts;
      if (gameState !== 'title' && !network.inRoom) {
        player = createPlayer('local', player.x, player.y, 0);
      }
      updatePanel();
      syncTextUI();
      return;
    }
    const phaseChanged = gameState !== data.phase;
    const runChanged = world.runId !== data.runId;
    currentLevel = data.level;
    partySize = data.partySize;
    maxHearts = data.heartMax;
    hearts = data.hearts;
    world = { ...data.world, runId: data.runId };
    player = { ...data.you };
    peers = data.players.filter((p) => p.id !== data.playerId);
    gameState = data.phase;
    if (runChanged) cameraX = 0;
    currentCutscene = null;
    const host = data.hostId === data.playerId;
    const signature = JSON.stringify([data.roomCode, data.phase, data.hostId, data.objectiveVersion,
      data.players.map((p) => [p.id, p.slot, p.alive])]);
    if (signature !== roomUiSignature) {
      roomUiSignature = signature;
    startStoryButton.textContent = host ? 'Start co-op run' : 'Waiting for host to start';
    startStoryButton.disabled = !host || data.phase !== 'lobby';
    playSelectedButton.disabled = true;
    levelSelect.disabled = true;
    $('replay-level').textContent = host ? 'Replay room / R' : 'Waiting for host to replay';
    $('replay-level').disabled = !host;
    $('result-menu').textContent = 'Leave room / Return to title';
    $('objective-status').textContent = data.phase === 'lobby' ? 'Share this room code, then the host starts the run.'
      : world.finish.locked ? 'Relay OFF / Gate locked. Press E near the red switch to help your team cross.'
      : 'Relay ON / Bridge open. All living survivors must reach the shelter gate.';
    $('room-roster').textContent = data.players.map((p) => `${p.id === data.playerId ? 'YOU: ' : ''}Survivor ${p.slot + 1}${p.id === data.hostId ? ' (host)' : ''} - ${p.alive ? 'active' : 'down'}`).join(' | ');
    }
    updatePanel();
    if (phaseChanged) {
      if (data.phase === 'playing') canvas.focus({ preventScroll: true });
      keys.clear();
      announce(data.phase === 'victory' ? 'TEAM ESCAPED / LEVEL 1 COMPLETE'
        : data.phase === 'gameover' ? 'RUN OVER / HOST CAN RESTART WITH R'
        : data.phase === 'lobby' ? 'ROOM READY / SHARE THE CODE'
        : 'ACTIVATE THE RELAY / GET EVERY SURVIVOR TO THE SHELTER');
    }
    syncTextUI();
  },
});

function startCutscene(key, done) {
  currentCutscene = STORY_BEATS[key];
  if (!currentCutscene) { if (done) done(); return; }
  currentCutscene.key = key;
  cutscenePanelIndex = 0;
  cutscenePanelStart = performance.now();
  cutsceneDone = done || null;
  gameState = 'cutscene';
  announce(`${currentCutscene.title} · STORY SCENE`, 1000);
}
function finishCutscene() {
  const done = cutsceneDone;
  currentCutscene = null;
  cutsceneDone = null;
  if (done) done();
}
function advanceCutscene() {
  if (!currentCutscene) return;
  cutscenePanelIndex += 1;
  if (cutscenePanelIndex >= currentCutscene.panels.length) finishCutscene();
  else cutscenePanelStart = performance.now();
}
function startStory() {
  startedIntro = true;
  startCutscene('opening', () => {
    buildWorld(1);
    gameState = 'playing';
    announce('GET OUT OF THE CITY · REACH THE SHELTER GATE', 2800);
  });
}
function loadSelectedLevel() {
  buildWorld(Number(levelSelect.value));
  gameState = 'playing';
  announce(`LEVEL ${String(currentLevel).padStart(2,'0')} · ${getLevel(currentLevel).title}`, 2200);
}
function levelComplete() {
  if (network.inRoom) {
    announce('CO-OP MOVEMENT SLICE · LEVEL TRANSITION SYNC COMES NEXT', 3500);
    return;
  }
  if (currentLevel === 1) {
    gameState = 'victory';
    keys.clear();
    announce('LEVEL 1 COMPLETE / SHELTER REACHED / R TO REPLAY', 5000);
    return;
  }
  const completed = currentLevel;
  if (completed === 5) {
    startCutscene('after5', () => { buildWorld(6); gameState = 'playing'; announce('THE ROBOTS HAVE FOLLOWED YOU INTO THE FOREST', 2500); });
  } else if (completed === 10) {
    startCutscene('after10', () => { buildWorld(11); gameState = 'playing'; announce('INSIDE THE ROBOT-MAKING FACILITY', 2500); });
  } else if (completed === 15) {
    startCutscene('after15', () => { gameState = 'ending'; announce('THE FACTORY IS SILENT. THE WAR IS NOT OVER.', 5000); });
  } else {
    buildWorld(completed + 1);
    gameState = 'playing';
    announce(`LEVEL ${String(currentLevel).padStart(2,'0')} · ${getLevel(currentLevel).title}`, 1800);
  }
}
function returnToTitle() {
  if (network.inRoom) network.leaveRoom();
  gameState = 'title';
  capture = null;
  currentCutscene = null;
  updatePanel();
  announce('READY · PRESS START');
}
function triggerDeath(reason) {
  if (!player.alive || gameState !== 'playing') return;
  player.alive = false;
  player.vx = 0; player.vy = 0;
  hearts = Math.max(0, hearts - 1);
  lastDeathTimestamp = performance.now();
  capture = null;
  updatePanel();
  announce(`${reason} · ONE TEAM HEART LOST`, 2800);
  // The solo fallback ends the run; multiplayer deaths remain dead until a segment boundary.
  if (network.inRoom) return;
  const anyOtherAlive = peers.some((p) => p.alive);
  if (!anyOtherAlive) {
    gameState = 'gameover';
    announce(hearts === 0 ? 'NO TEAM HEARTS LEFT · RUN OVER' : 'YOU ARE DOWN · RESTART THE RUN', 5000);
  }
}
function restartRun() {
  if (network.inRoom) {
    network.restartRun();
    return;
  }
  buildWorld(currentLevel);
  gameState = 'playing';
  announce('RUN RESTARTED · STAY TOGETHER', 2200);
}

function near(a, b, distance = 19) {
  const ax = a.x + a.w/2, ay = a.y + a.h/2;
  const bx = b.x + b.w/2, by = b.y + b.h/2;
  return Math.abs(ax-bx) < distance && Math.abs(ay-by) < distance + 8;
}
function interact() {
  if (network.inRoom) { network.interact(); return; }
  const now = performance.now();
  if (now - lastInteractionAt < 180) return;
  lastInteractionAt = now;
  if (capture) { announce('STRUGGLE · ALTERNATE LEFT AND RIGHT', 900); return; }
  if (player.carryId) {
    const crate = world.crates.find((c) => c.id === player.carryId);
    if (crate) {
      crate.carriedBy = null; crate.x = player.x + (player.face > 0 ? player.w+1 : -crate.w-1);
      crate.y = player.y - 2; crate.vx = player.face * 2.45; crate.vy = -2.5;
      player.carryId = null;
      announce('CRATE THROWN · USE IT AS A STEP OR BRIDGE PROP', 1700);
    }
    return;
  }
  const crate = world.crates.find((c) => !c.used && !c.carriedBy && near(player, c, 22));
  if (crate) {
    crate.carriedBy = player.id; player.carryId = crate.id;
    announce('CRATE PICKED UP · PRESS E AGAIN TO THROW', 1600);
    return;
  }
  const sw = world.switches.find((s) => !s.active && near(player, s, 26));
  if (sw) {
    sw.active = true;
    announce('SWITCH ACTIVATED · A ROUTE OPENS SOMEWHERE AHEAD', 2000);
    // The switch retracts one nearby platform's hazard marker and creates a useful step.
    const pit = world.pits.find((p) => p.x >= sw.x && p.x - sw.x < 310);
    if (pit && !world.platforms.some((p) => p.kind === 'switch-bridge' && Math.abs(p.x-pit.x)<20)) {
      world.platforms.push({ x: pit.x + pit.w/2 - 10, y: world.floorY-14, w: 20, h: 5, kind: 'switch-bridge' });
    }
    return;
  }
  const checkpoint = world.checkpoints.find((c) => !c.destroyed && near(player, c, 32));
  if (checkpoint) {
    checkpoint.active = true;
    announce('CHECKPOINT SHELTER · SAFE FROM ORDINARY ROBOTS', 1800);
    return;
  }
  announce('NO INTERACTION IN RANGE', 900);
}

function updateOffline(dtFrames, input, dtMs) {
  if (!player.alive) return;
  previousPlayerX = player.x;
  if (capture) {
    capture.remaining -= dtMs / 1000;
    const directionNow = input.left ? 'L' : input.right ? 'R' : null;
    if (directionNow && directionNow !== capture.lastDirection) {
      if (capture.lastDirection && directionNow !== capture.lastDirection) capture.struggle += 1;
      capture.lastDirection = directionNow;
      if (capture.struggle <= 4) capture.remaining += 0.12;
    }
    const enemy = world.enemies.find((e) => e.id === capture.enemyId);
    if (enemy) { player.x = enemy.x + 4; player.y = world.floorY - player.h; }
    if (capture.remaining <= 0) triggerDeath('ROBOT CAPTURED YOU');
  } else {
    stepPlayer(player, input, world, dtFrames);
  }
  updateCrates(world, dtFrames);

  const safeCheckpoint = world.checkpoints.find((cp) => !cp.destroyed && player.x + player.w > cp.x && player.x < cp.x + cp.w && player.y + player.h >= world.floorY - 3);
  for (const enemy of world.enemies) {
    if (enemy.dead || enemy.stunned > 0) { enemy.stunned = Math.max(0, (enemy.stunned||0) - dtFrames); continue; }
    const nextX = enemy.x + enemy.dir * enemy.speed * dtFrames;
    const blockedRoom = world.checkpoints.find((cp) => !cp.destroyed && nextX + enemy.w > cp.x && nextX < cp.x + cp.w);
    if (blockedRoom) {
      // Ordinary robots cannot enter safe rooms. Once the giant destroys one, the barrier disappears.
      if (enemy.dir > 0) enemy.x = blockedRoom.x - enemy.w;
      else enemy.x = blockedRoom.x + blockedRoom.w;
      enemy.dir *= -1;
    } else enemy.x = nextX;
    if (enemy.x < enemy.minX) { enemy.x = enemy.minX; enemy.dir = 1; }
    if (enemy.x > enemy.maxX) { enemy.x = enemy.maxX; enemy.dir = -1; }
    if (!safeCheckpoint && !capture && player.invulnerability <= 0 && overlaps(player, enemy)) {
      // Standing on a robot is not a weapon. Contact begins a visible capture countdown instead.
      capture = { enemyId: enemy.id, remaining: 2.7, lastDirection: null, struggle: 0 };
      announce('GRABBED! ALTERNATE A/D TO STRUGGLE · GET A TEAMMATE TO RESCUE YOU', 2600);
    }
  }

  // Segment boundaries give one recovery benefit: revive the longest-dead player, or restore one heart.
  if (player.alive) {
    for (const cp of world.checkpoints) {
      const crossed = previousPlayerX + player.w < cp.x && player.x + player.w >= cp.x;
      if (crossed && !cp.active && !cp.destroyed) {
        cp.active = true;
        if (hearts < maxHearts) hearts += 1;
        announce('CHECKPOINT REACHED · ONE TEAM HEART RECOVERED', 2200);
        updatePanel();
      }
    }
  }

  // The giant stays behind the camera line, but steadily eats into the gap if the team hesitates.
  world.giant.x = Math.max(world.giant.x + world.giant.speed * dtFrames, player.x - 124);
  for (const cp of world.checkpoints) {
    if (world.giant.x + 35 >= cp.x && !cp.destroyed) {
      cp.destroyed = true; cp.active = false;
      announce('THE GIANT BREACHED THE CHECKPOINT · KEEP MOVING', 2500);
    }
  }
  if (world.giant.x + 44 > player.x + 4) {
    world.giant.caught = true;
    triggerDeath('THE GIANT CAUGHT YOU');
  }
  if (player.y > world.height - 5) triggerDeath('FELL INTO THE PIT');
  if (player.x + player.w >= world.finish.x && player.alive && !capture) levelComplete();
}


function syncTextUI() {
  updateTextUI({ state: gameState, level: getLevel(currentLevel), hearts, maxHearts,
    roomCode: network.roomCode, isHost: lastSnapshot?.hostId === network.playerId,
    capture, panel: currentCutscene?.panels[cutscenePanelIndex] });
  // Read-only DOM telemetry for repeatable browser acceptance checks.
  const data = (key, value) => { if (canvas.dataset[key] !== value) canvas.dataset[key] = value; };
  data('state', gameState);
  data('playerX', player.x.toFixed(2));
  data('playerY', player.y.toFixed(2));
  data('alive', String(player.alive));
  data('hearts', String(hearts));
  data('room', network.roomCode || '');
  data('players', JSON.stringify([player, ...peers].map(({ id, x, y, alive }) => ({ id, x, y, alive }))));
  data('switchActive', String(world.switches.some((s) => s.active)));
  data('objectiveVersion', String(lastSnapshot?.objectiveVersion || 0));
  const won = gameState === 'victory';
  if (resultPanel.hidden !== !won) resultPanel.hidden = !won;
  const progress = Math.max(0, Math.min(100, Math.floor((player.x + player.w) / world.finish.x * 100)));
  const routeValue = gameState === 'title' || gameState === 'cutscene' ? 0 : progress;
  if (routeProgress.value !== routeValue) routeProgress.value = routeValue;
  const routeText = won ? 'Shelter reached. Replay or return to the title.' : gameState === 'title' || gameState === 'cutscene'
    ? 'Reach the shelter gate. Jump the gaps. Evade the robots.'
    : `SHELTER GATE / ${progress}% of route / ${gameState === 'paused' ? 'PAUSED' : gameState === 'gameover' ? 'RUN OVER / R to retry' : 'Space to jump / E to interact'}`;
  if (routeLabel.textContent !== routeText) routeLabel.textContent = routeText;
}

function draw() {
  syncTextUI();
  if (gameState === 'title') {
    drawTitle(ctx, clock);
  } else if (gameState === 'cutscene' && currentCutscene) {
    const panel = currentCutscene.panels[cutscenePanelIndex];
    const elapsed = performance.now() - cutscenePanelStart;
    drawCutscenePanel(ctx, panel, elapsed, 3600, clock);

  } else {
    const cameraTarget = Math.max(0, Math.min(world.width - 320, player.x - 108));
    cameraX += (cameraTarget - cameraX) * 0.16;
    drawGame(ctx, world, player, peers, cameraX, { clock, state: gameState });
  }
}

function update(dtMs) {
  clock += dtMs;
  if (messageTimer > 0) messageTimer -= dtMs;
  const dtFrames = Math.min(2.2, dtMs / (1000/60));
  if (gameState === 'cutscene' && currentCutscene) {
    if (performance.now() - cutscenePanelStart >= 3600) advanceCutscene();
  } else if (gameState === 'playing') {
    const input = {
      left: keys.has('ArrowLeft') || keys.has('KeyA') || touchInput.left,
      right: keys.has('ArrowRight') || keys.has('KeyD') || touchInput.right,
      jump: keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW') || touchInput.jump,
    };
    if (!network.inRoom && justPressed.has('KeyE')) interact();
    if (network.inRoom) {
      network.sendInput(input);

    } else {
      updateOffline(dtFrames, input, dtMs);
    }
  }
  justPressed.clear();
}

function frame(now) {
  const dtMs = Math.max(0, now - lastFrame);
  lastFrame = now;
  advanceSimulation(simulationTimer, dtMs, update);
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
  const key = event.code;
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) event.preventDefault();
  if (!keys.has(key)) justPressed.add(key);
  keys.add(key);
  if (key === 'Escape' && !event.repeat) {
    if (network.inRoom) { keys.clear(); network.sendInput({}, true); announce('ONLINE RUN KEEPS GOING / INPUT RELEASED'); }
    else if (gameState === 'playing') gameState = 'paused';
    else if (gameState === 'paused') gameState = 'playing';
  }
  if (network.inRoom && key === 'KeyE' && !event.repeat) network.interact();
  if (gameState === 'cutscene' && ['Space','Enter','ArrowRight'].includes(key) && !event.repeat) advanceCutscene();
  else if (gameState === 'title' && ['Space','Enter'].includes(key) && !event.repeat) startStory();
  if (gameState === 'lobby' && key === 'Enter' && !event.repeat) { event.preventDefault(); network.startRun(); }
  if (gameState === 'paused' && key === 'KeyR') restartRun();
  if (['gameover','victory'].includes(gameState) && key === 'KeyR') restartRun();
  if (['gameover','ending','victory'].includes(gameState) && key === 'Enter') {
    event.preventDefault();
    returnToTitle();
  }
  sendNetworkInput();
  syncTextUI();
});
window.addEventListener('keyup', (event) => { keys.delete(event.code); sendNetworkInput(); });
window.addEventListener('blur', () => { keys.clear(); touchInput.left=false; touchInput.right=false; touchInput.jump=false; touchInput.interact=false; sendNetworkInput(); });

$('replay-level').addEventListener('click', restartRun);
$('result-menu').addEventListener('click', returnToTitle);

startStoryButton.addEventListener('click', () => {
  if (network.inRoom) { network.startRun(); return; }
  if (gameState !== 'cutscene') startStory();
});
playSelectedButton.addEventListener('click', loadSelectedLevel);
createRoomButton.addEventListener('click', () => network.createRoom());
joinRoomButton.addEventListener('click', () => network.joinRoom(roomCodeInput.value));
leaveRoomButton.addEventListener('click', () => { network.leaveRoom(); partySize=1; buildWorld(1); returnToTitle(); });
roomCodeInput.addEventListener('input', () => { roomCodeInput.value = roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6); });
for (const button of document.querySelectorAll('[data-control]')) {
  const action = button.dataset.control;
  const press = (value) => {
    if (action === 'left') touchInput.left=value;
    if (action === 'right') touchInput.right=value;
    if (action === 'jump') touchInput.jump=value;
    if (action==='interact' && value) interact();
    sendNetworkInput();
  };
  button.addEventListener('pointerdown',(e)=>{e.preventDefault();button.setPointerCapture?.(e.pointerId);press(true);});
  button.addEventListener('pointerup',(e)=>{e.preventDefault();press(false);});
  button.addEventListener('pointercancel',()=>press(false));
  button.addEventListener('pointerleave',()=>press(false));
}

// Test builds may select a level from the URL, e.g. ?level=10.
const queryLevel = Number(new URLSearchParams(location.search).get('level'));
if (Number.isInteger(queryLevel) && queryLevel>=1 && queryLevel<=15) {
  levelSelect.value=String(queryLevel);
  buildWorld(queryLevel);
  gameState='playing';
  announce(`TEST LEVEL ${queryLevel}`, 1800);
} else {
  updatePanel();
  announce('READY · PRESS START');
}
requestAnimationFrame(frame);

// Input is independent of drawing cadence; blur/key-up immediately release remote movement.
function sendNetworkInput() {
  if (!network.inRoom) return;
  const playing = gameState === 'playing';
  network.sendInput({
    left: playing && (keys.has('ArrowLeft') || keys.has('KeyA') || touchInput.left),
    right: playing && (keys.has('ArrowRight') || keys.has('KeyD') || touchInput.right),
    jump: playing && (keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW') || touchInput.jump),
  }, true);
}
setInterval(sendNetworkInput, 100);
