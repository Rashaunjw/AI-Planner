import OpenAI from 'openai'
import { normalizeWeightPercent } from '@/lib/weights'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export interface ExtractedTask {
  title: string
  description?: string
  dueDate?: string
  /** When the syllabus states a due time (e.g. "due 11:59 PM"), 24-hour HH:mm */
  dueTime?: string
  priority: 'low' | 'medium' | 'high'
  category: string
  estimatedDuration?: number
  weightPercent?: number
  className?: string
}

export interface ExtractTasksResult {
  tasks: ExtractedTask[]
  classDefaultTimes: Record<string, string>
}

/**
 * Extract raw text from an image (e.g. photo of a syllabus) using vision.
 * Returns text suitable for extractTasksFromContent.
 */
export async function getTextFromImage(
  imageBuffer: Buffer,
  mimeType: string = 'image/png'
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }
  const base64 = imageBuffer.toString('base64')
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are an OCR assistant. Extract all text from the image exactly as it appears. Preserve structure: line breaks, lists, tables (as lines or rows). Do not add commentary. If the image contains a syllabus, schedule, or calendar, include every date, assignment name, and deadline you can read. If you cannot read any text, return the word NONE.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all text from this image. Return only the raw extracted text.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 2000,
  })
  const text = response.choices[0]?.message?.content?.trim() ?? ''
  if (text.toUpperCase() === 'NONE' || text.length < 2) {
    throw new Error('No readable text found in the image')
  }
  return text
}

export async function extractTasksFromContent(
  content: string,
  context?: string
): Promise<ExtractTasksResult> {
  const currentYear = new Date().getFullYear()
  const detectedGroupName = extractGroupNameFromContent(content, context)

  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    const basePrompt: string =
      "You are an AI assistant that extracts tasks and deadlines from syllabus, schedule, or calendar content. Extract ALL dated items: assignments, exams, projects, meetings, practices, games, matches, events, and any other time-bound entries. For each item provide: title (e.g. assignment name or 'vs Opponent' for games), description (optional), dueDate (YYYY-MM-DD), priority (low/medium/high), category (assignment/exam/project/quiz/homework/meeting/practice/game/event), estimatedDuration (optional), weightPercent (optional), className (course, team, sport, or group name). IMPORTANT for schedules: (1) If the document title contains a season or year range (e.g. '2025-26', '2024-25'), use that to set the year: e.g. for '2025-26' use 2025 for Nov/Dec and 2026 for Jan onward. (2) Parse dates in any form: 'Nov 8 (Sat)', 'Jan 3', '1/14', 'Mon DD'; convert to YYYY-MM-DD using the inferred or current year (" +
      currentYear +
      "). (3) For table-like content with columns (Date, Time, Opponent, etc.), each data row is one task; use the row's date and time. (4) If a time is given (e.g. '3:30 PM CT', '7 PM ET'), add dueTime in 24-hour HH:mm (e.g. '15:30', '19:00'); ignore timezone for storage. (5) For sports/athletics schedules, use the schedule or sport name as className (e.g. \"Men's Basketball\") and title like \"vs Opponent\" or \"Game at Opponent\". If the document states when a class or group meets, add classDefaultTimes mapping className to HH:mm; otherwise use classDefaultTimes: {}. Return JSON: { \"tasks\": [ ... ], \"classDefaultTimes\": { ... } }. Do not skip rows that look like games or events; include every row that has a date."

    const exampleFormat: string =
      "Example: { \"tasks\": [{\"title\": \"vs Trevecca Nazarene\", \"dueDate\": \"2025-11-08\", \"dueTime\": \"15:30\", \"priority\": \"medium\", \"category\": \"game\", \"className\": \"Men's Basketball\"}, {\"title\": \"Midterm Exam\", \"dueDate\": \"2024-03-15\", \"category\": \"exam\", \"className\": \"Biology 101\"}], \"classDefaultTimes\": {} }. For 'Nov 8 (Sat)' with '3:30 PM CT' use dueDate '2025-11-08' and dueTime '15:30'."

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at parsing academic syllabi and extracting structured task information. Return only valid JSON."
        },
        {
          role: "user",
          content:
            basePrompt +
            (context ? `\n\nContext: ${context}` : "") +
            (detectedGroupName ? `\n\nDetected group name: ${detectedGroupName}` : "") +
            "\n\nText to analyze:\n" +
            content +
            "\n\n" +
            exampleFormat
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const responseContent = response.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    const parsed = parseJsonFromModel(responseContent)
    let tasks: ExtractedTask[]
    let classDefaultTimes: Record<string, string> = {}

    if (Array.isArray(parsed)) {
      tasks = parsed as ExtractedTask[]
    } else if (
      parsed &&
      typeof parsed === 'object' &&
      'tasks' in parsed &&
      Array.isArray((parsed as { tasks: unknown }).tasks)
    ) {
      const obj = parsed as { tasks: ExtractedTask[]; classDefaultTimes?: Record<string, string> }
      tasks = obj.tasks
      if (obj.classDefaultTimes && typeof obj.classDefaultTimes === 'object') {
        classDefaultTimes = obj.classDefaultTimes
      }
    } else {
      tasks = []
    }

    const cleaned = tasks.map((task) => ({
      ...task,
      title: task.title?.trim() || 'Untitled Task',
      description: task.description?.trim(),
      priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
      category: task.category?.trim() || 'assignment',
      weightPercent: normalizeWeightPercent(task.weightPercent),
      className: task.className?.trim() || detectedGroupName || undefined,
      dueTime: normalizeTimeString(task.dueTime),
    }))

    if (cleaned.length === 0) {
      const fallback = fallbackExtractTasks(content, currentYear, detectedGroupName)
      return { tasks: fallback, classDefaultTimes: {} }
    }

    const normalizedDefaults: Record<string, string> = {}
    for (const [cls, time] of Object.entries(classDefaultTimes)) {
      const t = normalizeTimeString(time)
      if (t) normalizedDefaults[cls.trim()] = t
    }

    return { tasks: cleaned, classDefaultTimes: normalizedDefaults }
  } catch (error) {
    console.error('Error extracting tasks:', error)
    const fallback = fallbackExtractTasks(content, currentYear, detectedGroupName)
    if (fallback.length > 0) {
      return { tasks: fallback, classDefaultTimes: {} }
    }
    throw new Error('Failed to extract tasks from content')
  }
}

