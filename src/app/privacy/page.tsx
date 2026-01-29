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
              AI Planner helps users upload syllabi and manage tasks. This policy
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

