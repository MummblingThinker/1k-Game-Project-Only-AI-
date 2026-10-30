import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(test, label, timeout = 7000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (test()) return; await sleep(25); }
  throw Error('Timed out: ' + label);
}
const port = await new Promise(resolve => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const server = spawn(process.execPath, ['server/server.js'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = ''; server.stdout.on('data', s => { logs += s; }); server.stderr.on('data', s => { logs += s; });
class Peer {
  constructor() {
    this.socket = new WebSocket(`ws://127.0.0.1:${port}/socket.io/?EIO=4&transport=websocket`);
    this.errors = [];
    this.socket.addEventListener('message', ({ data }) => {
      const s = String(data);
      if (s[0] === '0') this.socket.send('40');
      else if (s === '2') this.socket.send('3');
      else if (s.startsWith('42')) {
        const [event, value] = JSON.parse(s.slice(2));
        if (event === 'serverHello') this.connected = true;
        if (event === 'roomJoined') { this.state = value.state; this.id = value.playerId; }
        if (event === 'roomState') this.state = value;
        if (event === 'roomError') this.errors.push(value);
      }
    });
  }
  send(event, value) { this.socket.send('42' + JSON.stringify(value === undefined ? [event] : [event, value])); }
  close() { if (this.socket.readyState === 1) this.socket.send('41'); this.socket.close(); }
}
function drive(peer) {
  const s = peer.state, p = s?.you, w = s?.world, b = w?.boss;
  if (!p?.alive || s.phase !== 'playing' || p.capture || p.carriedBy) { peer.send('input', {}); return; }
  if (s.tick < p.slot * 35) return;
  let target = w.switches.find(sw => !sw.active)?.x ?? w.finish.x + 2;
  if (b && !b.solved && !w.switches.some(sw => !sw.active)) {
    if (p.x < b.x) target = b.x + 30;
    else if (b.kind === 'gatewarden') target = b.pylons[[1,0,2][b.activeRelay] ?? 2].x;
    else if (b.kind === 'background' && b.phase === 'stunned') target = b.x + 310;
    else target = b.pylons.find(sw => !sw.active)?.x ?? b.x + 190;
    if (b.phase === 'warning' && b.timer < 45 && Math.abs(p.x - b.targetX) < 60) target = b.targetX + (p.x > b.x + b.w - 110 ? -85 : 85);
  }
  const pit = w.pits.some(q => p.x + p.w > q.x - 8 && p.x < q.x + q.w && !w.platforms.some(t => t.kind === 'switch-bridge' && t.x === q.x));
  const ledge = w.platforms.some(q => p.y + p.h > q.y + 3 && (target > p.x ? q.x >= p.x + p.w - 1 && q.x < p.x + p.w + 5 : p.x >= q.x + q.w - 1 && p.x < q.x + q.w + 5));
  const rescue = w.enemies.find(e => e.grabbedId && e.grabbedId !== p.id);
  if (rescue) target = rescue.x + 4;
  const robot = w.enemies.some(e => e.kind === 'grabber' && !e.stunned && Math.abs(p.x - e.x) < 36);
  peer.send('input', { right: p.x < target - 3, left: p.x > target + 5, jump: !!p.onGround && (pit || ledge || robot) });
  if (Math.abs(p.x - target) < 23) peer.send('interact');
}
let a, b, driver;
try {
  await until(() => logs.includes('listening'), 'server');
  a = new Peer(); b = new Peer();
  await until(() => a.connected && b.connected, 'connections');
  a.send('createRoom'); await until(() => a.id, 'host room');
  b.send('joinRoom', { roomCode: a.state.roomCode }); await until(() => b.id, 'guest');
  b.send('selectLevel', { level: 15 }); await sleep(100); assert.equal(a.state.level, 1, 'guest cannot select');
  a.send('selectLevel', { level: 15 }); await until(() => a.state.level === 15 && b.state.level === 15, 'shared stage selection');
  a.send('startRun'); await until(() => a.state.phase === 'playing' && b.state.phase === 'playing', 'shared start');
  driver = setInterval(() => { drive(a); drive(b); }, 40);
  let observedBoss = false, observedStun = false, observedCore = false;
  const end = Date.now() + 260000;
  while (Date.now() < end && a.state.phase === 'playing') {
    const boss = a.state.world.boss;
    if (boss.phase !== 'waiting') observedBoss = true;
    if (boss.phase === 'stunned') observedStun = true;
    if (boss.cycle > 0) observedCore = true;
    assert.ok(a.state.world.giant.x + 44 < boss.x, 'pursuer must never enter arena');
    await sleep(100);
  }
  clearInterval(driver);
  assert.equal(a.state.phase, 'victory', JSON.stringify({ state: a.state.phase, x: a.state.you.x, boss: a.state.world.boss, hearts: a.state.hearts }));
  await until(() => b.state.phase === 'victory', 'guest victory');
  assert.ok(observedBoss && observedStun && observedCore);
  assert.equal(a.state.world.boss.cycle, 3);
  assert.equal(b.state.world.boss.solved, true);
  b.send('nextLevel'); await sleep(100); assert.equal(a.state.phase, 'victory', 'guest cannot advance');
  a.send('nextLevel'); await until(() => a.state.phase === 'cutscene' && b.state.phase === 'cutscene', 'shared ending scene');
  assert.equal(a.state.storyKey, 'after15'); assert.equal(b.state.storyKey, 'after15');
  a.send('nextLevel'); await until(() => a.state.phase === 'ending' && b.state.phase === 'ending', 'shared ending');
  assert.equal(a.errors.length, 0); assert.equal(b.errors.length, 0);
  console.log('Live campaign PASS: actual two-client room, host-only stage selection, full Level 15 input-only route and three background-boss core cycles, pursuer exclusion, shared victory/story/ending, guest authority rejection.');
} catch (e) { console.error(e.stack); console.error(logs); process.exitCode = 1; }
finally { clearInterval(driver); a?.close(); b?.close(); server.kill('SIGTERM'); }
