(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,2000));
const OUT='/workspace/hospital-game/screenshots/v43_recheck/';
const V=__r3d.camera.position.constructor;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const shot=async n=>{await raf();await __shot(OUT+n+'.png')};
const report={levels:[],global:{},issues:[]};

// Better packer that skips holes
function scenAll(types,lv){
  newGame(lv,true);try{closeModal()}catch(e){}
  S.money=999999;S.unl=S.unl||{};const lk=L().locked;if(lk)for(const k in lk)S.unl[k]=1;
  const bad=[];let x=1,y=1,rowH=0;
  for(const t of types){
    const m=D.rooms[t].min,w=m[0]+2,h=m[1]+2;let placed=null;
    for(let attempt=0;attempt<400&&!placed;attempt++){
      if(x+w>S.w-1){x=1;y+=rowH+2;rowH=0}
      if(y+h>S.h-1){bad.push(t+':nomap');break}
      const g={type:t,x,y,w,h,side:0};const v=validRoom(g);
      if(!v){const r=makeRoom(t,x,y,w,h,0);S.rooms.push(r);placed=r;x+=w+1;rowH=Math.max(rowH,h)}
      else {x+=1}
    }
    if(!placed&&!bad.find(b=>b.startsWith(t+':')))bad.push(t+':fail');
  }
  const need={};for(const r of S.rooms){const s=D.rooms[r.type].staff;if(s)need[s]=(need[s]||0)+1}
  need.handyman=1;need.orderly=(need.orderly||0)+1;
  for(const t in need)for(let i=0;i<need[t];i++)if(S.cands[t]&&S.cands[t].length)hire(t,0);
  invBlk();return {n:S.rooms.length,bad,have:S.rooms.map(r=>r.type)};
}

function ensurePats(n=4){while(S.pats.length<n)spawnPatient();return S.pats.length}

async function bedSeq(rtype){
  const r=S.rooms.find(x=>x.type===rtype);if(!r||!r.sp.patient||r.sp.patient.pose!=='lie')return null;
  const bed=r.it.find(t=>/^bed/.test(t.k));if(!bed)return {ok:false,reason:'no bed item'};
  ensurePats(2);const e=S.pats.find(p=>!p.healed)||S.pats[0];const sp=r.sp.patient;
  e.state='v43test';e.room=null;e.x=sp.x;e.y=sp.y;e.path=[];e.vs=null;await raf();
  const acts=[];takeSeat(e,sp);
  for(let i=0;i<62;i++){tickVs(e,.05);if(i%4===0)await raf();const c=__r3d.CH.get(e.id);if(c&&c.pose)acts.push(c.pose.act)}
  leaveSeat(e);for(let i=0;i<30;i++)tickVs(e,.05)
  const uniq=[...new Set(acts)];
  return {ok:uniq.includes('sitdown')&&(uniq.includes('v43lie')||uniq.includes('lie')),uniq};
}

async function scannerFeet(){
  const r=S.rooms.find(x=>x.type==='diag');if(!r)return null;
  ensurePats(2);const e=S.pats.find(p=>!p.healed)||S.pats[0];const sp=r.sp.patient;
  e.state='v43test';e.room=null;e.x=sp.x;e.y=sp.y;e.path=[];e.vs=null;
  takeSeat(e,sp);for(let i=0;i<55;i++){tickVs(e,.05);if(i%3===0)await raf()}
  const c=__r3d.CH.get(e.id);let minY=1e9;
  for(const bn of['foot_l','foot_r','ball_l','ball_r']){const b=c.b[bn];if(!b)continue;minY=Math.min(minY,b.getWorldPosition(new V()).y)}
  const act=c.pose&&c.pose.act;leaveSeat(e);for(let i=0;i<40;i++){tickVs(e,.05)}
  return {ok:minY>0.15&&minY<1.1,minFootY:+minY.toFixed(3),act};
}

