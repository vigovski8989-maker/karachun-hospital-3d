// Автотест: постройка кабинета/предмета реальными тач-событиями (CDP Input.dispatchTouchEvent)
const pp=require('puppeteer-core');const W=ms=>new Promise(r=>setTimeout(r,ms));
const URL=process.env.URL||'http://localhost:8095/';
const VP=(process.env.VP||'320x568,360x640,360x800,393x851,412x915,800x360,915x412,568x320').split(',').map(s=>s.split('x').map(Number));
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const res=[];let fail=0;
for(const [w,h] of VP){const p=await b.newPage();await p.setViewport({width:w,height:h,deviceScaleFactor:2.6,isMobile:true,hasTouch:true});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(()=>{localStorage.clear()});await p.reload({waitUntil:'networkidle0'});
 const T=async sel=>{const q=await p.evaluate(s=>{const e=[...document.querySelectorAll(s.q)].find(e=>!s.t||e.textContent.includes(s.t));if(!e)return null;e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},sel);if(!q)throw new Error('no '+JSON.stringify(sel));await p.touchscreen.tap(q.x,q.y);await W(250)};
 const r={vp:w+'x'+h};
 try{
  await p.evaluate(()=>showLevels());await W(200);await T({q:'#modalc button',t:'Играть'});await W(400);
  await p.evaluate(()=>{closeModal();setSpeed(0)});await W(200);
  const r0=await p.evaluate(()=>S.rooms.length);
  await T({q:'#bar button',t:'Кабинеты'});await T({q:'#panel button',t:'Строить'});
  const g0=await p.evaluate(()=>({...ui.ghost}));
  // тап по карте — призрак переезжает
  await p.touchscreen.tap(w*0.3,h*0.4);await W(200);const g1=await p.evaluate(()=>({...ui.ghost}));r.tapMoves=g1.x!==g0.x||g1.y!==g0.y;
  // перетаскивание призрака пальцем
  const c=await p.evaluate(()=>{const g=ui.ghost,s=iso(g.x+g.w/2,g.y+g.h/2);return{x:(s.x-cam.x)*cam.z,y:(s.y-cam.y)*cam.z}});
  await p.touchscreen.touchStart(c.x,c.y);for(let i=1;i<=8;i++){await p.touchscreen.touchMove(c.x+i*6,c.y+i*4);await W(16)}await p.touchscreen.touchEnd();await W(200);
  const g2=await p.evaluate(()=>({...ui.ghost}));r.dragMoves=g2.x!==g1.x||g2.y!==g1.y;
  // найти валидное место и подтвердить тачем
  await p.evaluate(()=>{const g=ui.ghost;for(let y=1;y<S.h-g.h-1;y++)for(let x=1;x<S.w-g.w-1;x++){g.x=x;g.y=y;if(!validRoom(g))return}});
  r.hit0=await p.evaluate(()=>{const e=document.querySelector('#build .grn'),q=e.getBoundingClientRect();const t=document.elementFromPoint(q.x+q.width/2,q.y+q.height/2);return [Math.round(q.y),t&&t.outerHTML.slice(0,50),getComputedStyle(document.getElementById('build')).display]});await T({q:'#build button',t:'✔'});r.roomBuilt=(await p.evaluate(()=>S.rooms.length))>r0;if(!r.roomBuilt)r.why=await p.evaluate(()=>[document.getElementById('msg').textContent,JSON.stringify(ui.ghost)]);
  // предмет
  const i0=await p.evaluate(()=>S.items.length);await T({q:'#bar button',t:'Предметы'});await T({q:'#panel button',t:'Выбрать'});
  const panelH=await p.evaluate(()=>{const e=document.getElementById('panel');return e.style.display==='none'?0:e.getBoundingClientRect().top});
  let placed=false;for(let k=0;k<30&&!placed;k++){const yy=Math.min(h*0.25+k*7,(panelH||h)-10);await p.touchscreen.tap(w*0.5+(k%5)*9,yy);await W(80);placed=(await p.evaluate(()=>S.items.length))>i0}
  r.itemPlaced=placed;
 }catch(e){r.err=e.message}
 r.errs=errs;const ok=r.tapMoves&&r.dragMoves&&r.roomBuilt&&r.itemPlaced&&!r.err&&!errs.length;if(!ok)fail++;r.ok=ok;res.push(r);
 await p.screenshot({path:`screenshots/v16_touch_${w}x${h}.png`});await p.close()}
console.log(JSON.stringify(res,null,0));await b.close();process.exit(fail?1:0)})();
