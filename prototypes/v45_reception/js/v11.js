// v11: исправления по QA_REPORT.md
function netCash(){return S.money-(S.loan||0)}
function cureChance(p,s){const dz=D.dis[p.dis],sk=s?s.skill:(bestSkill(D.rooms[dz.cure]&&D.rooms[dz.cure].staff)||50);return Math.max(.05,Math.min(.97,0.55+p.cert*0.35+sk/400)-(L().risk||0)*(0.5+dz.diff))}
function bestSkill(t){let b=0;for(const s of S.staff)if(s.type===t)b=Math.max(b,s.skill);return b}
function diagRooms(){return ['diag','lab','xray'].filter(t=>S.rooms.some(r=>r.type===t))}
// политика: если шанс ниже порога и есть диагностика — дообследовать
function lowChanceCheck(p){if(p.force||p.cert>=0.99)return;const mc=S.minCh==null?.6:S.minCh;if(cureChance(p)<mc){const dr=diagRooms();if(dr.length){p.need=dr[Math.floor(Math.random()*dr.length)];p.thought='🔍'}}}
function treatNow(id){const p=S.pats.find(p=>p.id===id);if(!p)return;const dz=D.dis[p.dis];unqueue(p);p.known=true;p.force=true;p.need=dz.cure;p.state='seek';hidePanel();msg(p.name+' → лечение сейчас ('+Math.round(cureChance(p)*100)+'%)')}
function moreDiag(id){const p=S.pats.find(p=>p.id===id);if(!p)return;const dr=diagRooms();if(!dr.length){msg('Нет кабинетов диагностики');return}unqueue(p);p.force=false;p.need=dr[0];p.state='seek';hidePanel();msg(p.name+' → дообследование')}
function setMinCh(v){S.minCh=v;showMenu()}
// передача кабинета на время отдыха
function handOver(s,r){if(!r)return;const sub=S.staff.find(o=>o!==s&&o.type===s.type&&!o.room&&o.state==='idle');if(sub){r.staff=null;s.room=null}}
function v11Day(){const d=S.day;
 // банкротство
 if(S.money< -10000){S.bk=(S.bk||0)+1;if(S.bk===1||S.bk===MONTH_DAYS||S.bk===MONTH_DAYS*2-5){msg('⚠ Долг больше $10 000! Банкротство через '+(MONTH_DAYS*2-S.bk)+' дн.');Snd.bad()}}else S.bk=0;
 // перебалансировка очередей
 const by={};for(const r of S.rooms)(by[r.type]=by[r.type]||[]).push(r);
 for(const t in by){const rs=by[t];if(rs.length<2)continue;rs.sort((a,b)=>a.queue.length/rCap(a)-b.queue.length/rCap(b));const lo=rs[0],hi=rs[rs.length-1];
  while(hi.queue.length/rCap(hi)-lo.queue.length/rCap(lo)>=3){const id=hi.queue[hi.queue.length-1];const p=S.pats.find(p=>p.id===id);if(!p||p.state!=='queue')break;if(p.vs)break;unqueue(p);p.state="seek";p.room=null;break}
  for(const r of rs)r.queue=r.queue.filter(x=>typeof x==='number')}
 // перегрузка
 S.over=S.rooms.filter(r=>r.queue.length>=6*rCap(r)).map(r=>r.id);if(S.over.length&&d%3===0){const r=S.rooms.find(r=>r.id===S.over[0]);msg('⚠ Перегрузка: «'+D.rooms[r.type].name+'», очередь '+r.queue.length+'. Постройте ещё один или наймите сменщика')}
}
function resDone(){const lk=L().locked;if(!lk)return false;for(const k in lk)if(!S.unl||!S.unl[k])return false;return true}
function v11Day2(){const d=S.day;
 const has=t=>S.rooms.some(r=>r.type===t),hasS=t=>S.staff.some(s=>s.type===t);
 if(d%4===1){if(!has('reception'))msg('⚠ Нет стойки регистрации — пациенты уходят! Постройте «Регистратура»');else if(!hasS('receptionist'))msg('⚠ Нет регистратора — наймите его');else if(!has('gp'))msg('⚠ Нет кабинета терапевта — пациентов некому осматривать')}
 const lk=L().locked;if(lk){if(resDone()){if(!S.resMsg){S.resMsg=1;msg('🔬 Всё исследовано! Лаборанты освобождены и пойдут в другие кабинеты');for(const r of S.rooms)if(r.type==='research'&&r.staff){const s=S.staff.find(s=>s.id===r.staff);r.staff=null;if(s){clearSeat(s);s.room=null;s.state='idle'}}}}
  else if(d%5===2&&!S.rooms.some(r=>r.type==='research'&&r.staff))msg('🔬 Исследования стоят: '+(has('research')?'в лаборатории нет сотрудника':'постройте исследовательский отдел'))}
 if(d%5===3){const idle=idleStaff();if(idle.length)msg('👤 Без кабинета: '+idle.length+' сотр. — постройте кабинет или уволите лишних')}
 for(const r of S.rooms)if(D.rooms[r.type].machine&&r.cond<=20&&d%3===0)msg('🔧 «'+D.rooms[r.type].name+'» закрыт: износ '+r.cond+'%. Нужен разнорабочий')}
