import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractTasksFromContent } from '@/lib/openai'
import { parseDateInput } from '@/lib/date'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const text = formData.get('text')
    const context = formData.get('context')

    if (!file && !text) {
      return NextResponse.json({ error: 'No file or text provided' }, { status: 400 })
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
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File too large' }, { status: 400 })
      }

      // Save file to uploads directory
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      fileName = `${Date.now()}-${file.name}`
      fileType = file.type
      fileSize = file.size

      const baseDir = process.env.VERCEL ? '/tmp' : process.cwd()
      const uploadsDir = join(baseDir, 'uploads')
      const uploadPath = join(uploadsDir, fileName)

      // Ensure uploads directory exists (serverless-safe temp dir on Vercel)
      await mkdir(uploadsDir, { recursive: true })
      await writeFile(uploadPath, buffer)

      // Extract text content based on file type
      try {
        if (file.type === 'application/pdf') {
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
        return NextResponse.json({ error: 'Failed to extract text from file' }, { status: 500 })
      }
    } else if (typeof text === 'string') {
      content = text
      fileName = `pasted-text-${Date.now()}.txt`
      fileType = 'text/plain'
      fileSize = Buffer.byteLength(text, 'utf-8')
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
      const extractedTasks = await extractTasksFromContent(
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

      // Create task records even if required fields are missing
      const tasks = await Promise.all(
        extractedTasks.map((task) =>
          prisma.task.create({
            data: {
              userId: session.user.id,
              uploadId: upload.id,
              title: task.title?.trim() || 'Untitled task',
              description: task.description,
              dueDate: task.dueDate ? parseDateInput(task.dueDate) : null,
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
