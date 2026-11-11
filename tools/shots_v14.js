const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
const W=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.setViewport({width:412,height:915,deviceScaleFactor:2,isMobile:true,hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());
await p.evaluate(()=>{closeModal();newGame(8);closeModal();S.money=400000});
await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;return out'),PLAN);
const focus=async(x,y,z,path)=>{await p.evaluate((x,y,z)=>{closeModal();setSpeed(0);cam.z=z;const c=iso(x,y);cam.x=c.x-innerWidth/2/cam.z;cam.y=c.y-innerHeight/2/cam.z},x,y,z);await W(900);await p.screenshot({path})};
const out={};
// 1. ЧП в очереди регистратуры
out.emg=await p.evaluate(()=>{S.unl=S.unl||{};S.unl.transplant=1;for(let d=0;d<12;d++){botBuild();for(let i=0;i<160;i++)update(.05)}startEmergency();for(let i=0;i<120;i++)update(.05);const r=S.rooms.find(r=>r.type==='reception');return{x:r.x+r.w/2,y:r.y+r.h,q:r.queue.map(id=>(S.pats.find(p=>p.id===id)||{}).emg?1:0).join('')}});
await focus(out.emg.x,out.emg.y,1.5,'screenshots/v14_emergency_queue.png');
out.pick=await p.evaluate(()=>{for(let d=0;d<40;d++){botBuild();for(let i=0;i<160;i++)update(.05)}const ok=p=>{const X=Math.round(p.x),Y=Math.round(p.y);for(let a=-1;a<=3;a++)for(let b=-1;b<=3;b++)if(roomAt(X+a,Y+b))return false;return true};const v=S.pats.find(p=>p.state!=='treat'&&!p.body&&ok(p))||S.pats.find(p=>p.state==='queue');if(!v)return{none:'nopat'};die(v,'shot');for(let i=0;i<3000;i++){update(.05);const o=S.staff.find(s=>s.type==='orderly'&&s.state==='pick');if(o)return{x:o.x,y:o.y,id:o.id}}return{none:S.staff.filter(s=>s.type==='orderly').map(s=>s.state).join()}});
console.log(JSON.stringify(out.pick));if(!out.pick.none){await focus(out.pick.x,out.pick.y,2.4,'screenshots/v14_orderly_pick.png');await p.evaluate(id=>{ui.sel={k:'staff',id};showSel()},out.pick.id);await W(500);await p.screenshot({path:'screenshots/v14_orderly_panel.png'})}
// 2. каталка морга
out.carry=await p.evaluate(()=>{for(let d=0;d<60;d++){botBuild();for(let i=0;i<160;i++)update(.05)}const v=S.pats.find(p=>p.state==='queue');die(v,'shot');for(let i=0;i<3000;i++){update(.05);if(v.body==='carry'&&(roomAt(Math.round(v.x),Math.round(v.y)+1)||{}).type==='morgue'&&(roomAt(Math.round(v.x)+1,Math.round(v.y))||{}).type==='morgue')return{x:v.x,y:v.y}}return null});
if(out.carry)await focus(out.carry.x,out.carry.y,2.2,'screenshots/v14_morgue_gurney.png');
// 3. морг
out.morgue=await p.evaluate(()=>{for(let i=0;i<600;i++)update(.05);const r=S.rooms.find(r=>r.type==='morgue');return{x:r.x+r.w/2,y:r.y+r.h/2,n:S.morgue.length,o:S.organs.length}});
await focus(out.morgue.x,out.morgue.y,2.2,'screenshots/v14_morgue.png');
// 4. трансплантация
out.tx=await p.evaluate(()=>{for(let d=0;d<200;d++){botBuild();v12Bot();for(let i=0;i<160;i++){update(.05);const q=S.pats.find(p=>p.state==='treat'&&p.vs&&p.vs.ph==='sat'&&(S.rooms.find(r=>r.id===p.room)||{}).type==='transplant');if(q)return{x:q.x,y:q.y,day:S.day}}closeModal()}return null});
if(out.tx)await focus(out.tx.x,out.tx.y,2.4,'screenshots/v14_transplant.png');
// 5. новые болезни: маркеры + панель
out.dis=await p.evaluate(()=>{for(let d=0;d<60;d++){for(let i=0;i<160;i++)update(.05);const q=S.pats.find(p=>needOrgan(p)&&p.known&&p.state!=='dead'&&!p.organ);if(q){closeModal();return{x:q.x,y:q.y,id:q.id,dis:q.dis}}}return null});
if(out.dis){await focus(out.dis.x,out.dis.y,2.2,'screenshots/v14_disease_marker.png');await p.evaluate(id=>{ui.sel={k:'pat',id};showSel()},out.dis.id);await W(500);await p.screenshot({path:'screenshots/v14_disease_panel.png'})}
// 6. панель комнат морг/трансплантация
console.log(JSON.stringify({out,errs}));await b.close()})();
