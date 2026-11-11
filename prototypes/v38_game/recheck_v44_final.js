(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,1500));
const V=__r3d.camera.position.constructor;
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT='/workspace/hospital-game/screenshots/v44/';
const shot=async n=>{await raf();await __shot(OUT+n+'.png')};
startLevel(0);await wait(400);
__scen(['reception','gp','electro','psych','staffroom']);closeModal();setSpeed(0);await wait(500);
S.money=999999;ui.v41rot=1;

function seatGeom(it,r){
  const k=it.k||it.type,fp=it.fp||fpOf(k),nf=(k in{sofa:1,bench:1}?[2,1]:fp);
  const furn=__r3d.makeFurn(k),Pivot=furn.constructor,pivG=new Pivot();
  const yaw=(typeof placeYaw==='function')?placeYaw(it,r||null):(it.dir!=null?[Math.PI/2,0,-Math.PI/2,Math.PI][it.dir]:0);
  // placeYaw not global — duplicate minimal
  let Y=0;if(it.dir!=null)Y=[Math.PI/2,0,-Math.PI/2,Math.PI][it.dir]??0;
  else if(r){const cx=it.x+fp[0]/2,cy=it.y+fp[1]/2,rx=r.x+r.w/2,ry=r.y+r.h/2;const du=rx-cx,dv=ry-cy;Y=Math.abs(du)>Math.abs(dv)?(du>0?Math.PI/2:-Math.PI/2):(dv>0?0:Math.PI)}
  pivG.position.set(it.x+fp[0]/2,0,it.y+fp[1]/2);pivG.rotation.y=Y;
  furn.position.set(-nf[0]/2,0,-nf[1]/2);pivG.add(furn);__r3d.scene.add(pivG);pivG.updateMatrixWorld(true);
  const solids=[];let seatTop=0;
  pivG.traverse(o=>{if(!o.isMesh||!o.geometry)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
    const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);const sz=bb.getSize(new V());
    if(sz.y<.02)return;solids.push({ymin:bb.min.y,ymax:bb.max.y,xmin:bb.min.x,xmax:bb.max.x,zmin:bb.min.z,zmax:bb.max.z});
    if(sz.y<.22&&sz.x*sz.z>.1&&bb.max.y>0.35&&bb.max.y<.7)seatTop=Math.max(seatTop,bb.max.y)});
  return{pivG,solids,seatTop,yaw:Y};
}
function footSolid(c,solids){let hits=0,maxI=0,under=0;
  for(const bn of['foot_l','foot_r','ball_l','ball_r']){const b=c.b[bn];if(!b)continue;const p=b.getWorldPosition(new V());
    for(const s of solids){if(!(p.x>s.xmin&&p.x<s.xmax&&p.z>s.zmin&&p.z<s.zmax))continue;
      if(p.y<s.ymin-.02){under++;continue}if(p.y<=s.ymax+.02){hits++;maxI=Math.max(maxI,Math.min(p.x-s.xmin,s.xmax-p.x,p.z-s.zmin,s.zmax-p.z))}}}
  return{hits,under,maxCm:+(maxI*100).toFixed(1)}}

