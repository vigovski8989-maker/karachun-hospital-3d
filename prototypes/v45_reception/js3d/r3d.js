// v38: 3D-рендер для полной игры. Логика/UI/ввод/сохранения — из 2D-игры без изменений; здесь подменяется только draw().
// Ортокамера: азимут 45°, возвышение 30° (sin=HH/HW=.5) => пол 3D совпадает с iso() 2D, toWorld()/tap() работают как раньше.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {clone as skClone} from 'three/addons/utils/SkeletonUtils.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeFurn,mat,GRAD,TEX,receptionWindow,receptionEntrance,clinicPlanter,consultSign,consultPoster} from './furn.js';
// PERF45: exact batched CPU skin sampling. Same float operations and order as THREE.SkinnedMesh.applyBoneTransform;
// bone matrices are only read inside one batch, so each bone product (matrixWorld*boneInverse) is computed once per batch instead of per vertex influence.
const SK45=new WeakMap(),_sk45v=new THREE.Vector3(),_sk45w=new THREE.Vector4(),_sk45i=new THREE.Vector4();let SK45stamp=0;
function sk45mesh(m){const g=m.geometry,P=g.attributes.position,SI=g.attributes.skinIndex,SW=g.attributes.skinWeight;let k=SK45.get(m);
 if(!k||k.g!==g||k.pv!==P.version||k.iv!==SI.version||k.wv!==SW.version||!k.bm.equals(m.bindMatrix)){const n=P.count;k={g,pv:P.version,iv:SI.version,wv:SW.version,bm:m.bindMatrix.clone(),ok:new Uint8Array(n),b:new Float64Array(3*n),w:new Float64Array(4*n),ix:new Float64Array(4*n),st:-1,cur:null,pool:[]};SK45.set(m,k)}return k}
function skinPts45(list){const stamp=++SK45stamp,out=new Array(list.length);
 for(let n=0;n<list.length;n++){const m=list[n].m,i=list[n].i,k=sk45mesh(m),sk=m.skeleton,g=m.geometry;
  if(k.st!==stamp){k.st=stamp;k.cur=new Array(sk.bones.length)}
  if(!k.ok[i]){_sk45v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(m.bindMatrix);k.b[3*i]=_sk45v.x;k.b[3*i+1]=_sk45v.y;k.b[3*i+2]=_sk45v.z;_sk45i.fromBufferAttribute(g.attributes.skinIndex,i);_sk45w.fromBufferAttribute(g.attributes.skinWeight,i);for(let t=0;t<4;t++){k.ix[4*i+t]=_sk45i.getComponent(t);k.w[4*i+t]=_sk45w.getComponent(t)}k.ok[i]=1}
  const v=new THREE.Vector3(0,0,0),bx=k.b[3*i],by=k.b[3*i+1],bz=k.b[3*i+2];
  for(let t=0;t<4;t++){const w=k.w[4*i+t];if(w!==0){const r=k.ix[4*i+t];let M=k.cur[r];if(!M){M=k.pool[r]||(k.pool[r]=new THREE.Matrix4());M.multiplyMatrices(sk.bones[r].matrixWorld,sk.boneInverses[r]);k.cur[r]=M}v.addScaledVector(_sk45v.set(bx,by,bz).applyMatrix4(M),w)}}
  v.applyMatrix4(m.bindMatrixInverse);out[n]=v.applyMatrix4(m.matrixWorld)}
 return out}
// PERF45: meshes of one character that were cloned with identical bone lists/inverse-bind matrices share one Skeleton (one bone-matrix update + texture upload per character instead of per mesh).
function neutral45(f){const r=Math.random;Math.random=()=>.5;try{return f()}finally{Math.random=r}}
function shareSkeletons45(meshes){const groups=[];for(const x of meshes){if(!x.isSkinnedMesh)continue;const s=x.skeleton;const g=groups.find(q=>{const m=q[0].skeleton;return m.bones.length===s.bones.length&&m.bones.every((b,i)=>b===s.bones[i])&&m.boneInverses.every((M,i)=>M.equals(s.boneInverses[i]))});if(g)g.push(x);else groups.push([x])}
 for(const g of groups){if(g.length<2)continue;const master=g[0].skeleton;neutral45(()=>master.computeBoneTexture());for(const x of g){x.userData.drop45=x===g[0]?neutral45(()=>new THREE.Skeleton(master.bones,master.boneInverses)):x.skeleton;x.skeleton=master;x.onBeforeRender=x.onBeforeShadow=DROP45}}}
// Seeded QA determinism: three.js draws Math.random for every texture UUID; the dropped skeleton still creates (and immediately frees) its bone texture
// on the first render of its mesh, i.e. at the same point in the Math.random stream as without sharing. No effect on rendering or motion.
function DROP45(){const s=this.userData.drop45;if(s&&!s.tx45){s.tx45=true;s.computeBoneTexture();s.dispose()}}
const Q=new URLSearchParams(location.search);const LOWQ=Q.has('low')||localStorage.getItem('karachun_trial45_gfx')==='low';
const draw2D=window.draw;let READY=false;
let FAIL45=0;window.draw=function(){if(!READY||!S||!S.rooms||!S.h)return draw2D();try{draw3D();FAIL45=0}catch(e){console.error("3d",e.stack);window.__drawErr45=(window.__drawErr45||0)+1;if(Q.has('cap')||++FAIL45>=30)READY=false}};
// ---------- renderer ----------
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:Q.has('cap')});
let DPR=Math.min(devicePixelRatio,LOWQ?1:1.75);renderer.setPixelRatio(DPR);
// PERF45: adaptive resolution. Only when frames are slow AND the JS frame work is well below the frame interval (=GPU/fill bound) the 3D canvas
// resolution steps down by 0.125 (not below 1.5, or 1 in low mode); it steps back up when frames are fast again. Disabled for QA captures (?cap).
const DPRMAX45=DPR,DPRMIN45=Math.min(DPR,LOWQ?1:1.5),AD45={last:0,n:0,iv:0,busy:0,chg:0};
function adaptDpr45(now,busy){if(Q.has('cap'))return;const iv=now-AD45.last;AD45.last=now;if(!(iv>0&&iv<250))return;AD45.n++;AD45.iv+=iv;AD45.busy+=busy;if(AD45.n<60)return;const mi=AD45.iv/AD45.n,mb=AD45.busy/AD45.n;AD45.n=0;AD45.iv=0;AD45.busy=0;if(now-AD45.chg<1500)return;
 let d=DPR;if(mi>22&&mb<.6*mi&&DPR>DPRMIN45)d=Math.max(DPRMIN45,DPR-.125);else if(mi<17.6&&DPR<DPRMAX45)d=Math.min(DPRMAX45,DPR+.125);if(d!==DPR){DPR=d;AD45.chg=now;renderer.setPixelRatio(DPR);renderer.setSize(innerWidth,innerHeight)}}renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=!LOWQ;
// PERF45: phones use hardware 2x2 PCF instead of PCFSoft (A/B on a full hospital frame: 5 of 1,049,049 pixels differ by >16/255).
const MOB45=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);renderer.shadowMap.type=MOB45?THREE.PCFShadowMap:THREE.PCFSoftShadowMap;
const el=renderer.domElement;el.id='c3';Object.assign(el.style,{position:'fixed',left:0,top:0,zIndex:0,pointerEvents:'none'});document.body.insertBefore(el,document.body.firstChild);
const cv2=document.getElementById('c');cv2.style.background='transparent';cv2.style.position=cv2.style.position||'fixed';
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight)});
const scene=new THREE.Scene();scene.background=new THREE.Color(0x6f9a5c);
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,400);
scene.add(new THREE.HemisphereLight(0xfff8ee,0x6a7a88,.9));const sun=new THREE.DirectionalLight(0xfff1d6,1.85);sun.position.set(6,18,7);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.near=.5;sun.shadow.camera.far=80;sun.shadow.camera.left=-28;sun.shadow.camera.right=28;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-28;sun.shadow.bias=-0.00025;sun.shadow.normalBias=.035;scene.add(sun);scene.add(sun.target);
const fill=new THREE.DirectionalLight(0xd7e6ff,.45);fill.position.set(-8,7,-5);scene.add(fill);
const rim=new THREE.DirectionalLight(0xffe6c0,.32);rim.position.set(1,4,-9);scene.add(rim);
const winFill=new THREE.DirectionalLight(0xcfe8ff,.35);winFill.position.set(-2,5,10);scene.add(winFill);
const SPX=32*Math.SQRT2;            // пикселей (при cam.z=1) на 1 м по горизонтали
const DIRV=new THREE.Vector3(Math.cos(Math.PI/6)/Math.SQRT2,Math.sin(Math.PI/6),Math.cos(Math.PI/6)/Math.SQRT2);
function syncCam(){if(Q.has('cap')&&window.__holdCam3)return;const W=innerWidth,H=innerHeight;const c=toWorld(W/2,H/2);const T=new THREE.Vector3(c.x,0,c.y);
 camera.position.copy(T).addScaledVector(DIRV,150);camera.lookAt(T);const k=1/(cam.z*SPX);camera.left=-W/2*k;camera.right=W/2*k;camera.top=H/2*k;camera.bottom=-H/2*k;camera.updateProjectionMatrix()}
// ---------- загрузка моделей ----------
const draco=new DRACOLoader().setDecoderPath('./lib/draco/');const L=new GLTFLoader().setDRACOLoader(draco);const ld=u=>new Promise((r,j)=>L.load(u,r,undefined,j));
const ROLES=['doctor','nurse','orderly','receptionist','bighead','invisible','rocker','mummy','patient_a'];
const [anG,prG,...rest]=await Promise.all([ld('models/anims.glb'),ld('models/props.glb'),...ROLES.map(r=>ld(`models/${r}.glb`))]);
const G={};ROLES.forEach((r,i)=>G[r]=rest[i]);
// Staged asset profile: actual Jog diseases only; global rollout blocked by deflated stop regression.
const SHOE33={patient_a:await ld('models/v45/patient_a_shoe_skin33.glb')};
const PROPS={};for(const o of prG.scene.children)PROPS[o.name]=o;
function toon(m){const t=new THREE.MeshToonMaterial({map:m.map,normalMap:LOWQ?null:m.normalMap,color:m.color,gradientMap:GRAD,transparent:m.transparent,opacity:m.opacity,side:m.side});if(m.normalMap)t.normalScale=new THREE.Vector2(.6,.6);return t}
const OUTM=new THREE.MeshBasicMaterial({color:0x1d1820,side:THREE.BackSide});OUTM.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <project_vertex>','transformed+=normalize(objectNormal)*0.0055;\n#include <project_vertex>')};
const ualPel=anG.scene.getObjectByName('pelvis').position.clone();const clipCache=new Map();
function clipsFor(pel){const k=pel.y.toFixed(3);if(clipCache.has(k))return clipCache.get(k);const s=pel.y/ualPel.y;const out=anG.animations.map(c=>{const cc=c.clone();cc.tracks=cc.tracks.filter(t=>!t.name.endsWith('.scale'));for(const t of cc.tracks)if(t.name==='pelvis.position'){const v=t.values;for(let i=0;i<v.length;i++)v[i]*=s}return cc});clipCache.set(k,out);return out}
// Preview-only patient locomotion retarget. Model bind translations are anatomy, not animation data.
const PATIENT_CLIPS=new Map();
function patientClips(c){
 const old=clipsFor(c.b.pelvis.position);if(!['patient_a','rocker','bighead','mummy','invisible'].includes(c.role))return old;
 c.anatomicalGait=true;const key=c.profile33+(c.actionAnatomy24?":seated24":"");if(PATIENT_CLIPS.has(key))return PATIENT_CLIPS.get(key);
 c.root.updateMatrixWorld(true);anG.scene.updateMatrixWorld(true);const src={};anG.scene.traverse(b=>{if(b.isBone)src[b.name]=b});
 const V=THREE.Vector3,Q=THREE.Quaternion,srcHeight=src.pelvis.getWorldPosition(new V()).y-anG.scene.getWorldPosition(new V()).y,dstHeight=c.b.pelvis.getWorldPosition(new V()).y-c.m.getWorldPosition(new V()).y,scale=dstHeight/srcHeight;
 const out=old.map(oldClip=>{if(!['Idle_Loop','Idle_Talking_Loop','Walk_Loop','Walk_Formal_Loop','Jog_Fwd_Loop',...(c.actionAnatomy24?['Sitting_Idle_Loop','Sitting_Talking_Loop']:[])].includes(oldClip.name))return oldClip;const clip=anG.animations.find(x=>x.name===oldClip.name).clone();clip.tracks=clip.tracks.filter(t=>!t.name.endsWith('.scale'));
 for(const t of clip.tracks){const dot=t.name.lastIndexOf('.'),name=t.name.slice(0,dot),prop=t.name.slice(dot+1),ss=src[name],dd=c.b[name];if(!ss||!dd)continue;
  if(prop==='position'){const base=dd.position.toArray(),sb=ss.position.toArray();for(let i=0;i<t.values.length;i+=3)for(let j=0;j<3;j++)t.values[i+j]=base[j]+(name==='pelvis'||name==='root'?(t.values[i+j]-sb[j])*scale:0)}
  if(prop==='quaternion'){const pre=dd.parent.getWorldQuaternion(new Q()).invert().multiply(ss.parent.getWorldQuaternion(new Q())),post=ss.getWorldQuaternion(new Q()).invert().multiply(dd.getWorldQuaternion(new Q()));for(let i=0;i<t.values.length;i+=4){const q=new Q().fromArray(t.values,i);q.premultiply(pre).multiply(post).normalize();q.toArray(t.values,i)}}
 }
 return clip});PATIENT_CLIPS.set(key,out);return out;
}
function patientNeutralGround(c){
 const V=THREE.Vector3;let y=Infinity;c.root.updateMatrixWorld(true);for(const m of c.meshes.filter(m=>m.isSkinnedMesh&&m.visible)){m.skeleton.update();const g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;for(let i=0;i<si.count;i++){let w=0;for(let j=0;j<4;j++)if(/^(foot|ball)_[lr]$/.test(m.skeleton.bones[si.getComponent(i,j)].name))w+=sw.getComponent(i,j);if(w>.5){const v=new V().fromBufferAttribute(g.attributes.position,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);y=Math.min(y,v.y)}}}return Math.max(0,.003-y);
}
// Phase24: actual retargeted seated skin, not foreign pelvis/ankle registration.
const SEAT24=new Map();
// Phase36: a garment hem rigidly bound to the pelvis is not buttock/thigh seat skin. Pelvis-dominant skin whose BIND height is
// below the bind hip->knee midpoint is excluded from cushion support (body buttock skin of all rigs ends 83mm under the hip joint).
function seatHem36(o,i){const g=o.geometry,sk=o.skeleton;let wp=0;for(let j=0;j<4;j++)if(sk.bones[g.attributes.skinIndex.getComponent(i,j)].name==='pelvis')wp+=g.attributes.skinWeight.getComponent(i,j);if(wp<.5)return false;const bindY=n=>{const k=sk.bones.findIndex(b=>b.name===n);return new THREE.Matrix4().copy(sk.boneInverses[k]).invert().elements[13]},mid=(bindY('thigh_l')+bindY('calf_l'))/2;return g.attributes.position.getY(i)<mid}
function seatedTemplate24(c){
 if(SEAT24.has(c.profile33))return SEAT24.get(c.profile33);const m=skClone(c.m),b={};m.position.set(0,c.neutralGround,0);m.traverse(o=>{if(o.isBone)b[o.name]=o});const mix=new THREE.AnimationMixer(m),a=mix.clipAction(c.A.Sitting_Idle_Loop.getClip());a.play();a.time=.5;mix.update(0);m.updateMatrixWorld(true);const V=THREE.Vector3,H=b.pelvis.getWorldPosition(new V()),points=[],surface=[];
 m.traverse(o=>{if(!o.isSkinnedMesh||!o.visible||o.material===OUTM)return;o.skeleton.update();const g=o.geometry;for(let i=0;i<g.attributes.position.count;i++){let w=0;for(let j=0;j<4;j++)if(/^(pelvis|thigh_[lr])$/.test(o.skeleton.bones[g.attributes.skinIndex.getComponent(i,j)].name))w+=g.attributes.skinWeight.getComponent(i,j);if(w<.5||seatHem36(o,i))continue;const v=new V().fromBufferAttribute(g.attributes.position,i);o.applyBoneTransform(i,v);v.applyMatrix4(o.matrixWorld);surface.push({m:o,i});if(Math.abs(v.x-H.x)<.24&&v.z-H.z>-.16&&v.z-H.z<.12&&v.y>H.y-.18&&v.y<H.y-.025)points.push({mesh:o.name,index:i,p:v.toArray()})}});
 if(!points.length)throw Error('No anatomical seated support skin '+c.role);const min=Math.min(...points.map(x=>x.p[1])),patch=points.filter(x=>x.p[1]<min+.012),z=patch.reduce((a,x)=>a+x.p[2],0)/patch.length;const out={minSkin:min,forward:-z,vertical:.502-min,patch,hip:H.toArray(),legs:Object.fromEntries(['l','r'].map(side=>{const H=b['thigh_'+side].getWorldPosition(new V()),K=b['calf_'+side].getWorldPosition(new V()),F=b['foot_'+side].getWorldPosition(new V());return[side,{hip:H.toArray(),ankle:F.toArray(),a:H.distanceTo(K),b:K.distanceTo(F)}]}))};const meshes=[];m.traverse(o=>{if(o.isSkinnedMesh&&o.visible&&o.material!==OUTM)meshes.push(o)});const fake={root:m,m,b,meshes,yaw:0},initialFeet=gaitFeet(fake);out.contactIterations=[];
 for(let iteration=0;iteration<8;iteration++){m.position.y=c.neutralGround+out.vertical;m.updateMatrixWorld(true);for(const side of ['l','r']){const leg=out.legs[side],f=initialFeet[side],x=side==='l'?.13:-.13,ankleY=f.p.y+.003-f.minY,vertical=leg.hip[1]+out.vertical-ankleY,lateral=x-leg.hip[0],d2=leg.a*leg.a+leg.b*leg.b-2*leg.a*leg.b*Math.cos(115*Math.PI/180),h2=d2-vertical*vertical-lateral*lateral;if(h2<=0){window.__seatFailure34={role:c.role,iteration,side,hip:leg.hip,registration:out.vertical,ankleY,vertical,lateral,d2,h2,minSkin:min,points,initialFeet:Object.fromEntries(Object.entries(initialFeet).map(([s,f])=>[s,{p:f.p.toArray(),minY:f.minY}]))};throw Error('Invalid template seat geometry '+JSON.stringify(window.__seatFailure34));}const T=new V(x,ankleY,leg.hip[2]+Math.sqrt(h2));if(!gaitAimFoot(fake,side,T,f.q,f.ball))throw Error('Unreachable template seat '+c.role)}
 let ymin=Infinity,count=0;for(const o of meshes)o.skeleton.update();for(const {m:o,i}of surface){const v=new V().fromBufferAttribute(o.geometry.attributes.position,i);o.applyBoneTransform(i,v);v.applyMatrix4(o.matrixWorld);if(Math.abs(v.x)<.225&&Math.abs(v.z+out.forward)<.215&&v.y>.3&&v.y<.75){ymin=Math.min(ymin,v.y);count++}}if(!count)throw Error('No visible seated cushion overlap '+c.role);const delta=.502-ymin;out.contactIterations.push({iteration,registration:out.vertical,actualCushionSkinMin:ymin,vertices:count,delta});if(Math.abs(delta)<.00005)break;out.vertical+=delta;
 }SEAT24.set(c.profile33,out);mix.stopAllAction();mix.uncacheRoot(m);return out;
}
// Phase19: calm lower-body target from an existing authored upright formal pose, not combat-idle foot spread.
const CALM19=new Map();
function calmPose19(c){
 if(CALM19.has(c.profile33))return CALM19.get(c.profile33);const m=skClone(c.m);m.position.set(0,c.neutralGround,0);m.rotation.set(0,0,0);const b={},meshes=[];m.traverse(o=>{if(o.isBone)b[o.name]=o;if(o.isSkinnedMesh&&o.visible)meshes.push(o)});m.updateMatrixWorld(true);const V=THREE.Vector3,Q=THREE.Quaternion,bindP=b.pelvis.getWorldPosition(new V()),bindQ=b.pelvis.quaternion.clone(),bindFeet={};for(const z of ['l','r'])bindFeet[z]={p:b['foot_'+z].getWorldPosition(new V()),q:b['foot_'+z].getWorldQuaternion(new Q()),ball:b['ball_'+z].getWorldQuaternion(new Q())};
 const mix=new THREE.AnimationMixer(m),clip=c.A.Walk_Formal_Loop.getClip(),a=mix.clipAction(clip);a.play();a.time=clip.duration/3;mix.update(0);m.updateMatrixWorld(true);const height=b.pelvis.getWorldPosition(new V()).y;bindP.y=height;b.pelvis.position.copy(b.pelvis.parent.worldToLocal(bindP));b.pelvis.quaternion.copy(bindQ);m.updateMatrixWorld(true);const fake={root:m,m,b,meshes,yaw:0};
 for(const z of ['l','r']){const f=bindFeet[z],q=new Q().setFromAxisAngle(UP,z==='l'?.09:-.09),T=f.p.clone();T.x=z==='l'?.13:-.13;T.z=.065;const fq=q.clone().multiply(f.q),bq=q.clone().multiply(f.ball);if(!gaitAimFoot(fake,z,T,fq,bq))throw Error('Calm neutral outside anatomical reach '+c.role+' '+z);let g=gaitFeet(fake)[z];T.y+=.003-g.minY;if(!gaitAimFoot(fake,z,T,fq,bq))throw Error('Calm grounded target outside reach '+c.role+' '+z)}
 const pose={pelvisPosition:b.pelvis.position.clone(),rotations:Object.fromEntries(['pelvis','thigh_l','calf_l','foot_l','ball_l','thigh_r','calf_r','foot_r','ball_r'].map(n=>[n,b[n].quaternion.clone()])),authoredHeight:height};CALM19.set(c.profile33,pose);return pose;
}
function calmIdleAction19(c,n){const pose=calmPose19(c),clip=c.A[n].getClip().clone();for(const t of clip.tracks){if(t.name==='pelvis.position')for(let i=0;i<t.values.length;i+=3)pose.pelvisPosition.toArray(t.values,i);const bone=t.name.replace('.quaternion','');if(t.name.endsWith('.quaternion')&&pose.rotations[bone])for(let i=0;i<t.values.length;i+=4)pose.rotations[bone].toArray(t.values,i)}c.A[n].stop();const a=c.mix.clipAction(clip);a.enabled=true;a.setEffectiveWeight(0);a.play();c.A[n]=a;}
const angd=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),UP=new THREE.Vector3(0,1,0);
function rotWorld(b,axis,ang){if(!ang)return;b.parent.getWorldQuaternion(_q2);_q.setFromAxisAngle(axis,ang);const inv=_q2.clone().invert();b.quaternion.premultiply(inv.multiply(_q).multiply(_q2));b.updateMatrixWorld(true)}
const SHM=new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.22,depthWrite:false});const SHG=new THREE.CircleGeometry(.36,20).rotateX(-Math.PI/2);
const STRIDE={};
// PERF45: eyes/lids/brows, buttons, badge, placket, collar band and cuffs lie inside the head/body silhouette and are below one shadow-map texel; they still render, only their duplicate shadow-pass draw is skipped.
const NOCAST45=/^(Eyes|Eyelids|Eyebrows|Uniform_Button\d*|Uniform_Placket|Uniform_CollarBand|Uniform_Cuff_[lr]|Reception_Badge\w*)$/;
// ---------- персонаж (порт Char v37: скин-модель, ретаргет клипов, процедурные слои, пропсы) ----------
class Char{constructor(role,o={}){const g=o.shoeContact33?SHOE33[role]:G[role];this.shoeContact33=!!o.shoeContact33;this.profile33=role+(this.shoeContact33?':shoe33':'');this.role=role;this.root=new THREE.Group();this.tilt=new THREE.Group();this.root.add(this.tilt);this.m=skClone(g.scene);this.tilt.add(this.m);scene.add(this.root);
  this.actionAnatomy24=!!o.actionAnatomy24;this.b={};this.meshes=[];this.m.traverse(x=>{if(x.isBone)this.b[x.name]=x;if(x.isMesh)this.meshes.push(x)});shareSkeletons45(this.meshes);
  this.hs=o.head||1.3;this.b.Head.scale.setScalar(this.hs);for(const h of['hand_l','hand_r'])this.b[h].scale.setScalar(1.22);for(const f of['foot_l','foot_r'])this.b[f].scale.setScalar(1.1);
  for(const x of this.meshes){x.frustumCulled=false;x.material=toon(x.material);
   if(o.tint!=null&&/Clothes|Shirt|Top|Super/i.test(x.name)){x.material.color=new THREE.Color().setHSL(o.tint/360,.45,.62)}
   if(o.invisible&&!/Clothes/.test(x.name)){x.visible=false;continue}
   if(!LOWQ&&/Clothes|Super|Hair|Body/i.test(x.name)){const ol=new THREE.SkinnedMesh(x.geometry,OUTM);ol.bind(x.skeleton,x.bindMatrix);if(x.userData.drop45){ol.userData.drop45=x.userData.drop45;ol.onBeforeRender=ol.onBeforeShadow=DROP45}ol.frustumCulled=false;ol.morphTargetInfluences=x.morphTargetInfluences;x.parent.add(ol)}}
  const sh=new THREE.Mesh(SHG,SHM);sh.position.y=.012;sh.renderOrder=1;this.root.add(sh);this.shadow=sh;for(const x of this.meshes){x.castShadow=!NOCAST45.test(x.name);x.receiveShadow=true}
  this.mix=new THREE.AnimationMixer(this.m);this.A={};
  for(const c of patientClips(this)){const a=this.mix.clipAction(c);a.enabled=true;a.setEffectiveWeight(0);a.play();this.A[c.name]=a;if(/Enter|Exit|PickUp/.test(c.name)){a.setLoop(THREE.LoopOnce);a.clampWhenFinished=true}}
  if(this.anatomicalGait){this.neutralGround=patientNeutralGround(this);calmIdleAction19(this,'Idle_Loop');calmIdleAction19(this,'Idle_Talking_Loop');if(this.actionAnatomy24)this.seat24=seatedTemplate24(this);}this.cur=null;this.yaw=0;this.layer={};this.lw={};this.t=Math.random()*10;this.prev=null;this.vel=0;this.alpha=1;this.root.updateMatrixWorld(true);this.flatFeet=Object.fromEntries(['l','r'].map(s=>[s,this.b['foot_'+s].getWorldQuaternion(new THREE.Quaternion())]));}
 strideOf(n){if(n==='Jog_Fwd_Loop'&&this.jogMotion31)return this.jogMotion31.nominalSpeed;if(this.anatomicalGait&&n==='Walk_Loop')return 1.033714574*this.m.scale.z;const key=gaitProfileKey28(this)+n;if(STRIDE[key])return STRIDE[key];const m=skClone(this.m);m.position.set(0,this.neutralGround||0,0);m.rotation.set(0,0,0);const bones={};m.traverse(x=>{if(x.isBone)bones[x.name]=x});const clip=this.A[n].getClip(),mx=new THREE.AnimationMixer(m),aa=mx.clipAction(clip);aa.play();const N=80,zs=[];for(let i=0;i<=N;i++){aa.time=clip.duration*i/N;mx.update(0);m.updateMatrixWorld(true);const l=bones.ball_l.getWorldPosition(new THREE.Vector3()),r=bones.ball_r.getWorldPosition(new THREE.Vector3());zs.push(l.y<r.y?[0,l.z]:[1,r.z])}const v=[];for(let i=1;i<=N;i++)if(zs[i][0]===zs[i-1][0])v.push(Math.abs(zs[i][1]-zs[i-1][1])/(clip.duration/N));v.sort((a,b)=>a-b);mx.stopAllAction();mx.uncacheRoot(m);return STRIDE[key]=Math.max(.2,v.length?v[Math.floor(v.length*.6)]:1)}
 play(n,fade=.3){if(this.actionAnatomy24&&this.ent?.vs?.pose==='sit'&&this.ent.vs.ph==='up'&&['Idle_Loop','Idle_Talking_Loop'].includes(n)&&this.cur?.startsWith('Sitting_'))fade=Math.max(.001,.75*(SEAT_T.sit||1.2)-this.ent.vs.t);const a=this.A[n];if(!a||this.cur===n)return;const initial20=this.anatomicalGait&&this.cur==null&&!this.gaitInitialAction20;if(initial20)this.gaitInitialAction20=true;if(this.cur==='v43lie'){for(const k in this.A)if(this.A[k]!==a)this.A[k].fadeOut(fade);this.cur=null;
 // Phase39: the bed transfer blend already carries the target clip at full weight; continue it instead of restarting it from zero weight (no standing pop between v43lie and sitdown/lie).
 if(a.isRunning()&&a.getEffectiveWeight()>.999){a.stopFading();this.cur=n;return}}const old=this.cur&&this.A[this.cur];a.reset();a.setEffectiveTimeScale(1);a.setEffectiveWeight(1);if(initial20)a.stopFading().play();else a.fadeIn(fade).play();if(old&&old!==a)old.fadeOut(fade);this.cur=n}
 attach(name,bone,pos,rot=[0,0,0],sc=1){const p=PROPS[name].clone();const bn=this.b[bone];this.root.position.set(0,0,0);this.root.rotation.set(0,0,0);this.tilt.rotation.set(0,0,0);this.root.updateMatrixWorld(true);const bp=bn.getWorldPosition(new THREE.Vector3());
  p.position.copy(bp).add(new THREE.Vector3(...pos));p.rotation.set(...rot);p.scale.setScalar(sc);this.root.add(p);this.root.updateMatrixWorld(true);bn.attach(p);(this.props??={})[name]=p;return p}
 layers(dt){for(const n in this.layer){this.lw[n]??=0;this.lw[n]+=(this.layer[n]-this.lw[n])*Math.min(1,dt*(n==='reach39'?9:3))}const fw=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)),rt=new THREE.Vector3().crossVectors(UP,fw),b=this.b,t=this.t;
  if(this.soft){rotWorld(b.Head,rt,-this.soft*.15);if(this.role!=='receptionist'){rotWorld(b.clavicle_l,fw,-.08);rotWorld(b.clavicle_r,fw,.08)}}
  const wr=this.lw.write||0;if(wr>.01&&this.role!=='receptionist'){const ty=Math.sin(t*11),tz=Math.sin(t*9+1.7);rotWorld(b.upperarm_r,rt,-.22*wr);rotWorld(b.lowerarm_r,rt,(-.28+.05*ty)*wr);rotWorld(b.hand_r,rt,(.15+.1*ty)*wr);rotWorld(b.upperarm_l,rt,-.2*wr);rotWorld(b.lowerarm_l,rt,(-.26+.05*tz)*wr);rotWorld(b.hand_l,rt,(.15+.1*tz)*wr);rotWorld(b.Head,rt,-.12*wr)}
  const gr=this.lw.greet||0;if(gr>.01){
    let look=0;
    if(this.lookPat){
      const dx=this.lookPat.x+.5-this.root.position.x,dz=this.lookPat.y+.5-this.root.position.z;
      look=THREE.MathUtils.clamp(angd(Math.atan2(dx,dz),this.yaw),-.50,.50);
    }
    this.recLookYaw=(this.recLookYaw||0)+(look-(this.recLookYaw||0))*Math.min(1,dt*6);
    rotWorld(b.Head,UP,this.recLookYaw*gr);
    rotWorld(b.Head,rt,(-.17+.31*(this.recNod||0))*gr);
    rotWorld(b.spine_02,UP,look*.28*gr);
  }
  if(this.recDesk)rotWorld(b.Head,rt,.16*(this.lw.deskType||0));
  const ex=this.lw.exam||0;if(ex>.01){const s=Math.sin(t*.9),c=Math.cos(t*.7);rotWorld(b.upperarm_r,rt,-(1.05+.08*s)*ex);rotWorld(b.upperarm_r,UP,(.35+.1*c)*ex);rotWorld(b.lowerarm_r,rt,-.55*ex);rotWorld(b.spine_02,rt,-.18*ex);rotWorld(b.Head,rt,-.2*ex)}
  const rc=this.lw.reach39||0;if(rc>.01&&this.reachT39&&b.upperarm_r&&b.lowerarm_r&&b.hand_r){const V=THREE.Vector3,T=new V(...this.reachT39),aim=(bone,child,w)=>{const P=bone.getWorldPosition(new V()),C=child.getWorldPosition(new V()),cur=C.sub(P).normalize(),des=T.clone().sub(P).normalize(),ax=new V().crossVectors(cur,des),sn=ax.length();if(sn<1e-6)return;rotWorld(bone,ax.multiplyScalar(1/sn),Math.atan2(sn,cur.dot(des))*w)};
   // lean the chest toward a target beyond arm's length (horizontal distance from the shoulder), then aim upper arm and forearm at the world target; hand follows the forearm.
   const S0=b.upperarm_r.getWorldPosition(new V()),dh=Math.hypot(T.x-S0.x,T.z-S0.z);if(b.spine_02)rotWorld(b.spine_02,rt,-Math.min(.35,Math.max(0,(dh-.45)*.7))*rc);rotWorld(b.Head,rt,-.18*rc);aim(b.upperarm_r,b.lowerarm_r,.9*rc);aim(b.lowerarm_r,b.hand_r,rc)}
  const ph=this.lw.phone||0;if(ph>.01){rotWorld(b.upperarm_r,rt,-.7*ph);rotWorld(b.upperarm_r,fw,.9*ph);rotWorld(b.lowerarm_r,rt,-2.2*ph);rotWorld(b.Head,fw,.18*ph)}
  const gv=this.giveK||0;if(gv>.01){rotWorld(b.upperarm_r,rt,-1.2*gv);rotWorld(b.upperarm_r,UP,.2*gv);rotWorld(b.lowerarm_r,rt,.35*gv);rotWorld(b.hand_r,rt,.2*gv);rotWorld(b.spine_02,rt,-.1*gv);rotWorld(b.Head,rt,-.1*gv)}
  const nd=this.nodK||0;if(nd>.01)rotWorld(b.Head,rt,-.18*nd*Math.max(0,Math.sin(t*6)));
  const tk=this.takeK||0;if(tk>.01){rotWorld(b.upperarm_r,rt,-1.0*tk);rotWorld(b.upperarm_r,UP,-.2*tk);rotWorld(b.lowerarm_r,rt,-.45*tk);rotWorld(b.Head,rt,-.08*tk)}
  const op=this.lw.operate||0;if(op>.01){rotWorld(b.upperarm_r,rt,-.9*op);rotWorld(b.lowerarm_r,rt,(-.6+.15*Math.sin(t*4))*op);rotWorld(b.upperarm_l,rt,-.8*op);rotWorld(b.lowerarm_l,rt,(-.7+.15*Math.cos(t*3.3))*op);rotWorld(b.spine_02,rt,-.12*op)}}
 dispose(){scene.remove(this.root);this.mix.stopAllAction()}}
