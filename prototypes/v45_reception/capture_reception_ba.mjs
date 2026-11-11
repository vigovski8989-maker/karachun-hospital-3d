import {createRequire} from 'module';
const puppeteer=createRequire('/workspace/hospital-game/x.js')('puppeteer-core');
import fs from 'fs';

const OUT='/workspace/hospital-game/screenshots/v45_reception';
fs.mkdirSync(OUT,{recursive:true});

async function capture(url, tag){
  const b=await puppeteer.launch({protocolTimeout:0,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage();
  await p.setViewport({width:1100,height:720});
  p.on('pageerror',e=>console.log('['+tag+' err]',e.message));
  await p.exposeFunction('__shot',async f=>{await p.screenshot({path:f,type:'png'});return 1});
  await p.goto(url,{waitUntil:'domcontentloaded'});
  await p.waitForFunction('window.__ready3d',{timeout:120000});
  const info=await p.evaluate(async()=>{
    eval(await (await fetch('/v38scen.js')).text());
    await new Promise(r=>setTimeout(r,1200));
    startLevel(0);
    await new Promise(r=>setTimeout(r,400));
    const pack=__scen(['reception','gp']);
    try{closeModal()}catch(e){}
    setSpeed(0);
    S.money=999999;
    await new Promise(r=>setTimeout(r,600));
    const r=S.rooms.find(x=>x.type==='reception');
    if(!r)return {ok:false,pack};
    // Hire/ensure receptionist seated if possible
    const st=S.staff.find(s=>s.type==='receptionist');
    if(st&&r.sp&&r.sp.staff){try{takeSeat(st,r.sp.staff);st.state='work';st.room=r.id;r.staff=st.id}catch(e){}}
    // Force a patient at reception patient spot for contextual greet/typing
    let pat=S.pats[0];
    if(!pat){
      // spawn-ish: reuse newGame entities if any; else skip
    }else if(r.sp&&r.sp.patient){
      pat.x=r.sp.patient.x;pat.y=r.sp.patient.y;pat.dir=r.sp.patient.dir??3;pat.state='treat';pat.room=r.id;r.busy=pat.id;r.queue=[];
    }
    for(let i=0;i<20;i++){try{if(typeof tickVs==='function'&&st)tickVs(st,.05)}catch(e){} await new Promise(r=>requestAnimationFrame(r))}
    const cx=r.x+r.w/2, cy=r.y+r.h/2;
    const q=iso(cx,cy);
    // Same framing for before/after
    cam.z=2.85; cam.x=q.x-innerWidth/2/cam.z; cam.y=q.y-innerHeight/2/cam.z-40;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    return {ok:true,pack,room:{x:r.x,y:r.y,w:r.w,h:r.h},items:(r.it||[]).map(t=>t.k),staff:!!st,pat:!!pat,cx,cy,cam:{x:cam.x,y:cam.y,z:cam.z}};
  });
  console.log(tag, JSON.stringify(info));
  if(info&&info.ok){
    await p.screenshot({path:`${OUT}/${tag}.png`,type:'png'});
    // second angle slightly lower / closer for detail
    await p.evaluate(()=>{
      const r=S.rooms.find(x=>x.type==='reception');
      const desk=r.it.find(t=>t.k==='recdesk');
      const q=iso((desk?desk.x:r.x)+1,(desk?desk.y:r.y)+.6);
      cam.z=3.6; cam.x=q.x-innerWidth/2/cam.z; cam.y=q.y-innerHeight/2/cam.z-20;
    });
    await new Promise(r=>setTimeout(r,100));
    await p.screenshot({path:`${OUT}/${tag}_desk.png`,type:'png'});
  }
  await b.close();
  return info;
}

const before=await capture('http://localhost:8129/v38_game/index.html?cap','01_before');
const after=await capture('http://localhost:8129/v45_reception/index.html?cap','02_after');
fs.writeFileSync(`${OUT}/CAPTURE_META.json`,JSON.stringify({before,after,ts:new Date().toISOString()},null,2));
console.log('done', fs.readdirSync(OUT).filter(f=>f.endsWith('.png')));
