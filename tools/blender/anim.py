import os,math
"""Анимации: аналитические FK-позы для общего скелета."""
from math import sin,cos,pi,radians
DIRS={0:-90,1:180,2:90,3:0}   # +u SE, +v SW, -u NW, -v NE  -> yaw вокруг Z
def lerp(a,b,t):
    if isinstance(a,(int,float)):return a+(b-a)*t
    return tuple(x+(y-x)*t for x,y in zip(a,b))
def blend(p,q,t):
    r={}
    for k in set(p)|set(q):
        d=(0,0,0) if k not in('root_rx',) else 0
        r[k]=lerp(p.get(k,d),q.get(k,d),t)
    return r
def ease(t):return t*t*(3-2*t)
def add(p,k,v):
    o=p.get(k,(0,0,0));p[k]=tuple(a+b for a,b in zip(o,v))
STAND={'uaR':(0,-4,0),'uaL':(0,4,0),'faR':(12,0,0),'faL':(12,0,0),'thR':(0,-1.5,0),'thL':(0,1.5,0)}
def walk(spec,ph,amp=1.0):
    p=dict(STAND);sn=sin(ph);cs=cos(ph);A=27*amp
    bounce=spec.get('bounce')
    for s,sg,c in(('R',1,cs),('L',-1,-cs)):
        t=sg*A*sn;p['th'+s]=(t,p['th'+s][1],0)
        fl=6+42*max(0,c)
        if bounce:fl+=28
        p['sh'+s]=(-fl,0,0);p['ft'+s]=(max(-20,min(25,-(t-fl)*.55)),0,0)
        p['ua'+s]=(-sg*22*sn*amp,p['ua'+s][1],0);p['fa'+s]=(14+12*max(0,-sg*sn),0,0)
    if bounce:
        for s in'RL':p['th'+s]=(p['th'+s][0]+30,p['th'+s][1],0)
        p['pelvis_t']=(0,0,-0.12+0.045*cos(2*ph));p['spine']=(-8,0,0)
    else:
        p['pelvis_t']=(0,0,0.022*cos(2*ph)-0.012)
        p['spine']=(-3,-4*sn,5*sn)
    p['pelvis']=(0,0,4*sn if True else 0);p['chest']=(0,0,-5*sn);p['head']=(0,0,-1.5*sn)
    return p
def idle(spec,ph=0):
    p=dict(STAND);p['spine']=(-1+.8*sin(ph),0,0);p['chest']=(.8*sin(ph),0,0);return p
def sit(spec,kind='chair'):
    p=dict(STAND);hi=.62-.52 if kind=='edge' else 0
    p['pelvis_t']=(0,-.06,-.41+hi);p['thR']=(88,-5,0);p['thL']=(88,5,0);p['shR']=(-88,0,0);p['shL']=(-88,0,0)
    p['spine']=(-2,0,0);p['uaR']=(22,-3,0);p['uaL']=(22,3,0);p['faR']=(68,0,0);p['faL']=(68,0,0)
    if kind=='sofa':p['spine']=(10,0,0);p['pelvis_t']=(0,-.1,-.45);p['head']=(-6,0,0)
    if kind=='wc':p['pelvis_t']=(0,-.1,-.45);p['faR']=(70,0,0);p['faL']=(70,0,0);p['uaR']=(18,-3,0);p['uaL']=(18,3,0);p['thR']=(84,-5,0);p['thL']=(84,5,0)
    return p
def type_(spec,ph):
    p=sit(spec);s=sin(ph)
    p['uaR']=(38,-4,0);p['uaL']=(38,4,0);p['faR']=(68+10*s,0,0);p['faL']=(68-10*s,0,0);p['head']=(-10,0,0);p['spine']=(-6,0,0);return p
def sit_down(spec,t,kind='chair'):
    e=ease(t);p=blend(idle(spec),sit(spec,kind),e)
    b=sin(pi*t)
    add(p,'spine',(-20*b,0,0));add(p,'pelvis_t',(0,-.07*b,.0));add(p,'head',(-6*b,0,0))
    return p
