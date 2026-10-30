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

function drawStageScenery(ctx, world, cameraX, clock) {
  const theme = world.theme;
  if (!theme || theme === 'tutorial') return;
  const offset = ((cameraX * .6) % 240 + 240) % 240;
  for (let i=-1;i<3;i++) {
    const x = i * 240 - offset;
    if (theme === 'transit') {
      RECT(ctx,x,37,220,9,'#263c4b'); RECT(ctx,x+12,45,8,91,'#344d59');
      RECT(ctx,x+28,87,172,43,'#2d4556'); RECT(ctx,x+28,119,172,4,'#a18255');
      for(let j=0;j<5;j++) { RECT(ctx,x+36+j*30,94,23,16,'#152a3b'); RECT(ctx,x+38+j*30,94,19,2,'#657f83'); }
      RECT(ctx,x+42,130,18,5,'#172737'); RECT(ctx,x+167,130,18,5,'#172737');
    } else if (theme === 'rooftops') {
      RECT(ctx,x+35,68,43,34,'#344858'); RECT(ctx,x+32,64,49,5,'#536878');
      RECT(ctx,x+41,102,4,31,'#263848'); RECT(ctx,x+69,102,4,31,'#263848');
      RECT(ctx,x+117,112,54,20,'#3c505d');
      for(let j=0;j<6;j++) RECT(ctx,x+122+j*7,116,3,11,'#263b4a');
    } else if (theme === 'searchlights' || theme === 'barricades') {
      RECT(ctx,x+105,57,12,80,'#354657'); RECT(ctx,x+97,50,28,13,'#4a6070');
      RECT(ctx,x+102,52,18,3,'#c89b67');
      ctx.save(); ctx.globalAlpha=.12; ctx.fillStyle='#e8d9ac'; ctx.beginPath();
      ctx.moveTo(x+110,59); ctx.lineTo(x+30+Math.sin(clock*.0005)*35,139); ctx.lineTo(x+120+Math.sin(clock*.0005)*35,139); ctx.closePath(); ctx.fill(); ctx.restore();
      if(theme==='barricades') { RECT(ctx,x+145,96,70,41,'#344752'); for(let j=0;j<6;j++) RECT(ctx,x+151+j*10,101,3,33,'#233542'); }
    } else if (theme === 'roots' || theme === 'canopy') {
      RECT(ctx,x+30,40,17,103,'#263f3b'); RECT(ctx,x+37,43,5,94,'#3d5c47');
      RECT(ctx,x+42,69,100,5,'#345345'); RECT(ctx,x+105,74,4,28,'#54734b');
      if(theme==='canopy') {
        RECT(ctx,x+48,48,140,2,'#45594a'); RECT(ctx,x+48,66,140,2,'#45594a');
        for(let j=0;j<14;j++) RECT(ctx,x+50+j*10,50,2,17,'#304c40');
      }
    } else if (theme === 'river') {
      RECT(ctx,x,103,240,38,'#234b56');
      for(let j=0;j<16;j++) RECT(ctx,x+j*17+(clock*.006%17),108+(j*7%29),11,1,'#477b7d');
      RECT(ctx,x+78,126,54,7,'#3b5146'); RECT(ctx,x+85,123,4,3,'#5d7254');
    } else if (['conveyor','furnace','prototype','powergrid','core'].includes(theme)) {
      RECT(ctx,x+20,42,7,94,'#3c4d60'); RECT(ctx,x+20,42,174,7,'#43596a');
      if(theme==='furnace') {
        RECT(ctx,x+55,76,105,60,'#493c42'); RECT(ctx,x+64,86,87,43,'#a85d3b');
        for(let j=0;j<7;j++) RECT(ctx,x+68+j*12,86,5,43,'#45363d');
      } else if(theme==='prototype') {
        for(let j=0;j<3;j++) { RECT(ctx,x+48+j*53,71,36,62,'#35566a'); RECT(ctx,x+51+j*53,75,30,53,'#25414f'); RECT(ctx,x+61+j*53,94,11,27,'#63828a'); RECT(ctx,x+64+j*53,98,6,2,'#ce897a'); }
      } else if(theme==='powergrid' || theme==='core') {
        RECT(ctx,x+61,68,84,67,'#304454');
        for(let j=0;j<7;j++) { RECT(ctx,x+67,74+j*8,72,3,'#667b80'); RECT(ctx,x+73,75+j*8,60,1,'#6c9a9b'); }
        RECT(ctx,x+96,58,14,9,'#be945e');
      } else {
        RECT(ctx,x+35,125,155,6,'#5b6470');
        for(let j=0;j<4;j++) { const dx=x+39+(j*39+clock*.012)%145; RECT(ctx,dx,106,14,19,'#3e596d'); RECT(ctx,dx+3,100,8,8,'#6a7c89'); RECT(ctx,dx+5,103,4,2,'#b8766a'); }
        const arm=6+Math.sin(clock*.0015)*5;
        RECT(ctx,x+113,49,7,28+arm,'#667482'); RECT(ctx,x+101,73+arm,30,6,'#4b6475');
      }
    }
  }
  if (theme === 'ranger' && world.memory) {
    const x=world.memory.x-cameraX-60;
    RECT(ctx,x,92,120,49,'#394c3b'); RECT(ctx,x-8,87,136,8,'#52664b');
    for(let i=0;i<6;i++) RECT(ctx,x,96+i*7,120,2,'#283e36');
    RECT(ctx,x+48,109,23,32,'#1b302d'); RECT(ctx,x+12,103,23,18,'#7c9160'); RECT(ctx,x+84,103,23,18,'#7c9160');
  }
}

