import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {routeIntent} from './route-driver.mjs';
import {MEMORY_FRAGMENTS} from '../public/js/memories.js';
const base='http://127.0.0.1:4194',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4194'},stdio:'inherit'});
let browser;const errors=[],peers=[];
const snapshot=p=>p.page.evaluate(()=>window.readQaState());
async function until(fn,label,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(35);}throw Error('Timed out: '+label);}
try{
  await until(async()=>{try{return(await fetch(base+'/health')).ok;}catch{return false;}},'server');
  browser=await chromium.launch({headless:true});
  for(let i=0;i<2;i++){
    const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(base+'/?debug=1');await page.evaluate(async()=>{window.readQaState=(await import('/js/game.js')).readDebugSnapshot;});
    peers.push({context,page,held:{}});
  }
  const[host,guest]=peers;
  await host.page.locator('#create-room').click();await host.page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  await guest.page.locator('#room-code').fill(await host.page.locator('#game').getAttribute('data-room'));await guest.page.locator('#join-room').click();
  await guest.page.waitForFunction(()=>document.querySelector('#game').dataset.state==='lobby');
  await host.page.locator('#level-select').selectOption('2');await guest.page.locator('#room-ready').click();await host.page.locator('#start-story').click();
  await until(async()=> (await Promise.all(peers.map(snapshot))).every(s=>s?.phase==='playing'),'start');
  for(const p of peers)await p.page.locator('#game').focus();
  await until(async()=>{
    let reached=true;
    for(const p of peers){
      const s=await snapshot(p),done=s.you.x>=s.world.memory.x-6;reached&&=done;
      const command=done?{input:{}}:routeIntent(s);
      for(const[key,code]of Object.entries({left:'ArrowLeft',right:'ArrowRight',jump:'Space'})){
        if(!!p.held[key]!==!!command.input[key]){p.held[key]=!!command.input[key];await p.page.keyboard[p.held[key]?'down':'up'](code);}
      }
      if(command.interact&&Date.now()-(p.lastUse||0)>230){p.lastUse=Date.now();await p.page.keyboard.press('e');}
    }
    return reached;
  },'optional terminal route',45000);
  await sleep(300);
  for(let attempt=0;attempt<6&&!(await snapshot(host)).world.memory.read;attempt++){await host.page.keyboard.press('e');await sleep(250);}
  await until(async()=> (await Promise.all(peers.map(snapshot))).every(s=>s.world.memory.read),'shared memory read');
  for(const p of peers){
    await p.page.waitForFunction(()=>document.querySelectorAll('#memory-archive li').length===1);
    assert.equal(await p.page.locator('#memory-archive li p').textContent(),MEMORY_FRAGMENTS[2]);
    assert.match(await p.page.locator('#memory-archive summary').textContent(),/1 \/ 14/);
  }
  await host.page.locator('#memory-archive summary').click();
  await mkdir('artifacts/memory',{recursive:true});
  const image=await host.page.locator('#memory-archive').screenshot({path:'artifacts/memory/archive.jpg',type:'jpeg',quality:85});
  console.log('MEMORY_BASE64_BEGIN'+image.toString('base64')+'MEMORY_BASE64_END');
  await host.page.reload();await host.page.waitForFunction(()=>document.querySelectorAll('#memory-archive li').length===1);
  assert.equal(await host.page.locator('#memory-archive li p').textContent(),MEMORY_FRAGMENTS[2]);
  const fresh=await browser.newContext(),freshPage=await fresh.newPage();await freshPage.goto(base);
  assert.equal(await freshPage.locator('#memory-archive li').count(),0,'unrelated browser has its own local archive');
  assert.deepEqual(errors,[]);
  console.log('Memory browser PASS:',browser.version(),'actual two-client optional terminal, shared discovery, persistent reload and isolated fresh browser.');
}finally{await browser?.close();server.kill('SIGTERM');}
