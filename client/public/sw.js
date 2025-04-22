const CACHE_NAME = "my-pwa-cache-v1.0.0"; // <-- cambia esto con cada nueva versión

// INSTALACIÓN DEL SERVICE WORKER
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Archivos cacheados");
      // Aquí puedes dejar el caching para archivos adicionales si es necesario
    })
  );
});

// ACTIVACIÓN DEL SERVICE WORKER
self.addEventListener("activate", (event) => {
  console.log("[SW] Activando nuevo Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[SW] Borrando caché antigua:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// INTERCEPTAR PETICIONES
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      });
    }).catch(() => {
      return caches.match("/offline.html");
    })
  );
});

// Para forzar el SW a actualizar
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
