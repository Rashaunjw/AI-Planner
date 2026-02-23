import webpush from "web-push"

const getVapidKeys = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set for push notifications")
  }
  return { publicKey, privateKey }
}

let vapidConfigured = false

function ensureVapidConfigured() {
  if (vapidConfigured) return
  const { publicKey, privateKey } = getVapidKeys()
  const contact = process.env.VAPID_MAILTO || "mailto:support@planera.app"
  webpush.setVapidDetails(contact, publicKey, privateKey)
  vapidConfigured = true
}

/**
 * Returns the VAPID public key (base64url) for the client to subscribe.
 */
export function getVapidPublicKey(): string {
  return getVapidKeys().publicKey
}

export type PushSubscriptionRecord = {
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Send a push notification to a subscription. Throws on failure (e.g. expired subscription).
 */
export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: string | Record<string, unknown>
): Promise<void> {
  ensureVapidConfigured()
  const payloadStr = typeof payload === "string" ? payload : JSON.stringify(payload)
  await webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    },
    payloadStr,
    {
      TTL: 60 * 60 * 24, // 24 hours
    }
  )
}
