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
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        required
      />
      <input
        type="password"
        name="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Your password"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        required
      />
      <Button
        type="submit"
        variant="outline"
        className="w-full"
        disabled={!email.trim() || !password || isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      {showVerificationLink && (
        <Link
          href={`/auth/verify?email=${encodeURIComponent(email.trim())}`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Resend verification email
        </Link>
      )}
    </form>
  )
}

