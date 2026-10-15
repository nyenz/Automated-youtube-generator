// node examples/under-the-ice-facet/build.js  → writes examples/under-the-ice-facet/demo.js
// Turns the hand-made film (facet/films/under-the-ice-20/film.js) into an app project:
// KIT.asset(...) files + SHOT(...) files, exactly the format the AI chats write.
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '../../');
const film = fs.readFileSync(R + 'facet/films/under-the-ice-20/film.js', 'utf8');
global.window = {}; require(R + 'facet/films/under-the-ice-20/words.js'); const WORDS = window.ICE_WORDS;

function fnSrc(name) {               // the source of `function name(...) {...}` in film.js
  const i = film.indexOf('function ' + name + '(');
  if (i < 0) throw new Error('no function ' + name);
  let d = 0, j = film.indexOf('{', i);
  for (; j < film.length; j++) { if (film[j] === '{') d++; else if (film[j] === '}') { d--; if (!d) break } }
  return film.slice(i, j + 1);
}
const C = `const NIGHT = '#4b6782', DEEP = '#22384b', WARD = '#3a6e64', ICE = '#b9cad3', SNOW = '#dfe4e3', BARK = '#5b4a42', ACC = '#cc5321';
  const NIGHT_FG = '#26344a', DEEP_FG = '#0f1b26', WARD_FG = '#1c4642';`;
const ind = s => s.split('\n').map(l => '  ' + l).join('\n');
function prop(name, fn, ret) { return `KIT.asset('${name}', function (F) {\n  ${C}\n${ind(fnSrc(fn))}\n  return ${ret.replace('DRAW', fn)};\n});` }
function set(name, fns, ret) { return `KIT.asset('${name}', function (F) {\n  ${C}\n${fns.map(f => ind(fnSrc(f))).join('\n')}\n  return ${ret};\n});` }
const person = (name, size, spec) => `KIT.asset('${name}', function (F) {\n  return { kind: 'character', size: ${size}, person: ${spec} };\n});`;

