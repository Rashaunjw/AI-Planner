import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseDateInput } from '@/lib/date'
import { normalizeWeightPercent } from '@/lib/weights'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ tasks })

  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, dueDate, priority, category, estimatedDuration, weightPercent, className } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Assignment name is required' }, { status: 400 })
    }

    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required' }, { status: 400 })
    }

    if (!className?.trim()) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    const parsedDueDate = dueDate ? parseDateInput(dueDate) : null
    const normalizedWeightPercent = normalizeWeightPercent(weightPercent)
    if (!parsedDueDate) {
      return NextResponse.json({ error: 'Invalid due date' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        description,
        dueDate: parsedDueDate,
        priority: priority || 'medium',
        category,
        estimatedDuration,
        weightPercent: normalizedWeightPercent ?? null,
        className: className.trim(),
        status: 'pending'
      }
    })

    return NextResponse.json({ task })

  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const oldRaw = typeof body?.oldClassName === 'string' ? body.oldClassName.trim() : ''
    const newRaw = typeof body?.newClassName === 'string' ? body.newClassName.trim() : ''
    const oldClassName = oldRaw === 'No Class' ? '' : oldRaw
    const newClassName = newRaw === 'No Class' ? null : (newRaw || null)

    if (oldRaw === '' && newRaw === '') {
      return NextResponse.json({ updated: 0 })
    }
    if (oldClassName === (newClassName ?? '')) {
      return NextResponse.json({ updated: 0 })
    }

    const where =
      oldClassName === ''
        ? { userId: session.user.id, OR: [{ className: null }, { className: '' }] }
        : { userId: session.user.id, className: oldClassName }

    const result = await prisma.task.updateMany({
      where,
      data: { className: newClassName },
    })

    if (newClassName && oldClassName !== '') {
      const oldColor = await prisma.userClassColor.findUnique({
        where: { userId_className: { userId: session.user.id, className: oldClassName } },
        select: { colorId: true },
      })
      if (oldColor) {
        await prisma.userClassColor.deleteMany({
          where: { userId: session.user.id, className: oldClassName },
        })
        await prisma.userClassColor.upsert({
          where: { userId_className: { userId: session.user.id, className: newClassName } },
          create: { userId: session.user.id, className: newClassName, colorId: oldColor.colorId },
          update: { colorId: oldColor.colorId },
        })
      }
      await prisma.classShare.updateMany({
        where: { userId: session.user.id, className: oldClassName },
        data: { className: newClassName },
      })
    }

    return NextResponse.json({ updated: result.count })
  } catch (error) {
    console.error('Error renaming class:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.task.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
