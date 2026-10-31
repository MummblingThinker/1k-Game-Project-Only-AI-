const r=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
const line=(c,x,y,x2,y2,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x),Math.round(y));c.lineTo(Math.round(x2),Math.round(y2));c.stroke();};
function crown(c,x,y,size,color){for(let i=0;i<5;i++){const dx=(i-2)*size*.22,dy=(i%2)*size*.1;r(c,x+dx-size*.3,y+dy,size*.6,size*.3,color);r(c,x+dx-size*.22,y+dy-size*.12,size*.44,size*.42,color);}}

let transitionCanvas;
const transitionPalettes={forest:['#102c33','#234840'],city:['#182239','#263c55'],factory:['#171f2e','#293949']};
export function drawLandscape(c,w,biome,P,cameraX,cy,t,reduced){
  if(w.id!==11||!w.coveredWay)return landscapeLayer(c,w,biome,P,cameraX,cy,t,reduced);
  const passage=w.coveredWay,clamp=n=>Math.max(0,Math.min(1,n));
  const city=clamp((cameraX-passage.x+400)/700),factory=clamp((cameraX-passage.x-150)/Math.max(1,passage.w-150));
  landscapeLayer(c,w,'forest',transitionPalettes.forest,cameraX,cy,t,reduced);
  transitionCanvas??=Object.assign(document.createElement('canvas'),{width:320,height:180});
  const layer=transitionCanvas.getContext('2d');
  for(const [zone,alpha] of [['city',city],['factory',factory]])if(alpha>0){
    landscapeLayer(layer,w,zone,transitionPalettes[zone],cameraX,cy,t,reduced);
    c.save();c.globalAlpha=alpha;c.drawImage(transitionCanvas,0,0);c.restore();
  }
}

function landscapeLayer(c,w,biome,P,cameraX,cy,t,reduced){
  const sky=c.createLinearGradient(0,0,0,180);sky.addColorStop(0,P[0]);sky.addColorStop(.65,biome==='forest'?'#496360':'#3c5260');sky.addColorStop(1,'#a08a6c');c.fillStyle=sky;c.fillRect(0,0,320,180);
  // Warm sky openings echo the comic palette without recycling its pictures.
  c.globalAlpha=.18;r(c,220-cameraX*.015,21,35,35,'#eed49d');r(c,216-cameraX*.015,27,43,23,'#eed49d');c.globalAlpha=1;
  for(let i=0;i<8;i++){const x=((i*79-cameraX*.035)%520+520)%520-80,y=18+i%3*11;r(c,x,y,52+i%2*32,3,'#748182');r(c,x+12,y-3,31,3,'#748182');}
  for(let layer=0;layer<3;layer++){
    const parallax=[.08,.18,.32][layer],spacing=layer===0?53:77,color=layer===0?'#344852':layer===1?P[1]:'#203944';
    for(let i=-2;i<9;i++){
      const index=i+Math.floor(cameraX*parallax/spacing),x=i*spacing-(cameraX*parallax%spacing),top=34+((index*29+w.id*7)%46)+layer*8-cy*.015;
      if(biome==='city'){
        const bw=31+(index*13%22);r(c,x,top,bw,180,color);r(c,x+4,top-5,bw-8,5,color);
        if(index%3===0){r(c,x+10,top-18,16,13,color);r(c,x+8,top-20,20,3,color);r(c,x+12,top-28,1,8,color);}
        if(index%3===1){r(c,x+8,top-10,3,10,color);line(c,x+2,top-7,x+19,top-7,'#587071');}
        for(let yy=top+8;yy<180;yy+=13)for(let xx=x+5;xx<x+bw-5;xx+=9)r(c,xx,yy,3,4,(Math.floor(xx+yy)+index)%5===0?'#b59d72':'#52686d');
        if(layer===2&&i%2===0){line(c,x+20,top+30,x+spacing,top+48,'#4b6468');r(c,x+17,top+28,3,60,'#4b6468');}
      }else if(biome==='forest'){
        r(c,x+17,top,8+layer*3,180,color);line(c,x+20,top+35,x-3,top+13,color,4);line(c,x+22,top+55,x+52,top+29,color,4);
        crown(c,x+19,top-3,55+layer*12,layer===0?'#48675e':layer===1?'#345c50':'#264c43');
        if(layer===2)for(let j=0;j<4;j++)r(c,x+21+j%2*3,top+29+j*24,2,10,'#49655a');
      }else{
        r(c,x,top,45,180,color);r(c,x+6,top-14,8,14,color);r(c,x+29,top-23,11,23,color);
        for(let yy=top+10;yy<180;yy+=23){r(c,x+5,yy,35,2,'#52646a');for(let xx=0;xx<4;xx++)r(c,x+7+xx*8,yy+5,4,6,(index+xx)%3?'#445b62':'#b68c60');}
        if(layer===2){r(c,x+48,top+20,5,150,'#596b70');r(c,x+45,top+18,11,4,'#748285');line(c,x+45,top+40,x+74,top+40,'#768080');}
        if(!reduced&&layer===0){const drift=t*.004%25;c.globalAlpha=.12;r(c,x+27-drift*.15,top-33-drift,17+drift*.3,7,'#d3c9ac');c.globalAlpha=1;}
      }
    }
  }
  const haze=c.createLinearGradient(0,120,0,180);haze.addColorStop(0,'#b8b08b00');haze.addColorStop(1,'#b8b08b22');c.fillStyle=haze;c.fillRect(0,110,320,70);
}

