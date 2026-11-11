// v38: 3D-рендер для полной игры. Логика/UI/ввод/сохранения — из 2D-игры без изменений; здесь подменяется только draw().
// Ортокамера: азимут 45°, возвышение 30° (sin=HH/HW=.5) => пол 3D совпадает с iso() 2D, toWorld()/tap() работают как раньше.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {clone as skClone} from 'three/addons/utils/SkeletonUtils.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {makeFurn,mat,GRAD} from './furn.js';
const Q=new URLSearchParams(location.search);const LOWQ=Q.has('low')||localStorage.getItem('karachun_gfx')==='low';
const draw2D=window.draw;let READY=false;
window.draw=function(){if(!READY||!S||!S.rooms||!S.h)return draw2D();try{draw3D()}catch(e){console.error("3d",e.stack);READY=false}};
// ---------- renderer ----------
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:Q.has('cap')});
let DPR=Math.min(devicePixelRatio,LOWQ?1:2);renderer.setPixelRatio(DPR);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
const el=renderer.domElement;el.id='c3';Object.assign(el.style,{position:'fixed',left:0,top:0,zIndex:0,pointerEvents:'none'});document.body.insertBefore(el,document.body.firstChild);
const cv2=document.getElementById('c');cv2.style.background='transparent';cv2.style.position=cv2.style.position||'fixed';
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight)});
const scene=new THREE.Scene();scene.background=new THREE.Color(0x6f9a5c);
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,400);
scene.add(new THREE.HemisphereLight(0xf2f6ff,0x8a7a66,.95));const sun=new THREE.DirectionalLight(0xfff0dd,1.45);sun.position.set(8,14,5);scene.add(sun);scene.add(sun.target);
const fill=new THREE.DirectionalLight(0xcfe0ff,.55);fill.position.set(-6,5,-4);scene.add(fill);
const SPX=32*Math.SQRT2;            // пикселей (при cam.z=1) на 1 м по горизонтали
const DIRV=new THREE.Vector3(Math.cos(Math.PI/6)/Math.SQRT2,Math.sin(Math.PI/6),Math.cos(Math.PI/6)/Math.SQRT2);
function syncCam(){const W=innerWidth,H=innerHeight;const c=toWorld(W/2,H/2);const T=new THREE.Vector3(c.x,0,c.y);
 camera.position.copy(T).addScaledVector(DIRV,150);camera.lookAt(T);const k=1/(cam.z*SPX);camera.left=-W/2*k;camera.right=W/2*k;camera.top=H/2*k;camera.bottom=-H/2*k;camera.updateProjectionMatrix()}
