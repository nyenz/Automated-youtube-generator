# Paper Cinema Studio

A free app that makes narrated YouTube videos (vertical shorts, and long videos with shorts cut from them) in one of three locked styles: **Facet** (low-poly paper figurines filmed like a movie — the default), **Low-Poly Paper** (flat faceted cut-outs in a 2.5D world) or **Dark Paper Cinema** (dark 3D paper cut-outs). All the visuals are code. You don't need an API, a paid service or video editing skills.

**Open the app:** https://nyenz.github.io/Automated-youtube-generator/ (use Chrome on a PC). First time only: in GitHub, open the repo → **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/ (root)** → **Save**. Wait 1–2 minutes.

Click **Load demo** to see a finished example right away.

## How it works

| Step | Who does it | Cost |
|---|---|---|
| 1. Project: topic, type, length, **visual style**, mascot, voice | you | free |
| 2. Topic ideas from what's trending (Wikipedia, YouTube, Hacker News) | Claude or any chat | free |
| 3. Script: research, fact-check, human tone, ready for TTS | **Claude** (your subscription) | — |
| 4. Voice: Google AI Studio text-to-speech, upload the audio here | Google AI Studio | free |
| 5. Timing: the app finds when every word is spoken (Whisper in your browser) | the app | free |
| 6. Plan: every asset and every shot | Claude (best) or any chat | free |
| 7. Assets: one prompt ("ticket") per chat, several chats at once | Qwen / DeepSeek / free Claude | free |
| 8. Shots: fill-in forms (camera, focus, light, moves, sound) | any chat | free |
| 9. Watch & fix: click a bad shot, copy the fix prompt, paste the answer back | any chat | free |
| 10. Export: frame-perfect MP4 (1080 × 1920, or 1920 × 1080 for long videos) with narration, sound effects and captions | the app | free |
| 11. Publish: thumbnail from your video + title, description, tags, chapters | the app + Claude | free |

## Visual styles
Pick the style on the Project page. New projects start in **Facet**; older projects keep their style.
- **Facet** (default): people are a short description (`F.person`) drawn in fixed exaggerated proportions; props and sets are drawn with big lit facets (`F.part`).
  Sets have three layers (far, ground, dark near silhouettes) so the camera shows depth. Shots are forms: camera keyframes on spoken words, subtle focus and rack focus,
  aerial perspective, acting on the words, held props, silhouettes, small looping details (breath, drips, blinking lights). Narration only — no generated music or sound effects.
  Rules: `facet/FACET-HOUSE.md` (the one-page house style every video follows), `facet/FACET-STYLE-RULES.md` (look) and `facet/FACET-FILM-RULES.md` (film).
  The app fills in house defaults (light, focus, camera drift, shot sizes) and warns when a rule is broken, so all videos come out uniform. Demo: "Under the Ice (Facet)" with the real narration.
- **Low-Poly Paper**: people, props and sets are painted as flat faceted pictures (one light, no outlines). Everything is a cut-out, so the AI only draws pictures and the kit does the rest: jointed people with live faces (12 emotions), walking, waving, pointing, holding things, sitting. The camera is a real camera in a 2.5D world: parallax, depth-of-field blur and focus pulls, fog, floating dust, light shafts, blurred foreground shapes, film grain / gate weave / halation, mood grading, attention spotlight, flow continuity between shots, composition with room in front of the face, captions that move away from faces. Same SHOT forms, same sound, same export.
- **Dark Paper Cinema**: the original dark 3D paper cut-out look.
Changing the style after assets exist means the assets must be made again (the shots can stay, but check them in Watch & fix).

## Why different chats still match
- The **look is locked** in the kit (`kit/style-kit.js` for Dark Paper, `kit/lp/` for Low-Poly): materials, lighting, lens blur, colour grade. AI chats can only build shapes with its tools.
- Every ticket carries the **same style bible**: scale table, palette, mascots, rules and examples.
- The plan gives every asset a **contract**: its exact name, size, parts, moves and set spots. Shots only use those names, so pieces made in different chats fit together.
- The app **checks every answer** for wrong names, missing parts, wrong size, colours outside the palette, crashes, and words that aren't spoken in the shot. If something fails, it writes the fix prompt for you.

