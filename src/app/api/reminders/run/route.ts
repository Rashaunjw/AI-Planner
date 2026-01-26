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
  const apiKey = process.env.SENDGRID_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    throw new Error("Email provider not configured")
  }

  const { default: sgMail } = await import("@sendgrid/mail")
  sgMail.setApiKey(apiKey)

  const subject = `Upcoming tasks due in ${reminderDays} day${reminderDays === 1 ? "" : "s"}`
  const lines = tasks
    .map((task) => `• ${task.title} (due ${formatDateDisplay(task.dueDate)})`)
    .join("\n")

  await sgMail.send({
    to: email,
    from,
    subject,
    text: `Here are your upcoming tasks:\n\n${lines}\n`,
    html: `<p>Here are your upcoming tasks:</p><ul>${tasks
      .map((task) => `<li>${task.title} (due ${formatDateDisplay(task.dueDate)})</li>`)
      .join("")}</ul>`,
  })
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

