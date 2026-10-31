import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
import {driveRevision} from './revision-driver.mjs';
const base=process.env.BROWSER_BASE_URL||'http://127.0.0.1:4191';
const child=process.env.BROWSER_BASE_URL?null:spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4191'},stdio:'inherit'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;const errors=[];
try{
  await mkdir('artifacts/revision',{recursive:true});
  for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await sleep(100);}
  browser=await ({chromium,firefox,webkit}[process.env.TEST_BROWSER||'chromium']).launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?debug=1');
  await page.locator('#opening-intro.opening-ready').waitFor();
  assert.equal(await page.title(), 'AI Take Over');
  assert.equal(await page.locator('.menu-brand h2').textContent(), 'AI Take Over');
  assert.equal(await page.locator('.opening-art').evaluate(e=>getComputedStyle(e).objectFit),'contain','title artwork stays within frame');
  const opening=await page.locator('.screen-frame').screenshot({path:'artifacts/revision/concept-opening.jpg',type:'jpeg',quality:85});
  console.log('OPENING_BASE64_BEGIN'+opening.toString('base64')+'OPENING_BASE64_END');
  await page.waitForFunction(()=>document.querySelector('.opening-caption')?.textContent==='Now they hunt us.');
  await page.waitForFunction(()=>document.querySelector('.opening-caption')?.textContent==='Stay together. Keep the last spark alive.');
  await page.locator('#opening-intro').waitFor({state:'detached'});
  assert.equal(await page.locator('#game').getAttribute('data-state'),'title','opening finishes at menu, not in a running level');
  const introContext=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const introPage=await introContext.newPage();await introPage.goto(base);
  await introPage.locator('#opening-intro.opening-ready').waitFor();
  assert.equal(await introPage.locator('.opening-art').evaluate(e=>getComputedStyle(e).animationName),'none');
  await introPage.screenshot({path:'artifacts/revision/opening-mobile.png'});
  await introPage.keyboard.press('Enter');await introPage.locator('#opening-intro').waitFor({state:'detached'});
  assert.equal(await introPage.locator('#game').getAttribute('data-state'),'title','skip key cannot start story underneath');
  await introContext.close();
  const fallback=await context.newPage();await fallback.route('**/assets/key-art.jpg',route=>route.abort());await fallback.goto(base);
  await fallback.locator('#opening-intro').waitFor({state:'detached'});await fallback.locator('#menu-single').click();
  assert.ok(await fallback.locator('#start-story').isVisible(),'missing art cannot block game menu');await fallback.close();
  console.log('OPENING PASS: new illustration, caption sequence, automatic menu return, mobile reduced motion, keyboard skip and missing-art fallback.');
  await page.locator('#menu-single').waitFor({state:'visible'});
  assert.equal(await page.locator('#create-room').isVisible(),false,'room setup belongs inside Multiplayer');
  const title=await page.locator('.screen-frame').screenshot({path:'artifacts/revision/title-menu.jpg',type:'jpeg',quality:82});console.log('TITLE_BASE64_BEGIN'+title.toString('base64')+'TITLE_BASE64_END');
  await page.locator('#menu-settings').click();assert.ok(await page.locator('#sound-volume').isVisible());assert.ok(await page.locator('#motion-setting').isVisible());
  await page.locator('#menu-back').click();await page.locator('#menu-multi').click();assert.ok(await page.locator('#create-room').isVisible());assert.ok(await page.locator('#join-room').isVisible());
  await page.locator('#menu-back').click();await page.locator('#menu-single').click();await page.locator('#level-select').selectOption('1');await page.locator('#play-selected').click();await page.locator('#game').focus();
  await page.locator('#title-menu').waitFor({state:'hidden'});
  const snapshot=()=>page.evaluate(async()=> (await import('/js/game.js')).readDebugSnapshot());
  let manual=await snapshot();const ladder=manual.world.ladders[0];
  await page.keyboard.down('ArrowRight');
  for(let i=0;i<200;i++){manual=await snapshot();if(manual.you.x>=ladder.x-4)break;await sleep(30);}
  await page.keyboard.up('ArrowRight');await sleep(90);
  const floorY=(await snapshot()).you.y;await page.keyboard.down('KeyW');await page.waitForFunction(y=>Number(document.querySelector('#game').dataset.playerY)<y-25,floorY);await page.keyboard.up('KeyW');await sleep(80);
  const heldY=(await snapshot()).you.y;assert.ok(heldY<floorY-20,'W grabs facade ladder and climbs');
  await sleep(250);assert.ok(Math.abs((await snapshot()).you.y-heldY)<.1,'releasing W holds still');
  await page.keyboard.down('KeyS');await page.waitForFunction(y=>Number(document.querySelector('#game').dataset.playerY)>y+10,heldY);await page.keyboard.up('KeyS');assert.ok((await snapshot()).you.y>heldY+8,'S descends');
  const facade=await page.locator('.screen-frame').screenshot({path:'artifacts/revision/facade-ladder.jpg',type:'jpeg',quality:86});console.log('FACADE_BASE64_BEGIN'+facade.toString('base64')+'FACADE_BASE64_END');
  console.log('MENU / MANUAL LADDER PASS: title branches, reachable facade, W climb, release hold, S descend.');
  let s=await snapshot(),held={},memo={},lastUse=0;const deadline=Date.now()+90000;
  while(s?.phase==='playing'&&Date.now()<deadline){
    const cmd=driveRevision(s,s.you,memo);
    for(const [key,code]of Object.entries({left:'ArrowLeft',right:'ArrowRight',jump:'Space',up:'KeyW',down:'KeyS'}))if(!!held[key]!==!!cmd.input[key]){await page.keyboard[cmd.input[key]?'down':'up'](code);held[key]=!!cmd.input[key];}
    if(cmd.action&&Date.now()-lastUse>220){await page.keyboard.press(cmd.action==='carry'?'f':cmd.action==='drop'?'q':'e');lastUse=Date.now();}
    await sleep(25);s=await snapshot();
  }
  for(const code of ['ArrowLeft','ArrowRight','Space','KeyW','KeyS'])await page.keyboard.up(code);
  await page.screenshot({path:'artifacts/revision/level1.png'});
  assert.equal(s.phase,'victory',JSON.stringify({phase:s.phase,player:s.you,hearts:s.hearts}));
  console.log('REAL INPUT BROWSER PASS: flag, vertical roof, debris, patrol, relay bridge and Level 1 exit.');
  // Detached authored scene renders exercise all renderer branches without changing a live run.
  for(const level of [3,5,8,10,11,15]){
    const metadata=await page.evaluate(async level=>{
      const {buildLevel}=await import('/js/world.js'),{drawGame}=await import('/js/art.js'),{createPlayer}=await import('/js/physics.js');
      const w=buildLevel(level,1),b=w.boss;
      const x=b?b.x+(level===10?272:300):level===11?w.coveredWay.x+60:700,y=b&&level!==10?w.floorY-220:w.floorY-22;
      const p=createPlayer('render',x,y,0);p.slot=0;p.onGround=true;
      if(b){b.phase=level===15?'warning':'active';b.bodyX=b.x+425;b.bodyY=level===10?w.floorY-62:y;b.targetX=x+70;b.targetY=y;if(level===15){b.phaseIndex=2;b.lavaY=w.floorY-40;}}
      const canvas=document.createElement('canvas');canvas.id='revision-preview';canvas.width=960;canvas.height=540;canvas.style.cssText='position:fixed;inset:0;z-index:99999;width:960px;height:540px;background:black;image-rendering:pixelated';document.querySelector('#revision-preview')?.remove();document.body.append(canvas);
      const ctx=canvas.getContext('2d');ctx.scale(3,3);ctx.imageSmoothingEnabled=false;drawGame(ctx,w,p,[],Math.max(0,x-100),{cameraY:y-95,clock:1200,tick:300});return{level,platforms:w.platforms.length,enemies:w.enemies.length};
    },level);
    const shot=await page.locator('#revision-preview').screenshot({path:`artifacts/revision/scene-${level}.png`});
    console.log('RENDER PASS',JSON.stringify(metadata));
    if([3,5,10,11,15].includes(level))console.log(`SCENE_${level}_BASE64_BEGIN`+shot.toString('base64')+`SCENE_${level}_BASE64_END`);
  }
  for(const level of [5,10,15]){
    const frames=await page.evaluate(async level=>{
      const {buildLevel}=await import('/js/world.js'),{drawGame}=await import('/js/art.js'),{createPlayer}=await import('/js/physics.js');
      const w=buildLevel(level,1),b=w.boss,p=createPlayer('death-preview',w.finish.x,w.floorY-22);b.solved=true;b.phase='dying';b.hp=0;b.deathTick=1;
      const canvas=document.querySelector('#revision-preview'),ctx=canvas.getContext('2d');
      return [0,800,1600].map(clock=>{drawGame(ctx,w,p,[],w.width-320,{cameraY:w.floorY-150,clock,tick:1});return canvas.toDataURL();});
    },level);
    assert.equal(new Set(frames).size,3,'boss death animates even when simulation tick is frozen at victory');
    const shot=await page.locator('#revision-preview').screenshot({path:`artifacts/revision/boss-death-${level}.png`});
    if(level===15)console.log('DEATH_BASE64_BEGIN'+shot.toString('base64')+'DEATH_BASE64_END');
  }
  console.log('BOSS DEATH PASS: three distinct pixel death cards animate while victory simulation is frozen.');
  await page.evaluate(()=>document.querySelector('#revision-preview')?.remove());
  const art=await page.evaluate(async()=>{
    const {STORY_BEATS}=await import('/js/campaign.js');const scenes=Object.values(STORY_BEATS).flatMap(b=>b.panels.map(p=>p.visual));
    const loaded=await Promise.all(scenes.map(visual=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve({visual,width:im.naturalWidth,height:im.naturalHeight});im.onerror=()=>resolve({visual,error:true});im.src='/assets/story/revision/'+visual+'.jpg';})));
    return{scenes,loaded};
  });
  assert.equal(new Set(art.scenes).size,11);assert.ok(art.loaded.every(i=>i.width>1500&&i.height>500),JSON.stringify(art));
  for(const [level,zone] of [[1,'city'],[6,'forest'],[12,'factory']]){
    await page.goto(base+'/?debug=1');await page.locator('#menu-single').click();await page.locator('#level-select').selectOption(String(level));await page.locator('#play-selected').click();
    await page.waitForFunction(zone=>document.querySelector('#sound-toggle').dataset.audioZone===zone,zone);
    await page.locator('#open-settings').click();await page.waitForFunction(()=>document.querySelector('#game').dataset.state==='paused');
    if(process.env.TEST_BROWSER!=='firefox')await page.waitForFunction(()=>document.querySelector('#sound-toggle').dataset.audioState==='running');
    console.log('AUDIO STATE',zone,await page.locator('#sound-toggle').getAttribute('data-audio-state'));
    await page.locator('#sound-toggle').click();assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false');await page.locator('#sound-toggle').click();await page.locator('#menu-back').click();
    await page.waitForFunction(()=>document.querySelector('#game').dataset.state==='playing');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'game','returning from Settings restores keyboard control');
  }
  console.log('ZONE CONTROLS PASS: city/forest/factory selection, mute and settings pause/resume. AudioContext state logged separately; physical listening not claimed.');
  await page.goto(base+'/?debug=1');await page.locator('#menu-single').click();await page.locator('#start-story').click();await sleep(1800);
  const story=await page.locator('#story-panel').screenshot({path:'artifacts/revision/comic-desktop.jpg',type:'jpeg',quality:80});console.log('COMIC_BASE64_BEGIN'+story.toString('base64')+'COMIC_BASE64_END');
  const positions=await page.locator('.comic-original').evaluateAll(es=>es.map(e=>getComputedStyle(e).backgroundPosition));assert.equal(new Set(positions).size,3);
  await page.setViewportSize({width:430,height:932});await sleep(300);await page.screenshot({path:'artifacts/revision/comic-mobile.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no mobile horizontal overflow');
  console.log('COMIC PASS: 11 unique triptychs / 33 distinct illustrations; desktop and mobile layouts.');
  await page.goto(base+'/?debug=1');await page.locator('#menu-settings').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile settings fit width');
  await page.locator('#menu-back').click();await page.locator('#menu-multi').click();await page.locator('#create-room').click();
  await page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  const code=await page.locator('#game').getAttribute('data-room');
  const guest=await context.newPage();await guest.goto(base+'/?room='+code);await guest.locator('#join-room').click();
  await guest.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);await guest.locator('#room-ready').click();
  await page.locator('#start-story').click();await page.waitForFunction(()=>document.querySelector('#game').dataset.state==='playing');
  await page.locator('#open-settings').click();await sleep(100);assert.equal(await page.locator('#game').getAttribute('data-state'),'playing','online Settings must not pause the room');
  await page.locator('#menu-quit').click();await page.waitForFunction(()=>document.querySelector('#game').dataset.state==='title'&&!document.querySelector('#game').dataset.room);
  await guest.locator('#open-settings').click();await guest.locator('#menu-quit').click();await guest.close();
  const mobile=await page.locator('.screen-frame').screenshot({path:'artifacts/revision/title-mobile.jpg',type:'jpeg',quality:80});console.log('MOBILE_TITLE_BASE64_BEGIN'+mobile.toString('base64')+'MOBILE_TITLE_BASE64_END');
  console.log('MOBILE / ROOM MENU PASS: settings layout, invite opens Multiplayer, actual host/guest ready/start, online Settings keeps play running, both leave through Settings.');
  assert.deepEqual(errors,[]);await writeFile('artifacts/revision/result.json',JSON.stringify({browser:browser.version(),errors,level1:'victory'},null,2));
}finally{await browser?.close();child?.kill();}
