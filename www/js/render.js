'use strict';
// ===== Изометрический рендер (2:1) с процедурными пре-рендеренными спрайтами =====
const HW=32,HH=16,MARGIN=120,OY=110;let OX=0;
const SPR={};// кэш спрайтов
const ART={img:null,meta:null,floors:{}};
function loadImg(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
async function loadArt(){try{ART.meta=await (await fetch('assets/sprites/atlas.json')).json();ART.img=await loadImg('assets/sprites/atlas.png');for(const n of['lino','tiles','carpet','grass'])ART.floors[n]=await loadImg('assets/sprites/floor_'+n+'.jpg')}catch(e){console.warn('art fallback',e);ART.img=null}}
function atlasSpr(name,filter,flip){const key='a_'+name+(filter||'')+(flip?'f':'');if(SPR[key])return SPR[key];const m=ART.img&&ART.meta[name];if(!m)return null;const c=mk(m[2],m[3]),g=c.getContext('2d');if(flip){g.translate(m[2],0);g.scale(-1,1)}if(filter)g.filter=filter;g.drawImage(ART.img,m[0],m[1],m[2],m[3],0,0,m[2],m[3]);return SPR[key]=c}
function shadowSpr(){if(SPR.sh)return SPR.sh;const c=mk(64,32);softShadow(c.getContext('2d'),32,16,30,14,.45);return SPR.sh=c}
function shD(g,...a){g.globalAlpha=(ANIM.meta&&ANIM.meta.v19)?.35:1;g.drawImage(shadowSpr(),...a);g.globalAlpha=1}
const PMAP={balloonhead:'balloon',pixel:'patches',grumpliver:'grumpy',nosewhistle:'rednose',blinknose:'bluenose',puffytoes:'bigfeet',selfiesyndrome:'phone',giggles:'laugh',rubberknee:'knees',yawn:'yawn',echo:'arcs',squareeyes:'robot',
 drumheart:'grumpy',soapsneeze:'rednose',jellyspine:'knees',lostshadow:'arcs',fizzyblood:'bluenose',twistedtongue:'yawn',cloudhead:'balloon',hiccupclock:'laugh',glowskin:'glow',spotty:'spotty',zebra:'zebra',tail:'tail',flathead:'flat',deflated:'deflated',statichair:'static',lowbattery:'battery',bluescreen:'bsod',looping:'loop',lazyheart:'yawn',wanderliver:'grumpy',chattykidney:'laugh',bagpipelungs:'balloon',gourmetstomach:'bigfeet',lovesickheart:'glow',sneezykidney:'rednose'};
const FTEX={xray:['tiles','rgba(150,170,200,.2)'],genetics:['lino','rgba(220,150,240,.22)'],electro:['tiles','rgba(240,220,90,.18)'],reboot:['lino','rgba(100,170,240,.22)'],inflate:['lino','rgba(240,150,120,.2)'],derma:['tiles','rgba(190,140,240,.2)'],research:['lino','rgba(120,220,160,.22)'],reception:['lino','rgba(120,160,210,.22)'],gp:['lino','rgba(120,200,110,.2)'],diag:['lino','rgba(170,140,220,.22)'],lab:['tiles',null],pharmacy:['tiles','rgba(255,200,200,.15)'],ward:['lino','rgba(90,200,180,.22)'],psych:['carpet','rgba(160,90,40,.45)'],pump:['lino','rgba(100,170,230,.22)'],toilet:['tiles',null],staffroom:['carpet',null],morgue:['tiles','rgba(150,190,210,.25)'],transplant:['tiles','rgba(120,230,200,.2)']};
function drawItemAt(g,k,x,y,state){if(P3D[k]&&draw3D(g,k,x,y,1))return;const alias=k==='pumpmachine'?'coffee':k;const s=atlasSpr('f_'+alias,state==='dry'?'sepia(.9) brightness(.8)':'');const p=iso(x+.5,y+.5);if(!s){g.drawImage(itemSpr(k,state),p.x-32,p.y-HH-ITEM_H);return}
 const sc=k==='pumpmachine'?1.0:s.width>=120?.58:.7,w=s.width*sc,h=s.height*sc;g.drawImage(shadowSpr(),p.x-w*.55,p.y-w*.25,w*1.1,w*.5);g.drawImage(s,p.x-w/2,p.y+HH*.55-h,w,h);
 if(k==='pumpmachine'){const q=Math.sin(performance.now()/200),r=5+q*1.5,cy=p.y+HH*.55-h+4;const gr=g.createRadialGradient(p.x-1,cy-1,1,p.x,cy,r*2.2);gr.addColorStop(0,'rgba(255,90,90,.95)');gr.addColorStop(.4,'rgba(230,40,40,.8)');gr.addColorStop(1,'rgba(230,40,40,0)');g.fillStyle=gr;g.beginPath();g.arc(p.x,cy,r*2.2,0,7);g.fill()}}
let floorCv=null,floorSig='';
function iso(u,v){return{x:OX+(u-v)*HW,y:OY+(u+v)*HH}}
function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return[n>>16&255,n>>8&255,n&255]}
function shade(h,f){const c=hex2rgb(h).map(v=>Math.max(0,Math.min(255,Math.round(f>1?v+(255-v)*(f-1):v*f))));return'rgb('+c.join(',')+')'}
function mk(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function mkS(w,h){const s=typeof v19WS==='function'?v19WS():1,c=mk(Math.ceil(w*s),Math.ceil(h*s));c.lw=w;c.lh=h;c.g=c.getContext('2d');c.g.scale(s,s);return c}
function poly(g,pts,fill){g.beginPath();pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=fill;g.fill()}
// локальная изо-проекция внутри спрайта: тайл (0..1,0..1), начало в (ax,ay)
function L2(ax,ay){return(u,v,z=0)=>[ax+(u-v)*HW,ay+(u+v)*HH-z]}
function box(g,P,u,v,w,d,h,col,z=0,opt={}){const a=P(u,v,z+h),b=P(u+w,v,z+h),c=P(u+w,v+d,z+h),e=P(u,v+d,z+h),c0=P(u+w,v+d,z),e0=P(u,v+d,z),b0=P(u+w,v,z);
 let gr=g.createLinearGradient(e0[0],e0[1],c0[0],c[1]);gr.addColorStop(0,shade(col,.86));gr.addColorStop(1,shade(col,.74));poly(g,[e,c,c0,e0],gr);
 gr=g.createLinearGradient(c0[0],c0[1],b[0],b[1]);gr.addColorStop(0,shade(col,.62));gr.addColorStop(1,shade(col,.56));poly(g,[c,b,b0,c0],gr);
 gr=g.createLinearGradient(a[0],a[1],c[0],c[1]);gr.addColorStop(0,shade(col,1.15));gr.addColorStop(1,shade(col,1.0));poly(g,[a,b,c,e],gr);
 if(!opt.noEdge){g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=.8;g.beginPath();g.moveTo(...e);g.lineTo(...c);g.lineTo(...b);g.stroke()}
 return{a,b,c,e,c0,e0,b0}}
function cyl(g,P,u,v,r,h,col,z=0){const c=P(u,v,z),t=P(u,v,z+h),rx=r*HW*1.41,ry=r*HH*1.41;
 const gr=g.createLinearGradient(c[0]-rx,0,c[0]+rx,0);gr.addColorStop(0,shade(col,.95));gr.addColorStop(.35,shade(col,1.2));gr.addColorStop(1,shade(col,.55));
 g.fillStyle=gr;g.beginPath();g.ellipse(c[0],c[1],rx,ry,0,0,Math.PI);g.lineTo(t[0]-rx,t[1]);g.ellipse(t[0],t[1],rx,ry,0,Math.PI,0,true);g.closePath();g.fill();
 g.fillStyle=shade(col,1.12);g.beginPath();g.ellipse(t[0],t[1],rx,ry,0,0,7);g.fill()}
function softShadow(g,x,y,rx,ry,a=.35){g.save();g.translate(x,y);g.scale(1,ry/rx);const gr=g.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,'rgba(0,0,0,'+a+')');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(0,0,rx,0,7);g.fill();g.restore()}
function noiseDiamond(g,P,base,amt,n,sz=1.5){for(let i=0;i<n;i++){const u=Math.random(),v=Math.random(),p=P(u,v);g.fillStyle=shade(base,1+(Math.random()-.5)*amt);g.fillRect(p[0],p[1],sz,sz)}}

