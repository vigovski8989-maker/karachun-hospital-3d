'use strict';
// ===== Механики уровней 5–12: участки, исследования, ЧП, эпидемии, VIP, землетрясения, кредиты, стоимость больницы =====
function mechInit(){const l=L();S.lots=(l.lots||[]).map(a=>({x:a[0],y:a[1],w:a[2],h:a[3],price:a[4],own:false}));S.rp=0;S.unl={};S.loan=0;S.em=null;S.epi=null;S.vip=null;S.quake=null;
 S.mt={em:(l.emerg?ri(6,10):-1),epi:(l.epid?ri(10,16):-1),vip:(l.vip?ri(8,14):-1),quake:(l.quake?ri(12,20):-1)}}
function inLot(x,y){if(!S||!S.lots)return null;for(const l of S.lots)if(!l.own&&x>=l.x&&y>=l.y&&x<l.x+l.w&&y<l.y+l.h)return l;return null}
function buyLot(i){const l=S.lots[i];if(!l||l.own)return;if(S.money<l.price){msg('Недостаточно денег на участок');Snd.bad();closeModal();return}S.money-=l.price;l.own=true;invBlk();Snd.build();msg('🏞 Участок куплен: +'+(l.w*l.h)+' клеток');closeModal();setSpeed(1)}
function askLot(l){const i=S.lots.indexOf(l);setSpeed(0);modal('<h3>🏞 Свободный участок '+l.w+'×'+l.h+'</h3><p>Купить за $'+l.price+'?</p><button class="grn" onclick="buyLot('+i+')">Купить</button> <button onclick="closeModal();setSpeed(1)">Отмена</button>')}
function drawLots(g){if(!S.lots)return;g.textAlign='center';for(const l of S.lots){if(l.own)continue;const a=iso(l.x,l.y),b=iso(l.x+l.w,l.y),c=iso(l.x+l.w,l.y+l.h),d=iso(l.x,l.y+l.h);g.save();g.setLineDash([6,5]);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(c.x,c.y);g.lineTo(d.x,d.y);g.closePath();g.fillStyle='rgba(255,230,120,.10)';g.fill();g.strokeStyle='#ffe27a';g.lineWidth=2;g.stroke();g.restore();
 const m=iso(l.x+l.w/2,l.y+l.h/2);g.font='bold 12px sans-serif';const t='🏞 Участок $'+l.price;const tw=g.measureText(t).width+12;g.fillStyle='rgba(30,40,20,.8)';g.fillRect(m.x-tw/2,m.y-10,tw,18);g.fillStyle='#ffe27a';g.fillText(t,m.x,m.y+3)}}
// --- стоимость больницы
function hospValue(){let v=0;for(const r of S.rooms)if(!r.par)v+=r.cost||D.rooms[r.type].cost;for(const i of S.items)v+=D.items[i.type].cost;for(const l of S.lots||[])if(l.own)v+=Math.round(l.price*1.5);return v+Math.max(0,S.money)-(S.loan||0)}
// --- исследования
function roomLocked(k){const lk=L().locked;return lk&&lk[k]&&!(S.unl&&S.unl[k])?lk[k]:0}
function mechTick(dt){
 const lk=L().locked;if(lk){for(const r of S.rooms)if(r.type==='research'&&staffReady(r)){const s=S.staff.find(s=>s.id===r.staff);S.rp+=dt*0.9*eff(s)*v24Spd(rCap(r))}
  for(const k in lk)if(!S.unl[k]&&S.rp>=lk[k]){S.unl[k]=1;msg('🔬 Исследование завершено: можно строить «'+D.rooms[k].name+'»');Snd.win()}}
 if(S.quake&&S.quake.t>0){S.quake.t-=dt;if(S.quake.t<=0)S.quake=null}
 if(S.vip&&S.vip.state){/* VIP ходит как пациент, см. updVip */}}
// --- ежедневные события
function mechDay(){const l=L(),d=S.day;
 if(S.loan>0&&d%MONTH_DAYS===0){const i=Math.round(S.loan*(l.loanRate||.03));S.money-=i;msg('🏦 Проценты по кредиту −$'+i)}
 // ЧП
 if(S.em&&d>=S.em.until){const left=S.em.ids.filter(id=>S.pats.some(p=>p.id===id&&p.state!=='leave'&&p.state!=='dead'));const ok=S.em.cured;
  if(ok>=S.em.n*0.6){S.money+=S.em.bonus;S.earn+=S.em.bonus;S.rep=Math.min(1000,S.rep+20);msg('🚑 ЧП: спасено '+ok+'/'+S.em.n+' — премия $'+S.em.bonus)}else{S.rep=Math.max(0,S.rep-25);msg('🚑 ЧП провалено: спасено '+ok+'/'+S.em.n+' — репутация −25')}
  for(const id of left){const p=S.pats.find(p=>p.id===id);if(p)p.emg=false}S.em=null;S.mt.em=d+ri(10,16)}
 else if(!S.em&&S.mt.em>=0&&d>=S.mt.em){startEmergency()}
 // эпидемия
 if(S.epi&&d>=S.epi.until){const inf=S.pats.filter(p=>p.inf&&p.state!=='leave'&&p.state!=='dead').length;
  if(inf===0){S.money+=3000;S.rep=Math.min(1000,S.rep+15);msg('🦠 Инспектор доволен: эпидемия остановлена, +$3000')}else{const f=inf*1500;S.money-=f;S.rep=Math.max(0,S.rep-inf*8);msg('🦠 Инспектор нашёл '+inf+' заражённых: штраф −$'+f)}
  S.pats.forEach(p=>p.inf=false);S.epi=null;S.mt.epi=d+ri(14,22)}
 else if(!S.epi&&S.mt.epi>=0&&d>=S.mt.epi&&S.pats.length>3){const p=pick(S.pats.filter(p=>!p.immune&&p.state!=='dead'&&p.state!=='leave'));if(p){p.inf=true;S.epi={until:d+6,dis:p.dis};msg('🦠 Эпидемия! Заразный пациент '+p.name+'. Вакцинируйте больных (нажмите на пациента) до прихода инспектора через 6 дней');Snd.pa()}}
 // VIP
 if(!S.vip&&S.mt.vip>=0&&d>=S.mt.vip){spawnVip()}
 // землетрясение
 if(S.mt.quake>=0&&d===S.mt.quake-1)msg('🌋 Сейсмологи предупреждают: завтра возможно землетрясение! Отремонтируйте аппараты');
 if(S.mt.quake>=0&&d>=S.mt.quake){quakeHit();S.mt.quake=d+ri(18,26)}}
