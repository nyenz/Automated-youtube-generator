/* DEMO PROJECT (Low-Poly style) — "The Lantern" (6 shots). Used by "Load demo" in the app. */
(function () {
  function asset(name, fn) { return "KIT.asset('" + name + "', " + fn.toString() + ");" }

  var meadow = function (K) {
    function hills(w, h, cols, seed, amp, base) {
      K.begin({ width: w, height: h, bg: 'none', grain: false, seed: seed });
      cols.forEach(function (c, i) {
        var pts = [[0, h]], y0 = base + i * amp * .9, n = 9;
        for (var k = 0; k <= n; k++) pts.push([k / n * w, y0 - Math.sin(k * 1.3 + i * 2 + seed) * amp * .55 - K.rnd() * amp * .4]);
        pts.push([w, h]);
        K.part(pts, c, { material: 'hard', step: 90, sx: 120, sy: 160, dir: 80, light: .8 });
      });
      return K.render('hills');
    }
    function pines(w, h, col, seed, count) {
      K.begin({ width: w, height: h, bg: 'none', grain: false, seed: seed });
      for (var i = 0; i < count; i++) {
        var x = 70 + (w - 140) * (i + K.rnd() * .6) / count, s = .7 + K.rnd() * .7, bh = 300 * s, tw = 46 * s;
        K.part([[x - 8 * s, h], [x + 8 * s, h], [x + 6 * s, h - 40 * s], [x - 6 * s, h - 40 * s]], '#5a4636', { material: 'hard', step: 30, sx: 30, sy: 30 });
        for (var j = 0; j < 3; j++) {
          var y = h - 24 * s - j * bh * .27, ww = tw * (1.5 - j * .3), hh = bh * .4;
          K.part([[x - ww, y], [x + ww, y], [x + ww * .1, y - hh], [x - ww * .1, y - hh]], K.mix(col, '#a7c27a', j * .12), { material: 'leaf', step: 26, sx: 30, sy: 40, dir: 70 });
        }
      }
      return K.render('pines');
    }
    function tufts(w, h, seed) {
      K.begin({ width: w, height: h, bg: 'none', grain: false, seed: seed });
      for (var i = 0; i < 14; i++) {
        var x = K.rnd() * w, bh = 60 + K.rnd() * 90;
        K.part([[x - 18, h], [x - 4, h - bh], [x + 4, h - bh * .5], [x + 22, h]], i % 3 ? '#6f8a4e' : '#86a05a', { material: 'leaf', step: 20, sx: 20, sy: 30 });
      }
      return K.render('tufts');
    }
    return K.set({
      width: 26, depth: 14, height: 9,
      backdrop: { top: '#c9b49a', bottom: '#b7a78c', ground: '#9aa66e' },
      ground: { color: '#93a56a' },
      layers: [
        { art: hills(2400, 700, ['#8fa0a8', '#7d9a95', '#6d8f7a'], 3, 90, 360), z: -22, width: 80, y: 0, base: 640, name: 'hills' },
        { art: pines(2400, 700, '#4f7a5a', 7, 16), z: -13, width: 54, y: 0, base: 690, name: 'pines' },
        { art: tufts(2400, 220, 9), z: 4, width: 36, y: -0.2, base: 214, name: 'grass' }
      ],
      spots: { left: [-1.5, 0, 0], center: [0, 0, 0], right: [1.5, 0, 0], far: [0, 0, -4], near: [0, 0, 3], door: [-8, 0, 0] }
    });
  };

  var lantern = function (K) {
    K.begin({ width: 300, height: 420, bg: 'none', grain: false, seed: 5 });
    K.ring(150, 50, 30, '#6b5a40', 8);
    K.part([[78, 84], [222, 84], [240, 124], [60, 124]], '#8a6a3c', { material: 'hard', step: 30, sx: 40, sy: 20 });
    K.part([[70, 124], [230, 124], [226, 330], [74, 330]], '#e9b95b', { material: 'detail', step: 28, sx: 26, sy: 40, light: .4 });
    K.flat([[104, 152], [196, 152], [188, 306], [112, 306]], '#fff0b8', .85);
    [[70, 124, 74, 330], [230, 124, 226, 330], [150, 124, 150, 330]].forEach(function (b) { K.line([[b[0], b[1]], [b[2], b[3]]], '#6b5a40', 8) });
    K.part([[60, 330], [240, 330], [222, 372], [78, 372]], '#8a6a3c', { material: 'hard', step: 30, sx: 40, sy: 20 });
    var dr = K.render('lantern');
    var a = K.prop(dr, { size: .8, grip: [150, 50], anchor: [150, 372], sway: 2.5 });
    a.glow = { size: 3.4, alpha: .55, at: .36, color: '#ffd28a' };
    return a;
  };

  var fireflies = function (K) {
    K.begin({ width: 200, height: 200, bg: 'none', grain: false, seed: 4 });
    K.circle(100, 100, 12, '#fff3b0'); K.circle(100, 100, 22, '#ffe9a0', .25);
    return K.fx(K.render('firefly'), { size: .12, bob: .25, speed: 2.2, glow: { size: .9, alpha: .7, color: '#fff0a0' } });
  };

  var kato = function (K) { return K.mascot('kato') };
  var nia = function (K) { return K.mascot('nia') };

  window.DEMO_LP = {
    title: 'The Lantern', style: 'lowpoly',
    script: "Every evening, Kato walked to the meadow with a small lantern. Tonight, Nia was already waiting there. Hey, you came! she said, and waved. He smiled, and held the lantern up high. Look, the fireflies are following the light. They sat down and watched them dance until it was dark.",
    plan: {
      title: 'The Lantern', sky: 'warm',
      assets: [
        { name: 'kato', kind: 'character', difficulty: 1, size: 2.66, look: 'Kato: teal overshirt, cream tee, sand pants.', parts: [], moves: [] },
        { name: 'nia', kind: 'character', difficulty: 1, size: 2.64, look: 'Nia: rose cardigan, navy skirt, long blonde hair.', parts: [], moves: [] },
        { name: 'lantern', kind: 'prop', difficulty: 1, size: .8, holdable: true, look: 'Small brass lantern with a warm glow.', parts: ['grip'], moves: [] },
        { name: 'fireflies', kind: 'fx', difficulty: 1, size: .12, look: 'A single glowing firefly.', parts: [], moves: [] },
        { name: 'meadow', kind: 'set', difficulty: 2, size: 26, look: 'Evening meadow with hills and pine trees.', parts: ['spots'], moves: [], spots: ['left', 'center', 'right', 'far', 'near', 'door'] }
      ],
      cuts: {
        main: [
          { id: 'S01', lines: [0, 0], set: 'meadow', cast: ['kato', 'lantern'], show: 'Wide: Kato walks into the meadow with the lantern.', mood: 'warm', difficulty: 1 },
          { id: 'S02', lines: [1, 1], set: 'meadow', cast: ['nia'], show: 'Medium: Nia waiting.', mood: 'warm', difficulty: 1 },
          { id: 'S03', lines: [2, 3], set: 'meadow', cast: ['kato', 'nia', 'lantern'], show: 'Two shot: Nia waves, Kato arrives.', mood: 'warm', difficulty: 1 },
          { id: 'S04', lines: [4, 4], set: 'meadow', cast: ['kato', 'lantern'], show: 'Close: Kato smiles and lifts the lantern.', mood: 'warm', difficulty: 1 },
          { id: 'S05', lines: [5, 5], set: 'meadow', cast: ['nia', 'kato', 'fireflies'], show: 'Fireflies drift past.', mood: 'hope', difficulty: 1 },
          { id: 'S06', lines: [6, 6], set: 'meadow', cast: ['kato', 'nia', 'lantern'], show: 'Wide: they sit and watch.', mood: 'cold', difficulty: 1 }
        ]
      }
    },
    assets: {
      'kato': asset('kato', kato),
      'nia': asset('nia', nia),
      'lantern': asset('lantern', lantern),
      'fireflies': asset('fireflies', fireflies),
      'meadow': asset('meadow', meadow)
    },
    shots: {
      'S01': "SHOT('S01', {\n  set: 'meadow',\n  cast: { kato: { at: 'door', turn: 'right', face: 'happy' }, lantern: { at: [0, 0, 0] } },\n  camera: { framing: 'wide', on: 'kato', side: 'front', move: 'push-in' },\n  light: [{ mood: 'warm' }],\n  moves: [\n    { sec: 0, who: 'kato', do: 'hold', item: 'lantern' },\n    { word: 'walked', who: 'kato', do: 'walk', to: 'center', for: 3 }\n  ]\n});",
      'S02': "SHOT('S02', {\n  set: 'meadow',\n  cast: { nia: { at: 'right', turn: 'left', face: 'neutral' } },\n  camera: { framing: 'medium', on: 'nia', side: 'front-left', move: 'orbit-left' },\n  light: [{ mood: 'warm' }],\n  moves: [{ word: 'waiting', who: 'nia', do: 'look', to: 'left' }]\n});",
      'S03': "SHOT('S03', {\n  set: 'meadow',\n  cast: { kato: { at: 'left', turn: 'right', face: 'happy' }, nia: { at: 'right', turn: 'left', face: 'happy' }, lantern: { at: [0, 0, 0] } },\n  camera: { framing: 'full', on: ['kato', 'nia'], side: 'front', move: 'push-in' },\n  focus: [{ on: 'nia' }, { word: 'waved', on: 'kato', pull: .3 }],\n  light: [{ mood: 'warm' }],\n  moves: [\n    { sec: 0, who: 'kato', do: 'hold', item: 'lantern' },\n    { word: 'Hey,', who: 'nia', do: 'talk', for: 1.4 },\n    { word: 'waved', who: 'nia', do: 'wave', for: 1.2 }\n  ]\n});",
      'S04': "SHOT('S04', {\n  set: 'meadow',\n  cast: { kato: { at: 'center', turn: 'front', face: 'happy' }, lantern: { at: [0, 0, 0] } },\n  camera: { framing: 'close', on: 'kato', side: 'front-right', move: 'push-in' },\n  light: [{ mood: 'warm' }],\n  moves: [\n    { sec: 0, who: 'kato', do: 'hold', item: 'lantern' },\n    { word: 'smiled,', who: 'kato', face: 'laugh' },\n    { word: 'up', who: 'kato', do: 'reach', to: [0, 3.4, 0] }\n  ]\n});",
      'S05': "SHOT('S05', {\n  set: 'meadow',\n  air: 'dust',\n  cast: { nia: { at: 'right', turn: 'left', face: 'surprised' }, kato: { at: 'left', turn: 'right', face: 'happy' }, fireflies: { at: [0, 1.6, 0] } },\n  camera: { framing: 'medium', on: ['kato', 'nia'], side: 'front', move: 'orbit-right' },\n  focus: [{ on: 'fireflies' }, { word: 'dance', on: 'nia', pull: .4 }],\n  light: [{ mood: 'hope' }],\n  moves: [{ word: 'fireflies', who: 'nia', do: 'look', to: 'fireflies' }, { sec: 0, who: 'fireflies', do: 'float', height: .3 }]\n});",
      'S06': "SHOT('S06', {\n  set: 'meadow',\n  air: 'dust',\n  cast: { kato: { at: 'left', turn: 'right', face: 'happy' }, nia: { at: 'right', turn: 'left', face: 'happy' }, lantern: { at: [0, 0, 0] } },\n  camera: { framing: 'wide', on: ['kato', 'nia'], side: 'front', angle: 'low', move: 'pull-out' },\n  light: [{ mood: 'cold' }],\n  moves: [\n    { sec: 0, who: 'kato', do: 'hold', item: 'lantern' },\n    { word: 'sat', who: 'kato', do: 'sit', for: 1 },\n    { word: 'sat', who: 'nia', do: 'sit', for: 1 }\n  ]\n});"
    }
  };
})();
