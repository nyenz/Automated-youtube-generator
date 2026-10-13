/* DEMO — "Under the Ice" in the Low-Poly style (full 2:40 narration). Needs assets.js and shots.js loaded first.
   Load demo gives estimated timing; upload the real narration in Voice & timing for exact sync. */
(function () {
  var A = window.ICE_ASSETS, S = window.ICE_SHOTS, C = window.ICE_CUTS; if (!A || !S) return;
  var SETS = ['snowfield', 'yard', 'underice', 'hospital', 'park'], people = ['boy', 'boy-gown', 'mother', 'father', 'medic', 'diver', 'doctor', 'surgeon'], fx = ['beat'];
  var assets = {}; Object.keys(A).forEach(function (n) { assets[n] = "KIT.asset('" + n + "', " + A[n].toString() + ");" });
  var planAssets = Object.keys(A).map(function (n) {
    var kind = SETS.indexOf(n) >= 0 ? 'set' : people.indexOf(n) >= 0 ? 'character' : fx.indexOf(n) >= 0 ? 'fx' : n === 'ducks' ? 'creature' : 'prop';
    var o = { name: n, kind: kind, difficulty: 2, size: kind === 'set' ? 26 : kind === 'character' ? (/boy/.test(n) ? 1.85 : 2.66) : 1, look: n, parts: [], moves: [] };
    if (kind === 'set') o.spots = ['center'];
    if (/thermometer|clipboard|phone|torch/.test(n)) o.holdable = true;
    return o;
  });
  var shots = C.map(function (c) {
    var code = S[c[0]], set = (/set: '([\w-]+)'/.exec(code) || [])[1] || 'void', castBlock = (/cast: \{([\s\S]*?)\},\n  camera/.exec(code) || [])[1] || '', cast = [];
    castBlock.replace(/(?:^\s*|[{,]\s*)'?([a-z][\w-]*)'?: \{ at/g, function (m, n) { cast.push(n) });
    return { id: c[0], lines: [c[1], c[2]], set: set, cast: cast, show: '', mood: 'normal', difficulty: 2 };
  });
  window.DEMO_ICE_LP = { title: 'Under the Ice', style: 'lowpoly', script: "7 degrees Celsius. That is what an infrared thermometer reads against the thigh of an 8-year-old boy. He is cold as the ice. limp and without a pulse after more than two hours under the pond. This is not folklore. It is a case report. And its authors say it is the longest ice water survival on record. To understand how, you have to understand the strange mercy of freezing. A cooling body needs less fuel, and like a phone dropping into power-saving mode, every degree of cooling cuts the brain's hunger for oxygen by about 5 to 7 percent. Small children cool fast. It is December in central Pennsylvania. Minus 3 degrees. and a little boy pulls on his boots and snow jacket and walks out into the quiet with his sled. Then, he is gone. His parents follow the sled tracks across the snow. until they stop at a broken hole in the black ice. It is every parent's worst fear. Doctors believe he was simply walking towards some ducks. Divers search the dark water square by square. When they lift them out, there is no breath and no pulse. CPR begins on firm ground. and then comes an order that sounds almost wrong. Do not warm him up. The cold has put his brain on pause, and if they warm him now with no blood flowing, it would suddenly need oxygen it cannot get. So they keep him cold and they keep pressing on his chest for 69 minutes without stopping. all the way to an operating room where a team is waiting. 18 minutes after he arrives, a machine called ECMO takes over the work of his heart and lungs. and warms his blood slowly. At 22 degrees, a faint flicker appears on the monitor. At 28, a rhythm begins to catch. About ten hours later, the boy opens his eyes and turns toward the sound of his mother's voice. Seven degrees was only a skin reading. not his core, and the ice did not heal him, it only bought time for a team and a machine to pull him back from the edge. The road back is long. 59 days in hospital, then rehabilitation, relearning small things he once knew. Six months on, he is standing. riding a tricycle and still getting stronger. The longest survival reported before was 83 minutes. Doctors have an old saying that nobody is dead until they are warm and dead. This little boy pushed that line past two and a half hours and we still don't know where it ends.",
    plan: { title: 'Under the Ice', sky: 'night', assets: planAssets, cuts: { main: shots } }, assets: assets, shots: S };
})();
