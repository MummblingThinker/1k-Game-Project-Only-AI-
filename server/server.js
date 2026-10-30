import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLevel } from '../public/js/world.js';
import { createPlayer, stepPlayer } from '../public/js/physics.js';
import { advanceSimulation } from '../public/js/timing.js';
import { startLevel, stepRun, interactRun, releaseParticipant, objectiveText } from '../public/js/simulation.js';
import { STORY_BEATS } from '../public/js/campaign.js';
import { diagnosticReport } from '../public/js/telemetry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const PORT = Number(process.env.PORT || 4173);
const MAX_PLAYERS_PER_ROOM = 4;
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 4096 });
const rooms = new Map();
const socketRoom = new Map();
app.use(express.static(publicRoot));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'tiny-teamwork-server', rooms: rooms.size }));

function makeRoomCode() {
  let code;
  do {
    const bytes = randomBytes(6);
    code = [...bytes].map((byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join('');
  } while (rooms.has(code));
  return code;
}

function heartMaximum(count) {
  if (count <= 1) return 3;
  return Math.min(10, 3 + Math.ceil((count - 1) / 2));
}

function leaveCurrentRoom(socket, reason = 'left') {
  const code = socketRoom.get(socket.id);
  if (!code) return;
  socketRoom.delete(socket.id);
  socket.leave(code);
  const room = rooms.get(code);
  if (!room) return;
  releaseParticipant(room, room.players.get(socket.id));
  room.players.delete(socket.id);
  if (room.players.size === 0) {
    rooms.delete(code);
    return;
  }
  if (room.hostId === socket.id) { room.hostId = room.players.keys().next().value; room.players.get(room.hostId).ready = true; }
  // A running level keeps its original geometry/hearts and shared switch state.
  if (room.phase === 'lobby') configureLobby(room);
  broadcastRoom(room);
  console.log(`[room ${code}] ${socket.id} ${reason}; ${room.players.size} remaining`);
}

function publicPlayer(p) {
  return {
    id: p.id, x: p.x, y: p.y, vx: p.vx, vy: p.vy, w: p.w, h: p.h,
    alive: p.alive, colorIndex: p.colorIndex, face: p.face, ready: !!p.ready, gestureTicks: p.gestureTicks || 0, hitTicks: p.hitTicks || 0,
    capture: p.capture, carriedBy: p.carriedBy, invulnerability: p.invulnerability, onGround: p.onGround, carryId: p.carryId, timeDead: p.timeDead || 0, slot: p.slot,
  };
}

function roomPayload(room, forSocketId) {
  const player = room.players.get(forSocketId);
  return {
    roomCode: room.code, level: room.level, partySize: room.partySize,
    playerId: forSocketId, hearts: room.hearts, heartMax: room.heartMax,
    gameOver: room.phase === 'gameover', phase: room.phase, hostId: room.hostId,
    runId: room.runId, objectiveVersion: room.objectiveVersion,
    world: room.world, tick: room.tick, storyKey: room.storyKey, storyTick: room.storyTick, notice: room.notice, objective: objectiveText(room),
    players: [...room.players.values()].map(publicPlayer),
    you: player ? publicPlayer(player) : null,
  };
}

function broadcastRoom(room) {
  for (const socketId of room.players.keys()) io.to(socketId).emit('roomState', roomPayload(room, socketId));
}

function makePlayer(socketId, index, world) {
  const p = createPlayer(socketId, 27 + index * 17, world.floorY - 22, index % 3);
  p.lastDeathAt = 0;
  p.slot = index;
  p.lastX = p.x;
  p.input = { left: false, right: false, jump: false };
  return p;
}

function joinRoom(socket, room) {
  if (room.players.has(socket.id)) { broadcastRoom(room); return; }
  if (room.phase !== 'lobby') {
    socket.emit('roomError', 'This room has started. Ask the host to create a new lobby so everyone can join.');
    return;
  }
  if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
    socket.emit('roomError', `Room is full (maximum ${MAX_PLAYERS_PER_ROOM} players in this prototype).`);
    return;
  }
  leaveCurrentRoom(socket, 'switched rooms');
  const slot = [0, 1, 2, 3].find((index) => ![...room.players.values()].some((p) => p.slot === index));
  const p = makePlayer(socket.id, slot, room.world);
  p.ready = socket.id === room.hostId;
  room.players.set(socket.id, p);
  configureLobby(room);
  socketRoom.set(socket.id, room.code);
  socket.join(room.code);
  socket.emit('roomJoined', { roomCode: room.code, playerId: socket.id, playerCount: room.players.size, state: roomPayload(room, socket.id) });
  broadcastRoom(room);
  console.log(`[room ${room.code}] ${socket.id} joined; ${room.players.size} player(s)`);
}


function configureLobby(room) {
  room.partySize = room.players.size;
  room.heartMax = heartMaximum(room.partySize);
  room.hearts = room.heartMax;
  room.world = buildLevel(room.level, room.partySize);
}

function startRun(room) {
  startLevel(room, room.level, room.phase === 'lobby');
  broadcastRoom(room);
}
function continueCampaign(room) {
  if (room.phase === 'cutscene') {
    if (room.level === 15) { room.phase = 'ending'; room.storyKey = null; }
    else { startLevel(room, room.level + 1); room.storyKey = null; }
  } else if (room.phase === 'victory') {
    if ([5, 10, 15].includes(room.level)) { room.phase = 'cutscene'; room.storyKey = `after${room.level}`; room.storyTick = 0; }
    else startLevel(room, room.level + 1);
  }
  broadcastRoom(room);
}

function activateSwitch(room, player) {
  if (player && interactRun(room, player.id)) broadcastRoom(room);
}


io.on('connection', (socket) => {
  const rate = { window: Date.now(), input: 0, action: 0, creates: [] };
  socket.use((packet, next) => {
    if (Date.now() - rate.window >= 1000) { rate.window = Date.now(); rate.input = rate.action = 0; }
    const kind = packet[0] === 'input' ? 'input' : 'action';
    if (++rate[kind] > (kind === 'input' ? 120 : 20)) return;
    next();
  });
  socket.emit('serverHello', { ok: true, maxPlayersPerRoom: MAX_PLAYERS_PER_ROOM });
  let lastDiagnosticAt=0;
  socket.on('getDiagnostics',()=>{
    const room=rooms.get(socketRoom.get(socket.id)),now=Date.now();
    if(!room||now-lastDiagnosticAt<900)return;
    lastDiagnosticAt=now;
    socket.emit('diagnostics',{roomCode:room.code,runId:room.runId,report:diagnosticReport(room)});
  });
  socket.on('createRoom', () => {
    rate.creates = rate.creates.filter(time => Date.now() - time < 60000);
    if (rate.creates.length >= 8 || rooms.size >= 200) { socket.emit('roomError', 'Please wait before creating another room.'); return; }
    rate.creates.push(Date.now());
    leaveCurrentRoom(socket, 'replaced room');
    const code = makeRoomCode();
    const world = buildLevel(1, 1);
    const room = {
      code, level: 1, partySize: 0, heartMax: 3, hearts: 3, players: new Map(), world,
      phase: 'lobby', hostId: socket.id, tick: 0, runId: 0, objectiveVersion: 0,
    };
    rooms.set(code, room);
    joinRoom(socket, room);
  });
  socket.on('joinRoom', (payload = {}) => {
    if (!payload || typeof payload !== 'object' || typeof payload.roomCode !== 'string') {
      socket.emit('roomError', 'Enter a six-character room code.'); return;
    }
    const code = String(payload.roomCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const room = rooms.get(code);
    if (!room) { socket.emit('roomError', 'That room code was not found. Ask the host to create a room again.'); return; }
    joinRoom(socket, room);
  });
  socket.on('input', (input = {}) => {
    const code = socketRoom.get(socket.id);
    const room = code ? rooms.get(code) : null;
    const player = room?.players.get(socket.id);
    if (!player || room.phase !== 'playing' || !player.alive || !input || typeof input !== 'object') return;
    player.input = { left: input.left === true, right: input.right === true, jump: input.jump === true };
    player.lastInputTick = room.tick;
  });
  socket.on('interact', () => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (room) activateSwitch(room, room.players.get(socket.id));
  });
  socket.on('startRun', () => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (room && room.hostId === socket.id && room.phase === 'lobby') {
      if (![...room.players.values()].every(p => p.ready)) { socket.emit('roomError', 'Waiting for every survivor to be ready.'); return; }
      startRun(room);
    }
  });
  socket.on('ready', (data) => {
    const room = rooms.get(socketRoom.get(socket.id));
    const p = room?.players.get(socket.id);
    if (!p || room.phase !== 'lobby' || typeof data?.ready !== 'boolean') return;
    p.ready = socket.id === room.hostId ? true : data.ready;
    broadcastRoom(room);
  });
  socket.on('restartRun', () => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (room && room.hostId === socket.id && ['victory', 'gameover', 'ending'].includes(room.phase)) startRun(room);
  });
  socket.on('selectLevel', data => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (room?.hostId === socket.id && room.phase === 'lobby' && Number.isInteger(data?.level) && data.level >= 1 && data.level <= 15) {
      room.level = data.level; configureLobby(room); broadcastRoom(room);
    }
  });
  socket.on('nextLevel', () => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (room?.hostId === socket.id && ['victory', 'cutscene'].includes(room.phase)) continueCampaign(room);
  });
  for (const action of ['carry', 'drop']) socket.on(action, () => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (room && interactRun(room, socket.id, action)) broadcastRoom(room);
  });
  socket.on('leaveRoom' , () => leaveCurrentRoom(socket, 'left'));
  socket.on('disconnect', () => leaveCurrentRoom(socket, 'disconnected'));
});

function stepRooms() {
  for (const room of rooms.values()) {
    if (room.phase === 'playing') {
      for (const p of room.players.values()) if (room.tick - (p.lastInputTick ?? 0) > 90) p.input = {};
      stepRun(room);
      if (room.tick % 3 === 0 || room.phase !== 'playing') broadcastRoom(room);
    } else if (room.phase === 'cutscene') {
      room.storyTick++;
      if (room.storyTick >= STORY_BEATS[room.storyKey].panels.length * 480) continueCampaign(room);
      else if (room.storyTick % 6 === 0) broadcastRoom(room);
    }
  }
}
const simulationTimer = { remaining: 0 };
let lastStep = performance.now();
setInterval(() => {
  const now = performance.now();
  advanceSimulation(simulationTimer, now - lastStep, stepRooms);
  lastStep = now;
}, 1000 / 60);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Tiny Teamwork server listening on http://localhost:${PORT}`);
  console.log('Open the URL in two browsers to test room creation and synced movement.');
});
process.on('SIGTERM', () => {
  io.close(); server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
});
