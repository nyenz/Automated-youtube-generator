/* UNDER THE ICE — first 22.4 seconds, Facet style.
   3 places, 2 cuts (both at the end of a sentence):
     0.0–11.0  the frozen pond (one shot: thermometer close-up → pull out → glide in to the boy)
     11.0–14.9 under the ice
     14.9–22.4 the hospital (one shot: the doctor → pull out to the bed)
   Narration only: no music, no sound effects. No blur, glow or sparks. */
(function () {
  const W = 1080, H = 1920;

  /* ---------------- colours ---------------- */
  const NIGHT = '#4b6782', DEEP = '#22384b', WARD = '#3a6e64';   // the hospital is a little warmer: hope
  const ICE = '#b9cad3', SNOW = '#dfe4e3', BARK = '#5b4a42', ACC = '#cc5321';

  /* ---------------- props (each a normal kit asset: draw(F) in a 1080 canvas) ---------------- */
  function thermometer(F) {
    F.begin({ width: 1080, height: 1080, seed: 21 });
    F.part([[360, 600], [470, 600], [500, 860], [400, 880], [350, 640]], '#3e3f42', { ridge: [[385, 610], [400, 870]], contrast: .24, step: 60 });      // grip
    F.part([[200, 380], [820, 380], [860, 430], [860, 620], [820, 660], [200, 660], [170, 620], [170, 420]], '#d3ccbd', { ridge: [[260, 390], [250, 650]], contrast: .2, step: 120 });
    F.part([[820, 450], [900, 465], [900, 575], [820, 590]], '#3e3f42', { contrast: .2, step: 60 });                                                      // sensor nose
    F.flat([[230, 420], [640, 420], [640, 620], [230, 620]], '#2b3b3a');                                                                                       // screen
    F.flat([[230, 590], [640, 590], [640, 620], [230, 620]], '#22302f');
    F.text(435, 562, '7.0°C', 132, '#cfe6d2');
    F.flat([[680, 450], [790, 450], [790, 520], [680, 520]], ACC);                                                                                             // trigger light
    return F.render('infrared thermometer');
  }
  function clipboard(F) {
    F.begin({ width: 1080, height: 1080, seed: 22 });
    F.part([[330, 200], [750, 200], [760, 900], [320, 900]], '#9a7a52', { ridge: [[400, 210], [390, 890]], contrast: .22, step: 160 });
    F.part([[360, 260], [720, 260], [725, 860], [355, 860]], '#efe8da', { ridge: [[420, 270], [410, 850]], contrast: .12, step: 200 });
    [340, 400, 460, 520, 580, 640].forEach((y, i) => F.flat([[400, y], [i % 2 ? 620 : 680, y], [i % 2 ? 620 : 680, y + 18], [400, y + 18]], '#b9b0a0'));
    F.part([[460, 170], [620, 170], [640, 250], [440, 250]], '#6b6b6b', { contrast: .2, step: 60 });
    return F.render('clipboard');
  }
  function backboard(F) {
    F.begin({ width: 1080, height: 1080, seed: 23 });
    F.part([[40, 930], [1040, 930], [1060, 975], [1040, 1000], [40, 1000], [20, 975]], ACC, { ridge: [[120, 940], [110, 995]], contrast: .2, step: 220 });
    [200, 540, 880].forEach(x => F.flat([[x - 14, 935], [x + 14, 935], [x + 14, 996], [x - 14, 996]], '#8e3a18'));
    return F.render('rescue backboard');
  }
  function sled(F) {
    F.begin({ width: 1080, height: 1080, seed: 24 });
    F.part([[160, 880], [860, 880], [940, 820], [960, 860], [900, 950], [160, 950]], '#7a4231', { ridge: [[220, 890], [220, 940]], contrast: .24, step: 160 });
    return F.render('sled');
  }
  function bedBack(F) {             // frame, mattress and pillow (drawn behind the boy)
    F.begin({ width: 1080, height: 1080, seed: 25 });
    F.part([[60, 760], [1020, 760], [1020, 800], [60, 800]], '#9a948c', { contrast: .18, step: 200 });
    [[90, 800], [990, 800]].forEach(([x, y]) => { F.part([[x - 16, y], [x + 16, y], [x + 16, y + 190], [x - 16, y + 190]], '#7d776f', { contrast: .2, step: 80 });
      F.part(F.disc(x, y + 200, 22, 22, 7), '#3e3f42', { contrast: .2, step: 30 }); });
    F.part([[960, 520], [1010, 520], [1010, 790], [960, 790]], '#9a948c', { contrast: .2, step: 100 });      // head board
    F.part([[70, 680], [1000, 680], [1010, 760], [60, 760]], '#ece6da', { ridge: [[120, 690], [120, 755]], contrast: .14, step: 220 });
    F.part([[760, 620], [960, 615], [975, 685], [745, 690]], '#f2ede3', { ridge: [[800, 625]], contrast: .14, step: 80 });
    return F.render('hospital bed');
  }
  function blanket(F) {             // covers the boy up to his chest
    F.begin({ width: 1080, height: 1080, seed: 26 });
    F.part([[50, 690], [650, 600], [700, 640], [690, 770], [40, 790]], '#b9a78a', { ridge: [[120, 680], [110, 780]], contrast: .2, step: 160, extra: [[400, 650]] });
    F.flat([[630, 606], [700, 640], [698, 668], [626, 632]], '#efe8da');
    return F.render('blanket');
  }
  function ecmo(F) {
    F.begin({ width: 1080, height: 1080, seed: 27 });
    F.part([[300, 360], [760, 360], [780, 900], [280, 900]], '#d3ccbd', { ridge: [[360, 370], [350, 890]], contrast: .2, step: 200 });
    F.flat([[350, 420], [700, 420], [700, 600], [350, 600]], '#2b3b3a');
    F.flat([[380, 520], [450, 520], [480, 470], [520, 560], [560, 500], [670, 500], [670, 512], [565, 512], [520, 580], [480, 492], [455, 532], [380, 532]], '#9fd0b0');
    [[420, 700], [620, 700]].forEach(([x, y]) => F.part(F.disc(x, y, 60, 60, 8), '#6c6052', { ridge: [[x - 20, y - 20]], contrast: .22, step: 60 }));
    [[320, 930], [740, 930]].forEach(([x, y]) => F.part(F.disc(x, y, 34, 34, 7), '#3e3f42', { contrast: .2, step: 40 }));
    return F.render('heart-lung machine');
  }
  function tubes(F) {               // red lines from the machine to the bed
    F.begin({ width: 1080, height: 1080, seed: 28 });
    F.part([[0, 700], [520, 640], [1080, 600], [1080, 620], [520, 662], [0, 722]], '#b0482a', { contrast: .16, step: 300 });
    F.part([[0, 760], [560, 720], [1080, 690], [1080, 708], [560, 740], [0, 780]], '#9a3a22', { contrast: .16, step: 300 });
    return F.render('tubes');
  }

  function breath(F) {               // a puff of breath in the cold
    F.begin({ width: 1080, height: 1080, seed: 40 });
    F.flat(F.disc(540, 540, 90, 60, 9), '#eef2f3', .7); F.flat(F.disc(620, 510, 70, 50, 8), '#eef2f3', .6); F.flat(F.disc(470, 520, 55, 40, 8), '#eef2f3', .5);
    return F.render('breath');
  }
  function drop(F) {
    F.begin({ width: 1080, height: 1080, seed: 41 });
    F.flat([[540, 470], [575, 560], [540, 600], [505, 560]], '#a9c0cc');
    return F.render('drip');
  }
  function puddle(F) {
    F.begin({ width: 1080, height: 1080, seed: 42 });
    F.flat([[60, 980], [300, 955], [700, 960], [1020, 975], [900, 1010], [400, 1015], [120, 1005]], '#8ea6b3', .85);
    return F.render('wet ice');
  }
  function ambulance(F) {            // far away on the bank, small and simple
    F.begin({ width: 1080, height: 1080, seed: 43 });
    F.part([[180, 560], [700, 560], [720, 900], [160, 900]], '#e6ded1', { ridge: [[230, 570], [220, 890]], contrast: .18, step: 200 });
    F.part([[700, 660], [860, 680], [900, 780], [900, 900], [720, 900]], '#e6ded1', { ridge: [[730, 670]], contrast: .18, step: 160 });
    F.flat([[730, 690], [845, 704], [872, 780], [730, 780]], '#2b3b48');
    F.flat([[160, 760], [900, 760], [900, 800], [160, 800]], '#b0482a');
    [[300, 905], [780, 905]].forEach(([x, y]) => F.part(F.disc(x, y, 62, 62, 8), '#2e2622', { contrast: .2, step: 60 }));
    F.flat([[380, 520], [500, 520], [500, 560], [380, 560]], '#3e3f42');
    return F.render('ambulance');
  }
  function lampRed(F) { F.begin({ width: 1080, height: 1080, seed: 44 }); F.flat([[380, 520], [440, 520], [440, 556], [380, 556]], '#e0503c'); return F.render('red light'); }
  function lampBlue(F) { F.begin({ width: 1080, height: 1080, seed: 45 }); F.flat([[440, 520], [500, 520], [500, 556], [440, 556]], '#4f86d8'); return F.render('blue light'); }
  function tint(colour) {            // the warning lights colour the snow on the bank (flat, see-through — no glow)
    return function (F) { F.begin({ width: 1080, height: 1080, seed: 46 });
      F.flat([[-400, 1300], [-400, 1120], [180, 1080], [420, 1110], [700, 1060], [960, 1100], [1480, 1070], [1480, 1300]], colour, .14); return F.render('light on snow'); };
  }

  /* ---------------- sets: (F, W, H) → a whole-frame drawing ----------------
     Each place has 3 layers so the camera feels deep without any blur:
       far   — distant things, move slowly      set — the ground the cast stands on
       front — dark near silhouettes that frame the shot and move faster than everything */
  const NIGHT_FG = '#26344a', DEEP_FG = '#0f1b26', WARD_FG = '#1c4642';
  function pondFar(F, W, H) {
    F.begin({ width: W, height: H, bg: NIGHT, seed: 30 });
    F.part([[-400, 1300], [-400, 1120], [180, 1080], [420, 1110], [700, 1060], [960, 1100], [1480, 1070], [1480, 1300]], SNOW, { ridge: [[200, 1090], [700, 1070]], contrast: .14, step: 200 });
    [[120, 1110, 330], [300, 1100, 260], [880, 1090, 360], [1010, 1095, 280]].forEach(([x, y, h]) => {
      F.part([[x - 10, y], [x + 10, y], [x + 4, y - h], [x - 4, y - h]], BARK, { contrast: .2, step: 120 });
      F.part(F.tube([x, y - h * .5], [x - h * .3, y - h * .82], 12, 6), BARK, { contrast: .2, step: 60 });
      F.part(F.tube([x, y - h * .62], [x + h * .26, y - h * .92], 11, 5), BARK, { contrast: .2, step: 60 });
    });
    return F.render('far bank');
  }
  function pond(F, W, H) {
    F.begin({ width: W, height: H, bg: NIGHT, seed: 31 });
    F.part([[-400, 2700], [-400, 1250], [300, 1235], [700, 1250], [1480, 1240], [1480, 2700]], ICE, { ridge: [[200, 1260], [160, 1900]], contrast: .16, step: 260, extra: [[540, 1600], [880, 1450]] });
    // the hole in the ice: dark water with a pale broken rim
    F.flat([[700, 1340], [800, 1310], [930, 1325], [1000, 1360], [960, 1400], [830, 1415], [720, 1395]], '#e8eef0');
    F.flat([[722, 1350], [805, 1325], [920, 1336], [975, 1362], [940, 1390], [830, 1400], [735, 1385]], '#1d2a36');
    // broken ice slabs at the hole's edge
    F.part([[930, 1395], [1000, 1372], [1030, 1400], [975, 1420]], '#dfe8ec', { contrast: .14, step: 60 });
    // the medic's footprints in the snow on the ice
    [[180, 1600], [250, 1560], [300, 1530], [360, 1510]].forEach(([x, y]) => F.flat(F.disc(x, y, 22, 8, 6), '#a3b6c0'));
    [[60, 1270], [520, 1252], [1040, 1262]].forEach(([x, y], i) =>
      F.part([[x - 70, y], [x - 30, y - 24 - i * 3], [x + 20, y - 30], [x + 70, y]], SNOW, { ridge: [[x - 20, y - 26]], contrast: .14, step: 60 }));
    return F.render('frozen pond at night');
  }
  function pondFront(F, W, H) {            // a dark snow bank and dry reeds close to the camera
    F.begin({ width: W, height: H, bg: NIGHT, seed: 34 });
    F.flat([[-400, 2700], [-400, 1760], [-120, 1720], [120, 1760], [260, 1840], [320, 2700]], NIGHT_FG);
    F.flat([[860, 2700], [940, 1880], [1100, 1800], [1480, 1780], [1480, 2700]], NIGHT_FG);
    [[40, 1760, 380, -.18], [110, 1760, 300, .1], [170, 1780, 260, .25], [1120, 1810, 420, .12]].forEach(([x, y, h, lean]) =>
      F.flat([[x - 7, y], [x + 7, y], [x + 2 + lean * h, y - h], [x - 2 + lean * h, y - h]], NIGHT_FG));
    return F.render('near snow and reeds');
  }

  function underFar(F, W, H) {             // the water, lit a little under the hole
    F.begin({ width: W, height: H, bg: DEEP, seed: 35 });
    F.part([[-400, 2700], [-400, 300], [1480, 300], [1480, 2700]], '#26425a', { ridge: [[540, 320], [540, 1900]], contrast: .1, step: 340 });
    F.part([[480, 300], [700, 300], [980, 1500], [140, 1500]], '#33566f', { ridge: [[590, 320], [560, 1480]], contrast: .08, step: 360 });   // the lighter water below the hole
    F.part([[-400, 2700], [-400, 1820], [300, 1780], [700, 1810], [1480, 1770], [1480, 2700]], '#16273a', { contrast: .14, step: 260 });          // pond floor
    return F.render('deep water');
  }
  function underIce(F, W, H) {             // the ice sheet seen from below, with the bright hole in the middle
    F.begin({ width: W, height: H, bg: DEEP, seed: 32 });
    F.part([[-400, -400], [1480, -400], [1480, 470], [1100, 500], [900, 460], [700, 505], [380, 470], [160, 510], [-400, 480]], '#7fa2b4', { ridge: [[200, 0], [200, 480]], contrast: .16, step: 260 });
    [[[60, 120], [260, 260], [400, 230]], [[760, 60], [800, 250], [980, 330]], [[300, 380], [420, 470]]].forEach(c =>
      c.slice(1).forEach((p, i) => F.flat([c[i], p, [p[0] + 6, p[1] + 6], [c[i][0] + 6, c[i][1] + 6]], '#5f8497')));
    F.flat([[420, 250], [540, 200], [680, 220], [740, 300], [670, 380], [520, 395], [430, 340]], '#eef3f2');          // the hole
    F.flat([[420, 250], [540, 200], [680, 220], [740, 300], [715, 285], [540, 222], [440, 262]], '#ffffff', .85);
    return F.render('ice from below');
  }
  function underFront(F, W, H) {           // broken ice and weeds, very close, dark
    F.begin({ width: W, height: H, bg: DEEP, seed: 36 });
    F.flat([[-400, -400], [260, -400], [180, 160], [40, 420], [-400, 520]], DEEP_FG);
    F.flat([[1480, -400], [900, -400], [960, 120], [1080, 300], [1480, 360]], DEEP_FG);
    [[60, 2100, 640, .1], [150, 2100, 480, -.12], [930, 2100, 700, -.08], [1020, 2100, 520, .14]].forEach(([x, y, h, lean]) =>
      F.flat([[x - 26, y], [x + 26, y], [x + 40 + lean * h, y - h * .55], [x + 8 + lean * h, y - h], [x - 18 + lean * h * .5, y - h * .5]], DEEP_FG));
    return F.render('near ice and weeds');
  }
  function bubble(F) {
    F.begin({ width: 1080, height: 1080, seed: 37 });
    F.flat(F.disc(540, 540, 60, 60, 10), '#cfe0e6', .55);
    F.flat(F.disc(520, 518, 18, 18, 8), '#ffffff', .7);
    return F.render('bubble');
  }

  function wardFar(F, W, H) {              // the window, far behind
    F.begin({ width: W, height: H, bg: WARD, seed: 38 });
    F.part([[110, 600], [520, 600], [520, 1080], [110, 1080]], '#d3ccbd', { contrast: .14, step: 300 });
    F.flat([[140, 630], [490, 630], [490, 1050], [140, 1050]], '#22344a');
    F.flat([[308, 630], [322, 630], [322, 1050], [308, 1050]], '#d3ccbd'); F.flat([[140, 834], [490, 834], [490, 848], [140, 848]], '#d3ccbd');
    F.flat(F.disc(420, 720, 26, 26, 8), '#e8e2cf');
    return F.render('window');
  }
  function ward(F, W, H) {
    F.begin({ width: W, height: H, bg: WARD, seed: 33 });
    F.part([[-400, 2700], [-400, 1420], [1480, 1420], [1480, 2700]], '#4f8079', { ridge: [[200, 1430], [200, 1900]], contrast: .12, step: 320 });
    F.flat([[-400, 1420], [1480, 1420], [1480, 1434], [-400, 1434]], '#3c625d');
    F.flat([[120, 1440], [540, 1440], [700, 1700], [180, 1700]], '#77a497', .45);        // moonlight from the window on the floor
    // the ceiling lamp: same shape and screen spot as the hole in the ice (the match cut)
    F.flat([[337, -400], [343, -400], [343, 470], [337, 470]], '#2c4f49');
    F.part([[250, 470], [430, 470], [470, 540], [210, 540]], '#d3ccbd', { contrast: .18, step: 120 });
    const hole = [[420, 250], [540, 200], [680, 220], [740, 300], [670, 380], [520, 395], [430, 340]], k = .84 * 1.6 / 1.9;
    F.flat(hole.map(([x, y]) => [340 + (x - 573) * k, 560 + (y - 298) * k]), '#f3f0e6');
    F.part([[938, 700], [952, 700], [952, 1420], [938, 1420]], '#6c6052', { contrast: .2, step: 200 });
    F.part([[860, 620], [1030, 620], [1030, 760], [860, 760]], '#3e3f42', { contrast: .2, step: 120 });
    F.flat([[878, 638], [1012, 638], [1012, 742], [878, 742]], '#24312f');
    F.flat([[884, 700], [930, 700], [945, 664], [960, 724], [975, 700], [1006, 700], [1006, 706], [978, 706], [960, 736], [945, 676], [934, 706], [884, 706]], '#9fd0b0');
    return F.render('hospital room at night');
  }
  function wardFront(F, W, H) {            // an IV pole and the end of a curtain, close to the camera
    F.begin({ width: W, height: H, bg: WARD, seed: 39 });
    F.flat([[-400, -400], [60, -400], [90, 600], [40, 1500], [70, 2700], [-400, 2700]], WARD_FG);       // curtain edge
    F.flat([[1150, 300], [1176, 300], [1176, 2700], [1150, 2700]], WARD_FG);                           // IV pole
    F.flat([[1100, 330], [1230, 330], [1230, 350], [1100, 350]], WARD_FG);
    F.flat([[1110, 360], [1170, 360], [1172, 520], [1108, 520]], WARD_FG);                             // the bag
    return F.render('near curtain and IV pole');
  }

  /* ---------------- people ---------------- */
  const medic = { view: 'side', build: 'adult', skin: '#e2cbb6', hair: { style: 'cap', colour: '#2e2220' },
    top: '#3c4660', vest: '#2f3850', bottom: { type: 'trousers', colour: '#2e3340' }, shoes: '#2e2622' };
  const boy = { view: 'side', build: 'child', skin: '#ece3d6', eyes: 'slits', hair: { style: 'tuft', colour: '#8a5a3a' },
    top: '#6c6052', bottom: { type: 'trousers', colour: '#3c4660' }, shoes: '#5a3124' };
  const wetBoy = Object.assign({}, boy, { top: '#4c443a', bottom: { type: 'trousers', colour: '#283044' }, shoes: '#3c2418', hair: { style: 'tuft', colour: '#5a3a24' } });
  const doctor = { build: 'adult', skin: '#ece3d6', hair: { style: 'cap', colour: '#9a948c' }, glasses: '#5e3326',
    top: '#3c4660', vest: '#e6ded1', tie: null, bottom: { type: 'trousers', colour: '#3e3f42' }, shoes: '#3a2a24' };

  const PROP = { therm: { id: 'therm', draw: thermometer, grip: [420, 860], scale: .2, rot: -6 },
                 clip: { id: 'clip', draw: clipboard, grip: [540, 250], scale: .2 } };
  const bubbles = [[600, 620, .1, 0], [640, 560, .07, .4], [575, 500, .06, 1.1], [655, 680, .08, 1.7], [610, 760, .05, 2.3]].map(([x, y, sc, at], i) =>
    ({ id: 'bub' + i, draw: bubble, origin: [540, 540], x, ground: y, scale: sc, z: 5 + i, moves: [{ at: 0, for: 3.9, do: 'drift', dx: (i % 2 ? 14 : -10), dy: -520 - i * 40 }] }));

  window.ICE20 = {
    title: 'Under the Ice', width: W, height: H, duration: 22.4,
    captions: { words: window.ICE_WORDS, y: 330, size: 80, keys: ['7', 'degrees', 'celsius', '8-year-old', 'pulse', 'two', 'hours', 'folklore', 'case', 'report', 'longest', 'record'] },
    shots: [
      { id: 'pond', from: 0, to: 11.0, bg: NIGHT, far: pondFar, set: pond, front: pondFront, handheld: 3,
        grade: { far: ['#24344a', .4] },                             // the far bank sinks into the night
        focus: [
          { at: 0, far: 5, set: 3, cast: 0, front: 2.5 },            // close on the thermometer: everything behind it soft
          { at: 2.0, for: 3.2, far: 1.2, set: 0, front: 1.5 },        // pull out: the scene comes into focus
          { at: 6.9, for: 3.0, far: 3, set: .6, front: 2 }            // in close on the boy: the far bank softens again
        ],
        camera: [
          { at: 0, zoom: 3.0, x: 560, y: 1225 },                   // the thermometer screen: "7 degrees Celsius"
          { at: 2.0, for: 4.4, zoom: 1.3, x: 570, y: 1340 },       // pull out: the medic, the boy, the hole in the ice
          { at: 6.9, for: 3.2, zoom: 1.7, x: 610, y: 1400 }        // glide in to the boy: "cold as the ice, limp, without a pulse"
        ],
        cast: [
          { id: 'board', draw: backboard, origin: [540, 1000], x: 700, ground: 1500, scale: .56, z: 1490 },
          { id: 'puddle', draw: puddle, origin: [540, 990], x: 690, ground: 1512, scale: .62, z: 1480 },
          { id: 'drip1', draw: drop, origin: [540, 540], x: 600, ground: 1500, scale: .07, z: 1491, cycle: { period: 1.4, dy: 30, fall: true, fade: [1, 0] } },
          { id: 'drip2', draw: drop, origin: [540, 540], x: 760, ground: 1502, scale: .06, z: 1491, cycle: { period: 1.7, phase: .6, dy: 26, fall: true, fade: [1, 0] } },
          { id: 'drip3', draw: drop, origin: [540, 540], x: 900, ground: 1500, scale: .07, z: 1491, cycle: { period: 1.2, phase: .3, dy: 30, fall: true, fade: [1, 0] } },
          { id: 'amb', layer: 'far', draw: ambulance, origin: [540, 960], x: 860, ground: 1102, scale: .2, z: 1 },
          { id: 'ambR', layer: 'far', draw: lampRed, origin: [540, 960], x: 860, ground: 1102, scale: .2, z: 2, blink: { period: .8, on: .5 } },
          { id: 'ambB', layer: 'far', draw: lampBlue, origin: [540, 960], x: 860, ground: 1102, scale: .2, z: 2, blink: { period: .8, on: .5, phase: .4 } },
          { id: 'tintR', layer: 'far', draw: tint('#e0503c'), origin: [0, 0], x: 0, ground: 0, z: 0, blink: { period: .8, on: .5 } },
          { id: 'tintB', layer: 'far', draw: tint('#4f86d8'), origin: [0, 0], x: 0, ground: 0, z: 0, blink: { period: .8, on: .5, phase: .4 } },
          { id: 'breath1', draw: breath, origin: [440, 540], x: 482, ground: 1200, scale: .13, z: 1510, cycle: { period: 2.6, grow: [.4, 1.6], fade: [.8, 0], dx: 46, dy: -40 } },
          { id: 'breath2', draw: breath, origin: [440, 540], x: 482, ground: 1200, scale: .13, z: 1510, cycle: { period: 2.6, phase: 1.3, grow: [.4, 1.6], fade: [.8, 0], dx: 46, dy: -40 } },
          { id: 'boy', person: wetBoy, height: 420, x: 520, ground: 1484, lying: 'right', seed: 7, z: 1495,
            arms: { L: [-4, 0], R: [-4, 0] } },
          { id: 'medic', person: medic, height: 600, x: 390, ground: 1500, seed: 3, z: 1500, stride: { R: [80, 95], L: [-5, 100] },
            hold: { R: Object.assign({}, PROP.therm, { to: 6.6 }), L: Object.assign({}, PROP.therm, { from: 6.6 }) },
            arms: { R: [70, 8], L: [30, 20] }, head: { tilt: 6 }, idle: { lean: 1.5, period: 3.4 },
            moves: [
              { at: 6.2, for: 3.0, do: 'arms', R: [26, 34], L: [22, 40] },   // reading done: thermometer to the other hand
              { at: 9.0, for: 2.1, do: 'reach', arm: 'R', deg: 42, bend: 22 },  // fingers on the boy's wrist: "without a pulse"
              { at: 9.0, for: 2.1, do: 'tilt', deg: 8 },
              { at: 10.2, for: 0.9, do: 'sad' }
            ] }
        ] },
      { id: 'under', from: 11.0, to: 14.9, bg: DEEP, far: underFar, set: underIce, front: underFront, handheld: 2,
        grade: { far: ['#0f1e2c', .35] },                            // deep water swallows the distance
        focus: [{ at: 0, far: 2.5, set: 0, cast: 0, front: 3 }],
        camera: [{ at: 0, zoom: 1.75, x: 570, y: 500 }, { at: 0, for: 3.9, zoom: 1.6, x: 570, y: 560 }],
        cast: [
          { id: 'sled', draw: sled, origin: [540, 880], x: 330, ground: 470, scale: .36, z: 1, silhouette: '#1f2f3e' },
          // the boy: only a dark shape against the light, sinking away from the hole
          { id: 'boyUnder', person: Object.assign({}, boy, { view: 'front' }), height: 470, x: 560, ground: 700, seed: 7, z: 2, shadow: false,
            silhouette: '#132131', arms: { L: [148, 18], R: [138, 26] }, stride: { L: [8, 3], R: [4, 0] }, head: { tilt: -8, nod: 1 },
            moves: [{ at: 0, for: 3.9, do: 'drift', dy: 430, dx: 40, rot: 22 }] }
        ].concat(bubbles) },
      { id: 'ward', from: 14.9, to: 22.41, bg: WARD, far: wardFar, set: ward, front: wardFront, handheld: 2,
        grade: { far: ['#25524a', .3] },
        focus: [
          { at: 0, far: 4, set: 0, cast: 0, front: 2.5 },            // the lamp is sharp for the match cut…
          { at: .3, for: 1.4, set: 2.4 },                              // …then, on the doctor, the room behind him goes soft
          { at: 3.4, for: 2.6, far: 2, set: 0, cast: 1.6, front: 2 }  // rack focus to the boy in the bed; the doctor goes soft
        ],
        camera: [
          { at: 0, zoom: 1.9, x: 337, y: 780 },                    // match cut: the lamp sits exactly where the hole in the ice was
          { at: .2, for: 1.6, zoom: 1.9, x: 330, y: 1240 },         // tilt down to the doctor: "This is not folklore. It is a case report."
          { at: 3.4, for: 3.8, zoom: 1.22, x: 610, y: 1240 }        // pull out to the bed: "the longest ice water survival on record"
        ],
        cast: [
          { id: 'ecmo', plane: 'back', draw: ecmo, origin: [540, 960], x: 560, ground: 1440, scale: .5, z: 1400 },
          { id: 'bed', plane: 'back', draw: bedBack, origin: [540, 990], x: 760, ground: 1460, scale: .62, z: 1410 },
          { id: 'boyBed', plane: 'back', person: boy, height: 360, x: 640, ground: 1312, lying: 'right', seed: 7, z: 1420, shadow: false,
            arms: { L: [-4, 0], R: [-4, 0] } },
          { id: 'blanket', plane: 'back', draw: blanket, origin: [540, 790], x: 750, ground: 1342, scale: .62, z: 1430 },
          { id: 'tubes', plane: 'back', draw: tubes, origin: [0, 700], x: 590, ground: 1300, scale: .35, z: 1425 },
          { id: 'doc', person: doctor, height: 560, x: 290, ground: 1540, seed: 9, z: 1540,
            hold: { R: PROP.clip }, arms: { R: [-5, -90], L: [7, 2] },
            moves: [
              { at: 0.4, for: 1.3, do: 'shake' },                    // "not folklore"
              { at: 1.9, for: 1.2, do: 'nod' },                      // "a case report"
              { at: 3.4, for: 4.0, do: 'look', dir: 'R' }           // looks over at the boy
            ] }
        ] }
    ]
  };
})();
