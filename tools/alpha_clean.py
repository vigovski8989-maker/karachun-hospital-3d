"""v19: убирает шумовые полупрозрачные тёмные пиксели (альфа<=12) от shadow-catcher, чтобы обрезка атласа была плотной."""
import sys,os,numpy as np
from PIL import Image
n=0
for r,_,fs in os.walk(sys.argv[1]):
    for f in fs:
        if not f.endswith('.png'):continue
        p=os.path.join(r,f);a=np.array(Image.open(p).convert('RGBA'))
        m=(a[...,3]<=12)&(a[...,:3].max(-1)<20)
        if m.any():a[m]=0;Image.fromarray(a).save(p);n+=1
print('cleaned',n)
