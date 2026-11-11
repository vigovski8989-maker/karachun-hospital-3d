"""v29: персонаж на базе Quaternius Universal Base Characters (CC0).
blender -b -P build_char.py -- <role> <out.glb>
Одежда = оболочки, снятые с тела (наследуют веса скиннинга) + сгенерированная пола халата; текстуры одежды запекаются в Cycles."""
import bpy,bmesh,sys,os,math,mathutils,random
from mathutils import Vector,Matrix
import numpy as np
ROLE,OUT=sys.argv[sys.argv.index('--')+1:][:2]
UBC="/workspace/assets_cc0/ubc/Universal Base Characters[Standard]/"
BD=UBC+"Base Characters/Godot - UE/";HD=UBC+"Hairstyles/Origin at 0/glTF (Godot)/";TX=UBC+"Base Characters/Textures/"
CFG={
 'doctor':dict(sex='Male',skin='T_Superhero_Male_Ligh.png',hair=['Hair_SimpleParted'],hairc=(.16,.11,.08),
   cloth=['coat','pants','shoes','steth'],top=(.97,.97,.95),shirt=(.55,.68,.85),tie=(.60,.10,.13),pants=(.20,.22,.27),shoes=(.06,.06,.07),skirt_zb=-.07),
 'nurse':dict(sex='Female',skin='T_Superhero_Female_Light_BaseColor.png',hair=['Hair_Buns'],hairc=(.45,.24,.12),
   cloth=['top_short','skirt','shoes'],top=(.45,.74,.95),shoes=(.40,.68,.92),skirt_zb=.0,skirt_off=.012),
 'orderly':dict(sex='Male',skin='T_Superhero_Male_Ligh.png',hair=['Hair_Buzzed'],hairc=(.30,.18,.10),
   cloth=['top_long','pants','shoes'],top=(.26,.44,.70),pants=(.26,.44,.70),shoes=(.33,.20,.11)),
 'receptionist':dict(sex='Female',skin='T_Superhero_Female_Light_BaseColor.png',hair=['Hair_Buns'],hairc=(.32,.16,.08),hairscale=0.95,curly=False,
   cloth=['top_long','skirt','shoes'],top=(.97,.97,.99),vest=(.55,.72,.86),skirt=(.22,.28,.38),shoes=(.12,.12,.14),skirt_zb=.03,skirt_off=.01,skirt_flare=False,friendly=True),
 'bighead':dict(sex='Male',skin='T_Superhero_Male_Ligh.png',hair=[],hairc=(.3,.2,.1),
   cloth=['top_long','pants'],top=(.62,.82,.96),pants=(.62,.82,.96)),
 'invisible':dict(sex='Male',skin='T_Superhero_Male_Ligh.png',hair=[],hairc=(.3,.2,.1),
   cloth=['coat','pants','shoes'],top=(.58,.44,.28),shirt=(.88,.84,.74),tie=None,pants=(.30,.24,.18),shoes=(.18,.12,.08),skirt_zb=-.22),
 'rocker':dict(sex='Male',skin='T_Superhero_Male_Ligh.png',hair=['Hair_SimpleParted'],hairc=(.04,.04,.06),hairscale=1.45,
   cloth=['top_long','pants','shoes'],top=(.97,.97,1.0),pants=(.97,.97,1.0),shoes=(.95,.95,.97),trim=(.55,.25,.80)),
 'mummy':dict(sex='Male',skin='T_Superhero_Male_Ligh.png',hair=[],hairc=(.3,.2,.1),
   cloth=['wrap'],top=(.93,.88,.74)),
 'patient_a':dict(sex='Male',skin='T_Superhero_Male_Dark.png',hair=['Hair_Buzzed','Hair_Beard'],hairc=(.05,.04,.035),
   cloth=['sweater','pants','shoes'],top=(.95,.62,.15),pants=(.16,.30,.58),shoes=(.92,.92,.92)),
 'patient_b':dict(sex='Female',skin='T_Superhero_Female_Dark_BaseColor.png',hair=['Hair_Long'],hairc=(.07,.05,.04),
   cloth=['sweater','pants','shoes'],top=(.85,.20,.32),pants=(.12,.12,.16),shoes=(.40,.25,.15)),
}[ROLE]
MALE=CFG['sex']=='Male'
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=BD+f"Superhero_{CFG['sex']}_FullBody.gltf")
for o in list(bpy.data.objects):
    if o.name.startswith('Icosphere'):bpy.data.objects.remove(o)
ARM=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
BODY=max([o for o in bpy.data.objects if o.type=='MESH'],key=lambda o:len(o.data.vertices))
EYES=bpy.data.objects['Eyes'];BROWS=bpy.data.objects['Eyebrows']
BONES={b.name:(Vector(b.head_local),Vector(b.tail_local)) for b in ARM.data.bones}
gname=[g.name for g in BODY.vertex_groups]
def wdict(me):
    return [{gname[g.group]:g.weight for g in v.groups if g.weight>1e-4} for v in me.vertices]
def S(w,keys):return sum(x for k,x in w.items() if any(k.startswith(p) for p in keys))
# ---------- 1. «де-супергеройство»: утоньшение мышц радиально к оси кости ----------
F=dict(upperarm=.84,lowerarm=.90,clavicle=.92,spine_03=.88,spine_02=.92,spine_01=.96,neck_01=.86,thigh=.93,calf=.95) if MALE else \
  dict(upperarm=.92,lowerarm=.95,spine_03=.97,neck_01=.92,thigh=.97)
def closest(p,a,b):
    ab=b-a;t=max(0,min(1,(p-a).dot(ab)/max(ab.length_squared,1e-9)));return a+ab*t
