"""Рендер спрайтов: blender -b -P render.py -- <out_dir> <char_ids|all> [--test]"""
import bpy,sys,os,math,json,time
sys.path.insert(0,os.path.dirname(__file__))
import rig,anim,importlib
from chars import STAFF,PAT
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:]
OUT=args[0];WHO=args[1].split(',');TEST='--test' in args
PXM=90.5      # пикселей на метр (в игре ×0.5 → 45.25 px/m)
W,H=(256,256);AX,AY=128,176   # ячейка и якорь (корень персонажа на полу)
os.makedirs(OUT,exist_ok=True)
sc=bpy.context.scene
def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True);sc=bpy.context.scene
    sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=int(os.environ.get('BSAMPLES','64')) if not TEST else 8;sc.cycles.use_denoising=True
    sc.cycles.max_bounces=3;sc.cycles.diffuse_bounces=2
    sc.render.resolution_x=W;sc.render.resolution_y=H;sc.render.film_transparent=True;sc.render.resolution_percentage=100
    sc.render.image_settings.file_format='PNG';sc.render.image_settings.color_mode='RGBA'
    sc.view_settings.view_transform='Standard';sc.view_settings.look='None'
    sc.render.threads=int(os.environ.get('BTHREADS','2'))
    cam=bpy.data.cameras.new('c');cam.type='ORTHO';cam.ortho_scale=H/PXM
    co=bpy.data.objects.new('c',cam);sc.collection.objects.link(co);co.location=(9,-9,7.348);co.rotation_euler=(math.radians(60),0,math.radians(45));sc.camera=co
    cam.shift_y=(AY-H/2)/H*-1*-1  # позже уточним
    cam.shift_y=(AY-H/2)/H
    cam.shift_x=0
    l=bpy.data.lights.new('s','SUN');l.energy=3.2;l.angle=math.radians(25);lo=bpy.data.objects.new('s',l);sc.collection.objects.link(lo)
    Lp=Vector((-.55,-.75,1.25));lo.rotation_euler=Lp.to_track_quat('Z','Y').to_euler();l.color=(1.0,.96,.9)
    l2=bpy.data.lights.new('f','SUN');l2.energy=.8;l2.color=(.75,.82,1.0);lo2=bpy.data.objects.new('f',l2);sc.collection.objects.link(lo2)
    lo2.rotation_euler=Vector((.8,.2,.5)).to_track_quat('Z','Y').to_euler()
    w=bpy.data.worlds.new('w');w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.62,.66,.74,1);w.node_tree.nodes['Background'].inputs[1].default_value=.85;sc.world=w
    if os.environ.get('V19','1')=='1':
        # контактные тени: невидимая плоскость-ловец теней (тень запекается в альфу спрайта)
        bpy.ops.mesh.primitive_circle_add(vertices=32,radius=float(os.environ.get('SHR','1.0')),fill_type='NGON',location=(0,0,0));pl=bpy.context.active_object;pl.name='shadowcatcher';pl.is_shadow_catcher=True
        sc.cycles.max_bounces=4;sc.cycles.diffuse_bounces=3
    return sc
def render_char(spec,kind):
    import rig as r
    sc=setup();rig._mats.clear()
    parts=r.build(spec);cup=None
    if any(a=='coffee' for a,_ in anim.PLAN[kind]):
        import props;cup=props.cyl('cup',(.2,.05,.79),.032,.075,r.mat('cupw','#f4f1ea',.35),r2=.037);parts=r.PARTS;parts[-1]=(cup,'haR')
    ao=r.make_armature();r.attach(ao,parts)
    cdir=os.path.join(OUT,spec['id']);os.makedirs(cdir,exist_ok=True)
    plan=anim.PLAN[kind]
    for act,dirs in plan:
        for d in dirs:
            fr=anim.frames(spec,act,d)
            for i,(pose,yaw) in enumerate(fr):
                fn=os.path.join(cdir,'%s_%d_%02d.png'%(act,d,i))
                if os.path.exists(fn) and not TEST:continue
                if cup:cup.hide_render=not(act=='coffee' and i>=3)
                r.apply_pose(ao,pose,yaw);sc.render.filepath=fn;bpy.ops.render.render(write_still=True)
    return ao
