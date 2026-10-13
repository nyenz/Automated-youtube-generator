/* "Under the Ice" — Low-Poly shots. CUTS = [id, first line, last line]. */
(function () {
  var S = {};
  function shot(id, spec) { S[id] = "SHOT('" + id + "', " + spec + ");" }

  shot('V01', `{
  set: 'snowfield', air: 'snow', transition: 'cut',
  cast: { medic: { at: 'medic', turn: 'right', face: 'determined' }, 'boy-lying': { at: 'boy' }, thermometer: { at: [0, 0, 0] } },
  camera: { framing: 'medium', on: 'medic', side: 'front-right', angle: 'high', move: 'push-in' },
  light: 'cold', music: 'mystery', ambience: 'night',
  moves: [ { sec: 0, who: 'medic', do: 'crouch' }, { sec: 0, who: 'medic', do: 'hold', item: 'thermometer' }, { sec: .2, who: 'medic', do: 'reach', to: 'boy-lying', for: 1.2 } ],
  sfx: [ { sec: .3, sound: 'tick' } ]
}`);
  shot('V02', `{
  set: 'snowfield', air: 'snow',
  cast: { medic: { at: 'medic', turn: 'right', face: 'worried' }, 'boy-lying': { at: 'boy' }, thermometer: { at: [0, 0, 0] } },
  camera: { framing: 'full', on: ['medic', 'boy-lying'], side: 'front-left', angle: 'high', move: 'drift' },
  focus: [ { on: 'medic' }, { word: 'boy', on: 'boy-lying', pull: .5 } ],
  light: 'cold',
  moves: [ { sec: 0, who: 'medic', do: 'crouch' }, { sec: 0, who: 'medic', do: 'hold', item: 'thermometer' }, { word: 'thermometer', who: 'medic', do: 'reach', to: 'boy-lying', for: 2 } ]
}`);
  shot('V03', `{
  set: 'snowfield', air: 'snow',
  cast: { 'boy-lying': { at: 'boy' } },
  camera: { framing: 'full', on: 'boy-lying', side: 'front-right', angle: 'high', move: 'push-in' },
  light: 'cold'
}`);
  shot('V04', `{
  set: 'snowfield', air: 'snow',
  cast: { medic: { at: 'medic', turn: 'right', face: 'sad' }, 'boy-lying': { at: 'boy' } },
  camera: { framing: 'wide', side: 'front', angle: 'high', move: 'crane-up' },
  light: [ { mood: 'cold' }, { word: 'pond', mood: 'dark', ease: .8 } ],
  moves: [ { sec: 0, who: 'medic', do: 'crouch' }, { word: 'pulse', who: 'medic', do: 'shake-head', for: 1.2 } ],
  sfx: [ { word: 'pond', sound: 'riser', length: 1.4 } ]
}`);
  shot('V05', `{
  set: 'hospital', transition: 'cut',
  cast: { doctor: { at: 'center', turn: 'camera', face: 'determined' }, clipboard: { at: [0, 0, 0] } },
  camera: { framing: 'medium', on: 'doctor', side: 'front-right', move: 'push-in' },
  light: 'normal', music: 'calm', ambience: 'room',
  moves: [ { sec: 0, who: 'doctor', do: 'hold', item: 'clipboard', hand: 'L' }, { word: 'folklore', who: 'doctor', do: 'shake-head', for: .9 }, { word: 'report', who: 'doctor', do: 'nod', for: .8 } ],
  sfx: [ { word: 'report', sound: 'clink' } ]
}`);
  shot('V06', `{
  set: 'hospital',
  cast: { doctor: { at: 'left', turn: 'right', face: 'thinking' }, surgeon: { at: 'right', turn: 'left', face: 'surprised' }, clipboard: { at: [0, 0, 0] } },
  camera: { framing: 'full', on: ['doctor', 'surgeon'], side: 'front', move: 'drift' },
  focus: [ { on: 'doctor' }, { word: 'longest', on: 'surgeon', pull: .5 } ],
  light: 'normal',
  moves: [ { sec: 0, who: 'doctor', do: 'hold', item: 'clipboard', hand: 'L' }, { word: 'authors', who: 'doctor', do: 'talk', for: 1.6 }, { word: 'record', who: 'surgeon', do: 'nod', for: 1 } ]
}`);
  shot('V07', `{
  set: 'underice', air: 'bubbles', shafts: true, transition: 'cut',
  cast: {},
  camera: { framing: 'wide', side: 'front', angle: 'low', move: 'crane-up', height: 2.2 },
  light: 'silhouette', music: 'mystery', ambience: 'underwater',
  sfx: [ { word: 'mercy', sound: 'bubble' } ]
}`);
  shot('V08', `{
  set: 'void', transition: 'cut',
  cast: { kato: { at: 'center', turn: 'right', face: 'thinking' }, phone: { at: [0, 0, 0] } },
  camera: { framing: 'medium', on: 'kato', side: 'front-left', move: 'push-in' },
  light: 'warm', music: 'playful',
  moves: [ { sec: 0, who: 'kato', do: 'hold', item: 'phone' }, { word: 'fuel', who: 'kato', do: 'talk', for: 1.2 }, { word: 'phone', who: 'kato', face: 'happy' }, { word: 'power', who: 'kato', do: 'reach', to: [1, 2.2, 0], for: 1.4 } ],
  sfx: [ { word: 'mode', sound: 'pop' } ]
}`);
  shot('V09', `{
  set: 'void',
  cast: { kato: { at: 'left', turn: 'right', face: 'determined' }, brain: { at: [.9, 1.3, 0] } },
  camera: { framing: 'medium', on: ['kato', 'brain'], side: 'front', move: 'drift' },
  focus: [ { on: 'kato' }, { word: 'brain', on: 'brain', pull: .5 } ],
  light: [ { mood: 'warm' }, { word: 'oxygen', mood: 'cold', ease: .6 } ],
  moves: [ { word: 'brain', who: 'kato', do: 'point', to: 'brain', for: 2 }, { word: 'percent', who: 'brain', do: 'grow', size: .8, for: .8 } ]
}`);
  shot('V10', `{
  set: 'yard', air: 'snow', transition: 'cut',
  cast: { boy: { at: 'center', turn: 'camera', face: 'neutral' } },
  camera: { framing: 'full', on: 'boy', side: 'front', move: 'push-in' },
  light: 'cold', music: 'calm', ambience: 'day',
  moves: [ { word: 'cool', who: 'boy', do: 'shiver', for: 1.4 } ]
}`);
  shot('V11', `{
  set: 'yard', air: 'snow',
  cast: {},
  camera: { framing: 'wide', side: 'front-right', angle: 'high', move: 'pull-out' },
  light: 'cold'
}`);
  shot('V12', `{
  set: 'yard', air: 'snow',
  cast: { boy: { at: 'door', turn: 'right', face: 'happy', reset: true }, sled: { at: [-1.4, 0, -5] } },
  camera: { framing: 'full', on: 'boy', side: 'front-left', move: 'drift' },
  light: 'cold',
  moves: [ { word: 'pulls', who: 'boy', do: 'crouch', for: 1 }, { word: 'jacket', who: 'boy', do: 'nod', for: .6 },
           { word: 'walks', who: 'boy', do: 'walk', to: 'gate', for: 2.2 }, { word: 'walks', who: 'sled', do: 'move', to: [1.9, 0, -3], for: 2.4 } ]
}`);
  shot('V13', `{
  set: 'snowfield', air: 'snow', transition: 'cut',
  cast: { sled: { at: [1, 0, -2.2], tilt: 8 } },
  camera: { framing: 'wide', side: 'front', move: 'push-in' },
  light: 'dark', music: 'tension', ambience: 'night',
  sfx: [ { word: 'gone', sound: 'sting' } ]
}`);
  shot('V14', `{
  set: 'snowfield', air: 'snow',
  cast: { mother: { at: [-4.5, 0, .2], turn: 'right', face: 'worried' }, father: { at: [-5.5, 0, -.2], turn: 'right', face: 'worried' }, tracks: { at: [-.5, 0, -.6] } },
  camera: { framing: 'full', on: ['mother', 'father'], side: 'front-right', move: 'truck-right' },
  light: 'cold',
  moves: [ { sec: 0, who: 'mother', do: 'walk', to: [-.6, 0, .2], for: 2 }, { sec: .2, who: 'father', do: 'walk', to: [-1.6, 0, -.2], for: 2 } ]
}`);
  shot('V15', `{
  set: 'snowfield', air: 'snow',
  cast: { mother: { at: [-.6, 0, .2], turn: 'right', face: 'worried' }, father: { at: [-1.6, 0, -.2], turn: 'right', face: 'worried' }, sled: { at: [1.2, 0, -2.2], tilt: 8 } },
  camera: { framing: 'full', on: ['mother', 'father', 'sled'], side: 'front-left', move: 'push-in' },
  focus: [ { on: 'mother' }, { word: 'hole', on: 'sled', pull: .6 } ],
  light: [ { mood: 'cold' }, { word: 'black', mood: 'danger', ease: .6 } ],
  moves: [ { word: 'stop', who: 'mother', do: 'react', type: 'take' }, { word: 'stop', who: 'mother', face: 'scared' }, { word: 'broken', who: 'father', face: 'scared' }, { word: 'hole', who: 'father', do: 'point', to: 'sled', for: 1.6 } ],
  sfx: [ { word: 'hole', sound: 'thud' } ]
}`);
  shot('V16', `{
  set: 'snowfield', air: 'snow',
  cast: { mother: { at: [-.6, 0, .2], turn: 'right', face: 'scared' } },
  camera: { framing: 'close', on: 'mother', side: 'front-right', move: 'push-in' },
  light: 'danger',
  moves: [ { word: 'worst', who: 'mother', do: 'cower', for: 1.4 } ],
  sfx: [ { word: 'fear', sound: 'heartbeat' } ]
}`);
  shot('V17', `{
  set: 'snowfield', transition: 'cut',
  cast: { boy: { at: [-2, 0, -1.4], turn: 'right', face: 'happy', reset: true }, ducks: { at: 'ducks', turn: 'left' } },
  camera: { framing: 'full', on: ['boy', 'ducks'], side: 'front', move: 'drift' },
  focus: [ { on: 'boy' }, { word: 'ducks', on: 'ducks', pull: .5 } ],
  light: 'flashback', music: 'flashback',
  moves: [ { word: 'believe', who: 'boy', do: 'walk', to: [1.4, 0, -2.2], for: 2.2 } ]
}`);
  shot('V18', `{
  set: 'underice', air: 'bubbles', transition: 'cut',
  cast: { diver: { at: [-3.5, .9, 0], turn: 'right', face: 'determined' }, torch: { at: [0, 0, 0] } },
  camera: { framing: 'full', on: 'diver', side: 'front', move: 'truck-right' },
  light: 'dark', music: 'tension', ambience: 'underwater',
  moves: [ { sec: 0, who: 'diver', do: 'hold', item: 'torch' }, { sec: 0, who: 'diver', do: 'move', to: [2.5, 1.1, 0], for: 2.6, arc: .3 } ],
  sfx: [ { sec: .2, sound: 'bubble' } ]
}`);
  shot('V19', `{
  set: 'snowfield', air: 'snow', transition: 'cut',
  cast: { diver: { at: [2.3, 0, -1.6], turn: 'left', face: 'sad' }, medic: { at: 'medic', turn: 'right', face: 'worried' }, 'boy-lying': { at: 'boy' } },
  camera: { framing: 'full', on: ['medic', 'boy-lying', 'diver'], side: 'front', angle: 'high', move: 'drift' },
  light: 'dark', music: 'sad', ambience: 'night',
  moves: [ { word: 'lift', who: 'boy-lying', do: 'appear' }, { word: 'breath', who: 'medic', do: 'crouch' }, { word: 'pulse', who: 'diver', do: 'shake-head', for: 1 } ],
  sfx: [ { word: 'lift', sound: 'splash' } ]
}`);
  shot('V20', `{
  set: 'snowfield', air: 'snow',
  cast: { medic: { at: 'medic', turn: 'right', face: 'determined' }, 'boy-lying': { at: 'boy' } },
  camera: { framing: 'medium', on: 'medic', side: 'front-right', move: 'handheld' },
  light: 'cold',
  moves: [ { sec: 0, who: 'medic', do: 'crouch' }, { sec: 0, who: 'medic', do: 'reach', to: [.2, .3, .4], for: 2 }, { word: 'CPR', who: 'medic', do: 'nod', for: 1.6 } ],
  sfx: [ { word: 'CPR', sound: 'heartbeat' } ]
}`);
  shot('V21', `{
  set: 'hospital', transition: 'cut',
  cast: { surgeon: { at: 'center', turn: 'camera', face: 'determined' } },
  camera: { framing: 'close', on: 'surgeon', side: 'front-left', move: 'push-in' },
  light: 'cold', music: 'tension', ambience: 'room',
  moves: [ { word: 'order', who: 'surgeon', do: 'talk', for: 1.4 }, { word: 'not', who: 'surgeon', do: 'shake-head', for: 1 } ],
  sfx: [ { word: 'warm', sound: 'sting' } ]
}`);
  shot('V22', `{
  set: 'void', transition: 'cut',
  cast: { kato: { at: 'left', turn: 'right', face: 'worried' }, brain: { at: [.9, 1.3, 0] } },
  camera: { framing: 'medium', on: ['kato', 'brain'], side: 'front-right', move: 'push-in' },
  focus: [ { on: 'brain' }, { word: 'warm', on: 'kato', pull: .5 }, { word: 'oxygen', on: 'brain', pull: .4 } ],
  light: [ { mood: 'cold' }, { word: 'oxygen', mood: 'danger', ease: .5 } ],
  moves: [ { word: 'pause', who: 'kato', do: 'point', to: 'brain', for: 1.6 }, { word: 'warm', who: 'kato', do: 'talk', for: 1.6 }, { word: 'cannot', who: 'brain', do: 'shake', for: .8 }, { word: 'cannot', who: 'kato', face: 'scared' } ]
}`);
  shot('V23', `{
  set: 'snowfield', air: 'snow', transition: 'cut',
  cast: { ambulance: { at: 'amb' }, medic: { at: 'medic', turn: 'right', face: 'determined' }, 'boy-lying': { at: 'boy' } },
  camera: { framing: 'wide', side: 'front-right', move: 'pull-out' },
  light: 'cold', music: 'tension', ambience: 'night',
  moves: [ { sec: 0, who: 'medic', do: 'crouch' }, { sec: 0, who: 'medic', do: 'reach', to: [.2, .3, .4], for: 6 }, { word: 'pressing', who: 'medic', do: 'nod', for: 3 } ],
  sfx: [ { word: 'chest', sound: 'heartbeat' } ]
}`);
  shot('V24', `{
  set: 'hospital', transition: 'cut',
  cast: { doctor: { at: [-2.4, 0, .3], turn: 'right', face: 'determined' }, surgeon: { at: [2.4, 0, .3], turn: 'left', face: 'determined' }, bed: { at: [6, 0, -1.2] }, 'boy-lying': { at: [6, .67, -1.18] } },
  camera: { framing: 'wide', side: 'front', move: 'push-in' },
  light: 'cold', music: 'tension', ambience: 'room',
  moves: [ { sec: 0, who: 'bed', do: 'move', to: 'bed', for: 1.8 }, { sec: 0, who: 'boy-lying', do: 'move', to: [-.4, .67, -1.18], for: 1.8 }, { word: 'team', who: 'doctor', do: 'look', to: 'bed' }, { word: 'team', who: 'surgeon', do: 'look', to: 'bed' } ],
  sfx: [ { sec: 0, sound: 'scrape' } ]
}`);
  shot('V25', `{
  set: 'hospital',
  cast: { bed: { at: 'bed' }, 'boy-lying': { at: [-.4, .67, -1.18] }, ecmo: { at: 'ecmo' }, surgeon: { at: [1.1, 0, .3], turn: 'right', face: 'determined' } },
  camera: { framing: 'full', on: ['bed', 'ecmo'], side: 'front-left', move: 'drift' },
  focus: [ { on: 'bed' }, { word: 'machine', on: 'ecmo', pull: .6 } ],
  light: 'cold',
  moves: [ { word: 'ECMO', who: 'surgeon', do: 'point', to: 'ecmo', for: 1.6 } ],
  sfx: [ { word: 'heart', sound: 'tick' } ]
}`);
  shot('V26', `{
  set: 'hospital',
  cast: { ecmo: { at: 'ecmo' } },
  camera: { framing: 'medium', on: 'ecmo', side: 'front-right', move: 'push-in' },
  light: [ { mood: 'cold' }, { word: 'warms', mood: 'warm', ease: 1 } ]
}`);
  shot('V27', `{
  set: 'hospital', transition: 'cut',
  cast: { monitor: { at: 'monitor' }, beat: { at: [-2.3, 1.82, -1.55] } },
  camera: { framing: 'full', on: 'monitor', side: 'front', move: 'push-in' },
  light: [ { mood: 'dark' }, { word: 'flicker', mood: 'hope', ease: .8 } ],
  music: 'hope',
  moves: [ { word: 'flicker', who: 'beat', do: 'appear' } ],
  sfx: [ { word: 'flicker', sound: 'bell' } ]
}`);
  shot('V28', `{
  set: 'hospital',
  cast: { monitor: { at: 'monitor' }, beat: { at: [-2.3, 1.82, -1.55] }, doctor: { at: [-.6, 0, -.6], turn: 'left', face: 'surprised' } },
  camera: { framing: 'full', on: ['monitor', 'doctor'], side: 'front-right', move: 'drift' },
  focus: [ { on: 'monitor' }, { word: 'rhythm', on: 'doctor', pull: .5 } ],
  light: 'hope',
  moves: [ { word: 'rhythm', who: 'doctor', face: 'happy' }, { word: 'catch', who: 'doctor', do: 'cheer', for: 1 } ],
  sfx: [ { word: 'rhythm', sound: 'heartbeat' } ]
}`);
  shot('V29', `{
  set: 'hospital', transition: 'cut',
  cast: { bed: { at: 'bed' }, 'boy-gown': { at: [-1.25, 0, -1.15], turn: 'right', face: 'sleepy' }, blanket: { at: [-.15, .64, -1.1] }, mother: { at: [1.7, 0, -.5], turn: 'left', face: 'worried' } },
  camera: { framing: 'full', on: ['boy-gown', 'mother'], side: 'front', move: 'push-in' },
  focus: [ { on: 'boy-gown' }, { word: 'mother', on: 'mother', pull: .6 } ],
  light: [ { mood: 'normal' }, { word: 'opens', mood: 'warm', ease: 1 } ],
  music: 'hope',
  moves: [ { sec: 0, who: 'boy-gown', do: 'sit', seat: .67 }, { word: 'opens', who: 'boy-gown', face: 'surprised' }, { word: 'turns', who: 'boy-gown', do: 'look', to: 'mother' },
           { word: 'voice', who: 'mother', do: 'talk', for: 1.2 }, { word: 'voice', who: 'mother', face: 'happy' }, { word: 'voice', who: 'boy-gown', face: 'happy' } ]
}`);
  shot('V30', `{
  set: 'void', transition: 'cut',
  cast: { kato: { at: 'center', turn: 'right', face: 'thinking' }, thermometer: { at: [0, 0, 0] } },
  camera: { framing: 'medium', on: 'kato', side: 'front-left', move: 'drift' },
  light: 'normal', music: 'calm',
  moves: [ { sec: 0, who: 'kato', do: 'hold', item: 'thermometer' }, { word: 'skin', who: 'kato', do: 'talk', for: 1.2 }, { word: 'core', who: 'kato', do: 'shake-head', for: 1 }, { word: 'heal', who: 'kato', face: 'determined' } ]
}`);
  shot('V31', `{
  set: 'hospital', shafts: true, transition: 'cut',
  cast: { bed: { at: 'bed' }, 'boy-gown': { at: [-1.25, 0, -1.15], turn: 'right', face: 'sleepy' }, blanket: { at: [-.15, .64, -1.1] }, ecmo: { at: 'ecmo' }, doctor: { at: [-2.6, 0, .2], turn: 'right', face: 'happy' }, surgeon: { at: [2.8, 0, .2], turn: 'left', face: 'happy' } },
  camera: { framing: 'wide', side: 'front', move: 'pull-out' },
  light: 'hope', music: 'hope',
  moves: [ { sec: 0, who: 'boy-gown', do: 'sit', seat: .67 }, { word: 'team', who: 'doctor', do: 'nod', for: .8 }, { word: 'machine', who: 'surgeon', do: 'nod', for: .8 } ]
}`);
  shot('V32', `{
  set: 'hospital', transition: 'cut',
  cast: { 'boy-gown': { at: [-3, 0, 0], turn: 'right', face: 'determined' }, doctor: { at: [-3.9, 0, -.4], turn: 'right', face: 'happy' }, mother: { at: [2.6, 0, -.3], turn: 'left', face: 'happy' } },
  camera: { framing: 'full', on: 'boy-gown', side: 'front-right', move: 'truck-right' },
  light: 'warm', music: 'hope',
  moves: [ { sec: 0, who: 'boy-gown', do: 'sneak', to: [.8, 0, 0], for: 5 }, { sec: .3, who: 'doctor', do: 'walk', to: [-.2, 0, -.4], for: 5 }, { word: 'relearning', who: 'mother', do: 'wave', for: 1.4 } ]
}`);
  shot('V33', `{
  set: 'park', air: 'dust', transition: 'cut',
  cast: { tricycle: { at: 'start' }, boy: { at: [-4.1, 0, .32], turn: 'right', face: 'laugh', reset: true }, mother: { at: [3.4, 0, -.4], turn: 'left', face: 'happy' }, father: { at: [4.4, 0, -.6], turn: 'left', face: 'happy' } },
  camera: { framing: 'full', on: 'boy', side: 'front', move: 'truck-right' },
  light: 'warm', music: 'hope', ambience: 'day',
  moves: [ { sec: 0, who: 'boy', do: 'sit', seat: .62 }, { word: 'riding', who: 'tricycle', do: 'move', to: [1.2, 0, .3], for: 2.6 }, { word: 'riding', who: 'boy', do: 'move', to: [1.1, 0, .32], for: 2.6 },
           { word: 'stronger', who: 'mother', do: 'cheer', for: 1.2 }, { word: 'stronger', who: 'father', do: 'wave', for: 1.2 } ],
  sfx: [ { word: 'standing', sound: 'tada' } ]
}`);
  shot('V34', `{
  set: 'void', transition: 'cut',
  cast: { kato: { at: 'center', turn: 'camera', face: 'surprised' } },
  camera: { framing: 'medium', on: 'kato', side: 'front', compose: 'center', move: 'push-in' },
  light: 'normal', music: 'calm',
  moves: [ { word: 'longest', who: 'kato', do: 'talk', for: 1.6 }, { word: 'minutes', who: 'kato', do: 'point', to: [2, 2.5, 1], for: 1.2 } ]
}`);
  shot('V35', `{
  set: 'hospital', transition: 'cut',
  cast: { doctor: { at: 'center', turn: 'camera', face: 'thinking' } },
  camera: { framing: 'close', on: 'doctor', side: 'front-right', move: 'push-in' },
  light: 'warm',
  moves: [ { word: 'saying', who: 'doctor', do: 'talk', for: 2 }, { word: 'warm', who: 'doctor', face: 'happy' }, { word: 'dead', nth: 2, who: 'doctor', do: 'nod', for: .8 } ]
}`);
  shot('V36', `{
  set: 'park', air: 'dust', shafts: true, transition: 'cut',
  cast: { boy: { at: [-.5, 0, .4], turn: 'right', face: 'happy', reset: true }, mother: { at: [-1.4, 0, .2], turn: 'right', face: 'happy' }, father: { at: [-2.3, 0, .1], turn: 'right', face: 'happy' } },
  camera: { framing: 'wide', side: 'front-left', angle: 'high', move: 'pull-out' },
  light: 'hope', music: 'hope',
  moves: [ { sec: .3, who: 'boy', do: 'walk', to: 'far', for: 5 }, { sec: .5, who: 'mother', do: 'walk', to: [3.2, 0, -4.8], for: 5 }, { sec: .7, who: 'father', do: 'walk', to: [2.4, 0, -4.6], for: 5 } ]
}`);

  window.ICE_SHOTS = S;
  window.ICE_CUTS = [['V01', 0, 0], ['V02', 1, 2], ['V03', 3, 3], ['V04', 4, 5], ['V05', 6, 7], ['V06', 8, 9], ['V07', 10, 10], ['V08', 11, 12], ['V09', 13, 14],
    ['V10', 15, 15], ['V11', 16, 17], ['V12', 18, 19], ['V13', 20, 20], ['V14', 21, 21], ['V15', 22, 22], ['V16', 23, 23], ['V17', 24, 24], ['V18', 25, 25],
    ['V19', 26, 27], ['V20', 28, 28], ['V21', 29, 30], ['V22', 31, 33], ['V23', 34, 35], ['V24', 36, 36], ['V25', 37, 39], ['V26', 40, 40], ['V27', 41, 41],
    ['V28', 42, 42], ['V29', 43, 44], ['V30', 45, 46], ['V31', 47, 48], ['V32', 49, 51], ['V33', 52, 53], ['V34', 54, 54], ['V35', 55, 56], ['V36', 57, 58]];
})();
