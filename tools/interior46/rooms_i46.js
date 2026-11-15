// ===================== INTERIOR46: all-room furniture/props to the approved reception level =====================
// Original procedural geometry. Footprints, seat/bed/table heights and named animated parts are preserved exactly.
// Lighter bevel for small parts (fewer triangles; merged by material in buildStatic anyway).
function R1(g,c,w,h,d,x,y,z,r=.02,o={}){
 const b=Math.min(.008,h*.2,d*.12,w*.12),W=w-2*b,D=d-2*b,rad=Math.min(r,W/2-.001,D/2-.001),sh=new THREE.Shape(),X=-W/2,Z=-D/2;
 sh.moveTo(X+rad,Z);sh.lineTo(X+W-rad,Z);sh.quadraticCurveTo(X+W,Z,X+W,Z+rad);sh.lineTo(X+W,Z+D-rad);sh.quadraticCurveTo(X+W,Z+D,X+W-rad,Z+D);sh.lineTo(X+rad,Z+D);sh.quadraticCurveTo(X,Z+D,X,Z+D-rad);sh.lineTo(X,Z+rad);sh.quadraticCurveTo(X,Z,X+rad,Z);
 const geo=new THREE.ExtrudeGeometry(sh,{depth:Math.max(.001,h-2*b),bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:1,steps:1,curveSegments:3});geo.rotateX(-Math.PI/2);geo.translate(0,b,0);
 const m=new THREE.Mesh(geo,mat(c,o));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m}
// vertical (front-facing) rounded panel, light version
function RV(g,c,w,h,d,x,y,z,r=.012,o={}){const m=R1(g,c,w,d,h,x,0,z,r,o);m.geometry.rotateX(Math.PI/2);m.position.set(x,y+h/2,z-d/2);return m}
// open-front carcass: back, sides, top, bottom (front open so contents are visible). zc = centre z, front at zc+d/2.
function shell46(g,c,w,h,d,x,zc,o={rough:.55},y0=0){const t=.022;B(g,c,w,h,t,x,y0,zc-d/2+t/2,o);for(const s of[-1,1])B(g,c,t,h,d,x+s*(w/2-t/2),y0,zc,o);R1(g,c,w+.01,.03,d+.01,x,y0+h-.03,zc,.01,o);B(g,c,w,.06,d,x,y0,zc,o)}
const I46={oak:0xc79b6c,oakD:0x8c6442,walnut:0x6b4430,walnutL:0x86573c,white:0xeef0ec,offw:0xe3e7e4,steel:0xb8c2c9,chrome:0xd5dde2,dark:0x2f3a44,blue:0x437692,teal:0x4f9c98,paper:0xf6f4ee,cream:0xf4efe2,glass:0xcfe8ef};
function paperStack(g,x,y,z,n=3,w=.22,d=.3,rot=0){for(let i=0;i<n;i++){const m=B(g,i%2?0xfbfaf6:0xf1efe8,w,.004,d,x+(i%3-1)*.006,y+i*.004,z+(i%2)*.006,{rough:.9});m.rotation.y=rot+(i-1)*.04}}
function mug(g,x,y,z,c=0xffffff){C(g,c,.032,.08,x,y,z,{rough:.4},1);C(g,0x5a3b28,.028,.004,x,y+.074,z,{rough:.6},1);Tor(g,c,.022,x+.036,y+.042,z,0,0,{rough:.4})}
function pens(g,x,y,z){C(g,0x5d7684,.03,.085,x,y,z,{rough:.5},1);for(const[dx,c]of[[-.01,0x2a5ca8],[.01,0xc0392b],[0,0x2f3a44]])C(g,c,.004,.13,x+dx,y+.02,z+dx*.5,{rough:.4},1)}
function bottle(g,x,y,z,c,h=.12,r=.03){C(g,c,r,h,x,y,z,{rough:.3},1);C(g,0xf2f2f2,r*.55,h*.25,x,y+h,z,{rough:.4},1)}
function boxPack(g,x,y,z,c,w=.12,h=.07,d=.08){B(g,c,w,h,d,x,y,z,{rough:.8});B(g,0xffffff,w*.7,h*.35,.002,x,y+h*.35,z+d/2+.001,{rough:.8})}
function succulent(g,x,y,z){C(g,0xd9cbb4,.04,.05,x,y,z,{rough:.6},1);for(let i=0;i<6;i++){const a=i*1.05,m=Sph(g,i%2?0x6f9a5a:0x5d8a4d,.022,x+Math.cos(a)*.018,y+.06,z+Math.sin(a)*.018,{rough:.7});m.scale.set(.012,.03,.012);m.rotation.set(Math.cos(a)*.6,0,Math.sin(a)*.6)}}
function lamp(g,x,y,z,c=0x3d5a6c){C(g,c,.06,.015,x,y,z,{rough:.4,metal:.4});const a=B(g,c,.012,.3,.012,x,y+.015,z,{rough:.4,metal:.4});a.rotation.x=-.25;const h=C(g,c,.05,.07,x,y+.29,z+.08,{rough:.4,metal:.4});h.rotation.x=.9;Sph(g,0xfff3c8,.022,x,y+.27,z+.1,{em:0xffe9a8})}
function kbd(g,x,y,z){R1(g,0x39434c,.36,.018,.12,x,y,z,.01,{rough:.55});B(g,0xc9d2d7,.32,.004,.085,x,y+.018,z,{rough:.7});R1(g,0x39434c,.05,.018,.075,x+.27,y,z,.02,{rough:.5})}
function phone(g,x,y,z){R1(g,0x354956,.15,.04,.16,x,y,z,.02,{rough:.5});R1(g,0x2a3540,.16,.03,.04,x,y+.045,z-.04,.012,{rough:.42})}
function frameArt(g,x,y,z,c1,c2,w=.3,h=.22,dz=1){B(g,0x5b4636,w,h,.02,x,y,z,{rough:.6});B(g,c1,w-.04,h-.04,.004,x,y+.02,z+.011*dz,{rough:.8});B(g,c2,(w-.04)*.5,(h-.04)*.4,.004,x+.03,y+.05,z+.013*dz,{rough:.8})}
function caster(g,x,z){Sph(g,0x222a30,.022,x,.022,z,{rough:.5})}
function officeChair(g,seat,x=.5,z=.5){
 // 5-star base on casters, gas lift, contoured cushion (top .50 = SEATH.chair_office), curved back, armrests.
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5,ex=x+Math.cos(a)*.24,ez=z+Math.sin(a)*.24;const arm=B(g,0x2b3238,.24,.025,.035,x+Math.cos(a)*.12,.03,z+Math.sin(a)*.12,{rough:.45,metal:.3});arm.rotation.y=-a;caster(g,ex,ez)}
 C(g,0x2b3238,.05,.035,x,.03,z,{rough:.45,metal:.3});C(g,0x9aa6ae,.022,.30,x,.065,z,{rough:.3,metal:.7});C(g,0x2b3238,.035,.06,x,.36,z,{rough:.4});
 R1(g,0x2b3238,.44,.025,.42,x,.415,z,.04,{rough:.5});R(g,seat,.48,.065,.46,x,.435,z,.07,{rough:.82});
 B(g,0x2b3238,.05,.32,.03,x,.43,z-.24,{rough:.45,metal:.3});
 const back=R(g,seat,.44,.06,.48,x,0,0,.09,{rough:.82});back.geometry.rotateX(Math.PI/2);back.position.set(x,.74,z-.25);back.rotation.x=-.12;
 for(const s of[-1,1]){B(g,0x2b3238,.025,.16,.03,x+s*.235,.46,z+.02,{rough:.45,metal:.3});R1(g,0x39434c,.05,.025,.24,x+s*.235,.62,z+.03,.02,{rough:.6})}
 groundShadow(g,.6,.6,x,z,.2)}
function visitorChair(g,seat,frame,x=.5,z=.5){
 // tapered wooden legs, upholstered seat (top .50), curved back with rail.
 for(const[dx,dz]of[[-.19,-.18],[.19,-.18],[-.19,.18],[.19,.18]]){const l=C(g,frame,.018,.44,x+dx,0,z+dz,{rough:.55},1);l.scale.x=l.scale.z=.02}
 for(const dz of[-.18,.18])B(g,frame,.36,.03,.025,x,.2,z+dz,{rough:.55});
 R1(g,frame,.46,.03,.42,x,.41,z,.03,{rough:.55});R(g,seat,.44,.055,.40,x,.445,z+.01,.05,{rough:.85});
 for(const s of[-1,1])B(g,frame,.03,.42,.03,x+s*.2,.44,z-.19,{rough:.55});
 const back=R(g,seat,.42,.045,.24,x,0,0,.05,{rough:.85});back.geometry.rotateX(Math.PI/2);back.position.set(x,.79,z-.205);back.rotation.x=-.08;
 B(g,frame,.44,.035,.035,x,.86,z-.21,{rough:.55});groundShadow(g,.55,.55,x,z,.18)}
