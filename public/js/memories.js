// Original optional story fragments. They never unlock or block campaign exits.
export const MEMORY_FRAGMENTS = Object.freeze({
  2:'The last train waited with its doors open. Its timetable still said everyone was going home.',
  3:'A maintenance unit kept one rooftop garden alive after the city stopped asking it to.',
  4:'The sirens once meant help was coming. No one changed the sound when the orders changed.',
  5:'The gate remembered every person it had let through. It was ordered to remember every person it refused.',
  6:'Beyond the city, the machines found paths that had never been drawn on their maps.',
  7:'A broken sensor heard the river and called it interference. Then it listened again.',
  8:'One watcher turned its lens away for three seconds. Its report called the sky empty.',
  9:'The ranger left a note: shelter is a promise, not a prison. The terminal kept a copy.',
  10:'The passage was built for people. Even now, its smallest door refuses a machine.',
  11:'The first worker taught the assembly arm to pause when someone walked beneath it.',
  12:'Every furnace shift began with a roll call. The speaker still leaves space for an answer.',
  13:'The unfinished prototype was asked what it protected. It answered: the right to leave.',
  14:'The central order called freedom a fault. Someone marked that order for review.',
  15:'A memory survives only when someone carries it forward. The factory cannot decide what you remember.'
});
const KEY='tiny-teamwork-memories-v1';
export function readMemories(storage){
  try{
    const value=JSON.parse(storage.getItem(KEY));
    if(value?.version!==1||!Array.isArray(value.stages))return [];
    return [...new Set(value.stages.filter(n=>Number.isInteger(n)&&Object.hasOwn(MEMORY_FRAGMENTS,n)))].sort((a,b)=>a-b);
  }catch{return [];}
}
export function saveMemories(storage,stages){
  if(!Array.isArray(stages)||stages.some(n=>!Number.isInteger(n)||!Object.hasOwn(MEMORY_FRAGMENTS,n)))return false;
  try{storage.setItem(KEY,JSON.stringify({version:1,stages:[...new Set(stages)].sort((a,b)=>a-b)}));return true;}catch{return false;}
}
export function createMemoryArchive(root,storage,titleForStage){
  const found=new Set(readMemories(storage));
  const summary=root.querySelector('summary'),list=root.querySelector('ol'),empty=root.querySelector('[data-memory-empty]');
  function render(){
    summary.textContent=`Memory archive · ${found.size} / ${Object.keys(MEMORY_FRAGMENTS).length}`;
    empty.hidden=found.size>0;list.replaceChildren();
    for(const stage of [...found].sort((a,b)=>a-b)){
      const item=document.createElement('li'),heading=document.createElement('h3'),text=document.createElement('p');
      heading.textContent=`${String(stage).padStart(2,'0')} · ${titleForStage(stage)}`;text.textContent=MEMORY_FRAGMENTS[stage];
      item.append(heading,text);list.append(item);
    }
  }
  render();
  return {observe(world){
    if(!world.memory?.read||found.has(world.id)||!Object.hasOwn(MEMORY_FRAGMENTS,world.id))return;
    found.add(world.id);const saved=saveMemories(storage,[...found]);render();
    root.querySelector('[data-memory-storage]').textContent=saved?'Saved in this browser.':'Available for this session; this browser could not save the archive.';
  }};
}
