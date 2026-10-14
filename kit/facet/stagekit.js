/* FACET STAGE KIT — plugs the Facet style (facet/facet-kit.js + facet/facet-motion.js) into the app's stage
   (kit/stage.js). It provides window.KIT (assets, drawing, player) and window.DIRECTOR (shots, timing, captions).

   ASSET FILES (what the AI chats write) — one call each:
     KIT.asset('medic', function (F) {
       return { kind: 'character', size: 2.6, person: { build: 'adult', skin: '#e2cbb6', hair: {...}, top: '#3c4660', ... } };
     });
     KIT.asset('thermometer', function (F) {
       return { kind: 'prop', size: 0.6, origin: [540, 880], top: 380, grip: [420, 860],
                draw: function (F) { F.begin({ width: 1080, height: 1080 }); ...; return F.render('thermometer'); } };
     });
     KIT.asset('pond', function (F) {
       return { kind: 'set', bg: '#4b6782', grade: { far: ['#24344a', .4] }, spots: { left: [345, 1500], board: [520, 1484] },
                far: function (F, W, H) {...}, set: function (F, W, H) {...}, front: function (F, W, H) {...} };
     });
   SHOT FILES — SHOT('M01', { set, cast: {...}, camera: [...], focus: [...], moves: [...] }) (see app/templates-facet.js). */
