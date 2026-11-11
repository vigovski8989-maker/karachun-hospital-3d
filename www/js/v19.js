'use strict';
// ===== v19: качество графики (Low/Medium/High), hi-DPI, полы/стены высокого разрешения,
// свет (день/ночь, лампы, окна), частицы (пар, искры, чих), блум/виньетка, срез стен =====
const GQ={low:{dpr:1,fs:1,ws:1,parts:0,bloom:0,light:0,cut:1},medium:{dpr:1.25,fs:1.5,ws:2,parts:120,bloom:0,light:1,cut:1},high:{dpr:1.5,fs:2,ws:2,parts:300,bloom:1,light:1,cut:1}};
const GFX={q:(()=>{try{return localStorage.getItem('karachun_gfx')||'medium'}catch(e){return'medium'}})(),manual:(()=>{try{return!!localStorage.getItem('karachun_gfx')}catch(e){return false}})(),ft:[],lastT:0,downT:0,P:[],emT:{},bl:null,blF:0};
if(!GQ[GFX.q])GFX.q='medium';
function gq(){return GQ[GFX.q]}
function gfxDpr(){return Math.max(1,Math.min(devicePixelRatio||1,gq().dpr))}
function v19WS(){return gq().ws}
function v19FS(W,H){return Math.max(1,Math.min(gq().fs,Math.sqrt(12e6/(W*H))))}
function setGfx(q,auto){if(!GQ[q])return;GFX.q=q;if(!auto){GFX.manual=true;try{localStorage.setItem('karachun_gfx',q)}catch(e){}}
 for(const k in SPR)if(k.startsWith('w2_')||k==='doorfront')delete SPR[k];floorCv=null;wallList=null;GFX.P.length=0;GFX.bl=null;resize();if(!auto&&$('panel').style.display==='block')showMenu()}
// ---- полы по типам комнат ----
const FKIND={psych:'wood',chief:'wood',library:'wood',research:'wood',staffroom:'carpet',reception:'terrazzo',lab:'tiles',pharmacy:'tiles',toilet:'tiles',morgue:'tiles',transplant:'tiles',xray:'tiles',electro:'tiles',derma:'tiles',surgery:'tiles',icu:'tiles'};
const FTINT={staffroom:'rgba(60,90,140,.55)',psych:'rgba(120,60,20,.18)',chief:'rgba(90,40,20,.12)',library:'rgba(60,30,10,.08)',research:'rgba(120,220,160,.12)',reception:'rgba(120,160,210,.10)'};
function v19F(r){if(!ART.floors2){return r?FTEX[r.type]||['lino',null]:['lino','rgba(230,215,185,.18)']}
 if(!r)return['terrazzo','rgba(230,215,185,.10)'];const k=FKIND[r.type]||'lino';let t=FTINT[r.type]!==undefined?FTINT[r.type]:((FTEX[r.type]||[])[1]||null);if(t&&k==='lino')t=t.replace(/,([\d.]+)\)$/,(m,a)=>','+Math.min(.5,a*1.9).toFixed(2)+')');return[k,t]}
{const _la=loadArt;loadArt=async function(){await _la();try{const F={};for(const n of['wood','terrazzo','tiles','lino','carpet','grass'])F[n]=await loadImg('assets/sprites/floor2_'+n+'.jpg');ART.floors2=F}catch(e){ART.floors2=null}}}
// ---- стены: плинтус, AO, карниз, наличники, подоконники ----
function v19Wall(g,P,sd,col,variant,TK,HT,HS){if(!(sd.T||sd.L))return;const f=sd.T?'T':'L',q=(t,z)=>f==='T'?P(t,TK,z):P(TK,t,z);
 let a=q(0,0),b=q(0,HT);let gr=g.createLinearGradient(a[0],a[1],b[0],b[1]);gr.addColorStop(0,'rgba(0,0,0,.22)');gr.addColorStop(.12,'rgba(0,0,0,0)');gr.addColorStop(.85,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.14)');poly(g,[q(0,0),q(1,0),q(1,HT),q(0,HT)],gr);
 poly(g,[q(0,0),q(1,0),q(1,4.5),q(0,4.5)],'#7a5a3c');poly(g,[q(0,4.5),q(1,4.5),q(1,5.3),q(0,5.3)],'rgba(255,240,220,.55)');
 poly(g,[q(0,HT-2.2),q(1,HT-2.2),q(1,HT),q(0,HT)],'rgba(255,255,255,.35)');
 if(variant==='door'){poly(g,[q(.11,0),q(.15,0),q(.15,48),q(.11,48)],'#c49464');poly(g,[q(.85,0),q(.89,0),q(.89,48),q(.85,48)],'#a0703f');poly(g,[q(.11,46),q(.89,46),q(.89,49.5),q(.11,49.5)],'#d2a476');
  poly(g,[q(.34,50.5),q(.66,50.5),q(.66,54.5),q(.34,54.5)],'#2d6e3e');poly(g,[q(.36,51.2),q(.64,51.2),q(.64,53.8),q(.36,53.8)],'#6fe39a')}
 else if(variant==='win'){poly(g,[q(.22,24.5),q(.78,24.5),q(.78,26.5),q(.22,26.5)],'#f4f2ee');poly(g,[q(.31,30),q(.42,30),q(.36,46),q(.31,46)],'rgba(255,255,255,.35)');g.strokeStyle='rgba(255,255,255,.6)';g.lineWidth=.6;g.beginPath();g.moveTo(...q(.3,38));g.lineTo(...q(.7,38));g.stroke()}
 else if(variant.startsWith('art')&&window.PAINT&&PAINT.ok){const im=PAINT.im[+variant.slice(3)||0],o=q(.17,53),u=q(.83,53),v=q(.17,53-25*im.height/im.width);g.save();g.globalAlpha=.25;g.fillStyle='#000';g.transform((u[0]-o[0])/im.width,(u[1]-o[1])/im.width,(v[0]-o[0])/im.height,(v[1]-o[1])/im.height,o[0],o[1]);g.fillRect(4,6,im.width,im.height);g.globalAlpha=1;g.drawImage(im,0,0);g.restore()}
 else if(variant.startsWith('art')){poly(g,[q(.33,31),q(.67,31),q(.67,45),q(.33,45)],'rgba(255,255,255,.12)');g.fillStyle='rgba(255,230,160,.5)';const c=q(.5,40);g.beginPath();g.arc(c[0],c[1],2.2,0,7);g.fill()}}
