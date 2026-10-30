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
  await page.goto(base+'/?debug=1');await page.locator('#level-select').selectOption('1');await page.locator('#play-selected').click();await page.locator('#game').focus();
  const snapshot=()=>page.evaluate(async()=> (await import('/js/game.js')).readDebugSnapshot());
  let s=await snapshot(),held={},memo={},lastUse=0;const deadline=Date.now()+90000;
  while(s?.phase==='playing'&&Date.now()<deadline){
    const cmd=driveRevision(s,s.you,memo);
    for(const [key,code]of Object.entries({left:'ArrowLeft',right:'ArrowRight',jump:'Space'}))if(!!held[key]!==!!cmd.input[key]){await page.keyboard[cmd.input[key]?'down':'up'](code);held[key]=!!cmd.input[key];}
    if(cmd.action&&Date.now()-lastUse>220){await page.keyboard.press(cmd.action==='carry'?'f':cmd.action==='drop'?'q':'e');lastUse=Date.now();}
    await sleep(25);s=await snapshot();
  }
  for(const code of ['ArrowLeft','ArrowRight','Space'])await page.keyboard.up(code);
  await page.screenshot({path:'artifacts/revision/level1.png'});
  assert.equal(s.phase,'victory',JSON.stringify({phase:s.phase,player:s.you,hearts:s.hearts}));
  console.log('REAL INPUT BROWSER PASS: flag, vertical roof, debris, patrol, relay bridge and Level 1 exit.');
  // Detached authored scene renders exercise all renderer branches without changing a live run.
  for(const level of [3,5,8,10,11,15]){
    const metadata=await page.evaluate(async level=>{
      const {buildLevel}=await import('/js/world.js'),{drawGame}=await import('/js/art.js'),{createPlayer}=await import('/js/physics.js');
      const w=buildLevel(level,1),b=w.boss;
      const x=b?b.x+180:level===11?w.coveredWay.x+60:700,y=b&&level!==10?w.floorY-220:w.floorY-22;
      const p=createPlayer('render',x,y,0);p.slot=0;p.onGround=true;
      if(b){b.phase=level===15?'warning':'active';b.bodyX=b.x+425;b.bodyY=y;b.targetX=x+70;b.targetY=y;if(level===15){b.phaseIndex=2;b.lavaY=w.floorY-40;}}
      const canvas=document.createElement('canvas');canvas.id='revision-preview';canvas.width=960;canvas.height=540;canvas.style.cssText='position:fixed;inset:0;z-index:99999;width:960px;height:540px;background:black;image-rendering:pixelated';document.querySelector('#revision-preview')?.remove();document.body.append(canvas);
      const ctx=canvas.getContext('2d');ctx.scale(3,3);ctx.imageSmoothingEnabled=false;drawGame(ctx,w,p,[],Math.max(0,x-100),{cameraY:y-95,clock:1200,tick:300});return{level,platforms:w.platforms.length,enemies:w.enemies.length};
    },level);
    const shot=await page.locator('#revision-preview').screenshot({path:`artifacts/revision/scene-${level}.png`});
    console.log('RENDER PASS',JSON.stringify(metadata));
    if([5,11,15].includes(level))console.log(`SCENE_${level}_BASE64_BEGIN`+shot.toString('base64')+`SCENE_${level}_BASE64_END`);
  }
  await page.evaluate(()=>document.querySelector('#revision-preview')?.remove());
  assert.deepEqual(errors,[]);await writeFile('artifacts/revision/result.json',JSON.stringify({browser:browser.version(),errors,level1:'victory'},null,2));
}finally{await browser?.close();child?.kill();}
