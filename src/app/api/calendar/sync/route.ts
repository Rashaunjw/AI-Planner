import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events"

export async function POST() {
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
    if (!account.refresh_token) {
      return NextResponse.json(
        { error: "Google refresh token missing. Reconnect your Google account." },
        { status: 400 }
      )
    }

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
        userId: session.user.id,
      },
      orderBy: { dueDate: "asc" },
    })

    const syncableTasks = tasks.filter((task) => {
      if (!task.dueDate) return false
      if (!task.className?.trim()) return false
      if (!task.title?.trim() || task.title.trim() === "Untitled task") return false
      return true
    })
    const skippedCount = tasks.length - syncableTasks.length

    let createdCount = 0
    const failures: Array<{ status: number; message: string }> = []
    for (const task of syncableTasks) {
      if (!task.dueDate) continue
      const startDate = new Date(task.dueDate)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 1)

      const payload = {
        summary: `[${task.className}] ${task.title}`,
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

      if (eventResponse.ok) {
        createdCount += 1
      } else {
        const message = await eventResponse.text()
        failures.push({ status: eventResponse.status, message })
      }
    }

    return NextResponse.json({
      createdCount,
      skippedCount,
      failedCount: failures.length,
      failures,
    })
  } catch (error) {
    console.error("Calendar sync error:", error)
    return NextResponse.json({ error: "Failed to sync calendar." }, { status: 500 })
  }
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