def lid_pose(spec,i,n=6):
    """поднять крышку: шаг к унитазу, наклон, рука тянется вниз-вперёд к крышке, подъём"""
    p=dict(STAND);rt=[.12,.26,.36,.36,.36,.24][i]
    p['root_t']=(0,rt,0)
    lean=[-4,-14,-22,-22,-16,-6][i];p['spine']=(lean,0,0);p['chest']=(lean*.4,0,0);p['head']=(-4,0,0)
    ua=[14,38,50,62,80,30][i];fa=[14,30,28,24,16,14][i]
    p['uaR']=(ua,-6,0);p['faR']=(fa,0,0);p['uaL']=(10,4,0);p['faL']=(18,0,0)
    p['thR']=(6,-1.5,0);p['thL']=(6,1.5,0)
    return p
def coffee_pose(spec,i):
    """кофе: шаг к машине, нажать кнопку, взять чашку с поддона, выпить"""
    p=dict(STAND);rt=[.1,.16,.16,.12,.04,0,0,0][i];p['root_t']=(0,rt,0)
    lean=[-3,-6,-10,-4,0,0,0,0][i];p['spine']=(lean,0,0)
    ua=[40,58,46,30,42,58,60,46][i];fa=[30,12,38,70,100,124,128,106][i];uz=[0,0,0,20,36,48,50,36][i]
    p['uaR']=(ua,-6-uz,0);p['faR']=(fa,0,0);p['uaL']=(8,4,0);p['faL']=(16,0,0)
    p['head']=[(-4,0,0),(-6,0,0),(-8,0,0),(-4,0,0),(0,0,0),(10,0,0),(14,0,0),(6,0,0)][i]
    return p
def flush_pose(spec,i):
    p=dict(STAND);p['root_t']=(0,.34,0);p['spine']=(-8,0,0)
    p['uaR']=(78+[0,10,0][i],-6,0);p['faR']=(40-[0,12,0][i],0,0);p['uaL']=(10,4,0);p['head']=(-6,0,0);return p
def wash(spec,ph):
    p=dict(STAND);s=sin(ph)
    p['spine']=(-12,0,0);p['pelvis_t']=(0,0,-.02);p['uaR']=(52,-6,0);p['uaL']=(52,6,0);p['faR']=(60+8*s,-0,18);p['faL']=(60-8*s,0,-18);p['head']=(-10,0,0)
    p['thR']=(6,-1.5,0);p['thL']=(6,1.5,0);p['shR']=(-6,0,0);p['shL']=(-6,0,0);return p
def reach(spec,ph):
    p=walk(spec,ph,.9);p['uaR']=(78,-6,0);p['faR']=(14,0,0);p['spine']=(-6,0,0);p['chest']=(0,0,-8);return p
def crouch(spec,ph):
    s=sin(ph);p=dict(STAND)
    p['pelvis_t']=(0,-.1,-.5);p['thR']=(95,-12,0);p['thL']=(70,12,0);p['shR']=(-120,0,0);p['shL']=(-115,0,0);p['ftR']=(25,0,0);p['ftL']=(25,0,0)
    p['spine']=(-28,0,0);p['chest']=(-6,0,0);p['head']=(-8,0,0)
    p['uaR']=(55+10*s,-6,0);p['faR']=(70-30*max(0,s),0,0);p['uaL']=(45,4,0);p['faL']=(55,0,0);return p
def treat(spec,ph):
    s=sin(ph);p=idle(spec);p['spine']=(-14,0,0);p['head']=(-10,0,0);p['uaR']=(48+6*s,-8,0);p['faR']=(46,0,0);p['uaL']=(30,6,0);p['faL']=(40+8*s,0,0);p['pelvis_t']=(0,0,-.02)
    p['thR']=(4,-1.5,0);p['thL']=(4,1.5,0);p['shR']=(-6,0,0);p['shL']=(-6,0,0);return p
