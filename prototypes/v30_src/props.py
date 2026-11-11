"""blender -b -P props.py -- out.glb : простые стилизованные пропсы (CC0, собственные). Ориентация Blender Z-up; точка origin = хват/посадка."""
import bpy,sys,math,bmesh
from mathutils import Vector
OUT=sys.argv[sys.argv.index('--')+1]
bpy.ops.wm.read_factory_settings(use_empty=True)
MAT={}
def mat(n,c,r=.5,m=0,a=1):
    if n in MAT:return MAT[n]
    x=bpy.data.materials.new(n);x.use_nodes=True;b=x.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=(*c,1);b.inputs['Roughness'].default_value=r;b.inputs['Metallic'].default_value=m
    if a<1:b.inputs['Alpha'].default_value=a;x.blend_method='BLEND'
    MAT[n]=x;return x
def P(kind,name,mt,loc=(0,0,0),rot=(0,0,0),sc=(1,1,1),**kw):
    getattr(bpy.ops.mesh,'primitive_'+kind+'_add')(location=loc,rotation=rot,**kw);o=bpy.context.active_object;o.scale=sc;o.name=name
    o.data.materials.append(mt);bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    bpy.ops.object.shade_smooth() if kind in('uv_sphere','ico_sphere','torus','cylinder','cone') else None;return o
def J(parts,name):
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:p.select_set(True)
    bpy.context.view_layer.objects.active=parts[0];bpy.ops.object.join();o=bpy.context.active_object;o.name=name
    for m in o.modifiers:pass
    md=o.modifiers.new('b','BEVEL');md.width=.003;md.segments=2;md.limit_method='ANGLE'
    bpy.ops.object.modifier_apply(modifier='b');return o
W=mat('white',(.95,.95,.93),.6);MET=mat('metal',(.8,.8,.82),.3,1);WOOD=mat('wood',(.45,.27,.13),.6)
# clipboard: хват за левый край
cb=J([P('cube','a',WOOD,(.115,0,0),sc=(.115,.16,.005)),P('cube','b',W,(.12,-.01,.006),sc=(.10,.135,.002)),
      P('cube','c',MET,(.115,.14,.009),sc=(.04,.018,.006))]+[P('cube',f'l{i}',mat('ink',(.3,.35,.5),.8),(.12,.08-i*.03,.0085),sc=(.07,.002,.001)) for i in range(7)],'clipboard')
# mop: хват на z=0, древко вниз
mop=J([P('cylinder','s',mat('blue',(.15,.35,.8),.5),(0,0,-.35),vertices=10,radius=.016,depth=1.5),
       P('cylinder','h',mat('grey',(.55,.55,.6),.5),(0,0,-1.1),vertices=10,radius=.04,depth=.06)]+
      [P('cylinder',f'f{i}',mat('mopf',(.85,.82,.72),.9),(.05*math.cos(i*.8),.05*math.sin(i*.8),-1.25),rot=(.25*math.sin(i*.8),-.25*math.cos(i*.8),0),vertices=6,radius=.012,depth=.26) for i in range(8)],'mop')
pl=J([P('cylinder','s',WOOD,(0,0,-.18),vertices=10,radius=.014,depth=.5),
      P('uv_sphere','c',mat('red',(.85,.1,.1),.35),(0,0,-.47),segments=16,ring_count=8,radius=.07,sc=(1,1,.75))],'plunger')
ph=J([P('cube','a',mat('phone',(.85,.15,.25),.35),(0,0,0),sc=(.025,.09,.012)),P('uv_sphere','e',mat('phone',(.85,.15,.25)),(0,.09,.012),segments=12,ring_count=6,radius=.03,sc=(1,1,.6)),
      P('uv_sphere','m',mat('phone',(.85,.15,.25)),(0,-.09,.012),segments=12,ring_count=6,radius=.03,sc=(1,1,.6))],'phone')