// ---------- текстуры пола ----------
function floorTile(kind,col,vari){const key='f_'+kind+col+vari;if(SPR[key])return SPR[key];const c=mk(64,32),g=c.getContext('2d'),P=L2(32,0);
 const dia=[P(0,0),P(1,0),P(1,1),P(0,1)];g.save();g.beginPath();dia.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.clip();
 g.fillStyle=col;g.fillRect(0,0,64,32);
 if(kind==='lino'){noiseDiamond(g,P,col,.12,160);const gr=g.createLinearGradient(0,0,64,32);gr.addColorStop(0,'rgba(255,255,255,.10)');gr.addColorStop(1,'rgba(0,0,0,.06)');g.fillStyle=gr;g.fillRect(0,0,64,32)}
 if(kind==='tiles'){g.strokeStyle='rgba(120,130,140,.45)';g.lineWidth=.8;for(let i=0;i<=4;i++){let a=P(i/4,0),b=P(i/4,1);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();a=P(0,i/4);b=P(1,i/4);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke()}noiseDiamond(g,P,col,.06,40)}
 if(kind==='carpet'){noiseDiamond(g,P,col,.35,700,1);}
 if(kind==='grass'){noiseDiamond(g,P,col,.4,500,1.2);}
 if(kind==='path'){noiseDiamond(g,P,col,.25,300,1.5)}
 g.restore();g.strokeStyle='rgba(0,0,0,.07)';g.lineWidth=1;g.beginPath();dia.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.stroke();return SPR[key]=c}
