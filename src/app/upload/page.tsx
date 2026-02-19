"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { GraduationCap, Upload, FileText, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState("")
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadContext, setUploadContext] = useState<string | null>(null)
  const [showContextPrompt, setShowContextPrompt] = useState(false)

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/auth/signin")
    }
  }, [router, session, status])

  useEffect(() => {
    const savedContext = window.localStorage.getItem("uploadContext")
    if (savedContext) {
      setUploadContext(savedContext)
    } else {
      setShowContextPrompt(true)
    }
  }, [])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center">
        <GraduationCap className="h-10 w-10 text-indigo-400 animate-pulse" />
      </div>
    )
  }

  if (!session) {
    return null
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
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, Word document, or text file.")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.")
      return
    }

    setFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleContextSelect = (context: string) => {
    setUploadContext(context)
    window.localStorage.setItem("uploadContext", context)
    setShowContextPrompt(false)
  }

  const handleUpload = async () => {
    if (!file && !pastedText.trim()) return
    if (!uploadContext) {
      setShowContextPrompt(true)
      return
    }

    setUploading(true)
    setUploaded(false)
    setUploadError(null)

    try {
      const formData = new FormData()
      if (file) {
        formData.append("file", file)
      }
      if (pastedText.trim()) {
        formData.append("text", pastedText.trim())
      }
      formData.append("context", uploadContext)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const responseBody = await response.json().catch(() => null)

      if (response.ok) {
        setUploaded(true)
        setTimeout(() => {
          window.location.href = "/tasks"
        }, 2000)
      } else {
        const message = responseBody?.error || `Upload failed with status ${response.status}`
        throw new Error(message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      console.error("Upload error:", error)
      setUploaded(false)
      setUploadError(message)
      alert(message)
    } finally {
      setUploading(false)
    }
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-10">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Successful</h1>
            <p className="text-gray-500 mb-2">
              Your file has been processed. AI is now extracting your assignments and deadlines...
            </p>
            <p className="text-sm text-gray-400 mb-6">
              This can take up to 1 minute. Please be patient.
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-sm text-gray-400 mt-4">Redirecting to your assignments...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      {/* Context Prompt Modal */}
      {showContextPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-7 shadow-xl border border-indigo-100">
            <GraduationCap className="h-8 w-8 text-indigo-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 text-center mb-1">What is this for?</h2>
            <p className="text-sm text-gray-500 text-center mb-5">
              Choose a context so we can tag your assignments correctly.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {["school", "work", "sports", "greek life"].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  onClick={() => handleContextSelect(option)}
                  className="border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 text-gray-700"
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-indigo-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-indigo-300" />
                <span className="text-xl font-bold text-white">PlanEra</span>
              </Link>
            </div>
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-indigo-200 hover:text-white hover:bg-indigo-800">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Upload Your Syllabus or Schedule
          </h1>
          <p className="text-gray-500 text-sm">
            Upload a PDF, Word document, or paste text — AI will extract your assignments and deadlines
          </p>
        </div>

        {uploadContext && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            <span>
              Uploading for: <span className="font-semibold capitalize">{uploadContext}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContextPrompt(true)}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            >
              Change
            </Button>
          </div>
        )}

        {uploadError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {uploadError}
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-8">
          <div
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-colors ${dragActive
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
              }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <FileText className="h-12 w-12 text-indigo-500 mx-auto" />
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{file.name}</h3>
                  <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {uploading ? "Processing..." : "Process File"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                  className="border-gray-300"
                >
                  Choose a Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-indigo-300 mx-auto" />
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Drop your syllabus here
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">or click to browse your files</p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileInput}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer">
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
                <p className="text-xs text-gray-400">PDF, Word documents, or text files — up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Paste Text */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Or paste syllabus / schedule text directly
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            placeholder="Paste your syllabus or schedule text here..."
          />
          <div className="mt-3">
            <Button
              onClick={handleUpload}
              disabled={!pastedText.trim() || uploading}
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              {uploading ? "Processing..." : "Process Text"}
            </Button>
          </div>
        </div>

        {/* What happens next */}
        <div className="mt-6 bg-indigo-50 rounded-xl border border-indigo-100 p-6">
          <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-4">
            What happens next
          </h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-indigo-800">
            {[
              {
                step: "1",
                title: "AI Analysis",
                desc: "Our AI extracts assignments, exams, and deadlines from your document",
              },
              {
                step: "2",
                title: "Review",
                desc: "You can review and edit the extracted assignments before saving",
              },
              {
                step: "3",
                title: "Calendar Sync",
                desc: "Assignments are added to your calendar with smart reminders",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start space-x-3">
                <div className="bg-indigo-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-indigo-900 shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-indigo-900">{title}</p>
                  <p className="text-indigo-700 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
