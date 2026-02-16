"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""
  const initialEmail = searchParams.get("email") || ""
  const [email, setEmail] = useState(initialEmail)
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : "idle"
  )
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const verify = async () => {
      if (!token || !email) {
        setStatus("idle")
        return
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.error || "Verification failed.")
        }

        setStatus("success")
        setMessage("Your email is verified. You can sign in now.")
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Verification failed."
        setStatus("error")
        setMessage(errorMessage)
      }
    }

    verify()
  }, [token, email])

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    try {
      const response = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Unable to resend email.")
      }

      setMessage("Verification email sent. Check your inbox.")
      setStatus("success")
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to resend email."
      setStatus("error")
      setMessage(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
          <p className="text-gray-600">
            {token
              ? "Verifying your link..."
              : "Enter your email to resend a verification link."}
          </p>
        </div>

        {message && (
          <p
            className={`text-sm ${
              status === "success" ? "text-green-700" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleResend} className="space-y-3 mt-4">
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
            {isSubmitting ? "Sending..." : "Resend verification email"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

