/* Service worker: lets the app install and open offline.
   Network first, so every update arrives the next time the app opens; the saved copy is used only when offline.
   It never touches your projects (they live in IndexedDB and your backup folder, not in this cache). */
var CACHE = 'nyenz-studio-v1';
var CORE = ['./', 'index.html', 'manifest.webmanifest', 'studio/studio.css', 'studio/app.js', 'studio/store.js', 'studio/audio.js', 'studio/styles.js', 'app/timing.js', 'app/asr-worker.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon.svg'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE) }).then(function () { return self.skipWaiting() })) });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE }).map(function (k) { return caches.delete(k) })) }).then(function () { return self.clients.claim() })) });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin) return;     // fonts, Whisper models: the browser handles them
  e.respondWith(fetch(r).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy) }) }
    return res;
  }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match('index.html') }) }));
});