function niceFace(c){c.root.traverse(x=>{if(!x.isMesh)return;if(x.name==='Eyebrows'){x.material=x.material.clone();x.material.color.set(0xb98a62)}if(x.name==='Hair_Buns'){x.material=x.material.clone();x.material.color.set(0xc49a72)}});c.soft=1}
/** v45: tame huge curly bob, readable friendly face, softer stylized PBR clothes — keeps rig/clips. */
function niceReceptionist(c){
  c.soft=.3; c.recDesk=1;c.recFingerRest={};for(const [name,b]of Object.entries(c.b))if(/index|middle|ring|pinky|thumb/.test(name))c.recFingerRest[name]=b.quaternion.clone();
  for(const side of ['r','l'])c.b['hand_'+side].scale.setScalar(1.04);
  // Mild head — readable face; new GLB already has friendly hair/clothes
  c.hs=1.20; if(c.b.Head)c.b.Head.scale.setScalar(c.hs);
  c.root.traverse(x=>{
    if(!x.isMesh)return; const n=x.name||'';
    if(n==='Hair_Curls'){x.visible=false;return}
    if(/^Hair_Neat|^Uniform_|^Reception_/.test(n)){const m=x.material;x.material=new THREE.MeshStandardMaterial({color:m.color.clone(),map:m.map,roughness:.74,metalness:0});return}
    if(/^Hair/.test(n)){const m=x.material&&x.material.clone?x.material.clone():x.material;
      if(m){x.material=new THREE.MeshStandardMaterial({color:new THREE.Color(0x5a3218),map:m.map,normalMap:m.normalMap,roughness:.82,metalness:0});}
      if(n==='Hair_Buns')x.scale.set(.9,.88,.9); return}
    if(n==='Eyebrows'){x.visible=false;if(x.morphTargetDictionary?.raise!=null)x.morphTargetInfluences[x.morphTargetDictionary.raise]=.45;const m=x.material.clone();x.material=new THREE.MeshStandardMaterial({color:new THREE.Color(0x4a2e1c),map:m.map,roughness:.88,metalness:0});x.scale.y*=.85;return}
    if(n==='Eyes'){const m=x.material.clone();x.material=new THREE.MeshStandardMaterial({color:0xffffff,map:m.map,roughness:.3,metalness:.02});return}
    if(n==='Eyelids'){x.visible=false;const m=x.material.clone();x.material=new THREE.MeshStandardMaterial({color:new THREE.Color(0xf2cbb3),map:m.map,roughness:.7,metalness:0});return}
    if(n==='Badge'){x.visible=false;return}
    if(n==='Clothes'){const m=x.material.clone();x.material=new THREE.MeshStandardMaterial({color:new THREE.Color(0xf7f4ec),map:m.map,normalMap:m.normalMap,roughness:.58,metalness:0});return}
    if(n==='Superhero_Female'){if(x.morphTargetDictionary?.smile!=null)x.morphTargetInfluences[x.morphTargetDictionary.smile]=.7;const m=x.material.clone();x.material=new THREE.MeshStandardMaterial({color:0xffffff,map:m.map,roughness:.8,metalness:0});return}
  });
  // Replace downward-slanting source brows with shallow relaxed arcs, positioned from the actual skinned eyes.
  c.root.updateMatrixWorld(true);
  const eyes=c.meshes.find(x=>x.name==='Eyes');
  if(eyes){
   eyes.skeleton.update();const groups=[[],[]];
   for(let i=0;i<eyes.geometry.attributes.position.count;i++){
    const v=new THREE.Vector3().fromBufferAttribute(eyes.geometry.attributes.position,i);eyes.applyBoneTransform(i,v);v.applyMatrix4(eyes.matrixWorld);c.b.Head.worldToLocal(v);groups[v.x>0?1:0].push(v);
   }
   for(const pts of groups){if(!pts.length)continue;const ctr=pts.reduce((a,v)=>a.add(v),new THREE.Vector3()).divideScalar(pts.length);
    const curve=new THREE.QuadraticBezierCurve3(ctr.clone().add(new THREE.Vector3(-.019,.027,.021)),ctr.clone().add(new THREE.Vector3(0,.036,.022)),ctr.clone().add(new THREE.Vector3(.019,.027,.021)));
    const brow=new THREE.Mesh(new THREE.TubeGeometry(curve,10,.0028,5,false),new THREE.MeshStandardMaterial({color:0x62432e,roughness:.9}));brow.name='relaxed_brow';c.b.Head.add(brow);
   }
  }
  c.root.traverse(x=>{if(x.isMesh&&x.material===OUTM){const ink=new THREE.MeshBasicMaterial({color:0x3a302b,side:THREE.BackSide});ink.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <project_vertex>','transformed+=normalize(objectNormal)*0.0025;\n#include <project_vertex>')};x.material=ink}});
  c.root.traverse(x=>{if(!x.isMesh||x.material!==OUTM)return; const src=x.parent&&x.parent.children.find(o=>o!==x&&o.isMesh&&o.geometry===x.geometry); if(src&&src.name==='Hair_Curls')x.visible=false});
}
// ---------- облик по роли / болезни ----------
const BIG=new Set(['balloonhead','cloudhead','statichair','flathead']),INV=new Set(['lostshadow']),MUM=new Set(['pixel','spotty','zebra','glowskin','soapsneeze']),ROCK=new Set(['echo','giggles','drumheart','looping','bagpipelungs','hiccupclock']);
function mkStaff(s){const role=s.type==='handyman'?'orderly':s.type;const c=new Char(role,{tint:s.type==='handyman'?215:null});
 if(s.type==='nurse'){niceFace(c);c.attach('nurse_cap','Head',[0,.24*c.hs,-.01],[0,0,0],c.hs)}
 if(s.type==='doctor')c.attach('clipboard','hand_l',[.06,-.06,.04],[Math.PI/2,0,Math.PI/2]);
 if(s.type==='orderly'){c.attach('orderly_cap','Head',[0,.2*c.hs,0],[0,Math.PI,0],c.hs);c.attach('mop','hand_r',[-.05,-.02,.04],[0,0,0],.8)}
 if(s.type==='handyman')c.attach('plunger','hand_r',[-.05,-.02,.04],[0,0,0],.9);
 if(s.type==='receptionist'){niceReceptionist(c);c.attach('glasses','Head',[0,.132*c.hs,.11*c.hs],[0,0,0],c.hs);c.props.glasses.traverse(x=>{if(x.isMesh&&x.material.name==='glass'){x.material=x.material.clone();x.material.opacity=.035;x.material.depthWrite=false}});
  // Fit spectacles to measured eye centers in head-local space, not guessed world offsets.
  c.root.updateMatrixWorld(true);const eyes=c.meshes.find(x=>x.name==='Eyes'),ctr=new THREE.Vector3();
  for(let i=0;i<eyes.geometry.attributes.position.count;i++){const v=new THREE.Vector3().fromBufferAttribute(eyes.geometry.attributes.position,i);eyes.applyBoneTransform(i,v);v.applyMatrix4(eyes.matrixWorld);ctr.add(c.b.Head.worldToLocal(v))}
  ctr.divideScalar(eyes.geometry.attributes.position.count);c.props.glasses.position.copy(ctr).add(new THREE.Vector3(0,0,.029));c.props.glasses.quaternion.identity();}
 c.walkName=s.type==='doctor'?'Walk_Formal_Loop':'Walk_Loop';return c}
function mkPat(p){const d=p.healed?null:p.dis;let role='patient_a',o=p.healed?{}:{tint:p.hue??(p.id*47%360)};if(BIG.has(d))role='bighead',o={};else if(INV.has(d))role='invisible',o={invisible:true};else if(MUM.has(d))role='mummy',o={};else if(ROCK.has(d))role='rocker',o={};
 const c=new Char(role,{...o,shoeContact33:d==='rubberknee'||d==='jellyspine',actionAnatomy24:['patient_a','rocker','bighead','mummy','invisible'].includes(role)});if(role==='invisible'){c.attach('hat','Head',[0,.215*c.hs-.075,-.005],[0,0,0],c.hs);c.attach('glasses','Head',[0,.105*c.hs,.115*c.hs],[0,0,0],c.hs)}
 if(d==='selfiesyndrome')c.attach('phone','hand_r',[-.06,-.02,.04],[0,0,Math.PI/2]);{const H={balloonhead:[2.3,2.3,2.3],cloudhead:[2,1.9,2],statichair:[1.6,1.6,1.6],flathead:[1.7,.6,1.7]}[d];if(H){c.headS=H.map(v=>v*c.hs);c.b.Head.scale.set(...c.headS)}}
 if(d==='blinknose'){const n=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),mat(0xff3030,{em:0xff0000}));c.b.Head.add(n);n.position.set(0,.09,.11);c.nose=n}
 if(d==='glowskin')c.meshes.forEach(x=>{if(/Body|Head/i.test(x.name)){x.material.emissive=new THREE.Color(0x7fff7f);x.material.emissiveIntensity=.35}});
 if(d==='tail'){const t=new THREE.Mesh(new THREE.CylinderGeometry(.03,.012,.45,8),mat(0x8a5a3a));t.rotation.x=-1.0;t.position.set(0,-.05,-.2);c.b.pelvis.add(t)}
 if(d==='deflated')c.m.scale.set(.85,1,.7);c.walkName=d==='rubberknee'||d==='jellyspine'?'Jog_Fwd_Loop':'Walk_Loop';if(c.walkName==='Jog_Fwd_Loop'&&c.anatomicalGait)lightJog31(c);return c}
// ---------- статика: пол, стены, мебель ----------
let ST=null,STSIG='';const DYN=new Map();// room.id -> {doorLeaf, parts:{name:[mesh]}, items}
function hex(c){return new THREE.Color(c)}
function mixW(c,k){return hex(c).lerp(new THREE.Color(0xffffff),k)}
const NFP={scanner:[1,2],bed:[1,2]};
const clinicExteriorFloor=new THREE.MeshLambertMaterial({vertexColors:true});
function dirYaw(d){return [Math.PI/2,0,-Math.PI/2,Math.PI][d]??0}
function placeYaw(t,r){const fp=t.fp||fpOf(t.k||t.type),k=t.k||t.type;if(t.dir!=null)return dirYaw(t.dir);if(r&&/^(desk|recdesk|chiefdesk)$/.test(k)&&r.sp&&r.sp.staff){const st=r.sp.staff,du=(t.x+fp[0]/2)-(st.x+.5),dv=(t.y+fp[1]/2)-(st.y+.5);return Math.abs(du)>Math.abs(dv)?(du>0?Math.PI/2:-Math.PI/2):(dv>0?0:Math.PI)}const nfp=NFP[k]||(window.D&&D.furn&&D.furn[k]?D.furn[k].fp:fp)||fp;
 if(!r)return 0;const cx=t.x+fp[0]/2,cy=t.y+fp[1]/2,rx=r.x+r.w/2,ry=r.y+r.h/2,dsd=[[0,1],[1,0],[0,-1],[-1,0]][r.side||0];
 const same=fp[0]===nfp[0]&&fp[1]===nfp[1],sq=fp[0]===fp[1];
 if(sq){const du=rx-cx,dv=ry-cy;if(Math.abs(du)<.01&&Math.abs(dv)<.01)return Math.atan2(dsd[0],dsd[1]);return Math.abs(du)>Math.abs(dv)?(du>0?Math.PI/2:-Math.PI/2):(dv>0?0:Math.PI)}
 if(same){const dv=ry-cy;return Math.abs(dv)<.01?(dsd[1]<0?Math.PI:0):(dv>0?0:Math.PI)}
 const du=rx-cx;return Math.abs(du)<.01?(dsd[0]<0?-Math.PI/2:Math.PI/2):(du>0?Math.PI/2:-Math.PI/2)}
const CLINIC_FURN={reception:{cabinet:'rec_cabinet',noticeboard:'rec_noticeboard',plant:'rec_plant'},
 gp:{desk:'consult_desk',cabinet:'consult_cabinet',chair_plain:'consult_chair'}};
function placeFurn(t,r,root,dyn){const k=t.k||t.type,fp=t.fp||fpOf(k);const g=makeFurn(CLINIC_FURN[r?.type]?.[k]||k);
 const nf=(NFP[k]||(fp[0]===fp[1]?fp:null))||(k in{recdesk:1,desk:1,tubes:1,sofa:1,labbench:1,morguefridge:1,autopsy:1,bookcase:1,chiefdesk:1,bench:1}?[2,1]:fp);
 if(r?.type==='reception'&&k==='chair_office'){for(const o of g.children){if(!o.isMesh)continue;if(Math.abs(o.scale.y-.5)<.001&&Math.abs(o.scale.z-.07)<.001)o.position.z-=.145;if(Math.abs(o.scale.y-.08)<.001&&Math.abs(o.scale.z-.44)<.001)o.scale.z=.56}}
 const yaw=r?.type==='gp'&&k==='cabinet'?0:placeYaw(t,r);const piv=new THREE.Group();piv.position.set(t.x+fp[0]/2,0,t.y+fp[1]/2);piv.rotation.y=yaw;g.position.set(-nf[0]/2,0,-nf[1]/2);piv.add(g);root.add(piv);
 g.traverse(o=>{if(o.isMesh&&o.name){(dyn.parts[o.name]??=[]).push(o);o.userData.keep=1}});dyn.items.push({t,piv,k});return piv}
function buildStatic(){if(ST){scene.remove(ST);ST.traverse(o=>{if(o.isMesh&&o.userData.own)o.geometry.dispose()})}DYN.clear();ST=new THREE.Group();const live=new THREE.Group();ST.add(live);
 // The public floor reads as one surface; the entrance lanes and room floors provide the contrast.
 const exterior={pos:[],col:[],uv:[]},hall={pos:[],col:[],uv:[]},reception={pos:[],col:[],uv:[]},consult={pos:[],col:[],uv:[]};
 function tile(layer,x,z,color){
  layer.pos.push(x,0,z,x,0,z+1,x+1,0,z+1,x,0,z,x+1,0,z+1,x+1,0,z);
  layer.uv.push(0,0,0,1,1,1,0,0,1,1,1,0);
  for(let i=0;i<6;i++)layer.col.push(color.r,color.g,color.b);
 }
 const thresholds=new Set();
 for(const room of S.rooms){
  if(room.par||!['gp','reception'].includes(room.type))continue;
  const door=doorOut(room),[dx,dz]=DIRS[room.side];
  for(let i=0;i<2;i++)thresholds.add(`${door.x+dx*i},${door.y+dz*i}`);
 }
 for(let z=-8;z<S.h+8;z++)for(let x=-8;x<S.w+8;x++){
  const inMap=x>=0&&z>=0&&x<S.w&&z<S.h&&!isHole(x,z);
  if(!inMap){
   const entrance=z>=S.h&&Math.abs(x-S.ent.x)<=1;
   const shade=Math.cos(x*.59+z*.83)*.022+Math.sin(x*.21-z*.42)*.035;
   tile(exterior,x,z,entrance?hex(0xa9a79c):hex(0x789666).multiplyScalar(1+shade));
   continue;
  }
  const room=roomAt(x,z);
  if(room?.type==='reception')tile(reception,x,z,hex(0xf3efe6));
  else if(room?.type==='gp')tile(consult,x,z,hex(0xd7e2d6));
  else if(room){
   const tint=typeof FLOORS!=='undefined'&&FLOORS[room.type]?hex(FLOORS[room.type][1]):mixW(D.rooms[room.type].color||'#ccc',.15);
   tile(exterior,x,z,tint.multiplyScalar((x+z)&1?1:.92));
  }else{
   const lane=thresholds.has(`${x},${z}`)||(Math.abs(x-S.ent.x)<=1&&z>=S.h-4);
   const shade=((x*13+z*7)%5)*.008;
   tile(hall,x,z,hex(lane?0xa7bdb4:0xe0d8c9).multiplyScalar(1-shade));
  }
 }
 function addFloor({pos,col,uv},material){
  if(!pos.length)return;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,material);
  mesh.userData.own=1;
  mesh.receiveShadow=true;
  ST.add(mesh);
 }
 addFloor(exterior,clinicExteriorFloor);
 addFloor(hall,mat(0xffffff,{vertexColors:true,map:TEX.recFloor,rough:.71}));
 addFloor(reception,mat(0xffffff,{vertexColors:true,map:TEX.recFloor,rough:.48}));
 addFloor(consult,mat(0xffffff,{vertexColors:true,map:TEX.recFloor,rough:.65}));
 // стены (задние высокие, передние — вырез), двери
 const WG=[],RWG=[];let recWall=false;const box=(w,h,d,x,y,z,col)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x+w/2,y+h/2,z+d/2);const n=g.attributes.position.count,cc=new Float32Array(n*3);for(let i=0;i<n;i++){cc[i*3]=col.r;cc[i*3+1]=col.g;cc[i*3+2]=col.b}g.setAttribute('color',new THREE.BufferAttribute(cc,3));(recWall?RWG:WG).push(g)};
 const HB=+(Q.get('wall')||1.45),HF=.32,TH=.22,cap=hex(0x5b4636),winc=hex(0xa9d8f5);
 for(const r of S.rooms){const dyn={parts:{},items:[],r};DYN.set(r.id,dyn);if(!r.par){recWall=r.type==='reception';const consultWall=r.type==='gp',clinicWall=recWall||consultWall;
  const wc=hex(recWall?0xeee9de:consultWall?0xe9e7dd:D.rooms[r.type].color||'#ccc'),RH=recWall?1.95:consultWall?Math.max(HB,1.78):HB;
  if(!clinicWall)wc.lerp(new THREE.Color(0xffffff),.45);
  const RC=recWall?hex(0xb7c8cd):consultWall?hex(0xa6b6ab):cap;
  const trim=hex(0x7e9d91);
  for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const isDoor=x===r.door.x&&y===r.door.y;if(!isWall(r,x,y)&&!isDoor)continue;
   const sT=y===r.y,sL=x===r.x,sB=y===r.y+r.h-1,sR=x===r.x+r.w-1;
   if(isDoor){const back=r.side>=2;const hz=r.side===0||r.side===2;// дверь в стене вдоль X (hz) или вдоль Z
    if(r.type==='reception'&&!back){const ox=r.side===1?x+1-TH:x,oz=r.side===0?y+1-TH:y;const portal=receptionEntrance();if(hz)portal.position.set(x,0,oz+TH/2);else{portal.position.set(ox+TH/2,0,y+1);portal.rotation.y=Math.PI/2}live.add(portal);continue}
    const H=back?RH:HF,ox=r.side===3?x:r.side===1?x+1-TH:x,oz=r.side===2?y:r.side===0?y+1-TH:y;
    if(consultWall){
     const sign=consultSign();
     sign.position.set(hz?x+1.30:ox+TH+.02,back?1.18:HF+.045,hz?oz+TH+.02:y+.56);
     if(!hz)sign.rotation.y=Math.PI/2;
     if(back||x<r.x+r.w-1)live.add(sign);
    }
    if(hz){box(.12,H,TH,x,0,oz,wc);box(.12,H,TH,x+.88,0,oz,wc);if(back&&RH>2.1)box(1,RH-2.05,TH,x,2.05,oz,wc)}else{box(TH,H,.12,ox,0,y,wc);box(TH,H,.12,ox,0,y+.88,wc);if(back&&RH>2.1)box(TH,RH-2.05,1,ox,2.05,y,wc)}
    if(back){const leaf=new THREE.Group();const lm=new THREE.Mesh(new THREE.BoxGeometry(.74,2,.05),mat(0x8fbfd8));lm.userData.own=1;lm.position.set(.38,1,0);lm.scale.y=Math.min(1,(RH-.03)/2);lm.position.y=lm.scale.y;leaf.add(lm);const hd=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),mat(0xd4af37));hd.position.set(.68,1,.05);leaf.add(hd);
     if(hz){leaf.position.set(x+.13,0,oz+TH/2)}else{leaf.position.set(ox+TH/2,0,y+.87);leaf.rotation.y=Math.PI/2}leaf.userData.base=leaf.rotation.y;live.add(leaf);dyn.leaf=leaf}
    continue}
   if(sT||sL){
    if(sT&&sL){box(TH,RH,1,x,0,y,wc);box(TH,.04,1,x,RH,y,RC);if(recWall)box(.025,.075,1,x+TH,0,y,wc)}
    const top=sT;
    const hasWin=recWall?(!sT?(!sB&&(x+y)%2===0):!sL&&!sR&&(x+y)%2===0):
     consultWall&&(top?x===r.x+r.w-2:!sB&&y===r.y+1);
    if(hasWin){
     const wy=.58,wh=RH-.78;
     if(top){box(.09,RH,TH,x,0,y,wc);box(.09,RH,TH,x+.91,0,y,wc);box(.82,wy,TH,x+.09,0,y,wc);box(.82,RH-wy-wh,TH,x+.09,wy+wh,y,wc)}
     else{box(TH,RH,.09,x,0,y,wc);box(TH,RH,.09,x,0,y+.91,wc);box(TH,wy,.82,x,0,y+.09,wc);box(TH,RH-wy-wh,.82,x,wy+wh,y+.09,wc)}
     const win=receptionWindow(.82,wh);if(top)win.position.set(x+.5,wy,y+TH);else{win.position.set(x+TH,wy,y+.5);win.rotation.y=Math.PI/2}live.add(win);
    }else if(top){box(1,RH,TH,x,0,y,wc);if(!clinicWall&&!sL&&!sR&&(x+y)%3===0)box(.62,Math.min(.7,HB-.95),.02,x+.2,HB>2?1.05:.75,y+TH,winc)}
    else{box(TH,RH,1,x,0,y,wc);if(!clinicWall&&!sB&&(x+y)%3===0)box(.02,Math.min(.7,HB-.95),.6,x+TH,HB>2?1.05:.75,y+.2,winc)}
    if(top){box(1,.04,TH,x,RH,y,RC);if(clinicWall)box(1,.075,.025,x,0,y+TH,consultWall?trim:wc)}else{box(TH,.04,1,x,RH,y,RC);if(clinicWall)box(.025,.075,1,x+TH,0,y,consultWall?trim:wc)}
    if(consultWall&&!hasWin){
     if(top)box(1,.075,.018,x,.82,y+TH,trim);
     else box(.018,.075,1,x+TH,.82,y,trim);
     if(top&&x===r.x+1){
      const poster=consultPoster();
      poster.position.set(x+.5,.96,y+TH+.025);
      live.add(poster);
     }
    }
   }

   if(sB){box(1,HF,TH,x,0,y+1-TH,wc);box(1,.03,TH,x,HF,y+1-TH,RC)}
   if(sR){box(TH,HF,1,x+1-TH,0,y,wc);box(TH,.03,1,x+1-TH,HF,y,RC)}}}
  if(r.type==='reception'){const sky=new THREE.PointLight(0xf0f7ff,10.0,6,2);sky.position.set(r.x+r.w*.45,2.8,r.y+r.h*.45);live.add(sky)}
  roomLay(r);for(const t of r.it)placeFurn(t,r,live,dyn)}
 recWall=false;const cd={parts:{},items:[]};DYN.set('corr',cd);for(const t of S.items)placeFurn(t,null,live,cd);
 for(const x of [S.ent.x-2.4,S.ent.x+3.4]){
  const planter=clinicPlanter();
  planter.position.set(x,0,S.h+1.85);
  live.add(planter);
 }
 // ограда участка
 const fc=hex(0xe9e2d2);for(let u=-1;u<=S.w;u++){if(Math.abs(u-S.ent.x)<1)continue;box(1,.5,.12,u,0,-1.1,fc)}for(let v=-1;v<S.h;v++){box(.12,.5,1,-1.1,0,v,fc)}
 if(RWG.length){const geo=mergeGeometries(RWG);RWG.forEach(g=>g.dispose());const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.88}));m.userData.own=1;m.castShadow=m.receiveShadow=true;ST.add(m)}
 if(WG.length){const wg=mergeGeometries(WG);WG.forEach(g=>g.dispose());const wm=new THREE.Mesh(wg,new THREE.MeshStandardMaterial({vertexColors:true,map:TEX.plaster,roughness:.9,metalness:0,bumpMap:TEX.plaster,bumpScale:.008}));wm.userData.own=1;wm.castShadow=true;wm.receiveShadow=true;ST.add(wm)}
 // слияние статической мебели по материалам (мало draw calls)
 live.updateMatrixWorld(true);const byM=new Map();const drop=[];live.traverse(o=>{if(!o.isMesh||o.userData.keep)return;let inLeaf=false;for(let p=o.parent;p;p=p.parent)if(p.userData.base!=null)inLeaf=true;if(inLeaf)return;
  const g=o.geometry.clone().applyMatrix4(o.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal','uv','color'].includes(k))g.deleteAttribute(k);(byM.get(o.material)||byM.set(o.material,[]).get(o.material)).push(g);drop.push(o)});
 for(const o of drop)o.parent.remove(o);for(const[m,gs]of byM){const mapped=gs.map(g=>{const x=g.index?g.toNonIndexed():g;if(!x.getAttribute('uv')){const n=x.getAttribute('position').count;const uv=new Float32Array(n*2);x.setAttribute('uv',new THREE.BufferAttribute(uv,2))}if(m.vertexColors&&!x.getAttribute('color')){const a=new Float32Array(x.getAttribute('position').count*3);a.fill(1);x.setAttribute('color',new THREE.BufferAttribute(a,3))}return x});const gg=mergeGeometries(mapped);const mm=new THREE.Mesh(gg,m);mm.userData.own=1;mm.castShadow=!m.userData.noCastShadow;mm.receiveShadow=!m.userData.noReceiveShadow;ST.add(mm)}
 scene.add(ST);STSIG=sig();if(!Q.has('cap')||Q.has('sunfit45'))fitSun45()}
function fitSun45(){const cx=S.w/2,cz=(S.h+3)/2,r=Math.max(20,Math.hypot(S.w+4,S.h+7)/2);sun.target.position.set(cx,0,cz);sun.position.set(cx+6,18,cz+7);sun.target.updateMatrixWorld();sun.updateMatrixWorld();
 const sc=sun.shadow.camera;sc.left=-r;sc.right=r;sc.top=r;sc.bottom=-r;sc.updateProjectionMatrix();sun.shadow.needsUpdate=true}
// ---------- сущности ----------
const CH=new Map();const inv=(X,Y)=>{const a=(X-OX)/HW,b=(Y-OY)/HH;return[(a+b)/2,(b-a)/2]};
function roomOf(e){return S.rooms.find(r=>r.id===(e.room??e.wcRoom))}
function bedAt(sp){if(!sp||!sp.at)return null;for(const r of S.rooms)for(const t of r.it)if(t.x===sp.at.x&&t.y===sp.at.y)return{t,r};return null}
const WORKT={gp:'write',reception:'write',pharmacy:null,psych:null,chief:'write',library:'write'};
const DEADYAW39=new WeakMap();function deadYaw39(e){if(DEADYAW39.has(e))return DEADYAW39.get(e);const c=CH.get(e.id),y0=c?c.yaw:0,ox=e.x+.5,oz=e.y+.5,ok=(x,z)=>typeof walk!=='function'||walk(Math.floor(x),Math.floor(z));let best=y0,bl=-1;for(const k of [0,1,-1,2,-2,3,-3,4]){const y=y0+k*Math.PI/4,fx=Math.sin(y),fz=Math.cos(y);let l=0;for(let d=0;d<=1.9001;d+=.1){let clear=true;for(const w of [-.22,0,.22]){if(!ok(ox-fx*d+fz*w,oz-fz*d-fx*w)){clear=false;break}}if(!clear)break;l=d}if(l>=1.9){best=y;bl=l;break}if(l>bl){bl=l;best=y}}c&&(c.deadYaw39={yaw:best,clear:bl,from:y0});DEADYAW39.set(e,best);return best}
// Phase39e: world target of an object interaction: wc lid = bowl/seat top (furn.js wc: seat ring top .50 at tile centre), flush = cistern button (.84 high, .32 behind the seat centre), otherwise (hand-wash) a basin point .42 in front at .85.
function reachTarget39(e,yaw){const tr=e.wcRoom!=null?S.rooms.find(r=>r.id===e.wcRoom):null,sp=tr&&tr.sp&&tr.sp.patient;const act=e.oa&&e.oa.act;if(sp&&sp.pose==='wc'&&(act==='lid'||act==='flush')){const y=dirYaw(sp.dir??1),fx=Math.sin(y),fz=Math.cos(y);return act==='lid'?[sp.x+.5+fx*.1,.55,sp.y+.5+fz*.1]:[sp.x+.5-fx*.32,.86,sp.y+.5-fz*.32]}if(e.wash&&tr){let best=null,bd=1e9;for(const t of tr.it||[]){if(t.k!=='sink')continue;const d=Math.hypot(t.x-e.x,t.y-e.y);if(d<bd){bd=d;best=t}}if(best&&bd<2.1)return [best.x+.5,.8,best.y+.5]}return [e.x+.5+Math.sin(yaw)*.42,.85,e.y+.5+Math.cos(yaw)*.42]}
function poseOf(e,isStaff){const st={act:'idle',x:e.x+.5,z:e.y+.5,yaw:null,lie:0,y:0,layer:null};const moving=e.path&&e.path.length>0;
 if(e.state==='dead'){st.act='dead';if(!e.body)st.yaw=deadYaw39(e);return st}
 if(e.vs){const v=e.vs,T=SEAT_T[v.pose]||.9,k=Math.min(1,v.t/T);let X,Y;[X,Y]=seatXY(e);[st.x,st.z]=inv(X,Y);
  if(v.pose==='lie'){const b=bedAt(v.sp);const fp=b?b.t.fp||fpOf(b.t.k):[1,2];st.yaw=fp[1]>=fp[0]?0:Math.PI/2;if(b){const dy=DYN.get(b.r.id),it=dy&&dy.items.find(i=>i.t===b.t);if(it)st.yaw=it.piv.rotation.y}if(b){st.x=b.t.x+fp[0]/2;st.z=b.t.y+fp[1]/2}st.bed=b;st.lie=v.ph==='sat'?1:v.ph==='down'?k:1-k;st.act='lie';
   if(st.lie<1){const d0=[e.x+.5,e.y+.5];st.x=d0[0]+(st.x-d0[0])*st.lie;st.z=d0[1]+(st.z-d0[1])*st.lie}return st}
  st.yaw=dirYaw(v.sp.dir!=null?v.sp.dir:e.dir);st.act=v.ph==='sat'?'sit':v.ph==='down'?'sitdown':'situp';st.k=k;
  if(isStaff&&e.state==='work'&&v.ph==='sat'){
   const r=roomOf(e);
   if(r&&r.type in WORKT){
    const pat=r.busy==null?null:S.pats.find(p=>p.id===r.busy);
    if(e.type==='receptionist'&&r.type==='reception'){
     if(pat?.state==='enter'&&Math.hypot(pat.x-r.sp.patient.x,pat.y-r.sp.patient.y)<1.65){
      st.layer='greet';
      st.look=pat;
     }else if(pat?.state==='treat'){
      const q=procQ(pat);
      if(q<.34){
       st.layer='greet';
       st.look=pat;
       const nod=THREE.MathUtils.clamp((q-.06)/.25,0,1);
       st.recNod=Math.sin(Math.PI*nod);
      }else if(q<.85)st.layer='deskType';
     }
    }else{
     const busy=S.pats.some(p=>p.room===r.id&&(p.state==='treat'||p.state==='enter'));
     const queued=S.pats.some(p=>p.room===r.id||(p.state==='queue'&&p.qr===r.id));
     st.layer=busy||queued?'write':null;
     st.talk=busy;
    }
   }
  }
  if(!isStaff&&e.state==='treat')st.talk=true;return st}
 const an39=!isStaff&&CH.get(e.id)?.anatomicalGait;// Phase39e: anatomical patients do object interactions (wc lid, flush, hand-wash) on the anatomical standing stance (treatp: Idle_Loop lower body, planted feet, gait stop/start/turn contracts) with a procedural upper-body reach layer instead of the full-body Interact clip (legs/pelvis not grounded for these rigs).
 if(e.oa){st.act=an39?'treatp':'interact';if(an39){st.layer='reach39';st.reachT=reachTarget39(e,dirYaw(e.oa.d))}st.yaw=dirYaw(e.oa.d);return st}
 if(e.wash){st.act=an39?'treatp':'interact';if(an39){st.layer='reach39';st.reachT=reachTarget39(e,dirYaw(e.dir??3))}st.yaw=dirYaw(e.dir??3);return st}
 if(moving){st.act='walk';return st}
 if(isStaff&&e.mop&&!moving){st.act='mop';st.yaw=dirYaw(e.dir??1);return st}
 if(isStaff&&((e.type==='handyman'&&e.state==='do')||(e.type==='orderly'&&e.state==='pick'))){st.act=e.type==='handyman'?'fix':'crouch';st.yaw=dirYaw(e.dir??1);return st}
 if(e.dir!=null)st.yaw=dirYaw(e.dir);
 if(isStaff&&e.state==='work'){const r=S.rooms.find(r=>r.id===e.room);const p=r&&S.pats.find(p=>p.room===r.id&&p.state==='treat');if(p){st.act='treat';st.layer=e.type==='doctor'?'exam':'operate';st.look=p;if(r.type==='pharmacy'){st.act='give';st.layer=null;st.q=typeof procQ==='function'?procQ(p):0}}}
 if(!isStaff&&e.state==='treat'){st.act='treatp'}
 if(isStaff&&e.state==='rest')st.act='idle';return st}
function fx41(pos){try{const g=new THREE.Mesh(new THREE.SphereGeometry(.5,12,8),new THREE.MeshBasicMaterial({color:0xfff2a0,transparent:true,opacity:.7,depthWrite:false}));g.position.copy(pos).setY(1);scene.add(g);const t0=performance.now();const f=()=>{const k=(performance.now()-t0)/700;if(k>=1){scene.remove(g);g.geometry.dispose();return}g.scale.setScalar(1+k*1.5);g.material.opacity=.7*(1-k);requestAnimationFrame(f)};f()}catch(e){}}

// v43: аптека — медсестра дружелюбно протягивает коробочку с лекарством, пациент берёт её (вместо «возмущённых» жестов Idle_Talking + operate)
function v43Pill(c){if(!c.pill){const g=new THREE.Group(),bx=new THREE.Mesh(new THREE.BoxGeometry(.09,.06,.05),mat(0xffffff)),st=new THREE.Mesh(new THREE.BoxGeometry(.092,.018,.052),mat(0xe23a3a));g.add(bx,st);c.b.hand_r.add(g);const sc=1/(c.b.hand_r.getWorldScale(new THREE.Vector3()).x||1);g.scale.setScalar(sc);g.position.set(0,.08*sc,.03*sc);g.visible=false;c.pill=g}return c.pill}
function v43Give(c,e,p,isStaff){const ez=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};c.giveK=0;c.takeK=0;c.nodK=0;
 if(isStaff&&p.act==='give'){const q=p.q||0;c.giveK=ez((q-.45)/.15)*(1-ez((q-.84)/.1));c.nodK=q>.12&&q<.4?1:0;v43Pill(c).visible=q>.3&&q<.8;return}
 if(c.pill&&isStaff)c.pill.visible=false;
 if(!isStaff){const r=e.state==='treat'&&roomOf(e);if(r&&r.type==='pharmacy'){const q=typeof procQ==='function'?procQ(e):0;c.takeK=ez((q-.6)/.14)*(1-ez((q-.9)/.08));v43Pill(c).visible=q>=.8;c.pillT=performance.now()}else if(c.pill&&c.pill.visible&&performance.now()-(c.pillT||0)>4000)c.pill.visible=false}}

// v43: швабра — наклон корпуса, обе руки на черенке, головка швабры лежит на полу и ходит из стороны в сторону (вместо Interact «в воздухе»)
function v43MopPre(c,e,p,isStaff){if(!isStaff)return;const on=p.act==='mop';if(on&&!c.props?.mop)c.attach('mop','hand_r',[-.05,-.02,.04],[0,0,0],.8);if(c.props?.plunger)c.props.plunger.visible=!on;if(e.type==='handyman'&&c.props?.mop)c.props.mop.visible=on;c.mopOn=on}
function v43MopPost(c,p,dt){c.mopK=(c.mopK||0)+((c.mopOn?1:0)-(c.mopK||0))*Math.min(1,dt*5);const k=c.mopK,m=c.props&&c.props.mop;if(!m)return;
 if(k<.01){if(c.mopQ0){m.quaternion.copy(c.mopQ0)}return}c.mopQ0??=m.quaternion.clone();
 const b=c.b,fw=new THREE.Vector3(Math.sin(c.yaw),0,Math.cos(c.yaw)),rt=new THREE.Vector3().crossVectors(UP,fw),sw=Math.sin(c.t*4.2);
 rotWorld(b.spine_01||b.spine_02,UP,.28*sw*k);rotWorld(b.spine_02,rt,.32*k);
 rotWorld(b.upperarm_r,rt,-.55*k);rotWorld(b.lowerarm_r,rt,-.35*k);rotWorld(b.upperarm_l,rt,-.75*k);rotWorld(b.upperarm_l,UP,-.35*k);rotWorld(b.lowerarm_l,rt,-.6*k);
 c.m.updateMatrixWorld(true);m.quaternion.copy(c.mopQ0);m.updateMatrixWorld(true);
 const o=m.getWorldPosition(new THREE.Vector3()),L=1.378*m.getWorldScale(new THREE.Vector3()).y,h=Math.sqrt(Math.max(.05,L*L-o.y*o.y));
 const dir=fw.clone().multiplyScalar(.75).addScaledVector(rt,.55*sw).normalize();const T=new THREE.Vector3(o.x+dir.x*h,0,o.z+dir.z*h);
 const want=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),T.sub(o).normalize());const pq=m.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
 const tq=pq.multiply(want);m.quaternion.copy(c.mopQ0).slerp(tq,k);m.updateMatrixWorld(true)}

