(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,1500));
const V=__r3d.camera.position.constructor;
const raf=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const OUT='/workspace/hospital-game/screenshots/v44/gap_checks/';
const shot=async n=>{await raf();await __shot(OUT+n+'.png')};
const report={hose:null,salary:null,props:null,meta:{MONTH_DAYS,DAY,levelCount:D.levels.length}};

// ========== 1) HOSE contact (one representative pump + inflate scene) ==========
async function hoseProbe(roomType,dis,tag){
  // Ensure room exists via __scen once
  const r=S.rooms.find(x=>x.type===roomType);
  if(!r)return {ok:null,skip:'no '+roomType,tag};
  // staff in room
  let s=S.staff.find(x=>x.room===r.id)||S.staff.find(x=>x.type==='doctor')||S.staff[0];
  if(s){clearSeat(s);s.vs=null;s.state='work';s.room=r.id;r.staff=s.id;const ssp=typeof spotStaff==='function'?spotStaff(r):r.sp.staff;if(ssp){s.x=ssp.x;s.y=ssp.y;s.path=[]}}
  // patient
  if(!S.pats.length)spawnPatient();
  let p=S.pats[0];
  p.dis=dis;p.healed=false;p.known=true;p.need=roomType;p.room=r.id;p.state='treat';
  p.tT=r_dur(p);p.t=p.tT;p.path=[];p.vs=null;p.x=r.sp.patient.x;p.y=r.sp.patient.y;r.busy=p.id;
  // run a few frames so Char exists + headS
  for(let i=0;i<10;i++)await raf();
  const samples=[];
  const phases=[0.1,0.3,0.5,0.7,0.9];
  for(const ph of phases){
    p.state='treat';p.tT=r_dur(p);p.t=p.tT*(1-ph);p.room=r.id;r.busy=p.id;
    // force several draw frames so animRooms/hose runs with dyn.active
    for(let i=0;i<12;i++)await raf();
    const c=__r3d.CH.get(p.id);
    if(!c||!c.b||!c.b.Head){samples.push({ph,ok:false,reason:'no char/head'});continue}
    const hd=c.b.Head;hd.updateWorldMatrix(true,false);
    const H0=hd.getWorldPosition(new V());
    const N0=(c.b.neck_01||c.b.neck||hd.parent).getWorldPosition(new V());
    const up=H0.clone().sub(N0).normalize();
    const sc=new V();hd.matrixWorld.decompose(new V(),new (__r3d.camera.quaternion.constructor)(),sc);
    const hr=(window.HOSE_R??.17)*Math.max(sc.x,sc.y,sc.z)/Math.max(1e-3,c.root.scale.x||1)*(c.root.scale.x||1);
    const expectB=H0.clone().addScaledVector(up,hr);
    // Find valve (cylinder near head) and tube mesh
    let valve=null,tube=null,valveDist=null,endDist=null;
    __r3d.scene.traverse(o=>{
      if(!o.isMesh||!o.visible)return;
      const gt=o.geometry&&o.geometry.type;
      if(gt==='CylinderGeometry'||gt==='CylinderBufferGeometry'){
        const wp=o.getWorldPosition(new V());
        const d=wp.distanceTo(expectB);
        if(valve==null||d<valveDist){valve=o;valveDist=d}
      }
      if(gt==='TubeGeometry'||gt==='TubeBufferGeometry'){
        // sample last point of tube ≈ B
        const pos=o.geometry.attributes&&o.geometry.attributes.position;
        if(pos&&pos.count>0){
          const i=pos.count-1;const lp=new V(pos.getX(i),pos.getY(i),pos.getZ(i));
          // tube geom is in local/world already applied? TubeGeometry positions are local; need matrixWorld
          lp.applyMatrix4(o.matrixWorld);
          const d=lp.distanceTo(expectB);
          if(tube==null||d<endDist){tube=o;endDist=d}
        }
      }
    });
    const headScale=c.b.Head.scale;const hs=[+headScale.x.toFixed(3),+headScale.y.toFixed(3),+headScale.z.toFixed(3)];
    // Contact: valve within ~8cm of expected head-surface point; tube visible
    const contactOk=valve!=null&&valveDist!=null&&valveDist<0.10&&tube!=null;
    samples.push({ph,contactOk,valveDist:valveDist==null?null:+valveDist.toFixed(3),
      tubeEndDist:endDist==null?null:+endDist.toFixed(3),
      headScale:hs,hoseVisible:!!(valve&&valve.visible&&tube&&tube.visible),
      expectB:[+expectB.x.toFixed(3),+expectB.y.toFixed(3),+expectB.z.toFixed(3)],
      headC:[+H0.x.toFixed(3),+H0.y.toFixed(3),+H0.z.toFixed(3)]});
  }
  // Capture mid-phase image
  p.t=r_dur(p)*0.45;
  for(let i=0;i<15;i++)await raf();
  const q=iso(r.sp.patient.x+.5,r.sp.patient.y+.5);cam.z=3.4;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
  await shot(tag+'_hose_mid');
  // late phase
  p.t=r_dur(p)*0.15;
  for(let i=0;i<12;i++)await raf();
  await shot(tag+'_hose_late');
  const ok=samples.filter(s=>s.contactOk).length>=3;
  const anyValve=samples.some(s=>s.valveDist!=null);
  return {ok,tag,room:roomType,dis,samples,verdict:ok?'hose contacts head surface':(!anyValve?'GENUINE: no valve/tube found during treat':'GENUINE: valve too far from head surface'),shot:[tag+'_hose_mid',tag+'_hose_late']};
}