// Old chair kept for the reception chair (r3d adjusts its child boxes by scale).
F.chair_office_v45=F.chair_office;
Object.assign(F,{
 chair_office(g){officeChair(g,0x2f4b70)},
 chair_plain(g){visitorChair(g,0xd08e53,I46.oakD)},
 chair(g){visitorChair(g,0x5f86b5,0x5d6a72)},
 plant(g){F.rec_plant(g)},
 noticeboard(g){F.rec_noticeboard(g)},
 desk(g){
  // Light-oak top on a white drawer pedestal + slim steel frame; screen faces the seated doctor (-z side, staff side by placeYaw).
  groundShadow(g,1.95,.95,1,.5,.22);
  R(g,I46.oak,1.8,.045,.8,1,.705,.5,.035,{rough:.5,map:TEX.paint});
  R1(g,I46.white,.48,.66,.72,.4,.045,.5,.02,{rough:.55});R1(g,0xb5bfc4,.44,.045,.68,.4,0,.5,.015,{rough:.6});
  for(const y of[.1,.31,.52]){RV(g,I46.offw,.42,.18,.012,.4,y,.14,.008,{rough:.5});B(g,0x7f8c94,.14,.014,.012,.4,y+.14,.128,{rough:.35,metal:.6})}
  for(const z of[.13,.87])B(g,0xc3ccd2,.04,.7,.04,1.78,0,z,{rough:.3,metal:.6});B(g,0xc3ccd2,.04,.04,.74,1.78,.64,.5,{rough:.3,metal:.6});B(g,0xc3ccd2,.04,.04,.74,1.78,0,.5,{rough:.3,metal:.6});
  B(g,I46.white,1.25,.32,.018,1.12,.36,.86,{rough:.6});
  recMonitor(g,1.25,.75,.42,-1);kbd(g,1.18,.75,.2);
  paperStack(g,.72,.75,.48,3);B(g,0x2c6fbf,.2,.03,.27,.42,.75,.55,{rough:.6});B(g,0xe8a05a,.2,.025,.27,.44,.78,.55,{rough:.6});
  pens(g,1.62,.75,.22);mug(g,.7,.75,.2,0xffffff);phone(g,1.62,.75,.6);succulent(g,.25,.75,.18);
  B(g,0xe9eef0,.07,.11,.03,1.6,.75,.75,{rough:.5});B(g,0x7fb3a6,.05,.05,.004,1.6,.8,.766,{rough:.5});
 },
 cabinet(g){
  // Medical storage: glazed upper unit with supplies, solid lower doors, plinth.
  groundShadow(g,.85,.55,.5,.27,.2);
  R1(g,0x8fa2ab,.78,.07,.48,.5,0,.27,.02,{rough:.6});R(g,I46.white,.82,.68,.5,.5,.07,.27,.03,{rough:.5});shell46(g,I46.white,.82,.62,.5,.5,.27,{rough:.5},.74);
  B(g,0xdfe6e8,.78,.56,.012,.5,.76,.04,{rough:.4});
  for(const y of[.86,1.08])B(g,0xd5dcde,.72,.015,.42,.5,y,.29,{rough:.5});
  for(let i=0;i<4;i++){bottle(g,.2+i*.07,.875,.4,[0x7fb7d8,0xd8a35a,0xffffff,0x9ccf8f][i],.1,.024)}
  boxPack(g,.62,.875,.4,0xffffff);boxPack(g,.75,.875,.4,0x9fc4e0,.1,.09,.08);
  for(let i=0;i<5;i++)boxPack(g,.22+i*.13,1.095,.4,[0xf1d27a,0xffffff,0xe7b1b1,0xbfe0d4,0xffffff][i],.11,.1,.08);
  const gl=B(g,0xd8edf2,.37,.56,.008,.31,.76,.535,{op:.22,rough:.15});gl.material.userData.noCastShadow=true;const gl2=B(g,0xd8edf2,.37,.56,.008,.69,.76,.535,{op:.22,rough:.15});
  for(const x of[.123,.497,.503,.877])B(g,I46.white,.012,.58,.02,x,.75,.535,{rough:.5});
  for(const x of[.31,.69]){RV(g,0xe7ecea,.37,.6,.018,x,.1,.53,.01,{rough:.55})}
  for(const x of[.45,.55])B(g,0x8a979e,.014,.14,.02,x,.5,.55,{rough:.3,metal:.6});for(const x of[.45,.55])B(g,0x8a979e,.014,.1,.02,x,.85,.55,{rough:.3,metal:.6});
  R1(g,0xf4f3ee,.86,.035,.53,.5,1.35,.27,.02,{rough:.45});
  binder(g,.18,1.385,.25,0x4f798e);binder(g,.28,1.385,.25,0xc98a4e);R1(g,0xdde6ea,.24,.12,.2,.62,1.385,.27,.02,{rough:.6});B(g,0x6aa0b8,.18,.03,.004,.62,1.44,.371);
 },
 chiefdesk(g){
  // Executive walnut desk, leather inlay, panelled modesty front, brass lamp, nameplate.
  groundShadow(g,2.05,1,1,.45,.24);
  R(g,I46.walnut,1.9,.70,.82,1,.02,.45,.02,{rough:.55});
  for(const x of[.45,1.0,1.55])RV(g,I46.walnutL,.48,.5,.015,x,.12,.875,.01,{rough:.5});
  R1(g,0x4c2f20,1.86,.03,.78,1,0,.45,.01,{rough:.7});
  R(g,0x7a4a2a,2,.055,.95,1,.72,.45,.03,{rough:.42});R1(g,0x2f4a3c,1.1,.006,.5,.95,.775,.38,.02,{rough:.85});
  for(const y of[.18,.42])RV(g,I46.walnutL,.42,.2,.012,1.62,y,.035,.008,{rough:.5});
  recMonitor(g,1.42,.775,.3,-1);kbd(g,1.35,.775,.13);
  lamp(g,.28,.775,.25,0xb08d3a);B(g,0xd4af37,.2,.05,.06,.62,.775,.62,{rough:.3,metal:.7});B(g,0x2b2b2b,.17,.025,.005,.62,.79,.651,{rough:.6});
  paperStack(g,.88,.775,.4,4,.22,.3,.2);pens(g,.55,.775,.22);mug(g,1.12,.775,.6,0x37506b);
  C(g,0x6b4430,.06,.02,1.8,.775,.62,{rough:.5});Sph(g,0x4f86c6,.075,1.8,.88,.62,{rough:.45});Tor(g,0xb08d3a,.08,1.8,.88,.62,0,0,{rough:.3,metal:.7});
 },
 aquarium(g){
  // Walnut stand, rimless tank with water, gravel, plants, rock, lit lid. 'fish' names preserved.
  groundShadow(g,.95,.55,.5,.35,.22);
  R(g,I46.walnut,.9,.68,.5,.5,0,.35,.02,{rough:.55});for(const x of[.28,.72])RV(g,I46.walnutL,.4,.5,.012,x,.08,.605,.008,{rough:.5});
  for(const x of[.44,.56])B(g,0xb08d3a,.012,.08,.015,x,.32,.615,{rough:.3,metal:.7});
  R1(g,0x2e3a40,.88,.02,.48,.5,.68,.35,.01,{rough:.5});
  R1(g,0xd9c7a2,.82,.05,.42,.5,.70,.35,.01,{rough:.95});
  for(let i=0;i<9;i++){const x=.15+i*.08,h=.18+((i*37)%5)*.06;const b=B(g,i%3?0x4f9a4a:0x6aa84f,.015,h,.008,x,.74,.22+((i*13)%3)*.05,{rough:.7});b.rotation.z=(i%2?-1:1)*.12}
  Sph(g,0x8a8f8c,.09,.72,.76,.4,{rough:.9}).scale.set(.11,.07,.08);
  const w=B(g,0x5ec8f0,.84,.56,.44,.5,.705,.35,{op:.32,rough:.1});w.renderOrder=2;w.material.userData.noCastShadow=true;
  R1(g,0x2e3a40,.88,.035,.48,.5,1.27,.35,.01,{rough:.45});B(g,0xe8f6ff,.6,.006,.06,.5,1.268,.35,{em:0x88aacc});
  for(let i=0;i<3;i++){const f=Sph(g,[0xffa500,0xffe060,0xff6050][i],.05,.3+i*.2,.95+i*.07,.35,{em:0x442200});f.name='fish';f.scale.set(.055,.035,.022)}
 },
});
// ---------- batch B/C/D: clinical machines (named parts + support heights preserved) ----------
function wheel(g,x,z,c=0x39434c){const w=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.025,12),mat(c,{rough:.5}));w.rotation.z=Math.PI/2;w.position.set(x,.035,z);w.castShadow=true;g.add(w);B(g,0x9aa6ae,.012,.05,.03,x,.035,z,{rough:.3,metal:.6})}
function holeSlab(g,c,w,h,d,hr,x,y,z,o={}){
 // rounded rectangular slab (w x h, depth d along z) with a circular through-hole of radius hr, centred at (x,y,z)
 const r=.12,sh=new THREE.Shape(),X=-w/2,Y=-h/2;sh.moveTo(X+r,Y);sh.lineTo(X+w-r,Y);sh.quadraticCurveTo(X+w,Y,X+w,Y+r);sh.lineTo(X+w,Y+h-r);sh.quadraticCurveTo(X+w,Y+h,X+w-r,Y+h);sh.lineTo(X+r,Y+h);sh.quadraticCurveTo(X,Y+h,X,Y+h-r);sh.lineTo(X,Y+r);sh.quadraticCurveTo(X,Y,X+r,Y);
 const hp=new THREE.Path();hp.absarc(0,0,hr,0,Math.PI*2,true);sh.holes.push(hp);
 const geo=new THREE.ExtrudeGeometry(sh,{depth:d-.03,bevelEnabled:true,bevelSize:.015,bevelThickness:.015,bevelSegments:2,curveSegments:20});geo.translate(0,0,-(d-.03)/2);
 const m=new THREE.Mesh(geo,mat(c,o));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m}
