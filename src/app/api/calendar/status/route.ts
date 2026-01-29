import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "google" },
      select: {
        access_token: true,
        refresh_token: true,
        expires_at: true,
        providerAccountId: true,
      },
    })

    if (!account) {
      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({
      connected: true,
      hasAccessToken: Boolean(account.access_token),
      hasRefreshToken: Boolean(account.refresh_token),
      expiresAt: account.expires_at,
      providerAccountId: account.providerAccountId,
    })
  } catch (error) {
    console.error("Calendar status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

