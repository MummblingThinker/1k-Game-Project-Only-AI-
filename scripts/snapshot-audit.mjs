import {createHash} from 'node:crypto';

// Compare observed broadcasts, never mutate the server or add a test endpoint.
// Actions can legitimately publish several changes at one simulation tick, so
// pair the ordered occurrence within that tick rather than only its timestamp.
export function snapshotAudit(party,onError){
  const rows=new Map(),occurrences=Array.from({length:party},()=>new Map()),matched=new Map();
  return {
    observe(index,state){
      if(party<2||state.players?.length!==party||!['playing','victory','cutscene','ending'].includes(state.phase))return;
      const base=JSON.stringify([state.runId,state.level,state.phase,state.tick,state.storyTick]);
      const counts=occurrences[index],ordinal=counts.get(base)||0;counts.set(base,ordinal+1);
      if(counts.size>240)counts.delete(counts.keys().next().value);
      const key=base+':'+ordinal;
      const {you,playerId,...shared}=state;
      const hash=createHash('sha256').update(JSON.stringify(shared)).digest('hex');
      let row=rows.get(key);
      if(!row){row={hash,peers:new Set()};rows.set(key,row);}
      if(row.hash!==hash)onError(`Shared snapshot differs: level ${state.level}, phase ${state.phase}, tick ${state.tick}, peer ${index}`);
      row.peers.add(index);
      if(row.peers.size===party){matched.set(state.level,(matched.get(state.level)||0)+1);rows.delete(key);}
      // Keep only a small recent window; a wholly missing stream is caught by
      // per-stage match counts and the existing shared-state timeout checks.
      if(rows.size>1200)rows.delete(rows.keys().next().value);
    },
    count(level){return matched.get(level)||0;},
    result(){return Object.fromEntries(matched);}
  };
}
