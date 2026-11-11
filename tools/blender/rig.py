import os
"""Построение персонажа с арматурой (Blender), FK-позы. Запускается внутри Blender."""
import bpy,bmesh,math
from math import radians as R,sin,cos,pi
from mathutils import Vector,Matrix,Euler
# ---------- скелет ----------
REST={'root':(0,0,0),'pelvis':(0,0,.93),'spine':(0,0,1.0),'chest':(0,0,1.3),'neck':(0,0,1.5),'head':(0,0,1.56),
 'uaR':(.2,0,1.42),'faR':(.2,0,1.13),'haR':(.2,0,.86),'uaL':(-.2,0,1.42),'faL':(-.2,0,1.13),'haL':(-.2,0,.86),
 'thR':(.09,0,.93),'shR':(.09,0,.5),'ftR':(.09,0,.08),'thL':(-.09,0,.93),'shL':(-.09,0,.5),'ftL':(-.09,0,.08)}
PARENT={'pelvis':'root','spine':'pelvis','chest':'spine','neck':'chest','head':'neck','uaR':'chest','faR':'uaR','haR':'faR','uaL':'chest','faL':'uaL','haL':'faL',
 'thR':'pelvis','shR':'thR','ftR':'shR','thL':'pelvis','shL':'thL','ftL':'shL'}
ORDER=['root','pelvis','spine','chest','neck','head','uaR','faR','haR','uaL','faL','haL','thR','shR','ftR','thL','shL','ftL']
TAIL={'root':(0,0,.15),'pelvis':(0,0,1.0),'spine':(0,0,1.3),'chest':(0,0,1.5),'neck':(0,0,1.56),'head':(0,0,1.78),'uaR':(.2,0,1.13),'faR':(.2,0,.86),'haR':(.2,0,.78),
 'uaL':(-.2,0,1.13),'faL':(-.2,0,.86),'haL':(-.2,0,.78),'thR':(.09,0,.5),'shR':(.09,0,.08),'ftR':(.09,.2,.03),'thL':(-.09,0,.5),'shL':(-.09,0,.08),'ftL':(-.09,.2,.03)}
def hexc(h,a=1.0):
    h=h.lstrip('#')
    if len(h)==3:h=''.join(c*2 for c in h)
    r,g,b=[int(h[i:i+2],16)/255 for i in(0,2,4)]
    f=lambda c:(c/12.92) if c<=.04045 else ((c+.055)/1.055)**2.4
    return (f(r),f(g),f(b),a)
_mats={}
def mat(name,color,rough=.7,emit=None,strength=0,kind=None):
    k=(name,color,emit,strength,kind)
    if k in _mats:return _mats[k]
    m=bpy.data.materials.new(name);m.use_nodes=True;nt=m.node_tree;b=nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value=hexc(color);b.inputs['Roughness'].default_value=rough
    try:b.inputs['Specular IOR Level'].default_value=.25
    except Exception:pass
    if emit:
        b.inputs['Emission Color'].default_value=hexc(emit);b.inputs['Emission Strength'].default_value=strength
    if kind in('stripes','plaid'):
        tc=nt.nodes.new('ShaderNodeTexCoord');
        if kind=='stripes':
            w=nt.nodes.new('ShaderNodeTexWave');w.wave_type='BANDS';w.bands_direction='X';w.inputs['Scale'].default_value=15;w.inputs['Distortion'].default_value=0
            nt.links.new(tc.outputs['Object'],w.inputs['Vector']);cr=nt.nodes.new('ShaderNodeValToRGB');cr.color_ramp.elements[0].position=.45;cr.color_ramp.elements[1].position=.55
            cr.color_ramp.elements[0].color=hexc(color);cr.color_ramp.elements[1].color=hexc('#f0f0f4');nt.links.new(w.outputs['Fac'],cr.inputs['Fac']);nt.links.new(cr.outputs['Color'],b.inputs['Base Color'])
        else:
            c=nt.nodes.new('ShaderNodeTexChecker');c.inputs['Scale'].default_value=16;c.inputs['Color1'].default_value=hexc(color);c.inputs['Color2'].default_value=hexc('#2a3f78')
            nt.links.new(tc.outputs['Object'],c.inputs['Vector']);nt.links.new(c.outputs['Color'],b.inputs['Base Color'])
    if os.environ.get('V19','1')=='1':enhance(m,name,color,rough,emit)
    _mats[k]=m;return m
