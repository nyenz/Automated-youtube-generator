/* =====================================================================
   STYLE KIT v2 — "Dark Paper Cinema"
   Paper cut-out characters + cinematic lens (subject-shaped focus,
   hex bokeh, motion blur), silhouettes, colour grade, sound engine,
   12 fps stop-motion clock, recorder.
   LOCKED FILE: assets and scenes USE it, they never edit it.
   Needs three.js r128 loaded first.
   ===================================================================== */
(function(){
var T=THREE,K={T:T,version:2};window.KIT=K;

/* ---------- palette (the only colours assets may use) ---------- */
K.PAL={
 skin:[0xb7774f,0x8d5a3b,0xc78e66,0x6e4630],hair:[0x1c130f,0x241812,0x3a2416],
 teal:0x2b5a6c,mustard:0x8a6a2a,burgundy:0x6a2a35,charcoal:0x2c2b3a,brown:0x3a2c2a,moss:0x2e3b2a,
 cream:0xd9ccb0,gold:0xc4952c,rust:0x9a3b2a,ink:0x120d10,
 night:0x1b2233,moonlit:0x2a3550,moonlight:0x4f6f8a,wood:0x4a2e1c,woodDark:0x2e1d14,
 glowCyan:0x5fa8a0,glowAmber:0xc9a24a,glowMoon:0x9fb8e8,glowWarm:0xffb070
};

/* ---------- maths helpers ---------- */
K.ease=function(x){x=Math.min(1,Math.max(0,x));return x*x*(3-2*x)};
K.seg=function(t,a,b){return K.ease((t-a)/(b-a))};
K.mix=function(a,b,k){return a+(b-a)*k};
K.v=function(a){return a instanceof T.Vector3?a.clone():new T.Vector3(a[0],a[1],a[2])};
var rs=3;K.rnd=function(){rs=(rs*16807)%2147483647;return rs/2147483647};
K.path=function(pts,closed){var c=new T.CatmullRomCurve3(pts.map(K.v),!!closed,'centripetal');
 return {curve:c,at:function(u){return c.getPointAt(Math.min(1,Math.max(0,u)))},tangent:function(u){return c.getTangentAt(Math.min(1,Math.max(0,u)))}}};

/* ---------- paper materials ---------- */
var gc=document.createElement('canvas');gc.width=4;gc.height=1;var gx=gc.getContext('2d');
['#2e2e2e','#6e6e6e','#a8a8a8','#e6e6e6'].forEach(function(c,i){gx.fillStyle=c;gx.fillRect(i,0,1,1)});
var grad=new T.CanvasTexture(gc);grad.minFilter=grad.magFilter=T.NearestFilter;grad.generateMipmaps=false;
var pc=document.createElement('canvas');pc.width=pc.height=256;var px=pc.getContext('2d'),id=px.createImageData(256,256),i;
for(i=0;i<id.data.length;i+=4){var vv=225+Math.random()*30;id.data[i]=vv;id.data[i+1]=vv-3;id.data[i+2]=vv-8;id.data[i+3]=255}px.putImageData(id,0,0);
for(i=0;i<260;i++){px.strokeStyle='rgba('+(Math.random()<.5?'255,250,240':'120,105,90')+','+(.08+Math.random()*.12)+')';px.lineWidth=.6+Math.random();px.beginPath();
 var x0=Math.random()*256,y0=Math.random()*256,a0=Math.random()*6.28,l=6+Math.random()*22;px.moveTo(x0,y0);px.quadraticCurveTo(x0+Math.cos(a0+.5)*l*.5,y0+Math.sin(a0+.5)*l*.5,x0+Math.cos(a0)*l,y0+Math.sin(a0)*l);px.stroke()}
var paper=new T.CanvasTexture(pc);paper.wrapS=paper.wrapT=T.RepeatWrapping;paper.repeat.set(2,2);
function jit(c){var col=new T.Color(c),h={};col.getHSL(h);col.setHSL((h.h+(K.rnd()-.5)*.025+1)%1,Math.min(1,h.s*(.9+K.rnd()*.2)),Math.max(0,h.l*(.86+K.rnd()*.24)));return col.getHex()}
var mats={};K.toon=function(c){return mats[c]||(mats[c]=new T.MeshToonMaterial({color:c,gradientMap:grad,map:paper}))};
// torn edge: constant SCREEN thickness (works for a 3 m house and a 2 cm mosquito alike), boils 6x per second
function edgeMat(w,col){return new T.ShaderMaterial({side:T.BackSide,uniforms:{w:{value:w},c:{value:new T.Color(col)},sd:{value:0}},
 vertexShader:'uniform float w,sd;void main(){vec3 p=position*7.+sd;float n=sin(p.x*3.1+sin(p.y*2.3))*sin(p.y*3.7+sin(p.z*1.9))*sin(p.z*2.9+sin(p.x*2.7));'+
 'vec4 mv=modelViewMatrix*vec4(position,1.);vec3 nn=normalize(normalMatrix*normal);mv.xyz+=nn*w*max(-mv.z,.05)*(.7+.6*n);gl_Position=projectionMatrix*mv;}',
 fragmentShader:'uniform vec3 c;void main(){gl_FragColor=vec4(c,1.);}'})}
var EDGES=[edgeMat(.0016,0xd8c9a8),edgeMat(.0034,0x0d0a0c)],EDGESthin=[edgeMat(.0009,0xd8c9a8),edgeMat(.0019,0x0d0a0c)],ALLEDGE=EDGES.concat(EDGESthin);
/* M(geometry, colour, parent, x,y,z, sx,sy,sz, edge)   edge: undefined=normal, 'thin'=small parts, false=none */
K.M=function(geo,col,p,x,y,z,sx,sy,sz,ink){var m=new T.Mesh(geo,K.toon(jit(col)));m.position.set(x||0,y||0,z||0);if(sx!==undefined)m.scale.set(sx,sy,sz);
 m.castShadow=m.receiveShadow=true;if(ink!==false)(ink==='thin'?EDGESthin:EDGES).forEach(function(e){m.add(new T.Mesh(geo,e))});if(p)p.add(m);return m};
/* flat(geometry, colour, parent, x,y,z, sx,sy,sz, opacity) — unlit flat paper (glass, wings, cheeks, glows) */
K.flat=function(geo,col,p,x,y,z,sx,sy,sz,op){var m=new T.Mesh(geo,new T.MeshBasicMaterial({color:col,transparent:op!==undefined,opacity:op===undefined?1:op,side:T.DoubleSide,depthWrite:op===undefined}));
 m.position.set(x||0,y||0,z||0);if(sx!==undefined)m.scale.set(sx,sy,sz);if(p)p.add(m);return m};
/* limb(topRadius, bottomRadius, length): rounded tube hanging DOWN from its top (y=0 .. -length) */
K.limb=function(r1,r2,h){var pts=[],i,a;for(i=0;i<=8;i++){a=-Math.PI/2+i/8*Math.PI/2;pts.push(new T.Vector2(Math.max(1e-4,r2*Math.cos(a)),r2+r2*Math.sin(a)))}
 for(i=0;i<=8;i++){a=i/8*Math.PI/2;pts.push(new T.Vector2(Math.max(1e-4,r1*Math.cos(a)),h-r1+r1*Math.sin(a)))}
 var g=new T.LatheGeometry(pts,24);g.translate(0,-h,0);g.computeVertexNormals();return g};
/* lathe([[radius,y],...]) : round shapes like pots, cups, lamp shades, bodies */
K.lathe=function(pts,seg){var g=new T.LatheGeometry(pts.map(function(p){return new T.Vector2(Math.max(1e-4,p[0]),p[1])}),seg||32);g.computeVertexNormals();return g};
K.SPH=new T.SphereGeometry(1,40,28);
K.BOX=new T.BoxGeometry(1,1,1);

/* ---------- glow sprite texture ---------- */
var gcv=document.createElement('canvas');gcv.width=gcv.height=64;var gg=gcv.getContext('2d'),rg=gg.createRadialGradient(32,32,0,32,32,32);
rg.addColorStop(0,'rgba(255,255,255,1)');rg.addColorStop(.35,'rgba(255,255,255,.35)');rg.addColorStop(1,'rgba(255,255,255,0)');gg.fillStyle=rg;gg.fillRect(0,0,64,64);
K.GLOWTEX=new T.CanvasTexture(gcv);
K.glow=function(p,x,y,z,size,col,op){var s=new T.Sprite(new T.SpriteMaterial({map:K.GLOWTEX,blending:T.AdditiveBlending,depthWrite:false,transparent:true,color:col||0xffd6a0,opacity:op===undefined?.6:op}));
 s.scale.set(size,size,1);s.position.set(x||0,y||0,z||0);(p||K.scene).add(s);return s};

/* =====================================================================
   FACE KIT — every character and creature uses this, so emotions match.
   K.face(headGroup,{r:.36, y:.47, gap:.13, size:1, mouthY:.2, cheeks:true, skin})
   face.show('sneaky')  face.set({eyeL:.15,eyeR:.6})  (override one eye)
   ===================================================================== */
K.EMO={ //  brow angle, brow height, eye open, pupil size, mouth type, mouth width, head tilt
 neutral:   {ba:0,   bh:0,    eo:1,   pu:1,  m:'grin', mw:.8, tilt:0},
 happy:     {ba:-.15,bh:.02,  eo:.8,  pu:1,  m:'grin', mw:1.15,tilt:.08},
 surprised: {ba:-.3, bh:.06,  eo:1.3, pu:.7, m:'o',    mw:1,  tilt:-.1},
 scared:    {ba:-.35,bh:.04,  eo:1.3, pu:.5, m:'wavy', mw:1,  tilt:-.05},
 annoyed:   {ba:.35, bh:-.03, eo:.6,  pu:1,  m:'flat', mw:.9, tilt:-.05},
 sleepy:    {ba:0,   bh:-.02, eo:.12, pu:1,  m:'o',    mw:.45,tilt:.15},
 sneaky:    {ba:.25, bh:-.02, eo:.55, pu:.8, m:'smirk',mw:.8, tilt:.05},
 determined:{ba:.3,  bh:-.01, eo:.8,  pu:.9, m:'grin', mw:.75,tilt:-.08}
};
var FACES=[];
K.face=function(head,o){o=o||{};var r=o.r||.36,y=o.y===undefined?.47:o.y,gap=o.gap||.13,sz=o.size||1,my=o.mouthY===undefined?y-.27:o.mouthY;
 function zAt(x,yy){var dy=yy-(o.cy===undefined?y-.05:o.cy);return Math.sqrt(Math.max(.0001,r*r-x*x-dy*dy))}
 var f={eyes:[],pupils:[],brows:[],cur:K.EMO.neutral,state:{},target:'neutral',over:{}};
 [-1,1].forEach(function(s){var g=new T.Group();g.position.set(s*gap,y,zAt(gap,y)-.03*sz);g.rotation.y=s*Math.asin(Math.min(.9,gap/r));head.add(g);
  K.M(K.SPH,o.eye||0xebe0c8,g,0,0,0,.075*sz,.095*sz,.05*sz,'thin');
  var pu=new T.Group();pu.position.z=.04*sz;g.add(pu);K.M(K.SPH,K.PAL.ink,pu,0,-.01*sz,0,.038*sz,.048*sz,.02*sz,false);
  K.flat(new T.CircleGeometry(1,12),0xf2ead6,pu,.012*sz,.012*sz,.022*sz,.012*sz,.012*sz,1);
  if(o.lashes)for(var li=0;li<3;li++){var ls=K.flat(new T.PlaneGeometry(.04*sz,.01*sz),K.PAL.ink,g,s*(.025+li*.022)*sz,(.085-li*.008)*sz,.04*sz);ls.rotation.z=s*(.5+li*.35)}
  g.userData.ry0=g.rotation.y;g.userData.rx0=g.rotation.x;f.eyes.push(g);f.pupils.push(pu);
  var b=new T.Group();b.position.set(s*(gap-.06*sz),y+.13*sz,zAt(gap,y+.13*sz)+.005);head.add(b);
  var bm=K.M(K.limb(.025*sz,.025*sz,.17*sz),o.brow||K.PAL.hair[0],b,0,0,0,1,1,1,false);bm.rotation.z=s*Math.PI/2;b.userData.s=s;f.brows.push(b)});
 var mouth=new T.Group();mouth.position.set(0,my,o.mouthZ!==undefined?o.mouthZ:zAt(0,my)+.004);head.add(mouth);f.mouth=mouth;f.mw0=o.mouthW||1;
 function shape(fn,col,z){var sh=new T.Shape();fn(sh);return K.flat(new T.ShapeGeometry(sh,16),col,mouth,0,0,z||0)}
 f.m={grin:new T.Group(),o:new T.Group(),flat:new T.Group(),smirk:new T.Group(),wavy:new T.Group()};
 for(var k in f.m){mouth.add(f.m[k])}
 var g1=shape(function(s){s.moveTo(-.11,.02);s.quadraticCurveTo(0,-.12,.11,.02);s.quadraticCurveTo(0,-.01,-.11,.02)},0x6a1e22);f.m.grin.add(g1);
 f.m.grin.add(shape(function(s){s.moveTo(-.09,.012);s.quadraticCurveTo(0,-.035,.09,.012);s.quadraticCurveTo(0,-.005,-.09,.012)},0xe6dbc2,.002));
 var oo=new T.Mesh(new T.CircleGeometry(.045,20),new T.MeshBasicMaterial({color:0x2a0e10,side:T.DoubleSide}));oo.scale.y=1.25;f.m.o.add(oo);
 var fl=new T.Mesh(new T.PlaneGeometry(.16,.018),new T.MeshBasicMaterial({color:0x2a0e10,side:T.DoubleSide}));f.m.flat.add(fl);
 f.m.smirk.add(shape(function(s){s.moveTo(-.09,0);s.quadraticCurveTo(.02,-.03,.1,.03);s.quadraticCurveTo(.02,-.01,-.09,0)},0x2a0e10));
 f.m.wavy.add(shape(function(s){s.moveTo(-.1,0);s.bezierCurveTo(-.05,.03,-.02,-.03,0,0);s.bezierCurveTo(.02,.03,.05,-.03,.1,0);s.lineTo(.1,-.012);s.bezierCurveTo(.05,-.042,.02,.018,0,-.012);s.bezierCurveTo(-.02,.018,-.05,-.042,-.1,-.012);s.closePath()},0x2a0e10));
 mouth.scale.setScalar(sz);
 if(o.cheeks!==false)[-1,1].forEach(function(s){var c=K.flat(new T.CircleGeometry(1,20),o.cheek||0xa0574a,head,s*(gap+.07*sz),my+.08*sz,o.cheekZ!==undefined?o.cheekZ:zAt(gap+.07*sz,my+.08*sz)+.002,.05*sz,.032*sz,1);c.rotation.y=s*.5});
 f.head=head;f.baseTilt=head.rotation.z;
 f.st={ba:0,bh:0,eo:1,pu:1,mw:.8,tilt:0,lw:0};f.lookT=null;f.lookW=0;
 f.look=function(tgt,w){f.lookT=tgt||null;f.lookW=tgt?(w===undefined?1:w):0;return f};
 f.show=function(name){if(K.EMO[name])f.target=name;return f};
 f.set=function(ov){for(var k in ov)f.over[k]=ov[k];return f};
 f.clear=function(){f.over={};return f};
 FACES.push(f);return f};
var blinkSeq=[];for(i=0;i<40;i++)blinkSeq.push(1.6+i*2.7+((i*7919)%10)/10);
K._faceStep=function(t){faceStep(t)};
function faceStep(t){FACES.forEach(function(f,fi){var E=K.EMO[f.target],st=f.st;['ba','bh','eo','pu','mw','tilt'].forEach(function(k){st[k]+=(E[k]-st[k])*.45});
 for(var k in f.m)f.m[k].visible=(k===E.m);f.mouth.scale.x=st.mw*f.mw0*(f.mouth.scale.y||1);
 st.lw+=(f.lookW-st.lw)*.45;var LT=null;if(f.lookT){LT=f.lookT.isObject3D?f.lookT.getWorldPosition(new T.Vector3()):f.lookT.clone()}
 f.eyes.forEach(function(e){var yaw=0,pit=0;if(LT&&st.lw>.001){e.parent.updateMatrixWorld(true);var v=e.parent.worldToLocal(LT.clone()).sub(e.position);
  yaw=Math.max(-.45,Math.min(.45,Math.atan2(v.x,v.z)-e.userData.ry0));pit=Math.max(-.4,Math.min(.4,-Math.atan2(v.y,Math.hypot(v.x,v.z))))}
  e.rotation.y=e.userData.ry0+yaw*st.lw;e.rotation.x=e.userData.rx0+pit*st.lw});
 var blink=0;blinkSeq.forEach(function(b){var d=t-(b+fi*.37);if(d>=0&&d<.17)blink=1});
 f.eyes.forEach(function(e,j){var o=j===0?f.over.eyeL:f.over.eyeR;var open=o===undefined?st.eo:o;if(blink&&open>.2)open=.1;e.scale.set(1,Math.max(.06,open),1)});
 f.pupils.forEach(function(p){p.scale.setScalar(st.pu)});
 f.brows.forEach(function(b,j){var s=b.userData.s,ex=(j===0?f.over.browL:f.over.browR)||0;b.rotation.z=s*st.ba;b.position.y=b.userData.y0===undefined?(b.userData.y0=b.position.y):b.userData.y0;b.position.y=b.userData.y0+st.bh+ex});
 if(f.over.noTilt!==true)f.head.rotation.z=f.baseTilt+st.tilt*.5})}

/* ---------- squash & stretch reactions ----------
   K.react(object, t, startTime, 'take'|'land'|'twitch'|'shake')  — call every frame in update(t) */
K.react=function(o,t,t0,type){var b=o.userData.base||(o.userData.base=o.scale.clone()),rz=o.userData.brz===undefined?(o.userData.brz=o.rotation.z):o.userData.brz,d=t-t0,sx=1,sy=1,px=0;
 if(d>=0){var F=1/12;if(type==='take'){if(d<2*F){sy=.9;sx=1.06}else if(d<4*F){sy=1.12;sx=.93}else if(d<7*F){var k=(d-4*F)/(3*F);sy=K.mix(1.12,1,k);sx=K.mix(.93,1,k)}}
 else if(type==='land'){if(d<2*F){sy=.85;sx=1.1}else if(d<5*F){var k2=(d-2*F)/(3*F);sy=K.mix(.85,1,k2);sx=K.mix(1.1,1,k2)}}
 else if(type==='twitch'){if(d<F)sy=1.08}
 else if(type==='shake'){if(d<.5)px=Math.sin(d*90)*.08*(1-d*2)}}
 o.scale.set(b.x*sx,b.y*sy,b.z*sx);o.rotation.z=rz+px};

/* =====================================================================
   K.human(opts) — the standard paper person (mascots, extras, anyone).
   Same proportions rules, same face kit, same rig names for every video.
   opts: build:'hero'|'pear'|'noodle'|'average'|'slim'|'kid'
         skin, hair, hairStyle:'quiff'|'bald'|'tall'|'bob'|'bun'|'ponytail'|'curly'|'afro'|'short'
         top:'polo'|'tee'|'dress', shirt, collar, bottom:'pants'|'shorts'|'skirt', pants, shoes,
         nose:1 (scale), lashes:false, glasses:false, earrings:false, brow (colour)
   returns rig: {root, hips, body, torso, neck, head, face, armR, armL, legR, legL, arms, legs,
                 handR, handL (hand groups), gripR, gripL (points in the palms), headTop, height, build}
   Character faces +z. Rotate rig.hips.rotation.x to bend at the waist.
   ===================================================================== */
K.HUMAN={
 hero:  {h:3.65,blob:[.75,.42],leg:{hipY:1.56,hipX:.13,r:.11,r2:.072,foot:1.3,toe:.15},pelvis:[.23,.16,.17,1.62],belt:{r:.2,y:1.72,zs:.8,bz:.17},
  tor:{y:1.68,z:.56,lean:.07,pts:[[.001,0],[.2,0],[.24,.15],[.4,.45],[.62,.78],[.76,.98],[.74,1.1],[.55,1.2],[.2,1.26],[.001,1.27]],pecs:true},
  collar:{y:1.17,z:.3,s:1.2},placket:{y:.98,z:.37,len:.36,rx:-.35},neck:{r:.15,r2:.17,len:.24,top:3.0,z:.05,rx:0},
  head:{y:2.85,z:.1,s:.8,jaw:[.34,.26,.34,0,.2,.12],chin:[.16,.1,.14,0,.08,.3],nose:[.1,.12,.13,0,.36,.41],cheekZ:.38,mouthZ:.465,mouthW:1.15},
  arm:{x:.8,y:2.62,spread:.14,delt:[.28,.26,.25],sl:[.25,.19,.42],up:[.11,.58],fore:[.15,.56],hand:1.35}},
 pear:  {h:2.7,blob:[1,.6],leg:{hipY:.8,hipX:.22,r:.15,r2:.12,foot:1.25,toe:.25},pelvis:[.5,.3,.42,.86],belt:{r:.645,y:1.06,zs:.85,bz:.555},
  tor:{y:.72,z:.85,lean:-.05,pts:[[.001,0],[.3,0],[.5,.12],[.64,.4],[.66,.66],[.6,.98],[.46,1.2],[.26,1.32],[.001,1.36]]},
  collar:{y:1.27,z:.28,s:.85},placket:{y:1.08,z:.45,len:.24,rx:-.55},neck:{r:.14,r2:.17,len:.16,top:2.14,z:.08,rx:0},
  head:{y:2.0,z:.14,s:.7,jaw:[.32,.25,.32,0,.24,.06],nose:[.13,.12,.13,0,.34,.39],cheekZ:.31,mouthZ:.385,mouthW:.85},
  arm:{x:.56,y:1.8,spread:.55,delt:[.17,.17,.16],sl:[.15,.13,.3],up:[.085,.38],fore:[.08,.34],hand:1}},
 noodle:{h:4.2,blob:[.55,.32],leg:{hipY:1.45,hipX:.11,r:.085,r2:.065,foot:1.4,toe:.05},pelvis:[.2,.14,.16,1.5],belt:{r:.22,y:1.6,zs:.8,bz:.19},
  tor:{y:1.56,z:.8,lean:-.08,pts:[[.001,0],[.2,0],[.27,.2],[.3,.5],[.26,.8],[.22,1.0],[.24,1.15],[.18,1.27],[.001,1.3]],belly:[.31,.3,.29,0,.42,.08]},
  collar:{y:1.24,z:.15,s:.7},placket:{y:1.0,z:.19,len:.3,rx:.1},neck:{r:.07,r2:.08,len:.6,top:3.32,z:.24,rx:.38},
  head:{y:3.2,z:.3,s:.78,jaw:[.28,.2,.28,0,.24,0],nose:[.1,.12,.24,0,.36,.45],cheekZ:.3,mouthZ:.315,mouthW:.7},
  arm:{x:.3,y:2.7,spread:.16,delt:[.13,.13,.12],sl:[.11,.09,.3],up:[.065,.62],fore:[.06,.58],hand:1.15}},
 average:{h:3.1,blob:[.6,.36],leg:{hipY:1.3,hipX:.15,r:.12,r2:.09,foot:1.15,toe:.1},pelvis:[.28,.18,.2,1.36],belt:{r:.27,y:1.48,zs:.72,bz:.2},
  tor:{y:1.42,z:.64,lean:0,pts:[[.001,0],[.26,0],[.3,.2],[.36,.5],[.42,.76],[.4,.9],[.3,.98],[.12,1.03],[.001,1.04]]},
  collar:{y:.97,z:.19,s:.9},placket:{y:.8,z:.27,len:.26,rx:-.2},neck:{r:.1,r2:.11,len:.26,top:2.56,z:.02,rx:0},
  head:{y:2.32,z:.04,s:.85,jaw:[.3,.22,.3,0,.22,.06],nose:[.08,.09,.1,0,.36,.38],cheekZ:.3,mouthZ:.365,mouthW:.95},
  arm:{x:.5,y:2.3,spread:.12,delt:[.18,.17,.17],sl:[.17,.14,.32],up:[.085,.5],fore:[.08,.48],hand:1.05}},
 slim:  {h:3.05,blob:[.55,.34],leg:{hipY:1.3,hipX:.13,r:.1,r2:.075,foot:1.05,toe:.08},pelvis:[.3,.19,.21,1.36],belt:{r:.21,y:1.5,zs:.72,bz:.16},
  tor:{y:1.42,z:.64,lean:0,pts:[[.001,0],[.28,0],[.29,.1],[.22,.4],[.31,.68],[.33,.84],[.26,.95],[.11,1.0],[.001,1.01]]},
  collar:{y:.94,z:.16,s:.8},placket:{y:.78,z:.2,len:.22,rx:-.1},neck:{r:.08,r2:.09,len:.28,top:2.56,z:.02,rx:0},
  head:{y:2.3,z:.04,s:.85,jaw:[.29,.21,.29,0,.23,.05],nose:[.07,.08,.09,0,.36,.37],cheekZ:.3,mouthZ:.355,mouthW:.85},
  arm:{x:.42,y:2.28,spread:.1,delt:[.14,.14,.14],sl:[.14,.11,.28],up:[.07,.5],fore:[.065,.46],hand:.95}},
 kid:   {h:2.2,blob:[.45,.3],leg:{hipY:.85,hipX:.12,r:.1,r2:.08,foot:1.0,toe:.1},pelvis:[.24,.16,.18,.9],belt:{r:.22,y:1.02,zs:.75,bz:.17},
  tor:{y:.96,z:.7,lean:0,pts:[[.001,0],[.23,0],[.27,.2],[.3,.45],[.28,.62],[.2,.7],[.08,.73],[.001,.74]]},
  collar:{y:.68,z:.14,s:.7},placket:{y:.55,z:.2,len:.18,rx:-.2},neck:{r:.08,r2:.09,len:.16,top:1.78,z:.02,rx:0},
  head:{y:1.6,z:.05,s:1.0,jaw:[.3,.22,.3,0,.22,.06],nose:[.06,.07,.07,0,.36,.37],cheekZ:.3,mouthZ:.365,mouthW:.85},
  arm:{x:.33,y:1.58,spread:.15,delt:[.13,.13,.12],sl:[.13,.11,.24],up:[.07,.36],fore:[.065,.34],hand:.95}}
};
K.SHORT={legs:.5,arms:.58};
K.human=function(o){o=o||{};var P=K.HUMAN[o.build||'average'];if(!P)throw new Error('KIT.human: unknown build "'+o.build+'"');
 var C={skin:o.skin||K.PAL.skin[0],hair:o.hair||K.PAL.hair[0],shirt:o.shirt||K.PAL.teal,collar:o.collar||K.PAL.cream,pants:o.pants||K.PAL.charcoal,
  belt:o.belt||0x4a2e1c,buckle:o.buckle||K.PAL.gold,shoe:o.shoes||0x5a3320,sole:0x1a1416};
 var top=o.top||'polo',bottom=o.bottom||(top==='dress'?'none':'pants'),root=new T.Group(),L=P.leg,hip=.14+(L.hipY-.14)*K.SHORT.legs,dy=hip-L.hipY;
 var sh=new T.Mesh(new T.CircleGeometry(1,40),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.scale.set(P.blob[0],P.blob[1],1);sh.position.y=.003;root.add(sh);
 var hips=new T.Group();hips.position.y=hip;root.add(hips);var body=new T.Group();body.position.y=-L.hipY;hips.add(body);
 var bareLegs=(bottom==='skirt'||bottom==='none'||bottom==='shorts');
 // legs
 var legs=[];[-1,1].forEach(function(s){var g=new T.Group();g.position.set(s*L.hipX,hip,0);root.add(g);var len=hip-.14;
  if(bottom==='shorts'){K.M(K.limb(L.r*1.15,L.r,len*.45),C.pants,g,0,0,0);K.M(K.limb(L.r*.85,L.r2,len*.6),C.skin,g,0,-len*.4,0)}
  else K.M(K.limb(L.r,L.r2,len),bareLegs?C.skin:C.pants,g,0,0,0);
  var shoe=new T.Group();shoe.position.set(0,-(hip-.09),.07);g.add(shoe);shoe.scale.setScalar(L.foot);shoe.rotation.y=s*L.toe;
  K.M(K.SPH,C.shoe,shoe,0,.05,.07,.15,.1,.28);K.M(new T.CylinderGeometry(1,1,.04,28),C.sole,shoe,0,-.03,.07,.155,1,.29);legs.push({hip:g,foot:shoe,side:s})});
 // pelvis, belt
 var pv=P.pelvis;K.M(K.SPH,top==='dress'?C.shirt:(bottom==='skirt'?C.pants:C.pants),body,0,pv[3],0,pv[0],pv[1],pv[2]);
 var B=P.belt;if(top!=='dress'){K.M(new T.CylinderGeometry(B.r,B.r+.02,.09,40),C.belt,body,0,B.y,0,1,1,B.zs);K.M(new T.BoxGeometry(.1,.08,.03),C.buckle,body,0,B.y,B.bz,1,1,1,'thin')}
 // skirt / dress skirt
 if(bottom==='skirt'||top==='dress'){var w=Math.max(pv[0],B.r)+.02,Lk=(L.hipY-.14)*K.SHORT.legs*.55+(pv[3]-L.hipY)+.15;
  K.M(K.lathe([[.001,-Lk],[w+.2,-Lk],[w+.05,-Lk*.45],[w,0],[.001,0]],40),top==='dress'?C.shirt:C.pants,body,0,B.y,0,1,1,.85)}
 // torso
 var Q=P.tor,torso=new T.Group();torso.position.y=Q.y;torso.rotation.x=Q.lean;body.add(torso);
 K.M(K.lathe(Q.pts,44),C.shirt,torso,0,0,0,1,1,Q.z);
 if(Q.pecs)[-1,1].forEach(function(s){K.M(K.SPH,C.shirt,torso,s*.29,.86,.27,.33,.27,.19)});
 if(Q.belly){var bl=Q.belly;K.M(K.SPH,C.shirt,torso,bl[3],bl[4],bl[5],bl[0],bl[1],bl[2])}
 var Kc=P.collar;
 if(top==='polo'){[-1,1].forEach(function(s){var cg=new T.Shape();cg.moveTo(0,0);cg.lineTo(s*.2*Kc.s,.04*Kc.s);cg.lineTo(s*.13*Kc.s,-.14*Kc.s);cg.closePath();
   var c=K.M(new T.ExtrudeGeometry(cg,{depth:.03,bevelEnabled:false}),C.collar,torso,s*.03,Kc.y,Kc.z,1,1,1,'thin');c.rotation.x=-.5});
  var Pk=P.placket,pk=K.M(new T.BoxGeometry(.07,Pk.len,.02),C.shirt,torso,0,Pk.y,Pk.z,1,1,1,'thin');pk.rotation.x=Pk.rx;
  [.22,-.18].forEach(function(f){K.M(new T.SphereGeometry(.02,10,8),C.collar,pk,0,Pk.len*f,.015,1,1,1,false)})}
 else{var tw=Q.pts[Q.pts.length-3][0]*.7;var tc=K.M(new T.TorusGeometry(Math.max(.08,tw),.025,8,32),top==='dress'?C.collar:C.shirt,torso,0,Q.pts[Q.pts.length-3][1]+.02,0,1,1,Q.z);tc.rotation.x=Math.PI/2}
 // neck
 var N=P.neck,neck=K.M(K.limb(N.r,N.r2,N.len),C.skin,body,0,N.top,N.z);neck.rotation.x=N.rx;
 // head
 var Hh=P.head,head=new T.Group();head.position.set(0,Hh.y,Hh.z);head.scale.setScalar(Hh.s);body.add(head);
 K.M(K.SPH,C.skin,head,0,.44,0,.36,.41,.36);var j=Hh.jaw;K.M(K.SPH,C.skin,head,j[3],j[4],j[5],j[0],j[1],j[2]);
 if(Hh.chin){j=Hh.chin;K.M(K.SPH,C.skin,head,j[3],j[4],j[5],j[0],j[1],j[2])}
 [-1,1].forEach(function(s){var e=K.M(K.SPH,C.skin,head,s*.35,.42,-.02,.07,.11,.05);e.rotation.y=s*.4;
  if(o.earrings)K.M(new T.SphereGeometry(.03,10,8),K.PAL.gold,head,s*.37,.31,-.01,1,1,1,'thin')});
 var ns=o.nose||1;j=Hh.nose;K.M(K.SPH,C.skin,head,j[3],j[4],j[5]+(ns-1)*j[2]*.5,j[0]*ns,j[1]*ns,j[2]*ns);
 var face=K.face(head,{r:.36,cy:.44,y:.49,gap:.13,size:1,mouthY:.2,mouthZ:Hh.mouthZ,mouthW:Hh.mouthW,cheekZ:Hh.cheekZ,brow:o.brow||C.hair,lashes:!!o.lashes});
 if(o.glasses){[-1,1].forEach(function(s){var r=K.M(new T.TorusGeometry(.085,.012,8,24),K.PAL.ink,head,s*.13,.49,.355,1,1,1,false)});K.M(K.limb(.008,.008,.08),K.PAL.ink,head,-.04,.5,.37,1,1,1,false).rotation.z=Math.PI/2}
 hair(head,o.hairStyle||'quiff',C.hair);
 var headTop=new T.Object3D();headTop.position.set(0,.88,0);head.add(headTop);
 // arms
 var A=P.arm,arms=[];[-1,1].forEach(function(s){var g=new T.Group();g.position.set(s*A.x,A.y,0);g.rotation.z=s*A.spread;body.add(g);
  K.M(K.SPH,C.shirt,g,0,0,0,A.delt[0],A.delt[1],A.delt[2]);var sleeve=top==='dress'?.5:1;
  K.M(K.limb(A.sl[0],A.sl[1],A.sl[2]*sleeve),C.shirt,g,0,.04,0);
  var uy=-A.sl[2]*.7*sleeve,ul=Math.max(A.up[1]*K.SHORT.arms,A.up[0]*2.2),fl=Math.max(A.fore[1]*K.SHORT.arms,A.fore[0]*2.2);
  K.M(K.limb(A.up[0],A.up[0]*.9,ul),C.skin,g,0,uy,0);
  var el=new T.Group();el.position.y=uy-ul+.04;g.add(el);K.M(K.limb(A.fore[0],A.fore[0]*.72,fl),C.skin,el,0,.04,0);
  var hd=new T.Group();hd.position.y=-(fl-.04);hd.scale.setScalar(A.hand);el.add(hd);
  K.M(K.SPH,C.skin,hd,0,-.09,0,.09,.12,.065);var th=K.M(K.SPH,C.skin,hd,0,-.05,.065,.032,.065,.032);th.rotation.x=-.4;
  var grip=new T.Object3D();grip.position.set(0,-.1,0);hd.add(grip);
  g.userData.spread=A.spread*s;arms.push({shoulder:g,elbow:el,hand:hd,grip:grip,side:s})});
 var rig={root:root,hips:hips,body:body,torso:torso,neck:neck,head:head,face:face,headTop:headTop,
  armR:arms[0],armL:arms[1],legR:legs[0],legL:legs[1],arms:arms,legs:legs,handR:arms[0].hand,handL:arms[1].hand,gripR:arms[0].grip,gripL:arms[1].grip,
  height:P.h+dy,hipHeight:hip,build:o.build||'average',preset:P};
 return rig};
function hair(head,style,col){var cap=function(){K.M(new T.SphereGeometry(1,40,20,0,Math.PI*2,0,Math.PI*.5),col,head,0,.54,-.03,.41,.4,.41).rotation.x=-.5};
 var sides=function(){[-1,1].forEach(function(s){K.M(K.SPH,col,head,s*.33,.52,-.06,.07,.14,.18)});K.M(K.SPH,col,head,0,.48,-.22,.32,.24,.18)};
 if(style==='bald'){sides();return}
 if(style==='short'){cap();sides();return}
 if(style==='quiff'){cap();sides();K.M(K.SPH,col,head,.06,.81,.18,.26,.11,.17).rotation.z=-.25;K.M(K.SPH,col,head,-.12,.78,.22,.17,.08,.12).rotation.z=.4;return}
 if(style==='tall'){cap();sides();var tl=K.M(K.limb(.27,.3,.42),col,head,0,1.22,.02);tl.scale.set(1,1,.9);tl.rotation.x=.12;return}
 if(style==='bob'){cap();[-1,1].forEach(function(s){K.M(K.SPH,col,head,s*.32,.36,-.03,.12,.3,.25)});K.M(K.SPH,col,head,0,.38,-.2,.37,.32,.2);
  var fr=K.M(K.SPH,col,head,0,.68,.24,.3,.1,.12);fr.rotation.x=.35;return}
 if(style==='bun'){cap();sides();K.M(K.SPH,col,head,0,.9,-.2,.17,.16,.17);K.M(new T.TorusGeometry(.1,.025,8,20),K.PAL.burgundy,head,0,.82,-.19,1,1,1,'thin').rotation.x=1.2;return}
 if(style==='ponytail'){cap();sides();var pg=new T.Group();pg.position.set(0,.66,-.38);pg.rotation.x=.55;head.add(pg);
  K.M(K.limb(.09,.04,.55),col,pg,0,0,0);K.M(new T.SphereGeometry(.06,12,10),K.PAL.burgundy,pg,0,-.02,0,1,.6,1,'thin');return}
 if(style==='curly'){cap();for(var i=0;i<16;i++){var a=i/16*Math.PI*2,rr=i%2?.3:.36;K.M(K.SPH,col,head,Math.cos(a)*rr,.66+(i%3)*.06,Math.sin(a)*rr*.9-.08,.11,.1,.11,'thin')}
  [-1,1].forEach(function(s){K.M(K.SPH,col,head,s*.34,.48,-.06,.1,.16,.18)});return}
 if(style==='afro'){K.M(K.SPH,col,head,0,.74,-.1,.5,.42,.46);[-1,1].forEach(function(s){K.M(K.SPH,col,head,s*.36,.52,-.08,.14,.2,.22)});return}
 cap();sides()}
/* face look-at: face.look(target or null, weight 0..1) — eyes turn toward a world point/object (called by scenes) */


/* =====================================================================
   MASCOTS — the two channel hosts. Fixed look in every video.
   KIT.mascot('kato') / KIT.mascot('nia')  -> human rig (same parts as K.human)
   ===================================================================== */
K.MASCOTS={
 kato:{build:'average',skin:K.PAL.skin[1],hair:K.PAL.hair[0],hairStyle:'quiff',top:'polo',shirt:K.PAL.teal,collar:K.PAL.cream,pants:K.PAL.charcoal,shoes:0x5a3320,nose:1.35,scarf:K.PAL.mustard},
 nia:{build:'slim',skin:K.PAL.skin[3],hair:K.PAL.hair[0],hairStyle:'bun',top:'dress',shirt:K.PAL.burgundy,collar:K.PAL.cream,shoes:0x3a2416,lashes:true,earrings:true,glasses:true}
};
K.mascot=function(name,extra){var o=Object.assign({},K.MASCOTS[name],extra||{});if(!K.MASCOTS[name])throw new Error('KIT.mascot: unknown mascot "'+name+'"');
 var rig=K.human(o);if(o.scarf){var sc=K.M(new T.TorusGeometry(rig.preset.neck.r*1.6+.03,.06,10,28),o.scarf,rig.body,0,rig.preset.neck.top-rig.preset.neck.len*.85,rig.preset.neck.z,1,1,.9);sc.rotation.x=Math.PI/2;
  var tail=K.M(K.limb(.055,.045,.3),o.scarf,rig.body,.1,rig.preset.neck.top-rig.preset.neck.len*.85,rig.preset.neck.z+rig.preset.neck.r+.06);tail.rotation.z=.25}
 rig.kind='character';rig.name=name;return rig};

/* =====================================================================
   WORLD HELPERS — paper-diorama accents (muted). Sets may use these.
   ===================================================================== */
K.PAL.dio={coral:0x9a4a42,salmon:0xa85e4e,peach:0xb07258,deepCoral:0x7a352f,plum:0x3e2230,teal:0x2a6a63,tealDark:0x1f524e,tealDeep:0x163c3c,cream:0xb8ab94,mauve:0x4e3a44,ground:0x2e1c24,
 ridge:[0x1c403e,0x22504b,0x2b5e57,0x386a62,0x4a756c]};
/* sheet(shape, depth, colour, parent, x,y,z, edge): a 2D paper cut-out extruded thin (a diorama layer) */
K.sheet=function(shape,depth,col,p,x,y,z,ink){return K.M(new T.ExtrudeGeometry(shape,{depth:depth||.06,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1,curveSegments:10}),col,p,x,y,z,1,1,1,ink)};
/* jagged(rx, ry, points, amount): a leafy / torn oval Shape */
K.jagged=function(rx,ry,n,amp){var s=new T.Shape();for(var i=0;i<=n;i++){var a=i/n*Math.PI*2,r=1+(i%2?amp:-amp*.4)*(.7+K.rnd()*.6);s[i?'lineTo':'moveTo'](Math.cos(a)*rx*r,Math.sin(a)*ry*r)}return s};
K.ground=function(p,o){o=o||{};var f=new T.Mesh(new T.CircleGeometry(o.radius||18,72),K.toon(o.color||K.PAL.dio.ground));f.rotation.x=-Math.PI/2;f.receiveShadow=true;p.add(f);return f};
K.paperTree=function(p,x,z,o){o=o||{};var D=K.PAL.dio,g=new T.Group(),s=o.scale||1;g.position.set(x,0,z);g.scale.set(s*(o.flip?-1:1),s,s);p.add(g);
 var tr=new T.Shape();tr.moveTo(-.18,0);tr.bezierCurveTo(-.1,1,-.35,1.8,-.7,2.6);tr.lineTo(-.55,2.7);tr.bezierCurveTo(-.15,2.1,-.02,1.9,.02,1.6);
 tr.bezierCurveTo(.3,2.2,.55,2.5,.95,2.9);tr.lineTo(1.05,2.78);tr.bezierCurveTo(.6,2.2,.25,1.6,.2,0);tr.closePath();K.sheet(tr,.08,o.trunk||D.deepCoral,g,0,0,0);
 var cols=o.leaves||[D.coral,D.salmon,D.peach,D.deepCoral];
 for(var i=0;i<9;i++){var lf=K.sheet(K.jagged(.55+K.rnd()*.35,.32+K.rnd()*.15,26,.22),.05,cols[i%cols.length],g,-1.1+K.rnd()*2.4,2.4+K.rnd()*1.4,(K.rnd()-.5)*.5);lf.rotation.z=(K.rnd()-.5)*.8}
 var pf=o.puffs||[D.teal,D.tealDark];for(i=0;i<4;i++)K.M(K.SPH,pf[i%2],g,-1+K.rnd()*2.2,2.3+K.rnd()*1.6,.25+K.rnd()*.2,.22,.18,.14);return g};
K.ridges=function(p,o){o=o||{};var D=K.PAL.dio,cols=o.colors||D.ridge,z0=o.z||-9,hgt=o.height||1,g=new T.Group();p.add(g);
 cols.forEach(function(c,j){var s=new T.Shape(),w=34,n=14;s.moveTo(-w,-1);for(var i=0;i<=n;i++){var x=-w+i/n*2*w,pk=(4.2+j)*(.35+.65*Math.abs(Math.sin(i*1.7+j*2.1)))*(1-Math.abs(x)/w*.25);
  s.lineTo(x+(K.rnd()-.5)*1.2,(i%2?pk:pk*.55)*(1.1-j*.17)*hgt+.5)}s.lineTo(w,-1);s.closePath();K.sheet(s,.1,c,g,0,0,z0-j*2.6)});return g};
K.cloudSwirl=function(p,x,y,z,s,col){var g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(s||1);p.add(g);
 for(var i=0;i<5;i++){var t=K.M(new T.TorusGeometry(.18+i*.16,.05,8,40,Math.PI*(1.4+i*.12)),col||K.PAL.dio.cream,g,0,0,-i*.02,1,1,.6);t.rotation.z=i*.7}
 K.M(K.SPH,col||K.PAL.dio.cream,g,0,0,-.05,.2,.2,.08);return g};
K.tuft=function(p,x,z,s,col){var g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(s||1);p.add(g);
 for(var i=0;i<7;i++){var b=K.M(new T.ConeGeometry(.035,.32+K.rnd()*.25,5),col||K.PAL.dio.coral,g,(K.rnd()-.5)*.25,.16,(K.rnd()-.5)*.2,1,1,1,'thin');b.rotation.set((K.rnd()-.5)*.6,0,(K.rnd()-.5)*.7)}return g};
K.rock=function(p,x,z,s){var r=K.M(K.SPH,K.rnd()<.5?K.PAL.dio.mauve:K.PAL.dio.plum,p,x,.12*(s||1),z,.42*(s||1),.24*(s||1),.34*(s||1));r.rotation.y=K.rnd()*3;return r};
K.moon=function(p,x,y,z,r){var m=new T.Mesh(new T.CircleGeometry(r||2.6,48),new T.MeshBasicMaterial({color:0xe6d8bf}));m.position.set(x,y,z);p.add(m);
 K.glow(p,x,y,z+.5,(r||2.6)*4.2,0xe8c4a0,.55);K.glow(p,x,y,z+.6,(r||2.6)*8.5,0xc07a60,.22);return m};

/* =====================================================================
   ASSET SHEET — shows every asset of a video on one page.
   Characters/creatures/props stand in a line-up (checks scale and consistency),
   click a name to inspect it: turntable, emotions, eyes follow the camera.
   Sets are shown on their own.
   ===================================================================== */
K.assetSheet=function(o){o=o||{};K.init({duration:8,sky:o.sky||'warm'});K.ground(S,{radius:30,color:0x2a2026});
 var items=K.list().map(function(n){var a=K.make(n,{});a.root.updateMatrixWorld(true);var bx=new T.Box3().setFromObject(a.root);return {name:n,a:a,kind:a.kind||'prop',box:bx,size:bx.getSize(new T.Vector3())}});
 var line=items.filter(function(i){return i.kind!=='set'}),sets=items.filter(function(i){return i.kind==='set'}),x=0;
 line.forEach(function(i){var w=Math.max(.3,i.size.x);i.a.root.position.x+=x+w/2-((i.box.min.x+i.box.max.x)/2);i.a.root.position.z+=-((i.box.min.z+i.box.max.z)/2);x+=w+.6;i.a.root.updateMatrixWorld(true);i.box.setFromObject(i.a.root)});
 var off=x/2;line.forEach(function(i){i.a.root.position.x-=off;i.a.root.updateMatrixWorld(true);i.box.setFromObject(i.a.root)});
 sets.forEach(function(i){i.a.root.visible=false});
 var sel=null,ang=0,drag=false,lx=0,dom=R.domElement;dom.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX});addEventListener('pointerup',function(){drag=false});
 dom.addEventListener('pointermove',function(e){if(drag){ang-=(e.clientX-lx)*.01;lx=e.clientX}});
 function target(){if(!sel){var all=new T.Box3();line.forEach(function(i){all.union(i.box)});return all}var b=new T.Box3().setFromObject(sel.a.root);return b}
 K.shots([{from:0,to:8,pos:[function(t){var b=target(),c=b.getCenter(new T.Vector3()),sz=b.getSize(new T.Vector3()),d=Math.max(sz.x/Math.max(.6,K.camera.aspect),sz.y)*1.25/(2*Math.tan(16*Math.PI/180))+sz.z*.5+.5;
   var a=ang+(sel?t*.25:Math.sin(t*.3)*.15);return [c.x+Math.sin(a)*d,c.y+sz.y*.15,c.z+Math.cos(a)*d]}],look:[function(){return target().getCenter(new T.Vector3()).toArray()}],fov:32}]);
 K.lens([{at:0,on:[],ap:.006,pad:.3}]);K.light([{at:0,key:.95,amb:.38,back:.5,glow:.35,fg:0,sub:0}]);
 var ui=document.createElement('div');ui.style.cssText='position:fixed;top:12px;left:12px;right:12px;display:flex;flex-wrap:wrap;gap:6px;z-index:6';document.body.appendChild(ui);
 var emo=document.createElement('div');emo.style.cssText='position:fixed;top:56px;left:12px;right:12px;display:flex;flex-wrap:wrap;gap:6px;z-index:6';document.body.appendChild(emo);
 var info=document.createElement('div');info.style.cssText='position:fixed;bottom:64px;left:12px;right:12px;color:#e9dfc8;font:12px monospace;z-index:6;white-space:pre-wrap';document.body.appendChild(info);
 function btn(p,txt,fn,on){var b=document.createElement('button');b.textContent=txt;b.style.cssText='border:0;border-radius:999px;padding:7px 12px;font:700 12px "Trebuchet MS",sans-serif;cursor:pointer;background:'+(on?'#e9dfc8':'rgba(233,223,200,.15)')+';color:'+(on?'#14111a':'#e9dfc8');b.onclick=fn;p.appendChild(b);return b}
 function face(a){return a.face||(a.rig&&a.rig.face)}
 function draw(){ui.innerHTML='';emo.innerHTML='';btn(ui,'Line-up',function(){pick(null)},!sel);
  items.forEach(function(i){btn(ui,i.name+(i.kind==='set'?' (set)':''),function(){pick(i)},sel===i)});
  var f=sel&&face(sel.a);if(f)Object.keys(K.EMO).forEach(function(n){btn(emo,n,function(){f.show(n)},f.target===n)});
  if(f)btn(emo,'eyes: look at camera',function(){f.look(f.lookT?null:K.camera)},!!f.lookT);
  var t=sel||{name:'line-up',kind:'',size:target().getSize(new T.Vector3())};
  info.textContent=(sel?sel.name+' ['+sel.kind+']  parts: '+Object.keys(sel.a).join(', ')+'\n':'All characters, creatures and props side by side (checks scale + style).\n')+'size (m): '+t.size.toArray().map(function(v){return v.toFixed(2)}).join(' x ')}
 function pick(i){sel=i;line.forEach(function(l){l.a.root.visible=!i||i.kind!=='set'});sets.forEach(function(s){s.a.root.visible=(s===i)});
  if(i&&i.kind==='set')line.forEach(function(l){l.a.root.visible=false});K.lens([{at:0,on:i?[i.a.root]:[],ap:i?.012:.006,pad:i?Math.max(.05,i.size.length()*.15):.3}]);ang=0;draw()}
 K.update(function(t){items.forEach(function(i){if(i.a.animate)i.a.animate(t)});if(sel&&sel.kind!=='set')sel.a.root.rotation.y=0});
 draw();K.start()};

/* =====================================================================
   ASSET REGISTRY
   KIT.asset('name', function(K, opts){ ...; return {root:group, ...parts}; })
   var x = KIT.make('name', {..opts})      (root is added to the scene)
   ===================================================================== */
var ASSETS={};K.asset=function(name,fn){ASSETS[name]=fn};K.has=function(n){return !!ASSETS[n]};K.list=function(){return Object.keys(ASSETS)};
K.make=function(name,opts){if(!ASSETS[name])throw new Error('KIT: no asset called "'+name+'". Loaded: '+K.list().join(', '));
 var r=ASSETS[name](K,opts||{});if(!r||!r.root)throw new Error('KIT: asset "'+name+'" must return {root:...}');if(!opts||opts.add!==false)K.scene.add(r.root);return r};

/* =====================================================================
   INIT: renderer, scene, camera, lights, backdrop, post
   KIT.init({duration:15, sky:'night'|'warm', key:{dir:[3,5,6],color,intensity}, shadowArea:8})
   ===================================================================== */
var R,S,cam,AMB,KEY,RIM,BACK,haze,haze2,dome,RT,QM,QS,QC,cfg;
var SKIES={warm:{lo:[.07,.05,.07],hz:[.24,.14,.17],hi:[.06,.08,.16],gc:[.55,.28,.12],haze:0xffb070,haze2:0x6f8fd0},
 night:{lo:[.03,.035,.06],hz:[.09,.11,.19],hi:[.02,.03,.07],gc:[.25,.32,.55],haze:0x9fb8e8,haze2:0x3a4f8a}};
/* view size: full window, or a fixed aspect ('9:16' vertical shorts) rendered at 1080 px on the short side */
K.view=function(){var w=innerWidth,h=innerHeight,pr=Math.min(devicePixelRatio,2);if(cfg&&cfg.aspect){var a=cfg.aspect.split(':'),ra=a[0]/a[1];if(w/h>ra)w=h*ra;else h=w/ra;
 pr=Math.min(3,(cfg.res||1080)/Math.min(w,h))}return [Math.floor(w),Math.floor(h),pr]};
K.placeCanvas=function(){if(!R||!cfg||!cfg.aspect)return;var c=R.domElement,v=K.view();c.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:'+v[0]+'px;height:'+v[1]+'px;display:block'};
K.init=function(o){cfg=o=o||{};K.duration=o.duration||10;
 var st=document.createElement('style');st.textContent='html,body{height:100%;margin:0;overflow:hidden;background:#0d0b10}canvas{position:fixed;inset:0;width:100%;height:100%;display:block}'+
 '.kbar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 14px 6px 6px;border-radius:999px;background:rgba(233,223,200,.12);border:1px solid rgba(233,223,200,.18);color:#e9dfc8;font:700 12px/1 "Trebuchet MS",sans-serif;width:min(560px,calc(100% - 32px));box-sizing:border-box;z-index:5}'+
 '.kbar button{border:0;border-radius:999px;padding:8px 12px;background:#e9dfc8;color:#14111a;font:inherit;cursor:pointer;white-space:nowrap}.kbar button.rec{background:#c0453a;color:#fff}'+
 '.ktrack{flex:1;height:4px;border-radius:2px;background:rgba(233,223,200,.2);overflow:hidden}.ktrack div{height:100%;width:0;background:#e9dfc8}.kerr{position:fixed;left:16px;right:16px;top:16px;padding:12px;background:#5a1d1d;color:#fff;font:13px monospace;white-space:pre-wrap;z-index:9}';
 document.head.appendChild(st);
 R=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});var vs=K.view();R.setPixelRatio(vs[2]);R.setSize(vs[0],vs[1]);K.placeCanvas();R.setClearColor(0x0d0b10,1);
 R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;document.body.appendChild(R.domElement);
 S=new T.Scene();cam=new T.PerspectiveCamera(32,vs[0]/vs[1],.01,120);K.scene=S;K.camera=cam;K.renderer=R;
 var sky=SKIES[o.sky||'warm'];K.sky=sky;
 dome=new T.Mesh(new T.SphereGeometry(60,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{lo:{value:new T.Vector3().fromArray(sky.lo)},hz:{value:new T.Vector3().fromArray(sky.hz)},hi:{value:new T.Vector3().fromArray(sky.hi)},gc:{value:new T.Vector3().fromArray(sky.gc)}},
  vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 lo,hz,hi,gc;varying vec3 p;void main(){vec3 c=mix(hz,hi,smoothstep(0.,.55,p.y));c=mix(lo,c,smoothstep(-.2,.02,p.y));float g=pow(max(dot(p,normalize(vec3(-.6,.15,-.8))),0.),6.);c+=gc*g*.6;gl_FragColor=vec4(c,1.);}'}));
 S.add(dome);
 var kd=(o.key&&o.key.dir)||[3,5,6],area=o.shadowArea||8;
 AMB=new T.AmbientLight(0xfff2e0,.34);S.add(AMB);
 KEY=new T.DirectionalLight((o.key&&o.key.color)||0xffe6c8,.95);KEY.position.set(kd[0],kd[1],kd[2]);KEY.castShadow=true;KEY.shadow.mapSize.set(2048,2048);
 var kc=KEY.shadow.camera;kc.left=kc.bottom=-area;kc.right=kc.top=area;kc.near=.2;kc.far=40;KEY.shadow.bias=-.0006;KEY.shadow.radius=3;S.add(KEY);S.add(KEY.target);
 RIM=new T.DirectionalLight(0x8fb0c8,.35);RIM.position.set(-4,3,-3);S.add(RIM);
 BACK=new T.DirectionalLight(0xffc89a,0);S.add(BACK);S.add(BACK.target);
 haze=K.glow(S,0,0,0,1,sky.haze,0);haze2=K.glow(S,0,0,0,1,sky.haze2,0);
 K.lights={ambient:AMB,key:KEY,rim:RIM,back:BACK};
 buildPost();
 addEventListener('resize',function(){var vs=K.view();R.setPixelRatio(vs[2]);R.setSize(vs[0],vs[1]);K.placeCanvas();cam.aspect=vs[0]/vs[1];cam.updateProjectionMatrix();
  var pr=R.getPixelRatio(),w=vs[0]*pr,h=vs[1]*pr;RT.setSize(w,h);RT.depthTexture.image.width=w;RT.depthTexture.image.height=h;QM.uniforms.asp.value=vs[0]/vs[1]});
 return K};

/* =====================================================================
   POST: subject-shaped DoF, hex anamorphic bokeh, halo-free gather,
   camera motion blur, silhouettes, bloom, ACES, grade, vignette, grain
   ===================================================================== */
function buildPost(){var pr=R.getPixelRatio();
 RT=new T.WebGLRenderTarget(K.view()[0]*pr,K.view()[1]*pr,{type:T.HalfFloatType,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthTexture:new T.DepthTexture(K.view()[0]*pr,K.view()[1]*pr,T.UnsignedIntType)});
 QM=new T.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:{t:{value:RT.texture},d:{value:RT.depthTexture},fn:{value:9},ff:{value:10},ap:{value:.01},mx:{value:.035},asp:{value:K.view()[0]/K.view()[1]},
  n:{value:.01},f:{value:120},bl:{value:.8},ex:{value:1.05},ip:{value:new T.Matrix4()},cw:{value:new T.Matrix4()},pvp:{value:new T.Matrix4()},shut:{value:.5},ana:{value:.78},
  sfg:{value:0},ssub:{value:0},grade:{value:.34},vig:{value:.5},grain:{value:.035},fr:{value:0}},
 vertexShader:'varying vec2 u;void main(){u=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:[
 'uniform sampler2D t,d;uniform float fn,ff,ap,mx,asp,n,f,bl,ex,shut,ana,sfg,ssub,grade,vig,grain,fr;uniform mat4 ip,cw,pvp;varying vec2 u;',
 'float lin(float dz){return 2.*n*f/(f+n-(dz*2.-1.)*(f-n));}',
 'float coc(float z){float o=max(max(fn-z,z-ff),0.);float r=ap*o/max(z,.02);if(z<fn)r*=1.4;return min(r,mx);}',
 'float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}',
 'vec3 aces(vec3 x){x*=ex;return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}',
 'float hexR(float a){float s=mod(a,1.0472)-.5236;return .866/cos(s);}',
 'vec3 soft(vec3 b,vec3 l){return mix(b-(1.-2.*l)*b*(1.-b),b+(2.*l-1.)*(sqrt(b)-b),step(.5,l));}',
 'void main(){float dz=texture2D(d,u).x;float z=lin(dz);float r=coc(z);',
 ' vec4 vp=ip*vec4(u*2.-1.,dz*2.-1.,1.);vp/=vp.w;vec4 pc=pvp*(cw*vp);vec2 pu=pc.xy/pc.w*.5+.5;vec2 vel=(u-pu)*shut;float vl=length(vel);if(vl>.06)vel*=.06/vl;',
 ' vel*=smoothstep(.002,.012,r);',
 ' vec2 rd=u-.5;float edge=clamp(length(rd)*1.5,0.,1.);rd=normalize(rd+1e-5);',
 ' vec3 acc=texture2D(t,u).rgb;float wsum=1.;float j=h(u)*6.283;',
 ' for(int i=0;i<40;i++){float fi=(float(i)+.5)/40.;float a=float(i)*2.39996+j;float rr=sqrt(fi)*r*hexR(a+.3);',
 '  vec2 o=vec2(cos(a)*ana,sin(a))*rr;o-=rd*dot(o,rd)*.38*edge;o.x/=asp;o+=vel*(fi-.5);',
 '  vec2 su=u+o;float zs=lin(texture2D(d,su).x);float cs=coc(zs);',
 '  float w=zs<z?1.:smoothstep(rr*.6,rr*1.05+1e-4,cs);',
 '  vec3 c=texture2D(t,su).rgb;float l=dot(c,vec3(.3,.59,.11));w*=1.+5.*max(l-.55,0.);acc+=c*w;wsum+=w;}',
 ' vec3 col=acc/wsum;',
 ' vec3 ink=vec3(.018,.016,.03);float lum=dot(col,vec3(.3,.59,.11));',
 ' col=mix(col,ink+col*.08,sfg*smoothstep(.04,.3,(fn-z)/max(fn,.05)));',
 ' float insub=1.-smoothstep(0.,.25,max(max(fn-z,z-ff),0.)/max(fn,.05));col=mix(col,ink+col*.18,ssub*insub*(1.-smoothstep(.45,.9,lum)));',
 ' vec3 b=vec3(0.);for(int i=0;i<20;i++){float a=float(i)*2.39996;float rr=sqrt((float(i)+.5)/20.)*.03;b+=max(texture2D(t,u+vec2(cos(a)/asp,sin(a))*rr).rgb-.62,0.);}',
 ' col+=b/20.*bl;col=aces(col);',
 ' float gd=dot(u-.5,normalize(vec2(1.,-1.)));vec3 gcol=mix(vec3(1.,.59,.35),vec3(.27,.35,.9),smoothstep(-.5,.5,gd));col=mix(col,soft(col,gcol),grade);',
 ' col*=1.-vig*smoothstep(.45,1.,length((u-.5)*vec2(1.15,1.))*1.35);',
 ' col+=(h(u*vec2(913.,577.)+fr)-.5)*grain;gl_FragColor=vec4(clamp(col,0.,1.),1.);}'].join('\n')});
 QS=new T.Scene();QC=new T.OrthographicCamera(-1,1,1,-1,0,1);var q=new T.Mesh(new T.PlaneGeometry(2,2),QM);q.frustumCulled=false;QS.add(q)}

