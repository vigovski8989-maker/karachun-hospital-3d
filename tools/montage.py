import sys,glob
from PIL import Image
d,cols,step=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]);out=sys.argv[4];sc=float(sys.argv[5]) if len(sys.argv)>5 else .5
fs=sorted(glob.glob(d+'/f*.png'))[::step]
ims=[Image.open(f).convert('RGB') for f in fs]
w,h=int(ims[0].width*sc),int(ims[0].height*sc)
rows=(len(ims)+cols-1)//cols
M=Image.new('RGB',(cols*w,rows*h),'white')
for i,im in enumerate(ims):M.paste(im.resize((w,h)),((i%cols)*w,(i//cols)*h))
M.save(out)
