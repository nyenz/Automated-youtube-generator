/* Service worker: lets the app install and open offline.
   Network first, so every update arrives the next time the app opens; the saved copy is used only when offline.
   It never touches your projects (they live in IndexedDB and your backup folder, not in this cache). */
var CACHE = 'nyenz-studio-2026.11.20-5';
var CORE = ['./', 'index.html', 'manifest.webmanifest', 'app/asr-worker.js', 'icons/logo-ink-192.png', 'icons/logo-ink-512.png', 'icons/logo-ink.svg'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE) }).then(function () { return self.skipWaiting() })) });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE }).map(function (k) { return caches.delete(k) })) }).then(function () { return self.clients.claim() })) });
self.addEventListener('fetch', function (e) {
  var r = e.request; if (r.method !== 'GET') return;
  var u = new URL(r.url); if (u.origin !== location.origin) return;     // fonts, Whisper models: the browser handles them
  // always ask the server whether the file changed (cheap: the server answers "not changed" when it did not),
  // so a new logo or a new version shows at once instead of after the browser's own 10-minute cache
  e.respondWith(fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy) }) }
    return res;
  }).catch(function () { return caches.match(r).then(function (m) { return m || caches.match('index.html') }) }));
});
