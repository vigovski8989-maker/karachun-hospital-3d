// Диагностика заторов L2: при очереди >=12 печатает состояние комнаты/персонала
const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.goto(process.env.URL||'http://localhost:8095/',{waitUntil:'networkidle0'});
const N=+process.env.N||4,LI=+(process.env.LI||1);
for(let k=0;k<N;k++){await p.evaluate(li=>{localStorage.clear();closeModal();newGame(li);closeModal()},LI);await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;return 0'),PLAN);
const r=await p.evaluate(()=>{let ld=-1,rep=[];const snap=[];while(S.day<400&&!S.won&&!S.lost){for(let i=0;i<40;i++)update(.05);if(S.day!==ld){ld=S.day;botBuild();if(window.v12Bot)v12Bot();closeModal();hidePanel();if(S.day%40===0)snap.push(S.day+':$'+S.money+':v'+hospValue()+':c'+S.cured+':L'+(S.v18&&S.v18.left)+':'+S.rooms.filter(r=>r.queue.length>3).map(r=>r.type+r.queue.length+'/'+((S.staff.find(s=>s.id===r.staff)||{state:'NONE'}).state)).join('|')+':st'+S.staff.length+':away'+(S.away||[]).length);
 for(const r of S.rooms)if(r.queue.length>=12&&rep.length<6){const s=S.staff.find(s=>s.id===r.staff);rep.push({d:S.day,room:r.type,q:r.queue.length,busy:r.busy,st:s?s.type+':'+s.state+(s.cover?':cov':'')+':f'+Math.round(s.fat):'none',staff:S.staff.map(s=>s.type[0]+':'+s.state+(s.room?'@'+(S.rooms.find(x=>x.id===s.room)||{}).type:'')).join(' '),m:S.money,left:S.v18&&S.v18.left})}}}
 return{day:S.day,won:S.won,cured:S.cured,deaths:S.deaths,m:S.money,rep:Math.round(S.rep),left:S.v18&&S.v18.left,rooms:S.rooms.map(r=>r.type).join(','),snap,rep2:rep.length}});
console.log(JSON.stringify(r))}await b.close()})();
