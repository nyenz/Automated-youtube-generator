# FACET KIT — complete handover (papercraft figurine style, 2D code only)

> To the AI reading this: you are taking over this style kit. Read everything. The goal is a set of rules +
> a tiny 2D SVG engine so that any AI (Qwen, DeepSeek, free Claude) can draw new characters, animals and
> objects in ONE consistent style, using code only. No 3D engines (they cost too much to produce).
> The user is a beginner: use simple English and give finished files.

## How the trick works
A real low-poly figurine looks 3D because each flat facet faces a slightly different way, so the light hits it
differently. We fake that in 2D: every shape gets a **ridge** (its imaginary spine). The engine cuts the shape
into big triangles between the outline and the ridge. A triangle on the **left** of the ridge "faces" the light
(top-left) and is lighter; on the right it faces away and is darker. Triangles near the ridge stay mid-tone so the
turn feels soft. Add contact shadows and a soft floor shadow, and a flat drawing reads as a paper sculpture.

# FACET KIT — Papercraft Figurine Style (v1)

You draw pictures **only with JavaScript** that calls a small engine named `F` (file `facet-kit.js`).
The look is a **low-poly paper figurine photographed in a studio**, but everything is flat 2D SVG: no 3D engine.
You never draw triangles yourself. You give each shape an outline, a colour and a **ridge**; the engine
cuts it into big facets and lights them.

---

## 1. Why this style looks the way it does (the exaggerations)

These are the "secret rules" of the style. Every drawing must have all of them.

**Shape and proportion**
1. **Big head:** the head (hair top to beard tip) is about **1/4 of the height** from head top to waist. Head ≈ 1/3.5 of the full body.
2. **Stocky barrel body:** the torso is one wide, almost straight-sided block. Shoulders are **rounded and sloped**, never square corners.
3. **Simple columns for limbs:** arms and legs are straight, thick, untapered tubes. No elbows or knees drawn. Arms hang straight down beside the body and are **long** (hands reach mid-thigh).
4. **Mitten hands, block feet:** hands are one rounded lump (no fingers). Shoes are a flat slab.
5. **Exaggerated identity features:** pick 1–3 features and make them **too big**: a huge beard block, round disc ears sticking out, chunky glasses, a big hair cap, oversized ears or tail on animals. Everything else stays plain.
6. **Faces with almost no detail:** no visible eyes behind glasses (opaque pale lenses), or tiny narrow eye slits. The nose is one small wedge. The mouth is one pale lip shape. The expression comes from the big features, not from the eyes.

**Surface**
7. **Few, big facets:** each part has only a handful of large flat triangles (see `step`). Never a fine mesh.
8. **One light, top-left:** every part has a **lit side (left/top)** and a **shadow side (right/bottom)**. The ridge sits **left of centre**, so the lit side is narrower and brighter and the shadow side wider. That is what makes flat shapes look round.
9. **Soft contrast:** facets differ by small steps in value. Skin and pale cloth are the softest (contrast 0.14–0.2); dark hair and beards are the strongest (0.24–0.35).
10. **No outlines ever.** Parts are separated only by value and colour.
11. **Contact shadows:** where one part tucks under another (beard over chest, vest edge over shirt, chin over neck) add a soft dark blur with `F.occlusion`.
12. **Matte paper:** a fine grain over everything (the engine adds it).

**Colour and staging**
13. **One-colour world:** the background and floor are one warm colour (default burnt orange `#c0612c`) with a soft vignette and a lighter floor.
14. **Muted subject + one loud accent:** clothing is earthy and desaturated (cream, taupe, olive, brown). Exactly **one** saturated accent close to the background colour (orange tie, orange fox).
15. **Studio pose:** front-facing, symmetric, standing still, centred, with a soft ground shadow that falls to the **right**.

---

## 2. Output format

Return exactly one function:

```js
function draw(F) {
  F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 3 });
  // ... F.groundShadow, F.part, F.flat, F.occlusion calls ...
  return F.render('Short description');
}
```

Plain numbers only. Points are `[x, y]`, (0,0) is the top-left. No other libraries, no gradients, no strokes.

---

## 3. The toolbox

| Call | Use |
|---|---|
| `F.begin({width, height, bg, seed})` | Always first. |
| `F.groundShadow(cx, y, width)` | Soft floor shadow under the subject. Draw it **first**. |
| `F.part(points, colour, opts)` | **Main call.** One faceted, lit shape. |
| `F.flat(points, colour, opacity)` | Small solid detail: lenses, buttons, pocket, eye slit, lip edge. |
| `F.occlusion(points, opacity, blur)` | Soft contact shadow (blur 6, 10 or 14). |
| `F.shade(colour, t)` | Lighter (t > 0) or darker (t < 0) version of a colour. Range −0.35…+0.15. |
| `F.render(label)` | Always last: `return F.render('...')`. |

### `F.part` options

```js
F.part(points, colour, {
  ridge: [[x,y],[x,y]],  // the shape's spine. 1 point = dome/pyramid, 2–3 points = long part.
                         // Put it LEFT of centre (about 1/3 from the left edge).
  contrast: 0.24,        // lit vs shadow strength (skin/pale 0.14–0.2, cloth 0.22–0.3, dark hair/beard 0.24–0.35)
  step: 80,              // facet size: bigger = fewer facets. Body parts 80–110, heads/beards 34–45, small parts 20–30
  extra: [[x,y], ...],   // extra crease points inside (more facets there: beard volume, chin, cheeks)
});
```

**Ridge guide**
- Leg / arm / tie: a vertical line from top to bottom, 1/3 in from the left edge of the part.
- Torso / vest panel / beard: vertical line 1/3 in from the left.
- Head / hair cap: from the top-left down. Nose / ear / small round part: a single point near its top-left.
- Animal ears / triangles: a single point at the tip.

---

## 4. Drawing order (back to front)

1. `F.groundShadow`
2. Things behind the body (a tail, a bag on the back)
3. Legs → shoes (+ crotch wedge `F.flat`, darker)
4. Arms → cuffs → hands
5. Torso / shirt
6. Outer layer (vest, jacket panels) → contact shadow at their inner edges → pockets, buttons
7. Collar → tie
8. Contact shadow of the beard/chin on the chest
9. Face → ears → beard → moustache → lip → nose
10. Hair cap
11. Glasses (frames `F.flat`, then pale lenses on top, then a slightly darker strip at the bottom of each lens)

---

## 5. Proportions — the most important rule (exaggeration is built into `F.person`)

