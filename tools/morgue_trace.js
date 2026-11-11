const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());
await p.evaluate(()=>{closeModal();newGame(8);closeModal();S.money=400000});await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;return out'),PLAN);
const r=await p.evaluate(()=>{S.unl=S.unl||{};S.unl.transplant=1;botBuild();for(let i=0;i<400*12;i++)update(.05);const mr=S.rooms.find(r=>r.type==='morgue');const s=S.staff.find(s=>s.id===mr.staff);
 const out={tx:{ok:0,fail:0}};const om=msg;msg=t=>{if(/вылечен/.test(t)&&/Ленив|Печень|Почк|Лёгк|Желуд|Влюб|Чиха/.test(t))out.tx.ok++;if(/Лечение/.test(t)&&/Ленив|Печень|Почк|Лёгк|Желуд|Влюб|Чиха/.test(t))out.tx.fail++;om(t)};
 const tr=[];const v=S.pats.find(p=>p.state==='queue');die(v,'test');const t0=S.t;
 for(let i=0;i<400*40;i++){update(.05);const st=s.state+'/'+(v.body||'-');if(tr[tr.length-1]?.[1]!==st)tr.push([((S.t-t0)/DAY).toFixed(2),st]);if(!S.pats.includes(v)&&i>400*8)break}
 for(let i=0;i<400*60;i++){update(.05);if(i%400==0)v12Bot()}
 return{tr,s:{fat:s.fat},morgue:S.morgue,organs:S.organs,out,txw:S.pats.filter(p=>needOrgan(p)).map(p=>p.state+(p.organ?'+':'-')+Math.round(p.ow||0)),trm:S.rooms.filter(r=>r.type==="transplant").map(r=>({q:r.queue.length,busy:r.busy,st:(S.staff.find(s=>s.id===r.staff)||{}).state}))}});console.log(JSON.stringify(r));await b.close()})();
