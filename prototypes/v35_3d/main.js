// v30: стилизованный мульт-3D (three.js r170). 4 комнаты-диорамы (запечённый свет, 1 материал-атлас), 11 персонажей
// со скином, анимации UAL (CC0) + процедурные слои (письмо, осмотр стетоскопом, взгляд, моргание, эмоции).
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {clone as skClone} from 'three/addons/utils/SkeletonUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
const Q=new URLSearchParams(location.search);const LOWQ=Q.has('low')||(!Q.has('full')&&localStorage.getItem('q')==='light');
const RC=new THREE.Raycaster();const ROOMMESH=[];const LEGFIX=!Q.has('legacy');
const renderer=new THREE.WebGLRenderer({antialias:LOWQ,powerPreference:'high-performance',preserveDrawingBuffer:Q.has('cap')});
const DPRMAX=Math.min(devicePixelRatio,LOWQ?1:2),DPRMIN=Math.min(DPRMAX,LOWQ?1:1.5);let DPR=DPRMAX;renderer.setPixelRatio(DPR);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x27324a);
const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.45;
// ---------- камера (изометрия + орбита/пинч, как в v28) ----------
const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);const TGT=new THREE.Vector3(0,.8,0);
let AZ=Math.PI/4,EL=.58,ZM=1,BASEH=innerWidth<innerHeight?9.5:7.6;
function fit(){const a=innerWidth/innerHeight,h=BASEH;cam.left=-h*a;cam.right=h*a;cam.top=h;cam.bottom=-h;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer&&composer.setSize(innerWidth,innerHeight)}
let CAMR=40;function place(){const r=CAMR;cam.position.set(TGT.x+r*Math.cos(EL)*Math.sin(AZ),TGT.y+r*Math.sin(EL),TGT.z+r*Math.cos(EL)*Math.cos(AZ));cam.lookAt(TGT);cam.zoom=ZM;cam.updateProjectionMatrix()}
let composer=null;
if(!LOWQ){const rt=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4});composer=new EffectComposer(renderer,rt);composer.addPass(new RenderPass(scene,cam));
 const bl=new UnrealBloomPass(new THREE.Vector2(256,256),.28,.5,.92);composer.addPass(bl);composer.addPass(new OutputPass())}
place();fit();addEventListener('resize',fit);
let userCam=0;{const pts=new Map();let pd=0;const el=renderer.domElement;el.style.touchAction='none';
 el.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size==2){const[a,b]=[...pts.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1])}});
 el.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;const o=pts.get(e.pointerId);userCam=1;
  if(pts.size==1){if(ZM>1.2){const k=BASEH*2/ZM/innerHeight,r=new THREE.Vector3(Math.cos(AZ),0,-Math.sin(AZ)),f=new THREE.Vector3(-Math.sin(AZ),0,-Math.cos(AZ));TGT.addScaledVector(r,-(e.clientX-o[0])*k).addScaledVector(f,-(e.clientY-o[1])*k/Math.sin(EL))}
   else{AZ-=(e.clientX-o[0])*.008;EL=Math.min(1.35,Math.max(.2,EL+(e.clientY-o[1])*.006))}}
  pts.set(e.pointerId,[e.clientX,e.clientY]);
  if(pts.size==2){const[a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd)ZM=Math.min(5,Math.max(.6,ZM*d/pd));pd=d}place()});
 const up=e=>{pts.delete(e.pointerId);pd=0};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
 el.addEventListener('wheel',e=>{userCam=1;ZM=Math.min(5,Math.max(.6,ZM*Math.exp(-e.deltaY*.001)));place()},{passive:true});
 el.addEventListener('dblclick',()=>{userCam=0;AZ=Math.PI/4;EL=.58;ZM=1;TGT.set(0,.8,0);place()});}
{const fb=document.getElementById('fb'),hd=document.getElementById('hud');const ap=()=>{const on=localStorage.getItem('fps')!=='0';hd.style.display=on?'':'none';fb.style.opacity=on?1:.55};ap();fb.onclick=()=>{localStorage.setItem('fps',localStorage.getItem('fps')==='0'?'1':'0');ap()}}
const qb=document.getElementById('qb');qb.textContent='Качество: '+(LOWQ?'ЛЁГКОЕ':'ПОЛНОЕ');qb.onclick=()=>{localStorage.setItem('q',LOWQ?'full':'light');location.reload()};
// ---------- свет для персонажей (комнаты — только запечённый лайтмап) ----------
scene.add(new THREE.HemisphereLight(0xeef4ff,0x9a8a78,1.1));
const sun=new THREE.DirectionalLight(0xfff0dd,2.1);sun.position.set(6,10,8);scene.add(sun);
const fill=new THREE.DirectionalLight(0xcfe0ff,.6);fill.position.set(-6,4,-3);scene.add(fill);
// ---------- загрузка ----------
const draco=new DRACOLoader().setDecoderPath('./lib/draco/');const L=new GLTFLoader().setDRACOLoader(draco);
const ld=u=>new Promise((r,j)=>L.load(u,r,undefined,j));const TL=new THREE.TextureLoader();
const ROLES=['doctor','nurse','orderly','receptionist','bighead','invisible','rocker','mummy','patient_a'];
const ROOMS=['room_gp','room_rec','room_psy','room_def'];
const [roomG,anG,prG,...rest]=await Promise.all([ld('models/rooms.glb'),ld('models/anims.glb'),ld('models/props.glb'),...ROLES.map(r=>ld(`models/${r}.glb`)),...ROOMS.map(r=>TL.loadAsync(`models/lm_${r}.jpg`))]);
const G={};ROLES.forEach((r,i)=>G[r]=rest[i]);const LMT={};ROOMS.forEach((r,i)=>{const t=rest[ROLES.length+i];t.flipY=false;t.channel=1;t.colorSpace=THREE.SRGBColorSpace;LMT[r]=t});
roomG.scene.traverse(o=>{if(!o.isMesh)return;const m0=o.material;m0.map.anisotropy=4;
 o.material=new THREE.MeshBasicMaterial({map:m0.map,lightMap:LMT[o.name]||LMT[o.parent?.name],lightMapIntensity:2.0*1.05});o.matrixAutoUpdate=false;o.updateMatrix()});
scene.add(roomG.scene);roomG.scene.updateMatrixWorld(true);roomG.scene.traverse(o=>{if(o.isMesh)ROOMMESH.push(o)});
// v32: 2D-сетка треугольников комнат для быстрых вертикальных лучей (вместо перебора всех треугольников Raycaster'ом)
const HG=new Map(),HC=.1;{const v=new THREE.Vector3();for(const o of ROOMMESH){const g=o.geometry,P=g.attributes.position,I=g.index,n=I?I.count:P.count;const W=new Float32Array(P.count*3);
 for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld);W[i*3]=v.x;W[i*3+1]=v.y;W[i*3+2]=v.z}
 for(let t=0;t<n;t+=3){const a=I?I.getX(t):t,b=I?I.getX(t+1):t+1,c=I?I.getX(t+2):t+2;const ax=W[a*3],az=W[a*3+2],bx=W[b*3],bz=W[b*3+2],cx=W[c*3],cz=W[c*3+2];
  const den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz);if(Math.abs(den)<1e-10)continue;const tri=[ax,W[a*3+1],az,bx,W[b*3+1],bz,cx,W[c*3+1],cz,den];
  const x0=Math.floor(Math.min(ax,bx,cx)/HC),x1=Math.floor(Math.max(ax,bx,cx)/HC),z0=Math.floor(Math.min(az,bz,cz)/HC),z1=Math.floor(Math.max(az,bz,cz)/HC);
  for(let i=x0;i<=x1;i++)for(let j=z0;j<=z1;j++){const k=i*65536+j;let L=HG.get(k);if(!L)HG.set(k,L=[]);L.push(tri)}}}}
