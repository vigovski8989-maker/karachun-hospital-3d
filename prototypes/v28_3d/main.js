// v28 A: real-time 3D (three.js / WebGL2). Комната GP + коридор, 3 персонажа со скелетной анимацией и смешиванием.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {clone as skClone} from 'three/addons/utils/SkeletonUtils.js';
const Q=new URLSearchParams(location.search);const LOWQ=Q.has('low');
const renderer=new THREE.WebGLRenderer({antialias:!LOWQ,powerPreference:'high-performance',preserveDrawingBuffer:Q.has('cap')});
renderer.setPixelRatio(Math.min(devicePixelRatio,LOWQ?1:2));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x1b2128);
const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.35;
// изометрическая камера (как в игре: 45° по азимуту, 30° наклон)
const cam=new THREE.OrthographicCamera(-1,1,1,-1,.1,100);const TGT=Q.has('tgt')?new THREE.Vector3(...Q.get('tgt').split(',').map(Number)):new THREE.Vector3(2.0,.7,-.6);
function fit(){const a=innerWidth/innerHeight,h=Q.has('zoom')?+Q.get('zoom'):4.6;cam.left=-h*a;cam.right=h*a;cam.top=h;cam.bottom=-h;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}
cam.position.copy(TGT).add(new THREE.Vector3(9,7.35,9));cam.lookAt(TGT);fit();addEventListener('resize',fit);
const hemi=new THREE.HemisphereLight(0xdfe8ff,0x8a7a66,.55);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1dc,1.6);sun.position.set(-2,7,1.5);sun.target.position.set(2,0,-1);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(LOWQ?1024:2048,LOWQ?1024:2048);Object.assign(sun.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.5,far:20});sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;sun.shadow.radius=4;
const B2T=(x,y)=>new THREE.Vector3(x,0,-y); // Blender (x,y) -> three
const draco=new DRACOLoader().setDecoderPath('./lib/draco/');const L=new GLTFLoader().setDRACOLoader(draco);
const ld=u=>new Promise((r,j)=>L.load(u,r,undefined,j));
const [room,docG,paG,pbG,lm]=await Promise.all([ld('models/room.glb'),ld('models/doctor.glb'),ld('models/patient_a.glb'),ld('models/patient_b.glb'),new THREE.TextureLoader().loadAsync('models/lightmap.png')]);
lm.flipY=false;lm.channel=1;lm.colorSpace=THREE.SRGBColorSpace;
room.scene.traverse(o=>{if(!o.isMesh)return;o.receiveShadow=true;o.castShadow=o.name!=='room'||false;
  const hasLM=!!o.geometry.attributes.uv1;o.material=o.material.clone();if(hasLM){o.material.lightMap=lm;o.material.lightMapIntensity=+(Q.get('lmi')||2.0)}o.material.envMapIntensity=.6});
scene.add(room.scene);
// ---------- персонажи ----------
class Char{constructor(g,name){this.root=new THREE.Group();this.m=skClone(g.scene);this.root.add(this.m);scene.add(this.root);this.name=name;
  this.m.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}if(o.isBone)(this.bones??={})[o.name]=o});
  this.mix=new THREE.AnimationMixer(this.m);this.A={};for(const c of g.animations){const a=this.mix.clipAction(c);a.enabled=true;a.setEffectiveWeight(0);a.play();this.A[c.name]=a;
   if(['greet','sit_down','stand_up'].includes(c.name)){a.setLoop(THREE.LoopOnce);a.clampWhenFinished=true}}
  this.cur=null;this.yaw=0;this.tyaw=0;this.path=[];this.v=0;this.look=null;this.hy=0;this.hp=0;this.queue=[];this.speed=1.15;this.walkMix=0}
 set(x,y,yaw){this.root.position.copy(B2T(x,y));this.yaw=this.tyaw=yaw;this.root.rotation.y=yaw}
 face(x,y){const p=B2T(x,y).sub(this.root.position);this.tyaw=Math.atan2(-p.x,-p.z)}
 play(n,fade=.35){if(this.cur===n)return;const a=this.A[n];if(!a)return;const old=this.cur&&this.A[this.cur];fade=Math.max(.02,fade);a.reset();a.setEffectiveTimeScale(1);a.setEffectiveWeight(1);a.fadeIn(fade).play();if(old)old.fadeOut(fade);this.cur=n}
 walkTo(pts,then){this.path=pts.map(p=>B2T(p[0],p[1]));this.then=then;this.play('walk',.3)}
 update(dt){const r=this.root;
  if(this.path.length){const t=this.path[0],d=t.clone().sub(r.position);d.y=0;const dist=d.length(),left=dist+this.path.slice(1).reduce((s,p,i,a)=>s+(i?p.distanceTo(a[i-1]):p.distanceTo(t)),0);
   const want=Math.min(this.speed,Math.max(.25,left*1.6));this.v+=(want-this.v)*Math.min(1,dt*5);
   if(dist<.06){this.path.shift();if(!this.path.length){this.v=0;const f=this.then;this.then=null;f&&f(this)}}
   else{this.tyaw=Math.atan2(-d.x,-d.z);const turn=Math.abs(angd(this.tyaw,this.yaw));const k=turn>1.2?.35:1;r.position.addScaledVector(d.normalize(),Math.min(dist,this.v*k*dt))}
   this.A.walk.setEffectiveTimeScale(Math.max(.4,this.v/1.05))}
  this.yaw+=angd(this.tyaw,this.yaw)*Math.min(1,dt*7);r.rotation.y=this.yaw;
  this.mix.update(dt);
  // вторичное движение: голова отслеживает цель (реакция)
  let ty=0,tp=0;if(this.look){const w=new THREE.Vector3();(this.look.root?this.look.bones.head.getWorldPosition(w):w.copy(this.look));const h=this.bones.head.getWorldPosition(new THREE.Vector3());
   const d=w.sub(h);const ang=Math.atan2(-d.x,-d.z);ty=THREE.MathUtils.clamp(angd(ang,this.yaw),-1.1,1.1);tp=THREE.MathUtils.clamp(Math.atan2(d.y,Math.hypot(d.x,d.z)),-.5,.4)}
  this.hy+=(ty-this.hy)*Math.min(1,dt*4);this.hp+=(tp-this.hp)*Math.min(1,dt*4);
  const hd=this.bones.head,nk=this.bones.neck;const q=new THREE.Quaternion();
  q.setFromAxisAngle(new THREE.Vector3(0,1,0),this.hy*.6);hd.quaternion.multiply(q);q.setFromAxisAngle(new THREE.Vector3(1,0,0),-this.hp*.6);hd.quaternion.multiply(q);
  if(nk){q.setFromAxisAngle(new THREE.Vector3(0,1,0),this.hy*.35);nk.quaternion.multiply(q)}}}
