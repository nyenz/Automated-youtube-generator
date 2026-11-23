/* WORKSHOP — the brain of stage 7, Watch & improve.
   1) the improve types (logic, faces, camera ...) with the checklist each one puts into the prompt
   2) the problem finder: looks at every built part (checks, state sheet, camera keys, faces, frozen moments) and lists what to improve
   3) the fully equipped improve prompt (I01, I02 ...) and the review-all prompt (R01)
   4) the change report: before against after, so you see if the improvement really changed anything. */
(function () {
  'use strict';
  var W = {}; window.WS = W;
  function J() { return window.JOBS }
  function GK() { return window.GK }
  function pad(n) { return (n < 10 ? '0' : '') + n }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i }) }
  function f1(x) { return (+x).toFixed(1) }

  /* ---------- 1. the kinds of improvement ---------- */
  W.TYPES = [
    { id: 'logic', label: 'Logic and continuity', hint: 'things stay true from scene to scene', checks: [
      'Every person looks the way the state sheet row says at the start of the part (COND): wet stays wet; dirt, bandages and torn clothes stay until something takes them away.',
      'A change inside the part happens on its word and is shown happening: the cause is on screen.',
      'Objects keep their place and state: what broke stays broken, what fell stays on the ground.',
      'Light, place and time of day match the plan and the part before.',
      'Every planned person and asset of this part appears and does what the words say.',
      'Nothing impossible: sizes, distances and who stands where make sense.'] },
    { id: 'faces', label: 'Faces and acting', hint: 'faces and bodies show the feeling', checks: [
      'Faces follow the feelings arc with feelAt(t, keys); a feeling changes on its word, in steps, never a jump.',
      'Pain shows (pain, wince), fear shows (afraid, shocked), relief shows. A hurt person moves like it (limpWalk, a hand on the hurt place).',
      'People react to big moments with react(): a head turn, a step back, a hand to the mouth.',
      'The person who speaks or acts faces the camera or the person they act on.',
      'Bodies are never stiff: weight shifts, breathing, small gestures.'] },
    { id: 'camera', label: 'Camera and shots', hint: 'framing, moves and cuts', checks: [
      'The camera always shows what is being said at that moment; the subject is framed and big enough.',
      'Every move has a reason: push in on feeling, pull back to reveal, track a moving subject.',
      'No hold longer than about 3 seconds without motion; never two big zooms in a row.',
      'HITS land on the key words, never so many that the picture shakes all the time.',
      'Captions and faces never overlap; nothing important is cut off at the edges.'] },
    { id: 'special', label: 'Special shot', hint: 'zoom inside, x-ray, frame in a frame', checks: [
      'Use the special shot named below where the words call for it, inside the chosen moment.',
      'It starts and ends smoothly and joins back into the normal shot without a jump.',
      'It shows something the normal shot cannot: the inside, the detail, or the bigger picture.',
      'If the rulebook has a helper for this shot, use it; otherwise build it from the engine layers (X.lay, X.full, clip paths).'] },
    { id: 'life', label: 'Motion and life', hint: 'nothing frozen, the world breathes', checks: [
      'Something moves in every second: background life with the LIFE helpers (sway, bob, flicker, blink, drift, pulse, spin), people breathing and blinking.',
      'Assets that should move do: trees sway, lights flicker, water ripples, smoke drifts.',
      'Motion is calm and natural, never jittery, and follows the mood: slow when sad, quick when urgent.',
      'Depth: foreground, middle and background move at different speeds when the camera moves.'] },
    { id: 'timing', label: 'Timing and sync', hint: 'pictures land on the words', checks: [
      'Each beat starts on its word with T(\'word\'), never on a guessed second.',
      'Every key word (KEY) gets its picture at the moment it is heard.',
      'Nothing important happens in the last 0.3 s before the join; IN and OUT fit the parts around it.',
      'Pauses in the voice get a small held moment; fast words get quicker changes.'] },
    { id: 'look', label: 'Look and style', hint: 'Gilded Kasumi, clean and readable', checks: [
      'Flat cut-paper shapes, thin gold edges, the limited palette, no gradients except the approved ones.',
      'The light (MOODS) fits the time, place and feeling, and changes when the story turns.',
      'Clear silhouettes: every person is easy to tell apart (signature colour, outfit).',
      'Readable on a phone: not too busy, the subject stands out from the background.'] },
    { id: 'error', label: 'Fix an error', hint: 'script errors, failed checks', checks: [
      'Fix every script error and every LINT line that fails; the part must draw every frame.',
      'Never remove a feature to make an error go away; fix the cause.',
      'Keep everything that already works exactly as it is.'] },
    { id: 'free', label: 'Free note', hint: 'only what you write', checks: [] }
  ];
  W.type = function (id) { return W.TYPES.filter(function (t) { return t.id === id })[0] };
  /* every special shot the engine has (rulebook sections 30 to 33), from the app's shot table */
  W.SHOTS = Object.keys(window.JOBS.SHOTS).map(function (k) { var d = window.JOBS.SHOTS[k][1], i = d.indexOf(':'); return [k, d.slice(0, i), d.slice(i + 1).trim()] });
  /* the engine call for each shot (rulebook section 30); shots without one are built from the engine layers */
  W.CALL = {}; Object.keys(window.JOBS.SHOTS).forEach(function (k) { W.CALL[k] = window.JOBS.SHOTS[k][0] + '(...)' });
  W.shot = function (id) { return W.SHOTS.filter(function (s) { return s[0] === id })[0] || W.SHOTS[0] };
  W.LEVEL = { bad: 'problem', warn: 'needs a look', info: 'idea' };

  /* ---------- 2. frames and the problem finder ---------- */
  W.SAMPLES = 6;
  W.times = function (END) { var o = []; for (var i = 0; i < W.SAMPLES; i++) o.push(+Math.max(0, Math.min(END - .3, END * (i + .5) / W.SAMPLES)).toFixed(2)); return o };
  /* share of pixels that differ between two same-size canvases (0..1) */
  W.diff = function (a, b) {
    if (!a || !b || a.width !== b.width || a.height !== b.height) return 1;
    var x = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, y = b.getContext('2d').getImageData(0, 0, b.width, b.height).data, n = 0, all = x.length / 4;
    for (var i = 0; i < x.length; i += 4) if (Math.abs(x[i] - y[i]) + Math.abs(x[i + 1] - y[i + 1]) + Math.abs(x[i + 2] - y[i + 2]) > 30) n++;
    return n / all;
  };
  W.small = function (info) { var st = (info && info.stage) || { W: 540, H: 960 }, k = 160 / Math.max(st.W, st.H); return { w: Math.round(st.W * k), h: Math.round(st.H * k) } };
  function grab(H, id, t, sz) { return H.ask({ cmd: 'frame', t: t, id: id }).then(function (svg) { return svg && typeof svg === 'string' ? GK().raster(svg, sz.w, sz.h) : null }).catch(function () { return null }) }

  /* everything the finder needs for one part: frames at 6 times (and 0.25 s later, to see if anything moves), errors, issues */
  W.analyse = function (P, H, info, id, code) {
    var me = ((info && info.built) || []).filter(function (b) { return b.id === id })[0], sz = W.small(info);
    var errs = ((info && info.errors) || []).filter(function (e) { return H.where && H.where(e) === 'part ' + id });
    var out = { id: id, code: code || '', info: info, errs: errs, frames: [], sz: sz };
    if (!me) { out.issues = W.issues(P, id, out); return Promise.resolve(out) }
    var ts = W.times(me.END);
    return ts.reduce(function (pr, t) {
      return pr.then(function () { return grab(H, id, t, sz) }).then(function (c) { return grab(H, id, Math.min(me.END - .02, t + .25), sz).then(function (c2) { out.frames.push({ t: t, c: c, c2: c2 }) }) });
    }, Promise.resolve()).then(function () { out.issues = W.issues(P, id, out); return out });
  };
  W.facesIn = function (code) { var F = J().FEELS, o = []; (String(code).match(/['"]([a-z]+)['"]/g) || []).forEach(function (q) { var w = q.slice(1, -1); if (F.indexOf(w) >= 0 && o.indexOf(w) < 0) o.push(w) }); return o };
  function has(code, name, obj) { return new RegExp('\\b' + obj + '\\s*(\\.\\s*' + name + '\\b|\\[\\s*[\'"]' + name + '[\'"])').test(code) }
  W.issues = function (P, id, a) {
    var out = [], plan = GK().plan(P), pp = plan.parts.filter(function (x) { return x.id === id })[0] || {}, info = a.info || {}, code = a.code || '';
    var me = (info.built || []).filter(function (b) { return b.id === id })[0];
    function add(key, level, type, title, detail, fix, t) { out.push({ key: key, part: id, level: level, type: type, title: title, detail: detail, fix: fix, t: t == null ? null : +(+t).toFixed(2) }) }
    if (!me) { add('not-built', 'bad', 'error', 'Part ' + id + ' does not draw', 'The part did not register in the project file.' + (a.errs[0] ? ' First error: ' + a.errs[0] : ''), 'Fix the script error so PART({...}) runs.'); return out }
    a.errs.slice(0, 3).forEach(function (e) { var msg = String(e).replace(/\s*\(line \d+\)\s*$/, ''); add('err:' + msg.slice(0, 60), 'bad', 'error', 'Script error', msg, 'Fix this error; it stops frames from drawing.') });
    ((info.lint || {})['part ' + id] || []).filter(function (r) { return !r.ok }).forEach(function (r) { add('lint:' + String(r.msg).slice(0, 60), 'bad', 'error', 'Check fails: ' + String(r.msg).replace(/^part \d+:?\s*/i, '').slice(0, 70), r.msg, 'Change the code so LINT() passes this line.') });
    if (window.REPLY && plan.state) window.REPLY.sceneStateProblems(P, { kind: 'scene', part: id, id: 'scene-' + id }, code, info).forEach(function (p) {
      add('state:' + p.id, p.level === 'error' ? 'bad' : 'warn', p.id === 'arc-missing' ? 'faces' : 'logic', p.title, p.detail, p.fix);
    });
    (pp.cast || []).forEach(function (n) { if (!has(code, n, 'CAST')) add('cast:' + n, 'warn', 'logic', n + ' is planned here but never drawn', 'The plan puts ' + n + ' in part ' + id + ', but the code never draws CAST.' + n + '.', 'Draw ' + n + ' with place(CAST.' + n + ', ...) where the words need them.') });
    (pp.assets || []).forEach(function (n) { if (!has(code, n, 'A')) add('asset:' + n, 'warn', 'logic', n + ' is planned here but never drawn', 'The plan lists ' + n + ' for part ' + id + ', but the code never calls A.' + n + '(...).', 'Draw A.' + n + '({...}) where the words mention it.') });
    if (window.REPLY && window.REPLY.shotProblems) window.REPLY.shotProblems(P, id, code).forEach(function (p) { add('shot:' + p.title, 'warn', 'special', p.title, p.detail, p.fix) });
    var faces = W.facesIn(code);
    if ((pp.cast || []).length && faces.length < 2 && !/feelAt\s*\(/.test(code)) add('faces-flat', 'warn', 'faces', 'Faces barely change', 'The code uses ' + (faces.length ? 'only the face "' + faces[0] + '"' : 'no named face') + ' for everyone in this part.', 'Give each person faces that follow the words and the feelings arc (feelAt with T(\'word\') keys).');
    if ((pp.cast || []).length >= 2 && !/\breact\s*\(/.test(code)) add('no-react', 'info', 'faces', 'Nobody reacts', 'There are ' + pp.cast.length + ' people in this part, but no one reacts to what happens (no react()).', 'Let the others react on the big word: a head turn, a step back, a hand to the mouth.');
    if (!/\bLIFE\s*\./.test(code)) add('no-life', 'info', 'life', 'No background life', 'The part never uses a LIFE helper, so the background may look like a still picture.', 'Add small motion: trees sway, mist drifts, lights flicker (LIFE.sway, LIFE.drift, LIFE.flicker).');
    if (!(me.HITS || []).length) add('no-hits', 'info', 'timing', 'No hits on the key words', 'P.HITS is empty, so the big words get no camera punch.', 'Add 2 to 5 HITS on the key words: [T(\'word\'), strength].');
    // camera keys: long holds and two fast zooms in a row
    var K = (me.KEYS || []).filter(function (k) { return k && k.length >= 4 && k.every(isFinite) }).sort(function (x, y) { return x[0] - y[0] }), zooms = [];
    for (var i = 1; i < K.length; i++) {
      var k0 = K[i - 1], k1 = K[i], d = k1[0] - k0[0], r = k1[3] / (k0[3] || 1);
      if (d > 3.5 && Math.abs(k1[1] - k0[1]) < 6 && Math.abs(k1[2] - k0[2]) < 6 && Math.abs(r - 1) < .04 && !(me.TRACK || []).some(function (tr) { return tr[0] < k1[0] && tr[1] > k0[0] }))
        add('hold:' + Math.round(k0[0]), d > 5 ? 'warn' : 'info', 'camera', 'The camera holds still for ' + f1(d) + ' s', 'From ' + f1(k0[0]) + ' s to ' + f1(k1[0]) + ' s the camera does not move or zoom.', 'Add a slow push in or a small drift in this stretch, or cut to another view on a word.', k0[0]);
      if (d < 1.3 && Math.abs(Math.log(r)) >= Math.log(1.5)) zooms.push({ t: k0[0], dir: r > 1 ? 1 : -1 });
    }
    for (var z = 1; z < zooms.length; z++) if (zooms[z].dir === zooms[z - 1].dir && zooms[z].t - zooms[z - 1].t < 2.5) { add('zooms:' + Math.round(zooms[z].t), 'warn', 'camera', 'Two big zooms in a row', 'The camera zooms ' + (zooms[z].dir > 0 ? 'in' : 'out') + ' fast at ' + f1(zooms[z - 1].t) + ' s and again at ' + f1(zooms[z].t) + ' s.', 'Keep one of the zooms, change the other into a pan, a cut or a slow move.', zooms[z].t); break }
    // frozen moments: nothing changes in 0.25 s
    var froz = (a.frames || []).filter(function (f) { return f.c && f.c2 && W.diff(f.c, f.c2) < .0015 }).map(function (f) { return f.t });
    if (froz.length) add('frozen', froz.length >= 2 ? 'warn' : 'info', 'life', 'Nothing moves at ' + froz.map(function (t) { return f1(t) + ' s' }).join(', '), 'The picture at ' + froz.map(function (t) { return f1(t) + ' s' }).join(', ') + ' is exactly the same a quarter of a second later: it looks like a still photo.', 'Give this moment motion: a slow camera drift, breathing, background life (LIFE helpers).', froz[0]);
    return out;
  };
  /* problems of the whole video that a scene improvement cannot fix (asset sizes, frozen assets): fixed in their own result */
  W.videoIssues = function (P) {
    var out = [];
    J().list(P).forEach(function (j) {
      var v = J().picked(j); if (!v || (j.kind !== 'assets' && j.kind !== 'cast')) return;
      ((v.check && v.check.problems) || []).forEach(function (p) {
        if (p.id === 'size' || p.id === 'still-asset') out.push({ key: 'job:' + j.id + ':' + p.title, part: null, job: j.id, tag: J().tag(P, j), level: 'warn', type: p.id === 'size' ? 'look' : 'life', title: p.title, detail: p.detail, fix: p.fix, t: null });
      });
    });
    return out;
  };
  W.reviewIssues = function (P) {
    var r = P.workshop && P.workshop.review; if (!r || !r.issues) return [];
    return r.issues.map(function (x, i) { return { key: 'review:' + i + ':' + String(x.title).slice(0, 40), part: x.part, level: x.level === 'bad' ? 'bad' : x.level === 'info' ? 'info' : 'warn', type: W.type(x.type) ? x.type : 'logic', title: x.title, detail: x.why || x.title, fix: x.fix || '', t: x.at == null ? null : +x.at, source: 'Sonnet review' } });
  };

  /* ---------- 3. prompts ---------- */
  W.replyLine = function (item) { return '<!-- REPLY ' + item.id + ' scene-' + item.part + ' -->' };
  W.words = function (P, from, to) { return ((P.timing && P.timing.words) || []).filter(function (w) { return w[1] >= from - .05 && w[2] <= to + .08 }).map(function (w) { return w[0] }).join(' ') };
  W.prompt = function (P, item, code) {
    var plan = GK().plan(P), p = plan.parts.filter(function (x) { return x.id === item.part })[0] || { start: 0, end: 0, text: '' }, n = plan.parts.length;
    var whole = item.whole, A = whole ? 0 : item.a, B = whole ? p.end - p.start : item.b, rl = W.replyLine(item), L = [], k = 0;
    L.push('PROMPT ' + item.id + ' · IMPROVE · PART ' + p.id + ' of ' + n + ' (S' + pad(p.id) + ')');
    L.push(J().fileLine(P));
    L.push('');
    L.push('MODE: IMPROVE\nPART: ' + p.id);
    L.push(whole ? 'MOMENT: the whole part (video ' + f1(p.start) + ' s to ' + f1(p.end) + ' s)' : 'MOMENT: video ' + f1(p.start + A) + ' s to ' + f1(p.start + B) + ' s = ' + f1(A) + ' s to ' + f1(B) + ' s on the part\'s own clock (t in P.draw)');
    if (!whole) L.push('WORDS IN THE MOMENT: "' + W.words(P, p.start + A, p.start + B) + '"');
    L.push('ALL WORDS OF THE PART: "' + (p.text || '') + '"');
    L.push('');
    L.push('THE PART NOW (the version in use; improve THIS code, it is also the <script data-part="' + p.id + '"> block in the project file):');
    L.push('<script data-part="' + p.id + '">\n' + String(code || '').trim() + '\n</script>');
    L.push('');
    L.push(J().rowText(plan, p.id, p.cast || []).trim());
    L.push('');
    L.push('WHAT TO IMPROVE (do every point; each one must be visible on screen' + (whole ? '' : ', mainly inside the moment') + ')');
    (item.types || []).forEach(function (id) {
      var t = W.type(id); if (!t || !t.checks.length) return;
      L.push((++k) + '. ' + t.label.toUpperCase() + (id === 'special' ? ': ' + W.shot(item.shot)[1] + ' (' + W.shot(item.shot)[2] + ')' + (W.CALL[item.shot] ? '. Use ' + W.CALL[item.shot] + ' (rulebook sections 30 to 33)' : '') : ''));
      t.checks.forEach(function (c) { L.push('   - ' + c) });
    });
    if ((item.picks || []).length) {
      L.push((++k) + '. PROBLEMS THE APP FOUND (fix each one):');
      item.picks.forEach(function (x, i) { L.push('   ' + String.fromCharCode(97 + i) + ') ' + (x.t != null ? '[at ' + f1(x.t) + ' s] ' : '') + x.title + '. ' + x.detail + ' FIX: ' + x.fix) });
    }
    if (item.note) L.push((++k) + '. MY NOTE (most important): ' + item.note);
    if (!k) L.push('1. A full review of this moment (rulebook section 19, every pass in order).');
    L.push('');
    L.push('RULES\n- Keep AUDIO_START, AUDIO_END, SEG, KEY, IN, OUT and the words exactly as they are. Change only part ' + p.id + '.\n- ' + (whole ? 'Improve the whole part.' : 'Change mainly the moment; the rest of the part stays as it is unless a fix needs it.') + '\n- Keep everything that already works. Never remove a person, an asset or a beat the plan needs.\n- ' + J().condRule());
    L.push('');
    L.push('OUTPUT CONTRACT (an app reads your reply by machine, so the format is strict):\n1. Reply with ONE ```html code block and NOTHING else: no words before or after it, no scores, no summary, no questions.\n2. The first line inside the block is exactly: ' + rl + '\n3. Then exactly one block: <script data-part="' + p.id + '"> ... </script>, complete, with both tags. Never "...", "same as before" or "rest unchanged". Notes go as // comment lines at the top, 3 lines at most.\n4. Do not return the file. Answer in the chat only: no artifact, no file, no download.\n5. Check silently, never print the checks. If a check fails, fix the code first. Never ask a question.');
    L.push('');
    L.push('QUALITY BAR (check silently)\n- Every point above is done and can be SEEN at its time; the app compares before and after picture by picture and reports what did not change.\n- LINT() passes on every line. Every score of section 19 is the same or better.');
    return L.join('\n');
  };
  W.reviewPrompt = function (P) {
    var plan = GK().plan(P), L = [];
    L.push('PROMPT R01 · REVIEW · THE WHOLE VIDEO (' + plan.parts.length + ' parts)');
    L.push(J().fileLine(P));
    L.push('\nMODE: REVIEW\n');
    L.push('TASK\nWatch the whole video in your head from the code: every <script data-part> block in the project file, in order, with its words and times. List what a careful viewer would notice and what would make it better.');
    L.push('\nTHE PARTS');
    plan.parts.forEach(function (p) { L.push('S' + pad(p.id) + ' (' + f1(p.start) + ' s to ' + f1(p.end) + ' s, ' + (p.title || '') + '): "' + (p.text || '') + '"') });
    L.push('\nTYPES (use these ids)\n' + W.TYPES.filter(function (t) { return t.id !== 'free' }).map(function (t) { return '- ' + t.id + ': ' + t.label + ', ' + t.hint }).join('\n'));
    L.push('\nOUTPUT CONTRACT (an app reads your reply by machine, so the format is strict):\n1. Reply with ONE ```json code block and NOTHING else.\n2. Exactly this shape:\n{"REPLY": "R01 review", "issues": [{"part": 2, "at": 3.4, "type": "logic", "level": "bad", "title": "the boy is dry after the water", "why": "he fell in the pond in part 1", "fix": "add COND:{boy:{wet:1}} and draw him with P.COND.boy"}]}\n3. "part" is the part number, "at" the second on the part\'s own clock (0 = start of the part), "level" is "bad" (a mistake), "warn" (weak) or "info" (an idea).\n4. 3 to 15 issues, the most important first. Only real, concrete problems that can be fixed in the code.\n5. Valid JSON: double quotes, no comments, no trailing commas. Never ask a question.');
    return L.join('\n');
  };
  W.parseReview = function (text, P) {
    text = String(text || ''); var a = text.indexOf('{'), b = text.lastIndexOf('}'), j = null;
    if (a < 0 || b <= a) return { err: 'No JSON was found. Paste the whole reply (the json code block).' };
    try { j = JSON.parse(text.slice(a, b + 1)) } catch (e) { return { err: 'The JSON is not valid (' + e.message + '). Ask Sonnet for valid JSON only.' } }
    if (!j || !Array.isArray(j.issues)) return { err: 'The JSON has no "issues" list.' };
    var ids = GK().plan(P).parts.map(function (p) { return p.id });
    var list = j.issues.filter(function (x) { return x && x.title && ids.indexOf(+x.part) >= 0 }).map(function (x) { return { part: +x.part, at: isFinite(+x.at) ? +x.at : null, type: String(x.type || 'logic'), level: String(x.level || 'warn'), title: String(x.title).slice(0, 140), why: String(x.why || '').slice(0, 300), fix: String(x.fix || '').slice(0, 400) } });
    if (!list.length) return { err: 'None of the issues names a real part (parts ' + ids.join(', ') + ').' };
    return { issues: list, skipped: j.issues.length - list.length };
  };

  /* ---------- 4. the change report ---------- */
  function names(re, code) { var o = [], m; re.lastIndex = 0; while ((m = re.exec(code))) if (o.indexOf(m[1]) < 0) o.push(m[1]); return o }
  W.features = function (code, info, id) {
    var me = ((info && info.built) || []).filter(function (b) { return b.id === id })[0] || {};
    return { faces: W.facesIn(code), poses: names(/poseAt\(\s*['"]([\w.]+)/g, code), assets: names(/\bA\.(\w+)\s*\(/g, code), people: names(/CAST\.(\w+)/g, code), life: names(/LIFE\.(\w+)/g, code),
      react: (code.match(/\breact\s*\(/g) || []).length, keys: (me.KEYS || []).length, hits: (me.HITS || []).length, cond: me.COND ? Object.keys(me.COND).map(function (n) { return n + ' ' + Object.keys(me.COND[n] || {}).join('+') }) : [] };
  };
  function lineDiff(a, b) {
    var A = String(a).split('\n').map(function (s) { return s.trim() }).filter(Boolean), B = String(b).split('\n').map(function (s) { return s.trim() }).filter(Boolean), bag = {}, add = 0, rem = 0;
    A.forEach(function (l) { bag[l] = (bag[l] || 0) + 1 });
    B.forEach(function (l) { if (bag[l]) bag[l]--; else add++ });
    Object.keys(bag).forEach(function (l) { rem += bag[l] });
    return { add: add, rem: rem, before: A.length, after: B.length };
  }
  function listDiff(label, x, y, out) {
    var plus = y.filter(function (v) { return x.indexOf(v) < 0 }), minus = x.filter(function (v) { return y.indexOf(v) < 0 });
    if (plus.length) out.push(label + ' added: ' + plus.join(', ') + '.');
    if (minus.length) out.push(label + ' removed: ' + minus.join(', ') + '.');
  }
  W.codeChanges = function (bc, ac, bi, ai, id) {
    var out = [], d = lineDiff(bc, ac), F = W.features(bc, bi, id), G = W.features(ac, ai, id);
    if (!d.add && !d.rem) return ['The code is exactly the same as before.'];
    out.push('About ' + Math.max(d.add, d.rem) + ' of ' + d.after + ' lines changed (' + d.add + ' new or changed, ' + d.rem + ' taken out or replaced).');
    listDiff('Faces', F.faces, G.faces, out); listDiff('Poses', F.poses, G.poses, out); listDiff('Assets drawn', F.assets, G.assets, out); listDiff('People drawn', F.people, G.people, out); listDiff('Background life', F.life, G.life, out);
    if (F.react !== G.react) out.push('Reactions: ' + F.react + ' → ' + G.react + '.');
    if (F.keys !== G.keys) out.push('Camera points: ' + F.keys + ' → ' + G.keys + '.');
    if (F.hits !== G.hits) out.push('Hits on words: ' + F.hits + ' → ' + G.hits + '.');
    if (F.cond.join() !== G.cond.join()) out.push('Conditions (COND): ' + (F.cond.join(', ') || 'none') + ' → ' + (G.cond.join(', ') || 'none') + '.');
    if (out.length === 1) out.push('Only numbers and details inside the drawing changed (positions, times, colours).');
    return out;
  };
  function worst(list) { return list.filter(function (x) { return x.level !== 'info' }) }
  /* B, A: results of W.analyse before and after. item: the improve request */
  W.report = function (P, item, B, A) {
    var id = item.part, rep = { asked: [], fresh: [], frames: [], code: [], around: [], verdict: 'changed' };
    var same = String(B.code).trim() === String(A.code).trim();
    rep.code = W.codeChanges(B.code, A.code, B.info, A.info, id);
    rep.frames = (A.frames || []).map(function (f, i) { var b = (B.frames || [])[i]; return { t: f.t, d: b ? W.diff(b.c, f.c) : 1 } });
    var moved = rep.frames.filter(function (f) { return f.d > .004 }).length;
    var aKeys = A.issues.map(function (x) { return x.key }), bKeys = B.issues.map(function (x) { return x.key });
    (item.picks || []).forEach(function (x) {
      var auto = x.source !== 'Sonnet review';
      rep.asked.push({ text: x.title, state: !auto ? 'eye' : aKeys.indexOf(x.key) >= 0 ? 'still' : 'fixed', t: x.t });
    });
    (item.types || []).forEach(function (t) { var T = W.type(t); if (T && T.id !== 'free') rep.asked.push({ text: T.label + (t === 'special' ? ': ' + W.shot(item.shot)[1] : ''), state: 'eye', type: true }) });
    if (item.note) rep.asked.push({ text: 'Your note: ' + item.note, state: 'eye', type: true });
    rep.fresh = worst(A.issues).filter(function (x) { return bKeys.indexOf(x.key) < 0 });
    // the parts around it: same checks as before, and the same times and joins
    var bb = (B.info.built || []).filter(function (x) { return x.id === id })[0] || {}, ab = (A.info.built || []).filter(function (x) { return x.id === id })[0] || {};
    [id - 1, id + 1].forEach(function (n) {
      var inB = (B.info.built || []).some(function (x) { return x.id === n }); if (!inB) return;
      var fb = ((B.info.lint || {})['part ' + n] || []).filter(function (r) { return !r.ok }).length, fa = ((A.info.lint || {})['part ' + n] || []).filter(function (r) { return !r.ok }).length;
      var inA = (A.info.built || []).some(function (x) { return x.id === n });
      rep.around.push(!inA ? { ok: false, text: 'Part ' + n + ' no longer draws.' } : fa > fb ? { ok: false, text: 'Part ' + n + ' now fails ' + (fa - fb) + ' more check(s).' } : { ok: true, text: 'Part ' + n + ' still passes its checks.' });
    });
    if (ab.id) rep.around.push(Math.abs((ab.AUDIO_START || 0) - (bb.AUDIO_START || 0)) > .01 || Math.abs((ab.AUDIO_END || 0) - (bb.AUDIO_END || 0)) > .01 ? { ok: false, text: 'The audio times changed (they must stay ' + bb.AUDIO_START + ' to ' + bb.AUDIO_END + ').' } : { ok: true, text: 'Audio times are the same.' });
    if (ab.id && (ab.IN !== bb.IN || ab.OUT !== bb.OUT)) rep.around.push({ ok: false, text: 'The joins changed: IN ' + bb.IN + ' → ' + ab.IN + ', OUT ' + bb.OUT + ' → ' + ab.OUT + '.' });
    if (!ab.id) rep.around.push({ ok: false, text: 'The new part ' + id + ' does not draw.' });
    var still = rep.asked.filter(function (x) { return x.state === 'still' }).length, broke = rep.around.filter(function (x) { return !x.ok }).length + rep.fresh.filter(function (x) { return x.level === 'bad' }).length;
    if (same || !moved) rep.verdict = 'nothing';
    else if (still || broke || rep.fresh.length) rep.verdict = 'partly';
    rep.moved = moved; rep.same = same; rep.still = still; rep.broke = broke;
    rep.summary = rep.verdict === 'nothing' ? (same ? 'The new code is exactly the old code.' : 'The code changed, but the pictures look the same at every checked moment.') :
      moved + ' of ' + rep.frames.length + ' checked moments look different. ' + (still ? still + ' asked fix(es) still there. ' : '') + (rep.fresh.length ? rep.fresh.length + ' new problem(s). ' : '') + (broke ? 'Something around it broke. ' : '') + (rep.verdict === 'changed' ? 'Everything the app can measure is fixed; check the rest by eye.' : '');
    rep.message = rep.verdict === 'changed' ? '' : W.sendBack(P, item, rep);
    return rep;
  };
  W.sendBack = function (P, item, rep) {
    var L = ['Your reply for ' + item.id + ' (part ' + item.part + ') ' + (rep.verdict === 'nothing' ? 'did not change the picture.' : 'did not do everything that was asked.') + ' The app compared before and after, frame by frame.'], n = 0;
    if (rep.verdict === 'nothing') L.push(rep.same ? 'The code you sent back is the same as the old code.' : 'The code changed, but at ' + rep.frames.map(function (f) { return f1(f.t) + ' s' }).join(', ') + ' the picture looks exactly as before. The changes must be VISIBLE.');
    var still = rep.asked.filter(function (x) { return x.state === 'still' });
    if (still.length) { L.push('\nSTILL THERE'); still.forEach(function (x) { L.push((++n) + '. ' + (x.t != null ? '[at ' + f1(x.t) + ' s] ' : '') + x.text) }) }
    if (rep.fresh.length) { L.push('\nNEW PROBLEMS'); rep.fresh.forEach(function (x) { L.push((++n) + '. ' + x.title + '. ' + x.detail + ' FIX: ' + x.fix) }) }
    var br = rep.around.filter(function (x) { return !x.ok });
    if (br.length) { L.push('\nBROKEN AROUND IT'); br.forEach(function (x) { L.push((++n) + '. ' + x.text) }) }
    var eye = rep.asked.filter(function (x) { return x.type });
    if (eye.length && rep.verdict === 'nothing') { L.push('\nSTILL TO DO'); eye.forEach(function (x) { L.push('- ' + x.text) }) }
    L.push('\nAnswer again the same strict way: ONE ```html code block and NOTHING else; the first line inside it exactly ' + W.replyLine(item) + '; then the complete <script data-part="' + item.part + '"> block. Never "..." or "same as before". No apology, no explanation.');
    return L.join('\n');
  };
})();
