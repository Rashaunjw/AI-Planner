# Outlook Integration Plan

Goal: support “sign in with Outlook / Microsoft” and calendar sync to Outlook the same way the app supports Google (sign in → account linked → sync tasks to that calendar).

---

## 1. Microsoft OAuth (Sign-in & account linking)

- **NextAuth**: Add the Microsoft provider (same pattern as Google).
  - Use `next-auth/providers/azure-ad` (Azure AD) or the generic OAuth2 provider for “Microsoft” personal + work accounts. Recommended: **Azure AD provider** with tenant `common` so both personal Microsoft accounts (Outlook.com) and work/school accounts can sign in.
  - Request scopes: `openid email profile User.Read Calendars.ReadWrite` (or `Calendars.ReadWrite` only if needed) so you can create/update/delete events in the user’s default calendar via Microsoft Graph.
  - Enable `allowDangerousEmailAccountLinking: true` if you want to link to an existing user by email (same as Google).
- **Env**: Add `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET` (and optionally `AZURE_AD_TENANT_ID`, default `common`).
- **Azure Portal**: Register an app in [Azure Portal → Microsoft Entra ID (Azure AD) → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade). Add redirect URI: `https://<your-domain>/api/auth/callback/azure-ad` (or the provider id you use). Create a client secret and grant the same scopes (Delegated: OpenID, email, profile, User.Read, Calendars.ReadWrite).

**Code touchpoints:**

- `src/lib/auth.ts`: Add Azure AD (or Microsoft) provider alongside Google, with calendar scope and offline/refresh behavior if supported.
- `src/components/auth/google-signin-button.tsx`: Either generalize to “Continue with Google” / “Continue with Microsoft” (e.g. two buttons or one component that accepts `provider`), or add `OutlookSignInButton` / `MicrosoftSignInButton` that calls `signIn("azure-ad", { callbackUrl, ... })`.
- Sign-in and sign-up pages: Add “Continue with Microsoft” (or “Continue with Outlook”) next to “Continue with Google” so users can sign in and be set up directly from their Outlook/Microsoft account.

---

## 2. Database (calendar + events per provider)

Today:

- One **Calendar** per user, keyed by `googleCalendarId` (e.g. `"primary"`).
- **CalendarEvent** stores `googleEventId` and points to that calendar.

To support Outlook in parallel:

- **Option A (minimal):** Add nullable `outlookCalendarId` on `Calendar` and `outlookEventId` on `CalendarEvent`. When the user has both Google and Microsoft linked, you either create a second `Calendar` row for “Outlook default” (then you need a way to associate that row with provider) or store both IDs on the same row (only works if you treat “primary” as one logical calendar that you sync to both; then one row can have both `googleEventId` and `outlookEventId` per task (more complex).
- **Option B (recommended):** Make provider explicit so one user can have two calendars (Google + Outlook).
  - **Calendar**: Add `provider` enum or string: `'google' | 'microsoft'` (default `'google'` for existing rows). Keep `googleCalendarId` for Google; add optional `outlookCalendarId` for Microsoft (or a single `externalId` + `provider`).
  - **CalendarEvent**: Add optional `outlookEventId`. Each event row can represent one task synced to one calendar; if you sync the same task to both Google and Outlook, you’d have two `CalendarEvent` rows (same `taskId`, different `calendarId`), one with `googleEventId` and one with `outlookEventId` (or one row with both IDs; schema choice).
  - Migration: add columns, backfill existing rows with `provider = 'google'`.

**Code touchpoints:**

- `prisma/schema.prisma`: Add `provider` to `Calendar`; add `outlookCalendarId` (or `externalId`); add `outlookEventId` to `CalendarEvent`.
- `getOrCreatePrimaryCalendar(userId, provider)`: When creating/loading the primary calendar, pass provider and set the correct external ID (Google `"primary"` vs Outlook default calendar ID from Graph).

---

## 3. Calendar sync (create/update/delete events)

- **Token refresh**: Microsoft uses OAuth2 refresh tokens; endpoint is `https://login.microsoftonline.com/<tenant>/oauth2/v2.0/token` (tenant often `common`). Store refresh_token and access_token in the same `Account` row (provider `azure-ad` or `microsoft`). NextAuth + Prisma adapter already store these when you use the Azure AD provider.
- **API**: Use **Microsoft Graph** for calendar:
  - Default calendar: `GET https://graph.microsoft.com/v1.0/me/calendar` (or `me/calendars` and pick default).
  - Create event: `POST https://graph.microsoft.com/v1.0/me/events` with body `{ subject, body, start: { dateTime, timeZone }, end: { dateTime, timeZone } }` (all-day: use `date`-only format).
  - Delete event: `DELETE https://graph.microsoft.com/v1.0/me/events/{eventId}`.

**Code touchpoints:**

- **`/api/calendar/status`**: Return which providers are connected (e.g. `{ google: boolean, microsoft: boolean }` or a list). Check both `provider: 'google'` and `provider: 'azure-ad'` (or whatever id you use) in `Account`.
- **`/api/calendar/sync`** (manual “Sync now”):
  - If user has Google account: keep current behavior (get Google token, getOrCreatePrimaryCalendar(userId, 'google'), create events via Google Calendar API, store `googleEventId`).
  - If user has Microsoft account: get Microsoft token, getOrCreatePrimaryCalendar(userId, 'microsoft'), create events via Graph, store `outlookEventId`.
  - Optional: support syncing to both if both are linked (two calendars, two sets of events).
- **`/api/calendar/sync-all`** (nightly): Same as above; for each user with `calendarSync: true`, if they have a Google account sync to Google; if they have a Microsoft account sync to Outlook (and optionally both).
- **`/api/calendar/events` (DELETE)** and **`/api/tasks/[id]` (DELETE task → remove from calendar)**: When deleting events, delete from Google by `googleEventId` and from Outlook by `outlookEventId` (each calendar provider separately).
- **`/api/calendar/reconnect`**: Either generalize to “reconnect calendar” (reconnect Google and/or Microsoft) or add a separate “Reconnect Microsoft” that deletes `Account` for provider `azure-ad` and redirects to sign-in again.

Implement shared helpers if useful, e.g.:

- `getGoogleAccessToken(account)`, `createGoogleCalendarEvent(accessToken, calendarId, payload)`
- `getMicrosoftAccessToken(account)`, `createOutlookEvent(accessToken, payload)`, `getDefaultOutlookCalendarId(accessToken)`

---

## 4. Settings & UI

- **Settings → Calendar Integration**:
  - Today: “Google Calendar Sync” toggle, “Reconnect Google”.
  - Add: “Outlook Calendar Sync” (or a single “Calendar sync” that works with “whichever account you signed in with”). If you support both: show status for each (e.g. “Google connected”, “Outlook connected”) and “Reconnect Google” / “Reconnect Microsoft” as needed.
- **Calendar page**: “Sync to Google Calendar” → either “Sync to calendar” (and sync to connected provider(s)) or two buttons: “Sync to Google” / “Sync to Outlook”. “Remove from Google Calendar” → “Remove from calendar” (remove from whichever provider(s) have synced events).
- **Sign-in / Sign-up**: Add “Continue with Microsoft” (or “Continue with Outlook”) next to “Continue with Google” so users can sign in and be set up directly from their Outlook account.

---

## 5. Env and docs

- **env.example**: Add `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, optional `AZURE_AD_TENANT_ID=common`.
- **Setup/docs**: Document Azure app registration, redirect URI, and required API permissions (Calendars.ReadWrite, etc.).

---

## 6. Summary checklist

| Area              | Action |
|-------------------|--------|
| Auth              | Add Azure AD (or Microsoft) provider in NextAuth with Calendars.ReadWrite; add “Continue with Microsoft” on sign-in/sign-up. |
| DB                | Add `provider` (and optionally `outlookCalendarId`) on Calendar; add `outlookEventId` on CalendarEvent; migration. |
| Token refresh     | Use Microsoft token endpoint for Azure AD account when refreshing. |
| Sync (manual)     | In `/api/calendar/sync`, support Microsoft: get Outlook calendar, create events via Graph, store `outlookEventId`. |
| Sync (nightly)    | In `/api/calendar/sync-all`, for users with Microsoft account, sync to Outlook same way. |
| Delete events     | In `/api/calendar/events` DELETE and task delete, remove Outlook events by `outlookEventId` when present. |
| Status            | `/api/calendar/status` returns Outlook connection status. |
| Reconnect         | Reconnect flow for Microsoft (delete account, redirect to sign-in). |
| Settings          | Show Outlook connection status and “Reconnect Microsoft”; optional “Outlook Calendar Sync” or unified copy. |
| Calendar page     | Sync/remove buttons work for Outlook (and optionally both). |

Once these are done, a user can sign in with Microsoft/Outlook and be set up directly from that account, with calendar sync behaving like Google.
