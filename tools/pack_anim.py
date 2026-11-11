#!/usr/bin/env python3
"""Упаковка отрендеренных кадров (art_src/render) в атласы WebP + anim.json.
Кадр обрезается по bbox; ox,oy — смещение левого верхнего угла от якоря (корень на полу)."""
import os,json,sys
from PIL import Image
SRC=os.environ.get('SRC','art_src/render');OUT='www/assets/anim';AX,AY=128,176;SW=2048;Q=int(os.environ.get('Q','82'))
os.makedirs(OUT,exist_ok=True)
for f in os.listdir(OUT):os.remove(os.path.join(OUT,f))
frames=[]  # (char,act,dir,idx,img,ox,oy)
for ch in sorted(os.listdir(SRC)):
    for fn in sorted(os.listdir(os.path.join(SRC,ch))):
        if not fn.endswith('.png'):continue
        act,d,i=fn[:-4].rsplit('_',2);im=Image.open(os.path.join(SRC,ch,fn)).convert('RGBA')
        bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
        if not bb:continue
        frames.append((ch,act,int(d),int(i),im.crop(bb),bb[0]-AX,bb[1]-AY))
# shelf packing
frames.sort(key=lambda f:-f[4].height)
sheets=[];cur=[];x=y=rh=0;pos=[]
for fr in frames:
    w,h=fr[4].size
    if x+w+2>SW:x=0;y+=rh+2;rh=0
    if y+h>2048 and True:
        sheets.append((cur,y+rh));cur=[];x=y=rh=0
    cur.append((fr,x,y));x+=w+2;rh=max(rh,h)
sheets.append((cur,y+rh))
meta={}
for si,(items,H) in enumerate(sheets):
    H=max(16,H);img=Image.new('RGBA',(SW,H))
    for (ch,act,d,i,im,ox,oy),x,y in items:
        img.paste(im,(x,y));meta.setdefault(ch,{}).setdefault('%s_%d'%(act,d),{})[i]=[si,x,y,im.width,im.height,ox,oy]
    img.save('%s/anim_%d.webp'%(OUT,si),'WEBP',quality=Q,alpha_quality=100,method=4)
for ch in meta:
    for k in meta[ch]:meta[ch][k]=[meta[ch][k][i] for i in sorted(meta[ch][k])]
json.dump({'sheets':len(sheets),'ax':AX,'ay':AY,'scale':0.5,'v19':os.environ.get('V19','0')=='1','frames':meta},open(OUT+'/anim.json','w'),separators=(',',':'))
tot=sum(os.path.getsize(os.path.join(OUT,f)) for f in os.listdir(OUT));print('frames',len(frames),'sheets',len(sheets),'bytes',tot)
