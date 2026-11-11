(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,2000));
const OUT='/workspace/hospital-game/screenshots/v44/';
const V=__r3d.camera.position.constructor;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const shot=async(n)=>{await raf();await __shot(OUT+n+'.png')};
startLevel(0);await wait(400);
__scen(['reception','gp','electro','psych','staffroom','diag','ward']);closeModal();setSpeed(0);await wait(500);
S.money=999999;
// place corridor bench
let bx=null,by=null;
for(let y=2;y<S.h-3&&bx==null;y++)for(let x=2;x<S.w-4;x++)if([-1,0,1,2].every(d=>walk(x+d,y)&&!roomAt(x+d,y))){bx=x;by=y;break}
ui.v41rot=1;const bench=placeItem('bench',bx,by);
const report={benchPlaced:!!bench,at:[bx,by],kinds:{}};

async function measureSeat(kind,sp,seatIt,tag,frames=50){
  const e=S.staff.find(s=>s.type==='doctor')||S.staff[0];
  // approach from outside facing seat
  const yaw=[Math.PI/2,0,-Math.PI/2,Math.PI][sp.dir!=null?sp.dir:1]??0,fx=Math.sin(yaw),fz=Math.cos(yaw);
  e.state='v44seat';e.room=null;e.path=[];e.vs=null;
  e.x=sp.x+fx*1.45;e.y=sp.y+fz*1.45; // stand in front
  for(let i=0;i<4;i++)await raf();
  const fp=seatIt.fp||fpOf(seatIt.k||seatIt.type||'bench');
  const x0=seatIt.x,z0=seatIt.y,x1=seatIt.x+fp[0],z1=seatIt.y+fp[1];
  const bones=['foot_l','foot_r','ball_l','ball_r'];
  const hit=()=>{const c=__r3d.CH.get(e.id);let hits=[],maxI=0;
    for(const bn of bones){const b=c.b[bn];if(!b)continue;const p=b.getWorldPosition(new V());if(p.y>0.35)continue;
      if(p.x>x0+.06&&p.x<x1-.06&&p.z>z0+.06&&p.z<z1-.06){hits.push(bn);maxI=Math.max(maxI,Math.min(p.x-x0,x1-p.x,p.z-z0,z1-p.z))}}
    return{hits,maxI,act:c.pose&&c.pose.act,sk:c.v43sk,root:[+c.root.position.x.toFixed(2),+c.root.position.z.toFixed(2)]}};
  const seq=[];let downHits=0,upHits=0,downMax=0,upMax=0,nDown=0,nUp=0;
  takeSeat(e,sp);
  for(let i=0;i<frames;i++){tickVs(e,.05);await raf();const h=hit();nDown++;if(h.hits.length){downHits++;downMax=Math.max(downMax,h.maxI)}
    if(i%8===0||h.hits.length)seq.push({ph:'down',i,...h});
    if(i===0||i===12||i===28||i===frames-1){const q=iso((sp.x+seatIt.x)/2+.5,(sp.y+seatIt.y)/2+.5);cam.z=3.2;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot(tag+'_down_'+String(i).padStart(2,'0'))}}
  while(e.vs&&e.vs.ph!=='sat'){tickVs(e,.05);await raf()}
  leaveSeat(e);
  for(let i=0;i<frames;i++){tickVs(e,.05);await raf();const h=hit();nUp++;if(h.hits.length){upHits++;upMax=Math.max(upMax,h.maxI)}
    if(i%8===0||h.hits.length)seq.push({ph:'up',i,...h});
    if(i===0||i===16||i===frames-1){const q=iso((sp.x+seatIt.x)/2+.5,(sp.y+seatIt.y)/2+.5);cam.z=3.2;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot(tag+'_up_'+String(i).padStart(2,'0'))}}
  const ok=downHits===0&&upHits===0;
  return{ok,kind,tag,down:{frames:nDown,hits:downHits,maxCm:+(downMax*100).toFixed(1)},up:{frames:nUp,hits:upHits,maxCm:+(upMax*100).toFixed(1)},skSample:seq.find(s=>s.sk)?.sk,seq:seq.filter(s=>s.hits.length).slice(0,8)};
}

