// v26: фазы процедуры по комнатам: idle, arrive, start, mid, end, leave. env URL OUT TAG ROOMS SIDES N(слотов)
const pp=require('puppeteer-core');const URL=process.env.URL||'http://localhost:8098/',TAG=process.env.TAG||'v26',OUT=process.env.OUT||'/tmp/ph';
const ROOMS=(process.env.ROOMS||'reception,gp,diag,lab,pharmacy,ward,psych,pump,toilet,cardio,surgery,icu,xray,genetics,electro,reboot,inflate,derma,research,morgue,transplant,paygp,staffroom,library,chief').split(','),SIDES=(process.env.SIDES||'0').split(',').map(Number),N=+(process.env.N||1);
const PH=['idle','arrive','start','mid','end','leave'];
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:480,height:400});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(()=>{localStorage.clear();localStorage.setItem('karachun_gfx','high')});await p.reload({waitUntil:'networkidle0'});
 await p.evaluate(()=>{closeModal();newGame(0);closeModal();setSpeed(0);const s=document.createElement('style');s.textContent='body>*:not(canvas){display:none!important}';document.head.appendChild(s);window._sp=spawnPatient;spawnPatient=function(){}});await new Promise(r=>setTimeout(r,1500));
 const step=(cond,max)=>p.evaluate((cond,max)=>{const f=new Function('p','r','return '+cond);for(let i=0;i<max;i++){const pt=S.pats[0],r=S.rooms[0];if(f(pt,r))return i;update(.05)}return -1},cond,max);
 for(const rt of ROOMS)for(const sd of SIDES){
  const ok=await p.evaluate((rt,sd,N)=>{S.rooms=[];S.staff=[];S.pats=[];S.items=[];S.litter=[];const d=D.rooms[rt],m=d.min;let r=null;
   for(let w=m[0]+2;w<=12&&!r;w++)for(let h=m[1]+2;h<=12&&!r;h++){if(N>1&&v25N(rt,w,h,sd)<N)continue;const t=makeRoom(rt,6,5,w,h,sd);if(!t.bad&&t.sp)r=t}if(!r)return'bad';S.rooms.push(r);if(N>1)v25Split(r,N);invBlk();if(typeof wallSig!=='undefined')wallSig='';
   const g=v25Group(r);
   for(const q of g){const st=d.staff||(rt==='library'?'doctor':null);if(!st||!d.staff)continue;const ss=spotStaff(q);const s={id:S.nid++,type:st,name:'x',skill:80,salary:1,x:ss.x,y:ss.y,path:[],state:'work',room:q.id,fat:0,task:null,t:0,dir:ss.dir??1};S.staff.push(s);q.staff=s.id;if(ss.pose&&ss.pose!=='stand'){takeSeat(s,ss);s.vs.ph='sat';s.vs.t=9}}
   const o=doorOut(r);const dz=Object.keys(D.dis).find(k=>D.dis[k].cure===rt)||Object.keys(D.dis)[0];
   for(let k=0;k<g.length;k++){const pt={id:S.nid++,name:'y',dis:dz,x:o.x,y:o.y+1+k,path:[],state:'seek',need:rt,health:100,pat:100,cert:1,known:true,wait:0,room:null,t:0,thought:null,hue:40+k*90,wcDone:true,wcAt:999,_hold:true};S.pats.push(pt)}
   S.pats.forEach(x=>{x.state='hold'});
   const c=iso(r.x+r.w/2,r.y+r.h/2);cam.z=N>1?1.6:2.1;cam.x=c.x-innerWidth/2/cam.z;cam.y=c.y-30-innerHeight/2/cam.z;for(let i=0;i<20;i++)update(.05);return'ok'},rt,sd,N);
  if(ok!=='ok'){console.log(rt,sd,ok);continue}
  const shot=async ph=>{await new Promise(r=>setTimeout(r,180));await p.screenshot({path:`${OUT}/${TAG}_${rt}_s${sd}${N>1?'_x'+N:''}_${ph}.jpg`,type:'jpeg',quality:72})};
  await shot('idle');
  const isP=await p.evaluate(()=>{const ok=['seek','hold'];S.pats.forEach(x=>x.state='seek');return!!D.rooms[S.rooms[0].type].staff||['toilet'].includes(S.rooms[0].type)});
  if(!isP||['staffroom','library','chief','research','morgue'].includes(rt)){console.log(rt,sd,'idle only');continue}
  let a=await step("p&&p.state==='enter'&&p.path.length<=2",800);await shot('arrive');
  a=await step("p&&p.state==='treat'&&procQ(p)>.15",2000);await shot('start');
  a=await step("p&&p.state==='treat'&&procQ(p)>.5",3000);await shot('mid');
  a=await step("p&&p.state==='treat'&&procQ(p)>.88",3000);await shot('end');
  a=await step("!p||p.state!=='treat'",2000);await step("!p||p.state!=='treat'&&p.path.length<4||true",15);await shot('leave');console.log(rt,sd,a)}
 console.log('errs',errs.slice(0,5));await b.close()})();
