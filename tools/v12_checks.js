const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync('/workspace/hospital-game/smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());
const li=+process.argv[2]||8;
await p.evaluate((li)=>{closeModal();newGame(li);closeModal();S.money=400000},li);await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;return out'),PLAN);
const r=await p.evaluate(()=>{const log=[];const om=msg;msg=function(t){if(/морг|орган|Донор|ЧП|скончал|не дожд/i.test(t))log.push(S.day+': '+t);om(t)};S.unl=S.unl||{};S.unl.transplant=1;botBuild();
 let emgOrder=[];let ld=-1;startEmergency();
 while(S.day<160&&!S.won&&!S.lost){for(let i=0;i<400;i++){update(0.05);for(const r of S.rooms)if(r.queue.length>2){const e=r.queue.map(id=>S.pats.find(p=>p.id===id)).map(p=>p&&p.emg?1:0);if(e.includes(1)&&emgOrder.length<6)emgOrder.push(r.type+':'+e.join(''))}}
  if(S.day!==ld){ld=S.day;botBuild();v12Bot();closeModal()}}
 return{day:S.day,won:S.won,lost:S.lost,cured:S.cured,deaths:S.deaths,morgue:S.morgue.length,organs:S.organs.length,txWaiting:S.pats.filter(p=>needOrgan(p)).length,rooms:S.rooms.map(r=>r.type).join(','),log:log.slice(0,40),emgOrder}});
console.log(JSON.stringify(r,null,1));console.log('errs',errs);await b.close()})();
