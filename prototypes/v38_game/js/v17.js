// v17: подмена персонала, рост навыков (библиотека, курсы), главврач, рейтинг больниц, платный терапевт
const COMP={doctor:['nurse','receptionist'],nurse:['receptionist'],receptionist:[],orderly:[],handyman:[]};
const SPEC={surgeon:{n:'Хирург',rooms:['surgery','transplant','cardio']},psych:{n:'Психиатр',rooms:['psych','electro','reboot']},diagn:{n:'Диагност',rooms:['gp','paygp','diag','xray']}};
const COURSE={doctor:[2500,6,12],nurse:[1500,5,12],receptionist:[800,4,15],orderly:[800,4,15],handyman:[800,4,15]};
const RIVALS=['Клиника «Добрый Пульс»','Госпиталь им. Пилюлькина','«Зелёная Таблетка»','Медцентр «Сто Лет»','Лечебница «Бодрячок»','Клиника «Тише Едешь»','«Белый Халат и Ко»','Санаторий «Сопелька»'];
const isNoCover=t=>t==='chief'||t==='research'||t==='morgue'||t==='library';
function chiefRoom(){return S.rooms.find(r=>r.type==='chief')}
function chiefOf(){const r=chiefRoom();return r&&r.staff?S.staff.find(s=>s.id===r.staff):null}
function chiefK(){const c=chiefOf();return c?0.5+c.skill/200:0}// 0.575..1
function v17Init(){S.away=S.away||[];S.v17=S.v17||{covers:0,courses:0,read:0};if(!S.rivals){const lv=S.lv,rs=[];for(let i=0;i<4;i++)rs.push({name:RIVALS[(lv*3+i)%RIVALS.length],f:[0.62,0.82,1.0,1.18][i]*(0.95+((lv*7+i*3)%5)*0.025)});S.rivals=rs}}
// ---------- 1. подмена ----------
function canCover(s,t){const need=D.rooms[t].staff;return need&&(need===s.type||(COMP[s.type]||[]).includes(need))&&!isNoCover(t)}
handOver=function(s,r){if(!r||r.type==='chief')return;const sub=S.staff.find(o=>o!==s&&!o.room&&o.state==='idle'&&!o.vs&&canCover(o,r.type));if(sub){r.staff=null;s.room=null}};
function releaseCover(s,r){clearSeat(s);s.room=null;s.cover=false;s.state='idle';s.path=[];if(r&&r.staff===s.id)r.staff=null}
const _updStaff=updStaff;updStaff=function(s,dt){
 if(s.state==='read'){v17Read(s,dt);return}
 if(s.state==='idle'&&!s.room&&!s.vs&&s.type!=='handyman'){
  const own=S.rooms.some(r=>D.rooms[r.type].staff===s.type&&!r.staff&&!(r.type==='research'&&resDone()));
  if(own){// вернуть «свой» кабинет у подменяющего
  }else{const cov=S.rooms.find(r=>D.rooms[r.type].staff===s.type&&r.staff&&r.busy===null&&(()=>{const o=S.staff.find(x=>x.id===r.staff);return o&&o.cover&&o.state==='work'&&o.type!==s.type})());
   if(cov){const o=S.staff.find(x=>x.id===cov.staff);releaseCover(o,cov);msg('🔄 '+s.name+' сменяет '+o.name+' в «'+D.rooms[cov.type].name+'»')}
   else{const c=S.rooms.filter(r=>!r.staff&&canCover(s,r.type)&&D.rooms[r.type].staff!==s.type&&(r.queue.length>0||D.rooms[r.type].staff==='receptionist'));
    if(c.length){c.sort((a,b)=>b.queue.length-a.queue.length);const r=c[0];r.staff=s.id;s.room=r.id;s.cover=true;S.v17.covers++;const p=spotStaff(r);goTo(s,p.x,p.y);s.state='goto';msg('🔄 '+D.staff[s.type].name+' '+s.name+' подменяет в «'+D.rooms[r.type].name+'»');return}
    const lib=S.rooms.find(r=>r.type==='library');if(lib&&Math.random()<.02){const p=libSpot(lib,s);if(p&&goTo(s,p.x,p.y)){s.state='read';s.rd={ph:'go',sp:p,t:0};return}}}}}
 if(s.cover&&s.room){const r=S.rooms.find(x=>x.id===s.room);if(!r)s.cover=false;else if(D.rooms[r.type].staff===s.type)s.cover=false}
 if(!s.room)s.cover=false;
 _updStaff(s,dt);
 // быстрее устают без главврача
 if(s.state==='work'&&chiefOf()&&s.fat>0)s.fat=Math.max(0,s.fat-dt*0.1*chiefK());
 if(s.state==='rest'&&S.rooms.some(r=>r.type==='library'))gainXp(s,dt*0.04*v24Spd(Math.max(1,...S.rooms.filter(r=>r.type==='library').map(rCap))))};
