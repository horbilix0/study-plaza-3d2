export const limits={minX:-11,maxX:11,minZ:-11,maxZ:11};
export const seats=[
  {id:'left',x:-6.26,z:-1.74,yaw:Math.PI},
  {id:'right',x:-4.75,z:-1.74,yaw:Math.PI},
];
const campus=[
  [-5.5,-2.95,1.35,.72],[-5.5,-4.52,1.25,.18],
  [5.25,-3.25,1.85,1.85],[5.35,4.4,1.9,.56],
  [-5.5,4.45,1.31,.42],
];
const extras={garden:[[0,-3.4,1.35,1.35],[-8,0,.92,.35],[8,0,.92,.35]],library:[[0,-11.45,12,.65]],beach:[[-9,2.1,.92,.35],[9,2.1,.92,.35]],moon:[]};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));

export function canStand(x,z,scene){
  return Number.isFinite(x)&&Number.isFinite(z)&&x>=limits.minX&&x<=limits.maxX&&z>=limits.minZ&&z<=limits.maxZ
    && ![...campus,...(extras[scene]||[])].some(([cx,cz,w,d])=>Math.abs(x-cx)<w+.24&&Math.abs(z-cz)<d+.24);
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
