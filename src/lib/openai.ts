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
  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured')
    }

    const currentYear = new Date().getFullYear()
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
    return tasks.map(task => ({
      ...task,
      title: task.title?.trim() || 'Untitled Task',
      description: task.description?.trim(),
      priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
      category: task.category?.trim() || 'assignment'
    }))

  } catch (error) {
    console.error('Error extracting tasks:', error)
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
