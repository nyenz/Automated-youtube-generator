/* REVIEW — automatic look check with Gemini (free key from aistudio.google.com).
   The key is kept only in this browser (localStorage). Nothing is sent anywhere else.
   REVIEW.run(items) items: [{ name, kind, look, looks_like, image: dataURL }] -> Promise [{ name, ok, problems: [] }] */
(function () {
  var R = {}; window.REVIEW = R;
  var MODELS = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v } catch (e) { return d } }
  function set(k, v) { try { if (v == null || v === '') localStorage.removeItem(k); else localStorage.setItem(k, v) } catch (e) { } }
  R.key = function () { return get('geminiKey', '') };
  R.setKey = function (k) { set('geminiKey', String(k || '').trim()) };
  R.auto = function () { return get('reviewAuto', 'on') !== 'off' };
  R.setAuto = function (on) { set('reviewAuto', on ? 'on' : 'off') };
  R.model = function () { return get('geminiModel', '') };
  R.setModel = function (m) { set('geminiModel', m) };
  R.ready = function () { return !!R.key() };

  function prompt(items) {
    return 'You are the art director checking cartoon assets for a narrated video. Each picture below is one asset, in a low-poly paper figurine style (simple shapes are fine).\n' +
      'For EACH asset, compare the picture with what it must be. Be strict about: gender (a woman must read as a woman, a man as a man), age (a child must look like a child), skin tone, hair, build and height, clothes, and whether the object is recognisable as what it should be.\n' +
      'Do NOT complain about the simple style, missing fine detail or the background colour.\n\n' +
      items.map(function (it, i) { return 'PICTURE ' + (i + 1) + ': "' + it.name + '" (' + it.kind + ')\n  must be: ' + (it.looks_like || '') + (it.looks_like && it.look ? ' — ' : '') + (it.look || '') }).join('\n') +
      '\n\nReply with JSON only: {"assets":[{"name":"...","ok":true,"problems":["short, concrete fix, e.g. \\"looks like a man: give her long hair and a dress\\""]}]}';
  }
  function call(model, body) {
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(R.key()), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) { var e = new Error((j && j.error && j.error.message) || ('HTTP ' + r.status)); e.status = r.status; throw e } return j }) });
  }
  R.run = function (items) {
    if (!R.key()) return Promise.reject(new Error('No Gemini key yet. Add it in ⚙ Settings.'));
    var parts = [{ text: prompt(items) }];
    items.forEach(function (it, i) {
      var m = /^data:([^;]+);base64,(.*)$/.exec(it.image || ''); if (!m) return;
      parts.push({ text: 'PICTURE ' + (i + 1) + ': ' + it.name }); parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
    });
    var body = { contents: [{ role: 'user', parts: parts }], generationConfig: { responseMimeType: 'application/json', temperature: .2 } };
    var list = R.model() ? [R.model()].concat(MODELS) : MODELS;
    function tryModel(i, last) {
      if (i >= list.length) return Promise.reject(last || new Error('Gemini did not answer.'));
      return call(list[i], body).catch(function (e) { if (e.status === 404 || /not found|not supported/i.test(e.message)) return tryModel(i + 1, e); throw e });
    }
    return tryModel(0).then(function (j) {
      var txt = ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(function (p) { return p.text || '' }).join('');
      var data; try { data = JSON.parse(txt) } catch (e) { var a = txt.indexOf('{'), b = txt.lastIndexOf('}'); data = JSON.parse(txt.slice(a, b + 1)) }
      var by = {}; (data.assets || []).forEach(function (x) { if (x && x.name) by[x.name] = x });
      return items.map(function (it) { var x = by[it.name] || {}; return { name: it.name, ok: x.ok !== false, problems: Array.isArray(x.problems) ? x.problems.filter(Boolean) : [] } });
    });
  };
})();
