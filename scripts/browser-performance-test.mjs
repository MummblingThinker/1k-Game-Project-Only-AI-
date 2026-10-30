// Renderer benchmark on the CI runner; not a physical-device performance claim.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base='http://127.0.0.1:4196',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4196'},stdio:'inherit'});
let browser;const errors=[];
try{
  for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await sleep(100);}
  browser=await chromium.launch({headless:true,args:['--enable-precise-memory-info','--js-flags=--expose-gc']});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/health');
  await page.setContent('<style>body{background:#101b2a;color:#eed9a4;font:18px system-ui}canvas{width:960px;height:540px;image-rendering:pixelated}</style><h1>Renderer stress fixture</h1><canvas width="320" height="180"></canvas>');
  await page.evaluate(async()=>{
    window.bench={...await import('/js/art.js'),...await import('/js/world.js'),...await import('/js/physics.js')};
  });
  await page.waitForFunction(()=>window.bench.imageLoaded());
  const results=await page.evaluate(async()=>{
    const {buildLevel,createPlayer,drawGame}=window.bench,canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
    ctx.imageSmoothingEnabled=false;
    const quantile=(a,q)=>[...a].sort((x,y)=>x-y)[Math.floor((a.length-1)*q)];
    const results=[];
    for(const level of [10,12,14,15])for(const reducedEffects of [false,true]){
      const world=buildLevel(level,4),focus=level===10?world.coveredWay.x+200:world.boss?world.boss.x+310:world.width*.6;
      const players=Array.from({length:4},(_,slot)=>({...createPlayer('bench'+slot,focus-60+slot*22,129),slot,onGround:true,vx:1.28}));
      const camera=focus-160,samples=[],cadence=[];let previous=0;
      for(let frame=0;frame<270;frame++){
        const now=await new Promise(requestAnimationFrame);
        if(previous&&frame>=30)cadence.push(now-previous);previous=now;
        if(world.boss){world.boss.phase=['warning','attack','stunned','recover'][Math.floor(frame/60)%4];world.boss.targetX=focus;}
        const start=performance.now();
        drawGame(ctx,world,players[0],players.slice(1),camera,{clock:frame*1000/60,tick:frame,state:'playing',reducedEffects});
        // Force the queued native-resolution canvas work to complete.
        ctx.getImageData(0,0,1,1);
        if(frame>=30)samples.push(performance.now()-start);
      }
      results.push({level,reducedEffects,frames:samples.length,renderMedianMs:quantile(samples,.5),renderP95Ms:quantile(samples,.95),rafMedianMs:quantile(cadence,.5),rafP95Ms:quantile(cadence,.95)});
    }
    window.gc?.();
    return {results,heapUsed:performance.memory?.usedJSHeapSize??null};
  });
  for(const r of results.results){
    assert.equal(r.frames,240);assert.ok(Number.isFinite(r.renderP95Ms));
    assert.ok(r.renderP95Ms<33.34,'native renderer exceeds 30fps CPU floor: '+JSON.stringify(r));
  }
  assert.deepEqual(errors,[]);
  await mkdir('artifacts/performance',{recursive:true});
  await writeFile('artifacts/performance/result.json',JSON.stringify({browser:browser.version(),scope:'headless CI native-canvas rendering, not physical hardware',...results},null,2));
  await page.screenshot({path:'artifacts/performance/final-scene.png'});
  console.log('Renderer benchmark PASS:',browser.version(),JSON.stringify(results));
}finally{await browser?.close();server.kill('SIGTERM');}