async function sitCheck(kind){
  let sp,seat,lab;
  if(kind==='sofa'){const sr=S.rooms.find(r=>r.type==='staffroom');if(!sr)return null;sp=sr.sp.rest1;seat=sr.it.find(t=>t.k==='sofa');lab='sofa'}
  else if(kind==='chair'){const gp=S.rooms.find(r=>r.type==='gp');if(!gp)return null;sp=gp.sp.patient;seat=gp.it.find(t=>/chair/.test(t.k));lab='chair'}
  else if(kind==='psy'){const r=S.rooms.find(r=>r.type==='psych');if(!r)return null;sp=r.sp.patient;seat=r.it.find(t=>t.k==='sofa');lab='psy'}
  else if(kind==='electro'){const r=S.rooms.find(r=>r.type==='electro');if(!r)return null;sp=r.sp.patient;seat=r.it.find(t=>t.k==='elchair');lab='electro'}
  if(!sp||!seat)return null;
  const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  e.state='v43test';e.room=null;e.x=sp.x;e.y=sp.y+1.4;e.path=[];e.vs=null;await raf();
  const fp=seat.fp||fpOf(seat.k);const x0=seat.x,z0=seat.y,x1=seat.x+fp[0],z1=seat.y+fp[1];
  const bones=['foot_l','foot_r','ball_l','ball_r'];
  const measure=async(frames)=>{let hits=0,maxI=0,n=0;for(let i=0;i<frames;i++){tickVs(e,.05);if(i%3===0)await raf();const c=__r3d.CH.get(e.id);n++;
    for(const bn of bones){const b=c.b[bn];if(!b)continue;const p=b.getWorldPosition(new V());if(p.y>0.3)continue;
      if(p.x>x0+.08&&p.x<x1-.08&&p.z>z0+.08&&p.z<z1-.08){hits++;maxI=Math.max(maxI,Math.min(p.x-x0,x1-p.x,p.z-z0,z1-p.z));break}}}
    return{frames:n,hits,maxCm:+(maxI*100).toFixed(1)}};
  takeSeat(e,sp);const down=await measure(22);
  while(e.vs&&e.vs.ph!=='sat'){tickVs(e,.05)}
  leaveSeat(e);const up=await measure(22);
  return {ok:down.hits===0,lab,down,up,leaveResidual:up.hits,note:up.hits?"leave toe residual known":null};
}

async function pharmacyCheck(){
  const r=S.rooms.find(x=>x.type==='pharmacy');if(!r)return null;
  ensurePats(3);let p=S.pats.find(pp=>!pp.healed)||S.pats[0];
  let s=S.staff.find(ss=>ss.id===r.staff)||S.staff.find(ss=>ss.type==='nurse');
  if(!s)return {ok:false,reason:'no nurse'};
  clearSeat(s);s.vs=null;s.state='work';s.room=r.id;r.staff=s.id;const ssp=spotStaff(r);s.x=ssp.x;s.y=ssp.y;s.path=[];s.dir=ssp.dir??1;
  p.need='pharmacy';p.room=r.id;p.state='treat';p.tT=r_dur(p);p.t=p.tT;p.known=true;p.path=[];p.vs=null;p.x=r.sp.patient.x;p.y=r.sp.patient.y;r.busy=p.id;
  let sawGive=false,sawTalk=false,sawPill=false,maxGive=0;
  const T=p.tT;for(let i=0;i<=20;i++){p.t=T*(1-i/20);p.state='treat';await raf();await wait(25);const c=__r3d.CH.get(s.id);if(!c)continue;
    if(c.pose.act==='give')sawGive=true;if(c.cur==='Idle_Talking_Loop')sawTalk=true;maxGive=Math.max(maxGive,c.giveK||0);if(c.pill&&c.pill.visible)sawPill=true}
  return {ok:sawGive&&!sawTalk&&(maxGive>0.4||sawPill),sawGive,sawTalk,sawPill,maxGive:+maxGive.toFixed(2)};
}

