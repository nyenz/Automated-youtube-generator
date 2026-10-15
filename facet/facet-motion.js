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

   SHOTS (a film with cuts): { width, height, duration, captions: { words: [[word, start, end], ...] },
     shots: [{ id, from, to, bg, far, set, front: (F, W, H) => drawing, cast: [...], camera: [...], handheld: px }] }
       far = slow distant layer, set = the ground the cast stands on, front = near silhouettes that frame the shot (move faster)
     inside a shot every time (moves, camera) counts from the start of that shot.
   more cast options: lying: true (on the back, head left) · flip: true (asset faces the other way) · z: draw order
     hold: { R: { id, draw, grip: [x,y], scale, rot, follow, from, to } }  — a prop in the hand (drawn under the mitten)
     silhouette: '#16222d' (draw it as one flat dark shape) · opacity · rot (assets) · layer: 'far' (moves with the far layer)
     cycle: { period, phase, grow: [from, to], fade: [from, to], dx, dy, fall } — a repeating detail (breath puff, drip)
     value: { from, to, at, for, step } — a live number passed to draw(F, value) (a reading counting down); also on hold entries
   move colour { skin, lips, top, shoes } — the body slowly changes colour and STAYS (cold → pale blue-grey skin, blue lips)
   colour: { skin, lips } — a starting body colour (still cold when the shot begins)
   breath: 1 normal · 0 not breathing; move breath { amount } changes it over 'for' seconds (recovery) — lying people breathe too
   fade: { from: 0, to: 1, at, for } — fade a thing in or out over time (frost growing, light dimming)
   rim: false — no rim light on this one (rim: true on a prop to give it one)
   shot.light: { side: 'L'|'R', rim: '#e8eef3', width: 3, shadow: .2, length: .24, angle: 52 } — a flat rim edge on the lit side and a cast shadow away from it
   shot.weather: { kind: 'snow'|'rain'|'dust'|'ash', amount: 70, speed: 1, wind: 0 } — falling things in three depths
     plane: 'back' — a cast item that belongs to the background plane (furniture, machines): it gets the set's focus and grade
   shot.grade: { far: [colour, amount], set: [colour, amount] } — aerial perspective: far things sink into the world colour
   shot.focus: [{ at, for, far, set, cast, front }] — subtle depth of field in screen pixels (0–5). The subject is never blurred.
     blink: { period, on: 0..1, phase } — on/off (warning lights) · idle: { lean, period } — a person shifting their weight
   captions.keys: ['pulse', 'hours', ...] — only these words get the accent colour; each group pops in
     stride / head / lean: the resting pose
   side-view people (person.view: 'side'): walk swings the legs; kneel, sit, chair, reach { arm, deg }, drift { dx, dy, rot }
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
    hold: (m, t, side, c) => isSide(c) ? [42, 48] : [-5, -90],
    reach: (m, t, side) => side === (m.arm || 'R') ? [m.deg == null ? 90 : m.deg, m.bend || 0] : null,
    shrug: () => [48, -118],
    sad: () => [1, -3],
    arms: (m, t, side) => (m[side] || null),
  };
  const isSide = c => !!(c && c.person && c.person.view === 'side');
  // leg poses (side view): [hipDeg forward, kneeDeg bend]
  const LEGS = {
    kneel: () => ({ R: [80, 95], L: [-5, 100] }),
    sit: () => ({ R: [85, 0], L: [85, 0] }),
    chair: () => ({ R: [85, 85], L: [85, 85] }),
    legs: m => ({ L: m.L, R: m.R }),
  };

  /* how strongly a move is "on" at time t: fades in and out over 0.25 s */
  function weight(m, t) {
    const a = m.at || 0, d = m.for || 1, f = Math.min(.25, d / 3);
    if (t < a || t > a + d) return 0;
    return ease(Math.min((t - a) / f, (a + d - t) / f, 1));
  }

  /* "alive" weight for poses: a tiny wind-up the other way, then a small overshoot that settles.
     Used for arm, leg and head poses (not for shaking/waving loops). */
  const backOut = k => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * (k - 1) ** 3 + c1 * (k - 1) ** 2; };
  function alive(m, t) {
    const a = m.at || 0, d = m.for || 1, f = Math.min(.42, d / 2.5);
    if (t < a || t > a + d) return 0;
    const k = Math.min((t - a) / f, (a + d - t) / f);
    if (k >= 1) return 1;
    if (k < .22) return -.07 * Math.sin(Math.PI * k / .22);          // wind-up
    return backOut((k - .22) / .78);                                  // go, overshoot a little, settle
  }

  /* LIVE VALUES: a prop whose drawing changes over time (a thermometer counting down, a clock, a gauge).
     value: 7 (fixed) or { from: 11.4, to: 7.0, at: 0, for: 1.8, step: 0.1 } — the asset's draw(F, value) gets the number. */
  function valueAt(v, t) {
    if (v == null) return undefined; if (typeof v !== 'object') return v;
    const k = Math.min(1, Math.max(0, (t - (v.at || 0)) / (v.for || 1))), e = v.ease === 'linear' ? k : 1 - (1 - k) ** 3, x = lerp(v.from, v.to, e), st = v.step || .1;
    return +(Math.round(x / st) * st).toFixed(4);
  }
  const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), toHex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const mixHex = (a, b, k) => { const A = hex2(a), B = hex2(b); return toHex(A.map((v, i) => v + (B[i] - v) * k)) };
  const BASE = { skin: '#ece3d6', lips: '#c98a7e', top: '#d3ccbd', sleeve: null, shoes: '#5a3124' };

  /** where the actor is and how it stands at time t */
  function pose(c, t) {
    const P = { x: c.x || 0, dy: 0, rot: 0, sx: 1, sy: 1, dx: 0, arms: { L: (c.arms && c.arms.L) || HANG, R: (c.arms && c.arms.R) || HANG },
      legs: { L: ((c.stride && c.stride.L) || [0, 0]).slice(), R: ((c.stride && c.stride.R) || [0, 0]).slice() },
      head: Object.assign({ tilt: 0, turn: 0, nod: 0 }, c.head || {}), lean: c.lean || 0, paint: {} };
    const sideV = isSide(c);
    // idle: slow breathing + a tiny sway, so nobody is ever frozen
    const ph = (c.seed || 1) * 1.7;
    // breathing: c.breath = 1 normal, 0 = not breathing (no pulse); a 'breath' move changes it over time (recovery)
    let br = c.breath == null ? 1 : c.breath;
    (c.moves || []).forEach(m => { if (m.do === 'breath') { const k = ease(Math.min(1, Math.max(0, (t - (m.at || 0)) / (m.for || 1)))); br = lerp(br, m.amount == null ? 1 : m.amount, k) } });
    const bw = Math.sin(t * 2 * Math.PI / 3.1 + ph);
    P.sy = 1 + .007 * br * bw; P.bk = br * Math.max(0, bw);
    if (c.colour) Object.keys(c.colour).forEach(k => { P.paint[k] = c.colour[k] });   // a starting body colour (e.g. still cold)
    P.rot = .5 * Math.sin(t * 2 * Math.PI / 4.3 + ph);
    if (c.idle && c.idle.lean) P.lean += c.idle.lean * Math.sin(t * 2 * Math.PI / (c.idle.period || 3.6) + ph);   // shifting weight
    let x = c.x || 0;
    (c.moves || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0)).forEach(m => {
      const a = m.at || 0, d = m.for || 1, k = (t - a) / d, w = weight(m, t);
      if (m.do === 'walk') {
        const from = x, to = m.to == null ? x : m.to;
        if (t >= a && t <= a + d) {
          P.x = lerp(from, to, ease(k));
          const ph2 = (t - a) * (m.steps || 2) * Math.PI, s = Math.sin(ph2);
          if (sideV) {                                                     // side view: legs swing forward and back
            P.dy -= Math.abs(Math.cos(ph2)) * (c.height || 500) * .008 * w;
            P.legs.L = [-24 * s * w, 10 * Math.max(0, s) * w]; P.legs.R = [24 * s * w, 10 * Math.max(0, -s) * w];
            P.arms.L = mix(P.arms.L, [26 * s, 12], w); P.arms.R = mix(P.arms.R, [-26 * s, 12], w);
          } else {
            P.rot += 1.6 * s * w; P.dy -= Math.abs(s) * (c.height || 500) * .01 * w;
            P.legs.L = [2 * w, Math.max(0, s) * 4 * w]; P.legs.R = [2 * w, Math.max(0, -s) * 4 * w];   // real steps
            P.head.tilt += -2 * s * w;
            P.arms.L = mix(P.arms.L, [12 + 8 * s, 2], w); P.arms.R = mix(P.arms.R, [12 - 8 * s, 2], w);
          }
        } else if (t > a + d) P.x = to;
        x = to; return;
      }
      if (m.do === 'breath') return;
      if (m.do === 'colour' || m.do === 'color') {                     // a body change that stays: cold skin, a blush, going pale
        const k = Math.round(ease(Math.min(1, Math.max(0, (t - a) / d))) * 12) / 12; if (!k) return;
        Object.keys(m).forEach(key => { if (!BASE.hasOwnProperty(key) || typeof m[key] !== 'string') return;
          const from = P.paint[key] || (c.person && c.person[key]) || BASE[key] || '#888888'; P.paint[key] = mixHex(from, m[key], k); });
        return;
      }
      if (!w && m.do !== 'hop' && m.do !== 'drift') return;
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
      const wl = alive(m, t), wh = alive(m, t - .12);                 // the head follows a beat after the body
      if (m.do === 'look') P.head.turn += (m.dir === 'L' ? -.7 : m.dir === 'R' ? .7 : (+m.turn || 0)) * wh;
      if (m.do === 'tilt') P.head.tilt += (m.deg == null ? 8 : m.deg) * wh;
      if (m.do === 'lean') P.lean += (m.deg == null ? 6 : m.deg) * wl;
      if (m.do === 'cheer') { P.legs.L = [6 * w, 0]; P.legs.R = [6 * w, 0]; P.head.tilt -= 4 * w; }
      if (m.do === 'wave') P.head.tilt += (m.arm === 'L' ? 5 : -5) * w;
      if (m.do === 'shiver') P.dx += 2.2 * Math.sin(t * 2 * Math.PI * 11) * w * (c.height || 500) / 500;
      if (m.do === 'sad') { P.sy *= 1 - .02 * w; P.head.nod += 3 * w; P.head.tilt += 6 * w; }
      if (m.do === 'shrug') { P.dy -= (c.height || 500) * .012 * w * Math.abs(Math.sin((t - a) * Math.PI / Math.max(.4, d))); P.head.tilt += 8 * w; }
      if (m.do === 'drift') { const k2 = ease(Math.min(1, Math.max(0, (t - a) / d))); P.dx += (m.dx || 0) * k2; P.dy += (m.dy || 0) * k2; P.rot += (m.rot || 0) * k2; }
      const fn = ARMS[m.do];
      const loop = m.do === 'wave' || m.do === 'cheer', wa = loop ? w : wl;
      if (fn) ['L', 'R'].forEach(side => { const tg = fn(m, t - a, side, c); if (tg) P.arms[side] = mix(P.arms[side], tg, wa); });
      const lf = LEGS[m.do];
      if (lf) { const tg = lf(m); ['L', 'R'].forEach(side => { if (tg[side]) P.legs[side] = mix(P.legs[side], tg[side], wl); }); }
      if ((fn || lf) && !loop) P.dy += (c.height || 500) * .006 * Math.max(0, -wl) * 6;   // a small dip on the wind-up
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
    const hold = c.holdNow || {}, hk = Object.keys(hold).map(k => k + ':' + (hold[k] ? hold[k].id + '=' + hold[k]._v : '')).join();
    const paint = Pz.paint || {}, pk = Object.keys(paint).map(k => k + paint[k]).join();
    const key = c.id + '|' + arms.L.map(Math.round) + '|' + arms.R.map(Math.round) + '|' + legs.L + '|' + legs.R + '|' + [head.tilt, head.turn, head.nod, lean] + '|' + hk + '|' + pk;
    if (cache.has(key)) return cache.get(key);
    const held = {};
    Object.keys(hold).forEach(side => { const h = hold[side]; if (!h) return; const pb = assetBody(h, h._v), g = h.grip || [540, 540], sc = h.scale || .3;
      held[side] = (x, y, deg) => F.raw(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((h.follow ? deg : 0) + (h.rot || 0)).toFixed(1)}) scale(${sc}) translate(${-g[0]} ${-g[1]})">${pb}</g>`); });
    F.begin({ width: 1080, height: 1080, seed: c.seed || 3 });
    F.person(Object.assign({}, c.person, paint, c.lying === 'right' ? { face: -1 } : {}, { x: 540, ground: 1000, height: c.height || 500,
      arms: { L: arms.L.map(Math.round), R: arms.R.map(Math.round) }, stride: legs, head, lean, held }));
    const s = '<g transform="translate(-540 -1000)">' + bodyOf(F.render(), 'p' + cache.size + '_') + '</g>';
    if (cache.size > 4000) cache.clear();
    cache.set(key, s); return s;
  }
  function assetBody(c, v) {
    const key = c.id + '|asset|' + (v === undefined ? '' : v);
    if (!cache.has(key)) cache.set(key, bodyOf(c.draw(F, v), 'a' + cache.size + '_'));
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

  /** focus keyframes: [{ at, for, far, set, cast, front }] (blur in screen pixels, keep it 0–5) */
  function focusAt(list, t) {
    let v = { far: 0, set: 0, cast: 0, front: 0 };
    (list || []).forEach(m => {
      const a = m.at || 0, d = m.for || .001; if (t < a) return; const k = ease((t - a) / d);
      const to = {}; Object.keys(v).forEach(n => { to[n] = m[n] == null ? v[n] : m[n]; });
      Object.keys(v).forEach(n => { v[n] = lerp(v[n], to[n], k); });
    });
    return v;
  }
  function setBody(id, fn, S) {
    const key = 'set|' + id;
    if (!cache.has(key)) cache.set(key, bodyOf(fn(F, S.width, S.height), 'set' + cache.size + '_'));
    return cache.get(key);
  }
  function shellOf(S, bg) {
    const k = 'shell|' + S.width + 'x' + S.height + bg;
    if (!cache.has(k)) { F.begin({ width: S.width, height: S.height, bg, seed: 1 }); cache.set(k, F.render(S.title || 'Facet scene')); }
    return cache.get(k);
  }
  const f = n => (+n).toFixed(2);
  function castSVG(S, list, t) {
    let g = '';
    list.slice().sort((a, b) => (a.z != null ? a.z : a.ground || 0) - (b.z != null ? b.z : b.ground || 0)).forEach(c => {
      if (c.from != null && t < c.from) return; if (c.until != null && t > c.until) return;
      const P = pose(c, t), G = c.ground || S.height * .85, h = c.height || 500;
      const sil = svg => c.silhouette ? svg.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="' + c.silhouette + '"') : svg;
      let op = c.opacity, cs = 1, cx = 0, cy = 0;
      if (c.cycle) {                                                    // repeating detail: a breath puff, a drip
        const C = c.cycle, k = (((t + (C.phase || 0)) % C.period) + C.period) % C.period / C.period;
        cs = lerp((C.grow || [1, 1])[0], (C.grow || [1, 1])[1], k); op = lerp((C.fade || [1, 1])[0], (C.fade || [1, 1])[1], k) * (op == null ? 1 : op);
        cx = (C.dx || 0) * k; cy = (C.dy || 0) * (C.fall ? k * k : k);
      }
      if (c.blink) { const B = c.blink, k = (((t + (B.phase || 0)) % B.period) + B.period) % B.period / B.period; if (k > (B.on || .5)) return; }
      if (c.fade) { const Fd = c.fade, k = ease(Math.min(1, Math.max(0, (t - (Fd.at || 0)) / (Fd.for || 1)))); op = lerp(Fd.from == null ? 0 : Fd.from, Fd.to == null ? 1 : Fd.to, k) * (op == null ? 1 : op); if (op <= .005) return; }
      const L = S._light || null, tint = (svg, col) => svg.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="' + col + '"');
      const rimOn = L && L.rim && c.rim !== false && !c.silhouette && (c.person || c.rim);
      const wrap = svg => op != null && op < 1 ? `<g opacity="${f(Math.max(0, op))}">${svg}</g>` : svg;
      if (c.person) {
        c.holdNow = null;
        if (c.hold) { c.holdNow = {}; Object.keys(c.hold).forEach(k => { const hh = c.hold[k]; if (!hh || (hh.from != null && t < hh.from) || (hh.to != null && t >= hh.to)) return; c.holdNow[k] = Object.assign({}, hh, { _v: valueAt(hh.value, t) }); }); }
        if (c.lying) {                                                   // lying on the back, face UP: head to the left, or to the right with lying: 'right'
          const dir = c.lying === 'right' ? 1 : -1;
          const bodyL = personBody(c, P), tr = `translate(${f(P.x + P.dx)} ${f(G + P.dy - h * .145)}) rotate(${f(dir * 90 + P.rot)}) scale(${f(1 + .03 * P.bk)} 1)`;
          if (rimOn) g += `<g transform="translate(0 ${f(-(L.width || 3))})"><g transform="${tr}">${tint(bodyL, L.rim)}</g></g>`;   // rim: a thin light edge on top
          g += wrap(`<g transform="${tr}">${sil(bodyL)}</g>`);
          return;
        }
        const body = personBody(c, P), tr = `translate(${f(P.x + P.dx)} ${f(G + P.dy)}) rotate(${f(P.rot)}) scale(${f(P.sx)} ${f(P.sy)})`;
        if (c.shadow !== false) {
          const lift = Math.max(0, -P.dy) / h;
          if (L && L.shadow) {                                          // a cast shadow on the floor, away from the light (flat, see-through)
            const sk = (L.side === 'R' ? 1 : -1) * (L.angle || 52);
            g += `<g opacity="${L.shadow}" transform="translate(${f(P.x + P.dx)} ${f(G)}) skewX(${sk}) scale(${f(P.sx)} ${f((L.length || .24) * (1 - lift))})">${tint(body, L.shadowColour || '#1b1712')}</g>`;
          }
          g += `<g transform="translate(${f(P.x + h * .02)} ${f(G)}) scale(${f(1 - lift * 1.2)} 1)">${shadowBody(h * .42)}</g>`;
        }
        if (rimOn) { const wd = L.width || 3, sd = L.side === 'R' ? 1 : -1; g += `<g transform="translate(${f(sd * wd)} ${f(-wd * .6)})"><g transform="${tr}">${tint(body, L.rim)}</g></g>` }   // rim light on the lit side
        g += wrap(`<g transform="${tr}">${sil(body)}</g>`);
      } else if (c.draw) {
        const o = c.origin || [540, 1000], sc = c.scale || 1;
        const body = assetBody(c, valueAt(c.value, t)), tr = `translate(${f(P.x + P.dx + cx)} ${f(G + P.dy + cy)}) rotate(${f(P.rot + (c.rot || 0))}) scale(${f(cs * sc * P.sx * (c.flip ? -1 : 1))} ${f(cs * sc * P.sy)}) translate(${-o[0]} ${-o[1]})`;
        if (rimOn) { const wd = L.width || 3, sd = L.side === 'R' ? 1 : -1; g += wrap(`<g transform="translate(${f(sd * wd)} ${f(-wd * .6)})"><g transform="${tr}">${tint(body, L.rim)}</g></g>`) }
        g += wrap(`<g transform="${tr}">${sil(body)}</g>`);
      }
    });
    return g;
  }
  /* WEATHER: snow, rain, dust or ash in three depths (far small and slow, near big and fast — the near ones get the
     front focus). Flat shapes only. weather: { kind: 'snow', amount: 70, speed: 1, colour, wind } */
  function weather(Wd, S, t, cam) {
    if (!Wd) return ['', '', ''];
    const kind = Wd.kind || 'snow', n = Wd.amount || 60, sp = Wd.speed || 1, wind = Wd.wind || 0, W = S.width, H = S.height;
    const col = Wd.colour || (kind === 'rain' ? '#c9d6e3' : kind === 'ash' ? '#6b6560' : kind === 'dust' ? '#e6dcc8' : '#f4f6f6');
    let seed = 13; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 };
    const out = ['', '', ''], depth = [[.45, .5, .55], [1, 1, .8], [1.9, 1.7, .9]];   // [size, speed, opacity] for far / mid / near
    for (let i = 0; i < n; i++) {
      const d = i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0, D = depth[d], x0 = rnd() * W, y0 = rnd() * H, ph = rnd() * 6.28, r0 = .6 + rnd() * .8;
      const fall = (kind === 'rain' ? 900 : kind === 'dust' ? 18 : 70) * sp * D[1], px = (cam.x - W / 2) * (d === 0 ? .3 : d === 1 ? .8 : 1.4);
      let y = ((y0 + fall * t) % (H + 120)) - 60; if (kind === 'dust') y = y0 + Math.sin(t * .4 + ph) * 30;
      const x = ((x0 + Math.sin(t * .9 + ph) * (kind === 'rain' ? 0 : 14) + wind * t * D[1] * 40 - px) % W + W) % W;
      if (kind === 'rain') out[d] += `<path d="M${f(x)},${f(y)} l${f(-6 - wind * 6)},${f(34 * D[0])}" stroke="${col}" stroke-width="${f(2 * D[0])}" opacity="${f(.45 * D[2])}"/>`;
      else { const r = (kind === 'dust' ? 1.6 : 3.4) * D[0] * r0; out[d] += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${col}" opacity="${f((kind === 'dust' ? .35 : .8) * D[2])}"/>` }
    }
    return out;
  }
  /** one shot: its own colour world, set, cast and camera. t = seconds since the shot started. */
  function shotSVG(S, sh, t) {
    const shell = shellOf(S, sh.bg || S.bg || '#c0612c'), cut = shell.lastIndexOf('<rect width=');
    const cam = camAt({ width: S.width, height: S.height, camera: sh.camera }, t);
    const A = sh.handheld || 0;                                         // a slow, slight handheld drift (no shake)
    if (A) { cam.x += A * (Math.sin(t * 1.3 + 1) + .5 * Math.sin(t * 2.7)); cam.y += A * .7 * Math.sin(t * 1.1 + 2); }
    // depth without blur: far things move less than the camera, near things more (parallax)
    const camT = k => { const z = 1 + (cam.zoom - 1) * k, x = S.width / 2 + (cam.x - S.width / 2) * k, y = S.height / 2 + (cam.y - S.height / 2) * k;
      return `<g transform="translate(${f(S.width / 2)} ${f(S.height / 2)}) scale(${f(z)}) translate(${f(-x)} ${f(-y)})">`; };
    // FOCUS (depth of field): a small blur on the layers that are out of focus. The subject plane stays sharp.
    const foc = focusAt(sh.focus, t), W = S.width, H = S.height;
    const soft = (px, id, inner) => {
      if (!px || px < .15) return inner;
      return `<filter id="dof${id}" filterUnits="userSpaceOnUse" x="-200" y="-200" width="${W + 400}" height="${H + 400}"><feGaussianBlur stdDeviation="${f(Math.min(px, 6))}"/></filter><g filter="url(#dof${id})">${inner}</g>`;
    };
    // AERIAL PERSPECTIVE: far things lose contrast and sink into the world colour (darker at night, bluer under water)
    const grade = gr => gr ? `<rect x="-6000" y="-6000" width="14000" height="14000" fill="${gr[0]}" opacity="${gr[1]}"/>` : '';
    S._light = sh.light || null;
    const cast = sh.cast || [], farCast = cast.filter(c => c.layer === 'far'),
      backCast = cast.filter(c => c.layer !== 'far' && c.plane === 'back'), mainCast = cast.filter(c => c.layer !== 'far' && c.plane !== 'back');
    let g = '';
    const wx = weather(sh.weather, S, t, cam);
    if (sh.far) g += soft(foc.far, 'f', camT(sh.farDepth || .45) + setBody(sh.id + '|far', sh.far, S) + castSVG(S, farCast, t) + grade(sh.grade && sh.grade.far) + '</g>' + wx[0]);
    g += soft(foc.set, 's', camT(1) + (sh.set ? setBody(sh.id + '|back', sh.set, S) : '') + castSVG(S, backCast, t) + grade(sh.grade && sh.grade.set) + '</g>');
    g += soft(foc.cast, 'c', camT(1) + castSVG(S, mainCast, t) + '</g>' + wx[1]);
    g += soft(foc.front, 'n', (sh.front ? camT(sh.frontDepth || 1.3) + setBody(sh.id + '|front', sh.front, S) + '</g>' : '') + wx[2]);
    return { head: shell.slice(0, cut) + g, tail: shell.slice(cut) };
  }
  /* captions: a few words at a time, the spoken word in the accent colour. Plain solid text — no glow, no blur. */
  function chunks(words) {
    const out = []; let cur = [];
    words.forEach((w, i) => { cur.push(w); const end = /[.,!?;:]$/.test(w[0]) || cur.length >= 3; if (end || i === words.length - 1) { out.push(cur); cur = []; } });
    return out;
  }
  function captionSVG(S, t) {
    const C = S.captions; if (!C || !C.words) return '';
    C._chunks = C._chunks || chunks(C.words);
    const ch = C._chunks.find((c, i) => t >= c[0][1] - .05 && t < Math.min(c[c.length - 1][2] + .35, (C._chunks[i + 1] || [[0, 1e9]])[0][1] - .05));
    if (!ch) return '';
    const size = C.size || 76, y = C.y || S.height * .2, esc = x => String(x).replace(/[<&]/g, m => m === '<' ? '&lt;' : '&amp;');
    const key = w => C.keys ? C.keys.indexOf(w[0].toLowerCase().replace(/[.,!?;:]/g, '')) >= 0 : (t >= w[1] && t < w[2] + .1);
    // captions must never be cut off: wrap to two lines, then shrink until the widest line fits 86% of the frame
    const maxW = S.width * .86, est = (ws, sz) => ws.reduce((a, w) => a + w[0].length * sz * .68, 0) + (ws.length - 1) * sz * .32;
    let lines = [ch], fs = size;
    if (est(ch, fs) > maxW && ch.length > 1) { let best = 1, bw = 1e9; for (let i = 1; i < ch.length; i++) { const m = Math.max(est(ch.slice(0, i), fs), est(ch.slice(i), fs)); if (m < bw) { bw = m; best = i } } lines = [ch.slice(0, best), ch.slice(best)] }
    const wid = Math.max.apply(null, lines.map(l => est(l, fs))); if (wid > maxW) fs = Math.floor(fs * maxW / wid);
    const pk = Math.min(1, Math.max(0, (t - ch[0][1] + .05) / .16)), pop = pk >= 1 ? 1 : .86 + .14 * backOut(pk);   // each group pops in
    return lines.map((ln, li) => { const yy = y + (li - (lines.length - 1) / 2) * fs * 1.12;
      const spans = ln.map(w => `<tspan fill="${key(w) ? (C.accent || '#f2b45a') : (C.colour || '#f6efe2')}">${esc(w[0].toUpperCase())}</tspan>`).join(' ');
      return `<text transform="translate(${S.width / 2} ${y}) scale(${f(pop)}) translate(${-S.width / 2} ${-y})" x="${S.width / 2}" y="${f(yy)}" text-anchor="middle" font-family="Montserrat, 'DejaVu Sans', Arial, sans-serif" font-weight="900" font-size="${fs}" letter-spacing="1" stroke="#2a1810" stroke-width="${fs * .16}" stroke-linejoin="round" paint-order="stroke">${spans}</text>`; }).join('');
  }

  function frame(S, t) {
    let sh = S.shots ? S.shots.find(x => t >= x.from && t < x.to) || S.shots[S.shots.length - 1] : null;
    const one = sh ? shotSVG(S, sh, t - sh.from) : shotSVG(S, { id: 'main', bg: S.bg, set: S.set, front: S.front, cast: S.cast, camera: S.camera }, t);
    return one.head + one.tail.replace('</svg>', captionSVG(S, t) + '</svg>');
  }

  function play(S, el) {
    const t0 = performance.now();
    (function tick() { const t = ((performance.now() - t0) / 1000) % (S.duration || 8); el.innerHTML = frame(S, t); requestAnimationFrame(tick); })();
  }

  root.FM = { frame, pose, play, ease, clear: () => cache.clear() };
})(typeof window !== 'undefined' ? window : globalThis);
