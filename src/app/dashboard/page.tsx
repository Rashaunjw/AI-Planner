import { Button } from "@/components/ui/button"
import { GraduationCap, Upload, Calendar, Settings, LogOut, BookOpen, ClipboardList } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import ActivityClearButton from "@/components/activity-clear-button"

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
      {/* Navigation */}
      <nav className="bg-indigo-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <GraduationCap className="h-8 w-8 text-indigo-300" />
                <span className="text-xl font-bold text-white">PlanEra</span>
              </Link>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-indigo-200 hover:text-white hover:bg-indigo-800">
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
              <form action="/api/auth/signout" method="post">
                <input type="hidden" name="callbackUrl" value="/" />
                <Button variant="ghost" size="sm" type="submit" className="text-indigo-200 hover:text-white hover:bg-indigo-800">
                  <LogOut className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
            Welcome back, {session.user?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Upload a syllabus to get started, or check on your upcoming assignments.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <Link href="/upload">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group">
              <div className="flex items-center mb-3">
                <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <Upload className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-base font-semibold ml-3 text-gray-900">Upload Syllabus</h3>
              </div>
              <p className="text-gray-500 text-sm">
                Upload a PDF or paste text to extract assignments and deadlines automatically
              </p>
            </div>
          </Link>

          <Link href="/calendar">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group">
              <div className="flex items-center mb-3">
                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold ml-3 text-gray-900">View Calendar</h3>
              </div>
              <p className="text-gray-500 text-sm">
                See your upcoming assignments and study schedule in calendar view
              </p>
            </div>
          </Link>

          <Link href="/tasks">
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group">
              <div className="flex items-center mb-3">
                <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-base font-semibold ml-3 text-gray-900">My Assignments</h3>
              </div>
              <p className="text-gray-500 text-sm">
                Review, edit, and track all your assignments grouped by class
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-indigo-500" />
              <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <ActivityClearButton />
          </div>
          <div className="p-6">
            {recentUploads.length === 0 && upcomingTasks.length === 0 ? (
              <div className="text-center py-10">
                <GraduationCap className="h-12 w-12 text-indigo-200 mx-auto mb-4" />
                <h3 className="text-base font-semibold text-gray-900 mb-2">Nothing here yet</h3>
                <p className="text-gray-500 text-sm mb-5">
                  Upload your first syllabus to see your assignments and study plan here
                </p>
                <Link href="/upload">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Upload a Syllabus
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {upcomingTasks.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">
                      Upcoming Assignments
                    </h3>
                    <ul className="space-y-3">
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
                            View
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recentUploads.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-3">
                      Recent Uploads
                    </h3>
                    <ul className="space-y-3">
                      {recentUploads.map((upload) => (
                        <li key={upload.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-gray-900 font-medium text-sm">{upload.fileName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Uploaded {formatDate(new Date(upload.createdAt))}
                            </p>
                          </div>
                          <Link href="/tasks" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                            Review
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
