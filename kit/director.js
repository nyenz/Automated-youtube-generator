/* =====================================================================
   DIRECTOR — turns simple SHOT forms into a full video on one timeline.
   Needs three.js r128 + style-kit.js loaded first. LOCKED (LLMs never edit it).

   A shot is written as:
     SHOT('L04', { set, cast, camera, focus, light, moves, sfx, text, extra })
   Times inside a shot use  word:'grabs'  (when that narration word is spoken)
   or  sec: 1.5  (seconds after the shot starts).
   ===================================================================== */
(function () {
  var K = window.KIT, T = K.T, D = {}; window.DIRECTOR = D;
  var DEG = Math.PI / 180;

  /* ---------- the vocabulary (also used by the app to check shots) ---------- */
  D.ENUM = {
    framing: ['extreme', 'close', 'medium', 'full', 'wide'],
    angle: ['eye', 'low', 'high', 'top', 'dutch'],
    side: ['front', 'front-left', 'front-right', 'left', 'right', 'back-left', 'back-right', 'back'],
    move: ['static', 'drift', 'push-in', 'pull-out', 'orbit-left', 'orbit-right', 'crane-up', 'crane-down', 'truck-left', 'truck-right', 'handheld'],
    lens: ['wide', 'normal', 'tele'],
    mood: ['normal', 'warm', 'cold', 'dark', 'danger', 'silhouette', 'hope', 'flash'],
    sound: ['step', 'rustle', 'whoosh', 'swish', 'scrape', 'clink', 'tada', 'thud', 'pop', 'tick', 'snore', 'boom', 'sting', 'riser', 'heartbeat'],
    emotion: Object.keys(K.EMO),
    moves: ['walk', 'run', 'move', 'turn', 'look', 'point', 'wave', 'reach', 'nod', 'shake-head', 'talk', 'react', 'appear', 'vanish', 'float', 'spin', 'shake', 'jump', 'fall', 'grow', 'hold', 'drop']
  };
  D.MOODS = {
    normal: { key: .95, amb: .34, back: .3, glow: .35, fg: .8, sub: 0 },
    warm: { key: 1.05, amb: .4, back: .45, glow: .55, fg: .6, sub: 0 },
    cold: { key: .7, amb: .24, back: .5, glow: .3, fg: .8, sub: .05 },
    dark: { key: .42, amb: .15, back: .6, glow: .25, fg: .9, sub: .15 },
    danger: { key: .6, amb: .17, back: .95, glow: .6, fg: 1, sub: .35 },
    silhouette: { key: .22, amb: .1, back: 1.25, glow: .9, fg: 1, sub: .85 },
    hope: { key: 1.1, amb: .45, back: .65, glow: .85, fg: .4, sub: 0 },
    flash: { key: 2.3, amb: .95, back: 1, glow: 1.3, fg: 0, sub: 0 }
  };
  var FRAMES = { // h = frame height as part of subject height, cy = look height as part of subject height, ap = blur strength
    extreme: { h: .2, cy: .86, ap: .034 }, close: { h: .5, cy: .78, ap: .026 }, medium: { h: .85, cy: .62, ap: .018 },
    full: { h: 1.3, cy: .5, ap: .011 }, wide: { h: 2.4, cy: .45, ap: .006 }
  };
  var SIDES = { front: 0, 'front-left': 35, 'front-right': -35, left: 90, right: -90, 'back-left': 145, 'back-right': -145, back: 180 };
  var ANGLES = { eye: 4, low: -14, high: 28, top: 72, dutch: 4 };
  var LENSES = { wide: 44, normal: 32, tele: 22 };
  var GESTURE = { point: 1.6, wave: 1.6, reach: 1.4, nod: .8, 'shake-head': .9, talk: 2, react: .6, shake: .6, jump: .7 };

  /* ---------- built-in assets ---------- */
  function builtins() {
    if (!K.has('kato')) K.asset('kato', function (K) { return K.mascot('kato') });
    if (!K.has('nia')) K.asset('nia', function (K) { return K.mascot('nia') });
    if (!K.has('void')) K.asset('void', function (K) {
      var root = new T.Group(); K.ground(root, { radius: 22, color: 0x221a20 });
      var back = new T.Shape(); back.moveTo(-14, 0); for (var i = 0; i <= 12; i++) back.lineTo(-14 + i * 28 / 12, 7 + Math.sin(i * 1.7) * .6); back.lineTo(14, 0); back.closePath();
      K.sheet(back, .1, 0x1d1820, root, 0, 0, -9);
      return { root: root, kind: 'set', spots: { center: new T.Vector3(0, 0, 0), left: new T.Vector3(-1.6, 0, 0), right: new T.Vector3(1.6, 0, 0), front: new T.Vector3(0, 0, 1.6), back: new T.Vector3(0, 0, -2) } };
    });
  }

  /* ---------- small helpers ---------- */
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)) }
  function norm(w) { return String(w || '').toLowerCase().replace(/[^a-z0-9']/g, '').replace(/'/g, '') }
  function v3(a) { return a instanceof T.Vector3 ? a.clone() : new T.Vector3(a[0] || 0, a[1] || 0, a[2] || 0) }
  function yawTo(from, to) { return Math.atan2(to.x - from.x, to.z - from.z) }
  function angDiff(a, b) { var d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d }
  function isHuman(a) { return !!(a && a.arms && a.legs && a.head) }

  /* ---------- instances (one pool per asset, reused across shots) ---------- */
  var POOL = {}, ALL = [];
  function snapshot(root) {
    var list = []; root.traverse(function (o) { list.push([o, o.position.clone(), o.quaternion.clone(), o.scale.clone(), o.visible]) }); return list;
  }
  function restore(inst) {
    var s = inst.snap; for (var i = 0; i < s.length; i++) { var r = s[i]; r[0].position.copy(r[1]); r[0].quaternion.copy(r[2]); r[0].scale.copy(r[3]); r[0].visible = r[4] }
    var f = inst.a.face; if (f) { f.clear(); f.look(null) }
  }
  function getInst(name, n) {
    var p = POOL[name] || (POOL[name] = []);
    while (p.length <= n) {
      var a = K.make(name, {}); a.root.updateMatrixWorld(true);
      var inst = { name: name, a: a, kind: a.kind || (isHuman(a) ? 'character' : 'prop'), snap: snapshot(a.root) };
      var bx = new T.Box3().setFromObject(a.root); inst.size = bx.getSize(new T.Vector3()); inst.boxMin = bx.min.clone(); inst.boxMax = bx.max.clone();
      if (isHuman(a)) inst.height = a.height || inst.size.y; else inst.height = inst.size.y;
      a.root.visible = false; p.push(inst); ALL.push(inst);
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

  /* ---------- placeholder for shots not made yet ---------- */
  function placeholder(sh) {
    return { set: 'void', cast: {}, camera: { framing: 'wide', move: 'drift' }, light: [{ mood: 'dark' }], text: [{ sec: 0, say: 'SHOT ' + sh.id + ' — not made yet', for: 999, small: true }], _placeholder: true };
  }

  /* ---------- build ---------- */
  D.build = function (o) {
    builtins(); CUT = o.cut; WORDS = (CUT.words || []).map(function (w) { return { w: w[0], s: w[1], e: w[2] } });
    var lines = CUT.lines || [], plan = CUT.shots || [], dur = CUT.duration;
    var defs = D.defs;
    RUN = plan.map(function (p, i) {
      var l0 = lines[p.from_line] || lines[0] || { s: 0 }, from = i === 0 ? 0 : l0.s;
      return { id: p.id, plan: p, from: from, spec: defs[p.id] || placeholder(p), made: !!defs[p.id] };
    });
    RUN.forEach(function (r, i) { r.to = i + 1 < RUN.length ? RUN[i + 1].from : dur; if (r.to <= r.from) { r.to = r.from + .5; warn(r.id, 'This shot has no time (its lines overlap the next shot).') } });
    var shots = [], lens = [], light = [], cues = [];
    RUN.forEach(function (r) {
      try { prepare(r) } catch (e) { ERRORS[r.id] = String(e && e.message || e); r.spec = placeholder(r); r.spec.text[0].say = 'SHOT ' + r.id + ' ERROR'; prepare(r) }
      var c = r.cam;
      shots.push({ from: r.from, to: r.to, pos: [function () { return c.pos }], look: [function () { return c.look }], fov: c.fov, hand: c.hand, roll: c.roll, shake: c.shake, ease: 'linear' });
      r.lens.forEach(function (l) { lens.push(l) }); r.light.forEach(function (l) { light.push(l) }); r.cues.forEach(function (q) { cues.push(q) });
    });
    lens.sort(function (a, b) { return a.at - b.at }); light.sort(function (a, b) { return a.at - b.at }); cues.sort(function (a, b) { return a[0] - b[0] });
    K.shots(shots).lens(lens).light(light).cues(cues);
    K.ambience({ room: .03, pad: o.sky === 'warm' ? [196, 246.9, 293.7] : [174.6, 207.7, 261.6], padVol: .012 });
    K.update(update);
    return { warnings: WARN, errors: ERRORS, shots: RUN.map(function (r) { return { id: r.id, from: r.from, to: r.to, made: r.made } }) };
  };

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
    // moves, faces
    r.moves = (s.moves || []).map(function (m, i) {
      var mm = Object.assign({}, m); mm.t0 = timeOf(m, r, 'move ' + (i + 1)); mm.i = i;
      if (!r.cast[m.who]) warn(id, 'move ' + (i + 1) + ': "' + m.who + '" is not in the cast.');
      if (m.do && D.ENUM.moves.indexOf(m.do) < 0) { var a = r.cast[m.who] && r.cast[m.who].a; if (!(a && a.do && typeof a.do[m.do] === 'function')) warn(id, 'move ' + (i + 1) + ': "' + m.do + '" is not a built-in move and "' + m.who + '" has no do.' + m.do + '().') }
      if (m.face && !K.EMO[m.face]) warn(id, 'move ' + (i + 1) + ': unknown face "' + m.face + '".');
      mm.dur = m.for || GESTURE[m.do] || (m.do === 'walk' || m.do === 'run' || m.do === 'move' ? 2 : .5);
      return mm;
    }).sort(function (a, b) { return a.t0 - b.t0 || a.i - b.i });
    // camera
    var cm = s.camera || {}; r.camSpec = cm;
    ['framing', 'angle', 'side', 'move', 'lens'].forEach(function (k) { if (cm[k] && D.ENUM[k].indexOf(cm[k]) < 0) warn(id, 'camera.' + k + ' "' + cm[k] + '" is not allowed. Use: ' + D.ENUM[k].join(', ')) });
    var fov = LENSES[cm.lens] || (cm.framing === 'wide' ? 42 : 32);
    r.cam = { pos: [0, 2, 8], look: [0, 1, 0], fov: fov, hand: cm.move === 'handheld' ? .02 : 0, roll: cm.angle === 'dutch' ? .12 : 0, shake: (cm.shake ? [].concat(cm.shake) : []).map(function (e) { return [timeOf(e, r, 'camera shake'), e.amount || .06] }) };
    // focus
    var fr = FRAMES[cm.framing || 'medium'] || FRAMES.medium, onNames = [].concat(cm.on || Object.keys(r.cast)[0] || []);
    var focus = s.focus && s.focus.length ? s.focus : [{ on: cm.on || Object.keys(r.cast)[0] }];
    focus.forEach(function (f) { [].concat(f.on || []).forEach(function (n) { if (n && r.cast[n] && onNames.indexOf(n) < 0 && cm.framing !== 'wide') warn(id, 'focus on "' + n + '" but the camera only frames ' + (onNames.join(', ') || 'the set') + ' — add it to camera.on or it may be off screen.') }) });
    r.lens = focus.map(function (f, i) {
      var objs = [].concat(f.on || []).map(function (n) { var ii = r.cast[n]; if (!ii) { if (n) warn(id, 'focus: "' + n + '" is not in the cast.'); return null } return ii.a.root }).filter(Boolean);
      if (!objs.length) objs = [r.set.a.root];
      return { at: i === 0 ? r.from : timeOf(f, r, 'focus ' + (i + 1)), on: objs, pull: i === 0 ? 0 : (f.pull === undefined ? .4 : f.pull), ap: f.blur ? clamp(fr.ap * f.blur, .003, .06) : fr.ap, pad: (cm.framing === 'wide' ? .4 : .08) };
    });
    // light
    var ls = s.light ? [].concat(s.light) : [{ mood: 'normal' }];
    if (typeof s.light === 'string') ls = [{ mood: s.light }];
    r.light = ls.map(function (l, i) {
      if (typeof l === 'string') l = { mood: l };
      var M = D.MOODS[l.mood] || (warn(id, 'light: unknown mood "' + l.mood + '"'), D.MOODS.normal);
      return Object.assign({ at: i === 0 ? r.from : timeOf(l, r, 'light ' + (i + 1)), ease: i === 0 ? 0 : (l.ease === undefined ? .3 : l.ease) }, M);
    });
    // sound
    r.cues = (s.sfx || []).map(function (q, i) {
      if (D.ENUM.sound.indexOf(q.sound) < 0) warn(id, 'sfx ' + (i + 1) + ': unknown sound "' + q.sound + '"');
      return [timeOf(q, r, 'sfx ' + (i + 1)), q.sound, q.length];
    });
    // text cards
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
  }

  function resolvePos(r, val, fallback) {
    if (val == null) return fallback ? fallback.clone() : new T.Vector3();
    if (Array.isArray(val)) return v3(val);
    if (typeof val === 'object' && val.isVector3) return val.clone();
    var spots = (r.set.a.spots) || {};
    if (spots[val]) return v3(spots[val]);
    if (r.cast[val]) return r.cast[val].a.root.position.clone();
    var def = { center: [0, 0, 0], left: [-1.6, 0, 0], right: [1.6, 0, 0], front: [0, 0, 1.6], back: [0, 0, -2], far: [0, 0, -5] }[val];
    if (def) return v3(def);
    warn(r.id, 'place "' + val + '" not found (set spots: ' + Object.keys(spots).join(', ') + ').');
    return new T.Vector3();
  }
  function resolveYaw(r, inst, val) {
    if (val == null) return 0;
    if (typeof val === 'number') return val * DEG;
    var named = { front: 0, camera: null, left: -90, right: 90, back: 180 };
    if (val === 'camera') return yawTo(inst.a.root.position, K.camera.position);
    if (named[val] != null) return named[val] * DEG;
    if (r.cast[val]) return yawTo(inst.a.root.position, r.cast[val].a.root.position);
    var p = resolvePos(r, val); return yawTo(inst.a.root.position, p);
  }

  function update(t) {
    var i = shotAt(t), r = RUN[i]; if (!r) return;
    if (i !== CUR) { show(i); CUR = i }
    var L = t - r.from;
    try { pose(r, t, L) } catch (e) { var msg = String(e && e.message || e); if (ERRORS[r.id] !== msg) { ERRORS[r.id] = msg; if (D.onError) D.onError(r.id, msg) } }
    camera(r, t);
    D.overlayText = r.text.filter(function (x) { return t >= x.t0 && t < x.t0 + x.dur });
  }

  function pose(r, t, L) {
    var keys = Object.keys(r.cast);
    keys.forEach(function (k) {
      var inst = r.cast[k], a = inst.a, c = r.castSpec[k] || {};
      restore(inst);
      a.root.position.copy(resolvePos(r, c.at)); if (c.y) a.root.position.y += c.y;
      a.root.rotation.y = 0; a.root.rotation.y = resolveYaw(r, inst, c.turn);
      if (c.size) a.root.scale.multiplyScalar(c.size);
      if (a.face) { a.face.show(c.face || 'neutral'); if (c.look) a.face.look(lookTarget(r, c.look)) }
      if (isHuman(a)) a.body.position.y += Math.sin(t * 2.1 + k.length) * .012; // breathing
      if (a.idle) a.idle(t);
      if (c.hidden) a.root.visible = false;
    });
    var holds = {};
    r.moves.forEach(function (m) {
      var inst = r.cast[m.who]; if (!inst) return;
      var before = t < m.t0;
      if (before && m.do !== 'appear') return;
      var local = Math.max(0, t - m.t0), k = clamp(local / m.dur, 0, 1);
      if (m.face && !before) inst.a.face && inst.a.face.show(m.face);
      if (m.do) doMove(r, inst, m, k, local, before, holds, t);
    });
    // held items follow the hand
    Object.keys(holds).forEach(function (itemKey) {
      var h = holds[itemKey], item = r.cast[itemKey], who = r.cast[h.who]; if (!item || !who) return;
      who.a.root.updateMatrixWorld(true);
      var g = (h.hand === 'L' ? who.a.gripL : who.a.gripR) || who.a.root, gp = g.getWorldPosition(new T.Vector3());
      var ia = item.a; ia.root.rotation.set(0, who.a.root.rotation.y, 0); ia.root.updateMatrixWorld(true);
      var off = new T.Vector3(); if (ia.grip) { off = ia.grip.getWorldPosition(new T.Vector3()).sub(ia.root.position) }
      ia.root.position.copy(gp).sub(off);
    });
    if (r.spec.extra) r.spec.extra.call(null, t - r.from, castView(r), K, { t: t, from: r.from, to: r.to });
  }
  function castView(r) { var o = {}; Object.keys(r.cast).forEach(function (k) { o[k] = r.cast[k].a }); o.set = r.set.a; return o }
  function lookTarget(r, v) {
    if (v === 'camera') return K.camera;
    if (r.cast[v]) { var a = r.cast[v].a; return a.head || a.root }
    return resolvePos(r, v);
  }

  /* ---------- built-in moves ---------- */
  function doMove(r, inst, m, k, local, before, holds, t) {
    var a = inst.a, root = a.root, H = isHuman(a), e = K.ease(k);
    switch (m.do) {
      case 'walk': case 'run': case 'move': {
        var from = root.position.clone(), to = resolvePos(r, m.to, from); if (m.to == null) warn(r.id, m.do + ' for "' + m.who + '" needs to:');
        var kk = m.do === 'move' ? e : k * k * (3 - 2 * k) * .25 + k * .75;
        root.position.lerpVectors(from, to, kk);
        if (m.arc) root.position.y += Math.sin(Math.PI * k) * m.arc;
        if (from.distanceTo(to) > .05 && m.face_dir !== false) root.rotation.y = yawTo(from, to);
        if (k < 1 && H) walkCycle(a, local, m.do === 'run' ? 2 : 1);
        if (k < 1 && a.do && a.do.walk && !H) a.do.walk(k, local, m);
        break }
      case 'turn': { var y0 = root.rotation.y, y1 = resolveYaw(r, inst, m.to); root.rotation.y = y0 + angDiff(y0, y1) * e; break }
      case 'look': { if (a.face) a.face.look(m.to == null || m.to === 'none' ? null : lookTarget(r, m.to)); if (H && m.to && m.to !== 'none') { var tp = (lookTarget(r, m.to).isObject3D ? lookTarget(r, m.to).getWorldPosition(new T.Vector3()) : lookTarget(r, m.to)); var d = angDiff(root.rotation.y, yawTo(root.position, tp)); a.head.rotation.y += clamp(d, -.6, .6) * e } break }
      case 'point': case 'reach': if (H && k < 1) armAim(r, a, m, k, local); break;
      case 'wave': if (H && k < 1) { var arm = m.hand === 'L' ? a.armL : a.armR, w = Math.sin(Math.PI * Math.min(1, k * 4)) > 0 ? Math.min(1, k * 5, (1 - k) * 5) : 0; arm.shoulder.rotation.z = arm.side * (.25 + 2.3 * w); arm.elbow.rotation.z = arm.side * Math.sin(local * 14) * .45 * w } break;
      case 'nod': if (k < 1) (a.head || root).rotation.x += Math.sin(local * 11) * .16 * Math.sin(Math.PI * k); break;
      case 'shake-head': if (k < 1) (a.head || root).rotation.y += Math.sin(local * 13) * .25 * Math.sin(Math.PI * k); break;
      case 'talk': if (k < 1 && a.face) { var f = Math.floor(local * 12) % 3; a.face.mouth.scale.y *= [1, .35, 1.25][f]; (a.head || root).rotation.x += Math.sin(local * 5) * .03 } break;
      case 'react': if (k < 1) reactPose(root, local, m.type || 'take'); break;
      case 'appear': { var s = before ? 0 : (k < 1 ? K.ease(k) * (1 + .15 * Math.sin(Math.PI * k)) : 1); root.scale.multiplyScalar(Math.max(.0001, s)); if (before) root.visible = false; break }
      case 'vanish': root.scale.multiplyScalar(Math.max(.0001, 1 - e)); if (k >= 1) root.visible = false; break;
      case 'float': root.position.y += (m.height || .15) * (.5 + .5 * Math.sin(local * (m.speed || 2.2))); break;
      case 'spin': root.rotation.y += e * Math.PI * 2 * (m.turns || 1); break;
      case 'shake': if (k < 1) root.rotation.z += Math.sin(local * 60) * .08 * (1 - k); break;
      case 'jump': if (k < 1) { root.position.y += Math.sin(Math.PI * k) * (m.height || .8); if (H) reactPose(root, local, k < .15 ? 'land' : 'none') } break;
      case 'fall': { var ax = m.to === 'back' ? -1 : 1; root.rotation.x += ax * Math.PI / 2 * K.ease(k) * .98; break }
      case 'grow': { var g1 = m.size || 1.5; root.scale.multiplyScalar(K.mix(1, g1, e)); break }
      case 'hold': if (m.item) { holds[m.item] = { who: m.who, hand: m.hand }; if (H) { var ar = m.hand === 'L' ? a.armL : a.armR; ar.shoulder.rotation.x = -.5; ar.elbow.rotation.x = -.9 } } break;
      case 'drop': if (m.item && holds[m.item]) delete holds[m.item]; break;
      default:
        if (a.do && typeof a.do[m.do] === 'function') a.do[m.do].call(a, k, local, m);
    }
  }
  function walkCycle(a, local, speed) {
    var ph = local * Math.PI * 2 * 1.6 * speed, amp = speed > 1 ? .75 : .5;
    a.legs.forEach(function (lg, i) { lg.hip.rotation.x = Math.sin(ph + i * Math.PI) * amp });
    a.arms.forEach(function (ar, i) { ar.shoulder.rotation.x = Math.sin(ph + i * Math.PI + Math.PI) * amp * .8 });
    a.body.position.y += Math.abs(Math.sin(ph)) * .05 * speed;
    a.hips.rotation.x = speed > 1 ? .15 : .04;
  }
  var DOWN = new T.Vector3(0, -1, 0);
  function armAim(r, a, m, k, local) {
    var arm = m.hand === 'L' ? a.armL : a.armR, w = Math.min(1, k * 4, (1 - k) * 4);
    var tgt = m.to != null ? lookTarget(r, m.to) : null, tp;
    if (tgt && tgt.isObject3D) tp = tgt.getWorldPosition(new T.Vector3()); else if (tgt) tp = tgt; else { a.root.updateMatrixWorld(true); tp = a.root.localToWorld(new T.Vector3(0, a.height * .6, 3)) }
    a.root.updateMatrixWorld(true);
    var sp = arm.shoulder.getWorldPosition(new T.Vector3()), dirW = tp.clone().sub(sp).normalize();
    var parentQ = arm.shoulder.parent.getWorldQuaternion(new T.Quaternion()).invert(), dirL = dirW.applyQuaternion(parentQ);
    var q = new T.Quaternion().setFromUnitVectors(DOWN, dirL);
    arm.shoulder.quaternion.slerp(q, w);
    if (m.do === 'reach') { a.hips.rotation.x += .25 * w; arm.elbow.rotation.x = 0 }
  }
  function reactPose(o, d, type) {
    var F = 1 / 12, sx = 1, sy = 1;
    if (type === 'take') { if (d < 2 * F) { sy = .9; sx = 1.06 } else if (d < 4 * F) { sy = 1.12; sx = .93 } else if (d < 7 * F) { var k = (d - 4 * F) / (3 * F); sy = K.mix(1.12, 1, k); sx = K.mix(.93, 1, k) } }
    else if (type === 'land') { if (d < 2 * F) { sy = .85; sx = 1.1 } else if (d < 5 * F) { var k2 = (d - 2 * F) / (3 * F); sy = K.mix(.85, 1, k2); sx = K.mix(1.1, 1, k2) } }
    else if (type === 'twitch') { if (d < F) sy = 1.08 }
    else if (type === 'shake') { if (d < .5) o.rotation.z += Math.sin(d * 90) * .08 * (1 - d * 2) }
    o.scale.x *= sx; o.scale.y *= sy; o.scale.z *= sx;
  }

  /* ---------- camera ---------- */
  var BOX = new T.Box3(), TMP = new T.Box3();
  function camera(r, t) {
    var cm = r.camSpec, fr = FRAMES[cm.framing || 'medium'] || FRAMES.medium, dur = Math.max(.1, r.to - r.from), k = clamp((t - r.from) / dur, 0, 1), ke = K.ease(k);
    var subj = r.subjectNames.map(function (n) { return r.cast[n] }), center, H, W, yaw;
    if (subj.length) {
      BOX.makeEmpty(); H = 0; W = 0;
      subj.forEach(function (s) { var p = s.a.root.position, sc = s.a.root.scale.y; TMP.min.copy(s.boxMin).multiplyScalar(sc).add(p); TMP.max.copy(s.boxMax).multiplyScalar(sc).add(p); BOX.union(TMP); H = Math.max(H, s.height * sc) });
      W = Math.max(BOX.max.x - BOX.min.x, BOX.max.z - BOX.min.z);
      center = new T.Vector3((BOX.min.x + BOX.max.x) / 2, BOX.min.y, (BOX.min.z + BOX.max.z) / 2);
      yaw = subj[0].a.root.rotation.y;
    } else { center = new T.Vector3(0, 0, 0); H = 3; W = 4; yaw = 0 }
    if (cm.framing === 'wide' && !subj.length) H = 4;
    var frameH = Math.max(.25, H * fr.h), fovR = (r.cam.fov) * DEG, asp = K.camera.aspect || 9 / 16;
    var dist = frameH / (2 * Math.tan(fovR / 2)), hf = 2 * Math.atan(Math.tan(fovR / 2) * asp);
    if (subj.length > 1 || cm.framing === 'full' || cm.framing === 'wide') dist = Math.max(dist, (W * 1.15) / (2 * Math.tan(hf / 2)));
    var az = (SIDES[cm.side || 'front'] || 0) * DEG, el = (ANGLES[cm.angle || 'eye'] || 4) * DEG, lat = 0;
    switch (cm.move || 'drift') {
      case 'drift': dist *= K.mix(1.04, .97, ke); break;
      case 'push-in': dist *= K.mix(1.3, .82, ke); break;
      case 'pull-out': dist *= K.mix(.82, 1.3, ke); break;
      case 'orbit-left': az += K.mix(-22, 22, ke) * DEG; break;
      case 'orbit-right': az += K.mix(22, -22, ke) * DEG; break;
      case 'crane-up': el += K.mix(-12, 22, ke) * DEG; break;
      case 'crane-down': el += K.mix(22, -12, ke) * DEG; break;
      case 'truck-left': lat = K.mix(.35, -.35, ke) * frameH; break;
      case 'truck-right': lat = K.mix(-.35, .35, ke) * frameH; break;
    }
    if (cm.distance) dist *= cm.distance;
    var look = center.clone(); look.y += H * fr.cy; if (cm.height) look.y += cm.height;
    var a = yaw + az, dir = new T.Vector3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el));
    var pos = look.clone().addScaledVector(dir, dist), side = new T.Vector3(Math.cos(a), 0, -Math.sin(a));
    pos.addScaledVector(side, lat); look.addScaledVector(side, lat);
    if (pos.y < .12) pos.y = .12;
    if (r.set.boxMin && cm.inside !== false) { // keep the camera inside rooms (walls would block the view)
      var lo = r.set.boxMin, hi = r.set.boxMax, m = .35;
      if (hi.x - lo.x > 2 * m) pos.x = clamp(pos.x, lo.x + m, hi.x - m);
      if (hi.z - lo.z > 2 * m) pos.z = clamp(pos.z, lo.z + m, hi.z - m);
      if (hi.y - lo.y > 1) pos.y = Math.min(pos.y, hi.y - .25);
    }
    if (cm.pos) pos = v3(cm.pos); if (cm.look) look = v3(cm.look);
    r.cam.pos = [pos.x, pos.y, pos.z]; r.cam.look = [look.x, look.y, look.z];
  }

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
    var cs = (opts && opts.style) || {}, land = w > h, grp = GROUPS[gi], fs = Math.round(Math.min(w, h) * (land ? .066 : .074) * (cs.size || 1)), active = grp[0];
    grp.forEach(function (wi) { if (WORDS[wi].s <= t) active = wi });
    ctx.font = '900 ' + fs + 'px "Arial Black", "Trebuchet MS", Arial, sans-serif'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    var parts = grp.map(function (wi) { return { i: wi, txt: WORDS[wi].w.toUpperCase().replace(/[,;:]$/, '') } });
    var space = fs * .28, widths = parts.map(function (p) { return ctx.measureText(p.txt).width });
    var lines = [[]], lw = [0], maxW = w * (land ? .7 : .86);
    parts.forEach(function (p, j) { var L = lines.length - 1; if (lw[L] + widths[j] > maxW && lines[L].length) { lines.push([]); lw.push(0); L++ } lines[L].push(j); lw[L] += widths[j] + space });
    var y0 = h * (cs.pos || (land ? .84 : .7)) - (lines.length - 1) * fs * .6;
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

  D.defs = {};
  window.SHOT = function (id, spec) {
    if (typeof id !== 'string') throw new Error('SHOT needs an id first, like SHOT(\'L04\', {...})');
    D.defs[id] = spec;
  };
  D.run = function () { return RUN };
  D.errors = function () { return ERRORS };
  D.warnings = function () { return WARN };
})();