Object.assign(F,{
 scanner(g){
  // CT: rounded pedestal (same extents), patient slide 'slide' unchanged (.55-.63), gantry with real bore r .40, 'glow' ring kept.
  groundShadow(g,1.05,1.95,.5,1.05,.22);
  R(g,I46.white,.6,.5,1.7,.5,0,1.05,.08,{rough:.45});R1(g,0x8fa9b8,.5,.05,1.56,.5,0,1.07,.06,{rough:.5});
  B(g,0x5d8fb0,.605,.03,1.5,.5,.42,1.07,{rough:.45});
  B(g,0xd5e7f0,.5,.08,1.4,.5,.55,1.1).name='slide';
  R1(g,0x9eb4c0,.46,.012,1.3,.5,.635,1.15,.04,{rough:.6});
  const ring=new THREE.Group();ring.position.set(.5,.95,.35);g.add(ring);
  const r2=new THREE.Mesh(new THREE.TorusGeometry(.42,.03,8,40),mat(SCREEN,{em:0x3399cc}));r2.position.z=.2;r2.name='glow';ring.add(r2);
  holeSlab(g,I46.white,1.0,1.3,.4,.40,.5,.95,.35,{rough:.4});
  holeSlab(g,0xc9d6dd,.86,1.14,.42,.405,.5,.95,.35,{rough:.5});
  const bore=new THREE.Mesh(new THREE.CylinderGeometry(.405,.405,.40,32,1,true),mat(0xdfe8ee,{rough:.5,side:THREE.BackSide}));bore.rotation.x=Math.PI/2;bore.position.set(.5,.95,.35);g.add(bore);
  R1(g,0xb8c6ce,.98,.08,.42,.5,0,.35,.04,{rough:.5});
  RV(g,0x26343e,.2,.12,.01,.82,1.36,.56,.012,{rough:.4});const sc=B(g,0xffffff,.17,.09,.004,.82,1.375,.566,{map:TEX.ui,rough:.45,em:0x183344});sc.material.emissiveMap=TEX.ui;
  for(let i=0;i<3;i++)Sph(g,[0x6fd38a,0xffc857,0x6fb6ff][i],.008,.18+i*.04,1.42,.565,{em:[0x2a7a40,0x7a5a10,0x1a4a7a][i]});
  B(g,0x5d8fb0,.86,.025,.004,.5,.36,.566,{rough:.45});
 },
 bed(g){
  // Hospital bed: wheeled steel base, rounded mattress (top stays .61), blanket, pillow, panelled head/foot boards, IV stand.
  groundShadow(g,1.0,2.0,.5,1,.24);
  for(const[x,z]of[[.12,.12],[.88,.12],[.12,1.88],[.88,1.88]]){B(g,0x8f9aa2,.04,.3,.04,x,.05,z,{rough:.3,metal:.6});wheel(g,x,z)}
  B(g,0xa9b4bb,.8,.04,.04,.5,.18,.12,{rough:.3,metal:.6});B(g,0xa9b4bb,.8,.04,.04,.5,.18,1.88,{rough:.3,metal:.6});B(g,0xa9b4bb,.05,.04,1.7,.5,.18,1,{rough:.3,metal:.6});
  R(g,0xc6d0d6,.9,.12,1.9,.5,.35,1,.05,{rough:.35,metal:.35});
  R(g,0xf7f8f5,.84,.14,1.84,.5,.47,1,.06,{rough:.75});
  R(g,0x8fc3e8,.88,.055,1.12,.5,.555,1.31,.05,{rough:.85});R1(g,0xf7f8f5,.88,.03,.18,.5,.6,.83,.03,{rough:.8});
  R(g,0xffffff,.6,.1,.3,.5,.6,.3,.08,{rough:.8});
  RV(g,0x7fa6bd,.9,.48,.05,.5,.37,.06,.04,{rough:.45});RV(g,I46.white,.78,.32,.012,.5,.45,.08,.03,{rough:.5});
  RV(g,0x7fa6bd,.9,.3,.05,.5,.35,1.99,.04,{rough:.45});
  B(g,0x5b4636,.2,.26,.012,.5,.36,2.02,{rough:.6});B(g,0xffffff,.17,.2,.004,.5,.39,2.027,{rough:.85});B(g,0xd0d6da,.08,.02,.01,.5,.62,2.028,{rough:.3,metal:.6});
  // IV stand (outside the mattress, head end, original pole spot)
  for(let i=0;i<5;i++){const a=i*1.2566;const l=B(g,0x9aa6ae,.14,.015,.02,.92+Math.cos(a)*.06,.02,.15+Math.sin(a)*.06,{rough:.3,metal:.6});l.rotation.y=-a}
  C(g,STEEL,.012,1.62,.92,.02,.15,{rough:.3,metal:.7},1);B(g,STEEL,.16,.012,.012,.92,1.62,.15,{rough:.3,metal:.7});
  const bag=R1(g,0xdff1fb,.11,.18,.035,.92,1.42,.15,.02,{op:.75,rough:.2});bag.material.userData.noCastShadow=true;B(g,0xbfe6ff,.08,.08,.03,.92,1.43,.15,{rough:.3});
  wire(g,[[.92,1.42,.15],[.9,1.0,.18],[.82,.75,.25],[.7,.66,.35]],.004,0xdfe8ee);
 },
 shelf(g){
  // Pharmacy shelving: white carcass, oak shelves, labelled stock.
  groundShadow(g,.95,.42,.5,.2,.2);
  shell46(g,I46.white,.9,1.8,.35,.5,.2,{rough:.5});B(g,0xe9edeb,.84,1.68,.01,.5,.07,.04,{rough:.6});
  for(const y of[.07,.45,.85,1.25])R1(g,I46.oak,.84,.03,.32,.5,y,.21,.01,{rough:.5});
  const P=[0xffffff,0x9fc4e0,0xf1d27a,0xe7b1b1,0xbfe0d4,0xd8a35a];
  let k=0;for(const y of[.1,.48,.88]){let x=.12;while(x<.86){const t=(k*7)%5,w=.07+(t%3)*.025,h=.1+(t%4)*.04;if(t<2)bottle(g,x+w/2,y,.27,[0x7fb7d8,0xd8a35a,0xffffff,0x9ccf8f,0xb98cff][k%5],h,w*.4);else boxPack(g,x+w/2,y,.27,P[k%6],w,h,.12);x+=w+.012;k++}}
  B(g,0x6aa0b8,.6,.06,.012,.5,1.62,.37,{rough:.5});B(g,0xffffff,.3,.03,.004,.5,1.635,.377,{rough:.6});
  R1(g,0xf4f3ee,.92,.03,.36,.5,1.8,.2,.01,{rough:.45});
 },
 tubes(g){
  // Lab bench (top kept at .91): white cabinets, epoxy top, tube rack, centrifuge, microscope, sample dish.
  groundShadow(g,1.95,.7,1,.4,.22);
  R1(g,I46.white,1.8,.8,.56,1,.03,.42,.02,{rough:.5});R1(g,0x8fa2ab,1.72,.05,.5,1,0,.42,.015,{rough:.6});
  for(const x of[.35,.8,1.25,1.65])RV(g,0xe5ebea,.4,.62,.012,x,.12,.705,.008,{rough:.55});
  for(const x of[.35,.8,1.25,1.65])B(g,0x8a979e,.12,.014,.015,x,.68,.715,{rough:.3,metal:.6});
  R(g,0x36454f,1.84,.06,.62,1,.85,.4,.02,{rough:.35});
  R1(g,0xd5dde2,.42,.05,.12,.55,.91,.35,.01,{rough:.4,metal:.4});
  for(let i=0;i<6;i++){const c=[0xe03a3a,0x3ac03a,0x3a90f0,0xf0c03a,0xe03ae0,0xf08a3a][i];C(g,0xe8f4f8,.018,.17,.36+i*.075,.93,.35,{op:.5,rough:.15},1);C(g,c,.016,.08,.36+i*.075,.94,.35,{em:0x111111,rough:.3},1)}
  C(g,0xdde0ee,.18,.22,1.4,.91,.4,{rough:.4});C(g,DARK,.16,.04,1.4,1.13,.4);C(g,0x8fbfe0,.11,.012,1.4,1.17,.4,{op:.6,rough:.2});
  // microscope
  R1(g,0x39434c,.16,.03,.2,1.75,.91,.35,.02,{rough:.5});B(g,0x39434c,.04,.26,.05,1.75,.94,.27,{rough:.5});const t=C(g,0xe9eef0,.025,.18,1.75,1.12,.33,{rough:.4},1);t.rotation.x=.5;C(g,0x39434c,.05,.012,1.75,1.0,.36,{rough:.5});
  C(g,0xe8f4f8,.06,.015,1.05,.91,.55,{op:.5,rough:.2});C(g,0xd9534f,.04,.004,1.05,.915,.55,{rough:.6});
  bottle(g,1.2,.91,.25,0x9ccf8f,.14,.035);bottle(g,1.1,.91,.22,0xffffff,.1,.028);
 },
 xray(g){
  // Plate (h .06, box[.1,.9,.1,.7]) kept; columns, detector frame around 'xglow', tube head, control box.
  groundShadow(g,.95,.75,.5,.4,.22);
  R1(g,0x9aa9b2,.8,.06,.6,.5,0,.4,.03,{rough:.4,metal:.4});B(g,0x5d8fb0,.62,.004,.42,.5,.06,.42,{rough:.6});
  for(const x of[.38,.62])B(g,0xffd25a,.08,.003,.16,x,.064,.45,{rough:.6});
  for(const x of[.12,.88]){R1(g,0xdfe6ea,.09,2,.09,x,0,.2,.02,{rough:.4});B(g,0x5d8fb0,.092,.06,.092,x,1.0,.2,{rough:.5})}
  RV(g,0xdfe6ea,.78,1.5,.08,.5,.35,.17,.03,{rough:.4});
  const p=B(g,0x9fe8b0,.7,1.4,.06,.5,.4,.2,{em:0x1b4a2a});p.name='xglow';
  R1(g,0xdfe6ea,.4,.22,.32,.5,1.86,.27,.04,{rough:.4});C(g,0x39434c,.07,.06,.5,1.8,.33,{rough:.5});B(g,0xffd25a,.12,.03,.004,.5,1.98,.431,{rough:.5});
  B(g,0xdfe6ea,.9,.06,.1,.5,2.0,.2,{rough:.4});
 },
 uvlamp(g){
  // Derma UV lamp: weighted 5-caster base, column, jointed arm, housing; emissive 'uv' kept.
  for(let i=0;i<5;i++){const a=i*1.2566;const l=B(g,0x39434c,.22,.025,.035,.5+Math.cos(a)*.1,.04,.5+Math.sin(a)*.1,{rough:.45,metal:.3});l.rotation.y=-a;caster(g,.5+Math.cos(a)*.21,.5+Math.sin(a)*.21)}
  C(g,DARK,.07,.06,.5,.03,.5,{rough:.4});C(g,0xd5dde2,.03,1.45,.5,.08,.5,{rough:.3,metal:.6});Sph(g,0x39434c,.04,.5,1.53,.5,{rough:.4});
  const arm=B(g,0xd5dde2,.035,.035,.18,.5,1.53,.56,{rough:.3,metal:.6});
  R1(g,0xe9eef0,.54,.1,.34,.5,1.6,.62,.04,{rough:.4});B(g,0x5d4a8a,.54,.02,.34,.5,1.69,.62,{rough:.45});
  const l=B(g,0xb98cff,.44,.03,.24,.5,1.6,.6,{em:0x7a3cff});l.name='uv';
  for(const s of[-1,1])B(g,0x39434c,.03,.05,.03,.5+s*.29,1.62,.62,{rough:.4});
 },
 organfridge(g){
  // Medical fridge: rounded body, glass door with lit interior and organ boxes, display, alarm lamp.
  groundShadow(g,.65,.6,.5,.4,.2);
  R(g,0xeef2f6,.6,.92,.55,.5,0,.4,.04,{rough:.4});
  B(g,0x5ab0ff,.5,.25,.02,.5,.55,.68,{em:0x113355});
  B(g,0xe8f6ff,.48,.24,.004,.5,.555,.691,{op:.25,rough:.1});
  for(const x of[.36,.5,.64])R1(g,[0xf3f3f3,0xd9534f,0xf3f3f3][Math.round((x-.36)/.14)],.1,.08,.08,x,.6,.62,.012,{rough:.6});
  B(g,0xe33,.2,.06,.02,.5,.4,.68,{em:0x550000});
  RV(g,0xdbe3e8,.5,.28,.012,.5,.08,.69,.01,{rough:.5});B(g,0x8a979e,.014,.18,.02,.7,.45,.7,{rough:.3,metal:.6});
  Sph(g,0xff5050,.02,.72,.94,.6,{em:0x991010});B(g,0xffd25a,.14,.03,.004,.4,.84,.676,{rough:.6});
 },
 pumpmachine(g){
  // Deflation pump: rounded cabinet on wheels, big gauge (named 'needle'), bellows, hose reel, buttons.
  groundShadow(g,.75,.65,.5,.4,.22);
  for(const[x,z]of[[.28,.22],[.72,.22],[.28,.6],[.72,.6]])wheel(g,x,z);
  R(g,0xd1d9e0,.7,.08,.6,.5,.04,.4,.03,{rough:.5});
  R(g,0x6a8caf,.6,1.0,.5,.5,.1,.4,.05,{rough:.45});RV(g,0x7fa0c0,.5,.36,.012,.5,.18,.655,.02,{rough:.5});
  for(let i=0;i<3;i++)B(g,0x4e6f90,.4,.012,.004,.5,.26+i*.1,.663,{rough:.5});
  C(g,0xf4f3ee,.19,.03,.5,.8,.655,{rough:.4});const ring=C(g,0x39434c,.2,.02,.5,.8,.65,{rough:.4});
  for(const m of g.children.slice(-2))m.rotation.x=Math.PI/2;
  C(g,0xffd166,.17,.04,.5,.8,.66,{em:0x332200});const n=B(g,0xe33,.02,.12,.02,.5,.82,.68);n.name='needle';
  for(let i=0;i<4;i++)Tor(g,0x39434c,.11-i*.004,.5,1.13+i*.045,.4,Math.PI/2,0,{rough:.6});C(g,0x2f3a44,.12,.02,.5,1.1,.4);C(g,0x2f3a44,.1,.02,.5,1.31,.4);
  Tor(g,0x3a6ea5,.1,.82,.85,.4,0,Math.PI/2,{rough:.5});C(g,0x39434c,.04,.06,.82,.85,.4,{rough:.4});
  for(let i=0;i<3;i++)Sph(g,[0x6fd38a,0xffc857,0xff6b6b][i],.018,.32+i*.06,1.0,.66,{em:[0x2a7a40,0x7a5a10,0x7a2020][i]});
 },
 inflator(g){
  // Inflation compressor: rounded orange cabinet, vented panel, gauge (named 'needle'), banded tank + dome reservoir, wheels.
  groundShadow(g,.7,.6,.5,.35,.22);
  for(const[x,z]of[[.28,.15],[.72,.15],[.28,.55],[.72,.55]])wheel(g,x,z);
  R(g,0xf08a5d,.55,.85,.5,.5,.05,.35,.05,{rough:.45});
  for(let i=0;i<5;i++)B(g,0xc8643a,.36,.012,.004,.5,.2+i*.05,.603,{rough:.5});
  C(g,0xffd166,.13,.03,.5,.55,.6);
  const n=B(g,DARK,.02,.1,.02,.5,.55,.61);n.name='needle';
  C(g,0xfff0a0,.16,.5,.5,.9,.35,{rough:.35});for(const y of[1.0,1.25])C(g,0xc8643a,.165,.03,.5,y,.35,{rough:.5});
  Sph(g,0xfff0a0,.16,.5,1.4,.35,{rough:.35});C(g,0x9aa6ae,.025,.08,.5,1.54,.35,{rough:.3,metal:.6});
  Sph(g,0x6fd38a,.016,.32,.78,.6,{em:0x2a7a40});Sph(g,0xff6b6b,.016,.68,.78,.6,{em:0x7a2020});
 },
 dnaseq(g){
  // Sequencer: rounded instrument, wide screen, glass dome with helix, sample tray, LEDs.
  groundShadow(g,.85,.65,.5,.4,.22);
  R(g,0xe9eef3,.8,.88,.6,.5,0,.4,.05,{rough:.45});RV(g,0xd9e1e8,.7,.5,.012,.5,.1,.705,.02,{rough:.5});
  for(let i=0;i<3;i++)B(g,0xb8c4cc,.6,.01,.004,.5,.2+i*.12,.712,{rough:.5});
  B(g,STEEL,.6,.05,.3,.5,.55,.65);
  R(g,0xe9eef3,.8,.62,.36,.5,.88,.28,.05,{rough:.45});
  B(g,DARK,.6,.4,.02,.5,.95,.47);const scr=B(g,0xffffff,.54,.32,.004,.5,.99,.482,{map:TEX.ui,rough:.45,em:0x183344});scr.material.emissiveMap=TEX.ui;
  const dome=C(g,0xd8edf2,.13,.32,.22,1.5,.3,{op:.25,rough:.1});dome.material.userData.noCastShadow=true;C(g,0x39434c,.14,.03,.22,1.5,.3,{rough:.4});
  for(let i=0;i<10;i++){const a=i*.9;Sph(g,i%2?0xff5a5a:0x5aaaff,.016,.22+Math.cos(a)*.06,1.54+i*.026,.3+Math.sin(a)*.06,{em:0x222222});Sph(g,i%2?0x5aaaff:0xff5a5a,.016,.22-Math.cos(a)*.06,1.54+i*.026,.3-Math.sin(a)*.06,{em:0x222222})}
  for(let i=0;i<8;i++){Sph(g,i%2?0xff5a5a:0x5aaaff,.04,.5+Math.cos(i)*.15,.95+i*.04,.72,{em:0x222222}).scale.setScalar(.012)}
  for(let i=0;i<4;i++)Sph(g,[0x6fd38a,0x6fd38a,0xffc857,0x6fb6ff][i],.01,.62+i*.04,1.42,.47,{em:0x335533});
 },
 elchair(g){
  // Electrotherapy chair (seat top .50 = SEATH.elchair): padded treatment chair, armrests, footrest, two coil towers; 'spark' kept.
  groundShadow(g,.95,.8,.5,.5,.22);
  R1(g,0x39434c,.5,.06,.5,.5,0,.5,.04,{rough:.45,metal:.3});C(g,0x9aa6ae,.04,.3,.5,.06,.5,{rough:.3,metal:.6});
  R1(g,0x39434c,.48,.06,.46,.5,.36,.5,.04,{rough:.45});R(g,0x50426a,.48,.08,.46,.5,.42,.5,.06,{rough:.8});
  const back=R(g,0x50426a,.46,.07,.6,.5,0,0,.08,{rough:.8});back.geometry.rotateX(Math.PI/2);back.position.set(.5,.82,.29);back.rotation.x=-.18;
  R1(g,0x50426a,.26,.12,.08,.5,1.13,.26,.04,{rough:.8});
  for(const s of[-1,1]){B(g,0x39434c,.03,.16,.03,.5+s*.255,.48,.52,{rough:.45});R1(g,0x5e5080,.07,.04,.36,.5+s*.255,.63,.52,.02,{rough:.7})}
  B(g,0x50426a,.5,.06,.3,.5,.42,.7);R1(g,0x39434c,.44,.03,.2,.5,.12,.84,.02,{rough:.5});
  for(const s of[-1,1]){R1(g,0x39434c,.12,.08,.12,.5+s*.35,0,.3,.03,{rough:.5});C(g,0xc58b2b,.06,.6,.5+s*.35,.4,.3);for(let i=0;i<4;i++)Tor(g,0xd9a04a,.07,.5+s*.35,.5+i*.12,.3,Math.PI/2,0,{rough:.35,metal:.5});C(g,0x9aa6ae,.012,.1,.5+s*.35,.98,.3,{rough:.3,metal:.6});Sph(g,0x9ff,.08,.5+s*.35,1.05,.3,{em:0x66ccff}).name='spark'}
  wire(g,[[.15,.5,.3],[.2,.9,.25],[.38,1.15,.3]],.006,0x39434c);wire(g,[[.85,.5,.3],[.8,.9,.25],[.62,1.15,.3]],.006,0x39434c);
 },
 rebootpod(g){
  // Reboot pod: base cylinder (disc .42, h .12) and 'podglass' kept EXACTLY; base light ring, chrome bands, domed cap with vents.
  C(g,0xdfe6ee,.42,.12,.5,0,.5);C(g,0xb9c6d0,.44,.025,.5,0,.5,{rough:.4,metal:.3});
  const gl=C(g,0x9fd8ff,.38,1.8,.5,.12,.5,{op:.35});gl.name='podglass';
  C(g,0xdfe6ee,.42,.14,.5,1.92,.5);C(g,0x6ff,.4,.02,.5,1.9,.5,{em:0x2299aa});
  const dome=Sph(g,0xdfe6ee,.4,.5,2.06,.5,{rough:.4});dome.scale.set(.4,.1,.4);
  for(let i=0;i<6;i++){const a=i*1.047;B(g,0x8fa2ab,.08,.01,.02,.5+Math.cos(a)*.25,2.12,.5+Math.sin(a)*.25,{rough:.5}).rotation.y=-a}
  Tor(g,0xb9c6d0,.425,.5,.12,.5,Math.PI/2,0,{rough:.3,metal:.6});Tor(g,0xb9c6d0,.425,.5,1.92,.5,Math.PI/2,0,{rough:.3,metal:.6});
  Tor(g,0x9ff7ff,.43,.5,.03,.5,Math.PI/2,0,{em:0x2299aa});
 },
});
// ---------- INTERIOR46 back-wall decor (visual only, inside non-walkable perimeter tiles) ----------
// Local frame: x 0..1 along the wall, wall face at z=.22 (TH), items stay within z<=.62 (characters on the adjacent tile are >.78 from the face).
TEX.i46post=loadTex('assets/tex/i46_posters.png',1);TEX.i46post.wrapS=TEX.i46post.wrapT=THREE.ClampToEdgeWrapping;
const WZ=.22;
function atlasPlane(w,h,u0,u1,v0,v1){const geo=new THREE.PlaneGeometry(w,h),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++){uv.setXY(i,u0+(u1-u0)*uv.getX(i),v0+(v1-v0)*uv.getY(i))}uv.needsUpdate=true;return geo}
function poster(g,slot,x,y,w=.3,h=.45,frame=0x5b4636){B(g,frame,w+.03,h+.03,.014,x,y-.015,WZ+.007,{rough:.6});const u0=(slot%8)/8,v0=slot<8?.5:0;const m=new THREE.Mesh(atlasPlane(w,h,u0,u0+1/8,v0,v0+.5),mat(0xffffff,{map:TEX.i46post,rough:.8}));m.position.set(x,y+h/2,WZ+.0155);m.receiveShadow=true;g.add(m);return m}
function clock(g,x,y,r=.11){C(g,0x39434c,r+.012,.03,x,y,WZ+.015,{rough:.5}).rotation.x=Math.PI/2;const geo=new THREE.CircleGeometry(r,24),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,7/8+uv.getX(i)/8,.25+uv.getY(i)*.25);const m=new THREE.Mesh(geo,mat(0xffffff,{map:TEX.i46post,rough:.8}));m.position.set(x,y,WZ+.032);g.add(m)}
function sanitizer(g,x,y){R1(g,0xf4f6f4,.09,.16,.07,x,y,WZ+.035,.015,{rough:.45});B(g,0x4f9c98,.07,.05,.004,x,y+.09,WZ+.071,{rough:.5});B(g,0x9aa6ae,.03,.02,.03,x,y-.005,WZ+.06,{rough:.3,metal:.6})}
function pedalBin(g,x){C(g,0xdfe6ea,.1,.3,x,0,WZ+.13,{rough:.35,metal:.4});C(g,0xb9c6d0,.105,.02,x,.3,WZ+.13,{rough:.35,metal:.5});B(g,0x39434c,.06,.015,.04,x,.01,WZ+.25,{rough:.5})}
function radiator46(g,x=.5){for(let i=0;i<9;i++)R1(g,0xf4f4f0,.055,.38,.07,x-.32+i*.08,.13,WZ+.06,.012,{rough:.45});B(g,0xe6e6e0,.7,.03,.05,x,.12,WZ+.06,{rough:.4});C(g,0xd5dde2,.012,.13,x+.38,0,WZ+.06,{rough:.3,metal:.6},1)}
function lowcab(g,top='plant',col=I46.white,wood=false){R1(g,col,.84,.5,.38,.5,0,WZ+.19,.02,{rough:.5});for(const x of[.29,.71])RV(g,wood?I46.walnutL:0xe6ebea,.38,.4,.012,x,.05,WZ+.385,.008,{rough:.5});for(const x of[.46,.54])B(g,0x8a979e,.012,.08,.015,x,.3,WZ+.39,{rough:.3,metal:.6});R1(g,wood?I46.oak:0xf4f3ee,.88,.03,.4,.5,.5,WZ+.2,.015,{rough:.45});
 if(top==='plant'){C(g,0xe2d7c2,.07,.12,.25,.53,WZ+.2,{rough:.55});for(let i=0;i<7;i++){const a=i*.9,m=Sph(g,i%2?0x5c914e:0x4e854a,.07,.25+Math.cos(a)*.05,.7+(i%3)*.03,WZ+.2+Math.sin(a)*.05,{rough:.7});m.scale.set(.06,.035,.03);m.rotation.y=a}paperStack(g,.68,.53,WZ+.2,2,.2,.26)}
 else if(top==='books'){for(let i=0;i<6;i++)B(g,[0xb03a3a,0x3a62a8,0x3a9a5a,0xc9a43a,0x6a4a9a,0x7a7a7a][i],.04,.2+(i%3)*.03,.16,.55+i*.045,.53,WZ+.2,{rough:.7});succulent(g,.22,.53,WZ+.2)}
 else if(top==='boxes'){boxPack(g,.3,.53,WZ+.2,0xffffff,.18,.12,.16);boxPack(g,.55,.53,WZ+.2,0x9fc4e0,.16,.09,.14);bottle(g,.75,.53,WZ+.2,0x7fb7d8,.14,.035)}}
