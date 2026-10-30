import { CAMPAIGN, getLevel, STORY_BEATS } from './campaign.js';
import { buildLevel } from './world.js';
import { createPlayer, overlaps, stepPlayer, updateCrates } from './physics.js';
import { drawGame, drawTitle, drawCutscenePanel } from './art.js';
import { NetworkClient } from './network.js';
import { advanceSimulation } from './timing.js';
import { createTextUI } from './text-ui.js';
import { startLevel, stepRun, interactRun, objectiveText } from './simulation.js';

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
let soloRun = null;
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
let lastNotice = '';

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
function buildWorld(levelId) {
  currentLevel = Math.max(1, Math.min(15, Number(levelId) || 1));
  soloRun = { players: new Map([['local', createPlayer('local')]]), partySize: 1, runId: 0 };
  startLevel(soloRun, currentLevel, true);
  world = soloRun.world; player = soloRun.players.get('local'); peers = [];
  maxHearts = soloRun.heartMax; hearts = soloRun.hearts; capture = null; cameraX = 0;
  levelSelect.value = String(currentLevel);
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
      $('objective-status').textContent = 'Create or join a room to play the campaign together.';
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
    currentCutscene = data.phase === 'cutscene' ? STORY_BEATS[data.storyKey] : null;
    if (currentCutscene) {
      cutscenePanelIndex = Math.min(currentCutscene.panels.length - 1, Math.floor(data.storyTick / 480));
      cutscenePanelStart = performance.now() - (data.storyTick % 480) * 1000 / 60;
    }
    capture = player.capture || null;
    levelSelect.value = String(currentLevel);
    const host = data.hostId === data.playerId;
    const signature = JSON.stringify([data.roomCode, data.phase, data.hostId, data.objectiveVersion,
      data.level, data.objective, data.players.map((p) => [p.id, p.slot, p.alive, !!p.capture, !!p.carriedBy])]);
    if (signature !== roomUiSignature) {
      roomUiSignature = signature;
    startStoryButton.textContent = host ? 'Start co-op run' : 'Waiting for host to start';
    startStoryButton.disabled = !host || data.phase !== 'lobby';
    playSelectedButton.disabled = true;
    levelSelect.disabled = !(host && data.phase === 'lobby');
    $('replay-level').textContent = host ? 'Replay room / R' : 'Waiting for host to replay';
    $('replay-level').disabled = !host;
    $('result-menu').textContent = 'Leave room / Return to title';
    $('objective-status').textContent = data.phase === 'lobby' ? 'Share the code. Host can choose a practice stage before starting.' : data.objective;
    $('room-roster').textContent = data.players.map((p) => `${p.id === data.playerId ? 'YOU: ' : ''}Survivor ${p.slot + 1}${p.id === data.hostId ? ' (host)' : ''} - ${!p.alive ? 'down' : p.capture ? 'GRABBED' : p.carriedBy ? 'carried' : p.carryId ? 'carrying' : 'active'}`).join(' | ');
    }
    updatePanel();
    if (phaseChanged) {
      if (data.phase === 'playing') canvas.focus({ preventScroll: true });
      keys.clear();
      announce(data.phase === 'victory' ? `TEAM ESCAPED / LEVEL ${currentLevel} COMPLETE`
        : data.phase === 'gameover' ? 'RUN OVER / HOST CAN RESTART WITH R'
        : data.phase === 'lobby' ? 'ROOM READY / SHARE THE CODE'
        : 'ACTIVATE THE RELAY / GET EVERY SURVIVOR TO THE SHELTER');
    } else if (data.notice && data.notice !== lastNotice) announce(data.notice, 2600);
    lastNotice = data.notice || '';
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
  if (network.inRoom) { network.nextLevel(); return; }
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
  gameState = 'victory'; keys.clear();
  announce(`LEVEL ${currentLevel} COMPLETE / N TO CONTINUE / R TO REPLAY`, 5000);
}
function nextLevel() {
  if (network.inRoom) { network.nextLevel(); return; }
  if (gameState !== 'victory') return;
  const completed = currentLevel;
  const proceed = () => {
    if (completed === 15) { gameState = 'ending'; return; }
    buildWorld(completed + 1); gameState = 'playing'; canvas.focus();
    announce(`LEVEL ${currentLevel} / ${world.title}`);
  };
  if ([5,10,15].includes(completed)) startCutscene(`after${completed}`, proceed);
  else proceed();
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
function interact(action = 'use') {
  if (network.inRoom) { action === 'use' ? network.interact() : network.action(action); return; }
  if (soloRun && interactRun(soloRun, player.id, action)) announce(soloRun.notice);
}

function updateOffline(dtFrames, input, dtMs) {
  if (!soloRun) return;
  player.input = input;
  const previousNotice = soloRun.notice;
  stepRun(soloRun);
  world = soloRun.world; capture = player.capture || null;
  hearts = soloRun.hearts; maxHearts = soloRun.heartMax;
  if (soloRun.notice !== previousNotice) announce(soloRun.notice, 2600);
  if (soloRun.phase === 'victory') levelComplete();
  else if (soloRun.phase === 'gameover') gameState = 'gameover';
  updatePanel();
}


function syncTextUI() {
  updateTextUI({ state: gameState, level: getLevel(currentLevel), hearts, maxHearts,
    roomCode: network.roomCode, isHost: lastSnapshot?.hostId === network.playerId,
    capture, panel: currentCutscene?.panels[cutscenePanelIndex] });
  $('tactical-status').textContent = network.inRoom ? (lastSnapshot?.objective || '') : soloRun ? objectiveText(soloRun) : 'Solo story or 2–4 player co-op • 15 stages';
  $('continue-level').disabled = network.inRoom && lastSnapshot?.hostId !== network.playerId;
  $('result-kicker').textContent = `LEVEL ${String(currentLevel).padStart(2, '0')} COMPLETE`;
  $('replay-level').textContent = network.inRoom ? 'Replay stage / R' : 'Replay stage / R';
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
    drawCutscenePanel(ctx, panel, elapsed, 8000, clock);

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
    if (!network.inRoom && performance.now() - cutscenePanelStart >= 8000) advanceCutscene();
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
  if (key === 'KeyF' && !event.repeat) interact('carry');
  if (key === 'KeyQ' && !event.repeat) interact('drop');
  if (gameState === 'victory' && key === 'KeyN' && !event.repeat) nextLevel();
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

$('continue-level').addEventListener('click', nextLevel);
$('replay-level').addEventListener('click', restartRun);
levelSelect.addEventListener('change', () => { if (network.inRoom) network.selectLevel(Number(levelSelect.value)); });
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
    if (action==='carry' && value) interact('carry');
    if (action==='drop' && value) interact('drop');
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

