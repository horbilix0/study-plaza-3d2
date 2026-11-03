import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const STORE = path.join(ROOT, 'data', 'rooms.json');
const MAX_BODY = 96_000;
const rooms = new Map();
const listeners = new Map();
const roomSave = () => {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  const obj = Object.fromEntries(rooms);
  const tmp = STORE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, STORE);
};
try {
  const saved = JSON.parse(fs.readFileSync(STORE, 'utf8'));
  for (const [k, v] of Object.entries(saved)) {
    if (v && /^[A-Z0-9]{6}$/.test(k)) {
      v.customQuestions ||= []; v.examPeriod ||= 'Kasım Yazılıları'; v.scene||='garden'; v.hostId ||= v.members?.[0]?.id; v.game ||= {type:'ttt',board:Array(9).fill(''),players:[],turn:'X',winner:null};
      for (const m of v.members ?? []) m.ownedHats ||= ['none','cap'];
      if (v.timer?.running && v.timer.endsAt < Date.now()) {
        v.timer.running = false; v.timer.remaining = v.timer.phase === 'break' ? 5 * 60 : 25 * 60;
      }
      rooms.set(k, v);
    }
  }
} catch {}

const json = (res, status, value) => {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'Access-Control-Allow-Origin':'same-origin'});
  res.end(JSON.stringify(value));
};
const fail = (status, message) => Object.assign(new Error(message), {status});
const clean = (s, max = 100) => String(s ?? '').trim().replace(/[\x00-\x1f\x7f]/g, ' ').slice(0, max);
const codeCreate = () => {let s; do { s=Array.from(crypto.randomBytes(6), b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join(''); } while(rooms.has(s)); return s;};
const now = () => Date.now();
const freshPlayerId = () => crypto.randomUUID();

const questionList = (room, subject) => subject === 'custom' ? (room.customQuestions || []) : (QUIZZES[subject] || []);
function roomView(room, viewerId){
  const view = {...room, members:room.members.map(m=>({...m})), customQuestions:undefined};
  if(room.quiz){
    const quiz=room.quiz, questions=questionList(room,quiz.subject), q=questions[quiz.idx];
    view.quiz={subject:quiz.subject,idx:quiz.idx,revealed:quiz.revealed,complete:quiz.complete,submitted:Object.keys(quiz.answers).length,myChoice:quiz.answers[viewerId]??null,total:questions.length,
      current:q ? {q:q.q,options:q.options,...(quiz.revealed?{correct:q.correct,explanation:q.explanation}: {})} : null,
      results:quiz.revealed ? Object.entries(quiz.answers).map(([id,choice])=>({id,choice})) : undefined};
  }
  return view;
}
const broadcast = room => {
  for (const session of listeners.get(room.code) ?? []) {
    try {session.res.write(`event: state\ndata: ${JSON.stringify(roomView(room,session.memberId))}\n\n`);} catch {}
  }
};
const emit = room => {
  room.updatedAt = now(); room.revision=(room.revision||0)+1; roomSave();
  for (const session of listeners.get(room.code) ?? []) {
    try {session.res.write(`event: state\ndata: ${JSON.stringify(roomView(room,session.memberId))}\n\n`);} catch {}
  }
};
function ensureRoom(code) {const r=rooms.get(clean(code, 6).toUpperCase()); if(!r) throw fail(404, 'Oda bulunamadı. Kodu kontrol et.'); return r;}
function ensureMember(room,id){const member=room.members.find(m=>m.id===id); if(!member) throw fail(403,'Önce odaya katılmalısın.'); member.seen=now();return member;}
const presetSubjects = [
  {id:'kimya',name:'Kimya',icon:'⚗️',topics:[['atom','Atom modelleri','Dalton, Thomson, Rutherford ve Bohr'],['orbitaller','Orbitaller','s, p, d, f türleri ve enerji'],['guvenlik','Kimyasal güvenlik','Etiketler ve laboratuvar kuralları']]},
  {id:'tarih',name:'Tarih',icon:'🏛️',topics:[['tarih-yarari','Tarih öğrenmenin faydaları','Kimlik, neden-sonuç ve eleştirel düşünme'],['kaynaklar','Tarihsel kaynaklar','Birinci ve ikinci el kaynaklar']]}
];
function createRoom(name){const code=codeCreate();const id=freshPlayerId();const t=now();const room={code,createdAt:t,updatedAt:t,revision:1,hostId:id,scene:'garden',game:{type:'ttt',board:Array(9).fill(''),players:[],turn:'X',winner:null},examPeriod:'Kasım Yazılıları',customQuestions:[],members:[{id,name:clean(name,20)||'Öğrenci',hat:'none',skin:'mint',coins:0,ownedHats:['none','cap'],seen:t,x:0,z:3}],subjects:presetSubjects.map(s=>({...s,topics:s.topics.map(t=>({id:t[0],title:t[1],description:t[2],done:false}))})),notes:'Hedefimiz: Beraber öğrenmek, beraber başarmak! ✨',messages:[{id:crypto.randomUUID(),by:'Sistem',message:'Oda açıldı! Ders çalışmaya hazır mısınız? 🌤️',time:t}],timer:{phase:'focus',duration:25*60,remaining:25*60,running:false,endsAt:null,round:0},quiz:null}; rooms.set(code,room);emit(room);return{code,playerId:id,room};}
const QUIZZES={
 kimya:[
  {q:'Atomu içi dolu, bölünemez küre olarak açıklayan model?',options:['Dalton','Thomson','Rutherford','Bohr'],correct:0,explanation:'Dalton modeli atomu bilye gibi düşünür.'},
  {q:'Atomun büyük kısmının boşluk olduğunu gösteren bilim insanı?',options:['Bohr','Rutherford','Dalton','Thomson'],correct:1,explanation:'Rutherford altın levha deneyinden çekirdek ve boşluk sonucunu çıkardı.'},
  {q:'Hangi orbital türü toplam en fazla 6 elektron barındırır?',options:['s','p','d','f'],correct:1,explanation:'p alt kabuğunda 3 orbital vardır; her biri en fazla 2 elektron alır.'},
  {q:'1s, 2s, 2p, 3s için enerji sıralaması hangisi?',options:['1s < 3s < 2s < 2p','1s < 2s < 2p < 3s','2p < 2s < 1s < 3s'],correct:1,explanation:'Çok elektronlu atomlar için 1s < 2s < 2p < 3s.'},
  {q:'Çamaşır suyu ve tuz ruhu neden karıştırılmaz?',options:['İkisi de tuzdur','Klor gazı açığa çıkabilir','Renkleri değişir'],correct:1,explanation:'Zehirli klor gazı çıkabilir; kimyasalları karıştırmayın.'},
  {q:'Elektronları belirli enerji düzeylerinde açıklayan model?',options:['Thomson','Bohr','Dalton'],correct:1,explanation:'Bohr enerji katmanlarıyla bilinir.'}
 ],
 tarih:[
  {q:'Bir olayın gerçekleştiği döneme ait mektup ne tür kaynaktır?',options:['Birinci el','İkinci el','Sözlük'],correct:0,explanation:'O dönemde oluşturulan doğrudan belge birinci el kaynaktır.'},
  {q:'Tarih bilimi en çok hangi yönteme dayanır?',options:['Kanıtsız yorum','Kaynak ve kanıtların eleştirel incelenmesi','Geleceği kesin bilme'],correct:1,explanation:'Tarihçiler geçmişi kaynaklar üzerinden araştırır.'},
  {q:'Bir tarih kitabı eski belgeleri değerlendiriyorsa çoğunlukla ne tür kaynaktır?',options:['Birinci el','İkinci el','Deney raporu'],correct:1,explanation:'Sonradan yazılmış yorumlayıcı tarih araştırmaları çoğu zaman ikinci el kaynaktır.'},
  {q:'Tarih öğrenmenin katkılarından biri hangisidir?',options:['Geçmişi tümüyle değiştirmek','Tarih bilincini geliştirmek','Her geleceği kesin tahmin etmek'],correct:1,explanation:'Tarih öğrenmek geçmiş ve bugün arasında bağ kurmaya yardımcı olur.'}
 ]
};

function applyAction(room, member, data){
 const type=clean(data.type,40);
 if(type==='member:move'){
   const x=Number(data.x),z=Number(data.z);
   if(Number.isFinite(x)&&Number.isFinite(z)){
     const t=now(); if(!member.lastMove||t-member.lastMove>=75){
       member.x=Math.max(-9,Math.min(9,x));member.z=Math.max(-9,Math.min(9,z));member.lastMove=t; broadcast(room);
     }
   }
   return;
 }
 switch(type){
 case 'scene:set':{
  if(room.hostId!==member.id) throw fail(403,'Ortamı yalnızca oda kurucusu değiştirebilir');
  if(!['garden','library','beach','moon'].includes(data.scene))throw fail(400,'Geçersiz ortam');
  room.scene=data.scene;break;
 }
 case 'game:ttt:start':{
  const rival=room.members.find(m=>m.id!==member.id);
  if(!rival)throw fail(400,'Bu oyun için odada iki kişi olmalı');
  room.game={type:'ttt',board:Array(9).fill(''),players:[member.id,rival.id],turn:'X',winner:null};break;
 }
 case 'game:ttt:move':{
  const g=room.game;if(!g||g.winner)throw fail(400,'Oyun başlamadı veya bitti');
  const idx=Number(data.cell);if(!Number.isInteger(idx)||idx<0||idx>8||g.board[idx])throw fail(400,'Geçersiz hamle');
  const myMark=g.players[0]===member.id?'X':g.players[1]===member.id?'O':null;
  if(myMark!==g.turn)throw fail(403,'Sıra sende değil');
  g.board[idx]=myMark;
  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  if(lines.some(line=>line.every(i=>g.board[i]===myMark)))g.winner=myMark;
  else if(g.board.every(Boolean))g.winner='draw';
  else g.turn=myMark==='X'?'O':'X';break;
 }
 case 'game:ttt:reset':{
  const g=room.game;
  room.game={type:'ttt',board:Array(9).fill(''),players:g?.players?.length===2?g.players:[],turn:'X',winner:null};break;
 }

 case 'room:leave':{room.members=room.members.filter(m=>m.id!==member.id);if(room.hostId===member.id)room.hostId=room.members[0]?.id||null;if(room.game?.players?.includes(member.id))room.game={type:'ttt',board:Array(9).fill(''),players:[],turn:'X',winner:null};break;}
 case 'topic:add':{
  const s=room.subjects.find(x=>x.id===data.subject); if(!s)throw fail(400,'Ders bulunamadı');
  const title=clean(data.title,65), desc=clean(data.description,160); if(!title)throw fail(400,'Konu adı gerekli');
  if(s.topics.length >= 50)throw fail(400,'Bu ders için konu sınırına ulaşıldı');
  s.topics.push({id:crypto.randomUUID(),title,description:desc,done:false}); break;
 }
 case 'subject:add':{
   const name=clean(data.name,30);if(!name)throw fail(400,'Ders adı gerekli');
   if(room.subjects.length>=12)throw fail(400,'En fazla 12 ders eklenebilir');
   room.subjects.push({id:crypto.randomUUID(),name,icon:'📚',topics:[]});break;
 }
 case 'lesson:save':{
  let topic;for(const subject of room.subjects){topic=subject.topics.find(t=>t.id===data.topicId);if(topic)break;}
  if(!topic)throw fail(404,'Konu bulunamadı');
  topic.lesson=String(data.lesson||'').replace(/[\x00-\x08\x0e-\x1f]/g,'').slice(0,5000);topic.question=clean(data.question,220);topic.answer=clean(data.answer,320);break;
 }
 case 'topic:toggle':{
  let topic; for(const s of room.subjects){topic=s.topics.find(t=>t.id===data.topicId);if(topic)break;}
  if(!topic)throw fail(404,'Konu bulunamadı');
  topic.done=!topic.done;break;
 }
 case 'note:update': room.notes=clean(data.notes,3000);break;
 case 'exam:set':room.examPeriod=clean(data.examPeriod,45)||'Yazılı Dönemi';break;
 case 'chat:send':{
  const msg=clean(data.message,360);if(!msg)throw fail(400,'Mesaj boş');
  room.messages.push({id:crypto.randomUUID(),by:member.name,message:msg,time:now()});
  room.messages=room.messages.slice(-65);break;
 }
 case 'hat:buy': {
  const cost={beanie:25,crown:100,star:50,wizard:150}[data.hat];
  if(!cost)throw fail(400,'Bu şapka satın alınamaz');
  member.ownedHats||=['none','cap'];
  if(member.ownedHats.includes(data.hat))throw fail(400,'Bu şapka zaten sende');
  if(member.coins<cost)throw fail(400,'Yeterli coin yok');
  member.coins-=cost;member.ownedHats.push(data.hat);member.hat=data.hat;break;
 }
 case 'avatar:set': {
  member.ownedHats||=['none','cap'];
  if(data.hat!==undefined){
    if(!member.ownedHats.includes(data.hat))throw fail(403,'Bu şapka henüz açılmadı');
    member.hat=data.hat;
  }
  if(['mint','peach','blue','lilac','yellow'].includes(data.skin)) member.skin=data.skin;
  break;
 }
 case 'timer:set':{
  if(room.timer.running)throw fail(409,'Önce sayacı duraklat');
  const duration=Number(data.minutes);
  if(![1,15,25,40,50].includes(duration))throw fail(400,'Geçersiz süre');
  room.timer.duration=duration*60;room.timer.remaining=duration*60;room.timer.phase='focus';break;
 }
 case 'timer:start':{
  if(room.timer.running)break;
  room.timer.running=true;room.timer.endsAt=now()+room.timer.remaining*1000;break;
 }
 case 'timer:pause':{
  if(!room.timer.running)break;
  room.timer.remaining=Math.max(1,Math.ceil((room.timer.endsAt-now())/1000));room.timer.running=false;room.timer.endsAt=null;break;
 }
 case 'timer:reset':{
  room.timer.running=false;room.timer.endsAt=null;room.timer.phase='focus';room.timer.remaining=room.timer.duration;break;
 }
 case 'timer:next':{
  room.timer.running=false;room.timer.endsAt=null;
  if(room.timer.phase==='focus'){room.timer.phase='break';room.timer.remaining=300;}else{room.timer.phase='focus';room.timer.remaining=room.timer.duration;}
  break;
 }
 case 'quiz:add-custom':{
  const q=clean(data.q,220),choices=(data.options||[]).map(v=>clean(v,100));
  const correct=Number(data.correct),explanation=clean(data.explanation,280);
  if(!q||choices.length!==4||choices.some(v=>!v)||!Number.isInteger(correct)||correct<0||correct>3)throw fail(400,'Soru ve 4 seçenek gerekli');
  if(room.customQuestions.length>=60)throw fail(400,'En fazla 60 soru eklenebilir');
  room.customQuestions.push({q,options:choices,correct,explanation});break;
 }
 case 'quiz:start':{
  const subject=['kimya','tarih','custom'].includes(data.subject)?data.subject:'kimya';
  if(!questionList(room,subject).length)throw fail(400,'Bu kategoride henüz soru yok');
  room.quiz={subject,idx:0,revealed:false,answers:{},startedAt:now(),complete:false};break;
 }
 case 'quiz:answer':{
  if(!room.quiz || room.quiz.complete || room.quiz.revealed)throw fail(400,'Şu an cevap alınmıyor');
  const list=questionList(room,room.quiz.subject),q=list[room.quiz.idx];
  const chosen=Number(data.choice);if(!Number.isInteger(chosen)||chosen<0||chosen>=q.options.length)throw fail(400,'Cevap geçersiz');
  room.quiz.answers[member.id]=chosen;break;
 }
 case 'quiz:reveal': if(room.quiz)room.quiz.revealed=true;break;
 case 'quiz:next':{
  if(!room.quiz)break;
  if(!room.quiz.revealed)throw fail(400,'Önce cevapları göster');
  const old=questionList(room,room.quiz.subject)[room.quiz.idx];
  for(const [id,choice] of Object.entries(room.quiz.answers)){
    const p=room.members.find(m=>m.id===id);if(p&&choice===old.correct)p.coins+=5;
  }
  room.quiz.idx+=1;room.quiz.answers={};room.quiz.revealed=false;
  if(room.quiz.idx>=questionList(room,room.quiz.subject).length)room.quiz.complete=true;
  break;
 }
 case 'quiz:stop':room.quiz=null;break;
 default:throw fail(400,'Bilinmeyen işlem');
 }
 emit(room);
}
function checkTimers(){
 for(const room of rooms.values()){
  const t=room.timer;
  if(!t.running||!t.endsAt||t.endsAt>now())continue;
  t.running=false;t.endsAt=null;
  if(t.phase==='focus'){
    t.round++;t.phase='break';t.remaining=5*60;
    for(const p of room.members)if(t.duration>=15*60&&now()-p.seen<60*60*1000)p.coins+=25;
    room.messages.push({id:crypto.randomUUID(),by:'Sistem',message:t.duration>=15*60?'Harika! Çalışma turu tamamlandı. Herkese +25 coin! 🎉':'Deneme turu tamamlandı! Şimdi molaya geçebilirsiniz. ☁️',time:now()});
  } else {t.phase='focus';t.remaining=t.duration;room.messages.push({id:crypto.randomUUID(),by:'Sistem',message:'Mola bitti. Yeni bir odak turuna hazır mısınız? 📚',time:now()});}
  room.messages=room.messages.slice(-65);emit(room);
 }
}
setInterval(checkTimers,1000).unref();
setInterval(()=>{for(const [code,room] of rooms){if(now()-room.updatedAt>1000*60*60*24*30){rooms.delete(code);listeners.delete(code);}}},1000*60*60).unref();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon'};
async function getBody(req){let text='';for await (const chunk of req){text+=chunk;if(text.length>MAX_BODY)throw fail(413,'İstek çok uzun');}try{return JSON.parse(text||'{}');}catch{throw fail(400,'Geçersiz veri');}}
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{ok:true,rooms:rooms.size});
  if(req.method==='POST'&&url.pathname==='/api/create'){
   const body=await getBody(req);return json(res,200,createRoom(body.name));
  }
  if(req.method==='POST'&&url.pathname==='/api/join'){
   const body=await getBody(req),room=ensureRoom(body.code);const id=clean(body.playerId,80)||freshPlayerId();
   const name=clean(body.name,20)||'Öğrenci';let p=room.members.find(m=>m.id===id);
   if(!p){if(room.members.length>=8)throw fail(403,'Oda dolu (8/8)');p={id,name,hat:'none',skin:'mint',coins:0,ownedHats:['none','cap'],seen:now(),x:0,z:3};room.members.push(p);}
   else {p.name=name;p.seen=now();}
   emit(room);return json(res,200,{room:roomView(room,id),code:room.code,playerId:id});
  }
  if(req.method==='GET'&&url.pathname==='/api/room'){
   const room=ensureRoom(url.searchParams.get('code'));
   ensureMember(room,url.searchParams.get('playerId'));
   return json(res,200,{room:roomView(room,url.searchParams.get('playerId'))});
  }
  if(req.method==='GET'&&url.pathname==='/api/events'){
   const room=ensureRoom(url.searchParams.get('code'));
   const member=ensureMember(room,url.searchParams.get('playerId'));
   res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});
   res.write(`event: state\ndata: ${JSON.stringify(roomView(room,member.id))}\n\n`);
   if(!listeners.has(room.code))listeners.set(room.code,new Set());const session={res,memberId:member.id};listeners.get(room.code).add(session);
   const h=setInterval(()=>{member.seen=now();try{res.write(': alive\n\n');}catch{}},12000);
   req.on('close',()=>{clearInterval(h);listeners.get(room.code)?.delete(session);});return;
  }
  if(req.method==='POST'&&url.pathname==='/api/action'){
   const data=await getBody(req),room=ensureRoom(data.code);const member=ensureMember(room,data.playerId);
   applyAction(room,member,data);return json(res,200,{ok:true});
  }
  if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/index.html'||url.pathname==='/style.css'||url.pathname==='/app.js'||url.pathname==='/world.js')){
   const file=path.join(ROOT,url.pathname==='/'?'index.html':url.pathname.slice(1));
   const ext=path.extname(file);res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream','Cache-Control':'no-cache'});
   return fs.createReadStream(file).pipe(res);
  }
  throw fail(404,'Sayfa bulunamadı');
 }catch(e){ if(!res.headersSent)json(res,e.status||500,{error:e.message||'Sunucu hatası'});else res.end(); }
});
server.listen(PORT,'0.0.0.0',()=>console.log(`Study Plaza hazır: http://localhost:${PORT}`));
