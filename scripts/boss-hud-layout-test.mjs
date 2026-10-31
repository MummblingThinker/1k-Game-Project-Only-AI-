import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.BROWSER_BASE_URL||'http://127.0.0.1:4195';
const child=process.env.BROWSER_BASE_URL?null:spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4195'},stdio:'ignore'});
let browser;const errors=[];
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await({chromium,firefox,webkit}[process.env.TEST_BROWSER||'chromium']).launch({headless:true});
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/health');
 const markup=await page.evaluate(async()=>new DOMParser().parseFromString(await(await fetch('/')).text(),'text/html').querySelector('#boss-hud').outerHTML);
 await mkdir('artifacts/boss-layout',{recursive:true});
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.setContent(`<link rel="stylesheet" href="${base}/style.css"><style>body{margin:0;padding:0}.screen-frame{width:100%}</style><div class="screen-frame"><canvas id="game" width="320" height="180"></canvas>${markup}</div>`);
  await page.locator('link').evaluate(link=>link.sheet?Promise.resolve():new Promise(resolve=>link.onload=resolve));
  const boxes=await page.evaluate(async()=>{
   const {buildLevel}=await import('/js/world.js'),{createPlayer}=await import('/js/physics.js'),{drawGame}=await import('/js/art.js');
   const w=buildLevel(15,1),b=w.boss,p=createPlayer('fixture',b.x+210,w.floorY-22);p.slot=0;b.phase='active';b.attack='exposed';b.head={x:b.x+280,y:w.floorY-42,w:64,h:42};
   const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;drawGame(ctx,w,p,[],p.x-108,{cameraY:p.y-94,tick:0,clock:0});
   const hud=document.querySelector('#boss-hud');hud.hidden=false;document.querySelector('#boss-name').textContent='IRON COLOSSUS';document.querySelector('#boss-hp-text').textContent='2 / 3';document.querySelector('#boss-hp').max=3;document.querySelector('#boss-hp').value=2;
   const meter=document.querySelector('#boss-timing');meter.hidden=false;meter.value=.6;meter.dataset.mood='opening';document.querySelector('#boss-attack-hint').textContent='CORE OPEN - throw an object or stomp its head';
   const box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
   return {canvas:box(canvas),hud:box(hud),meter:box(meter),appearance:getComputedStyle(meter).appearance,scroll:document.documentElement.scrollWidth};
  });
  assert.ok(boxes.hud.x>=boxes.canvas.x-1&&boxes.hud.right<=boxes.canvas.right+1,'HUD fits game width');
  assert.ok(boxes.hud.y>=boxes.canvas.y+boxes.canvas.h*116/180-1,'HUD stays below the playable floor at width '+width);
  assert.ok(boxes.hud.bottom<=boxes.canvas.bottom+1);assert.ok(boxes.meter.h>=4);assert.equal(boxes.appearance,'none');assert.ok(boxes.scroll<=width+1);
  const shot=await page.locator('.screen-frame').screenshot({path:`artifacts/boss-layout/${width}.jpg`,type:'jpeg',quality:90});if(width===320)console.log('BOSS_MOBILE_BASE64_BEGIN'+shot.toString('base64')+'BOSS_MOBILE_BASE64_END');
  console.log('BOSS HUD LAYOUT PASS:',width,JSON.stringify(boxes));
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();child?.kill('SIGTERM');}
