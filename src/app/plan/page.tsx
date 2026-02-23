"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Brain,
  Loader2,
  BookOpen,
  Sparkles,
  CalendarPlus,
  LayoutDashboard,
  ArrowRight,
  FileText,
  Clock,
  AlertCircle,
  Layers,
  Coffee,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import AppNav from "@/components/app-nav"
import LoadingScreen from "@/components/loading-screen"
import StudyPlanContent from "@/components/study-plan-content"

type StudyPlanBlock = { date: string; title: string; durationMinutes: number }

type Preferences = {
  whenStudying: string
  focusMinutes: string
  startsBefore: string
  commonObstacle: string
  blockPreference: string
  weeklyStudyHours: string
}

const STUDY_HABIT_QUESTIONS: {
  key: keyof Preferences
  label: string
  icon: React.ComponentType<{ className?: string }>
  options: { value: string; label: string }[]
}[] = [
  {
    key: "whenStudying",
    label: "When do you usually study?",
    icon: Clock,
    options: [
      { value: "morning", label: "Morning" },
      { value: "afternoon", label: "Afternoon" },
      { value: "evening", label: "Evening" },
      { value: "late_night", label: "Late night" },
      { value: "mixed", label: "Mixed / it varies" },
    ],
  },
  {
    key: "focusMinutes",
    label: "How long can you focus in one sitting?",
    icon: Coffee,
    options: [
      { value: "25", label: "25–30 min" },
      { value: "45", label: "45–60 min" },
      { value: "90", label: "90+ min" },
      { value: "varies", label: "It varies" },
    ],
  },
  {
    key: "startsBefore",
    label: "How far ahead do you usually start before a deadline?",
    icon: CalendarPlus,
    options: [
      { value: "last_day", label: "Last day (or day of)" },
      { value: "2_3_days", label: "2–3 days before" },
      { value: "about_week", label: "About a week before" },
      { value: "2_weeks_plus", label: "2+ weeks before" },
    ],
  },
  {
    key: "commonObstacle",
    label: "What gets in the way most?",
    icon: AlertCircle,
    options: [
      { value: "procrastination", label: "Procrastination" },
      { value: "forgetting_dates", label: "Forgetting due dates" },
      { value: "underestimating_time", label: "Underestimating how long things take" },
      { value: "overwhelmed", label: "Getting overwhelmed" },
      { value: "nothing_major", label: "Nothing major" },
    ],
  },
  {
    key: "blockPreference",
    label: "Do you prefer one long block or several short sessions?",
    icon: Layers,
    options: [
      { value: "one_long", label: "One long block" },
      { value: "several_short", label: "Several short sessions" },
      { value: "depends", label: "Depends on the task" },
    ],
  },
  {
    key: "weeklyStudyHours",
    label: "How many hours per week can you realistically study?",
    icon: BookOpen,
    options: [
      { value: "1_5", label: "1–5 hours" },
      { value: "5_10", label: "5–10 hours" },
      { value: "10_15", label: "10–15 hours" },
      { value: "15_20", label: "15–20 hours" },
      { value: "20_plus", label: "20+ hours" },
    ],
  },
]

