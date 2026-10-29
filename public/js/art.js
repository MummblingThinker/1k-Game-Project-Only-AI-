const SPRITES = [
  'human_amber.png', 'human_cyan.png', 'human_rose.png', 'robot_sentinel.png',
  'robot_flyer.png', 'robot_creeper.png', 'giant_pursuer.png', 'crate.png', 'checkpoint_shelter.png',
];
const images = new Map();
for (const name of SPRITES) {
  const img = new Image();
  img.src = `/assets/sprites/${name}`;
  images.set(name, img);
}
const sprite = (name) => images.get(name);
const rnd = (v) => Math.round(v);
const RECT = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(rnd(x), rnd(y), Math.max(1,rnd(w)), Math.max(1,rnd(h))); };
const palettes = {
  city: { sky:'#17243a', far:'#28364b', mid:'#344558', ground:'#344b59', top:'#86a3a0', accent:'#e5b45f', glow:'#dd5f5d', window:'#edbd73' },
  forest: { sky:'#152c37', far:'#254648', mid:'#315a4d', ground:'#294b42', top:'#7daf7d', accent:'#f0cc77', glow:'#d85f5e', window:'#b7df9c' },
  factory: { sky:'#1d2336', far:'#303749', mid:'#414f5e', ground:'#34434c', top:'#95a5a0', accent:'#f0aa54', glow:'#e75b56', window:'#f3c36c' },
};

function drawBackground(ctx, world, cameraX, clock) {
  const p = palettes[world.region] || palettes.city;
  RECT(ctx,0,0,320,180,p.sky);
  // Distant haze and moons / factory lights.
  RECT(ctx,0,105,320,22,'#1a2c3c');
  for (let i=0;i<12;i++) {
    const x = (i*39 - Math.floor(cameraX*0.12)) % 390;
    RECT(ctx,(x+390)%390,24+(i*13)%50, i%3===0?2:1, 1, '#9aadb2');
  }
  if (world.region === 'city') {
    for (let i=0;i<15;i++) {
      const x = ((i*31 - cameraX*0.22) % 460 + 460) % 460 - 55;
      const h = 35 + (i*23)%55;
      RECT(ctx,x,119-h,24+(i%3)*5,h,p.far);
      RECT(ctx,x+4,123-h,2,2,'#788e9b');
      for (let wy=130-h;wy<116;wy+=8) for(let wx=x+4;wx<x+22;wx+=7) {
        if ((i+wy+wx)%3!==0) RECT(ctx,wx,wy,2,3, (i+wy)%4===0 ? p.glow : p.window);
      }
      if (i%4===1) { RECT(ctx,x+10,113-h,1,8,'#6a7d91'); RECT(ctx,x+7,117-h,7,2,'#6a7d91'); }
    }
    // busted overhead wires
    ctx.strokeStyle='#182436'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,52); ctx.lineTo(75,61); ctx.lineTo(128,53); ctx.lineTo(220,64); ctx.lineTo(320,55); ctx.stroke();
  } else if (world.region === 'forest') {
    for (let layer=0;layer<2;layer++) {
      const scale = layer===0 ? 0.16 : 0.32;
      const baseY = layer===0 ? 117 : 139;
      for (let i=0;i<18;i++) {
        const x = ((i*25 - cameraX*scale) % 390 + 390) % 390 - 40;
        const h = (layer===0?55:38) + ((i*17)%30);
        RECT(ctx,x+9,baseY-h+18,5,h,'#213b3a');
        RECT(ctx,x,baseY-h,24,19,layer===0?'#244747':'#315b4b');
        RECT(ctx,x+4,baseY-h+5,16,12,layer===0?'#2d5a4d':'#416f55');
        RECT(ctx,x+8,baseY-h+3,2,5,'#61865f');
      }
    }
    // tiny fireflies
    for(let i=0;i<8;i++) { const x=(i*47-Math.floor(cameraX*.4)+360)%320; const y=50+(i*29)%68; RECT(ctx,x,y,(i%3===0?2:1),1,i%2?'#b9d989':'#e3d17e'); }
  } else {
    for (let i=0;i<16;i++) {
      const x = ((i*28 - cameraX*0.2) % 390 + 390) % 390 - 40;
      const h = 25 + (i*11)%55;
      RECT(ctx,x,122-h,23,h,p.far);
      RECT(ctx,x+4,126-h,15,3,'#657a86');
      RECT(ctx,x+8,126-h,7,h-4,'#293747');
      if(i%3===0) { RECT(ctx,x+10,120-h,3,7,p.accent); RECT(ctx,x+3,122-h,17,2,'#6b7e85'); }
      for(let j=0;j<4;j++) RECT(ctx,x+4+j*4,131-h+j*9,2,3,(i+j)%2?p.window:'#a95a4b');
    }
    // hanging cables
    ctx.strokeStyle='#111a2a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(35,0); ctx.lineTo(41,27); ctx.lineTo(72,40); ctx.lineTo(120,43); ctx.lineTo(165,20); ctx.stroke();
  }
  // Foreground silhouette drift
  for(let i=0;i<9;i++) {
    const x = ((i*41 - Math.floor(cameraX*0.45))%370+370)%370-25;
    RECT(ctx,x,140-(i%3)*5,29,25,world.region==='forest'?'#1e3834':(world.region==='factory'?'#232d3b':'#202e40'));
  }
  // light pulses in the horizon
  if (world.region !== 'forest') {
    const pulse = Math.floor((Math.sin(clock*0.003)+1)*2);
    RECT(ctx, 256, 104, 3+pulse, 2, p.glow);
  }
}