// ---------- загрузка моделей ----------
const draco=new DRACOLoader().setDecoderPath('./lib/draco/');const L=new GLTFLoader().setDRACOLoader(draco);const ld=u=>new Promise((r,j)=>L.load(u,r,undefined,j));
const ROLES=['doctor','nurse','orderly','receptionist','bighead','invisible','rocker','mummy','patient_a'];
const [anG,prG,...rest]=await Promise.all([ld('models/anims.glb'),ld('models/props.glb'),...ROLES.map(r=>ld(`models/${r}.glb`))]);
const G={};ROLES.forEach((r,i)=>G[r]=rest[i]);const PROPS={};for(const o of prG.scene.children)PROPS[o.name]=o;
function toon(m){const t=new THREE.MeshToonMaterial({map:m.map,normalMap:LOWQ?null:m.normalMap,color:m.color,gradientMap:GRAD,transparent:m.transparent,opacity:m.opacity,side:m.side});if(m.normalMap)t.normalScale=new THREE.Vector2(.6,.6);return t}
const OUTM=new THREE.MeshBasicMaterial({color:0x1d1820,side:THREE.BackSide});OUTM.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <project_vertex>','transformed+=normalize(objectNormal)*0.0055;\n#include <project_vertex>')};
const ualPel=anG.scene.getObjectByName('pelvis').position.clone();const clipCache=new Map();
function clipsFor(pel){const k=pel.y.toFixed(3);if(clipCache.has(k))return clipCache.get(k);const s=pel.y/ualPel.y;const out=anG.animations.map(c=>{const cc=c.clone();cc.tracks=cc.tracks.filter(t=>!t.name.endsWith('.scale'));for(const t of cc.tracks)if(t.name==='pelvis.position'){const v=t.values;for(let i=0;i<v.length;i++)v[i]*=s}return cc});clipCache.set(k,out);return out}
const angd=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),UP=new THREE.Vector3(0,1,0);
function rotWorld(b,axis,ang){if(!ang)return;b.parent.getWorldQuaternion(_q2);_q.setFromAxisAngle(axis,ang);const inv=_q2.clone().invert();b.quaternion.premultiply(inv.multiply(_q).multiply(_q2));b.updateMatrixWorld(true)}
const SHM=new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.22,depthWrite:false});const SHG=new THREE.CircleGeometry(.36,20).rotateX(-Math.PI/2);
const STRIDE={};
// ---------- персонаж (порт Char v37: скин-модель, ретаргет клипов, процедурные слои, пропсы) ----------
class Char{constructor(role,o={}){const g=G[role];this.role=role;this.root=new THREE.Group();this.tilt=new THREE.Group();this.root.add(this.tilt);this.m=skClone(g.scene);this.tilt.add(this.m);scene.add(this.root);
  this.b={};this.meshes=[];this.m.traverse(x=>{if(x.isBone)this.b[x.name]=x;if(x.isMesh)this.meshes.push(x)});
  this.hs=o.head||1.3;this.b.Head.scale.setScalar(this.hs);for(const h of['hand_l','hand_r'])this.b[h].scale.setScalar(1.22);for(const f of['foot_l','foot_r'])this.b[f].scale.setScalar(1.1);
  for(const x of this.meshes){x.frustumCulled=false;x.material=toon(x.material);
   if(o.tint!=null&&/Clothes|Shirt|Top|Super/i.test(x.name)){x.material.color=new THREE.Color().setHSL(o.tint/360,.45,.62)}
   if(o.invisible&&!/Clothes/.test(x.name)){x.visible=false;continue}
   if(!LOWQ&&/Clothes|Super|Hair|Body/i.test(x.name)){const ol=new THREE.SkinnedMesh(x.geometry,OUTM);ol.bind(x.skeleton,x.bindMatrix);ol.frustumCulled=false;ol.morphTargetInfluences=x.morphTargetInfluences;x.parent.add(ol)}}
  const sh=new THREE.Mesh(SHG,SHM);sh.position.y=.012;sh.renderOrder=1;this.root.add(sh);this.shadow=sh;
  this.mix=new THREE.AnimationMixer(this.m);this.A={};
  for(const c of clipsFor(this.b.pelvis.position)){const a=this.mix.clipAction(c);a.enabled=true;a.setEffectiveWeight(0);a.play();this.A[c.name]=a;if(/Enter|Exit|PickUp/.test(c.name)){a.setLoop(THREE.LoopOnce);a.clampWhenFinished=true}}
  this.cur=null;this.yaw=0;this.layer={};this.lw={};this.t=Math.random()*10;this.prev=null;this.vel=0;this.alpha=1}
 strideOf(n){const key=this.role+n;if(STRIDE[key])return STRIDE[key];const c=this.A[n].getClip(),mx=new THREE.AnimationMixer(this.m),aa=mx.clipAction(c);aa.play();const N=40,zs=[];
  for(let i=0;i<=N;i++){aa.time=c.duration*i/N;mx.update(0);this.m.updateMatrixWorld(true);const l=this.m.worldToLocal(this.b.ball_l.getWorldPosition(new THREE.Vector3())),r=this.m.worldToLocal(this.b.ball_r.getWorldPosition(new THREE.Vector3()));zs.push(l.y<r.y?[0,l.z]:[1,r.z])}
  const v=[];for(let i=1;i<=N;i++)if(zs[i][0]===zs[i-1][0])v.push(Math.abs(zs[i][1]-zs[i-1][1])/(c.duration/N));v.sort((a,b)=>a-b);mx.stopAllAction();mx.uncacheRoot(this.m);return STRIDE[key]=Math.max(.2,v.length?v[Math.floor(v.length*.6)]:1)}
 play(n,fade=.3){const a=this.A[n];if(!a||this.cur===n)return;if(this.cur==='v43lie'){for(const k in this.A)if(this.A[k]!==a)this.A[k].fadeOut(fade);this.cur=null}const old=this.cur&&this.A[this.cur];a.reset();a.setEffectiveTimeScale(1);a.setEffectiveWeight(1);a.fadeIn(fade).play();if(old&&old!==a)old.fadeOut(fade);this.cur=n}
 attach(name,bone,pos,rot=[0,0,0],sc=1){const p=PROPS[name].clone();const bn=this.b[bone];this.root.position.set(0,0,0);this.root.rotation.set(0,0,0);this.tilt.rotation.set(0,0,0);this.root.updateMatrixWorld(true);const bp=bn.getWorldPosition(new THREE.Vector3());
  p.position.copy(bp).add(new THREE.Vector3(...pos));p.rotation.set(...rot);p.scale.setScalar(sc);this.root.add(p);this.root.updateMatrixWorld(true);bn.attach(p);(this.props??={})[name]=p;return p}
 layers(dt){for(const n in this.layer){this.lw[n]??=0;this.lw[n]+=(this.layer[n]-this.lw[n])*Math.min(1,dt*3)}const fw=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)),rt=new THREE.Vector3().crossVectors(UP,fw),b=this.b,t=this.t;
  if(this.soft){rotWorld(b.Head,rt,-this.soft*.2);rotWorld(b.clavicle_l,fw,-.08);rotWorld(b.clavicle_r,fw,.08)}
  const wr=this.lw.write||0;if(wr>.01){const ty=Math.sin(t*11),tz=Math.sin(t*9+1.7);rotWorld(b.upperarm_r,rt,-.22*wr);rotWorld(b.lowerarm_r,rt,(-.28+.05*ty)*wr);rotWorld(b.hand_r,rt,(.15+.1*ty)*wr);rotWorld(b.upperarm_l,rt,-.2*wr);rotWorld(b.lowerarm_l,rt,(-.26+.05*tz)*wr);rotWorld(b.hand_l,rt,(.15+.1*tz)*wr);rotWorld(b.Head,rt,-.12*wr)}
  const ex=this.lw.exam||0;if(ex>.01){const s=Math.sin(t*.9),c=Math.cos(t*.7);rotWorld(b.upperarm_r,rt,-(1.05+.08*s)*ex);rotWorld(b.upperarm_r,UP,(.35+.1*c)*ex);rotWorld(b.lowerarm_r,rt,-.55*ex);rotWorld(b.spine_02,rt,-.18*ex);rotWorld(b.Head,rt,-.2*ex)}
  const ph=this.lw.phone||0;if(ph>.01){rotWorld(b.upperarm_r,rt,-.7*ph);rotWorld(b.upperarm_r,fw,.9*ph);rotWorld(b.lowerarm_r,rt,-2.2*ph);rotWorld(b.Head,fw,.18*ph)}
  const gv=this.giveK||0;if(gv>.01){rotWorld(b.upperarm_r,rt,-1.2*gv);rotWorld(b.upperarm_r,UP,.2*gv);rotWorld(b.lowerarm_r,rt,.35*gv);rotWorld(b.hand_r,rt,.2*gv);rotWorld(b.spine_02,rt,-.1*gv);rotWorld(b.Head,rt,-.1*gv)}
  const nd=this.nodK||0;if(nd>.01)rotWorld(b.Head,rt,-.18*nd*Math.max(0,Math.sin(t*6)));
  const tk=this.takeK||0;if(tk>.01){rotWorld(b.upperarm_r,rt,-1.0*tk);rotWorld(b.upperarm_r,UP,-.2*tk);rotWorld(b.lowerarm_r,rt,-.45*tk);rotWorld(b.Head,rt,-.08*tk)}
  const op=this.lw.operate||0;if(op>.01){rotWorld(b.upperarm_r,rt,-.9*op);rotWorld(b.lowerarm_r,rt,(-.6+.15*Math.sin(t*4))*op);rotWorld(b.upperarm_l,rt,-.8*op);rotWorld(b.lowerarm_l,rt,(-.7+.15*Math.cos(t*3.3))*op);rotWorld(b.spine_02,rt,-.12*op)}}
 dispose(){scene.remove(this.root);this.mix.stopAllAction()}}
