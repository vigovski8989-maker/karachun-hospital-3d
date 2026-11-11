(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,1200));
const V=__r3d.camera.position.constructor;
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT='/workspace/hospital-game/screenshots/v44/';
const shot=async n=>{await raf();await __shot(OUT+n+'.png')};
startLevel(0);await wait(300);
__scen(['reception','gp','electro','psych','staffroom']);closeModal();setSpeed(0);await wait(400);
S.money=999999;
function solids(it,r){
  const k=it.k,fp=it.fp||fpOf(k),nf=[2,1],furn=__r3d.makeFurn(k),P=furn.constructor,piv=new P();
  let Y=0;if(r){const cx=it.x+fp[0]/2,cy=it.y+fp[1]/2,rx=r.x+r.w/2,ry=r.y+r.h/2;const du=rx-cx,dv=ry-cy;Y=Math.abs(du)>Math.abs(dv)?(du>0?Math.PI/2:-Math.PI/2):(dv>0?0:Math.PI)}
  piv.position.set(it.x+fp[0]/2,0,it.y+fp[1]/2);piv.rotation.y=Y;furn.position.set(-1,0,-.5);piv.add(furn);__r3d.scene.add(piv);piv.updateMatrixWorld(true);
  const s=[];let top=0;piv.traverse(o=>{if(!o.isMesh||!o.geometry)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
    const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);const sz=bb.getSize(new V());if(sz.y<.02)return;
    s.push({ymin:bb.min.y,ymax:bb.max.y,xmin:bb.min.x,xmax:bb.max.x,zmin:bb.min.z,zmax:bb.max.z});
    if(sz.y<.22&&sz.x*sz.z>.1&&bb.max.y>0.35&&bb.max.y<.7)top=Math.max(top,bb.max.y)});
  return{piv,s,top}}
function hits(c,solids){let h=0,u=0;for(const bn of['foot_l','foot_r','ball_l','ball_r']){const b=c.b[bn];if(!b)continue;const p=b.getWorldPosition(new V());
  for(const s of solids){if(!(p.x>s.xmin&&p.x<s.xmax&&p.z>s.zmin&&p.z<s.zmax))continue;if(p.y<s.ymin-.02){u++;continue}if(p.y<=s.ymax+.02)h++}}return{h,u}}
const sr=S.rooms.find(r=>r.type==='staffroom'),psy=S.rooms.find(r=>r.type==='psych');
const out={sitF:__r3d.V43.sitF.sofa,cases:[]};
for(const[tag,sp,it,room,ap] of[
  ['sofa','front',sr.sp.rest1,sr.it.find(t=>t.k==='sofa'),sr,'front'],
  ['sofa','behind',sr.sp.rest1,sr.it.find(t=>t.k==='sofa'),sr,'behind'],
  ['psy','front',psy.sp.patient,psy.it.find(t=>t.k==='sofa'),psy,'front'],
].map(x=>[x[0],x[2],x[3],x[4],x[5]])){
  // fix destructure - rewrite simply
}
for(const row of[
  ['sofa','front',sr.sp.rest1,sr.it.find(t=>t.k==='sofa'),sr],
  ['sofa','behind',sr.sp.rest1,sr.it.find(t=>t.k==='sofa'),sr],
  ['psy','front',psy.sp.patient,psy.it.find(t=>t.k==='sofa'),psy],
]){
  const[tag,ap,sp,it,room]=row;
  const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  const yaw=[Math.PI/2,0,-Math.PI/2,Math.PI][sp.dir??1]??0,fx=Math.sin(yaw),fz=Math.cos(yaw),rx=-fz,rz=fx;
  const o=ap==='behind'?[-fx*1.6,-fz*1.6]:[fx*1.7,fz*1.7];
  e.state='sf';e.room=null;e.path=[];e.vs=null;e.x=sp.x+o[0];e.y=sp.y+o[1];
  const c0=__r3d.CH.get(e.id);if(c0)c0.v43vs=null;
  for(let i=0;i<4;i++)await raf();
  const g=solids(it,room);takeSeat(e,sp);
  let tele=0,prev=null,dH=0,uH=0;
  for(let i=0;i<55;i++){tickVs(e,.05);await raf();const c=__r3d.CH.get(e.id);const r=c.root.position;if(prev&&Math.hypot(r.x-prev[0],r.z-prev[1])>.55)tele++;prev=[r.x,r.z];const h=hits(c,g.s);if(h.h)dH++}
  while(e.vs&&e.vs.ph!=='sat'){tickVs(e,.05);await raf()}
  for(let i=0;i<12;i++)await raf();
  const c=__r3d.CH.get(e.id);const pel=c.b.pelvis.getWorldPosition(new V());
  const fwd=(pel.x-(sp.x+.5))*fx+(pel.z-(sp.y+.5))*fz;
  const horiz=Math.hypot(pel.x-(sp.x+.5),pel.z-(sp.y+.5));
  const pelA=pel.y-g.top;
  const q=iso(sp.x+.5,sp.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await shot('fin_'+tag+'_'+ap+'_sat');
  leaveSeat(e);
  for(let i=0;i<55;i++){tickVs(e,.05);await raf();const c2=__r3d.CH.get(e.id);const r=c2.root.position;if(prev&&Math.hypot(r.x-prev[0],r.z-prev[1])>.55)tele++;prev=[r.x,r.z];if(hits(c2,g.s).h)uH++}
  __r3d.scene.remove(g.piv);
  out.cases.push({tag,ap,tele,dH,uH,pelA:+pelA.toFixed(3),horiz:+horiz.toFixed(3),fwd:+fwd.toFixed(3),
    support:g.top>0&&horiz<.38&&pelA>-.05&&pelA<.4&&fwd>-.4&&fwd<.2});
}
out.allOk=out.cases.every(c=>c.support&&c.tele===0);
return JSON.stringify(out);
})()