function drawFloor(ctx, world, cameraX) {
  const p = palettes[world.region] || palettes.city;
  for (const floor of world.floors) {
    const x=floor.x-cameraX;
    if(x+floor.w<0||x>320) continue;
    RECT(ctx,x,floor.y,floor.w,floor.h,p.ground);
    RECT(ctx,x,floor.y,floor.w,2,p.top);
    for(let tx=Math.max(0,Math.floor(x/8)*8);tx<Math.min(320,x+floor.w);tx+=8) {
      RECT(ctx,tx,floor.y+7,1,1,'#192b35');
      if (((tx+Math.floor(cameraX))%5)===0) RECT(ctx,tx+3,floor.y+13,2,1,'#4f6670');
    }
    if(world.region==='city') { RECT(ctx,x,floor.y+25,floor.w,2,'#273a48'); }
    if(world.region==='forest') { for(let tx=Math.max(0,Math.floor(x/12)*12);tx<Math.min(320,x+floor.w);tx+=12) RECT(ctx,tx,floor.y-2,3,2,'#5a8c60'); }
    if(world.region==='factory') { for(let tx=Math.max(0,Math.floor(x/24)*24);tx<Math.min(320,x+floor.w);tx+=24) { RECT(ctx,tx,floor.y+3,1,24,'#5b6871'); RECT(ctx,tx+12,floor.y+3,1,24,'#273845'); } }
  }
  for(const pit of world.pits) {
    const x=pit.x-cameraX;
    if(x+pit.w<0||x>320) continue;
    RECT(ctx,x,pit.y-1,pit.w,4,'#131b2b');
    RECT(ctx,x,pit.y+3,pit.w,35,world.region==='factory'?'#3a2229':'#111a2b');
    if(world.region==='factory') for(let j=0;j<pit.w;j+=6) RECT(ctx,x+j,pit.y+8+(j%3),3,2,'#ce5b43');
    else for(let j=0;j<pit.w;j+=8) RECT(ctx,x+j,pit.y+10+(j%3),2,1,'#3f556a');
  }
  for(const platform of world.platforms) {
    const x=platform.x-cameraX;
    if(x+platform.w<0||x>320) continue;
    const color=platform.kind==='stone'?'#758b8a':p.ground;
    RECT(ctx,x,platform.y,platform.w,platform.h,color);
    RECT(ctx,x,platform.y,platform.w,2,platform.kind==='stone'?'#b6c7ae':p.top);
    RECT(ctx,x+2,platform.y+platform.h,platform.w-4,2,'#1b2937');
  }
}

