"""v28: GP-кабинет 5x4 м + коридор (y<0). Камера изометрическая с (+x,-y)."""
import bpy,bmesh,math,sys
sys.path.insert(0,'/workspace/hospital-game/tools/blender')
import rig,props
from rig import mat
from math import radians as R
OBJ=[]
def bx(name,c,s,m,bev=0.0):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1.0)
    bmesh.ops.transform(bm,matrix=__import__('mathutils').Matrix.Translation(c)@__import__('mathutils').Matrix.Diagonal((s[0],s[1],s[2],1)),verts=bm.verts)
    if bev>0:bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bev,segments=2,affect='EDGES')
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
    o=bpy.data.objects.new(name,me);o.data.materials.append(m);bpy.context.scene.collection.objects.link(o);OBJ.append(o);return o
def take_parts(off,rot=0):
    """перенести rig.PARTS (реквизит) на позицию"""
    e=bpy.data.objects.new('pv',None);bpy.context.scene.collection.objects.link(e)
    for o,b in rig.PARTS:o.parent=e;OBJ.append(o)
    e.location=off;e.rotation_euler=(0,0,R(rot));bpy.context.view_layer.update()
    for o,b in rig.PARTS:
        mw=o.matrix_world.copy();o.parent=None;o.matrix_world=mw
    bpy.data.objects.remove(e);rig.PARTS=[]
def build():
    rig._mats.clear();rig.PARTS=[]
    M=dict(floor=mat('floor_vinyl','#cdb89a',.55),cor=mat('floor_tile','#c9ced4',.35),wall=mat('wall_paint','#d6e6dc',.85),wall2=mat('wall_cor','#d8e2ea',.85),
        trim=mat('trim','#6f8f7a',.6),wood=mat('desk_wood','#8a5a34',.45),top=mat('desk_top','#efe9df',.35),metal=mat('chrome_leg','#b9c0c8',.25),
        couch=mat('couch_leather','#5c8fa8',.5),paper=mat('paper','#fbfbf6',.8),screen=mat('screen','#1a2a3a',.2,emit='#6ac8ff',strength=1.2),
        win=mat('window_glass','#cfe8f6',.05,emit='#dff2ff',strength=2.5),plant=mat('plant_leaf','#3f8a3a',.6),pot=mat('pot','#b5643c',.6),
        book1=mat('book_r','#a83a32',.6),book2=mat('book_b','#2f5a8a',.6),book3=mat('book_y','#d8a830',.6),bench=mat('bench_seat','#e07a3a',.5),door=mat('door_wood','#b9874f',.5))
    # пол
    bx('floor',(2.5,2,-.025),(5,4,.05),M['floor']);bx('corr',(2.5,-1.2,-.03),(7,2.4,.06),M['cor'])
    # стены (задние высокие, передняя — срез 0.35 м с проёмом двери x 3.5..4.5)
    bx('wallL',(-.06,2,1.4),(.12,4.12,2.8),M['wall']);bx('wallB',(2.5,4.06,1.4),(5.12,.12,2.8),M['wall'])
    bx('wallR',(5.06,2,.175),(.12,4.12,.35),M['wall'])
    bx('wallF1',(1.75,0,.175),(3.5,.12,.35),M['wall']);bx('wallF2',(4.75,0,.175),(.5,.12,.35),M['wall'])
    bx('base1',(.01,2,.06),(.03,4,.12),M['trim']);bx('base2',(2.5,3.99,.06),(5,.03,.12),M['trim'])
    bx('corwall',(-1.06,-1.2,1.4),(.12,2.4,2.8),M['wall2'])
    # окно на левой стене
    bx('window',(.005,1.4,1.55),(.02,1.6,1.1),M['win']);bx('wframe',(.02,1.4,1.55),(.03,1.7,.06),M['trim'])
    # стол 1.4x0.7, h .75
    bx('desktop',(2.2,2.85,.74),(1.4,.72,.04),M['top'],.01)
    for sx in(-1,1):bx('deskside',(2.2+sx*.66,2.85,.36),(.05,.68,.72),M['wood'])
    bx('deskfront',(2.2,2.52,.45),(1.32,.03,.5),M['wood'])
    bx('monitor',(2.55,3.05,1.0),(.48,.04,.3),M['screen']);bx('mstand',(2.55,3.08,.82),(.06,.06,.14),M['metal'])
    bx('papers',(1.95,2.8,.765),(.3,.22,.012),M['paper'])
    # кресло врача (за столом, лицом к -y) и стул пациента (лицом к +y)
    rig.build_chair('office');take_parts((2.2,3.5,0),180)
    rig.build_chair('plain');take_parts((2.2,2.05,0),0)
    # кушетка вдоль левой стены
    bx('couch',(.45,.9,.5),(.7,1.8,.12),M['couch'],.04);bx('couchhead',(.45,1.7,.62),(.66,.3,.12),M['couch'],.04)
    for sx in(.15,.75):
        for sy in(.1,1.7):bx('cleg',(sx,sy,.22),(.05,.05,.44),M['metal'])
    # шкаф с книгами
    props.bookcase();take_parts((4.3,3.75,0),180)
    # раковина
    rig.build_sink();take_parts((.3,3.2,0),90)
    # растение
    bx('pot',(4.6,.45,.2),(.36,.36,.4),M['pot'],.03)
    for i in range(7):
        a=i*51;rig.ell('leaf',(4.6+.16*math.cos(R(a)),.45+.16*math.sin(R(a)),.62+.05*(i%3)),(.18,.07,.03),M['plant'],'x',rot=(20,0,a))
    take_parts((0,0,0))
    # коридор: скамейка ожидания у стены коридора
    bx('bench',(-.7,-1.2,.42),(.45,1.6,.06),M['bench'],.02);bx('benchb',(-.95,-1.2,.7),(.06,1.6,.45),M['bench'],.02)
    for sy in(-1.9,-.5):bx('bleg',(-.7,sy,.2),(.4,.05,.4),M['metal'])
    # приоткрытая дверь
    pass
    return OBJ,M
def lights():
    sc=bpy.context.scene
    l=bpy.data.lights.new('sun','SUN');l.energy=3.0;l.angle=R(6);l.color=(1,.95,.86);o=bpy.data.objects.new('sun',l);sc.collection.objects.link(o)
    from mathutils import Vector
    o.rotation_euler=Vector((.9,-.25,.75)).to_track_quat('Z','Y').to_euler()  # из окна (с -x стороны... свет на пол)
    for p in((1.6,2.0),(3.6,2.0),(1.5,-1.2),(4.5,-1.2)):
        a=bpy.data.lights.new('lamp','AREA');a.energy=180;a.size=.9;a.color=(1,.97,.92);ao=bpy.data.objects.new('lamp',a);sc.collection.objects.link(ao);ao.location=(p[0],p[1],2.75)
    w=bpy.data.worlds.new('w');w.use_nodes=True;w.node_tree.nodes['Background'].inputs[0].default_value=(.7,.75,.85,1);w.node_tree.nodes['Background'].inputs[1].default_value=.6;sc.world=w
