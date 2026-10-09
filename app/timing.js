/* TIMING — gives every narration word a start/end time.
   1) Whisper in the browser (free, offline after first download) + align to the exact script
   2) Fallback: estimate from the audio's pauses (no download needed)
   3) No audio yet: estimate at ~150 words per minute (for previews)  */
(function () {
  var TM = {}; window.TIMING = TM;

  TM.words = function (text) { return String(text || '').replace(/\[[^\]]*\]/g, ' ').split(/\s+/).filter(function (w) { return /[A-Za-z0-9]/.test(w) }) };
  function norm(w) { return String(w).toLowerCase().replace(/[^a-z0-9]/g, '') }
  function weight(w) { return Math.max(2, norm(w).length) + 1.5 }
  function pauseAfter(w) { return /[.!?]["')\]]*$/.test(w) ? .45 : /[,;:—–-]["')\]]*$/.test(w) ? .2 : 0 }

  /* spread words over [t0, t1] by length + punctuation pauses */
  function spread(ws, t0, t1) {
    var tot = 0; ws.forEach(function (w, i) { tot += weight(w) + (i < ws.length - 1 ? pauseAfter(w) * 6 : 0) });
    var sc = (t1 - t0) / Math.max(1e-6, tot), t = t0;
    return ws.map(function (w, i) { var d = weight(w) * sc, s = t; t += d; var e = t; if (i < ws.length - 1) t += pauseAfter(w) * 6 * sc; return [w, +s.toFixed(3), +e.toFixed(3)] });
  }
  TM.estimate = function (text, duration) {
    var ws = TM.words(text); if (!ws.length) return { words: [], duration: duration || 1 };
    var d = duration || Math.max(2, ws.length / 2.5 + .6);
    return { words: spread(ws, .3, d - .3), duration: d };
  };

  /* lines: short phrases (one caption/beat each). Shots are made of whole lines. */
  TM.lines = function (words) {
    var out = [], cur = [];
    function flush() { if (!cur.length) return; var a = cur[0], b = cur[cur.length - 1]; out.push({ i: out.length, text: cur.map(function (k) { return words[k][0] }).join(' '), s: words[a][1], e: words[b][2], w0: a, w1: b }); cur = [] }
    words.forEach(function (w, i) {
      cur.push(i); var tx = w[0];
      if (/[.!?]["')\]]*$/.test(tx)) flush();
      else if (/[,;:—–]["')\]]*$/.test(tx) && cur.length >= 5) flush();
      else if (cur.length >= 12) flush();
    });
    flush(); return out;
  };

  /* ---------- decode audio to 16 kHz mono ---------- */
  TM.decode = function (blob) {
    return blob.arrayBuffer().then(function (buf) {
      var AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      return ac.decodeAudioData(buf).then(function (ab) {
        ac.close && ac.close();
        var len = Math.ceil(ab.duration * 16000), off = new OfflineAudioContext(1, len, 16000), src = off.createBufferSource();
        src.buffer = ab; src.connect(off.destination); src.start();
        return off.startRendering().then(function (r) { return { pcm: r.getChannelData(0), duration: ab.duration } });
      });
    });
  };

  /* ---------- fallback: use pauses in the audio ---------- */
  TM.fromPauses = function (text, pcm, duration) {
    var hop = 320, n = Math.floor(pcm.length / hop), rms = new Float32Array(n), i, j;
    for (i = 0; i < n; i++) { var s = 0; for (j = 0; j < hop; j++) { var v = pcm[i * hop + j]; s += v * v } rms[i] = Math.sqrt(s / hop) }
    var sorted = Array.prototype.slice.call(rms).sort(function (a, b) { return a - b }), floor = sorted[Math.floor(n * .1)] || 0, peak = sorted[Math.floor(n * .95)] || 1;
    var th = floor + (peak - floor) * .08, speech = []; for (i = 0; i < n; i++) speech.push(rms[i] > th);
    var first = speech.indexOf(true), last = speech.lastIndexOf(true); if (first < 0) return TM.estimate(text, duration);
    var pauses = [], run = 0; for (i = first; i <= last; i++) { if (!speech[i]) run++; else { if (run * .02 >= .22) pauses.push({ s: (i - run) * .02, e: i * .02 }); run = 0 } }
    var ws = TM.words(text), t0 = first * .02, t1 = (last + 1) * .02, est = spread(ws, t0, t1);
    // snap each sentence end to the nearest real pause, then re-spread inside each piece
    var anchors = [{ w: -1, t: t0 }];
    ws.forEach(function (w, k) {
      if (k === ws.length - 1 || pauseAfter(w) < .2) return;
      var te = est[k][2], best = null; pauses.forEach(function (p) { var d = Math.abs(p.s - te); if (d < 1.2 && (!best || d < Math.abs(best.s - te))) best = p });
      if (best && best.s > anchors[anchors.length - 1].t + .2) anchors.push({ w: k, t: best.s, next: best.e });
    });
    anchors.push({ w: ws.length - 1, t: t1 });
    var out = [];
    for (var a = 1; a < anchors.length; a++) {
      var A = anchors[a - 1], B = anchors[a], piece = ws.slice(A.w + 1, B.w + 1); if (!piece.length) continue;
      spread(piece, A.next || A.t, B.t).forEach(function (x) { out.push(x) });
    }
    return { words: out, duration: duration };
  };

  /* ---------- Whisper (transformers.js, runs in the browser) ---------- */
  var ASR = null;
  TM.whisper = function (pcm, onStatus) {
    var models = ['onnx-community/whisper-base_timestamped', 'onnx-community/whisper-tiny.en_timestamped', 'Xenova/whisper-tiny.en'];
    function load(i) {
      if (i >= models.length) return Promise.reject(new Error('Could not load a Whisper model.'));
      onStatus && onStatus('Downloading speech model (' + models[i] + '). First time only, ~40–150 MB…');
      return import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2').then(function (TF) {
        return TF.pipeline('automatic-speech-recognition', models[i], { progress_callback: function (p) { if (p.status === 'progress' && onStatus) onStatus('Downloading model: ' + Math.round(p.progress || 0) + '%') } });
      }).catch(function (e) { console.warn(e); return load(i + 1) });
    }
    return (ASR ? Promise.resolve(ASR) : load(0)).then(function (asr) {
      ASR = asr; onStatus && onStatus('Listening to the audio… (can take a few minutes for long videos)');
      return asr(pcm, { return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5 });
    }).then(function (out) {
      return (out.chunks || []).map(function (c) { return [String(c.text).trim(), c.timestamp[0], c.timestamp[1] == null ? c.timestamp[0] + .3 : c.timestamp[1]] }).filter(function (w) { return w[0] });
    });
  };

  /* ---------- align script words to heard words (so captions use YOUR spelling) ---------- */
  TM.align = function (text, heard, duration) {
    var A = TM.words(text), B = heard, n = A.length, m = B.length, i, j;
    var an = A.map(norm), bn = B.map(function (w) { return norm(w[0]) });
    var W = m + 1, S = new Int32Array((n + 1) * W), P = new Int8Array((n + 1) * W);
    for (i = 1; i <= n; i++) { S[i * W] = -i; P[i * W] = 1 } for (j = 1; j <= m; j++) { S[j] = -j; P[j] = 2 }
    for (i = 1; i <= n; i++) for (j = 1; j <= m; j++) {
      var sim = an[i - 1] === bn[j - 1] ? 2 : (an[i - 1] && bn[j - 1] && (an[i - 1].indexOf(bn[j - 1]) === 0 || bn[j - 1].indexOf(an[i - 1]) === 0) ? 1 : -1);
      var d = S[(i - 1) * W + j - 1] + sim, u = S[(i - 1) * W + j] - 1, l = S[i * W + j - 1] - 1;
      if (d >= u && d >= l) { S[i * W + j] = d; P[i * W + j] = 0 } else if (u >= l) { S[i * W + j] = u; P[i * W + j] = 1 } else { S[i * W + j] = l; P[i * W + j] = 2 }
    }
    var map = new Array(n); i = n; j = m;
    while (i > 0 || j > 0) { var p = P[i * W + j]; if (i > 0 && j > 0 && p === 0) { map[i - 1] = j - 1; i--; j-- } else if (i > 0 && (j === 0 || p === 1)) { i--; } else j--; }
    var out = A.map(function (w, k) { return map[k] != null && an[k] && bn[map[k]] && (an[k] === bn[map[k]] || an[k].indexOf(bn[map[k]]) === 0 || bn[map[k]].indexOf(an[k]) === 0) ? [w, B[map[k]][1], B[map[k]][2]] : [w, null, null] });
    // fill gaps by spreading between known neighbours
    var k = 0, matched = 0;
    while (k < n) {
      if (out[k][1] != null) { matched++; k++; continue }
      var s = k; while (k < n && out[k][1] == null) k++;
      var t0 = s > 0 ? out[s - 1][2] : (B[0] ? Math.max(0, B[0][1] - .3) : .2), t1 = k < n ? out[k][1] : (B.length ? B[B.length - 1][2] : duration);
      if (t1 - t0 < .08 * (k - s)) { // no room: share time with the word before
        if (s > 0) { var ps = out[s - 1][1], mid = ps + (t0 - ps) * .5; out[s - 1][2] = mid; t0 = mid }
        if (t1 - t0 < .08 * (k - s)) t1 = t0 + .2 * (k - s);
      }
      spread(A.slice(s, k), t0, t1).forEach(function (x, q) { out[s + q] = x });
    }
    for (k = 0; k < n; k++) { out[k][1] = +(+out[k][1]).toFixed(3); out[k][2] = +Math.max(out[k][1] + .05, +out[k][2]).toFixed(3) }
    return { words: out, duration: duration, matched: n ? matched / n : 0 };
  };

  /* full pipeline for one audio file */
  TM.run = function (text, blob, onStatus, useWhisper) {
    onStatus && onStatus('Reading the audio…');
    return TM.decode(blob).then(function (d) {
      if (useWhisper === false) return TM.fromPauses(text, d.pcm, d.duration);
      return TM.whisper(d.pcm, onStatus).then(function (heard) {
        var r = TM.align(text, heard, d.duration); r.method = 'whisper'; r.heard = heard.length; return r;
      }).catch(function (e) {
        console.warn('Whisper failed, using pause detection', e);
        onStatus && onStatus('Whisper could not run here, so I used pause detection instead.');
        var r = TM.fromPauses(text, d.pcm, d.duration); r.method = 'pauses'; r.note = String(e && e.message || e); return r;
      });
    });
  };
})();
