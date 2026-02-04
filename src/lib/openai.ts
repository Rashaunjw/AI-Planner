import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

export interface ExtractedTask {
  title: string
  description?: string
  dueDate?: string
  priority: 'low' | 'medium' | 'high'
  category: string
  estimatedDuration?: number
}

export async function extractTasksFromContent(content: string): Promise<ExtractedTask[]> {
  const currentYear = new Date().getFullYear()

  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    const basePrompt: string = "You are an AI assistant that extracts academic tasks and deadlines from syllabus content. Analyze the following text and extract all assignments, exams, projects, and other academic tasks. For each task, provide: title (clear, concise title), description (brief description), dueDate (YYYY-MM-DD format), priority (low/medium/high), category (assignment/exam/project/quiz/homework), estimatedDuration (minutes, optional). If the syllabus uses a dated schedule table (e.g., a date column with items on the same row), treat the row's date as the dueDate for each task listed in that row, even if it doesn't say 'due'. If a date is given as month/day without a year, infer the year from the syllabus; if no year is present, use the current year (" + currentYear + "). Return as JSON array. If no date is mentioned anywhere for a task, omit dueDate."
    
    const exampleFormat: string = "Example format: [{\"title\": \"Midterm Exam\", \"description\": \"Comprehensive exam covering chapters 1-8\", \"dueDate\": \"2024-03-15\", \"priority\": \"high\", \"category\": \"exam\", \"estimatedDuration\": 120}]. If the text says '1/14 Problem Set 1', output dueDate as \"" + currentYear + "-01-14\"."
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at parsing academic syllabi and extracting structured task information."
        },
        {
          role: "user",
          content: basePrompt + "\n\nText to analyze:\n" + content + "\n\n" + exampleFormat
        }
      ],
      temperature: 0.1,
      max_tokens: 2000,
    })

    const responseContent = response.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse the JSON response (handle code fences or extra text)
    const tasks = parseJsonFromModel(responseContent) as ExtractedTask[]
    
    // Validate and clean the tasks
    const cleaned = tasks.map(task => ({
      ...task,
      title: task.title?.trim() || 'Untitled Task',
      description: task.description?.trim(),
      priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
      category: task.category?.trim() || 'assignment'
    }))

    if (cleaned.length === 0) {
      return fallbackExtractTasks(content, currentYear)
    }

    return cleaned
  } catch (error) {
    console.error('Error extracting tasks:', error)
    const fallback = fallbackExtractTasks(content, currentYear)
    if (fallback.length > 0) {
      return fallback
    }
    throw new Error('Failed to extract tasks from content')
  }
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
  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1].trim())
  }

  const arrayStart = trimmed.indexOf('[')
  const arrayEnd = trimmed.lastIndexOf(']')
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1))
  }

  return JSON.parse(trimmed)
}

function fallbackExtractTasks(content: string, fallbackYear: number): ExtractedTask[] {
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
      category: keyword.category
    })
  }

  return tasks
}

function findDateInText(text: string, fallbackYear: number): string | undefined {
  const numericMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2}|\d{4}))?\b/)
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

  const quizMatch = text.match(/\b([A-Za-z0-9 &-]{0,40}\bQuiz)\b/i)
  if (quizMatch?.[1]) {
    return quizMatch[1].trim()
  }

  const projectMatch = text.match(/\b([A-Za-z0-9 &-]{0,40}\bProject)\b/i)
  if (projectMatch?.[1]) {
    return projectMatch[1].trim()
  }

  const assignmentMatch = text.match(/\b([A-Za-z0-9 &-]{0,40}\bAssignment)\b/i)
  if (assignmentMatch?.[1]) {
    return assignmentMatch[1].trim()
  }

  const homeworkMatch = text.match(/\b([A-Za-z0-9 &-]{0,40}\bHomework)\b/i)
  if (homeworkMatch?.[1]) {
    return homeworkMatch[1].trim()
  }

  return keyword.category === 'exam' ? 'Exam' : 'Assignment'
}

function formatDateYYYYMMDD(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}
