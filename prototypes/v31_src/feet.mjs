import {createRequire} from 'module';const puppeteer=createRequire('/workspace/hospital-game/x.js')('puppeteer-core');import fs from 'fs';
const [base,dir,tag,t='3',zm='9']=process.argv.slice(2);fs.mkdirSync(dir,{recursive:true});
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();await p.setViewport({width:400,height:400});await p.setCacheEnabled(false);p.on('pageerror',e=>console.log('[err]',e.stack));
await p.goto(base+'?cap&full');await p.waitForFunction('window.__ready',{timeout:120000});
await p.evaluate(n=>__step(1/30,n),Math.round(+t*30));
for(const n of await p.evaluate(()=>Object.keys(__C)))for(const [k,az] of [['a',Math.PI/4-.5],['b',Math.PI/4+.7]]){await p.evaluate((n,az,zm)=>{__cam(n,az,.08,+zm);const c=__C[n];const f=c.b.foot_l.getWorldPosition(new c.b.foot_l.position.constructor());window.__tg(f.y+.05)},n,az,zm);await p.screenshot({path:`${dir}/${tag}_${n}_t${t}_${k}.jpg`,type:'jpeg',quality:80})}
await b.close();
