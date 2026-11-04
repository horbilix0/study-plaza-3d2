import assert from 'node:assert/strict';
import test from 'node:test';
import {getScope,subjects} from './exam-data.js';
import {buildExam,commonRows,studyPlan,todayKey} from './exam-hub.js';
import {lessonFor} from './exam-lessons.js';
import {avatarOptions,canStand,cleanAvatar,reachable,seats,walk} from './plaza-shared.js';
import {maps} from './plaza-shared.js';
import {buildCampus} from './campus-map.js';

const scope=(subject,written=1,term=1)=>getScope({grade:9,subject,written,term});
test('Every included MEB scenario has a source, lesson, exact distribution and unique questions',()=>{
 const counts={};
 for(const {id} of subjects){
  counts[id]=0;
  for(const written of [1,2])for(const item of scope(id,written).scenarios){
   counts[id]++;
   assert.match(item.source,/^https:\/\/rize\.meb\.gov\.tr\//);
   assert.match(item.updated,/^\d{4}-\d{2}-\d{2}$/);
   const questions=buildExam(item.rows,()=>.56);
   assert.equal(questions.length,item.total);
   assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
   for(const row of item.rows){
    assert.ok(lessonFor(row.code));
    assert.equal(questions.filter(q=>q.code===row.code).length,row.count);
   }
   for(const q of questions)assert.ok(q.answer.length&&q.rubric.length);
  }
 }
 assert.deepEqual(counts,{matematik:4,edebiyat:7,fizik:10,kimya:5,biyoloji:6,tarih:12,cografya:12,ingilizce:10,din:11});
});

test('Known scenario totals, common outcomes, and unresolved documents are kept separate',()=>{
 assert.deepEqual(scope('tarih').scenarios.find(s=>s.id===6).rows.map(r=>r.count),[3,3]);
 assert.equal(scope('kimya').scenarios.find(s=>s.id===4).total,5);
 assert.deepEqual(commonRows(scope('biyoloji').scenarios).map(r=>r.code),['BİY.9.1.1','BİY.9.1.2']);
 assert.deepEqual(scope('biyoloji').unverified,[4]);
 assert.deepEqual(scope('cografya',2).unverified,[7]);
 assert.equal(scope('kimya',2).scenarios.length,0);
 assert.equal(scope('matematik',2).scenarios.length,0);
 assert.equal(scope('tarih',1,2).scenarios.length,0);
});

test('Study schedule uses Istanbul dates and puts remaining high-weight work first',()=>{
 assert.equal(todayKey(new Date('2026-11-08T22:00:00Z')),'2026-11-09');
 const rows=scope('kimya').scenarios.find(s=>s.id===4).rows;
 const plan=studyPlan(rows,['KİM.9.1.2'],'2026-11-13','2026-11-09');
 assert.equal(plan[0].code,'KİM.9.1.3');
 assert.ok(plan.every(r=>r.date>='2026-11-09'&&r.date<'2026-11-13'&&r.minutes>0));
 assert.ok(!plan.some(r=>r.code==='KİM.9.1.2'));
});

test('Numerical worked examples agree with independent calculations',()=>{
 const cases=[
  ['9.1.1',3**5,6*Math.sqrt(2),Math.sqrt(72)],
  ['9.1.4',17*9,170-17,153],
  ['9.2.1',-2*(0-3)+4,10,10],
  ['FİZ.9.2.4',Math.hypot(6,8),10,10],
  ['FİZ.9.2.6',400/50,8,8],
  ['COĞ.9.2.1',4*500000/100000,20,20],
 ];
 for(const [code,value,target,second] of cases){
  assert.equal(value,code==='9.1.1'?243:target);
  assert.ok(Math.abs(target-second)<1e-10);
  assert.match(lessonFor(code).answer,new RegExp(String(value)));
 }
 assert.match(lessonFor('KİM.9.1.5').answer,/1s² 2s² 2p⁴/);
});

test('Walls and furniture block walking, seats remain reachable, and avatar input is whitelisted',()=>{
 assert.equal(canStand(NaN,3,'garden'),false);
 assert.equal(reachable({x:0,z:0},{x:0,z:-6},'garden'),false);
 assert.equal(reachable({x:3,z:0},{x:3,z:-6},'moon'),true);
 assert.equal(canStand(-5.8,-1.4,'library'),false);
 for(const seat of seats)assert.equal(canStand(seat.x,seat.z,'garden'),true);
 const point={x:0,z:-1.65};
 walk(point,0,-.2,'garden');
 assert.equal(point.z,-1.65);
 const avatar=cleanAvatar({hair:'bob',outfit:'invalid',expression:'surprised',hairColor:'__proto__'});
 assert.equal(avatar.hair,'bob');
 assert.equal(avatar.expression,'surprised');
 assert.equal(avatar.outfit,'hoodie');
 assert.ok(Object.hasOwn(avatarOptions.hairColor,avatar.hairColor));
});

test('Four distinct campuses keep their spawn, seats and station approaches usable',()=>{
 const layouts=new Set();
 for(const [id,map] of Object.entries(maps)){
  assert.equal(canStand(0,3,id),true);
  for(const seat of map.seats)assert.equal(canStand(seat.x,seat.z,id),true);
  assert.equal(map.stations.length,4);
  for(const station of map.stations){
   assert.equal(canStand(station.x,station.z,id),false);
   assert.equal(canStand(station.x,station.z+1.27,id),true);
  }
  const positions=[];
  const record=(...args)=>positions.push(args);
  buildCampus({add:record,ball:record,cone:record},id);
  assert.ok(positions.length>=160, id);
  layouts.add(JSON.stringify(map.stations.map(({x,z})=>[x,z])));
 }
 assert.equal(layouts.size,4);
});

import {changeFocus,focusState} from './study-focus.js';
test('Personal focus survives reload, pauses, resumes, and settles once',()=>{
 const started=changeFocus(null,'toggle',1000);
 const restored=focusState(started,11000);
 assert.equal(restored.left,1490);
 const paused=changeFocus(restored,'toggle',11000);
 assert.equal(focusState(paused,91000).left,1490);
 const resumed=changeFocus(paused,'toggle',91000);
 const finished=focusState(resumed,1581000);
 assert.equal(finished.completed,1);
 assert.equal(focusState(finished,2000000).completed,1);
 assert.equal(changeFocus(finished,'duration',2000000,15).left,900);
});
