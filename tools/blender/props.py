"""3D-реквизит реального размера (м). Все модели смотрят лицом в -Y (= +v, dir 1). Начало — центр футпринта на полу."""
import bmesh,bpy
from math import radians as R,sin,cos,pi
from mathutils import Matrix,Euler,Vector
import rig
from rig import mat,box,ell,_obj
def cyl(name,c,r,h,m,rot=None,seg=20,r2=None):
    bm=bmesh.new();bmesh.ops.create_cone(bm,cap_ends=True,segments=seg,radius1=r,radius2=(r if r2 is None else r2),depth=h)
    mt=Matrix.Translation(c)
    if rot:mt=mt@Euler([R(a) for a in rot],'XYZ').to_matrix().to_4x4()
    bmesh.ops.transform(bm,matrix=mt,verts=bm.verts)
    o=_obj(name,bm,m);rig.PARTS.append((o,'x'));return o
def tor(name,c,R1,r,m,rot=None,seg=24):
    """тор из цепочки сфер"""
    for k in range(seg):
        a=2*pi*k/seg;p=Vector((R1*cos(a),R1*sin(a),0))
        if rot:p=Euler([R(x) for x in rot],'XYZ').to_matrix()@p
        ell(name,tuple(Vector(c)+p),(r,r,r),m,'x',seg=8,rings=6)
def M():
    return dict(white=mat('pw','#eef1f3',.4),grey=mat('pg','#8d949c',.45),dark=mat('pd','#24282e',.5),chrome=mat('pc','#b9c0c8',.25),
        glass=mat('pgl','#cfe8f6',.05),red=mat('pr','#e02a20',.3,emit='#ff2a1a',strength=4),green=mat('pgr','#30d060',.3,emit='#30ff70',strength=3),
        blue=mat('pb','#3aa0ff',.3,emit='#3ab0ff',strength=3),wood=mat('pwd','#9a6a3a',.55),yel=mat('py','#f2c230',.4))
def coffee():
    """Кофе-уголок: тумба 0.56x0.46x0.8 + эспрессо-машина 0.38x0.34x0.42 (итого ≈1.25 м)"""
    rig.PARTS=[];m=M();wd=mat('cwd','#7a5530',.55);bk=mat('cblk','#1d1f23',.35);ss=mat('css','#c4cad1',.2)
    box('cab',(0,.18,.4),(.56,.46,.8),wd,'x',bev=.015);box('cabt',(0,.18,.815),(.6,.5,.03),m['dark'],'x',bev=.006)
    box('door',(0,-.055,.42),(.5,.01,.68),mat('cwd2','#8a6238',.5),'x',bev=.004);box('kn',(.18,-.065,.6),(.02,.02,.08),m['chrome'],'x',bev=.004)
    box('body',(0,.24,1.04),(.38,.3,.42),ss,'x',bev=.025);box('topc',(0,.24,1.26),(.36,.28,.03),bk,'x',bev=.01)
    box('face',(0,.085,1.1),(.3,.012,.18),bk,'x',bev=.008);box('scr',(.06,.078,1.14),(.09,.005,.05),m['blue'],'x',bev=0)
    ell('btn',(-.08,.076,1.14),(.022,.012,.022),m['red'],'x',seg=10,rings=6);ell('btn2',(-.08,.076,1.08),(.018,.01,.018),m['green'],'x',seg=10,rings=6)
    box('spout',(0,.1,.96),(.08,.06,.04),bk,'x',bev=.008);box('tray',(0,.06,.85),(.24,.14,.025),m['chrome'],'x',bev=.006)
    cyl('cup',(0,.07,.895),.03,.07,m['white'],r2=.035)
    for k in range(3):cyl('cups%d'%k,(.2,.32,.86+k*.055),.034,.06,mat('cupc','#e8e2d8',.4),r2=.04)
    return rig.PARTS
