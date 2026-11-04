import {changeFocus,focusMinutes,focusState} from './study-focus.js';
import {ExamHub} from './exam-hub.js';
import {avatarOptions,cleanAvatar,sceneLayout} from './plaza-shared.js';
import {PlazaWorld,presets} from './world.js';
const $=(s,b=document)=>b.querySelector(s), $$=(s,b=document)=>[...b.querySelectorAll(s)];
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={solo:false,room:null,id:null,code:null,name:'',events:null,world:null,panel:null,scene:'garden',lastRev:-1,quizSubject:'kimya',lessonId:null,lessonEditing:false,labModel:'rutherford',game:null,math:null,star:null,starEnd:0};
const gameInfo=[{id:'memory',emoji:'🃏',name:'Memory Flip',desc:'12 kartı eşleştir, hafızanı çalıştır.',players:'Tek kişilik'},{id:'math',emoji:'⚡',name:'Math Blitz',desc:'30 saniyede doğru işlem yağmuru!',players:'Tek kişilik'},{id:'stars',emoji:'🌟',name:'Star Dash 3D',desc:'Dünyaya dağılan 12 yıldızı topla.',players:'3D hareket'},{id:'ttt',emoji:'⭕',name:'XO Düellosu',desc:'Arkadaşına karşı sıra tabanlı düello.',players:'2 kişilik · canlı'}];
const hats={none:['Şapkasız','🙂',0],cap:['Şapka','🧢',0],beanie:['Bere','🧶',25],star:['Yıldız','⭐',50],crown:['Taç','👑',100],wizard:['Büyücü','🪄',150]};
const swatches={mint:'#6FC4AD',peach:'#E8A0AC',blue:'#80ADDF',lilac:'#B7A3E9',yellow:'#EFCB7D'};
const atom={dalton:['Dalton','İçi dolu bir küre. Atomun iç yapısı bilinmiyordu.','Dolu küre'],thomson:['Thomson','Pozitif yük içine negatif elektronların dağıldığı model. Çekirdek yok.','Üzümlü kek'],rutherford:['Rutherford','Atomun büyük kısmı boşluktur, ortada pozitif çekirdek vardır.','Altın levha'],bohr:['Bohr','Elektronlar belirli enerji düzeylerinde bulunur.','Katmanlar'],modern:['Modern atom','Kesin elektron yörüngesi yerine bulunma olasılığı yüksek orbitaller.','Elektron bulutu']};
const hubPanes=new Set(['today','library','planner','scenarios','simulator']);
const hub=new ExamHub({open:openPanel,notify:toast});
let avatarPreview,previewMember,queuedMotion,postingMotion=false;
const nameLabels=new Map();
const avatarKey='study-plaza-avatar-v1';
function storedAvatar(){
  try{return JSON.parse(localStorage.getItem(avatarKey)||'null');}catch{return null;}
}
function rememberAvatar(avatar,skin){
  try{localStorage.setItem(avatarKey,JSON.stringify({avatar,skin}));}catch{}
}
async function postMotion(pose){
  queuedMotion=pose;
  if(postingMotion)return;
  postingMotion=true;
  try{
    while(queuedMotion&&state.room){
      const motion=queuedMotion;
      queuedMotion=null;
      const response=await send('member:move',motion,true);
      if(response?.position&&!state.world.seat){
        queuedMotion=null;
        state.world.pos=response.position;
      }
    }
  }catch{}finally{postingMotion=false;}
}
const personalFocusKey='study-plaza-focus-v1';
function personalFocus(){
  let stored=null;
  try{stored=JSON.parse(localStorage.getItem(personalFocusKey)||'null');}catch{}
  const state=focusState(stored,Date.now());
  if(stored?.ends&&!state.ends)savePersonalFocus(state);
  return state;
}
function savePersonalFocus(state){
  try{localStorage.setItem(personalFocusKey,JSON.stringify(state));}catch{}
}
function renderPersonalFocus(box){
  const t=personalFocus();
  box.innerHTML=`<div class="focus-sheet personal-focus"><small>KİŞİSEL ODAK</small><b id="personal-clock"></b><div class="focus-actions"><button class="hub-button" data-personal-focus="toggle">Başlat</button><button class="avatar-action" data-personal-focus="reset">Sıfırla</button></div><label>Odak süresi <select id="personal-duration">${focusMinutes.map(m=>`<option value="${m}" ${m*60===t.duration?'selected':''}>${m} dk</option>`).join('')}</select></label></div><p class="panel-helper"><span id="personal-rounds">${t.completed}</span> tamamlanan oturum · Sayaç bu tarayıcıda kaydedilir.</p>`;
  updatePersonalFocus(t);
}
function updatePersonalFocus(t=personalFocus()){
  const clock=$('#personal-clock');
  if(!clock)return;
  clock.textContent=String(Math.floor(t.left/60)).padStart(2,'0')+':'+String(t.left%60).padStart(2,'0');
  $('[data-personal-focus="toggle"]').textContent=t.ends?'Duraklat':t.left===0?'Yeniden başlat':t.left===t.duration?'Başlat':'Devam et';
  $('#personal-duration').disabled=Boolean(t.ends);
  $('#personal-rounds').textContent=t.completed;
}
function handlePersonalFocus(action,minutes){
  const t=changeFocus(personalFocus(),action,Date.now(),minutes);
  savePersonalFocus(t);
  updatePersonalFocus(t);
}
function openSolo(){
  if(state.room)return;
  state.solo=true;
  const url=new URL(location.href);url.searchParams.set('study','1');history.replaceState(null,'',url);
  $('#app').classList.remove('hidden');$('#app').classList.add('solo-mode');
  $('#launch').classList.add('hidden');$('#dock-home-label').textContent='Bugün';
  openPanel('today');
}
function closeSolo(){
  if(!state.solo)return;
  state.solo=false;
  closePanel();
  const url=new URL(location.href);url.searchParams.delete('study');history.replaceState(null,'',url);
  $('#app').classList.add('hidden');$('#app').classList.remove('solo-mode');$('#launch').classList.remove('hidden');
  $('#dock-home-label').textContent='Plaza';$('#solo-entry').focus();
}
function renderMenu(box,panel){
  const rows=panel==='exams'?
    [['today','Bugünkü plan','Sıradaki sınavın ve kaldığın deneme','plaza'],['planner','Takvim','Tarihlerini ve çalışma süreni planla','clock'],['scenarios','Senaryolar','Ders ve yazılı kapsamını karşılaştır','book'],['simulator','Denemeler','Süreli prova veya kısa konu testi','exam']]:
    [['closet','Avatarım','Saç, kıyafet ve aksesuarlarını seç','room'],['stats','İstatistikler','Çalışma süreni ve başarılarını gör','exam'],['arcade','Mola oyunları','Oda oyunları ve mini görevler','more'],['world','Ortam değiştir','Dört çalışma alanından birini seç','map']];
  box.innerHTML=`<div class="panel-menu">${rows.map(([route,title,body,icon])=>`<button type="button" class="route-card" data-route="${route}"><span class="route-icon"><svg class="ui-icon" aria-hidden="true"><use href="#i-${icon}"></use></svg></span><span><strong>${title}</strong><small>${body}</small></span><span class="route-arrow" aria-hidden="true">›</span></button>`).join('')}</div>${panel==='more'?'<button class="leave-room" type="button" data-leave-room>Odadan çık</button>':''}`;
}
function renderFocus(box){
  box.innerHTML=`<div class="focus-sheet"><small id="focus-phase">ODAK</small><b id="friends-timer">${safe($('#live-timer').textContent)}</b><div class="focus-actions"><button class="hub-button" data-friends="timer">${state.room.timer.running?'Duraklat':'Başlat'}</button><button class="avatar-action" data-friends="skip">Sonraki evre</button></div><label>Odak süresi <select id="friends-duration">${[1,15,25,40,50].map(n=>`<option value="${n}" ${Math.round(state.room.timer.duration/60)===n?'selected':''}>${n} dk</option>`).join('')}</select></label></div><p class="panel-helper">Odadaki herkes aynı sayacı görür.</p>`;
  tickTimer();
}
function renderFriends(box){
  const draft=$('#room-chat-form input')?.value||'';
  const focused=document.activeElement?.closest('#room-chat-form');
  box.innerHTML=`<div class="room-summary"><div><small>ODA KODU</small><b>${safe(state.code)}</b></div><button class="hub-button" data-friends="invite">Bağlantıyı kopyala</button><button class="avatar-action" data-route="focus">Odak sayacı</button></div>
  <div class="room-members" aria-label="Odada bulunanlar">${state.room.members.map(m=>`<span><b>${safe(m.name)}</b>${m.id===state.id?' · sen':''}${m.seat?' · masada':''}</span>`).join('')}</div>
  <div class="white-card room-chat"><h3>Sohbet</h3><div class="room-mobile-tools"><div class="chat-feed">${state.room.messages.slice(-12).map(m=>`<div class="msg"><b>${safe(m.by)}</b> ${safe(m.message)}${state.room.hostId===state.id&&m.authorId?` <button class="chevron-btn" type="button" data-remove-message="${safe(m.id)}" aria-label="Mesajı kaldır">×</button>`:''}</div>`).join('')}</div><form id="room-chat-form" class="chat-form"><input name="message" maxlength="360" placeholder="Odaya mesaj yaz" aria-label="Mesaj" required><button type="submit" aria-label="Gönder">↑</button></form></div></div>`;
  if(draft)$('#room-chat-form input').value=draft;
  if(focused)$('#room-chat-form input').focus({preventScroll:true});
  const feed=$('.room-chat .chat-feed');
  feed.scrollTop=feed.scrollHeight;
}
function renderStats(box){
  const m=me(),rounds=m?.focusRounds||0,minutes=Math.floor((m?.focusSeconds||0)/60);
  const xp=rounds*25;
  box.innerHTML=`<div class="white-card"><h3>Bu odadaki çalışmaların</h3><p>${minutes} dk odak · ${rounds} tur · ${xp} XP · Seviye ${1+Math.floor(xp/100)}</p><p>15 dakika ve üzeri tamamlanan odak turları XP kazandırır.</p></div><div class="white-card"><h3>Başarılar</h3><p>${rounds?'✓':'○'} İlk odak turu</p><p>${minutes>=60?'✓':'○'} Bir saat odak</p><p>${rounds>=5?'✓':'○'} Beş odak turu</p></div><div class="white-card"><h3>Kişisel sınav çalışman</h3><p>${hub.data.done.length} tamamlanan konu · ${hub.data.results.length} son deneme</p><button class="avatar-action" data-friends="planner">Sınavlarımı aç</button></div>`;
}
function setAvatarPreview(){
  const canvas=$('#avatar-preview');
  if(!canvas)return;
  avatarPreview?.destroy();
  avatarPreview=new PlazaWorld(canvas,{preview:true});
  previewMember={...me(),x:0,z:0,heading:0,seat:null,pose:'idle',jump:0};
  avatarPreview.setMembers([previewMember],previewMember.id);
}
function updateNameLabels(world){
  for(const [id,label] of nameLabels){
    const v=world.getLabel(id);
    label.hidden=!v||v.x<0||v.x>100||v.y<0||v.y>100;
    if(v&&!label.hidden){label.style.left=v.x+'%';label.style.top=v.y+'%';}
  }
}
function refreshNameLabels(){
  const members=state.room.members;
  for(const [id,label] of nameLabels)if(!members.some(m=>m.id===id)){label.remove();nameLabels.delete(id);}
  for(const member of members){
    let label=nameLabels.get(member.id);
    if(!label){label=document.createElement('span');label.className='player-label';$('#world-labels').append(label);nameLabels.set(member.id,label);}
    label.textContent=member.name;
  }
}
function wireTouch(){
  const joy=$('.touch-joy'),knob=joy.firstElementChild;
  let pointer=null;
  const update=e=>{
    if(e.pointerId!==pointer||!state.world)return;
    const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,max=r.width*.33;
    const scale=Math.max(max,Math.hypot(x,y));
    knob.style.transform=`translate(${x/scale*max}px,${y/scale*max}px)`;
    state.world.joystick={side:x/scale,f:-y/scale};
  };
  joy.addEventListener('pointerdown',e=>{
    if(pointer!==null)return;
    pointer=e.pointerId;joy.setPointerCapture(pointer);update(e);
  });
  joy.addEventListener('pointermove',update);
  const clear=e=>{
    if(e?.pointerId!==undefined&&e.pointerId!==pointer)return;
    pointer=null;knob.style.transform='';
    if(state.world)state.world.joystick=null;
  };
  for(const event of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(event,clear);
  window.addEventListener('blur',()=>clear());
  $('#touch-jump').addEventListener('click',()=>state.world?.jump());
  $('#touch-interact').addEventListener('click',()=>state.world?.tryInteract());
}
function toast(msg,error=false){let el=$('#toast');el.textContent=msg;el.className='show'+(error?' error':'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='',3500)}
async function api(route,body){let r=await fetch('/api/'+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});let j=await r.json().catch(()=>({error:'Sunucudan yanıt alınamadı'}));if(!r.ok)throw Error(j.error||'İşlem başarısız');return j;}
async function send(type,extra={},quiet=false){if(!state.room)return;try{return await api('action',{type,code:state.code,playerId:state.id,token:state.token,...extra});}catch(e){if(!quiet)toast(e.message,true);throw e}}
const me=()=>state.room?.members.find(m=>m.id===state.id);
function saveSession(){localStorage.setItem('study-plaza-3d',JSON.stringify({code:state.code,id:state.id,token:state.token,name:state.name}));}
function sessionStart(res){state.code=res.code;state.id=res.playerId;state.token=res.token;state.room=res.room;state.lastRev=-1;saveSession();$('#launch').classList.add('hidden');$('#app').classList.remove('hidden');if(!state.world){try{state.world=new PlazaWorld($('#world'));state.world.onMove=postMotion;state.world.isBlocked=()=>Boolean(state.panel);state.world.onInteract=(id,seat)=>{if(id==='seat')send('seat:set',{seat}).catch(()=>{});else openPanel(stationPanel(id));};state.world.onStar=(found,total)=>{if(!state.star)return;state.star.found=found;if(found===total){state.star.finished=true;state.world.setStarHunt(false);toast('🌟 Bütün yıldızları topladın!');renderDrawer();}else if(state.panel==='arcade')renderDrawer();};state.world.onFrame=updateWorldLabels;}catch(e){toast('3D açılırken hata: '+e.message,true);console.error(e)}}subscribe();receive(res.room);const savedAvatar=storedAvatar();if(savedAvatar&&!me()?.avatar)send('avatar:set',savedAvatar,true).catch(()=>{});toast('Plaza dünyana hoş geldin! ☁️');}
async function createRoom(){const name=$('#nickname').value.trim()||'Öğrenci';let b=$('#create-room');b.disabled=true;try{let r=await api('create',{name});state.name=name;sessionStart(r);}catch(e){toast(e.message,true);}finally{b.disabled=false}}
async function joinRoom(code,id=null,name=null,token=null){let n=name||$('#nickname').value.trim()||'Öğrenci';try{let r=await api('join',{code,playerId:id,token,name:n});if(state.solo)return;state.name=n;sessionStart(r)}catch(e){toast(e.message,true);localStorage.removeItem('study-plaza-3d')}}
function subscribe(){
  state.events?.close();
  state.events=new EventSource(`/api/events?code=${encodeURIComponent(state.code)}&token=${encodeURIComponent(state.token)}`);
  state.events.addEventListener('state',e=>{try{receive(JSON.parse(e.data))}catch(err){console.error(err)}});
  state.events.addEventListener('motion',e=>{
    try{
      const motion=JSON.parse(e.data);
      const member=state.room?.members.find(m=>m.id===motion.id);
      if(member)Object.assign(member,motion);
    }catch(err){console.error(err);}
  });
  state.events.onerror=()=>{$('#bottom-hint').textContent='Bağlantı tekrar kuruluyor...';};
}

function receive(room){const oldScene=state.scene;state.room=room;state.world?.setMembers(room.members,state.id);state.scene=room.scene||'garden';if(state.scene!==oldScene||!$('#app').dataset.scene){state.world?.setScene(state.scene);state.world?.setStarHunt(false);state.star=null;$('#app').dataset.scene=state.scene;}if(room.revision!==state.lastRev){state.lastRev=room.revision;refreshUI();refreshNameLabels();if(state.panel==='closet'&&previewMember&&me()?.hat!==previewMember.hat){const draft=previewMember.avatar;renderDrawer();if(draft){previewMember.avatar=draft;for(const [k,v] of Object.entries(draft))$('#avatar-form').elements[k].value=v;}}else if(state.panel&&!hubPanes.has(state.panel)&&state.panel!=='closet')renderDrawer();}tickTimer()}
function stationPanel(id){
  return {study:'study',quiz:'quiz',arcade:'arcade',closet:'closet'}[id];
}
function updateWorldLabels(){
  const world=state.world;
  if(!world)return;
  updateNameLabels(world);
  const nearby=world.getStations().map(s=>({...s,dist:Math.hypot(world.pos.x-s.x,world.pos.z-s.z)})).sort((a,b)=>a.dist-b.dist);
  for(const [i,s] of nearby.entries()){
    const el=$(`#station-${s.id}`), v=world.project(s.x,s.y,s.z);
    el.hidden=!v||i>1||s.dist>9||v.x<6||v.x>94||v.y<9||v.y>83;
    if(!el.hidden){el.style.left=v.x+'%';el.style.top=v.y+'%';el.classList.toggle('near',s.dist<3.6);}
  }
  const next=state.star&&!state.star.finished?`Yıldız avı · ${state.star.found}/12 · ${Math.max(0,Math.ceil((state.starEnd-Date.now())/1000))} sn`:world.seat?'E ile kalk · R ile çalış':sceneLayout(state.scene).seats.some(seat=>Math.hypot(world.pos.x-seat.x,world.pos.z-seat.z)<1)?'E ile masaya otur':nearby[0]?.dist<3.6?`E ile aç · ${nearby[0].name}`:'WASD hareket · Fareyle kamera · E etkileşim';
  const hint=$('#bottom-hint');
  if(hint.textContent!==next)hint.textContent=next;
  hint.classList.toggle('interaction',next.startsWith('E '));
  if(state.star&&!state.star.finished&&Date.now()>state.starEnd){state.star.finished=true;world.setStarHunt(false);toast('Star Dash turu bitti!');if(state.panel==='arcade')renderDrawer();}
}
function resetLabels(){
  $('#world-labels').innerHTML=presets.garden.stations.map(s=>`<button type="button" class="world-label" id="station-${s.id}" data-station="${s.id}" hidden><span aria-hidden="true">${s.icon}</span>${s.name}</button>`).join('');
}
function refreshUI(){
  if(!state.room)return;
  const scene=sceneLayout(state.scene);
  $('#world-name').textContent=scene.name;
  $('.campus-mark').textContent=scene.icon;
  $('#online-count').textContent=state.room.members.length;
  tickTimer();
}
function tickTimer(){
  const t=state.room?.timer;
  if(!t)return;
  const seconds=t.running?Math.max(0,Math.ceil((t.endsAt-Date.now())/1000)):t.remaining;
  const time=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  $('#live-timer').textContent=time;
  $('#live-timer').closest('button').classList.toggle('running',t.running);
  const clock=$('#friends-timer'),phase=$('#focus-phase'),duration=$('#friends-duration');
  if(clock)clock.textContent=time;
  if(phase)phase.textContent=t.phase==='break'?'MOLA':'ODAK';
  if(duration)duration.disabled=t.running;
}
const pageTitles={today:'Bugün',world:'Ortam seç',exams:'Sınavlar',more:'Diğer',library:'Dersler',planner:'Sınav takvimi',scenarios:'Senaryolar',simulator:'Denemeler',friends:'Oda',focus:'Odak sayacı',stats:'İstatistikler',study:'Ortak ders panosu',quiz:'Quiz Arenası',arcade:'Mola oyunları',closet:'Avatarım'};
function updateDock(panel){
  const route=state.solo&&panel==='focus'?'focus':['exams','planner','scenarios','simulator','quiz'].includes(panel)?'exams':
    ['more','stats','closet','arcade'].includes(panel)?'more':
    ['friends','focus'].includes(panel)?'friends':
    ['library','study'].includes(panel)?'library':null;
  $$('.campus-dock button').forEach(b=>{
    const selected=route?b.dataset.open===route:b.hasAttribute('data-home');
    b.classList.toggle('selected',selected);
    if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
}
function openPanel(panel){
  if(!pageTitles[panel]||state.solo&&!hubPanes.has(panel)&&!['exams','focus'].includes(panel))return;
  if(state.world)state.world.keys={};
  if(panel!=='closet'){avatarPreview?.destroy();avatarPreview=null;}
  state.panel=panel;
  $('#app').classList.add('panel-open');
  $('#drawer').dataset.pane=panel;
  $('#drawer-eyebrow').textContent=hubPanes.has(panel)?'ÇALIŞMA ALANI':'STUDY PLAZA';
  $('#drawer-title').textContent=pageTitles[panel];
  $('#drawer').classList.remove('hidden');
  $('#panel-shade').classList.remove('hidden');
  updateDock(panel);
  renderDrawer();
  $('#close-drawer').focus({preventScroll:true});
}
function closePanel(){
  if(!state.panel)return;
  if(state.solo){if(state.panel!=='today')openPanel('today');return;}
  hub.clearTimer();avatarPreview?.destroy();avatarPreview=null;state.panel=null;
  $('#app').classList.remove('panel-open');
  $('#drawer').classList.add('hidden');$('#panel-shade').classList.add('hidden');
  updateDock(null);state.world?.canvas.focus({preventScroll:true});
}
function renderDrawer(){
  const box=$('#drawer-body');
  if(!box||!state.room&&!state.solo)return;
  if(state.solo&&state.panel==='focus'){hub.clearTimer();box.classList.remove('hub');renderPersonalFocus(box);return;}
  if(hubPanes.has(state.panel)){hub.render(box,state.panel);return;}
  hub.clearTimer();box.classList.remove('hub');
  const panel=state.panel;
  if(panel==='exams'||panel==='more')renderMenu(box,panel);
  else ({friends:renderFriends,focus:renderFocus,stats:renderStats,world:renderWorlds,study:renderStudy,quiz:renderQuiz,arcade:renderArcade,closet:renderCloset}[panel])?.(box);
}
function renderWorlds(box){
  const host=state.room.hostId===state.id;
  box.innerHTML=`<p class="panel-helper">${host?'Ortam değiştiğinde odadaki herkes seninle gelir.':'Ortamı oda kurucusu değiştirebilir.'}</p><div class="campus-map-grid">${Object.values(presets).map(({id,name,caption,description,icon})=>`<button class="campus-map-card" type="button" aria-pressed="${state.scene===id}" data-scene-choice="${id}" ${host?'':'disabled'}><span class="map-thumb map-${id}" aria-hidden="true"><i></i><b>${icon}</b></span><span class="map-card-copy"><small>${caption}</small><strong>${name}</strong><span>${description}</span></span>${state.scene===id?'<span class="map-active">Buradasın</span>':''}</button>`).join('')}</div>`;
}
function renderStudy(box){let room=state.room;let total=room.subjects.reduce((a,s)=>a+s.topics.length,0),done=room.subjects.reduce((a,s)=>a+s.topics.filter(t=>t.done).length,0);let topic=room.subjects.flatMap(s=>s.topics).find(t=>t.id===state.lessonId);box.innerHTML=`<div class="section-top"><div><span class="section-label">${safe(room.examPeriod)}</span><div style="font-size:14px;font-weight:1000">${done} / ${total} konu tamamlandı</div></div><button class="pill-action" data-prompt="exam">✎ Sınav dönemi</button></div><div class="study-progress"><div style="width:${total?done/total*100:0}%"></div></div><div class="panel-note">✨ Konu ekle, içine ders notu ve kontrol sorusu yaz, arkadaşlarınla aynı panoda çalış. Bitirilen konular herkeste eşzamanlı görünür.</div><div class="section-top"><span class="section-label" style="margin:0">DERSLERİMİZ</span><button class="pill-action" data-prompt="subject">＋ Ders ekle</button></div>${room.subjects.map(s=>`<div class="list-card"><div class="subject-title"><h3>${safe(s.icon||'📚')} ${safe(s.name)}</h3><button class="pill-action secondary" data-prompt="topic" data-subject="${safe(s.id)}">＋ Konu</button></div>${s.topics.length?s.topics.map(t=>`<div class="topic-line"><input type="checkbox" data-topic-toggle="${safe(t.id)}" ${t.done?'checked':''} aria-label="${safe(t.title)} tamamlandı"><label data-lesson-open="${safe(t.id)}"><b>${safe(t.title)}</b> <small>${safe(t.description)}</small></label><button class="pill-action secondary" style="padding:6px 9px" data-lesson-open="${safe(t.id)}">Aç ↗</button></div>`).join(''):'<p class="muted">Henüz konu yok. İlk konuyu ekle!</p>'}</div>`).join('')}<div class="white-card"><h3>📝 Ortak çalışma panosu</h3><textarea class="text-area" id="notes-editor" maxlength="3000">${safe(room.notes||'')}</textarea><button class="wide-button" data-action="save-notes">Panoyu kaydet ✓</button></div>`;
 if(topic){let section=document.createElement('section');section.className='white-card';section.id='active-lesson';section.innerHTML=`<div class="section-top"><div><span class="section-label">INTERAKTİF KONU</span><h3>${safe(topic.title)}</h3></div><button class="pill-action secondary" data-close-lesson>✕ Kapat</button></div><p class="muted">${safe(topic.description)}</p>${state.lessonEditing?`<label class="section-label">Konu anlatımı</label><textarea id="lesson-text" class="text-area" style="min-height:160px" placeholder="Ders notunuzu buraya yazın...">${safe(topic.lesson||'')}</textarea><label class="section-label">Kontrol sorusu</label><input class="text-input" id="lesson-question" value="${safe(topic.question||'')}" placeholder="Örn. Rutherford'un bulduğu iki sonuç?"/><label class="section-label">Doğru cevap / açıklama</label><input class="text-input" id="lesson-answer" value="${safe(topic.answer||'')}" placeholder="Atomun çoğu boşluk, pozitif çekirdek..."/><button class="wide-button" data-action="lesson-save">Kaydet ve paylaş</button>`:`<div class="panel-note" style="white-space:pre-wrap">${safe(topic.lesson||'Bu konu için henüz not eklenmedi. Arkadaşlarınla beraber oluşturabilirsin.')}</div>${topic.question?`<div class="white-card"><b>💭 Kendini kontrol et</b><p>${safe(topic.question)}</p><input id="self-check-input" class="text-input" placeholder="Cevabını önce kendin düşün..."/><button class="pill-action" data-show-answer style="margin-top:10px">Cevabı göster</button><p id="self-check-answer" class="answer-strip hidden">${safe(topic.answer||'Cevap henüz eklenmemiş.')}</p></div>`:''}<button class="pill-action" data-edit-lesson>✎ Not / soru ekle</button>`}`;box.prepend(section);}
}
function renderQuiz(box){const q=state.room.quiz;if(!q){box.innerHTML=`<p class="muted">Arkadaşlarınla aynı soruları eşzamanlı çöz. Herkes yanıtını verdikten sonra sonuçları açın. Her doğru cevap +5 coin kazandırır.</p><div class="white-card"><h3>⚡ Bir quiz başlat</h3><div class="chips">${[['kimya','⚗️ Kimya'],['tarih','🏛️ Tarih'],['custom','✍️ Kendi sorularımız']].map(([id,name])=>`<button data-quiz-subject="${id}" class="chip ${state.quizSubject===id?'selected':''}">${name}</button>`).join('')}</div><button class="wide-button" data-action="quiz-start">Birlikte başla →</button></div><div class="white-card"><h3>✍️ Kendi sorunu ekle</h3><form id="quiz-add-form"><input class="text-input" name="question" placeholder="Soru metni" required maxlength="220" style="margin-bottom:9px"/>${[0,1,2,3].map(i=>`<input class="text-input" name="opt${i}" placeholder="${String.fromCharCode(65+i)} seçeneği" required maxlength="100" style="margin-bottom:7px"/>`).join('')}<label class="section-label">Doğru seçenek</label><select class="text-input" name="correct"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select><input name="explanation" class="text-input" maxlength="280" placeholder="Cevap açıklaması (isteğe bağlı)" style="margin-top:8px"/><button class="wide-button">Soruyu ekle ＋</button></form></div>`;return;}
 if(q.complete){box.innerHTML=`<div class="white-card" style="text-align:center"><div style="font-size:55px">🏆</div><h2>Quiz tamamlandı!</h2><p class="muted">Harika iş! Konuları birlikte tekrar edin.</p><button class="wide-button" data-action="quiz-stop">Yeni quiz seç</button></div>`;return;}
 let question=q.current;if(!question){box.innerHTML='<div class="white-card">Soru bulunamadı.</div>';return;}
 box.innerHTML=`<div class="white-card"><div class="section-top"><span class="section-label">SORU ${q.idx+1} / ${q.total} · ${safe(q.subject.toUpperCase())}</span><span class="tag">${q.submitted}/${state.room.members.length} yanıt</span></div><div class="question-block">${safe(question.q)}</div>${question.options.map((opt,i)=>{let cl=q.revealed?(i===question.correct?'right':q.myChoice===i?'wrong':''):q.myChoice===i?'selected':'';return `<button data-choice="${i}" class="quiz-option ${cl}" ${q.revealed||q.myChoice!==null?'disabled':''}>${String.fromCharCode(65+i)}. ${safe(opt)} ${q.myChoice===i?'✓':''}</button>`}).join('')}${q.revealed?`<div class="answer-strip">✅ Doğru cevap: ${String.fromCharCode(65+question.correct)}<br>${safe(question.explanation||'Birlikte değerlendirin.')}</div>`:q.myChoice!==null?'<p class="panel-note">Cevabın gönderildi, arkadaşlarını bekle.</p>':''}<div class="quiz-actions">${q.revealed?'<button class="pill-action" data-action="quiz-next">Sonraki soru →</button>':'<button class="pill-action" data-action="quiz-reveal">Cevapları açıkla</button>'}<button class="pill-action secondary" data-action="quiz-stop">Bitir</button></div></div>`;
}
function renderArcade(box){const game=state.game;if(!game){box.innerHTML=`<p class="muted">3D plazada mola zamanı! Mini oyunlar odaklanma aralarında eğlenmek için tasarlandı. XO Düellosu oda arkadaşınla gerçek zamanlı oynanır.</p><div class="game-grid">${gameInfo.map(g=>`<button class="arcade-card" data-game="${g.id}"><span class="arcade-emoji">${g.emoji}</span><h3>${g.name}</h3><p>${g.desc}</p><small>${g.players} ↗</small></button>`).join('')}</div><div class="panel-note">🎯 Study Coins, odak turları ve bilgi quizlerinden kazanılır. Mini oyunlarda sınırsız coin kasılmaz.</div>`;return;}
 let back=`<div class="game-top"><button class="game-back" data-game-back>← Oyunlara dön</button><span class="tag">${gameInfo.find(g=>g.id===game)?.name||'Mola'}</span></div>`;
 if(game==='memory'){let g=state.memory;if(!g){startMemory();g=state.memory;}box.innerHTML=back+`<div class="white-card" style="text-align:center"><h3>🃏 Memory Flip</h3><p class="muted">Hamle: ${g.moves} · Eşleşme: ${g.matched.size/2}/6</p><div class="memory-grid">${g.cards.map((card,i)=>`<button class="memory-card ${g.open.includes(i)?'open':''} ${g.matched.has(i)?'matched':''}" data-memory="${i}" ${g.matched.has(i)?'disabled':''}>${g.open.includes(i)||g.matched.has(i)?card:'✿'}</button>`).join('')}</div>${g.matched.size===12?'<div class="answer-strip">🎉 Harika! Bütün kartları eşleştirdin.</div>':''}<button class="pill-action" data-memory-restart>Yeniden karıştır ↻</button></div>`;
 }else if(game==='math'){let g=state.math;if(!g){startMath();g=state.math;}let remain=Math.max(0,Math.ceil((g.end-Date.now())/1000));box.innerHTML=back+`<div class="white-card" style="text-align:center"><h3>⚡ Math Blitz</h3><div class="game-score">Skor: <b>${g.score}</b> · Kalan: <strong id="math-remaining">${remain}</strong> saniye</div>${remain?`<div class="math-prompt">${g.a} ${g.op} ${g.b} = ?</div><div>${g.options.map((o,i)=>`<button class="math-choice" data-math="${i}">${o}</button>`).join('')}</div>`:`<div style="font-size:50px">🏁</div><h2>Süre doldu!</h2><p>Skorun: ${g.score}</p><button class="pill-action" data-math-restart>Yeniden oyna</button>`}</div>`;
 }else if(game==='stars'){let g=state.star;if(!g){startStars();g=state.star;}let remain=Math.max(0,Math.ceil((state.starEnd-Date.now())/1000));box.innerHTML=back+`<div class="white-card" style="text-align:center"><div style="font-size:55px">🌟</div><h3>Star Dash 3D</h3><p>Plazada dolaşarak parlayan yıldızları topla.</p><div class="game-score">Yıldızlar: ${g.found}/12 · <strong id="star-remaining">${remain}</strong> saniye</div><div class="panel-note">W A S D ile hareket et. Yıldızlara yaklaşınca otomatik toplarsın.</div>${g.finished||remain===0?`<h3>Tur bitti! Toplanan yıldız: ${g.found}</h3><button class="pill-action" data-star-restart>Yeniden dene</button>`:'<button class="pill-action" data-arcade-close>Plazaya dön, yıldızları topla →</button>'}</div>`;
 }else if(game==='ttt'){let g=state.room.game,playing=g?.players?.length===2,mark=g?.players[0]===state.id?'X':g?.players[1]===state.id?'O':null;let names=g?.players?.map(id=>state.room.members.find(p=>p.id===id)?.name||'?')||[];let info=playing?(g.winner?g.winner==='draw'?'Berabere!':(g.winner===mark?'Kazandın! 🎉':'Oyun bitti!'):(g.turn===mark?'Sıra sende!':'Arkadaşını bekle...')):'İki kişi olduğunuzda oyun başlatabilirsiniz.';box.innerHTML=back+`<div class="white-card" style="text-align:center"><h3>⭕ XO Düellosu</h3><p class="muted">${playing?safe(names[0])+' (X) vs '+safe(names[1])+' (O)':'Odaya bir arkadaşını çağır!'}</p><div class="answer-strip">${safe(info)}</div><div class="ttt-grid">${(g?.board||Array(9).fill('')).map((v,i)=>`<button class="ttt-cell" data-cell="${i}" ${!playing||g.winner||g.turn!==mark||v?'disabled':''}>${v||''}</button>`).join('')}</div><button class="pill-action" data-action="ttt-start">${playing?'Yeni maç':'Arkadaşla başlat'}</button> <button class="pill-action secondary" data-action="ttt-reset">Tahtayı sıfırla</button></div>`;}
}
function startMemory(){let faces=['🍒','🌈','⭐','🪼','🍋','☁️'],cards=[...faces,...faces];for(let i=cards.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}state.memory={cards,open:[],matched:new Set(),moves:0,locked:false}}
function startMath(){state.math={end:Date.now()+30000,score:0,...makeMathQuestion()};}
function makeMathQuestion(){let a=3+Math.floor(Math.random()*24),b=2+Math.floor(Math.random()*16),op=Math.random()<.5?'+':'−';if(op==='−'&&b>a)[a,b]=[b,a];let val=op==='+'?a+b:a-b;let options=[val,val+2,val-3,val+5].sort(()=>Math.random()-.5);return {a,b,op,options,answer:val};}
function startStars(){state.star={found:0,finished:false};state.starEnd=Date.now()+60000;state.world?.setStarHunt(true);}
function renderCloset(box){let m=me();const config=cleanAvatar(m?.avatar);box.innerHTML=`<section class="white-card"><canvas class="avatar-preview" id="avatar-preview" aria-label="3D avatar ön izlemesi"></canvas><form class="avatar-fields" id="avatar-form">${Object.entries(avatarOptions).map(([key,options])=>`<label><b>${{hair:"Saç modeli",hairColor:"Saç rengi",tone:"Ten rengi",expression:"Yüz ifadesi",outfit:"Kıyafet",accessory:"Aksesuar"}[key]}</b><select name="${key}">${Object.entries(options).map(([id,label])=>`<option value="${id}" ${config[key]===id?"selected":""}>${label.startsWith("#")?{espresso:"Espresso",honey:"Tarçın",gold:"Altın",berry:"Erik",ink:"Gece",warm:"Sıcak",porcelain:"Porselen",olive:"Zeytin",cocoa:"Kakao",deep:"Koyu"}[id]:label}</option>`).join("")}</select></label>`).join("")}<button class="avatar-action" type="submit">Avatarı kaydet</button></form><button class="avatar-action" data-pose="wave">El salla</button> <button class="avatar-action" data-pose="emote">Şaşır</button> <button class="avatar-action" data-pose="study">Çalış</button></section><div class="white-card" style="text-align:center"><div style="font-size:51px">${hats[m.hat]?.[1]||'🙂'}</div><h2>${safe(m.name)}</h2><p>✦ ${m.coins} Study Coins</p><p class="muted">Şapkan gerçek 3D karakterinde görünür.</p></div><div class="section-label">KIYAFET RENKLERİ</div><div class="chips" style="margin-bottom:22px">${Object.entries(swatches).map(([id,c])=>`<button class="skin-swatch ${m.skin===id?'active':''}" data-skin="${id}" title="${id}" style="background:${c}"></button>`).join('')}</div><div class="section-label">ŞAPKA MAĞAZASI</div><div class="hat-grid">${Object.entries(hats).map(([id,hat])=>{let own=m.ownedHats?.includes(id),active=m.hat===id;return `<button class="hat-tile ${active?'active':''}" data-hat="${id}"><span class="hat-icon">${hat[1]}</span><strong>${hat[0]}</strong><small>${active?'✓ Takılı':own?'Giy':'✦ '+hat[2]+' coin'}</small></button>`}).join('')}</div><div class="panel-note">Şapkalar tamamen kozmetiktir; odaklanmayı ve çalışma hedeflerini bitirmeyi ödüllendirir.</div>`;setAvatarPreview();}
function handleWorldAction(e){let scene=e.target.closest('[data-scene-choice]');if(scene&&scene.dataset.sceneChoice!==state.scene)send('scene:set',{scene:scene.dataset.sceneChoice}).then(closePanel).catch(()=>{});}
function handleStudy(e){let b=e.target.closest('button');if(!b)return;let promptType=b.dataset.prompt;if(promptType==='subject'){let name=prompt('Yeni dersin adı?');if(name?.trim())send('subject:add',{name:name.trim()});return;}if(promptType==='topic'){let name=prompt('Konu adı?');if(name?.trim()){let desc=prompt('Kısa açıklama (isteğe bağlı)?')||'';send('topic:add',{subject:b.dataset.subject,title:name.trim(),description:desc});}return;}if(promptType==='exam'){let name=prompt('Sınav dönemi adı?',state.room.examPeriod);if(name?.trim())send('exam:set',{examPeriod:name.trim()});return;}
 if(b.dataset.lessonOpen){state.lessonId=b.dataset.lessonOpen;state.lessonEditing=false;renderDrawer();return;}if(b.hasAttribute('data-close-lesson')){state.lessonId=null;renderDrawer();return;}if(b.hasAttribute('data-edit-lesson')){state.lessonEditing=true;renderDrawer();return;}if(b.hasAttribute('data-show-answer')){$('#self-check-answer')?.classList.remove('hidden');return;}
 if(b.dataset.action==='lesson-save'){send('lesson:save',{topicId:state.lessonId,lesson:$('#lesson-text')?.value||'',question:$('#lesson-question')?.value||'',answer:$('#lesson-answer')?.value||''}).then(()=>{state.lessonEditing=false;renderDrawer()});return;}
 if(b.dataset.action==='save-notes')send('note:update',{notes:$('#notes-editor').value}).then(()=>toast('Pano kaydedildi!'));
}
function handleQuiz(e){let subj=e.target.closest('[data-quiz-subject]');if(subj){state.quizSubject=subj.dataset.quizSubject;renderDrawer();return;}let choice=e.target.closest('[data-choice]');if(choice){send('quiz:answer',{choice:Number(choice.dataset.choice)});return;}let b=e.target.closest('[data-action]');if(!b)return;let map={'quiz-start':'quiz:start','quiz-next':'quiz:next','quiz-reveal':'quiz:reveal','quiz-stop':'quiz:stop'};send(map[b.dataset.action],b.dataset.action==='quiz-start'?{subject:state.quizSubject}:{});}
function handleArcade(e){let g=e.target.closest('[data-game]');if(g){state.game=g.dataset.game;if(state.game==='memory')startMemory();if(state.game==='math')startMath();if(state.game==='stars'){startStars();closePanel();return;}renderDrawer();return;}if(e.target.closest('[data-game-back]')){if(state.game==='stars')state.world?.setStarHunt(false);state.game=null;state.star=null;renderDrawer();return;}let b=e.target.closest('[data-memory]');if(b){let g=state.memory,i=Number(b.dataset.memory);if(!g||g.locked||g.open.includes(i)||g.matched.has(i))return;g.open.push(i);if(g.open.length===2){g.moves++;let [a,c]=g.open;if(g.cards[a]===g.cards[c]){g.matched.add(a);g.matched.add(c);g.open=[];}else{g.locked=true;setTimeout(()=>{g.open=[];g.locked=false;if(state.game==='memory'&&state.panel==='arcade')renderDrawer();},700);}}renderDrawer();return;}
 if(e.target.closest('[data-memory-restart]')){startMemory();renderDrawer();return;}
 let math=e.target.closest('[data-math]');if(math){let g=state.math;if(Date.now()>=g.end)return;let choice=g.options[Number(math.dataset.math)];if(choice===g.answer){g.score++;toast('Doğru! +1 puan');}else toast('Olmadı, sonraki işlem!');Object.assign(g,makeMathQuestion());renderDrawer();return;}
 if(e.target.closest('[data-math-restart]')){startMath();renderDrawer();return;}
 if(e.target.closest('[data-star-restart]')){startStars();closePanel();return;}
 if(e.target.closest('[data-arcade-close]')){closePanel();return;}
 let cell=e.target.closest('[data-cell]');if(cell){send('game:ttt:move',{cell:Number(cell.dataset.cell)});return;}
 let action=e.target.closest('[data-action]');if(action?.dataset.action==='ttt-start')send('game:ttt:start');if(action?.dataset.action==='ttt-reset')send('game:ttt:reset');}
async function handleCloset(e){const pose=e.target.closest('[data-pose]')?.dataset.pose;if(pose){state.world?.setPose(pose);avatarPreview?.setPose(pose);return;}let sw=e.target.closest('[data-skin]');if(sw){try{await send('avatar:set',{skin:sw.dataset.skin});rememberAvatar(cleanAvatar(me()?.avatar),sw.dataset.skin);if(state.panel==='closet'&&previewMember){previewMember.skin=sw.dataset.skin;$('[data-skin]').forEach(button=>button.classList.toggle('active',button.dataset.skin===sw.dataset.skin));}}catch{}return;}let h=e.target.closest('[data-hat]');if(h){let id=h.dataset.hat,m=me();if(m.ownedHats?.includes(id))send('avatar:set',{hat:id});else if(confirm(`${hats[id][0]} için ${hats[id][2]} coin harcamak istiyor musun?`))send('hat:buy',{hat:id});}}
async function leaveRoom(){try{await send('room:leave')}catch{}state.events?.close();localStorage.removeItem('study-plaza-3d');location.href='/';}
function hook(){resetLabels();$('#solo-entry').addEventListener('click',openSolo);$('#solo-exit').addEventListener('click',closeSolo);$('#create-room').addEventListener('click',createRoom);$('#join-room').addEventListener('click',()=>joinRoom($('#join-code').value.trim().toUpperCase()));$('#join-code').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom(e.target.value.trim().toUpperCase())});$('#nickname').addEventListener('keydown',e=>{if(e.key==='Enter')createRoom()});$('#copy-invite').addEventListener('click',async()=>{let url=location.origin+'/?room='+state.code;try{await navigator.clipboard.writeText(url);toast('Oda bağlantısı kopyalandı!')}catch{toast('Oda kodun: '+state.code)}});$$('[data-open]').forEach(b=>b.addEventListener('click',()=>state.panel===b.dataset.open?closePanel():openPanel(b.dataset.open)));$('[data-home]').addEventListener('click',()=>state.solo?openPanel('today'):closePanel());$('#worlds-button').addEventListener('click',()=>openPanel('world'));$('#close-drawer').addEventListener('click',closePanel);$('#panel-shade').addEventListener('click',closePanel);
 $('#world-labels').addEventListener('click',e=>{let t=e.target.closest('[data-station]');if(t)openPanel(stationPanel(t.dataset.station))});$('#drawer-body').addEventListener('click',e=>{const focusAction=e.target.closest('[data-personal-focus]')?.dataset.personalFocus;if(focusAction){handlePersonalFocus(focusAction);return;}const route=e.target.closest('[data-route]')?.dataset.route;if(route){openPanel(route);return;}if(e.target.closest('[data-leave-room]')){leaveRoom();return;}if(hubPanes.has(state.panel))hub.click(e);const roomAction=e.target.closest('[data-friends]')?.dataset.friends;if(roomAction==='invite')$('#copy-invite').click();if(roomAction==='timer')send(state.room.timer.running?'timer:pause':'timer:start').catch(()=>{});if(roomAction==='skip')send('timer:next').catch(()=>{});const remove=e.target.closest('[data-remove-message]');if(remove)send('chat:remove',{messageId:remove.dataset.removeMessage}).catch(()=>{});if(roomAction==='planner')openPanel('planner');if(state.panel==='world')handleWorldAction(e);if(state.panel==='study')handleStudy(e);if(state.panel==='quiz')handleQuiz(e);if(state.panel==='arcade')handleArcade(e);if(state.panel==='closet')handleCloset(e)});$('#drawer-body').addEventListener('change',e=>{if(hubPanes.has(state.panel))hub.change(e);if(e.target.id==='personal-duration')handlePersonalFocus('duration',Number(e.target.value));if(e.target.id==='friends-duration')send('timer:set',{minutes:Number(e.target.value)}).catch(()=>{});if(e.target.form?.id==='avatar-form'&&previewMember)previewMember.avatar=cleanAvatar(Object.fromEntries(new FormData(e.target.form)));let cb=e.target.closest('[data-topic-toggle]');if(cb)send('topic:toggle',{topicId:cb.dataset.topicToggle})});$('#drawer-body').addEventListener('submit',async e=>{if(hubPanes.has(state.panel))hub.submit(e);if(e.target.id==='room-chat-form'){e.preventDefault();const message=String(new FormData(e.target).get('message')||'').trim();if(message){const input=e.target.elements.message;input.value='';try{await send('chat:send',{message});}catch{const current=$('#room-chat-form input');if(current&&!current.value)current.value=message;}}}if(e.target.id==='avatar-form'){e.preventDefault();const avatar=cleanAvatar(Object.fromEntries(new FormData(e.target)));try{await send('avatar:set',{avatar});rememberAvatar(avatar,me()?.skin);toast('Avatarın kaydedildi.');}catch{}}if(e.target.id==='quiz-add-form'){e.preventDefault();let f=new FormData(e.target);try{await send('quiz:add-custom',{q:f.get('question'),options:[0,1,2,3].map(i=>f.get('opt'+i)),correct:Number(f.get('correct')),explanation:f.get('explanation')});toast('Soru eklendi!');}catch{}}});
 wireTouch();
 $('#drawer-body').addEventListener('input',e=>{if(hubPanes.has(state.panel))hub.input(e);});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.panel)closePanel();});
 let saved;try{saved=JSON.parse(localStorage.getItem('study-plaza-3d')||'null')}catch{}const params=new URLSearchParams(location.search);let prm=params.get('room');if(params.get('study')==='1'&&!prm)openSolo();else if(saved?.code&&saved?.id&&!prm){$('#nickname').value=saved.name;joinRoom(saved.code,saved.id,saved.name,saved.token)}else if(prm){$('#join-code').value=prm.toUpperCase().slice(0,6);if(saved?.code===prm.toUpperCase()){$('#nickname').value=saved.name;joinRoom(prm.toUpperCase(),saved.id,saved.name,saved.token)}}setInterval(()=>{if(state.solo&&state.panel==='focus')updatePersonalFocus();if(state.room){tickTimer();if(state.game==='math'||state.game==='stars'){let m=$('#math-remaining'),s=$('#star-remaining');if(m)m.textContent=Math.max(0,Math.ceil((state.math.end-Date.now())/1000));if(s)s.textContent=Math.max(0,Math.ceil((state.starEnd-Date.now())/1000));if(state.game==='math'&&Date.now()>state.math.end&&state.panel==='arcade')renderDrawer();}}},1000);
}
hook();
