(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,1500));
const V=__r3d.camera.position.constructor;
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT='/workspace/hospital-game/screenshots/v44/';
const shot=async n=>{await raf();await __shot(OUT+n+'.png')};
startLevel(0);await wait(400);
__scen(['reception','gp','electro','psych','staffroom','diag']);closeModal();setSpeed(0);await wait(500);
S.money=999999;ui.v41rot=1;

function seatGeom(it,r){
  const k=it.k||it.type,fp=it.fp||fpOf(k);
  const nf=(k in{sofa:1,bench:1}?[2,1]:fp);
  const furn=__r3d.makeFurn(k);
  const Pivot=furn.constructor;
  const pivG=new Pivot();
  const yaw=(typeof placeYaw==='function')?placeYaw(it,r||null):0;
  const px=it.x+fp[0]/2,pz=it.y+fp[1]/2;
  pivG.position.set(px,0,pz);pivG.rotation.y=yaw;
  furn.position.set(-nf[0]/2,0,-nf[1]/2);
  pivG.add(furn);__r3d.scene.add(pivG);pivG.updateMatrixWorld(true);
  const solids=[];let seatTop=0,sc=null;
  pivG.traverse(o=>{
    if(!o.isMesh||!o.geometry)return;
    if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
    const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
    const sz=bb.getSize(new V());
    if(sz.y<.02)return;
    solids.push({ymin:bb.min.y,ymax:bb.max.y,xmin:bb.min.x,xmax:bb.max.x,zmin:bb.min.z,zmax:bb.max.z,area:sz.x*sz.z,h:sz.y});
    if(sz.y<.22&&sz.x*sz.z>.1&&bb.max.y>0.35&&bb.max.y<0.7){
      if(bb.max.y>=seatTop){seatTop=bb.max.y;sc=bb.getCenter(new V());sc.y=bb.max.y}
    }
  });
  if(!seatTop){for(const s of solids){if(s.h<.35&&s.area>.08&&s.ymax<0.85&&s.ymax>seatTop)seatTop=s.ymax}}
  if(!sc)sc=new V(px,seatTop,pz);
  return{pivG,solids,seatTop,seatCenter:[+sc.x.toFixed(3),+sc.y.toFixed(3),+sc.z.toFixed(3)],yaw,px,pz};
}
function footSolid(c,solids){
  let hits=0,maxI=0,under=0;
  for(const bn of['foot_l','foot_r','ball_l','ball_r']){
    const b=c.b[bn];if(!b)continue;const p=b.getWorldPosition(new V());
    for(const s of solids){
      if(!(p.x>s.xmin&&p.x<s.xmax&&p.z>s.zmin&&p.z<s.zmax))continue;
      if(p.y<s.ymin-0.02){under++;continue}
      if(p.y<=s.ymax+0.02){hits++;maxI=Math.max(maxI,Math.min(p.x-s.xmin,s.xmax-p.x,p.z-s.zmin,s.zmax-p.z))}
    }
  }
  return{hits,under,maxCm:+(maxI*100).toFixed(1)};
}
async function probe(tag,approach,sp,it,room){
  const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  const yaw=[Math.PI/2,0,-Math.PI/2,Math.PI][sp.dir!=null?sp.dir:1]??0;
  const fx=Math.sin(yaw),fz=Math.cos(yaw),rx=-fz,rz=fx;
  const offs={front:[fx*1.7,fz*1.7],left:[rx*1.5,rz*1.5],right:[-rx*1.5,-rz*1.5],behind:[-fx*1.6,-fz*1.6]};
  const o=offs[approach]||offs.front;
  e.state='geom';e.room=null;e.path=[];e.vs=null;e.x=sp.x+o[0];e.y=sp.y+o[1];
  for(let i=0;i<6;i++)await raf();
  const info=seatGeom(it,room);
  takeSeat(e,sp);
  let tele=0,prev=null,downH=0,upH=0,dMax=0,uMax=0,downU=0,upU=0;
  const pathSamp=[];
  const track=(phase,i)=>{const c=__r3d.CH.get(e.id);if(!c)return null;const r=c.root.position;if(prev){const d=Math.hypot(r.x-prev[0],r.z-prev[1]);if(d>.55)tele++}prev=[r.x,r.z];
    if(i%10===0)pathSamp.push({phase,i,x:+r.x.toFixed(2),z:+r.z.toFixed(2),act:c.pose&&c.pose.act});return c};
  for(let i=0;i<55;i++){tickVs(e,.05);await raf();const c=track('down',i);if(!c)continue;const h=footSolid(c,info.solids);if(h.hits){downH++;dMax=Math.max(dMax,h.maxCm)}downU+=h.under
    if(i===0||i===20||i===49){const q=iso(sp.x+.5,sp.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot('sup_'+tag+'_'+approach+'_down_'+String(i).padStart(2,'0'))}}
  while(e.vs&&e.vs.ph!=='sat'){tickVs(e,.05);await raf();track('satwait',0)}
  for(let i=0;i<14;i++)await raf();
  const c=__r3d.CH.get(e.id);
  const pel=c.b.pelvis.getWorldPosition(new V());
  const root=c.root.position.clone();
  const thighY=(c.b.thigh_l.getWorldPosition(new V()).y+c.b.thigh_r.getWorldPosition(new V()).y)/2;
  const feet=['foot_l','foot_r'].map(bn=>{const p=c.b[bn].getWorldPosition(new V());return{bn,y:+p.y.toFixed(3),x:+p.x.toFixed(3),z:+p.z.toFixed(3)}});
  const sc=info.seatCenter;
  // For multi-seat sofa: compare to spot center, not whole-sofa AABB center
  const spotC=[sp.x+.5,info.seatTop,sp.y+.5];
  const horizSpot=Math.hypot(pel.x-spotC[0],pel.z-spotC[2]);
  const horizMesh=Math.hypot(pel.x-sc[0],pel.z-sc[2]);
  const fwd=(pel.x-spotC[0])*fx+(pel.z-spotC[2])*fz;
  const pelAbove=pel.y-info.seatTop;
  const thighAbove=thighY-info.seatTop;
  // Support: pelvis near spot (on that seat), height near seat top; slight toward-backrest (fwd negative small) OK
  const supportOk=info.seatTop>0&&horizSpot<0.35&&pelAbove>-0.04&&pelAbove<0.38&&thighAbove>-0.08&&thighAbove<0.30&&fwd>-0.35&&fwd<0.25;
  const q=iso(sp.x+.5,sp.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await shot('sup_'+tag+'_'+approach+'_sat');
  leaveSeat(e);
  for(let i=0;i<55;i++){tickVs(e,.05);await raf();const c2=track('up',i);if(!c2)continue;const h=footSolid(c2,info.solids);if(h.hits){upH++;uMax=Math.max(uMax,h.maxCm)}upU+=h.under
    if(i===0||i===24||i===49){const q=iso(sp.x+.5,sp.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot('sup_'+tag+'_'+approach+'_up_'+String(i).padStart(2,'0'))}}
  __r3d.scene.remove(info.pivG);
  return{tag,approach,sk:c.v43sk,supportOk,tele,
    seatTop:+info.seatTop.toFixed(3),seatCenter:info.seatCenter,spotC,furnYaw:+info.yaw.toFixed(3),sitYaw:+yaw.toFixed(3),
    root:[+root.x.toFixed(3),+root.z.toFixed(3)],
    pelvis:[+pel.x.toFixed(3),+pel.y.toFixed(3),+pel.z.toFixed(3)],
    pelAbove:+pelAbove.toFixed(3),thighAbove:+thighAbove.toFixed(3),
    horizSpot:+horizSpot.toFixed(3),horizMesh:+horizMesh.toFixed(3),fwdFromSpot:+fwd.toFixed(3),
    feet,down:{hits:downH,under:downU,maxCm:dMax},up:{hits:upH,under:upU,maxCm:uMax},pathSamp:pathSamp.slice(0,12)};
}

const gp=S.rooms.find(r=>r.type==='gp');
const el=S.rooms.find(r=>r.type==='electro');
const sr=S.rooms.find(r=>r.type==='staffroom');
const psy=S.rooms.find(r=>r.type==='psych');
let bx=null,by=null;for(let y=3;y<S.h-4&&!bx;y++)for(let x=3;x<S.w-5;x++)if([0,1].every(d=>walk(x+d,y)&&!roomAt(x+d,y))){bx=x;by=y;break}
ui.v41rot=1;placeItem('bench',bx,by);
const benchIt={k:'bench',type:'bench',x:bx,y:by,fp:fpOf('bench')};
const gpChair=gp.it.find(t=>t.x===gp.sp.patient.x&&t.y===gp.sp.patient.y)||gp.it.find(t=>/chair_plain/.test(t.k));
const cases=[
  ['chair','front',gp.sp.patient,gpChair,gp],
  ['chair','behind',gp.sp.patient,gpChair,gp],
  ['electro','front',el.sp.patient,el.it.find(t=>t.k==='elchair'),el],
  ['electro','behind',el.sp.patient,el.it.find(t=>t.k==='elchair'),el],
  ['electro','left',el.sp.patient,el.it.find(t=>t.k==='elchair'),el],
  ['sofa','front',sr.sp.rest1,sr.it.find(t=>t.k==='sofa'),sr],
  ['sofa','behind',sr.sp.rest1,sr.it.find(t=>t.k==='sofa'),sr],
  ['psy','front',psy.sp.patient,psy.it.find(t=>t.k==='sofa'),psy],
  ['bench','front',{x:bx,y:by,pose:'sit',dir:1,seat:'bench'},benchIt,null],
  ['bench','left',{x:bx,y:by,pose:'sit',dir:1,seat:'bench'},benchIt,null],
];
const out={cases:[]};
for(const c of cases)out.cases.push(await probe(...c));
out.supportFails=out.cases.filter(c=>!c.supportOk).map(c=>`${c.tag}:${c.approach} fwd=${c.fwdFromSpot} pelA=${c.pelAbove} horiz=${c.horizSpot}`);
out.teleFails=out.cases.filter(c=>c.tele>0).map(c=>c.tag+':'+c.approach+':'+c.tele);
out.collisionNote=out.cases.map(c=>({tag:c.tag,ap:c.approach,downH:c.down.hits,upH:c.up.hits,underDown:c.down.under,underUp:c.up.under}));
out.allOk=out.cases.every(c=>c.supportOk&&c.tele===0);
return JSON.stringify(out);
})()
