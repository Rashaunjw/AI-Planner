"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, CalendarDays, CalendarRange, Calendar } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import AppNav from "@/components/app-nav"
import LoadingScreen from "@/components/loading-screen"

type CalendarView = "day" | "week" | "month"

type Task = {
  id: string
  title: string
  description?: string
  dueDate?: string | null
  priority: string
  category?: string | null
  className?: string | null
}

// Same palette as tasks page for consistency
const CLASS_COLOR_PALETTE = [
  { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
  { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
  { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  { bg: "bg-rose-100", text: "text-rose-800", dot: "bg-rose-500" },
  { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
  { bg: "bg-indigo-100", text: "text-indigo-800", dot: "bg-indigo-500" },
  { bg: "bg-teal-100", text: "text-teal-800", dot: "bg-teal-500" },
]

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [syncing, setSyncing] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [view, setView] = useState<CalendarView>("month")

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/auth/signin")
    }
  }, [router, session, status])

  const monthLabel = currentMonth.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  })

  // Week containing currentMonth (Sunday start)
  const weekStart = useMemo(() => {
    const d = new Date(currentMonth)
    const day = d.getDay()
    d.setDate(d.getDate() - day)
    return d
  }, [currentMonth])
  const weekDates = useMemo(() => {
    const dates: Date[] = []
    const d = new Date(weekStart)
    for (let i = 0; i < 7; i++) {
      dates.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }
    return dates
  }, [weekStart])
  const weekLabel =
    view === "week"
      ? `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : ""

  const dayLabel =
    view === "day"
      ? currentMonth.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : ""

  const navLabel = view === "month" ? monthLabel : view === "week" ? weekLabel : dayLabel

  const goPrev = () => {
    if (view === "day") {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() - 1))
    } else if (view === "week") {
      const next = new Date(weekStart)
      next.setDate(next.getDate() - 7)
      setCurrentMonth(next)
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }
  }
  const goNext = () => {
    if (view === "day") {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), currentMonth.getDate() + 1))
    } else if (view === "week") {
      const next = new Date(weekStart)
      next.setDate(next.getDate() + 7)
      setCurrentMonth(next)
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }
  }
  const goToday = () => {
    const today = new Date()
    setCurrentMonth(today)
    if (view === "day") setSelectedDay(formatDateKey(today))
  }

  // Build a stable class → color index map
  const classColorMap = useMemo(() => {
    const map = new Map<string, number>()
    let idx = 0
    tasks.forEach((task) => {
      const key = task.className?.trim() || ""
      if (key && !map.has(key)) {
        map.set(key, idx % CLASS_COLOR_PALETTE.length)
        idx++
      }
    })
    return map
  }, [tasks])

  const getTaskColor = (task: Task) => {
    const key = task.className?.trim() || ""
    const idx = classColorMap.get(key) ?? 0
    return CLASS_COLOR_PALETTE[idx]
  }

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
        toast.error("Failed to load calendar tasks.")
      } finally {
        setLoading(false)
      }
    }

    if (status !== "loading" && session) {
      fetchTasks()
    }
  }, [session, status])

  if (status === "loading") {
    return <LoadingScreen message="Loading your calendar..." />
  }

  if (!session) {
    return null
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch("/api/calendar/sync", { method: "POST" })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || "Failed to sync calendar.")
        return
      }
      const skippedNote =
        data.skippedCount > 0
          ? ` Skipped ${data.skippedCount} task${data.skippedCount === 1 ? "" : "s"} missing required info.`
          : ""
      toast.success(`Synced ${data.createdCount} tasks to Google Calendar.${skippedNote}`)
    } catch (error) {
      console.error("Calendar sync error:", error)
      toast.error("Failed to sync calendar.")
    } finally {
      setSyncing(false)
    }
  }

  const todayKey = formatDateKey(new Date())
  // In day view, sidebar shows the focused day
  const effectiveSelectedDay = view === "day" ? formatDateKey(currentMonth) : selectedDay
  const selectedDayTasks = effectiveSelectedDay ? taskByDate.get(effectiveSelectedDay) || [] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      <AppNav />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Calendar</h1>
            <p className="text-gray-500 text-sm">View your assignments and deadlines by date</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/upload">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Tasks
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              {syncing ? "Syncing..." : "Sync to Google Calendar"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
            {/* View toggle + Navigation */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setView("day")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "day" ? "bg-white text-indigo-700 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    <Calendar className="h-4 w-4" />
                    Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("week")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "week" ? "bg-white text-indigo-700 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    <CalendarRange className="h-4 w-4" />
                    Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("month")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === "month" ? "bg-white text-indigo-700 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Month
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={goPrev}>
                    ← Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToday}
                    className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 min-w-[72px]"
                  >
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={goNext}>
                    Next →
                  </Button>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 text-center">
                {navLabel}
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <>
                {/* Day view */}
                {view === "day" && (
                  <div className="min-h-[420px]">
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      {(() => {
                        const key = formatDateKey(currentMonth)
                        const dayTasks = taskByDate.get(key) || []
                        return (
                          <div className="divide-y divide-gray-100">
                            <div className="bg-indigo-50/50 px-4 py-3 border-b border-indigo-100">
                              <p className="text-sm font-medium text-indigo-900">
                                {dayTasks.length} task{dayTasks.length !== 1 ? "s" : ""} due this day
                              </p>
                            </div>
                            {dayTasks.length === 0 ? (
                              <div className="py-16 text-center text-gray-400 text-sm">
                                Nothing due on this day.
                              </div>
                            ) : (
                              <ul className="divide-y divide-gray-50">
                                {dayTasks.map((task) => {
                                  const color = getTaskColor(task)
                                  return (
                                    <li key={task.id} className="px-4 py-4 hover:bg-gray-50/50 transition-colors">
                                      <div className="flex items-start gap-3">
                                        <span className={`mt-1.5 w-3 h-3 rounded-full shrink-0 ${color.dot}`} />
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium text-gray-900">{task.title}</p>
                                          {task.description && (
                                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
                                          )}
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            {task.className && (
                                              <span className="text-xs text-gray-500">{task.className}</span>
                                            )}
                                            {task.category && (
                                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color.bg} ${color.text}`}>
                                                {task.category}
                                              </span>
                                            )}
                                            {task.priority === "high" && (
                                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                                High priority
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </li>
                                  )
                                })}
                              </ul>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* Week view */}
                {view === "week" && (
                  <div className="overflow-x-auto -mx-2 px-2">
                    <div className="grid grid-cols-7 gap-2 min-w-[560px]">
                      {weekDates.map((date) => {
                        const key = formatDateKey(date)
                        const dayTasks = taskByDate.get(key) || []
                        const isToday = key === todayKey
                        const isSelected = key === selectedDay
                        return (
                          <div
                            key={key}
                            className={`rounded-xl border min-h-[320px] flex flex-col overflow-hidden ${isToday ? "border-indigo-300 bg-indigo-50/40" : "border-gray-100 bg-gray-50/30"}`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedDay(isSelected ? null : key)}
                              className={`w-full px-2 py-2.5 text-left border-b shrink-0 ${isSelected ? "border-indigo-200 bg-indigo-50" : "border-gray-100 bg-white"}`}
                            >
                              <span className={`text-xs font-semibold uppercase text-gray-500 block`}>
                                {date.toLocaleDateString("en-US", { weekday: "short" })}
                              </span>
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isToday ? "bg-indigo-600 text-white" : "text-gray-800"}`}
                              >
                                {date.getDate()}
                              </span>
                            </button>
                            <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                              {dayTasks.map((task) => {
                                const color = getTaskColor(task)
                                return (
                                  <div
                                    key={task.id}
                                    className={`rounded-lg px-2 py-1.5 text-xs font-medium ${color.bg} ${color.text} truncate`}
                                    title={task.title}
                                  >
                                    {task.title}
                                  </div>
                                )
                              })}
                              {dayTasks.length === 0 && (
                                <p className="text-[11px] text-gray-400 py-2">No tasks</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Month view */}
                {view === "month" && (
                  <div className="overflow-x-auto -mx-2 px-2">
                    <div className="grid grid-cols-7 gap-1 min-w-[420px]">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-2"
                        >
                          <span className="hidden sm:inline">{day}</span>
                          <span className="sm:hidden">{day[0]}</span>
                        </div>
                      ))}

                      {calendarWeeks.flat().map((date) => {
                        const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                        const key = formatDateKey(date)
                        const dayTasks = taskByDate.get(key) || []
                        const isToday = key === todayKey
                        const isSelected = key === selectedDay
                        const hasHighPriority = dayTasks.some((t) => t.priority === "high")

                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedDay(isSelected ? null : key)}
                            className={`min-h-[72px] sm:min-h-[96px] rounded-lg border p-1.5 sm:p-2 text-left transition-all ${isSelected
                              ? "border-indigo-400 bg-indigo-50 shadow-sm"
                              : isToday
                                ? "border-indigo-300 bg-indigo-50/60"
                                : isCurrentMonth
                                  ? "border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                                  : "border-transparent bg-gray-50/50"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday
                                  ? "bg-indigo-600 text-white"
                                  : isCurrentMonth
                                    ? "text-gray-700"
                                    : "text-gray-300"
                                  }`}
                              >
                                {date.getDate()}
                              </span>
                              {hasHighPriority && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              {dayTasks.slice(0, 2).map((task) => {
                                const color = getTaskColor(task)
                                return (
                                  <div
                                    key={task.id}
                                    className={`truncate rounded px-1 py-0.5 text-[10px] sm:text-[11px] font-medium ${color.bg} ${color.text}`}
                                    title={task.title}
                                  >
                                    {task.title}
                                  </div>
                                )
                              })}
                              {dayTasks.length > 2 && (
                                <div className="text-[10px] text-gray-400 px-1">
                                  +{dayTasks.length - 2} more
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {tasks.length === 0 && !loading && (
              <div className="mt-6 text-center py-8 text-sm text-gray-400">
                No tasks yet.{" "}
                <Link href="/upload" className="text-indigo-600 hover:underline font-medium">
                  Upload a syllabus
                </Link>{" "}
                to populate your calendar.
              </div>
            )}
          </div>

          {/* Sidebar: Selected day detail */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-5 sticky top-6">
              {effectiveSelectedDay ? (
                <>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    {new Date(effectiveSelectedDay + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  {selectedDayTasks.length === 0 ? (
                    <p className="text-sm text-gray-400 mt-3">Nothing due on this day.</p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {selectedDayTasks.map((task) => {
                        const color = getTaskColor(task)
                        return (
                          <li key={task.id} className="flex items-start gap-2">
                            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${color.dot}`} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 leading-snug">
                                {task.title}
                              </p>
                              {task.className && (
                                <p className="text-xs text-gray-400 mt-0.5">{task.className}</p>
                              )}
                              {task.category && (
                                <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${color.bg} ${color.text}`}>
                                  {task.category}
                                </span>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {view !== "day" && selectedDay && (
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="mt-4 text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear selection
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-400">
                    {view === "month" || view === "week" ? "Click a day to see what's due." : "No day selected."}
                  </p>
                </div>
              )}
            </div>

            {/* Class legend */}
            {classColorMap.size > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border border-indigo-100 p-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                  Classes
                </h3>
                <ul className="space-y-2">
                  {Array.from(classColorMap.entries()).map(([name, idx]) => {
                    const color = CLASS_COLOR_PALETTE[idx]
                    return (
                      <li key={name} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                        <span className="truncate">{name}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
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
