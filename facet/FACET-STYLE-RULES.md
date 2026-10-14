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