function drawSprites(ctx, world, player, peerPlayers, cameraX, gameState) {
  for(const cp of world.checkpoints) {
    const x=cp.x-cameraX;
    if(x < -45 || x>325 || cp.destroyed) continue;
    const im=sprite('checkpoint_shelter.png'); if(im?.complete && im.naturalWidth) ctx.drawImage(im,rnd(x),rnd(cp.y-1));
    RECT(ctx,x+2,cp.y+20,38,2,'#a9c6a0');
    // left/right exits and overhead escape ladder
    RECT(ctx,x-2,cp.y+12,4,9,'#d2b56f'); RECT(ctx,x+40,cp.y+12,4,9,'#d2b56f');
    RECT(ctx,x+21,cp.y-8,2,8,'#d2b56f'); RECT(ctx,x+17,cp.y-5,10,1,'#d2b56f');
    if(cp.active) RECT(ctx,x+14,cp.y+2,14,2,'#b9db9b');
  }
  for(const sw of world.switches) {
    const x=sw.x-cameraX;
    if(x>-10&&x<330) {
      RECT(ctx,x,sw.y,sw.w,sw.h,'#263448'); RECT(ctx,x+2,sw.y+2,sw.w-4,sw.h-4,sw.active?'#8bd18b':'#d45d5a');
      RECT(ctx,x+4,sw.y+4,2,2,'#fff0b4');
    }
  }
  for(const crate of world.crates) {
    if(crate.used) continue;
    const x=crate.x-cameraX; if(x < -20 || x>330) continue;
    const im=sprite('crate.png'); if(im?.complete&&im.naturalWidth) ctx.drawImage(im,rnd(x),rnd(crate.y)); else RECT(ctx,x,crate.y,crate.w,crate.h,'#a96c3e');
  }
  for(const enemy of world.enemies) {
    if(enemy.dead) continue;
    const x=enemy.x-cameraX; if(x<-25||x>345) continue;
    const im=sprite('robot_sentinel.png'); if(im?.complete&&im.naturalWidth) ctx.drawImage(im,rnd(x),rnd(enemy.y));
    if(enemy.stunned>0) { RECT(ctx,x+4,enemy.y-4,12,2,'#f4ce76'); RECT(ctx,x+7,enemy.y-7,6,2,'#f4ce76'); }
  }
  // Player avatars are tiny and bright so their silhouette stays readable against the scenery.
  const all = [player, ...peerPlayers.filter(p => p.id !== player.id)];
  for(const p of all) {
    if(!p?.alive) continue;
    const x=p.x-cameraX;
    if(x<-24||x>335) continue;
    const variants=['human_amber.png','human_cyan.png','human_rose.png'];
    const im=sprite(variants[(p.colorIndex??0)%variants.length]);
    if(im?.complete&&im.naturalWidth) {
      if(p.face<0) { ctx.save(); ctx.translate(rnd(x+p.w),0); ctx.scale(-1,1); ctx.drawImage(im,0,rnd(p.y)); ctx.restore(); }
      else ctx.drawImage(im,rnd(x),rnd(p.y));
    }
    if(p.id===player.id) {
      RECT(ctx,x+3,p.y-5,7,1,'#ffe9a8'); RECT(ctx,x+5,p.y-4,3,1,'#ffe9a8');
      if(p.carryId) { RECT(ctx,x+1,p.y-6,10,3,'#d7a35f'); RECT(ctx,x+2,p.y-5,8,1,'#e9c57c'); }
    }
  }
  const giant=world.giant;
  if(giant && !giant.caught) {
    const gx=giant.x-cameraX;
    if(gx>-55&&gx<330) {
      const im=sprite('giant_pursuer.png'); if(im?.complete&&im.naturalWidth) ctx.drawImage(im,rnd(gx),rnd(giant.y));
    }
  }
  const finishX=world.finish.x-cameraX;
  if(finishX>-40&&finishX<330) {
    RECT(ctx,finishX,world.finish.y,28,30,'#263849'); RECT(ctx,finishX+3,world.finish.y+3,22,24,'#1b2d3b');
    RECT(ctx,finishX+7,world.finish.y+8,14,13,world.finish.locked?'#bd5554':'#5e9e9a'); RECT(ctx,finishX+9,world.finish.y+10,10,9,world.finish.locked?'#e49a70':'#b5d9a3');
    RECT(ctx,finishX+12,world.finish.y+14,4,5,'#f5d075');
    RECT(ctx,finishX+8,world.finish.y-3,12,2,'#d5c778');
  }
}

export function drawGame(ctx, world, player, peerPlayers, cameraX, state) {
  const clock=state.clock||0;
  drawBackground(ctx,world,cameraX,clock);
  drawFloor(ctx,world,cameraX);
  // Checkpoint's interior is safe from ordinary enemies, but not from the giant pursuer.
  drawSprites(ctx,world,player,peerPlayers,cameraX,state);
  const p=palettes[world.region]||palettes.city;
  RECT(ctx,0,177,320,3,'#111827');
  RECT(ctx,0,177,320*(Math.max(0,Math.min(world.width,player.x))/world.width),2,p.accent);
}

