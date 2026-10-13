/* "Under the Ice" — Low-Poly assets (one function per asset; each is self-contained). */
(function () {
  var A = {};

  /* ---------------- people ---------------- */
  A.boy = function (K) {
    var a = K.person({ gender: 'm', skin: K.PAL.skin.light, hair: 'short', hairColor: K.PAL.hair.brown, top: '#b0473a', inner: '#b0473a', outer: 'closed',
      pants: '#34466b', shoes: '#4a3a30', height: 1.85, seed: 61 });
    K.begin({ width: 400, height: 220, bg: 'none', grain: false, seed: 4 });
    K.part([[60, 200], [70, 120], [120, 60], [200, 40], [280, 60], [330, 120], [340, 200]], '#d9a94a', { material: 'knit', dir: 90 });
    K.part([[50, 170], [350, 170], [352, 215], [48, 215]], '#c9903a', { material: 'knit', dir: 0 });
    K.part(K.ellipse(200, 30, 34, 26, 10), '#ede3d1', { material: 'knit' });
    a.attach('head', K.render('bobble hat'), { size: .32, y: .07 });
    return a;
  };
  A['boy-gown'] = function (K) {
    return K.person({ gender: 'm', skin: K.PAL.skin.light, hair: 'short', hairColor: K.PAL.hair.brown, top: '#a9bfe0', inner: '#a9bfe0', outer: 'closed', sleeves: 'short',
      pants: '#a9bfe0', shoes: '#efe9de', height: 1.85, seed: 61 });
  };
  A.mother = function (K) {
    return K.person({ gender: 'f', skin: K.PAL.skin.light, hair: 'bob', hairColor: K.PAL.hair.darkBrown, top: '#7b5b78', inner: '#ede3d1', outer: 'closed',
      bottom: 'pants', pants: '#3b3d42', shoes: '#5a4636', seed: 52 });
  };
  A.father = function (K) {
    return K.person({ gender: 'm', skin: K.PAL.skin.tan, hair: 'short', hairColor: K.PAL.hair.black, beard: 'stubble', top: '#3f6f73', inner: '#c8b48e', outer: 'closed',
      pants: '#6f7a4a', shoes: '#4a3a30', height: 2.75, seed: 77 });
  };
  A.medic = function (K) {
    var a = K.person({ gender: 'm', skin: K.PAL.skin.brown, hair: 'short', hairColor: K.PAL.hair.black, top: '#2f3d5c', inner: '#2f3d5c', outer: 'closed',
      pants: '#2f3d5c', shoes: '#231713', seed: 91 });
    K.begin({ width: 400, height: 120, bg: 'none', grain: false, seed: 2 });
    K.part([[0, 30], [400, 30], [400, 90], [0, 90]], '#e3d36a', { material: 'detail' });
    a.attach('torso', K.render('reflective stripe'), { size: .1, y: .02 });
    return a;
  };
  A.diver = function (K) {
    var a = K.person({ gender: 'm', skin: K.PAL.skin.tan, hair: 'short', hairColor: K.PAL.hair.black, top: '#23272e', inner: '#23272e', outer: 'closed', pants: '#23272e', shoes: '#23272e', seed: 15 });
    K.begin({ width: 300, height: 140, bg: 'none', grain: false, seed: 7 });
    K.part([[20, 20], [280, 20], [270, 120], [30, 120]], '#3b3d42', { material: 'hard' });
    K.flat([[40, 36], [260, 36], [252, 104], [48, 104]], '#9fd6ff', .85);
    K.flat([[60, 44], [120, 44], [100, 70], [56, 70]], '#eef6ff', .7);
    a.attach('head', K.render('mask'), { size: .17, y: .3, x: .06 });
    return a;
  };
  A.doctor = function (K) {
    return K.person({ gender: 'f', skin: K.PAL.skin.warm, hair: 'bun', hairColor: K.PAL.hair.black, top: '#6f9e93', inner: '#6f9e93', outer: 'closed', sleeves: 'short',
      bottom: 'pants', pants: '#6f9e93', shoes: '#efe9de', glasses: '#3b3d42', seed: 33 });
  };
  A.surgeon = function (K) {
    var a = K.person({ gender: 'm', skin: K.PAL.skin.tan, hair: 'short', hairColor: K.PAL.hair.grey, top: '#5b7fa6', inner: '#5b7fa6', outer: 'closed', sleeves: 'short',
      pants: '#5b7fa6', shoes: '#efe9de', seed: 44 });
    K.begin({ width: 400, height: 160, bg: 'none', grain: false, seed: 2 });
    K.part([[40, 150], [50, 60], [120, 20], [280, 20], [350, 60], [360, 150]], '#4a6d93', { material: 'cloth', dir: 0 });
    a.attach('head', K.render('cap'), { size: .2, y: .1 });
    return a;
  };

  /* ---------------- props ---------------- */
  A.thermometer = function (K) {
    K.begin({ width: 420, height: 380, bg: 'none', grain: false, seed: 3 });
    K.part([[30, 70], [300, 50], [400, 70], [400, 150], [300, 170], [30, 160]], '#3b3d42', { material: 'hard' });
    K.part([[140, 160], [230, 160], [250, 360], [170, 370]], '#2a2c31', { material: 'hard' });
    K.flat([[60, 85], [180, 80], [180, 140], [60, 140]], '#9fe0b0', .95);
    K.flat([[80, 100], [160, 98], [160, 124], [80, 126]], '#2e5a3a', .9);
    K.circle(390, 110, 18, '#ff6a4a');
    var a = K.prop(K.render('infrared thermometer'), { size: .38, grip: [190, 220], shadow: false });
    a.glow = { size: .5, alpha: .5, at: .3, color: '#ff8a6a' };
    return a;
  };
  A['boy-lying'] = function (K) {
    K.begin({ width: 1300, height: 330, bg: 'none', grain: false, seed: 8 });
    K.part([[40, 230], [1260, 230], [1270, 290], [30, 290]], '#d8641e', { material: 'hard' });
    [[300, 236], [700, 236], [1000, 236]].forEach(function (p) { K.flat(K.rect(p[0], p[1], 30, 50), '#7a3610') });
    K.part([[860, 160], [1180, 170], [1200, 200], [1190, 232], [860, 232]], '#34466b', { material: 'cloth', dir: 0 });
    K.part([[1170, 140], [1240, 140], [1250, 232], [1170, 232]], '#4a3a30', { material: 'shoe' });
    K.part([[430, 120], [880, 130], [890, 232], [420, 232]], '#b0473a', { material: 'cloth', dir: 0 });
    K.part([[560, 150], [800, 160], [800, 196], [560, 190]], '#963b30', { material: 'cloth', dir: 0 });
    K.part(K.ellipse(330, 168, 108, 70, 16), '#d9b7a8', { material: 'skin' });
    K.part([[230, 140], [280, 98], [360, 92], [430, 120], [420, 150], [300, 132], [240, 170]], '#6b4630', { material: 'hair' });
    K.line([[300, 168], [330, 176]], '#5a3a32', 5); K.line([[350, 170], [380, 176]], '#5a3a32', 5);
    K.line([[320, 206], [360, 206]], '#7a5a6a', 4);
    return K.prop(K.render('boy lying on a rescue board'), { size: .52, anchor: [650, 290] });
  };
  A.sled = function (K) {
    K.begin({ width: 700, height: 260, bg: 'none', grain: false, seed: 9 });
    K.part([[60, 90], [600, 90], [620, 150], [80, 150]], '#b7714f', { material: 'hard', dir: 0 });
    [[120, 150], [520, 150]].forEach(function (p) { K.part([[p[0], p[1]], [p[0] + 30, p[1]], [p[0] + 30, 200], [p[0], 200]], '#6b4630', { material: 'hard' }) });
    K.part([[40, 200], [640, 200], [680, 170], [700, 190], [650, 228], [40, 228]], '#9aa1a6', { material: 'hard' });
    K.line([[60, 110], [10, 60], [-10, 40]], '#c99a3e', 5);
    return K.prop(K.render('wooden sled'), { size: .35, grip: [10, 60] });
  };
  A.tracks = function (K) {
    K.begin({ width: 1600, height: 80, bg: 'none', grain: false, seed: 10 });
    K.flat([[0, 30], [1600, 22], [1600, 30], [0, 38]], '#9fb0c4', .9);
    K.flat([[0, 52], [1600, 44], [1600, 52], [0, 60]], '#9fb0c4', .9);
    for (var i = 0; i < 16; i++) K.flat(K.ellipse(50 + i * 100, i % 2 ? 18 : 68, 22, 7, 8), '#a9b8ca', .9);
    return K.prop(K.render('sled tracks in the snow'), { size: .08, shadow: false });
  };
  A.ducks = function (K) {
    K.begin({ width: 900, height: 360, bg: 'none', grain: false, seed: 11 });
    function duck(x, s, col) {
      K.part([[x - 150 * s, 300], [x - 160 * s, 230], [x - 60 * s, 190], [x + 90 * s, 200], [x + 160 * s, 250], [x + 120 * s, 300]], col, { material: 'leaf', smooth: true });
      K.part(K.ellipse(x + 110 * s, 160, 56 * s, 50 * s, 12), '#3f6b49', { material: 'leaf' });
      K.part([[x + 160 * s, 160], [x + 220 * s, 172], [x + 160 * s, 184]], '#d9a94a', { material: 'detail' });
      K.circle(x + 128 * s, 150, 7 * s, '#231713');
      K.part([[x + 70 * s, 200], [x + 104 * s, 200], [x + 104 * s, 212], [x + 70 * s, 212]], '#ede3d1', { material: 'detail' });
    }
    duck(250, 1, '#8a6a52'); duck(640, .85, '#7a5c46');
    return K.creature(K.render('two ducks'), { size: .55, bob: .02, speed: 2.5 });
  };
  A.ambulance = function (K) {
    K.begin({ width: 1500, height: 760, bg: 'none', grain: false, seed: 12 });
    K.part([[60, 160], [1000, 160], [1000, 640], [60, 640]], '#e8e4da', { material: 'hard' });
    K.part([[1000, 300], [1250, 300], [1420, 470], [1440, 640], [1000, 640]], '#e8e4da', { material: 'hard' });
    K.flat([[1040, 330], [1230, 330], [1360, 470], [1040, 470]], '#33465a', .95);
    K.flat([[60, 470], [1440, 470], [1440, 520], [60, 520]], '#b0473a');
    K.part([[480, 260], [580, 260], [580, 360], [480, 360]], '#b0473a', { material: 'detail' });
    K.flat([[515, 240], [545, 240], [545, 380], [515, 380]], '#e8e4da');
    K.flat([[440, 295], [620, 295], [620, 325], [440, 325]], '#e8e4da');
    K.part(K.ellipse(330, 650, 90, 90, 14), '#26282e', { material: 'hard' }); K.part(K.ellipse(1150, 650, 90, 90, 14), '#26282e', { material: 'hard' });
    K.circle(330, 650, 36, '#9aa1a6'); K.circle(1150, 650, 36, '#9aa1a6');
    K.part([[140, 120], [300, 120], [300, 160], [140, 160]], '#ff4a3a', { material: 'detail' });
    K.part([[760, 120], [920, 120], [920, 160], [760, 160]], '#4a7bff', { material: 'detail' });
    var a = K.prop(K.render('ambulance'), { size: 2.8 });
    a.glow = { size: 4, alpha: .45, at: 2.6, color: '#ff5a4a' };
    return a;
  };
  A.torch = function (K) {
    K.begin({ width: 420, height: 160, bg: 'none', grain: false, seed: 13 });
    K.part([[20, 50], [300, 50], [300, 110], [20, 110]], '#c99a3e', { material: 'hard' });
    K.part([[300, 30], [380, 20], [380, 140], [300, 130]], '#3b3d42', { material: 'hard' });
    K.flat([[376, 30], [400, 30], [400, 130], [376, 130]], '#fff0b8');
    var a = K.prop(K.render('dive torch'), { size: .14, grip: [120, 80], shadow: false });
    a.glow = { size: 3, alpha: .6, at: .07, color: '#fff3c8' };
    return a;
  };
  A.brain = function (K) {
    K.begin({ width: 700, height: 560, bg: 'none', grain: false, seed: 14 });
    K.part(K.smooth([[90, 330], [80, 210], [170, 100], [330, 60], [500, 80], [620, 190], [630, 330], [540, 430], [380, 450], [220, 430]]), '#d99a9a', { material: 'skin', light: 1.2 });
    K.part([[380, 430], [470, 440], [460, 540], [400, 540]], '#c9878a', { material: 'skin' });
    [[[160, 220], [260, 180], [330, 230]], [[360, 140], [440, 200], [530, 170]], [[180, 330], [290, 300], [380, 350], [470, 300], [560, 340]], [[300, 100], [330, 180]]].forEach(function (l) { K.line(l, '#b5707a', 9) });
    var a = K.prop(K.render('brain'), { size: 1.1, bob: .05, speed: 1.5, shadow: false });
    a.glow = { size: 2.6, alpha: .45, at: .6, color: '#9fd6ff' };
    return a;
  };
  A.phone = function (K) {
    K.begin({ width: 300, height: 560, bg: 'none', grain: false, seed: 15 });
    K.part([[20, 30], [280, 30], [280, 530], [20, 530]], '#2a2c31', { material: 'hard' });
    K.flat([[40, 70], [260, 70], [260, 490], [40, 490]], '#33465a');
    K.flat([[90, 230], [200, 230], [200, 330], [90, 330]], '#ede3d1'); K.flat([[200, 260], [216, 260], [216, 300], [200, 300]], '#ede3d1');
    K.flat([[100, 240], [124, 240], [124, 320], [100, 320]], '#e9b95b');
    var a = K.prop(K.render('phone in power-saving mode'), { size: .55, grip: [150, 420], shadow: false });
    a.glow = { size: 1.4, alpha: .4, at: .28, color: '#ffd28a' };
    return a;
  };
  A.ecmo = function (K) {
    K.begin({ width: 800, height: 1100, bg: 'none', grain: false, seed: 16 });
    K.part([[120, 300], [680, 300], [680, 980], [120, 980]], '#cfd2cc', { material: 'hard' });
    K.part([[160, 340], [640, 340], [640, 560], [160, 560]], '#2a2c31', { material: 'hard' });
    K.line([[190, 450], [280, 450], [310, 400], [340, 500], [370, 450], [610, 450]], '#9fe0b0', 6);
    K.part(K.ellipse(300, 720, 90, 90, 16), '#9aa1a6', { material: 'hard' }); K.circle(300, 720, 40, '#b0473a');
    K.part(K.ellipse(520, 720, 70, 70, 14), '#9aa1a6', { material: 'hard' });
    K.line([[300, 630], [300, 200], [520, 120], [700, 200]], '#b0473a', 14); K.line([[520, 650], [560, 180], [740, 260]], '#8a2a2a', 14);
    K.part([[110, 980], [690, 980], [690, 1020], [110, 1020]], '#8d8a83', { material: 'hard' });
    K.circle(170, 1050, 34, '#3b3d42'); K.circle(630, 1050, 34, '#3b3d42');
    K.flat([[140, 270], [660, 270], [660, 300], [140, 300]], '#9aa1a6');
    var a = K.prop(K.render('ECMO heart-lung machine'), { size: 2.1 });
    a.glow = { size: 2.2, alpha: .35, at: 1.5, color: '#ffb48a' };
    return a;
  };
  A.monitor = function (K) {
    K.begin({ width: 600, height: 1200, bg: 'none', grain: false, seed: 17 });
    K.part([[60, 80], [540, 80], [540, 460], [60, 460]], '#3b3d42', { material: 'hard' });
    K.flat([[90, 110], [510, 110], [510, 430], [90, 430]], '#10241c');
    K.line([[110, 300], [490, 300]], '#2e7a50', 5);
    K.part([[280, 460], [320, 460], [320, 1120], [280, 1120]], '#9aa1a6', { material: 'hard' });
    K.part([[150, 1110], [450, 1110], [470, 1150], [130, 1150]], '#8d8a83', { material: 'hard' });
    return K.prop(K.render('patient monitor'), { size: 2.3 });
  };
  A.beat = function (K) {
    K.begin({ width: 420, height: 200, bg: 'none', grain: false, seed: 18 });
    K.line([[0, 100], [120, 100], [150, 40], [190, 170], [220, 70], [250, 100], [420, 100]], '#9fffc0', 9);
    return K.fx(K.render('heartbeat line'), { size: .3, pulse: .06, speed: 7, glow: { size: 1.2, alpha: .6, color: '#9fffc0', at: .15 } });
  };
  A.bed = function (K) {
    K.begin({ width: 1500, height: 700, bg: 'none', grain: false, seed: 19 });
    K.part([[60, 120], [120, 120], [120, 620], [60, 620]], '#9aa1a6', { material: 'hard' });
    K.part([[1380, 300], [1440, 300], [1440, 620], [1380, 620]], '#9aa1a6', { material: 'hard' });
    K.part([[100, 380], [1400, 380], [1400, 460], [100, 460]], '#ede3d1', { material: 'cloth', dir: 0 });
    K.part([[110, 460], [1390, 460], [1390, 500], [110, 500]], '#8d8a83', { material: 'hard' });
    K.part(K.smooth([[130, 300], [330, 290], [360, 340], [330, 385], [140, 385]]), '#f3efe6', { material: 'cloth' });
    [[200, 500], [1300, 500]].forEach(function (p) { K.part([[p[0], p[1]], [p[0] + 30, p[1]], [p[0] + 30, 640], [p[0], 640]], '#9aa1a6', { material: 'hard' }); K.circle(p[0] + 15, 650, 26, '#3b3d42') });
    return K.prop(K.render('hospital bed'), { size: 1.25 });
  };
  A.blanket = function (K) {
    K.begin({ width: 1000, height: 300, bg: 'none', grain: false, seed: 20 });
    K.part(K.smooth([[20, 280], [40, 150], [200, 90], [700, 80], [940, 120], [990, 280]]), '#a9bfe0', { material: 'drape', dir: 10 });
    K.line([[60, 200], [960, 190]], '#8ea6cc', 6);
    return K.prop(K.render('hospital blanket'), { size: .42, shadow: false });
  };
  A.clipboard = function (K) {
    K.begin({ width: 300, height: 400, bg: 'none', grain: false, seed: 21 });
    K.part([[20, 40], [280, 40], [280, 390], [20, 390]], '#8a5a3a', { material: 'hard' });
    K.flat([[45, 70], [255, 70], [255, 370], [45, 370]], '#f3efe6');
    [110, 150, 190, 230, 270, 310].forEach(function (y) { K.line([[70, y], [y % 80 ? 230 : 180, y]], '#9aa1a6', 6) });
    K.part([[110, 20], [190, 20], [190, 60], [110, 60]], '#9aa1a6', { material: 'hard' });
    return K.prop(K.render('case report on a clipboard'), { size: .42, grip: [150, 380], shadow: false });
  };
  A.tricycle = function (K) {
    K.begin({ width: 900, height: 620, bg: 'none', grain: false, seed: 22 });
    K.part(K.ellipse(690, 470, 140, 140, 18), '#26282e', { material: 'hard' }); K.circle(690, 470, 60, '#9aa1a6');
    K.part(K.ellipse(170, 520, 90, 90, 16), '#26282e', { material: 'hard' }); K.circle(170, 520, 38, '#9aa1a6');
    K.line([[170, 520], [330, 330], [600, 330], [690, 470]], '#b0473a', 30);
    K.line([[600, 330], [640, 140]], '#b0473a', 26); K.line([[590, 140], [700, 130]], '#3b3d42', 22);
    K.part([[250, 280], [420, 280], [410, 320], [260, 320]], '#3b3d42', { material: 'hard' });
    return K.prop(K.render('red tricycle'), { size: 1.05 });
  };

  /* ---------------- sets ---------------- */
  A.snowfield = function (K) {
    function hills(seed) {
      K.begin({ width: 2400, height: 700, bg: 'none', grain: false, seed: seed });
      [['#3b4a66', 300], ['#2f3d58', 400], ['#26324a', 500]].forEach(function (c, i) {
        var pts = [[0, 700]]; for (var k = 0; k <= 10; k++) pts.push([k * 240, c[1] - Math.sin(k * 1.4 + i) * 60 - K.rnd() * 40]); pts.push([2400, 700]);
        K.part(pts, c[0], { material: 'hard', step: 100, sx: 140, sy: 160 });
      });
      return K.render('night hills');
    }
    function pines(seed) {
      K.begin({ width: 2400, height: 700, bg: 'none', grain: false, seed: seed });
      for (var i = 0; i < 18; i++) {
        var x = 60 + i * 135 + K.rnd() * 50, s = .6 + K.rnd() * .7, bh = 300 * s, tw = 46 * s;
        if (x > 900 && x < 1500 && K.rnd() < .7) continue;
        K.part([[x - 7 * s, 700], [x + 7 * s, 700], [x + 6 * s, 660], [x - 6 * s, 660]], '#2a2026', { material: 'hard' });
        for (var j = 0; j < 3; j++) {
          var y = 676 - j * bh * .27, ww = tw * (1.5 - j * .3), hh = bh * .4;
          K.part([[x - ww, y], [x + ww, y], [x + ww * .1, y - hh], [x - ww * .1, y - hh]], j % 2 ? '#3f5a62' : '#35505a', { material: 'leaf', dir: 70 });
          K.part([[x - ww, y], [x - ww * .55, y - hh * .18], [x + ww * .55, y - hh * .18], [x + ww, y]], '#d6e0e8', { material: 'detail' });
        }
      }
      return K.render('snowy pines');
    }
    function pond() {
      K.begin({ width: 2000, height: 160, bg: 'none', grain: false, seed: 31 });
      K.part(K.ellipse(1000, 80, 980, 70, 28), '#6d86a3', { material: 'hard', step: 120, sx: 160, sy: 40, light: .6 });
      K.part(K.blob(1250, 92, 120, 11).map(function (p) { return [p[0] + (p[0] - 1250) * .9, 92 + (p[1] - 92) * .35] }), '#0b1220', { material: 'hard' });
      [[400, 60, 700, 75], [1450, 70, 1800, 64], [900, 100, 1150, 95]].forEach(function (l) { K.line([[l[0], l[1]], [l[2], l[3]]], '#9fb6cc', 3) });
      return K.render('frozen pond with a broken hole');
    }
    function tufts() {
      K.begin({ width: 2400, height: 220, bg: 'none', grain: false, seed: 32 });
      for (var i = 0; i < 12; i++) { var x = K.rnd() * 2400; if (x > 800 && x < 1600) continue; K.part(K.blob(x, 200, 60 + K.rnd() * 50, 9).map(function (p) { return [p[0], Math.min(220, p[1])] }), i % 2 ? '#dfe8ef' : '#c8d4de', { material: 'hard', step: 40, sx: 50, sy: 40 }) }
      return K.render('snow banks');
    }
    return K.set({
      width: 28, depth: 14, height: 9,
      backdrop: { top: '#1d2740', bottom: '#4a5878', ground: '#b9c6d4' },
      ground: { color: '#b9c6d4' },
      layers: [
        { art: hills(3), z: -24, width: 84, base: 690 },
        { art: pines(7), z: -12, width: 52, base: 700 },
        { art: pond(), z: -3.2, width: 9, base: 160, x: 1.2 },
        { art: tufts(), z: 4, width: 34, base: 220 }
      ],
      spots: { center: [0, 0, 0], boy: [.2, 0, .4], medic: [-1.1, 0, .3], left: [-1.8, 0, 0], right: [1.8, 0, 0], pond: [1.8, 0, -2.6], hole: [2.4, 0, -2.4], far: [-3, 0, -4], amb: [-3.6, 0, -3.5], ducks: [3.2, 0, -2.8] }
    });
  };
  A.yard = function (K) {
    function hills() {
      K.begin({ width: 2400, height: 600, bg: 'none', grain: false, seed: 41 });
      [['#b9c6d4', 330], ['#a9b8ca', 430]].forEach(function (c, i) { var pts = [[0, 600]]; for (var k = 0; k <= 8; k++) pts.push([k * 300, c[1] - Math.sin(k + i * 2) * 50]); pts.push([2400, 600]); K.part(pts, c[0], { material: 'hard', step: 120, sx: 160, sy: 160, light: .6 }) });
      return K.render('snowy hills');
    }
    function house() {
      K.begin({ width: 1400, height: 1100, bg: 'none', grain: false, seed: 42 });
      K.part([[150, 480], [1250, 480], [1250, 1100], [150, 1100]], '#b7714f', { material: 'hard' });
      K.part([[80, 500], [700, 120], [1320, 500]], '#5d5144', { material: 'hard' });
      K.part([[110, 470], [700, 110], [760, 140], [170, 500]], '#e6edf2', { material: 'hard' });
      K.part([[640, 140], [1290, 470], [1320, 500], [700, 160]], '#e6edf2', { material: 'hard' });
      K.part([[300, 760], [460, 760], [460, 1100], [300, 1100]], '#6b4630', { material: 'hard' });
      K.circle(430, 940, 10, '#d9a94a');
      [[620, 640], [940, 640]].forEach(function (p) { K.part([[p[0], p[1]], [p[0] + 200, p[1]], [p[0] + 200, p[1] + 200], [p[0], p[1] + 200]], '#ffd28a', { material: 'detail', light: .3 }); K.line([[p[0] + 100, p[1]], [p[0] + 100, p[1] + 200]], '#6b4630', 10); K.line([[p[0], p[1] + 100], [p[0] + 200, p[1] + 100]], '#6b4630', 10) });
      K.part([[1000, 220], [1100, 220], [1100, 360], [1000, 330]], '#8d8a83', { material: 'hard' });
      return K.render('family house in the snow');
    }
    function fence() {
      K.begin({ width: 2400, height: 260, bg: 'none', grain: false, seed: 43 });
      for (var i = 0; i < 26; i++) { var x = i * 95; if (x > 600 && x < 1100) continue; K.part([[x, 260], [x + 34, 260], [x + 34, 70], [x + 17, 50], [x, 70]], '#8a6a52', { material: 'hard' }); K.part([[x - 4, 54], [x + 38, 54], [x + 17, 30]], '#e6edf2', { material: 'detail' }) }
      K.line([[0, 120], [600, 120]], '#7a5c46', 14); K.line([[1100, 120], [2400, 120]], '#7a5c46', 14);
      return K.render('fence');
    }
    return K.set({
      width: 26, depth: 14, height: 9,
      backdrop: { top: '#8fa3bd', bottom: '#cfd8e2', ground: '#d6dee6' },
      ground: { color: '#d3dce5' },
      layers: [
        { art: hills(), z: -22, width: 80, base: 600 },
        { art: house(), z: -6, width: 8, base: 1100, x: -1.4 },
        { art: fence(), z: -4, width: 26, base: 260 }
      ],
      spots: { door: [-2, 0, -5.2], center: [0, 0, 0], left: [-1.8, 0, 0], right: [2, 0, 0], gate: [1.3, 0, -3], far: [4, 0, -4] }
    });
  };
  A.underice = function (K) {
    function ice() {
      K.begin({ width: 2400, height: 90, bg: 'none', grain: false, seed: 51 });
      K.part([[0, 0], [2400, 0], [2400, 60], [1900, 70], [1300, 58], [700, 74], [0, 62]], '#9fbfd0', { material: 'hard', step: 90, sx: 140, sy: 40, light: .7 });
      K.part(K.blob(1500, 40, 150, 11).map(function (p) { return [p[0] + (p[0] - 1500) * .6, 40 + (p[1] - 40) * .25] }), '#eef8ff', { material: 'detail', light: .2 });
      [[300, 20, 800, 50], [1000, 10, 1300, 45], [1800, 15, 2200, 55]].forEach(function (l) { K.line([[l[0], l[1]], [l[2], l[3]]], '#d8ecf4', 3) });
      return K.render('ice ceiling with the hole');
    }
    function reeds() {
      K.begin({ width: 2400, height: 600, bg: 'none', grain: false, seed: 52 });
      for (var i = 0; i < 40; i++) { var x = K.rnd() * 2400, h = 150 + K.rnd() * 380; K.part([[x - 10, 600], [x + 10, 600], [x + 30 * (K.rnd() - .5), 600 - h]], i % 3 ? '#23402f' : '#2e4d34', { material: 'leaf' }) }
      return K.render('reeds');
    }
    function rocks() {
      K.begin({ width: 2400, height: 260, bg: 'none', grain: false, seed: 53 });
      for (var i = 0; i < 9; i++) { var x = 120 + i * 260 + K.rnd() * 80; K.part(K.blob(x, 230, 70 + K.rnd() * 60, 8).map(function (p) { return [p[0], Math.min(260, p[1])] }), '#2b3a3a', { material: 'hard' }) }
      return K.render('rocks');
    }
    return K.set({
      width: 26, depth: 14, height: 9,
      backdrop: { top: '#2f6f80', bottom: '#0c2a35', ground: '#1b3430' },
      ground: { color: '#1e3a34' },
      layers: [
        { art: reeds(), z: -9, width: 40, base: 600 },
        { art: ice(), z: -3, width: 34, base: 0, y: 3.8 }
      ],
      spots: { center: [0, 0, 0], left: [-2.2, 0, 0], right: [2.2, 0, 0], hole: [1.3, 3.3, -1], deep: [0, .4, -2] }
    });
  };
  A.hospital = function (K) {
    function wall() {
      K.begin({ width: 2600, height: 1200, bg: 'none', grain: false, seed: 61 });
      K.part([[0, 0], [2600, 0], [2600, 1200], [0, 1200]], '#cdd6d2', { material: 'hard', step: 200, sx: 260, sy: 260, light: .35 });
      K.part([[0, 1050], [2600, 1050], [2600, 1200], [0, 1200]], '#9fb0ae', { material: 'hard', light: .4 });
      K.part([[300, 300], [800, 300], [800, 700], [300, 700]], '#e7ecea', { material: 'hard', light: .3 });
      K.flat([[330, 330], [770, 330], [770, 670], [330, 670]], '#a9c4d8', .8);
      K.part([[1800, 420], [2160, 420], [2160, 1200], [1800, 1200]], '#b9c4c2', { material: 'hard' });
      K.flat([[1880, 500], [2080, 500], [2080, 680], [1880, 680]], '#e7ecea', .9);
      K.part([[1000, 60], [1500, 60], [1500, 120], [1000, 120]], '#f3efe6', { material: 'detail', light: .2 });
      K.part([[1080, 600], [1500, 600], [1500, 900], [1080, 900]], '#9aa1a6', { material: 'hard' });
      [640, 700, 760, 820].forEach(function (y) { K.line([[1100, y], [1480, y]], '#7f878d', 6) });
      return K.render('hospital wall');
    }
    return K.set({
      width: 24, depth: 12, height: 8,
      backdrop: { top: '#b9c4c2', bottom: '#cdd6d2', ground: '#a3b3b0' },
      ground: { color: '#a3b3b0', rough: .5 },
      layers: [{ art: wall(), z: -4.5, width: 22, base: 1200 }],
      spots: { center: [0, 0, 0], bed: [-.4, 0, -1.2], ecmo: [1.9, 0, -1.6], monitor: [-2.3, 0, -1.7], left: [-2, 0, .2], right: [2, 0, .2], door: [5.5, 0, -2], head: [-1.2, 0, -1] }
    });
  };
  A.park = function (K) {
    function trees() {
      K.begin({ width: 2400, height: 800, bg: 'none', grain: false, seed: 71 });
      for (var i = 0; i < 9; i++) {
        var x = 120 + i * 270 + K.rnd() * 60, s = .7 + K.rnd() * .5;
        K.part([[x - 16 * s, 800], [x + 16 * s, 800], [x + 12 * s, 520], [x - 12 * s, 520]], '#6b4630', { material: 'hard' });
        K.part(K.blob(x, 800 - 380 * s, 170 * s, 10), i % 2 ? '#6f8f4e' : '#7f9b58', { material: 'leaf', step: 40, sx: 50, sy: 60 });
      }
      return K.render('summer trees');
    }
    function hills() {
      K.begin({ width: 2400, height: 600, bg: 'none', grain: false, seed: 72 });
      [['#a9b98a', 330], ['#8fa66e', 430]].forEach(function (c, i) { var pts = [[0, 600]]; for (var k = 0; k <= 8; k++) pts.push([k * 300, c[1] - Math.sin(k + i * 2) * 50]); pts.push([2400, 600]); K.part(pts, c[0], { material: 'hard', step: 120, sx: 160, sy: 160, light: .6 }) });
      return K.render('green hills');
    }
    return K.set({
      width: 26, depth: 14, height: 9,
      backdrop: { top: '#e9c6a0', bottom: '#f1dcc0', ground: '#8fa868' },
      ground: { color: '#93ab6a' },
      layers: [{ art: hills(), z: -22, width: 80, base: 600 }, { art: trees(), z: -10, width: 44, base: 800 }],
      spots: { center: [0, 0, 0], left: [-2.5, 0, 0], right: [2.5, 0, 0], start: [-4, 0, .3], end: [3.5, 0, .3], far: [4, 0, -5] }
    });
  };

  window.ICE_ASSETS = A;
})();
