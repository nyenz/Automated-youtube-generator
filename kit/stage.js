/* STAGE — runs inside an iframe (or as an exported standalone page).
   The app sends {type:'load', payload}. Modes: play, check-assets, check-shots, sheet, preview. */
(function () {
  var K = window.KIT, D = window.DIRECTOR, P = null, MSG = document.getElementById('msg');
  function post(m) { try { (window.parent !== window ? window.parent : window).postMessage(m, '*') } catch (e) { } if (window.STAGE_LISTENER) window.STAGE_LISTENER(m) }
  function say(t) { if (MSG) { MSG.style.display = t ? 'flex' : 'none'; MSG.textContent = t || '' } }
  function errText(e) { return (e && (e.message || e)) + '' }
  window.addEventListener('error', function (e) { post({ type: 'error', msg: errText(e.error || e.message) }) });

  /* ---------- run pasted code ---------- */
  function runCode(code, label) {
    try { (new Function('KIT', 'K', 'SHOT', code))(K, K, window.SHOT); return null }
    catch (e) { return label + ': ' + errText(e) + lineInfo(e) }
  }
  function lineInfo(e) { var m = /<anonymous>:(\d+):(\d+)/.exec(e && e.stack || ''); return m ? ' (line ' + (m[1] - 2) + ')' : '' }
  function loadAssets(map) { var errs = {}; Object.keys(map || {}).forEach(function (n) { var er = runCode(map[n], 'asset ' + n); if (er) errs[n] = er }); return errs }
  function loadShots(map) { var errs = {}; Object.keys(map || {}).forEach(function (n) { var er = runCode(map[n], 'shot ' + n); if (er) errs[n] = er }); return errs }

  /* ---------- palette check ---------- */
  var TRACK = null;
  function wrapColours() {
    var M0 = K.M, F0 = K.flat;
    K.M = function (g, c) { if (TRACK) TRACK[c] = 1; return M0.apply(K, arguments) };
    K.flat = function (g, c) { if (TRACK) TRACK[c] = 1; return F0.apply(K, arguments) };
  }
  function flatPalette() {
    var out = [];
    (function walk(o) { Object.keys(o).forEach(function (k) { var v = o[k]; if (typeof v === 'number') out.push(v); else if (v && typeof v === 'object') walk(v) }) })(K.PAL);
    return out;
  }
  function near(c, list) { var r = c >> 16 & 255, g = c >> 8 & 255, b = c & 255; return list.some(function (p) { var dr = r - (p >> 16 & 255), dg = g - (p >> 8 & 255), db = b - (p & 255); return dr * dr + dg * dg + db * db < 30 * 30 }) }
  function lum(c) { return ((c >> 16 & 255) * .3 + (c >> 8 & 255) * .59 + (c & 255) * .11) / 255 }

  /* ---------- CHECK ASSETS ---------- */
  function checkAssets(p) {
    K.init({ duration: 4, sky: p.sky || 'night', aspect: '9:16' });
    wrapColours();
    TRACK = {}; ['kato', 'nia'].forEach(function (n) { K.mascot(n) });
    ['hero', 'pear', 'noodle', 'average', 'slim', 'kid'].forEach(function (b) { K.human({ build: b }) });
    var allowed = flatPalette().concat(Object.keys(TRACK).map(Number)); TRACK = null;
    var res = {}, loadErr = {};
    Object.keys(p.assets || {}).forEach(function (n) {
      var before = K.list().slice(), er = runCode(p.assets[n], 'asset ' + n);
      var added = K.list().filter(function (x) { return before.indexOf(x) < 0 });
      loadErr[n] = { err: er, added: added };
    });
    (p.expect || []).forEach(function (x) {
      var r = res[x.name] = { ok: true, errors: [], warnings: [], size: null };
      var code = (p.assets || {})[x.name] || '';
      var le = loadErr[x.name]; if (le && le.err) { r.errors.push(le.err) }
      if (!K.has(x.name)) { r.errors.push('There is no KIT.asset(\'' + x.name + '\', ...) in the answer. The name must be exactly "' + x.name + '".'); r.ok = false; return }
      if (/requestAnimationFrame|KIT\.init|KIT\.start|K\.init|K\.start|renderer|document\./.test(code)) r.errors.push('Do not use requestAnimationFrame, KIT.init, KIT.start, the renderer or document. Only build the asset.');
      if (/Math\.random/.test(code)) r.warnings.push('Uses Math.random — use K.rnd() so the asset looks the same every time.');
      if (/\bTHREE\./.test(code)) r.warnings.push('Uses THREE. directly — write K.T. instead.');
      if (/new\s+(K\.T|THREE)\.Mesh\w*Material|Material\s*\(/.test(code)) r.warnings.push('Makes its own materials — use K.M / K.flat / K.glow so the paper style stays the same.');
      TRACK = {};
      var a;
      try { a = K.make(x.name, {}) } catch (e) { r.errors.push('Building "' + x.name + '" crashed: ' + errText(e) + lineInfo(e)); TRACK = null; r.ok = false; return }
      var used = Object.keys(TRACK).map(Number); TRACK = null;
      var bad = used.filter(function (c) { return !near(c, allowed) });
      if (bad.length) r.warnings.push('Colours not in the palette: ' + bad.slice(0, 4).map(function (c) { return '#' + ('00000' + c.toString(16)).slice(-6) }).join(', ') + ' — use K.PAL colours.');
      if (used.filter(function (c) { return lum(c) > .8 && !near(c, allowed) }).length > 1 && x.kind !== 'fx') r.warnings.push('Several very bright colours — the style is dark and muted.');
      if (!a.root) { r.errors.push('It must return { root: ... }.'); r.ok = false; return }
      var kind = a.kind || (a.arms && a.legs ? 'character' : '');
      if (x.kind && kind !== x.kind) r.errors.push('kind must be \'' + x.kind + '\' (it is \'' + (kind || 'missing') + '\').');
      (x.parts || []).forEach(function (pt) { if (!a[pt]) r.errors.push('Missing part "' + pt + '" in the returned object (the plan needs it).') });
      (x.moves || []).forEach(function (mv) {
        if (!a.do || typeof a.do[mv] !== 'function') { r.errors.push('Missing move do.' + mv + '(k, t) in the returned object.'); return }
        try { [0, .5, 1].forEach(function (k) { a.do[mv].call(a, k, k * 2, {}) }) } catch (e) { r.errors.push('do.' + mv + ' crashed: ' + errText(e)) }
      });
      if (a.idle) try { a.idle(1.3) } catch (e) { r.errors.push('idle(t) crashed: ' + errText(e)) }
      if ((kind === 'character' || kind === 'creature') && !a.face) r.warnings.push('No face — living things should use K.face (or K.human / K.mascot).');
      if (kind === 'set' && !a.spots) r.errors.push('A set must return spots: { name: new K.T.Vector3(x,0,z), ... }.');
      if (kind === 'prop' && x.holdable && !a.grip) r.errors.push('This prop is held, so it must return grip (a K.T.Object3D where the hand holds it).');
      a.root.updateMatrixWorld(true);
      var b = new K.T.Box3().setFromObject(a.root), s = b.getSize(new K.T.Vector3());
      r.size = [s.x, s.y, s.z].map(function (v) { return +v.toFixed(2) });
      var want = x.size || x.height;
      if (want && kind !== 'set') { var h = Math.max(s.y, kind === 'set' ? 0 : Math.max(s.x, s.z) * .5); if (h > want * 2.2 || h < want / 2.2) r.warnings.push('Size looks wrong: it is ' + s.y.toFixed(2) + ' tall but the plan says about ' + want + '.') }
      if (kind === 'set' && Math.max(s.x, s.z) < 6) r.warnings.push('The set is small (' + s.x.toFixed(1) + ' x ' + s.z.toFixed(1) + '). Sets should be about 12–20 wide.');
      var extra = ((le && le.added) || []).filter(function (n) { return n !== x.name });
      if (extra.length) r.warnings.push('The answer also defined: ' + extra.join(', ') + ' (ignored here).');
      a.root.visible = false;
      r.ok = !r.errors.length;
    });
    post({ type: 'check-assets', results: res });
    say('');
  }

  /* ---------- SHEET / PREVIEW ---------- */
  function sheet(p) { loadAssets(p.assets); say(''); K.assetSheet({ sky: p.sky || 'warm' }) }
  function preview(p) { loadAssets(p.assets); say(''); K.preview(p.name, {}) }

  /* ---------- PLAY ---------- */
  var audio = null, clock = { playing: false, base: 0, at: 0 }, built = null, overlay, octx, rec = null, wired = false, lastPost = 0;
  function now() { return performance.now() / 1000 }
  function time() {
    if (audio) return audio.currentTime;
    return clock.playing ? Math.min(P.cut.duration, clock.base + now() - clock.at) : clock.base;
  }
  function play() {
    K.sound(P.sound !== false);
    if (audio) { wire(); audio.play() } else { clock.base = time(); clock.at = now(); clock.playing = true }
  }
  function pause() { if (audio) audio.pause(); else { clock.base = time(); clock.playing = false } }
  function seek(t) { t = Math.max(0, Math.min(P.cut.duration, t)); if (audio) audio.currentTime = t; else { clock.base = t; clock.at = now() } }
  function wire() { // narration through the kit's audio graph so recordings include it
    if (wired || !audio) return; wired = true;
    var A = K.audioInit(), src = A.ctx.createMediaElementSource(audio), g = A.ctx.createGain(); g.gain.value = 1;
    src.connect(g); g.connect(A.ctx.destination); g.connect(A.dest);
  }
  function buildPlay(p, quiet) {
    K.init({ duration: p.cut.duration, sky: p.sky || 'night', aspect: '9:16', name: p.name || 'video', res: p.res || 1080 });
    var ae = loadAssets(p.assets), se = loadShots(p.shots);
    D.onError = function (id, msg) { post({ type: 'shot-error', id: id, msg: msg }) };
    built = D.build({ cut: p.cut, sky: p.sky });
    Object.keys(se).forEach(function (k) { built.errors[k] = se[k] });
    built.assetErrors = ae;
    if (p.audio) { audio = new Audio(); audio.src = URL.createObjectURL(p.audio); audio.preload = 'auto'; audio.onended = function () { post({ type: 'ended' }); if (rec) stopRec() } }
    overlay = document.createElement('canvas'); octx = overlay.getContext('2d'); document.body.appendChild(overlay);
    return built;
  }
  function fitOverlay() {
    var c = K.renderer.domElement;
    if (overlay.width !== c.width || overlay.height !== c.height) { overlay.width = c.width; overlay.height = c.height }
    var st = c.style.cssText + ';pointer-events:none;z-index:3'; if (overlay.style.cssText !== st) overlay.style.cssText = st;
  }
  function after(tq) {
    fitOverlay(); var t = time();
    D.drawOverlay(octx, overlay.width, overlay.height, t, { captions: P.captions !== false });
    if (rec) { rec.ctx.drawImage(K.renderer.domElement, 0, 0, rec.c.width, rec.c.height); rec.ctx.drawImage(overlay, 0, 0, rec.c.width, rec.c.height); if (!audio && t >= P.cut.duration) stopRec() }
    var n = now(); if (n - lastPost > .1) { lastPost = n; var sh = D.shotAt(t); post({ type: 'time', t: t, shot: sh && sh.id, playing: audio ? !audio.paused : clock.playing }); if (UI) UI.tick(t, sh) }
  }
  function startRec() {
    if (rec) return; var A = K.audioInit(); wire();
    var c = document.createElement('canvas'), src = K.renderer.domElement; c.width = src.width; c.height = src.height;
    var stream = c.captureStream(30), tracks = stream.getVideoTracks().concat(A.dest.stream.getAudioTracks());
    var mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].filter(function (m) { return MediaRecorder.isTypeSupported(m) })[0];
    var mr = new MediaRecorder(new MediaStream(tracks), { mimeType: mime, videoBitsPerSecond: 14e6 }), chunks = [];
    mr.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data) };
    mr.onstop = function () { var b = new Blob(chunks, { type: 'video/webm' }); post({ type: 'recorded', blob: b }); if (P.standalone) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (P.name || 'video') + '.webm'; document.body.appendChild(a); a.click() } };
    rec = { c: c, ctx: c.getContext('2d'), mr: mr };
    seek(0); K.sound(true); mr.start(250); play(); post({ type: 'recording', on: true });
  }
  function stopRec() { if (!rec) return; var r = rec; rec = null; setTimeout(function () { r.mr.stop(); pause(); post({ type: 'recording', on: false }) }, 300) }

  function playMode(p) {
    var b = buildPlay(p);
    say('');
    K.start({ bar: false, time: time, after: after });
    post({ type: 'ready', info: { shots: b.shots, warnings: b.warnings, errors: b.errors, assetErrors: b.assetErrors } });
    if (p.standalone) standaloneUI(b);
  }

  /* ---------- CHECK SHOTS: run each shot at a few moments ---------- */
  function checkShots(p) {
    var b = buildPlay(p, true); say('');
    var res = {};
    (p.ids || []).forEach(function (id) {
      var r = D.run().filter(function (x) { return x.id === id })[0], out = res[id] = { ok: true, errors: [], warnings: [] };
      if (!r) { out.errors.push('Shot ' + id + ' is not in this video.'); out.ok = false; return }
      if (!r.made) { out.errors.push('There is no SHOT(\'' + id + '\', {...}) in the answer.'); out.ok = false; return }
      if (b.errors[id]) out.errors.push(b.errors[id]);
      [.05, .5, .95].forEach(function (f) {
        var t = r.from + (r.to - r.from) * f;
        try { K.frame(Math.floor(t * 12) / 12) } catch (e) { out.errors.push('At ' + (t - r.from).toFixed(1) + ' s into the shot: ' + errText(e)) }
      });
      var e2 = D.errors()[id]; if (e2 && out.errors.indexOf(e2) < 0) out.errors.push(e2);
      (D.warnings()[id] || []).forEach(function (w) { out.warnings.push(w) });
      out.ok = !out.errors.length;
    });
    post({ type: 'check-shots', results: res });
  }

  /* ---------- standalone page controls ---------- */
  var UI = null;
  function standaloneUI(b) {
    var bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:6px 12px 6px 6px;border-radius:999px;background:rgba(233,223,200,.14);color:#e9dfc8;font:700 12px "Trebuchet MS",sans-serif;z-index:9;width:min(520px,calc(100% - 24px));box-sizing:border-box';
    bar.innerHTML = '<button id="sp">Play</button><input id="ss" type="range" min="0" max="' + P.cut.duration + '" step=".01" value="0" style="flex:1"><span id="st">0.0</span><span id="sh"></span><button id="sr">Record</button>';
    document.body.appendChild(bar);
    [].forEach.call(bar.querySelectorAll('button'), function (x) { x.style.cssText = 'border:0;border-radius:999px;padding:8px 12px;background:#e9dfc8;color:#14111a;font:inherit;cursor:pointer' });
    var playing = false, sp = bar.querySelector('#sp');
    sp.onclick = function () { playing = !playing; playing ? play() : pause(); sp.textContent = playing ? 'Pause' : 'Play' };
    bar.querySelector('#ss').oninput = function () { seek(+this.value) };
    bar.querySelector('#sr').onclick = startRec;
    UI = { tick: function (t, sh) { bar.querySelector('#st').textContent = t.toFixed(1) + ' s'; bar.querySelector('#sh').textContent = sh ? sh.id : ''; if (document.activeElement !== bar.querySelector('#ss')) bar.querySelector('#ss').value = t } };
  }

  /* ---------- messages ---------- */
  window.addEventListener('message', function (e) {
    var m = e.data || {}; if (!m.type) return;
    if (m.type === 'load') { start(m.payload); return }
    if (!built) return;
    if (m.type === 'play') play(); if (m.type === 'pause') pause(); if (m.type === 'seek') seek(m.t);
    if (m.type === 'record') startRec(); if (m.type === 'stop-record') stopRec();
    if (m.type === 'captions') P.captions = m.on;
    if (m.type === 'sound') { P.sound = m.on; K.sound(m.on) }
  });
  function start(p) {
    P = p; say('Building…');
    setTimeout(function () {
      try {
        if (p.mode === 'check-assets') checkAssets(p);
        else if (p.mode === 'sheet') sheet(p);
        else if (p.mode === 'preview') preview(p);
        else if (p.mode === 'check-shots') checkShots(p);
        else playMode(p);
      } catch (e) { say('Error: ' + errText(e)); post({ type: 'fatal', msg: errText(e) + lineInfo(e) }) }
    }, 20);
  }
  if (window.STAGE_PAYLOAD) start(window.STAGE_PAYLOAD); else post({ type: 'stage-ready' });
  window.STAGE = { start: start, play: play, pause: pause, seek: seek, record: startRec };
})();
