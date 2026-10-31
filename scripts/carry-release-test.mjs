import assert from 'node:assert/strict';
import {startLevel,interactRun,stepRun} from '../public/js/simulation.js';
import {overlaps} from '../public/js/physics.js';
import {supply} from '../public/js/revision-world.js';
const setup=(level=10)=>{const r={players:new Map([['a',{id:'a',slot:0}],['b',{id:'b',slot:1}]])};startLevel(r,level,true);r.world.enemies=[];return r;};
let cases=0;
for(const face of [-1,1])for(const action of ['carry','drop'])for(const passenger of ['player','object']){
 for(let index=0;index<9;index++){
  const r=setup(),w=r.world,t=w.platforms.filter(s=>s.kind==='maze-tree')[index],a=r.players.get('a');
  a.x=face>0?t.x-a.w:t.x+t.w;a.y=w.floorY-a.h;a.face=face;
  const b=passenger==='player'?r.players.get('b'):supply(w,a.x,w.floorY,'stick');
  a.carryId=b.id;b.carriedBy=a.id;b.x=a.x;b.y=a.y-b.h-2;
  assert.ok(interactRun(r,a.id,action));assert.ok(!overlaps(b,t),'release cannot begin inside trunk');assert.equal(b.carriedBy,null);assert.equal(a.carryId,null);
  stepRun(r);assert.ok(!overlaps(b,t));assert.ok(face>0?b.x+b.w<=t.x+.01:b.x>=t.x+t.w-.01,'release remains on original side');cases++;
 }
}
console.log('CARRY RELEASE PASS:',cases,'left/right throw/drop cases across all tree pillars for teammates and props.');
{
 const r=setup(15),w=r.world,a=r.players.get('a'),p=r.players.get('b'),b=w.boss;
 b.phase='active';b.attack='exposed';b.attackTimer=100;b.head={x:b.x+240,y:w.floorY-42,w:64,h:42};
 a.x=b.head.x-a.w;a.y=w.floorY-a.h;a.face=1;a.carryId=p.id;p.carriedBy=a.id;p.x=a.x;p.y=a.y-p.h-2;
 interactRun(r,a.id,'carry');assert.ok(!overlaps(p,b.head));stepRun(r);assert.ok(!overlaps(p,b.head));assert.equal(b.hp,3,'side release cannot masquerade as a head stomp');
}
{
 const r=setup(1),w=r.world,a=r.players.get('a'),b=r.players.get('b');w.platforms=[];w.crates=[];
 a.x=70;a.y=w.floorY-a.h;a.face=1;a.carryId=b.id;b.carriedBy=a.id;
 interactRun(r,a.id,'carry');assert.equal(b.x,a.x+19);assert.equal(b.y,a.y-12);assert.ok(b.vx>0&&b.vy<0,'clear throws retain normal forward/upward launch');
}
console.log('CARRY RELEASE PASS: exposed boss head stays solid and unobstructed throws retain their arc.');

// Seeded chaotic movement/carry fixtures exercise corner entries and stacked players.
for(let seed=1;seed<=12;seed++){
 const r=setup(),w=r.world,trees=w.platforms.filter(s=>s.kind==='maze-tree');w.giant.wakeTicks=100000;
 let random=seed;const next=()=>{random=(Math.imul(random,1664525)+1013904223)>>>0;return random/2**32;};
 for(const [index,p] of [...r.players.values()].entries()){p.x=trees[0].x-45-index*18;p.y=w.floorY-p.h;}
 for(let t=0;t<600;t++){
  const previous=new Map([...r.players.values()].map(p=>[p.id,{x:p.x,y:p.y,w:p.w,h:p.h}]));
  for(const p of r.players.values()){
   if(t%12===0){const horizontal=next();p.input={left:horizontal<.3,right:horizontal>.35,jump:next()<.4,up:next()<.5,down:next()<.2};}
   if(t%24===0)interactRun(r,p.id,next()<.75?'carry':'drop');
  }
  stepRun(r);
  for(const p of r.players.values()){
   assert.ok([p.x,p.y,p.vx,p.vy].every(Number.isFinite));
   for(const tree of trees){
    assert.ok(!overlaps(p,tree),`seed ${seed} tick ${t}: survivor embedded in a tree`);
    const old=previous.get(p.id),vertical=old.y+old.h>tree.y&&old.y<tree.y+tree.h&&p.y+p.h>tree.y&&p.y<tree.y+tree.h;
    if(vertical)assert.ok(!(old.x+old.w<=tree.x&&p.x>=tree.x+tree.w)&&!(old.x>=tree.x+tree.w&&p.x+p.w<=tree.x),`seed ${seed} tick ${t}: teleported across trunk`);
   }
  }
 }
}
console.log('CARRY RELEASE STRESS PASS: 12 seeded movement/jump/ladder/carry/drop sequences without trunk overlap or through-wall teleport.');