function idleStaff(){return S.staff.filter(s=>s.type!=='handyman'&&!s.room)}
function chip(t,c){return '<i class="chip"'+(c?' style="background:'+c+'"':'')+'>'+t+'</i>'}
function v11Hud(){const el=$('chips');if(!el)return;let h='';const d=S.day;
 if(S.loan)h+=chip('🏦 −$'+Math.round(S.loan/1000)+'k');
 if(S.bk)h+=chip('⚠ банкротство '+(MONTH_DAYS*2-S.bk)+'д','#a22');
 const lk=L().locked;if(lk&&!resDone()){let nx=null;for(const k in lk)if(!S.unl[k]&&(!nx||lk[k]<lk[nx]))nx=k;h+=chip('🔬 '+Math.floor(S.rp)+'/'+lk[nx])}
 if(S.em)h+=chip('🚑 '+S.em.cured+'/'+S.em.n+' · '+Math.max(0,S.em.until-d)+'д','#a33');
 if(S.epi){const n=S.pats.filter(p=>p.inf&&p.state!=='dead').length;h+=chip('🦠 '+n+' · инсп. '+Math.max(0,S.epi.until-d)+'д','#585')}
 if(S.vip){const v=S.vip,vp=S.pats.find(p=>p.vip&&p.state==='vip');if(vp){const n=Math.max(1,v.n),q=(v.q||0)/n/Math.max(1,S.rooms.length),lit=v.litter/n,m=(q>3||lit>8)?'😠':(q>1.5||lit>3)?'😐':'😊';h+=chip('🎩 VIP '+v.n+'/'+(v.n+vp.vt.length)+' '+m,'#764')}}
 if(S.quake)h+=chip('🌋','#a52');
 const idle=idleStaff().length;if(idle)h+=chip('👤 '+idle+' без каб.','#555');
 if(S.over&&S.over.length)h+=chip('⚠ очередь','#a60');
 if(el._h!==h){el.innerHTML=h;el._h=h}}
(function(){const f=()=>{const t=document.getElementById('top'),m=document.getElementById('msg');if(t&&m)m.style.top=(t.offsetHeight+6)+'px'};setInterval(f,500)})();
function slotKey(lv){return SAVE_KEY+'_L'+lv}
function lastLv(){const v=localStorage.getItem(SAVE_KEY+'_last');return v==null?null:+v}
function migrateSave(){try{const j=localStorage.getItem(SAVE_KEY);if(j){const o=JSON.parse(j);if(o&&o.S&&!o.S.lost){localStorage.setItem(slotKey(o.S.lv),j);localStorage.setItem(SAVE_KEY+'_last',o.S.lv)}localStorage.removeItem(SAVE_KEY)}}catch(e){}}

// обучение на уровне 1
const TUT=[
 [()=>S.rooms.some(r=>r.type==='reception'),'1/7 Нажмите <b>🏗 Кабинеты</b> → «Регистратура», поставьте её у входа и нажмите ✔'],
 [()=>S.staff.some(s=>s.type==='receptionist'),'2/7 Нажмите <b>👩‍⚕️ Нанять</b> → регистратор. Он сам займёт стойку'],
 [()=>S.rooms.some(r=>r.type==='gp'),'3/7 Постройте «Кабинет терапевта» — там ставят диагноз'],
 [()=>S.staff.filter(s=>s.type==='doctor').length>=1,'4/7 Наймите врача для кабинета терапевта'],
 [()=>S.rooms.some(r=>r.type==='pharmacy'),'5/7 Постройте «Аптеку» — там лечат большинство болезней'],
 [()=>S.staff.some(s=>s.type==='nurse'),'6/7 Наймите медсестру для аптеки'],
 [()=>S.rooms.some(r=>r.type==='diag')&&S.staff.filter(s=>s.type==='doctor').length>=2,'7/7 Постройте «Сканер-кабинет» и наймите второго врача — диагноз точнее, меньше смертей'],
];
function tutTick(){let el=document.getElementById('tut');if(!S||S.lv!==0||S.tutOff||S.won||S.lost){if(el)el.style.display='none';return}
 const st=TUT.findIndex(t=>!t[0]());if(st<0){if(!S.tutOff){S.tutOff=1;msg('🎓 Обучение пройдено! Дальше следите за целями (🎯) и очередями');}if(el)el.style.display='none';return}
 if(!el){el=document.createElement('div');el.id='tut';el.style.cssText='position:fixed;left:8px;right:8px;bottom:78px;z-index:6;background:rgba(20,60,90,.95);border:2px solid #ffd24a;border-radius:10px;padding:8px 10px;font-size:14px;line-height:1.35;display:flex;gap:8px;align-items:center';document.body.appendChild(el)}
 let h='<span style="flex:1">🎓 '+TUT[st][1]+'</span><button onclick="S.tutOff=1;tutTick()">Пропустить</button>';if(typeof v12Chips==='function')h+=v12Chips();if(el._h!==h){el.innerHTML=h;el._h=h;el.querySelectorAll('button').forEach(b=>b.style.pointerEvents='auto')}el.style.pointerEvents='none';
 // не перекрывать панели/кнопки стройки: ставим подсказку над самым верхним нижним элементом
 let top=innerHeight;for(const id of ['bar','build','panel']){const e=document.getElementById(id);if(e&&getComputedStyle(e).display!=='none'){const r=e.getBoundingClientRect();if(r.height)top=Math.min(top,r.top)}}
 el.style.bottom=Math.max(8,innerHeight-top+6)+'px';el.style.display='flex';
 if(el.getBoundingClientRect().top<innerHeight*0.25)el.style.display='none'}
setInterval(()=>{try{tutTick()}catch(e){}},400);
