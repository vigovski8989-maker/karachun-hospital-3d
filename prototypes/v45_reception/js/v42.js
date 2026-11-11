// v42 fixes
function v42OnFurn(x,y){x=Math.round(x);y=Math.round(y);for(const r of S.rooms){if(x<r.x||y<r.y||x>=r.x+r.w||y>=r.y+r.h)continue;roomLay(r);for(const t of r.it)for(const[a,b]of tilesOf(t.x,t.y,t.fp))if(a===x&&b===y)return r}return null}
function v42FreeNear(x,y,r){x=Math.round(x);y=Math.round(y);const B=blk();let best=null,bd=1e9;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const tx=x+dx,ty=y+dy;if(r&&(tx<r.x||ty<r.y||tx>=r.x+r.w||ty>=r.y+r.h))continue;if(tx<0||ty<0||tx>=S.w||ty>=S.h-1||B.has(ty*S.w+tx)||v42OnFurn(tx,ty))continue;const d=Math.abs(dx)+Math.abs(dy);if(d<bd){bd=d;best={x:tx,y:ty}}}return best}
// 1. персонал, оставшийся стоять «в диване»/мебели после отдыха, отходит на свободную клетку
{const _u=updStaff;updStaff=function(s,dt){_u(s,dt);if(!s.vs&&!s.oa&&(!s.path||!s.path.length)&&(s.state==='idle'||s.state==='rest')){const r=v42OnFurn(s.x,s.y);if(r){if(s.state==='rest')s.state='idle';s.restKey=null;const f=v42FreeNear(s.x,s.y,r);if(f){s.x=s.x;goTo(s,f.x,f.y)}}}}}
// 4. лишний персонал (подменяющий чужой кабинет / читающий в библиотеке / отдыхающий без усталости) сразу занимает новый «свой» кабинет
function v42OwnFree(s){return S.rooms.find(r=>D.rooms[r.type]&&D.rooms[r.type].staff===s.type&&!r.staff&&!(r.type==='research'&&resDone()))}
{const _u=updStaff;updStaff=function(s,dt){
 if(s.type!=='handyman'&&(S.t42=(S.t42||0))>=0){const own=v42OwnFree(s);if(own){
  if(s.cover&&s.room&&(s.state==='work'||s.state==='goto')){const r=S.rooms.find(x=>x.id===s.room);if(!r||r.busy===null||s.state==='goto'){releaseCover(s,r);S.v42=S.v42||{claims:0};S.v42.claims++;msg('➡ '+s.name+' уходит в свой новый кабинет «'+D.rooms[own.type].name+'»')}}
  else if(s.state==='read'){if(s.vs){if(s.vs.ph==='sat')leaveSeat(s)}else{s.rd=null;s.state='idle';s.path=[]}}
  else if(s.state==='idle'&&s.vs&&s.vs.ph!=='sat'){s._st42=(s._st42||0)+dt;if(s._st42>3){clearSeat(s);s._st42=0}}}}
 return _u(s,dt)}}
// 1b. если оба места на диване заняты — отдыхать стоя рядом, на свободной клетке, а не «в диване»
{const _rs=restSpot;restSpot=function(sr,me){const s=_rs(sr,me);if(me.restKey)return s;const used=new Set(S.staff.filter(o=>o!==me&&o.restKey==null&&(o.state==='rest'||o.state==='torest')).map(o=>Math.round(o.x)+','+Math.round(o.y)));
 for(let y=sr.y;y<sr.y+sr.h;y++)for(let x=sr.x;x<sr.x+sr.w;x++){if(used.has(x+','+y)||blk().has(y*S.w+x)||v42OnFurn(x,y)||!walk(x,y))continue;const d=doorInner?doorInner(sr):null;if(d&&d.x===x&&d.y===y)continue;return{x,y,pose:'stand',dir:1}}return s}}
// 2. Санитары (со шваброй) — уборка в стиле Theme Hospital: мусор/рвота → подойти, остановиться, мыть шваброй; урны → вытряхнуть; растения → полить
function v42Claimed(o,me){return S.staff.some(h=>h!==me&&((h.task&&h.task.o===o)||(h.cl&&h.cl.o===o)))}
function v42FindJob(s){let best=null,bd=1e9;const c=(x,y,k,o,w)=>{const hm=k==='clean'&&S.staff.find(h=>h!==s&&h.type==='handyman'&&h.task&&h.task.o===o&&h.state==='goto');if(!(hm&&Math.hypot(x-hm.x,y-hm.y)>Math.hypot(x-s.x,y-s.y)+1)&&v42Claimed(o,s))return;const d=Math.hypot(x-s.x,y-s.y)-(w||0);if(d<bd){bd=d;best={k,o,x,y}}};
 for(const l of S.litter)c(Math.round(l.x),Math.round(l.y),'clean',l,l.v?6:0);
 for(const it of S.items){if(it.type==='bin'&&(it.fill||0)>=60)c(it.x,it.y,'bin',it,2);if(it.type==='plant'&&it.water<50)c(it.x,it.y,'water',it)}return best}
