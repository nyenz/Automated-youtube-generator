/* AUDIO — turns script + narration into exact word times, a speech map and parts.
   Uses app/timing.js (Whisper in the browser + matching to the script).
   Everything here follows the Gilded Kasumi rulebook:
   - section 11 / 15: the audio map = pieces of speech between pauses
   - section 16: parts of 12–25 s (never over 30), cut only at a long pause (0.45 s or more) at a sentence end;
     part 1 starts at 0, every other part starts where its first word starts, the last part ends at the audio length
   - section 22: audio.words = [start, end, word] for every word, spelled as in the script */
(function () {
  var A = {}; window.AUDIO = A;
  var TM = window.TIMING;
  A.RULES = { min: 12, aim: 18, max: 25, hard: 30, longPause: .45, wpsLow: 2.2, wpsHigh: 3.6 };
  function r2(x) { return Math.round(x * 100) / 100 }

  /* ---------- speech map from the sound itself ---------- */
  A.speechMap = function (pcm, sr) {
    sr = sr || 16000;
    var hop = Math.round(sr * .02), n = Math.floor(pcm.length / hop), rms = new Float32Array(n), i, j;
    for (i = 0; i < n; i++) { var s = 0; for (j = 0; j < hop; j++) { var v = pcm[i * hop + j]; s += v * v } rms[i] = Math.sqrt(s / hop) }
    var sorted = Array.prototype.slice.call(rms).sort(function (a, b) { return a - b });
    var floor = sorted[Math.floor(n * .1)] || 0, peak = sorted[Math.floor(n * .95)] || 1, th = floor + (peak - floor) * .06;
    var out = [], on = -1, quiet = 0;
    for (i = 0; i <= n; i++) {
      var loud = i < n && rms[i] > th;
      if (loud) { if (on < 0) on = i; quiet = 0 }
      else if (on >= 0) { quiet++; if (quiet * .02 >= .12 || i === n) { var e = i - quiet + 1; if ((e - on) * .02 >= .05) out.push([r2(on * .02), r2(e * .02)]); on = -1; quiet = 0 } }
    }
    return out;
  };

  /* small loudness strip for drawing the waveform (max |sample| per bucket) */
  A.peaks = function (pcm, buckets) {
    var out = new Float32Array(buckets), step = pcm.length / buckets;
    for (var b = 0; b < buckets; b++) { var a = Math.floor(b * step), e = Math.floor((b + 1) * step), m = 0; for (var i = a; i < e; i++) { var v = pcm[i] < 0 ? -pcm[i] : pcm[i]; if (v > m) m = v } out[b] = m }
    var top = 0; for (b = 0; b < buckets; b++) if (out[b] > top) top = out[b];
    if (top > 0) for (b = 0; b < buckets; b++) out[b] = out[b] / top;
    return Array.prototype.map.call(out, function (v) { return Math.round(v * 100) / 100 });
  };

  /* word indexes where a paragraph of the script ends (a blank line) — good places to cut */
  A.paragraphEnds = function (text) {
    var paras = String(text || '').split(/\n\s*\n/), ends = {}, count = 0;
    paras.forEach(function (p) { var n = TM.words(p).length; if (n) { count += n; ends[count - 1] = 1 } });
    return ends;
  };

  /* ---------- cut points ---------- */
  function sentenceEnd(w) { return /[.!?]["'”’)\]]*$/.test(w) }
  function clauseEnd(w) { return /[,;:—–]["'”’)\]]*$/.test(w) }
  /* every gap between two words that could start a new part */
  A.gaps = function (words, text) {
    var pe = A.paragraphEnds(text), out = [];
    for (var i = 0; i < words.length - 1; i++) {
      var g = words[i + 1][1] - words[i][2];
      out.push({ after: i, at: words[i + 1][1], gap: r2(Math.max(0, g)), sentence: sentenceEnd(words[i][0]), clause: clauseEnd(words[i][0]), para: !!pe[i] });
    }
    return out;
  };
  A.isCandidate = function (g) { return g.gap >= A.RULES.longPause && (g.sentence || g.para) };

  /* cost of a part's length: free-ish inside 12–25 s (best near 18.5), steep outside */
  function lenCost(L, last) {
    var R = A.RULES;
    if (L < R.min) return (R.min - L) * (last ? 1.2 : 4);
    if (L > R.max) return 1 + (L - R.max) * 6;
    return Math.pow(L - 18.5, 2) / 40;
  }
  /* cost of a cut: every cut costs a little (fewer, cleaner joins), a weak cut costs more.
     Best: a paragraph end with a long pause. Never rewards cutting more often. */
  function cutCost(g) {
    var good = Math.min(1.5, g.gap) * 2 + (g.sentence ? 1 : 0) + (g.para ? 4 : 0);
    return 2 + Math.max(0, 5 - good) + (A.isCandidate(g) ? 0 : 6);
  }
  /* best split: shortest-path over the allowed cut points, scored by length and by how good each cut is.
     Returns cut word indexes (the first word of each new part). */
  A.split = function (words, text, duration) {
    var R = A.RULES, gaps = A.gaps(words, text);
    if (!words.length) return [];
    var levels = [
      function (g) { return A.isCandidate(g) },
      function (g) { return g.gap >= .3 && g.sentence },
      function (g) { return g.gap >= .25 && (g.sentence || g.clause) },
      function (g) { return g.gap >= .12 }
    ];
    function solve(level) {
      var C = gaps.filter(function (g) { return levels.slice(0, level + 1).some(function (f) { return f(g) }) });
      var pts = [{ t: 0, g: null }].concat(C.map(function (g) { return { t: g.at, g: g } })).concat([{ t: duration, g: null, end: true }]);
      var N = pts.length, best = new Array(N).fill(Infinity), prev = new Array(N).fill(-1); best[0] = 0;
      for (var b = 1; b < N; b++) for (var a = 0; a < b; a++) {
        if (best[a] === Infinity) continue;
        var L = pts[b].t - pts[a].t, last = pts[b].end, cost = lenCost(L, last), g = pts[b].g;
        if (L > R.hard) continue;
        if (g) cost += cutCost(g);
        if (best[a] + cost < best[b]) { best[b] = best[a] + cost; prev[b] = a }
      }
      if (best[N - 1] === Infinity) return null;
      var cuts = [], k = N - 1; while (k > 0) { cuts.unshift(pts[k]); k = prev[k] }
      return cuts.slice(0, -1).map(function (p) { return p.g.after + 1 });
    }
    if (duration <= R.max + 3) return [];             // a short narration is one part
    for (var lv = 0; lv < levels.length; lv++) { var c = solve(lv); if (c) return c }
    return [];
  };

  /* parts from cuts. A cut = the index of the first word of a new part; the part starts where that word starts */
  A.parts = function (words, cuts, duration) {
    var idx = (cuts || []).filter(function (i) { return i > 0 && i < words.length }).sort(function (a, b) { return a - b });
    var bounds = [0].concat(idx.map(function (i) { return words[i][1] })).concat([duration]), out = [];
    for (var i = 0; i < bounds.length - 1; i++) {
      var s = bounds[i], e = bounds[i + 1], ws = words.filter(function (w) { return w[1] >= s - .001 && w[1] < e - .001 });
      var speak = ws.length ? Math.max(.1, ws[ws.length - 1][2] - ws[0][1]) : 0;
      out.push({ id: i + 1, start: r2(s), end: r2(e), len: r2(e - s), words: ws.length, w0: ws.length ? words.indexOf(ws[0]) : -1, w1: ws.length ? words.indexOf(ws[ws.length - 1]) : -1,
        text: ws.map(function (w) { return w[0] }).join(' '), wps: ws.length ? r2(ws.length / (e - s)) : 0, speakWps: speak ? r2(ws.length / speak) : 0 });
    }
    return out;
  };

  /* plain-English checks for one part (rulebook sections 15 and 16) */
  A.check = function (p, isLast) {
    var R = A.RULES, out = [];
    if (p.len > R.hard) out.push({ level: 'bad', text: 'Too long (' + p.len.toFixed(1) + ' s). A part may not pass 30 s.' });
    else if (p.len > R.max) out.push({ level: 'warn', text: 'A bit long (' + p.len.toFixed(1) + ' s). Aim for 12 to 25 s.' });
    if (p.len < R.min && !isLast) out.push({ level: 'warn', text: 'Short (' + p.len.toFixed(1) + ' s). Aim for 12 to 25 s.' });
    if (p.words && (p.wps < R.wpsLow - .4 || p.wps > R.wpsHigh + .4)) out.push({ level: 'warn', text: p.wps.toFixed(1) + ' words a second. A normal voice is 2.2 to 3.6.' });
    if (!p.words) out.push({ level: 'bad', text: 'No words in this part.' });
    return out;
  };

  /* ---------- the full job: script + audio file -> timing ---------- */
  A.analyse = function (text, blob, onStatus) {
    onStatus && onStatus('Reading the audio…', null);
    return TM.decode(blob).then(function (d) {
      var map = A.speechMap(d.pcm), peaks = A.peaks(d.pcm, Math.min(6000, Math.max(800, Math.round(d.duration * 40))));
      var job = text && TM.words(text).length
        ? TM.whisper(d.pcm, onStatus).then(function (heard) { var r = TM.align(text, heard, d.duration); r.method = 'whisper'; r.heard = heard; return r })
          .catch(function (e) { onStatus && onStatus('Whisper could not run here, so the app used the pauses instead.', null); var r = TM.fromPauses(text, d.pcm, d.duration); r.method = 'pauses'; r.note = String(e && e.message || e); return r })
        : TM.transcribe(blob, onStatus).then(function (r) { r.method = 'whisper-only'; return r });
      return job.then(function (r) {
        // "guessed" = a script word Whisper did not clearly hear; its time was placed between its neighbours
        var words = r.words.map(function (w) { return [w[0], r2(+w[1]), r2(+w[2])] });
        var guessed = r.method === 'whisper' ? markGuessed(text, r.heard || [], words) : words.map(function () { return r.method !== 'whisper-only' });
        return { duration: r2(d.duration), words: words, guessed: guessed, method: r.method, matched: r.matched == null ? 1 : r.matched, map: map, peaks: peaks, note: r.note || '' };
      });
    });
  };
  /* a script word counts as "heard" when Whisper said (nearly) the same word at about that time */
  function markGuessed(text, heard, words) {
    function n(w) { return String(w).toLowerCase().replace(/[^a-z0-9]/g, '') }
    var j = 0;
    return words.map(function (w) {
      var a = n(w[0]);
      while (j < heard.length && heard[j][2] < w[1] - .05) j++;
      for (var k = j; k < Math.min(heard.length, j + 3); k++) { var b = n(heard[k][0]); if (b && a && (a === b || a.indexOf(b) === 0 || b.indexOf(a) === 0) && Math.abs(heard[k][1] - w[1]) < .06) return false }
      return true;
    });
  }

  /* the project plan in the Gilded Kasumi format (rulebook sections 16 and 22) */
  A.plan = function (P) {
    var T = P.timing || {}, words = T.words || [], parts = A.parts(words, P.cuts || [], T.duration || 0);
    return {
      title: P.name || 'Untitled',
      stage: P.format === 'long' ? 'wide' : 'vertical',
      format: P.format === 'long' ? 'wide 16:9 video, 960 x 540, 30 fps' : 'vertical 9:16 short, 540 x 960, 30 fps',
      audio: {
        file: P.audio ? P.audio.name : '', length: T.duration || 0, map: T.map || [],
        map_note: 'each pair is one piece of speech between two pauses, in seconds of the full narration',
        words: words.map(function (w) { return [w[1], w[2], w[0]] }),
        timing: T.method === 'whisper' ? 'Level A, Whisper (matched to the script by the app)' : 'Level B, pauses (estimated)'
      },
      parts: parts.map(function (p, i) { return { id: p.id, title: '', start: p.start, end: p.end, text: p.text } }),
      continuity: {}
    };
  };
})();
