'use strict';
// ===== Больница «Карачун» — ядро игры (data-driven) =====
const T=32, DAY=8, MONTH_DAYS=30, SAVE_KEY='hohotun_trial45_save_v1';
const DIRS=[[0,1],[1,0],[0,-1],[-1,0]];
let D={}, S=null, cam={x:0,y:0,z:1}, speed=1, ui={mode:null,ghost:null,sel:null}, cv, cx;
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a), ri=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
const FIRST=['Анна','Борис','Вера','Глеб','Дина','Егор','Жанна','Илья','Кира','Лев','Мила','Олег','Пётр','Рита','Семён','Таня','Фёдор','Юля','Ян','Зоя'];
const LAST=['Пилюлькин','Градусов','Бинтов','Шприцев','Таблеткин','Сиропов','Компрессов','Йодов','Ваткин','Пульсов','Микстуров','Клизмин'],FEM='Анна Вера Дина Жанна Кира Мила Рита Таня Юля Зоя'.split(' ');
const pname=()=>{const f=pick(FIRST);return f+' '+pick(LAST)+(FEM.includes(f)?'а':'')};

async function loadData(){for(const k of['rooms','items','staff','diseases','levels','furn'])D[k]=await (await fetch('data/'+k+'.json')).json();D.dis={};D.diseases.forEach(d=>D.dis[d.id]=d)}

function newGame(li=0,quiet){const L=D.levels[li];S={lv:li,w:L.w,h:L.h,money:L.money,rep:L.rep,t:0,day:0,rooms:[],items:[],staff:[],pats:[],litter:[],nid:1,spawnT:5,cured:0,deaths:0,sent:0,won:false,lost:false,cands:null,lastMonth:0,earn:0};
 S.ent={x:L.entX!=null?L.entX:Math.floor(L.w/2),y:L.h-1};mechInit();genCands();centerCam();invBlk();if(!quiet)modal('<h2>'+L.name+'</h2><p>'+L.intro+'</p><button onclick="closeModal()">Начать</button>');}
function L(){return D.levels[S.lv]}

// ---------- Сетка ----------
function roomAt(x,y){return S.rooms.find(r=>x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h)}
function isWall(r,x,y){if(!r)return false;const edge=x===r.x||y===r.y||x===r.x+r.w-1||y===r.y+r.h-1;return edge&&!(x===r.door.x&&y===r.door.y)}
function isHole(x,y){if(inLot(x,y))return true;const hs=L().holes;if(!hs)return false;for(const h of hs)if(x>=h[0]&&y>=h[1]&&x<h[0]+h[2]&&y<h[1]+h[3])return true;return false}
let BLK=null;function invBlk(){BLK=null}
function blk(){if(BLK&&BLK.S===S&&BLK.n===S.nid&&BLK.r===S.rooms.length&&BLK.i===S.items.length)return BLK.s;const s=new Set();for(const r of S.rooms){roomLay(r);for(const t of r.it)if(!t.soft)for(const[x,y]of tilesOf(t.x,t.y,t.fp))s.add(y*S.w+x)}for(const i of S.items){i.fp=i.fp||fpOf(i.type);for(const[x,y]of tilesOf(i.x,i.y,i.fp))s.add(y*S.w+x)}BLK={s,S,n:S.nid,r:S.rooms.length,i:S.items.length};return s}
function walk0(x,y){if(x<0||y<0||x>=S.w||y>=S.h||isHole(x,y))return false;return !isWall(roomAt(x,y),x,y)}
function walk(x,y){return walk0(x,y)&&!blk().has(y*S.w+x)}
function path(sx,sy,tx,ty){sx=Math.round(sx);sy=Math.round(sy);if(sx===tx&&sy===ty)return[];const W=S.w,prev=new Int32Array(W*S.h).fill(-1),q=[sy*W+sx];prev[q[0]]=q[0];
 for(let i=0;i<q.length;i++){const c=q[i],x=c%W,y=(c/W)|0;if(x===tx&&y===ty){const p=[];let k=c;while(k!==q[0]){p.push({x:k%W,y:(k/W)|0});k=prev[k]}return p.reverse()}
  for(const[dx,dy]of DIRS){const nx=x+dx,ny=y+dy,n=ny*W+nx;if(((nx===tx&&ny===ty)?walk0(nx,ny):walk(nx,ny))&&prev[n]<0){// входить в комнату только через дверь
   const ra=roomAt(x,y),rb=roomAt(nx,ny);if(ra!==rb&&!((ra&&ra.door.x===x&&ra.door.y===y)||(rb&&rb.door.x===nx&&rb.door.y===ny)))continue;prev[n]=c;q.push(n)}}}
 return null}
function doorOut(r){const d=DIRS[r.side];return{x:r.door.x+d[0],y:r.door.y+d[1]}}
function makeRoom(type,x,y,w,h,side){const r={id:S.nid++,type,x,y,w,h,side,staff:null,queue:[],busy:null,cond:100,uses:0};placeDoor(r);const l=layout(r);r.bad=!l;r.it=l?l.items:[];r.sp=l?l.sp:{};return r}
function placeDoor(r){const mx=r.x+Math.floor(r.w/2),my=r.y+Math.floor(r.h/2);r.door=[{x:mx,y:r.y+r.h-1},{x:r.x+r.w-1,y:my},{x:mx,y:r.y},{x:r.x,y:my}][r.side]}
function inner(r){return{x:r.x+1,y:r.y+1,w:r.w-2,h:r.h-2}}
function validRoom(g){if(g.x<0||g.y<0||g.x+g.w>S.w||g.y+g.h>S.h-1)return'За пределами';
 for(let y=g.y;y<g.y+g.h;y++)for(let x=g.x;x<g.x+g.w;x++){if(isHole(x,y))return'Нельзя строить здесь';if(roomAt(x,y))return'Пересечение';if(S.items.some(i=>tilesOf(i.x,i.y,i.fp||fpOf(i.type)).some(t=>t[0]===x&&t[1]===y)))return'Мешают предметы'}
 const t=makeRoom(g.type,g.x,g.y,g.w,g.h,g.side);S.nid--;if(t.bad)return'Мебель не помещается';const o=doorOut(t);if(!walk(o.x,o.y)||roomAt(o.x,o.y))return'Дверь упирается';
 S.rooms.push(t);let ok=true;for(const r of S.rooms){const d=doorOut(r);if(!path(S.ent.x,S.ent.y,d.x,d.y)&&!(d.x===S.ent.x&&d.y===S.ent.y))ok=false}S.rooms.pop();
 return ok?null:'Перекрывает проход'}

