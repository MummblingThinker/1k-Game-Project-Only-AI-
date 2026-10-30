// Original pixel frames, cached once. Pose choice reads authoritative state only.
export const ROBOT_KINDS = ['grabber','sentinel','scanner','creeper'];
export const ROBOT_POSES = ['patrol','warning','attack','grab','stunned','recover'];
export const ROBOT_TILE = 48;
let sheet;
export function robotPose(enemy) {
  if(enemy.stunned>0)return 'stunned';
  if(enemy.grabbedId)return 'grab';
  return ROBOT_POSES.includes(enemy.phase)?enemy.phase:'patrol';
}
function pixels(ctx,kind,pose,frame,x,y) {
  const ink='#142235', steel='#8195a1', dark='#405a70', light='#bac6c5';
  const warning=pose==='warning',attack=pose==='attack',rest=pose==='recover'||pose==='stunned';
  const eye=rest?'#81b8bd':warning?'#f4d081':attack?'#fff1c1':'#ec7868';
  const stride=pose==='patrol'?[0,2,0,-2][frame]:0;
  const rect=(a,b,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+a,y+b,w,h);};
  if(kind==='scanner') {
    // Twin nacelles and a hanging lens distinguish flying scan hazards.
    const flap=rest?2:[0,-1,0,1][frame];
    rect(-2,5+flap,7,9,ink);rect(-1,6+flap,5,6,dark);rect(-3,4+flap,9,2,steel);
    rect(15,5-flap,7,9,ink);rect(16,6-flap,5,6,dark);rect(14,4-flap,9,2,steel);
    rect(4,3,12,15,ink);rect(5,4,10,12,steel);rect(6,6,8,7,dark);
    rect(7,rest?10:8,6,rest?1:3,eye);rect(8,8,2,1,light);
    rect(8,17,4,6,dark);rect(7,22,6,3,steel);rect(8,23,4,2,eye);
    if(warning||attack){rect(5,19,2,7,eye);rect(13,19,2,7,eye);}
    if(attack){rect(9,26,2,5,eye);rect(6,28,2,2,eye);rect(12,28,2,2,eye);}
  } else if(kind==='creeper') {
    // Low tracked body; raised vent plates anticipate the blast.
    rect(1,21,18,7,ink);rect(2,22,16,4,dark);
    for(let i=0;i<4;i++)rect(3+i*4+(pose==='patrol'?frame%2:0),24,2,2,steel);
    const lift=warning?2:attack?3:0;
    rect(2,9-lift,16,13,ink);rect(3,10-lift,14,11,steel);
    rect(5,12-lift,10,6,dark);rect(6,14-lift,8,rest?1:2,eye);
    rect(7,5-lift,6,5,ink);rect(8,6-lift,4,2,eye);
    rect(warning?-2:0,12-lift,4,9,dark);rect(warning?18:16,12-lift,4,9,dark);
    if(warning||attack){for(let i=0;i<3;i++)rect(5+i*4,19,2,3,eye);}
    if(attack){rect(-3,8,2,3,eye);rect(21,8,2,3,eye);rect(9,0,2,3,eye);}
  } else {
    const crouch=rest?2:warning?1:0;
    rect(3-stride,21,5,6,ink);rect(12+stride,21,5,6,ink);
    rect(4-stride,22,3,3,dark);rect(13+stride,22,3,3,dark);
    rect(2-stride,26,7,2,steel);rect(11+stride,26,7,2,steel);
    rect(3,8+crouch,14,14,ink);rect(4,9+crouch,12,11,steel);
    rect(6,11+crouch,8,7,dark);rect(8,12+crouch,4,3,eye);
    rect(5,18+crouch,10,2,ink);
    rect(4,1+crouch,12,9,ink);rect(5,2+crouch,10,7,steel);
    rect(6,4+crouch,8,3,dark);rect(7,rest?6+crouch:5+crouch,6,1,eye);
    rect(6,2+crouch,7,1,light);
    if(kind==='grabber') {
      // Open hooked hands are readable before and during a capture.
      const reach=pose==='grab'?6:attack?7:warning?4:1;
      const armY=warning?8:pose==='grab'?11:13+crouch;
      rect(-reach,armY,reach+4,3,dark);rect(16,armY,reach+4,3,dark);
      rect(-reach,armY,2,7,steel);rect(18+reach,armY,2,7,steel);
      rect(-reach,armY+6,4,2,light);rect(16+reach,armY+6,4,2,light);
      rect(8,-1+crouch,4,2,'#c6ad79');
    } else {
      // Sentinel shields wind up beside the head, then extend for a strike.
      const leftY=warning?3:12+crouch,rightY=warning?3:attack?10:12+crouch;
      rect(-1,leftY,5,9,ink);rect(0,leftY+1,3,6,steel);
      rect(16,rightY,attack?10:5,5,ink);rect(17,rightY+1,attack?8:3,3,steel);
      if(!attack){rect(17,rightY+4,4,5,dark);rect(18,rightY+5,2,2,light);}
      rect(2,8+crouch,3,4,light);rect(15,8+crouch,3,4,light);
    }
  }
  if(pose==='stunned') {
    const spark=[0,2,0,-2][frame];rect(1+spark,-5,3,1,'#f4d081');rect(15-spark,-3,3,1,'#f4d081');
  }
}
export function getRobotSheet() {
  if(sheet)return sheet;
  sheet=document.createElement('canvas');sheet.width=ROBOT_POSES.length*4*ROBOT_TILE;sheet.height=ROBOT_KINDS.length*ROBOT_TILE;
  const ctx=sheet.getContext('2d');ctx.imageSmoothingEnabled=false;
  for(let kind=0;kind<ROBOT_KINDS.length;kind++)for(let pose=0;pose<ROBOT_POSES.length;pose++)for(let frame=0;frame<4;frame++)
    pixels(ctx,ROBOT_KINDS[kind],ROBOT_POSES[pose],frame,(pose*4+frame)*ROBOT_TILE+12,kind*ROBOT_TILE+8);
  return sheet;
}
export function drawRobot(ctx,enemy,x,clock=0) {
  const kind=Math.max(0,ROBOT_KINDS.indexOf(enemy.kind)),pose=ROBOT_POSES.indexOf(robotPose(enemy));
  const frame=Math.floor(clock/(enemy.kind==='scanner'?160:140))%4;
  ctx.save();ctx.translate(Math.round(x),Math.round(enemy.y));
  if(enemy.dir<0){ctx.translate(enemy.w,0);ctx.scale(-1,1);}
  ctx.drawImage(getRobotSheet(),(pose*4+frame)*ROBOT_TILE,kind*ROBOT_TILE,ROBOT_TILE,ROBOT_TILE,-12,-8,ROBOT_TILE,ROBOT_TILE);
  ctx.restore();
}