async function labCheck(){
  const r=S.rooms.find(x=>x.type==='lab');if(!r)return null;
  ensurePats(2);let p=S.pats.find(pp=>!pp.healed)||S.pats[0];
  let s=S.staff.find(ss=>ss.id===r.staff)||S.staff.find(ss=>ss.type==='nurse');
  if(!s)return {ok:false,reason:'no nurse'};
  clearSeat(s);s.vs=null;s.state='work';s.room=r.id;r.staff=s.id;const ssp=spotStaff(r);s.x=ssp.x;s.y=ssp.y;s.path=[];
  p.need='lab';p.room=r.id;p.state='treat';p.tT=r_dur(p);p.t=p.tT;p.known=true;p.path=[];p.vs=null;p.x=r.sp.patient.x;p.y=r.sp.patient.y;r.busy=p.id;
  let talk=0,idle=0,treat=0;const T=p.tT;
  for(let i=0;i<16;i++){p.t=T*(1-i/16);await raf();await wait(30);const c=__r3d.CH.get(s.id);if(!c)continue;
    if(c.pose.act==='treat'||c.pose.act==='give')treat++;if(c.cur==='Idle_Talking_Loop')talk++;if(c.cur==='Idle_Loop')idle++}
  return {ok:talk===0&&(idle>0||treat>0),talk,idle,treat};
}

async function mopCheck(){
  ensurePats(2);
  if(!S.staff.some(s=>s.type==='orderly')&&S.cands.orderly)hire('orderly',0);
  if(!S.staff.some(s=>s.type==='handyman')&&S.cands.handyman)hire('handyman',0);
  S.litter.push({x:S.ent.x+2,y:Math.max(1,S.ent.y-3),v:1},{x:S.ent.x+4,y:Math.max(1,S.ent.y-2)});
  setSpeed(3);let mopped=false,minY=1e9,who=null,frames=0;const t0=performance.now();
  while(performance.now()-t0<14000){await wait(120);
    for(const s of S.staff){if(s.type!=='orderly'&&s.type!=='handyman')continue;const c=__r3d.CH.get(s.id);if(!c||c.pose.act!=='mop')continue;
      mopped=true;who=s.type;frames++;const m=c.props&&c.props.mop;if(!m)continue;
      m.traverse(o=>{if(!o.geometry)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
        for(const X of[b.min.x,b.max.x])for(const Y of[b.min.y,b.max.y])for(const Z of[b.min.z,b.max.z])minY=Math.min(minY,new V(X,Y,Z).applyMatrix4(o.matrixWorld).y)})}
    if(mopped&&frames>=4)break}
  setSpeed(0);return {ok:mopped&&minY<0.2,mopped,minY:minY===1e9?null:+minY.toFixed(3),who,frames,v42cl:S.v42cl||0};
}

async function hoseCheck(){
  const r=S.rooms.find(x=>x.type==='pump')||S.rooms.find(x=>x.type==='inflate');if(!r)return null;
  ensurePats(2);let p=S.pats[0];p.dis='balloonhead';p.healed=false;p.room=r.id;p.state='treat';p.need=r.type;p.tT=r_dur(p);p.t=p.tT*0.5;p.x=r.sp.patient.x;p.y=r.sp.patient.y;p.path=[];p.vs=null;r.busy=p.id;
  const old=__r3d.CH.get(p.id);if(old){old.dispose();__r3d.CH.delete(p.id)}
  for(let i=0;i<8;i++)await raf();
  const c=__r3d.CH.get(p.id);const hs=c&&c.headS?c.headS:null;let hose=false;
  for(let i=0;i<12;i++){p.t=p.tT*(0.5-i*0.02);await raf();await wait(30);
    const hd=c.b.Head.getWorldPosition(new V());
    __r3d.scene.traverse(o=>{if(o.visible&&o.isMesh){const wp=new V();o.getWorldPosition(wp);if(wp.distanceTo(hd)<2.5&&o.geometry&&(o.geometry.type||'').includes('Tube'))hose=true}})}
  return {ok:!!(hs&&hs[0]>=1.5),headS:hs,hose,room:r.type};
}

