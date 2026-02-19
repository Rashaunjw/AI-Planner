import { Button } from "@/components/ui/button"
import { Brain, Upload, Calendar } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import ActivityClearButton from "@/components/activity-clear-button"
import AppNav from "@/components/app-nav"

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  const [recentUploads, upcomingTasks] = await Promise.all([
    prisma.upload.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        userId: session.user.id,
        dueDate: { not: null },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      <AppNav />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name?.split(" ")[0] || "Student"}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Ready to organize your academic schedule? Upload your syllabus or schedule to get started.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/upload">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <Upload className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3 text-gray-900">Upload Syllabus</h3>
              </div>
              <p className="text-gray-500 text-sm">
                Upload a PDF or paste text — AI extracts assignments and deadlines automatically.
              </p>
            </div>
          </Link>

          <Link href="/calendar">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
              <div className="flex items-center mb-4">
                <div className="bg-emerald-100 p-3 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3 text-gray-900">View Calendar</h3>
              </div>
              <p className="text-gray-500 text-sm">
                See your upcoming tasks and deadlines in calendar format.
              </p>
            </div>
          </Link>

          <Link href="/tasks">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
              <div className="flex items-center mb-4">
                <div className="bg-violet-100 p-3 rounded-lg group-hover:bg-violet-200 transition-colors">
                  <Brain className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3 text-gray-900">Manage Tasks</h3>
              </div>
              <p className="text-gray-500 text-sm">
                Review, edit, and track all your AI-generated assignments.
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <ActivityClearButton />
          </div>
          <div className="p-6">
            {recentUploads.length === 0 && upcomingTasks.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-indigo-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                <p className="text-gray-500 mb-4 text-sm">
                  Upload your first syllabus or schedule to see your study plan here.
                </p>
                <Link href="/upload">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {upcomingTasks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Upcoming Tasks
                    </h3>
                    <ul className="space-y-2">
                      {upcomingTasks.map((task) => (
                        <li key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-gray-900 font-medium text-sm">{task.title}</p>
                            {task.dueDate && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                Due {formatDate(new Date(task.dueDate))}
                              </p>
                            )}
                          </div>
                          <Link href="/tasks" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            View →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recentUploads.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Recent Uploads
                    </h3>
                    <ul className="space-y-2">
                      {recentUploads.map((upload) => (
                        <li key={upload.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-gray-900 font-medium text-sm">{upload.fileName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Uploaded {formatDate(new Date(upload.createdAt))}
                            </p>
                          </div>
                          <Link href="/tasks" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            Review →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
