import {createRequire} from 'module';
const puppeteer=createRequire('/workspace/hospital-game/x.js')('puppeteer-core');
import fs from 'fs';
const OUT='/workspace/hospital-game/screenshots/v45_reception';
fs.mkdirSync(OUT,{recursive:true});

const b=await puppeteer.launch({protocolTimeout:0,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();
await p.setViewport({width:1100,height:720});
const errs=[];
p.on('pageerror',e=>errs.push(e.message));
p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8129/v45_reception/index.html?cap&review=reception',{waitUntil:'domcontentloaded'});
await p.waitForFunction('window.__ready3d',{timeout:120000});
await p.waitForFunction('window.__reviewReception && window.__reviewReception.room',{timeout:30000});
await new Promise(r=>setTimeout(r,900));

const meta=await p.evaluate(async()=>{
  const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const r=S.rooms.find(x=>x.type==='reception');
  const st=S.staff.find(s=>s.type==='receptionist');
  const c=st&&__r3d.CH.get(st.id);
  // Ensure typing layer for animation evidence
  if(st){st.state='work';st.room=r.id;if(!st.vs&&r.sp?.staff)takeSeat(st,r.sp.staff);
    // force sat
    if(st.vs){st.vs.ph='sat';st.vs.t=0}
  }
  // patient present triggers write/greet
  let pat=S.pats.find(p=>p.room===r.id)||S.pats[0];
  if(pat){pat.state='treat';pat.room=r.id;r.busy=pat.id;pat.x=r.sp.patient.x;pat.y=r.sp.patient.y}
  for(let i=0;i<40;i++){try{if(st)tickVs(st,.05)}catch(e){} try{draw()}catch(e){} await raf()}
  const desk=r.it.find(t=>t.k==='recdesk');
  const dx=(desk?desk.x:r.x)+1, dy=(desk?desk.y:r.y)+0.55;
  // Same relative framing as phase1 desk-centered room
  let q=iso(dx, dy+0.8);
  cam.z=2.7; cam.x=q.x-innerWidth/2/cam.z; cam.y=q.y-innerHeight/2/cam.z-55;
  await raf();
  const meshVis={};
  if(c){c.m.traverse(x=>{if(x.isMesh&&x.name)meshVis[x.name]=!!x.visible})}
  const act=st&&(window.V26?null:null);
  // probe pose layers
  let pose=null;
  if(c){pose={cur:c.cur, write:c.lw?.write||0, soft:c.soft, hs:c.hs, curlsHidden:meshVis.Hair_Curls===false, buns:meshVis.Hair_Buns}}
  return {items:r.it.map(t=>t.k), pose, meshVis, dx, dy, money:S.money, review:window.__reviewReception};
});
console.log('meta', JSON.stringify(meta,null,2));

await p.screenshot({path:`${OUT}/03_phase2_room.png`,type:'png'});

await p.evaluate(()=>{
  const r=S.rooms.find(x=>x.type==='reception');
  const desk=r.it.find(t=>t.k==='recdesk');
  const dx=(desk?desk.x:r.x)+1, dy=(desk?desk.y:r.y)+0.45;
  const q=iso(dx,dy);
  cam.z=3.85; cam.x=q.x-innerWidth/2/cam.z; cam.y=q.y-innerHeight/2/cam.z-10;
});
await new Promise(r=>setTimeout(r,150));
await p.screenshot({path:`${OUT}/03_phase2_desk.png`,type:'png'});

// Face/interaction close-up from useful side (staff 3/4)
const faceInfo=await p.evaluate(async()=>{
  const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const st=S.staff.find(s=>s.type==='receptionist');
  const c=__r3d.CH.get(st.id);
  if(!c)return {ok:false};
  // Force write/typing layer visible
  c.layer={write:1};c.lw.write=1;
  for(let i=0;i<20;i++){c.t+=.05;c.layers(.05);c.mix.update(.05);c.m.updateMatrixWorld(true);await raf()}
  const head=c.b.Head.getWorldPosition(new THREE.Vector3());
  // Place ortho target near head; nudge cam.x/y via iso of head xz
  const q=iso(head.x, head.z);
  cam.z=6.2; cam.x=q.x-innerWidth/2/cam.z+18; cam.y=q.y-innerHeight/2/cam.z-70;
  await raf();
  return {ok:true, head:[+head.x.toFixed(2),+head.y.toFixed(2),+head.z.toFixed(2)], write:c.lw.write, cur:c.cur};
});
console.log('face', faceInfo);
await p.screenshot({path:`${OUT}/03_phase2_face.png`,type:'png'});

// Animation evidence: two frames of typing hands
await p.evaluate(async()=>{
  const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const st=S.staff.find(s=>s.type==='receptionist');
  const c=__r3d.CH.get(st.id);
  c.layer={write:1};c.lw.write=1;
  const head=c.b.Head.getWorldPosition(new THREE.Vector3());
  const q=iso(head.x, head.z+.15);
  cam.z=5.0; cam.x=q.x-innerWidth/2/cam.z; cam.y=q.y-innerHeight/2/cam.z-40;
  for(let i=0;i<8;i++){c.t+=.08;c.layers(.08);c.mix.update(.08);await raf()}
});
await p.screenshot({path:`${OUT}/03_phase2_typing_a.png`,type:'png'});
await p.evaluate(async()=>{
  const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  const st=S.staff.find(s=>s.type==='receptionist');
  const c=__r3d.CH.get(st.id);
  for(let i=0;i<12;i++){c.t+=.1;c.layers(.1);c.mix.update(.1);await raf()}
});
await p.screenshot({path:`${OUT}/03_phase2_typing_b.png`,type:'png'});

fs.writeFileSync(`${OUT}/PHASE2_META.json`,JSON.stringify({meta,faceInfo,errs,ts:new Date().toISOString()},null,2));
console.log('errs', errs.slice(0,8));
console.log('files', fs.readdirSync(OUT).filter(f=>f.startsWith('03_')));
await b.close();
