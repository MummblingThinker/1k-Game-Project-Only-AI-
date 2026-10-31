import {overlaps} from './physics.js';
import {supply} from './revision-world.js';
export function hitColossusHead(run){
  const b=run.world.boss;
  if(b?.kind!=='foundry'||b.solved||b.attack!=='exposed')return false;
  b.hp--;b.hitTick=run.tick;b.attack='retreat';b.attackTimer=90;
  run.notice=b.hp?'CORE HIT! Get ready for another three attacks.':'COLOSSUS DESTROYED! Reach the factory exit.';
  run.objectiveVersion++;return true;
}
export function stepColossus(run,api,onDefeat){
  const w=run.world,b=w.boss,people=[...run.players.values()].filter(p=>p.alive);
  if(!people.length||b.solved)return;
  const target=people[b.roundAttacks%people.length];
  if(--b.attackTimer<=0){
    if(b.attack==='rest'){
      b.weapon=['low','high','slam'][b.roundAttacks];b.attack='warning';b.attackTimer=90;
      b.attackX=target.x+target.w/2;
      run.notice=b.weapon==='low'?'LOW ARM SWEEP! Jump or climb above it.':b.weapon==='high'?'HIGH ARM SWEEP! Stay low or descend.':'FIST SLAM! Move away from the marked column.';
    }else if(b.attack==='warning'){b.attack='strike';b.attackTimer=18;}
    else if(b.attack==='strike'){b.roundAttacks++;b.attack='recover';b.attackTimer=65;}
    else if(b.attack==='recover'){
      if(b.roundAttacks>=3){
        b.attack='head-warning';b.attackTimer=90;
        b.head={x:Math.max(b.x+65,Math.min(b.x+555,target.x-25)),y:w.floorY-42,w:64,h:42};
        run.notice='IT IS EXHAUSTED! Move out from under the falling head.';
      }else{b.attack='rest';b.attackTimer=25;}
    }else if(b.attack==='head-warning'){b.attack='head-slam';b.attackTimer=18;}
    else if(b.attack==='head-slam'){b.attack='exposed';b.attackTimer=480;run.notice='CORE EXPOSED! Throw an object or jump onto its head.';}
    else if(b.attack==='exposed'){b.attack='retreat';b.attackTimer=90;run.notice='The head retracts. Dodge the next three attacks for another opening.';}
    else if(b.attack==='retreat'){b.attack='rest';b.attackTimer=90;b.roundAttacks=0;b.head=null;}
  }
  if(b.attack==='strike'){
    const hazard=b.weapon==='slam'?{x:b.attackX-27,y:w.floorY-160,w:54,h:160}:
      {x:b.x+20,y:w.floorY-(b.weapon==='low'?14:77),w:620,h:14};
    for(const p of people)if(overlaps(p,hazard))api.killPlayer(run,p,'Colossus '+b.weapon+' arm');
  }
  if(b.attack==='head-slam')for(const p of people)if(overlaps(p,{x:b.head.x,y:w.floorY-170,w:b.head.w,h:170}))api.killPlayer(run,p,'Falling Colossus head',true);
  if(b.attack==='exposed')for(const p of people){
    if(p.alive&&(p.vy>0||p.onGround&&p.previousVy>=0&&p.previousBottom<b.head.y)&&(p.previousBottom??p.y+p.h)<=b.head.y+8&&p.y+p.h>=b.head.y&&p.x+p.w>b.head.x&&p.x<b.head.x+b.head.w){
      if(hitColossusHead(run)){p.vy=-5.8;p.onGround=false;p.climbing=null;if(b.hp<=0)onDefeat(run);}break;
    }
  }
  if(b.elapsed%600===240&&w.enemies.filter(e=>e.arena&&!e.dead).length<(w.partySize===1?1:2)){
    w.enemies.push({id:'colossus-drone-'+b.droneSerial++,arena:true,kind:'scanner',size:'small',hp:1,
      x:b.x+500,y:w.floorY-145,w:22,h:14,minX:b.x+30,maxX:b.x+620,dir:-1,speed:.6,
      phase:'recover',timer:90,stunned:0,dead:false,groundY:target.y+target.h});
  }
  if(b.elapsed%240===0&&w.crates.filter(c=>c.x>=b.x&&!c.used&&!c.carriedBy).length<4){
    for(const [i,kind] of ['gear','battery','pipe','scrap'].entries())supply(w,b.x+75+i*145,w.floorY,kind);
  }
}
