// Static low-poly campus scenery. Layout coordinates and solid footprints live in plaza-shared.js.
import {sceneLayout} from './plaza-shared.js';

export function buildCampus(world,id) {
  const map=sceneLayout(id);
  const [ground,path,accent,light]=map.palette;
  const box=(x,y,z,w,h,d,c,rz=0,rx=0,yaw=0)=>world.add('cube',x,y,z,w,h,d,c,yaw,rx,rz);
  const orb=(x,y,z,w,h,d,c)=>world.ball(x,y,z,w,h,d,c);
  const cyl=(x,y,z,w,h,d,c,rx=0,yaw=0)=>world.add('cyl',x,y,z,w,h,d,c,yaw,rx);
  const taper=(x,y,z,w,h,d,c)=>world.cone(x,y,z,w,h,d,c);
  const shadow=(x,z,w,d,c)=>orb(x,.012,z,w,.016,d,c);
  const stone=(x,z,w,d,c)=>box(x,.015,z,w,.055,d,c);
  const posts=(x,z,w,d,h,c)=>{
    for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])box(x+dx,h/2,z+dz,.12,h,.12,c);
  };
  const beam=(x,y,z,w,d,c)=>box(x,y,z,w,.15,d,c);
  const pathRun=(x,z,count,axis=0,width=2.8)=>{
    for(let n=0;n<count;n++)for(let band=-1;band<=1;band++){
      const along=n*1.05,offset=band*width/3;
      box(x+(axis?along:offset),axis?.017:.015,z+(axis?offset:along),axis?1.026:width/3-.027,.052,axis?width/3-.027:1.026,n%5===1&&band===0?light:path);
    }
  };
  const tree=(x,z,scale=1,night=false)=>{
    const bark=night?'#4E4B67':'#89694F',colors=night?['#515E7C','#697696','#62739A']:['#477B60','#6D9B6F','#83AF79'];
    shadow(x,z,2.4*scale,1.45*scale,night?'#283650':'#638873');
    cyl(x,scale*.92,z,.25*scale,1.85*scale,.25*scale,bark);
    for(let i=0;i<3;i++){
      const a=i*2.39;
      world.add('fringe',x+Math.cos(a)*.52*scale,(1.85+(i===1?.47:0))*scale,z+Math.sin(a)*.49*scale,1.7*scale,1.95*scale,1.58*scale,colors[i],a,.15,.2);
    }
  };
  const grass=(x,z,night=false)=>{
    for(let j=0;j<3;j++){
      const a=j*2.09;
      world.add('fringe',x+.14*Math.sin(a),.18+.07*(j%2),z+.12*Math.cos(a),.12,.39,.15,night?'#8590AA':'#8EA56C',a,0,.27);
    }
  };
  const lamp=(x,z,night=false)=>{
    const metal=night?'#525B78':'#526761';
    cyl(x,.10,z,.47,.19,.47,metal);cyl(x,.94,z,.085,1.61,.085,metal);
    orb(x,1.8,z,.33,.32,.33,night?'#FFCD96':'#FFE2A9');
    if(night)orb(x,.04,z,1.36,.044,1.17,'#8F766F');
    taper(x,1.98,z,.38,.14,.38,metal);
  };
  const hedge=(x,z,w,d,c)=>{
    stone(x,z,w,d,'#B6B69C');
    box(x,.20,z,w,.38,d,'#8D927D');
    for(let i=0;i<Math.ceil(w/.54);i++)orb(x-w/2+.27+i*.54,.62,z,.73,.66,d*.83,c);
  };
  const book=(x,y,z,i=0)=>box(x,y,z,.17+(i%3)*.018,.32+(i%4)*.09,.28,['#A46655','#698979','#676D89','#CE9A56','#E1BF87','#855D70'][i%6],i%7===1?.13:0);
  const chair=(x,z,c,back)=>{
    shadow(x,z,.78,.63,back);
    box(x,.38,z,.67,.125,.61,c);
    box(x,.72,z+.26,.66,.58,.095,c);
    for(const dx of [-.24,.24])for(const dz of [-.21,.21])box(x+dx,.18,z+dz,.065,.35,.065,back);
  };
  const desk=(x,z,wall)=>{
    shadow(x,z,3.12,1.8,wall);
    box(x,.674,z,2.77,.12,1.42,'#C89465');
    box(x,.733,z,2.70,.026,1.35,'#E2B986');
    box(x,.583,z,2.38,.10,.83,wall);
    for(const dx of [-1.16,1.16])for(const dz of [-.53,.53])box(x+dx,.31,z+dz,.096,.63,.096,wall);
    for(const [dx,cover] of [[-.65,'#526E84'],[.65,'#B76257']]){
      box(x+dx,.752,z+.16,.67,.017,.43,cover);
      for(const side of [-1,1]){
        box(x+dx+side*.16,.772,z+.16,.30,.034,.394,'#FFF0D4',side*.11);
        for(let line=0;line<4;line++)box(x+dx+side*.15,.794,z+.061+line*.052,.215,.005,.009,'#BDA887');
      }
      box(x+dx,.787,z+.16,.026,.022,.4,'#A68566');
    }
    box(x-.22,.761,z+.41,.22,.021,.024,'#AD554C',0,0,.40);
    cyl(x+.57,.766,z-.42,.27,.041,.25,'#E1C09A');
    cyl(x+.57,.824,z-.42,.13,.09,.13,'#A76559');
    cyl(x+.57,.873,z-.42,.108,.009,.108,'#665048');
    world.add('ring',x+.652,.827,z-.42,.07,.074,.045,'#A76559',Math.PI/2);
    cyl(x-.59,.771,z-.42,.25,.05,.25,wall);
    box(x-.59,.92,z-.43,.036,.29,.036,wall,.23);
    box(x-.66,1.062,z-.38,.041,.044,.20,wall,0,-.22);
    taper(x-.66,1.041,z-.27,.20,.13,.21,accent);
    cyl(x-.66,.982,z-.27,.126,.026,.126,'#FFE5A4');
    for(const seat of map.seats)chair(seat.x,seat.z,accent,wall);
  };
  const canopy=(x,z,w,d,frame,top)=>{
    posts(x,z,w,d,2.21,frame);
    beam(x,2.24,z-d/2,w+.22,.12,frame);beam(x,2.24,z+d/2,w+.22,.12,frame);
    for(let i=0;i<8;i++)box(x-w/2+.06+i*w/7,2.34,z,.075,.12,d+.36,top);
  };
  const bloom=(x,z)=>{
    shadow(x,z,1.55,.92,'#638B72');
    orb(x,.075,z,1.25,.14,.81,'#6E9775');
    for(let i=0;i<10;i++){
      const a=i*2.39996,dx=Math.cos(a)*(.23+i*.035),dz=Math.sin(a)*(.15+i*.025),y=.22+i%4*.06;
      cyl(x+dx,y*.5,z+dz,.027,y,.027,'#577E60');
      orb(x+dx,y,z+dz,.19,.12,.17,['#F7D6A0','#E8A18C','#D4BCD4'][i%3]);
    }
  };
  const bench=(x,z,c)=>{
    shadow(x,z,2.0,.84,'#7B8A74');
    for(let i=0;i<3;i++)box(x,.40,z-.22+i*.18,1.79,.075,.15,'#D9B684');
    box(x,.68,z-.30,1.79,.21,.055,'#C7A878');
    for(const dx of [-.70,.70])for(const dz of [-.24,.22])box(x+dx,.19,z+dz,.09,.38,.09,c);
  };
  const station=(s)=>{
    const {id:key,x,z}=s, frame=id==='moon'?'#546584':id==='library'?'#7B5550':'#5A7468';
    const trim=key==='quiz'?'#9C9CC3':key==='arcade'?'#D78D6E':accent;
    if(key==='study'){
      stone(x,z+.36,3.5,2.8,path);
      if(id==='garden')canopy(x,z,3.34,2.45,frame,light);
      if(id==='library'){
        stone(x,z+.35,3.50,2.76,'#B68180');
        cyl(x-1.48,1.03,z-.55,.075,1.96,.075,frame);
        taper(x-1.48,1.92,z-.55,.49,.41,.49,'#DDB275');
      }
      if(id==='beach'){
        posts(x,z,3.26,2.23,2.21,frame);
        for(let i=0;i<8;i++)box(x-1.49+i*.43,2.26,z,.43,.085,2.58,i%2?'#DC9C83':'#F0D9AE',0,.07);
      }
      if(id==='moon'){
        for(const dx of [-1.62,1.62])box(x+dx,1.18,z-.62,.085,2.36,.11,frame,dx*.17);
        box(x,2.28,z-.62,2.72,.10,.13,'#A5A9D1');
        for(const dx of [-.92,0,.92])orb(x+dx,2.16,z-.61,.19,.19,.19,'#FFD3A2');
      }
      desk(x,z,frame);
      return;
    }
    shadow(x,z,2.5,1.42,frame);
    if(key==='arcade'){
      const cabinet=(cx,body,bezel,pixels)=>{
        const dark='#203344';
        world.add('arcadeCabinet',cx,.81,z,.88,1.62,.97,body);
        box(cx,.071,z,.91,.12,.93,dark);
        for(const side of [-1,1]){
          box(cx+side*.446,.46,z+.05,.018,.55,.58,bezel,0,-.11);
          box(cx+side*.457,.48,z+.06,.010,.26,.28,pixels,0,-.16);
        }
        box(cx,1.24,z+.307,.74,.52,.22,dark,0,-.27);
        box(cx,1.24,z+.434,.62,.38,.04,bezel,0,-.27);
        box(cx,1.24,z+.462,.54,.30,.035,'#1B293D',0,-.27);
        for(const [i,offset] of [-.17,-.055,.055,.17].entries()){
          box(cx+offset,1.247,z+.486,.055,.055,.016,pixels,i%2?0:Math.PI/4,-.27);
        }
        box(cx,1.16,z+.507,.29,.014,.014,bezel,0,-.27);
        box(cx,1.54,z+.208,.77,.13,.37,dark);
        box(cx,1.55,z+.402,.57,.06,.023,bezel);
        box(cx,.925,z+.36,.76,.12,.37,dark,0,-.13);
        cyl(cx-.23,.994,z+.383,.115,.022,.108,dark);
        cyl(cx-.23,1.033,z+.383,.031,.077,.031,bezel);
        orb(cx-.23,1.081,z+.383,.078,.077,.078,pixels);
        for(const [i,dx] of [.02,.15,.28].entries())cyl(cx+dx,.996+(i%2)*.006,z+.408,.067,.031,.067,i===1?bezel:pixels);
        box(cx,.51,z+.492,.22,.22,.032,dark);
        box(cx,.559,z+.51,.099,.024,.015,bezel);
        box(cx,.457,z+.51,.065,.042,.015,'#0F2132');
      };
      cabinet(x-.52,'#3B5D78','#82D2C7','#FFE29C');
      cabinet(x+.52,'#76546A','#E1A487','#CBE7F3');
      return;
    }
    if(key==='quiz'){
      const base='#354D66',metal='#5A7188',glow='#BEE3D7';
      world.add('arcadeCabinet',x,.64,z,1.85,1.28,.88,base);
      box(x,.085,z,1.91,.15,.93,'#28394C');
      box(x,.33,z+.45,1.45,.34,.035,metal);
      box(x,.33,z+.475,1.29,.045,.016,glow);
      box(x,1.155,z+.17,1.76,.17,.59,metal,0,-.16);
      box(x,1.49,z-.113,1.59,.62,.16,base,0,-.15);
      box(x,1.49,z-.021,1.41,.49,.045,'#202F49',0,-.15);
      for(const [i,width] of [.69,.56,.63].entries()){
        const y=1.60-i*.11;
        box(x-.47,y,z+.014+i*.015,.07,.058,.017,i===0?'#F3BE82':glow);
        box(x-.33+width/2,y,z+.014+i*.015,width,.026,.015,i===0?glow:'#708FAA');
      }
      for(const [i,dx] of [-.34,-.11,.12,.35].entries())cyl(x+dx,1.267,z+.298,.105,.036,.105,i===0?'#E5AF83':glow);
      return;
    }
    box(x,.46,z,1.85,.87,.84,frame);
    box(x,.48,z+.426,1.52,.45,.05,trim);
    box(x,.93,z,1.99,.14,1.02,light);
    for(const dx of [-.66,.66])box(x+dx,1.23,z-.3,.071,.54,.071,frame);
    box(x,1.53,z-.30,1.45,.055,.067,frame);
    for(let j=0;j<3;j++){
      const dx=(j-1)*.41;
      world.add('jacket',x+dx,1.24,z-.23,.36,.44,.12,['#A4A9D7','#E6A889',trim][j],0,0,.08*(j-1));
    }
  };

  box(0,-.73,0,28,1.39,26,id==='beach'?'#C68D6C':'#64706A');
  box(0,-.15,0,27.8,.28,25.8,ground);
  if(id==='garden'){
    box(0,-.73,0,70,.22,65,'#9AAE83');
    pathRun(0,-10.1,23,0,3.2);pathRun(-11.9,1.15,24,1,2.75);
    box(0,.028,-3.7,5.45,.052,5.45,'#B1B9A0');
    cyl(0,.12,-3.7,3.48,.24,3.48,'#E1DCC2');
    cyl(0,.245,-3.7,3.09,.07,3.09,'#78B2AE');
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      orb(Math.cos(a)*1.44,.30,-3.7+Math.sin(a)*1.44,.55,.13,.55,'#F0E5C8');
    }
    cyl(0,.49,-3.7,.59,.43,.59,'#AFC1AD');
    cyl(0,.76,-3.7,1.09,.13,1.09,'#E7D6A8');
    orb(0,.94,-3.7,.37,.30,.37,'#D0E0BE');
    // Conservatory with an articulated frame, opaque coloured glazing and pitched roof.
    const rail='#E2DDC7',glazing=['#81ABA0','#8DB8A7','#9BC0AC'];
    box(0,.18,-9.75,11.13,.34,2.9,'#97A692');
    box(0,1.63,-10.72,10.6,2.91,.17,'#698D7D');
    for(let i=-5;i<=5;i++){
      box(i*.92,1.53,-8.65,.86,2.61,.11,glazing[(i+6)%3]);
      box(i*.92-.43,1.56,-8.54,.055,2.75,.09,rail);
      box(i*.92,1.55,-8.51,.87,.05,.10,rail);
    }
    box(0,2.93,-8.64,10.9,.16,.16,rail);
    box(0,3.29,-9.24,11.15,.12,1.40,'#A8BEAE',0,.46);
    box(0,3.29,-10.52,11.15,.12,1.40,'#7FA79B',0,-.46);
    box(0,3.58,-9.88,11.25,.12,.12,rail);
    for(const dx of [-5.35,5.35])box(dx,1.50,-9.7,.14,2.85,2.38,rail);
    for(const x of [-10.5,-8.4,8.7,10.9])for(const z of [-8.1,8.3])tree(x,z,.93+(Math.abs(x)%2)*.10);
    for(const x of [-10.7,10.7])for(const z of [-.25,11.4])hedge(x,z,2.4,.72,'#769474');
    hedge(-9.3,-4.8,2.3,.92,'#7B9F78');hedge(9.4,-.1,2.2,.91,'#729B7B');
    for(const x of [-3.85,3.85])for(const z of [-6.5,4.6])lamp(x,z);
    for(let i=0;i<27;i++)grass(Math.sin(i*2.39)*10.4,Math.cos(i*2.39)*9.7);
    // Uneven hills, background cypress shapes and flower islands frame the courtyard.
    for(const [x,z,w,h,d,c] of [[-15,-18,18,4,9,'#719A75'],[-7,-22,17,6,10,'#8EAA79'],[9,-23,23,6,11,'#82A379'],[18,-15,13,4,8,'#79A078']])orb(x,.4,z,w,h,d,c);
    for(const [x,z,s] of [[-12,-12,1.1],[-10,-12.4,.8],[-8,-12.8,.7],[8,-12.3,1],[11,-11.9,1.1],[13,-10.5,.8]])tree(x,z,s);
    for(const [x,z] of [[-4.4,-7],[4.3,-7],[-4.7,8.8],[4.9,8.9],[-9.6,4.4],[9.4,4.8]])bloom(x,z);
    for(const [x,z] of [[-8.9,-7.4],[9.4,9.6]])bench(x,z,'#76866D');
    box(0,1.24,-8.48,1.39,2.47,.20,'#4D7465');
    box(0,1.22,-8.34,1.16,2.18,.10,'#7BAE96');
    for(const x of [-.58,0,.58])box(x,1.24,-8.26,.06,2.16,.06,'#E4DBBA');
    for(const y of [.22,1.44,2.32])box(0,y,-8.24,1.16,.06,.08,'#E4DBBA');
    box(0,2.54,-8.23,1.67,.11,.62,'#E1D8A7',0,.18);
    for(const x of [-1.41,1.41]){cyl(x,.21,-8.18,.34,.41,.36,'#AF7E63');orb(x,.56,-8.18,.48,.39,.48,'#76A178');}

  }else if(id==='library'){
    box(0,-.62,-1,34,.3,33,'#735954');
    for(let i=-20;i<=20;i++){
      const x=i*.66;
      box(x,.012,0,.63,.04,25.4,i%4===0?'#C08E66':i%3===0?'#AE7958':'#B88561');
      for(let j=0;j<5;j++)box(x,.035,-11+j*5.36+(i%3)*.87,.62,.005,.022,'#92664F');
    }
    box(0,.037,-.1,5.60,.025,16,'#D3A77E');box(0,.056,-.1,4.98,.019,15.35,'#AB7777');
    for(const x of [-2.23,2.23])box(x,.068,-.1,.035,.005,14.86,'#E6BE95');
    box(0,2.68,-10.68,25.3,5.44,.45,'#BD967D');
    for(const x of [-11.1,11.1])box(x,2.48,-2.2,.48,5.1,10.2,'#B38C77');
    for(const x of [-9.7,-6.5,-3.4,3.4,6.5,9.7]){
      box(x,1.91,-10.11,2.83,3.63,.63,'#79584B');
      box(x,3.82,-10.11,2.97,.18,.77,'#A87759');
      for(let level=0;level<4;level++){
        const y=.40+level*.79;
        box(x,y,-9.83,2.67,.087,.57,'#A77A60');
        for(let i=0;i<9;i++)book(x-1.13+i*.266,y+.24,-9.66,i+level*3+(x>0?2:0));
      }
    }
    box(0,3.02,-10.37,2.75,3.79,.16,'#80574B');
    box(0,2.95,-10.25,2.44,3.53,.16,'#C0D0C4');
    orb(0,4.41,-10.24,2.44,1.12,.18,'#DAD6B3');
    for(const x of [-.7,0,.7])box(x,3.01,-10.11,.048,3.5,.07,'#957061');
    for(const y of [2.2,3.48])box(0,y,-10.10,2.45,.063,.06,'#A57860');
    for(const x of [-10.64,10.64])for(const z of [-6,0,3]){
      box(x,2.2,z,.07,2.82,2.20,'#E5CEA5');
      box(x+(x<0?.045:-.045),2.2,z,.035,2.61,1.97,'#B5CEC2');
      box(x+(x<0?.07:-.07),2.2,z,.07,2.60,.06,'#A47E69');
    }
    for(const x of [-8.8,-4.5,4.5,8.8]){
      box(x,4.8,-6.4,.14,.16,8.1,'#80584C');
      cyl(x,4.30,-4.7,.06,1.08,.06,'#906E5D');
      taper(x,3.83,-4.7,1.05,.42,1.05,'#C99D66');
      orb(x,3.58,-4.7,.68,.15,.68,'#FFE3AC');
    }
    box(0,.67,-5.8,2.15,.16,1.36,'#78554A');
    box(0,.29,-5.8,1.83,.57,1.15,'#A67963');
    for(let i=0;i<4;i++)box(-.56+i*.34,.79+i*.04,-5.8,.65,.075,.39,'#E4C49B',.04*i);
    for(const y of [4.94,5.37])beam(0,y,-10.39,25.5,.48,'#926752');
    for(const x of [-10.56,10.56])beam(x,4.94,-2.2,.37,10.5,'#946B57');
    for(const x of [-9.6,9.6])bench(x,-.2,'#77584C');
  }else if(id==='beach'){
    box(0,-.48,0,90,.53,86,'#64A9AC');
    box(0,-.16,-12.47,29,.22,5.65,'#CF9F76');
    box(0,-.135,-13.65,30,.045,1.16,'#E4C79B');
    for(let i=0;i<12;i++){
      box(0,-.14,-15.1-i*1.8,48-(i%4)*3,.018,.11+(i%3)*.06,i%3===1?'#A7D0C3':'#88BDBA');
      box(15.6+i*1.45,-.14,2,.12,.017,31-(i%5)*1.7,'#9CC9BF');
    }
    for(let i=-17;i<=17;i++){
      box(i*.6,.006,-.55,.575,.065,5.8,i%3===0?'#B88769':'#C99A72');
      box(i*.6,.006,-10.1,.57,.065,5.33,i%4===0?'#AB775E':'#BA8A68');
    }
    for(let i=0;i<17;i++)box(0,.012,-2.4-i*.65,3.18,.061,.625,i%2?'#CD9C72':'#C08E6A');
    for(const x of [-11.7,11.7])for(let i=0;i<8;i++){
      const z=-10.3+i*2.83;
      cyl(x,.49,z,.14,.98,.14,'#977055');
      box(x,.78,z+1.30,.088,.10,2.64,'#D5B285');
    }
    // Lighthouse and gallery.
    cyl(0,.16,-8.85,2.92,.31,2.69,'#A5836D');
    for(let i=0;i<8;i++)cyl(0,.45+i*.46,-8.85,2.46-i*.10,.51,2.37-i*.10,i===2||i===5?'#B66B5A':'#E9D1B2');
    cyl(0,4.05,-8.85,2.26,.24,2.26,'#896B64');
    cyl(0,4.49,-8.85,1.55,.71,1.55,'#EED7A1');
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4;
      cyl(Math.cos(angle)*.76,4.50,-8.85+Math.sin(angle)*.76,.078,.75,.078,'#9B755B');
    }
    taper(0,5.06,-8.85,2.14,.76,2.14,'#9A5A56');
    const palm=(x,z)=>{
      for(let i=0;i<6;i++)cyl(x+i*.04,.24+i*.39,z,.26-i*.012,.45,.25-i*.01,i%2?'#9F7C5C':'#B18B61',0);
      for(let i=0;i<7;i++){
        const a=i*Math.PI*2/7;
        world.add('fringe',x+.22+Math.sin(a)*.58,2.39,z+Math.cos(a)*.58,.47,.26,1.75,i%2?'#779979':'#638F78',a,.16,.10);
      }
    };
    for(const [x,z] of [[-10.2,-5.9],[10.1,-6.3],[10.2,5.9],[-10.3,8.3]])palm(x,z);
    for(const x of [-8.2,8.6])lamp(x,1.7);
    for(const x of [-9.7,9.9])for(const z of [-9.3,10.7])grass(x,z);
    // A hazy setting sun and low islands make the waterfront readable from the spawn.
    orb(-10.5,7.3,-29,4.55,4.55,4.55,'#FFE2A8');
    for(const [x,z,w,h] of [[14,-31,14,2.4],[24,-24,17,2.2],[-24,-22,10,1.3]])orb(x,-.5,z,w,h,w*.47,'#9DAA96');
    for(const [x,z] of [[-9.0,7.8],[9.25,5.8]]){
      const cloth=x<0?'#D68C74':'#709C9B';
      cyl(x,1.07,z,.07,2.14,.07,'#86644F');taper(x,2.15,z,2.26,.68,2.26,cloth);
      cyl(x,1.89,z,2.2,.055,2.2,'#F0CD9D');
      for(const dx of [-.56,.56])box(x+dx,.22,z+.43,.50,.15,1.27,'#CEB492',0,-.16);
    }
    for(const x of [-9.6,9.7])bench(x,-9.3,'#AA7F66');
    for(let i=0;i<18;i++){
      const a=i*2.39,x=Math.cos(a)*(11.6+i%2*.18),z=Math.sin(a)*10.7;
      orb(x,.02,z,.18+i%3*.07,.068,.16,'#E6CC9F');
    }

  }else{
    box(0,-.72,0,68,.37,66,'#38476A');
    pathRun(0,-10.3,23,0,3.0);pathRun(-11.9,1.35,24,1,2.55);
    for(let i=0;i<29;i++){
      const a=i*2.399963,x=Math.sin(a)*(17+i%7),z=Math.cos(a)*(17+i%7);
      world.add('ridge',x,1.45+i%3*.45,z,4.9+(i%4),4.6+(i%5)*.52,4.3+(i%3),['#3D4B71','#4B5B84','#55638A'][i%3],a*.63);
    }
    for(let i=0;i<46;i++){
      const a=i*2.399963,r=19+(i%8)*2.1,size=.07+(i%4)*.038;
      orb(Math.sin(a)*r,7+i%12*.74,Math.cos(a)*r,size,size,size,i%5===0?'#FFD9A9':'#DFDFF8');
    }
    orb(-12.8,9.1,-20.3,3.1,3.10,2.7,'#F2D6AE');
    for(const [x,z] of [[-7,-7.3],[8.6,1.1],[-8.5,10.0],[8.2,-8.1],[3.8,9.8]]){
      shadow(x,z,1.45,.95,'#273655');
      for(let j=0;j<4;j++){
        const a=j*2.39;
        world.add('ridge',x+Math.cos(a)*.32,.13+j*.043,z+Math.sin(a)*.28,.49,.58+j*.12,.47,j%2?'#9196BC':'#6E80B3',a,.2,.25);
      }
    }
    for(const x of [-2.5,2.5])for(const z of [-2.65,6.35]){
      box(x,.092,z,.22,.16,.38,'#54688F');box(x,.19,z,.15,.09,.28,'#D8B7B3');
    }

    for(const [x,z] of [[-10.1,-4.6],[10.4,-4.8],[-10.5,8.7],[10.6,9.5]])tree(x,z,.93,true);
    for(const x of [-3.32,3.32,-8.8,8.8])for(const z of [-5.25,4.1])lamp(x,z,true);
    cyl(0,.13,-7,4.27,.25,4.03,'#717697');
    cyl(0,.33,-7,3.88,.16,3.68,'#B6AABE');
    cyl(0,.46,-7,3.47,.12,3.33,'#737FA1');
    cyl(0,1.04,-7,.64,1.08,.65,'#AE8B7E');
    orb(0,1.57,-7,.86,.50,.84,'#DCAD89');
    const scopeAngle=-.94;
    for(const [y,z,w,h,c] of [[2.42,-7.03,.78,2.46,'#AB9ACA'],[3.10,-7.99,1.10,.24,'#D8B697'],[3.19,-8.11,.84,.095,'#BDD4EA'],[1.76,-6.12,.57,.18,'#E6C09A']]){
      cyl(0,y,z,w,h,w,c,scopeAngle);
    }
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6;
      orb(Math.cos(angle)*1.84,.48,-7+Math.sin(angle)*1.67,.16,.07,.16,'#E2C5A1');
    }
  }
  for(const s of map.stations)station(s);
}