// ---------- Персонал ----------
function genCands(){S.cands={};for(const k in D.staff){S.cands[k]=[];for(let i=0;i<3;i++){const sk=ri(15,90);S.cands[k].push({name:pname(),skill:sk,salary:Math.round(D.staff[k].base*(0.6+sk/100)/10)*10})}}}
function hire(type,i){const c=S.cands[type][i];const s={id:S.nid++,type,name:c.name,skill:c.skill,salary:c.salary,x:S.ent.x,y:S.ent.y,path:[],state:'idle',room:null,fat:0,task:null,t:0};S.staff.push(s);
 S.cands[type].splice(i,1);const sk=ri(15,90);S.cands[type].push({name:pname(),skill:sk,salary:Math.round(D.staff[type].base*(0.6+sk/100)/10)*10});msg(D.staff[type].name+' '+s.name+' принят(а) на работу');Snd.click();}
function fire(id){const s=S.staff.find(s=>s.id===id);if(!s)return;const r=S.rooms.find(r=>r.id===s.room);if(r)r.staff=null;clearSeat(s);S.staff=S.staff.filter(x=>x!==s);msg(s.name+' уволен(а)')}
function staffReady(r){if(!D.rooms[r.type].staff)return true;const s=S.staff.find(s=>s.id===r.staff);if(D.rooms[r.type].machine&&r.cond<=20)return false;return s&&s.state==='work'&&!(s.vs&&s.vs.ph!=='sat')&&!s.path.length}
function eff(s){return (0.5+s.skill/100)*(1-s.fat/250)}

// ---------- Движение ----------
function goTo(e,x,y){const p=path(e.x,e.y,x,y);if(p===null){e.path=[];return false}e.path=p;return true}
function move(e,dt,sp=2.2){if(!e.path.length)return true;const n=e.path[0],dx=n.x-e.x,dy=n.y-e.y,d=Math.hypot(dx,dy),st=sp*dt;
 if(Math.abs(dx)+Math.abs(dy)>.001)e.dir=Math.abs(dx)>=Math.abs(dy)?(dx>0?0:2):(dy>0?1:3);if(d<=st){e.x=n.x;e.y=n.y;e.path.shift();return!e.path.length}e.x+=dx/d*st;e.y+=dy/d*st;return false}

// ---------- Пациенты ----------
function spawnPatient(){const ds0=L().diseases,ds1=ds0.filter(z=>!roomLocked(D.dis[z].cure)),ds=ds1.length?ds1:ds0,dz=pick(ds);const p={id:S.nid++,name:pname(),dis:dz,x:S.ent.x,y:S.ent.y,path:[],state:'seek',need:'reception',health:100,pat:100,cert:0,known:false,wait:0,room:null,t:0,thought:null,hue:ri(0,360),wcDone:Math.random()<.55,wcAt:rnd(45,120)};S.pats.push(p);Snd.arrive()}
function comfortAt(x,y){let c=0;for(const i of S.items){if(Math.abs(i.x-x)+Math.abs(i.y-y)<=3){const d=D.items[i.type];c+=(d.comfort||0)*(i.type==='plant'&&i.water<30?0:1)+(d.warm||0)}}if(S.rooms.some(r=>r.type==='toilet'))c+=2;return Math.min(c,8)}
function leave(p,why,rep){unqueue(p);p.wash=false;p.state='leave';p.thought=why;S.rep=Math.max(0,S.rep-(rep||0));goTo(p,S.ent.x,S.ent.y)}
function unqueue(p){S.rooms.forEach(q=>{if(q.type==='toilet'&&q.busy===p.id)q.busy=null});p.wantSeat=null;releaseBench(p);const r=S.rooms.find(r=>r.id===p.room);if(r){r.queue=r.queue.filter(i=>i!==p.id);if(r.busy===p.id)r.busy=null}p.room=null}
function waitSpot(r,p){const o=doorOut(r);const bs=S.items.filter(i=>i.type==='bench'&&Math.abs(i.x-o.x)+Math.abs(i.y-o.y)<=7).sort((a,b)=>Math.abs(a.x-o.x)+Math.abs(a.y-o.y)-Math.abs(b.x-o.x)-Math.abs(b.y-o.y));
 for(const b of bs){b.occ=b.occ||[0,0];for(let k=0;k<b.occ.length;k++){if(!b.occ[k]||!S.pats.some(q=>q.id===b.occ[k])){b.occ[k]=p.id;return{x:b.x+k,y:b.y,pose:'sit',dir:1,seat:'bench',bench:true,slot:k}}}}
 for(let k=0;k<20;k++){const x=o.x+ri(-2,2),y=o.y+ri(-2,2);if(walk(x,y)&&!roomAt(x,y))return{x,y,pose:'stand',dir:ri(0,3)}}return{x:o.x,y:o.y,pose:'stand',dir:1}}
