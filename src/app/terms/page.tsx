import { Brain } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
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
          <Link href="/privacy" className="text-gray-700 hover:text-gray-900">
            Privacy
          </Link>
          <Link href="/auth/signin" className="text-gray-700 hover:text-gray-900">
            Sign In
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: Feb 13, 2026</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-2">Acceptance of Terms</h2>
              <p>
                By using PlanEra, you agree to these Terms of Service. If you do not agree,
                please do not use the app.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Use of the Service</h2>
              <p>
                PlanEra provides tools to organize study tasks and calendars. You are
                responsible for the accuracy of information you upload and for maintaining
                your account security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Third-Party Services</h2>
              <p>
                PlanEra integrates with third-party services such as Google Calendar. Your
                use of those services is subject to their own terms and policies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Termination</h2>
              <p>
                We may suspend or terminate access if you violate these terms or misuse the
                service. You may stop using the service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of PlanEra after
                changes means you accept the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-2">Contact</h2>
              <p>
                If you have questions about these terms, contact us at support@planera.app.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
import Link from "next/link"

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 29, 2026</p>

        <div className="space-y-6 text-sm text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Acceptance</h2>
            <p>
              By using PlanEra, you agree to these Terms. If you do not agree,
              do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Use of the Service</h2>
            <p>
              You are responsible for the content you upload and for keeping your
              account secure. You may not use the service for unlawful purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Third-Party Services</h2>
            <p>
              The app integrates with third-party services (e.g., Google Calendar).
              Your use of those services is subject to their terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Availability</h2>
            <p>
              We may update or discontinue the service at any time. We do not
              guarantee uninterrupted availability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contact</h2>
            <p>
              Questions? Email{" "}
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

