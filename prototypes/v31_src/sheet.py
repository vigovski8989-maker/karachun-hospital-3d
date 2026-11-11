import sys,glob,os
from PIL import Image
d=sys.argv[1];fs=sorted(glob.glob(d+'/*_t*.jpg'))
names=sorted({os.path.basename(f).split('_')[1] for f in fs})
for n in names:
  g=[f for f in fs if f'_{n}_' in f];ts=sorted({int(f.split('_t')[-1].split('_')[0]) for f in g})
  C=Image.new('RGB',(240*len(ts),480))
  for i,t in enumerate(ts):
    for j,k in enumerate('ab'):
      f=[x for x in g if x.endswith(f'_t{t}_{k}.jpg')]
      if f:C.paste(Image.open(f[0]).resize((240,240)),(240*i,240*j))
  C.save(f'{d}/sheet_{n}.jpg',quality=85)
