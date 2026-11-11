'use strict';
// ===== v21: реалистичные процедуры в кабинетах (фазы, позы, движение аппаратов, эффекты) =====
// Фаза процедуры q=0..1 берётся из p.t/p.tT (время лечения). Позы: лечь/сесть/встать — общая система motion.js.
(function patchLayouts(){const go=()=>{if(typeof D==='undefined'||!D||!D.rooms||!D.rooms.diag){return setTimeout(go,50)}
 const R=D.rooms;const set=(k,f)=>{if(R[k]&&R[k].layout)f(R[k].layout)};
 // Сканер: пациент ложится на стол сканера (раньше стоял рядом)
 set('diag',L=>{L.spots.patient={c:0,r:2,pose:'lie',at:{c:0,r:0}}});
 // Кардио: лежит на кушетке рядом с аппаратом — уже 'lie'
};go()})();
const V21={};
function procQ(p){if(!p||p.state!=='treat')return -1;const T=p.tT||p.t||1;return Math.max(0,Math.min(1,1-p.t/T))}
function v21RoomOf(p){return S.rooms.find(r=>r.id===p.room)}
function ease(x){return x<0?0:x>1?1:x*x*(3-2*x)}
// Расчёт смещений/масштаба тела пациента для текущей фазы
function v21Body(p){p.fx=null;if(p.vs&&p.vs.pose==='lie'&&p.state==='treat'&&p.vs.ph!=='sat'){const r=v21RoomOf(p);if(r&&r.type==='diag'){const a=iso(0,0),b=iso(0,+(V21.db??.85));const k=p.vs.ph==='down'?Math.min(1,p.vs.t/1.8):1-Math.min(1,p.vs.t/1.8);p.fx={dx:(b.x-a.x)*k,dy:(b.y-a.y)*k+6*k,sx:1,sy:1};return}}if(p.state==='treat'){if(!p.tT||p.t>p.tT)p.tT=Math.max(p.t,.5)}else if(p.tT)p.tT=0;if(p.state==='treat'&&!p.vs){const r=v21RoomOf(p);const A={reboot:.85,xray:.42,genetics:.3,inflate:.3,pump:.3}[r&&r.type];if(A){const q=procQ(p),k=ease(q/.1)*(1-ease((q-.9)/.1));const a=iso(0,0),b=iso(0,-A*k);p.fx={dx:b.x-a.x,dy:b.y-a.y,sx:1,sy:1};
   if(r.type==='inflate'){const s2=q<.7?ease((q-.1)/.6):1-ease((q-.7)/.2);p.fx.sx=1+.3*s2;p.fx.sy=1+.06*s2}
   if(r.type==='pump'){const s2=Math.sin(Math.max(0,q-.1)/.8*Math.PI);p.fx.sx=1-.1*Math.max(0,s2)}
   if(r.type==='reboot'){p.fx.a=.6+.4*Math.abs(Math.cos(q*Math.PI*3));p.fx.glass='rebootpod';p.fx.s=k}}return}
 if(p.state!=='treat'||!p.vs||p.vs.ph!=='sat')return;const r=v21RoomOf(p);if(!r)return;const q=procQ(p),t=performance.now()/1000;
 switch(r.type){
  case'diag':{const s=ease(q/.15)-ease((q-.85)/.15);const B=+(V21.db??.85),Hh=+(V21.dh??6),L=+(V21.dl??1.0);const a=iso(0,0),b=iso(0,B-L*s);p.fx={dx:b.x-a.x,dy:b.y-a.y+Hh,sx:1,sy:1,clip:'scanner',s};break}
  case'electro':{const z=(Math.sin(t*9)>.55)?1:0;p.fx={dx:z*(Math.random()-.5)*3,dy:z*(Math.random()-.5)*2,sx:1,sy:1};break}
 }}
function v21Tick(){if(!S)return;for(const p of S.pats)v21Body(p);
 // старые сохранения: перестроить планировку сканер-кабинета, когда он свободен
 for(const r of S.rooms)if(r.type==='diag'&&r.busy==null&&r.sp&&r.sp.patient&&r.sp.patient.pose!=='lie'&&D.rooms.diag.layout.spots.patient.pose==='lie'){const l=layout(r);if(l){r.it=l.items;r.sp=l.sp;if(typeof wallSig!=='undefined')wallSig=''}}}
