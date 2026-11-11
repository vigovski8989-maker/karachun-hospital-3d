window.__scen=function(types,lv=0){newGame(lv,true);try{closeModal()}catch(e){}S.money=999999;
 types=types||['reception','gp','diag','pharmacy','ward','toilet','staffroom','psych','pump','lab','xray','inflate'];
 let x=1,y=1,rowH=0;const bad=[];
 for(const t of types){const m=D.rooms[t].min,w=m[0]+2,h=m[1]+2;if(x+w>S.w-1){x=1;y+=rowH+2;rowH=0}
  const r=makeRoom(t,x,y,w,h,0);if(r.bad||validRoom({type:t,x,y,w,h,side:0})){bad.push(t+':'+validRoom({type:t,x,y,w,h,side:0}));}else S.rooms.push(r);x+=w+1;rowH=Math.max(rowH,h)}
 const need={};for(const r of S.rooms){const s=D.rooms[r.type].staff;if(s)need[s]=(need[s]||0)+1}need.handyman=1;need.orderly=(need.orderly||0)+1;
 for(const t in need)for(let i=0;i<need[t];i++)if(S.cands[t]&&S.cands[t].length)hire(t,0);
 invBlk();return {n:S.rooms.length,bad}};
