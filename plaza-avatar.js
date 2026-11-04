import {avatarOptions,cleanAvatar,seats} from './plaza-shared.js';

export const profiles={
 face:[[.5,0,0],[.46,.23,-.015],[.34,.41,-.018],[.14,.50,.005],[-.08,.49,.022],[-.25,.42,.045],[-.39,.31,.066],[-.48,.15,.08],[-.5,0,.075]],
 jacket:[[.5,0,0],[.48,.23,0],[.40,.43,0],[.26,.5,0],[-.05,.45,0],[-.31,.44,0],[-.45,.40,0],[-.5,0,0]],
 cuff:[[.5,0,0],[.46,.3,0],[.29,.46,0],[.05,.5,0],[-.3,.43,0],[-.44,.32,0],[-.5,0,0]],
 shoe:[[.5,0,-.16],[.39,.34,-.10],[.16,.45,-.06],[-.20,.5,.055],[-.42,.48,.03],[-.5,0,0]],
 fringe:[[.5,0,-.08],[.46,.21,-.07],[.29,.44,-.02],[.01,.5,.01],[-.27,.43,.08],[-.44,.21,.16],[-.5,0,.18]],
};

const palettes={mint:['#428E81','#D2F1E1','#405671'],peach:['#D78085','#FFE4D7','#62557D'],blue:['#568AC2','#E1F1FF','#3E5478'],lilac:['#9271BF','#F1DEFA','#5A526C'],yellow:['#CF9740','#FFF0B7','#536B60']};
const legacy={peach:{tone:'cocoa'},blue:{hairColor:'honey',tone:'porcelain'},lilac:{hairColor:'ink',tone:'olive'},yellow:{hairColor:'ink',tone:'deep'}};
const mix=(from,to,k)=>from+(to-from)*k;

