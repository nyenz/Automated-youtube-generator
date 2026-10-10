/* "The Longest Fall" — a 2-minute flat-cartoon film (9:16). Uses FLAT (flat-kit.js), FILM_SCRIPT and, for sound, KIT.SND.
   Drawn on twos (12 drawings a second). Cinematography: a multiplane camera (layers in front of and behind the action
   move at different speeds), roll for tension, inserts and reveals, light beams, and one colour grade per scene. */
(function () {
  var F = window.FLAT, P = F.PAL;

  /* ---------------- timing: an estimate of how a narrator reads each line ---------------- */
  var LINES = window.FILM_SCRIPT, WORDS = [], LT = [], t = .4;
  LINES.forEach(function (line, li) {
    var ws = line.split(/\s+/), s0 = t;
    ws.forEach(function (w) {
      var bare = w.replace(/[^A-Za-z0-9']/g, ''), d = .14 + .05 * bare.replace(/\d/g, '').length + .19 * (bare.match(/\d/g) || []).length;
      WORDS.push({ w: w, s: t, e: t + d, line: li }); t += d;
      if (/[,;]$/.test(w)) t += .22; else if (/[.!?]$/.test(w)) t += .38;
    });
    LT.push({ s: s0, e: t }); t += .32;
  });
  var RAW = t + .8, DUR = 120, K = (DUR - 1.2) / RAW;
  WORDS.forEach(function (w) { w.s *= K; w.e *= K }); LT.forEach(function (l) { l.s *= K; l.e *= K });
  function ls(i) { return LT[i].s }
  function wt(li, word, nth) { var n = 0; for (var i = 0; i < WORDS.length; i++) { var w = WORDS[i]; if (w.line === li && w.w.toLowerCase().replace(/[^a-z0-9']/g, '') === word) { if (!nth || ++n === nth) return w.s } } return ls(li) }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)) }
  function ease(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x) }
  function lerp(a, b, k) { return a + (b - a) * k }
  function rnd(seed) { var s = Math.abs(Math.floor(seed)) % 2147483647 || 1; return function () { s = s * 16807 % 2147483647; return s / 2147483647 } }
  var MEMO = {}; function memo(k, fn) { return MEMO[k] || (MEMO[k] = fn()) }

  /* ---------------- cast (1945) ---------------- */
  var betty = F.character({ skin: 'pale', hair: 'bun', cap: false, hat: 'operator', hatColor: 'navy', top: 'navy', number: '', stripes: false, skirt: 'navy', buttons: true, earring: false });
  var bettyBed = F.character({ skin: 'pale', hair: 'bun', cap: false, top: 'white', number: '', stripes: false, skirt: 'white', earring: false });
  var fire1 = F.character({ skin: 'tan', hair: 'short', cap: false, hat: 'helmet', top: 'charcoal', number: '', stripes: false, pants: 'charcoal', earring: false, shoes: 'dark', buttons: true });
  var fire2 = F.character({ skin: 'brown', hair: 'short', cap: false, hat: 'helmet', top: 'charcoal', number: '', stripes: false, pants: 'charcoal', earring: false, shoes: 'dark', build: 1.15 });
  var worker = F.character({ skin: 'brown', hair: 'short', cap: false, top: 'khaki', number: '', stripes: false, pants: 'navy', earring: false, shoes: 'dark' });
  var nurse = F.character({ skin: 'deep', hair: 'bun', cap: false, hat: 'nurse', top: 'white', number: '', stripes: false, skirt: 'white', earring: false });
  var gent = F.character({ skin: 'light', hair: 'short', cap: false, hat: 'fedora', hatColor: 'khaki', top: 'grey', number: '', stripes: false, pants: 'grey', earring: false, shoes: 'dark', nose: 1.15 });
  var lady = F.character({ skin: 'tan', hair: 'bun', cap: false, top: 'maroon', number: '', stripes: false, skirt: 'maroon', earring: true });
  function place(c, tt, pose, x, ground, s, mirror, ex) {
    return '<g transform="translate(' + x.toFixed(1) + ',' + (ground - 1131 * s).toFixed(1) + ') scale(' + (mirror ? -s : s) + ',' + s + ') translate(-545,0)"' + (ex || '') + '>' + c.svg(tt, pose) + '</g>';
  }
  function silhouette(c, tt, pose, x, ground, s, mirror, col) { return '<g style="filter:brightness(0.18)">' + place(c, tt, pose, x, ground, s, mirror) + '</g>' }
  betty.svg(0, { walk: .06 }); var a1 = betty.last.ankN[0]; betty.svg(0, { walk: .40 }); var STRIDE = (betty.last.ankN[0] - a1) / .34;

  /* ---------------- shape helpers ---------------- */
  function f1(x) { return (+x).toFixed(1) }
  function R(x, y, w, h, c, ex) { return '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '" fill="' + c + '"' + (ex || '') + '/>' }
  function poly(pts, c, ex) { return '<path d="M' + pts.map(function (p) { return f1(p[0]) + ',' + f1(p[1]) }).join(' L') + 'Z" fill="' + c + '"' + (ex || '') + '/>' }
  function circ(x, y, r, c, ex) { return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(Math.max(0, r)) + '" fill="' + c + '"' + (ex || '') + '/>' }
  function line(x1, y1, x2, y2, c, w, ex) { return '<line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2) + '" y2="' + f1(y2) + '" stroke="' + c + '" stroke-width="' + w + '"' + (ex || '') + '/>' }
  function cel(d, a, b, o) { return F.cel(d, a, b, o) }
  function boxD(x, y, w, h) { return 'M' + f1(x) + ',' + f1(y) + 'h' + f1(w) + 'v' + f1(h) + 'h' + f1(-w) + 'Z' }
  function txt(x, y, s, size, c, ex) { return '<text x="' + f1(x) + '" y="' + f1(y) + '" font-family="Archivo Black, Arial Black, Impact, sans-serif" font-size="' + size + '" fill="' + c + '"' + (ex || '') + '>' + s + '</text>' }
  // a flat smoke / cloud puff: a cluster of circles with one shadow shape underneath
  function puff(x, y, r, c, sh, seed, op) {
    var g = rnd(seed), cs = []; for (var i = 0; i < 6; i++) cs.push([x + (g() - .5) * r * 1.4, y + (g() - .5) * r * .6, r * (.45 + g() * .4)]);
    var s = '<g opacity="' + (op == null ? 1 : op) + '">';
    cs.forEach(function (q) { s += circ(q[0] + r * .08, q[1] + r * .12, q[2], sh) });
    cs.forEach(function (q) { s += circ(q[0], q[1], q[2], c) });
    return s + '</g>';
  }
  function fogBand(y, tt, speed, op, seed, col) {
    var g = rnd(seed), s = '', c = col || '#d6d0c6';
    for (var k = 0; k < 4; k++) { var w = 900 + g() * 700, h = 90 + g() * 90, x = ((tt * speed * (.8 + g() * .4) + g() * 3000) % 3400 + 3400) % 3400 - 1100, yy = y + (g() - .5) * 260;
      s += '<ellipse cx="' + f1(x) + '" cy="' + f1(yy) + '" rx="' + w.toFixed(0) + '" ry="' + h.toFixed(0) + '" fill="' + c + '" opacity="' + (op * .55).toFixed(2) + '"/>' }
    return s;
  }
  // a flat beam of light (screen blended)
  function beam(x1, y1, w1, x2, y2, w2, c, op) { return poly([[x1 - w1 / 2, y1], [x1 + w1 / 2, y1], [x2 + w2 / 2, y2], [x2 - w2 / 2, y2]], c, ' opacity="' + op + '" style="mix-blend-mode:screen"') }
  // window columns drawn as dashed lines: one element per column
  function winCols(x0, x1, y0, y1, gap, w, h, sp, c) { var s = ''; for (var x = x0; x <= x1; x += gap) s += '<line x1="' + f1(x) + '" y1="' + f1(y0) + '" x2="' + f1(x) + '" y2="' + f1(y1) + '" stroke="' + c + '" stroke-width="' + w + '" stroke-dasharray="' + h + ' ' + sp + '"/>'; return s }

  /* ---------------- New York, 1945 ---------------- */
  function building(x, base, w, h, o) { // a varied city block: windows, cornice, rooftop details
    var g = rnd(o.seed), c = o.c, s = cel(boxD(x, base - h, w, h + 40), c[0], c[1], { lx: -Math.min(40, w * .2), ly: 0, rim: o.rim ? P.rim : null, rw: 4 });
    if (o.win) s += winCols(x + 16, x + w - 14, base - h + 26, base, o.gap || 26, o.ww || 12, 18, 14, o.win);
    if (o.lit) for (var i = 0; i < 4; i++) s += R(x + 12 + Math.floor(g() * (w - 30) / 26) * 26, base - h + 30 + Math.floor(g() * (h - 60) / 32) * 32, 14, 18, '#f0c46a', ' opacity=".9"');
    s += R(x - 6, base - h, w + 12, 12, c[1]);
    var top = o.top || ['flat', 'water', 'step', 'antenna'][Math.floor(g() * 4)];
    if (top === 'water') { var tx = x + w * (.3 + g() * .4); s += line(tx - 22, base - h, tx - 26, base - h - 40, c[1], 5) + line(tx + 22, base - h, tx + 26, base - h - 40, c[1], 5) + cel('M' + (tx - 34) + ',' + (base - h - 40) + 'h68v-70c0,-30 -68,-30 -68,0Z', c[1], F.darken(c[1]), { lx: -8, ly: 0 }) }
    if (top === 'step') s += cel(boxD(x + w * .2, base - h - 60, w * .6, 60), c[0], c[1], { lx: -10, ly: 0 });
    if (top === 'antenna') s += line(x + w * .7, base - h, x + w * .7, base - h - 120, c[1], 4);
    return s;
  }
  function empireState(clear, glow) {
    var es = clear ? ['#9a8370', '#6e5946', '#b9a28a'] : ['#77716a', '#58534d', '#8e8780'], win = clear ? '#5a4a3c' : '#4a4640', s = '';
    var tiers = [[300, 1250, 480, 900], [340, 900, 400, 350], [390, 600, 300, 300], [440, 330, 200, 270], [470, 200, 140, 130]];
    tiers.forEach(function (b, i) {
      s += cel(boxD(b[0], b[1], b[2], b[3]), es[0], es[1], { lx: -b[2] * .28, ly: 0, rim: clear ? P.rim : null, rw: 6 });
      for (var x = b[0] + 14; x < b[0] + b[2] - 8; x += 24) s += R(x, b[1] + 8, 6, b[3] - 8, es[2], ' opacity=".55"');      // light stone piers
      s += winCols(b[0] + 26, b[0] + b[2] - 14, b[1] + 16, b[1] + b[3], 24, 10, 16, 12, win);                                // window columns
      s += R(b[0] - 4, b[1], b[2] + 8, 10, es[2]);                                                                              // setback ledge
      if (i < 2) { s += R(b[0] + 20, b[1] + 30, b[2] - 40, 6, es[1], ' opacity=".6"') }
    });
    // the mooring mast with its rings and fins, then the antenna needle
    s += cel(boxD(505, 40, 70, 160), es[0], es[1], { lx: -20, ly: 0 });
    for (var y = 60; y < 200; y += 34) s += R(498, y, 84, 10, es[2]);
    s += poly([[500, 200], [520, 120], [540, 200]], es[1]) + poly([[540, 200], [560, 120], [580, 200]], es[1]);
    s += cel('M515,40 L565,40 L548,-40 L532,-40Z', es[0], es[1], { lx: -8, ly: 0 }) + poly([[536, -40], [544, -40], [541, -280]], es[1]);
    if (glow) s += circ(541, -280, 10, '#ff5a3a') ;
    return s;
  }
  function cityStatic(clear) {
    return memo('city' + clear, function () {
      var s = '', g = rnd(clear ? 71 : 7);
      var far = clear ? ['#c8ab88', '#b39678'] : ['#a9a39b', '#99938b'], mid = clear ? ['#a3876b', '#856b53'] : ['#8a837b', '#736d66'], win = clear ? '#7a6350' : '#6a645d';
      for (var x = -760; x < 1820; x += 110 + g() * 70) s += building(x, 1550, 100 + g() * 70, 260 + g() * 520, { c: far, seed: x * 3 + 1, win: null });
      s += '<g id="esb">' + empireState(clear, !clear) + '</g>';
      g = rnd(clear ? 91 : 11);
      for (x = -700; x < 1820; x += 180 + g() * 80) { if (x > 160 && x < 860) continue; s += building(x, 1700, 150 + g() * 60, 260 + g() * 460, { c: mid, seed: x * 7 + 3, win: win, lit: !clear, rim: clear }) }
      return s;
    });
  }
  function rooftops(clear) { // dark foreground rooftops for depth
    return memo('roof' + clear, function () {
      var c = clear ? ['#4a3a30', '#33281f'] : ['#3a3632', '#2a2724'], s = '';
      s += cel('M-700,1900 L-700,1640 L-260,1640 L-260,1580 L120,1580 L120,1700 L460,1700 L460,1620 L980,1620 L980,1560 L1800,1560 L1800,1900Z', c[0], c[1], { lx: 0, ly: -10 });
      s += line(-220, 1580, -226, 1520, c[1], 8) + line(-160, 1580, -154, 1520, c[1], 8) + cel('M-240,1520h100v-110c0,-40 -100,-40 -100,0Z', c[0], c[1], { lx: -12, ly: 0 });
      s += R(700, 1540, 40, 80, c[1]) + R(760, 1500, 30, 120, c[1]) + line(1300, 1560, 1300, 1380, c[1], 6) + line(1260, 1440, 1340, 1440, c[1], 4);
      return s;
    });
  }
  function city(tt, o) {
    o = o || {}; var clear = o.clear, s = '';
    s += R(-900, -900, 2880, 3400, clear ? '#e9c995' : '#b2aca3');
    if (clear) { s += R(-900, 600, 2880, 1600, '#efd4a8') + circ(820, 380, 120, '#fae6bd') + circ(820, 380, 170, '#fae6bd', ' opacity=".35"');
      for (var r = 0; r < 9; r++) { var a = r / 9 * Math.PI * 2 + tt * .05; s += beam(820, 380, 0, 820 + Math.cos(a) * 1400, 380 + Math.sin(a) * 1400, 260, '#fff2d0', .12) } }
    if (!clear) s += fogBand(1300, tt, 25, .55, 31);
    s += cityStatic(clear);
    if (o.smoke) {
      for (var i = 0; i < 12; i++) { var age = ((tt * .3 + i / 12) % 1), rr = 30 + age * 200; s += puff(600 + age * 560 + Math.sin(i) * 40, 400 - age * 820, rr * o.smoke, '#3a3430', '#26211e', 100 + i, .9 * (1 - age * .6)) }
      s += circ(585, 420, 24 + 6 * Math.sin(tt * 20), '#f07a1a') + circ(585, 420, 12, '#ffd36a');
    }
    if (!clear) { var f = o.fog == null ? 1 : o.fog; s += fogBand(300, tt, 30, .92 * f, 3) + fogBand(80, tt + 30, -22, .9 * f, 5) + fogBand(520, tt + 60, 18, .75 * f, 9) + fogBand(-200, tt, 14, .9 * f, 13) }
    if (clear) for (i = 0; i < 7; i++) { var bx = ((tt * 60 + i * 90) % 1800) - 300, by = 520 + Math.sin(i * 2) * 80 + Math.sin(tt * 2 + i) * 10, fl = Math.sin(tt * 12 + i) * 14; s += '<path d="M' + f1(bx - 22) + ',' + f1(by - fl) + ' Q' + f1(bx - 10) + ',' + f1(by - 6) + ' ' + f1(bx) + ',' + f1(by) + ' Q' + f1(bx + 10) + ',' + f1(by - 6) + ' ' + f1(bx + 22) + ',' + f1(by - fl) + '" fill="none" stroke="#4a3a30" stroke-width="5" stroke-linecap="round"/>' }
    return s;
  }

  /* ---------------- inside an old elevator car ---------------- */
  function cabinStatic(warm) {
    return memo('cab' + warm, function () {
      var s = '', wood = warm ? ['#9c6a45', '#7a4f30', '#b07c52'] : ['#7d5133', '#5e3b22', '#8e6040'], brass = ['#c8a24a', '#9c7a2c', '#e2c36e'];
      s += R(-300, -300, 1680, 2600, warm ? '#8e5d3b' : '#6e4529');
      // coffered ceiling with an art-deco fan light
      s += R(-300, -300, 1680, 420, warm ? '#6e4529' : '#57361f');
      for (var x = -260; x < 1300; x += 260) s += cel(boxD(x, -260, 220, 300), wood[0], wood[1], { lx: -10, ly: -10 });
      s += cel('M520,130 L760,130 L700,40 L580,40Z', brass[0], brass[1], { lx: -8, ly: -4 }) + poly([[560, 130], [720, 130], [680, 172], [600, 172]], warm ? '#fff0c8' : '#f2dca0');
      // panels with inlay frames and a diamond in each
      for (x = 200; x < 1100; x += 220) {
        s += cel(boxD(x, 520, 190, 1000), wood[0], wood[1], { lx: -16, ly: 0, rim: P.rim, rw: 4 });
        s += '<rect x="' + (x + 18) + '" y="540" width="154" height="960" fill="none" stroke="' + wood[2] + '" stroke-width="4"/>';
        s += poly([[x + 95, 900], [x + 140, 980], [x + 95, 1060], [x + 50, 980]], wood[2], ' opacity=".7"') + poly([[x + 95, 930], [x + 120, 980], [x + 95, 1030], [x + 70, 980]], brass[0], ' opacity=".7"');
      }
      s += R(-300, 470, 1680, 26, brass[0]) + R(-300, 1540, 1680, 26, brass[0]);
      // brass handrail on brackets
      s += R(180, 1230, 960, 18, brass[0]) + R(180, 1244, 960, 6, brass[1]);
      for (x = 260; x < 1120; x += 280) s += R(x, 1248, 12, 40, brass[1]);
      // tiled floor
      s += R(-300, 1720, 1680, 500, warm ? '#4a3427' : '#3b2a20');
      for (x = -300; x < 1400; x += 80) s += poly([[x, 1720], [x + 40, 1720], [x - 40, 1940], [x - 80, 1940]], warm ? '#5a4232' : '#46332a');
      // control plate with its capacity plaque
      s += cel(boxD(240, 960, 140, 260), brass[0], brass[1], { lx: -10, ly: 0, rim: P.rim, rw: 3 });
      s += R(258, 1130, 104, 60, '#3a2a20') + R(270, 1144, 80, 6, brass[2]) + R(270, 1160, 60, 6, brass[2]) + R(270, 1174, 70, 6, brass[2]);
      for (var i = 0; i < 4; i++) s += circ(270 + i * 28, 990, 8, brass[1]);
      // inspection frame on the wall
      s += R(870, 640, 150, 190, brass[1]) + R(882, 652, 126, 166, '#efe4cc');
      for (i = 0; i < 6; i++) s += R(896, 672 + i * 22, 70 + (i % 3) * 18, 7, '#9a8a70');
      return s;
    });
  }
  function cabin(tt, o) {
    o = o || {}; var s = cabinStatic(!!o.warm);
    var a = (-80 + 160 * (o.floor || 0) / 102) * Math.PI / 180;
    s += cel('M420,400 A220,220 0 0,1 860,400 Z', '#c8a24a', '#9c7a2c', { lx: -10, ly: -6 }) + '<path d="M450,398 A190,190 0 0,1 830,398 Z" fill="#f2e6c8"/>';
    for (var i = 0; i <= 10; i++) { var b = (-80 + 16 * i) * Math.PI / 180; s += line(640 + Math.sin(b) * 160, 400 - Math.cos(b) * 160, 640 + Math.sin(b) * 185, 400 - Math.cos(b) * 185, '#3a2a20', i % 5 ? 3 : 6) }
    [[-80, '1'], [0, '50'], [80, '102']].forEach(function (q) { var b = q[0] * Math.PI / 180; s += txt(640 + Math.sin(b) * 128 - 14, 400 - Math.cos(b) * 128 + 8, q[1], 22, '#3a2a20') });
    s += line(640, 400, 640 + Math.sin(a) * 170, 400 - Math.cos(a) * 170, '#b5300c', 9, ' stroke-linecap="round"') + circ(640, 400, 16, '#3a2a20');
    s += txt(612, 452, String(Math.round(o.floor || 0)), 34, '#3a2a20');
    // folding brass gate on the left
    var gw = 300 * (1 - (o.gate || 0));
    s += R(-300, 470, 300 + gw * .1, 1260, '#1c1410');
    for (var gx = 0; gx < gw; gx += 36) s += line(-20 + gx, 520, gx + 16, 1700, '#c8a24a', 6) + line(gx + 16, 520, -20 + gx, 1700, '#9c7a2c', 6);
    var la = (o.lever || 0) * Math.PI / 180, lx = 310 + Math.sin(la) * 120, ly = 1090 - Math.cos(la) * 120;
    s += line(310, 1090, lx, ly, '#2a2320', 16, ' stroke-linecap="round"') + circ(lx, ly, 24, '#1c1410') + circ(310, 1090, 14, '#9c7a2c');
    s += beam(640, 150, 160, 640, 1720, 900, o.warm ? '#ffe2a8' : '#f2dca0', .12);
    return s;
  }

  /* ---------------- the B-25 ---------------- */
  function plane(x, y, sc, tt) {
    var s = '<g transform="translate(' + f1(x) + ',' + f1(y) + ') scale(' + sc + ')">', ol = ['#5f6342', '#454830', '#72764f'];
    s += line(-240, -92, 430, -150, '#2a2320', 2);                                                   // antenna wire
    s += cel('M380,-50 L420,-175 L472,-180 L492,-40Z', ol[0], ol[1], { lx: -12, ly: 0 });
    s += cel('M-500,10 C-500,-30 -460,-55 -400,-60 L380,-50 C440,-48 480,-30 500,-10 L500,10 C470,25 420,35 380,38 L-400,50 C-460,48 -500,40 -500,10Z', ol[0], ol[1], { lx: 0, ly: -16, rim: P.rim, rw: 6, rwy: 4 });
    s += '<path d="M-470,30 L380,26 C420,30 460,24 490,14 L480,26 C440,38 400,42 380,40 L-400,52 C-440,50 -470,44 -470,30Z" fill="#8d8f86"/>';
    [-360, -180, 0, 140, 280].forEach(function (px) { s += line(px, -58, px + 4, 44, ol[1], 2.5) });  // panel lines
    s += line(-400, -20, 380, -14, ol[1], 2);
    s += '<path d="M-500,10 C-500,-30 -470,-52 -430,-58 L-420,44 C-470,42 -500,32 -500,10Z" fill="#9fb4bc"/><path d="M-470,-46 L-468,40 M-445,-56 L-442,44 M-500,6 L-420,4" stroke="#454830" stroke-width="5"/>';
    s += line(-506, 6, -560, 4, '#2a2320', 6);                                                       // nose gun
    s += '<path d="M-340,-58 C-320,-104 -230,-108 -196,-58Z" fill="#9fb4bc"/><path d="M-300,-92 L-296,-58 M-250,-102 L-250,-58" stroke="#454830" stroke-width="4"/>';
    s += circ(-262, -72, 15, '#1c1a16') + '<path d="M-286,-52 C-280,-82 -244,-84 -238,-52Z" fill="#1c1a16"/>';
    s += R(60, -36, 40, 24, '#9fb4bc') + R(180, -34, 30, 22, '#9fb4bc');                             // waist windows
    s += '<path d="M360,-12 L505,-32 L505,-2 L360,8Z" fill="' + ol[1] + '"/>';
    s += cel('M-300,-6 L-70,-16 L-46,30 L-292,38Z', ol[1], '#34361f', { lx: -10, ly: -4 });
    s += '<path d="M-70,0 C20,4 120,8 200,20" stroke="#2a2724" stroke-width="10" opacity=".45" fill="none"/>'; // exhaust stain
    s += '<path d="M-180,6 L160,-4 L170,10 L-170,18Z" fill="' + ol[2] + '"/>';
    s += '<ellipse cx="-306" cy="16" rx="16" ry="120" fill="#d6d0c6" opacity=".28"/>' + line(-306, 16 - 110 * Math.cos(tt * 40), -306, 16 + 110 * Math.cos(tt * 40), '#2a2320', 7, ' opacity=".7"');
    s += circ(250, -4, 30, '#1c2e50') + '<path d="M250,-30 L257,-11 L277,-11 L261,1 L267,20 L250,8 L233,20 L239,1 L223,-11 L243,-11Z" fill="#f6f1ea"/>';
    s += txt(300, 24, '41-30577', 20, '#e0c870', ' opacity=".8"');
    return s + '</g>';
  }

  /* ---------------- the north face of the building ---------------- */
  function facade(tt, o) {
    var s = R(-500, -500, 2100, 3000, '#a7a39b'), fire = o.fire || 0;
    s += fogBand(500, tt, 40, .8, 21) + fogBand(1500, tt + 20, 30, .7, 23);
    s += memo('facade', function () {
      var q = cel(boxD(-500, -500, 1060, 3000), '#8f877d', '#756e65', { lx: -40, ly: 0, rim: P.rim, rw: 8 });
      for (var y = -480; y < 2500; y += 220) q += R(-500, y + 180, 1060, 10, '#7e776e') + R(-500, y + 190, 1060, 4, '#a39b90');
      for (var x = -440; x < 560; x += 170) q += R(x + 110, -500, 14, 3000, '#9c958b', ' opacity=".7"');
      return q;
    });
    for (var r = 0; r < 13; r++) for (var c = 0; c < 6; c++) {
      var wx = -420 + c * 170, wy = -380 + r * 220, d = Math.hypot(wx - 480, wy - 900), lit = fire > 0 && d < fire * 1000;
      s += R(wx, wy, 90, 140, lit ? (Math.floor(tt * 12 + r + c) % 3 ? '#f07a1a' : '#ffb13a') : '#3a4048') + R(wx + 42, wy, 6, 140, '#756e65') + R(wx, wy + 66, 90, 6, '#756e65');
      if (lit) s += puff(wx + 45, wy - 30, 46 + 8 * Math.sin(tt * 9 + c), '#3a3430', '#26211e', r * 7 + c, .7);
    }
    s += txt(-300, 840, '79', 60, '#5a544d', ' opacity=".6"') + txt(-300, 620, '80', 60, '#5a544d', ' opacity=".6"');
    return s;
  }

  /* ---------------- the 79th-floor hallway ---------------- */
  function hallStatic() {
    return memo('hall', function () {
      var s = R(-600, -300, 3600, 2500, '#8b8072');
      s += R(-600, -300, 3600, 200, '#6f6559');
      for (var x = -500; x < 2900; x += 420) s += R(x, -100, 140, 24, '#5a5047') + R(x + 40, -76, 60, 16, '#c9bba6');
      s += R(-600, 1200, 3600, 520, '#6f6559') + R(-600, 1190, 3600, 14, '#5a5047');
      for (x = -560; x < 2900; x += 160) s += '<rect x="' + x + '" y="1230" width="130" height="460" fill="none" stroke="#5f564b" stroke-width="5"/>';
      [[180, '7901'], [1000, '7903']].forEach(function (d) { var x0 = d[0];
        s += cel(boxD(x0 - 20, 740, 300, 980), '#4a372b', '#3a2a20', { lx: 0, ly: 0 }) + cel(boxD(x0, 760, 260, 960), '#5a4334', '#47342a', { lx: -14, ly: 0, rim: P.rim, rw: 4 });
        s += R(x0 + 40, 820, 180, 300, '#cdc3b2', ' opacity=".8"') + txt(x0 + 70, 900, d[1], 36, '#3a2a20') + R(x0 + 70, 920, 120, 6, '#3a2a20', ' opacity=".7"');
        s += circ(x0 + 222, 1260, 12, '#c8a24a') + R(x0 + 20, 1640, 220, 20, '#3a2a20') });
      // radiator and a wall sconce
      s += cel(boxD(1450, 1450, 260, 200), '#a39b90', '#7e776e', { lx: -10, ly: 0 }); for (x = 1470; x < 1700; x += 30) s += R(x, 1460, 12, 180, '#7e776e');
      s += R(-600, 1720, 3600, 500, '#4d443b');
      for (x = -600; x < 3000; x += 110) s += poly([[x, 1720], [x + 55, 1720], [x - 10, 1940], [x - 65, 1940]], '#433a32');
      var g = rnd(5); for (var i = 0; i < 30; i++) { var dx = -400 + g() * 3000, dy = 1730 + g() * 140; s += poly([[dx, dy], [dx + 20 + g() * 40, dy - 6 - g() * 14], [dx + 50 + g() * 30, dy + 4]], g() < .5 ? '#2e2a28' : '#6b5d50') }
      for (i = 0; i < 9; i++) { var px = -300 + g() * 2600; s += poly([[px, 1760], [px + 50, 1748], [px + 58, 1780], [px + 6, 1790]], '#e9e1d2') }
      return s;
    });
  }
  function hallway(tt, o) {
    o = o || {}; var s = hallStatic();
    [700, 1500].forEach(function (x, i) { var on = Math.floor(tt * 12 + i * 5) % 9 !== 0; s += cel(boxD(x - 30, 600, 60, 80), '#c8a24a', '#9c7a2c', { lx: -6, ly: 0 }) + (on ? circ(x, 600, 70, '#ffd98a', ' opacity=".35"') : '') });
    var ex = 1880, half = 140 * (1 - (o.door || 0));
    s += R(ex - 24, 690, 328, 1040, '#3b2a20');
    s += R(ex, 720, 280, 1000, o.inside ? '#e8cf95' : '#1c1410');
    if (o.inside) s += o.inside;
    s += cel(boxD(ex, 720, half, 1000), '#c8a24a', '#9c7a2c', { lx: -10, ly: 0 }) + cel(boxD(ex + 280 - half, 720, half, 1000), '#c8a24a', '#9c7a2c', { lx: -10, ly: 0, rim: P.rim, rw: 5 });
    if (half > 6) s += R(ex + half - 3, 720, 3, 1000, '#7a5c1c') + R(ex + 280 - half, 720, 3, 1000, '#7a5c1c');
    var a = (-80 + 160 * (o.floor === undefined ? .78 : o.floor)) * Math.PI / 180;
    s += cel('M1930,640 A90,90 0 0,1 2110,640 Z', '#c8a24a', '#9c7a2c', { lx: -6, ly: -4 }) + '<path d="M1945,638 A75,75 0 0,1 2095,638Z" fill="#f2e6c8"/>' + line(2020, 640, 2020 + Math.sin(a) * 66, 640 - Math.cos(a) * 66, '#b5300c', 6, ' stroke-linecap="round"');
    // fire glow, smoke and floating paper
    s += '<rect x="-600" y="-300" width="900" height="2600" fill="#f07a1a" opacity="' + f1(.14 + .05 * Math.sin(tt * 13)) + '" style="mix-blend-mode:screen"/>';
    s += beam(-400, 200, 200, 900, 1720, 600, '#ffb13a', .1);
    for (var i = 0; i < 9; i++) s += puff(((i * 380 + tt * 60) % 3600) - 600, 220 + (i % 3) * 150, 150, '#3a3430', '#2a2522', 50 + i, .6);
    for (i = 0; i < 6; i++) { var px = ((i * 520 + tt * 90) % 3200) - 500, py = 400 + (i % 3) * 300 + Math.sin(tt * 2 + i) * 60, rt = tt * 140 + i * 50; s += '<rect x="-20" y="-14" width="40" height="28" fill="#efe7d8" transform="translate(' + f1(px) + ',' + f1(py) + ') rotate(' + f1(rt) + ') scale(1,' + f1(Math.cos(tt * 4 + i)) + ')"/>' }
    return s;
  }

  /* ---------------- the shaft ---------------- */
  var FLOOR = 300, PIT = 80 * FLOOR + 300;
  function shaft(tt, o) {
    var s = '', y0 = o.view[0], y1 = o.view[1], top = Math.floor(y0 / FLOOR) - 1, bot = Math.ceil(y1 / FLOOR) + 1, hgt = y1 - y0 + 800;
    s += R(-2400, y0 - 400, 5880, hgt, '#2b2622');
    s += R(-2400, y0 - 400, 2580, hgt, '#3a332d') + R(900, y0 - 400, 2580, hgt, '#3a332d');
    s += R(236, y0 - 400, 10, hgt, '#6b6157') + R(834, y0 - 400, 10, hgt, '#6b6157');
    for (var f = top; f <= bot; f++) { var n = 80 - f, fy = f * FLOOR; if (n < 0 || fy > PIT) continue;
      // steel cross-bracing on the back wall, a door back on each side with light leaking through
      s += line(250, fy + 30, 830, fy + FLOOR, '#352f29', 10) + line(830, fy + 30, 250, fy + FLOOR, '#352f29', 10);
      s += R(80, fy, 120, 28, '#5a5047') + R(880, fy, 120, 28, '#5a5047');
      s += R(160, fy + 40, 40, 220, '#4a423a') + R(196, fy + 40, 4, 220, '#e8cf95', ' opacity=".6"');
      s += R(240, fy + 120, 14, 40, '#6b6157') + R(826, fy + 120, 14, 40, '#6b6157');
      s += txt(n >= 10 ? 66 : 96, fy + 116, String(n), 70, '#8a7d70');
    }
    if (o.speed > .1) { var g = rnd(Math.floor(tt * 12)); for (var i = 0; i < 22; i++) { var lx = 250 + g() * 580, ly = y0 + g() * (y1 - y0); s += R(lx, ly, 4, 120 + o.speed * 500, '#a89a8a', ' opacity="' + f1(.3 * o.speed) + '"') } }
    if (PIT < y1 + 400) {
      s += R(-2400, PIT, 5880, 900, '#1e1a17') + R(240, PIT - 20, 600, 20, '#2a2522');
      for (i = 0; i < o.coil; i++) { var sq = o.squash ? 1 - .25 * o.squash : 1, cy = PIT - 30 - i * 34 * sq; s += '<ellipse cx="540" cy="' + f1(cy) + '" rx="' + (230 - (i % 2) * 14) + '" ry="34" fill="none" stroke="' + (i % 2 ? '#6b6560' : '#8b8580') + '" stroke-width="18"/><ellipse cx="540" cy="' + f1(cy - 6) + '" rx="' + (230 - (i % 2) * 14) + '" ry="30" fill="none" stroke="#a8a29c" stroke-width="4" opacity=".5"/>' }
    }
    if (o.cableEnd != null) s += '<path d="M540,' + f1(o.cableEnd - 900) + ' C510,' + f1(o.cableEnd - 600) + ' 575,' + f1(o.cableEnd - 300) + ' 540,' + f1(o.cableEnd) + '" fill="none" stroke="#8b8580" stroke-width="16"/>';
    var sqh = o.squash ? 1 - .14 * o.squash : 1, ch = 700 * sqh, ctop = o.car + 700 - ch;
    if (o.air) { var ab = ctop + ch, ah = Math.max(0, (PIT - o.coil * 34 - 40) - ab); s += R(250, ab, 580, ah, '#cfe3ea', ' opacity="' + f1(.2 * o.air) + '"');
      for (i = 0; i < 4; i++) s += line(270, ab + ah * (i + 1) / 5, 810, ab + ah * (i + 1) / 5, '#cfe3ea', 3, ' opacity="' + f1(.35 * o.air) + '" stroke-dasharray="30 20"');
      for (i = 0; i < 3; i++) { var ax = 360 + i * 180, ay = ab + ah * (.75 - ((tt * .8 + i * .3) % 1) * .5); s += '<path d="M' + ax + ',' + f1(ay + 60) + ' L' + ax + ',' + f1(ay - 10) + ' M' + (ax - 26) + ',' + f1(ay + 16) + ' L' + ax + ',' + f1(ay - 14) + ' L' + (ax + 26) + ',' + f1(ay + 16) + '" fill="none" stroke="#f6f1ea" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="' + f1(.9 * o.air) + '"/>' } }
    s += '<path d="M540,' + f1(ctop) + ' C' + f1(540 + 40 * Math.sin(tt * 7)) + ',' + f1(ctop - 300) + ' ' + f1(540 - 50 * Math.sin(tt * 5)) + ',' + f1(ctop - 600) + ' ' + f1(540 + 20 * Math.sin(tt * 3)) + ',' + f1(ctop - 1000) + '" fill="none" stroke="#8b8580" stroke-width="14"/>';
    // the car: steel shell, a cut-away front so we see Betty
    s += cel(boxD(260, ctop, 560, ch), '#7d6a4a', '#5e4e35', { lx: -18, ly: 0, rim: P.rim, rw: 6 });
    s += R(250, ctop - 14, 580, 22, '#5e4e35') + R(250, ctop + ch - 10, 580, 22, '#5e4e35') + R(520, ctop - 60, 40, 50, '#5e4e35');
    s += R(300, ctop + 40, 480, ch - 80, '#2a1d14');
    s += '<g transform="translate(0,' + f1(ctop) + ')"><clipPath id="win"><rect x="300" y="40" width="480" height="' + f1(ch - 80) + '"/></clipPath><g clip-path="url(#win)">' + R(300, 40, 480, 620, '#4a3427') + R(300, 40, 480, 40, '#c8a24a', ' opacity=".5"') + place(betty, tt, { arms: o.speed > .2 ? 'up' : null, face: o.face || 'scared', soot: true }, 560, 640 - (o.float || 0), .5, false) + '</g></g>';
    return s;
  }
  function beams(tt, cy, n, speed) { // foreground girders rushing past the camera (multiplane)
    var s = '', g = rnd(3); for (var i = 0; i < n; i++) { var y = ((cy * speed + i * 900) % 2700) - 900; s += R(-200, cy - 960 + y, 1480, 70, '#1a1613') + R(-200, cy - 960 + y + 70, 1480, 10, '#2e2824') }
    return s;
  }
  function cableClose(tt, o) {
    var s = R(-400, -400, 1880, 2720, '#2b2622') + R(-400, -400, 620, 2720, '#3a332d') + R(860, -400, 620, 2720, '#3a332d');
    for (var y = -400; y < 2300; y += 300) s += R(-400, y, 620, 20, '#4a423a') + R(860, y, 620, 20, '#4a423a');
    var k = o.snap || 0, up = -1400 * Math.pow(k, .6), dn = 1500 * k * k, cw = 90;
    function cable(y0, y1, dx) { var c = cel(boxD(540 - cw / 2 + dx, y0, cw, y1 - y0), '#8b8580', '#6b6560', { lx: -10, ly: 0, rim: P.rim, rw: 4 }); for (var yy = y0 - 40; yy < y1; yy += 46) c += line(540 - cw / 2 + dx, yy, 540 + cw / 2 + dx, yy + 30, '#5a5550', 8); return c }
    s += cable(-400 + up, 900 + up, 40 * Math.sin(k * 20) * k) + cable(1020 + dn, 2400 + dn, 0);
    var g = rnd(Math.floor(tt * 12) + 3);
    for (var i = 0; i < 16; i++) { var a = (g() - .5) * 2.4, l = 60 + g() * (k > 0 && k < .5 ? 260 : 80), yy2 = 960 + (g() - .5) * 60, sx = 540 + (g() - .5) * 80; s += '<path d="M' + f1(sx) + ',' + f1(yy2) + ' L' + f1(sx + Math.sin(a) * l) + ',' + f1(yy2 - Math.cos(a) * l * (i % 2 ? 1 : -1)) + '" stroke="' + (i % 3 ? '#c9b8a0' : '#f07a1a') + '" stroke-width="6" stroke-linecap="round"/>' }
    if (k > 0 && k < .4) { s += circ(540, 960, 140 * (1 - k * 2), '#ffe2a8', ' opacity=".85"'); for (i = 0; i < 24; i++) { var a2 = g() * 6.28, l2 = 100 + g() * 360; s += line(540, 960, 540 + Math.cos(a2) * l2, 960 + Math.sin(a2) * l2, '#ffd36a', 5) } }
    return s;
  }
  function topOfShaft(tt) {
    var s = R(-400, -400, 1880, 2720, '#2b2622') + R(-400, -400, 620, 2720, '#3a332d') + R(860, -400, 620, 2720, '#3a332d') + R(-400, -400, 1880, 480, '#3a332d');
    for (var x = -400; x < 1500; x += 120) s += R(x, -400, 60, 480, '#332c27');
    s += beam(540, -300, 200, 540, 1500, 700, '#e8cf95', .08);
    var a = tt * .5; s += circ(540, 380, 236, '#4a453f') + circ(540, 380, 230, '#6b6560') + circ(540, 380, 190, '#2b2622');
    for (var i = 0; i < 6; i++) { var b = a + i * Math.PI / 3; s += line(540, 380, 540 + Math.cos(b) * 200, 380 + Math.sin(b) * 200, '#6b6560', 22) }
    s += circ(540, 380, 40, '#8b8580') + R(380, 360, 320, 40, '#4a453f');
    [470, 540, 610].forEach(function (cx, j) { s += '<path d="M' + (cx - 140 + j * 70) + ',380 L' + cx + ',2300" stroke="#8b8580" stroke-width="18"/>' });
    var g = rnd(Math.floor(tt * 6));
    for (i = 0; i < 18; i++) { var y = 1050 + g() * 120, x2 = 470 + Math.floor(g() * 3) * 70, l = 30 + g() * 70, an = (g() - .5) * 2.6; s += '<path d="M' + f1(x2) + ',' + f1(y) + ' l' + f1(Math.sin(an) * l) + ',' + f1(-Math.cos(an) * l) + '" stroke="' + (g() < .3 ? '#f07a1a' : '#c9b8a0') + '" stroke-width="5" stroke-linecap="round"/>' }
    s += circ(540, 1110, 120, '#f07a1a', ' opacity="' + f1(.12 + .1 * Math.sin(tt * 11)) + '" style="mix-blend-mode:screen"');
    return s;
  }

  /* ---------------- sub-basement, hospital ---------------- */
  function basement(tt, o) {
    var s = memo('base', function () {
      var q = R(-400, -400, 1880, 2720, '#2e2824');
      for (var y = -380; y < 1640; y += 44) for (var x = -400 + ((y / 44) % 2 ? 0 : 50); x < 1500; x += 100) q += R(x, y, 94, 38, (x + y) % 3 ? '#3a312b' : '#352c27');
      q += R(-400, 1640, 1880, 700, '#1e1a17');
      q += R(-400, 120, 1880, 40, '#5a5047') + R(-400, 190, 1880, 26, '#6b5a48') + circ(200, 140, 30, '#5a5047') + circ(900, 140, 30, '#5a5047');
      for (var i = 0; i < 6; i++) q += '<ellipse cx="540" cy="' + (1700 - i * 22) + '" rx="' + (300 - (i % 2) * 20) + '" ry="40" fill="none" stroke="' + (i % 2 ? '#6b6560' : '#8b8580') + '" stroke-width="18"/>';
      return q;
    });
    var sw = Math.sin(tt * 1.6) * 8; s += '<g transform="rotate(' + f1(sw) + ' 760 216)">' + line(760, 216, 760, 420, '#2a2320', 4) + cel('M720,420 L800,420 L780,450 L740,450Z', '#5a5047', '#3a332d', { lx: -4, ly: 0 }) + beam(760, 450, 60, 760, 1640, 600, '#ffe2a8', .14) + '</g>';
    s += '<g transform="rotate(-5 540 1300)">' + cel('M200,960 L360,930 L470,990 L620,940 L880,975 L900,1620 L600,1650 L210,1630 Z', '#7d6a4a', '#5e4e35', { lx: -20, ly: 0, rim: P.rim, rw: 6 }) + '<path d="M300,1150 L520,1210 L760,1140 M260,1420 L420,1460" fill="none" stroke="#5e4e35" stroke-width="10"/>';
    var hr = o.hole || 0;
    if (hr > 0) s += '<clipPath id="hole"><circle cx="520" cy="1320" r="' + f1(hr) + '"/></clipPath>' + circ(520, 1320, hr + 10, '#ffb13a', ' opacity=".9"') + '<g clip-path="url(#hole)">' + R(300, 1100, 460, 500, '#2a1d14') + place(betty, tt, { face: o.face || 'sleepy', soot: true }, 600, 1820, .62, true) + '</g>';
    s += '</g>';
    s += place(fire2, tt, { arm: 'reach', face: 'determined' }, 900, 1700, .62, false);
    if (o.torch) { var tx = 520 + Math.cos(o.ang) * (hr + 4), ty = 1320 + Math.sin(o.ang) * (hr + 4); s += circ(tx, ty, 180, '#ffd98a', ' opacity=".18" style="mix-blend-mode:screen"') + line(tx + 90, ty + 40, tx, ty, '#2a2320', 16) + circ(tx, ty, 16, '#cfe8ff') + circ(tx, ty, 8, '#ffffff');
      var g = rnd(Math.floor(tt * 12)); for (var i = 0; i < 16; i++) { var a = -Math.PI / 2 + (g() - .5) * 2.4, l = 30 + g() * 160; s += line(tx, ty, tx + Math.cos(a) * l, ty - Math.abs(Math.sin(a)) * l * .3 + l * .6, '#ffd36a', 4) } }
    return s;
  }
  function hospital(tt, o) {
    var s = memo('hosp', function () {
      var q = R(-400, -400, 1880, 2720, '#cbbda8') + R(-400, 1500, 1880, 820, '#9c8a76');
      for (var x = -400; x < 1500; x += 120) q += R(x, 1500, 4, 820, '#8e7c69');
      q += R(110, 250, 540, 580, '#a8957e') + R(140, 280, 480, 520, '#d9e2e0');
      q += building(160, 800, 120, 260, { c: ['#b9b3a8', '#a39d92'], seed: 4, win: '#8e8a82', top: 'water' }) + building(330, 800, 150, 380, { c: ['#aaa49a', '#948e85'], seed: 8, win: '#8e8a82', top: 'step' }) + building(500, 800, 110, 200, { c: ['#b9b3a8', '#a39d92'], seed: 12, win: '#8e8a82', top: 'flat' });
      for (var y = 290; y < 560; y += 34) q += R(140, y, 480, 14, '#e6d2a8');
      q += R(130, 830, 500, 16, '#8b8580');
      q += R(-400, 120, 1880, 20, '#8b8580') + '<path d="M820,140 C840,600 800,1100 840,1500 L1100,1500 L1100,140Z" fill="#9fb4bc" opacity=".55"/>';
      // iron bed with rails, mattress and the IV stand
      q += cel(boxD(60, 1180, 980, 60), '#efe9e0', '#c9c0b4', { lx: -10, ly: -6 });
      for (x = 990; x < 1060; x += 18) q += R(x, 900, 8, 300, '#6b6560');
      q += R(980, 890, 90, 14, '#6b6560') + R(80, 1240, 16, 300, '#6b6560') + R(1000, 1240, 16, 300, '#6b6560') + R(60, 1040, 26, 220, '#6b6560');
      q += R(1110, 520, 10, 980, '#8b8580') + R(1070, 520, 90, 10, '#8b8580') + cel('M1090,530 L1140,530 L1140,640 C1140,660 1090,660 1090,640Z', '#e7f0f2', '#c3d0d4', { lx: -6, ly: 0 }) + '<path d="M1115,660 C1110,900 960,1000 900,1120" fill="none" stroke="#d9e2e0" stroke-width="4"/>';
      q += '<ellipse cx="860" cy="1150" rx="140" ry="54" fill="#f6f1ea"/>';
      q += R(-200, 1100, 220, 400, '#7a6450') + R(-200, 1090, 240, 20, '#5a4a3c') + R(-120, 1030, 46, 60, '#d9e2e0', ' opacity=".8"') + R(-60, 1050, 30, 40, '#cfe3ea');
      return q;
    });
    s += place(nurse, tt, { face: 'sad', look: 0 }, 1190, 1580, .58, false);
    s += '<g transform="translate(150,-96) translate(470,1180) rotate(90) translate(-470,-1180)">' + place(bettyBed, tt, { face: o.face, brace: true }, 470, 1180 + 380, .62, false) + '</g>';
    s += cel('M70,1060 C300,1010 520,1010 680,1050 L700,1190 L70,1190Z', '#0b6f78', '#085860', { lx: -14, ly: -10, rim: P.rim, rw: 5 }) + '<path d="M120,1100 C300,1070 480,1072 640,1100" fill="none" stroke="#085860" stroke-width="4"/>';
    for (var i = 0; i < 6; i++) s += poly([[140 + i * 2, 300 + i * 46], [620, 300 + i * 46 + 30], [1100, 900 + i * 60], [500, 860 + i * 60]], '#fff2d0', ' opacity=".07" style="mix-blend-mode:screen"');
    
    s += R(900, 820, 60, 70, '#8fb3bd', ' opacity=".8"') + circ(915, 800, 22, '#d0322b') + circ(948, 790, 22, '#e0a21a') + circ(930, 765, 20, '#d7959a');
    return s;
  }

  /* ---------------- shots ----------------
     draw(lt, d, T) -> { s, cam:[cx, cy, zoom, roll], fg:[[depth, svg]], grade:[colour, opacity, blend], shake, flash, dim } */
  var SHOTS = [
    { line: 0, draw: function (lt, d, T) { var k = ease(lt / d); // crane up from the rooftops into the fog
      return { s: city(T, { fog: 1 }), cam: [540, lerp(1400, 360, k), lerp(.78, 1.08, k), 0], fg: [[1.7, rooftops(false)], [1.4, fogBand(1500, T, 60, .7, 77, '#cfc9bf')]], grade: ['#7f93a3', .14, 'soft-light'] } } },
    { line: 2, draw: function (lt, d, T) { // insert on the floor dial, then pull back to reveal Betty
      var tb = wt(3, 'runs') - ls(2), pull = clamp((lt - tb) / 1.2, 0, 1), rev = ease((lt - (wt(2, 'twentyyearold') - ls(2) - .4)) / 1.8);
      var s = cabin(T, { floor: 80, lever: lerp(0, -40, pull) }) + place(betty, T, { face: lt > 1.5 ? 'happy' : 'neutral', arm: lt > tb ? 'reach' : null }, 650, 1720, .8, false);
      return { s: s, cam: [lerp(640, 600, rev), lerp(400, 1000, rev), lerp(2.6, 1.02, rev), 0], fg: [[1.5, R(-500, -400, 160, 3000, '#1c1410') + R(-320, -400, 26, 3000, '#c8a24a', ' opacity=".5"')]], grade: ['#ffb46a', .12, 'soft-light'] } } },
    { line: 4, draw: function (lt, d, T) { // the bomber in fog: tilted frame, fog streaming past in front and behind
      var s = R(-1400, -1400, 3900, 4700, '#a3a099') + fogBand(300, T, 260, .8, 41) + fogBand(1500, T, 340, .7, 43) + plane(540, 960 + 10 * Math.sin(T * 2), .95, T);
      var k = ease((lt - (ls(5) - ls(4))) / 2.2);
      return { s: s, cam: [lerp(540, 540 - 262 * .95, k), lerp(960, 960 - 72 * .95, k), lerp(.88, 2.8, k), lerp(-7, -3, k)], fg: [[1.6, fogBand(900, T, 700, .6, 47) + fogBand(2100, T + 5, 820, .5, 49)]], shake: 3, grade: ['#6f8798', .18, 'soft-light'] } } },
    { line: 6, draw: function (lt, d, T) {
      var ti = wt(6, 'slams') - ls(6), fire = lt > ti ? clamp((lt - wt(7, 'fire') + ls(6)) / 3, 0, 1) : 0, s = facade(T, { fire: lt > ti ? Math.max(.12, fire) : 0 }), fg = '';
      if (lt < ti) s += plane(lerp(1800, 835, lt / ti), 900, .55, T);
      else { var e = lt - ti, gg = clamp(e / .9, 0, 1);
        for (var i = 0; i < 9; i++) { var a = i / 9 * 6.28 + 1, r = (120 + i * 18) * gg; s += puff(600 + Math.cos(a) * r * .6, 900 + Math.sin(a) * r * .5, (80 + i * 8) * gg, i % 3 ? '#f07a1a' : '#ffb13a', '#d0322b', 200 + i, 1) }
        s += puff(620, 900, 120 * gg, '#ffe2a8', '#ffb13a', 7, 1);
        for (i = 0; i < 6; i++) s += puff(560 + i * 70, 800 - e * 120 - i * 60, 80 + e * 40, '#3a3430', '#26211e', 300 + i, .85);
        var g = rnd(9); for (i = 0; i < 18; i++) { var dx = 600 + (g() * 1000 - 200) * Math.min(1, e), dy = 900 + (g() - .6) * 500 * Math.min(1, e) + 500 * e * e; fg += '<rect x="-12" y="-8" width="' + f1(20 + g() * 26) + '" height="' + f1(12 + g() * 18) + '" fill="#2a2522" transform="translate(' + f1(dx) + ',' + f1(dy) + ') rotate(' + f1(e * 300 * (g() - .5)) + ')"/>' } }
      var kc = ease((lt - (wt(7, 'fire') - ls(6))) / 2.5);
      return { s: s, cam: [lerp(760, 420, kc), lerp(900, 880, kc), lerp(.82, 1.3, kc), lerp(0, 4, kc)], fg: [[1.5, fg]], shake: lt > ti && lt < ti + 1.4 ? 26 * (1 - (lt - ti) / 1.4) : 0, flash: lt > ti && lt < ti + .17 ? 1 : 0, grade: lt > ti ? ['#ff7a2a', .2, 'soft-light'] : ['#6f8798', .14, 'soft-light'] } } },
    { line: 8, draw: function (lt, d, T) { // silent wide: smoke over the city, people watching from a roof
      var fg = rooftops(false) + silhouette(worker, T, { face: 'sad' }, 140, 1580, .42, true) + silhouette(lady, T, { face: 'sad' }, 280, 1580, .4, true) + silhouette(gent, T, { face: 'sad' }, 620, 1700, .44, true);
      return { s: city(T, { fog: .7, smoke: 1 }), cam: [560, lerp(820, 760, lt / d), lerp(.74, .78, lt / d), 0], fg: [[1.25, fg]], dim: .18, grade: ['#5a5a66', .25, 'saturation'] } } },
    { line: 9, draw: function (lt, d, T) { // low, close: Betty hurt in the smoke
      var s = hallway(T, {}) + place(betty, T, { kneel: true, face: lt < d * .5 ? 'scared' : 'sad', soot: true, headTilt: 6 }, 700, 1720, .62, true);
      return { s: s, cam: [760, 1260, lerp(1.35, 1.48, lt / d), 2], fg: [[1.5, puff(1100, 1880, 260, '#2a2522', '#1c1814', 61, .9) + puff(300, 1900, 220, '#2a2522', '#1c1814', 63, .9)]], grade: ['#ff8a3a', .18, 'soft-light'] } } },
    { line: 10, draw: function (lt, d, T) { // firemen arrive, first aid, then a long tracking move to the elevator, pillars passing in front
      var tThen = wt(10, 'then') - ls(10), s = hallway(T, { door: clamp((lt - tThen - 1.2) / 1, 0, 1) }), v = STRIDE * .62, arrive = 1.6;
      var r1x = lt < arrive ? lerp(1500, 930, lt / arrive) : 930, r2x = lt < arrive ? lerp(1700, 1120, lt / arrive) : 1120;
      var walkT = Math.max(0, lt - tThen), bx = Math.min(700 + v * walkT, 1940), r1w = Math.min(930 + v * walkT, 1780), r2w = Math.min(1120 + v * walkT, 2140), moving = lt > tThen && bx < 1940;
      if (lt < tThen) {
        s += place(betty, T, { kneel: true, face: 'sad', soot: true }, 700, 1720, .62, true);
        s += place(fire2, T, { walk: lt < arrive ? (lt % 1) : null, face: 'determined' }, r2x, 1720, .62, false);
        s += place(fire1, T, lt < arrive ? { walk: (lt + .5) % 1, face: 'determined' } : { kneel: true, arm: 'reach', talk: lt < arrive + 2, face: 'neutral' }, r1x, 1720, .62, false);
      } else {
        s += place(fire2, T, { walk: moving ? (walkT % 1) : null, face: 'determined' }, r2w, 1720, .62, true);
        s += place(betty, T, { walk: moving ? ((walkT + .3) % 1) : null, face: 'sad', soot: true }, bx, 1720, .62, true);
        s += place(fire1, T, { walk: moving ? ((walkT + .6) % 1) : null, arms: 'help', face: 'neutral' }, r1w, 1720, .62, true);
      }
      var cx = lt < tThen ? 820 : lerp(820, 1850, ease(walkT / 3.4)), pil = '';
      for (var x = 500; x < 3000; x += 700) pil += cel(boxD(x, -400, 120, 2600), '#2a2522', '#1c1814', { lx: -10, ly: 0 });
      return { s: s, cam: [cx, 1200, 1.05, 0], fg: [[1.6, pil]], grade: ['#ff8a3a', .14, 'soft-light'] } } },
    { line: 11, draw: function (lt, d, T) { return { s: topOfShaft(T), cam: [540, lerp(760, 1080, ease(lt / d)), lerp(.95, 1.6, ease(lt / d)), lerp(-4, 0, lt / d)], dim: .08, grade: ['#3d6d7a', .2, 'soft-light'] } } },
    { line: 12, draw: function (lt, d, T) { var tc = wt(12, 'close') - ls(12), tm = wt(12, 'move') - ls(12);
      var inside = place(fire1, T, { face: 'neutral' }, 2090, 1720, .58, true) + place(betty, T, { face: 'sad', soot: true }, 1975, 1720, .62, true);
      return { s: hallway(T, { door: 1 - ease((lt - tc) / .9), inside: inside, floor: .78 - (lt > tm ? (lt - tm) * .03 : 0) }), cam: [2020, lerp(1180, 1080, ease(lt / d)), lerp(1.1, 1.35, ease(lt / d)), 0], grade: ['#ff8a3a', .1, 'soft-light'] } } },
    { line: 13, draw: function (lt, d, T) { var ts = wt(13, 'snap') - ls(13), k = lt < ts ? 0 : clamp((lt - ts) / 1.6, 0, 1);
      return { s: cableClose(T, { snap: k }), cam: [540, 960, lerp(1.3, 1, k), lerp(0, 8, k)], shake: k > 0 && k < .4 ? 18 : 3, flash: k > 0 && k < .05 ? .7 : 0, grade: ['#3d6d7a', .2, 'soft-light'] } } },
    { line: 14, draw: function (lt, d, T) { // the fall: frame rolls, girders rush past in front
      var k = lt / d, car = 79 * FLOOR * k * k - 200, sp = clamp(k * 1.6, 0, 1);
      return { s: shaft(T, { view: [car - 1400, car + 2100], car: car, speed: sp, coil: 0, float: 30 * sp, face: 'scared' }), cam: [540, car + 360, 1, 6 * Math.sin(T * 1.7) * sp], fg: [[1, beams(T, car + 360, 3, 1.8)]], shake: 4 + 8 * sp, grade: ['#2f5a6a', .22, 'soft-light'] } } },
    { line: 15, draw: function (lt, d, T) { // explanation in slow motion: pull out to show the coil and the trapped air
      var t0 = ls(15), tc = wt(18, 'crashes'), T0 = t0 + lt, y8 = 79 * FLOOR - 200, crashY = PIT - 9 * 34 - 40 - 700;
      var k = clamp((T0 - t0) / (tc - t0), 0, 1), car = lerp(y8, crashY, 1 - Math.pow(1 - k, 1.6));
      var coilN = Math.round(9 * clamp((T0 - wt(16, 'piles')) / 2.5, 0, 1)), cableEnd = T0 >= ls(16) && T0 < wt(16, 'piles') ? lerp(car + 900, PIT, clamp((T0 - ls(16)) / (wt(16, 'piles') - ls(16)), 0, 1)) : null;
      var air = clamp((T0 - ls(17)) / 1.2, 0, 1), zoom = lerp(1, .42, ease((T0 - t0) / 3)), cy = lerp(car + 360, (car + PIT) / 2, ease((T0 - t0) / 3));
      return { s: shaft(T, { view: [cy - 960 / zoom - 200, cy + 960 / zoom + 200], car: car, speed: .35 * (1 - k), coil: coilN, cableEnd: cableEnd, air: air, float: 12, face: 'scared' }), cam: [540, cy, zoom, 0], grade: ['#2f5a6a', .18, 'soft-light'] } } },
    { line: 18, draw: function (lt, d, T) {
      var tc = wt(18, 'crashes') - ls(18), crashY = PIT - 9 * 34 - 40 - 700, e = lt - tc, sq = e > 0 ? Math.max(0, Math.sin(Math.min(1, e / .5) * Math.PI)) * (1 - Math.min(1, e / 1.2)) + (e > .5 ? .3 : 0) : 0;
      var car = e < 0 ? crashY - 60 * -e : crashY, s = shaft(T, { view: [PIT - 1700, PIT + 900], car: car, speed: 0, coil: 9, squash: e > 0 ? Math.min(1, sq) : 0, air: e < 0 ? 1 : 0, face: e > .6 ? 'sleepy' : 'scared' });
      if (e > 0) for (var i = 0; i < 8; i++) s += puff(300 + i * 70, PIT - 60 - e * 120 - (i % 3) * 30, 50 + e * 80, '#7a6e62', '#5a5047', 400 + i, Math.max(0, .75 - e * .3));
      return { s: s, cam: [540, PIT - 520, .62, e > 0 && e < .6 ? 3 : 0], shake: e > 0 && e < 1 ? 30 * (1 - e) : 0, flash: e > 0 && e < .1 ? .35 : 0, grade: ['#2f5a6a', .2, 'soft-light'] } } },
    { line: 19, draw: function (lt, d, T) { var ta = wt(19, 'alive') - ls(19), hole = clamp(lt / (ta - .4), 0, 1) * 190;
      return { s: basement(T, { hole: hole, torch: lt < ta - .3, ang: lt * 4, face: lt > ta ? 'happy' : 'sleepy' }), cam: [lerp(620, 540, ease(lt / d)), lerp(1250, 1320, ease(lt / d)), lerp(.95, 1.45, ease(lt / d)), 0], grade: lt > ta ? ['#ffc46a', .2, 'soft-light'] : ['#ff9a4a', .14, 'soft-light'] } } },
    { line: 20, draw: function (lt, d, T) { return { s: hospital(T, { face: lt < d * .6 ? 'sad' : 'sleepy' }), cam: [lerp(800, 720, ease(lt / d)), 1100, lerp(1.4, 1.02, ease(lt / d)), 0], grade: ['#cfe0e4', .14, 'soft-light'] } } },
    { line: 21, draw: function (lt, d, T) { // five months later: warm, passengers step in
      var tr = wt(21, 'rides') - ls(21), k = clamp((lt - tr) / 2, 0, 1), inK = clamp(lt / 2.2, 0, 1);
      var s = cabin(T, { warm: true, floor: lerp(1, 40, ease(k)), lever: lerp(0, -40, ease((lt - tr + .4) / .6)), gate: lt < tr - .6 ? 1 : 1 - ease((lt - tr + .6) / .6) });
      s += place(gent, T, { walk: inK < 1 ? (lt % 1) : null, face: 'happy' }, lerp(-200, 900, ease(inK)), 1720, .66, true) + place(lady, T, { walk: inK < 1 ? ((lt + .4) % 1) : null, face: 'happy' }, lerp(-420, 1050, ease(inK)), 1720, .64, true);
      s += place(betty, T, { face: 'happy', arm: lt > tr - .4 ? 'reach' : null }, 650, 1720, .8, false);
      return { s: s, cam: [600, 1020, lerp(1.12, .96, ease(lt / d)), 0], grade: ['#ffc46a', .16, 'soft-light'] } } },
    { line: 22, draw: function (lt, d, T) { var k = ease(lt / d); return { s: city(T, { clear: true }), cam: [540, lerp(220, 900, k), lerp(1.4, .6, k), 0], fg: [[1.5, rooftops(true)]], grade: ['#ffb45a', .16, 'soft-light'] } } }
  ];
  SHOTS.forEach(function (sh, i) { sh.from = i ? ls(sh.line) - .1 : 0 });
  SHOTS.forEach(function (sh, i) { sh.to = i < SHOTS.length - 1 ? SHOTS[i + 1].from : DUR });

  /* ---------------- captions ---------------- */
  function captions(T) {
    var cur = null; for (var i = 0; i < WORDS.length; i++) if (WORDS[i].s <= T + .05) cur = i;
    if (cur == null || T > WORDS[cur].e + 1.2) return '';
    var w = WORDS[cur], lineW = WORDS.filter(function (x) { return x.line === w.line }), idx = lineW.indexOf(w), g0 = Math.floor(idx / 3) * 3, grp = lineW.slice(g0, g0 + 3);
    var s = '<text x="540" y="1700" text-anchor="middle" font-family="Archivo Black, Arial Black, Impact, sans-serif" font-size="62" paint-order="stroke" stroke="#1c1410" stroke-width="14" stroke-linejoin="round">';
    grp.forEach(function (x, j) { s += '<tspan fill="' + (x === w ? '#ffc23a' : '#f6f1ea') + '">' + (j ? ' ' : '') + x.w.toUpperCase().replace(/&/g, '&amp;') + '</tspan>' });
    return s + '</text>';
  }

  /* ---------------- one frame ---------------- */
  var defs = '<defs>' + F.grain('fg', .1) + '<radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".5"/></radialGradient></defs>';
  function camT(c, sx, sy) { return 'translate(' + f1(540 + sx) + ',' + f1(960 + sy) + ') rotate(' + f1(c[3] || 0) + ') scale(' + c[2].toFixed(4) + ') translate(' + f1(-c[0]) + ',' + f1(-c[1]) + ')' }
  function frame(T, opts) {
    T = clamp(T, 0, DUR - .001); var sh = SHOTS[0];
    for (var i = 0; i < SHOTS.length; i++) if (T >= SHOTS[i].from) sh = SHOTS[i];
    if (!sh.ref) sh.ref = sh.draw(0, sh.to - sh.from, sh.from).cam;
    var lt = T - sh.from, r = sh.draw(lt, sh.to - sh.from, T), c = r.cam, ref = sh.ref;
    var g = rnd(Math.floor(T * 12) + 1), sx = r.shake ? (g() - .5) * r.shake * 2 : 0, sy = r.shake ? (g() - .5) * r.shake * 2 : 0;
    var s = defs + '<rect width="1080" height="1920" fill="#1c1410"/><g transform="' + camT(c, sx, sy) + '">' + r.s + '</g>';
    (r.fg || []).forEach(function (L) { // multiplane: nearer layers travel further and grow faster than the world
      var dp = L[0], cl = [ref[0] + (c[0] - ref[0]) * dp, ref[1] + (c[1] - ref[1]) * dp, ref[2] * Math.pow(c[2] / ref[2], dp), c[3]];
      s += '<g transform="' + camT(cl, sx * dp, sy * dp) + '">' + L[1] + '</g>';
    });
    if (r.grade) s += '<rect width="1080" height="1920" fill="' + r.grade[0] + '" opacity="' + r.grade[1] + '" style="mix-blend-mode:' + r.grade[2] + '"/>';
    if (r.dim) s += '<rect width="1080" height="1920" fill="#1c1410" opacity="' + r.dim + '"/>';
    s += '<rect width="1080" height="1920" fill="url(#vig)"/>';
    if (r.flash) s += '<rect width="1080" height="1920" fill="#fff6e0" opacity="' + r.flash + '"/>';
    var fade = Math.max(clamp(1 - T / .8, 0, 1), clamp((T - (DUR - 1.5)) / 1.5, 0, 1)); if (fade) s += '<rect width="1080" height="1920" fill="#000" opacity="' + fade.toFixed(3) + '"/>';
    // a short dip to black between scenes that change place or time (cuts inside a scene stay hard)
    var into = T - sh.from, outOf = sh.to - T; if (sh.dip && into < .25) s += '<rect width="1080" height="1920" fill="#000" opacity="' + f1(1 - into / .25) + '"/>';
    s += '<rect width="1080" height="1920" filter="url(#fg)" style="mix-blend-mode:multiply"/>';
    if (!opts || opts.captions !== false) s += captions(T);
    return s;
  }
  [4, 13, 14, 15].forEach(function (i) { SHOTS[i].dip = true }); // smoke wide, rescue, hospital, five months later

  /* ---------------- soundtrack plan ---------------- */
  function soundPlan() {
    var ev = [], beds = [], mus = [];
    function e(t, type, gain, extra) { var o = { t: t, type: type, gain: gain || 1, pan: 0 }; for (var k in (extra || {})) o[k] = extra[k]; ev.push(o) }
    e(ls(2) + .6, 'bell', .6); e(wt(3, 'runs') + .1, 'scrape', .5); e(wt(3, 'runs') + .5, 'clink', .4);
    e(ls(4), 'engine', 1, { length: ls(6) - ls(4) + 1.2 }); e(wt(6, 'slams') - 1.6, 'riser', .7, { length: 1.6 });
    e(wt(6, 'slams'), 'boom', 1.2); e(wt(6, 'slams') + .05, 'crack', .9); e(wt(7, 'explodes'), 'boom', .7); e(wt(7, 'fire'), 'whoosh', .6, { length: 1.2 });
    e(ls(9), 'heartbeat', .6); e(ls(9) + 1.1, 'heartbeat', .5);
    for (var i = 0; i < 6; i++) e(ls(10) + .1 + i * .3, 'step', .5);
    e(ls(10) + 2, 'cloth', .5); for (i = 0; i < 9; i++) e(wt(10, 'then') + .2 + i * .33, 'step', .45);
    e(ls(11), 'scrape', .5); e(ls(11) + 1.5, 'tick', .4);
    e(wt(12, 'close'), 'scrape', .6); e(wt(12, 'close') + .9, 'thud', .7); e(wt(12, 'move'), 'clink', .5);
    e(wt(13, 'snap'), 'crack', 1.2); e(wt(13, 'snap') + .05, 'sting', .8);
    e(ls(14), 'whoosh', .9, { length: 2.5 }); e(ls(14) + 2.2, 'whoosh', 1, { length: 2.5 }); e(ls(14) + 4.4, 'whoosh', 1, { length: 2.2 });
    for (i = 0; i < 8; i++) e(ls(14) + .4 + i * .7, 'heartbeat', .55);
    e(wt(16, 'piles'), 'thud', .6); e(wt(16, 'piles') + .4, 'clink', .4);
    e(wt(18, 'crashes'), 'boom', 1.1); e(wt(18, 'crashes') + .02, 'crack', .8); e(wt(18, 'crashes') + .3, 'poof', .6);
    e(ls(19) + .2, 'torch', .7, { length: wt(19, 'alive') - ls(19) - .5 }); e(wt(19, 'alive'), 'tada', .5);
    for (i = 0; i < 6; i++) e(ls(21) + .1 + i * .32, 'step', .35);
    e(wt(21, 'rides') - .5, 'scrape', .4); e(wt(21, 'rides'), 'bell', .7);
    function bed(k, a, b) { beds.push({ kind: k, from: ls(a), to: b == null ? DUR : ls(b) }) }
    bed('day', 0, 2); bed('room', 2, 4); bed('none', 4, 6); bed('fire', 6, 8); bed('day', 8, 9); bed('fire', 9, 11); bed('room', 11, 14); bed('none', 14, 19); bed('room', 19, 22); bed('day', 22);
    function m(st, a, b) { mus.push({ style: st, from: a ? ls(a) : 0, to: b == null ? DUR : ls(b) }) }
    m('calm', 0, 4); m('tension', 4, 8); m('sad', 8, 11); m('mystery', 11, 13); m('tension', 13, 18); m('mystery', 18, 19); m('hope', 19, 20); m('sad', 20, 21); m('hope', 21);
    return { duration: DUR, events: ev.sort(function (a, b) { return a.t - b.t }), beds: beds, music: mus, speech: [], mix: { sfx: 1, music: .32, amb: .9 } };
  }

  window.FILM = { frame: frame, DUR: DUR, LINES: LINES, LT: LT, WORDS: WORDS, SHOTS: SHOTS, soundPlan: soundPlan };
})();
