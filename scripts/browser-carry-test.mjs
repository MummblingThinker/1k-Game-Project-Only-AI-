import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {routeIntent} from './route-driver.mjs';
const base='http://127.0.0.1:4191',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4191'},stdio:'inherit'});
let browser;const peers=[],errors=[];
async function until(fn,label,timeout=8000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(30);}throw Error('Timed out: '+label);}
const snapshot=p=>p.page.evaluate(()=>window.readQaState());
async function agreed(fn,label){await until(async()=> (await Promise.all(peers.map(snapshot))).every(fn),label);}
try{
  await until(async()=>{try{return(await fetch(base+'/health')).ok;}catch{return false;}},'server');
  browser=await chromium.launch({headless:true});
  for(let i=0;i<4;i++){
    const context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage();peers.push({page,context});
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(base+'/?debug=1');await page.evaluate(async()=>{window.readQaState=(await import('/js/game.js')).readDebugSnapshot;});
  }
  const [a,b,c,d]=peers;await a.page.locator('#create-room').click();
  await a.page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  const code=await a.page.locator('#game').getAttribute('data-room');
  for(const p of peers.slice(1)){await p.page.locator('#room-code').fill(code);await p.page.locator('#join-room').click();await p.page.waitForFunction(()=>document.querySelector('#game').dataset.state==='lobby');await p.page.locator('#room-ready').click();}
  await a.page.locator('#start-story').click();await agreed(s=>s?.phase==='playing','shared start');
  for(const p of peers)await p.page.locator('#game').focus();
  const ids=(await snapshot(a)).players.map(p=>p.id);
  await a.page.keyboard.press('f');await agreed(s=>s.players[0].carryId===ids[1]&&s.players[1].carriedBy===ids[0],'first pair carried');
  await c.page.keyboard.press('f');await agreed(s=>s.players[2].carryId===ids[3]&&s.players[3].carriedBy===ids[2],'second pair carried');
  assert.match(await a.page.locator('#room-roster').textContent(),/carrying.*carried.*carrying.*carried/);
  await mkdir('artifacts/carry',{recursive:true});
  const shot=await a.page.locator('.screen-frame').screenshot({path:'artifacts/carry/two-pairs.jpg',type:'jpeg',quality:85});
  console.log('CARRY_BASE64_BEGIN'+shot.toString('base64')+'CARRY_BASE64_END');
  await b.page.keyboard.press('Space',{delay:100});await agreed(s=>!s.players[0].carryId&&!s.players[1].carriedBy,'passenger jumps free');
  await sleep(250);await c.page.keyboard.press('q');await agreed(s=>!s.players[2].carryId&&!s.players[3].carriedBy,'second pair dropped');
  await agreed(s=>s.players[1].onGround&&s.players[3].onGround,'passengers land');
  await a.page.keyboard.press('f');await agreed(s=>s.players[0].carryId===ids[1],'lift again');await sleep(250);
  const before=(await snapshot(b)).you.x;await a.page.keyboard.press('f');
  await agreed(s=>!s.players[0].carryId&&!s.players[1].carriedBy&&s.players[1].x>before+25,'shared teammate throw');
  async function walk(p,target){await p.page.locator('#game').focus();await p.page.keyboard.down('ArrowRight');try{await p.page.waitForFunction(x=>window.readQaState().you.x>=x,target);}finally{await p.page.keyboard.up('ArrowRight');}await sleep(200);}
  await walk(a,165);await a.page.keyboard.press('e');
  await agreed(s=>s.world.crates[0].carriedBy===ids[0]&&s.players[0].carryId===s.world.crates[0].id,'shared crate pickup');
  await sleep(250);await a.page.keyboard.press('q');await agreed(s=>!s.world.crates[0].carriedBy&&!s.players[0].carryId,'shared crate drop');
  await walk(c,165);await c.page.keyboard.press('e');await agreed(s=>s.world.crates[0].carriedBy===ids[2],'different player picks up crate');
  await sleep(250);const crateX=(await snapshot(c)).world.crates[0].x;await c.page.keyboard.press('e');
  await agreed(s=>!s.world.crates[0].carriedBy&&!s.players[2].carryId&&s.world.crates[0].x>crateX+10,'shared crate throw');
  await agreed(s=>s.hearts===5&&s.players.every(p=>p.alive),'no spurious heart cost');assert.deepEqual(errors,[]);
  await Promise.all(peers.map(p=>p.page.locator('#leave-room').click()));
  await until(async()=> (await(await fetch(base+'/health')).json()).rooms===0,'cleanup');
  console.log('Carry browser PASS:',browser.version(),'four independent contexts, two carrying pairs, passenger escape, drop, teammate throw, crate ownership handoff/throw, five hearts and cleanup.');
  await a.page.locator('#create-room').click();await a.page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  await a.page.locator('#level-select').selectOption('9');
  await b.page.locator('#room-code').fill(await a.page.locator('#game').getAttribute('data-room'));await b.page.locator('#join-room').click();
  await b.page.waitForFunction(()=>document.querySelector('#game').dataset.state==='lobby');await b.page.locator('#room-ready').click();await a.page.locator('#start-story').click();
  const team=[a,b];await until(async()=> (await Promise.all(team.map(snapshot))).every(s=>s.phase==='playing'),'salvage stage');
  const block=(await snapshot(a)).world.platforms.find(p=>p.kind==='breakable');assert.ok(block);
  for(const p of team){p.held={};await p.page.locator('#game').focus();}
  await until(async()=>{
    const states=await Promise.all(team.map(snapshot));
    if(states.every(s=>!s.world.platforms.some(p=>p.id===block.id)))return true;
    for(let i=0;i<team.length;i++){
      const p=team[i],s=states[i],stopAt=i===0?block.x+3:block.x-80;
      const command=s.you.x>=stopAt?{input:{}}:routeIntent(s);
      for(const[key,code]of Object.entries({left:'ArrowLeft',right:'ArrowRight',jump:'Space'}))if(!!p.held[key]!==!!command.input[key]){
        p.held[key]=!!command.input[key];await p.page.keyboard[p.held[key]?'down':'up'](code);
      }
      if(command.interact&&Date.now()-(p.lastUse||0)>250){p.lastUse=Date.now();await p.page.keyboard.press('e');}
    }
    return false;
  },'actual stomp clears shared salvage',45000);
  for(const p of team)for(const key of ['ArrowLeft','ArrowRight','Space'])await p.page.keyboard.up(key);
  assert.ok((await Promise.all(team.map(snapshot))).every(s=>s.hearts===4&&s.players.every(p=>p.alive)));
  const salvage=await a.page.locator('.screen-frame').screenshot({path:'artifacts/carry/shared-salvage.jpg',type:'jpeg',quality:85});
  console.log('SALVAGE_BASE64_BEGIN'+salvage.toString('base64')+'SALVAGE_BASE64_END');
  await Promise.all(team.map(p=>p.page.locator('#leave-room').click()));await until(async()=> (await(await fetch(base+'/health')).json()).rooms===0,'salvage cleanup');
  assert.deepEqual(errors,[]);console.log('Salvage browser PASS: actual two-client route/stomp removes the same object, no heart loss, cleanup.');
}catch(error){
  const states=await Promise.all(peers.map(snapshot));console.error('CARRY FAILURE STATES',JSON.stringify(states.map(s=>({phase:s.phase,you:s.you,crates:s.world.crates}))));throw error;
}finally{await browser?.close();server.kill('SIGTERM');}
