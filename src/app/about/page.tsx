import { GraduationCap, FileText, BookOpen, Calendar, Zap, Heart, ArrowRight, CheckCircle, Users, Clock, LayoutList } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Navigation — matches landing page exactly ──────────── */}
      <nav className="bg-indigo-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-300" />
              <span className="text-xl sm:text-2xl font-bold text-white">PlanEra</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-indigo-200 hover:text-white hidden sm:block">
                Home
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
              <Link href="/auth/signup">
                <Button size="sm" className="bg-indigo-500 hover:bg-indigo-400 text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-800 pt-20 pb-24 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-700/60 text-indigo-200 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-indigo-600">
            <Heart className="h-3.5 w-3.5 text-rose-400" />
            Built by a student, for students
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            About PlanEra
          </h1>
          <p className="text-lg sm:text-xl text-indigo-200 leading-relaxed max-w-2xl mx-auto">
            PlanEra started as a simple question: <em>&ldquo;Why does managing coursework
            still require so much manual work?&rdquo;</em> We built the answer.
          </p>
        </div>
      </section>

      {/* ── Mission ────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 block">
                Our Mission
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-5">
                Make semester planning take minutes, not hours.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-4">
                Every semester, students spend hours manually copying deadlines from syllabi into
                calendars, notebooks, and to-do apps. Assignments get missed. Priorities get muddled.
                Stress builds up when it doesn&apos;t have to.
              </p>
              <p className="text-gray-500 leading-relaxed">
                PlanEra uses AI to do the reading for you. Upload your syllabus in any format —
                PDF, Word doc, or plain text — and in under a minute you have every assignment,
                exam, and deadline organized, prioritized, and ready to review.
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  icon: CheckCircle,
                  color: "text-green-500",
                  bg: "bg-green-50",
                  title: "No more manual copying",
                  desc: "AI reads your syllabus so you don't have to transcribe anything.",
                },
                {
                  icon: CheckCircle,
                  color: "text-blue-500",
                  bg: "bg-blue-50",
                  title: "Grade-aware prioritization",
                  desc: "See exactly what's worth the most points and when it's due.",
                },
                {
                  icon: CheckCircle,
                  color: "text-purple-500",
                  bg: "bg-purple-50",
                  title: "Every class in one place",
                  desc: "All your classes, deadlines, and progress tracked together.",
                },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className={`flex items-start gap-4 p-4 rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{title}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── What PlanEra Does ───────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What PlanEra actually does</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Not magic — just smart automation applied to the most tedious parts of student life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                iconBg: "bg-indigo-100",
                iconColor: "text-indigo-600",
                title: "Syllabus Parsing",
                points: [
                  "Upload PDF, Word doc, or paste text",
                  "AI extracts assignments, exams, and due dates",
                  "Detects class name and grade weights automatically",
                  "Works on messy, unstructured syllabi",
                ],
              },
              {
                icon: BookOpen,
                iconBg: "bg-purple-100",
                iconColor: "text-purple-600",
                title: "Task Management",
                points: [
                  "Assignments grouped and color-coded by class",
                  "Urgency tinting — red means act now",
                  "Grade weight shown next to each task",
                  "Filter by class, status, or search by name",
                ],
              },
              {
                icon: Calendar,
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                title: "Calendar & Reminders",
                points: [
                  "Visual month calendar with class color-coding",
                  "Google Calendar sync built in",
                  "Email reminders before deadlines",
                  "ICS feed for Apple Calendar & Outlook",
                ],
              },
            ].map(({ icon: Icon, iconBg, iconColor, title, points }) => (
              <div key={title} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
                <ul className="space-y-2">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-gray-500">
                      <span className="text-indigo-400 font-bold mt-0.5">·</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ───────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Who PlanEra is for</h2>
            <p className="text-gray-500">If any of these sound familiar, PlanEra was built for you.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: BookOpen,
                title: "Heavy course loads",
                desc: "Taking 4–5 classes with syllabi that look like legal documents. PlanEra reads them all.",
              },
              {
                icon: Users,
                title: "Student athletes & Greek life",
                desc: "Your time is split between practice, events, and classes. PlanEra keeps academics from falling through the cracks.",
              },
              {
                icon: Clock,
                title: "Chronic deadline-missers",
                desc: "Not because you don't care — because nothing surfaced what was actually urgent. The dashboard fixes that.",
              },
              {
                icon: LayoutList,
                title: "Organized students who want to stay that way",
                desc: "You already use a planner. PlanEra automates the part that takes 30 minutes every semester start.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 bg-gray-50">
                <div className="bg-indigo-100 p-2 rounded-lg shrink-0">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built with / Tech transparency ─────────────────────── */}
      <section className="py-16 px-4 bg-indigo-50 border-y border-indigo-100">
        <div className="max-w-3xl mx-auto text-center">
          <Zap className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">How it&apos;s built</h2>
          <p className="text-gray-500 mb-6 leading-relaxed">
            PlanEra is built on <strong>Next.js</strong> with a <strong>PostgreSQL</strong> database,
            uses <strong>OpenAI</strong> for syllabus parsing, and <strong>Resend</strong> for email reminders.
            Calendar sync runs via the <strong>Google Calendar API</strong>. Everything is hosted on <strong>Vercel</strong>.
          </p>
          <p className="text-sm text-gray-400">
            Your data is never sold or used to train AI models. Uploads are processed and stored securely.
          </p>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="bg-indigo-900 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <GraduationCap className="h-10 w-10 text-indigo-300 mx-auto mb-5" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to actually stay on top of your semester?
          </h2>
          <p className="text-indigo-300 mb-8 text-lg">
            Free to use. Upload your first syllabus in under a minute.
          </p>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-base px-10 py-4 shadow-xl"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer — matches landing page ──────────────────────── */}
      <footer className="bg-indigo-950 text-white py-10">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <GraduationCap className="h-5 w-5 text-indigo-400" />
            <span className="text-lg font-bold">PlanEra</span>
          </div>
          <p className="text-indigo-400 text-sm">AI-powered study planning for students</p>
          <div className="mt-4 flex items-center justify-center gap-5 text-sm text-indigo-400">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