// v43: кровать — подойти сбоку, сесть на край спиной к кровати, затем развернуться и лечь (и обратно при вставании). Без «въезда как в сканер».
function v43BedSide(b){if(b.side!==undefined&&b.sideT===b.t)return b.side;const t=b.t,r=b.r,fp=t.fp||fpOf(t.k),I=inner(r);const az=fp[1]>=fp[0];const blk=new Set();for(const q of r.it)if(q!==t)for(const[x,y]of tilesOf(q.x,q.y,q.fp||fpOf(q.k)))blk.add(x+','+y);
 const ok=sg=>{const ts=az?[[sg<0?t.x-1:t.x+fp[0],t.y],[sg<0?t.x-1:t.x+fp[0],t.y+fp[1]-1]]:[[t.x,sg<0?t.y-1:t.y+fp[1]],[t.x+fp[0]-1,sg<0?t.y-1:t.y+fp[1]]];return ts.every(([x,y])=>x>=I.x&&y>=I.y&&x<I.x+I.w&&y<I.y+I.h&&!blk.has(x+','+y))};
 const cx=I.x+I.w/2,cy=I.y+I.h/2,pref=az?(cx>=t.x+fp[0]/2?1:-1):(cy>=t.y+fp[1]/2?1:-1);const sd=ok(pref)?pref:ok(-pref)?-pref:0;return sd}
function v43Bed(c,e,p){if(p.act!=='lie'||!p.bed||!e.vs||e.vs.pose!=='lie'||!/^bed/.test(p.bed.t.k)||window.__noV43)return false;const b=p.bed,fp=b.t.fp||fpOf(b.t.k),az=fp[1]>=fp[0];
 const sd=v43BedSide(b);if(!sd)return false;const C=[b.t.x+fp[0]/2,b.t.y+fp[1]/2],sx=az?sd:0,sz=az?0:sd;const sp=e.vs.sp,P0=[sp.x+.5,sp.y+.5];
 // Phase39 bed-edge seat contract: the mattress edge is treated like a chair cushion (furn.js mattress .84 wide, top .61): virtual cushion centre .25 inside the edge, stand point and sit root from the chair contract (standF, rig seat template forward), seat height = actual mattress top.
 const A39=[C[0]+sx*.2,C[1]+sz*.2],SD39=V43.standF.chair,MD39=c.actionAnatomy24&&c.seat24?c.seat24.forward*c.m.scale.z:V43.sitF.chair; const Ss=[A39[0]+sx*SD39,A39[1]+sz*SD39],E=[A39[0]+sx*MD39,A39[1]+sz*MD39],K=az?[Ss[0],P0[1]]:[P0[0],Ss[1]];const yawOut=Math.atan2(sx,sz),Y0=p.yaw;const L=p.lie;const ez=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};const lerp=(A,B,t)=>[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t];
 p.v43bed=1;c.seatAnchor39={x:A39[0],z:A39[1],sd:SD39,front:.25+.15,vs:e.vs};c.bedGate39={d:Math.hypot(K[0]-P0[0],K[1]-P0[1])+Math.hypot(Ss[0]-K[0],Ss[1]-K[1]),yawOut,vs:e.vs};
 if(L<.3){const a=L/.3,d1=Math.hypot(K[0]-P0[0],K[1]-P0[1]),d2=Math.hypot(Ss[0]-K[0],Ss[1]-K[1]),dd=a*(d1+d2);const q=dd<d1?lerp(P0,K,d1?dd/d1:1):lerp(K,Ss,d2?(dd-d1)/d2:1);p.x=q[0];p.z=q[1];p.act=a<.92?'walk':'idle';p.bedWalk39=1;p.yaw=yawOut;p.bed=null;return true}
  // Phase39 reverse transfer = chair stand-up contract: stay seated on the edge (situp), then rise to standing while the root returns to the stand point.
  if(L<.55&&e.vs.ph==='up'){if(L>=.47){p.x=E[0];p.z=E[1];p.act='situp';p.k=(.55-L)/.08*.4}else{const b=ez((.47-L)/.17),q=lerp(E,Ss,b);p.x=q[0];p.z=q[1];p.act='idle'}p.yaw=yawOut;p.seatH=LIESUP39.bed;p.bed=null;return true}
 if(L<.55){const k=ez((L-.3)/.25);const q=lerp(Ss,E,k);p.x=q[0];p.z=q[1];p.act='sitdown';p.k=k/1.5;p.yaw=yawOut;p.seatH=LIESUP39.bed;p.bed=null;return true}
 if(L<1){const u=ez((L-.55)/.45);const q=lerp(E,C,u);p.x=q[0];p.z=q[1];p.act='v43lie';p.u=u;p.yaw=yawOut+angd(Y0,yawOut)*u;p.lie=u;return true}
 return true}

// v43: естественная посадка — подойти к точке перед сиденьем, развернуться спиной, опуститься; при вставании — наоборот. Ноги не заходят в сиденье.
const V43={fwd:.2,stand:.72,ap:.42,
 // sitF: root forward of spot center. Sitting clip pelvis ~0.28 behind root → pelvis≈spot+(sitF-0.28)*facing. Tuned per mesh (elchair small; sofa needs ~.26 so feet clear solid base).
 sitF:{bench:.14,chair:.1,sofa:.26,wc:.1,elchair:.08,chair_office:.1},
 standF:{bench:.68,chair:.62,sofa:.7,wc:.55,elchair:.64,chair_office:.62}};
function v43Seatish(x,y){if(typeof v42OnFurn==='function'&&v42OnFurn(x,y))return true;return S.items.some(i=>(i.type==='bench'||i.type==='soda')&&tilesOf(i.x,i.y,i.fp||fpOf(i.type)).some(t=>t[0]===x&&t[1]===y))}
function v43SeatKind(sp){if(!sp)return'chair';if(sp.seat==='bench'||sp.seat==='wc')return sp.seat;
 for(const r of S.rooms)for(const t of r.it){if(t.x!==sp.x||t.y!==sp.y)continue;const k=t.k||'';if(/elchair/.test(k))return'elchair';if(/sofa/.test(k))return'sofa';if(/chair_office/.test(k))return'chair_office';if(/chair/.test(k))return'chair'}
 if(sp.seat==='sofa')return'sofa';return sp.seat||'chair'}
function v43Sit(c,e,p,isStaff){if(window.__noV43){c.v43=0;return}const sit=p.act==='sit'||p.act==='sitdown'||p.act==='situp';const ez=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
 if(sit&&e.vs&&(e.vs.pose==='sit'||(e.vs.pose==='wc'&&c.actionAnatomy24&&c.wcNav39&&c.wcNav39.ready))){c.v43=1;const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw);const sk=v43SeatKind(e.vs.sp);c.v43sk=sk;
  // Anchor to logical spot tile (not 2D seatXY/v26 pixel offsets) so pelvis lands on the real 3D cushion.
  const sp=e.vs.sp,ax=sp.x+.5,az=sp.y+.5;
  const MD=c.actionAnatomy24&&c.seat24?c.seat24.forward*c.m.scale.z:(V43.sitF[sk]??V43.fwd),SD=V43.standF[sk]??.65;const M=[ax+fx*MD,az+fz*MD],Sx=[ax+fx*SD,az+fz*SD];
  if(c.v43vs!==e.vs){c.v43vs=e.vs;const from=c.v43p?[c.v43p[0],c.v43p[1]]:[c.root.position.x,c.root.position.z];
   // No teleport: if arriving from behind/side, route via a side waypoint then to Sx (continuous path).
   const along=(from[0]-ax)*fx+(from[1]-az)*fz;const rx=-fz,rz=fx;
   if(along<SD*.45){const side=[ax+rx*1.05+fx*SD,az+rz*1.05+fz*SD];c.v43from=from;c.v43via=side;c.v43via2=[Sx[0],Sx[1]]}
   else{c.v43from=from;c.v43via=null;c.v43via2=null}}
 if(p.act==='sitdown'){const k=p.k||0;
  if(k<V43.ap){const a=ez(k/V43.ap);let A=c.v43from,B=Sx;if(c.v43via){const mid=c.v43via,end=c.v43via2||Sx;const d1=Math.hypot(mid[0]-A[0],mid[1]-A[1]),d2=Math.hypot(end[0]-mid[0],end[1]-mid[1]),tot=d1+d2||1,u=a*tot;if(u<=d1){B=mid;A=c.v43from;const t=d1?u/d1:1;p.x=A[0]+(B[0]-A[0])*t;p.z=A[1]+(B[1]-A[1])*t}else{A=mid;B=end;const t=d2?(u-d1)/d2:1;p.x=A[0]+(B[0]-A[0])*t;p.z=A[1]+(B[1]-A[1])*t}}
   else{p.x=A[0]+(B[0]-A[0])*a;p.z=A[1]+(B[1]-A[1])*a}
   p.act=Math.hypot(p.x-Sx[0],p.z-Sx[1])>.05?'walk':'idle';p.v43turn=1;p.k=0;return}
  const b=ez((k-V43.ap)/(1-V43.ap));p.x=Sx[0]+(M[0]-Sx[0])*b;p.z=Sx[1]+(M[1]-Sx[1])*b;p.k=b/1.5*1.0001;return}
  if(p.act==='situp'){const k=p.k||0;c.v43hold=[Sx[0],Sx[1],Math.round(e.x),Math.round(e.y)];if(k<.3){p.x=M[0];p.z=M[1];p.k=k/.3*.4;return}const b=ez((k-.3)/.45);p.x=M[0]+(Sx[0]-M[0])*b;p.z=M[1]+(Sx[1]-M[1])*b;p.act='idle';return}
  p.x=M[0];p.z=M[1];c.v43hold=[Sx[0],Sx[1],Math.round(e.x),Math.round(e.y)];return}
 c.v43=0;c.v43vs=null;if(p.act==='lie'||p.act==='dead'){c.v43hold=null;return}
 // Physical seat-navigation contract: simulation already owns the actual stand/approach location.
 if(c.seatNav27&&!isStaff&&c.actionAnatomy24){c.v43hold=null;return}
 const moving=e.path&&e.path.length>0;
 if(!moving&&c.v43hold&&c.v43hold[2]===Math.round(e.x)&&c.v43hold[3]===Math.round(e.y)){p.x=c.v43hold[0];p.z=c.v43hold[1];return}
 if(moving){const tx=Math.floor(p.x),tz=Math.floor(p.z);if(!e.vs&&v43Seatish(tx,tz)){const cx=tx+.5,cz=tz+.5;let dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);if(d<.05&&c.v43hold){dx=c.v43hold[0]-cx;dz=c.v43hold[1]-cz;d=Math.hypot(dx,dz)}if(d>1e-3&&d<V43.stand){p.x=cx+dx/d*V43.stand;p.z=cz+dz/d*V43.stand}}if(c.v43hold&&Math.hypot(p.x-c.v43hold[0],p.z-c.v43hold[1])>1)c.v43hold=null}
 if(!moving&&!e.vs&&v43Seatish(Math.floor(e.x+.01),Math.floor(e.y+.01))&&c.v43p){const cx=Math.floor(e.x+.01)+.5,cz=Math.floor(e.y+.01)+.5;let dx=c.v43p[0]-cx,dz=c.v43p[1]-cz,d=Math.hypot(dx,dz);if(d<1e-3){dx=0;dz=1;d=1}if(Math.hypot(p.x-cx,p.z-cz)<V43.stand){p.x=cx+dx/d*V43.stand;p.z=cz+dz/d*V43.stand}return}
 if(moving){const n=e.path[e.path.length-1];if(n&&v43Seatish(n.x,n.y)){const cx=n.x+.5,cz=n.y+.5,d=Math.hypot(p.x-cx,p.z-cz);if(d<V43.stand&&d>1e-4){p.x=cx+(p.x-cx)/d*V43.stand;p.z=cz+(p.z-cz)/d*V43.stand}}}}
