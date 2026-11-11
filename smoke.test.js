// Дымовой тест: для каждого уровня автоматически строит больницу, нанимает персонал, симулирует игру.
const pp=require('puppeteer-core');
const LV=process.argv[2]?[+process.argv[2]]:[0,1,2,3,4,5,6,7,8,9,10,11];const MAXD=+process.env.MAXD||700;
const PLAN=[['reception',1],['gp',2],['pharmacy',1],['diag',1],['lab',1],['ward',1],['psych',1],['pump',1],['cardio',1],['surgery',1],['icu',1],['research',1],['xray',1],['derma',1],['genetics',1],['inflate',1],['electro',1],['reboot',1],['toilet',1],['staffroom',1],['paygp',1],['chief',1],['morgue',1],['transplant',1],['gp',1],['reception',1],['ward',1],['library',1],['pharmacy',1],['diag',1],['psych',1],['gp',1],['ward',1],['surgery',1],['icu',1]];
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.setViewport({width:412,height:860,deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());await p.reload({waitUntil:'networkidle0'});
await p.screenshot({path:'screenshots/01_levelselect.png'});
for(const li of LV){
 await p.evaluate(li=>{closeModal();newGame(li);closeModal()},li);
 const built=await p.evaluate((PLAN)=>{window.__PLAN=PLAN;window.botBuild=function(){const out=[];const rooms=L().rooms;
  for(const [pi,[t,n]] of PLAN.entries()){if(!rooms.includes(t)||roomLocked(t))continue;if(S.rooms.filter(r=>r.type===t).length>=(PLAN.filter(q=>q[0]===t).reduce((a,q)=>a+q[1],0)))continue;const d=D.rooms[t];let ok=false;
   for(let y=1;y<S.h-d.min[1]-4&&!ok;y++)for(let x=1;x<S.w-d.min[0]-3&&!ok;x++)for(const side of[0,2,1,3]){const g={type:t,x,y,w:d.min[0]+2,h:d.min[1]+2,side};
    let clear=true;for(let yy=y-1;yy<=y+g.h&&clear;yy++)for(let xx=x-1;xx<=x+g.w;xx++)if(roomAt(xx,yy)||isHole(xx,yy)){clear=false;break}
    if(!clear||S.money<d.cost+(pi>=28?120000:5000))continue;if(validRoom(g))continue;S.money-=d.cost;const r=makeRoom(t,x,y,g.w,g.h,side);S.rooms.push(r);ok=true;
    const role=t==='reception'?'receptionist':d.staff;if(role){const c=S.cands[role];hire(role,c.indexOf(c.reduce((a,b)=>b.skill>a.skill?b:a)))}break}
   out.push(t+(ok?'':'✗'))}return out.join(' ')};
  const out=botBuild();hire('handyman',0);hire('handyman',0);if(L().quake)hire('handyman',0);
  [[2,0,'bench'],[3,0,'bench'],[5,0,'plant'],[7,0,'soda'],[9,0,'bin']].forEach(([dx,dy,k])=>{for(let y=S.h-3;y>S.h-8;y--){const x=S.ent.x+dx;if(!roomAt(x,y)&&walk(x,y)){placeItem(k,x,y);break}}});
  return out},PLAN);
 const res=await p.evaluate((MAXD)=>{let mo=0;let ld=-1,ex=[];while(S.day<MAXD&&!S.won&&!S.lost){for(let i=0;i<400;i++)update(0.05);if(S.day!==ld){ld=S.day;const b=botBuild().split(' ').filter(x=>x&&!x.includes('✗'));if(b.length)ex.push(S.day+':'+b);S.pats.filter(p=>p.inf).forEach(p=>vacc(p.id));if(window.v12Bot)v12Bot();closeModal();if(S.lots&&S.lots.some(l=>!l.own)&&S.money>150000){const i=S.lots.findIndex(l=>!l.own);buyLot(i);ex.push(S.day+':lot')}if(L().loanMax&&!S.loan&&S.money<5000){S.loan=10000;S.money+=10000;ex.push(S.day+':loan')}closeModal()}}closeModal();return{lvl:S.lv+1,day:S.day,cured:S.cured,deaths:S.deaths,money:S.money,rep:Math.round(S.rep),pats:S.pats.length,won:S.won,lost:S.lost,staff:S.staff.length,dl:S.dl,ex:ex.join(' '),val:hospValue(),rp:Math.round(S.rp)}},MAXD);
 console.log('L'+(li+1),'build:',built);console.log('   result',JSON.stringify(res));
 await p.evaluate(()=>{closeModal();setSpeed(1);centerCam()});await new Promise(r=>setTimeout(r,800));await p.screenshot({path:'screenshots/L'+(li+1)+'_whole.png'});
 if(li===(LV[LV.length-1])||LV.length===1){await p.evaluate(()=>{const c=S.rooms.find(r=>r.type==='gp')||S.rooms[0];const q=iso(c.x+c.w/2,c.y+c.h/2+3);cam.z=2.1;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z});await new Promise(r=>setTimeout(r,800));await p.screenshot({path:'screenshots/L'+(li+1)+'_closeup.png'})}
}
await p.evaluate(()=>{centerCam();startRoom('ward')});await new Promise(r=>setTimeout(r,300));await p.screenshot({path:'screenshots/04_build_mode.png'});await p.evaluate(()=>gcancel());
await p.tap('#bHire');await new Promise(r=>setTimeout(r,300));await p.screenshot({path:'screenshots/02_hire_panel.png'});await p.evaluate(()=>hidePanel());
const sv=await p.evaluate(()=>{save();const m=S.money,lv=S.lv;S.money=1;load();return{ok:S.money===m&&S.lv===lv,lv:S.lv,prog:JSON.stringify(progress())}});console.log('saveload',JSON.stringify(sv));
await p.touchscreen.touchStart(200,400);await p.touchscreen.touchMove(100,300);await p.touchscreen.touchEnd();
console.log('errors',JSON.stringify(errs));await b.close();process.exit(errs.length?1:0)})();
