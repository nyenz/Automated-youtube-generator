/* SOUND — background music that drops while the narrator speaks, and sound effects placed on the right moments.
   Music: your own file; it fades in, ducks under every piece of speech (from the audio map) and fades out.
   Effects: cues come from the video itself (whip joins and the big shake hits on key words) and, if you like, from a Sonnet prompt.
   Each cue gets a sound from your own folder first, then from Freesound (free key, only sounds that are free to use, CC0).
   "Redo" on a cue takes the next best sound. The final mix is brought to a YouTube-friendly loudness. */
(function () {
  'use strict';
  var SD = {}; window.SOUND = SD;
  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v } catch (e) { return d } }
  function set(k, v) { try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v) } catch (e) { } }
  SD.fsKey = function () { return get('studio.freesoundKey', '') };
  SD.setFsKey = function (k) { set('studio.freesoundKey', String(k || '').trim()) };

  SD.defaults = function () { return { music: null, musicVol: 0.35, duckDb: -14, attack: .12, release: .45, fadeIn: 1.5, fadeOut: 2.5, narrVol: 1, sfxVol: 0.8, cues: [], useHits: true, useWhips: true } };
  SD.cfg = function (P) { P.sound = Object.assign(SD.defaults(), P.sound || {}); return P.sound };

  /* speech regions: pieces of the audio map joined when the gap is short, so the music does not pump */
  SD.speech = function (P) {
    var map = (P.timing && P.timing.map) || [], out = [];
    map.forEach(function (m) { var l = out[out.length - 1]; if (l && m[0] - l[1] < .6) l[1] = m[1]; else out.push([m[0], m[1]]) });
    return out;
  };
  function applyMusicGain(g, P, dur, t0, base) { // schedule the duck on a gain node; t0 = video time at context time `base`
    var S = SD.cfg(P), v = S.musicVol, low = v * Math.pow(10, S.duckDb / 20), at = function (t) { return base + (t - t0) };
    var speaking = SD.speech(P).some(function (r) { return t0 >= r[0] && t0 < r[1] });
    var start = Math.min(v, t0 < S.fadeIn ? v * t0 / S.fadeIn : v);
    g.gain.cancelScheduledValues(base); g.gain.setValueAtTime(speaking ? low : start, base);
    if (t0 < S.fadeIn && !speaking) g.gain.linearRampToValueAtTime(v, at(S.fadeIn));
    SD.speech(P).forEach(function (r) {
      if (r[1] + S.release < t0) return;
      var a = Math.max(t0, r[0] - S.attack), b = Math.max(t0, r[1]);
      if (r[0] > t0) { g.gain.setValueAtTime(g.gain.value, at(a)); g.gain.setTargetAtTime(low, at(a), S.attack / 3) }
      g.gain.setTargetAtTime(v, at(b), S.release / 3);
    });
    var fo = Math.max(t0, dur - S.fadeOut); g.gain.setTargetAtTime(0, at(fo), S.fadeOut / 3);
  }

  /* ---------- cues ---------- */
  var LIB = {
    whoosh: 'whoosh swish transition', impact: 'impact hit boom cinematic', heavy: 'deep boom impact sub', soft: 'soft hit thud',
    heartbeat: 'heartbeat', ice: 'ice crack', splash: 'water splash', siren: 'ambulance siren distant', wind: 'cold wind', click: 'click beep', door: 'car door', engine: 'car engine start', footsteps: 'footsteps snow', breath: 'breath gasp'
  };
  SD.autoCues = function (P, built) {
    var S = SD.cfg(P), cues = [];
    (built || []).forEach(function (b, i) {
      if (S.useWhips && b.OUT === 'whip' && i < built.length - 1) cues.push({ t: Math.max(0, b.AUDIO_END - .25), label: 'Whip to part ' + (b.id + 1), query: LIB.whoosh, vol: .55, from: 'auto' });
      if (S.useHits) (b.HITS || []).forEach(function (h) { if (h[1] >= 7) cues.push({ t: b.AUDIO_START + h[0], label: (h[1] >= 10 ? 'Big hit' : 'Hit') + ' in part ' + b.id, query: h[1] >= 10 ? LIB.heavy : LIB.impact, vol: Math.min(.9, .35 + h[1] * .05), from: 'auto' }) });
    });
    return cues;
  };
  SD.cuePrompt = function (P) {
    var plan = window.GK.plan(P), W = (P.timing && P.timing.words) || [];
    return 'PROMPT S5 \u00B7 SOUND MOMENTS\nYou are the sound designer of a narrated YouTube video. Pick sound effects that make the story feel real. Sounds only where something physical happens or for a strong emotional beat. Never on every sentence, never under every word. Usually 1 to 3 per 20 seconds.\n\n' +
      'Here are the parts, with what is seen and the word times (seconds of the narration):\n' +
      plan.parts.map(function (p) {
        var ws = W.filter(function (w) { return w[1] >= p.start && w[1] < p.end }).map(function (w) { return w[0] + '@' + w[1].toFixed(2) }).join(' ');
        return 'PART ' + p.id + ' (' + p.start + ' to ' + p.end + ' s) ' + (p.place ? 'place: ' + p.place + '. ' : '') + (p.beats ? 'seen: ' + [].concat(p.beats).join(' / ') + '. ' : '') + '\nwords: ' + ws;
      }).join('\n\n') +
      '\n\n' + window.JOBS.jsonRules() + '{"cues": [{"time": seconds, "label": "what happens", "search": "2 to 4 words to search a sound library, e.g. ice crack", "volume": 0.2 to 1}]}';
  };
  SD.parseCues = function (text) {
    text = String(text || ''); var a = text.indexOf('{'), b = text.lastIndexOf('}'), j = null;
    try { j = JSON.parse(text.slice(a, b + 1)) } catch (e) { }
    var list = j && (j.cues || j.sounds); if (!Array.isArray(list)) return null;
    return list.filter(function (c) { return c && isFinite(+c.time) && (c.search || c.label) }).map(function (c) { return { t: +c.time, label: String(c.label || c.search), query: String(c.search || c.label), vol: Math.max(.05, Math.min(1, +c.volume || .6)), from: 'sonnet' } });
  };

  /* ---------- finding a sound ---------- */
  function tokens(s) { return String(s || '').toLowerCase().replace(/\.[a-z0-9]+$/, '').split(/[^a-z0-9]+/).filter(function (w) { return w.length > 2 }) }
  SD.indexFolder = function (dir) {
    var out = [];
    function walk(d, depth, path) {
      if (depth > 3) return Promise.resolve();
      var jobs = [];
      return (async function () { for await (var e of d.values()) { if (e.kind === 'file' && /\.(wav|mp3|ogg|m4a|flac|aac|webm)$/i.test(e.name)) out.push({ name: e.name, path: path + e.name, h: e }); else if (e.kind === 'directory') jobs.push(walk(e, depth + 1, path + e.name + '/')) } return Promise.all(jobs) })();
    }
    return walk(dir, 0, '').then(function () { return out });
  };
  SD.matchFolder = function (files, query) {
    var q = tokens(query); if (!q.length) return [];
    return files.map(function (f) { var t = tokens(f.path), s = 0; q.forEach(function (w, i) { if (t.indexOf(w) >= 0) s += 3 - Math.min(2, i * .5); else if (t.some(function (x) { return x.indexOf(w) === 0 || w.indexOf(x) === 0 })) s += 1 }); return { f: f, s: s } })
      .filter(function (x) { return x.s > 0 }).sort(function (a, b) { return b.s - a.s }).slice(0, 8).map(function (x) { return { kind: 'folder', name: x.f.name, path: x.f.path, h: x.f.h } });
  };
  SD.freesound = function (query) {
    var k = SD.fsKey(); if (!k) return Promise.resolve([]);
    var u = 'https://freesound.org/apiv2/search/text/?query=' + encodeURIComponent(query) + '&filter=' + encodeURIComponent('license:"Creative Commons 0" duration:[0.2 TO 12]') + '&fields=id,name,previews,duration,username&sort=score&page_size=8&token=' + encodeURIComponent(k);
    return fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status === 401 ? 'Freesound did not accept the key. Check it in Settings.' : 'Freesound could not be reached.'); return r.json() })
      .then(function (j) { return (j.results || []).map(function (x) { return { kind: 'freesound', name: x.name, id: x.id, by: x.username, url: x.previews && (x.previews['preview-hq-mp3'] || x.previews['preview-lq-mp3']), dur: x.duration } }).filter(function (x) { return x.url }) });
  };
  SD.fetchBlob = function (cand) {
    if (cand.kind === 'folder') return cand.h.getFile();
    return fetch(cand.url).then(function (r) { if (!r.ok) throw new Error('That sound could not be downloaded.'); return r.blob() });
  };

  /* ---------- decoding and mixing ---------- */
  var DEC = {};
  SD.decode = function (key, blob) {
    if (DEC[key]) return DEC[key];
    DEC[key] = blob.arrayBuffer().then(function (ab) { return new OfflineAudioContext(2, 48000, 48000).decodeAudioData(ab) });
    DEC[key].catch(function () { delete DEC[key] });
    return DEC[key];
  };
  SD.forget = function (key) { delete DEC[key] };
  /* the whole soundtrack as one buffer (for the MP4); blobs: { narr, music, sfx: {cueId: blob} } */
  SD.mix = function (P, dur, blobs) {
    var S = SD.cfg(P);
    return Promise.all([blobs.narr ? SD.decode(P.id + ':narr', blobs.narr) : null, blobs.music ? SD.decode(P.id + ':music', blobs.music) : null].concat(S.cues.map(function (c) { var b = blobs.sfx && blobs.sfx[c.id]; return b ? SD.decode(P.id + ':sfx:' + c.id + ':' + (c.pickKey || ''), b) : null })))
      .then(function (bufs) {
        var off = new OfflineAudioContext(2, Math.ceil(dur * 48000), 48000);
        if (bufs[0]) { var n = off.createBufferSource(), ng = off.createGain(); ng.gain.value = S.narrVol; n.buffer = bufs[0]; n.connect(ng); ng.connect(off.destination); n.start(0) }
        if (bufs[1]) { var m = off.createBufferSource(), mg = off.createGain(); m.buffer = bufs[1]; m.loop = true; m.connect(mg); mg.connect(off.destination); applyMusicGain(mg, P, dur, 0, 0); m.start(0) }
        S.cues.forEach(function (c, i) { var b = bufs[2 + i]; if (!b || c.off) return; var s = off.createBufferSource(), g = off.createGain(); g.gain.value = (c.vol || .6) * S.sfxVol; s.buffer = b; s.connect(g); g.connect(off.destination); s.start(Math.max(0, c.t)) });
        return off.startRendering();
      }).then(function (buf) { return SD.loudness(buf, -14, -1) });
  };
  /* live preview from time t0 (returns a stop function) */
  var LIVE = null;
  SD.play = function (P, t0, dur, blobs) {
    SD.stop();
    var S = SD.cfg(P), ctx = new (window.AudioContext || window.webkitAudioContext)(), live = { ctx: ctx, srcs: [], t0: t0, base: 0 };
    LIVE = live;
    return Promise.all([blobs.narr ? SD.decode(P.id + ':narr', blobs.narr) : null, blobs.music ? SD.decode(P.id + ':music', blobs.music) : null].concat(S.cues.map(function (c) { var b = blobs.sfx && blobs.sfx[c.id]; return b ? SD.decode(P.id + ':sfx:' + c.id + ':' + (c.pickKey || ''), b) : null })))
      .then(function (bufs) {
        if (LIVE !== live) return live;
        var base = ctx.currentTime + .08; live.base = base;
        if (bufs[0]) { var n = ctx.createBufferSource(), ng = ctx.createGain(); ng.gain.value = S.narrVol; n.buffer = bufs[0]; n.connect(ng); ng.connect(ctx.destination); n.start(base, t0); live.srcs.push(n) }
        if (bufs[1]) { var m = ctx.createBufferSource(), mg = ctx.createGain(); m.buffer = bufs[1]; m.loop = true; m.connect(mg); mg.connect(ctx.destination); applyMusicGain(mg, P, dur, t0, base); m.start(base, t0 % bufs[1].duration); live.srcs.push(m) }
        S.cues.forEach(function (c, i) { var b = bufs[2 + i]; if (!b || c.off || c.t + b.duration < t0) return; var s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = (c.vol || .6) * S.sfxVol; s.buffer = b; s.connect(g); g.connect(ctx.destination); if (c.t >= t0) s.start(base + (c.t - t0)); else s.start(base, t0 - c.t); live.srcs.push(s) });
        return live;
      });
  };
  SD.now = function () { return LIVE && LIVE.base ? LIVE.t0 + (LIVE.ctx.currentTime - LIVE.base) : null };
  SD.stop = function () { if (!LIVE) return; var l = LIVE; LIVE = null; l.srcs.forEach(function (s) { try { s.stop() } catch (e) { } }); try { l.ctx.close() } catch (e) { } };
  SD.playOne = function (key, blob, vol) {
    return SD.decode(key, blob).then(function (b) { var ctx = new (window.AudioContext || window.webkitAudioContext)(), s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = vol || .8; s.buffer = b; s.connect(g); g.connect(ctx.destination); s.start(); s.onended = function () { ctx.close() } });
  };
  /* a gentle gain so the mix sits near the target loudness without clipping */
  SD.loudness = function (buf, target, ceil) {
    var ch = [], n = buf.length, sum = 0, cnt = 0, pk = 0; for (var c = 0; c < buf.numberOfChannels; c++) ch.push(buf.getChannelData(c));
    var win = 4800; for (var i = 0; i + win <= n; i += win) { var a = 0; for (var j = i; j < i + win; j++) { var x = ch[0][j]; a += x * x; var y = Math.abs(x); if (y > pk) pk = y; if (ch[1]) { y = Math.abs(ch[1][j]); if (y > pk) pk = y } } a /= win; if (a > 1e-5) { sum += a; cnt++ } }
    if (!cnt || !pk) return buf;
    var rms = 10 * Math.log10(sum / cnt), g = Math.min(6, Math.pow(10, (target - 2 - rms) / 20)), lim = Math.pow(10, ceil / 20);
    var soft = function (v) { var a = Math.abs(v); return a <= lim * .8 ? v : Math.sign(v) * (lim * .8 + (lim * .2) * Math.tanh((a - lim * .8) / (lim * .2))) };
    ch.forEach(function (d) { for (var i = 0; i < n; i++) d[i] = soft(d[i] * g) });
    return buf;
  };
})();
