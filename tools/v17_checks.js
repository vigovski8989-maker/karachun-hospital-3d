// v17: проверка подмены, навыков, главврача, рейтинга, платного терапевта + скриншоты
const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
const URL=process.env.URL||'http://localhost:8095/';const LI=+(process.env.LI||5),DAYS=+(process.env.DAYS||160);
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
await p.setViewport({width:412,height:860,deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());await p.reload({waitUntil:'networkidle0'});
await p.evaluate(li=>{closeModal();newGame(li);closeModal()},LI);
await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;botBuild();hire("handyman",0);return out'),PLAN);
const res=await p.evaluate(days=>{const st={coverMax:0,readMax:0,richSeen:new Set(),ranks:{}};const sk0=S.staff.reduce((a,s)=>a+s.skill,0)/S.staff.length;
 for(let i=0;i<2;i++)hire('doctor',0);
 while(S.day<days&&!S.won&&!S.lost){for(let i=0;i<40;i++)update(.05);const d=S.day;if(d!==st.ld){st.ld=d;botBuild();if(window.v12Bot)v12Bot();closeModal();hidePanel();st.ranks[myRank()]=(st.ranks[myRank()]||0)+1}
  st.coverMax=Math.max(st.coverMax,S.staff.filter(s=>s.cover&&s.room).length);st.readMax=Math.max(st.readMax,S.staff.filter(s=>s.state==='read').length);S.pats.forEach(p=>{if(p.rich)st.richSeen.add(p.id)})}
 const all=S.staff.concat(S.away.map(a=>a.s));
 return{day:S.day,won:S.won,lost:S.lost,rooms:S.rooms.map(r=>r.type).filter(t=>['library','chief','paygp'].includes(t)),chief:chiefOf()&&chiefOf().name,covers:S.v17.covers,coverMax:st.coverMax,readMax:st.readMax,readT:Math.round(S.v17.read),courses:S.v17.courses,specs:all.filter(s=>s.spec).length,
  skillAvg0:Math.round(sk0),skillAvg:Math.round(all.reduce((a,s)=>a+s.skill,0)/all.length),rich:st.richSeen.size,payIncome:S.v17.pay||0,rank:myRank(),ranks:st.ranks,rating:ranking().map(x=>x.name+':'+x.v).join(' | ')}},DAYS);
console.log(JSON.stringify(res,null,1));
const shot=async(n,fn)=>{await p.evaluate(fn);await new Promise(r=>setTimeout(r,700));await p.screenshot({path:'screenshots/v17_'+n+'.png'})};
const focus=t=>`(()=>{closeModal();hidePanel();setSpeed(1);const r=S.rooms.find(r=>r.type==='${t}');if(!r)return;const q=iso(r.x+r.w/2,r.y+r.h/2);cam.z=2.4;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight*0.3/cam.z;ui.sel={k:'room',id:r.id};showSel()})()`;
await shot('library',focus('library'));await shot('chief',focus('chief'));await shot('paygp',focus('paygp'));
await shot('staff_card','(()=>{hidePanel();showStaff()})()');
await shot('rating','(()=>{hidePanel();showRank()})()');
await shot('cover',`(()=>{hidePanel();const s=S.staff.find(s=>s.cover&&s.room);if(s){const r=S.rooms.find(r=>r.id===s.room);const q=iso(r.x+r.w/2,r.y+r.h/2);cam.z=2.4;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight*0.3/cam.z;ui.sel={k:'room',id:r.id};showSel()}else showStaff()})()`);
await shot('spec',`(()=>{hidePanel();const s=S.staff.find(s=>s.type==='doctor'&&!s.spec&&s.skill>=50);if(s)showSpec(s.id)})()`);
await shot('build_menu','(()=>{hidePanel();showRooms();document.getElementById("panel").scrollTop=1e5})()');
console.log('errors',JSON.stringify(errs));await b.close();process.exit(errs.length?1:0)})();
