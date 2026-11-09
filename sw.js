// BKM Sanal Koç - Service Worker (ağ öncelikli: dosya güncellenince uygulama da güncellenir)
const CACHE = 'bkm-sanal-koc-v45';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(CORE.map((u) => c.add(u)))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase / CDN istekleri doğrudan ağa gider
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match('./index.html')).then((m) => m || new Response(
        '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>Bağlantı kurulamadı</h2><p>İnternet bağlantınızı kontrol edin. Sorun sürerse Wi-Fi yerine mobil veri deneyin.</p><button onclick="location.reload()" style="padding:10px 18px;font-size:16px">Tekrar Dene</button></body>',
        { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
  );
});

// ---- Anlık bildirim (FCM / Web Push) ----
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {}
  const n = d.data || d.notification || {};
  e.waitUntil(self.registration.showNotification(n.title || 'BKM Sanal Koç', {
    body: n.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: n.tag || 'bkm',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 300],
    data: { url: './' }
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
