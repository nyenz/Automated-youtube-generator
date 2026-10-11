/* SEMI-3D test: real 3D bodies drawn to look like the flat reference style.
   Each colour gets two flat tones (lit + hue-shifted shadow) with a hard edge, no outlines, no gradients.
   Faces and prints are 2D drawings wrapped on the 3D shapes. */
(function () {
  var T = THREE, S = window.SEMI = {};
  var LIGHT = new T.Vector3(-.55, .75, .45).normalize();
  var MATS = {};
  function cel(base, shade) {
    var k = base + shade; if (MATS[k]) return MATS[k];
    var m = new T.ShaderMaterial({
      uniforms: { uBase: { value: new T.Color(base) }, uShade: { value: new T.Color(shade) }, uL: { value: LIGHT } },
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 uBase; uniform vec3 uShade; uniform vec3 uL; varying vec3 vN; void main(){ float d = dot(normalize(vN), uL); float t = smoothstep(.02, .06, d); gl_FragColor = vec4(mix(uShade, uBase, t), 1.0); }'
    });
    MATS[k] = m; return m;
  }
  S.cel = cel;
  var P = { ink: '#050304', cream: ['#F5ECE4', '#C9B6A8'], teal: ['#057378', '#034F55'], denim: ['#527481', '#284150'], orange: ['#E13B07', '#A82A05'],
    skin: ['#7A2E28', '#4A1A1E'], sole: ['#1a1418', '#050304'], pink: ['#D9A5A0', '#A87570'] };
  S.P = P;
  function mesh(g, m, par, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); if (par) par.add(o); return o }
  function sph(r, ws, hs) { return new T.SphereGeometry(r, ws || 32, hs || 20) }
  function lathe(pts, seg) { return new T.LatheGeometry(pts.map(function (p) { return new T.Vector2(p[0], p[1]) }), seg || 40) }
  function canvasTex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); draw(x, w, h); var t = new T.CanvasTexture(c); t.anisotropy = 4; return t }

  // 2D face drawn like the sheets: half-moon whites, flat lid line with a flick, side pupils, slab brows, tiny smirk, freckles
  function faceTex(state) {
    return canvasTex(1024, 512, function (x, w, h) {
      x.clearRect(0, 0, w, h);
      var lid = state.lid == null ? .25 : state.lid, look = state.look || 0;
      function eye(cx, cy, ew, eh) {
        x.save(); x.beginPath(); x.moveTo(cx - ew / 2, cy - eh * .45); x.lineTo(cx + ew / 2, cy - eh * .55); x.bezierCurveTo(cx + ew / 2 + 4, cy + eh * .6, cx - ew / 2 - 4, cy + eh * .6, cx - ew / 2, cy - eh * .45); x.closePath();
        x.fillStyle = P.cream[0]; x.fill(); x.clip();
        x.fillStyle = P.ink; x.beginPath(); x.arc(cx + look * ew * .25, cy + eh * .1, eh * .2, 0, 7); x.fill();
        var top = cy - eh * .5 + lid * eh; x.fillStyle = P.skin[0]; x.fillRect(cx - ew, cy - eh * 1.2, ew * 2, top - (cy - eh * 1.2)); x.restore();
        x.fillStyle = P.ink; x.beginPath(); x.moveTo(cx - ew / 2 - 6, top + 4); x.lineTo(cx + ew / 2 + 4, top - 6); x.lineTo(cx + ew / 2 + 22, top - 18); x.lineTo(cx + ew / 2 + 6, top + 6); x.lineTo(cx - ew / 2 - 4, top + 12); x.fill();
      }
      eye(415, 215, 190, 130); eye(630, 215, 190, 130);
      x.fillStyle = P.ink; x.save(); x.translate(420, 118); x.rotate(-.07); x.fillRect(-92, -20, 184, 38); x.restore(); x.save(); x.translate(625, 116); x.rotate(.07); x.fillRect(-92, -20, 184, 38); x.restore();
      x.strokeStyle = P.ink; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath();
      if (state.talk) { x.fillStyle = '#2a0b0d'; x.ellipse(525, 470, 34, 8 + state.talk * 26, 0, 0, 7); x.fill() }
      else { x.moveTo(470, 466); x.quadraticCurveTo(530, 492, 600, 454); x.stroke() }
      x.fillStyle = P.skin[1]; [[700, 330], [722, 344], [686, 350]].forEach(function (f) { x.beginPath(); x.arc(f[0], f[1], 6, 0, 7); x.fill() });
    });
  }
  function numberTex(num) {
    return canvasTex(512, 512, function (x, w, h) {
      x.clearRect(0, 0, w, h); x.fillStyle = P.orange[0]; x.font = '900 300px "Arial Black", Impact, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.save(); x.translate(256, 270); x.scale(.9, 1.15); x.fillText(num, 0, 0); x.restore();
      // sleeve-style stripes at the bottom of the jersey texture are separate geometry
    });
  }

  /* the "93" guy, about 1.75 m tall, facing +z */
  S.guy93 = function () {
    var root = new T.Group(), body = new T.Group(); root.add(body);
    var R = { root: root, body: body };
    var denim = cel(P.denim[0], P.denim[1]), teal = cel(P.teal[0], P.teal[1]), skin = cel(P.skin[0], P.skin[1]), cream = cel(P.cream[0], P.cream[1]), ink = cel(P.ink, P.ink), orange = cel(P.orange[0], P.orange[1]);
    // legs: hip joint -> thigh -> knee -> wide shin that pools over the shoe
    R.legs = [-1, 1].map(function (sd) {
      var hip = new T.Group(); hip.position.set(sd * .12, .86, 0); body.add(hip);
      mesh(lathe([[0, 0], [.13, 0], [.15, -.42], [0, -.42]], 28), denim, hip).rotation.x = Math.PI;
      mesh(lathe([[0, .02], [.14, .02], [.152, -.06], [.152, -.46], [0, -.46]], 28), denim, hip);
      var knee = new T.Group(); knee.position.y = -.42; hip.add(knee);
      mesh(lathe([[0, .06], [.152, .06], [.152, 0], [.19, -.34], [.205, -.4], [0, -.4]], 28), denim, knee);
      var ank = new T.Group(); ank.position.y = -.38; knee.add(ank);
      var shoe = new T.Group(); shoe.position.set(0, -.02, .05); ank.add(shoe);
      var sole = mesh(sph(.14, 28, 14), ink, shoe, 0, -.055, .03); sole.scale.set(.82, .28, 1.45);
      var mid = mesh(sph(.14, 28, 14), cream, shoe, 0, -.02, .03); mid.scale.set(.84, .3, 1.42);
      var up = mesh(sph(.13, 28, 16), cream, shoe, 0, .04, .03); up.scale.set(.82, .62, 1.38);
      var pan = mesh(sph(.13, 20, 12), ink, shoe, 0, .06, .1); pan.scale.set(.86, .45, .7);
      var tip = mesh(sph(.06, 16, 10), cel(P.pink[0], P.pink[1]), shoe, 0, .06, -.12); tip.scale.set(1.45, .9, 1);
      return { hip: hip, knee: knee, ank: ank, sd: sd };
    });
    // hips + jersey (oversized, flattened front-to-back)
    var hips = mesh(sph(.24, 32, 16), denim, body, 0, .88, 0); hips.scale.set(1.1, .55, .82);
    var torso = new T.Group(); torso.position.y = .86; body.add(torso); R.torso = torso;
    var jersey = mesh(lathe([[0, -.06], [.3, -.06], [.31, .1], [.3, .3], [.28, .42], [.23, .5], [.14, .56], [.07, .58], [0, .58]], 48), teal, torso);
    jersey.scale.z = .72;
    [[-.04, .05, cream], [.01, .045, ink]].forEach(function (b) { var r = mesh(new T.CylinderGeometry(.322, .322, b[1], 48, 1, true), b[2], torso, 0, b[0], 0); r.scale.z = .73; r.material.side = T.DoubleSide });
    // number print wrapped on the chest
    var numG = new T.CylinderGeometry(.326, .32, .3, 48, 1, true, -.7, 1.4), num = new T.Mesh(numG, new T.MeshBasicMaterial({ map: numberTex('93'), transparent: true, side: T.DoubleSide }));
    num.position.y = .3; num.scale.z = .74; torso.add(num);
    var vneck = mesh(new T.ConeGeometry(.08, .14, 3), cream, torso, 0, .54, .19); vneck.rotation.x = Math.PI; vneck.rotation.y = Math.PI; vneck.scale.z = .3;
    // arms: oversized sleeves with stripes, forearms reaching into the pockets
    R.arms = [-1, 1].map(function (sd) {
      var sh = new T.Group(); sh.position.set(sd * .25, .47, 0); torso.add(sh);
      var sl = mesh(lathe([[0, .04], [.1, .04], [.13, -.1], [.12, -.36], [0, -.36]], 28), teal, sh);
      [[-.24, .04, cream], [-.28, .045, ink], [-.325, .035, cream]].forEach(function (b) { mesh(new T.CylinderGeometry(.124, .123, b[1], 28), b[2], sh, 0, b[0], 0) });
      var el = new T.Group(); el.position.y = -.34; sh.add(el);
      mesh(new T.CylinderGeometry(.045, .05, .3, 16), skin, el, 0, -.14, 0);
      sh.rotation.z = sd * .16; sh.rotation.x = .08; el.rotation.x = -.85; el.rotation.z = -sd * .55;
      return { sh: sh, el: el, sd: sd };
    });
    // neck + head
    var neckG = new T.Group(); neckG.position.y = .58; torso.add(neckG); R.neck = neckG;
    mesh(new T.CylinderGeometry(.05, .055, .14, 16), skin, neckG, 0, .06, 0);
    var head = new T.Group(); head.position.y = .26; head.scale.setScalar(1.32); neckG.add(head); R.head = head;
    var skull = mesh(sph(.15, 40, 28), skin, head); skull.scale.set(.96, 1.05, 1.02);
    var jaw = mesh(sph(.12, 32, 20), skin, head, 0, -.05, .03); jaw.scale.set(.95, .8, 1);
    var nose = mesh(sph(.058, 24, 16), skin, head, 0, -.11, .16); nose.scale.set(1.25, .78, 1.15);
    [-1, 1].forEach(function (sd) { var ear = mesh(sph(.035, 16, 12), skin, head, sd * .145, 0, -.01); ear.scale.set(.5, 1, .8); var hoop = mesh(new T.TorusGeometry(.016, .004, 8, 20), cel('#E2A052', '#B07a30'), head, sd * .15, -.04, 0); hoop.rotation.y = Math.PI / 2 });
    R.faceState = { lid: .4, look: 0, talk: 0 };
    var faceMat = new T.MeshBasicMaterial({ map: faceTex(R.faceState), transparent: true, depthWrite: false });
    var face = new T.Mesh(new T.SphereGeometry(.157, 48, 32, Math.PI * .5 - 1.0, 2.0, Math.PI * .36, Math.PI * .56), faceMat); face.scale.set(.96, 1.05, 1.02); head.add(face); R.faceMat = faceMat;
    // cap (worn forward, brim to the front-left) and locs
    var cap = mesh(new T.SphereGeometry(.158, 40, 20, 0, Math.PI * 2, 0, Math.PI * .5), orange, head, 0, .075, -.01); cap.scale.set(1, .8, 1.05);
    var brim = mesh(new T.CylinderGeometry(.14, .14, .014, 32, 1, false, -1.1, 2.2), orange, head, 0, .078, .08); brim.scale.set(1, 1, 1.15);
    mesh(sph(.018, 12, 8), orange, head, 0, .2, 0);
    for (var i = 0; i < 9; i++) { var a = Math.PI * (.55 + i * .1), lx = Math.cos(a) * .14, lz = -Math.abs(Math.sin(a)) * .12 - .02;
      for (var k = 0; k < 6; k++) mesh(sph(.024, 12, 8), ink, head, lx * (1 + k * .05), .02 - k * .05, lz - k * .012) }
    R.setFace = function (st) { Object.assign(R.faceState, st); faceMat.map.dispose(); faceMat.map = faceTex(R.faceState); faceMat.needsUpdate = true };
    return R;
  };

  // walk cycle (phase 0..1) or stand
  S.pose = function (R, t, walk) {
    var ph = walk ? (t * 1.05) % 1 : null, w = walk ? 1 : 0;
    R.legs.forEach(function (L) {
      var p = ph == null ? 0 : ph + (L.sd > 0 ? .5 : 0), s = Math.sin(p * Math.PI * 2);
      L.hip.rotation.x = -s * .45 * w;
      L.knee.rotation.x = w * Math.max(0, Math.sin(p * Math.PI * 2 - 1.2)) * .9 + .05;
      L.ank.rotation.x = -(L.hip.rotation.x + L.knee.rotation.x) * .85;
    });
    R.body.position.y = w * Math.abs(Math.cos(((ph || 0) * 2) * Math.PI)) * .035 - (w ? .02 : 0);
    R.torso.rotation.y = w * Math.sin((ph || 0) * Math.PI * 2) * .12;
    R.torso.rotation.z = w * Math.sin((ph || 0) * Math.PI * 2) * .025 + Math.sin(t * 1.4) * .01;
    R.torso.rotation.x = .05 + (w ? .04 : 0) - Math.sin(t * 2.1) * .01; // slouch + breathing
    R.arms.forEach(function (A) { A.sh.rotation.x = w * Math.sin(((ph || 0) + (A.sd > 0 ? 0 : .5)) * Math.PI * 2) * .1 });
    R.neck.rotation.y = -R.torso.rotation.y * .8;
  };
})();
