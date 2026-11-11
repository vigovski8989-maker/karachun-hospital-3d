from PIL import Image,ImageDraw,ImageFont;import os
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
o='/workspace/hospital-game/prototypes/screenshots/v30';os.makedirs(o,exist_ok=True)
pick={'doc':'t10_a','pa':'t20_a','nur':'t10_b','rec':'t10_b','mum':'t10_b','inv':'t20_b','ord':'t20_b','psy':'t10_b','rock':'t10_a','big':'t10_b','nur2':'t10_b'}
for n,k in pick.items():
  a=f'/workspace/audit29/v29_{n}_{k}.jpg';b=f'/workspace/audit30/v30_{n}_{k}.jpg'
  if not(os.path.exists(a) and os.path.exists(b)):print('miss',n);continue
  A,B=Image.open(a),Image.open(b);W,H=A.size;C=Image.new('RGB',(W*2+10,H+30),(20,24,40));C.paste(A,(0,30));C.paste(B,(W+10,30))
  d=ImageDraw.Draw(C);d.text((8,8),f'{n}: ДО (v29)',fill='white',font=F);d.text((W+18,8),f'{n}: ПОСЛЕ (v30)',fill='white',font=F);C.save(f'{o}/legs_{n}.jpg',quality=88)
print(os.listdir(o))
