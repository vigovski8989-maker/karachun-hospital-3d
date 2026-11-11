(async()=>{
eval(await (await fetch('/v38scen.js')).text());
await new Promise(r=>setTimeout(r,1200));
startLevel(0);await new Promise(r=>setTimeout(r,400));
__scen(['reception','gp','electro','psych','staffroom']);closeModal();setSpeed(0);
await new Promise(r=>setTimeout(r,400));
const info={};
for(const t of['gp','electro','psych','staffroom']){
  const r=S.rooms.find(x=>x.type===t);
  info[t]={room:[r.x,r.y,r.w,r.h],sp:r.sp,it:r.it.map(i=>({k:i.k,x:i.x,y:i.y,fp:i.fp,dir:i.dir}))};
}
return JSON.stringify(info);
})()
