"""Сравнение масштаба мебели и человека (линейка в метрах). Использование: python3 tools/scale_chart.py out.png"""
import json,sys
from PIL import Image,ImageDraw
A=Image.open('www/assets/sprites/atlas.png').convert('RGBA');am=json.load(open('www/assets/sprites/atlas.json'))
F=json.load(open('www/data/furn.json'))
m=json.load(open('www/assets/anim/anim.json'));sh=[Image.open('www/assets/anim/anim_%d.webp'%i).convert('RGBA') for i in range(m['sheets'])]
PM=39.2
def anim(ch,key,i=0):
    f=m['frames'][ch][key][i];return sh[f[0]].crop((f[1],f[2],f[1]+f[3],f[2]+f[4])).resize((f[3]//2,f[4]//2),Image.LANCZOS),f[5]//2,f[6]//2
items=['wc','sink','recdesk','desk','cabinet','scanner','tubes','shelf','bed','bench','sofa','plant','radiator','bin','soda','coffee']
Z=2;W=140*len(items)+160;H=330
S=Image.new('RGBA',(W*1,H),(240,240,244,255));d=ImageDraw.Draw(S);base=270
for h in (.4,.45,.5,.75,.85,1.1,1.75,2.0):
    y=base-h*PM;d.line([(0,y),(W,y)],fill=(200,120,120,255) if h in(1.75,) else (190,190,200,255));d.text((2,y-10),'%.2fm'%h,fill=(90,90,90,255))
im,ox,oy=anim('doctor','idle_1');S.alpha_composite(im,(60+ox,base+oy));
for n,k in enumerate(items):
    fp=F[k]['fp'];sc=F[k].get('sc')
    s0=am['f_'+k];sp=A.crop((s0[0],s0[1],s0[0]+s0[2],s0[1]+s0[3]))
    w=(fp[0]+fp[1])*32*(1 if sc is None else 0)+ (sp.width*sc if sc else 0)
    s=w/sp.width;sp=sp.resize((int(sp.width*s),int(sp.height*s)),Image.LANCZOS)
    cx=170+n*140;S.alpha_composite(sp,(cx-sp.width//2,int(base+w/4-sp.height)))
    d.text((cx-30,base+20),k+' %dx%d'%(sp.width,sp.height),fill=(0,0,0,255))
S.convert('RGB').save(sys.argv[1])