// ---------- 2. навыки ----------
function gainXp(s,v){if(s.skill>=100)return;v*=1+chiefK()*0.5;s.xp=(s.xp||0)+v;while(s.xp>=1&&s.skill<100){s.xp-=1;s.skill++;if(s.skill%10===0)msg('📈 '+s.name+': навык '+s.skill)}}
function libSpot(lib,me){roomLay(lib);for(const k of['read1','read2']){const p=lib.sp[k];if(p&&!S.staff.some(o=>o!==me&&o.rd&&o.rd.k===lib.id+k)){if(me.rd)me.rd.k=lib.id+k;else me._rk=lib.id+k;return Object.assign({k},p)}}return null}
function v17Read(s,dt){const lib=S.rooms.find(r=>r.type==='library');if(!lib){clearSeat(s);s.rd=null;s.state='idle';return}
 if(!s.rd.k)s.rd.k=s._rk;
 if(s.rd.ph==='go'){if(move(s,dt)){s.rd.ph='in';s.dir=s.rd.sp.dir!=null?s.rd.sp.dir:1;takeSeat(s,s.rd.sp)}return}
 if(s.vs&&s.vs.ph!=='sat'&&s.vs.ph!=='down')return;
 s.rd.t+=dt;gainXp(s,dt*0.12);S.v17.read+=dt;s.fat=Math.max(0,s.fat-dt*2);
 const need=S.rooms.some(r=>!r.staff&&canCover(s,r.type)&&(D.rooms[r.type].staff===s.type||r.queue.length>0));
 if(need||s.rd.t>DAY*2){if(s.vs&&s.vs.ph==='sat'){leaveSeat(s);return}clearSeat(s);s.rd=null;s.state='idle'}}
function sendCourse(id,spec){v17Init();const s=S.staff.find(x=>x.id===id);if(!s)return;const c=COURSE[s.type];if(S.money<c[0]){msg('Недостаточно денег на курсы');return}
 S.money-=c[0];const r=S.rooms.find(r=>r.id===s.room);if(r&&r.staff===s.id)r.staff=null;clearSeat(s);s.room=null;s.cover=false;s.rd=null;s.state='idle';s.path=[];
 S.staff=S.staff.filter(x=>x!==s);S.away.push({s,back:S.day+c[1],gain:c[2],spec:spec||null});S.v17.courses++;
 msg('🎓 '+s.name+' уехал(а) на курсы'+(spec?' «'+SPEC[spec].n+'»':'')+' на '+c[1]+' дн. (−$'+c[0]+')');Snd.cash();showStaff()}
function courseBack(){for(const a of S.away.slice())if(S.day>=a.back){const s=a.s;s.skill=Math.min(100,s.skill+a.gain);if(a.spec)s.spec=a.spec;s.x=S.ent.x;s.y=S.ent.y;s.path=[];s.state='idle';s.room=null;s.fat=0;s.vs=null;S.staff.push(s);S.away=S.away.filter(x=>x!==a);
  msg('🎓 '+s.name+' вернулся(лась) с курсов: навык '+s.skill+(a.spec?', специализация «'+SPEC[a.spec].n+'»':''))}}
const _cureCh=cureChance;cureChance=function(p,s){let c=_cureCh(p,s);const dz=D.dis[p.dis];if(s&&s.spec&&SPEC[s.spec].rooms.includes(dz.cure))c+=0.08;if(p.prem)c+=0.06;return Math.max(.05,Math.min(.98,c))};
// ---------- 3. главврач ----------
function appointChief(id){const r=chiefRoom();if(!r)return;const s=S.staff.find(x=>x.id===id);if(!s)return;const old=chiefOf();if(old){clearSeat(old);old.room=null;old.state='idle';old.path=[]}
 const pr=S.rooms.find(x=>x.id===s.room);if(pr&&pr.staff===s.id)pr.staff=null;clearSeat(s);s.rd=null;s.cover=false;r.staff=s.id;s.room=r.id;const p=spotStaff(r);goTo(s,p.x,p.y);s.state='goto';
 msg('👔 '+s.name+' назначен(а) главврачом');Snd.win();ui.sel={k:'room',id:r.id};showSel()}