**Never draw a person part by part. Always use `F.person(spec)`.** The kit holds the house proportions, so every
character comes out with the same exaggerated body. A person is measured in units: **0 = top of the head, 100 = the ground.**

| Body part | House style | Real person | Exaggeration |
|---|---|---|---|
| Head (hair top → chin) | **≈ 34 units** (child ≈ 40) | ≈ 13 | head is ~2.5× too big |
| Neck | **none** — head sits on the shoulders | visible | removed |
| Torso (chin → crotch) | ≈ 32 units, wide barrel, sloped round shoulders | ≈ 35 | wider than the head |
| Legs (crotch → ground) | **≈ 21 units**, thick and straight | ≈ 47 | legs ~½ length: short, stubby |
| Arms | long: hands hang down to the crotch line | to mid-thigh | longer than the legs |
| Hands | big round mittens, ~⅓ of the head's width | small | oversized, no fingers |
| Feet | flat slabs, wider than the legs | narrow | oversized |
| Ears | round discs sticking out | flat to the head | oversized |
| Face | almost empty: slit/dot eyes or opaque glasses, wedge nose, one lip shape | detailed | removed detail |

**Tall, short, heavy characters:** keep `height` the same for everyone (it sets the HEAD size) and use
`stretch` (body length below the chin) and `wide` (body width): normal `stretch: 1`, tall `1.3`, very tall `1.5`,
short `0.8`; heavy `wide: 1.3`, thin `wide: 0.85`. The head never changes size, so a tall person reads as tall
because their body is long, and they still look like they belong to the same family.

Builds: `'adult'` (stocky man), `'woman'` (narrower shoulders, high waist, skirt flares to ±22 units, tiny stub legs),
`'child'` (head 40 units, rounder, shorter arms).

```js
F.person({
  x: 540, ground: 1000, height: 900, build: 'adult' | 'woman' | 'child',
  skin: '#ece3d6', eyes: 'slits' | 'dots', lips: '#c98a7e',
  hair: { style: 'cap' | 'long' | 'tuft' | 'bald', colour: '#7a4231' },
  beard: '#6e3a2b' | null, glasses: '#5e3326' | null,
  top: '#d3ccbd', vest: '#6c6052' | null, tie: '#cc5321' | null, sleeve: colour (default = top),
  bottom: { type: 'trousers' | 'skirt', colour: '#4e5242' }, legs: colour, shoes: '#5a3124',
  arms: { L: [upperDeg, foreDeg], R: [upperDeg, foreDeg] },   // 0 = hang straight; + = swing outward; − = swing in across the body
  stretch: 1,  wide: 1,                                        // tall/short and heavy/thin, see above
  deferArms: true                                              // returns a function: call it later to draw the arms IN FRONT of something
});
```

**Posing for movement** (all optional; leave them out for the normal studio pose):
```js
  stride: { L: [outDeg, lift], R: [outDeg, lift] },  // swing a leg out (deg) or lift it for a step (units, 0–4)
  head: { tilt: deg, turn: -1..1, nod: units },      // tilt the head, turn it left (-) / right (+), drop it for a nod (0–3)
  lean: deg,                                         // lean the upper body sideways (pivot at the hips)
```
No blur, glow, sparks or other effects are ever added for movement.

