// Nombre del caché específico para la versión móvil
const CACHE_NAME = "pwa-lector-v04";

// Archivos que se guardarán en caché para funcionar offline
const FILES_TO_CACHE = [
  "movil.html",
  "lector_cfg/ajustes.js",
  "lector_cfg/buscador.js",
  "lector_cfg/lector.js",
  "lector_cfg/estilos_comun.css",
  "lector_cfg/estilos_movil.css",
  "imagenes/sw_192.png",
  "imagenes/sw_512.png"
];

// Instalación del service worker: precache de los recursos básicos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación: limpieza de cachés antiguos y toma de control inmediata
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

// Estrategia de fetch: cache-first con fallback offline
self.addEventListener("fetch", event => {
  const request = event.request;

  // Solo manejamos peticiones GET
  if (request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        // Si está en caché, siempre usamos caché
        return response;
      }

      // Si no está en caché, intentamos red
      return fetch(request).catch(() => {
        // Si falla la red, devolvemos la página base offline
        // (útil cuando se refresca estando sin conexión)
        return caches.match("movil.html");
      });
    })
  );
});