// ---- срез стен при приближении ----
function v19Cut(w,p,lh){if(lh<60||cam.z<1.5||!gq().cut)return 1;const sx=(p.x-cam.x)*cam.z,sy=(p.y-24-cam.y)*cam.z,R=Math.min(innerWidth,innerHeight)*.34;const d=Math.hypot(sx-innerWidth/2,(sy-innerHeight/2)*1.3)/R;if(d>=1)return 1;const k=Math.min(1,(cam.z-1.5)/.6);return 1-k*.62*(1-d*d)}
// ---- время суток ----
function dayNight(){if(!S)return 0;const ph=(S.t/DAY/6)%1;return Math.max(0,-Math.sin(2*Math.PI*ph))}
function winTiles(){const out=[];for(const r of S.rooms)if(!r.par)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const T=y===r.y,Lf=x===r.x;if(!(T||Lf)||(T&&Lf))continue;if(x===r.door.x&&y===r.door.y)continue;if(!isWall(r,x,y))continue;if((x+y)%3===0)out.push(T?[x+.5,y+1.35,0]:[x+1.35,y+.5,1])}return out}
let _winC=null,_winS='';
function v19World(g,now){const Q=gq();const dt=Math.min(.1,(now-(GFX.lastT||now))/1000);GFX.lastT=now;perfTrack(dt);
 if(Q.parts)particles(g,speed>0?dt:0,now);
 if(!Q.light)return;const n=dayNight();const T=g.getTransform();
 // v21: свет пред-рендерится в кэш (мир, 1/2 разрешения), без blend-режимов multiply/soft-light/screen и без градиентов каждый кадр
 const nq=Math.round(n*20)/20,sg=sig()+'|'+nq;
 if(_winS!==sg){_winS=sg;_winC=v21Light(nq)}
 if(n>.02){g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='rgba(18,26,70,'+(.36*n).toFixed(3)+')';g.fillRect(0,0,cv.width,cv.height);g.restore()}
 if(_winC){g.save();g.globalCompositeOperation='lighter';g.drawImage(_winC.c,_winC.x0,_winC.y0,_winC.w,_winC.h);g.restore()}
 g.setTransform(T)}