def pump():
    """Сдувательный аппарат: основание, колонна, стеклянный купол, сильфон-насос, лампа (≈1.45 м)"""
    rig.PARTS=[];m=M();bl=mat('pblu','#2f5f9e',.4)
    box('base',(0,.1,.12),(.8,.66,.24),m['grey'],'x',bev=.03)
    cyl('col',(0,.12,.6),.24,.72,m['white']);cyl('ring',(0,.12,.97),.27,.05,bl)
    ell('dome',(0,.12,1.0),(.25,.25,.3),m['glass'],'x',seg=24,rings=12)
    ell('ball',(0,.12,1.08),(.12,.12,.12),mat('bal','#ff6fa0',.3,emit='#ff3a80',strength=.6),'x')
    for k in range(6):cyl('bel%d'%k,(.36,.12,.3+k*.07),.11 if k%2 else .09,.06,mat('belr','#2a2a2a',.6))
    cyl('pcap',(.36,.12,.74),.12,.04,m['chrome']);box('handle',(.36,.12,.84),(.03,.03,.18),m['chrome'],'x',bev=.005);box('hbar',(.36,.12,.93),(.18,.03,.03),m['dark'],'x',bev=.005)
    for k in range(7):ell('hose',(.3-k*.045,-.05-k*.02,.22+abs(3-k)*.02),(.028,.028,.028),m['dark'],'x',seg=8,rings=6)
    box('panel',(-.28,-.14,.55),(.18,.04,.26),m['dark'],'x',bev=.01);ell('gauge',(-.28,-.165,.6),(.06,.012,.06),m['white'],'x',seg=14,rings=6)
    ell('lamp',(0,.12,1.33),(.05,.05,.06),m['red'],'x');cyl('lstem',(0,.12,1.28),.015,.06,m['chrome'])
    return rig.PARTS
def xray():
    """Рентген: колонна 1.95 м, излучатель на консоли, детектор-панель у стены"""
    rig.PARTS=[];m=M()
    box('plate',(0,.25,.02),(.7,.4,.04),m['grey'],'x',bev=.01);box('col',(-.25,.32,.98),(.12,.12,1.92),m['white'],'x',bev=.02)
    box('det',(.08,.36,1.2),(.5,.06,.62),m['white'],'x',bev=.02);box('detw',(.08,.33,1.2),(.42,.01,.52),mat('detg','#2c3540',.3),'x',bev=0)
    box('arm',(-.25,.05,1.75),(.1,.55,.1),m['grey'],'x',bev=.015);box('tube',(-.25,-.24,1.65),(.22,.2,.22),m['white'],'x',bev=.03)
    box('coll',(-.25,-.24,1.5),(.16,.16,.1),m['dark'],'x',bev=.01);ell('rad',(-.25,-.24,1.79),(.05,.05,.03),mat('rady','#f2c230',.4,emit='#ffb000',strength=2),'x')
    for k in range(3):box('stripe%d'%k,(.08,.325,.95+k*.2),(.42,.005,.012),m['yel'],'x',bev=0)
    return rig.PARTS
def dnaseq():
    """Генетический секвенатор: шкаф 0.8x0.6x1.55, окно со светящейся спиралью ДНК, монитор"""
    rig.PARTS=[];m=M()
    box('cab',(0,.12,.78),(.8,.6,1.56),m['white'],'x',bev=.03);box('win',(-.1,-.185,.95),(.42,.02,.82),m['glass'],'x',bev=.01)
    c1=mat('dna1','#ff4fd8',.3,emit='#ff4fd8',strength=4);c2=mat('dna2','#4fe0ff',.3,emit='#4fe0ff',strength=4)
    for k in range(14):
        z=.6+k*.052;a=k*.55
        for s,cm in((1,c1),(-1,c2)):ell('dn',(-.1+s*.12*cos(a),-.05+s*.06*sin(a),z),(.022,.022,.022),cm,'x',seg=8,rings=6)
        if k%2==0:box('rung',(-.1,-.05,z),(.24*abs(cos(a))+.02,.01,.008),m['grey'],'x',rot=(0,0,0),bev=0)
    box('mon',(.26,-.17,1.15),(.18,.04,.26),m['dark'],'x',bev=.01);box('mscr',(.26,-.192,1.16),(.14,.005,.2),m['green'],'x',bev=0)
    for k in range(4):ell('led%d'%k,(.2+k*.045,-.19,.6),(.012,.008,.012),[m['red'],m['green'],m['blue'],m['green']][k],'x',seg=8,rings=6)
    box('kick',(0,-.16,.04),(.76,.04,.08),m['grey'],'x',bev=.005)
    return rig.PARTS
