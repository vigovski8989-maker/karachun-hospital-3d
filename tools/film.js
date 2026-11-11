// Съёмка сцен анимации: серия кадров для GIF/ленты. Использование: node tools/film.js <scene>
const pp=require('puppeteer-core');const fs=require('fs');const scene=process.argv[2]||'gp';const OUT='/tmp/film_'+scene;fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const STEP=+process.env.STEP||.35,N=+process.env.N||40,Z=+process.env.Z||2.4;
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.setViewport({width:560,height:460,deviceScaleFactor:1.5});const errs=[];if(process.env.SIDE)await p.evaluateOnNewDocument(s=>{window.__SIDE=+s},process.env.SIDE);p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());await p.reload({waitUntil:'networkidle0'});
const info=await p.evaluate((scene)=>{closeModal();newGame(3,true);closeModal();S.money=1e7;S.spawnT=1e9;
 const mk=(t,x,y,side)=>{const d=D.rooms[t],g={type:t,x,y,w:d.min[0]+2,h:d.min[1]+2,side};if(validRoom(g))return null;const r=makeRoom(t,x,y,g.w,g.h,side);S.rooms.push(r);return r};
 const hireT=(t)=>hire(t,0);
 const room={reception:['reception',2],gp:['gp',2],ward:['ward',2],toilet:['toilet',2],staffroom:['staffroom',0],psych:['psych',3],corridor:['gp',2],repair:['pump',2]}[scene];
 const r=mk(room[0],12,10,window.__SIDE!=null?window.__SIDE:room[1]);const st=D.rooms[room[0]].staff;if(st)hireT(st);
 if(scene==='repair'){hireT('handyman')}
 if(scene==='staffroom'){const rr=mk('gp',16,1,2);hireT('doctor');}
 if(scene==='toilet'){}
 for(let i=0;i<(scene==='staffroom'?700:200);i++)update(.05);
 if(scene==='corridor'||true){const ey=S.ent.y;}
 return{r:[r.x,r.y,r.w,r.h],side:r.side}},scene);
const CY=+process.env.CY||0;const fr=async(i)=>{await p.evaluate(([Z,CY])=>{for(const el of document.body.children)if(!el.contains(cv)&&el.tagName!=='SCRIPT')el.style.display='none';const r=S.rooms[0],q=iso(r.x+r.w/2,r.y+r.h/2);cam.z=Z;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z+CY},[Z,CY]);await new Promise(r=>setTimeout(r,60));await p.screenshot({path:OUT+'/f'+String(i).padStart(3,'0')+'.png'})};
await p.evaluate((scene)=>{
 const r=S.rooms[0];const o=doorOut(r);if(scene==='repair'){for(let i=0;i<10;i++)update(.05)}
 if(scene==='toilet'||scene==='gp'||scene==='ward'||scene==='reception'||scene==='psych'){spawnPatient();const q=S.pats[0];q.dis=L().diseases[1];q.health=q.pat=100;q.x=o.x;q.y=o.y;q.wcAt=1e9;
  if(scene==='toilet'){const tr=r;tr.busy=q.id;q.wcRoom=tr.id;q.state='wc1';q.wcGo=false;q.room=null}
  else{q.need=r.type;q.state='seek';S.pats[0].x=o.x;S.pats[0].y=o.y+2}}
 if(scene==='staffroom'){const s=S.staff[0];s.fat=95;window.__log=[];setInterval(()=>__log.push(s.state),0)}
 if(scene==='repair'){r.cond=20}
},scene);
for(let i=0;i<N;i++){await p.evaluate((STEP)=>{for(let k=0;k<Math.round(STEP/.05);k++)update(.05)},STEP);await fr(i)}
console.log('frames',N,'errors',JSON.stringify(errs),JSON.stringify(info));await b.close()})();
