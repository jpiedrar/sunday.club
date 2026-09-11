// Never cache account data, picks, or authenticated HTML.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open('sunday-offline-v1')
      .then((cache) => cache.add('/offline.html')),
  );
  self.skipWaiting();
});
self.addEventListener('activate', (event) =>
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => k !== 'sunday-offline-v1')
              .map((k) => caches.delete(k)),
          ),
        ),
    ]),
  ),
);
self.addEventListener('fetch', (event) => {
  if (
    event.request.mode === 'navigate' &&
    new URL(event.request.url).origin === self.location.origin
  )
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/offline.html')),
    );
});