W=wdict(BODY.data)
for v,w in zip(BODY.data.vertices,W):
    d=Vector()
    for g,x in w.items():
        f=next((F[k] for k in F if g.startswith(k)),1.0)
        if f<1:a,b=BONES[g];d+=x*(1-f)*(closest(v.co,a,b)-v.co)
    v.co+=d
# ---------- 2. оболочки одежды ----------
z_pel=BONES['pelvis'][0].z;z_knee=BONES['calf_l'][0].z;z_neck=BONES['neck_01'][0].z;z_sh=BONES['upperarm_l'][0].z
HAND=('hand','index','middle','ring','pinky','thumb');FOOT=('foot','ball')
def sel_rule(kind):
    def f(co,w):
        if kind=='top_long':   # торс + рукава до запястья
            return S(w,('spine','clavicle','upperarm','lowerarm','pelvis'))>.5 and S(w,HAND)<.15 and S(w,('neck','Head'))<.35 and co.z>z_pel-.02
        if kind=='top_short':
            ok=S(w,('spine','clavicle','upperarm','pelvis'))>.5 and S(w,('neck','Head'))<.35 and co.z>z_pel-.02 and S(w,('lowerarm',)+HAND)<.2
            return ok and abs(co.x)<BONES['upperarm_l'][0].x+.55*(BONES['upperarm_l'][1].x-BONES['upperarm_l'][0].x)
        if kind=='pants':
            return S(w,('pelvis','thigh','calf'))>.5 and co.z<z_pel+.10 and S(w,FOOT)<.25 and co.z>.09
        if kind=='shoes':
            return co.z<.13 and S(w,FOOT+('calf',))>.5
    return f
def smooth_pos(bm,iters,fac=.5,pin_boundary=True):
    for _ in range(iters):
        new={}
        for v in bm.verts:
            if pin_boundary and v.is_boundary:continue
            nb=[e.other_vert(v).co for e in v.link_edges]
            if nb:new[v]=v.co.lerp(sum(nb,Vector())/len(nb),fac)
        for v,c in new.items():v.co=c
def make_shell(name,rule,off,smooth=8,extra=None):
    bm=bmesh.new();bm.from_mesh(BODY.data);dl=bm.verts.layers.deform.active
    bm.verts.ensure_lookup_table()
    sel=[rule(v.co,{gname[k]:x for k,x in v[dl].items()}) for v in bm.verts]
    bmesh.ops.delete(bm,geom=[f for f in bm.faces if not all(sel[v.index] for v in f.verts)],context='FACES')
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    smooth_pos(bm,smooth)
    bm.normal_update()
    for v in bm.verts:
        e=extra(v.co,{gname[k]:x for k,x in v[dl].items()}) if extra else 0
        v.co+=v.normal*(off+e)
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
    o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o)
    for g in gname:o.vertex_groups.new(name=g)
    return o
def hide_body(rule,shrink=1):
    """удалить грани тела, полностью закрытые одеждой (с запасом в shrink колец)"""
    bm=bmesh.new();bm.from_mesh(BODY.data);dl=bm.verts.layers.deform.active;bm.verts.ensure_lookup_table()
    sel=set(v for v in bm.verts if rule(v.co,{gname[k]:x for k,x in v[dl].items()}))
    for _ in range(shrink):
        border={v for v in sel if any(e.other_vert(v) not in sel for e in v.link_edges)}
        sel-=border
    bmesh.ops.delete(bm,geom=[f for f in bm.faces if all(v in sel for v in f.verts)],context='FACES')
    bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
    bm.to_mesh(BODY.data);bm.free()
def vcol(o,fn):
    me=o.data;ca=me.color_attributes.new('col','FLOAT_COLOR','POINT')
    for v in me.vertices:
        w={gname[g.group]:g.weight for g in v.groups}
        ca.data[v.index].color=(*fn(v.co,w),1)
def coat_skirt(off,zb_rel=-.07,slit=True,flare=True):
    """пола халата: кольца от талии до колена по максимальному радиусу бёдер, разрез спереди внизу"""
    zt=z_pel+.12;zb=z_knee+zb_rel;NA=40;NR=10
    pts=[v.co for v,w in zip(BODY.data.vertices,wdict(BODY.data)) if S(w,HAND+('upperarm','lowerarm'))<.1]
    cy=BONES['pelvis'][0].y
    rad=np.zeros((NR,NA));prev=None
    for r in range(NR):
        z=zt+(zb-zt)*r/(NR-1)
        band=[p for p in pts if abs(p.z-z)<.05] or band
        rx=max(abs(p.x) for p in band);fr=max(cy-p.y for p in band);bk=max(p.y-cy for p in band)
        cur=np.array([rx,fr,bk]);prev=cur if prev is None else np.maximum(cur,prev*(np.array([1.025,1.01,1.02]) if flare else np.array([.985,.99,.99])))
        rx,fr,bk=prev
        for a in range(NA):
            th=2*math.pi*a/NA;cx,sy=math.cos(th),math.sin(th);ry=fr if sy<0 else bk
            e=2.4;rad[r,a]=1/((abs(cx)/rx)**e+(abs(sy)/ry)**e)**(1/e)
    rad+=off
    bm=bmesh.new();vs=[]
    for r in range(NR):
        z=zt+(zb-zt)*r/(NR-1);row=[]
        for a in range(NA+1):
            th=2*math.pi*a/NA+(-math.pi/2);aa=int(round((th%(2*math.pi))/(2*math.pi)*NA))%NA
            row.append(bm.verts.new((rad[r,aa]*math.cos(th),cy+rad[r,aa]*math.sin(th),z)))
        vs.append(row)
    # th начинается со стороны -y (перед): колонка 0/NA — передний разрез
    for r in range(NR-1):
        for a in range(NA):
            if slit and r>=NR//2-1 and a in (0,NA-1):continue
            bm.faces.new((vs[r][a],vs[r][a+1],vs[r+1][a+1],vs[r+1][a]))
    me=bpy.data.meshes.new('skirt');bm.to_mesh(me);bm.free()
    o=bpy.data.objects.new('skirt',me);bpy.context.scene.collection.objects.link(o)
    for g in gname:o.vertex_groups.new(name=g)
    for v in me.vertices:
        t=(zt-v.co.z)/(zt-zb);d=Vector((v.co.x,v.co.y-cy,0)).normalized()
        front=max(0,-d.y)**.7;side='thigh_l' if v.co.x>0 else 'thigh_r'
        wt=min(1.0,t*1.25)*(.15+.85*front)
        o.vertex_groups['pelvis'].add([v.index],1-wt,'REPLACE');o.vertex_groups[side].add([v.index],wt,'REPLACE')
    return o
