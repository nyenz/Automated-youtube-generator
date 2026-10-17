/* PAPER CINEMA STUDIO — the app. Plain JS, runs in Chrome, saves in the browser. */
(function () {
  var P = null, STEP = 'project', CUT = null, PLAYER = null, $main = document.getElementById('main');
  var STEPS = [
    ['project', 'Project'], ['topic', 'Topic'], ['script', 'Script'], ['voice', 'Voice & timing'], ['plan', 'Plan'],
    ['assets', 'Assets'], ['shots', 'Shots'], ['watch', 'Edit & watch'], ['export', 'Export'], ['publish', 'Publish']
  ];
  var STEPS_EASY = [['start', 'Start', '1'], ['plan', 'Plan', '2'], ['assets', 'Assets', '3'], ['shots', 'Shots', '4'], ['watch', 'Edit & watch', '5'], ['export', 'Export', '⬇'], ['publish', 'Publish', '⬆']];
  function stepList() { return P && P.easy ? STEPS_EASY : STEPS }
  var CATS = ['survival', 'history', 'science', 'mystery', 'nature', 'space', 'true crime', 'disasters', 'animals', 'human body', 'technology', 'other'];

  /* ---------------- tiny DOM helper ---------------- */
  function h(tag, attrs) {
    var el = document.createElement(tag), kids = [].slice.call(arguments, 2);
    for (var k in attrs || {}) {
      var v = attrs[k]; if (v == null || v === false) continue;
      if (k === 'on') for (var ev in v) el.addEventListener(ev, v[ev]);
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k in el && k !== 'list') el[k] = v; else el.setAttribute(k, v);
    }
    kids.forEach(function add(c) { if (c == null || c === false) return; if (Array.isArray(c)) return c.forEach(add); el.appendChild(c.nodeType ? c : document.createTextNode(String(c))) });
    return el;
  }
  function toast(t, ms) { var d = document.getElementById('toast'); d.textContent = t; d.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { d.hidden = true }, ms || 2600) }
  function badge(txt, cls) { return h('span', { className: 'badge ' + (cls || '') }, txt) }
  function msgs(errors, warnings) {
    if (!(errors && errors.length) && !(warnings && warnings.length)) return null;
    return h('ul', { className: 'msgs' }, (errors || []).map(function (e) { return h('li', { className: 'e' }, '✖ ' + e) }), (warnings || []).map(function (w) { return h('li', { className: 'w' }, '⚠ ' + w) }));
  }
  function help(lines) { return h('div', { className: 'step-help' }, h('ol', null, lines.map(function (l) { return h('li', { html: l }) }))) }
  function field(label, el) { return h('div', null, h('label', null, label), el) }
  function copy(text, what) {
    function fb() { var t = h('textarea', { value: text, style: 'position:fixed;left:-9999px' }); document.body.appendChild(t); t.select(); try { document.execCommand('copy') } catch (e) { } t.remove() }
    (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).catch(fb) : Promise.resolve(fb())).then(function () { toast((what || 'Prompt') + ' copied — paste it into the chat (Ctrl+V).') });
  }
  function promptBox(title, text, what, onOpen) { // show + copy
    copy(text, what);
    modal(title, h('div', null, h('div', { className: 'row' }, h('button', { on: { click: function () { copy(text, what) } } }, 'Copy again'), h('span', { className: 'muted small' }, text.length.toLocaleString() + ' characters')), chatLinks(onOpen), h('textarea', { value: text, readOnly: true, style: 'min-height:70vh;margin-top:10px' })));
  }
  function chatLinks(onOpen) {
    return h('div', { className: 'chatlinks' }, [['Open Claude', 'https://claude.ai/new'], ['Open Qwen', 'https://chat.qwen.ai/'], ['Open DeepSeek', 'https://chat.deepseek.com/']].map(function (x) {
      return h('button', { className: 'ghost small', on: { click: function () { if (onOpen) onOpen(x[0].replace('Open ', '')); window.open(x[1], '_blank', 'noopener') } } }, x[0]);
    }));
  }
  function fromClipboard() {
    if (!navigator.clipboard || !navigator.clipboard.readText) return Promise.reject(new Error('no clipboard'));
    return navigator.clipboard.readText().then(function (t) { if (!t || !t.trim()) throw new Error('empty'); return t });
  }
  function pasteFail() { toast('Could not read what you copied. Click in the box, press Ctrl+V, then click Check.', 5000) }
  function modal(title, body, onClose) {
    var m = document.getElementById('modal'); document.getElementById('mtitle').textContent = title;
    var b = document.getElementById('mbody'); b.innerHTML = ''; b.appendChild(body); m.hidden = false; if (window.GUIDE) GUIDE.applyTips(m);
    document.getElementById('mclose').onclick = function () { m.hidden = true; b.innerHTML = ''; if (onClose) onClose() };
  }
  function download(name, blob) { var a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); setTimeout(function () { a.remove() }, 1000) }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] }) }

  /* ---------------- project model ---------------- */
  function newProject(name) {
    return {
      id: 'p' + Date.now().toString(36), name: name || 'New video', created: Date.now(),
      settings: { detail: 'standard', topic: '', category: 'survival', type: 'short', minutes: 2.5, shorts: 2, shortMinutes: 1, mascot: 'both', voice: 'male', sky: 'auto', style: 'facet', refChannel: '' },
      research: '', styleRef: '', topicAnswer: '', scriptRaw: '', title: '', voiceStyle: '', sources: '',
      cuts: [], plan: null, planRaw: '', assets: {}, assetInfo: {}, assetTickets: [], shots: {}, shotTickets: {},
      ptsAsset: 'auto', ptsShot: 4, claudeShots: false
    };
  }
  function syncCuts() {
    var s = P.settings, want = [];
    if (!s.style) s.style = 'paper';            // projects made before the Low-Poly style existed stay Dark Paper
    if (s.type === 'long') {
      want.push({ id: 'long', label: 'Long video', prefix: 'L', minutes: +s.minutes, aspect: s.longAspect || '16:9' });
      for (var i = 1; i <= (+s.shorts || 0); i++) want.push({ id: 'short' + i, label: 'Short ' + i, prefix: 'ABCDEFG'[i - 1], minutes: +s.shortMinutes, aspect: '9:16' });
    } else want.push({ id: 'main', label: 'Main video', prefix: 'M', minutes: +s.minutes, aspect: '9:16' });
    var old = {}; (P.cuts || []).forEach(function (c) { old[c.id] = c });
    P.cuts = want.map(function (w) { return Object.assign(old[w.id] || { text: '', words: [], lines: [], duration: 0 }, w) });
    if (!CUT || !P.cuts.some(function (c) { return c.id === CUT })) CUT = P.cuts[0].id;
  }
  function cutById(id) { return P.cuts.filter(function (c) { return c.id === id })[0] }
  var saveT = null;
  function save(now) { clearTimeout(saveT); saveT = setTimeout(function () { libSync(P); DB.put(P).then(refreshProjects) }, now ? 0 : 400) }
  function styleOf() { return (P && P.settings && P.settings.style) || 'paper' }
  function stagePage() { var s = styleOf(); return s === 'facet' ? 'stage-facet.html' : s === 'lowpoly' ? 'stage-lp.html' : 'stage.html' }
  function sky() { return P.settings.sky !== 'auto' ? P.settings.sky : ((P.plan && P.plan.sky) || 'night') }

  /* ---------------- status per step ---------------- */
  function done(step) {
    if (!P) return false;
    switch (step) {
      case 'start': return P.cuts.every(function (c) { return c.lines && c.lines.length });
      case 'project': return !!P.settings.topic;
      case 'topic': return !!P.settings.topic;
      case 'script': return P.cuts.every(function (c) { return c.text });
      case 'voice': return P.cuts.every(function (c) { return c.lines && c.lines.length });
      case 'plan': return !!P.plan;
      case 'assets': return !!P.plan && P.plan.assets.every(function (a) { return P.assets[a.name] && P.assets[a.name].status === 'approved' });
      case 'shots': return !!P.plan && P.cuts.every(function (c) { return (P.plan.cuts[c.id] || []).every(function (s) { var x = (P.shots[c.id] || {})[s.id]; return x && x.status === 'approved' }) });
      default: return false;
    }
  }
  function renderNav() {
    var nav = document.getElementById('steps'); nav.innerHTML = '';
    stepList().forEach(function (s, i) {
      var tipT = navTip(s[0]);
      nav.appendChild(h('a', { className: (STEP === s[0] ? 'on ' : '') + (done(s[0]) ? 'done' : ''), 'data-tip': tipT[0], 'data-next': tipT[1], on: { click: function () { go(s[0]) } } }, h('span', { className: 'n' }, done(s[0]) ? '✓' : (s[2] || i + 1)), h('span', { className: 't' }, s[1])));
    });
  }
  var NAVTIP = { project: 'Name, video type, length, style, mascot and voice.', topic: 'Find a topic from what is trending.', script: 'Claude researches and writes the script.', voice: 'Upload the audio and time every word.',
    start: 'Pick the style and add your audio. The app times every word.', plan: 'Claude plans every character, place and shot from your words.', assets: 'Free chats build the characters, places and props, one group per chat.',
    shots: 'Claude Opus sets the camera, light and moves for every line.', watch: 'Watch it with sound and fix any bad shot.', export: 'Render the final MP4.', publish: 'Thumbnail, title, description and tags.' };
  var NEEDS = { plan: ['start', 'voice'], assets: ['plan'], shots: ['assets'], watch: ['plan'], export: ['plan'] };
  function navTip(step) {
    var what = NAVTIP[step] || '', nx = '';
    if (done(step)) nx = '✓ Done.';
    else if (P && P.easy && easyNext().step === step) nx = '→ This is your next step.';
    else if (P && NEEDS[step]) { var miss = NEEDS[step].filter(function (k) { return stepList().some(function (x) { return x[0] === k }) && !done(k) })[0]; if (miss) nx = 'Finish "' + stepList().filter(function (x) { return x[0] === miss })[0][1] + '" first.' }
    return [what, nx];
  }
  function go(step) { if (PLAYER && step !== 'watch') { PLAYER.remove(); PLAYER = null } STEP = step; render() }
  function render() {
    renderNav(); $main.innerHTML = '';
    if (!P) { renderSide(); $main.appendChild(welcome()); return }
    if (P.easy && !{ start: 1, plan: 1, assets: 1, shots: 1, watch: 1, export: 1, publish: 1 }[STEP]) STEP = 'start';
    var bn = easyBanner(); bn.classList.add('only-narrow'); $main.appendChild(bn);
    renderSide();
    var fn = { start: vEasyStart, project: vProject, topic: vTopic, script: vScript, voice: vVoice, plan: vPlan, assets: vAssets, shots: vShots, watch: vWatch, export: vExport, publish: vPublish }[STEP];
    $main.appendChild(fn());
    afterRender();
  }
  function afterRender() {
    if (!window.GUIDE) return;
    GUIDE.applyTips(document.body);
    if (P) { var n = easyNext(); if (n.step === STEP && GUIDE.point(n.target, false) && GUIDE.coach) GUIDE.coach(n.target, n.short || n.text); else if (GUIDE.coach) GUIDE.coach(null) }
  }
  function welcome() {
    var steps = [['Project', 'Pick the topic, short or long video, length, mascot and voice.'], ['Topic', 'Optional: load what is trending and let Claude suggest 10 ideas.'], ['Script', 'Claude researches and writes a human, TTS-ready script for every cut.'],
      ['Voice & timing', 'Make the voice free in Google AI Studio, upload it; the app times every word.'], ['Plan', 'Claude (or any chat) plans every asset and every shot as JSON.'],
      ['Assets', 'One ticket per chat, many chats at once (Qwen, DeepSeek, free Claude). The app checks every answer.'], ['Shots', 'Fill-in forms for camera, focus, light, moves and sound — synced to the spoken words.'],
      ['Watch & fix', 'Play it with audio + captions. Click a bad shot, copy the fix prompt, paste the answer.'], ['Export', 'Frame-perfect MP4 at 1080 × 1920 (or 1920 × 1080).'], ['Publish', 'Thumbnail, title, description, tags and chapters.']];
    return h('div', null, h('h1', null, 'Welcome to Paper Cinema Studio'),
      h('p', { className: 'lead' }, 'Make narrated YouTube videos in a low-poly paper figurine style (Facet), filmed like a movie — all free. AI chats do the writing and building; this app keeps everything consistent, checks it, and renders the video.'),
      h('div', { className: 'row' }, h('button', { className: 'ok', on: { click: function () { document.getElementById('easyBtn').click() } } }, '⚡ Easy mode (audio in, video out)'), h('button', { className: 'ghost', on: { click: function () { document.getElementById('newBtn').click() } } }, '+ Full control'), h('button', { className: 'ghost', on: { click: function () { document.getElementById('demoBtn').click() } } }, 'See the demo first')),
      h('div', { className: 'card', style: 'margin-top:16px' }, h('h3', null, 'How it works'), h('table', null, steps.map(function (x, i) { return h('tr', null, h('td', { style: 'width:28px' }, h('span', { className: 'badge' }, i + 1)), h('td', { style: 'width:130px' }, h('b', null, x[0])), h('td', { className: 'muted' }, x[1])) }))),
      h('p', { className: 'muted small' }, 'Everything is saved in this browser. Use Export → Export project to back up.'));
  }
  /* =================================================================
     ASSET LIBRARY: every approved asset is kept per art style, forever
     ================================================================= */
  var LIB = [];
  function hash(s) { var x = 5381; for (var i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36) }
  function loadLib() { return DB.libAll().then(function (l) { LIB = l || []; return LIB }).catch(function () { LIB = []; return LIB }) }
  function libItem(p, style, a, x) {
    return { key: style + ':' + a.name + ':' + hash(x.code), style: style, name: a.name, kind: a.kind, size: a.size, look: a.look || '', parts: a.parts || [], moves: a.moves || [], spots: a.spots || [], holdable: !!a.holdable, difficulty: a.difficulty,
      info: (p.assetInfo || {})[a.name] || null, code: x.code, from: p.name, project: p.id, saved: Date.now() };
  }
  function libSync(p) {
    if (!p || !p.plan) return; var st = (p.settings && p.settings.style) || 'paper';
    p.plan.assets.forEach(function (a) {
      var x = p.assets[a.name]; if (!x || x.status !== 'approved' || !x.code || x.reused) return;
      var it = libItem(p, st, a, x); if (x.lib === it.key) return; x.lib = it.key;
      DB.libPut(it).then(function () { if (!LIB.some(function (l) { return l.key === it.key })) LIB.push(it) });
    });
  }
  function libBackfill() {
    return DB.list().then(function (ps) {
      var have = {}, jobs = []; LIB.forEach(function (l) { have[l.key] = 1 });
      ps.forEach(function (p) {
        if (!p.plan) return; var st = (p.settings && p.settings.style) || 'paper';
        p.plan.assets.forEach(function (a) {
          var x = (p.assets || {})[a.name]; if (!x || x.status !== 'approved' || !x.code || x.reused) return;
          var it = libItem(p, st, a, x); it.saved = p.updated || p.created || Date.now();
          if (!have[it.key]) { have[it.key] = 1; LIB.push(it); jobs.push(DB.libPut(it)) }
        });
      });
      return Promise.all(jobs);
    }).catch(function () { });
  }
  function libFor(style) {
    var by = {}; LIB.filter(function (l) { return l.style === style }).forEach(function (l) { if (!by[l.name] || by[l.name].saved < l.saved) by[l.name] = l });
    return Object.keys(by).map(function (k) { return by[k] });
  }
  function wordsOf(t) { return String(t || '').toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 2 }) }
  function libIndex() {
    var L = libFor(styleOf()); if (!L.length) return '';
    var text = {}; P.cuts.forEach(function (c) { wordsOf(c.text).forEach(function (w) { text[w] = 1 }) });
    L.forEach(function (l) { l._score = wordsOf(l.name + ' ' + l.look).filter(function (w) { return text[w] }).length + (l.kind === 'set' ? .5 : 0) });
    L.sort(function (a, b) { return b._score - a._score || b.saved - a.saved });
    return L.slice(0, 60).map(function (l) {
      return '- ' + l.name + ' (' + l.kind + (l.size ? ', ' + l.size + (l.kind === 'set' ? ' wide' : ' tall') : '') + ')' + (l.spots && l.spots.length ? ' spots: ' + l.spots.join(', ') : '') +
        (l.parts && l.parts.length && l.kind !== 'set' ? ' parts: ' + l.parts.join(', ') : '') + (l.holdable ? ' holdable' : '') + ' — ' + String(l.look).slice(0, 110);
    }).join('\n');
  }
  function libFind(name) { return libFor(styleOf()).filter(function (l) { return l.name === name })[0] }
  function libSimilar(a) {
    var an = wordsOf(a.name), al = wordsOf(a.look);
    return libFor(styleOf()).filter(function (l) { return l.kind === a.kind && l.name !== a.name }).map(function (l) {
      var ln = wordsOf(l.name), ll = wordsOf(l.look);
      return { l: l, s: an.filter(function (w) { return ln.indexOf(w) >= 0 }).length * 2 + al.filter(function (w) { return ll.indexOf(w) >= 0 }).length * .25 };
    }).filter(function (x) { return x.s >= 2 }).sort(function (a, b) { return b.s - a.s }).slice(0, 2).map(function (x) { return x.l });
  }
  function useLib(a, l) {
    var code = l.name === a.name ? l.code : l.code.replace(/KIT\.asset\s*\(\s*(['"`])[^'"`]+\1/, "KIT.asset('" + a.name + "'");
    P.assets[a.name] = { code: code, versions: [], status: 'approved', reused: true, from: l.from };
    a.reuse = true; a.size = l.size || a.size; if (l.spots && l.spots.length) a.spots = l.spots; a.parts = l.parts || a.parts; a.moves = l.moves || a.moves; a.holdable = l.holdable; a.look = l.look || a.look;
    if (l.info) P.assetInfo[a.name] = l.info;
  }
  function applyReuse(assets, warn) {
    assets.forEach(function (a) {
      if (!a.reuse) return; var l = libFind(a.name);
      if (l) useLib(a, l); else { a.reuse = false; if (a.kind === 'set' && !(a.spots && a.spots.length)) a.spots = ['center']; if (warn) warn('"' + a.name + '" is not in the library, so it will be built new.') }
    });
  }
  function libraryModal() {
    var styles = (TPL.styleList || []).map(function (x) { return x.id }), cur = P ? styleOf() : styles[0], q = '';
    var body = h('div'), list = h('div', { className: 'grid', style: 'margin-top:10px' }), head = h('div', { className: 'row' });
    function draw() {
      head.innerHTML = '';
      styles.forEach(function (sid) { var n = libFor(sid).length; head.appendChild(h('button', { className: sid === cur ? 'small' : 'ghost small', on: { click: function () { cur = sid; draw() } } }, ((TPL.styleList || []).filter(function (x) { return x.id === sid })[0] || { name: sid }).name + ' (' + n + ')')) });
      head.appendChild(h('input', { placeholder: 'Search…', value: q, style: 'flex:1;min-width:140px', on: { input: function () { q = this.value.toLowerCase(); drawList() } } }));
      head.appendChild(h('button', { className: 'ghost small', on: { click: function () { download('asset-library-' + new Date().toISOString().slice(0, 10) + '.json', new Blob([JSON.stringify(LIB)], { type: 'application/json' })); toast('Library backup saved.') } } }, 'Download backup'));
      var fi = h('input', { type: 'file', accept: '.json', hidden: true, on: { change: function () { var f = this.files[0]; if (!f) return; f.text().then(function (t) { var a = JSON.parse(t); return Promise.all(a.map(function (it) { return DB.libPut(it) })) }).then(loadLib).then(function () { toast('Library restored.'); draw() }).catch(function (e) { toast('Could not read that file: ' + e.message, 5000) }) } } });
      head.appendChild(h('button', { className: 'ghost small', on: { click: function () { fi.click() } } }, 'Restore backup')); head.appendChild(fi);
      drawList();
    }
    function drawList() {
      list.innerHTML = '';
      var L = libFor(cur).filter(function (l) { return !q || (l.name + ' ' + l.look + ' ' + l.from).toLowerCase().indexOf(q) >= 0 }).sort(function (a, b) { return a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name) });
      if (!L.length) list.appendChild(h('p', { className: 'muted' }, 'Nothing here yet. Every asset you approve in this style is saved here automatically and offered again in your next plans.'));
      L.forEach(function (l) {
        list.appendChild(h('div', { className: 'card', style: 'margin:0' }, h('div', { className: 'row' }, h('b', null, l.name), badge(l.kind)),
          h('div', { className: 'muted small', style: 'margin:4px 0' }, String(l.look).slice(0, 140)),
          h('div', { className: 'small muted' }, 'from "' + l.from + '" · ' + new Date(l.saved).toLocaleDateString()),
          P && cur === styleOf() ? h('div', { className: 'row', style: 'margin-top:6px' }, h('button', { className: 'ghost small', on: { click: function () { var box = h('div', { style: 'height:100%' }), codes = {}; codes[l.name] = l.code; modal('Library: ' + l.name + ' (drag to turn)', box); stage({ mode: 'preview', sky: sky(), assets: codes, name: l.name }, '__never', box).catch(function () { }) } } }, 'Preview'),
            h('button', { className: 'ghost small', 'data-tip': 'Make this library asset look better. The new version is saved in the library; the old one is kept as a backup.', on: { click: function () { improveLib(l) } } }, '✨ Improve')) : null));
      });
    }
    body.appendChild(h('p', { className: 'muted small', style: 'margin-top:0' }, 'Every approved asset from every video, kept per art style. Deleting a video never deletes these. The planner is told about them, so it reuses them instead of making new ones.'));
    body.appendChild(head); body.appendChild(list); draw();
    modal('Asset library', body);
  }

  function improveLib(l) {
    var wish = h('input', { placeholder: 'What should be better? (optional) e.g. "older face", "more detail on the coat"', style: 'width:100%' }), ta = h('textarea', { placeholder: 'Paste the improved KIT.asset(…) here', style: 'min-height:90px;margin-top:8px' }), out = h('div');
    modal('Improve library asset: ' + l.name, h('div', null,
      h('ol', { className: 'small' }, h('li', null, 'Type what should be better (or leave it empty), then click Copy improve prompt.'), h('li', null, 'Paste it into a chat (Claude or a free one) and copy its answer.'), h('li', null, 'Click Paste & save. The app checks it and saves it as the newest version.')),
      wish, h('div', { className: 'row', style: 'margin-top:8px' },
        h('button', { on: { click: function () { copy(TPL.assetImprove(P, l, l.code, wish.value.trim()), 'Improve prompt') } } }, 'Copy improve prompt'),
        h('button', { className: 'ghost', on: { click: function () { fromClipboard().then(function (t) { ta.value = t; saveIt() }).catch(pasteFail) } } }, '📋 Paste & save')), chatLinks(), ta,
      h('button', { className: 'blue small', style: 'margin-top:6px', on: { click: saveIt } }, 'Save'), out));
    function saveIt() {
      var r = PLAN.blocks(ta.value, 'asset'), code = r.blocks[l.name] || (r.order[0] && r.blocks[r.order[0]] ? r.blocks[r.order[0]].replace(/KIT\.asset\s*\(\s*(['"`])[^'"`]+\1/, "KIT.asset('" + l.name + "'") : null);
      if (!code) { out.innerHTML = ''; out.appendChild(msgs(['No KIT.asset(\'' + l.name + '\', …) found.'])); return }
      out.textContent = 'Checking…'; var codes = {}; codes[l.name] = code;
      stage({ mode: 'check-assets', sky: sky(), assets: codes, expect: [{ name: l.name, kind: l.kind, size: l.size, spots: l.spots, parts: l.parts, holdable: l.holdable }] }, 'check-assets').then(function (m) {
        var q = m.results[l.name] || { ok: false, errors: ['not checked'] };
        if (!q.ok) { out.innerHTML = ''; out.appendChild(msgs(q.errors, q.warnings)); return }
        var it = Object.assign({}, l, { code: code, key: l.style + ':' + l.name + ':' + hash(code), saved: Date.now(), from: (l.from || '') + ' (improved)' });
        delete it._score;
        return DB.libPut(it).then(loadLib).then(function () { out.textContent = '✅ Saved. New videos will use this version.'; toast('Library asset improved.') });
      }).catch(function (e) { out.textContent = 'Error: ' + e.message });
    }
  }

  /* =================================================================
     LEVEL UP: add assets and richer shots on top of the baseline
     ================================================================= */
  function levelUpCard() {
    if (!P.plan) return null;
    var size = h('select', null, h('option', { value: 'small' }, 'A little more (3–6 new assets)'), h('option', { value: 'big' }, 'A lot more (6–12 new assets)'));
    var wish = h('input', { placeholder: 'Optional: what you want more of (e.g. "more action in the rescue", "show the town")', style: 'flex:1;min-width:240px' });
    var ta = h('textarea', { placeholder: 'Paste the level-up answer here…', style: 'min-height:70px' }), out = h('div');
    function apply(text) {
      var r; try { r = PLAN.json(text) } catch (e) { out.innerHTML = ''; out.appendChild(msgs(['Could not read JSON: ' + e.message])); return }
      var have = {}, errs = [], added = 0, upg = 0; P.plan.assets.forEach(function (a) { have[a.name] = 1 });
      (Array.isArray(r.assets) ? r.assets : []).forEach(function (a) {
        if (!a || !a.name || !/^[a-z0-9][a-z0-9-]*$/.test(a.name)) return errs.push('skipped an asset with a bad name');
        if (have[a.name] || ['kato', 'nia', 'void'].indexOf(a.name) >= 0) return errs.push('"' + a.name + '" already exists, skipped');
        if (['character', 'creature', 'prop', 'set', 'fx'].indexOf(a.kind) < 0) return errs.push('"' + a.name + '" has an unknown kind, skipped');
        a.difficulty = Math.max(1, Math.min(3, +a.difficulty || 2)); a.parts = Array.isArray(a.parts) ? a.parts : []; a.moves = Array.isArray(a.moves) ? a.moves : []; a.reuse = !!a.reuse;
        if (a.kind === 'set' && !(Array.isArray(a.spots) && a.spots.length)) a.spots = ['center'];
        have[a.name] = 1; P.plan.assets.push(a); applyReuse([a]); if (!P.assets[a.name]) P.assets[a.name] = { code: '', versions: [], status: 'todo' }; added++;
      });
      var S = r.shots && typeof r.shots === 'object' ? r.shots : {};
      Object.keys(S).forEach(function (id) {
        P.cuts.forEach(function (c) {
          var s = (P.plan.cuts[c.id] || []).filter(function (x) { return x.id === id })[0]; if (!s) return;
          s.show = s.show + ' LEVEL UP: ' + S[id]; upg++;
          var x = (P.shots[c.id] || {})[id];
          if (x && x.code) { x.status = 'error'; x.check = { errors: ['LEVEL UP — add this to the shot: ' + S[id]], warnings: [] } }
        });
      });
      var fresh = P.plan.assets.filter(function (a) { var x = P.assets[a.name]; return x && !x.reused && x.status === 'todo' && !P.assetTickets.some(function (t) { return t.names.indexOf(a.name) >= 0 }) });
      PLAN.batch(fresh).forEach(function (g) { P.assetTickets.push({ id: 'a' + P.assetTickets.length + Date.now().toString(36), n: P.assetTickets.length + 1, names: g.names, status: 'waiting', answer: '', label: g.label || null }) });
      save(true); rerender();
      toast('Level up added: ' + added + ' new assets, ' + upg + ' shots to improve.' + (errs.length ? ' (' + errs.length + ' skipped)' : ''), 5000);
      if (P.easy) go(easyNext().step);
    }
    return h('div', { className: 'card' }, h('h3', null, '⬆ Level up (optional)'),
      h('p', { className: 'muted small', style: 'margin:0 0 6px' }, 'Not happy with the baseline? Claude suggests extra assets and richer shots. Only the new parts cost chats; everything made so far stays.'),
      h('div', { className: 'row' }, size, wish),
      h('div', { className: 'row', style: 'margin-top:8px' }, h('button', { on: { click: function () { promptBox('Level-up prompt', TPL.levelUp(P, libIndex(), size.value, wish.value.trim()), 'Level-up prompt') } } }, 'Copy level-up prompt'),
        h('button', { className: 'ghost', on: { click: function () { fromClipboard().then(function (t) { ta.value = t; apply(t) }).catch(pasteFail) } } }, '📋 Paste & add')),
      h('details', { style: 'margin-top:8px' }, h('summary', { className: 'muted small' }, 'Or paste by hand'), ta, h('button', { className: 'blue small', style: 'margin-top:6px', on: { click: function () { apply(ta.value) } } }, 'Add')), out);
  }

  /* =================================================================
     PUBLISH PACKAGE (written by the planner)
     ================================================================= */
  function copyBtn(text, what) { return h('button', { className: 'ghost small', on: { click: function () { copy(text, what) } } }, 'Copy') }
  function pubRow(label, text, what) { if (!text) return null; return h('div', { style: 'border-top:1px solid var(--line);padding:8px 0' }, h('div', { className: 'row' }, h('b', null, label), h('span', { className: 'grow' }), copyBtn(text, what || label)), h('div', { style: 'white-space:pre-wrap;margin-top:4px' }, text)) }
  function publishPackage(c, useThumb) {
    var pb = P.plan && P.plan.publish; if (!pb) return null;
    var yt = pb.youtube || {}, tt = pb.tiktok || {}, list = function (a) { return (a || []).join(', ') };
    var times = PLAN.shotTimes(c, P.plan.cuts[c.id] || []);
    return h('div', null,
      h('div', { className: 'card' }, h('h3', null, 'Titles (best first)'),
        (pb.titles || []).map(function (t, i) {
          return h('div', { className: 'row', style: 'border-top:1px solid var(--line);padding:6px 0' }, badge(i === 0 ? '★ best' : '#' + (i + 1), i === 0 ? 'b-ok' : ''), h('span', { style: 'flex:1;min-width:200px' }, t.text),
            h('span', { className: 'muted small' }, t.text.length + ' ch' + (t.text.length > 60 ? ' ⚠ long' : '')), copyBtn(t.text, 'Title'), t.why ? h('div', { className: 'muted small', style: 'flex-basis:100%' }, t.why) : null);
        })),
      (pb.thumbnails || []).length ? h('div', { className: 'card' }, h('h3', null, 'Thumbnail options'),
        pb.thumbnails.map(function (t, i) {
          var at = times.filter(function (x) { return x.id === t.shot })[0], sec = at ? at.from + (at.to - at.from) * Math.max(0, Math.min(1, t.at == null ? .5 : +t.at)) : null;
          return h('div', { style: 'border-top:1px solid var(--line);padding:8px 0' }, h('div', { className: 'row' }, h('b', null, 'Option ' + (i + 1) + (t.text ? ': "' + t.text + '"' : '')), t.shot ? badge('frame: ' + t.shot) : null, h('span', { className: 'grow' }),
            sec != null ? h('button', { className: 'small', on: { click: function () { useThumb(t.text || '', sec) } } }, 'Make this thumbnail') : null, t.prompt ? h('button', { className: 'ghost small', on: { click: function () { copy(t.prompt, 'Image prompt') } } }, 'Copy image prompt') : null),
            t.why ? h('div', { className: 'muted small' }, t.why) : null, t.prompt ? h('div', { className: 'small', style: 'margin-top:4px;color:#d9cfbc' }, t.prompt) : null);
        })) : null,
      h('div', { className: 'card g2' },
        h('div', null, h('h3', null, 'YouTube'), pubRow('Description', yt.description), pubRow('Tags', list(yt.tags)), pubRow('Hashtags', (yt.hashtags || []).join(' ')), pubRow('Pinned comment', yt.pinned_comment), pubRow('Category', yt.category)),
        h('div', null, h('h3', null, 'TikTok'), pubRow('Caption', [tt.caption, (tt.hashtags || []).join(' ')].filter(Boolean).join('\n'), 'Caption'), pubRow('Cover text', tt.cover_text))),
      h('div', { className: 'card' }, h('h3', null, 'Recommendations'),
        pb.hook_check ? h('p', null, h('b', null, 'Hook: '), pb.hook_check) : null, pb.post_time ? h('p', null, h('b', null, 'Best time to post: '), pb.post_time) : null,
        (pb.recommendations || []).length ? h('ul', null, pb.recommendations.map(function (r) { return h('li', null, r) })) : null,
        (pb.series || []).length ? h('div', null, h('b', null, 'Next videos in this series:'), h('ul', null, pb.series.map(function (r) { return h('li', null, r) }))) : null));
  }

  /* =================================================================
     EASY MODE: audio in, style, then the app tells you the next thing to do
     ================================================================= */
  /* every chat in this video, numbered once: assets first, then shots (Chat 1, Chat 2 …) */
  function allTickets() {
    if (!P || !P.plan) return [];
    var out = (P.assetTickets || []).map(function (t) { return { t: t, kind: 'asset' } });
    P.cuts.forEach(function (c) { (P.shotTickets[c.id] || []).forEach(function (t) { out.push({ t: t, kind: 'shot', cid: c.id }) }) });
    return out;
  }
  function chatNo(t) { var L = allTickets(); for (var i = 0; i < L.length; i++) if (L[i].t === t) return i + 1; return t.n }
  function chatTag(t) { return h('span', { className: 'chatno', 'data-tip': 'Chat number. Name the chat in the AI site the same way ("Chat ' + chatNo(t) + '") so you can find it again.' }, 'Chat ' + chatNo(t)) }
  function ticketDone(x) { var bag = x.kind === 'shot' ? (P.shots[x.cid] || {}) : P.assets, ids = x.t.ids || x.t.names; return ids.every(function (n) { return (bag[n] || {}).status === 'approved' }) }
  function ticketBad(x) { var bag = x.kind === 'shot' ? (P.shots[x.cid] || {}) : P.assets, ids = x.t.ids || x.t.names; return ids.some(function (n) { return (bag[n] || {}).status === 'error' }) }
  function easyNext() {
    var c0 = P.cuts[0], startStep = P.easy ? 'start' : 'voice';
    if (!P.cuts.every(function (c) { return c.lines && c.lines.length })) {
      var has = c0.hasAudio || easyFile;
      return { step: startStep, text: has ? 'Your audio is ready. Paste the script if you have it, then click Start.' : 'Pick a style, then drop your audio file on the box (or click Upload audio).', short: has ? 'Click Start' : 'Add your audio here', target: { text: has ? 'Start' : 'Upload audio' } };
    }
    if (!P.plan) {
      if (planCheck && planCheck.errors && planCheck.errors.length) return { step: 'plan', text: 'The plan has problems. Click Copy fix prompt, paste it into the SAME chat, copy the new answer, then click Paste & read.', short: 'Copy this into the same chat', target: { text: 'Copy fix prompt' } };
      return PLANCOPIED ? { step: 'plan', text: 'Paste the prompt into Claude (Open Claude, then Ctrl+V). When it finishes, copy its whole answer and click Paste & read.', short: 'Then click here', target: { text: '📋 Paste & read' } }
        : { step: 'plan', text: 'Click Copy plan prompt. The AI will plan every character, place and shot from your words.', short: 'Start here', target: { text: 'Copy plan prompt' } };
    }
    var gaps = visibleGaps();
    if (gaps.length && !P.plan.gapsSeen) return { step: 'plan', text: gaps.length + (gaps.length === 1 ? ' thing the story names is' : ' things the story names are') + ' not in the plan (e.g. "' + gaps[0].word + '"). Click Add all so they appear in the video.', short: 'Add the missing things', target: { text: 'Add all' } };
    var A = P.plan.assets, aOk = A.filter(function (a) { return (P.assets[a.name] || {}).status === 'approved' }).length;
    if (aOk < A.length) {
      var T = P.assetTickets, t = T.filter(function (t) { return t.names.some(function (n) { return (P.assets[n] || {}).status !== 'approved' }) })[0];
      var bad = t && t.names.some(function (n) { return (P.assets[n] || {}).status === 'error' });
      var tx = !t ? 'Copy prompt' : t.status === 'waiting' ? 'Copy prompt' : bad ? 'Copy fix prompt' : '📋 Paste & check', no = t ? chatNo(t) : 0;
      var say = !t ? '' : t.status === 'waiting' ? 'Copy Chat ' + no + ' and paste it into a NEW free chat (Qwen or DeepSeek). You can start the other chats at the same time.'
        : bad ? 'Chat ' + no + ' needs a fix: Copy fix prompt, paste it into the SAME chat, copy the answer, then Paste & check.'
        : 'When Chat ' + no + ' finishes, copy its whole answer and click Paste & check.';
      return { step: 'assets', text: aOk + ' of ' + A.length + ' assets done. ' + say, short: t ? (t.status === 'waiting' ? 'Chat ' + no + ': copy, paste in a new chat' : bad ? 'Chat ' + no + ': send the fix' : 'Chat ' + no + ': paste the answer') : '', target: t ? { sel: '#atk-' + t.n, text: tx } : null };
    }
    var open = P.cuts.filter(function (c) { return (P.plan.cuts[c.id] || []).some(function (s) { return ((P.shots[c.id] || {})[s.id] || {}).status !== 'approved' }) })[0];
    if (open) {
      var ST = P.shotTickets[open.id] || [], S = P.shots[open.id] || {}, st = ST.filter(function (t) { return t.ids.some(function (id) { return (S[id] || {}).status !== 'approved' }) })[0];
      var sbad = st && st.ids.some(function (id) { return (S[id] || {}).status === 'error' }), sn = st ? chatNo(st) : 0;
      var stx = !st || st.status === 'waiting' ? 'Copy prompt' : sbad ? 'Copy fix prompt' : '📋 Paste & check';
      return { step: 'shots', text: !st || st.status === 'waiting' ? 'Copy Chat ' + sn + ' (the shots) and paste it into one Claude Opus chat.' : sbad ? 'Some shots need a fix: Copy fix prompt, paste it into the SAME chat (Chat ' + sn + '), then Paste & check.' : 'When Chat ' + sn + ' finishes, copy its whole answer and click Paste & check.', short: 'Chat ' + sn + ': ' + (stx === 'Copy prompt' ? 'copy into Claude' : stx === 'Copy fix prompt' ? 'send the fix' : 'paste the answer'), target: st ? { sel: '#stk-' + open.id + '-' + st.n, text: stx } : { text: 'Copy prompt' } };
    }
    if (P.cuts.every(function (c) { return c.exported })) return { step: 'publish', text: 'Video exported! On Publish: pick a title, make the thumbnail, and copy the description, tags and TikTok caption.', short: 'Make the thumbnail', target: { text: 'Make this thumbnail' } };
    if (STEP === 'export') return { step: 'export', text: 'Make the MP4. Keep the tab open while it renders.', short: 'Render the video', target: { text: 'Export video' } };
    return { step: 'watch', text: 'Everything is made. Press Play and watch it. Click a shot or a transition on the timeline to change it. Then Export.', short: 'Press Play', target: { text: '▶ Play' } };
  }
  function easyBanner() {
    var n = easyNext(), on = STEP === n.step;
    return h('div', { className: 'card coach' }, h('div', { className: 'row' }, badge('⚡ What to do now', 'b-warn'), h('span', { className: 'grow' }),
      on && n.target ? h('button', { className: 'small', on: { click: function () { if (!GUIDE.point(n.target, true)) toast('Scroll down: the button is further down the page.') } } }, 'Show me') : null,
      on ? null : h('button', { className: 'small', on: { click: function () { go(n.step); setTimeout(function () { GUIDE.point(easyNext().target, true) }, 80) } } }, 'Take me there →')),
      h('p', { style: 'margin:8px 0 0;font-size:16px' }, n.text));
  }
  /* ---------------- right panel: what to do now, progress, chats, preview ---------------- */
  var SIDEPREV = null, SIDEDYN = null, SIDEBOX = null, SIDECOACH = null, SIDEPREV_SHOWN = null;
  function renderSide() {
    var side = document.getElementById('side'); if (!side) return;
    if (!SIDEDYN) { SIDECOACH = h('div'); SIDEDYN = h('div'); SIDEBOX = h('div'); side.append(SIDECOACH, SIDEBOX, SIDEDYN) }
    SIDEDYN.innerHTML = ''; SIDECOACH.innerHTML = '';
    if (!P) { SIDEBOX.innerHTML = ''; SIDEPREV_SHOWN = null; side.hidden = true; return }
    side.hidden = false;
    var n = easyNext(), on = STEP === n.step;
    SIDECOACH.appendChild(h('div', { className: 'side-card coach' }, h('h4', null, '⚡ What to do now'), h('p', null, n.text),
      h('div', { className: 'row' }, on && n.target ? h('button', { className: 'small', on: { click: function () { if (!GUIDE.point(n.target, true)) toast('The button is further down the page.') } } }, 'Show me') : null,
        on ? null : h('button', { className: 'small', on: { click: function () { go(n.step); setTimeout(function () { GUIDE.point(easyNext().target, true) }, 80) } } }, 'Take me there →'))));
    // progress
    var prog = h('div', { className: 'side-card' }, h('h4', null, 'Progress'));
    function bar(label, a, b) { prog.append(h('div', { className: 'row small' }, h('span', null, label), h('span', { className: 'grow' }), h('span', { className: 'muted' }, a + ' / ' + b)), h('div', { className: 'mini' }, h('i', { style: 'width:' + (b ? Math.round(a / b * 100) : 0) + '%' }))) }
    bar('Audio timed', P.cuts.filter(function (c) { return c.lines && c.lines.length }).length, P.cuts.length);
    if (P.plan) {
      var A = P.plan.assets; bar('Assets', A.filter(function (a) { return (P.assets[a.name] || {}).status === 'approved' }).length, A.length);
      var tot = 0, ok = 0; P.cuts.forEach(function (c) { (P.plan.cuts[c.id] || []).forEach(function (s) { tot++; if (((P.shots[c.id] || {})[s.id] || {}).status === 'approved') ok++ }) }); bar('Shots', ok, tot);
    } else prog.appendChild(h('div', { className: 'muted small' }, 'Plan: not made yet'));
    SIDEDYN.appendChild(prog);
    // chats
    var L = allTickets();
    if (L.length) {
      SIDEDYN.appendChild(h('div', { className: 'side-card side-chats' }, h('h4', null, 'Chats (' + L.length + ')'),
        L.map(function (x, i) {
          var ids = x.t.ids || x.t.names, done = ticketDone(x), bad = ticketBad(x), c = x.t.chat || {};
          return h('div', { className: 'r' }, h('span', { className: 'dot ' + (done ? 'ok' : bad ? 'bad' : x.t.status !== 'waiting' ? 'busy' : '') }), h('b', null, 'Chat ' + (i + 1)),
            h('span', { className: 'muted', style: 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', title: ids.join(', ') }, (x.kind === 'shot' ? 'shots ' + ids[0] + (ids.length > 1 ? '–' + ids[ids.length - 1] : '') : ids.join(', '))),
            c.link ? h('button', { className: 'ghost small', 'data-tip': 'Opens the chat that makes this group.', on: { click: function () { window.open(c.link, '_blank', 'noopener') } } }, '↗') : null,
            h('button', { className: 'ghost small', 'data-tip': 'Goes to this chat\'s card.', on: { click: function () { if (x.cid) CUT = x.cid; go(x.kind === 'shot' ? 'shots' : 'assets'); setTimeout(function () { var el = document.getElementById(x.kind === 'shot' ? 'stk-' + x.cid + '-' + x.t.n : 'atk-' + x.t.n); if (el) el.scrollIntoView({ block: 'start' }) }, 60) } } }, 'Go'));
        })));
    }
    // preview (kept alive between renders, so it does not reload)
    var want = SIDEPREV && P.assets[SIDEPREV] && P.assets[SIDEPREV].code ? SIDEPREV + '|' + P.assets[SIDEPREV].code.length : null;
    if (want !== SIDEPREV_SHOWN) {
      SIDEPREV_SHOWN = want; SIDEBOX.innerHTML = '';
      var card = h('div', { className: 'side-card' }, h('div', { className: 'row' }, h('h4', { style: 'margin:0' }, 'Preview' + (want ? ': ' + SIDEPREV : '')), h('span', { className: 'grow' }), want ? h('button', { className: 'ghost small', on: { click: function () { previewModal(SIDEPREV) } } }, '⤢ Bigger') : null,
        want ? h('button', { className: 'ghost small', 'data-tip': 'Close the preview.', on: { click: function () { SIDEPREV = null; renderSide() } } }, '✕') : null));
      if (want) side.scrollTop = 0;
      if (want) { var box = h('div', { className: 'side-prev', style: 'margin-top:8px' }); card.appendChild(box); var codes = {}; codes[SIDEPREV] = P.assets[SIDEPREV].code; stage({ mode: 'preview', sky: sky(), assets: codes, name: SIDEPREV }, '__never', box).catch(function () { }) }
      else card.appendChild(h('p', { className: 'muted small', style: 'margin:6px 0 0' }, 'Click any asset name (a chip) to see it here, at any step.'));
      SIDEBOX.appendChild(card);
    }
    if (window.GUIDE) GUIDE.applyTips(side);
  }
  function showAsset(name) { SIDEPREV = name; if (window.innerWidth < 1150) return previewModal(name); renderSide() }
  function assetChip(name) {
    var x = P.assets[name] || {}, st = x.status;
    return h('span', { className: 'chip ' + (st === 'approved' ? 'ok' : st === 'error' ? 'bad' : ''), 'data-tip': x.code ? 'Show "' + name + '" in the preview panel.' : '"' + name + '" is not made yet.', on: { click: function () { if (x.code) showAsset(name); else toast('"' + name + '" is not made yet.') } } }, (st === 'approved' ? '✓ ' : st === 'error' ? '✖ ' : '') + name + (x.reused ? ' ♻' : ''));
  }
  var easyFile = null, easyDur = 0;
  function finishTiming(c, words, text, method, dur) {
    var s = P.settings;
    c.text = text; c.words = words; c.duration = dur; c.lines = TIMING.lines(words); c.timing = method;
    s.minutes = Math.max(.25, Math.round(dur / 6) / 10); s.topic = s.topic || P.name; P.title = P.title || P.name; syncCuts();
    save(true); toast('Done: ' + c.lines.length + ' lines, ' + dur.toFixed(1) + ' s.', 4000); go('plan');
  }
  function heardToWords(heard) { return heard.map(function (w) { return [w[0].replace(/\s+/g, ' '), +(+w[1]).toFixed(3), +Math.max(+w[1] + .05, +w[2]).toFixed(3)] }) }
  function mismatch(c, r, script, onDone) {
    var pct = Math.round((r.matched || 0) * 100), sw = TIMING.words(script).length, hw = (r.heardWords || []).length;
    var body = h('div', null,
      h('p', { style: 'font-size:16px' }, 'Your script and your audio do not match well. Only ' + pct + '% of the script\'s words were heard in the audio.'),
      h('table', null, h('tr', null, h('td', null, 'Words in your script'), h('td', null, sw)), h('tr', null, h('td', null, 'Words heard in the audio'), h('td', null, hw)), h('tr', null, h('td', null, 'Audio length'), h('td', null, r.duration.toFixed(1) + ' s'))),
      h('p', { className: 'muted' }, 'If you keep the script, the captions and scenes will drift away from the voice. Using what the audio says is safer. Spelling may be a little different from your script.'),
      h('div', { className: 'row', style: 'margin-top:12px' },
        hw ? h('button', { className: 'ok', on: { click: function () { document.getElementById('mclose').click(); var w = heardToWords(r.heardWords); onDone(); finishTiming(c, w, w.map(function (x) { return x[0] }).join(' '), 'whisper (audio words)', r.duration) } } }, 'Use what the audio says (recommended)') : null,
        h('button', { className: 'ghost', on: { click: function () { document.getElementById('mclose').click(); onDone(); finishTiming(c, r.words, script, 'whisper (' + pct + '% matched)', r.duration) } } }, 'Keep my script anyway')));
    modal('Script and audio do not match', body, function () { onDone() });
  }
  function vEasyStart() {
    var s = P.settings, c = P.cuts[0], st = h('div', { className: 'muted small', style: 'margin-top:8px' }), btn;
    var fileIn = h('input', { type: 'file', accept: 'audio/*', hidden: true }), info = h('div', { className: 'small', style: 'margin-top:8px' }), player = h('div');
    var script = h('textarea', { value: c.text || '', placeholder: 'Paste your script here (optional). Leave it empty and the app writes the words by listening.', style: 'min-height:140px' }), fit = h('div', { className: 'muted small', style: 'margin-top:6px' });
    var mode = h('select', null, h('option', { value: 'exact' }, 'Exact: listen to the audio (best captions, takes a minute or two)'), h('option', { value: 'fast' }, 'Fast: use the pauses (a few seconds, captions can drift a little)')), modeRow = h('div', { style: 'margin-top:8px' }, h('label', null, 'Timing'), mode);
    function words() { return TIMING.words(script.value).length }
    function updFit() {
      var n = words(); modeRow.hidden = !n;
      if (!n) { fit.textContent = 'No script: the app will listen and write the words (needs the Exact timing).'; return }
      if (!easyDur) { fit.textContent = n + ' words.'; return }
      var wpm = n / (easyDur / 60), ok = wpm > 100 && wpm < 210;
      fit.textContent = n + ' words for ' + easyDur.toFixed(0) + ' s of audio (' + Math.round(wpm) + ' words a minute). ' + (ok ? 'Looks right.' : wpm <= 100 ? '⚠ The script looks too SHORT for this audio. Is it the whole script?' : '⚠ The script looks too LONG for this audio. Is it the right audio?');
      fit.style.color = ok ? '' : 'var(--warn)';
    }
    script.addEventListener('input', updFit);
    function setFile(f) {
      if (!f) return; if (!/^audio\//.test(f.type) && !/\.(mp3|wav|m4a|ogg|aac|flac|webm)$/i.test(f.name)) return toast('That is not an audio file.');
      easyFile = f; var url = URL.createObjectURL(f), au = h('audio', { controls: true, src: url, style: 'width:100%;margin-top:8px' });
      au.addEventListener('loadedmetadata', function () { easyDur = au.duration || 0; info.textContent = '✓ ' + f.name + ' · ' + (easyDur ? Math.floor(easyDur / 60) + ':' + ('0' + Math.round(easyDur % 60)).slice(-2) + ' long' : ''); updFit() });
      info.textContent = '✓ ' + f.name; player.innerHTML = ''; player.appendChild(au); if ($main.firstChild && $main.firstChild.className === 'card') $main.replaceChild(easyBanner(), $main.firstChild); afterRender();
    }
    fileIn.onchange = function () { setFile(fileIn.files[0]) };
    var drop = h('div', { className: 'drop', on: { click: function (e) { if (e.target.tagName !== 'BUTTON') fileIn.click() }, dragover: function (e) { e.preventDefault(); drop.classList.add('over') }, dragleave: function () { drop.classList.remove('over') }, drop: function (e) { e.preventDefault(); drop.classList.remove('over'); setFile(e.dataTransfer.files[0]) } } },
      h('div', null, h('b', null, 'Drop your audio file here')), h('div', { className: 'small', style: 'margin:6px 0 10px' }, 'mp3, wav or m4a'), h('button', { className: 'ghost', on: { click: function () { fileIn.click() } } }, 'Upload audio'), fileIn);
    if (!easyFile && c.hasAudio) info.textContent = '✓ saved audio: ' + (c.audioName || 'audio');
    else if (easyFile) setTimeout(function () { setFile(easyFile) });
    function start() {
      if (!easyFile && !c.hasAudio) { GUIDE.point({ text: 'Upload audio' }, true); return toast('Add your audio first.') }
      var useScript = script.value.trim(), fast = useScript && mode.value === 'fast';
      btn.disabled = true;
      var job = GUIDE.task('Timing your audio', { label: 'Reading the audio…' }), phase = '';
      var STG = { download: 'Step 1 of 2 · ', listen: 'Step 2 of 2 · ' };
      function status(m, p, ph) { m = (STG[ph || phase] || '') + m; st.textContent = m; if (ph && ph !== phase) { phase = ph; job.phase(m) } job.set(p == null ? null : p, m) }
      function fail(e) { st.textContent = 'Error: ' + e.message; job.done('Stopped: ' + e.message, true); btn.disabled = false }
      var blobP = easyFile ? DB.putFile(P.id + ':' + c.id, easyFile).then(function () { c.hasAudio = true; c.audioName = easyFile.name; save(); return easyFile }) : DB.getFile(P.id + ':' + c.id);
      blobP.then(function (blob) {
        if (!blob) throw new Error('No audio found. Upload it again.');
        if (!useScript) return TIMING.transcribe(blob, status).then(function (r) { job.done('Done: ' + r.words.length + ' words heard'); finishTiming(c, r.words, r.text, 'whisper (audio words)', r.duration) });
        return TIMING.run(useScript, blob, status, !fast).then(function (r) {
          if (r.method === 'whisper' && r.matched < .7) { job.done('Check needed: only ' + Math.round(r.matched * 100) + '% matched', true); return mismatch(c, r, useScript, function () { btn.disabled = false }) }
          job.done(r.method === 'whisper' ? 'Done: ' + Math.round(r.matched * 100) + '% of words matched' : 'Done (from pauses)');
          finishTiming(c, r.words, useScript, r.method === 'whisper' ? 'whisper (' + Math.round(r.matched * 100) + '% matched)' : 'pauses', r.duration);
        });
      }).catch(fail);
    }
    btn = h('button', { on: { click: start } }, c.lines && c.lines.length ? 'Start again' : 'Start');
    var styles = TPL.styleList || [];
    var pick = h('div', { className: 'stylepick' }, styles.map(function (x) {
      return h('label', { className: s.style === x.id ? 'on' : '', on: { click: function () { s.style = x.id; try { localStorage.setItem('easyStyle', x.id) } catch (e) { } save(); rerender() } } }, h('b', null, x.name), h('small', null, x.note));
    }));
    function sel(key, opts, cb) { return h('select', { on: { change: function () { s[key] = this.value; if (cb) cb(); syncCuts(); save(); rerender() } } }, opts.map(function (o) { return h('option', { value: o[0], selected: String(s[key]) === String(o[0]) }, o[1]) })) }
    updFit();
    return h('div', null, h('h1', null, 'Start'), h('p', { className: 'lead' }, 'Three things: the style, your audio, and (if you have it) your script. Then click Start.'),
      h('div', { className: 'card' }, h('h3', null, '1. Style'), pick,
        h('div', { className: 'g2', style: 'margin-top:10px' },
          field('Video name', h('input', { value: P.name, on: { input: function () { P.name = this.value; s.topic = this.value; save() } } })),
          field('Detail level', sel('detail', [['standard', 'Standard'], ['lean', 'Lean: fewest chats, reuses the library most'], ['rich', 'Rich: more detail, more chats']])),
          field('Video shape', sel('vshape', [['short', 'Vertical 9:16 (Shorts, TikTok)'], ['long', 'Wide 16:9 (normal YouTube video)']], function () { if (s.vshape === 'long') { s.type = 'long'; s.longAspect = '16:9'; s.shorts = 0 } else s.type = 'short' })))),
      h('div', { className: 'card' }, h('h3', null, '2. Your audio'), drop, info, player),
      h('div', { className: 'card' }, h('h3', null, '3. Your script (optional)'),
        h('p', { className: 'muted small', style: 'margin:0 0 6px' }, 'With a script the captions use your exact spelling, and you can choose Fast timing. Without one, the app listens and writes the words itself.'),
        script, fit, modeRow),
      h('div', { className: 'row' }, btn), st,
      c.lines && c.lines.length ? h('div', { className: 'card', style: 'margin-top:12px' }, badge('✓ ' + c.lines.length + ' lines · ' + c.duration.toFixed(1) + ' s · ' + (c.timing || ''), 'b-ok'), nextBtn('plan', 'Next: Plan →')) : null);
  }
  function rerender() { var y = $main.scrollTop; render(); $main.scrollTop = y }
  function nextBtn(step, label) { return h('div', { className: 'row', style: 'margin-top:18px' }, h('button', { on: { click: function () { go(step) } } }, label || 'Next →')) }

  /* =================================================================
     1) PROJECT
     ================================================================= */
  function vProject() {
    var s = P.settings;
    function sel(key, opts, cb) { return h('select', { on: { change: function () { s[key] = isNaN(+this.value) || this.value === '' ? this.value : +this.value; if (cb) cb(); syncCuts(); save(); rerender() } } }, opts.map(function (o) { var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o; return h('option', { value: v, selected: String(s[key]) === String(v) }, t) })) }
    var mins = s.type === 'long' ? [5, 8, 10, 12, 15] : [1, 1.5, 2, 2.5, 3];
    if (mins.indexOf(+s.minutes) < 0) s.minutes = s.type === 'long' ? 10 : 2.5;
    return h('div', null,
      h('h1', null, 'Project'), h('p', { className: 'lead' }, 'Set up the video. You can change these later.'),
      h('div', { className: 'card g2' },
        field('Project name', h('input', { value: P.name, on: { input: function () { P.name = this.value; save() } } })),
        field('Topic (or pick one in the Topic step)', h('input', { value: s.topic, placeholder: 'e.g. A Hand in the Dark — the cook who survived 60 hours under the sea', on: { input: function () { s.topic = this.value; save() } } })),
        field('Category', sel('category', CATS)),
        field('Video type', sel('type', [['short', 'Short — vertical 9:16'], ['long', 'Long video + shorts made from it']])),
        field(s.type === 'long' ? 'Long video length (minutes)' : 'Length (minutes)', sel('minutes', mins)),
        s.type === 'long' ? field('Long video shape', sel('longAspect', [['16:9', '16:9 landscape (normal YouTube video)'], ['9:16', '9:16 vertical']])) : null,
        s.type === 'long' ? field('How many shorts from it', sel('shorts', [0, 1, 2, 3, 4])) : null,
        s.type === 'long' ? field('Each short (minutes)', sel('shortMinutes', [.75, 1, 1.5, 2, 2.5, 3])) : null,
        field('Visual style', sel('style', (TPL.styleList || []).map(function (x) { return [x.id, x.name + ' — ' + x.note] }))),
        field('Mascot on screen', sel('mascot', [['both', 'Both (kato + nia)'], ['kato', 'kato (male)'], ['nia', 'nia (female)'], ['none', 'None']])),
        field('Narration voice', sel('voice', [['male', 'Male'], ['female', 'Female']])),
        field('Detail level', sel('detail', [['standard', 'Standard'], ['lean', 'Lean: fewest chats, reuses the library most'], ['rich', 'Rich: more detail, more chats']])),
        field('Sky / colour mood', sel('sky', [['auto', 'Let the plan choose'], ['night', 'Night (cool)'], ['warm', 'Warm (sunset)']]))
      ),
      (P.plan || Object.keys(P.assets || {}).length) ? h('p', { className: 'muted small' }, 'Changing the style after the plan or assets exist means the assets must be made again in the new style (shots can stay).') : null,
      h('div', { className: 'card' }, h('h3', null, 'This project makes:'), P.cuts.map(function (c) { return h('div', null, '• ' + c.label + ' (' + c.aspect + ') — ' + c.minutes + ' min (~' + Math.round(c.minutes * 150) + ' words), shot ids ' + c.prefix + '01, ' + c.prefix + '02…') }),
        s.type === 'long' ? h('p', { className: 'muted small' }, 'The shorts reuse the long video\'s assets, so they only need new shots. Each short gets its own script and its own audio.') : null),
      progressCard(), soundCard(),
      nextBtn('topic', s.topic ? 'Next: Topic →' : 'Next: find a topic →'));
  }

  /* =================================================================
     2) TOPIC
     ================================================================= */
  var TREND = { wiki: [], yt: [], channel: [], hn: [] };
  function vTopic() {
    var s = P.settings, key = localStorage.getItem('ytKey') || '', region = localStorage.getItem('ytRegion') || 'US';
    var box = h('div', { className: 'card' });
    function list(title, arr) { return arr.length ? h('div', null, h('h3', { style: 'margin-top:10px' }, title), h('div', null, arr.slice(0, 40).map(function (t) { return h('span', { className: 'pill', title: 'Use as topic', on: { click: function () { s.topic = t; save(); toast('Topic set: ' + t) } } }, t) }))) : null }
    function fetcher(btn, fn, k) { btn.disabled = true; btn.textContent = 'Loading…'; fn().then(function (r) { TREND[k] = r; rerender() }).catch(function (e) { toast('Could not load: ' + e.message, 5000); rerender() }) }
    var ideas = parseIdeas(P.topicAnswer);
    box.append.apply(box, [
      h('h3', null, 'What is trending (free)'),
      h('div', { className: 'row' },
        h('button', { className: 'ghost', on: { click: function () { fetcher(this, function () { return TRENDS.wikipedia() }, 'wiki') } } }, 'Wikipedia: most read'),
        h('button', { className: 'ghost', on: { click: function () { fetcher(this, function () { return TRENDS.hackerNews() }, 'hn') } } }, 'Hacker News'),
        h('button', { className: 'ghost', on: { click: function () { fetcher(this, function () { return TRENDS.youtube(key, region, s.category === 'science' ? 'science' : 'any') }, 'yt') } } }, 'YouTube trending'),
        h('button', { className: 'ghost', on: { click: function () { fetcher(this, function () { return TRENDS.channelTop(key, s.refChannel) }, 'channel') } } }, 'Reference channel: top videos')),
      h('div', { className: 'g2' },
        field('YouTube API key (free — saved only in this browser)', h('input', { value: key, type: 'password', placeholder: 'AIza…', on: { change: function () { localStorage.setItem('ytKey', this.value.trim()); rerender() } } })),
        field('Reference channel (handle)', h('input', { value: s.refChannel, placeholder: '@zackdfilms', on: { change: function () { s.refChannel = this.value.trim(); save() } } }))),
      h('p', { className: 'muted small', html: 'Free key: <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank">Google Cloud</a> → enable "YouTube Data API v3" → Credentials → Create API key. Region: ' }, h('input', { value: region, style: 'width:60px', on: { change: function () { localStorage.setItem('ytRegion', this.value.trim().toUpperCase()) } } })),
      list('Wikipedia — most read yesterday', TREND.wiki), list('YouTube trending', TREND.yt), list('Reference channel — most viewed', TREND.channel), list('Hacker News', TREND.hn)].filter(Boolean));
    return h('div', null,
      h('h1', null, 'Topic'), h('p', { className: 'lead' }, 'Get 10 ideas from Claude (or any free chat), using what is trending right now. Then pick one.'),
      box,
      h('div', { className: 'card' },
        help(['Click <b>Copy topic prompt</b>. It includes whatever trending lists you loaded above.', 'Paste it into <b>Claude</b> (or Qwen / DeepSeek) and send.', 'Paste the answer below, then click <b>Use</b> on the idea you like.']),
        field('Extra wishes (optional)', h('input', { value: s.extraTopic || '', placeholder: 'e.g. ocean survival, Africa, 2010s', on: { input: function () { s.extraTopic = this.value; save() } } })),
        h('div', { className: 'row', style: 'margin-top:10px' }, h('button', { on: { click: function () { promptBox('Topic prompt', TPL.topics(P, TREND), 'Topic prompt') } } }, 'Copy topic prompt')),
        field('Paste the answer here', h('textarea', { value: P.topicAnswer, on: { input: function () { P.topicAnswer = this.value; save() }, change: rerender } })),
        ideas.length ? h('div', null, ideas.map(function (t) { return h('div', { className: 'row', style: 'margin:4px 0' }, h('button', { className: 'small', on: { click: function () { s.topic = t; save(); rerender() } } }, 'Use'), h('span', null, t)) })) : null),
      h('div', { className: 'card' }, field('Chosen topic', h('input', { value: s.topic, on: { input: function () { s.topic = this.value; save() } } }))),
      nextBtn('script', 'Next: Script →'));
  }
  function parseIdeas(t) { return String(t || '').split('\n').map(function (l) { var m = /^\s*\d+[.)]\s*(.+)$/.exec(l); return m ? m[1].replace(/\*\*/g, '').trim() : null }).filter(Boolean) }

  /* =================================================================
     3) SCRIPT
     ================================================================= */
  function vScript() {
    var status = h('div');
    function readAnswer() {
      var sec = PLAN.sections(P.scriptRaw || ''), got = 0;
      if (sec.TITLE) P.title = sec.TITLE.split('\n')[0].trim();
      if (sec['VOICE STYLE']) P.voiceStyle = sec['VOICE STYLE'];
      if (sec.SOURCES) P.sources = sec.SOURCES;
      P.cuts.forEach(function (c) {
        var k = Object.keys(sec).filter(function (x) { return x === 'SCRIPT: ' + c.label.toUpperCase() || (x.indexOf('SCRIPT') === 0 && x.indexOf(c.label.toUpperCase()) >= 0) })[0];
        if (!k && P.cuts.length === 1) k = Object.keys(sec).filter(function (x) { return x.indexOf('SCRIPT') === 0 })[0];
        if (k) { var t = PLAN.cleanScript(sec[k]); if (t !== c.text) { c.text = t; c.words = []; c.lines = []; c.duration = 0 } got++ }
      });
      save(true); rerender();
      toast(got ? 'Read ' + got + ' script' + (got > 1 ? 's' : '') + '.' : 'No "=== SCRIPT: … ===" sections found. Paste the full answer.', 4000);
    }
    return h('div', null,
      h('h1', null, 'Script'), h('p', { className: 'lead' }, 'Claude researches the topic, checks facts, and writes a human, TTS-ready script for every cut in one go. This is the make-or-break step, so use Claude here.'),
      h('div', { className: 'card' },
        field('Your research: links, notes, documents (paste text)', h('textarea', { value: P.research, placeholder: 'https://… \nSome notes…\n(paste article text or doc content here)', on: { input: function () { P.research = this.value; save() } } })),
        field('Style reference: paste a transcript from the channel whose storytelling you like (optional). Only the style is copied, never the words.', h('textarea', { value: P.styleRef, on: { input: function () { P.styleRef = this.value; save() } } })),
        help(['Click <b>Copy script prompt</b> and paste it into <b>Claude</b> (turn on web search in Claude for research).', 'Paste Claude\'s whole answer in the box below and click <b>Read the answer</b>.', 'Check each script. You can edit the text directly.']),
        h('div', { className: 'row' }, h('button', { on: { click: function () { promptBox('Script prompt (for Claude)', TPL.script(P), 'Script prompt') } } }, 'Copy script prompt')),
        field('Paste Claude\'s answer', h('textarea', { value: P.scriptRaw, style: 'min-height:160px', on: { input: function () { P.scriptRaw = this.value; save() } } })),
        h('div', { className: 'row' }, h('button', { className: 'blue', on: { click: readAnswer } }, 'Read the answer')), status),
      h('div', { className: 'card' },
        field('Title', h('input', { value: P.title, style: 'width:100%', on: { input: function () { P.title = this.value; save() } } })),
        field('Voice style (for Google AI Studio)', h('textarea', { value: P.voiceStyle, style: 'min-height:60px', on: { input: function () { P.voiceStyle = this.value; save() } } })),
        P.sources ? field('Sources', h('textarea', { value: P.sources, readOnly: true, style: 'min-height:60px' })) : null),
      P.cuts.map(function (c) {
        var n = TIMING.words(c.text).length;
        return h('div', { className: 'card' }, h('div', { className: 'row' }, h('h3', null, c.label), badge(n + ' words / target ~' + Math.round(c.minutes * 150), Math.abs(n - c.minutes * 150) < c.minutes * 40 ? 'b-ok' : 'b-warn')),
          h('textarea', { value: c.text, style: 'min-height:180px', on: { input: function () { c.text = this.value; if (c.lines.length) { c.lines = []; c.words = []; c.duration = 0 } save() } } }),
          c.text && c.lines.length === 0 ? h('div', { className: 'muted small' }, 'After you change the text, make the audio and timing again in the next step.') : null);
      }),
      nextBtn('voice', 'Next: Voice →'));
  }

  /* =================================================================
     4) VOICE & TIMING
     ================================================================= */
  function vVoice() {
    return h('div', null,
      h('h1', null, 'Voice & timing'), h('p', { className: 'lead' }, 'Make the voice for free in Google AI Studio, upload it here, and the app finds when every word is spoken. Scenes and captions follow those times exactly.'),
      help(['Open <a href="https://aistudio.google.com/generate-speech" target="_blank">Google AI Studio → Generate speech</a> (free, sign in with Google).', 'Click <b>Copy voice style</b> and paste it in the style box there. Pick a voice you like (always the same voice for your channel).', 'Click <b>Copy script</b> and paste it as the text. Generate, then download the audio.', 'Back here: <b>Upload audio</b> for that cut, then <b>Make timing</b>.']),
      h('div', { className: 'row' }, h('button', { className: 'ghost', on: { click: function () { copy(TPL.voiceStyle(P), 'Voice style') } } }, 'Copy voice style')),
      P.cuts.map(function (c) {
        var st = h('div', { className: 'muted small', style: 'margin-top:6px' }), fileIn = h('input', { type: 'file', accept: 'audio/*', hidden: true });
        fileIn.onchange = function () { var f = fileIn.files[0]; if (!f) return; DB.putFile(P.id + ':' + c.id, f).then(function () { c.hasAudio = true; c.audioName = f.name; c.lines = []; c.words = []; save(true); rerender(); toast('Audio saved. Now click Make timing.') }) };
        function timing(useWhisper) {
          if (!c.text) return toast('Write the script first.');
          DB.getFile(P.id + ':' + c.id).then(function (blob) {
            if (!blob) return toast('Upload the audio first.');
            TIMING.run(c.text, blob, function (m) { st.textContent = m }, useWhisper).then(function (r) {
              c.words = r.words; c.duration = r.duration; c.lines = TIMING.lines(r.words); c.timing = r.method || 'pauses';
              save(true); rerender(); toast('Timing done (' + c.timing + (r.matched ? ', ' + Math.round(r.matched * 100) + '% words matched' : '') + ').', 4000);
            }).catch(function (e) { st.textContent = 'Error: ' + e.message });
          });
        }
        function estimate() { var r = TIMING.estimate(c.text); c.words = r.words; c.duration = r.duration; c.lines = TIMING.lines(r.words); c.timing = 'estimate (no audio)'; save(true); rerender() }
        return h('div', { className: 'card' },
          h('div', { className: 'row' }, h('h3', null, c.label), c.hasAudio ? badge('audio: ' + (c.audioName || 'saved'), 'b-ok') : badge('no audio yet', 'b-warn'), c.lines.length ? badge(c.lines.length + ' lines · ' + c.duration.toFixed(1) + ' s · ' + c.timing, 'b-blue') : null),
          h('div', { className: 'row', style: 'margin-top:8px' },
            h('button', { className: 'ghost', on: { click: function () { copy(c.text, 'Script') } } }, 'Copy script'),
            h('button', { className: 'ghost', on: { click: function () { fileIn.click() } } }, 'Upload audio'), fileIn,
            h('button', { disabled: !c.hasAudio, on: { click: function () { timing(true) } } }, 'Make timing (Whisper)'),
            h('button', { className: 'ghost', disabled: !c.hasAudio, title: 'Faster, no download, a bit less exact', on: { click: function () { timing(false) } } }, 'Quick timing (pauses)'),
            h('button', { className: 'ghost', title: 'For testing before you have audio', on: { click: estimate } }, 'Estimate without audio')),
          st,
          c.lines.length ? h('div', { className: 'lines', style: 'margin-top:8px' }, c.lines.map(function (l) { return h('div', null, 'line ' + l.i + '  [' + l.s.toFixed(1) + '–' + l.e.toFixed(1) + 's]  ' + l.text) })) : null);
      }),
      h('p', { className: 'muted small' }, 'Whisper runs inside your browser (free). The first time it downloads a speech model, then it is cached. If it fails, use Quick timing.'),
      nextBtn('plan', 'Next: Plan →'));
  }

  /* =================================================================
     5) PLAN
     ================================================================= */
  var planCheck = null;
  function applyPlan(plan) {
    P.plan = plan; P.planSig = planSig();
    applyReuse(plan.assets, function (w) { if (planCheck) planCheck.warnings.push(w) });
    plan.assets.forEach(function (a) { if (!P.assets[a.name]) P.assets[a.name] = { code: '', versions: [], status: 'todo' } });
    makeAssetTickets(); P.cuts.forEach(function (c) { makeShotTickets(c.id) });
    save(true);
  }
  var PLANCOPIED = false, PLANTAB = 'summary';
  function visibleGaps() { if (!P || !P.plan || !window.EDIT) return []; var ig = P.plan.ignoreGaps || []; return EDIT.gaps(P.plan).filter(function (g) { return ig.indexOf(g.word) < 0 }) }
  /* new assets that are not in any chat yet get chats of their own (chats already started are kept) */
  function addFreshTickets() {
    var fresh = P.plan.assets.filter(function (a) { var x = P.assets[a.name]; return x && !x.reused && x.status === 'todo' && !P.assetTickets.some(function (t) { return t.names.indexOf(a.name) >= 0 }) });
    PLAN.batch(fresh).forEach(function (g) { P.assetTickets.push({ id: 'a' + P.assetTickets.length + Date.now().toString(36), n: P.assetTickets.length + 1, names: g.names, status: 'waiting', answer: '', label: g.label || null }) });
    return fresh.length;
  }
  function addGap(g, quiet) {
    var a = EDIT.suggest(g); if (!a.name) return;
    if (!P.plan.assets.some(function (x) { return x.name === a.name })) { P.plan.assets.push(a); applyReuse([Object.assign(a, libFind(a.name) ? { reuse: true } : {})]); if (!P.assets[a.name]) P.assets[a.name] = { code: '', versions: [], status: 'todo' } }
    // put it in the shots that cover that line, so the shot chat uses it
    Object.keys(P.plan.cuts).forEach(function (cid) {
      (P.plan.cuts[cid] || []).forEach(function (s) {
        var hit = g.shot ? s.id === g.shot : (g.cid === cid && g.line != null && g.line >= s.lines[0] && g.line <= s.lines[1]);
        if (hit && (s.cast || (s.cast = [])).indexOf(a.name) < 0) { s.cast.push(a.name); var x = (P.shots[cid] || {})[s.id]; if (x && x.code) { x.status = 'error'; x.check = { errors: ['Add "' + a.name + '" to this shot: ' + (g.show || '')], warnings: [] } } }
      });
    });
    if (!quiet) { addFreshTickets(); save(true); rerender(); toast('"' + a.name + '" added. It has its own chat on the Assets page.') }
  }
  function gapsCard() {
    var G = visibleGaps(); if (!G.length) return null;
    return h('div', { className: 'card', style: 'border-color:#7a3a33;background:#2a1816' },
      h('div', { className: 'row' }, h('h3', { style: 'margin:0' }, '⚠ ' + G.length + ' thing' + (G.length > 1 ? 's' : '') + ' the story names but nobody builds'), h('span', { className: 'grow' }),
        h('button', { on: { click: function () { G.forEach(function (g) { addGap(g, true) }); P.plan.gapsSeen = true; var n = addFreshTickets(); save(true); rerender(); toast('Added ' + G.length + ' assets (' + n + ' new to build).') } } }, 'Add all'),
        h('button', { className: 'ghost small', 'data-tip': 'Hide this list. The things will not appear in the video.', on: { click: function () { P.plan.ignoreGaps = (P.plan.ignoreGaps || []).concat(G.map(function (g) { return g.word })); P.plan.gapsSeen = true; save(true); rerender() } } }, 'Ignore all')),
      h('p', { className: 'muted small', style: 'margin:6px 0' }, 'If it is not an asset, it cannot appear on screen (this is why things like "the brain" were missing). Adding makes a small asset for it and puts it in the right shots.'),
      G.slice(0, 30).map(function (g) {
        return h('div', { className: 'row', style: 'border-top:1px solid var(--line);padding:6px 0' }, h('b', null, g.word), h('span', { className: 'muted small', style: 'flex:1;min-width:200px' }, g.why),
          h('button', { className: 'small', on: { click: function () { addGap(g) } } }, 'Add'),
          h('button', { className: 'ghost small', on: { click: function () { (P.plan.ignoreGaps = P.plan.ignoreGaps || []).push(g.word); save(true); rerender() } } }, 'Ignore'));
      }));
  }
  function vPlan() {
    var ready = P.cuts.every(function (c) { return c.lines.length });
    function read() {
      try { var plan = PLAN.json(P.planRaw) } catch (e) { planCheck = { errors: ['Could not read JSON: ' + e.message], warnings: [] }; return rerender() }
      planCheck = PLAN.validate(plan, P.cuts);
      if (styleOf() === 'facet' && !(plan.details && Object.keys(plan.details).some(function (k) { return (plan.details[k] || []).length }))) planCheck.warnings.push('No "details" (detail pass): list what each line names that the picture must show — copy the fix prompt to add it.');
      if (!planCheck.errors.length) {
        var merged = window.EDIT ? EDIT.mergeShort(plan, P.cuts, 2.5) : 0;
        if (merged) planCheck.warnings.push('Joined ' + merged + ' very short shot' + (merged > 1 ? 's' : '') + ' into their neighbours (fewer cuts, smoother video).');
        applyPlan(plan); PLANTAB = 'summary';
        var gp = visibleGaps().length;
        toast('Plan accepted: ' + plan.assets.length + ' assets' + (merged ? ', ' + merged + ' short shots joined' : '') + (gp ? '. ' + gp + ' missing things found.' : '.'), 5000);
        if (P.easy && !gp) return go('assets');
      }
      rerender();
    }
    var paste = h('div', null,
      h('div', { className: 'row' }, h('button', { disabled: !ready, on: { click: function () { PLANCOPIED = true; promptBox('Plan prompt', TPL.plan(P, libIndex()), 'Plan prompt'); afterRender(); renderSide() } } }, 'Copy plan prompt'),
        h('button', { on: { click: function () { fromClipboard().then(function (t) { P.planRaw = t; save(); read() }).catch(pasteFail) } } }, '📋 Paste & read'),
        planCheck && (planCheck.errors.length || planCheck.warnings.some(function (w) { return /detail pass/.test(w) })) ? h('button', { className: 'ghost', on: { click: function () { promptBox('Plan fix prompt', TPL.planFix(P, planCheck.errors.concat(planCheck.warnings.filter(function (w) { return /detail pass/.test(w) }))), 'Fix prompt') } } }, 'Copy fix prompt') : null),
      planCheck && planCheck.errors.length ? msgs(planCheck.errors, []) : null,
      h('details', { className: 'fold' }, h('summary', null, 'Paste by hand / see the JSON'), h('div', { className: 'in' },
        h('textarea', { value: P.planRaw, style: 'min-height:160px', on: { input: function () { P.planRaw = this.value; save() } } }), h('button', { className: 'blue', style: 'margin-top:6px', on: { click: read } }, 'Read plan'))));
    var head = h('div', null, staleBanner(), h('h1', null, 'Plan'),
      h('p', { className: 'lead' }, 'The plan is the to-do list for your video: which characters, places and things to build, and which picture goes with each part of your narration. An AI writes it; you paste it here.'));
    if (!P.plan) return h('div', null, head,
      !ready ? h('div', { className: 'card' }, badge('First add your audio on Start.', 'b-warn')) : null,
      h('div', { className: 'card' }, h('ol', { className: 'small', style: 'margin:0 0 10px;padding-left:18px' }, h('li', null, 'Click Copy plan prompt and paste it into Claude (or a free chat).'), h('li', null, 'When it finishes, copy its whole answer.'), h('li', null, 'Click Paste & read.')), paste));
    var A = P.plan.assets, lib = A.filter(function (a) { return (P.assets[a.name] || {}).reused }).length, nw = A.length - lib, G = visibleGaps(), shots = 0, secs = 0;
    P.cuts.forEach(function (c) { shots += (P.plan.cuts[c.id] || []).length; secs += c.duration || 0 });
    var det = 0; Object.keys(P.plan.details || {}).forEach(function (k) { det += (P.plan.details[k] || []).length });
    var pb = P.plan.publish || {};
    function tab(id, label, cnt, bad) { return h('button', { className: PLANTAB === id ? 'on' : '', on: { click: function () { PLANTAB = id; rerender() } } }, label, cnt != null ? h('span', { className: 'cnt' + (bad ? ' bad' : '') }, cnt) : null) }
    var body;
    if (PLANTAB === 'summary') body = h('div', null,
      h('div', { className: 'tiles' },
        h('div', { className: 'tile ok' }, h('b', null, A.length), h('span', null, 'assets · ' + lib + ' from your library (free), ' + nw + ' new')),
        h('div', { className: 'tile' }, h('b', null, P.assetTickets.length), h('span', null, 'asset chats to run')),
        h('div', { className: 'tile' }, h('b', null, shots), h('span', null, 'shots · about ' + (shots ? (secs / shots).toFixed(1) : 0) + ' s each')),
        h('div', { className: 'tile ' + (G.length ? 'bad' : 'ok') }, h('b', null, G.length), h('span', null, G.length ? 'missing things (fix below)' : 'missing things')),
        h('div', { className: 'tile' }, h('b', null, (pb.titles || []).length + ' · ' + (pb.thumbnails || []).length), h('span', null, 'titles · thumbnails ready'))),
      gapsCard(),
      planCheck && planCheck.warnings.length ? h('details', { className: 'fold' }, h('summary', null, planCheck.warnings.length + ' notes from the check'), h('div', { className: 'in' }, msgs([], planCheck.warnings))) : null,
      h('div', { className: 'row', style: 'margin-top:14px' }, h('button', { on: { click: function () { go('assets') } } }, 'Next: Assets →')));
    else if (PLANTAB === 'assets') body = h('div', null, h('p', { className: 'muted small' }, 'Click a name to preview it (when made). ♻ = from your library, no chat needed.'),
      ['character', 'creature', 'set', 'prop', 'fx'].map(function (k) {
        var L = A.filter(function (a) { return a.kind === k }); if (!L.length) return null;
        return h('details', { className: 'fold', open: k === 'character' }, h('summary', null, k + 's (' + L.length + ')'), h('div', { className: 'in' }, h('table', null, L.map(function (a) {
          return h('tr', null, h('td', { style: 'width:180px' }, assetChip(a.name), reuseCell(a)), h('td', { className: 'small' }, a.looks_like ? h('div', null, h('b', null, 'Looks like: '), a.looks_like) : null, h('div', { className: 'muted' }, a.look), a.spots && a.spots.length ? h('div', { className: 'muted' }, 'spots: ' + a.spots.join(', ')) : null));
        }))));
      }));
    else if (PLANTAB === 'shots') body = h('div', null, P.cuts.map(function (c) {
      var list = P.plan.cuts[c.id] || [], tm = PLAN.shotTimes(c, list);
      return h('div', null, P.cuts.length > 1 ? h('h3', null, c.label) : null, list.map(function (s, i) {
        var tr = window.EDIT ? EDIT.trans(P.plan, c.id, i, (P.edits || {})[c.id]) : null;
        return h('details', { className: 'fold' }, h('summary', null, h('b', { style: 'color:var(--ink)' }, s.id), h('span', null, (tm[i].to - tm[i].from).toFixed(1) + ' s'), h('span', null, s.set), tr ? badge(tr.type) : null, h('span', { style: 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' }, s.show)),
          h('div', { className: 'in small' }, h('p', null, s.show), h('div', null, (s.cast || []).map(assetChip)), h('p', { className: 'muted' }, 'Says: "' + c.lines.slice(s.lines[0], s.lines[1] + 1).map(function (l) { return l.text }).join(' ') + '"'), h('p', { className: 'muted' }, 'Camera: ' + (s.camera || '-') + ' · mood: ' + (s.mood || 'normal'))));
      }));
    }));
    else if (PLANTAB === 'details') body = h('div', null, h('p', { className: 'muted small' }, 'What each line names that the picture must show. The app checks every shot against this list.'),
      P.cuts.map(function (c) { var D = (P.plan.details || {})[c.id] || []; return h('table', null, D.map(function (d) { return h('tr', null, h('td', { style: 'width:60px' }, 'line ' + d.line), h('td', { style: 'width:110px' }, h('b', null, d.word)), h('td', { className: 'muted small' }, d.show, d.needs && d.needs.length ? h('div', null, d.needs.map(function (n) { return assetChip(n) })) : null)) })) }));
    else if (PLANTAB === 'upload') body = h('div', null, h('p', { className: 'muted small' }, 'Ready on the Publish page after export. Preview:'), publishPackage(P.cuts[0], function () { go('publish') }));
    else if (PLANTAB === 'redo') body = h('div', null, h('p', { className: 'muted small' }, 'Make a new plan. Assets and shots already made are kept when their names stay the same.'), paste, levelUpCard());
    return h('div', null, head,
      h('div', { className: 'tabs' }, tab('summary', 'Summary', G.length ? G.length : null, !!G.length), tab('assets', 'Assets', A.length), tab('shots', 'Shots', shots), tab('details', 'Must show', det), tab('upload', 'Upload text', null), tab('redo', 'Re-do / level up', null)),
      body);
  }
  function reuseCell(a) {
    var x = P.assets[a.name] || {};
    if (x.reused) return h('div', null, badge('♻ from library' + (x.from ? ': ' + x.from : ''), 'b-ok'));
    if (x.status === 'approved') return null;
    var sim = libSimilar(a); if (!sim.length) return null;
    return h('div', null, sim.map(function (l) {
      return h('button', { className: 'ghost small', style: 'margin-top:4px', 'data-tip': 'Use the library asset "' + l.name + '" (from "' + l.from + '") instead of building a new one. Saves a chat.', on: { click: function () { useLib(a, l); makeAssetTickets(); save(true); rerender(); toast('Using "' + l.name + '" from the library for ' + a.name + '.') } } }, '♻ use ' + l.name);
    }));
  }

  /* =================================================================
     TICKETS
     ================================================================= */
  function makeAssetTickets() {
    var todo = P.plan.assets.filter(function (a) { var x = P.assets[a.name]; return !(x && x.reused) });
    var items = todo.map(function (a) { return { name: a.name, difficulty: a.difficulty } });
    var old = {}; (P.assetTickets || []).forEach(function (t) { old[t.names.slice().sort().join(',')] = t });
    var auto = P.ptsAsset === 'auto' || P.ptsAsset == null;
    var groups = auto ? PLAN.batch(todo) : PLAN.pack(items, P.ptsAsset).map(function (b) { return { names: b.map(function (x) { return x.name }) } });
    P.assetTickets = groups.map(function (g, i) {
      var names = g.names, o = old[names.slice().sort().join(',')];
      var t = o ? Object.assign(o, { n: i + 1 }) : { id: 'a' + i + Date.now().toString(36), n: i + 1, names: names, status: 'waiting', answer: '' };
      t.label = g.label || null; return t;
    });
  }
  function makeShotTickets(cid) {
    var list = (P.plan.cuts[cid] || []).map(function (s) { return { id: s.id, difficulty: s.difficulty } });
    var cap = P.claudeShots ? 999 : P.ptsShot, old = {};
    (P.shotTickets[cid] || []).forEach(function (t) { old[t.ids.join(',')] = t });
    P.shotTickets[cid] = PLAN.pack(list, cap, true).map(function (b, i) {
      var ids = b.map(function (x) { return x.id }), o = old[ids.join(',')];
      return o ? Object.assign(o, { n: i + 1 }) : { id: 's' + i + Date.now().toString(36), n: i + 1, ids: ids, status: 'waiting', answer: '' };
    });
    if (!P.shots[cid]) P.shots[cid] = {};
  }

  /* ---------------- run the stage in a hidden iframe ---------------- */
  function stage(payload, wantType, visibleIn) {
    return new Promise(function (res, rej) {
      var f = h('iframe', { src: stagePage(), className: visibleIn ? '' : 'hidden-stage' });
      var timer = setTimeout(function () { done(); rej(new Error('The check took too long.')) }, 90000);
      function done() { clearTimeout(timer); window.removeEventListener('message', on); if (!visibleIn) f.remove() }
      function on(e) {
        if (e.source !== f.contentWindow) return; var m = e.data || {};
        if (m.type === 'stage-ready') f.contentWindow.postMessage({ type: 'load', payload: payload }, '*');
        else if (m.type === wantType) { done(); res(m) }
        else if (m.type === 'fatal') { done(); rej(new Error(m.msg)) }
      }
      window.addEventListener('message', on);
      (visibleIn || document.body).appendChild(f);
    });
  }
  function assetCodes() { var o = {}; Object.keys(P.assets).forEach(function (n) { if (P.assets[n].code) o[n] = P.assets[n].code }); return o }
  function shotCodes(cid) { var o = {}, S = P.shots[cid] || {}; Object.keys(S).forEach(function (n) { if (S[n].code) o[n] = S[n].code }); return o }
  function cutPayload(cid) {
    var c = cutById(cid);
    var ov = (P.edits || {})[cid] || {};
    return { duration: c.duration, words: c.words, lines: c.lines, shots: (P.plan.cuts[cid] || []).map(function (s, i) { return { id: s.id, from_line: s.lines[0], to_line: s.lines[1], trans: window.EDIT ? EDIT.trans(P.plan, cid, i, ov) : null } }) };
  }

  /* =================================================================
     6) ASSETS
     ================================================================= */
  function storeBlocks(text, kind, cid) {
    var r = PLAN.blocks(text, kind), names = [];
    r.order.forEach(function (n) {
      var code = r.blocks[n]; if (!code) return;
      var bag = kind === 'shot' ? (P.shots[cid] = P.shots[cid] || {}) : P.assets, x = bag[n] || (bag[n] = { code: '', versions: [], status: 'todo' });
      if (x.code === code) { names.push(n); return }
      if (x.code) x.versions.push({ code: x.code, at: Date.now() });
      if (x.reused) { x.reused = false; x.improved = true }        // a changed library asset is saved as a new version
      if (x.versions.length > 12) x.versions.shift();
      x.code = code; x.status = 'pasted'; names.push(n);
    });
    return { names: names, outside: r.outside, broken: r.order.filter(function (n) { return !r.blocks[n] }) };
  }
  function checkAssets(names) {
    var expect = P.plan.assets.filter(function (a) { return names.indexOf(a.name) >= 0 });
    var job = window.GUIDE ? GUIDE.task('Checking ' + names.length + (names.length === 1 ? ' asset' : ' assets'), { key: 'chk-asset', units: names.length, label: 'Building each one and testing it…' }) : null;
    return stage({ mode: 'check-assets', sky: sky(), assets: assetCodes(), expect: expect }, 'check-assets').then(function (m) {
      Object.keys(m.results).forEach(function (n) {
        var r = m.results[n], a = P.assets[n] || (P.assets[n] = { code: '', versions: [] });
        a.check = r; a.status = r.ok ? (a.status === 'approved' ? 'approved' : 'checked') : 'error';
        if (r.size) P.assetInfo[n] = { size: r.size };
      });
      var bad = Object.keys(m.results).filter(function (n) { return !m.results[n].ok }).length;
      if (job) job.done(bad ? bad + ' need a fix' : 'All passed', !!bad);
      save(true);
      var good = Object.keys(m.results).filter(function (n) { return m.results[n].ok });
      if (good.length && REVIEW.ready() && REVIEW.auto()) setTimeout(function () { reviewLooks(good) }, 300);
      return m.results;
    }, function (e) { if (job) job.done(e.message, true); throw e });
  }
  function vAssets() {
    if (!P.plan) return h('div', null, h('h1', null, 'Assets'), h('div', { className: 'card' }, badge('Make the plan first.', 'b-warn')));
    var T = P.assetTickets, nOk = P.plan.assets.filter(function (a) { return (P.assets[a.name] || {}).status === 'approved' }).length, lib = P.plan.assets.filter(function (a) { return (P.assets[a.name] || {}).reused });
    return h('div', null,
      staleBanner(), h('h1', null, 'Assets'), h('p', { className: 'lead' }, 'Each chat below builds a few characters, places or things. Run them in separate free chats, at the same time if you like. Paste each answer back here.'),
      h('div', { className: 'row', style: 'margin-bottom:6px' }, badge(nOk + ' / ' + P.plan.assets.length + ' ready', nOk === P.plan.assets.length ? 'b-ok' : 'b-blue'), lib.length ? badge('♻ ' + lib.length + ' from library', 'b-ok') : null, h('span', { className: 'grow' }),
        h('button', { className: 'blue', on: { click: function () { sheetModal() } } }, 'Asset sheet'),
        h('button', { className: 'ghost', 'data-tip': REVIEW.ready() ? 'Gemini looks at every asset and says which ones look wrong (a woman who looks like a man, wrong skin tone…).' : 'Add a free Gemini key in ⚙ Settings to turn this on.', on: { click: function () { reviewLooks(P.plan.assets.filter(function (a) { return (P.assets[a.name] || {}).code }).map(function (a) { return a.name }), true) } } }, '👁 Review looks'),
        h('button', { className: 'ok', on: { click: function () { approveAll(P.assets, P.plan.assets.map(function (a) { return a.name })) } } }, 'Approve all ✓')),
      T.map(assetTicketCard),
      lib.length ? h('details', { className: 'fold' }, h('summary', null, '♻ From your library (' + lib.length + ') — no chat needed'), h('div', { className: 'in' }, lib.map(assetRow))) : null,
      h('details', { className: 'fold' }, h('summary', null, '⚡ Smart paste: paste any chat answer, the app finds what it is'), h('div', { className: 'in' }, smartPaste('asset'))),
      h('details', { className: 'fold' }, h('summary', null, 'Options: how assets are grouped into chats'), h('div', { className: 'in row' },
        h('select', { on: { change: function () { P.ptsAsset = this.value === 'auto' ? 'auto' : +this.value; makeAssetTickets(); save(); rerender() } } }, ['auto', 2, 3, 4, 6, 99].map(function (v) { return h('option', { value: v, selected: String(P.ptsAsset == null ? 'auto' : P.ptsAsset) === String(v) }, v === 'auto' ? 'Auto by complexity (recommended)' : v === 99 ? 'all in one chat (Claude)' : v + ' difficulty points per chat') })),
        h('span', { className: 'muted small' }, 'Hard assets get their own chat, medium ones go in pairs, simple ones in bunches.'))),
      levelUpCard(),
      nOk === P.plan.assets.length ? nextBtn('shots', 'Next: Shots →') : null);
  }
  function statusBadge(st) { return { waiting: badge('waiting', ''), copied: badge('in a chat', 'b-blue'), pasted: badge('pasted', 'b-blue'), checked: badge('✓ checked', 'b-ok'), approved: badge('✓ approved', 'b-ok'), error: badge('✖ needs fix', 'b-bad'), todo: badge('not made', '') }[st] || badge(st) }
  function assetTicketCard(t) {
    var A = P.plan.assets.filter(function (a) { return t.names.indexOf(a.name) >= 0 });
    var ta = h('textarea', { value: t.answer || '', placeholder: 'Or paste the chat\'s answer here by hand, then click Check…', on: { input: function () { t.answer = this.value; save() } } });
    var out = h('div'), x = { t: t, kind: 'asset' }, done = ticketDone(x), bad = ticketBad(x);
    function check() {
      var r = storeBlocks(t.answer, 'asset');
      if (!r.names.length) { out.innerHTML = ''; out.appendChild(msgs(['No KIT.asset(\'…\') found in the answer.'])); return }
      t.status = 'pasted'; out.innerHTML = 'Checking…';
      checkAssets(t.names).then(function () { t.status = t.names.every(function (n) { return (P.assets[n] || {}).status !== 'error' }) ? 'checked' : 'error'; if (P.easy) t.names.forEach(function (n) { var x = P.assets[n]; if (x && x.status === 'checked') x.status = 'approved' }); save(true); rerender() }).catch(function (e) { out.textContent = 'Error: ' + e.message });
    }
    return h('div', { className: 'ticket' + (done ? ' ok' : bad ? ' bad' : ''), id: 'atk-' + t.n },
      h('div', { className: 'row' }, chatTag(t), h('b', null, A.length + (A.length === 1 ? ' asset' : ' assets')), t.label ? badge(t.label, /hard/.test(t.label) ? 'b-warn' : '') : null, done ? badge('✓ done', 'b-ok') : statusBadge(t.status), h('span', { className: 'grow' }),
        done ? null : h('button', { className: t.status === 'waiting' ? '' : 'ghost', on: { click: function () { t.status = t.status === 'waiting' ? 'copied' : t.status; save(); promptBox('Chat ' + chatNo(t) + ' prompt', TPL.assetTicket(P, t), 'Chat ' + chatNo(t) + ' prompt', noteChat(t)); renderNav(); renderSide() } } }, 'Copy prompt'),
        done ? null : h('button', { className: t.status === 'waiting' ? 'ghost' : '', on: { click: function () { fromClipboard().then(function (x) { t.answer = x; ta.value = x; save(); check() }).catch(pasteFail) } } }, '📋 Paste & check')),
      h('div', { className: 'names' }, t.names.map(assetChip)), out,
      bad ? h('div', null, A.filter(function (a) { return (P.assets[a.name] || {}).status === 'error' }).map(assetRow)) : null,
      h('details', { className: 'fold' }, h('summary', null, 'Details, fixes, improve, chat link'), h('div', { className: 'in' },
        chatRow(t), A.map(assetRow), resultFiles(function (x) { t.answer = x; ta.value = x; save(); check() }),
        ta, h('div', { className: 'row', style: 'margin-top:6px' }, h('button', { className: 'blue', on: { click: check } }, 'Check'),
          h('button', { className: 'ok', on: { click: function () { t.names.forEach(function (n) { var x = P.assets[n]; if (x && x.status === 'checked') x.status = 'approved' }); save(true); rerender() } } }, 'Approve all ✓')))));
  }
  function assetRow(a) {
    var x = P.assets[a.name] || {}, c = x.check, note = h('input', { placeholder: 'What should change? (e.g. "make her look older", "nose too small")', style: 'flex:1;min-width:200px', value: x.note || '', on: { input: function () { x.note = this.value; save() } } });
    return h('div', { style: 'border-top:1px solid var(--line);padding:8px 0' },
      h('div', { className: 'row' }, assetChip(a.name), h('span', { className: 'muted small' }, a.kind + (a.looks_like ? ' · ' + a.looks_like : '')), statusBadge(x.status || 'todo'), x.improved ? badge('improved', 'b-blue') : null,
        h('span', { className: 'grow' }),
        x.status === 'checked' ? h('button', { className: 'ok small', on: { click: function () { x.status = 'approved'; save(true); rerender() } } }, 'Approve') : null,
        x.status === 'error' && c && c.errors.length && c.errors.every(function (e) { return /^Look review/.test(e) }) ? h('button', { className: 'ok small', 'data-tip': 'Gemini can be wrong. If it looks right to you, approve it.', on: { click: function () { c.errors = []; c.ok = true; x.status = 'approved'; P.assetTickets.forEach(function (t) { if (t.names.indexOf(a.name) >= 0 && t.names.every(function (n) { return (P.assets[n] || {}).status !== 'error' })) t.status = 'checked' }); save(true); rerender() } } }, 'It looks fine ✓') : null,
        x.status === 'approved' && !x.reused ? h('button', { className: 'ghost small', on: { click: function () { x.status = 'checked'; save(true); rerender() } } }, 'Un-approve') : null),
      c ? msgs(c.errors, c.warnings) : null,
      x.code ? h('div', { className: 'row', style: 'margin-top:6px' }, note,
        x.status === 'error' || (c && c.warnings && c.warnings.length) ? h('button', { className: 'small', on: { click: function () { promptBox('Fix ' + a.name, TPL.assetFix(P, a.name, x.code, c ? c.errors.concat(c.warnings) : [], x.note), 'Fix prompt') } } }, 'Copy fix prompt') : null,
        h('button', { className: 'ghost small', 'data-tip': 'Copies a prompt that makes this asset look better (works for library assets too). Paste it into the same chat or a new one, then paste the answer with Paste & check or Smart paste.', on: { click: function () { promptBox('Improve ' + a.name, TPL.assetImprove(P, a, x.code, x.note), 'Improve prompt') } } }, '✨ Improve'),
        x.versions && x.versions.length ? h('button', { className: 'ghost small', title: 'Go back to the previous version', on: { click: function () { var v = x.versions.pop(); x.code = v.code; x.status = 'pasted'; checkAssets([a.name]).then(rerender) } } }, 'Undo (' + x.versions.length + ')') : null) : null);
  }
  /* AUTOMATIC LOOK REVIEW (Gemini): pictures of the assets + what they must look like -> problems */
  var REVIEWING = false;
  function reviewLooks(names, manual) {
    names = names.filter(function (n) { return (P.assets[n] || {}).code });
    if (!names.length) return manual ? toast('Nothing to review yet.') : null;
    if (!REVIEW.ready()) { if (manual) settingsModal('Add your free Gemini key to turn on the automatic look review.'); return }
    if (styleOf() !== 'facet') return manual ? toast('The automatic look review works with the Facet style.', 4000) : null;
    if (REVIEWING) return; REVIEWING = true;
    var job = GUIDE.task('Reviewing how ' + names.length + (names.length === 1 ? ' asset looks' : ' assets look'), { key: 'review', units: names.length, label: 'Making pictures…' });
    var codes = {}; names.forEach(function (n) { codes[n] = P.assets[n].code });
    stage({ mode: 'thumbs', sky: sky(), assets: codes, names: names }, 'thumbs').then(function (m) {
      if (m.unsupported) throw new Error('This style cannot make pictures for review.');
      job.set(.4, 'Gemini is looking at them…');
      var items = names.filter(function (n) { return m.images[n] }).map(function (n) { var a = P.plan.assets.filter(function (q) { return q.name === n })[0] || { name: n }; return { name: n, kind: a.kind, look: a.look, looks_like: a.looks_like, image: m.images[n] } });
      return REVIEW.run(items);
    }).then(function (res) {
      var bad = 0;
      res.forEach(function (r) {
        var x = P.assets[r.name]; if (!x) return; x.review = { ok: r.ok, problems: r.problems, at: Date.now() };
        if (!r.ok && r.problems.length) {
          bad++; x.check = x.check || { ok: true, errors: [], warnings: [] }; x.check.errors = (x.check.errors || []).filter(function (w) { return !/^Look review/.test(w) }).concat(r.problems.map(function (p) { return 'Look review: ' + p })); x.check.ok = false;
          if (!x.reused) x.status = 'error'; x.note = x.note || r.problems.join('; ');
          P.assetTickets.forEach(function (t) { if (t.names.indexOf(r.name) >= 0) t.status = 'error' });
        }
      });
      job.done(bad ? bad + ' look wrong — see Copy fix prompt' : 'All look right', !!bad); REVIEWING = false; save(true); rerender();
    }).catch(function (e) { REVIEWING = false; job.done('Review stopped: ' + e.message, true); if (manual) toast('Look review: ' + e.message, 6000) });
  }
  function settingsModal(msg) {
    var key = h('input', { type: 'password', value: REVIEW.key(), placeholder: 'Paste your Gemini API key here', style: 'width:100%' });
    var auto = h('input', { type: 'checkbox', checked: REVIEW.auto() });
    modal('Settings', h('div', null, msg ? h('p', { style: 'font-size:15px' }, msg) : null,
      h('div', { className: 'card' }, h('h3', null, 'Automatic look review (free)'),
        h('ol', { className: 'small' }, h('li', { html: 'Open <a href="https://aistudio.google.com/api-keys" target="_blank">aistudio.google.com/api-keys</a> and click <b>Create API key</b>.' }), h('li', null, 'Copy the key and paste it below. Do not paste it in any chat.'), h('li', null, 'Click Save. From now on, every checked asset is looked at by Gemini automatically.')),
        key, h('label', { style: 'display:flex;gap:6px;align-items:center;color:var(--ink)' }, auto, 'Review automatically after each check'),
        h('p', { className: 'muted small' }, 'The key stays in this browser only. It is not saved in projects or backups.'),
        h('div', { className: 'row' }, h('button', { on: { click: function () { REVIEW.setKey(key.value); REVIEW.setAuto(auto.checked); document.getElementById('mclose').click(); toast(key.value.trim() ? 'Saved. Look review is on.' : 'Key removed.'); if (P) rerender() } } }, 'Save'),
          REVIEW.key() ? h('button', { className: 'ghost danger', on: { click: function () { REVIEW.setKey(''); key.value = ''; toast('Key removed.') } } }, 'Remove key') : null))));
  }
  function sheetModal() {
    var box = h('div', { style: 'height:100%' });
    modal('Asset sheet — all assets under the same light (drag to turn, click a name to inspect)', box);
    stage({ mode: 'sheet', sky: sky(), assets: assetCodes() }, '__never', box).catch(function () { });
  }
  function previewModal(name) {
    var box = h('div', { style: 'height:100%' });
    modal('Preview: ' + name + ' (drag to turn)', box);
    var codes = {}; codes[name] = P.assets[name].code;
    stage({ mode: 'preview', sky: sky(), assets: codes, name: name }, '__never', box).catch(function () { });
  }

  /* =================================================================
     7) SHOTS
     ================================================================= */
  function cutTabs(onPick) {
    return h('div', { className: 'row', style: 'margin:8px 0' }, P.cuts.map(function (c) { return h('button', { className: c.id === CUT ? '' : 'ghost', on: { click: function () { CUT = c.id; if (onPick) onPick(); rerender() } } }, c.label) }));
  }
  function checkShots(cid, ids) {
    var job = window.GUIDE ? GUIDE.task('Checking ' + ids.length + (ids.length === 1 ? ' shot' : ' shots'), { key: 'chk-shot', units: ids.length, label: 'Playing each shot and testing it…' }) : null;
    return stage({ mode: 'check-shots', sky: sky(), assets: assetCodes(), shots: shotCodes(cid), cut: cutPayload(cid), ids: ids, res: 240 }, 'check-shots').then(function (m) {
      Object.keys(m.results).forEach(function (id) {
        var x = (P.shots[cid] || {})[id]; if (!x) return; var r = m.results[id];
        // detail pass: every detail the narration names in this shot must be timed on its word
        var s = (P.plan.cuts[cid] || []).filter(function (q) { return q.id === id })[0];
        PLAN.missingDetails(x.code, PLAN.shotDetails(P.plan, cid, s)).forEach(function (d) { r.warnings.push('Detail not shown on its word "' + d.word + '": ' + d.show + " — time it with word: '" + d.word + "'.") });
        x.check = r; x.status = r.ok ? (x.status === 'approved' ? 'approved' : 'checked') : 'error';
      });
      var bad = Object.keys(m.results).filter(function (n) { return !m.results[n].ok }).length;
      if (job) job.done(bad ? bad + ' need a fix' : 'All passed', !!bad);
      save(true); return m.results;
    }, function (e) { if (job) job.done(e.message, true); throw e });
  }
  function vShots() {
    if (!P.plan) return h('div', null, h('h1', null, 'Shots'), h('div', { className: 'card' }, badge('Make the plan first.', 'b-warn')));
    if (!P.shotTickets[CUT]) makeShotTickets(CUT);
    var plan = P.plan.cuts[CUT] || [], S = P.shots[CUT] || {}, nOk = plan.filter(function (s) { return (S[s.id] || {}).status === 'approved' }).length;
    return h('div', null,
      staleBanner(), h('h1', null, 'Shots'), h('p', { className: 'lead' }, 'A shot is one picture on screen: where the camera looks, who moves, on which word. Claude writes them all from the plan.'),
      P.cuts.length > 1 ? cutTabs() : null,
      h('div', { className: 'row', style: 'margin-bottom:6px' }, badge(nOk + ' / ' + plan.length + ' ready', nOk === plan.length ? 'b-ok' : 'b-blue'), h('span', { className: 'grow' }),
        h('button', { className: 'ok', on: { click: function () { approveAll(P.shots[CUT] || {}, plan.map(function (s) { return s.id })) } } }, 'Approve all ✓')),
      (P.shotTickets[CUT] || []).map(function (t) { return shotTicketCard(CUT, t) }),
      h('details', { className: 'fold' }, h('summary', null, '⚡ Smart paste: paste any chat answer, the app finds the shots'), h('div', { className: 'in' }, smartPaste('shot', CUT))),
      h('details', { className: 'fold' }, h('summary', null, 'Options: one chat or several'), h('div', { className: 'in row' },
        h('label', { style: 'margin:0;display:flex;gap:6px;align-items:center;color:var(--ink)' }, h('input', { type: 'checkbox', checked: P.claudeShots, on: { change: function () { P.claudeShots = this.checked; makeShotTickets(CUT); save(); rerender() } } }), 'All shots in ONE chat (Claude)'),
        !P.claudeShots ? h('span', null, ' · points per chat: ', h('select', { on: { change: function () { P.ptsShot = +this.value; makeShotTickets(CUT); save(); rerender() } } }, [2, 3, 4, 6, 8].map(function (v) { return h('option', { value: v, selected: P.ptsShot === v }, v) }))) : null)),
      levelUpCard(),
      nextBtn('watch', 'Next: Edit & watch →'));
  }
  function shotTicketCard(cid, t) {
    var c = cutById(cid), plan = P.plan.cuts[cid] || [], S = P.shots[cid] || (P.shots[cid] = {}), out = h('div'), x0 = { t: t, kind: 'shot', cid: cid }, done = ticketDone(x0), bad = ticketBad(x0);
    var ta = h('textarea', { value: t.answer || '', placeholder: 'Or paste the chat\'s answer here by hand, then click Check…', on: { input: function () { t.answer = this.value; save() } } });
    function check() {
      var r = storeBlocks(t.answer, 'shot', cid);
      if (!r.names.length) { out.innerHTML = ''; out.appendChild(msgs(['No SHOT(\'…\', {...}) found in the answer.'])); return }
      out.textContent = 'Checking…';
      checkShots(cid, t.ids).then(function () { t.status = t.ids.every(function (id) { return (S[id] || {}).status === 'checked' || (S[id] || {}).status === 'approved' }) ? 'checked' : 'error'; if (P.easy) t.ids.forEach(function (id) { var x = S[id]; if (x && x.status === 'checked') x.status = 'approved' }); save(true); rerender() }).catch(function (e) { out.textContent = 'Error: ' + e.message });
    }
    function shotRow(id) {
      var s = plan.filter(function (x) { return x.id === id })[0] || {}, x = S[id] || {};
      return h('div', { style: 'border-top:1px solid var(--line);padding:6px 0' }, h('div', { className: 'row' }, h('b', null, id), statusBadge(x.status || 'todo'), h('span', { className: 'muted small', style: 'flex:1;min-width:200px' }, s.show),
        x.status === 'checked' ? h('button', { className: 'ok small', on: { click: function () { x.status = 'approved'; save(true); rerender() } } }, 'Approve') : null,
        x.status === 'error' || (x.check && x.check.warnings && x.check.warnings.length) ? h('button', { className: 'small', on: { click: function () { promptBox('Fix ' + id, TPL.shotFix(P, c, id, x.code, x.check ? x.check.errors.concat(x.check.warnings) : [], ''), 'Fix prompt') } } }, 'Copy fix prompt') : null),
        x.check ? msgs(x.check.errors, x.check.warnings) : null);
    }
    var badIds = t.ids.filter(function (id) { return (S[id] || {}).status === 'error' });
    return h('div', { className: 'ticket' + (done ? ' ok' : bad ? ' bad' : ''), id: 'stk-' + cid + '-' + t.n },
      h('div', { className: 'row' }, chatTag(t), h('b', null, 'shots ' + t.ids[0] + (t.ids.length > 1 ? '–' + t.ids[t.ids.length - 1] : '') + ' (' + t.ids.length + ')'), done ? badge('✓ done', 'b-ok') : statusBadge(t.status), h('span', { className: 'grow' }),
        done ? null : h('button', { className: t.status === 'waiting' ? '' : 'ghost', disabled: !Object.keys(assetCodes()).length, on: { click: function () { t.status = t.status === 'waiting' ? 'copied' : t.status; save(); promptBox('Chat ' + chatNo(t) + ' prompt', TPL.shotTicket(P, c, t), 'Chat ' + chatNo(t) + ' prompt', noteChat(t)); renderSide() } } }, 'Copy prompt'),
        done ? null : h('button', { className: t.status === 'waiting' ? 'ghost' : '', on: { click: function () { fromClipboard().then(function (x) { t.answer = x; ta.value = x; save(); check() }).catch(pasteFail) } } }, '📋 Paste & check')),
      out, badIds.map(shotRow),
      h('details', { className: 'fold' }, h('summary', null, 'All shots in this chat, chat link, paste by hand'), h('div', { className: 'in' },
        chatRow(t), t.ids.filter(function (id) { return badIds.indexOf(id) < 0 }).map(shotRow),
        resultFiles(function (x) { t.answer = x; ta.value = x; save(); check() }),
        ta, h('div', { className: 'row', style: 'margin-top:6px' }, h('button', { className: 'blue', on: { click: check } }, 'Check'),
          h('button', { className: 'ok', on: { click: function () { t.ids.forEach(function (id) { var x = S[id]; if (x && x.status === 'checked') x.status = 'approved' }); save(true); rerender() } } }, 'Approve all ✓')))));
  }

  /* =================================================================
     8) WATCH & FIX
     ================================================================= */
  var CURSHOT = null, PLAYING = false, CAPS = true, QUALITY = +(localStorage.getItem('quality') || 540), SHOTINFO = null;
  /* ---------------- sound & captions settings (shared by Project + Watch) ---------------- */
  function lookOf() { return Object.assign({ film: .8, atmos: .8, fg: true, focus: .8 }, P.look || {}) }
  function planSizes() { var o = {}; ((P.plan && P.plan.assets) || []).forEach(function (a) { if (+a.size > 0 && a.kind !== 'set') o[a.name] = +a.size }); o.kato = 2.66; o.nia = 2.64; return o }
  function mixOf() { return Object.assign({ narr: 1, sfx: 1, music: .25, duck: true }, P.mix || {}) }
  function capOf() { return Object.assign({ size: 1, pos: 0, color: '#f2c14e', group: 3 }, P.capStyle || {}) }
  function media(cid) { return Promise.all([DB.getFile(P.id + ':' + cid), DB.getFile(P.id + ':music')]).then(function (r) { return { audio: r[0] || null, music: r[1] || null } }) }
  function soundCard(onChange) {
    var M = mixOf(), C = capOf(), fileIn = h('input', { type: 'file', accept: 'audio/*', hidden: true });
    function set() { P.mix = M; P.capStyle = C; save(); if (onChange) onChange() }
    function slider(label, obj, key, min, max, step, fmt) {
      var val = h('span', { className: 'muted small', style: 'width:44px;display:inline-block' }, fmt(obj[key]));
      return h('div', { className: 'row', style: 'margin:4px 0' }, h('span', { style: 'width:150px' }, label), h('input', { type: 'range', min: min, max: max, step: step, value: obj[key], style: 'width:180px', on: { input: function () { obj[key] = +this.value; val.textContent = fmt(obj[key]) }, change: set } }), val);
    }
    function pct(v) { return Math.round(v * 100) + '%' }
    fileIn.onchange = function () { var f = fileIn.files[0]; if (!f) return; DB.putFile(P.id + ':music', f).then(function () { P.musicName = f.name; save(true); rerender(); toast('Music saved.'); if (onChange) onChange() }) };
    var LK = lookOf();
    function setL() { P.look = LK; save(); if (onChange) onChange(true) }
    function lslider(label, key, hint) { var val = h('span', { className: 'muted small', style: 'width:44px;display:inline-block' }, pct(LK[key])); return h('div', { className: 'row', style: 'margin:4px 0' }, h('span', { style: 'width:150px', title: hint }, label), h('input', { type: 'range', min: 0, max: 1.5, step: .05, value: LK[key], style: 'width:180px', on: { input: function () { LK[key] = +this.value; val.textContent = pct(LK[key]) }, change: setL } }), val) }
    return h('div', null, h('div', { className: 'card' }, h('h3', null, 'Look'),
      h('p', { className: 'muted small', style: 'margin:0 0 6px' }, 'Keep these low for a clean, calm video. 80% is the tuned default.'),
      lslider('Film look', 'film', 'grain, gentle frame wobble, warm glow around bright lights'),
      lslider('Atmosphere', 'atmos', 'depth haze, floating dust/bubbles/snow, soft light beams'),
      lslider('Attention focus', 'focus', 'softly darkens and blurs everything around whoever is talking or acting, so viewers look at the right thing'),
      h('label', { style: 'display:flex;gap:6px;align-items:center;color:var(--ink)' }, h('input', { type: 'checkbox', checked: LK.fg, on: { change: function () { LK.fg = this.checked; setL() } } }), 'Blurred dark shapes in the foreground (adds depth to medium and full shots)')),
    h('div', { className: 'card g2' },
      h('div', null, h('h3', null, 'Sound'),
        h('div', { className: 'row', style: 'margin-bottom:6px' }, P.musicName ? badge('music: ' + P.musicName, 'b-ok') : badge('no music', ''),
          h('button', { className: 'ghost small', on: { click: function () { fileIn.click() } } }, P.musicName ? 'Change music' : 'Add background music'), fileIn,
          P.musicName ? h('button', { className: 'ghost small danger', on: { click: function () { DB.delFile(P.id + ':music').then(function () { P.musicName = ''; save(true); rerender(); if (onChange) onChange() }) } } }, 'Remove') : null),
        h('p', { className: 'muted small', html: 'Free music: <a href="https://www.youtube.com/audiolibrary" target="_blank">YouTube Audio Library</a> (YouTube Studio → Audio library). It loops and gets quieter while the narrator talks.' }),
        slider('Narration', M, 'narr', 0, 1.5, .05, pct), slider('Sound effects', M, 'sfx', 0, 1.5, .05, pct), slider('Music', M, 'music', 0, .8, .01, pct),
        h('label', { style: 'display:flex;gap:6px;align-items:center;color:var(--ink)' }, h('input', { type: 'checkbox', checked: M.duck, on: { change: function () { M.duck = this.checked; set() } } }), 'Lower the music while the narrator talks')),
      h('div', null, h('h3', null, 'Captions'),
        slider('Size', C, 'size', .6, 1.6, .05, pct),
        slider('Height (0 = auto)', C, 'pos', 0, .92, .01, function (v) { return v ? Math.round(v * 100) + '%' : 'auto' }),
        slider('Words at a time', C, 'group', 1, 6, 1, function (v) { return v }),
        h('div', { className: 'row' }, h('span', { style: 'width:150px' }, 'Spoken word colour'), h('input', { type: 'color', value: C.color, on: { change: function () { C.color = this.value; set() } } })))));
  }
  function planSig() { return P.cuts.map(function (c) { return c.id + ':' + (c.lines || []).map(function (l) { return l.text }).join('|') }).join('#') }
  function staleBanner() {
    if (!P.plan || !P.planSig || P.planSig === planSig()) return null;
    return h('div', { className: 'card', style: 'border-color:#7a6231;background:#2e2616' }, badge('⚠ The script or timing changed after the plan was made', 'b-warn'),
      h('p', { className: 'small', style: 'margin:6px 0 0' }, 'Shot lines may not match the narration any more. Re-do the Plan (Copy plan prompt again), or click "Keep plan" if the lines are the same.'),
      h('div', { className: 'row', style: 'margin-top:6px' }, h('button', { className: 'small', on: { click: function () { go('plan') } } }, 'Go to Plan'), h('button', { className: 'ghost small', on: { click: function () { P.planSig = planSig(); save(); rerender() } } }, 'Keep plan')));
  }
  /* ---------- which chat makes which group, and result files from the chats ---------- */
  function noteChat(t) { return function (model) { t.chat = t.chat || { model: '', label: '', link: '' }; if (!t.chat.model) t.chat.model = model; if (!t.chat.label) t.chat.label = model + ' ' + t.n; save() } }
  function chatRow(t) {
    var c = t.chat || (t.chat = { model: '', label: '', link: '' });
    function set(k, v) { c[k] = v; save() }
    return h('div', { className: 'row', style: 'margin:6px 0' }, h('span', { className: 'muted small' }, 'Made in:'),
      h('select', { 'data-tip': 'Which AI is making this group. Filled in by itself when you use the Open buttons.', on: { change: function () { set('model', this.value); rerender() } } }, ['', 'Qwen', 'DeepSeek', 'Claude', 'ChatGPT', 'Gemini', 'Other'].map(function (m) { return h('option', { value: m, selected: c.model === m }, m || 'which AI?') })),
      h('input', { placeholder: 'chat name / number', value: c.label || '', style: 'width:170px', 'data-tip': 'A name so you can find this chat again, e.g. "Qwen 3". Use the same name in the chat\'s title.', on: { input: function () { set('label', this.value) } } }),
      h('input', { placeholder: 'paste the chat\'s link (optional)', value: c.link || '', style: 'flex:1;min-width:180px', 'data-tip': 'Copy the address of that chat from the browser bar and paste it here. Then Open this chat takes you straight back to it.', on: { input: function () { set('link', this.value.trim()) }, change: rerender } }),
      c.link ? h('button', { className: 'ghost small', on: { click: function () { window.open(c.link, '_blank', 'noopener') } } }, 'Open this chat') : null);
  }
  function readResultFiles(files) {
    return Promise.all([].map.call(files, function (f) {
      return f.text().then(function (t) {
        if (/\.html?$/i.test(f.name) || /<script[\s>]/i.test(t)) {
          var doc = new DOMParser().parseFromString(t, 'text/html'), js = [].map.call(doc.querySelectorAll('script:not([src])'), function (x) { return x.textContent }).filter(function (x) { return /KIT\.asset|SHOT\s*\(/.test(x) });
          if (js.length) return js.join('\n\n');
        }
        return t;
      });
    })).then(function (parts) { return parts.join('\n\n') });
  }
  function resultFiles(onText) {
    var fi = h('input', { type: 'file', multiple: true, accept: '.html,.htm,.js,.txt,.md,.json', hidden: true, on: { change: function () { var f = this.files; if (f && f.length) readResultFiles(f).then(onText); this.value = '' } } });
    var z = h('div', { className: 'drop', style: 'padding:10px;margin:6px 0', on: { click: function (e) { if (e.target.tagName !== 'BUTTON') fi.click() }, dragover: function (e) { e.preventDefault(); z.classList.add('over') }, dragleave: function () { z.classList.remove('over') }, drop: function (e) { e.preventDefault(); z.classList.remove('over'); if (e.dataTransfer.files.length) readResultFiles(e.dataTransfer.files).then(onText) } } },
      h('span', { className: 'small' }, 'Got files from the chat (.html, .js, .txt)? Drop them here or '), h('button', { className: 'ghost small', on: { click: function () { fi.click() } } }, 'Upload result files'), fi);
    return z;
  }
  function chatBoard(tickets, kind, cid) {
    if (!tickets || tickets.length < 2) return null;
    var bag = kind === 'shot' ? (P.shots[cid] || {}) : P.assets;
    return h('div', { className: 'card' }, h('h3', null, 'Chat board: which chat makes what'),
      h('table', null, h('tr', null, h('th', null, 'Group'), h('th', null, 'Makes'), h('th', null, 'Chat'), h('th', null, 'Status'), h('th', null, '')),
        tickets.map(function (t) {
          var ids = t.ids || t.names, done = ids.filter(function (n) { return (bag[n] || {}).status === 'approved' }).length, c = t.chat || {};
          return h('tr', null, h('td', null, '#' + t.n), h('td', { className: 'muted' }, ids.join(', ')),
            h('td', null, c.model || c.label ? (c.label || c.model) : h('span', { className: 'muted' }, 'not started')),
            h('td', null, done === ids.length ? badge('✓ done', 'b-ok') : statusBadge(t.status), ' ', h('span', { className: 'muted small' }, done + '/' + ids.length)),
            h('td', null, c.link ? h('button', { className: 'ghost small', on: { click: function () { window.open(c.link, '_blank', 'noopener') } } }, 'Open chat') : null,
              h('button', { className: 'ghost small', on: { click: function () { var el = document.getElementById((kind === 'shot' ? 'stk-' + cid + '-' : 'atk-') + t.n); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) } } }, 'Go to')));
        })));
  }
  function smartPaste(kind, cid) {
    var ta = h('textarea', { placeholder: 'Paste ANY chat answer here — the app finds which ' + (kind === 'shot' ? 'shots' : 'assets') + ' it contains and checks them.', style: 'min-height:70px' }), out = h('div');
    return h('div', { className: 'card' }, h('h3', null, '⚡ Smart paste'), ta, resultFiles(function (x) { ta.value = x; ta.parentNode.querySelector('button.blue').click() }),
      h('div', { className: 'row', style: 'margin-top:6px' }, h('button', { className: 'blue', on: { click: function () {
        var r = storeBlocks(ta.value, kind, cid); out.innerHTML = '';
        if (!r.names.length) { out.appendChild(msgs(['Nothing found. The answer must contain ' + (kind === 'shot' ? "SHOT('id', {...})" : "KIT.asset('name', ...)") + '.'])); return }
        out.textContent = 'Found: ' + r.names.join(', ') + ' — checking…';
        var job = kind === 'shot' ? checkShots(cid, r.names) : checkAssets(r.names);
        job.then(function () {
          var tickets = kind === 'shot' ? P.shotTickets[cid] : P.assetTickets;
          tickets.forEach(function (t) { var ids = t.ids || t.names; if (ids.some(function (n) { return r.names.indexOf(n) >= 0 })) { var bag = kind === 'shot' ? P.shots[cid] : P.assets; t.status = ids.every(function (n) { var x = bag[n] || {}; return x.status === 'checked' || x.status === 'approved' }) ? 'checked' : (ids.some(function (n) { return (bag[n] || {}).status === 'error' }) ? 'error' : 'pasted') } });
          save(true); rerender(); toast('Checked: ' + r.names.join(', '));
        }).catch(function (e) { out.textContent = 'Error: ' + e.message });
      } } }, 'Find & check')), out);
  }
  function approveAll(bag, names) { var n = 0; names.forEach(function (k) { var x = bag[k]; if (x && x.status === 'checked') { x.status = 'approved'; n++ } }); save(true); rerender(); toast(n ? 'Approved ' + n + '.' : 'Nothing new to approve (only ✓ checked items can be approved).') }
  function progressCard() {
    if (!P.plan) return null;
    var A = P.plan.assets, aOk = A.filter(function (a) { return (P.assets[a.name] || {}).status === 'approved' }).length;
    return h('div', { className: 'card' }, h('h3', null, 'Progress'),
      h('div', { className: 'row' }, badge('Assets ' + aOk + '/' + A.length, aOk === A.length ? 'b-ok' : 'b-blue'),
        P.cuts.map(function (c) { var L = P.plan.cuts[c.id] || [], ok = L.filter(function (s) { return ((P.shots[c.id] || {})[s.id] || {}).status === 'approved' }).length; return badge(c.label + ': shots ' + ok + '/' + L.length + (c.hasAudio ? ' · audio ✓' : ' · no audio') + (c.exported ? ' · exported ✓' : ''), ok === L.length && L.length ? 'b-ok' : 'b-blue') })));
  }
  function playerPayload(cid, res) {
    return { mode: 'play', aspect: cutById(cid).aspect || '9:16', sky: sky(), name: (P.title || P.name) + ' - ' + cutById(cid).label, assets: assetCodes(), shots: shotCodes(cid), cut: cutPayload(cid), captions: CAPS, res: res || QUALITY, mix: mixOf(), capStyle: capOf(), look: lookOf(), sizes: planSizes(), keys: (P.plan && P.plan.keys) || null };
  }
  var SEL = null;   // { kind: 'shot' | 'trans', id }
  var TICON = { glide: '~', dissolve: '◆', dip: '●', push: '→', cut: '|' };
  function vWatch() {
    if (!P.plan) return h('div', null, h('h1', null, 'Edit & watch'), h('div', { className: 'card' }, badge('Make the plan first.', 'b-warn')));
    var c = cutById(CUT), plan = P.plan.cuts[CUT] || [], S = P.shots[CUT] || {}, ov = ((P.edits = P.edits || {})[CUT] = (P.edits[CUT] || {}));
    var times = PLAN.shotTimes(c, plan), dur = c.duration || 1, tlabel = h('span', { className: 'muted small' }, '0.0 / ' + dur.toFixed(1) + ' s'), pendSeek = null;
    var land = c.aspect === '16:9', frameBox = h('div', { className: 'pframe', style: 'position:relative;overflow:hidden' + (land ? ';width:520px;height:292px' : ';width:300px;height:533px') });
    var insp = h('div', { className: 'card inspector', style: 'margin:0' }), tl = h('div', { className: 'tl' }), head = h('div', { className: 'head' });
    function send(m) { if (PLAYER && PLAYER.contentWindow) PLAYER.contentWindow.postMessage(m, '*') }
    function load(seekTo) {
      if (PLAYER) PLAYER.remove(); PLAYING = false; if (pb) pb.textContent = '▶ Play'; pendSeek = seekTo == null ? null : seekTo;
      PLAYER = h('iframe', { src: stagePage(), style: 'width:100%;height:100%;border:0' }); frameBox.innerHTML = ''; frameBox.appendChild(PLAYER);
      media(CUT).then(function (md) { var pl = playerPayload(CUT); pl.audio = md.audio; pl.music = md.music; PLAYER.payload = pl });
    }
    window.onmessage = function (e) {
      if (!PLAYER || e.source !== PLAYER.contentWindow) return; var m = e.data || {};
      if (m.type === 'stage-ready') { var go2 = function () { if (PLAYER.payload) send({ type: 'load', payload: PLAYER.payload }); else setTimeout(go2, 50) }; go2() }
      if (m.type === 'ready') { SHOTINFO = m.info; drawLights(); if (pendSeek != null) { send({ type: 'seek', t: +pendSeek }); head.style.left = (pendSeek / dur * 100) + '%'; if (pendSeek.play) { send({ type: 'play' }); PLAYING = true; pb.textContent = '❚❚ Pause' } } drawInsp() }
      if (m.type === 'time') { tlabel.textContent = m.t.toFixed(1) + ' / ' + dur.toFixed(1) + ' s'; head.style.left = (m.t / dur * 100) + '%'; if (m.shot !== CURSHOT) { CURSHOT = m.shot } }
      if (m.type === 'shot-error') { var x = S[m.id]; if (x) { x.check = { ok: false, errors: [m.msg], warnings: [] }; x.status = 'error'; save(); drawTl() } }
      if (m.type === 'ended') { PLAYING = false; pb.textContent = '▶ Play' }
    };
    var pb = h('button', { on: { click: function () { PLAYING = !PLAYING; send({ type: PLAYING ? 'play' : 'pause' }); pb.textContent = PLAYING ? '❚❚ Pause' : '▶ Play' } } }, '▶ Play');
    function seek(t, play) { var v = new Number(Math.max(0, t)); v.play = play; send({ type: 'seek', t: +v }); head.style.left = (v / dur * 100) + '%'; if (play) { send({ type: 'play' }); PLAYING = true; pb.textContent = '❚❚ Pause' } }
    document.onkeydown = function (e) { if (STEP !== 'watch' || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName)) return; if (e.code === 'Space') { e.preventDefault(); pb.click() } if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { var i = plan.findIndex(function (s) { return s.id === CURSHOT }), j = Math.max(0, Math.min(plan.length - 1, i + (e.code === 'ArrowRight' ? 1 : -1))); SEL = { kind: 'shot', id: plan[j].id }; seek(times[j].from + .05); drawTl(); drawInsp() } };
    /* ---- the timeline ---- */
    function drawTl() {
      tl.innerHTML = ''; tl.appendChild(head);
      var ruler = h('div', { className: 'ruler' }); for (var t = 0; t <= dur; t += dur > 90 ? 15 : dur > 40 ? 10 : 5) ruler.appendChild(h('span', { style: 'left:' + (t / dur * 100) + '%' }, Math.floor(t / 60) + ':' + ('0' + Math.round(t % 60)).slice(-2))); tl.appendChild(ruler);
      plan.forEach(function (s, i) {
        var tm = times[i], x = S[s.id] || {}, err = x.status === 'error' || (SHOTINFO && SHOTINFO.errors && SHOTINFO.errors[s.id]);
        tl.appendChild(h('div', { className: 'blk' + (SEL && SEL.kind === 'shot' && SEL.id === s.id ? ' sel' : '') + (err ? ' bad' : '') + (!x.code ? ' todo' : ''), style: 'left:calc(' + (tm.from / dur * 100) + '% + 1px);width:calc(' + ((tm.to - tm.from) / dur * 100) + '% - 2px)', title: s.id + ' · ' + s.show,
          on: { click: function (e) { e.stopPropagation(); SEL = { kind: 'shot', id: s.id }; seek(tm.from + .05); drawTl(); drawInsp() } } }, s.id, h('small', null, s.set)));
        if (i) {
          var tr = EDIT.trans(P.plan, CUT, i, ov);
          tl.appendChild(h('div', { className: 'tr' + (tr.type === 'cut' ? ' cut' : '') + (SEL && SEL.kind === 'trans' && SEL.id === s.id ? ' sel' : ''), style: 'left:' + (tm.from / dur * 100) + '%', title: 'Transition into ' + s.id + ': ' + tr.type + (tr.auto ? ' (auto)' : ''),
            on: { click: function (e) { e.stopPropagation(); SEL = { kind: 'trans', id: s.id }; seek(tm.from - 1.2); drawTl(); drawInsp() } } }, TICON[tr.type] || '|'));
        }
      });
    }
    tl.onclick = function (e) { var r = tl.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * dur) };
    /* ---- the inspector (right) ---- */
    function drawInsp() {
      insp.innerHTML = '';
      if (!SEL) { insp.appendChild(h('div', null, h('h3', null, 'Click the timeline'), h('p', { className: 'muted small' }, 'Click a shot (a block) to see and fix it. Click a round marker between two shots to change the transition. Space = play/pause, ← → = previous/next shot.'))); return }
      var i = plan.findIndex(function (s) { return s.id === SEL.id }), s = plan[i]; if (!s) { SEL = null; return drawInsp() }
      var tm = times[i];
      if (SEL.kind === 'trans') {
        var tr = EDIT.trans(P.plan, CUT, i, ov), cur = (ov[s.id] || {}).trans || 'auto', prev = plan[i - 1];
        var sel = h('select', { style: 'width:100%', on: { change: function () { (ov[s.id] = ov[s.id] || {}).trans = this.value; save(); drawTl(); drawInsp(); load(tm.from - 1.5) } } }, EDIT.TYPES.map(function (o) { return h('option', { value: o[0], selected: cur === o[0] }, o[1] + (o[0] === 'auto' ? ' → ' + EDIT.auto(plan, i) : '')) }));
        var len = h('input', { type: 'range', min: .3, max: 1.6, step: .1, value: tr.for || .7, style: 'width:100%', on: { change: function () { (ov[s.id] = ov[s.id] || {}).tlen = +this.value; save(); drawInsp(); load(tm.from - 1.5) } } });
        insp.appendChild(h('div', null, h('h3', null, 'Transition ' + prev.id + ' → ' + s.id),
          h('p', { className: 'muted small' }, (prev.set === s.set ? 'Same place (' + s.set + ')' : prev.set + ' → ' + s.set) + '. Now: ' + tr.type + (tr.auto ? ' (chosen by the rule)' : ' (your choice)') + '.'),
          h('label', null, 'Type'), sel, tr.type !== 'cut' ? h('div', null, h('label', null, 'Length: ' + (+tr.for).toFixed(1) + ' s'), len) : null,
          h('div', { className: 'row', style: 'margin-top:10px' }, h('button', { on: { click: function () { load(new Number(tm.from - 1.5)); pendSeek.play = true } } }, '▶ Watch it'),
            h('button', { className: 'ghost small', 'data-tip': 'Use this transition for every join between shots in the same place.', on: { click: function () { var ty = sel.value; plan.forEach(function (q, k) { if (k && plan[k - 1].set === q.set) (ov[q.id] = ov[q.id] || {}).trans = ty }); save(); drawTl(); load(tm.from - 1.5); toast('Applied to all same-place joins.') } } }, 'Same for all same-place'))));
        return;
      }
      var x = S[s.id] || (S[s.id] = { code: '', versions: [], status: 'todo' });
      var warnings = SHOTINFO && SHOTINFO.warnings && SHOTINFO.warnings[s.id] || [], err = SHOTINFO && SHOTINFO.errors && SHOTINFO.errors[s.id];
      var note = h('textarea', { value: x.note || '', placeholder: 'What should change? e.g. "camera too close", "show the brain when he says brain", "make it darker"', style: 'min-height:60px', on: { input: function () { x.note = this.value; save() } } });
      var ans = h('textarea', { placeholder: 'Paste the fixed SHOT(\'' + s.id + '\', …) here', style: 'min-height:50px' }), res = h('div');
      var miss = x.code ? PLAN.missingDetails(x.code, PLAN.shotDetails(P.plan, CUT, s)) : [];
      insp.appendChild(h('div', null, h('div', { className: 'row' }, h('h3', { style: 'margin:0' }, 'Shot ' + s.id), statusBadge(x.code ? x.status : 'todo'), h('span', { className: 'muted small' }, tm.from.toFixed(1) + '–' + tm.to.toFixed(1) + ' s')),
        h('p', { className: 'small', style: 'margin:6px 0' }, '"' + c.lines.slice(s.lines[0], s.lines[1] + 1).map(function (l) { return l.text }).join(' ') + '"'),
        h('p', { className: 'muted small', style: 'margin:0 0 6px' }, s.show), h('div', null, (s.cast || []).map(assetChip)),
        err ? msgs([err]) : null, miss.length ? msgs([], miss.map(function (d) { return 'Not shown on "' + d.word + '": ' + d.show })) : null,
        warnings.length ? h('details', { className: 'fold' }, h('summary', null, warnings.length + ' notes'), h('div', { className: 'in' }, msgs([], warnings))) : null,
        note,
        h('div', { className: 'row', style: 'margin-top:6px' },
          h('button', { className: 'small', on: { click: function () { x.flag = true; save(); promptBox('Fix shot ' + s.id, TPL.shotFix(P, c, s.id, x.code, (err ? [err] : []).concat(warnings).concat(miss.map(function (d) { return 'Show "' + d.word + '": ' + d.show })), x.note, true), 'Fix prompt') } } }, 'Copy fix prompt'),
          h('button', { className: 'ghost small', on: { click: function () { exportVideoHtml(CUT) } } }, 'Video HTML'),
          x.code ? h('button', { className: 'ghost small', on: { click: function () { promptBox('Code of ' + s.id, x.code, 'Code') } } }, 'Code') : null,
          x.versions && x.versions.length ? h('button', { className: 'ghost small', on: { click: function () { var v = x.versions.pop(); x.code = v.code; save(true); load(tm.from + .05) } } }, 'Undo (' + x.versions.length + ')') : null),
        h('details', { className: 'fold', open: !!x.flag }, h('summary', null, 'Paste the fixed shot'), h('div', { className: 'in' }, ans,
          h('div', { className: 'row', style: 'margin-top:6px' }, h('button', { className: 'blue small', on: { click: function () {
            var r = storeBlocks(ans.value, 'shot', CUT); if (r.names.indexOf(s.id) < 0) { res.innerHTML = ''; res.appendChild(msgs(['No SHOT(\'' + s.id + '\', …) in the pasted text.'])); return }
            res.textContent = 'Checking…';
            checkShots(CUT, [s.id]).then(function (rr) { var q = rr[s.id]; if (q.ok) { x.flag = false; x.status = 'approved'; toast('Shot ' + s.id + ' updated.') } save(true); load(tm.from + .05); drawTl(); drawInsp() });
          } } }, 'Apply & check'), h('button', { className: 'ok small', on: { click: function () { x.status = 'approved'; x.flag = false; save(); drawTl(); drawInsp() } } }, 'Looks good ✓')), res))));
      if (window.GUIDE) GUIDE.applyTips(insp);
    }
    load(); drawTl(); drawInsp();
    // director's report (redrawn when the player has built the film and counted the real camera cuts)
    var lights = h('div', { className: 'lights', style: 'margin:6px 0 10px' });
    function drawLights() {
      var R = EDIT.report(P, CUT, SHOTINFO); lights.innerHTML = ''; if (!R) return;
      var L = R.lights, li = function (k, txt, tip) { return h('div', { className: 'light ' + k, 'data-tip': tip }, h('i'), txt) };
      lights.append(
        li(L.pace, 'A new picture every ' + R.perChange.toFixed(1) + ' s', 'How often the picture changes (shot changes and camera cuts). 5 s or more feels calm and clear; under 3.5 s feels choppy.'),
        li(L.made, R.notMade.length ? R.notMade.length + ' shots not made' : 'All shots made', 'Shots that have no code yet show a grey placeholder.'),
        li(L.show, R.gaps.length + R.details.length ? (R.gaps.length + R.details.length) + ' things not shown' : 'Everything named is shown', 'Things the narration names that no asset or shot shows. Fix them on Plan (Add) or in the shot (Copy fix prompt).'),
        li(L.short, R.short.length ? R.short.length + ' very short shots' : 'No very short shots', 'Shots under 2.5 seconds. Change their transition to Glide or ask for them to be joined.'),
        li('ok', R.soft + ' smooth joins · ' + R.hard + ' hard cuts', 'Smooth joins = glide, dissolve, fade or push. Hard cuts are kept for shocks.'));
      if (window.GUIDE) GUIDE.applyTips(lights);
    }
    drawLights();
    var assetFix = h('details', { className: 'fold' }, h('summary', null, 'Fix an asset (changes every shot that uses it)'), h('div', { className: 'in' },
      (function () {
        var sel = h('select', null, P.plan.assets.map(function (a) { return h('option', { value: a.name }, a.name) })), note = h('input', { placeholder: 'What is wrong with it?', style: 'flex:1;min-width:200px' }), ans = h('textarea', { placeholder: 'Paste the fixed KIT.asset(…) here', style: 'min-height:60px' }), out = h('div');
        return h('div', null, h('div', { className: 'row' }, sel, note, h('button', { className: 'small', on: { click: function () { var a = P.assets[sel.value] || {}; promptBox('Fix ' + sel.value, TPL.assetFix(P, sel.value, a.code, [], note.value), 'Fix prompt') } } }, 'Copy fix prompt')), ans,
          h('button', { className: 'blue small', style: 'margin-top:6px', on: { click: function () { var r = storeBlocks(ans.value, 'asset'); if (!r.names.length) { out.textContent = 'No KIT.asset found.'; return } out.textContent = 'Checking…'; checkAssets(r.names).then(function (rs) { out.innerHTML = ''; r.names.forEach(function (n) { var q = rs[n]; if (q) { if (q.ok) P.assets[n].status = 'approved'; out.appendChild(h('div', null, h('b', null, n + ': '), q.ok ? '✅ updated' : '', msgs(q.errors, q.warnings))) } }); save(true); load() }) } } }, 'Apply & check'), out);
      })()));
    return h('div', null,
      staleBanner(), h('div', { className: 'row' }, h('h1', { style: 'margin:0' }, 'Edit & watch'), h('span', { className: 'grow' }), P.cuts.length > 1 ? cutTabs(function () { CURSHOT = null; SHOTINFO = null; SEL = null }) : null),
      lights,
      h('div', { className: 'editor' },
        h('div', null, frameBox,
          h('div', { className: 'row', style: 'margin-top:8px' }, pb, tlabel, h('span', { className: 'grow' }),
            h('label', { style: 'margin:0;display:flex;gap:4px;align-items:center;color:var(--ink)' }, h('input', { type: 'checkbox', checked: CAPS, on: { change: function () { CAPS = this.checked; send({ type: 'captions', on: CAPS }) } } }), 'captions'),
            h('select', { title: 'Preview quality', on: { change: function () { QUALITY = +this.value; localStorage.setItem('quality', QUALITY); load() } } }, [[360, 'fast'], [540, 'good'], [720, 'better'], [1080, 'full']].map(function (q) { return h('option', { value: q[0], selected: QUALITY === q[0] }, q[1]) })))),
        insp),
      tl, h('p', { className: 'muted small' }, 'Blocks = shots (striped = not made, red = needs a fix). Round markers = transitions: ~ glide · ◆ dissolve · ● fade through dark · → push · | hard cut. Click to change.'),
      h('details', { className: 'fold' }, h('summary', null, 'Look, sound, music and captions'), h('div', { className: 'in' }, soundCard(function (lookChanged) { if (lookChanged) load(); else send({ type: 'style', capStyle: capOf(), mix: mixOf() }) }))),
      assetFix,
      nextBtn('export', 'Next: Export →'));
  }

  /* ---------------- standalone video HTML (for the AI or to share) ---------------- */
  function exportVideoHtml(cid) {
    var ST = styleOf(), LPS = ST !== 'paper', files = ST === 'facet' ? ['facet/facet-kit.js', 'facet/facet-motion.js', 'kit/facet/stagekit.js', 'kit/stage.js'] : ST === 'lowpoly' ? ['kit/lp/engine.js', 'kit/lp/rig.js', 'kit/lp/people.js', 'kit/lp/render.js', 'kit/lp/director.js', 'kit/lp/check.js', 'kit/piano.js', 'kit/sound.js', 'kit/stage.js'] : ['kit/style-kit.js', 'kit/director.js', 'kit/piano.js', 'kit/sound.js', 'kit/stage.js'];
    Promise.all(files.map(function (f) { return fetch(f).then(function (r) { return r.text() }) })).then(function (src) {
      var pl = playerPayload(cid, 720); delete pl.assets; delete pl.shots; pl.standalone = true;
      var A = assetCodes(), S = shotCodes(cid);
      function block(type, name, code) { return '<script type="text/x-' + type + '" data-name="' + esc(name) + '">\n' + String(code).replace(/<\/script/gi, '<\\/script') + '\n</script>' }
      var html = '<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(pl.name) + '</title></head>\n<body style="margin:0;background:#0d0b10"><div id="msg" style="color:#e9dfc8;font:14px sans-serif;padding:20px">Loading…</div>\n' +
        '<!-- ============ VIDEO: ' + esc(pl.name) + ' ============\n  This file is a whole video made with the "' + (ST === 'facet' ? 'Facet' : LPS ? 'Low-Poly Paper' : 'Dark Paper Cinema') + '" kit.\n  READ: the ASSETS (KIT.asset blocks), the SHOTS (SHOT blocks) and the TIMING (words with seconds).\n  The LOCKED KIT at the bottom draws everything — do not edit or re-explain it.\n  Audio is not included; open the file in Chrome and press Play to watch it silently with captions.\n-->\n' +
        '<!-- ============ ASSETS ============ -->\n' + Object.keys(A).map(function (n) { return block('asset', n, A[n]) }).join('\n') + '\n' +
        '<!-- ============ SHOTS (in order) ============ -->\n' + (P.plan.cuts[cid] || []).filter(function (s) { return S[s.id] }).map(function (s) { return block('shot', s.id, S[s.id]) }).join('\n') + '\n' +
        '<!-- ============ TIMING + SHOT LIST ============ -->\n<script>window.STAGE_PAYLOAD = ' + JSON.stringify(pl) + ';\nwindow.STAGE_PAYLOAD.assets = {}; window.STAGE_PAYLOAD.shots = {};\n[].forEach.call(document.querySelectorAll(\'script[type="text/x-asset"]\'), function (s) { STAGE_PAYLOAD.assets[s.dataset.name] = s.textContent });\n[].forEach.call(document.querySelectorAll(\'script[type="text/x-shot"]\'), function (s) { STAGE_PAYLOAD.shots[s.dataset.name] = s.textContent });</script>\n' +
        '<!-- ============ LOCKED KIT (do not edit) ============ -->\n' + (LPS ? '' : '<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>') + '\n' +
        src.map(function (s) { return '<script>\n' + s + '\n</script>' }).join('\n') + '\n</body></html>';
      download(slug(pl.name) + '.html', new Blob([html], { type: 'text/html' }));
      toast('Video HTML downloaded. Attach it in the chat together with the fix prompt.', 4500);
    }).catch(function (e) { toast('Could not read the kit files (' + e.message + '). Open the app from GitHub Pages or a local server.', 6000) });
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video' }

  /* =================================================================
     9) EXPORT
     ================================================================= */
  function stageModal(title, payload, handlers, size) {
    var box = h('div', { style: 'height:100%;display:flex;flex-direction:column;align-items:center;gap:10px' }), info = h('div', { style: 'font-weight:700' }, 'Preparing…');
    var wh = size || [360, 640], fr = h('div', { style: 'width:' + wh[0] + 'px;height:' + wh[1] + 'px;flex:none' }), f = h('iframe', { src: stagePage(), style: 'width:100%;height:100%;border:0;border-radius:8px' });
    box.append(info, fr); fr.appendChild(f);
    function on(e) {
      if (e.source !== f.contentWindow) return; var m = e.data || {};
      if (m.type === 'stage-ready') f.contentWindow.postMessage({ type: 'load', payload: payload }, '*');
      if (m.type === 'fatal') info.textContent = '✖ ' + m.msg;
      if (handlers[m.type]) handlers[m.type](m, info, f);
    }
    window.addEventListener('message', on);
    modal(title, box, function () { try { f.contentWindow.postMessage({ type: 'cancel' }, '*') } catch (e) { } window.removeEventListener('message', on) });
    return f;
  }
  function frameSize(cid) { return cutById(cid).aspect === '16:9' ? [640, 360] : [360, 640] }
  function vExport() {
    function exportVideo(cid) {
      var c = cutById(cid);
      media(cid).then(function (md) {
        var pl = playerPayload(cid, 1080); pl.mode = 'export'; pl.audio = md.audio; pl.music = md.music; pl.captions = CAPS; pl.fps = 30;
        stageModal('Exporting: ' + c.label + ' (keep this tab open)', pl, {
          'ready': function (m, info) { info.textContent = 'Building…' },
          'export-progress': function (m, info) { info.textContent = m.stage === 'audio' ? 'Mixing narration + sound effects…' : 'Rendering frames: ' + Math.round(m.done * 100) + '%' + (m.eta ? ' · about ' + Math.ceil(m.eta / 60) + ' min left' : '') },
          'export-fallback': function (m, info) { info.textContent = m.msg },
          'time': function (m, info) { info.textContent = 'Recording in real time… ' + m.t.toFixed(1) + ' / ' + c.duration.toFixed(1) + ' s' },
          'exported': function (m, info) { download(slug((P.title || P.name) + '-' + c.label) + '.' + m.ext, m.blob); info.textContent = '✅ Done in ' + Math.round(m.seconds) + ' s — ' + m.ext.toUpperCase() + ' (' + m.codec + '), ' + (m.blob.size / 1048576).toFixed(1) + ' MB. Upload it to YouTube.'; c.exported = Date.now(); save() },
          'recorded': function (m, info) { download(slug((P.title || P.name) + '-' + c.label) + '.webm', m.blob); info.textContent = '✅ Done (.webm). YouTube accepts it directly.' }
        }, frameSize(cid));
      });
    }
    function exportProject(withAudio) {
      var data = JSON.parse(JSON.stringify(P)), jobs = [];
      if (withAudio) P.cuts.forEach(function (c) { jobs.push(DB.getFile(P.id + ':' + c.id).then(function (b) { if (!b) return; return new Promise(function (res) { var r = new FileReader(); r.onload = function () { (data.audio = data.audio || {})[c.id] = r.result; res() }; r.readAsDataURL(b) }) })) });
      Promise.all(jobs).then(function () { download(slug(P.name) + '.project.json', new Blob([JSON.stringify(data)], { type: 'application/json' })) });
    }
    return h('div', null,
      h('h1', null, 'Export'), h('p', { className: 'lead' }, 'Makes the final video file: every frame rendered at full quality (1080 × 1920, or 1920 × 1080 for 16:9), with narration, sound effects and captions. It does not depend on how fast your PC is — a slow PC just takes longer.'),
      levelUpCard(),
      P.cuts.map(function (c) {
        var missing = P.plan ? (P.plan.cuts[c.id] || []).filter(function (s) { return !((P.shots[c.id] || {})[s.id] || {}).code }).length : 0;
        return h('div', { className: 'card' }, h('div', { className: 'row' }, h('h3', { style: 'margin:0' }, c.label), badge(c.aspect || '9:16'), c.hasAudio ? badge('audio ✓', 'b-ok') : badge('no audio — silent video', 'b-warn'), missing ? badge(missing + ' shots not made', 'b-warn') : null, c.exported ? badge('exported ✓', 'b-ok') : null, h('span', { className: 'grow' }),
          h('button', { disabled: !P.plan, on: { click: function () { exportVideo(c.id) } } }, 'Export video (MP4)'),
          h('button', { className: 'ghost', disabled: !P.plan, on: { click: function () { exportVideoHtml(c.id) } } }, 'Video HTML')));
      }),
      h('div', { className: 'card' }, h('h3', null, 'Project file'), h('p', { className: 'muted small' }, 'Back up the project or move it to another PC (use Import at the top).'),
        h('div', { className: 'row' }, h('button', { className: 'ghost', on: { click: function () { exportProject(false) } } }, 'Export project'), h('button', { className: 'ghost', on: { click: function () { exportProject(true) } } }, 'Export project + audio'))),
      h('p', { className: 'muted small' }, 'Chrome makes an MP4 (H.264 + AAC). If your browser can\'t, the app makes a WebM instead, which YouTube also accepts.'),
      nextBtn('publish', 'Next: Publish →'));
  }

  /* =================================================================
     10) PUBLISH — thumbnail + title / description / tags / chapters
     ================================================================= */
  function chapters(c) {
    var paras = String(c.text || '').split(/\n\s*\n/).map(function (x) { return x.trim() }).filter(Boolean), out = [], wi = 0, W = c.words || [];
    paras.forEach(function (p) { var n = TIMING.words(p).length; if (W[wi]) out.push({ t: wi === 0 ? 0 : W[wi][1], text: p.split(/(?<=[.!?])\s/)[0].slice(0, 90) }); wi += n });
    return out;
  }
  function ts(t) { t = Math.floor(t); var m = Math.floor(t / 60), s = t % 60; return m + ':' + (s < 10 ? '0' : '') + s }
  function vPublish() {
    var c = cutById(CUT);
    var thumbText = h('input', { value: P.thumbText || (P.title || '').toUpperCase(), style: 'width:100%', on: { input: function () { P.thumbText = this.value; save() } } });
    var tSlider = h('input', { type: 'range', min: 0, max: c.duration || 1, step: .05, value: P.thumbT || Math.min(3, (c.duration || 1) / 2), style: 'flex:1' });
    var out = h('div', { style: 'margin-top:10px' });
    function grab() {
      DB.getFile(P.id + ':' + CUT).then(function () {
        var pl = playerPayload(CUT, 1080); pl.captions = false; P.thumbT = +tSlider.value; save();
        stageModal('Thumbnail frame', pl, {
          'ready': function (m, info, f) { info.textContent = 'Rendering frame at ' + (+tSlider.value).toFixed(1) + ' s…'; f.contentWindow.postMessage({ type: 'seek', t: +tSlider.value }, '*'); setTimeout(function () { f.contentWindow.postMessage({ type: 'grab' }, '*') }, 1500) },
          'frame': function (m, info) { info.textContent = 'Done.'; document.getElementById('mclose').click(); makeThumb(m.blob) }
        }, frameSize(CUT));
      });
    }
    function makeThumb(blob) {
      var img = new Image(); img.onload = function () {
        var land = c.aspect === '16:9', W = land ? 1280 : 1080, H = land ? 720 : 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H; var x = cv.getContext('2d');
        var sc = Math.max(W / img.width, H / img.height); x.drawImage(img, (W - img.width * sc) / 2, (H - img.height * sc) / 2, img.width * sc, img.height * sc);
        var txt = thumbText.value.trim();
        if (txt) {
          var fs = Math.round(Math.min(W, H) * (land ? .13 : .1)); x.font = '900 ' + fs + 'px "Arial Black", Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
          var words = txt.split(/\s+/), lines = [], cur = ''; words.forEach(function (w) { var tr = cur ? cur + ' ' + w : w; if (x.measureText(tr).width > W * .86 && cur) { lines.push(cur); cur = w } else cur = tr }); if (cur) lines.push(cur);
          var y0 = (land ? H * .2 : H * .16);
          lines.forEach(function (l, i) { var y = y0 + i * fs * 1.08; x.lineWidth = fs * .22; x.strokeStyle = '#0d0a0c'; x.strokeText(l, W / 2, y); x.fillStyle = i === lines.length - 1 ? '#f2c14e' : '#efe6d2'; x.fillText(l, W / 2, y) });
        }
        cv.toBlob(function (b) { out.innerHTML = ''; var u = URL.createObjectURL(b); out.append(h('img', { src: u, style: 'max-width:' + (land ? 480 : 240) + 'px;border-radius:8px;display:block;margin-bottom:8px' }), h('button', { on: { click: function () { download(slug(P.title || P.name) + '-thumbnail.png', b) } } }, 'Download thumbnail')) }, 'image/png');
      }; img.src = URL.createObjectURL(blob);
    }
    var ch = chapters(c), meta = TPL.publish(P, c, ch.map(function (x) { return ts(x.t) + ' ' + x.text }).join('\n'));
    return h('div', null,
      h('h1', null, 'Publish'), h('p', { className: 'lead' }, P.plan && P.plan.publish ? 'Everything to upload, written by the planner: titles, thumbnails, YouTube and TikTok text, and tips. Click Copy and paste it in.' : 'A thumbnail from your own video, plus title, description, tags and chapters written by Claude.'),
      cutTabs(),
      h('div', { className: 'card' }, h('h3', null, 'Thumbnail'),
        h('div', { className: 'row' }, h('span', null, 'Frame at'), tSlider), field('Text on the thumbnail (short, 2–5 words works best)', thumbText),
        h('div', { className: 'row', style: 'margin-top:8px' }, h('button', { on: { click: grab } }, 'Make thumbnail')), out,
        c.aspect !== '16:9' ? h('p', { className: 'muted small' }, 'For Shorts, YouTube picks the thumbnail from a frame in the video (you can choose it in the YouTube app). This image is for the long video, or to use as the first frame.') : null),
      publishPackage(c, function (txt, sec) { thumbText.value = String(txt).toUpperCase(); P.thumbText = thumbText.value; tSlider.value = sec; save(); grab() }),
      h('div', { className: 'card' }, h('h3', null, P.plan && P.plan.publish ? 'Write it again (optional)' : 'Title, description, tags'),
        help(['Click <b>Copy publish prompt</b> → paste into Claude.', 'Copy its answer into YouTube Studio when you upload.']),
        h('button', { on: { click: function () { promptBox('Publish prompt', meta, 'Publish prompt') } } }, 'Copy publish prompt'),
        ch.length > 1 ? h('div', { style: 'margin-top:10px' }, h('b', null, 'Chapters (from the script paragraphs):'), h('div', { className: 'lines', style: 'margin-top:6px' }, ch.map(function (x) { return h('div', null, ts(x.t) + '  ' + x.text) }))) : null),
      h('div', { className: 'card' }, h('h3', null, 'Upload'), h('p', { className: 'muted small', html: 'Open <a href="https://studio.youtube.com" target="_blank">YouTube Studio</a> → <b>Create</b> → <b>Upload videos</b> → pick the exported MP4 → paste title, description and tags → choose the thumbnail.' })));
  }

  /* =================================================================
     projects: list / new / demo / import / export / delete
     ================================================================= */
  var LIST = [];
  function refreshProjects() {
    return DB.list().then(function (l) {
      LIST = l.sort(function (a, b) { return b.updated - a.updated });
      var sel = document.getElementById('projSel'); sel.innerHTML = '';
      if (!LIST.length) sel.appendChild(h('option', null, '(no projects)'));
      LIST.forEach(function (p) { sel.appendChild(h('option', { value: p.id, selected: P && p.id === P.id }, p.name)) });
    });
  }
  function openProject(id) { return DB.get(id).then(function (p) { if (!p) return; P = p; CUT = null; syncCuts(); if (P.easy) STEP = easyNext().step; localStorage.setItem('lastProject', id); render() }) }
  document.getElementById('projSel').onchange = function () { if (PLAYER) { PLAYER.remove(); PLAYER = null } openProject(this.value) };
  document.getElementById('easyBtn').onclick = function () {
    P = newProject('Video ' + (LIST.length + 1)); P.easy = true; try { var es = localStorage.getItem('easyStyle'); if (es && (TPL.styleList || []).some(function (x) { return x.id === es })) P.settings.style = es } catch (e) { } P.claudeShots = true; P.settings.mascot = 'none'; P.settings.vshape = 'short'; syncCuts(); STEP = 'start'; save(true); localStorage.setItem('lastProject', P.id); render();
  };
  document.getElementById('libBtn').onclick = function () { loadLib().then(libraryModal) };
  document.getElementById('setBtn').onclick = function () { settingsModal() };
  var MORE = document.getElementById('moreMenu');
  MORE.addEventListener('click', function (e) { if (e.target.tagName === 'BUTTON') MORE.open = false });
  document.addEventListener('click', function (e) { if (MORE.open && !MORE.contains(e.target)) MORE.open = false });
  var tipsBtn = document.getElementById('tipsBtn');
  if (tipsBtn) { tipsBtn.textContent = 'Tips: ' + (GUIDE.tipsOn() ? 'on' : 'off'); tipsBtn.onclick = function () { tipsBtn.textContent = 'Tips: ' + (GUIDE.toggleTips() ? 'on' : 'off') } }
  document.getElementById('newBtn').onclick = function () { P = newProject('Video ' + (LIST.length + 1)); syncCuts(); STEP = 'project'; save(true); localStorage.setItem('lastProject', P.id); render() };
  document.getElementById('delBtn').onclick = function () {
    if (!P || !confirm('Delete "' + P.name + '"? This cannot be undone.')) return;
    var id = P.id; P.cuts.forEach(function (c) { DB.delFile(id + ':' + c.id) });
    DB.del(id).then(refreshProjects).then(function () { P = null; if (LIST[0]) openProject(LIST[0].id); else render() });
  };
  document.getElementById('exportBtn').onclick = function () { if (P) { STEP = 'export'; render() } };
  document.getElementById('importBtn').onclick = function () { document.getElementById('importFile').click() };
  document.getElementById('importFile').onchange = function () {
    var f = this.files[0]; if (!f) return; this.value = '';
    f.text().then(function (t) {
      var p = JSON.parse(t), audio = p.audio || {}; delete p.audio; p.id = 'p' + Date.now().toString(36); p.name = p.name + ' (imported)';
      return Promise.all(Object.keys(audio).map(function (cid) { return fetch(audio[cid]).then(function (r) { return r.blob() }).then(function (b) { return DB.putFile(p.id + ':' + cid, b) }) })).then(function () { return DB.put(p) }).then(function () { return refreshProjects() }).then(function () { return openProject(p.id) }).then(function () { toast('Imported.') });
    }).catch(function (e) { toast('Import failed: ' + e.message, 5000) });
  };
  document.getElementById('demoBtn').onclick = function () {
    modal('Load a demo', h('div', { className: 'grid' },
      [window.DEMO_ICE_FACET, window.DEMO_LP, window.DEMO_ICE_LP, window.DEMO, window.DEMO2].filter(Boolean).map(function (D) { return h('div', { className: 'card' }, h('h3', null, D.title), h('p', { className: 'muted small' }, D.script.slice(0, 120) + '…'), h('button', { on: { click: function () { document.getElementById('mclose').click(); loadDemo(D) } } }, 'Load')) })));
  };
  function loadDemo(D) {
    P = newProject('Demo — ' + D.title); P.settings.style = D.style || 'paper'; P.settings.topic = D.title; P.title = D.title; syncCuts();
    var c = P.cuts[0], r = D.words ? { words: D.words, duration: D.duration } : TIMING.estimate(D.script); c.text = D.script; c.words = r.words; c.duration = r.duration; c.lines = TIMING.lines(r.words); c.timing = D.words ? 'from the narration' : 'estimate (no audio)';
    var plan = JSON.parse(JSON.stringify(D.plan)); plan.cuts = { main: plan.cuts.main.map(function (s) { s.id = s.id.replace(/^S/, 'M'); return s }) };
    if (plan.sky) P.settings.sky = plan.sky;
    PLAN.validate(plan, P.cuts); applyPlan(plan);
    Object.keys(D.assets).forEach(function (n) { P.assets[n] = { code: D.assets[n], versions: [], status: 'approved' } });
    P.assetTickets.forEach(function (t) { t.status = 'checked' });
    P.shots.main = {}; Object.keys(D.shots).forEach(function (id) { var nid = id.replace(/^S/, 'M'); P.shots.main[nid] = { code: D.shots[id].replace("SHOT('" + id + "'", "SHOT('" + nid + "'"), versions: [], status: 'approved' } });
    P.shotTickets.main.forEach(function (t) { t.status = 'checked' });
    var done = function () { STEP = 'watch'; save(true); localStorage.setItem('lastProject', P.id); render(); toast('Demo loaded — press Play.') };
    if (D.audio) fetch(D.audio).then(function (r) { return r.blob() }).then(function (b) { return DB.putFile(P.id + ':' + c.id, b) }).then(function () { c.hasAudio = true; c.audioName = 'narration.wav'; done() }).catch(done); else done();
  }

  loadLib().then(libBackfill);
  refreshProjects().then(function () {
    var last = localStorage.getItem('lastProject');
    if (last && LIST.some(function (p) { return p.id === last })) openProject(last); else if (LIST[0]) openProject(LIST[0].id); else render();
  });
  window.APP = { get P() { return P }, render: render, go: go };
})();
