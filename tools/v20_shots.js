// v20: загрузка, главное меню, картины на стенах, полы
const pp=require('puppeteer-core');const URL=process.env.URL||'http://localhost:8095/';
(async()=>{const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const errs=[];
 for(const vp of[{width:360,height:800,deviceScaleFactor:2,isMobile:true,hasTouch:true,n:'port'},{width:800,height:360,deviceScaleFactor:2,isMobile:true,hasTouch:true,n:'land'}]){
  const p=await b.newPage();p.on('pageerror',e=>errs.push(e.message));await p.setViewport(vp);
  const cdp=await p.target().createCDPSession();await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:400,downloadThroughput:400000,uploadThroughput:400000});
  await p.goto(URL,{waitUntil:'domcontentloaded'});await p.evaluate(()=>document.fonts.ready);await new Promise(r=>setTimeout(r,700));await p.screenshot({path:'screenshots/v20_loading_'+vp.n+'.png'});
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  await p.waitForFunction(()=>document.body.classList.contains('menubg'),{timeout:60000});await new Promise(r=>setTimeout(r,800));await p.screenshot({path:'screenshots/v20_mainmenu_'+vp.n+'.png'});
  if(vp.n==='port'){await p.evaluate(()=>{closeModal();newGame(0);closeModal()});
   const st=await p.evaluate(()=>{const types=['gp','psych','pharmacy','ward','staffroom','diag'];let x=4,y=4;for(const t of types){try{const ok=placeRoomDirect?placeRoomDirect(t,x,y):null}catch(e){}}return [S.rooms.length,typeof addRoom]});console.log('st',st);await p.close()}else await p.close()}
 console.log(JSON.stringify({errs}));await b.close()})();