function drawFloor(ctx, world, cameraX) {
  const p = palettes[world.region] || palettes.city;
  for (const terrain of world.terrain || []) {
    const x = terrain.x - cameraX;
    if (terrain.kind === 'water') {
      RECT(ctx, x, 143, terrain.w, 8, '#3e97ae');
      for (let i = 0; i < terrain.w; i += 14) RECT(ctx, x + i, 144 + (i % 3), 8, 1, '#a8e9df');
    }
  }
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
    const color=platform.kind==='stone'?'#758b8a':platform.kind==='pressure-bridge'?'#398e98':p.ground;
    if (platform.kind === 'breakable') {
      RECT(ctx,x,platform.y,platform.w,platform.h,'#4b342a');
      for (let row=0;row<3;row++) RECT(ctx,x+1,platform.y+1+row*6,platform.w-2,4,row%2?'#c59965':'#b88658');
      RECT(ctx,x+8,platform.y+2,2,6,'#362b31'); RECT(ctx,x+10,platform.y+8,3,5,'#362b31'); RECT(ctx,x+7,platform.y+13,3,4,'#362b31');
      continue;
    }
    RECT(ctx,x,platform.y,platform.w,platform.h,color);
    RECT(ctx,x,platform.y,platform.w,2,platform.kind==='stone'?'#b6c7ae':p.top);
    RECT(ctx,x+2,platform.y+platform.h,platform.w-4,2,'#1b2937');
  }
  for (const terrain of world.terrain || []) {
    const x = terrain.x - cameraX;
    if (x > 330 || x + terrain.w < 0) continue;
    if (terrain.kind === 'water') {
      RECT(ctx, x, 145, terrain.w, 6, '#376f83');
      for (let i = 0; i < terrain.w; i += 12) RECT(ctx, x + i, 145 + (i % 2), 7, 1, '#9bd6d5');
    } else {
      RECT(ctx, x, 149, terrain.w, 3, '#e7b568');
      for (let i = 0; i < terrain.w; i += 12) RECT(ctx, x + i, 149, 3, 2, '#302d40');
    }
  }
}

