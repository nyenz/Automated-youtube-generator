// node build.js <words.json> <out payload.json> [mode] [res]
const fs = require('fs'); global.window = global;
require('./assets.js'); require('./shots.js');
const A = window.ICE_ASSETS, W = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const assets = {}; Object.keys(A).forEach(n => assets[n] = "KIT.asset('" + n + "', " + A[n].toString() + ");");
const pl = { mode: process.argv[4] || 'play', aspect: '9:16', sky: 'night', name: 'Under the Ice', assets, shots: window.ICE_SHOTS,
  cut: { duration: W.duration, words: W.words, lines: W.lines, shots: window.ICE_CUTS.map(c => ({ id: c[0], from_line: c[1], to_line: c[2] })) },
  captions: true, res: +(process.argv[5] || 540), fps: 30,
  sizes: { boy: 1.85, 'boy-gown': 1.85, mother: 2.64, father: 2.75, medic: 2.66, diver: 2.66, doctor: 2.64, surgeon: 2.66 },
  look: { film: .8, atmos: .8, fg: true, focus: .8 }, mix: { narr: 1, sfx: .9, music: .3, duck: true } };
fs.writeFileSync(process.argv[3], JSON.stringify(pl)); console.log('ok', Object.keys(assets).length, 'assets', pl.cut.shots.length, 'shots');
