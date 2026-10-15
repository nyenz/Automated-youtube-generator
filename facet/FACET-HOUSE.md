# FACET HOUSE STYLE — the rules every Facet video follows (one page)

Every video made with this style must look and feel like it came from the same studio. This page is the summary;
the full detail is in `FACET-STYLE-RULES.md` (how things look) and `FACET-FILM-RULES.md` (how the film is made).
The app puts the short version in every prompt, fills in the house defaults when something is left out, and warns when a rule is broken.

## 1. Look (every asset)
- Low-poly paper figurines: big lit facets (light from the top-left), ridge left of centre, no outlines, matte paper grain.
- People only through `F.person` (same exaggerated proportions for everyone): huge head, no neck, barrel body, short legs, mitten hands, almost no face detail.
- One colour world per place; muted clothes; ONE saturated accent per shot on the most important thing.
- People are white by default unless the story is about another group or a real person looks different. Real people keep their real look.
- Never: glow, sparks, gradients, strokes or filters inside assets.

## 2. Sound and text
- Narration only — no music, no sound effects (added later by hand).
- Captions at the top, 3 words at a time, only key words in the accent colour, never covering faces, never cut off (wrap/shrink is built in).
- No title cards, no headline screens. Text only on real objects (a screen, a page, a sign) and readable when shown.

## 3. Places (every place)
- Three layers: `far` (slow, graded into the world colour), `set` (the ground), `front` (dark near silhouettes at the edges, slightly soft).
- One light per place: a flat rim edge on the lit side and a cast shadow away from it (house default: from the left, pale).
- Weather when outdoors (snow, rain, dust, ash) in three depths.
- At least two small logical details (breath in the cold, drips, a blinking light, a far vehicle, window light).

## 4. Camera (house grammar)
- **House shot sizes:** establishing 1.0 · wide 1.3 · full 1.6 · medium 2.1 · close 3.0 · insert 5.2 (`size: 'medium'`).
- Change size with **cuts** (`cut: true`) on a sentence end, a key word or an action. Alternate sizes.
- Inside a framing: pans and tilts follow the action; at most **one slow push or pull** (0.1–0.3 per second). Never in-and-out.
- Hold every framing at least 1.5 s. Gentle handheld drift always on (house default 2).
- Open on what the narration names first. Inserts (zoom ~5) for documents, screens and readings.
- Focus follows the framing (house default): close and insert shots soften the background; wide shots are sharp. Never blur the subject.
- Same place = one shot with coverage cuts; a new place or time = a cut, ideally a match cut.

## 5. Story logic (the detail pass)
- The plan lists, for every line, what the words name that the picture must show (`details`); every shot shows each one on its word.
- Show it literally: where something is aimed, what an instrument reads (counting to the number said), how the body looks (cold, pale, flushed, limp).
- Show time passing, make documents readable, show outcomes (recovery: colour back, breathing, a living heart line).
- Body states carry over between shots (cold stays cold until the story warms it; breathing stops and returns with the story).
- Things too dark or hard to show literally become a dark partial silhouette against a light.

## 6. Acting
- Every pose change winds up, overshoots slightly and settles (built in); heads follow a beat after the body.
- Acting lands on the words (a nod on "yes", a shake on "not", a check on "pulse"). Only one person acts at a time.
- Never cancel a busy move (keep the hand on the wrist; drop the head instead).

## 7. Before a video is finished
- No app warnings on assets or shots (details, camera grammar, sizes).
- Watch it once with the narration: every named thing visible on its word, every cut on a natural break, nothing cut off.
