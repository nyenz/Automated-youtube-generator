/* =========================================================================
   FACET MOTION — makes Facet Kit drawings move.
   It only uses what the kit has:
     - people: F.person(spec) with a new pose each frame (arms, legs, head tilt/turn/nod, lean)
     - any asset: its own draw(F), drawn once, then moved as a whole
       (slide, hop, rock, breathe) with plain SVG transforms
   No blur, glow, haze or any other effect is added here.

   FM.scene({ width, height, bg, duration, camera: [...], cast: [...] })
   FM.frame(scene, t)  -> SVG string of the picture at time t (seconds)
   FM.play(scene, element)  -> plays it in a page

   cast member (a person):
     { id: 'dad', person: { build, skin, hair, top, ... (same as F.person, no x/ground) },
       x: 300, ground: 1500, height: 520, seed: 3, moves: [...] }
   cast member (any asset file):
     { id: 'fox', draw: drawFunction, origin: [540, 950], x: 800, ground: 1500, scale: .6, moves: [...] }
       origin = the point between the feet in the asset's own 1080 canvas

   moves: { at: seconds, for: seconds, do: name, ...options }
     walk  { to: x, steps: per second (default 2) }   side-step waddle to a new x
     hop   { height: px }                                 one jump (for = time in air)
     bounce{ height }                                     small happy hops for the whole time
     wave  { arm: 'L'|'R' }      cheer        point { arm }
     hips  (hands on hips)       hold (both hands in front)   shrug
     sad   (head drops + tilts)  shake (head turns "no")  nod (head bobs "yes")
     look  { dir: 'L'|'R' }      tilt { deg }           lean { deg }
     shiver (cold / scared)      arms { L:[up,fore], R:[up,fore] }  (any pose by hand)
   camera: [{ at, for, zoom: 1, x, y }]  — x,y = the point to look at (default the middle)
   ========================================================================= */
