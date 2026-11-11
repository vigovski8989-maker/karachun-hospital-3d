(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,2000));
const V=__r3d.camera.position.constructor;const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const OUT='/workspace/hospital-game/screenshots/v43_recheck/';
startLevel(0);await new Promise(r=>setTimeout(r,400));
const pack=__scen(['reception','gp','diag','lab','pharmacy','ward','psych','pump','toilet','staffroom','cardio','surgery','icu','derma']);
closeModal();setSpeed(0);
const info={pack,treatLine:null,bed:{},scan:{},lab:{},sit:{},hose:{},pharmacy:{}};
// confirm treat anim code by monkey observation
await new Promise(r=>setTimeout(r,800));
const nurse=S.staff.find(s=>s.type==='nurse');let nc=nurse&&__r3d.CH.get(nurse.id);for(let i=0;i<50&&nurse&&!nc;i++){await raf();nc=__r3d.CH.get(nurse.id)}info.nurseIsStaff=nc&&nc.isStaff;info.nurseType=nurse&&nurse.type;

// BED with patient entity
async function bed(rtype){
  const r=S.rooms.find(x=>x.type===rtype);const sp=r.sp.patient;
  let p=S.pats[0];if(!p){spawnPatient();p=S.pats[0]}
  p.state='v43test';p.room=null;p.x=sp.x;p.y=sp.y;p.path=[];p.vs=null;p.healed=false;
  for(let i=0;i<3;i++)await raf();
  takeSeat(p,sp);const acts=[];
  for(let i=0;i<70;i++){tickVs(p,.05);await raf();const c=__r3d.CH.get(p.id);if(c&&c.pose)acts.push(c.pose.act+(c.pose.v43bed?'B':''))}
  const uniq=[...new Set(acts)];leaveSeat(p);for(let i=0;i<50;i++)tickVs(p,.05);
  const q=iso(sp.at.x+.5,sp.at.y+1);cam.z=3.2;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await __shot(OUT+'diag_bed_'+rtype+'.png');
  return {uniq,vs:p.vs,SEAT_T,hasV43:uniq.some(a=>a.includes('v43lie'))};
}
info.bed.ward=await bed('ward');
info.bed.cardio=await bed('cardio');
info.bed.surgery=await bed('surgery');
info.bed.icu=await bed('icu');
info.bed.derma=await bed('derma');

// scanner with patient
{const r=S.rooms.find(x=>x.type==='diag');const sp=r.sp.patient;let p=S.pats[0];
 p.state='v43test';p.x=sp.x;p.y=sp.y;p.path=[];p.vs=null;takeSeat(p,sp);
 for(let i=0;i<80;i++){tickVs(p,.05)}await raf();
 while(p.vs&&p.vs.ph!=='sat'){tickVs(p,.05);await raf()}
 const c=__r3d.CH.get(p.id);let minY=1e9,feet=[];
 for(const bn of['foot_l','foot_r','ball_l','ball_r']){const b=c.b[bn];if(!b)continue;const w=b.getWorldPosition(new V());minY=Math.min(minY,w.y);feet.push({bn,y:+w.y.toFixed(3),x:+w.x.toFixed(2),z:+w.z.toFixed(2)})}
 const q=iso(sp.at.x+.5,sp.at.y+.5);cam.z=3.5;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;await __shot(OUT+'diag_scanner.png');
 info.scan={minY:+minY.toFixed(3),act:c.pose.act,lie:c.pose.lie,tilt:c.tilt.rotation.x,mz:c.m.position.y,ry:c.tilt.position.y,feet,bed:c.pose.bed&&c.pose.bed.t.k};
 leaveSeat(p);for(let i=0;i<40;i++)tickVs(p,.05)}

// lab nurse anim
{const r=S.rooms.find(x=>x.type==='lab');let p=S.pats[0];let s=S.staff.find(s=>s.type==='nurse'&&(!s.room||s.room===r.id))||S.staff.find(s=>s.type==='nurse');
 clearSeat(s);s.vs=null;s.state='work';s.room=r.id;r.staff=s.id;const ssp=spotStaff(r);s.x=ssp.x;s.y=ssp.y;
 p.need='lab';p.room=r.id;p.state='treat';p.tT=8;p.t=4;p.x=r.sp.patient.x;p.y=r.sp.patient.y;r.busy=p.id;
 const samples=[];for(let i=0;i<15;i++){await raf();await new Promise(r=>setTimeout(r,40));const c=__r3d.CH.get(s.id);
  samples.push({act:c.pose.act,cur:c.cur,isStaff:c.isStaff,type:s.type,layer:c.layer})}
 info.lab=samples}

// pharmacy
{const r=S.rooms.find(x=>x.type==='pharmacy');let p=S.pats[0];let s=S.staff.find(s=>s.type==='nurse');
 clearSeat(s);s.vs=null;s.state='work';s.room=r.id;r.staff=s.id;const ssp=spotStaff(r);s.x=ssp.x;s.y=ssp.y;s.dir=ssp.dir??1;
 p.need='pharmacy';p.room=r.id;p.state='treat';p.tT=6;p.t=6;p.x=r.sp.patient.x;p.y=r.sp.patient.y;r.busy=p.id;
 const samples=[];for(let i=0;i<=12;i++){p.t=6*(1-i/12);await raf();await new Promise(r=>setTimeout(r,40));const c=__r3d.CH.get(s.id);
  samples.push({q:procQ(p),act:c.pose.act,cur:c.cur,give:c.giveK,pill:!!(c.pill&&c.pill.visible)})}
 const z=iso((s.x+p.x)/2+.5,(s.y+p.y)/2+.5);cam.z=2.8;cam.x=z.x-innerWidth/2/cam.z;cam.y=z.y-innerHeight/2/cam.z;await __shot(OUT+'diag_pharmacy.png');
 info.pharmacy=samples}

return JSON.stringify(info,null,0);
})()
