const CACHE_NAME = "edd-shell-v3";
const DATA_CACHE = "edd-data-v1";

const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/icon-192.png",
];

// Supabase API paths to cache for offline data access
const CACHEABLE_API_PATTERNS = [
  "/rest/v1/announcements",
  "/rest/v1/schedules",
  "/rest/v1/quizzes",
  "/rest/v1/daily_gospel",
  "/rest/v1/daily_quotes",
  "/rest/v1/daily_challenges",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isCacheableAPI(url) {
  return CACHEABLE_API_PATTERNS.some((p) => url.includes(p));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Never intercept authentication or non-GET requests
  if (request.method !== "GET" || url.includes("/auth/v1/") || url.includes("/~oauth")) return;

  // API requests: network-first, cache fallback
  if (isCacheableAPI(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigation requests: network-first, serve cached shell as fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match("/")) || Response.error())
    );
    return;
  }

  // Static assets: cache-first for JS/CSS bundles
  if (url.match(/\.(js|css|woff2?|png|jpg|svg)$/)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
    return;
  }

  // Everything else: network with cache fallback
  event.respondWith(
    fetch(request).catch(async () => (await caches.match(request)) || Response.error())
  );
});
