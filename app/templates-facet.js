/* TEMPLATES for the Facet style (default) — the same ticket system, Facet look + Facet tools.
   Loaded after templates.js; registers TPL.styles.facet. */
(function () {
  var TP = window.TPL;

  var STYLE = `## THE LOOK — "Facet" (low-poly paper figurines, filmed like a movie)
- Everything is flat 2D, but every shape is cut into a FEW BIG facets lit from the top-left, so it reads like a folded-paper figurine.
  You never draw triangles: you give an outline, a colour and a RIDGE (the shape's spine, about 1/3 in from the left); the kit cuts and lights it.
- No outlines ever. Parts are separated by value and colour only. Matte paper grain is added by the kit.
- Exaggeration is the style: huge head (1/3.5 of the body), no neck, wide barrel body with sloped round shoulders, short thick legs,
  long arms with big mitten hands, slab feet, round disc ears, almost no face detail (slit eyes or opaque glasses, wedge nose, one lip shape).
  People are made ONLY with F.person — never by hand — so every character has the same proportions.
- Animals and objects get the same treatment by hand: one oversized feature, a big simple mass, short legs, almost no detail.
  Vehicles are short and fat with huge wheels; furniture is chunky.
- Colour: each PLACE is one colour world (the set's bg): night blue, deep water blue, hospital teal, burnt orange, mustard...
  Clothing is muted and earthy; ONE saturated accent per shot marks the most important thing.
- Shorts are vertical 1080 × 1920. Long videos may be 1920 × 1080.
- Casting: people are white by default (skin pale #ece3d6 or warm #d9b49a); other skin tones only when the story is about that group or a real person looks that way.
- NEVER: blur, glow, sparks, gradients, strokes or filters inside an asset. Depth and focus are added by the camera.

## SCALE (assets from different chats must fit together)
- 1 unit = 230 px. An adult is 2.6 units (600 px tall in the frame). A child 1.8 units. size = HEIGHT in units.
- Typical: thermometer 0.45 · phone 0.3 · clipboard 0.65 · chair 1.0 · table 1.1 · door 3.2 · car 2.3 tall · ambulance 3.2 tall · dog 1.0 · tree 6–9.
- Sets are the whole 1080 × 1920 frame: the ground line is usually at y 1400–1560; people stand on it.

## PALETTE
skin: pale #ece3d6 · warm #d9b49a · tan #b98a68 · brown #8a5a40 · deep #5e3a2a
hair: brown #7a4231 · dark brown #6e3a2b · black #2e2220 · blonde #c9a25e · grey #9a948c
cloth: cream #d3ccbd · taupe #6c6052 · olive #4e5242 · charcoal #3e3f42 · navy #3c4660 · sand #b9a78a · teal #3f6f73
leather #5a3124 · accent (ONE per shot): orange #cc5321 · rust #b0482a · mustard #d39a2c
worlds (set bg): burnt orange #c0612c · night #4b6782 · deep water #22384b · hospital teal #3a6e64 · mustard #c79a3c · dusty blue #5e7f9e
F.shade(colour, t): lighter (t > 0) or darker (t < 0), range −0.35 … +0.15. Never pure black or white.

## THE TWO MASCOTS (channel hosts — already exist, never rebuild)
- kato (male): teal top, sand trousers, brown hair. nia (female): rose top, navy skirt, long blonde hair.`;

  var TOOLS = `## FILE FORMAT (exact) — one KIT.asset per asset, the function RETURNS a description
\`\`\`js
KIT.asset('asset-name', function (F) {
  // ... helper functions / colours may go here ...
  return { kind: 'prop', size: 0.6, origin: [540, 880], top: 380, draw: function (F) { F.begin({ width: 1080, height: 1080, seed: 4 }); /* F calls */ return F.render('what it is'); } };
});
\`\`\`
- ALL code goes INSIDE KIT.asset(...). No document, window, Math.random, images, filters, blur, glow or strokes.

## WHAT TO RETURN (by kind)
- character: { kind: 'character', size: 2.6, person: { ...F.person spec without x/ground/height } }
  person spec: build: 'adult' | 'woman' | 'child', skin, eyes: 'slits' | 'dots', lips,
    hair: { style: 'cap' | 'long' | 'tuft' | 'bald', colour }, beard: colour | null, glasses: frameColour | null,
    top, vest: colour | null (a vest, coat panels or a lab coat), tie: colour | null, sleeve: colour,
    bottom: { type: 'trousers' | 'skirt', colour }, legs (skin/socks under a skirt), shoes,
    stretch: 1 (1.3 tall, 0.8 short), wide: 1 (1.3 heavy, 0.85 thin)
  Real people: match their real skin tone, hair, facial hair, glasses and clothes/uniform so viewers recognise them.
- prop / creature / fx: { kind, size (height in units), origin: [x, y] (the point it stands on, bottom centre, in its own drawing),
    top: y (its highest point), grip: [x, y] (only if a hand holds it), draw: function (F) { F.begin({ width: 1080, height: 1080, seed }); ...; return F.render('...') } }
- set: { kind: 'set', bg: worldColour, grade: { far: [colour, amount] },
    far: function (F, W, H) {...},     // distant things: hills, trees, a window — the camera moves them slowly
    set: function (F, W, H) {...},     // the ground the cast stands on, walls, things at the cast's distance
    front: function (F, W, H) {...},   // 2–3 DARK flat silhouettes at the frame EDGES very close to the camera (snow bank, reeds, curtain edge, pole)
    spots: { name: [x, groundY], ... } }   // where things stand, in pixels of the 1080 × 1920 frame
  Each layer function draws the WHOLE frame: F.begin({ width: W, height: H, bg, seed }); ...; return F.render('...').
  Draw ground and backgrounds bigger than the frame (x from -400 to 1480, y down to 2700) so camera moves never show an edge.
  grade (aerial perspective): night ['#24344a', .4] · under water ['#0f1e2c', .35] · indoors a darker wall colour at .25–.3 · fog/day a lighter colour.

## DRAWING TOOLS (pixels; x right, y down)
| Tool | Use |
|---|---|
| F.begin({ width, height, bg, seed }) | Start a drawing (props: 1080 × 1080; set layers: W × H). |
| F.part(points, colour, { ridge, contrast, step, extra }) | THE main call: one faceted, lit shape. 4–12 outline points. |
| F.flat(points, colour, opacity) | Small solid detail: screen, button, window glass, lens, eye slit, a see-through tint. |
| F.occlusion(points, opacity, blur) | ONLY for soft contact shadow where one part tucks under another (people do this by themselves). |
| F.groundShadow(cx, y, width) | Soft floor shadow (props that stand on the floor). |
| F.person(spec) | (characters only — inside a set never) |
| F.tube(a, b, widthA, widthB) · F.disc(cx, cy, rx, ry, n) | Point lists for limbs/branches and round things. |
| F.text(x, y, '7.0°C', size, colour) | Flat text on a screen or sign. |
| F.shade(colour, t) | Lighter/darker colour. |
| F.render('what it shows') | Always last: return F.render('...'). |
F.part options: ridge = spine points, LEFT of centre (1 point = dome, 2–3 points = long part) · contrast: skin/pale 0.14–0.2, cloth 0.22–0.3, dark hair 0.24–0.35 ·
step = facet size: big parts 80–110 (sets 200–320), heads 34–45, small parts 20–30 · extra = crease points inside.
Drawing order: back to front (things behind first). Big simple masses; at least one exaggerated feature; one accent colour.`;

  var EXAMPLE = `\`\`\`js
// CHARACTER — only a description; the kit draws the person in the house proportions
KIT.asset('medic', function (F) {
  return { kind: 'character', size: 2.6, person: { build: 'adult', skin: '#e2cbb6', hair: { style: 'cap', colour: '#2e2220' },
    top: '#3c4660', vest: '#2f3850', bottom: { type: 'trousers', colour: '#2e3340' }, shoes: '#2e2622' } };
});

// PROP — held in a hand, so it has a grip
KIT.asset('thermometer', function (F) {
  return { kind: 'prop', size: 0.44, origin: [540, 880], top: 380, grip: [420, 860], draw: function (F) {
    F.begin({ width: 1080, height: 1080, seed: 21 });
    F.part([[360, 600], [470, 600], [500, 860], [400, 880], [350, 640]], '#3e3f42', { ridge: [[385, 610], [400, 870]], contrast: .24, step: 60 });
    F.part([[200, 380], [820, 380], [860, 430], [860, 620], [820, 660], [200, 660], [170, 620], [170, 420]], '#d3ccbd', { ridge: [[260, 390], [250, 650]], contrast: .2, step: 120 });
    F.flat([[230, 420], [640, 420], [640, 620], [230, 620]], '#2b3b3a');
    F.text(435, 562, '7.0°C', 132, '#cfe6d2');
    F.flat([[680, 450], [790, 450], [790, 520], [680, 520]], '#cc5321');
    return F.render('infrared thermometer');
  } };
});

// FX — a small repeating detail (the shot makes it loop with cycle)
KIT.asset('breath', function (F) {
  return { kind: 'fx', size: 0.05, origin: [440, 540], top: 450, draw: function (F) {
    F.begin({ width: 1080, height: 1080, seed: 40 });
    F.flat(F.disc(540, 540, 90, 60, 9), '#eef2f3', .7); F.flat(F.disc(620, 510, 70, 50, 8), '#eef2f3', .6);
    return F.render('breath');
  } };
});

// SET — three layers + spots + grade
KIT.asset('pond', function (F) {
  var NIGHT = '#4b6782', SNOW = '#dfe4e3', BARK = '#5b4a42', ICE = '#b9cad3', FG = '#26344a';
  function far(F, W, H) {
    F.begin({ width: W, height: H, bg: NIGHT, seed: 30 });
    F.part([[-400, 1300], [-400, 1120], [180, 1080], [700, 1060], [1480, 1070], [1480, 1300]], SNOW, { ridge: [[200, 1090], [700, 1070]], contrast: .14, step: 200 });
    [[120, 1110, 330], [880, 1090, 360]].forEach(function (t) { var x = t[0], y = t[1], h = t[2];
      F.part([[x - 10, y], [x + 10, y], [x + 4, y - h], [x - 4, y - h]], BARK, { contrast: .2, step: 120 });
      F.part(F.tube([x, y - h * .5], [x - h * .3, y - h * .82], 12, 6), BARK, { contrast: .2, step: 60 }); });
    return F.render('far bank');
  }
  function ground(F, W, H) {
    F.begin({ width: W, height: H, bg: NIGHT, seed: 31 });
    F.part([[-400, 2700], [-400, 1250], [700, 1250], [1480, 1240], [1480, 2700]], ICE, { ridge: [[200, 1260], [160, 1900]], contrast: .16, step: 260 });
    F.flat([[722, 1350], [805, 1325], [920, 1336], [975, 1362], [940, 1390], [830, 1400], [735, 1385]], '#1d2a36');   // the hole
    return F.render('frozen pond');
  }
  function front(F, W, H) {
    F.begin({ width: W, height: H, bg: NIGHT, seed: 34 });
    F.flat([[-400, 2700], [-400, 1760], [-120, 1720], [120, 1760], [260, 1840], [320, 2700]], FG);
    F.flat([[1120, 1810], [1134, 1810], [1180, 1390], [1166, 1390]], FG);
    return F.render('near snow and reeds');
  }
  return { kind: 'set', bg: NIGHT, grade: { far: ['#24344a', .4] }, far: far, set: ground, front: front,
    spots: { left: [390, 1500], center: [540, 1500], right: [760, 1500], hole: [850, 1370] } };
});
\`\`\``;

  var SHOTRULES = `## HOW A SHOT IS WRITTEN (a form — no animation code)
\`\`\`js
SHOT('M01', {
  set: 'pond',                       // one set from the asset list
  handheld: 3,                       // a slow slight drift (2–3) so the camera is never frozen
  camera: [                          // keyframes; the first one is the start
    { at: 0, zoom: 3.0, on: 'thermometer' },              // on: a cast name or [x, y] in the frame
    { word: 'That', for: 4.0, zoom: 1.3, on: [570, 1340] },  // starts on a spoken word, eases over 'for' seconds
    { word: 'He', for: 2.0, zoom: 'close', on: 'boy' }
  ],
  focus: [                           // subtle depth of field, in pixels: far 1–4, set 0–2.5, front 1.5–3, cast 0 (never blur the subject)
    { at: 0, far: 5, set: 3, cast: 0, front: 2.5 },
    { word: 'That', for: 3, far: 1.2, set: 0, front: 1.5 }
  ],
  cast: {                            // everything visible: name: { at: spot name or [x, groundY], ... }
    boy: { at: 'boy', view: 'side', lying: 'right' },
    medic: { at: 'left', view: 'side', pose: 'kneel', arms: { R: [70, 8] }, head: { tilt: 6 }, idle: { lean: 1.5 },
             hold: { R: { item: 'thermometer', to: 6.6 }, L: { item: 'thermometer', from: 6.6 } } },
    breath: { at: [482, 1200], cycle: { period: 2.6, grow: [.4, 1.6], fade: [.8, 0], dx: 46, dy: -40 } },
    ambulance: { at: 'bank', layer: 'far' }
  },
  moves: [                           // who does what, on a word (or at: seconds from the shot start)
    { word: 'cold', who: 'medic', do: 'reach', for: 1.5, arm: 'R', deg: 42, bend: 22 },
    { word: 'ice', who: 'medic', do: 'sad', for: 0.8 }
  ]
});
\`\`\`
### CAST OPTIONS
- People: view: 'front' | 'side' (side view faces right; face: -1 faces left) · pose: 'stand' | 'kneel' | 'sit' | 'chair' ·
  lying: true (on the back, head left) | 'right' (head right) — lying people always face UP ·
  arms: { L: [upperDeg, foreDeg], R: [...] } (front view: 0 hangs, + out, − across the body; side view: + forward, 90 = straight out) ·
  head: { tilt, turn (−1..1, front view), nod } · lean · stride (legs) · idle: { lean: 1.5 } (shifting weight) · size (override, units) ·
  hold: { R: 'item' } or { R: { item, from, to } } (the item must be a holdable prop) · silhouette: '#132131' (one flat dark shape) · shadow: false
  Arm poses (front): hang [7, 2] · hands on hips [35, −110] · hold in front [−5, −90] · wave [150, 30]. (side): reach forward [80, 0] · reach down [42, 22].
- Things: size, flip, rot, opacity, layer: 'far' (moves with the distance), plane: 'back' (furniture behind the action: shares the background focus),
  cycle: { period, phase, grow: [a, b], fade: [a, b], dx, dy, fall: true } (breath puffs, drips, bubbles) · blink: { period, on, phase } (warning lights)
- z: draw order (bigger = in front). Default: by ground y.
### MOVES (do:)
walk { to: spot | x } · hop · bounce · wave { arm } · cheer · point { arm } · hips · hold (hands in front) · shrug · sad · shake (head "no") · nod ·
look { dir: 'L' | 'R' } · tilt { deg } · lean { deg } · shiver · kneel · sit · chair · reach { arm, deg, bend } · arms { L, R } · legs { L, R } ·
drift { dx, dy, rot } (slow float/sink over 'for' seconds). Every pose change winds up, overshoots a little and settles by itself.
camera zoom words: wide 1 · full 1.25 · medium 1.6 · close 2.2 · detail 3 (or any number).

### FILM RULES (follow all)
- ONE PLACE = ONE SHOT: inside a place, move the camera (open close, pull out, glide in) instead of cutting. A 20 s piece has 2–4 places.
- Open on what the narration names first (the narrator says "7 degrees" → open on the thermometer screen).
- Every camera move has a reason (follow the action, reveal the place, come closer for a feeling). Leave look-room in front of faces.
- Acting matches the words (on the word): a check on "pulse", head drops after bad news, a shake on "not", a nod on "yes", look at whoever is talked about.
- Only one person acts at a time; the others stay almost still.
- Things too dark or too hard to show literally (a child under water, a fall, an accident) → a dark partial silhouette against a light, moving out of frame.
- Add at least 2 small logical details per place: breath in the cold, drips from wet things, a blinking light, a vehicle far away, a monitor line, window light.
- Match cuts: put a bright or strong shape where the last shot's one was on screen (a hole of light → a lamp).
- Focus: soft background behind close-ups, slightly soft near silhouettes, rack focus when attention moves (cast: 1.5 on the one we leave). Never blur the subject, faces that speak or the thing named.
- NEVER: glow, sparks, haze, title cards, newspaper/headline shots, text on screen except real objects (a screen, a sign).`;

  var ASSETCHECK = `- [ ] Each one starts with KIT.asset('<exact name above>', function (F) { and RETURNS the description for its kind.
- [ ] Characters: only { kind: 'character', size, person: {...} } — no drawing by hand.
- [ ] Props / fx / creatures: size, origin, top, (grip if held) and draw(F) ending with return F.render('...').
- [ ] Sets: bg, grade, far / set / front layer functions (F, W, H) that draw the whole frame, and EVERY spot listed.
- [ ] Every F.part bigger than a hand has a ridge left of centre; big simple masses; one exaggerated feature; one accent colour.
- [ ] No blur, glow, filters, strokes, gradients, Math.random, document or window. Complete code, no "...".`;

  var SHOTCHECK = `- [ ] One SHOT('<id>', {...}) per shot above, with the exact ids.
- [ ] set and every cast name come from ASSETS. Every 'at' / 'to' spot exists in that set (or is [x, groundY]).
- [ ] Every word: '...' is spoken in THAT shot (see its words list).
- [ ] The camera opens on what the narration names; every move has a reason; handheld 2–3.
- [ ] Acting lands on the right words; only one person acts at a time.
- [ ] At least 2 small details; focus never on blur of the subject; no glow, sparks or title cards.`;

  var PLANNOTES = `   - Facet style: a person is just a description (cheap). Sets have 3 layers and are the most work.
   - difficulty: 1 = simple (a person, a small prop, a puff of breath, a light), 2 = medium (a vehicle, a machine, a bed, an animal), 3 = hard (a set, a complex creature or machine).
   - Plan the small logical details as fx assets too (breath, drips, bubbles, a blinking light, a far vehicle).
   - moves: leave empty — the Facet kit already has every move (walk, kneel, sit, reach, look, nod, shake, sad, wave, hold, drift...).
   - "keys" (top level): the key words for the captions — numbers, names and the facts that matter (e.g. ["7", "degrees", "pulse", "hours", "record"]).
   - Shots: one place = one shot (cover several lines; move the camera inside it). Only cut when the place or time changes.`;

  TP.styles.facet = { STYLE: STYLE, TOOLS: TOOLS, EXAMPLE: EXAMPLE, SHOTRULES: SHOTRULES, NAME: 'Facet (low-poly paper figurines, 2D)', TITLE: 'low-poly papercraft figurine animation',
    ASSETCHECK: ASSETCHECK, SHOTCHECK: SHOTCHECK, PLANNOTES: PLANNOTES, ASSETOPEN: "KIT.asset('<exact name above>', function (F) {" };
  TP.styleList = [{ id: 'facet', name: 'Facet', note: 'Low-poly paper figurines, cinematic camera, depth and focus. Recommended.' }].concat(TP.styleList || []);
})();
