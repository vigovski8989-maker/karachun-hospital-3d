"""blender -b -P bake_room.py -- out_dir  : лайтмап (diffuse direct+indirect) в 2-й UV, экспорт room.glb + lightmap.png"""
import bpy,sys,os,math
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import room
OUT=sys.argv[sys.argv.index('--')+1:][0];os.makedirs(OUT,exist_ok=True)
SIZE=int(os.environ.get('LM','1024'));SAMP=int(os.environ.get('SAMP','96'))
bpy.ops.wm.read_factory_settings(use_empty=True)
objs,M=room.build();room.lights()
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=SAMP;sc.cycles.use_denoising=False;sc.render.threads=6
# один меш
ARCH=('floor','corr','wall','base','corwall','window','wframe','desk','couch','bench','door','pot','cleg','bleg','monitor','papers','mstand')
arch=[o for o in objs if o.name.split('.')[0] in ARCH or o.name.startswith(('wall','desk','base'))];rest=[o for o in objs if o not in arch]
def join(lst,name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in lst:o.select_set(True)
    bpy.context.view_layer.objects.active=lst[0];bpy.ops.object.join();o=bpy.context.active_object;o.name=name;return o
P=join(rest,'props');R=join(arch,'room')
bpy.ops.object.select_all(action='DESELECT');R.select_set(True);bpy.context.view_layer.objects.active=R
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
me=R.data;print('ARCH',len(arch),'PROPS',len(rest))
if not me.uv_layers:me.uv_layers.new(name='UVMap')
lm=me.uv_layers.new(name='LM');me.uv_layers.active=lm
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66),island_margin=.01,area_weight=1.0)
bpy.ops.uv.pack_islands(margin=.003)
bpy.ops.object.mode_set(mode='OBJECT')
img=bpy.data.images.new('lightmap',SIZE,SIZE,float_buffer=True)
for m in me.materials:
    nt=m.node_tree;n=nt.nodes.new('ShaderNodeTexImage');n.image=img;nt.nodes.active=n
    uvn=nt.nodes.new('ShaderNodeUVMap');uvn.uv_map='LM';nt.links.new(uvn.outputs[0],n.inputs[0])
sc.render.bake.use_pass_direct=True;sc.render.bake.use_pass_indirect=True;sc.render.bake.use_pass_color=False;sc.render.bake.margin=6
bpy.ops.object.bake(type='DIFFUSE')
# лайтмап в 8-бит с делением на 2 (в three: lightMapIntensity=2·π)
import numpy as np
px=np.array(img.pixels[:]).reshape(-1,4);px[:,:3]=np.clip(px[:,:3]/2.0,0,1)**(1/2.2);px[:,3]=1
o=bpy.data.images.new('lm8',SIZE,SIZE);o.pixels=px.ravel().tolist();o.filepath_raw=os.path.join(OUT,'lightmap.png');o.file_format='PNG';o.save()
# очистка нод и упрощение материалов для glTF
for m in set(list(me.materials)+list(P.data.materials)):
    nt=m.node_tree
    for n in list(nt.nodes):
        if n.type in('TEX_IMAGE','UVMAP'):nt.nodes.remove(n)
    b=nt.nodes.get('Principled BSDF')
    for inp in('Base Color','Normal','Roughness','Metallic'):
        for l in list(b.inputs[inp].links):nt.links.remove(l)
for o in list(sc.objects):
    if o.type!='MESH':bpy.data.objects.remove(o)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'room.glb'),export_format='GLB',export_texcoords=True,export_draco_mesh_compression_enable=True,export_yup=True,export_lights=False,export_cameras=False)
print('BAKED',len(me.polygons))