const FLOORS={reception:['lino','#c9d6e3'],gp:['lino','#cfe3c8'],diag:['lino','#dcd3ea'],lab:['tiles','#eef0f2'],pharmacy:['tiles','#f4ecec'],ward:['lino','#cfe9e4'],psych:['carpet','#a8683f'],pump:['lino','#c8dcea'],toilet:['tiles','#e6eef4'],staffroom:['carpet','#7b8fa8']};
function buildFloor(){const W=(S.w+S.h)*HW+MARGIN*2,H=(S.w+S.h)*HH+OY+MARGIN;const FS=typeof v19FS==='function'?v19FS(W,H):1;floorCv=mk(Math.ceil(W*FS),Math.ceil(H*FS));floorCv._fs=FS;const g=floorCv.getContext('2d');g.scale(FS,FS);
 if(ART.img){const pats={};const pat=n=>{if(!pats[n]){const im=(ART.floors2&&ART.floors2[n])||ART.floors[n]||ART.floors.lino,p=g.createPattern(im,'repeat'),k=2/im.width;p.setTransform(new DOMMatrix([HW*k,HH*k,-HW*k,HH*k,OX,OY]));pats[n]=p}return pats[n]};
  const tf=(u,v,n,tint)=>{const a=iso(u,v),b=iso(u+1,v),c=iso(u+1,v+1),d=iso(u,v+1);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(c.x,c.y);g.lineTo(d.x,d.y);g.closePath();g.fillStyle=pat(n);g.fill();if(tint){g.fillStyle=tint;g.fill()}};
  for(let v=-5;v<S.h+5;v++)for(let u=-5;u<S.w+5;u++){if(u>=0&&v>=0&&u<S.w&&v<S.h&&!isHole(u,v))continue;const pathT=Math.abs(u-S.ent.x)<1&&v>=S.h;tf(u,v,pathT?(ART.floors2?'terrazzo':'lino'):'grass',pathT?'rgba(90,80,60,.35)':null)}
  for(let v=0;v<S.h;v++)for(let u=0;u<S.w;u++){if(isHole(u,v))continue;const r=roomAt(u,v);const f=typeof v19F==='function'?v19F(r):r?FTEX[r.type]||['lino',null]:['lino','rgba(230,215,185,.18)'];tf(u,v,f[0],f[1])}
  g.strokeStyle='rgba(0,0,0,.06)';g.lineWidth=1;for(let v=0;v<=S.h;v++){const a=iso(0,v),b=iso(S.w,v);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}for(let u=0;u<=S.w;u++){const a=iso(u,0),b=iso(u,S.h);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}}
 else{
 // трава вокруг
 for(let v=-4;v<S.h+4;v++)for(let u=-4;u<S.w+4;u++){if(u>=0&&v>=0&&u<S.w&&v<S.h)continue;const p=iso(u,v);const pathT=Math.abs(u-S.ent.x)<1&&v>=S.h;g.drawImage(floorTile(pathT?'path':'grass',pathT?'#a59a88':'#5f8f4a',(u*7+v*3)%4),p.x-32,p.y)}
 for(let v=0;v<S.h;v++)for(let u=0;u<S.w;u++){const r=roomAt(u,v),p=iso(u,v);const f=r?FLOORS[r.type]||['lino','#ddd']:['lino',(u+v)%2?'#d9d2c3':'#d2cab9'];g.drawImage(floorTile(f[0],f[1],(u*13+v*7)%3),p.x-32,p.y)}}
 // мягкое затенение у стен и свет ламп в комнатах
 for(const r of S.rooms){if(r.par)continue;const c=iso(r.x+r.w/2,r.y+r.h/2);const gr=g.createRadialGradient(c.x,c.y,4,c.x,c.y,(r.w+r.h)*HW*.5);gr.addColorStop(0,'rgba(255,248,220,.28)');gr.addColorStop(1,'rgba(255,248,220,0)');g.fillStyle=gr;g.beginPath();g.ellipse(c.x,c.y,(r.w+r.h)*HW*.5,(r.w+r.h)*HH*.5,0,0,7);g.fill();
  const a=iso(r.x+1,r.y+1),b=iso(r.x+r.w-1,r.y+1),e=iso(r.x+1,r.y+r.h-1),a2=iso(r.x+1,r.y+1.6),b2=iso(r.x+r.w-1,r.y+1.6);let gg=g.createLinearGradient(a.x,a.y,a2.x,a2.y);gg.addColorStop(0,'rgba(0,0,0,.25)');gg.addColorStop(1,'rgba(0,0,0,0)');poly(g,[[a.x,a.y],[b.x,b.y],[b2.x,b2.y],[a2.x,a2.y]],gg);
  const e2=iso(r.x+1.6,r.y+r.h-1),a3=iso(r.x+1.6,r.y+1);gg=g.createLinearGradient(a.x,a.y,a3.x,a3.y);gg.addColorStop(0,'rgba(0,0,0,.22)');gg.addColorStop(1,'rgba(0,0,0,0)');poly(g,[[a.x,a.y],[a3.x,a3.y],[e2.x,e2.y],[e.x,e.y]],gg)}
 // наружная стена здания (задняя), тень
 const p0=iso(0,0),p1=iso(S.w,0),p2=iso(0,S.h);g.fillStyle='rgba(0,0,0,.18)';
 floorSig=sig()}
function sig(){return S.lv+'~'+(S.lots||[]).map(l=>l.own?1:0).join('')+'~'+S.rooms.map(r=>r.id+':'+r.x+','+r.y+','+r.w+','+r.h).join('|')+'#'+S.w}

// ---------- стены ----------
function wallSpr(tall,sd,col,variant){const key=['w2',sd.T,sd.L,sd.B,sd.R,col,variant].join('_');if(SPR[key])return SPR[key];const HT=56,HS=15,H=(sd.T||sd.L)?HT:HS,c=mkS(64,32+H+4),g=c.g,P=L2(32,H+2);
 const wc='#ebe5da',TK=.2;
 if(sd.T)box(g,P,0,0,1,TK,HT,wc);if(sd.L)box(g,P,0,0,TK,1,HT,wc);
 if(sd.B)box(g,P,0,1-TK,1,TK,HS,'#e2dacb');if(sd.R)box(g,P,1-TK,0,TK,1,HS,'#e2dacb');
 g.globalCompositeOperation='source-atop';for(let n=0;n<260;n++){g.fillStyle=Math.random()<.5?'rgba(0,0,0,.05)':'rgba(255,255,255,.07)';g.fillRect(Math.random()*64,Math.random()*c.lh,1.5,1.5)}g.globalCompositeOperation='source-over';
 const band=(face,z0,z1,colr)=>{const a=face==='T'?[P(0,TK,z0),P(1,TK,z0),P(1,TK,z1),P(0,TK,z1)]:[P(TK,0,z0),P(TK,1,z0),P(TK,1,z1),P(TK,0,z1)];poly(g,a,colr)};
 if(sd.T||sd.L){const f=sd.T?'T':'L';band(f,0,4,'rgba(80,60,40,.5)');band(f,17,21,shade(col,f==='T'?.8:.65));
  const q=(t,z)=>f==='T'?P(t,TK,z):P(TK,t,z);
  if(variant==='door'){poly(g,[q(.15,0),q(.85,0),q(.85,46),q(.15,46)],'#6e4424');const p2=[q(.2,0),q(.8,0),q(.8,42),q(.2,42)];const gr=g.createLinearGradient(p2[0][0],0,p2[1][0],0);gr.addColorStop(0,'#3a2c20');gr.addColorStop(1,'#241a12');poly(g,p2,gr)}
  else if(variant==='win'){poly(g,[q(.25,26),q(.75,26),q(.75,50),q(.25,50)],'#d9dde2');const p2=[q(.3,28),q(.7,28),q(.7,48),q(.3,48)];const gr=g.createLinearGradient(0,p2[3][1],0,p2[0][1]);gr.addColorStop(0,'#bfe3ff');gr.addColorStop(1,'#6fa8d6');poly(g,p2,gr);g.strokeStyle='rgba(255,255,255,.7)';g.beginPath();g.moveTo(...q(.5,28));g.lineTo(...q(.5,48));g.stroke()}
  else if(variant.startsWith('art')&&!(window.PAINT&&PAINT.ok)){poly(g,[q(.25,26),q(.75,26),q(.75,50),q(.25,50)],'#5a3d22');poly(g,[q(.3,29),q(.7,29),q(.7,47),q(.3,47)],shade(col,.9))}}
 if(typeof v19Wall==='function')v19Wall(g,P,sd,col,variant,TK,HT,HS);
 return SPR[key]=c}
