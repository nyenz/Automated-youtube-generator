/* EDIT — the rules that turn a list of shots into a film that flows. Plain code, no AI, no credits.
   EDIT.gaps(plan)              -> things the story names that no asset will show ("brain", "divers"…)
   EDIT.suggest(word)           -> { name, kind, size } for a missing thing
   EDIT.mergeShort(plan, cuts)  -> merges shots that are too short (before any shot is made)
   EDIT.trans(plan, cid, i, ov) -> the transition into shot i: { type, for }
   EDIT.report(p, cid)          -> the director's report (cuts, shot lengths, problems) */
(function () {
  var E = {}; window.EDIT = E;
  var PEOPLE = 'man woman boy girl child kid baby mother mom mum father dad parent parents brother sister son daughter grandma grandpa wife husband friend doctor doctors nurse nurses medic medics paramedic paramedics surgeon surgeons diver divers rescuer rescuers firefighter firefighters police officer officers soldier soldiers teacher pilot driver crowd people worker workers scientist scientists king queen farmer fisherman neighbour neighbor stranger guard family'.split(' ');
  var ANIMALS = 'dog cat horse cow goat sheep pig bird birds duck ducks goose chicken fish shark whale dolphin snake bear wolf lion tiger elephant monkey rat mouse insect bee bees spider ant ants crocodile deer fox rabbit owl eagle crow'.split(' ');
  var THINGS = ('brain heart lung lungs blood bone bones skull skeleton stomach liver kidney eye eyes vein veins muscle cell cells virus germ ' +
    'clock watch calendar phone cup mug glass bottle ice-cube fence rope ladder ambulance helicopter car truck bus boat ship plane train bike bicycle tricycle sled ski skis ' +
    'door window bed chair table desk book letter note paper newspaper map gun knife sword camera computer laptop screen tv television radio lamp candle torch flashlight ' +
    'fire smoke flame flames tree trees rock rocks money coin coins cash key keys bag backpack hat helmet mask syringe needle pill pills bandage stretcher wheelchair ' +
    'monitor x-ray xray microscope thermometer tube tubes mirror flag sign crown ring sun moon star stars planet rocket ball toy doll blanket towel jacket coat boots ' +
    'scarf gloves shovel axe hammer bucket basket box crate barrel tent cabin hut house tower bridge river lake pond sea ocean boat canoe raft net ' +
    'medal trophy certificate clipboard chart graph machine pump engine wheel tire battery bulb wire cable pipe tank oxygen mask cross grave coffin cake candles ' +
    'gift present umbrella snowman ice-hole hole cave mountain hill volcano storm lightning rainbow').split(' ');
  var ALL = {}; PEOPLE.forEach(function (w) { ALL[w] = 'character' }); ANIMALS.forEach(function (w) { ALL[w] = 'creature' }); THINGS.forEach(function (w) { ALL[w] = ALL[w] || 'prop' });
  var BUILT = { kato: 1, nia: 1, 'void': 1 };
  // one asset can stand for a group of words (the parents = mother + father; medics = any doctor or nurse)
  var ALIAS = [['parent', 'mother', 'father', 'mom', 'dad', 'mum'], ['doctor', 'medic', 'paramedic', 'surgeon', 'nurse', 'rescuer'], ['diver', 'rescuer', 'firefighter'], ['child', 'kid', 'boy', 'girl', 'baby'],
    ['police', 'officer'], ['crowd', 'people'], ['heart', 'heart-monitor', 'heart-lung-machine'], ['ice-cube', 'cube'], ['fire', 'flame']];
  function aliasCovered(w, cov) { return ALIAS.some(function (g) { return g.indexOf(w) >= 0 && g.some(function (x) { return cov[x] }) }) }
  function sing(w) { return w.length > 3 && /s$/.test(w) && !/ss$/.test(w) ? w.replace(/ies$/, 'y').replace(/s$/, '') : w }
  function toks(t) { return String(t || '').toLowerCase().split(/[^a-z0-9-]+/).filter(Boolean) }
  E.kindOf = function (w) { return ALL[w] || ALL[sing(w)] || null };

  /* every word an asset "covers": its name pieces, its look, its parts */
  function covered(plan) {
    var c = {};
    (plan.assets || []).forEach(function (a) {
      toks(a.name).concat(toks(a.name.replace(/-/g, ' '))).concat(toks(a.look)).concat(toks(a.looks_like)).concat((a.parts || []).map(String)).forEach(function (w) { c[w] = 1; c[sing(w)] = 1 });
    });
    return c;
  }
  /* things the story names that no asset will show */
  E.gaps = function (plan) {
    if (!plan) return [];
    var names = {}, cov = covered(plan), out = [], seen = {};
    (plan.assets || []).forEach(function (a) { names[a.name] = 1 });
    var D = plan.details || {};
    Object.keys(D).forEach(function (cid) {
      (D[cid] || []).forEach(function (d) {
        // 1) the planner said which assets it needs
        (Array.isArray(d.needs) ? d.needs : []).forEach(function (n) {
          n = String(n).toLowerCase().trim().replace(/\s+/g, '-'); if (!n || names[n] || BUILT[n] || seen[n]) return;
          seen[n] = 1; out.push({ word: n, cid: cid, line: d.line, show: d.show, why: 'the plan says this line needs "' + n + '"' });
        });
        // 2) things the narration names on that word (and people/animals the detail asks for) that nothing covers
        toks(d.word).concat(toks(d.show).filter(function (w) { var k = ALL[w] || ALL[sing(w)]; return k === 'character' || k === 'creature' })).forEach(function (w) {
          var s = sing(w), k = ALL[w] || ALL[s]; if (!k || cov[w] || cov[s] || seen[s] || aliasCovered(s, cov)) return;
          seen[s] = 1; out.push({ word: s, cid: cid, line: d.line, show: d.show, why: '"' + w + '" is named on line ' + d.line + ' but no asset shows it' });
        });
      });
    });
    // 3) shots that say they show something nobody builds
    Object.keys(plan.cuts || {}).forEach(function (cid) {
      (plan.cuts[cid] || []).forEach(function (s) {
        toks(s.show).forEach(function (w) {
          var sw = sing(w), k = ALL[w] || ALL[sw]; if (!k || k === 'prop' || cov[w] || cov[sw] || seen[sw] || aliasCovered(sw, cov)) return;
          seen[sw] = 1; out.push({ word: sw, cid: cid, shot: s.id, show: s.show, why: 'shot ' + s.id + ' shows "' + w + '" but no asset is that' });
        });
      });
    });
    return out;
  };
  E.suggest = function (g) {
    var w = g.word, kind = E.kindOf(w) || 'prop', size = kind === 'character' ? 2.6 : kind === 'creature' ? 1 : .7;
    var look = kind === 'character' ? 'a ' + w + ' as the story describes (' + (g.show || '').slice(0, 120) + ')' : 'a clear, simple ' + w.replace(/-/g, ' ') + ' that reads at a glance' + (g.show ? ' (' + g.show.slice(0, 120) + ')' : '');
    return { name: w.replace(/[^a-z0-9-]/g, ''), kind: kind, difficulty: kind === 'character' ? 1 : 1, size: size, look: look, parts: [], moves: [], added: true };
  };

  /* shot lengths in seconds */
  function times(cut, list) {
    return list.map(function (s, i) {
      var l0 = cut.lines[s.lines[0]], from = i === 0 ? 0 : (l0 ? l0.s : 0), nx = list[i + 1], to = nx && cut.lines[nx.lines[0]] ? cut.lines[nx.lines[0]].s : cut.duration;
      return to - from;
    });
  }
  /* FEWER CUTS: merge shots shorter than min seconds into a neighbour (same place first). Done before shots are made. */
  E.mergeShort = function (plan, cuts, min) {
    min = min || 2.5; var merged = 0, remap = {};
    (cuts || []).forEach(function (cut) {
      var L = plan.cuts && plan.cuts[cut.id]; if (!L || L.length < 2 || !cut.lines || !cut.lines.length) return;
      for (var guard = 0; guard < 200; guard++) {
        var d = times(cut, L), worst = -1;
        d.forEach(function (x, i) { if (x < min && (worst < 0 || x < d[worst])) worst = i });
        if (worst < 0 || L.length < 2) break;
        var s = L[worst], p = L[worst - 1], n = L[worst + 1];
        var into = !p ? n : !n ? p : (p.set === s.set && n.set !== s.set) ? p : (n.set === s.set && p.set !== s.set) ? n : (d[worst - 1] <= d[worst + 1] ? p : n);
        var first = into === p ? p : s, second = into === p ? s : n, keep = d[L.indexOf(first)] >= d[L.indexOf(second)] ? first : second;
        var m = Object.assign({}, keep, {
          id: first.id, lines: [first.lines[0], second.lines[1]],
          cast: (first.cast || []).concat((second.cast || []).filter(function (c) { return (first.cast || []).indexOf(c) < 0 })),
          show: first.show + ' Then: ' + second.show, difficulty: Math.max(first.difficulty || 1, second.difficulty || 1),
          mood: first.mood, camera: first.camera, link: first.link, transition: first.transition, set: keep.set
        });
        remap[second.id] = first.id;
        L.splice(L.indexOf(first), 2, m); merged++;
      }
      // number the shots again: M01, M02 ...
      var pre = cut.prefix || (L[0] && L[0].id.replace(/\d+$/, '')) || 'M';
      L.forEach(function (s, i) { var nid = pre + (i < 9 ? '0' : '') + (i + 1); if (s.id !== nid) { Object.keys(remap).forEach(function (k) { if (remap[k] === s.id) remap[k] = nid }); remap[s.id] = nid; s.id = nid } });
    });
    // thumbnails point at shots: follow the new ids
    var pb = plan.publish; if (pb && Array.isArray(pb.thumbnails)) pb.thumbnails.forEach(function (t) { if (t && t.shot && remap[t.shot]) t.shot = remap[t.shot] });
    return merged;
  };

  /* TRANSITIONS by rule — same place: the camera glides on; new place: dissolve; time jump: fade through dark; shock: hard cut */
  E.TYPES = [['auto', 'Auto (by rule)'], ['glide', 'Glide (same place, camera carries on)'], ['dissolve', 'Dissolve (new place)'], ['dip', 'Fade through dark (time jump)'], ['push', 'Push (slide in)'], ['cut', 'Hard cut (shock)']];
  var LEN = { glide: 1, dissolve: .7, dip: .9, push: .6, cut: 0 };
  E.auto = function (list, i) {
    var s = list[i], p = list[i - 1]; if (!p) return 'cut';
    var link = String(s.link || '').toLowerCase();
    if (link === 'same' || link === 'same-place') return 'glide';
    if (link === 'time-jump' || link === 'time') return 'dip';
    if (link === 'shock') return 'cut';
    if (link === 'new-place' || link === 'new') return 'dissolve';
    if (s.mood === 'flash' || s.mood === 'danger' && p.mood !== 'danger') return 'cut';
    if (s.mood === 'flashback' && p.mood !== 'flashback' || p.mood === 'flashback' && s.mood !== 'flashback') return 'dip';
    if (s.set === p.set || s.transition === 'flow') return 'glide';
    return 'dissolve';
  };
  E.trans = function (plan, cid, i, ov) {
    var list = (plan.cuts && plan.cuts[cid]) || [], s = list[i]; if (!s || i === 0) return null;
    var o = ov && ov[s.id] && ov[s.id].trans, type = o && o !== 'auto' ? o : E.auto(list, i);
    var len = ov && ov[s.id] && ov[s.id].tlen ? +ov[s.id].tlen : LEN[type];
    return { type: type, for: len, auto: !(o && o !== 'auto') };
  };

  /* DIRECTOR'S REPORT */
  E.report = function (p, cid, info) {
    var cut = (p.cuts || []).filter(function (c) { return c.id === cid })[0], list = (p.plan && p.plan.cuts[cid]) || [];
    if (!cut || !list.length) return null;
    var d = times(cut, list), S = p.shots[cid] || {}, ov = (p.edits || {})[cid] || {}, hard = 0, inShot = 0, short = [], notMade = [], details = [];
    list.forEach(function (s, i) {
      var t = E.trans(p.plan, cid, i, ov); if (i && t && t.type === 'cut') hard++;
      var code = (S[s.id] || {}).code || ''; if (!code) notMade.push(s.id);
      inShot += Math.max(0, (code.match(/cut\s*:\s*true/g) || []).length);
      if (d[i] < 2.5) short.push(s.id);
      if (code && window.PLAN && PLAN.missingDetails) PLAN.missingDetails(code, PLAN.shotDetails(p.plan, cid, s)).forEach(function (x) { details.push(s.id + ': "' + x.word + '"') });
    });
    if (info && info.camCuts != null) inShot = info.camCuts;
    var secs = cut.duration || d.reduce(function (a, b) { return a + b }, 0), changes = list.length - 1 + inShot, per = changes ? secs / changes : secs;
    var gaps = E.gaps(p.plan).filter(function (g) { return !g.cid || g.cid === cid });
    return {
      shots: list.length, avg: secs / list.length, hard: hard, soft: list.length - 1 - hard, inShot: inShot, perChange: per, short: short, notMade: notMade, details: details, gaps: gaps,
      lights: {
        pace: per >= 5 ? 'ok' : per >= 3.5 ? 'warn' : 'bad',
        made: notMade.length ? 'bad' : 'ok',
        show: gaps.length || details.length ? (gaps.length > 2 || details.length > 4 ? 'bad' : 'warn') : 'ok',
        short: short.length ? 'warn' : 'ok'
      }
    };
  };
})();
