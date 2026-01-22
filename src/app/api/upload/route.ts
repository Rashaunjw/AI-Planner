import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractTasksFromContent } from '@/lib/openai'
import { writeFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

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
    
    const fileName = `${Date.now()}-${file.name}`
    const uploadPath = join(process.cwd(), 'uploads', fileName)
    
    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'uploads')
    try {
      await writeFile(uploadPath, buffer)
    } catch {
      // Create directory if it doesn't exist
      const fs = await import('fs')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }
      await writeFile(uploadPath, buffer)
    }

    // Extract text content based on file type
    let content = ''
    
    try {
      if (file.type === 'application/pdf') {
        const pdf = await import('pdf-parse')
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

    // Save upload record to database
    const upload = await prisma.upload.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileUrl: `/uploads/${fileName}`,
        content: content,
        status: 'processed'
      }
    })

    // Extract tasks using AI
    try {
      const extractedTasks = await extractTasksFromContent(content)
      
      // Create task records in database
      const tasks = await Promise.all(
        extractedTasks.map(task => 
          prisma.task.create({
            data: {
              userId: session.user.id,
              uploadId: upload.id,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              priority: task.priority,
              category: task.category,
              estimatedDuration: task.estimatedDuration,
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
