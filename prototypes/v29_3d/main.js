// v29: стилизованный мульт-3D (three.js r170). 4 комнаты-диорамы (запечённый свет, 1 материал-атлас), 11 персонажей
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
const renderer=new THREE.WebGLRenderer({antialias:LOWQ,powerPreference:'high-performance',preserveDrawingBuffer:Q.has('cap')});
renderer.setPixelRatio(Math.min(devicePixelRatio,LOWQ?1:2));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x27324a);
const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.45;
// ---------- камера (изометрия + орбита/пинч, как в v28) ----------
const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,200);const TGT=new THREE.Vector3(0,.8,0);
let AZ=Math.PI/4,EL=.58,ZM=1,BASEH=innerWidth<innerHeight?9.5:7.6;
function fit(){const a=innerWidth/innerHeight,h=BASEH;cam.left=-h*a;cam.right=h*a;cam.top=h;cam.bottom=-h;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer&&composer.setSize(innerWidth,innerHeight)}
function place(){const r=40;cam.position.set(TGT.x+r*Math.cos(EL)*Math.sin(AZ),TGT.y+r*Math.sin(EL),TGT.z+r*Math.cos(EL)*Math.cos(AZ));cam.lookAt(TGT);cam.zoom=ZM;cam.updateProjectionMatrix()}
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
scene.add(roomG.scene);
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
const UP=new THREE.Vector3(0,1,0);
const chars=[];
class Char{constructor(role,o={}){const g=G[role];this.role=role;this.root=new THREE.Group();this.m=skClone(g.scene);this.root.add(this.m);scene.add(this.root);
  this.b={};this.meshes=[];this.m.traverse(x=>{if(x.isBone)this.b[x.name]=x;if(x.isMesh)this.meshes.push(x)});
  this.hs=o.head||1.3;this.b.Head.scale.setScalar(this.hs);for(const h of['hand_l','hand_r'])this.b[h].scale.setScalar(1.22);
  for(const f of['foot_l','foot_r'])this.b[f].scale.setScalar(1.1);
  this.m.updateMatrixWorld(true);
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
 walkTo(room,pts,then){this.path=pts.map(p=>W(room,p[0],p[1]));this.then=then;this.play(this.walkName,.3)}
 setLayer(n,on){this.layer[n]=on?1:0;this.lw[n]??=0}
 update(dt){const r=this.root;this.t+=dt;
  if(this.after){this.after.t-=dt;if(this.after.t<=0){const f=this.after.f;this.after=null;f()}}
  if(this.path.length){const t=this.path[0],d=t.clone().sub(r.position);d.y=0;const dist=d.length();let left=dist;for(let i=1;i<this.path.length;i++)left+=this.path[i].distanceTo(this.path[i-1]);
   const want=Math.min(this.speed,Math.max(.3,left*1.5));this.v+=(want-this.v)*Math.min(1,dt*4);
   if(dist<.05){this.path.shift();if(!this.path.length){this.v=0;const f=this.then;this.then=null;this.play('Idle_Loop',.3);f&&f(this)}}
   else{this.tyaw=Math.atan2(d.x,d.z);const turn=Math.abs(angd(this.tyaw,this.yaw));const k=turn>1.0?.3:1;r.position.addScaledVector(d.normalize(),Math.min(dist,this.v*k*dt))}
   this.A[this.walkName].setEffectiveTimeScale(Math.max(.45,this.v/1.0))}
  this.yaw+=angd(this.tyaw,this.yaw)*Math.min(1,dt*6);r.rotation.y=this.yaw;
  this.mix.update(dt);this.m.updateMatrixWorld(true);
  for(const n in this.layer){this.lw[n]+=(this.layer[n]-this.lw[n])*Math.min(1,dt*3)}
  const fw=_v2.set(Math.sin(this.yaw),0,Math.cos(this.yaw)).clone(),rt=new THREE.Vector3().crossVectors(UP,fw);  // rt = левая сторона персонажа
  const b=this.b,t=this.t;
  // --- процедурное «письмо»: правая рука вперёд-вниз к столу + мелкие движения кисти
  const wr=this.lw.write||0;if(wr>.01){rotWorld(b.upperarm_r,rt,-.55*wr);rotWorld(b.upperarm_r,UP,.35*wr);rotWorld(b.lowerarm_r,rt,-.75*wr);
   rotWorld(b.hand_r,rt,(.25+.12*Math.sin(t*9))*wr);rotWorld(b.hand_r,UP,.18*Math.sin(t*3.1)*wr);rotWorld(b.spine_03,rt,-.12*wr);rotWorld(b.Head,rt,-.25*wr)}
  // --- осмотр стетоскопом: правая рука вперёд на уровень груди, лёгкие перемещения; голова наклонена
  const ex=this.lw.exam||0;if(ex>.01){const s=Math.sin(t*.9),c=Math.cos(t*.7);rotWorld(b.upperarm_r,rt,-(1.05+.08*s)*ex);rotWorld(b.upperarm_r,UP,(.35+.1*c)*ex);rotWorld(b.lowerarm_r,rt,-.55*ex);rotWorld(b.lowerarm_r,UP,.4*ex);
   rotWorld(b.spine_02,rt,-.18*ex);rotWorld(b.Head,rt,-.2*ex)}
  // --- телефон у уха (регистратор)
  const ph=this.lw.phone||0;if(ph>.01){rotWorld(b.upperarm_r,rt,-.7*ph);rotWorld(b.upperarm_r,fw,.9*ph);rotWorld(b.lowerarm_r,rt,-2.2*ph);rotWorld(b.Head,fw,.18*ph)}
  // --- гитара: левая рука на гриф, правая бьёт по струнам
  const gt=this.lw.guitar||0;if(gt>.01){rotWorld(b.upperarm_l,rt,-.8*gt);rotWorld(b.upperarm_l,UP,-.5*gt);rotWorld(b.lowerarm_l,UP,-1.1*gt);
   rotWorld(b.upperarm_r,rt,-.45*gt);rotWorld(b.upperarm_r,UP,.7*gt);rotWorld(b.lowerarm_r,UP,(.9+.25*Math.sin(t*11))*gt);rotWorld(b.Head,fw,.12*Math.sin(t*2.2)*gt)}
  // --- взгляд: голова/шея доворачиваются к цели (мировые оси)
  let ty=0,tp=0;if(this.look){const w=this.look.root?this.look.b.Head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0,.12,0)):this.look.clone();const h=b.Head.getWorldPosition(new THREE.Vector3());
   const d=w.sub(h);ty=THREE.MathUtils.clamp(angd(Math.atan2(d.x,d.z),this.yaw),-1.1,1.1);tp=THREE.MathUtils.clamp(Math.atan2(d.y,Math.hypot(d.x,d.z)),-.5,.4)}
  this.hy+=(ty-this.hy)*Math.min(1,dt*4);this.hp+=(tp-this.hp)*Math.min(1,dt*4);
  rotWorld(b.neck_01,UP,this.hy*.35);rotWorld(b.Head,UP,this.hy*.6);rotWorld(b.Head,rt,-this.hp*.7);
  // --- лицо: моргание, улыбка, брови
  if(this.morph){this.blinkT-=dt;if(this.blinkT<0){this.blink=.16;this.blinkT=2+Math.random()*3.5}
   const bl=this.blink>0?Math.sin((1-this.blink/.16)*Math.PI):0;this.blink=Math.max(0,this.blink-dt);
   const M=(k,v)=>{const m=this.morph[k];if(m)m[0].morphTargetInfluences[m[1]]=v};M('blink',bl);
   this.smile+=(this.tsmile-this.smile)*Math.min(1,dt*3);this.brow+=(this.tbrow-this.brow)*Math.min(1,dt*3);
   M('smile',this.smile);M('raise',Math.max(0,this.brow));M('frown',Math.max(0,-this.brow))}
  this.shadow.position.x=0}}