export function drawTitle(ctx, clock=0) {
  const fake={region:'city',floors:[{x:0,y:150,w:320,h:30}],pits:[],platforms:[],crates:[],enemies:[],checkpoints:[],switches:[],width:320,finish:{x:285,y:120,w:20,h:30},giant:{x:236,y:102},height:180};
  drawBackground(ctx,fake,clock*0.045,clock);
  drawFloor(ctx,fake,0);
  const amb=sprite('human_amber.png'); const cya=sprite('human_cyan.png'); const ros=sprite('human_rose.png'); const big=sprite('giant_pursuer.png');
  if(amb?.complete&&amb.naturalWidth) ctx.drawImage(amb,74,124);
  if(cya?.complete&&cya.naturalWidth) ctx.drawImage(cya,92,124);
  if(ros?.complete&&ros.naturalWidth) ctx.drawImage(ros,110,124);
  if(big?.complete&&big.naturalWidth) ctx.drawImage(big,232,109);

}

export function drawCutscenePanel(ctx, panel, elapsed, total, clock=0) {
  const visual=panel.visual;
  const region=visual==='forestChase'?'forest':(visual==='assemblyReveal'?'factory':'city');
  const fake={region,floors:[{x:0,y:150,w:320,h:30}],pits:[],platforms:[],crates:[],enemies:[],checkpoints:[],switches:[],width:320,finish:{x:300,y:120,w:20,h:30},giant:{x:265,y:109},height:180};
  drawBackground(ctx,fake,clock*0.14,clock);
  drawFloor(ctx,fake,0);
  const fade=Math.max(0,Math.min(1,elapsed/500));
  const p=palettes[region];
  // Scene-specific silhouettes, drawn from original blocks/sprites (not borrowed game art).
  const hum=sprite('human_amber.png'); const hum2=sprite('human_cyan.png'); const hum3=sprite('human_rose.png'); const bot=sprite('robot_sentinel.png'); const fly=sprite('robot_flyer.png'); const giant=sprite('giant_pursuer.png'); const crate=sprite('crate.png');
  const humanRun=(x,y,variant=0)=>{ const im=[hum,hum2,hum3][variant%3]; if(im?.complete&&im.naturalWidth) ctx.drawImage(im,rnd(x),rnd(y)); };
  const robot=(x,y)=>{if(bot?.complete&&bot.naturalWidth)ctx.drawImage(bot,rnd(x),rnd(y));};
  if(visual==='invasion') {
    for(let i=0;i<5;i++) robot(190+i*24,111-(i%2)*7);
    humanRun(40,126,0); humanRun(61,125,1); humanRun(83,128,2);
    ctx.fillStyle='#e25155'; ctx.fillRect(212,58,2,14); ctx.fillRect(205,64,16,2);
  } else if(visual==='chase' || visual==='forestChase') {
    for(let i=0;i<4;i++) { humanRun(34+i*24,125-(i%2)*3,i); robot(166+i*27,112-(i%3)*5); }
    for(let i=0;i<6;i++) { const x=(i*49+clock*.045)%320; ctx.fillStyle=i%2?'#9cc5d1':'#b6d88a'; ctx.fillRect(x,34+(i*17)%45,2,2); }
  } else if(visual==='survivors') {
    humanRun(106,124,0); humanRun(128,124,1); humanRun(150,124,2);
    ctx.fillStyle='#f3ca70'; ctx.fillRect(117,114,2,2); ctx.fillRect(139,111,2,2); ctx.fillRect(162,115,2,2);
  } else if(visual==='gate') {
    ctx.fillStyle='#293a4d'; ctx.fillRect(185,70,42,80); ctx.fillRect(193,80,26,70); ctx.fillStyle='#d66059'; ctx.fillRect(198,91,16,3);
    humanRun(82,125,0); humanRun(101,125,1); robot(239,119); robot(260,117);
  } else if(visual==='swarm') {
    ctx.fillStyle='#253344'; ctx.fillRect(0,101,320,9); ctx.fillRect(0,109,320,8);
    for(let i=0;i<100;i++) {
      const x=(i*37+Math.floor(clock*.014)*(i%4+1))%320;
      const y=18+(i*29)%79;
      if(i%3===0 && fly?.complete && fly.naturalWidth) ctx.drawImage(fly,x,y,8,7);
      else { ctx.fillStyle = i%4===0 ? '#e9635d' : (i%4===1 ? '#8ba6b0' : '#c4d1c5'); ctx.fillRect(x,y,2+(i%5===0?1:0),2); ctx.fillStyle='#f7ce76'; ctx.fillRect(x+1,y,1,1); }
    }
    humanRun(95,124,0); humanRun(118,124,1); humanRun(141,124,2);
    ctx.fillStyle='#e5c673'; ctx.fillRect(0,100,320,2);
  } else if(visual==='factoryDoor') {
    ctx.fillStyle='#252e40'; ctx.fillRect(174,45,75,105); ctx.fillStyle='#546775'; ctx.fillRect(181,52,61,98); ctx.fillStyle='#1c2536'; ctx.fillRect(188,60,47,90); ctx.fillStyle='#e0ad60'; ctx.fillRect(185,70,2,30); ctx.fillRect(239,70,2,30);
    humanRun(80,125,0); humanRun(101,125,1); humanRun(122,125,2);
    for(let i=0;i<3;i++) robot(20+i*20,119);
  } else if(visual==='assemblyReveal') {
    // Conveyor rails and identical freshly-built silhouettes recede into the hall.
    for(let row=0;row<3;row++) {
      ctx.fillStyle='#536471'; ctx.fillRect(0,75+row*23,320,3);
      for(let i=0;i<7;i++) { const x=i*47+((clock*.006*(row+1))%25); robot(x,47+row*23); }
      for(let x=0;x<320;x+=16) { ctx.fillStyle='#182437'; ctx.fillRect(x,79+row*23,5,2); }
    }
    humanRun(78,125,0); humanRun(98,125,1); humanRun(118,125,2); robot(24,118); robot(45,117);
    ctx.fillStyle='#e6b45f'; ctx.fillRect(150,28,2,30); ctx.fillRect(143,35,16,2);
  } else if(visual==='celebration') {
    ctx.fillStyle='#233b42'; ctx.fillRect(0,95,320,55);
    humanRun(107,124,0); humanRun(129,124,1); humanRun(151,124,2);
    for(let i=0;i<25;i++) { const x=(i*29+Math.floor(clock*.02))%320; const y=(i*17+Math.floor(clock*.015))%102; ctx.fillStyle=['#f1c76e','#d86b62','#9fcd9e','#7fb5ce'][i%4]; ctx.fillRect(x,y,2,3); }
  } else if(visual==='darkTwist') {
    humanRun(107,124,0); humanRun(129,124,1); humanRun(151,124,2);
    // The approaching patrols crowd the celebrating survivors; no gore, just a sudden red flash and blackout.
    if(elapsed > 250) robot(194-Math.min(25,(elapsed-250)*.025),117);
    if(elapsed > 430) robot(219-Math.min(18,(elapsed-430)*.02),115);
    if(elapsed > 620) robot(246-Math.min(13,(elapsed-620)*.015),119);
    for(let i=0;i<8;i++) { ctx.fillStyle='#ef585a'; ctx.fillRect(220+i*9,100-(i%3)*4,3,2); }
    if(elapsed > 1050 && elapsed < 1260) { ctx.fillStyle='rgba(228,67,69,.22)'; ctx.fillRect(0,0,320,180); }
    const darkness=Math.max(0,Math.min(1,(elapsed-1000)/1700)); ctx.fillStyle=`rgba(4,7,15,${darkness})`; ctx.fillRect(0,0,320,180);
  }
  // Letterbox bars + panel caption
  ctx.fillStyle='#0b101d'; ctx.fillRect(0,0,320,15); ctx.fillRect(0,164,320,16);
  const progress=Math.max(0,Math.min(1,elapsed/total)); ctx.fillStyle='#202c3d'; ctx.fillRect(9,157,302,2); ctx.fillStyle=p.accent; ctx.fillRect(9,157,302*progress,2);
  if(elapsed < 700) { ctx.fillStyle=`rgba(5,8,16,${1-fade})`; ctx.fillRect(0,0,320,180); }
}

export function imageLoaded() { return [...images.values()].every((img)=>img.complete); }
