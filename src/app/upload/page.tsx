"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, CheckCircle, GraduationCap, Briefcase, Trophy, Users, Link as LinkIcon, LayoutDashboard, Brain, ListTodo } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import AppNav from "@/components/app-nav"
import LoadingScreen from "@/components/loading-screen"

export default function UploadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [extractedCount, setExtractedCount] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [uploadContext, setUploadContext] = useState<string | null>(null)
  const [showContextPrompt, setShowContextPrompt] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

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
    return <LoadingScreen message="Loading..." />
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
      "image/png",
      "image/jpeg",
      "image/webp",
    ]

    if (!allowedTypes.includes(file.type)) {
      toast.error("Use a PDF, Word doc, text file, or image (PNG, JPEG, WebP).")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB.")
      return
    }

    setFile(file)
    setUploadError(null)
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
    const hasFile = !!file
    const hasText = !!pastedText.trim()
    const hasLink = !!linkUrl.trim()
    if (!hasFile && !hasText && !hasLink) return
    if (!uploadContext) {
      setShowContextPrompt(true)
      return
    }

    setUploading(true)
    setUploaded(true)
    setExtractedCount(null)
    setLinkError(null)
    setUploadError(null)

    try {
      const formData = new FormData()
      // Send only one source: file wins, then text, then link
      if (file) {
        formData.append("file", file)
      } else if (pastedText.trim()) {
        formData.append("text", pastedText.trim())
      } else {
        formData.append("url", linkUrl.trim())
      }
      formData.append("context", uploadContext)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const responseBody = await response.json().catch(() => null)

      if (response.ok) {
        setExtractedCount(responseBody?.taskCount ?? null)
      } else if (response.status === 403 && responseBody?.upgrade) {
        setUploaded(false)
        toast.error(responseBody?.message || "Upload limit reached. Upgrade to Pro for unlimited uploads.", {
          action: { label: "View plans", onClick: () => router.push("/pricing") },
        })
      } else {
        setUploaded(false)
        const message = responseBody?.error || `Upload failed (${response.status})`
        toast.error(message)
        setUploadError(message)
        if (hasLink) setLinkError(message)
      }
    } catch (error) {
      setUploaded(false)
      const message = error instanceof Error ? error.message : "Upload failed"
      console.error("Upload error:", error)
      toast.error(message)
      setUploadError(message)
      if (hasLink) setLinkError(message)
    } finally {
      setUploading(false)
    }
  }

  if (uploaded) {
    const stillExtracting = uploading && extractedCount === null
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 p-10">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {stillExtracting ? "Got it!" : extractedCount === 0 ? "Upload Complete" : "Done!"}
            </h1>

            {extractedCount !== null && extractedCount > 0 ? (
              <>
                <div className="my-4 bg-indigo-50 rounded-xl px-6 py-4 border border-indigo-100">
                  <p className="text-4xl font-bold text-indigo-700">{extractedCount}</p>
                  <p className="text-sm text-indigo-500 font-medium mt-0.5">
                    assignment{extractedCount !== 1 ? "s" : ""} extracted
                  </p>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Your assignments are ready to review.
                </p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    View on Dashboard
                  </Button>
                  <Button
                    onClick={() => router.push("/plan")}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    Generate AI Study Plan
                  </Button>
                  <Button
                    onClick={() => router.push("/tasks")}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <ListTodo className="h-4 w-4" />
                    View assignments
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  Tip: Add your work schedule or practice calendar next so PlanEra is your single place for deadlines.
                </p>
              </>
            ) : stillExtracting ? (
              <>
                <p className="text-gray-500 my-4 text-sm">
                  We&apos;re extracting your assignments and/or deadlines. This usually takes a moment.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500" />
                  Extracting...
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-500 my-4 text-sm">
                  No tasks were detected. You can add assignments manually.
                </p>
                <Button onClick={() => router.push("/tasks")} variant="outline" className="mt-2">
                  Go to assignments
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      {/* Context Prompt Modal */}
      {showContextPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-7 shadow-xl border border-indigo-100">
            <div className="text-center mb-5">
              <div className="bg-indigo-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="h-6 w-6 text-indigo-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">What is this for?</h2>
              <p className="text-sm text-gray-500">
                Choose a context so we can tag your assignments correctly.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: "school", icon: GraduationCap, label: "School", desc: "Classes, syllabi, exams" },
                { id: "work", icon: Briefcase, label: "Work", desc: "Projects, meetings, deadlines" },
                { id: "sports", icon: Trophy, label: "Sports", desc: "Practice, games, training" },
                { id: "greek life", icon: Users, label: "Greek Life", desc: "Events, chapters, activities" },
              ].map(({ id, icon: Icon, label, desc }) => (
                <button
                  key={id}
                  onClick={() => handleContextSelect(id)}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <Icon className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <AppNav />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Upload Your Syllabus or Schedule
          </h1>
          <p className="text-gray-500 text-sm">
            Upload a file, paste text, or add a link. AI will extract your assignments and deadlines.
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
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            <p className="font-medium">Upload failed</p>
            <p className="mt-0.5">{uploadError}</p>
            <button
              type="button"
              onClick={() => setUploadError(null)}
              className="mt-2 text-red-600 underline hover:no-underline"
            >
              Dismiss
            </button>
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
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
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
                <p className="text-xs text-gray-400">PDF, Word, text, or images (PNG, JPEG, WebP), up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Paste link */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <LinkIcon className="h-4 w-4 text-indigo-500" />
            Or paste a link
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Course page, shared doc, or any page with syllabus/schedule text. We’ll fetch the page and extract tasks. For Google Docs, share so &quot;Anyone with the link&quot; can view.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value)
                setLinkError(null)
                setUploadError(null)
              }}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <Button
              onClick={handleUpload}
              disabled={!linkUrl.trim() || uploading}
              variant="outline"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 shrink-0"
            >
              {uploading ? "Fetching..." : "Fetch & process"}
            </Button>
          </div>
          {linkError && (
            <p className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              {linkError}
            </p>
          )}
        </div>

        {/* Paste Text */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Or paste syllabus / schedule text directly
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => {
              setPastedText(e.target.value)
              setUploadError(null)
            }}
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