Arm poses: hanging `[7, 2]` · hands on hips `[35, -110]` · holding something in front `[-5, -90]` · waving `[150, 30]` ·
carrying a child on the hip: near arm `[30, -122]` (under the child), far arm `[-2, -62]` (across to the child's back).

To make a person hold or carry something: draw the person with `deferArms: true`, then draw the held thing (a child is
another `F.person` with `build: 'child'`, its ground set so its crotch sits at the holder's waist), then call the returned function.

For animals and objects (no `F.person`), apply the same exaggerations by hand: one oversized feature (ears, tail, antlers, snout),
a big simple body mass, short simple legs, almost no face detail.

**Vehicles and objects:** squash and inflate. A car is short and fat: wheels ~40% of the total height, cabin as tall as the
body below it, almost no front/back overhang, opaque pale windows with a darker bottom strip (same as glasses), dark wheel arches,
one small accent (a light). Furniture: thick legs, chunky tops. Buildings: big doors and windows, short and wide.

## 6. Colours

```
background  burnt orange #c0612c   (other worlds: teal #2f6f6f, mustard #c79a3c, dusty blue #5e7f9e — one per picture)
skin        pale #ece3d6   warm #d9b49a   tan #b98a68   brown #8a5a40   deep #5e3a2a
hair/beard  brown #7a4231  dark brown #6e3a2b  black #2e2220  blonde #c9a25e  grey #9a948c
cloth       cream #d3ccbd  taupe #6c6052  olive #4e5242  charcoal #3e3f42  navy #3c4660  sand #b9a78a
leather     #5a3124        accent (one only) orange #cc5321 / rust #b0482a / mustard #d39a2c
frames      #5e3326        lenses #e6ded1
```

Casting rule: characters are white by default (skin `pale` or `warm`); use other skin tones only when the story is about that group or a real person looks that way.

---

## 7. Do and don't

**Do:** big simple masses, 4–12 points per shape, ridge left of centre, one exaggerated feature, contact shadows, one accent colour.
**Don't:** outlines, gradients, many small parts, detailed fingers or eyes, square shoulders, more than one bright colour, pure black or pure white.

---

## 8. Check before you answer

- [ ] One `function draw(F)`, starts with `F.begin`, ends with `return F.render(...)`.
- [ ] Head about 1/4 of the height to the waist; limbs straight columns; mitten hands.
- [ ] Every `F.part` that is bigger than a hand has a `ridge` left of centre.
- [ ] At least one exaggerated feature; face nearly featureless.
- [ ] Contact shadows under the beard/chin and inside jacket edges.
- [ ] Muted clothing, one accent colour, no outlines.

---

## 9. Lessons learned (add one line each time a test picture goes wrong)

1. A ridge in the exact centre splits a shape into two flat halves → put it 1/3 from the left.
2. Contrast above 0.3 on skin or pale cloth looks like a hard split → keep it 0.14–0.2.
3. Square shoulders look like a robot → start the arm shape at the neck with a sloped top.
4. A moustache the same colour as the beard disappears → darken it by −0.25 or more.
5. Fine facets (small step) on big parts look like crumpled foil → use step 80–110 on body parts.
6. Realistic proportions killed the style (long legs, small head looked like a mannequin) → people only via `F.person`, never edit the CANON numbers toward realism.
7. A child drawn small and behind the holder's arms disappears → make the child at least half the holder's height and keep its head clear of the arms.

---

## The engine: facet-kit.js (do not let an AI rewrite it; extend it on purpose only)

```js
/* =========================================================================
   FACET KIT v1 — the "papercraft figurine" look, faked in flat 2D SVG.
   No 3D engine. Each shape gets a RIDGE (its imaginary spine). Big triangles
   fan out from the ridge to the outline, and each triangle is lit or shaded
   by which way it faces: toward the light (top-left) = lighter, away = darker.
   That one trick makes a flat shape read as a folded-paper 3D object.
   ========================================================================= */
(function (root) {
  'use strict';
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb2hex = c => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  /** shade(c, t): t>0 toward warm light, t<0 toward cool shadow. */
  function shade(hex, t) {
    const c = hex2rgb(hex), to = t > 0 ? [255, 244, 226] : [38, 22, 30], k = Math.min(1, Math.abs(t));
    return rgb2hex(c.map((v, i) => v + (to[i] - v) * k));
  }
  function inside(p, poly) {
    let ok = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) ok = !ok;
    }
    return ok;
  }
  function delaunay(pts) {
    const big = 1e5, P = pts.concat([[-big, -big], [big * 2, -big], [-big, big * 2]]), n = pts.length;
    const circ = t => {
      const [a, b, c] = t.map(i => P[i]);
      const d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
      const A = a[0] ** 2 + a[1] ** 2, B = b[0] ** 2 + b[1] ** 2, C = c[0] ** 2 + c[1] ** 2;
      const ux = (A * (b[1] - c[1]) + B * (c[1] - a[1]) + C * (a[1] - b[1])) / d, uy = (A * (c[0] - b[0]) + B * (a[0] - c[0]) + C * (b[0] - a[0])) / d;
      return [ux, uy, (a[0] - ux) ** 2 + (a[1] - uy) ** 2];
    };
    let tris = [[n, n + 1, n + 2]], cs = tris.map(circ);
    for (let i = 0; i < n; i++) {
      const p = P[i], bad = [], keep = [], kc = [];
      tris.forEach((t, k) => { const [ux, uy, r2] = cs[k]; if ((p[0] - ux) ** 2 + (p[1] - uy) ** 2 < r2) bad.push(t); else { keep.push(t); kc.push(cs[k]); } });
      const edges = [];
      bad.forEach(t => [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]].forEach(e => { if (!bad.some(o => o !== t && o.includes(e[0]) && o.includes(e[1]))) edges.push(e); }));
      tris = keep; cs = kc; edges.forEach(e => { const t = [e[0], e[1], i]; tris.push(t); cs.push(circ(t)); });
    }
    return tris.filter(t => t.every(i => i < n)).map(t => t.map(i => P[i]));
  }
  const nearestOnRidge = (p, R) => {
    if (R.length === 1) return R[0];
    let best = null, bd = 1e18;
    for (let i = 0; i < R.length - 1; i++) {
      const [ax, ay] = R[i], [bx, by] = R[i + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - ay) * dy) / L)), q = [ax + dx * t, ay + dy * t];
      const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2; if (d < bd) { bd = d; best = q; }
    }
    return best;
  };
  const centroid = poly => { let x = 0, y = 0; poly.forEach(p => { x += p[0]; y += p[1]; }); return [x / poly.length, y / poly.length]; };
  const pathOf = pts => 'M' + pts.map(p => (+p[0]).toFixed(1) + ',' + (+p[1]).toFixed(1)).join(' L') + 'Z';

  let out = [], W = 1080, H = 1080, BG = '#c0612c', uid = 0, LIGHT = [-0.8, -0.6];

  /** begin({width, height, bg, seed}) — always first. */
  function begin(o = {}) { W = o.width || 1080; H = o.height || 1080; BG = o.bg || '#c0612c'; seed = o.seed || 7; out = []; uid = 0; }

  /**
   * part(points, colour, {ridge, contrast, step, extra, turn})
   *   points   : outline [[x,y],...] (4–12 points)
   *   ridge    : the shape's spine, 1 point (dome/pyramid) or 2–3 points (long parts: limbs, torso, beard)
   *              PUT IT TOWARD THE LIGHT SIDE (a little left of centre) — that is what makes it look rounded
   *   contrast : how strong lit vs shadow side is (default 0.28; skin 0.2; dark hair/beard 0.35)
   *   step     : max edge length before an extra outline point is added (default 110 = big facets)
   *   extra    : extra crease points inside the shape (more, smaller facets there)
   */
  function part(points, colour, o = {}) {
    const step = o.step || 80, con = o.contrast ?? 0.24;
    const ridge = o.ridge || [centroid(points).map((v, i) => v + LIGHT[i] * 12)];
    const pts = [];
    for (let i = 0; i < points.length; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % points.length];
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let k = 0; k < n; k++) pts.push([x0 + (x1 - x0) * k / n + (k ? (rand() - .5) * 6 : 0), y0 + (y1 - y0) * k / n + (k ? (rand() - .5) * 6 : 0)]);
    }
    const rp = [];
    for (let i = 0; i < ridge.length; i++) {           // points along the ridge
      rp.push(ridge[i]);
      if (i < ridge.length - 1) { const [a, b] = [ridge[i], ridge[i + 1]], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / (step * 1.1)));
        for (let k = 1; k < n; k++) rp.push([a[0] + (b[0] - a[0]) * k / n + (rand() - .5) * 8, a[1] + (b[1] - a[1]) * k / n]); }
    }
    const all = pts.concat(rp.filter(p => inside(p, points)), (o.extra || []));
    const L = Math.hypot(...LIGHT), lx = LIGHT[0] / L, ly = LIGHT[1] / L;
    const id = 'f' + (uid++);
    let s = `<clipPath id="${id}"><path d="${pathOf(points)}"/></clipPath><g clip-path="url(#${id})"><path d="${pathOf(points)}" fill="${shade(colour, -con * .4)}"/>`;
    for (const t of delaunay(all)) {
      const c = centroid(t); if (!inside(c, points)) continue;
      const r = nearestOnRidge(c, ridge), dx = c[0] - r[0], dy = c[1] - r[1], d = Math.hypot(dx, dy);
      const facing = d < 1 ? 0.35 : (dx * lx + dy * ly) / d;           // +1 faces the light, -1 faces away
      const fall = Math.min(1, d / 35);                                  // facets near the ridge stay mid-tone: softer turn
      const k = con * (facing * (0.35 + 0.65 * fall) + (rand() - .5) * 0.3) + 0.03;
      const pad = t.map(([x, y]) => [x + (x - c[0]) * .015, y + (y - c[1]) * .015]);
      s += `<path d="${pathOf(pad)}" fill="${shade(colour, k)}"/>`;
    }
    out.push(s + '</g>');
  }
  /** flat(points, colour, opacity) — small solid detail (a lip, a button). */
  const flat = (p, c, op = 1) => out.push(`<path d="${pathOf(p)}" fill="${c}" opacity="${op}"/>`);
  /** occlusion(points, strength) — soft dark contact shadow where one part tucks under another (chin on neck, vest on shirt). */
  const occlusion = (p, op = .35, blur = 10) => out.push(`<path d="${pathOf(p)}" fill="#2a1408" opacity="${op}" filter="url(#ao${blur})"/>`);
  /** groundShadow(cx, y, width) — soft shadow on the floor, pushed to the RIGHT (light is on the left). Draw it first. */
  function groundShadow(cx, y, w) {
    out.push(`<ellipse cx="${cx}" cy="${y}" rx="${w / 2}" ry="${w * .06}" fill="#3a1606" opacity=".28" filter="url(#ao14)"/>`);
    out.push(`<path d="M${cx},${y} L${cx + w * .55},${y - w * .55} L${cx + w * .95},${y - w * .45} L${cx + w * .4},${y + 4}Z" fill="#3a1606" opacity=".14" filter="url(#ao30)"/>`);
  }
  function render(label = 'Facet illustration') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">
<defs>${[6, 10, 14, 30].map(b => `<filter id="ao${b}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${b}"/></filter>`).join('')}
<radialGradient id="bgG" cx="45%" cy="40%" r="75%"><stop offset="0" stop-color="${shade(BG, .1)}"/><stop offset=".6" stop-color="${BG}"/><stop offset="1" stop-color="${shade(BG, -.22)}"/></radialGradient>
<linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG}" stop-opacity="0"/><stop offset="1" stop-color="${shade(BG, .12)}"/></linearGradient>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .4 0 0 0 0 .25 0 0 0 0 .15 0 0 0 .1 0"/></filter></defs>
<rect width="${W}" height="${H}" fill="url(#bgG)"/><rect y="${H * .82}" width="${W}" height="${H * .18}" fill="url(#floorG)"/>
${out.join('\n')}<rect width="${W}" height="${H}" filter="url(#grain)"/></svg>`;
  }

  /* =====================================================================
     PERSON BUILDER — the style's PROPORTIONS live here, not in the asset.
     Units: a person is 100 units tall (0 = top of head, 100 = ground).
     These numbers ARE the exaggeration. Do not "fix" them toward realism.
       head (hair top → chin)  ≈ 34 units  (real people ≈ 13)  → HUGE head
       torso (chin → crotch)   ≈ 32 units  wide barrel, no neck
       legs  (crotch → ground) ≈ 21 units  (real people ≈ 47)  → SHORT stubby legs
       arms  long: hands hang to the crotch line; hands are big mittens
       feet  big flat slabs, wider than the legs
     ===================================================================== */
  const CANON = {
    adult: { faceTop: 18, chin: 47, shoulderY: 50, shoulderX: 19, hipY: 79, chestW: 21, waistW: 19.5, legW: 16, ankle: 96.5,
             upper: 15, fore: 13.5, armW: 10, handR: 6.2, headW: 13.5, earR: 4.6 },
    woman: { faceTop: 18, chin: 46, shoulderY: 49, shoulderX: 16, hipY: 64, chestW: 17.5, waistW: 13.5, legW: 6, ankle: 96.5,
             upper: 14, fore: 12.5, armW: 8.6, handR: 5.4, headW: 12.5, earR: 4.0 },
    child: { faceTop: 12, chin: 50, shoulderY: 52, shoulderX: 15, hipY: 78, chestW: 16.5, waistW: 16.5, legW: 13, ankle: 96,
             upper: 12, fore: 11, armW: 9, handR: 5.4, headW: 16.5, earR: 5.2 },
  };
  function tube(a, b, wa, wb) {                  // a fat rounded limb from a to b
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ux = dx / L, uy = dy / L;
    return [[a[0] + nx * wa / 2 - ux * wa * .15, a[1] + ny * wa / 2 - uy * wa * .15], [b[0] + nx * wb / 2, b[1] + ny * wb / 2],
            [b[0] + ux * wb * .35, b[1] + uy * wb * .35], [b[0] - nx * wb / 2, b[1] - ny * wb / 2],
            [a[0] - nx * wa / 2 - ux * wa * .15, a[1] - ny * wa / 2 - uy * wa * .15], [a[0] - ux * wa * .45, a[1] - uy * wa * .45]];
  }
  const disc = (cx, cy, rx, ry, n = 8) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.283) * rx, cy + Math.sin(i / n * 6.283) * ry]);
  /**
   * person(spec) — draws a whole character in the house proportions.
   * spec = { x, ground, height, build:'adult'|'woman'|'child', skin, mirror:false,
   *          hair:{style:'cap'|'long'|'tuft'|'bald', colour}, beard: colour|null, glasses: frameColour|null,
   *          eyes:'slits'|'dots', top: colour, vest: colour|null, tie: colour|null,
   *          bottom:{type:'trousers'|'skirt', colour}, legs: skinOrSockColour, shoes: colour,
   *          arms: { L:[upperDeg, foreDeg], R:[upperDeg, foreDeg] }   (0 = hanging straight down, + = swing outward, - = swing in across the body)
   *          deferArms: true → arms are NOT drawn; person() returns a function that draws them later (to put arms in front of something) }
   */
  function person(sp) {
    const C = CANON[sp.build || 'adult'], s = (sp.height || 900) / 100, X0 = sp.x || 540, G = sp.ground || 1000;
    // stretch: TALL characters keep the SAME big head and only the body below the chin gets longer (and a bit slimmer).
    //   1 = normal, 1.3 = tall, 1.5 = very tall, 0.8 = short.  `height` is the size of a NORMAL person; a stretched one ends up taller.
    const kS = sp.stretch || 1, chY = C.chin, wb = 1 / (1 + (kS - 1) * .35) * (sp.wide || 1);
    const Yf = y => y <= chY ? y : chY + (y - chY) * kS, TOT = Yf(100);
    const P = (x, y) => [X0 + x * s * (y > chY + .5 ? wb : 1), G - (TOT - Yf(y)) * s];
    const Q = pts => pts.map(([x, y]) => P(x, y));
    const R = pts => pts.map(([x, y]) => P(x, y));
    const SK = sp.skin || '#ece3d6', TOP = sp.top || '#d3ccbd', HAIR = (sp.hair && sp.hair.colour) || '#7a4231';
    const hs = sp.hair && sp.hair.style || 'cap';
    const hw = C.headW, ft = C.faceTop, ch = C.chin, mid = (ft + ch) / 2;
    // POSE (all optional, 0 = the normal studio pose):
    //   stride: { L: [outDeg, lift], R: [outDeg, lift] } — swing a leg out, or lift it (units) for a step
    //   head: { tilt: deg, turn: -1..1, nod: units }    — tilt the head, turn it left/right, drop it for a nod
    //   lean: deg                                        — lean the whole upper body (pivot at the hips)
    const n2 = v => (+v || 0).toFixed(2), G2 = (t, fn) => t ? group(t, fn) : fn();
    const HD = sp.head || {}, turn = Math.max(-1, Math.min(1, +HD.turn || 0));
    const legT = side => { const l = (sp.stride && sp.stride[side]) || [0, 0], d = side === 'L' ? -1 : 1, hp = P(d * C.legW * .5, C.hipY);
      return (l[0] || l[1]) ? `translate(0 ${n2(-(l[1] || 0) * s)}) rotate(${n2(-d * (l[0] || 0))} ${n2(hp[0])} ${n2(hp[1])})` : ''; };
    const hipC = P(0, C.hipY), chinC = P(0, ch);
    const leanT = sp.lean ? `rotate(${n2(sp.lean)} ${n2(hipC[0])} ${n2(hipC[1])})` : '';
    const headT = (HD.tilt || HD.nod) ? `translate(0 ${n2((HD.nod || 0) * s)}) rotate(${n2(HD.tilt)} ${n2(chinC[0])} ${n2(chinC[1])})` : '';
    const turnT = k => turn ? `translate(${n2(turn * hw * k * s)} 0)` : '';
    // 1) hair that hangs behind the body
    if (hs === 'long') G2(leanT, () => G2(headT, () => part(Q([[-hw - 2, ft + 4], [-hw + 1, ft - 6], [0, ft - 9.5], [hw - 1, ft - 6], [hw + 2, ft + 4], [hw + 4, ch + 4], [hw + 2, ch + 13], [0, ch + 11], [-hw - 2, ch + 13], [-hw - 4, ch + 4]]),
      HAIR, { ridge: Q([[-hw * .5, ft - 6], [-hw - 1, ch + 10]]), contrast: .3, step: 14 * s })));
    // 2) legs + shoes (short, thick)
    const B = sp.bottom || { type: 'trousers', colour: '#4e5242' };
    if (B.type === 'skirt') {
      const LG = sp.legs || SK;
      G2(legT('L'), () => part(Q([[-7.5, 90], [-1.8, 90], [-2, C.ankle], [-7, C.ankle]]), LG, { contrast: .15, step: 10 * s }));
      G2(legT('R'), () => part(Q([[1.8, 90], [7.5, 90], [7, C.ankle], [2, C.ankle]]), LG, { contrast: .15, step: 10 * s }));
    } else {
      G2(legT('L'), () => part(Q([[-C.legW - .8, C.hipY], [-0.6, C.hipY], [-0.9, C.ankle], [-C.legW - .3, C.ankle]]), B.colour, { ridge: Q([[-C.legW * .7, C.hipY], [-C.legW * .7, C.ankle]]), contrast: .26, step: 12 * s }));
      G2(legT('R'), () => part(Q([[0.6, C.hipY], [C.legW + .8, C.hipY], [C.legW + .3, C.ankle], [0.9, C.ankle]]), B.colour, { ridge: Q([[C.legW * .3, C.hipY], [C.legW * .3, C.ankle]]), contrast: .26, step: 12 * s }));
      flat(Q([[-6, C.hipY], [6, C.hipY], [0, C.hipY + 6]]), shade(B.colour, -.35));
    }
    const sw = B.type === 'skirt' ? 8.5 : C.legW + 2.5, SH = sp.shoes || '#5a3124';
    G2(legT('L'), () => part(Q([[-sw, C.ankle - .5], [-0.3, C.ankle - .5], [0, 100], [-sw - 1, 100]]), SH, { contrast: .2, step: 10 * s }));
    G2(legT('R'), () => part(Q([[0.3, C.ankle - .5], [sw, C.ankle - .5], [sw + 1, 100], [0, 100]]), SH, { contrast: .2, step: 10 * s }));
    // everything above the hips leans together
    if (leanT) out.push(`<g transform="${leanT}">`);
    // 3) torso: a barrel with sloped rounded shoulders, NO neck
    const sy = C.shoulderY, cw = C.chestW, ww = C.waistW, hy = C.hipY;
    if (B.type === 'skirt') {
      part(Q([[-ww, hy - 1], [ww, hy - 1], [ww + 4, 78], [ww + 8.5, 92], [-ww - 8.5, 92], [-ww - 4, 78]]), B.colour,
        { ridge: Q([[-ww * .5, hy], [-ww * .9, 92]]), contrast: .26, step: 20 * s, extra: Q([[0, 86], [ww + 3, 88], [-ww - 3, 88]]) });
    }
    part(Q([[-cw * .62, ch - 1], [-cw * .92, sy - .5], [-cw, sy + 3], [-cw * .98, sy + 14], [-ww, hy + 1], [ww, hy + 1], [cw * .98, sy + 14], [cw, sy + 3], [cw * .92, sy - .5], [cw * .62, ch - 1]]),
      TOP, { ridge: Q([[-cw * .45, ch], [-ww * .5, hy]]), contrast: .22, step: 16 * s });
    if (sp.vest) {
      [-1, 1].forEach(d => {
        part(Q([[d * cw * .98, sy + 1.5], [d * 6.5, ch + .5], [d * 4, sy + 13], [d * 2.5, hy + 2], [d * ww * 1.02, hy + 2], [d * cw * 1.02, sy + 15]]), sp.vest,
          { ridge: Q([[d * cw * .7, sy + 2], [d * ww * .62, hy]]), contrast: .26, step: 16 * s });
        occlusion(Q([[d * 4, sy + 13], [d * 2.5, hy + 2], [d * 1.2, hy + 2], [d * 2.4, sy + 13]]), .25, 6);
        [sy + 17, sy + 23.5].forEach(y => { flat(Q([[d * 8, y], [d * 15, y], [d * 15, y + 5], [d * 8, y + 5]]), shade(sp.vest, -.12));
                                            flat(Q([[d * 7.6, y - .6], [d * 15.4, y - .6], [d * 15.3, y + 1.2], [d * 7.7, y + 1.2]]), shade(sp.vest, .14)); });
      });
    }
    if (sp.tie) part(Q([[-1.4, ch], [1.4, ch], [3, sy + 16], [0, sy + 19.5], [-3, sy + 16]]), sp.tie, { ridge: Q([[-0.6, ch], [-0.6, sy + 19]]), contrast: .28, step: 10 * s });
    // 4) head: huge, sits straight on the shoulders
    const drawArms = () => {
      ['L', 'R'].forEach(side => {
        const d = side === 'L' ? -1 : 1, ang = (sp.arms && sp.arms[side]) || [6, 2];
        const sh = P(d * C.shoulderX, sy + 2.5), a1 = ang[0] * Math.PI / 180, a2 = (ang[0] + ang[1]) * Math.PI / 180;
        const el = [sh[0] + d * Math.sin(a1) * C.upper * s * kS, sh[1] + Math.cos(a1) * C.upper * s * kS];
        const wr = [el[0] + d * Math.sin(a2) * C.fore * s * kS, el[1] + Math.cos(a2) * C.fore * s * kS];
        const AC = sp.sleeve || TOP;
        part(tube(sh, el, C.armW * s * wb, C.armW * .94 * s * wb), AC, { ridge: [[sh[0] - C.armW * s * .2, sh[1]], [el[0] - C.armW * s * .2, el[1]]], contrast: .22, step: 9 * s });
        part(tube(el, wr, C.armW * .94 * s * wb, C.armW * .86 * s * wb), AC, { ridge: [[el[0] - C.armW * s * .2, el[1]], [wr[0] - C.armW * s * .2, wr[1]]], contrast: .22, step: 9 * s });
        const hx = wr[0] + d * Math.sin(a2) * C.handR * .7 * s, hy2 = wr[1] + Math.cos(a2) * C.handR * .7 * s;
        part(disc(hx, hy2, C.handR * s, C.handR * 1.1 * s, 7), SK, { contrast: .16, step: 6 * s });        // big mitten hand
      });
    };
    occlusion(Q([[-hw + 2, ch - 3], [hw - 2, ch - 3], [hw - 3, ch + 4], [-hw + 3, ch + 4]]), .32, 10);
    if (headT) out.push(`<g transform="${headT}">`);
    // big round ears, drawn behind the head so a turned head hides the far one
    [-1, 1].forEach(d => { const k = d === Math.sign(turn) ? 1.3 : .35;
      part(disc(...P(d * (hw + C.earR * .55) - d * Math.abs(turn) * C.earR * k, mid + 1), C.earR * .75 * s, C.earR * s), '#d8c4b8', { contrast: .2, step: 5 * s }); });
    part(Q([[-hw * .9, ft], [hw * .9, ft], [hw, mid], [hw * .9, ch - 6], [hw * .45, ch], [-hw * .45, ch], [-hw * .9, ch - 6], [-hw, mid]]), SK,
      { ridge: Q([[-hw * .4, ft], [-hw * .3, ch]]), contrast: .16, step: 9 * s });
    const ey = mid + 1.5;
    if (turn) out.push(`<g transform="${turnT(.3)}">`);      // a turned head: the face slides toward the turn
    if (sp.beard) {
      part(Q([[-hw - .2, mid - 1], [-hw * .7, mid + 3], [-hw * .45, mid + 7.5], [hw * .45, mid + 7.5], [hw * .7, mid + 3], [hw + .2, mid - 1], [hw + .6, ch - 4], [hw * .8, ch + 3],
              [hw * .4, ch + 8], [0, ch + 9.5], [-hw * .4, ch + 8], [-hw * .8, ch + 3], [-hw - .6, ch - 4]]), sp.beard,
        { ridge: Q([[-hw * .35, mid], [-hw * .1, ch + 9]]), contrast: .22, step: 6 * s, extra: Q([[-hw * .5, ch - 3], [hw * .5, ch - 3], [0, ch + 4]]) });
      part(Q([[-hw * .5, mid + 6.8], [-0.4, mid + 5], [0.4, mid + 5], [hw * .5, mid + 6.8], [hw * .6, mid + 10.5], [hw * .42, mid + 9.3], [0, mid + 8.3], [-hw * .42, mid + 9.3], [-hw * .6, mid + 10.5]]),
        shade(sp.beard, -.28), { contrast: .18, step: 5 * s });                                      // moustache
      part(Q([[-hw * .35, mid + 8.8], [hw * .35, mid + 8.8], [hw * .28, mid + 11.6], [-hw * .28, mid + 11.6]]), '#e2c2b2', { contrast: .14, step: 4 * s });   // big pale lip
    } else {
      flat(Q([[-hw * .62, ey + 4], [-hw * .3, ey + 4], [-hw * .3, ey + 6.5], [-hw * .62, ey + 6.5]]), '#e0a08e', .45);
      flat(Q([[hw * .3, ey + 4], [hw * .62, ey + 4], [hw * .62, ey + 6.5], [hw * .3, ey + 6.5]]), '#e0a08e', .45);
      flat(Q([[-hw * .28, ch - 5.5], [hw * .28, ch - 5.5], [hw * .18, ch - 3.4], [-hw * .18, ch - 3.4]]), sp.lips || '#c98a7e');
    }
    part(Q([[-1.1, ey - 1.5], [1.1, ey - 1.5], [2, ey + 4.6], [-1.6, ey + 5]]), shade(SK, -.04), { ridge: Q([[-0.6, ey - 1.2]]), contrast: .22, step: 4 * s });   // nose
    if (sp.glasses) {
      [[-hw * .9, -1.2], [1.2, hw * .9]].forEach(([a, b]) => {
        const r = 1.6;
        flat(Q([[a + r, ey - 4.2], [b - r, ey - 4.2], [b, ey - 2.6], [b, ey + 1.6], [b - r, ey + 3], [a + r, ey + 3], [a, ey + 1.6], [a, ey - 2.6]]), sp.glasses);
        flat(Q([[a + 1.4, ey - 2.8], [b - 1.4, ey - 2.8], [b - 1.4, ey + 1.6], [a + 1.4, ey + 1.6]]), '#e6ded1');
        flat(Q([[a + 1.4, ey + .4], [b - 1.4, ey + .4], [b - 1.4, ey + 1.6], [a + 1.4, ey + 1.6]]), '#d4cabb');
      });
      flat(Q([[-1.4, ey - 3], [1.4, ey - 3], [1.4, ey - 1.6], [-1.4, ey - 1.6]]), sp.glasses);
    } else {
      const dark = '#3a2a24';
      if ((sp.eyes || 'slits') === 'dots') { [-1, 1].forEach(d => flat(disc(...P(d * hw * .42, ey), 1.3 * s, 1.5 * s, 6), dark)); }
      else [-1, 1].forEach(d => flat(Q([[d * hw * .7, ey + .3], [d * hw * .2, ey - .6], [d * hw * .18, ey + .9], [d * hw * .66, ey + 1.6]]), dark));
      if (hs !== 'bald') [-1, 1].forEach(d => flat(Q([[d * hw * .72, ey - 3.2], [d * hw * .2, ey - 4.4], [d * hw * .2, ey - 3.4], [d * hw * .7, ey - 2.2]]), shade(HAIR, -.35)));
    }
    if (turn) out.push('</g>');
    // 5) hair on top
    if (turn) out.push(`<g transform="${turnT(.1)}">`);
    if (hs === 'cap') part(Q([[-hw - .4, ft + 7], [-hw, ft - 2], [-hw * .55, ft - 6.5], [0, ft - 7.5], [hw * .6, ft - 6.5], [hw, ft - 2], [hw + .4, ft + 7], [hw * .85, ft + 2.5], [0, ft + 1], [-hw * .85, ft + 2.5]]),
      HAIR, { ridge: Q([[-hw * .5, ft - 6], [-hw * .7, ft + 3]]), contrast: .26, step: 8 * s });
    if (hs === 'long') part(Q([[-hw - 1.2, mid + 3], [-hw - .5, ft - 2], [-hw * .5, ft - 7], [0, ft - 8], [hw * .5, ft - 7], [hw + .5, ft - 2], [hw + 1.2, mid + 3], [hw * .85, mid - 3], [hw * .5, ft + 2], [0, ft + 1.5], [-hw * .55, ft + 3.5], [-hw * .85, mid - 3]]),
      HAIR, { ridge: Q([[-hw * .5, ft - 6], [-hw - .5, mid]]), contrast: .3, step: 8 * s });
    if (hs === 'tuft') part(Q([[-hw - .3, ft + 6], [-hw * .9, ft - 2], [-hw * .4, ft - 5.5], [hw * .3, ft - 6], [hw * .85, ft - 3], [hw + .3, ft + 6], [hw * .7, ft + 2], [0, ft + 1.5], [-hw * .6, ft + 3]]),
      HAIR, { ridge: Q([[-hw * .4, ft - 4], [-hw * .6, ft + 3]]), contrast: .26, step: 7 * s });
    if (turn) out.push('</g>');
    if (headT) out.push('</g>');
    if (leanT) out.push('</g>');
    const arms = () => G2(leanT, drawArms);
    if (sp.deferArms) return arms;
    arms(); return () => {};
  }

  /** group(transform, fn) — draw fn inside an SVG transform, e.g. 'translate(20 0) scale(1.2)' or 'rotate(-20 400 380)' (posing limbs). */
  function group(t, fn) { out.push(`<g transform="${t}">`); fn(); out.push('</g>'); }
  root.F = { begin, part, flat, occlusion, groundShadow, group, render, shade, person, tube, disc, CANON };
})(typeof window !== 'undefined' ? window : globalThis);