/** Normalize time to HH:mm 24-hour, or return undefined if invalid */
function normalizeTimeString(value: string | undefined): string | undefined {
  if (!value || typeof value !== 'string') return undefined
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)))
    const m = Math.min(59, Math.max(0, parseInt(match[2], 10)))
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  return undefined
}

/**
 * Answer a user chat message using only the provided schedule context (tasks/summary).
 * Used by the schedule chatbot.
 */
export async function chatWithScheduleContext(
  scheduleContext: string,
  userMessage: string
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a helpful assistant for a student using PlanEra. You answer questions about their schedule, assignments, and due dates using ONLY the schedule data provided below. Be concise and friendly. If the question is not about their schedule or you do not have the information, say so and suggest they check the Tasks or Calendar page. Do not make up due dates or assignments.',
      },
      {
        role: 'user',
        content: `Schedule data:\n\n${scheduleContext}\n\n---\n\nUser question: ${userMessage}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  })
  const reply = response.choices[0]?.message?.content?.trim()
  return reply ?? "I couldn't generate a reply. Please try again."
}

/** Same as above but with conversation history for follow-up questions. */
export async function chatWithScheduleAndHistory(
  scheduleContext: string,
  messageHistory: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }
  const systemContent =
    'You are a helpful assistant for a student using PlanEra. You answer questions about their schedule, assignments, and due dates using ONLY the schedule data provided below. Be concise and friendly. If the question is not about their schedule or you do not have the information, say so and suggest they check the Tasks or Calendar page. Do not make up due dates or assignments.\n\nSchedule data:\n\n' +
    scheduleContext
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemContent },
    ...messageHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3,
    max_tokens: 500,
  })
  const reply = response.choices[0]?.message?.content?.trim()
  return reply ?? "I couldn't generate a reply. Please try again."
}

export interface StudyPlanBlock {
  date: string
  title: string
  durationMinutes: number
}

export async function generateStudyPlan(tasks: ExtractedTask[]): Promise<string> {
  const result = await generateStudyPlanWithBlocks(tasks)
  return result.plan
}

export async function generateStudyPlanWithBlocks(
  tasks: ExtractedTask[]
): Promise<{ plan: string; blocks: StudyPlanBlock[] }> {
  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    const basePrompt =
      "You are an AI study planner. Given the following academic tasks, create a personalized study plan."
    const tasksJson = JSON.stringify(tasks, null, 2)
    const requirements = `Create a study plan that: 1. Prioritizes tasks by due date and importance, 2. Suggests realistic time blocks for studying, 3. Includes buffer time for unexpected delays, 4. Considers workload distribution, 5. Provides specific study strategies for each task type.

Return your response in two parts:
1. First, the full study plan as structured text (headings, bullets, clear advice).
2. Then on a new line write exactly: ---BLOCKS---
3. Then a JSON array of 5-12 study blocks that can be added to a calendar. Each block must have: "date" (YYYY-MM-DD, use dates from today through the next 14 days), "title" (short string, e.g. "Review Chapter 5"), "durationMinutes" (number, e.g. 60). No other text after the JSON array.`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert academic advisor who creates personalized study plans. When outputting JSON, output only valid JSON with no markdown code fence.",
        },
        {
          role: "user",
          content: `${basePrompt}\n\nTasks:\n${tasksJson}\n\n${requirements}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const raw = response.choices[0]?.message?.content || "Study plan generation failed"
    const blocksMarker = "---BLOCKS---"
    const blocksIndex = raw.indexOf(blocksMarker)
    let plan = raw
    let blocks: StudyPlanBlock[] = []

    if (blocksIndex !== -1) {
      plan = raw.slice(0, blocksIndex).trim()
      const jsonPart = raw.slice(blocksIndex + blocksMarker.length).trim()
      try {
        const parsed = parseJsonFromModel(jsonPart)
        if (Array.isArray(parsed)) {
          blocks = parsed
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
        }
      } catch {
        // ignore parse errors; blocks stay []
      }
    }

    return { plan, blocks }
  } catch (error) {
    console.error("Error generating study plan:", error)
    throw new Error("Failed to generate study plan")
  }
}

