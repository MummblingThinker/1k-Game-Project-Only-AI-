const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
const label=(c,text,x,y,color='#e9f4d8')=>{c.font='6px monospace';c.fillStyle='#101b29';c.fillText(text,Math.round(x)+1,Math.round(y)+1);c.fillStyle=color;c.fillText(text,Math.round(x),Math.round(y));};
const COLORS={city:['#182239','#263c55','#42566a','#94b5b8','#efc17b'],forest:['#102c33','#234840','#3c6852','#a0c982','#e5d48b'],factory:['#171f2e','#293949','#4a5967','#a6b9bc','#f2a457']};
function prop(c,o,t){
  const x=o.x,y=o.y,k=o.kind;
  if(o.durable){rect(c,x,y,12,12,'#bd923e');rect(c,x+2,y+2,8,8,'#f0cf74');rect(c,x+5,y+3,2,6,'#67572d');return;}
  if(k==='stick'||k==='bone'){rect(c,x,y+5,12,3,k==='bone'?'#ddd7b5':'#ae8151');rect(c,x+2,y+2,2,5,k==='bone'?'#ddd7b5':'#ae8151');rect(c,x+9,y+7,2,4,'#c6ad7e');}
  else if(k==='trashcan'){rect(c,x+1,y+2,10,10,'#62818b');rect(c,x,y,12,2,'#a5b5b7');for(let j=3;j<11;j+=3)rect(c,x+j,y+3,1,8,'#304756');}
  else if(k==='mailbox'){rect(c,x+1,y,10,8,'#5287b1');rect(c,x+2,y+3,7,2,'#152e47');rect(c,x+5,y+8,2,4,'#8a9b9d');}
  else if(k==='bottle'){rect(c,x+5,y,3,3,'#b6d6cf');rect(c,x+3,y+3,7,9,'#5d9b99');rect(c,x+4,y+6,5,3,'#ded2af');}
  else if(k==='log'){rect(c,x,y+2,12,9,'#815e3e');rect(c,x+1,y+3,3,7,'#d4ac77');rect(c,x+5,y+4,6,1,'#5c4935');}
  else if(k==='mushroom'||k==='acorn'){rect(c,x+5,y+5,3,7,'#d5c198');rect(c,x+1,y+2,10,5,k==='mushroom'?'#c57d6f':'#aa8050');}
  else if(k==='gear'||k==='coil'){rect(c,x+2,y+2,8,8,'#a6afb3');rect(c,x+4,y+4,4,4,'#374656');for(let a=0;a<4;a++)rect(c,x+(a%2)*9,y+Math.floor(a/2)*9,3,3,'#6b8792');}
  else if(k==='battery'||k==='monitor'){rect(c,x+1,y+1,10,10,'#647b83');rect(c,x+3,y+3,6,5,'#80d8be');rect(c,x+4,y,4,2,'#c8cbc0');}
  else if(k==='aircon'||k==='antenna'){rect(c,x,y+2,12,10,'#76878f');for(let a=0;a<4;a++)rect(c,x+2,y+4+a*2,8,1,'#364a59');}
  else if(k==='pipe'){rect(c,x,y+4,12,5,'#9e9c91');rect(c,x+1,y+2,2,9,'#666d6e');}
  else{rect(c,x,y+3,12,9,k==='brick'?'#b78269':'#8f9692');rect(c,x+2,y+4,8,2,'#c0b399');rect(c,x+7,y+7,1,4,'#5f6260');}
}
function robot(c,e,t){
  if(e.dead)return;
  const x=e.x,y=e.y,dir=e.dir||1,eye=e.stunned?'#8fe5e2':e.phase==='windup'?'#ffe99b':'#ff7666';
  if(e.kind==='scanner'){
    rect(c,x+4,y+2,14,10,'#8ca0ae');rect(c,x,y,5,8,'#465d75');rect(c,x+18,y,5,8,'#465d75');rect(c,x+9,y+8,5,5,eye);
    rect(c,x-3,y-2,11,1,'#adbdc3');rect(c,x+16,y-2,11,1,'#adbdc3');
    if(e.phase==='warning'||e.phase==='attack'){const tx=e.targetX+6;rect(c,tx-14,e.y+14,28,Math.min(150,e.groundY-e.y),e.phase==='attack'?'#f6d780':'#633d49');rect(c,tx-1,e.y+14,2,150,eye);label(c,e.phase==='warning'?'SCAN':'FIRE',tx-10,e.y+22);}
    return;
  }
  c.save();c.translate(x+(dir<0?e.w:0),y);c.scale(dir,1);
  const h=e.h,w=e.w,step=e.stunned?0:Math.floor(t/120)%2*2;
  const hue=e.kind==='woodcutter'?'#b49c70':e.kind==='hound'?'#77977d':e.kind==='welder'?'#b79164':e.kind==='courier'?'#7796af':'#82969e';
  rect(c,2,8,w-4,h-13,'#263b4b');rect(c,3,9,w-6,h-15,hue);rect(c,2,0,w-3,10,hue);rect(c,w-5,3,5,3,eye);
  rect(c,1,h-6+step,5,6-step,'#506b7b');rect(c,w-6,h-6+(2-step),5,4+step,'#506b7b');
  rect(c,w-2,12,4,7,hue);rect(c,w+1,14,3,3,eye);
  if(e.kind==='hound'){rect(c,w-1,5,6,5,hue);rect(c,1,1,3,4,'#c0b184');}
  if(e.kind==='woodcutter'){rect(c,w+3,13,7,3,'#d3c8a0');rect(c,w+8,10,3,8,'#a0aeb1');}
  if(e.kind==='roller'){rect(c,0,h-6,w,6,'#293f50');for(let i=2;i<w;i+=5)rect(c,i,h-4,3,3,'#a0aeb1');}
  if(e.kind==='riot'){rect(c,w,7,5,16,'#496d8a');rect(c,w+1,9,3,9,'#b9c9c4');}
  if(e.phase==='windup')label(c,'!',w+6,2,'#ffe08a');
  if(e.stunned)label(c,'* *',0,-4,'#97e5df');
  c.restore();
  // A narrow headlight makes the facing direction unambiguous without hiding terrain.
  if(!e.stunned){c.globalAlpha=.12;c.fillStyle=eye;c.beginPath();c.moveTo(x+(dir>0?e.w:0),y+5);c.lineTo(x+(dir>0?e.w+38:-38),y-3);c.lineTo(x+(dir>0?e.w+38:-38),y+22);c.fill();c.globalAlpha=1;}
}
function scenery(c,o,t){
  const x=o.x,y=o.y,k=o.kind;
  if(k==='tree'){rect(c,x+9,y-o.h-30,9,o.h+30,'#315646');rect(c,x-15,y-o.h-40,55,22,'#315c4c');rect(c,x-8,y-o.h-52,42,19,'#416b50');}
  else if(k==='lamp'){rect(c,x+7,y-65,3,65,'#4d6675');rect(c,x+7,y-65,18,3,'#819a9c');rect(c,x+20,y-62,7,3,'#f3ca86');}
  else if(k==='sign'){rect(c,x,y-42,2,42,'#5c7885');rect(c,x-10,y-43,34,14,'#467388');label(c,'EXIT >',x-8,y-34,'#dbdbc1');}
  else if(k==='pipe'||k==='tank'||k==='piston'){rect(c,x,y-o.h,o.w,o.h,'#304657');rect(c,x+3,y-o.h+3,o.w-6,4,'#71838a');rect(c,x+4,y-6,o.w-8,3,'#f0a15a');}
  else if(k==='train'){rect(c,x,y,o.w,o.h,'#344d61');for(let dx=8;dx<o.w-10;dx+=28)rect(c,x+dx,y+5,18,12,'#719491');}
  else if(k==='fern'||k==='flowers'){for(let i=0;i<5;i++){rect(c,x+i*4,y-4-i%3*3,2,6+i%3*3,'#688e65');if(k==='flowers')rect(c,x+i*4-1,y-5-i%3*3,4,2,'#d8c885');}}
  else{rect(c,x,y-8,o.w,8,'#465c5a');rect(c,x+4,y-13,o.w/2,5,'#60736b');}
}
export function drawRevision(c,w,player,peers,cameraX,state,drawSurvivor){
  const cy=state.cameraY||0,t=state.reducedMotion?0:state.clock||0,tick=state.tick||0;
  const biome=w.id===11?(cameraX<w.coveredWay.x?'forest':cameraX<w.coveredWay.x+w.coveredWay.w?'city':'factory'):w.region,P=COLORS[biome];
  rect(c,0,0,320,180,P[0]);
  for(let i=0;i<12;i++){
    const x=((i*41-cameraX*.14)%430+430)%430-50,y=30+((i*23+w.id*7)%65)-cy*.025;
    rect(c,x,y,25+i%3*9,180,P[1]);
    if(biome==='city')for(let j=0;j<6;j++)rect(c,x+4,y+j*15+6,4,3,j%3?'#617577':'#c49c6e');
    if(biome==='forest'){rect(c,x-12,y-10,50,25,'#274b43');rect(c,x+9,y-20,6,180,'#2c5048');}
    if(biome==='factory'){rect(c,x+5,y+12,15,4,'#605f5a');rect(c,x+10,y+16,4,160,'#465662');}
  }
  c.save();c.translate(-Math.round(cameraX),-Math.round(cy));
  const visible=o=>o.x+o.w>cameraX-65&&o.x<cameraX+385&&o.y+(o.h||60)>cy-100&&o.y<cy+280;
  for(const s of w.scenery)if(s.x>cameraX-100&&s.x<cameraX+400)scenery(c,s,t);
  if(w.coveredWay&&cameraX+320>w.coveredWay.x&&cameraX<w.coveredWay.x+w.coveredWay.w){
    const r=w.coveredWay;
    for(let i=0;i<(state.reducedEffects?25:100);i++){const x=r.x+(i*71+Math.sin(t*.001+i)*24)%r.w,y=r.y-20-i%4*10;rect(c,x,y,9,4,'#8299a5');rect(c,x+3,y+3,3,2,'#f08074');rect(c,x-2,y-2,13,1,'#506c7e');}
    for(let x=r.x;x<r.x+r.w;x+=100){rect(c,x,r.y,5,w.floorY-r.y,'#516b7b');rect(c,x+9,r.y+17,32,22,'#223d4a');rect(c,x+10,r.y+18,30,2,'#7e989c');}
    label(c,'HUMAN ACCESS ONLY',r.x+20,r.y+26,'#bcd2be');
  }
  if(w.boss?.kind==='foundry'&&!w.boss.solved&&!['escape','breach'].includes(w.boss.phase)&&player.x>=w.boss.x){
    const bx=cameraX+218,by=cy+22;c.globalAlpha=.65;
    rect(c,bx-20,by+45,120,90,'#3f5368');rect(c,bx,by,70,52,'#8493a1');rect(c,bx+5,by+5,60,5,'#b2bbb9');rect(c,bx+8,by+20,18,7,'#f4aa79');rect(c,bx+44,by+20,18,7,'#f4aa79');rect(c,bx+20,by+38,30,5,'#243c51');
    rect(c,bx-35,by+62,23,65,'#697d8c');rect(c,bx+78,by+62,23,65,'#697d8c');rect(c,bx+12,by+70,45,35,'#82694f');for(let j=0;j<4;j++)rect(c,bx+17+j*10,by+76,4,24,'#f0a66b');c.globalAlpha=1;
  }
  for(const s of [...w.floors,...w.platforms])if(visible(s)){
    const bridge=s.kind?.includes('bridge'),wood=['canopy','maze-tree','branch','cabin'].includes(s.kind);
    rect(c,s.x,s.y,s.w,s.h,bridge?'#526b74':wood?'#6c6145':P[2]);rect(c,s.x,s.y,s.w,3,bridge?'#d2bb7e':P[3]);
    if(s.h>20){for(let y=s.y+12;y<s.y+s.h;y+=20)for(let x=s.x+8;x<s.x+s.w-8;x+=30)if(x>cameraX-20&&x<cameraX+340&&y>cy&&y<cy+180)rect(c,x,y,wood?2:12,wood?12:6,wood?'#9a865d':'#243d4e');}
    if(bridge)for(let x=s.x+5;x<s.x+s.w;x+=12)rect(c,x,s.y+4,6,2,'#91a7aa');
    if(s.kind==='breakable'){rect(c,s.x+2,s.y+2,s.w-4,s.h-4,s.material==='forest'?'#a88b59':s.material==='city'?'#ba8a73':'#99a5a2');for(let j=0;j<4;j++)rect(c,s.x+6+j*2,s.y+3+j*4,3,4,'#3c4b4c');label(c,'CRACKED',s.x-8,s.y-5,'#e8c999');}
  }
  for(const l of w.ladders)if(visible(l)){rect(c,l.x,l.y,2,l.h,'#d9bf7e');rect(c,l.x+10,l.y,2,l.h,'#d9bf7e');for(let y=l.y+4;y<l.y+l.h;y+=8)rect(c,l.x,y,12,2,'#9ca58b');label(c,'E',l.x+3,l.y+l.h-6);}
  for(const cp of w.checkpoints)if(visible(cp)){rect(c,cp.x+2,cp.y,2,cp.h,'#dbe4d1');rect(c,cp.x+4,cp.y+2,17,11,cp.active?'#79d6ba':'#d3a15f');rect(c,cp.x+7,cp.y+5,4,4,'#f6ebc5');label(c,cp.active?'SAVED':'FLAG +1',cp.x-8,cp.y-6);}
  if(w.memory){const m=w.memory;rect(c,m.x,m.y,10,25,'#446e88');rect(c,m.x+2,m.y+3,6,6,m.read?'#96b8b3':'#8fdfeb');label(c,m.read?'READ':'MEMORY / E',m.x-16,m.y-6);}
  for(const s of [...w.switches,...(w.boss?.pylons||[])])if(visible(s)){rect(c,s.x,s.y,s.w,s.h,'#647f8b');rect(c,s.x+2,s.y+2,s.w-4,5,s.active?'#92e6b8':'#ec8468');label(c,s.active?'ON':'E',s.x,s.y-5);}
  for(const s of w.plates)if(s.x>cameraX-50&&s.x<cameraX+330){rect(c,s.x,s.y-3,s.w,3,s.held?'#a4efba':'#f1c46d');label(c,s.held?'HELD':s.remaining?Math.ceil(s.remaining/60)+'s':'WEIGHT',s.x-5,s.y-8);}
  for(const s of w.terrain)if(visible(s)){rect(c,s.x,s.y,s.w,s.h,s.kind==='water'?'#4c969e':'#8d795a');for(let x=s.x;x<s.x+s.w;x+=12)rect(c,x+(Math.floor(t/100)%8),s.y+2,5,1,s.kind==='water'?'#a3d8d5':'#d3b47d');}
  for(const a of w.animals){const x=a.x,y=a.y;rect(c,x,y,11,6,a.kind==='rabbit'?'#bcad90':'#a17f56');rect(c,x+(a.dir>0?8:0),y-3,5,5,'#c4ad83');rect(c,x+2,y+6,2,3,'#8d795d');rect(c,x+8,y+6,2,3,'#8d795d');if(a.kind==='rabbit')rect(c,x+10,y-8,2,6,'#c8bca0');}
  for(const o of w.crates)if(!o.used&&visible(o))prop(c,o,t);
  for(const e of w.enemies)if(visible(e))robot(c,e,t);
  const b=w.boss;
  if(b){
    if(b.kind==='climber'&&!b.solved&&b.phase!=='waiting'){rect(c,b.x,b.crushY,b.w,25,'#40576b');for(let x=b.x;x<b.x+b.w;x+=22){rect(c,x,b.crushY-12,10,16,'#8fa0a6');rect(c,x+2,b.crushY-15,6,3,'#f2a17d');}label(c,'CLIMB — CLAWS RISING',b.x+25,b.crushY-22,'#f6c48c');}
    rect(c,b.x-8,w.floorY-110,6,110,'#7f969c');label(c,'GIANT BLOCKED',b.x-48,w.floorY-118,'#c9debd');
    if(b.kind==='foundry'&&!b.solved&&['escape','breach'].includes(b.phase)){
      const bx=b.bodyX,by=b.bodyY;
      rect(c,bx,by,94,100,'#53677a');rect(c,bx+15,by+10,65,28,'#8393a0');rect(c,bx+22,by+21,18,5,'#f09a72');rect(c,bx+55,by+21,18,5,'#f09a72');rect(c,bx+30,by+52,35,28,'#b58260');
    }else if(!b.solved&&b.kind!=='foundry'){robot(c,{kind:b.kind==='chainsaw'?'woodcutter':'riot',x:b.bodyX,y:b.bodyY,w:b.bodyW,h:b.bodyH,dir:1,phase:b.phase,stunned:tick-b.hitTick<15},t);}
    if(['warning','attack'].includes(b.phase)){rect(c,b.targetX-18,b.targetY+22,36,4,b.phase==='attack'?'#ffe3a0':'#d4796e');label(c,b.kind==='foundry'?'LASER':'SLAM',b.targetX-12,b.targetY-8,'#ffe6a1');if(b.phase==='attack'&&b.kind==='foundry')rect(c,b.targetX-2,b.targetY-80,4,120,'#ffe5a4');}
    if(b.tree){const tr=b.tree;if(tr.phase==='upright'||tr.phase==='warning'){rect(c,tr.x+70,tr.y,28,tr.h,'#76603e');rect(c,tr.x+63,tr.y+tr.h-35,42,3,'#c6a36d');}if(tr.phase==='warning'||tr.phase==='falling'){for(let x=tr.x-35;x<tr.x+tr.w;x+=12)rect(c,x,w.floorY-5,7,5,'#f4bc64');label(c,'TREE FALLING!',tr.x-25,w.floorY-50);}if(tr.phase==='falling'){c.save();c.translate(tr.x+85,w.floorY);c.rotate(-Math.PI/2*(1-tr.timer/30));rect(c,-14,-tr.h,28,tr.h,'#8a7049');rect(c,-55,-tr.h-15,100,50,'#385e48');c.restore();}if(tr.phase==='fallen'){rect(c,tr.x-35,w.floorY-18,tr.w+35,18,'#876b43');rect(c,tr.x-25,w.floorY-15,tr.w+15,3,'#bf9c65');}}
    if(b.kind==='chainsaw'&&!b.solved){const sx=b.bodyX+b.bodyW-4,sy=b.bodyY+29;rect(c,sx,sy,40,12,'#899da0');rect(c,sx+3,sy+3,35,6,'#263b4a');for(let j=0;j<8;j++){const dx=sx+j*5+Math.floor(t/60)%3;rect(c,dx,sy-2,3,3,'#d7d5bc');rect(c,dx,sy+11,3,3,'#d7d5bc');}}
    if(b.lavaY!=null){const lx=['escape','breach'].includes(b.phase)||b.solved?b.x-650:b.x;rect(c,lx,b.lavaY,w.width-lx,1000,'#b64835');rect(c,lx,b.lavaY,w.width-lx,5,'#ffc470');for(let x=lx;x<w.width;x+=17)rect(c,x+Math.sin(t*.003+x)*4,b.lavaY+8,8,2,'#e98547');}
  }
  for(const p of [player,...peers])if(p.alive){drawSurvivor(c,p,p.x,t,state.reducedMotion);label(c,'P'+((p.slot??p.colorIndex??0)+1),p.x,p.y-9,['#f8ce83','#9ee4de','#f1b0c2','#bdc7ff'][(p.slot||0)%4]);if(p.carryId)label(c,'THROW',p.x-5,p.y-21);}
  const g=w.giant;if(g.x>cameraX-100&&g.x<cameraX+350){rect(c,g.x,w.floorY-190,65,190,'#526577');rect(c,g.x-10,w.floorY-180,85,48,'#7a8e99');rect(c,g.x+40,w.floorY-166,23,7,'#ef9e7e');for(let j=0;j<3;j++)rect(c,g.x+8+j*17,w.floorY-116,8,65,'#253b50');}
  const f=w.finish;rect(c,f.x,f.y,f.w,f.h,f.locked?'#705552':'#4b8c83');rect(c,f.x+4,f.y+4,f.w-8,f.h-4,'#193d48');rect(c,f.x+6,f.y+5,f.w-12,3,f.locked?'#d48b70':'#a4e6c0');label(c,f.locked?'LOCKED':'EXIT',f.x,f.y-6);
  for(const e of state.reducedEffects||state.reducedMotion?[]:w.breakEffects){const age=tick-e.tick,count=e.kind==='boss'?48:12;for(let i=0;i<count;i++){const a=i*2.4,speed=1+i%5*.35,dx=Math.cos(a)*age*speed*.45,dy=Math.sin(a)*age*.7+age*age*.012;rect(c,e.x+dx,e.y+dy,e.kind==='boss'?4:2,e.kind==='boss'?4:2,['#d6b57b','#8ba2ad','#e5845f','#f3d69d'][i%4]);}}
  c.restore();
  if(b&&!b.solved&&b.phase!=='waiting'){rect(c,95,5,130,10,'#182637');if(b.kind==='climber'){rect(c,98,8,124*b.hp/b.maxHp,4,'#de8772');label(c,'WARDEN',139,22);}else label(c,b.kind==='chainsaw'?'CHAINSAW — RUN >':b.phase==='escape'?'< RUN LEFT':'RISING LAVA — CLIMB',103,12);}
}
