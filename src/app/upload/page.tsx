"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain, Upload, FileText, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { isDevBypassClientEnabled } from "@/lib/dev-bypass-client"

export default function UploadPage() {
  const { data: session, status } = useSession()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const isDevBypass = isDevBypassClientEnabled()

  if (status === "loading" && !isDevBypass) {
    return <div>Loading...</div>
  }

  if (!session && !isDevBypass) {
    redirect("/auth/signin")
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, Word document, or text file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB.')
      return
    }

    setFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (isDevBypass) {
      alert("Dev bypass enabled. Upload is disabled without a real account.")
      return
    }
    if (!file) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setUploaded(true)
        // Redirect to task review after a short delay
        setTimeout(() => {
          window.location.href = '/tasks'
        }, 2000)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your file has been processed. AI is now extracting tasks and deadlines...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-4">Redirecting to task review...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">AI Planner</span>
              </Link>
            </div>
            
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Syllabus</h1>
          <p className="text-gray-600">
            Upload PDF, Word documents, or paste text to extract assignments and deadlines
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                  <p className="text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Process File
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Drop your file here
                  </h3>
                  <p className="text-gray-600 mb-4">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  Supports PDF, Word documents, and text files up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">What happens next?</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <div className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="font-medium">AI Analysis</p>
                <p>Our AI extracts assignments, exams, and deadlines from your document</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Review & Edit</p>
                <p>You can review and modify the extracted tasks before saving</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="bg-blue-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Calendar Sync</p>
                <p>Tasks are added to your calendar with smart reminders</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
