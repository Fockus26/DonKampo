self.addEventListener("install", () => console.log("Service Worker instalado"));
  
self.addEventListener("fetch", event => console.log("Interceptando petición:", event.request.url));
  
