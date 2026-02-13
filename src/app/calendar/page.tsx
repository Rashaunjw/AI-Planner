"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain, ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

type Task = {
  id: string
  title: string
  description?: string
  dueDate?: string | null
  priority: string
  category?: string | null
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/auth/signin")
    }
  }, [router, session, status])

  const monthLabel = currentMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })

  const taskByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach((task) => {
      if (!task.dueDate) return
      const key = formatDateKey(new Date(task.dueDate))
      const existing = map.get(key) || []
      existing.push(task)
      map.set(key, existing)
    })
    return map
  }, [tasks])

  const calendarWeeks = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const start = new Date(firstOfMonth)
    start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay())

    const weeks: Date[][] = []
    const cursor = new Date(start)
    for (let week = 0; week < 6; week += 1) {
      const days: Date[] = []
      for (let day = 0; day < 7; day += 1) {
        days.push(new Date(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }
      weeks.push(days)
    }
    return weeks
  }, [currentMonth])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch("/api/tasks")
        if (response.ok) {
          const data = await response.json()
          setTasks(data.tasks || [])
        }
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setLoading(false)
      }
    }

    if (status !== "loading" && session) {
      fetchTasks()
    }

  }, [session, status])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const response = await fetch("/api/calendar/sync", { method: "POST" })
      const data = await response.json()
      if (!response.ok) {
        setSyncMessage(data.error || "Failed to sync calendar.")
        return
      }
      const skippedNote =
        data.skippedCount > 0
          ? ` Skipped ${data.skippedCount} task${data.skippedCount === 1 ? "" : "s"} missing required info.`
          : ""
      setSyncMessage(`Synced ${data.createdCount} tasks to Google Calendar.${skippedNote}`)
    } catch (error) {
      console.error("Calendar sync error:", error)
      setSyncMessage("Failed to sync calendar.")
    } finally {
      setSyncing(false)
    }
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
                <span className="text-xl font-bold text-gray-900">PlanEra</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/upload">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tasks
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar View</h1>
          <p className="text-gray-600">
            View your tasks and study schedule in calendar format
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                  )
                }
              >
                Prev
              </Button>
              <div className="text-lg font-semibold text-gray-900">{monthLabel}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                  )
                }
              >
                Next
              </Button>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Button size="sm" onClick={handleSync} disabled={syncing}>
                {syncing ? "Syncing..." : "Sync to Google Calendar"}
              </Button>
              {syncMessage && <span className="text-sm text-gray-600">{syncMessage}</span>}
            </div>
          </div>

          {loading ? (
            <div className="mt-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-7 gap-2 text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-600">
                  {day}
                </div>
              ))}
              {calendarWeeks.flat().map((date) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                const key = formatDateKey(date)
                const dayTasks = taskByDate.get(key) || []
                return (
                  <div
                    key={key}
                    className={`min-h-[96px] rounded border p-2 ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"
                      }`}
                  >
                    <div className="text-xs font-semibold">{date.getDate()}</div>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="truncate rounded bg-blue-50 px-2 py-1 text-[11px] text-blue-700"
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-[11px] text-gray-500">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {tasks.length === 0 && !loading && (
            <div className="mt-6 text-center text-sm text-gray-500">
              No tasks with due dates yet. Upload a syllabus or schedule and add tasks to populate the calendar.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}