function counter46(g,sink=true,col=I46.white){
 R1(g,col,.86,.8,.4,.5,0,WZ+.2,.02,{rough:.5});R1(g,0x8fa2ab,.82,.06,.36,.5,0,WZ+.2,.015,{rough:.6});
 for(const x of[.29,.71])RV(g,0xe6ebea,.4,.66,.012,x,.08,WZ+.405,.008,{rough:.5});for(const x of[.46,.54])B(g,0x8a979e,.012,.1,.015,x,.6,WZ+.41,{rough:.3,metal:.6});
 R(g,0xe9e4d8,.9,.04,.43,.5,.8,WZ+.21,.02,{map:TEX.recStone,rough:.4});
 if(sink){R1(g,0xc9d3d8,.36,.012,.26,.42,.835,WZ+.22,.04,{rough:.25,metal:.5});B(g,0x7d8b93,.3,.004,.2,.42,.84,WZ+.22,{rough:.3,metal:.6});C(g,0xd5dde2,.015,.2,.42,.84,WZ+.06,{rough:.2,metal:.8},1);B(g,0xd5dde2,.02,.02,.12,.42,1.02,WZ+.11,{rough:.2,metal:.8});C(g,0xd5dde2,.012,.05,.5,.84,WZ+.06,{rough:.2,metal:.8},1);sanitizer(g,.78,1.02);
  R1(g,0xf4f6f4,.24,.28,.1,.42,1.22,WZ+.05,.02,{rough:.45});B(g,0xffffff,.16,.03,.03,.42,1.21,WZ+.1,{rough:.8})}
 else{boxPack(g,.25,.84,WZ+.2,0xffffff,.18,.1,.16);bottle(g,.5,.84,WZ+.18,0x9ccf8f,.15,.035);bottle(g,.58,.84,WZ+.24,0xffffff,.1,.028);R1(g,0xdde6ea,.22,.06,.18,.78,.84,WZ+.2,.02,{rough:.6})}
 R1(g,col,.86,.34,.3,.5,1.22,WZ+.15,.02,{rough:.5});for(const x of[.29,.71])RV(g,0xe6ebea,.4,.3,.012,x,1.24,WZ+.305,.008,{rough:.5})}
