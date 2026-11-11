// v25: настоящие параллельные места в кабинетах M/L. Кабинет = основной + (N-1) «слотов» (r.par) с тем же контуром/дверью,
// своим набором мебели, своим сотрудником, пациентом и очередью. Движок очередей/найма работает по каждому слоту.
const V25NO=new Set(['staffroom','library','chief']);
function v25Slot(type){return!V25NO.has(type)&&!!(D.rooms[type]&&D.rooms[type].layout)}
function v25Dim(T){let mc=0,mr=0;for(const t of T.items){const f=fpDir(t.k,t.dir);mc=Math.max(mc,t.c+f[0]);mr=Math.max(mr,t.r+f[1])}for(const s of Object.values(T.spots)){mc=Math.max(mc,s.c+1);mr=Math.max(mr,s.r+1)}return[mc,mr]}
// N копий шаблона: по горизонтали или вертикали, зазор 0/1, общий BFS от двери
function layoutN(r,n){const T=D.rooms[r.type].layout;if(!T)return null;const I=inner(r),dI=doorInner(r),[mc,mr]=v25Dim(T);
 const inI=(x,y)=>x>=I.x&&y>=I.y&&x<I.x+I.w&&y<I.y+I.h;const tries=[];
 for(const g of[1,0])for(const ax of[0,1]){const W=ax?mc:n*mc+(n-1)*g,H=ax?n*mr+(n-1)*g:mr;if(W>I.w||H>I.h)continue;
  const as=[];for(let a=0;a+W<=I.w;a++)as.push(a);const mid=(I.w-W)/2;as.sort((p,q)=>Math.abs(p-mid)-Math.abs(q-mid));
  const bs=[0];if(ax)for(let b=1;b+H<=I.h;b++)bs.push(b);for(const b of bs)for(const a of as)tries.push([a,b,g,ax])}
 for(const[a,b,g,ax]of tries){const cps=[];let ok=true;const bl=new Set();
  for(let k=0;k<n&&ok;k++){const ox=I.x+a+(ax?0:k*(mc+g)),oy=I.y+b+(ax?k*(mr+g):0),items=[],sp={};
   for(const t of T.items){const fp=fpDir(t.k,t.dir),x=ox+t.c,y=oy+t.r;for(const[tx,ty]of tilesOf(x,y,fp))if(!inI(tx,ty))ok=false;items.push({k:t.k,x,y,fp,soft:!!t.soft,dir:t.dir})}
   for(const[nm,s]of Object.entries(T.spots)){const x=ox+s.c,y=oy+s.r;if(!inI(x,y))ok=false;const o={x,y,pose:s.pose,dir:s.dir,seat:s.seat,onItem:!!s.onItem,face:s.face};if(s.at)o.at={x:ox+s.at.c,y:oy+s.at.r};sp[nm]=o}
   for(const it of items)if(!it.soft)for(const[tx,ty]of tilesOf(it.x,it.y,it.fp))bl.add(ty*1000+tx);cps.push({items,sp})}
  if(!ok||bl.has(dI.y*1000+dI.x))continue;
  for(const c of cps)for(const s of Object.values(c.sp))if(bl.has(s.y*1000+s.x)&&!s.onItem)ok=false;if(!ok)continue;
  const seen=new Set([dI.y*1000+dI.x]),q=[[dI.x,dI.y]];for(let i=0;i<q.length;i++){const[x0,y0]=q[i];for(const[dx,dy]of DIRS){const nx=x0+dx,ny=y0+dy,k=ny*1000+nx;if(inI(nx,ny)&&!bl.has(k)&&!seen.has(k)){seen.add(k);q.push([nx,ny])}}}
  for(const c of cps)for(const s of Object.values(c.sp)){const k=s.y*1000+s.x;if(seen.has(k))continue;if(s.onItem&&DIRS.some(([dx,dy])=>seen.has((s.y+dy)*1000+s.x+dx)))continue;ok=false}
  if(!ok)continue;
  for(const c of cps){const P=c.sp.patient||c.sp.rest1;for(const s of Object.values(c.sp))if(s.face==='patient'&&P){const dx=P.x-s.x,dy=P.y-s.y;s.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?0:2):(dy>0?1:3)}}
  return cps}
 return null}
const V25C={};
function v25N(type,w,h,side){if(!v25Slot(type))return 1;{const m=D.rooms[type].min;if(w<=m[0]+2&&h<=m[1]+2)return 1}const key=type+w+'x'+h+'s'+(side||0);if(V25C[key])return V25C[key];
 const f={type,x:0,y:0,w,h,side:side||0,door:{x:0,y:0}};if(typeof placeDoor==='function')placeDoor(f);let n=1;for(const k of[3,2])if(layoutN(f,k)){n=k;break}return V25C[key]=n}
