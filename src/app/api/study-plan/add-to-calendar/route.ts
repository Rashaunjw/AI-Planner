import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export interface StudyPlanBlock {
  date: string
  title: string
  durationMinutes: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const raw = Array.isArray(body?.blocks) ? body.blocks : []
    const blocks: StudyPlanBlock[] = raw
      .filter(
        (b: unknown): b is StudyPlanBlock =>
          typeof b === "object" &&
          b !== null &&
          typeof (b as StudyPlanBlock).date === "string" &&
          typeof (b as StudyPlanBlock).title === "string" &&
          typeof (b as StudyPlanBlock).durationMinutes === "number"
      )
      .map((b) => ({
        date: String(b.date).slice(0, 10),
        title: String(b.title).slice(0, 200),
        durationMinutes: Math.max(15, Math.min(480, Number(b.durationMinutes) || 60)),
      }))

    if (blocks.length === 0) {
      return NextResponse.json(
        { error: "No valid blocks to add." },
        { status: 400 }
      )
    }

    const created: string[] = []
    for (const block of blocks) {
      const [y, m, d] = block.date.split("-").map(Number)
      const dueDate = new Date(y, m - 1, d, 9, 0, 0)

      const task = await prisma.task.create({
        data: {
          userId: session.user.id,
          title: block.title,
          dueDate,
          priority: "medium",
          status: "pending",
          category: "study_block",
          className: "Study",
          estimatedDuration: block.durationMinutes,
        },
      })
      created.push(task.id)
    }

    return NextResponse.json({ added: created.length, taskIds: created })
  } catch (error) {
    console.error("Study plan add-to-calendar error:", error)
    return NextResponse.json(
      { error: "Failed to add blocks to calendar." },
      { status: 500 }
    )
  }
}