/** v45 reception-only two-bone IK. Targets are desk-local XYZ, never hand-height heuristics. */
function recDeskArms(c,p,e){
 if(!c.recDesk||p.act!=='sit')return;
 for(const [name,q]of Object.entries(c.recFingerRest))c.b[name].quaternion.copy(q);
 const room=roomOf(e),desk=room&&DYN.get(room.id)?.items.find(i=>i.k==='recdesk');if(!desk)return;
 c.root.updateMatrixWorld(true);
 const type=c.lw.deskType||0;if(type<.005)c.recPhraseStart=null;else if(c.recPhraseStart==null)c.recPhraseStart=c.t;c.recTypingTime=c.recPhraseStart==null?0:c.t-c.recPhraseStart;const fw=new THREE.Vector3(Math.sin(c.yaw),0,Math.cos(c.yaw)),rt=new THREE.Vector3(Math.cos(c.yaw),0,-Math.sin(c.yaw));
 const qWorld=(b,want)=>{const pq=b.parent.getWorldQuaternion(new THREE.Quaternion()).invert();b.quaternion.copy(pq.multiply(want));b.updateMatrixWorld(true)};
 const aim=(b,end,target)=>{const B=b.getWorldPosition(new THREE.Vector3()),E=end.getWorldPosition(new THREE.Vector3());rotWorldQ(b,new THREE.Quaternion().setFromUnitVectors(E.sub(B).normalize(),target.clone().sub(B).normalize()))};
 for(const side of ['r','l']){
  const upper=c.b['upperarm_'+side],lower=c.b['lowerarm_'+side],hand=c.b['hand_'+side],sign=side==='r'?-1:1;
  const H=upper.getWorldPosition(new THREE.Vector3()),K=lower.getWorldPosition(new THREE.Vector3()),F=hand.getWorldPosition(new THREE.Vector3());
  // Desk-supported rest is the same reachable arm manifold as typing. No high-wrist/lap
  // crossover and no near-zero shoulder→wrist distance during processing transitions.
  const work=new THREE.Vector3(-.5+sign*(.10+.07*(1-type)),.97-.025*(1-type),-.74-.09*(1-type)).applyMatrix4(desk.piv.matrixWorld);
  const target=work;
  const a=H.distanceTo(K),b=K.distanceTo(F),d=THREE.MathUtils.clamp(H.distanceTo(target),Math.abs(a-b)+.002,a+b-.006);
  const axis=target.clone().sub(H).normalize();target.copy(H).addScaledVector(axis,d);
  const pole=rt.clone().multiplyScalar(sign*.35).add(new THREE.Vector3(0,-1,0));pole.addScaledVector(axis,-pole.dot(axis)).normalize();
  const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
  const elbow=H.clone().addScaledVector(axis,along).addScaledVector(pole,height);
  aim(upper,lower,elbow);aim(lower,hand,target);
  // Finger direction from bind-local chain; keep palms down instead of retaining an unrelated clip wrist twist.
  const middle=hand.children.find(b=>/middle/.test(b.name))||hand.children.find(b=>/index/.test(b.name));
  const thumb=hand.children.find(b=>/thumb/.test(b.name));
  if(middle&&thumb){
   const f=middle.position.clone().normalize(),across=c.b['index_01_'+side].position.clone().sub(c.b['pinky_01_'+side].position),u=across.addScaledVector(f,-across.dot(f)).normalize(),n=new THREE.Vector3().crossVectors(f,u).normalize();
   const df=fw.clone().addScaledVector(UP,-.04).normalize(),du=rt.clone().multiplyScalar(-sign),dn=new THREE.Vector3().crossVectors(df,du).normalize();du.crossVectors(dn,df).normalize();
   const src=new THREE.Matrix4().makeBasis(f,u,n),dst=new THREE.Matrix4().makeBasis(df,du,dn);qWorld(hand,new THREE.Quaternion().setFromRotationMatrix(dst.multiply(src.invert())));
   const coupled=.7*recTypingPulse(c.recTypingTime||0,side==='r'?2.85:4.8)+.3*recTypingPulse(c.recTypingTime||0,side==='r'?0:1.25);
   rotWorld(c.b['thumb_01_'+side],UP,-sign*.35);
   for(const[j,a]of [[1,-.55],[2,-.08],[3,.12]])rotWorld(c.b['thumb_0'+j+'_'+side],rt,a+type*(j===2?.035:.018)*coupled); // relaxed opposition; measured whole-thumb clearance below
   // Relaxed curved fingers, alternating small keystrokes; thumb stays softly opposed.
   for(const finger of ['index','middle','ring','pinky']){
    const passive=finger==='ring'||finger==='pinky',k=finger==='pinky'?.45:1;
    const angles=passive?[.20+.015*type*coupled*k,.28+.08*type*coupled*k,.08+.045*type*coupled*k]:[.20,.32,.10];
    for(let j=0;j<3;j++)rotWorld(c.b[finger+'_0'+(j+1)+'_'+side],rt,angles[j]);
   }

  }
 }
 recDeskTyping(c,p,e);c.m.updateMatrixWorld(true);
}
// Reception-only coordinated phalange articulation. Press solves two joints with a prescribed DIP;
// lift opens PIP/DIP together and adjusts MCP only for modest clearance, allowing a natural tip arc.
function recTypingPulse(t,phase){const theta=t*3.3+.22*Math.sin(t*.95),phrase=THREE.MathUtils.smoothstep(Math.cos(t*.9),-.95,-.75);return THREE.MathUtils.smoothstep(Math.cos(theta-phase),.45,.97)*phrase}
function recDeskTyping(c,p,e){
 if(!c.recDesk||p.act!=='sit')return;const type=c.lw.deskType||0,w=THREE.MathUtils.smoothstep(type,0,.7);if(!w){c.recTyping=[];c.recOne=null;return}
 const room=roomOf(e),desk=room&&DYN.get(room.id)?.items.find(i=>i.k==='recdesk');if(!desk)return;
 const V=THREE.Vector3,rt=new V(Math.cos(c.yaw),0,-Math.sin(c.yaw)),mesh=c.meshes.find(m=>m.name==='Superhero_Female');c.recCaps??={};c.recTyping=[];c.root.updateMatrixWorld(true);
 const specs=[['r','index',2,0],['l','index',7,1.25],['r','middle',1,2.85],['l','middle',8,4.8]];
 for(const[side,finger,col,phase]of specs){
 const name=finger+'_'+side,chain=[1,2,3].map(j=>c.b[finger+'_0'+j+'_'+side]),tip=c.b[finger+'_04_leaf_'+side],base=chain.map(b=>b.quaternion.clone());
 if(!c.recCaps[name]){mesh.skeleton.update();const pts=[],g=mesh.geometry;for(let i=0;i<g.attributes.position.count;i++){let wt=0;for(let j=0;j<4;j++)if(mesh.skeleton.bones[g.attributes.skinIndex.getComponent(i,j)]===tip)wt+=g.attributes.skinWeight.getComponent(i,j);if(wt<.25)continue;const v=new V().fromBufferAttribute(g.attributes.position,i);mesh.applyBoneTransform(i,v);v.applyMatrix4(mesh.matrixWorld);tip.worldToLocal(v);pts.push({i,v})}const end=Math.max(...pts.map(p=>p.v.y));c.recCaps[name]=pts.filter(p=>p.v.y>end-.010)}
 mesh.skeleton.update();for(const pp of c.recCaps[name]){const vv=new V().fromBufferAttribute(mesh.geometry.attributes.position,pp.i);mesh.applyBoneTransform(pp.i,vv);vv.applyMatrix4(mesh.matrixWorld);pp.v.copy(tip.worldToLocal(vv));}
 const cap=c.recCaps[name],lowest=()=>cap.reduce((a,p)=>{const v=p.v.clone().applyMatrix4(tip.matrixWorld);return !a||v.y<a.world.y?{local:p.v,world:v}:a},null);
 for(let j=0;j<3;j++){chain[j].quaternion.copy(c.recFingerRest[chain[j].name]);chain[j].updateMatrixWorld(true)}
 const dip=finger==='middle'?.28:.22,angles=[-.08,.72,dip],limits=[[-.45,.60],[.20,1.20],[.05,.50]];for(let j=0;j<3;j++)rotWorld(chain[j],rt,angles[j]);
 const start=lowest().world.clone();desk.piv.worldToLocal(start);const row=2,kx=-.65+col*.032,kz=-.61+row*.032,pulse=recTypingPulse(c.recTypingTime||0,phase),lift=.007*(1-pulse),target=new V(THREE.MathUtils.clamp(start.x,kx-.006,kx+.006),.886,kz+(finger==='middle'?.008:.005)).applyMatrix4(desk.piv.matrixWorld);
 rotWorld(chain[0],UP,THREE.MathUtils.clamp(target.clone().sub(lowest().world).dot(rt)/.11,-.12,.12));
 for(let it=0;it<100;it++)for(let j=1;j>=0;j--){const joint=chain[j].getWorldPosition(new V()),aa=lowest().world.clone().sub(joint),bb=target.clone().sub(joint);aa.addScaledVector(rt,-aa.dot(rt));bb.addScaledVector(rt,-bb.dot(rt));const da=Math.atan2(rt.dot(aa.clone().cross(bb)),aa.dot(bb)),next=THREE.MathUtils.clamp(angles[j]+da,limits[j][0],limits[j][1]);rotWorld(chain[j],rt,next-angles[j]);angles[j]=next}
 const pressAngles=angles.slice(),open=1-pulse;
 for(const[j,delta]of [[1,-.24*open],[2,-.12*open]]){const next=THREE.MathUtils.clamp(angles[j]+delta,limits[j][0],limits[j][1]);rotWorld(chain[j],rt,next-angles[j]);angles[j]=next}
 for(let it=0;it<18;it++){const y=lowest().world.y,eps=.001;rotWorld(chain[0],rt,eps);const deriv=(lowest().world.y-y)/eps;rotWorld(chain[0],rt,-eps);if(Math.abs(deriv)<1e-5)break;const next=THREE.MathUtils.clamp(angles[0]+THREE.MathUtils.clamp((target.y+lift-y)/deriv,-.08,.08),limits[0][0],limits[0][1]);rotWorld(chain[0],rt,next-angles[0]);angles[0]=next}
 const solved=chain.map(b=>b.quaternion.clone());for(let j=0;j<3;j++){chain[j].quaternion.copy(base[j]).slerp(solved[j],w);chain[j].updateMatrixWorld(true)}
 c.recTyping.push({name,side,finger,target:target.toArray(),angles,pressAngles,lift,pulse,weight:w,predicted:lowest().world.toArray(),capIds:cap.map(p=>p.i),key:row*10+col});
 }
 c.recOne=c.recTyping[0];c.recOneCap=c.recCaps.index_r;
}
// Preview-only stationary patient turn: alternating planted ankle targets, not idle feet spun with root.
const TURN_LEGS=['thigh_l','calf_l','foot_l','ball_l','thigh_r','calf_r','foot_r','ball_r'];
function patientTurnFeet(c,dt){
 const active=c.turnHold>0;c.turnWeight=THREE.MathUtils.damp(c.turnWeight||0,active?1:0,active?18:14,dt);
 if(!active&&c.turnWeight<.005){c.turnWeight=0;c.turnPlan=null;return}
 const V=THREE.Vector3,Q=THREE.Quaternion;
 if(!c.turnPlan){const feet={};for(const side of ['l','r']){const f=c.b['foot_'+side],old=c.lastTurnFeet?.[side];feet[side]={p:old?.p.clone()||f.getWorldPosition(new V()),q:old?.q.clone()||f.getWorldQuaternion(new Q())}}
 c.turnPlan={feet,side:c.turnSign>0?'l':'r',t:0,from:null,to:null}}
 const t=c.turnPlan;
 if(!t.from){const side=t.side,base=t.feet[side];t.from={p:base.p.clone(),q:base.q.clone()};const yaw=c.yaw+THREE.MathUtils.clamp(c.turnError||0,-.36,.36),rt=new V(Math.cos(yaw),0,-Math.sin(yaw)),fw=new V(Math.sin(yaw),0,Math.cos(yaw));
 t.to={p:c.root.position.clone().addScaledVector(rt,side==='l'?.115:-.115).addScaledVector(fw,.015),q:c.b['foot_'+side].getWorldQuaternion(new Q())};t.to.p.y=base.p.y;t.to.q.premultiply(new Q().setFromAxisAngle(UP,yaw-c.yaw));}
 t.t+=dt;const u=Math.min(1,t.t/.30),ease=u*u*(3-2*u);const swing={p:t.from.p.clone().lerp(t.to.p,ease),q:t.from.q.clone().slerp(t.to.q,ease)};swing.p.y+=.035*Math.sin(Math.PI*u);
 for(const side of ['l','r']){const target=side===t.side?swing:t.feet[side],th=c.b['thigh_'+side],ca=c.b['calf_'+side],ft=c.b['foot_'+side];if(!th||!ca||!ft)continue;
 const H=th.getWorldPosition(new V()),K=ca.getWorldPosition(new V()),F=ft.getWorldPosition(new V()),fq=ft.getWorldQuaternion(new Q()),goal=F.clone().lerp(target.p,c.turnWeight),a=H.distanceTo(K),b=K.distanceTo(F),axis=goal.clone().sub(H),dist=THREE.MathUtils.clamp(axis.length(),Math.abs(a-b)+.004,a+b-.003);axis.normalize();
 const pole=new V(Math.sin(c.yaw),0,Math.cos(c.yaw));pole.addScaledVector(axis,-pole.dot(axis)).normalize();const along=(a*a-b*b+dist*dist)/(2*dist),bend=Math.sqrt(Math.max(0,a*a-along*along)),knee=H.clone().addScaledVector(axis,along).addScaledVector(pole,bend);
 const aim=(bone,end,point)=>{const o=bone.getWorldPosition(new V());rotWorldQ(bone,new Q().setFromUnitVectors(end.getWorldPosition(new V()).sub(o).normalize(),point.clone().sub(o).normalize()))};aim(th,ca,knee);aim(ca,ft,goal);
 const want=fq.slerp(target.q,c.turnWeight),pq=ft.parent.getWorldQuaternion(new Q()).invert();ft.quaternion.copy(pq.multiply(want));ft.updateMatrixWorld(true);
 }
 if(u>=1){t.feet[t.side]=t.to;t.side=t.side==='l'?'r':'l';t.t=0;t.from=t.to=null}
}
// Keep the support foot planted during MOVING departure/corner turns; the lifted leg keeps its real gait.
function movingTurnPlant(c,dt){
 c.moveTurnWeight=THREE.MathUtils.damp(c.moveTurnWeight||0,c.moveTurnHold>0?1:0,18,dt);if(c.moveTurnWeight<.005){c.moveLocks={};return}
 const V=THREE.Vector3,Q=THREE.Quaternion,feet=['l','r'].map(s=>c.b['foot_'+s].getWorldPosition(new V())),side=feet[0].y<feet[1].y?'l':'r';c.moveLocks??={};
 for(const ss of ['l','r'])if(ss!==side)delete c.moveLocks[ss];const th=c.b['thigh_'+side],ca=c.b['calf_'+side],ft=c.b['foot_'+side],H=th.getWorldPosition(new V()),K=ca.getWorldPosition(new V()),F=ft.getWorldPosition(new V()),a=H.distanceTo(K),b=K.distanceTo(F);
 if(F.y>(c.fh0||0)+.035){delete c.moveLocks[side];return}
 let lock=c.moveLocks[side];if(!lock){const old=c.lastTurnFeet?.[side];lock=c.moveLocks[side]={p:old?.p.clone()||F.clone(),q:new Q().setFromAxisAngle(UP,c.yaw).multiply(c.flatFeet[side]),age:0,w:0};lock.p.y=c.fh0||F.y}
 lock.age+=dt;lock.w=THREE.MathUtils.damp(lock.w,1,30,dt);if(lock.age>.18||H.distanceTo(lock.p)>a+b-.008){delete c.moveLocks[side];return}
 const weight=c.moveTurnWeight*lock.w,goal=F.clone().lerp(lock.p,weight),axis=goal.clone().sub(H),dist=THREE.MathUtils.clamp(axis.length(),Math.abs(a-b)+.004,a+b-.003);axis.normalize();const pole=new V(Math.sin(c.yaw),0,Math.cos(c.yaw));pole.addScaledVector(axis,-pole.dot(axis)).normalize();const along=(a*a-b*b+dist*dist)/(2*dist),knee=H.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,a*a-along*along))),fq=ft.getWorldQuaternion(new Q());
 const aim=(bone,end,point)=>{const o=bone.getWorldPosition(new V());rotWorldQ(bone,new Q().setFromUnitVectors(end.getWorldPosition(new V()).sub(o).normalize(),point.clone().sub(o).normalize()))};aim(th,ca,knee);aim(ca,ft,goal);const q=fq.slerp(lock.q,weight);ft.quaternion.copy(ft.parent.getWorldQuaternion(new Q()).invert().multiply(q));ft.updateMatrixWorld(true);
}
// Phase31: speed-specific authored lower-body Jog. Original Jog upper-body tracks remain untouched.
const JOG31=new Map();
function lightJog31(c){
 const key=c.profile33+':'+c.m.scale.toArray().join(',');let data=JOG31.get(key);
 if(!data){
  const V=THREE.Vector3,Q=THREE.Quaternion,N=100,m=skClone(c.m),b={},meshes=[];m.position.set(0,c.neutralGround,0);m.rotation.set(0,0,0);m.traverse(o=>{if(o.isBone)b[o.name]=o;if(o.isSkinnedMesh&&o.visible)meshes.push(o)});const mix=new THREE.AnimationMixer(m),source=c.A.Jog_Fwd_Loop.getClip(),a=mix.clipAction(source),D=source.duration,fake={root:m,m,b,meshes,yaw:0,role:c.role},raw=[];a.play();
  const names=['thigh_l','calf_l','foot_l','ball_l','thigh_r','calf_r','foot_r','ball_r'];
  for(let i=0;i<N;i++){a.time=D*i/N;mix.update(0);m.updateMatrixWorld(true);const feet=gaitFeet(fake);raw.push({pelvis:b.pelvis.getWorldPosition(new V()),legs:Object.fromEntries(names.map(n=>[n,b[n].quaternion.clone()])),feet});}
  const mean=raw.reduce((s,r)=>s+r.pelvis.y,0)/N,ref=calmPose19(c).pelvisPosition.clone();b.pelvis.position.copy(ref);m.updateMatrixWorld(true);const idleReference=b.pelvis.getWorldPosition(new V()).y,reference=mean,nominal=1.45,ratio=nominal/c.strideOf('Jog_Fwd_Loop'),windows={};
  for(const s of ['l','r']){const ys=raw.map(r=>r.feet[s].minY),peak=ys.indexOf(Math.max(...ys));let end=peak,start=peak;for(let k=0;k<N;k++){end=(end-1+N)%N;if(ys[end]<.008)break}for(let k=0;k<N;k++){start=(start+1)%N;if(ys[start]<.008)break}const contact=((end-start+N)%N)/N;windows[s]={start:start/N,end:end/N,contact,center:(start/N+contact/2)%1,duty:.5+ratio*(contact-.5)};}
  const sample=(s,u)=>{u=(u%1+1)%1;const z=u*N,i=Math.floor(z)%N,j=(i+1)%N,t=z-Math.floor(z),f=raw[i].feet[s],g=raw[j].feet[s];return{p:f.p.clone().lerp(g.p,t),q:f.q.clone().slerp(g.q,t),ball:f.ball.clone().slerp(g.ball,t),minY:THREE.MathUtils.lerp(f.minY,g.minY,t),legs:Object.fromEntries(names.filter(n=>n.endsWith('_'+s)).map(n=>[n,raw[i].legs[n].clone().slerp(raw[j].legs[n],t)]))}};
  // Contact-timed C1 COM trajectory: stance loading and push-off join actual flight parabolas.
  const bodyShape=phase=>{for(const side of ['l','r']){const w=windows[side],other=windows[side==='l'?'r':'l'],start=(w.center-w.duty/2+1)%1,end=(start+w.duty)%1,next=(other.center-other.duty/2+1)%1,previousEnd=(next+other.duty)%1,priorFlight=(start-previousEnd+1)%1*D,nextFlight=(next-end+1)%1*D,d=(phase-start+1)%1;if(d<=w.duty){const u=d/w.duty,dt=w.duty*D;return dt*(-9.81*priorFlight/2*(u*u*u-2*u*u+u)+9.81*nextFlight/2*(u*u*u-u*u));}const flightAge=(phase-end+1)%1*D;if(flightAge<=nextFlight)return .5*9.81*flightAge*(nextFlight-flightAge);}throw Error('No light Jog support/flight phase');};
  const bodyMean=raw.reduce((sum,_,i)=>sum+bodyShape(i/N),0)/N;
  const times=[],positions=[],rotations=Object.fromEntries(names.map(n=>[n,[]])),stats=[];
  for(let i=0;i<=N;i++){
   const phase=(i%N)/N;a.time=D*phase;mix.update(0);m.updateMatrixWorld(true);const P=b.pelvis.getWorldPosition(new V());P.y=reference+bodyShape(phase)-bodyMean;b.pelvis.position.copy(b.pelvis.parent.worldToLocal(P));m.updateMatrixWorld(true);times.push(D*i/N);positions.push(...b.pelvis.position.toArray());
   for(const s of ['l','r']){
    const w=windows[s],v=(phase-w.center+w.duty/2+1)%1,stance=v<=w.duty;let sourcePhase,u;
    if(stance){u=v/w.duty;sourcePhase=w.start+u*w.contact}else{u=(v-w.duty)/(1-w.duty);sourcePhase=w.end+u*(1-w.contact)}
    const f=sample(s,sourcePhase);for(const[n,q]of Object.entries(f.legs))b[n].quaternion.copy(q);m.updateMatrixWorld(true);
    const span=nominal*D*w.duty,center=(sample(s,w.start).p.z+sample(s,w.end).p.z)/2,front=center+span/2,rear=center-span/2,T=f.p.clone();let clearance=0;
    if(stance)T.z=THREE.MathUtils.lerp(front,rear,u);else{const smooth=u*u*(3-2*u);T.z=THREE.MathUtils.lerp(rear,front,smooth);const begin=sample(s,w.end).minY,end=sample(s,w.start).minY;clearance=(f.minY-THREE.MathUtils.lerp(begin,end,u))*ratio;}
    T.y+=.003+clearance-f.minY;
    if(!gaitAimFoot(fake,s,T,f.q,f.ball))throw Error('Light Jog authored pose outside protected reach '+JSON.stringify({role:c.role,side:s,phase,T:T.toArray(),H:b['thigh_'+s].getWorldPosition(new V()).toArray(),F:b['foot_'+s].getWorldPosition(new V()).toArray(),reference,ratio,window:w,sourcePhase,u,stance,physical:b['thigh_'+s].getWorldPosition(new V()).distanceTo(b['calf_'+s].getWorldPosition(new V()))+b['calf_'+s].getWorldPosition(new V()).distanceTo(b['foot_'+s].getWorldPosition(new V()))}));
    // Solve the actual shoe envelope after anatomical IK, not an ankle proxy or mesh deformation.
    for(let j=0;j<3;j++){const actual=gaitFeet(fake)[s],dy=.003+clearance-actual.minY;if(Math.abs(dy)<.000001)break;T.y+=dy;if(!gaitAimFoot(fake,s,T,f.q,f.ball))throw Error('Light Jog sole registration unreachable '+s+' '+phase);}
    for(const n of names.filter(n=>n.endsWith('_'+s)))rotations[n].push(...b[n].quaternion.toArray());
   }
   const feet=gaitFeet(fake);stats.push({phase,pelvis:b.pelvis.getWorldPosition(new V()).y,l:feet.l.minY,r:feet.r.minY});
  }
  const clip=source.clone();clip.tracks=clip.tracks.filter(t=>t.name!=='pelvis.position'&&!names.some(n=>t.name===n+'.quaternion'));clip.tracks.push(new THREE.VectorKeyframeTrack('pelvis.position',times,positions));for(const n of names)clip.tracks.push(new THREE.QuaternionKeyframeTrack(n+'.quaternion',times,rotations[n]));clip.name='Jog_Fwd_Loop';data={clip,nominal,reference,idleReference,ratio,windows,stats,sourceDuration:D,sourceStride:c.strideOf('Jog_Fwd_Loop')};JOG31.set(key,data);mix.stopAllAction();mix.uncacheRoot(m);
 }
 const old=c.A.Jog_Fwd_Loop;old.stop();const action=c.mix.clipAction(data.clip);action.enabled=true;action.setEffectiveWeight(0);action.play();c.A.Jog_Fwd_Loop=action;c.jogMotion31={nominalSpeed:data.nominal,reference:data.reference,idleReference:data.idleReference,ratio:data.ratio,windows:data.windows,sourceStride:data.sourceStride,sourceDuration:data.sourceDuration,compiledStats:data.stats};
}

function gaitJogFactor29(c){return (c.gaitActualSpeed||0)/(c.strideOf(c.walkName)*Math.max(.01,c.A[c.walkName].getEffectiveTimeScale()))}
function gaitJogWarp29(c,p){if(c.jogMotion31)c.gaitSolvedContact32={};if(c.walkName!=='Jog_Fwd_Loop'||c.ent.vs||(c.gaitActualSpeed||0)<.08)return;const jogWeight=c.A[c.walkName].getEffectiveWeight();if(jogWeight<.0001)return;const V=THREE.Vector3,forward=new V(Math.sin(c.yaw),0,Math.cos(c.yaw)),desiredFactor=gaitJogFactor29(c),factor=THREE.MathUtils.lerp(1,desiredFactor,jogWeight);c.root.updateMatrixWorld(true);const feet=Object.fromEntries(['l','r'].map(side=>[side,{p:c.b['foot_'+side].getWorldPosition(new V()),q:gaitOrientation28(c,c.b['foot_'+side]),ball:gaitOrientation28(c,c.b['ball_'+side]),minY:gaitContact25(c,side).min}]));c.gaitJog29={factor,desiredFactor,jogWeight,nativeRate:c.A[c.walkName].getEffectiveTimeScale(),speed:c.gaitActualSpeed};if(c.jogMotion31){const P=c.b.pelvis.getWorldPosition(new V()),ref=c.root.position.y+THREE.MathUtils.lerp(c.jogMotion31.idleReference,c.jogMotion31.reference,jogWeight);P.y=ref+(P.y-ref)*factor;c.b.pelvis.position.copy(c.b.pelvis.parent.worldToLocal(P));c.root.updateMatrixWorld(true);}for(const side of ['l','r']){const f=feet[side],hip=c.b['thigh_'+side].getWorldPosition(new V()),T=f.p.clone().addScaledVector(forward,-f.p.clone().sub(hip).dot(forward)*(1-factor));if(c.jogMotion31)T.y+=(.003+(f.minY-.003)*factor)-f.minY;gaitAimFoot(c,side,T,f.q,f.ball)}}
function gaitProfileKey28(c){return (c.profile33||c.role)+':'+c.m.scale.toArray().join(',')+':'+(c.walkName||'Walk_Loop')+':'+(c.actionAnatomy24?'action24':'base')}
// Short locomotion transitions on correctly retargeted anatomy. No pelvis compensation.
function gaitFeet(c){
 c.root.updateMatrixWorld(true);const V=THREE.Vector3,Q=THREE.Quaternion;if(!c.gaitMembership){c.gaitMembership={l:[],r:[]};for(const m of c.meshes.filter(m=>m.isSkinnedMesh&&m.visible)){const si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight;for(let i=0;i<si.count;i++)for(const side of ['l','r']){let w=0;for(let j=0;j<4;j++)if(m.skeleton.bones[si.getComponent(i,j)].name==='foot_'+side||m.skeleton.bones[si.getComponent(i,j)].name==='ball_'+side)w+=sw.getComponent(i,j);if(w>.5)c.gaitMembership[side].push({m,i})}}}
 const feet={};for(const side of ['l','r']){const list=c.gaitMembership[side];const points=skinPts45(list),sn45=Math.sin(c.yaw),cs45=Math.cos(c.yaw);let minY=Infinity;for(let k=0;k<points.length;k++)minY=Math.min(minY,points[k].y);let fMx=-Infinity,fMn=Infinity,sMx=-Infinity,sMn=Infinity;for(let k=0;k<points.length;k++){const v=points[k];if(!(v.y<minY+.012))continue;const a=v.x*sn45+v.z*cs45,b=v.x*cs45-v.z*sn45;fMx=Math.max(fMx,a);fMn=Math.min(fMn,a);sMx=Math.max(sMx,b);sMn=Math.min(sMn,b)}const contactArea=(fMx-fMn)*(sMx-sMn);feet[side]={contactArea,p:c.b['foot_'+side].getWorldPosition(new V()),q:gaitOrientation28(c,c.b['foot_'+side]),ball:gaitOrientation28(c,c.b['ball_'+side]),minY};if(c.jogMotion31)Object.defineProperty(feet[side],'skin32',{value:{ids:list,points:points.map(p=>p.clone())}});if(c.ent){let front=-Infinity;for(let k=0;k<points.length;k++){const v=points[k];front=Math.max(front,v.x*sn45+v.z*cs45)}const ids=[],anchor=new V();for(let i=0;i<points.length;i++){const v=points[i];if(v.y>=-.000001&&v.y<=.008&&v.x*sn45+v.z*cs45>front-.05){ids.push(list[i]);anchor.add(v)}}if(ids.length>=3)Object.defineProperty(feet[side],'support25',{value:{ids,anchor:anchor.multiplyScalar(1/ids.length)}});Object.defineProperty(feet[side],'skin39',{value:{list,points,front}})}}return feet;
}
function gaitScaled28(c){return Math.abs(c.m.scale.x-c.m.scale.y)>.000001||Math.abs(c.m.scale.z-c.m.scale.y)>.000001}
function gaitOrientation28(c,b){if(!gaitScaled28(c))return b.getWorldQuaternion(new THREE.Quaternion());const q=new THREE.Quaternion();for(let n=b;n;n=n.parent)q.premultiply(n.quaternion);return q.normalize()}
// Phase35: keep the knee's ACTUAL bend plane continuous. The current knee offset is measured off the
// CURRENT hip->ankle axis and transported by the minimal rotation onto the target axis. Projecting it
// straight onto a strongly moved target axis could land it behind the leg and flip the knee branch.
function gaitBendPole35(H,K,F,axis,fallback){const V=THREE.Vector3,old=F.clone().sub(H).normalize(),bend=K.clone().sub(H);bend.addScaledVector(old,-bend.dot(old));let pole=bend.length()>.001?bend.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(old,axis)):fallback.clone();pole.addScaledVector(axis,-pole.dot(axis));if(pole.length()<.001){pole=fallback.clone().addScaledVector(axis,-fallback.dot(axis))}return pole.normalize();}
// Phase36: side-effect-free reach probe that mirrors the exact acceptance test of gaitAimFoot/gaitAimScaled28
// (same 3mm world margin, same bend-plane knee). Used to keep planner-driven body motion inside protected reach.
function gaitReachProbe36(c,s,T){const V=THREE.Vector3,th=c.b['thigh_'+s],ca=c.b['calf_'+s],ft=c.b['foot_'+s];if(gaitScaled28(c)){const point=b=>c.m.worldToLocal(b.getWorldPosition(new V())),H=point(th),K=point(ca),F=point(ft),target=c.m.worldToLocal(T.clone()),a=H.distanceTo(K),b=K.distanceTo(F),axis=target.clone().sub(H),d=axis.length();if(d>a+b||d<Math.abs(a-b))return false;axis.normalize();const pole=gaitBendPole35(H,K,F,axis,new V(0,0,1)),along=(a*a-b*b+d*d)/(2*d),knee=H.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,a*a-along*along))),Hw=c.m.localToWorld(H.clone()),Kw=c.m.localToWorld(knee);return Hw.distanceTo(Kw)+Kw.distanceTo(T)-Hw.distanceTo(T)>=.003+1e-5}const H=th.getWorldPosition(new V()),K=ca.getWorldPosition(new V()),F=ft.getWorldPosition(new V()),a=H.distanceTo(K),b=K.distanceTo(F),d=H.distanceTo(T);return !(d>a+b-.003-1e-5||d<Math.abs(a-b)+.003+1e-5)}
function gaitAimScaled28(c,s,T,q,bq){const V=THREE.Vector3,Q=THREE.Quaternion,th=c.b['thigh_'+s],ca=c.b['calf_'+s],ft=c.b['foot_'+s],ball=c.b['ball_'+s],point=b=>c.m.worldToLocal(b.getWorldPosition(new V())),H=point(th),K=point(ca),F=point(ft),target=c.m.worldToLocal(T.clone()),a=H.distanceTo(K),b=K.distanceTo(F),axis=target.clone().sub(H),d=axis.length(),margin=.003*Math.max(c.m.scale.x,c.m.scale.y,c.m.scale.z)/(Math.min(c.m.scale.x,c.m.scale.y,c.m.scale.z)**2);if(d>a+b||d<Math.abs(a-b)){c.gaitReachRejected=(c.gaitReachRejected||0)+1;(c.gaitAffineReject28??=[]).push({side:s,target:T.toArray(),hip:c.b['thigh_'+s].getWorldPosition(new V()).toArray(),modelDistance:d,physicalLimit:a+b,protectedLimit:a+b-margin,root:c.root.position.toArray(),pose:c.cur,phase:c.gaitTransitionPlan?.phase,kind:c.gaitTransitionPlan?.kind,remaining:c.ent?.gaitMotion?.remaining});if(c.gaitAffineReject28.length>64)c.gaitAffineReject28.shift();return false}const saved=[th,ca,ft,ball].map(z=>z.quaternion.clone());axis.normalize();let pole=gaitBendPole35(H,K,F,axis,new V(0,0,1));const along=(a*a-b*b+d*d)/(2*d),knee=H.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,a*a-along*along))),parentQ=bone=>{const z=new Q();for(let n=bone.parent;n&&n!==c.m;n=n.parent)z.premultiply(n.quaternion);return z.normalize()},aim=(bone,end,goal)=>{const o=point(bone),delta=new Q().setFromUnitVectors(point(end).sub(o).normalize(),goal.clone().sub(o).normalize()),pq=parentQ(bone);bone.quaternion.premultiply(pq.clone().invert().multiply(delta).multiply(pq));bone.updateMatrixWorld(true)};aim(th,ca,knee);aim(ca,ft,target);ft.quaternion.copy(gaitOrientation28(c,ft.parent).invert().multiply(q));ft.updateMatrixWorld(true);ball.quaternion.copy(gaitOrientation28(c,ball.parent).invert().multiply(bq));ball.updateMatrixWorld(true);const actual=ft.getWorldPosition(new V());c.gaitAffine28={side:s,target:T.toArray(),actual:actual.toArray(),endpointResidual:actual.distanceTo(T),modelDistance:d,modelPhysicalLimit:a+b,modelSufficientMarginLimit:a+b-margin,worldSafetyMargin:.003,actualWorldSlack:th.getWorldPosition(new V()).distanceTo(ca.getWorldPosition(new V()))+ca.getWorldPosition(new V()).distanceTo(ft.getWorldPosition(new V()))-th.getWorldPosition(new V()).distanceTo(T),modelScale:c.m.scale.toArray()};if(c.gaitAffine28.actualWorldSlack<.003||c.gaitAffine28.endpointResidual>.000001){for(const [i,z]of[th,ca,ft,ball].entries())z.quaternion.copy(saved[i]);c.root.updateMatrixWorld(true);c.gaitReachRejected=(c.gaitReachRejected||0)+1;c.gaitAffine28.rejected=true;return false}return true;}
function gaitAimFoot(c,s,T,q,bq){
 if(gaitScaled28(c))return gaitAimScaled28(c,s,T,q,bq);
 const V=THREE.Vector3,Q=THREE.Quaternion,th=c.b['thigh_'+s],ca=c.b['calf_'+s],ft=c.b['foot_'+s],ball=c.b['ball_'+s],H=th.getWorldPosition(new V()),K=ca.getWorldPosition(new V()),F=ft.getWorldPosition(new V()),a=H.distanceTo(K),b=K.distanceTo(F),axis=T.clone().sub(H),d=axis.length();
 if(d>a+b-.003||d<Math.abs(a-b)+.003){c.gaitReachRejected=(c.gaitReachRejected||0)+1;return false}axis.normalize();let pole=gaitBendPole35(H,K,F,axis,new V(Math.sin(c.yaw),0,Math.cos(c.yaw)));
 const along=(a*a-b*b+d*d)/(2*d),knee=H.clone().addScaledVector(axis,along).addScaledVector(pole,Math.sqrt(Math.max(0,a*a-along*along)));
 const aim=(bone,end,target)=>{const o=bone.getWorldPosition(new V());rotWorldQ(bone,new Q().setFromUnitVectors(end.getWorldPosition(new V()).sub(o).normalize(),target.clone().sub(o).normalize()))};aim(th,ca,knee);aim(ca,ft,T);ft.quaternion.copy(ft.parent.getWorldQuaternion(new Q()).invert().multiply(q));ft.updateMatrixWorld(true);ball.quaternion.copy(ball.parent.getWorldQuaternion(new Q()).invert().multiply(bq));ball.updateMatrixWorld(true);return true;
}
// Phase18: preserve each startup support until its actual authored swing; bridge only in air.
const GAIT_SWING18=new Map();
function gaitSwingCurve18(c){
 const key=gaitProfileKey28(c);if(GAIT_SWING18.has(key))return GAIT_SWING18.get(key);const m=skClone(c.m);m.position.set(0,c.neutralGround,0);m.rotation.set(0,0,0);const b={},meshes=[];m.traverse(o=>{if(o.isBone)b[o.name]=o;if(o.isSkinnedMesh&&o.visible)meshes.push(o)});const mix=new THREE.AnimationMixer(m),clip=c.A[c.walkName||'Walk_Loop'].getClip(),a=mix.clipAction(clip);a.play();const N=100,y={l:[],r:[]},poses={l:[],r:[]},fake={root:m,m,b,meshes,yaw:0};for(let i=0;i<N;i++){a.time=clip.duration*i/N;mix.update(0);m.updateMatrixWorld(true);const f=gaitFeet(fake);for(const s of ['l','r']){y[s].push(f[s].minY);if(c.walkName==='Jog_Fwd_Loop')f[s].hip=b['thigh_'+s].getWorldPosition(new THREE.Vector3());poses[s].push(f[s])}}let start=0;for(let i=0;i<N;i++)if(y.l[i]<.006&&y.r[i]>.012){start=i*clip.duration/N;break}const curve={duration:clip.duration,N,y,poses,startPhase:start};GAIT_SWING18.set(key,curve);return curve;
}
function gaitStart18(c,feet){
 const curve=gaitSwingCurve18(c),t=c.A[c.walkName].time,D=curve.duration,N=curve.N,at=(s,u)=>curve.y[s][((Math.floor(u/D*N)%N)+N)%N],schedule={};
 for(const s of ['l','r']){let mainAir=null;if(c.walkName==='Jog_Fwd_Loop'){const ys=curve.y[s],peak=ys.indexOf(Math.max(...ys));let left=peak,right=peak;for(let i=0;i<N;i++){left=(left-1+N)%N;if(ys[left]<.006)break}for(let i=0;i<N;i++){right=(right+1)%N;if(ys[right]<.006)break}mainAir=u=>{const k=((Math.floor(u/D*N)%N)+N)%N,span=(right-left+N)%N,d=(k-left+N)%N;return d>0&&d<span}}const airborne=u=>mainAir?mainAir(u):at(s,u)>.012;let begin=airborne(t)?0:null,end=null;for(let k=1;k<=N*2;k++){const d=k*D/N,y=at(s,t+d),prev=at(s,t+d-D/N);if(begin==null&&airborne(t+d)&&!airborne(t+d-D/N))begin=d;if(begin!=null&&d>begin+.06&&(mainAir?!mainAir(t+d):y<.006)){end=d;break}}if(begin==null||end==null)throw Error('Missing startup swing window '+c.role+' '+s);schedule[s]={begin,end,done:false,landing:curve.poses[s][Math.floor((t+end)/D*N)%N],swingAge:null}}
 return {kind:'start18',feet,schedule,phase:0,age:0,lastTime:t,duration:D};
}
// Phase30: initial Jog toe-off follows an actual material forefoot contract before real source lift.
// A clip phase can already be airborne while the live crossfade is still rolling a grounded shoe.
function gaitApplyJogStart30(c,plan,raw){
 for(const side of ['l','r']){const w=plan.schedule[side];if(w.done)continue;const f=plan.feet[side];let z=w.support30;
  if(!z){const patch=f.support25;if(!patch||patch.ids.length<3)throw Error('Jog startup requires actual previous forefoot '+c.role+' '+side);z={side,ids:patch.ids,anchor:patch.anchor.clone(),footP:f.p.clone(),footQ:f.q.clone(),ballQ:f.ball.clone(),offset:new THREE.Vector3(),contact25:'toe',stage:'support',lastTime:plan.lastTime,phase:0};Object.defineProperty(w,'support30',{value:z,writable:true});}
  // Honor both the dominant real lifted arc and the actual mixed/retargeted whole shoe.
  if(z.stage==='support'&&plan.phase<w.begin){if(!gaitAimFoot(c,side,f.p,f.q,f.ball))throw Error('Unreachable Jog startup support '+side);z.lastTime=plan.lastTime;continue;}
  const saved=c.gaitCarry21;c.gaitCarry21=z;gaitCarryApply21(c,raw);w.support30=c.gaitCarry21;c.gaitCarry21=saved;
  // The first actual descending contact is the landing contract, not the later sampled phase boundary.
  const actual30=gaitContact25(c,side);if(actual30.min>.04)w.sawActualAir30=true;
  if(z.stage==='swing'&&w.sawActualAir30){let a=actual30;if(a.min<=.008){
   if(a.min<.00299){const f=gaitFeet(c)[side],T=f.p.clone();T.y+=.003-a.min;if(!gaitAimFoot(c,side,T,f.q,f.ball))throw Error('Unreachable actual Jog startup landing '+side);a=gaitContact25(c,side);}
   const contact31=c.jogMotion31?gaitRegion32(c,a):'flat',patch=(contact31==='flat'?a.pts:contact31==='toe'?a.toe:contact31==='ball32'?a.ball32:a.heel).filter(v=>v.v.y>=-.000001&&v.v.y<=.008);if(patch.length<3)throw Error('Missing actual Jog startup landing sole '+side);const first=!Object.values(plan.schedule).some(v=>v.done),f=gaitFeet(c)[side];
   if(first)c.gaitPreEnd21={side,ids:patch.map(({m,i})=>({m,i})),flat29:!c.jogMotion31,contact25:contact31,managed25:contact31==='heel',anchor:gaitPatch21(c,patch),footP:f.p.clone(),footQ:f.q.clone(),ballQ:f.ball.clone(),offset:new THREE.Vector3(),stage:'support',lastTime:plan.lastTime,phase:0};
   w.done=true;w.support30=null;w.completed30=plan.phase;w.actualLanding30={minY:a.min,ids:patch.length,first};
  }}
  if(!w.support30&&!w.done){w.done=true;w.completed30=plan.phase;}
 }
 return Object.values(plan.schedule).every(w=>w.done);
}
// 45.0.3: the startup swing that will receive the carry's heel landing may only complete when that landing is reachable (exact
// read-only mirror of gaitLandingContact25's first step and gaitAimFoot's 3 mm protected reach test). Read-only probe; while the foot is still up in the clip's next swing it keeps
// following the clip foot (u=1 => T=raw) and completes at the clip's next landing.
function gaitLandable45(c,plan,s){if(c.gaitPreEnd21)return true;const first=Object.keys(plan.schedule).sort((x,y)=>plan.schedule[x].end-plan.schedule[y].end).find(k=>k===s||plan.schedule[k].done);if(first!==s)return true;
 const a=gaitContact25(c,s);if(a.toe.length>=3)return true;const gap=a.toe.length>0&&a.toeMin<a.min+.018;if(gap&&gaitFrontPatch37(c,s,a).triangles>0)return true;if(a.heel.length<3||(!gap&&a.toeMin<a.min+.018)||Math.abs(a.min-.003)<=.00001)return true;
 const V=THREE.Vector3,T=c.b['foot_'+s].getWorldPosition(new V());T.y+=.003-a.min;if(gaitScaled28(c))return gaitReachProbe36(c,s,T);const H=c.b['thigh_'+s].getWorldPosition(new V()),K=c.b['calf_'+s].getWorldPosition(new V()),F=c.b['foot_'+s].getWorldPosition(new V()),l1=H.distanceTo(K),l2=K.distanceTo(F),d=T.distanceTo(H);return !(d>l1+l2-.003||d<Math.abs(l1-l2)+.003)}
