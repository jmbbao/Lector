// Nombre del caché específico para la versión móvil
const CACHE_NAME = "pwa-movil-v1";

// Archivos que se cachearán para funcionar offline
const FILES_TO_CACHE = [
  "movil.html",
  "manifest-movil.json",
  "imagenes/iconos/lector-192.png",
  "imagenes/iconos/lector-512.png"
];

// Instalación del service worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercepta peticiones y sirve desde caché si es posible
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});


