// PlanEra service worker - PWA install, offline detection, push notifications
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

// Push: show notification and handle click (open app / focus tab)
self.addEventListener("push", (event) => {
  if (!event.data) return
  let data = { title: "PlanEra", body: "", url: "/" }
  try {
    const parsed = event.data.json()
    data = { ...data, ...parsed }
  } catch {
    data.body = event.data.text() || "You have updates from PlanEra."
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      tag: data.tag || "planera-default",
      data: { url: data.url || "/" },
      requireInteraction: false,
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && "focus" in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(new URL(url, self.location.origin).href)
      }
    })
  )
})