def stethoscope(surf):
    """трубка вокруг шеи поверх халата: точки выталкиваются наружу от поверхности (KD-дерево по одежде)"""
    from mathutils.kdtree import KDTree
    vs=[(o.matrix_world@v.co,(o.matrix_world.to_3x3()@v.normal).normalized()) for o in surf for v in o.data.vertices]
    kd=KDTree(len(vs))
    for i,(c,n) in enumerate(vs):kd.insert(c,i)
    kd.balance()
    nb=BONES['neck_01'][0];ax=Vector((0,nb.y,0))
    def push(p,clear=.010):
        for _ in range(60):
            c,i,d=kd.find(p);n=vs[i][1]
            if (p-c).dot(n)>0 and d>clear:break
            h=Vector((p.x,p.y-nb.y,0));h=h.normalized() if h.length>1e-4 else Vector((0,-1,0))
            p=p+(h*.6+n*.4).normalized()*.003
        return p
    raw=[]
    for i in range(17):
        th=math.radians(-140+280*i/16)       # 0 = сзади (+y)
        raw.append(Vector((.06*math.sin(th),nb.y+.06*math.cos(th),nb.z+.015-.025*(1-math.cos(th))/2)))
    for sgn,end in((1,0),(-1,-1)):
        p0=raw[end]
        ext=[Vector((p0.x+sgn*.004,p0.y-.02,p0.z-.08)),Vector((p0.x+sgn*.006,p0.y-.035,p0.z-.17)),Vector((p0.x+sgn*.002,p0.y-.04,p0.z-.25))]
        if end==0:raw=list(reversed(ext))+raw
        else:raw=raw+ext
    path=[push(p) for p in raw]
    # сгладить
    for _ in range(2):path=[path[0]]+[(path[i-1]+path[i]*2+path[i+1])/4 for i in range(1,len(path)-1)]+[path[-1]]
    path=[push(p,.008) for p in path]
    cu=bpy.data.curves.new('st','CURVE');cu.dimensions='3D';sp=cu.splines.new('POLY');sp.points.add(len(path)-1)
    for p,c in zip(sp.points,path):p.co=(*c,1)
    cu.bevel_depth=.004;cu.bevel_resolution=2;cu.use_fill_caps=True
    o=bpy.data.objects.new('steth',cu);bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH')
    o=bpy.context.active_object
    # головка
    bm=bmesh.new();bmesh.ops.create_cone(bm,cap_ends=True,segments=16,radius1=.02,radius2=.02,depth=.012,
        matrix=Matrix.Translation(path[-1]+Vector((0,-.006,-.014)))@Matrix.Rotation(math.pi/2,4,'X'))
    me2=bpy.data.meshes.new('h');bm.to_mesh(me2);bm.free();h=bpy.data.objects.new('h',me2);bpy.context.scene.collection.objects.link(h)
    bpy.ops.object.select_all(action='DESELECT');h.select_set(True);o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.join()
    for g in gname:o.vertex_groups.new(name=g)
    for v in o.data.vertices:
        k=max(0,min(1,(v.co.z-(nb.z-.08))/.08))
        o.vertex_groups['neck_01'].add([v.index],.6*k,'REPLACE');o.vertex_groups['spine_03'].add([v.index],1-.6*k,'REPLACE')
    vcol(o,lambda c,w:(.75,.76,.78) if c.z<path[-1].z+.004 else (.05,.05,.06))
    return o
SH=[]
top=CFG['top'];tc=Vector(top);CLO=CFG['cloth']
if 'coat' in CLO:
    c=make_shell('coat',sel_rule('top_long'),.020,10,extra=lambda co,w:.006*S(w,('lowerarm',))+.004*S(w,('upperarm',)))
    vcol(c,lambda co,w:tuple(tc));SH.append(c)
    s_=coat_skirt(.025,CFG.get('skirt_zb',-.07));vcol(s_,lambda co,w:tuple(tc));SH.append(s_)
    hide_body(sel_rule('top_long'))
for kind in('top_short','top_long','sweater'):
    if kind in CLO:
        r=sel_rule('top_short' if kind=='top_short' else 'top_long')
        c=make_shell('top',r,.010,10,extra=lambda co,w:.003*S(w,('upperarm','lowerarm')))
        vcol(c,lambda co,w:tuple(tc));SH.append(c);hide_body(r)
if 'skirt' in CLO:
    skc=Vector(CFG.get('skirt',top))
    s_=coat_skirt(CFG.get('skirt_off',.012),CFG.get('skirt_zb',0),slit=False,flare=CFG.get('skirt_flare',True));vcol(s_,lambda co,w:tuple(skc));SH.append(s_)
    _zb=z_knee+CFG.get('skirt_zb',0)+.04;_pr=sel_rule('pants');hide_body(lambda co,w:_pr(co,w) and co.z>_zb)