function startEmergency(){const ok=L().diseases.filter(z=>D.dis[z].cure!=='transplant'&&S.rooms.some(r=>r.type===D.dis[z].cure));if(!ok.length){S.mt.em=S.day+4;return}const dz=pick(ok),n=ri(3,5)+(S.lv>8?2:0);S.em={dis:dz,ids:[],n,cured:0,until:S.day+20,bonus:n*D.dis[dz].fee};
 for(let i=0;i<n;i++){spawnPatient();const p=S.pats[S.pats.length-1];p.dis=dz;p.known=false;p.cert=.45;p.need='reception';p.emg=true;p.health=Math.max(p.health,100);p.wcDone=true;S.em.ids.push(p.id);p.x=S.ent.x+ri(-1,1)}
 msg('🚑 ЧП! '+n+' пациентов с «'+D.dis[dz].name+'». Пройдут регистрацию и диагностику без очереди. Вылечите ≥60% за 20 дней — премия $'+S.em.bonus);Snd.pa()}
function spawnVip(){spawnPatient();const p=S.pats[S.pats.length-1];p.vip=true;p.state='vip';p.vt=[];const rs=S.rooms.slice().sort(()=>Math.random()-.5).slice(0,5);for(const r of rs){const o=doorOut(r);p.vt.push([o.x,o.y])}p.pat=100;p.health=100;p.wcDone=true;
 S.vip={id:p.id,deaths0:S.deaths,cured0:S.cured,litter:0,n:0};msg('🎩 В больницу прибыл VIP-гость. Он оценит чистоту, очереди и уют');S.mt.vip=-1}
function updVip(p,dt){if(!S.vip){p.vip=false;leave(p,'🎩',0);return}if(!p.path.length){const t=p.vt.shift();if(t){goTo(p,t[0],t[1]);S.vip.litter+=S.litter.length;S.vip.n++;S.vip.q=(S.vip.q||0)+S.rooms.reduce((a,r)=>a+r.queue.length,0)}else{vipVerdict();leave(p,'🎩',0);return}}move(p,dt)}
function vipVerdict(){const v=S.vip;if(!v)return;const n=Math.max(1,v.n),lit=v.litter/n,q=(v.q||0)/n/Math.max(1,S.rooms.length),dd=S.deaths-v.deaths0;
 let sc=100-lit*4-q*25-dd*20+Math.min(20,S.items.filter(i=>D.items[i.type].comfort).length*2)+(S.rep-500)/20;sc=Math.max(0,Math.min(100,Math.round(sc)));
 const bonus=sc>=60?Math.round(sc*100):0;S.money+=bonus;S.rep=Math.max(0,Math.min(1000,S.rep+(sc-50)/2));
 modal('<h3>🎩 Отзыв VIP-гостя</h3><p>Оценка: <b>'+sc+'/100</b>. '+(sc>=60?'«Великолепно! Жертвую $'+bonus+'»':'«Грязно и долго. Расскажу всем друзьям…»')+'</p><button onclick="closeModal()">OK</button>');S.vip=null;S.mt.vip=S.day+ri(16,24)}
function quakeHit(){S.quake={t:4};Snd.boom();let n=0;for(const r of S.rooms.slice())if(D.rooms[r.type].machine){r.cond=Math.max(5,r.cond-ri(15,40));n++}msg('🌋 Землетрясение! Повреждено аппаратов: '+n+'. Аппараты с износом ≤20% закрыты до ремонта — нужен разнорабочий')}
function quakeShake(){return S.quake?{x:Math.sin(performance.now()/30)*4*S.quake.t/4,y:Math.cos(performance.now()/23)*3*S.quake.t/4}:{x:0,y:0}}
// --- кредиты
function showBank(){const mx=L().loanMax||40000;panel('<h3>🏦 Банк</h3><div class="row">Долг<b>$'+S.loan+'</b></div><div class="row">Лимит<b>$'+mx+'</b></div><small>Процент '+Math.round((L().loanRate||.03)*100)+'% в месяц</small><div class="row"><span>Взять $10 000</span><button '+(S.loan+10000>mx?'disabled':'')+' onclick="S.loan+=10000;S.money+=10000;showBank()">Взять</button></div><div class="row"><span>Вернуть $10 000</span><button '+(S.loan<10000||S.money<10000?'disabled':'')+' onclick="S.loan-=10000;S.money-=10000;showBank()">Вернуть</button></div>')}
