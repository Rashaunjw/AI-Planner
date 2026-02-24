# Push Notifications Setup

## 1. Generate VAPID keys

Run once and add the output to your environment (e.g. Vercel → Settings → Environment Variables):

```bash
npx web-push generate-vapid-keys
```

You’ll get a **public** and **private** key. Set them **in every environment where the app runs** (including production):

- `VAPID_PUBLIC_KEY` = public key
- `VAPID_PRIVATE_KEY` = private key

If these are missing in production, the Settings page will show **"Could not get push configuration"** and users cannot enable push notifications.

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

## What users get notified about

- **Email reminders:** One email per user per day when they have **assignments due in N days** (N = their "Reminder days" in Settings, default 2). Sent only if they have "Email reminders" on.
- **Push notifications:** Same rule: one push per day when they have assignments due in N days. Sent only if they have "Push Notifications" on and a subscription is stored. Title: "PlanEra – Deadline reminder"; body: e.g. "3 assignments due in 2 days"; tap opens `/tasks`.
- **Weekly digest (email only):** Mondays 09:00 UTC, for users with email reminders on — "Your week ahead" with upcoming tasks. No push for the digest.

The reminders cron runs **daily at 08:00 UTC** (`/api/reminders/run`).

## Testing push notifications via PWA

1. **VAPID + subscription**
   - Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (and optionally `VAPID_MAILTO`) in your env.
   - Deploy or run locally with HTTPS (or use localhost; push works on localhost).
   - Open the app in a browser that supports push (Chrome, Edge, Firefox).
   - Install the PWA if you want (optional; push works without install).
   - Go to **Settings** and turn on **Push Notifications**. Allow when the browser prompts. You should see "Push notifications enabled".

2. **Trigger reminders manually**
   - Set `CRON_SECRET` in your env (e.g. `CRON_SECRET=your-test-secret`).
   - Ensure your test user has at least one **incomplete task with a due date** that is exactly **N days from today** (N = your "Reminder days" setting, e.g. 2). So if today is Feb 24 and reminder days = 2, add a task due Feb 26.
   - Call the reminders endpoint with the secret:
     ```bash
     curl -X POST "https://your-app-url/api/reminders/run" \
       -H "Authorization: Bearer YOUR_CRON_SECRET"
     ```
     For local dev:
     ```bash
     curl -X POST "http://localhost:3000/api/reminders/run" \
       -H "Authorization: Bearer your-test-secret"
     ```
   - Response includes `sentCount` (emails) and `pushSentCount` (push). You should get a browser push and/or email if the due-date logic matched.

3. **Quick check without real due dates**
   - You can temporarily change the reminder logic in code to "today" for testing (e.g. treat a task due today as a candidate), or add a test task due in exactly N days and run the curl above.
