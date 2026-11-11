import bpy,mathutils
H="/workspace/assets_cc0/ubc/Universal Base Characters[Standard]/Hairstyles/Origin at 0/glTF (Godot)/"
import os;print(os.listdir(H))
for f in sorted(os.listdir(H)):
    if not f.endswith('.gltf'):continue
    bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=H+f)
    for o in bpy.data.objects:
        if o.type=='MESH':
            bb=[o.matrix_world@mathutils.Vector(c) for c in o.bound_box]
            print(f,o.name,len(o.data.vertices),[round(min(v[i] for v in bb),3) for i in range(3)],[round(max(v[i] for v in bb),3) for i in range(3)],[m.name for m in o.data.materials])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath="/workspace/assets_cc0/ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb")
a=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
for b in ('Head','pelvis','hand_r'):print('UAL',b,a.matrix_world@a.data.bones[b].head_local)
for o in bpy.data.objects:print(o.name,o.type)
