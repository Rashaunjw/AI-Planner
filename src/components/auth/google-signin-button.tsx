"use client"

import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

export default function GoogleSignInButton() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  return (
    <button
      type="button"
      className="w-full inline-flex items-center justify-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      onClick={() =>
        signIn("google", {
          callbackUrl,
          prompt: "consent",
          access_type: "offline",
        })
      }
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.8-5.4 3.8-3.2 0-5.8-2.6-5.8-5.8S8.8 6.3 12 6.3c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 3.9 14.6 3 12 3 7.6 3 4 6.6 4 11s3.6 8 8 8c4.6 0 7.7-3.2 7.7-7.7 0-.5-.1-.9-.2-1.1z"
        />
        <path
          fill="#34A853"
          d="M12 19c2.7 0 5-1 6.6-2.8l-2.7-2.1c-.7.5-1.7.9-3.9.9-3.2 0-5.8-2.6-5.8-5.8 0-.6.1-1.2.3-1.7l-2.8-2.2C3.2 6.3 3 7.1 3 8.1 3 12.4 6.6 16 12 16z"
        />
        <path
          fill="#FBBC05"
          d="M6.5 9.2c-.2.5-.3 1.1-.3 1.7 0 .6.1 1.2.3 1.7l2.8-2.2z"
        />
        <path
          fill="#4285F4"
          d="M20.2 12.3c0-.5-.1-.9-.2-1.3H12v2.5h4.6c-.2 1-.9 2-2 2.7l2.7 2.1c1.6-1.5 2.9-3.8 2.9-6z"
        />
      </svg>
      Continue with Google
    </button>
  )
}