function gaitApplyStart18(c,plan,raw,dt){
 const t=c.A[c.walkName].time,D=plan.duration;let delta=t-plan.lastTime;if(delta<-.000001)delta+=D;const oldPhase=plan.phase,oldAge=plan.age;plan.phase+=Math.max(0,delta);if(delta>0)plan.age+=dt;plan.lastTime=t;if(c.walkName==='Jog_Fwd_Loop')return gaitApplyJogStart30(c,plan,raw);const ease=v=>{v=THREE.MathUtils.clamp(v,0,1);return v*v*(3-2*v)};
 for(const s of ['l','r']){const f=plan.feet[s],g=raw[s],w=plan.schedule[s];if(w.done)continue;if(plan.phase<=w.begin){gaitAimFoot(c,s,f.p,f.q,f.ball);continue}if(w.swingAge==null)w.swingAge=oldAge+(plan.phase>oldPhase?dt*THREE.MathUtils.clamp((w.begin-oldPhase)/(plan.phase-oldPhase),0,1):0);const u=Math.min(THREE.MathUtils.clamp((plan.phase-w.begin)/(w.end-w.begin),0,1),THREE.MathUtils.clamp((plan.age-w.swingAge)/.32,0,1)),v=ease((u-.16)/.84);let goal=g;if(plan.phase<w.end){const q=new THREE.Quaternion().setFromAxisAngle(UP,c.yaw),root=c.root.position.clone().addScaledVector(new THREE.Vector3(Math.sin(c.yaw),0,Math.cos(c.yaw)),(w.end-plan.phase)*(c.walkName==='Jog_Fwd_Loop'?(c.gaitActualSpeed||0)/Math.max(.01,c.A[c.walkName].getEffectiveTimeScale()):c.strideOf(c.walkName))),z=w.landing,local=z.p.clone();if(c.walkName==='Jog_Fwd_Loop'&&z.hip)local.z=z.hip.z+(local.z-z.hip.z)*gaitJogFactor29(c);goal={p:local.applyQuaternion(q).add(root),q:q.clone().multiply(z.q),ball:q.clone().multiply(z.ball)}}const T=f.p.clone().lerp(goal.p,v);if(c.walkName==='Jog_Fwd_Loop'){const lift=ease(u/.2);T.y=THREE.MathUtils.lerp(f.p.y,g.p.y,lift);gaitAimFoot(c,s,T,f.q.clone().slerp(g.q,lift),f.ball.clone().slerp(g.ball,lift))}else{T.y=THREE.MathUtils.lerp(f.p.y,goal.p.y,ease(u))+.065*Math.sin(Math.PI*u);gaitAimFoot(c,s,T,f.q.clone().slerp(goal.q,ease(u)),f.ball.clone().slerp(goal.ball,ease(u)))}if(u>=1&&gaitLandable45(c,plan,s))w.done=true}
 return Object.values(plan.schedule).every(w=>w.done);
}
// Phase21: actual material toe patch stays supported through first-stance heel roll; release correction in real swing.
function gaitPatch21(c,ids){const V=THREE.Vector3;for(const m of new Set(ids.map(z=>z.m)))m.skeleton.update();const p=new V();for(const {m,i}of ids){const v=new V().fromBufferAttribute(m.geometry.attributes.position,i);m.applyBoneTransform(i,v);p.add(v.applyMatrix4(m.matrixWorld))}return p.multiplyScalar(1/ids.length)}
// Phase25: heel-only startup landing is not a forefoot support contract.
function gaitContact25(c,side){const V=THREE.Vector3,list=c.gaitMembership[side];const pts=skinPts45(list).map((v,k)=>{const z=list[k];return {...z,v,f:v.x*Math.sin(c.yaw)+v.z*Math.cos(c.yaw)}}),min=pts.reduce((a,z)=>Math.min(a,z.v.y),Infinity),front=pts.reduce((a,z)=>Math.max(a,z.f),-Infinity),rear=pts.reduce((a,z)=>Math.min(a,z.f),Infinity),B=c.b['ball_'+side].getWorldPosition(new V()),F=c.b['foot_'+side].getWorldPosition(new V()),ballF=B.x*Math.sin(c.yaw)+B.z*Math.cos(c.yaw),ball32=c.jogMotion31?pts.filter(z=>z.f>ballF-B.distanceTo(F)/4):[];return {pts,min,front,ball32,toe:pts.filter(z=>z.v.y<min+.018&&z.f>front-.05),heel:pts.filter(z=>z.v.y<min+.012&&z.f<rear+.10),toeMin:Math.min(...pts.filter(z=>z.f>front-.05).map(z=>z.v.y))};}
// Phase37: the old rule decides by vertex COUNT (>=3 toe vertices = forefoot support; else needs 18mm toe lift). With 1-2 front
// vertices in the band it had no answer (sparse toe meshes: bandages, coat rig). Resolve ONLY that gap structurally: a forefoot
// support needs a real sole contact patch = at least one of the rig's own sole triangles (bind topology) entirely inside the same
// 18mm band in the same front 5cm. No patch -> isolated vertices, the heel is the support -> heel landing. Decided cases unchanged.
function gaitSoleTris37(c,side){c.gaitSoleTris37??={};if(c.gaitSoleTris37[side])return c.gaitSoleTris37[side];const out=[];for(const m of new Set(c.gaitMembership[side].map(z=>z.m))){const own=new Set(c.gaitMembership[side].filter(z=>z.m===m).map(z=>z.i)),idx=m.geometry.index;if(!idx)continue;for(let t=0;t<idx.count;t+=3){const a=idx.getX(t),b=idx.getX(t+1),d=idx.getX(t+2);if(own.has(a)&&own.has(b)&&own.has(d))out.push([m,a,b,d])}}return c.gaitSoleTris37[side]=out}
function gaitFrontPatch37(c,side,a){const key=new Map(a.pts.map(z=>[z.m.uuid+':'+z.i,z])),band=a.min+.018,front=a.front-.05;let area=0,n=0;for(const [m,i,j,k] of gaitSoleTris37(c,side)){const P=[i,j,k].map(x=>key.get(m.uuid+':'+x));if(P.some(z=>!z||z.v.y>=band||z.f<=front))continue;n++;area+=Math.abs((P[1].v.x-P[0].v.x)*(P[2].v.z-P[0].v.z)-(P[2].v.x-P[0].v.x)*(P[1].v.z-P[0].v.z))/2}return {triangles:n,area}}
function gaitLandingContact25(c,side){const a=gaitContact25(c,side);if(a.toe.length>=3)return false;let gap37=null;if(a.toe.length>0&&a.toeMin<a.min+.018){gap37=gaitFrontPatch37(c,side,a);gap37.toeVertices=a.toe.length;gap37.lift=a.toeMin-a.min;(c.gaitGap37??=[]).push(gap37);if(c.gaitGap37.length>32)c.gaitGap37.shift();if(gap37.triangles>0)return false}if(a.heel.length<3||(!gap37&&a.toeMin<a.min+.018))throw Error('Unclassified actual landing '+c.role+' '+side+' '+JSON.stringify(gap37));const iterations=[];let b=a;for(let i=0;i<5&&Math.abs(b.min-.003)>.00001;i++){const f=gaitFeet(c)[side],T=f.p.clone();T.y+=.003-b.min;if(!gaitAimFoot(c,side,T,f.q,f.ball))throw Error('Unreachable actual heel landing '+c.role+' '+side);const achieved=c.b['foot_'+side].getWorldPosition(new THREE.Vector3());b=gaitContact25(c,side);iterations.push({actualMin:b.min,target:T.toArray(),achieved:achieved.toArray(),ankleError:achieved.distanceTo(T)})}c.gaitLanding25={side,beforeMin:a.min,beforeToeMin:a.toeMin,afterMin:b.min,afterToeMin:b.toeMin,iterations,root:c.root.position.toArray()};if(Math.abs(b.min-.003)>.00001)throw Error('Heel landing skin did not converge '+c.role+' '+b.min);return true;}
// Phase32: solve actual weighted sole material with ankle translation + independent foot/ball rotations.
// This changes joint pose only, never bind lengths, geometry weights, pelvis or reach acceptance.
function gaitRegion32(c,a){return a.toe.filter(p=>p.v.y>=0&&p.v.y<=.008).length>=3?'toe':a.ball32.filter(p=>p.v.y>=0&&p.v.y<=.008).length>=3?'ball32':'heel';}
function gaitSkinPoints32(c,ids){for(const m of new Set(ids.map(z=>z.m)))m.skeleton.update();return ids.map(({m,i})=>{const p=new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.position,i);m.applyBoneTransform(i,p);return p.applyMatrix4(m.matrixWorld)});}
function gaitLinear32(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let j=0;j<n;j++){let k=j;for(let i=j+1;i<n;i++)if(Math.abs(M[i][j])>Math.abs(M[k][j]))k=i;[M[j],M[k]]=[M[k],M[j]];if(Math.abs(M[j][j])<1e-14)return null;const d=M[j][j];for(let q=j;q<=n;q++)M[j][q]/=d;for(let i=0;i<n;i++)if(i!==j){const d=M[i][j];for(let q=j;q<=n;q++)M[i][q]-=d*M[j][q]}}return M.map(r=>r[n]);}
// Phase33: contact on actual isolated shoe rigid regions, not three deforming calf-weighted skin points.
// Original anatomical IK, comfort planning and real material anchors remain; only candidate GLBs use corrected shoe skin.
function gaitRigidSupport33(c,z,g){
 const V=THREE.Vector3,Q=THREE.Quaternion,side=z.side;
 if(z.contact25==='heel'){
  let R=z.roll33;
  if(!R){const snap=z.creationSnapshot32||z.transferSnapshot32||c.gaitLastFeet[side].skin32,rank=z.ids.map(id=>({id,p:snap.points[snap.ids.findIndex(t=>t.m===id.m&&t.i===id.i)]})).sort((a,b)=>a.p.y-b.p.y);if(!rank.length)throw Error('No actual initial heel33');R=z.roll33={id:rank[0].id,anchor:rank[0].p.clone(),plane:rank[0].p.y,q:z.footQ.clone(),ball:z.ballQ.clone(),changes:0};}
  const evaluate=(q,bq)=>{gaitOrient22(c,side,q,bq);const p=gaitSkinPoints32(c,[R.id])[0],offset=R.anchor.clone().sub(p),a=gaitContact25(c,side),low=a.pts.reduce((u,v)=>u.v.y<v.v.y?u:v);return{q,bq,offset,T:g.p.clone().add(offset),min:low.v.y+offset.y,low,a};};
  let startQ=R.q.clone(),startBall=R.ball.clone(),end=null;
  for(let event=0;event<12;event++){
   const trial=u=>evaluate(startQ.clone().slerp(g.q,u),startBall.clone().slerp(g.ball,u));end=trial(1);
   if(end.min>=R.plane-1e-8)break;
   const hit=end.low;let lo=0,hi=1;for(let j=0;j<22;j++){const mid=(lo+hi)/2;if(trial(mid).min>=R.plane-1e-8)lo=mid;else hi=mid;}
   end=trial(lo);const incoming=trial(hi).low;end=trial(lo);const old=R.id;R.id={m:incoming.m,i:incoming.i};R.anchor=gaitSkinPoints32(c,[R.id])[0].add(end.offset);startQ=end.q.clone();startBall=end.bq.clone();R.changes++;
   if((old.m===R.id.m&&old.i===R.id.i)||event===11)throw Error('Unresolved actual shoe rolling event33 '+JSON.stringify({side,event,min:end.min,plane:R.plane,changes:R.changes}));
  }
  gaitOrient22(c,side,end.q,end.bq);if(!gaitAimFoot(c,side,end.T,end.q,end.bq))throw Error('Unreachable actual heel rolling33 '+side);z.offset.copy(end.offset);R.q=end.q.clone();R.ball=end.bq.clone();const a=gaitContact25(c,side),toe=a.toe.filter(t=>t.v.y>=0&&t.v.y<=.008);if(toe.length>=3){z.ids=toe.map(({m,i})=>({m,i}));z.anchor=gaitPatch21(c,z.ids);z.footP=c.b['foot_'+side].getWorldPosition(new V());z.footQ=end.q.clone();z.ballQ=end.bq.clone();z.contact25='toe';delete z.heelBaseQ;}
 }else {const plan=gaitHeelPlan22(c,z,g,z.ballQ);if(!gaitAimFoot(c,side,plan.T,plan.q,z.ballQ))throw Error('Unreachable rigid forefoot support33 '+side);z.offset.copy(plan.offset);}
 const a=gaitContact25(c,side),foot=gaitFeet(c)[side];c.skinContact33={side,kind:z.contact25,min:a.min,rollingChanges:z.roll33?.changes||0};if(a.min<0)throw Error('Actual rigid shoe penetrates floor33 '+JSON.stringify(c.skinContact33));
 z.actualSupport32={p:foot.p.clone(),q:foot.q.clone(),ball:foot.ball.clone()};(c.gaitSolvedContact32??={})[side]=true;
}

function gaitSkinSupport32(c,z,g){
 const V=THREE.Vector3,Q=THREE.Quaternion,side=z.side;
 if(!z.goals32){
  if(z.contact25!=='heel'){const weight=t=>{const a=t.m.geometry.attributes;let w=0;for(let j=0;j<4;j++)if(t.m.skeleton.bones[a.skinIndex.getComponent(t.i,j)].name==='ball_'+side)w+=a.skinWeight.getComponent(t.i,j);return w;};z.ids=[...z.ids].sort((a,b)=>weight(b)-weight(a)).slice(0,3);}
  const snap=z.transferSnapshot32||z.creationSnapshot32||c.gaitLastFeet?.[side]?.skin32;if(!snap)throw Error('Missing actual prior skin snapshot32 '+side);if(z.contact25==='heel'){const sorted=z.ids.map(t=>({t,p:snap.points[snap.ids.findIndex(v=>v.m===t.m&&v.i===t.i)]})).sort((a,b)=>a.p.y-b.p.y),chosen=[];for(const v of sorted)if(chosen.every(u=>u.p.distanceTo(v.p)>.00001)){chosen.push(v);if(chosen.length===3)break;}if(chosen.length<3)throw Error('Missing three actual distinct heel points32');z.ids=chosen.map(v=>v.t);}z.goals32=z.ids.map(t=>{const i=snap.ids.findIndex(v=>v.m===t.m&&v.i===t.i);if(i<0)throw Error('Missing actual skin ID32');return snap.points[i].clone()});z.anchor=z.goals32.reduce((a,p)=>a.add(p),new V()).multiplyScalar(1/z.ids.length);
 }
 if(z.contact25!=='toe'&&!z.toePlant32){const a=gaitContact25(c,side),front=a.front,rank=t=>{const attrs=t.m.geometry.attributes;let w=0;for(let j=0;j<4;j++)if(t.m.skeleton.bones[attrs.skinIndex.getComponent(t.i,j)].name==='ball_'+side)w+=attrs.skinWeight.getComponent(t.i,j);return w;},candidates=a.pts.filter(t=>t.f>front-.05&&rank(t)>.98).sort((a,b)=>a.v.y-b.v.y),chosen=[];for(const t of candidates)if(chosen.every(v=>v.v.distanceTo(t.v)>.00001)){chosen.push(t);if(chosen.length===3)break;}if(chosen.length<3)throw Error('Missing actual forefoot surface for loading32');z.toePlant32={ids:chosen.map(({m,i})=>({m,i})),y:chosen.map(t=>t.v.y)};}
 const original=Object.fromEntries(['thigh_','calf_','foot_','ball_'].map(n=>[n+side,c.b[n+side].quaternion.clone()]));
 const pelvisLocal=c.b.pelvis.position.clone(),P0=c.b.pelvis.getWorldPosition(new V());const warm=z.actualSupport32||c.gaitLastFeet[side],H=c.b['thigh_'+side].getWorldPosition(new V()),K=c.b['calf_'+side].getWorldPosition(new V()),F=c.b['foot_'+side].getWorldPosition(new V()),a=H.distanceTo(K),b=K.distanceTo(F),T0=warm.p.clone(),Q0=warm.q.clone(),B0=warm.ball.clone();if(H.distanceTo(T0)>a+b-.003)T0.copy(g.p);
 const quat=(v,q)=>{const angle=v.length();return angle>0?new Q().setFromAxisAngle(v.multiplyScalar(1/angle),angle).multiply(q):q.clone();},log=q=>{if(q.w<0)q.set(-q.x,-q.y,-q.z,-q.w);const s=Math.hypot(q.x,q.y,q.z),k=s>1e-9?2*Math.atan2(s,q.w)/s:2;return [q.x*k,q.y*k,q.z*k]};
 let floorIds=[],last=null;
 const evaluate=x=>{for(const[n,q]of Object.entries(original))c.b[n].quaternion.copy(q);c.b.pelvis.position.copy(pelvisLocal);c.root.updateMatrixWorld(true);const movingH=c.b['thigh_'+side].getWorldPosition(new V()),T=T0.clone().add(new V(...x.slice(0,3))),q=quat(new V(...x.slice(3,6)),Q0),bq=quat(new V(...x.slice(6,9)),B0),d=movingH.distanceTo(T);if(d>a+b-.003||d<Math.abs(a-b)+.003)return null;if(!gaitAimFoot(c,side,T,q,bq))throw Error('Skin32 unexpected protected reach');c.root.updateMatrixWorld(true);const pts=gaitSkinPoints32(c,z.ids),r=[];for(let i=0;i<pts.length;i++){const e=pts[i].clone().sub(z.goals32[i]);r.push(e.x*100,e.y,e.z*100)}if(z.contact25!=='toe'){const u=Math.min(1,z.phase/(c.jogMotion31.windows[side].duty*c.A[c.walkName].getClip().duration/3)),v=u*u*(3-2*u);gaitSkinPoints32(c,z.toePlant32.ids).forEach((p,i)=>r.push(5*(p.y-THREE.MathUtils.lerp(z.toePlant32.y[i],.003,v))));}for(const p of gaitSkinPoints32(c,floorIds))r.push(400*Math.min(0,p.y-.001));r.push(...log(q.clone().multiply(g.q.clone().invert())).map(v=>v*.001),...log(bq.clone().multiply(g.ball.clone().invert())).map(v=>v*.002));return {r,cost:r.reduce((s,v)=>s+v*v,0),T,q,bq,pts};};
 let x=Array(9).fill(0);last=evaluate(x);if(!last)throw Error('No reachable initial skin32 '+side);
 for(let iteration=0;iteration<10;iteration++){
  floorIds=gaitContact25(c,side).pts.sort((a,b)=>a.v.y-b.v.y).slice(0,24).map(({m,i})=>({m,i}));last=evaluate(x);const J=[];
  for(let j=0;j<9;j++){const y=[...x],eps=j<3?.00002:.0002;y[j]+=eps;const trial=evaluate(y);if(!trial){J.push(last.r.map(()=>0));continue;}J.push(trial.r.map((v,i)=>(v-last.r[i])/eps));}
  const A=Array.from({length:9},(_,i)=>Array.from({length:9},(_,j)=>J[i].reduce((s,v,k)=>s+v*J[j][k],0)+(i===j?.000001:0))),rhs=J.map(row=>-row.reduce((s,v,k)=>s+v*last.r[k],0)),delta=gaitLinear32(A,rhs);if(!delta)break;let chosen=null;
  for(const scale of [1,.5,.25,.125,.0625]){const y=x.map((v,i)=>v+delta[i]*scale),trial=evaluate(y);if(trial&&trial.cost<last.cost){chosen={x:y,p:trial};break}}
  if(!chosen){last=evaluate(x);break;}x=chosen.x;last=chosen.p;
 }
 last=evaluate(x);const whole=gaitContact25(c,side),maxError=Math.max(...last.pts.map((p,i)=>p.distanceTo(z.goals32[i]))),maxTangent=Math.max(...last.pts.map((p,i)=>Math.hypot(p.x-z.goals32[i].x,p.z-z.goals32[i].z))),contactY=last.pts.map(p=>p.y);c.skinContact32={side,kind:z.contact25,materialIds:z.ids.map(v=>({mesh:v.m.name,index:v.i})),goalPoints:z.goals32.map(p=>p.toArray()),maxError,maxTangent,contactY,min:whole.min,toeMin:whole.toeMin,iterations:10,sourceFootDeltaDegrees:2*Math.acos(Math.min(1,Math.abs(last.q.dot(g.q))))*180/Math.PI,horizontalWeightTransfer:[0,0],sourceBallDeltaDegrees:2*Math.acos(Math.min(1,Math.abs(last.bq.dot(g.ball))))*180/Math.PI};
 const nextRegion=gaitRegion32(c,whole),acquiredToe=(z.contact25==='heel'||(z.contact25==='ball32'&&nextRegion==='toe'))&&z.contact25!==nextRegion&&nextRegion!=='heel'?(nextRegion==='toe'?whole.toe:whole.ball32).filter(p=>p.v.y>=0&&p.v.y<=.008):[];if(acquiredToe.length>=3)c.skinContact32.transferTo=nextRegion;if(whole.min<0||maxTangent>.0005||(acquiredToe.length<3&&contactY.some(y=>y<0||y>.008)))throw Error('Unsolved actual material contact32 '+JSON.stringify(c.skinContact32));
 z.offset.copy(last.T).sub(g.p);z.actualSupport32={p:last.T.clone(),q:last.q.clone(),ball:last.bq.clone()};(c.gaitSolvedContact32??={})[side]=true;
 if(z.contact25!=='toe'){const toe=acquiredToe;if(toe.length>=3){c.gaitTransfer32={side,oldIds:z.ids.map(v=>({mesh:v.m.name,index:v.i})),oldActualY:contactY,newActual:toe.map(v=>({mesh:v.m.name,index:v.i,p:v.v.toArray()}))};z.ids=toe.map(({m,i})=>({m,i}));z.anchor=gaitPatch21(c,z.ids);z.footQ=last.q.clone();z.ballQ=last.bq.clone();z.footP=last.T.clone();z.contact25=nextRegion;z.goals32=null;z.transferSnapshot32={ids:[...z.ids],points:gaitSkinPoints32(c,z.ids)};}}
}

function gaitHeelSupport25(c,z,g){const Q=THREE.Quaternion,previous=z.lastHeelQ||z.footQ,previousBall=z.lastHeelBall||z.ballQ;
 const test=u=>{const q=previous.clone().slerp(g.q,u),bq=previousBall.clone().slerp(g.ball,u);gaitOrient22(c,z.side,q,bq);const offset=z.anchor.clone().sub(gaitPatch21(c,z.ids)),T=g.p.clone().add(offset),a=gaitContact25(c,z.side);return{q,bq,T,toeMin:a.toeMin+offset.y}};let p=test(1);if(p.toeMin<.003){let lo=0,hi=1;if(test(0).toeMin<.0028)throw Error('Heel support lost before toe transfer '+c.role);for(let j=0;j<12;j++){const mid=(lo+hi)/2;if(test(mid).toeMin>=.003)lo=mid;else hi=mid}p=test(lo)}if(!gaitAimFoot(c,z.side,p.T,p.q,p.bq))throw Error('Unreachable heel support '+c.role+' '+z.side);z.offset.copy(p.T).sub(g.p);z.lastHeelQ=p.q.clone();z.lastHeelBall=p.bq.clone();const a=gaitContact25(c,z.side),toe=a.toe.filter(t=>t.v.y>=-.000001&&t.v.y<=.008);if(toe.length>=3){z.ids=toe.map(({m,i})=>({m,i}));z.anchor.copy(gaitPatch21(c,z.ids));z.ballQ.copy(gaitOrientation28(c,c.b['ball_'+z.side]));z.footQ.copy(gaitOrientation28(c,c.b['foot_'+z.side]));z.footP.copy(c.b['foot_'+z.side].getWorldPosition(new THREE.Vector3()));z.contact25='toe';delete z.heelBaseQ;c.gaitTransfer25={side:z.side,toeMin:a.toeMin,heelMin:a.min,actualIds:toe.length,anchor:z.anchor.toArray()};}}