async function curedCheck(){
  ensurePats(2);const p=S.pats[0];p.dis='pixel';p.healed=false;
  let old=__r3d.CH.get(p.id);if(old){old.dispose();__r3d.CH.delete(p.id)}
  for(let i=0;i<5;i++)await raf();
  const before=__r3d.CH.get(p.id);const beforeMummy=before&&before.meshes&&[...before.root.children].length;
  p.healed=true;for(let i=0;i<15;i++)await raf();
  const after=__r3d.CH.get(p.id);
  return {ok:!!(after&&after.healed&&!after.headS),healed:!!(after&&after.healed),noHeadS:!(after&&after.headS)};
}

function staffAssignCheck(){
  const r=S.rooms.find(r=>D.rooms[r.type].staff==='doctor');if(!r)return {ok:false,reason:'no doc room'};
  let s=S.staff.find(s=>s.type==='doctor');if(!s){hire('doctor',0);s=S.staff.find(s=>s.type==='doctor')}
  r.staff=null;s.room=null;s.state='idle';s.path=[];s.vs=null;s.goRest=false;clearSeat(s);
  for(let i=0;i<40;i++)updStaff(s,.25);
  const reclaim=s.room!=null;
  // new room after hire
  const idle=S.staff.find(x=>x.type==='doctor'&&!x.room)||(hire('doctor',0),S.staff.filter(x=>x.type==='doctor').pop());
  idle.state='idle';idle.room=null;idle.path=[];
  const m=D.rooms.gp.min;const w=m[0]+2,h=m[1]+2;let placed=null;
  for(let y=1;y<S.h-h-2&&!placed;y++)for(let x=1;x<S.w-w-2;x++){const g={type:'gp',x,y,w,h,side:0};if(!validRoom(g)){placed=makeRoom('gp',x,y,w,h,0);S.rooms.push(placed);invBlk();break}}
  if(placed){for(let i=0;i<50;i++)updStaff(idle,.25)}
  return {ok:reclaim&&(!placed||idle.room!=null),reclaim,newRoom:placed?idle.room!=null:null};
}

function propsCheck(){
  S.money=999999;ui.v41rot=null;
  let fx=null,fy=null;for(let y=2;y<S.h-3&&fx==null;y++)for(let x=2;x<S.w-3;x++)if(walk(x,y)&&walk(x+1,y)&&!roomAt(x,y)&&!roomAt(x+1,y)){fx=x;fy=y;break}
  if(fx==null)return {ok:false,reason:'no tile'};
  const sig0=sig();const it=placeItem('bench',fx,fy);if(!it)return {ok:false,reason:'place fail'};
  const sig1=sig();
  // auto dir near bottom wall
  let ad=null;for(let x=2;x<S.w-3;x++){const y=S.h-3;if(walk(x,y)&&!roomAt(x,y)){ad=v41AutoDir('bench',x,y);if(ad!=null)break}}
  return {ok:!!it&&sig0!==sig1,sigChanged:sig0!==sig1,dir:it.dir,autoDir:ad};
}

function flushCheck(){
  const e=S.ent;const m=D.rooms.gp.min;const w=m[0]+2,h=m[1]+2;const y=S.h-1-h;const x=Math.max(0,e.x-w-3);
  const g={type:'gp',x,y,w,h,side:0};const bad=validRoom(g);
  let doorOk=null;if(!bad){const t=makeRoom(g.type,g.x,g.y,g.w,g.h,g.side);S.nid--;const o=doorOut(t);doorOk=walk(o.x,o.y)&&!roomAt(o.x,o.y)}
  return {ok:!bad&&doorOk,bad,doorOk};
}

