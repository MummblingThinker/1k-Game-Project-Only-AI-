import assert from 'node:assert/strict';
import {startLevel,stepRun,interactRun} from '../public/js/simulation.js';
import {supply} from '../public/js/revision-world.js';
import {dischargePowerCell,POWER_CELL_RADIUS} from '../public/js/power-cells.js';
const setup=(level=12,party=1)=>{const r={players:new Map(Array.from({length:party},(_,slot)=>['p'+slot,{id:'p'+slot,slot}]))};startLevel(r,level,true);return r;};
const tick=(r,n=1)=>{for(let i=0;i<n;i++)stepRun(r);};
const robot=(id,x,y,size='small')=>({id,kind:'scanner',size,x,y,w:12,h:12,hp:size==='small'?1:3,phase:'recover',timer:999,stunned:0,dead:false,minX:x,maxX:x,speed:0,dir:1,groundY:y+12});

{
 const r=setup(),w=r.world,p=r.players.get('p0');w.crates=[];w.enemies=[];
 const cell=supply(w,p.x+8,w.floorY,'battery');tick(r);assert.ok(interactRun(r,p.id,'use'));assert.equal(p.carryId,cell.id);
 tick(r,12);assert.ok(interactRun(r,p.id,'drop'));tick(r,60);
 assert.equal(cell.used,false);assert.equal(cell.discharged,undefined);assert.ok(!w.breakEffects.some(e=>e.kind==='emp'),'placing a cell safely never discharges');
}
console.log('POWER CELL PASS: ordinary pickup/drop preserves a safe, reusable object.');
{
 const r=setup(),w=r.world,p=r.players.get('p0');w.crates=[];w.enemies=[];p.x=70;p.y=w.floorY-p.h;p.face=1;
 const cell=supply(w,p.x+8,w.floorY,'battery');tick(r);interactRun(r,p.id,'use');tick(r,12);
 const direct=robot('direct',p.x+58,w.floorY-28),near=robot('near',p.x+82,w.floorY-28,'medium'),far=robot('far',p.x+180,w.floorY-28,'medium');
 w.enemies=[direct,near,far];interactRun(r,p.id,'carry');
 for(let t=0;t<60&&!cell.used;t++)stepRun(r);
 assert.ok(cell.used&&cell.discharged);assert.ok(direct.dead,'direct small-robot hit still destroys it');
 assert.ok(near.stunned>0);assert.equal(near.hp,3,'burst only stuns adjacent robot');assert.equal(far.stunned,0);
 assert.equal(w.breakEffects.filter(e=>e.kind==='emp').length,1);assert.equal(r.hearts,r.heartMax);
 const remaining=near.stunned;tick(r,remaining+2);assert.equal(near.stunned,0,'stun expires rather than permanently disabling robot');
}
console.log('POWER CELL PASS: actual throw destroys direct target, stuns nearby robot once, spares distant target/player and expires.');
{
 const r=setup(15,4),w=r.world,b=w.boss;w.crates=[];const cell=supply(w,b.x+250,w.floorY,'battery');cell.used=true;
 const cx=cell.x+6,cy=cell.y+6;
 const small=robot('small',cx+POWER_CELL_RADIUS-6,cy-6),large=robot('large',cx-6,cy-6,'big'),outside=robot('outside',cx+POWER_CELL_RADIUS-5,cy-6);
 w.enemies=[small,large,outside];large.stunned=70;const before=JSON.stringify({boss:b,players:[...r.players.values()],hearts:r.hearts,giant:w.giant});
 assert.equal(dischargePowerCell(r,cell),2);assert.equal(small.stunned,120);assert.equal(large.stunned,70,'never shorten an existing stun');assert.equal(large.hp,3);assert.equal(outside.stunned,0);
 assert.equal(JSON.stringify({boss:b,players:[...r.players.values()],hearts:r.hearts,giant:w.giant}),before);
 assert.equal(dischargePowerCell(r,cell),0);assert.equal(w.breakEffects.filter(e=>e.kind==='emp').length,1);
 const ordinary=supply(w,cell.x,w.floorY,'gear');ordinary.used=true;assert.equal(dischargePowerCell(r,ordinary),0);
 const weight=supply(w,cell.x,w.floorY,'battery',true);weight.used=true;assert.equal(dischargePowerCell(r,weight),0,'puzzle weight cannot discharge');
}
console.log('POWER CELL PASS: exact radius, heavy armor, idempotence, other props, puzzle weights and unchanged co-op/boss/giant state.');
{
 const r=setup(15),w=r.world,b=w.boss,p=r.players.get('p0');w.switches.forEach(s=>s.active=true);w.enemies=[];w.crates=[];p.x=b.x+500;
 b.phase='active';b.attack='exposed';b.attackTimer=200;b.head={x:b.x+240,y:w.floorY-42,w:64,h:42};
 const cell=supply(w,b.head.x+10,b.head.y+20,'battery');Object.assign(cell,{flightTicks:60,vx:2,vy:0});
 tick(r);assert.equal(b.hp,2);assert.equal(b.attack,'retreat');assert.ok(cell.discharged);tick(r,20);assert.equal(b.hp,2,'burst never counts as another boss hit');
}
console.log('POWER CELL PASS: exposed head accepts only its ordinary single hit; burst cannot bypass the three-cycle boss.');
