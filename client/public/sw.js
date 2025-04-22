const CACHE_NAME = "my-pwa-cache-v1.0.3"; // cambia este valor con cada nueva versión

self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...");
  self.skipWaiting(); // fuerza el nuevo SW a instalarse inmediatamente
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activando nuevo Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[SW] Borrando caché antigua:", cache);
            return caches.delete(cache);
          }
        })
      )
    )
  );
  return self.clients.claim(); // toma control de las páginas abiertas
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        return caches.match(event.request); // si falla red, intenta con caché
      })
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
