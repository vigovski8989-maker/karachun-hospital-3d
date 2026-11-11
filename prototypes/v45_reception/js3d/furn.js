// v45 phase2: процедурная 3D-мебель + стандартные материалы/текстуры (preview only).
import * as THREE from 'three';
const grad=new THREE.DataTexture(new Uint8Array([110,110,110,255,175,175,175,255,228,228,228,255,255,255,255,255]),4,1);grad.needsUpdate=true;grad.magFilter=grad.minFilter=THREE.LinearFilter;
export const GRAD=grad;
const TL=new THREE.TextureLoader();
function loadTex(u,rep=1){const t=TL.load(u);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rep,rep);t.anisotropy=4;return t}
export const TEX={
  floor:loadTex('assets/tex/floor_cream_tile.png',1),
  plaster:loadTex('assets/tex/wall_plaster.png',2),
  stone:loadTex('assets/tex/stone_cream.png',2),
  paint:loadTex('assets/tex/paint_noise.png',3),
  cork:loadTex('assets/tex/cork.png',1),
  leaf:loadTex('assets/tex/leaf.png',1),
  ui:loadTex('assets/tex/monitor_ui.png',1),
  sign:loadTex('assets/tex/sign_plate.png',1),
};
TEX.leaf.wrapS=TEX.leaf.wrapT=THREE.ClampToEdgeWrapping;
TEX.ui.wrapS=TEX.ui.wrapT=THREE.ClampToEdgeWrapping;
TEX.sign.wrapS=TEX.sign.wrapT=THREE.ClampToEdgeWrapping;
TEX.recFloor=loadTex('assets/tex/rec7_tile.png',1);
TEX.recStone=loadTex('assets/tex/rec7_stone.png',1);
TEX.recSky=loadTex('assets/tex/rec7_sky.png',1);
TEX.recSign=loadTex('assets/tex/rec7_sign.png',1);
TEX.recNotices=[0,1,2,3].map(i=>loadTex('assets/tex/rec7_notice'+i+'.png',1));
for(const t of [TEX.recSky,TEX.recSign,...TEX.recNotices])t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;
const MC={};
export function mat(c,o={}){
  const k=c+JSON.stringify(o);if(MC[k])return MC[k];
  let m;
  if(o.basic)m=new THREE.MeshBasicMaterial({color:c,transparent:!!o.op,opacity:o.op??1,map:o.map||null});
  else if(o.toon)m=new THREE.MeshToonMaterial({color:c,gradientMap:grad,emissive:o.em??0,transparent:!!o.op,opacity:o.op??1,map:o.map||null});
  else {
    m=new THREE.MeshStandardMaterial({
      color:c, map:o.map||null, roughnessMap:o.rmap||null,
      roughness:o.rough??.72, metalness:o.metal??0,
      emissive:o.em??0, emissiveIntensity:o.em?0.55:0,
      transparent:!!(o.op||o.alpha), opacity:o.op??1,
      alphaTest:o.alphaTest??(o.alpha?.15:0),
      bumpMap:o.bump||null, bumpScale:o.bumpScale??.02,
      side:o.side||THREE.FrontSide
    });
  }
  return MC[k]=m;
}
const BX=new THREE.BoxGeometry(1,1,1),CY=new THREE.CylinderGeometry(1,1,1,14),CY6=new THREE.CylinderGeometry(1,1,1,8),SP=new THREE.SphereGeometry(1,14,10),TO=new THREE.TorusGeometry(1,.16,10,24);
const LEAFG=new THREE.PlaneGeometry(1,1);
function B(g,c,w,h,d,x,y,z,o){const m=new THREE.Mesh(BX,mat(c,o||{}));m.scale.set(w,h,d);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
function C(g,c,r,h,x,y,z,o,lo){const m=new THREE.Mesh(lo?CY6:CY,mat(c,o||{}));m.scale.set(r,h,r);m.position.set(x,y+h/2,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
function Sph(g,c,r,x,y,z,o){const m=new THREE.Mesh(SP,mat(c,o||{}));m.scale.setScalar(r);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m}
function Tor(g,c,r,x,y,z,rx=0,ry=0,o){const m=new THREE.Mesh(TO,mat(c,o||{}));m.scale.setScalar(r);m.position.set(x,y,z);m.rotation.set(rx,ry,0);g.add(m);return m}
function groundShadow(g,w,d,x,z,op=.28){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:op,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.008,z);m.renderOrder=1;g.add(m);return m}
const WOOD=0xb07a4a,WOODD=0x7b5232,WH=0xf3f1ea,STEEL=0xb9c3cc,DARK=0x2f3742,TEAL=0x3aa7a0,SCREEN=0x6fd3ff,GREEN=0x4f9a4a,LEAF=0x3f8f3c;
function legs4(g,c,w,d,h,x0=0,z0=0,t=.05){for(const[a,b]of[[.06,.06],[w-.06,.06],[.06,d-.06],[w-.06,d-.06]])B(g,c,t,h,t,x0+a,0,z0+b)}
function chair(g,c,seat=0x3d5a80,x=.5,z=.5,back=true){B(g,DARK,.06,.42,.06,x,0,z,{rough:.55,metal:.15});B(g,seat,.46,.08,.44,x,.42,z,{rough:.85});if(back)B(g,seat,.46,.5,.07,x,.5,z-.2,{rough:.85});groundShadow(g,.55,.55,x,z,.22)}
/** Monitor: screen faces +dirZ (1 = patient/+Z, -1 = staff/-Z). */
function monitor(g,x,y,z,face=1){
  const fz=face>=0?1:-1;
  B(g,DARK,.05,.16,.05,x,y,z,{rough:.4,metal:.3});
  B(g,DARK,.48,.32,.04,x,y+.17,z,{rough:.45,metal:.2});
  // bezel front
  B(g,0x1a1f26,.46,.3,.012,x,y+.18,z+.025*fz,{rough:.5});
  const scr=B(g,0xffffff,.4,.24,.008,x,y+.19,z+.028*fz,{map:TEX.ui,rough:.35,em:0x224466});
  scr.material.emissiveMap=TEX.ui;scr.material.emissiveIntensity=.65;scr.material.needsUpdate=true;
}
// Original phase7 modeled rounded planforms with real edge bevels, not stacked box lips.
function R(g,c,w,h,d,x,y,z,r=.04,o={}){
 const b=Math.min(.012,h*.22,d*.12,w*.12),W=w-2*b,D=d-2*b,rad=Math.min(r,W/2-.001,D/2-.001),sh=new THREE.Shape();
 const X=-W/2,Z=-D/2;sh.moveTo(X+rad,Z);sh.lineTo(X+W-rad,Z);sh.quadraticCurveTo(X+W,Z,X+W,Z+rad);sh.lineTo(X+W,Z+D-rad);sh.quadraticCurveTo(X+W,Z+D,X+W-rad,Z+D);sh.lineTo(X+rad,Z+D);sh.quadraticCurveTo(X,Z+D,X,Z+D-rad);sh.lineTo(X,Z+rad);sh.quadraticCurveTo(X,Z,X+rad,Z);
 const geo=new THREE.ExtrudeGeometry(sh,{depth:h-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3,steps:1,curveSegments:6});geo.rotateX(-Math.PI/2);geo.translate(0,b,0);
 const m=new THREE.Mesh(geo,mat(c,o));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;
}
function pull(g,x,y,z,w=.18){B(g,STEEL,.025,.035,.035,x-w/2,y,z);B(g,STEEL,.025,.035,.035,x+w/2,y,z);const bar=B(g,STEEL,w,.022,.022,x,y+.014,z+.025,{rough:.28,metal:.7});return bar}
function binder(g,x,y,z,c){R(g,c,.085,.32,.23,x,y,z,.008,{rough:.7});B(g,0xf0eee5,.067,.29,.20,x,y+.015,z-.003);B(g,c,.085,.32,.016,x,y,z+.12);B(g,WH,.05,.105,.003,x,y+.15,z+.13);B(g,0x46616b,.035,.005,.004,x,y+.22,z+.133);const ring=new THREE.Mesh(new THREE.TorusGeometry(.012,.003,5,12),mat(STEEL,{metal:.6}));ring.position.set(x,y+.07,z+.133);g.add(ring)}
export function receptionWindow(w=.82,h=1.15){
 const g=new THREE.Group(),frame=0xeaf0ec,trim=0xb3c7d0;
 // Deep reveals, inset environment panel, glazing and two independent sash rails.
 B(g,0x8fa6b0,w,h,.018,0,0,-.155,{rough:.6});
 const vista=B(g,0xffffff,w-.065,h-.065,.008,0,.032,-.143,{map:TEX.recSky,basic:true});vista.material.userData.noCastShadow=true;
 for(const x of [-w/2,w/2])B(g,frame,.065,h+.08,.18,x,-.035,-.045,{rough:.5});
 for(const y of [-.025,h-.025])B(g,frame,w+.10,.065,.18,0,y,-.045,{rough:.5});
 B(g,trim,.025,h-.07,.025,0,.035,.022,{rough:.5});B(g,frame,w-.055,.035,.032,0,h*.48,.025,{rough:.4});
 const glass=B(g,0xd8edf0,w-.10,h-.10,.004,0,.05,.018,{op:.12,rough:.18});glass.material.userData.noCastShadow=true;
 R(g,0xf4f0e5,w+.19,.055,.27,0,-.065,.035,.025,{rough:.4});
 B(g,STEEL,.07,.015,.032,w*.25,h*.48+.04,.05,{metal:.7,rough:.3});return g;
}
// Phase8 original geometry: rounded front-facing hardware and clean botanical surfaces.
function RF(g,c,w,h,d,x,y,z,r=.018,o={},flip=false){
 const m=R(g,c,w,d,h,x,0,z,r,o);m.geometry.rotateX(Math.PI/2);m.position.set(x,y+h/2,z-d/2);
 const ps=m.geometry.attributes.position,uv=m.geometry.attributes.uv;for(let i=0;i<ps.count;i++){let u=ps.getX(i)/w+.5;uv.setXY(i,flip?1-u:u,ps.getY(i)/h+.5)}uv.needsUpdate=true;return m;
}
function wire(g,points,r,c){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,18,r,6,false),mat(c,{rough:.65}));m.castShadow=true;g.add(m);return m}
function recMonitor(g,x,y,z,face=-1){
 const f=face>=0?1:-1,back=-f;
 R(g,0x526875,.23,.014,.15,x,y,z,.025,{metal:.25,rough:.45});
 R(g,0x526875,.043,.14,.047,x,y+.014,z,.012,{metal:.3,rough:.4});
 RF(g,0x4c6573,.46,.268,.037,x,y+.145,z,.022,{rough:.45,metal:.12});
 RF(g,0x20343e,.435,.246,.008,x,y+.155,z+.023*f,.016,{rough:.5});
 const screen=RF(g,0xffffff,.407,.219,.004,x,y+.169,z+.029*f,.011,{map:TEX.ui,rough:.45,em:0x183344},f<0);screen.material.emissiveMap=TEX.ui;screen.material.emissiveIntensity=.5;
 RF(g,0x405b69,.16,.09,.008,x,y+.18,z+.023*back,.01,{rough:.5});
 for(let i=0;i<4;i++)B(g,0x2d4552,.19,.005,.003,x,y+.312+i*.011,z+.020*back,{rough:.7});
 B(g,0x809da7,.035,.007,.004,x+.13,y+.185,z+.0205*back,{rough:.5});
 const dot=Sph(g,0x70bda6,.0035,x+.18,y+.16,z+.028*f,{em:0x1b6e59,rough:.3});
 wire(g,[[x,y+.19,z+.028*back],[x+.035,y+.13,z+.04*back],[x+.025,y+.04,z+.015],[x+.045,y+.005,z+.065]],.003,0x344953);
 C(g,0x50636c,.024,.004,x+.045,y,z+.065,{rough:.5});
}
export function receptionEntrance(){
 const g=new THREE.Group(),white=0xeaf1ec,blue=0x5d8297;
 for(const x of[.035,.965])R(g,white,.055,2.35,.13,x,0,0,.012,{rough:.48});
 R(g,white,1.04,.065,.15,.5,2.35,0,.025,{rough:.45});
 R(g,blue,1.82,.038,.10,.12,2.415,0,.015,{rough:.5});
 RF(g,0xffffff,.74,.13,.018,.5,2.445,.018,.008,{map:TEX.recSign,rough:.55});
 for(const x of[-.64,-.15])B(g,STEEL,.025,.15,.035,x,2.28,-.005,{metal:.6,rough:.4});
 // Sliding leaf is permanently PARKED entirely left of the .90 m clear passage.
 for(const x of[-.775,-.015])RF(g,white,.03,2.20,.035,x,.10,.015,.008,{rough:.4,metal:.1});
 for(const y of[.10,2.265])RF(g,white,.79,.035,.035,-.395,y,.015,.008,{rough:.4,metal:.1});
 const pane=B(g,0xc0dfe6,.73,2.13,.006,-.395,.135,.017,{op:.18,rough:.18});pane.material.userData.noCastShadow=true;
 const frost=B(g,0xd9ebed,.73,.11,.008,-.395,1.03,.025,{op:.65,rough:.45});frost.material.userData.noCastShadow=true;
 B(g,blue,.075,.018,.009,-.46,1.075,.032);B(g,blue,.018,.075,.009,-.46,1.047,.032);
 C(g,STEEL,.008,.16,-.10,.94,.065,{metal:.75,rough:.25});for(const y of[.95,1.08])B(g,STEEL,.017,.012,.04,-.10,y,.045,{metal:.7,rough:.3});
 R(g,0xaabcc2,.90,.003,.22,.5,-.002,0,.015,{metal:.45,rough:.45});return g;
}
export const F={
 recdesk(g){
  const BLUE=0x437692,DEEP=0x2e566d,PANEL=0x527f98,STONE=0xf5f1e6;
  const paint={rough:.54,metal:.02},stone={map:TEX.recStone,rough:.37,metal:0};
  groundShadow(g,2.1,1.13,1,.54,.24);
  R(g,DEEP,1.91,.075,.63,1,.015,.63,.06,paint);
  R(g,BLUE,1.96,.82,.24,1,.09,.82,.045,paint);
  R(g,BLUE,.38,.84,.74,.20,.08,.47,.065,paint);
  // Public recessed panels with fine pale-blue perimeter: calm hierarchy, no black stripes.
  for(const x of [.35,1,1.65]){
   R(g,0x6d95aa,.57,.61,.026,x,.19,.947,.009,paint);
   R(g,PANEL,.525,.565,.023,x,.212,.964,.007,paint);
  }
  B(g,0x9bb4be,1.82,.018,.018,1,.125,.953,{rough:.45,metal:.15});
  // True bevelled stone tops. Employee plane stays EXACTLY .860 m.
  R(g,STONE,2.04,.075,.80,1,.785,.09,.085,stone);
  R(g,STONE,2.06,.07,.34,1,.89,.86,.075,stone);
  R(g,STONE,.38,.07,.79,.20,.89,.495,.065,stone);
  // Storage is right-side only; keyboard/chair leg bay remains open.
  R(g,DEEP,.40,.705,.48,1.73,.08,.26,.025,paint);
  for(const y of [.13,.36,.59]){R(g,PANEL,.355,.195,.024,1.73,y,.005,.006,paint);pull(g,1.73,y+.135,-.025,.13)}
  B(g,0xffffff,.59,.145,.013,.68,.46,.989,{map:TEX.recSign,rough:.55});
  B(g,0xa8c7bf,.23,.055,.016,1.65,.51,.99,{rough:.5});B(g,0xa8c7bf,.055,.23,.016,1.65,.422,.99,{rough:.5});
  recMonitor(g,.5,.86,.25,-1);recMonitor(g,1.15,.86,.25,-1);
  RF(g,0x4c6573,.34,.20,.030,.55,.96,.92,.016,{rough:.45});
  RF(g,0xffffff,.305,.17,.005,.55,.976,.938,.010,{map:TEX.ui,rough:.45,em:0x224466});
  const keyboard=B(g,DARK,.38,.02,.14,.5,.86,-.07,{rough:.55});keyboard.name='rec_keyboard';
  for(let row=0;row<3;row++)for(let col=0;col<10;col++)B(g,0x9daeb8,.027,.004,.025,.35+col*.032,.882,-.11+row*.032,{rough:.65});
  Sph(g,DARK,.025,.78,.875,-.07,{rough:.5});
  // Proper telephone cradle and handset, on the worktop (not sunk beneath it).
  R(g,0x354956,.18,.045,.19,1.57,.86,.20,.025,{rough:.5});
  R(g,DARK,.19,.035,.045,1.57,.918,.14,.015,{rough:.42});
  for(const x of[1.49,1.65])R(g,DARK,.035,.042,.07,x,.905,.15,.012,{rough:.4});
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)B(g,0xb0c2c6,.014,.004,.014,1.54+col*.025,.908,.23+row*.022);
  // Handover tray and single printed registration form; no scattered upright blocks.
  R(g,0x7f9caa,.31,.018,.22,1.30,.96,.86,.025,{rough:.5,metal:.2});
  for(const x of[1.15,1.45])B(g,0x7f9caa,.015,.035,.22,x,.975,.86,{rough:.5});
  const form=B(g,WH,.255,.003,.18,1.30,.979,.86,{map:TEX.recNotices[0],rough:.8});
  C(g,0x9eaba9,.029,.065,1.88,.86,.37,{rough:.45,metal:.3});
  for(const [dx,h]of[[-.01,.105],[.008,.09]])C(g,0x426779,.003,h,1.88+dx,.92,.37,{rough:.4});
 },
 rec_cabinet(g){
  const shell=0xb9ccce,front=0xd5e0dc;
  R(g,0x738d95,.75,.075,.48,.5,.02,.28,.025,{rough:.6});R(g,shell,.80,1.13,.51,.5,.095,.28,.035,{rough:.55});
  for(const y of[.15,.48,.81]){R(g,front,.72,.285,.025,.5,y,.551,.006,{rough:.6});pull(g,.5,y+.205,.573,.22);B(g,0x6e8b91,.17,.055,.006,.5,y+.08,.573,{rough:.5});B(g,WH,.135,.031,.007,.5,y+.092,.58)}
  R(g,0xf0eee4,.84,.04,.55,.5,1.225,.28,.035,{rough:.42});
  // Quiet desktop printer, output slot and paper feed, all in the existing cabinet footprint.
  R(g,0xe6ebe6,.40,.18,.32,.57,1.265,.28,.025,{rough:.55});R(g,0x58727c,.35,.025,.30,.57,1.43,.28,.018,{rough:.5});
  B(g,0x293e48,.28,.018,.01,.57,1.315,.446);B(g,WH,.23,.004,.11,.57,1.30,.49,{rough:.8});
  B(g,WH,.24,.14,.012,.57,1.42,.20,{rough:.85});B(g,0x80aaa4,.07,.035,.004,.70,1.365,.448);
  binder(g,.22,1.265,.28,0x4f798e);
 },

 desk(g){B(g,WOOD,1.8,.06,.8,1,.72,.5);legs4(g,WOODD,1.8,.8,.72,.1,.1);B(g,WOODD,.5,.62,.75,.4,.1,.5);monitor(g,1.25,.78,.35);B(g,WH,.3,.02,.22,.75,.78,.55);B(g,0x2c6fbf,.18,.04,.25,.45,.78,.5)},
 chair_office(g){chair(g,0,0x2f4b70);C(g,DARK,.25,.03,.5,0,.5,0,1)},
 chair_plain(g){chair(g,0,0xc98b4f)},chair(g){chair(g,0,0x5f86b5)},
 cabinet(g){B(g,0x9fb4c4,.8,1.3,.5,.5,0,.27);B(g,0x7e95a6,.84,.05,.54,.5,1.3,.27);for(const y of[.08,.5,.92]){B(g,0xb9cbd8,.72,.36,.03,.5,y,.52);B(g,STEEL,.22,.04,.03,.5,y+.26,.545);B(g,WH,.16,.08,.01,.5,y+.12,.54)}B(g,0xe8c15a,.12,.3,.22,.3,1.35,.27);B(g,0x4f86c6,.1,.28,.22,.43,1.35,.27);B(g,0xd25b5b,.1,.26,.22,.55,1.35,.27)},
 shelf(g){B(g,WOOD,.9,1.8,.35,.5,0,.2);for(const y of[.4,.85,1.3]){B(g,WOODD,.86,.04,.36,.5,y,.22);for(let i=0;i<4;i++)C(g,[0xe55,0x5c5,0x55e,0xfc3][i],.05,.16,.18+i*.21,y+.04,.3)}},
 scanner(g){B(g,WH,.6,.55,1.7,.5,0,1.05);B(g,0xd5e7f0,.5,.08,1.4,.5,.55,1.1).name='slide';const ring=new THREE.Group();ring.position.set(.5,.95,.35);g.add(ring);
  const r=new THREE.Mesh(new THREE.TorusGeometry(.45,.2,12,28),mat(WH));ring.add(r);const r2=new THREE.Mesh(new THREE.TorusGeometry(.42,.03,8,28),mat(SCREEN,{em:0x3399cc}));r2.position.z=.2;r2.name='glow';ring.add(r2);B(g,WH,.98,.5,.4,.5,0,.35)},
 rec_plant(g){
  groundShadow(g,.61,.61,.5,.5,.18);
  const pot=new THREE.Mesh(new THREE.CylinderGeometry(.18,.135,.31,40,1,true),mat(0xe2d7c2,{rough:.55}));pot.position.set(.5,.175,.5);pot.castShadow=pot.receiveShadow=true;g.add(pot);
  C(g,0x879e9f,.141,.022,.5,.01,.5,{rough:.55});
  const lip=new THREE.Mesh(new THREE.TorusGeometry(.172,.012,8,40),mat(0xf3e9d6,{rough:.5}));lip.rotation.x=Math.PI/2;lip.position.set(.5,.326,.5);g.add(lip);
  C(g,0x514f3a,.159,.012,.5,.309,.5,{rough:1});
  for(let k=0;k<10;k++){
   const a=k*2.399,dir=new THREE.Vector3(Math.cos(a),0,Math.sin(a)),side=new THREE.Vector3(-dir.z,0,dir.x),height=.18+(k%4)*.065,width=.043+(k%3)*.012,reach=.20+(k%3)*.028;
   const root=new THREE.Vector3(.5,.322,.5),base=root.clone().addScaledVector(dir,.04+(k%2)*.025);base.y+=height;
   wire(g,[root.toArray(),root.clone().addScaledVector(dir,.025).add(new THREE.Vector3(0,height*.65,0)).toArray(),base.toArray()],.0035,0x5a7e48);
   const verts=[],uvs=[],cols=[],ids=[],N=16,M=6,center=[];
   for(let i=0;i<=N;i++){const t=i/N,c=base.clone().addScaledVector(dir,reach*(.4*t+.6*t*t));c.y+=.18*t-.20*t*t;const w=width*Math.pow(Math.sin(Math.PI*t),.75);center.push(c.clone().add(new THREE.Vector3(0,.018*Math.sin(Math.PI*t)+.001,0)).toArray());
    for(let j=0;j<=M;j++){const u=j/M*2-1,v=c.clone().addScaledVector(side,w*u);v.y+=.018*(1-u*u)*Math.sin(Math.PI*t)+u*.016*Math.sin(t*2);verts.push(v.x,v.y,v.z);uvs.push(j/M,t);const shade=Math.abs(u)<.2?1.06:.96;cols.push(shade,shade,shade)}
   }
   for(let i=0;i<N;i++)for(let j=0;j<M;j++){const q=i*(M+1)+j;ids.push(q,q+1,q+M+2,q,q+M+2,q+M+1)}
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));geo.setIndex(ids);geo.computeVertexNormals();
   const leaf=new THREE.Mesh(geo,mat([0x4e854a,0x5c914e,0x467c47,0x66984f][k%4],{rough:.66,side:THREE.DoubleSide}));leaf.castShadow=true;leaf.receiveShadow=false;leaf.material.userData.noReceiveShadow=true;leaf.material.vertexColors=true;leaf.material.needsUpdate=true;g.add(leaf);
   // Modeled central ridge + subtle vertex-color vein: no subpixel tube aliasing.
  }
 },
 plant(g){
  groundShadow(g,.55,.55,.5,.5,.26);
  C(g,0xc96f43,.15,.28,.5,0,.5,{rough:.75});
  C(g,0x5a3a20,.13,.02,.5,.28,.5,{rough:.8});
  // soil
  C(g,0x3a2a18,.13,.04,.5,.28,.5,{rough:.95});
  // foliage: textured leaf planes (not bubble blobs)
  for(let i=0;i<14;i++){
    const a=i*.45, h=.42+(i%5)*.09, rad=.12+(i%3)*.05;
    const leaf=new THREE.Mesh(LEAFG,mat(0xffffff,{map:TEX.leaf,rough:.85,side:THREE.DoubleSide,alpha:1,alphaTest:.2}));leaf.scale.set(rad*2.2,rad*2.8,1);
    leaf.position.set(.5+Math.cos(a)*rad*.9,h,.5+Math.sin(a)*rad*.9);
    leaf.rotation.set(.4+((i%3)*.2),a,((i%2)?-1:1)*.35);
    leaf.castShadow=true;g.add(leaf);
  }
  // a few soft depth spheres under leaves
  for(let i=0;i<4;i++){const a=i*1.5;Sph(g,0x2e6b2a,.07,.5+Math.cos(a)*.08,.55+i*.05,.5+Math.sin(a)*.08,{rough:.9})}
 },
 tubes(g){B(g,WH,1.8,.06,.6,1,.85,.4);legs4(g,STEEL,1.8,.6,.85,.1,.1);B(g,STEEL,.5,.12,.2,.5,.91,.35);for(let i=0;i<6;i++)C(g,[0xe33,0x3c3,0x39f,0xfc3,0xe3e,0xf80][i],.025,.2,.3+i*.08,.96,.35,{em:0x111111});C(g,0xdde,.18,.22,1.4,.91,.4);C(g,DARK,.16,.04,1.4,1.13,.4)},
 bed(g){legs4(g,STEEL,.9,1.9,.35,.05,.05);B(g,STEEL,.9,.12,1.9,.5,.35,1);B(g,WH,.84,.14,1.84,.5,.47,1);B(g,0x8fc3e8,.86,.06,1.1,.5,.6,1.3);B(g,WH,.6,.1,.3,.5,.6,.3);B(g,STEEL,.9,.5,.05,.5,.35,.03);B(g,STEEL,.9,.3,.05,.5,.35,1.97);C(g,STEEL,.015,1.6,.92,0,.15);B(g,0xbfe6ff,.14,.2,.05,.92,1.5,.15,{op:.7})},
 sofa(g){B(g,0x7a5fa0,1.9,.42,.8,1,0,.45);B(g,0x8d71b4,1.9,.5,.2,1,.42,.13);B(g,0x8d71b4,.18,.28,.8,.1,.42,.45);B(g,0x8d71b4,.18,.28,.8,1.9,.42,.45);B(g,0x9b80c2,.8,.1,.6,.55,.42,.5);B(g,0x9b80c2,.8,.1,.6,1.45,.42,.5)},
 pumpmachine(g){B(g,0x6a8caf,.6,1.1,.5,.5,0,.4);C(g,0xffd166,.17,.04,.5,.8,.66,{em:0x332200});const n=B(g,0xe33,.02,.12,.02,.5,.82,.68);n.name='needle';C(g,DARK,.05,.12,.5,1.1,.4);B(g,0xd1d9e0,.7,.08,.6,.5,0,.4)},
 wc(g){B(g,WH,.42,.42,.55,.5,0,.5);C(g,WH,.24,.12,.5,.38,.55);B(g,WH,.44,.45,.18,.5,.38,.18);B(g,STEEL,.12,.03,.04,.5,.84,.18)},
 sink(g){B(g,WH,.6,.18,.45,.5,.72,.3);C(g,STEEL,.06,.68,.5,0,.2);C(g,STEEL,.02,.2,.5,.9,.14);B(g,0xbfdfff,.55,.7,.03,.5,1.05,.04,{op:.6})},
 coffee(g){B(g,WOOD,.9,.8,.55,.5,0,.3);B(g,DARK,.38,.5,.32,.5,.8,.25);C(g,WH,.06,.1,.5,.84,.42);B(g,0xe33,.06,.06,.02,.6,1.15,.42,{em:0x660000})},
 xray(g){B(g,STEEL,.8,.06,.6,.5,0,.4);C(g,STEEL,.05,2,.12,0,.2);C(g,STEEL,.05,2,.88,0,.2);const p=B(g,0x9fe8b0,.7,1.4,.06,.5,.4,.2,{em:0x1b4a2a});p.name='xglow';B(g,DARK,.3,.2,.3,.5,1.9,.25)},
 dnaseq(g){B(g,0xe9eef3,.8,1.5,.6,.5,0,.4);B(g,DARK,.6,.4,.02,.5,.9,.71);for(let i=0;i<8;i++){Sph(g,i%2?0xf55:0x5af,.04,.5+Math.cos(i)*.15,.95+i*.04,.72,{em:0x222222})}B(g,STEEL,.6,.05,.3,.5,.55,.65)},
 elchair(g){chair(g,0,0x50426a,.5,.5);B(g,0x50426a,.5,.06,.3,.5,.42,.7);for(const s of[-1,1]){C(g,0xc58b2b,.06,.6,.5+s*.35,.4,.3);Sph(g,0x9ff,.08,.5+s*.35,1.05,.3,{em:0x66ccff}).name='spark'}},
 rebootpod(g){C(g,0xdfe6ee,.42,.12,.5,0,.5);const gl=C(g,0x9fd8ff,.38,1.8,.5,.12,.5,{op:.35});gl.name='podglass';C(g,0xdfe6ee,.42,.14,.5,1.92,.5);C(g,0x6ff,.4,.02,.5,1.9,.5,{em:0x2299aa})},
 inflator(g){B(g,0xf08a5d,.55,.9,.5,.5,0,.35);C(g,0xfff0a0,.16,.5,.5,.9,.35);Sph(g,0xfff0a0,.16,.5,1.4,.35);const n=B(g,DARK,.02,.1,.02,.5,.55,.61);n.name='needle';C(g,0xffd166,.13,.03,.5,.55,.6)},
 uvlamp(g){C(g,DARK,.2,.05,.5,0,.5);C(g,STEEL,.03,1.6,.5,.05,.5);B(g,DARK,.5,.12,.3,.5,1.62,.6);const l=B(g,0xb98cff,.44,.03,.24,.5,1.6,.6,{em:0x7a3cff});l.name='uv'},
 labbench(g){B(g,0xdfe5ea,1.9,.85,.6,1,0,.35);B(g,DARK,1.94,.05,.64,1,.85,.35);for(let i=0;i<5;i++){C(g,[0x7f7,0xf7f,0x7ff,0xff7,0xf97][i],.05,.18,.3+i*.35,.9,.3,{em:0x111111,op:.85});}B(g,STEEL,.3,.35,.25,1.6,.9,.3)},
 morguefridge(g){B(g,STEEL,1.9,1.7,.6,1,0,.32);for(let i=0;i<3;i++)for(let j=0;j<2;j++){B(g,0xdfe5ea,.85,.48,.02,.53+j*.94,.12+i*.52,.63);B(g,DARK,.2,.04,.04,.53+j*.94,.5+i*.52,.65)}},
 autopsy(g){C(g,STEEL,.1,.8,1,0,.5);B(g,STEEL,1.8,.08,.7,1,.8,.5);B(g,0xd8dee4,1.7,.03,.6,1,.88,.5);C(g,STEEL,.25,.04,1,2.2,.5);C(g,0xffffee,.2,.03,1,2.17,.5,{em:0x999966})},
 organfridge(g){B(g,0xeef2f6,.6,.9,.55,.5,0,.4);B(g,0x5ab0ff,.5,.25,.02,.5,.55,.68,{em:0x113355});B(g,0xe33,.2,.06,.02,.5,.4,.68,{em:0x550000})},
 bookcase(g){B(g,WOODD,1.9,2,.35,1,0,.2);for(let y=.3;y<1.9;y+=.42)for(let i=0;i<9;i++)B(g,[0xa33,0x36a,0x3a5,0xca3,0x649][(i+Math.round(y*7))%5],.15,.3,.26,.2+i*.2,y,.23)},
 readdesk(g){B(g,WOOD,.9,.05,.6,.5,.72,.45);legs4(g,WOODD,.9,.6,.72,.05,.15);C(g,DARK,.05,.02,.75,.77,.3);C(g,0xffd166,.1,.12,.75,1.1,.3,{em:0x886600});B(g,WH,.3,.03,.22,.4,.77,.5);chair(g,0,0xc98b4f,.5,.95,false)},
 chiefdesk(g){B(g,0x5c3820,1.9,.75,.85,1,0,.45);B(g,0x7a4a2a,2,.06,.95,1,.75,.45);monitor(g,1.4,.81,.3);B(g,0xd4af37,.2,.12,.08,.5,.81,.5,{em:0x332200})},
 aquarium(g){B(g,WOODD,.9,.7,.5,.5,0,.35);const w=B(g,0x5ec8f0,.86,.6,.46,.5,.7,.35,{op:.55});w.renderOrder=2;for(let i=0;i<3;i++)Sph(g,[0xffa500,0xff5,0xf55][i],.05,.3+i*.2,.95+i*.07,.35,{em:0x442200}).name='fish'},
 bench(g){for(const x of[.15,1.85])B(g,DARK,.06,.4,.4,x,0,.5);B(g,0x4f7cac,1.9,.06,.42,1,.4,.5);B(g,0x4f7cac,1.9,.36,.06,1,.5,.3)},
 rec_noticeboard(g){
  // A purposeful freestanding information board on two slim supports, existing tile only.
  for(const x of[.17,.83]){B(g,0x7e979e,.035,.72,.04,x,0,.19);R(g,0x7e979e,.20,.035,.30,x,.005,.19,.018,{rough:.5,metal:.3})}
  R(g,0x78949b,.96,.92,.065,.5,.58,.19,.02,{rough:.6});
  B(g,0xcfbc96,.88,.82,.018,.5,.63,.235,{rough:.95});
  B(g,0xffffff,.82,.18,.013,.5,1.27,.25,{map:TEX.recSign,rough:.7});
  for(const[i,x,y]of[[0,.28,.95],[1,.72,.95],[2,.28,.635],[3,.72,.635]]){
   B(g,0xffffff,.225,.30,.012,x,y,.255,{map:TEX.recNotices[i],rough:.85});Sph(g,0x749c9d,.006,x,y+.285,.267,{rough:.45,metal:.3});
  }
  B(g,0xb7c8c5,.74,.025,.10,.5,.60,.27,{rough:.5});
 },

 noticeboard(g){
  groundShadow(g,.7,.35,.5,.15,.15);
  B(g,WOODD,.92,.78,.05,.5,.5,.1,{rough:.65,map:TEX.paint});
  B(g,0xffffff,.84,.7,.02,.5,.52,.13,{map:TEX.cork,rough:.92,bump:TEX.cork,bumpScale:.04});
  // pinned notes with muted medical colors + pin heads
  const notes=[[.22,.4,0x5b8fd4,'смен'],[.48,.38,0xe8a05a,'мед'],[.72,.42,0x6ec6a0,'график'],[.3,.68,0xdde8f5,'info'],[.58,.7,0xf5e6c8,'☎']];
  for(const[x,y,col,lab] of notes){
    B(g,col,.2,.22,.012,x,y,.15,{rough:.8});
    Sph(g,0xc0392b,.015,x+.02,y+.2,.16,{metal:.3,rough:.4});
  }
  // header sign
  B(g,0xffffff,.62,.12,.015,.5,1.12,.14,{map:TEX.sign,rough:.45,em:0x0a4040});
  B(g,STEEL,.1,.02,.04,.5,1.28,.1,{rough:.3,metal:.8});
 },
 radiator(g){for(let i=0;i<7;i++)B(g,WH,.08,.6,.12,.2+i*.1,.1,.12);B(g,WH,.7,.05,.12,.5,.1,.12)},
 bin(g){C(g,0x557a55,.17,.45,.5,0,.5);C(g,DARK,.18,.03,.5,.45,.5)},
 soda(g){B(g,0xd8283a,.8,1.8,.6,.5,0,.4);B(g,0x9fd8ff,.5,1.1,.02,.38,.5,.71,{em:0x224455});B(g,WH,.12,.4,.02,.83,.8,.71);B(g,DARK,.5,.12,.04,.4,.15,.71)},
};
const PROTO={};
export function furnProto(k,fp){const key=k+fp;if(PROTO[key])return PROTO[key];const g=new THREE.Group();(F[k]||F.cabinet)(g);g.userData.k=k;return PROTO[key]=g}
export function makeFurn(k){const g=new THREE.Group();(F[k]||F.cabinet)(g);g.userData.k=k;return g}
