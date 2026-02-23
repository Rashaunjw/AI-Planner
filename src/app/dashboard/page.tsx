import { Brain, Upload, Calendar, BookOpen, Clock, TrendingUp, CheckCircle2, ChevronRight, Flame, ArrowRight } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import AppNav from "@/components/app-nav"
import ActivityClearButton from "@/components/activity-clear-button"
import StudyPlanButton from "@/components/study-plan-button"

// Color palette matching tasks/page.tsx
const CLASS_COLORS = [
  { bar: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50", border: "border-blue-200" },
  { bar: "bg-purple-500", text: "text-purple-700", light: "bg-purple-50", border: "border-purple-200" },
  { bar: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", border: "border-emerald-200" },
  { bar: "bg-rose-500", text: "text-rose-700", light: "bg-rose-50", border: "border-rose-200" },
  { bar: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-200" },
  { bar: "bg-cyan-500", text: "text-cyan-700", light: "bg-cyan-50", border: "border-cyan-200" },
  { bar: "bg-indigo-500", text: "text-indigo-700", light: "bg-indigo-50", border: "border-indigo-200" },
  { bar: "bg-teal-500", text: "text-teal-700", light: "bg-teal-50", border: "border-teal-200" },
]

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  // Fetch all tasks for this user (all statuses) for comprehensive stats
  const allTasks = await prisma.task.findMany({
    where: { userId: session.user.id },
    orderBy: { dueDate: "asc" },
  })

  // ── Date boundaries ──────────────────────────────────────────────
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  const weekEnd = new Date(now)
  weekEnd.setDate(now.getDate() + 7)
  const fiveDaysOut = new Date(now)
  fiveDaysOut.setDate(now.getDate() + 5)

  // ── Derived task lists ───────────────────────────────────────────
  const pendingTasks = allTasks.filter((t) => t.status === "pending")
  const todayTasks = pendingTasks.filter(
    (t) => t.dueDate && t.dueDate >= now && t.dueDate <= todayEnd
  )
  const weekTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate <= weekEnd)
  const highStakesTasks = pendingTasks.filter(
    (t) =>
      t.weightPercent &&
      t.weightPercent > 20 &&
      t.dueDate &&
      t.dueDate <= fiveDaysOut
  )

  // Today's Focus: top 5 by urgency score
  // urgencyScore = days until due − weight bonus (lower = more urgent)
  const focusTasks = pendingTasks
    .filter((t) => t.dueDate)
    .map((t) => {
      const daysLeft = Math.ceil(
        (t.dueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )
      return {
        ...t,
        daysLeft,
        urgencyScore: daysLeft - (t.weightPercent || 0) / 10,
      }
    })
    .sort((a, b) => a.urgencyScore - b.urgencyScore)
    .slice(0, 5)

  // ── Workload stats this week ─────────────────────────────────────
  const weekHours = Math.round(
    weekTasks.reduce((sum, t) => sum + (t.estimatedDuration ?? 60), 0) / 60
  )
  // ── 7-day workload bar data ──────────────────────────────────────
  // For each of the next 7 days, sum estimated hours from pending tasks due that day
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const sevenDayData = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(now)
    day.setDate(now.getDate() + offset)
    const dayStart = new Date(day)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)

    const dayTasks = pendingTasks.filter(
      (t) => t.dueDate && t.dueDate >= dayStart && t.dueDate <= dayEnd
    )
    const hours = Math.round(
      (dayTasks.reduce((sum, t) => sum + (t.estimatedDuration ?? 60), 0) / 60) * 10
    ) / 10

    return {
      label: offset === 0 ? "Today" : DAY_LABELS[day.getDay()],
      hours,
      taskCount: dayTasks.length,
    }
  })
  const maxDayHours = Math.max(...sevenDayData.map((d) => d.hours), 1)

  // ── Class progress ───────────────────────────────────────────────
  const classMap = new Map<string, { total: number; done: number }>()
  allTasks.forEach((t) => {
    const cls = t.className?.trim() || "No Class"
    const existing = classMap.get(cls) || { total: 0, done: 0 }
    existing.total++
    if (t.status === "completed") existing.done++
    classMap.set(cls, existing)
  })
  // Sort classes by least completion first
  const classProgress = Array.from(classMap.entries())
    .map(([name, data], i) => ({ name, ...data, colorIdx: i % CLASS_COLORS.length }))
    .sort((a, b) => a.done / a.total - b.done / b.total)

  // ── Recent uploads ───────────────────────────────────────────────
  const recentUploads = await prisma.upload.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  })

  // ── User settings (for onboarding checklist) ─────────────────────
  const userSettings = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { calendarSync: true, emailReminders: true },
  })

  // Weekly wins: tasks completed in the last 7 days
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  const weeklyWins = allTasks.filter(
    (t) => t.status === "completed" && t.updatedAt >= weekStart
  ).length

  // ── Onboarding checklist steps ───────────────────────────────────
  const onboardingSteps = [
    {
      id: "upload",
      label: "Upload your first syllabus",
      desc: "Let AI extract your assignments and deadlines automatically.",
      href: "/upload",
      done: recentUploads.length > 0,
    },
    {
      id: "tasks",
      label: "Review your assignments",
      desc: "Confirm extracted tasks and add anything that's missing.",
      href: "/tasks",
      done: allTasks.length > 0,
    },
    {
      id: "reminders",
      label: "Turn on email reminders",
      desc: "Get notified before deadlines so nothing slips through.",
      href: "/settings",
      done: userSettings?.emailReminders ?? true,
    },
    {
      id: "calendar",
      label: "Connect your calendar",
      desc: "Sync tasks to Google Calendar or subscribe via ICS link.",
      href: "/settings",
      done: userSettings?.calendarSync ?? false,
    },
  ]
  const onboardingComplete = onboardingSteps.filter((s) => s.done).length
  const hasNoActivity = allTasks.length === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      <AppNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Welcome header ───────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {session.user?.name?.split(" ")[0] || "Student"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {pendingTasks.length === 0
                ? "You're all caught up! Upload a syllabus to get started."
                : `You have ${pendingTasks.length} pending tasks${pendingTasks.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {pendingTasks.length > 0 && <StudyPlanButton />}
          </div>
        </div>

        {/* ── High Stakes Alert ─────────────────────────────────────── */}
        {highStakesTasks.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-red-100 p-2 rounded-lg shrink-0">
              <Flame className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800 mb-1">
                High-stakes deadline{highStakesTasks.length > 1 ? "s" : ""} in the next 5 days
              </p>
              <ul className="space-y-0.5">
                {highStakesTasks.map((t) => (
                  <li key={t.id} className="text-xs text-red-700 flex items-center gap-1.5">
                    <span className="font-medium truncate">{t.title}</span>
                    {t.dueDate && (
                      <span className="text-red-500 shrink-0">· due {formatDate(new Date(t.dueDate))}</span>
                    )}
                    {t.weightPercent && (
                      <span className="bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                        {t.weightPercent}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/tasks" className="shrink-0 text-xs font-medium text-red-700 hover:text-red-900 flex items-center gap-0.5">
              View <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {hasNoActivity ? (
          /* ── Onboarding checklist ─────────────────────────────────── */
          <div className="max-w-2xl">
            {/* Header */}
            <div className="bg-indigo-900 rounded-t-2xl px-8 py-6 text-white">
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Getting started</p>
              <h2 className="text-xl font-bold mb-1">Welcome to PlanEra</h2>
              <p className="text-indigo-300 text-sm">
                Complete these steps to get the most out of your academic planner.
              </p>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-indigo-300">{onboardingComplete} of {onboardingSteps.length} complete</span>
                  <span className="text-xs font-bold text-white">{Math.round((onboardingComplete / onboardingSteps.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-indigo-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${(onboardingComplete / onboardingSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Steps */}
            <div className="bg-white rounded-b-2xl shadow-sm border border-indigo-100 border-t-0 divide-y divide-gray-50">
              {onboardingSteps.map((step, i) => (
                <Link key={step.id} href={step.href}>
                  <div className={`flex items-center gap-4 px-8 py-5 hover:bg-indigo-50 transition-colors group ${step.done ? "opacity-60" : ""}`}>
                    {/* Step number / check */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done
                      ? "bg-emerald-100"
                      : "bg-indigo-100 group-hover:bg-indigo-200 transition-colors"
                      }`}>
                      {step.done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                      )}
                    </div>
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${step.done ? "line-through text-gray-400" : "text-gray-900"}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                    </div>
                    {/* Arrow */}
                    {!step.done && (
                      <ArrowRight className="h-4 w-4 text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* ── Workload Stats ────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  icon: Brain,
                  label: "Pending",
                  value: pendingTasks.length.toString(),
                  sub: "assignments",
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                },
                {
                  icon: Clock,
                  label: "Due Today",
                  value: todayTasks.length.toString(),
                  sub: todayTasks.length === 1 ? "assignment" : "assignments",
                  color: todayTasks.length > 0 ? "text-red-600" : "text-emerald-600",
                  bg: todayTasks.length > 0 ? "bg-red-50" : "bg-emerald-50",
                },
                {
                  icon: TrendingUp,
                  label: "Hours This Week",
                  value: weekHours.toString(),
                  sub: `across ${weekTasks.length} tasks`,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
                {
                  icon: CheckCircle2,
                  label: "Completed This Week",
                  value: weeklyWins.toString(),
                  sub: weeklyWins === 1 ? "assignment done" : "assignments done",
                  color: weeklyWins > 0 ? "text-emerald-600" : "text-gray-400",
                  bg: weeklyWins > 0 ? "bg-emerald-50" : "bg-gray-50",
                },
              ].map(({ icon: Icon, label, value, sub, color, bg }) => (
                <div key={label} className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`${bg} p-1.5 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">{label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── 7-Day Workload Bar ────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Weekly Workload</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Estimated hours of work due each day</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Next 7 days</span>
              </div>
              <div className="flex items-end gap-2 h-24">
                {sevenDayData.map(({ label, hours, taskCount }) => {
                  const heightPct = maxDayHours === 0 ? 0 : Math.round((hours / maxDayHours) * 100)
                  const isToday = label === "Today"
                  const isBusy = hours >= 3
                  const barColor = isToday
                    ? "bg-indigo-600"
                    : isBusy
                      ? "bg-amber-400"
                      : hours > 0
                        ? "bg-indigo-300"
                        : "bg-gray-100"

                  return (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      {taskCount > 0 && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {hours}h · {taskCount} task{taskCount !== 1 ? "s" : ""}
                        </div>
                      )}
                      {/* Bar */}
                      <div className="w-full flex items-end" style={{ height: "72px" }}>
                        <div
                          className={`w-full rounded-t-md transition-all ${barColor}`}
                          style={{ height: `${Math.max(heightPct, hours > 0 ? 8 : 4)}%` }}
                        />
                      </div>
                      {/* Label */}
                      <span className={`text-xs font-medium ${isToday ? "text-indigo-700" : "text-gray-400"}`}>
                        {label}
                      </span>
                      {hours > 0 && (
                        <span className="text-xs text-gray-500 font-semibold -mt-0.5">{hours}h</span>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-indigo-600" />
                  <span className="text-xs text-gray-400">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-amber-400" />
                  <span className="text-xs text-gray-400">Busy (3h+)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-indigo-300" />
                  <span className="text-xs text-gray-400">Light</span>
                </div>
              </div>
            </div>

            {/* ── Today's Focus + Class Progress ───────────────────── */}
            <div className="grid lg:grid-cols-5 gap-6 mb-6">

              {/* Today's Focus */}
              <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-indigo-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <h2 className="text-base font-semibold text-gray-900">Today&apos;s Focus</h2>
                  </div>
                  <Link href="/tasks" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    See all →
                  </Link>
                </div>
                <div className="p-4 space-y-2">
                  {focusTasks.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No upcoming deadlines; all clear!</p>
                    </div>
                  ) : (
                    focusTasks.map((task) => {
                      const isOverdue = task.daysLeft < 0
                      const isCritical = task.daysLeft <= 2
                      const isWarning = task.daysLeft <= 6
                      const urgencyBg = isOverdue
                        ? "bg-red-50 border-red-200"
                        : isCritical
                          ? "bg-red-50 border-red-100"
                          : isWarning
                            ? "bg-amber-50 border-amber-100"
                            : "bg-gray-50 border-gray-100"
                      const dayLabel = isOverdue
                        ? `${Math.abs(task.daysLeft)}d overdue`
                        : task.daysLeft === 0
                          ? "Due today"
                          : `${task.daysLeft}d left`
                      const dayColor = isOverdue
                        ? "text-red-700 bg-red-100"
                        : isCritical
                          ? "text-red-600 bg-red-100"
                          : isWarning
                            ? "text-amber-700 bg-amber-100"
                            : "text-gray-500 bg-gray-100"

                      return (
                        <div
                          key={task.id}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${urgencyBg}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {task.className && (
                                <span className="text-xs text-gray-500 truncate">{task.className}</span>
                              )}
                              {task.weightPercent && (
                                <span className="text-xs font-semibold text-indigo-600">
                                  {task.weightPercent}% of grade
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${dayColor}`}>
                            {dayLabel}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Class Progress */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-indigo-100">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Progress</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Assignments completed per class</p>
                </div>
                <div className="p-4 space-y-4">
                  {classProgress.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No classes yet</p>
                  ) : (
                    classProgress.slice(0, 5).map(({ name, total, done, colorIdx }) => {
                      const color = CLASS_COLORS[colorIdx]
                      const pct = total === 0 ? 0 : Math.round((done / total) * 100)
                      return (
                        <div key={name}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-gray-700 truncate max-w-[70%]">
                              {name}
                            </span>
                            <span className="text-xs text-gray-400 shrink-0">
                              {done}/{total}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${color.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── Quick Actions ─────────────────────────────────────── */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                {
                  href: "/upload",
                  icon: Upload,
                  iconBg: "bg-indigo-100 group-hover:bg-indigo-200",
                  iconColor: "text-indigo-600",
                  title: "Upload Syllabus",
                  desc: "Add another class or update existing tasks.",
                },
                {
                  href: "/calendar",
                  icon: Calendar,
                  iconBg: "bg-emerald-100 group-hover:bg-emerald-200",
                  iconColor: "text-emerald-600",
                  title: "View Calendar",
                  desc: "See deadlines laid out across the month.",
                },
                {
                  href: "/tasks",
                  icon: BookOpen,
                  iconBg: "bg-violet-100 group-hover:bg-violet-200",
                  iconColor: "text-violet-600",
                  title: "All Tasks",
                  desc: "Filter, edit, and track your full task list.",
                },
              ].map(({ href, icon: Icon, iconBg, iconColor, title, desc }) => (
                <Link href={href} key={href}>
                  <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group h-full">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`${iconBg} p-2.5 rounded-lg transition-colors shrink-0`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                    </div>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── Recent Uploads ────────────────────────────────────── */}
            {recentUploads.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-indigo-100">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Recent Uploads</h2>
                  <ActivityClearButton />
                </div>
                <div className="p-4 space-y-2">
                  {recentUploads.map((upload) => (
                    <div key={upload.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{upload.fileName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Uploaded {formatDate(new Date(upload.createdAt))}
                        </p>
                      </div>
                      <Link href="/tasks" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        Review →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
