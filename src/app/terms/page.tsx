import { GraduationCap } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
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
              <Link href="/privacy" className="text-indigo-300 hover:text-white transition-colors">
                Privacy
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-indigo-300 text-sm">Last updated: Feb 13, 2026</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-10">
          <div className="space-y-8 text-gray-700">

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Acceptance of Terms
              </h2>
              <p className="text-sm leading-relaxed">
                By using PlanEra, you agree to these Terms of Service. If you do not agree,
                please do not use the app. We may update these terms periodically; continued
                use after changes means you accept the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Use of the Service
              </h2>
              <p className="text-sm leading-relaxed">
                PlanEra provides tools to organize academic tasks and sync schedules to
                calendars. You are responsible for the accuracy of information you upload
                and for maintaining the security of your account credentials.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Acceptable Use
              </h2>
              <ul className="text-sm leading-relaxed space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Use PlanEra only for lawful purposes and in accordance with these terms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Do not attempt to reverse-engineer, disrupt, or abuse the service.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Do not upload content that infringes on copyrights or violates any law.</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                AI-Generated Content
              </h2>
              <p className="text-sm leading-relaxed">
                PlanEra uses AI to extract tasks from uploaded documents and generate study
                plans. AI output may be imperfect. You are responsible for verifying that
                extracted tasks and dates match your original source materials. PlanEra is
                not liable for errors in AI-generated content.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Third-Party Services
              </h2>
              <p className="text-sm leading-relaxed">
                PlanEra integrates with third-party services such as Google Calendar and
                OpenAI. Your use of those services is subject to their own terms and
                policies. We are not responsible for third-party service availability or
                changes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Termination
              </h2>
              <p className="text-sm leading-relaxed">
                We may suspend or terminate access if you violate these terms or misuse the
                service. You may stop using the service at any time and request account
                deletion by contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Disclaimer of Warranties
              </h2>
              <p className="text-sm leading-relaxed">
                PlanEra is provided &ldquo;as is&rdquo; without warranties of any kind. We do not
                guarantee uninterrupted availability or the accuracy of AI-extracted
                content. Use the service at your own discretion.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                Contact
              </h2>
              <p className="text-sm leading-relaxed">
                If you have questions about these terms, email us at{" "}
                <a href="mailto:support@planera.app" className="text-indigo-600 hover:underline font-medium">
                  support@planera.app
                </a>
                .
              </p>
            </section>

          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/" className="hover:text-gray-600 transition-colors">Back to Home</Link>
        </div>
      </main>
    </div>
  )
}
