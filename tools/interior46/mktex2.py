# INTERIOR46 poster/sign atlas: 8x2 portrait slots (128x256 each) of original flat medical illustrations + clock face.
from PIL import Image, ImageDraw, ImageFont
import math
W,H=128,256
A=Image.new('RGB',(W*8,H*2),(255,255,255))
try:F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',15);Fs=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',11)
except Exception:F=Fs=ImageFont.load_default()
def slot(i):
    im=Image.new('RGB',(W,H),(250,248,242));d=ImageDraw.Draw(im);return im,d
def title(d,t,c=(60,90,110)):
    d.rectangle([0,0,W,30],fill=c);d.text((W/2,15),t,fill=(255,255,255),font=F,anchor='mm')
def lines(d,y0,n,c=(170,180,185),w=90):
    for k in range(n):d.rectangle([19,y0+k*12,19+w-(k%3)*18,y0+k*12+4],fill=c)
P=[]
# 0 heart
im,d=slot(0);title(d,'СЕРДЦЕ',(196,70,80))
d.ellipse([22,60,68,106],fill=(214,72,84));d.ellipse([60,60,106,106],fill=(214,72,84));d.polygon([(24,92),(104,92),(64,150)],fill=(214,72,84))
d.line([(30,180),(48,180),(56,165),(64,198),(72,172),(80,180),(98,180)],fill=(196,70,80),width=3);lines(d,210,3);P.append(im)
# 1 skeleton
im,d=slot(1);title(d,'СКЕЛЕТ',(70,100,130));c=(110,120,130)
d.ellipse([50,42,78,72],outline=c,width=3);d.line([(64,72),(64,150)],fill=c,width=4)
for k in range(5):d.arc([40,80+k*10,88,100+k*10],200,340,fill=c,width=2)
d.line([(64,84),(36,130)],fill=c,width=3);d.line([(64,84),(92,130)],fill=c,width=3);d.line([(64,150),(46,220)],fill=c,width=3);d.line([(64,150),(82,220)],fill=c,width=3);d.ellipse([48,140,80,160],outline=c,width=3);P.append(im)
# 2 eye chart
im,d=slot(2);title(d,'ЗРЕНИЕ',(60,120,110))
rows=['Ш Б','М Н К','Ы М Б Ш','Б Ы Н К М','Н К Ш М Ы Б'];sz=[34,26,19,14,11]
for k,(t,s) in enumerate(zip(rows,sz)):
    f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',s);d.text((W/2,58+k*38),t,fill=(30,30,30),font=f,anchor='mm')
P.append(im)
# 3 DNA
im,d=slot(3);title(d,'ДНК',(130,80,160))
for k in range(22):
    y=48+k*8;a=k*.55;x1=64+math.sin(a)*32;x2=64-math.sin(a)*32
    d.line([(x1,y),(x2,y)],fill=(200,200,210),width=2);d.ellipse([x1-4,y-4,x1+4,y+4],fill=(90,170,255));d.ellipse([x2-4,y-4,x2+4,y+4],fill=(255,90,90))
