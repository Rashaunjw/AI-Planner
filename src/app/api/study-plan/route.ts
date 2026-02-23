import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateStudyPlanWithBlocks, ExtractedTask, getTextFromImage } from "@/lib/openai"

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/webp"] as const

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (IMAGE_MIMES.includes(file.type as (typeof IMAGE_MIMES)[number])) {
    return getTextFromImage(buffer, file.type)
  }
  if (file.type === "application/pdf") {
    const pdf = await import("pdf-parse/lib/pdf-parse")
    const pdfData = await pdf.default(buffer)
    return pdfData.text || ""
  }
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.type === "application/msword"
  ) {
    const mammoth = await import("mammoth")
    const result = await mammoth.extractRawText({ buffer })
    return result.value || ""
  }
  if (file.type === "text/plain") {
    return buffer.toString("utf-8")
  }
  return ""
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""
    let materialsText = ""

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const pasted = formData.get("materialsText")
      if (typeof pasted === "string" && pasted.trim()) {
        materialsText = pasted.trim()
      }
      const materials = formData.getAll("materials")
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
        ...IMAGE_MIMES,
      ]
      for (const m of materials) {
        if (!(m instanceof File) || !m.size) continue
        if (!allowedTypes.includes(m.type)) continue
        if (m.size > 10 * 1024 * 1024) continue
        try {
          const text = await extractTextFromFile(m)
          if (text.trim()) materialsText += (materialsText ? "\n\n" : "") + text.trim()
        } catch {
          // skip failed file
        }
      }
      if (materialsText.length > 15000) materialsText = materialsText.slice(0, 15000)
    } else {
      const body = await request.json().catch(() => ({}))
      const b = body?.materialsText
      if (typeof b === "string" && b.trim()) {
        materialsText = b.trim().slice(0, 15000)
      }
    }

    const preferences = await prisma.studyPlanPreferences.findUnique({
      where: { userId: session.user.id },
    })

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

    const prefsForAi = preferences
      ? {
          whenStudying: preferences.whenStudying,
          focusMinutes: preferences.focusMinutes,
          startsBefore: preferences.startsBefore,
          commonObstacle: preferences.commonObstacle,
          blockPreference: preferences.blockPreference,
          weeklyStudyHours: preferences.weeklyStudyHours,
        }
      : undefined

    const { plan, blocks } = await generateStudyPlanWithBlocks(extractedTasks, {
      preferences: prefsForAi,
      materialsText: materialsText || undefined,
    })
    return NextResponse.json({ plan, blocks })
  } catch (error) {
    console.error("Study plan error:", error)
    return NextResponse.json(
      { error: "Failed to generate study plan. Please try again." },
      { status: 500 }
    )
  }
}

