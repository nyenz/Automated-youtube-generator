# Paper Cinema Studio

A free app that makes narrated YouTube videos (vertical shorts, and long videos with shorts cut from them) in a **dark paper cut-out 3D style**. All the visuals are code. You don't need an API, a paid service or video editing skills.

**Open the app:** https://nyenz.github.io/Automated-youtube-generator/ (use Chrome on a PC). First time only: in GitHub, open the repo → **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/ (root)** → **Save**. Wait 1–2 minutes.

Click **Load demo** to see a finished example right away.

## How it works

| Step | Who does it | Cost |
|---|---|---|
| 1. Project: topic, type, length, mascot, voice | you | free |
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

## Why different chats still match
- The **look is locked** in `kit/style-kit.js`: paper texture, ink edges, lighting, lens blur, colour grade. AI chats can only build shapes with its tools.
- Every ticket carries the **same style bible**: scale table, palette, mascots, rules and examples.
- The plan gives every asset a **contract**: its exact name, size, parts, moves and set spots. Shots only use those names, so pieces made in different chats fit together.
- The app **checks every answer** for wrong names, missing parts, wrong size, colours outside the palette, crashes, and words that aren't spoken in the shot. If something fails, it writes the fix prompt for you.

## Using it step by step
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

Projects and audio are saved in your browser. Use **Export project** to back up or to move to another PC.

## Files
```
index.html          the app
stage.html          the 3D stage (player, checks, asset sheet), runs inside the app
app/                app code: templates (all prompts), timing (Whisper + alignment), plan checks, trends
kit/style-kit.js    LOCKED look: paper materials, face kit, people, lens, light, sound, recorder
kit/director.js     LOCKED: turns SHOT forms into camera, focus, light, moves, captions
kit/stage.js        runs the stage modes (play, checks, sheet, export)
kit/vendor/         MP4 / WebM muxers (offline video export)
examples/demo.js    the demo project ("A Hand in the Dark")
```

## Running it locally (optional)
Double-clicking `index.html` mostly works. For everything to work (Whisper, video HTML export), run a small local server in this folder, for example `npx serve` or `python -m http.server`. Then open the address it prints.
