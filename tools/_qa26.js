// QA-аудит: прогоны бота с детектором зависаний + сценарии крайних случаев. Не меняет код игры.
const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
const MODE=process.argv[2]||'all';
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.setViewport({width:412,height:860,deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto((process.env.URL||'http://localhost:8098/')+'',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());
const start=async(li,money)=>{await p.evaluate((li,m)=>{closeModal();newGame(li);closeModal();if(m)S.money=m},li,money);await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;return out'),PLAN)};
// симуляция с детектором: агент «застрял», если 3 игровых дня позиция почти не меняется в «движущемся» состоянии
const SIM=`window.qaSim=function(days,bot){const MOV={seek:1,goto:1,leave:1,torest:1,tocoffee:1,vip:1,idle:0};const st={};const out={stuck:{},maxQ:0,maxPats:0,idleStaff:0,dayStart:S.day,ex:[]};let ld=S.day;
 while(S.day<out.dayStart+days&&!S.won&&!S.lost){for(let i=0;i<40;i++)update(0.05);
  if(S.day!==ld){ld=S.day;if(bot){botBuild();S.pats.filter(p=>p.inf).forEach(p=>vacc(p.id));if(window.v12Bot)v12Bot();if(L().loanMax&&!S.loan&&S.money<5000){S.loan=10000;S.money+=10000}}closeModal();
   for(const e of S.pats.concat(S.staff)){const k=(e.type?'s':'p')+e.id,o=st[k];const pos=Math.round(e.x*2)+','+Math.round(e.y*2);
    if(o&&o.pos===pos&&o.state===e.state){o.n++;if(o.n>=3&&(MOV[e.state]||e.state==='queue'&&o.n>=12)){out.stuck[e.state]=(out.stuck[e.state]||0)+1;o.n=-99}}else st[k]={pos,state:e.state,n:0}}
   out.maxQ=Math.max(out.maxQ,...S.rooms.map(r=>r.queue.length));out.maxPats=Math.max(out.maxPats,S.pats.length);
   out.idleStaff+=S.staff.filter(s=>s.type!=='handyman'&&!s.room&&s.state==='idle').length}}
 closeModal();Object.assign(out,{day:S.day,won:S.won,lost:S.lost,cured:S.cured,deaths:S.deaths,money:S.money,rep:Math.round(S.rep),val:hospValue(),dl:S.dl});return out}`;
await p.evaluate(SIM);
const R={};
if(MODE==='all'||MODE==='seeds'){R.seeds={};const seeds=+process.env.SEEDS||3;
 for(const li of (process.env.LV?process.env.LV.split(',').map(Number):[0,1,2,3,4,5,6,7,8,9,10,11]))for(let s=0;s<seeds;s++){await start(li);const r=await p.evaluate(()=>qaSim(700,true));R.seeds['L'+(li+1)+'#'+s]=r;console.log('L'+(li+1)+'#'+s,JSON.stringify(r))}}
if(MODE==='all'||MODE==='edge'){const E=R.edge={};
 // 1 увольнение врача во время лечения
 await start(2);E.fireMid=await p.evaluate(()=>{for(let i=0;i<4000;i++){update(.05);const pt=S.pats.find(p=>p.state==='treat');if(pt){const r=S.rooms.find(r=>r.id===pt.room);const s=S.staff.find(s=>s.id===r.staff);if(!s)continue;fire(s.id);const st0=pt.state;for(let k=0;k<1600;k++)update(.05);const q=S.pats.find(q=>q.id===pt.id);return{before:st0,after:q?q.state:'gone',room:r.type,roomStaff:r.staff,busy:r.busy}}}return 'no treat'});
 // 2 продажа кабинета с людьми внутри
 E.sellBusy=await p.evaluate(()=>{for(let i=0;i<4000;i++){update(.05);const pt=S.pats.find(p=>p.state==='treat');if(pt){const r=S.rooms.find(r=>r.id===pt.room);const t=r.type,cost=D.rooms[t].cost;const m0=S.money;sellRoom(r.id);const refund=S.money-m0;for(let k=0;k<800;k++)update(.05);const q=S.pats.find(q=>q.id===pt.id);return{type:t,cost,refund,after:q?q.state+'/'+q.need:'gone',inside:!!(q&&roomAt(Math.round(q.x),Math.round(q.y)))}}}return 'none'});
 // 3 продажа комнаты отдыха во время отдыха/кофе
 E.sellStaffroom=await p.evaluate(()=>{for(let i=0;i<8000;i++){update(.05);const s=S.staff.find(s=>['rest','coffee','tocoffee','torest'].includes(s.state));if(s){const r=S.rooms.find(r=>r.type==='staffroom');if(!r)return 'no staffroom';const st0=s.state;sellRoom(r.id);for(let k=0;k<1600;k++)update(.05);return{before:st0,after:s.state,fat:Math.round(s.fat),anyRestLoop:S.staff.filter(x=>x.state==='torest'||x.state==='rest').length}}}return 'nobody rested'});
 // 4 нет регистратуры
 await start(1);E.noReception=await p.evaluate(()=>{for(const r of S.rooms.filter(r=>r.type==='reception'))sellRoom(r.id);const c0=S.cured,d0=S.deaths;for(let i=0;i<3200;i++)update(.05);closeModal();return{pats:S.pats.length,states:[...new Set(S.pats.map(p=>p.state+':'+p.need))].slice(0,6),cured:S.cured-c0,deaths:S.deaths-d0,rep:Math.round(S.rep)}});
 // 5 сохранение/загрузка посреди лечения и туалета
 await start(2);E.saveLoad=await p.evaluate(()=>{for(let i=0;i<3000;i++)update(.05);const st=S.pats.map(p=>p.state).join();save(true);load();closeModal();const c0=S.cured;let stuck=0;const pos=S.pats.map(p=>[p.id,p.x,p.y]);for(let i=0;i<1600;i++)update(.05);for(const [id,x,y] of pos){const q=S.pats.find(q=>q.id===id);if(q&&q.x===x&&q.y===y&&q.state!=='queue')stuck++}return{statesBefore:[...new Set(st.split(','))],curedAfter:S.cured-c0,stuck,errs:0}});
 // 6 исследование: можно ли построить закрытый кабинет через startRoom/gok
 await start(4);E.lockedBuild=await p.evaluate(()=>{const k=Object.keys(L().locked)[0];const n0=S.rooms.length;startRoom(k);const g=ui.ghost;let ok=false;if(g){for(let y=1;y<S.h-8&&!ok;y++)for(let x=1;x<S.w-8&&!ok;x++){g.x=x;g.y=y;if(!validRoom(g)){gok();ok=S.rooms.length>n0}}}gcancel();return{room:k,locked:roomLocked(k),built:ok}});
 // 7 кредит покрывает цель по деньгам
 await start(5);E.loanGoal=await p.evaluate(()=>{const m0=S.money,v0=hospValue();S.loan+=60000;S.money+=60000;return{moneyGain:S.money-m0,valueGain:hospValue()-v0,note:'goal.money проверяет S.money без учёта долга'}});
 // 8 банкротство с кредитом
 E.bankrupt=await p.evaluate(()=>{return{loseMoney:L().lose.money,loanMax:L().loanMax}});
 // 9 вакцинация: повторное заражение, вакцина здоровым, отправка заражённых домой
 await start(6);E.epi=await p.evaluate(()=>{for(let i=0;i<6000&&!S.epi;i++)update(.05);if(!S.epi)return 'no epidemic';const inf0=S.pats.filter(p=>p.inf);inf0.forEach(p=>vacc(p.id));const healthy=S.pats.find(p=>!p.inf);const m=S.money;if(healthy)vacc(healthy.id);const paidHealthy=m-S.money;let reinf=0;for(let i=0;i<1600;i++)update(.05);reinf=S.pats.filter(p=>p.inf).length;const ids=S.pats.filter(p=>p.inf).map(p=>p.id);ids.forEach(id=>leavePat(id));closeModal();return{vaccinatedHealthyCost:paidHealthy,reinfectedAfter2days:reinf,sentHomeToDodge:ids.length,patientZeroCured:'n/a'}});
 // 10 продажа ради прибыли: стоимость больших комнат vs возврат
 E.sellProfit=await p.evaluate(()=>{const t='gp',d=D.rooms[t];return{baseCost:d.cost,refund:Math.round(d.cost/2),bigRoomExtraPaid:(12*12-(d.min[0]+2)*(d.min[1]+2))*30,valueCountsOnlyBase:true}});
 // 11 землетрясение: взрыв, когда пациент внутри
 await start(8);E.quake=await p.evaluate(()=>{for(let i=0;i<2000;i++)update(.05);const m=S.rooms.filter(r=>D.rooms[r.type].machine);m.forEach(r=>r.cond=10);const n0=S.rooms.length,d0=S.deaths;quakeHit();for(let i=0;i<200;i++)update(.05);closeModal();return{machines:m.length,roomsLost:n0-S.rooms.length,deathsDelta:S.deaths-d0}});
 // 12 VIP: что если пациент-VIP идёт по закрытому участку / дверям
 E.vip=await p.evaluate(()=>{spawnVip();const v=S.pats.find(p=>p.vip);let t=0;while(S.pats.includes(v)&&v.state==='vip'&&t<8000){update(.05);t++}closeModal();return{endedState:v.state,steps:t,sec:t*.05}});
 // 13 ЧП, когда нужного кабинета нет / заблокирован
 await start(5);E.emerg=await p.evaluate(()=>{startEmergency();const e=S.em;closeModal();return e?{dis:e.dis,cure:D.dis[e.dis].cure,n:e.n,cureBuilt:S.rooms.some(r=>r.type===D.dis[e.dis].cure),cureLocked:!!roomLocked(D.dis[e.dis].cure)}:'none'});
 // 14 полная карта: сколько можно построить; патфайнд при занятых дверях
 await start(11,5e6);E.fullMap=await p.evaluate(()=>{let n=0;const ks=L().rooms.filter(k=>!roomLocked(k));for(let y=1;y<S.h-6;y+=1)for(let x=1;x<S.w-6;x+=1){const k=ks[n%ks.length],d=D.rooms[k];const g={type:k,x,y,w:d.min[0]+2,h:d.min[1]+2,side:n%4};if(!validRoom(g)){S.rooms.push(makeRoom(k,x,y,g.w,g.h,g.side));n++}}let un=0;for(const r of S.rooms){const o=doorOut(r);if(!path(S.ent.x,S.ent.y,o.x,o.y))un++}return{rooms:n,unreachableDoors:un}});
 // 15 производительность L12
 await p.evaluate(()=>{for(let i=0;i<60;i++)spawnPatient();setSpeed(1)});const perf=await p.evaluate(async()=>{const n=S.pats.length+S.staff.length;let t0=performance.now(),k=0;await new Promise(r=>{function f(){k++;if(performance.now()-t0<3000)requestAnimationFrame(f);else r()}requestAnimationFrame(f)});const fps=k/3;t0=performance.now();for(let i=0;i<200;i++)update(.05);return{agents:n,rooms:S.rooms.length,fps:Math.round(fps),updMs:+((performance.now()-t0)/200).toFixed(2)}});E.perf=perf;
}
R.errs=errs;fs.writeFileSync('/tmp/qa_'+MODE+'.json',JSON.stringify(R,null,1));console.log(JSON.stringify(R.edge||{},null,0));console.log('errs',JSON.stringify(errs.slice(0,5)));await b.close()})();
