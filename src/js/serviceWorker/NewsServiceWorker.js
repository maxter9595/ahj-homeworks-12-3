export default class NewsServiceWorker {
  constructor() {
    this.CACHE_NAME = "news-cache-v1" + new Date().getTime();
    this.API_CACHE_NAME = "api-cache-v1" + new Date().getTime();
    this.registerEvents();
  }


  async getNewsImages() {
    try {
      const response = await fetch("/api/news");
      const news = await response.json();
      return news.map((item) => item.image);
    } catch {
      return [];
    }
  }

  async getCacheResources() {
    try {
      const response = await fetch("/api/cache-resources");
      const data = await response.json();
      return data.resources;
    } catch (error) {
      console.error("Failed to fetch cache resources:", error);
      return [
        "/",
        "/index.html",
        "/bundle.js",
        "/manifest.json",
        "/mocks/news.json",
        "/assets/icons/icon-192x192.png",
        "/assets/icons/icon-512x512.png",
        ...this.getNewsImages(),
      ];
    }
  }

  async handleApiRequest(request) {
    const cache = await caches.open(this.API_CACHE_NAME);

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      console.error("Network error:", error);
      const cachedResponse = await cache.match(request);
      return cachedResponse || this.createErrorResponse();
    }
  }

  createErrorResponse() {
    return new Response(
      JSON.stringify({
        error: "Network error",
        message: "Cannot reach server and no cached data available",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  registerEvents() {
    self.addEventListener("install", async (event) => {
      self.skipWaiting();
      const resources = await this.getCacheResources();
      event.waitUntil(
        caches.open(this.CACHE_NAME).then((cache) => cache.addAll(resources)),
      );
    });

    self.addEventListener("fetch", (event) => {
      const url = new URL(event.request.url);

      if (url.pathname.startsWith("/api/")) {
        event.respondWith(
          (async () => {
            const cache = await caches.open(this.API_CACHE_NAME);

            try {
              const fetchResponse = await fetch(event.request);
              if (fetchResponse.ok) {
                cache.put(event.request, fetchResponse.clone());
              }
              return fetchResponse;
            } catch (e) {
              console.error("Network error:", e);
              const cachedResponse = await cache.match(event.request);
              if (cachedResponse) {
                return cachedResponse;
              }
              if (url.pathname === "/api/news") {
                return caches.match("/mocks/news.json");
              }
              return new Response(JSON.stringify({ error: "Network error" }), {
                status: 503,
                headers: { "Content-Type": "application/json" },
              });
            }
          })(),
        );

        return;
      }

      event.respondWith(
        (async () => {
          const cachedResponse = await caches.match(event.request);

          const networkFetch = fetch(event.request)
            .then(async (networkResponse) => {
              const cache = await caches.open(this.CACHE_NAME);
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            })
            .catch(() => {});

          return cachedResponse || (await networkFetch);
        })(),
      );
    });

    self.addEventListener("activate", (event) => {
      const cacheWhitelist = [this.CACHE_NAME, this.API_CACHE_NAME];
      event.waitUntil(
        caches
          .keys()
          .then((cacheNames) =>
            Promise.all(
              cacheNames.map(
                (cacheName) =>
                  !cacheWhitelist.includes(cacheName) &&
                  caches.delete(cacheName),
              ),
            ),
          ),
      );
    });
  }
}
