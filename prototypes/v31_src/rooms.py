"""blender -b -P rooms.py -- outdir : 4 стилизованные диорамы-комнаты (GP, регистратура, психиатр, сдувание голов).
Всё в одном материале-атласе (палитра+картинки) -> 1 draw call на комнату; запечённый лайтмап (UV2) на комнату."""
import bpy,bmesh,sys,os,math,json,random
import numpy as np
from mathutils import Vector,Matrix
OUT=sys.argv[sys.argv.index('--')+1];SAMP=int(os.environ.get('SAMP','64'));LMS=int(os.environ.get('LM','1024'))
HERE=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
AW,AH=2048,1024;SL=json.load(open(OUT+'/atlas.json'))
atl=bpy.data.images.load(OUT+'/atlas_slots.png');PX=np.array(atl.pixels[:],dtype=np.float32).reshape(AH,AW,4)  # bottom-up rows
PAL={}
def sw(c):
    k=tuple(round(x,3) for x in c)
    if k not in PAL:
        i=len(PAL);assert i<256;PAL[k]=i;cx,cy=(i%16)*32,(i//16)*32   # top-left origin
        PX[AH-cy-32:AH-cy,cx:cx+32,:3]=np.array(k)**2.2*0+np.array(k);PX[AH-cy-32:AH-cy,cx:cx+32,3]=1
    i=PAL[k];return ((i%16)*32+16)/AW,1-((i//16)*32+16)/AH
def rect(name,inset=3):x,y=SL[name];return (x+inset)/AW,1-(y+256-inset)/AH,(x+256-inset)/AW,1-(y+inset)/AH   # u0,v0,u1,v1
R=random.Random(5)
class Room:
    def __init__(s,name,O):s.name=name;s.O=Vector(O);s.bm=bmesh.new();s.uv=s.bm.loops.layers.uv.new('UVMap')
    def _col(s,faces,c):
        u=sw(c)
        for f in faces:
            for l in f.loops:l[s.uv].uv=u
    def _new(s,before):return [f for f in s.bm.faces if f.index==-1 or f not in before]
    def box(s,x,y,z,sx,sy,sz,c,rz=0):   # z = низ
        g=bmesh.ops.create_cube(s.bm,size=1,matrix=Matrix.Translation(s.O+Vector((x,y,z+sz/2)))@Matrix.Rotation(rz,4,'Z')@Matrix.Diagonal((sx,sy,sz,1)))
        fs={f for v in g['verts'] for f in v.link_faces};s._col(fs,c);return fs
    def cyl(s,x,y,z,r,h,c,seg=16,axis='Z',r2=None,rot=None):
        m=Matrix.Translation(s.O+Vector((x,y,z)))
        if rot is not None:m=m@rot
        elif axis=='X':m=m@Matrix.Rotation(math.pi/2,4,'Y')
        elif axis=='Y':m=m@Matrix.Rotation(math.pi/2,4,'X')
        g=bmesh.ops.create_cone(s.bm,cap_ends=True,segments=seg,radius1=r,radius2=r if r2 is None else r2,depth=h,matrix=m@Matrix.Translation((0,0,h/2)))
        fs={f for v in g['verts'] for f in v.link_faces};s._col(fs,c);return fs
    def sph(s,x,y,z,r,c,sc=(1,1,1),seg=16):
        g=bmesh.ops.create_uvsphere(s.bm,u_segments=seg,v_segments=seg//2,radius=r,matrix=Matrix.Translation(s.O+Vector((x,y,z)))@Matrix.Diagonal((*sc,1)))
        fs={f for v in g['verts'] for f in v.link_faces};s._col(fs,c);return fs
    def tube(s,pts,r,c,seg=8,caps=True):
        pts=[s.O+Vector(p) for p in pts];rings=[]
        for i,p in enumerate(pts):
            t=(pts[min(i+1,len(pts)-1)]-pts[max(i-1,0)]).normalized();a=Vector((0,0,1)) if abs(t.z)<.9 else Vector((1,0,0))
            u=t.cross(a).normalized();w=t.cross(u)
            rings.append([s.bm.verts.new(p+r*(math.cos(k*2*math.pi/seg)*u+math.sin(k*2*math.pi/seg)*w)) for k in range(seg)])
        fs=[]
        for a,b in zip(rings,rings[1:]):
            for k in range(seg):fs.append(s.bm.faces.new((a[k],a[(k+1)%seg],b[(k+1)%seg],b[k])))
        if caps:fs.append(s.bm.faces.new(rings[0][::-1]));fs.append(s.bm.faces.new(rings[-1]))
        s._col(fs,c);return fs
    def quad(s,p0,p1,p2,p3,img,uvr=None):   # p0 низ-лево, p1 низ-право, p2 верх-право, p3 верх-лево (вид спереди)
        vs=[s.bm.verts.new(s.O+Vector(p)) for p in (p0,p1,p2,p3)];f=s.bm.faces.new(vs)
        u0,v0,u1,v1=rect(img) if uvr is None else uvr
        for l,uv in zip(f.loops,[(u0,v0),(u1,v0),(u1,v1),(u0,v1)]):l[s.uv].uv=uv
        return f
    # плакат на левой стене (x=-2.5, нормаль +x) или задней (y=+2.5, нормаль -y); (c,z)=центр, w,h
    def poster_L(s,y,z,w,h,img,fr=(.35,.25,.15)):
        x=-2.5+.085;s.box(x-.012,y,z-h/2-.02,.02,w+.04,h+.04,fr);s.quad((x+.001,y-w/2,z-h/2),(x+.001,y+w/2,z-h/2),(x+.001,y+w/2,z+h/2),(x+.001,y-w/2,z+h/2),img)
    def poster_B(s,x,z,w,h,img,fr=(.35,.25,.15)):
        y=2.5-.085;s.box(x,y+.012,z-h/2-.02,w+.04,.02,h+.04,fr);s.quad((x-w/2,y-.001,z-h/2),(x+w/2,y-.001,z-h/2),(x+w/2,y-.001,z+h/2),(x-w/2,y-.001,z+h/2),img)
    def shell(s,wall,wall2,floor_img,trim=(.95,.95,.92),band=None):
        s.box(0,0,-.25,5.3,5.3,.25,(.85,.84,.80))           # плита-диорама
        s.box(0,0,-.25,5.32,5.32,.06,(.30,.32,.38))          # тёмный низ
        for i in range(5):
            for j in range(5):s.quad((-2.5+i,-2.5+j,.002),(-1.5+i,-2.5+j,.002),(-1.5+i,-1.5+j,.002),(-2.5+i,-1.5+j,.002),floor_img)
        H=2.7
        s.box(-2.575,.075,0,.15,5.15,H,wall);s.box(.0,2.575,0,5.0,.15,H,wall2)
        s.box(-2.575,.075,H,.17,5.17,.05,trim);s.box(0,2.575,H,5.0,.17,.05,trim)
        s.box(-2.49,0,0,.03,5.0,.12,trim);s.box(0,2.49,0,5.0,.03,.12,trim)   # плинтус
        if band:s.box(-2.495,0,.12,.02,4.98,.85,band);s.box(0,2.495,.12,4.98,.02,.85,band);s.box(-2.49,0,.95,.035,5,.04,trim);s.box(0,2.49,.95,5,.035,.04,trim)
    # мебель
    def plant(s,x,y,sc=1):
        s.cyl(x,y,0,.17*sc,.35*sc,(.85,.45,.25),12,r2=.21*sc);s.cyl(x,y,.33*sc,.19*sc,.02,(.35,.22,.12),12)
        for k in range(9):
            a=k*2.4;l=R.uniform(.35,.6)*sc;h=R.uniform(.5,.9)*sc
            s.tube([(x,y,.35*sc),(x+.15*math.cos(a)*l,y+.15*math.sin(a)*l,.35*sc+h*.6),(x+.45*math.cos(a)*l,y+.45*math.sin(a)*l,.35*sc+h)],.012,(.25,.55,.2),5)
            s.sph(x+.45*math.cos(a)*l,y+.45*math.sin(a)*l,.35*sc+h,.11*sc,(.25,.65,.25) if k%2 else (.35,.75,.3),sc=(1.4,1.4,.45),seg=10)
    def chair(s,x,y,rz,c=(.2,.45,.75),office=False):
        Rm=Matrix.Rotation(rz,3,'Z');P=lambda dx,dy:Vector((x,y,0))+Rm@Vector((dx,dy,0))
        p=P(0,0);s.box(p.x,p.y,.42,.46,.46,.07,c,rz);b=P(0,.22);s.box(b.x,b.y,.48,.44,.06,.48,c,rz)
        if office:s.cyl(x,y,.08,.03,.34,(.2,.2,.22),8);[s.box(*(P(.22*math.cos(k*1.256),.22*math.sin(k*1.256)).xy),.02,.06,.06,.06,(.15,.15,.15)) for k in range(5)];s.box(x,y,.04,.5,.06,.04,(.2,.2,.22),rz);s.box(x,y,.04,.06,.5,.04,(.2,.2,.22),rz)
        else:
            for dx in(-.2,.2):
                for dy in(-.2,.2):q=P(dx,dy);s.box(q.x,q.y,0,.04,.04,.42,(.25,.25,.28))
    def desk(s,x,y,sx,sy,top=(.75,.55,.35),body=(.6,.42,.26)):
        s.box(x,y,.72,sx,sy,.05,top);s.box(x-sx/2+.25,y,0,.45,sy-.06,.72,body);s.box(x+sx/2-.04,y,0,.05,sy-.06,.72,body)
        for k in range(3):s.box(x-sx/2+.25,y-sy/2+.025,.08+k*.21,.4,.01,.17,top);s.box(x-sx/2+.25,y-sy/2+.02,.2+k*.21,.08,.01,.02,(.85,.85,.85))
    def monitor(s,x,y,rz=0):
        s.box(x,y,.77,.18,.12,.02,(.2,.2,.22),rz);s.box(x,y,.79,.04,.04,.18,(.2,.2,.22),rz)
        s.box(x,y+.02,.92,.52,.04,.34,(.22,.22,.25),rz)
        c=Vector((x,y-.002,1.09));w,h=.46,.28;d=Vector((math.cos(rz),math.sin(rz),0))
        a=c-d*w/2;b=c+d*w/2;s.quad((a.x,a.y,c.z-h/2),(b.x,b.y,c.z-h/2),(b.x,b.y,c.z+h/2),(a.x,a.y,c.z+h/2),'screen')
    def papers(s,x,y,n=5,z=.77):
        for k in range(n):s.box(x+R.uniform(-.05,.05),y+R.uniform(-.05,.05),z+k*.012,.21,.29,.01,(.97,.97,.95) if k%3 else (.95,.92,.7),R.uniform(-.3,.3))
    def crumple(s,x,y):s.sph(x,y,.04,.045,(.95,.95,.92),seg=6)
    def bin(s,x,y,c=(.3,.6,.4)):s.cyl(x,y,0,.16,.38,c,14,r2=.19);crumple=s.sph(x,y,.36,.07,(.95,.95,.9),seg=6)
    def shelf(s,x,y,w,h,rz,c=(.55,.35,.2)):
        Rm=Matrix.Rotation(rz,3,'Z');s.box(x,y,0,w,.34,h,c,rz)
        d=Rm@Vector((0,-.172,0));r=Rm@Vector((1,0,0));p=Vector((x,y,0))+d
        a=p-r*(w/2-.05);b=p+r*(w/2-.05);s.quad((a.x,a.y,.08),(b.x,b.y,.08),(b.x,b.y,h-.06),(a.x,a.y,h-.06),'books')
    def bake(s):
        me=bpy.data.meshes.new(s.name);s.bm.to_mesh(me);ob=bpy.data.objects.new(s.name,me);bpy.context.collection.objects.link(ob);return ob
rooms=[]
D=5.6
# ================= 1. Кабинет терапевта (GP) =================
g=Room('room_gp',(-D,0,0));rooms.append(g)
g.shell((.62,.80,.86),(.70,.86,.90),'floor_gp',band=(.45,.66,.74))
g.desk(-1.2,1.0,1.7,.85);g.monitor(-1.5,1.15,0);g.papers(-.75,.95,6);g.papers(-1.0,.8,3)
g.box(-1.1,.85,.77,.42,.15,.025,(.9,.9,.92));g.cyl(-.5,1.25,.77,.04,.1,(.3,.5,.9),10);g.cyl(-.6,1.3,.77,.04,.08,(.95,.85,.3),10)
g.chair(-1.2,1.65,0,(.25,.3,.4),office=True);g.chair(-1.2,.15,math.pi,(.3,.6,.85))
# кушетка + ширма
g.box(1.2,2.0,.0,1.9,.7,.45,(.85,.85,.88));g.box(1.2,2.0,.45,1.9,.7,.12,(.25,.6,.45));g.box(.4,2.0,.57,.35,.62,.08,(.3,.68,.52))
g.box(1.2,1.62,.6,1.6,.02,.01,(.9,.9,.9))
for k,yy in enumerate((.6,1.15)):g.tube([(.15,yy,0),(.15,yy,1.7)],.015,(.8,.8,.85));g.cyl(.15,yy,0,.06,.03,(.3,.3,.3),8)
g.tube([(.15,.6,1.7),(.15,1.15,1.7)],.015,(.8,.8,.85))
for k in range(5):g.box(.15+.05*(k%2),.65+k*.11,.35,.03,.12,1.3,(.55,.8,.85))
g.box(2.1,2.25,0,.7,.45,1.6,(.88,.88,.9));g.box(2.1,2.02,1.6,.72,.02,.02,(.7,.7,.75))
for k in range(4):g.cyl(1.9+k*.13,2.2,1.6,.04,.12+k%2*.06,[(.9,.3,.3),(.3,.5,.9),(.95,.8,.2),(.3,.75,.4)][k],10)
g.box(2.1,2.02,.3,.66,.02,1.2,(.8,.8,.84));g.box(1.82,2.0,.85,.02,.03,.18,(.6,.6,.65));g.box(2.38,2.0,.85,.02,.03,.18,(.6,.6,.65))
g.shelf(-2.25,-.6,1.0,1.7,-math.pi/2)
g.plant(-2.1,2.15,1.2)
# скелет на подставке
sx,sy=-1.9,-1.8;W=(.96,.95,.88)
g.cyl(sx,sy,0,.25,.04,(.3,.3,.35),12);g.tube([(sx,sy,.04),(sx,sy,1.0)],.012,(.6,.6,.65))
g.sph(sx,sy,1.62,.11,W,sc=(.9,1,1.1));g.sph(sx,sy-.06,1.56,.06,W,sc=(1,.8,.6))
g.tube([(sx,sy,1.5),(sx,sy,1.0)],.02,W)
for k in range(5):g.tube([(sx+.15*math.cos(a),sy+.08*math.sin(a),1.42-k*.07) for a in np.linspace(.2,2*math.pi-.2,10)],.01,W,5,False)
g.sph(sx,sy,.98,.1,W,sc=(1.3,.7,.6))
for sgn in(-1,1):
    g.tube([(sx+.17*sgn,sy,1.45),(sx+.22*sgn,sy-.02,1.15),(sx+.25*sgn,sy-.08,.9)],.018,W);g.sph(sx+.25*sgn,sy-.09,.86,.035,W)
    g.tube([(sx+.09*sgn,sy,.95),(sx+.1*sgn,sy-.02,.52),(sx+.1*sgn,sy,.1)],.022,W);g.box(sx+.1*sgn,sy-.05,.04,.07,.14,.04,W)
g.poster_L(-1.9+1.6,1.6,.5,.7,'anatomy');g.poster_B(-1.6,1.75,.6,.6,'heart');g.poster_B(.6,1.95,.4,.55,'eyechart')
g.poster_L(1.3,1.8,.42,.42,'cert');g.poster_L(.55,1.55,.45,.6,'notice',(.4,.25,.12))
g.box(-2.48,-.9+1.5,1.35,.12,.4,.32,(.95,.95,.95));g.quad((-2.41,-1.15,1.36),(-2.41,-.75,1.36),(-2.41,-.75,1.66),(-2.41,-1.15,1.66),'firstaid')
g.cyl(1.55,2.42,2.1,.17,.04,(.25,.35,.6),24,axis='Y');g.quad((1.39,2.395,1.94),(1.71,2.395,1.94),(1.71,2.395,2.26),(1.39,2.395,2.26),'clock')
g.bin(-.15,1.85);[g.crumple(R.uniform(-1,1.5),R.uniform(-1.5,1.5)) for _ in range(5)]
g.box(1.6,-1.9,0,.5,.4,.9,(.95,.95,.97));g.cyl(1.6,-1.9,.9,.13,.4,(.6,.85,1.0),14);g.cyl(1.6,-1.9,1.3,.1,.04,(.3,.5,.9),12)   # кулер
# ================= 2. Регистратура =================
r=Room('room_rec',(0,D,0));rooms.append(r)
r.shell((.55,.80,.72),(.62,.86,.78),'floor_rec',band=(.38,.62,.55))
# изогнутая стойка
pts=[(-1.9+1.3*math.cos(a),.9-1.0*math.sin(a)) for a in np.linspace(0,math.pi/2,12)]
for (x0,y0),(x1,y1) in zip(pts,pts[1:]):
    mx,my=(x0+x1)/2,(y0+y1)/2;L=math.hypot(x1-x0,y1-y0)+.02;rz=math.atan2(y1-y0,x1-x0)
    r.box(mx,my,0,L,.18,1.05,(.82,.55,.3),rz);r.box(mx,my,1.05,L+.02,.34,.05,(.9,.7,.45),rz);r.box(mx,my,.72,L,.6,.04,(.9,.7,.45),rz)
r.box(-1.2,1.6,0,.04,.04,.0,(0,0,0))
r.monitor(-1.85,.55,.6);r.box(-1.25,.15,.76,.22,.18,.07,(.15,.15,.18));r.box(-1.25,.15,.83,.2,.06,.03,(.85,.15,.25))
r.papers(-1.6,-.05,8,.76);r.papers(-.75,.55,5,1.1)
for k in range(4):r.box(-.65,.3,1.1+k*.06,.25,.33,.05,[(.2,.3,.6),(.6,.2,.3),(.2,.5,.3),(.3,.3,.6)][k],.1*k)
r.chair(-2.1,.75,-.4,(.4,.3,.6),office=True)
# автоматы
for k,(xx,img) in enumerate(((1.0,'vend_drinks'),(1.95,'vend_snacks'))):
    c=(.2,.4,.8) if k==0 else (.85,.2,.22);r.box(xx,2.15,0,.85,.65,1.95,c)
    r.quad((xx-.4,1.82,.1),(xx+.4,1.82,.1),(xx+.4,1.82,1.85),(xx-.4,1.82,1.85),img)
r.chair(2.1,-.5,math.pi/2*1.0,(.85,.55,.3));r.chair(2.1,.1,math.pi/2,(.85,.55,.3));r.chair(2.1,.7,math.pi/2,(.85,.55,.3))
r.poster_B(-.7,1.7,.9,.7,'notice');r.poster_L(-.4,1.75,.9,.6,'notice');r.poster_L(1.5,1.9,.5,.5,'clock',(.2,.3,.6))
r.box(-2.43,1.7,0,.12,.95,2.1,(.5,.32,.18));r.quad((-2.36,1.27,.02),(-2.36,2.13,.02),(-2.36,2.13,2.05),(-2.36,1.27,2.05),'door')
r.plant(2.15,2.15,.9);r.bin(2.25,-1.3,(.4,.4,.45));r.box(.2,2.25,0,.4,.35,.9,(.9,.9,.92));r.cyl(.2,2.25,.9,.13,.42,(.6,.85,1),14)
# ================= 3. Психиатр =================
p=Room('room_psy',(0,-D,0));rooms.append(p)
p.shell((.93,.85,.68),(.96,.88,.72),'floor_wood',band=(.55,.36,.22))
p.quad((-1.4,-1.4,.006),(1.6,-1.4,.006),(1.6,1.4,.006),(-1.4,1.4,.006),'rug')
# кушетка-шезлонг
p.box(.6,1.6,0,1.9,.75,.4,(.25,.55,.4));p.box(.6,1.6,.4,1.9,.75,.12,(.3,.62,.45));p.box(-.25,1.6,.5,.4,.75,.45,(.3,.62,.45),0)
for dx in(-.3,1.5):p.cyl(dx,1.3,0,.03,.05,(.4,.25,.15),6);p.cyl(dx,1.9,0,.03,.05,(.4,.25,.15),6)
# кресло
p.box(-1.3,.2,0,.8,.8,.42,(.6,.35,.2));p.box(-1.3,.2,.42,.8,.8,.12,(.68,.42,.25));p.box(-1.65,.2,.54,.15,.8,.65,(.6,.35,.2))
p.box(-1.3,-.15,.42,.8,.12,.35,(.6,.35,.2));p.box(-1.3,.55,.42,.8,.12,.35,(.6,.35,.2))
p.shelf(-2.25,-1.3,1.2,2.0,-math.pi/2);p.shelf(1.4,2.25,1.1,1.9,0);p.shelf(-2.25,1.5,.9,1.6,-math.pi/2)
p.cyl(-1.6,-2.0,0,.18,.04,(.4,.25,.15),12);p.tube([(-1.6,-2.0,.04),(-1.6,-2.0,.62)],.02,(.75,.6,.3))
p.sph(-1.6,-2.0,.85,.24,(.2,.5,.85),seg=20);p.tube([(-1.6+.27*math.cos(a),-2.0,.85+.27*math.sin(a)) for a in np.linspace(-1.2,1.9,9)],.012,(.8,.65,.3),6,False)
for k in range(9):a=R.uniform(0,6.3);b=R.uniform(-.8,.8);p.sph(-1.6+.235*math.cos(a)*math.cos(b),-2.0+.235*math.sin(a)*math.cos(b),.85+.235*math.sin(b),.08,(.3,.7,.3),sc=(1,1,.35),seg=8)
# игрушечный паровозик
tx,ty=-.2,-1.9;cols=[(.9,.2,.2),(.2,.5,.9),(.95,.8,.2),(.3,.75,.35)]
for k in range(4):
    x=tx+k*.3;p.box(x,ty,.04,.24,.16,.14,cols[k]);[p.cyl(x+dx,ty+dy,.05,.035,.02,(.15,.15,.15),10,axis='Y') for dx in(-.07,.07) for dy in(-.09,.09)]
p.cyl(tx-.04,ty,.18,.035,.12,(.2,.2,.2),10);p.box(tx+.06,ty,.18,.12,.16,.1,(.9,.2,.2))
for k in range(3):p.box(.9,-1.0+k*.06,0,.25,.18,.05,cols[k],.4*k)
p.poster_L(-.3,1.7,.55,.7,'inkblot1');p.poster_L(.6,1.65,.5,.6,'inkblot2');p.poster_B(-.7,1.7,.55,.7,'inkblot3');p.poster_B(-1.6,1.75,.4,.4,'cert');p.poster_L(-1.9+1.6,1.75,.4,.4,'inkblot2')
p.plant(2.15,.9,1.0);p.box(1.8,-.3,0,.45,.45,.5,(.6,.35,.2));p.cyl(1.8,-.3,.5,.08,.25,(.95,.85,.5),10,r2=.04);p.cyl(1.8,-.3,.75,.16,.18,(.98,.9,.7),14,r2=.1)
# ================= 4. Сдувание голов =================
d=Room('room_def',(D,0,0));rooms.append(d)
d.shell((.80,.86,.88),(.85,.90,.92),'floor_def',band=(.55,.62,.66))
CU=(.78,.45,.22);BR=(.85,.65,.3);DK=(.35,.25,.2)
d.cyl(-1.1,1.2,0,.75,.25,DK,24);d.cyl(-1.1,1.2,.25,.62,1.3,CU,28);d.cyl(-1.1,1.2,1.55,.66,.1,BR,28)
d.sph(-1.1,1.2,1.65,.6,(.7,.88,1.0),sc=(1,1,.75),seg=24)
for z in(.5,.9,1.3):d.cyl(-1.1,1.2,z,.64,.05,BR,28)
d.cyl(-1.1,1.2,2.08,.08,.5,BR,12);d.tube([(-1.1,1.2,2.55),(-1.1,1.2,2.7),(-.8,1.2,2.75),(-.6,1.2,2.6)],.07,CU,10)
# котёл-барабан спереди
d.cyl(-1.45,-.2,.55,.45,1.3,CU,24,axis='Y');d.cyl(-1.45,-.86,.55,.48,.04,BR,24,axis='Y');d.cyl(-1.45,.46,.55,.48,.04,BR,24,axis='Y')
d.box(-1.45,-.2,0,.7,1.2,.2,DK)
for k in range(3):d.cyl(-1.45+(k-1)*.25,-.92,.55+(k%2)*.2,.06,.06,BR,10,axis='Y')
# манометры
for (gx,gy,gz) in((-.45,.95,1.25),(-.45,1.4,.95),(-.62,.6,1.6)):
    d.cyl(gx-.04,gy,gz,.17,.06,BR,20,axis='X');d.quad((gx+.025,gy-.14,gz-.14),(gx+.025,gy+.14,gz-.14),(gx+.025,gy+.14,gz+.14),(gx+.025,gy-.14,gz+.14),'gauge')
# трубы
d.tube([(-.55,1.0,.4),(-.2,1.0,.4),(-.2,1.0,1.9),(-.6,1.0,2.1)],.07,CU,10);d.tube([(-1.8,1.6,1.0),(-2.2,1.6,1.0),(-2.2,1.6,2.4),(-1.4,1.6,2.45)],.06,BR,10)
d.cyl(-.2,.98,1.1,.12,.05,DK,6,axis='X');d.tube([(-.13,.98+.1*math.cos(a),1.13+.1*math.sin(a)) for a in np.linspace(0,6.3,14)],.015,(.85,.15,.15),6,False)
# пульт
d.box(.3,1.9,0,.8,.5,1.0,(.45,.48,.55));d.quad((-.1,1.64,.6),(.7,1.64,.6),(.7,1.64,.98),(-.1,1.64,.98),'panel')
# кресло пациента
cx,cy=1.0,.2
d.cyl(cx,cy,0,.3,.05,(.3,.3,.35),16);d.cyl(cx,cy,.05,.07,.35,(.6,.6,.65),10);d.box(cx,cy,.4,.6,.6,.12,(.5,.75,.85));d.box(cx,cy+.32,.45,.6,.12,.8,(.5,.75,.85),0)
for sgn in(-1,1):d.box(cx+sgn*.33,cy,.52,.08,.5,.06,(.4,.4,.45))
# шланги к голове (голова пациента ~ (cx,cy-.0,1.55))
for k,(c,off) in enumerate((((.3,.7,.35),-.12),((.85,.75,.2),.12),((.3,.7,.35),0))):
    d.tube([(-.95,-.2+off*2,.55),(-.6,-.5+off,.05),(.1,-.6+off,.05),(.6,-.1+off,.1),(.85,cy-.1,.9),(cx+off*.8,cy+.05,1.25+.1*k)],.035,c,8)
d.poster_L(-.3,1.7,.5,.5,'warning');d.poster_B(1.5,1.6,.55,.7,'balloons');d.poster_L(-1.6,1.4,.45,.45,'firstaid');d.poster_B(.3,2.1,.45,.45,'warning')
d.plant(2.15,-2.0,.8);d.box(2.0,1.9,0,.5,.4,1.3,(.92,.92,.95))
for k in range(3):d.box(2.0,1.7,.3+k*.35,.4,.02,.25,(.85,.87,.9))
# ================= сборка/запекание =================
PX[:,:,3]=1;atl.pixels=PX.ravel().tolist();atl.filepath_raw=OUT+'/atlas.png';atl.file_format='PNG';atl.save()
print('PALETTE',len(PAL))
objs=[x.bake() for x in rooms]
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=SAMP;sc.cycles.use_denoising=False;sc.render.threads=8
w=bpy.data.worlds.new('w');sc.world=w;w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.75,.85,1,1);w.node_tree.nodes['Background'].inputs[1].default_value=.9
sd=bpy.data.lights.new('sun','SUN');sd.energy=3.2;sd.angle=.15;so=bpy.data.objects.new('sun',sd);sc.collection.objects.link(so);so.rotation_euler=(math.radians(40),0,math.radians(35))
for o in objs:
    a=bpy.data.lights.new('a','AREA');a.energy=260;a.size=3.5;a.color=(1,.95,.88);ao=bpy.data.objects.new('a',a);sc.collection.objects.link(ao);ao.location=o.location+Vector((0,0,0))+Vector(rooms[objs.index(o)].O)-o.location+Vector((0,0,3.2))
MAT=bpy.data.materials.new('MI_RoomAtlas');MAT.use_nodes=True;nt=MAT.node_tree;pb=nt.nodes['Principled BSDF']
ti=nt.nodes.new('ShaderNodeTexImage');ti.image=atl;ti.interpolation='Linear';uvn=nt.nodes.new('ShaderNodeUVMap');uvn.uv_map='UVMap'
nt.links.new(uvn.outputs[0],ti.inputs[0]);nt.links.new(ti.outputs[0],pb.inputs['Base Color']);pb.inputs['Roughness'].default_value=.75
for o in objs:
    o.data.materials.append(MAT);me=o.data
    for f in me.polygons:f.use_smooth=False
    lm=me.uv_layers.new(name='LM');me.uv_layers.active=lm
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(60),island_margin=.004);bpy.ops.uv.pack_islands(margin=.002);bpy.ops.object.mode_set(mode='OBJECT')
    me.uv_layers.active=me.uv_layers['UVMap']
    print(o.name,'faces',len(me.polygons))
# запекание по комнате
for o in objs:
    img=bpy.data.images.new('lm_'+o.name,LMS,LMS,float_buffer=True)
    n=nt.nodes.new('ShaderNodeTexImage');n.image=img;un=nt.nodes.new('ShaderNodeUVMap');un.uv_map='LM';nt.links.new(un.outputs[0],n.inputs[0]);nt.nodes.active=n
    o.data.uv_layers['LM'].active=True
    bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
    sc.render.bake.use_pass_direct=True;sc.render.bake.use_pass_indirect=True;sc.render.bake.use_pass_color=False;sc.render.bake.margin=4
    bpy.ops.object.bake(type='DIFFUSE')
    px=np.array(img.pixels[:]).reshape(-1,4);px[:,:3]=np.clip(px[:,:3]/2.0,0,1)**(1/2.2);px[:,3]=1
    o8=bpy.data.images.new('o8',LMS,LMS);o8.pixels=px.ravel().tolist();o8.filepath_raw=f'{OUT}/lm_{o.name}.png';o8.file_format='PNG';o8.save()
    nt.nodes.remove(n);nt.nodes.remove(un);o.data.uv_layers['UVMap'].active=True;print('BAKED',o.name)
for x in list(sc.objects):
    if x.type!='MESH':bpy.data.objects.remove(x)
bpy.ops.export_scene.gltf(filepath=OUT+'/rooms.glb',export_format='GLB',export_texcoords=True,export_image_format='JPEG',export_jpeg_quality=88,export_draco_mesh_compression_enable=True,export_yup=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/rooms.blend')
