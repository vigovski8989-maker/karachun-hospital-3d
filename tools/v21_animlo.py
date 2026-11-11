# v21: пол-разрешения копия атласов анимации для качества Low (памяти в 4 раза меньше)
import json,os
from PIL import Image
S='www/assets/anim';D='www/assets/anim_lo';os.makedirs(D,exist_ok=True)
m=json.load(open(S+'/anim.json'))
for i in range(m['sheets']):
    im=Image.open(f'{S}/anim_{i}.webp');im.resize(((im.width+1)//2,(im.height+1)//2),Image.LANCZOS).save(f'{D}/anim_{i}.webp',quality=88,method=6)
def h(f):
    x0,y0=f[1]//2,f[2]//2;x1,y1=(f[1]+f[3]+1)//2,(f[2]+f[4]+1)//2
    return [f[0],x0,y0,x1-x0,y1-y0]+[v/2 for v in f[5:7]]+f[7:]
for ch in m['frames']:
    for k in m['frames'][ch]:m['frames'][ch][k]=[h(f) for f in m['frames'][ch][k]]
m['scale']=m['scale']*2;json.dump(m,open(D+'/anim.json','w'),separators=(',',':'))