function niceFace(c){c.root.traverse(x=>{if(!x.isMesh)return;if(x.name==='Eyebrows'){x.material=x.material.clone();x.material.color.set(0xb98a62)}if(x.name==='Hair_Buns'){x.material=x.material.clone();x.material.color.set(0xc49a72)}});c.soft=1}
// ---------- облик по роли / болезни ----------
const BIG=new Set(['balloonhead','cloudhead','statichair','flathead']),INV=new Set(['lostshadow']),MUM=new Set(['pixel','spotty','zebra','glowskin','soapsneeze']),ROCK=new Set(['echo','giggles','drumheart','looping','bagpipelungs','hiccupclock']);
function mkStaff(s){const role=s.type==='handyman'?'orderly':s.type;const c=new Char(role,{tint:s.type==='handyman'?215:null});
 if(s.type==='nurse'){niceFace(c);c.attach('nurse_cap','Head',[0,.24*c.hs,-.01],[0,0,0],c.hs)}
 if(s.type==='doctor')c.attach('clipboard','hand_l',[.06,-.06,.04],[Math.PI/2,0,Math.PI/2]);
 if(s.type==='orderly'){c.attach('orderly_cap','Head',[0,.2*c.hs,0],[0,Math.PI,0],c.hs);c.attach('mop','hand_r',[-.05,-.02,.04],[0,0,0],.8)}
 if(s.type==='handyman')c.attach('plunger','hand_r',[-.05,-.02,.04],[0,0,0],.9);
 if(s.type==='receptionist')c.attach('glasses','Head',[0,.095*c.hs,.105*c.hs],[0,0,0],c.hs);
 c.walkName=s.type==='doctor'?'Walk_Formal_Loop':'Walk_Loop';return c}
function mkPat(p){const d=p.healed?null:p.dis;let role='patient_a',o=p.healed?{}:{tint:p.hue??(p.id*47%360)};if(BIG.has(d))role='bighead',o={};else if(INV.has(d))role='invisible',o={invisible:true};else if(MUM.has(d))role='mummy',o={};else if(ROCK.has(d))role='rocker',o={};
 const c=new Char(role,o);if(role==='invisible'){c.attach('hat','Head',[0,.215*c.hs-.075,-.005],[0,0,0],c.hs);c.attach('glasses','Head',[0,.105*c.hs,.115*c.hs],[0,0,0],c.hs)}
 if(d==='selfiesyndrome')c.attach('phone','hand_r',[-.06,-.02,.04],[0,0,Math.PI/2]);{const H={balloonhead:[2.3,2.3,2.3],cloudhead:[2,1.9,2],statichair:[1.6,1.6,1.6],flathead:[1.7,.6,1.7]}[d];if(H){c.headS=H.map(v=>v*c.hs);c.b.Head.scale.set(...c.headS)}}
 if(d==='blinknose'){const n=new THREE.Mesh(new THREE.SphereGeometry(.035,10,8),mat(0xff3030,{em:0xff0000}));c.b.Head.add(n);n.position.set(0,.09,.11);c.nose=n}
 if(d==='glowskin')c.meshes.forEach(x=>{if(/Body|Head/i.test(x.name)){x.material.emissive=new THREE.Color(0x7fff7f);x.material.emissiveIntensity=.35}});
 if(d==='tail'){const t=new THREE.Mesh(new THREE.CylinderGeometry(.03,.012,.45,8),mat(0x8a5a3a));t.rotation.x=-1.0;t.position.set(0,-.05,-.2);c.b.pelvis.add(t)}
 if(d==='deflated')c.m.scale.set(.85,1,.7);c.walkName=d==='rubberknee'||d==='jellyspine'?'Jog_Fwd_Loop':'Walk_Loop';return c}