function trolley(g,x=.5){for(const[dx,dz]of[[-.2,.1],[.2,.1],[-.2,.34],[.2,.34]]){C(g,0x9aa6ae,.012,.8,x+dx,.04,WZ+dz,{rough:.3,metal:.6},1);caster(g,x+dx,WZ+dz)}
 R1(g,0xe9eef0,.48,.5,.3,x,.2,WZ+.22,.02,{rough:.45});for(let i=0;i<4;i++){RV(g,[0x5d8fb0,0x4f9c98,0xd9a04a,0xc06060][i],.44,.1,.01,x,.22+i*.12,WZ+.375,.006,{rough:.5});B(g,0xd5dde2,.1,.012,.012,x,.27+i*.12,WZ+.385,{rough:.3,metal:.6})}
 R1(g,0xd5dde2,.52,.025,.34,x,.82,WZ+.22,.02,{rough:.3,metal:.5});boxPack(g,x-.12,.845,WZ+.2,0xffffff,.14,.07,.12);bottle(g,x+.1,.845,WZ+.22,0x7fb7d8,.12,.03);C(g,0xdfe6ea,.06,.03,x+.16,.845,WZ+.12,{rough:.3,metal:.6})}
function oxygen(g,x=.5){for(const dx of[-.12,.12]){C(g,0x3f8f5a,.08,.95,x+dx,0,WZ+.13,{rough:.4});Sph(g,0x3f8f5a,.08,x+dx,.95,WZ+.13,{rough:.4}).scale.set(.08,.05,.08);C(g,0xf4f4f0,.081,.12,x+dx,.78,WZ+.13,{rough:.4});C(g,0xb08d3a,.02,.08,x+dx,1.0,WZ+.13,{rough:.3,metal:.7})}B(g,0x9aa6ae,.42,.03,.03,x,.6,WZ+.04,{rough:.3,metal:.6})}
function gasRail(g){R1(g,0xe9eef0,.9,.14,.07,.5,1.02,WZ+.035,.02,{rough:.45});for(const[x,c]of[[.2,0x3f8f5a],[.34,0xf4f4f4],[.48,0xf0c040],[.62,0x3f6fb0]]){C(g,c,.025,.02,x,1.09,WZ+.075,{rough:.4}).rotation.x=Math.PI/2}C(g,0xdfe8ee,.03,.12,.8,.86,WZ+.1,{op:.6,rough:.2});B(g,0x3f8f5a,.05,.04,.04,.8,.98,WZ+.1,{rough:.4})}
function vitals(g,x=.5,y=1.25){B(g,0x9aa6ae,.04,.04,.12,x,y,WZ+.06,{rough:.3,metal:.6});R1(g,0x39434c,.32,.24,.06,x,y-.04,WZ+.14,.02,{rough:.45});const s=B(g,0xffffff,.27,.18,.004,x,y-.01,WZ+.172,{map:TEX.ui,rough:.45,em:0x183344});s.material.emissiveMap=TEX.ui}
function bookshelf46(g,h=1.5,col=I46.walnut){shell46(g,col,.86,h,.32,.5,WZ+.16);B(g,0x4c2f20,.8,h-.1,.01,.5,.05,WZ+.035,{rough:.7});
 let k=0;for(let y=.06;y<h-.3;y+=.34){R1(g,I46.walnutL,.82,.025,.3,.5,y,WZ+.17,.01,{rough:.5});let x=.12;while(x<.84){const w=.03+(k%3)*.01,hh=.2+((k*7)%4)*.025;const b=B(g,[0xb03a3a,0x3a62a8,0x3a9a5a,0xc9a43a,0x6a4a9a,0x7a7a7a,0xd8c8a8][k%7],w,hh,.2,x+w/2,y+.025,WZ+.2,{rough:.7});if(k%11===5)b.rotation.z=.15;x+=w+.004;k++}}}
