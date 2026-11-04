export const relaySymbols=[
 {id:'star',glyph:'✦',name:'Yıldız'},
 {id:'moon',glyph:'☾',name:'Ay'},
 {id:'leaf',glyph:'❋',name:'Yaprak'},
 {id:'wave',glyph:'≈',name:'Dalga'},
];
export const relayRounds=3;
const roundMs=35_000;
function pattern(length,randomIndex){
 const result=[];
 for(let i=0;i<length;i++){
  const choices=relaySymbols.filter(item=>item.id!==result.at(-1));
  result.push(choices[randomIndex(choices.length)].id);
 }
 return result;
}
export function relayLobby(key,memberId){
 return {key,players:[memberId],status:'waiting',round:0,sequence:[],progress:0,mistakes:0,deadline:0};
}
export function startRelay(lobby,memberId,now,randomIndex){
 if(lobby.status!=='waiting'||lobby.players.includes(memberId))return null;
 return {...lobby,players:[...lobby.players,memberId],status:'playing',sequence:pattern(3,randomIndex),deadline:now+roundMs};
}
export function relayRoles(game){
 return {caller:game.players[game.round%2],solver:game.players[1-game.round%2]};
}
export function expireRelay(game,now){
 return game?.status==='playing'&&game.deadline<=now?{...game,status:'timeout'}:game;
}
export function relayInput(raw,memberId,input,now,randomIndex){
 const game=expireRelay(raw,now);
 if(game!==raw)return game;
 if(game?.status!=='playing'||relayRoles(game).solver!==memberId||game.key!==input.key||game.round!==input.round||game.progress!==input.progress)return null;
 if(!relaySymbols.some(item=>item.id===input.symbol))return null;
 if(game.sequence[game.progress]!==input.symbol)return {...game,progress:0,mistakes:game.mistakes+1};
 const progress=game.progress+1;
 if(progress<game.sequence.length)return {...game,progress};
 if(game.round+1===relayRounds)return {...game,progress,status:'won'};
 const round=game.round+1;
 return {...game,round,progress:0,sequence:pattern(round+3,randomIndex),deadline:now+roundMs};
}
export function relayView(game,viewerId){
 if(!game)return null;
 const {sequence,...publicGame}=game;
 return {...publicGame,length:sequence.length,sequence:game.status==='playing'&&relayRoles(game).caller===viewerId?sequence:undefined};
}
