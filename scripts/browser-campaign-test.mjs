import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {routeIntent} from './route-driver.mjs';
import {snapshotAudit} from './snapshot-audit.mjs';

const party=Number(process.env.TEST_PARTY||2),first=Number(process.env.TEST_FIRST_LEVEL||1),last=Number(process.env.TEST_LAST_LEVEL||15);
assert.ok([1,2,3,4].includes(party)&&first>=1&&last<=15&&first<=last);
const base=process.env.BROWSER_BASE_URL||'http://127.0.0.1:4198',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=process.env.BROWSER_BASE_URL?null:spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4198'},stdio:'inherit'});
let browser,createdRoom;const peers=[],errors=[],results=[],losses=[];
const consistency=snapshotAudit(party,message=>errors.push(message));
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
const expectedHeadings={after5:['THE CITY GATE','THE HUNT CONTINUES'],after10:['A HUNDRED EYES ABOVE','BEHIND THE DOOR','THEY ARE BEING MADE'],after15:['WE DID IT','NOT ALL OF THEM']};
try {
  await mkdir('artifacts/browser-campaign',{recursive:true});
  await until(async()=>{try{return(await fetch(base+'/health')).ok;}catch{return false;}},'server');
  browser=await chromium.launch({headless:true});
  console.log('Full campaign browser:',browser.version(),'independent contexts:',party,'origin:',base);
  for(let i=0;i<party;i++){
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    const page=await context.newPage(),peer={context,page,held:{},roomErrors:[]};peers.push(peer);
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('websocket',socket=>socket.on('framereceived',({payload})=>{
      const frame=String(payload);if(!frame.startsWith('42'))return;
      const [event,value]=JSON.parse(frame.slice(2));
      if(event==='roomState'){peer.state=value;consistency.observe(i,value);}
      if(event==='roomJoined')peer.state=value.state;
      if(event==='roomError')peer.roomErrors.push(value);
    }));
    await page.goto(base+(i===0?'/?debug=1':''));
  }
  const host=peers[0];
  if(party===1){
    if(first===1){
      await host.page.locator('#start-story').click();
      const opening=new Set();
      await until(async()=>{
        const phase=await host.page.locator('#game').getAttribute('data-state');
        if(phase==='cutscene')opening.add(await host.page.locator('#story-heading').textContent());
        return phase==='playing';
      },'default opening',30000);
      assert.deepEqual([...opening],['THE CITY FALLS','RUN!','STAY TOGETHER']);
      console.log('Browser campaign story PASS: opening / default timing');
    }else{
      await host.page.locator('#level-select').selectOption(String(first));await host.page.locator('#play-selected').click();
    }
  }else{
    await host.page.locator('#create-room').click();
  await host.page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  const code=await host.page.locator('#game').getAttribute('data-room');
  createdRoom=code;
  for(const peer of peers.slice(1)){
    await peer.page.locator('#room-code').fill(code);await peer.page.locator('#join-room').click();
    await peer.page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  }
  await host.page.locator('#level-select').selectOption(String(first));
  await Promise.all(peers.map(p=>p.page.waitForFunction(n=>JSON.parse(document.querySelector('#game').dataset.players).length===n,party)));
  for(const peer of peers.slice(1).reverse())await peer.page.locator('#room-ready').click();
  await host.page.locator('#start-story').click();
  }
  const sample=async()=>{if(party===1)host.state=await host.page.evaluate(async()=>{const game=await import('/js/game.js');return game.readDebugSnapshot();});};
  for(let level=first;level<=last;level++){
    await until(async()=>{await sample();return peers.every(p=>p.state?.level===level&&p.state.phase==='playing');},'stage '+level);
    await Promise.all(peers.map(async p=>{p.held={};await p.page.locator('#game').focus();}));
    const stageStarted=Date.now();let attempt=0;
    assert.ok(peers.every(p=>p.state.hearts===(party===1?3:party===4?5:4)),'fresh stage heart pool');
    while(true){
      attempt++;const end=Date.now()+260000;
      while(Date.now()<end&&host.state.phase==='playing'){
        await Promise.all(peers.map(p=>input(p,routeIntent(p.state))));
        await sleep(35);
        await sample();
      }
      await Promise.all(peers.map(p=>input(p,{input:{},interact:false})));
      if(host.state.phase==='victory')break;
      // Real game-over recovery is part of a playable campaign. Record every
      // loss, allow at most two replays for the entire run, and never retry a
      // timeout/softlock or suppress a console error.
      if(host.state.phase!=='gameover'||losses.length>=2||errors.length)break;
      const loss={level,attempt,hearts:host.state.hearts,notice:host.state.notice,players:host.state.players};losses.push(loss);
      console.log('Browser campaign recorded game-over/replay:',JSON.stringify(loss));
      await host.page.screenshot({path:`artifacts/browser-campaign/gameover-${level}-${attempt}.jpg`,type:'jpeg',quality:75});
      await host.page.locator('#scene-retry').click();
      await until(async()=>{await sample();return peers.every(p=>p.state.phase==='playing'&&p.state.level===level);},'shared replay');
      assert.ok(peers.every(p=>p.state.hearts===(party===1?3:party===4?5:4)&&p.state.players.every(q=>q.alive)),'replay resets hearts and survivors');
      await Promise.all(peers.map(async p=>{p.held={};await p.page.locator('#game').focus();}));
    }
    assert.equal(host.state.phase,'victory',JSON.stringify({level,hearts:host.state.hearts,notice:host.state.notice,players:host.state.players}));
    await until(()=>peers.every(p=>p.state.phase==='victory'),'shared victory');
    assert.ok(peers.every(p=>p.state.hearts===host.state.hearts),'shared hearts');
    if(party>1)assert.ok(consistency.count(level)>100,'complete shared-world snapshots agree throughout stage '+level);
    assert.deepEqual(errors,[]);
    const result={level,attempts:attempt,seconds:Math.round((Date.now()-stageStarted)/1000),hearts:host.state.hearts,matchedSnapshots:consistency.count(level)};results.push(result);
    console.log('Browser campaign stage PASS:',JSON.stringify(result));
    await host.page.screenshot({path:'artifacts/browser-campaign/stage-'+level+'.jpg',type:'jpeg',quality:65});
    await host.page.locator('#continue-level').click();
    if([5,10,15].includes(level)){
      await until(async()=>{await sample();return peers.every(p=>p.state.phase==='cutscene');},'shared story');
      const story=party===1?'after'+level:host.state.storyKey;assert.equal(story,'after'+level);
      await Promise.all(peers.map(p=>p.page.waitForFunction(first=>document.querySelector('#story-heading').textContent===first,expectedHeadings[story][0])));
      const seen=peers.map(()=>new Set());let blackout=false;
      await until(async()=>{
        await sample();
        for(let i=0;i<peers.length;i++)if(peers[i].state.phase==='cutscene'){
          const heading=await peers[i].page.locator('#story-heading').textContent();
          if(heading)seen[i].add(heading);
        }
        if(level===15&&host.state.phase==='cutscene')blackout||=await host.page.locator('#comic-panels').evaluate(e=>getComputedStyle(e).filter.includes('brightness(0)'));
        return peers.every(p=>p.state.phase!=='cutscene');
      },'unskipped story timing',35000);
      for(const headings of seen)assert.deepEqual([...headings],expectedHeadings[story],'every peer sees the authored caption order');
      if(level===15)assert.ok(blackout,'default ambush visibly cuts to black before ending');
      console.log('Browser campaign story PASS:',story,JSON.stringify({headings:[...seen[0]],blackout}));
    }
  }
  if(last===15)assert.ok(peers.every(p=>p.state.phase==='ending'),'shared default ending');
  if(party>1)await Promise.all(peers.map(p=>p.page.locator('#leave-room').click()));
  if(server)await until(async()=> (await(await fetch(base+'/health')).json()).rooms===0,'cleanup');
  else if(createdRoom){
    await Promise.all(peers.map(p=>p.page.waitForFunction(()=>document.querySelector('#game').dataset.room==='')));
    await host.page.locator('#room-code').fill(createdRoom);await host.page.locator('#join-room').click();
    await until(()=>host.roomErrors.some(e=>/not found/i.test(e)),'own public room removed');
    assert.equal(await host.page.locator('#game').getAttribute('data-room'),'');
    console.log('Public campaign cleanup PASS: own room removed; other rooms preserved.');
  }
  await writeFile('artifacts/browser-campaign/result.json',JSON.stringify({browser:browser.version(),origin:base,party,results,losses,seconds:Math.round((Date.now()-started)/1000),errors},null,2));
  console.log('Browser campaign PASS:',party,'independent contexts; actual UI/keyboard and observed WebSocket snapshots; no state mutation; stages',first,'through',last);
}catch(error){
  console.error(error);
  for(let i=0;i<peers.length;i++){
    await peers[i].page.screenshot({path:'artifacts/browser-campaign/failure-'+i+'.jpg',type:'jpeg',quality:75}).catch(()=>{});
    await writeFile('artifacts/browser-campaign/state-'+i+'.json',JSON.stringify(peers[i].state,null,2)||'null');
  }
  await writeFile('artifacts/browser-campaign/partial.json',JSON.stringify({results,losses,errors},null,2));process.exitCode=1;
}finally{await browser?.close();server?.kill('SIGTERM');}