export function drawFacade(c,s,biome){
  const x=s.x,y=s.y,bottom=y+s.h;
  if(s.kind==='canopy'){
    r(c,x+12,y+5,10,s.h,'#2b4b40');r(c,x+s.w-26,y+5,8,s.h,'#2b4b40');
    for(let j=0;j<4;j++){line(c,x+17,y+35+j*15,x+45+j*10,y+11,'#355746',3);crown(c,x+20+j*s.w/4,y-8,42,'#345b48');}
    for(let yy=y+35;yy<bottom;yy+=25)r(c,x+15,yy,2,9,'#49654d');return;
  }
  // Flat, low-contrast masonry sits behind the continuous lit pavement.
  r(c,x,y+8,s.w,s.h-8,biome==='factory'?'#283d46':s.kind==='cabin'?'#34473d':'#2d424c');
  for(let row=0;row<s.h/13;row++)for(let bx=x+((row%2)*12);bx<x+s.w;bx+=25)r(c,bx,y+10+row*13,22,1,'#3a5056');
  if(s.kind==='cabin'){
    for(let yy=y+14;yy<bottom;yy+=9)r(c,x+4,yy,s.w-8,1,'#55604a');
  }
  for(let xx=x+22;xx<x+s.w-18;xx+=39)for(let yy=y+23;yy<bottom-36;yy+=35){
    r(c,xx-2,yy-2,19,23,'#233842');r(c,xx,yy,15,19,'#4e6666');r(c,xx+2,yy+2,11,14,'#897e5e');r(c,xx+7,yy,1,19,'#334c51');r(c,xx,yy+9,15,1,'#334c51');r(c,xx-3,yy+21,21,2,'#536b6c');
  }
  const door=x+s.w*.6;r(c,door,bottom-31,20,31,'#172e38');r(c,door+3,bottom-28,14,25,'#344d54');r(c,door+13,bottom-14,2,2,'#b99d6d');
  r(c,x+5,bottom-3,s.w-10,3,'#607473'); // uninterrupted walkway in front
  for(let xx=x+12;xx<x+s.w-5;xx+=34){r(c,xx,bottom+7,23,1,'#8b9280');r(c,xx+25,bottom+5,1,7,'#475b60');}
  if(biome==='factory'){r(c,x+s.w-17,y+17,5,s.h-19,'#4d676c');for(let yy=y+21;yy<bottom;yy+=23)r(c,x+s.w-20,yy,11,3,'#708482');}
}

