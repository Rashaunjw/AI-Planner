import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDateInput } from '@/lib/date'
import { normalizeWeightPercent } from '@/lib/weights'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, dueDate, priority, category, estimatedDuration, status, weightPercent, className } = body

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const normalizedWeightPercent = normalizeWeightPercent(weightPercent)
    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: 'Assignment name is required' }, { status: 400 })
    }
    if (className !== undefined && !className.trim()) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }
    if (dueDate !== undefined && !parseDateInput(dueDate)) {
      return NextResponse.json({ error: 'Invalid due date' }, { status: 400 })
    }
    const task = await prisma.task.update({
      where: {
        id: id
      },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(dueDate && { dueDate: parseDateInput(dueDate) }),
        ...(priority && { priority }),
        ...(category !== undefined && { category }),
        ...(estimatedDuration !== undefined && { estimatedDuration }),
        ...(status && { status }),
        ...(weightPercent !== undefined && {
          weightPercent: weightPercent === null ? null : (normalizedWeightPercent ?? null)
        }),
        ...(className !== undefined && { className: className.trim() })
      }
    })

    return NextResponse.json({ task })

  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Remove from Google Calendar if this task had synced events
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: { taskId: id, googleEventId: { not: null } },
      include: { calendar: true },
    })
    if (calendarEvents.length > 0) {
      const account = await prisma.account.findFirst({
        where: { userId: session.user.id, provider: 'google' },
      })
      if (account?.access_token) {
        let accessToken = account.access_token
        const expiresAt = account.expires_at ? account.expires_at * 1000 : null
        if (account.refresh_token && (!expiresAt || Date.now() > expiresAt - 60_000)) {
          const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID || '',
              client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
              grant_type: 'refresh_token',
              refresh_token: account.refresh_token,
            }).toString(),
          })
          if (refreshRes.ok) {
            const data = await refreshRes.json()
            accessToken = data.access_token
          }
        }
        const calendarId = (cal: { googleCalendarId: string | null }) => cal.googleCalendarId || 'primary'
        for (const ev of calendarEvents) {
          if (!ev.googleEventId) continue
          const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId(ev.calendar))}/events/${encodeURIComponent(ev.googleEventId)}`
          await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` },
          })
        }
      }
    }

    await prisma.task.delete({
      where: {
        id: id
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