function gaitCarryBegin21(c,plan){
 if(plan.contactReleased25){c.gaitCarry21=null;return}
 if(c.gaitPreEnd21){const p=c.gaitPreEnd21;c.gaitCarry21=(p.managed25||c.walkName==='Jog_Fwd_Loop')?{...p,anchor:p.anchor.clone(),ballQ:p.ballQ.clone(),offset:p.offset.clone()}:{...p,anchor:p.anchor.clone(),ballQ:p.ballQ.clone(),offset:new THREE.Vector3(),stage:'support',lastTime:c.A[c.walkName].time,phase:0};c.gaitPreEnd21=null;return}
 const order45=Object.keys(plan.schedule).sort((a,b)=>plan.schedule[a].end-plan.schedule[b].end),side=order45.find(k=>plan.schedule[k].done)??order45[0];const actual29=a=>c.walkName==='Jog_Fwd_Loop'?{...a,toe:a.toe.filter(t=>t.v.y>=-.000001&&t.v.y<=.008),heel:a.heel.filter(t=>t.v.y>=-.000001&&t.v.y<=.008)}:a;let a=gaitContact25(c,side),contact='toe',managed=false;if(c.walkName==='Jog_Fwd_Loop'){const before=a.min;if(!plan.schedule[side].done)throw Error('Jog support requested before completed landing '+side);for(let i=0;i<4&&a.min<.00299;i++){const f=gaitFeet(c)[side],T=f.p.clone();T.y+=.003-a.min;if(!gaitAimFoot(c,side,T,f.q,f.ball))throw Error('Unreachable actual Jog landing '+side);a=gaitContact25(c,side)}if(a.min>.008||a.min<-.000001)throw Error('Jog landing has no actual floor patch '+side+' '+a.min);a=actual29(a);c.gaitLanding29={side,beforeMin:before,afterMin:a.min,toeIds:a.toe.length,heelIds:a.heel.length};}if(a.toe.length<3){if(!plan.schedule[side].done)throw Error('Carry requested before actual landing '+c.role);if(c.walkName!=='Jog_Fwd_Loop'||a.heel.length<3)gaitLandingContact25(c,side);a=actual29(gaitContact25(c,side));contact='heel';managed=true}const ids=(contact==='heel'?a.heel:a.toe).map(({m,i})=>({m,i}));if(ids.length<3)throw Error('Missing actual '+contact+' support patch '+c.role+' '+side);c.gaitCarry21={side,ids,contact25:contact,managed25:managed,anchor:gaitPatch21(c,ids),ballQ:gaitOrientation28(c,c.b['ball_'+side]),footQ:gaitOrientation28(c,c.b['foot_'+side]),footP:c.b['foot_'+side].getWorldPosition(new THREE.Vector3()),offset:new THREE.Vector3(),stage:'support',lastTime:c.A[c.walkName].time,phase:0};
}
function gaitCarryObserve21(c,plan){if(plan.contactReleased25)return;if(!c.gaitPreEnd21){gaitCarryBegin21(c,plan);c.gaitPreEnd21=c.gaitCarry21;c.gaitCarry21=null}const z=c.gaitPreEnd21;if(z.managed25||c.walkName==='Jog_Fwd_Loop'){c.gaitCarry21=z;gaitCarryApply21(c,gaitFeet(c));c.gaitPreEnd21=c.gaitCarry21;c.gaitCarry21=null;if(!c.gaitPreEnd21)plan.contactReleased25=true;return}z.anchor.copy(gaitPatch21(c,z.ids));z.ballQ.copy(gaitOrientation28(c,c.b['ball_'+z.side]));z.footQ.copy(gaitOrientation28(c,c.b['foot_'+z.side]));z.footP.copy(c.b['foot_'+z.side].getWorldPosition(new THREE.Vector3()))}
// Phase22: plan anatomically comfortable toe-off heel roll against the ACTUAL current pelvis/hip, not a clamped endpoint.
function gaitHeelRaw22(z,q){const d=q.clone().multiply(z.heelBaseQ.clone().invert());return angd(2*Math.atan2(d.x*z.rollAxis.x+d.y*z.rollAxis.y+d.z*z.rollAxis.z,d.w),0)}
function gaitOrient22(c,s,q,bq){const ft=c.b['foot_'+s],ball=c.b['ball_'+s];ft.quaternion.copy(gaitOrientation28(c,ft.parent).invert().multiply(q));ft.updateMatrixWorld(true);ball.quaternion.copy(gaitOrientation28(c,ball.parent).invert().multiply(bq));ball.updateMatrixWorld(true)}
function gaitHeelPlan22(c,z,g,bq){
 const V=THREE.Vector3,Q=THREE.Quaternion;if(!z.heelBaseQ){z.heelBaseQ=z.footQ.clone();const f=z.anchor.clone().sub(z.footP);f.y=0;z.rollAxis=new V().crossVectors(UP,f).normalize();z.heelAngle=0}const H=c.b['thigh_'+z.side].getWorldPosition(new V()),K=c.b['calf_'+z.side].getWorldPosition(new V()),F=c.b['foot_'+z.side].getWorldPosition(new V()),point=v=>gaitScaled28(c)?c.m.worldToLocal(v.clone()):v,a=point(H).distanceTo(point(K)),b=point(K).distanceTo(point(F)),comfort=Math.sqrt(a*a+b*b+2*a*b*Math.cos(Math.PI/12)),rawAngle=gaitHeelRaw22(z,g.q),first=Math.max(0,z.heelAngle-rawAngle);
 const test=extra=>{const q=new Q().setFromAxisAngle(z.rollAxis,extra).multiply(g.q);gaitOrient22(c,z.side,q,bq);const offset=z.anchor.clone().sub(gaitPatch21(c,z.ids)),T=g.p.clone().add(offset);return {q,offset,T,d:point(H).distanceTo(point(T)),extra}};let plan=test(first);if(plan.d>comfort){let lo=first,hi=null;for(let extra=first+Math.PI/180;extra<=Math.PI*8/180+.000001;extra+=Math.PI/180){const p=test(extra);if(p.d<=comfort){hi=extra;break}lo=extra}if(hi==null)throw Error('No reachable comfortable toe-off heel roll '+c.role+' '+z.side);for(let j=0;j<8;j++){const mid=(lo+hi)/2;if(test(mid).d<=comfort)hi=mid;else lo=mid}plan=test(hi)}z.heelAngle=Math.max(z.heelAngle,rawAngle+plan.extra);c.gaitPlan22={actualHip:H.toArray(),root:c.root.position.toArray(),horizontalWeightTransfer:c.tilt.position.x,actualTarget:plan.T.toArray(),distance:plan.d,protectedLimit:a+b-.003,comfortDistance:comfort,comfortKneeFlexDegrees:15,extraHeelDegrees:plan.extra*180/Math.PI,rawHeelDegrees:rawAngle*180/Math.PI};return plan;
}
function gaitCarryApply21(c,raw){
 const z=c.gaitCarry21;if(!z)return;const curve=gaitSwingCurve18(c),D=curve.duration,t=c.A[c.walkName].time;let delta=t-z.lastTime;if(delta<-.000001)delta+=D;z.phase+=Math.max(0,delta);z.lastTime=t;const at=u=>curve.y[z.side][((Math.floor(u/D*curve.N)%curve.N)+curve.N)%curve.N],g=raw[z.side];
 if(c.jogMotion31&&g.minY<=.008)z.releaseArmed33=true;if(z.stage==='support'&&(!c.jogMotion31||z.releaseArmed33!==false)&&(c.walkName==='Jog_Fwd_Loop'?g.minY>.012:at(t)>.012)){z.stage='swing';if(c.jogMotion31&&z.actualSupport32){z.releaseQ32=z.actualSupport32.q.clone();z.releaseBall32=z.actualSupport32.ball.clone();}z.swingBegin=z.phase;for(let k=1;k<=curve.N*2;k++){const d=k*D/curve.N;if(d>.06&&at(t+d)<.006){z.swingEnd=z.phase+d;break}}if(z.swingEnd==null)throw Error('Missing first-stance release landing '+c.role)}
 const u=z.stage==='swing'?THREE.MathUtils.clamp((z.phase-z.swingBegin)/(z.swingEnd-z.swingBegin),0,1):0,v=u*u*(3-2*u);let bq=z.ballQ.clone().slerp(g.ball,v),q=g.q,offset;
 if(z.stage==='support'&&c.jogMotion31){gaitRigidSupport33(c,z,g);return;}if(z.stage==='support'&&z.flat29){if(!gaitAimFoot(c,z.side,z.footP,z.footQ,z.ballQ))throw Error('Unreachable actual flat Jog stance '+z.side);z.offset.copy(z.footP).sub(g.p);return;}if(z.stage==='support'&&z.contact25==='heel'){gaitHeelSupport25(c,z,g);return}if(z.stage==='support'){let plan=null;try{plan=gaitHeelPlan22(c,z,g,bq)}catch(err){if(c.walkName!=='Jog_Fwd_Loop'||!/No reachable comfortable toe-off/.test(err.message))throw err;c.jogReachRelease39=(c.jogReachRelease39||0)+1;window.__jogReachRelease39=(window.__jogReachRelease39||0)+1;z.stage='swing';z.swingBegin=z.phase;z.swingEnd=null;for(let k=1;k<=curve.N*2;k++){const d=k*D/curve.N;if(d>.06&&at(t+d)<.006){z.swingEnd=z.phase+d;break}}if(z.swingEnd==null)throw Error('Missing reach-release landing '+c.role)}if(plan){q=plan.q;z.offset.copy(plan.offset);offset=z.offset}}else{const extra=z.heelBaseQ?Math.max(0,z.heelAngle-gaitHeelRaw22(z,g.q))*(1-v):0;q=z.flat29?z.footQ.clone().slerp(g.q,v):new THREE.Quaternion().setFromAxisAngle(z.rollAxis||UP,extra).multiply(g.q);if(c.jogMotion31&&z.releaseQ32){q=z.releaseQ32.clone().slerp(g.q,v);bq=z.releaseBall32.clone().slerp(g.ball,v);}gaitOrient22(c,z.side,q,bq);offset=z.offset.clone().multiplyScalar(1-v);if(u>=1)c.gaitCarry21=null}gaitAimFoot(c,z.side,g.p.clone().add(offset),q,bq);
}
// A real stop can raise the trunk before the rear support has lifted. Keep its actual toe patch, roll the heel, then release at the authored stop swing.
function gaitStopSupport25(c,plan,s,raw){
 if(s!==plan.stance||plan.age>=.30)return false;const start=plan.feet[s],V=THREE.Vector3,th=c.b['thigh_'+s],ca=c.b['calf_'+s],ft=c.b['foot_'+s],H=th.getWorldPosition(new V()),K=ca.getWorldPosition(new V()),F=ft.getWorldPosition(new V()),point=v=>gaitScaled28(c)?c.m.worldToLocal(v.clone()):v,limit=point(H).distanceTo(point(K))+point(K).distanceTo(point(F))-(gaitScaled28(c)?.003*Math.max(...c.m.scale.toArray())/(Math.min(...c.m.scale.toArray())**2):.003),d=point(H).distanceTo(point(start.p));let hold=c.gaitStop25?.plan===plan?c.gaitStop25:null;
 if(!hold){if(d<=limit)return false;const previous=c.gaitLastFeet?.[s];let patch=start.support25||(previous&&previous.p.distanceTo(start.p)<.001&&previous.q.angleTo(start.q)<.001?previous.support25:null);if((!patch||patch.ids.length<3)&&start.placed39){const k=start.placed39.skin,dr=start.placed39.drop,ids=[],anchor=new V();for(let i=0;i<k.points.length;i++){const v=k.points[i],y=v.y+dr;if(y>=-.000001&&y<=.008&&v.x*Math.sin(c.yaw)+v.z*Math.cos(c.yaw)>k.front-.05){ids.push(k.list[i]);anchor.add(new V(v.x,y,v.z))}}if(ids.length>=3){patch={ids,anchor:anchor.multiplyScalar(1/ids.length)};c.gaitPlacedSupport39=(c.gaitPlacedSupport39||0)+1}}if(!patch||patch.ids.length<3)return false;const z={side:s,ids:patch.ids,anchor:patch.anchor.clone(),footP:start.p.clone(),footQ:start.q.clone(),ballQ:start.ball.clone(),offset:new V()};hold=c.gaitStop25={plan,z};plan.heelSupport25={side:s,initialDistance:d,protectedLimit:limit,actualToeIds:patch.ids.length};}
 const z=hold.z,g={p:raw.p,q:start.q,ball:start.ball};
 let landing;
 try{landing=gaitHeelPlan22(c,z,g,z.ballQ)}
 catch(err){
  if(!err.message.startsWith('No reachable comfortable toe-off heel roll'))throw err;
  // Let the regular stop step bring the foot to a reachable position.
  return false;
 }
 if(!gaitAimFoot(c,s,landing.T,landing.q,z.ballQ))return false;
 plan.feet[s]=gaitFeet(c)[s];
 plan.heelSupport25.extraHeelDegrees=landing.extra*180/Math.PI;
 plan.heelSupport25.actualTarget=landing.T.toArray();
 return true;
}
// Phase29: native Jog has a short real stance. Preserve actual material contact on every cycle, release only when the actual authored shoe lifts.
function gaitJogContacts29(c,p,raw){if(c.walkName!=='Jog_Fwd_Loop')return;if(p.act!=='walk'||(c.gaitActualSpeed||0)<.08||c.ent.vs||c.gaitTransitionPlan||c.gaitTurnPlan){c.gaitJogContacts29=null;return}const states=c.gaitJogContacts29||(c.gaitJogContacts29={});for(const side of ['l','r']){if(c.gaitCarry21?.side===side){delete states[side];continue}let z=states[side],actualLanding33=false;if(z){const managed=c.gaitCarry21;c.gaitCarry21=z;gaitCarryApply21(c,raw);z=states[side]=c.gaitCarry21;c.gaitCarry21=managed;if(z&&c.jogMotion31&&z.stage==='swing'){const a=gaitContact25(c,side);z.sawAir33||=a.min>.04;if(z.sawAir33&&a.min<=.008&&a.min<(z.previousMin33??Infinity)){actualLanding33=true;z=states[side]=null;c.actualLanding33={side,min:a.min,clipTime:c.A[c.walkName].time,reason:'first descending real shoe contact, not sampled phase end'};}else z.previousMin33=a.min;}}if(!z){if(!actualLanding33&&raw[side].minY>.008)continue;let a=gaitContact25(c,side);if(a.min>.008)continue;if(a.min<.00299){const f=gaitFeet(c)[side],T=f.p.clone();T.y+=.003-a.min;if(!gaitAimFoot(c,side,T,f.q,f.ball))throw Error('Unreachable actual Jog contact landing '+side);a=gaitContact25(c,side)}const contact=c.jogMotion31?gaitRegion32(c,a):'flat',patch=(contact==='flat'?a.pts:contact==='toe'?a.toe:contact==='ball32'?a.ball32:a.heel).filter(v=>v.v.y>=-.000001&&v.v.y<=.008);if(patch.length<3)throw Error('Missing actual plain Jog sole contact '+side);const ids=patch.map(({m,i})=>({m,i}));states[side]={side,ids,flat29:!c.jogMotion31,contact25:contact,managed25:contact==='heel',anchor:gaitPatch21(c,ids),ballQ:gaitOrientation28(c,c.b['ball_'+side]),footQ:gaitOrientation28(c,c.b['foot_'+side]),footP:c.b['foot_'+side].getWorldPosition(new THREE.Vector3()),offset:new THREE.Vector3(),stage:'support',lastTime:c.A[c.walkName].time,phase:0};states[side].releaseArmed33=raw[side].minY<=.008;gaitSeedSupport32(c,states[side]);}}}
function gaitSeedSupport32(c,z){if(c.jogMotion31&&z&&!z.creationSnapshot32)z.creationSnapshot32={ids:[...z.ids],points:gaitSkinPoints32(c,z.ids)};}
const beginSupport32=gaitCarryBegin21;gaitCarryBegin21=function(c,plan){beginSupport32(c,plan);gaitSeedSupport32(c,c.gaitCarry21);};
const startSupport32=gaitApplyJogStart30;gaitApplyJogStart30=function(c,plan,raw,dt){const done=startSupport32(c,plan,raw,dt);gaitSeedSupport32(c,c.gaitPreEnd21);return done;};
// Phase38b: stop stance = the foot that ACTUALLY carries a ground forefoot patch. The low-band contactArea heuristic compares each
// foot against its own minimum, so a foot hovering 8mm up could outrank the grounded one at a fast-walk stop (L9 groups).
// Phase38: the stop destination is the character's calm Idle stance. It used to exist only after one plain idle frame went
// through gaitTransition; a patient that spawns into an in-place turn (queue corners, emergency groups) never had one, so its
// first stop silently skipped the stop plan and left stride feet planted -> overreach on the next turn / no stop support.
// Fall back to the authored Idle template (same source the turn planner uses) when no observed idle stance exists yet.
function gaitIdleFeet38(c){if(c.gaitIdleFeet)return c.gaitIdleFeet;const t=gaitIdle16(c);c.gaitIdleFeet={};for(const s of ['l','r'])c.gaitIdleFeet[s]={p:t[s].p.clone(),q:t[s].q.clone(),ball:t[s].ball.clone(),minY:t[s].minY};c.gaitIdleFeet38=(c.gaitIdleFeet38||0)+1;return c.gaitIdleFeet}
function gaitTransition(c,p,dt){
 if(!c.anatomicalGait)return;const eligible=!c.ent.vs&&Math.abs(c.turnError||0)<.18&&['idle','treatp','walk'].includes(p.act),V=THREE.Vector3,Q=THREE.Quaternion,ease=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*(3-2*t)},feet=gaitFeet(c),rootQ=c.root.getWorldQuaternion(new Q());
 if(!eligible){c.gaitPreEnd21=null;c.gaitCarry21=null;c.gaitTransitionPlan=null;if(!c.ent.vs&&['idle','treatp','walk'].includes(p.act)){for(const s of ['l','r'])if(feet[s].minY<.002){const f=feet[s],T=f.p.clone();T.y+=.002-f.minY;gaitAimFoot(c,s,T,f.q,f.ball)}c.gaitLastFeet=gaitFeet(c)}else c.gaitLastFeet=feet;return}
 if(p.act==='walk'&&c.pose?.act!=='walk'&&c.gaitLastFeet){c.gaitPreEnd21=null;c.gaitTransitionPlan=['Walk_Loop','Jog_Fwd_Loop'].includes(c.walkName)?gaitStart18(c,c.gaitLastFeet):{kind:'start',age:0,feet:c.gaitLastFeet};}
 if(p.act!=='walk'&&c.pose?.act==='walk'&&c.gaitLastFeet&&gaitIdleFeet38(c)){const old=c.gaitLastFeet,stance0=old.l.minY>.04?'r':old.r.minY>.04?'l':old.l.contactArea>old.r.contactArea?'l':'r',other0=stance0==='l'?'r':'l',stance=(!old[stance0].support25&&old[other0].support25)?other0:stance0,dest={};if(stance!==stance0)c.gaitStance38=(c.gaitStance38||0)+1;for(const s of ['l','r']){const z=c.gaitIdleFeet[s];dest[s]={p:z.p.clone().applyMatrix4(c.root.matrixWorld),q:rootQ.clone().multiply(z.q),ball:rootQ.clone().multiply(z.ball)};dest[s].p.y+=.003-z.minY}if(c.walkName==='Jog_Fwd_Loop'&&old.l.minY>.012&&old.r.minY>.012){const durations=Object.fromEntries(['l','r'].map(s=>[s,THREE.MathUtils.clamp(Math.sqrt(2*old[s].minY/9.81)+.08,.16,.34)]));c.gaitTransitionPlan={kind:'flightStop28',age:0,feet:old,dest,durations,actualAirClearance:{l:old.l.minY,r:old.r.minY}}}else{const drop39=.003-old[stance].minY;old[stance].p.y+=drop39;old[stance].minY=.003;// Phase39b: the stop really places the stance foot at 3 mm; remember that placement so the stop-support check can evaluate the same 0-8 mm front-5cm rule on the placed foot when no measured patch exists.
if(old[stance].skin39)Object.defineProperty(old[stance],'placed39',{value:{drop:drop39,skin:old[stance].skin39}});c.gaitTransitionPlan={kind:'stop',age:0,feet:old,stance,dest};}}
 const plan=c.gaitTransitionPlan;
 if(plan){if(plan.kind==='flightStop28'){plan.age+=dt;for(const side of ['l','r']){const f=plan.feet[side],g=plan.dest[side],u=THREE.MathUtils.clamp(plan.age/plan.durations[side],0,1),v=ease(u),T=f.p.clone().lerp(g.p,v);T.y+=.015*Math.sin(Math.PI*u);gaitAimFoot(c,side,T,f.q.clone().slerp(g.q,v),f.ball.clone().slerp(g.ball,v))}if(plan.age>=Math.max(...Object.values(plan.durations)))c.gaitTransitionPlan=null;}else if(plan.kind==='start18'){if(gaitApplyStart18(c,plan,feet,dt)){gaitCarryBegin21(c,plan);c.gaitTransitionPlan=null}else if(Object.values(plan.schedule).some(w=>w.done))gaitCarryObserve21(c,plan)}else{plan.age+=dt;if(plan.kind==='start'){
   for(const s of ['l','r']){const swing=s==='r',u=swing?ease(plan.age/.18):ease((plan.age-.09)/.09),f=plan.feet[s],cur=feet[s],T=f.p.clone().lerp(cur.p,u),q=f.q.clone().slerp(cur.q,u),bq=f.ball.clone().slerp(cur.ball,u);T.y+=Math.max(0,.003-f.minY)*(1-u)+(swing?.075*Math.sin(Math.PI*THREE.MathUtils.clamp(plan.age/.18,0,1)):0);gaitAimFoot(c,s,T,q,bq)}if(plan.age>.18)c.gaitTransitionPlan=null;
  }else{
   const first=plan.stance==='l'?'r':'l',a=plan.age,step=.30;for(const s of ['l','r']){if(gaitStopSupport25(c,plan,s,feet[s]))continue;const start=plan.feet[s],dest=plan.dest[s],begin=s===first?0:step,u=THREE.MathUtils.clamp((a-begin)/step,0,1),v=ease(u),T=start.p.clone().lerp(dest.p,v);T.y+=.065*Math.sin(Math.PI*u);const q=start.q.clone().slerp(dest.q,v),bq=start.ball.clone().slerp(dest.ball,v);gaitAimFoot(c,s,T,q,bq)}if(a>.60)c.gaitTransitionPlan=null;
  }}
 }
 if(p.act==='walk'&&!c.gaitTransitionPlan)gaitCarryApply21(c,feet);else if(p.act!=='walk')c.gaitCarry21=null;
 // Resolve actual toe/heel envelope, not just ankle target: correction is foot-only, at transition/idle.
 let result=gaitFeet(c);{for(const s of ['l','r'])if(result[s].minY<.002&&!c.gaitSolvedContact32?.[s]){const f=result[s],T=f.p.clone();T.y+=.002-f.minY;gaitAimFoot(c,s,T,f.q,f.ball)}result=gaitFeet(c)}if(c.walkName==='Jog_Fwd_Loop'){gaitJogContacts29(c,p,result);result=gaitFeet(c)}c.gaitLastFeet=result;
 if(!c.gaitTransitionPlan&&p.act!=='walk'){c.gaitIdleFeet={};for(const s of ['l','r']){const f=result[s];c.gaitIdleFeet[s]={p:c.root.worldToLocal(f.p.clone()),q:rootQ.clone().invert().multiply(f.q),ball:rootQ.clone().invert().multiply(f.ball),minY:f.minY};}}
}

// World-oriented short turn footfalls. Complete landing before another mode is released.
const GAIT_IDLE16=new Map();
function gaitIdle16(c){
 const key=gaitProfileKey28(c);if(GAIT_IDLE16.has(key))return GAIT_IDLE16.get(key);const m=skClone(c.m);m.position.set(0,c.neutralGround,0);m.rotation.set(0,0,0);const b={},meshes=[];m.traverse(o=>{if(o.isBone)b[o.name]=o;if(o.isSkinnedMesh&&o.visible)meshes.push(o)});const mix=new THREE.AnimationMixer(m),a=mix.clipAction(c.A.Idle_Loop.getClip());a.play();a.time=.75;mix.update(0);m.updateMatrixWorld(true);const t={root:m,m,b,meshes,yaw:0},feet=gaitFeet(t);for(const s of ['l','r']){feet[s].p.y+=.003-feet[s].minY;feet[s].minY=.003}GAIT_IDLE16.set(key,feet);return feet;
}
function gaitTurnGoal16(c,s,targetYaw){const f=gaitIdle16(c)[s],delta=THREE.MathUtils.clamp(angd(c.gaitYawGoal,c.yaw),-.4,.4),yaw=targetYaw??c.yaw+delta,q=new THREE.Quaternion().setFromAxisAngle(UP,yaw);const P=f.p.clone().applyQuaternion(q).add(c.root.position);gaitTurnReach36(c,s,P,yaw);return {p:P,q:q.clone().multiply(f.q),ball:q.clone().multiply(f.ball),minY:.003,contactArea:f.contactArea}}
// Phase36: reach-aware turn-step target. The turn yaw limiter keeps the stance hip inside the leg's CURRENT world chord
// (thigh+calf-.008). An affine-squashed rig with a correctly forward knee has a shorter world chord, so the Idle stance can
// sit beyond it and the turn stalls forever. Place the step target closer under the hip (horizontal pull only, same limit,
// with room for the next turn step) instead of relaxing any limit.
function gaitTurnReach36(c,s,P,yaw){const V=THREE.Vector3,H=c.b['thigh_'+s].getWorldPosition(new V()),K=c.b['calf_'+s].getWorldPosition(new V()),F=c.b['foot_'+s].getWorldPosition(new V()),limit=H.distanceTo(K)+K.distanceTo(F)-.008-.001,par=c.tilt.parent,shift=(s==='l'?1:-1)*.035*(gaitScaled28(c)?c.m.scale.x:1),cur=c.tilt.position.x,disp=par.localToWorld(new V(shift,0,0)).sub(par.localToWorld(new V(cur,0,0)));let changed=false;for(const Hs of [H.clone(),H.clone().add(disp)]){const Hy=Hs.sub(c.root.position).applyAxisAngle(UP,angd(yaw,c.yaw)).add(c.root.position),dy=Hy.y-P.y;if(Hy.distanceTo(P)<=limit||limit<=Math.abs(dy))continue;const h=new V(P.x-Hy.x,0,P.z-Hy.z),hl=h.length(),want=Math.sqrt(limit*limit-dy*dy);if(hl<=want)continue;h.multiplyScalar(want/hl);P.x=Hy.x+h.x;P.z=Hy.z+h.z;changed=true}if(changed)c.gaitTurnPull36=(c.gaitTurnPull36||0)+1}
function gaitTurnBegin16(c,feet){
 const nextYaw=c.yaw+THREE.MathUtils.clamp(angd(c.gaitYawGoal,c.yaw),-.4,.4),lateral=s=>{const v=feet[s].p.clone().sub(c.root.position);return(v.x*Math.cos(nextYaw)-v.z*Math.sin(nextYaw))*(s==='l'?1:-1)},swing=lateral('l')<lateral('r')?'l':'r';c.gaitTurnPlan={kind:'turn',feet,swing,age:0,duration:.28,bodyFrom:c.yaw,bodyTo:c.yaw+THREE.MathUtils.clamp(angd(c.gaitYawGoal,c.yaw),-.4,.4),goal:gaitTurnGoal16(c,swing,c.yaw+THREE.MathUtils.clamp(angd(c.gaitYawGoal,c.yaw),-.4,.4)),steps:0,heading17:{...c.gaitHeading17,firstAppliedYaw:c.yaw,firstSwing:swing}};
}
function gaitTransition16(c,p,dt){
 if(!c.anatomicalGait)return;const activeTurn=c.gaitTurnPlan&&c.gaitTurnPlan.release==null,targetShift=activeTurn?(c.gaitTurnPlan.swing==='l'?-.035:.035)*(gaitScaled28(c)?c.m.scale.x:1):0;{const prev=c.gaitWeightX||0;let wx=THREE.MathUtils.damp(prev,targetShift,10,dt);if(activeTurn&&wx!==prev){const m=c.gaitTurnPlan,st=m.swing==='l'?'r':'l',P=m.feet[st]?.p,ok=x=>{c.tilt.position.x=x;c.tilt.updateMatrixWorld(true);return gaitReachProbe36(c,st,P)};if(P&&!ok(wx)){c.gaitWeightWait36=(c.gaitWeightWait36||0)+1;if(ok(prev)){let lo=0,hi=1;for(let j=0;j<12;j++){const mid=(lo+hi)/2;if(ok(prev+(wx-prev)*mid))lo=mid;else hi=mid}wx=prev+(wx-prev)*lo}else wx=Math.abs(wx)<Math.abs(prev)?wx:prev}}c.gaitWeightX=wx;c.tilt.position.x=wx;c.tilt.updateMatrixWorld(true)}const moving=c.gaitActualSpeed>.08,was=!!c.gait16WasMoving,eligible=(!c.ent.vs||(c.bedGate39&&c.bedGate39.vs===c.ent.vs&&c.ent.vs.pose==='lie'&&p.bedWalk39&&(p.act==='walk'||p.act==='idle')))&&['walk','idle','treatp'].includes(p.act);if(!eligible){gaitTransition(c,p,dt);return}
 const turnNeeded=c.gaitHeadingReady17!==false&&(Math.abs(angd(c.gaitYawGoal,c.yaw))>.055||Math.abs(angd(c.yaw,c.gaitLastYaw??c.yaw))>.004);
 if(!c.gaitTransitionPlan&&!moving&&!was&&(turnNeeded||c.gaitTurnPlan)){
  if(!c.gaitTurnPlan)gaitTurnBegin16(c,c.gaitLastFeet||gaitFeet(c));const m=c.gaitTurnPlan,ease=u=>{u=THREE.MathUtils.clamp(u,0,1);return u*u*(3-2*u)};m.age+=dt;
  if(m.release==null){
   const error=Math.abs(angd(c.gaitYawGoal,c.yaw));
   if(m.turnProgress==null||Math.abs(angd(c.gaitYawGoal,m.progressGoal))>.10||error<m.turnProgress-.055){
    m.turnProgress=error;
    m.progressGoal=c.gaitYawGoal;
    m.stalled=0;
   }else m.stalled+=dt;
   // On tight corners a planted foot can prevent all yaw progress. Blend out the lock.
   if(m.stalled>.75){m.release=0;m.freeTurn=true}
  }
  if(m.release!=null){m.release+=dt;const raw=gaitFeet(c),u=ease(m.release/.15);for(const s of ['l','r']){const f=m.feet[s],g=raw[s];gaitAimFoot(c,s,f.p.clone().lerp(g.p,u),f.q.clone().slerp(g.q,u),f.ball.clone().slerp(g.ball,u))}if(turnNeeded&&!m.freeTurn){m.release=null;m.age=0;m.goal=gaitTurnGoal16(c,m.swing)}else if(m.release>=.15&&(!m.freeTurn||Math.abs(angd(c.gaitYawGoal,c.yaw))<=.055))c.gaitTurnPlan=null;
  }else{const u=Math.min(1,m.age/m.duration),v=ease(u);for(const s of ['l','r']){const f=m.feet[s],g=s===m.swing?m.goal:f,T=f.p.clone().lerp(g.p,v);if(s===m.swing)T.y+=.045*Math.sin(Math.PI*u);gaitAimFoot(c,s,T,f.q.clone().slerp(g.q,v),f.ball.clone().slerp(g.ball,v))}
   if(u>=1){m.feet[m.swing]=m.goal;m.steps++;c.gaitTurnSteps=(c.gaitTurnSteps||0)+1;m.swing=m.swing==='l'?'r':'l';m.age=0;m.bodyFrom=c.yaw;m.bodyTo=c.yaw+THREE.MathUtils.clamp(angd(c.gaitYawGoal,c.yaw),-.4,.4);const goal=gaitTurnGoal16(c,m.swing,m.bodyTo),other=m.swing==='l'?'r':'l',og=gaitTurnGoal16(c,other);m.goal=goal;if(!turnNeeded&&m.feet[m.swing].p.distanceTo(goal.p)<.018&&m.feet[other].p.distanceTo(og.p)<.018&&m.feet[m.swing].q.angleTo(goal.q)<.08&&m.feet[other].q.angleTo(og.q)<.08)m.release=0;}
  }
  let feet=gaitFeet(c);for(const s of ['l','r'])if(feet[s].minY<.002){const f=feet[s],T=f.p.clone();T.y+=.002-f.minY;gaitAimFoot(c,s,T,f.q,f.ball)}c.gaitLastFeet=gaitFeet(c);c.gaitLastYaw=c.yaw;c.gait16PrevPose={act:'idle'};if(dt>0)c.gait16WasMoving=false;return;
 }
 // Start/stop logic sees actual movement, not merely a nonempty route. Heading is held until these landings finish.
 const actual=c.pose,err=c.turnError;c.pose=c.gait16PrevPose||{act:'idle'};c.turnError=0;gaitTransition(c,{...p,act:moving?'walk':'idle'},dt);c.turnError=err;c.pose=actual;c.gait16PrevPose={act:moving?'walk':'idle'};c.gaitLastYaw=c.yaw;if(dt>0)c.gait16WasMoving=moving;
}
// Phase17: current-route commitment shared by simulation and renderer. Never consume cached heading from a different route.
const GAIT_ROUTE17=new WeakMap();
function gaitRouteCommit17(e,source){
 const points=[{x:e.x,y:e.y},...(e.path||[])],segments=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],d=Math.hypot(b.x-a.x,b.y-a.y);if(d>.0001)segments.push({d,yaw:Math.atan2(b.x-a.x,b.y-a.y),x:b.x,y:b.y})}
 const first=segments[0],old=GAIT_ROUTE17.get(e),key=first?first.x+','+first.y:'empty',changed=!old||old.path!==e.path||old.key!==key||!!first!==!!old.fresh||(first&&Math.abs(angd(first.yaw,old.goalYaw))>.00001),revision=(old?.revision||0)+(changed?1:0);let remaining=0;if(first)for(const t of segments){if(Math.abs(angd(t.yaw,first.yaw))>.1)break;remaining+=t.d}
 const h={revision,source,fresh:!!first,pathLength:e.path?.length||0,targetX:first?.x??null,targetY:first?.y??null,goalYaw:first?.yaw??null,rootX:e.x,rootY:e.y};GAIT_ROUTE17.set(e,{path:e.path,key,fresh:!!first,goalYaw:first?.yaw,revision});const m=e.gaitMotion||(e.gaitMotion={v:0});m.heading17=h;if(first){m.goalYaw=first.yaw;m.remaining=remaining}return {heading:h,remaining,goalYaw:first?.yaw};
}
// Phase27: chair-local physical location is the navigation origin, not a tile-centre proxy.
// Seat animation owns approach->cushion->stand; on exit commit that SAME stand point
// to simulation. Route to the reachable front aisle then the exact stand point, never
// project a moving root away from whichever floor(tile) happens to be underneath it.
// The side-aisle centre connects directly to the standing point outside the actual
// chair seat footprint; do not insert an unnecessary .62m right-angle detour under the desk.
function seatFrame27(sp){const sk=v43SeatKind(sp),yaw=dirYaw(sp.dir??1),fx=Math.sin(yaw),fz=Math.cos(yaw),d=V43.standF[sk]??.65;return {x:sp.x+fx*d,y:sp.y+fz*d,frontX:sp.x+Math.round(fx),frontY:sp.y+Math.round(fz),yaw,kind:sk}}
function seatActor27(e){const c=CH.get(e.id);return c&&!c.isStaff&&c.actionAnatomy24&&S.pats.includes(e)?c:null}
function seatAisles27(sp){const f=seatFrame27(sp),fx=Math.sin(f.yaw),fz=Math.cos(f.yaw),rx=-fz,rz=fx;
 return [[Math.round(fx),Math.round(fz),0],[Math.round(rx),Math.round(rz),1],[-Math.round(rx),-Math.round(rz),-1]].map(([dx,dy,side])=>{const x=sp.x+dx,y=sp.y+dy,join=null;return {x,y,join,frame:f}}).filter(a=>walk(a.x,a.y));}
