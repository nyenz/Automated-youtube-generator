/* DEMO 2 — "The Missing Milk" (2:00 test video): kato, nia, farmer (pear), stranger (noodle), neighbour (hero), the worm, cups, flour and a milk puddle in the paper garden.
   Scenes flow as continuous takes and cut only when time or place changes. Shows hiding, peeking, sneaking, a worm pushing out of the soil, the talk spotlight and the soundtrack engine. */
window.DEMO2 = {
  title: "The Missing Milk",
  script: "Every night, Kato leaves a cup of warm milk in the garden. And every morning, the cup is empty. Tonight, he wants to know who is drinking it.\n\nHe asks Nia first. She says she saw the farmer walking through the garden after dark, carrying something round.\n\nThe farmer is not happy. He was only looking for his lost hat. And he points straight at the tall stranger, who moved in last week.\n\nThe stranger laughs. He hates milk. But the strong man next door drinks four cups a day, and he never buys any.\n\nThe strong man stamps his foot. Soon, everyone is shouting in the middle of the garden. Every single one of them is sure it was someone else.\n\nKato needs proof. Before bed, he sprinkles white flour all around the cup. In the morning, the milk is gone again. But there are no footprints. Only one thin, wavy line, leading back into the soil. Nobody in the garden walks like that.\n\nSo Kato makes a plan. He hides behind the bush, and he waits.\n\nMidnight. Nothing. One o'clock. Still nothing. Then the rain begins.\n\nThe grass starts to move. Something small, slow and very pink pushes out of the ground, and crawls straight into the cup.\n\nIt is a worm. When rain floods the soil, worms come up to the surface. Scientists think it helps them breathe and travel. And a warm cup is the driest bed in the whole garden.\n\nThe worm never drinks the milk. It tips the cup climbing in, and the dry soil soaks up every drop.\n\nIn the morning, Kato tells everyone. The farmer laughs. The stranger shakes his head. And the strong man says sorry.\n\nThe next night, Kato leaves two cups. One full of milk. And one lying on its side, just for his tiny guest.",
  plan: {
 "title": "The Missing Milk",
 "sky": "night",
 "assets": [
  {
   "name": "garden",
   "kind": "set",
   "difficulty": 2,
   "size": 16,
   "look": "Moonlit paper garden: layered ridges, coral and teal paper trees, a low teal bush to hide behind, tufts, rocks, big moon.",
   "parts": [],
   "moves": [],
   "spots": [
    "center",
    "left",
    "right",
    "far-left",
    "far-right",
    "cup",
    "cup2",
    "tree",
    "hide",
    "patch1",
    "patch2"
   ]
  },
  {
   "name": "farmer",
   "kind": "character",
   "difficulty": 2,
   "size": 2.4,
   "look": "Pear build, bald, moss tee, straw hat, big nose.",
   "parts": [
    "hat"
   ],
   "moves": []
  },
  {
   "name": "stranger",
   "kind": "character",
   "difficulty": 2,
   "size": 3.4,
   "look": "Noodle build: very tall and thin, long neck, charcoal tee, tall hair.",
   "parts": [],
   "moves": []
  },
  {
   "name": "neighbour",
   "kind": "character",
   "difficulty": 2,
   "size": 3,
   "look": "Hero build: giant chest, rust tee, short hair.",
   "parts": [],
   "moves": []
  },
  {
   "name": "worm",
   "kind": "creature",
   "difficulty": 3,
   "size": 1.2,
   "look": "Pink paper worm in round segments, big friendly face.",
   "parts": [
    "head",
    "neck"
   ],
   "moves": [
    "crawl"
   ]
  },
  {
   "name": "cup",
   "kind": "prop",
   "difficulty": 1,
   "size": 0.3,
   "look": "Cream mug with a teal band and handle.",
   "parts": [],
   "moves": [],
   "holdable": true
  },
  {
   "name": "flour",
   "kind": "prop",
   "difficulty": 1,
   "size": 1.3,
   "look": "A ring of white flour on the grass with one thin wavy groove leading to a small hole.",
   "parts": [],
   "moves": []
  },
  {
   "name": "puddle",
   "kind": "prop",
   "difficulty": 1,
   "size": 0.9,
   "look": "A flat splash of spilled milk.",
   "parts": [],
   "moves": []
  }
 ],
 "cuts": {
  "main": [
   {
    "id": "N01",
    "lines": [
     0,
     0
    ],
    "set": "garden",
    "cast": [
     "cup",
     "kato"
    ],
    "show": "Night: Kato walks in and sets a cup of warm milk on the grass.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N02",
    "lines": [
     1,
     1
    ],
    "set": "garden",
    "cast": [
     "cup"
    ],
    "show": "Morning light: the cup is empty.",
    "mood": "warm",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N03",
    "lines": [
     2,
     2
    ],
    "set": "garden",
    "cast": [
     "cup",
     "kato"
    ],
    "show": "Kato stares at the cup, determined.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N04",
    "lines": [
     3,
     3
    ],
    "set": "garden",
    "cast": [
     "kato",
     "nia"
    ],
    "show": "Kato walks over to Nia.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N05",
    "lines": [
     4,
     5
    ],
    "set": "garden",
    "cast": [
     "nia",
     "kato"
    ],
    "show": "Nia tells him she saw the farmer, pointing his way. Kato listens.",
    "mood": "normal",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N06",
    "lines": [
     6,
     6
    ],
    "set": "garden",
    "cast": [
     "farmer"
    ],
    "show": "The camera glides to the grumpy farmer.",
    "mood": "normal",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N07",
    "lines": [
     7,
     7
    ],
    "set": "garden",
    "cast": [
     "farmer"
    ],
    "show": "The farmer explains about his lost hat.",
    "mood": "normal",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N08",
    "lines": [
     8,
     9
    ],
    "set": "garden",
    "cast": [
     "farmer",
     "stranger"
    ],
    "show": "The farmer points at the tall stranger.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N09",
    "lines": [
     10,
     11
    ],
    "set": "garden",
    "cast": [
     "stranger"
    ],
    "show": "The stranger laughs and shakes his head.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N10",
    "lines": [
     12,
     13
    ],
    "set": "garden",
    "cast": [
     "stranger",
     "neighbour"
    ],
    "show": "The stranger points at the strong neighbour.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N11",
    "lines": [
     14,
     14
    ],
    "set": "garden",
    "cast": [
     "neighbour"
    ],
    "show": "The neighbour stamps his foot.",
    "mood": "danger",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N12",
    "lines": [
     15,
     16
    ],
    "set": "garden",
    "cast": [
     "neighbour",
     "kato",
     "nia",
     "farmer",
     "stranger"
    ],
    "show": "Wide: everyone argues.",
    "mood": "danger",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N13",
    "lines": [
     17,
     17
    ],
    "set": "garden",
    "cast": [
     "kato"
    ],
    "show": "Kato needs proof.",
    "mood": "dark",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N14",
    "lines": [
     18,
     18
    ],
    "set": "garden",
    "cast": [
     "kato",
     "cup",
     "flour"
    ],
    "show": "Before bed, Kato sprinkles flour around the cup.",
    "mood": "dark",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N15",
    "lines": [
     19,
     19
    ],
    "set": "garden",
    "cast": [
     "cup",
     "flour",
     "kato"
    ],
    "show": "Morning: the milk is gone again.",
    "mood": "warm",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N16",
    "lines": [
     20,
     22
    ],
    "set": "garden",
    "cast": [
     "flour",
     "cup"
    ],
    "show": "Top view: no footprints, only a thin wavy line leading into the soil.",
    "mood": "warm",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N17",
    "lines": [
     23,
     23
    ],
    "set": "garden",
    "cast": [
     "kato",
     "flour",
     "cup"
    ],
    "show": "Kato crouches by the trail and shakes his head.",
    "mood": "warm",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N18",
    "lines": [
     24,
     24
    ],
    "set": "garden",
    "cast": [
     "kato"
    ],
    "show": "Night. Kato makes a plan.",
    "mood": "dark",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N19",
    "lines": [
     25,
     26
    ],
    "set": "garden",
    "cast": [
     "kato",
     "cup"
    ],
    "show": "Kato sneaks behind the bush and hides.",
    "mood": "dark",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N20",
    "lines": [
     27,
     30
    ],
    "set": "garden",
    "cast": [
     "kato",
     "cup"
    ],
    "show": "From the cup: Kato peeks over the bush; time passes, he gets sleepy.",
    "mood": "dark",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N21",
    "lines": [
     31,
     31
    ],
    "set": "garden",
    "cast": [
     "kato",
     "cup"
    ],
    "show": "Rain starts; Kato wakes up and shivers behind the bush.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N22",
    "lines": [
     32,
     34
    ],
    "set": "garden",
    "cast": [
     "cup",
     "flour",
     "worm"
    ],
    "show": "The soil by the cup bulges; a pink worm pushes out of the ground and crawls into the cup.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N23",
    "lines": [
     35,
     35
    ],
    "set": "garden",
    "cast": [
     "kato"
    ],
    "show": "Behind the bush, Kato peeks out, shocked.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N24",
    "lines": [
     36,
     38
    ],
    "set": "garden",
    "cast": [
     "worm",
     "cup"
    ],
    "show": "More worms push up out of the wet soil and crawl.",
    "mood": "cold",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N25",
    "lines": [
     39,
     39
    ],
    "set": "garden",
    "cast": [
     "cup",
     "worm"
    ],
    "show": "The worm sleeps, dry and warm, in the cup.",
    "mood": "hope",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N26",
    "lines": [
     40,
     42
    ],
    "set": "garden",
    "cast": [
     "cup",
     "worm",
     "puddle"
    ],
    "show": "Flashback: the worm tips the cup climbing in; the milk spills and soaks into the soil.",
    "mood": "flashback",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N27",
    "lines": [
     43,
     43
    ],
    "set": "garden",
    "cast": [
     "kato",
     "nia",
     "farmer",
     "stranger",
     "neighbour",
     "cup"
    ],
    "show": "Morning: Kato tells everyone what he saw.",
    "mood": "warm",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N28",
    "lines": [
     44,
     44
    ],
    "set": "garden",
    "cast": [
     "farmer",
     "kato"
    ],
    "show": "The farmer laughs.",
    "mood": "warm",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N29",
    "lines": [
     45,
     45
    ],
    "set": "garden",
    "cast": [
     "stranger"
    ],
    "show": "The stranger shakes his head, smiling.",
    "mood": "warm",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N30",
    "lines": [
     46,
     46
    ],
    "set": "garden",
    "cast": [
     "neighbour",
     "kato"
    ],
    "show": "The strong man says sorry.",
    "mood": "warm",
    "difficulty": 2,
    "transition": "flow"
   },
   {
    "id": "N31",
    "lines": [
     47,
     48
    ],
    "set": "garden",
    "cast": [
     "kato",
     "cup",
     "cup2"
    ],
    "show": "Next night: Kato sets out two cups, one on its side.",
    "mood": "warm",
    "difficulty": 2,
    "transition": "cut"
   },
   {
    "id": "N32",
    "lines": [
     49,
     50
    ],
    "set": "garden",
    "cast": [
     "kato",
     "cup",
     "cup2",
     "worm"
    ],
    "show": "The worm peeks out of its own cup; Kato waves.",
    "mood": "hope",
    "difficulty": 2,
    "transition": "flow"
   }
  ]
 }
},
  assets: {
 "garden": "KIT.asset('garden', function (K, opts) {\n  var root = new K.T.Group(), D = K.PAL.dio;\n  K.ground(root, { radius: 18 });\n  K.ridges(root, { z: -9 });\n  K.moon(root, 1.5, 6.5, -24, 2.6);\n  K.paperTree(root, -4.6, -2.6, { scale: 1.25 });\n  K.paperTree(root, 4.6, -3.4, { scale: 1.4, flip: true, leaves: [D.teal, D.tealDark] });\n  K.paperTree(root, -8, -5, { scale: 1.6 });\n  [[-6, -9, 1.2], [-1, -10, 1], [4, -10, 1.1]].forEach(function (c) { K.cloudSwirl(root, c[0], c[1] + 16, c[1], c[2]); });\n  for (var i = 0; i < 40; i++) { var x = (K.rnd() - .5) * 16, z = (K.rnd() - .5) * 9 - 2; if (Math.abs(x) < 4 && z > -1.5) continue; K.tuft(root, x, z, .8 + K.rnd() * .6, [D.coral, D.teal, D.salmon][i % 3]); }\n  K.tuft(root, 1.1, 1.7, .6, D.teal); K.tuft(root, .0, 1.9, .5, D.coral);\n  K.rock(root, 2.8, 1.8, 1.2); K.rock(root, -3, 2.2, 1); K.rock(root, -4.2, -1.6, .8);\n  // a low bush to hide behind\n  [[-.55, .55, 0, .62], [0, .75, .05, .78], [.6, .58, -.02, .6], [-.25, .95, -.1, .5], [.3, 1.0, -.08, .5]].forEach(function (b, i) { K.M(K.SPH, [D.tealDark, D.teal][i % 2], root, -3.3 + b[0], b[1], -1.05 + b[2], b[3], b[3] * .85, b[3] * .7); });\n  K.tuft(root, -3.9, -.8, .9, D.teal); K.tuft(root, -2.7, -.85, .8, D.coral);\n  var V = function (x, z) { return new K.T.Vector3(x, 0, z); };\n  return { root: root, kind: 'set', spots: { center: V(0, 0), left: V(-1.8, .4), right: V(1.8, .4), 'far-left': V(-3.4, -.2), 'far-right': V(3.4, -.2),\n    cup: V(.4, 1.4), cup2: V(1.1, 1.55), tree: V(-3.8, -1.4), hide: V(-3.35, -1.95), patch1: V(1.5, 1.1), patch2: V(-.5, 2.0) } };\n});",
 "farmer": "KIT.asset('farmer', function (K, opts) {\n  var rig = K.human({ build: 'pear', skin: K.PAL.skin[2], hair: K.PAL.hair[2], hairStyle: 'bald', top: 'tee', shirt: K.PAL.moss, pants: K.PAL.brown, nose: 1.4 });\n  var hat = new K.T.Group(); hat.position.set(0, .84, -.02); rig.head.add(hat);\n  K.M(new K.T.CylinderGeometry(.62, .62, .03, 32), K.PAL.mustard, hat, 0, 0, 0);\n  K.M(K.SPH, K.PAL.mustard, hat, 0, .08, 0, .34, .2, .34);\n  K.M(new K.T.TorusGeometry(.35, .025, 8, 28), K.PAL.rust, hat, 0, .04, 0, 1, 1, 1, 'thin').rotation.x = Math.PI / 2;\n  rig.hat = hat; rig.kind = 'character';\n  return rig;\n});",
 "stranger": "KIT.asset('stranger', function (K, opts) {\n  var rig = K.human({ build: 'noodle', skin: K.PAL.skin[0], hair: K.PAL.hair[1], hairStyle: 'tall', top: 'tee', shirt: K.PAL.charcoal, pants: K.PAL.ink, nose: 1.3 });\n  rig.kind = 'character';\n  return rig;\n});",
 "neighbour": "KIT.asset('neighbour', function (K, opts) {\n  var rig = K.human({ build: 'hero', skin: K.PAL.skin[3], hair: K.PAL.hair[0], hairStyle: 'short', top: 'tee', shirt: K.PAL.rust, pants: K.PAL.charcoal, nose: 1.1 });\n  rig.kind = 'character';\n  return rig;\n});",
 "worm": "KIT.asset('worm', function (K, opts) {\n  var root = new K.T.Group(), body = new K.T.Group(); root.add(body);\n  var segs = [];\n  for (var i = 0; i < 11; i++) {\n    var r = .15 * (1 - .45 * i / 11), g = new K.T.Group(); g.position.set(0, r, -i * .11); body.add(g);\n    K.M(K.SPH, i % 2 ? 0x9c5060 : 0xb8646e, g, 0, 0, 0, r, r * .92, r * 1.12); segs.push(g);\n  }\n  var neck = new K.T.Group(); neck.position.set(0, .3, .16); body.add(neck);\n  var head = new K.T.Group(); head.scale.setScalar(.7); head.position.y = -.31; neck.add(head);\n  K.M(K.SPH, 0xb8646e, head, 0, .44, 0, .36, .41, .36);\n  var face = K.face(head, { r: .36, cy: .44, y: .5, gap: .14, size: 1.3, mouthY: .25 });\n  function crawl(t) { segs.forEach(function (g, i) { var r = .15 * (1 - .45 * i / 11); g.position.y = r + .08 * Math.pow(Math.max(0, Math.sin(t * 6.5 - i * .75)), 2); }); }\n  return { root: root, kind: 'creature', body: body, segs: segs, neck: neck, head: head, face: face,\n    do: { crawl: function (k, t) { crawl(t); } },\n    idle: function (t) { neck.rotation.x = Math.sin(t * 1.5) * .08; } };\n});",
 "cup": "KIT.asset('cup', function (K, opts) {\n  var root = new K.T.Group();\n  K.M(K.lathe([[0, 0], [.13, 0], [.14, .03], [.15, .26], [.13, .26], [.12, .04], [0, .04]]), K.PAL.cream, root, 0, 0, 0);\n  K.M(new K.T.CylinderGeometry(.152, .152, .05, 32, 1, true), K.PAL.teal, root, 0, .17, 0, 1, 1, 1, 'thin');\n  var h = K.M(new K.T.TorusGeometry(.07, .022, 8, 20), K.PAL.cream, root, .17, .14, 0, 1, 1, 1, 'thin');\n  var grip = new K.T.Object3D(); grip.position.set(.2, .14, 0); root.add(grip);\n  return { root: root, kind: 'prop', grip: grip, handle: h };\n});",
 "flour": "KIT.asset('flour', function (K, opts) {\n  var root = new K.T.Group(), W = 0xcfc6b6, S = 0x24181c;\n  // a ring of white flour around the cup\n  for (var i = 0; i < 140; i++) { var a = K.rnd() * Math.PI * 2, r = .26 + K.rnd() * .3, s = .04 + K.rnd() * .05;\n    K.M(K.SPH, W, root, Math.cos(a) * r, .008, Math.sin(a) * r, s * 1.4, .01, s); }\n  // one thin wavy groove through the flour, ending in a small hole in the soil\n  var dx = .55, dz = .35, L = Math.sqrt(dx * dx + dz * dz), ux = dx / L, uz = dz / L;\n  for (var j = 0; j <= 26; j++) { var u = j / 26, w = Math.sin(u * Math.PI * 4) * .06, x = ux * (.12 + u * (L - .12)) - uz * w, z = uz * (.12 + u * (L - .12)) + ux * w;\n    K.M(K.SPH, S, root, x, .022, z, .045, .01, .045); }\n  K.M(K.SPH, 0x1c1418, root, dx, .012, dz, .09, .01, .08);\n  return { root: root, kind: 'prop' };\n});",
 "puddle": "KIT.asset('puddle', function (K, opts) {\n  var root = new K.T.Group();\n  K.M(K.SPH, 0xf3ead6, root, 0, .006, 0, .42, .008, .26);\n  K.M(K.SPH, 0xf3ead6, root, .3, .006, .12, .18, .008, .12);\n  K.M(K.SPH, 0xe6dcc4, root, -.25, .007, -.08, .14, .008, .1);\n  return { root: root, kind: 'prop' };\n});"
},
  shots: {
 "N01": "SHOT('N01', {\n  set: 'garden', transition: 'cut', air: 'dust', music: 'playful',\n  cast: { kato: { at: 'far-left', turn: 'right', face: 'happy' }, cup: { at: 'cup' } },\n  camera: { framing: 'wide', angle: 'high', move: 'crane-down', height: -.8 },\n  light: 'cold',\n  moves: [\n    { sec: 0, who: 'kato', do: 'walk', to: [-.4, 0, 1.2], for: 2.6 },\n    { word: 'cup', who: 'kato', do: 'reach', to: 'cup', for: .9 },\n    { word: 'cup', who: 'cup', do: 'appear', for: .4 },\n    { word: 'garden', who: 'kato', do: 'turn', to: 'camera', for: .4 }\n  ],\n  sfx: [{ word: 'cup', sound: 'clink' }]\n});",
 "N02": "SHOT('N02', {\n  set: 'garden', transition: 'cut', air: 'dust', music: 'playful',\n  cast: { cup: { at: 'cup', turn: 20 } },\n  camera: { framing: 'full', on: 'cup', side: 'front-right', angle: 'high', move: 'push-in' },\n  light: 'warm',\n  moves: [{ word: 'empty', who: 'cup', do: 'react', type: 'twitch' }],\n  sfx: [{ word: 'empty', sound: 'tick' }]\n});",
 "N03": "SHOT('N03', {\n  set: 'garden', transition: 'cut', music: 'playful',\n  cast: { kato: { at: [-.4, 0, 1.2], turn: 60, face: 'determined' }, cup: { at: 'cup' } },\n  camera: { framing: 'medium', on: 'kato', side: 'front-left', move: 'push-in' },\n  light: 'cold',\n  moves: [{ word: 'know', who: 'kato', do: 'look', to: 'cup' }, { word: 'drinking', who: 'kato', do: 'nod' }]\n});",
 "N04": "SHOT('N04', {\n  set: 'garden', music: 'playful',\n  cast: { kato: { at: [-.4, 0, 1.2], face: 'neutral' }, nia: { at: 'right', turn: -40, face: 'neutral' } },\n  camera: { framing: 'full', on: ['nia', 'kato'], side: 'front', move: 'drift' },\n  light: 'cold',\n  moves: [\n    { sec: 0, who: 'kato', do: 'walk', to: [.6, 0, .75], for: 1.3 },\n    { word: 'Nia', who: 'nia', do: 'turn', to: 'kato', for: .5 },\n    { word: 'first', who: 'kato', do: 'talk', for: .8 }\n  ]\n});",
 "N05": "SHOT('N05', {\n  set: 'garden', music: 'playful',\n  cast: { nia: { at: 'right', turn: -60, face: 'sneaky' }, kato: { at: [.6, 0, .75], turn: 70 } },\n  camera: { framing: 'medium', on: 'nia', side: 'front-left', move: 'push-in' },\n  light: 'normal',\n  moves: [\n    { sec: 0, who: 'nia', do: 'talk', for: 3.6 },\n    { word: 'farmer', who: 'nia', do: 'point', to: 'far-left', for: 2 },\n    { word: 'round', who: 'nia', face: 'surprised' }, { word: 'round', who: 'kato', face: 'surprised' }\n  ]\n});",
 "N06": "SHOT('N06', {\n  set: 'garden',\n  cast: { farmer: { at: 'far-left', turn: 35, face: 'annoyed' } },\n  camera: { framing: 'medium', on: 'farmer', side: 'front-left', move: 'drift' },\n  light: 'normal',\n  moves: [{ word: 'happy', who: 'farmer', do: 'shake-head' }, { word: 'not', who: 'farmer', do: 'react', type: 'take' }]\n});",
 "N07": "SHOT('N07', {\n  set: 'garden',\n  cast: { farmer: { at: 'far-left', turn: 35, face: 'annoyed' } },\n  camera: { framing: 'close', on: 'farmer', side: 'front-right', move: 'push-in' },\n  light: 'normal',\n  moves: [{ sec: 0, who: 'farmer', do: 'talk', for: 2.4 }, { word: 'hat', who: 'farmer', do: 'nod' }]\n});",
 "N08": "SHOT('N08', {\n  set: 'garden', music: 'mystery',\n  cast: { farmer: { at: 'far-left', turn: 35, face: 'determined' }, stranger: { at: 'far-right', turn: -50, face: 'neutral' } },\n  camera: { framing: 'full', on: 'stranger', side: 'front-left', angle: 'low', move: 'drift' },\n  light: 'cold',\n  moves: [\n    { word: 'points', who: 'farmer', do: 'point', to: 'stranger', for: 2.2 },\n    { word: 'stranger', who: 'stranger', do: 'turn', to: 'farmer', for: .6 },\n    { word: 'week', who: 'stranger', face: 'sneaky' }\n  ],\n  sfx: [{ word: 'stranger', sound: 'sting' }]\n});",
 "N09": "SHOT('N09', {\n  set: 'garden', music: 'mystery',\n  cast: { stranger: { at: 'far-right', turn: -50, face: 'happy' } },\n  camera: { framing: 'medium', on: 'stranger', side: 'front-right', angle: 'low', move: 'drift' },\n  light: 'cold',\n  moves: [\n    { word: 'laughs', who: 'stranger', do: 'cheer', for: 1 },\n    { word: 'hates', who: 'stranger', face: 'annoyed' },\n    { word: 'milk', who: 'stranger', do: 'shake-head' }\n  ]\n});",
 "N10": "SHOT('N10', {\n  set: 'garden', music: 'mystery',\n  cast: { stranger: { at: 'far-right', turn: -50, face: 'sneaky' }, neighbour: { at: 'left', turn: 50, face: 'neutral' } },\n  camera: { framing: 'full', on: 'neighbour', side: 'front-right', move: 'push-in' },\n  light: 'cold',\n  moves: [\n    { sec: 0, who: 'stranger', do: 'talk', for: 3.8 },\n    { word: 'strong', who: 'stranger', do: 'point', to: 'neighbour', for: 2.4 },\n    { word: 'four', who: 'neighbour', do: 'turn', to: 'stranger', for: .6 },\n    { word: 'never', who: 'neighbour', face: 'surprised' }\n  ]\n});",
 "N11": "SHOT('N11', {\n  set: 'garden', music: 'tension',\n  cast: { neighbour: { at: 'left', turn: 50, face: 'annoyed' } },\n  camera: { framing: 'full', on: 'neighbour', side: 'front', angle: 'low', move: 'static', shake: [{ word: 'foot', amount: .05 }] },\n  light: 'danger',\n  moves: [{ word: 'stamps', who: 'neighbour', do: 'stomp', for: .7 }]\n});",
 "N12": "SHOT('N12', {\n  set: 'garden', music: 'tension', spotlight: false,\n  cast: {\n    neighbour: { at: 'left', turn: 30, face: 'annoyed' }, kato: { at: 'center', turn: 0, face: 'annoyed' },\n    nia: { at: 'right', turn: -20, face: 'annoyed' }, farmer: { at: 'far-left', turn: 35, face: 'annoyed' },\n    stranger: { at: 'far-right', turn: -40, face: 'determined' }\n  },\n  camera: { framing: 'wide', side: 'front', move: 'orbit-left' },\n  light: 'danger',\n  moves: [\n    { sec: 0, who: 'kato', do: 'talk', for: 3 }, { sec: .3, who: 'nia', do: 'talk', for: 3 }, { sec: .6, who: 'neighbour', do: 'talk', for: 2.5 },\n    { sec: 0, who: 'farmer', do: 'shake-head', for: 1.2 }, { word: 'garden', who: 'neighbour', do: 'wave', for: 1.4 },\n    { word: 'single', who: 'stranger', do: 'point', to: 'farmer', for: 2 }, { word: 'single', who: 'farmer', do: 'point', to: 'stranger', for: 2 },\n    { word: 'someone', who: 'kato', do: 'shake' }\n  ],\n  sfx: [{ word: 'shouting', sound: 'boom' }]\n});",
 "N13": "SHOT('N13', {\n  set: 'garden', transition: 'cut', music: 'mystery',\n  cast: { kato: { at: [-.4, 0, .9], turn: 30, face: 'determined' }, cup: { at: 'cup' } },\n  camera: { framing: 'close', on: 'kato', side: 'front-left', move: 'push-in' },\n  light: 'dark',\n  moves: [{ word: 'proof', who: 'kato', do: 'look', to: 'cup' }]\n});",
 "N14": "SHOT('N14', {\n  set: 'garden', music: 'mystery',\n  cast: { kato: { at: [-.4, 0, .9], turn: 30, face: 'sneaky' }, cup: { at: 'cup' }, flour: { at: 'cup' } },\n  camera: { framing: 'full', on: ['kato', 'cup'], side: 'front-right', angle: 'high', move: 'drift' },\n  light: 'dark',\n  moves: [\n    { word: 'sprinkles', who: 'kato', do: 'crouch', for: 2.6 },\n    { word: 'sprinkles', who: 'kato', do: 'reach', to: 'cup', for: 2.4 },\n    { word: 'flour', who: 'flour', do: 'appear', for: 1.6 }\n  ],\n  sfx: [{ word: 'flour', sound: 'poof' }, { word: 'around', sound: 'rustle', length: .9 }]\n});",
 "N15": "SHOT('N15', {\n  set: 'garden', transition: 'cut', air: 'dust', music: 'mystery',\n  cast: { cup: { at: 'cup' }, flour: { at: 'cup' }, kato: { at: 'left', turn: 50, face: 'neutral' } },\n  camera: { framing: 'full', on: ['kato', 'cup'], side: 'front-right', move: 'drift' },\n  light: 'warm',\n  moves: [\n    { sec: 0, who: 'kato', do: 'walk', to: [-.5, 0, .85], for: 1.6 },\n    { word: 'gone', who: 'kato', do: 'look', to: 'cup' }, { word: 'again', who: 'kato', face: 'surprised' }\n  ]\n});",
 "N16": "SHOT('N16', {\n  set: 'garden', music: 'mystery',\n  cast: { cup: { at: 'cup' }, flour: { at: 'cup' } },\n  camera: { framing: 'full', on: 'flour', angle: 'top', move: 'push-in' },\n  light: 'warm',\n  sfx: [{ word: 'wavy', sound: 'riser', length: 1.6 }, { word: 'soil', sound: 'sting' }]\n});",
 "N17": "SHOT('N17', {\n  set: 'garden', music: 'mystery',\n  cast: { kato: { at: [-.5, 0, .85], turn: 50, face: 'sneaky' }, cup: { at: 'cup' }, flour: { at: 'cup' } },\n  camera: { framing: 'medium', on: 'kato', side: 'front-right', move: 'drift' },\n  light: 'warm',\n  moves: [{ sec: 0, who: 'kato', do: 'crouch', for: 2.6 }, { word: 'walks', who: 'kato', do: 'shake-head' }, { word: 'that', who: 'kato', do: 'look', to: 'camera' }]\n});",
 "N18": "SHOT('N18', {\n  set: 'garden', transition: 'cut', music: 'mystery',\n  cast: { kato: { at: 'center', turn: 20, face: 'determined' }, cup: { at: 'cup' }, flour: { at: 'cup' } },\n  camera: { framing: 'medium', on: 'kato', side: 'front-left', move: 'push-in' },\n  light: 'dark',\n  moves: [{ word: 'plan', who: 'kato', do: 'nod' }]\n});",
 "N19": "SHOT('N19', {\n  set: 'garden', music: 'mystery',\n  cast: { kato: { at: 'center', face: 'sneaky' }, cup: { at: 'cup' }, flour: { at: 'cup' } },\n  camera: { framing: 'full', on: 'kato', side: 'front-left', move: 'drift' },\n  light: 'dark',\n  moves: [\n    { sec: 0, who: 'kato', do: 'sneak', to: 'hide', for: 2.4 },\n    { word: 'waits', who: 'kato', do: 'turn', to: 'cup', for: .5 },\n    { word: 'waits', who: 'kato', do: 'hide', to: 'cup', side: 'left', for: 9 }\n  ]\n});",
 "N20": "SHOT('N20', {\n  set: 'garden', music: 'mystery',\n  cast: { kato: { at: 'hide', turn: 'cup', face: 'neutral', look: 'cup' }, cup: { at: 'cup' }, flour: { at: 'cup' } },\n  camera: { framing: 'full', on: 'kato', side: 'front', move: 'push-in', height: -.3 },\n  focus: [{ on: 'kato' }],\n  light: 'dark',\n  moves: [\n    { sec: 0, who: 'kato', do: 'hide', to: 'cup', side: 'left', for: 4.5 },\n    { word: 'nothing', who: 'kato', face: 'sleepy' },\n    { word: 'one', who: 'kato', do: 'yawn', for: 1.2 },\n    { word: 'still', who: 'kato', do: 'sleep', for: 1.6 }\n  ],\n  sfx: [{ word: 'midnight', sound: 'bell' }, { word: 'one', sound: 'bell' }]\n});",
 "N21": "SHOT('N21', {\n  set: 'garden', air: 'rain', music: 'tension',\n  cast: { kato: { at: 'hide', turn: 'cup', face: 'surprised', look: 'cup' }, cup: { at: 'cup' }, flour: { at: 'cup' } },\n  camera: { framing: 'wide', side: 'front', angle: 'high', move: 'drift', height: -.6 },\n  light: [{ mood: 'dark' }, { word: 'rain', mood: 'cold', ease: 1 }],\n  moves: [{ sec: 0, who: 'kato', do: 'crouch', for: 3 }, { word: 'rain', who: 'kato', do: 'shiver', for: 1.6 }]\n});",
 "N22": "SHOT('N22', {\n  set: 'garden', transition: 'cut', air: 'rain', music: 'tension',\n  cast: { cup: { at: 'cup' }, flour: { at: 'cup' }, worm: { at: [.95, 0, 1.75], size: .4, turn: -120, face: 'neutral' } },\n  camera: { framing: 'medium', on: ['cup', 'worm'], side: 'front-right', angle: 'low', move: 'push-in' },\n  focus: [{ on: 'worm' }],\n  light: [{ mood: 'silhouette' }, { word: 'pink', mood: 'cold', ease: .8 }],\n  moves: [\n    { word: 'move', who: 'worm', do: 'emerge', for: 4.2 },\n    { word: 'pink', who: 'worm', face: 'happy' },\n    { word: 'crawls', who: 'worm', do: 'move', to: [.45, .2, 1.4], arc: .25, for: 1.8 },\n    { word: 'crawls', who: 'worm', do: 'crawl', for: 1.8 }\n  ],\n  sfx: [{ word: 'grass', sound: 'rustle', length: 1.2 }, { word: 'cup', sound: 'clink' }]\n});",
 "N23": "SHOT('N23', {\n  set: 'garden', transition: 'cut', air: 'rain', music: 'hope',\n  cast: { kato: { at: 'hide', turn: 'cup', face: 'surprised', look: 'cup' }, cup: { at: 'cup' } },\n  camera: { framing: 'medium', on: 'kato', side: 'right', move: 'push-in' },\n  light: 'cold',\n  moves: [{ sec: 0, who: 'kato', do: 'crouch', for: 2 }, { sec: .1, who: 'kato', do: 'peek', to: 'cup', side: 'left', for: 1.6 }, { word: 'worm', who: 'kato', do: 'react', type: 'take' }],\n  sfx: [{ word: 'worm', sound: 'sting' }]\n});",
 "N24": "SHOT('N24', {\n  set: 'garden', transition: 'cut', air: 'rain', music: 'hope',\n  cast: {\n    worm2: { asset: 'worm', at: 'patch1', size: .5, turn: 40 }, worm3: { asset: 'worm', at: 'patch2', size: .45, turn: -30 },\n    cup: { at: 'cup' }\n  },\n  camera: { framing: 'full', on: ['worm2', 'worm3'], side: 'front', angle: 'high', move: 'crane-down' },\n  light: 'cold',\n  moves: [\n    { word: 'floods', who: 'worm2', do: 'emerge', for: 1.8 }, { word: 'surface', who: 'worm3', do: 'emerge', for: 1.6 },\n    { word: 'breathe', who: 'worm2', do: 'move', to: [2.1, 0, 1.6], for: 2.6 }, { word: 'breathe', who: 'worm2', do: 'crawl', for: 2.6 },\n    { word: 'travel', who: 'worm3', do: 'move', to: [-1.1, 0, 2.3], for: 1.8 }, { word: 'travel', who: 'worm3', do: 'crawl', for: 1.8 }\n  ]\n});",
 "N25": "SHOT('N25', {\n  set: 'garden', transition: 'cut', music: 'hope',\n  cast: { cup: { at: 'cup' }, worm: { at: [.45, .2, 1.4], size: .4, turn: 20, face: 'happy', look: 'camera' } },\n  camera: { framing: 'medium', on: ['cup', 'worm'], side: 'front', move: 'pull-out' },\n  light: 'hope', shafts: true, ambience: 'night',\n  moves: [{ word: 'driest', who: 'worm', do: 'sleep', for: 2.4 }],\n  sfx: [{ word: 'bed', sound: 'snore', length: 1.6 }]\n});",
 "N26": "SHOT('N26', {\n  set: 'garden', transition: 'cut', music: 'flashback',\n  cast: { cup: { at: 'cup', turn: 90 }, worm: { at: [.95, 0, 1.75], size: .4, turn: -120, face: 'happy' }, puddle: { at: [.55, .01, 1.75] } },\n  camera: { framing: 'full', on: ['cup', 'worm'], side: 'front-left', angle: 'high', move: 'drift' },\n  light: 'flashback',\n  moves: [\n    { word: 'never', who: 'worm', do: 'shake-head' },\n    { word: 'tips', who: 'worm', do: 'move', to: [.6, .05, 1.55], for: 1.2 }, { word: 'tips', who: 'worm', do: 'crawl', for: 1.2 },\n    { word: 'climbing', who: 'cup', do: 'fall', for: .5 },\n    { word: 'climbing', who: 'puddle', do: 'appear', for: 1 },\n    { word: 'soaks', who: 'puddle', do: 'vanish', for: 2 }\n  ],\n  sfx: [{ word: 'climbing', sound: 'splash' }]\n});",
 "N27": "SHOT('N27', {\n  set: 'garden', transition: 'cut', air: 'dust', music: 'playful',\n  cast: {\n    kato: { at: [-.3, 0, .8], turn: 0, face: 'happy' }, nia: { at: 'right', turn: -40, face: 'neutral' }, farmer: { at: 'left', turn: 40, face: 'neutral' },\n    stranger: { at: 'far-right', turn: -50, face: 'neutral' }, neighbour: { at: 'far-left', turn: 45, face: 'neutral' }, cup: { at: 'cup' }\n  },\n  camera: { framing: 'wide', side: 'front', move: 'push-in' },\n  light: 'warm',\n  moves: [{ sec: 0, who: 'kato', do: 'talk', for: 2.6 }, { word: 'everyone', who: 'kato', do: 'point', to: 'cup', for: 1.4 }]\n});",
 "N28": "SHOT('N28', {\n  set: 'garden', music: 'playful',\n  cast: { farmer: { at: 'left', turn: 40, face: 'happy' }, kato: { at: [-.3, 0, .8], turn: -20, face: 'happy' } },\n  camera: { framing: 'medium', on: 'farmer', side: 'front-right', move: 'drift' },\n  light: 'warm',\n  moves: [{ sec: 0, who: 'farmer', do: 'cheer', for: 1.3 }]\n});",
 "N29": "SHOT('N29', {\n  set: 'garden', music: 'playful',\n  cast: { stranger: { at: 'far-right', turn: -50, face: 'happy' } },\n  camera: { framing: 'medium', on: 'stranger', side: 'front-left', move: 'drift' },\n  light: 'warm',\n  moves: [{ sec: 0, who: 'stranger', do: 'shake-head', for: 1.6 }]\n});",
 "N30": "SHOT('N30', {\n  set: 'garden', music: 'playful',\n  cast: { neighbour: { at: 'far-left', turn: 45, face: 'sleepy' }, kato: { at: [-.3, 0, .8], turn: -50, face: 'happy' } },\n  camera: { framing: 'full', on: 'neighbour', side: 'front-right', move: 'push-in' },\n  light: 'warm',\n  moves: [{ sec: 0, who: 'neighbour', do: 'talk', for: 2 }, { word: 'sorry', who: 'neighbour', do: 'nod', for: 1 }, { word: 'sorry', who: 'kato', do: 'nod' }]\n});",
 "N31": "SHOT('N31', {\n  set: 'garden', transition: 'cut', air: 'dust', music: 'hope',\n  cast: { kato: { at: [-.5, 0, .9], turn: 40, face: 'happy' }, cup: { at: 'cup' }, cup2: { asset: 'cup', at: 'cup2', tilt: 90, turn: -30 } },\n  camera: { framing: 'full', on: 'kato', side: 'front-right', move: 'drift' },\n  light: 'warm', ambience: 'night',\n  moves: [\n    { word: 'two', who: 'kato', do: 'point', to: 'cup2', for: 1.6 },\n    { word: 'milk', who: 'cup', do: 'react', type: 'twitch' }\n  ],\n  sfx: [{ word: 'cups', sound: 'clink' }]\n});",
 "N32": "SHOT('N32', {\n  set: 'garden', music: 'hope',\n  cast: { kato: { at: [-.5, 0, .9], turn: 40, face: 'happy' }, cup: { at: 'cup' }, cup2: { asset: 'cup', at: 'cup2', tilt: 90, turn: -30 },\n    worm: { at: [1.12, .08, 1.5], size: .34, turn: -40, face: 'happy', look: 'camera' } },\n  camera: { framing: 'medium', on: ['cup2', 'worm'], side: 'front', move: 'pull-out' },\n  focus: [{ on: ['cup2', 'worm'] }],\n  light: 'hope', ambience: 'night',\n  moves: [{ sec: 0, who: 'worm', do: 'appear', for: .6 }, { word: 'guest', who: 'worm', do: 'nod' }, { word: 'guest', who: 'kato', do: 'wave', for: 1.4 }],\n  sfx: [{ word: 'guest', sound: 'tada' }]\n});"
}
};