function downHits(x,z,top,far){const L=HG.get(Math.floor(x/HC)*65536+Math.floor(z/HC)),r=[];if(!L)return r;
 for(const t of L){const den=t[9],l1=((t[5]-t[8])*(x-t[6])+(t[6]-t[3])*(z-t[8]))/den,l2=((t[8]-t[2])*(x-t[6])+(t[0]-t[6])*(z-t[8]))/den,l3=1-l1-l2;
  if(l1<-1e-6||l2<-1e-6||l3<-1e-6)continue;const y=l1*t[1]+l2*t[4]+l3*t[7];if(y<=top&&y>=top-far)r.push(y)}return r.sort((a,b)=>b-a)}
window.__downHits=downHits;
const PROPS={};for(const o of prG.scene.children)PROPS[o.name]=o;
const PROOM={room_gp:[-5.6,0],room_rec:[0,5.6],room_psy:[0,-5.6],room_def:[5.6,0]};
const W=(room,x,y)=>new THREE.Vector3(PROOM[room][0]+x,0,-(PROOM[room][1]+y));   // локальные координаты комнаты (Blender) -> three
// ---------- мульт-материал (мягкий toon) + контур ----------
const grad=new THREE.DataTexture(new Uint8Array([90,90,90,255,165,165,165,255,225,225,225,255,255,255,255,255]),4,1);grad.needsUpdate=true;grad.magFilter=grad.minFilter=THREE.LinearFilter;
function toon(m){const t=new THREE.MeshToonMaterial({map:m.map,normalMap:LOWQ?null:m.normalMap,color:m.color,gradientMap:grad,transparent:m.transparent,opacity:m.opacity,side:m.side});
 if(m.normalMap)t.normalScale=new THREE.Vector2(.6,.6);return t}
const OUTM=new THREE.MeshBasicMaterial({color:0x1d1820,side:THREE.BackSide});
OUTM.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <project_vertex>','transformed+=normalize(objectNormal)*0.0055;\n#include <project_vertex>')};
// ---------- клипы: ретаргет по именам + масштаб высоты таза ----------
const ualPel=anG.scene.getObjectByName('pelvis').position.clone();
const clipCache=new Map();
function clipsFor(pel){const k=pel.y.toFixed(3);if(clipCache.has(k))return clipCache.get(k);const s=pel.y/ualPel.y;
 const out=anG.animations.map(c=>{const cc=c.clone();cc.tracks=cc.tracks.filter(t=>!t.name.endsWith('.scale'));for(const t of cc.tracks)if(t.name==='pelvis.position'){const v=t.values;for(let i=0;i<v.length;i++)v[i]*=s}return cc});clipCache.set(k,out);return out}
const angd=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_v=new THREE.Vector3(),_v2=new THREE.Vector3();
function rotWorld(b,axis,ang){if(!ang)return;b.parent.getWorldQuaternion(_q2);_q.setFromAxisAngle(axis,ang);const inv=_q2.clone().invert();b.quaternion.premultiply(inv.multiply(_q).multiply(_q2));b.updateMatrixWorld(true)}
const UP=new THREE.Vector3(0,1,0),DOWN=new THREE.Vector3(0,-1,0);
function setWorld(o,p,q){const P=o.parent;P.updateMatrixWorld(true);o.position.copy(P.worldToLocal(p.clone()));o.quaternion.copy(P.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q))}
function rotWorldQ(b,q){b.parent.getWorldQuaternion(_q2);const inv=_q2.clone().invert();b.quaternion.premultiply(inv.multiply(q).multiply(_q2));b.updateMatrixWorld(true)}
function ik2(u,l,h,T,pole,w){if(w<=0)return;const S=u.getWorldPosition(new THREE.Vector3()),E=l.getWorldPosition(new THREE.Vector3()),H=h.getWorldPosition(new THREE.Vector3());
 const a=E.distanceTo(S),bb=H.distanceTo(E);let D=T.clone().sub(S);const d=THREE.MathUtils.clamp(D.length(),Math.abs(a-bb)+1e-3,a+bb-1e-3);const dir=D.normalize();
 const p=pole.clone().addScaledVector(dir,-pole.dot(dir)).normalize();const ca=THREE.MathUtils.clamp((a*a+d*d-bb*bb)/(2*a*d),-1,1),sa=Math.sqrt(1-ca*ca);
 const El=S.clone().addScaledVector(dir,a*ca).addScaledVector(p,a*sa);
 let q=new THREE.Quaternion().setFromUnitVectors(E.clone().sub(S).normalize(),El.sub(S).normalize());q.slerp(new THREE.Quaternion(),1-w);rotWorldQ(u,q);
 const E2=l.getWorldPosition(new THREE.Vector3()),H2=h.getWorldPosition(new THREE.Vector3());q=new THREE.Quaternion().setFromUnitVectors(H2.sub(E2).normalize(),T.clone().sub(E2).normalize());q.slerp(new THREE.Quaternion(),1-w);rotWorldQ(l,q)}
function aimB(bn,ch,T,w){if(w<=0)return;const P=bn.getWorldPosition(new THREE.Vector3()),C=ch.getWorldPosition(new THREE.Vector3());const q=new THREE.Quaternion().setFromUnitVectors(C.sub(P).normalize(),T.clone().sub(P).normalize());q.slerp(new THREE.Quaternion(),1-w);rotWorldQ(bn,q)}
const chars=[];
class Char{constructor(role,o={}){const g=G[role];this.role=role;this.root=new THREE.Group();this.m=skClone(g.scene);this.root.add(this.m);scene.add(this.root);
  this.b={};this.meshes=[];this.m.traverse(x=>{if(x.isBone)this.b[x.name]=x;if(x.isMesh)this.meshes.push(x)});
  this.hs=o.head||1.3;this.b.Head.scale.setScalar(this.hs);for(const h of['hand_l','hand_r'])this.b[h].scale.setScalar(1.22);
  for(const f of['foot_l','foot_r'])this.b[f].scale.setScalar(1.1);
  this.m.updateMatrixWorld(true);this.fh=this.b.foot_l.getWorldPosition(new THREE.Vector3()).y;this.bh=this.b.ball_l.getWorldPosition(new THREE.Vector3()).y;this.gy=0;this.p0=this.b.pelvis.getWorldPosition(new THREE.Vector3()).y;this.seat=null;this.seatN=0;this.stride={};this.prevP=new THREE.Vector3();this.sw=0;
  for(const x of this.meshes){x.frustumCulled=false;x.material=toon(x.material);
   if(o.invisible&&!/Clothes/.test(x.name)){x.visible=false;continue}
   if(x.morphTargetDictionary){for(const[k,i]of Object.entries(x.morphTargetDictionary)){(this.morph??={})[k]=[x,i]}}
   if(!LOWQ&&/Clothes|Super|Hair|Body/i.test(x.name)){const ol=new THREE.SkinnedMesh(x.geometry,OUTM);ol.bind(x.skeleton,x.bindMatrix);ol.frustumCulled=false;ol.morphTargetInfluences=x.morphTargetInfluences;x.parent.add(ol)}}
  const sh=new THREE.Mesh(new THREE.CircleGeometry(.42,24).rotateX(-Math.PI/2),SHM);sh.position.y=.012;sh.renderOrder=1;this.root.add(sh);this.shadow=sh;
  this.mix=new THREE.AnimationMixer(this.m);this.A={};
  for(const c of clipsFor(this.b.pelvis.position)){const a=this.mix.clipAction(c);a.enabled=true;a.setEffectiveWeight(0);a.play();this.A[c.name]=a;
   if(/Enter|Exit|Interact|PickUp/.test(c.name)){a.setLoop(THREE.LoopOnce);a.clampWhenFinished=true}}
  this.cur=null;this.yaw=0;this.tyaw=0;this.path=[];this.v=0;this.look=null;this.hy=0;this.hp=0;this.speed=o.speed||1.0;this.layer={};this.lw={};
  this.blinkT=1+Math.random()*3;this.blink=0;this.smile=0;this.tsmile=0;this.brow=0;this.tbrow=0;this.t=Math.random()*10;this.ph=Math.random()*6;
  this.walkName=o.walk||'Walk_Loop';chars.push(this)}

