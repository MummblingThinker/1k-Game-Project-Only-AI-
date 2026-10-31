import assert from 'node:assert/strict';
import {createGameAudio} from '../public/js/audio.js';

// Instrument the actual synthesizer boundary, not a duplicate cue implementation.
const sounds=[],listeners=new Map(),saved=new Map();let contexts=0;
const param=()=>({value:0,setTargetAtTime(){},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(v){this.end=v;}});
const node=()=>({connect(){},disconnect(){},start(){},stop(){},gain:param(),frequency:param(),Q:param()});
class AudioContext {
 constructor(){contexts++;this.state='running';this.currentTime=0;this.sampleRate=200;this.destination={};}
 createGain(){return node();} createBiquadFilter(){return node();} createBufferSource(){return node();}
 createBuffer(ch,n){return {getChannelData(){return new Float32Array(n);}};}
 createOscillator(){const o=node();o.start=()=>{if(o.onended)sounds.push({frequency:o.frequency.value,end:o.frequency.end,type:o.type});};o.stop=()=>o.onended?.();return o;}
 async resume(){this.state='running';} async suspend(){this.state='suspended';}
}
globalThis.window={AudioContext,addEventListener:(event,fn)=>listeners.set(event,fn)};
globalThis.document={hidden:false,addEventListener:(event,fn)=>listeners.set(event,fn)};
globalThis.localStorage={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
function element(){return {dataset:{},events:{},setAttribute(){},addEventListener(event,fn){this.events[event]=fn;}};}
const button=element(),slider=element(),audio=createGameAudio(button,slider);
const boss={kind:'foundry',phase:'active',x:100,hp:3,attack:'rest',weapon:'low',solved:false};
const world={id:15,region:'factory',boss,enemies:[],checkpoints:[],switches:[],breakEffects:[],giant:{x:-1000,wakeTicks:1}};
const player={x:250,vy:0,alive:true};
const observe=(state='playing')=>audio.observe({state,world,player,hearts:3});
observe();assert.equal(contexts,0,'no AudioContext before gesture');assert.equal(sounds.length,0);
await listeners.get('pointerdown')();observe();
function expectCue(change,frequencies){const before=sounds.length;change();observe();assert.deepEqual(sounds.slice(before).map(s=>s.frequency),frequencies);observe();assert.equal(sounds.length,before+frequencies.length,'unchanged warning does not replay');}
expectCue(()=>boss.attack='warning',[180,270]);
expectCue(()=>boss.attack='recover',[]);
expectCue(()=>{boss.weapon='high';boss.attack='warning';},[540,360]);
expectCue(()=>boss.attack='recover',[]);
expectCue(()=>{boss.weapon='slam';boss.attack='warning';},[840,840]);
expectCue(()=>boss.attack='head-warning',[110,880,880]);
expectCue(()=>boss.attack='exposed',[330,495,660]);
expectCue(()=>{boss.hp=2;boss.attack='retreat';},[140,660]);
expectCue(()=>{boss.hp=0;boss.solved=true;},[330,440,550,660]);
// A second encounter and the tree finale must not inherit a latched warning.
expectCue(()=>{boss.kind='climber';boss.solved=false;boss.hp=8;boss.attack='rest';},[]);
expectCue(()=>boss.attack='laser-warning',[620,620]);
expectCue(()=>boss.attack='claw-warning',[840,840]);
expectCue(()=>{boss.kind='chainsaw';boss.tree={phase:'upright'};},[]);
expectCue(()=>boss.tree.phase='warning',[110,880,880]);
expectCue(()=>world.breakEffects.push({kind:'emp',tick:1}),[900,500]);
// Disabled/zero-volume audio cannot create oscillators, including boss cues.
button.events.click();const muted=sounds.length;boss.tree.phase='falling';observe();boss.tree.phase='warning';observe();assert.equal(sounds.length,muted);
assert.equal(JSON.parse(saved.get('tiny-teamwork-audio')).enabled,false);
slider.value='0';slider.events.input();button.events.click();await Promise.resolve();const silent=sounds.length;
boss.tree.phase='falling';observe();boss.tree.phase='warning';observe();assert.equal(sounds.length,silent);
// Suspended/hidden pages resume without replaying a warning every frame.
document.hidden=true;listeners.get('visibilitychange')();assert.equal(button.dataset.audioState,'running');
document.hidden=false;listeners.get('visibilitychange')();await Promise.resolve();
assert.equal(button.dataset.audioState,'running');
console.log('BOSS AUDIO PASS: gesture gate, distinct arm/head/core cues, single playback, all three bosses, retry, mute/zero volume and visibility resume.');
