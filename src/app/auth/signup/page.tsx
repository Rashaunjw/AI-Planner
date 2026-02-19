import { GraduationCap, Upload, Brain, BarChart2, Clock } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import EmailSignUpForm from "@/components/auth/email-signup-form"
import GoogleSignInButton from "@/components/auth/google-signin-button"

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload a syllabus",
    desc: "PDF, image, or plain text; any format works.",
  },
  {
    icon: Brain,
    step: "02",
    title: "AI extracts everything",
    desc: "Assignments, exams, projects, and due dates, all in one place.",
  },
  {
    icon: BarChart2,
    step: "03",
    title: "Stay on top of it all",
    desc: "Dashboard, calendar view, reminders, and grade tracking.",
  },
]

export default async function SignUp() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex">

      {/* Left panel: how it works (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 xl:p-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <GraduationCap className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">PlanEra</span>
        </Link>

        {/* Content */}
        <div className="space-y-10">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3">
              Stop copying deadlines<br />into your planner.
            </h1>
            <p className="text-indigo-300 text-base leading-relaxed max-w-sm">
              PlanEra reads your syllabi so you don&apos;t have to. Get your whole semester organized in under a minute.
            </p>
          </div>

          {/* How it works steps */}
          <div className="space-y-6">
            <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest">How it works</p>
            {STEPS.map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="bg-indigo-800 p-2.5 rounded-xl">
                    <Icon className="h-4 w-4 text-indigo-300" />
                  </div>
                  <span className="text-indigo-700 text-xs font-mono font-bold">{step}</span>
                </div>
                <div className="pt-1">
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-indigo-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time to value */}
        <div className="flex items-center gap-2 text-indigo-400 text-xs">
          <Clock className="h-3.5 w-3.5" />
          <span>Most students are fully set up in under 60 seconds.</span>
        </div>
      </div>

      {/* Right panel: sign-up form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:bg-slate-50 lg:rounded-l-3xl">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <GraduationCap className="h-10 w-10 text-indigo-300" />
              <span className="text-2xl font-bold text-white">PlanEra</span>
            </Link>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-gray-500 text-sm">Free forever. No credit card required.</p>
            </div>

            <EmailSignUpForm />

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-400 uppercase tracking-wider">or</span>
              </div>
            </div>

            <GoogleSignInButton />

            <div className="mt-5 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Sign in
                </Link>
              </p>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              By signing up you agree to our{" "}
              <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
            </p>
          </div>

          {/* Back to home */}
          <div className="text-center mt-5">
            <Link href="/" className="text-indigo-300 hover:text-white text-sm font-medium transition-colors lg:text-gray-400 lg:hover:text-gray-700">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
