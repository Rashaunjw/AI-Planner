import { GraduationCap, Zap, Calendar, CheckCircle, Bell } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import CredentialsSignInForm from "@/components/auth/credentials-signin-form"
import GoogleSignInButton from "@/components/auth/google-signin-button"

const FEATURES = [
  {
    icon: Zap,
    title: "AI parses your syllabus in seconds",
    desc: "Upload a PDF or paste text; every deadline, exam, and assignment gets extracted automatically.",
  },
  {
    icon: Calendar,
    title: "Syncs to your calendar",
    desc: "Connect Google Calendar or subscribe via ICS link for Apple Calendar and Outlook.",
  },
  {
    icon: Bell,
    title: "Deadline reminders before it's too late",
    desc: "Configurable email reminders so high-stakes assignments never sneak up on you.",
  },
  {
    icon: CheckCircle,
    title: "Track progress across every class",
    desc: "See completion rates, grade weight at stake, and what needs attention at a glance.",
  },
]

export default async function SignIn() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex">

      {/* Left panel: feature highlights (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 xl:p-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <GraduationCap className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">PlanEra</span>
        </Link>

        {/* Feature list */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-3">
              Your semester,<br />organized in minutes.
            </h1>
            <p className="text-indigo-300 text-base leading-relaxed max-w-sm">
              Upload any syllabus and PlanEra turns it into a full task list, complete with deadlines, priorities, and grade weights.
            </p>
          </div>

          <ul className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-4">
                <div className="bg-indigo-800 p-2 rounded-lg shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-indigo-300" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{title}</p>
                  <p className="text-indigo-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust signals */}
        <div className="flex items-center gap-6 text-xs text-indigo-400">
          <span>100% free</span>
          <span>·</span>
          <span>No credit card</span>
          <span>·</span>
          <span>Under 60s to set up</span>
        </div>
      </div>

      {/* Right panel: sign-in form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:bg-slate-50 lg:rounded-l-3xl">
        <div className="w-full max-w-md">

          {/* Mobile logo (hidden on desktop) */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <GraduationCap className="h-10 w-10 text-indigo-300" />
              <span className="text-2xl font-bold text-white">PlanEra</span>
            </Link>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
              <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
            </div>

            <CredentialsSignInForm />

            <div className="text-right mt-2">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Forgot password?
              </Link>
            </div>

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
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Sign up for free
                </Link>
              </p>
            </div>
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
