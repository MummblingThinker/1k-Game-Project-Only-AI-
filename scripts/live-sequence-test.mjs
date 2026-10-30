import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { routeIntent } from './route-driver.mjs';
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
  send(event, value) {
    if(event==='input'&&process.env.TRACE_SEQUENCE){
      const p=this.state?.you;
      if(p){this.trace??=[];this.trace.push({tick:this.state.tick,x:p.x,y:p.y,vy:p.vy,onGround:p.onGround,coyote:p.coyoteTicks,lastJump:p.lastJump,input:value});if(this.trace.length>35)this.trace.shift();}
    }
    if(event==='interact'){const now=Date.now();if(now-(this.lastUse||0)<220)return;this.lastUse=now;}
    this.socket.send('42' + JSON.stringify(value === undefined ? [event] : [event, value]));
  }
  close() { if (this.socket.readyState === 1) this.socket.send('41'); this.socket.close(); }
}
function drive(peer) {
  const intent=routeIntent(peer.state);peer.send('input',intent.input);
  if(intent.interact)peer.send('interact');
}

const party = Number(process.env.TEST_PARTY || 2);
const firstLevel = Number(process.env.TEST_FIRST_LEVEL || 1);
const lastLevel = Number(process.env.TEST_LAST_LEVEL || 15);
assert.ok(Number.isInteger(party) && party >= 2 && party <= 4);
assert.ok(firstLevel >= 1 && firstLevel <= lastLevel && lastLevel <= 15);
const peers = [];
let driver;
const scenes = [];
const completed = [];
const startedAt = Date.now();
try {
  await until(() => logs.includes('listening'), 'server');
  for (let i = 0; i < party; i++) peers.push(new Peer());
  await until(() => peers.every(p => p.connected), 'connections');
  const host = peers[0];
  host.send('createRoom'); await until(() => host.id, 'host room');
  for (const peer of peers.slice(1)) { peer.send('joinRoom', { roomCode: host.state.roomCode }); await until(() => peer.id, 'guest join'); }
  host.send('selectLevel', { level: firstLevel });
  await until(() => peers.every(p => p.state.level === firstLevel), 'selected stage');
  for(const peer of peers.slice(1))peer.send('ready',{ready:true});
  await until(()=>host.state.players.every(p=>p.ready),'everyone ready');
  host.send('startRun');
  await until(() => peers.every(p => p.state.phase === 'playing'), 'start');
  driver = setInterval(() => peers.forEach(drive), 40);
  for (let level = firstLevel; level <= lastLevel; level++) {
    await until(() => peers.every(p => p.state.level === level && p.state.phase === 'playing'), 'shared level ' + level);
    const heartMaximum = party <= 3 ? 4 : 5;
    assert.ok(peers.every(p => p.state.hearts === heartMaximum), 'full-level life pool reset');
    assert.ok(host.state.players.every(p => p.alive), 'full-level party revival');
    const stageStarted = Date.now(), end = stageStarted + 260000;
    let lastHearts = host.state.hearts;
    while (Date.now() < end && host.state.phase === 'playing') {
      if (host.state.hearts < lastHearts) { console.log('LIVE heart event: ' + JSON.stringify({level,hearts:host.state.hearts,notice:host.state.notice,players:host.state.players.map(p=>({slot:p.slot,x:Math.round(p.x),y:Math.round(p.y),alive:p.alive}))})); if(process.env.TRACE_SEQUENCE)console.log('TRACE '+JSON.stringify(peers.map(p=>p.trace))); lastHearts = host.state.hearts; }
      if (host.state.world.boss) assert.ok(host.state.world.giant.x + 44 < host.state.world.boss.x, 'pursuer excluded');
      await sleep(100);
    }
    assert.equal(host.state.phase, 'victory', JSON.stringify({ level, phase: host.state.phase, hearts: host.state.hearts, notice: host.state.notice, players:host.state.players.map(p=>({x:p.x,y:p.y,alive:p.alive})), boss:host.state.world.boss }));
    await until(() => peers.every(p => p.state.phase === 'victory'), 'shared victory ' + level);
    assert.ok(peers.every(p => p.state.hearts === host.state.hearts), 'matching life pool at victory');
    completed.push(level);
    console.log('LIVE stage PASS: party=' + party + ' level=' + level + ' seconds=' + Math.round((Date.now()-stageStarted)/1000) + ' hearts=' + host.state.hearts);
    if (level === firstLevel) {
      peers[1].send('nextLevel'); await sleep(120);
      assert.equal(host.state.phase, 'victory', 'only host may advance');
    }
    if (level === lastLevel && ![5,10,15].includes(level)) break;
    host.send('nextLevel');
    if ([5,10,15].includes(level)) {
      await until(() => peers.every(p => p.state.phase === 'cutscene'), 'shared story ' + level);
      assert.ok(peers.every(p => p.state.storyKey === 'after' + level));
      scenes.push('after' + level);
      // Let the actual server clock play every panel; do not skip the scene.
      const sceneStarted = Date.now();
      while (host.state.phase === 'cutscene' && Date.now() - sceneStarted < 35000) {
        const ticks = peers.map(p => p.state.storyTick);
        assert.ok(Math.max(...ticks) - Math.min(...ticks) <= 12, 'story clock agreement');
        await sleep(100);
      }
      assert.ok(Date.now() - sceneStarted >= (level === 10 ? 22000 : 14000), 'scene holds cannot collapse');
      await until(() => peers.every(p => p.state.phase === (level === 15 ? 'ending' : 'playing')), 'shared story completion');
      console.log('LIVE story PASS: after' + level + ' / synchronized default timing');
    }
  }
  assert.deepEqual(completed, Array.from({length:lastLevel-firstLevel+1},(_,i)=>i+firstLevel));
  assert.ok(peers.every(p => p.errors.length === 0));
  console.log('Live campaign sequence PASS: party=' + party + ', stages=' + completed.join(',') + ', scenes=' + scenes.join(',') + ', seconds=' + Math.round((Date.now()-startedAt)/1000) + '. Input-only real Socket.IO clients; not physical devices.');
} catch (error) { console.error(error.stack); console.error(logs); process.exitCode = 1; }
finally { clearInterval(driver); peers.forEach(p=>p.close()); server.kill('SIGTERM'); }
