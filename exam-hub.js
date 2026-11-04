import {announcement,faq,getScope,grades,scopeKey,subjects,updated,year} from './exam-data.js';
import {lessonFor,notes,questionBank} from './exam-lessons.js';

const storageKey='study-plaza-exam-v1';
const defaultScope={grade:9,subject:'matematik',term:1,written:1};
const week=['2026-11-09','2026-11-10','2026-11-11','2026-11-12','2026-11-13'];
const day=86_400_000;
const dateValue=date=>Date.parse(date+'T00:00:00Z');
const istanbul=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'});
export const todayKey=(now=new Date())=>{const parts=Object.fromEntries(istanbul.formatToParts(now).map(({type,value})=>[type,value]));return [parts.year,parts.month,parts.day].join('-');};
const displayDate=date=>new Intl.DateTimeFormat('tr-TR',{timeZone:'UTC',weekday:'long',month:'short',day:'numeric'}).format(dateValue(date));
const h=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const opt=(value,label,active)=>`<option value="${h(value)}" ${String(value)===String(active)?'selected':''}>${h(label)}</option>`;
const scenarioName=id=>Number(id)>0?'Senaryo '+id:'Senaryomu Bilmiyorum';
const visibleCode=code=>code==='TDE2.2b'?'TDE2.2':code;
const subjectName=id=>subjects.find(s=>s.id===id)?.name||id;
const titleFor=code=>lessonFor(code)?.title||visibleCode(code);
const progress=(rows,done)=>rows.length?Math.round(100*rows.filter(row=>done.includes(row.code)).length/rows.length):0;
const coverage=(s,id)=>getScope(s).scenarios.find(x=>x.id===Number(id));
const message=(title,copy)=>`<div class="hub-note"><strong>${h(title)}</strong><p>${h(copy)}</p></div>`;
const meter=value=>`<progress value="${value}" max="100" aria-label="Çalışma ilerlemesi"></progress> <b>%${value}</b>`;
const label=(name,input)=>`<label class="hub-field"><span>${name}</span>${input}</label>`;
const select=(name,options)=>`<select name="${name}">${options}</select>`;
const action=(name,copy,value='')=>`<button type="button" class="hub-button" data-hub="${name}" data-value="${h(value)}">${h(copy)}</button>`;

export function commonRows(scenarios) {
  if(!scenarios.length)return [];
  return scenarios[0].rows.filter(row=>scenarios.every(s=>s.rows.some(x=>x.code===row.code)));
}

export function buildExam(rows, random=Math.random) {
  return rows.flatMap(({code,count})=>{
    const bank=questionBank(code);
    if(!Number.isInteger(count)||count<1||bank.length<count)throw Error('Yetersiz soru havuzu: '+code);
    const primary=bank.shift();
    for(let i=bank.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bank[i],bank[j]]=[bank[j],bank[i]];}
    return [primary,...bank.slice(0,count-1)];
  });
}

export function studyPlan(rows, done, date, today=todayKey()) {
  const days=Math.max(1,Math.min(14,Math.round((dateValue(date)-dateValue(today))/day)||1));
  const list=rows.filter(r=>!done.includes(r.code)).sort((a,b)=>b.count-a.count);
  return list.map((r,index)=>({
    ...r,minutes:lessonFor(r.code)?.minutes||18,
    date:new Date(dateValue(today)+Math.floor(index*days/list.length)*day).toISOString().slice(0,10),
  }));
}

function lessonCodes(subject) {
  const prefix={edebiyat:'TDE',fizik:'FİZ',kimya:'KİM',biyoloji:'BİY',tarih:'TAR',cografya:'COĞ',ingilizce:'ENG',din:'DKAB'}[subject];
  return Object.keys(notes).filter(code=>prefix?code.startsWith(prefix):/^9\./.test(code));
}