export function drawStudent(world,p,a,local,now,dt,speed){
 const style=cleanAvatar(p.avatar,legacy[p.skin]);
 const [cloth,trim,pants]=palettes[p.skin]||palettes.mint;
 const skin=avatarOptions.tone[style.tone],hair=avatarOptions.hairColor[style.hairColor];
 const targetPose=local?world.pose:p.pose;
 const seat=seats.find(s=>s.id===(local?world.seat:p.seat));
 const hop=local?world.jumpHeight:(p.jump||0);
 const k=1-Math.exp(-dt*12);
 a.seated=mix(a.seated||0,seat?1:0,k);
 a.study=mix(a.study||0,targetPose==='study'?1:0,k);
 a.air=mix(a.air||0,hop>.045?1:0,k);
 a.wave=mix(a.wave||0,targetPose==='wave'?1:0,k);
 a.emote=mix(a.emote||0,targetPose==='emote'?1:0,k);
 a.hop=mix(a.hop||0,hop,k);
 a.run=mix(a.run||0,speed>4.5?1:0,k);
 const stride=a.walk*(.55+.26*a.run)*(1-a.seated)*(1-a.air*.8);
 const gait=Math.sin(a.phase);
 const bob=Math.sin(now*.0028+a.seed)*.014+Math.abs(gait)*.06*stride+a.hop-.38*a.seated;
 const theta=a.heading,cs=Math.cos(theta),sn=Math.sin(theta);
 const draw=(type,x,y,z,sx,sy,sz,color,rx=0,rz=0)=>world.draw({
  type,x:a.x+cs*x+sn*z,y:y+bob,z:a.z-sn*x+cs*z,sx,sy,sz,color,r:theta,rx,rz,
 });
 const limb=(type,x,y,z,width,length,depth,angle,color)=>{
  draw(type,x,y-Math.cos(angle)*length/2,z-Math.sin(angle)*length/2,width,length*1.13,depth,color,angle);
  return [y-Math.cos(angle)*length,z-Math.sin(angle)*length];
 };
 world.draw({type:'sphere',x:a.x,y:.022,z:a.z,sx:.91,sy:.026,sz:.64,color:world.scene==='moon'?'#344757':'#88A99C'});
 draw('jacket',0,.87,0,.69,.41,.48,pants);
 for(const side of [-1,1]){
  const step=side*gait*stride;
  const thigh=mix(step,-1.52,a.seated)-a.air*.3;
  const knee=mix(step+Math.max(0,-step)*.75,0,a.seated)+a.air*.45;
  const [ky,kz]=limb('cuff',side*.19,.91,0,.32,.42,.31,thigh,pants);
  const [fy,fz]=limb('cuff',side*.19,ky,kz,.26,.36,.26,knee,pants);
  draw('shoe',side*.19,fy+.022,fz+.075,.32,.22,.51,trim,knee*.22);
  draw('shoe',side*.19,fy+.076,fz+.069,.31,.17,.50,cloth,knee*.22);
 }
 const top=style.outfit==='overalls'?trim:cloth;
 draw('jacket',0,1.23,0,.86,.81,.57,top,-a.study*.13);
 draw('cuff',0,1.64,.002,.27,.27,.25,skin);
 if(style.outfit==='hoodie'){
  draw('fringe',0,1.53,-.18,.53,.36,.38,cloth,-.15);
  draw('jacket',0,1.08,.278,.40,.25,.06,trim);
  for(const side of [-1,1])draw('cuff',side*.096,1.38,.283,.026,.25,.029,trim,-.09);
 }else if(style.outfit==='varsity'){
  draw('cuff',0,1.22,.289,.025,.57,.025,trim);
  draw('sphere',-.15,1.42,.284,.095,.095,.045,trim);
 }else{
  draw('jacket',0,1.19,.273,.46,.49,.08,cloth);
  for(const side of [-1,1])draw('cuff',side*.15,1.44,.259,.105,.36,.08,cloth);
 }
 for(const side of [-1,1]){
  const wave=side===1?a.wave:0;
  const arm=-side*gait*stride*.83-a.study*.72-a.air*.45;
  const bend=arm-.24-a.study*.35;
  const sleeve=style.outfit==='varsity'?trim:top;
  const [ey,ez]=limb('cuff',side*.445,1.54,.004,.29,.34,.30,arm-wave*2.55,sleeve);
  const [hy,hz]=limb('cuff',side*(.475+wave*.1),ey,ez,.22,.29,.21,bend-wave*(2.75+Math.sin(now*.023)*.25),sleeve);
  draw('face',side*(.49+wave*.12),hy,hz,.19,.24,.18,skin,bend-wave*2.7);
 }
 if(a.study>.18){
  draw('jacket',0,1.12,.52,.44,.10,.30,'#8D80C3',-.27);
  draw('jacket',0,1.145,.52,.39,.10,.27,'#FFFBEC',-.27);
 }
 const tilt=a.study*.23-a.emote*.15,head=1.995;
 draw('face',0,head,0,.87,.87,.76,skin,tilt);
 for(const side of [-1,1]){
  draw('face',side*.424,head-.05,.014,.155,.226,.172,skin,tilt);
  draw('sphere',side*.459,head-.05,.075,.09,.12,.036,'#C97C77');
 }
 draw('fringe',0,head+.237,-.072,.90,.57,.79,hair,-.08);
 if(style.hair==='sweep'){
  draw('fringe',-.14,head+.277,.186,.57,.42,.53,hair,-.20,-.45);
  draw('fringe',.206,head+.196,.147,.37,.39,.46,hair,-.20,.38);
 }else if(style.hair==='bob'){
  for(const side of [-1,1])draw('fringe',side*.34,head-.013,-.008,.33,.57,.52,hair,-.10,side*.12);
  draw('fringe',0,head+.22,.221,.64,.28,.46,hair,-.24);
 }else if(style.hair==='curly'){
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4;
   draw('fringe',Math.cos(angle)*.30,head+.29+(i%2)*.04,Math.sin(angle)*.26,.36,.40,.36,hair,i*.2,.38);
  }
 }else{
  draw('fringe',.09,head+.49,-.19,.41,.43,.40,hair,.30);
  draw('fringe',-.19,head+.25,.17,.36,.33,.48,hair,-.19,-.22);
 }
 const blink=Math.sin(now*.00185+a.seed*1.3)>.994;
 const surprise=Math.max(style.expression==='surprised'?1:0,a.emote);
 for(const side of [-1,1]){
  draw('sphere',side*.17,head-.004-tilt*.12,.371,.139,blink?.024:.16+.036*surprise,.065,'#FFF9F0');
  if(!blink){
   draw('sphere',side*.167,head-.009-tilt*.12,.408,.083,.121,.043,'#403246');
   draw('sphere',side*.156,head+.025-tilt*.12,.43,.028,.031,.013,'#FFFFFF');
  }
  draw('cuff',side*.174,head+.12+.045*surprise,.365,.033,.129,.027,hair,0,side*1.31);
  draw('sphere',side*.279,head-.122,.333,.123,.055,.04,'#D58282');
 }
 draw('face',0,head-.084,.406,.125,.115,.132,skin,tilt);
 draw('sphere',0,head-.19,.391,style.expression==='calm'?.108:.166,.04+.095*surprise,.036,'#894C59');
 if(style.expression==='smile'&&surprise<.2)draw('sphere',0,head-.184,.411,.104,.019,.015,'#FFE3D7');
 if(style.accessory==='glasses'){
  for(const side of [-1,1])draw('ring',side*.17,head+.007,.435,.228,.202,.23,'#3D5369');
  draw('sphere',0,head,.437,.15,.028,.025,'#3D5369');
 }
 if(style.accessory==='pin')draw('cuff',-.318,head+.208,.343,.05,.17,.038,'#F3CA65',0,-.88);
 if(style.accessory==='bag')draw('jacket',0,1.19,-.327,.63,.62,.36,'#B4686C');
 if(p.hat==='cap'){
  draw('fringe',0,head+.304,-.037,.95,.41,.82,'#5D82C5');
  draw('shoe',0,head+.18,.366,.79,.065,.48,'#426BAC');
 }else if(p.hat==='beanie'){
  draw('face',0,head+.36,-.025,.96,.45,.84,'#A77AC8');
  draw('shoe',0,head+.21,-.022,.97,.18,.86,'#895EAC');
  draw('sphere',0,head+.60,-.025,.22,.23,.21,'#E9C5F7');
 }else if(p.hat==='crown'){
  draw('cyl',0,head+.49,0,.62,.14,.62,'#E5A84E');
  for(let i=0;i<5;i++){const angle=i*Math.PI*2/5;draw('cone',Math.sin(angle)*.24,head+.64,Math.cos(angle)*.24,.19,.29,.19,'#FFCF71');}
 }else if(p.hat==='star'){
  draw('cyl',0,head+.55,0,.06,.24,.06,'#DDA74B');
  draw('face',0,head+.72,0,.28,.33,.17,'#FFD66F');
 }else if(p.hat==='wizard'){
  draw('cyl',0,head+.25,0,.99,.105,.92,'#695495');
  draw('cone',0,head+.61,-.06,.72,.82,.70,'#8264B7',-.17);
 }
}
