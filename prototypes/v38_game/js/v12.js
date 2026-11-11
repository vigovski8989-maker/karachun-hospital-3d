// v12: морг, трансплантация органов, правильный путь ЧП
const ORG={heart:['🫀','сердце'],liver:['🟤','печень'],kidney:['🫘','почка'],lungs:['🫁','лёгкие'],stomach:['🥟','желудок']};
const MORGUE_CAP=6,ORGAN_LIFE=8,ORGAN_PRICE=2500;
function v12Init(){S.morgue=S.morgue||[];S.organs=S.organs||[];if(S.cands&&!S.cands.orderly){S.cands.orderly=[];for(let i=0;i<3;i++){const sk=ri(15,90);S.cands.orderly.push({name:pname(),skill:sk,salary:Math.round(D.staff.orderly.base*(0.6+sk/100)/10)*10})}}}
function morgueRoom(){return S.rooms.find(r=>r.type==='morgue'&&r.staff&&S.staff.some(s=>s.id===r.staff))}
function morgueFree(){v12Init();return MORGUE_CAP-S.morgue.length}
function needOrgan(p){const dz=D.dis[p.dis];return dz&&dz.cure==='transplant'?dz.organ:null}
function freeOrgan(t){v12Init();const o=S.organs.filter(o=>o.type===t).sort((a,b)=>a.until-b.until)[0];return o||null}
function retOrgan(p){if(p.organ&&!p.organUsed){S.organs.push(p.organ)}p.organ=null}
function buyOrgan(id){const p=S.pats.find(p=>p.id===id);if(!p)return;const t=needOrgan(p);if(!t||p.organ)return;if(S.money<ORGAN_PRICE){msg('Не хватает денег на орган');return}
 S.money-=ORGAN_PRICE;v12Init();S.organs.push({type:t,q:.72,until:S.day+ORGAN_LIFE,from:'банк'});msg('📦 Куплен орган «'+ORG[t][1]+'» в банке органов −$'+ORGAN_PRICE);if(typeof closeModal==='function')closeModal()}
// --- смерть: тело ждёт санитара морга
const _die=die;die=function(p,why){_die(p,why);retOrgan(p);if(S.rooms.some(r=>r.type==='morgue'))p.body='wait',p.bw=0}
// --- пациент
const _updP=updPatient;updPatient=function(p,dt){
 if(p.state==='dead'&&p.body){p.bw+=dt;if(p.body==='wait'&&(p.bw>40||!morgueRoom()||morgueFree()<=0)&&p.bw>8){p.body=null;p.t=0}return}
 if(p.state==='leave'&&p.organ)retOrgan(p);
 const ot=needOrgan(p);
 if(ot&&p.state==='queue'&&!p.organ){const r=S.rooms.find(r=>r.id===p.room);if(r&&r.type==='transplant'){unqueue(p);clearSeat(p);p.vs=null;p.room=null;p.state='seek';p.need='transplant'}}
 if(ot&&p.state==='seek'&&p.need==='transplant'&&!p.organ&&S.rooms.some(r=>r.type==='transplant')){const o=freeOrgan(ot);
  if(o){S.organs=S.organs.filter(x=>x!==o);p.organ=o;p.ow=0;msg('🧊 Для '+p.name+' нашёлся орган «'+ORG[ot][1]+'» (совместимость '+Math.round(o.q*100)+'%)')}
  else{const dz=D.dis[p.dis];p.thought=ORG[ot][0]+'⏳';p.ow=(p.ow||0)+dt;move(p,dt);if(!p.path.length&&Math.random()<.01){const x=ri(1,S.w-2),y=ri(S.h-6,S.h-2);if(walk(x,y)&&!roomAt(x,y))goTo(p,x,y)}
   p.health-=dt*0.07*(0.5+dz.diff)*(L().decay||1);if(p.health<=0){die(p,'organ');return}
   if(p.ow>200){msg(p.name+' не дождался донорского органа и ушёл');S.sent++;leave(p,'🏠',3)}return}}
 _updP(p,dt)};
