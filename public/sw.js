const CACHE_NAME = 'vikram-samvat-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
  // A simple pass-through fetch handler is enough to pass PWA installability requirements
  // without interfering with Vite's hashed asset management on GitHub pages.
  e.respondWith(
    fetch(e.request).catch(() => new Response('Offline'))
  );
});
