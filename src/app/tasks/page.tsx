"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Brain, Calendar, Edit, Trash2, ArrowLeft, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { getRelativeTime } from "@/lib/utils"

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
    className: ""
  })

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
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

  const weightKey = (value: number) =>
    (Math.round(value * 100) / 100).toFixed(2)

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

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task.id)
    setEditForm({
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      category: task.category,
      estimatedDuration: task.estimatedDuration,
      weightPercent: task.weightPercent ?? null,
      className: task.className ?? ""
    })
  }

  const handleSave = async (taskId: string) => {
    try {
      if (!editForm.title?.trim() || !editForm.dueDate || !editForm.className?.trim()) {
        alert("Assignment name, due date, and class name are required.")
        return
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, ...editForm } : task
        ))
        setEditingTask(null)
        setEditForm({})
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTasks(tasks.filter(task => task.id !== taskId))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Delete all tasks? This action cannot be undone.')) return

    setDeletingAll(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
      })

      if (response.ok) {
        setTasks([])
      }
    } catch (error) {
      console.error('Error deleting tasks:', error)
    } finally {
      setDeletingAll(false)
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
      className: createForm.className.trim()
    }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          className: ""
        })
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status } : task
        ))
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const parseWeightInput = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return undefined
    const numeric = trimmed.endsWith("%")
      ? trimmed.slice(0, -1).trim()
      : trimmed
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
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
                <Button size="sm">Upload</Button>
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Tasks</h1>
            <p className="text-gray-600">
              Review, edit, or add tasks manually
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setShowCreateForm((prev) => !prev)}
            >
              {showCreateForm ? "Hide Add Task" : "Add Task"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              disabled={tasks.length === 0 || deletingAll}
            >
              {deletingAll ? "Deleting..." : "Delete All"}
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a task</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Read chapter 4"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name
                </label>
                <input
                  type="text"
                  value={createForm.className}
                  onChange={(e) => setCreateForm({ ...createForm, className: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="e.g., Biology 101"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Optional details"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={createForm.weightPercent}
                    onChange={(e) => setCreateForm({ ...createForm, weightPercent: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Duration (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.estimatedDuration}
                    onChange={(e) => setCreateForm({ ...createForm, estimatedDuration: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  type="submit"
                  disabled={
                    creating ||
                    !createForm.title.trim() ||
                    !createForm.dueDate ||
                    !createForm.className.trim()
                  }
                >
                  {creating ? "Adding..." : "Add Task"}
                </Button>
                <Link href="/upload">
                  <Button type="button" variant="outline">
                    Upload Syllabus/Schedule
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-6">
              Upload a syllabus to extract tasks automatically, or add them manually
            </p>
            <Link href="/upload">
              <Button>Upload Syllabus/Schedule</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const weightGroup =
                task.weightPercent === null || task.weightPercent === undefined
                  ? null
                  : weightGroups.get(weightKey(task.weightPercent))
              const sameWeightCount = weightGroup ? weightGroup.length - 1 : 0

              return (
                <div key={task.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingTask === task.id ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full text-lg font-semibold border rounded px-3 py-2"
                          />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                          <input
                            type="text"
                            value={editForm.className || ''}
                            onChange={(e) => setEditForm({...editForm, className: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            placeholder="Class name"
                            required
                          />
                        </div>
                          <textarea
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            className="w-full border rounded px-3 py-2"
                            rows={3}
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                              <input
                                type="date"
                                value={editForm.dueDate || ''}
                                onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
                                className="w-full border rounded px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                              <select
                                value={editForm.priority || 'medium'}
                                onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                                className="w-full border rounded px-3 py-2"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (%)</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={editForm.weightPercent ?? ''}
                                onChange={(e) => {
                                  const nextValue = e.target.value === '' ? null : Number(e.target.value)
                                  setEditForm({
                                    ...editForm,
                                    weightPercent: Number.isNaN(nextValue) ? null : nextValue
                                  })
                                }}
                                className="w-full border rounded px-3 py-2"
                              />
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button onClick={() => handleSave(task.id)} size="sm">
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
                        <>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                          </div>
                          
                          {task.description && (
                            <p className="text-gray-600 mb-3">{task.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            {task.dueDate && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{getRelativeTime(new Date(task.dueDate))}</span>
                              </div>
                            )}
                            {task.estimatedDuration && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{task.estimatedDuration} min</span>
                              </div>
                            )}
                            {task.weightPercent !== null && task.weightPercent !== undefined && (
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500">Weight</span>
                                <span className="font-medium text-gray-700">
                                  {formatWeightPercent(task.weightPercent)}
                                </span>
                              </div>
                            )}
                            {task.className && (
                              <span className="text-indigo-600 font-medium">{task.className}</span>
                            )}
                            {task.category && (
                              <span className="text-blue-600 font-medium">{task.category}</span>
                            )}
                          </div>
                          {sameWeightCount > 0 && (
                            <div className="mt-2 text-xs text-gray-500">
                              Same weight as {sameWeightCount} other {sameWeightCount === 1 ? "task" : "tasks"}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {editingTask !== task.id && (
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(task.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {task.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(task.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    )}
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
