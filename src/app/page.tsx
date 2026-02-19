import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, FileText, GraduationCap, BookOpen, CheckCircle, Clock, Zap, Shield, Star } from "lucide-react"
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
    <div className="min-h-screen bg-white">
      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="bg-indigo-900 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-300" />
              <span className="text-xl sm:text-2xl font-bold text-white">PlanEra</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/about" className="text-sm text-indigo-200 hover:text-white hidden sm:block">
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
              <Link href="/auth/signup">
                <Button
                  size="sm"
                  className="bg-indigo-500 hover:bg-indigo-400 text-white border-0"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-indigo-950 via-indigo-900 to-indigo-800 pt-20 pb-28 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-700/60 text-indigo-200 rounded-full px-4 py-1.5 text-sm font-medium mb-8 border border-indigo-600">
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            AI-powered • Built for students
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Stop drowning in
            <span className="text-indigo-300"> syllabi.</span>
            <br />
            Start staying ahead.
          </h1>

          <p className="text-lg sm:text-xl text-indigo-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload your syllabus, let AI extract every deadline and assignment, and see your
            entire semester laid out in seconds, not hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-white text-indigo-900 hover:bg-indigo-50 text-base px-8 py-4 font-bold shadow-xl"
              >
                Try PlanEra Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button
                size="lg"
                variant="outline"
                className="border-indigo-400 text-indigo-100 hover:bg-indigo-800 hover:text-white text-base px-8 py-4 bg-transparent"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-indigo-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-green-400" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-blue-400" />
              Your data stays private
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-yellow-400" />
              Setup in under 2 minutes
            </span>
          </div>
        </div>
      </section>

      {/* ── Social Proof Stats Bar ──────────────────────────────── */}
      <section className="bg-indigo-600 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center text-white">
            {[
              { value: "< 60s", label: "To parse a syllabus" },
              { value: "100%", label: "Free to use" },
              { value: "0", label: "Manual data entry" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl sm:text-3xl font-extrabold">{value}</p>
                <p className="text-indigo-200 text-xs sm:text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              PlanEra handles the busywork so you can focus on actually studying.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                iconBg: "bg-indigo-100",
                iconColor: "text-indigo-600",
                title: "AI Syllabus Parsing",
                desc: "Upload a PDF, Word doc, or paste text. Our AI reads it and pulls out every assignment, exam, and due date, even messy, unstructured syllabi.",
                badge: "Core feature",
                badgeColor: "bg-indigo-100 text-indigo-700",
              },
              {
                icon: BookOpen,
                iconBg: "bg-purple-100",
                iconColor: "text-purple-600",
                title: "Smart Task Management",
                desc: "Assignments are grouped by class, color-coded by urgency, and show grade weight so you always know what to tackle first.",
                badge: "Grade-aware",
                badgeColor: "bg-purple-100 text-purple-700",
              },
              {
                icon: Calendar,
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                title: "Visual Calendar",
                desc: "A full month view with every deadline color-coded by class. Click any day to see exactly what's due; no more counting on your fingers.",
                badge: "Visual planning",
                badgeColor: "bg-emerald-100 text-emerald-700",
              },
            ].map(({ icon: Icon, iconBg, iconColor, title, desc, badge, badgeColor }) => (
              <div key={title} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 flex flex-col">
                <div className={`${iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full self-start mb-3 ${badgeColor}`}>
                  {badge}
                </span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed flex-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              From syllabus to schedule in 3 steps
            </h2>
            <p className="text-gray-500">No setup. No configuration. Just upload and go.</p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[calc(16.666%+1.5rem)] right-[calc(16.666%+1.5rem)] h-0.5 bg-indigo-100" />

            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                {
                  step: "01",
                  title: "Upload",
                  desc: "Drop in your syllabus PDF or paste the text from your course page. Any format works.",
                  icon: FileText,
                },
                {
                  step: "02",
                  title: "AI Extracts",
                  desc: "Our AI reads every line and pulls out assignments, exams, projects, and their deadlines.",
                  icon: Zap,
                },
                {
                  step: "03",
                  title: "Stay Ahead",
                  desc: "Review your tasks, mark things done, and never wonder what's due next; your dashboard shows everything.",
                  icon: CheckCircle,
                },
              ].map(({ step, title, desc, icon: Icon }) => (
                <div key={step} className="text-center relative">
                  <div className="bg-indigo-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 block">
                    Step {step}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials / Highlights ───────────────────────────── */}
      <section className="py-20 px-4 bg-indigo-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-3xl font-bold text-gray-900 mb-12">
            Built for real student life
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I uploaded 5 syllabi in one sitting. PlanEra extracted every deadline and I could finally see my whole semester in one place.",
                name: "Computer Science student",
                stars: 5,
              },
              {
                quote: "The urgency tinting on the tasks page is clutch: red means danger, I get it immediately. Helped me catch a 20% exam I'd forgotten about.",
                name: "Biology major",
                stars: 5,
              },
              {
                quote: "I love that it shows grade weight next to each assignment. Now I actually prioritize based on what matters for my GPA.",
                name: "Engineering student",
                stars: 5,
              },
            ].map(({ quote, name, stars }) => (
              <div key={name} className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 italic">&ldquo;{quote}&rdquo;</p>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="bg-indigo-900 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <GraduationCap className="h-10 w-10 text-indigo-300 mx-auto mb-5" />
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start your semester on the right foot.
          </h2>
          <p className="text-indigo-300 mb-8 text-lg">
            Upload your first syllabus in under a minute, completely free.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-base px-10 py-4 shadow-xl">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-indigo-400 text-sm">No credit card · No setup · Just upload</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="bg-indigo-950 text-white py-10">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <GraduationCap className="h-5 w-5 text-indigo-400" />
            <span className="text-lg font-bold">PlanEra</span>
          </div>
          <p className="text-indigo-400 text-sm">AI-powered study planning for students</p>
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