function outlinedText(ctx, text, x, y, color = '#fff0c6') {
  ctx.save(); ctx.font = 'bold 7px monospace'; ctx.lineWidth = 3; ctx.strokeStyle = '#0c1728';
  ctx.strokeText(text, rnd(x), rnd(y)); ctx.fillStyle = color; ctx.fillText(text, rnd(x), rnd(y)); ctx.restore();
}

function drawEncounter(ctx, world, cameraX, clock) {
  const b = world.boss;
  if (world.coveredWay) {
    const roof = world.coveredWay, x = roof.x - cameraX;
    RECT(ctx, x, roof.y, roof.w, 7, '#b0bbb0');
    for (let i = 0; i < 100; i++) {
      const dx = roof.x + (i * 47 % roof.w) - cameraX, y = 17 + (i * 17 % 40) + Math.sin(clock * .002 + i) * 2;
      if (dx < -12 || dx > 330) continue;
      RECT(ctx, dx, y, 7, 3, '#668a9a'); RECT(ctx, dx + 3, y + 1, 2, 1, '#f47b70');
    }
  }
  if (!b) return;
  const bx = b.x - cameraX;
  if (bx > 380) return;
  RECT(ctx, bx - 7, 55, 7, 96, '#293c51'); RECT(ctx, bx - 4, 61, 2, 77, '#69c3c6');
  if (bx > -60 && bx < 330) outlinedText(ctx, 'PURSUER BLOCKED', bx + 4, 72, '#b7ece0');
  for (const s of b.pylons) {
    const x = s.x - cameraX;
    if (x < -20 || x > 340) continue;
    RECT(ctx, x, s.y, s.w, s.h, s.active ? '#60c9b2' : '#d28f53');
    outlinedText(ctx, String(s.order + 1), x + 3, s.y - 4, s.active ? '#a4f7d6' : '#ffe6ae');
  }
  const center = b.x + b.w / 2 - cameraX;
  if (b.kind === 'background') {
    // The Colossus stays behind the arena. Its targeted strikes are foreground hazards.
    const x = Math.max(-100, Math.min(210, center - 70));
    const pulse = b.phase === 'stunned' || b.solved ? '#6ce1cf' : '#ff7e6c';
    RECT(ctx, x, 37, 126, 66, '#3a4c62'); RECT(ctx, x + 14, 18, 98, 48, '#61748c');
    RECT(ctx, x + 23, 27, 80, 22, '#202b42'); RECT(ctx, x + 33, 32, 25, 6, pulse); RECT(ctx, x + 70, 32, 25, 6, pulse);
    RECT(ctx, x - 22, 59, 32, 63, '#55667e'); RECT(ctx, x + 116, 59, 32, 63, '#55667e');
    for (let i = 0; i < 5; i++) RECT(ctx, x + 30 + i * 14, 75, 6, 14, pulse);
  } else if (b.kind === 'gatewarden') {
    const im = sprite('giant_pursuer.png');
    if (im?.complete && im.naturalWidth) { ctx.save(); ctx.globalAlpha = .85; ctx.drawImage(im, rnd(center - 30), 70, 76, 68); ctx.restore(); }
  }
  if (['warning', 'attack'].includes(b.phase)) {
    const x = b.targetX - cameraX, radius = b.kind === 'background' ? 32 : 25;
    RECT(ctx, x - radius, 147, radius * 2, 4, b.phase === 'warning' ? '#ffcc74' : '#ff806b');
    for (let i = 0; i < radius * 2; i += 8) RECT(ctx, x - radius + i, 143, 3, 4, '#f6e6b7');
    if (b.phase === 'attack') { ctx.save(); ctx.globalAlpha = .6; RECT(ctx, x - radius, 12, radius * 2, 135, '#ffad7c'); ctx.restore(); }
    else outlinedText(ctx, '! STRIKE !', x - 21, 130, '#ffe09b');
  }
}

