import bpy,sys,math
from mathutils import Vector
a=sys.argv[sys.argv.index('--')+1:];bpy.ops.wm.open_mainfile(filepath=a[0])
sc=bpy.context.scene;sc.render.engine='BLENDER_EEVEE_NEXT';sc.render.resolution_x=400;sc.render.resolution_y=700
cam=bpy.data.objects.new('c',bpy.data.cameras.new('c'));sc.collection.objects.link(cam);sc.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=2.0
l=bpy.data.lights.new('s','SUN');l.energy=3;o=bpy.data.objects.new('s',l);sc.collection.objects.link(o);o.rotation_euler=(.6,.2,.5)
w=bpy.data.worlds.new('w');w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.5,.5,.55,1);sc.world=w
for i,ang in enumerate((0,90,180,35)):
    th=math.radians(ang);cam.location=(4*math.sin(th),-4*math.cos(th),1.0);cam.rotation_euler=(math.pi/2,0,th)
    sc.render.filepath=f'/tmp/v_{i}.png';bpy.ops.render.render(write_still=True)
