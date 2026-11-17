/* EXPORT — the finished MP4: every frame drawn by the project file (seek), the soundtrack mixed by SOUND, encoded in the browser.
   H.264 + AAC in an MP4 when the browser can (Chrome and Edge can); otherwise VP9 + Opus in a WebM. */
(function () {
  'use strict';
  var X = {}; window.EXPORTER = X;
  var CANCEL = false;
  X.cancel = function () { CANCEL = true };
  X.supported = function () { return !!(window.VideoEncoder && window.AudioEncoder && window.VideoFrame) };
  function pick(W, H, FPS, br) {
    var vids = [{ c: 'avc1.640028', fmt: 'mp4' }, { c: 'avc1.4d0028', fmt: 'mp4' }, { c: 'avc1.42003e', fmt: 'mp4' }, { c: 'vp09.00.40.08', fmt: 'webm' }, { c: 'vp8', fmt: 'webm' }];
    return vids.reduce(function (pr, v) {
      return pr.then(function (got) {
        if (got) return got;
        var cfg = { codec: v.c, width: W, height: H, bitrate: br, framerate: FPS }; if (v.fmt === 'mp4') cfg.avc = { format: 'avc' };
        return VideoEncoder.isConfigSupported(cfg).then(function (r) {
          if (!r.supported) return null;
          var auds = v.fmt === 'mp4' ? [['mp4a.40.2', 'aac'], ['opus', 'opus']] : [['opus', 'A_OPUS']];
          return auds.reduce(function (p2, a) { return p2.then(function (g) { if (g) return g; var ac = { codec: a[0], sampleRate: 48000, numberOfChannels: 2, bitrate: 192000 }; return AudioEncoder.isConfigSupported(ac).then(function (ra) { return ra.supported ? { fmt: v.fmt, vcfg: cfg, acfg: ac, amux: a[1] } : null }).catch(function () { return null }) }) }, Promise.resolve(null));
        }).catch(function () { return null });
      });
    }, Promise.resolve(null));
  }
  /* host: the project file frame; mix: AudioBuffer; onProgress(stage, done 0..1, secondsLeft) */
  X.run = async function (host, mix, dur, wide, onProgress) {
    CANCEL = false;
    var W = wide ? 1920 : 1080, H = wide ? 1080 : 1920, FPS = 30, N = Math.ceil(dur * FPS);
    var P = await pick(W, H, FPS, 12e6);
    if (!P) throw new Error('This browser cannot make video files. Use Chrome or Edge on a computer.');
    var mp4 = P.fmt === 'mp4', Mx = mp4 ? window.Mp4Muxer : window.WebMMuxer, target = new Mx.ArrayBufferTarget();
    var muxer = mp4 ? new Mx.Muxer({ target: target, video: { codec: 'avc', width: W, height: H, frameRate: FPS }, audio: { codec: P.amux, sampleRate: 48000, numberOfChannels: 2 }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' })
      : new Mx.Muxer({ target: target, video: { codec: P.vcfg.codec === 'vp8' ? 'V_VP8' : 'V_VP9', width: W, height: H, frameRate: FPS }, audio: { codec: 'A_OPUS', sampleRate: 48000, numberOfChannels: 2 }, firstTimestampBehavior: 'offset' });
    onProgress && onProgress('audio', 0, 0);
    var aq = [], aerr = null, aenc = new AudioEncoder({ output: function (c, m) { aq.push([c, m]) }, error: function (e) { aerr = e } });
    aenc.configure(P.acfg);
    var A1 = Math.min(mix.length, Math.round(dur * 48000)), L = mix.getChannelData(0), R = mix.numberOfChannels > 1 ? mix.getChannelData(1) : L, step = 4800;
    for (var i = 0; i < A1; i += step) {
      var n = Math.min(step, A1 - i), buf = new Float32Array(n * 2); buf.set(L.subarray(i, i + n), 0); buf.set(R.subarray(i, i + n), n);
      var ad = new AudioData({ format: 'f32-planar', sampleRate: 48000, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(i / 48000 * 1e6), data: buf });
      aenc.encode(ad); ad.close();
    }
    await aenc.flush(); if (aerr) throw aerr;
    var ai = 0;
    function flushAudio(ts) { while (ai < aq.length && aq[ai][0].timestamp <= ts) { muxer.addAudioChunk(aq[ai][0], aq[ai][1]); ai++ } }
    var verr = null, venc = new VideoEncoder({ output: function (c, m) { flushAudio(c.timestamp); muxer.addVideoChunk(c, m) }, error: function (e) { verr = e } });
    venc.configure(P.vcfg);
    var canvas = document.createElement('canvas'), t0 = performance.now();
    for (var f = 0; f < N; f++) {
      if (CANCEL) throw new Error('Export stopped.');
      var t = Math.min(dur - .001, f / FPS);
      var svg = await host.ask({ cmd: 'frame', t: t });
      if (!svg || typeof svg !== 'string') throw new Error('Frame ' + f + ' could not be drawn.');
      await window.GK.raster(svg, W, H, canvas);
      var vf = new VideoFrame(canvas, { timestamp: Math.round(f * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
      venc.encode(vf, { keyFrame: f % (FPS * 2) === 0 }); vf.close();
      if (verr) throw verr;
      while (venc.encodeQueueSize > 6) await new Promise(function (r) { setTimeout(r, 4) });
      if (f % 6 === 0) { var el = (performance.now() - t0) / 1000; onProgress && onProgress('video', f / N, f ? el / f * (N - f) : 0); await new Promise(function (r) { setTimeout(r, 0) }) }
    }
    await venc.flush(); if (verr) throw verr; flushAudio(1e15);
    muxer.finalize();
    onProgress && onProgress('done', 1, 0);
    return { blob: new Blob([target.buffer], { type: mp4 ? 'video/mp4' : 'video/webm' }), ext: mp4 ? 'mp4' : 'webm', seconds: (performance.now() - t0) / 1000 };
  };
})();
