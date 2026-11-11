const pp=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));
const VP=[[320,568],[360,640],[360,800],[393,851],[412,915],[800,360],[915,412],[568,320]];
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const res=[];
for(const [w,h] of VP){const p=await b.newPage();await p.setViewport({width:w,height:h,deviceScaleFactor:2,isMobile:true,hasTouch:true});
await p.goto('http://localhost:8098/',{waitUntil:'networkidle0'});await p.evaluate(()=>{localStorage.clear();localStorage.setItem('hohotun_progress_v1',JSON.stringify({done:[0,1,2,3,4,5,6,7,8,9,10]}))});await p.reload({waitUntil:'networkidle0'});
await p.evaluate(()=>showLevels());await W(400);
await p.screenshot({path:`screenshots/v15_levels_${w}x${h}.png`});
const r=await p.evaluate(async()=>{const c=document.getElementById('modalc');const btns=[...c.querySelectorAll('button[onclick^="startLevel"]')];const out=[];
for(const bt of btns){bt.scrollIntoView({block:'nearest'});await new Promise(r=>setTimeout(r,30));const q=bt.getBoundingClientRect();const el=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2);out.push(el===bt&&q.top>=0&&q.bottom<=innerHeight&&q.left>=0&&q.right<=innerWidth)}
c.scrollTop=0;const t=c.querySelector('h2').getBoundingClientRect();return{n:btns.length,ok:out.filter(Boolean).length,titleTop:t.top,boxTop:c.getBoundingClientRect().top}});
res.push([w+'x'+h,r]);
await p.evaluate(()=>{const c=document.getElementById('modalc');c.scrollTop=c.scrollHeight});await W(200);await p.screenshot({path:`screenshots/v15_levels_${w}x${h}_bottom.png`});await p.close()}
console.log(JSON.stringify(res));await b.close()})();
