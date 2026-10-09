/* PAPER CINEMA STUDIO — the app. Plain JS, runs in Chrome, saves in the browser. */
(function () {
  var P = null, STEP = 'project', CUT = null, PLAYER = null, $main = document.getElementById('main');
  var STEPS = [
    ['project', 'Project'], ['topic', 'Topic'], ['script', 'Script'], ['voice', 'Voice & timing'], ['plan', 'Plan'],
    ['assets', 'Assets'], ['shots', 'Shots'], ['watch', 'Watch & fix'], ['export', 'Export']
  ];
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
  function promptBox(title, text, what) { // show + copy
    copy(text, what);
    modal(title, h('div', null, h('div', { className: 'row' }, h('button', { on: { click: function () { copy(text, what) } } }, 'Copy again'), h('span', { className: 'muted small' }, text.length.toLocaleString() + ' characters')), h('textarea', { value: text, readOnly: true, style: 'min-height:70vh;margin-top:10px' })));
  }
  function modal(title, body, onClose) {
    var m = document.getElementById('modal'); document.getElementById('mtitle').textContent = title;
    var b = document.getElementById('mbody'); b.innerHTML = ''; b.appendChild(body); m.hidden = false;
    document.getElementById('mclose').onclick = function () { m.hidden = true; b.innerHTML = ''; if (onClose) onClose() };
  }
  function download(name, blob) { var a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.appendChild(a); a.click(); setTimeout(function () { a.remove() }, 1000) }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] }) }

  /* ---------------- project model ---------------- */
  function newProject(name) {
    return {
      id: 'p' + Date.now().toString(36), name: name || 'New video', created: Date.now(),
      settings: { topic: '', category: 'survival', type: 'short', minutes: 2.5, shorts: 2, shortMinutes: 1, mascot: 'both', voice: 'male', sky: 'auto', refChannel: '' },
      research: '', styleRef: '', topicAnswer: '', scriptRaw: '', title: '', voiceStyle: '', sources: '',
      cuts: [], plan: null, planRaw: '', assets: {}, assetInfo: {}, assetTickets: [], shots: {}, shotTickets: {},
      ptsAsset: 3, ptsShot: 4, claudeShots: false
    };
  }
  function syncCuts() {
    var s = P.settings, want = [];
    if (s.type === 'long') {
      want.push({ id: 'long', label: 'Long video', prefix: 'L', minutes: +s.minutes });
      for (var i = 1; i <= (+s.shorts || 0); i++) want.push({ id: 'short' + i, label: 'Short ' + i, prefix: 'ABCDEFG'[i - 1], minutes: +s.shortMinutes });
    } else want.push({ id: 'main', label: 'Main video', prefix: 'M', minutes: +s.minutes });
    var old = {}; (P.cuts || []).forEach(function (c) { old[c.id] = c });
    P.cuts = want.map(function (w) { return Object.assign(old[w.id] || { text: '', words: [], lines: [], duration: 0 }, w) });
    if (!CUT || !P.cuts.some(function (c) { return c.id === CUT })) CUT = P.cuts[0].id;
  }
  function cutById(id) { return P.cuts.filter(function (c) { return c.id === id })[0] }
  var saveT = null;
  function save(now) { clearTimeout(saveT); saveT = setTimeout(function () { DB.put(P).then(refreshProjects) }, now ? 0 : 400) }
  function sky() { return P.settings.sky !== 'auto' ? P.settings.sky : ((P.plan && P.plan.sky) || 'night') }

  /* ---------------- status per step ---------------- */
  function done(step) {
    if (!P) return false;
    switch (step) {
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
    STEPS.forEach(function (s, i) {
      nav.appendChild(h('a', { className: (STEP === s[0] ? 'on ' : '') + (done(s[0]) ? 'done' : ''), on: { click: function () { go(s[0]) } } }, h('span', { className: 'n' }, done(s[0]) ? '✓' : i + 1), h('span', { className: 't' }, s[1])));
    });
  }
  function go(step) { if (PLAYER && step !== 'watch') { PLAYER.remove(); PLAYER = null } STEP = step; render() }
  function render() {
    renderNav(); $main.innerHTML = '';
    if (!P) { $main.appendChild(h('div', null, h('h1', null, 'Welcome'), h('p', { className: 'lead' }, 'Click "+ New" to start a video, or "Load demo" to see a finished example.'))); return }
    var fn = { project: vProject, topic: vTopic, script: vScript, voice: vVoice, plan: vPlan, assets: vAssets, shots: vShots, watch: vWatch, export: vExport }[STEP];
    $main.appendChild(fn());
  }
  function rerender() { var y = window.scrollY; render(); window.scrollTo(0, y) }
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
        s.type === 'long' ? field('How many shorts from it', sel('shorts', [0, 1, 2, 3, 4])) : null,
        s.type === 'long' ? field('Each short (minutes)', sel('shortMinutes', [.75, 1, 1.5, 2, 2.5, 3])) : null,
        field('Mascot on screen', sel('mascot', [['both', 'Both (kato + nia)'], ['kato', 'kato (male)'], ['nia', 'nia (female)'], ['none', 'None']])),
        field('Narration voice', sel('voice', [['male', 'Male'], ['female', 'Female']])),
        field('Sky / colour mood', sel('sky', [['auto', 'Let the plan choose'], ['night', 'Night (cool)'], ['warm', 'Warm (sunset)']]))
      ),
      h('div', { className: 'card' }, h('h3', null, 'This project makes:'), P.cuts.map(function (c) { return h('div', null, '• ' + c.label + ' — ' + c.minutes + ' min (~' + Math.round(c.minutes * 150) + ' words), shot ids ' + c.prefix + '01, ' + c.prefix + '02…') }),
        s.type === 'long' ? h('p', { className: 'muted small' }, 'The shorts reuse the long video\'s assets, so they only need new shots. Each short gets its own script and its own audio.') : null),
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
    box.append(
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
      list('Wikipedia — most read yesterday', TREND.wiki), list('YouTube trending', TREND.yt), list('Reference channel — most viewed', TREND.channel), list('Hacker News', TREND.hn));
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
    P.plan = plan;
    plan.assets.forEach(function (a) { if (!P.assets[a.name]) P.assets[a.name] = { code: '', versions: [], status: 'todo' } });
    makeAssetTickets(); P.cuts.forEach(function (c) { makeShotTickets(c.id) });
    save(true);
  }
  function vPlan() {
    var ready = P.cuts.every(function (c) { return c.lines.length });
    function read() {
      try { var plan = PLAN.json(P.planRaw) } catch (e) { planCheck = { errors: ['Could not read JSON: ' + e.message], warnings: [] }; return rerender() }
      planCheck = PLAN.validate(plan, P.cuts);
      if (!planCheck.errors.length) { applyPlan(plan); toast('Plan accepted: ' + plan.assets.length + ' assets.') }
      rerender();
    }
    return h('div', null,
      h('h1', null, 'Plan'), h('p', { className: 'lead' }, 'One prompt plans every asset and every shot for all cuts. Claude is best here (it decides how good the video can be), but free models work too.'),
      !ready ? h('div', { className: 'card' }, badge('First finish Voice & timing for every cut.', 'b-warn')) : null,
      h('div', { className: 'card' },
        help(['Click <b>Copy plan prompt</b>, paste into Claude (or any chat).', 'Paste the JSON answer below, click <b>Read plan</b>.', 'If there are problems, click <b>Copy fix prompt</b>, paste it into the SAME chat, and paste the new answer.']),
        h('div', { className: 'row' }, h('button', { disabled: !ready, on: { click: function () { promptBox('Plan prompt', TPL.plan(P), 'Plan prompt') } } }, 'Copy plan prompt')),
        field('Paste the plan (JSON)', h('textarea', { value: P.planRaw, style: 'min-height:160px', on: { input: function () { P.planRaw = this.value; save() } } })),
        h('div', { className: 'row' }, h('button', { className: 'blue', on: { click: read } }, 'Read plan'),
          planCheck && planCheck.errors.length ? h('button', { className: 'ghost', on: { click: function () { promptBox('Plan fix prompt', TPL.planFix(P, planCheck.errors), 'Fix prompt') } } }, 'Copy fix prompt') : null),
        planCheck ? msgs(planCheck.errors, planCheck.warnings) : null),
      P.plan ? planSummary() : null,
      P.plan ? nextBtn('assets', 'Next: Assets →') : null);
  }
  function planSummary() {
    var A = P.plan.assets;
    return h('div', null,
      h('div', { className: 'card' }, h('h3', null, A.length + ' assets'),
        h('table', null, h('tr', null, h('th', null, 'name'), h('th', null, 'kind'), h('th', null, 'diff.'), h('th', null, 'size'), h('th', null, 'look')),
          A.map(function (a) { return h('tr', null, h('td', null, a.name), h('td', null, a.kind), h('td', null, a.difficulty), h('td', null, a.size), h('td', { className: 'muted' }, a.look + (a.spots ? ' · spots: ' + a.spots.join(', ') : '') + (a.moves.length ? ' · moves: ' + a.moves.join(', ') : ''))) }))),
      P.cuts.map(function (c) {
        var list = P.plan.cuts[c.id] || [];
        return h('div', { className: 'card' }, h('h3', null, c.label + ' — ' + list.length + ' shots'),
          h('table', null, list.map(function (s) { return h('tr', null, h('td', null, s.id), h('td', null, 'lines ' + s.lines.join('–')), h('td', null, s.set), h('td', null, (s.cast || []).join(', ')), h('td', { className: 'muted' }, s.show), h('td', null, s.mood || '')) })));
      }));
  }

  /* =================================================================
     TICKETS
     ================================================================= */
  function makeAssetTickets() {
    var items = P.plan.assets.map(function (a) { return { name: a.name, difficulty: a.difficulty } });
    var old = {}; (P.assetTickets || []).forEach(function (t) { old[t.names.slice().sort().join(',')] = t });
    P.assetTickets = PLAN.pack(items, P.ptsAsset).map(function (b, i) {
      var names = b.map(function (x) { return x.name }), o = old[names.slice().sort().join(',')];
      return o ? Object.assign(o, { n: i + 1 }) : { id: 'a' + i + Date.now().toString(36), n: i + 1, names: names, status: 'waiting', answer: '' };
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
      var f = h('iframe', { src: 'stage.html', className: visibleIn ? '' : 'hidden-stage' });
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
    return { duration: c.duration, words: c.words, lines: c.lines, shots: (P.plan.cuts[cid] || []).map(function (s) { return { id: s.id, from_line: s.lines[0], to_line: s.lines[1] } }) };
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
      if (x.versions.length > 12) x.versions.shift();
      x.code = code; x.status = 'pasted'; names.push(n);
    });
    return { names: names, outside: r.outside, broken: r.order.filter(function (n) { return !r.blocks[n] }) };
  }
  function checkAssets(names) {
    var expect = P.plan.assets.filter(function (a) { return names.indexOf(a.name) >= 0 });
    return stage({ mode: 'check-assets', sky: sky(), assets: assetCodes(), expect: expect }, 'check-assets').then(function (m) {
      Object.keys(m.results).forEach(function (n) {
        var r = m.results[n], a = P.assets[n] || (P.assets[n] = { code: '', versions: [] });
        a.check = r; a.status = r.ok ? (a.status === 'approved' ? 'approved' : 'checked') : 'error';
        if (r.size) P.assetInfo[n] = { size: r.size };
      });
      save(true); return m.results;
    });
  }
  function vAssets() {
    if (!P.plan) return h('div', null, h('h1', null, 'Assets'), h('div', { className: 'card' }, badge('Make the plan first.', 'b-warn')));
    var T = P.assetTickets, nOk = P.plan.assets.filter(function (a) { return (P.assets[a.name] || {}).status === 'approved' }).length;
    return h('div', null,
      h('h1', null, 'Assets'), h('p', { className: 'lead' }, 'Each ticket is a prompt for ONE new chat. Open several chats at the same time (Qwen, DeepSeek, free Claude…) — every ticket carries the same locked rules, so the pieces match.'),
      help(['Click <b>Copy prompt</b> on a ticket → paste into a NEW chat → send. Do this for every ticket at once.', 'Paste each chat\'s answer into its ticket and click <b>Check</b>.', '✅ = good → <b>Approve</b>. ❌ = click <b>Copy fix prompt</b>, paste it into the SAME chat, paste the new answer, Check again.', 'Use <b>Asset sheet</b> to see everything side by side under the same light. Something looks off? Write a note and copy a fix prompt.']),
      h('div', { className: 'card row' },
        h('span', null, 'Difficulty points per chat:'), h('select', { on: { change: function () { P.ptsAsset = +this.value; makeAssetTickets(); save(); rerender() } } }, [2, 3, 4, 6, 99].map(function (v) { return h('option', { value: v, selected: P.ptsAsset === v }, v === 99 ? 'all in one chat (Claude)' : v) })),
        h('span', { className: 'muted small' }, '1 = simple, 2 = medium, 3 = hard. 3 points = one hard asset, or medium + simple, or three simple.'),
        h('span', { className: 'grow' }), badge(nOk + ' / ' + P.plan.assets.length + ' approved', nOk === P.plan.assets.length ? 'b-ok' : 'b-blue'),
        h('button', { className: 'blue', on: { click: function () { sheetModal() } } }, 'Asset sheet')),
      T.map(assetTicketCard),
      nOk === P.plan.assets.length ? nextBtn('shots', 'Next: Shots →') : null);
  }
  function statusBadge(st) { return { waiting: badge('waiting', ''), copied: badge('in a chat', 'b-blue'), pasted: badge('pasted', 'b-blue'), checked: badge('✓ checked', 'b-ok'), approved: badge('✓ approved', 'b-ok'), error: badge('✖ needs fix', 'b-bad'), todo: badge('not made', '') }[st] || badge(st) }
  function assetTicketCard(t) {
    var A = P.plan.assets.filter(function (a) { return t.names.indexOf(a.name) >= 0 }), pts = A.reduce(function (s, a) { return s + a.difficulty }, 0);
    var ta = h('textarea', { value: t.answer || '', placeholder: 'Paste the chat\'s answer here (the code block)…', on: { input: function () { t.answer = this.value; save() } } });
    var out = h('div');
    function check() {
      var r = storeBlocks(t.answer, 'asset');
      if (!r.names.length) { out.innerHTML = ''; out.appendChild(msgs(['No KIT.asset(\'…\') found in the answer.'])); return }
      t.status = 'pasted'; out.innerHTML = 'Checking…';
      checkAssets(t.names).then(function () { t.status = t.names.every(function (n) { return (P.assets[n] || {}).status !== 'error' }) ? 'checked' : 'error'; save(true); rerender() }).catch(function (e) { out.textContent = 'Error: ' + e.message });
    }
    return h('div', { className: 'card' },
      h('div', { className: 'row' }, h('h3', null, 'Ticket ' + t.n), badge(pts + ' pts'), statusBadge(t.status), h('span', { className: 'grow' }),
        h('button', { on: { click: function () { t.status = t.status === 'waiting' ? 'copied' : t.status; save(); promptBox('Asset ticket ' + t.n, TPL.assetTicket(P, t), 'Ticket ' + t.n); renderNav() } } }, 'Copy prompt')),
      A.map(function (a) { return assetRow(a) }),
      ta, h('div', { className: 'row', style: 'margin-top:6px' }, h('button', { className: 'blue', on: { click: check } }, 'Check'),
        h('button', { className: 'ok', on: { click: function () { t.names.forEach(function (n) { var x = P.assets[n]; if (x && x.status === 'checked') x.status = 'approved' }); save(true); rerender() } } }, 'Approve all ✓')), out);
  }
  function assetRow(a) {
    var x = P.assets[a.name] || {}, c = x.check, note = h('input', { placeholder: 'What looks wrong? (e.g. "nose too small", "too bright")', style: 'flex:1;min-width:200px', value: x.note || '', on: { input: function () { x.note = this.value; save() } } });
    return h('div', { style: 'border-top:1px solid var(--line);padding:8px 0' },
      h('div', { className: 'row' }, h('b', null, a.name), h('span', { className: 'muted small' }, a.kind + ' · diff ' + a.difficulty + ' · ~' + a.size), statusBadge(x.status || 'todo'), c && c.size ? h('span', { className: 'muted small' }, 'size ' + c.size.join(' × ')) : null,
        h('span', { className: 'grow' }),
        x.code ? h('button', { className: 'ghost small', on: { click: function () { previewModal(a.name) } } }, 'Preview') : null,
        x.status === 'checked' ? h('button', { className: 'ok small', on: { click: function () { x.status = 'approved'; save(true); rerender() } } }, 'Approve') : null,
        x.status === 'approved' ? h('button', { className: 'ghost small', on: { click: function () { x.status = 'checked'; save(true); rerender() } } }, 'Un-approve') : null),
      c ? msgs(c.errors, c.warnings) : null,
      x.code ? h('div', { className: 'row', style: 'margin-top:6px' }, note,
        h('button', { className: 'ghost small', on: { click: function () { promptBox('Fix ' + a.name, TPL.assetFix(P, a.name, x.code, c ? c.errors.concat(c.warnings) : [], x.note), 'Fix prompt') } } }, 'Copy fix prompt'),
        x.versions && x.versions.length ? h('button', { className: 'ghost small', title: 'Go back to the previous version', on: { click: function () { var v = x.versions.pop(); x.code = v.code; x.status = 'pasted'; checkAssets([a.name]).then(rerender) } } }, 'Undo (' + x.versions.length + ')') : null) : null);
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
    return stage({ mode: 'check-shots', sky: sky(), assets: assetCodes(), shots: shotCodes(cid), cut: cutPayload(cid), ids: ids, res: 240 }, 'check-shots').then(function (m) {
      Object.keys(m.results).forEach(function (id) { var x = (P.shots[cid] || {})[id]; if (!x) return; var r = m.results[id]; x.check = r; x.status = r.ok ? (x.status === 'approved' ? 'approved' : 'checked') : 'error' });
      save(true); return m.results;
    });
  }
  function vShots() {
    if (!P.plan) return h('div', null, h('h1', null, 'Shots'), h('div', { className: 'card' }, badge('Make the plan first.', 'b-warn')));
    if (!P.shotTickets[CUT]) makeShotTickets(CUT);
    var plan = P.plan.cuts[CUT] || [], S = P.shots[CUT] || {}, nOk = plan.filter(function (s) { return (S[s.id] || {}).status === 'approved' }).length;
    return h('div', null,
      h('h1', null, 'Shots'), h('p', { className: 'lead' }, 'Shot tickets are filled-in forms (camera, focus, light, moves, sound) — no animation code. Free models handle them well; Claude can do a whole cut in one chat.'),
      cutTabs(),
      help(['Copy a ticket → paste into a NEW chat → paste the answer back → <b>Check</b>.', 'All shots ✅? Click <b>Approve all</b>, then go to <b>Watch & fix</b>.', 'You can watch even before all shots are made: missing shots show a placeholder.']),
      h('div', { className: 'card row' },
        h('label', { style: 'margin:0;display:flex;gap:6px;align-items:center;color:var(--ink)' }, h('input', { type: 'checkbox', checked: P.claudeShots, on: { change: function () { P.claudeShots = this.checked; makeShotTickets(CUT); save(); rerender() } } }), 'Claude mode: all shots of this cut in ONE chat'),
        !P.claudeShots ? h('span', null, ' · points per chat: ', h('select', { on: { change: function () { P.ptsShot = +this.value; makeShotTickets(CUT); save(); rerender() } } }, [2, 3, 4, 6, 8].map(function (v) { return h('option', { value: v, selected: P.ptsShot === v }, v) }))) : null,
        h('span', { className: 'grow' }), badge(nOk + ' / ' + plan.length + ' approved', nOk === plan.length ? 'b-ok' : 'b-blue')),
      (P.shotTickets[CUT] || []).map(function (t) { return shotTicketCard(CUT, t) }),
      nextBtn('watch', 'Next: Watch & fix →'));
  }
  function shotTicketCard(cid, t) {
    var c = cutById(cid), plan = P.plan.cuts[cid] || [], S = P.shots[cid] || (P.shots[cid] = {}), out = h('div');
    var ta = h('textarea', { value: t.answer || '', placeholder: 'Paste the chat\'s answer here…', on: { input: function () { t.answer = this.value; save() } } });
    function check() {
      var r = storeBlocks(t.answer, 'shot', cid);
      if (!r.names.length) { out.innerHTML = ''; out.appendChild(msgs(['No SHOT(\'…\', {...}) found in the answer.'])); return }
      out.textContent = 'Checking…';
      checkShots(cid, t.ids).then(function () { t.status = t.ids.every(function (id) { return (S[id] || {}).status === 'checked' || (S[id] || {}).status === 'approved' }) ? 'checked' : 'error'; save(true); rerender() }).catch(function (e) { out.textContent = 'Error: ' + e.message });
    }
    return h('div', { className: 'card' },
      h('div', { className: 'row' }, h('h3', null, 'Ticket ' + t.n + ' · ' + t.ids[0] + (t.ids.length > 1 ? '–' + t.ids[t.ids.length - 1] : '')), statusBadge(t.status), h('span', { className: 'grow' }),
        h('button', { disabled: !Object.keys(assetCodes()).length, on: { click: function () { t.status = t.status === 'waiting' ? 'copied' : t.status; save(); promptBox('Shot ticket ' + t.n, TPL.shotTicket(P, c, t), 'Ticket ' + t.n) } } }, 'Copy prompt')),
      t.ids.map(function (id) {
        var s = plan.filter(function (x) { return x.id === id })[0] || {}, x = S[id] || {};
        return h('div', { style: 'border-top:1px solid var(--line);padding:6px 0' }, h('div', { className: 'row' }, h('b', null, id), statusBadge(x.status || 'todo'), h('span', { className: 'muted small' }, s.show),
          x.status === 'checked' ? h('button', { className: 'ok small', on: { click: function () { x.status = 'approved'; save(true); rerender() } } }, 'Approve') : null),
          x.check ? msgs(x.check.errors, x.check.warnings) : null,
          x.status === 'error' || (x.check && x.check.warnings && x.check.warnings.length) ? h('button', { className: 'ghost small', on: { click: function () { promptBox('Fix ' + id, TPL.shotFix(P, c, id, x.code, x.check ? x.check.errors.concat(x.check.warnings) : [], ''), 'Fix prompt') } } }, 'Copy fix prompt') : null);
      }),
      ta, h('div', { className: 'row', style: 'margin-top:6px' }, h('button', { className: 'blue', on: { click: check } }, 'Check'),
        h('button', { className: 'ok', on: { click: function () { t.ids.forEach(function (id) { var x = S[id]; if (x && x.status === 'checked') x.status = 'approved' }); save(true); rerender() } } }, 'Approve all ✓')), out);
  }

  /* =================================================================
     8) WATCH & FIX
     ================================================================= */
  var CURSHOT = null, PLAYING = false, CAPS = true, QUALITY = +(localStorage.getItem('quality') || 540), SHOTINFO = null;
  function playerPayload(cid, res) {
    return { mode: 'play', sky: sky(), name: (P.title || P.name) + ' - ' + cutById(cid).label, assets: assetCodes(), shots: shotCodes(cid), cut: cutPayload(cid), captions: CAPS, res: res || QUALITY };
  }
  function vWatch() {
    if (!P.plan) return h('div', null, h('h1', null, 'Watch & fix'), h('div', { className: 'card' }, badge('Make the plan first.', 'b-warn')));
    var c = cutById(CUT), plan = P.plan.cuts[CUT] || [], S = P.shots[CUT] || {};
    var times = PLAN.shotTimes(c, plan), tlabel = h('span', { className: 'muted small' }, '0.0 s'), seekR = h('input', { type: 'range', min: 0, max: c.duration, step: .05, value: 0, style: 'flex:1' });
    var frameBox = h('div', { className: 'pframe', style: 'position:relative;overflow:hidden' });
    var list = h('div', { className: 'plist' });
    function send(m) { if (PLAYER && PLAYER.contentWindow) PLAYER.contentWindow.postMessage(m, '*') }
    function load() {
      if (PLAYER) PLAYER.remove(); PLAYING = false;
      PLAYER = h('iframe', { src: 'stage.html', style: 'width:100%;height:100%;border:0' }); frameBox.innerHTML = ''; frameBox.appendChild(PLAYER);
      DB.getFile(P.id + ':' + CUT).then(function (audio) { var pl = playerPayload(CUT); pl.audio = audio || null; PLAYER.payload = pl });
    }
    window.onmessage = function (e) {
      if (!PLAYER || e.source !== PLAYER.contentWindow) return; var m = e.data || {};
      if (m.type === 'stage-ready') { var go = function () { if (PLAYER.payload) send({ type: 'load', payload: PLAYER.payload }); else setTimeout(go, 50) }; go() }
      if (m.type === 'ready') { SHOTINFO = m.info; drawList() }
      if (m.type === 'time') { tlabel.textContent = m.t.toFixed(1) + ' / ' + c.duration.toFixed(1) + ' s'; if (document.activeElement !== seekR) seekR.value = m.t; if (m.shot !== CURSHOT) { CURSHOT = m.shot; markCur() } }
      if (m.type === 'shot-error') { var x = S[m.id]; if (x) { x.check = { ok: false, errors: [m.msg], warnings: [] }; x.status = 'error'; save(); drawList() } }
      if (m.type === 'ended') { PLAYING = false; pb.textContent = 'Play' }
    };
    seekR.oninput = function () { send({ type: 'seek', t: +this.value }) };
    var pb = h('button', { on: { click: function () { PLAYING = !PLAYING; send({ type: PLAYING ? 'play' : 'pause' }); pb.textContent = PLAYING ? 'Pause' : 'Play' } } }, 'Play');
    function markCur() { [].forEach.call(list.children, function (el) { el.classList.toggle('cur', el.dataset.id === CURSHOT) }) }
    function drawList() {
      list.innerHTML = '';
      plan.forEach(function (s, i) {
        var x = S[s.id] || (S[s.id] = { code: '', versions: [], status: 'todo' }), tm = times[i], open = x._open;
        var warnings = SHOTINFO && SHOTINFO.warnings && SHOTINFO.warnings[s.id] || [], err = SHOTINFO && SHOTINFO.errors && SHOTINFO.errors[s.id];
        var note = h('textarea', { value: x.note || '', placeholder: 'What should change? e.g. "camera too far", "he should look at the hand when it says grabs", "make it darker"', style: 'min-height:60px', on: { input: function () { x.note = this.value; save() } } });
        var ans = h('textarea', { placeholder: 'Paste the fixed SHOT(\'' + s.id + '\', …) here', style: 'min-height:60px' }), res = h('div');
        var card = h('div', { className: 'shot' + (CURSHOT === s.id ? ' cur' : ''), 'data-id': s.id },
          h('div', { className: 'row', on: { click: function () { send({ type: 'seek', t: tm.from + .05 }); x._open = !x._open; drawList() } } },
            h('b', null, s.id), h('span', { className: 'muted small' }, tm.from.toFixed(1) + '–' + tm.to.toFixed(1) + ' s'), statusBadge(x.code ? x.status : 'todo'), x.flag ? badge('to fix', 'b-warn') : null),
          h('div', { className: 'txt' }, c.lines.slice(s.lines[0], s.lines[1] + 1).map(function (l) { return l.text }).join(' ')),
          err ? msgs([err]) : null, warnings.length && open ? msgs([], warnings) : null,
          open ? h('div', { style: 'margin-top:8px' },
            note,
            h('div', { className: 'row', style: 'margin-top:6px' },
              h('button', { className: 'small', on: { click: function () { x.flag = true; save(); promptBox('Fix shot ' + s.id, TPL.shotFix(P, c, s.id, x.code, (err ? [err] : []).concat(warnings), x.note, true), 'Fix prompt') } } }, 'Copy fix prompt'),
              h('button', { className: 'ghost small', on: { click: function () { exportVideoHtml(CUT) } } }, 'Download video HTML'),
              x.code ? h('button', { className: 'ghost small', on: { click: function () { promptBox('Code of ' + s.id, x.code, 'Code') } } }, 'See code') : null,
              x.versions && x.versions.length ? h('button', { className: 'ghost small', on: { click: function () { var v = x.versions.pop(); x.code = v.code; save(true); load() } } }, 'Undo (' + x.versions.length + ')') : null),
            ans,
            h('div', { className: 'row', style: 'margin-top:6px' }, h('button', { className: 'blue small', on: { click: function () {
              var r = storeBlocks(ans.value, 'shot', CUT); if (r.names.indexOf(s.id) < 0) { res.innerHTML = ''; res.appendChild(msgs(['No SHOT(\'' + s.id + '\', …) in the pasted text.'])); return }
              res.textContent = 'Checking…';
              checkShots(CUT, [s.id]).then(function (rr) { var q = rr[s.id]; if (q.ok) { x.flag = false; x.status = 'approved'; toast('Shot ' + s.id + ' updated.') } save(true); load(); drawList() });
            } } }, 'Apply & check'), h('button', { className: 'ok small', on: { click: function () { x.status = 'approved'; x.flag = false; save(); drawList() } } }, 'Looks good ✓')), res) : null);
        list.appendChild(card);
      });
    }
    load(); drawList();
    var assetFix = h('div', { className: 'card' }, h('h3', null, 'Fix an asset (changes every shot that uses it)'),
      (function () {
        var sel = h('select', null, P.plan.assets.map(function (a) { return h('option', { value: a.name }, a.name) })), note = h('input', { placeholder: 'What is wrong with it?', style: 'flex:1;min-width:200px' }), ans = h('textarea', { placeholder: 'Paste the fixed KIT.asset(…) here', style: 'min-height:60px' }), out = h('div');
        return h('div', null, h('div', { className: 'row' }, sel, note, h('button', { className: 'small', on: { click: function () { var a = P.assets[sel.value] || {}; promptBox('Fix ' + sel.value, TPL.assetFix(P, sel.value, a.code, [], note.value), 'Fix prompt') } } }, 'Copy fix prompt')), ans,
          h('button', { className: 'blue small', style: 'margin-top:6px', on: { click: function () { var r = storeBlocks(ans.value, 'asset'); if (!r.names.length) { out.textContent = 'No KIT.asset found.'; return } out.textContent = 'Checking…'; checkAssets(r.names).then(function (rs) { out.innerHTML = ''; r.names.forEach(function (n) { var q = rs[n]; if (q) { if (q.ok) P.assets[n].status = 'approved'; out.appendChild(h('div', null, h('b', null, n + ': '), q.ok ? '✅ updated' : '', msgs(q.errors, q.warnings))) } }); save(true); load() }) } } }, 'Apply & check'), out);
      })());
    return h('div', null,
      h('h1', null, 'Watch & fix'), h('p', { className: 'lead' }, 'Watch the video with the real audio and captions. Click a shot to jump to it and fix it: the app writes the fix prompt, and you can attach the video HTML so the AI sees everything.'),
      cutTabs(function () { CURSHOT = null; SHOTINFO = null }),
      h('div', { className: 'player' },
        h('div', { className: 'pbox' }, frameBox,
          h('div', { className: 'row', style: 'margin-top:8px' }, pb, seekR), h('div', { className: 'row', style: 'margin-top:6px' }, tlabel,
            h('label', { style: 'margin:0;display:flex;gap:4px;align-items:center;color:var(--ink)' }, h('input', { type: 'checkbox', checked: CAPS, on: { change: function () { CAPS = this.checked; send({ type: 'captions', on: CAPS }) } } }), 'captions'),
            h('select', { title: 'Preview quality', on: { change: function () { QUALITY = +this.value; localStorage.setItem('quality', QUALITY); load() } } }, [[360, 'fast'], [540, 'good'], [720, 'better'], [1080, 'full']].map(function (q) { return h('option', { value: q[0], selected: QUALITY === q[0] }, q[1]) })),
            h('button', { className: 'ghost small', on: { click: load } }, 'Reload'))),
        list),
      assetFix,
      nextBtn('export', 'Next: Export →'));
  }

  /* ---------------- standalone video HTML (for the AI or to share) ---------------- */
  function exportVideoHtml(cid) {
    var files = ['kit/style-kit.js', 'kit/director.js', 'kit/stage.js'];
    Promise.all(files.map(function (f) { return fetch(f).then(function (r) { return r.text() }) })).then(function (src) {
      var pl = playerPayload(cid, 720); delete pl.assets; delete pl.shots; pl.standalone = true;
      var A = assetCodes(), S = shotCodes(cid);
      function block(type, name, code) { return '<script type="text/x-' + type + '" data-name="' + esc(name) + '">\n' + String(code).replace(/<\/script/gi, '<\\/script') + '\n</script>' }
      var html = '<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(pl.name) + '</title></head>\n<body style="margin:0;background:#0d0b10"><div id="msg" style="color:#e9dfc8;font:14px sans-serif;padding:20px">Loading…</div>\n' +
        '<!-- ============ VIDEO: ' + esc(pl.name) + ' ============\n  This file is a whole video made with the "Dark Paper Cinema" kit.\n  READ: the ASSETS (KIT.asset blocks), the SHOTS (SHOT blocks) and the TIMING (words with seconds).\n  The LOCKED KIT at the bottom draws everything — do not edit or re-explain it.\n  Audio is not included; open the file in Chrome and press Play to watch it silently with captions.\n-->\n' +
        '<!-- ============ ASSETS ============ -->\n' + Object.keys(A).map(function (n) { return block('asset', n, A[n]) }).join('\n') + '\n' +
        '<!-- ============ SHOTS (in order) ============ -->\n' + (P.plan.cuts[cid] || []).filter(function (s) { return S[s.id] }).map(function (s) { return block('shot', s.id, S[s.id]) }).join('\n') + '\n' +
        '<!-- ============ TIMING + SHOT LIST ============ -->\n<script>window.STAGE_PAYLOAD = ' + JSON.stringify(pl) + ';\nwindow.STAGE_PAYLOAD.assets = {}; window.STAGE_PAYLOAD.shots = {};\n[].forEach.call(document.querySelectorAll(\'script[type="text/x-asset"]\'), function (s) { STAGE_PAYLOAD.assets[s.dataset.name] = s.textContent });\n[].forEach.call(document.querySelectorAll(\'script[type="text/x-shot"]\'), function (s) { STAGE_PAYLOAD.shots[s.dataset.name] = s.textContent });</script>\n' +
        '<!-- ============ LOCKED KIT (do not edit) ============ -->\n<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>\n' +
        src.map(function (s) { return '<script>\n' + s + '\n</script>' }).join('\n') + '\n</body></html>';
      download(slug(pl.name) + '.html', new Blob([html], { type: 'text/html' }));
      toast('Video HTML downloaded. Attach it in the chat together with the fix prompt.', 4500);
    }).catch(function (e) { toast('Could not read the kit files (' + e.message + '). Open the app from GitHub Pages or a local server.', 6000) });
  }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video' }

  /* =================================================================
     9) EXPORT
     ================================================================= */
  function vExport() {
    var st = h('div', { className: 'muted', style: 'margin-top:8px' });
    function record(cid) {
      var box = h('div', { style: 'height:100%;display:flex;flex-direction:column;align-items:center;gap:10px' }), fr = h('div', { style: 'width:360px;height:640px;flex:none' }), info = h('div', null, 'Preparing full quality (1080 × 1920)…');
      box.append(info, fr); modal('Recording: ' + cutById(cid).label + ' — keep this window open and visible', box);
      DB.getFile(P.id + ':' + cid).then(function (audio) {
        var pl = playerPayload(cid, 1080); pl.audio = audio || null; pl.captions = CAPS;
        var f = h('iframe', { src: 'stage.html', style: 'width:100%;height:100%;border:0' }); fr.appendChild(f);
        function on(e) {
          if (e.source !== f.contentWindow) return; var m = e.data || {};
          if (m.type === 'stage-ready') f.contentWindow.postMessage({ type: 'load', payload: pl }, '*');
          if (m.type === 'ready') { info.textContent = 'Recording in real time… (' + cutById(cid).duration.toFixed(0) + ' s)'; setTimeout(function () { f.contentWindow.postMessage({ type: 'record' }, '*') }, 800) }
          if (m.type === 'time') info.textContent = 'Recording… ' + m.t.toFixed(1) + ' / ' + cutById(cid).duration.toFixed(1) + ' s';
          if (m.type === 'recorded') { window.removeEventListener('message', on); download(slug((P.title || P.name) + '-' + cutById(cid).label) + '.webm', m.blob); info.textContent = 'Done! The .webm file is downloaded. Open it in CapCut / DaVinci / Clipchamp to export MP4 if you need.' }
        }
        window.addEventListener('message', on);
      });
    }
    function exportProject(withAudio) {
      var data = JSON.parse(JSON.stringify(P)), jobs = [];
      if (withAudio) P.cuts.forEach(function (c) { jobs.push(DB.getFile(P.id + ':' + c.id).then(function (b) { if (!b) return; return new Promise(function (res) { var r = new FileReader(); r.onload = function () { (data.audio = data.audio || {})[c.id] = r.result; res() }; r.readAsDataURL(b) }) })) });
      Promise.all(jobs).then(function () { download(slug(P.name) + '.project.json', new Blob([JSON.stringify(data)], { type: 'application/json' })) });
    }
    return h('div', null,
      h('h1', null, 'Export'), h('p', { className: 'lead' }, 'Record the final video (with narration, sound effects and captions) or save the project.'),
      P.cuts.map(function (c) {
        return h('div', { className: 'card row' }, h('h3', { style: 'margin:0' }, c.label), c.hasAudio ? badge('audio ✓', 'b-ok') : badge('no audio', 'b-warn'), h('span', { className: 'grow' }),
          h('button', { disabled: !P.plan, on: { click: function () { record(c.id) } } }, 'Record video (.webm)'),
          h('button', { className: 'ghost', disabled: !P.plan, on: { click: function () { exportVideoHtml(c.id) } } }, 'Video HTML'));
      }),
      h('div', { className: 'card' }, h('h3', null, 'Project file'), h('p', { className: 'muted small' }, 'Back up the project or move it to another PC (Import at the top).'),
        h('div', { className: 'row' }, h('button', { className: 'ghost', on: { click: function () { exportProject(false) } } }, 'Export project'), h('button', { className: 'ghost', on: { click: function () { exportProject(true) } } }, 'Export project + audio'))), st,
      h('p', { className: 'muted small' }, 'Recording plays the video once in real time at 1080 × 1920. Keep the window visible while it records. YouTube accepts .webm directly.'));
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
  function openProject(id) { return DB.get(id).then(function (p) { if (!p) return; P = p; CUT = null; syncCuts(); localStorage.setItem('lastProject', id); render() }) }
  document.getElementById('projSel').onchange = function () { if (PLAYER) { PLAYER.remove(); PLAYER = null } openProject(this.value) };
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
    var D = window.DEMO; P = newProject('Demo — ' + D.title); P.settings.topic = D.title; P.title = D.title; syncCuts();
    var c = P.cuts[0], r = TIMING.estimate(D.script); c.text = D.script; c.words = r.words; c.duration = r.duration; c.lines = TIMING.lines(r.words); c.timing = 'estimate (no audio)';
    var plan = JSON.parse(JSON.stringify(D.plan)); plan.cuts = { main: plan.cuts.main.map(function (s) { s.id = s.id.replace(/^S/, 'M'); return s }) };
    PLAN.validate(plan, P.cuts); applyPlan(plan);
    Object.keys(D.assets).forEach(function (n) { P.assets[n] = { code: D.assets[n], versions: [], status: 'approved' } });
    P.assetTickets.forEach(function (t) { t.status = 'checked' });
    P.shots.main = {}; Object.keys(D.shots).forEach(function (id) { var nid = id.replace(/^S/, 'M'); P.shots.main[nid] = { code: D.shots[id].replace("SHOT('" + id + "'", "SHOT('" + nid + "'"), versions: [], status: 'approved' } });
    P.shotTickets.main.forEach(function (t) { t.status = 'checked' });
    STEP = 'watch'; save(true); localStorage.setItem('lastProject', P.id); render(); toast('Demo loaded — press Play.');
  };

  refreshProjects().then(function () {
    var last = localStorage.getItem('lastProject');
    if (last && LIST.some(function (p) { return p.id === last })) openProject(last); else if (LIST[0]) openProject(LIST[0].id); else render();
  });
  window.APP = { get P() { return P }, render: render, go: go };
})();
