/* =====================================================================
   LOW-POLY DIRECTOR — turns simple SHOT forms into a full video on one timeline.
   The SAME shot vocabulary as the paper style (set, cast, camera, focus, light, moves,
   sfx, text, air, spot, transition ...), played in the 2.5D Low-Poly world.
   Needs engine.js, rig.js, people.js, render.js. LOCKED (LLMs never edit it).
   ===================================================================== */
(function () {
  var K = window.KIT, V3 = K.V3, D = {}; window.DIRECTOR = D;
  var DEG = Math.PI / 180;

  /* ---------- the vocabulary (also used by the app to check shots) ---------- */
  D.ENUM = {
    framing: ['extreme', 'close', 'medium', 'full', 'wide'],
    angle: ['eye', 'low', 'high', 'top', 'dutch'],
    side: ['front', 'front-left', 'front-right', 'left', 'right', 'back-left', 'back-right', 'back'],
    move: ['static', 'drift', 'push-in', 'pull-out', 'orbit-left', 'orbit-right', 'crane-up', 'crane-down', 'truck-left', 'truck-right', 'handheld'],
    lens: ['wide', 'normal', 'tele'],
    mood: ['normal', 'warm', 'cold', 'dark', 'danger', 'silhouette', 'hope', 'flash', 'flashback'],
    compose: ['auto', 'center', 'left', 'right'],
    sound: ['step', 'sneak', 'rustle', 'cloth', 'whoosh', 'swish', 'scrape', 'clink', 'tada', 'thud', 'pop', 'poof', 'tick', 'snore', 'boom', 'sting', 'riser', 'heartbeat', 'dirt', 'bubble', 'boing', 'drip', 'splash', 'bell'],
    ambience: ['night', 'day', 'rain', 'underwater', 'room', 'fire', 'none'],
    music: ['calm', 'playful', 'mystery', 'tension', 'hope', 'sad', 'flashback', 'none'],
    emotion: Object.keys(K.EMO),
    moves: ['walk', 'run', 'sneak', 'move', 'turn', 'look', 'point', 'wave', 'reach', 'nod', 'shake-head', 'talk', 'react', 'appear', 'vanish', 'float', 'spin', 'shake', 'jump', 'fall', 'grow', 'hold', 'drop',
      'crouch', 'hide', 'peek', 'sit', 'sleep', 'yawn', 'cheer', 'cower', 'shiver', 'stomp', 'emerge', 'burrow']
  };
  D.MOODS = {
    normal: { key: .95, amb: .34, back: .3, glow: .35, fg: .8, sub: 0, fog: .012, warm: 0, sat: 1, sepia: 0 },
    warm: { key: 1.05, amb: .4, back: .45, glow: .55, fg: .6, sub: 0, fog: .01, warm: .55, sat: 1.05, sepia: 0 },
    cold: { key: .7, amb: .24, back: .5, glow: .3, fg: .8, sub: .05, fog: .02, warm: -.55, sat: .85, sepia: 0 },
    dark: { key: .42, amb: .15, back: .6, glow: .25, fg: .9, sub: .15, fog: .026, warm: -.25, sat: .8, sepia: 0 },
    danger: { key: .6, amb: .17, back: .95, glow: .6, fg: 1, sub: .35, fog: .02, warm: .35, sat: .9, sepia: 0 },
    silhouette: { key: .22, amb: .1, back: 1.25, glow: .9, fg: 1, sub: .85, fog: .03, warm: -.1, sat: .7, sepia: 0 },
    hope: { key: 1.1, amb: .45, back: .65, glow: .85, fg: .4, sub: 0, fog: .012, warm: .45, sat: 1.1, sepia: 0 },
    flash: { key: 2.3, amb: .95, back: 1, glow: 1.3, fg: 0, sub: 0, fog: 0, warm: 0, sat: .6, sepia: 0 },
    flashback: { key: .62, amb: .32, back: .5, glow: .55, fg: .6, sub: .2, fog: .016, warm: .25, sat: .35, sepia: .6 }
  };
  var FRAMES = { // h = frame height as part of subject height, cy = look height as part of subject height, ap = blur strength
    extreme: { h: .3, cy: .86, ap: .026 }, close: { h: .5, cy: .8, ap: .02 }, medium: { h: .82, cy: .66, ap: .014 },
    full: { h: 1.6, cy: .5, ap: .007 }, wide: { h: 2.9, cy: .45, ap: .0035 }
  };
  // the camera in the 2.5D world turns only a little: 'left' / 'right' give a three-quarter view with parallax; back views are shown from the front
  var SIDES = { front: 0, 'front-left': 12, 'front-right': -12, left: 30, right: -30, 'back-left': 36, 'back-right': -36, back: 0 };
  var ANGLES = { eye: 2, low: -6, high: 11, top: 21, dutch: 2 };
  var LENSES = { wide: 44, normal: 32, tele: 22 };
  var GESTURE = { point: 1.6, wave: 1.6, reach: 1.4, nod: .8, 'shake-head': .9, talk: 2, react: .6, shake: .6, jump: .7, peek: 1.3, yawn: 1.8, cheer: 1.4, shiver: 1.2, stomp: .5, emerge: 1.4, burrow: 1.2 };

  /* ---------- built-in assets ---------- */
  function builtins() {
    if (!K.has('kato')) K.asset('kato', function (K) { return K.mascot('kato') });
    if (!K.has('nia')) K.asset('nia', function (K) { return K.mascot('nia') });
    if (!K.has('void')) K.asset('void', function (K) {
      return K.set({ layers: [], width: 40, depth: 14, spots: { center: [0, 0, 0], left: [-1.6, 0, 0], right: [1.6, 0, 0], front: [0, 0, 1.6], back: [0, 0, -2] } });
    });
  }

  /* ---------- small helpers ---------- */
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)) }
  function norm(w) { return String(w || '').toLowerCase().replace(/[^a-z0-9']/g, '').replace(/'/g, '') }
  function v3(a) { return a instanceof V3 ? a.clone() : new V3(a[0] || 0, a[1] || 0, a[2] || 0) }
  function yawTo(from, to) { return Math.atan2(to.x - from.x, to.z - from.z) }
  function angDiff(a, b) { var d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d }
  function isHuman(a) { return !!(a && a.human) }
  function living(a) { return a.kind === 'character' || a.kind === 'creature' }

  /* ---------- instances (one pool per asset, reused across shots) ---------- */
  var POOL = {}, ALL = [], SIZES = {};
  function snapshot(a) { var r = a.root; return { pos: r.position.clone(), rot: { x: r.rotation.x, y: r.rotation.y, z: r.rotation.z }, scl: r.scale.clone(), vis: r.visible } }
  function restore(inst) {
    var s = inst.snap, a = inst.a, r = a.root; r.position.copy(s.pos); r.rotation.x = s.rot.x; r.rotation.y = s.rot.y; r.rotation.z = s.rot.z; r.scale.copy(s.scl); r.visible = true;
    if (a.reset) a.reset(); a.alphaMul = undefined; a.squash = 1; a.dir = 1; inst.held = []; inst.held_by = null; inst.mound = 0; inst.dirt = 0;
    var f = a.face; if (f) { f.clear(); f.look(null) }
  }
  function getInst(name, n) {
    var p = POOL[name] || (POOL[name] = []);
    while (p.length <= n) {
      var a = K.make(name, {}), kind = a.kind || (isHuman(a) ? 'character' : 'prop');
      var inst = { name: name, uid: name + '#' + p.length, a: a, kind: kind, held: [], held_by: null };
      var w = a.width || (a.size && a.size.x) || 1, h = a.height || 1, sc = a.root.scale;
      if (a.isSet) { inst.size = a.size.clone(); inst.boxMin = a.boxMin.clone(); inst.boxMax = a.boxMax.clone(); inst.height = a.height }
      else { w *= sc.x; h *= sc.y; inst.size = new V3(w, h, w * .5); inst.boxMin = new V3(-w / 2, 0, -w * .25); inst.boxMax = new V3(w / 2, h, w * .25); inst.height = h }
      inst.snap = snapshot(a);
      var plan = SIZES[name], measured = isHuman(a) ? inst.height : Math.max(inst.size.x, inst.size.y);
      if (plan > 0 && kind !== 'set' && kind !== 'fx' && measured > 0) { // keep proportions true to the plan if a chat built it far too big/small
        var ratio = plan / measured;
        if (ratio < .4 || ratio > 2.5) { a.root.scale.multiplyScalar(ratio); inst.size.multiplyScalar(ratio); inst.boxMin.multiplyScalar(ratio); inst.boxMax.multiplyScalar(ratio); inst.height *= ratio; inst.snap = snapshot(a); inst.rescaled = ratio }
      }
      a.root.visible = false; inst.snap.vis = false; p.push(inst); ALL.push(inst);
    }
    return p[n];
  }

  /* ---------- timing ---------- */
  var CUT, WORDS = [], RUN = [], CUR = -1, ERRORS = {}, WARN = {};
  function warn(id, msg) { (WARN[id] = WARN[id] || []); if (WARN[id].indexOf(msg) < 0) WARN[id].push(msg) }
  function timeOf(e, sh, label) {
    if (e == null) return sh.from;
    if (typeof e.sec === 'number') return sh.from + e.sec;
    if (e.word) {
      var want = String(e.word).toLowerCase().split(/\s+/).map(norm).filter(Boolean), nth = e.nth || 1, seen = 0;
      for (var i = 0; i < WORDS.length; i++) {
        var w = WORDS[i]; if (w.s < sh.from - .05 || w.s >= sh.to) continue;
        var ok = true; for (var j = 0; j < want.length; j++) { var ww = WORDS[i + j]; if (!ww || norm(ww.w).indexOf(want[j]) !== 0) { ok = false; break } }
        if (ok && ++seen === nth) return w.s;
      }
      warn(sh.id, (label || 'entry') + ': word "' + e.word + '" is not spoken in this shot, so it starts at the shot start.');
      return sh.from;
    }
    return sh.from;
  }
  function placeholder(sh) {
    return { set: 'void', cast: {}, camera: { framing: 'wide', move: 'drift' }, light: [{ mood: 'dark' }], text: [{ sec: 0, say: 'SHOT ' + sh.id + ' — not made yet', for: 999, small: true }], _placeholder: true };
  }

  /* ---------- build ---------- */
  D.build = function (o) {
    builtins(); D.sky = o.sky; SIZES = o.sizes || {}; if (o.look) Object.assign(D.LOOK, o.look); CUT = o.cut; WORDS = (CUT.words || []).map(function (w) { return { w: w[0], s: w[1], e: w[2] } });
    var lines = CUT.lines || [], plan = CUT.shots || [], dur = CUT.duration, defs = D.defs;
    RUN = plan.map(function (p, i) {
      var l0 = lines[p.from_line] || lines[0] || { s: 0 }, from = i === 0 ? 0 : l0.s;
      return { id: p.id, idx: i, plan: p, from: from, spec: defs[p.id] || placeholder(p), made: !!defs[p.id] };
    });
    RUN.forEach(function (r, i) { r.to = i + 1 < RUN.length ? RUN[i + 1].from : dur; if (r.to <= r.from) { r.to = r.from + .5; warn(r.id, 'This shot has no time (its lines overlap the next shot).') } });
    RUN.forEach(function (r, i) { var pv = RUN[i - 1], tr = r.spec.transition; r.flow = !!pv && r.made && pv.made && tr !== 'cut' && (tr === 'flow' || (r.spec.set || 'void') === (pv.spec.set || 'void')) });
    var lens = [], light = [], cues = [];
    RUN.forEach(function (r) {
      try { prepare(r) } catch (e) { ERRORS[r.id] = String(e && e.message || e); r.spec = placeholder(r); r.spec.text[0].say = 'SHOT ' + r.id + ' ERROR'; prepare(r) }
      r.lens.forEach(function (l) { lens.push(l) }); r.light.forEach(function (l) { light.push(l) }); r.cues.forEach(function (q) { cues.push(q) });
    });
    lens.sort(function (a, b) { return a.at - b.at }); light.sort(function (a, b) { return a.at - b.at }); cues.sort(function (a, b) { return a[0] - b[0] });
    K.lens(lens).light(light).cues(cues);
    K.curShot = function (t) { var r = RUN[shotAt(t)]; return r ? { from: r.from, flow: r.flow } : null };
    RUN.forEach(function (r, i) { // walk the video once to learn where everything ends, so the next continuous shot starts there
      var pv = RUN[i - 1]; if (r.flow && pv) { r.startFrom = pv.endState; r.prevCam = pv.endCam }
      var tEnd = Math.max(r.from, r.to - .02);
      try { show(i); pose(r, tEnd, tEnd - r.from); camera(r, tEnd) } catch (e) { }
      r.endState = {}; Object.keys(r.cast).forEach(function (k) { var a = r.cast[k].a; r.endState[r.cast[k].uid] = { pos: a.root.position.clone(), yaw: a.root.rotation.y } });
      r.endCam = { cam: cloneCam(K.cam) };
    });
    CUR = -1;
    K.ambience({ room: .03, pad: o.sky === 'warm' ? [196, 246.9, 293.7] : [174.6, 207.7, 261.6], padVol: .012 });
    K.update(update);
    return { warnings: WARN, errors: ERRORS, shots: RUN.map(function (r) { return { id: r.id, from: r.from, to: r.to, made: r.made } }) };
  };
  function cloneCam(c) { return { target: c.target.clone(), dist: c.dist, yaw: c.yaw, pitch: c.pitch, fov: c.fov, roll: c.roll } }

  function prepare(r) {
    var s = r.spec, id = r.id;
    if (!s || typeof s !== 'object') throw new Error('SHOT ' + id + ' must be SHOT(\'' + id + '\', { ... })');
    var setName = s.set || 'void'; if (!K.has(setName)) { warn(id, 'set "' + setName + '" does not exist, using an empty stage.'); setName = 'void' }
    r.set = getInst(setName, 0);
    if (r.set.kind !== 'set') warn(id, '"' + setName + '" is not a set (kind:' + r.set.kind + ').');
    var used = {}; r.cast = {}; r.castSpec = s.cast || {};
    Object.keys(r.castSpec).forEach(function (key) {
      var c = r.castSpec[key] || {}, an = c.asset || key;
      if (!K.has(an)) { warn(id, 'cast "' + key + '": no asset called "' + an + '".'); return }
      var n = used[an] || 0; used[an] = n + 1; r.cast[key] = getInst(an, n);
    });
    r.moves = (s.moves || []).map(function (m, i) {
      var mm = Object.assign({}, m); mm.t0 = timeOf(m, r, 'move ' + (i + 1)); mm.i = i;
      if (!r.cast[m.who]) warn(id, 'move ' + (i + 1) + ': "' + m.who + '" is not in the cast.');
      if (m.do && D.ENUM.moves.indexOf(m.do) < 0) { var a = r.cast[m.who] && r.cast[m.who].a; if (!(a && a.do && typeof a.do[m.do] === 'function')) warn(id, 'move ' + (i + 1) + ': "' + m.do + '" is not a built-in move and "' + m.who + '" has no do.' + m.do + '().') }
      if (m.face && !K.EMO[m.face]) warn(id, 'move ' + (i + 1) + ': unknown face "' + m.face + '".');
      mm.dur = m.for || GESTURE[m.do] || (m.do === 'walk' || m.do === 'run' || m.do === 'move' || m.do === 'sneak' ? 2 : .5);
      return mm;
    }).sort(function (a, b) { return a.t0 - b.t0 || a.i - b.i });
    var cm = s.camera || {}; r.camSpec = cm;
    if (s.ambience && D.ENUM.ambience.indexOf(s.ambience) < 0) warn(id, 'ambience "' + s.ambience + '" is not allowed. Use: ' + D.ENUM.ambience.join(', '));
    if (s.music && s.music !== false && D.ENUM.music.indexOf(s.music) < 0) warn(id, 'music "' + s.music + '" is not allowed. Use: ' + D.ENUM.music.join(', '));
    if (s.air && D.ENUM.air.indexOf(s.air) < 0) warn(id, 'air "' + s.air + '" is not allowed. Use: ' + D.ENUM.air.join(', '));
    ['framing', 'angle', 'side', 'move', 'lens', 'compose'].forEach(function (k) { if (cm[k] && D.ENUM[k].indexOf(cm[k]) < 0) warn(id, 'camera.' + k + ' "' + cm[k] + '" is not allowed. Use: ' + D.ENUM[k].join(', ')) });
    var fov = LENSES[cm.lens] || (cm.framing === 'wide' ? 42 : 32);
    r.cam = { fov: fov, hand: cm.move === 'handheld' ? .02 : 0, roll: cm.angle === 'dutch' ? .12 : 0, shake: (cm.shake ? [].concat(cm.shake) : []).map(function (e) { return [timeOf(e, r, 'camera shake'), e.amount || .06] }) };
    var fr = FRAMES[cm.framing || 'medium'] || FRAMES.medium, onNames = [].concat(cm.on || (cm.framing === 'wide' ? [] : Object.keys(r.cast)[0]) || []);
    var longShot = cm.framing === 'wide' || cm.framing === 'full';
    var focus = s.focus && s.focus.length ? s.focus : [{ on: longShot && Object.keys(r.cast).length ? Object.keys(r.cast) : (onNames.length ? onNames : Object.keys(r.cast)[0]) }];
    (s.focus || []).forEach(function (f) { [].concat(f.on || []).forEach(function (n) { if (n && r.cast[n] && onNames.indexOf(n) < 0 && cm.framing !== 'wide') warn(id, 'focus on "' + n + '" but the camera only frames ' + (onNames.join(', ') || 'the set') + ' — add it to camera.on or it may be off screen.') }) });
    r.lens = focus.map(function (f, i) {
      var objs = [].concat(f.on || []).map(function (n) { var ii = r.cast[n]; if (!ii) { if (n) warn(id, 'focus: "' + n + '" is not in the cast.'); return null } return ii }).filter(Boolean);
      if (!objs.length) objs = [r.set];
      return { at: i === 0 ? r.from : timeOf(f, r, 'focus ' + (i + 1)), on: objs, pull: i === 0 ? (r.flow ? .6 : 0) : (f.pull === undefined ? .4 : f.pull), ap: f.blur ? clamp(fr.ap * f.blur, .002, .05) : fr.ap, pad: longShot ? .9 : .12 };
    });
    var ls = s.light ? [].concat(s.light) : [{ mood: 'normal' }];
    if (typeof s.light === 'string') ls = [{ mood: s.light }];
    r.light = ls.map(function (l, i) {
      if (typeof l === 'string') l = { mood: l };
      var M = D.MOODS[l.mood] || (warn(id, 'light: unknown mood "' + l.mood + '"'), D.MOODS.normal);
      return Object.assign({ mood: D.MOODS[l.mood] ? l.mood : 'normal', at: i === 0 ? r.from : timeOf(l, r, 'light ' + (i + 1)), ease: i === 0 ? (r.flow ? 1 : 0) : (l.ease === undefined ? .3 : l.ease) }, M);
    });
    r.cues = (s.sfx || []).map(function (q, i) {
      if (D.ENUM.sound.indexOf(q.sound) < 0) warn(id, 'sfx ' + (i + 1) + ': unknown sound "' + q.sound + '"');
      return [timeOf(q, r, 'sfx ' + (i + 1)), q.sound, q.length];
    });
    r.text = (s.text ? [].concat(s.text) : []).map(function (x, i) { return { t0: timeOf(x, r, 'text ' + (i + 1)), say: String(x.say || ''), dur: x.for || 2.2, small: x.small } });
    r.subjectNames = onNames.filter(function (n) { return r.cast[n] });
  }

  /* ---------- per-frame ---------- */
  function shotAt(t) { for (var i = RUN.length - 1; i >= 0; i--) if (t >= RUN[i].from) return i; return 0 }
  D.shotAt = function (t) { var i = shotAt(t); return RUN[i] };
  function show(i) {
    ALL.forEach(function (x) { x.a.root.visible = false });
    var r = RUN[i]; if (!r) return; r.set.a.root.visible = true;
    Object.keys(r.cast).forEach(function (k) { r.cast[k].a.root.visible = true });
    var ents = []; Object.keys(r.cast).forEach(function (k) { ents.push(r.cast[k]) });
    K.stage = { set: r.set, ents: ents };
  }
  function resolvePos(r, val, fallback) {
    if (val == null) return fallback ? fallback.clone() : new V3();
    if (Array.isArray(val)) return v3(val);
    if (typeof val === 'object' && val.isVector3) return val.clone();
    var spots = (r.set.a.spots) || {};
    if (spots[val]) return v3(spots[val]);
    if (r.cast[val]) return r.cast[val].a.root.position.clone();
    var def = { center: [0, 0, 0], left: [-1.6, 0, 0], right: [1.6, 0, 0], front: [0, 0, 1.6], back: [0, 0, -2], far: [0, 0, -5] }[val];
    if (def) return v3(def);
    warn(r.id, 'place "' + val + '" not found (set spots: ' + Object.keys(spots).join(', ') + ').');
    return new V3();
  }
  function resolveYaw(r, inst, val) {
    if (val == null) return 0;
    if (typeof val === 'number') return val * DEG;
    var named = { front: 0, left: -90, right: 90, back: 180 };
    if (val === 'camera') return yawTo(inst.a.root.position, K.camera.position);
    if (named[val] != null) return named[val] * DEG;
    if (r.cast[val]) return yawTo(inst.a.root.position, r.cast[val].a.root.position);
    return yawTo(inst.a.root.position, resolvePos(r, val));
  }
  function update(t) {
    var i = shotAt(t), r = RUN[i]; if (!r) return;
    if (i !== CUR) { show(i); CUR = i }
    var L = t - r.from;
    try { pose(r, t, L) } catch (e) { var msg = String(e && e.message || e); if (ERRORS[r.id] !== msg) { ERRORS[r.id] = msg; if (D.onError) D.onError(r.id, msg) } }
    camera(r, t);
    D.overlayText = (D.LOOK.cards || r.spec._placeholder) ? r.text.filter(function (x) { return t >= x.t0 && t < x.t0 + x.dur }) : [];
  }

  /* where something is, as a point in the world */
  function worldTarget(r, v) {
    if (v === 'camera') return K.camera.position.clone();
    if (r.cast[v]) { var a = r.cast[v].a, p = a.root.position; return new V3(p.x, p.y + (a.height || 1) * a.root.scale.y * (isHuman(a) ? .88 : .5), p.z) }
    return resolvePos(r, v);
  }
  function dirFromYaw(a, yaw, camYaw) {
    var s = Math.sin(yaw - camYaw), x = a.root.position.x;
    if (Math.abs(s) > .25) { a.squash = 1; return s > 0 ? 1 : -1 }
    a.squash = .88 + .12 * Math.abs(s) / .25;
    return x > .3 ? -1 : 1;                 // facing the camera: look toward the middle of the stage
  }

  function pose(r, t, L) {
    var keys = Object.keys(r.cast), camYaw = (K.cam && K.cam.yaw) || 0;
    keys.forEach(function (k) {
      var inst = r.cast[k], a = inst.a, c = r.castSpec[k] || {};
      restore(inst);
      var sf = r.startFrom && r.startFrom[inst.uid];
      if (sf && !c.reset) { a.root.position.copy(sf.pos); a.root.rotation.y = sf.yaw }
      else { a.root.position.copy(resolvePos(r, c.at)); if (c.y) a.root.position.y += c.y; a.root.rotation.y = 0; a.root.rotation.y = resolveYaw(r, inst, c.turn) }
      if (c.tilt) a.root.rotation.z = c.tilt * DEG;
      if (c.size) a.root.scale.multiplyScalar(c.size);
      if (a.face) { a.face.t = t; a.face.show(c.face || 'neutral'); if (c.look) a.face.look(c.look) }
      if (a.idle) a.idle(t);
      if (c.hidden) a.root.visible = false;
    });
    var holds = {};
    r.moves.forEach(function (m) {
      var inst = r.cast[m.who]; if (!inst) return;
      var before = t < m.t0;
      if (before && m.do !== 'appear' && m.do !== 'emerge') return;
      var local = Math.max(0, t - m.t0), k = clamp(local / m.dur, 0, 1);
      if (m.face && !before && inst.a.face) inst.a.face.show(m.face);
      if (m.do) doMove(r, inst, m, k, local, before, holds, t);
    });
    keys.forEach(function (k) { var a = r.cast[k].a; if (isHuman(a) && !(r.castSpec[k] || {}).still) posture(a, t, k.length) });
    // who is looking at whom: talkers draw the eye, pointing draws the eye
    var talker = null, pointed = null, lookers = {};
    r.moves.forEach(function (m) { if (t < m.t0 || t > m.t0 + m.dur) return; if (m.do === 'talk' && r.cast[m.who]) talker = r.cast[m.who]; if (m.do === 'point' && m.to) pointed = { by: r.cast[m.who], to: m.to }; if (m.do === 'look' || m.do === 'hide' || m.do === 'peek') lookers[m.who] = 1 });
    keys.forEach(function (k) {
      var inst = r.cast[k], a = inst.a; if (!isHuman(a) || lookers[k] || (r.castSpec[k] || {}).look || (r.castSpec[k] || {}).still) return;
      var tg = null; if (talker && talker !== inst) tg = worldTarget(r, Object.keys(r.cast).filter(function (n) { return r.cast[n] === talker })[0]); else if (pointed && pointed.by !== inst) tg = worldTarget(r, pointed.to);
      if (tg) lookAt(a, tg, .9);
    });
    // set the facing of everything that turns (people and creatures), then the held things
    keys.forEach(function (k) { var inst = r.cast[k], a = inst.a; if (living(a)) a.dir = dirFromYaw(a, a.root.rotation.y, camYaw) });
    Object.keys(holds).forEach(function (itemKey) {
      var h = holds[itemKey], item = r.cast[itemKey], who = r.cast[h.who]; if (!item || !who) return;
      who.held.push({ ent: item, part: h.hand === 'L' ? 'handB' : 'handF', hand: h.hand || 'R', angle: h.angle || 0, t: t }); item.held_by = who.uid;
    });
    r._spot = r.spec.spotlight === false ? null : spotlightActor(r, t);
    if (r.spec.extra) r.spec.extra.call(null, t - r.from, castView(r), K, { t: t, from: r.from, to: r.to });
  }
  function castView(r) { var o = {}; Object.keys(r.cast).forEach(function (k) { o[k] = r.cast[k].a }); o.set = r.set.a; return o }

  /* turn the head (and eyes) toward a point in the world; behind the body = the head mirrors */
  function lookAt(a, tp, w) {
    if (!a.face) return; var p = a.root.position, dx = tp.x - p.x, dir = a.dir || 1;
    a.face.lookT = true; a.face.lookDir = clamp(dx * dir * .6, -1, 1) * (w === undefined ? 1 : w);
    if (isHuman(a) && Math.abs(dx) > .35 && dx * dirOfYaw(a) < 0) { a.j.head.fx = 1 - 2 * clamp(w === undefined ? 1 : w, 0, 1) }
    if (isHuman(a)) { var dy = tp.y - (p.y + a.height * .9); a.j.head.rot += clamp(-dy * 1.2, -4, 4) * (w || 1) * (dx * dirOfYaw(a) >= 0 ? 1 : -1) * 0 }
  }
  function dirOfYaw(a) { return Math.sin(a.root.rotation.y - ((K.cam && K.cam.yaw) || 0)) > .25 ? 1 : Math.sin(a.root.rotation.y - ((K.cam && K.cam.yaw) || 0)) < -.25 ? -1 : (a.root.position.x > .3 ? -1 : 1) }

  /* ---------- built-in moves ---------- */
  function armOut(a, side) { var sh = a.arm[side].sh[0]; return sh > a.headX ? -1 : 1 }          // sign of the rotation that swings the arm outward
  function doMove(r, inst, m, k, local, before, holds, t) {
    var a = inst.a, root = a.root, H = isHuman(a), e = K.ease(k);
    switch (m.do) {
      case 'walk': case 'run': case 'move': case 'sneak': {
        var from = root.position.clone(), to = resolvePos(r, m.to, from); if (m.to == null) warn(r.id, m.do + ' for "' + m.who + '" needs to:');
        var kk = m.do === 'move' ? e : K.ease(k) * .55 + k * .45;
        root.position.lerpVectors(from, to, kk);
        if (m.arc) root.position.y += Math.sin(Math.PI * k) * m.arc;
        var dist = from.distanceTo(to);
        if (dist > .05 && m.face_dir !== false) root.rotation.y = yawTo(from, to);
        if (k < 1 && H) walkCycle(a, dist * kk, m.do === 'run' ? 2 : m.do === 'sneak' ? .6 : 1);
        if (H && m.do === 'sneak') crouchPose(a, Math.min(1, local * 3) * .6);
        if (k < 1 && a.do && a.do.walk && !H) a.do.walk.call(a, k, local, m);
        else if (k < 1 && !H && living(a) && m.do !== 'move') hop(a, dist * kk);
        break }
      case 'turn': { var y0 = root.rotation.y, y1 = resolveYaw(r, inst, m.to), dd = angDiff(y0, y1); root.rotation.y = y0 + dd * e; if (H && k < 1) a.j.head.rot += clamp(dd * (1 - e) * 10, -8, 8); break }
      case 'look': { if (a.face) { if (m.to == null || m.to === 'none') a.face.look(null); else lookAt(a, worldTarget(r, m.to), e) } break }
      case 'point': case 'reach': if (H && k < 1) armAim(r, a, m, k, local); break;
      case 'wave': if (H && k < 1) {
        var side = m.hand === 'L' ? 'B' : 'F', o = armOut(a, side), w = Math.min(1, k * 5, (1 - k) * 5), A = side === 'F' ? 'armF' : 'armB', Fo = side === 'F' ? 'foreF' : 'foreB';
        a.j[A].rot += o * (128 * w); a.j[Fo].rot += -o * 30 * w + o * Math.sin(local * 14) * 22 * w; if (a.face && a.face.target === 'neutral') a.face.show('happy') } break;
      case 'nod': if (k < 1 && H) { var nw = Math.sin(Math.PI * k); a.j.head.dy += Math.abs(Math.sin(local * 11)) * 14 * nw; a.j.head.rot += Math.sin(local * 11) * 3 * nw } break;
      case 'shake-head': if (k < 1 && H) { var sw = Math.sin(Math.PI * k); a.j.head.fx = 1; a.j.head.sx = 1 - .13 * Math.abs(Math.sin(local * 13)) * sw; a.j.head.rot += Math.sin(local * 13) * 4 * sw } else if (k < 1) root.rotation.z += Math.sin(local * 13) * .1 * Math.sin(Math.PI * k); break;
      case 'talk': if (k < 1 && a.face) {
        a.face.mouthOpen = m.sync === false ? [.1, .35, .65][Math.floor(local * 12) % 3] : mouthOpen(t); if (H) { a.j.head.rot += Math.sin(local * 5) * 1.4; a.j.head.dy += Math.sin(local * 9) * 2; talkHands(a, local, k, t) } else a.j.main && (a.j.main.dy -= Math.abs(Math.sin(local * 14)) * 6) } break;
      case 'react': if (k < 1) reactPose(root, local, m.type || 'take'); break;
      case 'appear': { var s = before ? 0 : (k < 1 ? K.ease(k) * (1 + .15 * Math.sin(Math.PI * k)) : 1); root.scale.multiplyScalar(Math.max(.0001, s)); if (before) root.visible = false; break }
      case 'vanish': root.scale.multiplyScalar(Math.max(.0001, 1 - e)); if (k >= 1) root.visible = false; break;
      case 'float': root.position.y += (m.height || .15) * (.5 + .5 * Math.sin(local * (m.speed || 2.2))); break;
      case 'spin': { var sp = e * Math.PI * 2 * (m.turns || 1); a.squash = Math.max(.12, Math.abs(Math.cos(sp))); if (Math.cos(sp) < 0) a.dir = -(a.dir || 1); a.spinFlip = true; break }
      case 'shake': if (k < 1) root.rotation.z += Math.sin(local * 60) * .08 * (1 - k); break;
      case 'jump': if (k < 1) { root.position.y += Math.sin(Math.PI * k) * (m.height || .8); if (H) { reactPose(root, local, k < .15 ? 'land' : 'none'); var jw = Math.sin(Math.PI * k); a.j.armF.rot += armOut(a, 'F') * 30 * jw; a.j.armB.rot += armOut(a, 'B') * 30 * jw } } break;
      case 'fall': { var ax = m.to === 'back' ? 1 : -1; root.rotation.z += ax * Math.PI / 2 * K.ease(k) * .98; break }
      case 'grow': { var g1 = m.size || 1.5; root.scale.multiplyScalar(K.mix(1, g1, e)); break }
      case 'hold': if (m.item) { holds[m.item] = { who: m.who, hand: m.hand, angle: m.angle }; if (H) { var sd = m.hand === 'L' ? 'B' : 'F', oo = armOut(a, sd); a.j[sd === 'F' ? 'armF' : 'armB'].rot += oo * 22; a.j[sd === 'F' ? 'foreF' : 'foreB'].rot += oo * 72 } } break;
      case 'drop': if (m.item && holds[m.item]) delete holds[m.item]; break;
      case 'crouch': if (H) crouchPose(a, K.ease(Math.min(1, local / Math.min(m.dur, .6)))); break;
      case 'hide': if (H) { crouchPose(a, K.ease(Math.min(1, local / .45))); var cyc = (local % 3.2) / 3.2, pk = k < 1 && cyc > .45 && cyc < .85 ? Math.sin(Math.PI * (cyc - .45) / .4) : 0, sdd = m.side === 'left' ? 1 : -1; leanPose(a, sdd, pk * e); if (a.face && m.to) lookAt(a, worldTarget(r, m.to), .3 + .7 * pk) } break;
      case 'peek': if (H && k < 1) { var pw = Math.sin(Math.PI * k); leanPose(a, m.side === 'left' ? 1 : -1, pw); if (a.face && m.to) lookAt(a, worldTarget(r, m.to), pw) } break;
      case 'sit': if (H) { sitPose(a, e, m.seat || 0) } break;
      case 'sleep': if (H) { a.j.head.rot += 14 * e; a.j.upper.rot += 3 * e; a.j.upper.dy += Math.sin(local * 1.3) * 3 * e; if (a.face) a.face.show('sleepy') } else if (a.face) a.face.show('sleepy'); break;
      case 'yawn': if (H && k < 1) { var yw = Math.sin(Math.PI * k); a.j.armF.rot += armOut(a, 'F') * 150 * yw; a.j.armB.rot += armOut(a, 'B') * 150 * yw; a.j.head.rot -= 6 * yw; if (a.face) a.face.show(yw > .3 ? 'surprised' : 'sleepy') } break;
      case 'cheer': if (k < 1) { var cw = Math.min(1, k * 5, (1 - k) * 5); if (H) { a.j.armF.rot += armOut(a, 'F') * (150 + Math.sin(local * 12) * 8) * cw; a.j.armB.rot += armOut(a, 'B') * (150 - Math.sin(local * 12) * 8) * cw; if (a.face) a.face.show('happy') } root.position.y += Math.abs(Math.sin(local * 7)) * .12 * cw } break;
      case 'cower': if (H) { crouchPose(a, e); a.j.armF.rot += armOut(a, 'F') * -40 * e; a.j.foreF.rot += armOut(a, 'F') * -100 * e; a.j.armB.rot += armOut(a, 'B') * -40 * e; a.j.foreB.rot += armOut(a, 'B') * -100 * e; if (a.face) a.face.show('scared') } break;
      case 'shiver': if (k < 1 || m.keep) root.rotation.z += Math.sin(local * 70) * .025; break;
      case 'stomp': if (H && k < 1) { var lg = m.leg === 'L' ? 'legB' : 'legF'; if (a.hasLegs) a.j[lg].rot += -26 * Math.sin(Math.PI * Math.min(1, k * 1.4)); root.position.y += Math.max(0, Math.sin(Math.PI * Math.min(1, k * 1.4))) * .06; if (k > .7) reactPose(root, local - m.dur * .7, 'land') } break;
      case 'emerge': { var dep = Math.max(.2, inst.height * root.scale.y) * (m.depth || 1.05); root.position.y -= dep * (1 - e); root.rotation.z += Math.sin(local * 14) * .06 * (1 - k); inst.mound = before ? 0 : Math.min(1, local / .3); if (!before && local < 1.1) inst.dirt = local; break }
      case 'burrow': { var dep2 = Math.max(.2, inst.height * root.scale.y) * 1.05; root.position.y -= dep2 * e; root.rotation.z += Math.sin(local * 14) * .06 * Math.min(1, k * 3); inst.mound = 1; if (local < 1.1) inst.dirt = local; break }
      default:
        if (a.do && typeof a.do[m.do] === 'function') a.do[m.do].call(a, k, local, m);
    }
  }
  /* walking without foot sliding: the step phase follows the distance walked */
  function walkCycle(a, travelled, speed) {
    var stride = speed > 1 ? 1.5 : speed < 1 ? .6 : .95, ph = 2 * Math.PI * travelled / stride, sn = Math.sin(ph), cs = Math.cos(ph), amp = speed > 1 ? 24 : speed < 1 ? 9 : 13, J = a.j;
    if (a.hasLegs) {
      J.legF.rot += -amp * sn; J.shinF.rot += (speed > 1 ? 40 : 22) * Math.pow(Math.max(0, cs), 1.5); J.legB.rot += amp * sn; J.shinB.rot += (speed > 1 ? 40 : 22) * Math.pow(Math.max(0, -cs), 1.5);
    } else if (J.legF) { J.legF.rot += -amp * .6 * sn; J.legB.rot += amp * .6 * sn; J.legF.dy -= Math.max(0, cs) * 8; J.legB.dy -= Math.max(0, -cs) * 8; if (J.skirt) J.skirt.rot += sn * 1.8 }
    a.root.position.y += Math.abs(sn) * .035 * speed * -1 + .035 * speed;
    J.upper.rot += 2.5 * (speed > 1 ? 2 : 1); J.head.rot += Math.sin(ph * 2) * 1.2;
    var o = armOut(a, 'F'), o2 = armOut(a, 'B'), asw = speed > 1 ? 26 : 14;
    J.armF.rot += o * asw * sn * -1; J.foreF.rot += o * (10 + 6 * Math.max(0, sn)); J.armB.rot += o2 * asw * sn; J.foreB.rot += o2 * (10 + 6 * Math.max(0, -sn));
  }
  function hop(a, travelled) { if (a.j.main) a.j.main.dy -= Math.abs(Math.sin(travelled * 6)) * 14 }
  function armAim(r, a, m, k, local) {
    var side = m.hand === 'L' ? 'B' : 'F', A = side === 'F' ? 'armF' : 'armB', Fo = side === 'F' ? 'foreF' : 'foreB', w = Math.min(1, k * 4, (1 - k) * 4), o = armOut(a, side);
    var sh = a.arm[side].sh, p = a.root.position, sc = a.root.scale.y, dir = a.dir || 1;
    var S0 = new V3(p.x + (sh[0] - a.anchor[0]) / a.ppu * sc * dir, p.y + (a.anchor[1] - sh[1]) / a.ppu * sc, p.z), tp;
    if (m.to != null) tp = worldTarget(r, m.to); else tp = new V3(p.x + dir * 1.5, p.y + a.height * .6, p.z);
    var dx = (tp.x - S0.x) * dir, dyDown = -(tp.y - S0.y), ang;
    if (Math.abs(dx) < .08 && tp.z > p.z) ang = o * -1 * 0 + o * 25 * -1; else ang = Math.atan2(-dx, dyDown) * 180 / Math.PI;
    a.j[A].rot += ang * w; a.j[Fo].rot += (m.do === 'reach' ? 0 : 0) * w;
    if (m.do === 'reach') a.j.upper.rot += o * -8 * w;
  }
  function talkHands(a, local, k, t) { var o = armOut(a, 'F'); a.j.armF.rot += o * (10 + 4 * Math.sin(local * 3)); a.j.foreF.rot += o * (40 + 14 * Math.sin(local * 4.3)) }
  function reactPose(o, d, type) {
    var F = 1 / 12, sx = 1, sy = 1;
    if (type === 'take') { if (d < 2 * F) { sy = .9; sx = 1.06 } else if (d < 4 * F) { sy = 1.12; sx = .93 } else if (d < 7 * F) { var k = (d - 4 * F) / (3 * F); sy = K.mix(1.12, 1, k); sx = K.mix(.93, 1, k) } }
    else if (type === 'land') { if (d < 2 * F) { sy = .85; sx = 1.1 } else if (d < 5 * F) { var k2 = (d - 2 * F) / (3 * F); sy = K.mix(.85, 1, k2); sx = K.mix(1.1, 1, k2) } }
    else if (type === 'twitch') { if (d < F) sy = 1.08 }
    else if (type === 'shake') { if (d < .5) o.rotation.z += Math.sin(d * 90) * .08 * (1 - d * 2) }
    o.scale.x *= sx; o.scale.y *= sy;
  }
  /* crouching and sitting: the body drops, the legs shorten */
  function dropBody(a, px, legS) {
    var J = a.j; J.upper.dy += px; if (J.legF) { J.legF.dy += px; J.legF.sy *= legS } if (J.legB) { J.legB.dy += px; J.legB.sy *= legS }
    if (J.skirt) { J.skirt.dy += px * .55 }
  }
  function crouchPose(a, w) { dropBody(a, 150 * w, 1 - .25 * w); a.j.upper.rot += 5 * w; a.j.head.rot -= 5 * w; ['armF', 'armB'].forEach(function (n) { a.j[n].rot += armOut(a, n === 'armF' ? 'F' : 'B') * -8 * w }); }
  // sit: seat = 0 (on the ground, knees up) or the seat height in units (a chair is about 0.75)
  function sitPose(a, w, seat) {
    var J = a.j, hip = a.hipY || 850, ground = !(seat > .1), drop = (ground ? 1440 - 50 : 1440 - seat * 511) - hip;
    J.upper.dy += drop * w; J.upper.rot -= 3 * w; if (J.skirt) { J.skirt.dy += drop * w * .8; J.skirt.sy *= 1 - .35 * w }
    ['legF', 'legB'].forEach(function (n, i) {
      if (!J[n]) return; var sh = n === 'legF' ? 'shinF' : 'shinB';
      if (J[sh]) { J[n].dy += drop * w; J[n].rot += (ground ? -112 : -86) * w + i * 6 * w; J[sh].rot += (ground ? 100 : 86) * w - i * 6 * w }
      else if (ground) { J[n].dy += drop * w; if (w > .5) J[n].vis = 0 }          // on the ground the skirt covers the legs
      else { J[n].dy += drop * w * .6; J[n].rot += -50 * w }                         // on a chair: shins come out under the skirt
    });
  }
  function leanPose(a, side, w) { a.j.upper.rot += side * 12 * w; a.j.head.rot += side * 7 * w }
  /* body language: each emotion leans the body a little (small, so it never looks rubbery) */
  function posture(a, t, seed) {
    var e = a.face && a.face.target || 'neutral', J = a.j;
    var P = { scared: [-3, 3], sleepy: [4, 8], determined: [2, -2], surprised: [-2, -3], sneaky: [4, 2], annoyed: [0, 3], sad: [3, 6], happy: [0, 0] }[e];
    if (P) { J.upper.rot += P[0]; J.head.rot += P[1] * .5 }
    if (a.face) J.head.rot += a.face.tilt * .5;
    if (e === 'happy' || e === 'laugh') a.root.position.y += Math.abs(Math.sin(t * 5)) * .015;
    J.upper.dy += Math.sin(t * 2.1 + seed) * 2.5;                 // breathing
    J.upper.rot += Math.sin(t * .8 + seed) * .8;                  // weight shift
    if (!a.face || !a.face.lookT) J.head.rot += Math.sin(t * .45 + seed * 2) * 1.2;
  }
  function syllables(w) { var m = String(w).toLowerCase().match(/[aeiouy]+/g); return Math.max(1, m ? m.length : 1) }
  function mouthOpen(t) {
    for (var i = 0; i < WORDS.length; i++) { var w = WORDS[i]; if (t >= w.s && t < w.e) { var ph = (t - w.s) / Math.max(.05, w.e - w.s); return .15 + .5 * Math.abs(Math.sin(ph * Math.PI * syllables(w.w))) } if (w.s > t) break }
    return .1;
  }
  /* who should the audience look at right now? talkers first, then whoever is acting */
  var ACT = { point: 1, wave: 1, reach: 1, cheer: 1, react: 1, emerge: 1, jump: 1, peek: 1, yawn: 1, stomp: 1, nod: 1, 'shake-head': 1 };
  function spotlightActor(r, t) {
    var best = null;
    (r.spec.spot ? [].concat(r.spec.spot) : []).forEach(function (sp) { var t0 = timeOf(sp, r, 'spot'), d = sp.for || 2; if (t >= t0 && t < t0 + d && r.cast[sp.on]) best = { inst: r.cast[sp.on], w: Math.min(1, (t - t0) / .35, (t0 + d - t) / .35), pri: 3 } });
    if (best) return best;
    r.moves.forEach(function (m) {
      var inst = r.cast[m.who]; if (!inst || t < m.t0) return; var l = t - m.t0; if (l > m.dur) return;
      var pri = m.do === 'talk' ? 2 : (ACT[m.do] || (m.do && inst.a.do && inst.a.do[m.do])) ? 1 : 0; if (!pri) return;
      var w = Math.min(1, l / .35, (m.dur - l) / .35); if (!best || pri > best.pri || (pri === best.pri && w > best.w)) best = { inst: inst, w: w, pri: pri, m: m };
    });
    return best;
  }

  /* ---------- camera ---------- */
  D.LOOK = { film: .8, atmos: .8, fg: true, cards: false, focus: .8 };
  D.important = [];
  function camera(r, t) {
    var cm = r.camSpec, fr = FRAMES[cm.framing || 'medium'] || FRAMES.medium, dur = Math.max(.1, r.to - r.from), k = clamp((t - r.from) / dur, 0, 1), ke = K.ease(k);
    var subj = r.subjectNames.map(function (n) { return r.cast[n] }), H, W, center, minY, maxY, x0, x1, z0, z1;
    if (subj.length) {
      x0 = z0 = minY = 1e9; x1 = z1 = maxY = -1e9; H = 0;
      subj.forEach(function (s) { var p = s.a.root.position, sc = s.a.root.scale.y, py = Math.max(0, p.y); x0 = Math.min(x0, p.x + s.boxMin.x * sc); x1 = Math.max(x1, p.x + s.boxMax.x * sc); z0 = Math.min(z0, p.z + s.boxMin.z * sc); z1 = Math.max(z1, p.z + s.boxMax.z * sc); minY = Math.min(minY, py + s.boxMin.y * sc); maxY = Math.max(maxY, py + s.boxMax.y * sc); H = Math.max(H, s.height) });
      W = Math.max(x1 - x0, 0.3); center = new V3((x0 + x1) / 2, minY, (z0 + z1) / 2);
    } else { center = new V3(0, 0, 0); H = 3; W = 4 }
    if (cm.framing === 'wide' && !subj.length) H = 4;
    var frameH = Math.max(.25, H * fr.h), fovR = r.cam.fov * DEG, asp = K.camera.aspect || 9 / 16;
    if (subj.length && !subj.some(function (s) { return isHuman(s.a) })) frameH = Math.max(frameH, (cm.framing === 'extreme' ? .45 : cm.framing === 'close' ? .8 : 1.25));
    var dist = frameH / (2 * Math.tan(fovR / 2)), hf = 2 * Math.atan(Math.tan(fovR / 2) * asp);
    if (subj.length > 1 || cm.framing === 'full' || cm.framing === 'wide') dist = Math.max(dist, (W * 1.15) / (2 * Math.tan(hf / 2)));
    var yaw = (SIDES[cm.side || 'front'] || 0) * DEG, pitch = (ANGLES[cm.angle || 'eye'] || 2) * DEG, lat = 0, lift = 0;
    switch (cm.move || 'drift') {
      case 'drift': dist *= K.mix(1.04, .97, ke); break;
      case 'push-in': dist *= K.mix(1.3, .82, ke); break;
      case 'pull-out': dist *= K.mix(.82, 1.3, ke); break;
      case 'orbit-left': yaw += K.mix(-12, 12, ke) * DEG; break;
      case 'orbit-right': yaw += K.mix(12, -12, ke) * DEG; break;
      case 'crane-up': pitch += K.mix(-5, 10, ke) * DEG; lift = K.mix(-.12, .12, ke) * frameH; break;
      case 'crane-down': pitch += K.mix(10, -5, ke) * DEG; lift = K.mix(.12, -.12, ke) * frameH; break;
      case 'truck-left': lat = K.mix(.3, -.3, ke) * frameH * asp; break;
      case 'truck-right': lat = K.mix(-.3, .3, ke) * frameH * asp; break;
    }
    if (subj.length > 1) dist = Math.max(dist, (W * 1.08) / (2 * Math.tan(hf / 2)));     // a push-in never crops people out of a two-shot
    if (cm.distance) dist *= cm.distance;
    var look = center.clone(), fname = cm.framing || 'medium', one = subj.length === 1 ? subj[0].a : null;
    if (one && isHuman(one) && /extreme|close|medium/.test(fname)) {
      var top = one.root.position.y + one.height * one.root.scale.y / (one.baseScale ? 1 : 1);
      look.y = fname === 'extreme' ? top - frameH * .42 : top + frameH * (fname === 'close' ? .08 : .1) - frameH * .5;
    } else look.y += H * (subj.length && !subj.some(function (s) { return isHuman(s.a) }) && fname !== 'wide' && fname !== 'full' ? .55 : fr.cy);
    if (cm.height) look.y += cm.height; look.y += lift;
    // composition: rule of thirds + room in front of the face (lead room)
    var frameW = frameH * asp, comp = cm.compose || 'auto', third = frameW * .16;
    if (comp === 'left') lat += third; else if (comp === 'right') lat -= third;
    else if (comp === 'auto' && subj.length === 1 && fname !== 'wide' && one && living(one)) lat += (one.dir || 1) * third * .7;
    if (asp < 1 && !(one && isHuman(one)) && /extreme|close|medium/.test(fname)) look.y -= frameH * .06;
    if (asp < 1 && /full|wide/.test(fname)) look.y -= frameH * .1;
    look.x += lat * Math.cos(yaw); look.z += -lat * Math.sin(yaw);
    if (cm.look) look = v3(cm.look);
    var cam = { target: look, dist: dist, yaw: yaw, pitch: pitch, fov: r.cam.fov, roll: r.cam.roll };
    if (cm.pos) { var cp = v3(cm.pos), dv = cp.clone().sub(look); cam.dist = Math.max(.5, dv.length()); cam.yaw = Math.atan2(dv.x, dv.z); cam.pitch = Math.asin(clamp(dv.y / cam.dist, -1, 1)) }
    if (r.cam.hand) { var th = r.cam.hand * 3.2; cam.target.x += Math.sin(t * 1.7) * th; cam.target.y += Math.sin(t * 2.3 + 1) * th * .7 }
    r.cam.shake.forEach(function (sh) { var d = t - sh[0]; if (d >= 0 && d < 3 / 12) { cam.target.x += Math.sin(d * 97) * sh[1] * 1.5; cam.target.y += Math.cos(d * 83) * sh[1] * 1.5 } });
    if (r.flow && r.prevCam) { // continuous shot: glide from where the last camera was
      var fd = Math.min(1.3, (r.to - r.from) * .45), b = K.ease((t - r.from) / Math.max(.1, fd)), pc = r.prevCam.cam;
      if (b < 1) { cam.target = pc.target.clone().lerp(cam.target, b); cam.dist = K.mix(pc.dist, cam.dist, b); cam.yaw = K.mix(pc.yaw, cam.yaw, b); cam.pitch = K.mix(pc.pitch, cam.pitch, b); cam.fov = K.mix(pc.fov, cam.fov, b) }
    }
    var camY = cam.target.y + cam.dist * Math.sin(cam.pitch); if (camY < .3 && !cm.pos) cam.pitch = Math.asin(clamp((.3 - cam.target.y) / Math.max(.5, cam.dist), -1, 1)); // never dip below the floor
    K.cam = cam;
    K.film.fog = D.LOOK.atmos * clamp(9 / Math.max(1, cam.dist), .25, 1);
    safePoints(r);
    var spt = r._spot, nVis = Object.keys(r.cast).length;
    if (spt && spt.inst.a.root.visible && D.LOOK.focus > 0) {
      var A2 = spt.inst.a, p0 = A2.root.position, hh = spt.inst.height * A2.root.scale.y / (A2.baseScale ? 1 : 1);
      var p1 = K.project(new V3(p0.x, p0.y + hh * .85, p0.z)), p2 = K.project(new V3(p0.x, p0.y + hh * .1, p0.z));
      var ux = p1[0], uy = (p1[1] + p2[1]) / 2, rad = clamp(Math.abs(p1[1] - p2[1]) * .75 * 1.5, .1, .42);
      K.spot = { x: ux, y: uy, r: rad, s: spt.w * D.LOOK.focus * (nVis > 1 ? .75 : .3) };
    } else K.spot = { x: .5, y: .5, r: .4, s: 0 };
    placeFG(r, lat, subj.length); K.airKind = r.spec._placeholder ? 'none' : (r.spec.air || 'dust');
    var moods = r.light.map(function (l) { return l.mood });
    K.shafts = !r.spec._placeholder && D.LOOK.atmos > 0 && (r.spec.shafts === true || (r.spec.shafts !== false && /hope|silhouette|flashback/.test(moods.join(' '))));
  }
  /* screen heights (0 = top) of faces and the things being shown: captions never cover these */
  function safePoints(r) {
    var pts = [];
    Object.keys(r.cast).forEach(function (k) {
      var inst = r.cast[k], a = inst.a; if (!a.root.visible) return;
      var p = a.root.position, h = inst.height * a.root.scale.y / (a.baseScale ? 1 : 1);
      var list = isHuman(a) ? [h * .9, h] : [h * .5, h];
      list.forEach(function (dy) { var q = K.project(new V3(p.x, p.y + dy, p.z)); if (q[2] > 0 && Math.abs(q[0] - .5) < .6) pts.push(1 - q[1]) });
    });
    D.important = pts;
  }
  function placeFG(r, lat, nSubj) {
    var on = D.LOOK.fg && r.camSpec.fg !== false && ['medium', 'full'].indexOf(r.camSpec.framing || 'medium') >= 0 && nSubj <= 1 && !r.spec._placeholder;
    if (!on) { K.fgShape = null; return }
    var side = lat > .001 ? 1 : lat < -.001 ? -1 : (r.idx % 2 ? 1 : -1);
    K.fgShape = { kind: r.idx % 4, x: .5 + side * .53, y: 1.03, size: .25, rot: side * .25, flip: side < 0 };
  }

  /* ---------- SOUNDTRACK PLAN: effects + automatic foley + ambience + music, all from the shots ---------- */
  var MOOD2MUSIC = { normal: 'calm', warm: 'playful', cold: 'mystery', dark: 'mystery', danger: 'tension', silhouette: 'mystery', hope: 'hope', flash: 'tension', flashback: 'flashback' };
  var FOLEY = { appear: ['pop', .5], vanish: ['poof', .6], point: ['cloth', .45], wave: ['cloth', .5], reach: ['cloth', .45], hold: ['cloth', .4], crouch: ['cloth', .5], hide: ['rustle', .5], peek: ['cloth', .35],
    cheer: ['cloth', .6], cower: ['cloth', .5], yawn: ['cloth', .35], sit: ['cloth', .5], react: ['swish', .35], emerge: ['dirt', .9], burrow: ['dirt', .8], spin: ['whoosh', .4] };
  D.soundPlan = function () {
    var ev = [], beds = [], mus = [];
    function where(r, inst) {
      if (!inst || !r.endCam) return { pan: 0, g: 1 };
      var es = r.endState && r.endState[inst.uid], p = es ? es.pos : inst.a.root.position, cam = r.endCam.cam, dx = p.x - cam.target.x, dist = Math.max(.5, Math.hypot(p.x - cam.target.x, p.z - cam.target.z) + cam.dist * .3);
      return { pan: clamp(dx / dist * 1.6, -.75, .75), g: clamp(6 / (dist + cam.dist * .5), .35, 1) };
    }
    RUN.forEach(function (r) {
      if (!r.made) return;
      r.cues.forEach(function (q) { ev.push({ t: q[0], type: q[1], length: q[2], pan: 0, gain: 1 }) });
      r.moves.forEach(function (m) {
        var inst = r.cast[m.who]; if (!inst) return; var w = where(r, inst);
        if (m.do === 'walk' || m.do === 'run' || m.do === 'sneak') {
          var rate = m.do === 'run' ? 6.4 : m.do === 'sneak' ? 1.9 : 3.2; if (!isHuman(inst.a)) return;
          for (var i = 0; i < m.dur * rate - .5; i++) ev.push({ t: m.t0 + i / rate, type: m.do === 'sneak' ? 'sneak' : 'step', pan: w.pan + (i % 2 ? .08 : -.08), gain: w.g * (m.do === 'run' ? 1 : .8) });
          return;
        }
        if (m.do === 'jump') { ev.push({ t: m.t0, type: 'swish', pan: w.pan, gain: .4 * w.g }); ev.push({ t: m.t0 + m.dur * .95, type: 'thud', pan: w.pan, gain: .6 * w.g }); return }
        if (m.do === 'stomp') { ev.push({ t: m.t0 + m.dur * .7, type: 'thud', pan: w.pan, gain: .9 * w.g }); return }
        if (m.do === 'fall') { ev.push({ t: m.t0 + m.dur * .9, type: 'thud', pan: w.pan, gain: .8 * w.g }); return }
        var f = FOLEY[m.do]; if (f) ev.push({ t: m.t0, type: f[0], length: m.do === 'emerge' || m.do === 'burrow' ? Math.min(1.2, m.dur) : undefined, pan: w.pan, gain: f[1] * w.g });
      });
      var air = r.spec.air, mood = (r.light[0] && r.light[0].mood) || 'normal';
      var bedKind = r.spec.ambience || (air === 'rain' ? 'rain' : air === 'bubbles' ? 'underwater' : air === 'embers' ? 'fire' : (mood === 'warm' || mood === 'hope') ? 'day' : 'night');
      var L = beds[beds.length - 1]; if (L && L.kind === bedKind && Math.abs(L.to - r.from) < .05) L.to = r.to; else beds.push({ kind: bedKind, from: r.from, to: r.to });
      var style = r.spec.music === false ? 'none' : (r.spec.music || MOOD2MUSIC[mood] || 'calm');
      var M = mus[mus.length - 1]; if (M && M.style === style && Math.abs(M.to - r.from) < .05) M.to = r.to; else mus.push({ style: style, from: r.from, to: r.to });
    });
    var speech = [], cur = null; WORDS.forEach(function (w) { if (cur && w.s - cur[1] < .6) cur[1] = w.e; else { cur = [w.s, w.e]; speech.push(cur) } });
    return { duration: CUT.duration, events: ev.sort(function (a, b) { return a.t - b.t }), beds: beds, music: mus.filter(function (m) { return m.style !== 'none' }), speech: speech };
  };

  /* ---------- captions + text cards (drawn on an overlay canvas) ---------- */
  D.captionGroups = function () {
    var g = [], cur = [];
    WORDS.forEach(function (w, i) {
      cur.push(i); var end = /[.!?,;:]$/.test(w.w) || cur.length >= (D.groupSize || 3), gap = WORDS[i + 1] && WORDS[i + 1].s - w.e > .35;
      if (end || gap || i === WORDS.length - 1) { g.push(cur); cur = [] }
    });
    return g;
  };
  var GROUPS = null;
  D.drawOverlay = function (ctx, w, h, t, opts) {
    ctx.clearRect(0, 0, w, h);
    (D.overlayText || []).forEach(function (x) { card(ctx, w, h, x, t) });
    if (opts && opts.captions === false || !WORDS.length) return;
    if (GROUPS && GROUPS._size !== (D.groupSize || 3)) GROUPS = null;
    if (!GROUPS) { GROUPS = D.captionGroups(); GROUPS._size = D.groupSize || 3 }
    var gi = -1; for (var i = 0; i < GROUPS.length; i++) { var g = GROUPS[i], s = WORDS[g[0]].s, e = WORDS[g[g.length - 1]].e + .25; if (t >= s && t < e) { gi = i; break } }
    if (gi < 0) return;
    var cs = (opts && opts.style) || {}, land = w > h, grp = GROUPS[gi], fs = Math.round(Math.min(w, h) * (land ? .058 : .066) * (cs.size || 1)), active = grp[0];
    grp.forEach(function (wi) { if (WORDS[wi].s <= t) active = wi });
    ctx.font = '900 ' + fs + 'px "Arial Black", "Trebuchet MS", Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    var parts = grp.map(function (wi) { return { i: wi, txt: WORDS[wi].w.toUpperCase().replace(/[,;:]$/, '') } });
    var space = fs * .28, widths = parts.map(function (p) { return ctx.measureText(p.txt).width });
    var lines = [[]], lw = [0], maxW = w * (land ? .7 : .86);
    parts.forEach(function (p, j) { var L = lines.length - 1; if (lw[L] + widths[j] > maxW && lines[L].length) { lines.push([]); lw.push(0); L++ } lines[L].push(j); lw[L] += widths[j] + space });
    var bands = land ? [.86, .13] : [.78, .17], half = (lines.length * fs * 1.15) / h / 2 + .04;
    if (!GROUPS._band) GROUPS._band = {};
    if (GROUPS._band[gi] === undefined) {
      var pick = bands.map(function (b) { return (D.important || []).filter(function (y) { return Math.abs(y - b) < half + .03 }).length });
      GROUPS._band[gi] = pick[0] === 0 || pick[0] <= pick[1] ? bands[0] : bands[1];
    }
    var y0 = h * (cs.pos || GROUPS._band[gi]) - (lines.length - 1) * fs * .575;
    lines.forEach(function (ln, li) {
      var x = (w - (lw[li] - space)) / 2, y = y0 + li * fs * 1.15;
      ln.forEach(function (j) {
        var p = parts[j], on = p.i === active;
        ctx.save(); ctx.translate(x + widths[j] / 2, y); if (on) ctx.scale(1.08, 1.08);
        ctx.lineWidth = fs * .2; ctx.strokeStyle = '#0d0a0c'; ctx.strokeText(p.txt, -widths[j] / 2, 0);
        ctx.fillStyle = on ? (cs.color || '#f2c14e') : '#efe6d2'; ctx.fillText(p.txt, -widths[j] / 2, 0); ctx.restore();
        x += widths[j] + space;
      });
    });
  };
  function card(ctx, w, h, x, t) {
    var a = Math.min(1, (t - x.t0) * 6, (x.t0 + x.dur - t) * 6), fs = Math.round(Math.min(w, h) * (x.small ? .045 : .068));
    ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.font = '900 ' + fs + 'px Georgia, "Times New Roman", serif';
    var lines = wrap(ctx, x.say, Math.min(w, h * .8) * .74), bw = Math.max.apply(null, lines.map(function (l) { return ctx.measureText(l).width })) + fs * 1.4, bh = lines.length * fs * 1.2 + fs * .9;
    var cx = w / 2, cy = h * (x.small ? .5 : .24);
    ctx.fillStyle = 'rgba(0,0,0,.45)'; torn(ctx, cx - bw / 2 + fs * .12, cy - bh / 2 + fs * .12, bw, bh, x.t0); ctx.fill();
    ctx.fillStyle = '#d9ccb0'; torn(ctx, cx - bw / 2, cy - bh / 2, bw, bh, x.t0); ctx.fill();
    ctx.fillStyle = '#16101a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach(function (l, i) { ctx.fillText(l, cx, cy - (lines.length - 1) * fs * .6 + i * fs * 1.2) });
    ctx.restore();
  }
  function wrap(ctx, s, maxW) { var out = [], cur = ''; String(s).split(/\s+/).forEach(function (wd) { var tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > maxW && cur) { out.push(cur); cur = wd } else cur = tr }); if (cur) out.push(cur); return out }
  function torn(ctx, x, y, w, h, seed) {
    var r = Math.floor(seed * 100) + 7; function rn() { r = (r * 16807) % 2147483647; return r / 2147483647 }
    ctx.beginPath(); ctx.moveTo(x, y + rn() * 6); var n = 14, i;
    for (i = 1; i <= n; i++) ctx.lineTo(x + w * i / n, y + rn() * 8);
    for (i = 1; i <= 5; i++) ctx.lineTo(x + w - rn() * 6, y + h * i / 5);
    for (i = n - 1; i >= 0; i--) ctx.lineTo(x + w * i / n, y + h - rn() * 8);
    for (i = 4; i >= 1; i--) ctx.lineTo(x + rn() * 6, y + h * i / 5);
    ctx.closePath();
  }

  D.ENUM.air = ['dust', 'bubbles', 'snow', 'embers', 'rain', 'none'];
  D.ENUM.transition = ['flow', 'cut'];
  D.defs = {};
  window.SHOT = function (id, spec) {
    if (typeof id !== 'string') throw new Error('SHOT needs an id first, like SHOT(\'L04\', {...})');
    D.defs[id] = spec;
  };
  D.run = function () { return RUN };
  D.errors = function () { return ERRORS };
  D.warnings = function () { return WARN };
})();
