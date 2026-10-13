/* TEMPLATES for the Low-Poly style — the same ticket system, different look + kit tools.
   Loaded after templates.js; registers TPL.styles.lowpoly. */
(function () {
  var TP = window.TPL, PAPER = TP.styles.paper;

  var STYLE = `## THE LOOK — "Low-Poly Paper" (the kit does the look; you respect it)
- Flat, faceted papercraft: every shape is cut into flat triangles, each shaded by ONE light from the top-left. No outlines, ever. Warm, soft, hand-made.
- The world is 2.5D: every asset is a painted cut-out; the director moves a real camera through them (depth of field blur, parallax, fog, film grain, light, silhouettes). You only paint the pictures.
- Characters are friendly and simple: calm colours, real proportions, a face that can show emotion. Bright colour lives only in lights and glows.
- Colours are MUTED and warm-natural (see PALETTE). Shade variation comes from the facets — do not add gradients, outlines or textures by hand.
- Shorts are vertical 9:16 (long videos may be 16:9). Sets need vertical interest (tall trees, sky, shelves) AND some width. Props must read clearly from their silhouette.

## SCALE (very important — assets from different chats must fit together)
- Units: the mascots are 2.6 units tall. A real adult (1.7 m) = 2.6 units, so 1 real metre is about 1.5 units.
- Reference sizes (height): kato 2.66 · nia 2.64 · K.person default 2.66 (height: 2.0 for a child … 3.0 for a giant)
- Typical things: door 3.4 · chair seat 0.75 · table 1.2 · cup 0.25 · phone 0.25 · car 2.3 tall / 6.5 long · tree 6–10 · house 7–10 · rat 0.35 · dog 1.0 · horse 2.6
- A prop's "size" is its HEIGHT in those units. The drawing can be any pixel size: the kit scales it. A set's "width" is in units (12–26).
- Keep proportions true: a cup is 1/10 of a person. If an asset is more than twice too big or small, the app rescales it to the plan's size.

## PALETTE (muted, warm — pick from these or stay close)
background #ab9c87 · shadow #5d5144
K.PAL.skin: deep #6f4130, brown #8f5638, warm #a8694a, tan #c58a63, light #e2b597  (or K.SKIN[0..8])
K.PAL.hair: black #231713, darkBrown #2a1d18, brown #6b4630, blonde #d8b66a, grey #8f8a84  (or K.HAIR[0..7])
K.PAL.cloth: teal #3f6f73, navy #34466b, denim #6f8fbf, sky #a9bfe0, mustard #c99a3e, rust #b7714f, terracotta #b0603e, plum #7b5b78, sage #7f9878, olive #6f7a4a, rose #c98a86, cream #ede3d1, sand #c8b48e, charcoal #3b3d42, white #efe9de
other: K.PAL.wood #8a5a3a · metal #9aa1a6 · gold #d9a94a · leaf #5f7d4e · pot #b56a48 · stone #8d8a83
glows (lights, fire, magic, screens only): '#ffd28a' warm, '#9fd6ff' cool, '#fff0b8' pale
Never pure black or pure white; keep lightness mostly between 20% and 85%. K.shade(hex, -0.2) darker/cooler, K.shade(hex, 0.2) lighter/warmer, K.mix(hexA, hexB, 0.5).

## THE TWO MASCOTS (channel hosts — never rebuild them by hand)
- kato (male): teal overshirt over a cream tee, sand trousers, white shoes, brown curls.
- nia (female): rose cardigan over a cream top, navy skirt, long blonde hair.
They already exist. Do NOT make them unless a ticket asks for a costume version (then K.person({ ... }) with other colours, or start from K.mascot('kato', { top: ... })).`;

  var TOOLS = `## FILE FORMAT (exact)
\`\`\`js
KIT.asset('asset-name', function (K, opts) {
  // 1. draw with the kit tools   2. return a person, prop, creature, fx or set
  K.begin({ width: 600, height: 700, bg: 'none', grain: false, seed: 3 });
  K.part([[...],[...],...], '#b56a48', { material: 'hard' });
  return K.prop(K.render('a clay pot'), { size: 0.5 });
});
\`\`\`
- No import/export, no images, no files, no Math.random() (use K.rnd()), no document, no window, no THREE.
- Never touch the renderer, camera, KIT.init, KIT.start, requestAnimationFrame, shots, lights, or sound.
- ALL code goes INSIDE the KIT.asset(...) call. Nothing outside it. You may call K.begin / K.render several times (one per layer or per part).

## DRAWING TOOLS (pixel coordinates; x right, y DOWN; (0,0) top-left of the picture)
| Tool | Use |
|---|---|
| K.begin({ width, height, bg: 'none', grain: false, seed }) | Start a picture. ALWAYS bg:'none' and grain:false for assets. Any size; ~600–1500 px is typical. |
| K.part(points, colour, { material, dir, smooth, folds, light, round, step }) | THE main call: one shape cut into shaded triangles. points = [[x,y],...] outline (clockwise or not). |
| K.flat(points, colour, opacity) | One flat shape (small details, glass, glow panes). |
| K.line([[x,y],...], colour, width, opacity) | Open stroke: seams, strings, mouths, whiskers. Use sparingly. |
| K.circle(x, y, r, colour, opacity) · K.ring(x, y, r, colour, width) | Buttons, eyes, wheels, hoops. |
| K.shadow(x, y, width) | Soft ground shadow. NOT needed: the kit adds a contact shadow under everything. |
| K.group('rotate(10 500 600)', function () {...}) | Draw inside an SVG-style transform (rotate / translate / scale). |
| K.smooth(points) · K.blob(cx, cy, r, sides) · K.rect(x,y,w,h) · K.ellipse(cx,cy,rx,ry,n) | Shape helpers returning point lists (rocks, leaves, clouds). |
| K.rnd() | Seeded random 0..1. |
| K.render('what it shows') | Finish and return the drawing. Call it LAST. |
Materials (option material:): cloth, drape (long skirts/curtains), knit, skin, hair, shoe, hard (wood, metal, stone: big facets), leaf (plants), detail (tiny pieces).
Options: dir = fold angle in degrees (90 = vertical folds) · smooth: true rounds the outline · folds: [[x,y],...] extra triangle points · light: contrast (0.5 flat … 1.6 strong).
Paint far-to-near: back shapes first. Give big shapes 6–12 outline points so the silhouette reads.

### People — ALWAYS use these. Never draw a person by hand.
\`\`\`js
return K.mascot('kato');          // or 'nia' — mascots, only for costume versions: K.mascot('nia', { top: '#3f6f73' })
return K.person({ gender: 'm' | 'f', skin: K.PAL.skin.tan, hair: 'curls', hairColor: K.PAL.hair.black,
  top: K.PAL.cloth.mustard, inner: K.PAL.cloth.cream, outer: 'open' | 'closed', sleeves: 'long' | 'short',
  bottom: 'pants' | 'skirt', pants: K.PAL.cloth.charcoal, shoes: '#efe9de', glasses: '#3b3d42', beard: ..., height: 2.66 });
\`\`\`
- gender 'm' | 'f'. skin / hairColor: a '#hex' or a number (K.SKIN 0–8, K.HAIR 0–7).
- hair: curls, short, afro, bald, braids, long, bob, bun, ponytail. top = colour of the shirt/cardigan/jacket; inner = the tee/blouse under it.
- The person already has: a live face (12 emotions), blinking, walking, waving, pointing, talking, sitting, holding things. The director animates them — you do NOT animate people.
- Extras (hats, helmets, backpacks, tools, uniforms): draw them as a drawing and attach with a.attach('head' | 'torso' | 'handF' | 'handB', drawing, { x, y, size, z: 'front' | 'back' }) — size = height of the drawing in units (a hat is about 0.3–0.5, a backpack 1.0). x/y = small offsets in UNITS (x right, y down). 'head': the drawing's bottom-centre sits on the top of the head; the others are centred on the torso or on the hand. Then return the person.
- A one-video person must look clearly different from both mascots (colours, hair, build).
- REAL PEOPLE (true stories): match how the person really looks — skin tone, hair colour and style, glasses, beard, typical clothes or uniform, age (grey hair). Keep it respectful and simple.

### Props, plants, animals (one picture)
\`\`\`js
K.prop(drawing, { size: 0.8, anchor: [x, y], grip: [x, y], shadow: false, sway: 3, bob: .1, pulse: .05, spin: 1, flicker: true, rise: .3 })
\`\`\`
- size = HEIGHT in units. anchor = picture point that stands on the ground (default: bottom centre). grip = picture point a hand holds (needed if the plan says "can be held"; for a lantern = the top ring).
- Optional idle life (all small, automatic): sway (degrees), bob (units), pulse, spin (turns/s), flicker, rise (smoke/bubbles).
- A glow: after K.prop(...) set a.glow = { size: 3, alpha: .5, at: .4, color: '#ffd28a' } (size in units, at = height above the ground).
- Facing: draw things facing RIGHT. The director flips them when they turn left.

### Creatures (animals, monsters) — a picture cut into jointed parts
\`\`\`js
var body = K.render(...), head = K.render(...), tail = K.render(...);   // one K.begin/K.render per part, same canvas size & coordinates
var a = K.rig({ kind: 'creature', ppu: 400, anchor: [x, y],            // ppu = picture px per unit; anchor = feet
  parts: [ { name: 'body', art: body, pivot: [x, y] },
           { name: 'head', parent: 'body', art: head, pivot: [x, y] },
           { name: 'tail', parent: 'body', art: tail, pivot: [x, y] } ] });
a.idle = function (t) { a.j.tail.rot = Math.sin(t * 3) * 12; a.j.head.rot = Math.sin(t * 1.4) * 3 };
a.do = { wag: function (k, t) { this.j.tail.rot = Math.sin(t * 14) * 25 } };
return a;
\`\`\`
- Parts are drawn in list order (back to front); a child follows its parent. pivot = the point (picture px) the part turns around.
- Pose: a.j.<part>.rot (degrees, + = clockwise) · .dx .dy (px) · .sx .sy (scale). Set values ABSOLUTELY (never +=).
- A simple creature that does not need joints: K.creature(drawing, { size: 1 }) (same options as K.prop).

### FX (light, smoke, fire, sparkles, magic)
\`\`\`js
return K.fx(drawing, { size: 0.6, flicker: true, glow: { size: 2, alpha: .6, color: '#ffd28a' } })
\`\`\`

### Sets — a place, painted as flat layers from far to near
\`\`\`js
return K.set({
  width: 26, depth: 14,
  backdrop: { top: '#c9b49a', bottom: '#b7a78c', ground: '#9aa66e' },  // sky colours + floor colour
  ground: { color: '#93a56a' },                                         // the faceted floor (ground: false = none)
  layers: [ { art: hills,  z: -22, width: 80, base: 640 },              // far
            { art: trees,  z: -13, width: 54, base: 690 },
            { art: grass,  z: 4,   width: 36, base: 214 } ],            // in front of the people
  spots: { center: [0, 0, 0], left: [-2.2, 0, 0], right: [2.2, 0, 0], door: [-6, 0, -2] }   // [x, y, z]
});
\`\`\`
- Each layer: art = a drawing (bg:'none'), z = depth (0 = where people stand, NEGATIVE = behind them, positive = in front), width = how wide the picture is in units, base = the picture row (px) that sits on the ground, x/y optional offsets. Far layers should be wide (50–90) and painted lighter/bluer; near ones darker.
- People stand on the floor (y = 0) around z = 0. Things standing on the ground (trees, buildings, furniture) belong in layers at z = -4 … -14 with base = their ground line. A tree in a layer at z -13 with width 54 for a 2400 px picture is 44 px per unit: a 6-unit tree is ~270 px tall.
- spots: EVERY spot the ticket lists. Keep people spots close together (within about ±3 units) — vertical videos are narrow. Behind-cover spots go at the layer's z.
- Make the set rich but calm: sky/hills, 2–3 depth layers, a few things to look at. Interiors: wall layer at z -6, furniture layers at z -3, a floor colour in ground.color.

## WHAT EACH KIND MUST RETURN (the "contract" — the director and other chats rely on these names)
| kind | must return |
|---|---|
| character | K.person(...) or K.mascot(...) (+ attach extras) |
| creature | K.rig({kind:'creature', parts}) or K.creature(drawing) — with idle(t) if it should breathe |
| prop | K.prop(drawing, { size }) — with grip if held |
| set | K.set({ layers, spots, ... }) with EVERY spot name the ticket lists |
| fx | K.fx(drawing, { size, glow }) |

### Moves (custom animations the ticket asks for)
Return them in a 'do' object on the returned asset. Each move is a PURE function:
\`\`\`js
a.do = { flap: function (k, t) { this.j.wing.rot = Math.sin(t * 20) * 40 * (1 - k * .3) } };
\`\`\`
- k = 0..1 progress of the move, t = seconds since it started. Same k and t must always give the same pose (no counters, no Math.random).
- Set rotations ABSOLUTELY (this.j.wing.rot = ...), never with += (the director resets the pose every frame). Only parts of a K.rig can move.
- The director already has these moves for EVERY asset, so never write them yourself: walk, run, sneak, move, turn, look, point, wave, reach, nod, shake-head, talk, react, appear, vanish, float, spin, shake, jump, fall, grow, hold, drop, crouch, hide, peek, sit, sleep, yawn, cheer, cower, shiver, stomp, emerge, burrow.`;

  var EXAMPLE = `\`\`\`js
// CHARACTER — a one-video person
KIT.asset('farmer', function (K, opts) {
  var a = K.person({ gender: 'm', skin: K.PAL.skin.warm, hair: 'bald', top: K.PAL.cloth.olive, inner: K.PAL.cloth.cream,
                     outer: 'closed', pants: K.PAL.cloth.rust, shoes: '#6b5a40', height: 2.5 });
  K.begin({ width: 500, height: 200, bg: 'none', grain: false, seed: 3 });
  K.part([[40, 150], [90, 100], [250, 100], [460, 150], [250, 170], [90, 170]], '#c99a3e', { material: 'hard', smooth: true });   // straw hat
  K.part(K.ellipse(250, 100, 120, 70, 14), '#d9b25a', { material: 'hard' });
  a.attach('head', K.render('straw hat'), { size: .4, y: .02, z: 'front' });
  return a;
});

// PROP — held, so it has a grip point
KIT.asset('lantern', function (K, opts) {
  K.begin({ width: 300, height: 420, bg: 'none', grain: false, seed: 5 });
  K.ring(150, 50, 30, '#6b5a40', 8);
  K.part([[78, 84], [222, 84], [240, 124], [60, 124]], '#8a6a3c', { material: 'hard' });
  K.part([[70, 124], [230, 124], [226, 330], [74, 330]], '#e9b95b', { material: 'detail', light: .4 });
  K.flat([[104, 152], [196, 152], [188, 306], [112, 306]], '#fff0b8', .85);
  K.part([[60, 330], [240, 330], [222, 372], [78, 372]], '#8a6a3c', { material: 'hard' });
  var a = K.prop(K.render('brass lantern'), { size: .8, grip: [150, 50], anchor: [150, 372], sway: 2.5 });
  a.glow = { size: 3.4, alpha: .55, at: .36, color: '#ffd28a' };
  return a;
});

// SET — layers far to near + named spots
KIT.asset('meadow', function (K, opts) {
  K.begin({ width: 2400, height: 700, bg: 'none', grain: false, seed: 3 });
  K.part([[0, 700], [0, 420], [500, 330], [1100, 400], [1700, 310], [2400, 380], [2400, 700]], '#8fa0a8', { material: 'hard', step: 90, sx: 120, sy: 160 });
  K.part([[0, 700], [0, 520], [700, 450], [1500, 520], [2400, 470], [2400, 700]], '#6d8f7a', { material: 'hard', step: 90, sx: 120, sy: 160 });
  var hills = K.render('hills');
  K.begin({ width: 2400, height: 700, bg: 'none', grain: false, seed: 7 });
  for (var i = 0; i < 12; i++) { var x = 100 + i * 190 + K.rnd() * 60, s = .7 + K.rnd() * .6;
    K.part([[x - 8 * s, 700], [x + 8 * s, 700], [x + 6 * s, 660], [x - 6 * s, 660]], '#5a4636', { material: 'hard' });
    K.part([[x - 70 * s, 690], [x + 70 * s, 690], [x + 8 * s, 690 - 290 * s], [x - 8 * s, 690 - 290 * s]], '#4f7a5a', { material: 'leaf', dir: 70 }); }
  var trees = K.render('pine trees');
  return K.set({ width: 26, depth: 14, backdrop: { top: '#c9b49a', bottom: '#b7a78c', ground: '#93a56a' }, ground: { color: '#93a56a' },
    layers: [ { art: hills, z: -22, width: 80, base: 640 }, { art: trees, z: -13, width: 54, base: 690 } ],
    spots: { center: [0, 0, 0], left: [-2.2, 0, 0], right: [2.2, 0, 0], far: [0, 0, -4] } });
});
\`\`\``;

  /* shot rules: the paper rules with the Low-Poly differences */
  var SHOT = PAPER.SHOTRULES
    .replace(/Emotions? \(for faces\)[^\n]*\n?/g, '')
    .replace("face: emotion (neutral, happy, surprised, scared, annoyed, sleepy, sneaky, determined)", "face: emotion (neutral, happy, surprised, scared, annoyed, sleepy, sneaky, determined, sad, worried, thinking, laugh)")
    .replace(/- side \(which side[^\n]*\n/, "- side (which side of the subject the camera stands): front, front-left, front-right, left, right. The world is 2.5D, so the camera only turns a little (a three-quarter view with parallax) — back views are shown from the front. People face left or right; 'turn: camera' faces the viewer.\n")
    .replace("hold { item: cast name, hand: 'R' | 'L' } (the item follows the hand)", "hold { item: cast name, hand: 'R' | 'L' } (the item follows the hand; it hangs naturally from the hand)")
    .replace("People, natural body moves:", "People (and K.rig creatures), natural body moves:")
    .replace("### COMPOSITION, BLUR AND SILHOUETTES", "### LOW-POLY NOTES\n- Characters are flat cut-outs: they turn LEFT or RIGHT (face 'turn') and walk sideways across the frame; they never turn to show their back. Use side-on actions: walk, point, wave, hold, sit, talk.\n- sit { seat: 0.75 } sits on a chair/bench of that height (put the chair at the same spot); without seat they sit on the ground.\n- The frame is narrow (9:16): keep two people close together (spots within about 3 units) and prefer medium/full framing for two-shots.\n- Depth is real: the camera moves through layers (parallax) and the focus blur softens what is nearer or farther. Put things at different z when it helps.\n\n### COMPOSITION, BLUR AND SILHOUETTES");
  var NAME = 'Low-Poly Paper (flat faceted 2.5D cut-out)';

  TP.styles.lowpoly = { STYLE: STYLE, TOOLS: TOOLS, EXAMPLE: EXAMPLE, SHOTRULES: SHOT, NAME: NAME, TITLE: 'low-poly papercraft animation' };
  TP.styleList = [
    { id: 'lowpoly', name: 'Low-Poly Paper', note: 'Flat faceted 2.5D cut-outs, fast to build, soft focus and cinematic light.' },
    { id: 'paper', name: 'Dark Paper Cinema', note: 'Dark 3D paper cut-outs, stop-motion look.' }
  ];
})();
