/* SOUND — the whole soundtrack is rendered OFFLINE in one pass (frame-exact, same in preview and export):
   sound effects (layered, panned, reverb), automatic foley, ambience beds and a mood-driven music score.
   K.SND.render({duration, events, beds, music, speech, mix}) -> Promise<AudioBuffer>
   LOCKED: AI chats never edit this file. */
(function () {
  var K = window.KIT, SND = {}; K.SND = SND;
  var SR = 44100;
  function rnd(seed) { var s = seed || 1; return function () { s = (s * 16807) % 2147483647; return s / 2147483647 } }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12) }

  /* ---------------- buffers made once per render ---------------- */
  function noiseBuf(ctx, kind, sec) {
    var n = Math.floor(sec * ctx.sampleRate), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), r = rnd(kind.length * 977), last = 0, b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < n; i++) {
      var w = r() * 2 - 1;
      if (kind === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.5 }
      else if (kind === 'pink') { b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * .1848) * .2 }
      else d[i] = w;
    }
    return b;
  }
  function impulse(ctx, sec, decay) {
    var n = Math.floor(sec * ctx.sampleRate), b = ctx.createBuffer(2, n, ctx.sampleRate), r = rnd(31);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) { var x = i / n; d[i] = (r() * 2 - 1) * Math.pow(1 - x, decay) * (i < 80 ? i / 80 : 1) } }
    return b;
  }
  var PLUCKS = {};
  function pluckBuf(ctx, midi, bright) { // Karplus-Strong plucked string
    var key = midi + ':' + bright; if (PLUCKS[key] && PLUCKS[key].sampleRate === ctx.sampleRate) return PLUCKS[key];
    var f = mtof(midi), N = Math.max(2, Math.round(ctx.sampleRate / f)), len = Math.floor(ctx.sampleRate * 2.6), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0), r = rnd(midi * 13 + 7);
    for (var i = 0; i < N; i++) d[i] = (r() * 2 - 1) * .8;
    var damp = bright ? .4985 : .497;
    for (i = N; i < len; i++) d[i] = damp * (d[i - N] + d[i - N + 1 < len ? i - N + 1 : i - N]) ;
    var pk = 0; for (i = 0; i < len; i++) pk = Math.max(pk, Math.abs(d[i])); for (i = 0; i < len; i++) d[i] /= pk || 1;
    PLUCKS[key] = b; return b;
  }

  /* ---------------- the graph ---------------- */
  function Graph(ctx, mix) {
    var g = this; g.ctx = ctx;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25; comp.connect(ctx.destination);
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 45; hp.connect(comp);
    g.master = ctx.createGain(); g.master.gain.value = .9; g.master.connect(hp);
    g.verb = ctx.createConvolver(); g.verb.buffer = impulse(ctx, 2.2, 3.2); var vg = ctx.createGain(); vg.gain.value = .9; g.verb.connect(vg); vg.connect(g.master);
    function bus(v, wet) { var b = ctx.createGain(); b.gain.value = v; b.connect(g.master); var s = ctx.createGain(); s.gain.value = wet; b.connect(s); s.connect(g.verb); return b }
    g.sfx = bus((mix.sfx === undefined ? 1 : mix.sfx) * .9, .16);
    g.amb = bus((mix.amb === undefined ? 1 : mix.amb) * (mix.sfx === undefined ? 1 : mix.sfx) * .8, .1);
    g.music = bus((mix.music === undefined ? .25 : mix.music) * 3.4, .42);
    g.white = noiseBuf(ctx, 'white', 3); g.pink = noiseBuf(ctx, 'pink', 3); g.brown = noiseBuf(ctx, 'brown', 4);
  }
  Graph.prototype.out = function (dest, pan, gain) { // a panned, gained input into a bus
    var ctx = this.ctx, gn = ctx.createGain(); gn.gain.value = gain === undefined ? 1 : gain;
    if (ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan || 0)); gn.connect(p); p.connect(dest) } else gn.connect(dest);
    return gn;
  };
  Graph.prototype.noise = function (kind, t, dur, dest, filt, f0, f1, q, a, peak, rel) { // shaped noise burst
    var ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = this[kind] || this.white; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = filt || 'bandpass'; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q || 1;
    var e = ctx.createGain(); env(e.gain, t, a || .005, dur, peak || .3, rel);
    s.connect(f); f.connect(e); e.connect(dest); s.start(t, (t * 7.31) % 2); s.stop(t + dur + (rel || .05) + .05);
    return f;
  };
  Graph.prototype.tone = function (type, t, f0, f1, dur, dest, peak, a, rel) {
    var ctx = this.ctx, o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    var e = ctx.createGain(); env(e.gain, t, a || .004, dur, peak || .2, rel); o.connect(e); e.connect(dest); o.start(t); o.stop(t + dur + (rel || .05) + .05); return o;
  };
  Graph.prototype.pluck = function (t, midi, dest, peak, bright) {
    var ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = pluckBuf(ctx, midi, bright);
    var e = ctx.createGain(); e.gain.value = peak || .2; s.connect(e); e.connect(dest); s.start(t); s.stop(t + 2.6);
  };
  function env(p, t, a, dur, peak, rel) { p.setValueAtTime(0, t); p.linearRampToValueAtTime(peak, t + a); p.setTargetAtTime(0, t + Math.max(a, dur * .35), Math.max(.01, (dur - a) * .35 + (rel || 0))) }

  /* ---------------- sound effects ---------------- */
  var FX = {
    step: function (G, t, d, o) { var r = rnd(Math.floor(t * 997)); for (var i = 0; i < 4; i++) G.noise('pink', t + i * .012 + r() * .01, .05, d, 'bandpass', 900 + r() * 1400, 0, 1.4, .002, .16 * (1 - i * .2)); G.noise('brown', t, .09, d, 'lowpass', 220, 0, .7, .004, .5); },
    sneak: function (G, t, d) { var r = rnd(Math.floor(t * 991)); for (var i = 0; i < 3; i++) G.noise('pink', t + i * .02 + r() * .01, .05, d, 'bandpass', 1400 + r() * 1200, 0, 1.6, .004, .07); },
    rustle: function (G, t, d, o) { var L = (o && o.length) || .7, r = rnd(Math.floor(t * 31)); for (var i = 0; i < L * 40; i++) G.noise('white', t + r() * L, .03 + r() * .03, d, 'highpass', 2500 + r() * 3000, 0, .7, .003, .05 + r() * .05); },
    cloth: function (G, t, d) { G.noise('pink', t, .22, d, 'bandpass', 1800, 900, .8, .04, .09) },
    whoosh: function (G, t, d, o) { var L = (o && o.length) || .45; G.noise('pink', t, L, d, 'bandpass', 250, 2400, 1.2, L * .45, .32) },
    swish: function (G, t, d) { G.noise('white', t, .2, d, 'bandpass', 2600, 700, 2, .03, .16) },
    scrape: function (G, t, d) { G.noise('white', t, .25, d, 'bandpass', 3200, 2400, 3, .01, .08); G.tone('sawtooth', t, 180, 150, .2, d, .02) },
    clink: function (G, t, d) { [1, 2.32, 4.25, 6.63].forEach(function (k, i) { G.tone('sine', t + i * .002, 1180 * k, 0, .9 - i * .15, d, .07 / (i + 1), .001) }); G.noise('white', t, .02, d, 'highpass', 4000, 0, .7, .001, .08) },
    tada: function (G, t, d) { [72, 76, 79, 84].forEach(function (m, i) { G.pluck(t + i * .08, m, d, .3, true) }) },
    thud: function (G, t, d) { G.tone('sine', t, 120, 55, .3, d, .4, .003); G.noise('pink', t, .18, d, 'bandpass', 260, 140, 1.2, .002, .7); G.noise('pink', t, .03, d, 'bandpass', 1800, 0, 1, .001, .12) },
    pop: function (G, t, d) { G.tone('sine', t, 380, 1300, .07, d, .3, .002); G.noise('white', t, .015, d, 'highpass', 3000, 0, .7, .001, .1) },
    poof: function (G, t, d) { G.noise('pink', t, .35, d, 'lowpass', 1800, 400, .8, .01, .25) },
    tick: function (G, t, d) { G.noise('white', t, .02, d, 'bandpass', 4200, 0, 6, .001, .35); G.noise('white', t + .5, .02, d, 'bandpass', 3100, 0, 6, .001, .28) },
    snore: function (G, t, d, o) { var L = (o && o.length) || 1.6; G.noise('brown', t, L * .55, d, 'bandpass', 320, 0, 3, L * .3, .5); G.tone('sawtooth', t, 62, 58, L * .5, d, .03, L * .3) ; G.noise('pink', t + L * .62, L * .35, d, 'highpass', 1800, 0, .7, .1, .05) },
    boom: function (G, t, d) { G.tone('sine', t, 110, 45, 1.2, d, .32, .005); G.noise('pink', t, 1.1, d, 'lowpass', 900, 150, .7, .005, .45); G.noise('pink', t, .06, d, 'bandpass', 2000, 0, .8, .001, .15) }, // mid-heavy so it is heard on phone speakers
    sting: function (G, t, d) { [57, 64, 69, 72, 76].forEach(function (m, i) { G.tone('triangle', t + i * .012, mtof(m) * (1 + (i % 2 ? .003 : -.003)), 0, 2.2, d, .05, .015, .7) }); G.tone('sine', t, 110, 80, 1.2, d, .25, .005); G.noise('white', t, 1.4, d, 'highpass', 5000, 0, .7, .01, .03) },
    riser: function (G, t, d, o) { var L = (o && o.length) || 1.5; G.noise('pink', t, L, d, 'bandpass', 300, 4200, 2.5, L * .9, .22); G.tone('sawtooth', t, 110, 440, L, d, .035, L * .9) },
    heartbeat: function (G, t, d) { [[0, .6], [.24, .45]].forEach(function (h) { G.tone('sine', t + h[0], 130, 70, .14, d, h[1], .003); G.noise('pink', t + h[0], .1, d, 'bandpass', 180, 0, 1.5, .003, h[1]) }) },
    dirt: function (G, t, d, o) { var L = (o && o.length) || .9, r = rnd(Math.floor(t * 53)); for (var i = 0; i < L * 55; i++) G.noise('pink', t + r() * L, .02 + r() * .04, d, 'bandpass', 500 + r() * 1800, 0, 1.2, .002, .06 + r() * .08); G.noise('brown', t, L * .6, d, 'lowpass', 260, 0, .7, .05, .25) },
    bubble: function (G, t, d) { var r = rnd(Math.floor(t * 71)); for (var i = 0; i < 5; i++) { var f = 300 + r() * 500; G.tone('sine', t + i * (.05 + r() * .08), f, f * 2.2, .06, d, .12, .002) } },
    boing: function (G, t, d) { var o = G.tone('sine', t, 220, 90, .5, d, .25, .004); var l = G.ctx.createOscillator(), lg = G.ctx.createGain(); l.frequency.value = 14; lg.gain.value = 30; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + .6) },
    drip: function (G, t, d) { G.tone('sine', t, 900, 1700, .05, d, .18, .001) },
    splash: function (G, t, d) { G.noise('white', t, .5, d, 'bandpass', 1400, 600, .8, .005, .3); FX.bubble(G, t + .05, d) },
    bell: function (G, t, d) { [1, 2.76, 5.4].forEach(function (k, i) { G.tone('sine', t, 660 * k, 0, 2.2 - i * .5, d, .1 / (i + 1), .002) }) }
  };
  SND.FX = Object.keys(FX);

  /* ---------------- pre-built loops for busy textures (fast: one buffer instead of thousands of nodes) ---------------- */
  var LOOPS = {};
  function synthLoop(ctx, name, sec, fill) {
    if (LOOPS[name] && LOOPS[name].sampleRate === ctx.sampleRate) return LOOPS[name];
    var n = Math.floor(sec * ctx.sampleRate), b = ctx.createBuffer(2, n, ctx.sampleRate), L = b.getChannelData(0), R = b.getChannelData(1);
    fill(L, R, ctx.sampleRate, n, rnd(name.length * 101)); LOOPS[name] = b; return b;
  }
  function addTone(L, R, sr, t0, f, dur, amp, pan, f1) { var s0 = Math.floor(t0 * sr), n = Math.floor(dur * sr), ph = 0, gl = amp * (1 - Math.max(0, pan)), gr = amp * (1 + Math.min(0, pan));
    for (var i = 0; i < n && s0 + i < L.length; i++) { var x = i / n, fr = f1 ? f * Math.pow(f1 / f, x) : f; ph += 2 * Math.PI * fr / sr; var e = Math.sin(Math.PI * x), v = Math.sin(ph) * e; L[s0 + i] += v * gl; R[s0 + i] += v * gr } }
  function addClick(L, R, sr, t0, f, amp, pan, r) { var s0 = Math.floor(t0 * sr), n = Math.floor(.012 * sr), gl = amp * (1 - Math.max(0, pan)), gr = amp * (1 + Math.min(0, pan));
    for (var i = 0; i < n && s0 + i < L.length; i++) { var v = Math.sin(2 * Math.PI * f * i / sr) * Math.exp(-i / (n * .18)) + (r() - .5) * .4 * Math.exp(-i / (n * .08)); L[s0 + i] += v * gl; R[s0 + i] += v * gr } }
  var TEX = {
    crickets: function (L, R, sr, n, r) { var sec = n / sr; [[-.6, 4300, .5], [.45, 4560, .38], [.1, 4820, .26]].forEach(function (c) { for (var t = r() * 1.2; t < sec - .3; t += .9 + r() * .9) for (var p = 0; p < 3; p++) addTone(L, R, sr, t + p * .055, c[1], .03, c[2], c[0]) }) },
    birds: function (L, R, sr, n, r) { var sec = n / sr; for (var t = r() * 2; t < sec - .5; t += 1.8 + r() * 2.6) { var f0 = 2600 + r() * 1400, pan = r() * 1.2 - .6; for (var q = 0; q < 2 + Math.floor(r() * 3); q++) addTone(L, R, sr, t + q * .11, f0, .07, .35, pan, f0 * (1.3 + r() * .4)) } },
    raindrops: function (L, R, sr, n, r) { var sec = n / sr; for (var t = 0; t < sec - .02; t += .02 + r() * .05) addClick(L, R, sr, t, 2200 + r() * 3200, .08 + r() * .1, r() * 1.6 - .8, r) },
    bubbles: function (L, R, sr, n, r) { var sec = n / sr; for (var t = r(); t < sec - .5; t += .4 + r() * 1.3) { var pan = r() * 1.2 - .6; for (var i = 0; i < 4; i++) { var f = 300 + r() * 500; addTone(L, R, sr, t + i * (.05 + r() * .08), f, .06, .25, pan, f * 2.2) } } },
    crackle: function (L, R, sr, n, r) { var sec = n / sr; for (var t = 0; t < sec - .02; t += .05 + r() * .25) addClick(L, R, sr, t, 3000 + r() * 2000, .15 + r() * .2, r() - .5, r) }
  };
  function texLoop(G, lvl, name, sec, a, b, gain) { var s = G.ctx.createBufferSource(); s.buffer = synthLoop(G.ctx, name, sec, TEX[name]); s.loop = true; var g = G.ctx.createGain(); g.gain.value = gain; s.connect(g); g.connect(lvl); s.start(a, (a * 3.7) % sec); s.stop(b + .1) }

  /* ---------------- ambience beds ---------------- */
  function bed(G, kind, a, b, gain) {
    var ctx = G.ctx, dest = G.out(G.amb, 0, 1), fade = Math.min(1.2, (b - a) / 3), r = rnd(Math.floor(a * 100) + kind.length);
    var lvl = ctx.createGain(); lvl.connect(dest); lvl.gain.setValueAtTime(0, a); lvl.gain.linearRampToValueAtTime(gain, a + fade); lvl.gain.setValueAtTime(gain, Math.max(a + fade, b - fade)); lvl.gain.linearRampToValueAtTime(0, b);
    function loop(kind2, filt, f, q, v) { var s = ctx.createBufferSource(); s.buffer = G[kind2]; s.loop = true; var fl = ctx.createBiquadFilter(); fl.type = filt; fl.frequency.value = f; fl.Q.value = q || .7; var gg = ctx.createGain(); gg.gain.value = v; s.connect(fl); fl.connect(gg); gg.connect(lvl); s.start(a, r() * 2); s.stop(b + .1); return gg }
    var t;
    if (kind === 'night' || kind === 'day') {
      var wind = loop('pink', 'bandpass', 420, .45, .045), lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = .08; lg.gain.value = .025; lfo.connect(lg); lg.connect(wind.gain); lfo.start(a); lfo.stop(b);
      if (kind === 'night') texLoop(G, lvl, 'crickets', 9.3, a, b, .055); else texLoop(G, lvl, 'birds', 11.7, a, b, .09);
    } else if (kind === 'rain') {
      loop('white', 'highpass', 2500, .5, .025); loop('pink', 'bandpass', 900, .4, .05);
      texLoop(G, lvl, 'raindrops', 4.7, a, b, .22);
    } else if (kind === 'underwater') {
      loop('brown', 'lowpass', 260, .8, .2);
      texLoop(G, lvl, 'bubbles', 7.3, a, b, .5);
    } else if (kind === 'room') { loop('pink', 'lowpass', 300, .5, .1) }
    else if (kind === 'fire') { loop('brown', 'lowpass', 500, .6, .25); texLoop(G, lvl, 'crackle', 5.1, a, b, .4) }
  }
  SND.BEDS = ['night', 'day', 'rain', 'underwater', 'room', 'fire', 'none'];

  /* ---------------- music: a small piano-led score, one shared clock ----------------
     Real piano samples (kit/piano.js) when present, plucked strings otherwise.
     Each mood has its own left-hand pattern, melody rhythm, register and string pad. */
  var PIANO = null, PIANO_TRY = null;
  function loadPiano(ctx) {
    if (PIANO) return Promise.resolve(PIANO);
    var S = K.SAMPLES && K.SAMPLES.piano; if (!S) return Promise.resolve(null);
    return Promise.all(Object.keys(S).map(function (k) {
      var bin = atob(S[k]), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return new Promise(function (ok) { try { ctx.decodeAudioData(u.buffer, function (buf) { ok([+k, buf]) }, function () { ok(null) }) } catch (e) { ok(null) } });
    })).then(function (all) { var m = {}, n = 0; all.forEach(function (e) { if (e) { m[e[0]] = e[1]; n++ } }); PIANO = n ? m : null; return PIANO });
  }
  Graph.prototype.key = function (t, midi, dest, vel, len) { // one piano note (vel 0..1, len = how long the key is held)
    var ctx = this.ctx; t = Math.max(0, t); vel = Math.max(.05, Math.min(1, vel)); len = len || 1.2;
    if (!PIANO) { this.pluck(t, midi, dest, .22 * vel, vel > .6); return }
    var best = null, bd = 99; for (var k in PIANO) { var d = Math.abs(midi - k); if (d < bd) { bd = d; best = +k } }
    var s = ctx.createBufferSource(); s.buffer = PIANO[best]; s.playbackRate.value = Math.pow(2, (midi - best) / 12);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800 + 6500 * vel * vel; // soft notes are darker, like a real piano
    var e = ctx.createGain(), g = 1.5 * Math.pow(vel, 1.3), off = t + Math.min(len, 3.2);
    e.gain.setValueAtTime(g, t); e.gain.setValueAtTime(g, off); e.gain.setTargetAtTime(0, off, .12);
    s.connect(lp); lp.connect(e); e.connect(dest); s.start(t); s.stop(Math.min(t + 3.6, off + .7));
  };
  // chords as [root, ...upper voices]; scale = notes the melody may use
  var STY = {
    calm: { ch: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 67]], sc: [60, 62, 64, 67, 69, 72, 74, 76], lh: 'arp', mel: [1, 0, 0, 0, 1, 0, 0, 0], reg: 0, pad: .5, vel: .45 },
    playful: { ch: [[48, 52, 55, 60], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]], sc: [60, 62, 64, 67, 69, 72, 74, 76, 79], lh: 'stride', mel: [1, 0, 1, 1, 0, 1, 1, 0], reg: 0, pad: .15, vel: .55, stacc: true, shaker: true },
    mystery: { ch: [[50, 53, 57, 60], [46, 53, 57, 62], [43, 50, 55, 58], [45, 52, 57, 61]], sc: [62, 65, 67, 69, 72, 74], lh: 'drone', mel: [0, 0, 0, 1, 0, 0, 0, 0], reg: 12, pad: .8, vel: .35, sparse: true },
    tension: { ch: [[45, 48, 52], [41, 48, 53], [46, 50, 53], [44, 47, 52]], sc: [69, 70, 72, 75, 76], lh: 'ostinato', mel: [0, 0, 0, 0, 0, 0, 0, 0], reg: 0, pad: .7, vel: .5, pulse: true },
    hope: { ch: [[53, 57, 60, 65], [48, 55, 60, 64], [50, 57, 62, 65], [55, 59, 62, 67]], sc: [65, 67, 69, 72, 74, 77, 79, 81], lh: 'flow', mel: [1, 0, 1, 0, 1, 0, 1, 1], reg: 0, pad: .7, vel: .55 },
    sad: { ch: [[57, 60, 64], [52, 55, 59], [53, 57, 60], [50, 53, 57]], sc: [64, 65, 67, 69, 71, 72, 74, 76], lh: 'half', mel: [1, 0, 0, 0, 0, 0, 1, 0], reg: 0, pad: .8, vel: .38 },
    flashback: { ch: [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]], sc: [72, 74, 76, 79, 81, 84], lh: 'box', mel: [1, 0, 0, 1, 0, 0, 1, 0], reg: 12, pad: .25, vel: .4, old: true }
  };
  SND.MUSIC = Object.keys(STY);
  function music(G, segs, speech, base) {
    var ctx = G.ctx, beat = 60 / 72, bar = beat * 4, e8 = beat / 2;
    var bus = ctx.createGain(); bus.connect(G.music);
    // dip (not mute) under the narration, come back up in the gaps
    bus.gain.setValueAtTime(1, 0);
    (speech || []).forEach(function (r) { bus.gain.setTargetAtTime(.6, Math.max(0, r[0] - .3), .15); bus.gain.setTargetAtTime(1, r[1] + .15, .5) });
    var lastMel = 72;
    segs.forEach(function (sg, si) {
      var S = STY[sg.style]; if (!S) return;
      var a = sg.from, b = sg.to, r = rnd(si * 131 + 17), lvl = ctx.createGain(), fade = Math.min(1.5, (b - a) / 3); lvl.connect(bus);
      lvl.gain.setValueAtTime(0, Math.max(0, a - .05)); lvl.gain.linearRampToValueAtTime(1, a + fade); lvl.gain.setValueAtTime(1, Math.max(a + fade, b - fade)); lvl.gain.linearRampToValueAtTime(0, b + 1);
      var tone = lvl; if (S.old) { tone = ctx.createBiquadFilter(); tone.type = 'bandpass'; tone.frequency.value = 1500; tone.Q.value = .5; tone.connect(lvl) }
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(lvl);
      var L = G.out(tone, -.18, 1), R = G.out(tone, .2, 1);
      function hum() { return (r() - .5) * .018 } // human timing
      function v(x) { return Math.max(.08, Math.min(1, S.vel * x * (.9 + r() * .2))) }
      var phrase = []; // a 2-bar melody idea, repeated with small changes so it feels like a tune
      for (var c0 = Math.floor(a / bar); c0 * bar < b; c0++) {
        var t = c0 * bar, ch = S.ch[c0 % S.ch.length], root = ch[0], up = ch.slice(1);
        var on = function (ts) { return ts >= a - .01 && ts < b };
        // string pad underneath
        if (S.pad) ch.forEach(function (m, i) { if (!on(t) && !on(t + bar - .1)) return; [-.0035, .0035].forEach(function (dt) { var o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m + (i ? 0 : 12)) * (1 + dt); var e = ctx.createGain(), t0 = Math.max(a, t), t1 = Math.min(b + .9, t + bar + .5), pk = .02 * S.pad; e.gain.setValueAtTime(0, t0); e.gain.linearRampToValueAtTime(pk, t0 + 1.4); e.gain.setValueAtTime(pk, Math.max(t0 + 1.4, t1 - .8)); e.gain.linearRampToValueAtTime(0, t1); o.connect(e); e.connect(lp); o.start(t0); o.stop(t1 + .05) }) });
        // left hand
        var lh = S.lh;
        for (var s = 0; s < 8; s++) {
          var ts = t + s * e8 + hum(); if (!on(ts)) continue;
          if (lh === 'arp' && s % 2 === 0) G.key(ts, [root - 12, up[0], up[1], up[0]][s / 2], L, v(s ? .7 : .9), e8 * 3);
          if (lh === 'flow') G.key(ts, [root - 12, root - 5, up[0], up[1], up[2] || up[0] + 12, up[1], up[0], root - 5][s], L, v(s ? .65 : .9), e8 * 2.2);
          if (lh === 'stride') { if (s === 0 || s === 4) G.key(ts, root - 12 + (s ? 7 : 0), L, v(.85), e8 * .9); if (s === 2 || s === 6) up.forEach(function (m) { G.key(ts, m, L, v(.55), e8 * .6) }) }
          if (lh === 'drone' && s === 0) { G.key(ts, root - 24, L, v(.8), bar * 1.2); G.key(ts + .02, root - 12, L, v(.6), bar * 1.2) }
          if (lh === 'ostinato') G.key(ts, root - 12 + (s % 4 === 3 ? 1 : 0), L, v(s % 4 === 0 ? 1 : .6), e8 * .8);
          if (lh === 'half' && (s === 0 || s === 4)) { G.key(ts, root - 12, L, v(.75), bar * .6); up.forEach(function (m, i) { G.key(ts + .03 * (i + 1), m, L, v(.5), bar * .55) }) }
          if (lh === 'box') G.key(ts, up[s % up.length] + 12, R, v(.6), e8 * 2);
        }
        // right hand melody
        var pi = c0 % 2;
        if (!phrase[pi] || r() < .3) {
          var notes = [];
          for (s = 0; s < 8; s++) if (S.mel[s] && (!S.sparse || r() < .6)) {
            var strong = s % 4 === 0, pool = S.sc.map(function (m) { return m + S.reg }).filter(function (m) { return !strong || ch.some(function (c) { return (m - c) % 12 === 0 }) });
            if (!pool.length) pool = S.sc;
            pool.sort(function (x, y) { return Math.abs(x - lastMel) - Math.abs(y - lastMel) });
            var pick = pool[Math.min(pool.length - 1, Math.floor(r() * 3))]; lastMel = pick; notes.push([s, pick]);
          }
          phrase[pi] = notes;
        }
        phrase[pi].forEach(function (n) { var ts = t + n[0] * e8 + hum(); if (on(ts)) G.key(ts, n[1], R, v(n[0] % 4 === 0 ? 1 : .8), S.stacc ? e8 * .7 : e8 * 3) });
        if (S.pulse) for (s = 0; s < 8; s++) { var tp = t + s * e8; if (on(tp)) G.tone('sine', tp, mtof(root - 12) * 2, 0, .1, G.out(lvl, 0, 1), s % 4 ? .03 : .06, .004) }
        if (S.shaker) for (s = 0; s < 8; s++) { var th = t + s * e8 + hum(); if (on(th)) G.noise('white', th, .04, G.out(lvl, .3, 1), 'highpass', 6000, 0, .7, .006, s % 2 ? .05 : .025) }
      }
    });
  }

  /* ---------------- render ---------------- */
  SND.render = function (o) {
    var dur = Math.max(1, o.duration), ctx = new OfflineAudioContext(2, Math.ceil((dur + 1) * SR), SR), G = new Graph(ctx, o.mix || {});
    return loadPiano(ctx).then(function () {
      (o.beds || []).forEach(function (b) { if (b.kind !== 'none' && b.to > b.from) bed(G, b.kind, b.from, b.to, b.gain === undefined ? 1 : b.gain) });
      if (o.music && o.music.length) music(G, o.music, o.speech, 1);
      (o.events || []).forEach(function (e) { var fn = FX[e.type]; if (!fn || e.t < 0 || e.t > dur) return; try { fn(G, e.t, G.out(G.sfx, e.pan || 0, e.gain === undefined ? 1 : e.gain), e) } catch (err) { } });
      return ctx.startRendering();
    });
  };
})();
