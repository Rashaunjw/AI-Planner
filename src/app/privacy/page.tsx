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
          <p className="text-sm text-gray-500 mb-8">Last updated: Feb 17, 2026</p>

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
              <h2 className="text-xl font-semibold mb-2">Data Protection</h2>
              <p>
                We protect sensitive data using industry-standard safeguards,
                including encryption in transit (TLS) and access controls that
                limit data access to authorized personnel and services only. Tokens
                used for Google Calendar sync are stored securely and can be revoked
                at any time by disconnecting your calendar. We minimize access to
                data and follow least-privilege principles for internal services.
              </p>
              <p>
                We retain data only as long as needed to provide the service or as
                required by law. You can request deletion of your account and data
                by contacting support.
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
