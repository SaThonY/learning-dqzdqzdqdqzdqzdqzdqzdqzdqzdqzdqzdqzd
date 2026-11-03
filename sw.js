// Service worker : garde l’appli sur le téléphone pour qu’elle s’ouvre sans réseau.
// La version change à chaque construction ; l’ancien cache est alors remplacé.
const VERSION = "084a6ce060";
const CACHE = "priere-app-" + VERSION;
const FONTS = "priere-fonts";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("priere-app-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Polices Google : gardées après le premier chargement
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(caches.open(FONTS).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return Response.error();
      }
    }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Pages : la version gardée d’abord, pour s’ouvrir instantanément même hors ligne
  if (req.mode === "navigate") {
    event.respondWith(caches.match("./index.html").then(hit => hit || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
