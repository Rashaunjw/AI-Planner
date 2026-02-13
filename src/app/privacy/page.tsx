import { Brain } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
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
          <Link href="/about" className="text-gray-700 hover:text-gray-900">
            About
          </Link>
          <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900">
            Sign In
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: Feb 13, 2026</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-2">Overview</h2>
              <p>
                PlanEra helps students organize coursework by turning documents into tasks
                and syncing schedules to calendars. This policy explains what data we
                collect and how we use it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
              <p>
                We collect account details such as name and email, uploaded documents and
                parsed task data, and calendar sync tokens when you connect Google Calendar.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">How We Use Information</h2>
              <p>
                We use your data to create study plans, display tasks, sync events to your
                calendar, and send reminders. We do not sell your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Data Sharing</h2>
              <p>
                We share data only with service providers necessary to run PlanEra
                (such as hosting, email, and calendar APIs).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Your Choices</h2>
              <p>
                You can disconnect calendar sync, delete uploads, or close your account
                by contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Contact</h2>
              <p>
                If you have questions about privacy, contact us at support@planera.app.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 29, 2026</p>

        <div className="space-y-6 text-sm text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Overview</h2>
            <p>
              PlanEra helps users upload syllabi and manage tasks. This policy
              explains what data we collect and how we use it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account information (name, email, profile image).</li>
              <li>Uploaded documents and extracted task data.</li>
              <li>Calendar data needed to create events you request.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">How We Use Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Authenticate you and provide access to your dashboard.</li>
              <li>Extract tasks from uploaded content and show them to you.</li>
              <li>Sync tasks to Google Calendar when you enable it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Sharing</h2>
            <p>
              We do not sell your data. We only share data with service providers
              required to operate the app (e.g., Google Calendar, email delivery).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Retention</h2>
            <p>
              You can delete your uploads and tasks at any time from the app.
              We retain data only as long as your account is active.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              If you have questions, email{" "}
              <a className="text-blue-600 hover:underline" href="mailto:support@ai-planner.app">
                support@ai-planner.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