if 'pants' in CLO:
    pc=Vector(CFG['pants'])
    fl=.035 if ROLE=='rocker' else .010
    p=make_shell('pants',sel_rule('pants'),.012,8,extra=lambda co,w:fl*S(w,('calf',))*max(0,(z_knee-co.z)/z_knee)**(1.5 if ROLE=='rocker' else 1))
    vcol(p,lambda co,w:tuple(pc*(.55 if abs(co.z-(z_pel+.07))<.018 and ROLE not in('orderly','bighead','rocker') else 1)));SH.append(p);hide_body(sel_rule('pants'))
if 'shoes' in CLO:
    s_=make_shell('shoes',sel_rule('shoes'),.009,3);scc=Vector(CFG['shoes'])
    vcol(s_,lambda co,w:tuple(scc*(.4 if co.z<.025 else 1)));SH.append(s_);hide_body(sel_rule('shoes'))
if 'wrap' in CLO:   # мумия: бинты по всему телу, кроме щели для глаз
    eyez=sum(v.co.z for v in EYES.data.vertices)/len(EYES.data.vertices)
    rw=lambda co,w:not(abs(co.z-eyez)<.016 and co.y<-.05 and abs(co.x)<.075)
    c=make_shell('wrap',rw,.007,4,extra=lambda co,w:.004*(math.sin(co.z*260+co.x*90)>0));vcol(c,lambda co,w:tuple(tc));SH.append(c)
    hide_body(lambda co,w:rw(co,w) and S(w,('Head',))<.5)
if 'steth' in CLO:SH.append(stethoscope([o for o in SH]+[BODY]))
# объединить одежду
bpy.ops.object.select_all(action='DESELECT')
for o in SH:o.select_set(True)
bpy.context.view_layer.objects.active=SH[0];bpy.ops.object.join();CL=bpy.context.active_object;CL.name='Clothes'
# ---------- 3. запекание текстур одежды ----------
me=CL.data;me.uv_layers.new(name='UVMap');bpy.context.view_layer.objects.active=CL
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.smart_project(angle_limit=math.radians(60),island_margin=.004)
bpy.ops.uv.pack_islands(margin=.003);bpy.ops.object.mode_set(mode='OBJECT')
for p in me.polygons:p.use_smooth=True
src=bpy.data.materials.new('cloth_src');src.use_nodes=True;nt=src.node_tree;N=nt.nodes;Lk=nt.links
bs=N['Principled BSDF'];va=N.new('ShaderNodeVertexColor');va.layer_name='col'
tco=N.new('ShaderNodeTexCoord')
# ткань: мелкое плетение (wave x2) + крупные складки (растянутый шум)
w1=N.new('ShaderNodeTexWave');w1.inputs['Scale'].default_value=180;w1.wave_profile='SIN';w1.bands_direction='X'
w2=N.new('ShaderNodeTexWave');w2.inputs['Scale'].default_value=180;w2.wave_profile='SIN';w2.bands_direction='Z'
mp=N.new('ShaderNodeMapping');mp.inputs['Scale'].default_value=(4,4,1.2)
nz=N.new('ShaderNodeTexNoise');nz.inputs['Scale'].default_value=9;nz.inputs['Detail'].default_value=4
for w in(w1,w2):Lk.new(tco.outputs['Object'],w.inputs['Vector'])
Lk.new(tco.outputs['Object'],mp.inputs['Vector']);Lk.new(mp.outputs[0],nz.inputs['Vector'])
mx=N.new('ShaderNodeMath');mx.operation='ADD';Lk.new(w1.outputs['Fac'],mx.inputs[0]);Lk.new(w2.outputs['Fac'],mx.inputs[1])
fine=N.new('ShaderNodeMath');fine.operation='MULTIPLY';fine.inputs[1].default_value=.0;Lk.new(mx.outputs[0],fine.inputs[0])
h=N.new('ShaderNodeMath');h.operation='ADD';Lk.new(fine.outputs[0],h.inputs[0]);Lk.new(nz.outputs['Fac'],h.inputs[1])
bump=N.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.35;bump.inputs['Distance'].default_value=.01;Lk.new(h.outputs[0],bump.inputs['Height'])
Lk.new(bump.outputs[0],bs.inputs['Normal'])
# альбедо = цвет * (0.9..1.05 шум) * AO
ao=N.new('ShaderNodeAmbientOcclusion');ao.inputs['Distance'].default_value=.12;ao.samples=12
nm=N.new('ShaderNodeMapRange');nm.inputs[3].default_value=.88;nm.inputs[4].default_value=1.04;Lk.new(nz.outputs['Fac'],nm.inputs[0])
c1=N.new('ShaderNodeMix');c1.data_type='RGBA';c1.blend_type='MULTIPLY';c1.inputs['Factor'].default_value=1
Lk.new(va.outputs['Color'],c1.inputs[6]);Lk.new(nm.outputs[0],c1.inputs[7])
aom=N.new('ShaderNodeMapRange');aom.inputs[3].default_value=.45;aom.inputs[4].default_value=1;Lk.new(ao.outputs['AO'],aom.inputs[0])
c2=N.new('ShaderNodeMix');c2.data_type='RGBA';c2.blend_type='MULTIPLY';c2.inputs['Factor'].default_value=1
Lk.new(c1.outputs[2],c2.inputs[6]);Lk.new(aom.outputs[0],c2.inputs[7])
em=N.new('ShaderNodeEmission');Lk.new(c2.outputs[2],em.inputs[0])
rgh=N.new('ShaderNodeMapRange');rgh.inputs[3].default_value=.72;rgh.inputs[4].default_value=.9;Lk.new(nz.outputs['Fac'],rgh.inputs[0])
out=N['Material Output'];CL.data.materials.clear();CL.data.materials.append(src)
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=16;sc.cycles.device='CPU';sc.render.bake.margin=8
TS=int(os.environ.get('TS','1024'))
imgs={}
def bake(kind,typ,src_socket=None,colorspace='sRGB',flt=False):
    img=bpy.data.images.new(f'{ROLE}_cloth_{kind}',TS,TS,float_buffer=flt);img.colorspace_settings.name=colorspace
    t=N.new('ShaderNodeTexImage');t.image=img;N.active=t
    if src_socket is not None:Lk.new(src_socket,out.inputs['Surface'])
    bpy.ops.object.select_all(action='DESELECT');CL.select_set(True);bpy.context.view_layer.objects.active=CL
    if typ=='NORMAL':Lk.new(bs.outputs[0],out.inputs['Surface'])
    sc.cycles.samples=16 if kind=='shade' else 1
    bpy.ops.object.bake(type=typ,normal_space='TANGENT')
    N.remove(t);imgs[kind]=img
