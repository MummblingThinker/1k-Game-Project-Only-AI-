import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {delayedProxy} from './delayed-proxy.mjs';
import {snapshotAudit} from './snapshot-audit.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),port=4189;
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:String(port)},stdio:'inherit'});
let browser,proxy;const peers=[],errors=[];
const audit=snapshotAudit(2,message=>errors.push(message));
async function until(fn,label,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(30);}throw Error('Timed out: '+label);}
try{
  await until(async()=>{try{return(await fetch(`http://127.0.0.1:${port}/health`)).ok;}catch{return false;}},'server');
  proxy=await delayedProxy(port);const base=`http://127.0.0.1:${proxy.port}`;
  browser=await chromium.launch({headless:true});
  for(let index=0;index<2;index++){
    const context=await browser.newContext(),page=await context.newPage(),peer={context,page,states:[]};peers.push(peer);
    // Observe the real renderer's labels; never replace game positions or input.
    await context.addInitScript(()=>{
      window.qaLabels=[];window.qaCapture=false;
      const original=CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){
        if(window.qaCapture&&this.canvas.id==='game'&&text==='P1')window.qaLabels.push({at:performance.now(),x,y});
        return original.call(this,text,x,y,...rest);
      };
    });
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    page.on('websocket',socket=>socket.on('framereceived',({payload})=>{
      const frame=String(payload);if(!frame.startsWith('42'))return;
      const[event,value]=JSON.parse(frame.slice(2));
      if(event==='roomState'){peer.state=value;peer.states.push(value);audit.observe(index,value);}
      if(event==='roomJoined')peer.state=value.state;
      if(event==='roomError')errors.push(value.message||String(value));
    }));
    await page.goto(base);
  }
  const[a,b]=peers;await a.page.locator('#create-room').click();
  // Socket.IO can deliver the initial lobby over HTTP polling before upgrading
  // to WebSocket. Use the real UI for setup, then audit gameplay broadcasts.
  await a.page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  await b.page.locator('#room-code').fill(await a.page.locator('#game').getAttribute('data-room'));await b.page.locator('#join-room').click();
  await b.page.waitForFunction(()=>document.querySelector('#game').dataset.state==='lobby');
  await b.page.locator('#room-ready').click();await a.page.locator('#start-story').click();
  await until(()=>peers.every(p=>p.state?.phase==='playing'),'start');
  await a.page.locator('#game').focus();await sleep(500);
  const before=a.state.you.x;await b.page.evaluate(()=>{window.qaLabels=[];window.qaCapture=true;});
  await a.page.keyboard.down('ArrowRight');await sleep(650);await a.page.keyboard.up('ArrowRight');await sleep(1000);
  const stopped=a.state.you.x;assert.ok(stopped>before+20&&stopped<145,'delayed movement remains on first safe ground');
  await sleep(500);assert.equal(a.state.you.x,stopped,'delayed key release stops movement');
  assert.equal(b.state.players.find(p=>p.id===a.state.playerId).x,stopped,'peer settles at authoritative position');
  const labels=await b.page.evaluate(()=>{window.qaCapture=false;return window.qaLabels;});
  assert.ok(labels.length>=35,'real renderer produced enough observed frames');
  assert.ok(new Set(labels.map(p=>p.x)).size>=12,'remote avatar visibly interpolates movement');
  let maxStep=0;for(let i=1;i<labels.length;i++)if(labels[i].at-labels[i-1].at<100)maxStep=Math.max(maxStep,Math.abs(labels[i].x-labels[i-1].x));
  assert.ok(maxStep<=18,`remote render displacement under jitter: ${maxStep}`);
  for(const p of peers)p.states=[];
  await a.page.keyboard.down('Space');await sleep(1400);await a.page.keyboard.up('Space');await sleep(600);
  for(const p of peers){
    const states=p.states.filter(s=>s.phase==='playing').map(s=>s.players.find(q=>q.id===a.state.playerId));
    let jumps=0,ground=true;for(const q of states){if(ground&&!q.onGround)jumps++;ground=q.onGround;}
    assert.equal(jumps,1,'held jump produces one jump through jitter');assert.equal(states.at(-1).onGround,true);
    assert.equal(p.state.hearts,4);assert.ok(p.state.players.every(q=>q.alive));
  }
  assert.deepEqual(errors,[]);const consistency=audit.result();assert.ok(audit.count(1)>=60,'complete shared payloads match despite jitter');
  await mkdir('artifacts/jitter-browser',{recursive:true});
  await b.page.screenshot({path:'artifacts/jitter-browser/settled.png'});
  const result={browser:browser.version(),delay:proxy.stats(),frames:labels.length,distinctPositions:new Set(labels.map(p=>p.x)).size,maxStep,consistency,errors};
  await writeFile('artifacts/jitter-browser/result.json',JSON.stringify(result,null,2));
  await Promise.all(peers.map(p=>p.page.locator('#leave-room').click()));
  await until(async()=> (await(await fetch(`http://127.0.0.1:${port}/health`)).json()).rooms===0,'cleanup');
  console.log('Browser jitter PASS:',JSON.stringify(result));
}finally{await browser?.close();await proxy?.close();server.kill('SIGTERM');}