// ---------- статика: пол, стены, мебель ----------
let ST=null,STSIG='';const DYN=new Map();// room.id -> {doorLeaf, parts:{name:[mesh]}, items}
function hex(c){return new THREE.Color(c)}
function mixW(c,k){return hex(c).lerp(new THREE.Color(0xffffff),k)}
const NFP={scanner:[1,2],bed:[1,2]};
function dirYaw(d){return [Math.PI/2,0,-Math.PI/2,Math.PI][d]??0}
function placeYaw(t,r){const fp=t.fp||fpOf(t.k||t.type),k=t.k||t.type;if(t.dir!=null)return dirYaw(t.dir);if(r&&/^(desk|recdesk|chiefdesk)$/.test(k)&&r.sp&&r.sp.staff){const st=r.sp.staff,du=(t.x+fp[0]/2)-(st.x+.5),dv=(t.y+fp[1]/2)-(st.y+.5);return Math.abs(du)>Math.abs(dv)?(du>0?Math.PI/2:-Math.PI/2):(dv>0?0:Math.PI)}const nfp=NFP[k]||(window.D&&D.furn&&D.furn[k]?D.furn[k].fp:fp)||fp;
 if(!r)return 0;const cx=t.x+fp[0]/2,cy=t.y+fp[1]/2,rx=r.x+r.w/2,ry=r.y+r.h/2,dsd=[[0,1],[1,0],[0,-1],[-1,0]][r.side||0];
 const same=fp[0]===nfp[0]&&fp[1]===nfp[1],sq=fp[0]===fp[1];
 if(sq){const du=rx-cx,dv=ry-cy;if(Math.abs(du)<.01&&Math.abs(dv)<.01)return Math.atan2(dsd[0],dsd[1]);return Math.abs(du)>Math.abs(dv)?(du>0?Math.PI/2:-Math.PI/2):(dv>0?0:Math.PI)}
 if(same){const dv=ry-cy;return Math.abs(dv)<.01?(dsd[1]<0?Math.PI:0):(dv>0?0:Math.PI)}
 const du=rx-cx;return Math.abs(du)<.01?(dsd[0]<0?-Math.PI/2:Math.PI/2):(du>0?Math.PI/2:-Math.PI/2)}
function placeFurn(t,r,root,dyn){const k=t.k||t.type,fp=t.fp||fpOf(k),nfp=NFP[k]||[Math.max(...fp),Math.min(...fp)];const g=makeFurn(k);
 const nf=(NFP[k]||(fp[0]===fp[1]?fp:null))||(k in{recdesk:1,desk:1,tubes:1,sofa:1,labbench:1,morguefridge:1,autopsy:1,bookcase:1,chiefdesk:1,bench:1}?[2,1]:fp);
 const yaw=placeYaw(t,r);const piv=new THREE.Group();piv.position.set(t.x+fp[0]/2,0,t.y+fp[1]/2);piv.rotation.y=yaw;g.position.set(-nf[0]/2,0,-nf[1]/2);piv.add(g);root.add(piv);
 g.traverse(o=>{if(o.isMesh&&o.name){(dyn.parts[o.name]??=[]).push(o);o.userData.keep=1}});dyn.items.push({t,piv,k});return piv}
