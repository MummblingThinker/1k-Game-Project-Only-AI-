import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.BROWSER_BASE_URL||'http://127.0.0.1:4197';
const child=process.env.BROWSER_BASE_URL?null:spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4197'},stdio:'ignore'});
let browser;const errors=[];
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await({chromium,firefox,webkit}[process.env.TEST_BROWSER||'chromium']).launch({headless:true});
 const page=await browser.newPage({viewport:{width:960,height:540}});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/health');
 const result=await page.evaluate(async()=>{
  const {startLevel,stepRun,interactRun}=await import('/js/simulation.js'),{supply}=await import('/js/revision-world.js'),{drawGame}=await import('/js/art.js');
  const run={players:new Map([['p0',{id:'p0',slot:0}]])};startLevel(run,12,true);const w=run.world,p=run.players.get('p0');w.crates=[];w.enemies=[];p.x=70;p.y=w.floorY-p.h;p.face=1;
  const cell=supply(w,p.x+8,w.floorY,'battery');stepRun(run);interactRun(run,p.id,'use');for(let i=0;i<12;i++)stepRun(run);
  const robot=(id,x,size)=>({id,kind:'scanner',size,x,y:w.floorY-28,w:12,h:12,hp:size==='small'?1:3,phase:'recover',timer:999,stunned:0,dead:false,minX:x,maxX:x,speed:0,dir:1,groundY:w.floorY-16});
  const direct=robot('direct',128,'small'),near=robot('near',152,'medium');w.enemies=[direct,near];interactRun(run,p.id,'carry');
  for(let t=0;t<60&&!cell.used;t++)stepRun(run);for(let t=0;t<8;t++)stepRun(run);
  supply(w,p.x-25,w.floorY,'battery');
  const canvas=document.createElement('canvas');canvas.id='cell-preview';canvas.width=960;canvas.height=540;document.body.replaceChildren(canvas);document.body.style.margin='0';
  const ctx=canvas.getContext('2d');ctx.scale(3,3);ctx.imageSmoothingEnabled=false;const nativeArc=ctx.arc.bind(ctx);let rings=0;
  ctx.arc=(x,y,r,...args)=>{const burst=w.breakEffects.find(e=>e.kind==='emp');if(burst&&x===burst.x&&y===burst.y&&r>=8)rings++;return nativeArc(x,y,r,...args);};
  window.__cellDraw=options=>{rings=0;drawGame(ctx,w,p,[],20,{cameraY:w.floorY-140,tick:run.tick,clock:1000,...options});return rings;};
  const ringCount=window.__cellDraw({});
  return {used:cell.used,discharged:cell.discharged,directDead:direct.dead,nearStunned:near.stunned,nearHp:near.hp,hearts:run.hearts,ringCount};
 });
 assert.ok(result.used&&result.discharged&&result.directDead&&result.nearStunned>0);assert.equal(result.nearHp,3);assert.equal(result.hearts,3);assert.ok(result.ringCount>0);
 await mkdir('artifacts/power-cell',{recursive:true});const shot=await page.locator('#cell-preview').screenshot({path:'artifacts/power-cell/default.jpg',type:'jpeg',quality:88});console.log('POWER_CELL_BASE64_BEGIN'+shot.toString('base64')+'POWER_CELL_BASE64_END');
 for(const options of [{reducedEffects:true},{reducedMotion:true}]){assert.ok(await page.evaluate(options=>window.__cellDraw(options),options)>0,'burst remains readable with visual reductions');await page.locator('#cell-preview').screenshot({path:'artifacts/power-cell/'+Object.keys(options)[0]+'.png'});}
 assert.deepEqual(errors,[]);console.log('POWER CELL BROWSER PASS:',process.env.TEST_BROWSER||'chromium',JSON.stringify(result),'normal/reduced-effects/reduced-motion renders.');
}finally{await browser?.close();child?.kill('SIGTERM');}
