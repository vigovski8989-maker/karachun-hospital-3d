# пакует кадры в атласы webp (c и n в одинаковых позициях) + index.json
import os,sys,json,glob,re
from PIL import Image
ART=sys.argv[1];OUT=sys.argv[2];os.makedirs(OUT,exist_ok=True)
for who in ['doctor','patient_a','patient_b']:
    fs=sorted(glob.glob(f'{ART}/{who}/*_c.png'));items=[]
    for f in fs:
        k=os.path.basename(f)[:-6];c=Image.open(f);n=Image.open(f[:-6]+'_n.png')
        bb=c.getchannel('A').point(lambda v:255 if v>3 else 0).getbbox() or (0,0,1,1)
        items.append((k,c.crop(bb),n.crop(bb),bb))
    W=2048;x=y=rh=0;pos={}
    for k,c,n,bb in sorted(items,key=lambda t:-t[1].size[1]):
        w,h=c.size
        if x+w>W:x=0;y+=rh;rh=0
        pos[k]=(x,y,w,h,bb[0],bb[1]);x+=w;rh=max(rh,h)
    H=y+rh;C=Image.new('RGBA',(W,H));N=Image.new('RGBA',(W,H))
    for k,c,n,bb in items:
        p=pos[k];C.paste(c,(p[0],p[1]));N.paste(n,(p[0],p[1]))
    C.save(f'{OUT}/{who}_c.webp',quality=88,method=6);N.save(f'{OUT}/{who}_n.webp',lossless=True,method=6)
    an={}
    for k in pos:
        a,d,i=k.rsplit('_',2);an.setdefault(f'{a}_{d}',[]).append((int(i),pos[k]))
    json.dump({kk:[p for _,p in sorted(v)] for kk,v in an.items()},open(f'{OUT}/{who}.json','w'))
    print(who,W,H,len(items))
