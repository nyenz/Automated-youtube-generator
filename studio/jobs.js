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
      var aList = Object.keys(aNeed).filter(function (n) { return have.assets.indexOf(n) < 0 }).map(function (n) { return { name: n, level: lvl(plan.assets_info, n), note: (function (a) { return a ? [a.note, a.story ? 'story detail: ' + a.story : '', a.moves ? 'moves: ' + a.moves : ''].filter(Boolean).join(' · ') : '' })(plan.assets_info && plan.assets_info[n]) } });
      var cList = Object.keys(cNeed).filter(function (n) { return have.cast.indexOf(n) < 0 }).map(function (n) { return { name: n, level: lvl(plan.cast_info, n) >= 2 ? 3 : 2, note: J.wardrobe(plan.cast_info && plan.cast_info[n]) || (plan.continuity && plan.continuity[n]) || '' } });
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

  /* ---------- modes, numbers and names ----------
     single = one prompt, one reply (the default).  two = two chats per job, compared.  one = one chat that returns two versions, compared. */
  J.mode = function (P) { return P && (P.abMode === 'two' || P.abMode === 'one') ? P.abMode : 'single' };
  function pad(n) { return (n < 10 ? '0' : '') + n }
  J.no = function (P, job) { return (P.jobOrder || []).indexOf(job.id) + 1 };
  J.total = function (P) { return (P.jobOrder || []).length };
  J.tag = function (P, job) { return job.tagName || 'P' + pad(J.no(P, job)) };                       // P05
  var KIND = { plan: 'Plan', assets: 'Assets', cast: 'People', scene: 'Scene' };
  J.kindName = function (job) { return KIND[job.kind] || job.kind };
  J.label = function (P, job) { return J.tag(P, job) + ' \u00B7 ' + job.title };    // P05 · Part 2: Black ice
  J.group = function (job) { return job.kind === 'plan' ? 'plan' : job.kind === 'scene' ? 'scene' : 'make' };
  /* the project file changes only when the plan, assets or people are picked: F00, F01, F02 ... The number is in the file name and in every prompt. */
  J.stamp = function (P) { var n = J.list(P).filter(function (j) { return j.kind !== 'scene' && J.picked(j) }).length; return 'F' + pad(n) };
  J.fileName = function (P) { var n = String(P.name || 'video').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'video'; return n + ' - project ' + J.stamp(P) + '.html' };
  /* the line the model must write first, so the app knows which prompt the reply belongs to */
  J.replyLine = function (P, job, ver) {
    if (job.replyOverride) return job.replyOverride;
    var id = J.tag(P, job) + ' ' + job.id + (ver ? ' ' + ver : '');
    if (job.kind === 'plan') return '"REPLY": "' + id + '"';
    if (job.kind === 'scene') return '<!-- REPLY ' + id + ' -->';
    return '// REPLY ' + id;
  };

  /* one word for where a job stands. In single mode a reply that passes its checks is used straight away. */
  J.state = function (job, P) {
    var single = P ? J.mode(P) === 'single' : false, a = job.A && !job.A.error, b = job.B && !job.B.error;
    if (J.picked(job)) { var pc = job[job.pick].check; if (pc && !pc.ok) return { key: 'done', text: 'In use, ' + (single ? 'has problems' : 'version ' + job.pick + ' has problems'), cls: 't-warn' }; return { key: 'done', text: single ? 'Done' : 'Picked ' + job.pick, cls: 't-ok' } }
    if (a && b) return { key: 'pick', text: 'Ready to pick', cls: 't-info' };
    if (single && (a || b)) return { key: 'fix', text: 'Needs a fix', cls: 't-bad' };
    if (a || b) return { key: 'one', text: 'Waiting for the second version', cls: 't-warn' };
    if (job.fail) return { key: 'fail', text: 'Last reply not saved', cls: 't-bad' };
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

  /* ---------- prompts ----------
     Every prompt has the same four parts, always in this order, so a model (and you) can find things:
       1. a title line with its number         PROMPT P05 of 16 · SCENE · PART 2
       2. the task                              what to make, from the plan
       3. the output contract                   the exact shape of the reply (code only, first line = REPLY tag)
       4. the quality bar                       what to check silently before answering
     The rulebook inside the attached file does the teaching; the prompt only points at it, to save tokens. */
  var LANG = { plan: 'json', assets: 'js', cast: 'js', scene: 'html' };
  var EXAMPLE = 'The block marked data-example-part="1" is the worked example (Under the Ice), switched off. It is NOT part of this video: copy its shape only. Its people and assets are in the library and may be reused when they fit.';
  function titleLine(P, job, mode) {
    var t = 'PROMPT ' + J.tag(P, job) + ' of ' + pad(J.total(P)) + ' · ' + J.kindName(job).toUpperCase();
    if (job.kind === 'scene') t += ' · PART ' + job.part + ' of ' + window.GK.plan(P).parts.length;
    if (job.kind === 'assets' || job.kind === 'cast') t += ' · ' + job.items.length + ' ' + (job.kind === 'assets' ? 'asset' : 'person');
    return t + ' · ' + ({ single: 'ONE PROMPT', two: 'COMPARE, CHAT 1 OF 2', one: 'COMPARE, TWO VERSIONS' })[mode];
  }
  function fileLine(P) {
    return 'FILE: attach "' + J.fileName(P) + '" (button "Project file for Sonnet"). The number ' + J.stamp(P) + ' must match; if your file has another number, download it again. It holds my Gilded Kasumi rulebook, plan, engine, library, parts and player. Read the rulebook first and obey it.';
  }
  function contract(P, job, mode, extra) {
    var lang = LANG[job.kind], n = 0, L = [], one = mode === 'one', tag = J.replyLine(P, job, null), none = job.kind === 'plan';
    function add(s) { L.push((++n) + '. ' + s) }
    if (one) {
      add('Reply with exactly TWO ```' + lang + ' code blocks and nothing else. The line "=== VERSION A ===" comes before the first block and "=== VERSION B ===" before the second. No other words. Make the two really different in their creative choices (framing, staging, shapes); both must obey every rule.');
      add((none ? 'The first key of the JSON object in the first block is exactly: ' : 'The first line inside the first block is exactly: ') + J.replyLine(P, job, 'A') + (none ? ' and in the second block: ' : ' and inside the second: ') + J.replyLine(P, job, 'B'));
    } else {
      add('Reply with ONE ```' + lang + ' code block and NOTHING else. No words before it or after it: no greeting, no title, no summary, no "what I made", no checks list, no questions. This replaces the reply shape of section 27; it saves tokens.');
      add((none ? 'The first key of the JSON object is exactly: ' : 'The first line inside the block is exactly: ') + tag);
    }
    (extra || []).forEach(add);
    add(none ? 'Valid JSON only: double quotes, no comments, no trailing commas, no "...".' : 'Complete code only. Never write "...", "same as before", "rest unchanged" or any shortcut. Notes (assumptions, new things, limits) go as // comment lines at the top of the code, 3 lines at most.');
    add('Do not return the file. Do not change, rename or "tidy" anything that exists.');
    add('Answer in the chat only: no artifact, no file, no download, no tool.');
    add('Check silently before you answer. Never print the checks. If a check fails, fix your answer first.');
    add('If something is unclear, take the simplest choice that obeys the plan. Never ask a question.');
    return 'OUTPUT CONTRACT (an app reads your reply by machine, so the format is strict):\n' + L.join('\n');
  }
  /* one line that says how a person looks: their outfit, their own colour and the detail that makes them easy to spot */
  J.wardrobe = function (c) {
    if (!c) return '';
    return [c.note, c.role ? 'role: ' + c.role : '', c.outfit ? 'outfit: ' + c.outfit : '', c.signature ? 'signature colour: ' + c.signature : '', c.accent ? 'easy-to-spot detail: ' + c.accent : '', c.silhouette ? 'silhouette: ' + c.silhouette : ''].filter(Boolean).join(' · ');
  };
  function wardrobeTable(plan) {
    var ci = plan.cast_info || {}, names = Object.keys(ci);
    if (!names.length) return '';
    return 'WARDROBE OF EVERY NEW PERSON IN THIS VIDEO (from the plan; the people already in CAST keep their looks):\n' + names.map(function (n) { return '- ' + n + ': ' + J.wardrobe(ci[n]) }).join('\n') + '\n';
  }
  var WARDROBE_RULES = 'WARDROBE RULES (people must be easy to follow):\n' +
    '- Each person wears clothes that fit their job, age, place, weather and era, and that make sense in the story (a paramedic in a reflective rescue jacket, a nurse in scrubs, a child in a winter parka). The outfit TYPE tells who they are before they speak.\n' +
    '- Each person has their own signature colour for the main garment, taken from the palette (vermilion, indigo, cream, haze blue, pine green, peach, mist white, deep indigo...). Two people who appear in the same part never share it, and it must differ from the people already in CAST.\n' +
    '- Each person has one easy-to-spot detail (a scarf, a cap, a bag, glasses, a badge, a stethoscope, reflective stripes) and a different silhouette (coat length, hat or hair shape, height).\n' +
    '- The signature colour stands out against the places the person is seen in (no navy clothes on a night-navy scene, no cream clothes on a cream wall).\n' +
    '- A person keeps the same outfit in every part unless the story changes it; say so in "continuity".\n';
  var PLAN_SHAPE = '{"REPLY": "<the id from rule 2>",\n "continuity": {"<person or thing>": "what must stay the same in every part"},\n "assets_info": {"<NEW asset>": {"note": "what it is, size and look, one line", "story": "the detail it must show for this story (e.g. the screen reads 7.0 C)", "moves": "the part that moves or glows, or none", "band": "far | middle | subject | foreground", "level": 1 or 2 or 3}},\n "cast_info": {"<NEW person>": {"note": "who, age, hair, skin", "role": "their job or part in the story", "outfit": "the clothes TYPE that fits role, place, weather and era", "signature": "palette colour of the main garment, unique to this person", "accent": "one easy-to-spot detail", "silhouette": "coat length, hat or hair shape, height", "level": 1 or 2 or 3}},\n "parts": [{"id": 1, "title": "", "place": "", "time": "", "moods": [""], "cast": [""], "assets": [""], "in": "dip", "out": "whip", "starts_on": "", "ends_on": "", "job": "", "beats": ["", "", ""]}]}';
  J.prompt = function (P, job, mode) {
    mode = mode === true ? 'one' : (mode === 'one' || mode === 'two' ? mode : 'single');
    var plan = window.GK.plan(P), txt = '', task = '', ctr, bar;
    var head = titleLine(P, job, mode) + '\n' + fileLine(P) + '\n\nMODE: ' + ({ plan: 'PROJECT', assets: 'ASSETS', cast: 'CAST', scene: 'SCENE' })[job.kind] + (job.kind === 'scene' ? '\nPART: ' + job.part : '') + '\n';
    if (job.kind === 'plan') {
      var long = plan.audio.length > 120, np = plan.parts.length + (plan.parts.length === 1 ? ' part' : ' parts');
      task = 'TASK\nPlan the whole video (rulebook sections 16, 20, 23, 24, 25). The app already did the audio work: the project plan in the file holds the stage, the audio words and every part\'s id, start, end and text. They are final; do not repeat them (that wastes tokens).\n' +
        'For EVERY part fill: title, place, time, moods, cast, assets, in, out, starts_on, ends_on, job, beats. Fill "continuity".' + (long ? ' This video is over 2 minutes: also fill "chapters" and "places" (section 20).' : '') + '\n' +
        'Reuse names already in CAST and the asset library when they fit. The same thing has the same name in every part.\n' +
        'List every NEW asset in "assets_info" and every NEW person in "cast_info" with a level: 1 simple, 2 medium, 3 hard. The app shares the drawing work between chats by level.\n' +
        'Every NEW person gets a full wardrobe in "cast_info" (role, outfit, signature, accent, silhouette). Every NEW asset gets its story detail and what moves.\n' + WARDROBE_RULES +
        'The parts were cut at long pauses after sentences: ' + np + ', ids 1 to ' + plan.parts.length + '.\n\nFULL SCRIPT:\n' + (P.script || '').trim();
      ctr = contract(P, job, mode, ['The JSON has exactly this shape (add "chapters" and "places" only when asked above):\n' + PLAN_SHAPE]);
      bar = 'QUALITY BAR (check silently)\n- Exactly ' + np + ', ids 1 to ' + plan.parts.length + ', each once. Do not return stage, audio, start, end or text.\n- Every part: 3 to 8 short beats in the order they are seen; "starts_on" and "ends_on" say size and picture, they are promises to the next chat.\n- Joins: part 1 "in" is "dip", the last part "out" is "none", and every other "in" equals the "out" of the part before.\n- Every part shows what its words say, literally. Few places, well used. Story shape of section 23: hook in the first 2 seconds, stakes, turn, payoff.\n- Light and time of day are logical for each place; continuity notes cover clothes, props, weather, direction of travel.\n- Wardrobe: every new person has a role-logical outfit type, a signature colour no one else in their parts has, one easy-to-spot detail and their own silhouette.';
    } else if (job.kind === 'assets') {
      task = 'TASK\nMake ONLY these ' + job.items.length + ' asset' + (job.items.length > 1 ? 's' : '') + ' for this video (sections 17 and 5, and the plan in the file). Use these names exactly, with these capitals:\n' +
        job.items.map(function (x, i) { return (i + 1) + '. ' + x.name + (x.note ? ': ' + x.note : '') + ' (level ' + x.level + ' of 3)' }).join('\n') + '\n' +
        'Other chats make the other assets at the same time: make nothing else and change nothing that exists.\n' +
        'CREATIVE BAR (make each asset memorable, not generic):\n- A strong, simple silhouette you would know when filled black.\n- The story detail from the note is clearly visible (the number on a screen, the crack in the ice, the name on a sign when the story needs it).\n- One Art Deco touch that fits the object: stepped or streamlined form, a fan or sunburst motif, a gold trim on the lit edge.\n- 3 flat tones per shape (lit, base, shadow) and a soft glow where the thing gives light.\n- A part that can move or change when it makes the shot alive (a needle, a lid, a blinking light, a swinging lamp) as an option with a demo value.\n- Scale and perspective that match the band and the people (section 26).\n' + EXAMPLE;
      ctr = contract(P, job, mode, ['The code is ONLY the ASSET(...) call' + (job.items.length > 1 ? 's' : '') + ' you add (and a small helper they need), in the exact shape of section 17. Never the whole asset block.']);
      bar = 'QUALITY BAR (check silently)\n- Exactly the ' + job.items.length + ' name' + (job.items.length > 1 ? 's' : '') + ' above, spelled exactly. No other asset, no changed asset.\n- Every asset draws with its demo values and fits its box; it is clearly the thing named and readable at phone size.\n- Gilded Kasumi: flat cut-paper shapes, thin gold edges, palette colours only, no gradients except the approved ones, no images, fonts or network calls.\n- Detail matches the depth band (section 5): far = simple shapes, subject = rich detail. Clearer is better than more.\n- Creative bar met: memorable silhouette, story detail visible, one Art Deco touch, a moving part when it helps.';
    } else if (job.kind === 'cast') {
      task = 'TASK\nAdd ONLY ' + (job.items.length > 1 ? 'these ' + job.items.length + ' people' : 'this person') + ' for this video (sections 18, 6 and 24, and the plan and continuity notes in the file). Use these names exactly, with these capitals. Every new look needs side, front and back views:\n' +
        job.items.map(function (x, i) { return (i + 1) + '. ' + x.name + (x.note ? ': ' + x.note : '') }).join('\n') + '\n' +
        'Other chats add the other people at the same time: add nobody else and change nothing that exists.\n' +
        wardrobeTable(plan) + WARDROBE_RULES +
        '- When no built-in outfit (medic, boy, mother, doctor) is the right TYPE, draw a new one with OUTFIT() (side, front and back). Do not just recolour a medic coat into a different job.\n' + EXAMPLE;
      ctr = contract(P, job, mode, ['The code is ONLY the lines you add to the cast block (CAST entries, HAIR() and OUTFIT() looks), never the whole block.']);
      bar = 'QUALITY BAR (check silently)\n- Exactly the name' + (job.items.length > 1 ? 's' : '') + ' above, spelled exactly. Nobody else, nothing existing changed.\n- Age, gender, skin, hair and clothes match the description and the continuity notes; the side, front and back views are clearly the same person.\n- Clean paper-diorama look; palette colours only; the feeling and pose names exist in section 6.\n- Easy to follow: the outfit type fits the role, the main garment is the signature colour above, the easy-to-spot detail is drawn, and the person cannot be mixed up with anyone else in the wardrobe list or in CAST.';
    } else if (job.kind === 'scene') {
      var p = plan.parts.filter(function (x) { return x.id === job.part })[0] || {}, prev = plan.parts.filter(function (x) { return x.id === job.part - 1 })[0], next = plan.parts.filter(function (x) { return x.id === job.part + 1 })[0];
      task = 'TASK\nBuild ONLY part ' + job.part + ' of ' + plan.parts.length + ' of the project plan in the file (sections 14, 15, 16). Copy AUDIO_START (' + p.start + '), AUDIO_END (' + p.end + '), IN ("' + p.in + '"), OUT ("' + p.out + '") and the words from the plan; the word times are in audio.words: use them for SEG (section 22, level A).\n\n' +
        'SCRIPT FOR THIS PART: "' + (p.text || '') + '"\n' +
        (prev ? 'The part before ends on: ' + (prev.ends_on || '(see the plan)') + '. Start on a different picture.\n' : 'This is the first part: open on the strongest picture within 2 seconds.\n') +
        (next ? 'The part after starts on: ' + (next.starts_on || '(see the plan)') + '.\n' : 'This is the last part.\n') +
        'Other chats build the other parts at the same time from the same file: never build another part.\n' + EXAMPLE;
      ctr = contract(P, job, mode, ['Then exactly one block: <script data-part="' + job.part + '"> ... </script>, with both tags. Never the whole file.']);
      bar = 'QUALITY BAR (check silently, then fix)\n- LINT() passes on every line. Words a second is 2.2 to 3.6 for the part; the first SEG time minus AUDIO_START is 0 to 0.6 s.\n- Every phrase has its picture: what the words name is on screen at that word (use T(\'word\')).\n- Strongest picture in the first 2 s; a new picture or camera move every 1.5 to 2.5 s; never the same size twice in a row.\n- The subject is large and whole, heads stay above the captions, all five depth layers have something in them.\n- Light and weather match place and time of the plan; the darkest moment of the story is the darkest frame.\n- Hits: one of 9 to 11 on the key word, the rest 3 to 6. Obey the continuity notes and the people and assets in the file.';
    }
    txt = head + '\n' + task + '\n\n' + ctr + '\n\n' + bar;
    return txt;
  };
  /* the contract for the small prompts of stages 4 to 7: strict, code only, no talk */
  J.jsonRules = function () { return 'OUTPUT CONTRACT (an app reads your reply by machine, so the format is strict): reply with ONE ```json code block and NOTHING else (no words before or after it, no summary, no questions); valid JSON only (double quotes, no comments, no trailing commas, no "..."); answer in the chat only (no artifact, no file, no tool). The shape is exactly: ' };
  J.improvePrompt = function (P, partId, t, note) {
    var tag = '<!-- REPLY IMPROVE part-' + partId + ' -->';
    return 'PROMPT IMPROVE · SCENE · PART ' + partId + '\n' + fileLine(P) + '\n\nMODE: IMPROVE\nPART: ' + partId + '\n\n' +
      'TASK\nImprove part ' + partId + ' (section 19, every pass in order). Keep AUDIO_START, AUDIO_END, IN, OUT and the words exactly as they are. Change only this part.\n' +
      'What I want better: at ' + t.toFixed(1) + ' s into part ' + partId + ' (clock time of the part): ' + (note || 'a full review of this moment') + '\n' + EXAMPLE + '\n\n' +
      'OUTPUT CONTRACT (an app reads your reply by machine, so the format is strict):\n1. Reply with ONE ```html code block and NOTHING else: no words before or after it, no scores, no summary, no questions.\n2. The first line inside the block is exactly: ' + tag + '\n3. Then exactly one block: <script data-part="' + partId + '"> ... </script>, with both tags, complete. Never "...", "same as before" or "rest unchanged". Notes go as // comment lines at the top, 3 lines at most.\n4. Do not return the file. Answer in the chat only: no artifact, no file, no download.\n5. Check silently, never print the checks. If a check fails, fix the code first. Never ask a question.\n\n' +
      'QUALITY BAR (check silently)\n- Every score of section 19 is the same or better; a change that does not raise a score is undone.\n- LINT() passes on every line. Keep what already works.';
  };

  /* ---------- the critic ---------- */
  J.criticBrief = function (P, job) {
    var plan = window.GK.plan(P), what = '';
    if (job.kind === 'plan') what = 'Two plans (JSON) for the same narrated video. Judge: does every part show what its words say, literally? Is the story shape strong (hook in the first 2 seconds, stakes, turn, payoff)? Are places few and well used, joins logical, continuity complete, names reused? Is the light logical for time and place?';
    if (job.kind === 'assets') what = 'Two sets of drawings of the same assets (left: A, right: B) in the Gilded Kasumi style: Japanese woodblock print rebuilt as an Art Deco paper diorama: flat cut-paper shapes, thin gold edges, limited palette, no gradients except the approved ones, clear silhouettes. Judge each asset: is it clearly the thing named, memorable and specific to the story (strong silhouette, the story detail visible, an Art Deco touch) rather than generic, readable at small size, in the style, the right detail for its band? The wanted assets: ' + job.items.map(function (x) { return x.name + (x.note ? ' (' + x.note + ')' : '') }).join('; ') + '.';
    if (job.kind === 'cast') what = 'Two versions of the same people, each shown from the side, front and back (left: A, right: B), in the Gilded Kasumi paper style. Judge: does each person match the description (age, gender, skin, hair, clothes), are the three views the same person, is the outfit type right for their role, is the main garment their signature colour, is the easy-to-spot detail there, would a viewer never mix them up with someone else, is the look clean and in the style? The people: ' + job.items.map(function (x) { return x.name + (x.note ? ' (' + x.note + ')' : '') }).join('; ') + '.';
    if (job.kind === 'scene') {
      var p = plan.parts.filter(function (x) { return x.id === job.part })[0] || {};
      what = 'Two versions of part ' + job.part + ' of a narrated vertical video, shown as frames over time (top row: A, bottom row: B; each frame labelled with its time and the words heard then). The words of this part: "' + (p.text || '') + '". Judge: does each frame show literally what is being said at that moment? Is the camera alive and cinematic but comfortable? Is the light logical and does it tell the story? Is everything readable, nothing cut off, captions clear of faces? Does it flow from the part before and into the part after (shown at the ends when present)?';
    }
    return what;
  };
  J.criticAsk = function (P, job, facts) {
    return 'PROMPT CRITIC \u00B7 ' + J.label(P, job) + '\nYou are the art director of a YouTube channel that makes narrated videos in one fixed style, Gilded Kasumi. Pick the better of two versions, A or B.\n\n' + J.criticBrief(P, job) + '\n\n' +
      (facts ? 'Automatic checks:\n' + facts + '\n\n' : '') +
      'A version that fails automatic checks or does not draw loses unless both fail. Be strict and concrete.\n' +
      J.jsonRules() + '{"winner": "A" or "B", "score_a": 0-10, "score_b": 0-10, "why": "two or three short sentences", "fix_for_winner": "the one thing to improve next, or empty"}';
  };
  J.parseCritic = function (text) {
    text = String(text || ''); var j = null, a = text.indexOf('{'), b = text.lastIndexOf('}');
    if (a >= 0 && b > a) { try { j = JSON.parse(text.slice(a, b + 1)) } catch (e) { } }
    if (!j) { var m = /winner\W{0,6}\b([AB])\b/i.exec(text) || /\b(?:pick|choose|use)\s+(?:version\s+)?([AB])\b/i.exec(text); if (m) j = { winner: m[1].toUpperCase(), why: text.slice(0, 400) } }
    if (!j || !/^[AB]$/i.test(String(j.winner || ''))) return null;
    j.winner = String(j.winner).toUpperCase(); return j;
  };
})();
