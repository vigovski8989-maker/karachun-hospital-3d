# v26: дописать новые кадры отдельным атласом к существующему anim.json (без перепаковки всего)
import os,json
from PIL import Image
SRC='art_src/render_v19';O='www/assets/anim';L='www/assets/anim_lo';AX,AY=128,176;SW=2048
NEW={'doctor':['sit_idle','greet','talk','write','give'],'receptionist':['sit_idle','greet','give','talk']}
m=json.load(open(O+'/anim.json'));fr=[]
for ch,acts in NEW.items():
  for fn in sorted(os.listdir(f'{SRC}/{ch}')):
    a,d,i=fn[:-4].rsplit('_',2)
    if a not in acts:continue
    im=Image.open(f'{SRC}/{ch}/{fn}').convert('RGBA');bb=im.getchannel('A').point(lambda v:255 if v>8 else 0).getbbox()
    fr.append((ch,a,int(d),int(i),im.crop(bb),bb[0]-AX,bb[1]-AY))
fr.sort(key=lambda f:-f[4].height);x=y=rh=0;pl=[]
for f in fr:
  w,h=f[4].size
  if x+w+2>SW:x=0;y+=rh+2;rh=0
  pl.append((f,x,y));x+=w+2;rh=max(rh,h)
si=m['sheets'];img=Image.new('RGBA',(SW,y+rh));tmp={}
for (ch,a,d,i,im,ox,oy),x,y in pl:
  img.paste(im,(x,y));tmp.setdefault((ch,f'{a}_{d}'),{})[i]=[si,x,y,im.width,im.height,ox,oy]
img.save(f'{O}/anim_{si}.webp','WEBP',quality=82,alpha_quality=100,method=4)
lo=json.load(open(L+'/anim.json')) if os.path.exists(L+'/anim.json') else None
for (ch,k),v in tmp.items():m['frames'].setdefault(ch,{})[k]=[v[i] for i in sorted(v)]
m['sheets']=si+1;json.dump(m,open(O+'/anim.json','w'),separators=(',',':'))
print('frames',len(fr),'sheet',si,os.path.getsize(f'{O}/anim_{si}.webp'))