// chair (gp patient)
{const r=S.rooms.find(x=>x.type==='gp');const sp=r.sp.patient;const it=r.it.find(t=>/chair/.test(t.k));
 report.kinds.chair=await measureSeat('chair',sp,it,'seat_chair')}
// bench
{const sp={x:bx,y:by,pose:'sit',dir:1,seat:'bench'};const it={k:'bench',type:'bench',x:bx,y:by,fp:fpOf('bench')};
 report.kinds.bench=await measureSeat('bench',sp,it,'seat_bench')}
// staff sofa
{const r=S.rooms.find(x=>x.type==='staffroom');const sp=r.sp.rest1;const it=r.it.find(t=>t.k==='sofa');
 report.kinds.sofa=await measureSeat('sofa',sp,it,'seat_sofa')}
// psych sofa
{const r=S.rooms.find(x=>x.type==='psych');const sp=r.sp.patient;const it=r.it.find(t=>t.k==='sofa');
 report.kinds.psy=await measureSeat('sofa',sp,it,'seat_psy')}
// electro
{const r=S.rooms.find(x=>x.type==='electro');const sp=r.sp.patient;const it=r.it.find(t=>t.k==='elchair');
 report.kinds.electro=await measureSeat('elchair',sp,it,'seat_electro')}

// scanner: foot Y + pelvis vs tray (bed surface ~0.4-0.6 typical)
{const r=S.rooms.find(x=>x.type==='diag');const sp=r.sp.patient;if(!S.pats.length)spawnPatient();
 const e=S.pats[0];e.state='v44scan';e.x=sp.x;e.y=sp.y;e.path=[];e.vs=null;e.healed=false;
 takeSeat(e,sp);for(let i=0;i<70;i++){tickVs(e,.05);await raf()}
 const c=__r3d.CH.get(e.id);let minY=1e9,feet=[];
 for(const bn of['foot_l','foot_r','ball_l','ball_r']){const b=c.b[bn];if(!b)continue;const w=b.getWorldPosition(new V());minY=Math.min(minY,w.y);feet.push({bn,y:+w.y.toFixed(3)})}
 const pel=c.b.pelvis.getWorldPosition(new V());
 // tray approx: scanner bed top — sample mesh named /scan|bed|tray/i near center
 let trayY=null;__r3d.scene.traverse(o=>{if(!o.isMesh||!o.geometry)return;const n=(o.name||'')+(o.parent&&o.parent.name||'');
  if(!/scan|bed|tray|matt/i.test(n)&&o.geometry.type!=='BoxGeometry')return;
  o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox;const mid=new V((bb.min.x+bb.max.x)/2,bb.max.y,(bb.min.z+bb.max.z)/2).applyMatrix4(o.matrixWorld);
  if(Math.hypot(mid.x-c.root.position.x,mid.z-c.root.position.z)<1.2)trayY=trayY==null?mid.y:Math.max(trayY,mid.y)});
 const q=iso(sp.at.x+.5,sp.at.y+.5);cam.z=3.4;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await shot('scanner_contact');
 // PASS: feet not underground (<0.15) and not floating high above tray (>tray+0.35); pelvis near tray
 const floatGap=trayY!=null?(pel.y-trayY):null;
 report.scanner={ok:minY>0.15&&minY<1.05&&(floatGap==null||(floatGap>-0.05&&floatGap<0.55)),minFootY:+minY.toFixed(3),pelvisY:+pel.y.toFixed(3),trayY:trayY==null?null:+trayY.toFixed(3),floatGap:floatGap==null?null:+floatGap.toFixed(3),feet,act:c.pose.act};
 leaveSeat(e)}

report.allSeatsOk=Object.values(report.kinds).every(k=>k.ok);
report.summary=Object.fromEntries(Object.entries(report.kinds).map(([k,v])=>[k,{ok:v.ok,down:v.down,up:v.up,sk:v.skSample}]));
return JSON.stringify(report);
})()
