/* DB — saves projects and audio in the browser (IndexedDB). Nothing leaves your PC. */
(function () {
  var DB = {}; window.DB = DB; var dbp = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      var r = indexedDB.open('auto-yt-generator', 1);
      r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath: 'id' }); if (!d.objectStoreNames.contains('files')) d.createObjectStore('files') };
      r.onsuccess = function () { res(r.result) }; r.onerror = function () { rej(r.error) };
    });
    return dbp;
  }
  function tx(store, mode, fn) {
    return open().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction(store, mode), s = t.objectStore(store), out = fn(s);
        t.oncomplete = function () { res(out instanceof IDBRequest ? out.result : out) }; t.onerror = function () { rej(t.error) };
      });
    });
  }
  DB.list = function () { return tx('projects', 'readonly', function (s) { return s.getAll() }) };
  DB.get = function (id) { return tx('projects', 'readonly', function (s) { return s.get(id) }) };
  DB.put = function (p) { p.updated = Date.now(); return tx('projects', 'readwrite', function (s) { s.put(p) }) };
  DB.del = function (id) { return tx('projects', 'readwrite', function (s) { s.delete(id) }) };
  DB.putFile = function (key, blob) { return tx('files', 'readwrite', function (s) { s.put(blob, key) }) };
  DB.getFile = function (key) { return tx('files', 'readonly', function (s) { return s.get(key) }) };
  DB.delFile = function (key) { return tx('files', 'readwrite', function (s) { s.delete(key) }) };
})();
