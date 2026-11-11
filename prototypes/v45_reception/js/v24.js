// v24: размеры кабинетов S/M/L, стоимость по площади, реальная вместимость (пропускная способность)
function v24MinA(type){const m=D.rooms[type].min;return(m[0]+2)*(m[1]+2)}
function v24Rat(type,w,h){return w*h/v24MinA(type)}
function v24Cap(type,w,h){const k=v24Rat(type,w,h);return k>=2?3:k>=1.4?2:1}
function v24Cost(type,w,h){const d=D.rooms[type],k=v24Rat(type,w,h);return Math.round(d.cost*(1+.75*(k-1))/50)*50}
function rCap(r){return r?(r.cap||v24Cap(r.type,r.w,r.h)):1}
function v24Spd(c){return 1+.3*(c-1)}
const V24SZ=['S','M','L'];
function v24Lbl(){const g=ui.ghost;if(!g)return;const c=v24Cap(g.type,g.w,g.h),e=document.getElementById('v24ok');if(e)e.textContent='✔ $'+v24Cost(g.type,g.w,g.h);const i=document.getElementById('v24inf');if(i)i.textContent=(g.w-2)+'×'+(g.h-2)+' '+V24SZ[c-1]+(c>1?' ⚡×'+v24Spd(c).toFixed(1):'')}
function v24Pre(n){const g=ui.ghost;if(!g)return;const m=D.rooms[g.type].min,a=[[0,0],[1,1],[2,2]][n];g.w=Math.min(12,m[0]+2+a[0]);g.h=Math.min(12,m[1]+2+a[1]);if(n===2){let s=0;while(v24Cap(g.type,g.w,g.h)<3&&s++<6){if(g.w<=g.h)g.w=Math.min(12,g.w+1);else g.h=Math.min(12,g.h+1)}}if(n===1){let s=0;while(v24Cap(g.type,g.w,g.h)<2&&s++<6)g.w=Math.min(12,g.w+1)}Snd.click();v24Lbl()}
(function(){
 const _sb=startRoom;startRoom=function(type){_sb.apply(this,arguments);const b=$('build');if(!ui.ghost||!b)return;
  b.innerHTML='<span id="v24inf" class="v24inf"></span><button onclick="v24Pre(0)">S</button><button onclick="v24Pre(1)">M</button><button onclick="v24Pre(2)">L</button><button onclick="gsz(-1,0)">↔−</button><button onclick="gsz(1,0)">↔+</button><button onclick="gsz(0,-1)">↕−</button><button onclick="gsz(0,1)">↕+</button><button onclick="gdoor()">🚪</button><button class="grn" id="v24ok" onclick="gok()"></button><button class="red" onclick="gcancel()">✖</button>';v24Lbl()};
 const _gsz=gsz;gsz=function(){_gsz.apply(this,arguments);v24Lbl()};
 gok=function(){const g=ui.ghost,bad=roomLocked(g.type)?'не исследовано':validRoom(g);if(bad){msg('Нельзя: '+bad);Snd.bad();return}const d=D.rooms[g.type],cost=v24Cost(g.type,g.w,g.h);if(S.money<cost){msg('Недостаточно денег');return}
  S.money-=cost;{const nr=makeRoom(g.type,g.x,g.y,g.w,g.h,g.side);nr.cost=cost;nr.cap=v24Cap(g.type,g.w,g.h);S.rooms.push(nr)}Snd.build();msg('Построено: '+d.name+(d.staff?' — наймите: '+D.staff[d.staff].name:''));gcancel();
  for(const p of S.pats)if(p.state==='queue'||p.state==='seek')p.path=[]};
 const _rd=r_dur;r_dur=function(p){const r=S.rooms.find(x=>x.id===p.room);return _rd(p)/v24Spd(rCap(r))};
})();
// v24: дверь в режиме среза. Передняя — чистый порог без «грязи»; задняя створка гаснет вместе со стеной.
(function(){
 delete SPR['doorfront'];
 doorFrontSpr=function(){const key='doorfront24';if(SPR[key])return SPR[key];const c=mkS(64,40),g=c.g,P=L2(32,6);
  poly(g,[P(.1,.1),P(.9,.1),P(.9,.9),P(.1,.9)],'rgba(70,45,25,.55)');poly(g,[P(.14,.14),P(.86,.14),P(.86,.86),P(.14,.86)],'#a7764a');poly(g,[P(.22,.22),P(.78,.22),P(.78,.78),P(.22,.78)],'#7c8b5f');
  g.strokeStyle='rgba(255,255,255,.18)';g.lineWidth=1;g.beginPath();for(let i=1;i<4;i++){const a=P(.22+i*.14,.22),b=P(.22+i*.14,.78);g.moveTo(a.x,a.y);g.lineTo(b.x,b.y)}g.stroke();return SPR[key]=c};
 const _dl=drawLeaf;drawLeaf=function(g,r){let a=1;if(r.side>=2&&typeof v19Cut==='function'){const p=iso(r.door.x,r.door.y);a=v19Cut({},p,90)}if(a<1){g.save();g.globalAlpha=a;_dl(g,r);g.restore()}else _dl(g,r)};
})();
