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
  var audio = null, music = null, musicGain = null, clock = { playing: false, base: 0, at: 0 }, built = null, overlay, octx, rec = null, wired = false, lastPost = 0, SPEECH = [];
  function MIX() { return Object.assign({ narr: 1, sfx: 1, music: .25, duck: true }, P.mix || {}) }
  function speechRegions(words) { var out = []; (words || []).forEach(function (w) { var L = out[out.length - 1]; if (L && w[1] - L[1] < .6) L[1] = w[2]; else out.push([w[1], w[2]]) }); return out }
  function speaking(t) { for (var i = 0; i < SPEECH.length; i++) if (t >= SPEECH[i][0] - .2 && t <= SPEECH[i][1] + .15) return true; return false }
  function now() { return performance.now() / 1000 }
  function time() {
    if (audio) return audio.currentTime;
    return clock.playing ? Math.min(P.cut.duration, clock.base + now() - clock.at) : clock.base;
  }
  function play() {
    K.sound(P.sound !== false);
    wire(); if (audio) audio.play(); else { clock.base = time(); clock.at = now(); clock.playing = true }
    if (music) { music.currentTime = time() % (music.duration || 1e9); music.play() }
  }
  function pause() { if (audio) audio.pause(); else { clock.base = time(); clock.playing = false } if (music) music.pause() }
  function seek(t) { t = Math.max(0, Math.min(P.cut.duration, t)); if (audio) audio.currentTime = t; else { clock.base = t; clock.at = now() } if (music && music.duration) music.currentTime = t % music.duration }
  function wire() { // narration through the kit's audio graph so recordings include it
    if (wired) return; wired = true; var A = K.audioInit(), M = MIX();
    if (audio) { var src = A.ctx.createMediaElementSource(audio), g = A.ctx.createGain(); g.gain.value = M.narr; src.connect(g); g.connect(A.ctx.destination); g.connect(A.dest) }
    if (music) { var ms = A.ctx.createMediaElementSource(music); musicGain = A.ctx.createGain(); musicGain.gain.value = M.music; ms.connect(musicGain); musicGain.connect(A.ctx.destination); musicGain.connect(A.dest) }
  }
  function buildPlay(p) {
    K.init({ duration: p.cut.duration, sky: p.sky || 'night', aspect: p.aspect || '9:16', name: p.name || 'video', res: p.res || 1080 });
    var ae = loadAssets(p.assets), se = loadShots(p.shots);
    D.onError = function (id, msg) { post({ type: 'shot-error', id: id, msg: msg }) };
    K.sfxVol = MIX().sfx; D.groupSize = (p.capStyle && p.capStyle.group) || 3; SPEECH = speechRegions(p.cut.words);
    var LK = Object.assign({ film: .8, atmos: .8, fg: true }, p.look || {});
    K.film = { grain: LK.film, weave: LK.film, halation: LK.film, fog: LK.atmos };
    built = D.build({ cut: p.cut, sky: p.sky, sizes: p.sizes, look: LK });
    Object.keys(se).forEach(function (k) { built.errors[k] = se[k] });
    built.assetErrors = ae;
    if (p.music) { music = new Audio(); music.src = URL.createObjectURL(p.music); music.loop = true; music.preload = 'auto' }
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
    D.drawOverlay(octx, overlay.width, overlay.height, t, { captions: P.captions !== false, style: P.capStyle });
    if (musicGain) { var M = MIX(); musicGain.gain.setTargetAtTime(M.music * (M.duck && speaking(t) ? .4 : 1), musicGain.context.currentTime, speaking(t) ? .12 : .35) }
    if (GRAB) { var g = composite(GRAB.w, GRAB.h); GRAB = null; g.toBlob(function (b) { post({ type: 'frame', blob: b, t: t }) }, 'image/png') }
    if (rec) { rec.ctx.drawImage(K.renderer.domElement, 0, 0, rec.c.width, rec.c.height); rec.ctx.drawImage(overlay, 0, 0, rec.c.width, rec.c.height); if (!audio && t >= P.cut.duration) stopRec() }
    var n = now(); if (n - lastPost > .1) { lastPost = n; var sh = D.shotAt(t); post({ type: 'time', t: t, shot: sh && sh.id, playing: audio ? !audio.paused : clock.playing }); if (UI) UI.tick(t, sh) }
  }
  var GRAB = null;
  function composite(W, H) { var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.drawImage(K.renderer.domElement, 0, 0, W, H); x.drawImage(overlay, 0, 0, W, H); return c }
  function outSize() { return (P.aspect === '16:9') ? [1920, 1080] : [1080, 1920] }

  /* ---------- EXPORT: render every frame offline -> MP4 (H.264 + AAC) or WebM (VP9 + Opus) ---------- */
  async function pickCodecs(W, H, FPS, br) {
    if (!window.VideoEncoder || !window.AudioEncoder) return null;
    var vids = [{ c: 'avc1.640028', fmt: 'mp4' }, { c: 'avc1.4d0028', fmt: 'mp4' }, { c: 'avc1.42003e', fmt: 'mp4' }, { c: 'vp09.00.40.08', fmt: 'webm' }, { c: 'vp8', fmt: 'webm' }];
    for (var i = 0; i < vids.length; i++) {
      var v = vids[i], cfg = { codec: v.c, width: W, height: H, bitrate: br, framerate: FPS };
      if (v.fmt === 'mp4') cfg.avc = { format: 'avc' };
      try { var r = await VideoEncoder.isConfigSupported(cfg); if (!r.supported) continue } catch (e) { continue }
      var auds = v.fmt === 'mp4' ? [['mp4a.40.2', 'aac'], ['opus', 'opus']] : [['opus', 'A_OPUS']];
      for (var j = 0; j < auds.length; j++) {
        var ac = { codec: auds[j][0], sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 };
        try { var ra = await AudioEncoder.isConfigSupported(ac); if (ra.supported) return { fmt: v.fmt, vcfg: cfg, acfg: ac, amux: auds[j][1] } } catch (e) { }
      }
    }
    return null;
  }
  async function exportMode(p) {
    var b = buildPlay(Object.assign({}, p, { audio: null })); say('');
    var WH = outSize(), W = WH[0], H = WH[1], FPS = p.fps || 30, dur = p.cut.duration, N = Math.ceil(dur * FPS);
    post({ type: 'ready', info: { shots: b.shots, warnings: b.warnings, errors: b.errors } });
    var pick = await pickCodecs(W, H, FPS, p.bitrate || 12e6);
    if (!pick) { post({ type: 'export-fallback', msg: 'This browser cannot encode video directly. Using real-time recording instead.' }); K.start({ bar: false, time: time, after: after }); setTimeout(startRec, 500); return }
    post({ type: 'export-progress', stage: 'audio', done: 0 });
    var narr = null;
    if (p.audio) { var ab = await p.audio.arrayBuffer(); narr = await new OfflineAudioContext(2, 48000, 48000).decodeAudioData(ab) }
    var mus = null; if (p.music) { var mb = await p.music.arrayBuffer(); mus = await new OfflineAudioContext(2, 48000, 48000).decodeAudioData(mb) }
    var M = MIX(), mix = await K.renderAudio(dur, narr, { narr: M.narr, sfx: M.sfx, music: mus, musicVol: M.music, duck: M.duck, speech: speechRegions(p.cut.words) });
    var mp4 = pick.fmt === 'mp4', Mx = mp4 ? window.Mp4Muxer : window.WebMMuxer, target = new Mx.ArrayBufferTarget();
    var muxer = mp4 ? new Mx.Muxer({ target: target, video: { codec: 'avc', width: W, height: H, frameRate: FPS }, audio: { codec: pick.amux, sampleRate: 48000, numberOfChannels: 2 }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' })
      : new Mx.Muxer({ target: target, video: { codec: pick.vcfg.codec === 'vp8' ? 'V_VP8' : 'V_VP9', width: W, height: H, frameRate: FPS }, audio: { codec: 'A_OPUS', sampleRate: 48000, numberOfChannels: 2 }, firstTimestampBehavior: 'offset' });
    // audio first (kept in memory, interleaved with video later)
    var aq = [], aerr = null, aenc = new AudioEncoder({ output: function (c, m) { aq.push([c, m]) }, error: function (e) { aerr = e } });
    aenc.configure(pick.acfg);
    var L = mix.getChannelData(0), R = mix.numberOfChannels > 1 ? mix.getChannelData(1) : L, step = 4800;
    for (var i = 0; i < mix.length; i += step) {
      var n = Math.min(step, mix.length - i), buf = new Float32Array(n * 2); buf.set(L.subarray(i, i + n), 0); buf.set(R.subarray(i, i + n), n);
      var ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / 48000 * 1e6), data: buf });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush(); if (aerr) throw aerr;
    var ai = 0;
    function flushAudio(ts) { while (ai < aq.length && aq[ai][0].timestamp <= ts) { muxer.addAudioChunk(aq[ai][0], aq[ai][1]); ai++ } }
    var verr = null, venc = new VideoEncoder({ output: function (c, m) { flushAudio(c.timestamp); muxer.addVideoChunk(c, m) }, error: function (e) { verr = e } });
    venc.configure(pick.vcfg);
    K.sound(false); fitOverlay();
    var comp = document.createElement('canvas'); comp.width = W; comp.height = H; var cx = comp.getContext('2d'), t0 = performance.now();
    for (var f = 0; f < N; f++) {
      if (CANCEL) { post({ type: 'export-cancelled' }); return }
      var t = f / FPS, tq = Math.floor(t * 12) / 12;
      K.frame(tq, t); fitOverlay(); D.drawOverlay(octx, overlay.width, overlay.height, t, { captions: P.captions !== false, style: P.capStyle });
      cx.drawImage(K.renderer.domElement, 0, 0, W, H); cx.drawImage(overlay, 0, 0, W, H);
      var vf = new VideoFrame(comp, { timestamp: Math.round(f * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
      venc.encode(vf, { keyFrame: f % (FPS * 2) === 0 }); vf.close();
      if (verr) throw verr;
      while (venc.encodeQueueSize > 6) await new Promise(function (r) { setTimeout(r, 4) });
      if (f % 10 === 0) { var el = (performance.now() - t0) / 1000; post({ type: 'export-progress', stage: 'video', done: f / N, eta: f ? el / f * (N - f) : 0 }); await new Promise(function (r) { setTimeout(r, 0) }) }
    }
    await venc.flush(); if (verr) throw verr; flushAudio(1e15);
    muxer.finalize();
    var blob = new Blob([target.buffer], { type: mp4 ? 'video/mp4' : 'video/webm' });
    post({ type: 'exported', blob: blob, ext: mp4 ? 'mp4' : 'webm', codec: pick.vcfg.codec + ' + ' + pick.acfg.codec, seconds: (performance.now() - t0) / 1000 });
    if (P.standalone) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (P.name || 'video') + '.' + (mp4 ? 'mp4' : 'webm'); document.body.appendChild(a); a.click() }
  }
  var CANCEL = false;

  function startRec() {
    if (rec) return; var A = K.audioInit(); wire();
    var c = document.createElement('canvas'), wh = outSize(); c.width = wh[0]; c.height = wh[1];
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
    var b = buildPlay(p); say('');
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
    bar.innerHTML = '<button id="sp">Play</button><input id="ss" type="range" min="0" max="' + P.cut.duration + '" step=".01" value="0" style="flex:1"><span id="st">0.0</span><span id="sh"></span>';
    document.body.appendChild(bar);
    [].forEach.call(bar.querySelectorAll('button'), function (x) { x.style.cssText = 'border:0;border-radius:999px;padding:8px 12px;background:#e9dfc8;color:#14111a;font:inherit;cursor:pointer' });
    var playing = false, sp = bar.querySelector('#sp');
    sp.onclick = function () { playing = !playing; playing ? play() : pause(); sp.textContent = playing ? 'Pause' : 'Play' };
    bar.querySelector('#ss').oninput = function () { seek(+this.value) };
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
    if (m.type === 'grab') { var wh = outSize(); GRAB = { w: wh[0], h: wh[1] } }
    if (m.type === 'cancel') CANCEL = true;
    if (m.type === 'sound') { P.sound = m.on; K.sound(m.on) }
    if (m.type === 'style') { P.capStyle = m.capStyle; P.mix = m.mix; D.groupSize = (m.capStyle && m.capStyle.group) || 3; K.sfxVol = MIX().sfx }
  });
  function start(p) {
    P = p; say('Building…');
    setTimeout(function () {
      try {
        if (p.mode === 'check-assets') checkAssets(p);
        else if (p.mode === 'sheet') sheet(p);
        else if (p.mode === 'preview') preview(p);
        else if (p.mode === 'check-shots') checkShots(p);
        else if (p.mode === 'export') exportMode(p).catch(function (e) { post({ type: 'fatal', msg: 'Export failed: ' + errText(e) }) });
        else playMode(p);
      } catch (e) { say('Error: ' + errText(e)); post({ type: 'fatal', msg: errText(e) + lineInfo(e) }) }
    }, 20);
  }
  if (window.STAGE_PAYLOAD) start(window.STAGE_PAYLOAD); else post({ type: 'stage-ready' });
  window.STAGE = { start: start, play: play, pause: pause, seek: seek, record: startRec };
})();
