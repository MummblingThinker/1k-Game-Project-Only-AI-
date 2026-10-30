import { getLevel } from './campaign.js';

// Routes are authored as traversable districts, not a repeating flat obstacle strip.
const ROUTES = {
  1: ['street','roof','bridge'], 2: ['subway','street','roof','bridge','subway','weight'],
  3: ['roof','roof','bridge','street','roof','weight'], 4: ['street','roof','weight','subway','roof','bridge'],
  5: ['street','roof','bridge','street','roof','weight','roof','street'],
  6: ['grove','canopy','bridge','grove','water','weight'], 7: ['water','bridge','grove','water','weight','canopy'],
  8: ['canopy','grove','weight','canopy','bridge','canopy'], 9: ['grove','cabin','bridge','canopy','cabin','weight'],
  10:['grove','canopy','weight','water','bridge','grove','cabin','canopy'],
  11:['grove','canopy','bridge','covered','covered','assembly'],
  12:['furnace','assembly','weight','furnace','bridge','tower'],
  13:['assembly','tower','bridge','tower','weight','assembly'],
  14:['tower','weight','furnace','assembly','bridge','tower'],
  15:['assembly','tower','bridge','furnace','weight','tower','assembly','tower'],
};
export function supply(w,x,y,kind, durable=false) {
  const id=`prop-${w.nextProp++}`;
  const c={id,x,y:y-12,w:12,h:12,vx:0,vy:0,used:false,carriedBy:null,kind,durable,homeX:x,homeY:y-12};
  w.crates.push(c); return c;
}
export function addLadder(w,x,bottom,top) {
  w.ladders.push({id:`ladder-${w.nextLadder++}`,x,y:top,w:12,h:bottom-top});
}
export function addClimbTier(w,b,index) {
  const y=w.floorY-80*(index+1), left=index%2===0;
  const x=b.x+(left?35:210);
  w.platforms.push({x:b.x+35,y,w:350,h:9,kind:'boss-tier',essential:true,tier:index,oneWay:true});
  addLadder(w,x+65,Math.min(w.floorY,y+160),y);
  // A permanent stepping block lets a player transfer between alternate ladders.
  w.platforms.push({x:b.x+178,y:y+39,w:55,h:8,kind:'boss-step',essential:true,oneWay:true});
  supply(w,x+22,y,w.region==='city'?'aircon':'gear');
  supply(w,x+125,y,w.region==='city'?'brick':'battery');
  w.topY=Math.min(w.topY,y-120); b.highestTier=index;
  return {x,y};
}
export function buildRevisionLevel(levelId=1,partySize=1) {
  const level=getLevel(levelId), id=level.id, milestone=id%5===0;
  const width=id===1?960:milestone?(id===5?5280:id===10?5760:6240):2880;
  const floorY=540, route=ROUTES[id], bossX=milestone?width-(id===10?1550:950):null;
  const w={revision:2,id,title:level.title,region:level.palette,summary:level.summary,goal:level.goal,width,height:610,topY:120,floorY,partySize,
    floors:[],platforms:[],pits:[],crates:[],enemies:[],checkpoints:[],switches:[],plates:[],ladders:[],terrain:[],scenery:[],animals:[],districts:[],breakEffects:[],nextProp:0,nextLadder:0,
    finish:{x:width-55,y:floorY-30,w:28,h:30,locked:true},giant:{x:-180,y:floorY-120,speed:(2880+114)/7200,wakeTicks:id===1?1200:720}};
  const routeEnd=bossX??(width-100), cell=(routeEnd-100)/route.length;
  const gaps=[];
  route.forEach((type,i)=>{
    const x=100+i*cell, end=x+cell, y=floorY;
    w.districts.push({x,w:cell,type});
    const biome=id===11&&i<5?'forest':w.region;
    let deckY=y;
    if(['roof','canopy','tower','cabin'].includes(type)) {
      const height=type==='tower'?180:type==='roof'?120:type==='canopy'?90:60;
      deckY=y-height;
      // The building/trunk is solid: the player must climb onto it to proceed.
      w.platforms.push({x:x+70,y:deckY,w:Math.max(100,cell-120),h:height,kind:type,essential:true});
      addLadder(w,x+76,y,deckY);
      w.platforms.push({x:x+35,y:y-38,w:24,h:8,kind:'step'});
      if(type==='tower') { w.platforms.push({x:x+30,y:y-92,w:28,h:8,kind:'step'}); }
      // Descending on the far side returns to the street/trail.
      addLadder(w,end-58,y,deckY);
    }
    if(type==='subway') {
      w.platforms.push({x:x+30,y:y-72,w:cell-65,h:12,kind:'tunnel-roof'});
      w.scenery.push({x:x+40,y:y-50,w:cell-100,h:45,kind:'train'});
    }
    if(type==='bridge'||type==='weight') {
      const gapW=Math.min(230,cell-65), gx=x+55;
      gaps.push({x:gx,y,w:gapW,h:90,index:gaps.length,required:true});
      if(type==='bridge') w.switches.push({id:`relay-${i}`,x:gx-28,y:y-15,w:12,h:15,active:false,bridgeX:gx,bridgeW:gapW,bridgeY:y});
      else {
        const plate={id:`plate-${i}`,x:gx-38,y,w:22,h:3,remaining:0,held:false,bridgeX:gx,bridgeW:gapW};w.plates.push(plate);
        const weight=supply(w,gx-65,y,'weight',true);weight.plateId=plate.id;
      }
    }
    if(type==='water')w.terrain.push({kind:'water',x:x+35,y:y-5,w:cell-70,h:12});
    if(type==='furnace'||type==='assembly')w.terrain.push({kind:'conveyor',x:x+40,y:y-4,w:cell-80,h:8,direction:type==='furnace'?-1:1});
    if(type==='covered'){
      w.coveredWay??={x,y:y-68,w:0,h:10,drones:100};w.coveredWay.w+=cell;
      w.platforms.push({x,y:y-68,w:cell,h:10,kind:'covered-roof',essential:true});
    }
    const props=biome==='city'?['trashcan','mailbox','brick','bottle','aircon','antenna']:biome==='forest'?['stick','bone','log','acorn','stone','mushroom']:['gear','battery','pipe','scrap','monitor','coil'];
    if(!['bridge','weight','covered'].includes(type)) {
      for(let j=0;j<4;j++){
        const px=x+90+j*Math.max(20,(cell-150)/4);
        supply(w,px,deckY,props[(i+j+id)%props.length]);
      }
      if(i%2===1)w.platforms.push({x:end-88,y:deckY-20,w:22,h:20,kind:'breakable',material:biome});
      if(i>0||id>1) {
        for(let j=0;j<(id===1?1:3);j++){
          const ex=x+110+j*Math.max(18,(cell-180)/3), flying=(i+j+id)%4===0;
          const size=id>=4&&j===2&&i%3===1?'big':id>=3&&(i+j)%4===2?'medium':'small';
          const h=size==='big'?32:size==='medium'?24:17;
          w.enemies.push({id:`enemy-${i}-${j}`,kind:flying?'scanner':biome==='forest'?(j%2?'hound':'woodcutter'):biome==='city'?(j%2?'riot':'courier'):(j%2?'welder':'roller'),
            size,hp:size==='big'?999:size==='medium'?3:1,x:ex,y:deckY-(flying?76:h),w:flying?22:size==='big'?23:16,h:flying?14:h,
            minX:Math.max(x+85,ex-30),maxX:Math.min(end-70,ex+65),dir:j%2?-1:1,speed:flying?.35:.3+id*.012,phase:'patrol',timer:0,stunned:0,dead:false,groundY:deckY});
        }
      }
    }
    for(let j=0;j<5;j++)w.scenery.push({x:x+j*cell/5,y:deckY,w:20+(j*17%32),h:15+(i*13+j*11)%45,kind:biome==='city'?['lamp','sign','rubble','vent','wires'][(j+id)%5]:biome==='forest'?['tree','fern','bones','stump','flowers'][(j+id)%5]:['pipe','tank','piston','cables','cratepile'][(j+id)%5]});
    if(biome==='forest'&&!['bridge','weight','covered'].includes(type))w.animals.push({x:x+90,y:deckY-8,homeX:x+90,kind:(id+i)%2?'rabbit':'deer',dir:1});
    if(i>0&&(i%2===1||i===route.length-1))w.checkpoints.push({x:x+20,y:y-34,w:12,h:34,active:false,kind:'flag'});
  });
  let cursor=0;for(const gap of gaps.sort((a,b)=>a.x-b.x)){w.floors.push({x:cursor,y:floorY,w:gap.x-cursor,h:70});cursor=gap.x+gap.w;}w.floors.push({x:cursor,y:floorY,w:width-cursor,h:70});w.pits=gaps;
  w.memory=id===1?null:{x:112,y:floorY-25,read:false};
  if(milestone){
    const b=w.boss={kind:id===5?'climber':id===10?'chainsaw':'foundry',x:bossX,w:width-bossX,phase:'waiting',solved:false,elapsed:0,timer:120,hp:id===5?8:1,maxHp:id===5?8:1,pylons:[],cycle:0,activeRelay:0,highestTier:-1,bodyX:bossX+70,bodyY:floorY-62,bodyW:58,bodyH:62,crushY:floorY+70};
    w.checkpoints.push({x:bossX-30,y:floorY-34,w:12,h:34,active:false,kind:'flag'});
    if(id===5||id===15){
      for(let tier=0;tier<7;tier++){const p=addClimbTier(w,b,tier);if(id===15&&[1,3,5].includes(tier))b.pylons.push({id:`core-${tier}`,x:p.x+100,y:p.y-18,w:14,h:18,active:false});}
      if(id===15){b.lavaY=floorY+95;b.lavaSpeed=.035;b.phaseIndex=0;b.escapeY=floorY-560;}
      w.finish={x:bossX+350,y:floorY-590,w:28,h:30,locked:true};
    }else{
      // Alternating trunks force climbs and descents through an actual tree maze.
      for(let j=0;j<9;j++){
        const tx=bossX+160+j*130, height=j%2?85:130;
        w.platforms.push({x:tx,y:floorY-height,w:34,h:height,kind:'maze-tree',essential:true});
        addLadder(w,tx+3,floorY,floorY-height);
        w.platforms.push({x:tx+52,y:floorY-height+35,w:35,h:8,kind:'branch',essential:true});
        supply(w,tx+65,floorY-height+35,'stick');
      }
      b.tree={x:width-200,y:floorY-220,w:120,h:220,phase:'upright',timer:0};
      b.bodyX=bossX-130;b.bodyW=58;
    }
  }
  return w;
}
