/* =========================================================================
   LOW-POLY ENGINE — the locked drawing engine of the "Low-Poly Paper" style.
   An asset only calls the K.* functions below. The engine turns plain point
   lists into the look: every shape is cut into flat triangles and each
   triangle is shaded from ONE light at the top-left. No outlines, ever.

   Everything is recorded as a list of drawing ops (not as SVG text), so the
   stage can paint it to a canvas at any size, instantly and crisply.
   K.render() still gives you an SVG string (drawing.svg / String(drawing)).

   LOCKED FILE: assets USE it, they never edit it.
   ========================================================================= */
(function (root) {
  'use strict';
  var K = root.KIT = root.KIT || {};

  /* ---------------- seeded random (same seed = same picture) ---------------- */
  var seed = 11;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  K.rnd = rand;

  /* ---------------- colour ---------------- */
  function norm(c) {                       // accept '#abc', '#aabbcc', 0xaabbcc, 'rgb(1,2,3)'
    if (typeof c === 'number') return '#' + ('000000' + (c >>> 0).toString(16)).slice(-6);
    c = String(c || '#888888').trim();
    if (c[0] === '#') { if (c.length === 4) return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]; if (c.length === 7) return c.toLowerCase(); }
    var m = /^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(c); if (m) return rgb2hex([+m[1], +m[2], +m[3]]);
    return '#888888';
  }
  function hex2rgb(h) { h = norm(h); return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) }); }
  function rgb2hex(c) { return '#' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0') }).join(''); }
  /** shade('#3f6f73', 0.2) = lighter (warm), shade(c, -0.2) = darker (cool). Range -1..1 */
  function shade(hex, t) {
    var c = hex2rgb(hex), to = t > 0 ? [255, 246, 228] : [26, 22, 48], k = Math.min(1, Math.abs(t));
    return rgb2hex(c.map(function (v, i) { return v + (to[i] - v) * k }));
  }
  function mix(a, b, k) { a = hex2rgb(a); b = hex2rgb(b); return rgb2hex(a.map(function (v, i) { return v + (b[i] - v) * k })); }
  K.shade = shade; K.mix = K.mixColor = mix; K.norm = norm; K.hex2rgb = hex2rgb;

  /* ---------------- geometry ---------------- */
  function inside(p, poly) {
    var ok = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) ok = !ok;
    }
    return ok;
  }
  function bbox(poly) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (var i = 0; i < poly.length; i++) { var p = poly[i]; if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  function area(poly) { var a = 0; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]); return Math.abs(a / 2); }
  /** Bend a few control points into a soft closed curve (Catmull-Rom). */
  function smooth(pts, per) {
    per = per || 3; var out = [], n = pts.length;
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (var k = 0; k < per; k++) {
        var t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(function (d) { return .5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3) }));
      }
    }
    return out;
  }
  /** A rough round blob of `sides` corners: curls, buns, leaves, clouds, rocks. */
  function blob(cx, cy, r, sides) {
    sides = sides || 7; var a0 = rand() * 6.28, out = [];
    for (var i = 0; i < sides; i++) { var a = a0 + i / sides * 6.283, rr = r * (.8 + rand() * .35); out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return out;
  }
  K.smooth = smooth; K.blob = blob;
  var rect = function (x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; };
  var ellipse = function (cx, cy, rx, ry, n) { n = n || 16; var o = []; for (var i = 0; i < n; i++) o.push([cx + Math.cos(i / n * 6.283) * rx, cy + Math.sin(i / n * 6.283) * ry]); return o; };

  K.rect = rect; K.ellipse = ellipse;

  /* ---------------- Delaunay triangulation (Bowyer-Watson) ---------------- */
  function delaunay(pts) {
    var big = 1e5, P = pts.concat([[-big, -big], [big * 2, -big], [-big, big * 2]]), n = pts.length;
    function circ(t) {
      var a = P[t[0]], b = P[t[1]], c = P[t[2]];
      var d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
      var A = a[0] * a[0] + a[1] * a[1], B = b[0] * b[0] + b[1] * b[1], C = c[0] * c[0] + c[1] * c[1];
      var ux = (A * (b[1] - c[1]) + B * (c[1] - a[1]) + C * (a[1] - b[1])) / d;
      var uy = (A * (c[0] - b[0]) + B * (a[0] - c[0]) + C * (b[0] - a[0])) / d;
      return [ux, uy, (a[0] - ux) * (a[0] - ux) + (a[1] - uy) * (a[1] - uy)];
    }
    var tris = [[n, n + 1, n + 2]], circles = [circ(tris[0])];
    for (var i = 0; i < n; i++) {
      var p = P[i], bad = [], keep = [], keepC = [];
      for (var k = 0; k < tris.length; k++) {
        var cc = circles[k];
        if ((p[0] - cc[0]) * (p[0] - cc[0]) + (p[1] - cc[1]) * (p[1] - cc[1]) < cc[2]) bad.push(tris[k]); else { keep.push(tris[k]); keepC.push(cc); }
      }
      var edges = [];
      bad.forEach(function (t) {
        [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]].forEach(function (e) {
          var shared = false;
          for (var q = 0; q < bad.length; q++) { var o = bad[q]; if (o !== t && o.indexOf(e[0]) >= 0 && o.indexOf(e[1]) >= 0) { shared = true; break; } }
          if (!shared) edges.push(e);
        });
      });
      tris = keep; circles = keepC;
      for (var q2 = 0; q2 < edges.length; q2++) { var t2 = [edges[q2][0], edges[q2][1], i]; tris.push(t2); circles.push(circ(t2)); }
    }
    var out = [];
    for (var z = 0; z < tris.length; z++) { var tt = tris[z]; if (tt[0] < n && tt[1] < n && tt[2] < n) out.push([P[tt[0]], P[tt[1]], P[tt[2]]]); }
    return out;
  }

  /* ---------------- materials: how big the triangles are and how strong the shading is ---------------- */
  var MATERIALS = {
    cloth:  { step: 44, sx: 32, sy: 100, light: 1.0 },   // shirts, trousers, sleeves: long folds along `dir`
    drape:  { step: 60, sx: 46, sy: 170, light: 1.0 },   // long skirts, curtains, capes: very long folds
    knit:   { step: 38, sx: 30, sy: 80,  light: .85 },   // sweaters, cardigans: softer folds
    skin:   { step: 30, sx: 30, sy: 30,  light: .5  },   // faces, hands, legs: calm, few creases
    hair:   { step: 24, sx: 20, sy: 50,  light: 1.6 },   // strong contrast so facets show
    shoe:   { step: 28, sx: 28, sy: 28,  light: .6  },
    hard:   { step: 70, sx: 70, sy: 70,  light: .9  },   // wood, metal, plastic, stone: big flat facets
    leaf:   { step: 22, sx: 22, sy: 40,  light: 1.3 },   // plants, grass
    detail: { step: 16, sx: 16, sy: 16,  light: .5  }    // small things: cuffs, collars, ears, buttons
  };
  K.MATERIALS = MATERIALS;

  /* ---------------- drawing state ---------------- */
  var out = [], W = 1024, H = 1536, BG = '#ab9c87', GRAIN = true, TRANS = false;
  /** while true, K.begin ignores bg/grain: assets are always transparent cut-outs */
  K.transparent = function (on) { TRANS = !!on; };

  /** Start a new picture. Call this first. */
  K.begin = function (o) {
    o = o || {}; W = +o.width || 1024; H = +o.height || 1536; BG = o.bg || '#ab9c87'; GRAIN = o.grain !== false;
    if (o.bg === 'none') BG = 'none';
    seed = root.K_SEED || o.seed || 11; out = [];
  };

  /**
   * part(points, colour, options) — THE main call. Draws one shape as shaded triangles.
   *   points : [[x,y], ...] outline (at least 3 points)
   *   options: { material, dir, smooth, folds:[[x,y],...], light, round, step }
   */
  K.part = function (points, colour, opt) {
    opt = opt || {}; colour = norm(colour);
    var poly = opt.smooth ? smooth(points) : points;
    if (!poly || poly.length < 3) return;
    var m = {}, base = MATERIALS[opt.material || 'cloth'] || MATERIALS.cloth, k0;
    for (k0 in base) m[k0] = base[k0]; for (k0 in opt) m[k0] = opt[k0];
    var step = m.step, b = bbox(poly), w = b.x1 - b.x0, h = b.y1 - b.y0, pts = [], per = 0, i;
    for (i = 0; i < poly.length; i++) { var q = poly[(i + 1) % poly.length]; per += Math.hypot(q[0] - poly[i][0], q[1] - poly[i][1]); }
    var est = area(poly) / Math.max(1, m.sx * m.sy) + per / (step * .75);     // guard: never let one shape get so dense that it is slow
    if (est > 900) { var f = Math.sqrt(est / 900); step *= f; m.sx *= f; m.sy *= f; }
    for (i = 0; i < poly.length; i++) {                                         // points along the outline
      var x0 = poly[i][0], y0 = poly[i][1], x1 = poly[(i + 1) % poly.length][0], y1 = poly[(i + 1) % poly.length][1];
      var L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / (step * .75)));
      for (var k = 0; k < n; k++) if (k === 0 || rand() < .85) pts.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
    }
    var ang = (m.dir === undefined ? 90 : m.dir) * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
    var mx = (b.x0 + b.x1) / 2, my = (b.y0 + b.y1) / 2, R = Math.hypot(w, h) / 2 + step;
    for (var a = -R; a < R; a += m.sy) for (var c = -R; c < R; c += m.sx) {     // points inside, on a rotated grid
      var aa = a + (rand() - .5) * m.sy * .8, cc = c + (rand() - .5) * m.sx * .6, p = [mx + aa * ca - cc * sa, my + aa * sa + cc * ca];
      if (inside(p, poly)) pts.push(p);
    }
    (m.folds || []).forEach(function (p2) { pts.push(p2); });
    var tris = [], T = delaunay(pts), rnd = m.round === undefined ? .42 : m.round, lightK = m.light;
    for (var ti = 0; ti < T.length; ti++) {
      var t = T[ti], cx = (t[0][0] + t[1][0] + t[2][0]) / 3, cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
      if (!inside([cx, cy], poly)) continue;
      var u = (cx - b.x0) / (w || 1), v = (cy - b.y0) / (h || 1);
      var round = 1 - Math.pow(Math.abs(2 * u - rnd * 2), 2);
      var es = [0, 1, 2].map(function (j) { return [t[(j + 1) % 3][0] - t[j][0], t[(j + 1) % 3][1] - t[j][1]] }).sort(function (pp, qq) { return Math.hypot(qq[0], qq[1]) - Math.hypot(pp[0], pp[1]) });
      var face = Math.cos(Math.atan2(es[0][1], es[0][0]) + Math.PI / 2 - Math.atan2(-.8, -.6));
      var kk = .085 * face + .08 * round - .15 * Math.max(0, u - .62) - .05 * v + (rand() - .5) * .05;
      if (rand() < .06) kk -= .07;
      kk *= lightK;
      tris.push([t[0][0] + (t[0][0] - cx) * .02, t[0][1] + (t[0][1] - cy) * .02, t[1][0] + (t[1][0] - cx) * .02, t[1][1] + (t[1][1] - cy) * .02, t[2][0] + (t[2][0] - cx) * .02, t[2][1] + (t[2][1] - cy) * .02, shade(colour, kk)]);
    }
    out.push({ t: 'part', poly: poly, base: shade(colour, -.1), tris: tris });
  };
  /** flat(points, colour, opacity) — one solid shape, no triangles. For tiny details and shadows. */
  K.flat = function (points, colour, opacity) { out.push({ t: 'flat', poly: points, c: norm(colour), o: opacity === undefined ? 1 : opacity }); };
  /** line(points, colour, width) — open stroke, for seams, mouths, braids, strings. Use sparingly. */
  K.line = function (points, colour, width, opacity) { out.push({ t: 'line', pts: points, c: norm(colour), w: width || 3, o: opacity === undefined ? 1 : opacity }); };
  /** circle(x, y, r, colour) — buttons, earrings, eye shines. */
  K.circle = function (x, y, r, colour, opacity) { out.push({ t: 'circle', x: x, y: y, r: r, c: norm(colour), o: opacity === undefined ? 1 : opacity }); };
  /** ring(x, y, r, colour, width) — hoop earrings, rings, wheels. */
  K.ring = function (x, y, r, colour, width) { out.push({ t: 'ring', x: x, y: y, r: r, c: norm(colour), w: width || 3 }); };
  /** shadow(x, y, width) — the soft brushy shadow under feet or objects. Draw it FIRST. */
  K.shadow = function (x, y, wdt) {
    var rx = (wdt || 380) / 2, sp = [];
    for (var i = 0; i < 9; i++) sp.push([x - rx + rand() * rx * 2, y + (rand() - .5) * 10, 10 + rand() * 30, 2 + rand() * 3]);
    out.push({ t: 'shadow', x: x, y: y, rx: rx, sp: sp });
  };
  /** group(transform, fn) — draw inside an SVG-style transform, e.g. group('rotate(10 500 600)', () => {...}) */
  K.group = function (transform, fn) {
    var saved = out, g = { t: 'group', m: parseTransform(transform), ops: [] };
    saved.push(g); out = g.ops;
    try { fn(); } finally { out = saved; }
  };
  /** raw path op (used by the face kit): d = SVG path text */
  K.path = function (d, o) { o = o || {}; out.push({ t: 'path', d: d, f: o.fill ? norm(o.fill) : null, s: o.stroke ? norm(o.stroke) : null, w: o.width || 3, o: o.opacity === undefined ? 1 : o.opacity, cap: o.cap }); };
  K.ovalop = function (cx, cy, rx, ry, colour, opacity) { out.push({ t: 'oval', cx: cx, cy: cy, rx: rx, ry: ry, c: norm(colour), o: opacity === undefined ? 1 : opacity }); };
  /** capture(fn) — run drawing calls and get the ops back instead of adding them to the picture. */
  K.capture = function (fn) { var saved = out; out = []; try { fn(); } finally { var r = out; out = saved; } return { w: W, h: H, ops: r }; };

  /* ---------------- transforms ---------------- */
  function mmul(A, B) { return [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]]; }
  function parseTransform(s) {
    var M = [1, 0, 0, 1, 0, 0], re = /(\w+)\s*\(([^)]*)\)/g, m;
    while ((m = re.exec(String(s || '')))) {
      var n = m[2].split(/[\s,]+/).filter(function (x) { return x !== '' }).map(Number), T;
      if (m[1] === 'translate') T = [1, 0, 0, 1, n[0] || 0, n[1] || 0];
      else if (m[1] === 'scale') T = [n[0], 0, 0, n.length > 1 ? n[1] : n[0], 0, 0];
      else if (m[1] === 'rotate') { var a = (n[0] || 0) * Math.PI / 180, c = Math.cos(a), sn = Math.sin(a), cx = n[1] || 0, cy = n[2] || 0; T = [c, sn, -sn, c, cx - c * cx + sn * cy, cy - sn * cx - c * cy]; }
      else if (m[1] === 'matrix') T = n;
      else continue;
      M = mmul(M, T);
    }
    return M;
  }
  K.parseTransform = parseTransform; K.mmul = mmul;

  /* ---------------- bounding box of a drawing ---------------- */
  function opsBBox(ops, M, acc) {
    acc = acc || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; M = M || [1, 0, 0, 1, 0, 0];
    function add(x, y) { var X = M[0] * x + M[2] * y + M[4], Y = M[1] * x + M[3] * y + M[5]; if (X < acc.x0) acc.x0 = X; if (X > acc.x1) acc.x1 = X; if (Y < acc.y0) acc.y0 = Y; if (Y > acc.y1) acc.y1 = Y; }
    for (var i = 0; i < ops.length; i++) {
      var o = ops[i], j;
      if (o.t === 'part' || o.t === 'flat') for (j = 0; j < o.poly.length; j++) add(o.poly[j][0], o.poly[j][1]);
      else if (o.t === 'line') for (j = 0; j < o.pts.length; j++) { add(o.pts[j][0] - o.w / 2, o.pts[j][1] - o.w / 2); add(o.pts[j][0] + o.w / 2, o.pts[j][1] + o.w / 2); }
      else if (o.t === 'circle') { add(o.x - o.r, o.y - o.r); add(o.x + o.r, o.y + o.r); }
      else if (o.t === 'ring') { var rr = o.r + o.w / 2; add(o.x - rr, o.y - rr); add(o.x + rr, o.y + rr); }
      else if (o.t === 'shadow') { add(o.x - o.rx, o.y - 16); add(o.x + o.rx, o.y + 16); }
      else if (o.t === 'oval') { add(o.cx - o.rx, o.cy - o.ry); add(o.cx + o.rx, o.cy + o.ry); }
      else if (o.t === 'group') opsBBox(o.ops, mmul(M, o.m), acc);
    }
    return acc;
  }
  K.opsBBox = function (ops) { var b = opsBBox(ops); return b.x1 < b.x0 ? null : b; };

  /* ---------------- paint ops to a canvas (the crisp, fast way) ---------------- */
  function polyPath(ctx, poly) { ctx.moveTo(poly[0][0], poly[0][1]); for (var i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]); ctx.closePath(); }
  function paint(ctx, ops) {
    for (var i = 0; i < ops.length; i++) {
      var o = ops[i], j;
      switch (o.t) {
        case 'part':
          ctx.save(); ctx.beginPath(); polyPath(ctx, o.poly); ctx.clip();
          ctx.fillStyle = o.base; ctx.fill();
          for (j = 0; j < o.tris.length; j++) { var t = o.tris[j]; ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(t[2], t[3]); ctx.lineTo(t[4], t[5]); ctx.closePath(); ctx.fillStyle = t[6]; ctx.fill(); }
          ctx.restore(); break;
        case 'flat': ctx.globalAlpha = o.o; ctx.fillStyle = o.c; ctx.beginPath(); polyPath(ctx, o.poly); ctx.fill(); ctx.globalAlpha = 1; break;
        case 'line':
          ctx.globalAlpha = o.o; ctx.strokeStyle = o.c; ctx.lineWidth = o.w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
          ctx.moveTo(o.pts[0][0], o.pts[0][1]); for (j = 1; j < o.pts.length; j++) ctx.lineTo(o.pts[j][0], o.pts[j][1]); ctx.stroke(); ctx.globalAlpha = 1; break;
        case 'circle': ctx.globalAlpha = o.o; ctx.fillStyle = o.c; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; break;
        case 'ring': ctx.strokeStyle = o.c; ctx.lineWidth = o.w; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.2832); ctx.stroke(); break;
        case 'oval': ctx.globalAlpha = o.o; ctx.fillStyle = o.c; ctx.beginPath(); ctx.ellipse(o.cx, o.cy, o.rx, o.ry, 0, 0, 6.2832); ctx.fill(); ctx.globalAlpha = 1; break;
        case 'shadow': {
          ctx.save(); ctx.translate(o.x, o.y); ctx.scale(1, 20 / o.rx);
          var g = ctx.createRadialGradient(0, 0, 0, 0, 0, o.rx); g.addColorStop(0, 'rgba(93,81,68,.46)'); g.addColorStop(.55, 'rgba(93,81,68,.34)'); g.addColorStop(1, 'rgba(93,81,68,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, o.rx, 0, 6.2832); ctx.fill(); ctx.restore();
          ctx.fillStyle = 'rgba(93,81,68,.35)';
          for (j = 0; j < o.sp.length; j++) { var s = o.sp[j]; ctx.beginPath(); ctx.ellipse(s[0], s[1], s[2], s[3], 0, 0, 6.2832); ctx.fill(); }
          break; }
        case 'path': {
          var p = new Path2D(o.d); ctx.globalAlpha = o.o;
          if (o.f) { ctx.fillStyle = o.f; ctx.fill(p); }
          if (o.s) { ctx.strokeStyle = o.s; ctx.lineWidth = o.w; ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round'; ctx.stroke(p); }
          ctx.globalAlpha = 1; break; }
        case 'group': ctx.save(); ctx.transform(o.m[0], o.m[1], o.m[2], o.m[3], o.m[4], o.m[5]); paint(ctx, o.ops); ctx.restore(); break;
      }
    }
  }
  K.paint = paint;

  /**
   * rasterize(drawing, {scale, crop, pad}) -> { canvas, ox, oy, scale, w, h }
   * Paints the drawing once into a canvas. (ox, oy) = where the canvas top-left sits in drawing pixels.
   * crop (default true) trims to the visible content; false keeps the whole drawing area (for backdrops).
   */
  K.rasterize = function (dr, o) {
    o = o || {}; var sc = o.scale || 1, pad = o.pad === undefined ? 2 : o.pad, b;
    if (o.crop === false) b = { x0: 0, y0: 0, x1: dr.w, y1: dr.h };
    else { b = opsBBox(dr.ops); if (b.x1 < b.x0) b = { x0: 0, y0: 0, x1: 4, y1: 4 }; }
    var x0 = Math.floor(b.x0 - pad), y0 = Math.floor(b.y0 - pad), x1 = Math.ceil(b.x1 + pad), y1 = Math.ceil(b.y1 + pad);
    var w = Math.max(2, x1 - x0), h = Math.max(2, y1 - y0);
    sc = Math.min(sc, 4096 / w, 4096 / h);
    var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * sc)); c.height = Math.max(1, Math.ceil(h * sc));
    var ctx = c.getContext('2d'); ctx.scale(sc, sc); ctx.translate(-x0, -y0);
    paint(ctx, dr.ops);
    return { canvas: c, ox: x0, oy: y0, scale: sc, w: w, h: h };
  };

  /* ---------------- SVG text (for the viewer, for sharing) ---------------- */
  function f1(v) { return (+v).toFixed(1); }
  function pathOf(pts) { return 'M' + pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]) }).join(' L') + 'Z'; }
  function toSVG(dr) {
    var id = 0, defs = '';
    function el(ops) {
      var s = '';
      ops.forEach(function (o) {
        var j;
        if (o.t === 'part') {
          var cid = 'c' + (id++); defs += '<clipPath id="' + cid + '"><path d="' + pathOf(o.poly) + '"/></clipPath>';
          s += '<g clip-path="url(#' + cid + ')"><path d="' + pathOf(o.poly) + '" fill="' + o.base + '"/>';
          o.tris.forEach(function (t) { s += '<path d="M' + f1(t[0]) + ',' + f1(t[1]) + ' L' + f1(t[2]) + ',' + f1(t[3]) + ' L' + f1(t[4]) + ',' + f1(t[5]) + 'Z" fill="' + t[6] + '"/>'; });
          s += '</g>';
        } else if (o.t === 'flat') s += '<path d="' + pathOf(o.poly) + '" fill="' + o.c + '" opacity="' + o.o + '"/>';
        else if (o.t === 'line') s += '<path d="M' + o.pts.map(function (p) { return p[0] + ',' + p[1] }).join(' L') + '" fill="none" stroke="' + o.c + '" stroke-width="' + o.w + '" stroke-linecap="round" stroke-linejoin="round" opacity="' + o.o + '"/>';
        else if (o.t === 'circle') s += '<circle cx="' + o.x + '" cy="' + o.y + '" r="' + o.r + '" fill="' + o.c + '" opacity="' + o.o + '"/>';
        else if (o.t === 'ring') s += '<circle cx="' + o.x + '" cy="' + o.y + '" r="' + o.r + '" fill="none" stroke="' + o.c + '" stroke-width="' + o.w + '"/>';
        else if (o.t === 'oval') s += '<ellipse cx="' + o.cx + '" cy="' + o.cy + '" rx="' + o.rx + '" ry="' + o.ry + '" fill="' + o.c + '" opacity="' + o.o + '"/>';
        else if (o.t === 'shadow') { s += '<ellipse cx="' + o.x + '" cy="' + o.y + '" rx="' + o.rx + '" ry="16" fill="#5d5144" opacity=".42" filter="url(#soft)"/>'; for (j = 0; j < o.sp.length; j++) s += '<ellipse cx="' + f1(o.sp[j][0]) + '" cy="' + f1(o.sp[j][1]) + '" rx="' + f1(o.sp[j][2]) + '" ry="' + f1(o.sp[j][3]) + '" fill="#5d5144" opacity=".35"/>'; }
        else if (o.t === 'path') s += '<path d="' + o.d + '" fill="' + (o.f || 'none') + '"' + (o.s ? ' stroke="' + o.s + '" stroke-width="' + o.w + '" stroke-linecap="round"' : '') + ' opacity="' + o.o + '"/>';
        else if (o.t === 'group') s += '<g transform="matrix(' + o.m.join(' ') + ')">' + el(o.ops) + '</g>';
      });
      return s;
    }
    var body = el(dr.ops);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + dr.w + ' ' + dr.h + '" width="' + dr.w + '" height="' + dr.h + '" role="img" aria-label="' + String(dr.label || '').replace(/"/g, '') + '"><defs><filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>' + defs + '</defs>' +
      (dr.bg ? '<rect width="' + dr.w + '" height="' + dr.h + '" fill="' + dr.bg + '"/>' : '') + body + '</svg>';
  }
  K.toSVG = toSVG;

  /** render() — finish the picture. Call this LAST: return K.render('what it shows'). */
  K.render = function (label) {
    var dr = { w: W, h: H, ops: out, label: label || 'Low-poly illustration', bg: (TRANS || BG === 'none') ? null : BG, grain: GRAIN && !TRANS && BG !== 'none' };
    dr.toString = function () { return toSVG(dr); };
    Object.defineProperty(dr, 'svg', { get: function () { return toSVG(dr); } });
    return dr;
  };
  /** paint a whole drawing (with its background) onto a canvas context, for viewers and sheets */
  K.paintDrawing = function (ctx, dr) { if (dr.bg) { ctx.fillStyle = dr.bg; ctx.fillRect(0, 0, dr.w, dr.h); } paint(ctx, dr.ops); };

  /* ---------------- palette ---------------- */
  K.PALETTE = {
    background: '#ab9c87', shadow: '#5d5144',
    skin: { deep: '#6f4130', brown: '#8f5638', warm: '#a8694a', tan: '#c58a63', light: '#e2b597' },
    hair: { black: '#231713', darkBrown: '#2a1d18', brown: '#6b4630', blonde: '#d8b66a', grey: '#8f8a84' },
    cloth: { teal: '#3f6f73', navy: '#34466b', denim: '#6f8fbf', sky: '#a9bfe0', mustard: '#c99a3e', rust: '#b7714f',
             terracotta: '#b0603e', plum: '#7b5b78', sage: '#7f9878', olive: '#6f7a4a', rose: '#c98a86', cream: '#ede3d1',
             sand: '#c8b48e', khaki: '#cbb38f', charcoal: '#3b3d42', white: '#efe9de' },
    wood: '#8a5a3a', metal: '#9aa1a6', gold: '#d9a94a', leaf: '#5f7d4e', pot: '#b56a48', stone: '#8d8a83'
  };
  /* the same nine skin tones and eight hair colours as the plan uses (index 0..8 / 0..7) */
  K.SKIN = ['#c58a63', '#8f5638', '#d4a07a', '#6f4130', '#eccab0', '#e2b597', '#a8694a', '#5a3a2a', '#43291d'];
  K.HAIR = ['#231713', '#2a1d18', '#3a2416', '#6b4630', '#d8b66a', '#8a4a2c', '#8f8a84', '#d6d0c6'];
  K.PAL = K.PALETTE;

  /* ---------------- HEADS: one shared recipe so every character matches ----------------
     Heads are designed facing the viewer's RIGHT in a fixed local box (centre 530,267),
     then moved, scaled, tilted and (for dir:-1) mirrored. */
  function pose(o) {   // o: {x, y, size, tilt, dir}
    var s = (o.size || 240) / 214, d = o.dir === -1 ? -1 : 1;
    return 'translate(' + o.x + ' ' + o.y + ') rotate(' + (o.tilt || 0) + ') scale(' + (s * d) + ' ' + s + ') translate(-530 -267)';
  }
  K.pose = pose;
  var HEAD_SHAPES = {
    square: [[470, 200], [505, 160], [560, 165], [592, 205], [598, 262], [588, 315], [560, 355], [522, 374], [490, 360], [470, 320], [462, 262]],
    soft:   [[470, 200], [505, 160], [560, 165], [590, 205], [596, 262], [586, 312], [560, 350], [524, 370], [494, 356], [472, 320], [462, 262]],
    round:  [[468, 206], [502, 164], [560, 166], [594, 208], [602, 266], [592, 320], [562, 358], [524, 372], [488, 358], [466, 318], [460, 262]]
  };
  /** nose size: the nose is part of the head, so it is scaled around its base point */
  function noseOps(SKD, size) {
    size = size || 1;
    K.group('translate(584 288) scale(' + size + ') translate(-584 -288)', function () { K.flat([[584, 272], [602, 301], [588, 307], [578, 301]], SKD, .85); });
  }
  /**
   * head(h, look) — draws the head, ear and face.
   *   h    : {x, y, size, tilt, dir}  centre of the head on the canvas, head height in px (default 240)
   *   look : {skin, shape:'square'|'soft'|'round', brow, lashes, lips, earring:'hoop'|'stud', metal,
   *           beard:'stubble'|'beard'|'goatee'|'mustache', beardColor, glasses:'round'|'square', nose, features:false}
   */
  K.head = function (h, look) {
    look = look || {};
    var SK = norm(look.skin || '#a8694a'), SKD = shade(SK, -.22), BR = norm(look.brow || '#2a1d18'), BC = norm(look.beardColor || look.brow || '#2a1d18');
    K.group(pose(h), function () {
      K.part(HEAD_SHAPES[look.shape || 'square'], SK, { material: 'skin', smooth: true, round: .55 });
      K.part([[446, 262], [466, 246], [474, 302], [454, 306]], SK, { material: 'detail' });          // ear
      K.flat([[452, 270], [464, 262], [466, 292], [456, 294]], SKD);
      K.flat([[468, 320], [490, 356], [520, 372], [506, 382], [474, 350]], SKD, .5);                  // jaw shadow
      beardOps(look.beard, BC);
      if (look.features !== false) K.faceFeatures(look.face || {}, look, SK, SKD, BR);
      else if (!look.nonose) noseOps(SKD, look.nose);
      var M = norm(look.metal || '#d9a94a');
      if (look.earring === 'hoop') K.ring(456, 318, 11, M, 3.5);
      if (look.earring === 'stud') K.circle(458, 306, 4, M);
    });
  };
  function beardOps(kind, BC) {
    if (!kind) return;
    if (kind === 'stubble') K.flat([[474, 322], [492, 352], [522, 370], [556, 352], [578, 322], [560, 334], [522, 346], [490, 336]], shade(BC, .25), .45);
    else if (kind === 'beard') { K.part([[466, 296], [472, 340], [496, 368], [526, 380], [558, 366], [586, 338], [600, 312], [584, 322], [562, 328], [540, 332], [516, 330], [490, 320], [476, 300]], BC, { material: 'hair', step: 18 }); }
    else if (kind === 'goatee') K.part([[510, 340], [538, 336], [568, 338], [562, 362], [538, 378], [514, 366]], BC, { material: 'hair', step: 14 });
    else if (kind === 'mustache') K.flat([[538, 318], [560, 313], [592, 314], [588, 325], [562, 322], [544, 327]], BC);
  }
  /**
   * The eyes, brows, mouth and glasses. Shared by the still head() and by the live faces of rigs.
   * e = { blink 0..1, happy 0/1, brow -1..1, ba (brow angle, radians), smile -1..1, open 0..1, blush 0..1, look -1..1, wide 0..1 }
   */
  K.faceFeatures = function (e, o, SK, SKD, BR) {
    e = e || {}; o = o || {};
    var blink = Math.max(0, Math.min(1, e.blink || 0)), happy = e.happy || 0, bl = (e.brow || 0) * 9, ba = e.ba || 0, sm = e.smile === undefined ? .5 : e.smile, op = e.open || 0, wide = e.wide || 0;
    var blush = e.blush === undefined ? 0 : e.blush;
    if (o.blush !== false) { K.ovalop(506, 302, 22, 11, '#c96a5c', .26 + .34 * blush); K.ovalop(582, 300, 12, 9, '#c96a5c', .22 + .3 * blush); }
    K.group('translate(0 ' + (-bl) + ')', function () {
      K.group('rotate(' + (ba * 57.3) + ' 522 240)', function () { K.flat([[494, 244], [520, 232], [550, 236], [550, 247], [520, 245], [496, 254]], BR); });
      K.group('rotate(' + (-ba * 57.3) + ' 580 239)', function () { K.flat([[562, 236], [584, 232], [594, 240], [566, 246]], BR); });
    });
    var eyes = o.eyes === 'closed' ? 'closed' : null;
    if (happy > .5) {                                                       // laughing eyes: upside-down arcs
      K.path('M502,272 Q521,254 542,270 M561,268 Q575,253 590,266', { stroke: '#1c1412', width: 5 });
    } else {
      var k = eyes ? 0 : (1 - blink) * (1 - happy * .5) * (e.eye === undefined ? 1 : e.eye) * (1 + .28 * wide);
      if (k > .12) {
        var sy = Math.min(1.35, k);
        K.group('translate(0 ' + (269 * (1 - sy)) + ') scale(1 ' + sy + ')', function () {
          K.path('M500,270 Q522,252 542,267 Q522,286 500,270Z', { fill: '#1c1412' }); K.path('M560,267 Q575,254 590,265 Q575,282 560,267Z', { fill: '#1c1412' });
        });
        if (k > .55) { K.circle(532 + (e.look || 0) * 3, 265, 3.6, '#ffffff'); K.circle(584 + (e.look || 0) * 3, 263, 3.2, '#ffffff'); }
        var q = 1 - Math.min(1, k);
        K.path('M496,' + (264 + 8 * q) + ' Q520,' + (246 + 22 * q) + ' 546,' + (261 + 8 * q) + ' M556,' + (261 + 8 * q) + ' Q574,' + (248 + 20 * q) + ' 594,' + (259 + 8 * q), { stroke: '#1c1412', width: o.lashes ? 5 : 3.5 });
      } else {
        K.path('M500,268 Q521,280 543,266 M560,266 Q575,278 591,264', { stroke: '#1c1412', width: 4 });
        if (!eyes) K.path('M502,262 Q522,256 541,262 M562,261 Q576,256 590,260', { stroke: SKD, width: 3, opacity: .7 });
      }
      if (o.lashes) K.path('M546,' + (261 + 8 * blink) + ' L556,' + (252 + 8 * blink) + ' M594,' + (259 + 8 * blink) + ' L602,' + (251 + 8 * blink), { stroke: '#1c1412', width: 3.5 });
    }
    if (o.glasses) {                                                         // thin round / square frames
      var gc = norm(o.glassColor || '#3b3d42');
      if (o.glasses === 'square') { K.path('M492,250 L546,250 L546,284 L492,284Z M554,250 L600,250 L600,282 L554,282Z M546,262 L554,262', { stroke: gc, width: 3.2 }); }
      else { K.ring(520, 268, 24, gc, 3.2); K.ring(578, 266, 21, gc, 3.2); K.path('M544,264 Q549,258 556,262', { stroke: gc, width: 3 }); }
    }
    noseOps(SKD, o.nose);
    if (op > .06) {                                                          // talking / laughing / surprise: an open mouth
      var hh = 6 + 26 * op, w = 4 * sm;
      if (sm < 0) {                                                          // sad / scared while talking: corners down, top arched
        var cy = 327 - sm * 5, ty = 324 + sm * 7, by = 327 + hh * .75, ww = 18 + 6 * op;
        K.path('M' + (560 - ww) + ',' + cy + ' Q560,' + ty + ' ' + (560 + ww) + ',' + cy + ' Q560,' + by + ' ' + (560 - ww) + ',' + cy + 'Z', { fill: '#5a2420' });
      } else {
      K.path('M' + (536 - w) + ',' + (325 - sm * 2) + ' Q560,' + (331 + hh) + ' ' + (584 + w) + ',' + (321 - sm * 2) + ' Q560,' + (327 + sm * 3) + ' ' + (536 - w) + ',' + (325 - sm * 2) + 'Z', { fill: '#5a2420' });
      if (op > .3) K.path('M' + (540 - w) + ',325 Q560,' + (329 + sm * 2) + ' ' + (580 + w) + ',322 L' + (578 + w) + ',327 Q560,333 ' + (542 - w) + ',329Z', { fill: '#f4ede1' });
      }
    } else {
      if (o.lips) K.path('M538,328 Q560,322 582,324 Q562,' + (336 + 6 * sm) + ' 538,328Z', { fill: o.lips });
      if (o.mouth === 'flat') K.path('M542,330 Q560,333 578,329', { stroke: '#5a2c22', width: 3.4 });
      else K.path('M538,' + (327 - sm * 2) + ' Q560,' + (328 + 10 * sm) + ' 582,' + (323 - sm * 2), { stroke: '#5a2c22', width: 3.6 });
    }
  };

  /** neck(h, {skin, bottom, width}) — neck placed exactly under the chin of head pose h. Draw it BEFORE head(). */
  K.neck = function (h, o) {
    o = o || {};
    var s = (h.size || 240) / 214, d = h.dir === -1 ? -1 : 1, t = (h.tilt || 0) * Math.PI / 180;
    var px = (526 - 530) * s * d, py = (330 - 267) * s;
    var cx = h.x + px * Math.cos(t) - py * Math.sin(t), top = h.y + px * Math.sin(t) + py * Math.cos(t);
    var SK = norm(o.skin || '#a8694a'), w = (o.width || 56 * s) / 2, bot = o.bottom || 470;
    K.part([[cx - w, top], [cx + w, top], [cx + w + 6, bot], [cx - w - 6, bot]], SK, { material: 'skin' });
    K.flat([[cx - w, top + 30], [cx + w, top + 30], [cx + w + 2, top + 64], [cx - w - 2, top + 64]], shade(SK, -.22), .7);
  };

  /* ---------------- HAIR presets (same head box as head()) ---------------- */
  var BRAID_BACK = [[582, 162], [556, 107], [504, 87], [449, 107], [424, 163], [404, 262], [378, 380], [364, 507], [382, 582], [422, 571], [440, 443], [469, 352], [556, 352], [587, 443], [609, 571], [651, 582], [665, 507], [649, 380], [624, 262]];
  var LONG_BACK = [[580, 170], [556, 128], [504, 114], [452, 128], [428, 170], [408, 262], [392, 380], [396, 470], [430, 500], [446, 420], [469, 352], [556, 352], [580, 420], [596, 500], [630, 470], [634, 380], [620, 262]];
  var BOB_BACK = [[580, 170], [556, 128], [504, 114], [452, 128], [428, 170], [412, 250], [410, 330], [420, 372], [452, 380], [469, 340], [556, 340], [584, 372], [616, 376], [630, 330], [624, 250]];
  /** hairBack(h, {style, colour, metal}) — the part of the hair BEHIND the body. Draw it BEFORE the body. Styles with a back part: 'braids', 'long', 'bob', 'ponytail'. */
  K.hairBack = function (h, o) {
    o = o || {}; var C = norm(o.colour || '#231713'), M = norm(o.metal || '#d9a94a');
    K.group(pose(h), function () {
      if (o.style === 'braids') {
        var back = smooth(BRAID_BACK);
        K.part(back, C, { material: 'hair', sx: 16, sy: 70 });
        for (var i = 0; i < 30; i++) {
          var side = i < 15 ? -1 : 1, j = i % 15, x = 516 + side * (40 + j * 9), y0 = 200 + j * 7, y1 = 560 + rand() * 40;
          K.path('M' + x + ',' + y0 + ' Q' + (x + side * 16) + ',' + ((y0 + y1) / 2) + ' ' + (x + side * (8 + j * 1.4)) + ',' + y1, { stroke: shade(C, .14), width: 3, opacity: .8 });
          if (rand() < .45) { var gy = y1 - 30 - rand() * 60; K.flat(rect(x + side * 12 - 5, gy, 10, 7), M); }
        }
      }
      if (o.style === 'long') K.part(smooth(LONG_BACK), C, { material: 'hair', sx: 18, sy: 80 });
      if (o.style === 'bob') K.part(smooth(BOB_BACK), C, { material: 'hair', sx: 18, sy: 60 });
      if (o.style === 'ponytail') { K.part(smooth([[440, 190], [420, 260], [404, 340], [396, 430], [412, 480], [440, 450], [452, 360], [460, 270]]), C, { material: 'hair', sx: 16, sy: 60 }); K.flat(rect(428, 214, 22, 16), M); }
    });
  };
  /** hair(h, {style, colour}) — the hair ON TOP of the head. Draw it AFTER head(). Styles: 'curls', 'short', 'braids', 'long', 'bun', 'bob', 'ponytail', 'afro', 'bald'. */
  K.hair = function (h, o) {
    o = o || {}; var C = norm(o.colour || '#2a1d18'), st = o.style || 'short';
    if (st === 'quiff') st = 'short'; if (st === 'curly') st = 'curls'; if (st === 'tall') st = 'curls';
    K.group(pose(h), function () {
      if (st === 'curls') {
        K.part([[452, 272], [444, 204], [476, 150], [540, 130], [602, 148], [624, 200], [612, 236], [592, 214], [560, 198], [520, 202], [488, 216], [474, 252], [470, 280]], C, { material: 'hair' });
        [[466, 196, 30], [492, 160, 32], [530, 140, 32], [568, 146, 30], [600, 170, 28], [616, 206, 24], [452, 232, 24], [458, 262, 18], [548, 178, 22], [508, 186, 20]]
          .forEach(function (b) { K.part(blob(b[0], b[1], b[2]), C, { material: 'hair', step: 14, light: 1.7 }); });
      }
      if (st === 'afro') {
        K.part(smooth([[440, 282], [418, 230], [424, 170], [462, 120], [520, 100], [580, 110], [624, 150], [640, 208], [630, 250], [610, 236], [590, 206], [540, 192], [490, 204], [470, 240], [462, 284]]), C, { material: 'hair', step: 18, light: 1.7 });
        [[444, 200, 34], [470, 148, 36], [524, 124, 38], [580, 134, 36], [620, 180, 32], [626, 228, 24], [452, 250, 22]].forEach(function (b) { K.part(blob(b[0], b[1], b[2], 8), C, { material: 'hair', step: 14, light: 1.7 }); });
      }
      if (st === 'short') {
        K.part([[452, 272], [444, 206], [474, 160], [536, 142], [598, 158], [622, 204], [612, 232], [592, 212], [556, 200], [516, 204], [486, 218], [472, 252], [468, 280]], C, { material: 'hair' });
        [[[474, 160], [470, 130], [506, 148]], [[520, 146], [540, 118], [560, 148]], [[574, 152], [604, 138], [600, 170]], [[444, 206], [426, 184], [462, 182]]]
          .forEach(function (t) { K.part(t, C, { material: 'hair', step: 14 }); });
      }
      if (st === 'braids' || st === 'long' || st === 'bun' || st === 'bob' || st === 'ponytail') {
        K.part([[452, 272], [444, 204], [476, 150], [516, 134], [556, 146], [592, 198], [596, 276], [586, 232], [554, 200], [516, 190], [490, 200], [464, 234]], C, { material: 'hair', sx: 14, sy: 50, dir: 60, light: 1.7 });
        K.line([[516, 136], [516, 190]], shade(C, .2), 3);
      }
      if (st === 'bun') K.part(blob(520, 118, 42, 9), C, { material: 'hair', step: 16 });
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
