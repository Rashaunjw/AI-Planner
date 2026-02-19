import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, FileText, GraduationCap, BookOpen, Bell } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-indigo-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-300" />
              <span className="text-xl sm:text-2xl font-bold text-white">PlanEra</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/about" className="text-sm text-indigo-200 hover:text-white">
                About
              </Link>
              <Link href="/auth/signin">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-indigo-400 text-indigo-100 hover:bg-indigo-800 hover:text-white bg-transparent"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <GraduationCap className="h-4 w-4" />
            Built for students
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            PlanEra
            <span className="text-indigo-600"> for Smarter Scheduling</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Turn your syllabi and schedules into organized assignments, study plans, and calendar events.
            Upload your documents, let AI extract deadlines, and stay on top of every class.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white text-base px-8 py-4">
                Get Started — It&apos;s Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
              <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Upload Syllabi</h3>
              <p className="text-gray-500 text-sm">
                Upload PDFs, Word docs, or paste text. AI extracts deadlines, assignments, and exams automatically.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">AI Planning</h3>
              <p className="text-gray-500 text-sm">
                Get personalized study schedules that account for your workload, deadlines, and available time.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-indigo-100">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Calendar Sync</h3>
              <p className="text-gray-500 text-sm">
                Automatically sync with Google Calendar and get email reminders before assignments are due.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white border-t border-gray-100 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">How It Works</h2>
            <p className="text-center text-gray-500 mb-12 text-sm">Four steps from syllabus to organized schedule</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {[
                { step: "1", title: "Upload", desc: "Upload your syllabus or schedule" },
                { step: "2", title: "Parse", desc: "AI extracts tasks and deadlines" },
                { step: "3", title: "Review", desc: "Edit and organize your assignments" },
                { step: "4", title: "Sync", desc: "Push to calendar with smart reminders" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold shadow-md">
                    {step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-indigo-900 py-14">
        <div className="container mx-auto px-6 text-center">
          <Bell className="h-8 w-8 text-indigo-300 mx-auto mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Never miss a deadline again
          </h2>
          <p className="text-indigo-300 mb-6 max-w-md mx-auto text-sm">
            Join students already using PlanEra to stay ahead of their coursework.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold">
              Create a Free Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-indigo-950 text-white py-10">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <GraduationCap className="h-5 w-5 text-indigo-400" />
            <span className="text-lg font-bold">PlanEra</span>
          </div>
          <p className="text-indigo-400 text-sm">AI-powered study planning and calendar sync for students</p>
          <div className="mt-4 flex items-center justify-center gap-5 text-sm text-indigo-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
