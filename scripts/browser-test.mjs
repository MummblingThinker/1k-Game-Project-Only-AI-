// CI-only browser dependency: npm install --no-save --package-lock=false playwright.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir,writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.BROWSER_BASE_URL || 'http://127.0.0.1:4188';
const child = process.env.BROWSER_BASE_URL ? null : spawn(process.execPath, ['server/server.js'], { env: { ...process.env, PORT: '4188' }, stdio: 'inherit' });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser;
const errors = [];
async function pageIn(context) {
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return page;
}
const state = page => page.locator('#game').getAttribute('data-state');
const x = async page => Number(await page.locator('#game').getAttribute('data-player-x'));
async function walk(page, target) {
  await page.locator('#game').focus();
  const direction = await x(page) < target ? 'ArrowRight' : 'ArrowLeft';
  await page.keyboard.down(direction);
  try {
    await page.waitForFunction(({ target, direction }) => {
      const c = document.querySelector('#game');
      return c.dataset.alive === 'false' || c.dataset.state === 'victory' || (direction === 'ArrowRight' ? Number(c.dataset.playerX) >= target : Number(c.dataset.playerX) <= target);
    }, { target, direction }, { timeout: 18000 });
  } catch(error) {
    console.log('BROWSER WALK FAILED',target,await page.locator('#game').getAttribute('data-players'));
    throw error;
  } finally { await page.keyboard.up(direction); }
  assert.equal(await page.locator('#game').getAttribute('data-alive'), 'true');
}
async function jump(page) {
  await page.keyboard.down('ArrowRight'); await page.keyboard.down('Space');
  await page.waitForTimeout(950);
  await page.keyboard.up('Space'); await page.keyboard.up('ArrowRight');
}
async function align(page,target,tolerance=3){
  await page.waitForTimeout(250);
  for(let attempt=0;attempt<16&&Math.abs(await x(page)-target)>tolerance;attempt++){
    await page.keyboard.press(await x(page)>target?'ArrowLeft':'ArrowRight',{delay:30});
    await page.waitForTimeout(220);
  }
  assert.ok(Math.abs(await x(page)-target)<=tolerance,`aligned input at ${target}; actual ${await x(page)}`);
}
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base + '/health')).ok) break; } catch {}
    await delay(100);
  }
  browser = await chromium.launch({ headless: true });
  console.log(`Browser: ${browser.version()}`);
  await mkdir('artifacts', { recursive: true });
  const soloContext = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  const solo = await pageIn(soloContext);
  await solo.goto(base); await solo.waitForFunction(() => document.querySelector('#game').dataset.state === 'title');
  await solo.locator('#sound-toggle').focus();
  await solo.keyboard.press('Space');
  assert.equal(await solo.locator('#sound-toggle').getAttribute('aria-pressed'), 'false');
  await solo.locator('#sound-volume').evaluate(el => { el.value = '17'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await solo.reload();
  assert.equal(await solo.locator('#sound-toggle').getAttribute('aria-pressed'), 'false', 'mute survives reload');
  assert.equal(await solo.locator('#sound-volume').inputValue(), '17', 'volume survives reload');
  await solo.locator('.visual-options summary').click();
  await solo.locator('#motion-setting').selectOption('reduced');await solo.locator('#effects-setting').selectOption('reduced');
  await solo.reload();
  assert.equal(await solo.locator('body').getAttribute('data-motion'),'reduced');
  assert.equal(await solo.locator('body').getAttribute('data-effects'),'reduced');
  await solo.locator('.visual-options summary').click();
  await solo.locator('#motion-setting').selectOption('system');await solo.locator('#effects-setting').selectOption('full');
  await solo.locator('.visual-options summary').click();
  await solo.locator('#sound-toggle').click();
  await solo.waitForFunction(() => document.querySelector('#sound-toggle').dataset.audioState === 'running');
  await solo.screenshot({ path: 'artifacts/title.png' });
  await solo.locator('#start-story').click();
  assert.equal(await state(solo), 'cutscene');
  await solo.waitForTimeout(1600);
  const story = await solo.screenshot({ path: 'artifacts/story.jpg', type: 'jpeg', quality: 78 });
  console.log('STORY_BASE64_BEGIN' + story.toString('base64') + 'STORY_BASE64_END');
  for (let i = 0; i < 3; i++) { await solo.locator('#game').focus(); await solo.keyboard.press('Space'); }
  await solo.waitForFunction(() => document.querySelector('#game').dataset.state === 'playing');
  await solo.keyboard.press('Escape'); assert.equal(await state(solo), 'paused');
  await solo.keyboard.press('Escape'); assert.equal(await state(solo), 'playing');
  await walk(solo,165);
  await solo.waitForTimeout(150);
  await solo.keyboard.press('Escape');
  const pausedX=await x(solo), pausedThreat=await solo.locator('#threat-status').textContent();
  await solo.keyboard.press('f');await solo.keyboard.down('ArrowRight');await solo.keyboard.down('Space');
  await solo.waitForTimeout(1200);
  assert.equal(await x(solo),pausedX,'pause freezes movement');
  assert.equal(await solo.locator('#threat-status').textContent(),pausedThreat,'pause freezes pursuit timer');
  assert.ok(!(JSON.parse(await solo.locator('#game').getAttribute('data-players'))[0].carryId),'paused F cannot pick up a crate');
  await solo.keyboard.press('Escape');await solo.waitForTimeout(300);
  await solo.keyboard.up('ArrowRight');await solo.keyboard.up('Space');
  assert.ok(Math.abs(await x(solo)-pausedX)<1,'resume clears held input');
  await solo.keyboard.press('f');
  await solo.waitForFunction(()=>!!JSON.parse(document.querySelector('#game').dataset.players)[0].carryId);
  await solo.keyboard.press('q');
  for (const level of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]) {
    await solo.goto(`${base}/?level=${level}`);
    await solo.waitForFunction(level => document.querySelector('#region-badge').textContent.includes(String(level).padStart(2, '0')), level);
    await solo.locator('#game').focus();
    const before = await x(solo); await solo.keyboard.down('ArrowRight'); await solo.waitForTimeout(250); await solo.keyboard.up('ArrowRight');
    assert.ok(await x(solo) > before, `level ${level} controls`);
    if ([5, 10, 15].includes(level)) await solo.screenshot({ path: `artifacts/level-${level}.png` });
  }
  await solo.goto(base);
  assert.ok((await solo.locator('#resume-solo').textContent()).includes('15'));
  await solo.locator('#resume-solo').click();
  await solo.waitForFunction(() => document.querySelector('#region-badge').textContent.includes('LEVEL 15') && document.querySelector('#game').dataset.state === 'playing');
  assert.ok(await x(solo) < 60, 'saved stage restarts from the entry');
  assert.ok((await solo.locator('#hud-hearts').textContent()).includes('3 / 3'));
  const aContext = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  // Render fixtures inspect authored art states; these are not gameplay-completion evidence.
  const fixture = await pageIn(soloContext);
  await fixture.setViewportSize({ width: 1280, height: 720 });
  await fixture.goto(base + '/health');
  await fixture.setContent('<style>body{margin:0;background:#101b2a;color:#eed9a4;display:grid;grid-template-columns:640px 640px;font:16px system-ui}figure{margin:0;padding:0}figcaption{padding:8px}canvas{display:block;width:640px;height:360px;image-rendering:pixelated}</style>');
  await fixture.evaluate(async () => {
    window.renderTools = { ...await import('/js/world.js'), ...await import('/js/physics.js'), ...await import('/js/art.js') };
  });
  await fixture.waitForTimeout(500);
  const sheet=await fixture.evaluate(()=>{
    const {getSurvivorSheet,SURVIVOR_POSES,survivorPose}=window.renderTools;
    const sheet=getSurvivorSheet(),ctx=sheet.getContext('2d'),pixels=ctx.getImageData(0,0,sheet.width,sheet.height).data;
    if(sheet!==getSurvivorSheet())throw Error('Sprite sheet must be cached');
    for(let y=0;y<sheet.height;y++)for(let x=0;x<sheet.width;x++){
      if((x%40===0||x%40===39||y%40===0||y%40===39)&&pixels[(y*sheet.width+x)*4+3])throw Error('Sprite frame spills outside tile');
    }
    for(const pose of ['run','carry-run','throw-run','throw','climb','idle']){
      const start=SURVIVOR_POSES.indexOf(pose)*160;
      const a=ctx.getImageData(start,0,40,40).data,b=ctx.getImageData(start+(pose==='idle'?80:40),0,40,40).data;
      if(a.every((v,i)=>v===b[i]))throw Error('Missing animated frame for '+pose);
    }
    if(survivorPose({alive:true,onGround:false,vy:-3,carryId:'box'})!=='carry-jump')throw Error('Airborne carry pose missing');
    if(survivorPose({alive:true,onGround:true,vx:1.28,carryId:'box'})!=='carry-run')throw Error('Running carry pose missing');
    return sheet.toDataURL('image/png').split(',')[1];
  });
  await writeFile('artifacts/survivor-sheet.png',Buffer.from(sheet,'base64'));
  console.log('SHEET_BASE64_BEGIN'+sheet+'SHEET_BASE64_END');
  const robotSheet=await fixture.evaluate(()=>{
    const {getRobotSheet,ROBOT_TILE,ROBOT_KINDS,ROBOT_POSES,robotPose}=window.renderTools;
    const sheet=getRobotSheet(),ctx=sheet.getContext('2d'),pixels=ctx.getImageData(0,0,sheet.width,sheet.height).data;
    if(sheet!==getRobotSheet())throw Error('Robot sheet must be cached');
    for(let y=0;y<sheet.height;y++)for(let x=0;x<sheet.width;x++)
      if((x%ROBOT_TILE===0||x%ROBOT_TILE===ROBOT_TILE-1||y%ROBOT_TILE===0||y%ROBOT_TILE===ROBOT_TILE-1)&&pixels[(y*sheet.width+x)*4+3])throw Error('Robot frame spills outside tile');
    for(let row=0;row<ROBOT_KINDS.length;row++){
      const tile=(pose,frame=0)=>ctx.getImageData((ROBOT_POSES.indexOf(pose)*4+frame)*ROBOT_TILE,row*ROBOT_TILE,ROBOT_TILE,ROBOT_TILE).data;
      const patrol=tile('patrol'),next=tile('patrol',1);
      if(patrol.every((v,i)=>v===next[i]))throw Error('Missing robot patrol frames '+ROBOT_KINDS[row]);
      for(const pose of ['warning','attack','stunned','recover']){
        const other=tile(pose);if(patrol.every((v,i)=>v===other[i]))throw Error('Missing robot tell '+ROBOT_KINDS[row]+'/'+pose);
      }
    }
    if(robotPose({phase:'attack',grabbedId:'p',stunned:1})!=='stunned'||robotPose({phase:'patrol',grabbedId:'p'})!=='grab')throw Error('Wrong robot pose priority');
    return sheet.toDataURL('image/png').split(',')[1];
  });
  await writeFile('artifacts/robot-sheet.png',Buffer.from(robotSheet,'base64'));
  console.log('ROBOT_BASE64_BEGIN'+robotSheet+'ROBOT_BASE64_END');
  await fixture.evaluate(() => {
    for (const level of [2, 3, 7, 9, 10, 11, 12, 13, 14, 15]) {
      const { buildLevel, createPlayer, drawGame } = window.renderTools;
      const world = buildLevel(level), figure = document.createElement('figure'), caption = document.createElement('figcaption'), canvas = document.createElement('canvas');
      caption.textContent = 'RENDER FIXTURE / ' + level + ' / ' + world.title;
      canvas.width = 320; canvas.height = 180; figure.append(caption, canvas); document.body.append(figure);
      let focus = world.platforms.find(p => p.kind === 'breakable')?.x || 450;
      if (level === 9) focus = world.memory.x;
      if (world.plates) focus = world.plates[0].x + 45;
      if (level === 10) focus = world.coveredWay.x + 200;
      if (level === 15) { focus = world.boss.x + 320; world.boss.phase = 'warning'; world.boss.targetX = focus + 40; }
      const player = createPlayer('fixture', focus - 50, 129);
      player.onGround = true;
      const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
      drawGame(ctx, world, player, [], Math.max(0, focus - 160), { clock: 1400, tick: 0, state: 'playing' });
    }
    const { drawSurvivor, buildLevel, createPlayer, drawGame } = window.renderTools;
    {
      const world=buildLevel(15),figure=document.createElement('figure'),label=document.createElement('figcaption'),canvas=document.createElement('canvas');
      figure.id='core-fixture';label.textContent='COLOSSUS FIXTURE / stunned core / 2 of 3 circuits';
      canvas.width=320;canvas.height=180;figure.append(label,canvas);document.body.append(figure);
      world.boss.phase='stunned';world.boss.cycle=2;world.boss.pylons.forEach(s=>s.active=true);
      const focus=world.boss.x+310,ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
      drawGame(ctx,world,createPlayer('core',focus-35,129),[],focus-160,{clock:1400,tick:0,state:'playing'});
    }
    for(const level of [6,11,12]){
      const world=buildLevel(level),terrain=world.terrain[0],figure=document.createElement('figure'),label=document.createElement('figcaption'),canvas=document.createElement('canvas');
      label.textContent='TERRAIN FIXTURE / '+terrain.kind+' / direction '+(terrain.direction||0);
      canvas.width=320;canvas.height=180;figure.append(label,canvas);document.body.append(figure);
      const player=createPlayer('terrain',terrain.x+40,129);player.onGround=true;player.slot=0;
      const peer=createPlayer('nearby',terrain.x+49,129);peer.onGround=true;peer.slot=1;
      const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
      drawGame(ctx,world,player,[peer],terrain.x-65,{clock:1400,tick:0,state:'playing'});
    }
    const poses = document.createElement('figure'), label = document.createElement('figcaption'), canvas = document.createElement('canvas');
    label.textContent = 'POSE FIXTURE / idle, run, jump, fall, carry, throw, captured, hurt, down'; canvas.width=320; canvas.height=180; poses.append(label,canvas); document.body.append(poses);
    const ctx=canvas.getContext('2d'); ctx.fillStyle='#203345'; ctx.fillRect(0,0,320,180);
    for(let slot=0;slot<4;slot++) for(let pose=0;pose<9;pose++) {
      const p=createPlayer('pose',0,12+slot*40); p.slot=slot; p.onGround=true;
      if(pose===1)p.vx=1.28;
      if(pose===2){p.onGround=false;p.vy=-3;}
      if(pose===3){p.onGround=false;p.vy=3;}
      if(pose===4)p.carryId='crate';
      if(pose===5)p.gestureTicks=12;
      if(pose===6)p.capture={remaining:2};
      if(pose===7){p.alive=false;p.hitTicks=12;}
      if(pose===8)p.alive=false;
      drawSurvivor(ctx,p,12+pose*34,1400);
    }
    const giantFigure=document.createElement('figure'), giantLabel=document.createElement('figcaption'), giantCanvas=document.createElement('canvas');
    giantLabel.textContent='RENDER FIXTURE / roaming giant footprint'; giantCanvas.width=320;giantCanvas.height=180;giantFigure.append(giantLabel,giantCanvas);document.body.append(giantFigure);
    const w=buildLevel(2);w.giant.x=80;
    const giantCtx=giantCanvas.getContext('2d');giantCtx.imageSmoothingEnabled=false;
    drawGame(giantCtx,w,createPlayer('fixture',180,129),[],0,{clock:1400,tick:0,state:'playing'});
  });
  const stages = await fixture.screenshot({ path: 'artifacts/stage-fixtures.jpg', type: 'jpeg', quality: 85, fullPage: true });
  console.log('STAGES_BASE64_BEGIN' + stages.toString('base64') + 'STAGES_BASE64_END');
  const coreFixture=await fixture.locator('#core-fixture').screenshot({path:'artifacts/core-fixture.jpg',type:'jpeg',quality:85});
  console.log('CORE_BASE64_BEGIN'+coreFixture.toString('base64')+'CORE_BASE64_END');
  await fixture.close();
  // Render the real comic UI in an isolated document without the game loop.
  const comics=await pageIn(aContext);
  await comics.emulateMedia({reducedMotion:'reduce'});
  const markup=(await(await fetch(base)).text()).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  await comics.route('**/comic-fixture',route=>route.fulfill({contentType:'text/html',body:markup}));
  await comics.goto(base+'/comic-fixture');
  await comics.evaluate(async()=>{
    const {createTextUI}=await import('/js/text-ui.js'),{STORY_BEATS,getLevel}=await import('/js/campaign.js');
    const update=createTextUI(),review=document.createElement('main');review.className='comic-review';
    for(const panel of [STORY_BEATS.opening.panels[2],...STORY_BEATS.after10.panels.filter(p=>p.visual!=='factoryDoor'),STORY_BEATS.after15.panels[1]]){
      update({state:'cutscene',level:getLevel(1),hearts:3,maxHearts:3,roomCode:'',isHost:false,capture:null,panel});
      const clone=document.querySelector('#story-panel').cloneNode(true);
      clone.removeAttribute('id');clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));review.append(clone);
    }
    const blackout=getComputedStyle(document.querySelector('#comic-panels')).animationDuration;
    if(blackout!=='8s')throw Error('Reduced motion must preserve eight-second ending timeline: '+blackout);
    if(getComputedStyle(document.querySelector('.comic-cell')).opacity!=='1')throw Error('Reduced motion shows panels without sliding');
    document.body.replaceChildren(review);
    const style=document.createElement('style');style.textContent='.comic-review{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;padding:12px}.comic-review .story-panel{position:relative;inset:auto;height:520px;min-width:0}.comic-review .comic-panels{animation:none!important}';document.head.append(style);
    await Promise.all(['/assets/story/story-atlas.png','/assets/story/story-details.png'].map(src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=src;})));
  });
  await comics.waitForTimeout(2200);
  assert.equal(await comics.locator('.comic-detail').count(),12,'four distinct detail scenes use the companion atlas');
  const comicReview=await comics.screenshot({path:'artifacts/comic-details.jpg',type:'jpeg',quality:82,fullPage:true});
  console.log('COMIC_BASE64_BEGIN'+comicReview.toString('base64')+'COMIC_BASE64_END');
  await comics.close();
  const bContext = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const a = await pageIn(aContext), b = await pageIn(bContext);
  await Promise.all([a.goto(base), b.goto(base)]);
  await a.locator('#create-room').click();
  await a.waitForFunction(() => document.querySelector('#game').dataset.room.length === 6);
  const code = await a.locator('#game').getAttribute('data-room');
  await aContext.grantPermissions(['clipboard-read','clipboard-write']);
  await a.locator('#copy-invite').click();
  await a.waitForFunction(()=>document.querySelector('#invite-feedback').textContent.includes('copied'));
  const invite=await a.evaluate(()=>navigator.clipboard.readText());
  assert.equal(new URL(invite).searchParams.get('room'),code);
  await b.goto(invite);assert.equal(await b.locator('#room-code').inputValue(),code);
  assert.equal(await b.locator('#game').getAttribute('data-room'),'','invitation does not silently join');
  await b.locator('#join-room').click();
  await a.waitForFunction(() => JSON.parse(document.querySelector('#game').dataset.players).length === 2);
  assert.equal(await a.locator('#start-story').isDisabled(),true,'host waits for guests');
  await b.locator('#room-ready').click();
  await a.waitForFunction(()=>!document.querySelector('#start-story').disabled);
  assert.ok((await a.locator('#room-roster').textContent()).includes('READY'));
  await a.locator('#start-story').click();
  await Promise.all([a, b].map(p => p.waitForFunction(() => document.querySelector('#game').dataset.state === 'playing')));
  await Promise.all([walk(a, 256), walk(b, 256)]);
  await Promise.all([jump(a), jump(b)]);
  await Promise.all([walk(a,400),walk(b,400)]);
  await Promise.all([jump(a),jump(b)]);
  // Party-scaled shelter moved its exit step; jump it before approaching the relay.
  await Promise.all([walk(a,509),walk(b,509)]);
  await Promise.all([jump(a),jump(b)]);
  await Promise.all([walk(a, 550), walk(b, 560)]);
  await align(a,536);
  await a.keyboard.press('e');
  try{
    await Promise.all([a, b].map(p => p.waitForFunction(() => document.querySelector('#game').dataset.switchActive === 'true',null,{timeout:5000})));
  }catch(error){
    console.log('RELAY FAILED',await a.locator('#game').getAttribute('data-players'),await a.locator('#objective-status').textContent());
    throw error;
  }
  const cover = await a.screenshot({ path: 'artifacts/cover.jpg', type: 'jpeg', quality: 78 });
  // Public game-only evidence can be recovered through the connector's text log API.
  // The original image remains in the normal downloadable workflow artifact.
  console.log('COVER_BASE64_BEGIN' + cover.toString('base64') + 'COVER_BASE64_END');
  await Promise.all([walk(a,580),walk(b,580)]);
  await Promise.all([jump(a),jump(b)]);
  await Promise.all([walk(a, 910), walk(b, 910)]);
  await Promise.all([a, b].map(p => p.waitForFunction(() => document.querySelector('#game').dataset.state === 'victory')));
  await a.locator('#continue-level').click();
  await Promise.all([a, b].map(p => p.waitForFunction(() => document.querySelector('#region-badge').textContent.includes('LEVEL 02') && document.querySelector('#game').dataset.state === 'playing')));
  await Promise.all([a.locator('#leave-room').click(), b.locator('#leave-room').click()]);
  const cContext=await browser.newContext(),dContext=await browser.newContext();
  const c=await pageIn(cContext),d=await pageIn(dContext);
  await Promise.all([c.goto(base),d.goto(base+'/?debug=1')]);
  await a.locator('#create-room').click();await a.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);
  const fourCode=await a.locator('#game').getAttribute('data-room');
  for(const page of [b,c,d]){await page.locator('#room-code').fill(fourCode);await page.locator('#join-room').click();await page.waitForFunction(()=>document.querySelector('#game').dataset.room.length===6);}
  await a.waitForFunction(()=>JSON.parse(document.querySelector('#game').dataset.players).length===4);
  await d.locator('#room-ready').click();await b.locator('#room-ready').click();
  assert.equal(await a.locator('#start-story').isDisabled(),true,'four-browser host waits for final guest');
  await c.locator('#room-ready').click();await a.locator('#start-story').click();
  await Promise.all([a,b,c,d].map(p=>p.waitForFunction(()=>document.querySelector('#game').dataset.state==='playing'&&JSON.parse(document.querySelector('#game').dataset.players).length===4)));
  await d.locator('#game').focus();await d.keyboard.down('ArrowRight');
  try{await d.waitForFunction(()=>document.querySelector('#game').dataset.alive==='false',null,{timeout:7000});}
  finally{await d.keyboard.up('ArrowRight');}
  await d.waitForFunction(()=>document.querySelector('#game').dataset.watching.length>0);
  await d.waitForFunction(()=>{try{return JSON.parse(document.querySelector('#debug-report').value).events.some(e=>e.type==='death');}catch{return false;}});
  assert.equal(await d.evaluate(async()=>{const {readDebugSnapshot}=await import('/js/game.js');const copy=readDebugSnapshot(),hearts=copy.hearts;copy.hearts=999;copy.world.width=1;return readDebugSnapshot().hearts===hearts&&readDebugSnapshot().world.width>1;}),true,'debug snapshots are detached copies');
  assert.equal(await d.locator('#debug-panel').isVisible(),true);
  const reportDownload=d.waitForEvent('download');await d.locator('#debug-download').click();
  const reportFile=await reportDownload;assert.equal(reportFile.suggestedFilename(),'tiny-teamwork-stage-1-report.json');
  await reportFile.saveAs('artifacts/browser-run-report.json');
  assert.equal(await d.locator('#spectator-status').isVisible(),true);
  const firstWatch=await d.locator('#game').getAttribute('data-watching');
  await d.locator('#watch-player').click();
  assert.notEqual(await d.locator('#game').getAttribute('data-watching'),firstWatch);
  await b.locator('#game').focus();await b.keyboard.down('ArrowRight');
  try{await b.waitForFunction(()=>Number(document.querySelector('#game').dataset.playerX)>170);}
  finally{await b.keyboard.up('ArrowRight');}
  await d.waitForFunction(()=>Number(document.querySelector('#game').dataset.cameraX)>25);
  await walk(b,256);await jump(b);await walk(b,400);await jump(b);
  await d.waitForFunction(()=>document.querySelector('#game').dataset.alive==='true');
  await d.waitForFunction(()=>{try{return JSON.parse(document.querySelector('#debug-report').value).events.some(e=>e.type==='checkpoint-revive');}catch{return false;}});
  assert.equal(await d.locator('#spectator-status').isVisible(),false,'revival returns camera to own survivor');
  await walk(d,518); // Clear the hatch so this test measures climbing, not a human stack.
  await walk(b,491);
  // A remote server may process release after the snapshot that reached the
  // target. Settle with short input pulses before testing the narrow hatch.
  await align(b,489);
  await b.waitForFunction(()=>Number(document.querySelector('#game').dataset.playerY)>=118);
  assert.ok(Number(await b.locator('#game').getAttribute('data-player-y'))>=118,'ladder ascent starts below its roof');
  const climberId=JSON.parse(await b.locator('#game').getAttribute('data-players'))[0].id;
  await d.evaluate(async()=>{window.readQaState=(await import('/js/game.js')).readDebugSnapshot;});
  await b.keyboard.press('e');
  try{
    await Promise.all([
      b.waitForFunction(()=>Number(document.querySelector('#game').dataset.playerY)===91),
      d.waitForFunction(id=>window.readQaState()?.players.find(p=>p.id===id)?.y===91,climberId)
    ]);
  }catch(error){
    console.log('LADDER FAILED',JSON.stringify(await d.evaluate(()=>window.readQaState())));
    throw error;
  }
  assert.equal(await b.locator('#game').getAttribute('data-alive'),'true','ladder reaches shelter roof alive');
  const ladderImage=await b.screenshot({path:'artifacts/ladder.jpg',type:'jpeg',quality:80});
  console.log('LADDER_BASE64_BEGIN'+ladderImage.toString('base64')+'LADDER_BASE64_END');
  await Promise.all([a,b,c,d].map(p=>p.locator('#leave-room').click()));
  await cContext.close();await dContext.close();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const phone = await pageIn(mobile); await phone.goto(base + '/?level=1');
  await phone.locator('[data-control=right]').tap();
  await phone.waitForTimeout(300);
  await phone.locator('[data-control=right]').dispatchEvent('pointercancel', { pointerId: 1 });
  const controls = await phone.locator('.mobile-controls').boundingBox();
  assert.ok(controls.y + controls.height <= 844 && controls.y > 650, 'touch controls stay at viewport bottom');
  const right = await phone.locator('[data-control=right]').boundingBox();
  const touch = await mobile.newCDPSession(phone), beforeTouch = await x(phone);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: right.x + right.width / 2, y: right.y + right.height / 2, id: 1 }] });
  await phone.waitForTimeout(350);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  assert.ok(await x(phone) > beforeTouch + 8, 'held touch moves survivor');
  await phone.waitForTimeout(200); const stopped = await x(phone);
  await phone.waitForTimeout(200); assert.ok(Math.abs(await x(phone) - stopped) < .2, 'touch cancellation stops movement');
  assert.ok(await phone.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'phone has no horizontal overflow');
  await phone.locator('#pause-game').tap(); assert.equal(await state(phone), 'paused');
  await phone.locator('#pause-game').tap(); assert.equal(await state(phone), 'playing');
  await phone.evaluate(() => scrollTo(0, 0));
  await phone.screenshot({ path: 'artifacts/mobile.png' });
  // A touchscreen laptop can send Escape while a touch is still held. Online
  // release must clear both input sources without pausing the shared clock.
  await phone.locator('#create-room').click();
  await phone.waitForFunction(()=>document.querySelector('#game').dataset.state==='lobby');
  await phone.locator('#start-story').click();
  await phone.waitForFunction(()=>document.querySelector('#game').dataset.state==='playing');
  await phone.locator('#game').focus();
  const onlineRight=await phone.locator('[data-control=right]').boundingBox(),onlineStart=await x(phone);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:onlineRight.x+onlineRight.width/2,y:onlineRight.y+onlineRight.height/2,id:2}]});
  await phone.waitForFunction(start=>Number(document.querySelector('#game').dataset.playerX)>start+8,onlineStart);
  await phone.keyboard.press('Escape');await phone.waitForTimeout(250);
  const releasedOnline=await x(phone);await phone.waitForTimeout(300);
  assert.ok(Math.abs(await x(phone)-releasedOnline)<.2,'online Escape clears held touch as well as keyboard');
  assert.equal(await state(phone),'playing','online Escape does not pause shared simulation');
  await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  await phone.locator('#leave-room').click();
  await phone.waitForFunction(()=>document.querySelector('#game').dataset.room==='');
  await phone.goto(base);
  await phone.locator('#start-story').tap();
  assert.ok(Math.abs((await phone.locator('.screen-frame').boundingBox()).y)<3,'starting from below the screen brings the phone game into view');
  await phone.evaluate(() => scrollTo(0, 0));
  await phone.locator('#story-next').tap();
  await phone.waitForFunction(() => document.querySelector('#story-heading').textContent === 'RUN!');
  assert.equal(await phone.locator('#story-heading').textContent(), 'RUN!');
  await phone.waitForTimeout(1600);
  const nextBounds=await phone.locator('#story-next').boundingBox(), captionBounds=await phone.locator('#story-caption').boundingBox(), artBounds=await phone.locator('#comic-panels').boundingBox();
  assert.ok(nextBounds.y >= captionBounds.y + captionBounds.height, 'phone navigation does not cover captions');
  assert.ok(captionBounds.y >= artBounds.y + artBounds.height && artBounds.height > 240, 'phone artwork has dedicated space');
  const mobileStory = await phone.screenshot({ path: 'artifacts/mobile-story.jpg', type: 'jpeg', quality: 80 });
  console.log('MOBILE_BASE64_BEGIN' + mobileStory.toString('base64') + 'MOBILE_BASE64_END');
  const accessibleContext=await browser.newContext({viewport:{width:390,height:844},forcedColors:'active',reducedMotion:'reduce'});
  const accessible=await pageIn(accessibleContext);await accessible.goto(base);
  assert.equal(await accessible.locator('body').getAttribute('data-motion'),'reduced','system reduced motion is respected');
  await accessible.locator('#sound-toggle').click();
  assert.equal(await accessible.locator('#sound-toggle').getAttribute('aria-pressed'),'false','sound can stay off during caption review');
  await accessible.locator('#start-story').focus();await accessible.keyboard.press('Enter');
  await accessible.waitForFunction(()=>document.querySelector('#game').dataset.state==='cutscene');
  await accessible.locator('#story-next').focus();await accessible.keyboard.press('Enter');
  await accessible.waitForFunction(()=>document.querySelector('#story-heading').textContent==='RUN!');
  const accessibility=await accessible.evaluate(()=>({
    forced:matchMedia('(forced-colors: active)').matches,
    animations:[...document.querySelectorAll('.comic-cell')].map(e=>getComputedStyle(e).animationName),
    captionSize:parseFloat(getComputedStyle(document.querySelector('#story-caption')).fontSize),
    overflow:document.documentElement.scrollWidth>innerWidth
  }));
  assert.equal(accessibility.forced,true);assert.ok(accessibility.animations.every(a=>a==='none'));
  assert.ok(accessibility.captionSize>=14);assert.equal(accessibility.overflow,false);
  await accessible.evaluate(()=>scrollTo(0,0));
  const accessibleImage=await accessible.screenshot({path:'artifacts/high-contrast-story.jpg',type:'jpeg',quality:80});
  console.log('ACCESS_BASE64_BEGIN'+accessibleImage.toString('base64')+'ACCESS_BASE64_END');
  await accessibleContext.close();
  assert.deepEqual(errors, [], `browser errors: ${JSON.stringify(errors)}`);
  console.log('Browser PASS: saved mute/volume and gesture-unlocked AudioContext; title/story/pause; all 15 stage loads and movement; two isolated browser contexts create/join/relay/bridge/victory and shared Level 2 transition; touch cancel; zero console/page errors.');
} finally {
  await browser?.close();
  if (child) child.kill('SIGTERM');
}
