'use strict';
// B: 2.5D пре-рендер спрайты (24 fps, 8 направлений) + карта нормалей + глубина фона
const Q=new URLSearchParams(location.search),CAP=Q.has('cap');
const BW=1400,BH=820,PXM=960/6.76,AX=128,AY=270,DIST=12;
const T=[1.7,1.0,0.6];let VD=[9,-9,7.348];{const l=Math.hypot(...VD);VD=VD.map(v=>v/l);}
const R=[Math.SQRT1_2,Math.SQRT1_2,0];const U=[VD[1]*R[2]-VD[2]*R[1],VD[2]*R[0]-VD[0]*R[2],VD[0]*R[1]-VD[1]*R[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function proj(x,y,z){const d=[x-T[0],y-T[1],z-T[2]];return [BW/2+dot(d,R)*PXM,BH/2-dot(d,U)*PXM,DIST-dot(d,VD)];}
const cv=document.getElementById('c'),gl=cv.getContext('webgl2',{premultipliedAlpha:false,antialias:false});
function sh(vs,fs){const p=gl.createProgram();for(const[t,s]of[[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const o=gl.createShader(t);gl.shaderSource(o,'#version 300 es\nprecision highp float;\n'+s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(o);gl.attachShader(p,o);}gl.linkProgram(p);return p;}
const VS=`in vec2 p;uniform vec4 dst;uniform vec4 src;uniform vec2 vp;out vec2 uv;out vec2 bp;
void main(){vec2 q=dst.xy+p*dst.zw;bp=q/vec2(1400.,820.);uv=src.xy+p*src.zw;vec2 s=(q-vp*.5)/(vp*.5);gl_Position=vec4(s.x,-s.y,0,1);}`;
// фон: цвет * (1 + динамика солнца от нормали)
const PBG=sh(VS.replace('uniform vec2 vp;','uniform vec2 vp;').replace('vec2 s=(q-vp*.5)/(vp*.5)','vec2 s=p*2.-1.'),`in vec2 uv;in vec2 bp;uniform sampler2D C;uniform float k;out vec4 o;void main(){vec4 c=texture(C,uv);o=vec4(c.rgb*k,1);}`);
const PSP=sh(VS,`in vec2 uv;in vec2 bp;uniform sampler2D C,N,BD;uniform float az,a,k,nd;uniform vec3 L,LC,amb;out vec4 o;
void main(){vec4 c=texture(C,uv);if(c.a<.02)discard;vec4 n=texture(N,uv);
float z=az+(n.a-.5)*4.;float zb=texture(BD,bp).r*16.+4.;if(z>zb+.12&&nd<.5)discard;
vec3 nn=normalize(n.rgb*2.-1.);float d=max(dot(nn,L),0.);float rim=pow(1.-max(nn.z*.5+.5,0.),3.)*.15;
o=vec4(c.rgb*(amb+LC*d)*k+rim*LC,c.a*a);}`);
const PSH=sh(VS,`in vec2 uv;in vec2 bp;uniform float a;uniform vec2 vp;uniform vec4 dst;uniform vec4 src;uniform sampler2D C;out vec4 o;void main(){vec2 q=uv*2.-1.;float r=dot(q,q);o=vec4(0,0,0,a*.38*smoothstep(1.,.2,r));}`);
const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,0,1,1,1]),gl.STATIC_DRAW);
for(const p of[PBG,PSP,PSH]){const l=gl.getAttribLocation(p,'p');gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,2,gl.FLOAT,false,0,0);}
function img(u){return new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=u;});}
function tex(i,lin){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,i);const f=lin?gl.LINEAR:gl.NEAREST;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;}
const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
// персонаж: анимации 24fps, кроссфейд, плавный разгон/торможение, поворот через промежуточные направления
class Ch{constructor(name,atl,x,y,dir,anim){Object.assign(this,{name,atl,x,y,dir,cur:{a:anim,t:0},prev:null,fade:0,path:[],v:0,vmax:1.15,onArr:null,face:dir*45});}
 play(a,f=.25){if(this.cur.a===a)return;this.prev=this.cur;this.cur={a,t:0};this.fade=f;this.ft=0;}
 walk(pts,cb){this.path=pts.slice();this.onArr=cb;this.play('walk',.2);}
 key(a){return this.atl.j[a+'_'+this.dir]?a+'_'+this.dir:Object.keys(this.atl.j).find(k=>k.startsWith(a+'_'));}
 frames(a){return this.atl.j[this.key(a)];}
 update(dt){
  if(this.path.length){const[tx,ty]=this.path[0];const dx=tx-this.x,dy=ty-this.y,d=Math.hypot(dx,dy);
   const last=this.path.length==1;const want=last?Math.min(this.vmax,d*1.6+.15):this.vmax;this.v+=(want-this.v)*Math.min(1,dt*4);
   const want_face=Math.atan2(-dx,dy)*180/Math.PI;let df=((want_face-this.face+540)%360)-180;this.face+=df*Math.min(1,dt*7);
   this.dir=((Math.round(this.face/45)%8)+8)%8;
   const s=Math.min(d,this.v*dt);if(d>1e-4){this.x+=dx/d*s;this.y+=dy/d*s;}
   if(d<.02){this.path.shift();if(!this.path.length){this.v=0;const cb=this.onArr;this.onArr=null;cb&&cb();}}
   this.cur.t+=dt*Math.max(.35,this.v/this.vmax);}
  else this.cur.t+=dt;
  if(this.prev){this.prev.t+=dt;this.ft+=dt;if(this.ft>=this.fade)this.prev=null;}
 }
 setDir(d){this.dir=d;this.face=d*45;}
 fr(st,once){const F=this.frames(st.a);let i=Math.floor(st.t*24);i=once?Math.min(i,F.length-1):i%F.length;return F[i];}
}
const ONCE=new Set(['sit_down','stand_up','greet']);
let bgC,bgD,chars=[],t=0,ev=[],light={L:[0,0,1]};
function drawQuad(p,dst,src){gl.uniform4fv(gl.getUniformLocation(p,'dst'),dst);gl.uniform4fv(gl.getUniformLocation(p,'src'),src);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}
let vw,vh,sc,ox,oy;
function resize(){const d=Math.min(devicePixelRatio,Q.has('low')?1:2);cv.width=cv.clientWidth*d;cv.height=cv.clientHeight*d;vw=cv.width;vh=cv.height;
 const z=+(Q.get('zoom')||1);sc=Math.max(vw/BW,vh/BH*0)*z;sc=Math.max(sc,Math.min(vw/BW,vh/BH));if(vh>vw)sc=vh/BH*.62*z;ox=vw/2-(+(Q.get('cx')||BW*.55))*sc;oy=vh/2-BH/2*sc;}
