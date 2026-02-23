"use client"

/**
 * Convert VAPID public key (base64url) to Uint8Array for PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export type PushSubscribeResult = { ok: true } | { ok: false; error: string }

/**
 * Request notification permission, subscribe to push via the service worker, and send the subscription to the API.
 * Call from the client (e.g. Settings) when the user enables push notifications.
 */
export async function subscribeToPush(): Promise<PushSubscribeResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { ok: false, error: "Push notifications are not supported" }
  }

  let permission = Notification.permission
  if (permission === "default") {
    permission = await Notification.requestPermission()
  }
  if (permission !== "granted") {
    return { ok: false, error: "Permission denied" }
  }

  const reg = await navigator.serviceWorker.ready
  if (!reg.pushManager) {
    return { ok: false, error: "Push not available" }
  }

  const vapidRes = await fetch("/api/push/vapid-public")
  if (!vapidRes.ok) {
    return { ok: false, error: "Could not get push configuration" }
  }
  const { publicKey } = await vapidRes.json()
  if (!publicKey) {
    return { ok: false, error: "Missing VAPID public key" }
  }

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  })

  const subJson = subscription.toJSON()
  const subscribeRes = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      },
    }),
  })

  if (!subscribeRes.ok) {
    return { ok: false, error: "Failed to save subscription" }
  }
  return { ok: true }
}

/**
 * Unsubscribe from push and remove the subscription from the API.
 */
export async function unsubscribeFromPush(): Promise<PushSubscribeResult> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { ok: true }
  }

  const reg = await navigator.serviceWorker.ready
  if (reg.pushManager) {
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
    } else {
      await fetch("/api/push/subscribe", { method: "DELETE" })
    }
  }
  return { ok: true }
}
