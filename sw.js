const getBuildVersion = () => {
  try {
    const url = new URL(self.location.href);
    return url.searchParams.get('v') || 'dev';
  } catch {
    return 'dev';
  }
};
const BUILD_VERSION = getBuildVersion();
const CACHE_NAME = `c3talk-v${BUILD_VERSION}`;
const SHARE_CACHE = 'share-cache';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
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
  self.clients.claim();
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'SW_ACTIVATED', version: BUILD_VERSION });
    });
  });
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target/')) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const mediaFile = formData.get('media');

          if (mediaFile) {
            const cache = await caches.open(SHARE_CACHE);
            const headers = new Headers({ 'Content-Type': mediaFile.type || 'application/octet-stream' });
            await cache.put('shared-file', new Response(mediaFile, { headers }));
          }

          return Response.redirect('/?action=share-voice', 303);
        } catch (e) {
          return Response.redirect('/', 303);
        }
      })()
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
          return response;
        } catch {
          const cached = await caches.match(event.request);
          return cached || caches.match('/index.html');
        }
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      try {
        const resp = await fetch(event.request);
        return resp;
      } catch {
        return cached || Response.error();
      }
    })()
  );
});