function v21Light(n){const xs=[],ys=[];for(const [x,y] of [[0,0],[S.w,0],[0,S.h+3],[S.w,S.h+3]]){const c=iso(x,y);xs.push(c.x);ys.push(c.y)}
 const x0=Math.min(...xs)-90,y0=Math.min(...ys)-60,w=Math.max(...xs)-x0+90,h=Math.max(...ys)-y0+60,K=.5;
 const c=mk(Math.ceil(w*K),Math.ceil(h*K)),g=c.getContext('2d');g.setTransform(K,0,0,K,-x0*K,-y0*K);
 const blob=(x,y,rx,ry,stops)=>{const gr=g.createRadialGradient(x,y,1,x,y,rx);for(const [o,col] of stops)gr.addColorStop(o,col);g.fillStyle=gr;g.save();g.translate(x,y);g.scale(1,ry/rx);g.translate(-x,-y);g.beginPath();g.arc(x,y,rx,0,7);g.fill();g.restore()};
 const dayA=.16*(1-n);if(dayA>.01)for(const [x,y] of winTiles()){const q=iso(x,y);blob(q.x,q.y,34,17,[[0,'rgba(255,246,210,'+dayA+')'],[1,'rgba(255,246,210,0)']])}
 for(const r of S.rooms){if(r.par)continue;const q=iso(r.x+r.w/2,r.y+r.h/2),R=(r.w+r.h)*HW*.42;const a=n>.02?.3*n:.07;blob(q.x,q.y,R,R*.5,[[0,'rgba(255,214,150,'+a+')'],[.6,'rgba(255,200,130,'+(a*.35)+')'],[1,'rgba(255,200,130,0)']])}
 if(n>.02){const e=iso(S.ent.x+.5,S.h+1.2);blob(e.x,e.y,80,40,[[0,'rgba(255,225,160,'+(.42*n)+')'],[1,'rgba(255,225,160,0)']])}
 return{c,x0,y0,w,h}}
// ---- частицы ----
function emit(key,every,dt,f){GFX.emT[key]=(GFX.emT[key]||Math.random()*every)-dt;if(GFX.emT[key]<=0){GFX.emT[key]+=every;f()}}
function particles(g,dt,now){const P=GFX.P,cap=gq().parts;
 if(dt>0&&P.length<cap){
  for(const r of S.rooms){for(const t of r.it||[]){if(t.k==='coffee'||t.k==='pumpmachine'){const fp=t.fp||fpOf(t.k),c=iso(t.x+fp[0]/2,t.y+fp[1]/2);emit('st'+r.id+t.x+'_'+t.y,.45,dt,()=>P.push({k:0,x:c.x+(Math.random()-.5)*4,y:c.y-(t.k==='coffee'?44:52),vx:(Math.random()-.5)*4,vy:-9-Math.random()*5,t:0,T:1.8+Math.random(),r:2}))}}
   const d=D.rooms[r.type];if(d&&d.machine&&r.cond<30){const c=iso(r.x+r.w/2,r.y+r.h/2);emit('sp'+r.id,.35,dt,()=>{for(let i=0;i<4;i++)P.push({k:1,x:c.x+(Math.random()-.5)*10,y:c.y-34,vx:(Math.random()-.5)*60,vy:-30-Math.random()*40,t:0,T:.5+Math.random()*.4,r:1.2})});if(r.cond<15)emit('sm'+r.id,.5,dt,()=>P.push({k:3,x:c.x,y:c.y-40,vx:(Math.random()-.5)*5,vy:-12,t:0,T:2.4,r:4}))}}
  for(const it of S.items)if(it.type==='coffee'){const fp=it.fp||fpOf('coffee'),c=iso(it.x+fp[0]/2,it.y+fp[1]/2);emit('si'+it.x+'_'+it.y,.5,dt,()=>P.push({k:0,x:c.x,y:c.y-44,vx:(Math.random()-.5)*4,vy:-9,t:0,T:2,r:2}))}
  for(const p of S.pats){if(p.state==='dead'||(p.path&&p.path.length))continue;if(p.inf||p._snz===undefined){p._snz=p._snz??(3+Math.random()*12)}p._snz-=dt*(p.inf?3:1);if(p._snz<=0){p._snz=6+Math.random()*14;const c=iso(p.x+.5,p.y+.5),dx=(p.dir===0||p.dir===3)?1:-1;for(let i=0;i<5;i++)P.push({k:2,x:c.x+dx*5,y:c.y-58,vx:dx*(14+Math.random()*16),vy:(Math.random()-.5)*8,t:0,T:.9+Math.random()*.4,r:2.2,inf:!!p.inf})}}}
 for(let i=P.length-1;i>=0;i--){const p=P[i];p.t+=dt;if(p.t>=p.T){P.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k===1)p.vy+=160*dt;if(p.k===2){p.vx*=1-1.8*dt}}
 for(const p of P){const q=p.t/p.T;
  if(p.k===0){g.fillStyle='rgba(255,255,255,'+(.32*(1-q))+')';g.beginPath();g.arc(p.x+Math.sin(now/300+p.y)*1.5,p.y,p.r+q*5,0,7);g.fill()}
  else if(p.k===1){g.fillStyle=q<.4?'#fff6c0':'rgba(255,'+Math.round(170-q*120)+',40,'+(1-q)+')';g.fillRect(p.x-p.r/2,p.y-p.r/2,p.r*1.4,p.r*1.4)}
  else if(p.k===2){g.fillStyle=p.inf?'rgba(150,220,120,'+(.45*(1-q))+')':'rgba(235,245,255,'+(.5*(1-q))+')';g.beginPath();g.arc(p.x,p.y,p.r+q*4,0,7);g.fill()}
  else{g.fillStyle='rgba(60,60,60,'+(.4*(1-q))+')';g.beginPath();g.arc(p.x,p.y,p.r+q*9,0,7);g.fill()}}}
