import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3/calendars"

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    })

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "Google account is not connected." },
        { status: 400 }
      )
    }

    let accessToken = account.access_token
    const expiresAt = account.expires_at ? account.expires_at * 1000 : null
    let refreshedOnce = false

    const refreshAccessToken = async () => {
      if (!account.refresh_token) return false
      const refreshParams = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      })
      const refreshResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: refreshParams.toString(),
      })
      if (!refreshResponse.ok) return false
      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: refreshData.access_token,
          expires_at: refreshData.expires_in
            ? Math.floor(Date.now() / 1000) + refreshData.expires_in
            : account.expires_at,
        },
      })
      refreshedOnce = true
      return true
    }

    if (account.refresh_token && (!expiresAt || Date.now() > expiresAt - 60_000)) {
      await refreshAccessToken()
    }

    const calendars = await prisma.calendar.findMany({
      where: { userId: session.user.id },
      include: {
        events: {
          where: { googleEventId: { not: null } },
          select: { id: true, googleEventId: true },
        },
      },
    })

    let deletedCount = 0
    const calendarIdForUrl = (cal: { googleCalendarId: string | null }) =>
      cal.googleCalendarId || "primary"

    for (const calendar of calendars) {
      for (const ev of calendar.events) {
        const googleEventId = ev.googleEventId
        if (!googleEventId) continue

        const url = `${GOOGLE_CALENDAR_BASE}/${encodeURIComponent(calendarIdForUrl(calendar))}/events/${encodeURIComponent(googleEventId)}`
        let delResponse = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (delResponse.status === 401 && !refreshedOnce && account.refresh_token) {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            delResponse = await fetch(url, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${accessToken}` },
            })
          }
        }

        if (delResponse.ok || delResponse.status === 404) {
          await prisma.calendarEvent.delete({ where: { id: ev.id } })
          deletedCount += 1
        }
      }
    }

    return NextResponse.json({ deletedCount })
  } catch (error) {
    console.error("Calendar events delete error:", error)
    return NextResponse.json(
      { error: "Failed to remove events from Google Calendar." },
      { status: 500 }
    )
  }
}