function updPatient(p,dt){const dz=D.dis[p.dis];
 if(p.state==='dead'){p.t+=dt;return}
 if(p.state==='vip'){updVip(p,dt);return}
 if(p.inf&&S.epi&&Math.random()<dt*.05){for(const q of S.pats)if(!q.inf&&!q.immune&&!q.vip&&q.state!=='dead'&&Math.abs(q.x-p.x)+Math.abs(q.y-p.y)<1.6){q.inf=true;break}}
 if(p.state!=='leave'){p.health-=dt*0.12*(0.5+dz.diff)*(L().decay||1)*(icuOn()?0.65:1);if(p.health<=0){die(p,'decay');return}}
 if(Math.random()<dt*0.004&&!roomAt(Math.round(p.x),Math.round(p.y))&&!S.items.some(i=>i.type==='bin'&&Math.abs(i.x-p.x)+Math.abs(i.y-p.y)<4))S.litter.push({x:p.x+rnd(-.3,.3),y:p.y+rnd(-.3,.3)});
 if(p.state==='seek'||p.state==='queue'){const c=comfortAt(Math.round(p.x),Math.round(p.y));p.pat-=dt*(window.patRate?patRate(p,c,dt):0.35*(1-c/12));if(p.pat<=0){if(window.patLeave)patLeave(p);else{msg(p.name+' ушёл(ла), не дождавшись');leave(p,'😠',5);Snd.bad()}return}
  if(Math.random()<dt*0.003&&S.items.some(i=>i.type==='soda')){S.money+=15;S.earn+=15}}
 if(p.vs){if(p.vs.ph==='up')return;if(!['queue','treat','wc2'].includes(p.state)){if(p.vs.ph==='sat')leaveSeat(p);return}}
 switch(p.state){
 case'seek':{const rs=S.rooms.filter(r=>r.type===p.need);if(!rs.length){p.thought='❓';p.wait+=dt;move(p,dt);if(!p.path.length&&Math.random()<.02){const x=ri(1,S.w-2),y=ri(S.h-6,S.h-2);if(walk(x,y)&&!roomAt(x,y))goTo(p,x,y)}
   if(p.wait>(p.known?60:40)){msg(p.name+': нет кабинета «'+D.rooms[p.need].name+'» — отправлен(а) домой');S.sent++;leave(p,'🏠',3)}return}
  rs.sort((a,b)=>a.queue.length/rCap(a)-b.queue.length/rCap(b));const r=rs[0];if(p.emg){let k=r.queue.length;while(k>1){const q=S.pats.find(x=>x.id===r.queue[k-1]);if(q&&q.emg)break;k--}r.queue.splice(Math.max(Math.min(1,r.queue.length),k),0,p.id)}else r.queue.push(p.id);p.room=r.id;p.thought=null;p.wait=0;const w=waitSpot(r,p);goTo(p,w.x,w.y);p.wantSeat=w.pose!=='stand'?w:null;p.dir=p.dir==null?1:p.dir;p.state='queue';break}
 case'queue':{const r=S.rooms.find(r=>r.id===p.room);if(!r){clearSeat(p);p.state='seek';return}
  if(!p.vs){if(p.path.length)move(p,dt);else if(p.wantSeat)takeSeat(p,p.wantSeat)}
  p.wc=(p.wc||0)+dt;const tr=p.wcDone?null:S.rooms.find(q=>q.type==='toilet'&&q.busy===null&&roomLay(q).sp.patient&&Math.abs(q.x-p.x)+Math.abs(q.y-p.y)<=16);
  if(!p.wcDone&&p.wc>p.wcAt&&tr&&r.queue[0]!==p.id&&r.queue.length>1&&(!p.vs||p.vs.ph==='sat')){tr.busy=p.id;p.wcRoom=tr.id;r.queue=r.queue.filter(i=>i!==p.id);p.room=null;releaseBench(p);p.wantSeat=null;p.thought='🚽';p.state='wc1';p.wcGo=false;return}
  if(r.queue[0]===p.id&&p.vs&&p.vs.ph==='sat'&&r.busy!==null&&r.busy!==p.id&&false)break;if(r.queue[0]===p.id&&r.busy===null&&staffReady(r)){p.wantSeat=null;if(p.vs){if(p.vs.ph==='sat')leaveSeat(p);break}if(p.path.length)break;r.busy=p.id;releaseBench(p);const sp=spotPatient(r);goTo(p,sp.x,sp.y);p.state='enter'}break}
 case'enter':{const r=S.rooms.find(r=>r.id===p.room);if(!r){p.state='seek';return}if(move(p,dt)){p.state='treat';p.t=r_dur(p);p.tT=p.t;const sp=spotPatient(r);p.dir=sp.dir!=null?sp.dir:p.dir;takeSeat(p,sp)}break}
 case'treat':{const r=S.rooms.find(r=>r.id===p.room);if(!r){clearSeat(p);p.state='seek';return}const s=S.staff.find(s=>s.id===r.staff);if(s&&s.state!=='work'&&!(s.vs&&s.vs.ph!=='sat'))return;if(p.t>0)p.t-=dt*(s?eff(s):1);if(p.vs&&p.vs.ph==='sat'&&p.t<=(SEAT_T[p.vs.pose]||.9))leaveSeat(p);if(p.t<=0){if(p.vs)return;finish(p,r,s)}break}
 case'wc1':{const tr=S.rooms.find(r=>r.id===p.wcRoom);if(!tr){p.state='seek';p.thought=null;return}const sp=tr.sp.patient;if(!p.wcGo){if(!goTo(p,sp.x,sp.y+1)&&!goTo(p,sp.x,sp.y)){tr.busy=null;p.wcDone=true;p.state='seek';return}p.wcGo=true}
  if(move(p,dt)){p.dir=3;p.oa={act:'lid',d:3,t:0,T:1};p.state='wcL'}break}
 case'wcL':case'wcF':case'wcD':{const tr=S.rooms.find(r=>r.id===p.wcRoom),wc=tr&&roomItem(tr.sp.patient,'wc');if(!tr){p.oa=null;p.state='seek';return}const o=p.oa;o.t+=dt;const q=Math.min(1,o.t/o.T);
  if(wc){if(p.state==='wcL')wc.lid=q<.4?0:Math.min(3,(q-.4)/.6*3);else if(p.state==='wcD')wc.lid=q>.6?0:Math.max(0,3-q/.6*3)}
  if(q<1)break;p.oa=null;
  if(p.state==='wcL'){p.state='wc2';p.t=5+rnd(0,2);takeSeat(p,sp_(tr))}
  else if(p.state==='wcF'){p.oa={act:'lid',d:3,t:0,T:1,rev:true};p.state='wcD'}
  else{const w=tr.sp.wash||tr.sp.patient;goTo(p,w.x,w.y);p.state='wc3'}break}
 case'wc2':{const tr=S.rooms.find(r=>r.id===p.wcRoom);if(!tr){clearSeat(p);p.state='seek';return}if(p.vs&&p.vs.ph==='down')return;p.t-=dt;if(p.t<=0){if(p.vs){if(p.vs.ph==='sat')leaveSeat(p);return}const sp=tr.sp.patient;p.x=sp.x;p.y=sp.y+1;p.dir=3;p.oa={act:'flush',d:3,t:0,T:.9};p.state='wcF'}break}
 case'wc3':{const tr=S.rooms.find(r=>r.id===p.wcRoom);if(!tr){p.state='seek';return}if(move(p,dt)){const w=tr.sp.wash||tr.sp.patient;p.dir=w.dir!=null?w.dir:3;p.wash=true;p.state='wc4';p.t=3.2}break}
 case'wc4':{p.t-=dt;if(p.t<=0){const tr=S.rooms.find(r=>r.id===p.wcRoom);if(tr)tr.busy=null;p.wash=false;p.wcDone=true;p.pat=Math.min(100,p.pat+25);p.thought=null;p.state='seek'}break}
 case'leave':{if(move(p,dt)){S.pats=S.pats.filter(x=>x!==p)}break}}}
