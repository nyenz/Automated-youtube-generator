/* FLAT CARTOON KIT — style 2 for Paper Cinema Studio.
   Look: flat shapes, no outlines, ONE shadow shape per part (light comes from the front-left, shadows fall
   to the back-bottom), a dusty-pink rim light on back edges, black only for hair, stripes, soles and pupils.
   Big head, big nose, big shoes, short legs. Animated on twos (12 drawings a second).
   Everything is SVG built from code, so any character can be posed and animated.
   FLAT.character(opts) -> { svg(t, pose) }   (pose: { walk: phase 0..1 | null, face, look, blink })      */
(function () {
  var F = {}; window.FLAT = F;

  /* ---------------- palette ---------------- */
  F.PAL = {
    bg: '#b99f84', bgDeep: '#a88c71', ground: '#453c35', ink: '#0a0304', cream: '#f6f1ea',
    rim: '#d7959a', rimSoft: '#cf9390', mouth: '#3a0810',
    teal: ['#01848c', '#0b6676'], orange: ['#f04318', '#c8340f'], denim: ['#45788b', '#324855'],
    mustard: ['#e0a21a', '#b37d0c'], plum: ['#6b2c4f', '#4a1c37'], olive: ['#6f7a35', '#525b24'], rust: ['#b4472a', '#86321c'],
    white: ['#f6f1ea', '#d9cfc2'], charcoal: ['#2f2c33', '#1e1c22'], khaki: ['#b49563', '#8f7449'], red: ['#d0322b', '#9e2420']
  };
  F.SKIN = { // base, shade, nose, nose-shade, inner ear
    deep: ['#802626', '#5e0f1f', '#721c24', '#58061d'],
    brown: ['#8a4a2c', '#663219', '#7b3f24', '#5a2a14'],
    tan: ['#c07a50', '#985a35', '#b06c44', '#86492b'],
    light: ['#e3a888', '#c3826a', '#d8977a', '#b47058'],
    pale: ['#f0c3a6', '#d59d84', '#e8b296', '#c98d74']
  };

  /* ---------------- tiny path toolkit (absolute M L C Q Z only) ---------------- */
  function parse(d) {
    var tk = d.match(/[MLCQZ]|-?\d*\.?\d+/g), out = [], c = null, nums = [];
    function flush() { if (!c) return; var n = c === 'Z' ? 0 : c === 'C' ? 6 : c === 'Q' ? 4 : 2; if (!n) { out.push({ c: 'Z', p: [] }); return }
      for (var i = 0; i + n <= nums.length; i += n) { var p = []; for (var j = 0; j < n; j += 2) p.push([+nums[i + j], +nums[i + j + 1]]); out.push({ c: i && c === 'M' ? 'L' : c, p: p }) } }
    tk.forEach(function (x) { if (/[MLCQZ]/.test(x)) { flush(); c = x; nums = [] } else nums.push(x) }); flush();
    return out;
  }
  function str(P) { return P.map(function (s) { return s.c + s.p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1) }).join(' ') }).join('') }
  function tf(P, fn) { return P.map(function (s) { return { c: s.c, p: s.p.map(fn) } }) }
  function M(px, py, ang, dx, dy, sx, sy) { // rotate (deg) and scale around a pivot, then move
    var a = (ang || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); sx = sx || 1; sy = sy || sx;
    return function (q) { var x = (q[0] - px) * sx, y = (q[1] - py) * sy; return [px + x * c - y * s + (dx || 0), py + x * s + y * c + (dy || 0)] };
  }
  function chain() { var fs = [].slice.call(arguments); return function (q) { fs.forEach(function (f) { q = f(q) }); return q } }
  F.parse = parse; F.str = str; F.tf = tf; F.M = M;

  var UID = 0;
  /* cel: the whole look in one helper. Base colour, one shadow shape at the back-bottom, optional pink rim on the back edge. */
  function cel(d, base, shade, o) {
    o = o || {}; var id = 'fc' + (++UID), lx = o.lx === undefined ? -13 : o.lx, ly = o.ly === undefined ? -10 : o.ly, rim = o.rim;
    var s = '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath><g clip-path="url(#' + id + ')">';
    s += '<path d="' + d + '" fill="' + (rim || shade) + '"/>';
    if (rim) s += '<path d="' + d + '" fill="' + shade + '" transform="translate(' + (-(o.rw || 9)) + ',' + (o.rwy || 0) + ')"/>';
    s += '<path d="' + d + '" fill="' + base + '" transform="translate(' + lx + ',' + ly + ')"/></g>';
    return s;
  }
  function fill(d, c, extra) { return '<path d="' + d + '" fill="' + c + '"' + (extra || '') + '/>' }
  F.cel = cel;

  /* a soft tapered limb through joints (hip→knee→ankle or shoulder→elbow→wrist) */
  function limb(pts, ws) {
    var L = [], R = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
      L.push([pts[i][0] + nx * ws[i] / 2, pts[i][1] + ny * ws[i] / 2]); R.push([pts[i][0] - nx * ws[i] / 2, pts[i][1] - ny * ws[i] / 2]);
    }
    var e = pts[pts.length - 1], m = function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1) };
    var d = 'M' + m(L[0]);
    for (i = 1; i < L.length - 1; i++) d += 'Q' + m(L[i]) + ' ' + m([(L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2]);
    d += 'L' + m(L[L.length - 1]);
    var ex = e[0] + (e[0] - pts[pts.length - 2][0]) * .08, ey = e[1] + (e[1] - pts[pts.length - 2][1]) * .08;
    d += 'Q' + m([ex, ey]) + ' ' + m(R[R.length - 1]);
    for (i = R.length - 2; i > 0; i--) d += 'L' + m([(R[i][0] + R[i + 1][0]) / 2, (R[i][1] + R[i + 1][1]) / 2]) + 'Q' + m(R[i]) + ' ' + m(i === 1 ? R[0] : [(R[i][0] + R[i - 1][0]) / 2, (R[i][1] + R[i - 1][1]) / 2]);
    if (R.length === 2) d += 'L' + m(R[0]);
    return d + 'Z';
  }
  function dirv(deg) { var a = deg * Math.PI / 180; return [-Math.sin(a), Math.cos(a)] } // 0 = straight down, + = forward (to the left)
  function add(p, v, k) { return [p[0] + v[0] * k, p[1] + v[1] * k] }
  F.limb = limb;

  /* ---------------- reference shapes (from the original drawing, in its 1012 x 1346 space) ---------------- */
  var REF = {
    head: 'M398,190 C420,160 525,148 572,200 C602,235 602,292 572,326 C546,354 500,374 450,377 C404,380 364,364 351,336 C343,318 348,302 358,296 L386,256Z',
    jaw: 'M345,330 C400,366 470,360 545,318 L560,400 L340,400Z',
    ear: 'M543,270 C568,254 606,268 607,298 C607,322 586,336 562,331 C548,326 538,300 543,270Z',
    earIn: 'M556,286 C572,276 593,286 593,302 C591,318 573,325 561,318 C566,308 562,296 556,286Z',
    nose: 'M305,268 C304,244 330,235 360,239 C392,244 410,262 406,281 C400,300 370,306 340,301 C318,297 306,286 305,268Z',
    noseSh: 'M306,276 C330,266 372,268 405,284 C398,300 370,306 340,301 C320,298 309,289 306,276Z',
    eyeN: 'M407,244 C428,233 462,230 486,238 C488,262 468,278 440,277 C420,275 407,264 407,244Z',
    eyeF: 'M380,244 C390,239 400,239 408,243 C410,254 403,262 392,261 C384,259 379,252 380,244Z',
    lidLine: 'M400,232 C420,206 474,204 490,232',
    browN: 'M420,197 C440,182 476,181 493,192 L491,204 C470,196 446,197 425,209Z',
    browF: 'M381,206 C392,198 406,200 419,205 L417,217 C405,212 395,212 384,218Z',
    capA: 'M398,180 C402,150 450,131 500,131 C562,133 612,160 623,200 C629,226 623,246 615,256 L548,208 C500,186 440,177 398,180Z',
    capB: 'M398,180 C400,172 404,166 410,160 L548,188 L552,210 C500,188 440,178 398,180Z',
    capC: 'M590,150 C612,165 622,185 623,200 C629,226 623,246 615,256 L598,244 C606,212 602,180 590,150Z',
    capBand: 'M426,146 C450,135 486,138 501,150 L499,158 C478,150 450,150 429,157Z',
    brim: 'M610,247 C650,250 692,260 714,272 C702,286 660,291 634,288 C622,281 611,266 610,247Z',
    brimTop: 'M610,247 C650,250 692,260 714,272 C690,270 650,264 616,262Z',
    hairMass: 'M525,190 C590,196 628,235 626,290 C622,335 590,360 552,352 L530,300Z',
    neck: 'M482,345 L508,340 L526,405 L488,412Z',
    collarBack: 'M456,398 C470,384 496,380 520,378 L548,394 L534,442 L470,446Z',
    collarRim: 'M508,379 L548,392 L562,420 L528,434Z',
    jersey: 'M452,400 C420,440 392,510 378,590 C368,650 360,720 357,775 L395,850 L500,758 L560,800 L682,780 L684,640 C692,560 650,450 550,398 L498,470Z',
    jerseyBack: 'M556,402 C640,440 690,540 684,640 L640,640 C640,560 620,470 556,402Z',
    jerseyLow: 'M368,690 C400,740 440,745 500,705 L498,760 L395,848 L357,775Z',
    vneck: 'M452,400 L498,478 L552,396Z',
    vrim: 'M546,394 L556,400 L504,480 L498,476Z',
    hem1: 'M368,790 L492,726 L500,758 L384,822Z',
    hem2: 'M384,822 L500,758 L504,772 L398,852Z',
    shoeSole: 'M184,1008 C215,1052 300,1112 384,1130 C398,1112 398,1090 386,1074 C330,1058 250,1030 200,998Z',
    shoeUp: 'M181,996 C186,978 210,976 236,984 L330,1016 L394,1056 L386,1076 C320,1056 240,1026 188,1008Z',
    shoeStripe: 'M188,1010 C240,1032 320,1062 386,1080 L384,1088 C320,1070 236,1040 186,1016Z',
    shoeTick: 'M312,1016 L352,1034 L372,1058 L330,1044Z',
    shoeHeel: 'M364,1050 L396,1062 L398,1100 C396,1118 390,1128 384,1130 C380,1105 372,1075 364,1050Z'
  };
  var DREADS = ['M590,262 C640,300 700,335 752,372', 'M585,290 C640,335 700,385 756,428', 'M575,315 C615,365 665,410 716,452', 'M562,330 C592,380 630,420 672,452', 'M552,345 C570,385 596,418 632,442'];
  var R = {}; Object.keys(REF).forEach(function (k) { R[k] = parse(REF[k]) });
  var RD = DREADS.map(parse);
  var DIGIT3 = 'M0,26 L16,4 L54,4 L70,26 L70,64 L56,82 L28,82 M56,82 L70,100 L70,146 L54,168 L16,168 L0,146';

  // the shoe, turned so its sole is flat, with the ankle at (0,0)
  var ANK = [404, 1066], SHOE_FLAT = 31;
  var SH = {}; ['shoeSole', 'shoeUp', 'shoeStripe', 'shoeTick', 'shoeHeel'].forEach(function (k) { SH[k] = tf(R[k], chain(M(ANK[0], ANK[1], -SHOE_FLAT), function (q) { return [q[0] - ANK[0], q[1] - ANK[1]] })) });
  var SOLE_DROP = 0; SH.shoeSole.forEach(function (s) { s.p.forEach(function (q) { SOLE_DROP = Math.max(SOLE_DROP, q[1]) }) });

  /* ---------------- faces ---------------- */
  F.FACES = ['neutral', 'happy', 'surprised', 'annoyed', 'sad', 'sneaky', 'scared', 'sleepy'];
  var FACE = { // brow lift/tilt, lid (0 open..1 shut), pupil offset, eye scale, mouth
    neutral: { bl: 0, bt: 0, lid: .12, px: 0, py: 0, es: 1, mouth: 'smile' },
    happy: { bl: -6, bt: -4, lid: 0, px: -2, py: -1, es: 1, mouth: 'grin', cheek: 1 },
    surprised: { bl: -20, bt: -6, lid: 0, px: 0, py: 0, es: 1.22, ps: .75, mouth: 'o' },
    annoyed: { bl: 8, bt: 14, lid: .45, px: -3, py: 2, es: 1, mouth: 'flat' },
    sad: { bl: -4, bt: -14, lid: .3, px: 0, py: 6, es: 1, mouth: 'frown' },
    sneaky: { bl: 4, bt: 10, lid: .5, px: 12, py: 0, es: 1, mouth: 'smirk' },
    scared: { bl: -16, bt: -16, lid: 0, px: 4, py: 0, es: 1.15, ps: .65, mouth: 'wobble' },
    sleepy: { bl: 2, bt: -4, lid: .78, px: 0, py: 4, es: 1, mouth: 'flat' }
  };
  var MOUTH = {
    smile: ['M356,299 C400,306 450,296 488,272', 'M362,314 C400,320 440,314 468,302'],
    grin: ['M354,298 C400,306 452,294 492,264', 'M358,300 C398,346 462,332 490,268'],
    o: ['M362,318 C362,306 384,302 392,316 C396,332 368,338 362,318Z'],
    flat: ['M358,306 C400,310 440,306 470,298'],
    frown: ['M358,318 C390,300 432,302 466,318'],
    smirk: ['M360,308 C400,312 440,304 478,282'],
    wobble: ['M358,312 C372,304 382,318 396,310 C410,302 420,316 434,308 C446,302 456,312 466,306']
  };

  /* ---------------- the character ---------------- */
  F.character = function (o) {
    o = o || {};
    var sk = F.SKIN[o.skin || 'deep'], top = F.PAL[o.top || 'teal'], pants = F.PAL[o.pants || 'denim'], cap = o.cap === false ? null : F.PAL[o.cap || 'orange'];
    var hair = o.hair || 'dreads', build = o.build || 1, P = F.PAL, num = o.number === undefined ? '33' : o.number, stripes = o.stripes !== false;
    var shoe = o.shoes === 'dark' ? [P.charcoal[0], P.ink, P.rim] : [P.cream, P.ink, P.rim];

    function svg(t, pose) {
      pose = pose || {}; UID = UID % 100000;
      var ph = pose.walk, walking = ph != null, s = '';
      // ---- skeleton ----
      var A = 30, near = walking ? ph : null, far = walking ? (ph + .5) % 1 : null;
      function legAngles(q) { // q: 0 = heel strike (front), .5 = toe off
        if (q == null) return { th: pose.stance ? pose.stance : 4, kn: 4, ft: 0 };
        var th = A * Math.cos(2 * Math.PI * q), kn, ft;
        if (q < .5) { kn = 6 + 10 * Math.sin(2 * Math.PI * q); ft = q < .12 ? 14 * (1 - q / .12) : q > .34 ? -32 * Math.pow((q - .34) / .16, 1.4) : 0 }
        else { var w = (q - .5) / .5; kn = 6 + 62 * Math.pow(Math.sin(Math.PI * Math.min(1, w * 1.15)), 1.1); ft = -32 * (1 - w) + 14 * w * w; th = A * Math.cos(2 * Math.PI * q) }
        return { th: th, kn: kn, ft: ft };
      }
      var LN = legAngles(near), LF = legAngles(far == null ? null : far);
      if (!walking) { LN = { th: 6, kn: 4, ft: 0 }; LF = { th: -5, kn: 4, ft: 0 } }
      var breathe = Math.sin(t * 2.2) * 3, lean = walking ? 5 : 1;
      var thigh = 128, shin = 132, hipY0 = 822;
      function legPts(hip, L) {
        var k = add(hip, dirv(L.th), thigh), a = add(k, dirv(L.th - L.kn), shin);
        return { hip: hip, knee: k, ank: a, ft: L.ft };
      }
      var hipN = [548, hipY0], hipF = [530, hipY0 - 6];
      var lgN = legPts(hipN, LN), lgF = legPts(hipF, LF);
      // keep the lowest foot on the ground (this also gives the natural bob)
      function soleLow(lg) { var f = M(0, 0, lg.ft), lo = -1e9; SH.shoeSole.forEach(function (sg) { sg.p.forEach(function (q) { lo = Math.max(lo, f(q)[1] + lg.ank[1]) }) }); return lo }
      var GROUND = 1131, dy = GROUND - Math.max(soleLow(lgN), soleLow(lgF));
      [lgN, lgF].forEach(function (lg) { ['hip', 'knee', 'ank'].forEach(function (k) { lg[k] = [lg[k][0], lg[k][1] + dy] }) });
      var root = [545, hipY0 + dy];
      api.last = { ankN: lgN.ank, ankF: lgF.ank, root: root };
      var TOR = chain(M(545, hipY0, -lean, 0, dy), M(545, 700, 0, 0, 0, build, 1)); // torso: lean forward + build width
      var neckP = TOR([505, 395]);
      var headTilt = (walking ? -2 * Math.sin(4 * Math.PI * ph + .8) : Math.sin(t * .9) * 1.5) + (pose.headTilt || 0);
      var HEAD = chain(M(505, 395, headTilt + (pose.face === 'sad' ? 6 : 0)), function (q) { return [q[0] - 505 + neckP[0], q[1] - 395 + neckP[1] + breathe * .4] });

      // arms swing against the legs
      var armA = walking ? -22 * Math.cos(2 * Math.PI * ph) : 3, armF = walking ? -armA : -3;
      function armPts(sh, ang, elb) { var e = add(sh, dirv(ang), 158), w = add(e, dirv(ang + elb), 136); return { sh: sh, el: e, wr: w, ang: ang + elb } }
      var shN = TOR([592, 470]), shF = TOR([470, 468]);
      var arN = armPts(shN, armA, 12 + Math.max(0, armA) * .9), arF = armPts(shF, armF, 12 + Math.max(0, armF) * .9);
      if (pose.arm === 'wave') arN = armPts(shN, 150 + 18 * Math.sin(t * 10), -40);
      if (pose.arm === 'point') arN = armPts(shN, 82, 6);

      // ---------- draw (back to front) ----------
      s += fill('M' + (root[0] - 330) + ',' + (GROUND + 2) + ' C' + (root[0] - 100) + ',' + (GROUND - 6) + ' ' + (root[0] + 160) + ',' + (GROUND - 4) + ' ' + (root[0] + 330) + ',' + (GROUND + 2) + ' C' + (root[0] + 170) + ',' + (GROUND + 10) + ' ' + (root[0] - 120) + ',' + (GROUND + 12) + ' ' + (root[0] - 330) + ',' + (GROUND + 2) + 'Z', P.ground);
      // hair behind (dreads swing a moment later than the head)
      if (hair === 'dreads') {
        var sw = walking ? Math.sin(4 * Math.PI * ph - 1.2) : Math.sin(t * 1.3) * .4;
        s += '<g fill="none" stroke="' + P.ink + '" stroke-linecap="round">';
        var dd = RD.map(function (p, i) { var q = tf(p, HEAD), seg = q[1].p, k = 1 + i * .15; seg[1] = [seg[1][0] + sw * 6 * k, seg[1][1] - sw * 3]; seg[2] = [seg[2][0] + sw * 14 * k, seg[2][1] + Math.abs(sw) * 6 - sw * 8]; return str(q) });
        s += dd.map(function (d) { return '<path d="' + d + '" stroke-width="15"/>' }).join('') + dd.map(function (d) { return '<path d="' + d + '" stroke-width="25" stroke-dasharray="13 21"/>' }).join('') + '</g>';
      }
      if (hair === 'bun') { var bc = HEAD([600, 200]); s += '<circle cx="' + bc[0] + '" cy="' + bc[1] + '" r="44" fill="' + P.ink + '"/>' }
      // far arm (behind the body, darker)
      s += arm(arF, true);
      // far leg then near leg
      s += leg(lgF, true) + leg(lgN, false);
      // neck + torso
      s += fill(str(tf(R.neck, TOR)), sk[1]);
      s += fill(str(tf(R.collarBack, TOR)), P.cream) + fill(str(tf(R.collarRim, TOR)), P.rimSoft);
      var jd = str(tf(R.jersey, TOR));
      s += cel(jd, top[0], top[1], { lx: -40, ly: 0, rim: P.rimSoft, rw: 7 });
      s += fill(str(tf(R.jerseyLow, TOR)), top[1]);
      s += fill(str(tf(R.vneck, TOR)), P.cream) + '<path d="' + str(tf(parse('M466,412 L497,458 L540,398'), TOR)) + '" fill="none" stroke="' + P.ink + '" stroke-width="4"/>' + fill(str(tf(R.vrim, TOR)), P.rimSoft);
      if (stripes) s += fill(str(tf(R.hem1, TOR)), P.ink) + fill(str(tf(R.hem2, TOR)), P.cream);
      if (num) { var digs = String(num).split(''), x0 = 388; s += '<g fill="none" stroke="' + (o.numberColor ? F.PAL[o.numberColor][0] : P.orange[0]) + '" stroke-width="30" stroke-linejoin="miter">'; digs.forEach(function (dg, i) { var base = TOR([x0 + i * 62, 540 - i * 16]); s += '<path transform="translate(' + base[0].toFixed(1) + ',' + base[1].toFixed(1) + ') rotate(' + (-lean) + ') skewX(-7) scale(' + (i ? .92 : .62) + ',' + (i ? .9 : .84) + ')" d="' + digitPath(dg) + '"/>' }); s += '</g>' }
      s += '<path d="' + str(tf(parse('M590,470 C580,520 560,580 528,640'), TOR)) + '" fill="none" stroke="' + top[1] + '" stroke-width="3"/>';
      // near arm over the body
      s += arm(arN, false);
      // head
      s += head(HEAD, pose, t);
      return s;
    }

    function digitPath(d) {
      var D = { '3': DIGIT3, '1': 'M14,30 L42,4 L42,168', '0': 'M16,4 L54,4 L70,26 L70,146 L54,168 L16,168 L0,146 L0,26Z', '7': 'M0,4 L70,4 L28,168', '2': 'M0,26 L16,4 L54,4 L70,26 L70,64 L0,168 L70,168', '4': 'M56,168 L56,4 L0,112 L74,112', '5': 'M70,4 L4,4 L0,80 L54,74 L70,96 L70,146 L54,168 L0,160', '8': 'M16,4 L54,4 L70,26 L70,64 L54,82 L16,82 L0,100 L0,146 L16,168 L54,168 L70,146 L70,100 L54,82 M16,82 L0,64 L0,26Z', '9': 'M70,82 L16,82 L0,64 L0,26 L16,4 L54,4 L70,26 L70,146 L54,168 L10,168', '6': 'M60,4 L16,4 L0,26 L0,146 L16,168 L54,168 L70,146 L70,100 L54,82 L0,82' };
      return D[d] || D['3'];
    }

    function leg(lg, isFar) {
      var c = isFar ? pants[1] : pants[0], sh = isFar ? '#24353f' : pants[1], s = '';
      // shoe
      var f = chain(M(0, 0, lg.ft), function (q) { return [q[0] + lg.ank[0], q[1] + lg.ank[1]] });
      var up = isFar ? P.rim : shoe[0], stripe = isFar ? '#b5767c' : P.rim;
      s += fill(str(tf(SH.shoeSole, f)), P.ink) + fill(str(tf(SH.shoeUp, f)), up) + fill(str(tf(SH.shoeStripe, f)), stripe) + fill(str(tf(SH.shoeTick, f)), P.ink) + fill(str(tf(SH.shoeHeel, f)), stripe);
      // sock cuff
      var dirA = Math.atan2(lg.ank[1] - lg.knee[1], lg.ank[0] - lg.knee[0]), ux = Math.cos(dirA), uy = Math.sin(dirA);
      var sockTop = [lg.ank[0] - ux * 30, lg.ank[1] - uy * 30];
      s += fill(limb([sockTop, [lg.ank[0] + ux * 4, lg.ank[1] + uy * 4]], [58, 54]), isFar ? P.rim : P.cream);
      // baggy jeans: wide at the hip, a little flare at the hem
      var hem = [lg.ank[0] - ux * 26, lg.ank[1] - uy * 26];
      var d = limb([lg.hip, lg.knee, hem], [124 * build, 104, 112]);
      s += cel(d, c, sh, { lx: -16, ly: -6, rim: isFar ? null : P.rimSoft, rw: 6 });
      // two soft creases at the knee
      var kx = lg.knee[0], ky = lg.knee[1];
      s += '<g fill="none" stroke="' + (isFar ? '#1b2730' : '#1b2b36') + '" stroke-width="2.2" stroke-linecap="round" opacity=".8"><path d="M' + (kx - 30) + ',' + (ky - 8) + ' C' + (kx - 8) + ',' + (ky - 2) + ' ' + (kx + 10) + ',' + (ky + 6) + ' ' + (kx + 28) + ',' + (ky + 22) + '"/><path d="M' + (kx - 20) + ',' + (ky + 30) + ' C' + (kx - 2) + ',' + (ky + 34) + ' ' + (kx + 12) + ',' + (ky + 40) + ' ' + (kx + 20) + ',' + (ky + 52) + '"/></g>';
      return s;
    }

    function arm(ar, isFar) {
      var s = '', c = isFar ? top[1] : top[0], sh = isFar ? '#084d59' : top[1];
      // hand first (it sits inside the cuff)
      var hv = dirv(ar.ang), hc = add(ar.wr, hv, 30), hd = 'M' + (hc[0] - 30) + ',' + hc[1] + ' a30,34 0 1,0 60,0 a30,34 0 1,0 -60,0Z';
      s += cel(hd, isFar ? sk[1] : sk[0], sk[1], { lx: -10, ly: -8 });
      var th = add(add(ar.wr, hv, 22), [hv[1], -hv[0]], -26); s += '<ellipse cx="' + th[0].toFixed(1) + '" cy="' + th[1].toFixed(1) + '" rx="12" ry="18" transform="rotate(' + (-ar.ang) + ' ' + th[0].toFixed(1) + ' ' + th[1].toFixed(1) + ')" fill="' + (isFar ? sk[1] : sk[0]) + '"/>';
      // baggy sleeve
      var d = limb([ar.sh, ar.el, ar.wr], [132 * build, 116, 104]), id = 'fa' + (++UID);
      s += cel(d, c, sh, { lx: -18, ly: -8, rim: isFar ? null : P.rimSoft, rw: 7 });
      if (stripes) { // hockey stripes near the cuff, clipped to the sleeve
        s += '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath><g clip-path="url(#' + id + ')">';
        var dv = dirv(ar.ang), nv = [dv[1], -dv[0]];
        [[-118, 22, P.cream], [-96, 30, P.ink], [-66, 26, P.cream]].forEach(function (b) {
          var a0 = add(ar.wr, dv, b[0] * -1 * -1), p0 = add(ar.wr, dv, b[0]), p1 = add(ar.wr, dv, b[0] + b[1]);
          var col = isFar ? (b[2] === P.cream ? P.rim : P.ink) : b[2];
          s += '<path d="M' + add(p0, nv, 90).join(',') + ' L' + add(p0, nv, -90).join(',') + ' L' + add(p1, nv, -90).join(',') + ' L' + add(p1, nv, 90).join(',') + 'Z" fill="' + col + '"/>';
        });
        s += '<path d="M' + add(add(ar.wr, dv, -40), nv, 90).join(',') + ' L' + add(add(ar.wr, dv, -40), nv, -90).join(',') + ' L' + add(add(ar.wr, dv, 20), nv, -90).join(',') + ' L' + add(add(ar.wr, dv, 20), nv, 90).join(',') + 'Z" fill="' + P.ink + '"/>';
        s += '</g>';
      }
      return s;
    }

    function head(H, pose, t) {
      var s = '', fc = FACE[pose.face || 'neutral'] || FACE.neutral, id = 'fh' + (++UID);
      var hd = str(tf(R.head, H));
      if (hair === 'dreads') s += fill(str(tf(R.hairMass, H)), P.ink);
      if (hair === 'afro') { var ac = H([520, 210]); s += '<path d="M' + (ac[0] - 120) + ',' + (ac[1] + 40) + ' C' + (ac[0] - 140) + ',' + (ac[1] - 110) + ' ' + (ac[0] + 60) + ',' + (ac[1] - 170) + ' ' + (ac[0] + 140) + ',' + (ac[1] - 60) + ' C' + (ac[0] + 190) + ',' + (ac[1] + 20) + ' ' + (ac[0] + 140) + ',' + (ac[1] + 130) + ' ' + (ac[0] + 70) + ',' + (ac[1] + 120) + 'Z" fill="' + P.ink + '"/>' }
      s += '<clipPath id="' + id + '"><path d="' + hd + '"/></clipPath>';
      s += fill(hd, sk[0]) + '<g clip-path="url(#' + id + ')">' + fill(str(tf(R.jaw, H)), sk[1]);
      if (hair === 'short' || hair === 'bun') s += fill(str(tf(parse('M380,150 C470,120 600,150 610,230 C612,260 600,290 585,300 C570,260 540,232 500,214 C460,200 420,196 380,196Z'), H)), P.ink);
      if (hair === 'bald') s += fill(str(tf(parse('M520,170 C560,175 590,200 600,240 C580,215 555,200 520,190Z'), H)), '#ffffff', ' opacity=".18"');
      if (fc.cheek) s += '<ellipse cx="' + H([450, 300])[0] + '" cy="' + H([450, 300])[1] + '" rx="34" ry="16" fill="' + sk[1] + '" opacity=".5"/>';
      s += '</g>';
      s += fill(str(tf(R.ear, H)), sk[0]) + fill(str(tf(R.earIn, H)), sk[1]);
      if (o.earring !== false) { var er = H([548, 322]); s += '<rect x="' + er[0].toFixed(1) + '" y="' + er[1].toFixed(1) + '" width="9" height="21" rx="3.5" fill="#f0a014"/>' }
      // mouth
      var mo = MOUTH[fc.mouth] || MOUTH.smile;
      if (pose.talk) mo = Math.floor(t * 9) % 2 ? MOUTH.o : mo;
      mo.forEach(function (m, i) { var closed = /Z$/.test(m); s += '<path d="' + str(tf(parse(m), H)) + '" fill="' + (closed || fc.mouth === 'grin' && i === 1 ? P.mouth : 'none') + '" stroke="' + P.mouth + '" stroke-width="' + (i ? 1.6 : 3) + '" stroke-linecap="round"/>' });
      if (fc.mouth === 'grin') s += fill(str(tf(parse('M372,312 C400,322 440,318 470,300 L474,306 C444,326 400,330 372,320Z'), H)), P.cream);
      // nose
      var nf = o.nose || 1, NZ = chain(M(406, 270, 0, 0, 0, nf), H);
      s += fill(str(tf(R.nose, NZ)), sk[2]) + fill(str(tf(R.noseSh, NZ)), sk[3]);
      // eyes: whites, pupils, lids (blink + expression), brows
      var blink = pose.blink != null ? pose.blink : ((t % 3.7) < .12 ? 1 : 0), lid = Math.max(fc.lid, blink);
      var lookX = (pose.look || 0) * 10 + fc.px, ES = function (c) { return chain(M(c[0], c[1], 0, 0, 0, fc.es), H) };
      [['eyeF', [394, 250], 6.5], ['eyeN', [446, 254], 8]].forEach(function (e) {
        var ed = str(tf(R[e[0]], ES(e[1]))), eid = 'fe' + (++UID), pc = H([e[1][0] - 22 + (e[0] === 'eyeN' ? -4 : 18) + lookX * (e[0] === 'eyeN' ? 1 : .6), e[1][1] - 6 + fc.py]);
        if (e[0] === 'eyeF') pc = H([390 + lookX * .5, 247 + fc.py]); else pc = H([420 + lookX, 245 + fc.py]);
        s += '<clipPath id="' + eid + '"><path d="' + ed + '"/></clipPath>' + fill(ed, '#fff') + '<g clip-path="url(#' + eid + ')"><circle cx="' + pc[0].toFixed(1) + '" cy="' + pc[1].toFixed(1) + '" r="' + (e[2] * (fc.ps || 1)) + '" fill="' + P.ink + '"/>';
        if (lid > 0) { var bb = H([e[1][0], e[1][1] - 30 + lid * 44]); s += '<rect x="' + (bb[0] - 70) + '" y="' + (bb[1] - 80) + '" width="140" height="80" fill="' + sk[0] + '" transform="rotate(' + (fc.bt * .6) + ' ' + bb[0] + ' ' + bb[1] + ')"/>' + '<line x1="' + (bb[0] - 70) + '" y1="' + bb[1] + '" x2="' + (bb[0] + 70) + '" y2="' + bb[1] + '" stroke="' + P.mouth + '" stroke-width="3" transform="rotate(' + (fc.bt * .6) + ' ' + bb[0] + ' ' + bb[1] + ')"/>' }
        s += '</g>';
      });
      s += '<path d="' + str(tf(R.lidLine, H)) + '" fill="none" stroke="' + P.mouth + '" stroke-width="1.6" stroke-linecap="round" opacity="' + (lid > .3 ? 0 : 1) + '"/>';
      var BN = chain(M(456, 196, fc.bt, 0, fc.bl), H), BF = chain(M(400, 208, -fc.bt * .7, 0, fc.bl), H);
      s += fill(str(tf(R.browN, BN)), P.ink) + fill(str(tf(R.browF, BF)), P.ink);
      // cap
      if (cap) {
        s += cel(str(tf(R.capA, H)), cap[0], cap[1], { lx: -16, ly: -6 }) + fill(str(tf(R.capB, H)), lighten(cap[0])) + fill(str(tf(R.capC, H)), cap[1]);
        s += fill(str(tf(R.capBand, H)), P.ink) + fill(str(tf(R.brim, H)), cap[1]) + fill(str(tf(R.brimTop, H)), lighten(cap[0]));
        s += '<g fill="none" stroke="' + darken(cap[1]) + '" stroke-width="1.8" stroke-linecap="round">' + ['M545,142 C552,160 552,178 548,190', 'M575,150 C582,175 582,205 578,228', 'M500,178 L502,196'].map(function (d) { return '<path d="' + str(tf(parse(d), H)) + '"/>' }).join('') + '</g>';
      }
      return s;
    }
    var api = { svg: svg, opts: o }; return api;
  };

  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] }
  function toHex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16) }).join('') }
  function lighten(c) { return toHex(hex(c).map(function (v) { return v + (255 - v) * .12 })) }
  function darken(c) { return toHex(hex(c).map(function (v) { return v * .72 })) }
  F.lighten = lighten; F.darken = darken;

  /* ---------------- flat props for scenes (same rules: flat, one shadow, pink rim) ---------------- */
  F.props = {
    lamp: function (x, g) { return cel('M' + (x - 9) + ',' + g + ' L' + (x - 7) + ',' + (g - 520) + ' L' + (x + 7) + ',' + (g - 520) + ' L' + (x + 9) + ',' + g + 'Z', '#3b3330', '#2a2320', { lx: -6, ly: 0 }) + cel('M' + (x - 8) + ',' + (g - 520) + ' C' + (x - 8) + ',' + (g - 560) + ' ' + (x + 60) + ',' + (g - 570) + ' ' + (x + 70) + ',' + (g - 540) + ' L' + (x + 64) + ',' + (g - 534) + ' C' + (x + 50) + ',' + (g - 555) + ' ' + (x + 6) + ',' + (g - 550) + ' ' + (x + 6) + ',' + (g - 520) + 'Z', '#3b3330', '#2a2320', { lx: -4, ly: -2 }) + cel('M' + (x + 46) + ',' + (g - 540) + ' L' + (x + 94) + ',' + (g - 540) + ' L' + (x + 84) + ',' + (g - 515) + ' L' + (x + 56) + ',' + (g - 515) + 'Z', '#f0b23a', '#c8861c', { lx: -8, ly: -4 }) },
    plant: function (x, g) { var s = cel('M' + (x - 60) + ',' + (g - 120) + ' L' + (x + 60) + ',' + (g - 120) + ' L' + (x + 46) + ',' + g + ' L' + (x - 46) + ',' + g + 'Z', '#b4472a', '#86321c', { lx: -14, ly: 0, rim: F.PAL.rim, rw: 6 }); [[-50, -260, -20], [0, -320, 0], [50, -250, 20], [-20, -230, -8], [26, -280, 10]].forEach(function (l) { s += cel('M' + x + ',' + (g - 118) + ' C' + (x + l[0] - 40) + ',' + (g + l[1] * .55) + ' ' + (x + l[0] - 10) + ',' + (g + l[1]) + ' ' + (x + l[0] * 1.3) + ',' + (g + l[1]) + ' C' + (x + l[0] + 30) + ',' + (g + l[1] * .7) + ' ' + (x + 20) + ',' + (g - 160) + ' ' + x + ',' + (g - 118) + 'Z', '#2f6b4f', '#1f4d39', { lx: -10, ly: -6 }) }); return s },
    bench: function (x, g) { return cel('M' + (x - 150) + ',' + (g - 120) + ' L' + (x + 150) + ',' + (g - 120) + ' L' + (x + 150) + ',' + (g - 100) + ' L' + (x - 150) + ',' + (g - 100) + 'Z', '#7a4a2e', '#5a321c', { lx: 0, ly: -6, rim: F.PAL.rim, rw: 5 }) + cel('M' + (x - 150) + ',' + (g - 210) + ' L' + (x + 150) + ',' + (g - 210) + ' L' + (x + 150) + ',' + (g - 180) + ' L' + (x - 150) + ',' + (g - 180) + 'Z', '#7a4a2e', '#5a321c', { lx: 0, ly: -8 }) + fill('M' + (x - 130) + ',' + (g - 100) + ' L' + (x - 116) + ',' + (g - 100) + ' L' + (x - 116) + ',' + g + ' L' + (x - 130) + ',' + g + 'Z M' + (x + 116) + ',' + (g - 100) + ' L' + (x + 130) + ',' + (g - 100) + ' L' + (x + 130) + ',' + g + ' L' + (x + 116) + ',' + g + 'Z M' + (x - 126) + ',' + (g - 180) + ' L' + (x - 116) + ',' + (g - 180) + ' L' + (x - 116) + ',' + (g - 120) + ' L' + (x - 126) + ',' + (g - 120) + 'Z M' + (x + 116) + ',' + (g - 180) + ' L' + (x + 126) + ',' + (g - 180) + ' L' + (x + 126) + ',' + (g - 120) + ' L' + (x + 116) + ',' + (g - 120) + 'Z', '#2a2320') },
    window: function (x, y, w, h) { return fill('M' + x + ',' + y + 'h' + w + 'v' + h + 'h' + (-w) + 'Z', '#a88c71') + fill('M' + (x + 14) + ',' + (y + 14) + 'h' + (w - 28) + 'v' + (h - 28) + 'h' + (-(w - 28)) + 'Z', '#3f4f5a') + fill('M' + (x + 14) + ',' + (y + 14) + 'h' + (w - 28) + 'l' + (-(w - 28)) + ',' + (h * .6) + 'Z', '#53656f') + fill('M' + (x + w / 2 - 5) + ',' + (y + 14) + 'h10v' + (h - 28) + 'h-10Z', '#a88c71') },
    door: function (x, g, w, h) { return cel('M' + x + ',' + g + 'v' + (-h) + 'h' + w + 'v' + h + 'Z', '#01848c', '#0b6676', { lx: -14, ly: 0 }) + '<circle cx="' + (x + 24) + '" cy="' + (g - h / 2) + '" r="8" fill="#f0a014"/>' }
  };
  F.grain = function (id, op) { return '<filter id="' + id + '" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch" result="n"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 ' + (op || .1) + '"/></feComponentTransfer></filter>' };
})();
