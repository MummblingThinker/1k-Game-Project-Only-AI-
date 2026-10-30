import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=6000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(20);}throw Error('Timed out: '+label);}
const port=await new Promise(resolve=>{const listener=net.createServer();listener.listen(0,'127.0.0.1',()=>{const p=listener.address().port;listener.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',d=>{logs=(logs+d).slice(-12000);});server.stderr.on('data',d=>{logs=(logs+d).slice(-12000);});
const peers=[];
class Peer{
  constructor(){this.events=[];this.ws=new WebSocket(base.replace('http:','ws:')+'/socket.io/?EIO=4&transport=websocket');peers.push(this);
    this.ws.addEventListener('error',()=>{});this.ws.addEventListener('close',()=>{this.closed=true;});
    this.ws.addEventListener('message',({data})=>{const frame=String(data);
      if(frame[0]==='0')this.ws.send('40');else if(frame==='2')this.ws.send('3');else if(frame.startsWith('42')){
        const [event,value]=JSON.parse(frame.slice(2));this.events.push({event,value});
        if(event==='serverHello')this.connected=true;
        if(event==='roomJoined'){this.state=value.state;this.id=value.playerId;}
        if(event==='roomState')this.state=value;
      }
    });
  }
  send(event,value){this.ws.send('42'+JSON.stringify(value===undefined?[event]:[event,value]));}
  count(event){return this.events.filter(e=>e.event===event).length;}
  close(){this.ws.close();}
}
async function connect(){const p=new Peer();await until(()=>p.connected,'connection');return p;}
const health=async()=>await(await fetch(base+'/health')).json();
try{
  await until(async()=>{try{return(await health()).ok;}catch{return false;}},'server');
  // Room creation budget leaves exactly one current lobby, with no leaked rooms.
  const creator=await connect();for(let i=0;i<9;i++)creator.send('createRoom');
  await until(()=>creator.count('roomError')>0,'creation rejection');
  assert.equal(creator.count('roomJoined'),8);assert.equal((await health()).rooms,1);
  assert.match(creator.events.find(e=>e.event==='roomError').value,/wait/i);creator.close();
  await until(async()=> (await health()).rooms===0,'creation cleanup');
  console.log('Abuse PASS: ninth create rejected, eight replacements leave one room, cleanup zero.');

  const host=await connect();host.send('createRoom');await until(()=>host.id,'host room');
  const guest=await connect();guest.send('joinRoom',{roomCode:host.state.roomCode});await until(()=>guest.id,'guest room');
  await sleep(50);const before=guest.count('roomState');
  for(let i=0;i<100;i++)guest.send('ready',{ready:i%2===0});
  await sleep(200);const replies=guest.count('roomState')-before;
  assert.ok(replies>0&&replies<=20,'action burst bounded to 20 callbacks per second: '+replies);
  assert.ok(!guest.closed&&!host.closed);assert.equal((await health()).rooms,1);
  await sleep(1100);guest.send('ready',{ready:true});await until(()=>host.state.players.every(p=>p.ready),'action budget recovers');
  host.send('startRun');await until(()=>host.state.phase==='playing','start');
  // New socket's input window is fresh following the wait. Fill the window with
  // neutral input; the extra movement command must be discarded, not trusted.
  const x=guest.state.you.x;
  for(let i=0;i<120;i++)guest.send('input',{});
  guest.send('input',{right:true,x:99999,hearts:999});
  await sleep(250);assert.ok(Math.abs(guest.state.you.x-x)<.01,'input overflow ignored');
  assert.equal(guest.state.hearts,4);
  await sleep(1100);guest.send('input',{right:true});await until(()=>guest.state.you.x>x+8,'input budget recovers');guest.send('input',{});
  console.log('Abuse PASS: action/input bursts bounded, forged fields ignored, legal input recovers.');

  const other=await connect();other.send('createRoom');await until(()=>other.id,'isolated room');const otherCode=other.state.roomCode;
  guest.send('input',{right:true,padding:'x'.repeat(5000)});await until(()=>guest.closed,'oversized packet disconnect');
  await until(()=>host.state.players.length===1,'oversized client removed');
  assert.equal(host.state.hearts,4);assert.ok(!host.closed&&!other.closed);
  assert.equal(other.state.roomCode,otherCode);assert.equal(other.state.phase,'lobby');
  assert.equal((await health()).rooms,2);
  for(const malformed of [null,1,'move',[],{right:'true',jump:1,left:[]}])host.send('input',malformed);
  host.send('death',{id:host.id,hearts:-20});host.send('setState',{x:99999,phase:'victory'});
  await sleep(150);assert.equal(host.state.hearts,4);assert.equal(host.state.phase,'playing');assert.ok(host.state.you.x<100);
  console.log('Abuse PASS: oversized sender disconnected; unrelated room and host survive; malformed state ignored.');
  host.close();other.close();await until(async()=> (await health()).rooms===0,'final cleanup');
  console.log('Abuse suite PASS: isolated ephemeral local server only; no production traffic.');
}catch(error){console.error(logs);throw error;}
finally{for(const p of peers)p.close();server.kill();}