function r_dur(p){return{reception:3,gp:8,diag:10,lab:7,pharmacy:6,ward:16,psych:12,pump:12,cardio:13,surgery:18,xray:9,genetics:14,electro:11,reboot:10,inflate:12,derma:13}[p.need]||8}
function icuOn(){return S.rooms.some(r=>r.type==='icu'&&staffReady(r))}
function finish(p,r,s){r.busy=null;r.queue=r.queue.filter(i=>i!==p.id);p.room=null;const dz=D.dis[p.dis],sk=s?s.skill:50;
 if(p.need==='reception'){p.need='gp';p.state='seek';return}
 if(p.need==='gp'||D.rooms[p.need].diag){if(p.need==='gp')p.cert+=0.25+sk/250-dz.diff*0.15;else{p.cert+=D.rooms[p.need].diag+sk/400;S.money+=100;S.earn+=100}
  p.cert=Math.min(1,p.cert);if(p.cert>=0.8){p.known=true;p.need=dz.cure;msg(p.name+': диагноз — '+dz.name);lowChanceCheck(p)}
  else if(p.need!=='gp'){p.need='gp'}
  else{const dr=['diag','lab'].filter(t=>S.rooms.some(r=>r.type===t));if(dr.length)p.need=dr.sort((a,b)=>S.rooms.filter(r=>r.type===a).reduce((s,r)=>s+r.queue.length,0)-S.rooms.filter(r=>r.type===b).reduce((s,r)=>s+r.queue.length,0))[0];
   else if(p.cert>=0.5){p.known=true;p.need=dz.cure;lowChanceCheck(p)}else{p.cert+=0.15;}}
  p.state='seek';return}
 // лечение
 if(D.rooms[r.type].machine){{const c0=r.cond;r.cond-=ri(8,15);if(c0<=20&&r.cond<=0)r.cond=1}r.uses++;if(r.cond<=0){explode(r);return}}
 const ch=cureChance(p,s);if(Math.random()<ch){p.healed=true;S.money+=dz.fee;S.earn+=dz.fee;S.cured++;if(p.emg&&S.em)S.em.cured++;p.inf=false;S.rep=Math.min(1000,S.rep+4);p.thought='😊';Snd.cash();msg(p.name+' вылечен(а) от «'+dz.name+'» +$'+dz.fee);leave(p,'😊',0)}
 else if(Math.random()<(L().failDeath??.5)&&!(icuOn()&&Math.random()<.5)){msg('💀 Лечение «'+dz.name+'» не удалось: '+p.name+' не выжил(а)');die(p,'fail')}
 else{msg('Лечение не помогло: '+p.name+' уходит недовольным');leave(p,'😞',6)}}
function die(p,why){clearSeat(p);p.path=[];S.dl=S.dl||{};S.dl[why||'x']=(S.dl[why||'x']||0)+1;unqueue(p);p.state='dead';p.t=0;S.deaths++;S.rep=Math.max(0,S.rep-15);Snd.bad();msg('☠ '+p.name+' скончался(ась)… Репутация падает')}
function explode(r){Snd.boom();msg('💥 Аппарат в «'+D.rooms[r.type].name+'» взорвался!');S.rep=Math.max(0,S.rep-25);const rf=Math.round((r.cost||D.rooms[r.type].cost)*.3);S.money+=rf;msg('Страховка: +$'+rf+'. Пациенты эвакуированы');
 for(const p of S.pats)if(p.room===r.id){clearSeat(p);unqueue(p);p.vs=null;p.state='seek'}
 const s=S.staff.find(s=>s.id===r.staff);if(s){clearSeat(s);s.room=null;s.state='idle'}S.rooms=S.rooms.filter(x=>x!==r)}

// ---------- Персонал: ИИ ----------
function updStaff(s,dt){
 if(s.type==='handyman'){updHandy(s,dt);return}
 if(s.vs&&s.vs.ph==='up')return;
 let r=S.rooms.find(r=>r.id===s.room);if(!r&&s.room){clearSeat(s);s.room=null;s.state='idle'}
 if(s.vs&&s.state==='idle'){if(s.vs.ph==='sat')leaveSeat(s);return}
 if(s.state==='idle'){const cand=S.rooms.filter(r=>D.rooms[r.type].staff===s.type&&!r.staff&&!(r.type==='research'&&resDone()));if(cand.length){cand.sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y));r=cand[0];r.staff=s.id;s.room=r.id;const p=spotStaff(r);goTo(s,p.x,p.y);s.state='goto'}else{move(s,dt);if(!s.path.length&&Math.random()<.01){const x=ri(1,S.w-2),y=ri(1,S.h-2);if(walk(x,y)&&!roomAt(x,y))goTo(s,x,y)}}}
 else if(s.state==='goto'){if(move(s,dt)){s.state='work';const p=spotStaff(r||S.rooms.find(q=>q.id===s.room)||{x:0,y:0,w:3,h:3,sp:{}});s.dir=p.dir!=null?p.dir:1;takeSeat(s,p)}}
 else if(s.state==='work'){s.fat=Math.min(100,s.fat+dt*(r&&r.busy?0.5:0.15));const sr=S.rooms.find(x=>x.type==='staffroom');if(s.fat>=90&&sr&&r&&r.busy===null){if(s.vs){if(s.vs.ph==='sat')leaveSeat(s);return}const cm=sr.it&&sr.it.find(t=>t.k==='coffee');handOver(s,r);if(cm&&!S.staff.some(o=>o!==s&&(o.state==='tocoffee'||o.state==='coffee'))){goTo(s,cm.x,cm.y+1);s.state='tocoffee'}else{const p=restSpot(sr,s);goTo(s,p.x,p.y);s.state='torest'}}}
 else if(s.state==='tocoffee'){const sr=S.rooms.find(x=>x.type==='staffroom');if(!sr){s.state='idle';return}if(move(s,dt)){s.dir=3;s.oa={act:'coffee',d:3,t:0,T:3.2};s.state='coffee'}}
 else if(s.state==='coffee'){const sr=S.rooms.find(x=>x.type==='staffroom');s.oa.t+=dt;s.fat=Math.max(0,s.fat-dt*4);if(!sr){s.oa=null;s.state='idle';return}if(s.oa.t>=s.oa.T){s.oa=null;const p=restSpot(sr,s);goTo(s,p.x,p.y);s.state='torest'}}
 else if(s.state==='torest'){const sr=S.rooms.find(x=>x.type==='staffroom');if(!sr){s.state='idle';return}if(move(s,dt)){s.state='rest';s.t=0;takeSeat(s,restSpot(sr,s))}}
 else if(s.state==='rest'){if(s.vs&&s.vs.ph==='down')return;s.fat=Math.max(0,s.fat-dt*8*v24Spd(rCap(S.rooms.find(x=>x.type==='staffroom'))));if(s.fat<=0){if(s.vs){if(s.vs.ph==='sat')leaveSeat(s);return}s.restKey=null;if(r){const p=spotStaff(r);goTo(s,p.x,p.y);s.state='goto'}else s.state='idle'}}}
