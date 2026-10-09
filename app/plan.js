/* PLAN — read the AI's answers: plan JSON, code blocks, and pack tickets. */
(function () {
  var PL = {}; window.PLAN = PL;
  var KINDS = ['character', 'creature', 'prop', 'set', 'fx'], BUILTIN = ['kato', 'nia', 'void'];
  var MOODS = ['normal', 'warm', 'cold', 'dark', 'danger', 'silhouette', 'hope', 'flash'];

  /* take code out of ```fences``` (all of them), or the whole text */
  PL.code = function (text) {
    text = String(text || '');
    var re = /```[a-zA-Z]*\s*\n([\s\S]*?)```/g, m, out = [];
    while ((m = re.exec(text))) out.push(m[1]);
    return (out.length ? out.join('\n\n') : text).trim();
  };

  /* parse JSON leniently */
  PL.json = function (text) {
    var t = PL.code(text), a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('No JSON object found in the answer.');
    t = t.slice(a, b + 1);
    try { return JSON.parse(t) } catch (e) {
      var t2 = t.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/,\s*([}\]])/g, '$1').replace(/[“”]/g, '"');
      return JSON.parse(t2);
    }
  };

  /* split a code answer into calls: KIT.asset('name', ...) or SHOT('id', ...)  -> {name: code} */
  PL.blocks = function (text, kind) {
    var src = PL.code(text), out = {}, order = [];
    var re = kind === 'shot' ? /SHOT\s*\(\s*(['"`])([^'"`]+)\1/g : /KIT\.asset\s*\(\s*(['"`])([^'"`]+)\1/g, m, cuts = [];
    while ((m = re.exec(src))) {
      var open = src.indexOf('(', m.index), end = matchParen(src, open);
      if (end < 0) { out[m[2]] = null; order.push(m[2]); continue }
      var stop = end + 1; if (src[stop] === ';') stop++;
      out[m[2]] = src.slice(m.index, stop); order.push(m[2]); cuts.push([m.index, stop]);
      re.lastIndex = stop;
    }
    var outside = ''; var pos = 0; cuts.forEach(function (c) { outside += src.slice(pos, c[0]); pos = c[1] }); outside += src.slice(pos);
    outside = outside.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    return { blocks: out, order: order, outside: outside };
  };
  function matchParen(s, i) {
    var depth = 0, n = s.length, c, q;
    for (; i < n; i++) {
      c = s[i];
      if (c === '/' && s[i + 1] === '/') { i = s.indexOf('\n', i); if (i < 0) return -1; continue }
      if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i + 2); if (i < 0) return -1; i++; continue }
      if (c === '"' || c === "'" || c === '`') { q = c; i++; while (i < n && s[i] !== q) { if (s[i] === '\\') i++; i++ } continue }
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') { depth--; if (depth === 0) return i }
    }
    return -1;
  }

  /* check the plan against the project's cuts */
  PL.validate = function (plan, cuts) {
    var errs = [], warns = [];
    if (!plan || typeof plan !== 'object') return { errors: ['The answer is not a JSON object.'], warnings: [] };
    var A = plan.assets; if (!Array.isArray(A)) { errs.push('"assets" must be a list.'); A = [] }
    var names = {};
    A.forEach(function (a, i) {
      if (!a || !a.name) { errs.push('asset #' + (i + 1) + ' has no name.'); return }
      if (!/^[a-z0-9][a-z0-9-]*$/.test(a.name)) errs.push('asset name "' + a.name + '" must be lower-case-with-dashes.');
      if (names[a.name]) errs.push('asset "' + a.name + '" is listed twice.');
      if (BUILTIN.indexOf(a.name) >= 0) errs.push('"' + a.name + '" already exists — remove it from assets.');
      names[a.name] = a;
      if (KINDS.indexOf(a.kind) < 0) errs.push('asset "' + a.name + '": kind must be one of ' + KINDS.join(', ') + '.');
      a.difficulty = Math.max(1, Math.min(3, +a.difficulty || 2));
      a.parts = Array.isArray(a.parts) ? a.parts : []; a.moves = Array.isArray(a.moves) ? a.moves : [];
      if (a.kind === 'set') { a.spots = Array.isArray(a.spots) && a.spots.length ? a.spots : (errs.push('set "' + a.name + '" needs "spots": ["center", ...].'), []) }
      if (!a.look) warns.push('asset "' + a.name + '" has no "look".');
      if (!(+a.size > 0)) warns.push('asset "' + a.name + '" has no "size".');
    });
    var C = plan.cuts || {};
    (cuts || []).forEach(function (c) {
      var list = C[c.id];
      if (!Array.isArray(list) || !list.length) { errs.push('cuts."' + c.id + '" is missing or empty.'); return }
      var nl = (c.lines || []).length, expect = 0, ids = {};
      list.forEach(function (s, i) {
        var tag = 'shot ' + (s && s.id || '#' + (i + 1)) + ' (' + c.id + ')';
        if (!s.id) errs.push(tag + ' has no id.'); else if (ids[s.id]) errs.push('shot id ' + s.id + ' is used twice.'); ids[s.id] = 1;
        if (!Array.isArray(s.lines) || s.lines.length !== 2) { errs.push(tag + ': "lines" must be [first, last].'); return }
        var a = +s.lines[0], b = +s.lines[1];
        if (a !== expect) errs.push(tag + ' starts at line ' + a + ' but should start at line ' + expect + ' (no gaps or overlaps).');
        if (b < a) errs.push(tag + ': last line is before first line.');
        if (b - a > 3) warns.push(tag + ' covers ' + (b - a + 1) + ' lines — long shots are less dynamic.');
        expect = b + 1;
        if (s.set && s.set !== 'void' && !(names[s.set] && names[s.set].kind === 'set')) errs.push(tag + ': set "' + s.set + '" is not a set in assets.');
        if (!s.set) s.set = 'void';
        (s.cast || []).forEach(function (n) { if (!names[n] && BUILTIN.indexOf(n) < 0) errs.push(tag + ': cast "' + n + '" is not in assets.') });
        if (s.mood && MOODS.indexOf(s.mood) < 0) warns.push(tag + ': mood "' + s.mood + '" is unknown (using normal).');
        s.difficulty = Math.max(1, Math.min(3, +s.difficulty || 2));
      });
      if (nl && expect !== nl) errs.push('cut "' + c.id + '" has ' + nl + ' lines (0–' + (nl - 1) + ') but the shots cover only up to line ' + (expect - 1) + '.');
    });
    return { errors: errs, warnings: warns };
  };

  /* pack items into chats by difficulty points (keeps order for shots) */
  PL.pack = function (items, cap, keepOrder) {
    cap = Math.max(1, cap || 3);
    var list = items.slice(), bins = [];
    if (keepOrder) {
      var cur = [], pts = 0;
      list.forEach(function (it) { if (pts + it.difficulty > cap && cur.length) { bins.push(cur); cur = []; pts = 0 } cur.push(it); pts += it.difficulty });
      if (cur.length) bins.push(cur);
      return bins;
    }
    list.sort(function (a, b) { return b.difficulty - a.difficulty });
    list.forEach(function (it) {
      var best = null; bins.forEach(function (b) { var p = b.reduce(function (s, x) { return s + x.difficulty }, 0); if (p + it.difficulty <= cap && (!best || p > best.p)) best = { b: b, p: p } });
      if (best) best.b.push(it); else bins.push([it]);
    });
    return bins;
  };

  /* shot timing (same rule as the director) */
  PL.shotTimes = function (cut, plan) {
    return (plan || []).map(function (s, i) {
      var l0 = cut.lines[s.lines[0]], from = i === 0 ? 0 : (l0 ? l0.s : 0), nx = plan[i + 1], to = nx && cut.lines[nx.lines[0]] ? cut.lines[nx.lines[0]].s : cut.duration;
      return { id: s.id, from: from, to: to };
    });
  };

  /* script answer: === MARKER === sections */
  PL.sections = function (text) {
    var re = /^\s*={2,}\s*(.+?)\s*={2,}\s*$/gm, m, marks = [], out = {};
    while ((m = re.exec(text))) marks.push({ key: m[1].trim().toUpperCase(), at: m.index, end: re.lastIndex });
    marks.forEach(function (mk, i) { out[mk.key] = text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].at : text.length).trim() });
    return out;
  };
  PL.cleanScript = function (s) {
    return String(s || '').replace(/^\(.*(min|words).*\)\s*$/gim, '').replace(/[*#_>]/g, '').replace(/\[[^\]]*\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  };
})();
