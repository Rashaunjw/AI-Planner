import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await Promise.all([
      prisma.reminder.deleteMany({ where: { userId: session.user.id } }),
      prisma.task.deleteMany({ where: { userId: session.user.id } }),
      prisma.upload.deleteMany({ where: { userId: session.user.id } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Activity clear error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