function updHandy(s,dt){if(s.state==='idle'){let best=null,bd=1e9;const cons=(x,y,k,o)=>{const d=Math.hypot(x-s.x,y-s.y)+(k==='fix'?-80:0);if(d<bd){bd=d;best={k,o,x,y}}};
  for(const r of S.rooms)if(D.rooms[r.type].machine&&r.cond<70&&!S.staff.some(h=>h.task&&h.task.o===r.id)){const q=spotStaff(r);cons(q.x,q.y,'fix',r.id)};
  S.litter.forEach((l,i)=>{if(!S.staff.some(h=>h.task&&h.task.o===l))cons(Math.round(l.x),Math.round(l.y),'clean',l)});
  for(const it of S.items)if(it.type==='plant'&&it.water<50&&!S.staff.some(h=>h.task&&h.task.o===it))cons(it.x,it.y,'water',it);
  if(best&&goTo(s,best.x,best.y)){s.task=best;s.state='goto'}else{move(s,dt);if(!s.path.length&&Math.random()<.01){const x=ri(1,S.w-2),y=ri(1,S.h-2);if(walk(x,y)&&!roomAt(x,y))goTo(s,x,y)}}}
 else if(s.state==='goto'){if(move(s,dt)){s.state='do';s.t=s.task.k==='fix'?4:1.5}}
 else if(s.state==='do'){s.t-=dt*eff(s);if(s.t<=0){const k=s.task;if(k.k==='fix'){const r=S.rooms.find(r=>r.id===k.o);if(r)r.cond=100}else if(k.k==='clean')S.litter=S.litter.filter(l=>l!==k.o);else k.o.water=100;s.task=null;s.state='idle';s.fat=Math.min(100,s.fat+3)}}}

// ---------- Мировой цикл ----------
function update(dt){S.t+=dt;const nd=Math.floor(S.t/DAY);if(nd!==S.day){S.day=nd;onDay()}
 S.spawnT-=dt;if(S.spawnT<=0){S.spawnT=L().spawnEvery/(0.5+S.rep/1000)*rnd(.6,1.4);spawnPatient()}
 for(const it of S.items)if(it.type==='plant')it.water=Math.max(0,it.water-dt*0.15);
 S.pats.forEach(p=>updPatient(p,dt));S.pats=S.pats.filter(p=>!(p.state==='dead'&&p.t>3));S.staff.forEach(s=>updStaff(s,dt));for(const e of S.pats)tickVs(e,dt);for(const e of S.staff)tickVs(e,dt);tickDoors(dt);mechTick(dt);checkEnd()}
function onDay(){mechDay();v11Day();v11Day2();v12Day();if(S.litter.length>15)S.rep=Math.max(0,S.rep-2);
 if(S.day%MONTH_DAYS===0){const sal=S.staff.reduce((a,s)=>a+s.salary,0)+S.rooms.length*50;S.money-=sal;msg('📆 Новый месяц: зарплаты и содержание −$'+sal);Snd.pa();genCands();save(true)}}
function checkEnd(){if(S.won||S.lost)return;const g=L().goals,l=L().lose;
 if(S.cured>=g.cured&&netCash()>=g.money&&S.rep>=g.rep&&(!g.value||hospValue()>=g.value)){S.won=true;speed=0;Snd.win();const nx=S.lv+1<D.levels.length;markDone(S.lv);save(true);modal('<h2>🏆 Уровень пройден!</h2><p>Вылечено: '+S.cured+'. Баланс $'+S.money+'. Репутация '+Math.round(S.rep)+'. Потери: '+S.deaths+'.</p>'+(nx?'<button class="grn" onclick="startLevel('+(S.lv+1)+')">Следующий уровень ▶</button> ':'<p>Это последний уровень текущей версии!</p>')+'<button onclick="closeModal();setSpeed(1)">Продолжить играть</button> <button onclick="showLevels()">К выбору уровня</button>')}
 else if((S.bk||0)>=MONTH_DAYS*2||S.deaths>=l.deaths||S.rep<l.rep){S.lost=true;speed=0;localStorage.removeItem(slotKey(S.lv));Snd.bad();modal('<h2>😵 Вы уволены!</h2><p>'+((S.bk||0)>=MONTH_DAYS*2?'Больница обанкротилась: 2 месяца с долгом больше $10 000.':S.deaths>=l.deaths?'Слишком много смертей.':'Репутация упала ниже плинтуса.')+'</p><button onclick="startLevel('+S.lv+')">Начать заново</button> <button onclick="showLevels()">К выбору уровня</button>')}}
// ---------- Прогресс по уровням ----------
const PROG_KEY='hohotun_trial45_progress_v1';
function progress(){try{return JSON.parse(localStorage.getItem(PROG_KEY))||{done:[]}}catch(e){return{done:[]}}}
function markDone(i){const p=progress();if(!p.done.includes(i))p.done.push(i);localStorage.setItem(PROG_KEY,JSON.stringify(p))}
function unlocked(i){return i===0||progress().done.includes(i-1)}
function startLevel(i){closeModal();hidePanel();newGame(i);setSpeed(1)}
function showLevels(){const p=progress();let h='<h2>Выбор уровня</h2><div style="text-align:left">';D.levels.forEach((l,i)=>{const ok=unlocked(i),dn=p.done.includes(i);h+='<div class="row"><div><b>'+(dn?'✅ ':ok?'▶ ':'🔒 ')+l.id+'. '+l.name+'</b><br><small>'+l.w+'×'+l.h+' · вылечить '+l.goals.cured+' · $'+l.goals.money+' · реп. '+l.goals.rep+'</small></div><span>'+(ok&&localStorage.getItem(slotKey(i))?'<button class="grn" onclick="if(load('+i+')){closeModal();setSpeed(1)}">📂</button> ':'')+'<button '+(ok?'':'disabled')+' onclick="startLevel('+i+')">'+(localStorage.getItem(slotKey(i))?'Заново':'Играть')+'</button></span></div>'});
 h+='</div>';if(S)h+='<p><button onclick="closeModal();setSpeed(1)">Закрыть</button></p>';modal(h);setSpeed(0)}

