# Free vs Pro Plan: What to Include

Goal: **Free** lets users fully try the app and give feedback. **Pro** removes limits and adds premium features so power users have a reason to upgrade.

---

## Free plan – “fully test and give feedback”

| Feature | Free | Why |
|--------|------|-----|
| **Document uploads** | 5 per month | Enough to add 1–2 syllabi + work/sports. Lets them see extraction and feel the limit. *(Set `FREE_UPLOADS_PER_MONTH` in `api/upload/route.ts`; pricing page uses 5.)* |
| **AI task extraction** | Included | Core value; must work on Free so they can evaluate. |
| **Dashboard, Tasks, Calendar** | Full access | No limit. They need to see all views. |
| **Manual add / edit / delete tasks** | Full access | So they can fix or add items without burning uploads. |
| **Email reminders** | Full access | Core retention; they need to feel “reminders work.” |
| **Push notifications** | Full access | Same as email; part of the core loop. |
| **ICS calendar feed** | Full access | Read-only export; low cost, high perceived value. |
| **Google Calendar sync** | Full access | So they can test “one place for everything.” *(Optional: Free = 1 calendar, Pro = multiple.)* |
| **AI study plan (generate)** | 3–5 per month | Enough to try it 2–3 times and see value. *(Not yet enforced in code.)* |
| **Add study blocks to calendar** | 1–2 per month, or same as study plan | Lets them test the full “plan → calendar” flow. *(Not yet enforced; could tie to study plan count.)* |
| **Schedule chat** | Pro only | Not included on Free; upgrade to Pro to use. *(Enforced in `api/chat/route.ts`.)* |
| **Weekly digest email** | Included | One email/week; reinforces habit and value. |
| **Share class view** | 1 share link | So they can try “share with study group.” Pro = more or permanent links. *(Not yet enforced.)* |

**Summary:** Free users can upload a few docs, see extraction, use dashboard/calendar/reminders, try the AI study plan a few times, and add blocks once or twice. Schedule chat is Pro only. That’s enough to evaluate and give feedback without giving away unlimited usage.

---

## Pro plan – “restrictions lifted + premium”

| Feature | Pro | Why |
|--------|-----|-----|
| **Uploads** | Unlimited | Already enforced. Main upgrade lever. |
| **AI study plan** | Unlimited generations | No monthly cap. |
| **Add study blocks to calendar** | Unlimited | Use the feature as much as they want. |
| **Crunch week reports** | Pro only | Premium insight (“your busiest week,” etc.). |
| **Custom reminder windows** | Pro only | Free = fixed (e.g. 2 days). Pro = 1 day, 3 days, 1 week, or multiple. *(Schema supports it; UI could expose for Pro.)* |
| **Export (CSV/PDF)** | Pro only | When you add it: export tasks or calendar. |
| **Weekly digest** | Enhanced (e.g. study tips, priorities) | Free = basic “week ahead.” Pro = richer content. *(Optional.)* |
| **Schedule chat** | Pro only | Ask about schedule, due dates, assignments with AI. *(Enforced in `api/chat/route.ts`.)* |
| **Share class view** | More links or no expiry | When you add limits on Free. |
| **Priority support** | Pro only | Marketing + support positioning. |

**Summary:** Pro = no upload/study-plan/block limits, plus crunch reports, custom reminders, export, and (when you add them) better digest and support.

---

## What’s enforced today

| Feature | Enforced? | Where |
|--------|-----------|--------|
| Upload limit (10/month Free) | Yes | `api/upload/route.ts` |
| Study plan limit | No | Add to `api/study-plan/route.ts` |
| Add-to-calendar limit | No | Add to `api/study-plan/add-to-calendar/route.ts` if you cap Free |
| Schedule chat | Pro only | `api/chat/route.ts` – GET/POST return 403 for Free users |
| Everything else | No | No plan checks yet |

---

## Suggested next steps

1. **Keep or lower Free uploads** – 5/month is enough to test; 10 is generous. Either is fine; 5 creates a clearer “upgrade for more” moment.
2. **Add study plan cap for Free** – e.g. 5 generations/month. Store usage in DB or a simple table (e.g. `StudyPlanGeneration`: userId, month, count).
3. **Optionally cap “add to calendar”** – e.g. Free = 2 uses/month, or tie to study plan count (each “add blocks” counts as 1 study plan use).
4. **Optionally split chat limit** – Free = 15/day, Pro = 50 or unlimited. Requires plan in session or DB on each chat request.
5. **Update pricing page** – List Free limits and Pro “unlimited + premium” so the split is obvious (see `src/app/pricing/page.tsx`).

---

## One-line positioning

- **Free:** “Enough to run 1–2 classes and try every feature; limits on uploads and AI study plans.”
- **Pro:** “Unlimited uploads and study plans, crunch reports, custom reminders, export, and priority support.”
