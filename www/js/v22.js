const V23={idb:-.05};
const V23A=new Set(['pumpmachine']);
function v22FB(t){const b=v22IB(t);return[b[0]-16,b[1]-20,b[2]+16,b[3]+4]}
function v23NoSh(e,V){if(e.state!=='treat'||!V||!String(V.act||'').startsWith('sit'))return false;const r=v21RoomOf(e);return !!(r&&r.type==='psych')}
'use strict';
/* v22: static world layer (floor+walls+furniture) cached in screen-space offscreen canvas; dynamic objects drawn on top with occluder redraw */
const V22={wv:0,dc:0,lc:null,key:'',SL:null,slK:'',on:true,rebuilds:0};
function v22TB(x,y,h){const p=iso(x+.5,y+.5);return[p.x-34,p.y-(h||80),p.x+34,p.y+20]}
function v22PB(e){const p=iso(e.x+.5,e.y+.5);return[p.x-34,p.y-98,p.x+34,p.y+14]}
function v22RB(r){const a=iso(r.x,r.y),b=iso(r.x+r.w,r.y),c=iso(r.x,r.y+r.h),d=iso(r.x+r.w,r.y+r.h);return[c.x-10,a.y-130,b.x+10,d.y+20]}
function v22IB(t){const fp=t.fp||fpOf(t.k||t.type);const a=iso(t.x,t.y),b=iso(t.x+fp[0],t.y),c=iso(t.x,t.y+fp[1]),d=iso(t.x+fp[0],t.y+fp[1]);return[c.x-8,a.y-120,b.x+8,d.y+8]}
function v22ov(a,b){return a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1]}
function v22Items(){let s='';for(const it of S.items)s+=it.type+it.x+','+it.y+(it.type==='plant'&&it.water<30?'d':'')+';';for(const r of S.rooms)s+=(r.it?r.it.length:0)+'.';return s}
function v22List(){const k=V22.wv+'|'+v22Items();if(V22.SL&&V22.slK===k)return V22.SL;const L=[];
 for(const w of wallList){if(w.leaf)continue;
  if(w.item){const t=w.t;L.push({d:itemDepth(t),f:()=>drawFurn(cx,t),bb:v22IB(t),x:w.x,y:w.y,anim:V23A.has(t.k||t.type)});if(ANIM.ok&&(t.k==='chair_office'||t.k==='chair_plain')&&(t.dir===2||t.dir===3)){const kb=t.k==='chair_office'?'chairb_office':'chairb_plain';L.push({d:itemDepth(t)+.12,f:()=>{const p=iso(t.x+.5,t.y+.5);aDraw(cx,kb,'chairb',t.dir,0,p.x,p.y)},bb:v22IB(t),x:w.x,y:w.y})}continue}
  const p=iso(w.x,w.y),lw=w.img.lw||w.img.width,lh=w.img.lh||w.img.height;
  L.push({d:w.x+w.y+1,tall:lh>=60,wall:w,f:()=>{cx.drawImage(w.img,p.x-32,p.y-(lh-32),lw,lh)},fc:()=>{const ca=typeof v19Cut==='function'?v19Cut(w,p,lh):1;if(ca<1)cx.globalAlpha=ca;cx.drawImage(w.img,p.x-32,p.y-(lh-32),lw,lh);cx.globalAlpha=1},bb:[p.x-32,p.y-(lh-32),p.x-32+lw,p.y+32],x:w.x,y:w.y})}
 for(const it of S.items){const t={k:it.type,x:it.x,y:it.y,fp:it.fp,state:it.type==='plant'&&it.water<30?'dry':''};L.push({d:itemDepth(it),f:()=>drawFurn(cx,t),bb:v22IB(t),x:it.x,y:it.y,anim:V23A.has(t.k)})}
 L.sort((a,b)=>a.d-b.d);V22.SL=L;V22.slK=k;return L}