export function drawSurvivor(ctx, p, x, clock = 0) {
  const colors = ['#e7aa55', '#73c5d2', '#d995a7', '#b9a2df'];
  const coat = colors[(p.slot ?? p.colorIndex ?? 0) % colors.length];
  const skin = (p.slot ?? 0) % 2 ? '#d5a77f' : '#edc39a';
  const walking = p.onGround && Math.abs(p.vx || 0) > .1;
  const frame = Math.floor(clock / 95) % 4;
  const bob = walking && frame % 2 ? -1 : 0;
  ctx.save(); ctx.translate(rnd(x), rnd(p.y));
  if (p.face < 0) { ctx.translate(p.w, 0); ctx.scale(-1, 1); }
  if (p.invulnerability > 0 && Math.floor(clock / 90) % 2) ctx.globalAlpha = .45;
  if (!p.alive) {
    if (p.hitTicks > 0) {
      RECT(ctx,1,6,8,7,skin); RECT(ctx,0,4,8,3,'#35313b'); RECT(ctx,2,13,8,6,coat);
      RECT(ctx,-3,13,5,3,coat); RECT(ctx,10,10,5,3,coat); RECT(ctx,4,19,10,3,'#36445b');
      RECT(ctx,-5,5,2,5,'#f2c187'); RECT(ctx,14,4,2,5,'#f2c187');
      ctx.restore(); return;
    }
    RECT(ctx,0,17,12,4,'#283846'); RECT(ctx,8,16,5,4,skin); RECT(ctx,1,16,7,4,coat);
    ctx.restore(); return;
  }
  const airborne = !p.onGround;
  const torso = p.capture ? Math.sin(clock * .025) > 0 ? -1 : 0 : bob;
  // Original pixel geometry gives each pose a clear silhouette at 12x22.
  RECT(ctx,2,8+torso,9,10,'#172735'); RECT(ctx,3,9+torso,7,8,coat);
  RECT(ctx,6,10+torso,2,7,'#e4d7b8'); RECT(ctx,3,15+torso,7,2,'#435269');
  RECT(ctx,3,1+torso,7,7,'#172735'); RECT(ctx,4,3+torso,6,5,skin);
  RECT(ctx,2,0+torso,8,3,'#35313b'); RECT(ctx,2,2+torso,3,4,'#35313b'); RECT(ctx,7,0+torso,4,2,'#35313b');
  RECT(ctx,8,4+torso,1,1,'#192b37');
  RECT(ctx,8,7+torso,2,1,p.capture?'#783f43':'#a37665');
  // Scarf streams behind running/jumping survivors.
  RECT(ctx,3,8+torso,7,2,coat);
  if (walking || airborne) RECT(ctx,-2,9+torso+(frame%2),5,2,coat);
  if (p.capture || p.carryId) {
    RECT(ctx,0,5+torso,3,7,coat); RECT(ctx,10,5+torso,3,7,coat);
    RECT(ctx,0,3+torso,3,3,skin); RECT(ctx,10,3+torso,3,3,skin);
  } else if (p.gestureTicks > 0) {
    RECT(ctx,0,11+torso,3,5,coat); RECT(ctx,10,9+torso,7,3,coat); RECT(ctx,16,8+torso,3,4,skin);
    RECT(ctx,19,7+torso,3,1,'#e4d7b8');
  } else if (airborne) {
    RECT(ctx,0,7+torso,3,6,coat); RECT(ctx,10,8+torso,3,5,coat);
    RECT(ctx,-1,(p.vy<0?6:11)+torso,3,3,skin); RECT(ctx,11,(p.vy<0?7:12)+torso,3,3,skin);
  } else {
    const swing = walking ? [1, -1, -2, 1][frame] : 0;
    RECT(ctx,1,10+torso+swing,3,5,coat); RECT(ctx,10,10+torso-swing,2,5,coat);
    RECT(ctx,1,14+torso+swing,3,2,skin); RECT(ctx,10,14+torso-swing,2,2,skin);
  }
  const stride = walking ? [-2,0,2,0][frame] : 0;
  const raised = airborne && p.vy < 0 ? 2 : 0;
  RECT(ctx,3+stride,17,3,5-raised,'#36445b'); RECT(ctx,7-stride,17,3,5,'#273748');
  RECT(ctx,2+stride,21-raised,4,1,'#d0b38a'); RECT(ctx,7-stride,21,4,1,'#d0b38a');
  ctx.restore();
}

