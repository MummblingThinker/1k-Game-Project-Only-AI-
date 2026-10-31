import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,firefox,webkit} from 'playwright';
const base=process.env.BROWSER_BASE_URL||'http://127.0.0.1:4196';
const child=process.env.BROWSER_BASE_URL?null:spawn(process.execPath,['server/server.js'],{env:{...process.env,PORT:'4196'},stdio:'ignore'});
let browser;const errors=[];
try {
 for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await({chromium,firefox,webkit}[process.env.TEST_BROWSER||'chromium']).launch({headless:true});
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 // An isolated same-origin page exercises the real Web Audio implementation.
 await page.goto(base+'/health');
 await page.evaluate(async()=>{
  window.__tones=[];window.__contexts=[];
  const Native=window.AudioContext||window.webkitAudioContext;
  window.AudioContext=class extends Native {
   constructor(){super();window.__contexts.push(this);}
   createOscillator(){const o=super.createOscillator(),set=o.frequency.setValueAtTime.bind(o.frequency);o.frequency.setValueAtTime=(frequency,time)=>{window.__tones.push(frequency);return set(frequency,time);};return o;}
  };
  const {createGameAudio}=await import('/js/audio.js');
  const button=document.createElement('button'),slider=document.createElement('input');button.id='audio';slider.id='volume';slider.type='range';document.body.append(button,slider);
  const audio=createGameAudio(button,slider),boss={kind:'foundry',phase:'active',x:100,hp:3,attack:'rest',weapon:'low',solved:false};
  const world={id:15,region:'factory',boss,enemies:[],checkpoints:[],switches:[],breakEffects:[],giant:{x:-1000,wakeTicks:1}};
  const player={x:200,vy:0,alive:true};window.__fixture={audio,boss,world,player};
  window.__observe=()=>audio.observe({state:'playing',world,player,hearts:3});window.__observe();
 });
 assert.equal(await page.evaluate(()=>window.__contexts.length),0);
 // A gesture unlocks sound, without toggling its enabled setting.
 await page.locator('#volume').click();await page.keyboard.press('ArrowRight');
 console.log('Audio unlock diagnostic:',await page.evaluate(()=>({contexts:window.__contexts.map(c=>c.state),button:document.querySelector('#audio').dataset.audioState})));
 await page.waitForFunction(()=>window.__contexts[0]?.state==='running');
 const result=[];
 for(const [attack,weapon] of [['warning','low'],['recover'],['warning','high'],['recover'],['warning','slam'],['head-warning'],['exposed']]){
  await new Promise(r=>setTimeout(r,650));
  result.push(...await page.evaluate(({attack,weapon})=>{
   const {boss}=window.__fixture;window.__observe();
   boss.attack=attack;if(weapon)boss.weapon=weapon;window.__tones=[];window.__observe();
   const first={attack,tones:[...window.__tones]};window.__tones=[];window.__observe();
   return [first,{attack:'repeat',tones:[...window.__tones]}];
  },{attack,weapon}));
 }
 assert.deepEqual(result.filter(x=>x.attack==='warning').map(x=>x.tones),[[180,270],[540,360],[840,840]]);
 assert.deepEqual(result.find(x=>x.attack==='head-warning').tones,[110,880,880]);
 assert.deepEqual(result.find(x=>x.attack==='exposed').tones,[330,495,660]);
 assert.ok(result.filter(x=>x.attack==='repeat').every(x=>x.tones.length===0));
 await page.locator('#audio').click();
 assert.deepEqual(await page.evaluate(()=>{window.__fixture.boss.attack='head-warning';window.__tones=[];window.__observe();return window.__tones;}),[]);
 await page.locator('#volume').focus();await page.keyboard.press('Home');await page.locator('#audio').click();
 assert.deepEqual(await page.evaluate(()=>{window.__fixture.boss.attack='exposed';window.__tones=[];window.__observe();return window.__tones;}),[]);
 await page.evaluate(()=>Promise.all(window.__contexts.map(c=>c.close())));assert.deepEqual(errors,[]);
 console.log('REAL WEB AUDIO PASS:',process.env.TEST_BROWSER||'chromium','gesture gate, distinct boss cues, no repeated playback, mute and zero volume.');
} finally {await browser?.close();child?.kill('SIGTERM');}