// Отрисовка персонажа с учётом эффектов процедуры
function v21Draw(e,V,x,y){const f=e.fx;if(!f){aDraw(cx,V.ch,V.act,V.d,V.i,x,y);return}
 cx.save();const a=cx.globalAlpha;if(f.a!=null)cx.globalAlpha=a*f.a;cx.translate(x+f.dx,y+f.dy);cx.scale(f.sx,f.sy);aDraw(cx,V.ch,V.act,V.d,V.i,0,0);cx.restore();
 if(f.glass&&f.s>.5){const r=v21RoomOf(e),t=r&&r.it.find(t=>t.k===f.glass);if(t){const c=itemC(t,0);cx.save();cx.globalAlpha=.28*f.s;cx.fillStyle='#bff7ff';cx.beginPath();cx.ellipse(c.x,c.y-48,15,44,0,0,7);cx.fill();cx.restore()}}
 if(f.clip){const r=v21RoomOf(e),t=r&&r.it.find(t=>t.k===f.clip);if(t&&f.s>.02)v21ScanFront(t,f.s)}}
// перерисовать кольцо сканера поверх въехавшего тела
function v21ScanFront(t,s){const fp=t.fp||fpOf(t.k),a=iso(t.x,t.y),b=iso(t.x+fp[0],t.y),c=iso(t.x+fp[0],t.y+.62),d=iso(t.x,t.y+.62);
 cx.save();cx.beginPath();cx.moveTo(a.x,a.y-120);cx.lineTo(b.x,b.y-120);cx.lineTo(c.x,c.y+6);cx.lineTo(d.x,d.y+6);cx.closePath();cx.clip();draw3D(cx,t.k,t.x,t.y,t.dir,t.fp);cx.restore()}

// ---- эффекты аппаратов и персонала (сортируются по глубине вместе со сценой) ----
const FXC={};function glow(g,x,y,r,col,a){const k=col+'|'+Math.round(r);let c=FXC[k];if(!c){c=mk(Math.ceil(r*2),Math.ceil(r*2));const gg=c.getContext('2d'),gr=gg.createRadialGradient(r,r,0,r,r,r);gr.addColorStop(0,col.replace('A','1'));gr.addColorStop(.45,col.replace('A','.45'));gr.addColorStop(1,col.replace('A','0'));gg.fillStyle=gr;gg.fillRect(0,0,r*2,r*2);FXC[k]=c}
 g.save();g.globalAlpha=Math.max(0,Math.min(1,a));g.globalCompositeOperation='lighter';g.drawImage(c,x-r,y-r);g.restore()}
