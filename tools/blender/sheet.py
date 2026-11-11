import sys,glob
from PIL import Image
# usage: sheet.py out.png cols cellw cellh files...
out,cols,cw,ch=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]),int(sys.argv[4]);fs=sys.argv[5:]
rows=(len(fs)+cols-1)//cols;S=Image.new('RGBA',(cw*cols,ch*rows),(205,208,212,255))
for i,f in enumerate(fs):
    im=Image.open(f);bb=im.getchannel('A').getbbox() or (0,0,1,1)
    im=im.crop((128-cw//2,176-ch+10,128+cw//2,176+10)) if False else im.crop((128-cw//2,176-ch+30,128+cw//2,176+30))
    S.alpha_composite(im,((i%cols)*cw,(i//cols)*ch))
S.save(out)
