import bpy,math,sys
from mathutils import Vector
IN,OUT=sys.argv[-2],sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=IN)
O={o.name:o for o in bpy.data.objects}
print('OBJ',[ (o.name,o.type) for o in bpy.data.objects])
B=O['Superhero_Female'];kb=B.data.shape_keys.key_blocks;base=kb['Basis'] if 'Basis' in kb else kb[0];sm=kb['smile']
# найти уголки рта по старому ключу
cor={}
for i,v in enumerate(base.data):
    d=(sm.data[i].co-v.co).length
    if d>1e-5:
        s=1 if v.co.x>0 else -1
        if s not in cor or d>cor[s][0]:cor[s]=(d,v.co.copy())
print('corners',cor)
for i,v in enumerate(base.data):
    co=v.co;new=co.copy()
    for s,(d0,c) in cor.items():
        d=(co-c).length
        if d<.03:
            f=(1-d/.03)**2;new+=f*Vector((s*.006,-.002,.011))
    # щёки чуть вверх
    for s,(d0,c) in cor.items():
        ch=c+Vector((s*.012,-.004,.022));d=(co-ch).length
        if d<.025:new+=(1-d/.025)**2*Vector((0,-.002,.004))
    sm.data[i].co=new
E=O['Eyebrows'];ek=E.data.shape_keys.key_blocks if E.data.shape_keys else None
for s in(1,-1):
    idx=[i for i,v in enumerate(E.data.vertices) if (v.co.x>0)==(s>0)]
    xs=[abs(E.data.vertices[i].co.x) for i in idx];x0,x1=min(xs),max(xs)
    import collections
    # центр по z для каждой полосы x
    for i in idx:
        v=E.data.vertices[i];t=(abs(v.co.x)-x0)/max(1e-6,x1-x0)
        nb=[E.data.vertices[j].co.z for j in idx if abs(abs(E.data.vertices[j].co.x)-abs(v.co.x))<.003]
        zc=sum(nb)/len(nb)
        dz=(zc+(v.co.z-zc)*.6-v.co.z)+.007*math.sin(math.pi*min(1,t*1.15))-.002*t+.002
        delta=Vector((0,0,dz))
        if ek:
            for k in ek:k.data[i].co+=delta
        else:v.co+=delta
for o in bpy.data.objects:
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_image_format='JPEG',export_jpeg_quality=86,export_draco_mesh_compression_enable=True,
    export_animations=False,export_morph=True,export_morph_normal=False,export_skins=True,export_yup=True,export_apply=False)
print('DONE')
