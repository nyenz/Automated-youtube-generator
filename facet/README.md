# Facet style

- `facet-kit.js` — the style engine (the backbone). People can now be posed: `stride` (leg steps), `head` (tilt/turn/nod), `lean`. No blur or effects.
- `FACET-HOUSE.md` — the HOUSE STYLE: the one-page rule set every Facet video follows (uniform look, sound, camera, story logic, acting).
- `FACET-STYLE-RULES.md` — the rules for AIs that draw assets (how things look).
- `FACET-FILM-RULES.md` — the rules for AIs that make films (shots, cuts, camera, acting, depth, details, captions).
- `FACET-KIT-FULL.md` — everything in one file (rules + engine + film rules) to paste into an AI.
- `assets/` — example assets (each is one `function draw(F)`).
- `facet-motion.js` — makes the drawings move: people get a new pose each frame (arms, steps, head turn/nod/tilt, lean);
  any asset is moved as a whole (walk, hop, bounce, rock, breathe, shiver). No blur, glow or other effects.
- `motion-demo.html` — a test scene. Open it through a local web server to see it play.
- `films/under-the-ice-20/` — the first 22 s of "Under the Ice" in this style (`film.html` plays it with the narration).
- New in the kit: side view people (`view: 'side'`: walk, kneel, sit, lie), things held in the hand (`held`), flat text (`F.text`).
- New in motion: films made of shots (cuts only at sentence ends), sets, held props, lying people, captions. Narration only — no music or sound effects.
