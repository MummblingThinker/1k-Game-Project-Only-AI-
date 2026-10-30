import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {routeIntent} from './route-driver.mjs';

const party=Number(process.env.TEST_PARTY||2),first=Number(process.env.TEST_FIRST_LEVEL||1),last=Number(process.env.TEST_LAST_LEVEL||15);
assert.ok([2,3,4].includes(party)&&first>=1&&last<=15&&first<=last);
const base='http://127.0.0.1:4198',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4198'},stdio:'inherit'});
let browser;const peers=[],errors=[],results=[];
async function until(test,label,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){if(await test())return;await sleep(40);}throw Error('Timed out: '+label);}
async function input(peer,intent){
  const mapping={left:'ArrowLeft',right:'ArrowRight',jump:'Space'};
  for(const [key,code] of Object.entries(mapping)){
    if(!!intent.input[key]===!!peer.held[key])continue;
    peer.held[key]=!!intent.input[key];await peer.page.keyboard[intent.input[key]?'down':'up'](code);
  }
  if(intent.interact&&Date.now()-(peer.lastUse||0)>230){peer.lastUse=Date.now();await peer.page.keyboard.press('e');}
}
const started=Date.now();
try {
  await mkdir('artifacts/browser-campaign',{recursive:true});
  await until(async()=>{try{return(await fetch(base+'/health')).ok;}catch{return false;}},'server');
  browser=await chromium.launch({headless:true});
  console.log('Full campaign browser:',browser.version(),'independent contexts:',party);
  for(let i=0;i<party;i++){
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    const page=await context.newPage(),peer={context,page,held:{}};peers.push(peer);
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('websocket',socket=>socket.on('framereceived',({payload})=>{
      const frame=String(payload);if(!frame.startsWith('42'))return;
      const [event,value]=JSON.parse(frame.slice(2));
      if(event==='roomState')peer.state=value;
      if(event==='roomJoined')peer.state=value.state;
    }));
    await page.goto(base+(i===0?'/?debug=1':''));
  }
  const host=peers[0];
  await host.page.locator('#create-room').click();
  await host.page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  const code=await host.page.locator('#game').getAttribute('data-room');
  for(const peer of peers.slice(1)){
    await peer.page.locator('#room-code').fill(code);await peer.page.locator('#join-room').click();
    await peer.page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  }
  await host.page.locator('#level-select').selectOption(String(first));
  await Promise.all(peers.map(p=>p.page.waitForFunction(n=>JSON.parse(document.querySelector('#game').dataset.players).length===n,party)));
  for(const peer of peers.slice(1).reverse())await peer.page.locator('#room-ready').click();
  await host.page.locator('#start-story').click();
  for(let level=first;level<=last;level++){
    await until(()=>peers.every(p=>p.state?.level===level&&p.state.phase==='playing'),'stage '+level);
    await Promise.all(peers.map(async p=>{p.held={};await p.page.locator('#game').focus();}));
    const stageStarted=Date.now(),end=stageStarted+260000;
    assert.ok(peers.every(p=>p.state.hearts===(party===4?5:4)),'fresh stage heart pool');
    while(Date.now()<end&&host.state.phase==='playing'){
      await Promise.all(peers.map(p=>input(p,routeIntent(p.state))));
      await sleep(35);
    }
    await Promise.all(peers.map(p=>input(p,{input:{},interact:false})));
    assert.equal(host.state.phase,'victory',JSON.stringify({level,hearts:host.state.hearts,notice:host.state.notice,players:host.state.players}));
    await until(()=>peers.every(p=>p.state.phase==='victory'),'shared victory');
    assert.ok(peers.every(p=>p.state.hearts===host.state.hearts),'shared hearts');
    assert.deepEqual(errors,[]);
    const result={level,seconds:Math.round((Date.now()-stageStarted)/1000),hearts:host.state.hearts};results.push(result);
    console.log('Browser campaign stage PASS:',JSON.stringify(result));
    await host.page.screenshot({path:'artifacts/browser-campaign/stage-'+level+'.jpg',type:'jpeg',quality:65});
    await host.page.locator('#continue-level').click();
    if([5,10,15].includes(level)){
      await until(()=>peers.every(p=>p.state.phase==='cutscene'),'shared story');
      const story=host.state.storyKey;assert.equal(story,'after'+level);
      await until(()=>peers.every(p=>p.state.phase!=='cutscene'),'unskipped story timing',35000);
      console.log('Browser campaign story PASS:',story);
    }
  }
  if(last===15)assert.ok(peers.every(p=>p.state.phase==='ending'),'shared default ending');
  await Promise.all(peers.map(p=>p.page.locator('#leave-room').click()));
  await until(async()=> (await(await fetch(base+'/health')).json()).rooms===0,'cleanup');
  await writeFile('artifacts/browser-campaign/result.json',JSON.stringify({browser:browser.version(),party,results,seconds:Math.round((Date.now()-started)/1000),errors},null,2));
  console.log('Browser campaign PASS:',party,'independent contexts; actual UI/keyboard and observed WebSocket snapshots; no state mutation; stages',first,'through',last);
}catch(error){
  console.error(error);
  for(let i=0;i<peers.length;i++){
    await peers[i].page.screenshot({path:'artifacts/browser-campaign/failure-'+i+'.jpg',type:'jpeg',quality:75}).catch(()=>{});
    await writeFile('artifacts/browser-campaign/state-'+i+'.json',JSON.stringify(peers[i].state,null,2)||'null');
  }
  await writeFile('artifacts/browser-campaign/partial.json',JSON.stringify({results,errors},null,2));process.exitCode=1;
}finally{await browser?.close();server.kill('SIGTERM');}