const assets = {
  'pond': set('pond', ['pondFar', 'pond', 'pondFront'], `{ kind: 'set', bg: NIGHT, grade: { far: ['#24344a', .4] }, far: pondFar, set: pond, front: pondFront,
    spots: { medic: [390, 1500], boy: [578, 1484], board: [760, 1500], hole: [850, 1370], bank: [860, 1102], center: [540, 1500] } }`),
  'under-ice': set('under-ice', ['underFar', 'underIce', 'underFront'], `{ kind: 'set', bg: DEEP, grade: { far: ['#0f1e2c', .35] }, far: underFar, set: underIce, front: underFront,
    spots: { hole: [580, 300], below: [560, 700], center: [540, 900] } }`),
  'ward': set('ward', ['wardFar', 'ward', 'wardFront'], `{ kind: 'set', bg: WARD, grade: { far: ['#25524a', .3] }, far: wardFar, set: ward, front: wardFront,
    spots: { doctor: [290, 1540], bed: [760, 1460], machine: [560, 1440], center: [540, 1540] } }`),
  'medic': person('medic', 2.6, `{ build: 'adult', skin: '#e2cbb6', hair: { style: 'cap', colour: '#2e2220' }, top: '#3c4660', vest: '#2f3850', bottom: { type: 'trousers', colour: '#2e3340' }, shoes: '#2e2622' }`),
  'boy': person('boy', 1.83, `{ build: 'child', skin: '#ece3d6', eyes: 'slits', hair: { style: 'tuft', colour: '#8a5a3a' }, top: '#6c6052', bottom: { type: 'trousers', colour: '#3c4660' }, shoes: '#5a3124' }`),
  'boy-wet': person('boy-wet', 1.83, `{ build: 'child', skin: '#ece3d6', eyes: 'slits', hair: { style: 'tuft', colour: '#5a3a24' }, top: '#4c443a', bottom: { type: 'trousers', colour: '#283044' }, shoes: '#3c2418' }`),
  'doctor': person('doctor', 2.43, `{ build: 'adult', skin: '#ece3d6', hair: { style: 'cap', colour: '#9a948c' }, glasses: '#5e3326', top: '#3c4660', vest: '#e6ded1', bottom: { type: 'trousers', colour: '#3e3f42' }, shoes: '#3a2a24' }`),
  'thermometer': prop('thermometer', 'thermometer', `{ kind: 'prop', size: .44, origin: [540, 880], top: 380, grip: [420, 860], draw: DRAW }`),
  'clipboard': prop('clipboard', 'clipboard', `{ kind: 'prop', size: .64, origin: [540, 900], top: 170, grip: [330, 620], draw: DRAW }`),
  'frost': prop('frost', 'frost', `{ kind: 'fx', size: 1, origin: [0, 0], top: -230, draw: DRAW }`),
  'dim': prop('dim', 'dim', `{ kind: 'fx', size: 1, origin: [0, 0], top: -230, draw: DRAW }`),
  'heart-monitor': prop('heart-monitor', 'monitorLive', `{ kind: 'fx', size: 1, origin: [0, 0], top: -230, draw: DRAW }`),
  'backboard': prop('backboard', 'backboard', `{ kind: 'prop', size: .17, origin: [540, 1000], top: 930, draw: DRAW }`),
  'sled': prop('sled', 'sled', `{ kind: 'prop', size: .1, origin: [540, 880], top: 820, draw: DRAW }`),
  'hospital-bed': prop('hospital-bed', 'bedBack', `{ kind: 'prop', size: 1.27, origin: [540, 990], top: 520, draw: DRAW }`),
  'blanket': prop('blanket', 'blanket', `{ kind: 'prop', size: .51, origin: [540, 790], top: 600, draw: DRAW }`),
  'heart-lung-machine': prop('heart-lung-machine', 'ecmo', `{ kind: 'prop', size: 1.3, origin: [540, 960], top: 360, draw: DRAW }`),
  'tubes': prop('tubes', 'tubes', `{ kind: 'prop', size: .15, origin: [0, 700], top: 600, draw: DRAW }`),
  'breath': prop('breath', 'breath', `{ kind: 'fx', size: .05, origin: [440, 540], top: 450, draw: DRAW }`),
  'drip': prop('drip', 'drop', `{ kind: 'fx', size: .021, origin: [540, 540], top: 470, draw: DRAW }`),
  'wet-ice': prop('wet-ice', 'puddle', `{ kind: 'fx', size: .1, origin: [540, 990], top: 955, draw: DRAW }`),
  'bubble': prop('bubble', 'bubble', `{ kind: 'fx', size: .026, origin: [540, 540], top: 480, draw: DRAW }`),
  'ambulance': prop('ambulance', 'ambulance', `{ kind: 'prop', size: .38, origin: [540, 960], top: 520, draw: DRAW }`),
  'light-red': prop('light-red', 'lampRed', `{ kind: 'fx', size: .38, origin: [540, 960], top: 520, draw: DRAW }`),
  'light-blue': prop('light-blue', 'lampBlue', `{ kind: 'fx', size: .38, origin: [540, 960], top: 520, draw: DRAW }`),
};
// the tint helper returns a function; write the two tints out
const tintSrc = c => `KIT.asset('snow-tint-${c[0]}', function (F) {
  return { kind: 'fx', size: 1, origin: [0, 0], top: -230, draw: function (F) { F.begin({ width: 1080, height: 1080, seed: 46 });
    F.flat([[-400, 1300], [-400, 1120], [180, 1080], [420, 1110], [700, 1060], [960, 1100], [1480, 1070], [1480, 1300]], '${c[1]}', .14); return F.render('light on snow'); } };
});`;
assets['snow-tint-red'] = tintSrc(['red', '#e0503c']); assets['snow-tint-blue'] = tintSrc(['blue', '#4f86d8']);

