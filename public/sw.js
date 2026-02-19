// PlanEra minimal service worker - enables PWA install prompt and offline detection
const CACHE_NAME = "planera-v1"

self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", () => {
  // Network-first; no caching for now to keep data fresh
})
