import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getFromAddress } from "@/lib/email"

const APP_URL = process.env.NEXTAUTH_URL || "https://planera.app"

function startOfWeekUTC(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  d.setUTCDate(d.getUTCDate() - diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function formatDateDisplay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const now = new Date()
    const weekStart = startOfWeekUTC(now)

    const users = await prisma.user.findMany({
      where: { emailReminders: true },
      select: { id: true, email: true },
    })

    let sentCount = 0
    const weekEnd = new Date(weekStart)
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)

    for (const user of users) {
      if (!user.email) continue

      const alreadySent = await prisma.digestSent.findUnique({
        where: {
          userId_weekStart: { userId: user.id, weekStart },
        },
      })
      if (alreadySent) continue

      const tasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          status: "pending",
          dueDate: { not: null, gte: now, lte: weekEnd },
        },
        orderBy: { dueDate: "asc" },
        take: 7,
        select: { id: true, title: true, dueDate: true, className: true },
      })

      if (tasks.length === 0) continue

      await sendWeeklyDigestEmail(user.email, tasks)

      await prisma.digestSent.create({
        data: { userId: user.id, weekStart },
      })
      sentCount += 1
    }

    return NextResponse.json({ sentCount })
  } catch (error) {
    console.error("Weekly digest error:", error)
    return NextResponse.json(
      { error: "Failed to send weekly digest." },
      { status: 500 }
    )
  }
}

async function sendWeeklyDigestEmail(
  email: string,
  tasks: { title: string; dueDate: Date | null; className: string | null }[]
) {
  const apiKey = process.env.RESEND_API_KEY
  const from = getFromAddress()
  if (!apiKey || !from) {
    throw new Error("Email provider not configured")
  }

  const { Resend } = await import("resend")
  const resend = new Resend(apiKey)

  const subject = `Your week ahead – ${tasks.length} upcoming (PlanEra)`

  const taskRows = tasks
    .map(
      (t) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${escapeHtml(t.title)}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
            ${t.className ? escapeHtml(t.className) + " · " : ""}
            Due <strong style="color:#4f46e5;">${t.dueDate ? formatDateDisplay(t.dueDate) : ""}</strong>
          </p>
        </td>
      </tr>`
    )
    .join("")

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:#312e81;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">PlanEra</p>
            <p style="margin:6px 0 0;font-size:14px;color:#a5b4fc;">Your week ahead</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">
              You have ${tasks.length} assignment${tasks.length !== 1 ? "s" : ""} coming up this week.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
              Here’s what’s on your plate:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${taskRows}
            </table>
            <div style="margin-top:28px;text-align:center;">
              <a href="${APP_URL}/plan"
                 style="display:inline-block;background:#4f46e5;color:#ffffff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
                Get your AI study plan →
              </a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You’re receiving this because you have email reminders on in
              <a href="${APP_URL}/settings" style="color:#6366f1;text-decoration:none;">PlanEra Settings</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const text = `Your week ahead – ${tasks.length} upcoming:\n\n${tasks
    .map(
      (t) =>
        `• ${t.title}${t.className ? ` (${t.className})` : ""} – due ${t.dueDate ? formatDateDisplay(t.dueDate) : ""}`
    )
    .join("\n")}\n\nGet your AI study plan: ${APP_URL}/plan\n\n- PlanEra`

  await resend.emails.send({
    to: email,
    from,
    subject,
    text,
    html,
  })
}