// Small, non-colliding scene accents. Static geometry remains batched.
export function animateCampus(world,time) {
  const t=time*.001, draw=(x,y,z,sx,sy,sz,color,type='sphere')=>world.draw({type,x,y,z,sx,sy,sz,color});
  if(world.scene==='garden'){
    for(let i=0;i<11;i++){
      const f=(t*.69+i/11)%1,a=i*2.39996+t*.38,r=.16+f*1.12;
      draw(Math.cos(a)*r,.86+Math.sin(Math.PI*f)*.55-f*.50,-3.7+Math.sin(a)*r,.085,.13,.085,i%2?'#D4ECE2':'#B1DAD4');
    }
  }else if(world.scene==='beach'){
    for(let i=0;i<7;i++){
      const z=-14.6-i*1.64+Math.sin(t*.60+i*.71)*.48;
      draw(Math.sin(i*2.39)*3,-.12,z,10+i%3*3,.013,.026,'#C4D9C3','cube');
    }
  }else{
    const moon=world.scene==='moon';
    for(let i=0;i<(moon?13:8);i++){
      const phase=i*2.39996,x=Math.sin(phase)*(moon?9:4)+Math.sin(t*.30+phase)*.28;
      const z=(moon?-4:-8)+Math.cos(phase)*(moon?5:2);
      const y=(moon?.7:2.0)+(i%5)*.22+Math.cos(t*.48+phase)*.20;
      const size=.035+Math.max(0,Math.sin(t*1.02+phase))*.055;
      draw(x,y,z,size,size,size,moon?'#F8D9A4':'#FFE2A5');
    }
  }
}