function parseJsonFromModel(raw: string): unknown {
  const trimmed = raw.trim()
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const content = fencedMatch?.[1]?.trim() ?? trimmed

  if (content.startsWith('{')) {
    const end = content.lastIndexOf('}')
    if (end > 0) return JSON.parse(content.slice(0, end + 1))
  }
  const arrayStart = content.indexOf('[')
  const arrayEnd = content.lastIndexOf(']')
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return JSON.parse(content.slice(arrayStart, arrayEnd + 1))
  }
  return JSON.parse(content)
}

function fallbackExtractTasks(
  content: string,
  fallbackYear: number,
  className?: string
): ExtractedTask[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const tasks: ExtractedTask[] = []
  const seen = new Set<string>()

  for (const line of lines) {
    const dueDate = findDateInText(line, fallbackYear)
    if (!dueDate) continue

    const keyword = findKeywordInText(line)
    if (!keyword) continue

    const title = buildTitleFromLine(line, keyword)
    const key = `${title}|${dueDate}`
    if (seen.has(key)) continue
    seen.add(key)

    tasks.push({
      title,
      description: line,
      dueDate,
      priority: keyword.priority,
      category: keyword.category,
      className
    })
  }

  return tasks
}

function extractGroupNameFromContent(content: string, context?: string): string | undefined {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 40)

  for (const line of lines) {
    const scheduleMatch = line.match(/^(.+?)\s+Schedule\s*$/i)
    if (scheduleMatch?.[1]) {
      const name = scheduleMatch[1].replace(/\d{4}-\d{2}(?:\s|$)/g, '').trim()
      if (name.length >= 3 && name.length <= 80) return name
    }
    const labeledMatch = line.match(
      /(?:course|class|team|organization|org|department|group|project|club|squad)\s*(?:name|title)?\s*[:\-]\s*(.+)/i
    )
    if (labeledMatch?.[1]) {
      const name = labeledMatch[1].trim()
      if (name.length >= 3 && name.length <= 80) {
        return name
      }
    }
  }

  if (context === "greek life") {
    for (const line of lines) {
      const greekMatch = line.match(/\b(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\b/i)
      if (greekMatch) {
        const name = line.trim()
        if (name.length >= 3 && name.length <= 80) {
          return name
        }
      }
    }
  }

  for (const line of lines) {
    const codeMatch = line.match(/\b([A-Z]{2,4}\s?\d{3}[A-Z]?)\b/)
    if (codeMatch) {
      const rest = line.replace(codeMatch[0], "").replace(/^[\s:\-–]+/, "").trim()
      const name = rest ? `${codeMatch[0]} ${rest}` : codeMatch[0]
      if (name.length >= 3 && name.length <= 80) {
        return name
      }
    }
  }

  return undefined
}

