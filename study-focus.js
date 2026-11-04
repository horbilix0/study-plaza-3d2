export const focusMinutes=[15,25,40];
const durations=focusMinutes.map(m=>m*60);
const initial=()=>({duration:1500,left:1500,ends:0,completed:0});
export function focusState(raw,now){
  if(!raw||!durations.includes(raw.duration)||!Number.isFinite(raw.left)||!Number.isFinite(raw.ends))return initial();
  const state={duration:raw.duration,left:Math.max(0,Math.min(raw.duration,raw.left)),ends:Math.max(0,raw.ends),completed:Number.isSafeInteger(raw.completed)&&raw.completed>=0?raw.completed:0};
  if(state.ends){
    state.left=Math.min(state.duration,Math.max(0,Math.ceil((state.ends-now)/1000)));
    if(state.left===0){state.ends=0;state.completed++;}
  }
  return state;
}
export function changeFocus(raw,action,now,minutes){
  const state=focusState(raw,now);
  if(action==='toggle'){
    state.ends=state.ends?0:now+1000*(state.left||state.duration);
    if(state.ends&&!state.left)state.left=state.duration;
  }else if(action==='reset'){
    state.ends=0;state.left=state.duration;
  }else if(action==='duration'&&!state.ends&&focusMinutes.includes(minutes)){
    state.duration=minutes*60;state.left=state.duration;
  }
  return state;
}