def E(sock):
    e=N.new('ShaderNodeEmission');Lk.new(sock,e.inputs[0]);return e.outputs[0]
# shade = шум ткани * AO (серый)
sh=N.new('ShaderNodeMix');sh.data_type='RGBA';sh.blend_type='MULTIPLY';sh.inputs['Factor'].default_value=1
Lk.new(nm.outputs[0],sh.inputs[6]);Lk.new(aom.outputs[0],sh.inputs[7])
bake('vcol','EMIT',E(va.outputs['Color']),'Non-Color',True)
bake('shade','EMIT',E(sh.outputs[2]),'Non-Color',True)
bake('pos','EMIT',E(tco.outputs['Object']),'Non-Color',True)
bake('rough','EMIT',E(rgh.outputs[0]),'Non-Color')
bake('normal','NORMAL',None,'Non-Color')
def arr(img):return np.array(img.pixels[:],dtype=np.float32).reshape(TS,TS,4)
VC=arr(imgs['vcol'])[...,:3];SHd=arr(imgs['shade'])[...,0];P=arr(imgs['pos'])[...,:3]
X,Y,Z=P[...,0],P[...,1],P[...,2]
nx=BONES['neck_01'][0];dz=nx.z-Z;FR=Y<BONES['spine_02'][0].y-.0
alb=VC.copy()
def near(c,t=.06):return np.abs(VC-np.array(c)).sum(-1)<t
def put(mask,col,k=1.0):
    alb[mask]=alb[mask]*(1-k)+np.array(col)*k
def rect_outline(x0,x1,z0,z1,w=.004):
    inside=(X>x0)&(X<x1)&(Z>z0)&(Z<z1);inner=(X>x0+w)&(X<x1-w)&(Z>z0+w)&(Z<z1-w);return inside&~inner,inside
TOP=near(CFG['top'])
CLO=CFG['cloth'];T_=np.array(CFG['top'])
if 'coat' in CLO:
    vw=.085*(1-dz/.32)+.016;V=TOP&FR&(dz>-.01)&(dz<.32)&(np.abs(X)<vw)
    shirt=np.array(CFG['shirt'])*(0.93+0.07*(np.sin(Z*900)>0))[...,None]
    alb[V]=shirt[V]
    if CFG.get('tie'):
        tie=V&(np.abs(X)<.012+.02*np.clip(dz,0,.3))&(dz>.035)&(dz<.30);put(tie,CFG['tie'])
        put(V&(np.abs(X)<.016)&(dz>.02)&(dz<.04),np.array(CFG['tie'])*.8)
    lap=TOP&FR&(np.abs(np.abs(X)-vw)<.006)&(dz>-.01)&(dz<.33);put(lap,T_*.8,.7)
    put(TOP&FR&(np.abs(X)<.0025)&(dz>.32)&(Z>z_pel-.25),T_*.82,.6)
    for k in range(4):
        put(TOP&FR&(((X-.012)**2+(Z-(nx.z-.36-k*.11))**2)<.008**2),T_*.6)
        if ROLE=='invisible':put(TOP&FR&(((X+.05)**2+(Z-(nx.z-.36-k*.11))**2)<.009**2),T_*.5)
    if ROLE=='doctor':
        o,i=rect_outline(.06,.15,nx.z-.31,nx.z-.20);put(TOP&FR&o,(.7,.7,.68),.7)
        put(TOP&FR&(X>.085)&(X<.093)&(Z>nx.z-.24)&(Z<nx.z-.19),(.15,.25,.75));put(TOP&FR&(X>.10)&(X<.108)&(Z>nx.z-.235)&(Z<nx.z-.19),(.85,.15,.15))
        o,i=rect_outline(-.16,-.07,nx.z-.27,nx.z-.21,.003);put(TOP&FR&i,(.95,.97,1.0));put(TOP&FR&o,(.2,.45,.8))
    else:
        put(TOP&(np.abs(Z-(z_pel+.10))<.025),T_*.75)   # пояс тренча
        put(TOP&FR&(np.abs(Z-(z_pel+.10))<.02)&(np.abs(X-.04)<.02),(.75,.62,.25))
    for sg in(1,-1):
        o,i=rect_outline(*(sorted((sg*.08,sg*.21))),z_pel-.20,z_pel-.06);put(TOP&FR&o,T_*.75,.7)
if ROLE=='nurse':
    vw=.06*(1-dz/.14)+.012;put(TOP&FR&(dz>-.01)&(dz<.14)&(np.abs(np.abs(X)-vw)<.008),(.97,.97,.99))
    o,i=rect_outline(-.14,-.06,nx.z-.25,nx.z-.20,.003);put(TOP&FR&i,(.97,.97,1.0));put(TOP&FR&o,(.3,.3,.35))
    put(near(CFG['top'])&(np.abs(Z-(z_pel+.10))<.015),(.97,.97,.99))   # белый поясок
    put(near(CFG['top'])&(np.abs(Z-(z_knee+.02))<.012),(.97,.97,.99))
