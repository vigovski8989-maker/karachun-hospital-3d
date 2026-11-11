import bpy,sys,math
from mathutils import Vector
a=sys.argv[sys.argv.index('--')+1:];BL,OUTP,ACT,FR=a[0],a[1],a[2],int(a[3]);VIEW=a[4] if len(a)>4 else 'full'
bpy.ops.wm.open_mainfile(filepath=BL)
arm=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
if ACT!='none':
    before=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath="/workspace/assets_cc0/ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb")
    for o in set(bpy.data.objects)-before:bpy.data.objects.remove(o)
    act=[x for x in bpy.data.actions if x.name.startswith(ACT)][0]
    arm.animation_data_create();arm.animation_data.action=act
sc=bpy.context.scene;sc.frame_set(FR)
sc.render.engine='BLENDER_EEVEE_NEXT';sc.render.resolution_x=700;sc.render.resolution_y=900 if VIEW=='full' else 700
sc.view_settings.view_transform='AgX'
cam=bpy.data.objects.new('c',bpy.data.cameras.new('c'));sc.collection.objects.link(cam);sc.camera=cam
if VIEW=='full':cam.location=(1.6,-3.2,1.2);tgt=Vector((0,0,.9));cam.data.lens=50
else:
    hb=arm.matrix_world@arm.pose.bones['Head'].head;cam.location=hb+Vector((.25,-.55,.08));tgt=hb+Vector((0,0,.08));cam.data.lens=60
cam.rotation_euler=(tgt-cam.location).to_track_quat('-Z','Y').to_euler()
for loc,e in(((2,-2,3),800),((-2,-1,2),300),((0,2,2.5),400)):
    l=bpy.data.lights.new('l','AREA');l.energy=e;l.size=2;o=bpy.data.objects.new('l',l);sc.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1))-Vector(loc)).to_track_quat('-Z','Y').to_euler()
w=bpy.data.worlds.new('w');w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.35,.38,.42,1);sc.world=w
sc.render.filepath=OUTP;bpy.ops.render.render(write_still=True)
