const pp=require('puppeteer-core');
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:560,height:460,deviceScaleFactor:1.5});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());await p.reload({waitUntil:'networkidle0'});
const r=await p.evaluate(()=>{closeModal();newGame(0,true);closeModal();S.money=1e7;S.spawnT=1e9;
 const mk=(t,x,y,side)=>{const d=D.rooms[t],g={type:t,x,y,w:d.min[0]+2,h:d.min[1]+2,side};if(validRoom(g))return 0;S.rooms.push(makeRoom(t,x,y,g.w,g.h,side));return 1};
 const ex=S.ent.x;const o=[mk('reception',ex-3,S.h-9,0),mk('gp',ex+2,S.h-9,0)];hire('receptionist',0);hire('doctor',0);
 placeItem('bench',ex-1,S.h-3);placeItem('bench',ex+2,S.h-3);
 for(let i=0;i<500;i++)update(.05);
 for(let k=0;k<5;k++){spawnPatient();const q=S.pats[S.pats.length-1];q.wcDone=true}
 return o.join()+' ent '+ex+','+S.h});console.log(r);
let ok=false;for(let k=0;k<200&&!ok;k++){await p.evaluate(()=>{for(let i=0;i<10;i++)update(.05)});ok=await p.evaluate(()=>S.pats.filter(q=>q.vs&&q.vs.sp.bench&&q.vs.ph==='sat').length>=2)}
await p.evaluate(()=>{for(const el of document.body.children)if(!el.contains(cv)&&el.tagName!=='SCRIPT')el.style.display='none';const q=iso(S.ent.x+.5,S.h-3);cam.z=2.6;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z-30});
await new Promise(r=>setTimeout(r,200));await p.screenshot({path:'screenshots/corridor_bench.png'});console.log('seated',ok);await b.close()})();