def enhance(m,name,color,rough,emit):
    """v19 PBR: микрофаска (Bevel→Normal), микрорельеф ткани/дерева, металл для хрома/стали, SSS кожи"""
    nt=m.node_tree;b=nt.nodes['Principled BSDF'];n=name.lower()
    metal=(n in('pc','css','steel','gold','chrome','metal') or n.startswith(('chrome','steel','metal')))and not emit
    if metal:
        b.inputs['Metallic'].default_value=.85;b.inputs['Roughness'].default_value=max(.18,rough*.8)
    skin=n.startswith('skin') or 'skin' in n
    if skin:
        try:b.inputs['Subsurface Weight'].default_value=.12;b.inputs['Subsurface Radius'].default_value=(1.0,.35,.2);b.inputs['Subsurface Scale'].default_value=.01
        except Exception:pass
    bev=nt.nodes.new('ShaderNodeBevel');bev.inputs['Radius'].default_value=.006;bev.samples=6
    fab=rough>=.5 and not skin and not emit
    if fab:
        tc=nt.nodes.new('ShaderNodeTexCoord');nz=nt.nodes.new('ShaderNodeTexNoise');nz.inputs['Scale'].default_value=260 if rough<.65 else 420;nz.inputs['Detail'].default_value=3
        nt.links.new(tc.outputs['Object'],nz.inputs['Vector']);bm=nt.nodes.new('ShaderNodeBump');bm.inputs['Strength'].default_value=.12;bm.inputs['Distance'].default_value=.002
        nt.links.new(nz.outputs['Fac'],bm.inputs['Height']);nt.links.new(bev.outputs['Normal'],bm.inputs['Normal']);nt.links.new(bm.outputs['Normal'],b.inputs['Normal'])
        # лёгкая вариация цвета (ткань/дерево не плоские)
        if not b.inputs['Base Color'].is_linked:
            mx=nt.nodes.new('ShaderNodeMixRGB');mx.blend_type='MULTIPLY';mx.inputs['Fac'].default_value=.12;mx.inputs['Color1'].default_value=b.inputs['Base Color'].default_value
            nt.links.new(nz.outputs['Color'],mx.inputs['Color2']);nt.links.new(mx.outputs['Color'],b.inputs['Base Color'])
    else:nt.links.new(bev.outputs['Normal'],b.inputs['Normal'])
    if not skin and not metal:
        try:b.inputs['Coat Weight'].default_value=.0 if fab else .15
        except Exception:pass
# ---------- примитивы ----------
PARTS=[]  # (obj,bone)
def _obj(name,bm,m):
    me=bpy.data.meshes.new(name);bm.to_mesh(me);bm.free()
    for p in me.polygons:p.use_smooth=True
    o=bpy.data.objects.new(name,me);o.data.materials.append(m);bpy.context.scene.collection.objects.link(o);return o
def ell(name,c,r,m,bone,rot=None,seg=14,rings=8):
    bm=bmesh.new();bmesh.ops.create_uvsphere(bm,u_segments=seg,v_segments=rings,radius=1.0)
    mt=Matrix.Translation(c)
    if rot:mt=mt@Euler([R(a) for a in rot],'XYZ').to_matrix().to_4x4()
    sc=Matrix.Diagonal((r[0],r[1],r[2],1))
    bmesh.ops.transform(bm,matrix=mt@sc,verts=bm.verts)
    o=_obj(name,bm,m);PARTS.append((o,bone));return o
def box(name,c,s,m,bone,rot=None,bev=.012):
    bm=bmesh.new();bmesh.ops.create_cube(bm,size=1.0)
    sc=Matrix.Diagonal((s[0],s[1],s[2],1));mt=Matrix.Translation(c)
    if rot:mt=mt@Euler([R(a) for a in rot],'XYZ').to_matrix().to_4x4()
    bmesh.ops.transform(bm,matrix=mt@sc,verts=bm.verts)
    if bev:
        try:bmesh.ops.bevel(bm,geom=list(bm.edges),offset=bev,segments=2,affect='EDGES')
        except Exception:pass
    o=_obj(name,bm,m);PARTS.append((o,bone));return o
def arc_ring(name,c,rad,tube,m,bone,side):
    """дуга-«скобка» в плоскости XZ, выпуклая в сторону side (цепочка маленьких эллипсоидов)"""
    bm=bmesh.new()
    for k in range(-5,6):
        a=R(k*9);p=Vector((side*rad*cos(a),0,rad*sin(a)))+Vector(c)
        bmesh.ops.create_uvsphere(bm,u_segments=8,v_segments=6,radius=tube,matrix=Matrix.Translation(p))
    o=_obj(name,bm,m);PARTS.append((o,bone));return o
