// Service Worker: macht die Seite als App installierbar.
// Strategie: immer zuerst aus dem Internet laden (damit der Text des Tages aktuell ist).
// Ohne Verbindung wird die zuletzt geladene Version angezeigt.
// Nach Änderungen an dieser Datei die Versionsnummer erhöhen (v1 -> v2 ...).
const CACHE = 'arabisch-v1';
const CORE = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Schlüssel ohne "?t=..." speichern, damit der Tagestext offline wiedergefunden wird
const key = url => { const u = new URL(url); u.search = ''; return u.href; };

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(key(req.url), copy));
      }
      return res;
    }).catch(() =>
      caches.match(key(req.url)).then(r =>
        r || (req.mode === 'navigate' ? caches.match(new URL('./', self.registration.scope).href) : Response.error())))
  );
});