const SHM=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.28,depthWrite:false,map:(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})(),alphaMap:null});
SHM.map=null;SHM.alphaMap=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,32);g.addColorStop(0,'#fff');g.addColorStop(.6,'#888');g.addColorStop(1,'#000');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
// ---------- актёры ----------
const doc=new Char('doctor');const pa=new Char('patient_a',{head:1.32});const nur=new Char('nurse');
const rec=new Char('receptionist');const mum=new Char('mummy',{walk:'Walk_Formal_Loop',speed:.6});const inv=new Char('invisible');const ord=new Char('orderly');
const psy=new Char('doctor');const rock=new Char('rocker');const big=new Char('bighead',{head:2.0});const nur2=new Char('nurse');
// пропсы (позиции в позе привязки: T-поза, руки в стороны; +X = левая рука персонажа)
const HT=c=>(1.81-c.b.Head.getWorldPosition(new THREE.Vector3()).y);
doc.attach('clipboard','hand_l',[.06,-.06,.04],[Math.PI/2,0,Math.PI/2]);
psy.attach('clipboard','hand_l',[.06,-.06,.04],[Math.PI/2,0,Math.PI/2]);psy.attach('glasses','Head',[0,.105*psy.hs,.115*psy.hs],[0,Math.PI,0],psy.hs);
nur.attach('syringe','hand_r',[-.06,-.03,.05],[0,0,Math.PI/2],.75);nur.attach('nurse_cap','Head',[0,.24*nur.hs,-.01],[0,0,0],nur.hs);nur2.attach('nurse_cap','Head',[0,.24*nur2.hs,-.01],[0,0,0],nur2.hs);
ord.attach('mop','hand_r',[-.05,-.02,.04],[0,0,0]);ord.attach('orderly_cap','Head',[0,.2*ord.hs,0],[0,Math.PI,0],ord.hs);
rec.attach('glasses','Head',[0,.095*rec.hs,.105*rec.hs],[0,Math.PI,0],rec.hs);rec.attach('phone','hand_r',[-.06,-.02,.04],[0,0,Math.PI/2]);
inv.attach('hat','Head',[0,.215*inv.hs,0],[0,0,0],inv.hs);inv.attach('glasses','Head',[0,.105*inv.hs,.115*inv.hs],[0,Math.PI,0],inv.hs);
rock.attach('guitar','hand_l',[-.25,-.05,.15],[0,0,Math.PI/2]);
// ---------- сценарий (детерминированный, цикл 40 с) ----------
let T=0,ev=[];const at=(t,f)=>ev.push({t,f,done:false});
function reset(){T=0;ev=[];for(const c of chars){c.path=[];c.look=null;for(const k in c.layer){c.layer[k]=0;c.lw[k]=0}c.tsmile=0;c.tbrow=0}
 // GP: врач пишет, входит пациент, разговор, осмотр стетоскопом, пациент уходит
 doc.set('room_gp',-1.2,1.62,Math.PI);doc.play('Sitting_Idle_Loop',0);doc.setLayer('write',1);
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
 at(19.5,()=>doc.walkTo('room_gp',[[-.4,1.3],[-1.2,1.62]],c=>{c.tyaw=Math.PI;c.sitDown(()=>c.setLayer('write',1))}));
 at(20.5,()=>nur.walkTo('room_gp',[[1.4,.8],[1.7,1.5]],c=>{c.face('room_gp',2.1,2.3);c.look=null;c.play('Interact',.3,()=>c.play('Idle_Loop'))}));
 at(24.5,()=>{pa.standUp();pa.anchor={a:W('room_gp',-1.2,.1),b:W('room_gp',-1.2,-.25),d:.9,t:0}});
 at(26.2,()=>{pa.look=null;pa.walkTo('room_gp',[[-.4,-.4],[1.2,-1.0],[3.2,-1.2]],c=>{})});
 at(26,()=>{doc.look=pa});at(29,()=>{doc.look=null;doc.tsmile=0});
 // Регистратура
 rec.set('room_rec',-2.05,.7,-2.3);rec.play('Sitting_Talking_Loop',0);rec.setLayer('phone',1);rec.tsmile=.7;
 mum.set('room_rec',.1,-.4,2.6);mum.play('Idle_Loop',0);inv.set('room_rec',.9,-1.2,2.45);inv.play('Idle_Loop',0);
 ord.set('room_rec',1.6,-1.8,0);ord.play('Push_Loop',0);
 at(2,()=>{mum.look=rec});at(4,()=>{inv.look=mum});
 at(9,()=>{rec.setLayer('phone',0);rec.look=mum;rec.tbrow=.8});at(10,()=>{mum.play('Idle_Talking_Loop',.4)});
 at(16,()=>{mum.play('Idle_Loop',.4);mum.walkTo('room_rec',[[.9,.6],[1.6,.2]],c=>{c.face('room_rec',2.1,.1);c.tyaw+=0})});
 at(17,()=>{rec.look=inv;rec.tbrow=1;inv.walkTo('room_rec',[[.15,-.35]],c=>{c.face('room_rec',-1.4,.4);c.play('Idle_Talking_Loop',.4)})});
 at(25,()=>{rec.setLayer('phone',1);rec.look=null;rec.tbrow=0;inv.play('Idle_Loop',.4)});
 at(.1,()=>ord.walkTo('room_rec',[[1.6,-.4]],c=>c.play('Push_Loop',.3)));at(8,()=>ord.walkTo('room_rec',[[.0,-1.9]],c=>c.play('Push_Loop',.3)));
 at(18,()=>ord.walkTo('room_rec',[[1.6,-1.8]],c=>{c.face('room_rec',0,0);c.play('Idle_Loop',.3);c.look=inv}));
 // Психиатр
 psy.set('room_psy',-1.3,.15,Math.PI/2);psy.play('Sitting_Idle_Loop',0);psy.setLayer('write',.6);psy.look=rock;
 rock.set('room_psy',.55,1.6,Math.PI);rock.play('Sitting_Idle_Loop',0);rock.setLayer('guitar',1);rock.tsmile=1;
 at(6,()=>{psy.setLayer('write',0);psy.play('Sitting_Talking_Loop',.4);rock.setLayer('guitar',0);rock.play('Sitting_Talking_Loop',.4);rock.look=psy});
 at(14,()=>{psy.play('Sitting_Idle_Loop',.4);psy.setLayer('write',.6);rock.setLayer('guitar',1);rock.play('Sitting_Idle_Loop',.4);rock.look=null});
 at(24,()=>{rock.standUp(()=>{rock.play('Dance_Loop',.4)})});at(31,()=>{rock.play('Sitting_Enter',.3,()=>rock.play('Sitting_Idle_Loop'))});
 // Сдувание голов
 big.set('room_def',1.0,.2,Math.PI);big.play('Sitting_Idle_Loop',0);big.tbrow=.8;
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
 if(acc>500){const w=ft.slice(-600),avg=1000*w.length/w.reduce((a,b)=>a+b,0),worst=Math.max(...ft.slice(-fr));
  hud.textContent=`v29 · ${(1000*fr/acc).toFixed(0)} fps · ср(10с) ${avg.toFixed(0)} · худш.кадр ${worst.toFixed(0)}мс · JS ${(cpu/fr).toFixed(1)}мс · ${LOWQ?'ЛЁГКОЕ':'ПОЛНОЕ'} · calls ${renderer.info.render.calls} · t=${T.toFixed(0)}с`;acc=0;fr=0;cpu=0;if(ft.length>2000)ft=ft.slice(-600)}}
requestAnimationFrame(loop);window.__ready=true;
