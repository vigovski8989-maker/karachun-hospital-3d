"""python3 atlas.py : рисует картинки-слоты (256px) в out/rooms/atlas_slots.png; левый верхний 512x512 — под палитру (заполняет rooms.py)."""
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import random,math,json
A=Image.new('RGB',(2048,2048),(255,0,255));SL={};F='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(s):return ImageFont.truetype(F,s)
free=[(c,r) for r in range(8) for c in range(8) if not(c<2 and r<2)]
def slot(name):
    c,r=free.pop(0);SL[name]=(c*256,r*256);im=Image.new('RGB',(256,256),'white');return im,ImageDraw.Draw(im),(c,r)
def put(name,im):x,y=SL[name];A.paste(im,(x,y))
R=random.Random(4)
# --- плакаты ---
im,d,_=slot('anatomy');d.rectangle([0,0,255,255],fill=(250,246,232));d.rectangle([6,6,249,249],outline=(200,60,50),width=6)
d.text((40,14),"ANATOMY",fill=(200,60,50),font=font(30))
d.ellipse([108,52,148,92],fill=(240,190,160));d.rounded_rectangle([96,94,160,180],18,fill=(240,190,160))
d.rectangle([84,96,96,170],fill=(240,190,160));d.rectangle([160,96,172,170],fill=(240,190,160));d.rectangle([104,178,122,240],fill=(240,190,160));d.rectangle([134,178,152,240],fill=(240,190,160))
d.ellipse([110,106,128,126],fill=(200,40,50));d.ellipse([118,128,146,150],fill=(150,60,40));d.line([128,96,128,176],fill=(60,80,200),width=3)
for i in range(4):d.line([20,120+i*18,70,120+i*18],fill=(120,120,120),width=3);d.line([186,120+i*18,236,120+i*18],fill=(120,120,120),width=3)
put('anatomy',im)
im,d,_=slot('heart');d.rectangle([0,0,255,255],fill=(255,238,238));d.ellipse([60,60,135,140],fill=(215,40,55));d.ellipse([121,60,196,140],fill=(215,40,55));d.polygon([(64,115),(192,115),(128,210)],fill=(215,40,55))
d.line([20,200,70,200,85,170,100,230,115,200,236,200],fill=(30,30,30),width=4);d.text((50,14),"CARDIO",fill=(180,30,40),font=font(30));put('heart',im)
im,d,_=slot('eyechart');d.rectangle([0,0,255,255],fill=(252,252,250))
for i,(t,s) in enumerate([("Е",56),("ШБ",40),("МНК",30),("ЫМБШ",22),("БЫНКМ",17),("НКИБМШ",13)]):
    w=d.textlength(t,font=font(s));d.text(((256-w)/2,10+sum([56,40,30,22,17,13][:i])*1.25),t,fill=(20,20,20),font=font(s))
put('eyechart',im)
im,d,_=slot('screen');d.rectangle([0,0,255,255],fill=(40,110,200));d.rectangle([12,12,243,40],fill=(240,240,255))
for i in range(7):d.rectangle([20,58+i*26,20+R.randint(80,210),70+i*26],fill=(200,225,255))
d.rectangle([170,150,236,236],fill=(120,230,160));put('screen',im)
im,d,_=slot('notice');d.rectangle([0,0,255,255],fill=(190,140,85))
for i in range(9):
    x,y=R.randint(8,170),R.randint(8,170);c=R.choice([(255,250,150),(255,200,220),(190,230,255),(255,255,255),(200,255,200)])
    d.rectangle([x,y,x+70,y+62],fill=c);[d.line([x+8,y+14+k*10,x+60,y+14+k*10],fill=(110,110,110),width=2) for k in range(4)];d.ellipse([x+30,y+2,x+40,y+12],fill=(220,30,30))