function seatRouteLength27(origin,route){let d=0,last=origin;for(const n of route){d+=Math.hypot(n.x-last.x,n.y-last.y);last=n}return d}
const seatGoTo27=window.goTo;
window.goTo=function(e,x,y,avoid){const c=seatActor27(e);if(!c)return seatGoTo27(e,x,y,avoid);
 const sp=S.rooms.map(r=>r.sp?.patient).find(s=>s?.pose==='sit'&&s.x===x&&s.y===y);
 if(sp){const routes=[];for(const a of seatAisles27(sp)){const route=path(e.x,e.y,a.x,a.y,avoid);if(route===null)continue;const last=route[route.length-1]||e;if(Math.hypot(last.x-a.x,last.y-a.y)>.00001)route.push({x:a.x,y:a.y});if(a.join)route.push(a.join);route.push({x:a.frame.x,y:a.frame.y});routes.push({route,a,d:seatRouteLength27(e,route)})}routes.sort((a,b)=>a.d-b.d);if(!routes.length){if(avoid){e.path=[];return false}throw Error('No reachable physical chair approach '+c.role)}const best=routes[0];e.path=best.route;c.seatNav27={kind:'approach',spot:{...sp},frame:best.a.frame,aisle:best.a};return true;}
 const held=c.seatNav27,atStand=held&&Math.hypot(e.x-held.frame.x,e.y-held.frame.y)<.00001;
 if(atStand&&['exit','departure'].includes(held.kind)){const routes=[];for(const a of seatAisles27(held.spot)){const tail=path(a.x,a.y,x,y,avoid);if(tail===null||avoid?.has(a.y*S.w+a.x))continue;const route=[];if(a.join)route.push(a.join);route.push({x:a.x,y:a.y},...tail);routes.push({route,a,d:seatRouteLength27(e,route)})}routes.sort((a,b)=>a.d-b.d);if(!routes.length){if(avoid){e.path=[];return false}throw Error('No reachable physical chair departure '+c.role)}e.path=routes[0].route;c.seatNav27={...held,kind:'departure',aisle:routes[0].a};return true;}
 return seatGoTo27(e,x,y,avoid);
};
// Phase39d toilet arrival (wc analogue of the seatNav27 chair approach): the sim stands the patient on the tile in front of the toilet
// facing it (lid), then takeSeat() teleports the entity onto the toilet. For anatomical patients the seating is deferred until the
// physical body has walked to the wc stand frame (V43.standF.wc in front of the seat) and turned to face away, through the same
// arrival gate as chairs; the lid/seat timers of the sim are not advanced meanwhile. Departure clears the contract.
const OPP39=[2,3,0,1];const wcUpd39=window.updPatient;window.updPatient=function(p,dt){const c=seatActor27(p);if(c&&c.wcNav39&&!/^wc/.test(p.state)){c.wcNav39=null;if(c.seatNav27&&c.seatNav27.wc39)c.seatNav27=null}if(c&&p.state==='wc2'&&!p.vs&&c.wcNav39&&c.wcNav39.up&&!c.wcNav39.back){if(!move(p,dt))return;c.wcNav39.back=1;const r=wcUpd39(p,dt);if(p.state==='wcF'&&c.wcNav39.flushFrame){p.x=c.wcNav39.flushFrame.x;p.y=c.wcNav39.flushFrame.y;c.wcNav39.flush=1}return r}if(c&&p.state==='wcD'&&c.wcNav39&&c.wcNav39.flush&&!c.wcNav39.home){const n=c.wcNav39,tr=S.rooms.find(r=>r.id===p.wcRoom),sp=tr&&tr.sp&&tr.sp.patient;if(sp){if(!n.homing&&p.oa&&p.oa.t+dt>=p.oa.T){n.homing=1;n.oaD=p.oa;p.oa=null;p.path=[{x:sp.x,y:sp.y+1}];c.seatNav27={...c.seatNav27,frame:{x:sp.x,y:sp.y+1,kind:'wc'}}}if(n.homing){if(!move(p,dt))return;n.home=1;p.oa=n.oaD}}}if(c&&p.state==='wc4'&&c.wcNav39){const n=c.wcNav39,tr=S.rooms.find(r=>r.id===p.wcRoom),w=tr&&(tr.sp.wash||tr.sp.patient);if(w){if(!n.wstage){const y=dirYaw(p.dir??w.dir??3),Fw={x:p.x+Math.sin(y)*.58,y:p.y+Math.cos(y)*.58};n.wstage='app';n.wfrom={x:p.x,y:p.y};n.wdir=p.dir;p.wash=false;p.path=[Fw];c.seatNav27={kind:'approach',spot:{x:w.x,y:w.y,dir:p.dir},frame:{...Fw,kind:'wash'},aisle:null,wc39:1}}if(n.wstage==='app'){if(!move(p,dt))return;n.wstage='wash';p.wash=true}if(n.wstage==='wash'&&p.t-dt<=0){n.wstage='back';p.wash=false;p.path=[n.wfrom]}if(n.wstage==='back'){if(!move(p,dt))return;n.wstage='done';p.dir=n.wdir;p.wash=true}}}if(c&&p.state==='wcL'&&!(c.wcNav39&&c.wcNav39.ready)){const tr=S.rooms.find(r=>r.id===p.wcRoom);const sp=tr&&tr.sp&&tr.sp.patient,nav=c.wcNav39&&c.wcNav39.room===tr?.id?c.wcNav39:null;if(sp&&sp.pose==='wc'&&p.oa){if(!nav){const f=seatFrame27(sp);c.wcNav39={room:tr.id,frame:f,ready:0,stage:'pre',since:S.t,oa:p.oa};p.oa=null;c.seatNav27={kind:'approach',spot:{...sp,dir:OPP39[sp.dir??1]},frame:f,aisle:null,wc39:1};p.path=[{x:f.x,y:f.y}];}}if(sp&&sp.pose==='wc'&&c.wcNav39&&c.wcNav39.room===tr?.id){const n=c.wcNav39;if(n.stage==='pre'){if(!move(p,dt))return;n.stage='lid';p.oa=n.oa;p.oa.t=0;return wcUpd39(p,dt)}if(n.stage==='lid'){if(p.oa&&p.oa.t+dt<p.oa.T)return wcUpd39(p,dt);if(p.oa){n.oa=p.oa;p.oa.t=p.oa.T;p.oa=null;c.seatNav27={...c.seatNav27,spot:{...sp}};n.stage='turn'}}if(n.stage==='turn'){if(!move(p,dt))return;n.ready=1;p.oa=n.oa}}}return wcUpd39(p,dt)};
const wcTickVs39=window.tickVs;window.tickVs=function(e,dt){const v=e.vs,c=v&&v.pose==='wc'?seatActor27(e):null;wcTickVs39(e,dt);if(c&&!e.vs&&c.wcNav39){const sp=v.sp,f=c.wcNav39.frame;e.x=f.x;e.y=f.y;e.dir=sp.dir??1;c.wcNav39.up=1;c.v43hold=null;const y=dirYaw(sp.dir??1),Ff={x:f.x,y:f.y};c.wcNav39.flushFrame=Ff;c.seatNav27={kind:'approach',spot:{...sp,dir:OPP39[sp.dir??1]},frame:{...Ff,yaw:dirYaw(OPP39[sp.dir??1]),kind:'wc'},aisle:null,wc39:1};e.path=[{x:Ff.x,y:Ff.y}]}};
const seatTickVs27=window.tickVs;
window.tickVs=function(e,dt){const c=seatActor27(e),v=e.vs,up=c&&v?.pose==='sit'&&v.ph==='up',f=up?seatFrame27(v.sp):null;seatTickVs27(e,dt);if(up&&!e.vs){const previous={x:e.x,y:e.y};e.x=f.x;e.y=f.y;c.v43hold=null;c.seatNav27={kind:'exit',spot:{...v.sp},frame:f,previous,physicalRootBefore:c.root.position.toArray(),time:S.t};}};

// Phase39 bed arrival/departure gate (bed analogue of the seatNav27 chair arrival gate): the scripted bed approach may not outrun a walking pace,
// sitting on the edge starts only after the gait has stopped and turned to face away from the bed, and walking away starts only after the
// stand-up has released the seated feet. Holds simulation time of the bed transfer; never skips or resets it.
const bedTickVs39=window.tickVs; window.tickVs=function(e,dt){const v=e.vs,c=v&&v.pose==='lie'?seatActor27(e):null,g=c&&c.bedGate39;if(!g||g.vs!==v||!(v.ph==='down'||v.ph==='up'))return bedTickVs39(e,dt);
 const T=(typeof SEAT_T!=='undefined'&&SEAT_T.lie)||2.6,k=v.t/T,walkScale=Math.min(1,1.1*.3*T/Math.max(g.d,1e-6));let nt=v.t;
 if(v.ph==='down'){nt+=k<.3?dt*walkScale:dt;const arrived=!c.gait16WasMoving&&!c.gaitTransitionPlan&&!c.gaitTurnPlan&&Math.abs(angd(g.yawOut,c.yaw))<.055;if(k<.3&&nt/T>=.3&&!arrived)nt=Math.max(v.t,.3*T-1e-6);c.bedGateHold39=(c.bedGateHold39||0)+(nt===v.t?1:0)}
 else{const stood=!c.seatFeet24&&['Sitting_Idle_Loop','Sitting_Talking_Loop'].every(n=>!c.A[n]||c.A[n].getEffectiveWeight()<.001);nt+=k>.7?dt*walkScale:dt;if(k<=.7&&nt/T>.7&&!stood)nt=Math.max(v.t,.7*T);c.bedGateHold39=(c.bedGateHold39||0)+(nt===v.t?1:0)}
 return bedTickVs39(e,nt-v.t)};
// Reversible real simulation timing for ordinary patient_a/rocker walkers only: no route shortcuts.
const gaitMove16=window.move;
window.move=function(e,dt,sp=2.2){
 const c=CH.get(e.id),patient=typeof S!=='undefined'&&S.pats.includes(e),supported=c?c.anatomicalGait:patient;
 if(!patient||!supported||e.vs)return gaitMove16(e,dt,sp);
 const recArrival=e.state==='enter'&&S.rooms.find(r=>r.id===e.room&&r.type==='reception'),chairArrival=(e.state==='enter'||(e.state==='wcL'&&c?.wcNav39)||(e.state==='wc2'&&c?.wcNav39?.up)||(e.state==='wc4'&&c?.wcNav39?.wstage==='app'))&&c?.seatNav27?.kind==='approach';const arrived=()=>{if(!recArrival&&!chairArrival)return true;const spot=chairArrival?c.seatNav27.spot:spotPatient(recArrival);if(chairArrival)e.dir=spot.dir??1;else if(spot.dir!=null)e.dir=spot.dir;return !c||(!c.gait16WasMoving&&!c.gaitTransitionPlan&&!c.gaitTurnPlan&&Math.abs(angd(dirYaw(e.dir),c.yaw))<.055)};
 if(!e.path?.length)return arrived()&&gaitMove16(e,dt,sp);
 const route=gaitRouteCommit17(e,'move'),goal=route.goalYaw,remaining=route.remaining;if(!route.heading.fresh)return gaitMove16(e,dt,sp);
 const m=e.gaitMotion||(e.gaitMotion={v:0,goalYaw:goal});m.goalYaw=goal;const error=c?Math.abs(angd(goal,c.yaw)):0,held=!!(c?.gaitTurnPlan||['stop','flightStop28'].includes(c?.gaitTransitionPlan?.kind));let target=Math.min(sp,1.45,Math.sqrt(2*3*Math.max(0,remaining)));if(error>.12||held)target=0;else target=Math.max(.045,target);m.v+=THREE.MathUtils.clamp(target-m.v,-3*dt,2.4*dt);m.remaining=remaining;m.headingError=error;m.held=held;const vs39=error>.2||held?0:m.v,n039=e.path.length,x039=e.x,y039=e.y;const done=gaitMove16(e,dt,vs39);if(!done&&e.path.length<n039&&vs39>0){const px=e.x-x039,py=e.y-y039,mv=Math.hypot(px,py),left=vs39*dt-mv,n=e.path[0],dx=n.x-e.x,dy=n.y-e.y,d=Math.hypot(dx,dy);if(left>1e-6&&mv>1e-6&&d>left&&Math.abs(dx*py-dy*px)<1e-6*d*mv&&dx*px+dy*py>0){e.x+=dx/d*left;e.y+=dy/d*left}}return done?arrived():false;
};

function gaitYawLimit16(c,wanted){
 const m=c.gaitTurnPlan;if(!m||m.release!=null||!wanted)return wanted;const side=m.swing==='l'?'r':'l',V=THREE.Vector3,H=c.b['thigh_'+side].getWorldPosition(new V()),K=c.b['calf_'+side].getWorldPosition(new V()),F=c.b['foot_'+side].getWorldPosition(new V()),limit=H.distanceTo(K)+K.distanceTo(F)-.008,offset=H.clone().sub(c.root.position),target=m.feet[side].p,reach=t=>offset.clone().applyAxisAngle(UP,wanted*t).add(c.root.position).distanceTo(target);if(reach(1)<=limit)return wanted;let lo=0,hi=1;for(let j=0;j<10;j++){const mid=(lo+hi)/2;if(reach(mid)<=limit)lo=mid;else hi=mid}c.gaitYawWaitFrames=(c.gaitYawWaitFrames||0)+1;return wanted*lo;
}
const ERR45=new Map();
function updSafe45(e,isStaff,dt,now){try{updChar(e,isStaff,dt,now)}catch(err){const c=CH.get(e.id),n=(ERR45.get(e.id)||0)+1;ERR45.set(e.id,n);window.__charErr45=(window.__charErr45||0)+1;
 if(n<=3)console.error("3d-char",isStaff?"staff":"pat",e.id,c&&c.role,err&&err.stack);if(c){try{c.dispose()}catch(_){}CH.delete(e.id)}}}
function updChar(e,isStaff,dt,now){let c=CH.get(e.id);if(c&&!isStaff&&e.healed&&!c.healed){const pos=c.root.position.clone(),y=c.yaw,nav27=c.seatNav27;c.dispose();CH.delete(e.id);c=mkPat(e);c.isStaff=false;c.ent=e;c.healed=true;CH.set(e.id,c);
 // Phase39b: the cured character rebuild keeps the physical seat-navigation contract of the same patient (otherwise the legacy seat-tile projection drags the new root and it later jumps).
 if(nav27&&c.actionAnatomy24)c.seatNav27=nav27;c.root.position.copy(pos);c.yaw=y;c.root.rotation.y=y;fx41(pos)}if(!c){c=isStaff?mkStaff(e):mkPat(e);c.isStaff=isStaff;c.ent=e;CH.set(e.id,c);const p=poseOf(e,isStaff);c.root.position.set(p.x,0,p.z);c.yaw=p.yaw??0}
 c.seen=true;c.t+=dt;const p=poseOf(e,isStaff);const r=c.root;if(!v43Bed(c,e,p))v43Sit(c,e,p,isStaff);else{c.v43=0;c.v43vs=null}c.v43p=[p.x,p.z];
 // позиция и скорость
 const dx=p.x-r.position.x,dz=p.z-r.position.z,dist=Math.hypot(dx,dz);const sp=dist/Math.max(dt,1e-4);if(dt>1e-6)c.gaitActualSpeed=sp;if(c.anatomicalGait&&!e.path?.length&&e.gaitMotion)e.gaitMotion.v=0;c.vel+=(sp-c.vel)*Math.min(1,dt*8);
 if(dist>2)r.position.set(p.x,0,p.z);else r.position.set(p.x,0,p.z);
 let tyaw=p.yaw;if(p.act==='walk'&&dist>.002)tyaw=Math.atan2(dx,dz);if(p.look&&e.type!=='receptionist'){tyaw=Math.atan2(p.look.x-e.x,p.look.y-e.y)}if(tyaw==null)tyaw=c.yaw;
 if(c.anatomicalGait){const committed=gaitRouteCommit17(e,'renderer');c.gaitHeading17=committed.heading;c.gaitHeadingReady17=!e.path?.length||committed.heading.fresh;if(e.path?.length)tyaw=committed.heading.fresh?committed.goalYaw:c.yaw}c.gaitYawGoal=tyaw;const turnErr=angd(tyaw,c.yaw),turnSafe=!isStaff&&!e.vs&&!c.v43&&!c.v43hold&&['idle','treatp','walk'].includes(p.act),canTurn=turnSafe&&sp<.15;
 if(!turnSafe){c.turnHold=0;c.turnWeight=0;c.turnPlan=null;c.moveTurnHold=0;c.moveTurnWeight=0;c.moveLocks={}}
 c.moveTurnHold=turnSafe&&p.act==='walk'&&sp>.15&&Math.abs(turnErr)>.12?.35:Math.max(0,(c.moveTurnHold||0)-dt);if(!isStaff&&p.act==='walk'&&c.pose?.act!=='walk')c.vel=sp;c.turnError=turnErr;if(canTurn&&Math.abs(turnErr)>.045){c.turnHold=.60;c.turnSign=Math.sign(turnErr)}else c.turnHold=canTurn?Math.max(0,(c.turnHold||0)-dt):0;
 if(c.anatomicalGait&&!e.vs){const stopping=c.gait16WasMoving&&(c.gaitActualSpeed||0)<.08,hold=c.gaitTransitionPlan&&c.gaitTransitionPlan.kind!=='turn';if(!hold&&!stopping){const m=c.gaitTurnPlan;let step=0;if(m&&m.release==null){const u=THREE.MathUtils.clamp((m.age/m.duration-.10)/.80,0,1),v=u*u*(3-2*u);step=angd(m.bodyFrom+(m.bodyTo-m.bodyFrom)*v,c.yaw)}else if(m)step=THREE.MathUtils.clamp(turnErr,-dt*2.2,dt*2.2);else if((c.gaitActualSpeed||0)>.08)step=THREE.MathUtils.clamp(turnErr,-dt*2.2,dt*2.2);c.yaw+=gaitYawLimit16(c,step)}}else c.yaw+=canTurn?THREE.MathUtils.clamp(turnErr,-dt*2.2,dt*2.2):(!isStaff&&p.act==='walk'?THREE.MathUtils.clamp(turnErr,-dt*3.8,dt*3.8):turnErr*Math.min(1,dt*(p.act==='lie'||p.act==='v43lie'?20:8)));r.rotation.y=c.yaw;
 // поза
 let tilt=0,ry=0,mz=0;
 // Distance-matched walking stops advancing when the navigation root stops; fade remains active.
 if(c.anatomicalGait&&p.act!=='walk'&&c.A[c.walkName])c.A[c.walkName].setEffectiveTimeScale(c.walkName==='Jog_Fwd_Loop'&&!e.vs&&(c.gaitActualSpeed||0)>.08?1:0);
 switch(p.act){case'walk':{const quiet=c.anatomicalGait&&(c.gaitActualSpeed||0)<.08,wn=quiet?'Idle_Loop':c.walkName,starting=c.anatomicalGait&&!quiet&&!c.gait16WasMoving;c.play(wn,isStaff?.25:(c.anatomicalGait?.16:.12));if(starting&&['Walk_Loop','Jog_Fwd_Loop'].includes(wn))c.A[wn].time=wn==='Walk_Loop'?c.A[wn].getClip().duration*.44:gaitSwingCurve18(c).startPhase;c.A[wn].setEffectiveTimeScale(quiet?1:c.anatomicalGait&&['Walk_Loop','Jog_Fwd_Loop'].includes(wn)?(wn==='Jog_Fwd_Loop'?1:(c.gaitActualSpeed||0)/c.strideOf(wn)):THREE.MathUtils.clamp(c.vel/c.strideOf(wn),.3,isStaff?2.4:3.3));break;}
  case'sit':case'sitdown':case'situp':{
    // Receptionist: NEVER Sitting_Talking (raised-arm «возмущается»). Idle only; greet/type via desk layers.
    if(e.type==='receptionist'){c.play('Sitting_Idle_Loop',.3);break}
    c.play(p.talk&&p.layer!=='write'&&!(e.vs&&e.vs.pose==='sit'&&(performance.now()/1000+(e.id||0))%7<3.5)?'Sitting_Talking_Loop':'Sitting_Idle_Loop',.35);break}
  case'v43lie':{const u=p.u,A1=c.A.Sitting_Idle_Loop,A2=c.A.Idle_Loop;if(c.cur!=='v43lie'){for(const k in c.A){const a=c.A[k];if(a!==A1&&a!==A2)a.fadeOut(.3)}if(!A1.isRunning())A1.reset().play();if(!A2.isRunning())A2.reset().play();c.cur='v43lie'}A1.stopFading();A2.stopFading();A1.enabled=A2.enabled=true;A1.setEffectiveWeight(1-u);A2.setEffectiveWeight(Math.max(.001,u));A2.setEffectiveTimeScale(.35);tilt=-Math.PI/2*u;ry=(c.v43gy??.1)*(1-u)+(LIESUP39.bed-lieBack39(c))*u;mz=-.88*u;break}
  case'lie':c.play('Idle_Loop',.4);c.A.Idle_Loop.setEffectiveTimeScale(.35);tilt=-Math.PI/2*Math.min(1,p.lie*1.4);const sc=p.bed&&/scanner/.test(p.bed.t.k),au=p.bed&&p.bed.t.k==="autopsy";const bh=(sc?LIESUP39.scanner:au?LIESUP39.autopsy:LIESUP39.bed)-lieBack39(c);ry=bh*Math.min(1,p.lie*1.4);mz=(sc?-.86:-.88)*Math.min(1,p.lie*1.4);break;
  case'interact':c.play('Interact',.25);if(c.A.Interact.time>=c.A.Interact.getClip().duration-.05)c.A.Interact.time=0;break;
  case'fix':c.play('Fixing_Kneeling',.3);break;case'mop':c.play('Idle_Loop',.3);break;case'crouch':c.play('Crouch_Idle_Loop',.3);break;
  case'treat':c.play(c.isStaff&&e.type!=='doctor'?'Idle_Loop':'Idle_Talking_Loop',.3);break;case'give':c.play('Idle_Loop',.3);break;case'treatp':c.play('Idle_Loop',.3);break;
  case'dead':c.play('Idle_Loop',.3);if(!e.body&&c.deadYaw39)c.yaw+=angd(c.deadYaw39.yaw,c.yaw)*Math.min(1,dt*10);tilt=-Math.PI/2;ry=e.body?.75:LIESUP39.floor-lieBack39(c);mz=-.88;break;
  default:c.play(e.state==='queue'&&e.wait>40?'Idle_Talking_Loop':'Idle_Loop',c.walkName==='Jog_Fwd_Loop'&&c.gait16WasMoving?.16:.4);if(c.A.Idle_Loop)c.A.Idle_Loop.setEffectiveTimeScale(1)}
 c.tilt.rotation.x+=(tilt-c.tilt.rotation.x)*Math.min(1,dt*10);c.tilt.position.y+=(ry-c.tilt.position.y)*Math.min(1,dt*10);c.m.position.y+=(mz*-1*0-c.m.position.y);c.m.position.z=0;c.tilt.position.z+=((p.act==='lie'||p.act==='dead'?0:0)-c.tilt.position.z);
 // лёжа: смещаем модель вдоль тела, чтобы таз был в центре кровати
 c.m.position.y=(p.act==='lie'||p.act==='dead'||p.act==='v43lie')?mz:0;
 // Phase39b death fall: rigid rotation about the rig's own rearmost skin line on the floor (lieBack39), not about the root: every point stays at or above the floor and the body ends resting on its back surface.
 if(p.act==='dead'&&!e.body){const th=c.tilt.rotation.x,bk=lieBack39(c);c.m.position.y=0;c.tilt.position.y=bk*Math.sin(th);c.tilt.position.z=bk*(1-Math.cos(th))}
 // Phase39 bed transfer: lie back / get up as a rigid rotation about the seated hip joint (captured at transfer start), whose position moves from the seated hip to the lying hip given by the lie support contract; legs swing up with the rotation while the clip blend straightens them.
 if(p.act==='v43lie'){if(!c.v43piv39){c.m.updateMatrixWorld(true);const hw=c.b.pelvis.getWorldPosition(new THREE.Vector3()),X=c.tilt.worldToLocal(hw).sub(c.m.position);c.v43piv39={X,gy0:c.actionAnatomy24?c.gy:c.v43gy??.1}}const {X,gy0}=c.v43piv39,u=p.u,th=-Math.PI/2*u,R=(y,z,a)=>[y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)],Lb=LIESUP39.bed-lieBack39(c),r1=R(X.y-.88,X.z,-Math.PI/2),W0=[gy0+X.y,X.z],W1=[Lb+r1[0],r1[1]],W=[W0[0]+(W1[0]-W0[0])*u,W0[1]+(W1[1]-W0[1])*u],ru=R(X.y-.88*u,X.z,th);c.tilt.rotation.x=th;c.tilt.position.set(0,W[0]-ru[0],W[1]-ru[1]);c.v43pivU39=u}else if(c.v43piv39&&p.act!=='lie')c.v43piv39=null;
 // эффекты процедур
 c.fx=procFx(e,c,p,now);
 c.layer.write=p.layer==='write'?1:0;c.layer.exam=p.layer==='exam'?1:0;c.layer.phone=p.layer==='phone'?1:0;c.layer.operate=p.layer==='operate'?1:0;c.layer.deskType=p.layer==='deskType'?1:0;c.layer.greet=p.layer==='greet'?1:0;c.layer.reach39=p.layer==='reach39'?1:0;if(p.reachT)c.reachT39=p.reachT;c.lookPat=p.look||null;c.recNod=p.recNod||0;
 c.shadow.visible=p.act!=='lie';const fade=e.state==='dead'&&!e.body?Math.max(0,1-e.t/3):1;if(fade!==c.alpha){c.alpha=fade;c.root.visible=fade>.02}
 if(c.nose)c.nose.material.emissiveIntensity=(Math.sin(now/180)>0)?1:0;
 v43Give(c,e,p,isStaff);v43MopPre(c,e,p,isStaff);
 // Procedural transforms must be non-accumulating. Mixer skips re-writing unchanged tracks.
 // Restore last mixer-only pose before evaluating the next animation frame, reception only.
 if(c.jogMotion31&&c.gaitBasePelvis31)c.b.pelvis.position.copy(c.gaitBasePelvis31);if(c.anatomicalGait&&c.gaitBasePose)for(const[n,q]of Object.entries(c.gaitBasePose))c.b[n].quaternion.copy(q);
 if(c.recDesk&&c.recBasePose)for(const [name,q]of Object.entries(c.recBasePose))c.b[name].quaternion.copy(q);
 if(c.anatomicalGait){c.turnHold=0;c.turnWeight=0;c.moveTurnHold=0;c.moveTurnWeight=0;c.moveLocks={};c.turnPlan=null}if(c.turnRaw)for(const[n,q]of Object.entries(c.turnRaw))c.b[n]?.quaternion.copy(q);c.mix.update(dt);if(!isStaff&&(c.turnHold>0||c.turnWeight>.005||c.moveTurnHold>0||c.moveTurnWeight>.005))c.turnRaw=Object.fromEntries(TURN_LEGS.filter(n=>c.b[n]).map(n=>[n,c.b[n].quaternion.clone()]));else c.turnRaw=null;
 if(c.jogMotion31)c.gaitBasePelvis31=c.b.pelvis.position.clone();if(c.anatomicalGait)c.gaitBasePose=Object.fromEntries(TURN_LEGS.filter(n=>c.b[n]).map(n=>[n,c.b[n].quaternion.clone()]));
 if(c.recDesk){c.recBasePose={};for(const [name,b]of Object.entries(c.b))c.recBasePose[name]=b.quaternion.clone()}
