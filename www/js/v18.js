// v18: терпение пациентов и уход «не дождавшись», влияние рейтинга, перераспределение очередей
const PAT_RANK=[0.8,0.9,1,1.12,1.25];
function v18Init(){if(!S.v18)S.v18={left:0,lost:0,moved:0}}
function patFactors(p,c){const r=S.rooms.find(r=>r.id===p.room);const pos=r?Math.max(0,r.queue.indexOf(p.id)):0;
 const q=1+Math.min(0.6,Math.max(0,pos-3)*0.06);const t=1+Math.min(0.5,(p.wt||0)/300);
 const soda=S.items.some(i=>i.type==='soda'&&Math.abs(i.x-p.x)+Math.abs(i.y-p.y)<=5)?0.85:1;
 if(S.v18.rd!==S.day){S.v18.rd=S.day;S.v18.rk=typeof myRank==='function'?myRank():3}const rk=PAT_RANK[S.v18.rk-1]||1;return{c:Math.max(0.33,1-c/12),q,t,soda,rk}}
function patRate(p,c,dt){v18Init();p.wt=(p.wt||0)+(dt||0.05);const f=patFactors(p,c);p._pf=f;
 if(f.soda<1&&!p.drank&&p.pat<60&&Math.random()<0.004){p.drank=true;p.pat=Math.min(100,p.pat+15);p.thought='🥤';S.money+=15;S.earn+=15}
 return 0.35*f.c*f.q*f.t*f.soda*f.rk}
function patLeave(p){v18Init();const fee=(D.dis[p.dis]||{}).fee||0;S.v18.left++;S.v18.lost+=fee;p.angry=true;msg('😠 '+p.name+' ушёл(ла), не дождавшись — упущено $'+fee+', репутация −3');leave(p,'😠',3);Snd.bad()}
function patRow(p){const v=Math.max(0,Math.round(p.pat)),col=v>60?'#4c4':v>30?'#db3':'#e44',f=p._pf;
 let h='<div class="row">Терпение<b style="color:'+col+'">'+v+'%</b></div><div style="height:6px;background:#333;border-radius:3px;margin:2px 0 4px"><div style="height:6px;width:'+v+'%;background:'+col+';border-radius:3px"></div></div>';
 if(f)h+='<small>Уют ×'+f.c.toFixed(2)+' (лавки, растения, батареи, туалет) · Очередь ×'+f.q.toFixed(2)+' · Ожидание ×'+f.t.toFixed(2)+(f.soda<1?' · 🥤 автомат рядом':'')+' · Рейтинг ×'+f.rk.toFixed(2)+'</small>';return h}
// пациенты в очереди к кабинету, где врач отдыхает/отсутствует, переходят в такую же комнату с меньшей очередью
function v18Rebalance(){for(const r of S.rooms){if(r.queue.length<4)continue;const s=S.staff.find(s=>s.id===r.staff);if(s&&s.state==='work')continue;
 const alt=S.rooms.filter(o=>o!==r&&o.type===r.type&&o.queue.length+3<r.queue.length&&S.staff.some(x=>x.id===o.staff&&x.state==='work'));if(!alt.length)continue;const o=alt.sort((a,b)=>a.queue.length-b.queue.length)[0];
 const pid=r.queue[r.queue.length-1],p=S.pats.find(x=>x.id===pid);if(!p||p.state!=='queue'||p.vs)continue;unqueue(p);p.state='seek';S.v18.moved++}}
const _upd18=update;update=function(dt){_upd18(dt);if(!S||!S.rooms)return;v18Init();S.v18.rt=(S.v18.rt||0)+dt;if(S.v18.rt>1){S.v18.rt=0;v18Rebalance()}};
const _hud18=v11Hud;v11Hud=function(){_hud18();const el=$('chips');if(!el||!S)return;v18Init();const o=document.getElementById('chip18');if(o)o.remove();if(S.v18.left)el.insertAdjacentHTML('beforeend','<i id="chip18" class="chip" style="background:#8a3a2a" title="Ушли не дождавшись">😠 '+S.v18.left+'</i>')};
const _goals18=showGoals;showGoals=function(){_goals18();v18Init();const p=$('panel');p.lastElementChild.insertAdjacentHTML('beforebegin','<div class="row"><span>😠 Ушли не дождавшись</span><b>'+S.v18.left+' (−$'+S.v18.lost+')</b></div><small>Терпение падает от длинных очередей и долгого ожидания; лавки, растения, батареи, автомат с напитками и высокий рейтинг его сохраняют.</small>')};
// длинные очереди к терапевту отпугивают новых пациентов (слухи), это снижает приток
function crowdK(){const gs=S.rooms.filter(r=>r.type==='gp'||r.type==='reception');if(!gs.length)return 1;const q=Math.max(...gs.map(r=>r.queue.length));if(q<8)return 1;v18Init();if(!S.v18.crowdMsg){S.v18.crowdMsg=1;msg('🗣 Длинные очереди отпугивают новых пациентов — постройте ещё кабинет')}return Math.max(0.7,1-(q-7)*0.06)}