## Easy mode (start here)
Click **⚡ Easy mode** in the top bar. You get 5 steps: **Start** (pick the style, upload your audio, script optional: the app listens and writes the words if you leave it empty), **Plan** (one prompt for Claude), **Assets** (grouped into a few "chat groups", one per free chat), **Shots** (one Claude Opus chat does them all), **Watch & fix** and **Export**. A gold box at the top of every page always says what to do next; **Show me** flashes the exact button, and the next button always has a gold ring. Hover any button for what it does and what comes after (turn this off with **Tips**). Long jobs (timing, checks, export) show a progress panel with the time left. **📋 Paste & read / Paste & check** paste the chat answer and check it in one click; in Easy mode anything that passes is approved by itself. If your script and audio don't match, the app tells you and offers to use what the audio says.

## Using it step by step (full control)
1. Click **+ New**. Fill in the Project page.
2. **Topic**: load trending lists → **Copy topic prompt** → paste it into Claude → paste the answer back → click **Use** on an idea.
3. **Script**: add your links and notes (and a transcript from a channel whose style you like) → **Copy script prompt** → paste it into Claude → paste the answer back → **Read the answer**.
4. **Voice & timing**: open Google AI Studio → paste the voice style and the script → download the audio → **Upload audio** → **Make timing**.
5. **Plan**: **Copy plan prompt** → paste it into Claude → paste the JSON back → **Read plan**.
6. **Assets**: for each ticket, **Copy prompt** → paste it into a NEW chat → paste the answer back → **Check** → **Approve**. Open the **Asset sheet** to compare everything side by side.
7. **Shots**: same as assets, one ticket per chat. You can also tick "Claude mode" to do a whole cut in one chat.
8. **Watch & fix**: press Play. Click a shot to jump to it. Write what's wrong → **Copy fix prompt**, optionally with **Download video HTML** attached in the chat → paste the fixed shot → **Apply & check**.
9. **Export**: **Export video (MP4)** renders every frame at full quality. It doesn't depend on your PC's speed; a slow PC just takes longer. If the browser can't make MP4, it makes WebM, which YouTube also accepts.
10. **Publish**: pick a frame and type the text → **Make thumbnail**. **Copy publish prompt** → paste it into Claude for the title, description, tags and chapters.

## Extras
- **Background music**: Project page → Sound → add a free track from the YouTube Audio Library. It loops and gets quieter while the narrator talks. You can set the volumes for narration, sound effects and music.
- **Caption style**: size, height, words at a time, colour of the spoken word.
- **Smart paste**: on Assets and Shots, paste any chat answer into one box. The app finds which pieces it contains and checks them.
- **Approve all**: approves everything that passed its check.
- **Warning** if you change the script or timing after making the plan.
- **Keys** in Watch & fix: Space = play/pause, ← → = previous/next shot.
- **Look** (Project page): *Film look* (grain, gentle frame wobble, glow around lights) and *Atmosphere* (depth haze, floating dust/bubbles/snow/embers, soft light beams), plus small blurred foreground shapes for depth. They're tuned to stay subtle.
- **Mood grading**: every light mood also sets the colour (cold blue, warm gold, faded sepia `flashback` for the past).
- **Composition**: subjects sit on a third with room in front of the face, eyes on the upper third in vertical shots. Inside rooms the camera slides closer with a wider lens instead of hitting the walls.
- **Proportions**: if a chat builds something more than 2.5× too big or small, the app rescales it to the plan's size.
- **Continuous scenes**: shots in the same place flow into each other: the camera glides on and people keep their positions. It only cuts when the place or time changes, or with `transition: 'cut'`.
- **Captions never block faces**: they sit at the bottom, or move to the top when a face or the subject is there.
- **Balanced framing**: long shots keep everyone sharp, characters don't fill the screen, and small props never become giant.
- **No title cards**: the story is told with pictures and narration only.
- **Real people**: 9 skin tones, 8 hair colours (including grey and white), beards, mustaches and stubble, long hair and braids, so people in true stories are recognisable.
- **Characters**: body language follows the emotion (scared hunches, determined stands tall), small weight shifts, and `talk` moves the mouth in time with the narration's syllables.
- **Natural action**: sneak, crouch, hide (ducks behind cover and peeks out), peek, sit, sleep, yawn, cheer, cower, shiver, stomp, and `emerge`/`burrow` for things coming out of or going into the ground (dirt burst and mound). Listeners look at whoever is talking or at what is pointed at by themselves.
- **Attention focus** (Look card): while someone talks or acts, everything around them gets slightly darker, greyer and softer, so the viewer's eye goes to the right place. It fades in and out by itself; `spot` points it at anything, `spotlight: false` turns it off.
- **Soundtrack**: rendered in one pass, the same in preview and export. A piano-led score that follows the mood (calm, playful, mystery, tension, hope, sad, flashback) and dips under the narration; ambience (night, day, rain, underwater, room, fire); automatic footsteps and action sounds placed left/right by where things are on screen. The final mix is levelled to YouTube loudness so it doesn't sound quiet on phones. Your own music track replaces the score.