def render_chairs():
    for kind in('office','plain'):
        for part,pre in(('all','chair'),('back','chairb')):
            sc=setup();rig._mats.clear();parts=rig.build_chair(kind,part)
            if part=='back':
                # удалить лишние объекты (всё, что не спинка)
                for o in list(bpy.data.objects):
                    if o.type=='MESH' and o.name.startswith('back') is False:bpy.data.objects.remove(o,do_unlink=True)
                parts=[(o,'x') for o in bpy.data.objects if o.type=='MESH']
            emp=bpy.data.objects.new('e',None);sc.collection.objects.link(emp)
            for o,b in parts:o.parent=emp
            cdir=os.path.join(OUT,pre+'_'+kind);os.makedirs(cdir,exist_ok=True)
            for d in range(4):
                if part=='back' and d<2:continue
                emp.rotation_euler=(0,0,math.radians(anim.DIRS[d]));sc.render.filepath=os.path.join(cdir,'%s_%d_00.png'%(pre,d));bpy.ops.render.render(write_still=True)
def render_toilet():
    tdir=os.path.join(OUT,'toilet');os.makedirs(tdir,exist_ok=True)
    for i,ang in enumerate((0,30,62,96)):
        sc=setup();rig._mats.clear();rig.build_toilet(ang)
        sc.render.filepath=os.path.join(tdir,'toilet_1_%02d.png'%i);bpy.ops.render.render(write_still=True)
def render_sink():
    tdir=os.path.join(OUT,'sink');os.makedirs(tdir,exist_ok=True)
    sc=setup();rig._mats.clear();rig.build_sink()
    sc.render.filepath=os.path.join(tdir,'sink_1_00.png');bpy.ops.render.render(write_still=True)
t0=time.time()
def render_sofa():
    tdir=os.path.join(OUT,'sofa');os.makedirs(tdir,exist_ok=True)
    sc=setup();rig._mats.clear();rig.build_sofa()
    sc.render.filepath=os.path.join(tdir,'sofa_1_00.png');bpy.ops.render.render(write_still=True)
def render_props(names):
    import props,importlib
    for nm in names:
        tdir=os.path.join(OUT,nm);os.makedirs(tdir,exist_ok=True)
        for d in (0,1,2,3):
            sc=setup();rig._mats.clear();parts=props.PROPS[nm]()
            e=bpy.data.objects.new('pivot',None);sc.collection.objects.link(e)
            for o,b in parts:o.parent=e
            e.rotation_euler=(0,0,math.radians(anim.DIRS[d]-180));bpy.context.view_layer.update()
            sc.render.filepath=os.path.join(tdir,'%s_%d_00.png'%(nm,d));bpy.ops.render.render(write_still=True)
if WHO[0].startswith('props'):
    render_props(WHO[0].split(':')[1].split('+'));print('DONE props');sys.exit(0)
if WHO==['sofa']:
    render_sofa();print('DONE sofa');sys.exit(0)
if WHO==['sink']:
    render_sink();print('DONE sink');sys.exit(0)
if WHO==['toilet']:
    render_toilet();print('DONE toilet');sys.exit(0)
if WHO==['chairs']:
    render_chairs();print('DONE chairs');sys.exit(0)
allc={c['id']:('patient',c) for c in PAT}
for c in STAFF:allc[c['id']]=(c['role'],c)
for w in (allc.keys() if WHO==['all'] else WHO):
    kind,spec=allc[w];spec=dict(spec)
    if os.environ.get('PLAN'):
        anim.PLAN[kind]=[(a.split(':')[0],[int(x) for x in a.split(':')[1].split('+')]) for a in os.environ['PLAN'].split(',')]
    elif TEST:
        # тест: только ходьба 2 кадра + сидение
        anim.PLAN[kind]=[('walk',[0,1]),('sit',[1]),('lie',[0])] if kind=='patient' else [('walk',[1]),('type',[1])]
    render_char(spec,kind);print('DONE',w,time.time()-t0,flush=True)