```

---

## Example 1 — bearded man (uses F.person)

```js
function draw(F) {
  // ASSET: bearded man in glasses — everything comes from F.person, so the proportions are the house ones.
  F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 3 });
  F.groundShadow(540, 1000, 360);
  F.person({ x: 540, ground: 1000, height: 900, build: 'adult', skin: '#ece3d6',
    hair: { style: 'cap', colour: '#7a4231' }, beard: '#6e3a2b', glasses: '#5e3326',
    top: '#d3ccbd', vest: '#6c6052', tie: '#cc5321', bottom: { type: 'trousers', colour: '#4e5242' }, shoes: '#5a3124',
    arms: { L: [7, 2], R: [7, 2] } });
  return F.render('Papercraft-style bearded man');
}

```

## Example 2 — woman carrying a child (deferArms + a child person)

```js
function draw(F) {
  // ASSET: woman holding a child on her hip.
  F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 5 });
  F.groundShadow(520, 1000, 340);
  // mother: arms drawn later, so they wrap IN FRONT of the child
  const motherArms = F.person({ x: 500, ground: 1000, height: 900, build: 'woman', skin: '#ece3d6',
    hair: { style: 'long', colour: '#c9a25e' }, top: '#d3ccbd', bottom: { type: 'skirt', colour: '#4e5242' }, shoes: '#5a3124',
    arms: { L: [-2, -62], R: [30, -122] }, deferArms: true });
  // child sits on her right hip (viewer right): a person of 360 units tall, its crotch at her waist
  F.person({ x: 676, ground: 770, height: 430, build: 'child', skin: '#efe2d2', eyes: 'dots',
    hair: { style: 'tuft', colour: '#9a6a44' }, top: '#cc5321', bottom: { type: 'trousers', colour: '#3e3f42' }, shoes: '#e7e0d4',
    arms: { L: [-70, -50], R: [14, 6] } });
  motherArms();
  return F.render('Papercraft-style woman holding a child on her hip');
}

