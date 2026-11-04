import {canStand,maps,sceneLayout,walk} from './plaza-shared.js';
import {animateCampus,buildCampus} from './campus-map.js';
import {drawStudent,profiles} from './plaza-avatar.js';
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
function profileGeometry(profile,segments=16){
 const v=[],n=[],idx=[];
 for(let i=0;i<profile.length;i++){
  const [y,r,shift]=profile[i], prior=profile[Math.max(0,i-1)], next=profile[Math.min(i+1,profile.length-1)];
  const dy=prior[0]-next[0],dr=next[1]-prior[1];
  for(let j=0;j<=segments;j++){
   const angle=j*Math.PI*2/segments,c=Math.cos(angle),s=Math.sin(angle);
   v.push(c*r,y,s*r+shift);n.push(...(r?norm(c*dy,dr,s*dy):[0,y>0?1:-1,0]));
  }
 }
 for(let i=0;i<profile.length-1;i++)for(let j=0;j<segments;j++){
  const a=i*(segments+1)+j,b=a+segments+1;
  idx.push(a,a+1,b,b,a+1,b+1);
 }
 return mesh(v,n,idx);
}
function ringGeometry(){
 const v=[],n=[],idx=[],sides=18,tube=7;
 for(let i=0;i<=sides;i++)for(let j=0;j<=tube;j++){
  const a=i*Math.PI*2/sides,b=j*Math.PI*2/tube,c=Math.cos(a),s=Math.sin(a);
  const r=.42+.07*Math.cos(b);
  v.push(r*c,r*s,.07*Math.sin(b));
  n.push(c*Math.cos(b),s*Math.cos(b),Math.sin(b));
 }
 for(let i=0;i<sides;i++)for(let j=0;j<tube;j++){
  const a=i*(tube+1)+j,b=a+tube+1;
  idx.push(a,b,a+1,b,b+1,a+1);
 }
 return mesh(v,n,idx);
}
function ridgeGeometry(){
 const verts=[],normals=[],indices=[];
 const a=[-.53,-.5,-.34],b=[.47,-.5,-.39],c=[.56,-.5,.31],d=[-.46,-.5,.48];
 const e=[-.28,.40,-.10],f=[.17,.59,.02],g=[.36,.21,.18],h=[-.25,.07,.29];
 const triangles=[[a,d,e],[a,e,b],[e,f,b],[b,f,c],[f,g,c],[c,g,d],[g,h,d],[h,e,d],[e,h,f],[f,h,g]];
 for(const [p,q,r] of triangles){
   const [ux,uy,uz]=q.map((v,i)=>v-p[i]),[vx,vy,vz]=r.map((v,i)=>v-p[i]);
   const n=norm(uy*vz-uz*vy,uz*vx-ux*vz,ux*vy-uy*vx);
   const j=verts.length/3;
   verts.push(...p,...q,...r);normals.push(...n,...n,...n);indices.push(j,j+1,j+2);
 }
 return mesh(verts,normals,indices);
}
function modelMatrix(o){
 const c=Math.cos(o.r||0),s=Math.sin(o.r||0),a=Math.cos(o.rx||0),b=Math.sin(o.rx||0);
 const e=Math.cos(o.rz||0),f=Math.sin(o.rz||0),sx=o.sx??1,sy=o.sy??1,sz=o.sz??1;
 return new Float32Array([(c*e+s*b*f)*sx,a*f*sx,(-s*e+c*b*f)*sx,0,(-c*f+s*b*e)*sy,a*e*sy,(s*f+c*b*e)*sy,0,s*a*sz,-b*sz,c*a*sz,0,o.x||0,o.y||0,o.z||0,1]);
}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2),out=new Float32Array(16);out[0]=f/aspect;out[5]=f;out[10]=(far+near)/(near-far);out[11]=-1;out[14]=2*far*near/(near-far);return out;}
function lookAt(eye,at){const z=norm(eye[0]-at[0],eye[1]-at[1],eye[2]-at[2]),x=norm(z[2],0,-z[0]);let y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];let m=new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]),1]);return m;}
function mulMat(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){o[c*4+r]=0;for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];}return o;}
function projectPoint(v,m){let x=v[0],y=v[1],z=v[2];let w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=.01)return null;return [(m[0]*x+m[4]*y+m[8]*z+m[12])/w,(m[1]*x+m[5]*y+m[9]*z+m[13])/w,(m[2]*x+m[6]*y+m[10]*z+m[14])/w];}
function makeShader(gl,type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function makeProgram(gl){let v=`attribute vec3 p;attribute vec3 n;attribute vec3 tint;uniform vec3 color;uniform mat4 proj,view,model;varying float shade;varying float fog;varying vec3 paint;void main(){paint=tint*color;vec4 world=model*vec4(p,1.);vec4 eye=view*world;gl_Position=proj*eye;vec3 light=normalize(vec3(-0.6,1.3,0.75));vec3 u=model[0].xyz,v=model[1].xyz,w=model[2].xyz;vec3 normal=normalize(u*n.x/dot(u,u)+v*n.y/dot(v,v)+w*n.z/dot(w,w));shade=0.61+max(0.,dot(normal,light))*0.48+max(0.,dot(normal,vec3(0.55,0.15,-0.8)))*0.12;fog=clamp((-eye.z-16.)/70.,0.,0.28);}`;let f=`precision mediump float;uniform vec3 fogColor;varying float shade,fog;varying vec3 paint;void main(){vec3 c=mix(paint*shade,fogColor,fog);gl_FragColor=vec4(c,1.);}`;let p=gl.createProgram();gl.attachShader(p,makeShader(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,makeShader(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
const IDENTITY=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
export class PlazaWorld{
 constructor(canvas,{preview=false}={}){this.canvas=canvas;this.preview=preview;this.reduceMotion=matchMedia("(prefers-reduced-motion: reduce)");this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,depth:true})||canvas.getContext('experimental-webgl');let gl=this.gl;if(gl){this.program=makeProgram(gl);gl.useProgram(this.program);this.attrib={p:gl.getAttribLocation(this.program,'p'),n:gl.getAttribLocation(this.program,'n'),tint:gl.getAttribLocation(this.program,'tint')};this.uniform={};for(let k of ['proj','view','model','color','fogColor'])this.uniform[k]=gl.getUniformLocation(this.program,k);this.geometry={cube:boxGeometry(),sphere:sphereGeometry(),ridge:ridgeGeometry(),cyl:cylinderGeometry(),cone:cylinderGeometry(14,0,.5),ring:ringGeometry(),...Object.fromEntries(Object.entries(profiles).map(([name,profile])=>[name,profileGeometry(profile)]))};this.meshes=Object.fromEntries(Object.entries(this.geometry).map(([key,geo])=>[key,this.prepare(geo)]));}else{this.ctx=canvas.getContext('2d');this.meshes={};this.fallbackDyn=[];}this.objects=[];this.scene='garden';this.members=[];this.myId=null;this.pos={x:0,z:3};this.camera={yaw:0,pitch:.38,dist:20,focusX:0,focusZ:-2.4};this.keys={};this.avatarAnim=new Map();this.moveVec={x:0,z:0};this.moving=false;this.jumpHeight=0;this.jumpStarted=null;this.heading=0;this.pose="idle";this.seat=null;this.collectibles=[];this.onMove=()=>{};this.onStar=()=>{};this.onInteract=()=>{};this.lastTime=performance.now();this.lastNet=0;this.started=true;if(preview){this.pos={x:0,z:0};this.camera={yaw:.20,pitch:.19,dist:3.95,focusX:0,focusZ:0};}else{this.build('garden');this.bindControls();}this.renderFrame=this.frame.bind(this);requestAnimationFrame(this.renderFrame);}
 prepare(g){let gl=this.gl,o={count:g.indices.length};o.p=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.p);gl.bufferData(gl.ARRAY_BUFFER,g.verts,gl.STATIC_DRAW);o.n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,o.n);gl.bufferData(gl.ARRAY_BUFFER,g.normals,gl.STATIC_DRAW);o.i=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,o.i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,g.indices,gl.STATIC_DRAW);return o;}
 add(type,x,y,z,sx,sy,sz,color,r=0,rx=0,rz=0){const object={type,x,y,z,sx,sy,sz,color,r,rx,rz};if(this.gl)object.matrix=modelMatrix(object);this.objects.push(object);}
 cube(x,y,z,sx,sy,sz,c,r=0){this.add('cube',x,y,z,sx,sy,sz,c,r);}
 ball(x,y,z,sx,sy,sz,c){this.add('sphere',x,y,z,sx,sy,sz,c);}
 cylinder(x,y,z,sx,sy,sz,c){this.add('cyl',x,y,z,sx,sy,sz,c);}
 cone(x,y,z,sx,sy,sz,c){this.add('cone',x,y,z,sx,sy,sz,c);}
 build(kind){this.scene=sceneLayout(kind).id;this.objects.length=0;buildCampus(this,this.scene);this.prepareCampus();}
 setMembers(list,myId){
  this.members=list||[];this.myId=myId;
  for(const id of this.avatarAnim.keys())if(!this.members.some(m=>m.id===id))this.avatarAnim.delete(id);
  const mine=this.members.find(p=>p.id===myId);
  if(mine&&(!this.initialized||this.seat!==(mine.seat||null))){
   this.pos={x:Number.isFinite(mine.x)?mine.x:0,z:Number.isFinite(mine.z)?mine.z:3};
   this.heading=mine.heading||0;this.seat=mine.seat||null;this.pose=mine.pose||'idle';this.initialized=true;
  }
 }
 setScene(kind){
  this.build(kind);
  if(!canStand(this.pos.x,this.pos.z,this.scene)){this.pos={x:0,z:3};this.motionDirty=true;}
 }
 setPose(pose){this.pose=pose;this.poseUntil=['wave','emote'].includes(pose)?performance.now()+1500:0;this.motionDirty=true;}
 jump(){if(!this.seat&&!this.isBlocked?.()&&this.jumpStarted===null){this.jumpStarted=performance.now();this.motionDirty=true;}}
 getLabel(id){const a=this.avatarAnim.get(id);return a?this.project(a.x,2.74+(a.hop||0)-.38*(a.seated||0),a.z):null;}
 setStarHunt(active){
  this.collectibles=[];
  if(!active)return;
  for(let i=0;i<72&&this.collectibles.length<12;i++){
   const a=i*2.399963,r=3+(i%7)*.92,x=Math.sin(a)*r,z=Math.cos(a)*r;
   if(canStand(x,z,this.scene)&&this.collectibles.every(v=>Math.hypot(x-v.x,z-v.z)>.9))this.collectibles.push({x,z,alive:true});
  }
 }
 bindControls(){
  // Starting from the nickname input must not trap WASD movement.
  this.canvas.tabIndex=0;
  const active=document.activeElement;
  if(active&&['INPUT','TEXTAREA','SELECT'].includes(active.tagName))active.blur();
  this.canvas.focus({preventScroll:true});
  this.canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;if(this.drag)return;this.drag={x:e.clientX,y:e.clientY,id:e.pointerId};this.canvas.setPointerCapture(e.pointerId);this.canvas.focus({preventScroll:true});});
  this.canvas.addEventListener('pointermove',e=>{if(this.drag?.id!==e.pointerId)return;let dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag={x:e.clientX,y:e.clientY,id:e.pointerId};this.camera.yaw-=dx*.0065;this.camera.pitch=clamp(this.camera.pitch+dy*.004,.19,1.0);});
  for(const end of ['pointerup','pointercancel','lostpointercapture'])this.canvas.addEventListener(end,e=>{if(this.drag?.id===e.pointerId)this.drag=null;});
  this.canvas.addEventListener('wheel',e=>{this.camera.dist=clamp(this.camera.dist+Math.sign(e.deltaY)*1.3,9,24);e.preventDefault()},{passive:false});
  window.addEventListener('keydown',e=>{
    const active=document.activeElement;
    const editable=active&&(['INPUT','TEXTAREA','SELECT'].includes(active.tagName)||active.isContentEditable)&&active.getClientRects().length>0;
    if(editable||active?.matches("button,a,summary")||this.isBlocked?.())return;
    const k=e.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){this.keys[k]=true;e.preventDefault();}
    if(k===' '||k==='spacebar'){if(!e.repeat)this.jump();e.preventDefault();}
    if(k==='q'&&!e.repeat){this.setPose("wave");e.preventDefault();}
    if(k==='r'&&!e.repeat)this.setPose(this.pose==='study'?(this.seat?'sit':'idle'):'study');
    if(k==='f'&&!e.repeat)this.setPose('emote');
    if(k==='e'&&!e.repeat){this.tryInteract();e.preventDefault();}
  });
  window.addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);
  window.addEventListener('blur',()=>this.keys={});
 }

 tryInteract(){
  if(this.seat){this.onInteract('seat',null);return;}
  const seat=sceneLayout(this.scene).seats.find(s=>Math.hypot(this.pos.x-s.x,this.pos.z-s.z)<1);
  if(seat){this.onInteract('seat',seat.id);return;}
  const nearest=this.getStations().map(s=>({...s,d:Math.hypot(this.pos.x-s.x,this.pos.z-s.z)})).sort((a,b)=>a.d-b.d)[0];
  if(nearest.d<3.6)this.onInteract(nearest.id);
 }
 prepareCampus(){
  const gl=this.gl;
  if(!gl)return;
  for(const batch of this.campusBatches||[])for(const key of ['p','n','i','t'])gl.deleteBuffer(batch[key]);
  this.campusBatches=[];
  let verts=[],normals=[],tints=[],indices=[];
  const flush=()=>{
    if(!indices.length)return;
    const batch=this.prepare(mesh(verts,normals,indices));
    batch.t=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,batch.t);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(tints),gl.STATIC_DRAW);
    this.campusBatches.push(batch);
    verts=[];normals=[];tints=[];indices=[];
  };
  for(const object of this.objects){
    const geo=this.geometry[object.type],m=object.matrix,color=rgb(object.color);
    if(verts.length/3+geo.verts.length/3>62000)flush();
    const offset=verts.length/3;
    const sx2=object.sx*object.sx,sy2=object.sy*object.sy,sz2=object.sz*object.sz;
    for(let i=0;i<geo.verts.length;i+=3){
      const x=geo.verts[i],y=geo.verts[i+1],z=geo.verts[i+2];
      verts.push(m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]);
      const nx=geo.normals[i]/sx2,ny=geo.normals[i+1]/sy2,nz=geo.normals[i+2]/sz2;
      normals.push(...norm(m[0]*nx+m[4]*ny+m[8]*nz,m[1]*nx+m[5]*ny+m[9]*nz,m[2]*nx+m[6]*ny+m[10]*nz));
      tints.push(...color);
    }
    for(const i of geo.indices)indices.push(i+offset);
  }
  flush();
 }
 bindMesh(g){
  if(this.lastMesh===g)return;
  const gl=this.gl;
  gl.bindBuffer(gl.ARRAY_BUFFER,g.p);gl.enableVertexAttribArray(this.attrib.p);gl.vertexAttribPointer(this.attrib.p,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,g.n);gl.enableVertexAttribArray(this.attrib.n);gl.vertexAttribPointer(this.attrib.n,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,g.i);
  if(g.t){
    gl.bindBuffer(gl.ARRAY_BUFFER,g.t);gl.enableVertexAttribArray(this.attrib.tint);gl.vertexAttribPointer(this.attrib.tint,3,gl.FLOAT,false,0,0);
  }else{
    gl.disableVertexAttribArray(this.attrib.tint);gl.vertexAttrib3f(this.attrib.tint,1,1,1);
  }
  this.lastMesh=g;
 }
 drawCampus(){
  const gl=this.gl;
  if(!gl){for(const o of this.objects)this.draw(o);return;}
  gl.uniformMatrix4fv(this.uniform.model,false,IDENTITY);
  gl.uniform3f(this.uniform.color,1,1,1);
  for(const g of this.campusBatches||[]){this.bindMesh(g);gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_SHORT,0);}
 }
 draw(o){
  if(!this.gl){this.fallbackDyn.push(o);return;}
  const gl=this.gl,g=this.meshes[o.type];
  this.bindMesh(g);
  gl.uniformMatrix4fv(this.uniform.model,false,o.matrix||modelMatrix(o));
  gl.uniform3fv(this.uniform.color,rgb(o.color));
  gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_SHORT,0);
 }
 avatar(p,local){
  const now=performance.now(),dt=this.frameDt||.016;
  const x=local?this.pos.x:Number.isFinite(p.x)?p.x:0,z=local?this.pos.z:Number.isFinite(p.z)?p.z:3;
  const heading=local?this.heading:Number.isFinite(p.heading)?p.heading:0;
  let a=this.avatarAnim.get(p.id);
  if(!a){a={x,z,heading,phase:0,walk:0,seed:(p.name||'').length};this.avatarAnim.set(p.id,a);}
  const k=1-Math.exp(-dt*13),dx=x-a.x,dz=z-a.z;
  const speed=local?(this.moving?Math.hypot(this.moveVec.x,this.moveVec.z):0):Math.hypot(dx,dz)*k/Math.max(.002,dt);
  a.x+=dx*(local?1:k);a.z+=dz*(local?1:k);
  a.walk+=(Number(speed>.13)-a.walk)*k;
  a.heading+=Math.atan2(Math.sin(heading-a.heading),Math.cos(heading-a.heading))*k;
  a.phase+=dt*(6.5+Math.min(7,speed))*a.walk;
  drawStudent(this,p,a,local,now,dt,speed);
 }
 frame(t){if(!this.started)return;let dt=Math.min(.10,(t-this.lastTime)/1000||0);this.lastTime=t;this.frameDt=dt;let gl=this.gl;let w=this.canvas.clientWidth||800,h=this.canvas.clientHeight||600,dpr=Math.min(devicePixelRatio||1,1.6);let pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(this.canvas.width!==pw||this.canvas.height!==ph){this.canvas.width=pw;this.canvas.height=ph;if(gl)gl.viewport(0,0,pw,ph);} let f=Number(Boolean(this.keys.w||this.keys.arrowup))-Number(Boolean(this.keys.s||this.keys.arrowdown));
 let side=Number(Boolean(this.keys.d||this.keys.arrowright))-Number(Boolean(this.keys.a||this.keys.arrowleft));
 if(this.joystick){f+=this.joystick.f;side+=this.joystick.side;}
 if(this.isBlocked?.()||this.seat||this.preview){f=0;side=0;}
 const wasMoving=this.moving;
 const direction=this.camera.yaw,spd=(this.keys.shift?6.35:3.65)/Math.max(1,Math.hypot(f,side));
 const accel=1-Math.exp(-dt*(f||side?11:15));
 this.moveVec.x+=((Math.cos(direction)*side-Math.sin(direction)*f)*spd-this.moveVec.x)*accel;
 this.moveVec.z+=((-Math.cos(direction)*f-Math.sin(direction)*side)*spd-this.moveVec.z)*accel;
 if(this.seat||this.isBlocked?.()){this.moveVec.x=0;this.moveVec.z=0;}
 const ox=this.pos.x,oz=this.pos.z;
 if(!this.preview)walk(this.pos,this.moveVec.x*dt,this.moveVec.z*dt,this.scene);
 this.moving=Math.hypot(this.pos.x-ox,this.pos.z-oz)>.0004;
 if(this.moving)this.heading=Math.atan2(this.pos.x-ox,this.pos.z-oz);
 if(this.jumpStarted!==null){
  const elapsed=Math.max(0,(t-this.jumpStarted)/1000);
  this.jumpHeight=Math.max(0,4.9*elapsed-5.9*elapsed*elapsed);
  if(elapsed>=4.9/5.9){this.jumpStarted=null;this.motionDirty=true;}
 }
 if(this.poseUntil&&t>this.poseUntil){this.poseUntil=0;this.pose=this.seat?'sit':'idle';this.motionDirty=true;}
 if((wasMoving&&!this.moving)||(this.wasAirborne&&this.jumpHeight===0))this.motionDirty=true;
 const active=this.moving||this.jumpHeight>0||this.motionDirty;
 if(active&&t-this.lastNet>100&&!this.preview){
  this.lastNet=t;this.motionDirty=false;
  this.onMove({x:this.pos.x,z:this.pos.z,jump:this.jumpHeight,heading:this.heading,pose:this.pose});
 }
 this.wasAirborne=this.jumpHeight>0;
 this.camera.focusX+=(this.pos.x-this.camera.focusX)*Math.min(1,dt*3);this.camera.focusZ+=(this.pos.z-(this.preview?0:2.4)-this.camera.focusZ)*Math.min(1,dt*3);
 const {yaw,pitch,dist}=this.camera, eye=[this.camera.focusX+Math.sin(yaw)*Math.cos(pitch)*dist,Math.sin(pitch)*dist+(this.preview?1.05:1.55),this.camera.focusZ+Math.cos(yaw)*Math.cos(pitch)*dist],target=[this.camera.focusX,this.preview?1.34:1.22,this.camera.focusZ];let view=lookAt(eye,target),proj=perspective(.81,w/h,.1,120);this.projView=mulMat(proj,view);
 if(gl){gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.useProgram(this.program);gl.uniformMatrix4fv(this.uniform.proj,false,proj);gl.uniformMatrix4fv(this.uniform.view,false,view);gl.uniform3fv(this.uniform.fogColor,rgb(sceneLayout(this.scene).fog));}else{this.fallbackDyn=[];this.softView=view;this.softEye=eye;this.softWidth=pw;this.softHeight=ph;}
 this.drawCampus();if(gl&&!this.preview&&!this.reduceMotion.matches)animateCampus(this,t);for(let p of this.members)if(p.id!==this.myId)this.avatar(p,false);let mine=this.members.find(p=>p.id===this.myId);if(mine)this.avatar(mine,true);
 for(let star of this.collectibles){if(!star.alive)continue;let y=.6+Math.sin(t*.002+star.x)*.2;this.draw({type:'sphere',x:star.x,y,z:star.z,sx:.39,sy:.48,sz:.39,color:'#FCE68A'});this.draw({type:'sphere',x:star.x,y:y+.05,z:star.z,sx:.18,sy:.22,sz:.18,color:'#FFFFFF'});if(Math.hypot(this.pos.x-star.x,this.pos.z-star.z)<.75){star.alive=false;this.onStar(this.collectibles.filter(s=>!s.alive).length,this.collectibles.length);}}
 if(!gl)this.drawFallback();if(this.onFrame)this.onFrame();requestAnimationFrame(this.renderFrame);}

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
   if(type==='sphere'||type==='ring'||Object.hasOwn(profiles,type)){
    let sxp=left&&right?Math.abs(right[0]-left[0])/2:15;let syp=top&&base?Math.abs(base[1]-top[1])/2:sxp; if(sxp<.5||syp<.5)continue;
    let grd=ctx.createRadialGradient(C[0]-sxp*.28,C[1]-syp*.35,0,C[0],C[1],Math.max(sxp,syp)*1.2);grd.addColorStop(0,shade(color,1.12));grd.addColorStop(.67,shade(color,.96));grd.addColorStop(1,shade(color,.72));ctx.fillStyle=grd;ctx.beginPath();ctx.ellipse(C[0],C[1],sxp,syp,0,0,Math.PI*2);ctx.fill();continue;
   }
   if(type==='cyl'||type==='cone'||type==='ridge'){
    let rings=[];for(let height of [-.5,.5]){let arr=[];for(let i=0;i<10;i++){let a=i/10*Math.PI*2,rad=type!=='cyl'&&height===.5?0:1;arr.push(pt(x+Math.cos(a)*sx*.5*rad,y+sy*height,z+Math.sin(a)*sz*.5*rad));}rings.push(arr);}
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
 getStations(){return sceneLayout(this.scene).stations;}
 destroy(){this.started=false;if(this.preview&&this.gl)this.gl.getExtension("WEBGL_lose_context")?.loseContext();}
}
export {maps as presets};
