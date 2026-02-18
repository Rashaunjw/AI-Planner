import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const users = await prisma.user.findMany({
      where: { calendarSync: true },
      select: { id: true },
    })

    let syncedUsers = 0
    for (const user of users) {
      const account = await prisma.account.findFirst({
        where: { userId: user.id, provider: "google" },
      })
      if (!account?.access_token) continue

      let accessToken = account.access_token
      const expiresAt = account.expires_at ? account.expires_at * 1000 : null
      let refreshedOnce = false

      const refreshAccessToken = async () => {
        if (!account.refresh_token) {
          return false
        }

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

        if (!refreshResponse.ok) {
          return false
        }

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

      const tasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: { not: null },
        },
        orderBy: { dueDate: "asc" },
      })

      for (const task of tasks) {
        if (!task.dueDate) continue
        const startDate = new Date(task.dueDate)
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 1)

        const summary = task.className?.trim()
          ? `[${task.className.trim()}] ${task.title}`
          : task.title

        const payload = {
          summary,
          description: task.description || undefined,
          start: { date: formatDate(startDate) },
          end: { date: formatDate(endDate) },
        }

        let eventResponse = await fetch(GOOGLE_EVENTS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        if (eventResponse.status === 401 && !refreshedOnce && account.refresh_token) {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            eventResponse = await fetch(GOOGLE_EVENTS_URL, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            })
          }
        }
      }

      syncedUsers += 1
    }

    return NextResponse.json({ syncedUsers })
  } catch (error) {
    console.error("Calendar auto sync error:", error)
    return NextResponse.json({ error: "Failed to sync calendars." }, { status: 500 })
  }
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

