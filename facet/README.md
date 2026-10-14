# Facet style

- `facet-kit.js` — the style engine (the backbone). People can now be posed: `stride` (leg steps), `head` (tilt/turn/nod), `lean`. No blur or effects.
- `FACET-STYLE-RULES.md`, `FACET-KIT-FULL.md` — the rules for AIs that draw assets.
- `assets/` — example assets (each is one `function draw(F)`).
- `facet-motion.js` — makes the drawings move: people get a new pose each frame (arms, steps, head turn/nod/tilt, lean);
  any asset is moved as a whole (walk, hop, bounce, rock, breathe, shiver). No blur, glow or other effects.
- `motion-demo.html` — a test scene. Open it through a local web server to see it play.
