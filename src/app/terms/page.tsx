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

