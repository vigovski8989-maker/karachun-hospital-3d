/* v26: реактивные анимации, правильные якоря поз и аппаратов */
const V26={dx0:-36,dy0:14,din:.9,bx:58,by:-28,hx:-11,hy:-33,hrx:12,hry:15,hrot:0,ha:.45};
/* --- сканер: тело на столе, въезжает в тоннель по оси аппарата --- */
function v26ScanS(p){if(V26.fs!=null)return V26.fs;const T=1.6,o=(SEAT_T.lie||.9);const a=Math.min(1,(p.vs.t||0)/T),b=Math.min(1,Math.max(0,(p.t-o)/T));return ease(a)*ease(b)}
{const _b=v21Body;v21Body=function(p){_b(p);if(!p.vs||p.vs.pose!=='lie'||p.state!=='treat')return;const r=v21RoomOf(p);if(!r||r.type!=='diag')return;
 const s=p.vs.ph==='sat'?v26ScanS(p):0,a=iso(0,0),b=iso(0,-V26.din*s);p.fx={dx:V26.dx0+b.x-a.x,dy:V26.dy0+b.y-a.y,sx:1,sy:1,s,v26d:1}}}
{const _d=v21Draw;v21Draw=function(e,V,x,y){const f=e.fx;if(!f||!f.v26d||!V||V.act!=='lie'){_d(e,V,x,y);return}
 const Bx=x+V26.dx0+V26.bx,By=y+V26.dy0+V26.by;cx.save();cx.beginPath();cx.moveTo(Bx-2000,By-1000);cx.lineTo(Bx+2000,By+1000);cx.lineTo(Bx+2000-1000,By+1000+2000);cx.lineTo(Bx-2000-1000,By-1000+2000);cx.closePath();cx.clip();
 v22Board(x+f.dx,y+f.dy,0);cx.translate(x+f.dx,y+f.dy);aDraw(cx,V.ch,V.act,V.d,V.i,0,0);cx.restore();
 {const r=v21RoomOf(e),t=r&&r.it.find(t=>t.k==='scanner');if(t){const c=itemC(t,0),hx=c.x+V26.hx,hy=c.y+V26.hy;cx.save();cx.beginPath();cx.ellipse(hx,hy,V26.hrx,V26.hry,V26.hrot,0,7);cx.clip();cx.beginPath();cx.moveTo(Bx-2000,By-1000);cx.lineTo(Bx+2000,By+1000);cx.lineTo(Bx+2000+1000,By+1000-2000);cx.lineTo(Bx-2000+1000,By-1000-2000);cx.closePath();cx.clip();cx.globalAlpha=V26.ha;v22Board(x+f.dx,y+f.dy,0);cx.translate(x+f.dx,y+f.dy);aDraw(cx,V.ch,V.act,V.d,V.i,0,0);cx.restore();
  if(V26.dbg){cx.strokeStyle='red';cx.beginPath();cx.ellipse(hx,hy,V26.hrx,V26.hry,V26.hrot,0,7);cx.stroke()}}}
 if(V26.dbg){cx.fillStyle='red';cx.fillRect(Bx-1.5,By-1.5,3,3)}}}
/* --- посадка на стул: тело точно на сиденье (смещение по направлению стула) --- */
V26.chT={doctor:{1:[12,4]}};V26.cho={0:[0,0],1:[8,-4],2:[0,0],3:[0,0]};
{const _s=seatXY;seatXY=function(e){const r=_s(e),v=e.vs,sp=v&&v.sp;if(sp&&sp.seat==='chair'&&v.pose==='sit'){const dd=sp.dir!=null?sp.dir:e.dir,o=(V26.chT[e.type]&&V26.chT[e.type][dd])||V26.cho[dd]||[0,0];r[0]+=o[0];r[1]+=o[1]}return r}}
// v26: реактивные сидячие сотрудники — idle / приветствие / работа / выдача талона / прощание
{const _ev=entVis;entVis=function(e,isStaff,now){const V=_ev(e,isStaff,now);
 if(!isStaff||!e.vs||e.vs.ph!=='sat'||e.state!=='work'||(e.type!=='doctor'&&e.type!=='receptionist'))return V;
 const ch=V.ch,d=V.d,has=a=>!!aGet(ch,a,d),r=S.rooms.find(r=>r.id===e.room);if(!r)return V;
 const p=r.busy!=null?S.pats.find(q=>q.id===r.busy):null,pp=(a,per)=>{V.act=a;V.i=Math.floor(now/per+(e.id||0))%4};
 if(p&&p.id!==e._v26p){e._v26p=p.id}
 if(!p&&e._v26p!=null){e._v26bye=now;e._v26p=null}
 let a;
 if(p){const sat=p.state==='treat'&&(!p.vs||p.vs.ph==='sat'),q=procQ(p);
  if(!sat)a=['greet',200];
  else if(e.type==='receptionist')a=q<.72?['type',170]:q<.8?['talk',220]:['give',0];
  else a=q<.28?['talk',230]:q<.55?['write',260]:q<.8?['talk',230]:['give',0];
  if(a[0]==='give'){const k=e.type==='receptionist'?(q-.8)/.2:(q-.8)/.2;if(has('give')){V.act='give';V.i=Math.min(3,Math.floor(Math.max(0,k)*4.99))}return V}}
 else if(e._v26bye&&now-e._v26bye<1100)a=['greet',200];
 else{const ph=(now/1000+(e.id||0)*3.1)%11;a=ph<2.2&&has('type')?['type',170]:['sit_idle',420]}
 if(has(a[0]))pp(a[0],a[1]);else if(has('sit_idle'))pp('sit_idle',420);
 return V}}
