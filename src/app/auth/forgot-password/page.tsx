"use client"

import { useState } from "react"
import Link from "next/link"
import { GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Unable to send reset email.")
      }

      setMessage("If an account exists for that email, a reset link has been sent.")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send reset email."
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <GraduationCap className="h-10 w-10 text-indigo-300" />
            <span className="text-2xl font-bold text-white">PlanEra</span>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h1>
            <p className="text-gray-500 text-sm">
              Enter your email address and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              required
            />
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!email.trim() || isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>

          {message && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-4">
              {message}
            </p>
          )}
          {errorMessage && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-4">
              {errorMessage}
            </p>
          )}

          <div className="text-center mt-6">
            <Link href="/auth/signin" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Back to sign in
            </Link>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-indigo-300 hover:text-white text-sm font-medium transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
