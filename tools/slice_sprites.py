#!/usr/bin/env python3
"""Нарезка сгенерированных листов в спрайты с альфой + атлас.
python3 tools/slice_sprites.py <furniture.jpg> <staff.jpg> <patients.jpg> <floors.jpg>"""
import sys,json,os
from PIL import Image,ImageFilter
import numpy as np
OUT='www/assets/sprites'
FURN=['recdesk','desk','cabinet','scanner','tubes','shelf','bed','bench','plant','radiator','bin','soda','wc','sink','coffee','sofa']
STAFF=['doctor','nurse','handyman','receptionist']
PATS=['balloon','patches','rednose','bigfeet','phone','knees','arcs','robot']
def key_out(im):
    a=np.asarray(im.convert('RGB')).astype(np.float32);r,g,b=a[...,0],a[...,1],a[...,2]
    m=np.minimum(r,b)-g  # «пурпурность»
    mx=np.maximum(np.maximum(r,g),b);mx1=np.maximum(mx,1)
    ch=np.dstack([r/mx1,g/mx1,b/mx1])  # цветность без яркости -> тени фона тоже уходят
    h,w=r.shape;cs=np.concatenate([ch[:6,:6].reshape(-1,3),ch[:6,-6:].reshape(-1,3),ch[-6:,:6].reshape(-1,3),ch[-6:,-6:].reshape(-1,3)]);bgc=np.median(cs,0)
    d=np.sqrt(((ch-bgc)**2).sum(-1));d=np.where(mx<45,1,d)
    alpha=np.clip((d-0.13)/0.17,0,1)
    A=Image.fromarray((alpha*255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.6))
    alpha=np.asarray(A).astype(np.float32)/255
    # despill на краях: убираем пурпур
    edge=alpha<.98;sp=np.clip(m-10,0,None)
    for ch in(0,2):a[...,ch]=np.where(edge,a[...,ch]-sp*np.where(edge,1,0),a[...,ch])
    out=np.dstack([np.clip(a,0,255),alpha*255]).astype(np.uint8);return Image.fromarray(out,'RGBA')
def largest(s,frac=0.25):
    from scipy import ndimage
    A=np.asarray(s.getchannel('A'))>60;lab,n=ndimage.label(ndimage.binary_dilation(A,iterations=4))
    if n==0:return s
    sizes=ndimage.sum(A,lab,range(1,n+1));big=[i+1 for i,v in enumerate(sizes) if v>=sizes.max()*frac]
    keep=np.isin(lab,big);a=np.asarray(s).copy();a[...,3]=np.where(keep,a[...,3],0);t=Image.fromarray(a,'RGBA');return t.crop(t.getchannel('A').point(lambda v:255 if v>30 else 0).getbbox())
def cells(path,cols,rows,names,frac=0.25):
    im=Image.open(path);W,H=im.size;res={}
    for i,n in enumerate(names):
        c,r=i%cols,i//cols;cell=im.crop((c*W//cols,r*H//rows,(c+1)*W//cols,(r+1)*H//rows))
        s=key_out(cell);res[n]=largest(s,frac)
    return res
def fit(im,w=None,h=None):
    k=(w/im.width) if w else (h/im.height);return im.resize((max(1,round(im.width*k)),max(1,round(im.height*k))),Image.LANCZOS)
def seamless(t):
    a=np.asarray(t).astype(np.float32);h,w=a.shape[:2];s=np.roll(np.roll(a,h//2,0),w//2,1)
    y=np.abs(np.linspace(-1,1,h))[:,None];x=np.abs(np.linspace(-1,1,w))[None,:];m=np.clip(np.maximum(x,y)*1.6-0.6,0,1)[...,None]
    return Image.fromarray((a*(1-m)+s*m).astype(np.uint8))
def main(f,s,p,fl,pb=None,px=None):
    os.makedirs(OUT,exist_ok=True);spr={}
    BIG={'scanner':150,'bed':130,'sofa':125,'bench':125,'recdesk':130,'desk':120,'tubes':125,'soda':80,'shelf':100}
    for n,im in cells(f,4,4,FURN).items():spr['f_'+n]=fit(im,w=BIG.get(n,90))
    st=cells(s,4,2,[x+'_F' for x in STAFF]+[x+'_B' for x in STAFF])
    for n,im in st.items():spr['s_'+n]=fit(im,h=150)
    for n,im in cells(p,4,2,PATS,0.01).items():spr['p_'+n]=fit(im,h=150 if n!='balloon' else 160)
    if pb:
        for n,im in cells(pb,4,2,PATS,0.01).items():spr['pb_'+n]=fit(im,h=150 if n!='balloon' else 160)
    if px:
        for n,im in cells(px,4,1,['yawn','grumpy','bluenose','laugh'],0.01).items():spr['p_'+n]=fit(im,h=150)
    # атлас (полочная упаковка)
    items=sorted(spr.items(),key=lambda kv:-kv[1].height);AW=1024;x=y=rowh=0;meta={};pos=[]
    for n,im in items:
        if x+im.width+2>AW:x=0;y+=rowh+2;rowh=0
        pos.append((n,im,x,y));meta[n]=[x,y,im.width,im.height];x+=im.width+2;rowh=max(rowh,im.height)
    atlas=Image.new('RGBA',(AW,y+rowh));[atlas.paste(im,(x,y)) for n,im,x,y in pos];atlas.save(OUT+'/atlas.png',optimize=True)
    json.dump(meta,open(OUT+'/atlas.json','w'))
    im=Image.open(fl).convert('RGB');W,H=im.size;names=['lino','tiles','carpet','grass']
    for i,n in enumerate(names):
        c,r=i%2,i//2;cell=im.crop((c*W//2+20,r*H//2+20,(c+1)*W//2-20,(r+1)*H//2-20));sq=min(cell.size);cell=cell.crop((0,0,sq,sq)).resize((256,256),Image.LANCZOS)
        if n=='tiles':cell=cell  # плитка уже периодична — оставить швы сетки
        else:cell=seamless(cell)
        cell.save(OUT+'/floor_'+n+'.jpg',quality=88)
    print('atlas',atlas.size,len(meta),'sprites')
if __name__=='__main__':main(*sys.argv[1:7])
