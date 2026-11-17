/* JOBS — the work each Sonnet chat does, its prompt, the two versions (A and B) and the pick.
   Order (rulebook section 16): 1 plan -> 2 assets and people (grouped by how hard they are) -> 3 one scene per part.
   Every job keeps two versions. A job is done when one version is picked; only picked versions go into the file. */
(function () {
  'use strict';
  var J = {}; window.JOBS = J;

  /* how many things one chat gets: hard ones alone, simple ones bunched (at most 4) */
  J.batch = function (items, cap) {
    cap = cap || 4;
    var hard = items.filter(function (x) { return x.level >= 3 }), mid = items.filter(function (x) { return x.level === 2 }), easy = items.filter(function (x) { return !(x.level >= 2) });
    var out = [];
    hard.forEach(function (x) { out.push([x]) });
    for (var i = 0; i < mid.length; i += 2) out.push(mid.slice(i, i + 2));
    for (i = 0; i < easy.length; i += cap) out.push(easy.slice(i, i + cap));
    // a lonely simple thing joins a medium group so no chat is wasted on one tiny drawing
    var lone = out.filter(function (g) { return g.length === 1 && !(g[0].level >= 2) });
    lone.forEach(function (g) { var host = out.filter(function (h) { return h !== g && h.length < 3 && !(h[0].level >= 3) })[0]; if (host) { host.push(g[0]); out.splice(out.indexOf(g), 1) } });
    return out;
  };
  function lvl(info, n) { var v = info && info[n] && +info[n].level; return v >= 1 && v <= 3 ? v : 2 }

  /* the list of jobs for a project, rebuilt whenever the plan changes; old versions are kept when the job did not change */
  J.build = function (P, have) {
    have = have || { assets: [], cast: [] };
    var old = P.jobs || {}, jobs = {}, order = [];
    function keep(id, kind, extra) {
      var o = old[id], same = o && JSON.stringify(o.items || null) === JSON.stringify(extra.items || null);
      jobs[id] = same ? Object.assign(o, extra) : Object.assign({ id: id, kind: kind, A: null, B: null, pick: null, critic: null }, extra);
      order.push(id);
    }
    keep('plan', 'plan', { title: 'The plan', items: null });
    var plan = P.plan;
    if (plan && Array.isArray(plan.parts)) {
      var aNeed = {}, cNeed = {};
      plan.parts.forEach(function (p) { (p.assets || []).forEach(function (n) { aNeed[n] = 1 }); (p.cast || []).forEach(function (n) { cNeed[n] = 1 }) });
      var aList = Object.keys(aNeed).filter(function (n) { return have.assets.indexOf(n) < 0 }).map(function (n) { return { name: n, level: lvl(plan.assets_info, n), note: (plan.assets_info && plan.assets_info[n] && plan.assets_info[n].note) || '' } });
      var cList = Object.keys(cNeed).filter(function (n) { return have.cast.indexOf(n) < 0 }).map(function (n) { return { name: n, level: lvl(plan.cast_info, n) >= 2 ? 3 : 2, note: (plan.cast_info && plan.cast_info[n] && plan.cast_info[n].note) || (plan.continuity && plan.continuity[n]) || '' } });
      J.batch(aList, 4).forEach(function (g, i) { keep('assets-' + g.map(function (x) { return x.name }).join('+'), 'assets', { title: 'Assets: ' + g.map(function (x) { return x.name }).join(', '), items: g, n: i + 1 }) });
      // people: one person per chat when the look is new and hard, two when simpler
      var cg = []; cList.forEach(function (x) { var last = cg[cg.length - 1]; if (last && last.length < 2 && x.level < 3 && last[0].level < 3) last.push(x); else cg.push([x]) });
      cg.forEach(function (g, i) { keep('cast-' + g.map(function (x) { return x.name }).join('+'), 'cast', { title: 'People: ' + g.map(function (x) { return x.name }).join(', '), items: g, n: i + 1 }) });
      plan.parts.forEach(function (p) { keep('scene-' + p.id, 'scene', { title: 'Part ' + p.id + (p.title ? ': ' + p.title : ''), part: p.id, items: [p.id, p.start, p.end] }) });
    }
    P.jobs = jobs; P.jobOrder = order;
    return order.map(function (id) { return jobs[id] });
  };
  J.list = function (P) { return (P.jobOrder || []).map(function (id) { return P.jobs[id] }).filter(Boolean) };
  J.picked = function (job) { return job && job.pick && job[job.pick] && !job[job.pick].error ? job[job.pick] : null };
  J.state = function (job) {
    var a = job.A && !job.A.error, b = job.B && !job.B.error;
    if (J.picked(job)) return { key: 'done', text: 'Picked ' + job.pick, cls: 't-ok' };
    if (a && b) return { key: 'pick', text: 'Ready to pick', cls: 't-info' };
    if (a || b) return { key: 'one', text: 'Waiting for the second version', cls: 't-warn' };
    return { key: 'todo', text: 'Not started', cls: 'muted' };
  };
  /* what must be finished before a job can start (rulebook: plan, then assets and people, then scenes) */
  J.blockedBy = function (P, job) {
    var L = J.list(P);
    if (job.kind === 'plan') return null;
    if (!J.picked(P.jobs.plan)) return 'Pick the plan first.';
    if (job.kind === 'scene') { var open = L.filter(function (j) { return (j.kind === 'assets' || j.kind === 'cast') && !J.picked(j) }); if (open.length) return 'Finish the assets and people first (' + open.length + ' left).' }
    return null;
  };
  /* the blocks that go into the file: picked versions only */
  J.blocks = function (P, upTo) {
    var out = { assets: [], cast: [], parts: [] };
    J.list(P).forEach(function (j) {
      var v = J.picked(j); if (!v || j.kind === 'plan') return;
      if (upTo && upTo(j) === false) return;
      if (j.kind === 'assets') out.assets.push({ job: j.id, code: v.code, full: !!v.full });
      if (j.kind === 'cast') out.cast.push({ job: j.id, code: v.code, full: !!v.full });
      if (j.kind === 'scene') out.parts.push({ id: j.part, code: v.code });
    });
    (P.improved || []).forEach(function (b) { var k = out.parts.findIndex(function (x) { return x.id === b.id }); if (k >= 0) out.parts[k] = b });
    return out;
  };

  /* ---------- prompts ---------- */
  var REPLY_TWO = '\n\nMAKE TWO VERSIONS. Give two different, complete answers: write a line "=== VERSION A ===" before the first and "=== VERSION B ===" before the second. Make them really different in the creative choices (framing, staging, shapes), both following every rule.';
  function head(mode) { return 'MODE: ' + mode + '\nThe attached file is my Gilded Kasumi project file (rulebook, plan, engine, library, parts and player in one file). Read the rulebook inside it first and obey it.\n' }
  var EXAMPLE = 'The block marked data-example-part="1" is the worked example (Under the Ice), switched off. It is NOT part of this video; copy its shape only. Its people and assets are in the library and may be reused when they fit.\n';
  J.prompt = function (P, job, two) {
    var plan = window.GK.plan(P), txt = '';
    if (job.kind === 'plan') {
      txt = head('PROJECT') + EXAMPLE +
        'The app has ALREADY done the audio work with Whisper and my script. These are final, do not change them: "stage", "audio" (with audio.words, the exact time of every word) and every part\'s "id", "start", "end" and "text". The parts were cut at long pauses after sentences (section 16).\n\n' +
        'Fill in everything else for EVERY part (sections 16, 20, 23, 24 and 25): title, place, time, moods, cast, assets, in, out, starts_on, ends_on, job, beats. Fill "continuity". ' + (plan.audio.length > 120 ? 'This video is over 2 minutes, so also fill "chapters" and "places" (section 20). ' : '') + '\n' +
        'Use names already in CAST and the asset library when they fit. Give the same thing the same name in every part.\n' +
        'Also add two lists the app uses to share the drawing work between chats:\n' +
        '"assets_info": {"<name>": {"note": "what it is, its size and look in one line", "band": "far / middle / subject / foreground", "level": 1 simple, 2 medium, 3 hard}} for every NEW asset,\n' +
        '"cast_info": {"<name>": {"note": "who, age, clothes, hair, colours", "level": 1 to 3}} for every NEW person.\n\n' +
        'Reply in the shape of section 27. For CODE give ONLY the finished project plan JSON, in one ```json code block. Do not return the file.\n\n' +
        'FULL SCRIPT:\n' + (P.script || '').trim();
    } else if (job.kind === 'assets') {
      txt = head('ASSETS') + EXAMPLE +
        'Make ONLY these ' + job.items.length + ' asset' + (job.items.length > 1 ? 's' : '') + ' for this video. Follow section 17 (and 5) and the project plan in the file:\n' +
        job.items.map(function (x) { return '- ' + x.name + (x.note ? ': ' + x.note : '') + ' (level ' + x.level + ')' }).join('\n') + '\n\n' +
        'Other chats are making the other assets at the same time, so do not make anything else and do not change anything that exists.\n' +
        'Reply in the shape of section 27. For CODE give ONLY the ASSET(...) calls you added (and any small helper they need), in one ```js code block. Do not return the file.';
    } else if (job.kind === 'cast') {
      txt = head('CAST') + EXAMPLE +
        'Add ONLY these ' + job.items.length + ' ' + (job.items.length > 1 ? 'people' : 'person') + ' for this video. Follow section 18 (and 6, 24) and the plan and continuity notes in the file. Every new look needs side, front and back:\n' +
        job.items.map(function (x) { return '- ' + x.name + (x.note ? ': ' + x.note : '') }).join('\n') + '\n\n' +
        'Other chats are making the other people at the same time, so do not add anyone else and do not change anything that exists.\n' +
        'Reply in the shape of section 27. For CODE give ONLY the lines you added to the cast block (CAST entries, HAIR() and OUTFIT() looks), in one ```js code block. Do not return the file.';
    } else if (job.kind === 'scene') {
      var p = plan.parts.filter(function (x) { return x.id === job.part })[0] || {}, prev = plan.parts.filter(function (x) { return x.id === job.part - 1 })[0], next = plan.parts.filter(function (x) { return x.id === job.part + 1 })[0];
      txt = head('SCENE') + 'PART: ' + job.part + '\n' + EXAMPLE +
        'Build only part ' + job.part + ' of the project plan in this file (' + plan.parts.length + ' parts). Follow sections 14, 15 and 16. Copy AUDIO_START (' + p.start + '), AUDIO_END (' + p.end + '), IN ("' + p.in + '"), OUT ("' + p.out + '") and the words from the plan. The word times are in audio.words: use them for SEG (timing Level A).\n\n' +
        'SCRIPT FOR THIS PART: "' + (p.text || '') + '"\n' +
        (prev ? 'The part before ends on: ' + (prev.ends_on || '(see the plan)') + '. Start on a different picture.\n' : 'This is the first part: open on the strongest picture within 2 seconds.\n') +
        (next ? 'The part after starts on: ' + (next.starts_on || '(see the plan)') + '.\n' : 'This is the last part.\n') +
        '\nOther chats build the other parts at the same time with the same file, so never build any other part.\n' +
        'Reply in the shape of section 27 (start with the SYNC line). For CODE give ONLY the new <script data-part="' + job.part + '"> … </script> block with its tags, in one ```html code block. Do not return the file.';
    }
    return txt + (two ? REPLY_TWO : '');
  };
  J.improvePrompt = function (P, partId, t, note) {
    return head('IMPROVE') + 'PART: ' + partId + '\n' + EXAMPLE +
      'Follow section 19. Keep AUDIO_START, AUDIO_END, IN, OUT and the words exactly as they are.\n' +
      'What I want better: at ' + t.toFixed(1) + ' s into part ' + partId + ' (clock time of the part): ' + (note || 'a full review of this moment') + '\n\n' +
      'Reply in the shape of section 27 (start with the SYNC line). For CODE give ONLY the improved <script data-part="' + partId + '"> … </script> block with its tags, in one ```html code block.';
  };

  /* ---------- the critic ---------- */
  J.criticBrief = function (P, job) {
    var plan = window.GK.plan(P), what = '';
    if (job.kind === 'plan') what = 'Two plans (JSON) for the same narrated video. Judge: does every part show what its words say, literally? Is the story shape strong (hook in the first 2 seconds, stakes, turn, payoff)? Are places few and well used, joins logical, continuity complete, names reused? Is the light logical for time and place?';
    if (job.kind === 'assets') what = 'Two sets of drawings of the same assets (left: A, right: B) in the Gilded Kasumi style: Japanese woodblock print rebuilt as an Art Deco paper diorama: flat cut-paper shapes, thin gold edges, limited palette, no gradients except the approved ones, clear silhouettes. Judge each asset: is it clearly the thing named, readable at small size, in the style, the right detail for its band? The wanted assets: ' + job.items.map(function (x) { return x.name + (x.note ? ' (' + x.note + ')' : '') }).join('; ') + '.';
    if (job.kind === 'cast') what = 'Two versions of the same people, each shown from the side, front and back (left: A, right: B), in the Gilded Kasumi paper style. Judge: does each person match the description (age, gender, skin, hair, clothes), are the three views the same person, is the look clean and in the style? The people: ' + job.items.map(function (x) { return x.name + (x.note ? ' (' + x.note + ')' : '') }).join('; ') + '.';
    if (job.kind === 'scene') {
      var p = plan.parts.filter(function (x) { return x.id === job.part })[0] || {};
      what = 'Two versions of part ' + job.part + ' of a narrated vertical video, shown as frames over time (top row: A, bottom row: B; each frame labelled with its time and the words heard then). The words of this part: "' + (p.text || '') + '". Judge: does each frame show literally what is being said at that moment? Is the camera alive and cinematic but comfortable? Is the light logical and does it tell the story? Is everything readable, nothing cut off, captions clear of faces? Does it flow from the part before and into the part after (shown at the ends when present)?';
    }
    return what;
  };
  J.criticAsk = function (P, job, facts) {
    return 'You are the art director of a YouTube channel that makes narrated videos in one fixed style, Gilded Kasumi. Pick the better of two versions, A or B.\n\n' + J.criticBrief(P, job) + '\n\n' +
      (facts ? 'Automatic checks:\n' + facts + '\n\n' : '') +
      'A version that fails automatic checks or does not draw loses unless both fail. Be strict and concrete.\n' +
      'Reply with JSON only: {"winner": "A" or "B", "score_a": 0-10, "score_b": 0-10, "why": "two or three short sentences", "fix_for_winner": "the one thing to improve next, or empty"}';
  };
  J.parseCritic = function (text) {
    text = String(text || ''); var j = null, a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a >= 0 && b > a) { try { j = JSON.parse(text.slice(a, b + 1)) } catch (e) { } }
    if (!j) { var m = /winner\W{0,6}\b([AB])\b/i.exec(text) || /\b(?:pick|choose|use)\s+(?:version\s+)?([AB])\b/i.exec(text); if (m) j = { winner: m[1].toUpperCase(), why: text.slice(0, 400) } }
    if (!j || !/^[AB]$/i.test(String(j.winner || ''))) return null;
    j.winner = String(j.winner).toUpperCase(); return j;
  };
})();
