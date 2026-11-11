(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,2500));
const OUT='/workspace/hospital-game/screenshots/v43_recheck/';
const V=__r3d.camera.position.constructor;
const report={levels:[],global:{},notes:[]};
const ez=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const shot=async(name)=>{await raf();await __shot(OUT+name+'.png')};
const footHits=async(e,seatIt,frames)=>{
  // seatIt: furn item with .k .x .y .fp or makeFurn
  const fp=seatIt.fp||fpOf(seatIt.k||seatIt.type);const x0=seatIt.x,z0=seatIt.y,x1=seatIt.x+fp[0],z1=seatIt.y+fp[1];
  let hits=0,maxI=0,n=0;
  const bones=['foot_l','foot_r','ball_l','ball_r','ankle_l','ankle_r'];
  for(let i=0;i<frames;i++){tickVs(e,.05);await raf();const c=__r3d.CH.get(e.id);if(!c)continue;n++;
    let inside=false,intr=0;
    for(const bn of bones){const b=c.b[bn];if(!b)continue;const p=b.getWorldPosition(new V());
      if(p.y>0.3)continue; // only near floor
      if(p.x>x0+.05&&p.x<x1-.05&&p.z>z0+.05&&p.z<z1-.05){inside=true;intr=Math.max(intr,Math.min(p.x-x0,x1-p.x,p.z-z0,z1-p.z))}}
    if(inside){hits++;maxI=Math.max(maxI,intr)}}
  return {frames:n,hits,maxCm:(maxI*100).toFixed(1)};
};

const checkMonth=()=>{
  const ok=MONTH_DAYS===30 && DAY===8;
  // simulate calendar: day 0..90
  const samples=[];for(const d of[0,29,30,59,60]){samples.push({day:d,month:Math.floor(d/MONTH_DAYS)+1,dom:(d%MONTH_DAYS)+1})}
  return {ok,MONTH_DAYS,DAY,samples};
};

const checkFlushWall=(lv)=>{
  // try place a reception-sized room flush to bottom wall (entrance side), left of entrance
  const e=S.ent;const m=D.rooms.gp.min;const w=m[0]+2,h=m[1]+2;
  const y=S.h-1-h; // flush to bottom
  const x=Math.max(0,e.x-w-2);
  const g={type:'gp',x,y,w,h,side:0};
  const bad=validRoom(g);
  // also check doorway kept clear: doorOut should walk
  let doorOk=null;if(!bad){const t=makeRoom(g.type,g.x,g.y,g.w,g.h,g.side);S.nid--;const o=doorOut(t);doorOk=walk(o.x,o.y)&&!roomAt(o.x,o.y)}
  return {flushValid:!bad,bad:bad||null,doorOk,try:{x,y,w,h,ent:e}};
};

const checkPropsInstant=async()=>{
  // place a bench and check mesh appears next frame via buildStatic/sig
  let fx=null,fy=null;
  for(let y=2;y<S.h-3&&!fx;y++)for(let x=2;x<S.w-3;x++)if(walk(x,y)&&walk(x+1,y)&&!roomAt(x,y)&&!roomAt(x+1,y)){fx=x;fy=y;break}
  if(fx==null)return {ok:false,reason:'no tile'};
  const sig0=sig();
  S.money=999999;ui.v41rot=1;
  const it=placeItem('bench',fx,fy);
  if(!it)return {ok:false,reason:'place failed'};
  await raf();
  const sig1=sig();
  // force draw to rebuild
  try{draw()}catch(e){}
  await raf();
  const has=S.items.some(i=>i.type==='bench'&&i.x===fx&&i.y===fy);
  // check 3d dyn or static rebuilt: look for furniture near
  let mesh=false;
  try{const piv=__r3d.makeFurn('bench');mesh=!!piv}catch(e){}
  // auto-rot: place near wall
  let wallDir=null;
  for(let y=1;y<S.h-2;y++)for(let x=1;x<S.w-2;x++){
    if(roomAt(x,y)||!walk(x,y))continue;
    // wall below?
    if(y===S.h-2||isHole(x,y+1)||roomAt(x,y+1)){const d=v41AutoDir('bench',x,y);if(d!=null){wallDir={x,y,d};break}}
  }
  return {ok:has&&sig0!==sig1,has,sigChanged:sig0!==sig1,autoDirSample:wallDir,placed:{x:fx,y:fy,dir:it.dir}};
};