/* =====================================================================
   DIRECTION LISTS — the scene fills these in
   ===================================================================== */
var SHOTS=[],LENS=[],LIGHT=[],CUES=[],LOOPS=[],DUSTS=[],UPDATE=null,AMBI=null;
/* KIT.shots([{from,to, pos:[A,B], look:[A,B], fov:32, fov2, ease:'smooth'|'linear', hand:0.02, shake:[[t,amp]]}])
   A/B are [x,y,z] or function(t){return [x,y,z]} (use functions to follow moving things) */
K.shots=function(a){SHOTS=a;return K};
/* KIT.lens([{at, on:[objects], pull:seconds, ap:0.01..0.05, pad:metres}]) */
K.lens=function(a){LENS=a;return K};
/* KIT.light([{at, ease, key, amb, back, glow, fg, sub}]) */
K.light=function(a){LIGHT=a;return K};
/* KIT.cues([[time,'sound',arg],...]) one-shot sounds */
K.cues=function(a){CUES=a;return K};
/* KIT.loops([{sound:'buzz'|'room'|'wind', from,to, vol:number|fn(t), pitch:number|fn(t)}]) continuous sounds */
K.loops=function(a){LOOPS=a;return K};
/* KIT.ambience({room:.05, hum:0, pad:[196,246.9,293.7], padVol:.02}) */
K.ambience=function(a){AMBI=a;return K};
/* KIT.update(function(t){ ... })  all animation as a pure function of t */
K.update=function(fn){UPDATE=fn;return K};
/* KIT.dust({center:[x,y,z], size:[w,h,d], count:80, color, dot:.1}) floating motes (become bokeh) */
K.dust=function(o){var g=new T.BufferGeometry(),p=[],sd=[],c=o.center||[0,1.5,0],sz=o.size||[8,3,6],n=o.count||80;
 for(var i=0;i<n;i++){p.push(0,0,0);sd.push(K.rnd(),K.rnd(),K.rnd(),K.rnd()*6.28)}g.setAttribute('position',new T.Float32BufferAttribute(p,3));
 var pts=new T.Points(g,new T.PointsMaterial({map:K.GLOWTEX,size:o.dot||.08,transparent:true,opacity:o.opacity||.7,blending:T.AdditiveBlending,depthWrite:false,color:o.color||0xffd090}));K.scene.add(pts);
 DUSTS.push({g:g,sd:sd,c:c,sz:sz,n:n,rise:o.rise||.05});return pts};
