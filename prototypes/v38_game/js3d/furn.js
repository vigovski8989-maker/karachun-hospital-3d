// v38: процедурная 3D-мебель для всех ключей furn.json/items.json. Единица = 1 клетка = 1 м.
// Локальная система: ширина по X (fp[0]), глубина по Z (fp[1]), «лицо» мебели смотрит в +Z, начало в углу клетки (0,0).
import * as THREE from 'three';
const grad=new THREE.DataTexture(new Uint8Array([110,110,110,255,175,175,175,255,228,228,228,255,255,255,255,255]),4,1);grad.needsUpdate=true;grad.magFilter=grad.minFilter=THREE.LinearFilter;
export const GRAD=grad;
const MC={};export function mat(c,o={}){const k=c+JSON.stringify(o);if(MC[k])return MC[k];const m=o.basic?new THREE.MeshBasicMaterial({color:c,transparent:!!o.op,opacity:o.op??1}):new THREE.MeshToonMaterial({color:c,gradientMap:grad,emissive:o.em??0,transparent:!!o.op,opacity:o.op??1});return MC[k]=m}
const BX=new THREE.BoxGeometry(1,1,1),CY=new THREE.CylinderGeometry(1,1,1,14),CY6=new THREE.CylinderGeometry(1,1,1,8),SP=new THREE.SphereGeometry(1,14,10),TO=new THREE.TorusGeometry(1,.16,10,24);
function B(g,c,w,h,d,x,y,z,o){const m=new THREE.Mesh(BX,mat(c,o));m.scale.set(w,h,d);m.position.set(x,y+h/2,z);g.add(m);return m}
function C(g,c,r,h,x,y,z,o,lo){const m=new THREE.Mesh(lo?CY6:CY,mat(c,o));m.scale.set(r,h,r);m.position.set(x,y+h/2,z);g.add(m);return m}
function Sph(g,c,r,x,y,z,o){const m=new THREE.Mesh(SP,mat(c,o));m.scale.setScalar(r);m.position.set(x,y,z);g.add(m);return m}
function Tor(g,c,r,x,y,z,rx=0,ry=0,o){const m=new THREE.Mesh(TO,mat(c,o));m.scale.setScalar(r);m.position.set(x,y,z);m.rotation.set(rx,ry,0);g.add(m);return m}
const WOOD=0xb07a4a,WOODD=0x7b5232,WH=0xf3f1ea,STEEL=0xb9c3cc,DARK=0x2f3742,TEAL=0x3aa7a0,SCREEN=0x6fd3ff,GREEN=0x4f9a4a,LEAF=0x3f8f3c;
function legs4(g,c,w,d,h,x0=0,z0=0,t=.05){for(const[a,b]of[[.06,.06],[w-.06,.06],[.06,d-.06],[w-.06,d-.06]])B(g,c,t,h,t,x0+a,0,z0+b)}
function chair(g,c,seat=0x3d5a80,x=.5,z=.5,back=true){B(g,DARK,.06,.42,.06,x,0,z);B(g,seat,.46,.08,.44,x,.42,z);if(back)B(g,seat,.46,.5,.07,x,.5,z-.2)}
function monitor(g,x,y,z){B(g,DARK,.05,.18,.05,x,y,z-.02);B(g,DARK,.46,.3,.04,x,y+.16,z-.04);B(g,SCREEN,.42,.26,.01,x,y+.18,z-.065,{em:0x2a6f8f})}
export const F={
 recdesk(g){B(g,WH,1.9,1.0,.5,1,0,.62);B(g,TEAL,1.94,.08,.62,1,1.0,.58);B(g,WOOD,1.9,.06,.5,1,.72,.22);B(g,0xd94a4a,.32,.08,.02,1,.55,.875,{em:0x661111});B(g,0xd94a4a,.08,.32,.02,1,.43,.875,{em:0x661111});monitor(g,.55,.78,.3);B(g,DARK,.4,.03,.16,.55,.78,.12)},
 desk(g){B(g,WOOD,1.8,.06,.8,1,.72,.5);legs4(g,WOODD,1.8,.8,.72,.1,.1);B(g,WOODD,.5,.62,.75,.4,.1,.5);monitor(g,1.25,.78,.35);B(g,WH,.3,.02,.22,.75,.78,.55);B(g,0x2c6fbf,.18,.04,.25,.45,.78,.5)},
 chair_office(g){chair(g,0,0x2f4b70);C(g,DARK,.25,.03,.5,0,.5,0,1)},
 chair_plain(g){chair(g,0,0xc98b4f)},chair(g){chair(g,0,0x5f86b5)},
 cabinet(g){B(g,0x9fb4c4,.8,1.3,.5,.5,0,.27);B(g,0x7e95a6,.84,.05,.54,.5,1.3,.27);for(const y of[.08,.5,.92]){B(g,0xb9cbd8,.72,.36,.03,.5,y,.52);B(g,STEEL,.22,.04,.03,.5,y+.26,.545);B(g,WH,.16,.08,.01,.5,y+.12,.54)}B(g,0xe8c15a,.12,.3,.22,.3,1.35,.27);B(g,0x4f86c6,.1,.28,.22,.43,1.35,.27);B(g,0xd25b5b,.1,.26,.22,.55,1.35,.27)},
 shelf(g){B(g,WOOD,.9,1.8,.35,.5,0,.2);for(const y of[.4,.85,1.3]){B(g,WOODD,.86,.04,.36,.5,y,.22);for(let i=0;i<4;i++)C(g,[0xe55,0x5c5,0x55e,0xfc3][i],.05,.16,.18+i*.21,y+.04,.3)}},
 scanner(g){B(g,WH,.6,.55,1.7,.5,0,1.05);B(g,0xd5e7f0,.5,.08,1.4,.5,.55,1.1).name='slide';const ring=new THREE.Group();ring.position.set(.5,.95,.35);g.add(ring);
  const r=new THREE.Mesh(new THREE.TorusGeometry(.45,.2,12,28),mat(WH));ring.add(r);const r2=new THREE.Mesh(new THREE.TorusGeometry(.42,.03,8,28),mat(SCREEN,{em:0x3399cc}));r2.position.z=.2;r2.name='glow';ring.add(r2);B(g,WH,.98,.5,.4,.5,0,.35)},
 plant(g){C(g,0xc96f43,.17,.32,.5,0,.5);C(g,0x5a3a20,.15,.02,.5,.31,.5);for(let i=0;i<6;i++){const a=i*1.05;Sph(g,LEAF,.16,.5+Math.cos(a)*.12,.55+(i%3)*.12,.5+Math.sin(a)*.12)}Sph(g,0x56a84f,.18,.5,.85,.5)},
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
 radiator(g){for(let i=0;i<7;i++)B(g,WH,.08,.6,.12,.2+i*.1,.1,.12);B(g,WH,.7,.05,.12,.5,.1,.12)},
 bin(g){C(g,0x557a55,.17,.45,.5,0,.5);C(g,DARK,.18,.03,.5,.45,.5)},
 soda(g){B(g,0xd8283a,.8,1.8,.6,.5,0,.4);B(g,0x9fd8ff,.5,1.1,.02,.38,.5,.71,{em:0x224455});B(g,WH,.12,.4,.02,.83,.8,.71);B(g,DARK,.5,.12,.04,.4,.15,.71)},
};
const PROTO={};
export function furnProto(k,fp){const key=k+fp;if(PROTO[key])return PROTO[key];const g=new THREE.Group();(F[k]||F.cabinet)(g);g.userData.k=k;return PROTO[key]=g}
export function makeFurn(k){const g=new THREE.Group();(F[k]||F.cabinet)(g);g.userData.k=k;return g}