def elchair():
    """Электрокресло: металлическое кресло (сиденье 0.46), шлем-катушка на консоли, катушка Теслы"""
    rig.PARTS=[];m=M();cu=mat('copper','#c8743a',.3)
    seat=mat('elseat','#4a2a1e',.6)
    box('seat',(0,-.02,.44),(.56,.52,.09),seat,'x',bev=.03);box('back',(0,.24,.82),(.54,.1,.72),seat,'x',bev=.03)
    for sx in(-1,1):
        box('armr',(sx*.3,-.02,.62),(.07,.5,.06),m['chrome'],'x',bev=.01)
        for sy in(-1,1):box('leg',(sx*.24,-.02+sy*.2,.2),(.05,.05,.4),m['chrome'],'x',bev=.008)
    box('boom',(0,.32,1.45),(.06,.06,.6),m['chrome'],'x',bev=.008);box('boomh',(0,.18,1.75),(.06,.3,.06),m['chrome'],'x',bev=.008)
    cyl('helm',(0,.03,1.78),.13,.08,m['chrome'],r2=.1)
    for k in range(4):cyl('coil%d'%k,(0,.03,1.83+k*.025),.09-k*.012,.018,cu)
    cyl('tesla',(.42,.25,.55),.07,1.1,cu,r2=.05);ell('tball',(.42,.25,1.15),(.11,.11,.11),m['chrome'],'x')
    ell('spark',(.42,.25,1.15),(.13,.13,.13),mat('sp','#b8a0ff',.2,emit='#a080ff',strength=1.2),'x')
    return rig.PARTS
def rebootpod():
    """Капсула перезагрузки головы: кабина 0.95x0.8x2.05, шлем на кабеле, большая кнопка"""
    rig.PARTS=[];m=M();sh=mat('podsh','#d7dde4',.35)
    box('back',(0,.36,1.02),(.9,.08,2.04),sh,'x',bev=.03)
    for sx in(-1,1):box('side',(sx*.43,.05,1.02),(.06,.7,2.04),sh,'x',bev=.03)
    box('roof',(0,.05,2.03),(.94,.74,.08),sh,'x',bev=.03);box('floor',(0,.05,.04),(.9,.72,.08),m['grey'],'x',bev=.01)
    box('sign',(0,-.3,1.94),(.6,.03,.12),m['dark'],'x',bev=.01);box('signl',(0,-.318,1.94),(.5,.005,.06),m['green'],'x',bev=0)
    cyl('cable',(0,.15,1.75),.02,.4,m['dark']);ell('helm',(0,.15,1.5),(.15,.15,.11),m['chrome'],'x')
    for k in range(6):ell('hled',(.14*cos(k*pi/3),.15+.14*sin(k*pi/3),1.48),(.015,.015,.015),m['blue'],'x',seg=8,rings=6)
    box('pnl',(.43,-.32,1.2),(.08,.04,.3),m['dark'],'x',bev=.008);ell('bigbtn',(.43,-.345,1.12),(.04,.02,.04),m['red'],'x')
    box('strip',(-.39,.05,1.0),(.01,.6,1.6),mat('podl','#7af',.3,emit='#5af',strength=1.5),'x',bev=0)
    return rig.PARTS
