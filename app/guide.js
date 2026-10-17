/* GUIDE — progress panel, hover tips and "click here next" hints.
   GUIDE.task(title, {key, units})  -> {set(pct,label), phase(label), done(msg, failed)}
   GUIDE.applyTips(root)            -> gives every known button a hover tip (what it does + what comes next)
   GUIDE.point(target, strong)      -> marks the next thing to click (soft glow; strong = scroll + pulse) */
(function () {
  var G = {}; window.GUIDE = G;
  function el(t, c, txt) { var e = document.createElement(t); if (c) e.className = c; if (txt != null) e.textContent = txt; return e }
  function fmt(s) { s = Math.max(0, Math.round(s)); return s < 60 ? s + 's' : Math.floor(s / 60) + 'm ' + (s % 60 < 10 ? '0' : '') + (s % 60) + 's' }
  function lsGet(k) { try { return localStorage.getItem(k) } catch (e) { return null } }
  function lsSet(k, v) { try { localStorage.setItem(k, v) } catch (e) { } }

  /* ---------------- progress panel (bottom right, never blocks the page) ---------------- */
  var dock = null;
  G.task = function (title, opts) {
    opts = opts || {};
    if (!dock) { dock = el('div', 'dock'); document.body.appendChild(dock) }
    var box = el('div', 'task'), head = el('div', 'task-h'), tm = el('span', 'task-t'), lab = el('div', 'task-l', opts.label || 'Starting…'), bar = el('div', 'bar'), fill = el('i');
    bar.appendChild(fill); head.appendChild(el('b', null, title)); head.appendChild(tm); box.appendChild(head); box.appendChild(bar); box.appendChild(lab); dock.appendChild(box);
    var t0 = Date.now(), tp = t0, pct = null, units = opts.units || 1, learned = opts.key ? +(lsGet('eta:' + opts.key) || 0) : 0, est = learned ? learned * units : 0, over = false;
    function tick() {
      var el0 = (Date.now() - tp) / 1000, p = pct, left = null;
      if (p == null && est) p = Math.min(.95, el0 * 1000 / est);
      if (p != null) {
        bar.classList.remove('ind'); fill.style.width = (p * 100).toFixed(1) + '%';
        if (pct != null && pct > .03) left = el0 * (1 - pct) / pct; else if (est) left = est / 1000 - el0;
        tm.textContent = Math.round(p * 100) + '%' + (left != null && left > 0 ? ' · about ' + fmt(left) + ' left' : left != null ? ' · almost done' : '');
      } else { bar.classList.add('ind'); fill.style.width = '35%'; tm.textContent = fmt((Date.now() - t0) / 1000) + ' so far' }
    }
    var iv = setInterval(tick, 500); tick();
    return {
      set: function (p, label) { if (p != null) pct = Math.max(pct || 0, Math.min(1, p)); if (label) lab.textContent = label; tick() },
      phase: function (label) { tp = Date.now(); pct = null; est = 0; if (label) lab.textContent = label; tick() },
      done: function (msg, fail) {
        if (over) return; over = true; clearInterval(iv);
        if (!fail && opts.key) { var per = (Date.now() - t0) / units; lsSet('eta:' + opts.key, Math.round(learned ? learned * .5 + per * .5 : per)) }
        bar.classList.remove('ind'); fill.style.width = '100%'; box.classList.add(fail ? 'fail' : 'ok');
        lab.textContent = msg || (fail ? 'Failed' : 'Done'); tm.textContent = fmt((Date.now() - t0) / 1000);
        setTimeout(function () { box.remove() }, fail ? 10000 : 3000);
      }
    };
  };

  /* ---------------- hover tips ---------------- */
  // label (start of the button text) -> [what it does, what to do after]
  G.TIPS = {
    '⚡ New video': ['Starts a new video the simple way: pick a style, add your audio, and the app guides you to the end.', 'Next: upload your audio on the Start page.'],
    '⚡ Easy mode': ['Starts a new video the simple way: pick a style, add your audio, and the app guides you to the end.', 'Next: upload your audio on the Start page.'],
    'Add all': ['Adds every missing thing as a small asset and puts it in the right shots, so it appears in the video.', 'Next: go to Assets; the new things have their own chat.'],
    '✨ Improve': ['Copies a prompt that makes this asset look better. Paste it into a chat, then paste the answer back (Paste & check).', 'The old version is kept: Undo brings it back.'],
    '👁 Review looks': ['Gemini looks at every asset and flags the ones that look wrong (a woman who looks like a man, the wrong skin tone…).', 'Needs a free Gemini key in ⚙ Settings.'],
    '▶ Play': ['Plays the video with your audio and captions.', 'Then click a shot or a transition on the timeline to change it.'],
    '▶ Watch it': ['Plays the 3 seconds around this transition so you can judge it.', ''],
    'Same for all same-place': ['Uses this transition everywhere two shots happen in the same place.', ''],
    'Copy improve prompt': ['Copies the prompt that improves this library asset.', 'Next: paste it into a chat, copy the answer, then Paste & save.'],
    '+ New': ['Starts a new video with every setting shown (full control).', 'Tip: Easy mode is faster if you already have the audio.'],
    '+ Full control': ['Starts a new video with every setting shown.', 'Tip: Easy mode is faster if you already have the audio.'],
    'Load demo': ['Opens a finished example so you can see what the app makes.', 'Next: press Play on the Watch page.'],
    'Import': ['Opens a backup file you saved with Export project.', ''],
    'Export': ['Makes the MP4, or saves a backup of this project.', ''],
    'Delete': ['Deletes this project from this browser. It cannot be undone.', 'Tip: Export project first if you may need it again.'],
    'Upload audio': ['Pick your narration file (mp3, wav or m4a). You can also drag it onto the page.', 'Next: paste your script if you have it, then click Start.'],
    'Start': ['Listens to your audio and times every word. A progress panel shows how long it will take.', 'Next: the Plan page opens by itself.'],
    'Start again': ['Times the audio again (use this after changing the audio or script).', 'Next: the Plan page opens by itself.'],
    'Copy plan prompt': ['Copies the plan prompt. It tells Claude your words and timing so it can plan every scene.', 'Next: paste it into Claude, copy the whole answer, then click Paste & read.'],
    '📋 Paste & read': ['Pastes what you copied from Claude and reads the plan in one click.', 'Next: the Assets page opens when the plan is OK.'],
    'Read plan': ['Reads the plan you pasted in the box and checks it.', 'Next: go to Assets.'],
    'Copy prompt': ['Copies this group\'s prompt.', 'Next: paste it into a NEW chat, copy the answer, then click Paste & check here.'],
    '📋 Paste & check': ['Pastes what you copied from the chat and checks it in one click.', 'Next: if it is green, move to the next group.'],
    'Check': ['Checks the answer in the box: names, sizes, colours and crashes.', 'Next: green = Approve. Red = Copy fix prompt.'],
    'Approve all': ['Approves everything that passed its check.', 'Next: move to the next step in the left menu.'],
    'Approve': ['Marks this as good.', ''],
    'Copy fix prompt': ['Copies a prompt that tells the chat exactly what to fix.', 'Next: paste it into the SAME chat, then Paste & check again.'],
    'Asset sheet': ['Shows every approved asset side by side, so you can spot one that does not match.', ''],
    'Preview': ['Shows this one asset. Drag to turn it.', ''],
    'Take me there': ['Goes to the page where the next job is.', ''],
    'Show me': ['Scrolls to the exact button to click next and makes it flash.', ''],
    'Open Claude': ['Opens claude.ai in a new tab.', 'Next: paste with Ctrl+V and send.'],
    'Open Qwen': ['Opens Qwen chat (free) in a new tab.', 'Next: paste with Ctrl+V and send.'],
    'Open DeepSeek': ['Opens DeepSeek chat (free) in a new tab.', 'Next: paste with Ctrl+V and send.'],
    'Open this chat': ['Goes back to the chat that is making this group.', ''],
    'Open chat': ['Goes back to the chat that is making this group.', ''],
    'Go to': ['Scrolls to this group.', ''],
    'Upload result files': ['Pick the files the chat gave you (.html, .js or .txt). The app finds the code in them and checks it.', 'Next: green = done.'],
    'Copy again': ['Copies the prompt again.', ''],
    'Export video': ['Renders the final MP4 at full quality. Keep the tab open until it finishes.', 'Next: upload it to YouTube.'],
    'Next:': ['Goes to the next step.', '']
  };
  var tip = null, tipOn = lsGet('tips') !== 'off';
  G.tipsOn = function () { return tipOn };
  G.toggleTips = function () { tipOn = !tipOn; lsSet('tips', tipOn ? 'on' : 'off'); if (tip) tip.hidden = true; return tipOn };
  function show(t) {
    if (!tip) { tip = el('div', 'tip'); document.body.appendChild(tip) }
    var what = t.getAttribute('data-tip'), nxt = t.getAttribute('data-next');
    tip.innerHTML = ''; tip.appendChild(el('div', null, what)); if (nxt) tip.appendChild(el('div', 'tip-n', nxt));
    tip.hidden = false;
    var r = t.getBoundingClientRect(), w = tip.offsetWidth, hgt = tip.offsetHeight, x = Math.min(window.innerWidth - w - 8, Math.max(8, r.left)), y = r.bottom + 8;
    if (y + hgt > window.innerHeight - 8) y = r.top - hgt - 8;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  document.addEventListener('mouseover', function (e) {
    var t = tipOn && e.target.closest ? e.target.closest('[data-tip]') : null;
    if (t) { clearTimeout(G._t); G._t = setTimeout(function () { show(t) }, 350) } else { clearTimeout(G._t); if (tip) tip.hidden = true }
  });
  document.addEventListener('scroll', function () { if (tip) tip.hidden = true }, true);
  G.applyTips = function (root) {
    var keys = Object.keys(G.TIPS).sort(function (a, b) { return b.length - a.length });
    (root || document).querySelectorAll('button,a').forEach(function (b) {
      if (b.hasAttribute('data-tip')) return;
      var txt = b.textContent.trim(), k = keys.filter(function (k) { return txt.indexOf(k) === 0 })[0];
      if (!k) return; b.setAttribute('data-tip', G.TIPS[k][0]); if (G.TIPS[k][1]) b.setAttribute('data-next', G.TIPS[k][1]);
    });
  };

  /* ---------------- "click here next" ---------------- */
  function find(target) {
    if (!target) return null;
    var scope = target.sel ? document.querySelector(target.sel) : document.getElementById('main');
    if (!scope) return null;
    return [].filter.call(scope.querySelectorAll('button'), function (b) { return !b.disabled && b.textContent.trim().indexOf(target.text) === 0 })[0] || null;
  }
  /* COACH: a small speech bubble on the next button + a nudge when nothing happens for a while */
  var bub = null, bubT = null, bubBtn = null, idle = Date.now(), nudged = 0;
  ['pointerdown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, function () { idle = Date.now(); nudged = 0 }, true) });
  function place() {
    if (!bub || !bubBtn) return; var r = bubBtn.getBoundingClientRect(), md = document.getElementById('modal');
    if (md && !md.hidden && !md.contains(bubBtn)) { bub.style.display = 'none'; return }
    if (!r.width || r.bottom < 40 || r.top > innerHeight - 20) { bub.style.display = 'none'; return }
    bub.style.display = ''; bub.style.left = Math.max(8, Math.min(innerWidth - bub.offsetWidth - 8, r.left)) + 'px'; bub.style.top = (r.bottom + 10) + 'px';
  }
  document.addEventListener('scroll', place, true); window.addEventListener('resize', place);
  setInterval(function () {
    if (!bubBtn || !document.body.contains(bubBtn)) return;
    var quiet = (Date.now() - idle) / 1000;
    if (quiet > 20 && nudged < 2 && tipOn) { nudged++; idle = Date.now(); bubBtn.classList.remove('pulse'); void bubBtn.offsetWidth; bubBtn.classList.add('pulse'); var r = bubBtn.getBoundingClientRect(); if (r.top < 60 || r.bottom > innerHeight - 20) bubBtn.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
    place();
  }, 1000);
  G.coach = function (target, text) {
    if (bub) { bub.remove(); bub = null } bubBtn = null;
    if (!target || !text || !tipOn) return;
    var b = find(target); if (!b) return;
    bubBtn = b; bub = el('div', 'coach-bubble', '👉 ' + text); document.body.appendChild(bub); idle = Date.now(); nudged = 0;
    clearTimeout(bubT); bubT = setTimeout(place, 30); place();
  };
  G.point = function (target, strong) {
    document.querySelectorAll('.next-hint').forEach(function (b) { b.classList.remove('next-hint') });
    var b = find(target); if (!b) return false;
    b.classList.add('next-hint');
    if (strong) { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse') }
    return true;
  };
})();
