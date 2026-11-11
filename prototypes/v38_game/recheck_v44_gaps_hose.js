(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,1500));
const V=__r3d.camera.position.constructor;
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT='/workspace/hospital-game/screenshots/v44/gap_checks/';
const shot=async n=>{await raf();await __shot(OUT+n+'.png')};
startLevel(0);await wait(400);
__scen(['reception','gp','pump','inflate','staffroom']);try{closeModal()}catch(e){}
setSpeed(0);await wait(400);for(let i=0;i<6;i++)await raf();

async function hoseProbe(roomType,dis,tag){
  const r=S.rooms.find(x=>x.type===roomType);if(!r)return{ok:null,skip:'no '+roomType};
  let s=S.staff.find(x=>x.type==='doctor')||S.staff[0];
  if(s){clearSeat(s);s.vs=null;s.state='work';s.room=r.id;r.staff=s.id;const ssp=spotStaff(r);if(ssp){s.x=ssp.x;s.y=ssp.y;s.path=[]}}
  if(!S.pats.length)spawnPatient();
  const p=S.pats[0];p.dis=dis;p.healed=false;p.known=true;p.need=roomType;p.room=r.id;p.state='treat';
  p.tT=r_dur(p);p.t=p.tT;p.path=[];p.vs=null;p.x=r.sp.patient.x;p.y=r.sp.patient.y;r.busy=p.id;
  for(let i=0;i<10;i++)await raf();
  const samples=[];
  for(const ph of[0.1,0.3,0.5,0.7,0.9]){
    p.state='treat';p.tT=r_dur(p);p.t=p.tT*(1-ph);p.room=r.id;r.busy=p.id;
    for(let i=0;i<14;i++)await raf();
    const c=__r3d.CH.get(p.id);if(!c||!c.b.Head){samples.push({ph,ok:false});continue}
    const hd=c.b.Head;hd.updateWorldMatrix(true,false);
    const H0=hd.getWorldPosition(new V());
    const N0=(c.b.neck_01||c.b.neck||hd.parent).getWorldPosition(new V());
    const up=H0.clone().sub(N0).normalize();
    const sc=new V();hd.matrixWorld.decompose(new V(),new (__r3d.camera.quaternion.constructor)(),sc);
    const hr=(window.HOSE_R??.17)*Math.max(sc.x,sc.y,sc.z)/Math.max(1e-3,c.root.scale.x||1)*(c.root.scale.x||1);
    const expectB=H0.clone().addScaledVector(up,hr);
    let valveDist=null,endDist=null;
    __r3d.scene.traverse(o=>{
      if(!o.isMesh||!o.visible)return;const gt=o.geometry&&o.geometry.type;
      if(gt==='CylinderGeometry'||gt==='CylinderBufferGeometry'){const wp=o.getWorldPosition(new V());const d=wp.distanceTo(expectB);if(valveDist==null||d<valveDist)valveDist=d}
      if(gt==='TubeGeometry'||gt==='TubeBufferGeometry'){const pos=o.geometry.attributes&&o.geometry.attributes.position;if(pos&&pos.count){const i=pos.count-1;const lp=new V(pos.getX(i),pos.getY(i),pos.getZ(i)).applyMatrix4(o.matrixWorld);const d=lp.distanceTo(expectB);if(endDist==null||d<endDist)endDist=d}}
    });
    const hs=c.b.Head.scale;samples.push({ph,contactOk:valveDist!=null&&valveDist<0.10,valveDist:valveDist==null?null:+valveDist.toFixed(3),tubeEndDist:endDist==null?null:+endDist.toFixed(3),headScale:[+hs.x.toFixed(3),+hs.y.toFixed(3),+hs.z.toFixed(3)]});
  }
  p.t=r_dur(p)*0.45;for(let i=0;i<12;i++)await raf();
  const q=iso(r.sp.patient.x+.5,r.sp.patient.y+.5);cam.z=3.4;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await shot(tag+'_hose_mid');
  p.t=r_dur(p)*0.2;for(let i=0;i<10;i++)await raf();await shot(tag+'_hose_late');
  const nOk=samples.filter(s=>s.contactOk).length;
  return{ok:nOk>=4,nOk,samples,room:roomType,dis,tag,verdict:nOk>=4?'hose valve on head surface across phases':'valve still drifts'};
}

const hose={pump:await hoseProbe('pump','balloonhead','pump'),inflate:await hoseProbe('inflate','deflated','inflate')};
hose.ok=hose.pump.ok&&hose.inflate.ok;

// Ghost: find free area large enough for gp min+2
const m=D.rooms.gp.min,gw=m[0]+2,gh=m[1]+2;
startRoom('gp');for(let i=0;i<3;i++)await raf();
let ghost={ok:false};
if(ui.ghost){
  let free=null,blocked=null;
  for(let y=1;y<S.h-gh-1&&!free;y++)for(let x=1;x<S.w-gw-1;x++){ui.ghost.x=x;ui.ghost.y=y;ui.ghost.w=gw;ui.ghost.h=gh;const bad=validRoom(ui.ghost);if(!bad){free={x,y,bad:null};break}}
  const ex=S.rooms[0];ui.ghost.x=ex.x;ui.ghost.y=ex.y;blocked={x:ex.x,y:ex.y,bad:validRoom(ui.ghost)};
  ghost={ok:!!free&&!!blocked.bad,free,blocked};
  const q=iso((ghost.blocked.x)+1,(ghost.blocked.y)+1);cam.z=2.8;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await shot('ghost_overlap');
  if(free){ui.ghost.x=free.x;ui.ghost.y=free.y;await shot('ghost_valid')}
  gcancel();
}
return JSON.stringify({hose,ghost});
})()
