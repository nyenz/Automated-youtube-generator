# Sound guide: sound effects made by code

This guide is the rulebook for every sound effect the app makes with code (`studio/forge.js`, called FORGE).
No recorded files are used. Every new sound and every change must follow it.

## 1. The big rules

1. **One sound at a time.** A recipe makes one thing happening, such as one wave or one explosion. It never makes a whole scene.
   A scene, like a beach, is several recipes placed on the timeline.
2. **At most 5 layers.** Each layer has **one job** and a plain name (snap, body, debris, tail…).
   If a sound needs a sixth layer, it is two sounds.
3. **Layers follow each other in a logical order.** Things happen in real order: contact first, then body, then texture, then the tail.
   Debris lands *after* the blast. The foam comes *after* the wave breaks.
4. **Physics decides the shape. Nothing is random for its own sake.**
   - Bigger things are **lower** and **longer**.
   - Far things lose their **highs**. They get **quieter**, have **more echo**, and an echo can come back off hills and walls.
   - A hard material makes a **short, bright snap**. A soft material makes a **dull, slow** one.
   - The sound fades out the way energy really dies: quickly at first, then slowly (an exponential decay).
5. **Beautiful, not noisy.** Every layer is filtered to its own band so the layers don't fight each other.
   Noise is always shaped by a filter and an envelope. It is never left raw.
6. **The same world for every sound.** Distance and room are done by one shared "space" (air filter, room echo, far echo).
   That way all sounds sit in the same place.

## 2. The layer jobs (pick at most 5)

| Job | What it is | Typical tools |
|---|---|---|
| Snap / contact | the first few milliseconds of contact | very short high noise burst |
| Punch / weight | the push you feel | falling low tone (sine) |
| Body | the material that was hit or moved | low-passed pink noise |
| Texture | many small parts (debris, drops, crunch, splinters, pebbles) | many tiny filtered grains, fewer over time |
| Tail / air | the dying rumble, wash or hiss | brown or pink noise with a slow decay |

Beds, like wind, use slow automation: random gusts and pitch moves on filters and volume.

## 3. The controls (same for every sound)

| Control | What it changes |
|---|---|
| Size | lower pitch, longer decay, more pieces |
| Distance | duller (air filter), quieter, more echo, plus an extra echo when it is far |
| Room | from open air to a big hall |
| Length | shorter or longer (also the number of beats, beeps or steps) |
| Brightness | duller or sharper (more crunch, more whistle) |
| Take | another natural variation of the same sound (a different random seed) |
| Layers | each layer can be turned off to hear what it adds |

## 4. The checks: every sound must pass all of them

I (Claude) can't listen, so every sound is measured with numbers before it is used. David's ears give the final verdict.

1. **No clipping:** the loudest point is at or under -1 dB.
2. **Not too quiet:** the average loudness is above -45 dB.
3. **No offset:** the wave is centred around zero.
4. **Clean start:** there is no click on the first sample.
5. **Clean end:** the last 20 ms are below -45 dB.
6. **Right length** for that kind of sound (each recipe has a range).
7. **Right attack:** hits get loud at once (within a few hundredths of a second), and builds (wind, riser, engine) get loud within their time.
8. **Right brightness:** the middle spectral centroid of the loud moments is inside the recipe's band.
   For example, an explosion is 300 to 1600 Hz and a click is 1100 to 4600 Hz.
9. **At most 5 layers.**

The Code sounds window shows this list live while you shape a sound. The test `tools/studio-check/forge.js` renders every recipe at the
default, both ends of every control and several takes, and every sound must pass every check.

## 5. The sounds that exist

whoosh, impact (Size up = deep boom), explosion, thud (body fall), heartbeat, beep (thermometer = 3 beeps),
click, ice crack, splash, wave, wind, siren, footsteps (Brightness = snow or gravel crunch), door, engine start,
breath or gasp, riser, bell or ding, paper.

How words find a sound: the search words of a cue ("ice crack", "body fall", "distant explosion") are matched to a recipe.
Extra words set the controls:
- big, deep, heavy → bigger
- small, soft → smaller
- distant, far → far away
- close → close up
- hall, cave, inside → a room
- sharp, metal, snow → brighter
- muffled, underwater → duller
- long or short → longer or shorter

## 6. Where sounds come from on the Sound page

For each cue the app looks in this order:
1. **your own folder**
2. **made by code** (3 takes)
3. **Freesound**

**Redo** moves to the next one. On a code-made sound, **Shape** opens the Code sounds window so you can change it and keep it.
Code sounds are saved inside the project as WAV files, so the preview and the MP4 use exactly the same sound.

## 7. Adding a new recipe (steps for any model)

1. Name the one thing it is. Write down its real order of events.
2. Choose at most 5 layer jobs from section 2. Give each one a name and one plain sentence.
3. Tie every number to physics. Size, distance and brightness must change it in the real direction.
4. Give it a length range, an attack limit and a brightness band.
5. Add its words to the word list.
6. Run `tools/studio-check/forge.js`. Every line must say PASS at every control setting.
7. David listens and gives the final verdict.