 // ===== v30: ноги. Скорость шага клипа (м/с опорной стопы), заземление, посадка на сиденье, IK двух костей =====
 strideOf(n){if(this.stride[n])return this.stride[n];const a=this.A[n],c=a.getClip(),mx=new THREE.AnimationMixer(this.m),aa=mx.clipAction(c);aa.play();
  const N=48,zs=[];for(let i=0;i<=N;i++){aa.time=c.duration*i/N;mx.update(0);this.m.updateMatrixWorld(true);
   const l=this.m.worldToLocal(this.b.ball_l.getWorldPosition(new THREE.Vector3())),r=this.m.worldToLocal(this.b.ball_r.getWorldPosition(new THREE.Vector3()));zs.push(l.y<r.y?[0,l.z]:[1,r.z])}
  const v=[];for(let i=1;i<=N;i++)if(zs[i][0]===zs[i-1][0])v.push(Math.abs(zs[i][1]-zs[i-1][1])/(c.duration/N));v.sort((a,b)=>a-b);
  mx.stopAllAction();mx.uncacheRoot(this.m);const s=v.length?v[Math.floor(v.length*.6)]:1;this.stride[n]=Math.max(.2,s);return this.stride[n]}
 contact(side){const f=this.b['foot_'+side].getWorldPosition(new THREE.Vector3()).y-this.fh,bl=this.b['ball_'+side].getWorldPosition(new THREE.Vector3()).y-this.bh;return Math.min(f,bl)-this.root.position.y}
 fwd(){const y=this.root.rotation.y;return new THREE.Vector3(Math.sin(y),0,Math.cos(y))}
 seatTop(){if(this.seatN-->0)return this.seat;this.seatN=8;const fw=this.fwd();const p=this.b.pelvis.getWorldPosition(new THREE.Vector3()).addScaledVector(fw,-(this.so||0));
  const H=[];for(let d=-.5;d<=.9;d+=.02){const o=p.clone().addScaledVector(fw,d);o.y+=.35;const h=downHits(o.x,o.z,o.y,1.3).find(y=>y>.12&&y<p.y+.2);H.push([d,h??null])}
  let i0=-1,bd=9;H.forEach((h,i)=>{if(h[1]!=null&&Math.abs(h[0])<bd){bd=Math.abs(h[0]);i0=i}});
  if(i0<0){this.seat=null;return null}const y=H[i0][1];let f=i0,bk=i0;while(f+1<H.length&&H[f+1][1]!=null&&Math.abs(H[f+1][1]-y)<.05)f++;while(bk>0&&H[bk-1][1]!=null&&Math.abs(H[bk-1][1]-y)<.05)bk--;
  this.seat=y;this.seatF=H[f][0]+.01;this.seatB=H[bk][0];return y}
 calfAim(side,w){const ca=this.b['calf_'+side],ft=this.b['foot_'+side],fw=this.fwd();const K=ca.getWorldPosition(new THREE.Vector3()),F=ft.getWorldPosition(new THREE.Vector3());const fq=ft.getWorldQuaternion(new THREE.Quaternion());
  const b=F.distanceTo(K),h=K.y-(this.root.position.y+this.fh*.97);const lat=F.clone().sub(K).setY(0);lat.addScaledVector(fw,-lat.dot(fw));
  const T=K.clone().addScaledVector(lat,.5);const hh=Math.min(b*.995,Math.max(.05,h));T.y-=hh;T.addScaledVector(fw,Math.sqrt(Math.max(0,b*b-hh*hh-lat.lengthSq()*.25))+0);
  const dir=T.sub(K).normalize().lerp(F.clone().sub(K).normalize(),1-w).normalize();rotWorldQ(ca,new THREE.Quaternion().setFromUnitVectors(F.clone().sub(K).normalize(),dir));
  const pq=ft.parent.getWorldQuaternion(new THREE.Quaternion());ft.quaternion.copy(pq.invert().multiply(fq));ft.updateMatrixWorld(true)}
 ik(side,dy){if(Math.abs(dy)<.002)return;const th=this.b['thigh_'+side],ca=this.b['calf_'+side],ft=this.b['foot_'+side];
  const H=th.getWorldPosition(new THREE.Vector3()),K=ca.getWorldPosition(new THREE.Vector3()),F=ft.getWorldPosition(new THREE.Vector3());const fq=ft.getWorldQuaternion(new THREE.Quaternion());
  const T=F.clone();T.y+=dy;const a=K.distanceTo(H),b=F.distanceTo(K);const d=THREE.MathUtils.clamp(T.distanceTo(H),Math.abs(a-b)+.01,a+b-.005);
  const u=H.clone().sub(K),w=F.clone().sub(K);let n=new THREE.Vector3().crossVectors(u,w);
  if(n.lengthSq()<1e-8){const fw=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw));n.crossVectors(fw,UP)}n.normalize();   // прямая нога: сгиб колена вперёд
  const tc=u.angleTo(w),td=Math.acos(THREE.MathUtils.clamp((a*a+b*b-d*d)/(2*a*b),-1,1));rotWorldQ(ca,new THREE.Quaternion().setFromAxisAngle(n,td-tc));
  const F2=ft.getWorldPosition(new THREE.Vector3());rotWorldQ(th,new THREE.Quaternion().setFromUnitVectors(F2.sub(H).normalize(),T.clone().sub(H).normalize()));
  const pq=ft.parent.getWorldQuaternion(new THREE.Quaternion());ft.quaternion.copy(pq.invert().multiply(fq));ft.updateMatrixWorld(true)}
 legs(dt){const sit=/^Sitting/.test(this.cur||'')&&!this.noSeat,k=Math.min(1,dt*10);
  const py=this.b.pelvis.getWorldPosition(new THREE.Vector3()).y-this.root.position.y-this.gy;const sw=sit?THREE.MathUtils.clamp((this.p0-py)/(this.p0*.42),0,1):0;
  this.sw+=(sw-this.sw)*Math.min(1,dt*12);
  let want=-Math.min(this.contact('l'),this.contact('r'))+this.gy;want=THREE.MathUtils.clamp(want,-.15,.15);let oT=0;
  if(this.sw>.02){const st=this.seatTop();if(st!=null){const ty=(this.b.thigh_l.getWorldPosition(new THREE.Vector3()).y+this.b.thigh_r.getWorldPosition(new THREE.Vector3()).y)/2-this.gy;
    const sv=THREE.MathUtils.clamp(st+.085*this.p0/.949-ty,-.35,.25);want=want*(1-this.sw)+sv*this.sw;
    // колени за передний край сиденья, таз — на сиденье
    const fw=this.fwd(),P=this.b.pelvis.getWorldPosition(new THREE.Vector3());const kd=['l','r'].reduce((a,s)=>a+this.b['calf_'+s].getWorldPosition(new THREE.Vector3()).sub(P).dot(fw),0)/2;
    oT=this.seatF+(this.seatM??.18)-kd;oT=Math.max(oT,this.seatB+.06);oT=THREE.MathUtils.clamp(oT,-.45,.45)*(sit&&!this.noOff?Math.max(this.sw,.9):this.sw)}}
  this.gy+=(want-this.gy)*k;this.so=(this.so||0)+(oT-(this.so||0))*k;
  const v=this.fwd().multiplyScalar(this.so).applyQuaternion(this.root.quaternion.clone().invert());this.m.position.set(v.x,this.gy,v.z);this.m.updateMatrixWorld(true);
  {const fy=this.root.position.y;let mn=9;for(const n of['ball_l','ball_r','foot_l','foot_r']){const B=this.b[n];if(B)mn=Math.min(mn,B.getWorldPosition(_v).y-fy-(n[0]=='b'?.03:.07))}
   if(mn<0){this.gy-=mn;this.m.position.y=this.gy;this.m.updateMatrixWorld(true)}}
  {const fo=this.fo||(this.fo=new THREE.Vector3());if(this.cur===this.walkName&&this.v>.2&&!this.noLock){const F=['ball_l','ball_r'].map(k=>this.b[k].getWorldPosition(new THREE.Vector3()));const i=F[0].y<F[1].y?0:1;
   const iq=this.root.quaternion.clone().invert();
   if(this.lk&&this.lk.i===i){const d=this.lk.p.clone().sub(F[i]);d.y=0;d.applyQuaternion(iq);fo.add(d);const fl=this.lockMax||.08;if(fo.length()>fl)fo.setLength(fl)}else{this.lk={i,p:F[i]};fo.multiplyScalar(.7)}
   if(this.lk.i===i&&this.lk.p!==F[i])this.lk.p=F[i].clone().add(this.lk.p.clone().sub(F[i]).setY(0).applyQuaternion(iq).sub(this.lk.p.clone().sub(F[i]).setY(0).applyQuaternion(iq)))}
   else{this.lk=null;fo.multiplyScalar(Math.max(0,1-dt*8))}
   this.m.position.x+=fo.x;this.m.position.z+=fo.z;this.m.updateMatrixWorld(true)}
  for(const s of['l','r']){if(this.sw>.3&&this.seat!=null)this.calfAim(s,Math.min(1,(this.sw-.3)/.5));else{const c=this.contact(s);if(this.sw>.3)this.ik(s,-c*this.sw);else if(c<0)this.ik(s,-c)}}}
 headY(){return this.b.Head.getWorldPosition(_v).y}
 attach(name,bone,pos,rot=[0,0,0],sc=1){const p=PROPS[name].clone();p.position.set(0,0,0);p.rotation.set(0,0,0);
  // pos/rot заданы в осях персонажа (+Z вперёд, +X — левая рука персонажа) относительно мировой позиции кости в позе привязки
  const bn=this.b[bone];this.m.updateMatrixWorld(true);const bp=bn.getWorldPosition(new THREE.Vector3());
  p.position.copy(bp).add(new THREE.Vector3(...pos));p.rotation.set(...rot);p.scale.setScalar(sc);this.root.add(p);this.root.updateMatrixWorld(true);bn.attach(p);
  p.traverse(x=>{if(x.isMesh)x.material=x.material.clone()});(this.props??={})[name]=p;return p}
 set(room,x,y,yaw){this.root.position.copy(W(room,x,y));this.room=room;this.yaw=this.tyaw=yaw;this.root.rotation.y=yaw}
 face(room,x,y){const p=W(room,x,y).sub(this.root.position);this.tyaw=Math.atan2(p.x,p.z)}
 play(n,fade=.35,then){const a=this.A[n];if(!a)return console.warn('no clip',n);if(this.cur===n&&!then)return;const old=this.cur&&this.A[this.cur];a.reset();a.setEffectiveTimeScale(1);a.setEffectiveWeight(1);a.fadeIn(fade).play();if(old&&old!==a)old.fadeOut(fade);this.cur=n;
  if(then){const d=a.getClip().duration;this.after={t:d-.25,f:then}}else this.after=null}
 sitDown(then){this.play('Sitting_Enter',.25,()=>{this.play('Sitting_Idle_Loop',.3);then&&then(this)})}
 standUp(then){this.play('Sitting_Exit',.25,()=>{this.play('Idle_Loop',.3);then&&then(this)})}
 mop(room,a,b){this.mopS=this.mopS||{w:this.walkName,s:this.speed};this.speed=.28;this.path=[W(room,...b),W(room,...a)];this.then=c=>c.mop(room,a,b);this.play(this.walkName,.3)}
 walkTo(room,pts,then){if(this.mopS){this.walkName=this.mopS.w;this.speed=this.mopS.s;this.mopS=null}this.path=pts.map(p=>W(room,p[0],p[1]));this.then=then;this.play(this.walkName,.3)}
 setLayer(n,on){this.layer[n]=on?1:0;this.lw[n]??=0}
 update(dt){const r=this.root;this.t+=dt;
  if(this.after){this.after.t-=dt;if(this.after.t<=0){const f=this.after.f;this.after=null;f()}}
  if(this.path.length){const t=this.path[0],d=t.clone().sub(r.position);d.y=0;const dist=d.length();let left=dist;for(let i=1;i<this.path.length;i++)left+=this.path[i].distanceTo(this.path[i-1]);
   const want=Math.min(this.speed,Math.max(.3,left*1.5));this.v+=(want-this.v)*Math.min(1,dt*4);
   if(dist<.05){this.path.shift();if(!this.path.length){this.v=0;const f=this.then;this.then=null;if(!this.mopS)this.play('Idle_Loop',.3);f&&f(this)}}
   else{this.tyaw=Math.atan2(d.x,d.z);const turn=Math.abs(angd(this.tyaw,this.yaw));const k=turn>1.0?.3:1;r.position.addScaledVector(d.normalize(),Math.min(dist,this.v*k*dt))}
   }
  if(this.cur===this.walkName){const sp=r.position.distanceTo(this.prevP)/Math.max(dt,1e-4);this.A[this.walkName].setEffectiveTimeScale(THREE.MathUtils.clamp(sp/(this.strideOf(this.walkName)*(this.sk||window.__SK||1)),.25,2.2))}
  this.prevP.copy(r.position);
  this.yaw+=angd(this.tyaw,this.yaw)*Math.min(1,dt*6);r.rotation.y=this.yaw;
  this.mix.update(dt);this.m.updateMatrixWorld(true);
  for(const n in this.layer){this.lw[n]+=(this.layer[n]-this.lw[n])*Math.min(1,dt*3)}
  const fw=_v2.set(Math.sin(this.yaw),0,Math.cos(this.yaw)).clone(),rt=new THREE.Vector3().crossVectors(UP,fw);  // rt = левая сторона персонажа
  const b=this.b,t=this.t;
  // --- процедурное «письмо»: правая рука вперёд-вниз к столу + мелкие движения кисти
  if(this.soft){rotWorld(b.Head,rt,-this.soft*.2);rotWorld(b.clavicle_l,fw,-.08);rotWorld(b.clavicle_r,fw,.08);rotWorld(b.spine_03,rt,-.05)}
  const wr=this.lw.write||0;if(wr>.01){rotWorld(b.upperarm_r,rt,-.55*wr);rotWorld(b.upperarm_r,UP,.35*wr);rotWorld(b.lowerarm_r,rt,-.75*wr);
   rotWorld(b.hand_r,rt,(.25+.12*Math.sin(t*9))*wr);rotWorld(b.hand_r,UP,.18*Math.sin(t*3.1)*wr);rotWorld(b.spine_03,rt,-.12*wr);rotWorld(b.Head,rt,-.25*wr)}
  // --- осмотр стетоскопом: правая рука вперёд на уровень груди, лёгкие перемещения; голова наклонена
  const ex=this.lw.exam||0;if(ex>.01){const s=Math.sin(t*.9),c=Math.cos(t*.7);rotWorld(b.upperarm_r,rt,-(1.05+.08*s)*ex);rotWorld(b.upperarm_r,UP,(.35+.1*c)*ex);rotWorld(b.lowerarm_r,rt,-.55*ex);rotWorld(b.lowerarm_r,UP,.4*ex);
   rotWorld(b.spine_02,rt,-.18*ex);rotWorld(b.Head,rt,-.2*ex)}
  // --- телефон у уха (регистратор)
  const ph=this.lw.phone||0;if(ph>.01){rotWorld(b.upperarm_r,rt,-.7*ph);rotWorld(b.upperarm_r,fw,.9*ph);rotWorld(b.lowerarm_r,rt,-2.2*ph);rotWorld(b.Head,fw,.18*ph)}
  // --- гитара: левая рука на гриф, правая бьёт по струнам
  const gt=this.lw.guitar||0;if(gt>.01&&this.props&&this.props.guitar){const G=this.props.guitar;G.updateMatrixWorld(true);
   const L=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw)),F=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw));
   const play=this.gplay??1,st=Math.sin(t*11)*play;
   const tl=G.localToWorld(new THREE.Vector3(.0,-.04,-.27-.03*Math.sin(t*1.3)*play)),tr=G.localToWorld(new THREE.Vector3(.015*st,.07,.2-.035*st));
   const pl=L.clone().multiplyScalar(.6).add(new THREE.Vector3(0,-1,0)).addScaledVector(F,-.3),pr=L.clone().multiplyScalar(-.8).add(new THREE.Vector3(0,-.4,0)).addScaledVector(F,-.5);
   ik2(b.upperarm_l,b.lowerarm_l,b.hand_l,tl,pl,gt);ik2(b.upperarm_r,b.lowerarm_r,b.hand_r,tr,pr,gt);
   // кисть: левая ладонью к грифу, правая — вниз к струнам
   const gz=new THREE.Vector3(0,0,1).transformDirection(G.matrixWorld),gn=new THREE.Vector3(0,1,0).transformDirection(G.matrixWorld);
   aimB(b.hand_l,b.middle_01_l,G.localToWorld(new THREE.Vector3(0,.0,-.32)),gt);aimB(b.hand_r,b.middle_01_r,G.localToWorld(new THREE.Vector3(0,.03,.17-.02*st)),gt*.8);
   rotWorld(b.Head,fw,.08*Math.sin(t*2.2)*gt*play)}
  // --- взгляд: голова/шея доворачиваются к цели (мировые оси)
  let ty=0,tp=0;if(this.look){const w=this.look.root?this.look.b.Head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.12,0)):this.look.clone();const h=b.Head.getWorldPosition(new THREE.Vector3());
   const d=w.sub(h);ty=THREE.MathUtils.clamp(angd(Math.atan2(d.x,d.z),this.yaw),-1.1,1.1);tp=THREE.MathUtils.clamp(Math.atan2(d.y,Math.hypot(d.x,d.z)),-.5,.4)}
  this.hy+=(ty-this.hy)*Math.min(1,dt*4);this.hp+=(tp-this.hp)*Math.min(1,dt*4);
  rotWorld(b.neck_01,UP,this.hy*.35);rotWorld(b.Head,UP,this.hy*.6);rotWorld(b.Head,rt,-this.hp*.7);
  if(LEGFIX)this.legs(dt);
  // --- v32: швабра — головка на полу, обе руки на черенке, плавные мазки вперёд-назад/в стороны
  if(this.props&&this.props.mop){const G=this.props.mop;this.mopA=(this.mopA||0)+((this.mopS?1:0)-(this.mopA||0))*Math.min(1,dt*3);const a=this.mopA;
   this.m.updateMatrixWorld(true);const R=this.root.position,F=this.fwd(),L=new THREE.Vector3(F.z,0,-F.x),ph=t*2.4;
   const Hb=R.clone().addScaledVector(F,.55+.15*a+.1*a*Math.cos(ph)).addScaledVector(L,-.18+.06*a+.22*a*Math.sin(ph));Hb.y=R.y+.004;
   const Tp=R.clone().addScaledVector(F,.16).addScaledVector(L,-.05);Tp.y=R.y+1.02*this.p0/.95;
   {const Hi=R.clone().addScaledVector(F,.14).addScaledVector(L,-.34);Hi.y=R.y+.004;const Ti=Hi.clone().addScaledVector(F,-.04);Ti.y+=1.2;Hb.lerp(Hi,1-a);Tp.lerp(Ti,1-a)}const dir=Tp.sub(Hb).normalize();
   setWorld(G,Hb.clone().addScaledVector(dir,1.378*.8),new THREE.Quaternion().setFromUnitVectors(UP,dir));G.updateMatrixWorld(true);
   const gl=G.localToWorld(new THREE.Vector3(0,.2,0)),gr=G.localToWorld(new THREE.Vector3(0,-.38,0));
   ik2(b.upperarm_l,b.lowerarm_l,b.hand_l,gl.addScaledVector(F,-.03),L.clone().multiplyScalar(.5).add(new THREE.Vector3(0,-1,0)).addScaledVector(F,-.4),a);
   ik2(b.upperarm_r,b.lowerarm_r,b.hand_r,gr.addScaledVector(F,-.03),L.clone().multiplyScalar(-.8).add(new THREE.Vector3(0,-1,0)).addScaledVector(F,-.2),1);
   rotWorld(b.spine_02,L,.12*a)}
  // --- v32: медсестра держит шприц спокойно — рука опущена у бедра, игла вниз
  if(this.props&&this.props.syringe){const S=this.props.syringe,F=this.fwd(),L=new THREE.Vector3(F.z,0,-F.x);this.m.updateMatrixWorld(true);
   const pv=b.pelvis.getWorldPosition(new THREE.Vector3());const tg=pv.clone().addScaledVector(L,-.2).addScaledVector(F,.1);tg.y-=.06;
   ik2(b.upperarm_r,b.lowerarm_r,b.hand_r,tg,L.clone().multiplyScalar(-.7).addScaledVector(F,-.6),1);
   const hp=b.hand_r.getWorldPosition(new THREE.Vector3());const sd=new THREE.Vector3(0,1,0).addScaledVector(F,.18).normalize();
   setWorld(S,hp.addScaledVector(F,.03).addScaledVector(L,.02).addScaledVector(sd,.01),new THREE.Quaternion().setFromUnitVectors(UP,sd))}
  // --- лицо: моргание, улыбка, брови
  if(this.morph){this.blinkT-=dt;if(this.blinkT<0){this.blink=.16;this.blinkT=2+Math.random()*3.5}
   const bl=this.blink>0?Math.sin((1-this.blink/.16)*Math.PI):0;this.blink=Math.max(0,this.blink-dt);
   const M=(k,v)=>{const m=this.morph[k];if(m)m[0].morphTargetInfluences[m[1]]=v};M('blink',bl);
   this.smile+=(this.tsmile-this.smile)*Math.min(1,dt*3);this.brow+=(this.tbrow-this.brow)*Math.min(1,dt*3);
   M('smile',Math.max(this.smile,this.bs||0));M('raise',Math.min(1,Math.max(0,this.brow)+(this.bb||0)));M('frown',Math.max(0,-this.brow-(this.bb||0)*2))}
  this.shadow.position.x=0}}
