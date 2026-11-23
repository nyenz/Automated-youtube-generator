/* REPLY — reads what a model sent back, strictly, and says exactly what is wrong.
   1. R.read(...)         looks at the pasted text before anything is saved: is it for this prompt, is it code only, is it complete, are the
                          numbers, names and times right. Every finding is a "problem" with a title, the detail, and how to fix it.
   2. R.runProblems(...)  turns what the locked frame found (script errors with their line, LINT lines, assets that do not draw) into problems.
   3. R.fixMessage(...)   writes a ready message to send back to the model in the same chat.
   4. R.report(...)       writes everything as plain text, to keep or to show someone.
   A problem is { id, level: 'error' | 'warn', title, detail, fix }. An error stops the reply from being used; a warning is a note. */
(function () {
  'use strict';
  var R = {}; window.REPLY = R;
  var TAG = /REPLY\W{0,6}([PACSI])(\d+)\s+([^\s"'<>*,]+)(?:\s+([AB])\b)?/i;
  function mk(level) { return function (id, title, detail, fix, x) { return Object.assign({ id: id, level: level, title: title, detail: detail, fix: fix }, x || {}) } }
  var err = mk('error'), warn = mk('warn');
  function pad(n) { return (n < 10 ? '0' : '') + n }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's') }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }
  function words(s) { return (String(s).match(/\S+/g) || []).length }
  function J() { return window.JOBS }
  function GK() { return window.GK }

  /* ---------- the shape of the text ---------- */
  function fences(text) {
    var closed = [], re = /```([\w-]*)[ \t]*\r?\n([\s\S]*?)```/g, m;
    while ((m = re.exec(text))) closed.push({ lang: (m[1] || '').toLowerCase(), body: m[2], from: m.index, to: re.lastIndex });
    var from = closed.length ? closed[closed.length - 1].to : 0, tail = text.slice(from), k = tail.indexOf('```'), open = null;
    if (k >= 0) { var rest = tail.slice(k + 3), nl = rest.indexOf('\n'); open = { lang: (nl >= 0 ? rest.slice(0, nl) : '').trim().toLowerCase(), body: nl >= 0 ? rest.slice(nl + 1) : '', from: from + k, to: text.length, open: true } }
    return { closed: closed, open: open };
  }
  function outside(text, f) {
    var cuts = f.closed.concat(f.open ? [f.open] : []), s = '', at = 0;
    cuts.forEach(function (c) { s += text.slice(at, c.from) + ' '; at = c.to }); s += text.slice(at);
    return s.replace(/^\s*(?:#+\s*)?(?:=+\s*|\*\*)?VERSION\s+[AB]\b.*$/gim, ' ');
  }
  function bodies(f) { var b = f.closed.map(function (x) { return x.body }); if (f.open) b.push(f.open.body); return b }
  /* lines that shorten the code ("...", "rest unchanged"): code you return must be complete (rulebook section 27) */
  function shortcuts(code) {
    var out = [], lines = String(code).split('\n');
    lines.forEach(function (l, i) {
      if (/^\s*\.\.\.\s*$/.test(l) || /^\s*(?:\/\/|\/\*+|\*)\s*(?:\.\.\.|…)/.test(l) || /^\s*(?:\/\/|\/\*)[^\n]*\b(?:rest of (?:the )?[\w ]{0,30}(?:unchanged|same)|same as before|unchanged from|for brevity|omitted for|truncated)\b/i.test(l)) out.push({ line: i + 1, text: l.trim().slice(0, 90) });
    });
    return out;
  }
  function namesIn(kind, code) {
    var out = [], seen = {};
    function add(n) { if (n && !seen[n]) { seen[n] = 1; out.push(n) } }
    if (kind === 'assets') code.replace(/\bASSET\s*\(\s*['"]([\w$]+)['"]/g, function (m, n) { add(n) });
    else code.replace(/\bCAST\.([A-Za-z_$][\w$]*)\s*=|\bCAST\[['"]([\w$]+)['"]\]\s*=/g, function (m, a, b) { add(a || b) });
    return out;
  }
  function jsonWhere(msg, src) {
    var pos = -1, m = /position (\d+)/.exec(msg);
    if (m) pos = +m[1];
    else if ((m = /line (\d+) column (\d+)/.exec(msg))) { var ls = src.split('\n'), i; pos = 0; for (i = 0; i < +m[1] - 1; i++) pos += ls[i].length + 1; pos += +m[2] - 1 }
    if (pos < 0 || pos > src.length) return null;
    var before = src.slice(0, pos);
    return { line: before.split('\n').length, col: pos - before.lastIndexOf('\n'), snippet: src.slice(Math.max(0, pos - 40), pos + 40).replace(/\s+/g, ' ').trim() };
  }
  function jsonCause(src) {
    var c = [];
    if (/,\s*[}\]]/.test(src)) c.push('a comma before a closing } or ] (trailing comma)');
    if (/^\s*\/\/|\s\/\/\s|\/\*/m.test(src)) c.push('comments (JSON allows none)');
    if (/[“”‘’]/.test(src)) c.push('curly quotes instead of straight "quotes"');
    if (/'\w+'\s*:/.test(src)) c.push("single quotes around a key (use double quotes)");
    if (/\.\.\./.test(src)) c.push('"..." as a shortcut');
    var open = (src.match(/\{/g) || []).length, close = (src.match(/\}/g) || []).length;
    if (open > close) c.push('the JSON is cut off (' + (open - close) + ' "{" never closed)');
    return c;
  }

  /* ---------- 1. read the pasted text ---------- */
  R.read = function (P, job, text, o) {
    o = o || {};
    text = String(text == null ? '' : text);
    var problems = [], found = [], res = { ok: false, usable: false, problems: problems, found: found, redirect: null, tag: null };
    var me = J().tag(P, job), label = J().label(P, job);
    found.push('Characters pasted: ' + num(text.length) + '.');
    if (!text.trim()) { problems.push(err('empty', 'Nothing was pasted', 'The box is empty.', 'Copy the whole reply from the Sonnet chat and paste it here.')); return res }
    var f = fences(text), nf = f.closed.length;
    found.push(nf ? 'Code blocks: ' + nf + ' (' + f.closed.map(function (x) { return (x.lang || 'no language') + ', ' + num(x.body.length) + ' characters' }).join('; ') + ')' + (f.open ? ', plus one that is never closed.' : '.') : (f.open ? 'Code blocks: one that is never closed.' : 'Code blocks: none.'));

    /* which prompt is this reply for? */
    var tm = TAG.exec(text), tag = null;
    var im = /REPLY\W{0,6}IMPROVE\s+part-(\d+)/i.exec(text);
    if (tm) { tag = { no: +tm[2], code: tm[1].toUpperCase() + pad(+tm[2]), key: tm[3].replace(/-+$/, ''), ver: tm[4] ? tm[4].toUpperCase() : null }; res.tag = tag }
    else if (im) { tag = { no: 0, key: 'improve-' + im[1], ver: null }; res.tag = tag }
    found.push('REPLY line: ' + (tag ? (tag.code ? tag.code + ' ' : 'IMPROVE ') + tag.key + (tag.ver ? ' ' + tag.ver : '') : 'none') + '.');
    if (tag && tag.key !== job.id) {
      var other = J().list(P).filter(function (j) { return j.id === tag.key })[0];
      if (other) { res.redirect = other; problems.push(err('wrong-prompt', 'This reply belongs to another prompt', 'Its REPLY line says ' + J().label(P, other) + ', but you are pasting it into ' + label + '.', 'Save it in ' + J().tag(P, other) + ' with the button below, then paste the right reply for ' + me + ' here.', { stop: true })) }
      else problems.push(err('unknown-prompt', 'The REPLY line names a prompt this video does not have', 'It says "' + tag.key + '". That job is not in this video now. The reply may come from an older plan, another video or an old chat.', 'Press "Copy prompt again" for ' + me + ' and use a NEW Sonnet chat.', { stop: true }));
      return res;
    }
    if (!f.closed.length && !f.open && job.kind !== 'plan' && !/<script\b[^>]*data-part/.test(text) && !/\bASSET\s*\(|\bCAST\b/.test(text)) {
      problems.push(err('no-code', 'There is no code in the reply', 'No code block was found. ' + (words(text) > 3 ? 'The reply starts with: "' + text.trim().slice(0, 90).replace(/\s+/g, ' ') + '".' : ''), 'Send the fix message: the reply must be ONE code block.'));
      return res;
    }

    if (!tag) problems.push(warn('no-tag', 'No REPLY line', 'The reply has no REPLY line, so the app cannot be sure it belongs to ' + me + '. It checked the code instead.', 'Next time the first line inside the code must be exactly: ' + J().replyLine(P, job, o.version)));
    if (job.kind === 'plan') readPlan(P, job, text, f, res, problems, found);
    else if (job.kind === 'scene') readScene(P, job, text, f, res, problems, found);
    else readMake(P, job, text, f, res, problems, found);

    /* format notes that apply to every reply */
    if (!res.redirect) {
      var ow = words(outside(text, f).replace(TAG, ' '));
      if ((f.closed.length || f.open) && ow > 12) problems.push(warn('extra-text', 'Text outside the code block', plural(ow, 'word') + ' were written outside the code (it starts with: "' + outside(text, f).trim().slice(0, 80).replace(/\s+/g, ' ') + '..."). The app ignored it, but it costs tokens.', 'Tell the model: code only, nothing before or after the block.'));
      if (nf > 1 && !o.allowMany) problems.push(warn('many-blocks', plural(nf, 'code block') + ' instead of one', 'The prompt asks for exactly one block. The app joined or searched them.', 'Tell the model: exactly one code block.'));
      if (f.open && !problems.some(function (p) { return p.id === 'cut-off' })) problems.push(warn('open-fence', 'A code block is never closed', 'The text ends inside a ``` block. The reply may be cut off.', 'Check the end of the reply; if it stops early, ask for it again.'));
    }
    res.ok = !problems.some(function (p) { return p.level === 'error' });
    /* usable = there is something to save. A reply with errors can still be saved (marked "needs a fix"); one with nothing to save cannot. */
    res.usable = !res.redirect && !problems.some(function (p) { return p.stop }) && !!(res.code || res.plan);
    return res;
  };

  function readScene(P, job, text, f, res, problems, found) {
    var want = job.part, plan = GK().plan(P), pp = plan.parts.filter(function (x) { return x.id === want })[0] || {};
    var re = /<script\b([^>]*)>/gi, m, blocks = [];
    while ((m = re.exec(text))) {
      var pm = /\bdata-part\s*=\s*["']?(\d+)/.exec(m[1]);
      if (pm) { var at = re.lastIndex, close = text.indexOf('</script>', at); blocks.push({ id: +pm[1], closed: close >= 0, body: close >= 0 ? text.slice(at, close) : text.slice(at) }) }
    }
    found.push('Part blocks in the reply: ' + (blocks.length ? blocks.map(function (b) { return 'part ' + b.id + (b.closed ? '' : ' (not closed)') }).join(', ') : 'none') + '.');
    if (/id="engine"/.test(text)) problems.push(warn('whole-file', 'The whole file was returned', 'The reply holds the engine and the rulebook again. That is thousands of wasted tokens. The app took the part block out of it.', 'Tell the model: return only the <script data-part> block.'));
    var mine = blocks.filter(function (b) { return b.id === want }), code = null;
    if (mine.length) {
      var b = mine[mine.length - 1];
      if (!b.closed) problems.push(err('cut-off', 'The part block is cut off', 'The block for part ' + want + ' starts but has no closing </script>. The reply probably hit the length limit (' + num(b.body.length) + ' characters came through).', 'Ask for a shorter, complete block: fewer beats, no comments. If it fails again, send the prompt in a new chat.'));
      else code = b.body;
    } else if (blocks.length) {
      var ids = blocks.map(function (x) { return x.id }).filter(function (v, i, a) { return a.indexOf(v) === i });
      var other = J().list(P).filter(function (j) { return j.kind === 'scene' && ids.indexOf(j.part) >= 0 })[0];
      if (other) res.redirect = other;
      problems.push(err('wrong-part', 'This is part ' + ids.join(', ') + ', but the prompt is for part ' + want, 'The reply holds <script data-part="' + ids.join('">, <script data-part="') + '"> and no block for part ' + want + '.' + (other ? ' It looks like the reply for ' + J().label(P, other) + '.' : ''), other ? 'Save it in ' + J().tag(P, other) + ' with the button below, then paste the reply for part ' + want + ' here.' : 'Use "Copy prompt again" and paste it in a new chat.', { stop: !!other }));
    } else {
      var cand = null; bodies(f).concat([text]).some(function (c) { var k = c.search(/\(function\s*\(\)\s*\{[\s\S]*?PART\(/); if (k >= 0 && new RegExp('id\\s*:\\s*' + want + '\\b').test(c)) { var e2 = c.lastIndexOf('})();'); cand = c.slice(k, e2 >= 0 ? e2 + 5 : undefined); return true } return false });
      if (cand) { code = cand; problems.push(warn('no-tags', 'The <script data-part> tags were missing', 'The app found the code and added the tags itself.', 'Next time the block starts with <script data-part="' + want + '"> and ends with </script>.')) }
      else problems.push(err('no-block', 'No block for part ' + want + ' was found', 'The reply has no <script data-part="' + want + '"> ... </script> block and no PART({ ... }) code.', 'Ask for exactly: <script data-part="' + want + '"> ... </script> inside one html code block.'));
    }
    if (!code) return;
    if (!/\bPART\s*\(/.test(code)) problems.push(err('no-part-call', 'The code never calls PART(...)', 'Without PART({ id, of, AUDIO_START, AUDIO_END, SEG, KEY }) the block does not register as a part.', 'Start the block with const P = PART({ ... }) as in the worked example.'));
    if (!new RegExp('\\bid\\s*:\\s*' + want + '\\b').test(code)) problems.push(err('wrong-id', 'The code does not say PART({ id: ' + want + ' })', 'The block is labelled part ' + want + ' but its PART(...) call has another id. It may be a different part.', 'Set id: ' + want + ' in PART({ ... }).'));
    [['AUDIO_START', 'start'], ['AUDIO_END', 'end']].forEach(function (k) {
      var mm = new RegExp(k[0] + '\\s*:\\s*(-?[\\d.]+)').exec(code);
      if (mm && pp[k[1]] != null && Math.abs(+mm[1] - pp[k[1]]) > .05) problems.push(err('audio-' + k[1], k[0] + ' is ' + mm[1] + ' but the plan says ' + pp[k[1]], 'The code has ' + k[0] + ' = ' + mm[1] + ', the plan has ' + pp[k[1]] + '. The audio times come from the app and are final (rulebook section 15).', 'Set ' + k[0] + ': ' + pp[k[1]] + '.'));
    });
    var sc = shortcuts(code);
    if (sc.length) problems.push(err('shortcut', 'The code is shortened', 'Line ' + sc.slice(0, 3).map(function (s) { return s.line + ' says "' + s.text + '"' }).join('; line ') + '. Code must be complete (rulebook section 27).', 'Write out the full code. Never "...", "same as before" or "rest unchanged".'));
    res.code = code.trim();
  }

  function readMake(P, job, text, f, res, problems, found) {
    var kind = job.kind, whole = /<script[^>]*id="engine"/.test(text), want = job.items.map(function (x) { return x.name }), code = null;
    if (whole) {
      var r = GK().parse(kind, text, job);
      if (r.error) problems.push(err('whole-file-block', 'The file in the reply has no usable ' + (kind === 'cast' ? 'cast' : 'asset') + ' block', r.error, 'Ask for ONLY the new ' + (kind === 'cast' ? 'cast lines' : 'ASSET(...) calls') + ', in one js code block.'));
      else { code = r.code; res.full = !!r.full; res.note = r.note || ''; problems.push(warn('whole-file', 'The whole file was returned', 'That is thousands of wasted tokens. ' + (r.note || ''), 'Tell the model: return only the new lines.')) }
    } else {
      var bs = bodies(f);
      // copied with the code box's own Copy button = clean code without the ``` marks: that is fine, no note.
      // Only flag it when there is chat text around the code.
      if (!bs.length && !looksLikeCode(text)) problems.push(warn('no-fence', 'The code was mixed with chat text', 'There was no code block, and some lines look like sentences, not code. The app used the whole reply as code.', 'Tell the model: answer with ONE code block and nothing else.'));
      code = (bs.length ? bs.join('\n\n') : text).replace(/<\/?script[^>]*>/g, '').trim();
    }
    if (code == null) return;
    var names = namesIn(kind, code);
    found.push((kind === 'assets' ? 'Assets' : 'People') + ' made in the code: ' + (names.length ? names.join(', ') : 'none') + '.');
    if (kind === 'assets' && !/\bASSET\s*\(/.test(code)) { problems.push(err('no-asset', 'No ASSET(...) call was found', 'The code has no ASSET(\'name\', spec, drawFunction) calls.', 'Ask for the ASSET(...) calls for: ' + want.join(', ') + '.')); return }
    if (kind === 'cast' && !/CAST|HAIR\s*\(|OUTFIT\s*\(|LOOKS/.test(code)) { problems.push(err('no-cast', 'No people were found', 'The code has no CAST, HAIR or OUTFIT lines.', 'Ask for the cast lines for: ' + want.join(', ') + '.')); return }
    var missing = want.filter(function (n) { return names.indexOf(n) < 0 }), extra = names.filter(function (n) { return want.indexOf(n) < 0 });
    if (!res.full) {
      var inLib = extra.filter(function (n) { return GK().isLibraryName(kind === 'cast' ? 'cast' : 'assets', n) }), fresh = extra.filter(function (n) { return inLib.indexOf(n) < 0 });
      if (!names.length || (missing.length === want.length && extra.length)) {
        var other = J().list(P).filter(function (j) { return j.id !== job.id && (j.kind === 'assets' || j.kind === 'cast') && j.items.some(function (x) { return extra.indexOf(x.name) >= 0 }) })[0];
        if (other && extra.length) { res.redirect = other; problems.push(err('wrong-prompt', 'This reply looks like it belongs to another prompt', 'It makes ' + extra.join(', ') + ', which is the job of ' + J().label(P, other) + ' (this prompt asked for ' + want.join(', ') + ').', 'Save it in ' + J().tag(P, other) + ' with the button below.', { stop: true })); return }
      }
      if (missing.length) problems.push((kind === 'assets' ? err : warn)('missing-names', 'Not made: ' + missing.join(', '), 'The prompt asked for ' + want.join(', ') + '; the code makes ' + (names.length ? names.join(', ') : 'none of them') + '.', 'Add ' + (kind === 'assets' ? 'ASSET(...)' : 'CAST entries') + ' for: ' + missing.join(', ') + ', spelled exactly like that.'));
      if (inLib.length) problems.push(err('changes-library', 'It redefines things that already exist: ' + inLib.join(', '), 'Changing an existing ' + (kind === 'assets' ? 'asset' : 'person') + ' changes every part that already uses it (rulebook section 27).', 'Remove ' + inLib.join(', ') + '. Make only: ' + want.join(', ') + '.'));
      if (fresh.length) problems.push(warn('extra-names', 'Also made, not asked for: ' + fresh.join(', '), 'Another prompt may be making the same thing, and one will replace the other.', 'Remove it unless it is needed.'));
    }
    var sc = shortcuts(code);
    if (sc.length) problems.push(err('shortcut', 'The code is shortened', 'Line ' + sc.slice(0, 3).map(function (s) { return s.line + ' says "' + s.text + '"' }).join('; line ') + '. Code must be complete (rulebook section 27).', 'Write out the full code. Never "...", "same as before" or "rest unchanged".'));
    res.code = code;
  }

  function readPlan(P, job, text, f, res, problems, found) {
    var cands = [], pb = /<script type="application\/json" id="project">([\s\S]*?)<\/script>/.exec(text), j = null, bad = null;
    if (pb) cands.push(pb[1]);
    bodies(f).forEach(function (c) { cands.push(c) });
    var a = text.indexOf('{'), b = text.lastIndexOf('}'); if (a >= 0 && b > a) cands.push(text.slice(a, b + 1));
    for (var i = 0; i < cands.length && !j; i++) {
      try { var o = JSON.parse(cands[i]); if (o && Array.isArray(o.parts)) j = o; else if (!bad) bad = { msg: 'The JSON has no "parts" list.', src: null } }
      catch (e) { if (!bad || !bad.src || cands[i].length > bad.src.length) bad = { msg: e.message, src: cands[i] } }
    }
    if (!j) {
      var w = bad && bad.src ? jsonWhere(bad.msg, bad.src) : null, cause = bad && bad.src ? jsonCause(bad.src) : [];
      problems.push(err('bad-json', bad && bad.src ? 'The JSON is broken' : 'No plan JSON was found', (bad ? bad.msg : 'No { ... } was found in the reply.') + (w ? ' Near line ' + w.line + ', column ' + w.col + ': "' + w.snippet + '".' : '') + (cause.length ? ' Likely cause: ' + cause.join('; ') + '.' : ''), 'Ask for valid JSON only: double quotes, no comments, no trailing commas, one ```json block with a "parts" list.'));
      return;
    }
    var want = GK().plan(P).parts.map(function (p) { return p.id }), got = j.parts.map(function (p) { return p && p.id });
    found.push('Parts in the JSON: ' + got.length + ' (ids ' + got.join(', ') + ').');
    var missing = want.filter(function (id) { return got.indexOf(id) < 0 }), extra = got.filter(function (id) { return want.indexOf(id) < 0 }), dup = got.filter(function (id, k) { return got.indexOf(id) !== k });
    if (missing.length) problems.push(err('missing-parts', 'Parts missing: ' + missing.join(', '), 'The video has ' + want.length + ' parts (ids ' + want.join(', ') + '); the JSON has ' + got.length + '.', 'Add every part, ids ' + want.join(', ') + ', each once.'));
    if (dup.length) problems.push(err('duplicate-parts', 'Part ' + dup.join(', ') + ' appears twice', 'Each id must appear once.', 'Remove the duplicate.'));
    if (extra.length) problems.push(warn('extra-parts', 'Parts that do not exist: ' + extra.join(', '), 'The app ignores them.', 'Only ids ' + want.join(', ') + '.'));
    var noWho = [], thin = [], gaps = {}, kept = [];
    j.parts.forEach(function (p) {
      if (!p || want.indexOf(p.id) < 0) return;
      if (!(p.cast || []).length && !(p.assets || []).length) noWho.push(p.id);
      var nb = (p.beats || []).length; if (nb < 3 || nb > 8) thin.push(p.id + ' (' + nb + ')');
      ['place', 'time', 'starts_on', 'ends_on', 'job'].forEach(function (k) { if (!p[k]) (gaps[k] = gaps[k] || []).push(p.id) });
      if (!(p.moods || []).length) (gaps.moods = gaps.moods || []).push(p.id);
      var w = GK().plan(P).parts.filter(function (x) { return x.id === p.id })[0];
      if (w && (p.start != null && Math.abs(p.start - w.start) > .05 || p.end != null && Math.abs(p.end - w.end) > .05)) kept.push(p.id);
    });
    if (noWho.length) problems.push(err('no-cast-assets', 'No people and no assets in part ' + noWho.join(', '), 'Every part needs at least one person or one asset by name.', 'Fill "cast" and "assets" for those parts.'));
    if (thin.length) problems.push(warn('beats', 'Beats should be 3 to 8 per part', 'Part ' + thin.join(', part ') + '.', 'Give each part 3 to 8 short beats.'));
    Object.keys(gaps).forEach(function (k) { problems.push(warn('empty-' + k, '"' + k + '" is empty in part ' + gaps[k].join(', '), 'The scene prompts use this field.', 'Fill "' + k + '" for those parts.')) });
    if (kept.length) problems.push(warn('times-changed', 'Times were changed in part ' + kept.join(', '), 'The app keeps its own times (they come from the audio).', 'Do not write start, end or text.'));
    if (j.audio && j.audio.words) problems.push(warn('repeated-audio', 'The audio words were repeated', 'The reply holds the whole word list again. That wastes thousands of tokens. The app ignored it.', 'Do not return "audio", "stage", start, end or text.'));
    var lib = GK().libraryNames(), ai = j.assets_info || {}, ci = j.cast_info || {}, noAI = [], noCI = [];
    j.parts.forEach(function (p) { (p && p.assets || []).forEach(function (n) { if (!lib.assets[n] && !ai[n] && noAI.indexOf(n) < 0) noAI.push(n) }); (p && p.cast || []).forEach(function (n) { if (!lib.cast[n] && !ci[n] && noCI.indexOf(n) < 0) noCI.push(n) }) });
    if (noAI.length) problems.push(warn('no-assets-info', 'New assets without a description: ' + noAI.join(', '), 'They are not in the library and have no "assets_info" entry, so the app treats them as medium.', 'Add them to "assets_info" with a note and a level.'));
    if (noCI.length) problems.push(warn('no-cast-info', 'New people without a description: ' + noCI.join(', '), 'They are not in the library and have no "cast_info" entry.', 'Add them to "cast_info" with a note and a level.'));
    R.stateProblems(j, want).forEach(function (x) { problems.push(x) });
    R.shotPlanProblems(j, want, GK().plan(P)).forEach(function (x) { problems.push(x) });
    var badJ = []; j.parts.forEach(function (p) { if (!p) return; ['in', 'out'].forEach(function (k) { if (p[k] && p[k] !== 'none' && J().JOINS.indexOf(p[k]) < 0) badJ.push('part ' + p.id + ' ' + k + ': ' + p[k]) }) });
    if (badJ.length) problems.push(warn('bad-join', 'Unknown joins: ' + badJ.slice(0, 5).join(', '), 'The engine has these joins: ' + J().JOINS.join(', ') + '.', 'Use only those names.'));
    res.plan = j;
  }

  /* ---------- 2. what the locked frame found ---------- */
  R.runProblems = function (P, job, ver, r) {
    var out = [];
    if (job.kind === 'plan' || !r) return out;
    var lines = String(ver.code || '').split('\n');
    if (r.broken) out.push(err('broken', 'The code does not run', r.broken, 'Look for a syntax error, a missing PART(...) call or a missing closing bracket.'));
    (r.errorLines || []).slice(0, 4).forEach(function (e) {
      var snip = e.line && lines[e.line - 1] ? lines[e.line - 1].trim().slice(0, 100) : '';
      out.push(err('script-error', 'Script error' + (e.line ? ' at line ' + e.line + ' of the code' : ''), e.msg + (snip ? '   →   ' + snip : ''), 'Fix this error. It stops the code from drawing.', { line: e.line || null }));
    });
    if (job.kind === 'scene' && !r.broken) R.sceneStateProblems(P, job, String(ver.code || ''), r.info).forEach(function (x) { out.push(x) });
    if (job.kind === 'scene' && !r.broken) R.shotProblems(P, job.part, String(ver.code || '')).forEach(function (x) { out.push(x) });
    (r.lint || []).filter(function (x) { return !x.ok }).forEach(function (x) { out.push(err('lint', 'Check (LINT) failed', x.msg, 'Change the code so LINT() passes this line (rulebook sections 14 to 16).')) });
    (r.cards || []).forEach(function (c) {
      if (c.missing) out.push(err('card-missing', c.name + ' was not made', 'The file has no ' + (job.kind === 'cast' ? 'CAST.' + c.name : "ASSET('" + c.name + "')") + '.', 'Add it with exactly this name.'));
      else if (c.error) out.push(err('card-error', c.name + ' does not draw', c.error, 'Fix the drawing code of ' + c.name + '. It must draw with its demo values.'));
      else if (job.kind === 'assets' && c.box) { var it = (job.items || []).filter(function (x) { return x.name === c.name })[0], sz = R.sizeCheck(c.name, it ? it.note : '', c.box, c.band); if (sz) out.push(warn('size', sz.title, sz.detail, sz.fix));
        if (c.moves === false && !c.still) out.push(warn('still-asset', c.name + ' does not move', 'The app drew ' + c.name + ' at two moments and it looked exactly the same' + (c.alive ? ', although its spec says alive: \'' + c.alive + '\'' : '') + '. A frozen asset makes the scene look fake (section 9).', 'Give ' + c.name + ' a small motion with the clock LIFE.t(o) and a LIFE helper (sway, bob, flicker, blink, drift, pulse, spin) and add alive: \'...\' to its spec. If it truly never moves (a board lying on the ground), add still: \'the reason\' to its spec instead.')) }
    });
    return out;
  };

  /* real size: the asset's box against the size in the plan note ("520 wide x 1500 tall") or, without one, the size table of section 4 */
  var NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, single: 1 };
  R.planSize = function (note) {
    var m = String(note || '').match(/(\d{2,5})\s*(?:units?\s*)?(?:wide|w|long)\s*(?:x|×|by|,)\s*(\d{2,5})\s*(?:units?\s*)?(?:tall|high|h)/i);
    return m ? { w: +m[1], h: +m[2] } : null;
  };
  R.sizeCheck = function (name, note, box, band) {
    var w = Math.round(box[2]), hh = Math.round(box[3]), txt = (name + ' ' + (note || '')).toLowerCase(), want = R.planSize(note);
    function fixFor(W, H) { return 'Set the box of ' + name + ' to [' + Math.round(-W / 2) + ', ' + (-H) + ', ' + W + ', ' + H + '] and draw it to fill that size (about 190 units = 1 metre; an adult is 340 tall).' }
    if (want) {
      var off = Math.max(Math.abs(w - want.w) / want.w, Math.abs(hh - want.h) / want.h);
      if (off > .3) return { title: name + ' is the wrong size', detail: 'Its box is ' + w + ' wide x ' + hh + ' tall, but the plan says ' + want.w + ' wide x ' + want.h + ' tall (' + Math.round(off * 100) + '% off). Next to people it will look ' + (hh < want.h ? 'too small' : 'too big') + '.', fix: fixFor(want.w, want.h) };
      return null;
    }
    if (/sky|far/.test(band || '')) return null;
    var st = txt.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|single)[ -](?:storey|story|floor)/);
    var rules = [
      [/\bdoor/, 'h', 340, 490, 'a door is about 400 high'], [/\b(car|taxi|sedan)\b/, 'w', 760, 990, 'a car is about 860 long'], [/street ?lamp|lamp ?post/, 'h', 620, 910, 'a street lamp is about 760 high'],
      [/\btree\b/, 'h', 850, 2300, 'a tree is 1100 to 1900 high'], [/\b(boat|canoe)\b/, 'w', 340, 760, 'a small boat is 420 to 630 wide'], [/\b(bench)\b/, 'h', 130, 210, 'a bench is about 170 high'], [/\b(bed)\b/, 'h', 80, 210, 'a bed is about 110 high'], [/\b(rickshaw|tuk ?tuk)\b/, 'h', 290, 420, 'a rickshaw is about 340 high']];
    if (st) { var n = NUMW[st[1]] || +st[1]; rules.unshift([/./, 'h', n * 570 * .75, n * 570 * 1.3, 'a ' + n + '-storey building is about ' + n * 570 + ' high']) }
    for (var i = 0; i < rules.length; i++) { var r = rules[i]; if (!r[0].test(txt)) continue; var v = r[1] === 'h' ? hh : w; if (v < r[2] || v > r[3]) { var target = Math.round((r[2] + r[3]) / 2); return { title: name + ' looks the wrong size', detail: 'Its box is ' + w + ' wide x ' + hh + ' tall; ' + r[4] + ' (section 4).', fix: r[1] === 'h' ? fixFor(Math.round(w * target / hh), target) : fixFor(target, Math.round(hh * target / w)) } } }
    return null;
  };
  /* the plan's state sheet: every person has state and arcs, names come from the lists, each change has a real part, word and reason */
  R.stateProblems = function (j, want) {
    var out = [], CONDS = J().CONDS, FEELS = J().FEELS, people = [];
    (j.parts || []).forEach(function (p) { (p && p.cast || []).forEach(function (n) { if (people.indexOf(n) < 0) people.push(n) }) });
    if (!people.length) return out;
    var st = j.state || {}, arcs = j.arcs || {};
    if (!j.state) out.push(warn('no-state', 'The plan has no state sheet', 'Without "state" the scenes cannot keep injuries, dirt, wet clothes and changes of clothes the same from part to part.', 'Add "state" with every person, their start and every change (part, word, set, why).'));
    if (!j.arcs) out.push(warn('no-arcs', 'The plan has no feelings arcs', 'Without "arcs" faces may not match the moment or may jump between feelings.', 'Add "arcs" with every person: the feeling at the start of each part they are in and where it changes.'));
    var noSt = people.filter(function (n) { return j.state && !st[n] }), noArc = people.filter(function (n) { return j.arcs && !arcs[n] });
    if (noSt.length) out.push(warn('state-missing-person', 'No state for ' + noSt.join(', '), 'Every person who appears needs a line in "state", even if nothing happens to them ({"start": {}, "changes": []}).', 'Add ' + noSt.join(', ') + ' to "state".'));
    if (noArc.length) out.push(warn('arcs-missing-person', 'No feelings arc for ' + noArc.join(', '), 'Every person who appears needs a feelings arc.', 'Add ' + noArc.join(', ') + ' to "arcs".'));
    var badC = [], badP = [], noWhy = [], badF = [];
    Object.keys(st).forEach(function (n) { var e = st[n] || {};
      Object.keys(e.start || {}).forEach(function (k) { if (CONDS.indexOf(k) < 0) badC.push(n + ': ' + k) });
      (e.changes || []).forEach(function (c) { Object.keys(c.set || {}).forEach(function (k) { if (CONDS.indexOf(k) < 0) badC.push(n + ': ' + k) });
        if (want.indexOf(c.part) < 0) badP.push(n + ' (part ' + c.part + ')'); if (!c.why) noWhy.push(n + ' in part ' + c.part) }) });
    Object.keys(arcs).forEach(function (n) { (arcs[n] || []).forEach(function (k) { if (FEELS.indexOf(k.feel) < 0) badF.push(n + ': ' + k.feel); if (want.indexOf(k.part) < 0) badP.push(n + ' (part ' + k.part + ')') }) });
    if (badC.length) out.push(warn('state-bad-condition', 'Unknown conditions: ' + badC.slice(0, 6).join(', '), 'The engine only draws these conditions: ' + CONDS.join(', ') + '.', 'Use only those names (for example "dirt" for mud, "pale" for shock).'));
    if (badF.length) out.push(warn('arcs-bad-feeling', 'Unknown feelings: ' + badF.slice(0, 6).join(', '), 'The engine only has these feelings: ' + FEELS.join(', ') + '.', 'Pick the nearest feeling from that list.'));
    if (badP.length) out.push(warn('state-bad-part', 'Changes in parts that do not exist: ' + badP.slice(0, 6).join(', '), 'The video has parts ' + want.join(', ') + '.', 'Use only those part numbers.'));
    if (noWhy.length) out.push(warn('state-no-why', 'Changes without a reason: ' + noWhy.slice(0, 6).join(', '), 'Every change needs its cause ("why"), so the scene shows it happening.', 'Add "why" to each change.'));
    return out;
  };
  /* a built part against its state sheet row: COND must hold what happened before it, and the arcs' feelings must be used */
  R.sceneStateProblems = function (P, job, code, info) {
    var out = [], plan = GK().plan(P); if (!plan.state) return out;
    var row = J().stateRow(plan, job.part), me = ((info && info.built) || []).filter(function (b) { return b.id === job.part })[0], got = me && me.COND;
    var who = Object.keys(row.cond).filter(function (n) { var c = Object.assign({}, row.cond[n]); delete c.outfit; return Object.keys(c).length });
    if (!who.length) return out;
    if (!got || !Object.keys(got).length) { out.push(err('no-cond', 'COND is missing in PART({...})', 'By part ' + job.part + ' the state sheet says: ' + who.map(function (n) { return n + ' ' + JSON.stringify(row.cond[n]) }).join('; ') + '. Without COND the people are drawn clean, as if nothing had happened.', 'Add COND:' + J().condLiteral(row) + ' inside PART({...}) and draw everyone with X.who(state, size, view, P.COND.name).')); return out }
    var miss = [];
    who.forEach(function (n) { var want = row.cond[n], have = got[n] || {};
      Object.keys(want).forEach(function (k) { if (k === 'outfit') return; var w = want[k], h = have[k];
        if (k === 'bandage') { var wl = [].concat(w), hl = [].concat(h || []); wl.forEach(function (b) { if (hl.indexOf(b) < 0) miss.push(n + ' bandage ' + b) }) }
        else if (!h) miss.push(n + ' ' + k) }) });
    if (miss.length) out.push(warn('state-mismatch', 'Part ' + job.part + ' forgets what happened: ' + miss.join(', '), 'The state sheet says these are true at the start of part ' + job.part + ', but COND in the part does not have them.', 'Use COND:' + J().condLiteral(row) + ' in PART({...}).'));
    var noFeel = [];
    Object.keys(row.feel).forEach(function (n) { var f = row.feel[n]; [f.start].concat(f.during.map(function (d) { return d.feel })).forEach(function (x) { if (x && code.indexOf("'" + x + "'") < 0 && code.indexOf('"' + x + '"') < 0 && noFeel.indexOf(n + ' ' + x) < 0) noFeel.push(n + ' ' + x) }) });
    if (noFeel.length) out.push(warn('arc-missing', 'Feelings from the arcs are not used: ' + noFeel.join(', '), 'The plan says these feelings belong in part ' + job.part + ', but the code never names them.', 'Follow the arcs with feelAt(t, [[0,\'feeling\'], [T(\'word\'),\'next feeling\']]).'));
    return out;
  };
  /* special shots (section 30): names from the list, real parts, not too many; a scene uses the call its plan asks for */
  R.shotPlanProblems = function (j, want, plan) {
    var out = [], S = J().SHOTS, L = j.shots; if (!L) return out;
    if (!Array.isArray(L)) { out.push(warn('shots-shape', '"shots" is not a list', 'It must be a list like [{"part": 2, "word": "inside", "shot": "dive", "what": "..."}].', 'Write "shots" as a list, or [] when nothing calls for one.')); return out }
    var bad = L.filter(function (x) { return !x || !S[x.shot] }).map(function (x) { return x && x.shot || '?' }), badP = L.filter(function (x) { return x && S[x.shot] && want.indexOf(+x.part) < 0 }).map(function (x) { return x.part });
    if (bad.length) out.push(warn('shots-unknown', 'Unknown special shots: ' + bad.join(', '), 'The engine has these special shots: ' + Object.keys(S).join(', ') + ' (section 30).', 'Use only those names.'));
    if (badP.length) out.push(warn('shots-bad-part', 'Special shots in parts that do not exist: ' + badP.join(', '), 'The video has parts ' + want.join(', ') + '.', 'Use only those part numbers.'));
    var len = (plan && plan.audio && plan.audio.length) || 0, max = Math.max(1, Math.ceil(len / 15)), n = L.filter(function (x) { return x && S[x.shot] && S[x.shot][2] === 'big' }).length;
    if (len && n > max) out.push(warn('shots-many', plural(n, 'zoom, frame or going-under shot') + ' for a ' + Math.round(len) + ' s video', 'At most one of these every 15 seconds (' + max + ' here), or they stop feeling special.', 'Keep the ' + max + ' strongest.'));
    return out;
  };
  R.shotProblems = function (P, id, code) {
    return J().shotsFor(GK().plan(P), id).filter(function (s) { return code.indexOf(J().SHOTS[s.shot][0] + '(') < 0 }).map(function (s) {
      return warn('shot-missing', 'The planned ' + s.shot + ' shot is missing', 'The plan asks for ' + J().SHOTS[s.shot][1].split(':')[0].toLowerCase() + (s.word ? ' at "' + s.word + '"' : '') + (s.what ? ' (' + s.what + ')' : '') + ', but the code never calls ' + J().SHOTS[s.shot][0] + '.', 'Add ' + J().SHOTS[s.shot][0] + '(...) ' + (s.word ? 'starting at T(\'' + s.word + '\')' : '') + ' (rulebook section 30).');
    });
  };
  /* true when every line of a reply without ``` marks is code (the first line is the REPLY line, a comment or code) */
  function looksLikeCode(text) {
    var L = String(text || '').split('\n').map(function (x) { return x.trim() }).filter(Boolean);
    if (!L.length) return false;
    var prose = L.filter(function (x) { return /^[A-Z][a-z]+(\s+[a-z'’]+){4,}[.!?:]?$/.test(x) && !/[;{}()=<>]/.test(x) });
    return prose.length === 0 && /^(<!--|\/\/|\/\*|<script|ASSET\(|CAST|PART\(|OUTFIT|const |let |var |function |\{)/.test(L[0]);
  }
  /* ---------- 3. the message to send back ---------- */
  R.fixMessage = function (P, job, problems, ver) {
    var JJ = J(), errs = problems.filter(function (p) { return p.level === 'error' }), warns = problems.filter(function (p) { return p.level === 'warn' }), n = 0;
    function line(p) { return (++n) + '. ' + p.title + '. ' + p.detail + '\n   FIX: ' + p.fix }
    var t = 'Your last reply for ' + JJ.tag(P, job) + ' (' + JJ.kindName(job).toUpperCase() + ' · ' + job.title + ') ' + (errs.length ? 'could not be used' : 'was used, but it did not follow the format') + '. Fix every problem below and answer again.\n\n';
    if (errs.length) t += 'PROBLEMS\n' + errs.map(line).join('\n') + '\n\n';
    if (warns.length) t += (errs.length ? 'ALSO' : 'NOTES') + '\n' + warns.map(line).join('\n') + '\n\n';
    var plan = job.kind === 'plan', lang = { plan: 'json', assets: 'js', cast: 'js', scene: 'html' }[job.kind];
    return t + 'Answer the same strict way as the prompt said: ONE ```' + lang + ' code block and NOTHING else; ' + (plan ? 'the first key of the JSON exactly ' : 'the first line inside it exactly ') + JJ.replyLine(P, job, ver || null) + '; complete code, never "..." or "same as before". No apology, no explanation, no list of checks.';
  };

  /* ---------- what to do next, in order ---------- */
  R.steps = function (P, job, problems, res) {
    var me = window.JOBS.tag(P, job), errs = problems.some(function (p) { return p.level === 'error' });
    if (res && res.redirect) return ['Press "Save it in ' + window.JOBS.tag(P, res.redirect) + '" to put this reply where it belongs.', 'Then paste the reply for ' + me + ' here (open its own Sonnet chat, or press "Copy prompt again" and start a new chat).'];
    if (problems.some(function (p) { return p.id === 'unknown-prompt' })) return ['Press "Copy prompt again" for ' + me + '.', 'Paste it in a NEW Sonnet chat together with the project file ' + window.JOBS.stamp(P) + '.', 'Paste the new reply here and press "Check and save".'];
    if (errs) return ['Press "Copy fix message".', 'Go to the Sonnet chat for ' + me + ' (the same chat: it still has the file and the prompt) and paste the message.', 'Copy the new reply, paste it here and press "Check and save".', 'Still failing after two tries? Press "Copy prompt again" and start a new chat, or press "Copy all details" and show them to me.'];
    return ['The reply was saved and is in use. Nothing is required.', 'To clean up the notes, press "Copy fix message" and send it in the same chat, then paste the new reply.'];
  };

  /* ---------- 4. everything as plain text ---------- */
  R.report = function (P, job, res, problems, extra) {
    var JJ = J(), t = 'REPLY CHECK · ' + JJ.label(P, job) + ' · ' + JJ.kindName(job) + ' · file ' + JJ.stamp(P) + ' · ' + new Date().toLocaleString('en-GB') + '\n\nWHAT THE APP FOUND\n' + (res && res.found ? res.found.map(function (x) { return '- ' + x }).join('\n') : '- (nothing)') + '\n\nPROBLEMS (' + problems.length + ')\n';
    t += problems.length ? problems.map(function (p, i) { return (i + 1) + '. [' + (p.level === 'error' ? 'ERROR' : 'note') + '] ' + p.title + '\n   ' + p.detail + '\n   Fix: ' + p.fix }).join('\n') : 'None.';
    t += '\n\nNEXT STEPS\n' + R.steps(P, job, problems, res).map(function (s, i) { return (i + 1) + '. ' + s }).join('\n');
    return t + (extra ? '\n\n' + extra : '');
  };
  R.counts = function (problems) { var e = problems.filter(function (p) { return p.level === 'error' }).length; return { errors: e, notes: problems.length - e } };
})();
