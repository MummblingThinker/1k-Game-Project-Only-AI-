import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { createRequire } from 'node:module';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const remote = process.env.TEST_BASE_URL?.replace(/\/$/, '');
if (remote && new URL(remote).protocol !== 'https:') throw new Error('Remote tests require HTTPS');
try { createRequire(import.meta.url).resolve('socket.io'); }
catch { if (!remote) { console.log('SKIP multiplayer: run npm install to enable live server tests. Offline checks remain available.'); process.exit(0); } }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(predicate, label, timeout = 6000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (predicate()) return; await sleep(15); }
  throw new Error(`Timed out: ${label}`);
}
const port = remote ? null : await new Promise((resolve) => {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1', () => { const p = listener.address().port; listener.close(() => resolve(p)); });
});
const base = remote || `http://127.0.0.1:${port}`;
const child = remote ? null : spawn(process.execPath, ['server/server.js'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
child?.stdout.on('data', (chunk) => { logs += chunk; });
child?.stderr.on('data', (chunk) => { logs += chunk; });
const peers = [];

// Exercise actual Socket.IO over WebSockets without another production/test dependency.
// Engine.IO open/ping/message and Socket.IO connect/event frames are text packets.
class Peer extends EventEmitter {
  constructor() {
    super();
    this.errors = [];
    this.events = [];
    this.ws = new WebSocket(`${base.replace(/^http/, 'ws')}/socket.io/?EIO=4&transport=websocket`);
    this.ws.addEventListener('error', () => {});
    this.ws.addEventListener('message', ({ data }) => {
      const frame = String(data);
      if (frame.startsWith('0')) this.ws.send('40');
      else if (frame === '2') this.ws.send('3');
      else if (frame.startsWith('42')) {
        const [event, payload] = JSON.parse(frame.slice(2));
        this.events.push({ event, payload });
        if (event === 'serverHello') this.connected = true;
        if (event === 'roomState') this.state = payload;
        if (event === 'roomJoined') { this.state = payload.state; this.id = payload.playerId; }
        if (event === 'roomError') this.errors.push(payload);
        this.emit(event, payload);
      }
    });
    peers.push(this);
  }
  send(event, payload) { this.ws.send(`42${JSON.stringify(payload === undefined ? [event] : [event, payload])}`); }
  close(abrupt = false) {
    // Send the Socket.IO disconnect packet before the WebSocket close handshake.
    // Reverse proxies can otherwise defer the server-side transport-close event.
    if (!abrupt && this.ws.readyState === WebSocket.OPEN) this.ws.send('41');
    this.ws.close();
  }
}
async function connect() { const peer = new Peer(); await until(() => peer.connected, 'Socket.IO handshake'); return peer; }
async function walk(peer, target) {
  const send = () => peer.send('input', { right: peer.state.you.x < target, left: peer.state.you.x > target + 7 });
  send();
  const heartbeat = setInterval(send, 50);
  try { await until(() => !peer.state.you.alive || Math.abs(peer.state.you.x - target) < 7, `walk to ${target}`, 14000); }
  finally { clearInterval(heartbeat); peer.send('input', {}); }
  assert.equal(peer.state.you.alive, true, 'player must survive route');
}
async function jumpPit(peer, pit) {
  await walk(peer, pit.x - 20);
  const send = () => peer.send('input', { right: true, jump: true });
  send(); const heartbeat = setInterval(send, 50);
  try { await until(() => !peer.state.you.alive || (peer.state.you.x >= pit.x + pit.w + 9 && peer.state.you.onGround), 'pit landing'); }
  finally { clearInterval(heartbeat); peer.send('input', {}); }
  assert.equal(peer.state.you.alive, true, 'pit jump must survive');
}

try {
  if (child) await until(() => logs.includes('listening'), 'server startup');
  console.log(`Testing multiplayer at ${base} (independent automated clients; not a physical-device test)`);
  assert.equal((await (await fetch(`${base}/health`)).json()).ok, true);
  assert.equal((await fetch(base)).status, 200);
  assert.equal((await fetch(`${base}/socket.io/socket.io.js`)).status, 200);
  const a = await connect(), b = await connect(), c = await connect();
  a.send('createRoom'); c.send('createRoom');
  await until(() => a.id && c.id, 'two random rooms');
  const code = a.state.roomCode;
  assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.notEqual(code, c.state.roomCode);
  b.send('joinRoom', { roomCode: 'XXXXXX' });
  await until(() => b.errors.length, 'readable invalid-code error');
  assert.match(b.errors.at(-1), /not found/i);
  b.send('joinRoom', { roomCode: code });
  await until(() => a.state.players.length === 2 && b.id, 'two joined clients');
  b.send('startRun'); await sleep(100);
  assert.equal(a.state.phase, 'lobby', 'only host starts');
  a.send('startRun'); await until(()=>a.errors.some(e=>e.includes('ready')),'host waits for readiness');
  assert.equal(a.state.phase,'lobby');
  b.send('ready',{ready:'true'}); await sleep(100); assert.equal(a.state.players.find(p=>p.id===b.id).ready,false,'malformed readiness rejected');
  b.send('ready',{ready:true});await until(()=>a.state.players.every(p=>p.ready),'guest readiness shared');
  b.send('ready',{ready:false});await until(()=>!a.state.players.find(p=>p.id===b.id).ready,'guest can wait again');
  b.send('ready',{ready:true});await until(()=>a.state.players.every(p=>p.ready),'ready again');
  a.send('startRun');
  await until(() => a.state.phase === 'playing' && b.state.phase === 'playing', 'shared start');
  assert.equal(a.state.hearts, 4);
  a.send('input', { x: 99999, y: -99999, hearts: 999, left: 'true', right: null });
  a.send('interact', { active: true, x: a.state.world.switches[0].x });
  a.send('input', null); a.send('joinRoom', null); a.send('death', { playerId: b.id });
  await sleep(180);
  assert.ok(a.state.you.x < 40, 'forged coordinates must not teleport');
  assert.equal(a.state.hearts, 4);
  assert.equal(a.state.objectiveVersion, 0, 'distant forged activation rejected');
  await Promise.all([jumpPit(a, a.state.world.pits[0]), jumpPit(b, b.state.world.pits[0])]);
  assert.ok(a.state.players.find((p) => p.id === b.id).x > 300, 'peer movement visible in shared snapshots');
  const sw = a.state.world.switches[0];
  await Promise.all([walk(a, sw.x - 4), walk(b, sw.x + 5)]);
  a.send('interact'); b.send('interact'); a.send('interact');
  await until(() => a.state.objectiveVersion === 1 && b.state.objectiveVersion === 1, 'shared relay activation');
  assert.equal(a.state.world.platforms.filter((p) => p.kind === 'switch-bridge').length, 1);
  assert.equal(b.state.world.finish.locked, false);
  assert.deepEqual(a.state.world.switches, b.state.world.switches);
  assert.equal(c.state.objectiveVersion, 0);
  assert.equal(c.state.players.length, 1);
  assert.equal(c.events.some((e) => e.payload?.roomCode === code), false, 'no foreign room payloads');
  const finish = a.state.world.finish.x;
  await Promise.all([walk(a, finish - 5), walk(b, finish - 5)]);
  await until(() => a.state.phase === 'victory' && b.state.phase === 'victory', 'shared shelter victory');
  b.send('restartRun'); await sleep(100);
  assert.equal(a.state.phase, 'victory', 'guest cannot restart');
  a.send('restartRun');
  await until(() => a.state.runId === 2 && b.state.runId === 2, 'shared replay');
  assert.equal(a.state.objectiveVersion, 0);
  assert.equal(b.state.world.finish.locked, true);
  assert.equal(a.state.hearts, 4);
  a.send('input', { right: true });
  await sleep(2000);
  const staleX = a.state.you.x;
  await sleep(300);
  assert.equal(a.state.you.x, staleX, 'stale input must stop without a key-up packet');
  assert.ok(staleX < 200);
  await walk(a, a.state.world.pits[0].x + 10).catch((err) => {
    if (a.state.you.alive) throw err;
  });
  await until(() => !a.state.you.alive, 'pit death');
  const afterDeath = a.state.hearts;
  assert.equal(afterDeath, 3);
  a.send('input', { right: true }); a.send('death', {}); b.send('death', { playerId: a.id });
  await sleep(180);
  assert.equal(a.state.hearts, afterDeath, 'death transition deducts once');
  a.close(true);
  await until(() => b.state.hostId === b.id && b.state.players.length === 1, 'host handoff');
  assert.equal(b.state.partySize, 2, 'running geometry preserves original party size');
  const d = await connect(), e = await connect(), f = await connect(), g = await connect();
  for (const peer of [d, e, f]) peer.send('joinRoom', { roomCode: c.state.roomCode });
  await until(() => c.state.players.length === 4, 'four-player lobby');
  g.send('joinRoom', { roomCode: c.state.roomCode });
  await until(() => g.errors.length, 'room-full error');
  assert.match(g.errors.at(-1), /full/i);
  e.send('ready',{ready:true});d.send('ready',{ready:true});
  await until(()=>c.state.players.filter(p=>p.ready).length===3,'four-person ready order');
  c.send('startRun');await until(()=>c.errors.some(e=>e.includes('ready')),'four-person host cannot rush last guest');
  f.send('ready',{ready:true});await until(()=>c.state.players.every(p=>p.ready),'four-person readiness complete');
  c.send('startRun');await until(()=>c.state.phase==='playing','four-person shared start');
  const fourRun=c.state.runId;c.send('startRun');await sleep(100);assert.equal(c.state.runId,fourRun,'start cannot double-trigger');
  for (const peer of peers) peer.close();
  await until(() => peers.every((peer) => peer.ws.readyState === WebSocket.CLOSED), 'test sockets closed');
  let health;
  if (remote) {
    // A public service can contain real players' rooms. Probe only our own codes.
    const probe = await connect();
    for (const roomCode of [code, c.state.roomCode]) {
      const previousErrors = probe.errors.length;
      probe.send('joinRoom', { roomCode });
      await until(() => probe.errors.length > previousErrors || probe.id, 'test room removed');
      assert.equal(probe.id, undefined, 'closed test room must not be joinable');
      assert.match(probe.errors.at(-1), /not found/i);
    }
    probe.close();
    health = await (await fetch(`${base}/health`)).json();
    assert.equal(health.ok, true);
    console.log('Public cleanup PASS: both test room codes removed; unrelated live rooms preserved.');
  } else {
    for (let attempt = 0; attempt < 40; attempt++) {
      health = await (await fetch(`${base}/health`)).json();
      if (health.rooms === 0) break;
      await sleep(50);
    }
    assert.equal(health.rooms, 0, 'empty rooms cleaned up');
  }
  console.log('Multiplayer PASS: actual WebSocket room create/join/errors/capacity, host start, authoritative movement, forged/null input rejection, concurrent relay exactly once, shared bridge/gate/victory/replay, room isolation, stale input stop, one death charge, host handoff, and empty-room cleanup.');
} catch (error) {
  console.error(error.stack || error);
  console.error(logs);
  process.exitCode = 1;
} finally {
  for (const peer of peers) if (peer.ws.readyState < 2) peer.close();
  if (child) {
    child.kill('SIGTERM');
    await new Promise((resolve) => { if (child.exitCode !== null) resolve(); else child.once('exit', resolve); });
  }
}
