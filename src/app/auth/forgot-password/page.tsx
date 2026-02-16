"use client"

import { useState } from "react"
import Link from "next/link"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-gray-600">Enter your email to receive a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={!email.trim() || isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>

        {message && <p className="text-sm text-green-700 mt-4">{message}</p>}
        {errorMessage && <p className="text-sm text-red-600 mt-4">{errorMessage}</p>}

        <div className="text-center mt-6">
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

