/* =========================================================================
   LOW-POLY PEOPLE — K.person(options) builds a rigged person (jointed parts,
   a live face, walking, waving, talking ...). K.mascot('kato'|'nia') are the
   two recurring mascots. The director animates them; assets never do.
   LOCKED FILE: assets USE it, they never edit it.
   ========================================================================= */
(function (root) {
  'use strict';
  var K = root.KIT = root.KIT || {};
  var PAL = K.PALETTE, norm = K.norm, shade = K.shade;
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)) }

  /* ---------------- emotions: the same names as the paper style ---------------- */
  // brow -1..1 (up) · ba brow angle (+ = angry, - = worried) · smile -1..1 · open 0..1 · eye 0..1.3 · wide 0..1 · happy (^ ^ eyes) · blush · tilt (head, degrees) · mouth 'flat'
  K.EMO = {
    neutral:    { brow: 0, ba: 0, smile: .5, open: 0, eye: 1, wide: 0, happy: 0, blush: 0, tilt: 0 },
    happy:      { brow: .25, ba: -.1, smile: 1, open: .12, eye: .85, wide: 0, happy: 0, blush: .45, tilt: 4 },
    surprised:  { brow: .9, ba: -.25, smile: .25, open: .42, eye: 1, wide: 1, happy: 0, blush: 0, tilt: -4 },
    scared:     { brow: .7, ba: -.5, smile: -.5, open: .22, eye: 1, wide: 1, happy: 0, blush: 0, tilt: -3 },
    annoyed:    { brow: -.5, ba: .5, smile: -.2, open: 0, eye: .62, wide: 0, happy: 0, blush: 0, tilt: -3, mouth: 'flat' },
    sleepy:     { brow: -.25, ba: 0, smile: .35, open: .1, eye: .1, wide: 0, happy: 0, blush: .1, tilt: 8 },
    sneaky:     { brow: -.1, ba: .35, smile: .9, open: 0, eye: .55, wide: 0, happy: 0, blush: 0, tilt: 3 },
    determined: { brow: -.2, ba: .4, smile: .3, open: 0, eye: .85, wide: 0, happy: 0, blush: 0, tilt: -4 },
    sad:        { brow: .1, ba: -.5, smile: -.7, open: 0, eye: .8, wide: 0, happy: 0, blush: 0, tilt: 6 },
    worried:    { brow: .4, ba: -.4, smile: -.25, open: .05, eye: 1, wide: .2, happy: 0, blush: 0, tilt: 3 },
    thinking:   { brow: .3, ba: .15, smile: .2, open: 0, eye: .9, wide: 0, happy: 0, blush: 0, tilt: -4 },
    laugh:      { brow: .3, ba: 0, smile: 1, open: .6, eye: .9, wide: 0, happy: 1, blush: .45, tilt: 3 }
  };

  /* ---------------- the live face: drawn again every frame ---------------- */
  function makeFace(look, SK, BR, seed) {
    var SKD = shade(SK, -.22), f = { target: 'neutral', lookT: null, lookDir: 0, t: 0, tilt: 0, over: {}, seed: seed || 1, mouthOpen: 0, _k: '', _ops: null };
    f.show = function (n) { if (!K.EMO[n]) n = 'neutral'; f.target = n; f.tilt = K.EMO[n].tilt || 0; f.over = {}; };
    f.set = function (o) { for (var k in o) f.over[k] = o[k] };
    f.clear = function () { f.over = {}; f.lookT = null; f.lookDir = 0; f.mouthOpen = 0; f.target = 'neutral'; f.tilt = 0 };
    f.look = function (tg) { f.lookT = tg || null; if (!tg) f.lookDir = 0 };
    f.blinkAt = function (t) { var per = 3.3 + (f.seed % 7) * .17, ph = (t + f.seed * 1.9) % per, d = ph - (per - .2); return d > 0 && d < .2 ? 1 - Math.abs(d - .1) / .1 : 0 };
    f.ops = function () {
      var b = K.EMO[f.target] || K.EMO.neutral, o = f.over, s = {};
      for (var k in b) s[k] = b[k]; for (k in o) s[k] = o[k];
      var open = Math.max(s.open || 0, f.mouthOpen || 0), blink = Math.max(f.blinkAt(f.t), s.blink || 0);
      var e = { blink: blink, happy: s.happy > .5 ? 1 : 0, brow: s.brow, ba: s.ba, smile: s.smile, open: open, blush: s.blush, look: f.lookDir, wide: s.wide, eye: s.eye };
      var key = [e.blink.toFixed(2), e.happy, e.brow.toFixed(2), e.ba.toFixed(2), e.smile.toFixed(2), e.open.toFixed(2), e.blush.toFixed(2), e.look.toFixed(2), e.wide, e.eye, s.mouth].join('|');
      if (key === f._k && f._ops) return f._ops;
      var lk = Object.assign({}, look, { mouth: s.mouth });
      f._ops = K.capture(function () { K.faceFeatures(e, lk, SK, SKD, BR) }).ops; f._k = key; return f._ops;
    };
    return f;
  }

  function skinOf(v, d) { if (typeof v === 'number') return K.SKIN[clamp(v | 0, 0, K.SKIN.length - 1)]; return norm(v || d) }
  function hairOf(v, d) { if (typeof v === 'number') return K.HAIR[clamp(v | 0, 0, K.HAIR.length - 1)]; return norm(v || d) }
  function lumOf(c) { var r = K.hex2rgb(c); return (r[0] * .3 + r[1] * .59 + r[2] * .11) / 255 }
  function stretch(poly, base, hem) { var k = (hem - 600) / (base - 600); return poly.map(function (p) { return p[1] > 600 ? [p[0], 600 + (p[1] - 600) * k] : p }) }

  /**
   * K.person({ gender:'m'|'f', skin, hair, hairColor, top, inner, outer:'open'|'closed', sleeves:'long'|'short',
   *            bottom:'pants'|'skirt', pants, shoes, shape, beard, glasses, earring, lashes, lips, nose, height, build, knit, necklace })
   *   skin / hairColor : a '#hex' or a number (skin 0-8, hair 0-7 from the plan's colour lists)
   *   hair  : 'curls' | 'short' | 'afro' | 'bald' | 'braids' | 'long' | 'bob' | 'bun' | 'ponytail'
   *   top   : colour of the shirt / cardigan / jacket   inner: colour of the T-shirt or blouse under it
   *   height: in kit units (default 2.66)    build: 'slim' | 'average' | 'stocky'
   */
  K.person = function (o) {
    o = o || {};
    var G = /^(f|female|woman|girl)$/i.test(o.gender || '') ? 'f' : 'm', W = G === 'f';
    var SK = skinOf(o.skin, W ? '#e8bea0' : '#e2b597'), HC = hairOf(o.hairColor !== undefined ? o.hairColor : o.hairColour, W ? PAL.hair.blonde : PAL.hair.brown);
    var hairStyle = o.hair || (W ? 'long' : 'curls'), BACKS = { braids: 1, long: 1, bob: 1, ponytail: 1 };
    var TOP = norm(o.top || (W ? PAL.cloth.rose : PAL.cloth.teal)), INNER = norm(o.inner || PAL.cloth.cream);
    var BOTTOM = o.bottom === 'skirt' || o.bottom === 'pants' ? o.bottom : (W ? 'skirt' : 'pants');
    var BOT = norm(o.pants || o.skirt || (W ? PAL.cloth.navy : PAL.cloth.sand)), SHOE = norm(o.shoes || (W ? '#efe3cf' : PAL.cloth.white));
    var outer = o.outer === 'closed' ? 'closed' : 'open', short = o.sleeves === 'short', knit = o.knit !== undefined ? !!o.knit : W, mat = knit ? 'knit' : 'cloth', BACK = -.07;
    var BR = norm(o.brow || (lumOf(HC) > .5 ? shade(HC, -.3) : HC));
    var look = { skin: SK, shape: o.shape || (W ? 'soft' : 'square'), brow: BR, lashes: o.lashes !== undefined ? o.lashes : W, lips: o.lips || (W ? '#c27a78' : null), glasses: o.glasses || null, glassColor: o.glassColor, nose: o.nose || 1, blush: true };
    var seed = (o.seed || (W ? 47 : 31)) | 0;
    K.begin({ width: 1024, height: 1536, bg: 'none', grain: false, seed: seed });
    var cap = K.capture, H = W ? { x: 516, y: 326, size: 236, tilt: 0, dir: 1 } : { x: 534, y: 332, size: 242, tilt: 0, dir: 1 }, headX = H.x;
    var hem = W ? (BOTTOM === 'skirt' ? 700 : 806) : 850, hipY = hem + (W ? 0 : 10);
    var parts = [];
    function add(name, parent, pivot, art, extra) { var p = { name: name, parent: parent, pivot: pivot, art: art }; if (extra) for (var k in extra) p[k] = extra[k]; parts.push(p) }

    /* ----- legs ----- */
    var legsSpec = W ? { B: [420, 516], F: [510, 608], top: hem - 10 } : { B: [400, 512], F: [508, 620], top: 826 };
    var thigh = function (x0, x1, col) { var t = legsSpec.top; return cap(function () { K.part([[x0, t], [x1, t], [x1 - 2, t + 134], [x1 - 6, 1124], [x0 + 6, 1124], [x0 + 2, t + 134]], col, { material: 'cloth', dir: 90, folds: [[(x0 + x1) / 2, t + 74]] }) }) };
    var shin = function (x0, x1, col) {
      return cap(function () {
        K.part([[x0 + 6, 1096], [x1 - 6, 1096], [x1 - 6, 1250], [x1 - 8, 1392], [x0 + 8, 1394], [x0 + 6, 1250]], col, { material: 'cloth', dir: 90, folds: [[(x0 + x1) / 2, 1120]] });
        K.part([[x0 + 4, 1380], [x1, 1378], [x1 + 38, 1402], [x1 + 42, 1430], [x0 + 6, 1442], [x0 - 8, 1424]], SHOE, { material: 'shoe', smooth: true });
        K.flat([[x0 - 8, 1428], [x1 + 42, 1426], [x1 + 38, 1442], [x0 + 2, 1446]], shade(SHOE, -.25));
      });
    };
    var bareLeg = function (x, right) {
      return cap(function () {
        K.part(K.rect(x, 1270, 36, 122), SK, { material: 'skin' });
        K.part(right ? [[530, 1382], [576, 1384], [592, 1412], [590, 1436], [532, 1440], [524, 1412]] : [[456, 1384], [502, 1382], [508, 1416], [500, 1438], [442, 1440], [438, 1412]], SHOE, { material: 'shoe', smooth: true });
      });
    };
    var hairBackArt = BACKS[hairStyle] ? cap(function () { K.hairBack(H, { style: hairStyle, colour: HC }) }) : null;

    /* ----- body ----- */
    var torso = cap(function () {
      if (!W) {
        var TEE = INNER;
        if (outer === 'open') {
          K.part(stretch([[452, 466], [580, 466], [598, 700], [596, 850], [440, 846], [432, 700]], 850, hem), TEE, { material: 'cloth', dir: 80, light: .8 });
          K.part(stretch([[398, 474], [470, 462], [496, 520], [474, 700], [466, 872], [396, 872], [386, 700], [384, 560]], 872, hem + 22), TOP, { material: mat, dir: 74, folds: [[440, 600], [420, 780]] });
          K.part(stretch([[556, 462], [634, 474], [646, 560], [644, 700], [642, 880], [566, 880], [558, 700], [536, 520]], 880, hem + 30), TOP, { material: mat, dir: 106, round: .6, folds: [[600, 640], [612, 790]] });
          K.flat([[470, 462], [496, 520], [490, 540]], shade(TOP, -.25)); K.flat([[556, 462], [536, 520], [542, 540]], shade(TOP, -.25));
          K.part([[450, 452], [492, 470], [470, 522], [438, 486]], shade(TOP, .12), { material: 'detail' }); K.part([[582, 452], [540, 470], [562, 522], [594, 486]], shade(TOP, .05), { material: 'detail' });
          K.flat(K.rect(575, 560, 40, 42), shade(TOP, -.14)); K.flat(K.rect(575, 560, 40, 10), shade(TOP, .1));
          [540, 620, 700, 780].forEach(function (y) { if (y < hem - 40) K.circle(483, y, 4.5, shade(TOP, -.35)) });
        } else {
          K.part(stretch([[398, 474], [470, 462], [532, 462], [634, 474], [646, 560], [644, 700], [642, 876], [396, 876], [386, 700], [384, 560]], 876, hem + 26), TOP, { material: mat, dir: 90, folds: [[440, 620], [600, 640], [516, 790]], light: .9 });
          K.part([[470, 456], [516, 506], [562, 456], [540, 452], [516, 476], [492, 452]], shade(TOP, .12), { material: 'detail' });
          K.flat([[492, 466], [516, 506], [540, 466], [516, 480]], shade(SK, -.1), .9);
        }
      } else {
        if (outer === 'open') {
          K.part(stretch([[462, 456], [570, 456], [586, 610], [580, 700], [452, 700], [446, 610]], 700, hem), INNER, { material: 'cloth', dir: 80, light: .7 });
          K.line([[472, 456], [516, 474], [560, 456]], shade(INNER, -.2), 6);
          if (o.necklace !== false) { K.line([[486, 466], [500, 498], [516, 510], [532, 498], [546, 466]], PAL.gold, 2); K.circle(516, 512, 6, PAL.gold) }
          K.part(stretch([[420, 470], [474, 460], [490, 520], [478, 700], [432, 716], [412, 600]], 716, hem + 16), TOP, { material: mat, dir: 74 });
          K.part(stretch([[560, 460], [612, 470], [622, 600], [604, 716], [556, 700], [542, 520]], 716, hem + 16), TOP, { material: mat, dir: 106, round: .6 });
        } else {
          K.part(stretch([[420, 464], [474, 458], [516, 470], [560, 458], [612, 468], [622, 600], [608, 716], [432, 716], [412, 600]], 716, hem + 16), TOP, { material: mat, dir: 90, folds: [[470, 560], [570, 580]], light: .9 });
          K.line([[472, 458], [516, 480], [560, 458]], shade(TOP, .16), 6);
        }
      }
    });
    var upperArm = function (pts, col) { return cap(function () { K.part(pts, col, { material: mat, dir: 92, smooth: true }) }) };
    var fore = function (x, col, bare) {
      return cap(function () {
        if (bare) { K.part(W ? [[x - 20, 640], [x + 20, 640], [x + 22, 730], [x + 17, 792], [x - 17, 792], [x - 22, 730]] : [[x - 24, 640], [x + 24, 640], [x + 26, 730], [x + 21, 806], [x - 19, 806], [x - 26, 730]], SK, { material: 'skin', smooth: true }); return }
        if (!W) {
          K.part([[x - 28, 640], [x + 28, 640], [x + 30, 730], [x + 24, 806], [x - 22, 806], [x - 30, 730]], col, { material: mat, dir: 90, smooth: true });
          K.part([[x - 24, 786], [x + 26, 786], [x + 26, 812], [x - 24, 812]], shade(col, .16), { material: 'detail' });
        } else {
          K.part([[x - 24, 640], [x + 24, 640], [x + 26, 730], [x + 20, 792], [x - 20, 792], [x - 26, 730]], col, { material: mat, dir: 90, smooth: true });
          K.part([[x - 21, 772], [x + 22, 772], [x + 22, 796], [x - 21, 796]], shade(col, .18), { material: 'detail' });
        }
      });
    };
    var hand = function (x, col) {
      return cap(function () {
        if (!W) {
          K.part([[x - 20, 806], [x + 20, 806], [x + 24, 840], [x + 12, 866], [x - 12, 866], [x - 22, 840]], SK, { material: 'skin', smooth: true });
          K.part([[x + 10, 818], [x + 30, 834], [x + 22, 852], [x + 8, 840]], shade(SK, -.04), { material: 'skin', smooth: true });
        } else {
          K.part([[x - 17, 792], [x + 17, 792], [x + 20, 822], [x + 10, 846], [x - 10, 846], [x - 19, 822]], SK, { material: 'skin', smooth: true });
          K.part([[x - 8, 802], [x - 26, 816], [x - 20, 832], [x - 6, 822]], shade(SK, -.04), { material: 'skin', smooth: true });
        }
      });
    };
    var skirt = W && BOTTOM === 'skirt' ? cap(function () {
      K.part([[452, 690], [580, 690], [600, 800], [636, 1000], [672, 1190], [690, 1288], [600, 1300], [516, 1292], [430, 1300], [340, 1288], [358, 1190], [394, 1000], [432, 800]], BOT,
        { material: 'drape', dir: 90, smooth: true, round: .45, folds: [[484, 712], [516, 712], [548, 712], [470, 900], [560, 900], [350, 1290], [392, 1286], [434, 1294], [476, 1288], [518, 1292], [560, 1286], [602, 1294], [644, 1288], [686, 1290]] });
      K.part(K.rect(446, 688, 140, 28), shade(BOT, -.12), { material: 'detail' });
    }) : null;
    var headStr = cap(function () {
      K.neck(H, { skin: SK, bottom: W ? 460 : 470, width: W ? 50 : undefined });
      K.head(H, { skin: SK, shape: look.shape, features: false, nonose: true, beard: o.beard, beardColor: o.beardColor || HC, earring: o.earring || (W ? 'stud' : null), metal: PAL.gold });
      if (hairStyle !== 'bald') K.hair(H, { style: hairStyle, colour: HC });
    });
    var hb = H.size / 214, face = makeFace(Object.assign({}, look, { nose: o.nose || 1 }), SK, BR, seed);

    /* ----- assemble in draw order (a parent always comes before its children) ----- */
    var pivUp = [516, hipY], pivHead = W ? [516, 456] : [520, 466];
    add('upper', null, pivUp, null);
    add('head', 'upper', pivHead, null, { flipAt: headX });
    if (hairBackArt) add('hairBack', 'head', pivHead, hairBackArt);
    if (BOTTOM === 'pants') {
      var P = legsSpec, pvB = [(P.B[0] + P.B[1]) / 2, P.top + 14], pvF = [(P.F[0] + P.F[1]) / 2, P.top + 14];
      add('legB', null, pvB, thigh(P.B[0], P.B[1], shade(BOT, BACK))); add('shinB', 'legB', [pvB[0], 1110], shin(P.B[0], P.B[1], shade(BOT, BACK)));
    } else {
      add('legB', null, [490, 1276], bareLeg(464, false));
    }
    var AX = W ? { B: [622, 496], FB: [628, 650], F: [410, 496], FF: [404, 650] } : { B: [392, 500], FB: [370, 660], F: [642, 500], FF: [662, 660] };
    var armB = W ? [[606, 474], [634, 490], [648, 540], [652, 620], [648, 660], [604, 664], [602, 600], [606, 540]] : [[402, 478], [366, 490], [346, 524], [338, 604], [342, 670], [398, 672], [406, 600], [410, 540]];
    var armF = W ? [[426, 474], [398, 490], [384, 540], [380, 620], [384, 660], [428, 664], [430, 600], [426, 540]] : [[630, 478], [668, 490], [688, 524], [694, 604], [690, 670], [634, 672], [626, 600], [622, 540]];
    var xB = W ? 628 : 370, xF = W ? 404 : 662;
    add('armB', 'upper', AX.B, upperArm(armB, shade(TOP, BACK)));
    add('foreB', 'armB', AX.FB, fore(xB, shade(TOP, BACK), short));
    add('handB', 'foreB', [xB, W ? 792 : 806], hand(xB));
    if (BOTTOM === 'pants') {
      var P2 = legsSpec, pvF2 = [(P2.F[0] + P2.F[1]) / 2, P2.top + 14];
      add('legF', null, pvF2, thigh(P2.F[0], P2.F[1], BOT)); add('shinF', 'legF', [pvF2[0], 1110], shin(P2.F[0], P2.F[1], BOT));
    } else {
      add('legF', null, [550, 1276], bareLeg(532, true));
      add('skirt', null, [516, 700], skirt);
    }
    add('torso', 'upper', pivUp, torso);
    add('headArt', 'head', pivHead, headStr, { live: function () { return face.ops() }, liveT: K.parseTransform(K.pose(H)) });
    add('armF', 'upper', AX.F, upperArm(armF, TOP));
    add('foreF', 'armF', AX.FF, fore(xF, TOP, short));
    add('handF', 'foreF', [xF, W ? 792 : 806], hand(xF));
    var a = K.rig({ ppu: 511, anchor: [516, 1440], kind: 'character', parts: parts, shadow: 1 });
    a.human = true; a.gender = G; a.face = face; a.hasLegs = BOTTOM === 'pants'; a.hasSkirt = !!skirt; a.headX = headX; a.hipY = hipY;
    var hbb = K.opsBBox(headStr.ops); a.headTop = [hbb ? (hbb.x0 + hbb.x1) / 2 : headX, hbb ? hbb.y0 : 90]; a.faceAt = [H.x, H.y]; a.headBox = hbb;
    a.arm = { F: { sh: AX.F, el: AX.FF, hand: [xF, W ? 830 : 846] }, B: { sh: AX.B, el: AX.FB, hand: [xB, W ? 830 : 846] } };
    a.armR = 'armF'; a.armL = 'armB';
    a.height = (1440 - a.headTop[1]) / 511; a.dir = 1;
    var hgt = o.height > 0 ? o.height : (o.kid ? 1.7 : 0), bd = o.build === 'slim' ? .92 : o.build === 'stocky' ? 1.14 : 1;
    a.baseScale = hgt ? hgt / a.height : 1; a.sx = bd; a.size0 = a.height;
    a.root.scale.set(a.baseScale, a.baseScale, a.baseScale); a.height *= a.baseScale;
    a.look = look; a.opts = o;
    /** a.attach('head'|'torso'|'handF'|'handB', drawing, { x, y, size, z:'front'|'back' }) — hats, packs, tools.
        size = height in units. x/y = offset in units (x right, y down). head: sits on top of the head; others: centred on the spot. */
    var nAtt = 0;
    a.attach = function (where, dr, o2) {
      o2 = o2 || {}; var bb = K.opsBBox(dr.ops); if (!bb) return a;
      var anchors = { head: [a.headTop[0], a.headTop[1] + 34], torso: [516, 620], handF: [xF, W ? 830 : 846], handB: [xB, W ? 830 : 846] }, par = { head: 'head', torso: 'upper', handF: 'handF', handB: 'handB' }[where];
      if (!par) throw new Error("attach: where must be 'head', 'torso', 'handF' or 'handB'");
      var A = anchors[where], hh = Math.max(1, bb.y1 - bb.y0), k = (o2.size > 0 ? o2.size : hh / 511) * 511 / hh, cx = (bb.x0 + bb.x1) / 2, ay = where === 'head' ? bb.y1 : (bb.y0 + bb.y1) / 2;
      var base = [k, 0, 0, k, A[0] + (o2.x || 0) * 511 - cx * k, A[1] + (o2.y || 0) * 511 - ay * k];
      var back = o2.z === 'back', before = back ? (where === 'head' ? (a.byName.hairBack ? 'hairBack' : 'legB') : where === 'torso' ? 'torso' : null) : null;
      if (where === 'head' && back) { par = 'head' }
      a.addPart({ name: 'att' + (++nAtt), parent: par, pivot: [0, 0], art: dr, base: base }, before);
      return a;
    };
    a.onEmotion = function (n) { face.show(n) };
    return a;
  };

  /* ---------------- the two mascots ---------------- */
  K.MASCOTS = {
    kato: { gender: 'm', skin: '#e2b597', hair: 'curls', hairColor: PAL.hair.brown, top: PAL.cloth.teal, inner: PAL.cloth.cream, pants: PAL.cloth.sand, shoes: PAL.cloth.white, seed: 31 },
    nia: { gender: 'f', skin: '#e8bea0', hair: 'long', hairColor: PAL.hair.blonde, top: PAL.cloth.rose, inner: PAL.cloth.cream, skirt: PAL.cloth.navy, shoes: '#efe3cf', seed: 47 }
  };
  K.mascot = function (name, extra) {
    var m = K.MASCOTS[name]; if (!m) throw new Error('KIT.mascot: unknown mascot "' + name + '" (use kato or nia)');
    var a = K.person(Object.assign({}, m, extra || {})); a.name = name; a.mascot = true; return a;
  };
})(typeof window !== 'undefined' ? window : globalThis);
