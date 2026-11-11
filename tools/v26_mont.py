import sys,glob
from PIL import Image
# usage: v26_mont.py out.jpg prefix1 prefix2 ...  (each prefix -> row of phases)
PH=['idle','arrive','start','mid','end','leave'];out=sys.argv[1];rows=[]
for pre in sys.argv[2:]:
  ims=[Image.open(f'{pre}_{ph}.jpg') for ph in PH if glob.glob(f'{pre}_{ph}.jpg')]
  rows.append(ims)
W,H=320,267;M=Image.new('RGB',(W*6,H*len(rows)),'white')
for y,row in enumerate(rows):
  for x,im in enumerate(row):M.paste(im.resize((W,H)),(x*W,y*H))
M.save(out,quality=80)
