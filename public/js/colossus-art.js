const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
const text=(c,s,x,y,color='#f8d99c')=>{c.font='6px monospace';c.fillStyle='#071521';c.fillText(s,x+1,y+1);c.fillStyle=color;c.fillText(s,x,y);};
function head(c,x,y,w=64,h=42,exposed=false){
 const center=x+Math.round(w/2),eye=exposed?'#91baad':'#fa9675';
 r(c,x,y,w,h,'#203b4c');r(c,x+2,y+2,w-4,h-4,'#637e91');r(c,x+4,y+3,w-8,7,'#a4b8bc');
 r(c,x+5,y+12,w-10,10,'#304a5c');r(c,x+7,y+14,15,5,eye);r(c,x+w-22,y+14,15,5,eye);
 r(c,x+4,y+22,3,h-29,'#839ba5');r(c,x+w-7,y+22,3,h-29,'#839ba5');
 for(const bx of [x+5,x+w-8]){r(c,bx,y+5,3,3,'#d0d9ce');r(c,bx,y+h-8,3,3,'#304a5c');}
 for(let j=0;j<3;j++){r(c,x+9,y+25+j*4,8,2,'#314d5f');r(c,x+w-17,y+25+j*4,8,2,'#314d5f');}
 r(c,center-14,y+22,28,16,'#294859');r(c,center-11,y+24,22,12,exposed?'#6a9d98':'#526f78');
 r(c,center-6,y+25,12,9,exposed?'#b7ffdc':'#eeae71');
 if(exposed){r(c,center-9,y+28,3,3,'#d9ffe5');r(c,center+6,y+28,3,3,'#d9ffe5');}
 r(c,x+9,y+h-5,w-18,3,'#364f63');r(c,center-7,y+h-4,14,1,'#8aa3a8');
}
export function drawColossusBackground(c,w,cameraX,cy,t){
 const b=w.boss;if(b?.kind!=='foundry'||b.solved)return;
 const x=cameraX+135,y=cy+17,signal=['warning','strike','head-warning','head-slam'].includes(b.attack)?'#efba83':'#8ac2bc';
 c.save();c.globalAlpha=.82;
 r(c,x-40,y+50,170,126,'#293d52');r(c,x-25,y+56,140,85,'#476276');r(c,x-48,y+66,21,80,'#6c8390');r(c,x+116,y+66,21,80,'#6c8390');
 r(c,x-38,y+52,166,4,'#788e99');r(c,x-53,y+63,26,30,'#294353');r(c,x+116,y+63,26,30,'#294353');
 r(c,x-49,y+67,18,21,'#8199a2');r(c,x+120,y+67,18,21,'#8199a2');
 for(const sx of [x-43,x+126]){r(c,sx,y+73,6,7,'#304d5c');r(c,sx+1,y+74,4,3,signal);}
 for(let j=0;j<5;j++){r(c,x-19+j*28,y+66,16,3,'#90a5a6');r(c,x-17+j*28,y+73,12,48,'#213c4b');}
 r(c,x-21,y+59,131,3,signal);r(c,x-21,y+124,131,4,'#718a94');
 for(let i=0;i<4;i++){r(c,x-15+i*37,y+128,4,4,'#a7b8b4');r(c,x-24+i*43,y+55,3,3,'#c0cdbe');}
 r(c,x+20,y+83,50,40,'#8a704e');r(c,x+27,y+90,36,26,'#e7a96a');r(c,x+32,y+95,26,16,'#6f4d3e');
 if(!b.head)head(c,x+12,y,68,49,false);else{r(c,x+34,y+33,22,24,'#18313e');r(c,x+39,y+37,12,16,'#d89961');}
 c.restore();
}
export function drawColossusAttacks(c,w,player){
 const b=w.boss;if(b?.kind!=='foundry'||b.solved)return;
 if(b.attack==='warning'||b.attack==='strike'){
  const strike=b.attack==='strike',color=strike?'#ffd6a0':'#ed8e70';
  if(b.weapon==='slam'){
   const x=b.attackX-27,y=w.floorY-160;
   if(strike){r(c,x,y,54,160,'#536f80');r(c,x+5,y,4,117,'#a2b3b2');r(c,x+45,y,4,117,'#a2b3b2');for(let k=0;k<4;k++)r(c,x+13,y+12+k*25,27,5,'#2d4c5b');for(let j=0;j<4;j++)r(c,x+3+j*13,w.floorY-38,10,38,'#a4b5b4');r(c,x+4,w.floorY-44,46,6,color);}
   else{for(let yy=y;yy<w.floorY;yy+=12){r(c,x,yy,2,7,color);r(c,x+52,yy,2,7,color);}r(c,x,w.floorY-3,54,3,color);text(c,'FIST - MOVE!',x-5,w.floorY-55);}
  }else{
   const y=w.floorY-(b.weapon==='low'?14:77);
   if(strike){r(c,b.x,y,640,14,'#6e8796');r(c,b.x,y,640,3,color);for(let xx=b.x+5;xx<b.x+640;xx+=28){r(c,xx,y+4,17,7,'#2b495c');r(c,xx+3,y+5,2,2,'#b7c5be');}}
   else for(let xx=b.x;xx<b.x+640;xx+=14)r(c,xx,y+5,8,2,color);
   text(c,b.weapon==='low'?'LOW SWEEP - JUMP!':'HIGH SWEEP - STAY LOW!',player.x-35,y-7);
  }
 }
 if(b.head){
  const h=b.head,warning=b.attack==='head-warning',strike=b.attack==='head-slam',exposed=b.attack==='exposed';
  if(warning){for(let yy=w.floorY-170;yy<w.floorY;yy+=14){r(c,h.x-2,yy,2,8,'#f3b577');r(c,h.x+h.w,yy,2,8,'#f3b577');}text(c,'HEAD FALLING - MOVE!',h.x-22,w.floorY-60);}
  const y=warning?h.y-180*b.attackTimer/90:b.attack==='retreat'?h.y-180*(1-b.attackTimer/90):h.y;
  head(c,h.x,y,h.w,h.h,exposed);
  if(exposed){text(c,'STOMP / THROW',h.x-6,y-8,'#a9efcc');r(c,h.x+27,y-3,10,3,'#b8f0cd');}
  if(strike)r(c,h.x-12,w.floorY-5,h.w+24,5,'#efb876');
 }
 r(c,b.x+660,w.floorY-95,6,95,'#6c5a4c');text(c,'LOCKED',b.x+648,w.floorY-99);
}