const SHM=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false,map:(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})(),alphaMap:null});
SHM.map=null;SHM.alphaMap=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.6,'#888');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
// ---------- актёры ----------
const doc=new Char('doctor');doc.noOff=1;doc.lockMax=.14;doc.seatM=.11;const pa=new Char('patient_a',{head:1.32});const nur=new Char('nurse');
const rec=new Char('receptionist');const mum=new Char('mummy',{walk:'Walk_Formal_Loop',speed:.6});const inv=new Char('invisible');const ord=new Char('orderly');
const psy=new Char('doctor');const rock=new Char('rocker');rock.seatM=.25;rock.lockMax=.14;rock.sk=.95;const big=new Char('bighead',{head:2.0});const nur2=new Char('nurse');
// пропсы (позиции в позе привязки: T-поза, руки в стороны; +X = левая рука персонажа)
const HT=c=>(1.81-c.b.Head.getWorldPosition(new THREE.Vector3()).y);
doc.attach('clipboard','hand_l',[.06,-.06,.04],[Math.PI/2,0,Math.PI/2]);
psy.attach('clipboard','hand_l',[.06,-.06,.04],[Math.PI/2,0,Math.PI/2]);psy.attach('glasses','Head',[0,.105*psy.hs,.115*psy.hs],[0,Math.PI,0],psy.hs);
function niceFace(c){const H=c.b.Head;c.m.updateMatrixWorld(true);const pv=new THREE.Vector3();
 const per=(x,f)=>{x.geometry=x.geometry.clone();const g=x.geometry,P=g.attributes.position,S={l:[0,0,0,0],r:[0,0,0,0]};
  for(let i=0;i<P.count;i++){const s=P.getX(i)>0?S.l:S.r;s[0]+=P.getX(i);s[1]+=P.getY(i);s[2]+=P.getZ(i);s[3]++}
  for(let i=0;i<P.count;i++){const s=P.getX(i)>0?S.l:S.r,n=s[3]||1;const[a,b2,cz]=f(P.getX(i)-s[0]/n,P.getY(i)-s[1]/n,P.getZ(i)-s[2]/n);P.setXYZ(i,s[0]/n+a,s[1]/n+b2,s[2]/n+cz)}
  P.needsUpdate=true;g.computeBoundingSphere();return S};
 c.root.traverse(x=>{if(!x.isMesh)return;
  if(x.name==='Eyebrows'){x.material=x.material.clone();x.material.color.set(0xb98a62)}
  if(x.name==='Eyes'||x.name==='Eyelids'){per(x,(a,b,z)=>[a*1.22,b*1.22,z*1.05])}
  if(x.name==='Superhero_Female'){x.material=x.material.clone();x.material.color.set(0xfff4ec);x.material.roughness=.85}
  if(x.name==='Hair_Buns'){x.material=x.material.clone();x.material.color.set(0xc49a72)}});
 // блики в глазах
 c.root.traverse(x=>{if(x.name!=='Eyes')return;const P=x.geometry.attributes.position;const S={l:[],r:[]};
  for(let i=0;i<P.count;i++){x.getVertexPosition(i,pv);pv.applyMatrix4(x.matrixWorld);(P.getX(i)>0?S.l:S.r).push(pv.clone())}
  for(const k of['l','r']){const a=S[k];if(!a.length)continue;const ctr=a.reduce((s,v)=>s.add(v),new THREE.Vector3()).multiplyScalar(1/a.length);
   const fw=c.fwd();let best=a[0];for(const v of a)if(v.clone().sub(ctr).dot(fw)>best.clone().sub(ctr).dot(fw))best=v;
   const r=ctr.distanceTo(best);const sp=new THREE.Mesh(new THREE.SphereGeometry(r*.28,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));
   sp.position.copy(best).addScaledVector(fw,r*.35).add(new THREE.Vector3(0,r*.3,0));c.root.add(sp);c.root.updateMatrixWorld(true);H.attach(sp)}})}

