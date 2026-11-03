/* Study Plaza World: dependency-free, actual WebGL 3D renderer (not an image/video).
 * Low-poly meshes, orbiting follow-camera, walkable worlds, shared avatars, ray-free stations. */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const colors={};
function rgb(hex){if(Array.isArray(hex))return hex;if(!colors[hex]){let s=hex.replace('#','');colors[hex]=[parseInt(s.slice(0,2),16)/255,parseInt(s.slice(2,4),16)/255,parseInt(s.slice(4,6),16)/255];}return colors[hex]||[1,1,1];}
const norm=(x,y,z)=>{let l=Math.hypot(x,y,z)||1;return [x/l,y/l,z/l]};
function mesh(verts,normals,indices){return {verts:new Float32Array(verts),normals:new Float32Array(normals),indices:new Uint16Array(indices)};}
function boxGeometry(){const v=[],n=[],idx=[]; const faces=[[[0,0,1],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]],[[0,0,-1],[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]],[[1,0,0],[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5]],[[-1,0,0],[-.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5]],[[0,1,0],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5]],[[0,-1,0],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5]]];faces.forEach(f=>{let start=v.length/3;for(let j=1;j<5;j++){v.push(...f[j]);n.push(...f[0]);}idx.push(start,start+1,start+2,start,start+2,start+3);});return mesh(v,n,idx);}
function sphereGeometry(rows=10,cols=16){let v=[],n=[],i=[];for(let y=0;y<=rows;y++){let theta=y*Math.PI/rows;for(let x=0;x<=cols;x++){let phi=x*2*Math.PI/cols;let nx=Math.sin(theta)*Math.cos(phi),ny=Math.cos(theta),nz=Math.sin(theta)*Math.sin(phi);v.push(nx*.5,ny*.5,nz*.5);n.push(nx,ny,nz);}}for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let a=y*(cols+1)+x,b=a+cols+1;i.push(a,a+1,b,b,a+1,b+1);}return mesh(v,n,i);}
function cylinderGeometry(steps=16,rTop=.5,rBottom=.5){let v=[],n=[],idx=[];for(let a=0;a<steps;a++){let p=a*2*Math.PI/steps,q=(a+1)*2*Math.PI/steps;let points=[[Math.cos(p)*rBottom,-.5,Math.sin(p)*rBottom],[Math.cos(q)*rBottom,-.5,Math.sin(q)*rBottom],[Math.cos(q)*rTop,.5,Math.sin(q)*rTop],[Math.cos(p)*rTop,.5,Math.sin(p)*rTop]];let st=v.length/3;for(let P of points){v.push(...P);n.push(...norm(P[0],.05,P[2]));}idx.push(st,st+2,st+1,st,st+3,st+2);}for(let top of [true,false]){let y=top?.5:-.5,r=top?rTop:rBottom,st=v.length/3;v.push(0,y,0);n.push(0,top?1:-1,0);for(let k=0;k<=steps;k++){let a=k*2*Math.PI/steps;v.push(Math.cos(a)*r,y,Math.sin(a)*r);n.push(0,top?1:-1,0);}for(let k=0;k<steps;k++)top?idx.push(st,st+k+2,st+k+1):idx.push(st,st+k+1,st+k+2);}return mesh(v,n,idx);}
function modelMatrix(o){const c=Math.cos(o.r||0),s=Math.sin(o.r||0),a=Math.cos(o.rx||0),b=Math.sin(o.rx||0),x=o.x||0,y=o.y||0,z=o.z||0, sx=o.sx??1,sy=o.sy??1,sz=o.sz??1;return new Float32Array([c*sx,0,-s*sx,0,s*b*sy,a*sy,c*b*sy,0,s*a*sz,-b*sz,c*a*sz,0,x,y,z,1]);}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),out=new Float32Array(16);out[0]=f/aspect;out[5]=f;out[10]=(far+near)/(near-far);out[11]=-1;out[14]=2*far*near/(near-far);return out;}
function lookAt(eye,at){const z=norm(eye[0]-at[0],eye[1]-at[1],eye[2]-at[2]),x=norm(z[2],0,-z[0]);let y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];let m=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),1]);return m;}
function mulMat(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){o[c*4+r]=0;for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];}return o;}
function projectPoint(v,m){let x=v[0],y=v[1],z=v[2];let w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=.01)return null;return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w,(m[1]*x+m[5]*y+m[9]*z+m[13])/w,(m[2]*x+m[6]*y+m[10]*z+m[14])/w];}
function makeShader(gl,type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function makeProgram(gl){let v=`attribute vec3 p;attribute vec3 n;uniform mat4 proj,view,model;varying float shade;varying float fog;void main(){vec4 world=model*vec4(p,1.);vec4 eye=view*world;gl_Position=proj*eye;vec3 light=normalize(vec3(-0.6,1.3,0.75));shade=0.67+max(0.,dot(normalize(mat3(model)*n),light))*0.34;fog=clamp((-eye.z-10.)/44.,0.,0.31);}`;let f=`precision mediump float;uniform vec3 color,fogColor;varying float shade,fog;void main(){vec3 c=mix(color*shade,fogColor,fog);gl_FragColor=vec4(c,1.);}`;let p=gl.createProgram();gl.attachShader(p,makeShader(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,makeShader(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
const presets={
 garden:{name:'Sky Garden',sky:'#C4E6FC',fog:'#E1F4FC',ground:'#92D6AC',path:'#FFF2DA',accent:'#75CECF',flora:'#72BB82'},
 library:{name:'Cloud Library',sky:'#D1E1EE',fog:'#F4E5CF',ground:'#C5A078',path:'#EBD3AF',accent:'#F6D59C',flora:'#6FAF91'},
 beach:{name:'Sunny Cove',sky:'#9BDEFA',fog:'#C4EEF4',ground:'#F9D99F',path:'#FFF0CC',accent:'#43C8CE',flora:'#5FB79A'},
 moon:{name:'Moonlight Camp',sky:'#192C53',fog:'#45547C',ground:'#536E7C',path:'#8E9AB0',accent:'#BDB0F0',flora:'#5F9C98'}
};
const stations=[{id:'study',name:'Ders masası',x:-5,z:-2.9,emoji:'📚'},{id:'quiz',name:'Quiz arena',x:5.3,z:-3.1,emoji:'🏆'},{id:'arcade',name:'Mola oyunları',x:5.4,z:4,emoji:'🎮'},{id:'closet',name:'Stil dolabı',x:-5.5,z:4.5,emoji:'👒'}];
export class PlazaWorld{
 constructor(canvas){this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true})||canvas.getContext('experimental-webgl');let gl=this.gl;if(gl){this.program=makeProgram(gl);gl.useProgram(this.program);this.attrib={p:gl.getAttribLocation(this.program,'p'),n:gl.getAttribLocation(this.program,'n')};this.uniform={};for(let k of ['proj','view','model','color','fogColor'])this.uniform[k]=gl.getUniformLocation(this.program,k);this.meshes={cube:this.prepare(boxGeometry()),sphere:this.prepare(sphereGeometry()),cyl:this.prepare(cylinderGeometry()),cone:this.prepare(cylinderGeometry(14,0,.5))};}else{this.ctx=canvas.getContext('2d');this.meshes={};this.fallbackDyn=[];}this.objects=[];this.scene='garden';this.members=[];this.myId=null;this.pos={x:0,z:3};this.camera={yaw:0,pitch:.43,dist:17,focusX:0,focusZ:0};this.keys={};this.avatarAnim=new Map();this.moveVec={x:0,z:0};this.moving=false;this.jumpHeight=0;this.jumpVelocity=0;this.waveUntil=0;this.collectibles=[];this.onMove=()=>{};this.onStar=()=>{};this.onInteract=()=>{};this.lastTime=performance.now();this.lastNet=0;this.started=true;this.build('garden');this.bindControls();requestAnimationFrame(this.frame.bind(this));}
 prepare(g){let gl=this.gl,o={count:g.indices.length};o.p=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.p);gl.bufferData(gl.ARRAY_BUFFER,g.verts,gl.STATIC_DRAW);o.n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.n);gl.bufferData(gl.ARRAY_BUFFER,g.normals,gl.STATIC_DRAW);o.i=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,g.indices,gl.STATIC_DRAW);return o;}
 add(type,x,y,z,sx,sy,sz,color,r=0){this.objects.push({type,x,y,z,sx,sy,sz,color,r});}
 cube(x,y,z,sx,sy,sz,c,r=0){this.add('cube',x,y,z,sx,sy,sz,c,r);}
 ball(x,y,z,sx,sy,sz,c){this.add('sphere',x,y,z,sx,sy,sz,c);}
 cylinder(x,y,z,sx,sy,sz,c){this.add('cyl',x,y,z,sx,sy,sz,c);}
 cone(x,y,z,sx,sy,sz,c){this.add('cone',x,y,z,sx,sy,sz,c);}
 flower(x,z,c){this.cylinder(x,.19,z,.045,.32,.045,'#6BAE74');this.ball(x,.39,z,.22,.12,.22,c);this.ball(x,.40,z,.08,.08,.08,'#FCE6A2');}
 tree(x,z,size=1,palm=false){if(palm){this.cylinder(x,size*1.1,z,.28,size*2.15,.28,'#A97950');for(let a=0;a<6;a++){let t=a*Math.PI/3;this.ball(x+Math.cos(t)*.65*size,2.18*size,z+Math.sin(t)*.65*size,1.6*size,.22*size,.54*size,'#48AC85');}return;}this.cylinder(x,.85*size,z,.36*size,1.7*size,.36*size,'#9B7159');this.ball(x,2.1*size,z,1.75*size,1.65*size,1.65*size,presets[this.scene].flora);this.ball(x-.53*size,2.3*size,z+.2*size,.85*size,.95*size,.9*size,this.scene==='moon'?'#79AEBA':'#99DCC4');}
 bench(x,z,rot=0){this.cube(x,.36,z,1.8,.16,.6,'#C5A17A',rot);this.cube(x,.68,z-.24,1.8,.55,.14,'#B08C6B',rot);this.cube(x-.7,.16,z,.13,.5,.13,'#F5FBF6');this.cube(x+.7,.16,z,.13,.5,.13,'#F5FBF6');}
 desk(x,z){this.cube(x,.63,z,2.7,.19,1.45,'#D5A47C');for(let dx of [-1.08,1.08])for(let dz of [-.54,.54])this.cube(x+dx,.31,z+dz,.14,.62,.14,'#FFE7D1');this.cube(x,.78,z-.18,1,.12,.72,'#D7EFFC');this.cube(x,.96,z-.24,.85,.28,.1,'#7CA9C7');this.cube(x+.94,.79,z+.25,.3,.09,.3,'#E5B4B9');this.cube(x+.92,.84,z+.25,.28,.07,.28,'#FBF7DC');}
 portalBuilding(x,z,col){this.cube(x,.18,z,4.6,.35,3.8,'#F9F6EE');for(let dx of [-2,2])for(let dz of [-1.5,1.5])this.cylinder(x+dx,1.6,z+dz,.21,2.8,.21,'#F5FFFF');this.cube(x,3.08,z,5,.27,4.2,col);this.cube(x,3.3,z,4.5,.17,3.8,'#FFFFFF');}
 build(kind){this.scene=presets[kind]?kind:'garden';this.objects.length=0;let p=presets[this.scene];let floor=this.scene==='library'?'#BC946E':p.ground;this.cube(0,-.40,0,50,.7,50,floor);this.cube(0,-.035,0,4.2,.07,28,p.path);this.cube(0,-.031,0,23,.07,3.5,p.path);for(let x=-10;x<=10;x+=2.5)for(let z=-9;z<=9;z+=2.5){if(Math.abs(x)<2.4||Math.abs(z)<1.8)continue;let seed=Math.abs(Math.sin(x*12.1+z*44.4));if(this.scene!=='library'&&seed>.5)this.flower(x+.2,z+.2,seed>.75?'#FFB5C4':'#FFF0AE');}
 if(this.scene==='garden'){
   this.cylinder(0,.04,-3.4,3.3,.24,3.3,'#F4FFFF');this.cylinder(0,.17,-3.4,2.5,.24,2.5,'#A9DCE8');this.cylinder(0,.43,-3.4,1.35,.5,1.35,'#F5FCF9');this.ball(0,.9,-3.4,.6,.6,.6,'#8FDCE9');
   for(let i=0;i<17;i++){let a=i*2*Math.PI/17;this.tree(Math.cos(a)*12,Math.sin(a)*10, .78+(i%3)*.16);}for(let x of [-8,8])this.bench(x,0);this.cube(-.4,.02,8.1,6,.12,1,'#FAFEF3');
   for(let x of [-3.2,-1.7,1.7,3.2]){this.cylinder(x,1.3,-8.4,.11,2.6,.11,'#F6FEFB');this.ball(x,2.8,-8.4,.45,.45,.45,'#FFEAC7');}
   this.ball(-9,7,-12,4,1.2,2,'#FFFFFF');this.ball(9,8,-14,4,1.4,2,'#FFFFFF');
 } else if(this.scene==='library'){
   this.cube(0,3.5,-12,28,7,.55,'#EED9C6');this.cube(-12,3,0,.5,6,25,'#F7E8DB');this.cube(12,3,0,.5,6,25,'#F7E8DB');
   for(let x=-10;x<=10;x+=3.4){this.cube(x,2.2,-11.5,2.7,3.2,.6,'#B68961');for(let s=0;s<4;s++){this.cube(x,.9+s*.8,-11.12,2.4,.13,.48,'#7F5D48');for(let b=-3;b<=3;b++)this.cube(x+b*.3,.56+s*.8,-11.02,.18,.57,.2,['#8BCBD3','#F4B5A8','#EAC67E','#9FA8DE'][Math.abs(b+s)%4]);}}
   for(let x of [-5.5,0,5.5]){this.cube(x,4.15,-3,3.4,.13,1.8,'#F2E6CC');this.cylinder(x,3.5,-3,.08,1.1,.08,'#E4C088');this.cone(x,2.85,-3,1.4,.78,1.4,'#FFE2A0');}
   for(let x of [-9,9])for(let z of [-7,6])this.tree(x,z,.9);this.cube(0,.03,8,5,.07,1.4,'#E7BDAC');
 } else if(this.scene==='beach'){
   this.cube(0,-.18,-12,49,.44,16,'#56C5D9');this.cube(0,-.01,-7.8,49,.06,1.25,'#C8F5EB');this.cube(0,-.01,9,49,.06,3,'#FFF2CE');
   for(let i=0;i<13;i++)this.tree(-13+i*2.2,(i%2?8:-8),.75+(i%3)*.1,true);
   for(let x of [-9,9]){this.cylinder(x,1.25,1,.16,2.5,.16,'#F8FBF6');this.cone(x,2.7,1,3.3,1.45,3.3,x<0?'#FAAF9D':'#8ACCE6');this.bench(x,2.1);}
   this.ball(-8,4,-11,2.8,.7,1.5,'#F8FFFF');this.ball(6,5,-13,3,1,1.4,'#FFFFFF');
 } else {
   for(let i=0;i<35;i++){let a=i*1.58,r=9+i%5;this.ball(Math.sin(a)*r,4+(i%4),Math.cos(a)*r,.10,.10,.10,i%2?'#E9D8FF':'#FFF0AE');}
   for(let i=0;i<16;i++){let a=i*2*Math.PI/16;this.tree(Math.cos(a)*11,Math.sin(a)*10,.78);}this.ball(0,7,-13,2.3,2.3,2.3,'#F2EBD6');
   for(let i=0;i<8;i++){let a=i*2*Math.PI/8;this.cylinder(Math.cos(a)*7,1.4,Math.sin(a)*7,.12,2.8,.12,'#A3B9C8');this.ball(Math.cos(a)*7,2.9,Math.sin(a)*7,.55,.55,.55,'#FFDFB1');}
 }
 // Interactive station buildings, consistent layout in all worlds.
 let white=this.scene==='moon'?'#C6D6ED':'#FFFFFF';
 this.portalBuilding(-5.5,-3.2,this.scene==='library'?'#F1D0B4':'#C7ECF3');this.desk(-5.5,-2.95);this.cube(-5.5,1.77,-4.52,2.5,1.35,.16,'#5D9B93');this.cube(-5.5,1.77,-4.4,2.12,1,.12,'#D8F3E7');
 this.cylinder(5.25,.26,-3.25,4.4,.52,4.4,'#DCC9FA');this.cylinder(5.25,.43,-3.25,3.55,.16,3.55,'#9D96DE');this.cylinder(5.25,1.17,-3.25,.23,1.43,.23,white);this.ball(5.25,2.05,-3.25,.85,.85,.85,'#FFDB8D');for(let i=0;i<5;i++){let a=i*Math.PI*2/5;this.ball(5.25+Math.cos(a)*1.7,.8,-3.25+Math.sin(a)*1.7,.27,.27,.27,'#F8FFFF');}
 this.cube(5.35,.18,4.1,4.7,.35,3.7,'#8BD2C6');for(let i=0;i<3;i++){this.cube(3.95+i*1.4,.85,4.4,.95,1.1,.9,['#FFD594','#F9B3C1','#ABC5FA'][i]);this.ball(3.95+i*1.4,1.54,4.4,.3,.3,.3,'#F4FFFF');}this.cube(5.3,1.85,3.1,3.9,.32,.35,'#FBFFFA');
 this.cube(-5.5,.18,4.5,4.4,.35,3.7,'#E9D7F7');this.cube(-5.5,1.3,4.45,2.6,2.1,.7,'#DFC6EC');this.cube(-5.5,2.45,4.4,3.1,.22,1,'#F8E6FB');this.ball(-6.4,1.43,4.75,.42,.42,.42,'#F6DFA1');this.ball(-4.55,1.43,4.75,.42,.42,.42,'#C7EBF2');
 for(let x of [-10,10])for(let z of [-7,7]){this.cylinder(x,1.05,z,.14,2,.14,'#EEE7DA');this.ball(x,2.25,z,.5,.54,.5,this.scene==='moon'?'#F7DDBD':'#FFF4DC');}
 }
 setMembers(list,myId){this.members=list||[];this.myId=myId;for(const id of this.avatarAnim.keys())if(!this.members.some(m=>m.id===id))this.avatarAnim.delete(id);let mine=this.members.find(p=>p.id===myId);if(mine&&!this.initialized){this.pos={x:mine.x??0,z:mine.z??3};this.initialized=true;}}
 setStarHunt(active){this.collectibles=[];if(active){for(let i=0;i<12;i++){let a=(i/12)*Math.PI*2+.12,r=3+(i%4)*1.37;this.collectibles.push({x:Math.sin(a)*r,z:Math.cos(a)*r,alive:true});}}}
 bindControls(){
  // Starting from the nickname input must not trap WASD movement.
  this.canvas.tabIndex=0;
  const active=document.activeElement;
  if(active&&['INPUT','TEXTAREA','SELECT'].includes(active.tagName))active.blur();
  this.canvas.focus({preventScroll:true});
  this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;this.drag={x:e.clientX,y:e.clientY};this.canvas.setPointerCapture(e.pointerId);this.canvas.focus({preventScroll:true});});
  this.canvas.addEventListener('pointermove',e=>{if(!this.drag)return;let dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag={x:e.clientX,y:e.clientY};this.camera.yaw-=dx*.0065;this.camera.pitch=clamp(this.camera.pitch+dy*.004,.19,1.0);});
  for(const end of ['pointerup','pointercancel','lostpointercapture'])this.canvas.addEventListener(end,()=>this.drag=null);
  this.canvas.addEventListener('wheel',e=>{this.camera.dist=clamp(this.camera.dist+Math.sign(e.deltaY)*1.3,9,24);e.preventDefault()},{passive:false});
  window.addEventListener('keydown',e=>{
    const active=document.activeElement;
    const editable=active&&(['INPUT','TEXTAREA','SELECT'].includes(active.tagName)||active.isContentEditable)&&active.getClientRects().length>0;
    if(editable)return;
    const k=e.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){this.keys[k]=true;e.preventDefault();}
    if(k===' '||k==='spacebar'){if(!e.repeat&&this.jumpHeight<=.001){this.jumpVelocity=4.9;}e.preventDefault();}
    if(k==='q'&&!e.repeat){this.waveUntil=performance.now()+1500;e.preventDefault();}
    if(k==='e'&&!e.repeat){this.tryInteract();e.preventDefault();}
  });
  window.addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);
  window.addEventListener('blur',()=>this.keys={});
 }

 tryInteract(){let nearest=stations.map(s=>({...s,d:Math.hypot(this.pos.x-s.x,this.pos.z-s.z)})).sort((a,b)=>a.d-b.d)[0];if(nearest.d<3.6)this.onInteract(nearest.id);}
 draw(o){if(!this.gl){this.fallbackDyn.push(o);return;}let gl=this.gl,g=this.meshes[o.type];gl.bindBuffer(gl.ARRAY_BUFFER,g.p);gl.enableVertexAttribArray(this.attrib.p);gl.vertexAttribPointer(this.attrib.p,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,g.n);gl.enableVertexAttribArray(this.attrib.n);gl.vertexAttribPointer(this.attrib.n,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g.i);gl.uniformMatrix4fv(this.uniform.model,false,modelMatrix(o));gl.uniform3fv(this.uniform.color,rgb(o.color));gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_SHORT,0);}
 avatar(p,local){
  // Wii-style little people: expressive faces, hair, outfits, animated walk/jump/wave.
  const now=performance.now(), dt=Math.min(this.frameDt||.016,.05), id=p.id||'anonymous';
  const destX=local?this.pos.x:(p.x??0),destZ=local?this.pos.z:(p.z??3);
  let a=this.avatarAnim.get(id);
  if(!a){a={x:destX,z:destZ,tx:destX,tz:destZ,heading:0,phase:0,walk:0,lastTarget:now,seed:(p.name||'').length};this.avatarAnim.set(id,a)}
  if(!local&&(Math.hypot(a.tx-destX,a.tz-destZ)>.006)){
    a.tx=destX;a.tz=destZ;a.lastTarget=now;
  }
  const ox=a.x,oz=a.z;
  if(local){a.x=destX;a.z=destZ;}else{
    // Make distant friends actually glide to their latest reported positions.
    let k=1-Math.exp(-dt*13);
    a.x+=(a.tx-a.x)*k;a.z+=(a.tz-a.z)*k;
  }
  const vx=local?this.moveVec.x:(a.x-ox)/Math.max(dt,.002), vz=local?this.moveVec.z:(a.z-oz)/Math.max(dt,.002);
  let moving=local?this.moving:(Math.hypot(a.tx-a.x,a.tz-a.z)>.025 || (now-a.lastTarget<210&&Math.hypot(vx,vz)>.02));
  const speed=Math.hypot(vx,vz);
  a.walk+=(Number(moving)-a.walk)*Math.min(1,dt*9);
  if(moving&&speed>.02){
    const destHeading=Math.atan2(vx,vz);
    const delta=Math.atan2(Math.sin(destHeading-a.heading),Math.cos(destHeading-a.heading));
    a.heading+=delta*Math.min(1,dt*11);
  }
  a.phase+=dt*(7.8+Math.min(4,speed*.7))*a.walk;
  const step=Math.sin(a.phase), opposite=Math.sin(a.phase+Math.PI), bodyBob=Math.abs(Math.sin(a.phase))*.055*a.walk;
  const idleBreath=Math.sin(now*.0025+a.seed)*.019;
  const hop=local?this.jumpHeight:0;
  const x=a.x,z=a.z, theta=a.heading, cs=Math.cos(theta),sn=Math.sin(theta), bob=bodyBob+idleBreath+hop;
  const outfits={mint:{shirt:'#74C9AD',trim:'#E2FFF1',pants:'#627D98',hair:'#554439',skin:'#F2CBA9',sole:'#394C65'},peach:{shirt:'#EAA0AB',trim:'#FFE6D7',pants:'#7A7DAD',hair:'#3B2B34',skin:'#BD8266',sole:'#4E5269'},blue:{shirt:'#8AADEB',trim:'#EDF7FF',pants:'#435B8D',hair:'#9A6544',skin:'#F0D1B2',sole:'#263B5B'},lilac:{shirt:'#B9A3E5',trim:'#F5DFFA',pants:'#70718E',hair:'#2F344B',skin:'#D9A98A',sole:'#4F4965'},yellow:{shirt:'#F5CF78',trim:'#FFF0B7',pants:'#819E8C',hair:'#272D39',skin:'#AE785A',sole:'#505E5C'}};
  const outfit=outfits[p.skin]||outfits.mint;
  const part=(type,lx,ly,lz,sx,sy,sz,color,rx=0,r=0)=>{
    const px=x+cs*lx+sn*lz,pz=z-sn*lx+cs*lz;
    this.draw({type,x:px,y:ly+bob,z:pz,sx,sy,sz,color,r:theta+r,rx});
  };
  // Contact shadow follows the avatar but stays on the ground.
  this.draw({type:'sphere',x,y:.027,z,sx:.95,sy:.035,sz:.55,color:this.scene==='moon'?'#324B63':'#87AD9E'});
  const leg=step*a.walk*.28;
  for(let side of [-1,1]){
    const stride=side*leg;
    part('cyl',side*.23,.44+Math.max(0,-stride)*.15,0+stride*.45,.29,.66,.30,outfit.pants,-stride*.65);
    part('cube',side*.23,.13+Math.max(0,-stride)*.22,.14+stride*.75,.38,.24,.56,outfit.sole,-stride*.25);
    part('cube',side*.23,.20+Math.max(0,-stride)*.22,.30+stride*.75,.31,.06,.20,'#FFFFFF',-stride*.25);
  }
  // Tapered sweater, light collar, tiny front pocket.
  part('sphere',0,1.03,0,1.08,1.03,.68,outfit.shirt);
  part('cube',0,.91,.353,.42,.23,.045,outfit.trim);
  part('cube',0,.81,.388,.25,.045,.045,'#FDFCF5');
  part('cyl',0,1.61,0,.20,.22,.22,outfit.skin);
  for(let side of [-1,1]){
    const swing=side===-1?opposite:step;
    const wave=local&&side===1&&now<this.waveUntil;
    const armTilt=wave?-2.65:(swing*.44*a.walk);
    const handLift=wave?.66:0;
    const armY=wave?1.52:1.13;
    part('sphere',side*.67,armY,0+Math.sin(armTilt)*.11,.35,.72,.35,outfit.shirt,armTilt);
    part('sphere',side*.74,.70+handLift,-.01+Math.sin(armTilt)*.20,.26,.26,.25,outfit.skin);
    part('sphere',side*.72,1.35+(wave?.30:0),.05,.07,.07,.07,outfit.trim);
  }
  // Big expressive head, soft cheeks, hairline, eyelashes and eyes.
  part('sphere',0,1.91,0,.94,.92,.89,outfit.skin);
  part('sphere',0,2.31,-.06,.97,.36,.90,outfit.hair);
  part('sphere',-.37,2.17,.08,.26,.27,.60,outfit.hair);
  part('sphere',.39,2.18,.08,.23,.25,.56,outfit.hair);
  if(p.hat==='none'){
    part('sphere',-.24,2.44,.19,.30,.23,.32,outfit.hair);
    part('sphere',.05,2.45,.08,.37,.18,.33,outfit.hair);
  }
  // Blink every few seconds. Eyes are fitted to the front of the round face.
  const blink=Math.sin(now*.00165+a.seed*1.9)>.996;
  for(let side of [-1,1]){
    part('sphere',side*.20,1.97,.445,.175,blink?.027:.205,.06,'#FFFDFB');
    if(!blink){part('sphere',side*.20,1.965,.493,.092,.147,.053,'#2A354A');part('sphere',side*.175,2.025,.537,.033,.048,.018,'#FFFFFF');}
    part('sphere',side*.215,2.161,.425,.16,.045,.05,outfit.hair);
    part('sphere',side*.335,1.79,.36,.17,.105,.052,'#EA9D9B');
  }
  part('sphere',0,1.856,.48,.09,.09,.07,'#E5B099');
  part('sphere',0,1.735,.438,.23,.06,.052,'#9A4F59');
  part('sphere',0,1.713,.472,.16,.035,.022,'#FFD7CE');
  if(p.hat==='cap'){
    part('sphere',0,2.42,-.03,1.02,.35,.93,'#6D92DA');
    part('cube',0,2.34,.45,.94,.09,.56,'#4A73C5');
    part('sphere',0,2.55,.11,.12,.08,.13,'#D9E8FF');
  }else if(p.hat==='beanie'){
    part('sphere',0,2.43,-.05,1.02,.47,.95,'#B48AE3');
    part('cyl',0,2.32,.005,1.03,.20,.99,'#9974D1');
    part('sphere',0,2.75,-.03,.20,.20,.20,'#E7CCFA');
  }else if(p.hat==='crown'){
    part('cyl',0,2.54,-.015,.85,.20,.85,'#F3C54E');
    for(let i=0;i<5;i++){let a=i*Math.PI*2/5;part('cone',Math.sin(a)*.33,2.76,Math.cos(a)*.33,.21,.4,.21,'#FFE27E');}
    part('sphere',0,2.63,.43,.14,.12,.10,'#E77F96');
  }else if(p.hat==='star'){
    part('cyl',0,2.57,0,.09,.24,.09,'#E9B563');part('sphere',0,2.79,0,.43,.43,.18,'#FFE486');
  }else if(p.hat==='wizard'){
    part('cyl',0,2.37,0,1.14,.16,1.12,'#6E5DA9');
    part('cone',0,2.95,0,1.05,1.07,1.05,'#8971D6');
    part('sphere',0,2.82,.49,.16,.16,.08,'#FFE394');
  }
 }

 frame(t){if(!this.started)return;let dt=Math.min(.05,(t-this.lastTime)/1000||0);this.lastTime=t;this.frameDt=dt;let gl=this.gl;let w=this.canvas.clientWidth||800,h=this.canvas.clientHeight||600,dpr=Math.min(devicePixelRatio||1,1.6);let pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(this.canvas.width!==pw||this.canvas.height!==ph){this.canvas.width=pw;this.canvas.height=ph;if(gl)gl.viewport(0,0,pw,ph);}let f=Number(Boolean(this.keys.w||this.keys.arrowup))-Number(Boolean(this.keys.s||this.keys.arrowdown)),side=Number(Boolean(this.keys.d||this.keys.arrowright))-Number(Boolean(this.keys.a||this.keys.arrowleft));const wasMoving=this.moving;this.moving=Boolean(f||side);this.moveVec={x:0,z:0};
 if(this.moving){let yaw=this.camera.yaw,spd=(this.keys.shift?6.5:3.75)/Math.max(1,Math.hypot(f,side));this.moveVec.x=(Math.cos(yaw)*side-Math.sin(yaw)*f)*spd;this.moveVec.z=(-Math.cos(yaw)*f-Math.sin(yaw)*side)*spd;this.pos.x=clamp(this.pos.x+this.moveVec.x*dt,-9,9);this.pos.z=clamp(this.pos.z+this.moveVec.z*dt,-9,9);}
 if((this.moving&&t-this.lastNet>130)||(!this.moving&&wasMoving)){this.lastNet=t;this.onMove(this.pos.x,this.pos.z);}
 if(this.jumpHeight>0||this.jumpVelocity>0){this.jumpVelocity-=11.8*dt;this.jumpHeight=Math.max(0,this.jumpHeight+this.jumpVelocity*dt);if(this.jumpHeight===0)this.jumpVelocity=0;}
 this.camera.focusX+=(this.pos.x-this.camera.focusX)*Math.min(1,dt*3);this.camera.focusZ+=(this.pos.z-1.2-this.camera.focusZ)*Math.min(1,dt*3);
 const {yaw,pitch,dist}=this.camera, eye=[this.camera.focusX+Math.sin(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist+2.4,this.camera.focusZ+Math.cos(yaw)*Math.cos(pitch)*dist],target=[this.camera.focusX,0.85,this.camera.focusZ];let view=lookAt(eye,target),proj=perspective(.81,w/h,.1,120);this.projView=mulMat(proj,view);
 if(gl){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.useProgram(this.program);gl.uniformMatrix4fv(this.uniform.proj,false,proj);gl.uniformMatrix4fv(this.uniform.view,false,view);gl.uniform3fv(this.uniform.fogColor,rgb(presets[this.scene].fog));}else{this.fallbackDyn=[];this.softView=view;this.softEye=eye;this.softWidth=pw;this.softHeight=ph;}
 for(let o of this.objects)this.draw(o);for(let p of this.members)if(p.id!==this.myId)this.avatar(p,false);let mine=this.members.find(p=>p.id===this.myId);if(mine)this.avatar(mine,true);
 for(let star of this.collectibles){if(!star.alive)continue;let y=.6+Math.sin(t*.002+star.x)*.2;this.draw({type:'sphere',x:star.x,y,z:star.z,sx:.39,sy:.48,sz:.39,color:'#FCE68A'});this.draw({type:'sphere',x:star.x,y:y+.05,z:star.z,sx:.18,sy:.22,sz:.18,color:'#FFFFFF'});if(Math.hypot(this.pos.x-star.x,this.pos.z-star.z)<.75){star.alive=false;this.onStar(this.collectibles.filter(s=>!s.alive).length,this.collectibles.length);}}
 if(!gl)this.drawFallback();if(this.onFrame)this.onFrame();requestAnimationFrame(this.frame.bind(this));}

 drawFallback(){
  const ctx=this.ctx,W=this.softWidth,H=this.softHeight,M=this.projView,eye=this.softEye;
  ctx.clearRect(0,0,W,H);ctx.save();
  const pt=(x,y,z)=>{let v=projectPoint([x,y,z],M);if(!v||v[2]>1||v[2]<-1)return null;return [(v[0]+1)*.5*W,(1-v[1])*.5*H]};
  const shape=(pts,color)=>{if(pts.some(p=>!p))return;ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);ctx.closePath();ctx.fillStyle=color;ctx.fill();};
  const shade=(hex,f)=>{let c=rgb(hex);return `rgb(${Math.min(255,c[0]*255*f)|0},${Math.min(255,c[1]*255*f)|0},${Math.min(255,c[2]*255*f)|0})`};
  const list=this.fallbackDyn.map(o=>({...o,depth:Math.hypot(o.x-eye[0],o.y-eye[1],o.z-eye[2])})).sort((a,b)=>b.depth-a.depth);
  for(const o of list){
   let {x,y,z,sx,sy,sz,color,type,r=0}=o;
   let C=pt(x,y,z);if(!C||C[0]<-W||C[0]>W*2||C[1]<-H||C[1]>H*2)continue;
   let top=pt(x,y+sy*.5,z),base=pt(x,y-sy*.5,z),left=pt(x-sx*.5,y,z),right=pt(x+sx*.5,y,z);
   if(type==='sphere'){
    let sxp=left&&right?Math.abs(right[0]-left[0])/2:15;let syp=top&&base?Math.abs(base[1]-top[1])/2:sxp; if(sxp<.5||syp<.5)continue;
    let grd=ctx.createRadialGradient(C[0]-sxp*.28,C[1]-syp*.35,0,C[0],C[1],Math.max(sxp,syp)*1.2);grd.addColorStop(0,shade(color,1.12));grd.addColorStop(.67,shade(color,.96));grd.addColorStop(1,shade(color,.72));ctx.fillStyle=grd;ctx.beginPath();ctx.ellipse(C[0],C[1],sxp,syp,0,0,Math.PI*2);ctx.fill();continue;
   }
   if(type==='cyl'||type==='cone'){
    let rings=[];for(let height of [-.5,.5]){let arr=[];for(let i=0;i<10;i++){let a=i/10*Math.PI*2,rad=type==='cone'&&height===.5?0:1;arr.push(pt(x+Math.cos(a)*sx*.5*rad,y+sy*height,z+Math.sin(a)*sz*.5*rad));}rings.push(arr);}
    for(let i=0;i<10;i++){let a=i/10*Math.PI*2;if(Math.cos(a)<-.2)continue;shape([rings[0][i],rings[0][(i+1)%10],rings[1][(i+1)%10],rings[1][i]],shade(color,.72+Math.max(0,Math.sin(a))*0.27));}
    shape(rings[1],shade(color,1.05));continue;
   }
   if(type==='cube'){
    const sr=Math.sin(r),cr=Math.cos(r);let corner=(dx,dy,dz)=>pt(x+dx*cr+dz*sr,y+dy,z-dx*sr+dz*cr);
    let a=corner(-sx/2,-sy/2,-sz/2),b=corner(sx/2,-sy/2,-sz/2),c=corner(sx/2,-sy/2,sz/2),d=corner(-sx/2,-sy/2,sz/2),e=corner(-sx/2,sy/2,-sz/2),f=corner(sx/2,sy/2,-sz/2),g=corner(sx/2,sy/2,sz/2),h=corner(-sx/2,sy/2,sz/2);
    // Draw far faces first. Cubes are painter-sorted by object distance.
    shape([a,b,f,e],shade(color,.82));shape([b,c,g,f],shade(color,.77));shape([d,a,e,h],shade(color,.88));shape([d,c,g,h],shade(color,.94));shape([e,f,g,h],shade(color,1.07));continue;
   }
  }
  ctx.restore();
 }
 project(x,y,z){if(!this.projView)return null;let v=projectPoint([x,y,z],this.projView);if(!v||v[2]>1||v[2]<-1)return null;return {x:(v[0]+1)*.5*100,y:(1-v[1])*.5*100};}
 getStations(){return stations;}
 destroy(){this.started=false;}
}
export {presets,stations};