d.rectangle([0,0,255,255],outline=(110,70,30),width=10);put('notice',im)
def vend(name,base,items):
    im,d,_=slot(name);d.rectangle([0,0,255,255],fill=base);d.rectangle([14,14,180,220],fill=(30,40,60))
    for r in range(5):
        for c in range(4):
            x,y=22+c*40,22+r*40;col=R.choice(items)
            if name=='vend_drinks':d.rounded_rectangle([x+8,y+2,x+28,y+34],5,fill=col);d.rectangle([x+8,y+14,x+28,y+22],fill=(255,255,255))
            else:d.rounded_rectangle([x+2,y+8,x+34,y+32],4,fill=col)
        d.rectangle([20,58+r*40,176,61+r*40],fill=(170,170,180))
    d.rectangle([192,40,240,120],fill=(40,40,40));[d.rectangle([196+(k%3)*14,46+(k//3)*14,206+(k%3)*14,56+(k//3)*14],fill=(200,200,200)) for k in range(12)]
    d.rectangle([60,226,140,246],fill=(20,20,20));d.rectangle([196,140,236,160],fill=(220,220,60));put(name,im)
vend('vend_drinks',(30,90,190),[(230,40,40),(40,180,60),(250,170,20),(255,255,255),(60,120,240)])
vend('vend_snacks',(210,40,45),[(250,200,30),(40,160,230),(240,120,30),(150,60,180),(60,190,90)])
im,d,_=slot('books');d.rectangle([0,0,255,255],fill=(90,55,30))
for row in range(4):
    x=6;y0=row*64+6
    while x<246:
        w=R.randint(9,20);h=R.randint(40,56);c=R.choice([(200,50,50),(50,90,180),(60,150,80),(230,180,40),(130,70,150),(230,120,40),(40,40,60),(240,230,210)])
        d.rectangle([x,y0+56-h,x+w-2,y0+56],fill=c);d.rectangle([x+2,y0+60-h,x+w-4,y0+62-h],fill=(250,230,120));x+=w
    d.rectangle([0,row*64+60,255,row*64+63],fill=(70,40,20))
put('books',im)
def blot(name,seed):
    rr=random.Random(seed);im=Image.new('L',(256,256),0);d=ImageDraw.Draw(im)
    for i in range(26):
        x,y,r=rr.randint(70,128),rr.randint(50,210),rr.randint(8,30);d.ellipse([x-r,y-r,x+r,y+r],fill=255)
    im=im.filter(ImageFilter.GaussianBlur(5)).point(lambda v:255 if v>110 else 0)
    L=im.crop((0,0,128,256));im.paste(L.transpose(Image.FLIP_LEFT_RIGHT),(128,0))
    o=Image.new('RGB',(256,256),(250,248,240));o.paste((20,20,25),mask=im);ImageDraw.Draw(o).rectangle([0,0,255,255],outline=(40,30,20),width=8);
    SL[name]=None;slot(name);put(name,o)
blot('inkblot1',3);blot('inkblot2',11);blot('inkblot3',29)
im,d,_=slot('warning');d.rectangle([0,0,255,255],fill=(255,255,255));d.polygon([(128,20),(240,220),(16,220)],fill=(250,200,20),outline=(20,20,20));d.polygon([(128,40),(222,208),(34,208)],outline=(20,20,20),width=6)
d.rectangle([118,90,138,165],fill=(20,20,20));d.ellipse([116,176,140,200],fill=(20,20,20));put('warning',im)
im,d,_=slot('balloons');d.rectangle([0,0,255,255],fill=(245,250,255))
for x,y,c in[(70,80,(220,40,60)),(140,60,(50,120,220)),(190,110,(240,170,30)),(110,140,(80,180,90))]:d.line([x,y+40,128,240],fill=(80,80,80),width=2);d.ellipse([x-30,y-38,x+30,y+38],fill=c);d.ellipse([x-16,y-24,x-6,y-10],fill=(255,255,255))
put('balloons',im)
im,d,_=slot('gauge');d.rectangle([0,0,255,255],fill=(150,90,40));d.ellipse([8,8,248,248],fill=(250,245,225),outline=(60,40,20),width=10)
for i in range(11):a=math.radians(225-i*27);d.line([128+95*math.cos(a),128-95*math.sin(a),128+112*math.cos(a),128-112*math.sin(a)],fill=(20,20,20) if i<8 else (220,30,30),width=5)
d.line([128,128,190,70],fill=(200,20,20),width=7);d.ellipse([116,116,140,140],fill=(30,30,30));put('gauge',im)
im,d,_=slot('firstaid');d.rectangle([0,0,255,255],fill=(250,250,250));d.rectangle([98,48,158,208],fill=(220,30,40));d.rectangle([48,98,208,158],fill=(220,30,40));put('firstaid',im)
im,d,_=slot('door');d.rectangle([0,0,255,255],fill=(170,110,60));d.rectangle([60,20,196,110],fill=(170,215,240),outline=(110,70,30),width=8)
d.rectangle([60,140,196,236],outline=(140,90,45),width=6);d.ellipse([200,128,224,152],fill=(230,200,90));put('door',im)
im,d,_=slot('clock');d.rectangle([0,0,255,255],fill=(255,255,255));d.ellipse([4,4,252,252],fill=(255,255,255),outline=(40,60,120),width=14)
for i in range(12):a=math.radians(90-i*30);d.line([128+90*math.cos(a),128-90*math.sin(a),128+108*math.cos(a),128-108*math.sin(a)],fill=(20,20,20),width=6)
d.line([128,128,128,52],fill=(20,20,20),width=8);d.line([128,128,180,150],fill=(20,20,20),width=8);put('clock',im)
im,d,_=slot('rug');d.rectangle([0,0,255,255],fill=(170,40,40));d.rectangle([14,14,241,241],outline=(240,190,80),width=8);d.rectangle([34,34,221,221],outline=(120,25,30),width=6)
for i in range(4):d.ellipse([100-i*16,100-i*16,156+i*16,156+i*16],outline=(240,190,80) if i%2==0 else (110,25,30),width=4)
put('rug',im)
def tiles(name,c1,c2,gr):
    im,d,_=slot(name);d.rectangle([0,0,255,255],fill=gr)
    for i in range(2):
        for j in range(2):d.rectangle([i*128+3,j*128+3,i*128+124,j*128+124],fill=c1 if (i+j)%2==0 else c2)
    put(name,im)
tiles('floor_gp',(150,175,205),(170,195,222),(110,130,160));tiles('floor_rec',(175,170,215),(200,196,232),(130,125,170));tiles('floor_def',(165,190,175),(185,208,192),(120,140,130))
im,d,_=slot('floor_wood');d.rectangle([0,0,255,255],fill=(160,105,60))
for j in range(8):
    y=j*32;d.line([0,y,255,y],fill=(115,70,35),width=3);o=R.randint(0,200);d.line([o,y,o,y+32],fill=(115,70,35),width=3)
    for k in range(3):yy=y+R.randint(6,28);d.line([R.randint(0,100),yy,R.randint(150,255),yy],fill=(145,95,52),width=1)
put('floor_wood',im)
im,d,_=slot('cert');d.rectangle([0,0,255,255],fill=(120,80,40));d.rectangle([20,20,235,235],fill=(252,248,230));d.text((48,40),"DIPLOMA",fill=(60,60,120),font=font(28))
[d.line([48,100+i*20,208,100+i*20],fill=(150,150,150),width=3) for i in range(4)];d.ellipse([150,170,200,220],fill=(220,170,40));put('cert',im)
im,d,_=slot('panel');d.rectangle([0,0,255,255],fill=(70,75,85));d.rectangle([12,12,243,100],fill=(40,200,120))
for i in range(6):d.ellipse([20+i*38,130,50+i*38,160],fill=R.choice([(220,40,40),(240,200,40),(60,200,90)]))
for i in range(5):d.rectangle([24+i*44,180,52+i*44,240],fill=(180,180,190));yy=190+R.randint(0,30);d.rectangle([24+i*44,yy,52+i*44,yy+14],fill=(30,30,30))
put('panel',im)
im,d,_=slot('globe');d.rectangle([0,0,255,255],fill=(50,120,210))
for i in range(14):x,y=R.randint(0,230),R.randint(20,220);d.ellipse([x,y,x+R.randint(20,60),y+R.randint(15,45)],fill=(80,170,80))
put('globe',im)
A=A.crop((0,0,2048,1024));A.save('out/rooms/atlas_slots.png');json.dump(SL,open('out/rooms/atlas.json','w'));print(len(SL),'slots')
