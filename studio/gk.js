/* GK — everything the app does with the Gilded Kasumi project file.
   The file (styles/gilded-kasumi/project.html) is used exactly as given: its rulebook, engine, library and player never change.
   The app only:
   - fills the project plan JSON (the times and words come from the app, the rest from the PROJECT reply),
   - adds the blocks the models return (assets, people, parts) as their own <script> tags, so one bad reply can never break another,
   - keeps the worked example (Under the Ice, part 1) as text the models can copy, but switched off, so it never plays as part 1 of a new video,
   - runs the file in a locked frame (no access to the app's data) to read LINT, draw frames and check replies. */
(function () {
  'use strict';
  var G = {}; window.GK = G;
  var TPL = null, TPLNAMES = null;
  var URLT = 'styles/gilded-kasumi/project.html';

  G.template = function () {
    if (TPL) return Promise.resolve(TPL);
    return fetch(URLT + '?v=' + (window.APP_VERSION || ''), { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('The Gilded Kasumi file could not be loaded.'); return r.text() })
      .then(function (t) { TPL = t; TPLNAMES = { assets: names(t, 'assets'), cast: names(t, 'cast') }; return t });
  };
  function block(text, open) { var a = text.indexOf(open); if (a < 0) return null; var b = text.indexOf('</script>', a); return { start: a, inner: a + open.length, end: b, close: b + 9, body: text.slice(a + open.length, b) } }
  function names(t, kind) {
    var out = {};
    if (kind === 'assets') { var b = block(t, '<script data-assets>'); (b ? b.body : '').replace(/ASSET\(\s*['"]([\w$]+)['"]/g, function (m, n) { out[n] = 1 }) }
    else { var e = t.indexOf('const CAST={'), c = e >= 0 ? t.slice(e, t.indexOf('\n};', e) + 3) : ''; c.replace(/^\s{0,3}([A-Za-z_$][\w$]*)\s*:\s*\{/gm, function (m, n) { out[n] = 1 });
      var cb = block(t, '<script data-cast>'); (cb ? cb.body : '').replace(/CAST\.([A-Za-z_$][\w$]*)\s*=|CAST\[['"]([\w$]+)['"]\]\s*=/g, function (m, a, b) { out[a || b] = 1 }) }
    return out;
  }
  G.libraryNames = function () { return TPLNAMES || { assets: {}, cast: {} } };

  /* ---------- the plan: app times and words + the model's plan ---------- */
  var KEEP = ['title', 'place', 'time', 'moods', 'cast', 'assets', 'in', 'out', 'starts_on', 'ends_on', 'job', 'beats', 'explainer'];
  G.plan = function (P) {
    var base = window.AUDIO.plan(P), mp = P.plan || {}, by = {};
    (mp.parts || []).forEach(function (p) { if (p && p.id != null) by[p.id] = p });
    base.parts = base.parts.map(function (p) { var m = by[p.id] || {}, o = { id: p.id, title: m.title || p.title || '', start: p.start, end: p.end, text: p.text };
      KEEP.forEach(function (k) { if (k !== 'title' && m[k] != null) o[k] = m[k] }); return o });
    var n = base.parts.length;
    base.parts.forEach(function (p, i) {       // joins always agree on both sides (section 16)
      if (i === 0) p.in = 'dip'; else p.in = base.parts[i - 1].out || p.in || 'dip';
      if (i === n - 1) p.out = 'none'; else if (!p.out) p.out = 'dip';
      if (i > 0) p.in = base.parts[i - 1].out;
    });
    ['continuity', 'chapters', 'places', 'assets_info', 'cast_info'].forEach(function (k) { if (mp[k] != null) base[k] = mp[k] });
    if (!mp.parts) base.todo = 'Run MODE: PROJECT to fill in place, time, moods, cast, assets, joins and beats for every part. The times and words are already final.';
    return base;
  };

  /* ---------- the file ---------- */
  function scriptTag(attrs, code) { return '<script ' + attrs + '>\n' + String(code).replace(/<\/script/gi, '<\\/script') + '\n</script>\n' }
  // blocks: { assets: [{job, code, full}], cast: [...], parts: [{id, code}] }
  G.compose = function (P, blocks, opts) {
    opts = opts || {};
    return G.template().then(function (t) {
      var plan = G.plan(P);
      if (P.format === 'long') plan.stage = 'wide';
      var pj = block(t, '<script type="application/json" id="project">');
      t = t.slice(0, pj.inner) + '\n' + JSON.stringify(plan, null, 1) + '\n' + t.slice(pj.end);
      // the worked example stays readable but switched off
      t = t.replace('<script data-part="1">', '<script type="text/plain" data-example-part="1">');
      blocks = blocks || {};
      var cb = block(t, '<script data-cast>'), extraCast = '';
      (blocks.cast || []).forEach(function (b) {
        if (b.full) t = t.slice(0, cb.inner) + '\n' + b.code + '\n' + t.slice(cb.end);
        else extraCast += scriptTag('data-cast data-job="' + b.job + '"', b.code);
        cb = block(t, '<script data-cast>');
      });
      if (extraCast) t = t.slice(0, cb.close) + '\n' + extraCast + t.slice(cb.close);
      var ab = block(t, '<script data-assets>'), extraA = '';
      (blocks.assets || []).forEach(function (b) {
        if (b.full) t = t.slice(0, ab.inner) + '\n' + b.code + '\n' + t.slice(ab.end);
        else extraA += scriptTag('data-assets data-job="' + b.job + '"', b.code);
        ab = block(t, '<script data-assets>');
      });
      if (extraA) t = t.slice(0, ab.close) + '\n' + extraA + t.slice(ab.close);
      var parts = (blocks.parts || []).slice().sort(function (a, b) { return a.id - b.id }).map(function (b) { return scriptTag('data-part="' + b.id + '"', b.code) }).join('');
      var pl = t.indexOf('<script id="player">');
      t = t.slice(0, pl) + parts + t.slice(pl);
      if (opts.bridge) {
        t = t.replace('<head>', '<head>\n<script>window.__ERR=[];addEventListener("error",function(e){__ERR.push((e.message||"error")+(e.lineno?" (line "+e.lineno+")":""))});</script>');
        var end = t.lastIndexOf('</body>');
        t = t.slice(0, end) + '<script id="studio-bridge">' + BRIDGE + '</script>\n' + t.slice(end);
      }
      return t;
    });
  };

  /* runs inside the locked frame: answers the app's questions */
  var BRIDGE = '(' + function () {
    // parsed by the page (forgiving), then written out as strict SVG so the app can turn it into a picture
    function svgOf(inner, box) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', box); s.innerHTML = inner; return new XMLSerializer().serializeToString(s) }
    function answer(e, data) { e.source.postMessage({ rid: e.data.rid, data: data }, '*') }
    window.addEventListener('message', function (e) {
      var m = e.data || {}, out = null;
      try {
        if (m.cmd === 'info') {
          var built = Object.keys(PARTS).map(Number).sort(function (a, b) { return PARTS[a].AUDIO_START - PARTS[b].AUDIO_START });
          var L = {}; try { L = LINT() } catch (er) { L = { project: [{ ok: false, msg: 'The checks could not run: ' + er.message }] } }
          out = { built: built.map(function (id) { var P = PARTS[id]; return { id: id, END: P.END, AUDIO_START: P.AUDIO_START, AUDIO_END: P.AUDIO_END, title: P.title || '', IN: P.IN, OUT: P.OUT, HITS: (P.HITS || []).slice() } }),
            lint: L, assets: Object.keys(ASSETS), cast: Object.keys(CAST), errors: window.__ERR || [], stage: { W: STAGE.W, H: STAGE.H, name: STAGE.name },
            timeline: (function () { try { return TIMELINE() } catch (er) { return [] } })() };
        } else if (m.cmd === 'frame') {
          if (m.id != null) seek(m.t, m.id); else seek(m.t);
          var scr = document.getElementById('scr'); out = svgOf(scr.innerHTML, scr.getAttribute('viewBox'));
        } else if (m.cmd === 'assets') {
          out = (m.names || []).map(function (n) { var f = ASSETS[n]; if (!f) return { name: n, missing: true }; var s = f.spec || {}; try { UID = 7000; return { name: n, svg: svgOf(f(s.demo || {}), (s.box || [-100, -200, 200, 220]).join(' ')), note: s.note || '', band: s.band || '', dark: !!s.dark } } catch (er) { return { name: n, error: er.message } } });
          UID = 0;
        } else if (m.cmd === 'cast') {
          out = (m.names || []).map(function (n, i) { var ch = CAST[n]; if (!ch) return { name: n, missing: true }; try { UID = 1000 + i * 60; return { name: n, svg: svgOf(['side', 'front', 'back'].map(function (v, j) { return place(ch, (j - 1) * 270, 0, poseAt('stand', 0), faceAt('neutral', 0), { light: 'left', state: 'normal', headR: 43, t: 1, size: 1, view: v }) }).join(''), '-420 -350 840 380') } } catch (er) { return { name: n, error: er.message } } });
          UID = 0;
        }
      } catch (er) { out = { error: er.message } }
      answer(e, out);
    });
    parent.postMessage({ studioReady: true }, '*');
  } + ')();';

  /* ---------- the locked frame ---------- */
  function Host(text) {
    var self = this, ifr = document.createElement('iframe'), url = URL.createObjectURL(new Blob([text], { type: 'text/html' })), rid = 0, wait = {}, readyRes;
    ifr.setAttribute('sandbox', 'allow-scripts');
    ifr.setAttribute('aria-hidden', 'true'); ifr.tabIndex = -1;
    ifr.style.cssText = 'position:fixed;left:-10000px;top:0;width:540px;height:960px;border:0;opacity:0;pointer-events:none';
    this.ready = new Promise(function (r) { readyRes = r });
    function onMsg(e) {
      if (e.source !== ifr.contentWindow) return;
      var d = e.data || {}; if (d.studioReady) { readyRes(); return }
      if (d.rid && wait[d.rid]) { wait[d.rid](d.data); delete wait[d.rid] }
    }
    window.addEventListener('message', onMsg);
    ifr.src = url; document.body.appendChild(ifr);
    var timer = setTimeout(function () { readyRes() }, 15000);   // a file that never answers still lets the app go on
    this.ask = function (msg) { return self.ready.then(function () { return new Promise(function (res) { var id = ++rid; wait[id] = res; msg.rid = id; ifr.contentWindow.postMessage(msg, '*'); setTimeout(function () { if (wait[id]) { delete wait[id]; res(null) } }, 20000) }) }) };
    this.close = function () { clearTimeout(timer); window.removeEventListener('message', onMsg); ifr.remove(); URL.revokeObjectURL(url) };
  }
  /* which block each line of the file belongs to, so an error names the reply that caused it */
  function lineMap(t) {
    var out = [], re = /<script([^>]*)>/g, m;
    while ((m = re.exec(t))) {
      var a = m[1], start = t.slice(0, m.index).split('\n').length, endIdx = t.indexOf('</script>', m.index), end = t.slice(0, endIdx).split('\n').length, label = 'other', jm;
      if (/id="engine"/.test(a)) label = 'engine'; else if (/id="player"/.test(a)) label = 'player'; else if (/studio-bridge/.test(a)) label = 'app';
      else if ((jm = /data-job="([^"]+)"/.exec(a))) label = 'job:' + jm[1]; else if (/data-cast/.test(a)) label = 'cast block'; else if (/data-assets/.test(a)) label = 'asset block';
      else if ((jm = /data-part="(\d+)"/.exec(a))) label = 'part ' + jm[1];
      out.push([start, end, label]);
    }
    return out;
  }
  G.open = function (P, blocks) { return G.compose(P, blocks, { bridge: true }).then(function (t) { var H = new Host(t), L = lineMap(t);
    H.where = function (msg) { var m = /\(line (\d+)\)/.exec(msg || ''), n = m ? +m[1] : -1; for (var i = 0; i < L.length; i++) if (n >= L[i][0] && n <= L[i][1]) return L[i][2]; return 'unknown' };
    /* the block an error is in, and its line counted from the first line of that block's code (line 1 = the first line the model wrote) */
    H.locate = function (msg) { var m = /\(line (\d+)\)/.exec(msg || ''), n = m ? +m[1] : -1; for (var i = 0; i < L.length; i++) if (n >= L[i][0] && n <= L[i][1]) return { label: L[i][2], line: Math.max(1, n - L[i][0]) }; return { label: 'unknown', line: null } };
    return H }) };

  /* SVG text -> canvas (for previews, the critic and the MP4) */
  G.raster = function (svg, W, H, canvas, bg) {
    return new Promise(function (res, rej) {
      var s = String(svg), head = s.slice(0, s.indexOf('>'));
      s = s.replace('<svg ', '<svg width="' + W + '" height="' + H + '" ' + (/preserveAspectRatio=/.test(head) ? '' : 'preserveAspectRatio="xMidYMid slice" '));
      var img = new Image(), u = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
      img.onload = function () { var c = canvas || document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = bg || '#000'; x.fillRect(0, 0, W, H); x.drawImage(img, 0, 0, W, H); URL.revokeObjectURL(u); res(c) };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error('A frame could not be drawn.')) };
      img.src = u;
    });
  };

  /* ---------- reading the models' replies ---------- */
  function fences(text) { var out = [], re = /```[\w-]*\s*\n([\s\S]*?)```/g, m; while ((m = re.exec(text))) out.push(m[1]); return out }
  function matchClose(s, i) { // from an opening "(" at i, the index after its matching ")" (skips strings and comments)
    var d = 0, q = null;
    for (var k = i; k < s.length; k++) {
      var c = s[k];
      if (q) { if (c === '\\') { k++; continue } if (c === q) q = null; else if (q === '`' && c === '$' && s[k + 1] === '{') { /* template expr: count braces */ } continue }
      if (c === '"' || c === "'" || c === '`') { q = c; continue }
      if (c === '/' && s[k + 1] === '/') { k = s.indexOf('\n', k); if (k < 0) return -1; continue }
      if (c === '/' && s[k + 1] === '*') { k = s.indexOf('*/', k + 2); if (k < 0) return -1; k++; continue }
      if (c === '(') d++; else if (c === ')') { d--; if (!d) return k + 1 }
    }
    return -1;
  }
  G.splitVersions = function (text) {
    var re = /(?:^|\n)\s*(?:#+\s*)?(?:={2,}|\*\*)?\s*VERSION\s+([AB])\b[^\n]*\n/gi, m, at = [];
    while ((m = re.exec(text))) at.push({ v: m[1].toUpperCase(), i: m.index, j: re.lastIndex });
    if (at.length < 2) return null;
    var out = {}; at.forEach(function (a, k) { out[a.v] = text.slice(a.j, k + 1 < at.length ? at[k + 1].i : text.length) });
    return out.A && out.B ? out : null;
  };
  G.parse = function (kind, text, job) {
    text = String(text || '').trim();
    if (!text) return { error: 'Nothing was pasted.' };
    var whole = /<script[^>]*id="engine"/.test(text);
    if (kind === 'plan') {
      var j = null, cand = [], pb = /<script type="application\/json" id="project">([\s\S]*?)<\/script>/.exec(text);
      if (pb) cand.push(pb[1]);
      fences(text).forEach(function (f) { cand.push(f) });
      var a = text.indexOf('{'), b = text.lastIndexOf('}'); if (a >= 0 && b > a) cand.push(text.slice(a, b + 1));
      for (var i = 0; i < cand.length && !j; i++) { try { var o = JSON.parse(cand[i]); if (o && Array.isArray(o.parts)) j = o } catch (e) { } }
      if (!j) return { error: 'No project plan was found. The reply must hold the plan JSON (with "parts") in a code block.' };
      return { plan: j };
    }
    if (kind === 'scene') {
      var want = job.part, re = /<script[^>]*data-part="(\d+)"[^>]*>([\s\S]*?)<\/script>/g, mm, code = null;
      while ((mm = re.exec(text))) if (+mm[1] === want) code = mm[2];
      if (!code) fences(text).concat([text]).some(function (f) { var k = f.search(/\(function\s*\(\)\s*\{[\s\S]*?PART\(/); if (k >= 0 && new RegExp('id\\s*:\\s*' + want + '\\b').test(f)) { var e2 = f.lastIndexOf('})();'); code = f.slice(k, e2 >= 0 ? e2 + 5 : undefined); return true } return false });
      if (!code) return { error: 'No block for part ' + want + ' was found. The reply must hold <script data-part="' + want + '"> … </script>.' };
      if (!new RegExp('id\\s*:\\s*' + want + '\\b').test(code)) return { error: 'The block does not say PART({ id: ' + want + ' }). It may be a different part.' };
      return { code: code.trim() };
    }
    // assets and people
    var lib = G.libraryNames()[kind === 'cast' ? 'cast' : 'assets'];
    if (whole) {
      var open = kind === 'cast' ? '<script data-cast>' : '<script data-assets>', b0 = block(text, open), tb = block(TPL, open);
      if (!b0) return { error: 'The file in the reply has no ' + (kind === 'cast' ? 'cast' : 'asset') + ' block.' };
      var body = b0.body, orig = tb ? tb.body : '';
      if (orig && body.indexOf(orig.trim()) >= 0) return { code: body.slice(body.indexOf(orig.trim()) + orig.trim().length).trim(), note: 'Taken from the whole file in the reply.' };
      return { code: body.trim(), full: true, note: 'The reply changed the original block, so its whole block is used.' };
    }
    var fs = fences(text), src = fs.length ? fs.join('\n\n') : text;
    if (kind === 'assets' && !/ASSET\(/.test(src)) return { error: 'No ASSET(...) calls were found in the reply.' };
    if (kind === 'cast' && !/CAST|HAIR\(|OUTFIT\(|LOOKS/.test(src)) return { error: 'No people were found in the reply (no CAST, HAIR or OUTFIT lines).' };
    src = src.replace(/<\/?script[^>]*>/g, '').trim();
    return { code: src };
  };
  G.isLibraryName = function (kind, n) { var L = G.libraryNames(); return !!(L[kind] && L[kind][n]) };
  G.matchClose = matchClose;
})();
