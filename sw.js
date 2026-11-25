/* Service Worker — rede primeiro para os arquivos do app (sempre a versão mais nova),
   com cache como reserva offline. Não intercepta Firebase/Firestore. */
const CACHE_VERSION = 'checklist-wit-v5';
const ASSETS = ['./','./index.html','./style.css','./app.js','./firebase-config.js','./manifest.json','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
const CDN = ['www.gstatic.com', 'cdnjs.cloudflare.com'];   // só bibliotecas (scripts)

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const mine = url.origin === location.origin;
  const lib = CDN.includes(url.hostname) && req.destination === 'script';
  if (!mine && !lib) return;                       // Firestore etc.: direto na rede
  e.respondWith(
    fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE_VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
