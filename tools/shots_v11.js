const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.setViewport({width:412,height:915,deviceScaleFactor:2,isMobile:true,hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());
await p.evaluate(()=>{closeModal();newGame(0);closeModal();setSpeed(0)});await new Promise(r=>setTimeout(r,1200));
await p.screenshot({path:'screenshots/v11_tutorial1.png'});
await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;return out'),PLAN);
await p.evaluate(()=>{for(let d=0;d<6;d++){for(let i=0;i<160;i++)update(.05);}closeModal();S.rooms=S.rooms;setSpeed(0)});
await p.evaluate(()=>{if(S.rooms.length<3){} });await new Promise(r=>setTimeout(r,800));
await p.evaluate(()=>{const s=S.rooms.find(r=>r.type==='reception');})
await p.evaluate(()=>{botBuild();for(let i=0;i<40;i++)update(.05);closeModal();setSpeed(0)});await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:'screenshots/v11_tutorial2.png'});
// уровень 6 с событиями
await p.evaluate(()=>{closeModal();newGame(5);closeModal();S.money=400000});
await p.evaluate(()=>{for(let d=0;d<70;d++){botBuild();for(let i=0;i<160;i++)update(.05);closeModal()}
 S.loan=20000;startEmergency();const ps=S.pats.filter(p=>p.state!=='dead'&&!p.emg).slice(0,3);ps.forEach(p=>p.inf=true);S.epi={until:S.day+5,dis:ps[0].dis};spawnVip();
 for(let i=0;i<60;i++)update(.05);closeModal();setSpeed(0);const v=S.pats.find(p=>p.inf)||S.pats[0];
 });
await p.evaluate(()=>{const e=S.pats.find(p=>p.emg)||S.pats[0];const f=S.pats.find(p=>p.inf&&p.state!=='dead')||e;cam.z=1.6;const c=iso(f.x,f.y);cam.x=c.x-innerWidth/2/cam.z;cam.y=c.y-innerHeight/2/cam.z;msg('🚑 ЧП! Привезли пострадавших — смотрите таймер вверху');});
await new Promise(r=>setTimeout(r,900));await p.screenshot({path:'screenshots/v11_topbar_markers.png'});
// панель пациента с шансом
await p.evaluate(()=>{const e=S.pats.find(p=>p.known&&!p.vip&&p.state!=='dead');ui.sel={k:'pat',id:e.id};showSel()});await new Promise(r=>setTimeout(r,500));
await p.screenshot({path:'screenshots/v11_patient_chance.png'});
console.log(JSON.stringify({errs}));await b.close()})();
