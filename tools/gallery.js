// Галерея комнат: строит по одному кабинету каждого типа, снимает крупные планы (пустые и в работе)
const pp=require('puppeteer-core');const fs=require('fs');const OUT='screenshots/rooms';fs.mkdirSync(OUT,{recursive:true});
const TYPES=(process.env.TYPES||'reception,gp,ward,toilet,staffroom,psych,lab,pharmacy,diag,cardio,surgery,icu,pump').split(',');
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.setViewport({width:700,height:560,deviceScaleFactor:1.5});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());await p.reload({waitUntil:'networkidle0'});
const built=await p.evaluate((TYPES)=>{closeModal();newGame(3,true);closeModal();S.money=1e7;const out={};let cx0=2,cy0=2;
 for(const t of TYPES){const d=D.rooms[t];if(!d)continue;let ok=false;
  for(let y=1;y<S.h-d.min[1]-4&&!ok;y++)for(let x=1;x<S.w-d.min[0]-3&&!ok;x++)for(const side of[2,3,0,1]){const g={type:t,x,y,w:d.min[0]+2,h:d.min[1]+2,side};
   let clear=true;for(let yy=y-1;yy<=y+g.h&&clear;yy++)for(let xx=x-1;xx<=x+g.w;xx++)if(roomAt(xx,yy)){clear=false;break}
   if(!clear||validRoom(g))continue;S.rooms.push(makeRoom(t,x,y,g.w,g.h,side));out[t]=[x,y,g.w,g.h,side];ok=true;break}
  if(!ok)out[t]='FAIL'}
 const need={receptionist:1,doctor:6,nurse:6,handyman:1};for(const t in need)for(let k=0;k<need[t];k++){const c=S.cands[t];hire(t,0)}
 return out},TYPES);console.log(JSON.stringify(built));
const shot=async(name,t,z=2.8)=>{await p.evaluate((t,z)=>{const r=S.rooms.find(r=>r.type===t);if(!r)return;const q=iso(r.x+r.w/2,r.y+r.h/2);cam.z=z;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z+10},t,z);await new Promise(r=>setTimeout(r,250));await p.screenshot({path:OUT+'/'+name+'.png'})};
// дать персоналу дойти и сесть
await p.evaluate(()=>{for(let i=0;i<600;i++)update(.05)});
S_=0;
for(const t of TYPES)await shot(t+'_empty',t);
// спавним пациентов в нужные кабинеты вручную
await p.evaluate(()=>{S.spawnT=1e9});
for(const t of TYPES){const r=await p.evaluate(t=>{const r=S.rooms.find(r=>r.type===t);return!!r},t);if(!r)continue;
 await p.evaluate(t=>{S.pats=[];const rr=S.rooms.find(r=>r.type===t);if(!rr)return;spawnPatient();const q=S.pats[0];q.need=t==='toilet'||t==='staffroom'?'gp':t;q.health=100;q.pat=100;q.dis=L().diseases[0];const o=doorOut(rr);q.x=o.x;q.y=o.y;q.state='seek';q.wcAt=1e9},t);
 let tm=0;const frames=[];
 for(let k=0;k<60;k++){await p.evaluate(()=>{for(let i=0;i<6;i++)update(.05)});const st=await p.evaluate(()=>{const q=S.pats[0];return q?q.state+':'+(q.vs?q.vs.pose+q.vs.ph:''):'-'},0);if(st.startsWith('treat:')&&st.endsWith('sat')||st.startsWith('treat:lie')&&st.includes('sat')||(st.startsWith('treat:')&&!st.includes('down')&&!st.includes('up')&&k>8)){frames.push(st);break}}
 if(t==='toilet'){/*принудительно в туалет*/}
 await shot(t+'_busy',t);
}
console.log('errors',JSON.stringify(errs));await b.close()})();
