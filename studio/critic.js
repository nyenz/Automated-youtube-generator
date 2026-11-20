/* CRITIC — looks at version A and version B of a job and picks the better one.
   1) The app runs both versions in the locked frame: errors, LINT and pictures (asset cards, people from three sides, scene frames).
   2) Gemini (free key, kept only in this browser) or Sonnet (copy-paste) compares them and names a winner with reasons.
   You can always overrule it. */
(function () {
  'use strict';
  var C = {}; window.CRITIC = C;
  var MODELS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v } catch (e) { return d } }
  function set(k, v) { try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v) } catch (e) { } }
  C.key = function () { return get('studio.geminiKey', '') };
  C.setKey = function (k) { set('studio.geminiKey', String(k || '').trim()) };
  C.mode = function () { return get('studio.criticMode', 'gemini') };        // gemini | sonnet
  C.setMode = function (m) { set('studio.criticMode', m) };
  C.ready = function () { return !!C.key() };

  /* run one version in the frame and gather what the critic needs */
  C.inspect = function (P, job, v) {
    var J = window.JOBS, GK = window.GK, ver = job[v];
    if (!ver || ver.error) return Promise.resolve({ v: v, broken: ver ? ver.error : 'missing' });
    var blocks = J.blocks(P, function (j) { return j.id !== job.id });
    if (job.kind === 'plan') return Promise.resolve({ v: v, planText: JSON.stringify(ver.plan, null, 1) });
    if (job.kind === 'assets') blocks.assets.push({ job: job.id, code: ver.code, full: !!ver.full });
    if (job.kind === 'cast') blocks.cast.push({ job: job.id, code: ver.code, full: !!ver.full });
    if (job.kind === 'scene') { blocks.parts = blocks.parts.filter(function (b) { return b.id !== job.part }); blocks.parts.push({ id: job.part, code: ver.code }) }
    return GK.open(P, blocks).then(function (H) {
      return H.ask({ cmd: 'info' }).then(function (info) {
        info = info || { errors: ['The file did not answer (it may hang or have a syntax error).'], lint: {}, built: [], assets: [], cast: [] };
        // only errors from this reply's own block count (the player complains when no part is built yet; that is not the reply's fault)
        var mine = job.kind === 'scene' ? ['part ' + job.part, 'player'] : ['job:' + job.id, ver.full ? (job.kind === 'cast' ? 'cast block' : 'asset block') : '-'];
        var errs = (info.errors || []).filter(function (e) { var w = H.where(e); return mine.indexOf(w) >= 0 && !(w === 'player' && !(info.built || []).length) || w === 'unknown' && !/reading 'P'/.test(e) });
        var out = { v: v, info: info, errors: errs, errorLines: errs.map(function (e) { var loc = H.locate(e); return { msg: String(e).replace(/\s*\(line \d+\)\s*$/, ''), line: mine.indexOf(loc.label) >= 0 ? loc.line : null } }) };
        var job2 = Promise.resolve();
        if (job.kind === 'assets') job2 = H.ask({ cmd: 'assets', names: job.items.map(function (x) { return x.name }) }).then(function (r) { out.cards = r || [] });
        if (job.kind === 'cast') job2 = H.ask({ cmd: 'cast', names: job.items.map(function (x) { return x.name }) }).then(function (r) { out.cards = r || [] });
        if (job.kind === 'scene') {
          var me = (info.built || []).filter(function (b) { return b.id === job.part })[0];
          out.lint = (info.lint || {})['part ' + job.part] || [];
          if (!me) { out.broken = 'Part ' + job.part + ' did not register. ' + (out.errors[0] || ''); return out }
          var N = 6, times = []; for (var i = 0; i < N; i++) times.push(Math.min(me.END - .05, me.END * (i + .5) / N));
          out.times = times; out.frames = [];
          job2 = times.reduce(function (pr, t) { return pr.then(function () { return H.ask({ cmd: 'frame', t: t, id: job.part }).then(function (svg) { out.frames.push(svg) }) }) }, Promise.resolve())
            .then(function () { // context: the end of the part before and the start of the part after, when they are built
              var prev = (info.built || []).filter(function (b) { return b.id === job.part - 1 })[0], next = (info.built || []).filter(function (b) { return b.id === job.part + 1 })[0];
              return Promise.all([prev ? H.ask({ cmd: 'frame', t: prev.END - .05, id: prev.id }) : null, next ? H.ask({ cmd: 'frame', t: .3, id: next.id }) : null]).then(function (r) { out.prevFrame = r[0]; out.nextFrame = r[1] });
            });
        }
        return job2.then(function () { return out });
      }).then(function (o) { H.close(); return o }, function (e) { H.close(); throw e });
    });
  };

  /* the pictures of ONE version, for the preview page (frames over time, assets, people from three sides) */
  C.pieces = function (job, x, words) {
    var out = [];
    if (!x) return out;
    if (job.kind === 'scene') {
      if (x.prevFrame) out.push({ svg: x.prevFrame, cap: 'Part before', sub: 'its last second', dim: true });
      (x.frames || []).forEach(function (f, i) { out.push({ svg: f, cap: x.times[i].toFixed(1) + ' s', sub: words ? words(x.times[i]) : '' }) });
      if (x.nextFrame) out.push({ svg: x.nextFrame, cap: 'Part after', sub: 'its first second', dim: true });
    } else if (x.cards) {
      x.cards.forEach(function (c) { out.push({ svg: c.svg, cap: c.name, sub: c.error ? 'does not draw: ' + c.error : c.missing ? 'was not made' : (c.band ? c.band + (c.note ? ' \u00B7 ' + c.note : '') : c.note || ''), contain: true, light: !c.dark, kind: job.kind, bad: !!(c.error || c.missing) }) });
    }
    return out;
  };

  /* facts both versions are judged on */
  C.facts = function (job, a, b) {
    function one(x) {
      if (!x) return 'missing';
      if (x.broken) return 'BROKEN: ' + x.broken;
      var e = (x.errors || []).length ? (x.errors.length + ' script error(s): ' + x.errors.slice(0, 2).join('; ')) : 'no script errors';
      if (job.kind === 'scene') { var f = (x.lint || []).filter(function (r) { return !r.ok }); return e + '; LINT ' + ((x.lint || []).length - f.length) + ' of ' + (x.lint || []).length + ' pass' + (f.length ? ' (fails: ' + f.slice(0, 3).map(function (r) { return r.msg }).join('; ') + ')' : '') }
      if (x.cards) { var miss = x.cards.filter(function (c) { return c.missing || c.error }).map(function (c) { return c.name + (c.error ? ' (error)' : ' (missing)') }); return e + (miss.length ? '; not drawn: ' + miss.join(', ') : '; everything draws') }
      return e;
    }
    return 'A: ' + one(a) + '\nB: ' + one(b);
  };
  C.score = function (x) { // rough automatic score, used when one side is clearly broken
    if (!x || x.broken) return -100;
    var s = -((x.errors || []).length * 10);
    if (x.lint) s -= x.lint.filter(function (r) { return !r.ok }).length * 4;
    if (x.cards) s -= x.cards.filter(function (c) { return c.missing || c.error }).length * 20;
    return s;
  };

  /* one picture with A and B side by side (or one above the other for scenes), with labels */
  C.sheet = function (job, a, b, words) {
    var GK = window.GK, isScene = job.kind === 'scene', W, H, cw, ch, cells = [];
    function lab(x, s, X, Y, size, col) { x.fillStyle = col || '#ECE6D8'; x.font = '600 ' + size + 'px Inter, Arial, sans-serif'; x.fillText(s, X, Y) }
    if (isScene) {
      var n = Math.max(a && a.frames ? a.frames.length : 0, b && b.frames ? b.frames.length : 0, 1), ctx = (a && (a.prevFrame || a.nextFrame)) || (b && (b.prevFrame || b.nextFrame)) ? 2 : 0;
      cw = 180; ch = 320; W = 60 + (n + ctx) * (cw + 10); H = 2 * (ch + 46) + 40;
      [a, b].forEach(function (x, r) {
        var y = 30 + r * (ch + 46);
        cells.push({ label: r ? 'B' : 'A', x: 10, y: y + ch / 2, big: true });
        var list = [];
        if (ctx) list.push({ svg: x && x.prevFrame, cap: 'part before (end)', dim: true });
        (x && x.frames || []).forEach(function (f, i) { list.push({ svg: f, cap: (x.times[i]).toFixed(1) + ' s  ' + (words ? words(x.times[i]) : '') }) });
        if (ctx) list.push({ svg: x && x.nextFrame, cap: 'part after (start)', dim: true });
        list.forEach(function (it, i) { cells.push({ svg: it.svg, x: 50 + i * (cw + 10), y: y, w: cw, h: ch, cap: it.cap, dim: it.dim, broken: x && x.broken }) });
        if (x && x.broken) cells.push({ text: 'BROKEN: ' + x.broken, x: 60, y: y + ch / 2 });
      });
    } else {
      var items = job.items.map(function (i) { return i.name }), per = job.kind === 'cast' ? [360, 170] : [200, 200];
      cw = per[0]; ch = per[1]; W = 40 + 2 * (cw + 20) + 20; H = 50 + items.length * (ch + 40);
      cells.push({ label: 'A', x: 40 + cw / 2, y: 26 }); cells.push({ label: 'B', x: 60 + cw * 1.5 + 20, y: 26 });
      items.forEach(function (name, r) {
        [a, b].forEach(function (x, c) {
          var card = x && x.cards ? x.cards.filter(function (k) { return k.name === name })[0] : null;
          cells.push({ svg: card && card.svg, x: 30 + c * (cw + 30), y: 40 + r * (ch + 40), w: cw, h: ch, cap: name + (card && card.error ? ' (error)' : !card || card.missing ? ' (not drawn)' : ''), contain: true, light: card && card.dark ? false : true, broken: x && x.broken });
        });
      });
    }
    var c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d');
    g.fillStyle = '#141416'; g.fillRect(0, 0, W, H);
    return cells.reduce(function (pr, cell) {
      return pr.then(function () {
        if (cell.label) { lab(g, cell.label, cell.x - 8, cell.y + 10, cell.big ? 30 : 22, '#ff6b73'); return }
        if (cell.text) { lab(g, cell.text.slice(0, 120), cell.x, cell.y, 14, '#ff7b7b'); return }
        g.fillStyle = cell.contain ? (cell.light ? '#EDE6D6' : '#1d1d20') : '#000'; g.fillRect(cell.x, cell.y, cell.w, cell.h);
        lab(g, String(cell.cap || '').slice(0, 34), cell.x + 2, cell.y + cell.h + 16, 12, cell.dim ? 'rgba(236,230,216,.55)' : '#ECE6D8');
        if (!cell.svg) return;
        var s = cell.svg; if (cell.contain) s = s.replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ');
        return GK.raster(s, cell.w * 2, cell.h * 2, null, cell.contain ? (cell.light ? '#EDE6D6' : '#1d1d20') : null).then(function (cv) { g.globalAlpha = cell.dim ? .7 : 1; g.drawImage(cv, cell.x, cell.y, cell.w, cell.h); g.globalAlpha = 1 }).catch(function () { lab(g, 'could not draw', cell.x + 8, cell.y + 20, 12, '#ff7b7b') });
      });
    }, Promise.resolve()).then(function () { return c });
  };

  /* Gemini: the sheet (or the two plans) plus the brief -> the verdict */
  function call(model, body) {
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(C.key()), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {} }).then(function (j) { if (!r.ok) { var e = new Error((j && j.error && j.error.message) || ('Gemini answered with an error (' + r.status + ').')); e.status = r.status; throw e } return j }) });
  }
  C.gemini = function (ask, pngDataUrl, extraText) {
    if (!C.key()) return Promise.reject(new Error('No Gemini key yet. Add it in Settings (top right).'));
    var parts = [{ text: ask }];
    if (extraText) parts.push({ text: extraText });
    var m = /^data:([^;]+);base64,(.*)$/.exec(pngDataUrl || ''); if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
    var body = { contents: [{ role: 'user', parts: parts }], generationConfig: { responseMimeType: 'application/json', temperature: .2 } };
    function tryModel(i, last) {
      if (i >= MODELS.length) return Promise.reject(last || new Error('Gemini did not answer.'));
      return call(MODELS[i], body).catch(function (e) { if (e.status === 404 || /not found|not supported/i.test(e.message)) return tryModel(i + 1, e); throw e });
    }
    return tryModel(0).then(function (j) {
      var txt = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(function (p) { return p.text || '' }).join('');
      var v = window.JOBS.parseCritic(txt); if (!v) throw new Error('Gemini answered, but without a clear winner. Try again or pick yourself.');
      v.by = 'Gemini'; return v;
    });
  };
})();
