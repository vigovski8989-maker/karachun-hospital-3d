"""blender -b -P anims.py -- UAL.glb out.glb : только скелет + выбранные клипы UAL (CC0)."""
import bpy,sys
a=sys.argv[sys.argv.index('--')+1:];SRC,OUT=a
KEEP=['Idle_Loop','Idle_Talking_Loop','Walk_Loop','Walk_Formal_Loop','Sitting_Enter','Sitting_Exit','Sitting_Idle_Loop','Sitting_Talking_Loop',
 'Interact','PickUp_Table','Dance_Loop','Push_Loop','Fixing_Kneeling','Crouch_Idle_Loop','Jog_Fwd_Loop']
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=SRC)
print('ALL',sorted(x.name for x in bpy.data.actions))
arm=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
for o in list(bpy.data.objects):
    if o.type=='MESH':bpy.data.objects.remove(o)
for ac in list(bpy.data.actions):
    ac.name=ac.name.replace('_Armature','')
    if ac.name not in KEEP:bpy.data.actions.remove(ac)
    else:
        for fc in list(ac.fcurves):
            if fc.data_path.endswith('scale') or (fc.data_path.endswith('location') and 'pelvis' not in fc.data_path and 'root' not in fc.data_path):ac.fcurves.remove(fc)
ad=arm.animation_data or arm.animation_data_create();ad.action=None
for t in list(ad.nla_tracks):ad.nla_tracks.remove(t)
for ac in bpy.data.actions:
    t=ad.nla_tracks.new();t.name=ac.name;t.strips.new(ac.name,int(ac.frame_range[0]),ac)
print('KEPT',[x.name for x in bpy.data.actions])
bpy.ops.export_scene.gltf(filepath=OUT,export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_optimize_animation_size=True,export_force_sampling=True,export_frame_step=2,export_skins=True)
