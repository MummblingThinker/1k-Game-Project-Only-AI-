import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {routeIntent} from './route-driver.mjs';
const base='http://127.0.0.1:4195',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4195'},stdio:'inherit'});
let browser;const errors=[];
try{
  for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await sleep(100);}
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await mkdir('artifacts/giant',{recursive:true});
  const snapshot=()=>page.evaluate(()=>window.readQaState());
  async function fresh(){
    await page.goto(base+'/?level=1&debug=1');
    await page.evaluate(async()=>{window.readQaState=(await import('/js/game.js')).readDebugSnapshot;});
    await page.locator('#game').focus();
  }
  await fresh();await page.keyboard.down('ArrowRight');
  await page.waitForFunction(()=>window.readQaState()?.you.x>=100);await page.keyboard.up('ArrowRight');
  await page.waitForFunction(()=>window.readQaState()?.world.giant.x>=-10,null,{timeout:30000});
  const giant=await page.locator('.screen-frame').screenshot({path:'artifacts/giant/approach.jpg',type:'jpeg',quality:85});
  console.log('GIANT_BASE64_BEGIN'+giant.toString('base64')+'GIANT_BASE64_END');
  await page.keyboard.press('Escape');const paused=await snapshot();await sleep(500);const frozen=await snapshot();
  assert.equal(frozen.phase,'paused');assert.equal(frozen.tick,paused.tick);assert.equal(frozen.world.giant.x,paused.world.giant.x);
  await page.locator('#pause-game').click();
  await page.waitForFunction(()=>window.readQaState()?.hearts===2,null,{timeout:10000});
  await page.keyboard.press('Escape');await sleep(1100);
  const contactReport=JSON.parse(await page.locator('#debug-report').inputValue());
  assert.equal(contactReport.events.filter(e=>e.type==='death').length,1);
  assert.match(contactReport.events.find(e=>e.type==='death').cause,/pursuer/i);
  assert.equal((await snapshot()).hearts,2);

  // Reach the actual shelter with keyboard input, then let the pursuer breach it.
  await fresh();const held={};
  for(let step=0;step<600;step++){
    const s=await snapshot(),cp=s.world.checkpoints[0];
    if(cp.active&&s.you.x>=cp.x+14)break;
    const intent=routeIntent(s);
    for(const[key,code]of Object.entries({left:'ArrowLeft',right:'ArrowRight',jump:'Space'})){
      if(!!held[key]!==!!intent.input[key]){held[key]=!!intent.input[key];await page.keyboard[held[key]?'down':'up'](code);}
    }
    await sleep(35);
  }
  for(const code of ['ArrowLeft','ArrowRight','Space'])await page.keyboard.up(code);
  const sheltered=await snapshot(),cp=sheltered.world.checkpoints[0];
  assert.ok(cp.active&&!cp.destroyed&&sheltered.you.x>=cp.x&&sheltered.you.x<cp.x+cp.w);
  assert.equal(sheltered.hearts,3);
  const camera=Number(await page.locator('#game').getAttribute('data-camera-x'));
  assert.ok(sheltered.you.x-camera>20&&sheltered.you.x-camera<300,'camera keeps shelter player in frame');
  const approachTicks=sheltered.world.giant.wakeTicks+Math.max(0,(cp.x-35-sheltered.world.giant.x)/sheltered.world.giant.speed);
  await page.waitForFunction(()=>window.readQaState()?.world.checkpoints[0].destroyed,null,{timeout:Math.ceil(approachTicks/60*1000)+10000});
  const breached=await snapshot();
  assert.ok(!breached.world.platforms.some(p=>p.shelterX===cp.x),'breach removes roof and side steps');
  const breach=await page.locator('.screen-frame').screenshot({path:'artifacts/giant/breach.jpg',type:'jpeg',quality:85});
  console.log('BREACH_BASE64_BEGIN'+breach.toString('base64')+'BREACH_BASE64_END');
  await page.waitForFunction(()=>window.readQaState()?.hearts===2,null,{timeout:4000});
  await page.keyboard.press('Escape');await sleep(1100);
  const breachReport=JSON.parse(await page.locator('#debug-report').inputValue());
  assert.equal(breachReport.events.filter(e=>e.type==='death').length,1);
  assert.match(breachReport.events.find(e=>e.type==='death').cause,/pursuer/i);
  assert.equal((await snapshot()).hearts,2);assert.deepEqual(errors,[]);
  await writeFile('artifacts/giant/result.json',JSON.stringify({browser:browser.version(),contactReport,breachReport,errors},null,2));
  console.log('Giant browser PASS:',browser.version(),'actual approach/pause/contact and shelter breach; one heart per death; no state mutation.');
}finally{await browser?.close();server.kill('SIGTERM');}
