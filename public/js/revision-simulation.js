import { stepPlayer, updateCrates, overlaps } from './physics.js';
import { supply, addClimbTier, buildRevisionLevel } from './revision-world.js';
import { recordRunEvent } from './telemetry.js';
import { MEMORY_FRAGMENTS } from './memories.js';
const alive=run=>[...run.players.values()].filter(p=>p.alive);
const near=(p,s,d=28)=>Math.abs(p.x+p.w/2-s.x-s.w/2)<d&&Math.abs(p.y+p.h/2-s.y-s.h/2)<34;
const effect=(w,x,y,tick,kind='debris')=>w.breakEffects.push({x,y,tick,kind});
function breakBlock(run,block){const w=run.world;if(!w.platforms.includes(block))return;w.platforms=w.platforms.filter(s=>s!==block);effect(w,block.x+11,block.y+10,run.tick);supply(w,block.x,block.y+block.h,block.material==='forest'?'stick':block.material==='city'?'brick':'scrap');run.notice='Barrier shattered. Its debris can be picked up and thrown.';}
function unlock(run){run.world.finish.locked=run.world.switches.some(s=>!s.active)||!!(run.world.boss&&!run.world.boss.solved);}
function deadBoss(run){const b=run.world.boss;b.hp=0;b.solved=true;b.phase='dying';b.deathTick=run.tick;effect(run.world,b.bodyX+b.bodyW/2,b.bodyY+b.bodyH/2,run.tick,'boss');run.objectiveVersion++;unlock(run);}

