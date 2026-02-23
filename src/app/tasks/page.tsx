"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  GraduationCap,
  Calendar,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Trophy,
  Pencil,
  Search,
  SlidersHorizontal,
  Share2,
  Check,
  X,
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getRelativeTime } from "@/lib/utils"
import { toast } from "sonner"
import AppNav from "@/components/app-nav"
import LoadingScreen from "@/components/loading-screen"
import ConfirmDialog from "@/components/confirm-dialog"

interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: string
  category?: string
  estimatedDuration?: number
  weightPercent?: number | null
  className?: string | null
  status: string
}

const CATEGORY_OPTIONS = [
  "Homework",
  "Quiz",
  "Exam",
  "Midterm",
  "Final",
  "Project",
  "Essay",
  "Lab",
  "Reading",
  "Problem Set",
  "Presentation",
  "Discussion",
  "Game",
  "Event",
  "Other",
]

// Cycles through a palette of colors per unique class name
const CLASS_COLOR_PALETTE = [
  {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
  {
    border: "border-l-purple-500",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-800",
    dot: "bg-purple-500",
  },
  {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  {
    border: "border-l-rose-500",
    bg: "bg-rose-50",
    badge: "bg-rose-100 text-rose-800",
    dot: "bg-rose-500",
  },
  {
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500",
  },
  {
    border: "border-l-cyan-500",
    bg: "bg-cyan-50",
    badge: "bg-cyan-100 text-cyan-800",
    dot: "bg-cyan-500",
  },
  {
    border: "border-l-indigo-500",
    bg: "bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-800",
    dot: "bg-indigo-500",
  },
  {
    border: "border-l-teal-500",
    bg: "bg-teal-50",
    badge: "bg-teal-100 text-teal-800",
    dot: "bg-teal-500",
  },
]

// Google Calendar colorId (1-11) -> CLASS_COLOR_PALETTE index for consistent in-app display
const GOOGLE_COLOR_ID_TO_PALETTE_INDEX: Record<string, number> = {
  "1": 0,
  "2": 2,
  "3": 1,
  "4": 3,
  "5": 4,
  "6": 4,
  "7": 5,
  "8": 0,
  "9": 6,
  "10": 2,
  "11": 3,
}

export default function TasksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Task>>({})
  const [deletingAll, setDeletingAll] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    category: "",
    estimatedDuration: "",
    weightPercent: "",
    className: "",
  })

  // Confirm dialog state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false)

  // Filter & sort state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterClass, setFilterClass] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "weight">("dueDate")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all")
  const [showShareDropdown, setShowShareDropdown] = useState(false)
  const [sharingClass, setSharingClass] = useState<string | null>(null)
  const [classColors, setClassColors] = useState<Record<string, string>>({})
  const [editingClassName, setEditingClassName] = useState<string | null>(null)
  const [editingClassNameValue, setEditingClassNameValue] = useState("")
  const [renamingClass, setRenamingClass] = useState(false)

  const fetchTasks = async () => {
    try {
      const [tasksRes, colorsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/settings/class-colors"),
      ])
      if (tasksRes.ok) {
        const data = await tasksRes.json()
        setTasks(data.tasks || [])
      }
      if (colorsRes.ok) {
        const colorsData = await colorsRes.json()
        if (colorsData.classColors && typeof colorsData.classColors === "object") {
          setClassColors(colorsData.classColors)
        }
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast.error("Failed to load assignments.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/auth/signin")
    }
  }, [router, session, status])

  useEffect(() => {
    if (!showConfirmDeleteAll) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowConfirmDeleteAll(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showConfirmDeleteAll])

  const weightKey = (value: number) => (Math.round(value * 100) / 100).toFixed(2)

  const weightGroups = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach((task) => {
      if (task.weightPercent === null || task.weightPercent === undefined) return
      const key = weightKey(task.weightPercent)
      const existing = map.get(key) || []
      existing.push(task)
      map.set(key, existing)
    })
    return map
  }, [tasks])

  // Assign a stable color index to each unique class name
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

  const getClassColor = (className?: string | null) => {
    const key = className?.trim() || ""
    const savedColorId = classColors[key]
    if (savedColorId && GOOGLE_COLOR_ID_TO_PALETTE_INDEX[savedColorId] !== undefined) {
      const idx = GOOGLE_COLOR_ID_TO_PALETTE_INDEX[savedColorId]
      return CLASS_COLOR_PALETTE[idx]
    }
    const idx = classColorMap.get(key) ?? 0
    return CLASS_COLOR_PALETTE[idx]
  }

  // Group tasks by class name for display
  const groupedTasks = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach((task) => {
      const key = task.className?.trim() || "No Class"
      const existing = map.get(key) || []
      existing.push(task)
      map.set(key, existing)
    })
    return map
  }, [tasks])

  // Unique class names for filter pills
  const classNames = useMemo(() => Array.from(groupedTasks.keys()), [groupedTasks])

  // Filtered + sorted task list
  const filteredSortedTasks = useMemo(() => {
    let result = [...tasks]
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.className?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      )
    }
    // Status
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter)
    }
    // Sort
    if (sortBy === "dueDate") {
      result.sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    } else if (sortBy === "priority") {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      result.sort((a, b) => (order[a.priority] ?? 3) - (order[b.priority] ?? 3))
    } else if (sortBy === "weight") {
      result.sort((a, b) => (b.weightPercent ?? 0) - (a.weightPercent ?? 0))
    }
    return result
  }, [tasks, searchQuery, statusFilter, sortBy])

  // Re-group filtered tasks by class (respecting class filter pill)
  const filteredGroupedTasks = useMemo(() => {
    const map = new Map<string, Task[]>()
    const source = filterClass
      ? filteredSortedTasks.filter(
        (t) => (t.className?.trim() || "No Class") === filterClass
      )
      : filteredSortedTasks
    source.forEach((task) => {
      const key = task.className?.trim() || "No Class"
      const existing = map.get(key) || []
      existing.push(task)
      map.set(key, existing)
    })
    return map
  }, [filteredSortedTasks, filterClass])

  const getMissingFields = (task: Task) => {
    const missing: string[] = []
    const title = task.title?.trim() || ""
    if (!title || title === "Untitled task") {
      missing.push("title")
    }
    if (!task.dueDate) {
      missing.push("due date")
    }
    if (!task.className?.trim()) {
      missing.push("class name")
    }
    return missing
  }

  const toDateInputValue = (value?: string) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return date.toISOString().slice(0, 10)
  }

  if (status === "loading") {
    return <LoadingScreen message="Loading your assignments..." />
  }

  if (!session) {
    return null
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task.id)
    setEditForm({
      title: task.title,
      description: task.description,
      dueDate: toDateInputValue(task.dueDate),
      priority: task.priority,
      category: task.category,
      estimatedDuration: task.estimatedDuration,
      weightPercent: task.weightPercent ?? null,
      className: task.className ?? "",
    })
  }

  const handleSave = async (taskId: string) => {
    try {
      if (!editForm.title?.trim() || !editForm.dueDate || !editForm.className?.trim()) {
        toast.error("Assignment name, due date, and class name are required.")
        return
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, ...editForm } : task)))
        setEditingTask(null)
        setEditForm({})
        toast.success("Assignment updated.")
      } else {
        toast.error("Failed to update assignment.")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      toast.error("Failed to update assignment.")
    }
  }

  const handleDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== taskId))
        toast.success("Assignment deleted.")
      } else {
        toast.error("Failed to delete assignment.")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete assignment.")
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const handleDeleteCompleted = async () => {
    setDeletingAll(true)
    try {
      const response = await fetch("/api/tasks?completedOnly=true", { method: "DELETE" })
      if (response.ok) {
        setTasks((prev) => prev.filter((t) => t.status !== "completed"))
        toast.success("Completed tasks cleared.")
      } else {
        toast.error("Failed to clear completed tasks.")
      }
    } catch (error) {
      console.error("Error clearing completed tasks:", error)
      toast.error("Failed to clear completed tasks.")
    } finally {
      setDeletingAll(false)
    }
  }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    try {
      const response = await fetch("/api/tasks", { method: "DELETE" })
      if (response.ok) {
        setTasks([])
        toast.success("All tasks cleared.")
      } else {
        toast.error("Failed to clear tasks.")
      }
    } catch (error) {
      console.error("Error deleting tasks:", error)
      toast.error("Failed to clear tasks.")
    } finally {
      setDeletingAll(false)
    }
  }

  const handleStartRenameClass = (name: string) => {
    setEditingClassName(name)
    setEditingClassNameValue(name)
  }

  const handleCancelRenameClass = () => {
    setEditingClassName(null)
    setEditingClassNameValue("")
  }

  const handleSaveRenameClass = async () => {
    const newName = editingClassNameValue.trim()
    if (!editingClassName || !newName || newName === editingClassName) {
      handleCancelRenameClass()
      return
    }
    setRenamingClass(true)
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldClassName: editingClassName,
          newClassName: newName,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || "Failed to rename class.")
      }
      const valueForState = newName === "No Class" ? null : newName
      setTasks((prev) =>
        prev.map((t) =>
          (t.className?.trim() || "No Class") === editingClassName
            ? { ...t, className: valueForState }
            : t
        )
      )
      if (filterClass === editingClassName) setFilterClass(newName === "No Class" ? "No Class" : newName)
      toast.success(`Renamed to "${newName}" everywhere.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to rename class.")
    } finally {
      setRenamingClass(false)
      handleCancelRenameClass()
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.title.trim()) return
    if (!createForm.dueDate) return
    if (!createForm.className.trim()) return

    setCreating(true)
    try {
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        dueDate: createForm.dueDate || undefined,
        priority: createForm.priority,
        category: createForm.category.trim() || undefined,
        estimatedDuration: createForm.estimatedDuration
          ? Number(createForm.estimatedDuration)
          : undefined,
        weightPercent: parseWeightInput(createForm.weightPercent),
        className: createForm.className.trim(),
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        setTasks([data.task, ...tasks])
        setCreateForm({
          title: "",
          description: "",
          dueDate: "",
          priority: "medium",
          category: "",
          estimatedDuration: "",
          weightPercent: "",
          className: "",
        })
        setShowCreateForm(false)
        toast.success("Assignment added.")
      } else {
        toast.error("Failed to add assignment.")
      }
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error("Failed to add assignment.")
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
        if (newStatus === "completed") {
          toast.success("Marked as submitted!")
        }
      } else {
        toast.error("Failed to update status.")
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      toast.error("Failed to update status.")
    }
  }

  const parseWeightInput = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const numeric = trimmed.endsWith("%") ? trimmed.slice(0, -1).trim() : trimmed
    const parsed = Number(numeric)
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return undefined
    return Math.round(parsed * 100) / 100
  }

  const formatWeightPercent = (value: number) => {
    const rounded = Math.round(value * 100) / 100
    const formatted = Number.isInteger(rounded)
      ? rounded.toString()
      : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
    return `${formatted}%`
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "high":
        return { label: "High", className: "bg-red-100 text-red-800 border border-red-200" }
      case "medium":
        return {
          label: "Medium",
          className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        }
      case "low":
        return {
          label: "Low",
          className: "bg-green-100 text-green-800 border border-green-200",
        }
      default:
        return { label: priority, className: "bg-gray-100 text-gray-800" }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { label: "Submitted", className: "bg-green-100 text-green-800 border border-green-200" }
      case "pending":
        return { label: "To Do", className: "bg-blue-100 text-blue-800 border border-blue-200" }
      case "cancelled":
        return { label: "Dropped", className: "bg-gray-100 text-gray-600 border border-gray-200" }
      default:
        return { label: status, className: "bg-gray-100 text-gray-800" }
    }
  }

  const totalAssignments = tasks.length
  const completedAssignments = tasks.filter((t) => t.status === "completed").length
  const pendingAssignments = tasks.filter((t) => t.status === "pending").length

  if (loading) {
    return <LoadingScreen message="Loading your assignments..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      <AppNav />

      {/* Confirm: Delete single */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Confirm: Clear completed vs all */}
      {showConfirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowConfirmDeleteAll(false)}
            aria-hidden
          />
          <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Clear tasks</h3>
            <p className="text-sm text-gray-500 mb-4">
              Do you want to clear completed tasks only, or all tasks?
            </p>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                disabled={deletingAll || completedAssignments === 0}
                onClick={() => {
                  setShowConfirmDeleteAll(false)
                  handleDeleteCompleted()
                }}
              >
                Clear completed only ({completedAssignments})
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deletingAll}
                onClick={() => {
                  setShowConfirmDeleteAll(false)
                  handleDeleteAll()
                }}
              >
                Clear all tasks ({totalAssignments})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDeleteAll(false)}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BookOpen className="h-7 w-7 text-indigo-600" />
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Tasks</h1>
              </div>
              <p className="text-gray-500 text-sm">
                Track deadlines, grades, and priorities across all your classes
              </p>
            </div>

            {/* Stats bar */}
            {totalAssignments > 0 && (
              <div className="flex gap-4 text-center">
                <div className="bg-indigo-50 rounded-lg px-4 py-2">
                  <p className="text-2xl font-bold text-indigo-700">{totalAssignments}</p>
                  <p className="text-xs text-indigo-500 font-medium">Total</p>
                </div>
                <div className="bg-blue-50 rounded-lg px-4 py-2">
                  <p className="text-2xl font-bold text-blue-700">{pendingAssignments}</p>
                  <p className="text-xs text-blue-500 font-medium">To Do</p>
                </div>
                <div className="bg-green-50 rounded-lg px-4 py-2">
                  <p className="text-2xl font-bold text-green-700">{completedAssignments}</p>
                  <p className="text-xs text-green-500 font-medium">Completed</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <Button
              size="sm"
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Pencil className="h-4 w-4 mr-1" />
              {showCreateForm ? "Hide Form" : "Add Assignment"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmDeleteAll(true)}
              disabled={tasks.length === 0 || deletingAll}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              {deletingAll ? "Clearing..." : "Clear All"}
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareDropdown((prev) => !prev)}
                disabled={classNames.length === 0}
                className="border-gray-200"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share class view
              </Button>
              {showShareDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setShowShareDropdown(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 bg-white rounded-lg border border-gray-200 shadow-lg py-1 min-w-[180px]">
                    <p className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                      Share read-only view with study group
                    </p>
                    {classNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        disabled={sharingClass !== null}
                        onClick={async () => {
                          setSharingClass(name)
                          try {
                            const res = await fetch("/api/share/class", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ className: name }),
                            })
                            const data = await res.json().catch(() => ({}))
                            if (!res.ok) throw new Error(data?.error || "Failed to create link")
                            const url = data.url
                            if (url) {
                              await navigator.clipboard.writeText(url)
                              toast.success(`Link for "${name}" copied to clipboard`)
                            }
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed to create share link")
                          } finally {
                            setSharingClass(null)
                            setShowShareDropdown(false)
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"
                      >
                        <span className="truncate">{name}</span>
                        {sharingClass === name ? (
                          <span className="text-xs text-gray-400">Copying...</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Assignment Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-5">
              <Pencil className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900">New Assignment</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g., Chapter 4 Reading Quiz"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={createForm.className}
                    onChange={(e) => setCreateForm({ ...createForm, className: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g., Biology 101"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  rows={2}
                  placeholder="Optional notes about the assignment"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Type
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select type...</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Weight (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={createForm.weightPercent}
                    onChange={(e) => setCreateForm({ ...createForm, weightPercent: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g., 20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Time to Complete (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.estimatedDuration}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, estimatedDuration: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g., 90"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={
                    creating ||
                    !createForm.title.trim() ||
                    !createForm.dueDate ||
                    !createForm.className.trim()
                  }
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {creating ? "Adding..." : "Add Assignment"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* ── Filter & Sort Bar ─────────────────────────────────── */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assignments..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              {/* Status Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "all" | "pending" | "completed")
                  }
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">To Do</option>
                  <option value="completed">Submitted</option>
                </select>
              </div>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "dueDate" | "priority" | "weight")
                }
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 shrink-0"
              >
                <option value="dueDate">Sort: Due Date</option>
                <option value="priority">Sort: Priority</option>
                <option value="weight">Sort: Grade Weight</option>
              </select>
            </div>

            {/* Class Filter Pills */}
            {classNames.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => setFilterClass(null)}
                  className={`text-xs font-medium px-3 py-1 rounded-full border transition-colors ${filterClass === null
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                >
                  All Classes/Organizations
                </button>
                {classNames.map((name) => {
                  const color = getClassColor(name === "No Class" ? null : name)
                  const isActive = filterClass === name
                  const isEditing = editingClassName === name
                  return (
                    <div
                      key={name}
                      className={`inline-flex items-center gap-1 rounded-full border transition-colors ${isEditing
                        ? "bg-white border-gray-300 pl-2 pr-1 py-0.5"
                        : isActive
                          ? color.badge + " border-transparent"
                          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                        }`}
                    >
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editingClassNameValue}
                            onChange={(e) => setEditingClassNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRenameClass()
                              if (e.key === "Escape") handleCancelRenameClass()
                            }}
                            className="text-xs font-medium w-24 sm:w-28 bg-transparent border-0 py-1 focus:outline-none focus:ring-0 text-gray-900"
                            placeholder="Class name"
                            autoFocus
                            disabled={renamingClass}
                          />
                          <button
                            type="button"
                            onClick={handleSaveRenameClass}
                            disabled={renamingClass || !editingClassNameValue.trim()}
                            className="p-1 rounded-full text-green-600 hover:bg-green-100"
                            aria-label="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelRenameClass}
                            disabled={renamingClass}
                            className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
                            aria-label="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setFilterClass(isActive ? null : name)}
                            className={`text-xs font-medium px-2 py-1 rounded-full ${isActive ? "text-inherit" : "hover:bg-gray-100/50"}`}
                          >
                            {name}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartRenameClass(name)
                            }}
                            className="p-0.5 rounded-full text-gray-500 hover:bg-black/10 hover:text-indigo-600"
                            aria-label="Rename class"
                            title="Rename this class everywhere"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Active filter summary */}
            {(searchQuery || filterClass || statusFilter !== "all") && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  Showing {Array.from(filteredGroupedTasks.values()).flat().length} of {tasks.length} assignments
                </span>
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setFilterClass(null)
                    setStatusFilter("all")
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <GraduationCap className="h-16 w-16 text-indigo-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Upload a syllabus to auto-extract your assignments, or add them manually above.
            </p>
          </div>
        ) : (
          /* Grouped by Class */
          <div className="space-y-8">
            {filteredGroupedTasks.size === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No assignments match your filters.</p>
                <button
                  onClick={() => { setSearchQuery(""); setFilterClass(null); setStatusFilter("all") }}
                  className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Clear filters
                </button>
              </div>
            ) : Array.from(filteredGroupedTasks.entries()).map(([className, classTasks]) => {
              const color = getClassColor(className === "No Class" ? null : className)
              const classCompleted = classTasks.filter((t) => t.status === "completed").length
              const progressPct = Math.round((classCompleted / classTasks.length) * 100)

              return (
                <div key={className}>
                  {/* Class Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${color.dot}`} />
                      <h2 className="text-base font-bold text-gray-800 uppercase tracking-wide">
                        {className}
                      </h2>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color.badge}`}>
                        {classTasks.length} assignment{classTasks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {classCompleted}/{classTasks.length} done
                    </span>
                  </div>

                  {/* Class Progress Bar */}
                  <div className="mb-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${color.dot}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Task Cards */}
                  <div className="space-y-3">
                    {classTasks.map((task) => {
                      const weightGroup =
                        task.weightPercent === null || task.weightPercent === undefined
                          ? null
                          : weightGroups.get(weightKey(task.weightPercent))
                      const sameWeightCount = weightGroup ? weightGroup.length - 1 : 0
                      const missingFields = getMissingFields(task)
                      const isIncomplete = missingFields.length > 0
                      const isCompleted = task.status === "completed"
                      const priorityConfig = getPriorityConfig(task.priority)
                      const statusConfig = getStatusConfig(task.status)

                      // Urgency tinting based on due date
                      const daysUntilDue = task.dueDate
                        ? Math.ceil(
                          (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                        )
                        : null
                      const urgencyClass =
                        !isCompleted && daysUntilDue !== null
                          ? daysUntilDue <= 3
                            ? "bg-red-50 border-l-red-500"
                            : daysUntilDue <= 7
                              ? "bg-amber-50 border-l-amber-400"
                              : "bg-white " + color.border
                          : isCompleted
                            ? "bg-gray-50 opacity-75 " + color.border
                            : isIncomplete
                              ? "border-l-yellow-400 bg-yellow-50"
                              : "bg-white " + color.border

                      return (
                        <div
                          key={task.id}
                          className={`rounded-lg shadow-sm border-l-4 border border-gray-200 p-5 transition-all ${urgencyClass}`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1 min-w-0">
                              {editingTask === task.id ? (
                                /* Edit Form */
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Assignment Name
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.title || ""}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, title: e.target.value })
                                      }
                                      className="w-full text-base font-semibold border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Class
                                    </label>
                                    <input
                                      type="text"
                                      value={editForm.className || ""}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, className: e.target.value })
                                      }
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                      placeholder="e.g., Biology 101"
                                      required
                                    />
                                    <p className="text-xs text-gray-400 mt-0.5">
                                      Fix the class name here if the syllabus had it wrong.
                                    </p>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                      Notes
                                    </label>
                                    <textarea
                                      value={editForm.description || ""}
                                      onChange={(e) =>
                                        setEditForm({ ...editForm, description: e.target.value })
                                      }
                                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                      rows={2}
                                    />
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Due Date
                                      </label>
                                      <input
                                        type="date"
                                        value={editForm.dueDate || ""}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, dueDate: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Priority
                                      </label>
                                      <select
                                        value={editForm.priority || "medium"}
                                        onChange={(e) =>
                                          setEditForm({ ...editForm, priority: e.target.value })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                      >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Grade Weight (%)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={editForm.weightPercent ?? ""}
                                        onChange={(e) => {
                                          const nextValue =
                                            e.target.value === "" ? null : Number(e.target.value)
                                          setEditForm({
                                            ...editForm,
                                            weightPercent: Number.isNaN(nextValue)
                                              ? null
                                              : nextValue,
                                          })
                                        }}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleSave(task.id)}
                                      size="sm"
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditingTask(null)}
                                      size="sm"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* Display View */
                                <>
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3
                                      className={`text-base font-semibold break-words ${isCompleted
                                        ? "line-through text-gray-400"
                                        : "text-gray-900"
                                        }`}
                                    >
                                      {task.title}
                                    </h3>
                                    <button
                                      type="button"
                                      onClick={() => handleEdit(task)}
                                      title="Change class name"
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${color.badge} border-transparent hover:ring-2 hover:ring-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                                    >
                                      {task.className?.trim() || "No class"}
                                      <Edit className="h-3 w-3 opacity-70" />
                                    </button>
                                    {task.category && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
                                        {task.category}
                                      </span>
                                    )}
                                    {/* Urgency badge */}
                                    {!isCompleted && daysUntilDue !== null && daysUntilDue <= 3 && (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200 shrink-0">
                                        {daysUntilDue <= 0 ? "Overdue!" : `Due in ${daysUntilDue}d`}
                                      </span>
                                    )}
                                  </div>

                                  {isIncomplete && (
                                    <div className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                                      Missing: {missingFields.join(", ")}. Fill these in to
                                      sync with Google Calendar.
                                    </div>
                                  )}

                                  {task.description && (
                                    <p className="text-sm text-gray-500 mb-3">{task.description}</p>
                                  )}

                                  <div className="flex flex-wrap items-center gap-3 text-xs">
                                    {task.dueDate && (
                                      <div className="flex items-center gap-1 text-gray-500">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{getRelativeTime(new Date(task.dueDate))}</span>
                                      </div>
                                    )}
                                    {task.estimatedDuration && (
                                      <div className="flex items-center gap-1 text-gray-500">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>{task.estimatedDuration} min</span>
                                      </div>
                                    )}
                                    {task.weightPercent !== null &&
                                      task.weightPercent !== undefined && (
                                        <div className="flex items-center gap-1">
                                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                                          <span className="font-medium text-amber-700">
                                            {formatWeightPercent(task.weightPercent)} of grade
                                          </span>
                                        </div>
                                      )}
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${statusConfig.className}`}
                                    >
                                      {statusConfig.label}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full font-medium shrink-0 ${priorityConfig.className}`}
                                    >
                                      {priorityConfig.label}
                                    </span>
                                  </div>

                                  {sameWeightCount > 0 && (
                                    <div className="mt-2 text-xs text-gray-400">
                                      Same weight as {sameWeightCount} other{" "}
                                      {sameWeightCount === 1 ? "assignment" : "assignments"}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Action Buttons */}
                            {editingTask !== task.id && (
                              <div className="flex items-center gap-2 sm:ml-4 sm:shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(task)}
                                  className="text-gray-400 hover:text-indigo-600"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setConfirmDeleteId(task.id)}
                                  className="text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                {task.status === "pending" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusChange(task.id, "completed")}
                                    className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                                  >
                                    <CheckCircle className="h-4 w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Mark Done</span>
                                  </Button>
                                )}
                                {task.status === "completed" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStatusChange(task.id, "pending")}
                                    className="text-gray-500 border-gray-300 hover:bg-gray-50 text-xs"
                                  >
                                    Undo
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
