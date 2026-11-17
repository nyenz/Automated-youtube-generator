/* NYENZ AUTO-EDIT — Studio (the redesigned app).
   Stage 1: Home, 1 Style, 2 Script & audio. Stages 3–7 are shown but not built yet. */
(function () {
  'use strict';
  var S = window.STORE, AU = window.AUDIO, ST = window.STYLES;

  /* ================= small helpers ================= */
  function h(tag, props) {
    var el = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k]; if (v == null || v === false) return;
      if (k === 'class') el.className = v; else if (k === 'html') el.innerHTML = v; else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? '' : v);
    });
    (function add(list) { list.forEach(function (c) { if (c == null || c === false) return; if (Array.isArray(c)) add(c); else el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c))) }) })(kids);
    return el;
  }
  var ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>', more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>', play: '<path d="M7 4l13 8-13 8z"/>', pause: '<path d="M7 4h4v16H7zM14 4h4v16h-4z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', wave: '<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 7v10M21 12h0"/>',
    split: '<path d="M12 3v18M5 8l-3 4 3 4M19 8l3 4-3 4"/>', check: '<path d="M5 12l4 4 10-10"/>', chev: '<path d="M9 6l6 6-6 6"/>', download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', install: '<path d="M12 3v12M7 10l5 5 5-5"/><rect x="3" y="17" width="18" height="4" rx="1"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  function icon(n, cls) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic ' + (cls || '')); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.innerHTML = ICONS[n] || ''; return s }
  function fmtT(t) { t = Math.max(0, t || 0); var m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1) }
  function fmtLen(t) { t = Math.round(t || 0); var m = Math.floor(t / 60), s = t % 60; return m ? m + ' min ' + s + ' s' : s + ' s' }
  function ago(ms) { var d = (Date.now() - ms) / 1000; if (d < 60) return 'just now'; if (d < 3600) return Math.floor(d / 60) + ' min ago'; if (d < 86400) return Math.floor(d / 3600) + ' h ago'; return Math.floor(d / 86400) + ' days ago' }
  function words(t) { return window.TIMING.words(t || '') }

  /* ================= shared components ================= */
  var TOASTS = h('div', { class: 'toasts' });
  function toast(msg, kind, ms) {
    var t = h('div', { class: 'toast ' + (kind || '') }, h('div', null, msg), h('button', { class: 'x', 'aria-label': 'Close', onclick: function () { t.remove() } }, '×'));
    TOASTS.appendChild(t); setTimeout(function () { t.remove() }, ms || 4200);
  }
  var MENU = null;
  function closeMenu() { if (MENU) { MENU.remove(); MENU = null } }
  function menu(anchor, items) {
    closeMenu();
    var m = h('div', { class: 'menu' }, items.map(function (it) { return it === '-' ? h('div', { class: 'sep' }) : h('button', { class: it.danger ? 'danger' : '', onclick: function (e) { e.stopPropagation(); closeMenu(); it.do() } }, it.icon ? icon(it.icon) : null, it.label) }));
    document.body.appendChild(m); MENU = m;
    var r = anchor.getBoundingClientRect(), mw = m.offsetWidth, mh = m.offsetHeight, W = innerWidth, H = innerHeight;
    var left = Math.min(Math.max(8, r.right - mw), W - mw - 8), top = r.bottom + 6; if (top + mh > H - 8) top = Math.max(8, r.top - mh - 6); // never cut off: open where there is room
    m.style.left = left + 'px'; m.style.top = top + 'px';
  }
  document.addEventListener('click', closeMenu); window.addEventListener('resize', closeMenu);
  function modal(o) {
    var v = h('div', { class: 'veil', onclick: function (e) { if (e.target === v) close() } }), close = function () { v.remove(); document.removeEventListener('keydown', esc) }, esc = function (e) { if (e.key === 'Escape') close() };
    var box = h('div', { class: 'modal', role: 'dialog' }, h('button', { class: 'x', 'aria-label': 'Close', onclick: close }, '×'), h('h3', null, o.title), o.body, h('div', { class: 'acts' }, (o.actions || []).map(function (a) { return h('button', { class: 'btn ' + (a.primary ? 'primary' : '') + (a.danger ? ' danger' : ''), onclick: function () { var r = a.do && a.do(); if (r !== false) close() } }, a.label) })));
    v.appendChild(box); document.body.appendChild(v); document.addEventListener('keydown', esc);
    var f = box.querySelector('input'); if (f) setTimeout(function () { f.focus(); f.select() }, 30);
    return close;
  }
  function tabs(list, cur, onPick) { return h('div', { class: 'tabs noscroll', role: 'tablist' }, list.map(function (t) { return h('button', { class: t.id === cur ? 'on' : '', role: 'tab', onclick: function () { onPick(t.id) } }, t.label, t.count != null ? h('span', { class: 'count' }, t.count) : null) })) }
  function seg(list, cur, onPick) { return h('div', { class: 'seg' }, list.map(function (t) { return h('button', { class: t.id === cur ? 'on' : '', onclick: function () { onPick(t.id) } }, t.icon || null, t.label) })) }
  function stat(v, k, kind) { return h('div', { class: 'stat ' + (kind || '') }, h('div', { class: 'v' }, v), h('div', { class: 'k' }, k)) }
  function art(id) { return h('div', { class: 'art ' + id }) }

  /* ================= state ================= */
  var STAGES = [
    { id: 'style', t: 'Style', s: 'Pick the look' },
    { id: 'audio', t: 'Script & audio', s: 'Timing and parts' },
    { id: 'prompts', t: 'Prompts', s: 'Plan, assets, scenes', locked: true },
    { id: 'pick', t: 'Pick the best', s: 'A/B and the critic', locked: true },
    { id: 'sound', t: 'Sound', s: 'Music and effects', locked: true },
    { id: 'thumbs', t: 'Thumbnails', s: 'Three prompts', locked: true },
    { id: 'export', t: 'Watch & export', s: 'MP4 and upload pack', locked: true }
  ];
  var ALL = [], P = null, STAGE = 'style', HOMETAB = 'videos', AUDIOTAB = 'inputs', SELPART = 0, SELWORD = -1, PREVIEW = null, INSTALL = null;
  var AUDIOEL = new Audio(), AUDIOURL = '', PLAYEND = null, RAF = 0, BUSY = false, PROG = { msg: '', f: null };
  var root, topEl, sideEl, mainEl, saveEl, folderChip;

  /* saving: debounced, with a visible state */
  var saveTimer = 0;
  function save(now) {
    if (!P) return Promise.resolve();
    saveEl.textContent = 'Saving…'; saveEl.className = 'save-state';
    clearTimeout(saveTimer);
    return new Promise(function (res) {
      saveTimer = setTimeout(function () {
        S.put(P).then(function () { saveEl.textContent = 'Saved'; saveEl.className = 'save-state ok'; ALL = ALL.filter(function (x) { return x.id !== P.id }).concat([P]); res() })
          .catch(function (e) { saveEl.textContent = 'Not saved'; saveEl.className = 'save-state'; toast('Could not save: ' + (e && e.message || e) + '. Your work is still on screen; try again.', 'bad', 8000); res() });
      }, now ? 0 : 400);
    });
  }

  /* ================= frame ================= */
  function frame() {
    saveEl = h('span', { class: 'save-state' });
    folderChip = h('button', { class: 'chip', onclick: folderAction });
    var installBtn = h('button', { class: 'chip', style: { display: 'none' }, onclick: function () { if (INSTALL) { INSTALL.prompt(); INSTALL.userChoice.then(function () { INSTALL = null; installBtn.style.display = 'none' }) } } }, icon('install'), h('span', { class: 'lbl' }, 'Install app'));
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); INSTALL = e; installBtn.style.display = '' });
    topEl = h('header', { class: 'top' },
      h('div', { class: 'brand', onclick: function () { go('') } }, h('img', { src: 'icons/icon-192.png', alt: '' }), h('span', null, 'Nyenz Auto-Edit')),
      h('div', { class: 'crumb', id: 'crumb' }), h('div', { class: 'grow' }), saveEl, installBtn, folderChip);
    sideEl = h('nav', { class: 'side' });
    mainEl = h('main', { class: 'main' });
    root = h('div', { class: 'app' }, topEl, sideEl, mainEl);
    document.body.appendChild(root); document.body.appendChild(TOASTS);
    paintFolder();
  }
  function paintFolder() {
    var f = S.folder(); folderChip.innerHTML = '';
    if (f.state === 'unsupported') { folderChip.style.display = 'none'; return }
    folderChip.className = 'chip ' + (f.state === 'ok' ? 'ok' : 'warn');
    folderChip.appendChild(icon('folder'));
    folderChip.appendChild(h('span', { class: 'lbl' }, f.state === 'ok' ? 'Backup: ' + f.name : f.state === 'ask' ? 'Reconnect backup folder' : 'Pick a backup folder'));
    folderChip.title = f.state === 'ok' ? 'Every project is also saved in this folder on your PC.' : 'Pick a folder on your PC. Every project is copied there, so nothing is lost if the browser is cleared.';
  }
  function folderAction() {
    var f = S.folder();
    var job = f.state === 'ask' ? S.reconnect() : S.pickFolder();
    job.then(function (r) { paintFolder(); if (r && r.state === 'ok') toast('Backup folder ready: every project is now also saved in "' + r.name + '".', 'ok') })
      .catch(function (e) { if (e && e.name === 'AbortError') return; toast('Could not use that folder. Pick another one.', 'bad') });
  }
  function sidebar() {
    sideEl.innerHTML = '';
    if (!P) {
      sideEl.appendChild(h('div', { class: 'cap' }, 'Home'));
      sideEl.appendChild(h('div', { class: 'stage on' }, h('span', { class: 'n' }, icon('wave')), h('span', { class: 'l' }, h('span', { class: 't' }, 'Your videos'), h('span', { class: 's' }, ALL.filter(function (p) { return !p.trashed }).length + ' saved'))));
      sideEl.appendChild(h('div', { class: 'foot' }, 'Old app: ', h('a', { href: 'legacy.html', style: { color: 'var(--gold)' } }, 'open it here')));
      return;
    }
    sideEl.appendChild(h('div', { class: 'cap' }, 'Stages'));
    STAGES.forEach(function (s, i) {
      var done = stageDone(s.id);
      sideEl.appendChild(h('div', { class: 'stage' + (s.id === STAGE ? ' on' : '') + (s.locked ? ' locked' : '') + (done ? ' done' : ''), title: s.locked ? 'Coming next' : '', onclick: function () { if (!s.locked) go(P.id + '/' + s.id) } },
        h('span', { class: 'n' }, s.locked ? icon('lock') : done && s.id !== STAGE ? icon('check') : String(i + 1)), h('span', { class: 'l' }, h('span', { class: 't' }, s.t), h('span', { class: 's' }, s.locked ? 'Coming next' : s.s))));
    });
    sideEl.appendChild(h('div', { class: 'foot' }, h('div', null, 'Style: ', h('b', null, window.styleById(P.style).name)), h('div', null, P.format === 'long' ? 'Long video, 16:9' : 'Short, 9:16')));
  }
  function stageDone(id) {
    if (id === 'style') return !!P.styleChosen;
    if (id === 'audio') return !!(P.timing && P.timing.words && P.timing.words.length);
    return false;
  }
  function crumb() {
    var c = document.getElementById('crumb'); c.innerHTML = '';
    if (P) c.appendChild(h('span', null, '/  ', h('b', null, P.name)));
  }

  /* ================= routing ================= */
  function go(path) { if (location.hash.slice(2) === path) route(); else location.hash = '#/' + path }
  function route() {
    stopAudio();
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    if (!parts[0]) { P = null; render(); return }
    var id = parts[0], stage = parts[1] || 'style';
    var have = ALL.filter(function (x) { return x.id === id })[0];
    var load = have ? Promise.resolve(have) : S.get(id);
    load.then(function (p) {
      if (!p) { toast('That video was not found. It may have been deleted.', 'warn'); go(''); return }
      if (!P || P.id !== p.id) { P = p; SELPART = 0; SELWORD = -1; AUDIOTAB = p.timing ? 'parts' : 'inputs'; PREVIEW = p.style; loadAudio() }
      STAGE = STAGES.some(function (s) { return s.id === stage && !s.locked }) ? stage : 'style';
      render();
    });
  }
  function render() {
    sidebar(); crumb();
    mainEl.innerHTML = ''; mainEl.scrollTop = 0;
    if (!P) { saveEl.textContent = ''; mainEl.appendChild(home()); return }
    if (!saveEl.textContent) { saveEl.textContent = 'Saved'; saveEl.className = 'save-state ok' }
    mainEl.appendChild(STAGE === 'style' ? stylePage() : audioPage());
  }

  /* ================= home ================= */
  function home() {
    var live = ALL.filter(function (p) { return !p.trashed }), bin = ALL.filter(function (p) { return p.trashed });
    var list = HOMETAB === 'trash' ? bin : live;
    var pg = h('div', { class: 'page' },
      h('div', { class: 'titlebar' }, h('div', null, h('h1', null, 'Your videos'), h('p', null, 'Every video keeps its style, script, audio and parts. Nothing is lost.')), h('div', { class: 'grow' }),
        h('button', { class: 'btn primary', onclick: newVideo }, icon('plus'), 'New video')),
      tabs([{ id: 'videos', label: 'Videos', count: live.length }, { id: 'trash', label: 'Trash', count: bin.length }], HOMETAB, function (t) { HOMETAB = t; render() }));
    var grid = h('div', { class: 'grid tabpane' });
    if (HOMETAB === 'videos') grid.appendChild(h('div', { class: 'newcard', onclick: newVideo }, h('div', null, h('div', { class: 'plus' }, icon('plus')), h('div', { style: { fontWeight: 600 } }, 'New video'), h('div', { class: 'muted', style: { fontSize: '12px' } }, 'Pick a style, add the script and audio'))));
    list.forEach(function (p, i) {
      var sty = window.styleById(p.style), T = p.timing, parts = T ? AU.parts(T.words, p.cuts || [], T.duration).length : 0;
      var more = h('button', { class: 'btn small', 'aria-label': 'More', onclick: function (e) { e.stopPropagation(); menu(more, HOMETAB === 'trash' ? [
        { label: 'Restore', icon: 'undo', do: function () { p.trashed = false; S.put(p).then(function () { toast('"' + p.name + '" is back in your videos.', 'ok'); render() }) } },
        '-', { label: 'Delete for good', icon: 'trash', danger: true, do: function () { forever(p) } }] : [
        { label: 'Open', icon: 'chev', do: function () { go(p.id + '/' + (p.styleChosen ? 'audio' : 'style')) } },
        { label: 'Rename', icon: 'copy', do: function () { rename(p) } },
        { label: 'Duplicate', icon: 'copy', do: function () { duplicate(p) } },
        '-', { label: 'Move to trash', icon: 'trash', danger: true, do: function () { p.trashed = true; S.put(p).then(function () { toast('"' + p.name + '" moved to Trash. You can restore it there.', 'warn'); render() }) } }]) } }, icon('more'));
      grid.appendChild(h('div', { class: 'vcard', style: { animationDelay: (i * 40) + 'ms' }, onclick: function () { if (HOMETAB !== 'trash') go(p.id + '/' + (p.styleChosen ? 'audio' : 'style')) } },
        h('div', { class: 'thumb' }, art(sty.art)), h('div', { class: 'more' }, more),
        h('div', { class: 'body' }, h('div', { class: 'name' }, p.name),
          h('div', { class: 'meta' }, h('span', null, sty.name), h('span', null, p.format === 'long' ? 'Long 16:9' : 'Short 9:16'), T ? h('span', { class: 'mono' }, fmtLen(T.duration)) : null, parts ? h('span', null, parts + ' parts') : null),
          h('div', { class: 'meta' }, h('span', null, 'Opened ' + ago(p.updated || p.created))))));
    });
    if (!list.length && HOMETAB === 'trash') grid.appendChild(h('div', { class: 'empty' }, 'Trash is empty.'));
    pg.appendChild(grid);
    return pg;
  }
  function newVideo() {
    var inp = h('input', { class: 'input', placeholder: 'For example: Under the Ice', maxlength: 80 });
    modal({ title: 'New video', body: h('div', null, h('p', { class: 'muted', style: { margin: '0 0 12px', fontSize: '13px' } }, 'Give it a name. You can change it later.'), h('label', { class: 'label' }, 'Name'), inp),
      actions: [{ label: 'Create', primary: true, do: function () {
        var name = inp.value.trim(); if (!name) { inp.classList.remove('field-bad'); void inp.offsetWidth; inp.classList.add('field-bad'); inp.focus(); return false }
        var p = { id: S.newId(), name: name, created: Date.now(), style: 'gilded', format: 'short', script: '', cuts: [] };
        S.put(p).then(function () { ALL.push(p); toast('Created "' + name + '". Now pick its style.', 'ok'); go(p.id + '/style') });
      } }] });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') inp.closest('.modal').querySelector('.btn.primary').click() });
  }
  function rename(p) {
    var inp = h('input', { class: 'input', value: p.name, maxlength: 80 });
    modal({ title: 'Rename video', body: h('div', null, h('label', { class: 'label' }, 'Name'), inp), actions: [{ label: 'Save', primary: true, do: function () { var n = inp.value.trim(); if (!n) return false; p.name = n; S.put(p).then(function () { toast('Renamed to "' + n + '".', 'ok'); render() }) } }] });
  }
  function duplicate(p) {
    var c = JSON.parse(JSON.stringify(p)); c.id = S.newId(); c.name = p.name + ' (copy)'; c.created = Date.now();
    S.getBlob(p.id + ':audio').then(function (b) { return b ? S.putBlob(c.id + ':audio', b) : null }).then(function () { return S.put(c) }).then(function () { ALL.push(c); toast('Made a copy: "' + c.name + '".', 'ok'); render() });
  }
  function forever(p) {
    modal({ title: 'Delete "' + p.name + '" for good?', body: h('p', { style: { fontSize: '13px', color: 'var(--ink-2)' } }, 'This removes its script, audio, timing and parts from the app. A copy stays in your backup folder if you picked one. This cannot be undone.'),
      actions: [{ label: 'Delete "' + p.name + '"', danger: true, do: function () { S.remove(p.id).then(function () { ALL = ALL.filter(function (x) { return x.id !== p.id }); toast('"' + p.name + '" was deleted.', 'ok'); render() }) } }] });
  }

  /* ================= stage 1: style ================= */
  function stylePage() {
    var cur = window.styleById(P.style), prev = window.styleById(PREVIEW || P.style), main = ST[0], aside = ST.slice(1);
    var asideOpen = !main || prev.id !== main.id || P.style !== main.id;
    function useStyle(s) {
      function apply() { P.style = s.id; P.styleChosen = true; PREVIEW = s.id; save(true).then(function () { toast('Style set to ' + s.name + '.', 'ok'); go(P.id + '/audio') }) }
      if (s.ready) return apply();
      modal({ title: s.name + ' is kept aside', body: h('p', { style: { fontSize: '13px', color: 'var(--ink-2)' } }, s.name + ' is not finished. Script & audio will work, but the next stages (prompts, assets, scenes) are built for Gilded only for now.'),
        actions: [{ label: 'Use ' + s.name + ' anyway', do: apply }, { label: 'Keep Gilded', primary: true, do: function () { PREVIEW = 'gilded'; render() } }] });
    }
    var demo = h('div', { class: 'demo' },
      h('div', { class: 'bar' }, h('b', null, prev.name), h('span', { class: 'muted' }, 'demo'), h('div', { class: 'grow' }), prev.demo ? h('a', { class: 'btn small', href: prev.demo, target: '_blank', rel: 'noopener' }, 'Open full size') : null),
      prev.demo ? h('iframe', { src: prev.demo, title: prev.name + ' demo', loading: 'lazy' }) : h('div', { class: 'none' }, h('p', null, 'This style has no demo page yet.'), prev.oldApp ? h('a', { class: 'btn small', href: 'legacy.html', style: { marginTop: '8px' } }, 'See it in the old app') : null));
    var mainCard = h('div', { class: 'panel' },
      h('div', { class: 'stylemain' }, h('div', { class: 'thumb' }, art(main.art)),
        h('div', null,
          h('div', { class: 'row' }, h('span', { class: 'badge-word t-ok' }, 'Main style'), cur.id === main.id && P.styleChosen ? h('span', { class: 'badge-word t-info' }, 'In use') : null),
          h('h2', { style: { fontSize: '24px', marginTop: '6px' } }, main.name), h('p', { class: 'sub' }, main.full + '. ' + main.line),
          h('div', { class: 'facts' }, main.facts.map(function (f) { return h('div', { class: 'glass' }, h('div', { class: 'k' }, f[0]), h('div', { class: 'v' }, f[1])) })),
          h('div', { class: 'row' },
            h('button', { class: 'btn primary', onclick: function () { useStyle(main) } }, cur.id === main.id && P.styleChosen ? 'Continue with ' + main.name : 'Use ' + main.name),
            h('button', { class: 'btn', onclick: function () { PREVIEW = main.id; render() } }, 'Show demo'),
            h('span', { class: 'muted', style: { fontSize: '12px' } }, 'Asset library: kept for this style only')))));
    var head = h('div', { class: 'collapse-head' + (asideOpen ? ' open' : '') }, icon('chev', 'chev'), h('b', null, 'Set aside'), h('span', { class: 'muted' }, aside.length + ' older styles, not finished'));
    var body = h('div', { class: 'aside-list', style: { display: asideOpen ? '' : 'none', marginTop: '10px' } }, aside.map(function (s) {
      return h('div', { class: 'mini' + (prev.id === s.id ? ' on' : ''), onclick: function () { PREVIEW = s.id; render() } }, h('div', { class: 'thumb' }, art(s.art)),
        h('div', { style: { minWidth: 0, flex: 1 } }, h('div', { class: 'nm' }, s.name), h('div', { class: 'ds' }, s.line), h('div', { class: 'ds t-warn' }, P.style === s.id ? 'In use' : 'Unfinished')),
        h('button', { class: 'btn small', onclick: function (e) { e.stopPropagation(); useStyle(s) } }, 'Use'));
    }));
    head.addEventListener('click', function () { var open = body.style.display === 'none'; body.style.display = open ? '' : 'none'; head.classList.toggle('open', open) });
    return h('div', { class: 'page' },
      h('div', { class: 'titlebar' }, h('div', null, h('h1', null, '1. Pick a style'), h('p', null, 'Every video in a style looks the same, and each style keeps its own assets.'))),
      h('div', { class: 'cols' }, h('div', { class: 'stack' }, mainCard, h('div', { class: 'card' }, head, body)), demo));
  }

  /* ================= stage 2: script & audio ================= */
  function loadAudio() {
    if (AUDIOURL) { URL.revokeObjectURL(AUDIOURL); AUDIOURL = '' }
    AUDIOEL.removeAttribute('src');
    if (!P || !P.audio) return;
    S.getBlob(P.id + ':audio').then(function (b) { if (b && P) { AUDIOURL = URL.createObjectURL(b); AUDIOEL.src = AUDIOURL } });
  }
  function stopAudio() { AUDIOEL.pause(); PLAYEND = null; cancelAnimationFrame(RAF) }
  function playRange(a, b) {
    if (!AUDIOEL.src) { toast('Add the audio first.', 'warn'); return }
    stopAudio(); AUDIOEL.currentTime = a; PLAYEND = b; AUDIOEL.play().catch(function () {}); tick();
  }
  function tick() {
    cancelAnimationFrame(RAF);
    RAF = requestAnimationFrame(function step() {
      var t = AUDIOEL.currentTime;
      if (PLAYEND != null && t >= PLAYEND) { AUDIOEL.pause(); PLAYEND = null }
      paintPlayhead(t);
      if (!AUDIOEL.paused) RAF = requestAnimationFrame(step); else paintPlayhead(t, true);
    });
  }
  var paintPlayhead = function () {};

  function audioPage() {
    var T = P.timing, parts = T ? AU.parts(T.words, P.cuts || [], T.duration) : [];
    var pg = h('div', { class: 'page' },
      h('div', { class: 'titlebar' }, h('div', null, h('h1', null, '2. Script & audio'), h('p', null, 'The app listens to your narration, matches every word to the script and splits it into parts.')), h('div', { class: 'grow' }),
        T ? h('button', { class: 'btn', onclick: function (e) { e.stopPropagation(); menu(e.currentTarget, [
          { label: 'Copy the plan (JSON)', icon: 'copy', do: copyPlan }, { label: 'Download the plan', icon: 'download', do: downloadPlan }, '-', { label: 'Undo: earlier versions', icon: 'undo', do: versions }]) } }, icon('more'), 'More') : null),
      tabs([{ id: 'inputs', label: 'Script & audio' }, { id: 'parts', label: 'Timing & parts', count: T ? parts.length : null }], AUDIOTAB, function (t) { if (t === 'parts' && !T) { toast('Press "Listen and split" first.', 'warn'); return } AUDIOTAB = t; render() }));
    pg.appendChild(AUDIOTAB === 'parts' && T ? partsPane(T, parts) : inputsPane());
    return pg;
  }

  function inputsPane() {
    var area = h('textarea', { class: 'area', placeholder: 'Paste the exact script the narrator reads. Leave a blank line between paragraphs: the app likes to start a new part there.' }, P.script || '');
    var counts = h('div', { class: 'counts' });
    function paintCounts() { var n = words(area.value).length; counts.innerHTML = ''; counts.appendChild(h('span', { class: 'mono' }, n + ' words')); counts.appendChild(h('span', null, 'about ' + fmtLen(n / 2.6) + ' of speech')) }
    area.addEventListener('input', function () { P.script = area.value; paintCounts(); save() }); paintCounts();
    var file = h('input', { type: 'file', accept: 'audio/*,.wav,.mp3,.m4a,.ogg,.webm', class: 'hidden-file' });
    var drop = h('div', { class: 'drop', tabindex: '0', role: 'button', onclick: function () { file.click() }, onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') file.click() } },
      h('div', { class: 'ico' }, icon('music')), h('div', null, h('div', { class: 'big' }, P.audio ? 'Replace the narration audio' : 'Drop the narration audio here'), h('div', { class: 'muted', style: { fontSize: '12px' } }, 'or click to pick a file (WAV, MP3, M4A)')), file);
    ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over') }) });
    ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over') }) });
    drop.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; if (f) takeAudio(f) });
    file.addEventListener('change', function () { if (file.files[0]) takeAudio(file.files[0]) });
    var playBtn = h('button', { class: 'btn small', onclick: function () { if (AUDIOEL.paused) { AUDIOEL.play(); playBtn.firstChild.replaceWith(icon('pause')) } else { AUDIOEL.pause(); playBtn.firstChild.replaceWith(icon('play')) } } }, icon('play'));
    var line = P.audio ? h('div', { class: 'audio-line' }, playBtn, h('div', { style: { minWidth: 0, flex: 1 } }, h('div', { class: 'nm' }, P.audio.name), h('div', { class: 'muted mono', style: { fontSize: '11.5px' } }, (P.audio.duration ? fmtLen(P.audio.duration) + ' · ' : '') + (P.audio.size / 1048576).toFixed(1) + ' MB'))) : null;

    var go1 = h('button', { class: 'btn primary', onclick: run }, icon('split'), P.timing ? 'Listen and split again' : 'Listen and split into parts');
    var prog = h('div', { style: { display: BUSY ? '' : 'none', marginTop: '12px' } }, h('div', { class: 'status-line' }, PROG.msg), h('div', { class: 'progress' + (PROG.f == null ? ' indeterminate' : '') }, h('i', { style: { width: ((PROG.f || 0) * 100) + '%' } })));
    if (BUSY) go1.setAttribute('disabled', '');
    var left = h('div', { class: 'card' },
      h('div', { class: 'fieldgroup' }, h('span', { class: 'label' }, 'Format'),
        seg([{ id: 'short', label: 'Short', icon: h('span', { class: 'ratio', style: { width: '8px', height: '13px' } }) }, { id: 'long', label: 'Long video', icon: h('span', { class: 'ratio', style: { width: '15px', height: '9px' } }) }], P.format, function (f) { P.format = f; save(); render() }),
        h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '8px' } }, P.format === 'long' ? 'Wide 16:9 for YouTube.' : 'Vertical 9:16 for Shorts and TikTok.')),
      h('div', { class: 'fieldgroup' }, h('span', { class: 'label' }, 'Script'), area, counts),
      h('div', { class: 'fieldgroup' }, h('span', { class: 'label' }, 'Narration audio'), drop, line),
      h('div', { style: { marginTop: '16px' } }, go1, prog));
    var right = h('div', { class: 'panel' }, h('h2', null, 'What the app does'), h('p', { class: 'sub' }, 'You only paste and drop. The rest is automatic.'),
      h('div', { class: 'stack', style: { gap: '8px' } }, [
        ['Listens', 'Whisper hears every word and its time. The first time it downloads the speech model once (about 150 MB).'],
        ['Matches', 'Each heard word is matched to your script, so the spelling is yours and the times are real.'],
        ['Finds the pauses', 'Every piece of speech between pauses goes into the audio map.'],
        ['Splits into parts', 'Parts of 12 to 25 s, cut only at a long pause (0.45 s or more) after a sentence, as the Gilded rulebook says.'],
        ['Fills the plan', 'The times go into the project plan, so Sonnet never has to guess them.']
      ].map(function (x, i) { return h('div', { class: 'glass' }, h('div', { class: 'row', style: { gap: '8px' } }, h('span', { class: 'mono', style: { color: 'var(--gold)' } }, String(i + 1)), h('b', null, x[0])), h('div', { class: 'muted', style: { fontSize: '12.5px', marginTop: '4px' } }, x[1])) })));
    function run() {
      if (!words(P.script).length) { area.classList.remove('field-bad'); void area.offsetWidth; area.classList.add('field-bad'); area.focus(); toast('Paste the script first. The app matches the audio to it.', 'warn'); return }
      if (!P.audio) { drop.scrollIntoView({ block: 'center', behavior: 'smooth' }); drop.classList.add('field-bad'); setTimeout(function () { drop.classList.remove('field-bad') }, 1200); toast('Add the narration audio first.', 'warn'); return }
      analyse();
    }
    return h('div', { class: 'cols tabpane' }, left, right);
  }

  function takeAudio(f) {
    if (!/^audio\//.test(f.type) && !/\.(wav|mp3|m4a|ogg|webm|aac|flac)$/i.test(f.name)) { toast('That file is not audio. Pick a WAV, MP3 or M4A file.', 'bad'); return }
    var probe = new Audio(), url = URL.createObjectURL(f);
    probe.preload = 'metadata'; probe.src = url;
    probe.onloadedmetadata = function () { finish(probe.duration) }; probe.onerror = function () { finish(0) };
    function finish(dur) {
      URL.revokeObjectURL(url);
      S.putBlob(P.id + ':audio', f).then(function () {
        var changed = P.audio && (P.audio.name !== f.name || P.audio.size !== f.size);
        P.audio = { name: f.name, size: f.size, type: f.type, duration: Math.round(dur * 100) / 100 };
        if (changed && P.timing) { S.snapshot(P, 'Before new audio'); P.timing = null; P.cuts = []; toast('New audio added. Press "Listen and split" again to time it.', 'info') }
        else toast('Audio added: ' + f.name + '.', 'ok');
        loadAudio(); save(true).then(render);
      }).catch(function () { toast('Could not keep that audio file. Try again.', 'bad') });
    }
  }

  function analyse() {
    BUSY = true; PROG = { msg: 'Reading the audio…', f: null }; render();
    var shown = null;
    function status(msg, f) { PROG = { msg: msg, f: f == null ? null : f }; var pl = mainEl.querySelector('.status-line'), bar = mainEl.querySelector('.progress'); if (pl) pl.textContent = msg; if (bar) { bar.classList.toggle('indeterminate', f == null); bar.firstChild.style.width = ((f || 0) * 100) + '%' } }
    S.getBlob(P.id + ':audio').then(function (blob) {
      if (!blob) throw new Error('The audio file is missing. Add it again.');
      return AU.analyse(P.script, blob, status);
    }).then(function (r) {
      if (P.timing) S.snapshot(P, 'Before listening again');
      P.timing = r; P.audio.duration = r.duration;
      P.cuts = AU.split(r.words, P.script, r.duration);
      BUSY = false; AUDIOTAB = 'parts'; SELPART = 0;
      return save(true).then(function () {
        var n = P.cuts.length + 1;
        toast(r.method === 'whisper' ? 'Done. ' + Math.round(r.matched * 100) + '% of the words were heard clearly, and the narration is split into ' + n + ' parts.' : 'Done with pause timing (Whisper could not run here). ' + n + ' parts.', r.method === 'whisper' ? 'ok' : 'warn', 7000);
        render();
      });
    }).catch(function (e) { BUSY = false; render(); toast('Could not finish: ' + (e && e.message || e), 'bad', 9000) });
  }

  function partsPane(T, parts) {
    if (SELPART >= parts.length) SELPART = 0;
    var bad = parts.filter(function (p, i) { return AU.check(p, i === parts.length - 1).some(function (c) { return c.level === 'bad' }) }).length;
    var warn = parts.filter(function (p, i) { return AU.check(p, i === parts.length - 1).length }).length;
    var wps = T.words.length / Math.max(1, T.duration), guessed = (T.guessed || []).filter(Boolean).length;
    var heard = T.method === 'whisper' ? Math.round((1 - guessed / Math.max(1, T.words.length)) * 100) : null;
    var box = h('div', { class: 'tabpane' },
      h('div', { class: 'stats' },
        stat(fmtT(T.duration), 'Length'), stat(String(T.words.length), 'Words'), stat(String(parts.length), 'Parts', bad ? 'bad' : warn ? 'warn' : 'ok'),
        stat(wps.toFixed(1), 'Words a second', wps < AU.RULES.wpsLow || wps > AU.RULES.wpsHigh ? 'warn' : 'ok'),
        stat(heard == null ? 'Pauses' : heard + '%', heard == null ? 'Timing method' : 'Heard clearly', heard == null ? 'warn' : heard >= 90 ? 'ok' : 'warn')));
    if (T.method !== 'whisper') box.appendChild(h('div', { class: 'card', style: { marginBottom: 'var(--gap)', borderLeft: '4px solid var(--warn)' } }, h('b', null, 'The times are estimated. '), h('span', { class: 'muted' }, 'Whisper could not run in this browser, so words were placed from the pauses (rulebook timing level B). Use Chrome or Edge and press "Listen and split again" for exact times.')));
    box.appendChild(timeline(T, parts));
    var listBox = h('div', { class: 'plist' }, parts.map(function (p, i) {
      var checks = AU.check(p, i === parts.length - 1), lvl = checks.some(function (c) { return c.level === 'bad' }) ? 'bad' : checks.length ? 'warn' : '';
      return h('div', { class: 'pitem ' + lvl + (i === SELPART ? ' on' : ''), onclick: function () { SELPART = i; SELWORD = -1; render(); playRange(p.start, p.end) } },
        h('div', { class: 'num' }, String(p.id)),
        h('div', { style: { minWidth: 0 } },
          h('div', { class: 'hd' }, h('span', { class: 'mono' }, fmtT(p.start) + ' – ' + fmtT(p.end)), h('span', { class: 'mono muted' }, p.len.toFixed(1) + ' s'), h('span', { class: 'mono muted' }, p.wps.toFixed(1) + ' w/s'),
            checks.length ? h('span', { class: lvl === 'bad' ? 't-bad' : 't-warn' }, checks[0].text.split('.')[0]) : h('span', { class: 't-ok' }, 'Good')),
          h('div', { class: 'txt' }, p.text)),
        h('button', { class: 'btn small', 'aria-label': 'Play part', onclick: function (e) { e.stopPropagation(); SELPART = i; playRange(p.start, p.end); markSel() } }, icon('play')));
    }));
    function markSel() { Array.prototype.forEach.call(listBox.children, function (c, k) { c.classList.toggle('on', k === SELPART) }) }
    box.appendChild(h('div', { class: 'cols', style: { marginTop: 'var(--gap)' } }, listBox, partDetail(T, parts[SELPART], SELPART === parts.length - 1)));
    return box;
  }

  function timeline(T, parts) {
    var wrap = h('div', { class: 'tl' }), scroller = h('div', { class: 'scroller' }), inner = h('div', { class: 'inner' }), cv = h('canvas');
    scroller.appendChild(inner); inner.appendChild(cv); wrap.appendChild(scroller);
    var gaps = AU.gaps(T.words, P.script), cutSet = {}; (P.cuts || []).forEach(function (c) { cutSet[c] = 1 });
    var head = h('div', { class: 'head', style: { display: 'none' } });
    wrap.appendChild(h('div', { class: 'bar2' }, h('span', { class: 'legend' }, h('i'), 'Cut between parts'), h('span', { class: 'legend' }, h('i', { class: 'c' }), 'Other long pause after a sentence (click to cut here)'), h('div', { class: 'grow' }),
      h('button', { class: 'btn small', onclick: function () { S.snapshot(P, 'Before automatic split'); P.cuts = AU.split(T.words, P.script, T.duration); save(); toast('Split again automatically: ' + (P.cuts.length + 1) + ' parts.', 'ok'); render() } }, icon('split'), 'Split again automatically')));
    function layout() {
      var W = Math.max(200, scroller.clientWidth - 24), pps = Math.max(W / T.duration, 9), full = Math.ceil(T.duration * pps);
      inner.style.width = full + 'px';
      Array.prototype.slice.call(inner.querySelectorAll('.part,.cut,.shade,.ruler')).forEach(function (n) { n.remove() });
      var dpr = window.devicePixelRatio || 1; cv.width = full * dpr; cv.height = 80 * dpr; cv.style.width = full + 'px';
      var g = cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, full, 80);
      var pk = T.peaks || [], n = pk.length;
      // speech pieces (the audio map) as a faint band, then the waveform
      g.fillStyle = 'rgba(255,255,255,.05)'; (T.map || []).forEach(function (m) { g.fillRect(m[0] * pps, 0, (m[1] - m[0]) * pps, 80) });
      var grad = g.createLinearGradient(0, 0, 0, 80); grad.addColorStop(0, '#b9b2a4'); grad.addColorStop(.5, '#ECE6D8'); grad.addColorStop(1, '#b9b2a4');
      g.fillStyle = grad;
      for (var x = 0; x < full; x++) { var v = pk[Math.min(n - 1, Math.floor(x / full * n))] || 0, hh = Math.max(1, v * 36); g.fillRect(x, 40 - hh, 1, hh * 2) }
      var sel = parts[SELPART]; if (sel) inner.appendChild(h('div', { class: 'shade', style: { left: sel.start * pps + 'px', width: (sel.end - sel.start) * pps + 'px' } }));
      parts.forEach(function (p, i) {
        var checks = AU.check(p, i === parts.length - 1), lvl = checks.some(function (c) { return c.level === 'bad' }) ? ' bad' : checks.length ? ' warn' : '';
        inner.appendChild(h('div', { class: 'part' + (i === SELPART ? ' on' : '') + lvl, style: { left: p.start * pps + 1 + 'px', width: Math.max(10, (p.end - p.start) * pps - 2) + 'px' }, title: 'Part ' + p.id + ': ' + p.len.toFixed(1) + ' s', onclick: function () { SELPART = i; SELWORD = -1; render(); playRange(p.start, p.end) } }, 'Part ' + p.id + ' · ' + p.len.toFixed(0) + ' s'));
      });
      gaps.forEach(function (gp) {
        var isCut = cutSet[gp.after + 1]; if (!isCut && !AU.isCandidate(gp)) return;
        var c = h('div', { class: 'cut' + (isCut ? '' : ' cand'), style: { left: gp.at * pps + 'px' }, onclick: function () { toggleCut(gp.after + 1) } }, h('span', { class: 'tip' }, (isCut ? 'Click to join the parts · ' : 'Click to cut here · ') + 'pause ' + gp.gap.toFixed(2) + ' s'));
        inner.appendChild(c);
      });
      var ru = h('div', { class: 'ruler', style: { width: full + 'px' } }), step = pps > 30 ? 1 : pps > 14 ? 5 : pps > 6 ? 10 : 30;
      for (var t = 0; t <= T.duration; t += step) ru.appendChild(h('span', { style: { left: t * pps + 'px' } }, fmtT(t).replace(/\.\d$/, '')));
      inner.appendChild(ru); inner.appendChild(head);
      paintPlayhead = function (tt, stopped) { head.style.display = stopped && tt <= 0 ? 'none' : ''; head.style.left = tt * pps + 'px'; paintWord(tt) };
      inner.onclick = function (e) { if (e.target !== inner && e.target !== cv) return; var r = inner.getBoundingClientRect(), tt = (e.clientX - r.left) / pps; playRange(tt, T.duration) };
      if (sel && full > W) scroller.scrollLeft = Math.max(0, sel.start * pps - 40);
    }
    requestAnimationFrame(layout);
    var ro = new ResizeObserver(function () { layout() }); ro.observe(scroller);
    return wrap;
  }
  function toggleCut(idx) {
    S.snapshot(P, 'Before moving a cut');
    var i = (P.cuts || []).indexOf(idx);
    if (i >= 0) { P.cuts.splice(i, 1); toast('Joined the two parts.', 'info') } else { P.cuts.push(idx); P.cuts.sort(function (a, b) { return a - b }); toast('Cut added: a new part starts at "' + P.timing.words[idx][0] + '".', 'info') }
    save(); render();
  }

  var paintWord = function () {};
  function partDetail(T, p, isLast) {
    if (!p) return h('div');
    var checks = AU.check(p, isLast), wordsEl = h('div', { class: 'words' });
    var spans = [];
    for (var i = p.w0; i <= p.w1 && i >= 0; i++) (function (i) {
      var s = h('span', { class: (T.guessed && T.guessed[i] ? 'g' : '') + (i === SELWORD ? ' sel' : ''), title: fmtT(T.words[i][1]) + ' – ' + fmtT(T.words[i][2]) + (T.guessed && T.guessed[i] ? ' · not clearly heard, time placed between its neighbours' : ''), onclick: function () { SELWORD = i; render(); playRange(T.words[i][1], T.words[i][2] + .05) } }, T.words[i][0]);
      spans.push([i, s]); wordsEl.appendChild(s); wordsEl.appendChild(document.createTextNode(' '));
    })(i);
    paintWord = function (t) { spans.forEach(function (x) { var w = T.words[x[0]]; x[1].classList.toggle('now', t >= w[1] && t < w[2] + .02 && !AUDIOEL.paused) }) };
    var nud = null;
    if (SELWORD >= p.w0 && SELWORD <= p.w1) {
      var w = T.words[SELWORD];
      function shift(which, d) {
        var W = T.words, k = SELWORD, lo = k > 0 ? W[k - 1][2] : 0, hi = k < W.length - 1 ? W[k + 1][1] : T.duration;
        if (which === 'start') W[k][1] = Math.round(Math.min(W[k][2] - .03, Math.max(lo, W[k][1] + d)) * 100) / 100;
        else W[k][2] = Math.round(Math.max(W[k][1] + .03, Math.min(hi, W[k][2] + d)) * 100) / 100;
        if (T.guessed) T.guessed[k] = false;
        save(); render(); playRange(W[k][1], W[k][2] + .05);
      }
      nud = h('div', { class: 'glass', style: { marginTop: '12px' } }, h('div', { class: 'row' }, h('b', null, '"' + w[0] + '"'), h('span', { class: 'mono muted' }, fmtT(w[1]) + ' – ' + fmtT(w[2]))),
        h('div', { class: 'nudger' }, h('span', { class: 'muted' }, 'Starts'), h('button', { class: 'btn small', onclick: function () { shift('start', -.05) } }, 'Earlier'), h('button', { class: 'btn small', onclick: function () { shift('start', .05) } }, 'Later'),
          h('span', { class: 'muted', style: { marginLeft: '8px' } }, 'Ends'), h('button', { class: 'btn small', onclick: function () { shift('end', -.05) } }, 'Earlier'), h('button', { class: 'btn small', onclick: function () { shift('end', .05) } }, 'Later')),
        h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '6px' } }, 'Each press moves it 0.05 s. Only fix a word if its caption is clearly early or late.'));
    }
    return h('div', { class: 'panel', style: { position: 'sticky', top: '0' } },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Part ' + p.id), h('span', { class: 'mono muted' }, fmtT(p.start) + ' – ' + fmtT(p.end)), h('div', { style: { flex: 1 } }),
        h('button', { class: 'btn small primary', onclick: function () { playRange(p.start, p.end) } }, icon('play'), 'Play part')),
      h('div', { class: 'facts' }, [['Length', p.len.toFixed(1) + ' s'], ['Words', String(p.words)], ['Words a second', p.wps.toFixed(1)]].map(function (f) { return h('div', { class: 'glass' }, h('div', { class: 'k' }, f[0]), h('div', { class: 'v mono' }, f[1])) })),
      checks.length ? h('div', { style: { marginBottom: '10px' } }, checks.map(function (c) { return h('div', { class: c.level === 'bad' ? 't-bad' : 't-warn', style: { fontSize: '12.5px' } }, c.text) })) : h('div', { class: 't-ok', style: { fontSize: '12.5px', marginBottom: '10px' } }, 'This part follows the rulebook.'),
      h('span', { class: 'label' }, 'Words (click one to hear it)'), wordsEl,
      T.guessed && T.guessed.some(function (g, k) { return g && k >= p.w0 && k <= p.w1 }) ? h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '6px' } }, h('span', { class: 't-warn' }, 'Orange words'), ' were not clearly heard; their times were placed between their neighbours.') : null,
      nud);
  }

  /* ================= plan, versions ================= */
  function planJSON() { return JSON.stringify(AU.plan(P), null, 1) }
  function copyPlan() { navigator.clipboard.writeText(planJSON()).then(function () { toast('The plan is copied.', 'ok') }, function () { toast('Could not copy. Use "Download the plan" instead.', 'bad') }) }
  function downloadPlan() { var a = h('a', { href: URL.createObjectURL(new Blob([planJSON()], { type: 'application/json' })), download: (P.name || 'plan').replace(/[^\w\- ]+/g, '') + ' - plan.json' }); document.body.appendChild(a); a.click(); a.remove() }
  function versions() {
    S.versions(P.id).then(function (list) {
      var body = list.length ? h('div', { class: 'stack', style: { gap: '6px' } }, list.map(function (v) {
        return h('div', { class: 'row', style: { justifyContent: 'space-between', padding: '8px 10px', border: '1px solid var(--line)', borderRadius: '8px' } }, h('div', null, h('div', { style: { fontWeight: 600, fontSize: '13px' } }, v.label), h('div', { class: 'muted', style: { fontSize: '12px' } }, ago(v.at))),
          h('button', { class: 'btn small', onclick: function () { S.snapshot(P, 'Before going back').then(function () { var keep = P.id; P = v.data; P.id = keep; return save(true) }).then(function () { document.querySelector('.veil').remove(); toast('Went back to: ' + v.label + '.', 'ok'); render() }) } }, 'Go back to this'));
      })) : h('p', { class: 'muted' }, 'No earlier versions yet. One is kept before every big change.');
      modal({ title: 'Earlier versions', body: body, actions: [] });
    });
  }

  /* ================= start ================= */
  function start() {
    frame();
    if (/[?&]calm/.test(location.search)) document.body.classList.add('calm');
    S.persist();
    Promise.all([S.list(), S.loadFolder()]).then(function (r) { ALL = r[0]; paintFolder(); route() })
      .catch(function (e) { mainEl.appendChild(h('div', { class: 'card' }, 'The app could not open its storage: ' + (e && e.message || e) + '. Close other tabs of this app and reload.')) });
    window.addEventListener('hashchange', route);
    AUDIOEL.addEventListener('play', tick);
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  start();
})();
