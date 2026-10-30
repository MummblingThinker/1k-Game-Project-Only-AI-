import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {driveRevision} from './revision-driver.mjs';
import {snapshotAudit} from './snapshot-audit.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=8000){const end=Date.now()+ms;while(Date.now()<end){if(fn())return;await sleep(20);}throw Error('Timed out '+label);}
const port=await new Promise(r=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const base=process.env.TEST_BASE_URL||`http://127.0.0.1:${port}`;
const server=process.env.TEST_BASE_URL?null:spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:String(port)},stdio:'inherit'});
const peers=[],errors=[],audit=snapshotAudit(2,e=>errors.push(e));
class Peer{
 constructor(index){this.memo={};this.errors=[];this.ws=new WebSocket(base.replace(/^http/,'ws')+'/socket.io/?EIO=4&transport=websocket');this.ws.addEventListener('message',({data})=>{const f=String(data);if(f[0]==='0')this.ws.send('40');else if(f==='2')this.ws.send('3');else if(f.startsWith('42')){const[e,v]=JSON.parse(f.slice(2));if(e==='serverHello')this.connected=true;if(e==='roomState'){this.state=v;audit.observe(index,v);}if(e==='roomJoined'){this.state=v.state;this.id=v.playerId;}if(e==='roomError')this.errors.push(v);}});peers.push(this);}
 send(e,v){this.ws.send('42'+JSON.stringify(v===undefined?[e]:[e,v]));}
 close(){if(this.ws.readyState===1)this.ws.send('41');this.ws.close();}
}
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await sleep(100);}
 const a=new Peer(0),b=new Peer(1);await until(()=>a.connected&&b.connected,'handshake');a.send('createRoom');await until(()=>a.id,'create');b.send('joinRoom',{roomCode:a.state.roomCode});await until(()=>b.id&&a.state.players.length===2,'join');b.send('ready',{ready:true});await until(()=>a.state.players.every(p=>p.ready),'ready');a.send('startRun');await until(()=>a.state.phase==='playing'&&b.state.phase==='playing','start');
 assert.equal(a.state.world.revision,2);b.send('input',{x:999999,y:-999,left:false,right:false,jump:false});await sleep(100);assert.ok(b.state.you.x<100,'forged position ignored');
 const deadline=Date.now()+90000;let ladderVerified=false;
 while(Date.now()<deadline&&a.state.phase==='playing'){
   if(!ladderVerified&&a.state.you.climbing&&a.state.you.y<a.state.world.floorY-44){
     for(const p of peers)p.send('input',{});await sleep(150);const heldY=a.state.you.y;
     await sleep(200);assert.ok(Math.abs(a.state.you.y-heldY)<.1,'released ladder input holds on authoritative server');
     a.send('input',{down:true});await sleep(260);a.send('input',{});await sleep(100);
     assert.ok(a.state.you.y>heldY+8,'S/down descends through actual WebSocket input');
     const remote=b.state.players.find(p=>p.id===a.id);assert.ok(Math.abs(remote.y-a.state.you.y)<.1,'peer sees same stopped ladder position');
     ladderVerified=true;console.log('NETWORK LADDER PASS: actual W ascent, release hold, S descent and matching peer position.');
   }
   for(const p of peers){const cmd=driveRevision(p.state,p.state.you,p.memo);p.send('input',cmd.input);if(cmd.action&&Date.now()-(p.lastUse||0)>220){p.lastUse=Date.now();p.send(cmd.action==='carry'?'carry':cmd.action==='drop'?'drop':'interact');}}
   await sleep(30);
 }
 await until(()=>peers.every(p=>p.state.phase==='victory'),'shared victory',2000);assert.ok(ladderVerified);assert.equal(a.state.world.switches.filter(s=>s.active).length,1);assert.ok(audit.count(1)>100);assert.deepEqual(errors,[]);
 a.close();await until(()=>b.state.hostId===b.id,'host handoff');b.send('restartRun');await until(()=>b.state.phase==='playing','new host restart');b.send('leaveRoom');await sleep(150);
 console.log('REVISION MULTIPLAYER PASS: two independent WebSocket clients, authoritative position, shared flag/bridge/vertical route/victory, snapshot agreement, host migration and restart. Matched snapshots:',audit.count(1));
}finally{for(const p of peers)if(p.ws.readyState<2)p.close();server?.kill();}