LIE={'root_rx':90,'root_t':(0,0,-.2),'uaR':(2,-8,0),'uaL':(2,8,0),'faR':(5,0,0),'faL':(5,0,0),'head':(0,0,0),'spine':(0,0,0)}
def lie_seq(spec,i,n=7):
    """возвращает (pose,yaw,rootoffset) для кадра i из 7: подход, поворот, сесть на край, откинуться, лечь"""
    # (yaw, root_t_xy, pose-func)
    ph=i
    if i==0:  p=idle(spec);p['root_t']=(0,-1.5,0);return p,0
    if i==1:  p=walk(spec,pi*.5,.9);p['root_t']=(.3,-.8,0);return p,-25
    if i==2:  p=idle(spec);p['root_t']=(.55,-.15,0);return p,-60
    if i==3:  p=sit_down(spec,.55,'edge');p['root_t']=(.4,0,0);return p,-90
    if i==4:  p=sit(spec,'edge');p['root_t']=(.32,0,0);return p,-90
    if i==5:
        p=blend(sit(spec,'edge'),LIE,.5);p['root_rx']=45;p['pelvis_t']=(0,-.02,-.16);p['thR']=(50,-4,0);p['thL']=(50,4,0);p['shR']=(-30,0,0);p['shL']=(-30,0,0);p['root_t']=(.12,0,-.06);return p,-135
    p=dict(LIE);p['pelvis_t']=(0,0,0);return p,180
def trait(spec,p,act):
    """модификаторы черт болезней"""
    if spec.get('phone') and act in('walk','idle','sit','sit_down','door'):
        p['uaR']=(115,-10,0);p['faR']=(65,0,0);p['head']=(0,0,0)
    if spec.get('hunch'):
        add(p,'spine',(-18,0,0));add(p,'chest',(-8,0,0));add(p,'head',(8,0,0))
        if act in('walk','idle'):p['uaR']=(30,-3,0);p['uaL']=(30,3,0);p['faR']=(60,0,0);p['faL']=(60,0,0)
    if spec.get('belly') and act in('walk','idle'):add(p,'spine',(4,0,0))
    if spec.get('yawn') and act in('idle','walk'):add(p,'head',(8,0,0))
    return p

# v26: реактивные сидячие действия персонала
def sit_idle(spec,i):
    p=sit(spec);b=sin(2*pi*i/4);c=cos(2*pi*i/4)
    add(p,'chest',(1.4*b,0,0));add(p,'head',(-1.0*b,0,14*c));add(p,'uaR',(0,0,1.0*b));add(p,'uaL',(0,0,-1.0*b));return p
def greet(spec,i):
    p=sit(spec);s=sin(2*pi*i/4)
    p['uaR']=(92,-48,0);p['faR']=(62+26*s,0,0);p['head']=(4,0,0);p['spine']=(2,0,0);p['chest']=(0,0,6);return p
def talk(spec,i):
    p=sit(spec);s=sin(2*pi*i/4);c=cos(2*pi*i/4)
    p['uaR']=(42+10*s,-10,0);p['faR']=(75+18*c,0,0);p['uaL']=(36-6*s,10,0);p['faL']=(70-12*c,0,0);p['head']=(-3+4*s,0,6*c);p['spine']=(-4,0,0);return p
def write(spec,i):
    p=sit(spec);s=sin(2*pi*i/4)
    p['uaR']=(36,-8,0);p['faR']=(72+6*s,0,4*s);p['uaL']=(34,10,0);p['faL']=(80,0,0);p['head']=(-18,0,0);p['spine']=(-10,0,0);return p
def give(spec,i):
    t=ease(i/3);p=blend(type_(spec,0),sit(spec),0)
    p['uaR']=(38+50*t,-6,0);p['faR']=(68-55*t,0,0);p['spine']=(-6-8*t,0,0);p['head']=(-10+8*t,0,0);p['chest']=(0,0,-6*t);return p
