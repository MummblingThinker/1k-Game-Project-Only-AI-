import assert from 'node:assert/strict';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {driveRevision} from './revision-driver.mjs';
import {snapshotAudit} from './snapshot-audit.mjs';
import {delayedProxy} from './delayed-proxy.mjs';
const duration=Number(process.env.SOAK_SECONDS||1200);assert.ok(duration>=30&&duration<=7200);
const reactionLead=Number(process.env.SOAK_REACTION_TICKS??(process.env.SOAK_JITTER==='1'?14:0));assert.ok(Number.isInteger(reactionLead)&&reactionLead>=0&&reactionLead<=20);
const levels=(process.env.SOAK_LEVELS||'5,10,15').split(',').map(Number);assert.ok(levels.length&&levels.every(x=>[5,10,15].includes(x)));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){if(fn())return;await sleep(30);}throw Error('Timed out: '+label);}
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`,child=spawn(process.execPath,['--import','./scripts/qa-telemetry.mjs','server/server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe','ipc']});
let serverLog='',failed=null,messages=0,bytes=0,proxy,endpoint=base;const metrics=[],peers=[],rooms=[],errors=[];
child.stdout.on('data',d=>serverLog=(serverLog+d).slice(-12000));child.stderr.on('data',d=>serverLog=(serverLog+d).slice(-12000));child.on('message',m=>{if(m.kind==='qaMetrics')metrics.push(m);});
class Peer{
 constructor(index,audit){this.memo={};this.ws=new WebSocket(endpoint.replace('http:','ws:')+'/socket.io/?EIO=4&transport=websocket');peers.push(this);
  this.ws.addEventListener('error',e=>errors.push('socket error: '+e.message));
  this.ws.addEventListener('message',({data})=>{const f=String(data);messages++;bytes+=Buffer.byteLength(f);
   if(f[0]==='0')this.ws.send('40'+JSON.stringify({sharedSnapshots:true}));else if(f==='2')this.ws.send('3');else if(f.startsWith('42')){
    const[event,v]=JSON.parse(f.slice(2));if(event==='serverHello')this.connected=true;
    if(event==='roomJoined'){this.id=v.playerId;this.state=v.state;}
    if(event==='roomState'){this.state={...v,playerId:this.id,you:v.players.find(p=>p.id===this.id)};audit.observe(index,this.state);}
    if(event==='roomError')errors.push(v);
   }
  });
 }
 send(event,data){if(this.ws.readyState===1)this.ws.send('42'+JSON.stringify(data===undefined?[event]:[event,data]));}
 close(){this.send('leaveRoom');this.ws.close();}
}
const started=Date.now();
try{
 await until(()=>serverLog.includes('listening'),'server');
 if(process.env.SOAK_JITTER==='1'){proxy=await delayedProxy(port);endpoint=`http://127.0.0.1:${proxy.port}`;}
 for(const level of levels){
  const audit=snapshotAudit(4,e=>errors.push(e)),party=Array.from({length:4},(_,i)=>new Peer(i,audit));
  await until(()=>party.every(p=>p.connected),'connections');const host=party[0];host.send('createRoom');await until(()=>host.id,'create');
  for(const p of party.slice(1)){p.send('joinRoom',{roomCode:host.state.roomCode});await until(()=>p.id,'join');p.send('ready',{ready:true});}
  await until(()=>host.state.players.length===4&&host.state.players.every(p=>p.ready),'ready');host.send('selectLevel',{level});await until(()=>host.state.level===level,'select');host.send('startRun');await until(()=>party.every(p=>p.state.phase==='playing'),'start');
  rooms.push({level,party,audit,clears:0,losses:0,reported:new Set()});
 }
 const playStart=Date.now();let reportAt=playStart;
 while(Date.now()-playStart<duration*1000){
  assert.equal(child.exitCode,null);assert.deepEqual(errors,[]);
  for(const room of rooms){const host=room.party[0],s=host.state;
   assert.equal(s.level,room.level);assert.equal(s.players.length,4);assert.ok(s.hearts>=0&&s.hearts<=5);
   assert.ok(room.party.every(p=>p.state.roomCode===s.roomCode),'room isolation');
   for(const p of s.players){assert.ok([p.x,p.y,p.vx,p.vy].every(Number.isFinite));if(p.carriedBy)assert.ok(s.players.some(q=>q.id===p.carriedBy&&q.carryId===p.id));}
   if(s.phase==='playing')for(const peer of room.party){
    if(peer.run!==peer.state.runId){peer.run=peer.state.runId;peer.memo={reactionLead};peer.lastUse=0;}
    const c=driveRevision(peer.state,peer.state.you,peer.memo);peer.send('input',c.input);
    if(c.action&&Date.now()-(peer.lastUse||0)>230){peer.lastUse=Date.now();peer.send(c.action==='carry'?'carry':c.action==='drop'?'drop':'interact');}
   }else if(['victory','gameover'].includes(s.phase)){
    const key=s.runId+':'+s.phase;
    if(!room.reported.has(key)){room.reported.add(key);if(s.phase==='victory')room.clears++;else room.losses++;console.log('Boss soak result:',JSON.stringify({level:room.level,run:s.runId,phase:s.phase,hearts:s.hearts,tick:s.tick,seed:s.world.seed,notice:s.notice,players:s.players.map(p=>({x:Math.round(p.x),y:Math.round(p.y),alive:p.alive}))}));}
    if(Date.now()-(room.restartAt||0)>500){room.restartAt=Date.now();host.send('restartRun');}
   }
  }
  if(metrics.length)assert.ok(metrics.at(-1).rss<512*1024*1024,'server RSS under 512 MiB');
  if(Date.now()-reportAt>=60000){reportAt=Date.now();console.log('Boss soak progress:',Math.round((reportAt-playStart)/1000)+'s',JSON.stringify(rooms.map(r=>({level:r.level,clears:r.clears,losses:r.losses,matches:r.audit.count(r.level)}))));}
  await sleep(40);
 }
 if(duration>=180)for(const r of rooms){assert.ok(r.clears>0,'boss '+r.level+' must actually finish');assert.ok(r.audit.count(r.level)>1000);}
 for(const peer of peers)peer.close();await until(()=>peers.every(p=>p.ws.readyState===3),'closed clients');
 let remaining=99;for(let i=0;i<100&&remaining;i++){remaining=(await(await fetch(base+'/health')).json()).rooms;if(remaining)await sleep(50);}assert.equal(remaining,0);
 console.log('BOSS NETWORK SOAK PASS:',rooms.length,'four-player rooms; ordinary input, shared snapshot agreement and cleanup; clears/losses explicitly recorded below.');
}catch(e){failed=String(e.stack||e);console.error(failed,serverLog);process.exitCode=1;}
finally{
 for(const p of peers)p.close();await proxy?.close();child.kill('SIGTERM');await mkdir('artifacts',{recursive:true});
 const result={duration,reactionLead,jitter:proxy?.stats()||null,elapsedSeconds:(Date.now()-started)/1000,failed,messages,bytes,maxRssMiB:Math.max(0,...metrics.map(m=>m.rss))/1048576,rooms:rooms.map(r=>({level:r.level,clears:r.clears,losses:r.losses,matches:r.audit.count(r.level)})),metrics};
 await writeFile(`artifacts/boss-soak-${proxy?'jitter-'+reactionLead+'-':''}${duration}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({...result,metrics:undefined}));
}
