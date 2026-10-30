import assert from 'node:assert/strict';
import { createPlayer, stepPlayer, updateCrates, overlaps } from '../public/js/physics.js';
import { startLevel, stepRun, interactRun, killPlayer, releaseParticipant, safeFromOrdinary } from '../public/js/simulation.js';
import { diagnosticReport,recordRunEvent } from '../public/js/telemetry.js';
import { readVisualOptions,saveVisualOptions } from '../public/js/visual-options.js';
const runAt = (level = 2, count = 2) => {
  const run = { players: new Map(Array.from({ length: count }, (_, slot) => [`p${slot}`, { ...createPlayer(`p${slot}`), slot }])) };
  startLevel(run, level, true); return run;
};
const check = (label, fn) => { fn(); console.log('Systems PASS: ' + label); };
check('all authored robot patrols remain on their floor and outside protected zones',()=>{
  let observed=0;
  for(let level=2;level<=15;level++){
    const r=runAt(level,2);r.world.giant.wakeTicks=100000;
    const identities=r.world.enemies.map(e=>e.id);
    for(let tick=0;tick<1200;tick++){
      stepRun(r);
      for(const e of r.world.enemies){
        assert.ok(e.x>=e.minX&&e.x<=e.maxX,`patrol bounds ${level}/${e.id}`);
        assert.ok(r.world.floors.some(f=>e.x>=f.x&&e.x+e.w<=f.x+f.w),`solid ground ${level}/${e.id}`);
        assert.ok(!r.world.checkpoints.some(c=>e.x+e.w>c.x&&e.x<c.x+c.w));
        if(r.world.boss)assert.ok(e.x+e.w<r.world.boss.x);
        if(r.world.coveredWay)assert.ok(e.x+e.w<r.world.coveredWay.x);
        assert.equal(e.phase,'patrol');assert.ok(!e.dead);assert.equal(e.stunned,0);
      }
    }
    assert.deepEqual(r.world.enemies.map(e=>e.id),identities);observed+=identities.length;
  }
  assert.ok(observed>30);
});
check('sentinel scanner and bomber complete their full warning before a lethal phase',()=>{
  for(const kind of ['sentinel','scanner','creeper']){
    const r=runAt(2,2),[a,b]=[...r.players.values()];
    Object.assign(a,{x:920,y:129,onGround:true});Object.assign(b,{x:1100,y:129,onGround:true});
    const e={id:'tell',kind,x:920,y:kind==='scanner'?75:123,w:20,h:28,minX:920,maxX:920,dir:1,speed:0,phase:'patrol',timer:0,stunned:0};
    r.world.enemies=[e];const hearts=r.hearts,duration=kind==='creeper'?120:90;
    stepRun(r);assert.equal(e.phase,'warning');assert.equal(e.timer,duration);
    for(let t=0;t<duration;t++){assert.equal(r.hearts,hearts);assert.equal(a.capture??null,null);stepRun(r);}
    assert.equal(e.phase,'attack');assert.ok(a.alive,'warning transition itself grants the final tick');
    stepRun(r);assert.equal(a.alive,false);assert.equal(r.hearts,hearts-1);
    for(let t=0;t<24;t++)stepRun(r);
    assert.equal(r.hearts,hearts-1);assert.equal(e.phase,'recover');assert.ok(!e.dead);
    assert.equal(b.alive,true);assert.equal(a.capture??null,null);
  }
});
check('later robots observe deaths earlier in the same tick',()=>{
  for(const overlap of [false,true]){
    const r=runAt(4,2),[a,b]=[...r.players.values()];
    Object.assign(a,{x:920,y:129,onGround:true});Object.assign(b,{x:overlap?1200:1330,y:129,onGround:true});
    r.world.enemies=[
      {id:'first',kind:'sentinel',x:920,y:123,w:20,h:28,minX:920,maxX:920,dir:1,speed:0,phase:'attack',timer:10,targetX:920,stunned:0},
      {id:'second',kind:'grabber',x:overlap?920:1330,y:123,w:20,h:28,minX:0,maxX:2000,dir:1,speed:0,phase:'patrol',timer:0,stunned:0}
    ];
    stepRun(r);assert.equal(a.alive,false);assert.equal(b.alive,true);assert.equal(r.hearts,3);
    assert.equal(a.capture,null,'a dead survivor cannot receive a new grab');
    assert.equal(b.capture??null,null,'last survivor gets a warning rather than a new unrescuable grab');
    assert.equal(r.world.enemies[1].grabbedId,undefined);
    assert.equal(r.world.enemies[1].phase,overlap?'patrol':'warning');
  }
});
check('shelter ladder reaches its roof, cancels safely and disappears on breach',()=>{
  for(const direction of [-1,1]){
    const r=runAt(1,1),p=r.players.get('p0'),cp=r.world.checkpoints[0];
    Object.assign(p,{x:cp.x+cp.w/2-p.w/2,y:129,onGround:true,input:{}});
    assert.equal(interactRun(r,p.id),true);assert.equal(p.climbing,cp.x);
    for(let i=0;i<34;i++)stepRun(r);
    const roof=r.world.platforms.find(s=>s.kind==='shelter-roof');
    assert.equal(p.climbing,null);assert.equal(p.y+p.h,roof.y);assert.equal(p.onGround,true);
    assert.equal(overlaps(p,roof),false);
    p.input={left:direction<0,right:direction>0};for(let i=0;i<60;i++)stepRun(r);
    assert.ok(p.alive);assert.ok(direction<0?p.x<cp.x:p.x>cp.x+cp.w,'roof has both usable exits');
  }
  const r=runAt(1,1),p=r.players.get('p0'),cp=r.world.checkpoints[0];
  Object.assign(p,{x:cp.x+cp.w/2-p.w/2,y:129,onGround:true,input:{}});
  interactRun(r,p.id);for(let i=0;i<15;i++)stepRun(r);
  p.input={right:true};stepRun(r);assert.equal(p.climbing,null);
  assert.ok(p.y>=118,'sideways cancellation cannot embed player in roof');
  for(let i=0;i<12;i++)stepRun(r);
  p.x=cp.x+cp.w/2-p.w/2;p.y=129;p.onGround=true;p.input={};
  assert.equal(interactRun(r,p.id),true);
  r.world.giant.x=cp.x+30;const hearts=r.hearts;stepRun(r);
  assert.equal(cp.destroyed,true);assert.equal(r.hearts,hearts-1);
  assert.equal(p.climbing,null);assert.ok(!r.world.platforms.some(s=>s.shelterX===cp.x));
});
check('ladder requires a grounded nearby empty-handed survivor and releases ownership',()=>{
  for(const invalid of ['distant','airborne','destroyed']){
    const r=runAt(1,2),p=r.players.get('p0'),cp=r.world.checkpoints[0];
    Object.assign(p,{x:cp.x+cp.w/2-p.w/2,y:129,onGround:true,input:{}});
    if(invalid==='distant')p.x=50;
    if(invalid==='airborne'){p.y=95;p.onGround=false;}
    if(invalid==='destroyed')cp.destroyed=true;
    assert.equal(interactRun(r,p.id),false,invalid);assert.equal(p.climbing,null);
  }
  const r=runAt(1,2),[p,q]=[...r.players.values()],cp=r.world.checkpoints[0];
  Object.assign(p,{x:cp.x+cp.w/2-p.w/2,y:129,onGround:true,input:{}});q.x=p.x+5;q.y=p.y;
  interactRun(r,p.id);assert.equal(interactRun(r,q.id,'carry'),false,'cannot carry someone through the hatch');
  releaseParticipant(r,p);assert.equal(p.climbing,null);
});
check('every authored shelter ladder reaches its intact roof',()=>{
  for(let level=1;level<=15;level++)for(let index=0;index<runAt(level,1).world.checkpoints.length;index++){
    const r=runAt(level,1),p=r.players.get('p0'),cp=r.world.checkpoints[index];
    Object.assign(p,{x:cp.x+cp.w/2-p.w/2,y:129,onGround:true,input:{}});
    assert.equal(interactRun(r,p.id),true,`ladder entry ${level}/${index}`);
    for(let tick=0;tick<35;tick++)stepRun(r);
    assert.equal(p.y,91,`ladder roof ${level}/${index}`);assert.ok(p.alive);
  }
});
check('a crate blocking the ladder hatch cannot embed a climbing survivor',()=>{
  const r=runAt(1,1),p=r.players.get('p0'),cp=r.world.checkpoints[0],crate=r.world.crates[0];
  Object.assign(p,{x:cp.x+cp.w/2-p.w/2,y:129,onGround:true,input:{}});
  Object.assign(crate,{x:p.x,y:113-crate.h,vx:0,vy:0});
  interactRun(r,p.id);for(let i=0;i<35;i++)stepRun(r);
  assert.equal(p.climbing,null);assert.ok(p.y>=118);assert.equal(overlaps(p,crate),false);
  assert.match(r.notice,/Ladder hatch blocked/);
  p.input={left:true};for(let i=0;i<55;i++)stepRun(r);
  assert.ok(p.x<cp.x&&p.alive,'ground exit remains usable when hatch is blocked');
});
check('ground and overhead enemy crowding leave a timed shelter escape',()=>{
  for(const crowd of ['ground','overhead'])for(const direction of [-1,1]){
    const r=runAt(2,2),[p,q]=[...r.players.values()],cp=r.world.checkpoints[0];
    Object.assign(p,{x:cp.x+cp.w/2-p.w/2,y:129,onGround:true,input:{}});
    Object.assign(q,{x:cp.x+4,y:129,onGround:true,input:{}});
    r.world.enemies=(crowd==='ground'?[cp.x-20,cp.x+cp.w]:[cp.x+cp.w/2]).map((x,i)=>({id:'crowd-'+i,kind:crowd==='ground'?'sentinel':'scanner',x,y:crowd==='ground'?123:75,w:20,h:28,minX:x,maxX:x,dir:1,speed:0,phase:'attack',timer:20,targetX:x,stunned:0}));
    const hearts=r.hearts;interactRun(r,p.id);for(let i=0;i<35;i++)stepRun(r);
    assert.equal(p.y,91);assert.ok(p.alive&&q.alive);
    p.input={left:direction<0,right:direction>0,jump:true};for(let i=0;i<60;i++)stepRun(r);
    assert.ok(p.alive&&q.alive,`${crowd} escape ${direction}`);assert.equal(r.hearts,hearts);
    assert.ok(direction<0?p.x<cp.x-35:p.x>cp.x+cp.w+35);
  }
});
check('capture expiry spends once and a real jump rescue releases without killing robot', () => {
  const r = runAt(), [a, b] = [...r.players.values()], e = r.world.enemies.find(e => e.kind === 'grabber');
  e.x = e.minX = e.maxX = 920;
  a.x = 920; b.x = 1000; stepRun(r);
  assert.ok(a.capture); assert.equal(e.grabbedId, a.id);
  b.x = e.x; b.y = e.y - b.h - 3; b.vy = 2;
  stepRun(r); assert.equal(a.capture, null); assert.equal(e.grabbedId, null); assert.ok(e.stunned > 0);
  assert.ok(a.alive); assert.ok(!e.dead);
  for (let i = 0; i < 160; i++) { a.x = 850; b.x = 1050; stepRun(r); }
  a.invulnerability = 0; a.x = e.x; a.y = 129; stepRun(r); assert.ok(a.capture);
  a.capture.remaining = .001; const hearts = r.hearts;
  stepRun(r); assert.equal(a.alive, false); assert.equal(r.hearts, hearts - 1);
  for (let i = 0; i < 20; i++) stepRun(r);
  assert.equal(r.hearts, hearts - 1);
});
check('ordinary jump contact does not stun; disconnect clears grab ownership', () => {
  const r = runAt(), [a, b] = [...r.players.values()], e = r.world.enemies.find(e => e.kind === 'grabber');
  b.x = e.x; b.y = e.y - b.h - 3; b.vy = 2; a.x = 600;
  stepRun(r); assert.equal(e.stunned, 0);
  e.grabbedId = a.id; a.capture = { remaining: 2, struggle: 0 };
  releaseParticipant(r, a); assert.equal(e.grabbedId, null); assert.equal(a.capture, null);
});
check('struggle extension is capped, not an infinite escape', () => {
  const r = runAt(), [a, b] = [...r.players.values()], e = r.world.enemies.find(e => e.kind === 'grabber');
  a.x = e.x; b.x = e.x + 100; stepRun(r); assert.ok(a.capture);
  const before = a.capture.remaining;
  for (let i = 0; i < 60; i++) { a.input = { left: i % 2 === 0, right: i % 2 === 1 }; stepRun(r); }
  assert.equal(a.capture.struggle, 4); assert.ok(a.capture.remaining < before);
});
check('safe shelter blocks ordinary attacks; giant still breaches and kills instantly', () => {
  const r = runAt(), [a, b] = [...r.players.values()], cp = r.world.checkpoints[0];
  a.x = cp.x + 6; b.x = cp.x + 20;
  assert.ok(safeFromOrdinary(r.world, a));
  r.world.enemies = [{ id: 'blast', kind: 'creeper', x: cp.x, y: 123, w: 20, h: 28, minX: cp.x, maxX: cp.x, dir: 1, speed: 0, phase: 'attack', timer: 10, targetX: cp.x, stunned: 0 }];
  stepRun(r); assert.ok(a.alive && b.alive);
  a.invulnerability = 90; r.world.giant.x = a.x - 35;
  stepRun(r); assert.ok(cp.destroyed); assert.equal(a.alive, false);
  assert.equal(r.world.platforms.some(p => p.shelterX === cp.x), false, 'breach removes roof and steps');
});
check('blast affects each player once, never a negative heart pool', () => {
  const r = runAt(2, 4), all = [...r.players.values()];
  for (const [i, p] of all.entries()) { p.x = 1000 + i * 6; p.y = 129; }
  r.world.enemies = [{ id: 'blast', kind: 'creeper', x: 1000, y: 123, w: 20, h: 28, minX: 1000, maxX: 1000, dir: 1, speed: 0, phase: 'attack', timer: 10, targetX: 1000, stunned: 0 }];
  stepRun(r); assert.equal(r.hearts, 1); assert.equal(r.deathEvents.length, 4);
  stepRun(r); assert.equal(r.hearts, 1);
  r.hearts = 1; const p = all[0]; p.invulnerability = 0; killPlayer(r, p, 'last heart');
  assert.equal(r.hearts, 0); assert.equal(r.phase, 'gameover');
  killPlayer(r, p, 'duplicate'); assert.equal(r.hearts, 0);
});
check('checkpoints provide exactly one benefit once; full-cap recovery cannot bank hearts', () => {
  const r = runAt(5, 4), [a, b, c] = [...r.players.values()];
  killPlayer(r, a, 'pit'); r.tick++; killPlayer(r, b, 'pit');
  const cp = r.world.checkpoints[0], before = r.hearts;
  c.x = cp.x - c.w - 1; c.input = { right: true }; stepRun(r);
  assert.ok(a.alive); assert.equal(b.alive, false); assert.equal(r.hearts, before);
  c.x = cp.x - c.w - 1; stepRun(r); assert.equal(b.alive, false); assert.equal(r.hearts, before);
  const r2 = runAt(2); const p = r2.players.get('p0'), cp2 = r2.world.checkpoints[0];
  p.x = cp2.x - p.w - 1; p.input = { right: true }; stepRun(r2); assert.equal(r2.hearts, r2.heartMax);
});
check('boss order, stun window, survival requirement and background core cycles gate exits', () => {
  const r = runAt(5, 1), p = r.players.get('p0'), boss = r.world.boss;
  p.x = boss.pylons[0].x; boss.phase = 'exposed'; boss.timer = 300;
  interactRun(r, p.id); assert.equal(boss.activeRelay, 0);
  r.tick += 12; p.x = boss.pylons[1].x; interactRun(r, p.id); assert.equal(boss.activeRelay, 1); assert.equal(boss.phase, 'stunned');
  const r10 = runAt(10, 1), b10 = r10.world.boss; r10.players.get('p0').x = b10.x + 20;
  r10.world.switches.forEach(s => { s.active = true; });
  b10.pylons.forEach(s => { s.active = true; }); b10.activeRelay = 3;
  stepRun(r10); assert.equal(b10.solved, false); b10.elapsed = 2700; stepRun(r10); assert.ok(b10.solved);
  const r15 = runAt(15, 1), b15 = r15.world.boss, p15 = r15.players.get('p0');
  p15.x = b15.x + 310; b15.phase = 'stunned'; b15.timer = 400; b15.pylons.forEach(s => { s.active = true; });
  interactRun(r15, p15.id); assert.equal(b15.cycle, 1); assert.equal(b15.solved, false);
});
check('drop/carry cannot use relays, and boss waits for the living party', () => {
  const r = runAt(15), [a, b] = [...r.players.values()], boss = r.world.boss;
  r.world.switches.forEach(s => { s.active = true; });
  a.x = boss.pylons[0].x;
  assert.equal(interactRun(r, a.id), false);
  assert.equal(boss.activeRelay, 0); assert.equal(boss.phase, 'waiting');
  r.tick += 12; assert.equal(interactRun(r, a.id, 'drop'), false);
  assert.equal(boss.activeRelay, 0);
  b.x = boss.x + 20; stepRun(r); assert.notEqual(boss.phase, 'waiting');
  r.tick += 12; interactRun(r, a.id, 'carry'); assert.equal(boss.activeRelay, 0);
  r.tick += 12; assert.equal(interactRun(r, a.id), true); assert.equal(boss.activeRelay, 1);
  const r2 = runAt(1), p = r2.players.get('p0'), crate = r2.world.crates[0];
  p.x = crate.x; assert.equal(interactRun(r2, p.id, 'drop'), false);
  assert.equal(p.carryId, null); assert.equal(crate.carriedBy, null);
});
check('jump struggle is edge-triggered and shares the four-extension cap', () => {
  const r = runAt(), [a, b] = [...r.players.values()], e = r.world.enemies.find(e => e.kind === 'grabber');
  a.x = e.x; b.x = e.x + 100; stepRun(r); assert.ok(a.capture);
  a.input = { jump: true };
  for (let i = 0; i < 10; i++) stepRun(r);
  assert.equal(a.capture.struggle, 1);
  for (let i = 0; i < 12; i++) { a.input = { jump: i % 2 === 1 }; stepRun(r); }
  assert.equal(a.capture.struggle, 4);
});
check('every shelter including the tutorial has usable ground exits and a reachable roof', () => {
  for (let level = 1; level <= 15; level++) {
    const reference = runAt(level, 1);
    for (let index = 0; index < reference.world.checkpoints.length; index++) {
      for (const direction of [-1, 1]) {
        const r = runAt(level, 1), p = r.players.get('p0'), cp = r.world.checkpoints[index];
        r.world.enemies = []; r.world.giant.speed = 0;
        p.x = cp.x + 20; p.y = 129;
        let escaped = false;
        for (let i = 0; i < 140; i++) {
          p.input = { left: direction < 0, right: direction > 0, jump: p.onGround && !p.lastJump };
          stepRun(r);
          if (direction > 0 ? p.x > cp.x + cp.w + 32 : p.x < cp.x - 32) { escaped = true; break; }
        }
        assert.ok(escaped, 'shelter exit ' + level + '/' + index + '/' + direction);
      }
      const r = runAt(level, 1), p = r.players.get('p0'), cp = r.world.checkpoints[index];
      r.world.enemies = []; r.world.giant.speed = 0;
      p.x = cp.x - 50; p.y = 129;
      let landed = false, onStep = false, aboveRoof = false;
      for (let i = 0; i < 240; i++) {
        if (p.onGround && p.y + p.h === 132) onStep = true;
        if (onStep && p.y + p.h <= 113) aboveRoof = true;
        const target = aboveRoof ? cp.x + 16 : cp.x - 28;
        p.input = { right: p.x < target - 1, left: p.x > target + 2, jump: p.onGround && !p.lastJump };
        stepRun(r);
        if (p.onGround && p.y + p.h === 113 && p.x >= cp.x && p.x < cp.x + cp.w) { landed = true; break; }
      }
      assert.ok(landed, 'reachable shelter roof ' + level + '/' + index);
    }
  }
});
check('conveyor drift respects walls and upward ceiling collisions use the head crossing', () => {
  const w = { width: 300, floors: [{ x: 0, y: 151, w: 300, h: 30 }], platforms: [{ x: 100, y: 120, w: 20, h: 31 }], crates: [], groundDrift: .45 };
  const p = createPlayer('p', 88, 129); p.onGround = true;
  for (let i = 0; i < 120; i++) stepPlayer(p, {}, w);
  assert.equal(p.x, 88); assert.equal(p.y, 129);
  w.platforms = [{ x: 80, y: 100, w: 50, h: 6 }]; w.groundDrift = 0;
  p.x = 90; p.y = 108; p.vy = -5;
  stepPlayer(p, {}, w); assert.equal(p.y, 106); assert.equal(p.vy, 0);
  p.y = 90; p.vy = -5;
  stepPlayer(p, {}, w); assert.ok(p.y < 90, 'existing overlap must not eject player downward through floor');
});
check('missing route relays cannot trap the party inside an active arena', () => {
  const r = runAt(15), boss = r.world.boss;
  for (const p of r.players.values()) p.x = boss.x + 4;
  stepRun(r); assert.equal(boss.phase, 'waiting');
  const a = r.players.get('p0'); a.input = { left: true };
  for (let i = 0; i < 10; i++) stepRun(r);
  assert.ok(a.x < boss.x, 'party can return to missed relays');
});
check('a surviving heart retries the encounter explicitly without teleporting from a shelter', () => {
  const r = runAt(10, 1), p = r.players.get('p0'), b = r.world.boss;
  r.world.switches.forEach(s => { s.active = true; }); p.x = b.x + 20; stepRun(r);
  b.elapsed = 2500; b.pylons[0].active = true; b.activeRelay = 1;
  killPlayer(r, p, 'Arena strike'); const hearts = r.hearts; stepRun(r);
  assert.ok(p.alive); assert.equal(r.hearts, hearts); assert.ok(p.x >= b.x && p.x < b.x + 100);
  assert.equal(b.phase, 'recover'); assert.equal(b.elapsed, 0); assert.equal(b.activeRelay, 0);
  assert.ok(b.pylons.every(s => !s.active)); assert.equal(b.timer, 120);
});
check('cracked salvage breaks once from a stomp or thrown crate, never from resting contact', () => {
  const r = runAt(3, 1), p = r.players.get('p0'), block = r.world.platforms.find(s => s.kind === 'breakable');
  assert.ok(block); const ids = r.world.enemies.map(e => e.id), hearts = r.hearts;
  p.x = block.x + 3; p.y = block.y - p.h - 2; p.vy = 3;
  stepRun(r);
  assert.ok(!r.world.platforms.includes(block)); assert.ok(p.vy < 0);
  assert.equal(r.world.breakEffects.length, 1); assert.equal(r.hearts, hearts);
  assert.deepEqual(r.world.enemies.map(e => e.id), ids);
  stepRun(r); assert.equal(r.world.breakEffects.length, 1);
  const other = runAt(3, 1), b = other.world.platforms.find(s => s.kind === 'breakable'), crate = other.world.crates[0];
  crate.x = b.x - 15; crate.y = 137; crate.vx = 0; crate.vy = 0;
  for (let i = 0; i < 20; i++) stepRun(other);
  assert.ok(other.world.platforms.includes(b), 'resting crate cannot break salvage');
  crate.x = b.x - 15; crate.y = 137; crate.vx = 2.6; stepRun(other);
  assert.ok(!other.world.platforms.includes(b)); assert.equal(other.world.breakEffects.length, 1);
});
check('short coyote and landing buffer help timing without granting repeated air jumps', () => {
  const w = { width: 300, floors: [{x:0,y:151,w:80,h:30},{x:180,y:151,w:120,h:30}], platforms:[], crates:[] };
  const p = createPlayer('p',80,129); p.onGround=true;
  stepPlayer(p,{right:true},w); assert.equal(p.onGround,false);
  stepPlayer(p,{right:true,jump:true},w); assert.ok(p.vy < -4);
  const rising = p.vy; stepPlayer(p,{jump:false},w); stepPlayer(p,{jump:true},w);
  assert.ok(p.vy > rising, 'cannot reset upward velocity in mid-air');
  const late = createPlayer('late',100,129); late.onGround=true;
  for(let i=0;i<8;i++)stepPlayer(late,{},w);
  stepPlayer(late,{jump:true},w); assert.ok(late.vy>0,'grace expires');
  const landing=createPlayer('landing',200,120);landing.vy=2;
  stepPlayer(landing,{jump:true},w);
  for(let i=0;i<4;i++)stepPlayer(landing,{jump:false},w);
  assert.ok(landing.vy<0,'press just before landing is buffered once');
});
check('stage-entry warning lasts eight seconds and does not grant contact immunity', () => {
  const r = runAt(2, 1), x = r.world.giant.x;
  for(let i=0;i<480;i++)stepRun(r);
  assert.equal(r.world.giant.x,x); assert.equal(r.world.giant.wakeTicks,0);
  stepRun(r); assert.equal(r.world.giant.x,x+r.world.giant.speed);
  const other=runAt(2,2), p=other.players.get('p0');
  other.world.giant.x=p.x-30; stepRun(other); assert.equal(p.alive,false,'a parked giant still has contact collision');
});
check('pressure bridges accept grounded survivors and crates, expire visibly, and preserve fallback geometry', () => {
  const r=runAt(6,2), p=r.players.get('p0'), plate=r.world.plates[0];
  const initial=r.world.platforms.slice();
  p.x=plate.x+4; p.y=plate.y-p.h; p.vy=0;
  stepRun(r); assert.equal(plate.held,true); assert.equal(plate.remaining,480);
  assert.equal(r.world.platforms.filter(s=>s.plateId===plate.id).length,1);
  for(let i=0;i<30;i++)stepRun(r);
  assert.equal(plate.remaining,480,'weight keeps timer full');
  p.x=plate.bridgeX+2; p.y=plate.y-p.h; p.onGround=true;
  stepRun(r); assert.equal(plate.held,false); assert.equal(plate.remaining,479); assert.equal(p.onGround,true,'bridge carries weight');
  p.x=plate.x-80;
  for(let i=0;i<479;i++)stepRun(r);
  assert.equal(plate.remaining,0); assert.ok(!r.world.platforms.some(s=>s.plateId===plate.id));
  for(const platform of initial)assert.ok(r.world.platforms.includes(platform),'fallback platforms remain');
  const crate=r.world.crates.find(c=>c.id==='plate-crate-0');
  crate.x=plate.x+4; crate.y=plate.y-crate.h; crate.vx=crate.vy=0;
  stepRun(r); assert.equal(plate.held,true);
  crate.carriedBy=p.id; p.carryId=crate.id;
  stepRun(r); assert.equal(plate.held,false,'carried props do not weigh down a plate');
  assert.equal(runAt(6,2).world.plates[0].remaining,0,'a fresh room has independent plate state');
});
check('the exit accepts a living human stack and jumps without waiting for the pursuer to remove upper survivors', () => {
  const r=runAt(6,4);
  r.world.switches.forEach(s=>{s.active=true;});
  for(const p of r.players.values()) { p.x=r.world.finish.x+4; p.y=129-p.slot*22; p.onGround=true; }
  const hearts=r.hearts; stepRun(r);
  assert.equal(r.phase,'victory'); assert.equal(r.hearts,hearts);
  assert.ok([...r.players.values()].every(p=>p.alive));
});
check('loose crates can be pushed but cannot pass through a solid wall', () => {
  const crate={id:'crate',x:100,y:137,w:14,h:14,vx:0,vy:0,used:false,carriedBy:null};
  const wall={x:180,y:90,w:20,h:61};
  const w={width:300,height:180,floorY:151,floors:[{x:0,y:151,w:300,h:30}],platforms:[wall],crates:[crate]};
  const p=createPlayer('p',75,129);p.onGround=true;
  for(let i=0;i<140;i++){stepPlayer(p,{right:true},w);updateCrates(w);assert.ok(p.x+p.w<=crate.x+.001,'no side clipping');}
  assert.ok(crate.x>150,'walking pushes the crate');assert.ok(crate.x+crate.w<=wall.x);assert.ok(!overlaps(crate,wall));
  crate.x=130;crate.vx=4;crate.vy=0;
  for(let i=0;i<30;i++)updateCrates(w);
  assert.ok(crate.x+crate.w<=wall.x,'thrown crate stops at wall');
  const top=createPlayer('top',crate.x,crate.y-22);top.onGround=true;
  for(let i=0;i<10;i++)stepPlayer(top,{},w);
  assert.equal(top.y+top.h,crate.y,'crate still supports a survivor');
  const upper={...crate,id:'upper',x:crate.x,y:80,vx:0,vy:0};w.crates.push(upper);
  for(let i=0;i<80;i++)updateCrates(w);
  assert.equal(upper.y+upper.h,crate.y,'loose crates can be stacked');
});
check('box chains move together, stop atomically at walls, and thrown boxes hit ceilings',()=>{
  const boxes=[100,114,128].map((x,i)=>({id:'chain-'+i,x,y:137,w:14,h:14,vx:0,vy:0}));
  const w={width:300,height:180,floorY:151,floors:[{x:0,y:151,w:300,h:30}],platforms:[{x:180,y:80,w:10,h:71}],crates:boxes};
  const p=createPlayer('push',85,129);p.onGround=true;
  for(let i=0;i<100;i++){stepPlayer(p,{right:true},w);updateCrates(w);}
  assert.ok(boxes[0].x>130);assert.ok(boxes[2].x+14<=180);
  assert.ok(boxes.every((b,i)=>!i||boxes[i-1].x+14<=b.x+.001),'chain never overlaps');
  const positions=boxes.map(b=>b.x);for(let i=0;i<20;i++)stepPlayer(p,{right:true},w);
  assert.deepEqual(boxes.map(b=>b.x),positions,'blocked chain leaves every box stationary');
  w.platforms=[{x:0,y:90,w:300,h:8}];w.crates=[{...boxes[0],x:20,y:110,vy:-4}];
  for(let i=0;i<8;i++)updateCrates(w);
  assert.ok(w.crates[0].y>=98,'thrown box cannot pass through ceiling');
});
check('stage report records death/revival timing and never contains session identifiers',()=>{
  const r=runAt(2,2),[a,b]=[...r.players.values()];
  r.tick=120;killPlayer(r,a,'QA pit');killPlayer(r,a,'duplicate');
  let report=diagnosticReport(r);
  assert.equal(report.events.filter(e=>e.type==='death').length,1);
  assert.equal(report.lastAlive,2);assert.equal(report.hearts,3);
  const cp=r.world.checkpoints[0];b.x=cp.x-b.w-1;b.input={right:true};stepRun(r);
  report=diagnosticReport(r);
  assert.equal(report.checkpoints[0].reachedAtSeconds,2);
  assert.ok(report.events.some(e=>e.type==='checkpoint-revive'&&e.survivor===1));
  assert.equal(report.lastAlive,null);assert.equal(report.hearts,3);
  assert.ok(!JSON.stringify(report).includes('p0'),'no transport participant identifier');
  for(let i=0;i<100;i++)recordRunEvent(r,'bounded-fixture');
  assert.equal(diagnosticReport(r).events.length,60);
  startLevel(r,3);assert.deepEqual(diagnosticReport(r).events.map(e=>e.type),['stage-start']);
});
check('visual preferences validate saved values and tolerate unavailable storage',()=>{
  let raw=null;const storage={getItem:()=>raw,setItem:(key,value)=>{raw=value;}};
  assert.deepEqual(readVisualOptions(storage),{motion:'system',effects:'full'});
  saveVisualOptions(storage,{motion:'reduced',effects:'reduced'});
  assert.deepEqual(readVisualOptions(storage),{motion:'reduced',effects:'reduced'});
  raw='broken';assert.equal(readVisualOptions(storage).motion,'system');
  raw=JSON.stringify({version:1,motion:'invalid',effects:'invalid'});assert.deepEqual(readVisualOptions(storage),{motion:'system',effects:'full'});
  const blocked={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}};
  assert.equal(readVisualOptions(blocked).motion,'system');assert.doesNotThrow(()=>saveVisualOptions(blocked,{motion:'full',effects:'full'}));
});
console.log('Shared systems regression complete.');