niceFace(nur);niceFace(nur2);nur.soft=nur2.soft=1;nur.bs=nur2.bs=1.2;for(const c of[nur,nur2])c.root.traverse(x=>{if(x.isMesh&&/brow/i.test(x.name)){x.material=x.material.clone();x.material.color.multiplyScalar(1).lerp(new THREE.Color(0x9a6a48),.55);x.scale.multiplyScalar(1)}});nur.bb=nur2.bb=1;nur.attach('syringe','hand_r',[-.06,-.03,.05],[0,0,Math.PI/2],.3);nur.attach('nurse_cap','Head',[0,.24*nur.hs,-.01],[0,0,0],nur.hs);nur2.attach('nurse_cap','Head',[0,.24*nur2.hs,-.01],[0,0,0],nur2.hs);
ord.attach('mop','hand_r',[-.05,-.02,.04],[0,0,0],.8);ord.root.attach(ord.props.mop);ord.attach('orderly_cap','Head',[0,.2*ord.hs,0],[0,Math.PI,0],ord.hs);
rec.attach('glasses','Head',[0,.095*rec.hs,.105*rec.hs],[0,Math.PI,0],rec.hs);rec.attach('phone','hand_r',[-.06,-.02,.04],[0,0,Math.PI/2]);
inv.attach('hat','Head',[0,.215*inv.hs,0],[0,0,0],inv.hs);inv.attach('glasses','Head',[0,.105*inv.hs,.115*inv.hs],[0,Math.PI,0],inv.hs);
{const Z=new THREE.Vector3(-.8,-.55,.0).normalize(),Y=new THREE.Vector3(0,.1,1).normalize(),X=new THREE.Vector3().crossVectors(Y,Z).normalize();Y.crossVectors(Z,X);const e=new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Z));
 const c=new THREE.Vector3(-.09,-.09,.21),o=c.clone().addScaledVector(Z,-.3);rock.m.updateMatrixWorld(true);o.add(rock.b.spine_01.getWorldPosition(new THREE.Vector3()).sub(rock.b.spine_02.getWorldPosition(new THREE.Vector3())));rock.attach('guitar','spine_02',o.toArray(),[e.x,e.y,e.z]);rock.gZ=Z;
 rock.m.updateMatrixWorld(true);const G=rock.props.guitar,B=rock.b,wp=x=>x.getWorldPosition(new THREE.Vector3()),U=new THREE.Vector3(0,1,0);
 const yw=rock.root.rotation.y,Fw=new THREE.Vector3(Math.sin(yw),0,Math.cos(yw)),Lw=new THREE.Vector3(Math.cos(yw),0,-Math.sin(yw));
 const sh=wp(B.upperarm_l).lerp(wp(B.clavicle_l),.35),s3=wp(B.spine_03),s1=wp(B.spine_01);
 const pts=[G.localToWorld(new THREE.Vector3(0,-.02,.08)),G.localToWorld(new THREE.Vector3(0,-.02,.08)).lerp(sh,.45).addScaledVector(Fw,.035),
  sh.clone().addScaledVector(U,.075).addScaledVector(Fw,.025),sh.clone().addScaledVector(U,.08).addScaledVector(Fw,-.06),
  s3.clone().addScaledVector(Fw,-.15).addScaledVector(Lw,.02),s1.clone().addScaledVector(Fw,-.12).addScaledVector(Lw,-.12),
  s1.clone().addScaledVector(Fw,.02).addScaledVector(Lw,-.2).addScaledVector(U,-.04),G.localToWorld(new THREE.Vector3(0,-.02,.47))];
 const sg=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),64,.012,6,false);sg.scale(1,1,1);
 const st=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({color:0x1a1210,roughness:.75}));st.castShadow=true;st.name='strap';
 const iv=new THREE.Matrix4().copy(rock.root.matrixWorld).invert();sg.applyMatrix4(iv);rock.root.add(st);rock.root.updateMatrixWorld(true);B.spine_03.attach(st);}(()=>{let g=null;rock.root.traverse(o=>{if(/guitar/i.test(o.name)&&!g)g=o});return g||rock.b.hand_l})().traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh){const f=m=>{m=m.clone();m.map=null;m.vertexColors=false;m.color=new THREE.Color(.28,.04,.03);if(m.emissive)m.emissive.setRGB(0,0,0);m.metalness=0;return m};o.material=Array.isArray(o.material)?o.material.map(f):f(o.material)}});
