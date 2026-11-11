import bpy
bpy.ops.wm.open_mainfile(filepath='out/doctor.blend')
for o in bpy.data.objects:print(o.name,o.type,o.parent and o.parent.name,[(m.type,m.object and m.object.name) for m in o.modifiers],len(o.vertex_groups), o.data.shape_keys and [k.name for k in o.data.shape_keys.key_blocks] if o.type=='MESH' else '')
b=bpy.data.objects['SuperHero_Male'];import collections
c=collections.Counter(len(v.groups) for v in b.data.vertices);print(c)
