import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import EmailSignInForm from "@/components/auth/email-signin-form"
import GoogleSignInButton from "@/components/auth/google-signin-button"

export default async function SignIn() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AI Planner</span>
          </Link>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to your account to continue</p>
          </div>

          <EmailSignInForm />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <GoogleSignInButton />

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Use email to sign in without Google. You can still use Google if you prefer.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