function buildStatic(){if(ST){scene.remove(ST);ST.traverse(o=>{if(o.isMesh&&o.userData.own)o.geometry.dispose()})}DYN.clear();ST=new THREE.Group();const live=new THREE.Group();ST.add(live);
 // пол
 const P=[],C=[];const quad=(u,v,col,y=0)=>{P.push(u,y,v,u,y,v+1,u+1,y,v+1,u,y,v,u+1,y,v+1,u+1,y,v);for(let i=0;i<6;i++)C.push(col.r,col.g,col.b)};
 const grass=hex(0x86b46a),grass2=hex(0x7aa960),path=hex(0xbab3a6),corr=hex(0xd9c9a8),corr2=hex(0xcbb995);
 for(let v=-8;v<S.h+8;v++)for(let u=-8;u<S.w+8;u++){const inMap=u>=0&&v>=0&&u<S.w&&v<S.h&&!isHole(u,v);let c;
  if(!inMap){c=Math.abs(u-S.ent.x)<1&&v>=S.h?path:((u+v)&1?grass:grass2)}else{const r=roomAt(u,v);c=r?(typeof FLOORS!=='undefined'&&FLOORS[r.type]?hex(FLOORS[r.type][1]).multiplyScalar(.92):mixW(D.rooms[r.type].color||"#ccc",.15)).multiplyScalar((u+v)&1?1:.9):((u+v)&1?corr:corr2)}quad(u,v,c)}
 const fg=new THREE.BufferGeometry();fg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));fg.setAttribute('color',new THREE.Float32BufferAttribute(C,3));fg.computeVertexNormals();
 const floor=new THREE.Mesh(fg,new THREE.MeshLambertMaterial({vertexColors:true}));floor.userData.own=1;ST.add(floor);
 // стены (задние высокие, передние — вырез), двери
 const WG=[];const box=(w,h,d,x,y,z,col)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x+w/2,y+h/2,z+d/2);const n=g.attributes.position.count,cc=new Float32Array(n*3);for(let i=0;i<n;i++){cc[i*3]=col.r;cc[i*3+1]=col.g;cc[i*3+2]=col.b}g.setAttribute('color',new THREE.BufferAttribute(cc,3));WG.push(g)};
 const HB=+(Q.get('wall')||1.45),HF=.32,TH=.22,cap=hex(0x5b4636),winc=hex(0xa9d8f5);
 for(const r of S.rooms){const dyn={parts:{},items:[],r};DYN.set(r.id,dyn);if(!r.par){const wc=mixW(D.rooms[r.type].color||"#ccc",.45);
  for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const isDoor=x===r.door.x&&y===r.door.y;if(!isWall(r,x,y)&&!isDoor)continue;
   const sT=y===r.y,sL=x===r.x,sB=y===r.y+r.h-1,sR=x===r.x+r.w-1;
   if(isDoor){const back=r.side>=2;const hz=r.side===0||r.side===2;// дверь в стене вдоль X (hz) или вдоль Z
    const H=back?HB:HF,ox=r.side===3?x:r.side===1?x+1-TH:x,oz=r.side===2?y:r.side===0?y+1-TH:y;
    if(hz){box(.12,H,TH,x,0,oz,wc);box(.12,H,TH,x+.88,0,oz,wc);if(back&&HB>2.1)box(1,HB-2.05,TH,x,2.05,oz,wc)}else{box(TH,H,.12,ox,0,y,wc);box(TH,H,.12,ox,0,y+.88,wc);if(back&&HB>2.1)box(TH,HB-2.05,1,ox,2.05,y,wc)}
    if(back){const leaf=new THREE.Group();const lm=new THREE.Mesh(new THREE.BoxGeometry(.74,2,.05),mat(0x8fbfd8));lm.userData.own=1;lm.position.set(.38,1,0);lm.scale.y=Math.min(1,(HB-.03)/2);lm.position.y=lm.scale.y;leaf.add(lm);const hd=new THREE.Mesh(new THREE.SphereGeometry(.04,8,6),mat(0xd4af37));hd.position.set(.68,1,.05);leaf.add(hd);
     if(hz){leaf.position.set(x+.13,0,oz+TH/2)}else{leaf.position.set(ox+TH/2,0,y+.87);leaf.rotation.y=Math.PI/2}leaf.userData.base=leaf.rotation.y;live.add(leaf);dyn.leaf=leaf}
    continue}
   if(sT){box(1,HB,TH,x,0,y,wc);box(1,.04,TH,x,HB,y,cap);if(!sL&&!sR&&(x+y)%3===0)box(.6,Math.min(.7,HB-.95),.02,x+.2,HB>2?1.1:.8,y+TH,winc)}
   if(sL){box(TH,HB,1,x,0,y,wc);box(TH,.04,1,x,HB,y,cap);if(!sT&&!sB&&(x+y)%3===0)box(.02,Math.min(.7,HB-.95),.6,x+TH,HB>2?1.1:.8,y+.2,winc)}
   if(sB){box(1,HF,TH,x,0,y+1-TH,wc);box(1,.03,TH,x,HF,y+1-TH,cap)}
   if(sR){box(TH,HF,1,x+1-TH,0,y,wc);box(TH,.03,1,x+1-TH,HF,y,cap)}}}
  roomLay(r);for(const t of r.it)placeFurn(t,r,live,dyn)}
 const cd={parts:{},items:[]};DYN.set('corr',cd);for(const t of S.items)placeFurn(t,null,live,cd);
 // ограда участка
 const fc=hex(0xe9e2d2);for(let u=-1;u<=S.w;u++){if(Math.abs(u-S.ent.x)<1)continue;box(1,.5,.12,u,0,-1.1,fc)}for(let v=-1;v<S.h;v++){box(.12,.5,1,-1.1,0,v,fc)}
 if(WG.length){const wg=mergeGeometries(WG);WG.forEach(g=>g.dispose());const wm=new THREE.Mesh(wg,new THREE.MeshToonMaterial({vertexColors:true,gradientMap:GRAD}));wm.userData.own=1;ST.add(wm)}
 // слияние статической мебели по материалам (мало draw calls)
 live.updateMatrixWorld(true);const byM=new Map();const drop=[];live.traverse(o=>{if(!o.isMesh||o.userData.keep)return;let inLeaf=false;for(let p=o.parent;p;p=p.parent)if(p.userData.base!=null)inLeaf=true;if(inLeaf)return;
  const g=o.geometry.clone().applyMatrix4(o.matrixWorld);for(const k of Object.keys(g.attributes))if(!['position','normal'].includes(k))g.deleteAttribute(k);(byM.get(o.material)||byM.set(o.material,[]).get(o.material)).push(g);drop.push(o)});
 for(const o of drop)o.parent.remove(o);for(const[m,gs]of byM){const gg=mergeGeometries(gs.map(g=>g.index?g.toNonIndexed():g));const mm=new THREE.Mesh(gg,m);mm.userData.own=1;ST.add(mm)}
 scene.add(ST);STSIG=sig()}
