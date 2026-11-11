import {createRequire} from 'module';
const puppeteer=createRequire('/workspace/hospital-game/x.js')('puppeteer-core');
import fs from 'fs';
import {execSync} from 'child_process';
const OUT='/workspace/hospital-game/screenshots/v45_reception';
const b=await puppeteer.launch({protocolTimeout:0,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-cache']});
const p=await b.newPage();
await p.setViewport({width:1100,height:720});
await p.setCacheEnabled(false);
await p.goto('http://localhost:8129/v45_reception/index.html?cap&review=reception&v=p3ok',{waitUntil:'domcontentloaded'});
await p.waitForFunction('window.__ready3d && window.__reviewReception && window.__reviewReception.room',{timeout:120000});
await new Promise(r=>setTimeout(r,700));

async function setPhase(phase){
  return p.evaluate(async(phase)=>{
    const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const r=S.rooms.find(x=>x.type==='reception');
    const st=S.staff.find(s=>s.type==='receptionist');
    if(!st.vs&&r.sp?.staff)takeSeat(st,r.sp.staff);
    st.vs.ph='sat';st.state='work';st.room=r.id;r.staff=st.id;
    let pat=S.pats[0];
    if(!pat){pat={id:99001,x:r.sp.patient.x,y:r.sp.patient.y,dir:3,state:'gone',room:null,t:12,tT:12,path:[],dis:null};S.pats.push(pat)}
    if(phase==='idle'||phase==='leave'){pat.state='gone';pat.room=null;r.busy=null;r.queue=[]}
    if(phase==='greet'){pat.state='treat';pat.room=r.id;pat.x=r.sp.patient.x;pat.y=r.sp.patient.y;pat.t=11;pat.tT=12;r.busy=pat.id}
    if(phase==='typing'||phase==='room'||phase==='face'||phase==='clip'){pat.state='treat';pat.room=r.id;pat.x=r.sp.patient.x;pat.y=r.sp.patient.y;pat.t=5;pat.tT=12;r.busy=pat.id}
    for(let i=0;i<36;i++){try{tickVs(st,.05)}catch(e){} try{draw()}catch(e){} await raf()}
    const c=__r3d.CH.get(st.id); const V=c.root.position.constructor;
    const desk=r.it.find(t=>t.k==='recdesk');
    window.__holdCam3=false;
    if(phase==='room'){
      const dx=(desk?desk.x:r.x)+1, dy=(desk?desk.y:r.y)+0.55;
      const q=iso(dx,dy+0.8); cam.z=2.7; cam.x=q.x-innerWidth/2/cam.z; cam.y=q.y-innerHeight/2/cam.z-55;
    } else if(phase==='face'){
      const hd=c.b.Head.getWorldPosition(new V());
      const cam3=__r3d.camera; window.__holdCam3=true;
      const dir=new V(1,0.4,0.85).normalize();
      cam3.position.set(hd.x+dir.x*1.8, hd.y+dir.y*1.8, hd.z+dir.z*1.8);
      cam3.lookAt(hd);
      const aspect=innerWidth/innerHeight, viewSize=0.48;
      cam3.left=-viewSize*aspect;cam3.right=viewSize*aspect;cam3.top=viewSize;cam3.bottom=-viewSize;cam3.updateProjectionMatrix();
    } else {
      const dx=(desk?desk.x:r.x)+1, dy=(desk?desk.y:r.y)+0.45;
      const q=iso(dx,dy); cam.z=3.7; cam.x=q.x-innerWidth/2/cam.z; cam.y=q.y-innerHeight/2/cam.z-12;
    }
    for(let i=0;i<6;i++){try{draw()}catch(e){} await raf()}
    c.m.updateMatrixWorld(true);
    const hr=c.b.hand_r.getWorldPosition(new V()), hl=c.b.hand_l.getWorldPosition(new V()), hd=c.b.Head.getWorldPosition(new V());
    return {phase,hrY:+hr.y.toFixed(3),hlY:+hl.y.toFixed(3),headY:+hd.y.toFixed(3),aboveHead:hr.y>hd.y-0.08||hl.y>hd.y-0.08,nearKeys:Math.abs(hr.y-1.02)<0.2,lw:{greet:+(c.lw.greet||0).toFixed(3),deskType:+(c.lw.deskType||0).toFixed(3)},cur:c.cur};
  }, phase);
}

const meta={};
for(const ph of['idle','greet','typing','leave','room','face']){
  meta[ph]=await setPhase(ph);
  console.log(ph, meta[ph]);
  await p.screenshot({path:`${OUT}/04_phase3_${ph}.png`,type:'png'});
}
await p.evaluate(()=>{window.__holdCam3=false});

fs.mkdirSync(`${OUT}/phase3_clip`,{recursive:true});
await setPhase('clip');
for(let i=0;i<16;i++){
  await p.evaluate(async()=>{
    const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    for(let j=0;j<2;j++){try{draw()}catch(e){} await raf()}
  });
  await p.screenshot({path:`${OUT}/phase3_clip/f${String(i).padStart(2,'0')}.png`,type:'png'});
}
try{
  execSync(`ffmpeg -y -framerate 8 -i ${OUT}/phase3_clip/f%02d.png -c:v libvpx-vp9 -b:v 1M -an ${OUT}/04_phase3_typing_clip.webm`,{stdio:'pipe'});
  console.log('webm ok');
}catch(e){console.log('webm skip', e.message.slice(0,120))}

fs.writeFileSync(`${OUT}/PHASE3_HANDS.json`,JSON.stringify({meta,ts:new Date().toISOString()},null,2));
await b.close();
console.log('done');
