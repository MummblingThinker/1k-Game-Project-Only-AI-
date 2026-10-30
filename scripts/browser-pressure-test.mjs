import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base='http://127.0.0.1:4187',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4187'},stdio:'inherit'});
let browser;const peers=[],errors=[];
async function until(fn,label,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(30);}throw Error('Timed out: '+label);}
const snapshot=page=>page.evaluate(()=>window.readQaState());
try{
  await until(async()=>{try{return(await fetch(base+'/health')).ok;}catch{return false;}},'server');
  browser=await chromium.launch({headless:true});
  for(let i=0;i<2;i++){
    const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();peers.push(page);
    await context.addInitScript(()=>{
      window.qaPlateText=new Set();const original=CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText=function(text,...args){
        if(this.canvas.id==='game'&&/^(HELD|[1-8]s|WEIGHT \/ CRATE)$/.test(text))window.qaPlateText.add(text);
        return original.call(this,text,...args);
      };
    });
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(base+'/?debug=1');await page.evaluate(async()=>{window.readQaState=(await import('/js/game.js')).readDebugSnapshot;});
  }
  const[a,b]=peers;await a.locator('#create-room').click();await a.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  await a.locator('#level-select').selectOption('6');await b.locator('#room-code').fill(await a.locator('#game').getAttribute('data-room'));await b.locator('#join-room').click();
  await b.waitForFunction(()=>document.querySelector('#game').dataset.state==='lobby');await b.locator('#room-ready').click();await a.locator('#start-story').click();
  await until(async()=> (await Promise.all(peers.map(snapshot))).every(s=>s?.phase==='playing'),'start');await a.locator('#game').focus();
  async function walk(page,target){
    await page.locator('#game').focus();
    const right=(await snapshot(page)).you.x<target,key=right?'ArrowRight':'ArrowLeft';await page.keyboard.down(key);
    try{await page.waitForFunction(({target,right})=>{const p=window.readQaState().you;return right?p.x>=target:p.x<=target;},{target,right},{timeout:8000});}
    finally{await page.keyboard.up(key);}await sleep(200);
  }
  async function agreed(test,label){await until(async()=> (await Promise.all(peers.map(snapshot))).every(test),label);}
  await Promise.all([walk(a,244),walk(b,200)]);await agreed(s=>s.world.plates[0].held&&s.world.platforms.some(p=>p.kind==='pressure-bridge'),'weight holds bridge');
  await walk(a,200);await sleep(1200);
  await agreed(s=>{
    const plate=s.world.plates[0];return plate.held&&plate.remaining===480&&s.players.every(p=>p.x+p.w<=plate.x||p.x>=plate.x+plate.w);
  },'crate alone holds bridge');
  await mkdir('artifacts/pressure',{recursive:true});
  await a.locator('.screen-frame').screenshot({path:'artifacts/pressure/crate-held.jpg',type:'jpeg',quality:85});
  // Keep both actual survivors ahead of the pursuing giant while observing
  // the bridge, rather than leaving the guest idle at the starting line.
  await Promise.all(peers.map(p=>walk(p,300)));await agreed(s=>!s.world.plates[0].held&&s.world.plates[0].remaining>400,'release begins eight-second countdown');
  const released=await snapshot(a);const shot=await a.locator('.screen-frame').screenshot({path:'artifacts/pressure/countdown.jpg',type:'jpeg',quality:85});
  console.log('PRESSURE_BASE64_BEGIN'+shot.toString('base64')+'PRESSURE_BASE64_END');
  await agreed(s=>!s.world.plates[0].remaining&&!s.world.platforms.some(p=>p.kind==='pressure-bridge'&&p.x===s.world.plates[0].bridgeX),'shared expiry');
  const expired=await snapshot(a);assert.ok(expired.tick-released.tick>=released.world.plates[0].remaining-2,'full remaining countdown elapses');
  const text=await a.evaluate(()=>[...window.qaPlateText]);for(const label of ['HELD','8s','1s','WEIGHT / CRATE'])assert.ok(text.includes(label),'visible plate label '+label);
  await agreed(s=>s.hearts===4&&s.players.every(p=>p.alive),'no incidental death');assert.deepEqual(errors,[]);
  const result={browser:browser.version(),releasedRemaining:released.world.plates[0].remaining,elapsedTicks:expired.tick-released.tick,text,errors};
  await writeFile('artifacts/pressure/result.json',JSON.stringify(result,null,2));
  await Promise.all(peers.map(p=>p.locator('#leave-room').click()));await until(async()=> (await(await fetch(base+'/health')).json()).rooms===0,'cleanup');
  console.log('Pressure browser PASS:',JSON.stringify(result));
}finally{await browser?.close();server.kill('SIGTERM');}
