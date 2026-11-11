const pp=require('puppeteer-core');
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());
const r=await p.evaluate(()=>{const o={};closeModal();newGame(5);closeModal();
 S.money=1000;S.loan=0;S.loan+=60000;S.money+=60000;o.loanGoal={money:S.money,net:netCash()};
 S.money=-20000;for(let d=0;d<39;d++)onDay();o.bankrupt39={bk:S.bk,lost:!!S.lost};onDay();checkEnd();o.bankrupt40={lost:!!S.lost};closeModal();
 o.lostSlot=localStorage.getItem(slotKey(5));save(true);o.savedAfterLost=!!localStorage.getItem(slotKey(5));
 newGame(5);closeModal();S.money=100000;startRoom('inflate');o.lockedBlocked=!ui.ghost;gcancel&&gcancel();
 for(let i=0;i<3000;i++)update(.05);closeModal();const pt=S.pats.find(p=>p.state!=='dead'&&p.state!=='leave');if(pt){pt.inf=true;S.epi={until:S.day+5,dis:pt.dis};const m=S.money;leavePat(pt.id);o.sendHomeInfectedFine=m-S.money}
 const q=S.pats.find(p=>p.state!=='dead'&&p.state!=='leave');if(q){q.inf=true;vacc(q.id);q.inf=false;let hit=0;for(const z of S.pats)if(z!==q&&z.inf){}o.vaccImmune=!!q.immune}
 botBuildX=0;const r0={id:-1};S.rooms.push(Object.assign(makeRoom('gp',2,2,4,4,0),{id:-1,cost:9000}));if(r0){r0.cost=9000;const m=S.money;sellRoom(r0.id);o.sellRefund=S.money-m}
 save(true);o.slots=[0,1,2,3,4,5].filter(i=>localStorage.getItem(slotKey(i)));return o});
console.log(JSON.stringify(r),JSON.stringify(errs));await b.close()})();