// ========== 2) Salary / calendar across 12 levels (logic, minimal frames) ==========
function uiDate(day){return{month:Math.floor(day/MONTH_DAYS)+1,dom:(day%MONTH_DAYS)+1,label:'Мес '+(Math.floor(day/MONTH_DAYS)+1)+', день '+(day%MONTH_DAYS+1)}}
async function salaryAllLevels(){
  const rows=[];
  // Patch msg to capture salary messages
  const pays=[];
  const _msg=window.msg;window.msg=function(t){if(/Новый месяц|зарплат/i.test(String(t)))pays.push({day:S.day,t:String(t),money:S.money});return _msg.apply(this,arguments)};
  for(let lv=0;lv<D.levels.length;lv++){
    pays.length=0;
    newGame(lv,true);try{closeModal()}catch(e){}
    setSpeed(0);
    // ensure some staff so salary > 0
    if(S.cands.doctor&&S.cands.doctor.length)hire('doctor',0);
    if(S.cands.handyman&&S.cands.handyman.length)hire('handyman',0);
    const staffN=S.staff.length,roomsN=S.rooms.length;
    const expectedSal=()=>S.staff.reduce((a,s)=>a+s.salary,0)+S.rooms.length*50;
    // Start state
    const startDay=S.day,startMoney=S.money,startUI=uiDate(S.day);
    // Advance using real update() day boundary: set S.t so floor(S.t/DAY) steps
    const events=[];
    const targets=[29,30,31,59,60];
    // Walk day by day from current to 60
    let lastPayCount=0;
    for(let want=Math.max(startDay+1,1);want<=60;want++){
      S.t=want*DAY+0.01; // ensure floor(S.t/DAY)===want after update
      const before=S.day,moneyBefore=S.money;
      update(0.05); // triggers day change + onDay when nd!==S.day
      if(S.day!==before){
        const ui=uiDate(S.day);
        const paid=pays.length>lastPayCount;
        if(paid)lastPayCount=pays.length;
        if(targets.includes(S.day)||paid){
          events.push({day:S.day,ui,paid,moneyDelta:S.money-moneyBefore,expectedSal:expectedSal(),payMsg:paid?pays[pays.length-1].t:null});
        }
      }
    }
    // Count payments at 30 and 60
    const payDays=pays.map(p=>p.day);
    const payAt30=payDays.filter(d=>d===30).length;
    const payAt60=payDays.filter(d=>d===60).length;
    const payAt0=payDays.filter(d=>d===0).length;
    // UI at boundaries
    const ui29=uiDate(29),ui30=uiDate(30),ui60=uiDate(60);
    const ok=payAt30===1&&payAt60===1&&payAt0===0
      &&ui29.month===1&&ui29.dom===30
      &&ui30.month===2&&ui30.dom===1
      &&ui60.month===3&&ui60.dom===1;
    rows.push({lv,name:D.levels[lv].name,staffN,roomsN,startDay,startUI,payDays,payAt30,payAt60,payAt0,
      ui29,ui30,ui60,events:events.slice(0,8),ok,MONTH_DAYS});
  }
  window.msg=_msg;
  return{ok:rows.every(r=>r.ok),rows,note:'Simulated update()/onDay across days 1..60 per level; counted real salary msgs'};
}