// ---------- сценарий (детерминированный, цикл 40 с) ----------
let T=0,ev=[];const at=(t,f)=>ev.push({t,f,done:false});
function reset(){T=0;ev=[];for(const c of chars){c.path=[];c.look=null;for(const k in c.layer){c.layer[k]=0;c.lw[k]=0}c.tsmile=0;c.tbrow=0}
 // GP: врач пишет, входит пациент, разговор, осмотр стетоскопом, пациент уходит
 doc.set('room_gp',-1.2,1.62,0);doc.play('Sitting_Idle_Loop',0);doc.setLayer('write',1);
 pa.set('room_gp',3.2,-1.2,-Math.PI/2);pa.play('Idle_Loop',0);
 nur.set('room_gp',1.7,1.5,0);nur.play('Idle_Loop',0);
 at(.2,()=>pa.walkTo('room_gp',[[1.2,-1.0],[-.4,-.4],[-1.2,-.25]],c=>{c.face('room_gp',-1.2,2);c.look=doc}));
 at(3.2,()=>{doc.setLayer('write',0);doc.look=pa;doc.tbrow=.6;doc.tsmile=.6});
 at(5.0,()=>{pa.tyaw=Math.PI;pa.yaw=Math.PI;pa.sitDown();pa.anchor={a:W('room_gp',-1.2,-.25),b:W('room_gp',-1.2,.1),d:.9,t:0}});
 at(6.5,()=>{doc.play('Sitting_Talking_Loop',.4);doc.tbrow=0;pa.tsmile=0;pa.tbrow=-.6});
 at(7.0,()=>nur.walkTo('room_gp',[[1.4,.6],[.5,-.3]],c=>{c.look=pa;c.tsmile=.7}));
 at(11.5,()=>{doc.standUp(()=>doc.walkTo('room_gp',[[-.5,1.3],[-.55,.35]],c=>{c.face('room_gp',-1.2,.1);c.look=pa;c.setLayer('exam',1)}))});
 at(12,()=>{pa.play('Sitting_Talking_Loop',.4)});
 at(18.5,()=>{doc.setLayer('exam',0);doc.tsmile=.8;pa.tsmile=.8;pa.tbrow=.4;pa.play('Sitting_Idle_Loop',.4)});
 at(19.5,()=>doc.walkTo('room_gp',[[-.4,1.3],[-1.2,1.62]],c=>{c.tyaw=0;c.sitDown(()=>c.setLayer('write',1))}));
 at(20.5,()=>nur.walkTo('room_gp',[[1.4,.8],[1.7,1.5]],c=>{c.face('room_gp',2.1,2.3);c.look=null;c.play('Interact',.3,()=>c.play('Idle_Loop'))}));
 at(24.5,()=>{pa.standUp();pa.anchor={a:W('room_gp',-1.2,.1),b:W('room_gp',-1.2,-.25),d:.9,t:0}});
 at(26.2,()=>{pa.look=null;pa.walkTo('room_gp',[[-.4,-.4],[1.2,-1.0],[3.2,-1.2]],c=>{})});
 at(26,()=>{doc.look=pa});at(29,()=>{doc.look=null;doc.tsmile=0});
 // Регистратура
 rec.set('room_rec',-2.05,.7,-.4);rec.play('Sitting_Talking_Loop',0);rec.setLayer('phone',1);rec.tsmile=.7;
 mum.set('room_rec',.1,-.4,2.6);mum.play('Idle_Loop',0);inv.set('room_rec',.9,-1.2,2.45);inv.play('Idle_Loop',0);
 ord.set('room_rec',1.6,-1.8,0);ord.mop('room_rec',[1.6,-1.8],[.8,-1.8]);
 at(2,()=>{mum.look=rec});at(4,()=>{inv.look=mum});
 at(9,()=>{rec.setLayer('phone',0);rec.look=mum;rec.tbrow=.8});at(10,()=>{mum.play('Idle_Talking_Loop',.4)});
 at(16,()=>{mum.play('Idle_Loop',.4);mum.walkTo('room_rec',[[.9,.6],[1.6,.2]],c=>{c.face('room_rec',2.1,.1);c.tyaw+=0})});
 at(17,()=>{rec.look=inv;rec.tbrow=1;inv.walkTo('room_rec',[[.15,-.35]],c=>{c.face('room_rec',-1.4,.4);c.play('Idle_Talking_Loop',.4)})});
 at(25,()=>{rec.setLayer('phone',1);rec.look=null;rec.tbrow=0;inv.play('Idle_Loop',.4)});
 at(.1,()=>ord.walkTo('room_rec',[[1.6,-.4]],c=>c.mop('room_rec',[1.6,-.4],[.9,-.4])));at(8,()=>ord.walkTo('room_rec',[[.0,-1.9]],c=>c.mop('room_rec',[0,-1.9],[-.9,-1.9])));
 at(18,()=>ord.walkTo('room_rec',[[1.6,-1.8]],c=>{c.face('room_rec',0,0);c.play('Idle_Loop',.3);c.look=inv}));
 // Психиатр
 psy.set('room_psy',-1.3,.15,Math.PI/2);psy.play('Sitting_Idle_Loop',0);psy.setLayer('write',.6);psy.look=rock;
 rock.set('room_psy',.55,1.3,0);rock.play('Sitting_Idle_Loop',0);rock.setLayer('guitar',1);rock.tsmile=1;
 at(6,()=>{psy.setLayer('write',0);psy.play('Sitting_Talking_Loop',.4);rock.gplay=0;rock.play('Sitting_Talking_Loop',.4);rock.look=psy});
 at(14,()=>{psy.play('Sitting_Idle_Loop',.4);psy.setLayer('write',.6);rock.gplay=1;rock.play('Sitting_Idle_Loop',.4);rock.look=null});
 at(24,()=>{rock.gplay=.3;rock.standUp(()=>rock.walkTo('room_psy',[[.55,.7]],c=>{c.face('room_psy',-1.3,.2);c.gplay=1;c.play('Dance_Loop',.4)}))});
 at(31,()=>{rock.walkTo('room_psy',[[.55,1.3]],c=>{c.tyaw=0;c.after={t:.5,f:()=>c.sitDown(()=>c.setLayer('guitar',1))}})});
 // Сдувание голов
 big.set('room_def',1.0,.2,0);big.play('Sitting_Idle_Loop',0);big.tbrow=.8;
 nur2.set('room_def',.3,1.3,0);nur2.play('Idle_Loop',0);
 at(3,()=>{nur2.play('Interact',.3,()=>nur2.play('Idle_Loop',.3))});at(8,()=>{nur2.look=big;nur2.walkTo('room_def',[[.9,1.1]],c=>{c.face('room_def',1,.2);c.play('Idle_Talking_Loop',.3)})});
 at(15,()=>{nur2.walkTo('room_def',[[.3,1.3]],c=>{c.face('room_def',.3,2);c.look=null;c.play('Interact',.3,()=>c.play('Idle_Loop',.3))})});
}
const DEF0=2.0;
function step(dt){T+=dt;for(const e of ev)if(!e.done&&T>=e.t){e.done=true;e.f()}
 if(pa.anchor){const A=pa.anchor;A.t+=dt;const k=Math.min(1,A.t/A.d),e=k*k*(3-2*k);pa.root.position.lerpVectors(A.a,A.b,e);if(k>=1)pa.anchor=null}
 // голова пациента «сдувается» и снова надувается (пульсирует с машиной)
 const k=.5+.5*Math.cos(T*2*Math.PI/20);big.hs=1.35+(DEF0-1.35)*k+.03*Math.sin(T*7);big.b.Head.scale.setScalar(big.hs);big.tsmile=1-k;big.tbrow=k*.9;
 for(const c of chars)c.update(dt);if(T>40)reset()}
