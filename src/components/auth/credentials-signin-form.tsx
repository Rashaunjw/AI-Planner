"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function CredentialsSignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showVerificationLink, setShowVerificationLink] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setShowVerificationLink(false)
    setIsSubmitting(true)

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === "EmailNotVerified") {
          setShowVerificationLink(true)
          throw new Error("Please verify your email before signing in.")
        }
        throw new Error("Invalid email or password.")
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in."
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
      <input
        type="password"
        name="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Your password"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        required
      />
      <Button
        type="submit"
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        disabled={!email.trim() || !password || isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
      {errorMessage && (
        <div className="text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
          <p className="text-red-600">{errorMessage}</p>
          {errorMessage === "Invalid email or password." && (
            <p className="text-red-700/90 text-xs">
              If you signed up with Google, use &quot;Continue with Google&quot; below to sign in.
            </p>
          )}
        </div>
      )}
      {showVerificationLink && (
        <Link
          href={`/auth/verify?email=${encodeURIComponent(email.trim())}`}
          className="block text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Resend verification email
        </Link>
      )}
    </form>
  )
}
