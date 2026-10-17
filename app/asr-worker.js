/* ASR worker — runs Whisper away from the page so the page never freezes.
   in:  {type:'run', pcm:Float32Array, pieces:[[a,b],...]}
   out: {type:'dl', loaded, total} | {type:'ready'} | {type:'piece', k, words, secs} | {type:'done'} | {type:'error', message} */
var MODELS = ['onnx-community/whisper-base_timestamped', 'onnx-community/whisper-tiny.en_timestamped', 'Xenova/whisper-tiny.en'];
var asr = null;
function load(TF, i) {
  if (i >= MODELS.length) return Promise.reject(new Error('Could not load a Whisper model.'));
  var files = {};
  return TF.pipeline('automatic-speech-recognition', MODELS[i], {
    progress_callback: function (p) {
      if (p.status !== 'progress' || !p.total) return;
      files[p.file] = [p.loaded, p.total]; var a = 0, b = 0; for (var k in files) { a += files[k][0]; b += files[k][1] }
      postMessage({ type: 'dl', loaded: a, total: b });
    }
  }).catch(function (e) { return load(TF, i + 1) });
}
onmessage = function (ev) {
  var m = ev.data; if (m.type !== 'run') return;
  var pcm = m.pcm, P = m.pieces;
  (asr ? Promise.resolve(asr) : import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2').then(function (TF) { return load(TF, 0) }))
    .then(function (a) {
      asr = a; postMessage({ type: 'ready' });
      var k = 0;
      function next() {
        if (k >= P.length) { postMessage({ type: 'done' }); return }
        var s = P[k][0], e = P[k][1], off = s / 16000, t0 = Date.now();
        return asr(pcm.subarray(s, e), { return_timestamps: 'word' }).then(function (out) {
          var words = [];
          (out.chunks || []).forEach(function (c) {
            var w = String(c.text).trim(); if (!w) return;
            var st = (c.timestamp[0] || 0) + off, en = c.timestamp[1] == null ? st + .3 : c.timestamp[1] + off; words.push([w, st, en]);
          });
          postMessage({ type: 'piece', k: k, words: words, secs: (Date.now() - t0) / 1000 });
          k++; return next();
        });
      }
      return next();
    })
    .catch(function (e) { postMessage({ type: 'error', message: String(e && e.message || e) }) });
};