// ---- пост-эффекты ----
function v19Post(g,W,H){const Q=gq();
 if(Q.bloom){GFX.blF=(GFX.blF+1)%4;if(!GFX.bl||GFX.bl.width!==Math.ceil(W/4)){GFX.bl=mk(Math.ceil(W/4),Math.ceil(H/4));GFX.blF=0}
  const b=GFX.bl,bg=b.getContext('2d');if(GFX.blF===0){bg.globalCompositeOperation='copy';bg.drawImage(cv,0,0,b.width,b.height)}
  g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.10;g.imageSmoothingEnabled=true;g.drawImage(b,0,0,W,H);g.restore()}
 const n=Q.light?Math.round(dayNight()*10)/10:0;const vk=W+'x'+H+'|'+n;if(GFX.vgK!==vk){GFX.vgK=vk;const w=Math.ceil(W/4),h=Math.ceil(H/4);const c=mk(w,h),vg2=c.getContext('2d');const vg=vg2.createRadialGradient(w/2,h/2,Math.min(w,h)*.38,w/2,h/2,Math.max(w,h)*.78);vg.addColorStop(0,'rgba(8,12,28,0)');vg.addColorStop(1,'rgba(8,12,28,'+(.32+.18*n)+')');vg2.fillStyle=vg;vg2.fillRect(0,0,w,h);GFX.vg=c}
 g.drawImage(GFX.vg,0,0,W,H);
 return true}
// ---- контроль FPS и авто-понижение качества ----
function perfTrack(dt){if(!(dt>0))return;const F=GFX.ft;F.push(dt);if(F.length>240)F.shift();GFX.fps=F.length/F.reduce((a,b)=>a+b,0);
 if(!GFX.manual&&GFX.q!=='low'&&F.length>=240&&GFX.fps<36&&performance.now()-GFX.downT>8000){GFX.downT=performance.now();const nq=GFX.q==='high'?'medium':'low';setGfx(nq,true);F.length=0;try{msg('⚙️ Графика понижена до «'+GNAME[nq]+'» для плавности')}catch(e){}}}
const GNAME={low:'Низкая',medium:'Средняя',high:'Высокая'};
// ---- меню: выбор качества ----
{const _sm=showMenu;showMenu=function(){_sm();const p=$('panel'),h=p.querySelector('h3');const d=document.createElement('div');d.className='row';d.innerHTML='<span>Графика</span><span>'+['low','medium','high'].map(q=>'<button class="'+(GFX.q===q?'on':'')+'" onclick="setGfx(\''+q+'\')">'+GNAME[q]+'</button>').join(' ')+'</span>';if(h)h.after(d);else p.prepend(d)};
 addEventListener('load',()=>{const b=$('bMenu');if(b)b.onclick=()=>showMenu()})}
if(typeof resize==='function')resize();

window.PAINT={ok:false,im:[]};Promise.all([0,1,2,3,4,5].map(i=>new Promise(r=>{const m=new Image();m.onload=()=>r(m);m.onerror=()=>r(null);m.src='assets/paint/p'+i+'.png'}))).then(a=>{if(a.every(Boolean)){PAINT.im=a;PAINT.ok=true;for(const k in SPR)if(k.startsWith('w2_'))delete SPR[k]}});
