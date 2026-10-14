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

  /** where the actor is and how it stands at time t */
  function pose(c, t) {
    const P = { x: c.x || 0, dy: 0, rot: 0, sx: 1, sy: 1, dx: 0, arms: { L: (c.arms && c.arms.L) || HANG, R: (c.arms && c.arms.R) || HANG },
      legs: { L: ((c.stride && c.stride.L) || [0, 0]).slice(), R: ((c.stride && c.stride.R) || [0, 0]).slice() },
      head: Object.assign({ tilt: 0, turn: 0, nod: 0 }, c.head || {}), lean: c.lean || 0 };
    const sideV = isSide(c);
    // idle: slow breathing + a tiny sway, so nobody is ever frozen
    const ph = (c.seed || 1) * 1.7;
    P.sy = 1 + .007 * Math.sin(t * 2 * Math.PI / 3.1 + ph);
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
    const hold = c.holdNow || {}, hk = Object.keys(hold).map(k => k + ':' + (hold[k] ? hold[k].id : '')).join();
    const key = c.id + '|' + arms.L.map(Math.round) + '|' + arms.R.map(Math.round) + '|' + legs.L + '|' + legs.R + '|' + [head.tilt, head.turn, head.nod, lean] + '|' + hk;
    if (cache.has(key)) return cache.get(key);
    const held = {};
    Object.keys(hold).forEach(side => { const h = hold[side]; if (!h) return; const pb = assetBody(h), g = h.grip || [540, 540], sc = h.scale || .3;
      held[side] = (x, y, deg) => F.raw(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${((h.follow ? deg : 0) + (h.rot || 0)).toFixed(1)}) scale(${sc}) translate(${-g[0]} ${-g[1]})">${pb}</g>`); });
    F.begin({ width: 1080, height: 1080, seed: c.seed || 3 });
    F.person(Object.assign({}, c.person, c.lying === 'right' ? { face: -1 } : {}, { x: 540, ground: 1000, height: c.height || 500,
      arms: { L: arms.L.map(Math.round), R: arms.R.map(Math.round) }, stride: legs, head, lean, held }));
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
      const wrap = svg => op != null && op < 1 ? `<g opacity="${f(Math.max(0, op))}">${svg}</g>` : svg;
      if (c.person) {
        c.holdNow = null;
        if (c.hold) { c.holdNow = {}; Object.keys(c.hold).forEach(k => { const hh = c.hold[k]; if (!hh || (hh.from != null && t < hh.from) || (hh.to != null && t >= hh.to)) return; c.holdNow[k] = hh; }); }
        if (c.lying) {                                                   // lying on the back, face UP: head to the left, or to the right with lying: 'right'
          const dir = c.lying === 'right' ? 1 : -1;
          g += wrap(`<g transform="translate(${f(P.x + P.dx)} ${f(G + P.dy - h * .145)}) rotate(${f(dir * 90 + P.rot)})">${sil(personBody(c, P))}</g>`);
          return;
        }
        if (c.shadow !== false) {
          const lift = Math.max(0, -P.dy) / h;
          g += `<g transform="translate(${f(P.x + h * .02)} ${f(G)}) scale(${f(1 - lift * 1.2)} 1)">${shadowBody(h * .42)}</g>`;
        }
        g += wrap(`<g transform="translate(${f(P.x + P.dx)} ${f(G + P.dy)}) rotate(${f(P.rot)}) scale(${f(P.sx)} ${f(P.sy)})">${sil(personBody(c, P))}</g>`);
      } else if (c.draw) {
        const o = c.origin || [540, 1000], sc = c.scale || 1;
        g += wrap(`<g transform="translate(${f(P.x + P.dx + cx)} ${f(G + P.dy + cy)}) rotate(${f(P.rot + (c.rot || 0))}) scale(${f(cs * sc * P.sx * (c.flip ? -1 : 1))} ${f(cs * sc * P.sy)}) translate(${-o[0]} ${-o[1]})">${sil(assetBody(c))}</g>`);
      }
    });
    return g;
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
    const cast = sh.cast || [], farCast = cast.filter(c => c.layer === 'far'),
      backCast = cast.filter(c => c.layer !== 'far' && c.plane === 'back'), mainCast = cast.filter(c => c.layer !== 'far' && c.plane !== 'back');
    let g = '';
    if (sh.far) g += soft(foc.far, 'f', camT(sh.farDepth || .45) + setBody(sh.id + '|far', sh.far, S) + castSVG(S, farCast, t) + grade(sh.grade && sh.grade.far) + '</g>');
    g += soft(foc.set, 's', camT(1) + (sh.set ? setBody(sh.id + '|back', sh.set, S) : '') + castSVG(S, backCast, t) + grade(sh.grade && sh.grade.set) + '</g>');
    g += soft(foc.cast, 'c', camT(1) + castSVG(S, mainCast, t) + '</g>');
    if (sh.front) g += soft(foc.front, 'n', camT(sh.frontDepth || 1.3) + setBody(sh.id + '|front', sh.front, S) + '</g>');
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
    const spans = ch.map(w => `<tspan fill="${key(w) ? (C.accent || '#f2b45a') : (C.colour || '#f6efe2')}">${esc(w[0].toUpperCase())}</tspan>`).join(' ');
    const pk = Math.min(1, Math.max(0, (t - ch[0][1] + .05) / .16)), pop = pk >= 1 ? 1 : .86 + .14 * backOut(pk);   // each group pops in
    return `<text transform="translate(${S.width / 2} ${y}) scale(${f(pop)}) translate(${-S.width / 2} ${-y})" x="${S.width / 2}" y="${y}" text-anchor="middle" font-family="Montserrat, 'DejaVu Sans', Arial, sans-serif" font-weight="900" font-size="${size}" letter-spacing="1" stroke="#2a1810" stroke-width="${size * .16}" stroke-linejoin="round" paint-order="stroke">${spans}</text>`;
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