function doorFrontSpr(){const key='doorfront';if(SPR[key])return SPR[key];const c=mkS(64,40),g=c.g,P=L2(32,6);poly(g,[P(.15,.15),P(.85,.15),P(.85,.85),P(.15,.85)],'#8a5a30');poly(g,[P(.2,.2),P(.8,.2),P(.8,.8),P(.2,.8)],'#5d6b78');noiseDiamond(g,P,'#5d6b78',.4,60);return SPR[key]=c}

// ---------- предметы ----------
const ITEM_H=60;
function itemSpr(k,state){const key='i_'+k+(state||'');if(SPR[key])return SPR[key];const c=mk(64,32+ITEM_H),g=c.getContext('2d'),P=L2(32,ITEM_H);const ctr=P(.5,.5);softShadow(g,ctr[0],ctr[1],24,11,.32);
 switch(k){
 case'desk':box(g,P,.12,.2,.08,.08,16,'#5b3a1e');box(g,P,.8,.2,.08,.08,16,'#5b3a1e');box(g,P,.12,.62,.08,.08,16,'#5b3a1e');box(g,P,.8,.62,.08,.08,16,'#5b3a1e');box(g,P,.08,.15,.84,.6,3,'#a06a3a',16);box(g,P,.35,.25,.06,.32,1,'#333',19);box(g,P,.36,.3,.03,.22,14,'#1d2228',20);
  {const a=P(.39,.31,22),b=P(.39,.51,22),cc=P(.39,.51,33),d=P(.39,.31,33);poly(g,[a,b,cc,d],'#58a7d8')}box(g,P,.55,.45,.25,.18,1,'#f4f4f4',19);break;
 case'chair':box(g,P,.3,.3,.4,.4,12,'#34495e');box(g,P,.3,.3,.08,.4,26,'#2c3e50',0);cyl(g,P,.5,.5,.04,8,'#888');break;
 case'cabinet':box(g,P,.15,.25,.7,.45,44,'#9aa7b2');for(let i=1;i<4;i++){const a=P(.18,.7,i*11),b=P(.82,.7,i*11);g.strokeStyle='#6d7a85';g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();const h=P(.5,.7,i*11-5);g.fillStyle='#ddd';g.fillRect(h[0]-3,h[1],6,2)}break;
 case'scanner':box(g,P,.05,.3,.9,.4,12,'#e9edf1');box(g,P,.15,.38,.7,.25,3,'#5aa0c8',12);box(g,P,.65,.05,.3,.9,46,'#dfe5ea');{const f=P(.65,.5,24);const gr=g.createRadialGradient(f[0],f[1],2,f[0],f[1],14);gr.addColorStop(0,'#111');gr.addColorStop(1,'#445');g.fillStyle=gr;g.beginPath();g.ellipse(f[0],f[1],9,15,-.5,0,7);g.fill();g.fillStyle='#3cf';const l=P(.95,.2,40);g.fillRect(l[0]-2,l[1],4,3)}break;
 case'bench':box(g,P,.1,.35,.08,.3,9,'#555');box(g,P,.82,.35,.08,.3,9,'#555');box(g,P,.05,.3,.9,.4,3,'#3d7ab8',9);box(g,P,.05,.3,.9,.08,14,'#2f669c',12);break;
 case'tubes':box(g,P,.1,.2,.8,.6,20,'#cfd6dc');box(g,P,.08,.18,.84,.64,2,'#f2f2f2',20);['#e74c3c','#2ecc71','#3498db','#f1c40f'].forEach((cl,i)=>cyl(g,P,.25+i*.15,.45,.035,12,cl,22));box(g,P,.55,.25,.25,.2,10,'#444',22);break;
 case'shelf':box(g,P,.1,.3,.8,.4,50,'#c9a27a');for(let i=0;i<4;i++){const cols=['#e74c3c','#ecf0f1','#f39c12','#1abc9c','#9b59b6'];for(let j=0;j<4;j++)box(g,P,.15+j*.18,.62,.12,.06,7,cols[(i+j)%5],4+i*12)}break;
 case'counter':box(g,P,.05,.3,.9,.45,24,'#d7c2b0');box(g,P,.03,.28,.94,.5,3,'#8e7461',24);box(g,P,.6,.4,.15,.15,6,'#fff',27);break;
 case'bed':box(g,P,.1,.05,.8,.9,10,'#b0b8c0');box(g,P,.12,.07,.76,.86,6,'#ffffff',10);box(g,P,.12,.35,.76,.58,3,'#4f8ec9',16);box(g,P,.2,.1,.6,.2,5,'#f6f6f6',16);box(g,P,.08,.02,.84,.06,26,'#8c97a1');break;
 case'sofa':box(g,P,.05,.25,.9,.55,12,'#7a3b2e');box(g,P,.05,.2,.9,.15,26,'#6a3226');box(g,P,.05,.25,.1,.55,18,'#6a3226');box(g,P,.85,.25,.1,.55,18,'#6a3226');box(g,P,.18,.38,.3,.35,4,'#8e4a3a',12);box(g,P,.52,.38,.3,.35,4,'#8e4a3a',12);break;
 case'lamp':cyl(g,P,.5,.5,.12,3,'#333');cyl(g,P,.5,.5,.02,40,'#555',3);cyl(g,P,.5,.5,.16,12,'#f4e3b0',40);{const p=P(.5,.5,40);const gr=g.createRadialGradient(p[0],p[1],2,p[0],p[1],30);gr.addColorStop(0,'rgba(255,240,180,.5)');gr.addColorStop(1,'rgba(255,240,180,0)');g.fillStyle=gr;g.fillRect(p[0]-30,p[1]-30,60,60)}break;
 case'pumpmachine':box(g,P,.1,.15,.8,.7,30,'#7f97a8');box(g,P,.15,.6,.5,.06,14,'#22303a',8);cyl(g,P,.5,.4,.12,14,'#c0c8cf',30);for(let i=0;i<3;i++){const p=P(.25+i*.15,.85,22);g.fillStyle=['#2ecc71','#f1c40f','#e74c3c'][i];g.beginPath();g.arc(p[0],p[1],2,0,7);g.fill()}break;
 case'wc':box(g,P,.3,.15,.4,.2,30,'#f4f6f8');cyl(g,P,.5,.55,.2,14,'#fafbfc');{const t=P(.5,.55,14);g.fillStyle='#cfd8df';g.beginPath();g.ellipse(t[0],t[1],10,5,0,0,7);g.fill()}break;
 case'sink':box(g,P,.25,.2,.5,.15,20,'#ddd');box(g,P,.2,.25,.6,.4,8,'#f4f8fb',22);cyl(g,P,.5,.3,.03,8,'#aaa',30);{const t=P(.5,.45,30);g.fillStyle='#b9c6cf';g.beginPath();g.ellipse(t[0],t[1],9,4,0,0,7);g.fill()}box(g,P,.42,.3,.16,.16,22,'#ccc');break;
 case'coffee':box(g,P,.1,.3,.8,.4,22,'#6d5a48');box(g,P,.3,.38,.35,.25,24,'#2b2b2b',22);box(g,P,.42,.6,.1,.04,6,'#aaa',30);cyl(g,P,.48,.6,.05,5,'#fff',24);break;
 case'plant':cyl(g,P,.5,.5,.15,14,'#b5653c');{const dry=state==='dry';const base=dry?'#9b8a4a':'#2f7d32';for(let i=0;i<14;i++){const a=i/14*6.28,r=6+Math.random()*7,p=P(.5,.5,20+Math.random()*16);g.fillStyle=shade(base,.75+Math.random()*.6);g.beginPath();g.ellipse(p[0]+Math.cos(a)*r,p[1]+Math.sin(a)*r*.6-(dry?-4:0),5,3.5,a,0,7);g.fill()}}break;
 case'radiator':for(let i=0;i<6;i++)box(g,P,.12+i*.13,.4,.08,.2,24,'#e8e8e8',3);box(g,P,.1,.42,.8,.16,3,'#cfcfcf');break;
 case'bin':cyl(g,P,.5,.5,.14,20,'#4a5560');{const t=P(.5,.5,20);g.fillStyle='#222';g.beginPath();g.ellipse(t[0],t[1],7,3.5,0,0,7);g.fill()}break;
 case'soda':box(g,P,.15,.25,.7,.5,56,'#c0392b');{const q=(t,z)=>P(t,.75,z);poly(g,[q(.2,24),q(.65,24),q(.65,50),q(.2,50)],'#2b2b2b');for(let i=0;i<3;i++)for(let j=0;j<3;j++){const p=q(.27+j*.14,28+i*7);g.fillStyle=['#e74c3c','#3498db','#f1c40f'][j];g.fillRect(p[0]-2,p[1]-5,4,5)}poly(g,[q(.2,8),q(.65,8),q(.65,14),q(.2,14)],'#111')}break}
 return SPR[key]=c}