if ROLE=='orderly':   # комбинезон: нагрудник, карман, пуговицы, пояс
    o,i=rect_outline(-.11,.11,nx.z-.42,nx.z-.14,.006);put(TOP&FR&o,T_*.72)
    o,i=rect_outline(-.06,.06,nx.z-.33,nx.z-.22,.004);put(TOP&FR&o,T_*.72)
    for sg in(1,-1):put(TOP&FR&(((X-sg*.09)**2+(Z-(nx.z-.16))**2)<.009**2),(.85,.75,.3))
    put(TOP&(np.abs(Z-(z_pel+.06))<.02),T_*.7);put(TOP&(np.abs(X)>.0)&(np.abs(np.abs(X)-.0)<0),T_)
    put(TOP&~FR&(np.abs(np.abs(X)-.07)<.012)&(Z>z_pel+.06),T_*.8)
if ROLE=='receptionist':
    vw=.07*(1-dz/.30)+.016
    vest=TOP&(np.abs(X)<.185)&(Z>z_pel-.02)&(dz>.02)&~(FR&(np.abs(X)<vw)&(dz<.30))
    alb[vest]=np.array(CFG['vest'])*(0.95+0.05*(np.sin(Z*600)>0))[vest][:,None]
    for k in range(3):put(TOP&FR&(((X-.02)**2+(Z-(nx.z-.34-k*.07))**2)<.008**2),(.9,.85,.6))
    put(TOP&FR&(np.abs(X)<vw+.006)&(np.abs(X)>vw-.004)&(dz<.30)&(dz>0),np.array(CFG['vest'])*.7)
if ROLE=='rocker':   # блёстки, фиолетовые лампасы-клёш, глубокий вырез, пояс
    rng=np.random.default_rng(3);sp=rng.random((TS,TS))>.985
    put(sp,(.75,.85,1.0));put(sp&(rng.random((TS,TS))>.5),(1.0,.85,.4))
    tr=np.array(CFG['trim'])
    put(near(CFG['top'],.3)&(Z<z_knee+.05)&(np.abs(X)>.11),tr)
    put(TOP&(np.abs(Z-(z_pel+.06))<.03),(.95,.78,.25))
    put(TOP&FR&(dz>-.01)&(dz<.22)&(np.abs(X)<.07*(1-dz/.22)+.012),(.93,.74,.62))
    put(TOP&FR&(np.abs(np.abs(X)-(.07*(1-dz/.22)+.012))<.01)&(dz>-.01)&(dz<.22),tr)
if ROLE=='bighead':
    put(TOP&FR&(dz>-.01)&(dz<.12)&(np.abs(np.abs(X)-(.06*(1-dz/.12)+.012))<.007),T_*.8)
    put(TOP&(np.abs(Z-(z_pel+.07))<.01),T_*.85)
if ROLE=='mummy':
    st=np.sin((Z*1.0+X*.35)*190)+.3*np.sin((Z-X*.6)*70)
    alb*=(0.82+0.18*(st>-.2))[...,None];put(TOP&(np.abs(np.sin((Z*1.0+X*.35)*190))<.12),T_*.7,.6)
    put(TOP&(np.random.default_rng(1).random((TS,TS))>.993),(.6,.55,.42),.5)
if 'sweater' in CLO:
    rib=TOP&(Z<z_pel+.06)&(Z>z_pel-.05);put(rib,T_*.85,.6)
    knit=TOP&(np.sin(X*260+np.sin(Z*130)*1.5)>.6);put(knit,T_*.88,.5)
    if ROLE=='patient_b':
        put(TOP&FR&(np.abs(X)<.003),T_*.6)
        for k in range(5):put(TOP&FR&(((X-.01)**2+(Z-(nx.z-.12-k*.09))**2)<.0065**2),(.9,.85,.75))
    else:put(TOP&FR&(dz>-.02)&(dz<.035)&(np.abs(X)<.07),T_*.8,.7)
if ROLE=='patient_a' and 'pants' in CFG:
    PN=near(CFG['pants'])
    put(PN&(np.sin(Z*900+X*900)>.3),np.array(CFG['pants'])*1.25,.5)
    for sg in(1,-1):o,i=rect_outline(*(sorted((sg*.07,sg*.16))),z_pel-.08,z_pel+.04,.003);put(PN&FR&o,(.75,.45,.15),.8)
alb*=np.clip(SHd,0,1.2)[...,None]
alb=np.clip(alb,0,1)
bimg=bpy.data.images.new(f'{ROLE}_cloth_base',TS,TS);bimg.pixels=np.concatenate([alb,np.ones((TS,TS,1),np.float32)],-1).ravel()
imgs['base']=bimg
for k in('vcol','shade','pos'):bpy.data.images.remove(imgs.pop(k))
fm=bpy.data.materials.new('MI_Cloth');fm.use_nodes=True;n=fm.node_tree.nodes;b=n['Principled BSDF']
def tex(img,sock,nonc=False,normal=False):
    t=n.new('ShaderNodeTexImage');t.image=img
    if normal:nm_=n.new('ShaderNodeNormalMap');fm.node_tree.links.new(t.outputs[0],nm_.inputs['Color']);fm.node_tree.links.new(nm_.outputs[0],b.inputs['Normal'])
    else:fm.node_tree.links.new(t.outputs[0],b.inputs[sock])
