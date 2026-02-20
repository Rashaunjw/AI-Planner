import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractTasksFromContent, getTextFromImage } from '@/lib/openai'
import { fetchUrlToText } from '@/lib/fetch-url'
import { parseDateWithTime } from '@/lib/date'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'] as const

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const text = formData.get('text')
    const url = formData.get('url')
    const context = formData.get('context')

    if (!file && !text && !url) {
      return NextResponse.json({ error: 'No file, text, or link provided' }, { status: 400 })
    }

    const FREE_UPLOADS_PER_MONTH = 10
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    })
    if (user?.plan !== 'pro') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const count = await prisma.upload.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: startOfMonth },
        },
      })
      if (count >= FREE_UPLOADS_PER_MONTH) {
        return NextResponse.json(
          {
            error: 'Upload limit reached',
            upgrade: true,
            message: `Free plan allows ${FREE_UPLOADS_PER_MONTH} uploads per month. Upgrade to Pro for unlimited uploads.`,
          },
          { status: 403 }
        )
      }
    }

    let content = ''
    let fileName = ''
    let fileType = ''
    let fileSize = 0

    if (file) {
      // Validate file type (documents + images)
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        ...IMAGE_MIMES,
      ]
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type. Use PDF, Word, text, or image (PNG, JPEG, WebP).' }, { status: 400 })
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
      }

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      fileName = `${Date.now()}-${file.name}`
      fileType = file.type
      fileSize = file.size

      const baseDir = process.env.VERCEL ? '/tmp' : process.cwd()
      const uploadsDir = join(baseDir, 'uploads')
      const uploadPath = join(uploadsDir, fileName)

      await mkdir(uploadsDir, { recursive: true })
      await writeFile(uploadPath, buffer)

      try {
        if (IMAGE_MIMES.includes(file.type as (typeof IMAGE_MIMES)[number])) {
          content = await getTextFromImage(buffer, file.type)
        } else if (file.type === 'application/pdf') {
          const pdf = await import('pdf-parse/lib/pdf-parse')
          const pdfData = await pdf.default(buffer)
          content = pdfData.text
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   file.type === 'application/msword') {
          const mammoth = await import('mammoth')
          const result = await mammoth.extractRawText({ buffer })
          content = result.value
        } else if (file.type === 'text/plain') {
          content = buffer.toString('utf-8')
        }
      } catch (error) {
        console.error('Error extracting text:', error)
        return NextResponse.json({
          error: IMAGE_MIMES.includes(file.type as (typeof IMAGE_MIMES)[number])
            ? 'Could not read text from image. Try a clearer photo or use PDF/text.'
            : 'Failed to extract text from file',
        }, { status: 500 })
      }
    } else if (typeof text === 'string' && text.trim()) {
      content = text
      fileName = `pasted-text-${Date.now()}.txt`
      fileType = 'text/plain'
      fileSize = Buffer.byteLength(text, 'utf-8')
    } else {
      // url (only when no file and no text)
      const urlStr = typeof url === 'string' ? url.trim() : ''
      if (!urlStr) {
        return NextResponse.json({ error: 'No file, text, or link provided' }, { status: 400 })
      }
      try {
        content = await fetchUrlToText(urlStr)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch link'
        return NextResponse.json({ error: message }, { status: 400 })
      }
      const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`)
      fileName = `link-${parsed.hostname}-${Date.now()}.txt`
      fileType = 'text/plain'
      fileSize = Buffer.byteLength(content, 'utf-8')
    }

    // Save upload record to database
    const upload = await prisma.upload.create({
      data: {
        userId: session.user.id,
        fileName,
        fileType,
        fileSize,
        fileUrl: file ? `/uploads/${fileName}` : null,
        content: content,
        status: 'processed'
      }
    })

    // Extract tasks using AI
    try {
      const { tasks: extractedTasks, classDefaultTimes } = await extractTasksFromContent(
        content,
        typeof context === 'string' ? context : undefined
      )
      if (!extractedTasks.length) {
        return NextResponse.json({
          success: true,
          uploadId: upload.id,
          taskCount: 0,
          message: 'File uploaded but no tasks were detected.',
          warning: 'No tasks detected'
        })
      }

      const getDefaultTime = (task: (typeof extractedTasks)[0]) => {
        if (task.dueTime) return task.dueTime
        const cn = task.className?.trim()
        if (cn && classDefaultTimes[cn]) return classDefaultTimes[cn]
        return '12:00'
      }

      const tasks = await Promise.all(
        extractedTasks.map((task) =>
          prisma.task.create({
            data: {
              userId: session.user.id,
              uploadId: upload.id,
              title: task.title?.trim() || 'Untitled task',
              description: task.description,
              dueDate: task.dueDate
                ? parseDateWithTime(task.dueDate, getDefaultTime(task))
                : null,
              priority: task.priority || 'medium',
              category: task.category,
              estimatedDuration: task.estimatedDuration,
              weightPercent: task.weightPercent ?? null,
              className: task.className?.trim() || null,
              status: 'pending'
            }
          })
        )
      )

      return NextResponse.json({ 
        success: true, 
        uploadId: upload.id,
        taskCount: tasks.length,
        message: `File processed successfully. Extracted ${tasks.length} tasks.` 
      })

    } catch (aiError) {
      console.error('AI processing error:', aiError)
      // Still return success but with a warning
      return NextResponse.json({ 
        success: true, 
        uploadId: upload.id,
        taskCount: 0,
        message: 'File uploaded but AI processing failed. You can manually add tasks.',
        warning: 'AI processing failed'
      })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
