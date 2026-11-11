"""Original clean reception surface/wayfinding art. Pillow; no remote assets."""
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import math
R=Path(__file__).resolve().parent/'assets/tex'
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def f(n):return ImageFont.truetype(font,n)
im=Image.new('RGB',(512,512),(236,231,217));d=ImageDraw.Draw(im)
for i in range(512):
 c=round(1.2*math.sin(i*.009));d.line((0,i,511,i),fill=(236+c,231+c,217+c))
d.rectangle((0,0,511,511),outline=(206,202,191),width=2);d.rectangle((3,3,508,508),outline=(243,239,228),width=1);im.save(R/'rec7_tile.png')
im=Image.new('RGB',(256,256),(242,238,229));im.save(R/'rec7_plaster.png')
im=Image.new('RGB',(512,512),(244,242,233));d=ImageDraw.Draw(im)
for j in [170,410]:
 pts=[(x,j+int(9*math.sin(x/100)+4*math.sin(x/40)))for x in range(512)];d.line(pts,fill=(237,236,227),width=2)
im.save(R/'rec7_stone.png')
im=Image.new('RGB',(512,768));pix=im.load()
for y in range(768):
 t=y/768
 for x in range(512):pix[x,y]=(int(133+90*t),int(191+43*t),int(222+15*t))
d=ImageDraw.Draw(im);d.ellipse((40,68,230,110),fill=(234,245,247));d.ellipse((280,160,450,185),fill=(232,244,247));d.polygon([(0,610),(90,560),(190,605),(340,525),(512,590),(512,768),(0,768)],fill=(162,190,154));d.polygon([(0,680),(120,620),(240,657),(380,604),(512,660),(512,768),(0,768)],fill=(116,161,137));d.line((85,0,430,768),fill=(191,219,231),width=15);im.save(R/'rec7_sky.png')
for i,(title,sub,col) in enumerate([('ЗАПИСЬ НА ПРИЁМ','Паспорт • полис • направление',(43,106,143)),('ЗДОРОВЬЕ','Чистые руки — забота о каждом',(51,132,113)),('ЧАСЫ ПРИЁМА','Пн–Пт 08:00 — 19:00',(169,115,55)),('НАВИГАЦИЯ','Терапевт • аптека • диагностика',(74,105,138))]):
 im=Image.new('RGB',(384,512),(250,249,242));d=ImageDraw.Draw(im);d.rectangle((0,0,383,90),fill=col);d.text((17,30),title,font=f(22),fill='white');d.text((18,117),sub,font=f(17),fill=col)
 if i==1:
  d.rounded_rectangle((139,175,245,345),radius=18,fill=(219,234,223));d.rectangle((177,206,207,311),fill=col);d.rectangle((144,244,240,273),fill=col)
 elif i==2:
  for k,txt in enumerate(['Понедельник     08–19','Вторник             08–19','Среда                 08–19','Четверг              08–19','Пятница              08–18']):d.text((23,180+k*43),txt,font=f(19),fill=(75,87,89))
 else:
  for k in range(5):
   d.ellipse((24,180+k*42,31,187+k*42),fill=col);d.line((48,184+k*42,329-(k%2)*40,184+k*42),fill=(160,176,177),width=3)
 d.text((20,465),'БОЛЬНИЦА КАРАЧУН',font=f(17),fill=col);im.save(R/f'rec7_notice{i}.png')
im=Image.new('RGB',(1024,256),(242,246,241));d=ImageDraw.Draw(im);d.rectangle((0,0,1023,255),outline=(58,118,132),width=12);d.text((50,42),'РЕГИСТРАТУРА',font=f(90),fill=(38,91,111));d.text((54,163),'БОЛЬНИЦА КАРАЧУН  •  ИНФОРМАЦИЯ',font=f(32),fill=(74,127,132));im.save(R/'rec7_sign.png')
