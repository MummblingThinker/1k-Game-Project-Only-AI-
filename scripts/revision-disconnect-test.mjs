import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {revisionIntent} from './revision-driver.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(30);}throw Error('Timed out: '+label);}
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:String(port)},stdio:'ignore'}),peers=[];
class Peer{
 constructor(){this.errors=[];this.ws=new WebSocket(base.replace('http:','ws:')+'/socket.io/?EIO=4&transport=websocket');peers.push(this);
  this.ws.addEventListener('message',({data})=>{const f=String(data);if(f[0]==='0')this.ws.send('40');else if(f==='2')this.ws.send('3');else if(f.startsWith('42')){const[e,v]=JSON.parse(f.slice(2));if(e==='serverHello')this.connected=true;if(e==='roomJoined'){this.id=v.playerId;this.state=v.state;}if(e==='roomState')this.state=v;if(e==='roomError')this.errors.push(v);}});}
 send(e,v){if(this.ws.readyState===1)this.ws.send('42'+JSON.stringify(v===undefined?[e]:[e,v]));}
 close(){this.ws.close();}
}
async function room(level=1){const a=new Peer(),b=new Peer();await until(()=>a.connected&&b.connected,'connections');a.send('createRoom');await until(()=>a.id,'create');b.send('joinRoom',{roomCode:a.state.roomCode});await until(()=>b.id,'join');a.send('selectLevel',{level});b.send('ready',{ready:true});await until(()=>a.state.players.every(p=>p.ready),'ready');a.send('startRun');await until(()=>a.state.phase==='playing'&&b.state.phase==='playing','start');return[a,b];}
function drive(p){const cmd=revisionIntent(p.state);p.send('input',cmd.input);if(cmd.action&&Date.now()-(p.lastUse||0)>230){p.lastUse=Date.now();p.send(cmd.action==='carry'?'carry':cmd.action==='drop'?'drop':'interact');}}
async function depart(leaving,remaining,label){const id=leaving.id,cap=remaining.state.heartMax;leaving.close();await until(()=>remaining.state.players.length===1,'depart '+label);const s=remaining.state;assert.equal(s.hostId,remaining.id);assert.equal(s.partySize,2);assert.equal(s.heartMax,cap);assert.ok(s.players.every(p=>p.carryId!==id&&p.carriedBy!==id));assert.ok(s.world.crates.every(c=>c.carriedBy!==id));assert.deepEqual(remaining.errors,[]);console.log('DISCONNECT PASS',label);}
try{
 await until(async()=>{try{return(await fetch(base+'/health')).ok;}catch{return false;}},'server');
 {
  const[a,b]=await room();a.send('input',{jump:true});await until(()=>a.state.you.vy<0,'jump');await depart(a,b,'airborne host');b.close();
 }
 {
  const[a,b]=await room();a.send('carry');await until(()=>b.state.you.carriedBy===a.id,'actual teammate carry');await depart(a,b,'carrier host');assert.equal(b.state.you.alive,true);const code=b.state.roomCode;
  const fresh=new Peer();await until(()=>fresh.connected,'new connection');fresh.send('joinRoom',{roomCode:code});await until(()=>fresh.errors.length,'running-room rejection');assert.equal(fresh.id,undefined);assert.match(fresh.errors[0],/started|progress|lobby/i);fresh.close();b.close();
 }
 {
  const[a,b]=await room(6);await until(()=>{drive(a);drive(b);return a.state.world.crates.some(c=>c.durable&&c.carriedBy===a.id)||a.state.world.crates.some(c=>c.durable&&c.carriedBy===b.id);},'actual puzzle-weight carry',100000);
  const carrier=a.state.world.crates.find(c=>c.durable&&c.carriedBy)?.carriedBy,leaving=carrier===a.id?a:b,remaining=carrier===a.id?b:a;
  await depart(leaving,remaining,'puzzle-weight carrier');await until(()=>{drive(remaining);return remaining.state.phase!=='playing';},'last survivor bridge and exit',90000);assert.equal(remaining.state.phase,'victory');remaining.close();console.log('LAST SURVIVOR PASS: recovered weight, bridge and Level 6 exit');
 }
 {
  const[a,b]=await room(5);await until(()=>{drive(a);drive(b);return a.state.world.boss.phase!=='waiting'&&a.state.you.climbing!=null;},'boss ladder',120000);await depart(a,b,'climbing host in boss arena');await until(()=>{drive(b);return b.state.phase!=='playing';},'remaining player boss exit',150000);assert.equal(b.state.phase,'victory');assert.ok(b.state.world.boss.solved);b.close();console.log('LAST SURVIVOR PASS: Warden defeated and final ladder exit');
 }
 await until(async()=> (await(await fetch(base+'/health')).json()).rooms===0,'room cleanup');console.log('REVISION DISCONNECT SUITE PASS: actual sockets/input, no gameplay state mutation.');
}finally{for(const p of peers)p.close();server.kill('SIGTERM');}