/* KIT.title('TEXT', {width:2.4, sub:'small line'}) -> group with a torn paper title card */
K.title=function(txt,o){o=o||{};var cv=document.createElement('canvas');cv.width=1024;cv.height=o.sub?380:300;var x=cv.getContext('2d');
 x.fillStyle='#d9ccb0';x.beginPath();x.moveTo(20,30);for(var i=0;i<=20;i++)x.lineTo(20+i*49,18+Math.random()*16);for(i=0;i<=8;i++)x.lineTo(1004-Math.random()*12,30+i*(cv.height-60)/8);
 for(i=20;i>=0;i--)x.lineTo(20+i*49,cv.height-18-Math.random()*16);x.closePath();x.fill();
 x.globalAlpha=.12;x.drawImage(pc,0,0,1024,cv.height);x.globalAlpha=1;x.fillStyle='#16101a';x.textAlign='center';x.textBaseline='middle';
 x.font='900 '+(o.fontSize||120)+'px Georgia, "Times New Roman", serif';x.fillText(txt,512,o.sub?150:cv.height/2);
 if(o.sub){x.font='700 52px "Trebuchet MS", sans-serif';x.fillStyle='#6a2a35';x.fillText(o.sub,512,280)}
 var tex=new T.CanvasTexture(cv),w=o.width||2.4,g=new T.Group(),m=new T.Mesh(new T.PlaneGeometry(w,w*cv.height/1024),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false}));
 var sh=new T.Mesh(new T.PlaneGeometry(w,w*cv.height/1024),new T.MeshBasicMaterial({map:tex,color:0,transparent:true,opacity:.5,depthWrite:false}));sh.position.set(.03,-.03,-.01);
 g.add(sh);g.add(m);K.scene.add(g);return g};

