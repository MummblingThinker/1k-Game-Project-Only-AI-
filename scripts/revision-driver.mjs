// A controller that only reads snapshots and emits ordinary player inputs/actions.
// No teleports, disabled enemies, extra hearts, or private server endpoints.
const browserMemos=new Map();
export function revisionIntent(s){
  if(!s?.you||s.phase!=='playing')return{input:{}};
  const key=[s.you.id,s.runId,s.level].join(':');
  if(!browserMemos.has(key))browserMemos.set(key,{});
  if(browserMemos.size>100)browserMemos.delete(browserMemos.keys().next().value);
  return driveRevision(s,s.you,browserMemos.get(key));
}
export function driveRevision(state,p,memo={}){
  const w=state.world,b=w.boss,t=state.tick;
  if(!p?.alive)return {input:{}};
  if(b?.kind==='foundry'&&b.phase!=='waiting'&&!b.solved){
    const go=x=>({input:{left:p.x>x+3,right:p.x<x-3}}),near=o=>Math.abs(p.x+p.w/2-o.x-o.w/2)<26&&Math.abs(p.y+p.h/2-o.y-o.h/2)<30;
    if((b.attack==='warning'||b.attack==='strike')&&b.weapon==='low'){
      if(p.climbing)return{input:{up:true}};
      return{input:{jump:p.onGround&&(b.attack==='strike'||b.attackTimer<=20)}};
    }
    if((b.attack==='warning'||b.attack==='strike')&&b.weapon==='high'){
      if(p.y>w.floorY-60||p.y+p.h<w.floorY-85)return{input:{}};
      if(p.climbing)return{input:{down:true}};
      const l=w.ladders.filter(l=>l.y<=p.y+p.h&&l.y+l.h>p.y+p.h+2).sort((a,c)=>Math.abs(a.x-p.x)-Math.abs(c.x-p.x))[0];
      if(l){if(Math.abs(p.x-l.x)<10)return{input:{down:true}};return go(l.x);}
      return go(b.x+270);
    }
    const danger=(b.attack==='warning'||b.attack==='strike')&&b.weapon==='slam'?b.attackX:b.attack==='head-warning'||b.attack==='head-slam'?b.head.x+b.head.w/2:null;
    if(danger!=null){if(Math.abs(p.x+p.w/2-danger)<85)return go(Math.max(b.x+35,Math.min(b.x+610,danger+(danger>b.x+300?-100:100))));return{input:{}};}
    const scan=w.enemies.find(e=>e.arena&&!e.dead&&!e.stunned&&(e.phase==='attack'||e.phase==='warning'&&e.timer<40)&&Math.abs(p.x-e.targetX)<34&&p.y>e.y&&p.y<e.y+150);
    if(scan){memo.finalDodgeX=Math.max(b.x+35,Math.min(b.x+600,scan.targetX+(scan.targetX>b.x+300?-65:65)));memo.finalDodgeUntil=t+scan.timer+(scan.phase==='warning'?18:0)+5;}
    if(memo.finalDodgeUntil>t)return go(memo.finalDodgeX);
    if(p.y+p.h<w.floorY-4){
      if(p.climbing)return{input:{down:true}};
      const l=w.ladders.filter(l=>l.y<=p.y+p.h+2&&l.y+l.h>p.y+p.h+2).sort((a,c)=>Math.abs(a.x-p.x)-Math.abs(c.x-p.x))[0];
      if(l){if(Math.abs(p.x-l.x)<10)return{input:{down:true}};return go(l.x);}
    }
    if(b.attack==='exposed'){
      const h=b.head;
      if(p.carryId){const dx=h.x+h.w/2-p.x-p.w/2;if(Math.abs(dx)>110)return go(h.x-50);const face=dx>=0?1:-1;if(p.face!==face)return{input:{right:face>0,left:face<0}};return{input:{},action:'carry'};}
      // A clear head can also be stomped using an ordinary jump.
      if(!w.platforms.some(s=>s.x<h.x+h.w&&s.x+s.w>h.x&&s.y<h.y&&s.y>h.y-80)){
        const cmd=go(h.x+h.w/2-p.w/2);cmd.input.jump=p.onGround&&Math.abs(p.x-h.x)<55;return cmd;
      }
    }
    if(!p.carryId){
      const ammo=w.crates.filter(c=>!c.used&&!c.carriedBy&&c.x>=b.x&&Math.abs(c.y+c.h-w.floorY)<16).sort((a,c)=>Math.abs(a.x-p.x)-Math.abs(c.x-p.x))[0];
      if(ammo){if(near(ammo))return{input:{},action:'use'};return go(ammo.x-12);}
    }
    if(p.climbing)return{input:{down:true}};
    return go(b.x+270);
  }
  // React only to visible, fixed warning markers; no immunity or hidden-state edits.
  if(b?.kind==='climber'&&!b.solved&&b.phase!=='waiting'){
    if(b.attack==='laser-strike'||b.attack==='laser-warning'){
      const line=b.attackY;
      if(p.climbing)return {input: p.y>line+8?{}:{up:true}};
      if(!p.onGround&&w.ladders.some(l=>Math.abs(p.x-l.x)<13&&p.y+p.h>=l.y&&p.y<l.y+l.h))return{input:{up:true}};
      if(p.onGround){
        if(p.y>line+8||p.y+p.h<line-8)return{input:{}};
        return{input:{jump:b.attack==='laser-strike'||b.attackTimer<=20}};
      }
      const safe=w.platforms.filter(s=>s.y<line-8&&s.y>=p.y+p.h-10&&s.x>=b.x).sort((a,c)=>Math.abs(Math.max(a.x,Math.min(a.x+a.w-p.w,p.x))-p.x)-Math.abs(Math.max(c.x,Math.min(c.x+c.w-p.w,p.x))-p.x))[0];
      if(safe)return{input:{left:p.x>safe.x+safe.w-p.w-2,right:p.x+p.w<safe.x+2}};
      return{input:{}};
    }
    const dodge=(x,duration)=>{
      const goLeft=p.x+p.w/2<x || Math.abs(p.x+p.w/2-x)<6&&x>b.x+220;
      memo.evadeX=Math.max(b.x+45,Math.min(b.x+370,x+(goLeft?-65:65)));
      memo.evadeUntil=t+duration;
      return{input:{left:p.x>memo.evadeX+3,right:p.x<memo.evadeX-3,jump:!!p.climbing}};
    };
    if(memo.evadeUntil>t)return{input:{left:p.x>memo.evadeX+3,right:p.x<memo.evadeX-3,jump:!!p.climbing}};
    if(b.attack?.startsWith('claw')&&Math.abs(p.x+p.w/2-b.attackX)<45&&Math.abs(p.y+p.h/2-b.attackY)<48)return dodge(b.attackX,b.attackTimer+(b.attack.endsWith('warning')?18:0)+8);
    if(b.attack==='laser-warning'&&b.attackTimer<=20&&Math.abs(p.y+p.h/2-b.attackY)<30){
      if(p.climbing)return{input:{up:true}};
      if(p.onGround)return{input:{jump:true}};
    }
    const scan=w.enemies.find(e=>e.arena&&!e.dead&&e.stunned<=0&&(e.phase==='attack'||e.phase==='warning'&&e.timer<40)&&Math.abs(p.x-e.targetX)<34&&p.y>e.y&&p.y<e.y+150);
    if(scan)return dodge(scan.targetX,scan.timer+(scan.phase==='warning'?18:0)+8);
  }
  if(p.climbing)return {input:{up:true}};
  const command={input:{right:true,left:false,jump:false}};
  if(b?.phase==='warning'&&b.timer<16&&p.onGround&&Math.abs(p.x-b.targetX)<30&&Math.abs(p.y-b.targetY)<50)command.input.jump=true;
  const moveTo=x=>{command.targetX=x;command.input.right=p.x<x-3;command.input.left=p.x>x+3;if(p.onGround&&w.platforms.some(s=>!s.oneWay&&p.y+p.h>s.y+3&&p.y+p.h-s.y<68&&(command.input.right?s.x>=p.x+p.w-2&&s.x<p.x+p.w+26:s.x+s.w<=p.x+2&&s.x+s.w>p.x-26)))command.input.jump=true;};
  const feet=p.y+p.h; if(p.onGround)memo.groundedFeet=feet; const routeFeet=memo.groundedFeet??feet;
  const near=(o,d=26)=>Math.abs(p.x+p.w/2-o.x-o.w/2)<d&&Math.abs(p.y+p.h/2-o.y-o.h/2)<30;
  const sw=w.switches.find(s=>!s.active&&near(s));
  if(sw){command.action='use';return command;}
  const plate=w.plates.find(s=>p.x>s.x-130&&p.x<s.bridgeX+10);
  // A ground-floor plate must not override rooftop obstacle/ladder routing.
  // Otherwise the controller walks into a roof prop while chasing a weight
  // 180 units below it, without ever asking for an ordinary jump.
  if(plate&&Math.abs(feet-plate.y)<100){
    const weight=w.crates.find(c=>c.plateId===plate.id);
    const placed=w.crates.some(c=>!c.used&&!c.carriedBy&&c.x+c.w>plate.x&&c.x<plate.x+plate.w&&Math.abs(c.y+c.h-plate.y)<2);
    if(!placed&&weight){
      if(memo.placementUntil>t)return{input:{}};
      if(weight.carriedBy&&weight.carriedBy!==p.id)return{input:{left:p.x>plate.x-85-(p.slot||0)*18}};
      if(!weight.carriedBy&&(weight.vy>0||weight.y+weight.h<plate.y-16)&&weight.x+weight.w>plate.x&&weight.x<plate.x+plate.w&&weight.y+weight.h<plate.y)return{input:{}};
      if(p.carryId===weight.id){moveTo(plate.x-15);if(p.face>0&&p.x>plate.x-22&&p.x<plate.x-6){command.input={};command.action='drop';memo.placementUntil=t+25;}else if(p.face<0&&p.x>plate.x-18&&p.x<plate.x-12)command.input={right:true};return command;}
      if(p.carryId){command.input={};command.action='carry';return command;}
      moveTo(weight.x-12);if(near(weight,25)){command.input={};command.action='use';}return command;
    }
  }
  if(!b||b.phase==='waiting'){
    const target=w.enemies.find(e=>!e.dead&&e.stunned<=0&&e.x>p.x+25&&e.x<p.x+140&&Math.abs(e.y-p.y)<38);
    const prop=w.crates.find(c=>!c.used&&!c.carriedBy&&!c.durable&&near(c));
    if(!p.carryId&&prop){command.action='use';return command;}
    if(p.carryId&&target&&target.x-p.x<78&&p.face>0){command.action='carry';return command;}
  }
  if(b&&b.phase!=='waiting'&&!b.solved){
    if(b.kind==='foundry'&&['escape','breach'].includes(b.phase))moveTo(w.finish.x+5);
    else if(b.kind==='foundry'||b.kind==='climber'){
      if(b.kind==='foundry'){
        const core=b.pylons.find(s=>!s.active);
        if(core&&feet<core.y+core.h-12){
          // A jump can reach the next ladder before stopping at a console.
          // Return by walking off the tier edge, then steering onto its floor.
          if(p.x>b.x+386||memo.droppingCore===core.id){memo.droppingCore=core.id;command.input={};if(feet>core.y+core.h-60)moveTo(core.x);}
          else moveTo(b.x+395);
          return command;
        }
        memo.droppingCore=null;
        if(core&&Math.abs(feet-(core.y+core.h))<12){moveTo(core.x);if(near(core)){command.action='use';}return command;}
      }
      const ladders=w.ladders.filter(l=>l.x>=b.x&&l.y<routeFeet-3&&l.y+l.h>=routeFeet-1).sort((a,c)=>c.y-a.y||Math.abs(a.x-p.x)-Math.abs(c.x-p.x));
      const l=ladders[0];if(l)moveTo(l.x);
      if(b.kind==='climber'){
        const c=w.crates.find(c=>!c.used&&!c.carriedBy&&near(c));
        if(!p.carryId&&c){command.action='use';return command;}
        if(!p.carryId&&p.onGround&&feet<w.floorY-140){
          const supply=w.crates.filter(c=>!c.used&&!c.carriedBy&&Math.abs(c.y+c.h-feet)<12&&c.x>=b.x+35&&c.x<b.x+385).sort((a,c)=>Math.abs(a.x-p.x)-Math.abs(c.x-p.x))[0];
          if(supply){moveTo(supply.x-12);return command;}
        }
        if(p.carryId&&feet<w.floorY-140){moveTo(b.bodyX-65);if(p.face>0&&Math.abs(p.x-(b.bodyX-65))<18&&Math.abs(p.y-b.bodyY)<55){command.action='carry';return command;}}
      }
    }
  }else if(b?.solved){
    moveTo(w.finish.x+5);
    if(w.finish.y<p.y-40){const l=w.ladders.filter(l=>l.x>=b.x&&l.y<routeFeet-3&&l.y+l.h>=routeFeet-1).sort((a,c)=>c.y-a.y)[0];if(l)moveTo(l.x);}
  }else if(!b&&p.x>w.finish.x-20)moveTo(w.finish.x+4);
  const dir=command.input.left?-1:1;
  const ladder=w.ladders.find(l=>Math.abs(p.x+p.w/2-l.x-l.w/2)<12&&feet>=l.y+8&&feet<=l.y+l.h+4&&p.y<l.y+l.h&&
    // Only climb when the solid ahead is taller than a jump, or a boss is active.
    (b&&b.phase!=='waiting'||(w.facades||[]).some(s=>s.x<=l.x&&s.x+s.w>l.x&&p.y>s.y-10&&Math.abs(p.x-s.x)<30)));
  if(ladder&&(command.targetX==null||Math.abs(ladder.x-command.targetX)<20)&&!(b?.kind==='climber'&&!b.solved&&p.carryId&&feet<w.floorY-140)){command.input={up:true};return command;}
  const ahead=o=>dir>0?o.x>=p.x+p.w-3&&o.x<p.x+p.w+26:o.x+o.w<=p.x+3&&o.x+o.w>p.x-26;
  const obstacle=[...w.platforms,...w.crates.filter(c=>!c.used&&!c.carriedBy)].find(s=>ahead(s)&&feet>s.y+3&&p.y<s.y+s.h);
  const climbStep=b&&b.phase!=='waiting'&&['climber','foundry'].includes(b.kind)&&w.platforms.find(s=>s.kind==='boss-step'&&s.y<feet-5&&s.y>feet-74&&ahead(s));
  const threat=w.enemies.find(e=>!e.dead&&e.stunned<=0&&e.x+e.w>p.x-12&&e.x-(p.x+p.w)<(e.size==='big'?(e.dir<0?22:12):(e.dir<0?34:16))&&Math.abs(e.y+e.h-feet)<35);
  if(p.onGround&&(obstacle||threat||climbStep))command.input.jump=true;
  if(p.onGround&&b&&['climber','foundry'].includes(b.kind)&&!['waiting','escape','breach'].includes(b.phase)){
    const support=w.platforms.find(s=>Math.abs(feet-s.y)<2&&p.x+p.w>s.x&&p.x<s.x+s.w);
    if(support&&(dir>0?support.x+support.w-p.x<25:p.x-support.x<15))command.input.jump=true;
  }
  if(!p.onGround&&obstacle&&t%12===0)command.input.jump=true;
  // Do not land on heavy armor after jumping over nearby loose debris.
  if(!p.onGround&&p.vy>=0){
    const heavy=w.enemies.find(e=>e.size==='big'&&!e.dead&&e.stunned<=0&&feet<e.y+4&&feet>e.y-65&&p.x+p.w+24>e.x&&p.x-24<e.x+e.w);
    if(heavy){const right=p.x+p.w/2>heavy.x+heavy.w/2;command.input.right=right;command.input.left=!right;}
  }
  if(b?.kind==='chainsaw'&&b.phase!=='waiting'){
    command.input.right=true;
    // Jump from branch edges instead of dropping into the saw's ground lane.
    // On the last stretch, keep clear of a close pursuer with an ordinary jump.
    const ledge=w.platforms.find(s=>Math.abs(feet-s.y)<2&&p.x+p.w>s.x&&p.x<s.x+s.w&&s.x+s.w-p.x<26);
    if(p.onGround&&(ledge||(!b.solved&&b.bodyX+b.bodyW+70>p.x)))command.input.jump=true;
  }
  return command;
}
