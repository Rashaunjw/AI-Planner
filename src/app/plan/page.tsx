"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Brain,
  Loader2,
  BookOpen,
  Sparkles,
  CalendarPlus,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import AppNav from "@/components/app-nav"
import LoadingScreen from "@/components/loading-screen"
import StudyPlanContent from "@/components/study-plan-content"

type StudyPlanBlock = { date: string; title: string; durationMinutes: number }

export default function PlanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<StudyPlanBlock[]>([])
  const [addingToCalendar, setAddingToCalendar] = useState(false)

  const generate = async () => {
    setLoading(true)
    setPlan(null)
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
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/auth/signin")
      return
    }
    if (status === "authenticated") {
      generate()
    }
  }, [router, session, status])

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

  if (status === "loading") {
    return <LoadingScreen message="Loading..." />
  }

  if (!session) {
    return null
  }

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
              Based on your <span className="font-semibold">pending assignments</span>. Mark tasks
              complete as you finish them to keep this accurate.
            </p>
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
