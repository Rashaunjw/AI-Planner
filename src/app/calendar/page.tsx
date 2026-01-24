"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Brain, ArrowLeft, Calendar, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { isDevBypassClientEnabled } from "@/lib/dev-bypass-client"

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isDevBypass = isDevBypassClientEnabled()

  useEffect(() => {
    if (!isDevBypass && status !== "loading" && !session) {
      router.replace("/auth/signin")
    }
  }, [isDevBypass, router, session, status])

  if (status === "loading" && !isDevBypass) {
    return <div>Loading...</div>
  }

  if (!session && !isDevBypass) {
    return null
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

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Calendar className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Calendar Integration Coming Soon</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We&apos;re working on integrating with Google Calendar to provide you with a comprehensive view of your academic schedule. 
            This will include automatic task scheduling, conflict detection, and smart study time suggestions.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 mb-1">Smart Scheduling</h3>
              <p className="text-sm text-blue-700">AI-powered time slot suggestions based on your availability</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 mb-1">Google Calendar Sync</h3>
              <p className="text-sm text-green-700">Seamless integration with your existing calendar</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900 mb-1">Conflict Detection</h3>
              <p className="text-sm text-purple-700">Automatic detection of scheduling conflicts and suggestions</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link href="/tasks">
              <Button variant="outline" size="lg">
                View Tasks List
              </Button>
            </Link>
            <div>
              <p className="text-sm text-gray-500">
                In the meantime, you can manage your tasks in the tasks view
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