/* ---------- camera ---------- */
function P3(a,t){var r=typeof a==='function'?a(t):a;return r instanceof T.Vector3?r:new T.Vector3(r[0],r[1],r[2])}
var curShot=-1;function shotIndex(t){for(var i=0;i<SHOTS.length;i++)if(t>=SHOTS[i].from&&t<SHOTS[i].to)return i;return SHOTS.length-1}
function camAt(t){if(!SHOTS.length)return;var i=shotIndex(t),s=SHOTS[i],k=s.ease==='linear'?Math.min(1,Math.max(0,(t-s.from)/(s.to-s.from))):K.seg(t,s.from,s.to);
 var pa=P3(s.pos[0],t),pb=P3(s.pos[1]||s.pos[0],t),la=P3(s.look[0],t),lb=P3(s.look[1]||s.look[0],t);
 cam.position.lerpVectors(pa,pb,k);var lk=new T.Vector3().lerpVectors(la,lb,k);
 if(s.hand){cam.position.x+=Math.sin(t*1.7)*s.hand;cam.position.y+=Math.sin(t*2.3+1)*s.hand*.7}
 (s.shake||[]).forEach(function(sh){var d=t-sh[0];if(d>=0&&d<3/12){cam.position.x+=Math.sin(d*97)*sh[1];cam.position.y+=Math.cos(d*83)*sh[1]}});
 cam.lookAt(lk);var fv=K.mix(s.fov||32,s.fov2||s.fov||32,k);if(cam.fov!==fv){cam.fov=fv;cam.updateProjectionMatrix()}
 if(s.roll)cam.rotateZ(s.roll);curShot=i}

