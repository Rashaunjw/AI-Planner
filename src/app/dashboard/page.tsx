import { Button } from "@/components/ui/button"
import { Brain, Upload, Calendar, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDevBypassSession, isAuthBypassEnabled } from "@/lib/auth-dev-bypass"

export default async function Dashboard() {
  let session = await getServerSession(authOptions)
  
  if (!session && isAuthBypassEnabled()) {
    session = getDevBypassSession()
  }

  if (!session) {
    redirect("/auth/signin")
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
                <span className="text-xl font-bold text-gray-900">AI Planner</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <form action="/api/auth/signout" method="post">
                <input type="hidden" name="callbackUrl" value="/" />
                <Button variant="ghost" size="sm" type="submit">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name || "Student"}!
          </h1>
          <p className="text-gray-600">
            Ready to organize your academic schedule? Upload your syllabus to get started.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/upload">
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3">Upload Syllabus</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Upload PDF to extract assignments and deadlines
              </p>
            </div>
          </Link>

          <Link href="/calendar">
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3">View Calendar</h3>
              </div>
              <p className="text-gray-600 text-sm">
                See your upcoming tasks and study schedule
              </p>
            </div>
          </Link>

          <Link href="/tasks">
            <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold ml-3">Manage Tasks</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Review and edit AI-generated study plans
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-4">
                Upload your first syllabus to see your study plan here
              </p>
              <Link href="/upload">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