// ---------- сущности ----------
const CH=new Map();const inv=(X,Y)=>{const a=(X-OX)/HW,b=(Y-OY)/HH;return[(a+b)/2,(b-a)/2]};
function roomOf(e){return S.rooms.find(r=>r.id===(e.room??e.wcRoom))}
function bedAt(sp){if(!sp||!sp.at)return null;for(const r of S.rooms)for(const t of r.it)if(t.x===sp.at.x&&t.y===sp.at.y)return{t,r};return null}
const WORKT={gp:'write',reception:'write',pharmacy:null,psych:null,chief:'write',library:'write'};
function poseOf(e,isStaff){const st={act:'idle',x:e.x+.5,z:e.y+.5,yaw:null,lie:0,y:0,layer:null};const moving=e.path&&e.path.length>0;
 if(e.state==='dead'){st.act='dead';return st}
 if(e.vs){const v=e.vs,T=SEAT_T[v.pose]||.9,k=Math.min(1,v.t/T);let X,Y;[X,Y]=seatXY(e);[st.x,st.z]=inv(X,Y);
  if(v.pose==='lie'){const b=bedAt(v.sp);const fp=b?b.t.fp||fpOf(b.t.k):[1,2];st.yaw=fp[1]>=fp[0]?0:Math.PI/2;if(b){const dy=DYN.get(b.r.id),it=dy&&dy.items.find(i=>i.t===b.t);if(it)st.yaw=it.piv.rotation.y}if(b){st.x=b.t.x+fp[0]/2;st.z=b.t.y+fp[1]/2}st.bed=b;st.lie=v.ph==='sat'?1:v.ph==='down'?k:1-k;st.act='lie';
   if(st.lie<1){const d0=[e.x+.5,e.y+.5];st.x=d0[0]+(st.x-d0[0])*st.lie;st.z=d0[1]+(st.z-d0[1])*st.lie}return st}
  st.yaw=dirYaw(v.sp.dir!=null?v.sp.dir:e.dir);st.act=v.ph==='sat'?'sit':v.ph==='down'?'sitdown':'situp';st.k=k;
  if(isStaff&&e.state==='work'&&v.ph==='sat'){const r=roomOf(e)||S.rooms.find(r=>r.id===e.room);if(r&&r.type in WORKT){const busy=S.pats.some(p=>p.room===r.id&&(p.state==='treat'||p.state==='enter'));st.layer=busy||S.pats.some(p=>p.room===r.id||(p.state==='queue'&&p.qr===r.id))?'write':null;st.talk=busy}}
  if(!isStaff&&e.state==='treat')st.talk=true;return st}
 if(e.oa){st.act='interact';st.yaw=dirYaw(e.oa.d);return st}
 if(e.wash){st.act='interact';st.yaw=dirYaw(e.dir??3);return st}
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
 const Ss=[C[0]+sx*.95,C[1]+sz*.95],E=[C[0]+sx*.4,C[1]+sz*.4],K=az?[Ss[0],P0[1]]:[P0[0],Ss[1]];const yawOut=Math.atan2(sx,sz),Y0=p.yaw;const L=p.lie;const ez=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};const lerp=(A,B,t)=>[A[0]+(B[0]-A[0])*t,A[1]+(B[1]-A[1])*t];
 p.v43bed=1;
 if(L<.3){const a=L/.3,d1=Math.hypot(K[0]-P0[0],K[1]-P0[1]),d2=Math.hypot(Ss[0]-K[0],Ss[1]-K[1]),dd=a*(d1+d2);const q=dd<d1?lerp(P0,K,d1?dd/d1:1):lerp(K,Ss,d2?(dd-d1)/d2:1);p.x=q[0];p.z=q[1];p.act=a<.92?'walk':'idle';p.yaw=yawOut;p.bed=null;return true}
 if(L<.55){const k=ez((L-.3)/.25);const q=lerp(Ss,E,k);p.x=q[0];p.z=q[1];p.act='sitdown';p.k=k/1.5;p.yaw=yawOut;p.seatH=.56;p.bed=null;return true}
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
 if(sit&&e.vs&&e.vs.pose==='sit'){c.v43=1;const fx=Math.sin(p.yaw),fz=Math.cos(p.yaw);const sk=v43SeatKind(e.vs.sp);c.v43sk=sk;
  // Anchor to logical spot tile (not 2D seatXY/v26 pixel offsets) so pelvis lands on the real 3D cushion.
  const sp=e.vs.sp,ax=sp.x+.5,az=sp.y+.5;
  const MD=V43.sitF[sk]??V43.fwd,SD=V43.standF[sk]??.65;const M=[ax+fx*MD,az+fz*MD],Sx=[ax+fx*SD,az+fz*SD];
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
 const moving=e.path&&e.path.length>0;
 if(!moving&&c.v43hold&&c.v43hold[2]===Math.round(e.x)&&c.v43hold[3]===Math.round(e.y)){p.x=c.v43hold[0];p.z=c.v43hold[1];return}
 if(moving){const tx=Math.floor(p.x),tz=Math.floor(p.z);if(!e.vs&&v43Seatish(tx,tz)){const cx=tx+.5,cz=tz+.5;let dx=p.x-cx,dz=p.z-cz,d=Math.hypot(dx,dz);if(d<.05&&c.v43hold){dx=c.v43hold[0]-cx;dz=c.v43hold[1]-cz;d=Math.hypot(dx,dz)}if(d>1e-3&&d<V43.stand){p.x=cx+dx/d*V43.stand;p.z=cz+dz/d*V43.stand}}if(c.v43hold&&Math.hypot(p.x-c.v43hold[0],p.z-c.v43hold[1])>1)c.v43hold=null}
 if(!moving&&!e.vs&&v43Seatish(Math.floor(e.x+.01),Math.floor(e.y+.01))&&c.v43p){const cx=Math.floor(e.x+.01)+.5,cz=Math.floor(e.y+.01)+.5;let dx=c.v43p[0]-cx,dz=c.v43p[1]-cz,d=Math.hypot(dx,dz);if(d<1e-3){dx=0;dz=1;d=1}if(Math.hypot(p.x-cx,p.z-cz)<V43.stand){p.x=cx+dx/d*V43.stand;p.z=cz+dz/d*V43.stand}return}
 if(moving){const n=e.path[e.path.length-1];if(n&&v43Seatish(n.x,n.y)){const cx=n.x+.5,cz=n.y+.5,d=Math.hypot(p.x-cx,p.z-cz);if(d<V43.stand&&d>1e-4){p.x=cx+(p.x-cx)/d*V43.stand;p.z=cz+(p.z-cz)/d*V43.stand}}}}
