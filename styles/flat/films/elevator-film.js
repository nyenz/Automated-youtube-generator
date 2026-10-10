/* "The Longest Fall" — a 2-minute flat-cartoon film (9:16). Uses FLAT (flat-kit.js), FILM_SCRIPT and, for sound, KIT.SND.
   Every shot is a function of time, drawn on twos (12 drawings a second). */
(function () {
  var F = window.FLAT, P = F.PAL, W = 1080, H = 1920;

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
  function rnd(seed) { var s = seed % 2147483647 || 1; return function () { s = s * 16807 % 2147483647; return s / 2147483647 } }

  /* ---------------- cast ---------------- */
  var betty = F.character({ skin: 'pale', hair: 'bun', cap: false, top: 'navy', number: '', stripes: false, skirt: 'navy', buttons: true, earring: false });
  var res1 = F.character({ skin: 'tan', hair: 'short', cap: false, top: 'white', number: '', stripes: false, pants: 'charcoal', earring: false, shoes: 'dark' });
  var res2 = F.character({ skin: 'brown', hair: 'short', cap: false, top: 'khaki', number: '', stripes: false, pants: 'navy', earring: false, shoes: 'dark' });
  function place(c, tt, pose, x, ground, s, mirror) {
    return '<g transform="translate(' + x.toFixed(1) + ',' + (ground - 1131 * s).toFixed(1) + ') scale(' + (mirror ? -s : s) + ',' + s + ') translate(-545,0)">' + c.svg(tt, pose) + '</g>';
  }
  betty.svg(0, { walk: .06 }); var a1 = betty.last.ankN[0]; betty.svg(0, { walk: .40 }); var STRIDE = (betty.last.ankN[0] - a1) / .34; // character units per walk cycle (1 s)

  /* ---------------- shape helpers ---------------- */
  function R(x, y, w, h, c, ex) { return '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + c + '"' + (ex || '') + '/>' }
  function poly(pts, c, ex) { return '<path d="M' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1) }).join(' L') + 'Z" fill="' + c + '"' + (ex || '') + '/>' }
  function circ(x, y, r, c, ex) { return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + Math.max(0, r).toFixed(1) + '" fill="' + c + '"' + (ex || '') + '/>' }
  function blob(x, y, r, c, seed, ex) { var g = rnd(seed), d = ''; for (var i = 0; i <= 8; i++) { var a = i / 8 * Math.PI * 2, rr = r * (.78 + g() * .3); d += (i ? ' L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ',' + (y + Math.sin(a) * rr * .8).toFixed(1) } return '<path d="' + d + 'Z" fill="' + c + '" stroke="' + c + '" stroke-width="' + (r * .5).toFixed(1) + '" stroke-linejoin="round"' + (ex || '') + '/>' }
  function cel(d, a, b, o) { return F.cel(d, a, b, o) }
  function boxD(x, y, w, h) { return 'M' + x + ',' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'Z' }
  function fogBand(y, tt, speed, op, seed, col) { // long soft layers of fog, drifting
    var g = rnd(seed), s = '', c = col || '#d6d0c6';
    for (var k = 0; k < 4; k++) { var w = 900 + g() * 700, h = 90 + g() * 90, x = ((tt * speed * (.8 + g() * .4) + g() * 3000) % 3400 + 3400) % 3400 - 1100, yy = y + (g() - .5) * 260;
      s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + yy.toFixed(1) + '" rx="' + w.toFixed(0) + '" ry="' + h.toFixed(0) + '" fill="' + c + '" opacity="' + (op * .55).toFixed(2) + '"/>' }
    return s }
  function txt(x, y, str, size, c, ex) { return '<text x="' + x + '" y="' + y + '" font-family="Archivo Black, Arial Black, Impact, sans-serif" font-size="' + size + '" fill="' + c + '"' + (ex || '') + '>' + str + '</text>' }

  /* ---------------- worlds ---------------- */
  function city(tt, o) {
    o = o || {}; var clear = o.clear, s = '';
    s += R(-800, -900, 2680, 3200, clear ? '#e4c79c' : '#aea89f');
    if (clear) { s += R(-800, 700, 2680, 1600, '#ecd3ab'); s += circ(860, 520, 120, '#f6e2b8') }
    var g = rnd(7), back = clear ? '#b39a7d' : '#9a948c', mid = clear ? '#8c7660' : '#857e76';
    for (var x = -700; x < 1800; x += 120 + g() * 60) { var h = 300 + g() * 500; s += R(x, 1500 - h, 110 + g() * 60, 900, back) }
    if (!clear) s += fogBand(1250, tt, 25, .5, 31);
    g = rnd(11); for (x = -650; x < 1800; x += 170 + g() * 70) { if (x > 200 && x < 860) continue; var h2 = 200 + g() * 420; s += cel(boxD(x, 1650 - h2, 150 + g() * 40, 800), mid, F.darken(mid), { lx: -24, ly: 0 }) }
    // the Empire State Building
    var es = clear ? ['#8a7360', '#6a5544'] : ['#6f6962', '#55504a'];
    [[300, 1250, 480, 900], [340, 900, 400, 360], [390, 600, 300, 310], [440, 330, 200, 280], [470, 200, 140, 140], [505, 40, 70, 170]].forEach(function (b) { s += cel(boxD(b[0], b[1], b[2], b[3]), es[0], es[1], { lx: -30, ly: 0, rim: clear ? F.PAL.rim : null, rw: 6 }) });
    s += poly([[530, 40], [550, 40], [541, -260]], es[1]);
    for (x = 320; x < 780; x += 28) s += R(x, 1250, 6, 700, es[1], ' opacity=".55"');
    for (x = 400; x < 690; x += 24) s += R(x, 600, 5, 650, es[1], ' opacity=".55"');
    for (x = 452; x < 640; x += 20) s += R(x, 330, 4, 280, es[1], ' opacity=".55"');
    if (o.smoke) {
      var k = o.smoke;
      for (var i = 0; i < 14; i++) { var age = ((tt * .35 + i / 14) % 1), r = 30 + age * 220; s += blob(600 + age * 520 + Math.sin(i) * 40, 400 - age * 760, r * k, '#2e2a28', 100 + i, ' opacity="' + (.85 * (1 - age * .7)) + '"') }
      s += circ(585, 420, 26 + 6 * Math.sin(tt * 20), '#f07a1a') + circ(585, 420, 14, '#ffd36a');
    }
    if (!clear) { s += fogBand(300, tt, 30, .92 * (o.fog || 1), 3); s += fogBand(80, tt + 30, -22, .9 * (o.fog || 1), 5); s += fogBand(500, tt + 60, 18, .75 * (o.fog || 1), 9); s += fogBand(-200, tt, 14, .9 * (o.fog || 1), 13) }
    return s;
  }

  function cabin(tt, o) { // inside an old elevator car
    o = o || {}; var s = '', warm = o.warm;
    s += R(-200, -200, 1480, 2400, warm ? '#8e5d3b' : '#6e4529');
    for (var x = 200; x < 1080; x += 220) s += cel(boxD(x, 520, 190, 1000), warm ? '#9c6a45' : '#7d5133', warm ? '#7a4f30' : '#5e3b22', { lx: -16, ly: 0, rim: P.rim, rw: 4 });
    s += R(-200, 470, 1480, 26, '#c8a24a') + R(-200, 1540, 1480, 26, '#c8a24a');
    s += R(-200, 1720, 1480, 400, warm ? '#4a3427' : '#3b2a20');
    // light
    s += '<ellipse cx="640" cy="120" rx="260" ry="40" fill="' + (warm ? '#ffe2a8' : '#e8cf95') + '"/>';
    // floor dial
    var a = (-80 + 160 * (o.floor || 0) / 102) * Math.PI / 180;
    s += cel('M420,400 A220,220 0 0,1 860,400 Z', '#c8a24a', '#9c7a2c', { lx: -10, ly: -6 }) + '<path d="M450,398 A190,190 0 0,1 830,398 Z" fill="#f2e6c8"/>';
    for (var i = 0; i <= 10; i++) { var b = (-80 + 16 * i) * Math.PI / 180; s += '<line x1="' + (640 + Math.sin(b) * 160) + '" y1="' + (400 - Math.cos(b) * 160) + '" x2="' + (640 + Math.sin(b) * 185) + '" y2="' + (400 - Math.cos(b) * 185) + '" stroke="#3a2a20" stroke-width="' + (i % 5 ? 3 : 6) + '"/>' }
    s += '<line x1="640" y1="400" x2="' + (640 + Math.sin(a) * 170) + '" y2="' + (400 - Math.cos(a) * 170) + '" stroke="#b5300c" stroke-width="9" stroke-linecap="round"/>' + circ(640, 400, 16, '#3a2a20');
    s += txt(600, 380, String(Math.round(o.floor || 0)), 34, '#3a2a20');
    // gate (folding brass lattice) on the left
    var open = o.gate || 0, gw = 300 * (1 - open);
    s += R(-200, 470, 200 + gw * .1, 1260, '#1c1410');
    for (var gx = 0; gx < gw; gx += 36) s += '<line x1="' + (-20 + gx) + '" y1="520" x2="' + (gx + 16) + '" y2="1700" stroke="#c8a24a" stroke-width="6"/><line x1="' + (gx + 16) + '" y1="520" x2="' + (-20 + gx) + '" y2="1700" stroke="#9c7a2c" stroke-width="6"/>';
    // control lever
    s += cel(boxD(250, 980, 120, 220), '#c8a24a', '#9c7a2c', { lx: -10, ly: 0 });
    var la = (o.lever || 0) * Math.PI / 180, lx = 310 + Math.sin(la) * 120, ly = 1090 - Math.cos(la) * 120;
    s += '<line x1="310" y1="1090" x2="' + lx + '" y2="' + ly + '" stroke="#2a2320" stroke-width="16" stroke-linecap="round"/>' + circ(lx, ly, 24, '#1c1410');
    return s;
  }

  function plane(x, y, sc, tt) {
    var s = '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + sc + ')">', ol = ['#5f6342', '#454830'];
    s += cel('M380,-50 L420,-175 L472,-180 L492,-40Z', ol[0], ol[1], { lx: -12, ly: 0 });
    s += cel('M-500,10 C-500,-30 -460,-55 -400,-60 L380,-50 C440,-48 480,-30 500,-10 L500,10 C470,25 420,35 380,38 L-400,50 C-460,48 -500,40 -500,10Z', ol[0], ol[1], { lx: 0, ly: -16, rim: P.rim, rw: 6, rwy: 4 });
    s += '<path d="M-470,30 L380,26 C420,30 460,24 490,14 L480,26 C440,38 400,42 380,40 L-400,52 C-440,50 -470,44 -470,30Z" fill="#8d8f86"/>';
    s += '<path d="M-500,10 C-500,-30 -470,-52 -430,-58 L-420,44 C-470,42 -500,32 -500,10Z" fill="#9fb4bc"/><path d="M-470,-46 L-468,40 M-445,-56 L-442,44" stroke="#454830" stroke-width="5"/>';
    s += '<path d="M-340,-58 C-320,-104 -230,-108 -196,-58Z" fill="#9fb4bc"/>' + circ(-262, -70, 17, '#1c1a16') + '<path d="M-285,-52 C-280,-80 -244,-82 -240,-52Z" fill="#1c1a16"/>';
    s += '<path d="M360,-12 L505,-32 L505,-2 L360,8Z" fill="' + ol[1] + '"/>';
    s += cel('M-300,-6 L-70,-16 L-46,30 L-292,38Z', ol[1], '#34361f', { lx: -10, ly: -4 });
    s += '<path d="M-180,6 L160,-4 L170,10 L-170,18Z" fill="' + ol[1] + '"/>';
    s += '<ellipse cx="-306" cy="16" rx="16" ry="120" fill="#d6d0c6" opacity=".28"/><line x1="-306" y1="' + (16 - 110 * Math.cos(tt * 40)) + '" x2="-306" y2="' + (16 + 110 * Math.cos(tt * 40)) + '" stroke="#2a2320" stroke-width="7" opacity=".7"/>';
    s += circ(250, -4, 30, '#1c2e50') + '<path d="M250,-30 L257,-11 L277,-11 L261,1 L267,20 L250,8 L233,20 L239,1 L223,-11 L243,-11Z" fill="#f6f1ea"/>';
    return s + '</g>';
  }

  function facade(tt, o) { // the building's north side, seen from the side, with the sky on the right
    var s = R(-400, -400, 1900, 2800, '#a7a39b'), fire = o.fire || 0;
    s += fogBand(500, tt, 40, .8, 21) + fogBand(1500, tt + 20, 30, .7, 23);
    s += cel(boxD(-400, -400, 960, 2800), '#8f877d', '#756e65', { lx: -40, ly: 0, rim: P.rim, rw: 8 });
    for (var r = 0; r < 12; r++) for (var c = 0; c < 5; c++) {
      var wx = -330 + c * 170, wy = -300 + r * 220, d = Math.hypot(wx - 480, wy - 900), lit = fire > 0 && d < fire * 900;
      s += R(wx, wy, 90, 140, lit ? (Math.floor(tt * 12 + r + c) % 3 ? '#f07a1a' : '#ffb13a') : '#3a4048');
      if (lit) s += blob(wx + 45, wy - 20, 50 + 10 * Math.sin(tt * 9 + c), '#2e2a28', r * 7 + c, ' opacity=".55"');
    }
    return s;
  }

  function hallway(tt, o) {
    o = o || {}; var s = R(-400, -200, 3200, 2400, '#8b8072');
    s += R(-400, 1200, 3200, 520, '#6f6559') + R(-400, 1190, 3200, 14, '#5a5047');
    [180, 1000].forEach(function (x) { s += cel(boxD(x, 760, 260, 960), '#5a4334', '#47342a', { lx: -14, ly: 0 }) + R(x + 40, 820, 180, 260, '#c9bba6', ' opacity=".55"') + circ(x + 222, 1260, 10, '#c8a24a') });
    // elevator doors (brass) with the floor dial above
    var ex = 1880, open = o.door || 0, half = 140 * (1 - open);
    s += R(ex - 20, 700, 320, 1030, '#3b2a20');
    s += R(ex, 720, 280, 1000, o.inside ? '#e8cf95' : '#1c1410');
    if (o.inside) s += o.inside;
    s += cel(boxD(ex, 720, half, 1000), '#c8a24a', '#9c7a2c', { lx: -10, ly: 0 }) + cel(boxD(ex + 280 - half, 720, half, 1000), '#c8a24a', '#9c7a2c', { lx: -10, ly: 0, rim: P.rim, rw: 5 });
    var a = (-80 + 160 * (o.floor === undefined ? .78 : o.floor)) * Math.PI / 180;
    s += cel('M1930,640 A90,90 0 0,1 2110,640 Z', '#c8a24a', '#9c7a2c', { lx: -6, ly: -4 }) + '<line x1="2020" y1="640" x2="' + (2020 + Math.sin(a) * 70) + '" y2="' + (640 - Math.cos(a) * 70) + '" stroke="#b5300c" stroke-width="6" stroke-linecap="round"/>';
    s += R(-400, 1720, 3200, 400, '#4d443b');
    var g = rnd(5); for (var i = 0; i < 26; i++) { var dx = -300 + g() * 2900, dy = 1730 + g() * 120; s += poly([[dx, dy], [dx + 20 + g() * 40, dy - 6 - g() * 14], [dx + 50 + g() * 30, dy + 4]], g() < .5 ? '#2e2a28' : '#6b5d50') }
    // fire glow from the left and drifting smoke
    s += '<rect x="-400" y="-200" width="700" height="2400" fill="#f07a1a" opacity="' + (.12 + .05 * Math.sin(tt * 13)) + '"/>';
    for (i = 0; i < 9; i++) s += blob(((i * 380 + tt * 60) % 3400) - 500, 260 + (i % 3) * 140, 260, '#3a3430', 50 + i, ' opacity=".55"');
    return s;
  }

  var FLOOR = 300, PIT = 80 * FLOOR + 300;
  function shaft(tt, o) {
    var s = '', y0 = o.view[0], y1 = o.view[1], top = Math.floor(y0 / FLOOR) - 1, bot = Math.ceil(y1 / FLOOR) + 1;
    s += R(-2000, y0 - 400, 5080, y1 - y0 + 800, '#2b2622');
    s += R(-2000, y0 - 400, 2180, y1 - y0 + 800, '#3a332d') + R(900, y0 - 400, 2180, y1 - y0 + 800, '#3a332d');
    s += R(236, y0 - 400, 10, y1 - y0 + 800, '#5a5047') + R(834, y0 - 400, 10, y1 - y0 + 800, '#5a5047');
    for (var f = top; f <= bot; f++) { var n = 80 - f, fy = f * FLOOR; if (n < 0 || fy > PIT) continue;
      s += R(80, fy, 120, 28, '#5a5047') + R(880, fy, 120, 28, '#5a5047');
      s += txt(n >= 10 ? 70 : 100, fy + 110, String(n), 70, '#8a7d70') + txt(900, fy + 110, String(n), 70, '#8a7d70');
    }
    // speed lines
    if (o.speed > .1) { var g = rnd(Math.floor(tt * 12)); for (var i = 0; i < 18; i++) { var lx = 250 + g() * 580, ly = y0 + g() * (y1 - y0); s += R(lx, ly, 4, 120 + o.speed * 400, '#8a7d70', ' opacity="' + (.25 * o.speed) + '"') } }
    // pit and the coil of fallen cable
    if (PIT < y1 + 400) {
      s += R(-2000, PIT, 5080, 800, '#1e1a17');
      for (i = 0; i < o.coil; i++) { var cy = PIT - 30 - i * 34, sq = o.squash ? 1 - .25 * o.squash : 1; cy = PIT - 30 - i * 34 * sq; s += '<ellipse cx="540" cy="' + cy + '" rx="' + (230 - (i % 2) * 14) + '" ry="34" fill="none" stroke="' + (i % 2 ? '#6b6560' : '#8b8580') + '" stroke-width="18"/>' }
    }
    if (o.cableEnd != null) s += '<path d="M540,' + (o.cableEnd - 900) + ' C510,' + (o.cableEnd - 600) + ' 575,' + (o.cableEnd - 300) + ' 540,' + o.cableEnd + '" fill="none" stroke="#8b8580" stroke-width="16"/>';
    // the car
    var cy0 = o.car, sqh = o.squash ? 1 - .14 * o.squash : 1, ch = 700 * sqh, ctop = cy0 + 700 - ch;
    if (o.air) { // trapped air: pale and squeezed, pushing up
      var ab = ctop + ch, ah = Math.max(0, (PIT - o.coil * 34 - 40) - ab); s += R(250, ab, 580, ah, '#cfe3ea', ' opacity="' + (.18 * o.air) + '"');
      for (i = 0; i < 3; i++) { var ax = 360 + i * 180, ay = ab + ah * (.75 - ((tt * .8 + i * .3) % 1) * .5); s += '<path d="M' + ax + ',' + (ay + 60) + ' L' + ax + ',' + (ay - 10) + ' M' + (ax - 26) + ',' + (ay + 16) + ' L' + ax + ',' + (ay - 14) + ' L' + (ax + 26) + ',' + (ay + 16) + '" fill="none" stroke="#f6f1ea" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity="' + (.9 * o.air) + '"/>' }
    }
    s += '<path d="M540,' + ctop + ' C' + (540 + 40 * Math.sin(tt * 7)) + ',' + (ctop - 300) + ' ' + (540 - 50 * Math.sin(tt * 5)) + ',' + (ctop - 600) + ' ' + (540 + 20 * Math.sin(tt * 3)) + ',' + (ctop - 1000) + '" fill="none" stroke="#8b8580" stroke-width="14"/>';
    s += cel(boxD(260, ctop, 560, ch), '#7d6a4a', '#5e4e35', { lx: -18, ly: 0, rim: P.rim, rw: 6 });
    s += R(300, ctop + 40, 480, ch - 80, '#2a1d14');
    s += '<g transform="translate(0,' + ctop + ')"><clipPath id="win"><rect x="300" y="40" width="480" height="' + (ch - 80) + '"/></clipPath><g clip-path="url(#win)">' + R(300, 40, 480, 620, '#4a3427') + place(betty, tt, { arms: o.speed > .2 ? 'up' : null, face: o.face || 'scared', soot: true }, 560, 640 - (o.float || 0), .5, false) + '</g></g>';
    s += R(260, ctop + 300, 560, 6, '#5e4e35');
    return s;
  }

  function cableClose(tt, o) {
    var s = R(-300, -300, 1680, 2520, '#2b2622') + R(-300, -300, 520, 2520, '#3a332d') + R(860, -300, 520, 2520, '#3a332d');
    var k = o.snap || 0, up = -1400 * Math.pow(k, .6), dn = 1500 * k * k, cw = 90;
    function cable(y0, y1, dx) { var c = ''; c += cel(boxD(540 - cw / 2 + dx, y0, cw, y1 - y0), '#8b8580', '#6b6560', { lx: -10, ly: 0 }); for (var y = y0 - 40; y < y1; y += 46) c += '<path d="M' + (540 - cw / 2 + dx) + ',' + y + ' L' + (540 + cw / 2 + dx) + ',' + (y + 30) + '" stroke="#5a5550" stroke-width="8"/>'; return c }
    s += cable(-300 + up, 900 + up, 40 * Math.sin(k * 20) * k);
    s += cable(1020 + dn, 2300 + dn, 0);
    var g = rnd(Math.floor(tt * 12) + 3);
    for (var i = 0; i < 14; i++) { var a = (g() - .5) * 2.4, l = 60 + g() * (k > 0 && k < .5 ? 240 : 70), y = 960 + (g() - .5) * 60, sx = 540 + (g() - .5) * 80; s += '<path d="M' + sx + ',' + y + ' L' + (sx + Math.sin(a) * l) + ',' + (y - Math.cos(a) * l * (i % 2 ? 1 : -1)) + '" stroke="' + (i % 3 ? '#c9b8a0' : '#f07a1a') + '" stroke-width="' + (k ? 6 : 5) + '" stroke-linecap="round"/>' }
    if (k > 0 && k < .4) { s += circ(540, 960, 120 * (1 - k * 2), '#ffe2a8', ' opacity=".8"'); for (i = 0; i < 20; i++) { var a2 = g() * 6.28, l2 = 100 + g() * 300; s += '<line x1="540" y1="960" x2="' + (540 + Math.cos(a2) * l2) + '" y2="' + (960 + Math.sin(a2) * l2) + '" stroke="#ffd36a" stroke-width="5"/>' } }
    return s;
  }

  function topOfShaft(tt) {
    var s = R(-300, -300, 1680, 2520, '#2b2622') + R(-300, -300, 520, 2520, '#3a332d') + R(860, -300, 520, 2520, '#3a332d');
    s += R(-300, -300, 1680, 380, '#3a332d');
    var a = tt * .5; s += circ(540, 380, 230, '#6b6560') + circ(540, 380, 190, '#2b2622');
    for (var i = 0; i < 6; i++) { var b = a + i * Math.PI / 3; s += '<line x1="540" y1="380" x2="' + (540 + Math.cos(b) * 200) + '" y2="' + (380 + Math.sin(b) * 200) + '" stroke="#6b6560" stroke-width="22"/>' }
    s += circ(540, 380, 40, '#8b8580');
    [470, 540, 610].forEach(function (x, i) { s += '<path d="M' + (x - 140 + i * 70) + ',380 L' + x + ',2300" stroke="#8b8580" stroke-width="18"/>' });
    var g = rnd(Math.floor(tt * 6));
    for (i = 0; i < 16; i++) { var y = 1050 + g() * 120, x2 = 470 + Math.floor(g() * 3) * 70, l = 30 + g() * 70, an = (g() - .5) * 2.6; s += '<path d="M' + x2 + ',' + y + ' l' + (Math.sin(an) * l) + ',' + (-Math.cos(an) * l) + '" stroke="' + (g() < .3 ? '#f07a1a' : '#c9b8a0') + '" stroke-width="5" stroke-linecap="round"/>' }
    s += blob(540, 1110, 90, '#f07a1a', 3, ' opacity="' + (.15 + .1 * Math.sin(tt * 11)) + '"');
    return s;
  }

  function basement(tt, o) {
    var s = R(-300, -300, 1680, 2520, '#2b2622') + R(-300, 1640, 1680, 600, '#1e1a17');
    for (var i = 0; i < 6; i++) s += '<ellipse cx="540" cy="' + (1700 - i * 22) + '" rx="' + (300 - (i % 2) * 20) + '" ry="40" fill="none" stroke="' + (i % 2 ? '#6b6560' : '#8b8580') + '" stroke-width="18"/>';
    s += R(560, -300, 400, 2000, '#e8cf95', ' opacity=".07"');
    // crumpled car
    s += '<g transform="rotate(-5 540 1300)">' + cel('M200,960 L360,930 L470,990 L620,940 L880,975 L900,1620 L600,1650 L210,1630 Z', '#7d6a4a', '#5e4e35', { lx: -20, ly: 0, rim: P.rim, rw: 6 }) + '<path d="M300,1150 L520,1210 L760,1140" fill="none" stroke="#5e4e35" stroke-width="10"/>';
    var hr = o.hole || 0;
    if (hr > 0) s += '<clipPath id="hole"><circle cx="520" cy="1320" r="' + hr + '"/></clipPath>' + circ(520, 1320, hr + 10, '#ffb13a', ' opacity=".9"') + '<g clip-path="url(#hole)">' + R(300, 1100, 460, 500, '#2a1d14') + place(betty, tt, { face: o.face || 'sleepy', soot: true }, 600, 1820, .62, true) + '</g>';
    s += '</g>';
    // rescuer with a cutting torch
    s += place(res2, tt, { arm: 'reach', face: 'determined' }, 900, 1700, .62, false);
    if (o.torch) { var tx = 520 + Math.cos(o.ang) * (hr + 4), ty = 1320 + Math.sin(o.ang) * (hr + 4); s += '<line x1="' + (tx + 90) + '" y1="' + (ty + 40) + '" x2="' + tx + '" y2="' + ty + '" stroke="#2a2320" stroke-width="16"/>' + circ(tx, ty, 16, '#cfe8ff') + circ(tx, ty, 8, '#ffffff');
      var g = rnd(Math.floor(tt * 12)); for (i = 0; i < 14; i++) { var a = -Math.PI / 2 + (g() - .5) * 2.4, l = 30 + g() * 140; s += '<line x1="' + tx + '" y1="' + ty + '" x2="' + (tx + Math.cos(a) * l) + '" y2="' + (ty - Math.abs(Math.sin(a)) * l * .3 + l * .6) + '" stroke="#ffd36a" stroke-width="4"/>' } }
    return s;
  }

  function hospital(tt, o) {
    var s = R(-300, -300, 1680, 2520, '#c9bba6') + R(-300, 1500, 1680, 800, '#9c8a76');
    s += R(120, 260, 520, 560, '#a8957e') + R(150, 290, 460, 500, '#ecd8b2');
    for (var y = 300; y < 780; y += 36) s += R(150, y, 460, 12, '#c9b48e');
    s += R(140, 880, 860, 18, '#8b8580');
    // bed
    s += cel(boxD(60, 1180, 980, 60), '#efe9e0', '#c9c0b4', { lx: -10, ly: -6 });
    s += R(80, 1240, 16, 300, '#8b8580') + R(1000, 1240, 16, 300, '#8b8580') + R(990, 900, 26, 360, '#8b8580') + R(60, 1040, 26, 220, '#8b8580');
    s += '<ellipse cx="860" cy="1150" rx="140" ry="54" fill="#f6f1ea"/>';
    // Betty lying on her back, head on the pillow (right)
    s += '<g transform="translate(150,-96) translate(470,1180) rotate(90) translate(-470,-1180)">' + place(betty, tt, { face: o.face, brace: true }, 470, 1180 + 380, .62, false) + '</g>';
    s += cel('M70,1060 C300,1010 520,1010 680,1050 L700,1190 L70,1190Z', '#0b6f78', '#085860', { lx: -14, ly: -10, rim: P.rim, rw: 5 });
    // flowers
    s += R(900, 820, 60, 70, '#8fb3bd', ' opacity=".8"') + circ(915, 800, 22, '#d0322b') + circ(948, 790, 22, '#e0a21a') + circ(930, 765, 20, '#d7959a');
    return s;
  }

  /* ---------------- shots ---------------- */
  // each: { line, draw(lt, d, T) -> { s, cam:[cx,cy,zoom], shake, flash, dim } }
  var SHOTS = [
    { line: 0, draw: function (lt, d, T) { var k = ease(lt / d); return { s: city(T, { fog: 1 }), cam: [540, lerp(1350, 380, k), lerp(.8, 1.05, k)] } } },
    { line: 2, draw: function (lt, d, T) { var tb = wt(3, 'runs') - ls(2), pull = clamp((lt - tb) / 1.2, 0, 1); var s = cabin(T, { floor: 80, lever: lerp(0, -40, pull), gate: 0 }); s += place(betty, T, { face: lt > 1.5 ? 'happy' : 'neutral', arm: lt > tb ? 'reach' : null }, 650, 1720, .8, false); return { s: s, cam: [600, lerp(1000, 960, ease(lt / d)), lerp(.95, 1.05, ease(lt / d))] } } },
    { line: 4, draw: function (lt, d, T) { var s = R(-1200, -1200, 3500, 4300, '#a7a39b'); s += fogBand(300, T, 260, .8, 41) + fogBand(1500, T, 340, .7, 43); s += plane(540, 960 + 10 * Math.sin(T * 2), .95, T); s += fogBand(900, T, 520, .55, 47) + fogBand(2100, T + 5, 600, .6, 49); var k = ease((lt - (ls(5) - ls(4))) / 2.2); return { s: s, cam: [lerp(540, 540 - 262 * .95, k), lerp(960, 960 - 70 * .95, k), lerp(.9, 2.6, k)], shake: 3 } } },
    { line: 6, draw: function (lt, d, T) {
      var ti = wt(6, 'slams') - ls(6), s, fire = lt > ti ? clamp((lt - wt(7, 'fire') + ls(6)) / 3, 0, 1) : 0;
      s = facade(T, { fire: lt > ti ? Math.max(.12, fire) : 0 });
      if (lt < ti) { var k = lt / ti, px = lerp(1700, 560 + 275, k); s += plane(px, 900, .55, T) }
      else { var e = lt - ti, gg = clamp(e / .9, 0, 1); for (var i = 0; i < 9; i++) { var a = i / 9 * 6.28 + 1, r = (120 + i * 18) * gg; s += blob(600 + Math.cos(a) * r * .6, 900 + Math.sin(a) * r * .5, (90 + i * 10) * gg, i % 3 ? '#f07a1a' : '#ffb13a', 200 + i) } s += blob(620, 900, 140 * gg, '#ffe2a8', 7);
        for (i = 0; i < 6; i++) s += blob(560 + i * 70, 800 - e * 120 - i * 60, 90 + e * 40, '#2e2a28', 300 + i, ' opacity=".8"');
        var g = rnd(9); for (i = 0; i < 16; i++) { var dx = 600 + (g() * 900 - 200) * Math.min(1, e), dy = 900 + (g() - .6) * 500 * Math.min(1, e) + 400 * e * e; s += R(dx, dy, 18 + g() * 20, 10 + g() * 16, '#3a332d') } }
      var kc = ease((lt - (wt(7, 'fire') - ls(6))) / 2.5);
      return { s: s, cam: [lerp(700, 420, kc), lerp(900, 880, kc), lerp(.85, 1.25, kc)], shake: lt > ti && lt < ti + 1.4 ? 26 * (1 - (lt - ti) / 1.4) : 0, flash: lt > ti && lt < ti + .17 ? 1 : 0 } } },
    { line: 8, draw: function (lt, d, T) { return { s: city(T, { fog: .7, smoke: 1 }), cam: [560, lerp(760, 700, lt / d), .78], dim: .3 } } },
    { line: 9, draw: function (lt, d, T) { var s = hallway(T, {}); s += place(betty, T, { kneel: true, face: lt < d * .5 ? 'scared' : 'sad', soot: true, headTilt: 6 }, 700, 1720, .62, true); return { s: s, cam: [760, 1220, lerp(1.25, 1.35, lt / d)] } } },
    { line: 10, draw: function (lt, d, T) {
      var tThen = wt(10, 'then') - ls(10), s = hallway(T, { door: clamp((lt - tThen - 1.2) / 1, 0, 1) }), v = STRIDE * .62;
      var arrive = 1.6, r1x = lt < arrive ? lerp(1500, 930, lt / arrive) : 930, r2x = lt < arrive ? lerp(1700, 1120, lt / arrive) : 1120;
      var walkT = Math.max(0, lt - tThen), bx = Math.min(700 + v * walkT, 1940), r1w = Math.min(930 + v * walkT, 1780), r2w = Math.min(1120 + v * walkT, 2140);
      var moving = lt > tThen && bx < 1940;
      if (lt < tThen) {
        s += place(betty, T, { kneel: true, face: 'sad', soot: true }, 700, 1720, .62, true);
        s += place(res2, T, { walk: lt < arrive ? (lt % 1) : null, face: 'determined' }, r2x, 1720, .62, false);
        s += place(res1, T, lt < arrive ? { walk: (lt + .5) % 1, face: 'determined' } : { kneel: true, arm: 'reach', talk: lt < arrive + 2, face: 'neutral' }, r1x, 1720, .62, false);
      } else {
        s += place(res2, T, { walk: moving ? (walkT % 1) : null, face: 'determined' }, r2w, 1720, .62, true);
        s += place(betty, T, { walk: moving ? ((walkT + .3) % 1) : null, face: 'sad', soot: true }, bx, 1720, .62, true);
        s += place(res1, T, { walk: moving ? ((walkT + .6) % 1) : null, arms: 'help', face: 'neutral' }, r1w, 1720, .62, true);
      }
      var cx = lt < tThen ? 820 : lerp(820, 1850, ease(walkT / 3.4));
      return { s: s, cam: [cx, 1200, 1.05] } } },
    { line: 11, draw: function (lt, d, T) { return { s: topOfShaft(T), cam: [540, lerp(820, 1080, ease(lt / d)), lerp(1, 1.5, ease(lt / d))], dim: .1 } } },
    { line: 12, draw: function (lt, d, T) { var tc = wt(12, 'close') - ls(12), tm = wt(12, 'move') - ls(12);
      var inside = place(res1, T, { face: 'neutral' }, 2090, 1720, .58, true) + place(betty, T, { face: 'sad', soot: true }, 1975, 1720, .62, true);
      var s = hallway(T, { door: 1 - ease((lt - tc) / .9), inside: inside, floor: .78 - (lt > tm ? (lt - tm) * .03 : 0) });
      return { s: s, cam: [2020, lerp(1180, 1100, ease(lt / d)), lerp(1.1, 1.3, ease(lt / d))] } } },
    { line: 13, draw: function (lt, d, T) { var ts = wt(13, 'snap') - ls(13), k = lt < ts ? 0 : clamp((lt - ts) / 1.6, 0, 1); return { s: cableClose(T, { snap: k }), cam: [540, 960, lerp(1.25, 1, k)], shake: k > 0 && k < .4 ? 18 : 3, flash: k > 0 && k < .05 ? .7 : 0 } } },
    { line: 14, draw: function (lt, d, T) { var k = lt / d, car = 79 * FLOOR * k * k - 200, sp = clamp(k * 1.6, 0, 1); return { s: shaft(T, { view: [car - 1300, car + 2000], car: car, speed: sp, coil: 0, float: 30 * sp, face: 'scared' }), cam: [540, car + 360, 1], shake: 4 + 8 * sp } } },
    { line: 15, draw: function (lt, d, T) {
      var t0 = ls(15), tc = wt(18, 'crashes'), T0 = t0 + lt, y8 = 79 * FLOOR - 200, crashY = PIT - 9 * 34 - 40 - 700;
      var k = clamp((T0 - t0) / (tc - t0), 0, 1), car = lerp(y8, crashY, 1 - Math.pow(1 - k, 1.6));
      var coilT0 = ls(16), coilN = Math.round(9 * clamp((T0 - wt(16, 'piles')) / 2.5, 0, 1)), cableEnd = T0 < wt(16, 'piles') ? lerp(car + 900, PIT, clamp((T0 - coilT0) / (wt(16, 'piles') - coilT0), 0, 1)) : null;
      if (T0 < coilT0) cableEnd = null;
      var air = clamp((T0 - ls(17)) / 1.2, 0, 1), zoom = lerp(1, .42, ease((T0 - t0) / 3)), cy = lerp(car + 360, (car + PIT) / 2, ease((T0 - t0) / 3));
      return { s: shaft(T, { view: [cy - 960 / zoom - 200, cy + 960 / zoom + 200], car: car, speed: .35 * (1 - k), coil: coilN, cableEnd: cableEnd, air: air, float: 12, face: 'scared' }), cam: [540, cy, zoom] } } },
    { line: 18, draw: function (lt, d, T) {
      var tc = wt(18, 'crashes') - ls(18), crashY = PIT - 9 * 34 - 40 - 700, e = lt - tc, sq = e > 0 ? Math.max(0, Math.sin(Math.min(1, e / .5) * Math.PI)) * (1 - Math.min(1, e / 1.2)) + (e > .5 ? .3 : 0) : 0;
      var car = e < 0 ? crashY - 60 * -e : crashY + (sq ? 700 * .14 * sq * .2 : 0);
      var s = shaft(T, { view: [PIT - 1600, PIT + 900], car: car, speed: 0, coil: 9, squash: e > 0 ? Math.min(1, sq) : 0, air: e < 0 ? 1 : 0, face: e > .6 ? 'sleepy' : 'scared' });
      if (e > 0) for (var i = 0; i < 8; i++) s += blob(300 + i * 70, PIT - 60 - e * 120 - (i % 3) * 30, 60 + e * 90, '#7a6e62', 400 + i, ' opacity="' + Math.max(0, .7 - e * .3) + '"');
      return { s: s, cam: [540, PIT - 500, .62], shake: e > 0 && e < 1 ? 30 * (1 - e) : 0 } } },
    { line: 19, draw: function (lt, d, T) { var ta = wt(19, 'alive') - ls(19), hole = clamp(lt / (ta - .4), 0, 1) * 190; return { s: basement(T, { hole: hole, torch: lt < ta - .3, ang: lt * 4, face: lt > ta ? 'happy' : 'sleepy' }), cam: [lerp(600, 540, ease(lt / d)), lerp(1250, 1320, ease(lt / d)), lerp(.95, 1.35, ease(lt / d))] } } },
    { line: 20, draw: function (lt, d, T) { return { s: hospital(T, { face: lt < d * .6 ? 'sad' : 'sleepy' }), cam: [lerp(760, 640, ease(lt / d)), 1100, lerp(1.35, 1.05, ease(lt / d))] } } },
    { line: 21, draw: function (lt, d, T) { var tr = wt(21, 'rides') - ls(21), k = clamp((lt - tr) / 2, 0, 1); var s = cabin(T, { warm: true, floor: lerp(1, 40, ease(k)), lever: lerp(0, -40, ease((lt - tr + .4) / .6)), gate: 0 }); s += place(betty, T, { face: 'happy', arm: lt > tr - .4 ? 'reach' : null }, 650, 1720, .8, false); return { s: s, cam: [600, 1000, lerp(1.15, .98, ease(lt / d))] } } },
    { line: 22, draw: function (lt, d, T) { var k = ease(lt / d); return { s: city(T, { clear: true }), cam: [540, lerp(250, 900, k), lerp(1.35, .62, k)] } } }
  ];
  SHOTS.forEach(function (sh, i) { sh.from = i ? ls(sh.line) - .1 : 0; });
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
  var grainDef = '<defs>' + F.grain('fg', .1) + '<radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".45"/></radialGradient></defs>';
  function frame(T, opts) {
    T = clamp(T, 0, DUR - .001); var sh = SHOTS[0];
    for (var i = 0; i < SHOTS.length; i++) if (T >= SHOTS[i].from) sh = SHOTS[i];
    var lt = T - sh.from, r = sh.draw(lt, sh.to - sh.from, T), c = r.cam, z = c[2];
    var g = rnd(Math.floor(T * 12) + 1), sx = r.shake ? (g() - .5) * r.shake * 2 : 0, sy = r.shake ? (g() - .5) * r.shake * 2 : 0;
    var s = grainDef + '<rect width="1080" height="1920" fill="#1c1410"/><g transform="translate(' + (540 + sx).toFixed(1) + ',' + (960 + sy).toFixed(1) + ') scale(' + z.toFixed(4) + ') translate(' + (-c[0]).toFixed(1) + ',' + (-c[1]).toFixed(1) + ')">' + r.s + '</g>';
    if (r.dim) s += '<rect width="1080" height="1920" fill="#1c1410" opacity="' + r.dim + '"/>';
    s += '<rect width="1080" height="1920" fill="url(#vig)"/>';
    if (r.flash) s += '<rect width="1080" height="1920" fill="#fff6e0" opacity="' + r.flash + '"/>';
    // fade in from black at the start, fade out at the end
    var fade = Math.max(clamp(1 - T / .8, 0, 1), clamp((T - (DUR - 1.5)) / 1.5, 0, 1)); if (fade) s += '<rect width="1080" height="1920" fill="#000" opacity="' + fade.toFixed(3) + '"/>';
    s += '<rect width="1080" height="1920" filter="url(#fg)" style="mix-blend-mode:multiply"/>';
    if (!opts || opts.captions !== false) s += captions(T);
    return s;
  }

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
    e(wt(21, 'rides'), 'bell', .7); e(wt(21, 'rides') + .2, 'scrape', .4);
    function bed(k, a, b) { beds.push({ kind: k, from: ls(a), to: b == null ? DUR : ls(b) }) }
    bed('day', 0, 2); bed('room', 2, 4); bed('none', 4, 6); bed('fire', 6, 8); bed('day', 8, 9); bed('fire', 9, 11); bed('room', 11, 14); bed('none', 14, 19); bed('room', 19, 21); bed('room', 21, 22); bed('day', 22);
    function m(st, a, b) { mus.push({ style: st, from: a ? ls(a) : 0, to: b == null ? DUR : ls(b) }) }
    m('calm', 0, 4); m('tension', 4, 8); m('sad', 8, 11); m('mystery', 11, 13); m('tension', 13, 18); m('mystery', 18, 19); m('hope', 19, 20); m('sad', 20, 21); m('hope', 21);
    return { duration: DUR, events: ev.sort(function (a, b) { return a.t - b.t }), beds: beds, music: mus, speech: [], mix: { sfx: 1, music: .32, amb: .9 } };
  }

  window.FILM = { frame: frame, DUR: DUR, LINES: LINES, LT: LT, WORDS: WORDS, SHOTS: SHOTS, soundPlan: soundPlan };
})();