// v26: стол терапевта без встроенного стула (врач сидит на своём кресле за столом)
{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);V26.deskNC=c};im.src='assets/sprites/desk_nc.png';
 const _df=drawFurn;drawFurn=function(g,t){if(V26.deskNC&&(t.k||t.type)==='desk'){if(t._nc==null){const r=S.rooms.find(r=>r.it&&r.it.includes(t));t._nc=!!(r&&r.it.some(o=>o.k==='chair_office'))}
  if(t._nc){const o=SPR['a_f_desk'];SPR['a_f_desk']=V26.deskNC;try{return _df(g,t)}finally{if(o)SPR['a_f_desk']=o;else delete SPR['a_f_desk']}}}return _df(g,t)}}
// v26: старые сохранения — перестроить кабинет терапевта (врач за столом на кресле), когда он свободен
{const _t=v21Tick;v21Tick=function(){_t();if(!S)return;for(const r of S.rooms){if(r._v26ok||(r.type!=='gp'&&r.type!=='paygp'))continue;
 const want=D.rooms[r.type].layout.spots.staff.seat;if(!r.sp||!r.sp.staff||r.sp.staff.seat===want){r._v26ok=1;continue}if(r.busy!=null)continue;
 const l=layout(r);if(!l){r._v26ok=1;continue}r.it=l.items;r.sp=l.sp;r._v26ok=1;if(typeof wallSig!=='undefined')wallSig='';
 const s=S.staff.find(s=>s.room===r.id&&s.vs);if(s){const q=r.sp.staff;s.x=q.x;s.y=q.y;s.dir=q.dir;s.path=[];s.vs.sp=q}}}}
// v26: стоящий персонал поворачивается к пациенту, когда тот входит и во время процедуры
{const _ev=entVis;entVis=function(e,isStaff,now){const V=_ev(e,isStaff,now);
 if(!isStaff||e.vs||e.state!=='work'||(V.act!=='idle'&&V.act!=='treat'))return V;
 const r=S.rooms.find(r=>r.id===e.room),p=r&&r.busy!=null?S.pats.find(q=>q.id===r.busy):null;if(!p)return V;
 const dx=p.x-e.x,dy=p.y-e.y;if(Math.abs(dx)+Math.abs(dy)<.3)return V;const dd=Math.abs(dx)>=Math.abs(dy)?(dx>0?0:2):(dy>0?1:3);
 if(aGet(V.ch,V.act,dd)){V.d=dd;const n=(aGet(V.ch,V.act,dd)||[0]).length;V.i=V.i%n}return V}}
// v26: шланг от аппарата к голове пациента (Сдувательная / Надувательная)
V26.hose={pump:{nx:-6,ny:-36,hx:2,hy:-64},inflate:{nx:-10,ny:-30,hx:0,hy:-62}};
{const _d=v21Draw;v21Draw=function(e,V,x,y){_d(e,V,x,y);if(!e||e.state!=='treat'||!e.dis)return;const r=v21RoomOf(e);if(!r||!V26.hose[r.type])return;
 const H=V26.hose[r.type],m=r.it.find(t=>t.k===(r.type==='pump'?'pumpmachine':'inflator'));if(!m)return;const q=procQ(e);if(q<0)return;
 const k=Math.min(1,q/.12)*Math.min(1,(1-q)/.08);if(k<=0)return;const c=itemC(m,0),ax=c.x+H.nx,ay=c.y+H.ny,f=e.fx||{},hx=x+(f.dx||0)+H.hx,hy=y+(f.dy||0)+H.hy*(f.sy||1);
 const bx=ax+(hx-ax)*k,by=ay+(hy-ay)*k,mx=(ax+bx)/2,my=Math.max(ay,by)+18*k;
 cx.save();cx.lineCap='round';cx.strokeStyle='#2b3440';cx.lineWidth=3.2;cx.beginPath();cx.moveTo(ax,ay);cx.quadraticCurveTo(mx,my,bx,by);cx.stroke();
 cx.strokeStyle='#8fa3b8';cx.lineWidth=1.4;cx.stroke();cx.fillStyle='#c9d6e3';cx.beginPath();cx.ellipse(bx,by,3.2,2.2,0,0,7);cx.fill();cx.strokeStyle='#2b3440';cx.lineWidth=.8;cx.stroke();
 if(V26.dbg)window._mk=[{x:ax,y:ay,c:'red'},{x:hx,y:hy,c:'blue'}];cx.restore()}}