/* ---------- focus ---------- */
var BX=new T.Box3(),BB=new T.Box3(),PV=new T.Vector3(),FC=new T.Vector3();
function slab(list,pad){BB.makeEmpty();(list||[]).forEach(function(o){if(o){o.updateMatrixWorld(true);BX.setFromObject(o);BB.union(BX)}});
 if(BB.isEmpty())return [4,5];var lo=1e9,hi=-1e9;for(var i=0;i<8;i++){PV.set(i&1?BB.max.x:BB.min.x,i&2?BB.max.y:BB.min.y,i&4?BB.max.z:BB.min.z).applyMatrix4(cam.matrixWorldInverse);var z=-PV.z;lo=Math.min(lo,z);hi=Math.max(hi,z)}
 return [Math.max(.02,lo-pad),hi+pad]}
function lensAt(t){if(!LENS.length)return {near:4,far:6,ap:.008};var i=0;while(i+1<LENS.length&&t>=LENS[i+1].at)i++;var L=LENS[i],Pv=LENS[Math.max(0,i-1)];
 var A=slab(Pv.on,Pv.pad===undefined?.05:Pv.pad),B=slab(L.on,L.pad===undefined?.05:L.pad);BB.getCenter(FC);
 var k=L.pull>0?K.seg(t,L.at,L.at+L.pull):1,near=K.mix(A[0],B[0],k),far=K.mix(A[1],B[1],k),ap=K.mix(Pv.ap||.01,L.ap||.01,k);
 var cut=SHOTS.length?SHOTS[shotIndex(t)].from:0,s=t-cut,hunt=1+.05*Math.exp(-s*14)*Math.cos(s*30);return {near:near*hunt,far:far*hunt,ap:ap}}