export default function PlanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [preferences, setPreferences] = useState<Preferences | null | "loading">("loading")
  const [answers, setAnswers] = useState<Partial<Preferences>>({})
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<StudyPlanBlock[]>([])
  const [addingToCalendar, setAddingToCalendar] = useState(false)
  const [materialsText, setMaterialsText] = useState("")
  const [materialFiles, setMaterialFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/auth/signin")
    }
  }, [router, session, status])

  useEffect(() => {
    if (!session?.user?.id) return
    fetch("/api/study-plan/preferences")
      .then((res) => (res.ok ? res.json() : { preferences: null }))
      .then((data) => {
        setPreferences(data.preferences ?? null)
        if (data.preferences) setAnswers(data.preferences)
      })
      .catch(() => setPreferences(null))
  }, [session?.user?.id])

  const handleSavePreferences = async () => {
    const missing = STUDY_HABIT_QUESTIONS.find((q) => !answers[q.key])
    if (missing) {
      toast.error("Please answer all questions.")
      return
    }
    setSavingPreferences(true)
    try {
      const res = await fetch("/api/study-plan/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Could not save.")
        return
      }
      setPreferences(answers as Preferences)
      toast.success("Saved. Generating your plan next.")
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setSavingPreferences(false)
    }
  }

  const generate = async () => {
    setLoading(true)
    setPlan(null)
    setBlocks([])
    try {
      const hasFiles = materialFiles.length > 0
      const hasText = materialsText.trim().length > 0

      if (hasFiles) {
        const formData = new FormData()
        if (hasText) formData.append("materialsText", materialsText.trim())
        materialFiles.forEach((f) => formData.append("materials", f))
        const res = await fetch("/api/study-plan", { method: "POST", body: formData })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || "Failed to generate study plan.")
          return
        }
        setPlan(data.plan)
        setBlocks(Array.isArray(data.blocks) ? data.blocks : [])
      } else {
        const res = await fetch("/api/study-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            hasText ? { materialsText: materialsText.trim() } : {}
          ),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || "Failed to generate study plan.")
          return
        }
        setPlan(data.plan)
        setBlocks(Array.isArray(data.blocks) ? data.blocks : [])
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCalendar = async () => {
    if (blocks.length === 0) {
      toast.error("Generate a study plan first to add blocks to your calendar.")
      return
    }
    setAddingToCalendar(true)
    try {
      const res = await fetch("/api/study-plan/add-to-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to add to calendar.")
        return
      }
      toast.success(`${data.added} study blocks added to your calendar.`)
      const syncRes = await fetch("/api/calendar/sync", { method: "POST" })
      if (syncRes.ok) {
        const syncData = await syncRes.json()
        if (syncData.createdCount > 0) {
          toast.success("Synced to Google Calendar.")
        }
      }
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setAddingToCalendar(false)
    }
  }

  const onMaterialsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setMaterialFiles(Array.from(files).slice(0, 3))
    e.target.value = ""
  }

  if (status === "loading") {
    return <LoadingScreen message="Loading..." />
  }

  if (!session) {
    return null
  }

  if (preferences === "loading") {
    return <LoadingScreen message="Loading..." />
  }

  // One-time study habits step
  if (preferences === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppNav />
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
            <div className="bg-indigo-900 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-700 p-2.5 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">Get to know your study habits</h1>
                  <p className="text-indigo-300 text-sm mt-0.5">
                    Answer once — we’ll use this to personalize every study plan.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-6 space-y-6">
              {STUDY_HABIT_QUESTIONS.map(({ key, label, icon: Icon, options }) => (
                <div key={key}>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
                    <Icon className="h-4 w-4 text-indigo-500 shrink-0" />
                    {label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [key]: opt.value }))}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                          answers[key] === opt.value
                            ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                            : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button
                onClick={handleSavePreferences}
                disabled={savingPreferences}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {savingPreferences ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  "Save and continue"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main plan UI
  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
          <div className="bg-indigo-900 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-700 p-2.5 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-white">Your AI Study Plan</h1>
                <p className="text-indigo-300 text-sm mt-0.5">
                  Personalized for your upcoming deadlines
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border-b border-amber-100 px-6 py-2.5 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">
              Based on your <span className="font-semibold">pending tasks</span> and study habits.
              Mark tasks complete to keep this accurate.
            </p>
          </div>

          <div className="border-b border-gray-100 px-6 py-4 bg-gray-50/50">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              Add slides or study guides (optional)
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Upload PDFs or paste text. We’ll use this to prioritize topics and suggest what to study.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,image/png,image/jpeg,image/webp"
              multiple
              onChange={onMaterialsFileChange}
              className="hidden"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                Upload files
              </Button>
              {materialFiles.length > 0 && (
                <span className="text-xs text-gray-600 self-center">
                  {materialFiles.length} file{materialFiles.length !== 1 ? "s" : ""} selected
                </span>
              )}
            </div>
            <textarea
              value={materialsText}
              onChange={(e) => setMaterialsText(e.target.value)}
              placeholder="Or paste key points from slides or a study guide…"
              rows={3}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>

          <div className="px-6 py-6 min-h-[200px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-sm text-gray-500">Generating your study plan…</p>
              </div>
            ) : plan ? (
              <StudyPlanContent text={plan} />
            ) : (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No plan generated yet.</p>
                <Button onClick={generate} disabled={loading} className="mt-4">
                  Generate study plan
                </Button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-gray-50">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={generate}
                disabled={loading}
                variant="outline"
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                Regenerate
              </Button>
              {blocks.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleAddToCalendar}
                  disabled={addingToCalendar}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {addingToCalendar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarPlus className="h-4 w-4" />
                  )}
                  Add {blocks.length} blocks to calendar
                </Button>
              )}
            </div>
            <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Plans are generated by AI and may need adjustment for your specific schedule.
        </p>
      </div>
    </div>
  )
}
