"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain, X, Loader2, BookOpen, Sparkles, CalendarPlus, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import StudyPlanContent from "@/components/study-plan-content"

type StudyPlanBlock = { date: string; title: string; durationMinutes: number }

export default function StudyPlanButton() {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<StudyPlanBlock[]>([])
  const [addingToCalendar, setAddingToCalendar] = useState(false)

  const generate = async () => {
    setLoading(true)
    setBlocks([])
    try {
      const res = await fetch("/api/study-plan", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to generate study plan.")
        return
      }
      setPlan(data.plan)
      setBlocks(Array.isArray(data.blocks) ? data.blocks : [])
      setOpen(true)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCalendar = async () => {
    if (blocks.length === 0) return
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
      await fetch("/api/calendar/sync", { method: "POST" })
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setAddingToCalendar(false)
    }
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
                <StudyPlanContent text={plan} />
              ) : (
                <p className="text-sm text-gray-400 text-center py-10">No plan generated.</p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-gray-50">
              <div className="flex flex-wrap items-center gap-2">
                {blocks.length > 0 && (
                  <Button
                    size="sm"
                    onClick={handleAddToCalendar}
                    disabled={addingToCalendar}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    {addingToCalendar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CalendarPlus className="h-3.5 w-3.5" />
                    )}
                    Add to calendar
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={generate}
                  disabled={loading}
                  className="shrink-0"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Regenerate"}
                </Button>
                <Link href="/plan" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 shrink-0">
                  Open full page
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

