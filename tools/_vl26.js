// Проверка: для каждого типа кабинета × размеры × 4 стороны двери вся мебель внутри внутренней области, без перекрытий, места достижимы.
const pp=require('puppeteer-core');
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8098/',{waitUntil:'networkidle0'});
const res=await p.evaluate(()=>{closeModal();newGame(0,true);const out={checked:0,rejected:0,violations:[],rejMin:[]};
 for(const t in D.rooms){const d=D.rooms[t];if(!d.layout)continue;
  for(let dw=0;dw<=4;dw++)for(let dh=0;dh<=3;dh++)for(let side=0;side<4;side++){const w=d.min[0]+2+dw,h=d.min[1]+2+dh;S.nid=1000;const r=makeRoom(t,10,10,w,h,side);S.nid=1000;
   if(r.bad){out.rejected++;if(!dw&&!dh)out.rejMin.push(t+' side'+side);continue}out.checked++;const I=inner(r),occ=new Set();
   const fail=m=>out.violations.push(t+' '+w+'x'+h+' side'+side+': '+m);
   for(const it of r.it){for(const[x,y]of tilesOf(it.x,it.y,it.fp)){if(x<I.x||y<I.y||x>=I.x+I.w||y>=I.y+I.h)fail(it.k+' вне комнаты');if(!it.soft){const k=x+','+y;if(occ.has(k))fail('перекрытие '+k);occ.add(k)}}}
   for(const[n,s]of Object.entries(r.sp)){if(s.x<I.x||s.y<I.y||s.x>=I.x+I.w||s.y>=I.y+I.h)fail('spot '+n+' вне');if(s.at&&(s.at.x<I.x||s.at.y<I.y))fail('lie at вне')}
   const di=doorInner(r);if(occ.has(di.x+','+di.y))fail('занят проход у двери')}}
 return out});
console.log(JSON.stringify({checked:res.checked,rejected:res.rejected,rejectedAtMinSize:res.rejMin,violations:res.violations.length,first:res.violations.slice(0,10),errs}));
await b.close();process.exit(res.violations.length||errs.length?1:0)})();
