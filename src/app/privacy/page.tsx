import { GraduationCap } from "lucide-react"
import Link from "next/link"

export const metadata = {
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-indigo-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-white" />
              <span className="text-white font-bold text-lg">PlanEra</span>
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link href="/" className="text-indigo-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-indigo-300 hover:text-white transition-colors">
                About
              </Link>
              <Link
                href="/auth/signin"
                className="bg-white text-indigo-900 font-semibold px-4 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-indigo-900 text-white py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-indigo-300 text-sm font-medium uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-indigo-300 text-sm">Last updated: Feb 17, 2026</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
          <div className="space-y-8 text-gray-700">

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Overview
              </h2>
              <p className="text-sm leading-relaxed">
                PlanEra helps students organize coursework by turning documents into tasks
                and syncing schedules to calendars. This policy explains what data we
                collect and how we use it.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Information We Collect
              </h2>
              <ul className="text-sm leading-relaxed space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Account details such as your name and email address.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Uploaded documents and the task data extracted from them by AI.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Calendar sync tokens when you connect Google Calendar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Notification preferences you configure in Settings.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                How We Use Information
              </h2>
              <p className="text-sm leading-relaxed">
                We use your data to create study plans, display and manage tasks, sync
                events to your calendar, and send reminders. We do not sell your data to
                third parties, ever.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Data Sharing
              </h2>
              <p className="text-sm leading-relaxed">
                We share data only with service providers that are necessary to run PlanEra
                (such as hosting, email delivery, AI APIs, and calendar APIs). All providers
                are contractually obligated to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Data Protection
              </h2>
              <p className="text-sm leading-relaxed mb-3">
                We protect sensitive data using industry-standard safeguards, including
                encryption in transit (TLS) and access controls that limit data access to
                authorized personnel and services only. Tokens used for Google Calendar
                sync are stored securely and can be revoked at any time by disconnecting
                your calendar.
              </p>
              <p className="text-sm leading-relaxed">
                We retain data only as long as needed to provide the service or as required
                by law. You can request deletion of your account and all associated data by
                contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Your Choices
              </h2>
              <p className="text-sm leading-relaxed">
                You can disconnect calendar sync, delete uploads, clear all activity, or
                close your account from the Settings page. For account deletion, contact
                support and we will process your request promptly.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Contact
              </h2>
              <p className="text-sm leading-relaxed">
                If you have questions about this privacy policy, email us at{" "}
                <a href="mailto:support@planera.app" className="text-indigo-600 hover:underline font-medium">
                  support@planera.app
                </a>
                .
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link href="/" className="hover:text-gray-600 transition-colors">Back to Home</Link>
        </div>
      </main>
    </div>
  )
}