/* ---------- light / silhouette ---------- */
var LKEYS=['key','amb','back','glow','fg','sub'],LDEF={key:.95,amb:.34,back:.3,glow:.35,fg:.8,sub:0};
function lightAt(t){if(!LIGHT.length)return LDEF;var i=0;while(i+1<LIGHT.length&&t>=LIGHT[i+1].at)i++;var A=LIGHT[Math.max(0,i-1)],B=LIGHT[i],k=B.ease>0?K.seg(t,B.at,B.at+B.ease):1,o={};
 LKEYS.forEach(function(n){var a=A[n]===undefined?LDEF[n]:A[n],b=B[n]===undefined?LDEF[n]:B[n];o[n]=K.mix(a,b,k)});return o}
var VD=new T.Vector3();
function mood(t){var L=lightAt(t);KEY.intensity=L.key;AMB.intensity=L.amb;BACK.intensity=L.back;
 VD.copy(FC).sub(cam.position).setY(0);if(VD.lengthSq()<1e-6)VD.set(0,0,-1);VD.normalize();var dist=Math.max(.3,cam.position.distanceTo(FC));
 BACK.target.position.copy(FC);BACK.position.copy(FC).addScaledVector(VD,5).setY(FC.y+2.2);
 haze.position.copy(FC).addScaledVector(VD,dist*.7+1);haze.scale.set(dist*1.3+1.5,dist*.9+1,1);haze.material.opacity=.55*L.glow;
 haze2.position.copy(FC).addScaledVector(VD,dist*1.2+3);haze2.scale.set(dist*2+3,dist*1.2+2,1);haze2.material.opacity=.35*L.glow;
 QM.uniforms.sfg.value=L.fg;QM.uniforms.ssub.value=L.sub}