# ---------- сборка персонажа ----------
def build(spec):
    global PARTS;PARTS=[]
    ob=spec.get('build',1.0);sk=mat('skin',spec['skin'],.55,emit=(spec['skin'] if spec.get('glow') else None),strength=(1.2 if spec.get('glow') else 0));hair=mat('hair',spec['hair'],.5)
    top=mat('top',spec['top'],.85,kind=('stripes' if spec.get('stripes') else 'plaid' if spec.get('plaid') else None))
    pants=mat('pants',spec['pants'],.85,kind=('stripes' if spec.get('stripes') else None))
    shoes=mat('shoes',spec['shoes'] or spec['skin'],.6)
    dark=mat('dark','#1a1210',.5);white=mat('white','#fafafa',.4)
    sleeve=top if spec.get('sleeve')=='long' else sk
    if spec.get('inner'):inner=mat('inner',spec['inner'],.85)
    # --- таз/ноги
    ell('pelvis',(0,0,.93),(.165*ob,.115,.11),pants,'pelvis')
    for s,sx in(('R',1),('L',-1)):
        legm=pants
        ell('thigh'+s,(sx*.09,0,.72),(.078*ob,.078*ob,.25),legm,'th'+s)
        ell('knee'+s,(sx*.09,0,.5),(.066,.066,.066),legm,'th'+s)
        ell('shin'+s,(sx*.09,0,.29),(.062,.062,.25),legm if not spec.get('shorts') else sk,'sh'+s)
        if spec.get('shorts'):ell('cuff'+s,(sx*.09,0,.55),(.085,.085,.07),pants,'sh'+s)
        if spec.get('bigFeet'):ell('foot'+s,(sx*.1,.07,.075),(.115,.2,.075),sk,'ft'+s)
        else:
            ell('foot'+s,(sx*.09,.06,.045),(.052,.125,.042),shoes,'ft'+s)
            if spec.get('slipper'):pass
    # --- торс
    ell('abd',(0,0,1.14),(.165*ob,.12*ob,.17),top,'spine')
    ell('chest',(0,0,1.34),(.185*ob,.125*ob,.17),top,'chest')
    if spec.get('belly'):
        ell('belly',(0,.1,1.1),(.19,.19,.2),mat('glow','#ff9a3a',.4,emit='#ff6a10',strength=1.3),'spine')
    if spec.get('coat'):
        ell('coatU',(0,0,1.12),(.2,.14,.42),top,'spine')
        ell('coatSkirt',(0,0,.78),(.205,.145,.24),top,'pelvis')
        ell('lapelL',(-.07,.125,1.38),(.04,.03,.12),mat('shirt','#bcd3ee',.8),'chest')
        ell('lapelR',(.07,.125,1.38),(.04,.03,.12),mat('shirt','#bcd3ee',.8),'chest')
        if spec.get('tie'):box('tie',(0,.13,1.3),(.035,.02,.2),mat('tie',spec['tie'],.6),'chest',bev=.004)
        if spec.get('steth'):
            ell('stethL',(-.05,.1,1.44),(.015,.015,.14),dark,'chest');ell('stethR',(.05,.1,1.44),(.015,.015,.14),dark,'chest')
            ell('stethP',(.0,.15,1.24),(.03,.015,.03),mat('metal','#aab0b8',.3),'chest')
    elif spec.get('skirt'):
        ell('skirt',(0,0,.72),(.2*ob,.16*ob,.3),mat('skirt',spec['skirt'],.85),'pelvis')
        ell('skirtU',(0,0,.92),(.2*ob,.15,.1),mat('skirt',spec['skirt'],.85),'pelvis')
    if spec.get('overall'):
        ell('bib',(0,.11,1.28),(.11,.04,.14),top,'chest')
    if spec.get('belt'):
        box('belt',(0,0,.99),(.36,.26,.045),mat('belt','#6b4a2a',.7),'pelvis',bev=.01)
        box('pouch',(.17,.06,.97),(.08,.07,.12),mat('belt2','#8a6a3a',.7),'pelvis',bev=.01)
        box('hammer',(-.17,.07,.95),(.03,.03,.16),mat('hm','#999',.4),'pelvis',bev=.005)
    if spec.get('hood'):
        ell('hoodback',(0,-.1,1.46),(.14,.09,.07),top,'chest')
        ell('hoodie_hem',(0,0,.98),(.19*ob,.14,.045),top,'pelvis')
    if spec.get('inner'):ell('zipin',(0,.12,1.38),(.05,.02,.1),inner,'chest')
    if spec.get('hunch'):pass
    # --- шея/голова
    ell('neck',(0,0,1.53),(.046,.046,.06),sk,'neck')
    hs=spec.get('bigHead',1.0);hc=Vector((0,0,1.665+(.07*(hs-1)*1.0)))
    hr=(.098*hs*(1.25 if spec.get('flatHead') else 1),.105*hs*(1.2 if spec.get('flatHead') else 1),.115*hs*(.5 if spec.get('flatHead') else 1))
    if spec.get('flatHead'):hc=Vector((0,0,1.62))
    if spec.get('robot'):
        ell('rneck',(0,0,1.55),(.06,.06,.05),mat('metal','#aab0b8',.3),'neck')
        box('rhead',(0,0,1.69),(.25,.22,.2),mat('rmetal','#9aa0a8',.3),'head',bev=.02)
        for sx in(-1,1):box('reye',(sx*.06,.112,1.7),(.065,.02,.05),mat('eyeb','#38c8ff',.2,emit='#38c8ff',strength=8),'head',bev=.004)
        box('rant',(0,0,1.82),(.012,.012,.06),dark,'head',bev=0);ell('rantb',(0,0,1.855),(.02,.02,.02),mat('eyer','#ff4040',.2,emit='#ff4040',strength=4),'head')
    else:
        ell('head',tuple(hc),hr,sk,'head',seg=20,rings=12)
        fy=.105*hs  # передняя поверхность лица
        # волосы
        st=spec.get('hs','short')
        if st!='none':
            if st in('short','curly','bun'):
                ell('hair',(0,-.012*hs,hc.z+.028*hs),(.104*hs,.108*hs,.108*hs),hair,'head',seg=18,rings=10)
                ell('fringe',(0,.045*hs,hc.z+.07*hs),(.1*hs,.06*hs,.04*hs),hair,'head')
            if st=='curly':ell('hair2',(0,-.02*hs,hc.z+.04*hs),(.12*hs,.12*hs,.11*hs),hair,'head')
            if st=='bun':ell('bun',(0,-.1*hs,hc.z+.06*hs),(.045*hs,.045*hs,.045*hs),hair,'head')
        # лицо
        sc=1.0 if hs==1 else 1.25
        fz=hc.z+(.005 if hs==1 else -.02)*hs
        for sx in(-1,1):
            ell('eye',(sx*.038*sc,fy*(.93 if hs==1 else 1.0),fz+.012),(.014*sc,.01,.016*sc),dark,'head',seg=8,rings=6)
            if spec.get('angry'):box('brow',(sx*.04,fy*(.95 if hs==1 else 1.0),fz+.04),(.045,.012,.01),dark,'head',rot=(0,sx*-22,0),bev=0)
            elif spec.get('squint') is None:box('brow',(sx*.04,fy*(.95 if hs==1 else 1.02),fz+.038),(.04,.01,.008),hair if st!='none' else dark,'head',bev=0)
        nose_m=sk;ns=.02*sc
        if spec.get('redNose'):nose_m=mat('nr','#ff2a1a',.2,emit='#ff2a1a',strength=6);ns=.032*sc
        if spec.get('blueNose'):nose_m=mat('nb','#3cb8ff',.2,emit='#3cb8ff',strength=9);ns=.034*sc
        ell('nose',(0,fy*1.0,fz-.012),(ns,ns*1.1,ns),nose_m,'head',seg=10,rings=8)
        if spec.get('yawn') or spec.get('laugh'):
            ell('mouth',(0,fy*.9,fz-.05),(.032*sc,.016,.034*sc),mat('mouth','#4a1414',.5),'head',seg=10,rings=8)
        elif spec.get('angry'):box('mouth',(0,fy*.93,fz-.052),(.04*sc,.01,.008),dark,'head',bev=0)
        else:box('mouth',(0,fy*.93,fz-.05),(.035*sc,.01,.008),mat('mouth','#8a4a40',.5),'head',bev=0)
        if spec.get('glasses'):
            for sx in(-1,1):ell('gl',(sx*.04,fy*.98,fz+.012),(.026,.006,.026),mat('glass','#d8e8f0',.1),'head',seg=10,rings=6)
        if spec.get('patches'):
            gm=mat('patch','#3f9a2a',.6)
            for i,(x,z,r) in enumerate([(-.05,.03,.022),(.04,.0,.026),(.06,.05,.016),(-.02,-.04,.02)]):ell('pt',(x*hs,fy*.9,fz+z),(r,.01,r),gm,'head',seg=8,rings=6)
            for i,(x,z) in enumerate([(.0,1.28),(.08,1.2),(-.06,1.36)]):ell('pt2',(x,.12,z),(.025,.01,.025),gm,'chest',seg=8,rings=6)
            for s,sx in(('R',1),('L',-1)):
                for z in(1.18,1.0):ell('pt3',(sx*.215,.03,z),(.02,.02,.02),gm,'ua'+s if z>1.13 else 'fa'+s,seg=8,rings=6)
        if spec.get('cap'):
            cm=mat('capm',spec['cap'],.7)
            if spec['role']=='nurse':
                box('ncap',(0,-.01,hc.z+.1),(.16,.15,.05),mat('ncapw','#fafafa',.6),'head',bev=.01);box('cross',(0,.07,hc.z+.1),(.012,.01,.035),mat('red','#d22',.5),'head',bev=0);box('cross2',(0,.07,hc.z+.1),(.035,.01,.012),mat('red','#d22',.5),'head',bev=0)
            else:
                ell('cap',(0,-.005,hc.z+.045),(.108,.112,.075),cm,'head');box('brim',(0,.1,hc.z+.035),(.13,.07,.012),cm,'head',bev=.004)
    if spec.get('arcs'):
        am=mat('arc','#b090ff',.2,emit='#9f7bff',strength=6)
        for k,rad in enumerate((.2,.27,.34)):
            for side in(1,-1):arc_ring('arc',Vector((0,0,1.7)),rad,.012,am,'head',side)
    if spec.get('flatHead'):
        box('flatp',(0,0,1.665),(.27,.25,.035),hair,'head',bev=.012)
    if spec.get('spots'):
        rm=mat('spot','#e0303a',.5)
        for (x,z) in [(-.05,.03),(.045,.0),(.06,.05),(-.02,-.045),(0.0,.07)]:ell('sp',(x,.1,1.665+z),(.03,.012,.03),rm,'head',seg=8,rings=6)
        for s_,sx in(('R',1),('L',-1)):
            for z in(1.0,.9):ell('sp3',(sx*.2,.04,z),(.03,.03,.03),rm,'fa'+s_,seg=8,rings=6)
    if spec.get('tail'):
        tm=mat('tailm',spec.get('tailc','#8a5a30'),.6)
        for i in range(7):
            ell('tail',(0,-.13-.045*i,.92-.07*i+.004*i*i),(.035-.003*i,.04,.035-.003*i),tm,'pelvis',seg=8,rings=6)
        ell('tuft',(0,-.45,.53),(.05,.06,.05),mat('tuft','#2a1a10',.6),'pelvis')
    if spec.get('spiky'):
        ym=mat('spk',spec['hair'],.4,emit='#fff27a',strength=1.5)
        import math
        for i in range(9):
            a=math.radians(-80+i*20)
            ell('spk',(math.sin(a)*.1,-.01,1.78+math.cos(a)*.05),(.02,.02,.11),ym,'head',rot=(0,math.degrees(a)*.9,0),seg=6,rings=4)
        for i in range(3):
            box('zap',(-.15+.15*i,.03,1.93),(.008,.008,.06),mat('zapm','#9ff',.2,emit='#9ff',strength=10),'head',rot=(0,30*(i-1),0),bev=0)
    if spec.get('battery'):
        box('bat',(0,.15,1.28),(.16,.03,.09),mat('batm','#222',.4),'chest',bev=.01)
        box('batt',(.09,.15,1.28),(.015,.03,.04),mat('batm','#222',.4),'chest',bev=0)
        box('batl',(-.05,.168,1.28),(.035,.005,.06),mat('batr','#f22',.2,emit='#f22',strength=8),'chest',bev=0)
    if spec.get('bsod'):
        box('bsod',(0,.115,1.67),(.17,.012,.13),mat('bsodm','#1e5bd8',.2,emit='#2a6bff',strength=5),'head',bev=.006)
        box('bsodt',(-.02,.123,1.69),(.08,.004,.012),mat('bsodw','#fff',.2,emit='#fff',strength=6),'head',bev=0)
        box('bsodt2',(-.03,.123,1.655),(.06,.004,.01),mat('bsodw','#fff',.2,emit='#fff',strength=6),'head',bev=0)
    if spec.get('loop'):
        lm=mat('loopm','#5f5',.2,emit='#4f4',strength=7)
        for side in(1,-1):arc_ring('loop',Vector((0,0,1.9)),.16,.014,lm,'head',side)
        ell('loopar',(.16,0,1.9),(.03,.03,.03),lm,'head')
    if os.environ.get('V19','1')=='1':detail_v19(spec,locals())
    # --- руки
    for s,sx in(('R',1),('L',-1)):
        ell('shoulder'+s,(sx*.2,0,1.42),(.068,.068,.068),sleeve if spec.get('sleeve')=='long' or True else sk,'ua'+s) if spec.get('sleeve')!='short' else ell('shoulder'+s,(sx*.2,0,1.42),(.068,.068,.068),top,'ua'+s)
        ell('uarm'+s,(sx*.2,0,1.275),(.052,.052,.17),top if spec.get('sleeve')!='nosleeve' else sk,'ua'+s)
        ell('farm'+s,(sx*.2,0,1.0),(.044,.044,.16),sleeve,'fa'+s)
        ell('hand'+s,(sx*.2,0,.82),(.042,.042,.05),sk,'ha'+s)
        if spec.get('overall'):pass
    if spec.get('phone'):
        box('phone',(.2,.03,.84),(.045,.08,.012),mat('phone','#15181d',.3),'haR',bev=.003)
        box('screen',(.2,.03,.846),(.04,.07,.004),mat('scr','#6ad0ff',.2,emit='#6ad0ff',strength=2),'haR',bev=0)
    return PARTS
