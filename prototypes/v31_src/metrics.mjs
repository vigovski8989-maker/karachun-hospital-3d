import {createRequire} from 'module';const puppeteer=createRequire('/workspace/hospital-game/x.js')('puppeteer-core');
const [url]=process.argv.slice(2);
const b=await puppeteer.launch({protocolTimeout:0,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();await p.setCacheEnabled(false);p.on('pageerror',e=>console.log('[err]',e.stack));p.on('console',m=>/rror/.test(m.text())&&console.log(m.text()));
await p.goto(url);await p.waitForFunction('window.__ready',{timeout:120000});
const r=await p.evaluate(()=>{const R={};const prev={};
 for(let f=0;f<40*30;f+=3){__step(1/30,3);
  for(const n in __C){const c=__C[n],o=R[n]||(R[n]={sink:0,float:0,slide:0,ns:0,sitgap:[],kneeBack:0,st:{}});o.st[c.cur]=1;
   const fy=s=>{const a=c.b['foot_'+s].getWorldPosition(c.b.Head.position.clone()).y-c.fh,bl=c.b['ball_'+s].getWorldPosition(c.b.Head.position.clone()).y-c.bh;return Math.min(a,bl)};
   const m=Math.min(fy('l'),fy('r'));const sit=/Sitting/.test(c.cur);
   if(!sit&&!/Jump|Dance/.test(c.cur)){if(m<-.025)o.sink++;if(m>.04)o.float++}
   if(sit){const p=c.b.thigh_l.getWorldPosition(c.b.Head.position.clone()).y;o.sitgap.push(+(p-(c.seatTop?.()??0)).toFixed(2))}
   // скольжение: опорная стопа (ниже 2 см) горизонтально, м/с
   for(const s of['l','r']){const w=c.b['ball_'+s].getWorldPosition(c.b.Head.position.clone());const k=n+s;if(prev[k]&&fy(s)<.02&&prev[k].low){const d=Math.hypot(w.x-prev[k].x,w.z-prev[k].z)/.1;if(d>.25)o.slide++;o.ns++}prev[k]={x:w.x,z:w.z,low:fy(s)<.02}
    // колено назад: угол между (бедро→колено) и (колено→стопа) в плоскости вперёд
    const H=c.b['thigh_'+s].getWorldPosition(c.b.Head.position.clone()),K=c.b['calf_'+s].getWorldPosition(c.b.Head.position.clone()),F=c.b['foot_'+s].getWorldPosition(c.b.Head.position.clone());
    const fw=[Math.sin(c.root.rotation.y),Math.cos(c.root.rotation.y)];const mid=[(H.x+F.x)/2,(H.z+F.z)/2];const kd=(K.x-mid[0])*fw[0]+(K.z-mid[1])*fw[1];const bend=K.distanceTo(H)+F.distanceTo(K)-F.distanceTo(H);if(bend>.03&&kd<-.03&&!sit)o.kneeBack++}
 }}
 for(const n in R){const o=R[n];o.st=Object.keys(o.st).join(',');const g=o.sitgap.sort((a,b)=>a-b);o.sitgap=g.length?[g[0],g[g.length>>1],g[g.length-1]]:'-'}return R});
for(const n in r)console.log(n.padEnd(5),JSON.stringify(r[n]));await b.close();
