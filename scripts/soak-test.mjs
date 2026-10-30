import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { mkdir,writeFile } from 'node:fs/promises';
const duration=Number(process.env.SOAK_SECONDS||120),roomCount=Number(process.env.SOAK_ROOMS||8);
assert.ok(Number.isInteger(duration)&&duration>=30&&duration<=7200);
assert.ok(Number.isInteger(roomCount)&&roomCount>=1&&roomCount<=12);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(test,label,ms=10000){const end=Date.now()+ms;while(Date.now()<end){if(test())return;await sleep(25);}throw Error('Timed out: '+label);}
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const child=spawn(process.execPath,['--import','./scripts/qa-telemetry.mjs','server/server.js'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe','ipc']});
const metrics=[],peers=[],rooms=[];let log='',seed=0x73b1,checks=0,restarts=0,messages=0,bytes=0;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
child.stdout.on('data',d=>{log=(log+d).slice(-12000);});child.stderr.on('data',d=>{log=(log+d).slice(-12000);});
child.on('message',m=>{if(m.kind==='qaMetrics')metrics.push(m);});
class Peer {
  constructor(){this.errors=[];this.ws=new WebSocket(`ws://127.0.0.1:${port}/socket.io/?EIO=4&transport=websocket`);
    this.ws.addEventListener('error',()=>{});this.ws.addEventListener('message',({data})=>{const s=String(data);bytes+=s.length;messages++;
      if(s[0]==='0')this.ws.send('40');else if(s==='2')this.ws.send('3');else if(s.startsWith('42')){const[e,v]=JSON.parse(s.slice(2));
        if(e==='serverHello')this.connected=true;if(e==='roomJoined'){this.state=v.state;this.id=v.playerId;}if(e==='roomState')this.state=v;if(e==='roomError')this.errors.push(v);
      }});peers.push(this);}
  send(e,v){if(this.ws.readyState===1)this.ws.send('42'+JSON.stringify(v===undefined?[e]:[e,v]));}
  close(){this.send('leaveRoom');this.ws.close();}
}
const started=Date.now();let failed=null;
try {
  await until(()=>log.includes('listening'),'server');
  for(let index=0;index<roomCount;index++){
    const party=Array.from({length:4},()=>new Peer());await until(()=>party.every(p=>p.connected),'connections');
    const host=party[0];host.send('createRoom');await until(()=>host.id,'room');
    for(const p of party.slice(1)){p.send('joinRoom',{roomCode:host.state.roomCode});await until(()=>p.id,'join');p.send('ready',{ready:true});}
    await until(()=>host.state.players.length===4&&host.state.players.every(p=>p.ready),'ready');
    host.send('selectLevel',{level:[2,5,7,10,12,15,1,14][index%8]});await sleep(80);host.send('startRun');
    await until(()=>host.state.phase==='playing','start');rooms.push(party);
  }
  const playStart=Date.now();let report=playStart;
  while(Date.now()-playStart<duration*1000){
    assert.equal(child.exitCode,null,'server remains alive');
    for(const party of rooms){
      const host=party[0],s=host.state;
      assert.ok(party.every(p=>p.state.roomCode===s.roomCode),'room isolation');
      assert.equal(s.players.length,4);assert.ok(s.hearts>=0&&s.hearts<=5);
      assert.equal(new Set(s.players.map(p=>p.id)).size,4);
      for(const p of s.players){assert.ok([p.x,p.y,p.vx,p.vy].every(Number.isFinite),'finite state');if(p.carriedBy)assert.ok(s.players.some(c=>c.id===p.carriedBy&&c.carryId===p.id),'carry ownership');}
      if(s.phase==='playing')for(const p of party){
        p.send('input',{right:random()>.12,left:random()<.1,jump:random()<.35});
        if(random()<.08)p.send(['interact','carry','drop'][Math.floor(random()*3)]);
      }
      else if(['gameover','ending'].includes(s.phase)){host.send('restartRun');restarts++;}
      else if(['victory','cutscene'].includes(s.phase))host.send('nextLevel');
      checks++;
    }
    if(metrics.length)assert.ok(metrics.at(-1).rss<512*1024*1024,'local server RSS remains below 512 MiB');
    if(Date.now()-report>=60000){report=Date.now();console.log(`SOAK progress: ${Math.round((report-playStart)/1000)}s, rooms=${roomCount}, checks=${checks}, restarts=${restarts}, RSS=${Math.round((metrics.at(-1)?.rss||0)/1048576)}MiB`);}
    await sleep(100);
  }
  for(const p of peers){assert.deepEqual(p.errors,[]);p.close();}
  await until(()=>peers.every(p=>p.ws.readyState===3),'closed sockets');
  let remaining=99;for(let i=0;i<100&&remaining;i++){remaining=(await(await fetch(`http://127.0.0.1:${port}/health`)).json()).rooms;if(remaining)await sleep(50);}
  assert.equal(remaining,0,'all rooms cleaned');
  console.log('SOAK PASS: local actual Socket.IO rooms, finite shared state, valid hearts/carry, repeated resets and cleanup.');
}catch(e){failed=String(e.stack||e);console.error(failed,log);process.exitCode=1;}
finally {
  for(const p of peers)p.close();child.kill('SIGTERM');
  await mkdir('artifacts',{recursive:true});
  const result={durationRequested:duration,elapsedSeconds:(Date.now()-started)/1000,roomCount,clients:peers.length,checks,restarts,messages,bytes,failed,metrics};
  await writeFile(`artifacts/soak-${roomCount}-${duration}.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify({...result,metrics:undefined,maxRssMiB:Math.max(0,...metrics.map(m=>m.rss))/1048576}));
}