export class ExamHub {
  constructor({open,notify}){
    this.open=open;
    this.notify=notify;
    this.data={scope:{...defaultScope},selections:{},done:[],exams:[],results:[],active:null};
    try{Object.assign(this.data,JSON.parse(localStorage.getItem(storageKey)||'{}'));}catch{}
    this.editing=null;
    this.lesson=null;
    this.pane=null;
  }
  save(){
    try{localStorage.setItem(storageKey,JSON.stringify(this.data));}
    catch{this.notify('Bu tarayıcıda ilerleme kaydedilemedi.',true);}
  }
  get scope(){return this.data.scope;}
  get selected(){return this.data.selections[scopeKey(this.scope)]||0;}
  clearTimer(){clearInterval(this.clock);}
  render(box,pane){
    this.clearTimer();
    this.box=box;this.pane=pane;
    box.classList.add('hub');
    if(pane==='today'){box.innerHTML=this.today();return;}
    const title={library:'Ders kütüphanesi',planner:'Sınavlarım',scenarios:'Senaryolar',simulator:'Deneme stüdyosu'};
    box.innerHTML=`<section class="hub-hero"><small>9. SINIF · ${year}</small><h3>${title[pane]}</h3><p>${{library:'Konu anlatımı, örnekler ve kendi hızında alıştırma.',planner:'Sınavlarını ekle, çalışma oturumlarını sırala.',scenarios:'MEB dağılımlarını incele ve okulunun senaryosunu seç.',simulator:'Süreli yazılı provası ve kısa konu alıştırmaları.'}[pane]}</p></section>${{library:()=>this.library(),planner:()=>this.planner(),scenarios:()=>this.scenarios(),simulator:()=>this.simulator()}[pane]()}`;
    if(pane==='simulator'&&this.data.active&&!this.data.active.finished){
      this.clock=setInterval(()=>this.tick(),250);
      this.tick();
    }
  }
  today(){
    const {done,exams,results,active}=this.data;
    const now=todayKey(), next=[...exams].filter(e=>e.date>=now).sort((a,b)=>a.date.localeCompare(b.date))[0];
    const scenario=next&&coverage(next,next.scenario);
    const pending=scenario?.rows.filter(row=>!done.includes(row.code))||[];
    const dayCount=next?Math.round((dateValue(next.date)-dateValue(now))/day):null;
    const call=(route,title,sub,icon)=>`<button type="button" class="study-shortcut" data-route="${route}"><span class="study-shortcut-icon" aria-hidden="true">${icon}</span><span><strong>${title}</strong><small>${sub}</small></span><span aria-hidden="true">›</span></button>`;
    return `<section class="today-cover"><span class="today-date">${h(displayDate(now))} · ÇALIŞMA MASASI</span><h3>Bugün ne çalışıyoruz?</h3><p>Bir konuyla başla, sınav tarihlerini ekle veya bıraktığın denemeye dön.</p></section>
      ${active&&!active.finished?`<div class="today-resume"><div><b>Devam eden deneme</b><small>${active.index+1} / ${active.questions.length} · Zamanlayıcı açık</small></div><button type="button" class="hub-button" data-route="simulator">Denemeye dön</button></div>`:''}
      <section class="today-grid"><article class="today-next"><small>SONRAKİ SINAV</small>
      ${next?`<h4>${h(subjectName(next.subject))}</h4><p>${h(displayDate(next.date))} · ${dayCount===0?'Bugün':dayCount+' gün kaldı'}</p>${scenario?`<div class="today-progress">${meter(progress(scenario.rows,done))}<span>${pending.length} konu kaldı</span></div>`:''}${action('study-exam','Çalışma planını aç',next.id)}`:`<h4>Takvim boş.</h4><p>İlk sınav tarihini ekle. Seçtiğin senaryoya göre sıradaki konular burada görünecek.</p><button type="button" class="hub-button" data-route="planner">Takvimi aç</button>`}</article>
      <div class="today-stats"><article><b>${done.length}</b><span>Tamamlanan konu</span></article><article><b>${results.length}</b><span>Kaydedilen son deneme</span></article></div></section>
      <div class="today-shortcuts">${call('library','Ders kütüphanesi','Konu anlatımı, örnek ve alıştırma','Aa')}${call('scenarios','Senaryolar','Resmî soru dağılımlarını karşılaştır','▤')}${call('focus','Odak sayacı','Kısa bir çalışma oturumu başlat','◷')}</div>`;
  }
  refresh(){if(this.box&&this.pane)this.render(this.box,this.pane);}
  choices(s=this.scope,id=this.selected) {
    const found=getScope(s);
    return label('Sınıf',select('grade',grades.map(n=>opt(n,n+'. Sınıf',s.grade)).join('')))
      +label('Ders',select('subject',subjects.filter(v=>v.grade===Number(s.grade)).map(v=>opt(v.id,v.name,s.subject)).join('')))
      +label('Dönem',select('term',[1,2].map(n=>opt(n,n+'. Dönem',s.term)).join('')))
      +label('Yazılı',select('written',[1,2].map(n=>opt(n,n+'. Yazılı',s.written)).join('')))
      +label('Senaryo',select('scenario',opt(0,'Senaryomu Bilmiyorum',id)+found.scenarios.map(v=>opt(v.id,scenarioName(v.id),id)).join('')));
  }
  library(){
    if(this.lesson){
      const entry=lessonFor(this.lesson);
      if(entry){
        const done=this.data.done.includes(entry.code);
        return `<article class="hub-card hub-lesson">${action('library-back','← Konular')}<small>${h(visibleCode(entry.code))} · ${entry.minutes} dk</small><h3>${h(entry.title)}</h3><p>${h(entry.explain)}</p><h4>Kavram tablosu</h4><table><thead><tr><th>Terim</th><th>Anlamı</th></tr></thead><tbody>${entry.terms.map(([k,v])=>`<tr><th>${h(k)}</th><td>${h(v)}</td></tr>`).join('')}</tbody></table><h4>Günlük örnek ve uygulama</h4><p>${h(entry.example)}</p><h4>Sık hata</h4><p>${h(entry.mistake)}</p><h4>Sınav tarzı çözümlü soru</h4><p>${h(entry.prompt)}</p><details><summary>Örnek çözümü aç</summary><p>${h(entry.answer)}</p></details><h4>Kısa tekrar</h4><ul>${entry.terms.map(([k,v])=>`<li>${h(k)} · ${h(v)}</li>`).join('')}</ul><div class="hub-actions">${action('done',done?'✓ Tamamlandı · geri al':'Konuyu tamamla',entry.code)}${action('outcome-practice','Kazanım denemesi',entry.code)}${action('multiple-choice','Kavram kartları',entry.code)}</div></article>`;
      }
    }
    return `<div class="hub-subjects">${subjects.map(s=>`<button type="button" class="hub-subject" aria-pressed="${s.id===this.scope.subject}" data-hub="library-subject" data-value="${s.id}"><b>${h(s.icon)}</b>${h(s.name)}</button>`).join('')}</div><div class="hub-list">${lessonCodes(this.scope.subject).map(code=>this.lessonCard({code})).join('')}</div><div class="hub-actions">${action('room-notes','Odanın ortak ders panosu')}${action('go-scenarios','Bu dersin senaryoları')}</div>`;
  }
  lessonCard({code,count}){
    const entry=lessonFor(code);
    const done=this.data.done.includes(code);
    return `<article class="hub-card hub-row"><div><small>${h(visibleCode(code))} · ${entry?.minutes||18} dk${count?' · '+count+' soru':''}</small><h4>${h(titleFor(code))}</h4><p>${h(entry?.terms.map(v=>v[0]).join(' · ')||'Konu anlatımı bekleniyor.')}</p></div><div class="hub-actions">${action('lesson','Ders notu',code)}${action('done',done?'✓ Tamamlandı':'Tamamla',code)}</div></article>`;
  }
  scenarios(){
    const source=getScope(this.scope), current=coverage(this.scope,this.selected);
    const rows=current?.rows||[];
    const items=[...new Set(source.scenarios.flatMap(s=>s.rows.map(r=>r.code)))];
    const compare=source.scenarios.length?`<div class="hub-scroll"><table><thead><tr><th>Kazanım</th>${source.scenarios.map(s=>`<th>${action('set-scenario','S'+s.id,s.id)}</th>`).join('')}</tr></thead><tbody>${items.map(code=>`<tr><th>${h(titleFor(code))}</th>${source.scenarios.map(s=>`<td>${s.rows.find(r=>r.code===code)?.count||'—'}</td>`).join('')}</tr>`).join('')}<tr><th>Toplam soru</th>${source.scenarios.map(s=>`<td><b>${s.total}</b></td>`).join('')}</tr></tbody></table></div>`:'';
    const common=commonRows(source.scenarios);
    return `<form id="hub-scope" class="hub-grid">${this.choices()}</form><p class="hub-muted">Okullar farklı senaryolar seçebilir. Okulunun duyurusunu kontrol et. Tarih ve senaryo seçimi sana ait.</p>
      ${source.reason?message('Doğrulanamadı',source.reason+(source.unverified.length?' '+source.unverified.map(id=>'S'+id).join(', '):'')):''}
      ${current?`<section class="hub-card"><small>SEÇİLİ SENARYO</small><h3>${scenarioName(current.id)} · ${current.total} soru</h3>${meter(progress(rows,this.data.done))}<p>${rows.reduce((n,r)=>n+(lessonFor(r.code)?.minutes||18),0)} dk tahmini çalışma</p><div class="hub-actions">${action('start-scenario','Süreli deneme oluştur')}${action('go-planner','Takvime git')}</div></section><div class="hub-list">${rows.map(r=>this.lessonCard(r)).join('')}</div>`:
      source.scenarios.length?`<section class="hub-card"><h3>Senaryoları karşılaştır</h3><p>${source.unverified.length?'Doğrulanabilen tablolarda ortak olan kazanımlar':'Yayımlanan tablolarda ortak olan kazanımlar'} · ${common.length}</p><p>${h(common.map(r=>titleFor(r.code)).join(' · ')||'Ortak kazanım bulunamadı.')}</p><p class="hub-muted">Bu liste okulundaki sınavın kapsamına dair garanti vermez.</p>${compare}</section>`:''}
      <footer class="hub-source">${source.info&&Number(this.scope.term)===1?`<a href="${source.info.source}" target="_blank" rel="noopener noreferrer">İl Millî Eğitim Müdürlüğü PDF</a><a href="${source.info.workbook}" target="_blank" rel="noopener noreferrer">MEB Excel</a>`:''}<a href="${announcement}" target="_blank" rel="noopener noreferrer">ÖDSGM duyurusu</a><a href="${faq}" target="_blank" rel="noopener noreferrer">ÖDSGM SSS</a><small>ÖDSGM duyuru güncellemesi · ${updated}</small></footer>`;
  }
  planner(){
    const exams=[...this.data.exams].sort((a,b)=>a.date.localeCompare(b.date));
    const today=todayKey();
    const editing=exams.find(x=>x.id===this.editing?.id);
    const date=this.editing?.date||'';
    const scope=this.editing?.scope||this.scope;
    const scenario=this.editing?.scenario??this.selected;
    const renderExam=e=>{
      const current=coverage(e,e.scenario);
      const pct=progress(current?.rows||[],this.data.done);
      const remaining=Math.round((dateValue(e.date)-dateValue(today))/day);
      const status=current?(pct===100?'Hazır':remaining<=2?'Öncelikli çalışma':pct?'Hazırlanıyor':'Başlanmadı'):'Senaryo bekleniyor';
      const plan=current&&remaining>=0?studyPlan(current.rows,this.data.done,e.date,today):[];
      return `<article class="hub-card"><small>${displayDate(e.date)} · ${remaining===0?'Bugün':remaining<0?'Geçti':remaining+' gün kaldı'}</small><h4>${h(subjectName(e.subject))}</h4><p>${scenarioName(e.scenario)} · ${status}</p>${current?meter(pct):''}
        ${plan.length?`<details><summary>Otomatik çalışma planı · ${plan.reduce((sum,r)=>sum+r.minutes,0)} dk</summary><ul>${plan.map(r=>`<li>${displayDate(r.date)} · ${h(titleFor(r.code))} · ${r.minutes} dk</li>`).join('')}</ul></details>`:''}
        <div class="hub-actions">${action('study-exam','Çalışmaya Başla',e.id)}${action('edit-exam','Düzenle',e.id)}${action('delete-exam','Sil',e.id)}</div></article>`;
    };
    return `<div class="hub-actions">${action('add-exam','＋ Başka tarih ekle',today)}</div>${this.editing?`<form id="hub-exam-form" class="hub-card"><h3>${editing?'Sınavı düzenle':'Sınav ekle'}</h3><div class="hub-grid">${label('Tarih',`<input type="date" name="date" required value="${h(date)}">`)}${this.choices(scope,scenario)}</div><div class="hub-actions"><button class="hub-button" type="submit">Kaydet</button>${action('cancel-exam','Vazgeç')}</div></form>`:''}<h3>9–13 Kasım 2026</h3><div class="hub-week">${week.map(d=>`<div class="hub-day"><strong>${displayDate(d)}</strong>${action('add-exam','＋ Sınav ekle',d)}${exams.filter(e=>e.date===d).map(renderExam).join('')}</div>`).join('')}</div>${exams.some(e=>!week.includes(e.date))?'<h3>Diğer tarihler</h3>'+exams.filter(e=>!week.includes(e.date)).map(renderExam).join(''):''}`;
  }
  simulator(){
    const run=this.data.active;
    if(!run){
      const scope=coverage(this.scope,this.selected);
      const last=this.data.results[0];
      return `<article class="hub-card"><h3>${h(subjectName(this.scope.subject))}</h3><p>${scope?scenarioName(scope.id)+' · '+scope.total+' soru':'Yazılı provası için doğrulanmış bir senaryo seç.'}</p><div class="hub-actions">${scope?action('start-scenario','Yazılı provasını başlat'):action('go-scenarios','Senaryo seç')}${action('go-library','Konu alıştırmaları')}${action('room-quiz','Oda Quiz Arenası')}${last?action('restore-result','Son sonucu aç'):''}</div></article>`;
    }
    if(run.finished){
      const groups=[...new Set(run.questions.map(q=>q.code))];
      const scored=run.mode==='choice';
      return `<section class="hub-card"><h3>${scored?'Kavram kartı sonucu':'Cevap anahtarı ve öz değerlendirme'}</h3><p>${scored?'İşaretlediğin seçenekler cevap anahtarıyla karşılaştırıldı.':'Cevabını örnekle karşılaştır. Ölçütleri karşıladıysan soruyu kendin işaretle.'}</p>${groups.map(code=>{const qs=run.questions.filter(q=>q.code===code), answered=qs.filter(q=>scored?run.answers[q.id]===String(q.correct):run.review[q.id]).length;return `<p>${h(titleFor(code))} · ${answered}/${qs.length} · %${Math.round(100*answered/qs.length)} ${answered<qs.length?'· Tekrar et':''}</p>`;}).join('')}${action('close-run','Denemelere dön')}</section>${run.questions.map((q,i)=>`<article class="hub-card"><small>SORU ${i+1} · ${h(visibleCode(q.code))}</small><h4>${h(q.prompt)}</h4><p><b>Yanıtın</b> ${h(scored?q.options[run.answers[q.id]]||'Boş':run.answers[q.id]||'Boş')}</p><p><b>Örnek cevap</b> ${h(scored?q.options[q.correct]:q.answer)}</p>${scored?'':`<ul>${q.rubric.map(r=>`<li>${h(r)}</li>`).join('')}</ul>${action('review',run.review[q.id]?'✓ Karşılandı':'Ölçütleri karşıladım',q.id)}`}${action('lesson','Konuyu aç',q.code)}</article>`).join('')}`;
    }
    const q=run.questions[run.index];
    return `<article class="hub-card"><small>${run.mode==='choice'?'ÇOKTAN SEÇMELİ PRATİK':'AÇIK UÇLU VE KISA CEVAPLI PROVA'}</small><div class="hub-row"><b>Soru ${run.index+1} / ${run.questions.length}</b><output id="hub-clock" aria-label="Kalan süre"></output></div>${meter(Math.round(Object.values(run.answers).filter(a=>a.trim()).length/run.questions.length*100))}<h4>${h(q.prompt)}</h4>${run.mode==='choice'?q.options.map((v,i)=>`<label class="hub-option"><input type="radio" name="hub-answer" value="${i}" ${run.answers[q.id]===String(i)?'checked':''}> ${h(v)}</label>`).join(''):`<textarea name="hub-answer" aria-label="Yanıtın" rows="${q.type==='short'?2:5}" maxlength="2500" placeholder="Cevabını yaz…">${h(run.answers[q.id])}</textarea>`}<div class="hub-actions">${run.index>0?action('prev','Önceki'):''}${run.index+1<run.questions.length?action('next','Sonraki'):''}${action('finish','Denemeyi bitir')}</div></article>`;
  }
  tick(){
    const clock=this.box?.querySelector('#hub-clock'), run=this.data.active;
    if(!clock||!run||run.finished)return;
    const seconds=Math.max(0,Math.ceil((run.ends-Date.now())/1000));
    clock.textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    if(!seconds)this.finish();
  }
  finish(){
    const run=this.data.active;
    if(!run||run.finished)return;
    run.finished=true;
    this.data.results=[run,...this.data.results.filter(x=>x.id!==run.id)].slice(0,12);
    this.save();this.refresh();
  }
  begin(questions,mode){
    if(this.data.active&&!this.data.active.finished&&!window.confirm('Devam eden deneme kapatılsın mı?'))return;
    this.data.active={id:crypto.randomUUID(),mode,questions,answers:{},review:{},index:0,finished:false,ends:Date.now()+Math.max(5,questions.length*4)*60_000};
    this.save();this.open('simulator');
  }
  choiceQuiz(code){
    const entry=lessonFor(code);
    if(!entry)return;
    const all=lessonCodes(this.scope.subject).flatMap(c=>lessonFor(c).terms.map(([,v])=>v));
    const extra=Object.keys(notes).flatMap(c=>lessonFor(c).terms.map(([,v])=>v));
    const questions=entry.terms.map(([term,meaning],index)=>{
      const wrong=[...new Set([...all.slice(index+1),...all,...extra])].filter(x=>x!==meaning).slice(0,3);
      const correct=(index+Math.floor(Math.random()*4))%4;
      wrong.splice(correct,0,meaning);
      return {id:code+'/choice/'+index,code,prompt:term+' ne anlama gelir?',options:wrong,correct};
    });
    this.begin(questions,'choice');
  }
  click(e){
    const button=e.target.closest('[data-hub]');
    if(!button)return;
    const {hub,value}=button.dataset, run=this.data.active;
    const exam=this.data.exams.find(x=>x.id===value);
    if(hub==='library-subject'){this.data.scope={...this.scope,subject:value};this.lesson=null;}
    if(hub==='library-back')this.lesson=null;
    if(hub==='lesson'){this.lesson=value;const subject=subjects.find(s=>lessonCodes(s.id).includes(value));if(subject){this.data.scope={...this.scope,subject:subject.id};this.save();}this.open('library');return;}
    if(hub==='done')this.data.done=this.data.done.includes(value)?this.data.done.filter(v=>v!==value):[...this.data.done,value];
    if(hub==='set-scenario')this.data.selections[scopeKey(this.scope)]=Number(value);
    if(hub==='go-library'){this.lesson=null;this.open('library');return;}
    if(hub==='go-scenarios'||hub==='go-planner'){this.open(hub.slice(3));return;}
    if(hub==='room-notes'||hub==='room-quiz'){this.open(hub==='room-notes'?'study':'quiz');return;}
    if(hub==='add-exam')this.editing={date:value,scope:{...this.scope},scenario:this.selected};
    if(hub==='edit-exam'&&exam)this.editing={id:exam.id,date:exam.date,scope:exam,scenario:exam.scenario};
    if(hub==='cancel-exam')this.editing=null;
    if(hub==='delete-exam'&&exam&&window.confirm('Bu sınav takvimden silinsin mi?')){
      this.data.exams=this.data.exams.filter(x=>x.id!==value);
      if(this.editing?.id===value)this.editing=null;
    }
    if(hub==='study-exam'&&exam){
      const {grade,subject,term,written}=exam;
      this.data.scope={grade,subject,term,written};
      this.data.selections[scopeKey(this.scope)]=exam.scenario;
      this.save();this.open('scenarios');return;
    }
    if(hub==='start-scenario'){
      const current=coverage(this.scope,this.selected);
      if(current)this.begin(buildExam(current.rows),'written');
      return;
    }
    if(hub==='outcome-practice'){this.begin(buildExam([{code:value,count:3}]),'outcome');return;}
    if(hub==='multiple-choice'){this.choiceQuiz(value);return;}
    if(hub==='finish'){
      if(run&&Object.values(run.answers).filter(a=>a.trim()).length<run.questions.length&&!window.confirm('Boş sorular var. Denemeyi bitirilsin mi?'))return;
      this.finish();return;
    }
    if(hub==='prev'&&run&&run.index>0)run.index--;
    if(hub==='next'&&run&&run.index+1<run.questions.length)run.index++;
    if(hub==='review'&&run){
      run.review[value]=!run.review[value];
      this.data.results=this.data.results.map(r=>r.id===run.id?run:r);
    }
    if(hub==='close-run')this.data.active=null;
    if(hub==='restore-result')this.data.active=this.data.results[0]||null;
    this.save();this.refresh();
  }
  formValues(form){
    const f=new FormData(form);
    return {grade:Number(f.get('grade')),subject:String(f.get('subject')),term:Number(f.get('term')),written:Number(f.get('written'))};
  }
  change(e){
    const form=e.target.form;
    if(form?.id==='hub-scope'){
      this.data.scope=this.formValues(form);
      if(e.target.name==='scenario')this.data.selections[scopeKey(this.scope)]=Number(e.target.value);
      this.save();this.refresh();
    }
    if(form?.id==='hub-exam-form'&&e.target.name!=='date'){
      const f=new FormData(form),scope=this.formValues(form);
      const previous=Number(f.get('scenario'));
      const id=e.target.name==='scenario'?previous:this.data.selections[scopeKey(scope)]||0;
      this.editing={id:this.editing?.id,date:String(f.get('date')),scope,scenario:coverage(scope,id)?id:0};
      this.refresh();
    }
  }
  submit(e){
    if(e.target.id!=='hub-exam-form')return;
    e.preventDefault();
    const f=new FormData(e.target),scope=this.formValues(e.target),scenario=Number(f.get('scenario')),date=String(f.get('date'));
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(dateValue(date))||(scenario&&!coverage(scope,scenario)))return;
    const exam={id:this.editing?.id||crypto.randomUUID(),date,scenario,...scope};
    this.data.exams=[...this.data.exams.filter(v=>v.id!==exam.id),exam];
    this.editing=null;this.save();this.refresh();
  }
  input(e){
    const run=this.data.active;
    if(e.target.name!=='hub-answer'||!run||run.finished)return;
    run.answers[run.questions[run.index].id]=e.target.value;
    this.save();
    const p=this.box.querySelector('progress');
    if(p){p.value=Math.round(Object.values(run.answers).filter(a=>a.trim()).length/run.questions.length*100);p.nextElementSibling.textContent='%'+p.value;}
  }
}
