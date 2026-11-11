/* v27: якоря у стоек/столов, кабина генетики, реакция стоящего персонала, миграция старых сейвов */
const V27={off:{lab:{staff:[.5,-.38],patient:[.5,0]},pharmacy:{staff:[.4,-.2],patient:[.9,0]},xray:{patient:[-.8,.05]}},gA:.95,ga:.5,dbg:0};
function v27Px(o){const a=iso(0,0),b=iso(o[0],o[1]);return[b.x-a.x,b.y-a.y]}
// смещение тела к центру стойки (стол 2 клетки — человек по центру, а не у края)
{const _ev=entVis;entVis=function(e,isStaff,now){const V=_ev(e,isStaff,now);if(e.vs||(isStaff?e.state!=='work':(e.state!=='treat'&&e.state!=='enter')))return V;
 const r=S.rooms.find(r=>r.id===(isStaff?e.room:e.room));if(!r||!r.sp)return V;const O=V27.off[r.type];if(!O)return V;
 const role=isStaff?'staff':'patient',o=O[role],s=r.sp[role];if(!o||!s)return V;
 if(isStaff?e.state!=='work':(e.state!=='treat'&&e.state!=='enter'))return V;
 const dist=Math.abs(e.x-s.x)+Math.abs(e.y-s.y);if(dist>1.2)return V;const k=Math.max(0,1-dist);const[px,py]=v27Px(o);V.x+=px*k;V.y+=py*k;return V}}
// стоящий персонал: пока пациент идёт — внимание (стоит лицом к нему), процедура — 'treat' с паузами, после — короткий кивок
{const _ev=entVis;entVis=function(e,isStaff,now){const V=_ev(e,isStaff,now);
 if(!isStaff||e.vs||e.state!=='work'||(e.path&&e.path.length)||(V.act!=='idle'&&V.act!=='treat'))return V;
 const r=S.rooms.find(r=>r.id===e.room);if(!r)return V;const p=r.busy!=null?S.pats.find(q=>q.id===r.busy):null;
 const idle=()=>{V.act='idle';const n=(aGet(V.ch,'idle',V.d)||[0]).length;V.i=Math.floor(now/520+(e.id||0)*.37)%n};
 if(p){if(p.state!=='treat'){idle();return V}const q=procQ(p);
  if(q<.06||q>.94||(q>.46&&q<.54))idle();else if(aGet(V.ch,'treat',V.d)){V.act='treat';V.i=Math.floor(now/260)%4}}
 return V}}
// генетика: пациент заходит внутрь кабины и виден сквозь матовое стекло; пробирка/пузырёк при выдаче
{const _b=v21Body;v21Body=function(p){_b(p);if(p.state!=='treat'||p.vs)return;const r=v21RoomOf(p);if(!r||r.type!=='genetics'||!p.fx)return;
 const q=procQ(p),k=ease(q/.12)*(1-ease((q-.88)/.12)),a=iso(0,0),b=iso(0,-V27.gA*k);p.fx.dx=b.x-a.x;p.fx.dy=b.y-a.y;p.fx.v27g=k}}
{const _d=v21Draw;v21Draw=function(e,V,x,y){_d(e,V,x,y);if(!e||e.state!=='treat')return;const f=e.fx;const r=v21RoomOf(e);if(!r)return;
 if(f&&f.v27g>.05&&r.type==='genetics'){const t=r.it.find(t=>t.k==='dnaseq');if(t){cx.save();cx.globalAlpha=V27.ga*Math.min(1,f.v27g*1.4);drawFurn(cx,t);cx.restore()}}
 if(r.type==='pharmacy'||r.type==='lab'){const q=procQ(e);if(q>.82&&q<.99){const s=S.staff.find(s=>s.id===r.staff);if(!s)return;const k=ease((q-.82)/.12);
  const A=iso(s.x+.5+.5,s.y+.5),B=iso(e.x+.5+.5,e.y+.5),X=A.x+(B.x-A.x)*k*.55,Y=A.y-34+(B.y-A.y)*k*.55;cx.save();
  if(r.type==='pharmacy'){cx.fillStyle='#fff';cx.fillRect(X-4,Y-6,8,8);cx.fillStyle='#e33';cx.fillRect(X-4,Y-3,8,2);cx.strokeStyle='#555';cx.lineWidth=.6;cx.strokeRect(X-4,Y-6,8,8)}
  else{cx.fillStyle='#d8eef7';cx.fillRect(X-1.6,Y-8,3.2,9);cx.fillStyle='#c22';cx.fillRect(X-1.6,Y-3,3.2,4);cx.fillStyle='#456';cx.fillRect(X-2,Y-9,4,2)}cx.restore()}}}}
// старые сейвы: переставить точки персонала (генетика/электро/перезагрузка), когда кабинет свободен
{const T27=['genetics','electro','reboot','xray'];const _t=v21Tick;v21Tick=function(){_t();if(!S)return;for(const r of S.rooms){if(r._v27ok||!T27.includes(r.type))continue;
 if(!r.sp||!r.sp.staff){r._v27ok=1;continue}if(r.busy!=null)continue;const l=layout(r);r._v27ok=1;if(!l||!l.sp.staff)continue;
 if(l.sp.staff.x===r.sp.staff.x&&l.sp.staff.y===r.sp.staff.y)continue;r.it=l.items;r.sp=l.sp;if(typeof wallSig!=='undefined')wallSig='';
 const s=S.staff.find(s=>s.room===r.id&&s.state==='work');if(s){s.path=[];s.x=l.sp.staff.x;s.y=l.sp.staff.y;s.dir=l.sp.staff.dir}}}}