const V22M=96;
function v22Static(dpr,W,H,QS){const z=cam.z,L=v22List(),ds=[];
 const cut=z>=1.5&&gq().cut;const R=(Math.min(innerWidth,innerHeight)*.34+V22M)/z;
 const ccx=cam.x+innerWidth/2/z,ccy=cam.y+innerHeight/2/z;
 let lc=V22.lc;const lw=Math.ceil((innerWidth+2*V22M)*dpr),lh=Math.ceil((innerHeight+2*V22M)*dpr);
 const key=V22.slK+'|'+z.toFixed(4)+'|'+dpr+'|'+lw+'x'+lh+'|'+cut+'|'+floorSig+'|'+(floorCv&&floorCv.width);
 const moved=!lc||Math.abs(cam.x-lc.bx)*z>V22M-4||Math.abs(cam.y-lc.by)*z>V22M-4;
 const dyn=s=>s.anim||cut&&s.tall&&Math.hypot(s.bb[0]+32-lc.ccx,(s.bb[3]-32-24-lc.ccy)*1.3)<R;
 if(!lc||lc.key!==key||moved){if(!lc||lc.width!==lw||lc.height!==lh){lc=V22.lc=mk(lw,lh);lc.g=lc.getContext('2d');lc.fl=mk(lw,lh)}
  V22.rebuilds++;lc.key=key;lc.bx=cam.x;lc.by=cam.y;lc.ccx=ccx;lc.ccy=ccy;const g=lc.g,lx=cam.x-V22M/z,ly=cam.y-V22M/z;lc.lx=lx;lc.ly=ly;
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#4d7a3d';g.fillRect(0,0,lw,lh);g.imageSmoothingEnabled=true;g.setTransform(z*dpr,0,0,z*dpr,-lx*z*dpr,-ly*z*dpr);
  g.drawImage(floorCv,0,0,floorCv.width/(floorCv._fs||1),floorCv.height/(floorCv._fs||1));const fg=lc.fl.getContext('2d');fg.setTransform(1,0,0,1,0,0);fg.drawImage(lc,0,0);
  const sv=VW;VW={x0:lx,y0:ly,x1:lx+lw/dpr/z,y1:ly+lh/dpr/z};const cxs=cx;cx=g;
  try{for(const s of L){if(!V21in(s.x,s.y)||dyn(s))continue;s.f()}}finally{cx=cxs;VW=sv}}
 V22.bl=[Math.round((lc.lx-cam.x)*z*dpr+QS.x*dpr),Math.round((lc.ly-cam.y)*z*dpr+QS.y*dpr),dpr];cx.setTransform(1,0,0,1,0,0);cx.drawImage(lc,Math.round((lc.lx-cam.x)*z*dpr+QS.x*dpr),Math.round((lc.ly-cam.y)*z*dpr+QS.y*dpr));V22.dc++;
 const SV=[];for(const s of L){if(!V21in(s.x,s.y))continue;if(dyn(s))ds.push({d:s.d,f:s.fc||s.f,bb:s.bb});else SV.push(s)}V22.SV=SV;
 for(const w of wallList)if(w.leaf&&V21in(w.x,w.y))ds.push({d:w.x+w.y+1.02,f:()=>drawLeaf(cx,w.leaf),bb:v22TB(w.x,w.y,90)});
 return ds}
function v22Occ(ds){const SV=V22.SV;if(!SV)return;const R=[];
 for(const e of ds){if(!e.bb)continue;for(const s of SV)if(s.d>e.d&&v22ov(s.bb,e.bb)){R.push(e.bb);break}}
 V22.occ=0;if(!R.length)return;const clip=()=>{cx.beginPath();for(const b of R)cx.rect(b[0],b[1],b[2]-b[0],b[3]-b[1]);cx.clip()};
 const lc=V22.lc,bl=V22.bl;ds.push({d:-1e9,f:()=>{cx.save();clip();const T=cx.getTransform();cx.setTransform(1,0,0,1,0,0);cx.drawImage(lc.fl,bl[0],bl[1]);cx.setTransform(T);cx.restore()}});
 for(const s of SV){const Q=R.filter(b=>v22ov(s.bb,b));if(!Q.length)continue;V22.occ++;ds.push({d:s.d,f:()=>{cx.save();cx.beginPath();for(const b of Q){const x0=Math.max(b[0],s.bb[0]),y0=Math.max(b[1],s.bb[1]);cx.rect(x0,y0,Math.min(b[2],s.bb[2])-x0,Math.min(b[3],s.bb[3])-y0)}cx.clip();s.f();cx.restore()}})}}