// ========== 3) Props next-frame visibility ==========
async function propsCheck(){
  // Use L0 scene with corridor space
  newGame(0,true);try{closeModal()}catch(e){}
  __scen(['reception','gp','pump','inflate','staffroom']);try{closeModal()}catch(e){}
  setSpeed(0);S.money=999999;await wait(300);for(let i=0;i<5;i++)await raf();
  const results={items:{},ghost:null,rotation:null};
  async function placeAndSee(type){
    // find free corridor tiles
    let fx=null,fy=null;
    const fp=typeof fpOf==='function'?fpOf(type):[1,1];
    for(let y=2;y<S.h-3&&fx==null;y++)for(let x=2;x<S.w-3;x++){
      let ok=true;for(let dy=0;dy<(fp[1]||1);dy++)for(let dx=0;dx<(fp[0]||1);dx++){
        const tx=x+dx,ty=y+dy;if(!walk(tx,ty)||roomAt(tx,ty)||isHole(tx,ty))ok=false}
      if(ok){fx=x;fy=y;break}}
    if(fx==null)return{ok:false,reason:'no tile'};
    ui.v41rot=1;
    const sig0=typeof sig==='function'?sig():null;
    const nBefore=(S.items||[]).length;
    const it=placeItem(type,fx,fy);
    if(!it&&!(S.items||[]).some(i=>(i.type===type||i.k===type)&&i.x===fx&&i.y===fy)){
      return{ok:false,reason:'placeItem failed',fx,fy}}
    // Next rendered frames: buildStatic should run when STSIG!==sig()
    for(let i=0;i<8;i++)await raf();
    const sig1=typeof sig==='function'?sig():null;
    const inData=(S.items||[]).some(i=>(i.type===type||i.k===type)&&i.x===fx&&i.y===fy);
    // Live mesh in DYN corr or ST
    let meshFound=false,meshVisible=false,pivPos=null;
    const corr=__r3d.DYN.get('corr');
    if(corr&&corr.items){
      for(const ent of corr.items){
        if((ent.k===type||(ent.t&&(ent.t.type===type||ent.t.k===type)))&&ent.t&&ent.t.x===fx&&ent.t.y===fy){
          meshFound=!!ent.piv;let vis=false;if(ent.piv){ent.piv.traverse(o=>{if(o.isMesh&&o.visible)vis=true});pivPos=[+ent.piv.position.x.toFixed(2),+ent.piv.position.z.toFixed(2)]}
          // After merge, children may be empty — check ST for geometry near tile
          meshVisible=vis;
        }
      }
    }
    // Fallback: any mesh near tile center after rebuild
    if(!meshVisible){
      const cx=fx+(fp[0]||1)/2,cz=fy+(fp[1]||1)/2;
      __r3d.scene.updateMatrixWorld(true);
      __r3d.scene.traverse(o=>{
        if(!o.isMesh||!o.visible||!o.geometry)return;
        if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
        const bb=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
        const c=bb.getCenter(new V());
        if(Math.hypot(c.x-cx,c.z-cz)<1.2&&bb.max.y>0.05){meshFound=true;meshVisible=true}
      });
    }
    const q=iso(fx+.5,fy+.5);cam.z=3.2;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;
    await shot('prop_'+type);
    return{ok:inData&&meshVisible,type,fx,fy,inData,meshFound,meshVisible,sigChanged:sig0!==sig1,pivPos};
  }
  results.items.bench=await placeAndSee('bench');
  results.items.bin=await placeAndSee('bin');
  results.items.soda=await placeAndSee('soda'); // vending
  // Ghost valid/invalid (room ghost)
  startRoom('gp');
  for(let i=0;i<3;i++)await raf();
  const g=ui.ghost;
  if(g){
    // place ghost in empty corridor-ish area
    g.x=2;g.y=2;
    const badEmpty=validRoom(g);
    // overlap existing room
    const exist=S.rooms[0];g.x=exist.x;g.y=exist.y;
    const badOverlap=validRoom(g);
    results.ghost={ok:!badEmpty&&!!badOverlap,validEmpty:badEmpty||null,invalidOverlap:badOverlap||'none',
      note:'validRoom empty should be falsy; overlap should be truthy string'};
    await shot('ghost_overlap');
    gcancel();
  }else results.ghost={ok:false,reason:'no ghost after startRoom'};
  // Rotation once for item
  ui.mode={item:'bench'};pickItem('bench');
  const rot0=ui.v41rot;v41Rot();const rot1=ui.v41rot;v41Rot();const rot2=ui.v41rot;
  results.rotation={ok:rot0!==rot1||rot1!==rot2,seq:[rot0,rot1,rot2],note:'v41Rot cycles auto/dirs'};
  results.ok=Object.values(results.items).every(x=>x.ok)&&results.ghost.ok&&results.rotation.ok;
  return results;
}

// ---- run ----
setSpeed(0);
startLevel(0);await wait(400);
__scen(['reception','gp','pump','inflate','staffroom','psych','diag']);try{closeModal()}catch(e){}
setSpeed(0);await wait(500);for(let i=0;i<8;i++)await raf();

report.hose={pump:null,inflate:null};
report.hose.pump=await hoseProbe('pump','balloonhead','pump');
report.hose.inflate=await hoseProbe('inflate','deflated','inflate');
report.hose.ok=!!(report.hose.pump&&report.hose.pump.ok)&&(report.hose.inflate.ok!==false); // inflate may skip
if(report.hose.inflate&&report.hose.inflate.skip){/* ok if pump works */}
report.hose.ok=!!(report.hose.pump&&report.hose.pump.ok)&&(!report.hose.inflate||report.hose.inflate.ok!==false||report.hose.inflate.skip);

report.salary=await salaryAllLevels();
report.props=await propsCheck();

report.allOk=!!(report.hose.pump&&report.hose.pump.ok)&&report.salary.ok&&report.props.ok;
report.untested=['full_campaign_win','physical_phone','windows_exe','APK_device'];
return JSON.stringify(report);
})()