function render(){
 gl.viewport(0,0,vw,vh);gl.clearColor(.11,.12,.14,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 // фон
 gl.useProgram(PBG);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,bgC);gl.uniform1i(gl.getUniformLocation(PBG,'C'),0);gl.uniform1f(gl.getUniformLocation(PBG,'k'),1);
 const S=(x,y,w,h)=>[ox+x*sc,oy+y*sc,w*sc,h*sc];
 // для фона используем dst в пикселях канваса: переводим в clip через p
 gl.viewport(ox,vh-oy-BH*sc,BW*sc,BH*sc);drawQuad(PBG,[0,0,1,1],[0,0,1,1]);gl.viewport(0,0,vw,vh);
 const order=chars.map(c=>({c,p:proj(c.x,c.y,c.z||0)})).sort((a,b)=>b.p[2]-a.p[2]);
 // тени
 gl.useProgram(PSH);gl.uniform2f(gl.getUniformLocation(PSH,'vp'),vw,vh);gl.uniform1f(gl.getUniformLocation(PSH,'a'),1);
 for(const{c,p}of order){const w=.75*PXM,h=w*.5;drawQuad(PSH,S(p[0]-w/2,p[1]-h/2,w,h),[0,0,1,1]);}
 gl.useProgram(PSP);gl.uniform2f(gl.getUniformLocation(PSP,'vp'),vw,vh);
 const u=n=>gl.getUniformLocation(PSP,n);gl.uniform1i(u('C'),0);gl.uniform1i(u('N'),1);gl.uniform1i(u('BD'),2);
 gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,bgD);
 // динамический свет: тёплое «окно» + лёгкое движение облаков
 const cl=.92+.08*Math.sin(t*.7)*Math.sin(t*.23);const L=[-.55,.45,.7];const ll=Math.hypot(...L);
 gl.uniform3f(u('L'),L[0]/ll,L[1]/ll,L[2]/ll);gl.uniform3f(u('LC'),.42*cl,.38*cl,.32*cl);gl.uniform3f(u('amb'),.78,.8,.84);gl.uniform1f(u('k'),.86);
 for(const{c,p}of order){const A=c.atl;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,A.c);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,A.n);
  gl.uniform1f(u('az'),p[2]-(c.zb||0));gl.uniform1f(u('nd'),Q.has('nodepth')?1:0);
  const layers=[];if(c.prev){const f=ease(c.ft/c.fade);layers.push([c.prev,1]);layers.push([c.cur,f]);}else layers.push([c.cur,1]);
  for(const[st,a]of layers){const q=c.fr(st,ONCE.has(st.a));if(!q)continue;const[x,y,w,h,bx,by]=q;gl.uniform1f(u('a'),a);
   drawQuad(PSP,S(p[0]-AX+bx,p[1]-AY+by,w,h),[x/A.w,y/A.h,w/A.w,h/A.h]);}}
}
// сценарий (координаты Blender, метры)
function at(s,f){ev.push([s,f]);}
function scenario(){
 const D=chars[0],P=chars[1],B=chars[2];
 at(.5,()=>P.walk([[4.0,-.3],[3.6,1.0],[2.25,1.55],[2.2,1.72]],()=>{P.setDir(0);P.play('sit_down');setTimeout2(.75,()=>P.play('sit_idle',.3));}));
 at(3.2,()=>D.play('sit_idle',.4));at(4.6,()=>D.play('greet',.3));at(5.8,()=>D.play('talk',.35));at(6.3,()=>P.play('listen',.4));
 at(11,()=>D.play('stand_up',.2));at(11.75,()=>D.walk([[2.9,3.5],[2.9,2.6],[1.55,2.3],[1.55,2.05]],()=>{D.setDir(6);D.play('examine',.3);}));
 at(19.5,()=>D.walk([[2.9,2.6],[2.9,3.5],[2.2,3.5]],()=>{D.setDir(4);D.play('sit_down');setTimeout2(.75,()=>D.play('write',.3));}));
 at(26,()=>{P.play('stand_up',.2);});at(26.8,()=>P.walk([[2.3,1.3],[3.8,.9],[4.0,-.4],[4.4,-1.8]],()=>P.play('idle',.3)));
}
let timers=[];function setTimeout2(s,f){timers.push([t+s,f]);}
async function loadAtlas(n){const[c,nm,j]=await Promise.all([img('atlas/'+n+'_c.webp'),img('atlas/'+n+'_n.webp'),fetch('atlas/'+n+'.json').then(r=>r.json())]);return{c:tex(c,true),n:tex(nm,true),j,w:c.width,h:c.height};}
function step(dt){t+=dt;while(ev.length&&ev[0][0]<=t)ev.shift()[1]();timers=timers.filter(([s,f])=>s<=t?(f(),false):true);for(const c of chars)c.update(dt);}
window.__step=(dt,n)=>{for(let i=0;i<n;i++)step(dt);render();};
const st={n:0,cpu:[],frames:[]};window.__stats=st;
(async()=>{const[bc,bd]=await Promise.all([img('atlas/bg_c.webp'),img('atlas/bg_d.png')]);bgC=tex(bc,true);bgD=tex(bd,false);
 const[ad,aa,ab]=await Promise.all(['doctor','patient_a','patient_b'].map(loadAtlas));
 chars=[new Ch('doc',ad,2.2,3.5,4,'write'),new Ch('pa',aa,4.4,-1.8,0,'idle'),Object.assign(new Ch('pb',ab,-.42,-1.2,6,'wait'),{zb:.4})];
 scenario();ev.sort((a,b)=>a[0]-b[0]);resize();addEventListener('resize',resize);window.__ready=true;
 if(CAP){render();return;}let last=performance.now();
 const loop=now=>{st.frames.push(now-last);const dt=Math.min(.05,(now-last)/1000);last=now;const c0=performance.now();step(dt);if(t>36){t=0;}render();st.cpu.push(performance.now()-c0);st.n++;
  document.getElementById('i').textContent='B 2.5D t='+t.toFixed(1);requestAnimationFrame(loop);};requestAnimationFrame(loop);})();