tex(imgs['base'],'Base Color');tex(imgs['rough'],'Roughness');tex(imgs['normal'],None,normal=True)
fm.use_backface_culling=False
CL.data.materials.clear();CL.data.materials.append(fm)
CL.data.color_attributes.remove(CL.data.color_attributes['col'])
# ---------- 4. кожа/волосы/глаза ----------
bm_=BODY.active_material
def set_tex(mat,base=None,normal=None,rough=None,tint=None):
    nt=mat.node_tree;b=nt.nodes['Principled BSDF']
    for nn in list(nt.nodes):
        if nn.type in('TEX_IMAGE','NORMAL_MAP','SEPARATE_COLOR','MIX','MIX_RGB'):nt.nodes.remove(nn)
    def T(p,cs='sRGB'):
        t=nt.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(p,check_existing=True);t.image.colorspace_settings.name=cs;return t
    if base:
        t=T(base)
        if tint:
            m=nt.nodes.new('ShaderNodeMix');m.data_type='RGBA';m.blend_type='MULTIPLY';m.inputs['Factor'].default_value=1
            nt.links.new(t.outputs[0],m.inputs[6]);m.inputs[7].default_value=(*tint,1);nt.links.new(m.outputs[2],b.inputs['Base Color'])
        else:nt.links.new(t.outputs[0],b.inputs['Base Color'])
    if normal:
        t=T(normal,'Non-Color');nm_=nt.nodes.new('ShaderNodeNormalMap');nt.links.new(t.outputs[0],nm_.inputs['Color']);nt.links.new(nm_.outputs[0],b.inputs['Normal'])
    if rough:t=T(rough,'Non-Color');nt.links.new(t.outputs[0],b.inputs['Roughness'])
    b.inputs['Metallic'].default_value=0
set_tex(bm_,TX+CFG['skin'],TX+f"T_Superhero_{CFG['sex']}_Normal.png",TX+f"T_Superhero_{CFG['sex']}_Roughness.png")
set_tex(EYES.active_material,TX+'T_Eye_Brown.png',TX+'T_Eye_Normal.png');EYES.active_material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.15
bh=1 if MALE else 2
set_tex(BROWS.active_material,TX+f'T_Hair_{bh}_BaseColor.png',TX+f'T_Hair_{bh}_Normal.png',tint=CFG['hairc'])
# ---------- 5. лицо: веки (моргание), брови (поднять/нахмурить), улыбка ----------
HX=BONES['Head'][0]
def eyelids():
    ev=[v.co for v in EYES.data.vertices];objs=[]
    for sgn in(1,-1):
        p=[c for c in ev if c.x*sgn>0];mn=Vector((min(c.x for c in p),min(c.y for c in p),min(c.z for c in p)));mxv=Vector((max(c.x for c in p),max(c.y for c in p),max(c.z for c in p)))
        rr=max(mxv.x-mn.x,mxv.z-mn.z)/2;ctr=Vector(((mn.x+mxv.x)/2,mn.y+rr,(mn.z+mxv.z)/2))
        bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=16,v_segments=10,radius=rr*1.12)
        bmesh.ops.delete(bm,geom=[v for v in bm.verts if v.co.y>rr*.15],context='VERTS')   # передняя полусфера
        me=bpy.data.meshes.new('lid');bm.to_mesh(me);bm.free()
        o=bpy.data.objects.new('lid',me);bpy.context.scene.collection.objects.link(o);objs.append((o,ctr))
    bpy.ops.object.select_all(action='DESELECT')
    for o,c in objs:o.location=c;o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0][0];bpy.ops.object.transform_apply(location=True);bpy.ops.object.join();o=bpy.context.active_object;o.name='Eyelids'
    # базис: веко поднято (повернуто вверх в череп), shape key blink — закрыто
    cs=[c for _,c in objs]
    closed=[v.co.copy() for v in o.data.vertices]
    for v in o.data.vertices:
        c=cs[0] if (v.co.x>0)==(cs[0].x>0) else cs[1]
        v.co=c+Matrix.Rotation(math.radians(-105),3,'X')@(v.co-c)
    o.shape_key_add(name='Basis');k=o.shape_key_add(name='blink')
    for i,c in enumerate(closed):k.data[i].co=c
    # кожа: один UV-пиксель лба
    o.data.uv_layers.new(name='UVMap')
    bi=min(range(len(BODY.data.vertices)),key=lambda i:(BODY.data.vertices[i].co-(cs[0]+Vector((0,-.005,.03)))).length)
    uv=None
    for l in BODY.data.loops:
        if l.vertex_index==bi:uv=BODY.data.uv_layers[0].data[l.index].uv.copy();break
    for d in o.data.uv_layers[0].data:d.uv=uv
    o.data.materials.append(bm_)
    for g in gname:o.vertex_groups.new(name=g)
    o.vertex_groups['Head'].add(list(range(len(o.data.vertices))),1,'REPLACE')
    for p in o.data.polygons:p.use_smooth=True
    return o
LIDS=eyelids()
# брови
BROWS.shape_key_add(name='Basis');kr=BROWS.shape_key_add(name='raise');kf=BROWS.shape_key_add(name='frown')
xs=max(abs(v.co.x) for v in BROWS.data.vertices)
for v in BROWS.data.vertices:
    inner=1-min(1,abs(v.co.x)/xs)
    kr.data[v.index].co=v.co+Vector((0,0,.006+.002*inner))
    kf.data[v.index].co=v.co+Vector((-math.copysign(.003*inner,v.co.x),0,-.004*inner+.001*(1-inner)))
# улыбка: уголки рта на теле
ey=EYES.matrix_world.translation;eyez=sum(v.co.z for v in EYES.data.vertices)/len(EYES.data.vertices)
fy=min(v.co.y for v in BODY.data.vertices if abs(v.co.z-(eyez-.07))<.01 and abs(v.co.x)<.01)
BODY.shape_key_add(name='Basis');ks=BODY.shape_key_add(name='smile')
mw=.026 if MALE else .022
for v in BODY.data.vertices:
    for sgn in(1,-1):
        c=Vector((sgn*mw,fy+.012,eyez-.072));d=(v.co-c).length
        if d<.022:
            f=(1-d/.022)**2;ks.data[v.index].co=v.co+f*Vector((sgn*.003,.002,.005))
