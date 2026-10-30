import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {routeIntent} from './route-driver.mjs';

const base='http://127.0.0.1:4197',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4197'},stdio:'inherit'});
let browser;const peers=[],errors=[];
async function until(fn,label,timeout=15000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(35);}throw Error('Timed out: '+label);}
async function input(peer,value){
  for(const [key,code] of Object.entries({left:'ArrowLeft',right:'ArrowRight',jump:'Space'})){
    if(!!peer.held[key]===!!value[key])continue;
    await peer.page.keyboard[value[key]?'down':'up'](code);peer.held[key]=!!value[key];
  }
}
try{
  await mkdir('artifacts/rescue',{recursive:true});
  await until(async()=>{try{return(await fetch(base+'/health')).ok;}catch{return false;}},'server');
  browser=await chromium.launch({headless:true});console.log('Rescue browser:',browser.version());
  for(let i=0;i<2;i++){
    const context=await browser.newContext(),page=await context.newPage(),peer={context,page,held:{},captured:false,stunned:false,recovered:false};peers.push(peer);
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('websocket',socket=>socket.on('framereceived',({payload})=>{
      const frame=String(payload);if(!frame.startsWith('42'))return;
      const [event,value]=JSON.parse(frame.slice(2));
      if(event==='roomJoined')peer.state=value.state;
      if(event==='roomState')peer.state=value;
      const robot=peer.state?.world?.enemies.find(e=>e.id==='robot-0');
      if(robot?.grabbedId)peer.captured=true;
      if(peer.captured&&robot?.stunned>0)peer.stunned=true;
      if(peer.stunned&&robot?.stunned===0&&robot.phase==='patrol')peer.recovered=true;
    }));
    await page.goto(base);
  }
  const [victim,rescuer]=peers;
  await victim.page.locator('#create-room').click();
  await victim.page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  const roomCode=await victim.page.locator('#game').getAttribute('data-room');
  await rescuer.page.locator('#room-code').fill(roomCode);await rescuer.page.locator('#join-room').click();
  // Lobby packets can arrive over polling before the WebSocket upgrade.
  await rescuer.page.waitForFunction(()=>JSON.parse(document.querySelector('#game').dataset.players).length===2);
  await victim.page.locator('#level-select').selectOption('2');await rescuer.page.locator('#room-ready').click();
  await victim.page.locator('#start-story').click();await until(()=>peers.every(p=>p.state?.phase==='playing'),'start');
  for(const peer of peers)await peer.page.locator('#game').focus();
  // Drive the authored route to just beyond its second pit, with ordinary jumps.
  await until(async()=>{
    for(const peer of peers){const p=peer.state.you;await input(peer,p.x<830?routeIntent(peer.state).input:{});}
    return peers.every(p=>p.state.you.x>=830&&p.state.you.onGround);
  },'approach grabber',35000);
  await until(async()=>{
    const p=victim.state.you,e=victim.state.world.enemies.find(e=>e.id==='robot-0');
    await input(victim,{right:p.x<e.x+4,left:p.x>e.x+9});
    const q=rescuer.state.you,target=Math.max(830,p.x-55);
    await input(rescuer,{right:q.x<target-3,left:q.x>target+5});
    return peers.every(p=>p.captured);
  },'shared capture');
  const hearts=victim.state.hearts;
  await victim.page.screenshot({path:'artifacts/rescue/captured.png'});
  await until(async()=>{
    await input(victim,routeIntent(victim.state).input);
    await input(rescuer,routeIntent(rescuer.state).input);
    return peers.every(p=>p.stunned);
  },'teammate jump rescue',5000);
  assert.ok(peers.every(p=>p.state.hearts===hearts),'successful rescue costs no heart');
  assert.ok(peers.every(p=>p.state.players.every(q=>q.alive&&!q.capture)),'both clients agree on release');
  await victim.page.screenshot({path:'artifacts/rescue/released.png'});
  await until(async()=>{
    for(const peer of peers){const p=peer.state.you,e=peer.state.world.enemies.find(e=>e.id==='robot-0');await input(peer,{left:p.x>e.x-80});}
    return peers.every(p=>p.recovered);
  },'indestructible robot recovers',6000);
  await Promise.all(peers.map(p=>input(p,{})));assert.deepEqual(errors,[]);
  await writeFile('artifacts/rescue/result.json',JSON.stringify({browser:browser.version(),hearts,clients:peers.map(p=>({captured:p.captured,stunned:p.stunned,recovered:p.recovered})),errors},null,2));
  console.log('Browser rescue PASS: separate contexts agree on capture, teammate jump release, unchanged hearts and robot recovery.');
  await Promise.all(peers.map(p=>p.page.locator('#leave-room').click()));
}catch(error){for(let i=0;i<peers.length;i++){const s=peers[i].state;console.error('RESCUE STATE',i,JSON.stringify({phase:s?.phase,hearts:s?.hearts,players:s?.players,enemies:s?.world?.enemies}));await peers[i].page.screenshot({path:`artifacts/rescue/failure-${i}.png`}).catch(()=>{});await writeFile(`artifacts/rescue/state-${i}.json`,JSON.stringify(s,null,2)||'null');}throw error;}
finally{await browser?.close();server.kill('SIGTERM');}