export function drawSurface(c,s,P,biome,cameraX,cy){
  const x=s.x,y=s.y,bridge=s.kind?.includes('bridge'),wood=['canopy','maze-tree','branch','cabin','fallen-tree'].includes(s.kind);
  if(!s.kind){
    const left=Math.max(x,cameraX-8),right=Math.min(x+s.w,cameraX+328);
    r(c,left,y,right-left,s.h,biome==='forest'?'#463f32':biome==='city'?'#283b43':'#253e48');
    r(c,left,y,right-left,3,biome==='forest'?'#8da56b':biome==='city'?'#a7b6a6':'#94a9a2');
    if(biome==='forest'){
      r(c,left,y+3,right-left,5,'#66734b');
      for(let xx=Math.floor(left/17)*17;xx<right;xx+=17){
        r(c,xx+3,y-3-xx%3,1,5,'#abc480');r(c,xx+7,y-1,2,3,'#78945e');
        for(let j=0;j<4;j++){const yy=y+13+j*13+(xx%7);r(c,xx+(j*7%13),yy,3+j%3,2,j%2?'#74684b':'#5a513a');}
        if(xx%51===0){line(c,xx,y+6,xx+9,y+24,'#99815a',2);line(c,xx+9,y+24,xx+24,y+29,'#99815a');}
      }
    }else{
      for(let xx=Math.floor(left/24)*24;xx<right;xx+=24){r(c,xx,y+5,20,2,biome==='city'?'#6f8486':'#587781');r(c,xx+21,y+2,1,8,'#3b535b');if(biome==='factory'){r(c,xx+4,y+13,14,2,'#42636c');r(c,xx+4,y+18,14,2,'#42636c');r(c,xx+1,y+32,2,2,'#96a497');}}
      r(c,left,y+36,right-left,3,biome==='city'?'#495d61':'#6b7b72');r(c,left,y+41,right-left,2,'#172f3a');
    }
    return;
  }
  if(bridge){
    // Riveted decks, load-bearing triangles and guardrails; the bright deck
    // line is the collision surface, while the rails sit behind the players.
    r(c,x,y,s.w,8,biome==='forest'?'#785e42':'#294550');r(c,x,y,s.w,2,'#e5c689');r(c,x,y+2,s.w,2,biome==='forest'?'#af9461':'#7d9e9c');
    for(let xx=x+4;xx<x+s.w-3;xx+=12){r(c,xx,y+4,8,2,'#4e7078');r(c,xx+3,y,1,1,'#f7ddb0');}
    for(let xx=x;xx<x+s.w;xx+=36){r(c,xx,y-16,2,16,'#6f8987');line(c,xx,y-15,Math.min(xx+36,x+s.w),y-15,'#96aba0');line(c,xx,y+9,Math.min(xx+18,x+s.w),y+23,'#43616b',2);line(c,Math.min(xx+18,x+s.w),y+23,Math.min(xx+36,x+s.w),y+9,'#43616b',2);}
    return;
  }
  r(c,x-1,y-1,s.w+2,s.h+2,'#102a32');r(c,x,y,s.w,s.h,wood?'#745b3f':P[2]);r(c,x,y,s.w,2,wood?'#d4bb7c':P[3]);r(c,x,y+2,s.w,1,wood?'#968d59':'#748f94');
  if(s.h>20){
    r(c,x,y+3,2,s.h-3,wood?'#b49662':'#79928f');r(c,x+s.w-3,y+3,3,s.h-3,'#263c42');
    if(wood){for(let xx=x+6;xx<x+s.w-3;xx+=7){r(c,xx,y+7,2,Math.max(3,s.h-12),'#a18352');for(let yy=y+12;yy<y+s.h-4;yy+=23)r(c,xx+1,yy,3,5,'#493d2f');}r(c,x-3,y+s.h-6,s.w+6,6,'#5c5e3d');}
    else for(let yy=y+9;yy<Math.min(y+s.h,cy+182);yy+=15)for(let xx=Math.max(x+5,cameraX-10);xx<x+s.w-4&&xx<cameraX+330;xx+=27){r(c,xx,yy,22,1,'#68797a');r(c,xx+22,yy,1,12,'#324c55');}
  }else if(s.kind&&s.kind!=='teammate')for(let xx=x+4;xx<x+s.w-2;xx+=17)r(c,xx,y+5,2,1,'#bad0bd');
  if(!s.kind){for(let xx=Math.max(x,cameraX-5);xx<Math.min(x+s.w,cameraX+325);xx+=23){r(c,xx,y+5,17,1,biome==='forest'?'#87956a':'#9aa495');if(biome==='forest'){r(c,xx+3,y-3,1,4,'#a4b879');r(c,xx+6,y-2,1,3,'#859b61');}}}
}
