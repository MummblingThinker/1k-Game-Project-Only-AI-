import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir,writeFile } from 'node:fs/promises';
import { firefox,webkit } from 'playwright';
const engine=process.env.TEST_BROWSER||'firefox';
assert.ok(['firefox','webkit'].includes(engine));
const base='http://127.0.0.1:4193', errors=[],profile={engine};
const child=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4193'},stdio:'inherit'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let browser;
async function pageIn(context){const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});return p;}
const x=async p=>Number(await p.locator('#game').getAttribute('data-player-x'));
try {
  for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await sleep(100);}
  browser=await({firefox,webkit}[engine]).launch({headless:true});profile.version=browser.version();
  await mkdir('artifacts',{recursive:true});
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),p=await pageIn(context);
  await p.goto(base);await p.locator('#start-story').click();
  await p.waitForFunction(()=>document.querySelector('#game').dataset.state==='cutscene');
  await p.waitForTimeout(1600);
  assert.equal(await p.locator('.comic-cell').count(),3);
  assert.equal(await p.locator('.comic-cell').last().evaluate(e=>getComputedStyle(e).opacity),'1');
  for(let i=0;i<3;i++)await p.locator('#story-next').click();
  await p.waitForFunction(()=>document.querySelector('#game').dataset.state==='playing');
  await p.locator('#game').focus();const before=await x(p);await p.keyboard.down('ArrowRight');await p.waitForTimeout(250);await p.keyboard.up('ArrowRight');
  assert.ok(await x(p)>before+8);await p.keyboard.press('Escape');
  const stopped=await x(p);await p.waitForTimeout(500);assert.equal(await x(p),stopped);
  await p.keyboard.press('Escape');
  for(let level=1;level<=15;level++){
    await p.goto(`${base}/?level=${level}`);
    await p.waitForFunction(level=>document.querySelector('#region-badge').textContent.includes('LEVEL '+String(level).padStart(2,'0')),level);
    await p.locator('#game').focus();const start=await x(p);await p.keyboard.down('ArrowRight');await p.waitForTimeout(150);await p.keyboard.up('ArrowRight');assert.ok(await x(p)>start,`stage ${level} input`);
  }
  await p.goto(base);await p.locator('#resume-solo').click();
  await p.waitForFunction(()=>document.querySelector('#region-badge').textContent.includes('LEVEL 15'));
  const other=await browser.newContext({viewport:{width:1280,height:900}}),guest=await pageIn(other);
  await p.goto(base);await guest.goto(base);await p.locator('#create-room').click();
  await p.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  await guest.locator('#room-code').fill(await p.locator('#game').getAttribute('data-room'));await guest.locator('#join-room').click();
  await p.waitForFunction(()=>JSON.parse(document.querySelector('#game').dataset.players).length===2);
  assert.equal(await p.locator('#start-story').isDisabled(),true);
  await guest.locator('#room-ready').click();await p.locator('#start-story').click();
  await Promise.all([p,guest].map(page=>page.waitForFunction(()=>document.querySelector('#game').dataset.state==='playing')));
  await guest.locator('#game').focus();const guestBefore=await x(guest);await guest.keyboard.down('ArrowRight');await guest.waitForTimeout(400);await guest.keyboard.up('ArrowRight');await p.waitForTimeout(200);
  assert.ok(await x(guest)>guestBefore+15);
  const positions=JSON.parse(await p.locator('#game').getAttribute('data-players'));
  const guestX=await x(guest);assert.ok(positions.some(v=>Math.abs(v.x-guestX)<2));
  await Promise.all([p.locator('#leave-room').click(),guest.locator('#leave-room').click()]);
  await p.setViewportSize({width:390,height:844});await p.goto(base);await p.locator('#start-story').click();await p.waitForTimeout(1600);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const art=await p.locator('#comic-panels').boundingBox(),caption=await p.locator('#story-caption').boundingBox(),next=await p.locator('#story-next').boundingBox();
  assert.ok(art.height>240&&caption.y>=art.y+art.height&&next.y>=caption.y+caption.height);
  const shot=await p.screenshot({path:`artifacts/${engine}-phone.jpg`,type:'jpeg',quality:80});
  console.log('COMPAT_BASE64_BEGIN'+shot.toString('base64')+'COMPAT_BASE64_END');
  const fixture=await pageIn(context);await fixture.goto(base+'/health');
  await fixture.setContent('<canvas id="profile" width="320" height="180" style="width:960px;image-rendering:pixelated"></canvas>');
  profile.draw=await fixture.evaluate(async()=>{
    const {buildLevel}=await import('/js/world.js'),{drawGame}=await import('/js/art.js'),{createPlayer}=await import('/js/physics.js');
    await new Promise(r=>setTimeout(r,500));const w=buildLevel(10,4),p=createPlayer('profile',w.coveredWay.x+200,129);p.onGround=true;
    const ctx=document.querySelector('canvas').getContext('2d');ctx.imageSmoothingEnabled=false;
    const times=[],frames=[];let last=performance.now();
    for(let i=0;i<180;i++){await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-last);last=now;const start=performance.now();drawGame(ctx,w,p,[],p.x-120,{clock:now,tick:0,state:'playing'});times.push(performance.now()-start);}
    times.sort((a,b)=>a-b);frames.sort((a,b)=>a-b);
    return {scope:'CI headless render fixture; not physical-device gameplay performance',swarm:w.coveredWay.drones,drawMedianMs:times[90],drawP95Ms:times[171],frameMedianMs:frames[90],frameP95Ms:frames[171]};
  });
  assert.deepEqual(errors,[]);await writeFile(`artifacts/${engine}-profile.json`,JSON.stringify(profile,null,2));
  console.log('Compatibility PASS:',JSON.stringify(profile),'story/reduced motion, all stage inputs, pause, saved stage, independent co-op readiness/movement, narrow comic layout, zero browser errors.');
}finally{await browser?.close();child.kill('SIGTERM');}
