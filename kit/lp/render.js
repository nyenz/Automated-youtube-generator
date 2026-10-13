/* =========================================================================
   LOW-POLY RENDER — the camera, the film and the player of the Low-Poly style.
   The world is 2.5D: every asset stands at a real (x, y, z) place and is drawn
   as a flat picture with true perspective and parallax. On top of that:
     depth of field (blur by distance, focus pulls), depth haze, mood grading,
     film grain + gate weave + halation, vignette, air (dust, snow, rain...),
     light shafts, foreground silhouettes, an attention spotlight.
   The director fills K.cam / K.stage each frame; this file draws them.
   LOCKED FILE.
   ========================================================================= */
(function (root) {
  'use strict';
  var K = root.KIT = root.KIT || {}, V3 = K.V3;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)) }
  K.ease = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x) };
  var mixColor = K.mixColor;
  K.mix = function (a, b, k) { return typeof a === 'number' && typeof b === 'number' ? a + (b - a) * k : mixColor(a, b, k) };
  K.seg = function (t, a, b) { return K.ease((t - a) / Math.max(1e-6, b - a)) };

  var cfg = null, cv = null, D = null, SCN = null, S = null, W = 0, H = 0, TA = null, TB = null, BL = null, NZ = null, GLOW = null;
  var FILTER = (function () { try { return 'filter' in CanvasRenderingContext2D.prototype } catch (e) { return false } })();
  K.film = { grain: 1, weave: 1, halation: 1, fog: 1 };
  K.cam = { target: new V3(0, 1.3, 0), dist: 7, yaw: 0, pitch: 0, fov: 32, roll: 0 };
  K.stage = { set: null, ents: [] };
  K.spot = { x: .5, y: .5, r: .4, s: 0 };
  K.fgShape = null; K.airKind = 'dust'; K.shafts = false; K.noLiveSound = false; K.sfxVol = 1;
  K.camera = { aspect: 9 / 16, position: new V3(0, 2, 8) };
  K.duration = 10;
  var SKIES = { warm: { glow: [255, 176, 112], glow2: [111, 143, 208] }, night: { glow: [159, 184, 232], glow2: [58, 79, 138] } };

  /* ---------------- view ---------------- */
  K.view = function () {
    var w = innerWidth, h = innerHeight, pr = Math.min(devicePixelRatio || 1, 2);
    if (cfg && cfg.aspect) { var a = cfg.aspect.split(':'), ra = a[0] / a[1]; if (w / h > ra) w = h * ra; else h = w / ra; pr = Math.min(3, (cfg.res || 1080) / Math.min(w, h)) }
    return [Math.floor(w), Math.floor(h), pr];
  };
  K.placeCanvas = function () {
    if (!cv || !cfg || !cfg.aspect) return; var v = K.view();
    cv.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:' + v[0] + 'px;height:' + v[1] + 'px;display:block';
  };
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c }
  function size() {
    var v = K.view(); W = Math.max(2, Math.round(v[0] * v[2])); H = Math.max(2, Math.round(v[1] * v[2]));
    cv.width = W; cv.height = H; SCN.width = W; SCN.height = H; TA.width = W; TA.height = H; TB.width = W; TB.height = H;
    BL.width = Math.max(8, W >> 3); BL.height = Math.max(8, H >> 3);
    D = cv.getContext('2d', { alpha: false }); S = SCN.getContext('2d', { alpha: false }); K.camera.aspect = W / H; K.renderer.pr = v[2];
    if (K.ctxCache) { K.ctxCache.a = TA.getContext('2d'); K.ctxCache.b = TB.getContext('2d') }
    K.placeCanvas();
  }
  K.init = function (o) {
    cfg = o = o || {}; K.duration = o.duration || 10; K.sky = SKIES[o.sky] ? o.sky : 'warm';
    var st = document.createElement('style');
    st.textContent = 'html,body{height:100%;margin:0;overflow:hidden;background:#0d0b10}canvas.kmain{position:fixed;inset:0;width:100%;height:100%;display:block}.kerr{position:fixed;left:16px;right:16px;top:16px;padding:12px;background:#5a1d1d;color:#fff;font:13px monospace;white-space:pre-wrap;z-index:9}';
    document.head.appendChild(st);
    cv = mk(2, 2); cv.className = 'kmain'; SCN = mk(2, 2); TA = mk(2, 2); TB = mk(2, 2); BL = mk(8, 8);
    K.renderer = { domElement: cv, pr: 1 };
    document.body.appendChild(cv); size();
    K.ctxCache = { a: TA.getContext('2d'), b: TB.getContext('2d') };
    GLOW = (function () { var c = mk(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c })();
    NZ = (function () { var c = mk(256, 256), x = c.getContext('2d'), im = x.createImageData(256, 256), seed = 7; for (var i = 0; i < im.data.length; i += 4) { seed = (seed * 16807) % 2147483647; var v = 128 + ((seed / 2147483647) - .5) * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255 } x.putImageData(im, 0, 0); return c })();
    addEventListener('resize', size);
    return K;
  };

  /* ---------------- direction lists (filled by the director) ---------------- */
  var LENS = [], LIGHT = [], CUES = [], LOOPS = [], UPDATE = null, AMBI = null;
  K.shots = function () { return K };
  K.lens = function (a) { LENS = a; return K };
  K.light = function (a) { LIGHT = a; return K };
  K.cues = function (a) { CUES = a; return K };
  K.loops = function (a) { LOOPS = a; return K };
  K.ambience = function (a) { AMBI = a; return K };
  K.update = function (fn) { UPDATE = fn; return K };

  /* ---------------- camera maths ---------------- */
  var CP = new V3(), FX = 0, FY = 0, FZ = 0, RX = 1, RZ = 0, UX = 0, UY = 1, UZ = 0, FOC = 1000, CX = 0, CZ = 0;
  function setupProj() {
    var c = K.cam, yaw = c.yaw || 0, pit = c.pitch || 0, cp = Math.cos(pit), sp = Math.sin(pit), t = c.target;
    CP.set(t.x + c.dist * Math.sin(yaw) * cp, t.y + c.dist * sp, t.z + c.dist * Math.cos(yaw) * cp);
    FX = -Math.sin(yaw) * cp; FY = -sp; FZ = -Math.cos(yaw) * cp; RX = Math.cos(yaw); RZ = -Math.sin(yaw);
    UX = 0 * FZ - RZ * FY; UY = RZ * FX - RX * FZ; UZ = RX * FY - 0 * FX;
    FOC = (H / 2) / Math.tan((c.fov || 32) * Math.PI / 360);
    K.camera.position.copy(CP);
  }
  var PJ = { x: 0, y: 0, k: 1, z: 1 };
  function proj(x, y, z, o) {
    o = o || PJ; var vx = x - CP.x, vy = y - CP.y, vz = z - CP.z, zc = vx * FX + vy * FY + vz * FZ;
    var xc = vx * RX + vz * RZ, yc = vx * UX + vy * UY + vz * UZ; o.z = zc;
    if (zc < .02) zc = .02;
    o.x = W / 2 + xc / zc * FOC; o.y = H / 2 - yc / zc * FOC; o.k = FOC / zc; return o;
  }
  K.project = function (p) { setupProj(); var o = proj(p.x, p.y, p.z, {}); return [o.x / W, 1 - o.y / H, o.z] };

  /* ---------------- focus (depth of field) ---------------- */
  var TMP = { x: 0, y: 0, k: 1, z: 1 };
  function slab(list, pad) {
    if (!list || !list.length) return [4, 5];
    var lo = 1e9, hi = -1e9;
    list.forEach(function (e) {
      if (!e) { lo = Math.min(lo, 1); hi = Math.max(hi, 1e3); return }
      var a = e.a || e, r = a.root;
      if (a.isSet) { lo = Math.min(lo, 1); hi = Math.max(hi, 1e3); return }
      var p = r.position, h = (a.height || 1) * r.scale.y, half = Math.max(.25, (a.width || .6) * .35 * r.scale.x);
      proj(p.x, p.y + h * .5, p.z, TMP); lo = Math.min(lo, TMP.z - half); hi = Math.max(hi, TMP.z + half);
    });
    return [Math.max(.05, lo - pad), hi + pad];
  }
  var LS = { near: 4, far: 6, ap: .008 };
  function lensAt(t) {
    if (!LENS.length) { LS.near = 4; LS.far = 6; LS.ap = .008; return LS }
    var i = 0; while (i + 1 < LENS.length && t >= LENS[i + 1].at) i++;
    var L = LENS[i], Pv = LENS[Math.max(0, i - 1)], A = slab(Pv.on, Pv.pad === undefined ? .05 : Pv.pad), B = slab(L.on, L.pad === undefined ? .05 : L.pad);
    var k = L.pull > 0 ? K.seg(t, L.at, L.at + L.pull) : 1;
    var near = K.mix(A[0], B[0], k), far = K.mix(A[1], B[1], k), ap = K.mix(Pv.ap || .01, L.ap || .01, k);
    var sh = K.curShot ? K.curShot(t) : null, cut = sh ? sh.from : 0, s = t - cut, hunt = sh && sh.flow ? 1 : 1 + .05 * Math.exp(-s * 14) * Math.cos(s * 30);
    LS.near = near * hunt; LS.far = far * hunt; LS.ap = ap; return LS;
  }
  function coc(z, ls) { var o = Math.max(ls.near - z, z - ls.far, 0); if (o <= 0) return 0; var r = ls.ap * o / Math.max(z, .02); if (z < ls.near) r *= 1.4; return Math.min(r, .035) * H * (K.blurAmount === undefined ? 1 : K.blurAmount) }

  /* ---------------- light ---------------- */
  var LKEYS = ['key', 'amb', 'back', 'glow', 'fg', 'sub', 'fog', 'warm', 'sat', 'sepia'], LDEF = { key: .95, amb: .34, back: .3, glow: .35, fg: .8, sub: 0, fog: 0, warm: 0, sat: 1, sepia: 0 };
  function lightAt(t) {
    if (!LIGHT.length) return LDEF;
    var i = 0; while (i + 1 < LIGHT.length && t >= LIGHT[i + 1].at) i++;
    var A = LIGHT[Math.max(0, i - 1)], B = LIGHT[i], k = B.ease > 0 ? K.seg(t, B.at, B.at + B.ease) : 1, o = {};
    LKEYS.forEach(function (n) { var a = A[n] === undefined ? LDEF[n] : A[n], b = B[n] === undefined ? LDEF[n] : B[n]; o[n] = K.mix(a, b, k) });
    return o;
  }

  /* ---------------- blur (canvas filter, with a fallback for browsers without it) ---------------- */
  function blurDraw(dst, src, sw, sh, dx, dy, dw, dh, r) {
    if (FILTER) { dst.save(); dst.filter = 'blur(' + r.toFixed(1) + 'px)'; dst.drawImage(src, 0, 0, sw, sh, dx, dy, dw, dh); dst.restore(); return }
    var f = Math.max(1, Math.round(r / 1.5)), t = mk(Math.max(2, Math.ceil(sw / f)), Math.max(2, Math.ceil(sh / f))), x = t.getContext('2d'); x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, sw, sh, 0, 0, t.width, t.height); dst.save(); dst.imageSmoothingQuality = 'high'; dst.drawImage(t, 0, 0, t.width, t.height, dx, dy, dw, dh); dst.restore();
  }
  /** draw something through a temporary layer (so it can be blurred, tinted or faded as one piece) */
  function layered(ctx, rect, fn, o) {
    var r = o.blur || 0, pad = Math.ceil(r * 2.2) + 2, x = Math.floor(rect[0] - pad), y = Math.floor(rect[1] - pad), w = Math.ceil(rect[2] + pad * 2), h = Math.ceil(rect[3] + pad * 2);
    var x0 = Math.max(x, -pad), y0 = Math.max(y, -pad), x1 = Math.min(x + w, W + pad), y1 = Math.min(y + h, H + pad); w = x1 - x0; h = y1 - y0; x = x0; y = y0;
    if (w < 2 || h < 2) return;
    var ds = r > 18 ? .25 : r > 6 ? .5 : 1, tw = Math.max(2, Math.ceil(w * ds)), th = Math.max(2, Math.ceil(h * ds)); if (tw > W) tw = W; if (th > H) th = H;
    var a = K.ctxCache.a; a.save(); a.setTransform(1, 0, 0, 1, 0, 0); a.globalAlpha = 1; a.filter = 'none'; a.clearRect(0, 0, tw, th); a.setTransform(tw / w, 0, 0, th / h, -x * tw / w, -y * th / h); fn(a); a.restore();
    var src = TA;
    if (r > .6) { var b = K.ctxCache.b; b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, tw, th); blurDraw(b, TA, tw, th, 0, 0, tw, th, r * tw / w); src = TB }
    ctx.save(); if (o.filter && FILTER) ctx.filter = o.filter; ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.drawImage(src, 0, 0, tw, th, x, y, w, h); ctx.restore();
  }

  /* ---------------- the floor ---------------- */
  var GROUNDS = {};
  function groundFor(set) {
    var key = set ? set.name || 'set' : 'void'; if (GROUNDS[key]) return GROUNDS[key];
    var o = (set && set.groundOpt) || {}, base = K.norm(o.color || (set && set.backdrop && set.backdrop.ground) || '#a89a85'), gw = o.width || (set ? Math.max(set.width, 30) : 40), z0 = o.z0 === undefined ? -24 : o.z0, z1 = o.z1 === undefined ? 34 : o.z1;
    var nx = 26, nz = 30, grid = [], rs = 99, rnd = function () { rs = (rs * 16807) % 2147483647; return rs / 2147483647 }, i, j;
    for (j = 0; j <= nz; j++) { var row = []; for (i = 0; i <= nx; i++) { var zz = z0 + (z1 - z0) * Math.pow(j / nz, 1.5); row.push([-gw / 2 + gw * i / nx + (i && i < nx ? (rnd() - .5) * gw / nx * .7 : 0), zz + (j && j < nz ? (rnd() - .5) * (z1 - z0) / nz * .7 : 0)]) } grid.push(row) }
    var tris = [];
    for (j = 0; j < nz; j++) for (i = 0; i < nx; i++) {
      var a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i + 1], d = grid[j + 1][i], flip = rnd() < .5, T2 = flip ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
      T2.forEach(function (t) { var k = (rnd() - .5) * .17 + (t[0][0] < 0 ? .025 : -.025); tris.push({ p: t, c: K.shade(base, k * (o.rough === undefined ? 1 : o.rough)) }) });
    }
    return GROUNDS[key] = { tris: tris, z0: z0, z1: z1, base: base };
  }
  var CLIP = [];
  function fogOver(cc, rc, col, a) { cc.save(); cc.globalCompositeOperation = 'source-atop'; cc.globalAlpha = a; cc.fillStyle = col; cc.fillRect(rc[0] - 4, rc[1] - 4, rc[2] + 8, rc[3] + 8); cc.restore() }
  function drawGround(c, set, fogc, fogA) {
    var g = groundFor(set); if (set && set.groundOpt === null) return;
    var fr = K.hex2rgb(fogc), span = g.z1 - g.z0;
    for (var i = 0; i < g.tris.length; i++) {
      var t = g.tris[i], pts = [], any = false, zmin = 1e9;
      for (var k = 0; k < 3; k++) { var v = t.p[k], vx = v[0] - CP.x, vy = -CP.y, vz = v[1] - CP.z, zc = vx * FX + vy * FY + vz * FZ, xc = vx * RX + vz * RZ, yc = vx * UX + vy * UY + vz * UZ; pts.push([xc, yc, zc]); if (zc > .05) any = true; if (zc < zmin) zmin = zc }
      if (!any) continue;
      var poly = clipNear(pts); if (poly.length < 3) continue;
      var far = fogA((pts[0][2] + pts[1][2] + pts[2][2]) / 3), col = far > .01 ? mixHex(t.c, fogc, far) : t.c;
      c.fillStyle = col; c.beginPath();
      for (var m = 0; m < poly.length; m++) { var q = poly[m], x = W / 2 + q[0] / q[2] * FOC, y = H / 2 - q[1] / q[2] * FOC; if (m) c.lineTo(x, y); else c.moveTo(x, y) }
      c.closePath(); c.fill(); c.strokeStyle = col; c.lineWidth = .7; c.stroke();
    }
  }
  function mixHex(a, b, k) { var A = K.hex2rgb(a), B = K.hex2rgb(b); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * k) + ',' + Math.round(A[1] + (B[1] - A[1]) * k) + ',' + Math.round(A[2] + (B[2] - A[2]) * k) + ')' }
  function clipNear(p) {
    var out = [], N = .3;
    for (var i = 0; i < p.length; i++) {
      var a = p[i], b = p[(i + 1) % p.length], ia = a[2] >= N, ib = b[2] >= N;
      if (ia) out.push(a);
      if (ia !== ib) { var k = (N - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, N]) }
    }
    return out;
  }

  /* ---------------- painting assets ---------------- */
  function dirOf(a) { return a.dir === -1 ? -1 : 1 }
  /** transform for an asset standing at screen point P (anchor = its feet) */
  function setAssetTransform(c, a, P) {
    var r = a.root, sc = r.scale.y, s = P.k / a.ppu * sc, sq = a.squash === undefined ? 1 : a.squash;
    c.translate(P.x, P.y); if (r.rotation.z) c.rotate(-r.rotation.z);
    c.scale(dirOf(a) * (r.scale.x / (r.scale.y || 1)) * (a.sx || 1) * sq * s, s); c.translate(-a.anchor[0], -a.anchor[1]);
    return s;
  }
  function assetRect(a, P) {
    var r = a.root, s = P.k / a.ppu * r.scale.y, bb = a.bbox, sx = Math.abs((r.scale.x / (r.scale.y || 1)) * (a.sx || 1)) * s, m = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) * .18;
    var w = (bb.x1 - bb.x0 + m * 2) * sx, h = (bb.y1 - bb.y0 + m * 2) * s, cx = P.x + ((bb.x0 + bb.x1) / 2 - a.anchor[0]) * sx * dirOf(a), cy = P.y + ((bb.y0 + bb.y1) / 2 - a.anchor[1]) * s;
    var ext = Math.abs(Math.sin(r.rotation.z || 0)) * Math.max(w, h);
    return [cx - w / 2 - ext, cy - h / 2 - ext, w + ext * 2, h + ext * 2];
  }
  function onScreen(rc, m) { m = m || 0; return rc[0] + rc[2] > -m && rc[1] + rc[3] > -m && rc[0] < W + m && rc[1] < H + m }
  function paintAsset(c, ent, P) {
    var a = ent.a, s;
    c.save(); if (a.root.position.y < -.02 && P.gy !== undefined) { c.beginPath(); c.rect(P.x - W * 3, P.y - H * 6, W * 6, H * 6 + (P.gy - P.y)); c.clip() }      // underground: only the part above the floor shows
    s = setAssetTransform(c, a, P);
    if (a.alphaMul !== undefined && a.alphaMul < 1) c.globalAlpha *= Math.max(0, a.alphaMul);
    var held = ent.held;
    a.paint(c, s * (K.renderer.pr > 1 ? 1 : 1), held && held.length ? function (name) {
      for (var i = 0; i < held.length; i++) if (held[i].part === name) paintHeld(c, ent, held[i], s);
    } : null);
    c.restore();
    if (a.glow) { var g = a.glow, gs = (g.size || 1.2) * P.k * a.root.scale.y; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (g.alpha === undefined ? .5 : g.alpha) * (a.alphaMul === undefined ? 1 : a.alphaMul); tintGlow(c, g.color || '#ffd9a0', P.x, P.y - (g.at === undefined ? a.height * .5 : g.at) * P.k * a.root.scale.y, gs); c.restore() }
  }
  var TINTS = {};
  function tintGlow(c, color, x, y, size) {
    var t = TINTS[color]; if (!t) { t = TINTS[color] = mk(64, 64); var x2 = t.getContext('2d'); x2.drawImage(GLOW, 0, 0); x2.globalCompositeOperation = 'source-in'; x2.fillStyle = color; x2.fillRect(0, 0, 64, 64) }
    c.drawImage(t, x - size / 2, y - size / 2, size, size);
  }
  function paintHeld(c, ent, h, s) {
    var a = ent.a, it = h.ent.a, p = a.byName[h.part]; if (!p) return;
    var side = h.hand === 'L' ? 'B' : 'F', g = h.grip || (a.arm && a.arm[side] ? [a.arm[side].hand[0], a.arm[side].hand[1] - 14] : [0, 0]);
    var ig = it.grip || [it.anchor[0], it.anchor[1] - (it.bbox.y1 - it.bbox.y0) * .5], rel = (a.ppu / it.ppu) * (it.root.scale.y / (a.root.scale.y || 1));
    c.save(); c.transform(p.M[0], p.M[1], p.M[2], p.M[3], p.M[4], p.M[5]); c.translate(g[0], g[1]); c.rotate(((h.angle || 0) * Math.PI / 180) - Math.atan2(p.M[1], p.M[0]) * (h.free ? 0 : .9)); c.scale(rel * (it.sx || 1), rel); c.translate(-ig[0], -ig[1]);
    if (it.reset) it.reset(); if (it.idle) it.idle(h.t || 0); it.paint(c, s * rel); c.restore();
  }
  function paintLayer(c, set, L, P, t) {
    var s = P.k / L.ppu, r = K.raster(L.art, s * 1.02);
    c.save(); c.translate(P.x + (L.sway ? Math.sin(t * .6) * L.sway * P.k : 0), P.y); c.scale(L.flip ? -s : s, s); c.translate(-L.ax, -L.ay);
    if (L.alpha < 1) c.globalAlpha = L.alpha; c.drawImage(r.canvas, r.ox, r.oy, r.w, r.h); c.restore();
  }
  function layerRect(L, P) {
    var s = P.k / L.ppu, b = K.opsBBox(L.art.ops) || { x0: 0, y0: 0, x1: L.art.w, y1: L.art.h }, x0 = (b.x0 - L.ax) * s, x1 = (b.x1 - L.ax) * s, y0 = (b.y0 - L.ay) * s, y1 = (b.y1 - L.ay) * s;
    if (L.flip) { var q = x0; x0 = -x1; x1 = -q }
    return [P.x + x0, P.y + y0, x1 - x0, y1 - y0];
  }
  /** a mound of earth and flying dirt where something comes out of / goes into the ground */
  function paintMound(c, ent, P, t) {
    var a = ent.a, gy = P.gy !== undefined ? P.gy : P.y, w = Math.max(.5, a.width || .6) * P.k * .9 * clamp(ent.mound || 0, 0, 1), col = '#7a6248', col2 = '#8d7656', d = ent.dirt || 0;
    c.save();
    if (w > 3) { c.fillStyle = col; c.beginPath(); c.ellipse(P.x, gy, w * .62, w * .2, 0, Math.PI, 0); c.fill(); c.fillStyle = col2; c.beginPath(); c.ellipse(P.x - w * .12, gy - w * .03, w * .3, w * .1, 0, Math.PI, 0); c.fill() }
    if (d > 0) for (var i = 0; i < 14; i++) { var r1 = ((i * 7919) % 97) / 97, r2 = ((i * 104729) % 89) / 89, u = clamp(d / 1.1, 0, 1), x = P.x + (r1 - .5) * w * 1.6 * (.4 + u), y = gy - (Math.sin(u * 3.14 * (.6 + r2 * .5)) * (.4 + r2) * (a.height || 1) * P.k * .5);
      c.globalAlpha = 1 - u * .8; c.fillStyle = i % 2 ? col : col2; c.beginPath(); c.arc(x, y, Math.max(1.5, P.k * .05 * (1 + r2)), 0, 6.283); c.fill() }
    c.restore();
  }
  /** the soft ground shadow under things */
  function paintShadow(c, a, P) {
    var r = a.root, h = Math.max(0, r.position.y), w = (a.shadowW || .5) * r.scale.x * P.k * (1 - clamp(h / 2, 0, .6)), al = .36 * clamp(1 - h / 1.8, 0, 1);
    if (al < .02 || w < 2) return;
    var hh = w * clamp(.12 + Math.abs(K.cam.pitch || 0) * .8, .1, .4);
    c.save(); c.translate(P.x, P.y + 1); c.scale(1, hh / w); var g = c.createRadialGradient(0, 0, 0, 0, 0, w / 2);
    g.addColorStop(0, 'rgba(93,81,68,' + (al * 1.2).toFixed(3) + ')'); g.addColorStop(.55, 'rgba(93,81,68,' + (al * .8).toFixed(3) + ')'); g.addColorStop(1, 'rgba(93,81,68,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, w / 2, 0, 6.2832); c.fill(); c.restore();
  }

  /* ---------------- foreground silhouettes ---------------- */
  var FGS = null;
  function fgShapes() {
    if (FGS) return FGS; var rs = 21, rnd = function () { rs = (rs * 16807) % 2147483647; return rs / 2147483647 };
    function jag(rx, ry, n, amp, ox, oy, rot) { var o = [], i; for (i = 0; i < n; i++) { var a = i / n * 6.283, r = 1 + (i % 2 ? amp : -amp * .4) * (.7 + rnd() * .6), x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r; o.push([ox + x * Math.cos(rot || 0) - y * Math.sin(rot || 0), oy + x * Math.sin(rot || 0) + y * Math.cos(rot || 0)]) } return o }
    FGS = [
      function () { var l = []; for (var i = 0; i < 5; i++) l.push(jag(.32 + i * .05, .14, 18, .25, (i - 2) * .12, i * .16 - .3, -.5 + i * .25)); return l },
      function () { return [jag(.55, .38, 22, .12, 0, -.2, 0), jag(.3, .22, 16, .15, .35, .05, 0)] },
      function () { return [[[-.08, -.8], [.08, -.8], [.06, .8], [-.06, .8]], jag(.2, .12, 12, .2, .12, .45, 0)] },
      function () { var l = []; for (var i = 0; i < 7; i++) { var b = (i - 3) * .07, h = .5 + (i % 3) * .2; l.push([[b - .03, -.2], [b + .03, -.2], [b + (i - 3) * .06, h]]) } return l }
    ].map(function (f) { return f() });
    return FGS;
  }
  function paintFG(c, fg, blur) {
    var list = fgShapes()[fg.kind % 4], px = fg.size * H;
    c.save(); c.translate(fg.x * W, fg.y * H); c.rotate(fg.rot || 0); c.scale(fg.flip ? -px : px, -px);
    list.forEach(function (poly) { c.beginPath(); poly.forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]) }); c.closePath(); c.fillStyle = '#120e15'; c.fill() });
    c.restore();
  }

  /* ---------------- air: dust, bubbles, snow, embers, rain ---------------- */
  var AIRS = { dust: { c: '#ffd9a0', o: .24, s: .008, vy: .04 }, bubbles: { c: '#a9dcea', o: .5, s: .018, vy: .35 }, snow: { c: '#eef0ff', o: .6, s: .014, vy: -.18 }, embers: { c: '#ffa050', o: .8, s: .01, vy: .22 }, rain: { c: '#b8c8e0', o: .38, s: .008, vy: -1.6 } };
  var AIRSEED = null;
  function paintAir(c, t, ls, atm) {
    var type = K.airKind || 'dust', P = AIRS[type]; if (!P || atm <= 0) return;
    if (!AIRSEED) { AIRSEED = []; var rs = 5, rnd = function () { rs = (rs * 16807) % 2147483647; return rs / 2147483647 }; for (var i = 0; i < 150; i++) AIRSEED.push([rnd(), rnd(), rnd(), rnd() * 6.28]) }
    var dist = K.cam.dist, n = type === 'rain' ? 110 : type === 'dust' ? 70 : 150;
    c.save(); c.globalCompositeOperation = type === 'dust' || type === 'embers' || type === 'bubbles' ? 'lighter' : 'source-over';
    for (var i2 = 0; i2 < n; i2++) {
      var s = AIRSEED[i2], z = dist * (.25 + s[2] * 1.15), yy = (((s[1] + t * P.vy / 1.2) % 1) + 1) % 1, wob = type === 'bubbles' ? Math.sin(t * 3 + s[3]) * .03 : Math.sin(t * .5 + s[3]) * .04;
      var x = ((s[0] + wob) % 1 + 1) % 1 * W, y = yy * H, k = dist / z, sz = P.s * H * k * 1.6, r = coc(z, LS), al = P.o * Math.min(1.3, atm) * clamp(.45 + k * .5, .3, 1);
      if (type === 'embers' && Math.floor(t * 12 + s[3] * 10) % 5 === 0) continue;
      if (type === 'rain') { c.strokeStyle = 'rgba(184,200,224,' + (al * .8).toFixed(2) + ')'; c.lineWidth = Math.max(1, sz * .25); c.beginPath(); c.moveTo(x, y); c.lineTo(x - sz * .5, y + sz * 5 * k); c.stroke(); continue }
      var d = sz * (1 + r / (sz * 2 + 1) * 1.2); c.globalAlpha = al * (r > 2 ? .6 : 1);
      tintGlow(c, P.c, x, y, Math.max(2, d * 2));
    }
    c.restore();
  }
  function paintShafts(c, t, L, atm) {
    var moodCold = L.warm < -.2, fh = H * .9; c.save(); c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < 3; i++) {
      var cx = W * (.28 + i * .22), al = (.07 + .03 * Math.sin(t * .7 + i * 2)) * Math.min(1.3, atm), wd = fh * (.14 + i * .05);
      c.save(); c.translate(cx, -H * .1); c.rotate(.32);
      var g = c.createLinearGradient(0, 0, 0, fh * 1.6); var col = moodCold ? '184,212,255' : '255,224,176';
      g.addColorStop(0, 'rgba(' + col + ',' + (al * 1.6).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
      var gx = c.createLinearGradient(-wd, 0, wd, 0); gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(.5, 'rgba(0,0,0,1)'); gx.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(-wd, 0, wd * 2, fh * 1.6); c.restore();
    }
    c.restore();
  }

  /* ---------------- the frame ---------------- */
  var frameNo = 0, lastStep = -1, weave = [0, 0];
  function render(t, now, ls, L) {
    setupProj();
    var st = K.stage, set = st.set && st.set.a, bd = (set && set.backdrop) || {}, top = K.norm(bd.top || '#b4a58f'), bot = K.norm(bd.bottom || '#a89a85');
    var c = S; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; c.save();
    var roll = K.cam.roll || 0; if (roll) { var zs = 1 + Math.abs(roll) * Math.max(W / H, H / W) * 1.1; c.translate(W / 2, H / 2); c.rotate(roll); c.scale(zs, zs); c.translate(-W / 2, -H / 2) }
    var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(-W * .2, -H * .2, W * 1.4, H * 1.4);
    var fogc = bot, dens = (L.fog || 0) * K.film.fog * 1.7, fogA = function (z) { return dens > 0 ? clamp(1 - Math.exp(-dens * Math.max(0, z - fogRef)), 0, .8) : 0 };
    drawGround(c, set, bot, fogA);
    /* collect what to draw, far to near */
    var items = [], i, j;
    if (set) set.layers.forEach(function (Ly) { proj(Ly.x, Ly.y, Ly.z, PJ); if (PJ.z > .3) { var P = { x: PJ.x, y: PJ.y, k: PJ.k, z: PJ.z }; items.push({ z: P.z, t: 'layer', L: Ly, P: P }) } });
    var focusZ = (ls.near + ls.far) / 2, glowItem = { z: focusZ + .4, t: 'glow' };
    items.push(glowItem);
    st.ents.forEach(function (ent) {
      var a = ent.a, r = a.root; if (!r.visible || ent.held_by || a.isSet) return;
      proj(r.position.x, r.position.y, r.position.z, PJ); if (PJ.z < .3) return;
      var P = { x: PJ.x, y: PJ.y, k: PJ.k, z: PJ.z };
      if (r.position.y < -.02) { proj(r.position.x, 0, r.position.z, PJ); P.gy = PJ.y }
      items.push({ z: P.z, t: 'ent', ent: ent, P: P });
      if (a.shadowW > 0) { proj(r.position.x, 0, r.position.z, PJ); items.push({ z: P.z + .001, t: 'shadow', ent: ent, P: { x: PJ.x, y: PJ.y, k: PJ.k, z: PJ.z } }) }
    });
    items.sort(function (p, q) { return q.z - p.z });
    var sub = clamp(L.sub || 0, 0, 1), fogRef = K.cam.dist * .9;
    for (i = 0; i < items.length; i++) {
      var it = items[i];
      var r0 = it.t === 'glow' ? 0 : coc(it.z, ls), bl = r0 < .8 ? 0 : Math.round(r0 * 2) / 2;
      if (it.t === 'glow') { paintGlow(c, L, st); continue }
      if (it.t === 'shadow') { paintShadow(c, it.ent.a, it.P); continue }
      if (it.t === 'layer') {
        var rc = layerRect(it.L, it.P); if (!onScreen(rc, bl * 2)) continue;
        var fa = fogA(it.z);
        if (bl || fa > .02) layered(c, rc, function (cc) { paintLayer(cc, set, it.L, it.P, t); if (fa > .02) fogOver(cc, rc, fogc, fa) }, { blur: bl });
        else paintLayer(c, set, it.L, it.P, t);
        continue;
      }
      var ent = it.ent, a = ent.a, rc2 = assetRect(a, it.P); if (!onScreen(rc2, bl * 2)) continue;
      var silh = sub > .04 && (a.kind === 'character' || a.kind === 'creature' || a.kind === 'prop');
      var fa2 = fogA(it.z);
      if (bl || silh || fa2 > .02) layered(c, rc2, function (cc) { paintAsset(cc, ent, it.P); if (fa2 > .02) fogOver(cc, rc2, fogc, fa2) }, { blur: bl, filter: silh ? 'brightness(' + (1 - .88 * sub).toFixed(2) + ') saturate(' + (1 - .7 * sub).toFixed(2) + ')' : null });
      else paintAsset(c, ent, it.P);
      if (ent.mound > .02 || ent.dirt > 0) paintMound(c, ent, it.P, t);
    }
    /* foreground silhouette: a dark, out-of-focus shape in a bottom corner */
    if (K.fgShape && (L.fg || 0) > .02) { var fg = K.fgShape, fr = Math.min(.035, ls.ap * 8) * H + H * .008; c.save(); c.globalAlpha = clamp(L.fg, 0, 1) * (fg.alpha === undefined ? 1 : fg.alpha); layered(c, [fg.x * W - fg.size * H * .8, fg.y * H - fg.size * H * 1.2, fg.size * H * 1.6, fg.size * H * 2.4], function (cc) { paintFG(cc, fg) }, { blur: fr, alpha: clamp(L.fg, 0, 1) * (fg.alpha === undefined ? 1 : fg.alpha) }); c.restore() }
    if (K.film.fog > 0) paintAir(c, t, ls, K.film.fog);
    if (K.shafts && K.film.fog > 0) paintShafts(c, t, L, K.film.fog);
    c.restore();
    /* halation / bloom: bright parts bleed a soft warm glow */
    var hal = K.film.halation * .35;
    if (hal > .01 && FILTER) {
      var b = BL.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, BL.width, BL.height);
      b.filter = 'brightness(.75) contrast(3) blur(1.2px)'; b.drawImage(SCN, 0, 0, BL.width, BL.height); b.filter = 'none';
      S.save(); S.globalCompositeOperation = 'screen'; S.globalAlpha = clamp(hal * 1.3, 0, .6); S.imageSmoothingQuality = 'high'; S.drawImage(BL, 0, 0, W, H); S.restore();
    }
    finish(t, now, L);
  }
  function paintGlow(c, st0, st) {
    var L = st0, a = L.glow || 0; if (a <= .01) return; var sk = SKIES[K.sky] || SKIES.warm, p = proj(K.cam.target.x, K.cam.target.y, K.cam.target.z, {});
    c.save(); c.globalCompositeOperation = 'screen';
    var r = H * .6, g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r), col = sk.glow; g.addColorStop(0, 'rgba(' + col.join(',') + ',' + (.5 * a * .5).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col.join(',') + ',0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
  }
  /* colour grade, exposure, spotlight, vignette, grain, gate weave */
  function finish(t, now, L) {
    var F = K.film, d = D, ws = Math.floor(t * 12);
    if (ws !== lastStep) { lastStep = ws; frameNo = (frameNo + 1.37) % 100; var wa = .0007 * F.weave * W; weave[0] = ((Math.sin(ws * 12.9898) * 43758.5453) % 1) * wa; weave[1] = ((Math.sin(ws * 78.233) * 12543.1234) % 1) * wa * .6 }
    d.setTransform(1, 0, 0, 1, 0, 0); d.globalAlpha = 1; d.globalCompositeOperation = 'source-over'; d.fillStyle = '#0d0b10'; d.fillRect(0, 0, W, H);
    var sat = L.sat === undefined ? 1 : L.sat, sep = L.sepia || 0, flt = [];
    if (Math.abs(sat - 1) > .02) flt.push('saturate(' + sat.toFixed(2) + ')'); if (sep > .02) flt.push('sepia(' + sep.toFixed(2) + ')');
    d.save(); if (flt.length && FILTER) d.filter = flt.join(' '); d.drawImage(SCN, weave[0], weave[1], W, H); d.restore();
    if (F.weave > 0) { /* cover the weave edge */ }
    /* exposure from the light levels */
    var ex = (L.key * .6 + L.amb * 1.2) / (.95 * .6 + .34 * 1.2), e = .35 + .65 * ex;
    if (e < .98) { d.save(); d.globalCompositeOperation = 'source-over'; d.fillStyle = 'rgb(16,13,30)'; d.globalAlpha = clamp((1 - e) * .8, 0, .85); d.fillRect(0, 0, W, H); d.restore() }
    else if (e > 1.03) { d.save(); d.globalCompositeOperation = 'screen'; d.fillStyle = 'rgb(255,247,232)'; d.globalAlpha = clamp((e - 1) * .42, 0, .9); d.fillRect(0, 0, W, H); d.restore() }
    /* colour temperature */
    var wm = L.warm || 0;
    if (Math.abs(wm) > .02) { d.save(); d.globalCompositeOperation = 'soft-light'; d.fillStyle = wm > 0 ? 'rgb(255,150,70)' : 'rgb(70,110,210)'; d.globalAlpha = clamp(Math.abs(wm) * .5, 0, .6); d.fillRect(0, 0, W, H); d.restore() }
    /* the attention spotlight: dims what is not being talked about */
    var sp = K.spot || { s: 0 }; K.spotNow = (K.spotNow || 0) + ((sp.s || 0) - (K.spotNow || 0)) * .35;
    if (K.spotNow > .02) {
      var sx = sp.x * W, sy = (1 - sp.y) * H, sr = sp.r * H, g = d.createRadialGradient(sx, sy, sr, sx, sy, sr * 2.4);
      g.addColorStop(0, 'rgba(12,9,18,0)'); g.addColorStop(1, 'rgba(12,9,18,' + clamp(K.spotNow * .75, 0, .8).toFixed(3) + ')'); d.fillStyle = g; d.fillRect(0, 0, W, H);
    }
    /* soft-light grade: warm top-left, cool bottom-right */
    d.save(); d.globalCompositeOperation = 'soft-light'; var gg = d.createLinearGradient(0, 0, W, H); gg.addColorStop(0, 'rgb(255,150,89)'); gg.addColorStop(.5, 'rgb(140,150,170)'); gg.addColorStop(1, 'rgb(69,89,230)'); d.globalAlpha = .34; d.fillStyle = gg; d.fillRect(0, 0, W, H); d.restore();
    /* vignette */
    var vg = d.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.hypot(W, H) * .56); vg.addColorStop(0, 'rgba(10,8,14,0)'); vg.addColorStop(1, 'rgba(10,8,14,.5)'); d.fillStyle = vg; d.fillRect(0, 0, W, H);
    /* flash */
    /* grain */
    if (F.grain > .01) {
      d.save(); d.globalCompositeOperation = 'overlay'; d.globalAlpha = clamp(.09 * F.grain, 0, .4);
      var pat = d.createPattern(NZ, 'repeat'); d.translate((frameNo * 37) % 256, (frameNo * 91) % 256); d.fillStyle = pat; d.fillRect(-256, -256, W + 512, H + 512); d.restore();
    }
  }

  /* ---------------- audio hooks (the app renders the soundtrack offline; this is the live graph) ---------------- */
  var AC = null, MST = null, DEST = null, soundOn = false;
  function audioInit() {
    if (AC) return; AC = new (root.AudioContext || root.webkitAudioContext)(); MST = AC.createGain(); MST.gain.value = 0; MST.connect(AC.destination); DEST = AC.createMediaStreamDestination(); MST.connect(DEST);
  }
  K.audioInit = function () { audioInit(); if (AC.state === 'suspended') AC.resume(); return K.audio() };
  K.audio = function () { return { ctx: AC, master: MST, dest: DEST } };
  K.sound = function (on) { audioInit(); if (AC.state === 'suspended') AC.resume(); soundOn = !!on; MST.gain.setTargetAtTime(on ? .9 * K.sfxVol : 0, AC.currentTime, .05) };
  K.SFX = K.SFX || {};

  /* ---------------- player ---------------- */
  var t0 = 0, rafOn = false;
  function showErr(e) { if (K.onError) { K.onError(e); return } if (document.querySelector('.kerr')) return; var d = document.createElement('div'); d.className = 'kerr'; d.textContent = 'SCENE ERROR (paste this back to the AI):\n' + (e && e.stack || e); document.body.appendChild(d) }
  function frame(t, now) {
    try { if (UPDATE) UPDATE(t) } catch (err) { showErr(err); if (!K.onError) throw err }
    var ls = lensAt(t), L = lightAt(t); render(t, now, ls, L);
  }
  K.frame = function (t, now) { frame(t, now === undefined ? (performance.now() - t0) / 1000 : now) };
  K.curShot = null;
  /** K.start({bar:false, time:fn, after:fn}): run the player. time() gives seconds; the picture steps at 12 frames a second (paper stop-motion). */
  K.start = function (so) {
    so = so || {}; if (!cv) K.init({}); t0 = performance.now();
    (function loop() {
      requestAnimationFrame(loop); var D2 = K.duration, el = (performance.now() - t0) / 1000, raw = so.time ? so.time() : el % D2, t = Math.max(0, Math.min(D2, Math.floor(raw * 12) / 12));
      frame(t, el); if (so.after) so.after(t);
    })();
    return K;
  };
  window.addEventListener('error', function (e) { if (e.error) showErr(e.error) });
  K.audioTickStub = function () { };
})(typeof window !== 'undefined' ? window : globalThis);
