# Studio checks (run before every merge)

Headless-browser checks of every feature of the new app (Home, Style, Script & audio, parts, plan, versions, trash, offline, phone widths).

```
python3 -m http.server 8125 &          # from the repo root
mkdir -p /tmp/sc && cd /tmp/sc         # test audio: any narration WAV saved as a.wav, plus long.wav (5 copies with 0.9 s gaps),
                                       # script-short.txt / script-long.txt (its words), notes.txt (any text file)
node <repo>/tools/studio-check/check.js /tmp/sc
node <repo>/tools/studio-check/script-change.js /tmp/sc
```
Every line must say PASS. The test audio can be made from `facet/films/under-the-ice-20/narration.wav` and `words.js`.