const _cc=cureChance;cureChance=function(p,s){let c=_cc(p,s);if(needOrgan(p)){const q=p.organ?p.organ.q:.4;c=Math.max(.05,Math.min(.95,c*(.35+q*.7)-(s&&s.skill<60?.15:0)));if(s&&p.state==='treat')p.organUsed=true}return c};
// --- санитар-патологоанатом
const _updS=updStaff;updStaff=function(s,dt){
 if(s.state==='fetch'){const p=S.pats.find(x=>x.id===s.body);if(!p){s.state='idle';s.body=null;return}if(move(s,dt,3)){s.state='pick';s.pt=0}return}
 if(s.state==='pick'){const p=S.pats.find(x=>x.id===s.body);if(!p){s.state='idle';s.body=null;return}s.pt+=dt;if(s.pt>1.2){p.body='carry';const r=S.rooms.find(r=>r.id===s.room);if(!r){p.body=null;p.t=0;s.state='idle';return}const q=spotStaff(r);goTo(s,q.x,q.y);s.state='carry'}return}
 if(s.state==='carry'){const p=S.pats.find(x=>x.id===s.body);if(!p){s.state='idle';return}const done=move(s,dt,2.6);p.x=s.x;p.y=s.y;p.dir=s.dir;
  if(done){v12Init();S.pats=S.pats.filter(x=>x!==p);S.morgue.push({name:p.name,day:S.day});S.rep=Math.min(1000,S.rep+8);s.body=null;
   let txt='⚰ '+p.name+' доставлен(а) в морг (репутация −7 вместо −15)';
   if(Math.random()<.6){const ks=Object.keys(ORG),n=ri(1,2);const got=[];for(let i=0;i<n;i++){const t=pick(ks);S.organs.push({type:t,q:Math.round(rnd(.6,.97)*100)/100,until:S.day+ORGAN_LIFE,from:p.name});got.push(ORG[t][0])}txt+='. Донор согласен: '+got.join('')}
   msg(txt);s.state='goto'}return}
 if(s.state==='work'&&(s.type==='orderly'||s.type==='doctor')){const r=S.rooms.find(r=>r.id===s.room);if(r&&r.type==='morgue'&&morgueFree()>0){const p=S.pats.find(x=>x.state==='dead'&&x.body==='wait');
  if(p){if(s.vs){if(s.vs.ph==='sat'){leaveSeat(s);return}clearSeat(s)}if(goTo(s,Math.round(p.x),Math.round(p.y))){p.body='fetch';s.body=p.id;s.state='fetch';return}}}}
 _updS(s,dt)};
// --- ежедневно: порча органов, вывоз тел
function v12Day(){v12Init();const bad=S.organs.filter(o=>o.until<=S.day);if(bad.length){S.organs=S.organs.filter(o=>o.until>S.day);msg('🗑 Испортилось органов: '+bad.length)}
 S.morgue=S.morgue.filter(b=>S.day-b.day<6)}
function v12Bot(){v12Init();if(S._obT&&S.day-S._obT<.5)return;for(const p of S.pats)if(needOrgan(p)&&!p.organ&&p.state==='seek'&&(p.ow||0)>15&&!freeOrgan(needOrgan(p))&&S.money>30000){buyOrgan(p.id);S._obT=S.day;return}}
// трансплантационные болезни — редкие (40% от обычной частоты)
const _spawnP=spawnPatient;spawnPatient=function(){_spawnP.apply(this,arguments);const p=S.pats[S.pats.length-1];if(p&&needOrgan(p)&&Math.random()<.6){const ok=L().diseases.filter(z=>D.dis[z].cure!=='transplant'&&!roomLocked(D.dis[z].cure));if(ok.length)p.dis=pick(ok)}};
function v12Chips(){if(!S.rooms.some(r=>r.type==='morgue')&&!(S.organs&&S.organs.length))return '';v12Init();return chip('⚰'+S.morgue.length+'/'+MORGUE_CAP)+(S.organs.length?chip('🧊'+S.organs.length):'')}