def detail_v19(spec,L):
    """v19: детали лица и одежды — уши, белки глаз с бликом, воротник, пуговицы, карманы, подошвы, манжеты"""
    sk=L['sk'];top=L['top'];dark=L['dark'];ob=L['ob']
    if not spec.get('robot'):
        hc=L['hc'];hs=L['hs'];fy=L['fy'];fz=L['fz'];sc=L['sc']
        white=mat('eyew','#f6f4ee',.25);hl=mat('eyehl','#ffffff',.1,emit='#ffffff',strength=2)
        for sx in(-1,1):
            ell('eyewhite',(sx*.038*sc,fy*(.915 if hs==1 else .985),L['fz']+.012),(.019*sc,.008,.019*sc),white,'head',seg=10,rings=6)
            ell('eyehl',(sx*.038*sc+.005,fy*(.94 if hs==1 else 1.01),fz+.018),(.004,.003,.004),hl,'head',seg=6,rings=4)
            if not spec.get('flatHead'):ell('ear',(sx*.098*hs,-.005,hc.z-.005),(.018,.03,.034),sk,'head',seg=10,rings=6)
        ell('cheekL',(-.055*sc,fy*.82,fz-.03),(.022,.01,.016),mat('blush','#e89a8a',.6),'head',seg=8,rings=6)
        ell('cheekR',(.055*sc,fy*.82,fz-.03),(.022,.01,.016),mat('blush','#e89a8a',.6),'head',seg=8,rings=6)
        st=spec.get('hs','short')
        if st in('short','curly','bun'):
            hair=L['hair'];ell('hairback',(0,-.05*hs,hc.z-.01),(.1*hs,.07*hs,.085*hs),hair,'head',seg=14,rings=8)
            for sx in(-1,1):ell('sideburn',(sx*.09*hs,.01,hc.z+.0),(.022,.05,.05),hair,'head',seg=8,rings=6)
    # воротник
    ell('collar',(0,0,1.5),(.075*ob,.07,.03),top,'chest',seg=14,rings=6)
    btn=mat('btn','#e8e4da' if not spec.get('coat') else '#c8ccd2',.35)
    if spec.get('coat'):
        for z in(1.22,1.08,.94):ell('btn',(0,.148,z),(.011,.006,.011),btn,'spine' if z>1 else 'pelvis',seg=8,rings=4)
        for sx in(-1,1):box('pocket',(sx*.11,.15,.86),(.075,.012,.07),top,'pelvis',bev=.006)
        box('bpocket',(-.09,.13,1.33),(.06,.01,.05),top,'chest',bev=.004)
        box('pen',(-.08,.135,1.375),(.008,.008,.05),mat('pen','#2a5bd8',.3),'chest',bev=0)
    elif spec.get('role') in('nurse','receptionist','orderly','handyman'):
        box('badge',(.09,.128,1.36),(.045,.008,.03),mat('badge','#f4f4f0',.4),'chest',bev=.003)
    else:
        ell('hemline',(0,0,1.0),(.168*ob,.123*ob,.03),top,'spine',seg=14,rings=6)
    ell('waist',(0,0,.985),(.168*ob,.118,.022),mat('waistb','#2a2420',.6),'pelvis',seg=14,rings=6)
    if not spec.get('bigFeet'):
        for s,sx in(('R',1),('L',-1)):box('sole'+s,(sx*.09,.06,.008),(.092,.205,.012),mat('sole','#1c1a18',.7),'ft'+s,bev=.006)