function updChar(e,isStaff,dt,now){let c=CH.get(e.id);if(c&&!isStaff&&e.healed&&!c.healed){const pos=c.root.position.clone(),y=c.yaw;c.dispose();CH.delete(e.id);c=mkPat(e);c.isStaff=false;c.ent=e;c.healed=true;CH.set(e.id,c);c.root.position.copy(pos);c.yaw=y;c.root.rotation.y=y;fx41(pos)}if(!c){c=isStaff?mkStaff(e):mkPat(e);c.isStaff=isStaff;c.ent=e;CH.set(e.id,c);const p=poseOf(e,isStaff);c.root.position.set(p.x,0,p.z);c.yaw=p.yaw??0}
 c.seen=true;c.t+=dt;const p=poseOf(e,isStaff);const r=c.root;if(!v43Bed(c,e,p))v43Sit(c,e,p,isStaff);else{c.v43=0;c.v43vs=null}c.v43p=[p.x,p.z];
 // позиция и скорость
 const dx=p.x-r.position.x,dz=p.z-r.position.z,dist=Math.hypot(dx,dz);const sp=dist/Math.max(dt,1e-4);c.vel+=(sp-c.vel)*Math.min(1,dt*8);
 if(dist>2)r.position.set(p.x,0,p.z);else r.position.set(p.x,0,p.z);
 let tyaw=p.yaw;if(p.act==='walk'&&dist>.002)tyaw=Math.atan2(dx,dz);if(p.look){tyaw=Math.atan2(p.look.x-e.x,p.look.y-e.y)}if(tyaw==null)tyaw=c.yaw;
 c.yaw+=angd(tyaw,c.yaw)*Math.min(1,dt*(p.act==='lie'||p.act==='v43lie'?20:8));r.rotation.y=c.yaw;
 // поза
 let tilt=0,ry=0,mz=0;
 switch(p.act){case'walk':c.play(c.walkName,.25);c.A[c.walkName].setEffectiveTimeScale(THREE.MathUtils.clamp(c.vel/c.strideOf(c.walkName),.3,2.4));break;
  case'sit':case'sitdown':case'situp':c.play(p.talk&&p.layer!=='write'&&!(e.vs&&e.vs.pose==='sit'&&(performance.now()/1000+(e.id||0))%7<3.5)?'Sitting_Talking_Loop':'Sitting_Idle_Loop',.35);break;
  case'v43lie':{const u=p.u,A1=c.A.Sitting_Idle_Loop,A2=c.A.Idle_Loop;if(c.cur!=='v43lie'){for(const k in c.A){const a=c.A[k];if(a!==A1&&a!==A2)a.fadeOut(.3)}if(!A1.isRunning())A1.reset().play();if(!A2.isRunning())A2.reset().play();c.cur='v43lie'}A1.stopFading();A2.stopFading();A1.enabled=A2.enabled=true;A1.setEffectiveWeight(1-u);A2.setEffectiveWeight(Math.max(.001,u));A2.setEffectiveTimeScale(.35);tilt=-Math.PI/2*u;ry=(c.v43gy??.1)*(1-u)+.78*u;mz=-.88*u;break}
  case'lie':c.play('Idle_Loop',.4);c.A.Idle_Loop.setEffectiveTimeScale(.35);tilt=-Math.PI/2*Math.min(1,p.lie*1.4);const sc=p.bed&&/scanner/.test(p.bed.t.k),au=p.bed&&p.bed.t.k==="autopsy";const bh=sc?.92:au?1.07:.78;ry=bh*Math.min(1,p.lie*1.4);mz=(sc?-.86:-.88)*Math.min(1,p.lie*1.4);break;
  case'interact':c.play('Interact',.25);if(c.A.Interact.time>=c.A.Interact.getClip().duration-.05)c.A.Interact.time=0;break;
  case'fix':c.play('Fixing_Kneeling',.3);break;case'mop':c.play('Idle_Loop',.3);break;case'crouch':c.play('Crouch_Idle_Loop',.3);break;
  case'treat':c.play(c.isStaff&&e.type!=='doctor'?'Idle_Loop':'Idle_Talking_Loop',.3);break;case'give':c.play('Idle_Loop',.3);break;case'treatp':c.play('Idle_Loop',.3);break;
  case'dead':c.play('Idle_Loop',.3);tilt=-Math.PI/2;ry=e.body?.75:.05;mz=-.88;break;
  default:c.play(e.state==='queue'&&e.wait>40?'Idle_Talking_Loop':'Idle_Loop',.4);if(c.A.Idle_Loop)c.A.Idle_Loop.setEffectiveTimeScale(1)}
 c.tilt.rotation.x+=(tilt-c.tilt.rotation.x)*Math.min(1,dt*10);c.tilt.position.y+=(ry-c.tilt.position.y)*Math.min(1,dt*10);c.m.position.y+=(mz*-1*0-c.m.position.y);c.m.position.z=0;c.tilt.position.z+=((p.act==='lie'||p.act==='dead'?0:0)-c.tilt.position.z);
 // лёжа: смещаем модель вдоль тела, чтобы таз был в центре кровати
 c.m.position.y=(p.act==='lie'||p.act==='dead'||p.act==='v43lie')?mz:0;
 // эффекты процедур
 c.fx=procFx(e,c,p,now);
 c.layer.write=p.layer==='write'?1:0;c.layer.exam=p.layer==='exam'?1:0;c.layer.phone=p.layer==='phone'?1:0;c.layer.operate=p.layer==='operate'?1:0;
 c.shadow.visible=p.act!=='lie';const fade=e.state==='dead'&&!e.body?Math.max(0,1-e.t/3):1;if(fade!==c.alpha){c.alpha=fade;c.root.visible=fade>.02}
 if(c.nose)c.nose.material.emissiveIntensity=(Math.sin(now/180)>0)?1:0;
 v43Give(c,e,p,isStaff);v43MopPre(c,e,p,isStaff);c.mix.update(dt);if(c.headS)c.b.Head.scale.set(...c.headS);c.m.updateMatrixWorld(true);legs(c,p,e,dt);c.layers(dt);v43MopPost(c,p,dt);c.pose=p}
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
const SEATH={sofa:.52,bench:.46,wc:.5,elchair:.50,chair:.50,chair_office:.50};
function footY(c,s){return c.b['foot_'+s].getWorldPosition(_v1).y-c.root.position.y}
function legs(c,p,e,dt){if(!c.b.foot_l||p.act==='lie'||p.act==='dead'||p.act==='v43lie'){c.gy=0;return}
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
  if(a&&(r.type==='pump'||r.type==='inflate')){const mach=d.items.find(i=>i.k==='pumpmachine'||i.k==='inflator');if(mach){hose(id,mach.piv,a.c,kk,r.type);if(r.type==='inflate')a.c.b.Head.scale.setScalar(a.c.hs*(1+.35*Math.sin(Math.min(1,a.q/.7)*Math.PI)));else if(e2big(a.e)){const t=Math.min(1,a.q/.8),H=a.c.headS||[a.c.hs*1.35,a.c.hs*1.35,a.c.hs*1.35];a.c.b.Head.scale.set(H[0]+(a.c.hs-H[0])*t,H[1]+(a.c.hs-H[1])*t,H[2]+(a.c.hs-H[2])*t)}}}
  else hose(id,null)}}
