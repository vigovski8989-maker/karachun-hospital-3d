"""v19: смягчение запечённых контактных теней (shadow catcher) — радиальный спад вокруг якоря.
python3 tools/shadow_post.py art_src/render [--force]"""
import sys,os,numpy as np
from PIL import Image
from concurrent.futures import ProcessPoolExecutor
AX,AY,PXM=128,176,90.5
yy,xx=np.mgrid[0:256,0:256];D=np.sqrt(((xx-AX)/PXM)**2+((yy-AY)/(.5*PXM))**2)
FALL=np.clip((.55-D)/.33,0,1)**1.5*.8
def proc(p):
    m=p+'.sp'
    if os.path.exists(m) and '--force' not in sys.argv:return 0
    a=np.array(Image.open(p).convert('RGBA')).astype(np.float32)
    sh=(a[...,:3].max(-1)<14)&(a[...,3]<252)&(yy>AY-40)
    a[...,3]=np.where(sh,a[...,3]*FALL,a[...,3])
    Image.fromarray(a.clip(0,255).astype(np.uint8)).save(p);open(m,'w').close();return 1
if __name__=='__main__':
    fs=[os.path.join(r,f) for r,_,F in os.walk(sys.argv[1]) for f in F if f.endswith('.png')]
    with ProcessPoolExecutor(8) as ex:print('processed',sum(ex.map(proc,fs,chunksize=32)))
