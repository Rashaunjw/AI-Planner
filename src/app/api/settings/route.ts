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

    const [user, accounts] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailReminders: true, reminderDays: true, calendarSync: true },
      }),
      prisma.account.findMany({
        where: { userId: session.user.id },
        select: { provider: true, providerAccountId: true },
      }),
    ])

    return NextResponse.json({
      settings: user ?? { emailReminders: true, reminderDays: 2 },
      accounts,
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
    const reminderDays =
      typeof body.reminderDays === "number" && body.reminderDays > 0
        ? Math.min(body.reminderDays, 30)
        : 2
    const calendarSync = Boolean(body.calendarSync)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { emailReminders, reminderDays, calendarSync },
      select: { emailReminders: true, reminderDays: true, calendarSync: true },
    })

    return NextResponse.json({ settings: user })
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

