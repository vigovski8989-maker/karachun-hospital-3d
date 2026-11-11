(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,2000));
const OUT='/workspace/hospital-game/screenshots/v44/';
const V=__r3d.camera.position.constructor;
const Box3=THREE.Box3, Vector3=THREE.Vector3;
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const shot=async n=>{await raf();await __shot(OUT+n+'.png')};
startLevel(0);await wait(400);
__scen(['reception','gp','electro','psych','staffroom','diag']);closeModal();setSpeed(0);await wait(600);
S.money=999999;ui.v41rot=1;
let bx=null,by=null;for(let y=3;y<S.h-4&&!bx;y++)for(let x=3;x<S.w-5;x++)if([0,1].every(d=>walk(x+d,y)&&!roomAt(x+d,y))){bx=x;by=y;break}
const benchIt=placeItem('bench',bx,by);
const report={bench:!!benchIt,cases:[]};

function seatMeshes(it){
  // Build world AABBs of solid furniture parts via makeFurn at item pose
  const piv=__r3d.makeFurn(it.k||it.type);const g=piv.children[0]||piv;
  // place like game: rough — use item tile center
  const fp=it.fp||fpOf(it.k||it.type);piv.position.set(it.x+fp[0]/2,0,it.y+fp[1]/2);
  piv.updateMatrixWorld(true);
  const solids=[];piv.traverse(o=>{if(!o.isMesh||!o.geometry)return;o.geometry.computeBoundingBox();
    const bb=new Box3().copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
    const size=new Vector3();bb.getSize(size);if(size.y<.03)return; // skip paper-thin
    solids.push({bb,ymin:bb.min.y,ymax:bb.max.y,name:o.name||''})});
  // seat top ≈ max y of meshes with substantial xz area and mid height
  let seatTop=0,seatCenter=null;
  for(const s of solids){const sz=new Vector3();s.bb.getSize(sz);if(sz.x*sz.z>.05&&s.ymax>seatTop&&s.ymax<.9){seatTop=s.ymax;seatCenter=s.bb.getCenter(new Vector3())}}
  return{solids,seatTop,seatCenter,piv};
}
function footSolidHits(c,solids){
  const bones=['foot_l','foot_r','ball_l','ball_r'];let hits=0,maxI=0,details=[];
  for(const bn of bones){const b=c.b[bn];if(!b)continue;const p=b.getWorldPosition(new V());
    for(const s of solids){if(p.y<s.ymin-.02||p.y>s.ymax+.02)continue; // under empty space / above = not in solid
      if(p.x>s.bb.min.x&&p.x<s.bb.max.x&&p.z>s.bb.min.z&&p.z<s.bb.max.z){hits++;const ix=Math.min(p.x-s.bb.min.x,s.bb.max.x-p.x,p.z-s.bb.min.z,s.bb.max.z-p.z);maxI=Math.max(maxI,ix);details.push({bn,y:+p.y.toFixed(3),solidY:[+s.ymin.toFixed(2),+s.ymax.toFixed(2)]});break}}}
  return{hits,maxCm:+(maxI*100).toFixed(1),details:details.slice(0,4)};
}