/* v22 procedures: scanner sliding table, psych lying on couch (mirrored lie pose), tighter scanner clip */
function v22Board(x,y,s){const o=iso(0,0),v=iso(0,.62),u=iso(.2,0),vx=v.x-o.x,vy=v.y-o.y,ux=u.x-o.x,uy=u.y-o.y,H=27;
 const P=(a,b)=>[x+vx*a+ux*b,y+vy*a+uy*b-H];const q=[P(-1,-1),P(1,-1),P(1,1),P(-1,1)];
 cx.save();cx.fillStyle='#9aa6b1';cx.beginPath();cx.moveTo(q[2][0],q[2][1]);cx.lineTo(q[3][0],q[3][1]);cx.lineTo(q[3][0],q[3][1]+5);cx.lineTo(q[2][0],q[2][1]+5);cx.closePath();cx.fill();
 cx.fillStyle='#b5c0ca';cx.beginPath();cx.moveTo(q[1][0],q[1][1]);cx.lineTo(q[2][0],q[2][1]);cx.lineTo(q[2][0],q[2][1]+5);cx.lineTo(q[1][0],q[1][1]+5);cx.closePath();cx.fill();
 cx.fillStyle='#eef2f5';cx.beginPath();q.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]));cx.closePath();cx.fill();
 cx.fillStyle='rgba(120,190,230,.55)';const m=P(-.55,0);cx.beginPath();cx.ellipse(m[0],m[1],6,3,0,0,7);cx.fill();cx.restore()}
{const _d=v21Draw;v21Draw=function(e,V,x,y){const f=e.fx;
 if(e.state==='treat'&&V&&V.act&&V.act.startsWith('sit')){const r=v21RoomOf(e);if(r&&r.type==='psych'){const so=r.it.find(t=>t.k==='sofa');const L=aGet(V.ch,'lie',0);if(so&&L){const c=itemC(so,0);cx.save();cx.translate(c.x-8,c.y+14);cx.scale(-1,1);aDraw(cx,V.ch,'lie',0,L.length-1,0,0);cx.restore();return}}}
 if(f&&V&&V.act==='lie'){const r=v21RoomOf(e);if(r&&r.type==='diag'){if(f.clip)v22Board(x+f.dx,y+f.dy,0);else{const a=iso(0,0),b=iso(0,+(V21.db??.85));v22Board(x+b.x-a.x,y+b.y-a.y,0)}}}
 _d(e,V,x,y)}}
v21ScanFront=function(t,s){const fp=t.fp||fpOf(t.k),a=iso(t.x,t.y),b=iso(t.x+fp[0],t.y),c=iso(t.x+fp[0],t.y+.62),d=iso(t.x,t.y+.62);
 cx.save();cx.beginPath();cx.moveTo(a.x,a.y-120);cx.lineTo(b.x,b.y-120);cx.lineTo(c.x,c.y-24);cx.lineTo(d.x,d.y-24);cx.closePath();cx.clip();draw3D(cx,t.k,t.x,t.y,t.dir,t.fp);cx.restore()};
function v22BoardC(r){const sp=r.sp&&r.sp.patient;if(!sp)return null;const p=iso(sp.x+.5,sp.y+.5),a=iso(0,0),b=iso(0,+(V23.idb??-.05));return{x:p.x+b.x-a.x,y:p.y+b.y-a.y}}
function v22Ped(g,c){const o=iso(0,0),v=iso(0,.38),u=iso(.16,0),vx=v.x-o.x,vy=v.y-o.y,ux=u.x-o.x,uy=u.y-o.y;const P=(a,b,h)=>[c.x+vx*a+ux*b,c.y+vy*a+uy*b-h];
 const quad=(q,col)=>{g.fillStyle=col;g.beginPath();q.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fill()};
 quad([P(1,-1,0),P(1,1,0),P(1,1,22),P(1,-1,22)],'#7d8893');quad([P(-1,1,0),P(1,1,0),P(1,1,22),P(-1,1,22)],'#a3adb7')}
//v22 off: {const _f=drawFurn;drawFurn=function(g,t){_f(g,t);if((t.k||t.type)==='scanner'){const r=S.rooms.find(r=>r.type==='diag'&&r.it&&r.it.includes(t));const c=r&&v22BoardC(r);if(c)v22Ped(g,c)}}}
{const _x=v21Fx;v21Fx=function(ds,now){_x(ds,now);for(const r of S.rooms){if(r.type!=='diag'||!r.it)continue;const s=r.it.find(t=>t.k==='scanner');if(!s||!V21in(s.x,s.y))continue;const p=r.busy!=null?S.pats.find(x=>x.id===r.busy):null;if(p&&p.fx&&p.vs&&p.vs.pose==='lie')continue;const c=v22BoardC(r);if(c)ds.push({d:itemDepth(s)+.01,f:()=>{v22Ped(cx,c);v22Board(c.x,c.y,0)},bb:[c.x-40,c.y-50,c.x+40,c.y+10]})}}}
/* v23: морг — тело лежит на столе вдоль оси стола */
{const _d=v21Draw;v21Draw=function(e,V,x,y){if(V&&(V.act==='lie'||(e.vs&&e.vs.pose==='lie'))&&e.state==='treat'){const r=v21RoomOf(e);if(r&&r.type==='morgue'){const t=r.it.find(t=>t.k==='autopsy');const L=aGet(V.ch,'lie',0);if(t&&L){const c=itemC(t,0);cx.save();cx.translate(c.x+(V23.mx??0),c.y+(V23.my??-6));cx.scale(-1,1);aDraw(cx,V.ch,'lie',0,L.length-1,0,0);cx.restore();return}}}_d(e,V,x,y)}}
function v23Dd(e){if(e.state!=='treat'||!e.vs||e.vs.pose!=='lie')return 0;const r=v21RoomOf(e);return r&&r.type==='morgue'?2:0}
