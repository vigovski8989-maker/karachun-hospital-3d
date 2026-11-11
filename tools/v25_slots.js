// v25: кадры кабинетов M/L с параллельными местами. env URL, OUT, TAG, ROOMS, N (2|3)
const pp=require('puppeteer-core');const URL=process.env.URL||'http://localhost:8098/',TAG=process.env.TAG||'v25',OUT=process.env.OUT||'screenshots',N=+(process.env.N||3);
const ROOMS=(process.env.ROOMS||'gp,ward,diag,pharmacy,reception,toilet,psych,xray,surgery,research').split(',');
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:640,height:520});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(()=>{localStorage.clear();localStorage.setItem('karachun_gfx','high')});await p.reload({waitUntil:'networkidle0'});
 await p.evaluate(()=>{closeModal();newGame(0);closeModal();setSpeed(0);const s=document.createElement('style');s.textContent='#tut,#splash,#tutbar{display:none!important}';document.head.appendChild(s)});await new Promise(r=>setTimeout(r,1500));
 for(const rt of ROOMS){const ok=await p.evaluate((rt,N)=>{S.rooms=[];S.staff=[];S.pats=[];S.items=[];const d=D.rooms[rt],m=d.min;let best=null;
   for(let w=m[0]+2;w<=12;w++)for(let h=m[1]+2;h<=12;h++)for(const sd of[0,1])if(v25N(rt,w,h,sd)>=N&&(!best||w*h<best[0]))best=[w*h,w,h,sd];if(!best)return'no '+N;
   const r=makeRoom(rt,3,3,best[1],best[2],best[3]);S.rooms.push(r);v25Split(r,N);if(typeof invBlk==='function')invBlk();
   const dz=Object.keys(D.dis).find(k=>D.dis[k].cure===rt)||Object.keys(D.dis)[0];
   for(const q of v25Group(r)){if(d.staff){const s={id:S.nid++,type:d.staff||'doctor',name:'x',skill:80,salary:1,x:0,y:0,path:[],state:'work',room:q.id,fat:0,task:null,t:0};const ss=spotStaff(q);s.x=ss.x;s.y=ss.y;s.dir=ss.dir??1;S.staff.push(s);q.staff=s.id;if(ss.pose&&ss.pose!=='stand'){takeSeat(s,ss);s.vs.ph='sat'}}
    const pt={id:S.nid++,name:'y',dis:dz,x:0,y:0,path:[],state:'treat',need:rt,health:100,pat:100,cert:1,known:true,wait:0,room:q.id,t:5,tT:10,thought:null,hue:30+q.slot*90,wcDone:true,wcAt:999};const sp=spotPatient(q);pt.x=sp.x;pt.y=sp.y;pt.dir=sp.dir??1;S.pats.push(pt);q.busy=pt.id;q.queue=[pt.id];takeSeat(pt,sp);if(pt.vs){pt.vs.ph='sat';pt.vs.t=9}}
   if(typeof v21Tick==='function')v21Tick(0);if(typeof wallSig!=='undefined')wallSig='';
   const c=iso(r.x+r.w/2,r.y+r.h/2);cam.z=1.7;cam.x=c.x-innerWidth/2/cam.z;cam.y=c.y-40-innerHeight/2/cam.z;return'ok'},rt,N);
  await new Promise(r=>setTimeout(r,300));if(ok!=='ok'){console.log(rt,ok);continue}const f=`${OUT}/${TAG}_${rt}_x${N}.jpg`;await p.screenshot({path:f,type:'jpeg',quality:80});console.log(f)}
 console.log('errs',errs.slice(0,5));await b.close()})();
