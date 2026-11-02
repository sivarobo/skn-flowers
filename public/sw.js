const CACHE = "skn-v2";
const SHELL = [
  "/", "/index.html", "/logo.png", "/manifest.webmanifest",
  "/icon-192.png", "/icon-512.png",
  "/lib/html2canvas.min.js", "/lib/jspdf.umd.min.js",
  "/fonts/noto-sans-tamil-tamil-400-normal.woff2", "/fonts/noto-sans-tamil-tamil-600-normal.woff2",
  "/fonts/noto-sans-latin-400-normal.woff2", "/fonts/noto-sans-latin-700-normal.woff2"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  // page: network first so updates show up; fall back to cache when offline
  if (e.request.mode === "navigate" || url.pathname === "/" || url.pathname.endsWith(".html")) {
    e.respondWith(
      fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("/index.html", c)); return r; })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }
  // static files: cache first
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
    return r;
  })));
});