def make_armature():
    bpy.ops.object.select_all(action='DESELECT')
    ad=bpy.data.armatures.new('rig');ao=bpy.data.objects.new('rig',ad);bpy.context.scene.collection.objects.link(ao)
    bpy.context.view_layer.objects.active=ao;bpy.ops.object.mode_set(mode='EDIT')
    for b in ORDER:
        eb=ad.edit_bones.new(b);eb.head=Vector(REST[b]);t=Vector(TAIL[b])
        if (t-eb.head).length<.02:t=eb.head+Vector((0,0,.1))
        eb.tail=t
    for b,p in PARENT.items():ad.edit_bones[b].parent=ad.edit_bones[p]
    bpy.ops.object.mode_set(mode='OBJECT');return ao
def attach(ao,parts):
    bpy.context.view_layer.update()
    for o,bn in parts:
        o.parent=ao;o.parent_type='BONE';o.parent_bone=bn
        bpy.context.view_layer.update()
        P=o.matrix_world.copy();o.matrix_parent_inverse=P.inverted()
    bpy.context.view_layer.update()
# ---------- FK ----------
def apply_pose(ao,pose,yaw=0.0):
    """pose: dict bone->(rx,ry,rz) град; спец: 'root_t','root_rx','pelvis_t'"""
    M={};LL={}
    for b in ORDER:
        p=PARENT.get(b);Mp=M[p] if p else Matrix.Identity(4);J=Vector(REST[b])
        r=pose.get(b,(0,0,0));Rm=Euler([R(a) for a in r],'XYZ').to_matrix().to_4x4()
        L=Matrix.Translation(J)@Rm@Matrix.Translation(-J)
        if b=='root':
            rt=pose.get('root_t',(0,0,0));rx=pose.get('root_rx',0);P=Vector(REST['pelvis'])
            L=Matrix.Translation(rt)@Matrix.Translation(P)@Matrix.Rotation(R(rx),4,'X')@Matrix.Translation(-P)
        if b=='pelvis':L=Matrix.Translation(pose.get('pelvis_t',(0,0,0)))@L
        M[b]=Mp@L;LL[b]=L
    ao.rotation_euler=(0,0,R(yaw))
    for b in ORDER:
        pb=ao.pose.bones[b];Rb=pb.bone.matrix_local;pb.rotation_mode='QUATERNION';pb.matrix_basis=Rb.inverted()@LL[b]@Rb
    bpy.context.view_layer.update()

