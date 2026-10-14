# Facet style

- `facet-kit.js` — the style engine (the backbone). **Never edit it.**
- `FACET-STYLE-RULES.md`, `FACET-KIT-FULL.md` — the rules for AIs that draw assets.
- `assets/` — example assets (each is one `function draw(F)`).
- `facet-motion.js` — makes the drawings move, **without changing the kit**: people get new arm angles each frame;
  any asset is moved as a whole (walk, hop, bounce, rock, breathe, shiver). No blur, glow or other effects.
- `motion-demo.html` — a test scene. Open it through a local web server to see it play.
