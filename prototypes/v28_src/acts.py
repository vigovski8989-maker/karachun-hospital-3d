"""v28: непрерывные (30 fps) действия на общем скелете. fn(t∈[0,1)) -> pose"""
import sys,os,math
sys.path.insert(0,'/workspace/hospital-game/tools/blender')
import anim
from anim import walk,idle,sit,sit_down,talk,write,greet,sit_idle,add,blend,ease,STAND
from math import sin,cos,pi
def _breath(p,t,k=1.0):
    b=sin(2*pi*t);add(p,'chest',(1.5*k*b,0,0));add(p,'spine',(-.6*k*b,0,0));add(p,'uaR',(0,0,.8*k*b));add(p,'uaL',(0,0,-.8*k*b));return p
def a_walk(s,t):
    p=walk(s,2*pi*t);return p
def a_idle(s,t):
    p=idle(s,0);_breath(p,t*2);add(p,'head',(0,0,6*sin(2*pi*t)));add(p,'pelvis',(0,0,1.5*sin(2*pi*t)));return p
def a_sitidle(s,t):
    p=sit(s);_breath(p,t*2);add(p,'head',(-2,0,10*sin(2*pi*t)));return p
def a_write(s,t):
    # плавное письмо: мелкие колебания кисти + периодические взгляды
    p=sit(s);w=sin(2*pi*t*4)
    p['uaR']=(36,-8,0);p['faR']=(74+5*w,0,5*sin(2*pi*t*8));p['uaL']=(34,10,0);p['faL']=(80,0,0)
    look=max(0,sin(2*pi*t))**6
    p['head']=(-18+16*look,0,8*look);p['spine']=(-10+4*look,0,0);_breath(p,t*2,.5);return p
def a_talk(s,t):
    p=sit(s);c=cos(2*pi*t*2);s2=sin(2*pi*t*3)
    p['uaR']=(46+12*sin(2*pi*t*2),-14,0);p['faR']=(78+16*c,0,8*s2);p['uaL']=(30+6*sin(2*pi*t),10,0);p['faL']=(72-8*c,0,0)
    p['head']=(-1+4*sin(2*pi*t*4),0,5*sin(2*pi*t));p['spine']=(-5,0,0);p['chest']=(0,0,4*sin(2*pi*t));return p
def a_greet(s,t):
    p=sit(s);e=sin(pi*t)
    p['uaR']=(40+52*e,-10-38*e,0);p['faR']=(70+20*sin(2*pi*t*3)*e,0,0);p['head']=(4*e,0,0);p['chest']=(0,0,6*e);return p
def a_sitdown(s,t):return sit_down(s,ease(t))
def a_standup(s,t):
    t=ease(t);p=blend(sit(s),idle(s),t);b=sin(pi*t);add(p,'spine',(-24*b,0,0));add(p,'head',(-6*b,0,0));add(p,'pelvis_t',(0,.05*b,0));return p
def a_examine(s,t):
    # стоя: наклон к пациенту, стетоскоп правой рукой, левая на плече
    p=idle(s);m=sin(2*pi*t);lean=14+3*m
    p['spine']=(-lean,0,0);p['chest']=(-4,0,0);p['head']=(-10,0,4*sin(2*pi*t*2))
    p['uaR']=(58+6*m,-8,0);p['faR']=(40-6*m,0,0);p['uaL']=(52,14,0);p['faL']=(30,0,0);p['thR']=(6,-2,0);p['thL']=(-4,2,0);return p
def a_listen(s,t):
    # пациент сидя: кивки, руки на коленях
    p=sit(s);n=max(0,sin(2*pi*t*2))**2
    p['head']=(6*n-2,0,4*sin(2*pi*t));p['uaR']=(26,-3,0);p['uaL']=(26,3,0);p['faR']=(60,0,0);p['faL']=(60,0,0);_breath(p,t*2,.7);return p
def a_wait(s,t):
    # ожидание на скамье: нетерпеливо, смотрит по сторонам, постукивает ногой
    p=sit(s);_breath(p,t*2);add(p,'head',(0,0,25*sin(2*pi*t)));tap=max(0,sin(2*pi*t*6))
    add(p,'shR',(0,0,0));add(p,'ftR',(-14*tap,0,0));return p
DOC={'idle':(90,1,a_idle),'walk':(30,1,a_walk),'sit_idle':(90,1,a_sitidle),'write':(120,1,a_write),'talk':(60,1,a_talk),'greet':(36,0,a_greet),
     'sit_down':(30,0,a_sitdown),'stand_up':(30,0,a_standup),'examine':(60,1,a_examine)}
PAT={'idle':(90,1,a_idle),'walk':(30,1,a_walk),'sit_idle':(90,1,a_sitidle),'listen':(60,1,a_listen),'wait':(120,1,a_wait),'sit_down':(30,0,a_sitdown),'stand_up':(30,0,a_standup)}
