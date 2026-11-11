import {createRequire} from 'module';const puppeteer=createRequire('/workspace/hospital-game/x.js')('puppeteer-core');import fs from 'fs';
const [base,dir,tag,ts='10',names='doc,pa,rec,psy,rock,big']=process.argv.slice(2);fs.mkdirSync(dir,{recursive:true});
const b=await puppeteer.launch({protocolTimeout:0,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();await p.setViewport({width:420,height:420});await p.setCacheEnabled(false);p.on('pageerror',e=>console.log('[err]',e.message));
await p.goto(base+'?cap&full');await p.evaluate(()=>window.__NEAR=1.1);await p.waitForFunction('window.__ready',{timeout:120000});let T=0;
for(const t of ts.split(',').map(Number)){await p.evaluate(n=>__step(1/30,n),Math.round((t-T)*30));T=t;
for(const n of names.split(','))for(const [k,da,el] of [['s',Math.PI/2,.12],['f',.5,.2],['l',-.6,.02]]){await p.evaluate((n,da,el)=>{const c=__C[n];__cam(n,-c.root.rotation.y+da,el,7);const f=c.b.calf_l.getWorldPosition(c.b.Head.position.clone());window.__tg(f.y)},n,da,el);await p.screenshot({path:`${dir}/${tag}_${n}_t${t}_${k}.jpg`,type:'jpeg',quality:85})}}
await b.close();
