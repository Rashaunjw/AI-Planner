# Push Notifications Setup

## 1. Generate VAPID keys

Run once and add the output to your environment (e.g. Vercel → Settings → Environment Variables):

```bash
npx web-push generate-vapid-keys
```

You’ll get a **public** and **private** key. Set:

- `VAPID_PUBLIC_KEY` = public key
- `VAPID_PRIVATE_KEY` = private key

Optional:

- `VAPID_MAILTO` = contact for the push service (e.g. `mailto:support@yourdomain.com`). Defaults to `mailto:support@planera.app`.

## 2. Database migration

Create and apply the migration for the `PushSubscription` model:

```bash
npx prisma migrate dev --name add_push_subscription
```

For production, run:

```bash
npx prisma migrate deploy
```

## 3. Deploy

Redeploy so the new env vars and migration are used. Users can then enable “Push Notifications” in **Settings**; they’ll get browser push when the reminders cron runs (same schedule as email reminders).

## Flow

- **Subscribe:** User turns on “Push Notifications” in Settings → browser asks permission → subscription is sent to `/api/push/subscribe` and stored.
- **Send:** The existing reminders cron (`/api/reminders/run`) also sends push to users who have a subscription; payload includes title, body, and link to `/tasks`.
- **Unsubscribe:** User turns off the toggle → subscription is removed locally and via `/api/push/subscribe` (DELETE).
