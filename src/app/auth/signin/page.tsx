import { GraduationCap } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import CredentialsSignInForm from "@/components/auth/credentials-signin-form"
import GoogleSignInButton from "@/components/auth/google-signin-button"

export default async function SignIn() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <GraduationCap className="h-10 w-10 text-indigo-300" />
            <span className="text-2xl font-bold text-white">PlanEra</span>
          </Link>
          <p className="text-indigo-300 text-sm mt-2">Your academic planning companion</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h1>
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
              <div className="w-full border-t border-gray-200"></div>
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

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-indigo-300 hover:text-white text-sm font-medium transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