/* =====================================================================
   SOUND ENGINE — everything synthesised, nothing loaded
   one-shots: step rustle whoosh swish scrape clink tada thud pop tick snore boom sting riser heartbeat
   loops:     buzz (insect wings), room (air), wind
   ===================================================================== */
var AC=null,MST=null,NB=null,DEST=null,soundOn=false,loopNodes=[],padG=[];
function audioInit(){if(AC)return;AC=new (window.AudioContext||window.webkitAudioContext)();MST=AC.createGain();MST.gain.value=0;MST.connect(AC.destination);
 DEST=AC.createMediaStreamDestination();MST.connect(DEST);
 NB=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);var d=NB.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 var A=AMBI||{room:.04};
 if(A.room){var s=AC.createBufferSource();s.buffer=NB;s.loop=true;var lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=320;var g=AC.createGain();g.gain.value=A.room;s.connect(lp);lp.connect(g);g.connect(MST);s.start()}
 if(A.hum){var hu=AC.createOscillator();hu.frequency.value=110;var hg=AC.createGain();hg.gain.value=A.hum;hu.connect(hg);hg.connect(MST);hu.start()}
 (A.pad||[]).forEach(function(fq,i){var o=AC.createOscillator();o.type='triangle';o.frequency.value=fq;o.detune.value=i*4-4;var lf=AC.createBiquadFilter();lf.type='lowpass';lf.frequency.value=900;
  var pg=AC.createGain();pg.gain.value=0;o.connect(lf);lf.connect(pg);pg.connect(MST);o.start();padG.push(pg)});
 LOOPS.forEach(function(L){loopNodes.push(makeLoop(L.sound))})}
function makeLoop(kind){var g=AC.createGain();g.gain.value=0;g.connect(MST);var node={g:g,kind:kind,set:function(){}};
 if(kind==='buzz'){var o1=AC.createOscillator(),o2=AC.createOscillator();o1.type=o2.type='sawtooth';o1.frequency.value=560;o2.frequency.value=566;
  var lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=27;lg.gain.value=22;lfo.connect(lg);lg.connect(o1.frequency);lg.connect(o2.frequency);
  var bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=1.4;o1.connect(bp);o2.connect(bp);bp.connect(g);o1.start();o2.start();lfo.start();
  node.set=function(p){o1.frequency.setTargetAtTime(560*p,AC.currentTime,.05);o2.frequency.setTargetAtTime(566*p,AC.currentTime,.05);bp.frequency.setTargetAtTime(1100*p,AC.currentTime,.05)}}
 else{var s=AC.createBufferSource();s.buffer=NB;s.loop=true;var f=AC.createBiquadFilter();f.type=kind==='wind'?'bandpass':'lowpass';f.frequency.value=kind==='wind'?500:300;f.Q.value=.7;s.connect(f);f.connect(g);s.start();
  node.set=function(p){f.frequency.setTargetAtTime((kind==='wind'?500:300)*p,AC.currentTime,.1)}}
 return node}
function nh(t0,dur,type,fq,q,gain,to){var s=AC.createBufferSource();s.buffer=NB;var f=AC.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(fq,t0);if(to)f.frequency.exponentialRampToValueAtTime(to,t0+dur);f.Q.value=q;
 var g=AC.createGain();g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(gain,t0+Math.min(.02,dur*.3));g.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(f);f.connect(g);g.connect(MST);s.start(t0,Math.random());s.stop(t0+dur+.05)}
function tn(t0,fq,dur,gain,type,to,att){var o=AC.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(fq,t0);if(to)o.frequency.exponentialRampToValueAtTime(to,t0+dur);
 var g=AC.createGain();g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(gain,t0+(att||.005));g.gain.exponentialRampToValueAtTime(.0001,t0+dur);o.connect(g);g.connect(MST);o.start(t0);o.stop(t0+dur+.05)}
var SCHED=null;function NOWT(){return SCHED!=null?SCHED:AC.currentTime}
K.SFX={
 step:function(){var t=NOWT();nh(t,.11,'bandpass',260+Math.random()*80,1.2,.35);tn(t,85,.12,.25,'sine',45)},
 rustle:function(d){nh(NOWT(),d||.6,'bandpass',2400,.6,.06)},
 whoosh:function(d){nh(NOWT(),d||.35,'bandpass',300,1.5,.12,2200)},
 swish:function(){nh(NOWT(),.18,'bandpass',1800,2,.1,600)},
 scrape:function(){nh(NOWT(),.09,'highpass',3200,.7,.08)},
 clink:function(){var t=NOWT();[2093,3140,4410,5230].forEach(function(f,i){tn(t+i*.004,f,.5-i*.08,.07-i*.012)})},
 tada:function(){var t=NOWT();[523.3,659.3,784,1046.5].forEach(function(f,i){tn(t+i*.07,f,.7,.07,'triangle')})},
 thud:function(){var t=NOWT();tn(t,120,.18,.35,'sine',50);nh(t,.06,'lowpass',900,.7,.12)},
 pop:function(){tn(NOWT(),600,.08,.15,'sine',1400)},
 tick:function(){nh(NOWT(),.03,'highpass',5000,.5,.08)},
 snore:function(d){var t=NOWT();d=d||1.4;var s=AC.createBufferSource();s.buffer=NB;var f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=380;f.Q.value=2.5;
  var g=AC.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+d*.45);g.gain.linearRampToValueAtTime(0,t+d);s.connect(f);f.connect(g);g.connect(MST);s.start(t);s.stop(t+d+.05);
  var o=AC.createOscillator();o.type='sawtooth';o.frequency.value=58;var og=AC.createGain();og.gain.setValueAtTime(0,t);og.gain.linearRampToValueAtTime(.05,t+d*.45);og.gain.linearRampToValueAtTime(0,t+d);
  var lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=300;o.connect(lp);lp.connect(og);og.connect(MST);o.start(t);o.stop(t+d+.05)},
 boom:function(){var t=NOWT();tn(t,70,1.6,.45,'sine',30);nh(t,1.2,'lowpass',400,.7,.15)},
 sting:function(){var t=NOWT();[220,261.6,329.6,440].forEach(function(f,i){tn(t,f,2.2,.06,'sawtooth',null,.02)});tn(t,55,2,.25,'sine',40)},
 riser:function(d){d=d||1.5;var t=NOWT();nh(t,d,'bandpass',300,3,.1,3500);tn(t,110,d,.05,'sawtooth',440,d*.9)},
 heartbeat:function(){var t=NOWT();tn(t,60,.15,.4,'sine',40);tn(t+.22,55,.15,.3,'sine',38)}
};
/* K.renderAudio(duration, narrationBuffer) -> Promise<AudioBuffer>: narration + every cue + ambience, mixed offline (frame-exact) */
K.renderAudio=function(dur,narr){var SR=48000,off=new OfflineAudioContext(2,Math.ceil(dur*SR),SR);
 var keep=[AC,MST,NB];AC=off;MST=off.createGain();MST.gain.value=.9;MST.connect(off.destination);
 NB=off.createBuffer(1,SR*2,SR);var d=NB.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 var A=AMBI||{room:.04};
 if(A.room){var s=off.createBufferSource();s.buffer=NB;s.loop=true;var lp=off.createBiquadFilter();lp.type='lowpass';lp.frequency.value=320;var g=off.createGain();g.gain.value=A.room;s.connect(lp);lp.connect(g);g.connect(MST);s.start(0)}
 (A.pad||[]).forEach(function(fq,i){var o=off.createOscillator();o.type='triangle';o.frequency.value=fq;o.detune.value=i*4-4;var lf=off.createBiquadFilter();lf.type='lowpass';lf.frequency.value=900;
  var pg=off.createGain(),pv=A.padVol||.02;pg.gain.setValueAtTime(0,0);pg.gain.linearRampToValueAtTime(pv,1.5);pg.gain.setValueAtTime(pv,Math.max(1.6,dur-.6));pg.gain.linearRampToValueAtTime(0,dur);o.connect(lf);lf.connect(pg);pg.connect(MST);o.start(0)});
 CUES.forEach(function(c){if(c[0]<dur&&K.SFX[c[1]]){SCHED=Math.max(0,c[0]);try{K.SFX[c[1]](c[2])}catch(e){}SCHED=null}});
 if(narr){var ns=off.createBufferSource();ns.buffer=narr;ns.connect(off.destination);ns.start(0)}
 AC=keep[0];MST=keep[1];NB=keep[2];
 return off.startRendering()};