Projects and audio are saved in your browser. Use **Export project** to back up or to move to another PC.

## Files
```
index.html          the app
stage.html          the 3D stage (Dark Paper): player, checks, asset sheet, runs inside the app
stage-lp.html       the Low-Poly stage (same modes)
stage-facet.html    the Facet stage (same modes)
facet/              LOCKED (Facet): the engine (facet-kit.js), motion (facet-motion.js), rules, films
kit/facet/stagekit.js  Facet KIT + DIRECTOR for the app stage (assets, SHOT forms, captions, checks)
app/templates-facet.js Facet prompts for plan, asset and shot tickets
app/                app code: templates (all prompts), timing (Whisper + alignment), plan checks, trends
kit/style-kit.js    LOCKED look (Dark Paper): paper materials, face kit, people, lens, light, sound, recorder
kit/lp/engine.js    LOCKED (Low-Poly): the faceted drawing engine
kit/lp/rig.js       LOCKED (Low-Poly): jointed rigs, props, sets, asset registry
kit/lp/people.js    LOCKED (Low-Poly): K.person, live faces, the two mascots
kit/lp/render.js    LOCKED (Low-Poly): 2.5D camera, blur, fog, grade, grain, glow
kit/lp/director.js  LOCKED (Low-Poly): SHOT forms to camera, focus, light, moves, captions
kit/lp/check.js    Low-Poly asset checks, sheet and preview
kit/director.js     LOCKED: turns SHOT forms into camera, focus, light, moves, captions
kit/sound.js        LOCKED: offline soundtrack (score, ambience, effects, mix)
kit/piano.js        piano samples for the score
kit/stage.js        runs the stage modes (play, checks, sheet, export)
kit/vendor/         MP4 / WebM muxers (offline video export)
examples/demo.js    demo 1 ("A Hand in the Dark", Dark Paper)
examples/under-the-ice-facet/ demo ("Under the Ice", Facet, with narration; build.js makes demo.js)
examples/demo-lp.js demo ("The Lantern", Low-Poly)
examples/demo2.js   demo 2 ("The Missing Milk", 2:00 test video)
examples/the-missing-milk.html  demo 2 as a standalone playable page
```

## Running it locally (optional)
Double-clicking `index.html` mostly works. For everything to work (Whisper, video HTML export), run a small local server in this folder, for example `npx serve` or `python -m http.server`. Then open the address it prints.

## Credits
Piano samples: Salamander Grand Piano by Alexander Holm (CC-BY 3.0), via the Tone.js audio collection.

## Asset chats: automatic batching
On the Assets step, **Auto by complexity** (default) splits the asset tickets for you: a hard asset (a set, a complex creature or machine) gets a chat of its own,
medium ones (a vehicle, a machine, an animal) go two per chat, and simple ones (people, small props, small details) go 3–6 per chat. Similar kinds stay together,
so one chat makes things that match. You can still choose a fixed number of difficulty points per chat, or everything in one chat for Claude.