function v42Goal(s,j){if(goTo(s,j.x,j.y))return true;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])if(walk(j.x+dx,j.y+dy)&&goTo(s,j.x+dx,j.y+dy))return true;return false}
{const _u=updStaff;updStaff=function(s,dt){
 if(s.type==='handyman'){_u(s,dt);s.mop=s.state==='do'&&s.task&&s.task.k==='clean';if(s.state==='goto'&&s.task&&s.task.k==='clean'&&!S.litter.includes(s.task.o)){s.task=null;s.state='idle';s.path=[]}return}
 if(s.type!=='orderly')return _u(s,dt);
 if(s.cl){const j=s.cl;const gone=j.k==='clean'?!S.litter.includes(j.o):!S.items.includes(j.o);if(gone){s.cl=null;s.task=null;s.mop=false;s.path=[];s.state='idle';return v42Back(s)}
  if(j.ph==='go'){if(move(s,dt)){j.ph='do';j.t=j.k==='clean'?(j.o.v?4.5:3.5):2.5;s.dir=Math.abs(j.x-s.x)>Math.abs(j.y-s.y)?(j.x>s.x?0:2):(j.y>s.y?1:3);s.mop=j.k==='clean'}return}
  j.t-=dt*(typeof eff==='function'?eff(s):1);if(j.t<=0){if(j.k==='clean')S.litter=S.litter.filter(l=>l!==j.o);else if(j.k==='bin')j.o.fill=0;else j.o.water=100;S.v42cl=(S.v42cl||0)+1;s.cl=null;s.task=null;s.mop=false;s.fat=Math.min(100,(s.fat||0)+2);s.state='idle';const n=v42FindJob(s);if(n&&v42Goal(s,n)){s.cl={...n,ph:'go'};v43Steal(n.o,s);s.task={k:n.k,o:n.o};s.state='clean';return}v42Back(s)}return}
 const morgueIdle=s.state==='work'&&!S.pats.some(p=>p.state==='dead'&&p.body==='wait');
 if((s.state==='idle'||morgueIdle)&&!s.body&&(!s.vs||s.vs.ph==='sat')&&(s.fat||0)<85){const j=v42FindJob(s);if(j){if(s.vs){leaveSeat(s);return}if(v42Goal(s,j)){s.cl={...j,ph:'go'};v43Steal(j.o,s);s.task={k:j.k,o:j.o};s.state='clean';return}}}
 _u(s,dt)}}
function v42Back(s){const r=S.rooms.find(r=>r.id===s.room);if(r){const p=spotStaff(r);goTo(s,p.x,p.y);s.state='goto'}}
// урны наполняются (там, где без урны был бы мусор); пациенты иногда тошнит
{const _p=updPatient;updPatient=function(p,dt){_p(p,dt);if(p.state==='dead'||p.healed)return;const x=Math.round(p.x),y=Math.round(p.y);if(roomAt(x,y))return;
 if(Math.random()<dt*0.004){const b=S.items.find(i=>i.type==='bin'&&Math.abs(i.x-p.x)+Math.abs(i.y-p.y)<4);if(b)b.fill=Math.min(100,(b.fill||0)+12)}
 if((p.state==='queue'||p.state==='wait'||p.state==='sit')&&Math.random()<dt*0.0012&&p.health<70)S.litter.push({x:p.x+rnd(-.3,.3),y:p.y+rnd(-.3,.3),v:1})}}