```

## Example 4 — height line-up (stretch)

```js
function draw(F) {
  // ASSET: height line-up. Same `height` (= head size) for all; `stretch` makes the body longer, never the head.
  F.begin({ width: 1620, height: 1080, bg: '#c0612c', seed: 4 });
  const base = { ground: 1000, height: 600, skin: '#ece3d6', shoes: '#5a3124', arms: { L: [7, 2], R: [7, 2] } };
  F.groundShadow(330, 1000, 260); F.groundShadow(800, 1000, 260); F.groundShadow(1270, 1000, 260);
  F.person(Object.assign({}, base, { x: 330, build: 'adult', hair: { style: 'cap', colour: '#7a4231' }, beard: '#6e3a2b', glasses: '#5e3326',
    top: '#d3ccbd', vest: '#6c6052', tie: '#cc5321', bottom: { type: 'trousers', colour: '#4e5242' } }));          // normal (stretch 1)
  F.person(Object.assign({}, base, { x: 800, build: 'adult', stretch: 1.5, hair: { style: 'cap', colour: '#2e2220' },
    top: '#3c4660', bottom: { type: 'trousers', colour: '#b9a78a' } }));                                           // very tall
  F.person(Object.assign({}, base, { x: 1270, build: 'woman', stretch: 1.3, hair: { style: 'long', colour: '#c9a25e' },
    top: '#d3ccbd', bottom: { type: 'skirt', colour: '#6c6052' } }));                                              // tall woman
  return F.render('Height line-up: normal man, very tall man, tall woman');
}

