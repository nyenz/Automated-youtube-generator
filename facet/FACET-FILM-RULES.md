# FACET FILM RULES — how to turn a narration into a film (v1)

Use these together with `FACET-STYLE-RULES.md` (how things LOOK). This file is how things MOVE, how the
camera behaves and how shots are cut. The engine is `facet-motion.js` (`FM`). Every rule here was learned
from a real test video, so follow all of them.

---

## 0. Hard rules (never break)

1. **No blur, no glow, no sparks, no haze, no lens effects.** Depth comes from layers, silhouettes and colour, never from blur.
2. **Narration only.** No music, no sound effects (the owner adds those himself).
3. **Captions never cover a face or the main action.** Keep them in the empty top area (`captions.y` ≈ 330 on a 1080×1920 frame).
4. **No title cards, no newspaper/headline cut scenes.** Tell everything with people, places and objects.
5. **Logic first.** Before writing a shot, ask: would this really look like this? (Someone lying on their back faces UP; a wet child looks wet; it is cold → breath shows; a rescue has an ambulance.)
6. **Casting:** people are white by default (skin pale or warm); other skin tones only when the story is about that group or a real person looks that way.

---

## 1. Shots and cuts

- **One place = one shot.** While the story stays in the same place, do NOT cut: move the camera instead
  (start close, pull out, glide in). A 20-second piece should have about 2–4 places, so 1–3 cuts.
- **Cut at the end of a sentence**, or at least at a natural pause where the subject changes
  ("…without a pulse, | after more than two hours under the pond"). Never in the middle of a phrase.
- **Cut during a movement**, not after everything has stopped. The eye carries the motion over the cut.
- **Match cuts:** put a bright or strong shape in the new place exactly where the last one was on screen
  (the hole in the ice became the hospital lamp). Work out the screen position from the camera and line it up.
- **Hold a beat after a heavy line** ("without a pulse"): nobody moves, the camera keeps drifting slowly.
- **Shot lengths vary.** Not every shot the same length.

## 2. Camera

- **Always moving a little** (`handheld: 2–3` on every shot) but never shaking.
- **Every move has a reason:** follow the action (follow the thermometer down to the thigh), reveal something
  (pull out to show where we are), or bring us closer to a feeling (glide in to a face). No random moves.
- **Open on the detail the narration names** (the narrator says "7 degrees Celsius" → open on the thermometer
  screen reading 7.0 °C), then pull out to show where we are.
- **Look-room:** leave empty space in front of a face, on the side it is looking toward.
- **Headroom:** do not cut the top of a head in a medium shot; keep faces in the upper third.
- **Shift attention by reframing, never by focus blur:** slide the camera from one subject to the next.
- **Angle tells the feeling:** look down on someone helpless or small (the boy), slightly up at someone capable
  (the medic, the doctor).
- **Use the 3 depth layers** (see 4) so camera moves show depth.

## 3. Acting and movement

- **Wind-up and settle** are built in: every pose change does a tiny move the other way first, then overshoots a
  little and settles. Give poses enough time (`for` ≥ 0.8 s) so this can show.
- **The head follows a beat after the body** (built in for look / tilt).
- **Never frozen:** everyone breathes and sways a little (built in). A kneeling or sitting person also shifts
  their weight (`idle: { lean: 1.5, period: 3.4 }`).
- **Not everyone moves at once.** When one person acts, the others stay almost still, so the eye knows where to look.
- **Acting matches the words:** the medic checks the wrist on "without a pulse", then drops his head; the doctor
  shakes his head on "not folklore" and nods on "case report"; someone looks at the person being talked about.
- **Hand things over logically:** if a hand needs to be free, move the prop to the other hand first
  (`hold: { R: {...prop, to: 6.6}, L: {...prop, from: 6.6} }`).
- **Pick the right view:** side view for walking across, kneeling, sitting, lying, reaching for something;
  front view for talking to the camera and for arms-up poses (a big head hides raised arms in side view).

## 4. Places (sets) — depth without blur

