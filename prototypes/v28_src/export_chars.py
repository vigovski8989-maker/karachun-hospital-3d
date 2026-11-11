"""blender -b -P export_chars.py -- out_dir"""
import bpy,sys,os,math
sys.path.insert(0,'/workspace/hospital-game/tools/blender');sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import rig,anim,acts
from chars import STAFF,PAT
OUT=sys.argv[sys.argv.index('--')+1:][0];os.makedirs(OUT,exist_ok=True)
def flatten_mats():
    for m in bpy.data.materials:
        if not m.use_nodes:continue
        nt=m.node_tree;b=nt.nodes.get('Principled BSDF')
        if not b:continue
        for inp in ('Base Color','Normal','Roughness','Metallic'):
            for l in list(b.inputs[inp].links):nt.links.remove(l)
        try:b.inputs['Subsurface Weight'].default_value=0
        except Exception:pass
def build(spec,table,name):
    bpy.ops.wm.read_factory_settings(use_empty=True);rig._mats.clear()
    parts=rig.build(spec);ao=rig.make_armature();rig.attach(ao,parts);ao.name=name
    ao.animation_data_create()
    for an,(n,loop,fn) in table.items():
        act=bpy.data.actions.new(an);ao.animation_data.action=act
        last=n if loop else n-1
        for f in range(last+1):
            t=(f%n)/n if loop else f/(n-1)
            pose=anim.trait(spec,fn(spec,t),'sit' if ('sit' in an or an in('write','talk','greet','listen','wait')) else an)
            rig.apply_pose(ao,pose,0)
            for pb in ao.pose.bones:
                pb.keyframe_insert('rotation_quaternion',frame=f);pb.keyframe_insert('location',frame=f)
        tr=ao.animation_data.nla_tracks.new();tr.name=an;tr.strips.new(an,0,act);ao.animation_data.action=None
    ao.rotation_euler=(0,0,0);flatten_mats()
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name+'.glb'),export_format='GLB',export_animation_mode='ACTIONS',export_force_sampling=True,
        export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6,export_apply=False,export_yup=True)
D=[s for s in STAFF if s['id']=='doctor'][0];P1=[s for s in PAT if s['id']=='grumpy'][0];P2=[s for s in PAT if s['id']=='phone'][0]
build(D,acts.DOC,'doctor');build(P1,acts.PAT,'patient_a');build(P2,acts.PAT,'patient_b');print('EXPORTED')