// ---------- Сохранение ----------
function save(silent){if(S.lost){if(!silent)msg('Проигранную игру нельзя сохранить');return}try{localStorage.setItem(SAVE_KEY+'_last',S.lv);localStorage.setItem(slotKey(S.lv),JSON.stringify({S,v:1}));if(!silent)msg('💾 Игра сохранена')}catch(e){msg('Ошибка сохранения')}}
function sp_(tr){return tr.sp.patient}
function load(lv){const j=localStorage.getItem(slotKey(lv??lastLv()));if(!j){msg('Нет сохранения');return false}S=JSON.parse(j).S;if(!S.mt){const k=S;mechInit();}invBlk();S.rooms.forEach(r=>{if(!r.sp){const l=layout(r);r.it=l?l.items:[];r.sp=l?l.sp:{}}});S.pats.concat(S.staff).forEach(e=>{e.vs=null;e.path=[];e.wash=false;if(e.state==='queue'||e.state==='enter'||e.state==='treat'||e.state==='wc1'||e.state==='wc2'||e.state==='wc3'||e.state==='wc4'||e.state==='wcL'||e.state==='wcF'||e.state==='wcD'){e.oa=null;e.state='seek';e.room=null;e.wantSeat=null}});S.items.forEach(b=>{if(b.occ)b.occ=[0,0]});S.rooms.forEach(r=>{r.queue=[];r.busy=null});S.staff.forEach(s=>{if(s.state==='coffee'||s.state==='tocoffee')s.oa=null;if(s.state==='work'||s.state==='goto'||s.state==='torest'||s.state==='rest'||s.state==='coffee'||s.state==='tocoffee')s.state='goto',s.restKey=null;const r=S.rooms.find(r=>r.id===s.room);if(r&&s.type!=='handyman'){const p=spotStaff(r);goTo(s,p.x,p.y)}});
 // восстановить ссылки задач завхоза
 S.staff.forEach(s=>{if(s.type==='handyman'){s.task=null;s.state='idle'}});centerCam();msg('📂 Игра загружена');return true}

// ---------- Ввод (тач + мышь) ----------
const ptrs=new Map();let drag=null,pinch=null;
function initInput(){cv.addEventListener('pointerdown',e=>{Snd.unlock();cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){const w=toWorld(e.clientX,e.clientY),g=ui.ghost;drag={sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y,moved:false,ghost:g&&w.x>=g.x&&w.y>=g.y&&w.x<g.x+g.w&&w.y<g.y+g.h?{ox:w.x-g.x,oy:w.y-g.y}:null}}
  else if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.z,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};drag=null}});
 cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pinch&&ptrs.size===2){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y);zoomAt(pinch.mx,pinch.my,pinch.z*d/pinch.d)}
  else if(drag){const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;if(Math.hypot(dx,dy)>8)drag.moved=true;if(!drag.moved)return;
   if(drag.ghost){const w=toWorld(e.clientX,e.clientY);ui.ghost.x=Math.floor(w.x-drag.ghost.ox+.5);ui.ghost.y=Math.floor(w.y-drag.ghost.oy+.5)}else{cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z}}});
 const up=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(drag&&!drag.moved&&ptrs.size===0)tap(e.clientX,e.clientY);if(ptrs.size===0)drag=null};
 cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(e.clientX,e.clientY,cam.z*(e.deltaY<0?1.15:1/1.15))},{passive:false});
 addEventListener('resize',resize)}
function startRoom(type){ui.mode=null;const d=D.rooms[type];if(roomLocked(type)){msg('🔬 Сначала исследуйте «'+d.name+'»');Snd.bad();return}if(S.money<d.cost){msg('Недостаточно денег');return}hidePanel();const c=toWorld(innerWidth/2,innerHeight/2);
 ui.ghost={type,w:d.min[0]+2,h:d.min[1]+2,side:0,x:Math.floor(c.x)-2,y:Math.floor(c.y)-2};const b=$('build');b.style.display='flex';
 b.innerHTML='<button onclick="gsz(-1,0)">↔−</button><button onclick="gsz(1,0)">↔+</button><button onclick="gsz(0,-1)">↕−</button><button onclick="gsz(0,1)">↕+</button><button onclick="gdoor()">🚪 Дверь</button><button class="grn" onclick="gok()">✔ $'+d.cost+'</button><button class="red" onclick="gcancel()">✖</button>'}
function gsz(dw,dh){const g=ui.ghost,m=D.rooms[g.type].min;g.w=Math.max(m[0]+2,Math.min(12,g.w+dw));g.h=Math.max(m[1]+2,Math.min(12,g.h+dh));Snd.click()}
function gdoor(){ui.ghost.side=(ui.ghost.side+1)%4;Snd.click()}
function gcancel(){ui.ghost=null;$('build').style.display='none'}
function gok(){const g=ui.ghost,bad=roomLocked(g.type)?'не исследовано':validRoom(g);if(bad){msg('Нельзя: '+bad);Snd.bad();return}const d=D.rooms[g.type],cost=d.cost+(g.w*g.h-(d.min[0]+2)*(d.min[1]+2))*30;if(S.money<cost){msg('Недостаточно денег');return}
 S.money-=cost;{const nr=makeRoom(g.type,g.x,g.y,g.w,g.h,g.side);nr.cost=cost;S.rooms.push(nr)}Snd.build();msg('Построено: '+d.name+(d.staff?' — наймите: '+D.staff[d.staff].name:''));gcancel();
 for(const p of S.pats)if(p.state==='queue'||p.state==='seek')p.path=[]}
function placeItem(type,x,y){const d=D.items[type],fp=fpOf(type);for(const[tx,ty]of tilesOf(x,y,fp)){if(tx<0||ty<0||tx>=S.w||ty>=S.h-1||isHole(tx,ty)||roomAt(tx,ty)||blk().has(ty*S.w+tx)){msg('Сюда нельзя');Snd.bad();return}}
 if(S.money<d.cost){msg('Недостаточно денег');return}S.items.push({type,x,y,fp,water:100,occ:type==='bench'?[0,0]:undefined});invBlk();
 {let ok=true;for(const r of S.rooms){const o=doorOut(r);if(!path(S.ent.x,S.ent.y,o.x,o.y)&&!(o.x===S.ent.x&&o.y===S.ent.y))ok=false}if(!ok){S.items.pop();invBlk();msg('Это перекроет проход');Snd.bad();return}}S.money-=d.cost;Snd.build()}
function sellRoom(id){const r=S.rooms.find(r=>r.id===id);if(!r)return;for(const p of S.pats)if(p.room===r.id||p.wcRoom===r.id){clearSeat(p);unqueue(p);p.state='seek';const o=doorOut(r);p.x=o.x;p.y=o.y;p.path=[]}
 const s=S.staff.find(s=>s.id===r.staff);if(s){clearSeat(s);s.room=null;s.state='idle';const o=doorOut(r);s.x=o.x;s.y=o.y;s.path=[]}
 for(const s2 of S.staff)if(roomAt(Math.round(s2.x),Math.round(s2.y))===r){clearSeat(s2);const o=doorOut(r);s2.x=o.x;s2.y=o.y;s2.path=[];if(s2.state==='rest'||s2.state==='torest'||s2.state==='coffee'||s2.state==='tocoffee'){s2.oa=null;s2.state='idle'}}
 S.money+=Math.round((r.cost||D.rooms[r.type].cost)/2);S.rooms=S.rooms.filter(x=>x!==r);hidePanel();msg('Кабинет продан')}

