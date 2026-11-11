(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,1500));
const V=__r3d.camera.position.constructor;
// Grab THREE constructors from existing objects
const Mesh=__r3d.scene.children.find(c=>c.isMesh)||[...__r3d.CH.values()][0]?.root;
const THREE_Mesh=[...__r3d.scene.children].flatMap(function walk(o){return o.isMesh?[o]:[...o.children].flatMap(walk)})[0].constructor;
const SphereGeom=[...__r3d.scene.children].flatMap(function walk(o){return o.isMesh&&o.geometry&&o.geometry.type==='SphereGeometry'?[o.geometry]:[...o.children].flatMap(walk)})[0];
const Mat=[...__r3d.scene.children].flatMap(function walk(o){return o.isMesh?[o.material]:[...o.children].flatMap(walk)})[0].constructor;
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT='/workspace/hospital-game/screenshots/v44/';
const shot=async n=>{await raf();await __shot(OUT+n+'.png')};
startLevel(0);await wait(400);
__scen(['reception','gp','electro','psych','staffroom']);closeModal();setSpeed(0);await wait(500);
S.money=999999;

function mkBall(col,r=.07){
  // reuse sphere from scene or box
  const g=__r3d.makeFurn('plant'); // has spheres
  let sph=null;g.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.type==='SphereGeometry'&&!sph)sph=o});
  const m=sph?sph.clone():null;
  if(!m){__r3d.scene.remove(g);return null}
  m.material=m.material.clone();m.material.color.setHex(col);m.material.emissive.setHex(col);m.material.emissiveIntensity=2;
  m.scale.setScalar(r/.08);m.position.set(0,0,0);
  const h=new g.constructor();h.add(m);__r3d.scene.add(h);return h;
}
function seatTopAt(it,r){
  const k=it.k||it.type,fp=it.fp||fpOf(k),nf=(k in{sofa:1,bench:1}?[2,1]:fp);
  const furn=__r3d.makeFurn(k),Pivot=furn.constructor,piv=new Pivot();
  const yaw=placeYaw(it,r||null);
  piv.position.set(it.x+fp[0]/2,0,it.y+fp[1]/2);piv.rotation.y=yaw;
  furn.position.set(-nf[0]/2,0,-nf[1]/2);piv.add(furn);
  __r3d.scene.add(piv);piv.updateMatrixWorld(true);
  let top=0,cx=0,cz=0,n=0;
  piv.traverse(o=>{if(!o.isMesh||!o.geometry)return;if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
    const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);const sz=bb.getSize(new V());
    if(sz.y<.22&&sz.x*sz.z>.1&&bb.max.y>0.35&&bb.max.y<0.7){if(bb.max.y>=top){top=bb.max.y;const c=bb.getCenter(new V());cx=c.x;cz=c.z;n++}}});
  __r3d.scene.remove(piv);
  return{top,x:cx,z:cz,yaw};
}
async function mark(tag,sp,it,room){
  const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  const yaw=[Math.PI/2,0,-Math.PI/2,Math.PI][sp.dir!=null?sp.dir:1]??0;
  const fx=Math.sin(yaw),fz=Math.cos(yaw);
  e.state='mk';e.room=null;e.path=[];e.vs=null;e.x=sp.x+fx*1.5;e.y=sp.y+fz*1.5;
  for(let i=0;i<5;i++)await raf();
  takeSeat(e,sp);
  for(let i=0;i<70;i++){tickVs(e,.05);await raf()}
  const c=__r3d.CH.get(e.id);
  const pel=c.b.pelvis.getWorldPosition(new V());
  const st=seatTopAt(it,room);
  // Also get butt approx: average of thigh world positions projected
  const thL=c.b.thigh_l.getWorldPosition(new V()),thR=c.b.thigh_r.getWorldPosition(new V());
  const butt=new V((thL.x+thR.x)/2,(thL.y+thR.y)/2-0.05,(thL.z+thR.z)/2);
  const bPel=mkBall(0xff0000,.09);if(bPel)bPel.position.copy(pel);
  const bSeat=mkBall(0x00ff00,.09);if(bSeat)bSeat.position.set(sp.x+.5,st.top,sp.y+.5);
  const bButt=mkBall(0xffff00,.07);if(bButt)bButt.position.copy(butt);
  const bRoot=mkBall(0x0088ff,.06);if(bRoot)bRoot.position.set(c.root.position.x,0.05,c.root.position.z);
  const q=iso(sp.x+.5,sp.y+.5);cam.z=3.6;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await shot('mark_'+tag);
  const info={tag,pel:[+pel.x.toFixed(3),+pel.y.toFixed(3),+pel.z.toFixed(3)],
    butt:[+butt.x.toFixed(3),+butt.y.toFixed(3),+butt.z.toFixed(3)],
    seatSpot:[+(sp.x+.5).toFixed(3),+st.top.toFixed(3),+(sp.y+.5).toFixed(3)],
    seatMeshC:[+st.x.toFixed(3),+st.top.toFixed(3),+st.z.toFixed(3)],
    root:[+c.root.position.x.toFixed(3),+c.root.position.z.toFixed(3)],
    pelAbove:+(pel.y-st.top).toFixed(3),buttAbove:+(butt.y-st.top).toFixed(3),
    horizPel:+Math.hypot(pel.x-(sp.x+.5),pel.z-(sp.y+.5)).toFixed(3),
    horizButt:+Math.hypot(butt.x-(sp.x+.5),butt.z-(sp.y+.5)).toFixed(3),
    fwdPel:+((pel.x-(sp.x+.5))*fx+(pel.z-(sp.y+.5))*fz).toFixed(3),
    fwdButt:+((butt.x-(sp.x+.5))*fx+(butt.z-(sp.y+.5))*fz).toFixed(3),
    sk:c.v43sk};
  for(const b of[bPel,bSeat,bButt,bRoot])if(b)__r3d.scene.remove(b);
  leaveSeat(e);for(let i=0;i<20;i++){tickVs(e,.05);await raf()}
  return info;
}
const gp=S.rooms.find(r=>r.type==='gp');
const el=S.rooms.find(r=>r.type==='electro');
const sr=S.rooms.find(r=>r.type==='staffroom');
let bx=null,by=null;for(let y=3;y<S.h-4&&!bx;y++)for(let x=3;x<S.w-5;x++)if([0,1].every(d=>walk(x+d,y)&&!roomAt(x+d,y))){bx=x;by=y;break}
ui.v41rot=1;placeItem('bench',bx,by);
const out={marks:[]};
out.marks.push(await mark('electro',el.sp.patient,el.it.find(t=>t.k==='elchair'),el));
out.marks.push(await mark('sofa',sr.sp.rest1,sr.it.find(t=>t.k==='sofa'),sr));
out.marks.push(await mark('bench',{x:bx,y:by,pose:'sit',dir:1,seat:'bench'},{k:'bench',x:bx,y:by,fp:fpOf('bench')},null));
const gpCh=gp.it.find(t=>t.x===gp.sp.patient.x&&t.y===gp.sp.patient.y);
out.marks.push(await mark('chair',gp.sp.patient,gpCh,gp));
return JSON.stringify(out);
})()
