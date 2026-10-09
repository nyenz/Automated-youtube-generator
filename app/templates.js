/* TEMPLATES — every prompt the app gives you to paste into an AI chat.
   The STYLE BIBLE, KIT TOOLS and SHOT RULES are identical in every ticket,
   so assets and shots made in different chats still match. */
(function () {
  var TP = {}; window.TPL = TP;

  /* =================================================================
     STYLE BIBLE — same text in every asset ticket
     ================================================================= */
  TP.STYLE = `## THE LOOK — "Dark Paper Cinema" (the kit does the look; you respect it)
- Everything is dark paper cut-out: paper texture, 4 hard tone steps, torn ink edges, hard paper shadows, 12 fps stop-motion. You get all of this automatically by building ONLY with the kit tools below.
- Characters are dark and muted. Bright colour lives only in lights and glows.
- A muted paper-diorama accent (dusky coral, deep teal, cream swirls, layered ridges, big moon) may decorate sets through the world helpers. It is an accent, never the main look.
- Shapes are ROUND: ellipsoids, rounded tubes, lathe profiles. Boxes only for furniture and buildings.
- Every living thing has ONE exaggeration (big nose, giant head, huge belly, very long neck...).
- Arms and legs are stubby. Hands are mittens with a thumb. Feet are big.
- Shorts are vertical 9:16 (long videos may be 16:9 wide). Sets need vertical interest (tall trees, sky, shelves, a moon high up) AND some width. Props must read clearly from their silhouette.

## SCALE (very important — assets from different chats must fit together)
- Units: the mascots are 2.6 units tall. A real adult (1.7 m) = 2.6 units, so 1 real metre is about 1.5 units.
- Reference sizes (height): kato 2.66 · nia 2.64 · K.human builds: hero 3.0, pear 2.4, noodle 3.4, average 2.66, slim 2.64, kid 2.3
- Typical things: door 3.4 · chair seat 0.75 · table 1.2 · cup 0.25 · phone 0.25 · car 2.3 tall / 6.5 long · tree 6–10 · house 7–10 · rat 0.35 · dog 1.0 · horse 2.6
- Origin (0,0,0) = on the ground, under the middle of the thing. Up is +y. Living things FACE +z.
- Sets are about 12–20 units wide. Characters stand on y = 0.

## PALETTE (only these colours)
K.PAL.skin[0..3], K.PAL.hair[0..2]
cloth: K.PAL.teal, mustard, burgundy, charcoal, brown, moss
accents: K.PAL.cream, gold, rust, ink
night: K.PAL.night, moonlit, moonlight · wood: K.PAL.wood, woodDark
glows ONLY (lights, screens, magic): K.PAL.glowCyan, glowAmber, glowMoon, glowWarm
diorama accent: K.PAL.dio.coral, salmon, peach, deepCoral, plum, teal, tealDark, tealDeep, cream, mauve, ground, ridge[0..4]
If you truly need another colour (blood red, leaf green), write it as a DARK, MUTED hex (lightness under ~45%), e.g. 0x6a2a2a.

## THE TWO MASCOTS (channel hosts — never rebuild them by hand)
- kato (male): average build, brown skin, black quiff, teal polo, cream collar, mustard scarf, big nose.
- nia (female): slim build, dark skin, black bun, burgundy dress, round glasses, gold earrings, lashes.
They already exist. Do NOT make them unless a ticket asks for a costume version (then start from K.mascot('kato') and add pieces).`;

  /* =================================================================
     KIT TOOLS + CONTRACT — for asset tickets
     ================================================================= */
  TP.TOOLS = `## FILE FORMAT (exact)
\`\`\`js
KIT.asset('asset-name', function (K, opts) {
  var root = new K.T.Group();
  // build with the kit tools only
  return { root: root, kind: 'prop' /* + every part and move the ticket asks for */ };
});
\`\`\`
- K.T is three.js r128. Write K.T.Group, K.T.Vector3 ... never THREE.
- No import/export, no images, no files, no Math.random() (use K.rnd()), no document, no window.
- Never touch the renderer, camera, KIT.init, KIT.start, requestAnimationFrame, shots, lights of the whole scene, or sound.
- ALL code goes INSIDE the KIT.asset(...) call. Nothing outside it.

## KIT TOOLS
| Tool | Use |
|---|---|
| K.M(geo, colour, parent, x,y,z, sx,sy,sz, edge) | A paper piece (mesh). edge: leave out = normal ink edge, 'thin' = small parts, false = none. Returns the mesh. |
| K.SPH | Unit sphere — scale it into ellipsoids. THE main building block. |
| K.limb(rTop, rBottom, length) | Rounded tube hanging DOWN from its top (y 0 to -length). |
| K.lathe([[radius,y],...], segments) | Round profiles: cups, pots, lamps, bodies, bottles. |
| K.BOX | Unit box. Furniture and buildings only. |
| new K.T.CylinderGeometry / TorusGeometry / ConeGeometry / ShapeGeometry / ExtrudeGeometry | Allowed as the geo for K.M. |
| K.flat(geo, colour, parent, x,y,z, sx,sy,sz, opacity) | Unlit flat paper: glass, water, wings, screens, cheeks. |
| K.glow(parent, x,y,z, size, colour, opacity) | Soft light sprite: lamps, fire, magic. |
| K.face(headGroup, {r, cy, y, gap, size, mouthY, mouthZ, lashes}) | THE shared face (eyes, pupils, brows, 5 mouths, cheeks). EVERY face must use this. |
| K.sheet(shape, depth, colour, parent, x,y,z) | A flat 2D cut-out, extruded thin (signs, leaves, cliffs, layers). |
| K.jagged(rx, ry, points, amount) | Leafy / torn oval Shape for K.sheet. |
| K.rnd() | Seeded random 0..1. |
| K.ease(x) | Smooth 0..1 curve, handy inside moves. |
Emotions (for faces): neutral, happy, surprised, scared, annoyed, sleepy, sneaky, determined.

### People — ALWAYS use these. Never build a human from spheres yourself.
\`\`\`js
var rig = K.mascot('kato');   // or 'nia' — only for costume versions of the hosts
var rig = K.human({ build, skin, hair, hairStyle, top, shirt, collar, bottom, pants, shoes, nose, lashes, glasses, earrings });
\`\`\`
- build: 'hero' (giant chest), 'pear' (giant belly, short), 'noodle' (very tall, long neck), 'average', 'slim', 'kid'
- hairStyle: quiff, short, bald, tall, bob, bun, ponytail, curly, afro · top: polo, tee, dress · bottom: pants, shorts, skirt
- nose: size multiplier (1 normal; 1.3–1.8 is a good exaggeration)
- The rig already has: root, hips, body, torso, neck, head, face, headTop, armR, armL, legR, legL, handR, handL, gripR, gripL, height. Walking, pointing, waving, holding are done by the director — you do NOT animate people.
- Extras (hats, helmets, tools, uniforms) = paper pieces added to rig parts: rig.head, rig.torso, rig.body, rig.handR. Then set rig.kind = 'character', add the extras as named fields, return rig.
- A one-video person must look clearly different from both mascots (different build, colours, hair).

### World helpers (sets only)
K.ground(p,{radius,color}), K.ridges(p,{z,colors,height}), K.paperTree(p,x,z,{scale,flip,leaves,puffs,trunk}), K.cloudSwirl(p,x,y,z,scale,colour), K.tuft(p,x,z,scale,colour), K.rock(p,x,z,scale), K.moon(p,x,y,z,radius)

## WHAT EACH KIND MUST RETURN (the "contract" — the director and other chats rely on these names)
| kind | must return |
|---|---|
| character | the rig from K.human / K.mascot + extras, with kind:'character' |
| creature | root, kind:'creature', body, head, face (K.face), every moving part as a pivot Group at its joint, idle(t) |
| prop | root, kind:'prop'; grip (a K.T.Object3D at the point a hand holds it) if the ticket says it is held; moving parts as named Groups |
| set | root, kind:'set', spots: { name: new K.T.Vector3(x, 0, z), ... } with EVERY spot name the ticket lists. May add at most 2 of its own lights (K.T.PointLight). 12–20 wide. |
| fx | root, kind:'fx', and its look changes through moves (e.g. do.grow) |

### Moves (custom animations the ticket asks for)
Return them in a 'do' object. Each move is a PURE function:
\`\`\`js
do: {
  flap: function (k, t) { /* k = 0..1 progress of the move, t = seconds since the move started */ }
}
\`\`\`
- Same k and t must always give the same pose (no counters, no stored state, no Math.random).
- Set rotations/positions ABSOLUTELY (wing.rotation.z = ...), never with += (the director resets the pose every frame).
- For fast flutter use Math.floor(t*12)%2. The rest pose (before any move) must look good.
- idle(t) (optional, creatures): small life motion like breathing or tail sway, also absolute.
- The director already has these moves for EVERY asset, so never write them yourself: walk, run, move, turn, look, point, wave, reach, nod, shake-head, talk, react, appear, vanish, float, spin, shake, jump, fall, grow, hold, drop.`;

  /* example (one of each kind) */
  TP.EXAMPLE = `\`\`\`js
// CHARACTER — a one-video person: K.human + extras
KIT.asset('farmer', function (K, opts) {
  var rig = K.human({ build: 'pear', skin: K.PAL.skin[2], hair: K.PAL.hair[2], hairStyle: 'bald',
                      top: 'tee', shirt: K.PAL.moss, pants: K.PAL.brown, nose: 1.4 });
  var hat = new K.T.Group(); hat.position.set(0, .84, -.02); rig.head.add(hat);
  K.M(new K.T.CylinderGeometry(.62, .62, .03, 32), K.PAL.mustard, hat, 0, 0, 0);
  K.M(K.SPH, K.PAL.mustard, hat, 0, .08, 0, .34, .2, .34);
  rig.hat = hat; rig.kind = 'character';
  return rig;
});

// CREATURE — round pieces + the shared face + a custom move + idle
KIT.asset('worm', function (K, opts) {
  var root = new K.T.Group(), body = new K.T.Group(); root.add(body);
  var segs = [];
  for (var i = 0; i < 11; i++) {
    var r = .15 * (1 - .45 * i / 11), g = new K.T.Group(); g.position.set(0, r, -i * .11); body.add(g);
    K.M(K.SPH, i % 2 ? 0x9c5060 : 0xb8646e, g, 0, 0, 0, r, r * .92, r * 1.12); segs.push(g);
  }
  var neck = new K.T.Group(); neck.position.set(0, .3, .16); body.add(neck);
  var head = new K.T.Group(); head.scale.setScalar(.7); head.position.y = -.31; neck.add(head);
  K.M(K.SPH, 0xb8646e, head, 0, .44, 0, .36, .41, .36);
  var face = K.face(head, { r: .36, cy: .44, y: .5, gap: .14, size: 1.3, mouthY: .25 });
  function crawl(t, amount) { segs.forEach(function (g, i) { var r = .15 * (1 - .45 * i / 11);
    g.position.y = r + amount * .08 * Math.pow(Math.max(0, Math.sin(t * 6.5 - i * .75)), 2); }); }
  return { root: root, kind: 'creature', body: body, segs: segs, neck: neck, head: head, face: face,
    do: { crawl: function (k, t) { crawl(t, 1); } },
    idle: function (t) { neck.rotation.x = Math.sin(t * 1.5) * .08; } };
});

// PROP — held, so it has a grip point
KIT.asset('watering-can', function (K, opts) {
  var root = new K.T.Group();
  K.M(K.lathe([[0, 0], [.14, 0], [.15, .05], [.15, .22], [.12, .26], [0, .26]]), K.PAL.teal, root, 0, 0, 0);
  var spout = K.M(K.limb(.025, .018, .3), K.PAL.teal, root, .12, .12, 0); spout.rotation.z = -2.2;
  K.M(new K.T.TorusGeometry(.1, .02, 8, 20, Math.PI), K.PAL.teal, root, -.04, .26, 0);
  var grip = new K.T.Object3D(); grip.position.set(-.04, .36, 0); root.add(grip);
  return { root: root, kind: 'prop', grip: grip, spout: spout };
});

// SET — the place, with named spots
KIT.asset('garden', function (K, opts) {
  var root = new K.T.Group(), D = K.PAL.dio;
  K.ground(root, { radius: 16 });
  K.ridges(root, { z: -9 });
  K.moon(root, .4, 4.8, -24, 2.4);
  K.paperTree(root, -4.5, -3, { scale: 1.2 });
  K.paperTree(root, 4.2, -3.6, { scale: 1.3, flip: true, leaves: [D.teal, D.tealDark] });
  for (var i = 0; i < 30; i++) { var x = (K.rnd() - .5) * 14, z = (K.rnd() - .5) * 8 - 2; if (Math.abs(x) < 2 && z > -2) continue;
    K.tuft(root, x, z, .8 + K.rnd() * .6, [D.coral, D.teal, D.salmon][i % 3]); }
  K.rock(root, 2.5, 1.5, 1.2);
  return { root: root, kind: 'set', spots: { center: new K.T.Vector3(0, 0, 0), left: new K.T.Vector3(-1.5, 0, .5),
    right: new K.T.Vector3(1.5, 0, .5), tree: new K.T.Vector3(-4, 0, -2) } };
});
\`\`\``;

  /* =================================================================
     SHOT RULES — for shot tickets and shot fixes
     ================================================================= */
  TP.SHOTRULES = `## HOW A SHOT IS WRITTEN
You do NOT write animation code. You fill in a FORM for each shot. The director turns it into camera moves, focus blur, light, motion, sound and captions. The look is locked.

\`\`\`js
SHOT('M07', {                          // example story: a mosquito finds a sleeping man
  set: 'bedroom',                        // one set from the ASSETS list, or 'void' (plain dark stage)
  cast: {                                // everything visible in the shot (except the set)
    sleeper:  { at: 'bed', turn: 'camera', face: 'sleepy' },
    mosquito: { at: 'window', turn: 'left', y: 1.8 },
    lamp:     { at: 'table' }
  },
  camera: { framing: 'medium', on: ['sleeper', 'mosquito'], side: 'front-right', angle: 'high', move: 'push-in' },
  focus:  [ { on: 'mosquito' }, { word: 'cheek', on: 'sleeper', pull: 0.5 } ],
  light:  [ { mood: 'dark' }, { word: 'lands', mood: 'danger', ease: 0.4 } ],
  moves: [
    { word: 'follows',  who: 'mosquito', do: 'move', to: 'sleeper', for: 2.2, arc: 0.4 },
    { word: 'lands',    who: 'mosquito', do: 'react', type: 'land' },
    { word: 'lands',    who: 'sleeper',  face: 'annoyed' },
    { word: 'scratches', who: 'sleeper', do: 'reach', to: 'mosquito', for: 1.2 }
  ],
  sfx:  [ { word: 'lands', sound: 'tick' } ],
  text: [ { sec: 0.2, say: '3:12 AM', for: 2 } ]   // optional paper title card
});
\`\`\`
(This is only an example of the FORMAT. Your shots use YOUR video's assets, spots and words.)

### TIMING — two ways to say WHEN
- word: 'grabs' → the moment that word is spoken (it must be a word in THIS shot's narration; you can use two words: 'air pocket'; add nth: 2 for its second time).
- sec: 1.5 → seconds after the shot starts.
- for: how many seconds the move lasts.
Sync the important actions to the words that describe them. That is what makes the video feel alive.

### cast — key = asset name (or any name with asset: 'real-name' to use a second copy)
- at: a spot name of the set (listed in ASSETS), another cast member's name, or [x, y, z]
- turn: degrees (0 = facing the front) or 'left' | 'right' | 'back' | 'camera' | a cast name (face toward it)
- face: emotion (neutral, happy, surprised, scared, annoyed, sleepy, sneaky, determined)
- look: 'camera' or a cast name (the eyes follow it)
- size: scale multiplier (e.g. 1.5) · y: lift above the ground · hidden: true

### camera — pick words from these lists only
- framing: extreme (eyes/detail), close (head+shoulders), medium (waist up), full (whole body), wide (the place)
- on: the cast name (or a list ['a', 'b'] for a two-shot). Leave out for the set.
- side (which side of the subject the camera stands): front, front-left, front-right, left, right, back-left, back-right, back
- angle: eye, low (looks up = powerful/scary), high (looks down = small/weak), top (bird's eye), dutch (tilted = unease)
- move: static, drift (slow, default), push-in (tension, realisation), pull-out (reveal, loneliness), orbit-left, orbit-right (wonder), crane-up (rise/hope), crane-down (descend/arrival), truck-left, truck-right, handheld (panic, chaos)
- lens: wide, normal, tele · shake: [ { word: 'boom', amount: 0.06 } ] · distance: 1.2 (further) / 0.8 (closer)

### focus (the blur follows the story)
List of { on: name or [names], word/sec, pull: seconds to move focus, blur: 0.5–2 }. First item = the focus at the start. Move focus to whatever the narration is talking about. Anything you focus on must also be in camera.on, or it will be off screen.

### light — moods
normal, warm, cold, dark, danger, silhouette (dark shapes against a glow — use for mystery, death, flashbacks), hope, flash (a sudden bright flash).
light: 'dark' or a list [ { mood }, { word, mood, ease: seconds } ].

### moves — { who, do, word/sec, for, ... }
Built-in for everyone:
- walk / run { to: spot | cast name | [x,y,z] } — people walk with legs; others slide
- move { to, arc: height } — glide or fly (fish, birds, objects)
- turn { to: degrees | 'left' | 'right' | 'camera' | name } · look { to: name | 'camera' | 'none' }
- point { to } · reach { to } · wave · nod · shake-head · talk (mouth flaps — use when a character speaks)
- react { type: 'take' (surprise jump) | 'land' | 'twitch' | 'shake' }
- appear (pops in; hidden before) · vanish · float { height } · spin { turns } · shake · jump { height } · fall { to: 'back' } · grow { size }
- hold { item: cast name, hand: 'R' | 'L' } (the item follows the hand) · drop { item }
- Custom moves: only the ones listed for that asset in ASSETS (e.g. do: 'reach' on the hand).
- A face change: { word, who, face: 'scared' } (no do needed).
Gestures (point, wave, nod, talk, react, shake, jump) play for 'for' seconds then stop. Walk, move, turn, look, hold, appear, vanish, grow, fall keep their result.

### sfx — { word/sec, sound }
step, rustle, whoosh, swish, scrape, clink, tada, thud, pop, tick, snore, boom, sting, riser, heartbeat. Use 1–3 per shot. Never on every word.

### extra (optional, advanced) — only if the form truly cannot do it
extra: function (t, A, K) { /* t = seconds into the shot; A.name = the cast objects; set things ABSOLUTELY */ }

### GOOD DIRECTION (what makes it look professional)
- One clear idea per shot. Show what the narration says, at the word it says it.
- Vary framing between neighbouring shots (wide → close → medium...). Never two identical cameras in a row.
- Start a scene wide (where are we?), then go closer for emotion.
- Faces carry the story: change emotions at the key words. Eyes look at what matters.
- Focus pulls guide the eye: pull focus to the thing being named.
- Light tells the mood: danger/silhouette for tension, hope/warm for relief.
- Keep cast small (1–3 things) so it reads on a phone.`;

  /* =================================================================
     helpers
     ================================================================= */
  function wordsTarget(min) { return Math.round(min * 150) }
  function cutLinesText(cut) {
    if (!cut.lines || !cut.lines.length) return '(no timing yet — do the Voice step first)';
    return cut.lines.map(function (l) { return 'line ' + l.i + '  [' + l.s.toFixed(1) + '–' + l.e.toFixed(1) + 's]  ' + l.text }).join('\n');
  }
  TP.cutLinesText = cutLinesText;
  function assetList(p, opts) {
    var A = (p.plan && p.plan.assets) || [], info = p.assetInfo || {};
    var rows = A.map(function (a) {
      var sz = info[a.name] && info[a.name].size, s = '- ' + a.name + ' (' + a.kind + ')' + (sz ? (a.kind === 'set' ? ' ' + sz[0] + ' wide' : ' ' + sz[1] + ' tall') : (a.size ? ' about ' + a.size + (a.kind === 'set' ? ' wide' : ' tall') : ''));
      if (a.kind === 'set') s += ' — spots: ' + (a.spots || []).join(', ');
      if (a.moves && a.moves.length) s += ' — custom moves: ' + a.moves.join(', ');
      if (a.parts && a.parts.length && a.kind !== 'set') s += ' — parts: ' + a.parts.join(', ');
      if (a.holdable) s += ' — can be held';
      if (opts && opts.looks) s += '\n    look: ' + a.look;
      return s;
    });
    rows.unshift('- kato (character, mascot host, 2.66 tall)', '- nia (character, mascot host, 2.64 tall)', '- void (set: plain dark stage) — spots: center, left, right, front, back');
    return rows.join('\n');
  }
  TP.assetList = assetList;

  /* =================================================================
     1) TOPICS
     ================================================================= */
  TP.topics = function (p, trends) {
    var s = p.settings, t = [];
    if (trends && trends.wiki && trends.wiki.length) t.push('Most-read Wikipedia articles right now:\n' + trends.wiki.slice(0, 30).map(function (x) { return '- ' + x }).join('\n'));
    if (trends && trends.yt && trends.yt.length) t.push('Trending YouTube videos:\n' + trends.yt.slice(0, 25).map(function (x) { return '- ' + x }).join('\n'));
    if (trends && trends.channel && trends.channel.length) t.push('Top videos of the reference channel (' + (s.refChannel || '') + '):\n' + trends.channel.slice(0, 25).map(function (x) { return '- ' + x }).join('\n'));
    if (trends && trends.hn && trends.hn.length) t.push('Hacker News front page:\n' + trends.hn.slice(0, 15).map(function (x) { return '- ' + x }).join('\n'));
    return `You are the story producer of a narrated YouTube explainer channel in the style of Zack D. Films: short, punchy, visual, surprising true stories and facts, told with suspense.

Give me 10 video ideas for the category: ${s.category || 'any'}.
Format: ${s.type === 'long' ? 'long video (' + s.minutes + ' min) that can also be cut into ' + s.shorts + ' shorts' : 'vertical short, ' + s.minutes + ' min'}.
${s.extraTopic ? 'Extra wishes: ' + s.extraTopic + '\n' : ''}
Rules:
- Each idea must be a TRUE story or fact you are confident about (no rumours).
- A strong hook in the first sentence. A surprising turn. A clear ending.
- Very visual: things a viewer can SEE (places, people, creatures, objects).
- Mostly 21st-century or timeless stories unless the category says otherwise.
- Prefer ideas that connect to what people are talking about now (see the lists below) but only when it fits.

Reply as a numbered list:
1. TITLE — one-sentence hook — why it works (5–10 words)

${t.length ? 'WHAT IS TRENDING NOW:\n\n' + t.join('\n\n') : ''}`;
  };

  /* =================================================================
     2) SCRIPT (for Claude — research + story + humanise + TTS ready)
     ================================================================= */
  TP.script = function (p) {
    var s = p.settings, cuts = p.cuts || [];
    var parts = cuts.map(function (c) {
      return '=== SCRIPT: ' + c.label.toUpperCase() + ' ===\n(' + c.minutes + ' min ≈ ' + wordsTarget(c.minutes) + ' words' + (c.id.indexOf('short') === 0 ? '; it must stand on its own with its own hook and ending; use a part or a summary of the story; same people and places as the long video' : '') + ')';
    }).join('\n\n');
    return `You are the writer for a narrated YouTube channel in the style of Zack D. Films: true stories and facts told with suspense, short sentences, vivid pictures, a hook in the first 3 seconds.

TOPIC: ${s.topic || '(write the topic here)'}
CATEGORY: ${s.category || ''}
VOICE: ${s.voice === 'female' ? 'female' : 'male'} narrator. ${s.mascot && s.mascot !== 'none' ? 'The channel mascot' + (s.mascot === 'both' ? 's kato (male) and nia (female) may appear' : ' ' + s.mascot + ' may appear') + ' on screen as a host, but the narrator tells the story.' : ''}

STEP 1 — RESEARCH
Search the web and read the sources below. Use only facts you can confirm. If two sources disagree, use the safer claim or leave it out. Never invent names, numbers, quotes or dates.
${p.research ? 'MY SOURCES AND NOTES:\n' + p.research : '(no extra sources)'}

STEP 2 — STYLE
${p.styleRef ? 'Here is a transcript from the channel whose STYLE I want (hook, pacing, sentence length, how it builds suspense). Copy the style, NEVER the words:\n"""\n' + p.styleRef.slice(0, 12000) + '\n"""' : 'Style: second person or close third person, present tense when it builds tension, 6–14 words per sentence, one idea per sentence, a cliffhanger every 20–30 seconds.'}

STEP 3 — WRITE IT HUMAN
- Sound like a person telling a friend an amazing story. Plain words. No "delve", "tapestry", "testament", "in a world where", no lists, no rhetorical triple patterns, no "imagine..." openers.
- Every sentence must be something we can SHOW on screen (a person, a place, an object, an action).
- Hook in the first sentence. Open loops ("But that wasn't the strange part.") Pay them off.
- End with a punch line or a twist, not a moral.

STEP 4 — MAKE IT READY FOR TEXT-TO-SPEECH (Google AI Studio)
- Plain text only. No headings inside the script, no bullet points, no emojis, no brackets, no stage directions.
- Write numbers, years, units and symbols as spoken words: "two thousand thirteen", "thirty metres", "sixty hours", "per cent".
- Spell names the way they sound if they are hard (and keep the real spelling in SOURCES).
- One sentence per line. Blank line between paragraphs = a natural pause.

REPLY IN EXACTLY THIS FORMAT (the app reads these markers):

=== TITLE ===
(the video title, under 60 characters)

=== VOICE STYLE ===
(2–3 sentences of directions for the AI voice: tone, pace, where to slow down. This goes into Google AI Studio's style box.)

=== SOURCES ===
(the links you used, one per line, with one fact each)

${parts}`;
  };

  /* =================================================================
     3) PLAN (assets + shots for every cut) — JSON
     ================================================================= */
  TP.plan = function (p) {
    var s = p.settings, cuts = p.cuts || [];
    var cutText = cuts.map(function (c) { return 'CUT "' + c.id + '" (' + c.label + ', ' + (c.aspect || '9:16') + ', ' + (c.duration ? c.duration.toFixed(1) + ' s' : '') + ', shot ids start with ' + c.prefix + '):\n' + cutLinesText(c) }).join('\n\n');
    var mascots = s.mascot === 'both' ? 'kato and nia' : (s.mascot && s.mascot !== 'none' ? s.mascot : 'none (do not use the mascots)');
    return `You are the director and art director of a narrated explainer video made with a code-only 3D paper cut-out style. Read the narration (already recorded and timed, split into numbered lines) and plan EVERYTHING the video needs. Other AI chats will build each asset and each shot from your plan, so be exact.

TITLE: ${p.title || s.topic || ''}
MASCOTS available: ${mascots}

${TP.STYLE}

## WHAT TO PLAN
1. ASSETS — every character, creature, prop, set and fx the video needs.
   - Reuse! One set used in many shots beats many sets. ${cuts.length > 1 ? 'The shorts must reuse the long video\'s assets (do not plan separate ones).' : ''}
   - Aim for ${cuts.length > 1 ? '10–24' : '6–14'} assets. kato, nia and 'void' already exist: never list them.
   - name: lower-case-with-dashes. kind: character | creature | prop | set | fx.
   - difficulty: 1 = simple (a rock, a cup, a sign), 2 = medium (a set, a vehicle, a prop with moving parts, a simple person), 3 = hard (a creature, a detailed person or costume).
   - size: height in kit units (see SCALE). For sets, the width.
   - look: 1–2 sentences: shape, colours from the palette, the ONE exaggeration.
   - parts: named pieces shots will need (e.g. "lid", "door", "wheel"). For sets put spot names in "spots" instead.
   - moves: ONLY custom animations that the built-in moves cannot do (e.g. "flap", "open-lid", "bite", "crawl"). Built-in moves already exist for everything: walk, run, move, turn, look, point, wave, reach, nod, shake-head, talk, react, appear, vanish, float, spin, shake, jump, fall, grow, hold, drop.
   - holdable: true if a hand holds it (it then needs a grip point).
   - spots (sets only): named places where things stand: e.g. ["door", "bed", "window", "center"].
2. SHOTS — for each cut, split the numbered lines into shots.
   - Each shot = 1 to 3 consecutive lines, about 2–6 seconds. Every line belongs to exactly one shot, in order, no gaps, no overlaps.
   - id = the cut's prefix + 2 digits (e.g. ${cuts[0] ? cuts[0].prefix : 'M'}01, ${cuts[0] ? cuts[0].prefix : 'M'}02 ...).
   - set: one set name (or "void"). cast: names of the assets visible (not the set).
   - show: what the viewer SEES, 1–2 sentences, concrete (who does what, where, the key moment).
   - camera: a short idea (e.g. "close, low angle, push-in"). mood: normal | warm | cold | dark | danger | silhouette | hope | flash.
   - difficulty: 1 = still/simple, 2 = a few moves, 3 = complex action.
   - Make it cinematic: vary shot sizes, wide to set the place, close for emotion, the mascot can appear as a host reacting or explaining.

## NARRATION
${cutText}

## REPLY WITH JSON ONLY (one code block, no comments, double quotes, no trailing commas)
{
  "title": "...",
  "sky": "night",
  "assets": [
    { "name": "tug-cabin", "kind": "set", "difficulty": 2, "size": 14, "look": "...", "parts": [], "moves": [], "spots": ["door", "center", "corner"] },
    { "name": "diver", "kind": "character", "difficulty": 3, "size": 3, "look": "...", "parts": ["helmet"], "moves": [] },
    { "name": "torch", "kind": "prop", "difficulty": 1, "size": 0.5, "look": "...", "parts": [], "moves": [], "holdable": true }
  ],
  "cuts": {
${cuts.map(function (c) { return '    "' + c.id + '": [ { "id": "' + c.prefix + '01", "lines": [0, 1], "set": "tug-cabin", "cast": ["diver"], "show": "...", "camera": "...", "mood": "cold", "difficulty": 2 } ]' }).join(',\n')}
  }
}
"sky" is "night" (cool, default) or "warm" (sunset). "lines" is [first line, last line] (inclusive).`;
  };

  TP.planFix = function (p, errors) {
    return `Your plan JSON has these problems. Fix them and reply with the FULL corrected JSON only (one code block):\n\n` + errors.map(function (e) { return '- ' + e }).join('\n') + `\n\nReminder: every line of every cut must be in exactly one shot, in order; cast and set names must exist in "assets" (or be kato, nia, void).`;
  };

  /* =================================================================
     4) ASSET TICKET
     ================================================================= */
  TP.assetTicket = function (p, ticket) {
    var A = (p.plan.assets || []).filter(function (a) { return ticket.names.indexOf(a.name) >= 0 });
    var spec = A.map(function (a, i) {
      return `### ${i + 1}. '${a.name}' — kind: ${a.kind}
- look: ${a.look}
- size: about ${a.size} units ${a.kind === 'set' ? 'wide' : 'tall'}
${a.kind === 'set' ? '- spots (must ALL exist): ' + (a.spots || []).join(', ') : ''}${a.parts && a.parts.length ? '\n- parts to return by name: ' + a.parts.join(', ') : ''}${a.moves && a.moves.length ? '\n- custom moves to return in do: ' + a.moves.join(', ') + '  (pure functions (k, t))' : ''}${a.holdable ? '\n- it is HELD by a hand: return grip' : ''}
- used in: ${usedIn(p, a.name)}`;
    }).join('\n\n');
    var others = (p.plan.assets || []).filter(function (a) { return ticket.names.indexOf(a.name) < 0 }).map(function (a) { return '- ' + a.name + ' (' + a.kind + ', ~' + a.size + '): ' + a.look }).join('\n');
    return `You are one of several artists building 3D paper cut-out assets for ONE video, at the same time, in different chats. Your pieces must match the others perfectly, so follow these rules EXACTLY. Do not add your own style.

VIDEO: ${p.title || p.settings.topic || ''}

${TP.STYLE}

${TP.TOOLS}

## EXAMPLE (format to copy)
${TP.EXAMPLE}

## OTHER ASSETS IN THIS VIDEO (built in other chats — match their scale and feel, do NOT build them)
${others || '(none)'}

## YOUR TICKET — build exactly ${A.length === 1 ? 'this asset' : 'these ' + A.length + ' assets'}
${spec}

## BEFORE YOU ANSWER, CHECK:
- [ ] Each one starts with KIT.asset('<exact name above>', function (K, opts) {
- [ ] It returns root, kind and EVERY part / spot / move listed.
- [ ] People use K.human or K.mascot. Every face uses K.face.
- [ ] Only K.M / K.flat / K.glow / K.sheet / world helpers make visible things. Only palette colours.
- [ ] Sizes match the SCALE table. Living things face +z. Origin on the ground.
- [ ] Moves set values absolutely and depend only on k and t.
- [ ] No THREE., no Math.random, no document, no code outside KIT.asset(...).
- [ ] Complete code — no "...", nothing left out.

## REPLY WITH ONE JAVASCRIPT CODE BLOCK containing ${A.length === 1 ? 'the KIT.asset call' : 'the ' + A.length + ' KIT.asset calls'}, and nothing else.`;
  };
  function usedIn(p, name) {
    var out = [];
    Object.keys((p.plan && p.plan.cuts) || {}).forEach(function (cid) { (p.plan.cuts[cid] || []).forEach(function (s) { if ((s.cast || []).indexOf(name) >= 0 || s.set === name) out.push(s.id + ': ' + s.show) }) });
    return out.length ? out.slice(0, 6).join(' | ') + (out.length > 6 ? ' | (+' + (out.length - 6) + ' more)' : '') : 'background';
  }

  TP.assetFix = function (p, name, code, problems, note) {
    var a = ((p.plan && p.plan.assets) || []).filter(function (x) { return x.name === name })[0] || { name: name };
    return `Fix this 3D paper cut-out asset. Keep the same style rules.

${TP.STYLE}

${TP.TOOLS}

## THE ASSET: '${name}' (kind: ${a.kind || '?'})
- look: ${a.look || ''}
- size: about ${a.size || '?'} units
${a.spots ? '- spots: ' + a.spots.join(', ') + '\n' : ''}${a.parts && a.parts.length ? '- parts: ' + a.parts.join(', ') + '\n' : ''}${a.moves && a.moves.length ? '- custom moves (do): ' + a.moves.join(', ') + '\n' : ''}${a.holdable ? '- held by a hand: return grip\n' : ''}
## CURRENT CODE
\`\`\`js
${code || '(missing)'}
\`\`\`

## WHAT IS WRONG
${(problems || []).map(function (x) { return '- ' + x }).join('\n')}${note ? '\n- ' + note : ''}

Reply with ONE code block: the full corrected KIT.asset('${name}', ...) call. Nothing else.`;
  };

  /* =================================================================
     5) SHOT TICKET
     ================================================================= */
  TP.shotTicket = function (p, cut, ticket) {
    var plan = (p.plan.cuts[cut.id] || []), idx = {};
    plan.forEach(function (s, i) { idx[s.id] = i });
    var body = ticket.ids.map(function (id) {
      var s = plan[idx[id]], ls = cut.lines.slice(s.lines[0], s.lines[1] + 1), t0 = ls[0] ? ls[0].s : 0, prev = plan[idx[id] - 1], next = plan[idx[id] + 1];
      var t1 = next && cut.lines[next.lines[0]] ? cut.lines[next.lines[0]].s : cut.duration;
      return `### SHOT ${id}   (${(t1 - (idx[id] === 0 ? 0 : t0)).toFixed(1)} seconds)
narration: "${ls.map(function (l) { return l.text }).join(' ')}"
words with time from shot start: ${shotWords(cut, s, idx[id] === 0 ? 0 : t0, t1)}
set: ${s.set} · cast: ${(s.cast || []).join(', ') || '(none)'}
what we see: ${s.show}
camera idea: ${s.camera || '-'} · mood: ${s.mood || 'normal'}
before: ${prev ? prev.id + ' — ' + prev.show : '(start of video)'}${prev && ticket.ids.indexOf(prev.id) < 0 && p.shots && p.shots[cut.id] && p.shots[cut.id][prev.id] && p.shots[cut.id][prev.id].code ? '\n(the shot before is already made — keep continuity: same places and positions where it makes sense)\n' + p.shots[cut.id][prev.id].code.slice(0, 1500) : ''}
after: ${next ? next.id + ' — ' + next.show : '(end of video)'}`;
    }).join('\n\n');
    return `You are the shot director of a narrated ${cut.aspect === '16:9' ? 'landscape (16:9)' : 'vertical (9:16)'} video in a locked 3D paper cut-out style. You write each shot as a simple FORM. Other chats write the other shots, so follow the rules EXACTLY.

VIDEO: ${p.title || ''}  ·  cut: ${cut.label}

${TP.SHOTRULES}

## ASSETS YOU CAN USE (exact names; spots are the places in each set)
${assetList(p)}

## YOUR SHOTS
${body}

## BEFORE YOU ANSWER, CHECK:
- [ ] One SHOT('<id>', {...}) per shot above, with the exact ids.
- [ ] set and every cast name come from ASSETS. Every 'at' / 'to' spot exists in that set.
- [ ] Every word: '...' is spoken in THAT shot (see its words list).
- [ ] Only the camera / mood / move / sound words listed in the rules.
- [ ] The cast list matches "cast" (you may add a held prop if needed).
- [ ] Neighbouring shots look different (framing / side / move).
- [ ] Everything you focus on is in camera.on (otherwise it is off screen). Characters start where the shot before left them.

## REPLY WITH ONE JAVASCRIPT CODE BLOCK containing only the SHOT(...) calls.`;
  };
  function shotWords(cut, s, t0, t1) {
    return (cut.words || []).filter(function (w) { return w[1] >= t0 - .05 && w[1] < t1 }).map(function (w) { return w[0].replace(/[^\w'’-]/g, '') + '@' + (w[1] - t0).toFixed(1) }).join(' ');
  }

  TP.shotFix = function (p, cut, shotId, code, problems, note, hasHtml) {
    var plan = (p.plan.cuts[cut.id] || []), s = plan.filter(function (x) { return x.id === shotId })[0] || {}, i = plan.indexOf(s);
    var ls = s.lines ? cut.lines.slice(s.lines[0], s.lines[1] + 1) : [], t0 = i === 0 ? 0 : (ls[0] ? ls[0].s : 0), nx = plan[i + 1], t1 = nx && cut.lines[nx.lines[0]] ? cut.lines[nx.lines[0]].s : cut.duration;
    return `Fix one shot of a narrated vertical video made in a locked 3D paper cut-out style.${hasHtml ? ' I attached the video as an HTML file: open/read it to see the other shots; the shot to fix plays from ' + t0.toFixed(1) + ' s to ' + t1.toFixed(1) + ' s.' : ''}

${TP.SHOTRULES}

## ASSETS YOU CAN USE
${assetList(p)}

## THE SHOT ${shotId}  (${(t1 - t0).toFixed(1)} s)
narration: "${ls.map(function (l) { return l.text }).join(' ')}"
words with time from shot start: ${s.lines ? shotWords(cut, s, t0, t1) : ''}
planned: ${s.show || ''} · set: ${s.set || ''} · cast: ${(s.cast || []).join(', ')}
before: ${plan[i - 1] ? plan[i - 1].show : '-'} · after: ${nx ? nx.show : '-'}

## CURRENT CODE
\`\`\`js
${code || '(not made yet)'}
\`\`\`

## WHAT I WANT CHANGED
${note || '(see problems)'}
${problems && problems.length ? '\nProblems found by the app:\n' + problems.map(function (x) { return '- ' + x }).join('\n') : ''}

Reply with ONE code block: the full corrected SHOT('${shotId}', {...}) only. Change only what is needed.`;
  };

  /* =================================================================
     7) PUBLISH
     ================================================================= */
  TP.publish = function (p, cut, chapters) {
    var land = cut.aspect === '16:9';
    return `Write the YouTube upload text for this video. Channel style: narrated true stories and facts (like Zack D. Films), dark paper cut-out animation.

VIDEO: ${p.title || p.settings.topic} · ${cut.label} · ${land ? 'long video' : 'YouTube Short'} · ${Math.round(cut.duration || 0)} seconds

SCRIPT:
<<<
${cut.text}
>>>
${p.sources ? '\nSOURCES:\n' + p.sources + '\n' : ''}${chapters && land ? '\nCHAPTER START TIMES (keep these times, improve the names):\n' + chapters + '\n' : ''}
Reply in this format:
TITLE: (under 60 characters, curiosity, no clickbait lies${land ? '' : ', end with #shorts'})
OTHER TITLES: (3 alternatives)
DESCRIPTION: (2–4 short lines that hook, then "Sources:" with the links${land ? ', then the chapters list with times' : ''})
TAGS: (15 comma-separated tags)
HASHTAGS: (3)
THUMBNAIL TEXT: (2–5 words, huge and simple)`;
  };

  /* =================================================================
     6) VOICE (Google AI Studio)
     ================================================================= */
  TP.voiceStyle = function (p) {
    return (p.voiceStyle || 'Read like a gripping documentary narrator: calm, low and close to the mic, building suspense. Short pause after each sentence. Slow down on the big reveals.') +
      ' Voice: ' + (p.settings.voice === 'female' ? 'female' : 'male') + '.';
  };
})();
