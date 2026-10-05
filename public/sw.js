// Kill switch for the old cache-first service worker that earlier deploys
// installed. Browsers re-check this file on navigation, so returning visitors
// pick this up, drop the stale caches, unregister, and reload onto fresh HTML.
// Safe to delete once old visitors have cycled through (a few months).
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
