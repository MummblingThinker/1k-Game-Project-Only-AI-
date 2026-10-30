const defaults=()=>({motion:'system',effects:'full'});
export function readVisualOptions(storage) {
  try {
    const saved=JSON.parse(storage?.getItem('tiny-teamwork-visuals')||'null');
    if(saved?.version!==1)return defaults();
    return {motion:['system','reduced','full'].includes(saved.motion)?saved.motion:'system',effects:saved.effects==='reduced'?'reduced':'full'};
  } catch { return defaults(); }
}
export function saveVisualOptions(storage,options) {
  try { storage?.setItem('tiny-teamwork-visuals',JSON.stringify({version:1,...options})); } catch {}
}
export function createVisualOptions(motionSelect,effectsSelect,storage) {
  const options=readVisualOptions(storage),media=matchMedia('(prefers-reduced-motion: reduce)');
  motionSelect.value=options.motion;effectsSelect.value=options.effects;
  const reduced=()=>options.motion==='reduced'||options.motion==='system'&&media.matches;
  const apply=()=>{document.body.dataset.motion=reduced()?'reduced':'full';document.body.dataset.effects=options.effects;};
  const change=()=>{options.motion=motionSelect.value;options.effects=effectsSelect.value;saveVisualOptions(storage,options);apply();};
  motionSelect.addEventListener('change',change);effectsSelect.addEventListener('change',change);media.addEventListener('change',apply);apply();
  return {get reducedMotion(){return reduced();},get reducedEffects(){return options.effects==='reduced';}};
}
