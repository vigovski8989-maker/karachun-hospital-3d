# INTERIOR46 original procedural textures (clean, low-noise to match the approved reception look). Seeded, tileable.
import numpy as np
from PIL import Image, ImageFilter
rng=np.random.default_rng(46)
O='assets/tex/'
N=512
def tile_noise(scale,amp):
    small=rng.normal(0,1,(N//scale,N//scale))
    im=Image.fromarray(((small-small.min())/(np.ptp(small)+1e-9)*255).astype(np.uint8)).resize((N,N),Image.BICUBIC)
    a=np.asarray(im).astype(float)/255-.5
    return a*amp
def save(a,name):
    Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(O+name);print(name)
# 1 vinyl: one 1 m sheet, faint seams, sparse soft flecks
v=np.ones((N,N,3))*np.array([243,242,238])
v+= (tile_noise(32,6))[...,None]
fl=rng.random((N,N))<.004
for c,d in [(0,-28),(1,-26),(2,-22)]:v[...,c][fl]+=d
fl2=rng.random((N,N))<.002;v[fl2]+=np.array([-10,-6,4])
v=np.asarray(Image.fromarray(np.clip(v,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.6))).astype(float)
v[:2,:]-=22;v[:,:2]-=22
save(v,'i46_vinyl.png')
# 2 small ceramic: 4x4 tiles per metre, thin grout, slight per-tile tone
t=np.ones((N,N,3))*np.array([247,247,245]);s=N//4
for i in range(4):
    for j in range(4):
        t[i*s:(i+1)*s,j*s:(j+1)*s]+=rng.normal(0,2.2)
t+= tile_noise(64,3)[...,None]
g=np.zeros((N,N),bool)
for k in range(4):
    g[k*s:k*s+3,:]=True;g[:,k*s:k*s+3]=True
t[g]=np.array([200,204,204])
# bevel highlight
for k in range(4):
    t[k*s+3:k*s+5,:]+=8;t[:,k*s+3:k*s+5]+=8
save(t,'i46_tile4.png')
# 3 oak planks: 5 planks per metre, staggered joints, soft grain
w=np.zeros((N,N,3));ph=N//5
base=np.array([196,150,104])
yy,xx=np.mgrid[0:N,0:N]
for p in range(5):
    tone=rng.normal(0,7);off=rng.integers(0,N)
    grain=np.sin((xx+off)*.035+np.sin(yy*.09+p)*2.2+rng.normal(0,.2))*5+np.sin(xx*.11+p*3)*2
    sl=slice(p*ph,(p+1)*ph)
    w[sl]=base+tone+grain[sl][...,None]*np.array([1,.85,.7])
    j=(off+p*173)%N
    w[sl, j:j+2]-=40
w+=tile_noise(16,6)[...,None]
w[[k*ph for k in range(5)]]-=45;w[[k*ph+1 for k in range(5)]]-=20
w=np.asarray(Image.fromarray(np.clip(w,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.5))).astype(float)
save(w,'i46_wood.png')
# 4 terrazzo: cream, fine chips, 1 m slab joint
z=np.ones((N,N,3))*np.array([236,230,216])+tile_noise(32,5)[...,None]
cols=np.array([[210,200,182],[196,200,194],[220,212,198],[186,194,198],[228,218,202]])
for _ in range(700):
    x,y=rng.integers(0,N,2);r=rng.integers(1,3);c=cols[rng.integers(0,len(cols))]
    z[max(0,y-r):y+r,max(0,x-r):x+r]=c
z=np.asarray(Image.fromarray(np.clip(z,0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.7))).astype(float)
z[:3,:]=[188,180,164];z[:,:3]=[188,180,164]
save(z,'i46_terrazzo.png')
