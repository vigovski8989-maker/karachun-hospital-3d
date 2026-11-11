const pp=require('puppeteer-core');const URL=process.env.URL||'http://localhost:8098/';const OUT=process.env.OUT||'/tmp/r24';const W=t=>new Promise(r=>setTimeout(r,t));
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const res={};const errs=[];
 for(const [w,h] of [[320,568],[412,915],[800,360]]){const p=await b.newPage();p.on('pageerror',e=>errs.push(e.message));await p.setViewport({width:w,height:h,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(()=>{localStorage.clear()});await p.reload({waitUntil:'networkidle0'});
  await p.evaluate(()=>{showLevels()});await W(200);await p.evaluate(()=>{[...document.querySelectorAll('#modalc button')].find(e=>e.textContent.includes('Играть')).click()});await W(400);
  await p.evaluate(()=>{closeModal();setSpeed(0);S.money=1e6});
  const r=await p.evaluate(()=>{const o={};for(const t of Object.keys(D.rooms)){startRoom(t);if(!ui.ghost){o[t]='noghost';continue}const a=[];for(const n of [0,1,2]){v24Pre(n);const g=ui.ghost;a.push([g.w-2,g.h-2,v24Cap(t,g.w,g.h),v24Cost(t,g.w,g.h),document.getElementById('v24ok').textContent])}o[t]=a;gcancel()}
   const bb=document.getElementById('build');startRoom('gp');v24Pre(2);const rr=bb.getBoundingClientRect();const ov=[...bb.children].some(e=>{const q=e.getBoundingClientRect();return q.right>innerWidth+1||q.left<-1||e.scrollWidth>e.clientWidth+1});return{o,ov,bh:rr.height}});
  await W(3000);await p.screenshot({path:OUT+'/build_'+w+'.png'});res[w+'x'+h]={ov:r.ov,bh:r.bh};if(w===412)res.table=r.o;await p.close()}
 console.log(JSON.stringify(res));console.log('errs',JSON.stringify(errs));await b.close()})();
