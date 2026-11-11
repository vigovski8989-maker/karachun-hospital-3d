// v21: кадры процедур по комнатам. env: TAG, ROOMS (через запятую), PH (список прогрессов 0..1), OUT
const pp=require('puppeteer-core');const fs=require('fs');const URL=process.env.URL||'http://localhost:8095/',TAG=process.env.TAG||'v21',OUT=process.env.OUT||'screenshots';
const ROOMS=(process.env.ROOMS||'').split(',').filter(Boolean),PH=(process.env.PH||'0.5').split(',').map(Number);
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:640,height:520,deviceScaleFactor:1});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(()=>{localStorage.clear();localStorage.setItem('karachun_gfx','high')});await p.reload({waitUntil:'networkidle0'});
 await p.evaluate(()=>{closeModal();newGame(0);closeModal();setSpeed(0);const s=document.createElement('style');s.textContent='#tut,#splash,#tutbar{display:none!important}';document.head.appendChild(s)});await new Promise(r=>setTimeout(r,1500));
 const list=ROOMS.length?ROOMS:await p.evaluate(()=>Object.keys(D.rooms));
 for(const rt of list){for(const ph of PH){
  const ok=await p.evaluate((rt,ph)=>{S.rooms=[];S.staff=[];S.pats=[];S.items=[];const d=D.rooms[rt];const w=Math.max(d.min[0],4),h=Math.max(d.min[1],4);let r;for(const [ww,hh] of [[w,h],[w+1,h],[w,h+1],[w+1,h+1],[5,5],[6,5],[5,6],[6,6]]){for(const sd of [0,1,2,3]){r=makeRoom(rt,3,3,ww,hh,sd);if(!r.bad)break}if(!r.bad)break}if(r.bad)return'bad';S.rooms.push(r);if(typeof invBlk==='function')invBlk();
   const st=d.staff||'doctor';const s={id:S.nid++,type:st,name:'x',skill:80,salary:1,x:0,y:0,path:[],state:'work',room:r.id,fat:0,task:null,t:0};const ss=spotStaff(r);s.x=ss.x;s.y=ss.y;s.dir=ss.dir??1;S.staff.push(s);r.staff=s.id;if(ss.pose&&ss.pose!=='stand'){takeSeat(s,ss);s.vs.ph='sat'}
   const dz=Object.keys(D.dis).find(k=>D.dis[k].cure===rt)||Object.keys(D.dis)[0];
   const pt={id:S.nid++,name:'y',dis:dz,x:0,y:0,path:[],state:'treat',need:rt,health:100,pat:100,cert:1,known:true,wait:0,room:r.id,t:10,tT:10,thought:null,hue:30,wcDone:true,wcAt:999};const sp=spotPatient(r);pt.x=sp.x;pt.y=sp.y;pt.dir=sp.dir??1;S.pats.push(pt);r.busy=pt.id;r.queue=[pt.id];takeSeat(pt,sp);
   if(pt.vs){pt.vs.ph=ph<0?'down':'sat';pt.vs.t=ph<0?(-ph)*(SEAT_T[pt.vs.pose]||1):9}pt.t=10*(1-Math.max(0,ph));
   if(typeof v21Tick==='function')v21Tick(0);
   const c=iso(r.x+r.w/2,r.y+r.h/2);cam.z=2.2;cam.x=c.x-innerWidth/2/cam.z;cam.y=c.y-40-innerHeight/2/cam.z;return'ok'},rt,ph);
  await new Promise(r=>setTimeout(r,250));if(ok!=='ok'){console.log(rt,ok);continue}
  const f=`${OUT}/${TAG}_${rt}_${String(Math.round(ph*100)).replace('-','m')}.jpg`;await p.screenshot({path:f,type:'jpeg',quality:80});console.log(f)}}
 console.log('errs',errs.slice(0,5));await b.close()})();
