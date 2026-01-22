"use client"

import { useEffect, useState } from "react"
import { getCsrfToken } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function EmailSignInForm() {
  const [email, setEmail] = useState("")
  const [csrfToken, setCsrfToken] = useState<string | undefined>()

  useEffect(() => {
    getCsrfToken().then((token) => setCsrfToken(token || undefined))
  }, [])

  return (
    <form action="/api/auth/signin/email" method="post" className="space-y-3">
      {csrfToken && <input type="hidden" name="csrfToken" value={csrfToken} />}
      <input type="hidden" name="callbackUrl" value="/dashboard" />
      <input
        type="email"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        required
      />
      <Button type="submit" variant="outline" className="w-full" disabled={!email}>
        Email me a sign-in link
      </Button>
    </form>
  )
}