// ---------- UI ----------
function msg(t){const m=$('msg'),d=document.createElement('div');d.textContent=t;m.prepend(d);while(m.children.length>3)m.lastChild.remove();setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),800)},5000)}
function panel(h){const p=$('panel');p.innerHTML=h+'<div style="text-align:right;margin-top:8px"><button onclick="hidePanel()">Закрыть</button></div>';p.style.display='block'}
function hidePanel(){$('panel').style.display='none';if(ui.mode&&ui.mode.item){}}
function modal(h){$('modalc').innerHTML=h;$('modal').style.display='flex';$('modalc').scrollTop=0}
function closeModal(){$('modal').style.display='none'}
function setSpeed(s){speed=s;document.querySelectorAll('#top [data-s]').forEach(b=>b.classList.toggle('on',+b.dataset.s===s))}
function showRooms(){ui.mode=null;let h='<h3>🏗 Построить кабинет</h3>';for(const k of L().rooms){const d=D.rooms[k],lk=roomLocked(k);if(lk){h+='<div class="row"><div><b>🔒 '+d.name+'</b><br><small>Исследование: '+Math.floor(S.rp)+'/'+lk+' очков (постройте Лабораторию исследований)</small></div></div>';continue}h+='<div class="row"><div><b>'+d.name+'</b> — $'+d.cost+'<br><small>'+d.desc+(d.staff?' Персонал: '+D.staff[d.staff].name:'')+'</small></div><button onclick="startRoom(\''+k+'\')" '+(S.money<d.cost?'disabled':'')+'>Строить</button></div>'}panel(h)}
function pickItem(k){ui.mode={item:k};hidePanel();const b=$('build');b.style.display='flex';b.innerHTML='<span style="align-self:center;background:rgba(15,25,32,.85);padding:8px;border-radius:8px">Нажимайте на пол: '+D.items[k].name+'</span><button onclick="showItems()">🪴 Другой</button><button class="red" onclick="itemDone()">✖ Готово</button>'}
function itemDone(){ui.mode=null;$('build').style.display='none'}
function showItems(){if(!ui.ghost)$('build').style.display='none';let h='<h3>🪴 Предметы для коридора</h3><small>Выберите предмет и нажимайте на пол коридора.</small>';for(const k in D.items){const d=D.items[k];h+='<div class="row"><div><b>'+d.name+'</b> — $'+d.cost+'</div><button class="'+(ui.mode&&ui.mode.item===k?'on':'')+'" onclick="pickItem(\''+k+'\')">Выбрать</button></div>'}
 h+='<div class="row"><span>Режим размещения</span><button class="red" onclick="itemDone();hidePanel()">Выйти</button></div>';panel(h)}
function showHire(){let h='<h3>👩‍⚕️ Наём персонала</h3>';for(const k in S.cands){h+='<h4 style="margin:8px 0 2px">'+D.staff[k].name+'</h4>';S.cands[k].forEach((c,i)=>{h+='<div class="row"><div>'+c.name+'<br><small>Навык '+c.skill+' · $'+c.salary+'/мес</small></div><button onclick="hire(\''+k+'\','+i+');showHire()">Нанять</button></div>'})}panel(h)}
function showStaff(){let h='<h3>👥 Персонал ('+S.staff.length+')</h3>';for(const s of S.staff.slice().sort((a,b)=>(!!a.room||a.type==='handyman')-(!!b.room||b.type==='handyman'))){const r=S.rooms.find(r=>r.id===s.room);h+='<div class="row"><div>'+D.staff[s.type].name+' '+s.name+'<br><small>Навык '+s.skill+' · $'+s.salary+' · Усталость '+Math.round(s.fat)+'% · '+(r?D.rooms[r.type].name:s.type==='handyman'?'обход':'⚠ БЕЗ КАБИНЕТА')+'</small></div><button class="red" onclick="fire('+s.id+');showStaff()">Уволить</button></div>'}panel(h)}
function showGoals(){const g=L().goals,l=L().lose,ok=(a,b)=>a>=b?'✅':'⬜';panel('<h3>🎯 Цели: '+L().name+'</h3><div class="row">'+ok(S.cured,g.cured)+' Вылечить пациентов<b>'+S.cured+'/'+g.cured+'</b></div><div class="row">'+ok(netCash(),g.money)+' Баланс'+(S.loan?' (за вычетом кредита)':'')+'<b>$'+netCash()+'/$'+g.money+'</b></div><div class="row">'+ok(S.rep,g.rep)+' Репутация<b>'+Math.round(S.rep)+'/'+g.rep+'</b></div>'
 +(g.value?'<div class="row">'+ok(hospValue(),g.value)+' Стоимость больницы<b>$'+hospValue()+'/$'+g.value+'</b></div>':'')+(S.loan?'<div class="row">Кредит<b>$'+S.loan+'</b></div>':'')+(S.em?'<div class="row">🚑 ЧП «'+D.dis[S.em.dis].name+'»<b>'+S.em.cured+'/'+S.em.n+' до дня '+(S.em.until+1)+'</b></div>':'')+(S.epi?'<div class="row">🦠 Заражённых<b>'+S.pats.filter(p=>p.inf).length+'</b></div>':'')+(L().locked?'<div class="row">🔬 Очки исследований<b>'+Math.floor(S.rp)+'</b></div>':'')+'<h4>Поражение если</h4><small>Баланс ниже −$10 000 два месяца подряд (сейчас '+(S.bk||0)+' дн.), смертей ≥ '+l.deaths+' (сейчас '+S.deaths+'), репутация ниже '+l.rep+'</small><h4>Статистика</h4><small>Пациентов в больнице: '+S.pats.length+'. Отправлено домой: '+S.sent+'. Ушли не дождавшись: '+((S.v18&&S.v18.left)||0)+'. Доход всего: $'+S.earn+'</small>')}
