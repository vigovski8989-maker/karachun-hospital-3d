"""Reproducible reception-only original geometry pass over CC0 Quaternius UBC.
Run: blender -b -t 2 -P build_receptionist6.py. Never overwrites source blend.
"""
import bpy, bmesh, math, os, numpy as np
from mathutils import Vector, Matrix
ROOT='/workspace/hospital-game/prototypes/v45_reception'
bpy.ops.wm.open_mainfile(filepath=ROOT+'/models_build/receptionist_v45.blend')
ARM=next(o for o in bpy.data.objects if o.type=='ARMATURE')
BODY=bpy.data.objects['Superhero_Female'];CLO=bpy.data.objects['Clothes'];EYES=bpy.data.objects['Eyes']
for n in ['Badge','Hair_Buns','Eyelids','Eyebrows']:
 o=bpy.data.objects.get(n)
 if o:bpy.data.objects.remove(o,do_unlink=True)
# Adult rounded lower face, fuller cheeks, softer chin/nose and a subtle raised mouth corner.
def head_shape(p):
 p=Vector(p);x,y,z=p
 if z<1.535:return p
 face=max(0,min(1,(z-1.535)/.04))
 p.x=x*(1+.12*face)
 cheek=math.exp(-((z-1.616)/.035)**2)*max(0,min(1,(-y+.005)/.07))
 p.x+=math.copysign(.005*cheek*min(1,abs(x)/.04),x)
 if y<-.025:
  nose=math.exp(-((x/.022)**2+((z-1.625)/.025)**2));p.y+=.007*nose
  eye=math.exp(-(((abs(x)-.035)/.025)**2+((z-1.656)/.027)**2))
  p.z+=(z-1.656)*.14*eye+.0035*math.tanh((z-1.656)/.004)*eye
  corner=math.exp(-(((abs(x)-.022)/.012)**2+((z-1.599)/.012)**2));p.z+=.0035*corner
 return p
if BODY.data.shape_keys:
 for k in BODY.data.shape_keys.key_blocks:
  for v in k.data:v.co=head_shape(v.co)
 for i,v in enumerate(BODY.data.vertices):v.co=BODY.data.shape_keys.key_blocks[0].data[i].co
else:
 for v in BODY.data.vertices:v.co=head_shape(v.co)
# Larger but adult-sized visible eyes, centered in widened sockets. No skeleton changes.
for sign in [-1,1]:
 vs=[v for v in EYES.data.vertices if v.co.x*sign>0];ctr=sum((v.co for v in vs),Vector())/len(vs)
 newctr=ctr.copy();newctr.x*=1.12;newctr.y-=.003
 for v in vs:
  d=v.co-ctr;v.co=newctr+Vector((d.x*1.18,d.y*1.1,d.z*1.20))
# Gently flatten high-frequency baked skin contrast, retaining lips/eyes/anatomy.
mat=BODY.active_material
for n in mat.node_tree.nodes:
 if n.type=='TEX_IMAGE' and n.image and 'BaseColor' in n.image.name:
  old=n.image;im=old.copy();im.name='Reception_SoftSkin_OriginalEdit';a=np.array(old.pixels[:],dtype=np.float32).reshape((-1,4));a[:,:3]=a[:,:3]*.72+np.array([.68,.43,.29])*.28;im.pixels[:]=a.ravel();im.pack();n.image=im
