import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.BROWSER_BASE_URL||'http://127.0.0.1:4199';
const child=process.env.BROWSER_BASE_URL?null:spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4199'},stdio:'ignore'});
let browser;const errors=[];
try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await({chromium,firefox,webkit}[process.env.TEST_BROWSER||'chromium']).launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:760}});page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/health');
 const result=await page.evaluate(async()=>{
  const {buildLevel}=await import('/js/world.js'),{createPlayer}=await import('/js/physics.js'),{drawGame}=await import('/js/art.js');
  document.body.innerHTML='';document.body.style.cssText='margin:0;background:#081823;color:#f8d99c;font:16px monospace;display:grid;grid-template-columns:1fr 1fr;gap:8px';
  const checks=[];
  for(const [attack,weapon,timer] of [['rest','low',60],['strike','low',10],['head-warning','slam',45],['exposed','slam',200]]){
   const w=buildLevel(15,1),b=w.boss,p=createPlayer('art',b.x+280,w.floorY-22);b.phase='fight';b.attack=attack;b.weapon=weapon;b.attackTimer=timer;b.attackX=p.x+65;b.hp=3;b.head=attack.startsWith('head')||attack==='exposed'?{x:b.x+350,y:w.floorY-42,w:64,h:42}:null;
   const section=document.createElement('section'),label=document.createElement('div'),canvas=document.createElement('canvas');label.textContent=attack==='exposed'?'EXPOSED CORE — THROW / STOMP':attack.toUpperCase();canvas.width=640;canvas.height=360;canvas.style.cssText='width:100%;image-rendering:pixelated';section.append(label,canvas);document.body.append(section);
   const c=canvas.getContext('2d');c.scale(2,2);c.imageSmoothingEnabled=false;
   const draw=options=>drawGame(c,w,p,[],p.x-120,{cameraY:w.floorY-135,tick:120,clock:2000,...options});
   draw({});const first=canvas.toDataURL();draw({});checks.push({attack,repeatStable:first===canvas.toDataURL(),alpha:c.globalAlpha,transform:c.getTransform().a});
   for(const options of [{reducedMotion:true},{reducedEffects:true}]){draw(options);checks.at(-1).reducedReadable=canvas.toDataURL().length>1000;}
   draw({});
  }
  return checks;
 });
 for(const c of result){assert.ok(c.repeatStable,'render must not leak state: '+c.attack);assert.equal(c.alpha,1);assert.equal(c.transform,2);assert.ok(c.reducedReadable);}
 await mkdir('artifacts/boss-art',{recursive:true});const shot=await page.screenshot({path:'artifacts/boss-art/colossus.jpg',type:'jpeg',quality:90,fullPage:true});console.log('COLOSSUS_ART_BASE64_BEGIN'+shot.toString('base64')+'COLOSSUS_ART_BASE64_END');assert.deepEqual(errors,[]);console.log('BOSS ART PASS:',process.env.TEST_BROWSER||'chromium',JSON.stringify(result));
}finally{await browser?.close();child?.kill('SIGTERM');}
