R=$1;T=$2;B=~/blender/blender-4.2.3-linux-x64/blender
$B -b -P build_char.py -- $R out/$R.glb 2>&1 | grep "DONE\|Traceback\|Error:" | grep -v "Cannot read"
for v in "Idle_Loop 10 full idle" "Idle_Loop 10 face face" "Sitting_Idle_Loop 10 full sit"; do set -- $v; $B -b -P preview.py -- out/$R.blend /tmp/p_${R}_$4_$T.png $1 $2 $3 >/dev/null 2>&1; done
python3 -c "
from PIL import Image
ims=[Image.open(f'/tmp/p_${R}_{n}_$T.png').convert('RGB') for n in ('idle','face','sit')]
M=Image.new('RGB',(2100,900))
for i,im in enumerate(ims):M.paste(im,(700*i,0))
M.save('/tmp/prev_${R}_$T.jpg')"
