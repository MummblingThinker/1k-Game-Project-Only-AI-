// A controller that only reads snapshots and emits ordinary player inputs/actions.
// No teleports, disabled enemies, extra hearts, or private server endpoints.
export function driveRevision(state,p,memo={}){
  const w=state.world,b=w.boss,t=state.tick;
  if(!p?.alive)return {input:{}};
  if(p.climbing)return {input:{}};
  const command={input:{right:true,left:false,jump:false}};
  if(b?.phase==='warning'&&b.timer<16&&p.onGround&&Math.abs(p.x-b.targetX)<30&&Math.abs(p.y-b.targetY)<50)command.input.jump=true;
  const moveTo=x=>{command.targetX=x;command.input.right=p.x<x-3;command.input.left=p.x>x+3;};
  const feet=p.y+p.h; if(p.onGround)memo.groundedFeet=feet; const routeFeet=memo.groundedFeet??feet;
  const near=(o,d=26)=>Math.abs(p.x+p.w/2-o.x-o.w/2)<d&&Math.abs(p.y+p.h/2-o.y-o.h/2)<30;
  const sw=w.switches.find(s=>!s.active&&near(s));
  if(sw){command.action='use';return command;}
  if(!b||b.phase==='waiting'){
    const target=w.enemies.find(e=>!e.dead&&e.stunned<=0&&e.x>p.x+25&&e.x<p.x+140&&Math.abs(e.y-p.y)<38);
    const prop=w.crates.find(c=>!c.used&&!c.carriedBy&&!c.durable&&near(c));
    if(!p.carryId&&prop){command.action='carry';return command;}
    if(p.carryId&&target&&target.x-p.x<78&&p.face>0){command.action='carry';return command;}
  }
  if(b&&b.phase!=='waiting'&&!b.solved){
    if(b.kind==='foundry'&&b.phase==='escape')moveTo(w.finish.x+5);
    else if(b.kind==='foundry'||b.kind==='climber'){
      if(b.kind==='foundry'){
        const core=b.pylons.find(s=>!s.active);if(core&&Math.abs(feet-(core.y+core.h))<12){moveTo(core.x);if(near(core)){command.action='use';}return command;}
      }
      const ladders=w.ladders.filter(l=>l.x>=b.x&&l.y<routeFeet-3&&l.y+l.h>=routeFeet-1).sort((a,c)=>c.y-a.y||Math.abs(a.x-p.x)-Math.abs(c.x-p.x));
      const l=ladders[0];if(l)moveTo(l.x);
      if(b.kind==='climber'){
        const c=w.crates.find(c=>!c.used&&!c.carriedBy&&near(c));
        if(!p.carryId&&c){command.action='carry';return command;}
        if(p.carryId&&feet<w.floorY-140){moveTo(b.bodyX-65);if(p.face>0&&Math.abs(p.x-(b.bodyX-65))<18&&Math.abs(p.y-b.bodyY)<55){command.action='carry';return command;}}
      }
    }
  }else if(b?.solved){
    moveTo(w.finish.x+5);
    if(w.finish.y<p.y-40){const l=w.ladders.filter(l=>l.x>=b.x&&l.y<routeFeet-3&&l.y+l.h>=routeFeet-1).sort((a,c)=>c.y-a.y)[0];if(l)moveTo(l.x);}
  }else if(!b&&p.x>w.finish.x-20)moveTo(w.finish.x+4);
  const dir=command.input.left?-1:1;
  const ladder=w.ladders.find(l=>Math.abs(p.x+p.w/2-l.x-l.w/2)<19&&feet>=l.y+8&&feet<=l.y+l.h+4&&p.y<l.y+l.h&&
    // Only climb when the solid ahead is taller than a jump, or a boss is active.
    (b&&b.phase!=='waiting'||w.platforms.some(s=>s.h>50&&s.x<=l.x&&s.x+s.w>l.x&&p.y>s.y-10&&Math.abs(p.x-s.x)<30)));
  if(ladder&&(command.targetX==null||Math.abs(ladder.x-command.targetX)<20)&&!(b?.kind==='climber'&&!b.solved&&p.carryId&&feet<w.floorY-140)){command.input={};command.action='use';return command;}
  const ahead=o=>dir>0?o.x>=p.x+p.w-3&&o.x<p.x+p.w+26:o.x+o.w<=p.x+3&&o.x+o.w>p.x-26;
  const obstacle=[...w.platforms,...w.crates.filter(c=>!c.used&&!c.carriedBy)].find(s=>ahead(s)&&feet>s.y+3&&p.y<s.y+s.h);
  const climbStep=b&&b.phase!=='waiting'&&['climber','foundry'].includes(b.kind)&&w.platforms.find(s=>s.kind==='boss-step'&&s.y<feet-5&&s.y>feet-74&&ahead(s));
  const threat=w.enemies.find(e=>!e.dead&&e.stunned<=0&&e.x+e.w>p.x&&e.x-(p.x+p.w)<(e.dir<0?34:16)&&e.x>p.x&&Math.abs(e.y+e.h-feet)<35);
  if(p.onGround&&(obstacle||threat||climbStep))command.input.jump=true;
  if(p.onGround&&b&&['climber','foundry'].includes(b.kind)&&b.phase!=='waiting'&&b.phase!=='escape'){
    const support=w.platforms.find(s=>Math.abs(feet-s.y)<2&&p.x+p.w>s.x&&p.x<s.x+s.w);
    if(support&&(dir>0?support.x+support.w-p.x<25:p.x-support.x<15))command.input.jump=true;
  }
  if(!p.onGround&&obstacle&&t%12===0)command.input.jump=true;
  if(b?.kind==='chainsaw'&&b.phase!=='waiting')command.input.right=true;
  return command;
}