def inflator():
    """Надувательный компрессор: бак на колёсах, манометр, шланг с маской"""
    rig.PARTS=[];m=M();tk=mat('tank','#d63a2a',.35)
    cyl('tank',(0,.12,.42),.24,.72,tk,rot=(0,90,0));ell('capL',(-.36,.12,.42),(.04,.24,.24),tk,'x');ell('capR',(.36,.12,.42),(.04,.24,.24),tk,'x')
    for sx in(-.25,.25):
        for sy in(-.08,.32):ell('wh',(sx,sy,.07),(.07,.03,.07),m['dark'],'x')
    box('motor',(0,.12,.76),(.36,.26,.2),m['grey'],'x',bev=.03);ell('gauge',(.12,-.03,.82),(.07,.015,.07),m['white'],'x',seg=16,rings=6)
    box('needle',(.12,-.05,.84),(.008,.004,.05),m['red'],'x',rot=(0,30,0),bev=0)
    box('hpost',(-.3,.12,1.0),(.05,.05,.5),m['chrome'],'x',bev=.008);box('hhand',(-.3,.12,1.26),(.05,.3,.05),m['chrome'],'x',bev=.008)
    for k in range(10):ell('hose',(-.15-k*.012,-.05-k*.03,.9-k*.05+(.002*k*k)),(.025,.025,.025),mat('hose','#e6c22a',.5),'x',seg=8,rings=6)
    cyl('mask',(-.27,-.36,.5),.06,.08,m['glass'],r2=.09)
    return rig.PARTS
def uvlamp():
    """Дерматологическая УФ-лампа на штативе: колонна 1.7 м, панель с фиолетовыми трубками"""
    rig.PARTS=[];m=M();uv=mat('uv','#b070ff',.2,emit='#b070ff',strength=5)
    for k in range(5):a=k*72;box('foot%d'%k,(.18*cos(R(a)),.15+.18*sin(R(a)),.03),(.3,.05,.03),m['dark'],'x',rot=(0,0,a),bev=.005)
    cyl('pole',(0,.15,.85),.025,1.65,m['chrome']);box('arm',(0,-.08,1.62),(.05,.5,.05),m['chrome'],'x',bev=.008)
    box('head',(0,-.36,1.55),(.6,.32,.08),m['white'],'x',bev=.02)
    for k in range(4):cyl('tube%d'%k,(0,-.27-k*.06,1.5),.014,.52,uv,rot=(0,90,0))
    return rig.PARTS
def labbench():
    """Исследовательский стол 1.8x0.7 (2x1): микроскоп, монитор, колбы"""
    rig.PARTS=[];m=M()
    box('top',(0,.08,.88),(1.8,.66,.05),m['white'],'x',bev=.01)
    for sx in(-.84,.84):box('legs',(sx,.08,.43),(.06,.6,.86),m['grey'],'x',bev=.01)
    box('drw',(.55,.08,.68),(.6,.6,.35),m['grey'],'x',bev=.015)
    box('mbase',(-.45,.1,.92),(.18,.22,.03),m['dark'],'x',bev=.006);box('marm',(-.45,.18,1.08),(.05,.05,.3),m['dark'],'x',rot=(-10,0,0),bev=.008)
    cyl('mtube',(-.45,.08,1.15),.03,.22,m['dark'],rot=(25,0,0));box('mstage',(-.45,.06,1.0),(.14,.12,.02),m['chrome'],'x',bev=.004)
    box('mon',(.15,.28,1.15),(.5,.04,.32),m['dark'],'x',bev=.012);box('mscr',(.15,.258,1.16),(.46,.005,.27),m['blue'],'x',bev=0);box('mst',(.15,.3,.95),(.05,.05,.12),m['dark'],'x',bev=.005)
    box('kb',(.15,-.05,.915),(.36,.12,.02),m['grey'],'x',bev=.004)
    for k,(x,cm) in enumerate(((.55,'#3f8'),(.66,'#f4a'),(.76,'#5cf'))):
        cyl('fl%d'%k,(x,.0,.97),.035,.12,m['glass']);cyl('liq%d'%k,(x,.0,.95),.03,.07,mat('lq'+cm,cm,.2,emit=cm,strength=1.5))
    return rig.PARTS
def morguefridge():
    """Холодильник морга 1.8x0.7 (2x1): стальной блок с 2x3 дверцами-ящиками, ручки, термометр"""
    rig.PARTS=[];m=M();st=mat('steel','#a9b2ba',.3)
    box('body',(0,.05,1.0),(1.8,.66,2.0),st,'x',bev=.02)
    for i in range(3):
        for j in range(2):
            x=-.6+i*.6;z=.55+j*.85
            box('door%d%d'%(i,j),(x,-.285,z),(.54,.03,.74),m['chrome'],'x',bev=.012)
            box('hdl%d%d'%(i,j),(x,-.31,z+.22),(.3,.03,.04),m['dark'],'x',bev=.006)
            box('tag%d%d'%(i,j),(x,-.302,z-.15),(.12,.01,.07),m['white'],'x',bev=.002)
    box('panel',(0,-.29,1.93),(.5,.02,.1),m['dark'],'x',bev=.006);box('led',(.15,-.302,1.93),(.06,.006,.03),m['blue'],'x',bev=0)
    return rig.PARTS