def build_chair(kind,part='all'):
    global PARTS;PARTS=[]
    wood=mat('wood','#8a5a30',.6);seat=mat('seatm','#2f3b4a' if kind=='office' else '#5a7a9a',.8);met=mat('chrome','#9aa0a8',.35)
    if kind=='office':
        ell('hub',(0,-.05,.18),(.03,.03,.15),met,'x');
        for k in range(5):
            a=R(72*k);ell('leg',(cos(a)*.14,-.05+sin(a)*.14,.04),(.14,.025,.02),met,'x',rot=(0,0,72*k))
        for k in range(5):
            a=R(72*k);ell('wh',(cos(a)*.27,-.05+sin(a)*.27,.025),(.03,.03,.025),dark_m(),'x')
        box('seat',(0,-.05,.41),(.46,.46,.085),seat,'x',bev=.025);box('back',(0,-.28,.70),(.44,.07,.4),seat,'x',bev=.025)
        box('armR',(.25,-.05,.62),(.04,.3,.04),met,'x',bev=.005);box('armL',(-.25,-.05,.62),(.04,.3,.04),met,'x',bev=.005)
    else:
        for sx in(-1,1):
            for sy in(-1,1):box('leg',(sx*.2,-.06+sy*.19,.2),(.045,.045,.40),wood,'x',bev=.006)
        box('seat',(0,-.06,.425),(.46,.42,.05),seat,'x',bev=.015);box('back',(0,-.26,.70),(.44,.04,.42),seat,'x',bev=.015)
    if part=='back':PARTS=[(o,b) for o,b in PARTS if o.name.startswith('back')]
    elif part=='base':PARTS=[(o,b) for o,b in PARTS if not o.name.startswith('back')]
    for o,b in [(o,b) for o,b in PARTS]:pass
    return PARTS
