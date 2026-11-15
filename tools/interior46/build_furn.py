# builds js3d/furn_i46.js = js3d/furn.js (untouched original) + INTERIOR46 textures + rooms_i46.js fragment; (repo copy: paths relative to the repo).
import hashlib,os
HERE=os.path.dirname(os.path.abspath(__file__))
B=os.path.join(HERE,'..','..','prototypes','v45_reception')+'/'
s=open(B+'js3d/furn.js').read()
a="TEX.recFloor=loadTex('assets/tex/rec7_tile.png',1);"
assert s.count(a)==1
s=s.replace(a,a+"\n// INTERIOR46 room finishes (original procedural, review/interior46/mktex.py)\nTEX.i46vinyl=loadTex('assets/tex/i46_vinyl.png',1);TEX.i46tile=loadTex('assets/tex/i46_tile4.png',1);TEX.i46wood=loadTex('assets/tex/i46_wood.png',1);TEX.i46terr=loadTex('assets/tex/i46_terrazzo.png',1);")
s+="\n"+open(os.path.join(HERE,'rooms_i46.js')).read()
open(B+'js3d/furn_i46.js','w').write(s)
print('furn_i46',hashlib.sha256(s.encode()).hexdigest()[:8])
