(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,1200));
startLevel(0);await new Promise(r=>setTimeout(r,300));
__scen(['reception','gp','electro','psych','staffroom']);closeModal();setSpeed(0);
await new Promise(r=>setTimeout(r,400));
const V=__r3d.camera.position.constructor;
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const el=S.rooms.find(r=>r.type==='electro');
const sp=el.sp.patient;const it=el.it.find(t=>t.k==='elchair');
const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
e.state='d';e.room=null;e.path=[];e.vs=null;e.x=sp.x;e.y=sp.y+1.5;
for(let i=0;i<4;i++)await raf();
takeSeat(e,sp);
for(let i=0;i<80;i++){tickVs(e,.05);await raf()}
const c=__r3d.CH.get(e.id);
const p=c.pose;
const pel=c.b.pelvis.getWorldPosition(new V());
const hip=(c.b.hips||c.b.pelvis).getWorldPosition(new V());
const bones={};
for(const bn of['pelvis','spine_01','thigh_l','thigh_r','calf_l','foot_l','Head']){
  if(!c.b[bn])continue;const w=c.b[bn].getWorldPosition(new V());bones[bn]=[+w.x.toFixed(3),+w.y.toFixed(3),+w.z.toFixed(3)];
}
// live furniture piv from DYN
let live=null;
for(const[id,d]of __r3d.DYN){const hit=(d.items||[]).find(x=>x.k==='elchair');if(hit){live={pos:[+hit.piv.position.x.toFixed(3),+hit.piv.position.z.toFixed(3)],yaw:+hit.piv.rotation.y.toFixed(3),nChild:hit.piv.children.length};break}}
return JSON.stringify({
  V26:typeof V26!=='undefined'?{cho:V26.cho,chT:V26.chT}:null,
  sp,it:{k:it.k,x:it.x,y:it.y},
  pose:{act:p.act,x:+p.x.toFixed(3),z:+p.z.toFixed(3),yaw:+(p.yaw||0).toFixed(3),k:p.k},
  root:[+c.root.position.x.toFixed(3),+c.root.position.z.toFixed(3)],
  rootYaw:+c.yaw.toFixed(3),v43sk:c.v43sk,gy:c.gy,oz:c.oz,
  bones,live,
  seatXY:seatXY(e),
  invSeat:(()=>{const[X,Y]=seatXY(e);const[x,z]=((X,Y)=>{const a=(X-OX)/HW,b=(Y-OY)/HH;return[(a+b)/2,(b-a)/2]})(X,Y);return[+x.toFixed(3),+z.toFixed(3)]})()
});
})()