(function (root) {
  'use strict';
  const F = root.F;
  const ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
  const lerp = (a, b, k) => a + (b - a) * k;
  const HANG = [7, 2];
  const ARMS = {
    wave: (m, t, side) => side === (m.arm || 'R') ? [150, 22 + 26 * Math.sin(t * 2 * Math.PI * 2.2)] : null,
    cheer: (m, t) => [158, 14 + 10 * Math.sin(t * 2 * Math.PI * 2.6)],
    point: (m, t, side) => side === (m.arm || 'R') ? [86, 0] : null,
    hips: () => [35, -110],
    hold: () => [-5, -90],
    shrug: () => [48, -118],
    sad: () => [1, -3],
    arms: (m, t, side) => (m[side] || null),
  };

  /* how strongly a move is "on" at time t: fades in and out over 0.25 s */
  function weight(m, t) {
    const a = m.at || 0, d = m.for || 1, f = Math.min(.25, d / 3);
    if (t < a || t > a + d) return 0;
    return ease(Math.min((t - a) / f, (a + d - t) / f, 1));
  }

  /** where the actor is and how it stands at time t */
  function pose(c, t) {
    const P = { x: c.x || 0, dy: 0, rot: 0, sx: 1, sy: 1, dx: 0, arms: { L: (c.arms && c.arms.L) || HANG, R: (c.arms && c.arms.R) || HANG },
      legs: { L: [0, 0], R: [0, 0] }, head: { tilt: 0, turn: 0, nod: 0 }, lean: 0 };
    // idle: slow breathing + a tiny sway, so nobody is ever frozen
    const ph = (c.seed || 1) * 1.7;
    P.sy = 1 + .007 * Math.sin(t * 2 * Math.PI / 3.1 + ph);
    P.rot = .5 * Math.sin(t * 2 * Math.PI / 4.3 + ph);
    let x = c.x || 0;
    (c.moves || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0)).forEach(m => {
      const a = m.at || 0, d = m.for || 1, k = (t - a) / d, w = weight(m, t);
      if (m.do === 'walk') {
        const from = x, to = m.to == null ? x : m.to;
        if (t >= a && t <= a + d) {
          P.x = lerp(from, to, ease(k));
          const ph2 = (t - a) * (m.steps || 2) * Math.PI, s = Math.sin(ph2);
          P.rot += 1.6 * s * w; P.dy -= Math.abs(s) * (c.height || 500) * .01 * w;
          P.legs.L = [2 * w, Math.max(0, s) * 4 * w]; P.legs.R = [2 * w, Math.max(0, -s) * 4 * w];   // real steps
          P.head.tilt += -2 * s * w;
          P.arms.L = mix(P.arms.L, [12 + 8 * s, 2], w); P.arms.R = mix(P.arms.R, [12 - 8 * s, 2], w);
        } else if (t > a + d) P.x = to;
        x = to; return;
      }
      if (!w && m.do !== 'hop') return;
      if (m.do === 'hop' && t >= a && t <= a + d) {
        const h = m.height || (c.height || 500) * .18;
        P.dy -= Math.sin(Math.PI * k) * h;
        const land = Math.max(0, 1 - Math.min(k, 1 - k) * 8);                // squash at take-off and landing
        P.sy *= 1 - .06 * land; P.sx *= 1 + .05 * land;
        const up = Math.sin(Math.PI * k);
        P.arms.L = mix(P.arms.L, [40, 10], up); P.arms.R = mix(P.arms.R, [40, 10], up);
        P.legs.L = [10 * up, 2 * up]; P.legs.R = [10 * up, 2 * up];
      }
      if (m.do === 'bounce') { const s = Math.abs(Math.sin((t - a) * Math.PI * 2.4)); P.dy -= s * (m.height || (c.height || 500) * .05) * w; }
      if (m.do === 'shake') P.head.turn += .45 * Math.sin((t - a) * Math.PI * 4) * w;
      if (m.do === 'nod') P.head.nod += 2.4 * Math.abs(Math.sin((t - a) * Math.PI * 2.4)) * w;
      if (m.do === 'look') P.head.turn += (m.dir === 'L' ? -.7 : m.dir === 'R' ? .7 : (+m.turn || 0)) * w;
      if (m.do === 'tilt') P.head.tilt += (m.deg == null ? 8 : m.deg) * w;
      if (m.do === 'lean') P.lean += (m.deg == null ? 6 : m.deg) * w;
      if (m.do === 'cheer') { P.legs.L = [6 * w, 0]; P.legs.R = [6 * w, 0]; P.head.tilt -= 4 * w; }
      if (m.do === 'wave') P.head.tilt += (m.arm === 'L' ? 5 : -5) * w;
      if (m.do === 'shiver') P.dx += 2.2 * Math.sin(t * 2 * Math.PI * 11) * w * (c.height || 500) / 500;
      if (m.do === 'sad') { P.sy *= 1 - .02 * w; P.head.nod += 3 * w; P.head.tilt += 6 * w; }
      if (m.do === 'shrug') { P.dy -= (c.height || 500) * .012 * w * Math.abs(Math.sin((t - a) * Math.PI / Math.max(.4, d))); P.head.tilt += 8 * w; }
      const fn = ARMS[m.do];
      if (fn) ['L', 'R'].forEach(side => { const tg = fn(m, t - a, side); if (tg) P.arms[side] = mix(P.arms[side], tg, w); });
    });
    return P;
  }
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

  /* ---- drawing with the untouched kit ---- */
  // the kit renders a whole picture; we keep only the shapes between the floor and the grain
  function bodyOf(svg, prefix) {
    const tag = 'fill="url(#floorG)"/>', a = svg.indexOf(tag) + tag.length, b = svg.lastIndexOf('<rect width=');
    return svg.slice(a, b).replace(/id="f(\d+)"/g, 'id="' + prefix + 'f$1"').replace(/url\(#f(\d+)\)/g, 'url(#' + prefix + 'f$1)');
  }
  const cache = new Map();
  const r = (v, k) => Math.round(v / k) * k;
  function personBody(c, Pz) {
    const arms = Pz.arms, legs = { L: Pz.legs.L.map(v => r(v, .5)), R: Pz.legs.R.map(v => r(v, .5)) };
    const head = { tilt: r(Pz.head.tilt, .5), turn: r(Pz.head.turn, .05), nod: r(Pz.head.nod, .2) }, lean = r(Pz.lean, .5);
    const key = c.id + '|' + arms.L.map(Math.round) + '|' + arms.R.map(Math.round) + '|' + legs.L + '|' + legs.R + '|' + [head.tilt, head.turn, head.nod, lean];
    if (cache.has(key)) return cache.get(key);
    F.begin({ width: 1080, height: 1080, seed: c.seed || 3 });
    F.person(Object.assign({}, c.person, { x: 540, ground: 1000, height: c.height || 500,
      arms: { L: arms.L.map(Math.round), R: arms.R.map(Math.round) }, stride: legs, head, lean }));
    const s = '<g transform="translate(-540 -1000)">' + bodyOf(F.render(), 'p' + cache.size + '_') + '</g>';
    if (cache.size > 4000) cache.clear();
    cache.set(key, s); return s;
  }
  function assetBody(c) {
    const key = c.id + '|asset';
    if (!cache.has(key)) cache.set(key, bodyOf(c.draw(F), 'a' + cache.size + '_'));
    return cache.get(key);
  }
  function shadowBody(w) {
    const key = 'shadow|' + Math.round(w);
    if (!cache.has(key)) { F.begin({ width: 1080, height: 1080 }); F.groundShadow(540, 1000, w); cache.set(key, '<g transform="translate(-540 -1000)">' + bodyOf(F.render(), 's') + '</g>'); }
    return cache.get(key);
  }

  function camAt(S, t) {
    let cam = { zoom: 1, x: S.width / 2, y: S.height / 2 };
    (S.camera || []).forEach(m => {
      const a = m.at || 0, d = m.for || .001, k = ease((t - a) / d);
      if (t < a) return;
      const to = { zoom: m.zoom == null ? cam.zoom : m.zoom, x: m.x == null ? cam.x : m.x, y: m.y == null ? cam.y : m.y };
      cam = { zoom: lerp(cam.zoom, to.zoom, k), x: lerp(cam.x, to.x, k), y: lerp(cam.y, to.y, k) };
    });
    return cam;
  }

  function frame(S, t) {
    const shellKey = 'shell|' + S.width + 'x' + S.height + S.bg;
    if (!cache.has(shellKey)) { F.begin({ width: S.width, height: S.height, bg: S.bg || '#c0612c', seed: 1 }); cache.set(shellKey, F.render(S.title || 'Facet scene')); }
    const shell = cache.get(shellKey), cut = shell.lastIndexOf('<rect width=');
    const cam = camAt(S, t), f = n => (+n).toFixed(2);
    let g = `<g transform="translate(${f(S.width / 2)} ${f(S.height / 2)}) scale(${f(cam.zoom)}) translate(${f(-cam.x)} ${f(-cam.y)})">`;
    (S.cast || []).slice().sort((a, b) => (a.ground || 0) - (b.ground || 0)).forEach(c => {
      if (c.from != null && t < c.from) return; if (c.until != null && t > c.until) return;
      const P = pose(c, t), G = c.ground || S.height * .85;
      if (c.person) {
        const lift = Math.max(0, -P.dy) / (c.height || 500);
        g += `<g transform="translate(${f(P.x + (c.height || 500) * .02)} ${f(G)}) scale(${f(1 - lift * 1.2)} 1)">${shadowBody((c.height || 500) * .42)}</g>`;
        g += `<g transform="translate(${f(P.x + P.dx)} ${f(G + P.dy)}) rotate(${f(P.rot)}) scale(${f(P.sx)} ${f(P.sy)})">${personBody(c, P)}</g>`;
      } else if (c.draw) {
        const o = c.origin || [540, 1000], sc = c.scale || 1;
        g += `<g transform="translate(${f(P.x + P.dx)} ${f(G + P.dy)}) rotate(${f(P.rot)}) scale(${f(sc * P.sx)} ${f(sc * P.sy)}) translate(${-o[0]} ${-o[1]})">${assetBody(c)}</g>`;
      }
    });
    return shell.slice(0, cut) + g + '</g>' + shell.slice(cut);
  }

  function play(S, el) {
    const t0 = performance.now();
    (function tick() { const t = ((performance.now() - t0) / 1000) % (S.duration || 8); el.innerHTML = frame(S, t); requestAnimationFrame(tick); })();
  }

  root.FM = { frame, pose, play, ease };
})(typeof window !== 'undefined' ? window : globalThis);