def dark_m():return mat('dark','#1a1210',.5)

def build_toilet(angle):
    """Унитаз реальных размеров (м): сиденье 0.41, бачок до 0.80. Лицом к -Y (= +v). Начало координат — центр сиденья на полу.
    angle — угол откидывания крышки сиденья (0 закрыта … 96 поднята)."""
    global PARTS;PARTS=[]
    cer=mat('cer','#f2f4f5',.35);seat=mat('seatw','#e4e8ea',.45);met=mat('chrome','#9aa0a8',.3);water=mat('water','#8fc4e6',.2)
    ell('base',(0,.05,.14),(.17,.2,.14),cer,'x');box('ped',(0,.1,.16),(.22,.2,.32),cer,'x',bev=.03)
    ell('bowl',(0,0,.27),(.2,.31,.15),cer,'x');ell('wat',(0,-.02,.405),(.13,.2,.01),water,'x')
    ell('ring',(0,-.02,.395),(.215,.32,.02),seat,'x')
    box('tank',(0,.27,.58),(.4,.17,.44),cer,'x',bev=.03);box('tlid',(0,.27,.805),(.43,.2,.03),cer,'x',bev=.012)
    box('btn',(.1,.27,.835),(.06,.05,.02),met,'x',bev=.005)
    lid=ell('lid',(0,-.3,0),(.2,.31,.014),seat,'x')
    lid.location=(0,.19,.43);lid.rotation_euler=(-R(angle),0,0)
    return PARTS
