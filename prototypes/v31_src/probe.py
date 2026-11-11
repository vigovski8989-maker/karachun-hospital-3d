import bpy,sys
bpy.ops.wm.read_factory_settings(use_empty=True)
D="/workspace/assets_cc0/ubc/Universal Base Characters[Standard]/Base Characters/Godot - UE/"
for f in ("Superhero_Male_FullBody.gltf","Superhero_Female_FullBody.gltf"):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=D+f)
    for o in bpy.data.objects:
        info=(o.name,o.type,tuple(round(v,3) for v in o.scale),o.parent.name if o.parent else None)
        if o.type=='MESH':
            import mathutils
            bb=[o.matrix_world@mathutils.Vector(c) for c in o.bound_box]
            info+=(len(o.data.vertices),len(o.data.polygons),[round(min(v[i] for v in bb),3) for i in range(3)],[round(max(v[i] for v in bb),3) for i in range(3)],[m.name for m in o.data.materials],len(o.vertex_groups))
        print(info)
    a=[o for o in bpy.data.objects if o.type=='ARMATURE'][0]
    for b in ('Head','hand_r','upperarm_r','pelvis'):
        bb=a.pose.bones[b];print(b,a.matrix_world@bb.head,a.matrix_world@bb.tail)
