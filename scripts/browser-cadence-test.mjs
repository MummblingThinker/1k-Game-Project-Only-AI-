import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base='http://127.0.0.1:4196',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4196'},stdio:'inherit'});
let browser;const results=[],errors=[];
try{
  await mkdir('artifacts/cadence',{recursive:true});
  for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await sleep(100);}
  browser=await chromium.launch({headless:true});
  for(const hz of [30,60,120]){
    const context=await browser.newContext();
    // Emulate callback cadence, not a physical display's refresh rate. The
    // game's real elapsed-time accumulator, physics and keyboard path remain.
    await context.addInitScript(hz=>{
      window.__qaFrames=0;
      window.requestAnimationFrame=callback=>setTimeout(()=>{window.__qaFrames++;callback(performance.now());},1000/hz);
      window.cancelAnimationFrame=id=>clearTimeout(id);
    },hz);
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(base+'/?level=1&debug=1');await page.waitForFunction(()=>document.querySelector('#game').dataset.state==='playing');
    await page.evaluate(async()=>{window.readQaState=(await import('/js/game.js')).readDebugSnapshot;});
    await page.locator('#game').focus();await page.waitForTimeout(150);
    const start=await page.evaluate(async()=>{const s=(await import('/js/game.js')).readDebugSnapshot();return {tick:s.tick,x:s.you.x,frames:window.__qaFrames};});
    await page.keyboard.down('ArrowRight');
    await page.waitForFunction(tick=>window.readQaState().tick>=tick+60,start.tick);
    await page.keyboard.up('ArrowRight');await page.waitForTimeout(150);
    const moved=await page.evaluate(async()=>{const s=(await import('/js/game.js')).readDebugSnapshot();return {tick:s.tick,x:s.you.x,frames:window.__qaFrames};});
    const distance=moved.x-start.x;
    assert.ok(distance>=70&&distance<=87,`elapsed movement at ${hz} callbacks/s: ${distance}`);
    await page.keyboard.down('Space');let minY=129;
    for(let i=0;i<35;i++){await sleep(35);minY=Math.min(minY,Number(await page.locator('#game').getAttribute('data-player-y')));}
    const landed=await page.evaluate(async()=> (await import('/js/game.js')).readDebugSnapshot().you);
    assert.ok(minY>=70&&minY<=82,`jump arc at ${hz}: ${minY}`);
    assert.equal(landed.y,129,'held jump lands without an automatic second jump');assert.equal(landed.onGround,true);
    await page.keyboard.up('Space');await page.waitForTimeout(100);await page.keyboard.press('Space',{delay:80});
    await page.waitForFunction(()=>Number(document.querySelector('#game').dataset.playerY)<120);
    results.push({emulatedCallbacksPerSecond:hz,distance,minY,framesObserved:moved.frames-start.frames});
    await page.screenshot({path:`artifacts/cadence/${hz}.png`});await context.close();
  }
  assert.deepEqual(errors,[]);
  await writeFile('artifacts/cadence/result.json',JSON.stringify({browser:browser.version(),results,errors,scope:'Emulated animation callbacks, not physical refresh-rate certification'},null,2));
  console.log('Browser cadence PASS:',browser.version(),JSON.stringify(results));
}finally{await browser?.close();server.kill('SIGTERM');}