lines(d,230,2);P.append(im)
# 4 lungs
im,d=slot(4);title(d,'ЛЁГКИЕ',(70,130,170))
d.rectangle([60,50,68,100],fill=(200,120,120));d.ellipse([18,80,62,190],fill=(232,140,150));d.ellipse([66,80,110,190],fill=(232,140,150))
d.line([(64,96),(42,120)],fill=(200,100,110),width=4);d.line([(64,96),(86,120)],fill=(200,100,110),width=4);lines(d,206,3);P.append(im)
# 5 brain
im,d=slot(5);title(d,'МОЗГ',(160,110,170))
d.ellipse([18,60,110,150],fill=(240,170,190));
for k in range(6):d.arc([22+k*6,66+k*3,106-k*6,146-k*3],180+k*15,330-k*10,fill=(200,120,150),width=2)
d.line([(64,62),(64,148)],fill=(200,120,150),width=2);lines(d,175,5);P.append(im)
# 6 hand wash steps
im,d=slot(6);title(d,'МОЙТЕ РУКИ',(40,130,160))
for k in range(6):
    x=14+(k%2)*56;y=44+(k//2)*68;d.rounded_rectangle([x,y,x+44,y+56],6,fill=(220,238,245));d.ellipse([x+10,y+14,x+34,y+44],fill=(240,200,170));d.text((x+6,y+4),str(k+1),fill=(40,130,160),font=Fs)
P.append(im)
# 7 pills
im,d=slot(7);title(d,'АПТЕКА',(70,150,90))
d.rectangle([44,46,84,86],fill=(70,150,90));d.rectangle([56,36,72,96],fill=(70,150,90));d.rectangle([34,56,94,76],fill=(70,150,90))
for k,(c1,c2) in enumerate([((240,90,90),(250,250,250)),((90,150,240),(250,230,120)),((250,180,60),(250,250,250))]):
    y=120+k*32;d.rounded_rectangle([24,y,64,y+18],9,fill=c1);d.rounded_rectangle([44,y,64,y+18],0,fill=c1);d.rounded_rectangle([64,y,104,y+18],9,fill=c2)
lines(d,220,2);P.append(im)
# 8 lightning
im,d=slot(8);title(d,'ОСТОРОЖНО',(220,170,40));d.polygon([(64,46),(108,160),(20,160)],fill=(250,210,60),outline=(40,40,40))
d.polygon([(70,70),(50,118),(64,118),(56,150),(80,104),(66,104),(76,70)],fill=(40,40,40));lines(d,190,4);P.append(im)
# 9 skin layers
im,d=slot(9);title(d,'КОЖА',(190,120,90))
for k,c in enumerate([(240,200,170),(230,170,140),(250,225,170),(220,120,110)]):d.rectangle([16,50+k*34,112,84+k*34],fill=c)
for k in range(5):d.line([(30+k*18,50),(34+k*18,120)],fill=(120,80,60),width=2)
lines(d,200,4);P.append(im)
# 10 landscape art
im,d=slot(10);d.rectangle([0,0,W,H],fill=(170,210,235));d.ellipse([80,30,112,62],fill=(255,220,120));d.polygon([(0,170),(50,90),(100,170)],fill=(110,150,120));d.polygon([(40,170),(95,110),(140,170)],fill=(90,130,105));d.rectangle([0,170,W,H],fill=(120,170,110));P.append(im)
# 11 abstract art
im,d=slot(11);d.rectangle([0,0,W,H],fill=(244,236,222));d.ellipse([14,30,84,100],fill=(220,120,90));d.rectangle([50,90,114,180],fill=(70,120,150));d.polygon([(20,240),(64,150),(108,240)],fill=(230,190,90));P.append(im)
# 12 karachun cross / schedule
im,d=slot(12);title(d,'КАРАЧУН',(67,118,146));d.rounded_rectangle([34,46,94,106],10,fill=(67,118,146));d.rectangle([58,54,70,98],fill=(255,255,255));d.rectangle([42,70,86,82],fill=(255,255,255))
for k in range(6):
    d.rectangle([16,124+k*20,40,136+k*20],fill=(200,220,230));d.rectangle([46,124+k*20,112,136+k*20],fill=(230,236,238))
P.append(im)
# 13 x-ray film (dark)
im,d=slot(13);d.rectangle([0,0,W,H],fill=(30,40,48));c=(200,215,225)
d.ellipse([44,20,84,62],outline=c,width=3)
for k in range(7):d.arc([24,70+k*14,104,96+k*14],200,340,fill=c,width=3)
d.line([(64,62),(64,200)],fill=c,width=4);d.ellipse([34,190,94,230],outline=c,width=3);P.append(im)
# 14 whiteboard scribbles
im,d=slot(14);d.rectangle([0,0,W,H],fill=(252,252,250))
for k in range(9):d.line([(14,24+k*22),(14+40+(k*37)%60,24+k*22+(k%2)*3)],fill=[(40,80,180),(200,50,50),(40,140,80)][k%3],width=3)
d.rectangle([70,150,114,200],outline=(200,50,50),width=3);d.line([(70,200),(114,150)],fill=(40,80,180),width=3);P.append(im)
# 15 clock face
im,d=slot(15);d.rectangle([0,0,W,H],fill=(255,255,255));cx,cy,r=64,64,58
d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(255,255,255),outline=(50,60,70),width=6)
for k in range(12):
    a=k*math.pi/6;d.line([(cx+math.sin(a)*(r-14),cy-math.cos(a)*(r-14)),(cx+math.sin(a)*(r-6),cy-math.cos(a)*(r-6))],fill=(50,60,70),width=4 if k%3==0 else 2)
d.line([(cx,cy),(cx+22,cy-24)],fill=(40,40,40),width=5);d.line([(cx,cy),(cx-10,cy+40)],fill=(40,40,40),width=3);d.line([(cx,cy),(cx-38,cy-14)],fill=(200,50,50),width=2);d.ellipse([cx-5,cy-5,cx+5,cy+5],fill=(40,40,40))
d.rectangle([0,128,W,H],fill=(67,118,146));P.append(im)
for i,im in enumerate(P):A.paste(im,((i%8)*W,(i//8)*H))
A.save('assets/tex/i46_posters.png');print('ok',len(P))
