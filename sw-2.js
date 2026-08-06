const CACHE = "vokabel-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg", "./conjugate.html"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Never intercept calls to the translation API, GitHub API, or any other
  // origin — those must always hit the real network live.
  if (url.origin !== self.location.origin) return;

  // App shell: NETWORK-FIRST. Always try to get the latest version when
  // online, so updates take effect immediately on next load. Only fall
  // back to the cached copy when there's no connection at all.
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() =>
      caches.match(e.request).then(cached => cached || caches.match("./index.html"))
    )
  );
});
