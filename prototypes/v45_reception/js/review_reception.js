// Preview-only review harness. Activated ONLY with ?review=reception.
// Does not alter normal-game economy when the param is absent.
(function(){
  const Q=new URLSearchParams(location.search);
  if(!Q.has('cap')||Q.get('review')!=='reception')return;
  const boot=async()=>{
    if(!window.__ready3d){requestAnimationFrame(boot);return}
    try{
      const src=await (await fetch('/v38scen.js')).text();
      eval(src);
      await new Promise(r=>setTimeout(r,400));
      if(typeof startLevel==='function')startLevel(0);
      await new Promise(r=>setTimeout(r,300));
      const pack=__scen(['reception','gp']);
      try{closeModal()}catch(e){}
      // Review-only sandbox money — gated by ?review=
      S.money=50000;
      setSpeed(0);
      const st=S.staff.find(s=>s.type==='receptionist');
      const r=S.rooms.find(x=>x.type==='reception');
      if(st&&r&&r.sp&&r.sp.staff){
        try{takeSeat(st,r.sp.staff);st.state='work';st.room=r.id;r.staff=st.id}catch(e){}
      }
      // Spawn a patient at reception for greet/type interaction evidence
      if(r&&r.sp&&r.sp.patient){
        let pat=S.pats[0];
        if(!pat&&typeof spawnPat==='function'){try{spawnPat()}catch(e){} pat=S.pats[0]}
        if(pat){pat.x=r.sp.patient.x;pat.y=r.sp.patient.y;pat.dir=r.sp.patient.dir??3;pat.state='treat';pat.room=r.id;r.busy=pat.id;pat.need='reception';pat.t=8;pat.tT=8}
      }
      window.__reviewReception={pack,room:r&&{x:r.x,y:r.y,w:r.w,h:r.h},staff:!!st};
      console.log('[review_reception]', window.__reviewReception);
    }catch(e){console.error('review_reception',e)}
  };
  addEventListener('load',()=>setTimeout(boot,50));
})();