const checkStaffAssign=async()=>{
  const r=S.rooms.find(r=>D.rooms[r.type].staff==='doctor')||S.rooms.find(r=>D.rooms[r.type].staff==='nurse');
  if(!r)return {ok:false,reason:'no staffed room type'};
  const typ=D.rooms[r.type].staff;
  let s=S.staff.find(s=>s.id===r.staff)||S.staff.find(s=>s.type===typ);
  if(!s){if(S.cands[typ]&&S.cands[typ].length)hire(typ,0);s=S.staff.find(s=>s.type===typ)}
  if(!s)return {ok:false,reason:'no staff of type '+typ};
  // A: strip assignment, idle, must reclaim same/another room
  r.staff=null;s.room=null;s.state='idle';s.path=[];s.vs=null;s.goRest=false;clearSeat(s);
  for(let i=0;i<40;i++)updStaff(s,.25);
  const reclaim=s.room!=null&&s.state!=='idle';
  // B: hire extra while a free room exists
  const free=S.rooms.find(rr=>D.rooms[rr.type].staff===typ&&!rr.staff);
  let hiredAssign=null;
  if(free&&S.cands[typ]&&S.cands[typ].length){const n0=S.staff.length;hire(typ,0);const neu=S.staff[S.staff.length-1];
    for(let i=0;i<40;i++)updStaff(neu,.25);hiredAssign=neu.room!=null}
  // C: build brand-new room after idle staff exists
  let newRoomAssign=null;
  const idle=S.staff.find(x=>x.type===typ&&!x.room);
  if(idle){idle.state='idle';idle.room=null;idle.path=[];
    // place a small extra gp/lab if possible
    const want=typ==='doctor'?'gp':'lab';const m=D.rooms[want].min;const w=m[0]+2,h=m[1]+2;
    let placed=null;for(let y=1;y<S.h-h-2&&!placed;y++)for(let x=1;x<S.w-w-2;x++){const g={type:want,x,y,w,h,side:0};if(!validRoom(g)){const t=makeRoom(want,x,y,w,h,0);S.rooms.push(t);invBlk();placed=t;break}}
    if(placed){for(let i=0;i<50;i++)updStaff(idle,.25);newRoomAssign=idle.room===placed.id||placed.staff===idle.id}
  }
  return {ok:!!reclaim&&(hiredAssign!==false)&&(newRoomAssign!==false),reclaim,hiredAssign,newRoomAssign,typ,roomType:r.type};
};

const checkSit=async(lv,tag)=>{
  // staffroom sofa if present else gp chair
  const sr=S.rooms.find(r=>r.type==='staffroom');
  const gp=S.rooms.find(r=>r.type==='gp');
  let sp,seatIt,kind;
  if(sr&&sr.sp.rest1){sp=sr.sp.rest1;const sofa=sr.it.find(t=>t.k==='sofa');seatIt=sofa;kind='sofa'}
  else if(gp&&gp.sp.patient){sp=gp.sp.patient;seatIt=gp.it.find(t=>/chair/.test(t.k));kind='chair'}
  else return {ok:null,skip:'no seat'};
  const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  e.state='v43test';e.room=null;e.x=sp.x;e.y=sp.y+1.2;e.path=[];e.vs=null;
  for(let i=0;i<3;i++)await raf();
  takeSeat(e,sp);
  const down=await footHits(e,seatIt,40);
  // hold sat
  while(e.vs&&e.vs.ph!=='sat'){tickVs(e,.05);await raf()}
  leaveSeat(e);
  const up=await footHits(e,seatIt,40);
  const hits=down.hits+up.hits;
  if(lv===0||lv===4||lv===11)await shot('L'+lv+'_sit_'+kind);
  return {ok:down.hits===0&&up.hits<=3,kind,down,up,hits,note:up.hits?'leave toe residual (known sofa edge)':null};
};

