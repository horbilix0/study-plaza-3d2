export const limits={minX:-12,maxX:12,minZ:-11,maxZ:12};
const stationInfo=[
  ['study','Ortak masa','⌘','Ders ve notlar'],
  ['quiz','Quiz köşesi','◇','Grup soruları'],
  ['arcade','Mola köşesi','✧','Oyunlar'],
  ['closet','Avatar köşesi','◉','Görünüm'],
];

const definitions={
  garden:{name:'Botanik Avlu',caption:'Açık hava kampüsü',icon:'✿',description:'Cam sera, taş yollar ve su sesi eşliğinde açık hava masaları.',palette:['#7FA184','#DBD2AC','#4F806D','#FAE1AA'],fog:'#C2D3BD',stops:[[-6.6,-2.95],[6.4,-4.6],[6.7,6.8],[-6.5,6.5]],solid:[[0,-3.7,1.65,1.65],[0,-9.7,5.5,1.15],[-9.3,-4.8,1.15,.55],[9.4,-.1,1.1,.55],[-8.9,-7.4,.91,.4],[9.4,9.6,.91,.4],...[-10.5,-8.4,8.7,10.9].flatMap(x=>[-8.1,8.3].map(z=>[x,z,.18,.18]))]},
  library:{name:'Meşe Kütüphanesi',caption:'Sessiz okuma salonu',icon:'▤',description:'Yüksek raflar, pencere ışığı ve halı kaplı okuma adaları.',palette:['#A97455','#E4BE90','#855860','#FFE4A8'],fog:'#C8A986',stops:[[-5.8,-1.4],[6.4,-4.6],[6.6,6.5],[-7.8,6.2]],solid:[[0,-10.5,13,.98],[-11.1,-2.2,.54,5],[11.1,-2.2,.54,5],[0,-5.8,1.08,.68],[-9.6,-.2,.91,.4],[9.6,-.2,.91,.4]]},
  beach:{name:'Gün Batımı İskelesi',caption:'Kıyı çalışma kampı',icon:'≈',description:'Deniz feneri, palmiye gölgeleri ve denize açılan ahşap teras.',palette:['#E1B87D','#EAD7AA','#278C90','#F7D69F'],fog:'#EAC9B1',stops:[[-6.8,-3.8],[6.6,-2.5],[7.6,7.4],[-6.6,6.6]],solid:[[0,-8.85,1.45,1.35],[-10.2,-5.9,.35,.35],[10.1,-6.3,.35,.35],[10.2,5.9,.35,.35],[-10.3,8.3,.28,.28],[-9.6,-9.3,.91,.4],[9.7,-9.3,.91,.4]]},
  moon:{name:'Ay Işığı Gözlemevi',caption:'Gece kampüsü',icon:'☾',description:'Bakır teleskop, ışıklı yürüyüş yolları ve yıldızların altında bir kampüs.',palette:['#314364','#546588','#8C8AE1','#FFD6A2'],fog:'#5D638A',stops:[[-7.3,-2.6],[6.6,-3.1],[6.5,6.3],[-6.4,6.8]],solid:[[0,-7,2.12,1.95],[-10.1,-4.6,.45,.45],[10.4,-4.8,.45,.45]]},
};
export const maps=Object.fromEntries(Object.entries(definitions).map(([id,map])=>{
  const stations=stationInfo.map(([key,name,icon,action],i)=>{
    const [x,z]=map.stops[i];
    return {id:key,name,icon,action,x,z,y:key==='study'?2.65:2.08};
  });
  const [deskX,deskZ]=map.stops[0];
  const seats=[-.65,.65].map((dx,i)=>({id:i?'right':'left',x:deskX+dx,z:deskZ+1.28,yaw:Math.PI}));
  const solids=[...map.solid,...stations.map(({x,z,id})=>[x,z,id==='study'?1.38:.94,id==='study'?.71:.48])];
  return [id,{...map,id,stations,seats,solids}];
}));
export const sceneLayout=id=>maps[id]||maps.garden;
export const seats=maps.garden.seats;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));

export function canStand(x,z,scene){
  return Number.isFinite(x)&&Number.isFinite(z)&&x>=limits.minX&&x<=limits.maxX&&z>=limits.minZ&&z<=limits.maxZ
    && !sceneLayout(scene).solids.some(([cx,cz,w,d])=>Math.abs(x-cx)<w+.24&&Math.abs(z-cz)<d+.24);
}

export function walk(position,dx,dz,scene) {
  const x=clamp(position.x+dx,limits.minX,limits.maxX),z=clamp(position.z+dz,limits.minZ,limits.maxZ);
  if(canStand(x,position.z,scene))position.x=x;
  if(canStand(position.x,z,scene))position.z=z;
  return position;
}

export function reachable(from,to,scene) {
  if(!canStand(to.x,to.z,scene)||!canStand(from.x,from.z,scene))return false;
  const distance=Math.hypot(to.x-from.x,to.z-from.z);
  const steps=Math.max(1,Math.ceil(distance/.19));
  for(let i=1;i<=steps;i++)if(!canStand(from.x+(to.x-from.x)*i/steps,from.z+(to.z-from.z)*i/steps,scene))return false;
  return true;
}
export const avatarOptions={
 hair:{sweep:'Yandan taralı',bob:'Kısa küt',curly:'Kıvırcık',bun:'Topuz'},
 hairColor:{espresso:'#362637',honey:'#A96842',gold:'#D6A764',berry:'#713650',ink:'#263C55'},
 tone:{warm:'#F0BC95',porcelain:'#F5D4BB',olive:'#CA956D',cocoa:'#A96D53',deep:'#7E483F'},
 expression:{smile:'Gülümse',calm:'Sakin',surprised:'Şaşkın'},
 outfit:{hoodie:'Kapüşonlu',varsity:'Kampüs ceketi',overalls:'Tulum'},
 accessory:{none:'Yok',glasses:'Gözlük',pin:'Saç tokası',bag:'Sırt çantası'},
};
export const defaultAvatar={hair:'sweep',hairColor:'espresso',tone:'warm',expression:'smile',outfit:'hoodie',accessory:'none'};
export function cleanAvatar(input,current=defaultAvatar) {
  return Object.fromEntries(Object.entries(avatarOptions).map(([key,options])=>[key,
    Object.hasOwn(options,input?.[key])?input[key]:Object.hasOwn(options,current?.[key])?current[key]:defaultAvatar[key],
  ]));
}