function drawSprites(ctx, world, player, peerPlayers, cameraX, gameState) {
  if (world.memory) {
    const x = world.memory.x-cameraX;
    if (x > -30 && x < 350) {
      RECT(ctx,x,137,13,14,'#304b5b'); RECT(ctx,x+2,139,9,6,world.memory.read?'#547c79':'#8cd4dc'); RECT(ctx,x+5,146,3,3,'#e9c77f');
      outlinedText(ctx,world.memory.read?'MEMORY SAVED':'MEMORY / E',x-12,132,'#b7e3e1');
    }
  }
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
  for(const plate of world.plates || []) {
    const x=plate.x-cameraX;
    if(x < -120 || x > 340) continue;
    const warning=plate.remaining > 0 && plate.remaining <= 120 && !plate.held;
    const color=warning?'#f5b773':plate.remaining?'#8de0cf':'#92b8c8';
    RECT(ctx,x,plate.y-3,plate.w,3,'#263e51');
    RECT(ctx,x+2,plate.y-(plate.held?2:4),plate.w-4,2,color);
    for(let wire=x+plate.w;wire<plate.bridgeX-cameraX;wire+=5) RECT(ctx,wire,154,3,1,color);
    outlinedText(ctx,plate.held?'HELD':plate.remaining?`${Math.ceil(plate.remaining/60)}s`:'WEIGHT / CRATE',x-8,plate.y-10,color);
    if(!plate.remaining) for(let rail=0;rail<plate.bridgeW;rail+=8) RECT(ctx,plate.bridgeX-cameraX+rail,plate.y+3,4,1,'#59818c');
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
    const im=sprite(enemy.kind === 'scanner' ? 'robot_flyer.png' : enemy.kind === 'creeper' ? 'robot_creeper.png' : 'robot_sentinel.png');
    const bob = enemy.kind === 'scanner' ? Math.sin((gameState.clock || 0) * .005 + enemy.x) * 2 : 0;
    if(im?.complete&&im.naturalWidth) ctx.drawImage(im,rnd(x),rnd(enemy.y + bob));
    if(enemy.kind!=='scanner' && !enemy.stunned && !enemy.grabbedId && !['warning','attack'].includes(enemy.phase)) {
      const stride=Math.sin((gameState.clock||0)*.012)*2;
      RECT(ctx,x+2+stride,enemy.y+25,6,3,'#738b98'); RECT(ctx,x+12-stride,enemy.y+25,6,3,'#738b98');
    }
    if(enemy.grabbedId) {
      RECT(ctx,x-4,enemy.y+14,9,3,'#b4a071');RECT(ctx,x+15,enemy.y+14,9,3,'#b4a071');
      RECT(ctx,x-4,enemy.y+14,3,8,'#b4a071');RECT(ctx,x+21,enemy.y+14,3,8,'#b4a071');
    }
    if(enemy.phase==='recover') RECT(ctx,x+5,enemy.y+5,10,2,'#718b9c');
    if (enemy.phase === 'warning' || enemy.phase === 'attack') {
      const tx = (enemy.targetX ?? enemy.x) - cameraX, radius = enemy.kind === 'creeper' ? 48 : 23;
      RECT(ctx, tx - radius, 148, radius * 2, 3, enemy.phase === 'attack' ? '#fc7663' : '#edc879');
      if(enemy.kind==='scanner') {
        ctx.save();ctx.globalAlpha=enemy.phase==='attack'?.4:.16;RECT(ctx,tx-radius,enemy.y+enemy.h,radius*2,151-enemy.y-enemy.h,'#e6c97e');ctx.restore();
        for(let y=enemy.y+enemy.h;y<147;y+=7){RECT(ctx,tx-radius,y,1,4,'#e6c97e');RECT(ctx,tx+radius-1,y,1,4,'#e6c97e');}
      }
      const tell=enemy.kind==='creeper'?'BLAST':enemy.kind==='scanner'?'SCAN':'STRIKE';
      outlinedText(ctx, enemy.phase === 'warning' ? `${tell} ${Math.ceil(enemy.timer / 60)}` : 'DANGER', x-7, enemy.y - 5);
    }
    if (enemy.grabbedId) outlinedText(ctx, 'RESCUE ↓', x - 7, enemy.y - 8, '#9ef4e9');
    if(enemy.stunned>0) { RECT(ctx,x+4,enemy.y-4,12,2,'#f4ce76'); RECT(ctx,x+7,enemy.y-7,6,2,'#f4ce76'); }
  }
  // Player avatars are tiny and bright so their silhouette stays readable against the scenery.
  const all = [player, ...peerPlayers.filter(p => p.id !== player.id)];
  for(const p of all) {
    if(!p) continue;
    const runClock = gameState.clock || 0;
    const x=p.x-cameraX;
    if(x<-24||x>335) continue;
    drawSurvivor(ctx, p, x, runClock);
    if (p.capture) outlinedText(ctx, `HELP ${Math.max(0, p.capture.remaining).toFixed(1)}`, x - 12, p.y - 8, '#ffcc8a');
    else if (all.length > 1) outlinedText(ctx, `P${(p.slot ?? 0) + 1}${p.alive ? '' : ' DOWN'}`, x - 2, Math.min(168,p.y - 8), p.id === player.id ? '#fff0c6' : '#bdd7df');
    if (!p.alive) continue;
    if(p.id===player.id) {
      RECT(ctx,x+3,p.y-5,7,1,'#ffe9a8'); RECT(ctx,x+5,p.y-4,3,1,'#ffe9a8');
      if(p.carryId) { RECT(ctx,x+1,p.y-6,10,3,'#d7a35f'); RECT(ctx,x+2,p.y-5,8,1,'#e9c57c'); }
    }
  }
  const giant=world.giant;
  if(giant && !giant.caught) {
    const gx=giant.x-cameraX;
    if(gx>-55&&gx<375) {
      const im=sprite('giant_pursuer.png');
      if(im?.complete&&im.naturalWidth) {
        const step=Math.sin((gameState.clock||0)*.004);
        ctx.drawImage(im,0,0,im.naturalWidth,im.naturalHeight-6,rnd(gx-52),rnd(world.floorY-88+Math.abs(step)),96,76);
        RECT(ctx,gx-28+step*3,world.floorY-13,17,13,'#40536b');
        RECT(ctx,gx+10-step*3,world.floorY-13,17,13,'#40536b');
        RECT(ctx,gx-31+step*3,world.floorY-3,23,3,'#718397');
        RECT(ctx,gx+7-step*3,world.floorY-3,23,3,'#718397');
      }
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
  drawStageScenery(ctx,world,cameraX,clock);
  drawEncounter(ctx,world,cameraX,clock);
  drawFloor(ctx,world,cameraX);
  // Checkpoint's interior is safe from ordinary enemies, but not from the giant pursuer.
  drawSprites(ctx,world,player,peerPlayers,cameraX,state);
  for (const effect of world.breakEffects || []) {
    const age = (state.tick || 0) - effect.tick;
    if (age < 0 || age >= 30) continue;
    for (let i=0;i<6;i++) {
      const dx = (i - 2.5) * age * .33;
      const y = Math.min(149, effect.y - age * (1 + i % 2) + age * age * .06);
      RECT(ctx,effect.x-cameraX+dx,y,3,2,i%2?'#d4af7b':'#8b6246');
    }
  }
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
