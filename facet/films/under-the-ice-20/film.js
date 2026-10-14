/* UNDER THE ICE — first 22.4 seconds, Facet style.
   3 places, 2 cuts (both at the end of a sentence):
     0.0–11.0  the frozen pond (one shot: thermometer close-up → pull out → glide in to the boy)
     11.0–14.9 under the ice
     14.9–22.4 the hospital (one shot: the doctor → pull out to the bed)
   Narration only: no music, no sound effects. No blur, glow or sparks. */
(function () {
  const W = 1080, H = 1920;

  /* ---------------- colours ---------------- */
  const NIGHT = '#4b6782', DEEP = '#22384b', WARD = '#2f6f6f';
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

  /* ---------------- sets: (F, W, H) → a whole-frame drawing ---------------- */
  function pond(F, W, H) {
    F.begin({ width: W, height: H, bg: NIGHT, seed: 31 });
    // far snow bank and bare trees
    F.part([[-400, 1270], [-400, 1120], [180, 1080], [420, 1110], [700, 1060], [960, 1100], [1480, 1070], [1480, 1270]], SNOW, { ridge: [[200, 1090], [700, 1070]], contrast: .14, step: 200 });
    [[120, 1110, 330], [300, 1100, 260], [880, 1090, 360], [1010, 1095, 280]].forEach(([x, y, h]) => {
      F.part([[x - 10, y], [x + 10, y], [x + 4, y - h], [x - 4, y - h]], BARK, { contrast: .2, step: 120 });
      F.part(F.tube([x, y - h * .5], [x - h * .3, y - h * .82], 12, 6), BARK, { contrast: .2, step: 60 });
      F.part(F.tube([x, y - h * .62], [x + h * .26, y - h * .92], 11, 5), BARK, { contrast: .2, step: 60 });
    });
    // the frozen pond
    F.part([[-400, 2700], [-400, 1250], [300, 1235], [700, 1250], [1480, 1240], [1480, 2700]], ICE, { ridge: [[200, 1260], [160, 1900]], contrast: .16, step: 260, extra: [[540, 1600], [880, 1450]] });
    // the hole in the ice: dark water with a pale broken rim
    F.flat([[700, 1340], [800, 1310], [930, 1325], [1000, 1360], [960, 1400], [830, 1415], [720, 1395]], '#e8eef0');
    F.flat([[722, 1350], [805, 1325], [920, 1336], [975, 1362], [940, 1390], [830, 1400], [735, 1385]], '#1d2a36');
    // snow tufts near the edges
    [[60, 1270], [520, 1252], [1040, 1262], [100, 1880], [980, 1900]].forEach(([x, y], i) =>
      F.part([[x - 70, y], [x - 30, y - 24 - i * 3], [x + 20, y - 30], [x + 70, y]], SNOW, { ridge: [[x - 20, y - 26]], contrast: .14, step: 60 }));
    return F.render('frozen pond at night');
  }
  function underIce(F, W, H) {
    F.begin({ width: W, height: H, bg: DEEP, seed: 32 });
    F.part([[-400, 2700], [-400, 600], [1480, 600], [1480, 2700]], '#2c4a60', { ridge: [[200, 620], [200, 1900]], contrast: .1, step: 320 });   // the water
    // weeds on the bottom
    [[90, 1920, 300], [210, 1920, 220], [860, 1920, 340], [990, 1920, 240]].forEach(([x, y, h]) =>
      F.part([[x - 16, y], [x + 16, y], [x + 30, y - h * .6], [x + 6, y - h], [x - 12, y - h * .55]], '#1d3445', { contrast: .2, step: 120 }));
    F.part([[-400, 2700], [-400, 1800], [300, 1760], [700, 1790], [1480, 1750], [1480, 2700]], '#1a2c3a', { contrast: .14, step: 260 });          // pond floor
    // the ice above, seen from below: pale with a jagged lower edge and cracks
    F.part([[-400, -40], [1480, -40], [1480, 560], [940, 590], [760, 555], [560, 600], [360, 565], [160, 600], [-400, 570]], '#8fb0c0', { ridge: [[200, 0], [200, 580]], contrast: .16, step: 260 });
    [[[120, 120], [300, 260], [420, 230]], [[700, 80], [760, 300], [900, 380]], [[400, 420], [520, 520]]].forEach(c =>
      c.slice(1).forEach((p, i) => F.flat([c[i], p, [p[0] + 6, p[1] + 6], [c[i][0] + 6, c[i][1] + 6]], '#6f93a5')));
    // the hole the boy fell through: the brightest thing in the frame
    F.flat([[560, 330], [650, 300], [780, 320], [820, 380], [760, 430], [640, 440], [570, 400]], '#eef3f2');
    F.flat([[560, 330], [650, 300], [780, 320], [820, 380], [800, 360], [650, 318], [575, 345]], '#ffffff', .8);
    return F.render('under the ice');
  }
  function ward(F, W, H) {
    F.begin({ width: W, height: H, bg: WARD, seed: 33 });
    // night window
    F.part([[110, 600], [520, 600], [520, 1080], [110, 1080]], '#d3ccbd', { contrast: .14, step: 300 });
    F.flat([[140, 630], [490, 630], [490, 1050], [140, 1050]], '#22344a');
    F.flat([[308, 630], [322, 630], [322, 1050], [308, 1050]], '#d3ccbd'); F.flat([[140, 834], [490, 834], [490, 848], [140, 848]], '#d3ccbd');
    F.flat(F.disc(420, 720, 26, 26, 8), '#e8e2cf');                   // the moon
    // floor
    F.part([[-400, 2700], [-400, 1420], [1480, 1420], [1480, 2700]], '#4f8079', { ridge: [[200, 1430], [200, 1900]], contrast: .12, step: 320 });
    F.flat([[-400, 1420], [1480, 1420], [1480, 1434], [-400, 1434]], '#3c625d');
    // monitor on a pole, behind the bed
    F.part([[938, 700], [952, 700], [952, 1420], [938, 1420]], '#6c6052', { contrast: .2, step: 200 });
    F.part([[860, 620], [1030, 620], [1030, 760], [860, 760]], '#3e3f42', { contrast: .2, step: 120 });
    F.flat([[878, 638], [1012, 638], [1012, 742], [878, 742]], '#24312f');
    F.flat([[884, 700], [930, 700], [945, 664], [960, 724], [975, 700], [1006, 700], [1006, 706], [978, 706], [960, 736], [945, 676], [934, 706], [884, 706]], '#9fd0b0');
    return F.render('hospital room at night');
  }

  /* ---------------- people ---------------- */
  const medic = { view: 'side', build: 'adult', skin: '#e2cbb6', hair: { style: 'cap', colour: '#2e2220' },
    top: '#3c4660', vest: '#2f3850', bottom: { type: 'trousers', colour: '#2e3340' }, shoes: '#2e2622' };
  const boy = { view: 'side', build: 'child', skin: '#ece3d6', eyes: 'slits', hair: { style: 'tuft', colour: '#8a5a3a' },
    top: '#6c6052', bottom: { type: 'trousers', colour: '#3c4660' }, shoes: '#5a3124' };
  const boyFront = Object.assign({}, boy, { view: 'side' });
  const doctor = { build: 'adult', skin: '#ece3d6', hair: { style: 'cap', colour: '#9a948c' }, glasses: '#5e3326',
    top: '#3c4660', vest: '#e6ded1', tie: null, bottom: { type: 'trousers', colour: '#3e3f42' }, shoes: '#3a2a24' };

  const PROP = { therm: { id: 'therm', draw: thermometer, grip: [420, 860], scale: .2, rot: -6 },
                 clip: { id: 'clip', draw: clipboard, grip: [540, 250], scale: .2 } };

  window.ICE20 = {
    title: 'Under the Ice', width: W, height: H, duration: 22.4,
    captions: { words: window.ICE_WORDS, y: 330, size: 80 },
    shots: [
      { id: 'pond', from: 0, to: 11.0, bg: NIGHT, set: pond,
        camera: [
          { at: 0, zoom: 3.0, x: 560, y: 1225 },                   // the thermometer screen: "7 degrees Celsius"
          { at: 2.0, for: 4.4, zoom: 1.3, x: 570, y: 1340 },       // pull out: the medic, the boy, the hole in the ice
          { at: 6.9, for: 3.0, zoom: 1.75, x: 700, y: 1400 }        // glide in to the boy: "cold as the ice, limp…"
        ],
        cast: [
          { id: 'board', draw: backboard, origin: [540, 1000], x: 700, ground: 1500, scale: .56, z: 1490 },
          { id: 'boy', person: boy, height: 420, x: 520, ground: 1484, lying: 'right', seed: 7, z: 1495,
            arms: { L: [-4, 0], R: [-4, 0] }, head: { tilt: 0 },
            moves: [{ at: 0, for: 11, do: 'drift', dx: 0 }] },
          { id: 'medic', person: medic, height: 600, x: 345, ground: 1500, seed: 3, z: 1500, stride: { R: [80, 95], L: [-5, 100] },
            hold: { R: PROP.therm }, arms: { R: [70, 8], L: [30, 20] },
            moves: [
              { at: 6.3, for: 4.7, do: 'arms', R: [28, 30] },
              { at: 9.4, for: 1.6, do: 'sad' }
            ] }
        ] },
      { id: 'under', from: 11.0, to: 14.9, bg: DEEP, set: underIce,
        camera: [{ at: 0, zoom: 1.05, x: 540, y: 800 }, { at: 0, for: 3.9, zoom: 1.25, x: 560, y: 760 }],
        cast: [
          { id: 'sled', draw: sled, origin: [540, 880], x: 420, ground: 560, scale: .38, rot: 0, z: 1 },
          { id: 'boyUnder', person: boy, height: 470, x: 380, ground: 930, lying: 'right', seed: 7, z: 2, shadow: false,
            arms: { L: [60, 20], R: [40, 30] }, stride: { L: [10, 20], R: [-6, 10] },
            moves: [{ at: 0, for: 3.9, do: 'drift', dx: 60, dy: 24, rot: 4 }] }
        ] },
      { id: 'ward', from: 14.9, to: 22.41, bg: WARD, set: ward,
        camera: [
          { at: 0, zoom: 1.9, x: 330, y: 1240 },                   // the doctor: "This is not folklore. It is a case report."
          { at: 3.4, for: 3.8, zoom: 1.22, x: 600, y: 1240 }        // pull out to the bed: "the longest ice water survival on record"
        ],
        cast: [
          { id: 'ecmo', draw: ecmo, origin: [540, 960], x: 560, ground: 1440, scale: .5, z: 1400 },
          { id: 'bed', draw: bedBack, origin: [540, 990], x: 760, ground: 1460, scale: .62, z: 1410 },
          { id: 'boyBed', person: boyFront, height: 360, x: 520, ground: 1312, lying: 'right', seed: 7, z: 1420, shadow: false,
            arms: { L: [-4, 0], R: [-4, 0] } },
          { id: 'blanket', draw: blanket, origin: [540, 790], x: 750, ground: 1342, scale: .62, z: 1430 },
          { id: 'tubes', draw: tubes, origin: [0, 700], x: 590, ground: 1300, scale: .35, z: 1425 },
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
