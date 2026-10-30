import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {routeIntent} from './route-driver.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(35);}throw Error('Timed out: '+label);}
const port=await new Promise(resolve=>{const listener=net.createServer();listener.listen(0,'127.0.0.1',()=>{const p=listener.address().port;listener.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',d=>{logs=(logs+d).slice(-16000);});server.stderr.on('data',d=>{logs=(logs+d).slice(-16000);});
const peers=[];
class Peer{
  constructor(){this.errors=[];this.ws=new WebSocket(base.replace('http:','ws:')+'/socket.io/?EIO=4&transport=websocket');peers.push(this);
    this.ws.addEventListener('error',()=>{});
    this.ws.addEventListener('message',({data})=>{const frame=String(data);
      if(frame[0]==='0')this.ws.send('40');else if(frame==='2')this.ws.send('3');else if(frame.startsWith('42')){
        const [event,value]=JSON.parse(frame.slice(2));
        if(event==='serverHello')this.connected=true;
        if(event==='roomJoined'){this.state=value.state;this.id=value.playerId;}
        if(event==='roomState')this.state=value;
        if(event==='roomError')this.errors.push(value);
      }
    });
  }
  send(event,value){if(this.ws.readyState===1)this.ws.send('42'+JSON.stringify(value===undefined?[event]:[event,value]));}
  close(){this.ws.close();}
}
async function connect(){const p=new Peer();await until(()=>p.connected,'connection');return p;}
async function room(level=1){
  const host=await connect(),guest=await connect();host.send('createRoom');await until(()=>host.id,'create');
  guest.send('joinRoom',{roomCode:host.state.roomCode});await until(()=>guest.id,'join');
  host.send('selectLevel',{level});guest.send('ready',{ready:true});
  await until(()=>host.state.players.every(p=>p.ready),'ready');host.send('startRun');
  await until(()=>host.state.phase==='playing'&&guest.state.phase==='playing','start');return [host,guest];
}
function drive(peer){const intent=routeIntent(peer.state);peer.send('input',intent.input);if(intent.interact&&Date.now()-(peer.lastUse||0)>230){peer.lastUse=Date.now();peer.send('interact');}}
async function closeAndCheck(leaving,remaining,label){
  const id=leaving.id,hearts=remaining.state.hearts;leaving.close();
  await until(()=>remaining.state.players.length===1&&!remaining.state.players.some(p=>p.id===id),label+' removal');
  const s=remaining.state;
  assert.equal(s.hostId,remaining.id,'remaining participant owns host controls');
  assert.equal(s.heartMax,4,'original lobby heart cap survives departure');
  assert.ok(s.hearts>=hearts,'departure itself does not deduct a heart');
  assert.ok(s.players.every(p=>p.carriedBy!==id&&p.carryId!==id),'no abandoned carry references');
  assert.ok(s.world.enemies.every(e=>e.grabbedId!==id),'no abandoned grab reference');
  assert.ok(!['gameover','ending'].includes(s.phase),'remaining room stays playable');
  assert.deepEqual(remaining.errors,[]);
  remaining.send('input',{});console.log('Disconnect PASS:',label,'remaining level',s.level,'hearts',s.hearts);
}
try{
  await until(async()=>{try{return(await fetch(base+'/health')).ok;}catch{return false;}},'server');
  {
    const [host,guest]=await room();await until(()=>host.state.you.onGround,'grounded');
    host.send('input',{jump:true});await until(()=>host.state.you.vy<0,'jump airborne');
    await closeAndCheck(host,guest,'host during jump');guest.close();
  }
  {
    const [host,guest]=await room();
    await until(()=>{guest.send('input',{right:true});return !guest.state.you.alive;},'guest pit death');
    await closeAndCheck(guest,host,'downed survivor');host.close();
  }
  {
    const [host,guest]=await room();
    await until(()=>{drive(host);return host.state.world.checkpoints.some(c=>c.active);},'checkpoint',20000);
    await closeAndCheck(guest,host,'checkpoint recovery');host.close();
  }
  {
    const [host,guest]=await room();
    await until(()=>{drive(host);drive(guest);return host.state.phase==='victory'&&guest.state.phase==='victory';},'tutorial completion',30000);
    host.send('nextLevel');await closeAndCheck(guest,host,'level transition');
    await until(()=>host.state.level===2&&host.state.phase==='playing','next stage survives disconnect');
    assert.equal(host.state.hearts,4);assert.ok(host.state.you.alive);host.close();
  }
  {
    const [host,guest]=await room(2);
    await until(()=>{for(const p of [host,guest]){if(p.state.you.x<830)drive(p);else p.send('input',{});}return [host,guest].every(p=>p.state.you.x>=830&&p.state.you.onGround);},'capture approach',35000);
    await until(()=>{
      const p=guest.state.you,e=guest.state.world.enemies.find(e=>e.id==='robot-0');
      guest.send('input',{right:p.x<e.x+4,left:p.x>e.x+9});host.send('input',{});
      return !!guest.state.you.capture;
    },'actual capture');
    const code=host.state.roomCode;await closeAndCheck(guest,host,'captured survivor');
    const fresh=await connect();assert.equal(fresh.id,undefined,'new connection has no old participant');
    fresh.send('joinRoom',{roomCode:code});await until(()=>fresh.errors.length,'running lobby rejection');
    assert.match(fresh.errors.at(-1),/started|progress|new room|new lobby/i);assert.equal(fresh.id,undefined);
    fresh.send('createRoom');await until(()=>fresh.id,'fresh lobby');assert.notEqual(fresh.state.roomCode,code);
    assert.equal(fresh.state.phase,'lobby');assert.equal(fresh.state.players.length,1);
    fresh.close();host.close();console.log('Reconnect policy PASS: fresh identity, started-room rejection, clean new lobby.');
  }
  await until(async()=> (await(await fetch(base+'/health')).json()).rooms===0,'all rooms removed');
  console.log('Disconnect suite PASS: actual Socket.IO clients; no authority mutation.');
}catch(error){console.error(logs);for(const p of peers.filter(p=>p.ws.readyState===1))console.error('DISCONNECT STATE',JSON.stringify(p.state));throw error;}
finally{for(const p of peers)p.close();server.kill('SIGTERM');}
