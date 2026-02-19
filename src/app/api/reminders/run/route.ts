import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ReminderCandidate = {
  taskId: string
  title: string
  dueDate: Date
}

export async function POST(request: NextRequest) {
  return handleRequest(request)
}

export async function GET(request: NextRequest) {
  return handleRequest(request)
}

async function handleRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const users = await prisma.user.findMany({
      where: { emailReminders: true },
      select: { id: true, email: true, reminderDays: true },
    })

    let sentCount = 0
    for (const user of users) {
      if (!user.email) continue
      const tasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: { not: null },
          NOT: { status: "completed" },
        },
        select: { id: true, title: true, dueDate: true },
      })

      const todayKey = formatDateKeyUTC(new Date())
      const candidates: ReminderCandidate[] = []
      for (const task of tasks) {
        if (!task.dueDate) continue
        const reminderDate = new Date(task.dueDate)
        reminderDate.setUTCDate(reminderDate.getUTCDate() - user.reminderDays)
        if (formatDateKeyUTC(reminderDate) === todayKey) {
          candidates.push({ taskId: task.id, title: task.title, dueDate: task.dueDate })
        }
      }

      if (candidates.length === 0) continue

      const existing = await prisma.reminder.findMany({
        where: {
          userId: user.id,
          type: "email",
          scheduledFor: startOfDayUTC(new Date()),
        },
        select: { taskId: true },
      })
      const sentTaskIds = new Set(existing.map((item) => item.taskId))
      const toSend = candidates.filter((item) => !sentTaskIds.has(item.taskId))
      if (toSend.length === 0) continue

      await sendReminderEmail(user.email, user.reminderDays, toSend)

      await prisma.reminder.createMany({
        data: toSend.map((item) => ({
          userId: user.id,
          taskId: item.taskId,
          type: "email",
          scheduledFor: startOfDayUTC(new Date()),
          isSent: true,
        })),
      })

      sentCount += 1
    }

    return NextResponse.json({ sentCount })
  } catch (error) {
    console.error("Reminder run error:", error)
    return NextResponse.json({ error: "Failed to send reminders." }, { status: 500 })
  }
}

async function sendReminderEmail(
  email: string,
  reminderDays: number,
  tasks: ReminderCandidate[]
) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM || process.env.FROM_EMAIL || process.env.EMAIL_FROM
  if (!apiKey || !from) {
    throw new Error("Email provider not configured")
  }

  const { Resend } = await import("resend")
  const resend = new Resend(apiKey)

  const dayLabel = reminderDays === 1 ? "tomorrow" : `in ${reminderDays} days`
  const subject = `${tasks.length} assignment${tasks.length !== 1 ? "s" : ""} due ${dayLabel} (PlanEra)`

  // Plain-text fallback
  const textLines = tasks
    .map((t) => `• ${t.title}  (due ${formatDateDisplay(t.dueDate)})`)
    .join("\n")
  const text = `Hi,\n\nYou have ${tasks.length} assignment${tasks.length !== 1 ? "s" : ""} due ${dayLabel}:\n\n${textLines}\n\nStay on top of it at https://planera.app/tasks\n\n- PlanEra`

  // Branded HTML email
  const taskRows = tasks
    .map(
      (t) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
          <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${escapeHtml(t.title)}</p>
          <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
            Due <strong style="color:#dc2626;">${formatDateDisplay(t.dueDate)}</strong>
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

        <!-- Header -->
        <tr>
          <td style="background:#312e81;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">PlanEra</p>
            <p style="margin:6px 0 0;font-size:14px;color:#a5b4fc;">Deadline reminder</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">
              You have ${tasks.length} assignment${tasks.length !== 1 ? "s" : ""} due ${dayLabel}.
            </p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
              Don&rsquo;t let these sneak up on you &mdash; here&rsquo;s what&rsquo;s coming up:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              ${taskRows}
            </table>

            <div style="margin-top:28px;text-align:center;">
              <a href="https://planera.app/tasks"
                 style="display:inline-block;background:#4f46e5;color:#ffffff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
                View All Assignments →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              You&rsquo;re receiving this because you enabled email reminders in
              <a href="https://planera.app/settings" style="color:#6366f1;text-decoration:none;">PlanEra Settings</a>.
              Turn them off there any time.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    to: email,
    from,
    subject,
    text,
    html,
  })
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function formatDateKeyUTC(date: Date) {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0")
  const day = `${date.getUTCDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function formatDateDisplay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