# описание анимаций: имя -> (число кадров, функция(i,n)->(pose,yaw|None), направления)
def frames(spec,act,d):
    """список (pose,yaw) для действия act и направления d(0..3)"""
    yw=DIRS[d];out=[]
    if act=='walk':
        n=int(os.environ.get('WALKN','12'))
        for i in range(n):out.append((walk(spec,2*pi*i/n),yw))
    elif act=='idle':
        out=[]
        for i in range(4):
            p=idle(spec);b=math.sin(2*pi*i/4)
            add(p,'chest',(1.6*b,0,0));add(p,'head',(-1.2*b,0,1.5*math.cos(2*pi*i/4)));add(p,'uaR',(0,0,1.2*b));add(p,'uaL',(0,0,-1.2*b))
            out.append((p,yw))
    elif act=='door':
        for i in range(8):out.append((reach(spec,2*pi*i/8),yw))
    elif act in('sit_down','sit_down_sofa'):
        k='sofa' if act.endswith('sofa') else 'chair'
        for i in range(5):out.append((sit_down(spec,i/4,k),yw))
    elif act=='sit_down_wc':
        for i in range(5):out.append((sit_down(spec,i/4,'wc'),yw))
    elif act=='lid':
        for i in range(6):out.append((lid_pose(spec,i),yw))
    elif act=='coffee':
        for i in range(8):out.append((coffee_pose(spec,i),yw))
    elif act=='flush':
        for i in range(3):out.append((flush_pose(spec,i),yw))
    elif act=='sit':out=[(sit(spec),yw)]
    elif act=='sit_sofa':out=[(sit(spec,'sofa'),yw)]
    elif act=='wc':out=[(sit(spec,'wc'),yw)]
    elif act=='type':
        for i in range(4):out.append((type_(spec,2*pi*i/4),yw))
    elif act=='wash':
        for i in range(4):out.append((wash(spec,2*pi*i/4),yw))
    elif act=='crouch':
        for i in range(4):out.append((crouch(spec,2*pi*i/4),yw))
    elif act=='treat':
        for i in range(4):out.append((treat(spec,2*pi*i/4),yw))
    elif act in('sit_idle','greet','talk','write','give'):
        f={'sit_idle':sit_idle,'greet':greet,'talk':talk,'write':write,'give':give}[act]
        for i in range(4):out.append((f(spec,i),yw))
    elif act=='lie':
        for i in range(7):p,y=lie_seq(spec,i);out.append((p,y))
    base=act.split('_')[0] if act not in('sit_down','sit_down_sofa') else 'sit'
    return [(trait(spec,p,'sit' if act.startswith('sit') else 'wc' if act=='wc' else act),y) for p,y in out]
# какие действия нужны
ACTS_ALL=['walk','idle','sit_down','sit','door','wc','wash']
PLAN={'patient':[('walk',[0,1,2,3]),('idle',[0,1,2,3]),('sit_down',[0,1,2,3]),('sit',[0,1,2,3]),('door',[0,1,2,3]),('wc',[1]),('sit_down_wc',[1]),('lid',[3]),('flush',[3]),('wash',[3,2]),('lie',[0])],
 'doctor':[('coffee',[3]),('walk',[0,1,2,3]),('idle',[0,1,2,3]),('sit_down',[0,1,2,3]),('sit_down_sofa',[0,1,2,3]),('sit_sofa',[0,1,2,3]),('type',[0,1,2,3]),('sit',[0,1,2,3]),('door',[0,1,2,3]),('treat',[0,1,2,3])],
 'nurse':[('coffee',[3]),('walk',[0,1,2,3]),('idle',[0,1,2,3]),('sit_down',[0,1,2,3]),('sit',[0,1,2,3]),('sit_down_sofa',[0,1,2,3]),('sit_sofa',[0,1,2,3]),('door',[0,1,2,3]),('treat',[0,1,2,3])],
 'handyman':[('coffee',[3]),('walk',[0,1,2,3]),('idle',[0,1,2,3]),('sit_down_sofa',[0,1,2,3]),('sit_sofa',[0,1,2,3]),('door',[0,1,2,3]),('crouch',[0,1,2,3])],
 'orderly':[('coffee',[3]),('walk',[0,1,2,3]),('idle',[0,1,2,3]),('sit_down_sofa',[0,1,2,3]),('sit_sofa',[0,1,2,3]),('door',[0,1,2,3]),('crouch',[0,1,2,3])],
 'receptionist':[('coffee',[3]),('walk',[0,1,2,3]),('idle',[0,1,2,3]),('sit_down',[0,1,2,3]),('type',[0,1,2,3]),('sit',[0,1,2,3]),('sit_down_sofa',[0,1,2,3]),('sit_sofa',[0,1,2,3]),('door',[0,1,2,3])]}
