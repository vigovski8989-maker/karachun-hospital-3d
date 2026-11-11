// v19: одинаковые сцены до/после (детерминированный PRNG) + замер FPS 360x800 c троттлингом CPU
// env: URL, TAG (префикс файлов), Q (качество графики low/medium/high, если поддерживается), FPS=1
const pp=require('puppeteer-core');const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../smoke.test.js','utf8');const PLAN=eval(src.match(/const PLAN=(\[.*\]);/)[1]);
const BOT=src.slice(src.indexOf('window.__PLAN=PLAN;'),src.indexOf("return out},PLAN);"));
const URL=process.env.URL||'http://localhost:8095/',TAG=process.env.TAG||'v19',Q=process.env.Q||'';
const seed=`(()=>{let s=12345;Math.random=()=>{s=(s*1103515245+12345)&0x7fffffff;return s/0x7fffffff}})();`;
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-gpu-rasterization','--ignore-gpu-blocklist']});
const errs=[];const out={};
async function scene(vp){const p=await b.newPage();await p.setViewport(vp);p.on('pageerror',e=>errs.push(e.message));await p.evaluateOnNewDocument(seed);
 await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(q=>{localStorage.clear();if(q)localStorage.setItem('karachun_gfx',q)},Q);await p.reload({waitUntil:'networkidle0'});
 await p.evaluate(()=>{closeModal();newGame(0);closeModal()});
 await p.evaluate(new Function('PLAN',BOT+'window.botBuild=botBuild;botBuild();hire("handyman",0);return out'),PLAN);
 await p.evaluate(()=>{while(S.day<45){for(let i=0;i<40;i++)update(.05);if(S.day!==S._ld){S._ld=S.day;botBuild();closeModal();hidePanel()}}closeModal();hidePanel()});return p}
const p=await scene({width:1280,height:800,deviceScaleFactor:1});
const shot=async(n,fn)=>{await p.evaluate(fn);await new Promise(r=>setTimeout(r,600));await p.screenshot({path:'screenshots/'+TAG+'_'+n+'.png'})};
await p.evaluate(()=>setSpeed(0));
await shot('L1_whole',`(()=>{const a=iso(0,0),c=iso(S.w,S.h),l=iso(0,S.h),r=iso(S.w,0);const W=r.x-l.x+60,H=c.y-a.y+120;cam.z=Math.min(innerWidth/W,innerHeight/H);cam.x=(l.x+r.x)/2-innerWidth/2/cam.z;cam.y=(a.y+c.y)/2-innerHeight/2/cam.z-20})()`);
await shot('room_gp',`(()=>{const r=S.rooms.find(r=>r.type==='gp');const q=iso(r.x+r.w/2,r.y+r.h/2);cam.z=3;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z-20})()`);
await shot('characters',`(()=>{const r=S.rooms.find(r=>r.type==='reception');const q=iso(r.x+r.w/2,r.y+r.h/2+1);cam.z=4.2;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z-30})()`);
if(process.env.PAINT){for(const [i,z] of [[0,3.6],[1,3.6],[2,2.4]])await shot('paintings'+i,`(()=>{const L=[];for(const r of S.rooms)for(let x=r.x;x<r.x+r.w;x++)for(let y=r.y;y<r.y+r.h;y++){const T=y===r.y,Lf=x===r.x;if((T||Lf)&&!(T&&Lf)&&(x+y)%3!==0&&(x*7+y)%5===0)L.push([x,y,r.type])}const t=L[${i}*3%L.length];window._pt=L.length;const q=iso(t[0]+.5,t[1]+.5);cam.z=${z};cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z-40})()`)}
await p.close();
if(process.env.FPS){const p2=await scene({width:360,height:800,deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const cdp=await p2.target().createCDPSession();
 for(const thr of[1,4]){await cdp.send('Emulation.setCPUThrottlingRate',{rate:thr});
  const r=await p2.evaluate(()=>new Promise(res=>{setSpeed(1);const q=iso(S.w/2,S.h/2);cam.z=1.6;cam.x=q.x-innerWidth/2/cam.z;cam.y=q.y-innerHeight/2/cam.z;let n=0,t0=0,ts=[];function f(t){if(!t0)t0=t;ts.push(t);n++;if(t-t0<6000)requestAnimationFrame(f);else{const d=[];for(let i=1;i<ts.length;i++)d.push(ts[i]-ts[i-1]);d.sort((a,b)=>a-b);res({fps:+(n/((t-t0)/1000)).toFixed(1),p95ms:+d[Math.floor(d.length*.95)].toFixed(1),q:typeof GFX!=='undefined'?GFX.q:'n/a',dpr:devicePixelRatio,cw:cv.width})}}requestAnimationFrame(f)}));
  out['fps_cpu'+thr+'x']=r}
 await p2.close()}
console.log(JSON.stringify({out,errs}));await b.close()})();
