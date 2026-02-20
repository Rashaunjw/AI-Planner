import { prisma } from "@/lib/prisma"

/**
 * Build a text summary of the user's tasks/schedule for the chat LLM.
 * Includes pending tasks with due dates (and recent completed) so the bot can answer
 * "when is X due?", "what's due this week?", etc.
 */
export async function getScheduleContextForChat(userId: string): Promise<string> {
  const now = new Date()
  const pastCutoff = new Date(now)
  pastCutoff.setDate(pastCutoff.getDate() - 14)
  const futureCutoff = new Date(now)
  futureCutoff.setFullYear(futureCutoff.getFullYear() + 1)

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      dueDate: { gte: pastCutoff, lte: futureCutoff },
    },
    orderBy: { dueDate: "asc" },
    select: {
      title: true,
      dueDate: true,
      className: true,
      category: true,
      priority: true,
      status: true,
      weightPercent: true,
    },
  })

  if (tasks.length === 0) {
    return "The user has no tasks or assignments in the system yet (or none with due dates in the past two weeks or next year). Suggest they upload a syllabus or add tasks from the Tasks page."
  }

  const lines = tasks.map((t) => {
    const dateStr = t.dueDate
      ? t.dueDate.toISOString().slice(0, 10)
      : "no date"
    const parts = [
      `- ${t.title}`,
      `  due: ${dateStr}`,
      t.className ? `  class: ${t.className}` : null,
      t.category ? `  type: ${t.category}` : null,
      t.status ? `  status: ${t.status}` : null,
      t.weightPercent != null ? `  weight: ${t.weightPercent}%` : null,
    ].filter(Boolean)
    return parts.join(", ")
  })

  const byClass = new Map<string, number>()
  for (const t of tasks) {
    const c = t.className?.trim() || "Uncategorized"
    byClass.set(c, (byClass.get(c) ?? 0) + 1)
  }
  const classSummary = Array.from(byClass.entries())
    .map(([name, count]) => `${name}: ${count} task(s)`)
    .join("; ")

  return [
    "The user's schedule (tasks with due dates):",
    "",
    lines.join("\n"),
    "",
    `Summary by class: ${classSummary}.`,
    "",
    "Use this data to answer questions about due dates, what's due this week, which class has the most assignments, etc. If the user asks something not in this data, say you don't have that information and suggest they check the Tasks or Calendar page.",
  ].join("\n")
}
