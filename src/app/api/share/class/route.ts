import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const className = typeof body?.className === "string" ? body.className.trim() : null
    if (!className) {
      return NextResponse.json({ error: "className is required" }, { status: 400 })
    }

    const token = randomBytes(24).toString("base64url")
    await prisma.classShare.create({
      data: { userId: session.user.id, className, token },
    })

    const base =
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
    const url = `${base}/share/class?token=${token}`

    return NextResponse.json({ token, url })
  } catch (error) {
    console.error("Share create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 })
    }

    const share = await prisma.classShare.findUnique({
      where: { token },
      select: { userId: true, className: true },
    })
    if (!share) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
    }

    const tasks = await prisma.task.findMany({
      where: { userId: share.userId, className: share.className },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
        category: true,
      },
    })

    return NextResponse.json({
      className: share.className,
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate?.toISOString() ?? null,
        priority: t.priority,
        status: t.status,
        category: t.category,
      })),
    })
  } catch (error) {
    console.error("Share read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
