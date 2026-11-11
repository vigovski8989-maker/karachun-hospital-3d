'use strict';
// ===== Планировка мебели по шаблонам, места (сесть/лечь/унитаз), двери =====
function fpOf(k){const f=D.furn&&D.furn[k];return f&&f.fp?f.fp:[1,1]}
function tilesOf(x,y,fp){const a=[];for(let i=0;i<fp[0];i++)for(let j=0;j<fp[1];j++)a.push([x+i,y+j]);return a}
function doorInner(r){return{x:r.door.x+(r.side===1?-1:r.side===3?1:0),y:r.door.y+(r.side===2?1:r.side===0?-1:0)}}
// Подбор расположения: шаблон из rooms.json (T-стена), перебор смещения по ширине, проверка границ и достижимости.
function layout(r){const T=D.rooms[r.type].layout;if(!T)return{items:[],sp:{}};
 const I=inner(r),dI=doorInner(r);let maxc=0;for(const t of T.items)maxc=Math.max(maxc,t.c+fpDir(t.k,t.dir)[0]);for(const s of Object.values(T.spots))maxc=Math.max(maxc,s.c+1);
 const anchors=[];for(let a=0;a+maxc<=I.w;a++)anchors.push(a);const mid=(I.w-maxc)/2;anchors.sort((p,q)=>Math.abs(p-mid)-Math.abs(q-mid));
 for(const a of anchors){const items=[],sp={};let ok=true;const inI=(x,y)=>x>=I.x&&y>=I.y&&x<I.x+I.w&&y<I.y+I.h;
  for(const t of T.items){const fp=fpDir(t.k,t.dir),x=I.x+a+t.c,y=I.y+t.r;for(const[tx,ty]of tilesOf(x,y,fp))if(!inI(tx,ty))ok=false;items.push({k:t.k,x,y,fp,soft:!!t.soft,dir:t.dir})}
  if(!ok)continue;
  for(const[n,s]of Object.entries(T.spots)){const x=I.x+a+s.c,y=I.y+s.r;if(!inI(x,y)){ok=false;break}const o={x,y,pose:s.pose,dir:s.dir,seat:s.seat,onItem:!!s.onItem,face:s.face};if(s.at)o.at={x:I.x+a+s.at.c,y:I.y+s.at.r};sp[n]=o}
  if(!ok)continue;
  const bl=new Set();for(const it of items)if(!it.soft)for(const[tx,ty]of tilesOf(it.x,it.y,it.fp))bl.add(ty*1000+tx);
  if(bl.has(dI.y*1000+dI.x))continue;
  for(const s of Object.values(sp))if(bl.has(s.y*1000+s.x)&&!s.onItem)ok=false;
  if(!ok)continue;
  // BFS от двери внутри комнаты
  const seen=new Set([dI.y*1000+dI.x]),q=[[dI.x,dI.y]];for(let i=0;i<q.length;i++){const[cx0,cy0]=q[i];for(const[dx,dy]of DIRS){const nx=cx0+dx,ny=cy0+dy,k=ny*1000+nx;if(inI(nx,ny)&&!bl.has(k)&&!seen.has(k)){seen.add(k);q.push([nx,ny])}}}
  for(const s of Object.values(sp)){const k=s.y*1000+s.x;if(seen.has(k))continue;if(s.onItem&&DIRS.some(([dx,dy])=>seen.has((s.y+dy)*1000+s.x+dx)))continue;ok=false}
  if(!ok)continue;
  // направление «лицом к пациенту»
  const P=sp.patient||sp.rest1;for(const s of Object.values(sp))if(s.face==='patient'&&P){const dx=P.x-s.x,dy=P.y-s.y;s.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?0:2):(dy>0?1:3)}
  return{items,sp}}
 return null}
function roomLay(r){if(!r.sp){const l=layout(r)||{items:[],sp:{}};r.it=l.items;r.sp=l.sp}return r}
function spotPatient(r){roomLay(r);const s=r.sp.patient||r.sp.rest1||r.sp.wash;if(s)return s;const i=inner(r);return{x:i.x+Math.floor(i.w/2),y:i.y+Math.floor(i.h/2)}}
function spotStaff(r){roomLay(r);const s=r.sp.staff;if(s)return s;const i=inner(r);return{x:i.x+i.w-1,y:i.y+Math.floor(i.h/2)}}
function restSpot(sr,me){roomLay(sr);for(const k of['rest1','rest2']){const s=sr.sp[k];if(s&&!S.staff.some(o=>o!==me&&o.restKey===sr.id+k)){me.restKey=sr.id+k;return s}}me.restKey=null;return sr.sp.rest1||spotPatient(sr)}
// ---------- места ----------
const SEAT_T={sit:.7,wc:.8,lie:1.8};
function takeSeat(e,sp){if(!sp||sp.pose==='stand'||!sp.pose)return;e.x=sp.x;e.y=sp.y;e.path=[];e.dir=sp.dir!=null?sp.dir:1;e.vs={pose:sp.pose,ph:'down',t:0,sp}}
function leaveSeat(e){if(e.vs&&e.vs.ph==='sat'){e.vs.ph='up';e.vs.t=0}}
function clearSeat(e){if(e.vs&&e.vs.sp&&e.vs.sp.bench)releaseBench(e);e.vs=null;e.wash=false}
function releaseBench(e){for(const b of S.items)if(b.occ)for(let k=0;k<b.occ.length;k++)if(b.occ[k]===e.id)b.occ[k]=0}
function tickVs(e,dt){const v=e.vs;if(!v)return;v.t+=dt;const T=SEAT_T[v.pose]||.9;
 if(v.ph==='down'&&v.t>=T){v.ph='sat';v.t=0}else if(v.ph==='up'&&v.t>=T){if(v.sp&&v.sp.bench)releaseBench(e);const sp=v.sp;e.vs=null;if(sp&&sp.pose==='lie'){e.x=sp.x;e.y=sp.y}}}
// ---------- двери ----------
function tickDoors(dt){const all=S.pats.concat(S.staff);for(const r of S.rooms){let t=0;const dx=r.door.x,dy=r.door.y;for(const e of all){if(Math.abs(e.x-dx)+Math.abs(e.y-dy)<1.7&&!(e.vs)){t=1;break}}
  r.dop=r.dop||0;r.dop+=Math.sign(t-r.dop)*Math.min(Math.abs(t-r.dop),dt*3.2)}}
