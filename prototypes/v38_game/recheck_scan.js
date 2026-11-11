(async()=>{eval(await(await fetch('/v38scen.js')).text());await new Promise(r=>setTimeout(r,2000));
const V=__r3d.camera.position.constructor;const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
startLevel(0);await new Promise(r=>setTimeout(r,300));__scen(['reception','gp','diag']);closeModal();setSpeed(0);await new Promise(r=>setTimeout(r,500));
spawnPatient();const p=S.pats[0];const r=S.rooms.find(x=>x.type==='diag');const sp=r.sp.patient;
p.state='v43test';p.x=sp.x;p.y=sp.y;p.path=[];takeSeat(p,sp);
for(let i=0;i<90;i++){tickVs(p,.05);await raf()}
const c=__r3d.CH.get(p.id);let minY=1e9;for(const bn of['foot_l','foot_r','ball_l','ball_r']){const b=c.b[bn];if(!b)continue;minY=Math.min(minY,b.getWorldPosition(new V()).y)}
const q=iso(sp.at.x+.5,sp.at.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
await __shot('/workspace/hospital-game/screenshots/v43_recheck/scanner_fix.png');
return JSON.stringify({minY,act:c.pose.act,ry:c.tilt.position.y,mz:c.m.position.y,tilt:c.tilt.rotation.x})})()
