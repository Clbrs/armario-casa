// Service worker del Armario de casa.
// Guarda la "carcasa" de la app para que abra al instante y sin conexión.
// Los datos del inventario NO se guardan aquí: siempre se piden al bot (y las fotos van a la caché propia de la app).
const VERSION = 'armario-v2';
const CARCASA = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CARCASA)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // las llamadas al bot (POST) van siempre a la red
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // fuentes, QR, etc.: comportamiento normal

  // Red primero (para recibir las mejoras al momento); si no hay conexión, la copia guardada
  e.respondWith(
    fetch(req)
      .then((r) => {
        if (r.ok) { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(req, copia)); }
        return r;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
