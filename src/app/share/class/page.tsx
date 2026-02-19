"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { GraduationCap, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Task = {
  id: string
  title: string
  dueDate: string | null
  priority: string
  status: string
  category: string | null
}

export default function ShareClassPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [data, setData] = useState<{ className: string; tasks: Task[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setError("Missing share link")
      setLoading(false)
      return
    }
    fetch(`/api/share/class?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) return res.json().then((b) => Promise.reject(b))
        return res.json()
      })
      .then(setData)
      .catch((err) => setError(err?.error || "Could not load shared view"))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 flex items-center justify-center p-6">
        <p className="text-gray-500">Loading shared class view...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Invalid or expired link</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link href="/">
            <Button variant="outline">Go to PlanEra</Button>
          </Link>
        </div>
      </div>
    )
  }

  const priorityColor = (p: string) =>
    p === "high" ? "text-red-600 bg-red-50" : p === "medium" ? "text-amber-600 bg-amber-50" : "text-gray-600 bg-gray-100"

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      <header className="bg-indigo-900 text-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-indigo-300" />
            <span className="font-bold text-lg">PlanEra</span>
          </div>
          <span className="text-indigo-200 text-sm">Read-only class view</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{data.className}</h1>
        <p className="text-sm text-gray-500 mb-6">
          Shared with you for study group. Only the class owner can edit tasks.
        </p>

        {data.tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No tasks in this class yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {data.tasks.map((t) => (
              <li
                key={t.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {t.dueDate && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(t.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <span
                      className={`inline-flex text-xs font-medium px-1.5 py-0.5 rounded ${priorityColor(t.priority)}`}
                    >
                      {t.priority}
                    </span>
                    {t.status === "completed" && (
                      <span className="text-xs text-green-600 font-medium">Done</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="outline">Create your own plan</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
