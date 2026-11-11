// Диагностика: какие очереди не рассасываются и почему (L8/L12)
const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});
for(const li of [7,11]){await p.evaluate(li=>{closeModal();newGame(li);closeModal()},li);await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;return out'),PLAN);
const r=await p.evaluate(()=>{const log=[];let ld=0;while(S.day<400&&!S.won&&!S.lost){for(let i=0;i<40;i++)update(.05);if(S.day!==ld){ld=S.day;botBuild();closeModal();
 for(const r of S.rooms)if(r.queue.length>=8){const s=S.staff.find(s=>s.id===r.staff);log.push(S.day+' '+r.type+' q'+r.queue.length+' staff:'+(s?s.state+'/fat'+Math.round(s.fat):'NONE')+' busy:'+r.busy+' cond:'+Math.round(r.cond||0))}
 const orphan=S.staff.filter(s=>s.type!=='handyman'&&!s.room&&s.state==='idle');if(orphan.length)log.push(S.day+' orphan '+orphan.map(s=>s.type).join())}}
 return log.filter((x,i)=>i%5===0).slice(0,40)});console.log('L'+(li+1));console.log(r.join('\n'))}
await b.close()})();
