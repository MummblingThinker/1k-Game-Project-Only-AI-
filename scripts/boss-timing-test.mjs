import assert from 'node:assert/strict';
import {bossTiming} from '../public/js/boss-timing.js';
import {startLevel,stepRun} from '../public/js/simulation.js';
for(const level of [5,15]){
 const r={players:new Map([['p',{id:'p',slot:0}]])};startLevel(r,level,true);
 const w=r.world,b=w.boss,p=r.players.get('p');w.switches.forEach(s=>s.active=true);w.enemies=[];
 p.x=b.x+250;p.y=w.floorY-p.h;p.invulnerability=10000;
 assert.equal(bossTiming(b),null,'waiting boss has no attack timer');
 for(let t=0;t<200&&!b.attack.includes('warning');t++)stepRun(r);
 const initial=bossTiming(b);assert.ok(initial);assert.equal(initial.value,0);assert.equal(initial.mood,'warning');
 stepRun(r);assert.ok(bossTiming(b).value>initial.value,'warning fills as the real attack approaches');
 if(level===5){const before=bossTiming(b).value;b.hp=4;assert.equal(bossTiming(b).value,before,'hitting half health cannot change an already announced attack duration');}
 while(b.attack.includes('warning'))stepRun(r);
 assert.equal(bossTiming(b).mood,'danger');assert.equal(bossTiming(b).value,1);
}
const head={phase:'active',kind:'foundry',attack:'exposed',attackTimer:480};
assert.equal(bossTiming(head).value,1);assert.match(bossTiming(head).label,/8 seconds/);
head.attackTimer=240;assert.equal(bossTiming(head).value,.5);assert.match(bossTiming(head).label,/4 seconds/);
head.attackTimer=1;assert.ok(bossTiming(head).value>0);assert.match(bossTiming(head).label,/1 second/);
head.attack='retreat';assert.equal(bossTiming(head),null);head.attack='exposed';head.solved=true;assert.equal(bossTiming(head),null);
console.log('BOSS TIMING PASS: authoritative warning progress, overdrive transition, active danger, eight-second opening and hidden recovery/death.');
