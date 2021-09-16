const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/styles.css",
    "/db.js",
    "/index.js",
    "/manifest.json"
  ];
  
  const CACHE = "static-cache-v1";
  const RUNTIME_CACHE = "runtime-cache";
  
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches
        .open(CACHE)
        .then((cache) => cache.addAll(FILES_TO_CACHE))
        .then(self.skipWaiting())
    );
  });
  
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches
        .keys()
        .then((keyList) => {
          return Promise.all(
              keyList.map(key =>
                { if (key !== CACHE && key !== RUNTIME_CACHE) {
                    console.log("Removing old cache data", key);
                    return caches.delete(key);
                }})
            );
        })
    );
    self.clients.claim();
  });
  
  self.addEventListener("fetch", (event) => {
    if (event.request.url.includes("/api/")) {
      event.respondWith(
        caches.open(RUNTIME_CACHE).then((cache) => {
          return fetch(event.request)
            .then(response => {
                if (response.status === 200) {
                    cache.put(event.request.url, response.clone())
                    return response;
                }
            })
            .catch(err => {
                return cache.patch(event.request)
            })
            .catch(err => 
                console.log(err)
            )
        })
      );
      return;
    }
    event.respondWith(
        caches.match(event.request)
        .then (function(response) {
            return response || fetch(event.request)
        })
    )
  });