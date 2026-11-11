// v18: терпение пациентов, уход «не дождавшись», влияние рейтинга/уюта + скриншоты
const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
const URL=process.env.URL||'http://localhost:8095/';const LI=+(process.env.LI||1),DAYS=+(process.env.DAYS||90);
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.setViewport({width:412,height:860,deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());await p.reload({waitUntil:'networkidle0'});
await p.evaluate(li=>{closeModal();newGame(li);closeModal()},LI);
await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;botBuild();hire("handyman",0);return out'),PLAN);
const res=await p.evaluate(days=>{while(S.day<days&&!S.won&&!S.lost){for(let i=0;i<40;i++)update(.05);if(S.day!==S._ld){S._ld=S.day;botBuild();if(window.v12Bot)v12Bot();closeModal();hidePanel()}}
 const fake={id:-1,x:S.ent.x,y:S.ent.y-2,room:null,wt:0,pat:100};const r={};
 for(const rk of[1,3,5]){S.v18.rd=S.day;S.v18.rk=rk;r['rate_rank'+rk]=+patRate(Object.assign({},fake),0,0).toFixed(3)}
 S.v18.rd=S.day;S.v18.rk=3;r.rate_comfort0=+patRate(Object.assign({},fake),0,0).toFixed(3);r.rate_comfort8=+patRate(Object.assign({},fake),8,0).toFixed(3);
 r.rate_wait300=+patRate(Object.assign({},fake,{wt:300}),0,0).toFixed(3);S.v18.rd=-1;
 r.crowdK_now=crowdK();return Object.assign(r,{day:S.day,cured:S.cured,left:S.v18.left,lost:S.v18.lost,moved:S.v18.moved,rank:myRank()})},DAYS);
console.log(JSON.stringify(res,null,1));
const shot=async(n,fn)=>{await p.evaluate(fn);await new Promise(r=>setTimeout(r,700));await p.screenshot({path:'screenshots/v18_'+n+'.png'})};
const cam_=`const q=iso(e.x,e.y);cam.z=2.6;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight*0.3/cam.z;`;
// пациент с низким терпением — карточка
await shot('patient_card',`(()=>{closeModal();hidePanel();setSpeed(1);const e=S.pats.find(p=>p.state==='queue')||S.pats[0];e.pat=27;for(let i=0;i<3;i++)update(.05);${cam_}ui.sel={k:'pat',id:e.id};showSel()})()`);
// злой уход: обнуляем терпение у троих в очереди
const angry=await p.evaluate(()=>{hidePanel();const qs=S.pats.filter(p=>p.state==='queue').slice(0,3);qs.forEach(p=>p.pat=0.01);for(let i=0;i<30;i++)update(.05);return qs.map(p=>p.state+':'+!!p.angry).join(',')});
console.log('angry',angry);
await shot('angry_leave',`(()=>{setSpeed(1);const e=S.pats.find(p=>p.angry&&p.state==='leave');if(e){const q=iso(e.x+.5,e.y+.5);cam.z=2.2;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight*0.45/cam.z-120;}})()`);
await shot('hud_goals','(()=>{setSpeed(1);showGoals()})()');
console.log('errors',JSON.stringify(errs));await b.close();process.exit(errs.length?1:0)})();
