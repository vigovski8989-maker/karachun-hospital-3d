// v20: рендер нативных splash.png из #splash (рисованный фон + заголовок шрифтом игры)
const puppeteer=require('puppeteer-core');const fs=require('fs');
const R='android/app/src/main/res/',URL=process.env.URL||'http://localhost:8095/';
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();
 const dirs=['drawable',...fs.readdirSync(R).filter(d=>/^drawable-(port|land)-/.test(d))];
 for(const d of dirs){const {execSync}=require('child_process');const [w,h]=execSync(`python3 -c "from PIL import Image;print(*Image.open('${R}${d}/splash.png').size)"`).toString().trim().split(' ').map(Number);
  await p.setViewport({width:w,height:h,deviceScaleFactor:1});await p.goto(URL+'?splashonly',{waitUntil:'networkidle0'});await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(()=>{for(const e of document.body.children)if(e.id!=='splash')e.style.display='none';const s=document.getElementById('splash');s.className='';s.style.opacity=1;document.getElementById('splashL').style.display='none';const z=Math.min(innerWidth,innerHeight)/400;s.querySelector('h1').style.fontSize=Math.round(44*z)+'px'});
  await p.screenshot({path:R+d+'/splash.png'});console.log(d,w,h)}
 await b.close()})();
