"""v19: процедурные бесшовные текстуры пола 512px (дерево/паркет, терраццо, плитка, линолеум, ковёр, трава)"""
import numpy as np
from PIL import Image,ImageFilter
N=512;rng=np.random.default_rng(19)
def fbm(oct=5,base=4,seed=0):
    r=np.random.default_rng(seed);out=np.zeros((N,N))
    for o in range(oct):
        f=base*2**o;g=r.random((f,f));
        im=Image.fromarray((g*255).astype(np.uint8)).resize((N,N),Image.BICUBIC)
        # бесшовность: wrap через тайлинг
        g2=np.tile(g,(3,3));im=Image.fromarray((g2*255).astype(np.uint8)).resize((N*3,N*3),Image.BICUBIC).crop((N,N,2*N,2*N))
        out+=np.array(im)/255/(2**o)
    return out/out.max()
def save(a,n):Image.fromarray(np.clip(a,0,255).astype(np.uint8)).save(f'/workspace/hospital-game/www/assets/sprites/floor2_{n}.jpg',quality=86)
y,x=np.mgrid[0:N,0:N]
# паркет «ёлочка-квадрат»: 4x4 блока по 128, в каждом 4 планки, направление чередуется
def wood():
    a=np.zeros((N,N,3));n=fbm(5,8,1);gr=fbm(3,64,2)
    B=128;bx,by=x//B,y//B;lx,ly=x%B,y%B;horiz=((bx+by)%2==0)
    t=np.where(horiz,ly,lx);plank=t//32;along=np.where(horiz,lx,ly)
    seed=(bx*7+by*13+plank*3)%11/11.
    base=np.array([176,122,74]);dark=np.array([120,76,42])
    grain=np.sin((np.where(horiz,y,x)*0.9+n*40+seed*30))*0.5+0.5
    k=(0.55+0.3*seed+0.15*grain*gr)[...,None]
    a=dark+(base-dark)*k
    edge=(t%32<1)|(along%B<1)
    a[edge]*=0.55
    a*= (0.92+0.08*n)[...,None];return a
def terrazzo():
    a=np.ones((N,N,3))*np.array([214,210,200]);n=fbm(4,6,3);a*=(0.94+0.06*n)[...,None]
    cols=np.array([[150,140,130],[90,95,100],[180,120,100],[235,232,225],[120,130,110]])
    for i in range(650):
        cx,cy=rng.integers(0,N,2);r=rng.uniform(1.2,4.2);c=cols[rng.integers(0,5)]
        d=((x-cx+N//2)%N-N//2)**2+((y-cy+N//2)%N-N//2)**2;m=d<r*r*rng.uniform(.6,1.4)
        a[m]=a[m]*.2+c*.8
    return a
def tiles():
    n=fbm(4,8,4);T=128;lx,ly=x%T,y%T;tid=(x//T+3*(y//T))%5
    a=np.ones((N,N,3))*np.array([236,240,242]);a*=(0.95+0.04*n+0.012*tid)[...,None]
    gl=((lx<3)|(ly<3));a[gl]=[170,176,180]
    hl=((lx==3)|(ly==3));a[hl]*=1.04
    sh=((lx==T-1)|(ly==T-1));a[sh]*=.9;return a
def lino():
    n=fbm(6,4,5);sp=rng.random((N,N))
    a=np.ones((N,N,3))*np.array([226,222,212]);a*=(0.9+0.1*n)[...,None]
    a[sp>.985]*=.88;a[sp<.01]*=1.06
    # рулонные швы
    a[(y%256)<1]*=.9;return a
def carpet():
    n=fbm(6,16,6);loop=((x+y)%4<2)^((x-y)%4<2)
    a=np.ones((N,N,3))*np.array([200,200,200]);a*=(0.85+0.15*n)[...,None];a[loop]*=.93
    a*= (0.97+0.03*rng.random((N,N)))[...,None];return a
def grass():
    n=fbm(6,6,7);m=fbm(3,24,8)
    a=np.zeros((N,N,3));g1=np.array([70,118,52]);g2=np.array([112,156,72])
    hf=fbm(2,128,9);a=g1+(g2-g1)*(0.45*n+0.3*m+0.25*hf)[...,None];bl=rng.random((N,N));a[bl>.93]*=1.15;a[bl<.05]*=.82
    cl=fbm(3,5,10)>.72;a[cl]=a[cl]*.85+np.array([90,140,60])*.15;return a
for f in(wood,terrazzo,tiles,lino,carpet,grass):save(f(),f.__name__);print(f.__name__)
