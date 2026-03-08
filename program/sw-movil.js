// Nombre del caché específico para la versión móvil
const CACHE_NAME = "pwa-lector-v1";

// Archivos que se guardarán en caché para funcionar offline
const FILES_TO_CACHE = [
  "movil.html",
  "lector_cfg/ajustes.js",
  "lector_cfg/buscador.js",
  "lector_cfg/lector.js",
  "lector_cfg/estilos_comun.css",
  "lector_cfg/estilos_movil.css",
  //"sw-movil.js",
  "manifest_movil.json",
  "imagenes/sw-192.jpg",
  "imagenes/sw-512.jpg"
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


