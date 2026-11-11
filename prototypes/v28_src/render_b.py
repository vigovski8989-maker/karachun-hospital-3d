"""B: пре-рендер 2.5D. blender -b -P render_b.py -- out bg | chars <who> <jobidx> <njobs>
 цвет (Cycles) + нормали(мир)+глубина -> PNG"""
import bpy,sys,os,math,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,'/workspace/hospital-game/tools/blender')
import numpy as np
from mathutils import Vector
A=sys.argv[sys.argv.index('--')+1:];OUT=A[0];MODE=A[1];os.makedirs(OUT,exist_ok=True)
VD=Vector((9,-9,7.348)).normalized();DIST=12.0
PXM=960/6.76
BG_W,BG_H=1400,820;BG_SCALE=BG_W/PXM;BG_T=Vector((1.7,1.0,0.6));CW,CH=256,320;AY=270
def scene_setup(w,h,samples):
    sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.device='CPU';sc.cycles.samples=samples;sc.cycles.use_denoising=True
    sc.render.resolution_x=w;sc.render.resolution_y=h;sc.render.resolution_percentage=100;sc.render.film_transparent=True;sc.render.threads=int(os.environ.get('BTHREADS','2'))
    sc.view_settings.view_transform='Standard';vl=sc.view_layers[0];vl.use_pass_z=True;vl.use_pass_normal=True
    sc.render.image_settings.file_format='OPEN_EXR_MULTILAYER';sc.render.image_settings.color_depth='32';return sc
def camera(sc,target,scale,shift_y=0):
    cam=bpy.data.cameras.new('c');cam.type='ORTHO';cam.ortho_scale=scale;cam.shift_y=shift_y;cam.clip_end=60
    co=bpy.data.objects.new('c',cam);sc.collection.objects.link(co);co.location=target+VD*DIST;co.rotation_euler=(math.radians(60),0,math.radians(45));sc.camera=co;return co
def convert(exr,png_c,png_n,zf):
    im=bpy.data.images.load(exr);
    def layer(name):
        # multilayer EXR: bpy даёт только combined; читаем через render result API недоступно -> используем OpenImageIO? fallback ниже
        pass
    bpy.data.images.remove(im)
def render_and_save(sc,base,zf):
    # Compositor: Image -> PNG, Normal/Z -> EXR (отдельный файл), затем numpy
    sc.use_nodes=True;nt=sc.node_tree;[nt.nodes.remove(n) for n in list(nt.nodes)]
    rl=nt.nodes.new('CompositorNodeRLayers');fo=nt.nodes.new('CompositorNodeOutputFile');fo.base_path=os.path.dirname(base);fo.format.file_format='OPEN_EXR';fo.format.color_depth='32'
    fo.file_slots.clear();fo.file_slots.new('N_');fo.file_slots.new('Z_');fo.file_slots.new('C_')
    nt.links.new(rl.outputs['Normal'],fo.inputs[0]);nt.links.new(rl.outputs['Depth'],fo.inputs[1]);nt.links.new(rl.outputs['Image'],fo.inputs[2])
    stem=os.path.basename(base);fo.file_slots[0].path=stem+'_N';fo.file_slots[1].path=stem+'_Z';fo.file_slots[2].path=stem+'_C'
    sc.render.filepath='/tmp/_dummy';bpy.ops.render.render(write_still=False)
    f=sc.frame_current;d=os.path.dirname(base)
    def rd(tag):
        p=os.path.join(d,'%s_%s%04d.exr'%(stem,tag,f));im=bpy.data.images.load(p);a=np.array(im.pixels[:],dtype=np.float32).reshape(im.size[1],im.size[0],4);bpy.data.images.remove(im);os.remove(p);return a
    C=rd('C');N=rd('N');Z=rd('Z')[:,:,0]
    al=C[:,:,3:4];rgb=np.where(al>1e-4,C[:,:,:3]/np.maximum(al,1e-4),0)
    if MODE=='bg':
        rgb=rgb*2**float(os.environ.get('EXP','-1.0'));rgb=np.clip((rgb*(2.51*rgb+.03))/(rgb*(2.43*rgb+.59)+.14),0,1)
    srgb=np.where(rgb<=.0031308,rgb*12.92,1.055*np.power(np.clip(rgb,0,None),1/2.4)-.055)
    col=np.concatenate([np.clip(srgb,0,1),al],2)
    z=np.clip(zf(Z),0,1);nd=np.concatenate([np.clip(N[:,:,:3]*.5+.5,0,1),z[:,:,None]],2)
    nd[:,:,3]=np.where(al[:,:,0]>1e-3,nd[:,:,3],1.0)
    save(col,base+'_c.png');save(nd,base+'_n.png')
def save(a,p):
    h,w,_=a.shape;im=bpy.data.images.new('o',w,h,alpha=True);im.pixels=a.ravel().tolist();im.filepath_raw=p;im.file_format='PNG';im.alpha_mode='STRAIGHT';im.save();bpy.data.images.remove(im)
if MODE=='bg':
    import room
    bpy.ops.wm.read_factory_settings(use_empty=True);room.build();room.lights()
    sc=scene_setup(BG_W,BG_H,int(os.environ.get('SAMP','128')));sc.render.film_transparent=False;camera(sc,BG_T,BG_SCALE)
    render_and_save(sc,os.path.join(OUT,'bg'),lambda Z:(Z-4)/16);print('BG DONE')
else:
    import rig,anim,acts
    from chars import STAFF,PAT
    who=A[2];job=int(A[3]);nj=int(A[4])
    spec={'doctor':[s for s in STAFF if s['id']=='doctor'][0],'patient_a':[s for s in PAT if s['id']=='grumpy'][0],'patient_b':[s for s in PAT if s['id']=='phone'][0]}[who]
    PLAN=json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'b_plan.json')))[who]
    bpy.ops.wm.read_factory_settings(use_empty=True);rig._mats.clear()
    parts=rig.build(spec);ao=rig.make_armature();rig.attach(ao,parts)
    sc=scene_setup(CW,CH,int(os.environ.get('SAMP','20')))
    sc.render.resolution_x=CW;sc.render.resolution_y=CH
    camera(sc,Vector((0,0,0)),CH/PXM,shift_y=(AY-CH/2)/CH)
    l=bpy.data.lights.new('s','SUN');l.energy=1.7;l.angle=math.radians(30);lo=bpy.data.objects.new('s',l);sc.collection.objects.link(lo);lo.rotation_euler=Vector((.9,-.25,.75)).to_track_quat('Z','Y').to_euler();l.color=(1,.95,.86)
    w=bpy.data.worlds.new('w');w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.8,.83,.9,1);w.node_tree.nodes['Background'].inputs[1].default_value=.6;sc.world=w
    tbl=acts.DOC if who=='doctor' else acts.PAT
    jobs=[]
    for an,n,loop,dirs in PLAN:
        for d in dirs:
            for i in range(n):jobs.append((an,n,loop,d,i))
    for k,(an,n,loop,d,i) in enumerate(jobs):
        if k%nj!=job:continue
        fn=os.path.join(OUT,who,'%s_%d_%02d'%(an,d,i))
        if os.path.exists(fn+'_n.png'):continue
        os.makedirs(os.path.dirname(fn),exist_ok=True)
        t=i/n if loop else i/max(1,n-1)
        pose=anim.trait(spec,tbl[an][2](spec,t),'sit' if ('sit' in an or an in('write','talk','greet','listen','wait')) else an)
        rig.apply_pose(ao,pose,d*45)
        render_and_save(sc,fn,lambda Z:(Z-DIST)/4+.5)
    print('CHARS DONE',who,job)