if(c.headS)c.b.Head.scale.set(...c.headS);c.m.updateMatrixWorld(true);legs(c,p,e,dt);c.layers(dt);gaitJogWarp29(c,p);gaitTransition16(c,p,dt);if(e.type==='receptionist')recDeskArms(c,p,e);if(!isStaff&&(c.turnHold>0||c.turnWeight>.005))patientTurnFeet(c,dt);if(!isStaff&&(c.moveTurnHold>0||c.moveTurnWeight>.005))movingTurnPlant(c,dt);if(!isStaff)c.lastTurnFeet=Object.fromEntries(['l','r'].filter(side=>c.b['foot_'+side]).map(side=>[side,{p:c.b['foot_'+side].getWorldPosition(new THREE.Vector3()),q:c.b['foot_'+side].getWorldQuaternion(new THREE.Quaternion())}]));v43MopPost(c,p,dt);c.pose=p}
// v39: посадка по высоте сиденья + IK ног (порт из v37)
const _v1=new THREE.Vector3(),UPV=new THREE.Vector3(0,1,0);
function rotWorldQ(b,q){b.parent.getWorldQuaternion(_q2);const inv=_q2.clone().invert();b.quaternion.premultiply(inv.multiply(q).multiply(_q2));b.updateMatrixWorld(true)}
function legIK(c,side,dy){if(Math.abs(dy)<.004)return;const th=c.b['thigh_'+side],ca=c.b['calf_'+side],ft=c.b['foot_'+side];if(!th||!ca||!ft)return;
 const H=th.getWorldPosition(new THREE.Vector3()),K=ca.getWorldPosition(new THREE.Vector3()),F=ft.getWorldPosition(new THREE.Vector3());const fq=ft.getWorldQuaternion(new THREE.Quaternion());
 const T=F.clone();T.y+=dy;const a=K.distanceTo(H),b=F.distanceTo(K);const d=THREE.MathUtils.clamp(T.distanceTo(H),Math.abs(a-b)+.01,a+b-.005);
 const u=H.clone().sub(K),w=F.clone().sub(K);let n=new THREE.Vector3().crossVectors(u,w);if(n.lengthSq()<1e-8){n.crossVectors(new THREE.Vector3(Math.sin(c.yaw),0,Math.cos(c.yaw)),UPV)}n.normalize();
 const tc=u.angleTo(w),td=Math.acos(THREE.MathUtils.clamp((a*a+b*b-d*d)/(2*a*b),-1,1));rotWorldQ(ca,new THREE.Quaternion().setFromAxisAngle(n,td-tc));
 const F2=ft.getWorldPosition(new THREE.Vector3());rotWorldQ(th,new THREE.Quaternion().setFromUnitVectors(F2.sub(H).normalize(),T.clone().sub(H).normalize()));
 const pq=ft.parent.getWorldQuaternion(new THREE.Quaternion());ft.quaternion.copy(pq.invert().multiply(fq));ft.updateMatrixWorld(true)}
// Phase39 lie support contract: lying bodies rest on the actual support surface (furn.js geometry: bed mattress top .47+.14, scanner slide .55+.08, autopsy slab .88+.03, floor 0).
// The rig's back surface is measured once from its own skin over the full Idle_Loop cycle (the clip that drives every lying pose) in tilt-local space;
// after tilt=-PI/2 a tilt-local z maps to world y, so tilt height = support - min(z) rests the lowest skin on the surface (no per-frame clamp).
const LIESUP39={bed:.61,scanner:.63,autopsy:.91,floor:0};
function lieBack39(c){if(c.lieBack39!=null)return c.lieBack39;const clip=c.A.Idle_Loop.getClip(),saved=[];c.m.traverse(o=>{if(o.isBone)saved.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()])});const mx=new THREE.AnimationMixer(c.m),act=mx.clipAction(clip);act.play();c.tilt.updateMatrixWorld(true);const inv=c.tilt.matrixWorld.clone().invert(),v=new THREE.Vector3();let mn=Infinity,n=0;for(let k=0;k<16;k++){mx.setTime(clip.duration*k/16);for(const [b,P,Qq,Sc] of saved)if(!clip.tracks.some(t=>t.name.startsWith(b.name+'.scale')))b.scale.copy(Sc);c.m.updateMatrixWorld(true);c.m.traverse(o=>{if(!o.isMesh||!o.visible)return;const g=o.geometry,P=g.attributes.position;for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);if(o.isSkinnedMesh)o.applyBoneTransform(i,v);v.applyMatrix4(o.matrixWorld).applyMatrix4(inv);if(v.z<mn)mn=v.z;n++}})}act.stop();mx.uncacheRoot(c.m);for(const [b,P,Qq,Sc] of saved){b.position.copy(P);b.quaternion.copy(Qq);b.scale.copy(Sc)}c.m.updateMatrixWorld(true);c.lieBack39=mn;c.lieBack39n=n;return mn}
const SEATH={sofa:.52,bench:.46,wc:.5,elchair:.50,chair:.50,chair_office:.50};
function footY(c,s){return c.b['foot_'+s].getWorldPosition(_v1).y-c.root.position.y}
function legs(c,p,e,dt){if(c.actionAnatomy24&&['idle','walk','treatp','sit','sitdown','situp'].includes(p.act)){
 const weight=['Sitting_Idle_Loop','Sitting_Talking_Loop'].reduce((s,n)=>s+c.A[n].getEffectiveWeight(),0),w=THREE.MathUtils.clamp(weight,0,1),seatH=p.seatH??SEATH[c.v43sk]??.5;c.gy=c.neutralGround+w*(c.seat24.vertical+seatH-.5);c.m.position.set(0,c.gy,0);c.m.updateMatrixWorld(true);
 if(e.vs?.pose==='sit'||w>.001||c.seatFeet24){const feet=gaitFeet(c),V=THREE.Vector3,Q=THREE.Quaternion,previous=c.seatFeet24;
 if(w>.001&&!previous){const from=c.gaitLastFeet||feet,dest={};for(const side of ['l','r']){const f=from[side],T=f.p.clone();T.y+=.003-f.minY;const local=c.root.worldToLocal(T.clone());local.x/=c.m.scale.x;const leg=c.seat24.legs[side],hip=leg.hip,vertical=hip[1]+c.seat24.vertical+seatH-.5-local.y,lateral=local.x-hip[0],sa39b=c.seatAnchor39&&c.seatAnchor39.vs===e.vs?c.seatAnchor39:null;let kn39=115,lift39=0,d2=leg.a*leg.a+leg.b*leg.b-2*leg.a*leg.b*Math.cos(kn39*Math.PI/180),h2=d2-vertical*vertical-lateral*lateral;// Phase39b high solid-front seat (bed edge, top .61): thighs rest along the mattress plane and the shins hang over the edge (feet dangle, no floor contact claimed) with a
// 110 deg knee; only if that hanging foot would reach the floor is the foot planted (standard 115 deg solution).
if(sa39b){const kn=110*Math.PI/180,dd=Math.sqrt(leg.a*leg.a+leg.b*leg.b-2*leg.a*leg.b*Math.cos(kn)),al=Math.asin(leg.b*Math.sin(kn)/dd),pl=Math.sqrt(Math.max(0,dd*dd-lateral*lateral)),vd=pl*Math.sin(al),hz=pl*Math.cos(al);if(vd<vertical){kn39=110;lift39=vertical-vd;h2=hz*hz}if((c.seat24.forward+hip[2]+Math.sqrt(Math.max(0,h2)))*c.m.scale.z<sa39b.front)throw Error('Bed-edge seat: hanging foot does not clear the bed front '+c.role+' '+side)}c.seatKnee39=kn39;c.seatLift39=lift39;if(h2<=0){
 // This stance is wider than the authored seated pose. Bring the foot under the knee.
 const reach=Math.sqrt(Math.max(0,d2-lateral*lateral-.0064));
 lift39=Math.max(lift39,vertical-reach);
 h2=.0064;
 c.seatLift39=lift39;
}local.z=hip[2]+Math.sqrt(h2);const sp=e.vs.sp,sa39=c.seatAnchor39&&c.seatAnchor39.vs===e.vs?c.seatAnchor39:null,forward=new V(Math.sin(c.yaw),0,Math.cos(c.yaw)),right=new V(Math.cos(c.yaw),0,-Math.sin(c.yaw));dest[side]={p:(sa39?new V(sa39.x,0,sa39.z):new V(sp.x+.5,0,sp.y+.5)).addScaledVector(forward,(c.seat24.forward+local.z)*c.m.scale.z).addScaledVector(right,local.x*c.m.scale.x),q:f.q.clone(),ball:f.ball.clone()};dest[side].p.y=T.y+lift39;from[side]={...f,p:T}}
 c.seatFeet24={stage:'down',age:0,from,dest,standing:Object.fromEntries(['l','r'].map(side=>[side,{p:from[side].p.clone(),q:from[side].q.clone(),ball:from[side].ball.clone()}]))};}
 const plan=c.seatFeet24;if(plan){if(plan.stage==='hold'&&w<.999){plan.stage='up';plan.age=0;plan.from=plan.dest;plan.rootFrom39=c.root.position.clone();
 // Phase26: arrival may still have a lifted/turning leg. Return to the actual upright chair-exit frame, never that historical asymmetric approach footprint.
 const sp=e.vs?.sp;if(!sp)throw Error('Missing actual stand-up chair '+c.role);const neutral=gaitIdle16(c),q=new Q().setFromAxisAngle(UP,c.yaw),sa39=c.seatAnchor39&&c.seatAnchor39.vs===e.vs?c.seatAnchor39:null,SD=sa39?sa39.sd:V43.standF[c.v43sk]??.65,origin=(sa39?new V(sa39.x,0,sa39.z):new V(sp.x+.5,0,sp.y+.5)).addScaledVector(new V(Math.sin(c.yaw),0,Math.cos(c.yaw)),SD);plan.originalStanding26=plan.standing;plan.dest={};for(const side of ['l','r']){const f=neutral[side];plan.dest[side]={p:f.p.clone().applyQuaternion(q).add(origin),q:q.clone().multiply(f.q),ball:q.clone().multiply(f.ball)}}plan.returnFrame26={origin:origin.toArray(),yaw:c.yaw};if(gaitScaled28(c)){plan.finalDest28=plan.dest;plan.dest={...plan.dest,r:{...plan.dest.r,p:plan.from.r.p.clone().lerp(plan.dest.r.p,.5)}}}}if(plan.stage!=='hold')plan.age+=dt;// Phase39c: while the root is still travelling from the seat to the stand point, a stepping foot may not lead the body: its step fraction is limited by the root's travel fraction (released once the root stops).
let prog39=1;if(plan.stage==='up'&&plan.rootFrom39&&plan.returnFrame26){const O=new V().fromArray(plan.returnFrame26.origin),tot=Math.hypot(O.x-plan.rootFrom39.x,O.z-plan.rootFrom39.z);if(tot>.01&&(c.gaitActualSpeed||0)>.02)prog39=THREE.MathUtils.clamp(Math.hypot(c.root.position.x-plan.rootFrom39.x,c.root.position.z-plan.rootFrom39.z)/tot,0,1)}plan.prog39=prog39;for(const side of ['l','r']){const a=plan.from[side],b=plan.dest[side],u=plan.stage==='hold'?1:plan.stage==='upFinal28'&&side==='l'?0:Math.min(prog39,THREE.MathUtils.clamp((plan.age-(side==='r'?0:.22))/.22,0,1)),v=u*u*(3-2*u),T=a.p.clone().lerp(b.p,v);T.y+=.045*Math.sin(Math.PI*u);gaitAimFoot(c,side,T,a.q.clone().slerp(b.q,v),a.ball.clone().slerp(b.ball,v))}if(plan.stage==='upFinal28'&&plan.age>=.22&&w<.001)c.seatFeet24=null;else if(plan.age>=.44&&(plan.stage!=='up'||prog39>=1)){if(plan.stage==='down')plan.stage='hold';else if(plan.stage==='up'&&plan.finalDest28){const actual=gaitFeet(c);plan.stage='upFinal28';plan.age=0;plan.from=actual;plan.dest={r:plan.finalDest28.r,l:actual.l};}else if(plan.stage==='up'&&w<.001)c.seatFeet24=null}}
 else for(const side of ['l','r'])if(feet[side].minY<.003){const f=feet[side],T=f.p.clone();T.y+=.003-f.minY;gaitAimFoot(c,side,T,f.q,f.ball)}
 }return}if(c.anatomicalGait&&!e.vs&&['idle','walk','treatp'].includes(p.act)){c.gy=c.neutralGround;c.m.position.set(0,c.neutralGround,0);c.m.updateMatrixWorld(true);return}if(!c.b.foot_l||p.act==='lie'||p.act==='dead'||p.act==='v43lie'){c.gy=0;return}
 if(c.fh0==null){if(p.act==='idle'||p.act==='walk'){c.fh0=Math.min(footY(c,'l'),footY(c,'r'));}else return}
 const sit=p.act==='sit'||p.act==='sitdown'||p.act==='situp';let want;
 if(sit){const sk=(c.v43sk)||(e.vs&&e.vs.sp&&e.vs.sp.seat),SH=p.seatH??SEATH[sk]??.5;const ty=(c.b.thigh_l.getWorldPosition(_v1).y+c.b.thigh_r.getWorldPosition(new THREE.Vector3()).y)/2-c.root.position.y;
  const w=p.act==='sit'?1:p.act==='sitdown'?Math.min(1,(p.k||0)*1.5):Math.max(0,1-(p.k||0)*1.5);
  const g=-Math.min(footY(c,'l'),footY(c,'r'))+c.fh0;want=THREE.MathUtils.clamp((SH+.08-ty)*w+g*(1-w),-.3,.3);c.sitW=w}
 else{want=THREE.MathUtils.clamp(-Math.min(footY(c,'l'),footY(c,'r'))+c.fh0,-.12,.12);c.sitW=0;if(p.act==='walk')want=Math.min(want,0)*0}
 c.gy=(c.gy||0)+(want-(c.gy||0))*Math.min(1,dt*12);c.m.position.y=c.gy;if(p.seatH)c.v43gy=c.gy;
 {c.ox??=0;c.oz??=0;const sp=e.vs&&e.vs.sp;let tz=0;if(p.act==='sit'&&sp&&e.vs.pose==='sit'&&!c.v43){const fx=Math.sin(c.yaw),fz=Math.cos(c.yaw);tz=THREE.MathUtils.clamp((sp.x+.5-c.root.position.x)*fx+(sp.y+.5-c.root.position.z)*fz+.2,-.1,.6)}
  const kk=Math.min(1,dt*6);c.oz+=(tz-c.oz)*kk;c.m.position.x=0;c.m.position.z=c.oz}c.m.updateMatrixWorld(true);
 if(c.sitW>.3)for(const s of['l','r']){const d=c.fh0-footY(c,s);if(d<0||d>-.6)legIK(c,s,d*c.sitW)}}
// процедуры, реагирующие на пациента
function procFx(e,c,p,now){if(c.isStaff||e.state!=='treat')return null;const r=roomOf(e);if(!r)return null;const q=typeof procQ==='function'?procQ(e):((e.t||0)/8)%1;const dyn=DYN.get(r.id);if(!dyn)return null;const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
 const k=ease(q/.12)*(1-ease((q-.88)/.12));dyn.active={q,k,e,c,t:now};return{type:r.type,q,k}}
const HOSES=[];
function animRooms(now,dt){for(const[id,d]of DYN){if(!d.r)continue;const r=d.r;const a=d.active;d.active=null;const k=a?a.k:0;d.k=(d.k||0)+(k-(d.k||0))*Math.min(1,dt*4);const kk=d.k;
  if(d.leaf){const t=Math.min(1,r.dop||0)*1.3;d.leaf.rotation.y=d.leaf.userData.base-t}
  const P=d.parts;
  if(P.slide){for(const s of P.slide){s.userData.z0??=s.position.z;s.position.z=s.userData.z0-.75*kk}}
  if(P.glow)for(const g of P.glow)g.material.emissiveIntensity=.4+(a?.6+.6*Math.sin(now/120):0);
  if(P.needle)for(const n of P.needle)n.rotation.z=a?Math.sin(now/200)*.9:0;
  if(P.spark)for(const s of P.spark){s.visible=!a||Math.random()<.6;s.scale.setScalar(a?.08+Math.random()*.06:.08)}
  if(P.uv)for(const u of P.uv)u.material.emissiveIntensity=a?1.6:.3;
  if(P.xglow)for(const x of P.xglow)x.material.emissiveIntensity=a?(.8+.4*Math.sin(now/90)):.2;
  if(P.podglass)for(const g of P.podglass)g.material.opacity=.25+(a?.35*Math.abs(Math.sin(now/300)):0);
  if(P.fish)for(const[i,f]of P.fish.entries()){f.userData.x0??=f.position.x;f.position.x=f.userData.x0+Math.sin(now/900+i*2)*.12}
  // пациент в сканере: тело уезжает внутрь кольца вместе со столом
  if(a&&r.type==='diag'&&a.c.pose&&a.c.pose.act==='lie'){const yaw=a.c.root.rotation.y;a.c.root.position.x-=Math.sin(yaw)*.75*kk;a.c.root.position.z-=Math.cos(yaw)*.75*kk}
  // шланг к голове (сдувательная/надувательная): клапан на голове
  if(a&&(r.type==='pump'||r.type==='inflate')){const mach=d.items.find(i=>i.k==='pumpmachine'||i.k==='inflator');if(mach){// head scale BEFORE hose so valve sits on current head surface
   if(r.type==='inflate')a.c.b.Head.scale.setScalar(a.c.hs*(1+.35*Math.sin(Math.min(1,a.q/.7)*Math.PI)));else if(e2big(a.e)){const t=Math.min(1,a.q/.8),H=a.c.headS||[a.c.hs*1.35,a.c.hs*1.35,a.c.hs*1.35];a.c.b.Head.scale.set(H[0]+(a.c.hs-H[0])*t,H[1]+(a.c.hs-H[1])*t,H[2]+(a.c.hs-H[2])*t)}
   hose(id,mach.piv,a.c,kk,r.type)}}
  else hose(id,null)}}
function e2big(e){return e.dis==='balloonhead'||e.dis==='cloudhead'}
const HM=new Map();function hose(id,piv,c,k,type){let h=HM.get(id);if(!piv){if(h){h.visible=false;h.valve.visible=false}return}
 if(!h){h=new THREE.Mesh(new THREE.BufferGeometry(),mat(type==='pump'?0x3a6ea5:0xe0703a));scene.add(h);HM.set(id,h);h.valve=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.06,10),mat(0xc0c8d0));}
 h.visible=k>.05;if(!h.visible){h.valve.visible=false;return}piv.updateMatrixWorld(true);const A=new THREE.Vector3(0,1.15,.4).applyMatrix4(piv.matrixWorld);const hd=c.b.Head;hd.updateWorldMatrix(true,false);const H0=hd.getWorldPosition(new THREE.Vector3()),N0=(c.b.neck_01||c.b.neck||hd.parent).getWorldPosition(new THREE.Vector3());const up=H0.clone().sub(N0).normalize();const sc=new THREE.Vector3();hd.matrixWorld.decompose(new THREE.Vector3(),new THREE.Quaternion(),sc);const hr=(window.HOSE_R??.17)*Math.max(sc.x,sc.y,sc.z)/Math.max(1e-3,c.root.scale.x||1)*(c.root.scale.x||1);const B=H0.clone().addScaledVector(up,hr);
 if(h.valve.parent!==scene){scene.add(h.valve)}h.valve.position.copy(B);h.valve.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),up);h.valve.visible=true;
 const M=A.clone().lerp(B,.5);M.y=Math.max(A.y,B.y)+.35;const cur=new THREE.QuadraticBezierCurve3(A,M,B);h.geometry.dispose();h.geometry=new THREE.TubeGeometry(cur,14,.03,6,false)}
// ---------- кадр ----------
let lastT=performance.now(),fpsA=60;
function chars45(adt,now){for(const c of CH.values())c.seen=false;for(const p of S.pats)updSafe45(p,false,adt,now);for(const s of S.staff)updSafe45(s,true,adt,now);for(const[id,c]of CH)if(!c.seen){c.dispose();CH.delete(id)}}
window.__sub45=function(rdt){if(!READY||!S||!S.rooms||!S.h||!(rdt>0))return;try{OX=S.h*HW+MARGIN;if(!ST||STSIG!==sig())buildStatic();const now=lastT+rdt*1000;lastT=now;window.__subN45=(window.__subN45||0)+1;chars45(speed>0?rdt:rdt*.3,now)}catch(e){console.error('3d-sub',e.stack)}};
function draw3D(){const t045=performance.now();const now=(Q.has('cap')?window.__fakeNow:undefined)??performance.now(),dt=Math.min(.1,(now-lastT)/1000);lastT=now;fpsA+=(1/Math.max(dt,1e-3)-fpsA)*.05;window.__fps3=fpsA;
 OX=S.h*HW+MARGIN;if(!ST||STSIG!==sig())buildStatic();
 const sdt=dt*Math.max(.25,speed||0)*(speed>0?1:0.0)+ (speed>0?0:dt*.0);
 const adt=speed>0?dt:dt*.3;
 chars45(adt,now);
 animRooms(now,dt);sel3d();
 syncCam();renderer.render(scene,camera);overlay(now);adaptDpr45(performance.now(),performance.now()-t045)}
// выделение
const SELR=new THREE.Mesh(new THREE.RingGeometry(.38,.46,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffe14d,depthWrite:false}));SELR.position.y=.02;scene.add(SELR);
function sel3d(){SELR.visible=false;if(!ui.sel||ui.sel.k==='room')return;const c=CH.get(ui.sel.id);if(!c)return;SELR.visible=true;SELR.position.x=c.root.position.x;SELR.position.z=c.root.position.z}
// ---------- 2D-оверлей: подписи, эмодзи, призрак постройки ----------
function overlay(now){const dpr=cv.width/Math.max(1,innerWidth);cx.setTransform(1,0,0,1,0,0);cx.clearRect(0,0,cv.width,cv.height);
 cx.setTransform(cam.z*dpr,0,0,cam.z*dpr,-cam.x*cam.z*dpr,-cam.y*cam.z*dpr);
 for(const l of S.litter){const p=iso(l.x+.5,l.y+.5);if(l.v){cx.fillStyle='rgba(150,170,40,.85)';cx.beginPath();cx.ellipse(p.x,p.y,11,6,0,0,7);cx.fill();cx.fillStyle='rgba(120,140,30,.9)';cx.beginPath();cx.ellipse(p.x+5,p.y+2,5,3,0,0,7);cx.fill();continue}cx.fillStyle='#f4f4f0';cx.save();cx.translate(p.x,p.y);cx.rotate((l.x*13)%3);cx.fillRect(-4,-2,8,5);cx.fillStyle='#c33';cx.fillRect(-4,-2,3,5);cx.restore()}
 for(const it of S.items)if(it.type==='bin'&&(it.fill||0)>=40){const p=iso(it.x+.5,it.y+.5);cx.fillStyle='#222';cx.fillRect(p.x-10,p.y-46,20,4);cx.fillStyle=it.fill>=80?'#e33':'#eb3';cx.fillRect(p.x-10,p.y-46,20*it.fill/100,4)}
 if(typeof drawLots==='function')drawLots(cx);
 for(const p of S.pats){const c=CH.get(p.id);if(!c||p.state==='dead')continue;const q=c.root.position;const s=iso(q.x,q.z);let top=c.pose&&c.pose.act==='lie'?36:c.pose&&/sit/.test(c.pose.act)?58:76;const py=s.y;
  const _dz=D.dis[p.dis];const mk=(p.inf?'🦠':'')+(p.emg?'🚑':'')+(p.vip?'🎩':'')+(p.known&&_dz&&_dz.icon&&!p.healed?_dz.icon:'');if(mk)emoT(14,mk,s.x-8,py-top-14);
  if(p.angry&&p.state==='leave')emoT(13,'💢',s.x-12+Math.sin(S.t*14)*2,py-top-24);
  if(p.thought){cx.fillStyle='rgba(255,255,255,.9)';cx.beginPath();cx.arc(s.x+10,py-top-8,9,0,7);cx.fill();cx.font='12px sans-serif';cx.textAlign='center';cx.fillStyle='#000';cx.fillText(p.thought,s.x+10,py-top-4)}
  if(p.health<40){cx.fillStyle='#300';cx.fillRect(s.x-10,py-top-12,20,3);cx.fillStyle='#e33';cx.fillRect(s.x-10,py-top-12,20*p.health/100,3)}}
 for(const e of S.staff)if(e.state==='rest'){const c=CH.get(e.id);if(!c)continue;const s=iso(c.root.position.x,c.root.position.z);cx.font='11px sans-serif';cx.fillText('💤',s.x+10,s.y-56)}
 if(typeof v19World==='function'){try{v19World(cx,now)}catch(e){}}
 cx.textAlign='center';for(const r of S.rooms){if(r.par)continue;const d=D.rooms[r.type],p=iso(r.x+r.w/2,r.y+.5);cx.font='bold 10px sans-serif';const tw=cx.measureText(d.name).width+10;cx.fillStyle='rgba(20,30,40,.75)';cx.fillRect(p.x-tw/2,p.y-104,tw,15);cx.fillStyle='#fff';cx.fillText(d.name,p.x,p.y-93);
  if(d.machine){cx.fillStyle='#300';cx.fillRect(p.x-20,p.y-86,40,4);cx.fillStyle=r.cond>50?'#3c3':r.cond>25?'#fc3':'#f33';cx.fillRect(p.x-20,p.y-86,40*r.cond/100,4)}
  if(d.staff&&!r.staff){const q=iso(r.x+r.w/2,r.y+r.h/2);cx.font='18px sans-serif';cx.fillText('⚠️',q.x,q.y)}
  if(ui.sel&&ui.sel.k==='room'&&ui.sel.id===r.id)diamond(r.x,r.y,r.w,r.h,'#ffe14d',null)}
 const e=iso(S.ent.x+.5,S.h+.6);cx.font='bold 11px sans-serif';cx.fillStyle='#fff';cx.fillText('ВХОД',e.x,e.y+6);
 if(ui.ghost){const g=ui.ghost,bad=validRoom(g);diamond(g.x,g.y,g.w,g.h,bad?'#f33':'#3f3',bad?'rgba(255,0,0,.25)':'rgba(0,255,0,.2)');const t=makeRoom(g.type,g.x,g.y,g.w,g.h,g.side);S.nid--;diamond(t.door.x,t.door.y,1,1,'#ffb347','rgba(255,180,70,.6)');const c=iso(g.x+g.w/2,g.y+g.h/2);cx.fillStyle='#fff';cx.font='bold 12px sans-serif';cx.fillText(bad||D.rooms[g.type].name,c.x,c.y)}
 {const g=typeof v42IG==='function'&&v42IG();if(g){const bad=g.bad,[w,h]=g.fp;diamond(g.x,g.y,w,h,bad?'#f33':'#3f3',bad?'rgba(255,0,0,.3)':'rgba(0,255,0,.28)');const H=g.type==='soda'?60:g.type==='plant'?40:g.type==='bin'?26:g.type==='radiator'?26:22;const P=[iso(g.x,g.y),iso(g.x+w,g.y),iso(g.x+w,g.y+h),iso(g.x,g.y+h)];cx.strokeStyle=bad?'#f55':'#5f5';cx.lineWidth=2;cx.setLineDash([5,4]);cx.beginPath();for(const p of P){cx.moveTo(p.x,p.y);cx.lineTo(p.x,p.y-H)}cx.moveTo(P[0].x,P[0].y-H);for(const p of P)cx.lineTo(p.x,p.y-H);cx.closePath();cx.stroke();cx.setLineDash([]);const F=[[1,0],[0,1],[-1,0],[0,-1]][g.dir],c=iso(g.x+w/2,g.y+h/2),t=iso(g.x+w/2+F[0]*(w/2+.6),g.y+h/2+F[1]*(h/2+.6));cx.strokeStyle='#fff';cx.lineWidth=3;cx.beginPath();cx.moveTo(c.x,c.y);cx.lineTo(t.x,t.y);cx.stroke();cx.fillStyle='#fff';cx.beginPath();cx.arc(t.x,t.y,4,0,7);cx.fill();cx.font='bold 12px sans-serif';cx.textAlign='center';cx.fillStyle=bad?'#fdd':'#dfd';cx.fillText((bad?'✖ '+bad:'✔ ')+' '+D.items[g.type].name,c.x,c.y-H-8)}}
 if(Q.has('fps')){cx.setTransform(1,0,0,1,0,0);cx.font='bold 14px monospace';cx.fillStyle='#fff';cx.textAlign='left';cx.fillText(Math.round(fpsA)+' fps',8,cv.height-10)}}
READY=true;if(Q.has('cap'))window.__r3d={scene,CH,DYN,renderer,camera,makeFurn,V43,SEATH,v43SeatKind};window.__ready3d=true;
