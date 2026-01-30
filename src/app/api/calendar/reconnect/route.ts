import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.account.deleteMany({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Google reconnect error:", error)
    return NextResponse.json({ error: "Failed to reconnect Google." }, { status: 500 })
  }
}