def autopsy():
    """Секционный стол 1.8x0.7 (2x1): стальная столешница с бортиком на тумбе, лампа сверху"""
    rig.PARTS=[];m=M();st=mat('steel','#a9b2ba',.25)
    box('top',(0,0,.86),(1.75,.66,.04),st,'x',bev=.01)
    for sy in(-.32,.32):box('rimy',(0,sy,.9),(1.75,.03,.06),st,'x',bev=.005)
    for sx in(-.86,.86):box('rimx',(sx,0,.9),(.03,.66,.06),st,'x',bev=.005)
    box('ped',(0,0,.43),(.3,.3,.84),m['grey'],'x',bev=.02);box('base',(0,0,.03),(.7,.5,.06),m['grey'],'x',bev=.01)
    cyl('drain',(.7,0,.885),.04,.01,m['dark'])
    box('sheet',(-.1,0,.9),(1.2,.5,.05),mat('sheet','#dfe6ee',.6),'x',bev=.02)
    box('tray',(.62,-.2,.92),(.3,.16,.02),m['chrome'],'x',bev=.004)
    return rig.PARTS
def organfridge():
    """Холодильник для органов 0.6x0.6 (1x1): стеклянная дверь, контейнеры, табло"""
    rig.PARTS=[];m=M()
    box('body',(0,.03,.85),(.6,.56,1.7),m['white'],'x',bev=.02)
    box('door',(0,-.255,.8),(.5,.02,1.3),m['glass'],'x',bev=.01)
    for k,z in enumerate((.35,.75,1.15)):
        box('sh%d'%k,(0,0,z),(.5,.48,.015),m['chrome'],'x',bev=0)
        for j,(x,c) in enumerate(((-.12,'#e05a6a'),(.12,'#c06040'))):
            cyl('box%d%d'%(k,j),(x,-.02,z+.09),.08,.16,mat('ob'+c,c,.3,emit=c,strength=.6))
    box('disp',(0,-.255,1.58),(.36,.02,.12),m['dark'],'x',bev=.006);box('dled',(0,-.268,1.58),(.28,.005,.07),m['green'],'x',bev=0)
    return rig.PARTS

def bookcase():
    """Книжный стеллаж 1.8x0.45 (2x1), 2 м: 4 полки, разноцветные корешки"""
    rig.PARTS=[];m=M();wd=mat('bcw','#7b5130',.55)
    box('back',(0,.2,1.0),(1.8,.04,2.0),wd,'x',bev=.01)
    for sx in(-.88,0,.88):box('side',(sx,0,1.0),(.04,.44,2.0),wd,'x',bev=.008)
    cols=['#b03a2e','#2e6fb0','#3f8f4a','#d9a03a','#6b3fa0','#e0e0d0','#8a2a4a','#245a5a']
    for k in range(5):
        z=.05+k*.47;box('sh%d'%k,(0,0,z),(1.8,.44,.03),wd,'x',bev=.004)
        if k==4:break
        x=-.84;i=k*3
        while x<.8:
            w=.04+((i*7)%5)*.01;h=.28+((i*5)%4)*.03
            if abs(x)<.03:x+=.05;continue
            box('bk%d_%d'%(k,i),(x+w/2,-.02,z+.015+h/2),(w,.3,h),mat('bk'+cols[i%8],cols[i%8],.5),'x',bev=.003)
            x+=w+.006;i+=1
    return rig.PARTS