(function (root) {
  'use strict';
  var F = root.F, FM = root.FM, K = {}, D = {};
  root.KIT = K; root.DIRECTOR = D;
  var U = 230;                                   // pixels per unit: an adult (2.6 units) is 600 px tall in a 1080 × 1920 frame
  K.U = U;

  /* ---------------- registry ---------------- */
  var REG = {}, BUILT = {};
  K.asset = function (name, fn) { if (typeof name !== 'string' || typeof fn !== 'function') throw new Error("KIT.asset needs a name and a function: KIT.asset('name', function (F) { return {...} })"); REG[name] = fn };
  K.has = function (n) { return !!(REG[n] || BUILT[n]) };
  K.list = function () { return Object.keys(REG) };
  BUILT.kato = function () { return { kind: 'character', size: 2.6, person: { build: 'adult', skin: '#ece3d6', hair: { style: 'cap', colour: '#6b4630' }, top: '#3f6f73', bottom: { type: 'trousers', colour: '#b9a78a' }, shoes: '#d3ccbd' } } };
  BUILT.nia = function () { return { kind: 'character', size: 2.6, person: { build: 'woman', skin: '#ece3d6', hair: { style: 'long', colour: '#c9a25e' }, top: '#c98a86', bottom: { type: 'skirt', colour: '#3c4660' }, shoes: '#5a3124' } } };
  BUILT['void'] = function () { return { kind: 'set', bg: '#c0612c', spots: { center: [540, 1500], left: [330, 1500], right: [750, 1500], front: [540, 1640], back: [540, 1380] } } };

  var MADE = {};
  K.make = function (name, opts) {
    var fn = REG[name] || BUILT[name]; if (!fn) throw new Error('There is no asset called "' + name + '".');
    if (MADE[name] && !opts) return MADE[name];
    var a = fn(F, opts || {});
    if (!a || typeof a !== 'object') throw new Error('The asset function must RETURN an object like { kind: "prop", draw: ..., ... }.');
    a.name = name; a.kind = a.kind || (a.person ? 'character' : a.spots ? 'set' : 'prop');
    if (!opts) MADE[name] = a;
    return a;
  };
  K.reset = function () { MADE = {} };
  /** pixel scale of a drawn asset so its height matches its size in units */
  K.scaleOf = function (a, sizeOverride) {
    var size = sizeOverride || a.size || 1, o = a.origin || [540, 1000], top = a.top == null ? 0 : a.top, h = Math.max(1, o[1] - top);
    return size * U / h;
  };
  /** an asset's drawing as a function for the motion layer (it calls draw(F) and keeps the SVG) */
  function drawFn(a) { return function (F2) { var s = a.draw(F2); if (typeof s !== 'string' || s.indexOf('<svg') < 0) throw new Error(a.name + ': draw(F) must end with return F.render(\'...\')'); return s } }

  /* ---------------- canvas + player ---------------- */
  var cv = null, cx = null, cfg = {}, W = 1080, H = 1920, FILM = null;
  K.init = function (o) {
    cfg = o = o || {}; K.duration = o.duration || 10;
    var land = o.aspect === '16:9'; W = land ? 1920 : 1080; H = land ? 1080 : 1920;
    var res = o.res || 1080, cw = land ? Math.round(res * 16 / 9) : res, ch = land ? res : Math.round(res * 16 / 9);
    var st = document.createElement('style');
    st.textContent = 'html,body{height:100%;margin:0;overflow:hidden;background:#0d0b10}canvas.kmain{position:fixed;display:block}';
    document.head.appendChild(st);
    cv = document.createElement('canvas'); cv.className = 'kmain'; cv.width = cw; cv.height = ch; cx = cv.getContext('2d');
    K.renderer = { domElement: cv, pr: 1 };
    document.body.appendChild(cv); fit(); addEventListener('resize', fit);
    return K;
  };
  function fit() {
    if (!cv) return; var vw = innerWidth || W, vh = innerHeight || H, k = Math.min(vw / cv.width, vh / cv.height);
    var w = cv.width * k, h = cv.height * k;
    cv.style.cssText = 'position:fixed;display:block;left:' + ((vw - w) / 2) + 'px;top:' + ((vh - h) / 2) + 'px;width:' + w + 'px;height:' + h + 'px';
  }
  K.size = function () { return [W, H] };
  /** draw the picture at time t; returns a promise (the SVG becomes an image first) */
  var drawing = Promise.resolve();
  K.frame = function (tq, t) {
    var time = t === undefined ? tq : t;
    var svg = FILM ? FM.frame(FILM, time) : null;              // building the picture is synchronous: errors throw here
    if (!svg) return Promise.resolve();
    drawing = svgToCanvas(svg);
    return drawing;
  };
  function svgToCanvas(svg) {
    return new Promise(function (res) {
      var url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), img = new Image();
      img.onload = function () { cx.clearRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res() };
      img.onerror = function () { URL.revokeObjectURL(url); res() };
      img.src = url;
    });
  }
  K.start = function (so) {
    so = so || {}; var t0 = performance.now(), busy = false;
    (function loop() {
      requestAnimationFrame(loop);
      var el = (performance.now() - t0) / 1000, t = Math.max(0, Math.min(K.duration, so.time ? so.time() : el % K.duration));
      if (!busy) { busy = true; var p; try { p = K.frame(t, t) } catch (e) { busy = false; if (K.onError) K.onError(e); return } p.then(function () { busy = false }) }
      if (so.after) so.after(t);
    })();
    return K;
  };
  /* audio: the app mixes narration itself; the Facet style has no generated sound (narration only) */
  var AC = null, DEST = null, MST = null;
  K.audioInit = function () { if (!AC) { AC = new (root.AudioContext || root.webkitAudioContext)(); MST = AC.createGain(); MST.connect(AC.destination); DEST = AC.createMediaStreamDestination(); MST.connect(DEST) } if (AC.state === 'suspended') AC.resume(); return { ctx: AC, master: MST, dest: DEST } };
  K.audio = function () { return K.audioInit() };
  K.sound = function () { };
  K.film = {};

  /* ---------------- DIRECTOR: SHOT specs → a Facet film ---------------- */
  var DEFS = {}, RUN = [], ERRORS = {}, WARN = {}, WORDS = [], CUTOBJ = null, KEYS = null;
  root.SHOT = function (id, spec) {
    if (typeof id !== 'string') throw new Error("SHOT needs an id first, like SHOT('M04', {...})");
    if (!spec || typeof spec !== 'object') throw new Error('SHOT(\'' + id + '\', {...}) needs a form object.');
    DEFS[id] = spec;
  };
  D.defs = DEFS;
  function warn(id, m) { (WARN[id] = WARN[id] || []).push(m) }
  function norm(w) { return String(w).toLowerCase().replace(/[^a-z0-9]/g, '') }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h % 97 + 1 }

  /** seconds from the start of the shot for { at } or { word } */
  function timeOf(r, e, label) {
    if (e.word != null) {
      var want = String(e.word).toLowerCase().split(/\s+/).map(norm).filter(Boolean), nth = e.nth || 1, seen = 0;
      for (var i = 0; i < WORDS.length; i++) {
        var w = WORDS[i]; if (w.s < r.from - .05 || w.s >= r.to) continue;
        var ok = true; for (var j = 0; j < want.length; j++) { var ww = WORDS[i + j]; if (!ww || norm(ww.w).indexOf(want[j]) !== 0) { ok = false; break } }
        if (ok && ++seen === nth) return Math.max(0, w.s - r.from) + (+e.after || 0);
      }
      warn(r.id, (label || 'entry') + ': the word "' + e.word + '" is not spoken in this shot, so it starts at the shot start.');
      return 0;
    }
    return +e.at || +e.sec || 0;
  }
  var POSES = { stand: null, kneel: { R: [80, 95], L: [-5, 100] }, sit: { R: [85, 0], L: [85, 0] }, chair: { R: [85, 85], L: [85, 85] } };
  var ZOOM = { wide: 1, full: 1.25, medium: 1.6, close: 2.2, detail: 3 };

  function buildShot(r) {
    var sp = r.spec, sa = K.make(sp.set || 'void');
    if (sa.kind !== 'set') throw new Error('"' + (sp.set || 'void') + '" is not a set.');
    var spots = typeof sa.spots === 'function' ? sa.spots(W, H) : (sa.spots || {});
    function place(at, who) {
      if (Array.isArray(at)) return [+at[0], +at[1]];
      if (typeof at === 'string') { if (!spots[at]) throw new Error((who || 'cast') + ': the spot "' + at + '" is not in the set "' + (sp.set || 'void') + '". Spots: ' + Object.keys(spots).join(', ')); var s = spots[at]; return Array.isArray(s) ? [+s[0], +s[1]] : [+s.x, +s.ground] }
      return spots.center ? place('center', who) : [W / 2, H * .78];
    }
    var cast = [], byName = {};
    Object.keys(sp.cast || {}).forEach(function (name) {
      var e = sp.cast[name] || {}, a = K.make(e.asset || name), pos = place(e.at, name), c = { id: r.id + ':' + name, x: pos[0], ground: pos[1], seed: e.seed || hash(name), moves: [] };
      ['z', 'layer', 'plane', 'opacity', 'cycle', 'blink', 'flip', 'rot', 'silhouette', 'shadow', 'lying', 'idle', 'arms', 'head', 'lean', 'stride', 'from', 'until'].forEach(function (k) { if (e[k] !== undefined) c[k] = e[k] });
      if (a.kind === 'character') {
        c.person = Object.assign({}, a.person || {}, e.view ? { view: e.view } : {}, e.face ? { face: e.face } : {});
        c.height = (e.size || a.size || 2.6) * U;
        if (e.pose && POSES[e.pose]) { c.stride = c.stride || POSES[e.pose]; c.person.view = 'side' }
        if (e.hold) {
          c.hold = {};
          Object.keys(e.hold).forEach(function (side) {
            var h = e.hold[side], item = typeof h === 'string' ? h : h.item, pa = K.make(item);
            c.hold[side] = Object.assign({ id: item, draw: drawFn(pa), grip: pa.grip || pa.origin || [540, 540], scale: K.scaleOf(pa, h.size) }, typeof h === 'object' ? { from: h.from, to: h.to, rot: h.rot, follow: h.follow } : {});
          });
        }
      } else if (a.kind === 'set') {
        throw new Error('"' + name + '" is a set: put it in set:, not in cast.');
      } else {
        c.draw = drawFn(a); c.origin = a.origin || [540, 1000]; c.scale = K.scaleOf(a, e.size);
      }
      cast.push(c); byName[name] = { c: c, a: a };
    });
    function target(on) {
      if (Array.isArray(on)) return on;
      var b = byName[on]; if (!b) throw new Error('camera "on": "' + on + '" is not in the cast of this shot.');
      var h = b.c.height || (b.a.size || 1) * U;
      if (b.c.lying) return [b.c.x + (b.c.lying === 'right' ? 1 : -1) * h * .45, b.c.ground - h * .12];
      return [b.c.x, b.c.ground - h * (b.c.person ? .62 : .5)];
    }
    var camList = Array.isArray(sp.camera) ? sp.camera : [sp.camera || { zoom: 'full' }], cam = [];
    camList.forEach(function (k, i) {
      var tg = k.on != null ? target(k.on) : [k.x, k.y], z = typeof k.zoom === 'string' ? ZOOM[k.zoom] : k.zoom;
      if (typeof k.zoom === 'string' && !z) warn(r.id, 'camera zoom "' + k.zoom + '" is unknown (use a number or wide/full/medium/close/detail).');
      var m = { at: i === 0 && k.at == null && k.word == null ? 0 : timeOf(r, k, 'camera'), for: k.for, zoom: z, x: tg[0], y: tg[1] };
      if (m.x == null) delete m.x; if (m.y == null) delete m.y; cam.push(m);
    });
    (sp.moves || []).forEach(function (m, i) {
      var b = byName[m.who]; if (!b) { warn(r.id, 'move ' + (i + 1) + ': who "' + m.who + '" is not in the cast.'); return }
      var mv = Object.assign({}, m); delete mv.who; delete mv.word; mv.at = timeOf(r, m, 'move ' + (i + 1)); mv.for = m.for || 1.2;
      if (mv.do === 'walk' && typeof mv.to === 'string') mv.to = place(mv.to, m.who)[0];
      b.c.moves.push(mv);
    });
    var focus = (sp.focus || []).map(function (f) { var o = Object.assign({}, f); o.at = timeOf(r, f, 'focus'); delete o.word; return o });
    return { id: r.id, from: r.from, to: r.to, bg: sp.bg || sa.bg || '#c0612c', far: sa.far, set: sa.set, front: sa.front,
      grade: sp.grade || sa.grade, focus: focus, handheld: sp.handheld == null ? 2 : sp.handheld, cast: cast, camera: cam };
  }
  function placeholderShot(r, msg) {
    return { id: r.id, from: r.from, to: r.to, bg: '#2a2a30', cast: [], camera: [{ at: 0, zoom: 1 }],
      set: function (F2, w, h) { F2.begin({ width: w, height: h, bg: '#2a2a30' }); F2.text(w / 2, h / 2, msg, Math.round(w / 22), '#e9dfc8'); return F2.render(msg) } };
  }

  D.build = function (o) {
    CUTOBJ = o.cut; KEYS = o.keys || null; ERRORS = {}; WARN = {}; K.reset(); if (FM.clear) FM.clear();
    WORDS = (CUTOBJ.words || []).map(function (w) { return { w: w[0], s: w[1], e: w[2] } });
    var lines = CUTOBJ.lines || [], plan = CUTOBJ.shots || [], dur = CUTOBJ.duration;
    RUN = plan.map(function (p, i) { var l0 = lines[p.from_line] || lines[0] || { s: 0 }; return { id: p.id, idx: i, from: i === 0 ? 0 : l0.s, spec: DEFS[p.id], made: !!DEFS[p.id] } });
    RUN.forEach(function (r, i) { r.to = i + 1 < RUN.length ? RUN[i + 1].from : dur; if (r.to <= r.from) { r.to = r.from + .5; warn(r.id, 'This shot has no time (its lines overlap the next shot).') } });
    var shots = RUN.map(function (r) {
      if (!r.made) return placeholderShot(r, 'SHOT ' + r.id + ' — not made yet');
      try { return buildShot(r) } catch (e) { ERRORS[r.id] = String(e && e.message || e); if (D.onError) D.onError(r.id, ERRORS[r.id]); return placeholderShot(r, 'SHOT ' + r.id + ' — error') }
    });
    FILM = { title: o.name || 'video', width: W, height: H, duration: dur, shots: shots };
    GROUPS = null;
    return { warnings: WARN, errors: ERRORS, shots: RUN.map(function (r) { return { id: r.id, from: r.from, to: r.to, made: r.made } }) };
  };
  D.shotAt = function (t) { for (var i = RUN.length - 1; i >= 0; i--) if (t >= RUN[i].from) return RUN[i]; return RUN[0] };
  D.run = function () { return RUN };
  D.errors = function () { return ERRORS };
  D.warnings = function () { return WARN };
  D.soundPlan = function () { return { speech: [], music: [], sfx: [] } };
  D.film = function () { return FILM };

  /* ---------------- captions (overlay canvas): top area, a few words at a time, key words in the accent colour ---------------- */
  var GROUPS = null;
  function groups() {
    var g = [], cur = [];
    WORDS.forEach(function (w, i) { cur.push(i); var end = /[.!?,;:]$/.test(w.w) || cur.length >= (D.groupSize || 3), gap = WORDS[i + 1] && WORDS[i + 1].s - w.e > .35; if (end || gap || i === WORDS.length - 1) { g.push(cur); cur = [] } });
    return g;
  }
  D.drawOverlay = function (ctx, w, h, t, opts) {
    ctx.clearRect(0, 0, w, h);
    if (opts && opts.captions === false || !WORDS.length) return;
    if (GROUPS && GROUPS._size !== (D.groupSize || 3)) GROUPS = null;
    if (!GROUPS) { GROUPS = groups(); GROUPS._size = D.groupSize || 3 }
    var gi = -1; for (var i = 0; i < GROUPS.length; i++) { var g = GROUPS[i], s = WORDS[g[0]].s - .05, e = Math.min(WORDS[g[g.length - 1]].e + .35, GROUPS[i + 1] ? WORDS[GROUPS[i + 1][0]].s - .05 : 1e9); if (t >= s && t < e) { gi = i; break } }
    if (gi < 0) return;
    var cs = (opts && opts.style) || {}, land = w > h, grp = GROUPS[gi], fs = Math.round(Math.min(w, h) * (land ? .056 : .074) * (cs.size || 1));
    var k = Math.min(1, Math.max(0, (t - WORDS[grp[0]].s + .05) / .16)), c1 = 1.6, pop = k >= 1 ? 1 : .86 + .14 * (1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2));
    ctx.font = '900 ' + fs + 'px Montserrat, "Arial Black", "DejaVu Sans", Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    var parts = grp.map(function (wi) { return { i: wi, txt: WORDS[wi].w.toUpperCase().replace(/[,;:]$/, '') } });
    var space = fs * .28, widths = parts.map(function (p) { return ctx.measureText(p.txt).width }), total = widths.reduce(function (a, b) { return a + b }, 0) + space * (parts.length - 1);
    var y = h * (cs.pos || (land ? .14 : .172)), x = w / 2 - total / 2;
    ctx.save(); ctx.translate(w / 2, y); ctx.scale(pop, pop); ctx.translate(-w / 2, -y);
    parts.forEach(function (p, j) {
      var word = norm(WORDS[p.i].w), on = KEYS ? KEYS.indexOf(word) >= 0 || KEYS.indexOf(WORDS[p.i].w.toLowerCase().replace(/[.,!?;:]/g, '')) >= 0 : (WORDS[p.i].s <= t && t < WORDS[p.i].e + .1);
      ctx.lineWidth = fs * .16; ctx.strokeStyle = '#2a1810'; ctx.strokeText(p.txt, x, y);
      ctx.fillStyle = on ? (cs.color || '#f2b45a') : '#f6efe2'; ctx.fillText(p.txt, x, y);
      x += widths[j] + space;
    });
    ctx.restore();
  };

  /* ---------------- checks, sheet and preview ---------------- */
  function svgOf(a) {
    if (a.kind === 'character') { F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 3 }); F.groundShadow(540, 1000, 300); F.person(Object.assign({}, a.person, { x: 540, ground: 1000, height: 820 })); return F.render(a.name) }
    if (a.kind === 'set') { return FM.frame({ width: W, height: H, shots: [{ id: 'chk-' + a.name, from: 0, to: 1, bg: a.bg, far: a.far, set: a.set, front: a.front, grade: a.grade, cast: [], camera: [{ at: 0, zoom: 1 }] }] }, 0) }
    return a.draw(F);
  }
  K.svgOf = function (name) { return svgOf(K.make(name)) };
  K.checkAssets = function (p, Hh) {
    var res = {}, loadErr = {};
    if (FM.clear) FM.clear();
    Object.keys(p.assets || {}).forEach(function (n) { var before = K.list().slice(), er = Hh.runCode(p.assets[n], 'asset ' + n); loadErr[n] = { err: er, added: K.list().filter(function (x) { return before.indexOf(x) < 0 }) } });
    K.reset();
    (p.expect || []).forEach(function (x) {
      var r = res[x.name] = { ok: true, errors: [], warnings: [], size: null }, code = (p.assets || {})[x.name] || '', le = loadErr[x.name];
      if (le && le.err) r.errors.push(le.err);
      if (!K.has(x.name)) { r.errors.push("There is no KIT.asset('" + x.name + "', ...) in the answer. The name must be exactly \"" + x.name + '".'); r.ok = false; return }
      if (/requestAnimationFrame|document\.|window\.|THREE|K\.part|K\.person/.test(code)) r.errors.push('Facet style: draw only with F (F.part, F.flat, F.person ...). No document, window, THREE or K.* drawing.');
      if (/feGaussianBlur|filter\s*=|glow|<filter/i.test(code)) r.errors.push('No blur, glow or filters inside assets. The camera adds focus by itself.');
      if (/Math\.random/.test(code)) r.warnings.push('Uses Math.random — the kit is seeded, so leave randomness to F.part.');
      if (/stroke/.test(code)) r.warnings.push('Facet has no outlines (no strokes).');
      var a;
      try { a = K.make(x.name) } catch (e) { r.errors.push('Building "' + x.name + '" crashed: ' + (e.message || e) + Hh.lineInfo(e)); r.ok = false; return }
      var kind = a.kind;
      if (x.kind && kind !== x.kind && !(x.kind === 'creature' && kind === 'prop') && !(x.kind === 'fx' && kind === 'prop')) r.errors.push("kind must be '" + x.kind + "' (it is '" + kind + "').");
      if (kind === 'character') {
        if (!a.person || typeof a.person !== 'object') r.errors.push('A character returns { kind: "character", size, person: { build, skin, hair, top, bottom, shoes ... } }.');
        else if (['adult', 'woman', 'child', undefined].indexOf(a.person.build) < 0) r.errors.push('person.build must be adult, woman or child.');
      } else if (kind === 'set') {
        if (!a.bg) r.warnings.push('A set should give its world colour: bg: "#4b6782".');
        if (!a.far && !a.set) r.errors.push('A set needs layers: far, set and front (functions (F, W, H) that draw the whole frame).');
        if (!a.front) r.warnings.push('No front layer — add dark near silhouettes at the edges for depth.');
        var spots = typeof a.spots === 'function' ? a.spots(W, H) : (a.spots || {});
        if (!Object.keys(spots).length) r.errors.push('A set needs spots: { left: [x, ground], center: [x, ground], ... } in pixels of the 1080 × 1920 frame.');
        (x.spots || []).forEach(function (s) { if (!spots[s]) r.errors.push('Missing spot "' + s + '" in spots.') });
      } else {
        if (typeof a.draw !== 'function') r.errors.push('A ' + kind + ' returns { kind, size, origin: [x, y], top: y, draw: function (F) { F.begin(...); ...; return F.render("...") } }.');
        if (!a.origin) r.warnings.push('No origin: give origin: [x, y] = the point it stands on (bottom centre) in its own drawing.');
        if (a.top == null) r.warnings.push('No top: give top: y = the highest point of the drawing, so the size can be set correctly.');
        if (x.holdable && !a.grip) r.errors.push('This prop is held, so give grip: [x, y] — the point a hand holds, in its own drawing.');
      }
      if (!r.errors.length) {
        try { var s = svgOf(a); if (typeof s !== 'string' || s.indexOf('<svg') < 0) r.errors.push('The drawing did not come out: draw(F) must end with return F.render(\'...\').') }
        catch (e) { r.errors.push('Drawing "' + x.name + '" crashed: ' + (e.message || e) + Hh.lineInfo(e)) }
      }
      r.size = kind === 'set' ? [W, H] : [+(a.size || (kind === 'character' ? 2.6 : 1)).toFixed(2)];
      var want = x.size; if (want && kind !== 'set' && a.size && (a.size > want * 2 || a.size < want / 2)) r.warnings.push('size is ' + a.size + ' but the plan says about ' + want + ' units.');
      var extra = ((le && le.added) || []).filter(function (n) { return n !== x.name }); if (extra.length) r.warnings.push('The answer also defined: ' + extra.join(', ') + ' (ignored here).');
      r.ok = !r.errors.length;
    });
    Hh.post({ type: 'check-assets', results: res }); Hh.say('');
  };
  function gallery(names, big) {
    var st = document.createElement('style');
    st.textContent = 'html,body{margin:0;background:#1a1716;color:#e9dfc8;font:700 13px sans-serif;overflow:auto;height:auto}.g{display:flex;flex-wrap:wrap;gap:14px;padding:14px;justify-content:center}.c{background:#2a2523;border-radius:10px;padding:8px;text-align:center}.c img{display:block;border-radius:6px;background:#000}';
    document.head.appendChild(st);
    var box = document.createElement('div'); box.className = 'g'; document.body.appendChild(box);
    names.forEach(function (n) {
      var c = document.createElement('div'); c.className = 'c'; var img = new Image(), a;
      try { a = K.make(n); img.src = URL.createObjectURL(new Blob([svgOf(a)], { type: 'image/svg+xml' })) } catch (e) { c.textContent = n + ': ' + (e.message || e); box.appendChild(c); return }
      img.style.height = (big ? Math.min(innerHeight - 70, 900) : (a.kind === 'set' ? 360 : 240)) + 'px';
      c.appendChild(img); c.appendChild(document.createTextNode(n + ' · ' + a.kind)); box.appendChild(c);
    });
  }
  K.assetSheet = function () { gallery(K.list(), false) };
  K.preview = function (name) { gallery([name], true) };
})(typeof window !== 'undefined' ? window : globalThis);