Every place has 3 layers:
- `far` — distant things (hills, trees, a window, a far ambulance). Moves slowly.
- `set` — the ground the cast stands on.
- `front` — **dark, simple silhouettes very close to the camera** (a snow bank, reeds, a curtain edge, an IV pole,
  broken ice). They frame the shot and move faster than everything. Keep them at the edges, never over faces.

Things that belong far away go in the far layer with `layer: 'far'` so they move with it.

## 5. Things you should not show literally → silhouettes

When a moment would look silly, too graphic or too hard to draw in full colour (a child under water, a fall,
an accident, a body), show a **dark partial silhouette** instead (`silhouette: '#132131'`): against a light
(the hole in the ice), sinking or moving out of the frame, never fully explained. It is more cinematic and more respectful.

## 6. Small details that sell the story (add at least 2 per place)

- **Weather and temperature:** breath puffs in the cold (`cycle` with grow + fade), snow on things, wet patches.
- **State of people:** wet clothes and hair are darker; tired people droop; cold people shiver.
- **Cause and effect:** drips falling from wet things (`cycle` with `fall: true`), footprints in snow.
- **The world around:** the vehicle that brought the rescuers, lights that blink (`blink`), a monitor line, a moon in the window.
- **Light that makes sense:** window light lands on the floor as a flat lighter shape; warning lights colour the
  snow with a flat see-through tint. Never glow.
- **One accent colour per shot marks the most important thing** (the orange backboard, the thermometer reading).

## 7. Colour across the film

- Each place has its own colour world (`bg`): cold blue outside at night, deep blue under water, teal in the hospital.
- **Colour follows the story:** colder and darker in danger, slightly warmer when hope comes in.

## 8. Captions

- 3 words at a time at most, a group ends at punctuation.
- **Only key words get the accent colour** (`captions.keys`): numbers, names, the facts that matter
  ("7 DEGREES", "PULSE", "TWO HOURS", "LONGEST", "RECORD"). Everything else is cream.
- Each group pops in (built in). Solid letters with a dark edge. No glow.

## 9. Check before you hand it over

- [ ] Every cut is at a sentence end or a clear pause, and the same place never cuts to itself.
- [ ] The first shot opens on what the narration names first.
- [ ] Every camera move has a reason; every shot has `handheld`.
- [ ] Each place has `far`, `set` and `front` layers and at least 2 small details.
- [ ] Lying people face up; wet things look wet; cold shows breath.
- [ ] Anything too hard or too dark to show is a silhouette.
- [ ] Captions sit in the empty top area and only key words are coloured.
- [ ] No blur, glow, sparks, music or sound effects anywhere.

---

## FM quick reference

```js
window.MYFILM = {
  title, width: 1080, height: 1920, duration,
  captions: { words: [[word, start, end], ...], y: 330, size: 80, keys: ['pulse', 'hours'] },
  shots: [{
    id, from, to, bg, far, set, front,                 // far/set/front: (F, W, H) => { F.begin({width: W, height: H, bg}); ...; return F.render() }
    handheld: 3,
    camera: [{ at: 0, zoom: 3, x, y }, { at: 2, for: 4, zoom: 1.3, x, y }],   // times count from the shot start
    cast: [
      { id, person: { ...F.person spec, view: 'side' }, height, x, ground, seed, z,
        stride, arms, head, lean, idle: { lean, period },
        hold: { R: { id, draw, grip: [x, y], scale, from, to } },
        lying: 'right' | true, silhouette: '#132131', shadow: false,
        moves: [{ at, for, do: 'walk'|'kneel'|'sit'|'reach'|'look'|'tilt'|'nod'|'shake'|'sad'|'hold'|'wave'|'drift'|..., ... }] },
      { id, draw: assetDrawFunction, origin: [x, y], x, ground, scale, z, layer: 'far', flip, rot, opacity,
        cycle: { period, phase, grow: [a, b], fade: [a, b], dx, dy, fall }, blink: { period, on, phase } }
    ] }]
};
```

Example: `films/under-the-ice-20/film.js`.