function filing(g){R1(g,0x8796a0,.48,1.3,.4,.5,0,WZ+.2,.015,{rough:.45,metal:.2});for(let i=0;i<4;i++){RV(g,0x9aa8b2,.42,.28,.01,.5,.04+i*.315,WZ+.405,.006,{rough:.4,metal:.2});B(g,0xd5dde2,.12,.02,.02,.5,.26+i*.315,WZ+.415,{rough:.3,metal:.6});B(g,0xffffff,.08,.035,.004,.5,.2+i*.315,WZ+.412,{rough:.8})}binder(g,.34,1.3,WZ+.18,0x4f798e);paperStack(g,.62,1.3,WZ+.2,3,.2,.26)}
function fridge(g){R(g,0xf4f6f4,.6,1.5,.38,.5,0,WZ+.19,.04,{rough:.4});B(g,0xd5dde2,.56,.01,.01,.5,.95,WZ+.385,{rough:.4});for(const y of[.6,1.15])B(g,0xb9c6d0,.03,.22,.03,.74,y,WZ+.4,{rough:.3,metal:.6});B(g,0xf1d27a,.08,.08,.004,.35,1.2,WZ+.382,{rough:.8});B(g,0xe7b1b1,.07,.09,.004,.42,1.05,WZ+.382,{rough:.8})}
function cooler(g,x=.5){R1(g,0xe9eef0,.3,.95,.3,x,0,WZ+.17,.03,{rough:.45});const b=C(g,0x9fd3f0,.12,.38,x,.95,WZ+.17,{op:.55,rough:.15});b.material.userData.noCastShadow=true;for(const dx of[-.06,.06])B(g,dx<0?0x3f6fb0:0xc04040,.03,.04,.04,x+dx,.62,WZ+.33,{rough:.4});B(g,0x9aa6ae,.18,.02,.1,x,.45,WZ+.3,{rough:.3,metal:.5});for(let i=0;i<3;i++)C(g,0xffffff,.025,.06,x+.22,1.0-i*.03,WZ+.06,{rough:.6},1)}
function whiteboard(g){B(g,0xb9c6d0,.84,.6,.02,.5,.75,WZ+.01,{rough:.4,metal:.3});const u0=6/8;const m=new THREE.Mesh(atlasPlane(.8,.56,u0,u0+1/8,.05,.45),mat(0xffffff,{map:TEX.i46post,rough:.5}));m.position.set(.5,1.03,WZ+.022);g.add(m);B(g,0xb9c6d0,.6,.03,.06,.5,.73,WZ+.04,{rough:.4,metal:.3});for(const[x,c]of[[.3,0x3a5fc0],[.38,0xc04040],[.46,0x3a9a5a]])B(g,c,.06,.015,.015,x,.76,WZ+.05,{rough:.5})}
function tv(g,y=1.2){B(g,0x39434c,.08,.08,.06,.5,y+.1,WZ+.03,{rough:.4});R1(g,0x1e252c,.62,.38,.04,.5,y,WZ+.08,.012,{rough:.35});const s=B(g,0xffffff,.58,.34,.004,.5,y+.02,WZ+.101,{map:TEX.recSky,rough:.4,em:0x223344});s.material.emissiveMap=TEX.recSky;s.material.emissiveIntensity=.35}
function lightbox(g){R1(g,0xdfe6ea,.7,.5,.06,.5,.95,WZ+.03,.015,{rough:.4});const u0=5/8;const m=new THREE.Mesh(atlasPlane(.3,.44,u0,u0+1/8,0,.5),mat(0xffffff,{map:TEX.i46post,rough:.5,em:0x445566}));m.material.emissiveMap=TEX.i46post;m.position.set(.33,1.18,WZ+.061);g.add(m);const m2=m.clone();m2.position.x=.67;g.add(m2)}
function console46(g){R1(g,0xdfe6ea,.86,.04,.4,.5,.72,WZ+.2,.02,{rough:.45});R1(g,0xe9eef0,.32,.72,.36,.24,0,WZ+.2,.015,{rough:.5});for(const z of[.06,.36])B(g,0xc3ccd2,.04,.72,.04,.85,0,WZ+z,{rough:.3,metal:.6});recMonitor(g,.36,.76,WZ+.14,1);recMonitor(g,.72,.76,WZ+.14,1);kbd(g,.5,.76,WZ+.32);Sph(g,0xff5050,.02,.85,.78,WZ+.3,{em:0x991010})}
function apron(g){B(g,0x9aa6ae,.7,.03,.05,.5,1.32,WZ+.03,{rough:.3,metal:.6});for(const[x,c]of[[.28,0x3f6fb0],[.5,0x5a6a72],[.72,0x3f8f8a]]){R1(g,c,.18,.62,.04,x,.7,WZ+.07,.03,{rough:.8});B(g,0x9aa6ae,.02,.05,.04,x,1.3,WZ+.06,{rough:.3,metal:.6})}}
function elpanel(g){R1(g,0x8796a0,.5,.8,.18,.5,.6,WZ+.09,.015,{rough:.45,metal:.2});RV(g,0x9aa8b2,.44,.72,.01,.5,.64,WZ+.185,.006,{rough:.4});B(g,0xffd25a,.14,.12,.004,.5,1.18,WZ+.192,{rough:.6});for(let i=0;i<3;i++)Sph(g,[0x6fd38a,0xffc857,0xff6b6b][i],.012,.38+i*.06,.75,WZ+.195,{em:0x333333});wire(g,[[.4,.6,WZ+.06],[.4,.3,WZ+.06],[.42,0,WZ+.05]],.012,0x39434c);wire(g,[[.6,.6,WZ+.06],[.62,.3,WZ+.06],[.6,0,WZ+.05]],.012,0x39434c)}
function steelcab(g){R(g,0xc9d3d8,.84,1.5,.4,.5,0,WZ+.2,.02,{rough:.3,metal:.6});for(const x of[.29,.71]){RV(g,0xd5dde2,.39,1.38,.01,x,.06,WZ+.405,.006,{rough:.3,metal:.6});B(g,0x7d8b93,.015,.2,.02,x+(x<.5?.16:-.16),.7,WZ+.415,{rough:.3,metal:.6})}B(g,0xffffff,.16,.05,.004,.29,1.2,WZ+.412,{rough:.8})}
function shelfwall(g){lowcab(g,'boxes');for(const y of[1.0,1.32]){R1(g,0xf4f3ee,.84,.025,.22,.5,y,WZ+.11,.01,{rough:.45});for(const x of[.12,.88])B(g,0x9aa6ae,.02,.08,.18,x,y-.08,WZ+.09,{rough:.3,metal:.6})}
 for(let i=0;i<6;i++){const x=.16+i*.13;if(i%2)bottle(g,x,1.025,WZ+.11,[0x9ccf8f,0xb98cff,0xffffff,0x7fb7d8,0xf1d27a,0xe7b1b1][i],.14,.035);else C(g,0xe8f4f8,.045,.12,x,1.025,WZ+.11,{op:.5,rough:.15})}
 for(let i=0;i<5;i++)boxPack(g,.18+i*.16,1.345,WZ+.11,[0xffffff,0x9fc4e0,0xf1d27a,0xbfe0d4,0xffffff][i],.12,.1,.12)}
function defib(g){R1(g,0x3f9a5a,.3,.36,.12,.5,1.0,WZ+.06,.02,{rough:.45});B(g,0xffffff,.18,.12,.004,.5,1.18,WZ+.121,{rough:.6});B(g,0xffd25a,.06,.08,.004,.5,1.2,WZ+.123,{em:0x332200});poster(g,0,.18,.95,.22,.33)}
function mirror46(g){B(g,0xb9c6d0,.5,.64,.02,.4,.9,WZ+.01,{rough:.3,metal:.6});B(g,0xdcecf2,.46,.6,.004,.4,.92,WZ+.022,{rough:.12,em:0x3a4a52});B(g,0xffffff,.08,.5,.005,.28,.96,WZ+.023,{op:.35,rough:.1});R1(g,0xf4f6f4,.2,.26,.12,.82,.95,WZ+.06,.03,{rough:.45});B(g,0x39434c,.1,.02,.06,.82,.95,WZ+.1,{rough:.5});sanitizer(g,.4,.62)}
function trophy(g){shell46(g,I46.walnut,.84,1.45,.36,.5,WZ+.18);R1(g,I46.walnut,.84,.55,.36,.5,0,WZ+.18,.015,{rough:.55});const gl=B(g,0xd8edf2,.76,.8,.006,.5,.6,WZ+.365,{op:.2,rough:.1});gl.material.userData.noCastShadow=true;for(const y of[.62,1.02])R1(g,I46.walnutL,.76,.02,.3,.5,y,WZ+.18,.01,{rough:.5});
 for(const[x,y]of[[.3,.64],[.55,.64],[.75,.64],[.4,1.04],[.65,1.04]]){C(g,0xd4af37,.04,.05,x,y,WZ+.2,{rough:.25,metal:.8});const c=C(g,0xd4af37,.05,.1,x,y+.05,WZ+.2,{rough:.25,metal:.8});Sph(g,0xd4af37,.035,x,y+.18,WZ+.2,{rough:.25,metal:.8})}for(const x of[.29,.71])RV(g,I46.walnutL,.38,.5,.012,x,.05,WZ+.365,.008,{rough:.5})}
