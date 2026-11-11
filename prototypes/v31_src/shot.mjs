// node shot.mjs url out.png T [w h]  — шаг сценария детерминированно до T, скриншот
import {createRequire} from 'module';const puppeteer=createRequire('/workspace/hospital-game/x.js')('puppeteer-core');
const [url,out,TT,w=1280,h=720]=process.argv.slice(2);
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage();await p.setViewport({width:+w,height:+h});
p.on('console',m=>{if(m.type()!=='log'||/warn|err/i.test(m.text()))console.log('[pg]',m.type(),m.text())});p.on('pageerror',e=>console.log('[err]',e.stack));p.on('response',r=>{if(r.status()>=400)console.log('[404]',r.url())});
await p.goto(url);await p.waitForFunction('window.__ready',{timeout:+(process.env.TO||120000)});
const n=Math.round(+TT*30);await p.evaluate(n=>{for(let i=0;i<n;i+=30)window.__step(1/30,Math.min(30,n-i))},n);
await p.screenshot({path:out});console.log('info',JSON.stringify(await p.evaluate(()=>window.__info())));await b.close();