(function(){
 const _lay=layout;layout=function(r){if(r&&r.nS>1){const c=layoutN(r,r.nS);if(c)return c[r.slot||0]}return _lay(r)};
 // вместимость: слотовые типы — 1 на слот (параллельность даёт число слотов), прочие — как в v24 (комфорт)
 const _cap=v24Cap;v24Cap=function(type,w,h){return v25Slot(type)?v25N(type,w,h,ui.ghost&&ui.ghost.type===type?ui.ghost.side:0):_cap(type,w,h)};
 rCap=function(r){if(!r)return 1;return v25Slot(r.type)?1:(r.cap||_cap(r.type,r.w,r.h))};
 v24Lbl=function(){const g=ui.ghost;if(!g)return;const sl=v25Slot(g.type),c=sl?v25N(g.type,g.w,g.h,g.side):_cap(g.type,g.w,g.h),e=document.getElementById('v24ok');if(e)e.textContent='✔ $'+v25Cost(g.type,g.w,g.h,g.side);const i=document.getElementById('v24inf');if(i)i.textContent=(g.w-2)+'×'+(g.h-2)+' '+V24SZ[c-1]+(c>1?(sl?' 👥×'+c:' ⚡×'+v24Spd(c).toFixed(1)):'')};
 // пресеты: M — наименьшая площадь с 2 местами, L — с 3
 v24Pre=function(n){const g=ui.ghost;if(!g)return;const m=D.rooms[g.type].min,w0=m[0]+2,h0=m[1]+2;
  if(n===0||!v25Slot(g.type)){const a=[0,1,2][n];g.w=Math.min(12,w0+a);g.h=Math.min(12,h0+a);if(!v25Slot(g.type)&&n){let s=0;while(_cap(g.type,g.w,g.h)<n+1&&s++<6){if(g.w<=g.h)g.w=Math.min(12,g.w+1);else g.h=Math.min(12,g.h+1)}}}
  else{let best=null;for(let w=w0;w<=12;w++)for(let h=h0;h<=12;h++)if(v25N(g.type,w,h,g.side)>=n+1&&(!best||w*h<best[0]||(w*h===best[0]&&Math.abs(w-h)<Math.abs(best[1]-best[2]))))best=[w*h,w,h];
   if(best){g.w=best[1];g.h=best[2]}else{g.w=Math.min(12,w0+2);g.h=Math.min(12,h0+2);msg('Больше мест здесь не помещается')}}
  Snd.click();v24Lbl()};
 gok=function(){const g=ui.ghost,bad=roomLocked(g.type)?'не исследовано':validRoom(g);if(bad){msg('Нельзя: '+bad);Snd.bad();return}const d=D.rooms[g.type],cost=v25Cost(g.type,g.w,g.h,g.side);if(S.money<cost){msg('Недостаточно денег');return}
  S.money-=cost;const nr=makeRoom(g.type,g.x,g.y,g.w,g.h,g.side);nr.cost=cost;const n=v25N(g.type,g.w,g.h,g.side);if(!v25Slot(g.type))nr.cap=_cap(g.type,g.w,g.h);S.rooms.push(nr);if(n>1)v25Split(nr,n);
  Snd.build();msg('Построено: '+d.name+(n>1?' на '+n+' места':'')+(d.staff?' — наймите: '+D.staff[d.staff].name+(n>1?' ×'+n:''):''));gcancel();
  for(const p of S.pats)if(p.state==='queue'||p.state==='seek')p.path=[]};
 // без ускорения: большая комната = больше мест, а не быстрее
 r_dur=(function(_rd){return function(p){const r=S.rooms.find(x=>x.id===p.room);return v25Slot(r?r.type:p.need)?_rd(p)*1:_rd(p)}})(r_dur);
 // продажа основного — вместе со слотами
 const _sell=sellRoom;sellRoom=function(id){const r=S.rooms.find(x=>x.id===id);if(!r)return;const m=r.par?S.rooms.find(x=>x.id===r.par):r;if(!m)return _sell(id);
  for(const s of S.rooms.filter(x=>x.par===m.id)){const mo=S.money;_sell(s.id);S.money=mo}_sell(m.id)};
 // загрузка: старые сохранения — достроить слоты, если кабинет позволяет
 const _ld=load;load=function(){const res=_ld.apply(this,arguments);try{if(S&&S.rooms)for(const r of S.rooms.slice())if(!r.par&&r.nS==null&&v25Slot(r.type)){const n=v25N(r.type,r.w,r.h,r.side);r.nS=1;if(n>1)v25Split(r,n)}}catch(e){console.warn(e)}return res};
})();
function v25Split(m,n){m.nS=n;m.slot=0;const l=layout(m);if(!l){m.nS=1;return}m.it=l.items;m.sp=l.sp;const at=S.rooms.indexOf(m);
 for(let k=n-1;k>=1;k--){const s={id:S.nid++,type:m.type,x:m.x,y:m.y,w:m.w,h:m.h,side:m.side,door:{x:m.door.x,y:m.door.y},staff:null,queue:[],busy:null,cond:100,uses:0,par:m.id,slot:k,nS:n,cost:0};
  const c=layout(s);s.it=c.items;s.sp=c.sp;S.rooms.splice(at+1,0,s)}
 if(typeof wallSig!=='undefined')wallSig='';if(typeof BLK!=='undefined')BLK=null}
function v25Cost(type,w,h,side){const b=v24Cost(type,w,h),n=v25N(type,w,h,side);return Math.max(b,Math.round(D.rooms[type].cost*(1+.6*(n-1))/50)*50)}
function v25Group(r){const m=r.par?S.rooms.find(x=>x.id===r.par):r;return m?[m,...S.rooms.filter(x=>x.par===m.id)]:[r]}
// мебель: ближайшая копия предмета к точке (слоты делят один контур)
roomItem=function(sp,k){let b=null,bd=1e9;for(const r of S.rooms){if(!(sp.x>=r.x&&sp.y>=r.y&&sp.x<r.x+r.w&&sp.y<r.y+r.h))continue;for(const t of r.it||[])if(t.k===k){const d=Math.abs(t.x-sp.x)+Math.abs(t.y-sp.y);if(d<bd){bd=d;b=t}}}return b};
// панель: строка по местам
function v25Info(r){const g=v25Group(r);if(g.length<2)return'';return g.map((s,i)=>{const st=S.staff.find(x=>x.id===s.staff);return'<div class="row">Место '+(i+1)+'<b>'+(st?'👤 '+st.name.split(' ')[0]:'⚠️ нет персонала')+' · '+(s.busy!=null?'🩺':'—')+' · 👥'+s.queue.length+'</b></div>'}).join('')}