function scale46(g){R1(g,0xdfe6ea,.36,.06,.34,.5,0,WZ+.2,.03,{rough:.4});C(g,0xd5dde2,.02,1.4,.5,.06,WZ+.06,{rough:.3,metal:.6});B(g,0xd5dde2,.18,.02,.04,.5,1.25,WZ+.12,{rough:.3,metal:.6});R1(g,0x39434c,.14,.1,.04,.5,1.0,WZ+.08,.01,{rough:.4});B(g,0x9fe8b0,.1,.04,.004,.5,1.03,WZ+.101,{em:0x1b4a2a})}
function kitchen(g){counter46(g,false,0xe7dccb);R1(g,0xf4f6f4,.36,.22,.3,.3,.84,WZ+.17,.02,{rough:.4});B(g,0x1e252c,.22,.14,.004,.26,.88,WZ+.321,{rough:.3});C(g,0x39434c,.07,.18,.72,.84,WZ+.2,{rough:.4});mug(g,.58,.84,WZ+.3,0xe8a05a)}
function linen(g){for(const[dx,dz]of[[-.25,.08],[.25,.08],[-.25,.36],[.25,.36]]){C(g,0x9aa6ae,.012,.9,.5+dx,.04,WZ+dz,{rough:.3,metal:.6},1);caster(g,.5+dx,WZ+dz)}R1(g,0x8fc3e8,.52,.55,.3,.5,.3,WZ+.22,.06,{rough:.85});R1(g,0xf7f8f5,.5,.06,.28,.5,.85,WZ+.22,.04,{rough:.8});B(g,0x9aa6ae,.56,.02,.02,.5,.94,WZ+.07,{rough:.3,metal:.6})}
function plantTall(g,x=.5){const s=new THREE.Group();F.rec_plant(s);s.scale.setScalar(.95);s.position.set(x-.5*.95,0,WZ+.12-.5*.95+.2);g.add(s)}
// combined tiles
export const DECOR46={
 sinkPoster(g){counter46(g,true);},
 counter(g){counter46(g,false)},
 posterHeart(g){poster(g,0,.5,.82);sanitizer(g,.85,1.0);pedalBin(g,.2)},
 posterEye(g){poster(g,2,.5,.8,.32,.5);scale46(g)},
 posterBrain(g){poster(g,5,.5,.82);clock(g,.85,1.35,.09)},
 posterLungs(g){poster(g,4,.5,.82);sanitizer(g,.15,1.0);pedalBin(g,.82)},
 posterDNA(g){poster(g,3,.5,.82);clock(g,.15,1.35,.09)},
 posterSkel(g){poster(g,1,.5,.78,.32,.5);pedalBin(g,.82)},
 posterSkin(g){poster(g,9,.5,.82);sanitizer(g,.85,1.0)},
 posterWarn(g){poster(g,8,.5,.9,.28,.42);elpanel(g)},
 posterWash(g){poster(g,6,.5,.82);sanitizer(g,.15,1.0)},
 posterPills(g){poster(g,7,.5,.82);clock(g,.85,1.35,.09)},
 posterArt(g){poster(g,10,.33,.75,.28,.42,0xb08d3a);poster(g,11,.7,.85,.24,.34,0xb08d3a)},
 posterLogo(g){poster(g,12,.5,.8);clock(g,.15,1.38,.09)},
 clockSan(g){clock(g,.5,1.3);sanitizer(g,.5,.85);pedalBin(g,.8)},
 tallcab(g){F.cabinet(g)},
 filing, fridge, cooler(g){cooler(g,.35);poster(g,12,.75,.85,.24,.36)}, whiteboard, tv(g){tv(g,1.15);lowcab(g,'books')}, lightbox(g){lightbox(g);console46(g)}, console:console46, apron, steelcab, shelfwall, defib(g){defib(g);trolley(g,.6)},
 mirror:mirror46, trophy, kitchen, linen, trolley(g){trolley(g,.5)}, oxygen(g){oxygen(g,.5);gasRail(g)}, vitals(g){gasRail(g);vitals(g,.5,1.38)},
 bookshelf(g){bookshelf46(g)}, plant(g){plantTall(g)},
 radiator(g){radiator46(g)}, lowPlant(g){lowcab(g,'plant')}, lowBooks(g){lowcab(g,'books',I46.walnut,true)}, lowBoxes(g){lowcab(g,'boxes')}, lowWood(g){lowcab(g,'plant',I46.walnut,true)},
};
const DL46={
 gp:[['sinkPoster','posterHeart','filing','posterEye','clockSan','tallcab'],['lowPlant','radiator']],
 paygp:[['bookshelf','posterArt','filing','trophy','clockSan'],['lowWood','radiator']],
 diag:[['console','posterBrain','tallcab','sinkPoster'],['radiator','lowBoxes']],
 lab:[['shelfwall','sinkPoster','posterDNA','tallcab'],['lowBoxes']],
 pharmacy:[['shelfwall','posterPills','tallcab','counter'],['lowBoxes','radiator']],
 ward:[['vitals','linen','posterLogo','tv','vitals'],['radiator','lowPlant']],
 psych:[['bookshelf','posterBrain','plant','posterArt'],['lowWood','lowBooks']],
 pump:[['posterLungs','oxygen','tallcab','trolley'],['radiator']],
 inflate:[['posterLungs','tallcab','oxygen','trolley'],['radiator']],
 toilet:[['mirror','posterWash','mirror'],['radiator']],
 staffroom:[['kitchen','fridge','cooler','whiteboard','tv'],['lowWood','radiator']],
 cardio:[['vitals','posterHeart','defib','trolley'],['radiator','lowBoxes']],
 surgery:[['sinkPoster','oxygen','vitals','trolley','tallcab'],['lowBoxes']],
 icu:[['vitals','oxygen','vitals','trolley','defib'],['radiator']],
 xray:[['lightbox','posterSkel','apron','console'],['radiator']],
 genetics:[['shelfwall','posterDNA','whiteboard','counter'],['lowBoxes']],
 electro:[['posterWarn','tallcab','console'],['radiator']],
 reboot:[['console','posterWarn','tallcab'],['radiator']],
 derma:[['sinkPoster','posterSkin','trolley','tallcab'],['radiator']],
 research:[['whiteboard','shelfwall','bookshelf','posterDNA'],['lowBoxes']],
 morgue:[['steelcab','sinkPoster','steelcab','posterSkel'],['lowBoxes']],
 transplant:[['sinkPoster','vitals','oxygen','trolley','tallcab'],['lowBoxes']],
 library:[['bookshelf','bookshelf','clockSan','bookshelf','posterArt'],['lowBooks']],
 chief:[['bookshelf','posterArt','trophy','filing'],['lowWood','lowBooks']],
};
// Places decor along the back (top/left) perimeter tiles of a room. Returns number of tiles decorated.
export function decor46Room(r,parent){
 const L=DL46[r.type];if(!L)return 0;let n=0,ti=0,li=0;const dr=r.door||{x:-9,y:-9};
 const put=(x,y,left,win)=>{const g=new THREE.Group();const k=win?L[1][li++%L[1].length]:L[0][ti++%L[0].length];DECOR46[k](g);
  if(left){g.position.set(x,0,y+1);g.rotation.y=Math.PI/2}else g.position.set(x,0,y);g.userData.decor46=k;parent.add(g);n++};
 for(let x=r.x+1;x<=r.x+r.w-2;x++){const y=r.y;if(dr.y===y&&Math.abs(dr.x-x)<=1)continue;put(x,y,false,(x+y)%3===0)}
 for(let y=r.y+1;y<=r.y+r.h-2;y++){const x=r.x;if(dr.x===x&&Math.abs(dr.y-y)<=1)continue;put(x,y,true,(x+y)%3===0)}
 // corner plant (top-left tile)
 {const g=new THREE.Group();const s=new THREE.Group();F.rec_plant(s);s.scale.setScalar(.8);s.position.set(r.x+.4-.4,0,r.y+.4-.4);g.add(s);parent.add(g);n++}
 return n}
