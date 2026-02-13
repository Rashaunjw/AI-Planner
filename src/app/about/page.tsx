import { Brain, Calendar, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-gray-900">PlanEra</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            Home
          </Link>
          <Link href="/auth/signin">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About PlanEra
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            PlanEra is an AI-powered study planner that helps students turn
            syllabi and schedules into clear tasks, realistic study plans, and
            calendar events. Upload your documents, let AI extract deadlines,
            and keep everything organized with reminders.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Document to Tasks</h2>
              <p className="text-gray-600">
                Upload PDFs or paste text, and PlanEra extracts assignments,
                exams, and important dates.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">AI Study Planning</h2>
              <p className="text-gray-600">
                Generate a balanced study plan based on your workload and due
                dates.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Calendar Sync</h2>
              <p className="text-gray-600">
                Sync tasks to Google Calendar and get reminders when deadlines
                are coming up.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-semibold mb-3">Who PlanEra is for</h2>
            <p className="text-gray-600">
              PlanEra is built for students who want a simpler way to manage
              coursework, avoid missed deadlines, and stay organized throughout
              the semester.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

