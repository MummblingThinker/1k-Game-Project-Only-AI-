import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLevel } from '../public/js/world.js';
import { createPlayer, stepPlayer } from '../public/js/physics.js';
import { advanceSimulation } from '../public/js/timing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const PORT = Number(process.env.PORT || 4173);
const MAX_PLAYERS_PER_ROOM = 4;
const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true, credentials: false } });
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
  room.players.delete(socket.id);
  if (room.players.size === 0) {
    rooms.delete(code);
    return;
  }
  if (room.hostId === socket.id) room.hostId = room.players.keys().next().value;
  // A running level keeps its original geometry/hearts and shared switch state.
  if (room.phase === 'lobby') configureLobby(room);
  broadcastRoom(room);
  console.log(`[room ${code}] ${socket.id} ${reason}; ${room.players.size} remaining`);
}

function publicPlayer(p) {
  return {
    id: p.id, x: p.x, y: p.y, vx: p.vx, vy: p.vy, w: p.w, h: p.h,
    alive: p.alive, colorIndex: p.colorIndex, face: p.face,
    onGround: p.onGround, carryId: p.carryId, timeDead: p.timeDead || 0, slot: p.slot,
  };
}

function roomPayload(room, forSocketId) {
  const player = room.players.get(forSocketId);
  return {
    roomCode: room.code, level: room.level, partySize: room.partySize,
    playerId: forSocketId, hearts: room.hearts, heartMax: room.heartMax,
    gameOver: room.phase === 'gameover', phase: room.phase, hostId: room.hostId,
    runId: room.runId, objectiveVersion: room.objectiveVersion,
    world: room.world,
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
  room.players.set(socket.id, p);
  configureLobby(room);
  socketRoom.set(socket.id, room.code);
  socket.join(room.code);
  socket.emit('roomJoined', { roomCode: room.code, playerId: socket.id, playerCount: room.players.size, state: roomPayload(room, socket.id) });
  broadcastRoom(room);
  console.log(`[room ${room.code}] ${socket.id} joined; ${room.players.size} player(s)`);
}

function handleDeath(room, player) {
  if (!player.alive) return;
  player.alive = false;
  player.vx = 0; player.vy = 0;
  player.timeDead = Date.now();
  player.lastDeathAt = player.timeDead;
  room.hearts = Math.max(0, room.hearts - 1);
  if (room.hearts <= 0) room.phase = 'gameover';
}

function configureLobby(room) {
  room.partySize = room.players.size;
  room.heartMax = heartMaximum(room.partySize);
  room.hearts = room.heartMax;
  room.world = buildLevel(1, room.partySize);
}

function startRun(room) {
  room.partySize = room.players.size;
  room.heartMax = heartMaximum(room.partySize);
  room.hearts = room.heartMax;
  room.world = buildLevel(1, room.partySize);
  room.world.finish.locked = true;
  room.world.giant.x = -114;
  room.phase = 'playing';
  room.tick = 0;
  room.runId += 1;
  room.objectiveVersion = 0;
  for (const [id, previous] of room.players) {
    room.players.set(id, makePlayer(id, previous.slot, room.world));
  }
  broadcastRoom(room);
}

function activateSwitch(room, player) {
  if (room.phase !== 'playing' || !player?.alive) return;
  if (room.tick - (player.lastInteractionTick ?? -60) < 12) return;
  player.lastInteractionTick = room.tick;
  const sw = room.world.switches.find((s) => !s.active &&
    Math.abs(player.x + player.w / 2 - s.x - s.w / 2) < 26 &&
    Math.abs(player.y + player.h / 2 - s.y - s.h / 2) < 34);
  if (!sw) return;
  sw.active = true;
  sw.activatedBy = player.id;
  const pit = room.world.pits.find((p) => p.x >= sw.x && p.x - sw.x < 310);
  if (pit) room.world.platforms.push({ x: pit.x, y: room.world.floorY, w: pit.w, h: 8, kind: 'switch-bridge' });
  room.world.finish.locked = false;
  room.objectiveVersion += 1;
  broadcastRoom(room);
}

function processCheckpoint(room, player, previousX) {
  if (!player.alive) return;
  for (const checkpoint of room.world.checkpoints) {
    const crossed = previousX + player.w < checkpoint.x && player.x + player.w >= checkpoint.x;
    if (!crossed || checkpoint.active || checkpoint.destroyed) continue;
    checkpoint.active = true;
    const dead = [...room.players.values()].filter((p) => !p.alive).sort((a,b) => (a.lastDeathAt||0)-(b.lastDeathAt||0));
    if (dead.length) {
      const revive = dead[0];
      revive.alive = true; revive.x = checkpoint.x + 6; revive.y = room.world.floorY - revive.h;
      revive.vx = 0; revive.vy = 0; revive.input = { left:false,right:false,jump:false };
      revive.timeDead = 0; revive.carryId = null;
    } else {
      room.hearts = Math.min(room.heartMax, room.hearts + 1);
    }
  }
}

io.on('connection', (socket) => {
  socket.emit('serverHello', { ok: true, maxPlayersPerRoom: MAX_PLAYERS_PER_ROOM });
  socket.on('createRoom', () => {
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
    if (room && room.hostId === socket.id && room.phase === 'lobby') startRun(room);
  });
  socket.on('restartRun', () => {
    const room = rooms.get(socketRoom.get(socket.id));
    if (room && room.hostId === socket.id && ['victory', 'gameover'].includes(room.phase)) startRun(room);
  });
  socket.on('leaveRoom', () => leaveCurrentRoom(socket, 'left'));
  socket.on('disconnect', () => leaveCurrentRoom(socket, 'disconnected'));
});

function stepRooms() {
  for (const room of rooms.values()) {
    if (room.phase !== 'playing') continue;
    room.tick += 1;
    for (const player of room.players.values()) {
      if (!player.alive) continue;
      const previousX = player.x;
      if (room.tick - (player.lastInputTick ?? 0) > 90) player.input = {};
      stepPlayer(player, player.input, room.world, 1);
      processCheckpoint(room, player, previousX);
      if (player.y > room.world.height - 6) handleDeath(room, player);
      player.lastX = previousX;
    }
    const living = [...room.players.values()].filter((p) => p.alive);
    if (!living.length) room.phase = 'gameover';
    if (room.phase === 'playing') {
      const giant = room.world.giant;
      giant.x = Math.max(giant.x + giant.speed, Math.min(...living.map((p) => p.x)) - 124);
      for (const cp of room.world.checkpoints) {
        if (giant.x + 35 >= cp.x) { cp.destroyed = true; cp.active = false; }
      }
      for (const p of living) if (giant.x + 44 > p.x + 4) handleDeath(room, p);
      const survivors = [...room.players.values()].filter((p) => p.alive);
      if (!survivors.length) room.phase = 'gameover';
      else if (!room.world.finish.locked && survivors.every((p) =>
        p.x + p.w >= room.world.finish.x && p.y + p.h >= room.world.finish.y && p.y <= room.world.floorY)) room.phase = 'victory';
    }
    if (room.tick % 3 === 0 || room.phase !== 'playing') broadcastRoom(room);
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
