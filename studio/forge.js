/* FORGE — sound effects made by code (no recorded files).
   The rules it follows are in docs/SOUND-GUIDE.md. In short:
   - one sound at a time, at most 5 layers, and every layer has one job (snap, body, texture, tail, air);
   - layers follow each other logically in time (the snap comes first, the body after it, the tail last);
   - physics decides the shape: a bigger thing is lower and longer, a far thing loses its highs and gets more echo;
   - every sound is checked with numbers before it is used (no clipping, no clicks, the right length, brightness and attack).
   FORGE.match(words) -> {name, p} | null      FORGE.render(name, p) -> Promise<AudioBuffer>
   FORGE.blob(code) -> Promise<Blob (WAV)>     FORGE.check(buf, name) -> {pass, lines}
   FORGE.candidates(words, n) -> list for the Sound page (kind 'code') */
(function () {
  'use strict';
  var F = {}; window.FORGE = F;
  var SR = 48000;
  function rng(seed) { var a = (seed >>> 0) || 1; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }

  /* ---------- the toolbox every layer uses ---------- */
  function Kit(ctx, seed) {
    var k = this, r = rng(seed); k.ctx = ctx; k.r = r;
    function nb(kind, sec) {
      var n = Math.floor(sec * ctx.sampleRate), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), last = 0, b0 = 0, b1 = 0, b2 = 0, pk = 0, i;
      for (i = 0; i < n; i++) {
        var w = r() * 2 - 1;
        if (kind === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last }
        else if (kind === 'pink') { b0 = .99765 * b0 + w * .099046; b1 = .963 * b1 + w * .2965164; b2 = .57 * b2 + w * 1.0526913; d[i] = b0 + b1 + b2 + w * .1848 }
        else d[i] = w;
      }
      var m = 0; for (i = 0; i < n; i++) m += d[i]; m /= n; for (i = 0; i < n; i++) { d[i] -= m; pk = Math.max(pk, Math.abs(d[i])) } for (i = 0; i < n; i++) d[i] /= pk || 1;
      return b;
    }
    k.buf = { white: nb('white', 3), pink: nb('pink', 3), brown: nb('brown', 4) };
  }
  /* a gain envelope: rise in `a` seconds to `peak`, then fall with time constant `decay` (about 5x decay to silence) */
  Kit.prototype.env = function (g, t, a, peak, decay) { g.setValueAtTime(0, t); g.linearRampToValueAtTime(peak, t + Math.max(.0005, a)); g.setTargetAtTime(0, t + Math.max(.0005, a), Math.max(.001, decay)); return t + a + decay * 7 };
  /* shaped noise: o = {kind, type, f0, f1, q, a, peak, decay, pan, glide, t2: second filter} */
  Kit.prototype.noise = function (dest, t, o) {
    var ctx = this.ctx, s = ctx.createBufferSource(); s.buffer = this.buf[o.kind || 'white']; s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f0 || 1000, t); f.Q.value = o.q == null ? 1 : o.q;
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + (o.glide || o.decay * 3 || .2));
    var g = ctx.createGain(), end = this.env(g.gain, t, o.a || .002, o.peak == null ? .5 : o.peak, o.decay || .1), last = f;
    s.connect(f);
    if (o.t2) { var f2 = ctx.createBiquadFilter(); f2.type = o.t2; f2.frequency.value = o.f2 || 500; f.connect(f2); last = f2 }
    last.connect(g); g.connect(this.pan(dest, o.pan));
    s.start(t, this.r() * 2); s.stop(end + .05); return end;
  };
  /* a tone with a pitch glide: o = {type, f0, f1, glide, a, peak, decay, pan} */
  Kit.prototype.tone = function (dest, t, o) {
    var ctx = this.ctx, s = ctx.createOscillator(); s.type = o.type || 'sine'; s.frequency.setValueAtTime(o.f0, t);
    if (o.f1) s.frequency.exponentialRampToValueAtTime(o.f1, t + (o.glide || .1));
    var g = ctx.createGain(), end = this.env(g.gain, t, o.a || .002, o.peak == null ? .5 : o.peak, o.decay || .1);
    var last = s; if (o.lp) { var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; s.connect(f); last = f }
    last.connect(g); g.connect(this.pan(dest, o.pan)); s.start(t); s.stop(end + .05); return end;
  };
  Kit.prototype.pan = function (dest, p) { if (!p) return dest; var n = this.ctx.createStereoPanner(); n.pan.value = clamp(p, -1, 1); n.connect(dest); return n };
  /* a swell: exponential rise to `peak` at `top`, then fall to silence at `end` */
  Kit.prototype.swell = function (g, t, top, end, peak) { g.setValueAtTime(.0001, t); g.exponentialRampToValueAtTime(Math.max(.0002, peak), t + top); g.exponentialRampToValueAtTime(.0001, t + end); g.setValueAtTime(0, t + end + .01) };
  /* a looping noise source that runs from t for `dur` (for beds such as wind) */
  Kit.prototype.bed = function (kind, t, dur) { var s = this.ctx.createBufferSource(); s.buffer = this.buf[kind]; s.loop = true; s.start(t, this.r() * 2); s.stop(t + dur + .05); return s };

  /* ---------- the recipes: at most 5 layers each; a layer = one job ---------- */
  var R = {};
  function rec(name, o) { o.name = name; R[name] = o }

  rec('whoosh', { title: 'Whoosh', what: 'Something fast passing the camera, or a quick move.', len: [.5, 1.6], bright: [1000, 5800], attack: .9, dur: function (p) { return .55 + .55 * p.length + .25 * p.size },
    layers: [
      { name: 'air', job: 'the rushing air, swept up and down as it passes', make: function (k, d, p, D) {
        var ctx = k.ctx, top = D * .48, s = k.bed('white', 0, D), f = ctx.createBiquadFilter(), g = ctx.createGain(), pn = ctx.createStereoPanner(), hi = 1800 + 3200 * p.bright - 900 * p.size;
        f.type = 'bandpass'; f.Q.value = 1.1; f.frequency.setValueAtTime(380, 0); f.frequency.exponentialRampToValueAtTime(hi, top); f.frequency.exponentialRampToValueAtTime(500, D);
        k.swell(g.gain, 0, top, D, .9); pn.pan.setValueAtTime(-.75, 0); pn.pan.linearRampToValueAtTime(.75, D); s.connect(f); f.connect(g); g.connect(pn); pn.connect(d) } },
      { name: 'body', job: 'the weight of the thing that passes (lower for bigger things)', make: function (k, d, p, D) {
        var ctx = k.ctx, s = k.bed('pink', 0, D), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 650 - 300 * p.size; k.swell(g.gain, 0, D * .5, D, .35 + .45 * p.size); s.connect(f); f.connect(g); g.connect(d) } },
      { name: 'edge', job: 'a thin whistle on the edge of the air (brightness)', make: function (k, d, p, D) {
        var ctx = k.ctx, s = k.bed('white', 0, D), f = ctx.createBiquadFilter(), g = ctx.createGain(), top = D * .48; f.type = 'bandpass'; f.Q.value = 9; f.frequency.setValueAtTime(900, 0); f.frequency.exponentialRampToValueAtTime(2600 + 2400 * p.bright, top); f.frequency.exponentialRampToValueAtTime(1100, D);
        k.swell(g.gain, 0, top, D, .25 * p.bright + .03); s.connect(f); f.connect(g); g.connect(d) } }
    ] });

  rec('impact', { title: 'Impact', what: 'A hit, punch, slam or deep boom (Size makes it heavier).', len: [.4, 3.2], bright: [200, 1500], attack: .02, dur: function (p) { return (.6 + 1.9 * p.size) * p.length },
    layers: [
      { name: 'snap', job: 'the first contact: a very short bright click', make: function (k, d, p) { k.noise(d, 0, { type: 'highpass', f0: 2200 + 2000 * p.bright, q: .7, a: .0008, peak: .35 + .55 * p.bright, decay: .006 }) } },
      { name: 'punch', job: 'the push you feel: a fast falling low tone', make: function (k, d, p) { k.tone(d, .001, { f0: 160 - 70 * p.size, f1: 52 - 22 * p.size, glide: .12 + .08 * p.size, a: .002, peak: 1, decay: .07 + .14 * p.size }) } },
      { name: 'body', job: 'the material that was hit', make: function (k, d, p) { k.noise(d, .001, { kind: 'pink', type: 'lowpass', f0: 1100 - 650 * p.size + 900 * p.bright, f1: 220, glide: .2, q: .8, a: .002, peak: .7, decay: .08 + .18 * p.size }) } },
      { name: 'tail', job: 'the low rumble that dies away (longer for bigger hits)', make: function (k, d, p) { k.noise(d, .01, { kind: 'brown', type: 'lowpass', f0: 220 - 90 * p.size, q: .6, a: .02, peak: .25 + .5 * p.size, decay: (.18 + .7 * p.size) * p.length }) } }
    ] });

  rec('explosion', { title: 'Explosion', what: 'A real blast: crack, pressure, flying debris and a long rumble. Distance makes it duller and more echoey.', len: [2, 9], bright: [300, 1600], attack: .06, dur: function (p) { return (2.6 + 3.2 * p.size) * p.length },
    layers: [
      { name: 'crack', job: 'the supersonic crack at the very start (dulled by distance)', make: function (k, d, p) { k.noise(d, 0, { type: 'highpass', f0: 900 + 1400 * p.bright, q: .5, a: .0004, peak: 1, decay: .012 }); k.noise(d, .009 + .01 * k.r(), { type: 'bandpass', f0: 2600, q: .8, a: .0005, peak: .6, decay: .02 }) } },
      { name: 'blast', job: 'the fireball: wide noise that darkens quickly', make: function (k, d, p) { k.noise(d, .002, { kind: 'pink', type: 'lowpass', f0: 2400, f1: 150, glide: .75 + .4 * p.size, q: .7, a: .006, peak: 1, decay: .32 + .45 * p.size }); k.noise(d, .002, { kind: 'brown', type: 'lowpass', f0: 900, f1: 120, glide: .9, q: .5, a: .01, peak: .9, decay: .5 + .5 * p.size }) } },
      { name: 'shock', job: 'the pressure wave you feel in the chest (very low)', make: function (k, d, p) { k.tone(d, .004, { f0: 62 - 18 * p.size, f1: 26, glide: .6 + .4 * p.size, a: .012, peak: .95, decay: .3 + .45 * p.size }) } },
      { name: 'debris', job: 'pieces flying and falling: many small bits, then heavier chunks landing later', make: function (k, d, p, D) {
        var n = Math.round(50 + 130 * p.size), span = (1.2 + 2.2 * p.size) * p.length, i, t;
        for (i = 0; i < n; i++) { t = .08 + span * Math.pow(k.r(), 1.8); k.noise(d, t, { type: 'bandpass', f0: 450 + 3000 * k.r() * (.4 + .6 * p.bright), q: 2 + 5 * k.r(), a: .001, peak: (.04 + .16 * k.r()) * Math.max(.25, 1 - t / (span + .3)), decay: .006 + .025 * k.r(), pan: k.r() * 1.4 - .7 }) }
        var ch = Math.round(4 + 10 * p.size); for (i = 0; i < ch; i++) { t = .45 + (span + .4) * k.r(); k.noise(d, t, { kind: 'pink', type: 'lowpass', f0: 380 + 300 * k.r(), q: .8, a: .002, peak: .18 + .25 * k.r(), decay: .05 + .06 * k.r(), pan: k.r() * 1.2 - .6 }) } } },
      { name: 'rumble', job: 'the long low roll that echoes away', make: function (k, d, p) { k.noise(d, .03, { kind: 'brown', type: 'lowpass', f0: 140 - 40 * p.size, q: .5, a: .12, peak: .8, decay: (.7 + 1.1 * p.size) * p.length }) } }
    ] });

  rec('thud', { title: 'Thud', what: 'A body or soft heavy thing falling on the ground.', len: [.3, 1.4], bright: [230, 1350], attack: .03, dur: function (p) { return (.45 + .4 * p.size) * p.length },
    layers: [
      { name: 'thump', job: 'the low weight landing', make: function (k, d, p) { k.tone(d, 0, { f0: 105 - 30 * p.size, f1: 42, glide: .1, a: .003, peak: 1, decay: .06 + .07 * p.size }) } },
      { name: 'muffle', job: 'the soft dull body of the fall', make: function (k, d, p) { k.noise(d, 0, { kind: 'pink', type: 'lowpass', f0: 450 + 300 * p.bright, q: .7, a: .003, peak: .75, decay: .07 + .08 * p.size }) } },
      { name: 'scuff', job: 'cloth and dust right after landing', make: function (k, d, p) { k.noise(d, .012, { type: 'bandpass', f0: 2300, q: .9, a: .006, peak: .08 + .15 * p.bright, decay: .04 }) } }
    ] });

  rec('heartbeat', { title: 'Heartbeat', what: 'Lub-dub heart beats. Length adds beats; Brightness makes it faster (more fear).', len: [.8, 6], bright: [60, 120], attack: .03, dur: function (p) { var n = Math.max(1, Math.round(2 * p.length)); return n * (.9 - .35 * p.bright) + .35 },
    layers: [
      { name: 'lub', job: 'the first, deeper beat', make: function (k, d, p) { var n = Math.max(1, Math.round(2 * p.length)), gap = .9 - .35 * p.bright; for (var i = 0; i < n; i++) { k.tone(d, i * gap, { f0: 62, f1: 42, glide: .08, a: .006, peak: 1, decay: .06 + .02 * p.size }); k.noise(d, i * gap, { kind: 'brown', type: 'lowpass', f0: 140, a: .006, peak: .5, decay: .05 }) } } },
      { name: 'dub', job: 'the second, lighter beat a moment later', make: function (k, d, p) { var n = Math.max(1, Math.round(2 * p.length)), gap = .9 - .35 * p.bright; for (var i = 0; i < n; i++) k.tone(d, i * gap + .26 - .05 * p.bright, { f0: 78, f1: 52, glide: .07, a: .005, peak: .62, decay: .05 }) } }
    ] });

  rec('beep', { title: 'Beep', what: 'An electronic beep: thermometer, monitor or alarm. Length = how many beeps.', len: [.15, 3], bright: [2200, 4000], attack: .02, dur: function (p) { return beeps(p) * .24 + .12 },
    layers: [
      { name: 'tone', job: 'the clean electronic tone', make: function (k, d, p) { var n = beeps(p), f = 2100 + 1800 * p.bright - 900 * p.size; for (var i = 0; i < n; i++) { var t = i * .24, o = k.ctx.createOscillator(), g = k.ctx.createGain(), lp = k.ctx.createBiquadFilter(); o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 7000; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.8, t + .004); g.gain.setValueAtTime(.8, t + .12); g.gain.linearRampToValueAtTime(0, t + .132); o.connect(lp); lp.connect(g); g.connect(d); o.start(t); o.stop(t + .15) } } },
      { name: 'click', job: 'the tiny speaker click as each beep starts', make: function (k, d, p) { for (var i = 0; i < beeps(p); i++) k.noise(d, i * .24, { type: 'highpass', f0: 4000, a: .0005, peak: .08, decay: .002 }) } }
    ] });
  function beeps(p) { return p.count || Math.max(1, Math.round(p.length)) }

  rec('click', { title: 'Click', what: 'A button, switch or clock tick.', len: [.03, .4], bright: [1100, 4600], attack: .01, dur: function () { return .16 },
    layers: [
      { name: 'tick', job: 'the hard plastic or metal contact', make: function (k, d, p) { k.noise(d, 0, { type: 'bandpass', f0: 2600 + 2600 * p.bright, q: 2.5, a: .0005, peak: 1, decay: .004 }) } },
      { name: 'body', job: 'the small ring of the casing', make: function (k, d, p) { k.tone(d, .0008, { f0: 2000 - 700 * p.size, f1: 1300 - 500 * p.size, glide: .02, a: .001, peak: .28, decay: .012 }) } }
    ] });

  rec('ice', { title: 'Ice crack', what: 'Ice cracking: sharp snaps, splinters, the laser-like ping of lake ice and a low groan.', len: [.6, 3], bright: [1300, 4200], attack: .08, dur: function (p) { return (1 + .6 * p.size) * p.length },
    layers: [
      { name: 'snaps', job: 'the sharp first cracks', make: function (k, d, p) { var n = 3 + Math.round(3 * k.r()); for (var i = 0; i < n; i++) k.noise(d, i === 0 ? 0 : .02 + .22 * k.r(), { type: 'highpass', f0: 1800 + 1500 * p.bright, q: .8, a: .0004, peak: i === 0 ? 1 : .4 + .5 * k.r(), decay: .003 + .008 * k.r(), pan: k.r() * .6 - .3 }) } },
      { name: 'splinters', job: 'tiny pieces breaking along the crack', make: function (k, d, p) { var n = 18 + Math.round(26 * p.size); for (var i = 0; i < n; i++) k.noise(d, .03 + .65 * p.length * Math.pow(k.r(), 1.5), { type: 'bandpass', f0: 3000 + 5000 * k.r(), q: 4, a: .0005, peak: .04 + .12 * k.r(), decay: .002 + .006 * k.r(), pan: k.r() * 1.2 - .6 }) } },
      { name: 'ping', job: 'the falling laser-like ping that runs through the ice sheet', make: function (k, d, p) { k.tone(d, .015, { f0: 4200, f1: 320 + 200 * (1 - p.size), glide: .22 + .1 * p.size, a: .001, peak: .32, decay: .14 }); k.tone(d, .2 + .2 * k.r(), { f0: 3600, f1: 420, glide: .2, a: .001, peak: .14, decay: .1 }) } },
      { name: 'groan', job: 'the low stress groan of the sheet', make: function (k, d, p, D) { var ctx = k.ctx, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95 - 30 * p.size, 0); o.frequency.linearRampToValueAtTime(70 - 25 * p.size, D * .6); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 4; k.env(g.gain, 0, .05, .18 * (.4 + p.size), .12 + .2 * p.size); o.connect(f); f.connect(g); g.connect(d); o.start(0); o.stop(D) } }
    ] });

  rec('splash', { title: 'Splash', what: 'Something hitting water: the plop, the spray, droplets falling back.', len: [.6, 3], bright: [1000, 5800], attack: .06, dur: function (p) { return (1.1 + .8 * p.size) * p.length },
    layers: [
      { name: 'plop', job: 'the hit on the surface: a rising bubble tone', make: function (k, d, p) { k.tone(d, 0, { f0: 420 - 150 * p.size, f1: 1300 - 400 * p.size, glide: .045, a: .002, peak: .6, decay: .05 }); k.noise(d, 0, { kind: 'pink', type: 'lowpass', f0: 380, a: .002, peak: .5 + .3 * p.size, decay: .05 + .05 * p.size }) } },
      { name: 'spray', job: 'the water thrown up into the air', make: function (k, d, p) { k.noise(d, .008, { type: 'bandpass', f0: 1800 + 2200 * p.bright, q: .6, a: .006, peak: .75, decay: .12 + .18 * p.size }) } },
      { name: 'drops', job: 'drops falling back, fewer and fewer', make: function (k, d, p) { var n = 16 + Math.round(30 * p.size), span = (.5 + .8 * p.size) * p.length; for (var i = 0; i < n; i++) { var f = 900 + 2200 * k.r(); k.tone(d, .12 + span * Math.pow(k.r(), 1.7), { f0: f, f1: f * 1.5, glide: .018, a: .001, peak: .05 + .14 * k.r(), decay: .015 + .01 * k.r(), pan: k.r() * 1.2 - .6 }) } } },
      { name: 'wash', job: 'the water settling back', make: function (k, d, p) { k.noise(d, .04, { kind: 'pink', type: 'lowpass', f0: 1000, q: .5, a: .03, peak: .25 + .3 * p.size, decay: .22 + .25 * p.size }) } }
    ] });

  rec('waves', { title: 'Wave', what: 'One sea wave: it swells, breaks, foams and pulls back over the stones.', len: [3, 10], bright: [850, 3800], attack: 2.4, dur: function (p) { return 5 * p.length },
    layers: [
      { name: 'swell', job: 'the wave rising before it breaks', make: function (k, d, p, D) { var ctx = k.ctx, br = D * .32, s = k.bed('pink', 0, br + .3), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.setValueAtTime(250, 0); f.frequency.exponentialRampToValueAtTime(1500, br); g.gain.setValueAtTime(.0001, 0); g.gain.exponentialRampToValueAtTime(.45, br); g.gain.linearRampToValueAtTime(0, br + .3); s.connect(f); f.connect(g); g.connect(d) } },
      { name: 'break', job: 'the crash when it breaks (bigger waves are lower and louder)', make: function (k, d, p, D) { k.noise(d, D * .32, { kind: 'pink', type: 'lowpass', f0: 5000 + 3000 * p.bright - 2000 * p.size, f1: 900, glide: D * .25, q: .4, a: .09, peak: 1, decay: .35 + .3 * p.size }) } },
      { name: 'foam', job: 'the hiss of foam running up the beach', make: function (k, d, p, D) { var ctx = k.ctx, t = D * .36, s = k.bed('white', t, D - t), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.Q.value = .5; f.frequency.value = 1500 + 1500 * p.bright; k.swell(g.gain, t, .35, D - t - .05, .26); s.connect(f); f.connect(g); g.connect(d) } },
      { name: 'stones', job: 'the water pulling back over pebbles', make: function (k, d, p, D) { var n = 60 + Math.round(60 * p.size), t0 = D * .55, span = D * .4; for (var i = 0; i < n; i++) { var x = k.r(); k.noise(d, t0 + span * x, { type: 'bandpass', f0: 1400 + 2600 * k.r(), q: 3, a: .001, peak: (.03 + .07 * k.r()) * (1 - x * .8), decay: .004 + .01 * k.r(), pan: k.r() * 1.4 - .7 }) } } }
    ] });

  rec('wind', { title: 'Wind', what: 'Cold wind in gusts, with a thin whistle.', len: [2, 12], bright: [550, 2500], attack: 3, dur: function (p) { return 4 * p.length },
    layers: [
      { name: 'gusts', job: 'the moving air, rising and falling in gusts', make: function (k, d, p, D) { var ctx = k.ctx, s = k.bed('pink', 0, D), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.Q.value = .8; f.frequency.setValueAtTime(400, 0); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.4, .6); for (var t = .6; t < D - .6; t += .35 + .4 * k.r()) { f.frequency.linearRampToValueAtTime((280 + 650 * k.r()) * (.6 + .8 * p.bright), t); g.gain.linearRampToValueAtTime(.25 + .6 * k.r() * (.5 + .5 * p.size), t) } g.gain.linearRampToValueAtTime(0, D); s.connect(f); f.connect(g); g.connect(d) } },
      { name: 'whistle', job: 'the thin whistle around corners and edges', make: function (k, d, p, D) { var ctx = k.ctx, s = k.bed('white', 0, D), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.Q.value = 16; f.frequency.setValueAtTime(1100, 0); g.gain.setValueAtTime(0, 0); for (var t = .8; t < D - .5; t += .5 + .6 * k.r()) { f.frequency.linearRampToValueAtTime(800 + 1100 * k.r(), t); g.gain.linearRampToValueAtTime((.04 + .1 * k.r()) * (.3 + p.bright), t) } g.gain.linearRampToValueAtTime(0, D); s.connect(f); f.connect(g); g.connect(d) } },
      { name: 'low', job: 'the deep push of the wind (stronger storms)', make: function (k, d, p, D) { var ctx = k.ctx, s = k.bed('brown', 0, D), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 160; g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.3 + .5 * p.size, 1); g.gain.setValueAtTime(.3 + .5 * p.size, D - 1); g.gain.linearRampToValueAtTime(0, D); s.connect(f); f.connect(g); g.connect(d) } }
    ] });

  rec('siren', { title: 'Siren', what: 'An ambulance or police siren wailing up and down.', len: [2, 12], bright: [1200, 2900], attack: 2, dur: function (p) { return 4 * p.length },
    layers: [
      { name: 'wail', job: 'the horn going up and down', make: function (k, d, p, D) { var ctx = k.ctx, f = ctx.createBiquadFilter(), g = ctx.createGain(), os = [ctx.createOscillator(), ctx.createOscillator()]; f.type = 'lowpass'; f.frequency.value = 2200 + 1800 * p.bright; os.forEach(function (o, j) { o.type = 'sawtooth'; o.detune.value = j ? 7 : -7; var per = 2.6 - .8 * p.bright, lo = 640, hi = 1450; o.frequency.setValueAtTime(lo, 0); for (var t = 0; t < D; t += per) { o.frequency.linearRampToValueAtTime(hi, t + per * .5); o.frequency.linearRampToValueAtTime(lo, t + per) } o.connect(f); o.start(0); o.stop(D) }); g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.32, .3); g.gain.setValueAtTime(.32, D - .4); g.gain.linearRampToValueAtTime(0, D); f.connect(g); g.connect(d) } },
      { name: 'street', job: 'a faint outdoor bed so it sits in a place', make: function (k, d, p, D) { var ctx = k.ctx, s = k.bed('pink', 0, D), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 700; g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.08, .5); g.gain.setValueAtTime(.08, D - .5); g.gain.linearRampToValueAtTime(0, D); s.connect(f); f.connect(g); g.connect(d) } }
    ] });

  rec('footsteps', { title: 'Footsteps', what: 'Walking steps. Brightness adds crunch (snow, gravel). Length = more steps.', len: [.6, 6], bright: [380, 3400], attack: .05, dur: function (p) { return steps(p) * .52 + .3 },
    layers: [
      { name: 'heel', job: 'the heel landing (heavier people are lower)', make: function (k, d, p) { for (var i = 0; i < steps(p); i++) { var t = i * .52 + .02 * k.r(), pn = i % 2 ? .12 : -.12; k.noise(d, t, { kind: 'pink', type: 'lowpass', f0: 320 + 150 * p.bright, a: .003, peak: .8, decay: .035, pan: pn }); k.tone(d, t, { f0: 85 - 20 * p.size, f1: 45, glide: .05, a: .003, peak: .45 + .3 * p.size, decay: .04, pan: pn }) } } },
      { name: 'crunch', job: 'snow or gravel giving way under the foot', make: function (k, d, p) { for (var i = 0; i < steps(p); i++) { var t = i * .52, n = 6 + Math.round(10 * p.bright); for (var j = 0; j < n; j++) k.noise(d, t + .005 + .09 * k.r(), { type: 'bandpass', f0: 1400 + 3600 * k.r(), q: 2, a: .001, peak: (.06 + .2 * k.r()) * (.2 + p.bright), decay: .004 + .012 * k.r(), pan: i % 2 ? .12 : -.12 }) } } },
      { name: 'scuff', job: 'the toe rolling off', make: function (k, d, p) { for (var i = 0; i < steps(p); i++) k.noise(d, i * .52 + .11, { type: 'bandpass', f0: 1900, q: .8, a: .02, peak: .08, decay: .05, pan: i % 2 ? .12 : -.12 }) } }
    ] });
  function steps(p) { return p.count || Math.max(2, Math.round(4 * p.length)) }

  rec('door', { title: 'Door', what: 'A car or room door closing: thump, latch and a short panel rattle.', len: [.5, 2], bright: [210, 720], attack: .03, dur: function (p) { return (.9 + .3 * p.size) * p.length },
    layers: [
      { name: 'thump', job: 'the door meeting the frame', make: function (k, d, p) { k.tone(d, 0, { f0: 80 - 15 * p.size, f1: 44, glide: .1, a: .003, peak: 1, decay: .1 + .05 * p.size }); k.noise(d, 0, { kind: 'pink', type: 'lowpass', f0: 280, a: .003, peak: .7, decay: .09 }) } },
      { name: 'latch', job: 'the metal latch catching', make: function (k, d, p) { k.noise(d, .006, { type: 'bandpass', f0: 3000, q: 4, a: .0005, peak: .55, decay: .01 }); [1850, 2910, 4630].forEach(function (f, i) { k.tone(d, .006, { f0: f * (1 + .03 * (k.r() - .5)), a: .0008, peak: .1 * p.bright + .02, decay: .07 - i * .015 }) }) } },
      { name: 'rattle', job: 'the panel ringing for a moment', make: function (k, d, p) { k.tone(d, .003, { f0: 210, a: .003, peak: .12, decay: .2 }); k.tone(d, .003, { f0: 345, a: .003, peak: .08, decay: .14 }); k.noise(d, .01, { type: 'bandpass', f0: 900, q: 2, a: .003, peak: .1, decay: .12 }) } }
    ] });

  rec('engine', { title: 'Engine start', what: 'A car starting: starter motor, the catch, a rev and the idle.', len: [2.5, 10], bright: [130, 400], attack: 1.6, dur: function (p) { return 4 * p.length },
    layers: [
      { name: 'starter', job: 'the starter motor cranking', make: function (k, d, p) { var ctx = k.ctx, o = ctx.createOscillator(), lf = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(140, 0); o.frequency.linearRampToValueAtTime(185, 1.05); lf.frequency.value = 13; lg.gain.value = .16; g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.2, .05); g.gain.setValueAtTime(.2, 1.02); g.gain.linearRampToValueAtTime(0, 1.12); lf.connect(lg); lg.connect(g.gain); f.type = 'lowpass'; f.frequency.value = 1400; o.connect(f); f.connect(g); g.connect(d); o.start(0); o.stop(1.15); lf.start(0); lf.stop(1.15) } },
      { name: 'catch', job: 'the moment the engine fires', make: function (k, d, p) { k.noise(d, 1.08, { kind: 'pink', type: 'lowpass', f0: 650, a: .003, peak: .7, decay: .1 }); k.tone(d, 1.08, { f0: 70, f1: 38, glide: .1, a: .003, peak: .8, decay: .1 }) } },
      { name: 'idle', job: 'the cylinders firing: a quick rev, then a steady idle', make: function (k, d, p, D) { var ctx = k.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), base = 26 + 8 * (1 - p.size); o.type = 'sawtooth'; o2.type = 'sine'; [o, o2].forEach(function (x, j) { var m = j ? 2 : 1; x.frequency.setValueAtTime(base * m, 1.1); x.frequency.linearRampToValueAtTime(base * 2.1 * m, 1.5); x.frequency.linearRampToValueAtTime(base * 1.05 * m, 2.2); x.connect(f); x.start(1.1); x.stop(D) }); f.type = 'lowpass'; f.frequency.setValueAtTime(260 + 400 * p.bright, 1.1); f.frequency.linearRampToValueAtTime(700 + 500 * p.bright, 1.5); f.frequency.linearRampToValueAtTime(260 + 400 * p.bright, 2.2); g.gain.setValueAtTime(0, 1.1); g.gain.linearRampToValueAtTime(.6, 1.18); g.gain.setValueAtTime(.6, D - .5); g.gain.linearRampToValueAtTime(0, D); f.connect(g); g.connect(d) } },
      { name: 'exhaust', job: 'the low breath of the exhaust', make: function (k, d, p, D) { var ctx = k.ctx, s = k.bed('brown', 1.1, D - 1.1), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'lowpass'; f.frequency.value = 220; g.gain.setValueAtTime(0, 1.1); g.gain.linearRampToValueAtTime(.35, 1.3); g.gain.setValueAtTime(.35, D - .5); g.gain.linearRampToValueAtTime(0, D); s.connect(f); f.connect(g); g.connect(d) } }
    ] });

  rec('breath', { title: 'Breath / gasp', what: 'A sharp gasp in, then a shaky breath out.', len: [.6, 2.6], bright: [1300, 5200], attack: .25, dur: function (p) { return 1.3 * p.length },
    layers: [
      { name: 'inhale', job: 'air pulled in fast through the mouth', make: function (k, d, p) { k.noise(d, 0, { type: 'bandpass', f0: 1100, f1: 1600 + 600 * p.bright, glide: .2, q: 1.6, a: .12, peak: .7, decay: .09 }); k.noise(d, 0, { type: 'bandpass', f0: 2500, q: 3, a: .12, peak: .25 * p.bright + .05, decay: .08 }) } },
      { name: 'exhale', job: 'the breath going out again, softer', make: function (k, d, p, D) { k.noise(d, D * .5, { kind: 'pink', type: 'bandpass', f0: 850, f1: 600, glide: .4, q: 1, a: .08, peak: .3, decay: .16 }) } }
    ] });

  rec('riser', { title: 'Riser', what: 'Tension that builds up to a moment.', len: [1, 6], bright: [1100, 6600], attack: 6, dur: function (p) { return 2.5 * p.length },
    layers: [
      { name: 'air', job: 'noise that brightens as it rises', make: function (k, d, p, D) { var ctx = k.ctx, s = k.bed('white', 0, D), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.Q.value = .7; f.frequency.setValueAtTime(300, 0); f.frequency.exponentialRampToValueAtTime(2200 + 2600 * p.bright, D); g.gain.setValueAtTime(.0001, 0); g.gain.exponentialRampToValueAtTime(.55, D - .04); g.gain.linearRampToValueAtTime(0, D); s.connect(f); f.connect(g); g.connect(d) } },
      { name: 'tone', job: 'a rising tone under it', make: function (k, d, p, D) { var ctx = k.ctx, o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(110 - 40 * p.size, 0); o.frequency.exponentialRampToValueAtTime(440 - 120 * p.size, D); f.type = 'lowpass'; f.frequency.value = 1200; g.gain.setValueAtTime(.0001, 0); g.gain.exponentialRampToValueAtTime(.22, D - .04); g.gain.linearRampToValueAtTime(0, D); o.connect(f); f.connect(g); g.connect(d); o.start(0); o.stop(D) } }
    ] });

  rec('ding', { title: 'Bell / ding', what: 'A bell, chime or notification ding.', len: [.8, 5], bright: [650, 2400], attack: .02, dur: function (p) { return 2 * p.length },
    layers: [
      { name: 'strike', job: 'the hammer touching the bell', make: function (k, d, p) { k.noise(d, 0, { type: 'bandpass', f0: 4200, q: 2, a: .0005, peak: .2, decay: .004 }) } },
      { name: 'ring', job: 'the bell ringing in its own (not musical) overtones', make: function (k, d, p) { var f = 880 * (1.5 - .9 * p.size); [[1, 1, 1.6], [2.76, .5, .9], [5.4, .3 * (.4 + p.bright), .5], [8.93, .15 * (.3 + p.bright), .3]].forEach(function (h) { k.tone(d, .001, { f0: f * h[0], a: .002, peak: h[1] * .5, decay: h[2] * .35 * p.length }) }) } }
    ] });

  rec('paper', { title: 'Paper', what: 'Paper rustling or a page turning.', len: [.4, 2.4], bright: [1400, 6800], attack: 1, dur: function (p) { return .8 * p.length },
    layers: [
      { name: 'crinkle', job: 'the tiny folds snapping', make: function (k, d, p, D) { var n = 50 + Math.round(70 * p.size); for (var i = 0; i < n; i++) { var x = (k.r() + k.r() + k.r()) / 3; k.noise(d, .02 + (D - .1) * x, { type: 'bandpass', f0: 2000 + 5000 * k.r(), q: 1 + 2 * k.r(), a: .001, peak: .05 + .2 * k.r(), decay: .003 + .01 * k.r(), pan: k.r() * .8 - .4 }) } } },
      { name: 'sweep', job: 'the air moved by the sheet', make: function (k, d, p, D) { var ctx = k.ctx, s = k.bed('pink', 0, D), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = .5; k.swell(g.gain, 0, D * .5, D, .3); s.connect(f); f.connect(g); g.connect(d) } }
    ] });

  F.RECIPES = R;
  F.list = function () { return Object.keys(R).map(function (n) { return R[n] }) };
  F.PARAMS = [
    { id: 'size', label: 'Size', tip: 'Bigger = lower and longer' },
    { id: 'distance', label: 'Distance', tip: 'Far = duller, quieter, more echo' },
    { id: 'room', label: 'Room', tip: 'Open air to a big hall' },
    { id: 'length', label: 'Length', tip: 'Shorter or longer', min: .5, max: 2 },
    { id: 'bright', label: 'Brightness', tip: 'Duller to sharper' }
  ];
  F.defaults = function () { return { size: .5, distance: .15, room: .25, length: 1, bright: .5, take: 1, mute: [] } };
  function norm(p) { var d = F.defaults(), o = {}; Object.keys(d).forEach(function (k) { o[k] = p && p[k] != null ? p[k] : d[k] }); if (p && p.count) o.count = p.count; o.size = clamp(+o.size, 0, 1); o.distance = clamp(+o.distance, 0, 1); o.room = clamp(+o.room, 0, 1); o.bright = clamp(+o.bright, 0, 1); o.length = clamp(+o.length, .5, 2); o.take = Math.max(1, Math.round(+o.take) || 1); o.mute = Array.isArray(o.mute) ? o.mute.slice() : []; return o }
  F.norm = norm;

  /* ---------- the space: distance and room (same for every recipe, so sounds sit in one world) ---------- */
  function impulse(ctx, sec, r) {
    var n = Math.max(1, Math.floor(sec * ctx.sampleRate)), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c), lp = 0; for (var i = 0; i < n; i++) { var x = i / n, a = .55 + .43 * x; lp = lp + (1 - a) * ((r() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - x, 2.4) * (i < 60 ? i / 60 : 1) } }
    return b;
  }
  function space(ctx, p, r) {
    var inp = ctx.createGain(), lp = ctx.createBiquadFilter(), dry = ctx.createGain(), wet = ctx.createGain(), cv = ctx.createConvolver();
    lp.type = 'lowpass'; lp.frequency.value = 20000 * Math.pow(.06, p.distance); lp.Q.value = .5;  // air eats the highs of far sounds
    dry.gain.value = 1 - .55 * p.distance; wet.gain.value = .12 + .5 * p.room + .35 * p.distance;
    cv.buffer = impulse(ctx, .35 + 2.6 * Math.max(p.room, p.distance * .7), r);
    inp.connect(lp); lp.connect(dry); dry.connect(ctx.destination); lp.connect(cv); cv.connect(wet); wet.connect(ctx.destination);
    if (p.distance > .45) { var dl = ctx.createDelay(1), eg = ctx.createGain(); dl.delayTime.value = .12 + .25 * p.distance; eg.gain.value = .22 * p.distance; lp.connect(dl); dl.connect(eg); eg.connect(ctx.destination) } // an echo off far walls or hills
    return { inp: inp, tail: .35 + 2.6 * Math.max(p.room, p.distance * .7) };
  }

  /* ---------- render ---------- */
  F.duration = function (name, p) { var rc = R[name]; if (!rc) return 0; p = norm(p); return rc.dur(p) };
  F.render = function (name, p, rate) {
    var rc = R[name]; if (!rc) return Promise.reject(new Error('No code-made sound called "' + name + '"'));
    p = norm(p); var sr = rate || SR, D = rc.dur(p), seed = (hash(name) + p.take * 7919) >>> 0, r = rng(seed ^ 0x9e37);
    var tail = .35 + 2.6 * Math.max(p.room, p.distance * .7), total = Math.min(14, D + tail * .7 + .1);
    var ctx = new OfflineAudioContext(2, Math.ceil(total * sr), sr), k = new Kit(ctx, seed), sp = space(ctx, p, r);
    rc.layers.slice(0, 5).forEach(function (L) {
      if (p.mute.indexOf(L.name) >= 0) return;
      var g = ctx.createGain(); g.gain.value = 1; g.connect(sp.inp);
      L.make(k, g, p, D);
    });
    return ctx.startRendering().then(finish);
  };
  /* clean up: remove any offset, soft fade at both ends, then the loudest point at -1 dBFS (no clipping) */
  function finish(buf) {
    var n = buf.length, ch = [], c, i, pk = 0, fi = Math.min(n, 96), fo = Math.min(n, Math.floor(buf.sampleRate * .04));
    for (c = 0; c < buf.numberOfChannels; c++) ch.push(buf.getChannelData(c));
    ch.forEach(function (d) { var m = 0; for (i = 0; i < n; i++) m += d[i]; m /= n; for (i = 0; i < n; i++) d[i] -= m; for (i = 0; i < fi; i++) d[i] *= i / fi; for (i = 0; i < fo; i++) d[n - 1 - i] *= i / fo; for (i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i])) });
    var g = pk > 1e-6 ? Math.pow(10, -1 / 20) / pk : 1; ch.forEach(function (d) { for (i = 0; i < n; i++) d[i] *= g });
    return buf;
  }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }

  /* ---------- the number checks (the "must pass" list for every sound) ---------- */
  F.measure = function (buf) {
    var n = buf.length, sr = buf.sampleRate, L = buf.getChannelData(0), Rr = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L, i;
    var pk = 0, pkAt = 0, sum = 0, dc = 0, zc = 0, act = 0, jump = 0;
    for (i = 0; i < n; i++) { var m = (L[i] + Rr[i]) * .5, a = Math.max(Math.abs(L[i]), Math.abs(Rr[i])); if (a > pk) { pk = a; pkAt = i } sum += m * m; dc += m; if (i && (L[i] >= 0) !== (L[i - 1] >= 0)) zc++ }
    var thr = pk * .03, first = -1, lastLoud = 0; for (i = 0; i < n; i++) { var v = Math.abs(L[i]); if (v > thr) { if (first < 0) first = i; lastLoud = i } }
    // brightness: the spectral centroid (the 'centre of gravity' of the frequencies) of each loud window
    var N = 1024, re = new Float64Array(N), im = new Float64Array(N), cents = [], highs = [], hop = Math.max(N, Math.floor((n - N) / 60));
    for (var s = 0; s + N <= n; s += hop) { var e = 0; for (i = 0; i < N; i++) { var hv = .5 - .5 * Math.cos(2 * Math.PI * i / (N - 1)); re[i] = L[s + i] * hv; im[i] = 0; e += L[s + i] * L[s + i] } if (Math.sqrt(e / N) < pk * .05) continue; fft(re, im); var num = 0, den = 0, hf = 0; for (i = 1; i < N / 2; i++) { var mg = Math.sqrt(re[i] * re[i] + im[i] * im[i]); num += mg * i * sr / N; den += mg; if (i * sr / N > 2000) hf += mg } if (den > 0) { cents.push(num / den); highs.push(hf / den) } }
    cents.sort(function (x, y) { return x - y }); var bright = cents.length ? cents[Math.floor(cents.length / 2)] : 0; // the middle value: one short click cannot fake it
    // attack: from the first sound to the moment it first gets within 6 dB of its loudest point
    var att = 0; for (i = Math.max(0, first); i < n; i++) if (Math.max(Math.abs(L[i]), Math.abs(Rr[i])) >= pk * .5) { att = (i - Math.max(0, first)) / sr; break }
    var endRms = 0, en = Math.min(n, Math.floor(sr * .02)); for (i = n - en; i < n; i++) endRms += L[i] * L[i]; endRms = Math.sqrt(endRms / Math.max(1, en));
    return { peakDb: 20 * Math.log10(pk || 1e-9), rmsDb: 10 * Math.log10(sum / n || 1e-12), dc: Math.abs(dc / n), length: (lastLoud - Math.max(0, first)) / sr, attack: att, bright: bright, highs: highs.length ? highs.reduce(function (x, y) { return x + y }, 0) / highs.length : 0, startAbs: Math.abs(L[0]), endDb: 20 * Math.log10(endRms || 1e-9), sr: sr };
  };
  function fft(re, im) { var n = re.length, i, j = 0, k, l; for (i = 1; i < n; i++) { var bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { var t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t } }
    for (l = 2; l <= n; l <<= 1) { var a = -2 * Math.PI / l, wr = Math.cos(a), wi = Math.sin(a); for (i = 0; i < n; i += l) { var cr = 1, ci = 0; for (k = 0; k < l / 2; k++) { var ur = re[i + k], ui = im[i + k], vr = re[i + k + l / 2] * cr - im[i + k + l / 2] * ci, vi = re[i + k + l / 2] * ci + im[i + k + l / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + l / 2] = ur - vr; im[i + k + l / 2] = ui - vi; var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr } } } }
  F.check = function (buf, name, p) {
    var rc = R[name], m = F.measure(buf), lines = [];
    function t(ok, label, val) { lines.push({ ok: !!ok, label: label, val: val }) }
    t(m.peakDb <= -0.9, 'No clipping (loudest point at or under -1 dB)', m.peakDb.toFixed(1) + ' dB');
    t(m.rmsDb > -45, 'Not too quiet (average above -45 dB)', m.rmsDb.toFixed(1) + ' dB');
    t(m.dc < .01, 'No offset (the wave is centred)', m.dc.toFixed(4));
    t(m.startAbs < .02, 'Clean start (no click)', m.startAbs.toFixed(3));
    t(m.endDb < -45, 'Clean end (fades to silence)', m.endDb.toFixed(0) + ' dB');
    if (rc) {
      var lf = p ? norm(p).length : 1, lo = rc.len[0] * Math.min(1, lf), hi = rc.len[1] * Math.max(1, lf);
      t(m.length >= lo * .6 && m.length <= hi * 1.25 + 1.5, 'Right length for a ' + rc.title.toLowerCase() + ' (' + lo.toFixed(1) + ' to ' + hi.toFixed(1) + ' s)', m.length.toFixed(2) + ' s');
      t(m.attack <= rc.attack + .05, (rc.attack < .1 ? 'Hits at once' : 'Builds up in time') + ' (gets loud within ' + rc.attack + ' s)', m.attack.toFixed(3) + ' s');
      t(m.bright >= rc.bright[0] * .8 && m.bright <= rc.bright[1] * 1.25, 'Right brightness (' + rc.bright[0] + ' to ' + rc.bright[1] + ' Hz)', Math.round(m.bright) + ' Hz');
      t(rc.layers.length <= 5, 'At most 5 layers', rc.layers.length + ' layers');
    }
    return { pass: lines.every(function (l) { return l.ok }), lines: lines, m: m };
  };

  /* ---------- WAV file ---------- */
  F.wav = function (buf) {
    var ch = Math.min(2, buf.numberOfChannels), n = buf.length, sr = buf.sampleRate, bytes = 44 + n * ch * 2, ab = new ArrayBuffer(bytes), v = new DataView(ab), o = 0;
    function s(x) { for (var i = 0; i < x.length; i++) v.setUint8(o++, x.charCodeAt(i)) }
    s('RIFF'); v.setUint32(o, bytes - 8, true); o += 4; s('WAVEfmt '); v.setUint32(o, 16, true); o += 4; v.setUint16(o, 1, true); o += 2; v.setUint16(o, ch, true); o += 2;
    v.setUint32(o, sr, true); o += 4; v.setUint32(o, sr * ch * 2, true); o += 4; v.setUint16(o, ch * 2, true); o += 2; v.setUint16(o, 16, true); o += 2; s('data'); v.setUint32(o, n * ch * 2, true); o += 4;
    var d = []; for (var c = 0; c < ch; c++) d.push(buf.getChannelData(c));
    for (var i = 0; i < n; i++) for (c = 0; c < ch; c++) { var x = Math.max(-1, Math.min(1, d[c][i])); v.setInt16(o, x < 0 ? x * 32768 : x * 32767, true); o += 2 }
    return new Blob([ab], { type: 'audio/wav' });
  };
  F.blob = function (code) { return F.render(code.name, code.p).then(F.wav) };

  /* ---------- words to a recipe ---------- */
  var WORDS = {
    whoosh: 'whoosh swoosh swish woosh whip swing fly flying passby zoom transition',
    impact: 'impact hit punch boom slam smash bang knock strike crash collide punch',
    explosion: 'explosion explode exploding blast bomb detonation grenade kaboom',
    thud: 'thud fall falls body drop drops land lands thump collapse slump',
    heartbeat: 'heart heartbeat heartbeats pulse',
    beep: 'beep beeps bleep monitor thermometer alarm alert electronic',
    click: 'click clicks tick ticking button switch tap clock',
    ice: 'ice crack cracks cracking freeze frozen creak',
    splash: 'splash splashes plunge dive water jump',
    waves: 'wave waves ocean sea surf shore beach',
    wind: 'wind gust gusts storm breeze blizzard howling',
    siren: 'siren sirens ambulance police',
    footsteps: 'footstep footsteps step steps walk walking walks running run snow gravel',
    door: 'door doors slam latch shut',
    engine: 'engine motor ignition start starts rev',
    breath: 'breath breathing gasp gasps inhale exhale pant panting',
    riser: 'riser rise swell build tension',
    ding: 'ding bell chime notification',
    paper: 'paper page pages rustle turn'
  };
  var WEAK = { thud: 1.3, water: .5, snow: .4, gravel: .4, start: .5, starts: .5, turn: .5, crash: .7, clock: .6, run: .6, running: .6, jump: .5, shut: .6, rise: .6, build: .4, alert: .6, fly: .6, flying: .6, zoom: .5, transition: .5, crack: .8, cracks: .8, cracking: .8, slam: .8, tap: .7, switch: .7, swell: .5, body: .6, drop: .7, drops: .7, land: .7, lands: .7, fall: .9, falls: .9 };
  var INDEX = {}; Object.keys(WORDS).forEach(function (n) { WORDS[n].split(' ').forEach(function (w) { (INDEX[w] = INDEX[w] || []).push(n) }) });
  F.match = function (words) {
    var q = String(words || '').toLowerCase().split(/[^a-z]+/).filter(Boolean); if (!q.length) return null;
    var score = {};
    q.forEach(function (w) { (INDEX[w] || []).forEach(function (n) { score[n] = (score[n] || 0) + (WEAK[w] || 1) }) });
    if (q.indexOf('car') >= 0) { if (score.door) score.door += .5; if (score.engine) score.engine += .5 }
    var best = Object.keys(score).sort(function (a, b) { return score[b] - score[a] })[0]; if (!best) return null;
    var p = F.defaults(); function has() { for (var i = 0; i < arguments.length; i++) if (q.indexOf(arguments[i]) >= 0) return true; return false }
    if (has('big', 'huge', 'heavy', 'deep', 'massive', 'giant', 'sub', 'loud', 'boom')) p.size = .85;
    if (has('small', 'little', 'light', 'soft', 'tiny', 'gentle', 'quiet')) p.size = .2;
    if (has('distant', 'far', 'faraway', 'away', 'outside')) p.distance = .7;
    if (has('close', 'near', 'closeup')) p.distance = .05;
    if (has('long', 'slow', 'echo', 'echoing')) p.length = 1.5;
    if (has('short', 'quick', 'fast', 'brief')) p.length = .7;
    if (has('hall', 'cave', 'tunnel', 'church', 'room', 'inside', 'indoor', 'warehouse')) p.room = .7;
    if (has('sharp', 'bright', 'metal', 'metallic', 'snow', 'gravel', 'cold')) p.bright = .8;
    if (has('dull', 'muffled', 'underwater', 'muted')) p.bright = .15;
    if (best === 'beep' && (has('beeps', 'thermometer'))) p.count = 3;
    if (best === 'siren' && !has('close', 'near')) p.distance = Math.max(p.distance, .4);
    if (best === 'footsteps' && has('running', 'run')) p.length = 1.5;
    return { name: best, p: p };
  };
  /* for the Sound page: three takes of the best code sound for these words */
  F.candidates = function (words, n) {
    var m = F.match(words); if (!m) return [];
    var rc = R[m.name], out = []; for (var i = 1; i <= (n || 3); i++) { var p = norm(m.p); p.take = i; out.push({ kind: 'code', name: rc.title + ' (made by code, take ' + i + ')', id: m.name + '-' + i, code: { name: m.name, p: p } }) }
    return out;
  };
  F.label = function (code) { var rc = R[code && code.name]; return rc ? rc.title + ' (made by code, take ' + norm(code.p).take + ')' : 'Made by code' };
  F.key = function (code) { return 'code:' + code.name + ':' + hash(JSON.stringify(norm(code.p))).toString(36) };
  /* the list of code sounds for the Sonnet prompt */
  F.promptList = function () { return F.list().map(function (r) { return r.name + ' (' + r.what.replace(/\.$/, '').toLowerCase() + ')' }).join('; ') };
})();