reset();
// ---------- тур камеры (для видео) ----------
const SHOTS={all:[0,.8,0,1],gp:[-5.6,.8,0,2.3],rec:[0,.8,-5.6,2.3],psy:[0,.8,5.6,2.3],def:[5.6,.8,0,2.3]};
const TOUR=[['all',0,6],['gp',6,16],['rec',16,22],['psy',22,28],['def',28,34],['all',34,40]];
function tour(){if(userCam||!Q.has('tour'))return;let s=TOUR.find(x=>T>=x[1]&&T<x[2])||TOUR[0];const S=SHOTS[s[0]];const k=Math.min(1,(T-s[1])/1.2),e=k*k*(3-2*k);
 TGT.lerp(new THREE.Vector3(S[0],S[1],S[2]),Q.has('cap')?.08:.06);ZM+=(S[3]-ZM)*(Q.has('cap')?.08:.06);AZ=Math.PI/4+.12*Math.sin(T*.15);place();
 document.getElementById('lbl').textContent={all:'',gp:'Кабинет терапевта',rec:'Регистратура',psy:'Кабинет психиатра',def:'Палата сдувания голов'}[s[0]]}
if(Q.has('shot')){const S=SHOTS[Q.get('shot')];TGT.set(S[0],S[1],S[2]);ZM=S[3];place()}
// ---------- цикл + метрики ----------
const hud=document.getElementById('hud');let last=performance.now(),acc=0,fr=0,cpu=0,ft=[];window.__stats={frames:[],cpu:[]};
const draw=()=>composer?composer.render():renderer.render(scene,cam);
window.__manual=Q.has('cap');window.__step=(dt,n=1)=>{for(let i=0;i<n;i++){step(dt);tour()}draw()};window.__T=()=>T;window.__info=()=>renderer.info.render;
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(window.__manual)return;
 const c0=performance.now();step(dt);tour();draw();const c1=performance.now();__stats.frames.push(dt*1000);__stats.cpu.push(c1-c0);
 const rt=now-(window.__pn||now);window.__pn=now;if(rt>0)ft.push(rt);acc+=rt;fr++;cpu+=c1-c0;
 if(acc>500){if(!Q.has('cap')&&!Q.has('fixdpr')){const f=1000*fr/acc;let nd=DPR;if(f<50&&DPR>DPRMIN)nd=Math.max(DPRMIN,DPR-.25);else if(f>58&&DPR<DPRMAX&&(window.__dprUp=(window.__dprUp||0)+1)>6){nd=Math.min(DPRMAX,DPR+.25);window.__dprUp=0}if(nd!==DPR){DPR=nd;renderer.setPixelRatio(DPR);composer&&composer.setPixelRatio(DPR);fit()}}const w=ft.slice(-600),avg=1000*w.length/w.reduce((a,b)=>a+b,0),worst=Math.max(...ft.slice(-fr));
  hud.textContent=`v35 · ${(1000*fr/acc).toFixed(0)} fps · ср(10с) ${avg.toFixed(0)} · худш.кадр ${worst.toFixed(0)}мс · JS ${(cpu/fr).toFixed(1)}мс · ${LOWQ?'ЛЁГКОЕ':'ПОЛНОЕ'} · calls ${renderer.info.render.calls} · dpr ${DPR} · t=${T.toFixed(0)}с`;acc=0;fr=0;cpu=0;if(ft.length>2000)ft=ft.slice(-600)}}
