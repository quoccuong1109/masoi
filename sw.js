var CACHE = 'masoi-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  if (!url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        if (cached) {
          fetch(e.request).then(function(res) {
            if (res && res.status === 200) cache.put(e.request, res.clone());
          }).catch(function() {});
          return cached;
        }
        return fetch(e.request).then(function(res) {
          if (res && res.status === 200) cache.put(e.request, res.clone());
          return res;
        });
      });
    })
  );
});
