/* STORE — keeps every project safe.
   1) IndexedDB in the browser (asked to be "persistent", so the browser does not clear it by itself)
   2) a copy of every project in a folder the user picks on the PC (so clearing the browser loses nothing)
   3) the last 20 versions of each project (undo for big changes) */
(function () {
  var S = {}; window.STORE = S;
  var DB = null, NAME = 'nyenz-studio', VER = 1;

  function open() {
    if (DB) return Promise.resolve(DB);
    return new Promise(function (res, rej) {
      var r = indexedDB.open(NAME, VER);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('blobs')) d.createObjectStore('blobs');
        if (!d.objectStoreNames.contains('history')) d.createObjectStore('history', { keyPath: 'key' });
        if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings');
      };
      r.onsuccess = function () { DB = r.result; res(DB) };
      r.onerror = function () { rej(r.error) };
    });
  }
  function tx(store, mode, fn) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(store, mode), s = t.objectStore(store), out;
        out = fn(s);
        t.oncomplete = function () { res(out && 'result' in out ? out.result : out) };
        t.onerror = function () { rej(t.error) }; t.onabort = function () { rej(t.error) };
      });
    });
  }
  S.persist = function () { try { return navigator.storage && navigator.storage.persist ? navigator.storage.persist() : Promise.resolve(false) } catch (e) { return Promise.resolve(false) } };

  /* ---------- projects ---------- */
  S.list = function () { return tx('projects', 'readonly', function (s) { return s.getAll() }).then(function (a) { return (a || []).sort(function (x, y) { return (y.updated || 0) - (x.updated || 0) }) }) };
  S.get = function (id) { return tx('projects', 'readonly', function (s) { return s.get(id) }) };
  S.put = function (p) {
    p.updated = Date.now();
    var copy = JSON.parse(JSON.stringify(p));
    return tx('projects', 'readwrite', function (s) { s.put(copy) }).then(function () { return S.backup(copy).catch(function () { return null }) }).then(function () { return p });
  };
  S.remove = function (id) {
    return tx('projects', 'readwrite', function (s) { s.delete(id) }).then(function () {
      return tx('blobs', 'readwrite', function (s) { s.delete(id + ':audio') });
    });
  };
  S.newId = function () { return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) };

  /* ---------- files (audio) ---------- */
  S.putBlob = function (key, blob) { return tx('blobs', 'readwrite', function (s) { s.put(blob, key) }) };
  S.getBlob = function (key) { return tx('blobs', 'readonly', function (s) { return s.get(key) }) };

  /* ---------- versions ---------- */
  S.snapshot = function (p, label) {
    var key = p.id + ':' + Date.now();
    return tx('history', 'readwrite', function (s) { s.put({ key: key, id: p.id, at: Date.now(), label: label || 'Saved', data: JSON.parse(JSON.stringify(p)) }) })
      .then(function () { return S.versions(p.id) })
      .then(function (list) { var old = list.slice(20); if (!old.length) return; return tx('history', 'readwrite', function (s) { old.forEach(function (v) { s.delete(v.key) }) }) });
  };
  S.versions = function (id) {
    return tx('history', 'readonly', function (s) { return s.getAll() }).then(function (a) { return (a || []).filter(function (v) { return v.id === id }).sort(function (x, y) { return y.at - x.at }) });
  };

  /* ---------- settings ---------- */
  S.setting = function (k, v) {
    if (arguments.length < 2) return tx('settings', 'readonly', function (s) { return s.get(k) });
    return tx('settings', 'readwrite', function (s) { s.put(v, k) });
  };

  /* ---------- backup folder on the PC (Chrome / Edge) ---------- */
  var DIR = null, DIRSTATE = 'none', SAVEDAUDIO = {};      // none | ask | ok | unsupported
  S.folderSupported = function () { return typeof window.showDirectoryPicker === 'function' };
  S.folder = function () { return { state: S.folderSupported() ? DIRSTATE : 'unsupported', name: DIR ? DIR.name : '' } };
  S.loadFolder = function () {
    if (!S.folderSupported()) { DIRSTATE = 'unsupported'; return Promise.resolve(S.folder()) }
    return S.setting('backupDir').then(function (h) {
      if (!h) { DIRSTATE = 'none'; return S.folder() }
      DIR = h;
      return h.queryPermission({ mode: 'readwrite' }).then(function (p) { DIRSTATE = p === 'granted' ? 'ok' : 'ask'; return S.folder() });
    }).catch(function () { DIRSTATE = 'none'; return S.folder() });
  };
  S.pickFolder = function () {
    return window.showDirectoryPicker({ id: 'nyenz-studio', mode: 'readwrite' }).then(function (h) {
      DIR = h; DIRSTATE = 'ok'; return S.setting('backupDir', h);
    }).then(function () { return S.backupAll() }).then(function () { return S.folder() });
  };
  S.reconnect = function () {
    if (!DIR) return S.pickFolder();
    return DIR.requestPermission({ mode: 'readwrite' }).then(function (p) { DIRSTATE = p === 'granted' ? 'ok' : 'ask'; return DIRSTATE === 'ok' ? S.backupAll() : null }).then(function () { return S.folder() });
  };
  function safe(n) { return String(n || 'Untitled').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Untitled' }
  function writeFile(dir, name, data) {
    return dir.getFileHandle(name, { create: true }).then(function (fh) { return fh.createWritable() }).then(function (w) { return w.write(data).then(function () { return w.close() }) });
  }
  S.backup = function (p) {
    if (DIRSTATE !== 'ok' || !DIR) return Promise.resolve(false);
    var folder = safe(p.name) + ' (' + p.id.slice(-4) + ')';
    return DIR.getDirectoryHandle(folder, { create: true }).then(function (d) {
      var jobs = [writeFile(d, 'project.json', JSON.stringify(p, null, 1))];
      var ak = p.id + ':' + (p.audio && p.audio.name) + ':' + (p.audio && p.audio.size);
      if (p.audio && p.audio.name && !SAVEDAUDIO[ak]) {
        jobs.push(S.getBlob(p.id + ':audio').then(function (b) { if (b) return writeFile(d, 'narration-' + safe(p.audio.name), b).then(function () { SAVEDAUDIO[ak] = 1 }) }));
      }
      return Promise.all(jobs);
    }).then(function () { return true });
  };
  S.backupAll = function () { return S.list().then(function (all) { return Promise.all(all.map(function (p) { return S.backup(p) })) }) };
})();