window.__tg=y=>{TGT.y=y;place();draw()};window.__C={doc,pa,nur,rec,mum,inv,ord,psy,rock,big,nur2};
window.__cam=(n,az,el,zm,dy=0)=>{userCam=1;const c=__C[n];const p=c.b.pelvis.getWorldPosition(new THREE.Vector3());TGT.set(p.x,p.y*.55+dy,p.z);CAMR=6;cam.near=window.__NEAR?6-window.__NEAR:cam.near;AZ=az;EL=el;ZM=zm;place();draw()};
requestAnimationFrame(loop);window.__ready=true;
window.__pen=n=>{const c=__C[n],B=c.b,r=[];const seg=(a,b)=>{const A=B[a].getWorldPosition(new THREE.Vector3()),Bp=B[b].getWorldPosition(new THREE.Vector3());const d=Bp.clone().sub(A);const L=d.length();RC.set(A,d.normalize());RC.far=L;const h=RC.intersectObjects(ROOMMESH,false);RC.set(Bp,d.clone().negate());const h2=RC.intersectObjects(ROOMMESH,false);return h.length+h2.length};
 for(const s of['l','r'])r.push(seg('thigh_'+s,'calf_'+s),seg('calf_'+s,'foot_'+s),seg('foot_'+s,'ball_'+s));return r};
window.__pend=n=>{const c=__C[n],B=c.b,out=[];const seg=(a,b)=>{const A=B[a].getWorldPosition(new THREE.Vector3()),Bp=B[b].getWorldPosition(new THREE.Vector3());const d=Bp.clone().sub(A);const L=d.length();RC.set(A,d.clone().normalize());RC.far=L;for(const h of RC.intersectObjects(ROOMMESH,false))out.push(a+'>'+b+' A'+A.toArray().map(v=>v.toFixed(2))+' B'+Bp.toArray().map(v=>v.toFixed(2))+' hit'+h.point.toArray().map(v=>v.toFixed(2))+' n'+h.face.normal.toArray().map(v=>v.toFixed(1)))};
 for(const s of['l','r']){seg('thigh_'+s,'calf_'+s);seg('calf_'+s,'foot_'+s);seg('foot_'+s,'ball_'+s)}return out.join('\n')+'\nseat '+c.seat+' F '+c.seatF+' B '+c.seatB+' so '+c.so+' fwd '+c.fwd().toArray()};
window.THREE=THREE;window.__PROPS=PROPS;
window.__step0=dt=>{step(dt);tour()};window.__draw0=()=>{draw();renderer.getContext().finish()};