const angd=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
const doc=new Char(docG,'doctor'),pa=new Char(paG,'pa'),pb=new Char(pbG,'pb');
// ---------- сценарий (детерминированный, по времени) ----------
const CH=[2.2,3.5],PC=[2.2,2.05];let T=0,ev=[];const at=(t,f)=>ev.push({t,f,done:false});
function reset(){T=0;ev=[];
 doc.set(CH[0],CH[1],Math.PI);doc.play('write',0);doc.look=null;pa.set(6.3,-1.4,Math.PI/2);pa.look=null;pb.set(-.62,-1.0,-Math.PI/2);pb.play('wait',0);pb.look=null;
 at(.1,()=>pa.walkTo([[4.0,-.75],[4.0,.5],[2.6,1.55],[2.2,1.62]],c=>{c.face(2.2,3);c.play('idle',.25)}));
 at(.3,()=>{pb.look=pa});
 at(4.0,()=>{doc.play('sit_idle',.5);doc.look=pa});              // врач замечает вошедшего
 at(5.6,()=>{pa.look=doc});
 at(6.4,()=>{doc.play('greet',.3)});
 at(7.0,()=>{pa.play('sit_down',.25);pa.tyaw=0;pa.yaw=0;})
 at(7.0,()=>{pa.anchor=[2.2,1.62,2.2,2.02,0.9]});
 at(8.2,()=>{doc.play('talk',.4);pa.play('listen',.4)});
 at(8.4,()=>{pb.look=null});
 at(13.0,()=>{doc.play('stand_up',.3)});
 at(14.1,()=>{doc.walkTo([[1.25,3.45],[1.2,2.1],[1.55,2.05]],c=>{c.face(2.2,2.05);c.play('examine',.35)})});
 at(15.6,()=>{pa.look=doc});
 at(20.5,()=>{doc.walkTo([[1.2,2.1],[1.25,3.45],[2.2,3.55]],c=>{c.face(2.2,0);c.play('sit_down',.3)})});
 at(24.4,()=>{doc.play('write',.4);doc.look=null;pa.play('sit_idle',.4)});
 at(26.6,()=>{doc.look=pa;pa.play('stand_up',.3)});
 at(27.0,()=>{pa.anchor=[2.2,2.02,2.2,1.62,0.9]});
 at(28.0,()=>{pa.look=null;pa.walkTo([[2.6,1.5],[4.0,.5],[4.0,-.8],[6.8,-1.5]],c=>c.play('idle'))});
 at(29.5,()=>{doc.look=null;doc.play('write',.5)});
 at(29.0,()=>{pb.look=pa});at(33,()=>{pb.look=null});
}
function step(dt){T+=dt;for(const e of ev)if(!e.done&&T>=e.t){e.done=true;e.f()}
 if(pa.anchor){const [x0,y0,x1,y1,dur]=pa.anchor;pa.anchor.t=(pa.anchor.t||0)+dt;const k=Math.min(1,pa.anchor.t/dur),e=k*k*(3-2*k);pa.root.position.copy(B2T(x0+(x1-x0)*e,y0+(y1-y0)*e));if(k>=1)pa.anchor=null}
 doc.update(dt);pa.update(dt);pb.update(dt);if(T>36)reset()}
reset();
// ---------- цикл + метрики ----------
const hud=document.getElementById('hud');let last=performance.now(),acc=0,fr=0,cpu=0,ft=[];window.__stats={frames:[],cpu:[]};
window.__manual=Q.has('cap');window.__step=(dt,n=1)=>{for(let i=0;i<n;i++)step(dt);renderer.render(scene,cam)};window.__T=()=>T;window.__info=()=>renderer.info.render;
function loop(now){requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000);last=now;if(window.__manual)return;
 const c0=performance.now();step(dt);renderer.render(scene,cam);const c1=performance.now();__stats.frames.push(dt*1000);__stats.cpu.push(c1-c0);
 acc+=dt;fr++;if(acc>.5){hud.textContent=`v28·A 3D  ${(fr/acc).toFixed(0)} fps  calls ${renderer.info.render.calls} tris ${renderer.info.render.triangles}`;acc=0;fr=0}}
requestAnimationFrame(loop);window.__ready=true;