def readdesk():
    """Читальный стол 0.7x0.6 (1x1): столик, раскрытая книга, зелёная лампа"""
    rig.PARTS=[];m=M();wd=mat('rdw','#8a5a32',.5)
    box('top',(0,0,.74),(.7,.6,.04),wd,'x',bev=.01)
    for sx in(-.3,.3):
        for sy in(-.25,.25):box('leg',(sx,sy,.36),(.05,.05,.72),wd,'x',bev=.005)
    box('bookl',(-.08,-.08,.775),(.16,.22,.02),mat('pg1','#f4efe0',.6),'x',bev=.003);box('bookr',(.09,-.08,.775),(.16,.22,.02),mat('pg1','#f4efe0',.6),'x',bev=.003)
    box('cov',(0,-.08,.763),(.36,.24,.01),mat('cv','#8a2a2a',.5),'x',bev=0)
    cyl('lb',(.2,.18,.77),.06,.02,m['chrome']);cyl('ls',(.2,.18,.9),.012,.26,m['chrome'])
    cyl('lsh',(.15,.12,1.03),.09,.1,mat('lgr','#1f7a3a',.3,emit='#ffe9a0',strength=.6),rot=(30,0,0),r2=.05)
    return rig.PARTS
def chiefdesk():
    """Стол главврача 1.6x0.8 (2x1): массив, кожаная вставка, табличка, монитор, глобус"""
    rig.PARTS=[];m=M();wd=mat('cdw','#5a3418',.45)
    box('top',(0,0,.76),(1.6,.8,.05),wd,'x',bev=.012);box('ins',(0,.02,.79),(1.1,.5,.01),mat('lth','#1f4a2a',.6),'x',bev=0)
    for sx in(-.6,.6):box('ped',(sx,0,.37),(.38,.74,.74),wd,'x',bev=.012)
    box('front',(0,-.37,.45),(1.5,.03,.6),wd,'x',bev=.006)
    box('plate',(0,-.3,.83),(.34,.05,.07),mat('gold','#d8b040',.25),'x',bev=.004)
    box('mon',(-.45,.2,1.02),(.42,.04,.28),m['dark'],'x',bev=.01);box('scr',(-.45,.177,1.02),(.38,.005,.24),m['blue'],'x',bev=0);box('mst',(-.45,.24,.84),(.08,.08,.1),m['dark'],'x',bev=.005)
    cyl('gb',(.55,.15,.82),.06,.04,wd);ell('glb',(.55,.15,.97),(.12,.12,.12),mat('glo','#3a7ac0',.4),'x',seg=16,rings=10)
    cyl('pen',(.25,-.1,.83),.03,.08,m['dark'])
    return rig.PARTS
def aquarium():
    """Аквариум 0.6x0.6 (1x1) на тумбе: вода, рыбки, водоросли"""
    rig.PARTS=[];m=M();wd=mat('aqw','#3a2a20',.5)
    box('stand',(0,0,.35),(.6,.5,.7),wd,'x',bev=.01)
    box('water',(0,0,.97),(.56,.44,.5),mat('aqwt','#4fb6e0',.05,emit='#4fc0ff',strength=.5),'x',bev=.005)
    box('lid',(0,0,1.24),(.6,.48,.04),m['dark'],'x',bev=.005);box('sand',(0,0,.74),(.56,.44,.04),mat('snd','#e0c890',.8),'x',bev=0)
    for k,(x,z,c) in enumerate(((-.12,.95,'#ff8a20'),(.1,1.05,'#ffd030'),(.02,.86,'#ff4060'))):ell('fish%d'%k,(x,-.23,z),(.06,.02,.035),mat('f'+c,c,.3),'x',seg=10,rings=6)
    for k,x in enumerate((-.2,.18)):cyl('wd%d'%k,(x,0,.9),.02,.3,mat('weed','#2a9a40',.6))
    return rig.PARTS
def sofa():return rig.build_sofa()
PROPS={'coffee':coffee,'pumpmachine':pump,'xray':xray,'dnaseq':dnaseq,'elchair':elchair,'rebootpod':rebootpod,'inflator':inflator,'uvlamp':uvlamp,'labbench':labbench,'sofa':sofa,'morguefridge':morguefridge,'autopsy':autopsy,'organfridge':organfridge,'bookcase':bookcase,'readdesk':readdesk,'chiefdesk':chiefdesk,'aquarium':aquarium}