function showMenu(){panel('<h3>☰ Меню</h3>'+(L().loanMax?'<div class="row"><span>Банк / кредит</span><button onclick="showBank()">🏦</button></div>':'')+'<div class="row"><span>Лечить при шансе&nbsp;≥</span><span>'+[.4,.6,.75].map(v=>'<button class="'+(((S.minCh??.6)===v)?'on':'')+'" onclick="setMinCh('+v+')">'+v*100+'%</button>').join(' ')+'</span></div>'+'<div class="row"><span>Сохранить игру</span><button onclick="save();hidePanel()">💾</button></div><div class="row"><span>Загрузить</span><button onclick="load();hidePanel()">📂</button></div><div class="row"><span>Выбор уровня</span><button onclick="hidePanel();showLevels()">🗺</button></div><div class="row"><span>Звук</span><button onclick="this.textContent=Snd.toggle()?\'🔊\':\'🔇\'">🔊</button></div><div class="row"><span>Центрировать камеру</span><button onclick="centerCam()">🎯</button></div><small>Больница «Карачун» v1 — оригинальная игра, вдохновлённая жанром симуляторов больниц.</small>')}
function showSel(){const s=ui.sel;if(s.k==='room'){const r=S.rooms.find(r=>r.id===s.id);if(!r)return;const d=D.rooms[r.type],st=S.staff.find(x=>x.id===r.staff);
  panel('<h3>'+d.name+'</h3><small>'+d.desc+'</small><div class="row">Персонал<b>'+(d.staff?(st?st.name+' ('+st.skill+')':'нет — наймите '+D.staff[d.staff].name):'не нужен')+'</b></div><div class="row">Очередь<b>'+r.queue.length+'</b></div><div class="row">Размер / мест<b>'+(r.w-2)+'×'+(r.h-2)+' · '+(r.nS>1?['S','M','L'][r.nS-1]+' · '+r.nS+' места':['S','M','L'][rCap(r)-1]+(rCap(r)>1?' (комфорт ×'+(1+.3*(rCap(r)-1)).toFixed(1)+')':''))+'</b></div>'+(typeof v25Info==='function'?v25Info(r):'')+(d.machine?'<div class="row">Состояние аппарата<b>'+r.cond+'%</b></div>':'')+'<div class="row"><span>Продать (+$'+Math.round((r.cost||d.cost)/2)+')</span><button class="red" onclick="sellRoom('+r.id+')">Продать</button></div>')}
 else if(s.k==='pat'){const p=S.pats.find(p=>p.id===s.id);if(!p)return;const dz=D.dis[p.dis];panel('<h3>'+(p.vip?'🎩 VIP ':'🧍 ')+p.name+(p.emg?' 🚑':'')+'</h3>'+(typeof needOrgan==='function'&&needOrgan(p)&&p.known?'<div class="row"><span>'+ORG[needOrgan(p)][0]+' Нужен орган: '+ORG[needOrgan(p)][1]+(p.organ?' — есть ('+Math.round(p.organ.q*100)+'%)':' — ждёт донора')+'</span>'+(p.organ?'':'<button class="grn" onclick="buyOrgan('+p.id+')">Купить $'+ORGAN_PRICE+'</button>')+'</div>':'')+(p.inf?'<div class="row"><span>🦠 Заразен!</span><button class="grn" onclick="vacc('+p.id+')">💉 Вакцина $200</button></div>':'')+'<div class="row">Болезнь<b>'+(p.known?dz.name:'не определена')+'</b></div>'+(p.known?'<small>'+dz.desc+'</small>':'')+'<div class="row">Уверенность диагноза<b>'+Math.round(p.cert*100)+'%</b></div>'+(p.vip?'':'<div class="row">Шанс излечения<b style="color:'+(cureChance(p)<.6?'#f88':'#8f8')+'">'+Math.round(cureChance(p)*100)+'%</b></div><div class="row"><button class="grn" onclick="treatNow('+p.id+')">💊 Лечить сейчас</button><button onclick="moreDiag('+p.id+')">🔍 Дообследовать</button></div>')+'<div class="row">Здоровье<b>'+Math.round(p.health)+'%</b></div>'+(window.patRow?patRow(p):'<div class="row">Терпение<b>'+Math.round(p.pat)+'%</b></div>')+'<div class="row">Направлен в<b>'+(D.rooms[p.need]||{}).name+'</b></div><div class="row"><span>Отправить домой</span><button class="red" onclick="leavePat('+p.id+')">Домой</button></div>')}
 else{const st=S.staff.find(x=>x.id===s.id);if(!st)return;panel('<h3>'+D.staff[st.type].name+' '+st.name+'</h3><div class="row">Навык<b>'+st.skill+'</b></div><div class="row">Зарплата<b>$'+st.salary+'</b></div><div class="row">Усталость<b>'+Math.round(st.fat)+'%</b></div><div class="row"><span>Уволить</span><button class="red" onclick="fire('+st.id+');hidePanel()">Уволить</button></div>')}}
function leavePat(id){const p=S.pats.find(p=>p.id===id);if(p){if(p.inf&&S.epi){S.money-=1500;S.rep=Math.max(0,S.rep-8);msg('🦠 Заразного отправили домой: штраф −$1500');Snd.bad()}S.sent++;leave(p,'🏠',2)}hidePanel()}
function hud(){$('money').textContent='$'+S.money;$('money').style.color=S.money<0?'#f66':'#ffd24a';$('rep').textContent=Math.round(S.rep);const m=Math.floor(S.day/MONTH_DAYS);$('date').textContent='Мес '+(m+1)+', день '+(S.day%MONTH_DAYS+1);$('cured').textContent=S.cured+'/'+L().goals.cured;v11Hud()}

function resize(){const d=typeof gfxDpr==='function'?gfxDpr():(devicePixelRatio||1);cv.width=innerWidth*d;cv.height=innerHeight*d}
let last=performance.now(),hudT=0;
// PERF45: on 90/120 Hz screens draw at most ~60 frames per second (simulation is dt-based, so game speed is unchanged; halves CPU/GPU load and heat on phones).
let nextF45=0;function loop(now){if(now<nextF45-4){requestAnimationFrame(loop);return}nextF45=(now-nextF45>50?now:nextF45)+1000/60;const dt=Math.min(.1,(now-last)/1000);last=now;if(S&&speed>0){let t=dt*speed;while(t>0){const s=Math.min(t,.05);update(s);t-=s;if(t>1e-9&&window.__sub45)window.__sub45(s/speed)}}if(S){draw();hudT-=dt;if(hudT<=0){hud();hudT=.25}}requestAnimationFrame(loop)}
async function main(){cv=$('c');cx=cv.getContext('2d');resize();await loadData();await loadArt();await loadAnim();initInput();
 $('bRooms').onclick=showRooms;$('bItems').onclick=showItems;$('bHire').onclick=showHire;$('bStaff').onclick=showStaff;$('bGoals').onclick=showGoals;$('bMenu').onclick=showMenu;
 document.querySelectorAll('#top [data-s]').forEach(b=>b.onclick=()=>setSpeed(+b.dataset.s));
 migrateSave();newGame(0,true);if(lastLv()!=null&&localStorage.getItem(slotKey(lastLv())))load();showLevels();
 addEventListener('visibilitychange',()=>{if(document.hidden)save(true)});requestAnimationFrame(loop)}
main();

function vacc(id){const p=S.pats.find(p=>p.id===id);if(!p)return;if(S.money<200){msg('Недостаточно денег');return}S.money-=200;p.inf=false;p.immune=true;msg('💉 '+p.name+' вакцинирован(а)');hidePanel()}
