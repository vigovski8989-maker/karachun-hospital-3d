'use strict';
// ===== Анимированные персонажи (Blender-спрайты), мебель по футпринтам, створки дверей =====
const ANIM={meta:null,sheets:[],ok:false};
async function loadAnim(){ANIM.ok=false;return;try{let q='medium';try{q=localStorage.getItem('karachun_gfx')||'medium'}catch(e){}const dir=q==='low'?'assets/anim_lo/':'assets/anim/';ANIM.dir=dir;
 ANIM.meta=await (await fetch(dir+'anim.json')).json();
 // v21: параллельная загрузка + заранее декодированные ImageBitmap (нет рывков при первом показе листа)
 ANIM.sheets=await Promise.all(Array.from({length:ANIM.meta.sheets},async(_,i)=>{const im=await loadImg(dir+'anim_'+i+'.webp');try{if(window.createImageBitmap)return await createImageBitmap(im)}catch(e){}try{await im.decode()}catch(e){}return im}));ANIM.ok=true}catch(e){console.warn('anim fallback',e);ANIM.ok=false}}
function aGet(ch,act,d){const c=ANIM.meta&&ANIM.meta.frames[ch];return c&&c[act+'_'+d]}
function aDraw(g,ch,act,d,i,px,py){const a=aGet(ch,act,d);if(!a)return false;const f=a[Math.max(0,Math.min(a.length-1,i|0))],k=ANIM.meta.scale;g.drawImage(ANIM.sheets[f[0]],f[1],f[2],f[3],f[4],px+f[5]*k,py+f[6]*k,f[3]*k,f[4]*k);return true}
// смещения посадки (px) относительно центра клетки
const SEATPX={chair:[0,0],sofa:[0,0],bench:[0,0],wc:[0,0]};
const LIEOFF=[3,8];// высота матраса: смещение тела лежащего
const FK={cabinet:.68,shelf:.88,coffee:.7,sink:.6,wc:.8,plant:.45,pumpmachine:1.04,desk:.85,scanner:.85,tubes:.75,bed:.8,bench:.65,sofa:.8,radiator:.5,bin:.4};
function furnRect(k,x,y,fp){const alias=k==='pumpmachine'?'coffee':k,s=atlasSpr('f_'+alias);if(!s)return null;fp=fp||fpOf(k);const w=(fp[0]+fp[1])*32*(FK[k]||1),sc=w/s.width,h=s.height*sc;const c=iso(x+fp[0]/2,y+fp[1]/2);return{s,x:c.x-w/2,y:c.y+w/4-1-h,w,h,cx:c.x,cy:c.y}}
const P3D={sink:'sink',sofa:'sofa',coffee:'coffee',pumpmachine:'pumpmachine',xray:'xray',dnaseq:'dnaseq',elchair:'elchair',rebootpod:'rebootpod',inflator:'inflator',uvlamp:'uvlamp',labbench:'labbench',morguefridge:'morguefridge',autopsy:'autopsy',organfridge:'organfridge',bookcase:'bookcase',readdesk:'readdesk',chiefdesk:'chiefdesk',aquarium:'aquarium'};
function fpDir(k,d){const f=fpOf(k);return (d===0||d===2)?[f[1],f[0]]:f}
function draw3D(g,k,x,y,d,fp){const ch=P3D[k];d=d==null?1:d;if(!ANIM.ok||!aGet(ch,ch,d))return false;fp=fp||fpDir(k,d);const p=iso(x+fp[0]/2,y+fp[1]/2),sw=(fp[0]+fp[1])*16+6;
 g.drawImage(shadowSpr(),p.x-sw/2,p.y-sw*.2,sw,sw*.4);aDraw(g,ch,ch,d,0,p.x,p.y);
 if(k==='pumpmachine'){const q=Math.sin(performance.now()/200),r=4+q*1.2,cx=p.x+(d===1?3:d===3?-3:0),cy=p.y-61;const gr=g.createRadialGradient(cx,cy,1,cx,cy,r*2.2);gr.addColorStop(0,'rgba(255,90,90,.9)');gr.addColorStop(.4,'rgba(230,40,40,.6)');gr.addColorStop(1,'rgba(230,40,40,0)');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,r*2.2,0,7);g.fill()}
 return true}
