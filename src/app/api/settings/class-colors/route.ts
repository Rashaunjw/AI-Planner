import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const VALID_COLOR_IDS = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"])

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [classes, classColors] = await Promise.all([
      prisma.task.findMany({
        where: { userId: session.user.id },
        select: { className: true },
        distinct: ["className"],
      }),
      prisma.userClassColor.findMany({
        where: { userId: session.user.id },
        select: { className: true, colorId: true },
      }),
    ])

    const classNames = [...new Set(classes.map((c) => c.className?.trim()).filter(Boolean))].sort()
    const colorMap: Record<string, string> = {}
    classColors.forEach((c) => {
      colorMap[c.className] = c.colorId
    })

    return NextResponse.json({ classes: classNames, classColors: colorMap })
  } catch (error) {
    console.error("Class colors fetch error:", error)
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
    const className = typeof body?.className === "string" ? body.className.trim() : null
    const colorId = typeof body?.colorId === "string" ? body.colorId : null

    if (!className) {
      return NextResponse.json({ error: "className is required" }, { status: 400 })
    }
    if (!colorId || !VALID_COLOR_IDS.has(colorId)) {
      return NextResponse.json({ error: "colorId must be 1-11" }, { status: 400 })
    }

    await prisma.userClassColor.upsert({
      where: {
        userId_className: { userId: session.user.id, className },
      },
      create: { userId: session.user.id, className, colorId },
      update: { colorId },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Class color update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