function ecg(g,x,y,w,t,col){g.save();g.fillStyle='rgba(10,25,20,.85)';g.fillRect(x-2,y-9,w+4,16);g.strokeStyle=col||'#5f5';g.lineWidth=1.2;g.beginPath();for(let i=0;i<=w;i+=1){const ph=((i/w)+t*.9)%1;const v=ph>.42&&ph<.46?-7:ph>.46&&ph<.5?5:ph>.5&&ph<.53?-2:0;i?g.lineTo(x+i,y+v):g.moveTo(x+i,y+v)}g.stroke();g.restore()}
function bolt(g,x0,y0,x1,y1){g.save();g.strokeStyle='rgba(190,230,255,.95)';g.lineWidth=1.6;g.beginPath();g.moveTo(x0,y0);const n=5;for(let i=1;i<n;i++){g.lineTo(x0+(x1-x0)*i/n+(Math.random()-.5)*8,y0+(y1-y0)*i/n+(Math.random()-.5)*8)}g.lineTo(x1,y1);g.stroke();g.restore()}
function itemC(t,h){const fp=t.fp||fpOf(t.k);const c=iso(t.x+fp[0]/2,t.y+fp[1]/2);return{x:c.x,y:c.y-(h||0)}}
function v21Fx(ds,now){const t=now/1000;
 for(const r of S.rooms){if(!r.it)continue;const p=r.busy!=null?S.pats.find(x=>x.id===r.busy):null;const on=p&&p.state==='treat'&&p.vs?p.vs.ph==='sat':p&&p.state==='treat';const q=on?procQ(p):-1;
  const st=r.staff!=null?S.staff.find(s=>s.id===r.staff):null;const it=k=>r.it.find(x=>x.k===k);
  if(!V21in(r.x+r.w/2,r.y+r.h/2))continue;
  const push=(item,dd,f)=>ds.push({d:(item?itemDepth(item):r.x+r.y+r.w+r.h-2)+dd,f,bb:on&&item&&typeof v22IB==="function"?v22FB(item):undefined});
  switch(r.type){
   case'diag':{const s=it('scanner');if(!s)break;if(on&&q>.12&&q<.88){push(s,.3,()=>{const c=itemC(s,0),a=iso(s.x+.5,s.y+.3);const sw=.5+.5*Math.sin(t*5);glow(cx,a.x,a.y-34,26,'rgba(120,200,255,A)',.35+.35*sw);
     // экран консоли — срезы
     const m=iso(s.x+1.1,s.y+.1);cx.fillStyle='rgba(15,30,45,.9)';cx.fillRect(m.x-2,m.y-64,22,15);cx.fillStyle='rgba(120,210,255,.9)';const k=Math.floor(t*4)%5;cx.beginPath();cx.ellipse(m.x+9,m.y-56.5,3+k,5,0,0,7);cx.fill()})}break}
   case'xray':{const x=it('xray');if(!x)break;const c=itemC(x,0);if(on){const cyc=(q*4)%1;const fl=cyc>.5&&cyc<.7;
     push(x,.3,()=>{/* плечо аппарата ездит вверх-вниз к груди пациента*/
      const yy=c.y-70+Math.sin(Math.min(1,cyc/.5)*Math.PI/2)*12;cx.fillStyle='#d8dde3';cx.fillRect(c.x+4,yy,16,10);cx.fillStyle='#6b7480';cx.fillRect(c.x+6,yy+10,12,3);
      if(fl){glow(cx,c.x+12,yy+12,40,'rgba(170,220,255,A)',.9);const pp=iso(p.x+.5,p.y+.5);cx.save();cx.globalAlpha=.55;cx.fillStyle='#bfe6ff';cx.fillRect(pp.x-9,pp.y-60,18,30);cx.strokeStyle='#fff';cx.lineWidth=1.3;for(let i=0;i<4;i++){cx.beginPath();cx.moveTo(pp.x-7,pp.y-55+i*6);cx.quadraticCurveTo(pp.x,pp.y-58+i*6,pp.x+7,pp.y-55+i*6);cx.stroke()}cx.fillRect(pp.x-1,pp.y-60,2,30);cx.restore()}
      if(!fl&&cyc>.66&&cyc<.9){cx.fillStyle='rgba(20,30,40,.9)';cx.fillRect(c.x-30,c.y-80,18,22);cx.strokeStyle='#cfe8ff';cx.lineWidth=1;cx.strokeRect(c.x-27,c.y-77,12,16);cx.beginPath();cx.moveTo(c.x-21,c.y-76);cx.lineTo(c.x-21,c.y-62);cx.stroke()}})}break}
   case'cardio':{const s=it('scanner'),b=it('bed');if(!s)break;push(s,.3,()=>{const c=itemC(s,0);ecg(cx,c.x-14,c.y-78,28,t,on?'#6f6':'#3a3');if(on){const beat=(t*1.4)%1<.12;if(beat)glow(cx,c.x+18,c.y-82,8,'rgba(255,80,90,A)',.9);
      if(b&&q>.45&&q<.52){const bc=itemC(b,22);bolt(cx,c.x,c.y-50,bc.x,bc.y);bolt(cx,c.x+4,c.y-46,bc.x+6,bc.y-2);glow(cx,bc.x,bc.y,26,'rgba(200,230,255,A)',.8)}}});break}
   case'surgery':case'transplant':{const b=it('bed');if(!b)break;push(b,.6,()=>{const c=itemC(b,0);/* операционная лампа и монитор*/
      glow(cx,c.x,c.y-18,30,'rgba(255,255,235,A)',on?.55:.15);cx.fillStyle='#cfd5da';cx.beginPath();cx.ellipse(c.x,c.y-92,14,5,0,0,7);cx.fill();cx.fillStyle='#fffbe0';cx.beginPath();cx.ellipse(c.x,c.y-90,10,3,0,0,7);cx.fill();cx.strokeStyle='#9aa3ab';cx.lineWidth=2;cx.beginPath();cx.moveTo(c.x,c.y-96);cx.lineTo(c.x,c.y-130);cx.stroke();
      const m=iso(b.x+1.2,b.y+.2);ecg(cx,m.x-6,m.y-58,22,t,on?'#6f6':'#3a3');
      if(on){const k=Math.floor(t*3)%3;if(r.type==='transplant'&&q>.35&&q<.75){const o=iso(b.x+1.1,b.y+1.1);cx.font='12px sans-serif';emoT(12,'🫀',o.x,o.y-30-Math.sin(t*4)*2)}
       for(let i=0;i<3;i++){if(Math.random()<.35)glow(cx,c.x-8+i*8,c.y-26+(k-1)*2,4,'rgba(255,255,255,A)',.9)}}});break}
   case'ward':case'icu':{for(const b of r.it.filter(x=>x.k==='bed')){push(b,.6,()=>{const c=itemC(b,0),m=iso(b.x-0.1,b.y+.2);/* капельница*/
      cx.strokeStyle='#9aa3ab';cx.lineWidth=1.5;cx.beginPath();cx.moveTo(m.x,m.y);cx.lineTo(m.x,m.y-70);cx.stroke();cx.fillStyle='rgba(220,240,255,.9)';cx.fillRect(m.x-4,m.y-72,8,11);const dp=(t*1.2)%1;cx.fillStyle='#8cf';cx.fillRect(m.x-.8,m.y-58+dp*14,1.6,2.2);
      if(r.type==='icu'){ecg(cx,m.x+6,m.y-62,18,t+b.x,'#6f6')}
      const lying=S.pats.some(x=>x.vs&&x.vs.ph==='sat'&&x.vs.sp.at&&x.vs.sp.at.x===b.x&&x.vs.sp.at.y===b.y);if(lying&&r.type==='ward'){const z=(t*.6+b.x*.3)%1;cx.globalAlpha=1-z;emoT(10,'💤',c.x+6+z*6,c.y-30-z*18);cx.globalAlpha=1}})}break}
   case'derma':{const u=it('uvlamp'),b=it('bed');if(!u||!b)break;push(b,.6,()=>{const c=itemC(b,10);if(on){const a=.75+.25*Math.sin(t*7);const L=itemC(u,96);cx.save();cx.globalAlpha=.22*a;cx.fillStyle='#b070ff';cx.beginPath();cx.moveTo(L.x-4,L.y);cx.lineTo(L.x+4,L.y);cx.lineTo(c.x+26,c.y+4);cx.lineTo(c.x-26,c.y+4);cx.closePath();cx.fill();cx.restore();glow(cx,c.x,c.y,44,'rgba(170,80,255,A)',a);glow(cx,c.x,c.y,14,'rgba(230,200,255,A)',a)}else glow(cx,c.x,c.y,18,'rgba(170,80,255,A)',.12)});break}
   case'electro':{const e=it('elchair');if(!e)break;push(e,.6,()=>{const c=itemC(e,0);if(on&&Math.sin(t*9)>.55){for(let i=0;i<2;i++)bolt(cx,c.x+(Math.random()-.5)*20,c.y-80,c.x+(Math.random()-.5)*16,c.y-40);glow(cx,c.x,c.y-56,30,'rgba(150,200,255,A)',.6)}else glow(cx,c.x,c.y-80,8,'rgba(150,200,255,A)',.3+.2*Math.sin(t*3))});break}
   case'reboot':{const e=it('rebootpod');if(!e)break;push(e,.6,()=>{const c=itemC(e,0);if(on){const k=(t*.8)%1;glow(cx,c.x,c.y-30-k*50,26,'rgba(90,255,160,A)',.6*(1-k));glow(cx,c.x,c.y-40,30,'rgba(90,255,160,A)',.25);cx.fillStyle='rgba(10,30,20,.85)';cx.fillRect(c.x-16,c.y-104,32,8);cx.fillStyle='#5f8';cx.fillRect(c.x-15,c.y-103,30*q,6)}});break}
   case'pump':case'inflate':{const e=it(r.type==='pump'?'pumpmachine':'inflator');if(!e)break;push(e,.6,()=>{const c=itemC(e,0);if(on){const ph=(t*1.5)%1;cx.strokeStyle='rgba(200,230,255,'+(1-ph)+')';cx.lineWidth=1.5;cx.beginPath();cx.ellipse(c.x,c.y-50,8+ph*20,4+ph*10,0,0,7);cx.stroke();
      if(p){const pp=iso(p.x+.5,p.y+.5);cx.strokeStyle='#5a6470';cx.lineWidth=2;cx.beginPath();cx.moveTo(c.x,c.y-40);cx.quadraticCurveTo((c.x+pp.x)/2,Math.max(c.y,pp.y)+4,pp.x,pp.y-36);cx.stroke()}}});break}
   case'genetics':{const e=it('dnaseq');if(!e)break;push(e,.6,()=>{const c=itemC(e,0);if(on||st&&st.state==='work'){for(let i=0;i<8;i++){const y=c.y-60-i*4,ph=t*3+i*.7;cx.fillStyle='rgba(120,220,255,.85)';cx.fillRect(c.x+Math.sin(ph)*7-1.2,y,2.4,2.4);cx.fillStyle='rgba(255,140,220,.85)';cx.fillRect(c.x-Math.sin(ph)*7-1.2,y,2.4,2.4)}glow(cx,c.x,c.y-74,14,'rgba(160,220,255,A)',.4)}});break}
   case'lab':case'research':{const e=it(r.type==='lab'?'tubes':'labbench');if(!e)break;if(!(on||st&&st.state==='work'))break;push(e,.6,()=>{const c=itemC(e,0);for(let i=0;i<4;i++){const k=(t*.7+i*.25)%1;cx.fillStyle='rgba(200,255,200,'+(.8*(1-k))+')';cx.beginPath();cx.arc(c.x-10+i*7,c.y-46-k*22,1.6+k*1.5,0,7);cx.fill()}});break}
   case'psych':{if(!on)break;push(null,.5,()=>{const pp=iso(p.x+.5,p.y+.5),sp=st?iso(st.x+.5,st.y+.5):pp;const k=Math.floor(t/1.6)%2,w=(t%1.6)/1.6;const who=k?sp:pp;cx.globalAlpha=Math.min(1,w*5,(1-w)*5);emoT(13,k?'💭':'💬',who.x+8,who.y-78);cx.globalAlpha=1});break}
   case'gp':case'paygp':{if(!on)break;push(null,.5,()=>{const sp=st?iso(st.x+.5,st.y+.5):null;if(sp){const w=(t%2)/2;cx.globalAlpha=Math.min(1,w*4,(1-w)*4);emoT(12,q<.5?'🩺':'📝',sp.x+10,sp.y-80);cx.globalAlpha=1}});break}
   case'pharmacy':{if(!on)break;push(null,.5,()=>{const pp=iso(p.x+.5,p.y+.5);if(q>.6){const k=Math.min(1,(q-.6)/.2);cx.globalAlpha=k;emoT(12,'💊',pp.x+12,pp.y-56-k*6);cx.globalAlpha=1}});break}
   case'morgue':{const a=it('autopsy');if(!a)break;if(!(st&&st.state==='work'))break;push(a,.3,()=>{const c=itemC(a,0);cx.fillStyle='#e9eef2';cx.beginPath();cx.ellipse(c.x,c.y-22,22,7,-.46,0,7);cx.fill();cx.fillStyle='#d3dae0';cx.beginPath();cx.arc(c.x-17,c.y-15,5,0,7);cx.fill();glow(cx,c.x,c.y-30,22,'rgba(200,230,255,A)',.35)});break}
  }}}