function drawFurn(g,t){const k=t.k||t.type;if(P3D[k]&&draw3D(g,k,t.x,t.y,t.dir,t.fp))return;
 if(k==='wc'&&ANIM.ok&&aGet('toilet','toilet',1)){const p=iso(t.x+.5,t.y+.5);g.drawImage(shadowSpr(),p.x-12,p.y-5,24,10);aDraw(g,'toilet','toilet',1,Math.round(t.lid||0),p.x,p.y);return}if(k==='chair_office'||k==='chair_plain'){if(ANIM.ok){const p=iso(t.x+.5,t.y+.5);g.drawImage(shadowSpr(),p.x-14,p.y-6,28,12);aDraw(g,k,'chair',t.dir!=null?t.dir:1,0,p.x,p.y)}return}
 const fp=t.fp||fpOf(k),R=furnRect(k,t.x,t.y,fp);if(!R){const p=iso(t.x+.5,t.y+.5);g.drawImage(itemSpr(k,t.state),p.x-32,p.y-HH-ITEM_H);return}
 const s=t.state==='dry'?atlasSpr('f_'+k,'sepia(.9) brightness(.8)'):R.s;
 g.drawImage(shadowSpr(),R.cx-R.w*.5,R.cy-R.w*.13,R.w,R.w*.4);g.drawImage(s,R.x,R.y,R.w,R.h);
 if(k==='pumpmachine'){const q=Math.sin(performance.now()/200),r=5+q*1.5,cy=R.y+8;const gr=g.createRadialGradient(R.cx-1,cy-1,1,R.cx,cy,r*2.2);gr.addColorStop(0,'rgba(255,90,90,.95)');gr.addColorStop(.4,'rgba(230,40,40,.8)');gr.addColorStop(1,'rgba(230,40,40,0)');g.fillStyle=gr;g.beginPath();g.arc(R.cx,cy,r*2.2,0,7);g.fill()}}
function itemDepth(t){const fp=t.fp||fpOf(t.k||t.type);return t.x+fp[0]-1+t.y+fp[1]-1+1.05}
// положение «точки на полу» сидящего/лежащего
function seatXY(e){const v=e.vs,sp=v.sp;if(v.pose==='lie'&&sp.at){const p=iso(sp.at.x+.5,sp.at.y+1);return[p.x,p.y]}
 const p=iso(e.x+.5,e.y+.5);let o=SEATPX[sp.seat==='desk'?'chair':sp.seat]||[0,0];let X=p.x+o[0],Y=p.y+o[1];
 if((sp.seat==='sofa'||sp.seat==='bench')){const it=sp.bench?null:roomItem(sp,sp.seat);if(it){const fp=it.fp||fpOf(sp.seat),c=iso(it.x+fp[0]/2,it.y+fp[1]/2),f=SEATPULL[sp.seat]||FK[sp.seat]||1;X=c.x+(X-c.x)*f;Y=c.y+(Y-c.y)*f}}
 if(sp.seat==='desk'){const it=roomItem(sp,'desk');if(it){const R=furnRect('desk',it.x,it.y,it.fp);if(R){X=R.x+R.w*DESKSEAT[0];Y=R.y+R.h*DESKSEAT[1]}}}
 return[X,Y]}
