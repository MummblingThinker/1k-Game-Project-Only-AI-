import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { delayedProxy } from './delayed-proxy.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test,label,ms=8000) { const end=Date.now()+ms;while(Date.now()<end){if(test())return;await sleep(20);}throw Error('Timed out: '+label); }
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const child=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let log='';child.stdout.on('data',d=>{log+=d;});child.stderr.on('data',d=>{log+=d;});
let proxy,driver,guestWalk; const peers=[];
class Peer {
  constructor() {
    this.events=[];this.errors=[];
    this.ws=new WebSocket(`ws://127.0.0.1:${proxy.port}/socket.io/?EIO=4&transport=websocket`);
    this.ws.addEventListener('error',()=>{});
    this.ws.addEventListener('message',({data})=>{
      const packet=String(data);
      if(packet[0]==='0')this.ws.send('40');else if(packet==='2')this.ws.send('3');
      else if(packet.startsWith('42')) {
        const [event,value]=JSON.parse(packet.slice(2));
        if(event==='serverHello')this.connected=true;
        if(event==='roomJoined'){this.id=value.playerId;this.state=value.state;}
        if(event==='roomState'){this.state=value;this.events.push(value);}
        if(event==='roomError')this.errors.push(value);
      }
    });peers.push(this);
  }
  send(event,value){this.ws.send('42'+JSON.stringify(value===undefined?[event]:[event,value]));}
}
try {
  await until(()=>log.includes('listening'),'server');proxy=await delayedProxy(port);
  const a=new Peer(),b=new Peer();await until(()=>a.connected&&b.connected,'delayed handshake');
  a.send('createRoom');await until(()=>a.id,'host');b.send('joinRoom',{roomCode:a.state.roomCode});
  await until(()=>b.id&&a.state.players.length===2,'guest');
  a.send('selectLevel',{level:6});await until(()=>a.state.level===6&&b.state.level===6,'shared level');
  b.send('ready',{ready:true});await until(()=>a.state.players.every(p=>p.ready),'ready through delay');
  a.send('startRun');await until(()=>a.state.phase==='playing'&&b.state.phase==='playing','start');
  const before=a.state.you.x;
  b.send('input',{right:true});guestWalk=setTimeout(()=>b.send('input',{}),2000);
  a.send('input',{right:true});await sleep(650);a.send('input',{});await sleep(700);
  assert.ok(a.state.you.x>before+20 && a.state.you.x<140,'delayed intent still moves within valid geometry');
  const stopped=a.state.you.x;await sleep(500);assert.equal(a.state.you.x,stopped,'release stops through jitter');
  a.send('input',{x:99999,hearts:999,right:'true'});await sleep(600);
  assert.equal(a.state.you.x,stopped);assert.equal(a.state.hearts,4);
  const plate=a.state.world.plates[0];
  driver=setInterval(()=>{
    const p=a.state.you,w=a.state.world;
    const obstacle=[...w.platforms,...w.crates.filter(c=>!c.used&&!c.carriedBy)].some(q=>p.y+p.h>q.y+3&&q.x>=p.x+p.w-2&&q.x<p.x+p.w+18);
    a.send('input',{right:p.x<plate.x-3,left:p.x>plate.x+12,jump:p.onGround&&obstacle});
  },80);
  await until(()=>a.state.world.plates[0].held&&b.state.world.plates[0].held,'shared pressure bridge',6000);
  clearInterval(driver);a.send('input',{});await sleep(500);
  assert.ok(a.state.world.platforms.some(p=>p.kind==='pressure-bridge'));
  assert.ok(b.state.world.platforms.some(p=>p.kind==='pressure-bridge'));
  // Remove the weight, then wait for the real server's eight-second release countdown.
  a.send('input',{left:true});await sleep(650);a.send('input',{});await sleep(600);
  assert.equal(a.state.world.plates[0].held,false);
  await until(()=>!a.state.world.plates[0].remaining&&!b.state.world.plates[0].remaining,'shared expiry',10000);
  assert.ok(!b.state.world.platforms.some(p=>p.kind==='pressure-bridge'));
  assert.equal(a.state.hearts,4);assert.equal(b.state.hearts,4);
  for(const peer of peers) {assert.deepEqual(peer.errors,[]);for(let i=1;i<peer.events.length;i++){const prev=peer.events[i-1],next=peer.events[i];if(prev.runId===next.runId)assert.ok(next.tick>=prev.tick,`snapshot order: ${JSON.stringify([prev,next].map(s=>({run:s.runId,tick:s.tick,phase:s.phase})))}`);}}
  a.send('leaveRoom');await until(()=>b.state.players.length===1&&b.state.hostId===b.id,'host departure through delay');
  b.send('leaveRoom');
  await sleep(500);assert.equal((await(await fetch(`http://127.0.0.1:${port}/health`)).json()).rooms,0);
  console.log('Network jitter PASS: actual TCP delays 60-140ms each direction; movement/release, forged input rejection, shared weight bridge/expiry, ordered state, hearts, host handoff and cleanup.',proxy.stats());
} catch(error) {console.error(error,log);process.exitCode=1;}
finally {clearInterval(driver);clearTimeout(guestWalk);for(const p of peers)p.ws.close();await proxy?.close();child.kill('SIGTERM');}