# Material helpers: clean low-frequency professional fabric, not baked superhero shading.
def material(name,color,rough=.7,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
blouse=material('Reception_Blouse',(.39,.64,.72));navy=material('Reception_Navy',(.055,.105,.16));shoe=material('Reception_Shoes',(.055,.065,.075));ivory=material('Reception_Collar',(.94,.955,.94));ink=material('Reception_Ink',(.055,.12,.17));teal=material('Reception_Teal',(.12,.43,.46));hair=material('Reception_Hair',(.115,.056,.028),.76);ridge=material('Reception_HairRidge',(.135,.067,.032),.8)
# Soften the cloth shell and fill lower-back creases without touching hands or armature.
# Material zones become separate glTF primitives, all with their original skin weights.
CLO.data.materials.clear()
for m in [blouse,navy,shoe]:CLO.data.materials.append(m)
for p in CLO.data.polygons:
 z=sum(CLO.data.vertices[i].co.z for i in p.vertices)/len(p.vertices);p.material_index=2 if z<.15 else 1 if z<1.02 else 0;p.use_smooth=True
# Split into named mesh parts so runtime doesn't re-apply the old cloth texture/material.
bpy.ops.object.select_all(action='DESELECT');CLO.select_set(True);bpy.context.view_layer.objects.active=CLO
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
parts=[o for o in bpy.context.selected_objects if o.type=='MESH']
for o in parts:o.name='Uniform_'+('Blouse' if o.active_material==blouse else 'Skirt' if o.active_material==navy else 'Shoes')
shirt=next(o for o in parts if o.active_material==blouse)

# Rebuild relaxed blouse + professional trousers from the same CC0 full base surface.
# This avoids the old tight shell's shoulder undercoverage and torn seated skirt silhouette.
before=set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath='/workspace/assets_cc0/ubc/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Female_FullBody.gltf')
imported=[o for o in bpy.data.objects if o not in before]
full=max((o for o in imported if o.type=='MESH'),key=lambda o:len(o.data.vertices))
newparts=[]
for kind in ['Blouse','Trousers']:
 o=full.copy();o.data=full.data.copy();bpy.context.collection.objects.link(o);o.name='Uniform_'+kind
 mw=o.matrix_world.copy();o.parent=None;o.matrix_world=mw
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
 names=[g.name for g in o.vertex_groups];bm=bmesh.new();bm.from_mesh(o.data);dl=bm.verts.layers.deform.active
 def w(v,keys):return sum(x for g,x in v[dl].items()if any(names[g].startswith(k)for k in keys))
 def keep(v):
  if kind=='Blouse':return w(v,['spine','clavicle','upperarm','lowerarm','pelvis'])>.46 and w(v,['hand','index','middle','ring','pinky','thumb'])<.22 and w(v,['neck','Head'])<.38 and v.co.z>1.015
  return w(v,['pelvis','thigh','calf'])>.48 and w(v,['foot','ball'])<.28 and .095<v.co.z<1.045
 bmesh.ops.delete(bm,geom=[f for f in bm.faces if not all(keep(v)for v in f.verts)],context='FACES')
 bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
 # Weld glTF UV/normal splits before relaxing the shell: disconnected seam normals
 # otherwise offset each side differently and open visible shoulder cracks.
 bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001)
 for _ in range(5):
  updates={v:sum((e.other_vert(v).co for e in v.link_edges),Vector())/len(v.link_edges) for v in bm.verts if not v.is_boundary}
  for v,q in updates.items():v.co=v.co.lerp(q,.2)
 bm.normal_update()
 for v in bm.verts:v.co+=v.normal*(.017 if kind=='Blouse' else .014)
 bm.to_mesh(o.data);bm.free();o.data.materials.clear();o.data.materials.append(blouse if kind=='Blouse' else navy)
 for mod in list(o.modifiers):o.modifiers.remove(mod)
 o.parent=ARM;o.matrix_parent_inverse=ARM.matrix_world.inverted();md=o.modifiers.new('Reception skin','ARMATURE');md.object=ARM
 for f in o.data.polygons:f.use_smooth=True
 newparts.append(o)
for o in imported:bpy.data.objects.remove(o,do_unlink=True)
for o in parts:
 if o.active_material in [blouse,navy]:bpy.data.objects.remove(o,do_unlink=True)
shirt=next(o for o in newparts if 'Blouse' in o.name)

def weights_near(p):
 v=min(shirt.data.vertices,key=lambda v:(v.co-Vector(p)).length_squared)
 return {shirt.vertex_groups[g.group].name:g.weight for g in v.groups}
def skin(o,weights):
 o.parent=ARM;o.matrix_parent_inverse=ARM.matrix_world.inverted()
 md=o.modifiers.new('Reception skin','ARMATURE');md.object=ARM
 for i,v in enumerate(o.data.vertices):
  ws=weights(v.co) if callable(weights) else weights
  for n,w in ws.items():
   g=o.vertex_groups.get(n) or o.vertex_groups.new(name=n);g.add([i],w,'REPLACE')
 for p in o.data.polygons:p.use_smooth=True
 return o
def mesh(name,verts,faces,mat,weights={'Head':1}):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);me.materials.append(mat);return skin(o,weights)
def tube(name,pts,r,mat,weights={'Head':1},sides=6):
 verts=[]
 for i,p in enumerate(pts):
  p=Vector(p);t=Vector(pts[min(i+1,len(pts)-1)])-Vector(pts[max(0,i-1)]);t.normalize();u=t.cross(Vector((0,0,1)))
  if u.length<.01:u=t.cross(Vector((0,1,0)))
  u.normalize();v=t.cross(u).normalized()
  for j in range(sides):verts.append(p+r*(math.cos(j*2*math.pi/sides)*u+math.sin(j*2*math.pi/sides)*v))
 faces=[]
 for i in range(len(pts)-1):
  for j in range(sides):faces.append((i*sides+j,i*sides+(j+1)%sides,(i+1)*sides+(j+1)%sides,(i+1)*sides+j))
 return mesh(name,verts,faces,mat,weights)
def sphere(name,loc,scale,mat,weights={'Head':1},segments=32,rings=16):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True);o.data.materials.append(mat);return skin(o,weights)
# Original coherent swept cap with a single low bun. Forehead/eyes remain unobstructed.
N=64;R=18;verts=[]
for r in range(R+1):
 for i in range(N):
  ph=2*math.pi*i/N;front=max(0,-math.sin(ph));border=1.610+.082*front**3;th=math.acos((border-1.674)/.116)*r/R
  verts.append((.101*math.sin(th)*math.cos(ph),.018+.085*math.sin(th)*math.sin(ph),1.674+.116*math.cos(th)))
faces=[]
for r in range(R):
 for i in range(N):faces.append((r*N+i,r*N+(i+1)%N,(r+1)*N+(i+1)%N,(r+1)*N+i))