def build_sink():
    """Тумба с раковиной реальных размеров (м): столешница 0.85, 0.64x0.55. Лицом к -Y (= +v). Начало — центр клетки на полу."""
    global PARTS;PARTS=[]
    wood=mat('swood','#a8743f',.55);dk=mat('swdk','#7a5129',.6);cer=mat('cer','#f2f4f5',.35);met=mat('chrome','#9aa0a8',.3);bas=mat('basin','#dfe6ea',.25)
    box('cab',(0,.02,.41),(.6,.48,.78),wood,'x',bev=.015);box('kick',(0,-.2,.04),(.56,.04,.07),dk,'x',bev=.005)
    box('gap',(0,-.222,.42),(.006,.01,.6),dk,'x',bev=.001)
    box('h1',(-.04,-.235,.62),(.012,.02,.1),met,'x',bev=.003);box('h2',(.04,-.235,.62),(.012,.02,.1),met,'x',bev=.003)
    box('top',(0,-.01,.83),(.66,.56,.05),cer,'x',bev=.015);ell('bas',(0,-.05,.85),(.21,.16,.025),bas,'x')
    box('post',(0,.19,.92),(.035,.035,.14),met,'x',bev=.008);box('spout',(0,.12,.985),(.03,.15,.025),met,'x',bev=.008)
    box('tap',(.06,.19,.9),(.05,.025,.02),met,'x',bev=.005)
    return PARTS
def build_sofa():
    """Диван на 2 места (м): длина 1.7 вдоль +X (= u), глубина 0.82, сиденье 0.45, спинка 0.86. Лицом к -Y (= +v). Начало — центр футпринта 2x1."""
    global PARTS;PARTS=[]
    fab=mat('sofab','#34508a',.85);fab2=mat('sofab2','#2c4677',.9);leg=mat('sleg','#9a6236',.5)
    box('base',(0,.0,.26),(1.7,.8,.22),fab2,'x',bev=.03)
    for sx in(-.39,.39):box('cush'+str(sx),(sx,-.04,.415),(.76,.66,.13),fab,'x',bev=.05);box('bk'+str(sx),(sx,.3,.64),(.76,.2,.42),fab,'x',bev=.06)
    box('back',(0,.36,.5),(1.7,.12,.66),fab2,'x',bev=.03)
    for sx in(-.79,.79):box('arm'+str(sx),(sx,0,.4),(.14,.8,.46),fab,'x',bev=.05)
    for sx in(-.76,.76):
        for sy in(-.34,.34):box('leg%s%s'%(sx,sy),(sx,sy,.07),(.05,.05,.14),leg,'x',bev=.01)
    return PARTS