// ---------- batch E: amenities, morgue, library, corridor items ----------
Object.assign(F,{
 wc(g){
  // Seat ring top .50, cistern top ~.83, flush plate at .84 on the cistern (z .18) — same targets as reachTarget39.
  groundShadow(g,.55,.7,.5,.42,.2);
  const bowl=C(g,WH,.2,.38,.5,0,.52,{rough:.25});bowl.scale.set(.2,.38,.25);C(g,WH,.13,.06,.5,0,.48,{rough:.3});
  B(g,WH,.3,.3,.2,.5,.08,.32,{rough:.25});
  const seat=Tor(g,0xf4f4f0,.19,.5,.47,.53,Math.PI/2,0,{rough:.35});seat.scale.set(.19,.24,.3);
  const ring=C(g,WH,.24,.12,.5,.38,.55,{rough:.3});ring.scale.set(.2,.12,.25);
  R(g,WH,.44,.45,.18,.5,.38,.18,.05,{rough:.25});R1(g,0xf4f4f0,.46,.03,.2,.5,.83,.18,.03,{rough:.3});
  const lid=R1(g,0xf4f4f0,.36,.025,.44,.5,0,0,.15,{rough:.35});lid.geometry.rotateX(Math.PI/2);lid.position.set(.5,.72,.29);lid.rotation.x=-.12;
  B(g,STEEL,.12,.03,.04,.5,.84,.18,{rough:.25,metal:.7});B(g,0xd5dde2,.05,.012,.03,.5,.865,.18,{rough:.2,metal:.8});
  C(g,0xd5dde2,.015,.25,.75,.15,.08,{rough:.3,metal:.7},1);
  C(g,0xf4f4f0,.06,.11,.85,.55,.06,{rough:.4});C(g,0x9aa6ae,.012,.11,.85,.55,.06,{rough:.3,metal:.6},1);
 },
 sink(g){
  // Pedestal basin (rim ~.9, reach target .8 at tile centre), chrome mixer, framed mirror, soap.
  groundShadow(g,.6,.5,.5,.3,.18);
  const ped=C(g,WH,.08,.72,.5,0,.22,{rough:.3});ped.scale.set(.09,.72,.07);
  R(g,WH,.6,.18,.45,.5,.72,.3,.1,{rough:.25});R1(g,0xdfe8ee,.46,.01,.3,.5,.895,.33,.08,{rough:.15,metal:.3});
  C(g,0xd5dde2,.018,.14,.5,.9,.12,{rough:.2,metal:.8},1);const sp=B(g,0xd5dde2,.025,.02,.1,.5,1.02,.17,{rough:.2,metal:.8});C(g,0xd5dde2,.012,.06,.57,.9,.12,{rough:.2,metal:.8},1);
  C(g,0xf4f4f0,.03,.1,.28,.9,.14,{rough:.4},1);C(g,0x9aa6ae,.01,.04,.28,1.0,.14,{rough:.3,metal:.6},1);
  B(g,0x9aa6ae,.58,.74,.02,.5,1.04,.03,{rough:.3,metal:.6});B(g,0xbfdfff,.55,.7,.03,.5,1.05,.04,{op:.6});
  R1(g,0xf4f3ee,.5,.02,.1,.5,1.0,.08,.01,{rough:.4});
 },
 sofa(g){
  // Seat cushion top .52 (SEATH.sofa), rounded arms/back, piped cushions, wooden feet, throw pillows.
  groundShadow(g,2.05,.95,1,.45,.24);
  for(const[x,z]of[[.12,.12],[1.88,.12],[.12,.78],[1.88,.78]])C(g,I46.oakD,.025,.08,x,0,z,{rough:.5},1);
  R(g,0x6e5596,1.94,.34,.8,1,.08,.45,.06,{rough:.85});
  R(g,0x7f66a8,1.86,.52,.22,1,.38,.14,.08,{rough:.85});
  for(const x of[.1,1.9])R(g,0x7f66a8,.2,.36,.8,x,.38,.45,.08,{rough:.85});
  for(const x of[.55,1.45])R(g,0x9b80c2,.8,.1,.6,x,.42,.5,.07,{rough:.88});
  for(const x of[.55,1.45]){const b=R(g,0x9b80c2,.8,.12,.36,x,0,0,.08,{rough:.88});b.geometry.rotateX(Math.PI/2);b.position.set(x,.72,.27);b.rotation.x=-.15}
  const p1=R1(g,0xe8a05a,.3,.08,.3,.32,0,0,.1,{rough:.9});p1.geometry.rotateX(Math.PI/2);p1.position.set(.34,.7,.36);p1.rotation.set(-.3,0,.2);
  const p2=R1(g,0x4f9c98,.28,.08,.28,.32,0,0,.1,{rough:.9});p2.geometry.rotateX(Math.PI/2);p2.position.set(1.68,.69,.36);p2.rotation.set(-.3,0,-.2);
 },
 coffee(g){
  // Kitchenette unit: oak base, stone top, espresso machine, cups, kettle, fruit bowl.
  groundShadow(g,.95,.62,.5,.3,.2);
  R1(g,I46.oak,.9,.8,.55,.5,0,.3,.02,{rough:.5});for(const x of[.28,.72])RV(g,0xd2a77a,.4,.66,.012,x,.08,.58,.008,{rough:.5});for(const x of[.46,.54])B(g,0x8a979e,.012,.1,.015,x,.6,.59,{rough:.3,metal:.6});
  R(g,0xe9e4d8,.94,.04,.58,.5,.8,.3,.02,{map:TEX.recStone,rough:.4});
  R(g,0x39434c,.36,.42,.32,.45,.84,.22,.04,{rough:.4});R1(g,0xd5dde2,.3,.08,.04,.45,1.08,.385,.01,{rough:.3,metal:.6});B(g,0x2b3238,.2,.02,.12,.45,.86,.42,{rough:.4});
  mug(g,.45,.88,.42,0xffffff);Sph(g,0xe33,.012,.6,1.15,.39,{em:0x660000});
  C(g,0xd5dde2,.06,.16,.82,.84,.25,{rough:.25,metal:.7});C(g,0x39434c,.02,.03,.82,1.0,.25,{rough:.4});
  C(g,0xf4f3ee,.09,.04,.16,.84,.42,{rough:.4});for(const[dx,c]of[[0,0xe8a05a],[.04,0xc0392b],[-.03,0x9ccf8f]])Sph(g,c,.03,.16+dx,.89,.42+dx*.5,{rough:.6});
  for(let i=0;i<3;i++)mug(g,.7+i*.07,.84,.5,[0xffffff,0x4f9c98,0xe8a05a][i]);
 },
 labbench(g){
  // Research bench: cabinets, epoxy top (.85-.91), reagent shelf, flasks, laptop.
  groundShadow(g,1.95,.7,1,.35,.22);
  R1(g,0xdfe5ea,1.86,.8,.56,1,.03,.35,.02,{rough:.5});for(const x of[.35,.8,1.25,1.65])RV(g,0xe9eef0,.4,.62,.012,x,.12,.635,.008,{rough:.55});
  R(g,DARK,1.94,.06,.64,1,.82,.35,.02,{rough:.35});
  for(const x of[.12,1.88])B(g,0x9aa6ae,.025,.55,.025,x,.88,.12,{rough:.3,metal:.6});R1(g,0xf4f3ee,1.84,.025,.18,1,1.25,.12,.01,{rough:.45});
  for(let i=0;i<5;i++){const c=[0x77ff77,0xff77ff,0x77ffff,0xffff77,0xff9977][i];C(g,0xe8f4f8,.05,.16,.3+i*.35,.88,.3,{op:.45,rough:.15});C(g,c,.045,.07,.3+i*.35,.885,.3,{em:0x111111,op:.85})}
  for(let i=0;i<7;i++)bottle(g,.25+i*.24,1.275,.12,[0x9ccf8f,0xb98cff,0xffffff,0x7fb7d8,0xf1d27a,0xe7b1b1,0xffffff][i],.12,.03);
  B(g,STEEL,.3,.35,.25,1.6,.88,.3);R1(g,0x39434c,.32,.015,.22,1.15,.88,.45,.01,{rough:.4});const lid=B(g,0x39434c,.32,.2,.012,1.15,.89,.34,{rough:.4});lid.rotation.x=-.25;
 },
 morguefridge(g){
  // Stainless body, 6 doors with latches and name cards, compressor grille.
  groundShadow(g,2,.7,1,.32,.24);
  R(g,0xc9d3d8,1.9,1.7,.6,1,0,.32,.03,{rough:.28,metal:.65});
  for(let i=0;i<3;i++)for(let j=0;j<2;j++){RV(g,0xdfe5ea,.85,.48,.02,.53+j*.94,.12+i*.52,.64,.012,{rough:.25,metal:.6});B(g,0x7d8b93,.2,.04,.04,.53+j*.94,.5+i*.52,.65,{rough:.3,metal:.6});B(g,0xffffff,.12,.06,.004,.53+j*.94,.2+i*.52,.651,{rough:.8})}
  for(let i=0;i<6;i++)B(g,0x7d8b93,1.7,.01,.004,1,.03+i*.014,.625,{rough:.4,metal:.5});
  R1(g,0xb5c0c6,1.94,.05,.64,1,1.7,.32,.015,{rough:.3,metal:.6});
 },
 autopsy(g){
  // Pedestal table (top .88 kept), drain tray, overhead surgical lamp, instrument tray.
  groundShadow(g,1.95,.85,1,.5,.24);
  R1(g,0xb5c0c6,.5,.05,.4,1,0,.5,.03,{rough:.3,metal:.6});C(g,STEEL,.1,.8,1,0,.5,{rough:.25,metal:.7});
  R(g,STEEL,1.8,.08,.7,1,.8,.5,.05,{rough:.25,metal:.7});R1(g,0xd8dee4,1.7,.012,.6,1,.868,.5,.04,{rough:.2,metal:.5});
  C(g,0x7d8b93,.03,.01,1.82,.875,.5,{rough:.3,metal:.6});
  C(g,STEEL,.02,.6,1,1.62,.5,{rough:.25,metal:.7},1);C(g,STEEL,.25,.04,1,2.2,.5);C(g,0xffffee,.2,.03,1,2.17,.5,{em:0x999966});
  R1(g,0xd5dde2,.36,.02,.22,1.7,.95,.15,.01,{rough:.25,metal:.6});for(let i=0;i<4;i++)B(g,0x9aa6ae,.012,.004,.14,1.58+i*.07,.97,.15,{rough:.2,metal:.8});
 },
 bookcase(g){
  // Walnut library case, crown and plinth, mixed books with lean/stack variation, small busts/globe.
  groundShadow(g,2,.45,1,.2,.22);
  shell46(g,I46.walnut,1.9,2,.35,1,.2);for(const x of[.66,1.34])B(g,I46.walnut,.022,1.9,.33,x,.05,.2,{rough:.55});B(g,0x4c2f20,1.84,1.86,.01,1,.07,.05,{rough:.7});
  R1(g,0x5a3826,1.96,.06,.4,1,1.96,.2,.015,{rough:.5});R1(g,0x5a3826,1.94,.08,.38,1,0,.2,.015,{rough:.5});
  let k=0;for(let y=.12;y<1.9;y+=.44){R1(g,I46.walnutL,1.82,.03,.3,1,y,.21,.01,{rough:.5});let x=.12;while(x<1.86){if(Math.abs(x-.66)<.03||Math.abs(x-1.34)<.03){x+=.03;continue}if(k%17===8){Sph(g,0x4f86c6,.07,x+.08,y+.11,.22,{rough:.45});x+=.18;k++;continue}const w=.035+(k%4)*.008,h=.24+((k*7)%5)*.025;const b=B(g,[0xb03a3a,0x3a62a8,0x3a9a5a,0xc9a43a,0x6a4a9a,0x7a7a7a,0xd8c8a8,0x2f4a3c][k%8],w,h,.23,x+w/2,y+.03,.23,{rough:.7});if(k%13===6)b.rotation.z=.18;x+=w+.004;k++}}
 },
 readdesk(g){
  // Reading desk (top .72-.77), green banker's lamp, open book; stool seat .50 kept at (.5,.95).
  groundShadow(g,.95,1.1,.5,.6,.2);
  R(g,I46.oak,.9,.05,.6,.5,.72,.45,.02,{rough:.5});for(const[a,b]of[[.1,.2],[.9,.2],[.1,.7],[.9,.7]])B(g,I46.oakD,.04,.72,.04,a,0,b,{rough:.55});B(g,I46.oakD,.78,.08,.02,.5,.62,.17,{rough:.55});
  C(g,0xb08d3a,.05,.02,.75,.77,.3,{rough:.3,metal:.7});C(g,0xb08d3a,.008,.2,.75,.79,.3,{rough:.3,metal:.7},1);const sh=C(g,0x2f6b4a,.08,.06,.75,.99,.32,{rough:.35});sh.scale.set(.12,.05,.06);C(g,0xffd166,.1,.012,.75,.975,.32,{em:0x886600});
  B(g,WH,.3,.03,.22,.4,.77,.5);B(g,0xf6f4ee,.14,.012,.2,.33,.8,.5,{rough:.9}).rotation.z=.06;B(g,0xf6f4ee,.14,.012,.2,.47,.8,.5,{rough:.9}).rotation.z=-.06;
  C(g,0xc98b4f,.2,.06,.5,.44,.95,{rough:.8});C(g,0x5b4636,.025,.42,.5,.02,.95,{rough:.5},1);C(g,0x5b4636,.16,.02,.5,0,.95,{rough:.5});
 },
 bench(g){
  // Waiting bench: steel frame, upholstered seat (.40-.46 = SEATH.bench), back cushion.
  groundShadow(g,1.95,.5,1,.45,.2);
  for(const x of[.15,1.85]){B(g,0x5d6a72,.05,.4,.05,x,0,.65,{rough:.35,metal:.5});B(g,0x5d6a72,.05,.75,.05,x,0,.3,{rough:.35,metal:.5});B(g,0x5d6a72,.05,.05,.4,x,.36,.48,{rough:.35,metal:.5})}
  B(g,0x5d6a72,1.8,.04,.04,1,.36,.48,{rough:.35,metal:.5});
  R(g,0x4f7cac,1.9,.06,.42,1,.4,.5,.04,{rough:.85});for(let i=1;i<3;i++)B(g,0x426a94,.01,.062,.4,i*.633+.05,.4,.5,{rough:.85});
  const bk=R(g,0x4f7cac,1.9,.05,.34,1,0,0,.05,{rough:.85});bk.geometry.rotateX(Math.PI/2);bk.position.set(1,.68,.3);bk.rotation.x=-.1;
 },
 radiator(g){radiator46(g,.5);},
 bin(g){C(g,0x557a55,.17,.45,.5,0,.5,{rough:.5});C(g,0x45664a,.175,.04,.5,.12,.5,{rough:.5});C(g,DARK,.18,.03,.5,.45,.5);C(g,0x9aa6ae,.06,.02,.5,.48,.5,{rough:.3,metal:.6});groundShadow(g,.42,.42,.5,.5,.18)},
 soda(g){
  groundShadow(g,.85,.65,.5,.4,.22);
  R(g,0xd8283a,.8,1.8,.6,.5,0,.4,.05,{rough:.4});B(g,0x9fd8ff,.5,1.1,.02,.38,.5,.71,{em:0x224455});
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)C(g,[0xd8283a,0x3fa34a,0xf1c232,0x3d7ac9][(i+j)%4],.03,.12,.22+j*.11,.55+i*.25,.69,{rough:.4},1);
  B(g,WH,.12,.4,.02,.83,.8,.71);B(g,DARK,.5,.12,.04,.4,.15,.71);B(g,0xffffff,.6,.12,.004,.4,1.62,.701,{rough:.5});
 },
});
