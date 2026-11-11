// Сравнение масштаба мебели с персонажем прямо игровым рендером: node tools/scale_game.js out.png
const pp=require('puppeteer-core');(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const p=await b.newPage();await p.setViewport({width:1800,height:300});
p.on('pageerror',e=>console.log('ERR',e.message));await p.goto('http://localhost:8090/',{waitUntil:'networkidle0'});
const r=await p.evaluate(()=>{const ks=['wc','sink','recdesk','desk','cabinet','scanner','tubes','shelf','bed','bench','sofa','plant','radiator','bin','soda','coffee','pumpmachine','chair_plain'];
 const c=document.createElement('canvas');c.width=1800;c.height=300;const g=c.getContext('2d');g.fillStyle='#eef';g.fillRect(0,0,1800,300);g.save();g.scale(2,2);
 const PX=45.25;let out=[];ks.forEach((k,n)=>{const x0=25+n*49,yb=130;const p0=iso(0,0);g.save();g.translate(x0,yb);
  for(const h of[.45,.85,1.1,1.75]){g.strokeStyle=h==1.75?'#c66':'#bbc';g.lineWidth=.5;g.beginPath();g.moveTo(-24,-h*PX);g.lineTo(24,-h*PX);g.stroke()}
  const fp=fpOf(k)||[1,1];const c0=iso(fp[0]/2,fp[1]/2);g.translate(-c0.x,-c0.y-(fp[0]+fp[1]-2)*0);
  drawFurn(g,{k,x:0,y:0,dir:1,fp});g.restore();
  g.save();g.translate(x0+14,yb+1);aDraw(g,'doctor','idle',1,0,0,0);g.restore();g.fillStyle='#000';g.font='5px sans-serif';g.fillText(k,x0-20,yb+12)});
 g.restore();document.body.innerHTML='';document.body.appendChild(c);return 1});
await p.screenshot({path:process.argv[2]||'/tmp/scale.png'});await b.close()})();
