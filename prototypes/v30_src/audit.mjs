// node audit.mjs base outdir tag times(comma) — крупные планы ног всех персонажей, 2 ракурса
import {createRequire} from 'module';const puppeteer=createRequire('/workspace/hospital-game/x.js')('puppeteer-core');import fs from 'fs';
const [base,dir,tag,times='3,10,20,30']=process.argv.slice(2);fs.mkdirSync(dir,{recursive:true});
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();await p.setViewport({width:480,height:480});await p.setCacheEnabled(false);p.on('pageerror',e=>console.log('[err]',e.stack));
await p.goto(base+'?cap&full');await p.waitForFunction('window.__ready',{timeout:120000});
const names=await p.evaluate(()=>Object.keys(__C));let T=0;
for(const t of times.split(',').map(Number)){await p.evaluate(n=>__step(1/30,n),Math.round((t-T)*30));T=t;
 for(const n of names)for(const [k,az,el] of [['a',Math.PI/4-.5,.3],['b',Math.PI/4+.7,.1]]){await p.evaluate((n,az,el)=>__cam(n,az,el,4.2),n,az,el);await p.screenshot({path:`${dir}/${tag}_${n}_t${t}_${k}.jpg`,type:'jpeg',quality:80})}}
await b.close();console.log('ok');