function e2big(e){return e.dis==='balloonhead'||e.dis==='cloudhead'}
const HM=new Map();function hose(id,piv,c,k,type){let h=HM.get(id);if(!piv){if(h){h.visible=false;h.valve.visible=false}return}
 if(!h){h=new THREE.Mesh(new THREE.BufferGeometry(),mat(type==='pump'?0x3a6ea5:0xe0703a));scene.add(h);HM.set(id,h);h.valve=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.06,10),mat(0xc0c8d0));}
 h.visible=k>.05;if(!h.visible){h.valve.visible=false;return}piv.updateMatrixWorld(true);const A=new THREE.Vector3(0,1.15,.4).applyMatrix4(piv.matrixWorld);const hd=c.b.Head;hd.updateWorldMatrix(true,false);const H0=hd.getWorldPosition(new THREE.Vector3()),N0=(c.b.neck_01||c.b.neck||hd.parent).getWorldPosition(new THREE.Vector3());const up=H0.clone().sub(N0).normalize();const sc=new THREE.Vector3();hd.matrixWorld.decompose(new THREE.Vector3(),new THREE.Quaternion(),sc);const hr=(window.HOSE_R??.17)*Math.max(sc.x,sc.y,sc.z)/Math.max(1e-3,c.root.scale.x||1)*(c.root.scale.x||1);const B=H0.clone().addScaledVector(up,hr);
 if(h.valve.parent!==scene){scene.add(h.valve)}h.valve.position.copy(B);h.valve.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),up);h.valve.visible=true;
 const M=A.clone().lerp(B,.5);M.y=Math.max(A.y,B.y)+.35;const cur=new THREE.QuadraticBezierCurve3(A,M,B);h.geometry.dispose();h.geometry=new THREE.TubeGeometry(cur,14,.03,6,false)}
// ---------- кадр ----------
let lastT=performance.now(),fpsA=60;
function draw3D(){const now=window.__fakeNow??performance.now(),dt=Math.min(.1,(now-lastT)/1000);lastT=now;fpsA+=(1/Math.max(dt,1e-3)-fpsA)*.05;window.__fps3=fpsA;
 OX=S.h*HW+MARGIN;if(!ST||STSIG!==sig())buildStatic();
 const sdt=dt*Math.max(.25,speed||0)*(speed>0?1:0.0)+ (speed>0?0:dt*.0);
 for(const c of CH.values())c.seen=false;const adt=speed>0?dt:dt*.3;
 for(const p of S.pats)updChar(p,false,adt,now);for(const s of S.staff)updChar(s,true,adt,now);
 for(const[id,c]of CH)if(!c.seen){c.dispose();CH.delete(id)}
 animRooms(now,dt);sel3d();
 syncCam();renderer.render(scene,camera);overlay(now)}
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
READY=true;window.__r3d={scene,CH,DYN,renderer,camera,makeFurn,V43,SEATH,v43SeatKind};window.__ready3d=true;