const shots = {
  M01: `SHOT('M01', {
  set: 'pond',
  handheld: 3,
  light: { side: 'L', rim: '#dfe9f2', width: 3, shadow: .2 },   // moonlight from the left
  weather: { kind: 'snow', amount: 70, speed: .8 },
  camera: [                                                    // framings joined by cuts; pans + one slow push inside each
    { at: 0, zoom: 3.2, on: [600, 1282] },                     // A close: the reading counts down to 7.0 °C
    { at: .1, for: 2.0, zoom: 3.32, on: [600, 1282] },
    { word: 'That', cut: true, zoom: 2.1, on: [565, 1300] },    // B CUT medium: "an infrared thermometer"
    { word: 'against', for: 1.2, zoom: 2.22, on: [645, 1372] },// pan down along its aim: "against the thigh"
    { word: 'boy', cut: true, zoom: 1.3, on: [600, 1352] },    // C CUT wide: "8-year-old boy"
    { word: 'He', for: 1.9, zoom: 1.85, on: [830, 1415] }      // one slow push toward his face: "cold as the ice"
  ],
  focus: [
    { at: 0, far: 5, set: 3, cast: 0, front: 2.5 },
    { word: 'That', cut: true, far: 4, set: 1.5, cast: 0, front: 2 },
    { word: 'infrared', for: 1.0, far: 4.5, set: 1.8 },        // the device in sharp focus as it is named
    { word: 'thigh', for: .6, far: 4, set: .8 },
    { word: 'boy', cut: true, far: 1.2, set: 0, cast: 0, front: 1.5 },
    { word: 'He', for: 1.9, far: 3, set: .6, front: 2 }
  ],
  cast: {
    'wet-ice': { at: [750, 1512], z: 1480 },
    backboard: { at: 'board', z: 1490 },
    'boy-wet': { at: 'boy', view: 'side', lying: 'right', z: 1495, breath: 0, arms: { L: [-4, 0], R: [-4, 0] } },   // no pulse: not breathing
    medic: { at: 'medic', view: 'side', pose: 'kneel', z: 1500, arms: { R: [36, 28], L: [30, 20] }, head: { tilt: 6 }, idle: { lean: 1.5, period: 3.4 },
             hold: { R: { item: 'thermometer', to: 6.6, rot: 52, value: { from: 9.6, to: 7.0, word: '7', for: 1.4, step: .1 } },   // aimed at the thigh, the reading counts down
                     L: { item: 'thermometer', from: 6.6, value: 7 } } },
    breath: { at: [482, 1200], z: 1510, cycle: { period: 2.6, grow: [.4, 1.6], fade: [.8, 0], dx: 46, dy: -40 } },
    drip: { at: [660, 1500], z: 1491, cycle: { period: 1.4, dy: 30, fall: true, fade: [1, 0] } },
    ambulance: { at: 'bank', layer: 'far', z: 1 },
    'light-red': { at: 'bank', layer: 'far', z: 2, blink: { period: .8, on: .5 } },
    'light-blue': { at: 'bank', layer: 'far', z: 2, blink: { period: .8, on: .5, phase: .4 } },
    'snow-tint-red': { at: [0, 0], layer: 'far', z: 0, blink: { period: .8, on: .5 } },
    'snow-tint-blue': { at: [0, 0], layer: 'far', z: 0, blink: { period: .8, on: .5, phase: .4 } }
  },
  moves: [
    { word: 'boy', who: 'medic', do: 'arms', for: 2.4, R: [26, 34], L: [22, 40] },  // reading done: thermometer to the other hand
    { word: 'cold', who: 'boy-wet', do: 'colour', for: 1.8, skin: '#cdd8de', lips: '#8d8fae' },  // "cold as the ice": his face drains to blue-grey
    { word: 'cold', who: 'medic', do: 'reach', for: 1.6, arm: 'R', deg: 60, bend: 16 },  // fingers on the boy's wrist
    { word: 'cold', who: 'medic', do: 'lean', for: 1.6, deg: 16 },
    { word: 'ice', who: 'medic', do: 'tilt', for: .8, deg: 14 }
  ]
});`,
  M02: `SHOT('M02', {
  set: 'under-ice',
  handheld: 2,
  weather: { kind: 'dust', amount: 45, colour: '#b9cfda' },
  camera: [{ at: 0, zoom: 1.75, on: [570, 500] }, { at: 0, for: 6.1, zoom: 1.6, on: [570, 560] }],
  focus: [{ at: 0, far: 2.5, set: 0, cast: 0, front: 3 }],
  cast: {
    sled: { at: [330, 470], z: 1, silhouette: '#1f2f3e' },
    // "more than two hours": the hole frosts over and the light fades
    frost: { at: [0, 0], z: 0, fade: { from: 0, to: .92, word: 'more', for: 2.8 } },
    dim: { at: [0, 0], z: 50, fade: { from: 0, to: .42, word: 'two', for: 2.6 } },
    // the boy is only a dark shape against the light, sinking away from the hole
    boy: { at: 'below', view: 'front', size: 2.04, z: 2, shadow: false, silhouette: '#132131',
           arms: { L: [148, 18], R: [138, 26] }, stride: { L: [8, 3], R: [4, 0] }, head: { tilt: -8, nod: 1 } },
    bubble: { at: [600, 620], size: .03, z: 5, cycle: { period: 2.2, dy: -520, dx: -10, fade: [1, .2] } }
  },
  moves: [{ at: 0, for: 6.1, who: 'boy', do: 'drift', dy: 430, dx: 40, rot: 22 }]
});`,
  M03: `SHOT('M03', {
  set: 'ward',
  handheld: 2,
  light: { side: 'L', rim: '#e6e1cf', width: 2.5, shadow: .18 },   // moonlight through the window
  camera: [
    { at: 0, zoom: 1.9, on: [337, 780] },                     // A match cut: the lamp is where the hole in the ice was
    { at: .2, for: 1.6, zoom: 1.9, on: [330, 1240] },          //   tilt down (no zoom) to the doctor
    { word: 'It', cut: true, zoom: 5.2, on: [318, 1332] },     // B CUT to the page on "It is a case report": readable
    { word: 'case', for: 1.0, zoom: 5.35, on: [318, 1332] },
    { word: 'And', cut: true, zoom: 1.28, on: [420, 1240] },   // C CUT wide on the room…
    { word: 'And', after: .15, for: 3.8, zoom: 1.34, on: [610, 1240] }   // …slow pan to the boy in the bed
  ],
  focus: [
    { at: 0, far: 4, set: 0, cast: 0, front: 2.5 },
    { at: .3, for: 1.4, set: 2.4 },
    { word: 'It', cut: true, far: 5, set: 3, cast: 0, front: 3 },
    { word: 'And', cut: true, far: 2, set: 1.6, cast: 0, front: 2 },
    { word: 'And', after: .2, for: 2.6, set: 0, cast: 1.6 }     // rack focus: the doctor goes soft, the boy sharp
  ],
  cast: {
    'heart-lung-machine': { at: 'machine', plane: 'back', z: 1400 },
    'hospital-bed': { at: 'bed', plane: 'back', z: 1410 },
    boy: { at: [640, 1312], view: 'side', lying: 'right', size: 1.57, plane: 'back', z: 1420, shadow: false, arms: { L: [-4, 0], R: [-4, 0] },
           colour: { skin: '#cdd8de', lips: '#8d8fae' }, breath: 0 },                 // still cold from the pond, not breathing
    'heart-monitor': { at: [0, 0], plane: 'back', z: 1399, value: { from: 0, to: 7.3, at: 0, for: 7.3, step: 1 / 15, ease: 'linear' } },
    tubes: { at: [590, 1300], plane: 'back', z: 1425 },
    blanket: { at: [750, 1342], plane: 'back', z: 1430 },
    doctor: { at: 'doctor', z: 1540, arms: { R: [-5, -90], L: [7, 2] }, hold: { R: 'clipboard' } }
  },
  moves: [
    { word: 'not', who: 'doctor', do: 'shake', for: 1.3 },
    { word: 'case', who: 'doctor', do: 'nod', for: 1.2 },
    { word: 'And', who: 'doctor', do: 'look', dir: 'R', for: 4 },
    { word: 'And', who: 'boy', do: 'colour', for: 3.4, skin: '#ece3d6', lips: '#c98a7e' },   // survival: his colour comes back…
    { word: 'longest', who: 'boy', do: 'breath', for: 1.6, amount: 1.4 }                     // …and he breathes again
  ]
});`
};

