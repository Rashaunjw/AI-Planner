"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EmailSignUpForm() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorMessage(null)
        setStatusMessage(null)
        setIsSubmitting(true)

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                }),
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => null)
                throw new Error(payload?.error || "Unable to create your account.")
            }

            setStatusMessage("Account created. Check your email to verify your account.")
        } catch (error) {
            const message = error instanceof Error ? error.message : "Something went wrong."
            setErrorMessage(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input
                type="text"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full name"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
            />
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
                placeholder="Create a password"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                minLength={8}
                required
            />
            <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={!name.trim() || !email.trim() || password.length < 8 || isSubmitting}
            >
                {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
            {statusMessage && (
                <div className="text-sm text-green-700 space-y-1">
                    <p>{statusMessage}</p>
                    <Link
                        href={`/auth/verify?email=${encodeURIComponent(email.trim())}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Resend verification email
                    </Link>
                </div>
            )}
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        </form>
    )
}