const MONTH_ABBREV: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

function findDateInText(text: string, fallbackYear: number): string | undefined {
  const isoMatch = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return formatDateYYYYMMDD(year, month, day)
    }
  }

  // "Nov 8 (Sat)", "Jan 3", "Dec 15" - month abbreviation + day
  const abbrevMatch = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:\s*\([A-Za-z]{2,3}\))?\b/i)
  if (abbrevMatch) {
    const month = MONTH_ABBREV[abbrevMatch[1].toLowerCase()]
    const day = Number(abbrevMatch[2])
    if (month && day >= 1 && day <= 31) {
      const year = month >= 11 ? fallbackYear - 1 : fallbackYear
      return formatDateYYYYMMDD(year, month, day)
    }
  }

  // Only treat slash dates as dates to avoid matching ranges like "11-14".
  const numericMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?\b/)
  if (numericMatch) {
    const month = Number(numericMatch[1])
    const day = Number(numericMatch[2])
    const yearRaw = numericMatch[3]
    const year = yearRaw
      ? (yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw))
      : fallbackYear
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return formatDateYYYYMMDD(year, month, day)
    }
  }

  return undefined
}

function findKeywordInText(text: string): { category: ExtractedTask['category']; priority: ExtractedTask['priority'] } | undefined {
  const lower = text.toLowerCase()
  if (/\b(exam|midterm|final)\b/.test(lower)) {
    return { category: 'exam', priority: 'high' }
  }
  if (/\bquiz\b/.test(lower)) {
    return { category: 'quiz', priority: 'medium' }
  }
  if (/\b(project|paper)\b/.test(lower)) {
    return { category: 'project', priority: 'high' }
  }
  if (/\b(problem set|ps[-\s]?\d+|assignment|homework)\b/.test(lower)) {
    return { category: 'assignment', priority: 'medium' }
  }
  if (/\b(vs\.?|at\s+[A-Za-z]|opponent|game|match|home|away|neutral)\b/.test(lower) || /(W|L)\s+\d+-\d+/.test(text)) {
    return { category: 'game', priority: 'medium' }
  }
  return undefined
}

function buildTitleFromLine(text: string, keyword: { category: ExtractedTask['category']; priority: ExtractedTask['priority'] }): string {
  const problemSetMatch = text.match(/\b(?:problem set|ps)[-\s]?(\d+)\b/i)
  if (problemSetMatch?.[1]) {
    return `Problem Set ${problemSetMatch[1]}`
  }

  const examMatch = text.match(/\b([A-Za-z0-9 &-]{0,40}\bExam)\b/i)
  if (examMatch?.[1]) {
    return examMatch[1].trim()
  }

  if (keyword.category === 'game') {
    const vsMatch = text.match(/(?:vs\.?|at)\s+([A-Za-z0-9\s&.'-]{3,40})(?:\s|$|,)/i)
    if (vsMatch?.[1]) return `vs ${vsMatch[1].trim()}`
    const opponentMatch = text.match(/([A-Za-z0-9\s&.'-]{4,36})\s*(?:\(|$|,)/)
    if (opponentMatch?.[1]) return `vs ${opponentMatch[1].trim()}`
    return 'Game'
  }

  if (keyword.category === 'project') {
    return 'Project'
  }

  if (keyword.category === 'quiz') {
    return 'Quiz'
  }

  return 'Assignment'
}

function formatDateYYYYMMDD(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}