function dismissChief(){const r=chiefRoom(),c=chiefOf();if(c){clearSeat(c);c.room=null;c.state='idle';c.path=[]}if(r)r.staff=null;showSel()}
const _startRoom=startRoom;startRoom=function(t){if((t==='chief'||t==='library')&&S.rooms.some(r=>r.type===t)){msg('Такой кабинет может быть только один');Snd.bad();return}return _startRoom(t)};
// ---------- 4. рейтинг ----------
function goalIdx(){const g=L().goals;return g.rep*0.6+g.cured*1.5+(g.value||g.money*1.5)/5000}
function myIdx(){return Math.round(S.rep*0.6+S.cured*1.5+hospValue()/5000)}
function rivalIdx(r){return Math.round(goalIdx()*r.f*Math.min(1.1,0.5+S.day/650))}
function ranking(){v17Init();const a=S.rivals.map(r=>({name:r.name,v:rivalIdx(r)}));a.push({name:'⭐ Больница Карачун (вы)',v:myIdx(),me:1});a.sort((x,y)=>y.v-x.v);return a}
function myRank(){return ranking().findIndex(x=>x.me)+1}
const RANK_MUL=[1.15,1.07,1,0.95,0.9];
function showRank(){const a=ranking(),rk=a.findIndex(x=>x.me);panel('<h3>🏆 Рейтинг больниц</h3>'+a.map((x,i)=>'<div class="row"'+(x.me?' style="background:#2d5a2d"':'')+'><span>'+(i+1)+'. '+x.name+'</span><b>'+x.v+'</b></div>').join('')+'<small>Индекс = репутация, вылеченные и стоимость больницы. Место '+(rk+1)+' → поток пациентов ×'+RANK_MUL[rk].toFixed(2)+'. Чем выше место, тем больше пациентов и состоятельных клиентов.</small>')}
const _spawn17=spawnPatient;spawnPatient=function(){_spawn17.apply(this,arguments);v17Init();let k=RANK_MUL[myRank()-1]||1;if(window.crowdK)k*=crowdK();S.spawnT/=k;
 const p=S.pats[S.pats.length-1];const pg=S.rooms.find(r=>r.type==='paygp'&&r.staff);if(p&&pg&&!p.vip&&Math.random()<0.12+0.04*(5-myRank())){p.rich=true}};
// ---------- 5. платный терапевт ----------
const PAY_FEE=300;
const _finish17=finish;finish=function(p,r,s){
 if(r.type==='paygp'){p.need='gp';p.prem=true;_finish17(p,r,s);p.cert=Math.min(1,p.cert+0.2);if(!p.known&&p.cert>=0.8){p.known=true;p.need=D.dis[p.dis].cure;lowChanceCheck(p)}if(p.need==='gp')p.need='paygp';S.money+=PAY_FEE;S.earn+=PAY_FEE;S.v17.pay=(S.v17.pay||0)+PAY_FEE;S.rep=Math.min(1000,S.rep+0.5);return}
 const wasRec=p.need==='reception';_finish17(p,r,s);if(p.rich&&(wasRec||p.need==='gp')&&S.rooms.some(q=>q.type==='paygp'&&q.staff)){p.need='paygp';p.thought='💎'}};
function payRotate(){// лучший врач — в платный кабинет
 for(const pr of S.rooms.filter(r=>r.type==='paygp'&&r.staff&&r.busy===null)){const cur=S.staff.find(s=>s.id===pr.staff);if(!cur||cur.state!=='work')continue;
  const best=S.staff.filter(s=>s.type==='doctor'&&s.state==='work'&&s.room&&!s.cover&&s.skill>cur.skill+5).map(s=>({s,r:S.rooms.find(r=>r.id===s.room)})).filter(o=>o.r&&o.r.busy===null&&!['chief','research','paygp'].includes(o.r.type)).sort((a,b)=>b.s.skill-a.s.skill)[0];
  if(best){const b=best.s,br=best.r;clearSeat(b);clearSeat(cur);pr.staff=b.id;b.room=pr.id;br.staff=cur.id;cur.room=br.id;let q=spotStaff(pr);goTo(b,q.x,q.y);b.state='goto';q=spotStaff(br);goTo(cur,q.x,q.y);cur.state='goto';msg('💎 '+b.name+' (навык '+b.skill+') переведён(а) в платный кабинет')}}}
