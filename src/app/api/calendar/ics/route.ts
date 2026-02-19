import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * ICS calendar feed: GET /api/calendar/ics?userId=<id>
 *
 * Returns a standards-compliant iCalendar (.ics) feed of the user's pending
 * tasks. Any calendar app that supports URL subscriptions (Apple Calendar,
 * Outlook, Google Calendar, Fantastical, etc.) can subscribe to this URL and
 * it will auto-refresh.
 *
 * The userId acts as a simple read-only token. Because the feed is read-only
 * and contains no sensitive personal data beyond task titles and due dates,
 * this is acceptable for an MVP. A dedicated opaque token can replace it later.
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')

  if (!userId) {
    return new NextResponse('Missing userId', { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  })

  if (!user) {
    return new NextResponse('Not found', { status: 404 })
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      dueDate: { not: null },
      status: { not: 'cancelled' },
    },
    orderBy: { dueDate: 'asc' },
  })

  const now = formatICSDate(new Date())

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PlanEra//Assignments//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:PlanEra ${user.name ?? 'Assignments'}`,
    'X-WR-TIMEZONE:UTC',
    'X-WR-CALDESC:Your assignments from PlanEra',
  ]

  for (const task of tasks) {
    if (!task.dueDate) continue

    const dateStr = formatICSDay(task.dueDate)
    const nextDay = new Date(task.dueDate)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    const nextDayStr = formatICSDay(nextDay)

    const uid = `${task.id}@planera.app`
    const summary = escapeICS(
      task.className ? `[${task.className}] ${task.title}` : task.title
    )

    const descParts: string[] = []
    if (task.className) descParts.push(`Class: ${task.className}`)
    if (task.category) descParts.push(`Type: ${task.category}`)
    if (task.weightPercent) descParts.push(`Worth: ${task.weightPercent}% of grade`)
    if (task.estimatedDuration) descParts.push(`Est. time: ${task.estimatedDuration} min`)
    if (task.description) descParts.push(`Notes: ${task.description}`)
    const description = descParts.length ? escapeICS(descParts.join('\\n')) : ''

    const priorityMap: Record<string, number> = { high: 1, medium: 5, low: 9 }
    const priority = priorityMap[task.priority] ?? 5

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${nextDayStr}`,
      `SUMMARY:${summary}`,
      ...(description ? [`DESCRIPTION:${description}`] : []),
      `PRIORITY:${priority}`,
      `STATUS:${task.status === 'completed' ? 'COMPLETED' : 'NEEDS-ACTION'}`,
      'END:VEVENT'
    )
  }

  lines.push('END:VCALENDAR')

  // iCalendar spec requires CRLF line endings
  const icsContent = lines.join('\r\n')

  return new NextResponse(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="planera-assignments.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

// e.g. 20250219T120000Z
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

// e.g. 20250219 (all-day date value)
function formatICSDay(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

// Escape special chars per RFC 5545
function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