var lastT=-1;
/* app hooks: K.audioInit(), K.audio() -> {ctx, master, dest}, K.sound(on) */
K.audioInit=function(){audioInit();if(AC.state==='suspended')AC.resume();return K.audio()};
K.audio=function(){return {ctx:AC,master:MST,dest:DEST}};
K.sound=function(on){audioInit();if(AC.state==='suspended')AC.resume();soundOn=!!on;MST.gain.setTargetAtTime(on?.9:0,AC.currentTime,.05)};
function audioTick(t){if(!AC||!soundOn)return;if(t<lastT||t-lastT>.35)lastT=t;
 CUES.forEach(function(c){if(lastT<c[0]&&t>=c[0]&&K.SFX[c[1]])K.SFX[c[1]](c[2])});
 LOOPS.forEach(function(L,i){var n=loopNodes[i];if(!n)return;var on=t>=(L.from||0)&&t<(L.to===undefined?1e9:L.to);
  var v=on?(typeof L.vol==='function'?L.vol(t):(L.vol===undefined?.1:L.vol)):0,p=typeof L.pitch==='function'?L.pitch(t):(L.pitch||1);
  n.g.gain.setTargetAtTime(Math.max(0,v),AC.currentTime,.03);n.set(p)});
 var pv=(AMBI&&AMBI.padVol)||.02,D=K.duration;padG.forEach(function(g){g.gain.setTargetAtTime(pv*K.seg(t,0,1.5)*(1-K.seg(t,D-.5,D)),AC.currentTime,.2)});
 lastT=t}

/* =====================================================================
   PLAYER: 12 fps stop-motion clock, debug bar, sound, recorder
   ===================================================================== */
var T0=0,clk,prevVP=new T.Matrix4(),curVP=new T.Matrix4(),lastStep=-1,lastShotIdx=-1,recording=false;
/* K.start({bar:false, time:function(){return seconds}, after:function(t){}})  app mode: external clock, no bar */
K.start=function(so){so=so||{};if(!R)K.init({});clk=new T.Clock();
 if(so.bar===false){K.time=so.time;(function loop2(){requestAnimationFrame(loop2);var D=K.duration,t=Math.max(0,Math.min(D,Math.floor((so.time?so.time():clk.getElapsedTime()%D)*12)/12));frame(t,clk.getElapsedTime());if(so.after)so.after(t)})();return K}
 var bar=document.createElement('div');bar.className='kbar';bar.innerHTML='<button id="ksnd">Sound off</button><button id="krep">Replay</button><button id="krec" class="rec">Record video</button><div class="ktrack"><div id="kprog"></div></div><span id="ktime">0.0 s</span>';
 document.body.appendChild(bar);var prog=document.getElementById('kprog'),tl=document.getElementById('ktime'),sb=document.getElementById('ksnd'),rb=document.getElementById('krec');
 function restart(){T0=clk.getElapsedTime();lastT=-1}
 sb.onclick=function(){audioInit();if(AC.state==='suspended')AC.resume();soundOn=!soundOn;MST.gain.setTargetAtTime(soundOn?.9:0,AC.currentTime,.05);sb.textContent=soundOn?'Sound on':'Sound off';if(soundOn)restart()};
 document.getElementById('krep').onclick=restart;
 rb.onclick=function(){if(recording)return;audioInit();if(AC.state==='suspended')AC.resume();soundOn=true;MST.gain.value=.9;sb.textContent='Sound on';
  var vs=R.domElement.captureStream(30),st=new MediaStream(vs.getVideoTracks().concat(DEST.stream.getAudioTracks())),chunks=[];
  var mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].filter(function(m){return window.MediaRecorder&&MediaRecorder.isTypeSupported(m)})[0];
  var mr=new MediaRecorder(st,mime?{mimeType:mime,videoBitsPerSecond:12e6}:undefined);mr.ondataavailable=function(e){if(e.data.size)chunks.push(e.data)};
  mr.onstop=function(){var b=new Blob(chunks,{type:'video/webm'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(cfg.name||'scene')+'.webm';document.body.appendChild(a);a.click();recording=false;rb.textContent='Record video';bar.style.opacity=1};
  recording=true;rb.textContent='Recording...';bar.style.opacity=0;restart();mr.start();setTimeout(function(){mr.stop()},(K.duration+.4)*1000)};
 (function loop(){requestAnimationFrame(loop);var now=clk.getElapsedTime(),D=K.duration,raw=(now-T0)%(D+.8);if(raw<0)raw=0;var t=Math.min(D,Math.floor(raw*12)/12);
  frame(t,now);prog.style.width=(t/D*100)+'%';tl.textContent=t.toFixed(1)+' / '+D.toFixed(1)+' s'})()};
var lastUT=-1;
function frame(t,now){
  var bq=Math.floor(now*6);ALLEDGE.forEach(function(e){e.uniforms.sd.value=(bq%3)*1.7});
  try{if(UPDATE)UPDATE(t);camAt(t);faceStep(t)}catch(err){showErr(err);if(!K.onError)throw err}
  DUSTS.forEach(function(D2){var a=D2.g.attributes.position;for(var i=0;i<D2.n;i++){var s=D2.sd;a.setXYZ(i,D2.c[0]+(s[i*4]-.5)*D2.sz[0]+Math.sin(t*.4+s[i*4+3])*.15,
   D2.c[1]+(((s[i*4+1]+t*D2.rise)%1)-.5)*D2.sz[1],D2.c[2]+(s[i*4+2]-.5)*D2.sz[2])}a.needsUpdate=true});
  cam.updateMatrixWorld();cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  var fp=lensAt(t),U=QM.uniforms;U.fn.value=fp.near;U.ff.value=fp.far;U.ap.value=fp.ap;mood(t);
  if(t!==lastStep){prevVP.copy(curVP);curVP.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);if(curShot!==lastShotIdx||t<lastStep)prevVP.copy(curVP);lastShotIdx=curShot;lastStep=t;U.fr.value=(U.fr.value+1.37)%100}
  U.ip.value.copy(cam.projectionMatrixInverse);U.cw.value.copy(cam.matrixWorld);U.pvp.value.copy(prevVP);
  audioTick(t);R.setRenderTarget(RT);R.render(S,cam);R.setRenderTarget(null);R.render(QS,QC)}
K.frame=function(t,now){frame(t,now===undefined?(clk?clk.getElapsedTime():0):now)};
function showErr(e){if(K.onError){K.onError(e);return}if(document.querySelector('.kerr'))return;var d=document.createElement('div');d.className='kerr';d.textContent='SCENE ERROR (paste this back to the AI):\n'+(e&&e.stack||e);document.body.appendChild(d)}
window.addEventListener('error',function(e){showErr(e.error||e.message)});

/* =====================================================================
   PREVIEW one asset: KIT.preview('name', opts) — turntable + emotion buttons
   ===================================================================== */
K.preview=function(name,opts){K.init({duration:8,sky:(opts&&opts.sky)||'warm'});
 var fl=new T.Mesh(new T.CircleGeometry(6,48),K.toon(0x2a2026));fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;S.add(fl);
 var a=K.make(name,opts);a.root.updateMatrixWorld(true);var bx=new T.Box3().setFromObject(a.root),c=bx.getCenter(new T.Vector3()),sz=bx.getSize(new T.Vector3()).length()||1;
 var ang=0,drag=false,lx=0;R.domElement.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX});addEventListener('pointerup',function(){drag=false});
 R.domElement.addEventListener('pointermove',function(e){if(drag){ang-=(e.clientX-lx)*.01;lx=e.clientX}});
 K.shots([{from:0,to:8,pos:[function(t){return [c.x+Math.sin(ang+t*.3)*sz*1.6,c.y+sz*.35,c.z+Math.cos(ang+t*.3)*sz*1.6]}],look:[[c.x,c.y,c.z]],fov:32}]);
 K.lens([{at:0,on:[a.root],ap:.012,pad:sz*.1}]);K.light([{at:0,key:.95,amb:.36,back:.5,glow:.4,fg:0,sub:0}]);
 if(a.face){var box=document.createElement('div');box.style.cssText='position:fixed;top:12px;left:12px;display:flex;flex-wrap:wrap;gap:6px;z-index:6;max-width:calc(100% - 24px)';
  Object.keys(K.EMO).forEach(function(n){var b=document.createElement('button');b.textContent=n;b.style.cssText='border:0;border-radius:999px;padding:7px 12px;background:#e9dfc8;color:#14111a;font:700 12px "Trebuchet MS",sans-serif;cursor:pointer';
   b.onclick=function(){a.face.show(n)};box.appendChild(b)});document.body.appendChild(box)}
 var info=document.createElement('div');info.style.cssText='position:fixed;top:12px;right:12px;color:#e9dfc8;font:12px monospace;text-align:right;z-index:6';
 info.textContent=name+'  parts: '+Object.keys(a).join(', ')+'  size: '+bx.getSize(new T.Vector3()).toArray().map(function(v){return v.toFixed(2)}).join(' x ');document.body.appendChild(info);
 K.update(function(t){if(a.animate)a.animate(t)});K.start();return a};
})();
