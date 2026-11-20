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
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>', prev: '<path d="M18 5L8 12l10 7z"/><path d="M6 5v14"/>', next: '<path d="M6 5l10 7-10 7z"/><path d="M18 5v14"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', paste: '<path d="M9 4h6v3H9z"/><path d="M7 5H5v16h14V5h-2"/>', image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>', spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>', film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>', install: '<path d="M12 3v12M7 10l5 5 5-5"/><rect x="3" y="17" width="18" height="4" rx="1"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  function icon(n, cls) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic ' + (cls || '')); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.innerHTML = ICONS[n] || ''; return s }
  /* the app logo (Ink N), drawn inline so it can never show an old cached picture */
  function logo() {
    var w = h('span', { class: 'logo', 'aria-hidden': 'true' });
    w.innerHTML = '<svg viewBox="0 0 120 120"><defs><linearGradient id="lgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#26262a"/><stop offset="1" stop-color="#101012"/></linearGradient></defs>' +
      '<rect width="120" height="120" rx="28" fill="url(#lgA)"/><rect x="1" y="1" width="118" height="118" rx="27" fill="none" stroke="rgba(236,230,216,.18)"/>' +
      '<path d="M34 88 V32 h10 l32 40 V32 h10 v56 h-10 L44 48 v40z" fill="#ECE6D8"/><path d="M30 96 C52 80 70 56 92 26 C96 22 100 24 98 30 C82 60 62 84 38 100 C32 104 26 100 30 96Z" fill="#C8202B"/>' +
      '<circle cx="96" cy="94" r="5" fill="#C8202B"/><circle cx="86" cy="102" r="2.6" fill="#C8202B"/></svg>';
    return w;
  }
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true }
  function fmtT(t) { t = Math.max(0, t || 0); var m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1) }
  function fmtLen(t) { t = Math.round(t || 0); var m = Math.floor(t / 60), s = t % 60; return m ? m + ' min ' + s + ' s' : s + ' s' }
  function ago(ms) { var d = (Date.now() - ms) / 1000; if (d < 60) return 'just now'; if (d < 3600) return Math.floor(d / 60) + ' min ago'; if (d < 86400) return Math.floor(d / 3600) + ' h ago'; return Math.floor(d / 86400) + ' days ago' }
  function words(t) { return window.TIMING.words(t || '') }

  /* ================= shared components ================= */
  var TOASTS = h('div', { class: 'toasts' });
  function toast(msg, kind, ms, action) {
    var t = h('div', { class: 'toast ' + (kind || '') }, h('div', null, msg),
      action ? h('button', { class: 'act', onclick: function () { t.remove(); action.do() } }, action.label) : null,
      h('button', { class: 'x', 'aria-label': 'Close', onclick: function () { t.remove() } }, '×'));
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
  function chip(v, k, kind, title) { return h('span', { class: 'chip ' + (kind || ''), title: title || '' }, h('b', null, v), h('span', null, k)) }
  function stat(v, k, kind) { return h('div', { class: 'stat ' + (kind || '') }, h('div', { class: 'v' }, v), h('div', { class: 'k' }, k)) }
  function art(id) { return h('div', { class: 'art ' + id }) }

  /* ================= state ================= */
  var STAGES = [
    { id: 'style', t: 'Style', s: 'Pick the look' },
    { id: 'audio', t: 'Script & audio', s: 'Timing and parts' },
    { id: 'prompts', t: 'Prompts', s: 'Plan, assets, scenes' },
    { id: 'pick', t: 'Pick the best', s: 'A/B and the critic' },
    { id: 'sound', t: 'Sound', s: 'Music and effects' },
    { id: 'thumbs', t: 'Thumbnails', s: 'Three designs' },
    { id: 'export', t: 'Watch & export', s: 'MP4 and upload pack' }
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
    window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); INSTALL = e; if (!standalone()) installBtn.style.display = '' });
    window.addEventListener('appinstalled', function () { INSTALL = null; installBtn.style.display = 'none'; toast('Installed. Nyenz Auto-Edit now has its own window and icon.', 'ok') });
    topEl = h('header', { class: 'top' },
      h('div', { class: 'brand', onclick: function () { go('') }, title: 'Home' }, logo(), h('span', null, 'Nyenz Auto-Edit')),
      h('div', { class: 'crumb', id: 'crumb' }), h('div', { class: 'grow' }), saveEl, installBtn, h('button', { class: 'chip', title: 'Settings: keys, folders and motion', onclick: settings }, icon('gear'), h('span', { class: 'lbl' }, 'Settings')), folderChip);
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
      sideEl.appendChild(h('div', { class: 'foot' }, h('div', null, 'Old app: ', h('a', { href: 'legacy.html', style: { color: 'var(--gold)' } }, 'open it here')), h('div', { class: 'mono', style: { marginTop: '6px', fontSize: '10.5px' } }, 'Version ' + (window.APP_VERSION || ''))));
      return;
    }
    sideEl.appendChild(h('div', { class: 'cap' }, 'Stages'));
    STAGES.forEach(function (s, i) {
      var done = stageDone(s.id), nm = s.id === 'pick' ? stageNames() : s;
      sideEl.appendChild(h('div', { class: 'stage' + (s.id === STAGE ? ' on' : '') + (s.locked ? ' locked' : '') + (done ? ' done' : ''), title: s.locked ? 'Coming next' : '', onclick: function () { if (!s.locked) go(P.id + '/' + s.id) } },
        h('span', { class: 'n' }, s.locked ? icon('lock') : done && s.id !== STAGE ? icon('check') : String(i + 1)), h('span', { class: 'l' }, h('span', { class: 't' }, nm.t), h('span', { class: 's' }, s.locked ? 'Coming next' : nm.s))));
    });
    sideEl.appendChild(h('div', { class: 'foot' }, h('div', null, 'Style: ', h('b', null, window.styleById(P.style).name)), h('div', null, P.format === 'long' ? 'Long video, 16:9' : 'Short, 9:16')));
  }
  function stageDone(id) {
    if (id === 'style') return !!P.styleChosen;
    if (id === 'audio') return !!(P.timing && P.timing.words && P.timing.words.length);
    var L = P.jobs ? window.JOBS.list(P) : [];
    if (id === 'prompts') return L.length > 1 && L.every(function (j) { return j.A || j.B });
    if (id === 'pick') return L.length > 1 && L.every(function (j) { return window.JOBS.picked(j) });
    if (id === 'sound') return !!(P.sound && (P.sound.music || (P.sound.cues || []).length));
    if (id === 'thumbs') return !!(P.thumbs && P.thumbs.concepts && P.thumbs.concepts.length);
    if (id === 'export') return !!P.exported;
    return false;
  }
  function crumb() {
    var c = document.getElementById('crumb'); c.innerHTML = '';
    if (P) c.appendChild(h('span', null, h('a', { onclick: function () { go('') } }, 'Your videos'), '  /  ', h('b', { title: 'Rename', onclick: function () { rename(P) } }, P.name)));
  }

  /* ================= routing ================= */
  function go(path) { if (location.hash.slice(2) === path) route(); else location.hash = '#/' + path }
  function route() {
    stopAudio(); SD.stop(); WATCH.on = false; SPLAY.on = false;
    var parts = location.hash.replace(/^#\/?/, '').split('/');
    if (!parts[0]) { closeMaster(); SD.stop(); P = null; render(); return }
    var id = parts[0], stage = parts[1] || 'style';
    PICKVIEW = stage === 'pick' && parts[2] ? decodeURIComponent(parts[2]) : null;
    var have = ALL.filter(function (x) { return x.id === id })[0];
    var load = have ? Promise.resolve(have) : S.get(id);
    load.then(function (p) {
      if (!p) { toast('That video was not found. It may have been deleted.', 'warn'); go(''); return }
      if (!P || P.id !== p.id) { closeMaster(); SD.stop(); UNDO = []; CURKEY = ''; P = p; SELPART = 0; SELWORD = -1; AUDIOTAB = p.timing ? 'parts' : 'inputs'; PREVIEW = p.style; loadAudio() }
      STAGE = STAGES.some(function (s) { return s.id === stage && !s.locked }) ? stage : 'style';
      if (PICKVIEW && !(p.jobs && p.jobs[PICKVIEW])) PICKVIEW = null;
      render();
    });
  }
  function render() {
    PLAYBTNS = []; PLAYERUI = null;
    sidebar(); crumb();
    mainEl.innerHTML = ''; mainEl.scrollTop = 0;
    if (!P) { saveEl.textContent = ''; mainEl.appendChild(home()); return }
    if (!saveEl.textContent) { saveEl.textContent = 'Saved'; saveEl.className = 'save-state ok' }
    var pages = { style: stylePage, audio: audioPage, prompts: promptsPage, pick: pickPage, sound: soundPage, thumbs: thumbsPage, export: exportPage };
    mainEl.appendChild((pages[STAGE] || stylePage)());
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
    return h('div', { class: 'page fit' },
      h('div', { class: 'titlebar' }, backBtn(), h('div', null, h('h1', null, '1. Pick a style'), h('p', null, 'Every video in a style looks the same, and each style keeps its own assets.'))),
      h('div', { class: 'cols fitcols fill' }, h('div', { class: 'stack scrollbox' }, mainCard, h('div', { class: 'card' }, head, body)), demo),
      nextBar(null, P.styleChosen ? { label: 'Next: Script & audio', go: 'audio' } : { label: 'Pick a style to go on', off: true }));
  }

  /* ================= shared page pieces ================= */
  function backBtn() { return h('button', { class: 'back', title: 'Back to your videos', 'aria-label': 'Back to your videos', onclick: function () { go('') } }, icon('chev')) }
  function nextBar(back, next) {
    return h('div', { class: 'nextbar' },
      back ? h('button', { class: 'btn quiet', onclick: function () { go(P.id + '/' + back.go) } }, h('span', { style: { display: 'inline-flex', transform: 'rotate(180deg)' } }, icon('chev')), back.label) : h('button', { class: 'btn quiet', onclick: function () { go('') } }, h('span', { style: { display: 'inline-flex', transform: 'rotate(180deg)' } }, icon('chev')), 'Your videos'),
      h('div', { class: 'grow' }),
      next ? h('button', { class: 'btn' + (next.off ? '' : ' primary'), disabled: next.off ? true : null, onclick: function () { if (!next.off) go(P.id + '/' + next.go) } }, next.label, next.off ? null : icon('chev')) : null);
  }

  /* ================= playback: one player, every play button shows its real state ================= */
  var CURKEY = '', PLAYBTNS = [], PLAYERUI = null;
  function playToggle(key, a, b) {
    if (!AUDIOEL.src) { toast('Add the audio first.', 'warn'); return }
    if (CURKEY === key && !AUDIOEL.paused) { AUDIOEL.pause(); return }
    var t = AUDIOEL.currentTime;
    if (CURKEY === key && t > a + .05 && t < b - .05) { PLAYEND = b; AUDIOEL.play().catch(function () {}); return }   // resume where it paused
    CURKEY = key; playRange(a, b);
  }
  function playBtn(key, a, b, label, cls) {
    var btn = h('button', { class: 'btn ' + (cls || 'small'), 'aria-label': 'Play', onclick: function (e) { e.stopPropagation(); playToggle(key, a(), b()) } });
    btn._key = key; btn._label = label; PLAYBTNS.push(btn); paintBtn(btn); return btn;
  }
  function paintBtn(btn) {
    var on = CURKEY === btn._key && !AUDIOEL.paused;
    btn.innerHTML = ''; btn.appendChild(icon(on ? 'pause' : 'play')); if (btn._label) btn.appendChild(document.createTextNode(on ? 'Pause' : btn._label));
    btn.classList.toggle('playing', on); btn.setAttribute('aria-label', on ? 'Pause' : 'Play'); btn.title = on ? 'Pause (Space)' : 'Play (Space)';
  }
  function syncPlay() { PLAYBTNS = PLAYBTNS.filter(function (b) { return b.isConnected }); PLAYBTNS.forEach(paintBtn); paintPlayer() }
  function stopAll() { stopAudio(); AUDIOEL.currentTime = 0; CURKEY = ''; syncPlay(); paintPlayhead(0, true) }
  function playerBar(parts) {
    var dur = (P.timing && P.timing.duration) || (P.audio && P.audio.duration) || 0;
    var time = h('span', { class: 'time' }), where = h('span', { class: 'where' }), fill = h('i');
    var bar = h('div', { class: 'bar', title: 'Click to play from here', onclick: function (e) { var r = bar.getBoundingClientRect(), t = (e.clientX - r.left) / r.width * dur; CURKEY = 'all'; playRange(t, dur) } }, fill);
    function stepPart(d) { if (!parts.length) return; SELPART = Math.max(0, Math.min(parts.length - 1, SELPART + d)); SELWORD = -1; render(); var q = parts[SELPART]; CURKEY = 'part' + SELPART; playRange(q.start, q.end) }
    var el = h('div', { class: 'player' },
      parts.length ? h('button', { class: 'btn round', title: 'Previous part (Left arrow)', 'aria-label': 'Previous part', onclick: function () { stepPart(-1) } }, icon('prev')) : null,
      playBtn(parts.length && AUDIOTAB === 'parts' ? 'part' + SELPART : 'all', function () { return parts.length && AUDIOTAB === 'parts' ? parts[SELPART].start : 0 }, function () { return parts.length && AUDIOTAB === 'parts' ? parts[SELPART].end : dur }, null, 'round primary'),
      h('button', { class: 'btn round', title: 'Stop', 'aria-label': 'Stop', onclick: stopAll }, icon('stop')),
      parts.length ? h('button', { class: 'btn round', title: 'Next part (Right arrow)', 'aria-label': 'Next part', onclick: function () { stepPart(1) } }, icon('next')) : null,
      time, bar, where, h('span', { class: 'keys' }, 'Space: play or pause'));
    PLAYERUI = { time: time, fill: fill, where: where, dur: dur, parts: parts };
    paintPlayer();
    return el;
  }
  function paintPlayer() {
    if (!PLAYERUI || !PLAYERUI.time.isConnected) return;
    var t = AUDIOEL.currentTime || 0, d = PLAYERUI.dur || 0, ps = PLAYERUI.parts, cur = -1;
    for (var i = 0; i < ps.length; i++) if (t >= ps[i].start && t < ps[i].end) cur = i;
    PLAYERUI.time.textContent = fmtT(t) + ' / ' + fmtT(d);
    PLAYERUI.fill.style.width = (d ? Math.min(100, t / d * 100) : 0) + '%';
    PLAYERUI.where.textContent = cur >= 0 ? 'Part ' + ps[cur].id : '';
  }

  /* ================= undo for small edits (cuts, word times) ================= */
  var UNDO = [];
  function remember(label) { UNDO.push({ label: label, cuts: (P.cuts || []).slice(), words: P.timing ? JSON.stringify(P.timing.words) : null, guessed: P.timing && P.timing.guessed ? P.timing.guessed.slice() : null }); if (UNDO.length > 50) UNDO.shift() }
  function undo() {
    var u = UNDO.pop(); if (!u) { toast('Nothing to undo.', 'info'); return }
    P.cuts = u.cuts; if (u.words && P.timing) { P.timing.words = JSON.parse(u.words); P.timing.guessed = u.guessed }
    save(); render(); toast('Undone: ' + u.label + '.', 'info');
  }
  var undoAct = { label: 'Undo', do: function () { undo() } };

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
      paintPlayhead(t); paintPlayer();
      if (!AUDIOEL.paused) RAF = requestAnimationFrame(step); else paintPlayhead(t, true);
    });
  }
  var paintPlayhead = function () {};

  function audioPage() {
    var T = P.timing, parts = T ? AU.parts(T.words, P.cuts || [], T.duration) : [];
    var pg = h('div', { class: 'page fit' },
      h('div', { class: 'titlebar' }, backBtn(), h('div', null, h('h1', null, '2. Script & audio'), h('p', null, 'The app listens to your narration, matches every word to the script and splits it into parts.')), h('div', { class: 'grow' }),
        T ? h('button', { class: 'btn', onclick: function (e) { e.stopPropagation(); menu(e.currentTarget, [
          { label: 'Copy the plan (JSON)', icon: 'copy', do: copyPlan }, { label: 'Download the plan', icon: 'download', do: downloadPlan }, '-', { label: 'Undo: earlier versions', icon: 'undo', do: versions }]) } }, icon('more'), 'More') : null),
      h('div', { class: 'toolbar' }, tabs([{ id: 'inputs', label: 'Script & audio' }, { id: 'parts', label: 'Timing & parts', count: T ? parts.length : null }], AUDIOTAB, function (t) { if (t === 'parts' && !T) { toast('Press "Listen and split" first.', 'warn'); return } AUDIOTAB = t; render() }), h('div', { class: 'grow' }), P.audio ? playerBar(parts) : null));
    var pane = AUDIOTAB === 'parts' && T ? partsPane(T, parts) : inputsPane(); pane.classList.add('fill'); pg.appendChild(pane);
    pg.appendChild(nextBar({ label: 'Style', go: 'style' }, T ? { label: 'Next: Prompts', go: 'prompts' } : { label: 'Listen and split first', off: true }));
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
    var playBtn0 = playBtn('all', function () { return 0 }, function () { return (P.timing && P.timing.duration) || (P.audio && P.audio.duration) || 1e9 });
    var line = P.audio ? h('div', { class: 'audio-line' }, playBtn0, h('div', { style: { minWidth: 0, flex: 1 } }, h('div', { class: 'nm' }, P.audio.name), h('div', { class: 'muted mono', style: { fontSize: '11.5px' } }, (P.audio.duration ? fmtLen(P.audio.duration) + ' · ' : '') + (P.audio.size / 1048576).toFixed(1) + ' MB'))) : null;

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
    left.classList.add('scrollbox'); right.classList.add('scrollbox');
    return h('div', { class: 'cols fitcols tabpane' }, left, right);
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
    BUSY = true; AUDIOTAB = 'inputs'; PROG = { msg: 'Reading the audio…', f: null }; render();
    var shown = null;
    function status(msg, f) { PROG = { msg: msg, f: f == null ? null : f }; var pl = mainEl.querySelector('.status-line'), bar = mainEl.querySelector('.progress'); if (pl) pl.textContent = msg; if (bar) { bar.classList.toggle('indeterminate', f == null); bar.firstChild.style.width = ((f || 0) * 100) + '%' } }
    S.getBlob(P.id + ':audio').then(function (blob) {
      if (!blob) throw new Error('The audio file is missing. Add it again.');
      return AU.analyse(P.script, blob, status);
    }).then(function (r) {
      if (P.timing) S.snapshot(P, 'Before listening again');
      r.script = P.script; P.timing = r; P.audio.duration = r.duration;
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
    var box = h('div', { class: 'tabpane fitpane' },
      h('div', { class: 'chips' },
        chip(fmtT(T.duration), 'long'), chip(String(T.words.length), 'words'), chip(String(parts.length), parts.length === 1 ? 'part' : 'parts', bad ? 'bad' : warn ? 'warn' : 'ok', bad || warn ? plural(warn, 'part') + ' to look at' : 'Every part follows the rules'),
        chip(wps.toFixed(1), 'words a second', wps < AU.RULES.wpsLow || wps > AU.RULES.wpsHigh ? 'warn' : 'ok'),
        heard == null ? h('button', { class: 'chip warn click', title: 'Why are the times estimated?', onclick: function () { modal({ title: 'The times are estimated', body: h('p', { class: 'muted', style: { fontSize: '13px', lineHeight: 1.6, margin: 0 } }, 'Whisper could not run in this browser, so words were placed from the pauses (rulebook timing level B). Use Chrome or Edge and press "Listen and split again" for exact times.'), actions: [{ label: 'Listen and split again', primary: true, do: function () { analyse() } }] }) } }, h('b', null, 'Times estimated'), h('span', null, 'from pauses · why?'))
          : chip(heard + '%', 'heard clearly', heard >= 90 ? 'ok' : 'warn')));
    if (T.script != null && T.script !== P.script) box.appendChild(h('div', { class: 'warnline' },
      h('div', { class: 'row' }, h('div', { style: { flex: 1, minWidth: '220px' } }, h('b', null, 'The script changed after the timing was made. '), h('span', { class: 'muted' }, 'The parts below still use the old words. Listen again so the words, times and parts match.')),
        h('button', { class: 'btn primary', onclick: function () { analyse() } }, icon('split'), 'Listen and split again'))));
    // the 'times are estimated' note is the orange chip above (click it for why)
    box.appendChild(timeline(T, parts));
    var listBox = h('div', { class: 'plist scrollbox' }, parts.map(function (p, i) {
      var checks = AU.check(p, i === parts.length - 1), lvl = checks.some(function (c) { return c.level === 'bad' }) ? 'bad' : checks.length ? 'warn' : '';
      return h('div', { class: 'pitem ' + lvl + (i === SELPART ? ' on' : ''), onclick: function () { if (SELPART !== i) { SELPART = i; SELWORD = -1; render() } } },
        h('div', { class: 'num' }, String(p.id)),
        h('div', { style: { minWidth: 0 } },
          h('div', { class: 'hd' }, h('span', { class: 'mono' }, fmtT(p.start) + ' – ' + fmtT(p.end)), h('span', { class: 'mono muted' }, p.len.toFixed(1) + ' s'), h('span', { class: 'mono muted' }, p.wps.toFixed(1) + ' w/s'),
            checks.length ? h('span', { class: lvl === 'bad' ? 't-bad' : 't-warn' }, checks[0].short) : h('span', { class: 't-ok' }, 'Good')),
          h('div', { class: 'txt' }, p.text)),
        playBtn('part' + i, function () { return p.start }, function () { return p.end }));
    }));
    function markSel() { Array.prototype.forEach.call(listBox.children, function (c, k) { c.classList.toggle('on', k === SELPART) }) }
    var det = partDetail(T, parts[SELPART], SELPART === parts.length - 1); det.classList.add('scrollbox');
    box.appendChild(h('div', { class: 'cols fitcols grow-row', style: { marginTop: '12px' } }, listBox, det));
    return box;
  }

  function timeline(T, parts) {
    var wrap = h('div', { class: 'tl' }), scroller = h('div', { class: 'scroller' }), inner = h('div', { class: 'inner' }), cv = h('canvas');
    scroller.appendChild(inner); inner.appendChild(cv); wrap.appendChild(scroller);
    var gaps = AU.gaps(T.words, P.script), cutSet = {}; (P.cuts || []).forEach(function (c) { cutSet[c] = 1 });
    var head = h('div', { class: 'head', style: { display: 'none' } });
    wrap.appendChild(h('div', { class: 'bar2' }, h('span', { class: 'legend' }, h('i'), 'Cut between parts'), h('span', { class: 'legend' }, h('i', { class: 'c' }), 'Other long pause after a sentence (click to cut here)'), h('div', { class: 'grow' }),
      h('button', { class: 'btn small', onclick: function () { S.snapshot(P, 'Before automatic split'); remember('the automatic split'); P.cuts = AU.split(T.words, P.script, T.duration); save(); toast('Split again automatically: ' + (P.cuts.length + 1) + ' parts.', 'ok', 6000, undoAct); render() } }, icon('split'), 'Split again automatically')));
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
        inner.appendChild(h('div', { class: 'part' + (i === SELPART ? ' on' : '') + lvl, style: { left: p.start * pps + 1 + 'px', width: Math.max(10, (p.end - p.start) * pps - 2) + 'px' }, title: 'Part ' + p.id + ': ' + p.len.toFixed(1) + ' s', onclick: function () { SELPART = i; SELWORD = -1; render(); CURKEY = 'part' + i; playRange(p.start, p.end) } }, 'Part ' + p.id + ' · ' + p.len.toFixed(0) + ' s'));
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
      inner.onclick = function (e) { if (e.target !== inner && e.target !== cv) return; var r = inner.getBoundingClientRect(), tt = (e.clientX - r.left) / pps; CURKEY = 'all'; playRange(tt, T.duration) };
      if (sel && full > W) scroller.scrollLeft = Math.max(0, sel.start * pps - 40);
    }
    requestAnimationFrame(layout);
    var ro = new ResizeObserver(function () { layout() }); ro.observe(scroller);
    return wrap;
  }
  function toggleCut(idx) {
    S.snapshot(P, 'Before moving a cut'); remember('the cut change');
    var i = (P.cuts || []).indexOf(idx);
    if (i >= 0) { P.cuts.splice(i, 1); toast('Joined the two parts.', 'info', 6000, undoAct) } else { P.cuts.push(idx); P.cuts.sort(function (a, b) { return a - b }); toast('Cut added: a new part starts at "' + P.timing.words[idx][0] + '".', 'info', 6000, undoAct) }
    save(); render();
  }

  var paintWord = function () {};
  function partDetail(T, p, isLast) {
    if (!p) return h('div');
    var checks = AU.check(p, isLast), wordsEl = h('div', { class: 'words' });
    var spans = [];
    for (var i = p.w0; i <= p.w1 && i >= 0; i++) (function (i) {
      var s = h('span', { class: (T.guessed && T.guessed[i] ? 'g' : '') + (i === SELWORD ? ' sel' : ''), title: fmtT(T.words[i][1]) + ' – ' + fmtT(T.words[i][2]) + (T.guessed && T.guessed[i] ? ' · not clearly heard, time placed between its neighbours' : ''), onclick: function () { SELWORD = i; render(); CURKEY = 'word'; playRange(T.words[i][1], T.words[i][2] + .05) } }, T.words[i][0]);
      spans.push([i, s]); wordsEl.appendChild(s); wordsEl.appendChild(document.createTextNode(' '));
    })(i);
    paintWord = function (t) { spans.forEach(function (x) { var w = T.words[x[0]]; x[1].classList.toggle('now', t >= w[1] && t < w[2] + .02 && !AUDIOEL.paused) }) };
    var nud = null;
    if (SELWORD >= p.w0 && SELWORD <= p.w1) {
      var w = T.words[SELWORD];
      function shift(which, d) {
        remember('the word time change');
        var W = T.words, k = SELWORD, lo = k > 0 ? W[k - 1][2] : 0, hi = k < W.length - 1 ? W[k + 1][1] : T.duration;
        if (which === 'start') W[k][1] = Math.round(Math.min(W[k][2] - .03, Math.max(lo, W[k][1] + d)) * 100) / 100;
        else W[k][2] = Math.round(Math.max(W[k][1] + .03, Math.min(hi, W[k][2] + d)) * 100) / 100;
        if (T.guessed) T.guessed[k] = false;
        save(); render(); CURKEY = 'word'; playRange(W[k][1], W[k][2] + .05);
      }
      nud = h('div', { class: 'glass', style: { marginTop: '12px' } }, h('div', { class: 'row' }, h('b', null, '"' + w[0] + '"'), h('span', { class: 'mono muted' }, fmtT(w[1]) + ' – ' + fmtT(w[2]))),
        h('div', { class: 'nudger' }, h('span', { class: 'muted' }, 'Starts'), h('button', { class: 'btn small', onclick: function () { shift('start', -.05) } }, 'Earlier'), h('button', { class: 'btn small', onclick: function () { shift('start', .05) } }, 'Later'),
          h('span', { class: 'muted', style: { marginLeft: '8px' } }, 'Ends'), h('button', { class: 'btn small', onclick: function () { shift('end', -.05) } }, 'Earlier'), h('button', { class: 'btn small', onclick: function () { shift('end', .05) } }, 'Later')),
        h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '6px' } }, 'Each press moves it 0.05 s. Only fix a word if its caption is clearly early or late.'));
    }
    return h('div', { class: 'panel' },
      h('div', { class: 'row' }, h('h2', { style: { margin: 0 } }, 'Part ' + p.id), h('span', { class: 'mono muted' }, fmtT(p.start) + ' – ' + fmtT(p.end)), h('div', { style: { flex: 1 } }),
        playBtn('part' + SELPART, function () { return p.start }, function () { return p.end }, 'Play part', 'small primary')),
      h('div', { class: 'facts' }, [['Length', p.len.toFixed(1) + ' s'], ['Words', String(p.words)], ['Words a second', p.wps.toFixed(1)]].map(function (f) { return h('div', { class: 'glass' }, h('div', { class: 'k' }, f[0]), h('div', { class: 'v mono' }, f[1])) })),
      checks.length ? h('div', { style: { marginBottom: '10px' } }, checks.map(function (c) { return h('div', { class: c.level === 'bad' ? 't-bad' : 't-warn', style: { fontSize: '12.5px' } }, c.text) })) : h('div', { class: 't-ok', style: { fontSize: '12.5px', marginBottom: '10px' } }, 'This part follows the rulebook.'),
      h('span', { class: 'label' }, 'Words (click one to hear it)'), wordsEl,
      T.guessed && T.guessed.some(function (g, k) { return g && k >= p.w0 && k <= p.w1 }) ? h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '6px' } }, h('span', { class: 't-warn' }, 'Orange words'), ' were not clearly heard; their times were placed between their neighbours.') : null,
      nud);
  }

  /* ================= the project file in the locked frame (one at a time, rebuilt when the picks change) ================= */
  var J = window.JOBS, GK = window.GK, CR = window.CRITIC, SD = window.SOUND, REPLY = window.REPLY;
  var MASTER = { key: '', host: null, info: null, job: null };
  function masterKey() { return JSON.stringify([GK.plan(P), J.blocks(P)]) }
  function master() {
    var k = masterKey();
    if (MASTER.key === k && MASTER.job) return MASTER.job;
    if (MASTER.host) MASTER.host.close();
    MASTER.key = k; MASTER.host = null; MASTER.info = null;
    MASTER.job = GK.open(P, J.blocks(P)).then(function (H) { MASTER.host = H; return H.ask({ cmd: 'info' }) }).then(function (info) { MASTER.info = info || { errors: ['The project file did not answer.'], built: [], lint: {}, assets: [], cast: [] }; return MASTER });
    return MASTER.job;
  }
  function closeMaster() { if (MASTER.host) MASTER.host.close(); MASTER = { key: '', host: null, info: null, job: null } }
  function ensureJobs() { if (!P.jobs || !P.jobs.plan) J.build(P, { assets: Object.keys(GK.libraryNames().assets), cast: Object.keys(GK.libraryNames().cast) }) }
  function rebuildJobs() { J.build(P, { assets: Object.keys(GK.libraryNames().assets), cast: Object.keys(GK.libraryNames().cast) }) }
  function download(name, blob) { var a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove() }, 4000) }
  function safeName(n) { return String(n || 'video').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'video' }
  function fileForModel() {
    return GK.compose(P, J.blocks(P)).then(function (t) { download(J.fileName(P), new Blob([t], { type: 'text/html' })); toast('Project file ' + J.stamp(P) + ' is downloaded. Attach it in the Sonnet chat together with the prompt (the number must match).', 'ok', 7000) })
      .catch(function (e) { toast('Could not make the file: ' + e.message, 'bad') });
  }
  function copyText(t, what, hint) { return navigator.clipboard.writeText(t).then(function () { toast((what || 'Copied') + '. ' + (hint || 'Paste it into the Sonnet chat.'), 'ok', hint ? 6500 : 4200) }, function () { modal({ title: 'Copy this', body: h('textarea', { class: 'area', style: { minHeight: '260px' } }, t), actions: [] }) }) }
  function needTiming() {
    if (P.timing && P.timing.words && P.timing.words.length) return null;
    return h('div', { class: 'card locked-page' }, h('h2', null, 'Finish Script & audio first'), h('p', { class: 'muted' }, 'This stage uses the parts and word times from stage 2.'), h('button', { class: 'btn primary', onclick: function () { go(P.id + '/audio') } }, 'Go to Script & audio'));
  }
  function pageHead(n, title, sub, extra) { return h('div', { class: 'titlebar' }, backBtn(), h('div', null, h('h1', null, n + '. ' + title), h('p', null, sub)), h('div', { class: 'grow' }), extra || null) }

  /* ================= checking and saving replies ================= */
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's') }
  function fmtN(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
  function finishCheck(statics, run, r) {
    var problems = statics.concat(run), c = REPLY.counts(problems);
    return { ok: !c.errors, notes: c.notes, problems: problems, issues: problems.filter(function (p) { return p.level === 'error' }).map(function (p) { return p.title }),
      lintPass: r && r.lint ? r.lint.filter(function (x) { return x.ok }).length : null, lintAll: r && r.lint ? r.lint.length : null, at: Date.now() };
  }
  /* run one saved version in the locked frame: does it draw, does it pass LINT */
  function checkVersion(job, ver, statics) {
    if (job.kind === 'plan') { ver.check = finishCheck(statics, [], null); return Promise.resolve(ver) }
    return CR.inspect(P, job, ver === job.A ? 'A' : 'B').then(function (r) {
      ver.check = finishCheck(statics, REPLY.runProblems(P, job, ver, r), r); return ver;
    }).catch(function (e) {
      ver.check = finishCheck(statics, [{ id: 'check-failed', level: 'error', title: 'The check could not run', detail: e.message, fix: 'Paste the reply again. If it keeps failing, the code may hang the page.' }], null); return ver;
    });
  }
  /* read, save and check one reply. Rejects with { res } when there is nothing to save (the report says why). */
  function storeVersion(job, v, text, o) {
    var res = REPLY.read(P, job, text, { version: J.mode(P) === 'single' ? null : v, allowMany: o && o.allowMany });
    if (!res.usable) return Promise.reject({ res: res });
    if (job[v]) S.snapshot(P, 'Before replacing ' + J.tag(P, job) + (J.mode(P) === 'single' ? '' : ' ' + v));
    var ver = { at: Date.now(), raw: String(text).slice(0, 200000), found: res.found };
    if (job.kind === 'plan') ver.plan = res.plan; else { ver.code = res.code; ver.full = !!res.full; ver.note = res.note || '' }
    job[v] = ver; if (job.pick === v) job.pick = null; job.critic = null; job.fail = null;
    return checkVersion(job, ver, res.problems).then(function () {
      if (J.mode(P) === 'single' && v === 'A' && ver.check.ok) usePick(job, 'A', true);   // one prompt: a reply that passes is used straight away
      return save(true);
    }).then(function () { return { ver: ver, res: res } });
  }
  function noteFail(job, res, v, text) {
    job.fail = { at: Date.now(), v: v, found: res.found, problems: res.problems, redirect: res.redirect ? res.redirect.id : null, raw: String(text).slice(0, 60000) };
    return save(true);
  }

  /* the problem report: what the app found, each problem with its fix, what to do next, and the buttons to do it */
  function problemPanel(job, d, o) {
    o = o || {};
    var probs = d.problems || [], c = REPLY.counts(probs), tag = J.tag(P, job), redirect = d.redirect ? P.jobs[d.redirect] : null, res = { found: d.found || [], redirect: redirect };
    var box = h('div', { class: 'rep' });
    var headTxt = !o.saved ? 'Reply for ' + tag + ' was NOT saved' : c.errors ? tag + ' saved, but it needs a fix' : tag + ' saved' + (o.inUse ? ' and in use' : '') + (c.notes ? ', with ' + plural(c.notes, 'note') : '');
    box.appendChild(h('div', { class: 'rep-head ' + (c.errors || !o.saved ? 'bad' : 'warn') }, h('b', null, headTxt), h('span', { class: 'mono' }, plural(c.errors, 'problem') + (c.notes ? ' · ' + plural(c.notes, 'note') : ''))));
    box.appendChild(h('div', { class: 'rep-sec' }, h('div', { class: 'rep-k' }, 'What the app found'), h('ul', { class: 'rep-list' }, res.found.map(function (f) { return h('li', null, f) }))));
    if (probs.length) box.appendChild(h('div', { class: 'rep-sec' }, h('div', { class: 'rep-k' }, 'Problems'),
      probs.map(function (p, i) { return h('div', { class: 'prob ' + p.level }, h('div', { class: 't' }, h('span', { class: 'n mono' }, String(i + 1)), h('span', null, p.title), h('span', { class: 'lv' }, p.level === 'error' ? 'problem' : 'note')), h('div', { class: 'd' }, p.detail), h('div', { class: 'f' }, h('b', null, 'Fix: '), p.fix)) })));
    box.appendChild(h('div', { class: 'rep-sec' }, h('div', { class: 'rep-k' }, 'What to do next'), h('ol', { class: 'rep-list' }, REPLY.steps(P, job, probs, res).map(function (s) { return h('li', null, s) }))));
    var acts = h('div', { class: 'row' });
    if (redirect && o.onMove) acts.appendChild(h('button', { class: 'btn small primary', onclick: function () { o.onMove(redirect) } }, icon('paste'), 'Save it in ' + J.tag(P, redirect)));
    if (probs.length && !redirect) acts.appendChild(h('button', { class: 'btn small primary', onclick: function () { copyText(REPLY.fixMessage(P, job, probs, o.fixVer || null), 'The fix message for ' + tag + ' is copied', 'Send it in the same Sonnet chat.') } }, icon('copy'), 'Copy fix message'));
    acts.appendChild(h('button', { class: 'btn small', onclick: function () { copyText(o.promptFn ? o.promptFn() : J.prompt(P, job, J.mode(P)), 'Prompt ' + tag + ' is copied', 'Open a NEW Sonnet chat, attach project file ' + J.stamp(P) + ' and paste.') } }, icon('copy'), 'Copy prompt again'));
    acts.appendChild(h('button', { class: 'btn small', onclick: function () { copyText(REPLY.report(P, job, res, probs), 'The details are copied', 'Paste them wherever you need them.') } }, icon('copy'), 'Copy all details'));
    if (o.saved && c.errors && o.onUse) acts.appendChild(h('button', { class: 'btn small', onclick: o.onUse }, icon('check'), 'Use it anyway'));
    box.appendChild(acts);
    return box;
  }
  /* the saved problems of a job (and the last paste that was refused), opened from a card */
  function detailsModal(job) {
    var body = h('div', { class: 'rep-stack' }), single = J.mode(P) === 'single', close;
    ['A', 'B'].forEach(function (v) {
      var x = job[v]; if (!x || !x.check || !(x.check.problems || []).length) return;
      body.appendChild(h('div', null, single ? null : h('div', { class: 'rep-k', style: { margin: '0 0 6px' } }, 'Version ' + v),
        problemPanel(job, { found: x.found || [], problems: x.check.problems }, { saved: true, v: v, fixVer: single ? null : v, inUse: job.pick === v, onUse: function () { usePick(job, v); close(); render() } })));
    });
    if (job.fail && (!job.A || job.fail.at > job.A.at)) body.appendChild(problemPanel(job, job.fail, { saved: false, v: job.fail.v, onMove: function (o2) { moveReply(job, o2, job.fail.raw, job.fail.v, close) } }));
    if (!body.children.length) body.appendChild(h('div', { class: 'muted' }, 'No problems were found.'));
    close = modal({ title: 'Details · ' + J.label(P, job), body: body, actions: [] });
  }
  /* a reply pasted into the wrong prompt: save it where it belongs */
  function moveReply(from, to, text, v, close) {
    var m = J.mode(P), v2 = m === 'single' ? 'A' : (v || 'A');
    storeVersion(to, v2, text).then(function (r) { if (close) close(); render(); toast('Saved in ' + J.label(P, to) + (r.ver.check.ok ? '. It draws and passes the checks.' : '. It needs a fix: open its card.'), r.ver.check.ok ? 'ok' : 'warn', 7000) },
      function (e) { toast(e && e.res ? 'It could not be saved in ' + J.tag(P, to) + ' either: ' + ((e.res.problems[0] || {}).title || 'see its card') + '.' : 'Could not save: ' + (e && e.message), 'bad', 8000) });
  }

  function pasteBox(job, v) {
    var mode = J.mode(P), one = mode === 'one' && !v, tag = J.tag(P, job), close;
    if (mode === 'single') v = 'A';
    var ta = h('textarea', { class: 'area', style: { minHeight: '170px' }, placeholder: 'Paste the whole Sonnet reply here.' }), out = h('div', { class: 'rep-stack' });
    var first = J.replyLine(P, job, one ? 'A' : (mode === 'single' ? null : v));
    var title = (one ? 'Paste the reply with both versions' : mode === 'single' ? 'Paste the reply' : 'Paste version ' + v) + ' · ' + J.label(P, job);
    var body = h('div', null,
      h('p', { class: 'muted', style: { margin: '0 0 8px', fontSize: '12.5px' } }, 'Paste everything Sonnet wrote. The app checks the format, the numbers and that the code draws.'),
      h('div', { class: 'expect' }, h('span', { class: 'k' }, 'First line expected'), h('code', null, first)), ta, out);
    var label = 'Check and save';
    function run() {
      var txt = ta.value, btn = document.querySelector('.modal .btn.primary');
      btn.setAttribute('disabled', ''); btn.textContent = 'Checking…'; out.innerHTML = '';
      function restore() { btn.removeAttribute('disabled'); btn.textContent = label }
      var items;
      if (one) {
        var pairs = txt.trim() ? GK.splitVersions(txt) : null;
        if (!pairs) {
          var d0 = txt.trim() ? { found: ['Characters pasted: ' + fmtN(txt.length) + '.', 'Lines "=== VERSION A ===" and "=== VERSION B ===": not both found.'], problems: [{ id: 'no-versions', level: 'error', title: 'The two versions were not found', detail: 'The reply must hold the line "=== VERSION A ===" before the first code block and "=== VERSION B ===" before the second.', fix: 'Ask for exactly two code blocks, each after its VERSION line. Or switch to "Compare: two chats" and paste each version on its own.' }] } : REPLY.read(P, job, '', {});
          restore(); out.appendChild(problemPanel(job, d0, { saved: false })); noteFail(job, d0, null, txt); render(); return false;
        }
        items = [['A', pairs.A], ['B', pairs.B]];
      } else items = [[v, txt]];
      var shown = [], chain = Promise.resolve();
      items.forEach(function (x) {
        chain = chain.then(function () {
          return storeVersion(job, x[0], x[1]).then(function (r) { shown.push({ v: x[0], saved: true, d: { found: r.res.found, problems: job[x[0]].check.problems } }) },
            function (e) { if (!e || !e.res) throw e; noteFail(job, e.res, x[0], x[1]); shown.push({ v: x[0], saved: false, text: x[1], d: { found: e.res.found, problems: e.res.problems, redirect: e.res.redirect && e.res.redirect.id } }) });
        });
      });
      chain.then(function () {
        restore(); render();
        var bad = shown.some(function (s) { return !s.saved || !job[s.v].check.ok }), notes = shown.reduce(function (n, s) { return n + (s.saved ? job[s.v].check.notes || 0 : 0) }, 0);
        if (!bad) { close(); toast(tag + ' saved and checked: it draws and passes.' + (mode === 'single' ? ' It is in use.' : '') + (notes ? ' ' + plural(notes, 'note') + ' about the format.' : ''), notes ? 'warn' : 'ok', notes ? 8000 : 6000, notes ? { label: 'See notes', do: function () { detailsModal(job) } } : null); return }
        shown.forEach(function (s) {
          out.appendChild(h('div', null, shown.length > 1 ? h('div', { class: 'rep-k', style: { margin: '0 0 6px' } }, 'Version ' + s.v) : null,
            problemPanel(job, s.d, { saved: s.saved, v: s.v, fixVer: mode === 'single' ? null : s.v, inUse: s.saved && job.pick === s.v, onMove: function (o2) { moveReply(job, o2, s.text, s.v, close) }, onUse: function () { usePick(job, s.v); close(); render() } })));
        });
        out.scrollIntoView && out.firstChild && out.firstChild.scrollIntoView({ block: 'nearest' });
      }).catch(function (e) { restore(); out.appendChild(h('div', { class: 't-bad', style: { fontSize: '12.5px' } }, 'Something went wrong while checking: ' + (e && e.message || e) + '. Your pasted text is still here; try again.')) });
      return false;
    }
    close = modal({ title: title, body: body, actions: [{ label: label, primary: true, do: run }] });
  }

  /* ================= stage 3: prompts ================= */
  var GROUPS = [['plan', 'The plan', 'Sonnet plans places, people, assets and beats for every part. The times and words are already fixed by the app.'],
    ['make', 'Assets and people', 'Hard things get a prompt of their own; simple ones are bunched. They can run in many chats at the same time.'],
    ['scene', 'Scenes', 'One part per prompt, in any order, each in its own chat with the same project file.']];
  /* job tabs and job tables, shared by Prompts and Results: little scrolling, the list scrolls inside its own box */
  var JTAB = { prompts: null, pick: null }, HOWOPEN = false;
  try { HOWOPEN = localStorage.getItem('studio.howOpen') === '1' } catch (e) {}
  function groupShort(g) { return g[0] === 'make' ? 'Assets & people' : g[1] }
  function jobTabs(page, L, todoLabel) {
    var todo = L.filter(function (j) { return !J.picked(j) });
    var list = [{ id: 'all', label: 'All', count: String(L.length) }];
    GROUPS.forEach(function (g) { var gl = L.filter(function (j) { return J.group(j) === g[0] }); list.push({ id: g[0], label: groupShort(g), count: gl.filter(function (j) { return J.picked(j) }).length + '/' + gl.length }) });
    list.push({ id: 'todo', label: todoLabel, count: String(todo.length) });
    var cur = JTAB[page];
    if (!cur || !list.some(function (t) { return t.id === cur })) { cur = todo.length ? (J.group(todo[0]) || 'todo') : 'all'; JTAB[page] = cur }
    var shown = cur === 'all' ? L : cur === 'todo' ? todo : L.filter(function (j) { return J.group(j) === cur });
    return { el: tabs(list, cur, function (t) { JTAB[page] = t; render() }), list: shown, cur: cur };
  }
  function groupNote(cur, P0) {
    var g = GROUPS.filter(function (x) { return x[0] === cur })[0];
    return g ? g[2] : cur === 'todo' ? 'Prompts that still need a reply, or a reply that needs a fix.' : 'Every prompt, in order. Do them top to bottom: the plan first, then assets and people, then scenes.';
  }
  function jobTable(cls, head, rows, empty) {
    return h('div', { class: 'jtable fill ' + cls },
      h('div', { class: 'jt-row jt-head' }, head.map(function (x) { return h('div', null, x) })),
      h('div', { class: 'jt-body scrollbox' }, rows.length ? rows : h('div', { class: 'jt-empty muted' }, empty)));
  }
  function promptsPage() {
    var nt = needTiming(); if (nt) return h('div', { class: 'page' }, pageHead(3, 'Prompts', 'Numbered prompts for Sonnet.'), nt);
    ensureJobs();
    var mode = J.mode(P), single = mode === 'single', L = J.list(P), done = L.filter(function (j) { return J.picked(j) }).length;
    var MODES = [{ id: 'single', label: 'One prompt' }, { id: 'two', label: 'Compare: two chats' }, { id: 'one', label: 'Compare: one chat' }];
    var pg = h('div', { class: 'page fit' }, pageHead(3, 'Prompts', 'Copy a numbered prompt, paste it in a new Sonnet chat with the project file, paste the reply back.',
      h('button', { class: 'btn', onclick: fileForModel, title: 'Attach this file in every Sonnet chat. Its number changes when a plan, asset or person is picked.' }, icon('download'), 'Project file ' + J.stamp(P))));
    pg.appendChild(h('div', { class: 'stats compact' }, stat(String(L.length), 'Prompts'), stat(String(done), 'Done', done === L.length ? 'ok' : ''), stat(String(L.length - done), 'To do or fix', L.length - done ? 'warn' : ''), stat(single ? '1 prompt' : '2 versions', 'Per job')));
    var how = single ? '1. Press Copy prompt on a row. 2. Open a NEW Sonnet chat, attach the project file (the F-number must match) and paste. 3. Copy Sonnet’s reply (it is only code) and press Paste reply. The app checks it and uses it. If something is wrong you get a report with a message to send back.'
      : mode === 'two' ? '1. Copy the prompt. 2. Do it in two new Sonnet chats with the project file. 3. Paste each reply as A and B. Then compare them in stage 4.'
      : '1. Copy the prompt (it asks for two versions). 2. Open a new Sonnet chat with the project file and paste. 3. Paste the whole reply. The app splits it into A and B. Then compare them in stage 4.';
    var T = jobTabs('prompts', L, 'To do');
    var howBox = h('div', { class: 'howbox', style: { display: HOWOPEN ? '' : 'none' } }, h('div', null, how), h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '6px' } }, single ? 'Best quality for the least work: every prompt is built to be right the first time, and a reply that passes its checks is used straight away. Compare modes make each job twice and let a critic pick (about double the work).' : 'Compare modes cost about double. Switch back to One prompt any time; nothing you made is lost.'));
    var howBtn = h('button', { class: 'btn small' + (HOWOPEN ? ' on' : ''), onclick: function () { HOWOPEN = !HOWOPEN; try { localStorage.setItem('studio.howOpen', HOWOPEN ? '1' : '0') } catch (e) {} howBox.style.display = HOWOPEN ? '' : 'none'; howBtn.classList.toggle('on', HOWOPEN) } }, icon('spark'), 'How it works');
    var modeBtn = h('button', { class: 'btn small', title: 'How many versions Sonnet makes of each job', onclick: function (e) { e.stopPropagation(); menu(e.currentTarget, MODES.map(function (m) { return { label: m.label, icon: m.id === mode ? 'check' : null, do: function () { if (m.id !== mode) { P.abMode = m.id; save(); render() } } } })) } },
      h('span', { class: 'muted' }, 'Mode:'), MODES.filter(function (m) { return m.id === mode })[0].label, h('span', { style: { display: 'inline-flex', transform: 'rotate(90deg)' } }, icon('chev')));
    pg.appendChild(h('div', { class: 'toolbar' }, T.el, h('div', { class: 'grow' }), howBtn, modeBtn));
    pg.appendChild(howBox);
    pg.appendChild(h('div', { class: 'muted note-line' }, groupNote(T.cur)));
    var rows = T.list.map(jobRow);
    var empty = T.cur === 'make' && J.picked(P.jobs.plan) ? 'Nothing new to make: every planned person and asset is already in the library.' : T.cur === 'todo' ? 'Nothing to do here: every prompt has a reply in use.' : 'These prompts appear when the plan is done.';
    pg.appendChild(jobTable('prompts', ['No.', 'Prompt', 'Status', 'Reply', ''], rows, empty));
    pg.appendChild(nextBar({ label: 'Script & audio', go: 'audio' }, { label: 'Next: ' + stageNames().t, go: 'pick' }));
    return pg;
  }
  var BORDER = { done: 'var(--ok)', pick: 'var(--info)', fix: 'var(--bad)', fail: 'var(--bad)', one: 'var(--warn)', todo: 'var(--line-2)' };
  function verInfo(job, v) {
    var single = J.mode(P) === 'single', x = job[v];
    if (!x) return h('span', { class: 'muted' }, single ? 'No reply yet' : v + ': not pasted');
    var c = x.check || {}, n = REPLY.counts(c.problems || []), pre = single ? 'Reply' : v;
    if (c.ok) return h('span', { class: 't-ok' }, pre + ': ' + (c.lintAll ? 'checks pass (' + c.lintPass + '/' + c.lintAll + ')' : 'checks pass') + (n.notes ? ' · ' + plural(n.notes, 'note') : ''));
    return h('span', { class: 't-bad' }, pre + ': ' + plural(n.errors || (c.issues || []).length || 1, 'problem') + ' to fix');
  }
  function jobDetail(job) {
    if (job.kind === 'scene') { var p = GK.plan(P).parts.filter(function (x) { return x.id === job.part })[0] || {}; return fmtT(p.start) + ' – ' + fmtT(p.end) + ' · ' + (p.len ? p.len.toFixed(1) + ' s' : ((p.end - p.start) || 0).toFixed(1) + ' s') }
    return job.items ? job.items.map(function (x) { return x.name + (x.level ? ' (' + ['', 'simple', 'medium', 'hard'][x.level] + ')' : '') }).join(', ') : 'Places, people, assets and beats for all parts';
  }
  function jobRow(job) {
    var mode = J.mode(P), single = mode === 'single', st = J.state(job, P), block = J.blockedBy(P, job), tag = J.tag(P, job);
    var fail = job.fail && (!job.A || job.fail.at > job.A.at) ? job.fail : null;
    var hasProblems = ['A', 'B'].some(function (v) { return job[v] && job[v].check && (job[v].check.problems || []).length }) || !!fail;
    var hasErrors = !!fail || ['A', 'B'].some(function (v) { return job[v] && job[v].check && REPLY.counts(job[v].check.problems || []).errors });
    var acts = h('div', { class: 'jt-acts' });
    if (block) acts.appendChild(h('span', { class: 'muted', style: { fontSize: '12px' } }, block));
    else {
      acts.appendChild(h('button', { class: 'btn small', title: 'Copy prompt ' + tag, onclick: function () { var t = J.prompt(P, job, mode); copyText(t, 'Prompt ' + tag + ' is copied (' + fmtN(t.length) + ' characters)', 'Open a NEW Sonnet chat, attach project file ' + J.stamp(P) + ' and paste.') } }, icon('copy'), 'Copy prompt'));
      if (single) acts.appendChild(h('button', { class: 'btn small' + (job.A && job.A.check && job.A.check.ok ? '' : ' primary'), onclick: function () { pasteBox(job, 'A') } }, icon('paste'), job.A ? 'Replace reply' : 'Paste reply'));
      else if (mode === 'two') { acts.appendChild(h('button', { class: 'btn small' + (job.A ? '' : ' primary'), onclick: function () { pasteBox(job, 'A') } }, icon('paste'), job.A ? 'Replace A' : 'Paste A')); acts.appendChild(h('button', { class: 'btn small' + (job.A && !job.B ? ' primary' : ''), onclick: function () { pasteBox(job, 'B') } }, icon('paste'), job.B ? 'Replace B' : 'Paste B')) }
      else acts.appendChild(h('button', { class: 'btn small primary', onclick: function () { pasteBox(job, null) } }, icon('paste'), job.A ? 'Replace reply' : 'Paste reply'));
      if (job.A || job.B) acts.appendChild(h('button', { class: 'btn small', title: 'Open ' + tag + ' on its own page', onclick: function () { PICKBACK = 'prompts'; go(P.id + '/pick/' + encodeURIComponent(job.id)) } }, icon('play'), 'Preview'));
    }
    return h('div', { class: 'jt-row job ' + st.key, style: { borderLeftColor: BORDER[st.key] || 'var(--line-2)' } },
      h('div', null, h('span', { class: 'num' }, tag)),
      h('div', { class: 'jt-name' }, h('b', null, job.title), h('span', { class: 'muted' }, jobDetail(job))),
      h('div', null, h('span', { class: st.cls }, st.text)),
      h('div', { class: 'jt-reply' }, single ? verInfo(job, 'A') : [verInfo(job, 'A'), verInfo(job, 'B')], fail ? h('span', { class: 't-bad' }, 'Last paste NOT saved · ' + plural(REPLY.counts(fail.problems || []).errors || 1, 'problem')) : null,
        hasProblems ? h('button', { class: 'linkbtn' + (hasErrors ? '' : ' soft'), onclick: function () { detailsModal(job) } }, hasErrors ? 'See problems' : 'See notes') : null),
      acts);
  }

  /* ================= stage 4: results (one prompt) or pick the best (compare) ================= */
  var PICKVIEW = null, PICKBACK = 'list', SHEETS = {}, PIECES = {};
  function skey(job) { return job.id + ':' + (job.A && job.A.at) + ':' + (job.B && job.B.at) }
  function stageNames() { return J.mode(P) === 'single' ? { t: 'Results', s: 'Preview each reply' } : { t: 'Pick the best', s: 'A/B and the critic' } }
  function pickPage() {
    var single = J.mode(P) === 'single', nm = stageNames().t;
    var nt = needTiming(); if (nt) return h('div', { class: 'page' }, pageHead(4, nm, single ? 'Preview each reply.' : 'The critic compares A and B.'), nt);
    ensureJobs();
    if (PICKVIEW && P.jobs[PICKVIEW]) return resultPage(P.jobs[PICKVIEW]);
    return resultsList();
  }
  function openResult(j, from) { PICKBACK = from || 'list'; go(P.id + '/pick/' + encodeURIComponent(j.id)) }
  function resultsList() {
    var single = J.mode(P) === 'single', nm = stageNames().t, L = J.list(P), any = L.some(function (j) { return j.A || j.B });
    var pg = h('div', { class: 'page fit' }, pageHead(4, nm, single ? 'Every reply, numbered like its prompt. Open one to see its pictures, its checks and what to fix.' : 'The app runs both versions, then the critic compares them. You can always overrule it.',
      single ? null : h('button', { class: 'btn', onclick: judgeAll, disabled: CR.mode() === 'gemini' && CR.ready() ? null : true, title: 'Gemini judges every job that has both versions' }, icon('spark'), 'Judge all with Gemini')));
    if (!any) { pg.appendChild(h('div', { class: 'card empty' }, 'No replies yet. Paste replies in Prompts first.', h('div', { style: { marginTop: '12px' } }, h('button', { class: 'btn primary', onclick: function () { go(P.id + '/prompts') } }, 'Go to Prompts')))); pg.appendChild(nextBar({ label: 'Prompts', go: 'prompts' }, { label: 'Next: Sound', go: 'sound' })); return pg }
    var T = jobTabs('pick', L, single ? 'Not in use' : 'Not picked');
    var bar = h('div', { class: 'toolbar' }, T.el, h('div', { class: 'grow' }));
    if (!single) {
      bar.appendChild(h('span', { class: 'muted', style: { fontSize: '12px' }, title: CR.mode() === 'gemini' ? (CR.ready() ? 'Gemini judges by itself with your free key.' : 'Add your free Gemini key in Settings, or use Sonnet copy-paste.') : 'You copy the critic prompt and the comparison picture into Sonnet and paste back its answer.' }, 'Critic'));
      bar.appendChild(seg([{ id: 'gemini', label: 'Gemini (automatic)' }, { id: 'sonnet', label: 'Sonnet (copy-paste)' }], CR.mode(), function (m) { CR.setMode(m); render() }));
      if (CR.mode() === 'gemini' && !CR.ready()) bar.appendChild(h('button', { class: 'btn small primary', onclick: settings }, 'Add key'));
    }
    pg.appendChild(bar);
    pg.appendChild(h('div', { class: 'muted note-line' }, 'Click a row to open that result on its own page.'));
    var rows = T.list.map(function (j) {
      var st = J.state(j, P), has = j.A || j.B;
      return h('div', { class: 'jt-row job ' + st.key + (has ? ' click' : ' idle'), style: { borderLeftColor: BORDER[st.key] || 'var(--line-2)' }, onclick: function () { if (has) openResult(j, 'list') } },
        h('div', null, h('span', { class: 'num' }, J.tag(P, j))),
        h('div', { class: 'jt-name' }, h('b', null, j.title), h('span', { class: 'muted' }, jobDetail(j))),
        h('div', null, h('span', { class: st.cls }, st.text + (j.critic ? ' · critic: ' + j.critic.winner : ''))),
        h('div', { class: 'jt-reply' }, has ? (single ? verInfo(j, 'A') : [verInfo(j, 'A'), verInfo(j, 'B')]) : h('span', { class: 'muted' }, 'No reply yet')),
        h('div', { class: 'jt-acts' }, has ? h('button', { class: 'btn small', onclick: function (e) { e.stopPropagation(); openResult(j, 'list') } }, icon('play'), 'Preview') : h('button', { class: 'btn small', onclick: function (e) { e.stopPropagation(); go(P.id + '/prompts') } }, 'Go to prompt')));
    });
    pg.appendChild(jobTable('results', ['No.', 'Result', 'Status', 'Reply', ''], rows, 'Nothing here: every result in this list is in use.'));
    pg.appendChild(nextBar({ label: 'Prompts', go: 'prompts' }, { label: 'Next: Sound', go: 'sound' }));
    return pg;
  }
  /* one result on its own page: only this prompt, with back and previous / next */
  function resultPage(job) {
    var single = J.mode(P) === 'single', L = J.list(P), i = L.indexOf(job), prev = L[i - 1], next = L[i + 1], tag = J.tag(P, job), st = J.state(job, P);
    var back = PICKBACK === 'prompts' ? { label: 'Prompts', go: 'prompts' } : { label: 'All ' + stageNames().t.toLowerCase(), go: 'pick' };
    var rot = function (n) { return h('span', { style: { display: 'inline-flex', transform: 'rotate(180deg)' } }, n) };
    function navBtn(j, dir, long) {
      var lab = j ? J.tag(P, j) : (dir < 0 ? 'Previous' : 'Next');
      return h('button', { class: 'btn' + (long ? '' : ' small'), disabled: j ? null : true, title: j ? J.label(P, j) : '', onclick: function () { if (j) openResult(j, PICKBACK) } }, dir < 0 ? rot(icon('chev')) : null, (long ? (dir < 0 ? 'Previous: ' : 'Next: ') : '') + lab, dir > 0 ? icon('chev') : null);
    }
    var pg = h('div', { class: 'page fit' }, h('div', { class: 'titlebar' },
      h('button', { class: 'back', title: 'Back to ' + back.label, 'aria-label': 'Back to ' + back.label, onclick: function () { go(P.id + '/' + back.go) } }, icon('chev')),
      h('div', null, h('h1', null, tag + ' · ' + job.title), h('p', null, J.kindName(job) + ' · result ' + (i + 1) + ' of ' + L.length + ' · ', h('span', { class: st.cls }, st.text))),
      h('div', { class: 'grow' }), navBtn(prev, -1), navBtn(next, 1)));
    if (!(job.A || job.B)) pg.appendChild(h('div', { class: 'card empty' }, 'No reply yet for ' + tag + '.', h('div', { class: 'row', style: { marginTop: '12px', justifyContent: 'center' } },
      h('button', { class: 'btn', onclick: function () { var t = J.prompt(P, job, J.mode(P)); copyText(t, 'Prompt ' + tag + ' is copied (' + fmtN(t.length) + ' characters)', 'Open a NEW Sonnet chat, attach project file ' + J.stamp(P) + ' and paste.') } }, icon('copy'), 'Copy prompt'),
      h('button', { class: 'btn primary', onclick: function () { pasteBox(job, 'A') } }, icon('paste'), 'Paste reply'))));
    else if (single) pg.appendChild(singleResult(job));
    else { var pd = pickDetail(job); pd.classList.add('fill', 'scrollbox'); pg.appendChild(pd) }
    pg.appendChild(h('div', { class: 'nextbar' },
      h('button', { class: 'btn quiet', onclick: function () { go(P.id + '/' + back.go) } }, rot(icon('chev')), 'Back to ' + back.label), h('div', { class: 'grow' }), navBtn(prev, -1, true), navBtn(next, 1, true)));
    return pg;
  }
  var RTAB = 'pics';
  function singleResult(job) {
    var v = job.pick || (job.A ? 'A' : 'B'), ver = job[v], c = ver.check || { problems: [] }, probs = c.problems || [], n = REPLY.counts(probs);
    var part = job.kind === 'scene' ? GK.plan(P).parts.filter(function (x) { return x.id === job.part })[0] : null;
    var panel = h('div', { class: 'panel fill result-box' });
    panel.appendChild(h('div', { class: 'row' }, h('b', { class: c.ok ? 't-ok' : 't-bad' }, c.ok ? 'Draws and passes the checks' + (c.lintAll ? ' (' + c.lintPass + '/' + c.lintAll + ')' : '') : plural(n.errors || 1, 'problem') + ' to fix'),
      n.notes ? h('span', { class: 't-warn', style: { fontSize: '12.5px' } }, plural(n.notes, 'note')) : null, h('div', { class: 'grow', style: { flex: 1 } }), h('span', { class: 'muted mono', style: { fontSize: '11.5px' } }, 'Reply saved ' + ago(ver.at))));
    var list = [{ id: 'pics', label: job.kind === 'plan' ? 'The plan' : job.kind === 'scene' ? 'Frames' : 'Pictures' }];
    if (probs.length) list.push({ id: 'probs', label: 'Problems', count: String(probs.length) });
    if (part) list.push({ id: 'script', label: 'Script' });
    if (!list.some(function (t) { return t.id === RTAB })) RTAB = 'pics';
    var body = h('div', { class: 'scrollbox rbody' });
    function paint() {
      body.innerHTML = '';
      if (RTAB === 'probs') body.appendChild(problemPanel(job, { found: ver.found || [], problems: probs }, { saved: true, v: v, inUse: !!J.picked(job), onUse: J.picked(job) ? null : function () { usePick(job, v) } }));
      else if (RTAB === 'script') body.appendChild(h('div', { class: 'glass' }, h('div', { class: 'mono muted', style: { fontSize: '11.5px', marginBottom: '6px' } }, 'Part ' + part.id + ' · ' + fmtT(part.start) + ' – ' + fmtT(part.end)), h('div', { style: { fontSize: '14px', lineHeight: 1.6 } }, '“' + part.text + '”')));
      else { var view = h('div', { class: 'viewbox' }); body.appendChild(view); fillView(view, job, v) }
    }
    var tb = tabs(list, RTAB, function (t) { RTAB = t; Array.prototype.forEach.call(tb.children, function (b, i) { b.classList.toggle('on', list[i].id === t) }); paint() });
    panel.appendChild(tb); panel.appendChild(body); paint();
    panel.appendChild(h('div', { class: 'row result-acts' },
      h('button', { class: 'btn', onclick: function () { pasteBox(job, 'A') } }, icon('paste'), 'Paste a new reply'),
      h('button', { class: 'btn', onclick: function () { var t = J.prompt(P, job, 'single'); copyText(t, 'Prompt ' + J.tag(P, job) + ' is copied (' + fmtN(t.length) + ' characters)', 'Open a NEW Sonnet chat, attach project file ' + J.stamp(P) + ' and paste.') } }, icon('copy'), 'Copy prompt'),
      probs.length ? h('button', { class: 'btn', onclick: function () { copyText(REPLY.fixMessage(P, job, probs, null), 'The fix message for ' + J.tag(P, job) + ' is copied', 'Send it in the same Sonnet chat.') } }, icon('copy'), 'Copy fix message') : null,
      h('div', { class: 'grow', style: { flex: 1 } }),
      J.picked(job) ? h('span', { class: 't-ok', style: { fontWeight: 600 } }, 'In use') : h('button', { class: 'btn primary', onclick: function () { usePick(job, v) } }, icon('check'), 'Use this reply')));
    return panel;
  }
  function planTable(pl) {
    var ps = pl.parts || [], ppl = {}, as = {}; ps.forEach(function (p) { (p.cast || []).forEach(function (n) { ppl[n] = 1 }); (p.assets || []).forEach(function (n) { as[n] = 1 }) });
    var box = h('div', { class: 'plan-view' }, h('div', { class: 'muted', style: { fontSize: '12.5px', marginBottom: '8px' } }, ps.length + ' parts · ' + Object.keys(ppl).length + ' people · ' + Object.keys(as).length + ' assets'));
    if (pl.continuity && Object.keys(pl.continuity).length) box.appendChild(h('div', { class: 'glass', style: { marginBottom: '10px' } }, h('div', { class: 'k', style: { font: '700 9.5px/1 var(--f-sans)', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--on-dark-2)', marginBottom: '6px' } }, 'Continuity'), Object.keys(pl.continuity).map(function (k) { return h('div', { style: { fontSize: '12.5px', marginTop: '3px' } }, h('b', null, k + ': '), String(pl.continuity[k])) })));
    box.appendChild(h('div', { class: 'ptable' }, ps.map(function (p) {
      return h('div', { class: 'prow' }, h('div', { class: 'pn mono' }, String(p.id)),
        h('div', { style: { minWidth: 0 } }, h('b', null, p.title || ''), h('div', { class: 'muted', style: { fontSize: '12px' } }, [p.place, p.time, p.job].filter(Boolean).join(' · ')),
          (p.beats || []).length ? h('ul', { class: 'beats' }, p.beats.map(function (b) { return h('li', null, b) })) : null,
          h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '4px' } }, [(p.cast || []).length ? 'People: ' + p.cast.join(', ') : '', (p.assets || []).length ? 'Assets: ' + p.assets.join(', ') : ''].filter(Boolean).join('  ·  '))));
    })));
    return box;
  }
  function drawPieces(job, v) {
    var k = pkey(job, v);
    if (PIECES[k] && PIECES[k].promise) return PIECES[k].promise;
    var W = (P.timing && P.timing.words) || [];
    function words(t) { var p = GK.plan(P).parts.filter(function (x) { return x.id === job.part })[0], at = (p ? p.start : 0) + t; return W.filter(function (w) { return w[1] <= at + .4 && w[2] >= at - .6 }).map(function (w) { return w[0] }).slice(0, 5).join(' ') }
    var pr = CR.inspect(P, job, v).then(function (r) {
      var st = (r.info && r.info.stage) || { W: 540, H: 960 }, list = CR.pieces(job, r, job.kind === 'scene' ? words : null);
      return Promise.all(list.map(function (it) {
        var w, h2, bg = null;
        if (job.kind === 'scene') { var k2 = 360 / Math.max(st.W, st.H); w = Math.round(st.W * k2); h2 = Math.round(st.H * k2) } else if (it.kind === 'cast') { w = 660; h2 = 300; bg = '#EDE6D6' } else { w = 400; h2 = 400 }
        if (it.contain) bg = it.light ? '#EDE6D6' : '#1d1d20';
        if (!it.svg) return { cap: it.cap, sub: it.sub, bad: true };
        var svg = it.contain ? it.svg.replace('<svg ', '<svg preserveAspectRatio="xMidYMid meet" ') : it.svg;
        return GK.raster(svg, w, h2, null, bg).then(function (c) { return { canvas: c, cap: it.cap, sub: it.sub, dim: it.dim, bad: it.bad } }, function () { return { cap: it.cap, sub: it.sub, bad: true } });
      })).then(function (items) { return { items: items, broken: r.broken || '' } });
    }).then(function (res) { PIECES[k] = res; return res }, function (e) { delete PIECES[k]; throw e });
    PIECES[k] = { promise: pr };
    return pr;
  }
  function pkey(job, v) { return job.id + ':' + v + ':' + (job[v] && job[v].at) }
  function enlarge(it) {
    var c = document.createElement('canvas'); c.width = it.canvas.width; c.height = it.canvas.height; c.getContext('2d').drawImage(it.canvas, 0, 0); c.style.cssText = 'max-width:100%;max-height:74vh;border-radius:10px;display:block;margin:0 auto';
    modal({ title: it.cap + (it.sub ? ' · ' + it.sub : ''), body: c, actions: [] });
  }
  function piecesGrid(job, r) {
    var wide = P.format === 'long';
    if (!r.items.length) return h('div', { class: 'glass', style: { textAlign: 'center', padding: '24px 12px' } }, h('div', { class: 't-bad' }, 'Nothing could be drawn.'), h('div', { class: 'muted', style: { fontSize: '12.5px', marginTop: '4px' } }, (r.broken || 'The code did not register.') + ' See the problems below.'));
    return h('div', { class: 'pgrid ' + (job.kind === 'scene' ? (wide ? 'frames wide' : 'frames') : job.kind === 'cast' ? 'cards cast' : 'cards') }, r.items.map(function (it) {
      return h('figure', { class: 'pc' + (it.dim ? ' dim' : '') + (it.bad ? ' bad' : ''), title: it.canvas ? 'Click to enlarge' : '', onclick: function () { if (it.canvas) enlarge(it) } },
        it.canvas ? it.canvas : h('div', { class: 'nopic' }, 'not drawn'), h('figcaption', null, h('b', null, it.cap), it.sub ? h('span', null, it.sub) : null));
    }));
  }
  function fillView(view, job, v) {
    if (job.kind === 'plan') { view.appendChild(planTable(job[v].plan)); return }
    var hit = PIECES[pkey(job, v)];
    if (hit && hit.items) { view.appendChild(piecesGrid(job, hit)); return }
    view.appendChild(h('div', { class: 'drawing' }, h('div', { class: 'progress indeterminate' }, h('i')), h('div', { class: 'muted', style: { fontSize: '12.5px', marginTop: '8px' } }, job.kind === 'scene' ? 'Drawing frames of this part…' : 'Drawing…')));
    drawPieces(job, v).then(function (r) { if (!view.isConnected) return; view.innerHTML = ''; view.appendChild(piecesGrid(job, r)) },
      function (e) { if (!view.isConnected) return; view.innerHTML = ''; view.appendChild(h('div', { class: 't-bad', style: { fontSize: '12.5px' } }, 'The pictures could not be drawn: ' + (e && e.message || e))) });
  }
  function pickDetail(job) {
    var box = h('div', { class: 'panel' }), both = job.A && job.B && !job.A.error && !job.B.error;
    box.appendChild(h('div', { class: 'row' }, h('span', { class: J.state(job, P).cls }, J.state(job, P).text)));
    var verdict = h('div', { style: { margin: '10px 0' } });
    if (job.critic) verdict.appendChild(h('div', { class: 'glass' }, h('div', { class: 'row' }, h('b', null, (job.critic.by || 'Critic') + ' picks ' + job.critic.winner), job.critic.score_a != null ? h('span', { class: 'mono muted' }, 'A ' + job.critic.score_a + ' · B ' + job.critic.score_b) : null),
      h('div', { class: 'muted', style: { fontSize: '12.5px', marginTop: '4px' } }, job.critic.why || ''), job.critic.fix_for_winner ? h('div', { class: 't-info', style: { fontSize: '12.5px', marginTop: '4px' } }, 'Next fix: ' + job.critic.fix_for_winner) : null));
    box.appendChild(verdict);
    var view = h('div', { style: { marginTop: '6px' } });
    if (job.kind === 'plan') view.appendChild(planCompare(job));
    else if (SHEETS[skey(job)]) view.appendChild(h('img', { src: SHEETS[skey(job)].url, alt: 'A and B side by side', style: { width: '100%', borderRadius: '10px', border: '1px solid var(--edge)', display: 'block' } }));
    else view.appendChild(h('div', { class: 'glass', style: { textAlign: 'center', padding: '30px 12px' } }, h('div', { class: 'muted', style: { marginBottom: '10px' } }, 'Draw both versions side by side to compare them.'), h('button', { class: 'btn primary', onclick: function (e) { e.currentTarget.setAttribute('disabled', ''); e.currentTarget.textContent = 'Drawing…'; makeSheet(job).then(render, function (er) { toast(er.message, 'bad'); render() }) } }, icon('image'), 'Draw A and B')));
    box.appendChild(view);
    var facts = ['A', 'B'].map(function (v) { var x = job[v]; return h('div', { class: 'glass' }, h('div', { class: 'k', style: { font: '700 9.5px/1 var(--f-sans)', letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--on-dark-2)', marginBottom: '6px' } }, 'Version ' + v),
      !x ? h('div', { class: 'muted' }, 'Not pasted yet') : h('div', null, h('div', { class: x.check && x.check.ok ? 't-ok' : 't-warn', style: { fontSize: '12.5px' } }, x.check && x.check.ok ? 'Draws and passes the checks' + (x.check.lintAll ? ' (' + x.check.lintPass + '/' + x.check.lintAll + ')' : '') : 'Problems found'),
        (x.check && x.check.issues || []).slice(0, 4).map(function (s) { return h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '3px' } }, '· ' + s) }))) });
    box.appendChild(h('div', { class: 'facts' }, facts));
    var acts = h('div', { class: 'row', style: { marginTop: '6px' } });
    if (both) {
      if (CR.mode() === 'gemini') acts.appendChild(h('button', { class: 'btn primary', disabled: CR.ready() ? null : true, onclick: function (e) { var b = e.currentTarget; b.setAttribute('disabled', ''); b.textContent = 'Gemini is judging…'; judge(job).then(function () { toast('Gemini picked ' + job.critic.winner + '.', 'ok'); render() }, function (er) { toast(er.message, 'bad', 8000); render() }) } }, icon('spark'), 'Ask Gemini'));
      else {
        acts.appendChild(h('button', { class: 'btn', onclick: function () { sonnetCritic(job) } }, icon('copy'), 'Copy critic prompt'));
        acts.appendChild(h('button', { class: 'btn', onclick: function () { (SHEETS[skey(job)] ? Promise.resolve() : makeSheet(job)).then(function () { if (SHEETS[skey(job)]) download(safeName(P.name) + ' - ' + job.id + ' A vs B.png', SHEETS[skey(job)].blob); else toast('Plans are compared as text; no picture is needed.', 'info') }) } }, icon('image'), 'Comparison picture'));
        acts.appendChild(h('button', { class: 'btn', onclick: function () { pasteCritic(job) } }, icon('paste'), 'Paste critic answer'));
      }
    }
    acts.appendChild(h('div', { class: 'grow', style: { flex: 1 } }));
    ['A', 'B'].forEach(function (v) { if (job[v] && !job[v].error) acts.appendChild(h('button', { class: 'btn' + (job.pick === v ? ' primary' : ''), onclick: function () { usePick(job, v) } }, job.pick === v ? 'Using ' + v : 'Use ' + v)) });
    box.appendChild(acts);
    if (!both) box.appendChild(h('div', { class: 'muted', style: { fontSize: '12px', marginTop: '8px' } }, 'Only one version so far. Paste the second one in Prompts to let the critic compare, or use this one now.'));
    return box;
  }
  function planCompare(job) {
    function sum(x) { if (!x || !x.plan) return h('div', { class: 'muted' }, 'Not pasted'); var pl = x.plan, ps = pl.parts || []; var ppl = {}, as = {}; ps.forEach(function (p) { (p.cast || []).forEach(function (n) { ppl[n] = 1 }); (p.assets || []).forEach(function (n) { as[n] = 1 }) });
      return h('div', null, h('div', { style: { fontSize: '12.5px' } }, ps.length + ' parts · ' + Object.keys(ppl).length + ' people · ' + Object.keys(as).length + ' assets'),
        ps.slice(0, 8).map(function (p) { return h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '4px' } }, h('b', { style: { color: 'var(--ink)' } }, p.id + ' '), (p.title || '') + (p.place ? ' · ' + p.place : '') + (p.job ? ' · ' + p.job : '')) })) }
    return h('div', { class: 'facts', style: { gridTemplateColumns: '1fr 1fr' } }, ['A', 'B'].map(function (v) { return h('div', { class: 'glass' }, h('b', null, 'Plan ' + v), sum(job[v])) }));
  }
  function makeSheet(job) {
    if (job.kind === 'plan') return Promise.resolve();
    return Promise.all([CR.inspect(P, job, 'A'), CR.inspect(P, job, 'B')]).then(function (r) {
      var W = (P.timing && P.timing.words) || [];
      function words(t) { var p = GK.plan(P).parts.filter(function (x) { return x.id === job.part })[0], at = (p ? p.start : 0) + t; return W.filter(function (w) { return w[1] <= at + .4 && w[2] >= at - .6 }).map(function (w) { return w[0] }).slice(0, 3).join(' ') }
      job._facts = CR.facts(job, r[0], r[1]); job._auto = [CR.score(r[0]), CR.score(r[1])];
      return CR.sheet(job, r[0], r[1], job.kind === 'scene' ? words : null);
    }).then(function (c) { return new Promise(function (res) { c.toBlob(function (b) { if (SHEETS[skey(job)]) URL.revokeObjectURL(SHEETS[skey(job)].url); SHEETS[skey(job)] = { blob: b, url: URL.createObjectURL(b), data: c.toDataURL('image/png') }; res() }, 'image/png') }) });
  }
  function judge(job) {
    if (job.kind === 'plan') return CR.gemini(J.criticAsk(P, job, ''), null, 'PLAN A:\n' + JSON.stringify(job.A.plan) + '\n\nPLAN B:\n' + JSON.stringify(job.B.plan)).then(function (v) { job.critic = v; return save(true) });
    return (SHEETS[skey(job)] ? Promise.resolve() : makeSheet(job)).then(function () {
      var a = job._auto || [0, 0];
      if (a[0] <= -100 && a[1] > -100) { job.critic = { winner: 'B', by: 'The checks', why: 'Version A does not draw.' }; return }
      if (a[1] <= -100 && a[0] > -100) { job.critic = { winner: 'A', by: 'The checks', why: 'Version B does not draw.' }; return }
      return CR.gemini(J.criticAsk(P, job, job._facts), SHEETS[skey(job)].data).then(function (v) { job.critic = v });
    }).then(function () { return save(true) });
  }
  function judgeAll() {
    var todo = J.list(P).filter(function (j) { return j.A && j.B && !j.A.error && !j.B.error && !j.critic });
    if (!todo.length) { toast('Every job with two versions already has a verdict.', 'info'); return }
    toast('Gemini is judging ' + todo.length + ' job' + (todo.length > 1 ? 's' : '') + '. Keep this page open.', 'info', 5000);
    var n = 0;
    todo.reduce(function (pr, j) { return pr.then(function () { return judge(j).then(function () { n++; if (!j.pick) usePick(j, j.critic.winner, true) }) }) }, Promise.resolve())
      .then(function () { toast('Done: ' + n + ' verdict' + (n > 1 ? 's' : '') + '. The winners are picked; change any you disagree with.', 'ok', 7000); render() }, function (e) { toast(e.message + ' (' + n + ' judged before this)', 'bad', 8000); render() });
  }
  function sonnetCritic(job) {
    var extra = job.kind === 'plan' ? '\n\nPLAN A:\n```json\n' + JSON.stringify(job.A.plan, null, 1) + '\n```\n\nPLAN B:\n```json\n' + JSON.stringify(job.B.plan, null, 1) + '\n```' : '\n\nThe attached picture shows both versions.';
    var go2 = job.kind === 'plan' || SHEETS[skey(job)] ? Promise.resolve() : makeSheet(job);
    go2.then(function () { copyText(J.criticAsk(P, job, job._facts || '') + extra, job.kind === 'plan' ? 'The critic prompt is copied' : 'The critic prompt is copied. Also attach the comparison picture') });
  }
  function pasteCritic(job) {
    var ta = h('textarea', { class: 'area', style: { minHeight: '160px' }, placeholder: 'Paste the critic answer here.' });
    modal({ title: 'Paste the critic answer · ' + job.title, body: ta, actions: [{ label: 'Save verdict', primary: true, do: function () { var v = J.parseCritic(ta.value); if (!v) { ta.classList.add('field-bad'); toast('No winner (A or B) was found in that answer.', 'warn'); return false } v.by = 'Sonnet'; job.critic = v; if (!job.pick) usePick(job, v.winner, true); save(true).then(render); toast('Sonnet picked ' + v.winner + '.', 'ok') } }] });
  }
  function usePick(job, v, quiet) {
    if (!job[v] || job[v].error) return;
    var single = J.mode(P) === 'single'; S.snapshot(P, 'Before ' + (single ? 'using the reply' : 'picking ' + v) + ' for ' + J.label(P, job));
    job.pick = v;
    if (job.kind === 'plan') { P.plan = job[v].plan; rebuildJobs() }
    save(true).then(function () { if (!quiet) { toast((single ? 'Now using the reply for ' : 'Now using version ' + v + ' for ') + J.label(P, job) + '.', 'ok'); render() } });
  }

  /* ================= stage 5: sound ================= */
  var SFXFILES = null;
  function soundBlobs() {
    var Sx = SD.cfg(P), keys = Sx.cues.map(function (c) { return c.id });
    return Promise.all([S.getBlob(P.id + ':audio'), Sx.music ? S.getBlob(P.id + ':music') : null].concat(keys.map(function (k) { return S.getBlob(P.id + ':sfx:' + k) })))
      .then(function (r) { var sfx = {}; keys.forEach(function (k, i) { if (r[2 + i]) sfx[k] = r[2 + i] }); return { narr: r[0], music: r[1], sfx: sfx } });
  }
  function totalDur() { return (P.timing && P.timing.duration) || (P.audio && P.audio.duration) || 0 }
  var SPLAY = { on: false, raf: 0 };
  function soundPage() {
    var nt = needTiming(); if (nt) return h('div', { class: 'page' }, pageHead(5, 'Sound', 'Music and sound effects.'), nt);
    var Sx = SD.cfg(P);
    var pg = h('div', { class: 'page fit' }, pageHead(5, 'Sound', 'Optional. Background music that drops while the narrator speaks, and sound effects on the right moments.'));
    var mfile = h('input', { type: 'file', accept: 'audio/*', class: 'hidden-file' });
    mfile.addEventListener('change', function () { var f = mfile.files[0]; if (!f) return; S.putBlob(P.id + ':music', f).then(function () { SD.forget(P.id + ':music'); Sx.music = { name: f.name, size: f.size }; save(true).then(render); toast('Music added: ' + f.name + '.', 'ok') }) });
    function slider(label, key, min, max, step, fmt) {
      var val = h('span', { class: 'mono', style: { minWidth: '64px', textAlign: 'right' } }, fmt(Sx[key])), inp = h('input', { type: 'range', class: 'range', min: min, max: max, step: step, value: Sx[key] });
      inp.addEventListener('input', function () { Sx[key] = +inp.value; val.textContent = fmt(Sx[key]); save() });
      return h('div', { class: 'row', style: { gap: '12px', marginTop: '10px' } }, h('span', { style: { width: '170px', fontSize: '12.5px' } }, label), inp, val);
    }
    var music = h('div', { class: 'card' }, h('h2', null, 'Background music'), h('p', { class: 'sub' }, 'Your own music file. It fades in, drops under every piece of speech and fades out at the end.'),
      h('div', { class: 'fieldgroup' },
        h('div', { class: 'drop', onclick: function () { mfile.click() } }, h('div', { class: 'ico' }, icon('music')), h('div', null, h('div', { class: 'big' }, Sx.music ? Sx.music.name : 'Add a music file'), h('div', { class: 'muted', style: { fontSize: '12px' } }, Sx.music ? 'Click to replace it' : 'MP3, WAV or M4A')), mfile),
        Sx.music ? h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn small danger', onclick: function () { Sx.music = null; save(true).then(render); toast('Music removed.', 'info') } }, icon('trash'), 'Remove music')) : null),
      h('div', { class: 'fieldgroup' }, h('span', { class: 'label' }, 'Levels'),
        slider('Music volume', 'musicVol', 0, 1, .01, function (v) { return Math.round(v * 100) + '%' }),
        slider('Drop while speaking', 'duckDb', -30, 0, 1, function (v) { return v + ' dB' }),
        slider('Drop speed', 'attack', .03, .6, .01, function (v) { return v.toFixed(2) + ' s' }),
        slider('Come back speed', 'release', .1, 2, .05, function (v) { return v.toFixed(2) + ' s' }),
        slider('Fade in', 'fadeIn', 0, 6, .1, function (v) { return v.toFixed(1) + ' s' }),
        slider('Fade out', 'fadeOut', 0, 8, .1, function (v) { return v.toFixed(1) + ' s' }),
        slider('Effects volume', 'sfxVol', 0, 1.5, .01, function (v) { return Math.round(v * 100) + '%' }),
        h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '10px' } }, 'The final mix is brought to about -14 LUFS, the loudness YouTube plays at, without clipping.')));
    // preview
    var tm = h('span', { class: 'mono' }, '0:00.0'), pbtn = h('button', { class: 'btn primary', onclick: function () { if (SPLAY.on) stopMix(); else startMix() } }, icon(SPLAY.on ? 'pause' : 'play'), SPLAY.on ? 'Pause' : 'Play the mix');
    function startMix() { stopAudio(); soundBlobs().then(function (b) { return SD.play(P, SPLAY.t || 0, totalDur(), b) }).then(function () { SPLAY.on = true; pbtn.innerHTML = ''; pbtn.appendChild(icon('pause')); pbtn.appendChild(document.createTextNode('Pause')); loop() }) }
    function stopMix() { SPLAY.t = SD.now() || 0; SD.stop(); SPLAY.on = false; cancelAnimationFrame(SPLAY.raf); pbtn.innerHTML = ''; pbtn.appendChild(icon('play')); pbtn.appendChild(document.createTextNode('Play the mix')) }
    function loop() { var t = SD.now(); if (t != null) { tm.textContent = fmtT(t) + ' / ' + fmtT(totalDur()); if (t >= totalDur()) { SPLAY.t = 0; stopMix(); return } } if (tm.isConnected) SPLAY.raf = requestAnimationFrame(loop); else { SD.stop(); SPLAY.on = false } }
    var preview = h('div', { class: 'panel short' }, h('h2', null, 'Listen'), h('p', { class: 'sub' }, 'Narration, music and effects together, as they will be in the MP4.'),
      h('div', { class: 'row' }, pbtn, h('button', { class: 'btn', onclick: function () { SPLAY.t = 0; stopMix(); tm.textContent = '0:00.0' } }, icon('stop'), 'From the start'), tm));
    var nOn = Sx.cues.filter(function (c) { return !c.off }).length;
    pg.appendChild(h('div', { class: 'toolbar' }, tabs([{ id: 'music', label: 'Background music', count: Sx.music ? '1' : '0' }, { id: 'sfx', label: 'Sound effects', count: String(nOn) }], SNDTAB, function (t) { SNDTAB = t; render() })));
    var leftCard = SNDTAB === 'sfx' ? cuesCard(Sx) : music; leftCard.classList.add('scrollbox', 'tabpane');
    pg.appendChild(h('div', { class: 'cols fill fitcols' }, leftCard, preview));
    pg.appendChild(nextBar({ label: stageNames().t, go: 'pick' }, { label: 'Next: Thumbnails', go: 'thumbs' }));
    return pg;
  }
  var SNDTAB = 'music';
  function cuesCard(Sx) {
    var card = h('div', { class: 'card' }, h('div', { class: 'row' }, h('div', { style: { flex: 1, minWidth: '240px' } }, h('h2', null, 'Sound effects'), h('p', { class: 'sub', style: { margin: 0 } }, 'Placed on whips and big hits from the built scenes, plus any Sonnet suggests. Sounds come from your folder first, then Freesound.')),
      h('button', { class: 'btn', onclick: autoCues }, icon('spark'), 'Find moments'),
      h('button', { class: 'btn', onclick: function () { copyText(SD.cuePrompt(P), 'The sound prompt is copied') } }, icon('copy'), 'Sonnet prompt'),
      h('button', { class: 'btn', onclick: pasteCues }, icon('paste'), 'Paste cues'),
      h('button', { class: 'btn primary', onclick: findAll, disabled: Sx.cues.length ? null : true }, icon('music'), 'Find sounds')));
    var src = S.folderSupported() ? (SFXFILES ? SFXFILES.length + ' sounds in your folder' : 'No sound folder yet') : 'Folders need Chrome or Edge';
    card.appendChild(h('div', { class: 'row', style: { margin: '10px 0', fontSize: '12.5px' } }, h('span', { class: SFXFILES && SFXFILES.length ? 't-ok' : 'muted' }, src), S.folderSupported() ? h('button', { class: 'btn small', onclick: pickSfxFolder }, icon('folder'), SFXFILES ? 'Change folder' : 'Pick sound folder') : null,
      h('span', { class: SD.fsKey() ? 't-ok' : 'muted' }, SD.fsKey() ? 'Freesound key added' : 'No Freesound key'), SD.fsKey() ? null : h('button', { class: 'btn small', onclick: settings }, 'Add key')));
    if (!Sx.cues.length) { card.appendChild(h('div', { class: 'empty', style: { padding: '18px' } }, 'No sound effects yet. Press Find moments (after scenes are built) or paste cues from Sonnet.')); return card }
    var list = h('div', { class: 'plist' });
    Sx.cues.slice().sort(function (a, b) { return a.t - b.t }).forEach(function (c) {
      var has = !!c.pickName;
      list.appendChild(h('div', { class: 'pitem' + (c.off ? ' warn' : ''), style: { gridTemplateColumns: '70px 1fr auto', cursor: 'default', borderLeftColor: c.off ? 'var(--line-2)' : has ? 'var(--ok)' : 'var(--warn)' } },
        h('div', { class: 'mono', style: { fontSize: '13px' } }, fmtT(c.t)),
        h('div', { style: { minWidth: 0 } }, h('div', { class: 'hd' }, h('b', null, c.label), h('span', { class: 'muted' }, c.from === 'auto' ? 'from the video' : c.from === 'sonnet' ? 'from Sonnet' : '')),
          h('div', { class: 'txt' }, has ? (c.pickFrom === 'folder' ? 'Your folder: ' : 'Freesound: ') + c.pickName : 'No sound yet · search: ' + c.query)),
        h('div', { class: 'row' },
          h('button', { class: 'btn small', title: 'Hear it', disabled: has ? null : true, onclick: function () { S.getBlob(P.id + ':sfx:' + c.id).then(function (b) { if (b) SD.playOne(P.id + ':sfx:' + c.id + ':' + c.pickKey, b, c.vol) }) } }, icon('play')),
          h('button', { class: 'btn small', title: 'Use the next best sound', onclick: function () { redoCue(c) } }, icon('redo'), has ? 'Redo' : 'Find'),
          h('button', { class: 'btn small', onclick: function () { c.off = !c.off; save(); render() } }, c.off ? 'Turn on' : 'Turn off'),
          h('button', { class: 'btn small danger', title: 'Remove', onclick: function () { Sx.cues = Sx.cues.filter(function (x) { return x !== c }); save(); render() } }, icon('trash')))));
    });
    card.appendChild(list);
    return card;
  }
  function newCueId() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) }
  function addCues(list) {
    var Sx = SD.cfg(P), n = 0;
    list.forEach(function (c) { if (Sx.cues.some(function (x) { return Math.abs(x.t - c.t) < .3 && x.query === c.query })) return; c.id = newCueId(); Sx.cues.push(c); n++ });
    save(true).then(render); return n;
  }
  function autoCues() {
    master().then(function (M) { var n = addCues(SD.autoCues(P, M.info.built)); toast(n ? n + ' moments added from the built scenes.' : (M.info.built.length ? 'No new moments: whips and big hits already have cues.' : 'No scenes are built yet. Build scenes first, or paste cues from Sonnet.'), n ? 'ok' : 'info', 6000) });
  }
  function pasteCues() {
    var ta = h('textarea', { class: 'area', style: { minHeight: '200px' }, placeholder: 'Paste the Sonnet reply with the cues JSON.' });
    modal({ title: 'Paste sound cues', body: ta, actions: [{ label: 'Add cues', primary: true, do: function () { var l = SD.parseCues(ta.value); if (!l || !l.length) { ta.classList.add('field-bad'); toast('No cues were found. The reply must hold {"cues": [...]}.', 'warn'); return false } toast(addCues(l) + ' cues added.', 'ok') } }] });
  }
  function pickSfxFolder() {
    window.showDirectoryPicker({ id: 'nyenz-sfx', mode: 'read' }).then(function (d) { return S.setting('sfxDir', d).then(function () { return SD.indexFolder(d) }) }).then(function (f) { SFXFILES = f; toast(f.length + ' sounds found in that folder.', f.length ? 'ok' : 'warn'); render() })
      .catch(function (e) { if (e && e.name === 'AbortError') return; toast('Could not read that folder.', 'bad') });
  }
  function loadSfxFolder() {
    if (SFXFILES || !S.folderSupported()) return Promise.resolve(SFXFILES);
    return S.setting('sfxDir').then(function (d) { if (!d) return null; return d.queryPermission({ mode: 'read' }).then(function (p) { if (p !== 'granted') return null; return SD.indexFolder(d).then(function (f) { SFXFILES = f; return f }) }) }).catch(function () { return null });
  }
  function candidates(c) {
    return loadSfxFolder().then(function (files) {
      var local = files ? SD.matchFolder(files, c.query) : [];
      return (SD.fsKey() ? SD.freesound(c.query).catch(function (e) { toast(e.message, 'warn'); return [] }) : Promise.resolve([])).then(function (fs) { return local.concat(fs) });
    });
  }
  function redoCue(c) {
    var key = c.query;
    (CANDS[c.id] && CANDS[c.id].q === key ? Promise.resolve(CANDS[c.id].list) : candidates(c).then(function (l) { CANDS[c.id] = { q: key, list: l }; return l })).then(function (list) {
      if (!list.length) { toast('No sound found for "' + c.query + '". Pick a sound folder or add a Freesound key in Settings.', 'warn', 7000); return }
      var i = c.pickName ? (list.findIndex(function (x) { return x.name === c.pickName }) + 1) % list.length : 0, cand = list[i];
      return SD.fetchBlob(cand).then(function (b) { return S.putBlob(P.id + ':sfx:' + c.id, b) }).then(function () {
        c.pickName = cand.name; c.pickFrom = cand.kind; c.pickKey = cand.kind + ':' + (cand.id || cand.path); c.credit = cand.kind === 'freesound' ? cand.name + ' by ' + cand.by + ' (freesound.org, CC0)' : '';
        return save(true);
      }).then(function () { render(); toast('Sound for ' + fmtT(c.t) + ': ' + cand.name, 'ok') });
    }).catch(function (e) { toast(e.message, 'bad') });
  }
  var CANDS = {};
  function findAll() {
    var Sx = SD.cfg(P), todo = Sx.cues.filter(function (c) { return !c.pickName && !c.off });
    if (!todo.length) { toast('Every cue has a sound. Use Redo on a cue to change it.', 'info'); return }
    toast('Finding ' + todo.length + ' sounds…', 'info');
    todo.reduce(function (pr, c) { return pr.then(function () { return redoCue(c) }) }, Promise.resolve()).then(render);
  }

  /* ================= stage 6: thumbnails ================= */
  function thumbPrompt() {
    var plan = GK.plan(P), long = P.format === 'long';
    return 'PROMPT S6 \u00B7 THUMBNAILS (3 designs)\nYou are the thumbnail designer of a fast-growing YouTube channel. Design 3 different thumbnails for this video. They must make people click AND show honestly what the video delivers.\n\n' +
      'VIDEO: "' + (P.name || plan.title) + '" · ' + (long ? 'long video, 16:9, thumbnail 1280 x 720 px' : 'Short / TikTok, 9:16 cover, 1080 x 1920 px (keep faces and text inside the middle 1080 x 1350, away from the top 250 px and the bottom 420 px where the app covers it)') + '\n' +
      'STYLE OF THE VIDEO: Gilded Kasumi: Japanese woodblock print rebuilt as an Art Deco paper diorama: flat layered cut-paper shapes, thin gold edges, deep indigo and vermilion with cream, soft mist between layers, expressive paper people. The thumbnail must look like it belongs to the video.\n' +
      'THE STORY:\n' + plan.parts.map(function (p) { return 'Part ' + p.id + (p.job ? ' (' + p.job + ')' : '') + ': ' + p.text }).join('\n') + '\n\n' +
      'Rules for every thumbnail: one clear focal point readable at phone size; a human face with a strong emotion or a striking object/moment from the story; high contrast and a clear light source; rule of thirds; at most 3 to 5 words of text (or none), bold, never repeating the title; no clutter; no fake moments that are not in the video.\n' +
      'Make the 3 really different: 1) the moment of greatest danger or tension, 2) the impossible fact or number of the story, 3) the human emotion (a face) with the key object.\n\n' +
      J.jsonRules() + '{"thumbnails": [{"name": "short name", "idea": "one line: why people will click", "image_prompt": "a detailed prompt for an image AI: subject, pose and emotion, setting, composition and camera angle, lighting, colours, the Gilded Kasumi paper style, aspect ratio ' + (long ? '16:9' : '9:16') + '", "text": "the words on the thumbnail, or empty", "text_place": "where the words go and their colour"}]}';
  }
  function thumbsPage() {
    var nt = needTiming(); if (nt) return h('div', { class: 'page' }, pageHead(6, 'Thumbnails', 'Three designs.'), nt);
    P.thumbs = P.thumbs || {}; var T = P.thumbs, cs = T.concepts || [];
    var pg = h('div', { class: 'page' }, pageHead(6, 'Thumbnails', 'Three different thumbnail designs that fit this video. Make each one in an image AI and add the picture here.',
      h('button', { class: 'btn', onclick: function () { copyText(thumbPrompt(), 'The thumbnail prompt is copied') } }, icon('copy'), 'Copy prompt for Sonnet')));
    pg.appendChild(h('div', { class: 'card', style: { marginBottom: 'var(--gap)' } }, h('div', { class: 'row' },
      h('div', { style: { flex: 1, minWidth: '240px' } }, h('b', null, 'How it works'), h('div', { class: 'muted', style: { fontSize: '12.5px', marginTop: '4px' } }, '1. Copy the prompt into Sonnet. It knows your story and writes 3 detailed designs. 2. Paste its reply. 3. Copy each image prompt into an image AI (ChatGPT, Gemini, Ideogram). 4. Add the pictures here and pick your favourite.')),
      h('button', { class: 'btn primary', onclick: function () {
        var ta = h('textarea', { class: 'area', style: { minHeight: '220px' }, placeholder: 'Paste the Sonnet reply with the thumbnails JSON.' });
        modal({ title: 'Paste the thumbnail designs', body: ta, actions: [{ label: 'Save', primary: true, do: function () {
          var txt = ta.value, a = txt.indexOf('{'), b = txt.lastIndexOf('}'), j = null; try { j = JSON.parse(txt.slice(a, b + 1)) } catch (e) { }
          var l = j && (j.thumbnails || j.designs); if (!Array.isArray(l) || !l.length) { ta.classList.add('field-bad'); toast('No thumbnails were found. The reply must hold {"thumbnails": [...]}.', 'warn'); return false }
          T.concepts = l.slice(0, 3).map(function (x, i) { return { n: i + 1, name: x.name || 'Design ' + (i + 1), idea: x.idea || '', prompt: x.image_prompt || x.prompt || '', text: x.text || '', place: x.text_place || '' } });
          save(true).then(render); toast('Three designs saved.', 'ok');
        } }] });
      } }, icon('paste'), cs.length ? 'Replace designs' : 'Paste designs'))));
    if (!cs.length) { pg.appendChild(h('div', { class: 'card empty' }, 'No designs yet.')); pg.appendChild(nextBar({ label: 'Sound', go: 'sound' }, { label: 'Next: Watch & export', go: 'export' })); return pg }
    var grid = h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' } });
    cs.forEach(function (c) {
      var img = h('div', { style: { aspectRatio: P.format === 'long' ? '16 / 9' : '9 / 16', maxHeight: '360px', borderRadius: '10px', overflow: 'hidden', background: 'var(--third)', border: '1px solid var(--edge)', display: 'grid', placeItems: 'center', margin: '0 auto', width: P.format === 'long' ? '100%' : 'auto', height: P.format === 'long' ? 'auto' : '360px' } }, h('span', { class: 'muted', style: { fontSize: '12px' } }, 'No picture yet'));
      if (c.has) S.getBlob(P.id + ':thumb:' + c.n).then(function (b) { if (b) { img.innerHTML = ''; img.appendChild(h('img', { src: URL.createObjectURL(b), alt: c.name, style: { width: '100%', height: '100%', objectFit: 'cover' } })) } });
      var fin = h('input', { type: 'file', accept: 'image/*', class: 'hidden-file' });
      fin.addEventListener('change', function () { var f = fin.files[0]; if (!f) return; S.putBlob(P.id + ':thumb:' + c.n, f).then(function () { c.has = true; save(true).then(render); toast('Picture added to ' + c.name + '.', 'ok') }) });
      grid.appendChild(h('div', { class: 'panel' + (T.fav === c.n ? ' lit' : ''), style: T.fav === c.n ? { boxShadow: '0 0 0 2px var(--accent), var(--shadow-panel)' } : null },
        h('div', { class: 'row' }, h('span', { class: 'mono', style: { color: 'var(--gold)' } }, String(c.n)), h('h2', { style: { margin: 0 } }, c.name), T.fav === c.n ? h('span', { class: 't-ok', style: { fontSize: '12px' } }, 'Favourite') : null),
        h('p', { class: 'sub', style: { marginTop: '4px' } }, c.idea), img,
        c.text ? h('div', { style: { margin: '10px 0 0', fontSize: '12.5px' } }, h('span', { class: 'muted' }, 'Text: '), h('b', null, c.text), c.place ? h('span', { class: 'muted' }, ' · ' + c.place) : null) : null,
        h('div', { class: 'row', style: { marginTop: '12px' } },
          h('button', { class: 'btn small', onclick: function () { copyText(c.prompt, 'The image prompt is copied') } }, icon('copy'), 'Image prompt'),
          h('button', { class: 'btn small', onclick: function () { fin.click() } }, icon('image'), c.has ? 'Replace picture' : 'Add picture'), fin,
          c.has ? h('button', { class: 'btn small', onclick: function () { S.getBlob(P.id + ':thumb:' + c.n).then(function (b) { if (b) download(safeName(P.name) + ' - thumbnail ' + c.n + '.' + ((b.type.split('/')[1] || 'png').replace('jpeg', 'jpg')), b) }) } }, icon('download'), 'Download') : null,
          h('button', { class: 'btn small' + (T.fav === c.n ? ' primary' : ''), onclick: function () { T.fav = c.n; save(true).then(render) } }, T.fav === c.n ? 'Favourite' : 'Make favourite'))));
    });
    pg.appendChild(grid);
    pg.appendChild(nextBar({ label: 'Sound', go: 'sound' }, { label: 'Next: Watch & export', go: 'export' }));
    return pg;
  }

  /* ================= stage 7: watch & export ================= */
  var WATCH = { on: false, t: 0, raf: 0, busy: false };
  function uploadPrompt() {
    var plan = GK.plan(P), long = P.format === 'long';
    return 'PROMPT S7 \u00B7 UPLOAD PACKAGE\nWrite the upload package for this ' + (long ? 'YouTube video' : 'YouTube Short and TikTok') + '. Aim for the most clicks and watch time without misleading anyone.\n\n' +
      'TITLE IDEA: ' + (P.name || plan.title) + '\nLENGTH: ' + fmtLen(totalDur()) + '\nSCRIPT:\n' + (P.script || '').trim() + '\n\n' +
      'Give: 1) 6 title options (under 60 characters, curiosity without lying, the best first), 2) a description (' + (long ? 'first 2 lines hook, then a short summary, then chapters with timestamps from the parts below' : '2 to 3 short lines') + '), 3) 15 tags, 4) 3 to 5 hashtags, 5) a pinned comment that starts a discussion' + (long ? ', 6) chapter timestamps' : '') + '.\n' +
      (long ? 'PARTS (for chapters):\n' + plan.parts.map(function (p) { return fmtT(p.start).replace(/\.\d$/, '') + ' ' + (p.title || 'Part ' + p.id) }).join('\n') + '\n' : '') +
      'OUTPUT CONTRACT: reply in plain text with exactly these headings, in this order, and nothing else: TITLES, DESCRIPTION, TAGS, HASHTAGS, PINNED COMMENT' + (long ? ', CHAPTERS' : '') + '. No greeting, no closing remarks, no questions. Answer in the chat only: no artifact, no file.';
  }
  function exportPage() {
    var nt = needTiming(); if (nt) return h('div', { class: 'page' }, pageHead(7, 'Watch & export', 'The finished video.'), nt);
    ensureJobs();
    var plan = GK.plan(P), wide = P.format === 'long';
    var pg = h('div', { class: 'page' }, pageHead(7, 'Watch & export', 'Watch the joined video with all the sound. Click a moment to improve it, then make the MP4.',
      h('button', { class: 'btn', onclick: fileForModel }, icon('download'), 'Project file')));
    var stage = h('canvas', { width: wide ? 960 : 540, height: wide ? 540 : 960, style: { width: 'auto', height: wide ? 'auto' : 'clamp(240px, calc(100dvh - 445px), 640px)', maxWidth: '100%', maxHeight: wide ? 'max(220px, calc(100dvh - 445px))' : null, display: 'block', margin: '0 auto', background: '#000', borderRadius: '12px' } });
    var status = h('div', { class: 'muted', style: { fontSize: '12.5px', margin: '8px 0' } }, 'Loading the project file…');
    var tm = h('span', { class: 'time' }), fill = h('i'), where = h('span', { class: 'where' });
    var dur = totalDur();
    var bar = h('div', { class: 'bar', onclick: function (e) { var r = bar.getBoundingClientRect(); WATCH.t = Math.max(0, Math.min(dur - .05, (e.clientX - r.left) / r.width * dur)); if (WATCH.on) { stopWatch(); startWatch() } else drawAt(WATCH.t) } }, fill);
    var pbtn = h('button', { class: 'btn round primary', 'aria-label': 'Play', onclick: function () { if (WATCH.on) stopWatch(); else startWatch() } }, icon('play'));
    var player = h('div', { class: 'player', style: { position: 'static', marginTop: '10px' } }, pbtn, h('button', { class: 'btn round', 'aria-label': 'Stop', title: 'Stop', onclick: function () { stopWatch(); WATCH.t = 0; drawAt(0) } }, icon('stop')), tm, bar, where,
      h('button', { class: 'btn small', onclick: improveMoment }, icon('spark'), 'Improve this moment'));
    function paint() { tm.textContent = fmtT(WATCH.t) + ' / ' + fmtT(dur); fill.style.width = (dur ? WATCH.t / dur * 100 : 0) + '%'; var p = plan.parts.filter(function (x) { return WATCH.t >= x.start && WATCH.t < x.end })[0]; where.textContent = p ? 'Part ' + p.id : '' }
    function drawAt(t) {
      paint();
      if (!MASTER.host || WATCH.busy) return Promise.resolve();
      WATCH.busy = true;
      return MASTER.host.ask({ cmd: 'frame', t: t }).then(function (svg) { if (!svg || typeof svg !== 'string') return; return GK.raster(svg, stage.width, stage.height).then(function (c) { stage.getContext('2d').drawImage(c, 0, 0) }) }).catch(function () { }).then(function () { WATCH.busy = false });
    }
    function startWatch() {
      stopAudio(); if (WATCH.t >= dur - .1) WATCH.t = 0;
      soundBlobs().then(function (b) { return SD.play(P, WATCH.t, dur, b) }).then(function () { WATCH.on = true; pbtn.innerHTML = ''; pbtn.appendChild(icon('pause')); pbtn.setAttribute('aria-label', 'Pause'); loop() });
    }
    function stopWatch() { var n = SD.now(); if (n != null) WATCH.t = n; SD.stop(); WATCH.on = false; cancelAnimationFrame(WATCH.raf); pbtn.innerHTML = ''; pbtn.appendChild(icon('play')); pbtn.setAttribute('aria-label', 'Play') }
    function loop() { if (!stage.isConnected) { SD.stop(); WATCH.on = false; return } var n = SD.now(); if (n != null) { WATCH.t = n; if (n >= dur) { stopWatch(); WATCH.t = 0; return } drawAt(n) } WATCH.raf = requestAnimationFrame(loop) }
    function improveMoment() {
      if (WATCH.on) stopWatch();
      var p = plan.parts.filter(function (x) { return WATCH.t >= x.start && WATCH.t < x.end })[0]; if (!p) return;
      var local = WATCH.t - p.start, note = h('textarea', { class: 'area', style: { minHeight: '110px' }, placeholder: 'What should be better here? For example: the boy is too small, the light is too dark, the camera moves too fast.' });
      var reply = h('textarea', { class: 'area', style: { minHeight: '140px', marginTop: '10px' }, placeholder: 'Then paste the Sonnet reply with the improved part here.' }), repOut = h('div', { class: 'rep-stack', style: { marginTop: '10px' } });
      var fake = { id: 'improve-' + p.id, kind: 'scene', part: p.id, title: 'Improve part ' + p.id, tagName: 'IMPROVE part ' + p.id, replyOverride: '<!-- REPLY IMPROVE part-' + p.id + ' -->' }, closeImp;
      function applyImprove(code) {
        S.snapshot(P, 'Before improving part ' + p.id);
        P.improved = (P.improved || []).filter(function (b) { return b.id !== p.id }).concat([{ id: p.id, code: code, at: Date.now(), note: note.value.trim() }]);
        save(true).then(function () { closeMaster(); render(); toast('Part ' + p.id + ' is improved. Earlier versions are kept (Script & audio, More, Undo).', 'ok', 7000) });
      }
      closeImp = modal({ title: 'Improve part ' + p.id + ' at ' + local.toFixed(1) + ' s', body: h('div', null, h('p', { class: 'muted', style: { margin: '0 0 8px', fontSize: '12.5px' } }, 'Video time ' + fmtT(WATCH.t) + '. Write what you want, copy the prompt into a new Sonnet chat with the project file, then paste the reply.'), note,
        h('div', { class: 'row', style: { marginTop: '8px' } }, h('button', { class: 'btn small', onclick: function () { copyText(J.improvePrompt(P, p.id, local, note.value.trim()), 'The improve prompt is copied') } }, icon('copy'), 'Copy prompt'), h('button', { class: 'btn small', onclick: fileForModel }, icon('download'), 'Project file ' + J.stamp(P))), reply, repOut),
        actions: [{ label: 'Check and use', primary: true, do: function () {
          repOut.innerHTML = '';
          var r = REPLY.read(P, fake, reply.value, {});
          if (!r.usable || !r.ok) {
            reply.classList.add('field-bad');
            repOut.appendChild(problemPanel(fake, { found: r.found, problems: r.problems, redirect: null }, { saved: r.usable, promptFn: function () { return J.improvePrompt(P, p.id, local, note.value.trim()) }, onUse: r.usable ? function () { closeImp(); applyImprove(r.code) } : null }));
            return false;
          }
          applyImprove(r.code);
        } }] });
    }
    var info = h('div', { class: 'stack', style: { gap: '10px' } });
    var left = h('div', { class: 'panel' }, stage, status, player);
    var exp = h('div', { class: 'card' }, h('h2', null, 'Make the MP4'), h('p', { class: 'sub' }, (wide ? '1920 x 1080' : '1080 x 1920') + ', 30 frames a second, with the narration, music and effects. Keep this window open while it works.'));
    var prog = h('div', { style: { display: 'none', marginTop: '10px' } }, h('div', { class: 'status-line' }), h('div', { class: 'progress' }, h('i', { style: { width: '0%' } })));
    var ebtn = h('button', { class: 'btn primary', onclick: doExport }, icon('film'), 'Make the MP4'), cbtn = h('button', { class: 'btn', style: { display: 'none' }, onclick: function () { window.EXPORTER.cancel() } }, 'Stop');
    exp.appendChild(h('div', { class: 'row' }, ebtn, cbtn)); exp.appendChild(prog);
    if (LASTVIDEO && LASTVIDEO.pid === P.id) exp.appendChild(h('div', { class: 'row', style: { marginTop: '10px' } }, h('span', { class: 't-ok' }, 'Ready: ' + LASTVIDEO.name), h('button', { class: 'btn small', onclick: function () { download(LASTVIDEO.name, LASTVIDEO.blob) } }, icon('download'), 'Download again')));
    function doExport() {
      if (!window.EXPORTER.supported()) { toast('This browser cannot make video files. Use Chrome or Edge on a computer.', 'bad', 8000); return }
      var missing = plan.parts.filter(function (p) { return !(MASTER.info && MASTER.info.built.some(function (b) { return b.id === p.id })) });
      if (missing.length) { toast('Not every part is built yet (missing: ' + missing.map(function (p) { return p.id }).join(', ') + '). Build and pick them first.', 'warn', 8000); return }
      if (WATCH.on) stopWatch();
      BUSY = true; ebtn.setAttribute('disabled', ''); cbtn.style.display = ''; prog.style.display = '';
      var line = prog.querySelector('.status-line'), bfill = prog.querySelector('.progress i');
      line.textContent = 'Mixing the sound…';
      soundBlobs().then(function (b) { return SD.mix(P, dur, b) }).then(function (mix) {
        return window.EXPORTER.run(MASTER.host, mix, dur, wide, function (stage2, f, left) { bfill.style.width = (f * 100).toFixed(1) + '%'; line.textContent = stage2 === 'audio' ? 'Encoding the sound…' : stage2 === 'done' ? 'Finishing…' : 'Drawing frames: ' + Math.round(f * 100) + '% · about ' + fmtLen(left) + ' left' });
      }).then(function (r) {
        var name = safeName(P.name) + '.' + r.ext; LASTVIDEO = { pid: P.id, name: name, blob: r.blob };
        download(name, r.blob); P.exported = Date.now(); save(true);
        S.folder().state === 'ok' && S.saveFile && S.saveFile(P, name, r.blob);
        toast('Your video is ready: ' + name + ' (' + (r.blob.size / 1048576).toFixed(1) + ' MB, made in ' + fmtLen(r.seconds) + ').', 'ok', 9000);
      }).catch(function (e) { toast('The MP4 could not be made: ' + e.message, 'bad', 9000) })
        .then(function () { BUSY = false; render() });
    }
    var up = h('textarea', { class: 'area', style: { minHeight: '64px', height: '64px' }, placeholder: 'Paste the upload package from Sonnet here to keep it with the video.' }, (P.upload || ''));
    up.addEventListener('input', function () { P.upload = up.value; save() });
    var pack = h('div', { class: 'card' }, h('h2', null, 'Upload package'), h('p', { class: 'sub' }, 'Titles, description, tags, hashtags and a pinned comment.'),
      h('div', { class: 'row', style: { marginBottom: '10px' } }, h('button', { class: 'btn', onclick: function () { copyText(uploadPrompt(), 'The upload prompt is copied') } }, icon('copy'), 'Copy prompt for Sonnet'), P.upload ? h('button', { class: 'btn', onclick: function () { copyText(P.upload, 'The package is copied') } }, icon('copy'), 'Copy package') : null), up);
    info.appendChild(exp); info.appendChild(pack);
    pg.appendChild(h('div', { class: 'cols' }, left, info));
    pg.appendChild(nextBar({ label: 'Thumbnails', go: 'thumbs' }, null));
    master().then(function (M) {
      var b = M.info.built.map(function (x) { return x.id }), miss = plan.parts.filter(function (p) { return b.indexOf(p.id) < 0 }).map(function (p) { return p.id });
      var bad = Object.keys(M.info.lint || {}).filter(function (k) { return (M.info.lint[k] || []).some(function (r) { return !r.ok }) });
      status.innerHTML = '';
      status.appendChild(h('span', { class: miss.length ? 't-warn' : 't-ok' }, miss.length ? (b.length ? 'Built parts: ' + b.join(', ') + '. Not built yet: ' + miss.join(', ') + '.' : 'No parts are built yet. Build them in Prompts and pick them in Pick the best.') : 'All ' + b.length + ' parts are built.'));
      if (bad.length) status.appendChild(h('span', { class: 't-warn' }, '  Checks with problems: ' + bad.join(', ') + '.'));
      if ((M.info.errors || []).length) status.appendChild(h('div', { class: 't-bad' }, 'Script errors: ' + M.info.errors.slice(0, 2).join('; ')));
      if (b.length) drawAt(WATCH.t);
      else { var g = stage.getContext('2d'); g.fillStyle = '#141416'; g.fillRect(0, 0, stage.width, stage.height); g.fillStyle = 'rgba(236,230,216,.7)'; g.font = '600 22px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.fillText('No parts are built yet', stage.width / 2, stage.height / 2 - 10); g.font = '15px Inter, Arial, sans-serif'; g.fillText('Build and pick them in stages 3 and 4', stage.width / 2, stage.height / 2 + 20) }
    });
    paint();
    return pg;
  }
  var LASTVIDEO = null;

  /* ================= settings ================= */
  function settings() {
    var gk = h('input', { class: 'input', type: 'password', placeholder: 'Paste your free Gemini key', value: CR.key(), autocomplete: 'off' });
    var fk = h('input', { class: 'input', type: 'password', placeholder: 'Paste your free Freesound key', value: SD.fsKey(), autocomplete: 'off' });
    var calm = h('div', null, seg([{ id: 'on', label: 'Animations on' }, { id: 'off', label: 'Calm (no animations)' }], document.body.classList.contains('calm') ? 'off' : 'on', function (v) { try { localStorage.setItem('studio.calm', v === 'off' ? '1' : '') } catch (e) { } document.body.classList.toggle('calm', v === 'off'); document.querySelector('.veil').remove(); settings() }));
    modal({ title: 'Settings', body: h('div', null,
      h('div', { class: 'fieldgroup' }, h('span', { class: 'label' }, 'Gemini key (the automatic critic)'), gk, h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '6px' } }, 'Free at aistudio.google.com, Get API key. It stays only in this browser.')),
      h('div', { class: 'fieldgroup' }, h('span', { class: 'label' }, 'Freesound key (sound effects)'), fk, h('div', { class: 'muted', style: { fontSize: '11.5px', marginTop: '6px' } }, 'Free at freesound.org/apiv2/apply after making an account. Only free-to-use (CC0) sounds are taken.')),
      h('div', { class: 'fieldgroup' }, h('span', { class: 'label' }, 'Motion'), calm)),
      actions: [{ label: 'Save', primary: true, do: function () { CR.setKey(gk.value); SD.setFsKey(fk.value); toast('Settings saved.', 'ok'); render() } }] });
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
    var calmOn = false; try { calmOn = !!localStorage.getItem('studio.calm') } catch (e) { }
    if (calmOn || /[?&]calm/.test(location.search)) document.body.classList.add('calm');
    GK.template().catch(function () { });
    S.persist();
    Promise.all([S.list(), S.loadFolder()]).then(function (r) { ALL = r[0]; paintFolder(); route() })
      .catch(function (e) { mainEl.appendChild(h('div', { class: 'card' }, 'The app could not open its storage: ' + (e && e.message || e) + '. Close other tabs of this app and reload.')) });
    window.addEventListener('hashchange', route);
    AUDIOEL.addEventListener('play', function () { tick(); syncPlay() });
    AUDIOEL.addEventListener('pause', syncPlay); AUDIOEL.addEventListener('ended', syncPlay);
    document.addEventListener('keydown', function (e) {
      var tag = (e.target && e.target.tagName) || '', typing = /INPUT|TEXTAREA/.test(tag) || e.target.isContentEditable;
      if (e.key === 'Escape') closeMenu();
      if (typing || document.querySelector('.veil')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && P && STAGE === 'audio') { e.preventDefault(); undo(); return }
      if (!P || STAGE !== 'audio' || !AUDIOEL.src) return;
      var T = P.timing, parts = T ? AU.parts(T.words, P.cuts || [], T.duration) : [], onParts = AUDIOTAB === 'parts' && parts.length;
      if (e.code === 'Space') { e.preventDefault(); var q = onParts ? parts[SELPART] : null; playToggle(q ? 'part' + SELPART : 'all', q ? q.start : 0, q ? q.end : (T ? T.duration : AUDIOEL.duration || 1e9)) }
      else if (onParts && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); SELPART = Math.max(0, Math.min(parts.length - 1, SELPART + (e.key === 'ArrowRight' ? 1 : -1))); SELWORD = -1; render(); CURKEY = 'part' + SELPART; playRange(parts[SELPART].start, parts[SELPART].end) }
    });
    window.addEventListener('beforeunload', function (e) { if (BUSY) { e.preventDefault(); e.returnValue = '' } });
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      var hadController = !!navigator.serviceWorker.controller, reloaded = false;
      navigator.serviceWorker.register('sw.js').then(function (reg) {
        // look for a new version when the app comes back to the front, and every 30 minutes
        document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}) });
        setInterval(function () { reg.update().catch(function () {}) }, 30 * 60 * 1000);
      }).catch(function () {});
      // a new version took over: reload once to use it, but never in the middle of listening to audio
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadController || reloaded) return;
        function tryReload() { if (BUSY) return setTimeout(tryReload, 3000); reloaded = true; save(true).then(function () { location.reload() }) }
        tryReload();
      });
    }
  }
  start();
})();
