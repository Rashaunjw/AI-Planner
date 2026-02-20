import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateStudyPlanWithBlocks, ExtractedTask } from "@/lib/openai"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: {
        userId: session.user.id,
        status: "pending",
        dueDate: { not: null },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    })

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: "No pending tasks found. Upload a syllabus first!" },
        { status: 400 }
      )
    }

    const extractedTasks: ExtractedTask[] = tasks.map((t) => ({
      title: t.title,
      description: t.description ?? undefined,
      dueDate: t.dueDate?.toISOString().slice(0, 10),
      priority: (["low", "medium", "high"].includes(t.priority ?? "")
        ? t.priority
        : "medium") as "low" | "medium" | "high",
      category: t.category ?? "assignment",
      estimatedDuration: t.estimatedDuration ?? undefined,
      weightPercent: t.weightPercent ?? undefined,
      className: t.className ?? undefined,
    }))

    const { plan, blocks } = await generateStudyPlanWithBlocks(extractedTasks)
    return NextResponse.json({ plan, blocks })
  } catch (error) {
    console.error("Study plan error:", error)
    return NextResponse.json(
      { error: "Failed to generate study plan. Please try again." },
      { status: 500 }
    )
  }
}

