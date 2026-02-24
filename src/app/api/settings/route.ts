import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [user, accounts, pushCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailReminders: true, reminderMinutesBefore: true, calendarSync: true, plan: true },
      }),
      prisma.account.findMany({
        where: { userId: session.user.id },
        select: { provider: true, providerAccountId: true },
      }),
      prisma.pushSubscription.count({ where: { userId: session.user.id } }),
    ])

    const uploads = await prisma.upload.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, fileName: true, createdAt: true },
    })

    return NextResponse.json({
      settings: user ?? { emailReminders: true, reminderMinutesBefore: 2880 },
      pushSubscribed: pushCount > 0,
      accounts,
      uploads,
    })
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const emailReminders = Boolean(body.emailReminders)
    const allowedMinutes = [10, 30, 60, 1440, 2880, 4320, 10080] as const // 10m, 30m, 1h, 1d, 2d, 3d, 1w
    const reminderMinutesBefore =
      typeof body.reminderMinutesBefore === "number" && allowedMinutes.includes(body.reminderMinutesBefore as (typeof allowedMinutes)[number])
        ? (body.reminderMinutesBefore as (typeof allowedMinutes)[number])
        : 2880
    const calendarSync = Boolean(body.calendarSync)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { emailReminders, reminderMinutesBefore, calendarSync },
      select: { emailReminders: true, reminderMinutesBefore: true, calendarSync: true },
    })

    return NextResponse.json({ settings: user })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

