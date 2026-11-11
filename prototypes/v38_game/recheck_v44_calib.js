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
S.money=999999;
const el=S.rooms.find(r=>r.type==='electro');
const sp=el.sp.patient;
const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
const yaw=[Math.PI/2,0,-Math.PI/2,Math.PI][sp.dir]??0;
const fx=Math.sin(yaw),fz=Math.cos(yaw);
const ax=sp.x+.5,az=sp.y+.5;
const results=[];
const V43=__r3d.V43;
for(const MD of[-.2,-.1,0,.1,.2,.3]){
  V43.sitF.elchair=MD;V43.fwd=MD;
  e.state='cal';e.room=null;e.path=[];e.vs=null;
  // clear v43vs so approach re-inits
  const c0=__r3d.CH.get(e.id);if(c0){c0.v43vs=null;c0.v43from=null}
  e.x=sp.x+fx*1.6;e.y=sp.y+fz*1.6;
  for(let i=0;i<5;i++)await raf();
  takeSeat(e,sp);
  for(let i=0;i<70;i++){tickVs(e,.05);await raf()}
  while(e.vs&&e.vs.ph!=='sat'){tickVs(e,.05);await raf()}
  for(let i=0;i<15;i++)await raf();
  const c=__r3d.CH.get(e.id);
  const pel=c.b.pelvis.getWorldPosition(new V());
  const root=c.root.position;
  const tag='cal2_el_'+String(MD).replace('.','p').replace('-','m');
  const q=iso(ax,az);cam.z=3.6;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await shot(tag);
  results.push({MD,sk:c.v43sk,root:[+root.x.toFixed(3),+root.z.toFixed(3)],
    pel:[+pel.x.toFixed(3),+pel.y.toFixed(3),+pel.z.toFixed(3)],
    fwd:+((pel.x-ax)*fx+(pel.z-az)*fz).toFixed(3),
    expectRootZ:+(az+fz*MD).toFixed(3)});
  leaveSeat(e);for(let i=0;i<20;i++){tickVs(e,.05);await raf()}
}
return JSON.stringify({results});
})()