// 5. Призрак предмета коридора: контур под курсором/пальцем — зелёный = можно, красный = нельзя, с поворотом
let v42PT='mouse',v42Cache=null;
addEventListener('pointerdown',e=>{v42PT=e.pointerType||'mouse'},true);
function v42ItemCheck(type,x,y){const key=[type,x,y,ui.v41rot,S.items.length,S.rooms.length,S.money>=D.items[type].cost].join();if(v42Cache&&v42Cache.key===key)return v42Cache;
 let dir=ui.v41rot!=null?ui.v41rot:v41AutoDir(type,x,y),bad=null;if(dir==null){dir=ui.v41rot!=null?ui.v41rot:1;bad='Сюда нельзя'}const fp=fpDir(type,dir);
 if(!bad)for(const[tx,ty]of tilesOf(x,y,fp))if(tx<0||ty<0||tx>=S.w||ty>=S.h-1||isHole(tx,ty)||roomAt(tx,ty)||blk().has(ty*S.w+tx)){bad='Сюда нельзя';break}
 if(!bad){S.items.push({type,x,y,fp,dir});invBlk();for(const r of S.rooms){const o=doorOut(r);if(!path(S.ent.x,S.ent.y,o.x,o.y)&&!(o.x===S.ent.x&&o.y===S.ent.y)){bad='Перекроет проход';break}}S.items.pop();invBlk()}
 if(!bad&&S.money<D.items[type].cost)bad='Мало денег';return v42Cache={key,dir,fp,bad,x,y,type}}
function v42IG(){if(!(ui.mode&&ui.mode.item)||!ui.ig)return null;return v42ItemCheck(ui.mode.item,ui.ig.x,ui.ig.y)}
addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||!(ui.mode&&ui.mode.item)||!e.target||e.target.tagName!=='CANVAS')return;const w=toWorld(e.clientX,e.clientY);ui.ig={x:Math.floor(w.x),y:Math.floor(w.y)}});
function v42Confirm(){const g=v42IG();if(!g){msg('Сначала выберите место на полу');return}const it=placeItem(g.type,g.x,g.y);v42Cache=null}
{const _t=tap;tap=function(sx,sy){if(ui.mode&&ui.mode.item&&!ui.ghost){const w=toWorld(sx,sy),x=Math.floor(w.x),y=Math.floor(w.y);
  if(v42PT==='mouse'||(ui.ig&&ui.ig.x===x&&ui.ig.y===y)){ui.ig={x,y};placeItem(ui.mode.item,x,y);v42Cache=null;return}ui.ig={x,y};Snd.click&&Snd.click();return}return _t(sx,sy)}}
{const _p=pickItem;pickItem=function(k){_p(k);const c=toWorld(innerWidth/2,innerHeight/2);ui.ig={x:Math.floor(c.x),y:Math.floor(c.y)};v42Cache=null;const b=$('build');if(b&&!document.getElementById('v42ok')){const bt=document.createElement('button');bt.id='v42ok';bt.className='grn';bt.textContent='✔ Поставить';bt.onclick=v42Confirm;b.insertBefore(bt,b.lastChild)}const sp=b&&b.querySelector('span');if(sp)sp.textContent='Наведите/нажмите на пол — контур покажет место (зелёный = можно), затем ✔ или повторное нажатие: '+D.items[k].name}}
{const _d=typeof itemDone==='function'?itemDone:null;if(_d)itemDone=function(){ui.ig=null;return _d.apply(this,arguments)}}
// 6. Кабинет можно ставить вплотную к наружной стене со стороны входа (нижний ряд), вход и клетки рядом с ним остаются свободными
validRoom=function(g){if(g.x<0||g.y<0||g.x+g.w>S.w||g.y+g.h>S.h)return'За пределами';
 const e=S.ent;if(g.y+g.h>=S.h-1&&e.x>=g.x-1&&e.x<=g.x+g.w&&g.y+g.h>e.y-1)return'Перекрывает вход';
 for(let y=g.y;y<g.y+g.h;y++)for(let x=g.x;x<g.x+g.w;x++){if(isHole(x,y))return'Нельзя строить здесь';if(roomAt(x,y))return'Пересечение';if(S.items.some(i=>tilesOf(i.x,i.y,i.fp||fpOf(i.type)).some(t=>t[0]===x&&t[1]===y)))return'Мешают предметы'}
 const t=makeRoom(g.type,g.x,g.y,g.w,g.h,g.side);S.nid--;if(t.bad)return'Мебель не помещается';const o=doorOut(t);if(o.y>=S.h||!walk(o.x,o.y)||roomAt(o.x,o.y))return'Дверь упирается';
 S.rooms.push(t);let ok=true;for(const r of S.rooms){const d=doorOut(r);if(!path(S.ent.x,S.ent.y,d.x,d.y)&&!(d.x===S.ent.x&&d.y===S.ent.y))ok=false}S.rooms.pop();
 return ok?null:'Перекрывает проход'};

// v43: санитар забирает уборку у мастера, если ближе (раньше мастер «бронировал» весь мусор сразу и санитары только ходили со шваброй)
function v43Steal(o,me){for(const h of S.staff)if(h!==me&&h.type==='handyman'&&h.task&&h.task.o===o){h.task=null;h.state='idle';h.path=[];h.mop=false}}
