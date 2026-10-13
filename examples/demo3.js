/* DEMO 3 — "Under the Ice" (first 22 s of a real narration): an 8-year-old boy pulled from an iced-over pond,
   about 7 °C body temperature, and the ICU where his heart came back. Paper cut-out style, real voice timing. */
window.DEMO3 = {
  title: 'Under the Ice',
  assets: {
    snowbank: `KIT.asset('snowbank', function (K, opts) {
  var root = new K.T.Group(), T = K.T;
  K.ground(root, { radius: 18, color: 0x8e9fb4 });
  K.ridges(root, { z: -11, colors: [0x26324a, 0x1d2740, 0x161e33] });
  K.moon(root, -4, 7, -26, 2.2);
  // the frozen pond behind them, with the dark hole in the ice
  var ice = K.flat(new T.CircleGeometry(1, 56), 0x6d86a3, root, .6, .015, -5, 7.5, 3.4, 1); ice.rotation.x = -Math.PI / 2;
  var hole = K.flat(new T.ShapeGeometry(K.jagged(1.1, .7, 16, .28)), 0x0b1220, root, 1.6, .02, -4.6, 1, 1, 1); hole.rotation.x = -Math.PI / 2;
  [[-2.4, -4.1], [1.6, -3.4], [3.9, -5.4]].forEach(function (c) { K.M(new T.BoxGeometry(.9, .05, .5), 0xb9cad8, root, c[0], .04, c[1], 1, 1, 1, 'thin').rotation.y = c[0] });
  // bare winter trees and snow tufts
  [[-7, -7, 1.7], [6.5, -8, 1.9], [-9.5, -3, 1.4], [9, -2.5, 1.5]].forEach(function (p) { K.paperTree(root, p[0], p[1], { scale: p[2], trunk: 0x2a2026, leaves: [0x2b3a4c, 0x23303f, 0x33465a, 0x1d2836], puffs: [0xd8e2ea, 0xc4d2de] }) });
  for (var i = 0; i < 26; i++) { var x = (K.rnd() - .5) * 18, z = (K.rnd() - .5) * 8 + 1; if (Math.abs(x) < 3 && z > -1.5) continue; K.tuft(root, x, z, .5 + K.rnd() * .5, [0xdfe8ef, 0xc8d4de][i % 2]) }
  // orange rescue backboard
  K.M(new T.BoxGeometry(2.7, .1, .95), 0xd8641e, root, 0, .06, .6);
  [-1, 1].forEach(function (s) { K.M(new T.BoxGeometry(.06, .04, .97), 0x1a1416, root, s * .7, .13, .6, 1, 1, 1, 'thin') });
  // flashing lights of the ambulance off-screen (driven by the shot)
  var red = K.glow(root, -4.5, 1.6, -1.5, 5, 0xff3b30, .5), blue = K.glow(root, 4.8, 1.6, -2.2, 5, 0x3b7bff, .5);
  var V = function (x, y, z) { return new T.Vector3(x, y, z) };
  return { root: root, kind: 'set', lights: [red, blue], spots: { boy: V(1.15, .12, .6), boyhead: V(-.9, .35, .6), medic: V(.35, 0, -.45), center: V(0, 0, 0), pond: V(1.6, 0, -4.6) } };
});`,
    underice: `KIT.asset('underice', function (K, opts) {
  var root = new K.T.Group(), T = K.T;
  K.flat(new T.PlaneGeometry(60, 30), 0x0c2630, root, 0, 6, -10);
  K.ground(root, { radius: 18, color: 0x1b2a26 });
  for (var i = 0; i < 18; i++) { var x = (K.rnd() - .5) * 16, z = (K.rnd() - .5) * 9 - 2; K.tuft(root, x, z, .6 + K.rnd() * .9, [0x23402f, 0x1c3326, 0x2e4d34][i % 3]) }
  K.rock(root, -3, 1, 1.6); K.rock(root, 2.6, -1.2, 1.3); K.rock(root, 4.5, 1.5, 1);
  // the underside of the ice: a pale sheet with cracks, and the bright hole the boy fell through
  var ice = K.flat(new T.PlaneGeometry(40, 30), 0x9fbfd0, root, 0, 4.6, -2, 1, 1, 1, .55); ice.rotation.x = Math.PI / 2;
  var hole = K.flat(new T.ShapeGeometry(K.jagged(1.2, .8, 16, .3)), 0xeaf6ff, root, 1.2, 4.58, -1.6, 1, 1, 1, .95); hole.rotation.x = Math.PI / 2;
  K.glow(root, 1.2, 4.3, -1.6, 4.5, 0xcfe8ff, .55);
  for (i = 0; i < 7; i++) { var c = K.M(new T.BoxGeometry(2 + K.rnd() * 3, .02, .04), 0x7e9cb0, root, (K.rnd() - .5) * 12, 4.56, -2 + (K.rnd() - .5) * 8, 1, 1, 1, false); c.rotation.y = K.rnd() * 3 }
  // the sled left on the ice, seen from below as a dark shape
  K.flat(new T.PlaneGeometry(1.4, .55), 0x1a1416, root, -.6, 4.62, -2.4, 1, 1, 1, .8).rotation.x = Math.PI / 2;
  [[-1.2, -2.15], [-1.2, -2.65], [0, -2.15], [0, -2.65]].forEach(function (q) { K.flat(new T.PlaneGeometry(.08, .08), 0x1a1416, root, q[0], 4.61, q[1], 1, 1, 1, .8).rotation.x = Math.PI / 2 });
  // light falling through the hole
  var beam = K.flat(new T.ConeGeometry(2.4, 4.6, 32, 1, true), 0xcfe8ff, root, 1.2, 2.3, -1.6, 1, 1, 1, .1);
  var V = function (x, y, z) { return new T.Vector3(x, y, z) };
  return { root: root, kind: 'set', spots: { center: V(0, 0, 0), hole: V(1.2, 0, -1.6) } };
});`,
    icu: `KIT.asset('icu', function (K, opts) {
  var root = new K.T.Group(), T = K.T;
  K.M(K.BOX, 0x3f4f50, root, 0, -.1, 0, 16, .2, 12);
  K.M(K.BOX, 0x6f8f8c, root, 0, 3.4, -4.2, 16, 7, .3);
  K.M(K.BOX, 0x5f7c7a, root, -7.5, 3.4, 0, .3, 7, 12);
  // night window
  K.M(K.BOX, 0xb8c0c4, root, -4.2, 3.8, -4.02, 2.8, 2.2, .1, 'thin'); K.flat(new T.PlaneGeometry(2.5, 1.9), 0x1b2233, root, -4.2, 3.8, -3.96);
  // the bed: frame, mattress, pillow, teal blanket
  K.M(new T.BoxGeometry(3.6, .2, 1.6), 0xb8c0c4, root, 0, .95, -.6);
  [[-1.7, -1.3], [1.7, -1.3], [-1.7, .1], [1.7, .1]].forEach(function (p) { K.M(new T.BoxGeometry(.08, .95, .08), 0x8c9498, root, p[0], .48, p[1], 1, 1, 1, 'thin') });
  K.M(new T.BoxGeometry(3.4, .22, 1.45), 0xd9ccb0, root, 0, 1.15, -.6);
  K.M(K.SPH, 0xeee6d6, root, -1.3, 1.32, -.6, .42, .14, .5);
  K.M(new T.BoxGeometry(2.1, .12, 1.5), 0x2b6a6c, root, .55, 1.32, -.6);
  // ECMO machine with its warming circuit (red lines run to the bed)
  K.M(new T.BoxGeometry(1.1, 1.6, .8), 0xd9d4c8, root, 2.9, .8, -2.2);
  K.M(new T.CylinderGeometry(.28, .28, .1, 24), 0x8c9498, root, 2.9, 1.2, -1.78, 1, 1, 1, 'thin').rotation.x = Math.PI / 2;
  K.flat(new T.PlaneGeometry(.6, .35), 0x0c1a14, root, 2.9, 1.55, -1.79);
  [[2.5, 1.0, -1.8, 1.7], [2.55, .9, -1.75, 1.9]].forEach(function (q) { var tb = K.M(K.limb(.035, .035, q[3]), 0xa8242a, root, q[0], q[1], q[2], 1, 1, 1, 'thin'); tb.rotation.z = 1.1 });
  // heart monitor on a pole, with the line the shot makes beat
  K.M(new T.CylinderGeometry(.04, .04, 2.6, 10), 0x8c9498, root, -2.3, 1.3, -1.9, 1, 1, 1, 'thin');
  K.M(new T.BoxGeometry(1.0, .7, .12), 0x2c2b3a, root, -2.3, 2.7, -1.9);
  K.flat(new T.PlaneGeometry(.86, .56), 0x0c1a14, root, -2.3, 2.7, -1.83);
  var line = K.flat(new T.PlaneGeometry(.8, .03), 0x5fd08a, root, -2.3, 2.66, -1.82);
  var blip = K.flat(new T.PlaneGeometry(.06, .3), 0x5fd08a, root, -2.3, 2.72, -1.82);
  K.glow(root, -2.3, 2.7, -1.6, 1.6, 0x5fd08a, .25);
  // IV pole
  K.M(new T.CylinderGeometry(.03, .03, 3, 10), 0x8c9498, root, -1.9, 1.5, .3, 1, 1, 1, 'thin');
  K.M(K.SPH, 0xcfe3ea, root, -1.9, 2.9, .3, .14, .22, .14, 'thin');
  var lamp = new T.PointLight(0xffd9a0, .6, 10); lamp.position.set(0, 5, 1); root.add(lamp);
  var V = function (x, y, z) { return new T.Vector3(x, y, z) };
  return { root: root, kind: 'set', blip: blip, spots: { bed: V(1.05, 1.27, -.6), bedhead: V(-1.05, 1.5, -.6), doc1: V(1.9, 0, .9), doc2: V(-2.6, 0, .4), monitor: V(-2.3, 0, -1.9), center: V(0, 0, 0) } };
});`,
    medic: `KIT.asset('medic', function (K, opts) {
  var rig = K.human({ build: 'average', skin: K.PAL.skin[5], hair: K.PAL.hair[2], hairStyle: 'short', top: 'tee', shirt: 0x1f2a3e, collar: 0x1f2a3e, pants: 0x1b2233, shoes: 0x1a1416, nose: 1.1, beard: 'stubble', beardColor: K.PAL.hair[2] });
  // reflective stripes on the jacket and a dark beanie
  [.45, .62].forEach(function (y) { var b = K.M(new K.T.CylinderGeometry(.43, .43, .06, 32, 1, true), 0xd9d36a, rig.torso, 0, y, 0, 1, 1, .72, 'thin'); b.material.side = K.T.DoubleSide });
  var hat = new K.T.Mesh(new K.T.SphereGeometry(.36, 28, 14, 0, Math.PI * 2, 0, Math.PI * .5), K.toon(0x2c2b3a)); hat.position.set(0, .5, 0); hat.scale.set(1.05, .9, 1.08); rig.head.add(hat);
  rig.kind = 'character'; return rig;
});`,
    boy: `KIT.asset('boy', function (K, opts) {
  var rig = K.human({ build: 'kid', skin: K.PAL.skin[4], hair: K.PAL.hair[3], hairStyle: 'short', top: 'tee', shirt: 0xb03a32, collar: 0xb03a32, pants: 0x2a3550, shoes: 0x2a2020 });
  rig.root.children[0].visible = false;             // no standing shadow: he is lying down
  var w = new K.T.Group(); w.add(rig.root);
  rig.root.rotation.x = -Math.PI / 2; rig.root.position.y = .22;
  var out = Object.assign({}, rig); out.root = w; out.kind = 'character'; out.lying = true;
  return out;
});`,
    doctor: `KIT.asset('doctor', function (K, opts) {
  var rig = K.human({ build: 'average', skin: K.PAL.skin[1], hair: K.PAL.hair[0], hairStyle: 'short', top: 'tee', shirt: 0x3e7f74, collar: 0x3e7f74, pants: 0x3e7f74, shoes: 0xd9d4c8, glasses: true });
  rig.kind = 'character'; return rig;
});`,
    nurse: `KIT.asset('nurse', function (K, opts) {
  var rig = K.human({ build: 'slim', skin: K.PAL.skin[2], hair: K.PAL.hair[1], hairStyle: 'bun', top: 'tee', shirt: 0x4a6f9a, collar: 0x4a6f9a, pants: 0x4a6f9a, shoes: 0xd9d4c8, lashes: true });
  rig.kind = 'character'; return rig;
});`,
    therm: `KIT.asset('therm', function (K, opts) {
  var root = new K.T.Group(), T = K.T;
  K.M(new T.BoxGeometry(.16, .14, .34), 0xd9d4c8, root, 0, .14, 0);
  var grip = K.M(new T.BoxGeometry(.12, .26, .12), 0x2c2b3a, root, 0, -.02, .08); grip.rotation.x = .25;
  K.M(new T.CylinderGeometry(.05, .06, .05, 18), 0x2c2b3a, root, 0, .14, -.19, 1, 1, 1, 'thin').rotation.x = Math.PI / 2;
  // the reading on the back screen: 7.0 °C
  var c = document.createElement('canvas'); c.width = 256; c.height = 128; var x = c.getContext('2d');
  x.fillStyle = '#0d2a2a'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#7ff0d8'; x.font = 'bold 78px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('7.0\\u00b0C', 128, 68);
  var tex = new T.CanvasTexture(c), scr = new T.Mesh(new T.PlaneGeometry(.14, .07), new T.MeshBasicMaterial({ map: tex }));
  scr.position.set(0, .17, .171); root.add(scr);
  K.glow(root, 0, .17, .2, .3, 0x7ff0d8, .35);
  var g = new T.Object3D(); g.position.set(0, -.04, .08); root.add(g);
  return { root: root, kind: 'prop', grip: g };
});`,
    mark: `KIT.asset('mark', function (K, opts) { var root = new K.T.Group(); var o = new K.T.Mesh(new K.T.BoxGeometry(.3, .3, .3), new K.T.MeshBasicMaterial({ visible: false })); root.add(o); return { root: root, kind: 'prop' } });`,
    clip: `KIT.asset('clip', function (K, opts) {
  var root = new K.T.Group(), T = K.T;
  K.M(new T.BoxGeometry(.36, .5, .02), 0x7a5232, root, 0, 0, 0);
  K.M(new T.BoxGeometry(.32, .42, .01), 0xeee6d6, root, 0, -.02, .016, 1, 1, 1, 'thin');
  for (var i = 0; i < 7; i++) K.M(new T.BoxGeometry(.22 - (i % 3) * .04, .012, .005), 0x6a6460, root, -.02, .12 - i * .045, .024, 1, 1, 1, false);
  K.M(new T.BoxGeometry(.14, .05, .03), 0xb8c0c4, root, 0, .24, .02, 1, 1, 1, 'thin');
  var g = new T.Object3D(); g.position.set(0, -.18, 0); root.add(g);
  return { root: root, kind: 'prop', grip: g };
});`
  },
  shots: {
    I01: `SHOT('I01', {
  set: 'snowbank', transition: 'cut', air: 'snow', music: 'tension',
  cast: { boy: { at: 'boy', turn: 90, face: 'sleepy' }, therm: { at: [.2, .55, 1.2] } },
  camera: { framing: 'close', on: 'therm', side: 'front', angle: 'eye', move: 'push-in' },
  light: 'cold',
  moves: [{ word: 'Seven', who: 'therm', do: 'react', type: 'twitch' }],
  sfx: [{ word: 'Seven', sound: 'tick' }],
  extra: function (t, A) { var L = A.set.lights; if (L) { var on = Math.floor(t * 3) % 2; L[0].material.opacity = on ? .6 : .15; L[1].material.opacity = on ? .15 : .6 } }
});`,
    I02: `SHOT('I02', {
  set: 'snowbank', transition: 'cut', air: 'snow', music: 'tension',
  cast: { medic: { at: 'medic', turn: -20, face: 'determined' }, boy: { at: 'boy', turn: 90, face: 'sleepy' }, therm: { at: [.3, 1, 0] } },
  camera: { framing: 'full', on: ['medic', 'boy'], side: 'front-right', angle: 'high', move: 'pull-out' },
  light: 'cold',
  moves: [{ sec: 0, who: 'medic', do: 'crouch', for: .4 }, { sec: 0, who: 'medic', do: 'hold', item: 'therm', hand: 'R' }, { word: 'boy', who: 'medic', do: 'look', to: 'boy' }],
  extra: function (t, A) { var L = A.set.lights; if (L) { var on = Math.floor(t * 3) % 2; L[0].material.opacity = on ? .6 : .15; L[1].material.opacity = on ? .15 : .6 } }
});`,
    I03: `SHOT('I03', {
  set: 'snowbank', air: 'snow', music: 'tension',
  cast: { medic: { at: 'medic', turn: -20, face: 'determined' }, boy: { at: 'boy', turn: 90, face: 'sleepy' }, mark: { at: 'boyhead' } },
  camera: { framing: 'full', on: ['mark', 'boy'], side: 'front', angle: 'high', move: 'push-in', distance: .8 },
  light: [{ mood: 'cold' }, { word: 'ice', mood: 'dark', ease: .8 }],
  moves: [{ sec: 0, who: 'medic', do: 'crouch', for: .3 }],
  extra: function (t, A) { var L = A.set.lights; if (L) { var on = Math.floor(t * 3) % 2; L[0].material.opacity = on ? .5 : .1; L[1].material.opacity = on ? .1 : .5 } }
});`,
    I04: `SHOT('I04', {
  set: 'snowbank', air: 'snow', music: 'tension',
  cast: { medic: { at: 'medic', turn: -20, face: 'determined' }, boy: { at: 'boy', turn: 90, face: 'sleepy' } },
  camera: { framing: 'full', on: ['medic', 'boy'], side: 'front-left', angle: 'high', move: 'push-in' },
  light: 'cold',
  moves: [{ sec: 0, who: 'medic', do: 'crouch', for: .3 }, { word: 'Limp', who: 'medic', do: 'reach', to: 'boy', for: 1.6 }, { word: 'pulse', who: 'medic', do: 'shake-head', for: .9 }, { word: 'pulse', who: 'medic', face: 'scared' }],
  sfx: [{ word: 'Limp', sound: 'heartbeat' }],
  extra: function (t, A) { var L = A.set.lights; if (L) { var on = Math.floor(t * 3) % 2; L[0].material.opacity = on ? .6 : .15; L[1].material.opacity = on ? .15 : .6 } }
});`,
    I05: `SHOT('I05', {
  set: 'underice', transition: 'cut', air: 'bubbles', ambience: 'underwater', music: 'mystery',
  cast: {},
  camera: { framing: 'wide', side: 'front', angle: 'low', move: 'crane-up' },
  light: 'silhouette', shafts: true,
  sfx: [{ word: 'pond', sound: 'bubble' }]
});`,
    I06: `SHOT('I06', {
  set: 'icu', transition: 'cut', ambience: 'room', music: 'hope',
  cast: { doctor: { at: 'doc1', turn: -40, face: 'neutral' }, clip: { at: [1.6, 1.5, 1.2] }, boy: { at: 'bed', turn: 90, face: 'sleepy' }, nurse: { at: 'doc2', turn: 40, face: 'neutral' } },
  camera: { framing: 'medium', on: 'doctor', side: 'front-right', move: 'drift' },
  light: 'warm',
  moves: [{ sec: 0, who: 'doctor', do: 'hold', item: 'clip', hand: 'R' }, { word: 'folklore', who: 'doctor', do: 'nod' }],
  extra: function (t, A) { var b = A.set.blip; if (b) { var p = (t % .9) / .9; b.scale.y = p < .12 ? 1.6 : .2; b.position.x = -2.65 + p * .7 } }
});`,
    I07: `SHOT('I07', {
  set: 'icu', ambience: 'room', music: 'hope',
  cast: { doctor: { at: 'doc1', turn: -40, face: 'neutral' }, clip: { at: [1.6, 1.5, 1.2] }, boy: { at: 'bed', turn: 90, face: 'sleepy' }, nurse: { at: 'doc2', turn: 40, face: 'neutral' } },
  camera: { framing: 'full', on: ['doctor', 'nurse'], side: 'front', move: 'push-in' },
  light: [{ mood: 'warm' }, { word: 'longest', mood: 'hope', ease: 1 }], shafts: true,
  moves: [{ sec: 0, who: 'doctor', do: 'hold', item: 'clip', hand: 'R' }, { word: 'authors', who: 'doctor', do: 'look', to: 'boy' }, { word: 'longest', who: 'nurse', do: 'look', to: 'boy' }, { word: 'survival', who: 'nurse', face: 'happy' }, { word: 'record', who: 'doctor', face: 'happy' }],
  extra: function (t, A) { var b = A.set.blip; if (b) { var p = (t % .9) / .9; b.scale.y = p < .12 ? 1.6 : .2; b.position.x = -2.65 + p * .7 } }
});`
  },
  cuts: [['I01', 0, 0], ['I02', 1, 2], ['I03', 3, 3], ['I04', 4, 4], ['I05', 5, 5], ['I06', 6, 6], ['I07', 7, 9]]
};
