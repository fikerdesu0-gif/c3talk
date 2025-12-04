const CACHE_NAME = 'c3talk-v2';
const SHARE_CACHE = 'share-cache';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Force activation of new SW
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== SHARE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all clients immediately
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Handle Share Target POST request
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target/')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const mediaFile = formData.get('media');

          if (mediaFile) {
            const cache = await caches.open(SHARE_CACHE);
            // Store the file as a response object in a specific cache key
            await cache.put('shared-file', new Response(mediaFile));
          }
          
          // Redirect to the app with a query param indicating a share action
          return Response.redirect('/?action=share-voice', 303);
        } catch (err) {
          console.error('Share target failed', err);
          return Response.redirect('/', 303);
        }
      })()
    );
    return;
  }

  // Standard Cache-First Strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});