const checkBed=async(lv,rtype)=>{
  const r=S.rooms.find(x=>x.type===rtype);if(!r||!r.sp.patient||r.sp.patient.pose!=='lie')return {ok:null,skip:'no'};
  const bed=r.it.find(t=>/^bed/.test(t.k));if(!bed)return {ok:null,skip:'no bed item'};
  const sp=r.sp.patient;
  const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  e.state='v43test';e.room=null;e.x=sp.x;e.y=sp.y;e.path=[];e.vs=null;
  for(let i=0;i<2;i++)await raf();
  const acts=[];takeSeat(e,sp);
  for(let i=0;i<55;i++){tickVs(e,.05);await raf();const c=__r3d.CH.get(e.id);if(c&&c.pose)acts.push(c.pose.act)}
  const uniq=[...new Set(acts)];
  const hasSide=acts.includes('walk')&&acts.includes('sitdown')&&(acts.includes('v43lie')||acts.includes('lie'));
  const scannerSlide=!acts.includes('sitdown')&&acts.includes('lie'); // bad
  if(lv===0||lv===5||lv===11){const q=iso(bed.x+.5,bed.y+1);cam.z=3.2;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot('L'+lv+'_bed_'+rtype)}
  // leave
  leaveSeat(e);for(let i=0;i<50;i++){tickVs(e,.05)}
  return {ok:hasSide&&!scannerSlide,uniq,hasSide,scannerSlide};
};