```

## Example 5 — car (object)

```js
function draw(F) {
  // ASSET: small car, side view, facing right. Exaggerations: huge wheels, giant bubble cabin, stubby body, tiny overhangs.
  F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 12 });
  const BODY = '#3f6f73', GLASS = '#e6ded1', TYRE = '#2e2622', HUB = '#d3ccbd', TRIM = '#d3ccbd', LIGHT = '#f0d9a8', TAIL = '#cc5321';
  F.groundShadow(560, 905, 820);
  // cabin: a bubble almost as tall as the body below it
  F.part([[290,650],[345,480],[420,428],[690,424],[770,462],[860,650]], F.shade(BODY, .04), { ridge: [[400,440],[380,640]], contrast: .24, step: 90 });
  // windows: pale opaque glass, darker strip at the bottom (same trick as the glasses)
  F.flat([[338,640],[384,500],[430,470],[548,468],[548,640]], GLASS);
  F.flat([[566,640],[566,468],[684,466],[738,494],[800,640]], GLASS);
  F.flat([[338,620],[548,620],[548,640],[338,640]], F.shade(GLASS, -.12)); F.flat([[566,620],[808,620],[800,640],[566,640]], F.shade(GLASS, -.12));
  // body: short and fat, rounded corners
  F.part([[165,790],[168,700],[200,660],[260,642],[880,640],[935,668],[952,720],[948,790]], BODY, { ridge: [[260,655],[250,785]], contrast: .26, step: 100 });
  F.flat([[555,648],[563,648],[563,780],[555,780]], F.shade(BODY, -.25));                      // door line
  F.flat([[590,676],[628,676],[628,686],[590,686]], F.shade(BODY, .25));                        // door handle
  F.flat([[180,722],[940,722],[940,730],[180,730]], F.shade(BODY, -.15));                        // body crease
  // bumpers and lights
  F.part([[930,752],[962,752],[966,792],[926,794]], TRIM, { contrast: .16, step: 30 });
  F.part([[150,752],[182,752],[184,794],[146,792]], TRIM, { contrast: .16, step: 30 });
  F.part(F.disc(920, 694, 20, 22, 8), LIGHT, { contrast: .14, step: 20 });
  F.part([[168,682],[186,680],[186,712],[168,714]], TAIL, { contrast: .16, step: 20 });
  // wheel arches (dark), then oversized wheels in front of the body
  [[330, 800], [770, 800]].forEach(([x, y]) => {
    F.flat(F.disc(x, y - 6, 116, 112, 12), F.shade(BODY, -.45));
    F.part(F.disc(x, y, 104, 104, 10), TYRE, { ridge: [[x - 40, y - 40]], contrast: .22, step: 60 });
    F.part(F.disc(x, y, 46, 46, 8), HUB, { ridge: [[x - 14, y - 14]], contrast: .2, step: 30 });
    F.flat(F.disc(x, y, 12, 12, 6), F.shade(HUB, -.3));
  });
  return F.render('Papercraft-style small car with huge wheels');
}