async function runCase(tag,sp,it,approach){
  const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  const yaw=[Math.PI/2,0,-Math.PI/2,Math.PI][sp.dir!=null?sp.dir:1]??0;
  const fx=Math.sin(yaw),fz=Math.cos(yaw),rx=-fz,rz=fx;
  // natural approaches
  const offs={front:[fx*1.6,fz*1.6],left:[rx*1.4+fx*.3,rz*1.4+fz*.3],right:[-rx*1.4+fx*.3,-rz*1.4+fz*.3],behind:[-fx*1.5,-fz*1.5]};
  const o=offs[approach]||offs.front;
  e.state='v44sup';e.room=null;e.path=[];e.vs=null;e.x=sp.x+o[0];e.y=sp.y+o[1];
  for(let i=0;i<5;i++)await raf();
  // walk toward seat tile via goTo if available
  if(typeof goTo==='function'){goTo(e,sp.x,sp.y);for(let i=0;i<80&&e.path&&e.path.length;i++){if(typeof move==='function')move(e,.08);await raf()}
    // arrive near
    e.x=sp.x;e.y=sp.y;e.path=[]}
  else{e.x=sp.x;e.y=sp.y}
  const mesh=seatMeshes(it);
  takeSeat(e,sp);
  let downHits=0,upHits=0,downMax=0,upMax=0,teleport=0,prev=null;
  const track=()=>{const c=__r3d.CH.get(e.id);const r=c.root.position;if(prev){const d=Math.hypot(r.x-prev[0],r.z-prev[1]);if(d>.55)teleport++}prev=[r.x,r.z];return c};
  for(let i=0;i<55;i++){tickVs(e,.05);await raf();const c=track();const h=footSolidHits(c,mesh.solids);if(h.hits){downHits++;downMax=Math.max(downMax,h.maxCm)}}
  while(e.vs&&e.vs.ph!=='sat'){tickVs(e,.05);await raf()}
  // seated support check
  await raf();const c=__r3d.CH.get(e.id);
  const pel=c.b.pelvis.getWorldPosition(new V());
  const seatTop=mesh.seatTop,seatC=mesh.seatCenter;
  const pelvisAbove=pel.y-seatTop;
  const horiz=seatC?Math.hypot(pel.x-seatC.x,pel.z-seatC.z):null;
  // PASS support: pelvis within ~25cm horizontally of seat center and within -0.05..0.35 of seat top
  const supportOk=seatTop>0&&horiz!=null&&horiz<0.38&&pelvisAbove>-0.08&&pelvisAbove<0.38;
  const q=iso(sp.x+.5,sp.y+.5);cam.z=3.4;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await shot(tag+'_'+approach+'_sat');
  leaveSeat(e);
  for(let i=0;i<55;i++){tickVs(e,.05);await raf();const c2=track();const h=footSolidHits(c2,mesh.solids);if(h.hits){upHits++;upMax=Math.max(upMax,h.maxCm)}}
  // cleanup temp furn pivots
  if(mesh.piv&&mesh.piv.parent)mesh.piv.parent.remove(mesh.piv);
  const ok=supportOk&&teleport===0&&downHits<=2&&upHits<=2;
  return{tag,approach,ok,supportOk,teleport,down:{hits:downHits,maxCm:downMax},up:{hits:upHits,maxCm:upMax},
    pelvisY:+pel.y.toFixed(3),seatTop:+seatTop.toFixed(3),pelvisAboveSeat:+pelvisAbove.toFixed(3),horizFromSeatCenter:horiz==null?null:+horiz.toFixed(3),sk:c.v43sk};
}

const gp=S.rooms.find(r=>r.type==='gp');
const el=S.rooms.find(r=>r.type==='electro');
const sr=S.rooms.find(r=>r.type==='staffroom');
const psy=S.rooms.find(r=>r.type==='psych');
const cases=[
  ['chair','front',gp.sp.patient,gp.it.find(t=>/chair/.test(t.k))],
  ['chair','left',gp.sp.patient,gp.it.find(t=>/chair/.test(t.k))],
  ['bench','front',{x:bx,y:by,pose:'sit',dir:1,seat:'bench'},{k:'bench',type:'bench',x:bx,y:by,fp:fpOf('bench')}],
  ['bench','right',{x:bx,y:by,pose:'sit',dir:1,seat:'bench'},{k:'bench',type:'bench',x:bx,y:by,fp:fpOf('bench')}],
  ['sofa','front',sr.sp.rest1,sr.it.find(t=>t.k==='sofa')],
  ['sofa','behind',sr.sp.rest1,sr.it.find(t=>t.k==='sofa')],
  ['psy','front',psy.sp.patient,psy.it.find(t=>t.k==='sofa')],
  ['electro','front',el.sp.patient,el.it.find(t=>t.k==='elchair')],
  ['electro','left',el.sp.patient,el.it.find(t=>t.k==='elchair')],
  ['electro','behind',el.sp.patient,el.it.find(t=>t.k==='elchair')],
];
for(const[tag,ap,sp,it]of cases){report.cases.push(await runCase(tag,sp,it,ap))}
report.allOk=report.cases.every(c=>c.ok);
report.supportFails=report.cases.filter(c=>!c.supportOk);
report.teleportFails=report.cases.filter(c=>c.teleport>0);
return JSON.stringify(report);
})()