// ---------- день, HUD, UI ----------
const _onDay17=onDay;onDay=function(){_onDay17();v17Init();courseBack();payRotate();
 const c=chiefOf();if(c){const k=chiefK();for(const s of S.staff)if(s!==c)gainXp(s,0.15*k);if(S.day%MONTH_DAYS===0){const sv=Math.round(S.staff.reduce((a,s)=>a+s.salary,0)*0.08*k);S.money+=sv;msg('👔 Главврач сэкономил на управлении: +$'+sv)}if(L().locked)S.rp+=0.6*k*DAY/8}
 if(S.day%10===5){const rk=myRank();if(rk!==S.v17.lastRank){if(S.v17.lastRank)msg('🏆 Рейтинг больниц: '+(rk<S.v17.lastRank?'поднялись':'опустились')+' на '+rk+' место');S.v17.lastRank=rk}}};
const _hud11=v11Hud;v11Hud=function(){_hud11();const el=$('chips');if(!el||!S)return;v17Init();let m='';const rk=myRank();m+='<i class="chip" style="background:'+(rk<=2?'#2a7a3a':rk>=4?'#8a4a2a':'#555')+';pointer-events:auto" onclick="showRank()">🏆 '+rk+'/5</i>';
 const cv=S.staff.filter(s=>s.cover&&s.room).length;if(cv)m+=chip('🔄 подмена '+cv,'#356');if(S.away.length)m+=chip('🎓 '+S.away.length,'#536');if(chiefOf())m+=chip('👔','#654');
 const full=(el._h||'')+m;if(el._full!==full){el.innerHTML=full;el._full=full}};
function skillBar(s){const x=Math.floor((s.xp||0)*100);return '<span style="display:inline-block;width:60px;height:6px;background:#333;border-radius:3px;vertical-align:middle"><span style="display:block;width:'+s.skill*0.6+'px;height:6px;background:#4c4;border-radius:3px"></span></span> '+s.skill+(x?'<sup>+'+x+'%</sup>':'')}
showStaff=function(){v17Init();let h='<h3>👥 Персонал ('+S.staff.length+(S.away.length?' + '+S.away.length+' на курсах':'')+')</h3>';
 for(const s of S.staff.slice().sort((a,b)=>(!!a.room||a.type==='handyman')-(!!b.room||b.type==='handyman'))){const r=S.rooms.find(r=>r.id===s.room),c=COURSE[s.type];
  const where=r?(r.type==='chief'?'👔 Главврач':(s.cover?'🔄 подменяет: ':'')+D.rooms[r.type].name):s.state==='read'?'📚 в библиотеке':s.type==='handyman'?'обход':'⚠ БЕЗ КАБИНЕТА';
  h+='<div class="row"><div>'+D.staff[s.type].name+' '+s.name+(s.spec?' · <b>'+SPEC[s.spec].n+'</b>':'')+'<br><small>Навык '+skillBar(s)+' · $'+s.salary+' · Устал. '+Math.round(s.fat)+'% · '+where+'</small></div><span style="white-space:nowrap">'
  +(s.skill<100?'<button onclick="sendCourse('+s.id+')" '+(S.money<c[0]?'disabled':'')+' title="Курсы">🎓 $'+c[0]+'</button>':'')
  +(s.type==='doctor'&&!s.spec&&s.skill>=50?' <button onclick="showSpec('+s.id+')">⚕</button>':'')
  +' <button class="red" onclick="fire('+s.id+');showStaff()">✖</button></span></div>'}
 for(const a of S.away)h+='<div class="row"><div>🎓 '+a.s.name+'<br><small>На курсах до дня '+a.back+' · +'+a.gain+' навыка'+(a.spec?' · '+SPEC[a.spec].n:'')+'</small></div></div>';
 h+='<small>🎓 Курсы за счёт больницы: сотрудник отсутствует несколько дней и возвращается с ростом навыка. ⚕ — специализация для врача (навык ≥50). 📚 Библиотека: свободный персонал и отдыхающие сами повышают навык.</small>';panel(h)};