```

## Example 3 — sitting fox (animal: same exaggerations applied by hand)

```js
function draw(F) {
  // ASSET: sitting fox — proves the same rules work for animals/objects. Canvas 1080 x 1080.
  F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 9 });
  const FUR = '#e0762c', WHITE = '#efe6da', DARK = '#3a2418';
  F.groundShadow(540, 960, 420);
  // tail: big curved wedge wrapping the feet, white tip
  F.part([[640,940],[760,900],[830,820],[840,740],[800,700],[780,780],[720,870],[620,900]], FUR, { ridge: [[650,920],[770,850],[815,740]], contrast: .3 });
  F.part([[800,700],[840,740],[848,690],[826,660]], WHITE, { contrast: .2, step: 30 });
  // body: a tall pear, ridge left of centre
  F.part([[470,520],[600,520],[650,640],[680,800],[660,940],[420,940],[400,800],[420,640]], FUR, { ridge: [[520,530],[500,930]], contrast: .3 });
  F.part([[490,560],[580,560],[600,700],[560,820],[520,820],[480,700]], WHITE, { ridge: [[525,570],[520,810]], contrast: .2 });   // chest bib
  // front legs: straight columns with dark socks (exaggerated thin legs, big body)
  [[452,500],[548,596]].forEach(([a, b]) => {
    F.part([[a,780],[b,780],[b - 4,900],[a + 4,900]], FUR, { ridge: [[a + 14,785],[a + 16,895]], contrast: .28 });
    F.part([[a + 4,900],[b - 4,900],[b,950],[a,950]], DARK, { contrast: .25, step: 30 });
  });
  // head: a wedge pointing at the viewer, big triangle ears
  F.part([[410,330],[470,300],[600,300],[660,330],[640,420],[580,480],[536,520],[490,480],[430,420]], FUR, { ridge: [[480,320],[530,510]], contrast: .3 });
  F.part([[460,430],[535,450],[610,430],[580,480],[536,520],[490,480]], WHITE, { ridge: [[520,450],[534,515]], contrast: .2, step: 40 });   // white muzzle
  F.part([[420,330],[440,190],[500,300]], FUR, { ridge: [[440,200]], contrast: .3, step: 40 });
  F.part([[440,300],[448,230],[482,300]], DARK, { contrast: .2, step: 30 });
  F.part([[650,330],[630,190],[570,300]], FUR, { ridge: [[628,200]], contrast: .3, step: 40 });
  F.part([[630,300],[622,230],[588,300]], DARK, { contrast: .2, step: 30 });
  F.part([[520,500],[552,500],[548,522],[524,522]], DARK, { contrast: .15, step: 20 });   // nose
  F.flat([[478,392],[500,384],[508,398],[486,404]], DARK); F.flat([[562,398],[570,384],[592,392],[584,404]], DARK);   // narrow eyes
  return F.render('Papercraft-style sitting fox');
}

```

---

## Prompt for a free AI

Paste this whole file, then write:

> Using only the FACET KIT rules and the `F` engine above, draw: [describe the scene].
> People must be made with `F.person` (never by hand). First list the parts in drawing order. Then write one
> `function draw(F)`. Then go through "Check before you answer" and fix anything that fails. Output the code in one js code block.

To view the result: open `facet-demo.html` in a text editor, replace one of the `function draw(F)` blocks with the new code,
save, and open it in the browser.
