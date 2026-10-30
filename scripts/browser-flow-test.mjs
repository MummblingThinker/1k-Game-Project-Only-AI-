import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {routeIntent} from './route-driver.mjs';

const base='http://127.0.0.1:4199',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4199'},stdio:'inherit'});
let browser,page;const errors=[],results=[];let navigations=0;
const snapshot=()=>page.evaluate(async()=> (await import('/js/game.js')).readDebugSnapshot());
const phase=expected=>page.waitForFunction(value=>document.querySelector('#game').dataset.state===value,expected,{timeout:30000});
async function clearTutorial(){
  await page.locator('#game').focus();let held={},state=await snapshot();const end=Date.now()+90000;
  while(state.phase==='playing'&&Date.now()<end){
    const intent=routeIntent(state);
    for(const [key,code] of Object.entries({left:'ArrowLeft',right:'ArrowRight',jump:'Space'})){
      if(!!held[key]===!!intent.input[key])continue;
      await page.keyboard[intent.input[key]?'down':'up'](code);held[key]=!!intent.input[key];
    }
    if(intent.interact)await page.keyboard.press('e');
    await sleep(35);state=await snapshot();
  }
  for(const code of ['ArrowLeft','ArrowRight','Space'])await page.keyboard.up(code);
  assert.equal(state.phase,'victory',JSON.stringify({phase:state.phase,hearts:state.hearts,players:state.players}));
  await phase('victory');
}
try{
  await mkdir('artifacts/flow',{recursive:true});
  for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await sleep(100);}
  browser=await chromium.launch({headless:true});page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
  await page.goto(base+'/?debug=1');console.log('Flow browser:',browser.version());
  for(let cycle=1;cycle<=2;cycle++){
    if(cycle===2)await page.setViewportSize({width:390,height:844});
    await phase('title');await page.locator('#start-story').click();await phase('cutscene');
    for(let panel=0;panel<3;panel++)await page.locator('#story-next').click();
    await phase('playing');assert.equal((await snapshot()).hearts,3);
    // Ordinary movement into the teaching pit exhausts the shared pool across retries.
    await page.locator('#game').focus();await page.keyboard.down('ArrowRight');
    try{await phase('gameover');}finally{await page.keyboard.up('ArrowRight');}
    assert.equal((await snapshot()).hearts,0);
    const frame=await page.locator('.screen-frame').boundingBox(),actions=await page.locator('#scene-actions').boundingBox();
    assert.ok(actions.y>=frame.y&&actions.y+actions.height<=frame.y+frame.height,'game-over controls fit the game frame');
    const gameoverImage=await page.screenshot({path:`artifacts/flow/gameover-${cycle}.jpg`,type:'jpeg',quality:80});
    if(cycle===2)console.log('FLOW_BASE64_BEGIN'+gameoverImage.toString('base64')+'FLOW_BASE64_END');
    await page.locator('#scene-retry').click();await phase('playing');
    assert.equal((await snapshot()).hearts,3);assert.ok((await snapshot()).players.every(p=>p.alive));
    await page.locator('#game').focus();await page.keyboard.press('Space',{delay:80});
    await page.waitForFunction(()=>Number(document.querySelector('#game').dataset.playerY)<120);
    await page.keyboard.press('Escape');await phase('paused');
    const paused=await snapshot();await page.waitForTimeout(500);const stillPaused=await snapshot();
    assert.equal(stillPaused.tick,paused.tick);assert.equal(stillPaused.you.y,paused.you.y);
    assert.equal(stillPaused.world.giant.x,paused.world.giant.x);assert.equal(stillPaused.world.giant.wakeTicks,paused.world.giant.wakeTicks);
    await page.locator('#pause-game').click();await phase('playing');
    await page.waitForFunction(()=>Number(document.querySelector('#game').dataset.playerY)===129);
    await clearTutorial();
    await page.locator('#replay-level').click();await phase('playing');assert.equal((await snapshot()).hearts,3);
    await clearTutorial();
    await page.screenshot({path:`artifacts/flow/victory-${cycle}.png`});
    await page.locator('#result-menu').click();await phase('title');
    assert.equal(await page.locator('#result-panel').isVisible(),false);
    assert.equal(navigations,1,'transitions do not reload the page');assert.deepEqual(errors,[]);
    results.push({cycle,gameover:true,replayAfterDeath:true,victoryTwice:true,returnToTitle:true});
    console.log('Flow cycle PASS:',cycle);
  }
  await writeFile('artifacts/flow/result.json',JSON.stringify({browser:browser.version(),results,navigations,errors},null,2));
}catch(error){await page?.screenshot({path:'artifacts/flow/failure.png'}).catch(()=>{});throw error;}
finally{await browser?.close();server.kill('SIGTERM');}