const kindOf = n => /pond|under-ice|ward/.test(n) && !/tint/.test(n) ? 'set' : /medic|boy|doctor/.test(n) ? 'character' : /breath|drip|wet-ice|bubble|light|tint|frost|dim|heart-monitor/.test(n) ? 'fx' : 'prop';
const planAssets = Object.keys(assets).map(n => {
  const k = kindOf(n), m = /size: ([\d.]+)/.exec(assets[n]);
  const o = { name: n, kind: k, difficulty: k === 'set' ? 3 : /bed|machine|ambulance|thermometer/.test(n) ? 2 : 1, size: k === 'set' ? 1 : +(m ? m[1] : 1), look: n.replace(/-/g, ' '), parts: [], moves: [] };
  if (k === 'set') o.spots = (/spots: \{([^}]*)\}/.exec(assets[n])[1].match(/([\w-]+):/g) || []).map(s => s.slice(0, -1));
  if (/thermometer|clipboard/.test(n)) o.holdable = true;
  return o;
});
const demo = {
  title: 'Under the Ice (Facet)', style: 'facet',
  script: WORDS.map(w => w[0]).join(' '),
  words: WORDS, duration: 22.4, audio: 'facet/films/under-the-ice-20/narration.wav',
  plan: { title: 'Under the Ice', sky: 'night', keys: ['7', 'degrees', 'celsius', '8-year-old', 'pulse', 'two', 'hours', 'folklore', 'case', 'report', 'longest', 'record'],
    assets: planAssets,
    details: { main: [
      { line: 0, word: '7', show: 'the thermometer screen counts down and settles on 7.0 °C' },
      { line: 1, word: 'infrared', show: 'the infrared thermometer in the medic\'s hand' },
      { line: 1, word: 'thigh', show: 'the thermometer is aimed at the boy\'s thigh; the camera follows its aim' },
      { line: 3, word: 'cold', show: 'his face drains to a pale blue-grey, lips bluish; the medic checks his wrist' },
      { line: 4, word: 'more', show: 'time passing under the ice: the hole frosts over' },
      { line: 4, word: 'two', show: 'the light slowly fades' },
      { line: 7, word: 'case', show: 'a readable page that says CASE REPORT' },
      { line: 8, word: 'longest', show: 'he recovers: colour comes back, he breathes, the heart line comes alive' }
    ] },
    cuts: { main: [
      { id: 'M01', lines: [0, 3], set: 'pond', cast: ['medic', 'boy-wet', 'backboard', 'thermometer'], show: 'Close on the thermometer reading 7.0 °C, pull out to the medic kneeling by the boy on the frozen pond, glide in to the boy.', mood: 'cold', difficulty: 3, transition: 'cut' },
      { id: 'M02', lines: [4, 5], set: 'under-ice', cast: ['boy', 'sled'], show: 'Under the ice: the boy, a dark silhouette, sinks away from the bright hole.', mood: 'dark', difficulty: 2, transition: 'cut' },
      { id: 'M03', lines: [6, 9], set: 'ward', cast: ['doctor', 'boy', 'hospital-bed'], show: 'Match cut to the hospital lamp, tilt down to the doctor with the case report, pull out to the boy in bed.', mood: 'hope', difficulty: 2, transition: 'cut' }
    ] } },
  assets, shots
};
fs.writeFileSync(__dirname + '/demo.js', '/* DEMO — "Under the Ice" (first 22 s) in the Facet style, with the real narration. Built by build.js — edit build.js, not this file. */\nwindow.DEMO_ICE_FACET = ' + JSON.stringify(demo, null, 1) + ';\n');
console.log('wrote demo.js', Object.keys(assets).length, 'assets');
