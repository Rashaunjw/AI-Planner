"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain, X, Loader2, BookOpen, Sparkles } from "lucide-react"
import { toast } from "sonner"

export default function StudyPlanButton() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/study-plan", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to generate study plan.")
        return
      }
      setPlan(data.plan)
      setOpen(true)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Parse the plan text into sections for nicer rendering
  const renderPlan = (text: string) => {
    const lines = text.split("\n")
    return lines.map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return <div key={i} className="h-3" />

      // Numbered section headers like "1. " or "**Title**"
      const boldHeader = trimmed.match(/^\*\*(.+)\*\*$/)
      if (boldHeader) {
        return (
          <h3 key={i} className="text-base font-semibold text-indigo-800 mt-5 mb-1.5">
            {boldHeader[1]}
          </h3>
        )
      }

      const numberedHeader = trimmed.match(/^(\d+)\.\s+(.+)/)
      if (numberedHeader && trimmed.length < 80) {
        return (
          <h3 key={i} className="text-base font-semibold text-indigo-800 mt-5 mb-1.5 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
              {numberedHeader[1]}
            </span>
            {numberedHeader[2]}
          </h3>
        )
      }

      // Bullet points starting with - or •
      if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
        return (
          <div key={i} className="flex items-start gap-2 py-0.5 pl-2">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <p className="text-sm text-gray-700">{trimmed.slice(2)}</p>
          </div>
        )
      }

      // Sub-bullets with **bold** text inline
      if (trimmed.includes("**")) {
        const parts = trimmed.split(/\*\*/)
        return (
          <p key={i} className="text-sm text-gray-700 py-0.5">
            {parts.map((part, j) =>
              j % 2 === 1 ? (
                <span key={j} className="font-semibold text-gray-900">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </p>
        )
      }

      return (
        <p key={i} className="text-sm text-gray-700 py-0.5">
          {trimmed}
        </p>
      )
    })
  }

  return (
    <>
      <Button
        size="sm"
        onClick={generate}
        disabled={loading}
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Brain className="h-4 w-4" />
            AI Study Plan
          </>
        )}
      </Button>

      {/* Slide-over panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-indigo-900 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-700 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-base">Your AI Study Plan</h2>
                  <p className="text-indigo-300 text-xs">Personalized for your upcoming deadlines</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-indigo-300 hover:text-white transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notice bar */}
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center gap-2 shrink-0">
              <BookOpen className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                Based on your {" "}
                <span className="font-semibold">pending assignments</span>. Mark tasks complete
                as you finish them to keep this accurate.
              </p>
            </div>

            {/* Scrollable plan content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {plan ? (
                <div className="space-y-0.5">{renderPlan(plan)}</div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">No plan generated.</p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-3 shrink-0 bg-gray-50">
              <p className="text-xs text-gray-400">
                Plans are generated by AI and may need adjustment for your specific schedule.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={generate}
                disabled={loading}
                className="shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Regenerate"}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