// ---------- люди (кадры ходьбы, 4 направления: 2 вида × зеркало) ----------
const SKIN=['#f1c9a5','#e0ac69','#c68642','#8d5524','#ffdbac'];
function lookOf(e,isStaff){if(isStaff){const t=e.type;return{key:'s'+t+(e.id%5),skin:SKIN[e.id%5],coat:t==='doctor'?'#fbfbfb':t==='nurse'?'#f7a6c8':t==='handyman'?'#2f5fb3':t==='orderly'?'#5fae8c':'#e9b949',pants:t==='doctor'?'#34495e':t==='nurse'?'#fbfbfb':t==='handyman'?'#2a4d8f':t==='orderly'?'#5fae8c':'#3d3d3d',hair:['#2b1b0e','#6b4423','#d9b26f','#111','#a33'][e.id%5],role:t}}
 const h=Math.round(e.hue/30)*30;return{key:'p'+h+e.dis+(e.id%5),skin:e.dis==='grumpliver'?'#b9c98a':SKIN[e.id%5],coat:'hsl('+h+',45%,50%)',pants:'hsl('+((h+180)%360)+',25%,30%)',hair:['#2b1b0e','#6b4423','#d9b26f','#777','#111'][e.id%5],dis:e.dis,role:'pat'}}