export function interactRevision(run,id,action,{detach,playersOf}){
  const p=run.players.get(id),w=run.world;
  if(!p?.alive||p.carriedBy||p.capture||run.phase!=='playing'||run.tick-(p.lastInteractionTick??-60)<12)return false;
  p.lastInteractionTick=run.tick;
  const usingTerminal=action==='use'&&(w.switches.some(s=>!s.active&&near(p,s))||w.boss?.pylons.some(s=>!s.active&&near(p,s)));
  if(p.carryId&&!usingTerminal){detach(run,p,action!=='drop');run.notice=action==='drop'?'Object placed.':'Thrown! Small robots can be destroyed; heavy armor only stuns.';return true;}
  if(action==='drop')return false;
  if(action==='use'){
    const sw=w.switches.find(s=>!s.active&&near(p,s));
    if(sw){sw.active=true;w.platforms.push({x:sw.bridgeX,y:sw.bridgeY,w:sw.bridgeW,h:8,kind:'switch-bridge'});run.objectiveVersion++;unlock(run);run.notice='Long bridge powered. Cross the gap.';return true;}
    const b=w.boss;
    const console=b?.kind==='foundry'&&b.phase!=='waiting'&&!b.solved&&b.pylons.find(s=>!s.active&&near(p,s));
    if(console){
      const next=b.pylons.find(s=>!s.active);if(next!==console){run.notice='Break the lower circuit first.';return false;}
      console.active=true;b.phaseIndex++;b.cycle=b.phaseIndex;b.activeRelay++;b.lavaSpeed+=.045;b.timer=90;run.objectiveVersion++;
      if(b.phaseIndex===3){
        b.phase='breach';b.escapeStart=run.tick;b.bodyX=b.x-180;b.bodyY=b.escapeY-60;b.leapTicks=0;
        // Escape corridor runs left above the tower. Its floor stays above rising lava.
        w.platforms.push({x:b.x-650,y:b.escapeY,w:1550,h:12,kind:'escape-floor',essential:true});
        for(let i=0;i<7;i++)w.platforms.push({x:b.x-530+i*150,y:b.escapeY-28-(i%2)*16,w:32,h:28+(i%2)*16,kind:'machine-wall',essential:true});
        for(const q of alive(run)){q.x=b.x+690+(q.slot||0)*18;q.y=b.escapeY-q.h;q.vx=q.vy=0;q.climbing=null;q.invulnerability=120;}
        w.finish={x:b.x-610,y:b.escapeY-30,w:28,h:30,locked:true};
        run.notice='LEFT WALL BREACHED! The emergency lift rises. Run LEFT under its leap, then through the machine maze!';
      }else run.notice=b.phaseIndex===1?'Circuit broken. Lava accelerates! Dodge the laser markers.':'Cooling destroyed! Platforms collapse, but the marked ladders remain. Climb!';
      return true;
    }
    if(w.memory&&!w.memory.read&&Math.abs(p.x-w.memory.x)<22){w.memory.read=true;run.notice='MEMORY: '+MEMORY_FRAGMENTS[run.level];return true;}
  }
  const teammate=action==='carry'&&playersOf(run).find(o=>o.id!==id&&o.alive&&!o.carriedBy&&!o.carryId&&near(p,o,25));
  const c=teammate||w.crates.filter(c=>!c.used&&!c.carriedBy&&near(p,c,27)).sort((a,b)=>Number(b.durable)-Number(a.durable)||Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
  if(c){c.carriedBy=id;c.flightTicks=0;p.carryId=c.id;run.notice=teammate?'Teammate lifted. F throws; Q sets down.':'Object lifted. E/F throws; Q sets down. Yellow weights never break.';return true;}
  return false;
}

function enemies(run,api){
  const w=run.world;
  for(const e of w.enemies){
    if(e.dead)continue;
    if(e.stunned>0){e.stunned--;e.phase='stunned';continue;}
    const targets=alive(run).filter(p=>!p.carriedBy&&p.invulnerability<=0&&(!w.boss||p.x<w.boss.x));
    if(e.kind==='scanner'){
      const target=targets.find(p=>Math.abs(p.x-e.x)<65&&p.y>e.y&&p.y<e.y+150&&!w.platforms.some(s=>s.x<p.x+p.w&&s.x+s.w>p.x&&s.y>e.y+e.h&&s.y<p.y));
      if(e.phase==='warning'){if(--e.timer<=0){e.phase='attack';e.timer=18;}}
      else if(e.phase==='attack'){for(const p of targets)if(Math.abs(p.x-e.targetX)<17&&p.y>e.y&&p.y<e.y+150&&!w.platforms.some(s=>s.x<p.x+p.w&&s.x+s.w>p.x&&s.y>e.y+e.h&&s.y<p.y))api.killPlayer(run,p,'Scanner beam');if(--e.timer<=0){e.phase='recover';e.timer=150;}}
      else if(e.phase==='recover'){if(--e.timer<=0)e.phase='patrol';}
      else if(target){e.phase='warning';e.timer=90;e.targetX=target.x;}
      if(['warning','attack'].includes(e.phase))continue;
    }else{
      const target=targets.find(p=>(p.x-e.x)*e.dir>-4&&(p.x-e.x)*e.dir<130&&Math.abs(p.y+p.h-e.groundY)<34&&!w.platforms.some(s=>s.h>24&&s.y<e.y+e.h&&s.y+s.h>e.y&&s.x>Math.min(e.x,p.x)&&s.x+s.w<Math.max(e.x,p.x)));
      if(e.phase==='recover'){if(--e.timer<=0)e.phase='patrol';}
      else if(e.phase==='charge'){if(--e.timer<=0){e.phase='recover';e.timer=75;}}
      else if(target){if(e.phase!=='windup'){e.phase='windup';e.timer=e.size==='big'?55:40;}else if(--e.timer<=0){e.phase='charge';e.timer=75;}}
      else e.phase='patrol';
      for(const p of targets)if(overlaps({...p,x:p.x+2,y:p.y+2,w:p.w-4,h:p.h-3},{...e,x:e.x+2,y:e.y+2,w:e.w-4,h:e.h-3})){
        if(e.size!=='big'&&p.vy>0&&p.y+p.h<e.y+15){e.stunned=100;p.vy=-4.5;p.onGround=false;run.notice='Stomp stun! Throw debris to destroy the robot.';}
        else api.killPlayer(run,p,e.kind==='hound'?'Hound charge':'Patrol collision');
      }
      if(e.phase==='windup'||e.phase==='recover')continue;
    }
    const speed=e.phase==='charge'?(e.size==='big'?1.05:1.6):e.speed;
    const nx=e.x+e.dir*speed;
    if(nx<e.minX||nx>e.maxX){e.dir*=-1;e.phase='patrol';}else e.x=nx;
  }
}
function projectiles(run){
  const w=run.world,b=w.boss;
  for(const c of w.crates){
    if(c.used||c.carriedBy||!c.flightTicks)continue;
    c.flightTicks--;
    const hit=w.enemies.find(e=>!e.dead&&overlaps(c,{x:e.x-3,y:e.y-3,w:e.w+6,h:e.h+6}));
    const bossHit=b?.kind==='climber'&&!b.solved&&b.phase!=='waiting'&&b.bodyY<w.floorY-130&&overlaps(c,{x:b.bodyX,y:b.bodyY,w:b.bodyW,h:b.bodyH});
    const barrier=w.platforms.find(s=>s.kind==='breakable'&&overlaps(c,{x:s.x-3,y:s.y-3,w:s.w+6,h:s.h+6}));
    if(barrier){breakBlock(run,barrier);c.flightTicks=0;if(!c.durable){c.used=true;effect(w,c.x,c.y,run.tick);}}
    if(hit){hit.stunned=hit.size==='big'?100:120;hit.hp-=hit.size==='big'?0:1;if(hit.hp<=0){hit.dead=true;hit.deathTick=run.tick;effect(w,hit.x,hit.y,run.tick,'robot');}c.flightTicks=0;run.notice=hit.dead?'Robot destroyed!':hit.size==='big'?'Heavy armor! Briefly stunnedâ€”keep moving.':'Robot stunned. Another hit can finish it.';}
    if(bossHit){b.hp--;b.hitTick=run.tick;c.flightTicks=0;run.notice=`Climb Warden damaged: ${b.hp}/${b.maxHp}`;if(b.hp<=0){deadBoss(run);const y=w.floorY-80*(b.highestTier+1);w.platforms.push({x:b.x+30,y:y-60,w:400,h:10,kind:'exit-floor',essential:true});w.ladders.push({id:'final-ladder',x:b.x+290,y:y-60,w:12,h:140});w.finish={x:b.x+350,y:y-90,w:28,h:30,locked:false};run.notice='WARDEN DESTROYED! Climb the final ladder to the exit.';}}
    if(hit||bossHit){if(!c.durable){c.used=true;effect(w,c.x,c.y,run.tick);}else{c.vx*=-.3;c.vy=-2;}}
    if(!hit&&!bossHit&&c.flightTicks<96&&c.vy===0){if(!c.durable){c.used=true;effect(w,c.x,c.y,run.tick);}c.flightTicks=0;}
  }
}
function bossStep(run,api){
  const w=run.world,b=w.boss;if(!b||b.solved)return;
  const people=alive(run);if(!people.length)return;
  if(b.phase==='waiting'){
    if(w.switches.some(s=>!s.active)||!people.every(p=>p.x>=b.x))return;
    b.phase='active';b.startTick=run.tick;b.timer=120;
    run.notice=b.kind==='climber'?'Climb the tower! E lifts debris, E again throws it at the Warden.':b.kind==='chainsaw'?'CHAINSAW! Climb trunks, wall-jump and flee right. Watch the final falling tree.':'Climb above the lava. E breaks each console. Every circuit makes it rise faster.';
  }
  b.elapsed++;
  if(b.kind==='climber'){
    const highest=Math.min(...people.map(p=>p.y));
    if(highest<w.floorY-80*(b.highestTier-1))addClimbTier(w,b,b.highestTier+1);
    if(b.highestTier>12&&b.elapsed%60===0){
      const cutoff=Math.max(...people.map(p=>p.y))+240;
      w.platforms=w.platforms.filter(s=>!['boss-tier','boss-step'].includes(s.kind)||s.y<cutoff);
      w.ladders=w.ladders.filter(l=>l.x<b.x||l.y<cutoff);
      w.crates=w.crates.filter(c=>c.carriedBy||c.x<b.x||c.y<cutoff);
    }
    // Keep a readable pursuit target. Switching elevations every four seconds
    // made debris attacks unreliable when co-op players occupied different floors.
    const target=people.find(p=>p.id===b.targetId)||people.reduce((best,p)=>Math.abs(p.y-b.bodyY)<Math.abs(best.y-b.bodyY)?p:best,people[0]);
    b.targetId=target.id;
    b.bodyX=b.x+425;
    b.bodyY+=(target.y-18-b.bodyY)*.025;
    b.crushY-=.1;
    for(const p of people)if(p.y+p.h>b.crushY)api.killPlayer(run,p,'Warden climbing claws',true);
    for(const p of people)if(overlaps(p,{x:b.bodyX,y:b.bodyY,w:b.bodyW,h:b.bodyH}))api.killPlayer(run,p,'Warden contact');
    // Each tier has finite throwables; recycle supplies on occupied tiers if exhausted.
    if(b.elapsed%180===0)for(const p of people){if(!w.crates.some(c=>!c.used&&Math.abs(c.y-p.y)<60&&Math.abs(c.x-p.x)<180))supply(w,Math.max(b.x+40,p.x-25),p.y+p.h,'brick');}
  }else if(b.kind==='chainsaw'){
    const tree=b.tree;
    b.bodyX=Math.min(tree.x-20,b.bodyX+(tree.phase==='upright'?.85:Math.max(1.45,(tree.x-20-b.bodyX)/Math.max(1,tree.timer))));b.bodyY=w.floorY-62;
    for(const p of people)if(tree.phase==='upright'&&overlaps(p,{x:b.bodyX,y:b.bodyY,w:b.bodyW+36,h:b.bodyH}))api.killPlayer(run,p,'Chainsaw caught you',true);
    if(tree.phase==='upright'&&people.some(p=>p.x>tree.x+tree.w)){tree.phase='warning';tree.timer=45;run.notice='TREE FALLING! Leave the striped zoneâ€”players underneath are crushed too!';}
    if(tree.phase==='warning'&&--tree.timer<=0){tree.phase='falling';tree.timer=20;tree.fallTick=run.tick;}
    else if(tree.phase==='falling'&&--tree.timer<=0){tree.phase='fallen';for(const p of people)if(p.x+p.w>tree.x-35&&p.x<tree.x+tree.w)api.killPlayer(run,p,'Falling tree',true);deadBoss(run);w.platforms.push({x:tree.x-35,y:w.floorY-18,w:tree.w+35,h:18,kind:'fallen-tree'});run.notice='The tree crushed the chainsaw. Jump the trunk and reach the exit!';}
  }else{
    b.lavaY-=b.lavaSpeed;
    if(b.phase==='breach'){
      const u=Math.min(1,++b.leapTicks/120);b.bodyX=b.x-180+1000*u;b.bodyY=b.escapeY-60-180*Math.sin(Math.PI*u);
      if(u===1){b.phase='escape';run.notice='BULLDOZER BEHIND YOU! Keep running LEFT.';}
    }else if(b.phase==='escape'){
      b.bodyX-=.85;
      for(const p of people)if(p.x+p.w>b.bodyX&&p.y>b.escapeY-100)api.killPlayer(run,p,'Bulldozer caught you',true);
      if(people.every(p=>p.x<w.finish.x+65)){b.lavaY=b.escapeY-5;deadBoss(run);run.notice='The factory collapses. The Colossus sinks into lava. Exit left!';return;}
    }else if(b.phaseIndex>0){
      if(--b.timer<=0){
        if(b.phase==='warning'){
          b.phase='attack';b.timer=20;
          if(b.phaseIndex===2&&b.breakTarget){const target=b.breakTarget,s=w.platforms.find(s=>s.kind==='boss-step'&&s.x===target.x&&s.y===target.y);if(s){w.platforms=w.platforms.filter(q=>q!==s);effect(w,s.x+s.w/2,s.y,run.tick);run.notice='Platform shattered! The gold ladders remain safe.';}b.breakTarget=null;}
        }
        else{b.phase='warning';b.timer=100;const p=people[Math.floor(b.elapsed/120)%people.length];b.targetX=p.x;b.targetY=p.y;
          if(b.phaseIndex===2){const s=w.platforms.filter(s=>s.kind==='boss-step').sort((a,c)=>Math.abs(a.y-(p.y+p.h))-Math.abs(c.y-(p.y+p.h)))[0];b.breakTarget=s?{x:s.x,y:s.y,w:s.w,h:s.h}:null;if(s){b.targetX=s.x+s.w/2;b.targetY=s.y-22;}run.notice='CRUMBLE! The marked platform will break. Use the gold ladder.';}}
      }
      if(b.phase==='attack'&&b.phaseIndex===1)for(const p of people)if(Math.abs(p.x-b.targetX)<13&&Math.abs(p.y-b.targetY)<70)api.killPlayer(run,p,'Colossus laser');
    }
    for(const p of people)if(p.y+p.h>b.lavaY&&p.x>=b.x-650)api.killPlayer(run,p,'Rising lava',true);
  }
}

export function stepRevision(run,api){
  if(run.phase!=='playing')return;run.tick++;
  const w=run.world,people=[...run.players.values()],b=w.boss;
  w.breakEffects=w.breakEffects.filter(e=>run.tick-e.tick<(e.kind==='boss'?180:45));
  if(run.tick%120===0)w.crates=w.crates.filter(c=>!c.used||c.durable);
  for(const plate of w.plates){
    plate.held=[...alive(run).filter(p=>!p.carriedBy),...w.crates.filter(c=>!c.used&&!c.carriedBy)].some(o=>o.x+o.w>plate.x&&o.x<plate.x+plate.w&&Math.abs(o.y+o.h-plate.y)<2);
    plate.remaining=plate.held?90:Math.max(0,plate.remaining-1);
    const bridge=w.platforms.find(s=>s.plateId===plate.id);
    if(plate.remaining&&!bridge)w.platforms.push({x:plate.bridgeX,y:plate.y,w:plate.bridgeW,h:8,kind:'pressure-bridge',plateId:plate.id});
    if(!plate.remaining&&bridge)w.platforms=w.platforms.filter(s=>s!==bridge);
  }
  for(const p of people){
    p.gestureTicks=Math.max(0,(p.gestureTicks||0)-1);p.hitTicks=Math.max(0,(p.hitTicks||0)-1);
    if(!p.alive||p.carriedBy)continue;
    const previousX=p.x;
    for(const block of w.platforms.filter(s=>s.kind==='breakable'))if(p.vy>2&&p.x+p.w>block.x&&p.x<block.x+block.w&&p.y+p.h<=block.y+3&&p.y+p.h+p.vy+.24>=block.y){breakBlock(run,block);p.vy=-3;}
    const supports=people.filter(o=>o!==p&&o.alive&&!o.carriedBy&&p.y+p.h<=o.y+3).map(o=>({x:o.x,y:o.y,w:o.w,h:2,kind:'teammate'}));
    const pw={...w,platforms:[...w.platforms,...supports]};
    for(const t of w.terrain)if(p.onGround&&p.x+p.w>t.x&&p.x<t.x+t.w){if(t.kind==='water')pw.moveScale=.7;else pw.groundDrift=t.direction*.35;}
    stepPlayer(p,p.input||{},pw);
    if(b&&b.phase!=='waiting'&&!b.solved&&!['escape','breach'].includes(b.phase))p.x=Math.max(b.x,p.x);
    for(const cp of w.checkpoints)if(!cp.active&&(near(p,cp,20)||(previousX+p.w<cp.x&&p.x+p.w>=cp.x&&p.y+p.h<=cp.y+cp.h+8))){
      cp.active=true;cp.reachedTick=run.tick;run.respawnX=cp.x;run.respawnY=cp.y+cp.h-p.h;run.hearts=Math.min(run.heartMax,run.hearts+1);
      const down=people.filter(q=>!q.alive).sort((a,b)=>a.timeDead-b.timeDead)[0];
      if(down)Object.assign(down,api.makeParticipant(down.id,down.slot,w),{x:cp.x,y:run.respawnY,invulnerability:120});
      run.notice='FLAG SAVED. One heart restored. This is your respawn point.';recordRunEvent(run,'checkpoint-heart',{x:cp.x});
    }
    if(p.y>w.height)api.killPlayer(run,p,'Fell into a pit',true);
  }
  for(const p of people)if(p.carriedBy){const c=run.players.get(p.carriedBy);if(!c?.alive){p.carriedBy=null;continue;}p.x=c.x;p.y=c.y-p.h-2;if(p.input?.jump){c.carryId=null;p.carriedBy=null;p.vy=-5.2;p.onGround=false;p.lastJump=true;}}
  projectiles(run);updateCrates(w);projectilesAfterMotion(run);
  for(const c of w.crates)if(c.durable&&c.used){c.used=false;c.x=c.homeX;c.y=c.homeY;c.vx=c.vy=0;}
  enemies(run,api);bossStep(run,api);
  if(w.giant.wakeTicks>0)w.giant.wakeTicks--;else w.giant.x=Math.min(b?b.x-65:w.width,w.giant.x+w.giant.speed);
  const livingAtPursuit=alive(run);
  const caught=livingAtPursuit.filter(p=>{
    const inArena=b&&(p.x>=b.x||(b.kind==='foundry'&&p.x>=b.x-650&&p.y<w.floorY-250));
    return !inArena&&p.x+4<w.giant.x+44;
  });
  if(caught.length&&livingAtPursuit.length<=2){
    // End the team run atomically, even when only one shared heart remained.
    for(const q of livingAtPursuit){
      api.releaseParticipant(run,q);q.alive=false;q.hitTicks=14;q.vx=q.vy=0;q.timeDead=q.lastDeathAt=run.tick;q.pursuerRecovery=0;
      run.deathEvents.push({id:`${run.runId}:${run.tick}:${q.id}`,playerId:q.id,cause:'The pursuer caught the team'});
      recordRunEvent(run,'death',{survivor:q.slot+1,cause:'The pursuer caught the team',x:Math.round(q.x),y:Math.round(q.y)});
    }
    run.deathEvents=run.deathEvents.slice(-30);run.hearts=0;run.phase='gameover';run.notice='The giant caught the last survivors. The escape is over.';
  }else for(const p of caught){
    api.killPlayer(run,p,'The pursuer caught you',true);
    if(run.hearts>0){p.pursuerRecovery=90;run.notice='A teammate was caught. One heart lost; rescue returns them to the group.';}
  }
  for(const p of people)if(!p.alive&&p.pursuerRecovery>0&&run.phase==='playing'&&--p.pursuerRecovery===0){
    const anchor=alive(run).sort((a,b)=>b.x-a.x)[0];
    if(anchor)Object.assign(p,api.makeParticipant(p.id,p.slot,w),{x:anchor.x,y:anchor.y,invulnerability:180});
  }
  for(const a of w.animals){a.x+=a.dir*.2;if(Math.abs(a.x-a.homeX)>35)a.dir*=-1;}
  if(run.phase!=='playing')return;
  if(!alive(run).length){
    const x=run.respawnX??27,y=run.respawnY??w.floorY-22;
    for(const p of people)Object.assign(p,api.makeParticipant(p.id,p.slot,w),{x:x+p.slot*15,y,invulnerability:150});
    w.giant.x=Math.min(w.giant.x,x-180);
    if(b&&!b.solved&&b.phase!=='waiting'){
      // Retry the encounter cleanly while preserving completed approach puzzles.
      const fresh=buildRevisionLevel(w.id,w.partySize);
      w.boss=fresh.boss;w.finish=fresh.finish;w.topY=fresh.topY;
      w.platforms=[...w.platforms.filter(s=>s.x<b.x&&!['escape-floor','machine-wall'].includes(s.kind)),...fresh.platforms.filter(s=>s.x>=b.x)];
      w.ladders=[...w.ladders.filter(l=>l.x<b.x),...fresh.ladders.filter(l=>l.x>=b.x)];w.nextLadder=Math.max(w.nextLadder,fresh.nextLadder);
      w.crates=w.crates.filter(c=>c.x<b.x);
      for(const c of fresh.crates.filter(c=>c.x>=b.x))supply(w,c.x,c.y+c.h,c.kind,c.durable);
      for(const p of people){p.x=b.x-20+p.slot*15;p.y=w.floorY-p.h;}
    }
    run.notice='Respawned at the flag with remaining hearts.';return;
  }
  unlock(run);
  if(!w.finish.locked&&alive(run).every(p=>overlaps(p,{x:w.finish.x-8,y:w.finish.y-70,w:w.finish.w+30,h:w.finish.h+80}))){run.phase='victory';run.notice=`Level ${run.level} complete!`;recordRunEvent(run,'stage-clear');}
}
// Do not decrement lifetime twice: the second pass catches high-speed overlaps after physics.
function projectilesAfterMotion(run){for(const c of run.world.crates)if(c.flightTicks)c.flightTicks++;projectiles(run);}

export function revisionObjective(run){
  const w=run.world,b=w.boss;
  if(b&&b.phase!=='waiting'&&!b.solved){if(b.kind==='climber')return `WARDEN ${b.hp}/${b.maxHp} â€¢ Climb (W/S at ladders), lift debris (E), throw (E/F).`;
    if(b.kind==='chainsaw')return b.tree.phase==='warning'?'FALLING TREE! Clear the striped area now.':'CHAINSAW CHASE â€¢ Climb trunks / Space wall-jump â€¢ Escape right';
    return ['escape','breach'].includes(b.phase)?'RUN LEFT â€¢ Jump machinery â€¢ Reach the emergency door':`FACTORY ${b.phaseIndex||0}/3 â€¢ Climb above lava â€¢ E breaks consoles`;}
  if(b?.solved)return 'BOSS DESTROYED â€¢ Reach the exit together';
  const p=alive(run)[0];const ladder=w.ladders.find(l=>p&&Math.abs(p.x-l.x)<35&&Math.abs(p.y+p.h-(l.y+l.h))<50);
  if(ladder)return 'LADDER: W up / S down â€¢ Release to hold / sideways to step off â€¢ Space against walls to wall-jump';
  const plate=w.plates.find(s=>p&&p.x>s.x-80&&p.x<s.bridgeX+s.bridgeW+30);
  if(plate)return `LONG BRIDGE â€¢ ${plate.held?'WEIGHT HELD':plate.remaining?Math.ceil(plate.remaining/60)+' seconds':'Put the yellow weight on the plate (Q)'}`;
  return `RELAYS ${w.switches.filter(s=>s.active).length}/${w.switches.length} â€¢ Flags save + heal â€¢ E lifts/throws debris â€¢ Ground lights show facing`;
}
