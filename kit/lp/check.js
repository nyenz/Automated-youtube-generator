/* LOW-POLY CHECKS — asset checker, contact sheet and preview for the Low-Poly style.
   kit/stage.js hands these modes to us when the style is Low-Poly. */
(function (root) {
  'use strict';
  var K = root.KIT;
  function errText(e) { return (e && (e.message || e)) + '' }

  /** check every asset the plan expects. H = { runCode, lineInfo, post, say } from the stage. */
  K.checkAssets = function (p, H) {
    var res = {}, loadErr = {};
    Object.keys(p.assets || {}).forEach(function (n) {
      var before = K.list().slice(), er = H.runCode(p.assets[n], 'asset ' + n);
      loadErr[n] = { err: er, added: K.list().filter(function (x) { return before.indexOf(x) < 0 }) };
    });
    (p.expect || []).forEach(function (x) {
      var r = res[x.name] = { ok: true, errors: [], warnings: [], size: null }, code = (p.assets || {})[x.name] || '', le = loadErr[x.name];
      if (le && le.err) r.errors.push(le.err);
      if (!K.has(x.name)) { r.errors.push('There is no KIT.asset(\'' + x.name + '\', ...) in the answer. The name must be exactly "' + x.name + '".'); r.ok = false; return }
      if (/requestAnimationFrame|KIT\.init|KIT\.start|K\.init|K\.start|renderer|document\.|window\./.test(code)) r.errors.push('Do not use requestAnimationFrame, KIT.init, KIT.start, document or window. Only build the asset.');
      if (/Math\.random/.test(code)) r.warnings.push('Uses Math.random — use K.rnd() so the asset looks the same every time.');
      if (/THREE|K\.T\./.test(code)) r.errors.push('This is the Low-Poly style: there is no THREE / K.T. Use K.part, K.person, K.prop, K.set, K.rig.');
      if (/outline|stroke-width|\.stroke\(/.test(code)) r.warnings.push('Low-Poly has no outlines. Use K.part (shaded facets) and K.flat.');
      var a;
      try { a = K.make(x.name, {}) } catch (e) { r.errors.push('Building "' + x.name + '" crashed: ' + errText(e) + H.lineInfo(e)); r.ok = false; return }
      var kind = a.kind || 'prop';
      if (x.kind && kind !== x.kind) {
        if (x.kind === 'character' && a.human) { } else r.errors.push('kind must be \'' + x.kind + '\' (it is \'' + kind + '\'). ' + (x.kind === 'character' ? 'Use K.person({...}).' : x.kind === 'set' ? 'Use K.set({layers, spots}).' : x.kind === 'fx' ? 'Use K.fx(drawing, {...}).' : x.kind === 'creature' ? 'Use K.creature(...).' : 'Use K.prop(drawing, {size}).'));
      }
      (x.parts || []).forEach(function (pt) { if (!(a.byName && a.byName[pt]) && !a[pt] && pt !== 'grip' && pt !== 'spots') r.errors.push('Missing part "' + pt + '" — in a rig it is a part name (K.rig parts), in a set it is a spot.') });
      if (x.holdable && !a.grip && kind === 'prop') r.errors.push('This prop is held, so give K.prop a grip: K.prop(dr, { size, grip: [x, y] }) — the picture point a hand holds.');
      if (kind === 'set') {
        if (!a.layers.length) r.errors.push('A set needs layers: K.set({ layers: [{ art: drawing, z: -12, width: 40 }, ...], spots: {...} }).');
        if (!Object.keys(a.spots).length) r.errors.push('A set needs spots: K.set({ spots: { center: [0,0,0], left: [-3,0,0] } }).');
        (x.spots || []).forEach(function (s) { if (!a.spots[s]) r.errors.push('Missing spot "' + s + '" in the set.') });
      }
      (x.moves || []).forEach(function (mv) {
        if (!a.do || typeof a.do[mv] !== 'function') { r.errors.push('Missing move do.' + mv + '(k, t) — set a.do = { ' + mv + ': function (k, t) { this.j.<part>.rot = ... } } on the returned object.'); return }
        try { [0, .5, 1].forEach(function (k) { a.reset && a.reset(); a.do[mv].call(a, k, k * 2, {}) }) } catch (e) { r.errors.push('do.' + mv + ' crashed: ' + errText(e)) }
      });
      if (a.idle) try { a.reset && a.reset(); a.idle(1.3) } catch (e) { r.errors.push('idle(t) crashed: ' + errText(e)) }
      if (kind === 'character' && !a.face) r.warnings.push('No face — people should use K.person / K.mascot so they can talk and show emotions.');
      if (kind !== 'set') {
        var any = a.parts.some(function (pt) { return pt.art && pt.art.ops && pt.art.ops.length });
        if (!any && !a.parts.some(function (pt) { return pt.live })) r.errors.push('The drawing is empty.');
        try { var cv = document.createElement('canvas'); cv.width = cv.height = 64; a.reset && a.reset(); a.paint(cv.getContext('2d'), .05) } catch (e) { r.errors.push('Painting it crashed: ' + errText(e)) }
        r.size = [+a.width.toFixed(2), +a.height.toFixed(2)];
        var want = x.size || x.height;
        if (want && a.height > 0 && (a.height > want * 2.2 || a.height < want / 2.2) && !a.human) r.warnings.push('Size looks wrong: it is ' + a.height.toFixed(2) + ' tall but the plan says about ' + want + '. (The size you pass to K.prop is the height in kit units.)');
      } else r.size = [a.width, a.depth];
      var extra = ((le && le.added) || []).filter(function (n) { return n !== x.name });
      if (extra.length) r.warnings.push('The answer also defined: ' + extra.join(', ') + ' (ignored here).');
      r.ok = !r.errors.length;
    });
    H.post({ type: 'check-assets', results: res });
    H.say('');
  };

  /* ---------- sheet / preview ---------- */
  function canvasFull() {
    var c = document.createElement('canvas'), W = Math.max(300, innerWidth), Hh = Math.max(300, innerHeight), pr = Math.min(2, devicePixelRatio || 1);
    c.width = W * pr; c.height = Hh * pr; c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%'; document.body.appendChild(c);
    var x = c.getContext('2d'); x.scale(pr, pr); x.fillStyle = '#ab9c87'; x.fillRect(0, 0, W, Hh); return { x: x, W: W, H: Hh };
  }
  function drawOne(x, a, cx, by, hpx, label) {
    a.reset && a.reset(); if (a.idle) a.idle(0); if (a.face) { a.face.t = 0; a.face.show('neutral') }
    if (a.isSet) {
      a.layers.forEach(function (L) { var k = Math.min(hpx * 1.6 / L.art.w, hpx * 1.2 / L.art.h); x.save(); x.translate(cx - L.art.w * k / 2, by - L.art.h * k); x.scale(k, k); var r = K.raster(L.art, k); x.drawImage(r.canvas, r.ox, r.oy, r.w, r.h); x.restore() });
    } else {
      var k2 = hpx / ((a.anchor[1] - a.bbox.y0) || 1); x.save(); x.translate(cx, by); x.scale(k2, k2); x.translate(-a.anchor[0], -a.anchor[1]); a.paint(x, k2); x.restore();
    }
    x.fillStyle = '#3b2f24'; x.font = '700 13px sans-serif'; x.textAlign = 'center'; x.fillText(label, cx, by + 18);
  }
  K.assetSheet = function () {
    var C = canvasFull(), names = K.list(), cols = Math.max(1, Math.floor(C.W / 230)), cw = C.W / cols, rowH = 300;
    names.forEach(function (n, i) { try { var a = K.make(n, {}); drawOne(C.x, a, (i % cols + .5) * cw, Math.floor(i / cols) * rowH + 250, a.isSet ? 220 : Math.min(220, Math.max(24, a.height * 82)), n + (a.kind ? ' · ' + a.kind : '')) } catch (e) { C.x.fillStyle = '#a33'; C.x.fillText(n + ': ' + errText(e), 10, Math.floor(i / cols) * rowH + 40) } });
  };
  K.preview = function (name) {
    var C = canvasFull(); try { var a = K.make(name, {}); drawOne(C.x, a, C.W / 2, C.H - 50, Math.min(C.H - 120, C.W * 1.2), name) } catch (e) { C.x.fillStyle = '#a33'; C.x.fillText(errText(e), 10, 30) }
  };
})(typeof window !== 'undefined' ? window : globalThis);
