import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const base='http://127.0.0.1:4192',sleep=ms=>new Promise(r=>setTimeout(r,ms));
let server,browser;const errors=[];
async function start(){
  server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4192'},stdio:'inherit'});
  for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)return;}catch{}await sleep(100);}
  throw Error('Restarted server did not become healthy');
}
async function stop(){const child=server;if(!child||child.exitCode!==null)return;const exited=new Promise(r=>child.once('exit',r));child.kill('SIGTERM');await exited;}
try{
  await start();browser=await chromium.launch({headless:true});const pages=[];
  for(let i=0;i<2;i++){
    const context=await browser.newContext(),page=await context.newPage();pages.push(page);
    page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  }
  const [host,guest]=pages;
  async function joinAndStart(){
    await host.locator('#create-room').click();await host.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
    const code=await host.locator('#game').getAttribute('data-room');
    await guest.locator('#room-code').fill(code);await guest.locator('#join-room').click();
    await guest.waitForFunction(()=>JSON.parse(document.querySelector('#game').dataset.players).length===2);
    await guest.locator('#room-ready').click();await host.locator('#start-story').click();
    await Promise.all(pages.map(p=>p.waitForFunction(()=>document.querySelector('#game').dataset.state==='playing')));
    return code;
  }
  const oldCode=await joinAndStart(),oldPlayers=JSON.parse(await host.locator('#game').getAttribute('data-players')).map(p=>p.id);
  await host.locator('#game').focus();await host.keyboard.down('ArrowRight');await sleep(300);
  // Stop only this harness's local child. No deployed service is interrupted.
  await stop();
  await Promise.all(pages.map(p=>p.waitForFunction(()=>document.querySelector('#game').dataset.room===''&&document.querySelector('#game').dataset.state==='title')));
  for(const p of pages){assert.match(await p.locator('#room-status').textContent(),/Connection lost/);assert.equal(await p.locator('#room-roster').textContent(),'');}
  await start();assert.equal((await(await fetch(base+'/health')).json()).rooms,0);
  await guest.locator('#room-code').fill(oldCode);await guest.locator('#join-room').click();
  await guest.waitForFunction(()=>/not found/i.test(document.querySelector('#room-status').textContent));
  assert.equal(await guest.locator('#game').getAttribute('data-room'),'');
  await joinAndStart();await sleep(300);
  const fresh=JSON.parse(await host.locator('#game').getAttribute('data-players'));
  assert.ok(fresh.every(p=>!oldPlayers.includes(p.id)));assert.ok(Math.abs(fresh[0].x-27)<1,'new run has no retained movement');
  assert.equal(await host.locator('#game').getAttribute('data-hearts'),'4');
  await host.keyboard.up('ArrowRight');
  await Promise.all(pages.map(p=>p.locator('#leave-room').click()));
  for(let i=0;i<100&&(await(await fetch(base+'/health')).json()).rooms;i++)await sleep(50);
  assert.equal((await(await fetch(base+'/health')).json()).rooms,0);assert.deepEqual(errors,[]);
  console.log('Browser restart PASS:',browser.version(),'local process restart clears both clients, old code rejected, fresh identities/ready/start and zero phantom rooms.');
}finally{await browser?.close();await stop();}
