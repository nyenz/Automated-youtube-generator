/* =========================================================================
   LOW-POLY RIG — the things an asset can be made of.
     K.prop(drawing, opts)      one picture (a thing, a plant, an animal)
     K.rig({parts, ...})        a picture cut into jointed parts (people, doors, creatures)
     K.set({layers, ground})    a place: back-to-front picture layers + a faceted floor
     K.fx(drawing, opts)        light / smoke / fire: a picture that animates by itself
   Plus the asset registry:  KIT.asset('name', fn)  K.make('name')  K.has  K.list
   LOCKED FILE: assets USE it, they never edit it.
   ========================================================================= */
(function (root) {
  'use strict';
  var K = root.KIT = root.KIT || {};
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)) }

  /* ---------------- tiny 3D vector (x right, y up, z toward the viewer) ---------------- */
  function V3(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0 }
  V3.prototype = {
    isVector3: true,
    set: function (x, y, z) { this.x = x; this.y = y; this.z = z; return this },
    copy: function (v) { this.x = v.x; this.y = v.y; this.z = v.z; return this },
    clone: function () { return new V3(this.x, this.y, this.z) },
    add: function (v) { this.x += v.x; this.y += v.y; this.z += v.z; return this },
    sub: function (v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this },
    addScaledVector: function (v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this },
    multiplyScalar: function (s) { this.x *= s; this.y *= s; this.z *= s; return this },
    lerpVectors: function (a, b, k) { this.x = a.x + (b.x - a.x) * k; this.y = a.y + (b.y - a.y) * k; this.z = a.z + (b.z - a.z) * k; return this },
    lerp: function (b, k) { return this.lerpVectors(this, b, k) },
    distanceTo: function (v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z) },
    length: function () { return Math.hypot(this.x, this.y, this.z) },
    toArray: function () { return [this.x, this.y, this.z] }
  };
  K.V3 = V3;
  /** the root of every asset: where it stands, which way it turns (yaw), its size */
  function Node() { this.position = new V3(); this.rotation = { x: 0, y: 0, z: 0 }; this.scale = new V3(1, 1, 1); this.visible = true }
  Node.prototype.updateMatrixWorld = function () { };
  K.Node = Node;

  /* ---------------- raster cache: a drawing is painted once per size level ---------------- */
  var LN = Math.log(1.5);
  /** raster(drawing, need) -> {canvas, ox, oy, w, h}. need = screen pixels per drawing pixel. */
  function raster(dr, need) {
    var lv = clamp(Math.ceil(Math.log(Math.max(need, .1)) / LN - 1e-6), -5, 8), c = dr.__r || (dr.__r = {}), e = c[lv], d;
    if (!e) for (d = 1; d <= 2 && !e; d++) e = c[lv + d];
    if (!e) {
      e = c[lv] = K.rasterize(dr, { scale: Math.pow(1.5, lv), pad: 2, crop: dr.crop !== false });
      var keys = Object.keys(c); if (keys.length > 4) keys.sort(function (a, b) { return Math.abs(b - lv) - Math.abs(a - lv) }), delete c[keys[0]];
    }
    return e;
  }
  K.raster = raster;

  /* ---------------- joints ---------------- */
  function joint() { return { rot: 0, dx: 0, dy: 0, sx: 1, sy: 1, fx: 1, vis: 1 } }
  function T(x, y) { return [1, 0, 0, 1, x, y] }
  function R(deg) { var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); return [c, s, -s, c, 0, 0] }
  function S(x, y) { return [x, 0, 0, y, 0, 0] }
  var mm = K.mmul, ID = [1, 0, 0, 1, 0, 0];

  /**
   * rig({ ppu, anchor:[x,y], kind, size, parts:[{name, parent, pivot:[x,y], art, live, flipAt}] })
   *   art   : a drawing (K.render / K.capture result) for this part
   *   pivot : where the part turns, in the drawing's own pixels (rest pose)
   *   live  : function(rig) -> ops   (drawn every frame on top: used by faces)
   *   Parts are drawn in list order, so a parent must come before its children.
   * The pose is set through rig.j.<name> = {rot (degrees, + = clockwise), dx, dy, sx, sy, fx (-1 = mirrored)}
   */
  K.rig = function (spec) {
    spec = spec || {};
    var a = { root: new Node(), kind: spec.kind || 'prop', ppu: spec.ppu || 511, anchor: spec.anchor || [0, 0], parts: [], j: {}, byName: {}, sx: spec.sx || 1, isRig: true };
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    (spec.parts || []).forEach(function (p) {
      var part = { name: p.name, parent: p.parent || null, pivot: p.pivot || [0, 0], art: p.art, live: p.live || null, flipAt: p.flipAt, M: ID.slice(), liveT: p.liveT || null };
      a.parts.push(part); a.byName[p.name] = part; a.j[p.name] = joint();
      var b = p.art && p.art.ops ? K.opsBBox(p.art.ops) : null;
      if (b) { x0 = Math.min(x0, b.x0); y0 = Math.min(y0, b.y0); x1 = Math.max(x1, b.x1); y1 = Math.max(y1, b.y1) }
      if (p.bounds) { x0 = Math.min(x0, p.bounds[0]); y0 = Math.min(y0, p.bounds[1]); x1 = Math.max(x1, p.bounds[2]); y1 = Math.max(y1, p.bounds[3]) }
    });
    if (x1 < x0) { x0 = 0; y0 = 0; x1 = 10; y1 = 10 }
    a.bbox = { x0: x0, y0: y0, x1: x1, y1: y1 };
    if (!spec.anchor) a.anchor = [(x0 + x1) / 2, y1];
    a.height = spec.size ? spec.size : (a.anchor[1] - y0) / a.ppu;       // world units
    a.width = (x1 - x0) / a.ppu;
    a.reset = function () { for (var n in a.j) { var q = a.j[n]; q.rot = q.dx = q.dy = 0; q.sx = q.sy = q.fx = 1; q.vis = 1 } if (a.resetExtra) a.resetExtra() };
    /** work out every part's matrix for the current pose (drawing pixels) */
    a.compute = function () {
      for (var i = 0; i < a.parts.length; i++) {
        var p = a.parts[i], J = a.j[p.name], pm = p.parent && a.byName[p.parent] ? a.byName[p.parent].M : ID;
        var L = mm(T(J.dx, J.dy), mm(T(p.pivot[0], p.pivot[1]), mm(R(J.rot), mm(S(J.sx, J.sy), T(-p.pivot[0], -p.pivot[1])))));
        if (p.flipAt !== undefined && J.fx !== 1) L = mm(L, mm(T(p.flipAt, 0), mm(S(J.fx, 1), T(-p.flipAt, 0))));
        p.M = mm(pm, L); p.D = p.base ? mm(p.M, p.base) : p.M;
      }
    };
    /** add a part later (hats, packs...): a.addPart({name, parent, pivot, art, base}, beforeName) */
    a.addPart = function (p, before) {
      var part = { name: p.name, parent: p.parent || null, pivot: p.pivot || [0, 0], art: p.art, live: p.live || null, flipAt: p.flipAt, M: ID.slice(), liveT: p.liveT || null, base: p.base || null };
      var at = before ? a.parts.indexOf(a.byName[before]) : -1; if (at < 0) a.parts.push(part); else a.parts.splice(at, 0, part);
      a.byName[p.name] = part; a.j[p.name] = joint(); return part;
    };
    /** the point (drawing px) of a part, after posing: used for hands, hats, held things */
    a.pointOf = function (name, x, y) { var p = a.byName[name]; if (!p) return [x, y]; var M = p.M; return [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]] };
    /** paint all parts. ctx is already in drawing-pixel space; k = screen pixels per drawing pixel. after(name) runs after a part (held items). */
    a.paint = function (ctx, k, after) {
      a.compute();
      for (var i = 0; i < a.parts.length; i++) {
        var p = a.parts[i], J = a.j[p.name]; if (J.vis === 0) { continue }
        var D = p.D || p.M; ctx.save(); ctx.transform(D[0], D[1], D[2], D[3], D[4], D[5]);
        if (p.art) { var r = raster(p.art, k * Math.sqrt(Math.abs(D[0] * D[3] - D[1] * D[2])) * 1.05); ctx.drawImage(r.canvas, r.ox, r.oy, r.w, r.h) }
        if (p.live) { var ops = p.live(a, p); if (ops && ops.length) { ctx.save(); if (p.liveT) ctx.transform(p.liveT[0], p.liveT[1], p.liveT[2], p.liveT[3], p.liveT[4], p.liveT[5]); K.paint(ctx, ops); ctx.restore() } }
        ctx.restore();
        if (after) after(p.name);
      }
    };
    a.shadowW = spec.shadow === undefined ? Math.max(.4, a.width * .8) : spec.shadow;     // contact shadow width (units); false = none
    if (spec.shadow === false) a.shadowW = 0;
    a.grip = spec.grip || null;
    return a;
  };
  var rigOf = K.rig;

  /* ---------------- props, creatures, fx: one picture ---------------- */
  /**
   * prop(drawing, { size, anchor:[x,y], grip:[x,y], shadow, kind, sway, bob, pulse, rise, flicker, spin })
   *   size   : height of the thing in kit units (a person is 2.66). The picture is scaled to fit.
   *   anchor : the point (picture pixels) that stands on the ground. Default: bottom centre of what is drawn.
   *   grip   : the point (picture pixels) a hand holds, for things carried by a person.
   */
  K.prop = function (dr, o) {
    o = o || {}; if (dr && dr.ops === undefined && typeof dr === 'function') dr = dr(K);
    if (!dr || !dr.ops) throw new Error('K.prop needs a drawing: K.prop(K.render("..."), { size: 1 })');
    var b = K.opsBBox(dr.ops) || { x0: 0, y0: 0, x1: 10, y1: 10 }, bh = Math.max(1, b.y1 - b.y0), ppu = o.size > 0 ? bh / o.size : (o.ppu || 511);
    var anchor = o.anchor || [(b.x0 + b.x1) / 2, b.y1];
    var a = rigOf({ ppu: ppu, anchor: anchor, kind: o.kind || 'prop', size: bh / ppu, shadow: o.shadow === false ? false : undefined, grip: o.grip, parts: [{ name: 'main', pivot: o.pivot || [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2], art: dr }] });
    a.width = (b.x1 - b.x0) / ppu; a.shadowW = o.shadow === false ? 0 : (o.shadow > 0 ? o.shadow : Math.max(.3, a.width * .85));
    if (o.kind === 'fx') a.shadowW = 0;
    a.fxOpts = o;
    var idle0 = null;
    a.idle = function (t) {                      // built-in life: sway, bob, pulse, spin, rise, flicker
      var J = a.j.main, ph = (o.phase || 0);
      if (o.sway) J.rot += Math.sin(t * (o.speed || 1.6) + ph) * o.sway;
      if (o.bob) J.dy -= (.5 + .5 * Math.sin(t * (o.speed || 2) + ph)) * o.bob * a.ppu;
      if (o.pulse) { var s = 1 + Math.sin(t * (o.speed || 3) + ph) * o.pulse; J.sx *= s; J.sy *= s }
      if (o.spin) J.rot += t * o.spin * 57.3;
      if (o.flicker) { var f = .9 + .1 * Math.sin(t * 23 + ph) * Math.sin(t * 7.3); J.sx *= f; J.sy *= (2 - f) }
      if (o.rise) { var u = ((t * o.rise + ph) % 1 + 1) % 1; J.dy -= u * a.height * a.ppu * 1.2; a.alphaMul = Math.sin(u * Math.PI) }
      if (idle0) idle0.call(a, t);
    };
    return a;
  };
  K.fx = function (dr, o) { o = Object.assign({ kind: 'fx', shadow: false }, o || {}); var a = K.prop(dr, o); a.kind = 'fx'; a.glow = o.glow || null; return a };
  K.creature = function (dr, o) {
    o = Object.assign({ kind: 'creature' }, o || {});
    var a = (dr && dr.ops) ? K.prop(dr, o) : rigOf(Object.assign({ kind: 'creature' }, dr));
    a.kind = 'creature'; return a;
  };

  /* ---------------- sets: a place ---------------- */
  /**
   * set({ layers:[{art, z, width, x, y, base, flip}], ground:{color, z0, z1, width}, backdrop:{top, bottom}, spots:{name:[x,y,z]}, width, depth })
   *   layers : pictures from far to near. z = depth (0 = where people stand, negative = further away, positive = in front of them).
   *            width = how wide the picture is in kit units. x = centre. y = height of its ground line. base = ground line in picture pixels (default: bottom).
   *   ground : a faceted floor in the house low-poly style.
   *   spots  : named places people can walk to, as [x, y, z].
   */
  K.set = function (o) {
    o = o || {}; var a = { root: new Node(), kind: 'set', layers: [], spots: {}, isSet: true };
    (o.layers || []).forEach(function (l, i) {
      var dr = l.art || l.drawing; if (!dr || !dr.ops) throw new Error('set layer ' + (i + 1) + ' needs art: a drawing (K.render(...))');
      var bb = K.opsBBox(dr.ops) || { x0: 0, y0: 0, x1: dr.w, y1: dr.h }, full = l.full !== false;
      var wpx = full ? dr.w : (bb.x1 - bb.x0), cxp = full ? dr.w / 2 : (bb.x0 + bb.x1) / 2;
      var width = l.width || (o.width || 24), ppu = wpx / width;
      a.layers.push({ art: dr, z: l.z === undefined ? -6 : l.z, x: l.x || 0, y: l.y || 0, ppu: ppu, ax: cxp, ay: l.base !== undefined ? l.base : (full ? dr.h : bb.y1), flip: !!l.flip, alpha: l.alpha === undefined ? 1 : l.alpha, sway: l.sway || 0, name: l.name || ('layer' + i) });
    });
    a.layers.sort(function (p, q) { return p.z - q.z });
    var sp = o.spots || {};
    Object.keys(sp).forEach(function (k) { var v = sp[k]; a.spots[k] = v instanceof V3 ? v.clone() : new V3(v[0] || 0, v[1] || 0, v[2] || 0) });
    a.width = o.width || 24; a.depth = o.depth || 12;
    a.backdrop = o.backdrop || null; a.groundOpt = o.ground === false ? null : (o.ground || {});
    a.boxMin = new V3(-a.width / 2, 0, -a.depth); a.boxMax = new V3(a.width / 2, o.height || 8, a.depth * .6);
    a.height = o.height || 8; a.size = new V3(a.width, a.height, a.depth);
    a.reset = function () { }; a.j = {};
    return a;
  };

  /* ---------------- the asset registry ---------------- */
  var ASSETS = {};
  K.asset = function (name, fn) { ASSETS[name] = fn };
  K.has = function (n) { return !!ASSETS[n] };
  K.list = function () { return Object.keys(ASSETS) };
  K.make = function (name, opts) {
    if (!ASSETS[name]) throw new Error('KIT: no asset called "' + name + '". Loaded: ' + K.list().join(', '));
    K.transparent(true);
    var r; try { r = ASSETS[name](K, opts || {}) } finally { K.transparent(false) }
    if (r && r.ops && !r.root) r = K.prop(r, {});                      // a bare drawing is fine: it becomes a prop
    if (!r || !r.root) throw new Error('KIT: asset "' + name + '" must return a person, prop, creature, fx or set (use K.prop(K.render(...), {size}))');
    if (!r.kind) r.kind = r.isRig ? 'prop' : 'prop';
    r.name = name; return r;
  };
})(typeof window !== 'undefined' ? window : globalThis);