async function probe(tag,approach,sp,it,room){
  const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  const yaw=[Math.PI/2,0,-Math.PI/2,Math.PI][sp.dir!=null?sp.dir:1]??0;
  const fx=Math.sin(yaw),fz=Math.cos(yaw),rx=-fz,rz=fx;
  const offs={front:[fx*1.7,fz*1.7],left:[rx*1.5,rz*1.5],behind:[-fx*1.6,-fz*1.6]};
  const o=offs[approach];e.state='fin';e.room=null;e.path=[];e.vs=null;e.x=sp.x+o[0];e.y=sp.y+o[1];
  const c0=__r3d.CH.get(e.id);if(c0)c0.v43vs=null;
  for(let i=0;i<5;i++)await raf();
  const info=seatGeom(it,room);
  takeSeat(e,sp);
  let tele=0,prev=null,downH=0,upH=0,dMax=0,uMax=0;
  const track=()=>{const c=__r3d.CH.get(e.id);if(!c)return null;const r=c.root.position;if(prev&&Math.hypot(r.x-prev[0],r.z-prev[1])>.55)tele++;prev=[r.x,r.z];return c};
  for(let i=0;i<55;i++){tickVs(e,.05);await raf();const c=track();if(!c)continue;const h=footSolid(c,info.solids);if(h.hits){downH++;dMax=Math.max(dMax,h.maxCm)}
    if(i===0||i===49){const q=iso(sp.x+.5,sp.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot('fin_'+tag+'_'+approach+'_down_'+String(i).padStart(2,'0'))}}
  while(e.vs&&e.vs.ph!=='sat'){tickVs(e,.05);await raf();track()}
  for(let i=0;i<14;i++)await raf();
  const c=__r3d.CH.get(e.id);const pel=c.b.pelvis.getWorldPosition(new V());
  const thighY=(c.b.thigh_l.getWorldPosition(new V()).y+c.b.thigh_r.getWorldPosition(new V()).y)/2;
  const sc=[sp.x+.5,info.seatTop,sp.y+.5];
  const horiz=Math.hypot(pel.x-sc[0],pel.z-sc[2]);
  const fwd=(pel.x-sc[0])*fx+(pel.z-sc[2])*fz;
  const pelAbove=pel.y-info.seatTop,thighAbove=thighY-info.seatTop;
  const supportOk=info.seatTop>0&&horiz<.38&&pelAbove>-.05&&pelAbove<.4&&thighAbove>-.1&&thighAbove<.32&&fwd>-.4&&fwd<.2;
  const q=iso(sp.x+.5,sp.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await shot('fin_'+tag+'_'+approach+'_sat');
  leaveSeat(e);
  for(let i=0;i<55;i++){tickVs(e,.05);await raf();const c2=track();if(!c2)continue;const h=footSolid(c2,info.solids);if(h.hits){upH++;uMax=Math.max(uMax,h.maxCm)}
    if(i===0||i===49){const q=iso(sp.x+.5,sp.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot('fin_'+tag+'_'+approach+'_up_'+String(i).padStart(2,'0'))}}
  __r3d.scene.remove(info.pivG);
  return{tag,approach,sk:c.v43sk,supportOk,tele,seatTop:+info.seatTop.toFixed(3),
    pelAbove:+pelAbove.toFixed(3),thighAbove:+thighAbove.toFixed(3),horiz:+horiz.toFixed(3),fwd:+fwd.toFixed(3),
    root:[+c.root.position.x.toFixed(3),+c.root.position.z.toFixed(3)],
    pelvis:[+pel.x.toFixed(3),+pel.y.toFixed(3),+pel.z.toFixed(3)],
    down:{hits:downH,maxCm:dMax},up:{hits:upH,maxCm:uMax},sitF:__r3d.V43.sitF[c.v43sk]};
}
const gp=S.rooms.find(r=>r.type==='gp'),el=S.rooms.find(r=>r.type==='electro'),sr=S.rooms.find(r=>r.type==='staffroom'),psy=S.rooms.find(r=>r.type==='psych');
let bx=null,by=null;for(let y=3;y<S.h-4&&!bx;y++)for(let x=3;x<S.w-5;x++)if([0,1].every(d=>walk(x+d,y)&&!roomAt(x+d,y))){bx=x;by=y;break}
ui.v41rot=1;placeItem('bench',bx,by);
const gpCh=gp.it.find(t=>t.x===gp.sp.patient.x&&t.y===gp.sp.patient.y);
const cases=[
  ['chair','front',gp.sp.patient,gpCh,gp],['chair','behind',gp.sp.patient,gpCh,gp],
  ['electro','front',el.sp.patient,el.it.find(t=>t.k==='elchair'),el],
  ['electro','behind',el.sp.patient,el.it.find(t=>t.k==='elchair'),el],
  ['electro','left',el.sp.patient,el.it.find(t=>t.k==='elchair'),el],
  ['sofa','front',sr.sp.rest1,sr.it.find(t=>t.k==='sofa'),sr],
  ['sofa','behind',sr.sp.rest1,sr.it.find(t=>t.k==='sofa'),sr],
  ['psy','front',psy.sp.patient,psy.it.find(t=>t.k==='sofa'),psy],
  ['bench','front',{x:bx,y:by,pose:'sit',dir:1,seat:'bench'},{k:'bench',x:bx,y:by,fp:fpOf('bench')},null],
  ['bench','left',{x:bx,y:by,pose:'sit',dir:1,seat:'bench'},{k:'bench',x:bx,y:by,fp:fpOf('bench')},null],
];
const out={sitF:__r3d.V43.sitF,SEATH:__r3d.SEATH,cases:[]};
for(const c of cases)out.cases.push(await probe(...c));
out.supportFails=out.cases.filter(c=>!c.supportOk).map(c=>`${c.tag}:${c.approach} fwd=${c.fwd} pelA=${c.pelAbove} horiz=${c.horiz}`);
out.teleFails=out.cases.filter(c=>c.tele>0).map(c=>`${c.tag}:${c.approach}:${c.tele}`);
out.allOk=out.cases.every(c=>c.supportOk&&c.tele===0);
return JSON.stringify(out);
})()