BL=mat('black',(.03,.03,.035),.4)
gl=J([P('torus','l',BL,(-.032,0,0),rot=(math.pi/2,0,0),major_radius=.024,minor_radius=.0025,major_segments=20,minor_segments=6),
      P('torus','r',BL,(.032,0,0),rot=(math.pi/2,0,0),major_radius=.024,minor_radius=.0025,major_segments=20,minor_segments=6),
      P('cylinder','b',BL,(0,0,.006),rot=(0,math.pi/2,0),vertices=6,radius=.002,depth=.018),
      P('cylinder','al',BL,(-.058,.05,0),rot=(math.pi/2,0,0),vertices=6,radius=.002,depth=.1),
      P('cylinder','ar',BL,(.058,.05,0),rot=(math.pi/2,0,0),vertices=6,radius=.002,depth=.1),
      P('cylinder','gl',mat('glass',(.8,.9,1),.05,0,.25),(-.032,0,0),rot=(math.pi/2,0,0),vertices=20,radius=.023,depth=.001),
      P('cylinder','gr',mat('glass',(.8,.9,1),.05,0,.25),(.032,0,0),rot=(math.pi/2,0,0),vertices=20,radius=.023,depth=.001)],'glasses')
HB=mat('hatbrown',(.32,.24,.16),.7)
hat=J([P('cylinder','br',HB,(0,0,0),vertices=32,radius=.17,depth=.012),P('cylinder','cr',HB,(0,0,.06),vertices=32,radius=.105,depth=.12,sc=(1,1.15,1)),
       P('cylinder','bd',mat('band',(.1,.08,.06),.6),(0,0,.025),vertices=32,radius=.107,depth=.03,sc=(1,1.15,1))],'hat')
# гитара (оригинальная форма): хват за гриф
GR=mat('guitar',(.9,.12,.15),.25);
body=[P('cylinder','b1',GR,(0,-.42,0),vertices=32,radius=.17,depth=.05),P('cylinder','b2',GR,(0,-.24,0),vertices=32,radius=.12,depth=.05),
      P('cylinder','pg',W,(.05,-.36,.026),vertices=24,radius=.08,depth=.004)]
gt=J(body+[P('cube','n',WOOD,(0,.05,.0),sc=(.025,.32,.012)),P('cube','hd',BL,(0,.42,0),sc=(.04,.06,.012)),
     P('cube','pu',BL,(0,-.33,.03),sc=(.05,.015,.006)),P('cube','pu2',BL,(0,-.43,.03),sc=(.05,.015,.006))]+
     [P('cylinder',f'st{i}',MET,(-.012+i*.005,-.05,.015),rot=(math.pi/2,0,0),vertices=4,radius=.0008,depth=.85) for i in range(6)],'guitar')
sy=J([P('cylinder','b',mat('syr',(.55,.85,1),.1,0,.55),(0,0,0),vertices=24,radius=.05,depth=.38),
      P('cylinder','l',mat('liq',(.2,.9,.5),.3),(0,0,-.06),vertices=24,radius=.045,depth=.24),
      P('cylinder','p',W,(0,0,.27),vertices=12,radius=.012,depth=.2),P('cylinder','t',W,(0,0,.38),vertices=24,radius=.05,depth=.02),
      P('cylinder','f',W,(0,0,.18),vertices=24,radius=.075,depth=.02),P('cone','c',W,(0,0,-.21),vertices=16,radius1=.05,radius2=.01,depth=.05),
      P('cylinder','n',MET,(0,0,-.32),vertices=6,radius=.003,depth=.18)],'syringe')
nc=J([P('cube','a',W,(0,0,.03),sc=(.08,.045,.035)),P('cube','r1',mat('red',(.85,.1,.1)),(0,-.046,.04),sc=(.012,.002,.004)),
      P('cube','r2',mat('red',(.85,.1,.1)),(0,-.046,.04),sc=(.004,.002,.012))],'nurse_cap')
oc=J([P('uv_sphere','d',mat('ocap',(.18,.32,.62),.6),(0,0,0),segments=24,ring_count=12,radius=.105,sc=(1,1.08,.75)),
      P('cylinder','v',mat('ocap',(.18,.32,.62)),(0,-.11,-.005),vertices=24,radius=.08,depth=.01,sc=(1,.8,1))],'orderly_cap')
for o in list(bpy.data.objects):
    if o.name in('a','b'):pass
# головной «камертон» для комнаты сдувания не нужен; экспорт
for i,o in enumerate([cb,mop,pl,ph,gl,hat,gt,sy,nc,oc]):o.location.x=i*.6
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_yup=True,export_apply=True,export_draco_mesh_compression_enable=True)
print('PROPS',[o.name for o in bpy.data.objects])