function personSpr(lk,front,flip,fr){const key=lk.key+(front?'F':'B')+(flip?'f':'')+fr;if(SPR[key])return SPR[key];const c=mk(48,80),g=c.getContext('2d');if(flip){g.translate(48,0);g.scale(-1,1)}
 const X=24,F=72,ph=[0,1,0,-1][fr],big=lk.dis==='balloonhead',sw=ph*4;softShadow(g,X,F,13,5,.4);
 const limb=(x1,y1,x2,y2,w,col)=>{g.strokeStyle=col;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()};
 const foot=lk.dis==='puffytoes'?5:2.5;
 // ноги
 limb(X-3,52,X-3+sw*.6,F-2-(ph>0?2:0),5,lk.pants);limb(X+3,52,X+3-sw*.6,F-2-(ph<0?2:0),5,lk.pants);g.fillStyle='#222';g.beginPath();g.ellipse(X-3+sw*.6+(front?0:0),F-1,foot,2,0,0,7);g.fill();g.beginPath();g.ellipse(X+3-sw*.6,F-1,foot,2,0,0,7);g.fill();
 // заднее плечо-рука
 if(!front)limb(X+7,36,X+8-sw*.5,50,4,shade(lk.coat.startsWith('#')?lk.coat:'#888',.8));
 // тело с градиентом
 const coatLen=lk.role==='doctor'?60:53;const gr=g.createLinearGradient(X-9,0,X+9,0);if(lk.coat.startsWith('hsl')){gr.addColorStop(0,lk.coat);gr.addColorStop(1,lk.coat)}else{gr.addColorStop(0,shade(lk.coat,1.1));gr.addColorStop(1,shade(lk.coat,.72))}
 g.fillStyle=gr;g.beginPath();g.moveTo(X-8,33);g.quadraticCurveTo(X,29,X+8,33);g.lineTo(X+9,coatLen);g.lineTo(X-9,coatLen);g.closePath();g.fill();
 if(lk.coat.startsWith('hsl')){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(X+2,33,7,coatLen-33)}
 if(lk.role==='doctor'&&front){g.strokeStyle='#bbb';g.lineWidth=1;g.beginPath();g.moveTo(X,34);g.lineTo(X,58);g.stroke();g.strokeStyle='#333';g.lineWidth=1.5;g.beginPath();g.arc(X,39,5,0,Math.PI);g.stroke();g.fillStyle='#4a90d9';g.fillRect(X-7,44,3,4)}
 if(lk.role==='handyman'){g.fillStyle='#f5c518';g.fillRect(X-8,48,16,3)}
 if(lk.role==='receptionist'&&front){g.fillStyle='#fff';g.fillRect(X-2,33,4,6)}
 // руки
 const arm=lk.role==='pat'?shade('#888',1):shade(lk.coat,.95);const armC=lk.coat.startsWith('hsl')?lk.coat:arm;
 if(lk.dis==='selfiesyndrome'){limb(X-7,36,X-14,22,4,armC);g.fillStyle='#222';g.fillRect(X-17,16,5,8)}else limb(X-7,36,X-8+sw*.5,50,4,armC);
 if(front)limb(X+7,36,X+8-sw*.5,50,4,armC);
 g.fillStyle=lk.skin;g.beginPath();g.arc(X-8+sw*.5,51,2.2,0,7);g.fill();
 // голова
 const hr=big?11:7,hy=big?20:25;g.fillStyle=lk.skin;g.fillRect(X-2,28,4,4);const hg=g.createRadialGradient(X-2,hy-2,1,X,hy,hr+2);hg.addColorStop(0,shade(lk.skin,1.12));hg.addColorStop(1,shade(lk.skin,.78));g.fillStyle=hg;g.beginPath();g.arc(X,hy,hr,0,7);g.fill();
 g.fillStyle=lk.hair;g.beginPath();if(front){g.arc(X,hy-1,hr+.5,Math.PI*1.05,Math.PI*1.95)}else g.arc(X,hy,hr+.5,0,7);g.fill();
 if(lk.role==='nurse'){g.fillStyle='#fff';g.fillRect(X-5,hy-hr-3,10,4);g.fillStyle='#e33';g.fillRect(X-1,hy-hr-3,2,4)}
 if(lk.role==='handyman'){g.fillStyle='#2a4d8f';g.beginPath();g.arc(X,hy-2,hr+1,Math.PI,0);g.fill();g.fillRect(X-2,hy-3,hr+5,2)}
 if(front){const ey=hy+1;if(lk.dis==='squareeyes'){g.fillStyle='#fff';g.fillRect(X-5,ey-3,4,4);g.fillRect(X+1,ey-3,4,4);g.fillStyle='#000';g.fillRect(X-4,ey-2,2,2);g.fillRect(X+2,ey-2,2,2)}else{g.fillStyle='#222';g.fillRect(X-3.5,ey-1,1.6,1.8);g.fillRect(X+2,ey-1,1.6,1.8)}
  if(lk.dis==='nosewhistle'||lk.dis==='blinknose'){const glow=lk.dis==='blinknose';if(glow){const ng=g.createRadialGradient(X,ey+3,0,X,ey+3,7);ng.addColorStop(0,'rgba(255,240,80,.9)');ng.addColorStop(1,'rgba(255,240,80,0)');g.fillStyle=ng;g.fillRect(X-7,ey-4,14,14)}g.fillStyle=glow?'#ffe23a':'#e44';g.beginPath();g.arc(X,ey+3,2.2,0,7);g.fill()}
  g.strokeStyle='#7a3b2e';g.lineWidth=1;g.beginPath();if(lk.dis==='giggles'){g.arc(X,ey+4,3,0,Math.PI);g.fillStyle='rgba(255,90,120,.45)';g.fillRect(X-6,ey+2,3,2);g.fillRect(X+3,ey+2,3,2)}else if(lk.dis==='yawn'){g.fillStyle='#5a1f1f';g.ellipse(X,ey+5,2,3,0,0,7);g.fill()}else{g.moveTo(X-2,ey+5);g.lineTo(X+2,ey+5)}g.stroke()}
 if(lk.dis==='pixel'){g.fillStyle='#5ccf3a';for(let i=0;i<7;i++)g.fillRect(X-hr+((i*37)%(hr*2)),hy-hr/2+((i*53)%hr),2,2);for(let i=0;i<5;i++)g.fillRect(X-7+((i*29)%14),36+((i*17)%14),2,2)}
 if(lk.dis==='echo'){g.strokeStyle='rgba(160,140,255,.8)';g.lineWidth=1.2;for(let i=1;i<=3;i++){g.beginPath();g.arc(X,hy,hr+i*3,Math.PI*1.2,Math.PI*1.8);g.stroke()}}
 if(lk.dis==='rubberknee'){g.strokeStyle='#e67e22';g.lineWidth=2;g.beginPath();g.arc(X-3,60,2,0,7);g.arc(X+3,60,2,0,7);g.stroke()}
 return SPR[key]=c}
function entDir(e){if(e.path&&e.path.length){const n=e.path[0],dx=n.x-e.x,dy=n.y-e.y;if(Math.abs(dx)+Math.abs(dy)>.01){e._f=(dx+dy)>=0;e._fl=(dx-dy)<0}}return[e._f!==false,!!e._fl]}
function entFrame(e){const moving=e.path&&e.path.length>0;if(moving){const d=Math.hypot(e.x-(e._px??e.x),e.y-(e._py??e.y));e._an=((e._an||0)+d*5)%4}e._px=e.x;e._py=e.y;return moving?Math.floor(e._an):0}