function showSpec(id){const s=S.staff.find(x=>x.id===id);if(!s)return;const c=COURSE.doctor;let h='<h3>⚕ Специализация: '+s.name+'</h3><small>Курсы $'+(c[0]*2)+', '+(c[1]+3)+' дн., +'+c[2]+' навыка и +8% к шансу излечения в профильных кабинетах.</small>';
 for(const k in SPEC)h+='<div class="row"><div><b>'+SPEC[k].n+'</b><br><small>'+SPEC[k].rooms.map(t=>D.rooms[t].name).join(', ')+'</small></div><button onclick="specCourse('+id+',\''+k+'\')" '+(S.money<c[0]*2?'disabled':'')+'>Отправить</button></div>';panel(h)}
function specCourse(id,k){const c=COURSE.doctor;if(S.money<c[0]*2){msg('Недостаточно денег');return}S.money-=c[0];sendCourse(id,k);const a=S.away[S.away.length-1];if(a&&a.s.id===id)a.back+=3}
const _showSel17=showSel;showSel=function(){_showSel17();const s=ui.sel;if(!s||s.k!=='room')return;const r=S.rooms.find(r=>r.id===s.id);if(!r)return;const p=$('panel');let h='';
 if(r.type==='chief'){const c=chiefOf();h+='<div class="row">Главврач<b>'+(c?c.name+' ('+c.skill+')':'не назначен')+'</b></div>'+(c?'<small>Бонусы: −усталость персонала, рост навыков, экономия 8% зарплат ×'+chiefK().toFixed(2)+(L().locked?', +исследования':'')+'</small><div class="row"><span>Снять с должности</span><button class="red" onclick="dismissChief()">Снять</button></div>':'');
  h+='<h4 style="margin:6px 0 2px">Назначить</h4>';for(const o of S.staff.filter(o=>(o.type==='doctor'||o.type==='nurse')&&o!==c).sort((a,b)=>b.skill-a.skill).slice(0,6))h+='<div class="row"><span>'+D.staff[o.type].name+' '+o.name+' · '+o.skill+'</span><button class="grn" onclick="appointChief('+o.id+')">👔</button></div>'}
 else if(r.type==='library'){const rd=S.staff.filter(o=>o.state==='read');h+='<div class="row">Читают сейчас<b>'+rd.length+'</b></div>'+rd.map(o=>'<small>📚 '+o.name+' · '+skillBar(o)+'</small><br>').join('')}
 else if(r.type==='paygp'){h+='<div class="row">Доход с приёмов<b>$'+(S.v17.pay||0)+'</b></div><small>💎 Сюда автоматически переводится самый опытный врач. Пациенты платят $'+PAY_FEE+' за приём.</small>'}
 else{const st=S.staff.find(x=>x.id===r.staff);if(st&&st.cover)h+='<div class="row">🔄 Подмена<b>'+D.staff[st.type].name+' '+st.name+'</b></div>'}
 if(h){const d=p.lastElementChild;d.insertAdjacentHTML('beforebegin',h)}};
const _showGoals17=showGoals;showGoals=function(){_showGoals17();const p=$('panel'),rk=myRank();p.lastElementChild.insertAdjacentHTML('beforebegin','<div class="row"><span>🏆 Рейтинг больниц: '+rk+' место из 5</span><button onclick="showRank()">Таблица</button></div>')};
// бот (для автотестов)
function v17Bot(){v17Init();const r=chiefRoom();if(r&&!chiefOf()){const c=S.cands.doctor;if(c&&c.length){hire('doctor',c.indexOf(c.reduce((a,b)=>b.skill>a.skill?b:a)));appointChief(S.staff[S.staff.length-1].id);hidePanel()}}
 if(S.day%25===0&&S.money>60000){const s=S.staff.filter(s=>s.type==='doctor'&&s.skill<70&&s.room).sort((a,b)=>a.skill-b.skill)[0];if(s){const sr=S.rooms.find(x=>x.id===s.room);if(sr&&sr.busy===null&&S.staff.some(o=>o!==s&&!o.room&&canCover(o,sr.type)))sendCourse(s.id);hidePanel()}}}
const _v12Bot=v12Bot;v12Bot=function(){_v12Bot();v17Bot()};