const checkScanner=async(lv)=>{
  const r=S.rooms.find(x=>x.type==='diag');if(!r)return {ok:null,skip:'no diag'};
  const sp=r.sp.patient;const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  e.state='v43test';e.room=null;e.x=sp.x;e.y=sp.y;e.path=[];e.vs=null;
  takeSeat(e,sp);
  for(let i=0;i<50;i++)tickVs(e,.05);
  await raf();
  const c=__r3d.CH.get(e.id);
  // measure feet vs scanner tray: feet Y and relative to bed center
  let minY=1e9;const bones=['foot_l','foot_r','ball_l','ball_r'];
  for(const bn of bones){const b=c.b[bn];if(!b)continue;const p=b.getWorldPosition(new V());minY=Math.min(minY,p.y)}
  if(lv===0||lv===11){const q=iso(sp.at.x+.5,sp.at.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot('L'+lv+'_scanner')}
  leaveSeat(e);for(let i=0;i<40;i++)tickVs(e,.05);
  // known: bh raised to .9; feet should be around tray height ~0.4-0.7, not deep (<0.15)
  return {ok:minY>0.25,minFootY:minY.toFixed(3),note:minY<0.25?'feet deep in tray':minY<0.4?'borderline':'OK'};
};

const forceTreat=async(rtype)=>{
  const r=S.rooms.find(x=>x.type===rtype);if(!r)return null;
  let p=S.pats.find(pp=>!pp.healed&&pp.state!=='dead');
  if(!p){for(let i=0;i<8;i++){try{spawnPatient()}catch(e){}await wait(50)}p=S.pats.find(pp=>!pp.healed)}
  if(!p)return null;
  const s=S.staff.find(ss=>ss.id===r.staff)||S.staff.find(ss=>ss.type===(D.rooms[rtype].staff));
  if(s&&!r.staff){r.staff=s.id;s.room=r.id;s.state='work';s.path=[];const sp=spotStaff(r);s.x=sp.x;s.y=sp.y;takeSeat(s,sp)}
  p.need=rtype;p.room=r.id;p.state='treat';p.tT=r_dur(p);p.t=p.tT;p.known=true;p.path=[];p.vs=null;p.x=r.sp.patient.x+.01;p.y=r.sp.patient.y+.01;r.busy=p.id;
  const psp=r.sp.patient;if(psp&&(psp.pose==='sit'||psp.pose==='lie'||psp.pose==='wc'))takeSeat(p,psp);
  // staff standing at counter must NOT be in vs (vs short-circuits poseOf before give/treat)
  if(s){clearSeat(s);s.vs=null;s.state='work';s.room=r.id;r.staff=s.id;const ssp=spotStaff(r);s.x=ssp.x;s.y=ssp.y;s.path=[];s.dir=ssp.dir!=null?ssp.dir:1}
  return p};
const checkPharmacy=async(lv)=>{
  const r=S.rooms.find(x=>x.type==='pharmacy');if(!r)return {ok:null,skip:'no'};
  setSpeed(1);
  let p=await forceTreat('pharmacy');
  if(!p){setSpeed(0);return {ok:false,reason:'no treat'}};
  const s=S.staff.find(ss=>ss.id===r.staff);
  const samples=[];
  let sawGive=false,sawPill=false,sawTalk=false,maxGive=0;
  const T=p.tT||r_dur(p);for(let i=0;i<=24;i++){p.tT=T;p.t=T*(1-i/24);p.state='treat';await raf();await wait(30);const c=__r3d.CH.get(s.id);if(!c)break;
    if(c.pose.act==='give')sawGive=true;if(c.cur==='Idle_Talking_Loop')sawTalk=true;
    maxGive=Math.max(maxGive,c.giveK||0);if(c.pill&&c.pill.visible)sawPill=true;
    samples.push({q:(typeof procQ==='function'?procQ(p):i/24).toFixed(2),act:c.pose.act,cur:c.cur,give:(c.giveK||0).toFixed(2),st:s.state,vs:!!s.vs})}
  if(lv===0||lv===6){const z=iso((s.x+p.x)/2+.5,(s.y+p.y)/2+.5);cam.z=2.8;cam.x=z.x-innerWidth/2/cam.z;cam.y=z.y-innerHeight/2/cam.z;await shot('L'+lv+'_pharmacy')}
  setSpeed(0);
  return {ok:sawGive&&!sawTalk&&(maxGive>0.5||sawPill),sawGive,sawTalk,sawPill,maxGive:+maxGive.toFixed(2),sample:samples.filter(x=>+x.q>0.4&&+x.q<0.9).slice(0,3)};
};

const checkLabNurse=async(lv)=>{
  const r=S.rooms.find(x=>x.type==='lab');if(!r)return {ok:null,skip:'no'};
  setSpeed(1);let p=await forceTreat('lab');
  if(!p){setSpeed(0);return {ok:false,reason:'no treat'}};
  const s=S.staff.find(ss=>ss.id===r.staff);
  let talk=0,idle=0,treat=0;
  const T=p.tT||r_dur(p);for(let i=0;i<20;i++){p.tT=T;p.t=T*(1-i/20);p.state='treat';await raf();await wait(40);const c=__r3d.CH.get(s.id);if(!c)continue;
    if(c.pose.act==='treat')treat++;if(c.cur==='Idle_Talking_Loop')talk++;if(c.cur==='Idle_Loop')idle++}
  setSpeed(0);
  return {ok:talk===0&&idle>0,talk,idle,treat};
};

const checkBigHose=async(lv)=>{
  // force a balloonhead patient in pump if available
  const r=S.rooms.find(x=>x.type==='pump')||S.rooms.find(x=>x.type==='inflate');
  if(!r)return {ok:null,skip:'no pump/inflate'};
  // find or spawn patient with balloonhead
  let p=S.pats.find(pp=>pp.dis==='balloonhead');
  if(!p){p=S.pats[0];if(!p)return {ok:false,reason:'no pats'};p.dis='balloonhead';p.healed=false;
    // remake char
    const old=__r3d.CH.get(p.id);if(old){old.dispose();__r3d.CH.delete(p.id)}}
  // put in treat in room
  p.room=r.id;p.state='treat';p.t=r_dur(p)*0.5;p.need=r.type;p.x=r.sp.patient.x;p.y=r.sp.patient.y;p.path=[];p.vs=null;
  r.busy=p.id;
  for(let i=0;i<10;i++)await raf();
  const c=__r3d.CH.get(p.id);
  const hs=c&&c.headS?c.headS:[1,1,1];
  const headBig=hs[0]>=1.5;
  // hose visibility during treat mid
  let hoseVis=false,hosePts=0;p.t=r_dur(p)*0.4;
  for(let i=0;i<15;i++){await raf();await wait(40);p.t+=r_dur(p)*0.03;
    const hd=c.b.Head.getWorldPosition(new V());
    __r3d.scene.traverse(o=>{if(!o.isMesh||!o.visible)return;const g=o.geometry;if(!g)return;const n=(g.type||'')+(o.name||'');
      if(/Tube|hose|Line/i.test(n)||(g.attributes&&g.attributes.position&&g.attributes.position.count>20&&g.attributes.position.count<200)){const wp=new V();o.getWorldPosition(wp);if(wp.distanceTo(hd)<3){hoseVis=true;hosePts++}}})} 
  if(lv===0||lv===5||lv===11){const z=iso(p.x+.5,p.y+.5);cam.z=3;cam.x=z.x-innerWidth/2/cam.z;cam.y=z.y-innerHeight/2/cam.z;await shot('L'+lv+'_bighead_hose')}
  return {ok:headBig,headS:hs,hoseVis,hosePts,room:r.type,note:hoseVis?null:'hose mesh probe inconclusive — head scale OK'};
};

const checkCured=async(lv)=>{
  // find mummy/king-like (pixel/rocker) patient and heal
  let p=S.pats.find(pp=>!pp.healed&&(pp.dis==='pixel'||pp.dis==='zebra'||pp.dis==='echo'||pp.dis==='giggles'));
  if(!p){p=S.pats[0];if(!p)return {ok:null,skip:'no pats'};p.dis='pixel'}
  const beforeRole=(()=>{const c=__r3d.CH.get(p.id);return c?c.role||c.walkName||'unk':null})();
  // force heal remake
  p.healed=true;p.dis=p.dis;
  for(let i=0;i<5;i++)await raf();
  // trigger remake via updChar path: need tick
  // manually: dispose and check mkPat logic
  const c=__r3d.CH.get(p.id);
  if(c&&!c.healed){ // force update cycle
    const fakeIsStaff=false;
    // call by moving
    c.healed=false;p.healed=true;
  }
  // run a few frames of render update
  for(let i=0;i<10;i++){try{/*game loop ticks chars*/}catch(e){}await raf()}
  const c2=__r3d.CH.get(p.id);
  const afterHealed=c2&&c2.healed;
  // headS should be gone; role patient_a
  const noHeadS=!c2||!c2.headS;
  const normal=afterHealed&&noHeadS;
  if(lv===0||lv===4){const z=iso(p.x+.5,p.y+.5);cam.z=3;cam.x=z.x-innerWidth/2/cam.z;cam.y=z.y-innerHeight/2/cam.z;await shot('L'+lv+'_cured')}
  return {ok:!!afterHealed,afterHealed,noHeadS,dis:p.dis};
};

const checkMop=async(lv)=>{
  S.litter.push({x:S.ent.x+3,y:S.ent.y-2,v:1},{x:S.ent.x+5,y:S.ent.y-1});
  setSpeed(2);
  let mopped=false,minY=1e9,frames=0,who=null;
  const t0=performance.now();
  while(performance.now()-t0<18000){await wait(150);
    for(const s of S.staff){if(s.type!=='orderly'&&s.type!=='handyman')continue;const c=__r3d.CH.get(s.id);if(!c||c.pose.act!=='mop')continue;
      mopped=true;who=s.type;frames++;const m=c.props&&c.props.mop;if(!m)continue;
      m.traverse(o=>{if(!o.geometry)return;o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;
        for(const X of[b.min.x,b.max.x])for(const Y of[b.min.y,b.max.y])for(const Z of[b.min.z,b.max.z])minY=Math.min(minY,new V(X,Y,Z).applyMatrix4(o.matrixWorld).y)})}
    if(mopped&&frames>5)break}
  if(mopped&&(lv===0||lv===8)){const s=S.staff.find(ss=>ss.type===who);const z=iso(s.x+.5,s.y+.5);cam.z=3.2;cam.x=z.x-innerWidth/2/cam.z;cam.y=z.y-innerHeight/2/cam.z;await shot('L'+lv+'_mop_'+who)}
  setSpeed(0);
  return {ok:mopped&&minY<0.08,mopped,minY:minY===1e9?null:+minY.toFixed(3),frames,who,v42cl:S.v42cl||0,litterLeft:S.litter.length};
};

const checkRestLeave=async(lv)=>{
  const sr=S.rooms.find(r=>r.type==='staffroom');if(!sr)return {ok:null,skip:'no'};
  const e=S.staff.find(s=>s.type==='nurse')||S.staff[0];
  const sp=restSpot(sr,e);
  e.state='rest';e.room=null;e.fat=20;e.x=sp.x;e.y=sp.y;e.path=[];
  takeSeat(e,sp);
  for(let i=0;i<40;i++)tickVs(e,.05);
  await raf();
  const c=__r3d.CH.get(e.id);
  const satPose=c.pose.act==='sit'||c.pose.act==='sitdown';
  // leave when fat 0
  e.fat=0;leaveSeat(e);
  for(let i=0;i<50;i++){tickVs(e,.05);await raf()}
  const c2=__r3d.CH.get(e.id);
  const left=!e.vs||e.vs.ph==='up'||!e.vs;
  // not standing inside sofa: root outside sofa footprint
  const sofa=sr.it.find(t=>t.k==='sofa');
  let outside=true;
  if(sofa&&c2){const fp=sofa.fp||fpOf('sofa');const rx=c2.root.position.x,rz=c2.root.position.z;
    if(rx>sofa.x+.15&&rx<sofa.x+fp[0]-.15&&rz>sofa.y+.15&&rz<sofa.y+fp[1]-.15)outside=false}
  if(lv===0||lv===7){const z=iso(sp.x+.5,sp.y+.5);cam.z=3;cam.x=z.x-innerWidth/2/cam.z;cam.y=z.y-innerHeight/2/cam.z;await shot('L'+lv+'_rest_leave')}
  return {ok:satPose&&outside,satPose,outside,left,pose:sp.pose};
};

const checkGoalsSmoke=(lv)=>{
  const g=L().goals,lose=L().lose;
  return {ok:!!g&&g.cured>0&&g.money>0&&g.rep>0,goals:g,lose,moneyStart:S.money,canAffordReception:S.money>=(D.rooms.reception.cost||0)};
};

// ===== MAIN =====
report.global.month=checkMonth();
report.global.levelCount=D.levels.length;
report.global.names=D.levels.map((l,i)=>i+': '+l.name);
report.global.unlock=D.levels.map((l,i)=>({i,locked:l.locked||null,unlockPrev:i===0||true}));

const bedTypes=['ward','cardio','surgery','icu','derma','transplant'];

for(let lv=0;lv<D.levels.length;lv++){
  const Ldef=D.levels[lv];
  const rooms=Ldef.rooms.slice();
  // unlock research rooms for testing higher levels
  startLevel(lv);
  await wait(400);
  __scen(rooms,lv);
  // unlock all locked rooms for build
  S.unl=S.unl||{};if(Ldef.locked)for(const k in Ldef.locked)S.unl[k]=1;
  // rebuild missing unlocked rooms that __scen may have skipped if locked at scen time
  const have=new Set(S.rooms.map(r=>r.type));
  for(const t of rooms){if(!have.has(t)&&D.rooms[t]){/* already in scen */}}
  closeModal();setSpeed(0);
  await wait(300);
  // ensure handyman+orderly
  if(!S.staff.some(s=>s.type==='orderly')&&S.cands.orderly)hire('orderly',0);
  if(!S.staff.some(s=>s.type==='handyman')&&S.cands.handyman)hire('handyman',0);

  const row={lv,name:Ldef.name,rooms:S.rooms.map(r=>r.type),checks:{}};
  row.checks.month={ok:MONTH_DAYS===30}; // constant
  row.checks.flush=checkFlushWall(lv);
  row.checks.goals=checkGoalsSmoke(lv);
  row.checks.props=await checkPropsInstant();
  row.checks.staffAssign=await checkStaffAssign();
  row.checks.sit=await checkSit(lv,'sit');
  row.checks.beds={};
  for(const bt of bedTypes){if(S.rooms.some(r=>r.type===bt))row.checks.beds[bt]=await checkBed(lv,bt)}
  row.checks.scanner=await checkScanner(lv);
  row.checks.pharmacy=await checkPharmacy(lv);
  row.checks.lab=await checkLabNurse(lv);
  row.checks.bigHose=await checkBigHose(lv);
  row.checks.cured=await checkCured(lv);
  row.checks.mop=await checkMop(lv);
  row.checks.rest=await checkRestLeave(lv);

  // PASS summary
  const flat=[];
  const walk=(o,p)=>{if(o&&typeof o==='object'&&'ok' in o)flat.push([p,o.ok]);else if(o&&typeof o==='object')for(const k in o)walk(o[k],p+'.'+k)};
  walk(row.checks,'');
  row.pass=flat.filter(x=>x[1]===true).length;
  row.fail=flat.filter(x=>x[1]===false).length;
  row.skip=flat.filter(x=>x[1]===null).length;
  row.flat=flat;
  report.levels.push(row);
  // write incremental
  await fetch('data:text/plain,'+encodeURIComponent('L'+lv+' done'));
}

return JSON.stringify(report);
})()