const SEATPULL={sofa:.78};
const WASHFWD=.35;
// смещение корня (м→клетки к -v) в кадрах lid/flush, как в tools/blender/anim.py
const OA_ROOT={lid:[.12,.26,.36,.36,.36,.24],flush:[.34,.34,.34]};
function oaRoot(e){const o=e.oa;if(!o)return 0;const r=OA_ROOT[o.act];if(!r)return 0;let q=Math.min(.999,o.t/o.T);if(o.rev)q=1-q;return r[Math.floor(q*r.length)]}
const DESKSEAT=[.78,.8];
function roomItem(sp,k){const r=S.rooms.find(r=>roomAt(sp.x,sp.y)===r);if(!r)return null;return r.it.find(t=>t.k===k)}
function nearDoor(e){for(const r of S.rooms){if(Math.abs(e.x-r.door.x)+Math.abs(e.y-r.door.y)<1.15)return true}return false}
const POSE_FB={'type':'sit','treat':'idle','crouch':'idle','wash':'idle','door':'walk','sit_down_sofa':'sit_down','sit_sofa':'sit'};
function entVis(e,isStaff,now){const ch=isStaff?e.type:(PMAP[e.dis]||'patches');let d=e.dir==null?1:e.dir,act='idle',i=0,X,Y;const P=iso(e.x+.5,e.y+.5);X=P.x;Y=P.y;
 const moving=e.path&&e.path.length>0,has=(a,dd)=>!!aGet(ch,a,dd!=null?dd:d);
 if(e.vs){const v=e.vs,T=SEAT_T[v.pose]||.9,k=Math.min(1,v.t/T);[X,Y]=seatXY(e);
  if(v.pose==='lie'){d=0;act='lie';i=v.ph==='sat'?6:v.ph==='down'?Math.floor(k*6.99):6-Math.floor(k*6.99);if(i>=2){const q=Math.min(1,(i-1)/3);Y+=LIEOFF[1]*q;X+=LIEOFF[0]*q}}
  else if(v.pose==='wc'){d=1;const sd=has('sit_down_wc',1)?'sit_down_wc':'sit_down';if(v.ph==='sat'){act='wc';i=0}else{act=sd;i=v.ph==='down'?Math.round(k*4):4-Math.round(k*4);{const f=(v.ph==='down'?1-Math.min(1,k/.5):Math.max(0,(k-.5)/.5))*.64;X-=32*f;Y+=16*f}}}
  else{const sofa=v.sp.seat==='sofa'&&isStaff&&has('sit_sofa');if(v.ph==='sat'){act=sofa?'sit_sofa':'sit';if(isStaff&&(e.type==='doctor'||e.type==='receptionist')&&(e.state==='work')&&has('type')){act='type';i=Math.floor(now/170)%4}}
   else{act=sofa&&has('sit_down_sofa')?'sit_down_sofa':'sit_down';i=v.ph==='down'?Math.round(k*4):4-Math.round(k*4)}}}
 else if(e.oa){const o=e.oa,n=(aGet(ch,o.act,o.d)||[0]).length;act=o.act;d=o.d;let q=Math.min(.999,o.t/o.T);if(o.rev)q=1-q;i=Math.floor(q*n);const rt=oaRoot(e);if(d===3){e._sh=[X+32*rt,Y-16*rt]}}
 else if(e.wash){act='wash';d=has('wash',d)?d:(has('wash',3)?3:2);if(d===3){X+=32*WASHFWD;Y-=16*WASHFWD}}
 else if(moving){act=nearDoor(e)&&has('door')?'door':'walk';e._an=(e._an||0)+Math.hypot(e.x-(e._px??e.x),e.y-(e._py??e.y))*4.2;{const n=(aGet(ch,act,d)||[0,0,0,0,0,0,0,0]).length;i=Math.floor(e._an*n/8)%n}}
 else if(isStaff&&((e.type==='handyman'&&e.state==='do')||(e.type==='orderly'&&e.state==='pick'))){act='crouch';i=Math.floor(now/190)%4}
 else if(isStaff&&e.state==='work'){const r=S.rooms.find(r=>r.id===e.room);if(r&&r.busy!=null&&has('treat')){act='treat';i=Math.floor(now/260)%4}}
 e._px=e.x;e._py=e.y;
 if(!has(act,d)){const fb=POSE_FB[act];if(fb&&has(fb,d))act=fb;else if(has('idle',d))act='idle';else{for(const dd of[1,0,2,3])if(has(act,dd)){d=dd;break}}}
 if(!has(act,d)){act='idle';d=1}
 if(act==='idle'){const n=(aGet(ch,'idle',d)||[0]).length;if(n>1)i=Math.floor(now/520+((e.id||0)*.37))%n}
 return{ch,act,d,i,x:X,y:Y,sh:e.oa?e._sh:null}}
// створка двери
function drawLeaf(g,r){const th=Math.min(1,r.dop||0)*1.3,back=r.side>=2,HL=back?42:14,x=r.door.x,y=r.door.y,c=Math.cos(th)*.6,sn=Math.sin(th)*.6;let h,f;
 if(r.side===2){h=[x+.2,y+.2];f=[h[0]+c,h[1]+sn]}else if(r.side===3){h=[x+.2,y+.2];f=[h[0]+sn,h[1]+c]}else if(r.side===0){h=[x+.2,y+.8];f=[h[0]+c,h[1]-sn]}else{h=[x+.8,y+.2];f=[h[0]-sn,h[1]+c]}
 const a=iso(h[0],h[1]),b=iso(f[0],f[1]);const col=r.side===2?['#b97a42','#8a5a30']:['#a56a38','#7d4f28'];const gr=g.createLinearGradient(a.x,0,b.x,0);gr.addColorStop(0,col[0]);gr.addColorStop(1,col[1]);
 g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(b.x,b.y-HL);g.lineTo(a.x,a.y-HL);g.closePath();g.fillStyle=gr;g.fill();g.strokeStyle='rgba(60,35,15,.8)';g.lineWidth=1;g.stroke();
 if(th>.05){g.fillStyle='rgba(0,0,0,.18)';g.fill()}
 g.fillStyle='#e6c870';g.beginPath();g.arc(b.x+(a.x<b.x?-2.5:2.5),b.y-HL*.48,1.5,0,7);g.fill()}