async function restCheck(){
  const sr=S.rooms.find(r=>r.type==='staffroom');if(!sr)return null;
  const e=S.staff.find(s=>s.type==='nurse')||S.staff[0];const sp=restSpot(sr,e);
  e.state='rest';e.fat=10;e.x=sp.x;e.y=sp.y;e.path=[];takeSeat(e,sp);
  for(let i=0;i<35;i++)tickVs(e,.05);await raf();
  const sat=__r3d.CH.get(e.id).pose.act==='sit'||__r3d.CH.get(e.id).pose.act==='sitdown';
  leaveSeat(e);for(let i=0;i<30;i++)tickVs(e,.05)
  const c=__r3d.CH.get(e.id);const sofa=sr.it.find(t=>t.k==='sofa');let outside=true;
  if(sofa){const fp=sofa.fp||fpOf('sofa');const rx=c.root.position.x,rz=c.root.position.z;
    if(rx>sofa.x+.2&&rx<sofa.x+fp[0]-.2&&rz>sofa.y+.2&&rz<sofa.y+fp[1]-.2)outside=false}
  return {ok:sat&&outside,sat,outside};
}

report.global={levelCount:D.levels.length,MONTH_DAYS,DAY,monthOk:MONTH_DAYS===30&&DAY===8,
  names:D.levels.map((l,i)=>i+': '+l.name),
  unlock:D.levels.map((l,i)=>({i,name:l.name,needPrevDone:i>0,roomResearch:l.locked||null,goals:l.goals}))};

const bedTypes=['ward','cardio','surgery','icu','derma','transplant'];
const LEVELS=[4];

for(const lv of LEVELS){
  const Ldef=D.levels[lv];
  // flush-wall on empty map first
  newGame(lv,true);try{closeModal()}catch(e){}S.money=999999;
  const flushEmpty=flushCheck();
  const pack=scenAll(Ldef.rooms,lv);
  closeModal();setSpeed(0);await wait(200);
  ensurePats(5);
  const row={lv,name:Ldef.name,have:pack.have,bad:pack.bad,checks:{}};
  row.checks.month={ok:MONTH_DAYS===30};
  row.checks.flush=Object.assign(flushEmpty,{ok:!!flushEmpty.ok,onEmpty:true});
  row.checks.props=propsCheck();
  row.checks.staff=staffAssignCheck();
  row.checks.goals={ok:!!Ldef.goals&&Ldef.goals.cured>0,goals:Ldef.goals};
  row.checks.sitSofa=await sitCheck('sofa');
  row.checks.sitChair=await sitCheck('chair');
  if(pack.have.includes('psych'))row.checks.sitPsy=await sitCheck('psy');
  if(pack.have.includes('electro'))row.checks.sitElectro=await sitCheck('electro');
  row.checks.beds={};for(const bt of bedTypes)if(pack.have.includes(bt))row.checks.beds[bt]=await bedSeq(bt);
  row.checks.scanner=await scannerFeet();
  row.checks.pharmacy=await pharmacyCheck();
  row.checks.lab=await labCheck();
  row.checks.hose=await hoseCheck();
  row.checks.cured=await curedCheck();
  row.checks.mop=await mopCheck();
  row.checks.rest=await restCheck();

  // shots for key levels
  if(lv===0||lv===5||lv===11){
    const r=S.rooms.find(r=>r.type==='ward')||S.rooms[0];
    if(r){const q=iso(r.x+r.w/2,r.y+r.h/2);cam.z=2.4;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot('L'+lv+'_overview')}
  }
  const flat=[];const walk=(o,p)=>{if(!o||typeof o!=='object')return;if('ok' in o)flat.push([p,o.ok]);else for(const k in o)walk(o[k],p?(p+'.'+k):k)};
  walk(row.checks,'');
  row.pass=flat.filter(x=>x[1]===true).length;row.fail=flat.filter(x=>x[1]===false).length;row.skip=flat.filter(x=>x[1]==null).length;row.flat=flat;
  report.levels.push(row);console.log("RC_LEVEL",JSON.stringify({lv:row.lv,pass:row.pass,fail:row.fail,flat:row.flat,bad:row.bad,have:row.have,checks:row.checks}));
}
return JSON.stringify(report);
})()
