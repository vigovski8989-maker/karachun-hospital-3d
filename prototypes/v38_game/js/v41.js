// v41: смена уставших врачей, сторож «застрявших» сидений, переоценка назначений
function v41Sub(s){return S.staff.find(o=>o!==s&&o.type===s.type&&!o.room&&o.state==='idle'&&!o.vs&&!o.goRest&&!(S.away||[]).some(a=>a.s===o))}
function v41Relieve(s,r){const sub=v41Sub(s);if(!sub)return false;r.staff=sub.id;sub.room=r.id;const p=spotStaff(r);goTo(sub,p.x,p.y);sub.state='goto';
 s.room=null;s.cover=false;s.goRest=true;s.state='work';S.v41=(S.v41||{});S.v41.reliefs=(S.v41.reliefs||0)+1;msg('🔄 '+sub.name+' сменяет уставшего '+s.name+' в «'+D.rooms[r.type].name+'»');return true}
const _fin41=finish;finish=function(p,r,s){const res=_fin41(p,r,s);try{const w=S.staff.find(x=>x.id===r.staff);if(w&&w.fat>=75&&w.state==='work')v41Relieve(w,r)}catch(e){}return res};
const _upd41=updStaff;updStaff=function(s,dt){
 if(s.goRest){if(s.vs){if(s.vs.ph==='sat')leaveSeat(s);return}s.goRest=false;const sr=S.rooms.find(x=>x.type==='staffroom');if(sr){const q=restSpot(sr,s);goTo(s,q.x,q.y);s.state='torest'}else s.state='idle';return}
 if(s.state==='idle'&&s.vs&&s.vs.ph!=='sat'){s.vst=(s.vst||0)+dt;if(s.vst>6){clearSeat(s);s.vst=0}}else s.vst=0;
 _upd41(s,dt);
 if(s.state==='work'&&s.room&&s.fat>=92){const r=S.rooms.find(x=>x.id===s.room);if(r&&!r.busy)v41Relieve(s,r)}};

// v41: автоповорот предметов коридора (лавки, автоматы, ...) + ручной поворот
const V41F=[[1,0],[0,1],[-1,0],[0,-1]];// dir -> куда смотрит лицевая сторона (x,y)
function v41Blocked(tx,ty){if(tx<0||ty<0||tx>=S.w||ty>=S.h-1)return 3;if(isHole(tx,ty)||roomAt(tx,ty))return 3;for(const i of S.items){for(const[a,b]of tilesOf(i.x,i.y,i.fp||fpOf(i.type)))if(a===tx&&b===ty)return 1}return 0}
function v41Fits(type,x,y,d){for(const[tx,ty]of tilesOf(x,y,fpDir(type,d)))if(v41Blocked(tx,ty))return false;return true}
function v41AutoDir(type,x,y){let best=null,bs=-1;for(const d of[1,3,0,2]){if(!v41Fits(type,x,y,d))continue;const fp=fpDir(type,d),[fx,fy]=V41F[d];let back=0,front=0;
 for(const[tx,ty]of tilesOf(x,y,fp)){const bx=tx-fx,by=ty-fy,nx=tx+fx,ny=ty+fy;const inB=tilesOf(x,y,fp).some(([a,b])=>a===bx&&b===by),inF=tilesOf(x,y,fp).some(([a,b])=>a===nx&&b===ny);if(!inB)back+=v41Blocked(bx,by);if(!inF&&!v41Blocked(nx,ny))front++}
 const s=back*2+front;if(s>bs){bs=s;best=d}}return best}
function placeItem(type,x,y){const d0=D.items[type];let dir=ui.v41rot!=null?ui.v41rot:v41AutoDir(type,x,y);if(dir==null){msg('Сюда нельзя');Snd.bad();return}const fp=fpDir(type,dir);
 for(const[tx,ty]of tilesOf(x,y,fp)){if(tx<0||ty<0||tx>=S.w||ty>=S.h-1||isHole(tx,ty)||roomAt(tx,ty)||blk().has(ty*S.w+tx)){msg('Сюда нельзя');Snd.bad();return}}
 if(S.money<d0.cost){msg('Недостаточно денег');return}const it={type,x,y,fp,dir,water:100,occ:type==='bench'?[0,0]:undefined};S.items.push(it);invBlk();
 {let ok=true;for(const r of S.rooms){const o=doorOut(r);if(!path(S.ent.x,S.ent.y,o.x,o.y)&&!(o.x===S.ent.x&&o.y===S.ent.y))ok=false}if(!ok){S.items.pop();invBlk();msg('Это перекроет проход');Snd.bad();return}}S.money-=d0.cost;Snd.build();return it}
const V41RN=['→ вправо','↓ вниз','← влево','↑ вверх'];
function v41RotLbl(){return '🔄 Поворот: '+(ui.v41rot==null?'авто':V41RN[ui.v41rot])}
function v41Rot(){ui.v41rot=ui.v41rot==null?1:ui.v41rot===1?0:ui.v41rot===0?3:ui.v41rot===3?2:null;const b=document.getElementById('v41rot');if(b)b.textContent=v41RotLbl()}
{const _p=pickItem;pickItem=function(k){_p(k);const b=$('build');if(b&&!document.getElementById('v41rot')){const bt=document.createElement('button');bt.id='v41rot';bt.textContent=v41RotLbl();bt.onclick=v41Rot;b.insertBefore(bt,b.children[1]||null)}}}
addEventListener('keydown',e=>{if((e.key==='r'||e.key==='R'||e.key==='к'||e.key==='К')&&ui.mode&&ui.mode.item)v41Rot()});
// посадочные места на повернутой лавке
{const _w=waitSpot;waitSpot=function(r,p){const s=_w(r,p);if(s&&s.bench){const b=S.items.find(i=>i.type==='bench'&&i.occ&&i.occ.includes(p.id));if(b&&b.dir!=null){const k=s.slot;if(b.dir===0||b.dir===2){s.x=b.x;s.y=b.y+k}else{s.x=b.x+k;s.y=b.y}s.dir=b.dir}}return s}}
// v41: клавиатура для ПК-версии: стрелки/WASD — сдвиг, +/- — масштаб, пробел — пауза, 1-3 — скорость
addEventListener('keydown',e=>{if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))return;const k=e.key,st=40/cam.z;
 if(k==='ArrowLeft'||k==='a'||k==='ф')cam.x-=st;else if(k==='ArrowRight'||k==='d'||k==='в')cam.x+=st;else if(k==='ArrowUp'||k==='w'||k==='ц')cam.y-=st;else if(k==='ArrowDown'||k==='s'||k==='ы')cam.y+=st;
 else if(k==='+'||k==='=')zoomAt(innerWidth/2,innerHeight/2,cam.z*1.15);else if(k==='-'||k==='_')zoomAt(innerWidth/2,innerHeight/2,cam.z/1.15);
 else if(k===' '){e.preventDefault();setSpeed(speed?0:1)}else if(k>='1'&&k<='3')setSpeed(+k);else return;});
