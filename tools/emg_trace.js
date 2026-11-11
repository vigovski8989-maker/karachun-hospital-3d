const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync('/workspace/hospital-game/smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());
await p.evaluate(()=>{closeModal();newGame(3);closeModal();S.money=400000});await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;return out'),PLAN);
const r=await p.evaluate(()=>{botBuild();for(let i=0;i<400*10;i++)update(.05);startEmergency();const ids=S.em.ids.slice();const tr={};const t0=S.day;
 for(let k=0;k<400*12;k++){update(.05);for(const id of ids){const q=S.pats.find(p=>p.id===id);const s=q?q.state+'/'+q.need+'/'+(q.known?1:0)+'/'+Math.round(q.health):'gone';const a=tr[id]=tr[id]||[];if(a[a.length-1]?.[1]!==s)a.push([((S.t/DAY)-t0).toFixed(1),s])}}
 return{tr,em:S.em,cured:S.cured,DAY}});console.log(JSON.stringify(r));await b.close()})();