mesh('Hair_NeatCap',verts,faces,hair)
sphere('Hair_NeatBun',(0,.115,1.704),(.055,.045,.051),hair)
# Controlled swept strands: a few purposeful modeled ridges, no high-frequency knot texture.
for k in range(7):
 ph=-math.pi+.2+k*(math.pi-.4)/6;pts=[]
 for j in range(16):
  th=.18+1.11*j/15;p=Vector((.102*math.sin(th)*math.cos(ph),.018+.087*math.sin(th)*math.sin(ph),1.674+.118*math.cos(th)));pts.append(p)
 tube('Hair_NeatSweep_'+str(k),pts,.0015,ridge,sides=5)
# Solid swept fringe follows the scalp and joins its hairline: no floating forehead band.
vs=[];NX=32;NY=8
for j in range(NY+1):
 t=j/NY
 for i in range(NX+1):
  x=-.096+.192*i/NX;top=1.775-.038*(x/.1)**2;bottom=1.684+.021*(i/NX);z=top*(1-t)+bottom*t
  q=max(.035,1-(x/.108)**2-((z-1.674)/.125)**2);y=.018-.089*math.sqrt(q)-.003;vs.append((x,y,z))
fringe=mesh('Hair_NeatForelock',vs,[(j*(NX+1)+i,j*(NX+1)+i+1,(j+1)*(NX+1)+i+1,(j+1)*(NX+1)+i)for j in range(NY)for i in range(NX)],hair)
for k in [-1,0,1]:
 pts=[]
 for i in range(24):
  th=2*math.pi*i/23;pts.append((.051*math.cos(th),.117+.043*math.sin(th),1.704+k*.016+.006*math.sin(2*th)))
 tube('Hair_NeatBunWrap_'+str(k),pts,.0018,ridge,sides=5)
# Collar vertices follow the actual relaxed shirt surface instead of floating off the chest.
def front(z,x=0):
 vs=[v.co for v in shirt.data.vertices if abs(v.co.x-x)<.03 and abs(v.co.z-z)<.028]
 return min((v.y for v in vs),default=-.05)-.004
# Continuous tailored stand collar: avoids detached bright lapel shapes.
vs=[];N=48
for level in [1.468,1.485]:
 for i in range(N):
  th=i*2*math.pi/N;vs.append((.060*math.cos(th),.027+.062*math.sin(th),level))
o=mesh('Uniform_CollarBand',vs,[(i,(i+1)%N,N+(i+1)%N,N+i)for i in range(N)],ivory,weights_near)
sol=o.modifiers.new('Collar thickness','SOLIDIFY');sol.thickness=.003;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sol.name)
pl=[]
for z in [1.15,1.2,1.25,1.3,1.35,1.4,1.43]:pl.extend([(-.008,front(z),z),(.008,front(z),z)])
mesh('Uniform_Placket',pl,[(i*2,i*2+1,i*2+3,i*2+2)for i in range(6)],ivory,weights_near)
for z in [1.19,1.255,1.32,1.385]:sphere('Uniform_Button',(0,front(z)-.003,z),(.004,.0025,.004),ink,weights_near,12,8)
# Small real badge plate with pin border, portrait mark, two engraved name/role rules.
y=front(1.400,.080)-.008;x=.080;z=1.400
plate=[(x-.027,y,z-.018),(x+.027,y,z-.018),(x+.027,y,z+.018),(x-.027,y,z+.018)]
o=mesh('Reception_BadgePlate',plate,[(0,1,2,3)],ivory,weights_near);sol=o.modifiers.new('Badge thickness','SOLIDIFY');sol.thickness=.004;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=sol.name)
for zz,ll in [(z+.005,.027),(z-.005,.020)]:tube('Reception_BadgeRule',[(x-.002,y-.004,zz),(x-.002+ll,y-.004,zz)],.0014,ink,weights_near,5)
sphere('Reception_BadgePortrait',(x-.016,y-.004,z),(.006,.002,.009),teal,weights_near,12,8)
# Soft cuff rings, skinned to the working forearms.
for sign,side in [(1,'l'),(-1,'r')]:
 x=sign*.602;pts=[]
 for i in range(25):
  th=i*2*math.pi/24;pts.append((x,.057+.034*math.cos(th),1.418+.035*math.sin(th)))
 tube('Uniform_Cuff_'+side,pts,.005,ivory,{'lowerarm_'+side:1},7)
# Export preserves the existing bone names, rest matrices, weights and smile morph.
for o in bpy.data.objects:
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
bpy.ops.wm.save_as_mainfile(filepath=ROOT+'/models_build/receptionist_v46_character.blend')
bpy.ops.export_scene.gltf(filepath=ROOT+'/models/receptionist.glb',export_format='GLB',export_image_format='JPEG',export_jpeg_quality=90,export_draco_mesh_compression_enable=True,export_animations=False,export_morph=True,export_morph_normal=False,export_skins=True,export_yup=True,export_apply=False)
print('CHARACTER6_DONE',[(o.name,len(o.data.vertices))for o in bpy.data.objects if o.type=='MESH'])
