#!/bin/bash
# v19: полный перерендер (PBR-детали, контактные тени, 12 кадров ходьбы, дыхание в idle)
cd "$(dirname "$0")"; B=$HOME/blender/blender-4.2.3-linux-x64/blender; OUT=/workspace/hospital-game/art_src/render_v19
export BTHREADS=2 BSAMPLES=40 V19=1
IFS=, read -ra C <<< "doctor,nurse,handyman,orderly,receptionist,balloon,patches,rednose,bigfeet,phone,knees,arcs,robot,yawn,grumpy,bluenose,laugh,glow,spotty,zebra,tail,flat,deflated,static,battery,bsod,loop"
for j in 0 1 2 3; do (
  [ $j = 0 ] && { $B -b -P render.py -- $OUT chairs; $B -b -P render.py -- $OUT toilet; $B -b -P render.py -- $OUT sink; $B -b -P render.py -- $OUT sofa; }
  [ $j = 1 ] && $B -b -P render.py -- $OUT props:coffee+pumpmachine+xray+dnaseq+elchair+rebootpod+inflator+uvlamp+labbench+sofa+morguefridge+autopsy+organfridge+bookcase+readdesk+chiefdesk+aquarium
  L=""; for i in "${!C[@]}"; do [ $((i%4)) = $j ] && L="$L,${C[$i]}"; done
  $B -b -P render.py -- $OUT ${L#,}
) > /tmp/v19_r$j.log 2>&1 & done
wait; echo ALLDONE