// ---------- кадр ----------
let wallList=null,wallSig='';
function buildWalls(){wallList=[];for(const r of S.rooms){const col=D.rooms[r.type].color;if(!r.par)for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const isDoor=x===r.door.x&&y===r.door.y;if(!isWall(r,x,y)&&!isDoor)continue;
  const sd={T:y===r.y,L:x===r.x,B:y===r.y+r.h-1,R:x===r.x+r.w-1},back=sd.T||sd.L;let variant='plain';if(back&&!(sd.T&&sd.L)){variant=((x+y)%3===0)?'win':((x*7+y)%5===0)?'art'+((x*3+y*5)%6):'plain'}
  if(isDoor)wallList.push({x,y,img:back?wallSpr(true,sd,col,'door'):doorFrontSpr()});else wallList.push({x,y,img:wallSpr(back,sd,col,variant)})}
  // мебель комнаты
  roomLay(r);for(const t of r.it)wallList.push({x:t.x,y:t.y,item:t.k,t,room:r});if(!r.par)wallList.push({x:r.door.x,y:r.door.y,leaf:r})}
 wallSig=sig()}
// v21: отсечение по экрану + кэш эмодзи-текста
let VW={x0:0,y0:0,x1:1e9,y1:1e9};function V21in(x,y){const p=iso(x,y);return p.x>VW.x0-160&&p.x<VW.x1+160&&p.y>VW.y0-60&&p.y<VW.y1+220}
const EMO=new Map();function emoT(px,t,x,y){const k=px+'|'+t;let c=EMO.get(k);if(!c){if(EMO.size>300)EMO.clear();const g0=mk(4,4).getContext('2d');g0.font=(px*2)+'px sans-serif';const w=Math.ceil(g0.measureText(t).width)+4;c=mk(w,px*3);const g=c.getContext('2d');g.font=(px*2)+'px sans-serif';g.textBaseline='alphabetic';g.fillText(t,2,px*2.3);c._w=w/2;c._h=px*1.5;c._b=px*1.15;EMO.set(k,c)}cx.drawImage(c,x-c._w/2,y-c._b,c._w,c._h)}
function draw(){const dpr=cv.width/Math.max(1,innerWidth),W=cv.width,H=cv.height;OX=S.h*HW+MARGIN;if(!floorCv||floorSig!==sig())buildFloor();if(!wallList||wallSig!==sig()){buildWalls();V22.wv++}
 V22.dc=0;cx.setTransform(1,0,0,1,0,0);cx.imageSmoothingEnabled=true;
 const QS=quakeShake();const now=performance.now();VW={x0:cam.x,y0:cam.y,x1:cam.x+innerWidth/cam.z,y1:cam.y+innerHeight/cam.z};
 const ds=v22Static(dpr,W,H,QS);cx.setTransform(cam.z*dpr,0,0,cam.z*dpr,(-cam.x*cam.z+QS.x)*dpr,(-cam.y*cam.z+QS.y)*dpr);
 for(const l of S.litter)ds.push({d:l.x+l.y+.6,bb:v22TB(l.x,l.y,10),f:()=>{const p=iso(l.x+.5,l.y+.5);cx.fillStyle='#f4f4f0';cx.save();cx.translate(p.x,p.y);cx.rotate((l.x*13)%3);cx.fillRect(-4,-2,8,5);cx.fillStyle='#c33';cx.fillRect(-4,-2,3,5);cx.restore()}});
 const person=(e,isStaff)=>{const V=ANIM.ok?entVis(e,isStaff,now):null;const lk=lookOf(e,isStaff);let p=iso(e.x+.5,e.y+.5);let top=72;
  cx.globalAlpha=e.state==='dead'&&!e.body?Math.max(0,1-e.t/3):1;
  if(e.state==='dead'&&e.body){const q=iso(e.x+.5,e.y+.5);cx.drawImage(shadowSpr(),q.x-26,q.y-4,52,16);cx.fillStyle='#8d949c';cx.fillRect(q.x-22,q.y-10,3,10);cx.fillRect(q.x+19,q.y-10,3,10);cx.fillStyle='#c9d0d6';cx.fillRect(q.x-26,q.y-16,52,7);cx.fillStyle='#dfe6ee';cx.beginPath();cx.ellipse(q.x,q.y-20,24,7,0,0,7);cx.fill();cx.fillStyle='#b8c2cc';cx.beginPath();cx.arc(q.x-18,q.y-22,5,0,7);cx.fill();cx.globalAlpha=1;return}
  if(V){p={x:V.x,y:V.y};if(e.oa||(e.vs&&e.vs.pose==='wc')){const s=V.sh||[p.x,p.y];shD(cx,s[0]-15,s[1]-6,30,13)}else if(!(e.vs&&e.vs.pose==='lie')){if(!(window.v23NoSh&&v23NoSh(e,V)))shD(cx,p.x-15,p.y-6,30,13)}else shD(cx,p.x-24,p.y-4,48,16);
   const bob=(lk.dis==='rubberknee'&&V.act==='walk')?Math.abs(Math.sin(now/120))*3:0;(typeof v21Draw==='function'?v21Draw(e,V,p.x,p.y-bob):aDraw(cx,V.ch,V.act,V.d,V.i,p.x,p.y-bob));if(V.act==='lie')top=26;if(V.act.startsWith('sit'))top=56}
  else{const[fr,fl]=entDir(e);const f=entFrame(e);cx.drawImage(personSpr(lk,fr,fl,f),p.x-24,p.y-72)}
  cx.globalAlpha=1;const py=p.y;
  const sel=ui.sel&&ui.sel.id===e.id;if(sel){cx.strokeStyle='#ffe14d';cx.lineWidth=2;cx.beginPath();cx.ellipse(p.x,p.y,14,6,0,0,7);cx.stroke()}
  if(!isStaff){const _dz=D.dis[e.dis];const mk=(e.inf?'🦠':'')+(e.emg?'🚑':'')+(e.vip?'🎩':'')+(e.known&&_dz&&_dz.icon?_dz.icon:'');if(mk&&e.state!=='dead'){emoT(14,mk,p.x-8,py-top-14)}if(e.angry&&e.state==='leave'){emoT(13,'💢',p.x-12+Math.sin(S.t*14)*2,py-top-24-Math.abs(Math.sin(S.t*9))*3)}if(e.thought){cx.fillStyle='rgba(255,255,255,.9)';cx.beginPath();cx.arc(p.x+10,py-top-8,9,0,7);cx.fill();cx.font='12px sans-serif';cx.textAlign='center';cx.fillStyle='#000';cx.fillText(e.thought,p.x+10,py-top-4)}
   if(e.health<40&&e.state!=='dead'){cx.fillStyle='#300';cx.fillRect(p.x-10,py-top-12,20,3);cx.fillStyle='#e33';cx.fillRect(p.x-10,py-top-12,20*e.health/100,3)}}
  else if(e.state==='rest'){cx.font='11px sans-serif';cx.fillText('💤',p.x+10,py-top+2)}};
 const dd=e=>(e.oa||e.state==='wcL'||e.state==='wcF'||e.state==='wcD'||(e.vs&&e.vs.pose==='wc')?e.x+e.y+1.6:e.x+e.y+1.1)+(e.vs&&(e.vs.sp.seat==='sofa'||e.vs.sp.seat==='bench')?1:0)+(window.v23Dd?v23Dd(e):0);for(const p of S.pats)if(V21in(p.x,p.y))ds.push({d:dd(p),f:()=>person(p,false),bb:v22PB(p)});for(const s of S.staff)if(V21in(s.x,s.y))ds.push({d:dd(s),f:()=>person(s,true),bb:v22PB(s)});
 if(typeof v21Tick==='function'){v21Tick();v21Fx(ds,now)}v22Occ(ds);ds.sort((a,b)=>a.d-b.d);V22.dc+=ds.length;for(const o of ds)o.f();drawLots(cx);
 if(typeof v19World==='function')v19World(cx,now);
 // подписи, индикаторы
 cx.textAlign='center';for(const r of S.rooms){if(r.par)continue;const d=D.rooms[r.type],p=iso(r.x+r.w/2,r.y+.5);cx.font='bold 10px sans-serif';const tw=cx.measureText(d.name).width+10;cx.fillStyle='rgba(20,30,40,.75)';cx.fillRect(p.x-tw/2,p.y-74,tw,15);cx.fillStyle='#fff';cx.fillText(d.name,p.x,p.y-63);
  if(d.machine){cx.fillStyle='#300';cx.fillRect(p.x-20,p.y-56,40,4);cx.fillStyle=r.cond>50?'#3c3':r.cond>25?'#fc3':'#f33';cx.fillRect(p.x-20,p.y-56,40*r.cond/100,4)}
  if(d.staff&&!r.staff){const q=iso(r.x+r.w/2,r.y+r.h/2);cx.font='18px sans-serif';cx.fillText('⚠️',q.x,q.y)}
  if(ui.sel&&ui.sel.k==='room'&&ui.sel.id===r.id)diamond(r.x,r.y,r.w,r.h,'#ffe14d',null)}
 const e=iso(S.ent.x+.5,S.h+.6);cx.font='bold 11px sans-serif';cx.fillStyle='#fff';cx.fillText('ВХОД',e.x,e.y+6);
 if(ui.ghost){const g=ui.ghost,bad=validRoom(g);diamond(g.x,g.y,g.w,g.h,bad?'#f33':'#3f3',bad?'rgba(255,0,0,.25)':'rgba(0,255,0,.2)');const t=makeRoom(g.type,g.x,g.y,g.w,g.h,g.side);S.nid--;diamond(t.door.x,t.door.y,1,1,'#ffb347','rgba(255,180,70,.6)');const c=iso(g.x+g.w/2,g.y+g.h/2);cx.fillStyle='#fff';cx.font='bold 12px sans-serif';cx.fillText(bad||D.rooms[g.type].name,c.x,c.y)}
 // виньетка / тёплый свет
 cx.setTransform(1,0,0,1,0,0);if(typeof v19Post==='function'&&v19Post(cx,W,H))return;const vg=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(255,240,210,0)');vg.addColorStop(1,'rgba(10,15,30,.35)');cx.fillStyle=vg;cx.fillRect(0,0,W,H)}
function diamond(x,y,w,h,stroke,fill){const a=iso(x,y),b=iso(x+w,y),c=iso(x+w,y+h),d=iso(x,y+h);cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.lineTo(c.x,c.y);cx.lineTo(d.x,d.y);cx.closePath();if(fill){cx.fillStyle=fill;cx.fill()}cx.strokeStyle=stroke;cx.lineWidth=2;cx.stroke()}

// ---------- камера и ввод в изо-координатах ----------
function toWorld(sx,sy){const wx=sx/cam.z+cam.x,wy=sy/cam.z+cam.y;const a=(wx-OX)/HW,b=(wy-OY)/HH;return{x:(a+b)/2,y:(b-a)/2}}
function centerCam(){OX=S.h*HW+MARGIN;const W=(S.w+S.h)*HW+MARGIN*2,H=(S.w+S.h)*HH+OY+MARGIN;cam.z=Math.max(.35,Math.min(innerWidth/W,innerHeight/H)*1.9);const c=iso(S.w/2,S.h/2);cam.x=c.x-innerWidth/2/cam.z;cam.y=c.y-innerHeight/2/cam.z}
function zoomAt(sx,sy,z){z=Math.max(.3,Math.min(3,z));const wx=sx/cam.z+cam.x,wy=sy/cam.z+cam.y;cam.z=z;cam.x=wx-sx/z;cam.y=wy-sy/z}
function tap(sx,sy){const w=toWorld(sx,sy),x=Math.floor(w.x),y=Math.floor(w.y);
 if(ui.ghost){ui.ghost.x=x-Math.floor(ui.ghost.w/2);ui.ghost.y=y-Math.floor(ui.ghost.h/2);return}
 if(ui.mode&&ui.mode.item){placeItem(ui.mode.item,x,y);return}
 {const lt=inLot(x,y);if(lt){askLot(lt);return}}
 const wx=sx/cam.z+cam.x,wy=sy/cam.z+cam.y;let best=null,bd=22;for(const [k,arr] of [['pat',S.pats],['staff',S.staff]])for(const e of arr){const p=iso(e.x+.5,e.y+.5);const d=Math.hypot(p.x-wx,p.y-30-wy);if(d<bd){bd=d;best={k,id:e.id}}}
 if(best){ui.sel=best;showSel();return}const r=roomAt(x,y);if(r){ui.sel={k:'room',id:r.id};showSel();return}ui.sel=null;hidePanel()}