# ---------- 6. волосы ----------
for hn in CFG['hair']:
    before=set(bpy.data.objects);bpy.ops.import_scene.gltf(filepath=HD+hn+'.gltf');new=[o for o in bpy.data.objects if o not in before]
    for o in new:
        if o.type!='MESH':bpy.data.objects.remove(o);continue
        mw_=o.matrix_world.copy();o.parent=None;o.matrix_world=mw_;bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
        for g in list(o.vertex_groups):o.vertex_groups.remove(g)
        for g in gname:o.vertex_groups.new(name=g)
        o.vertex_groups['Head'].add(list(range(len(o.data.vertices))),1,'REPLACE')
        o.name=hn
        k=CFG.get('hairscale',1.0)
        if k!=1.0:
            hb=BONES['Head'][0];ctr=Vector((0,hb.y,hb.z+.09))
            for v in o.data.vertices:
                d=v.co-ctr;up=max(0,d.z)/.1
                if ROLE=='rocker':v.co=ctr+Vector((d.x*1.12,d.y*1.1-.04*up*(d.y<0),d.z*(1+(k-1)*up)))
                else:v.co=ctr+d*k
        m=o.active_material;hn_=1 if 'Hair_1' in m.name else 2
        set_tex(m,TX+f'T_Hair_{hn_}_BaseColor.png',TX+f'T_Hair_{hn_}_Normal.png',tint=CFG['hairc'])
        m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.55
        if CFG.get('curly'):   # кудри: ~260 «колечек» по поверхности причёски
            import bmesh,random;random.seed(7);bm=bmesh.new();me_=o.data
            hb=BONES['Head'][0];ctr=Vector((0,hb.y,hb.z+.08))
            pts=[]
            for p in me_.polygons:
                c=p.center
                if (c-ctr).length>.06 and p.normal.dot((c-ctr).normalized())>.2:pts.append((c.copy(),p.normal.copy(),p.area))
            random.shuffle(pts)
            sel=[];mind=.026
            for c,n,a in pts:
                if all((c-q).length>mind for q,_ in sel):sel.append((c,n))
                if len(sel)>300:break
            for c,n in sel:
                r=random.uniform(.019,.028)
                g=bmesh.ops.create_icosphere(bm,subdivisions=1,radius=r,calc_uvs=True)
                ax=n.to_track_quat('Z','Y').to_matrix().to_4x4()
                sq=Matrix.Diagonal((1,1,.7,1))
                bmesh.ops.transform(bm,matrix=Matrix.Translation(c+n*r*.35)@ax@sq,verts=g['verts'])
            cm=bpy.data.meshes.new('Curls');bm.to_mesh(cm);co=bpy.data.objects.new('Hair_Curls',cm);bpy.context.collection.objects.link(co)
            cmat=bpy.data.materials.new('MI_Curls');cmat.use_nodes=True;pb=cmat.node_tree.nodes['Principled BSDF']
            pb.inputs['Base Color'].default_value=(*[x**1.7 for x in CFG['hairc']],1);pb.inputs['Roughness'].default_value=.6
            cm.materials.append(cmat)
            for g in gname:co.vertex_groups.new(name=g)
            co.vertex_groups['Head'].add(list(range(len(cm.vertices))),1,'REPLACE')
            print('CURLS',len(sel))
for o in [o for o in bpy.data.objects if o.type=='MESH']:
    if o.parent is None:o.parent=ARM
    if not any(m.type=='ARMATURE' for m in o.modifiers):md=o.modifiers.new('Armature','ARMATURE');md.object=ARM
# брови/волосы — тонировать цвет (textures grayscale?) -> оставим текстуру, но умножим базовый фактор при экспорте через JS
# ---------- 7. экспорт ----------
for img in bpy.data.images:
    if img.size[0]>1024:img.scale(1024,1024)
for o in bpy.data.objects:
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True

# v45 friendly receptionist face: softer brows, slight smile shape via eyelid/brow scale
if CFG.get('friendly'):
    for o in bpy.data.objects:
        if o.name=='Eyebrows':
            o.scale=(.92,.85,.92); o.location.z -= 0.004
        if o.name=='Eyelids':
            # slightly more open / relaxed
            o.scale=(1.02,1.04,1.02)
        if o.name.startswith('Hair_'):
            o.scale = tuple(s*CFG.get('hairscale',1.0) for s in o.scale) if False else o.scale
    # small badge on chest (simple flat plate parented to BODY via join later — add as separate mesh)
    import bmesh
    bm=bmesh.new(); bmesh.ops.create_grid(bm, size=.03, x_segments=1, y_segments=1)
    me=bpy.data.meshes.new('Badge'); bm.to_mesh(me); bm.free()
    badge=bpy.data.objects.new('Badge',me); bpy.context.collection.objects.link(badge)
    badge.location=(0.08, -0.12, 1.15); badge.rotation_euler=(1.2,0,.3)
    mat=bpy.data.materials.new('BadgeMat'); mat.use_nodes=True
    mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.25,.55,.75,1)
    mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.4
    badge.data.materials.append(mat)

bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_image_format='JPEG',export_jpeg_quality=86,export_draco_mesh_compression_enable=True,
    export_animations=False,export_morph=True,export_morph_normal=False,export_skins=True,export_yup=True,export_apply=False)
for im in bpy.data.images:
    if 'cloth' in im.name:im.filepath_raw=OUT.replace('.glb','_'+im.name.split('_')[-1]+'.png');im.file_format='PNG';im.save()
for im in list(bpy.data.images):
    if im.filepath and not os.path.exists(bpy.path.abspath(im.filepath)) and not im.packed_file and im.source=='FILE':bpy.data.images.remove(im)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=OUT.replace('.glb','.blend'))
print('DONE',ROLE,{o.name:len(o.data.vertices) for o in bpy.data.objects if o.type=='MESH'})
