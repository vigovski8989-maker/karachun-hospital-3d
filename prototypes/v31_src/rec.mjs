import {createRequire} from 'module';const puppeteer=createRequire('/workspace/hospital-game/x.js')('puppeteer-core');import fs from 'fs';
const [url,dir,N]=process.argv.slice(2);fs.mkdirSync(dir,{recursive:true});
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();await p.setViewport({width:1280,height:720});await p.setCacheEnabled(false);p.on('pageerror',e=>console.log('[err]',e.stack));
await p.goto(url);await p.waitForFunction('window.__ready',{timeout:120000});
for(let i=0;i<+N;i++){await p.evaluate(()=>window.__step(1/30,1));await p.screenshot({path:`${dir}/f${String(i).padStart(5,'0')}.jpg`,type:'jpeg',quality:92});if(i%150==0)console.log(i,new Date().toISOString())}
await b.close();console.log('done');
