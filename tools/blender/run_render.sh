#!/bin/bash
# Полный рендер всех спрайтов персонажей (4 процесса Blender параллельно)
cd "$(dirname "$0")"; B=${BLENDER:-$HOME/blender/blender-4.2.3-linux-x64/blender}; OUT=${1:-/workspace/hospital-game/art_src/render}
export BTHREADS=2
$B -b -P render.py -- $OUT chairs > /tmp/r_chairs.log 2>&1
$B -b -P render.py -- $OUT balloon,patches,rednose,bigfeet,doctor > /tmp/r1.log 2>&1 &
$B -b -P render.py -- $OUT phone,knees,arcs,robot,nurse > /tmp/r2.log 2>&1 &
$B -b -P render.py -- $OUT yawn,grumpy,bluenose,laugh > /tmp/r3.log 2>&1 &
$B -b -P render.py -- $OUT handyman,receptionist > /tmp/r4.log 2>&1 &
wait; echo ALLDONE
