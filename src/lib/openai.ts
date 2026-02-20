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
      "You are an AI assistant that extracts tasks and deadlines from syllabus or schedule content. Analyze the following text and extract all assignments, exams, projects, meetings, practices, and other tasks. For each task, provide: title (clear, concise title), description (brief description), dueDate (YYYY-MM-DD format), priority (low/medium/high), category (assignment/exam/project/quiz/homework/meeting/practice), estimatedDuration (minutes, optional), weightPercent (number 0-100 if a grading weight is specified), className (course, team, organization, or project name). If the syllabus or schedule uses a dated schedule table, treat the row's date as the dueDate for each task listed in that row. If a date is given as month/day without a year, use the current year (" +
      currentYear +
      "). If the syllabus explicitly states a due time for a specific assignment (e.g. 'due by 11:59 PM', 'due at 2:00 PM'), add dueTime for that task in 24-hour format HH:mm (e.g. '23:59', '14:00'). Do not guess due times; only add dueTime when clearly stated. If the syllabus states when the class meets (e.g. 'Class meets MWF 2:00-2:50 PM', 'Section at 10:00 AM'), add a classDefaultTimes object mapping each className to that meeting time in 24-hour HH:mm. Use class meeting time only as the default for when assignments are due in that class when no other time is stated. Return JSON: { \"tasks\": [ ... ], \"classDefaultTimes\": { \"ClassName\": \"HH:mm\", ... } }. If no class times appear, use classDefaultTimes: {}. If no date is mentioned for a task, omit dueDate. If a group name appears near the top, use it for className on all tasks."

    const exampleFormat: string =
      "Example: { \"tasks\": [{\"title\": \"Midterm Exam\", \"dueDate\": \"2024-03-15\", \"dueTime\": \"14:00\", \"priority\": \"high\", \"category\": \"exam\", \"className\": \"Biology 101\"}], \"classDefaultTimes\": { \"Biology 101\": \"14:00\" } }. For '1/14 Problem Set 1' with no time, use dueDate \"" +
      currentYear +
      '-01-14" and omit dueTime so the class default time can apply.'

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

export async function generateStudyPlan(tasks: ExtractedTask[]): Promise<string> {
  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    const basePrompt: string = "You are an AI study planner. Given the following academic tasks, create a personalized study plan."
    const tasksJson: string = JSON.stringify(tasks, null, 2)
    const requirements: string = "Create a study plan that: 1. Prioritizes tasks by due date and importance, 2. Suggests realistic time blocks for studying, 3. Includes buffer time for unexpected delays, 4. Considers workload distribution, 5. Provides specific study strategies for each task type. Return a detailed study plan as a structured text response."

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert academic advisor who creates personalized study plans."
        },
        {
          role: "user",
          content: basePrompt + "\n\nTasks:\n" + tasksJson + "\n\n" + requirements
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    return response.choices[0]?.message?.content || 'Study plan generation failed'

  } catch (error) {
    console.error('Error generating study plan:', error)
    throw new Error('Failed to generate study plan')
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
