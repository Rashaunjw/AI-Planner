import { GraduationCap, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex flex-col items-center justify-center p-6 text-center">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-12">
        <GraduationCap className="h-8 w-8 text-white" />
        <span className="text-xl font-bold text-white">PlanEra</span>
      </Link>

      {/* Error code */}
      <div className="relative mb-6">
        <p className="text-[8rem] sm:text-[10rem] font-black text-indigo-800 leading-none select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <Search className="h-14 w-14 text-indigo-400" />
        </div>
      </div>

      {/* Message */}
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
        Page not found
      </h1>
      <p className="text-indigo-300 text-base max-w-sm leading-relaxed mb-10">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        Head back and pick up where you left off.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-white text-indigo-900 font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-indigo-300 hover:text-white font-medium px-6 py-2.5 rounded-xl border border-indigo-700 hover:border-indigo-500 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  )
}

