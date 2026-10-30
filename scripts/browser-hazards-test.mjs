import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {routeIntent} from './route-driver.mjs';
const base='http://127.0.0.1:4193',sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4193'},stdio:'inherit'});
let browser;const errors=[],results=[];
async function until(fn,label,timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){if(await fn())return;await sleep(25);}throw Error('Timed out: '+label);}
try{
  await until(async()=>{try{return(await fetch(base+'/health')).ok;}catch{return false;}},'server');
  await mkdir('artifacts/hazards',{recursive:true});browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const snapshot=()=>page.evaluate(()=>window.readQaState());
  for(const [kind,level,tell]of [['sentinel',4,'GROUND STRIKE'],['scanner',7,'SCANNER'],['creeper',12,'BLAST']]){
    await page.goto(base+`/?level=${level}&debug=1`);
    await page.evaluate(async()=>{window.readQaState=(await import('/js/game.js')).readDebugSnapshot;});
    await page.locator('#game').focus();const held={};
    async function input(value){for(const[key,code]of Object.entries({left:'ArrowLeft',right:'ArrowRight',jump:'Space'})){
      if(!!held[key]!==!!value[key]){held[key]=!!value[key];await page.keyboard[held[key]?'down':'up'](code);}
    }}
    await until(async()=>{
      const s=await snapshot(),e=s.world.enemies[0];assert.equal(e.kind,kind);assert.equal(s.hearts,3,'safe approach');
      if(e.phase==='warning'){await input({});return true;}
      const command=routeIntent(s);await input(command.input);
      if(command.interact&&Date.now()-(held.lastUse||0)>230){held.lastUse=Date.now();await page.keyboard.press('e');}
      return false;
    },kind+' actual approach',35000);
    const warning=await snapshot(),enemy=warning.world.enemies[0];
    assert.ok(enemy.timer>=(kind==='creeper'?110:80),'warning observed near its beginning');
    assert.equal(warning.hearts,3);
    await page.waitForFunction(text=>document.querySelector('#tactical-status').textContent.includes(text),tell,{timeout:1000});
    const shot=await page.locator('.screen-frame').screenshot({path:`artifacts/hazards/${kind}-warning.jpg`,type:'jpeg',quality:85});
    console.log(kind.toUpperCase()+'_BASE64_BEGIN'+shot.toString('base64')+kind.toUpperCase()+'_BASE64_END');
    // Bombers mark a radius around themselves. Step into it deliberately using
    // ordinary input, so this checks an actual blast instead of safe evasion.
    if(kind==='creeper'){
      await input({right:true});await until(async()=> (await snapshot()).you.x>=enemy.targetX-20,'enter blast radius',1500);await input({});
    }
    await until(async()=> (await snapshot()).world.enemies[0].phase==='attack',kind+' windup');
    const attack=await snapshot();assert.ok(attack.tick-warning.tick>=enemy.timer-2,'lethal phase follows full warning');
    await until(async()=> (await snapshot()).hearts===2,kind+' fatal attack',5000);
    await page.keyboard.press('Escape');await sleep(1100);
    const report=JSON.parse(await page.locator('#debug-report').inputValue()),deaths=report.events.filter(e=>e.type==='death');
    assert.equal(deaths.length,1);assert.match(deaths[0].cause,kind==='creeper'?/Blast radius/:/Telegraphed robot strike/);
    assert.equal((await snapshot()).hearts,2);assert.equal((await snapshot()).you.capture??null,null);
    results.push({kind,level,warningTicks:enemy.timer,ticksToAttack:attack.tick-warning.tick,deaths:deaths.length,hearts:2});
    console.log('Hazard browser PASS:',JSON.stringify(results.at(-1)));
  }
  assert.deepEqual(errors,[]);await writeFile('artifacts/hazards/result.json',JSON.stringify({browser:browser.version(),results,errors},null,2));
  console.log('Hazard browser suite PASS:',browser.version(),'actual input routes, visible warnings before lethal phases, one heart each.');
}finally{await browser?.close();server.kill('SIGTERM');}
