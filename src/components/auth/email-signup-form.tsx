"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EmailSignUpForm() {
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [statusMessage, setStatusMessage] = useState<string | null>(null)
    const router = useRouter()

    const passwordsMatch =
        password.length > 0 && confirmPassword.length > 0 && password === confirmPassword

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setErrorMessage(null)
        setStatusMessage(null)

        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            setErrorMessage("First name, last name, and email are required.")
            return
        }

        if (password.length < 8) {
            setErrorMessage("Password must be at least 8 characters.")
            return
        }

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match.")
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    password,
                }),
            })

            if (!response.ok) {
                const payload = await response.json().catch(() => null)
                throw new Error(payload?.error || "Unable to create your account.")
            }

            const payload = await response.json().catch(() => null)

            let result: Awaited<ReturnType<typeof signIn>> | null = null
            try {
                result = await signIn("credentials", {
                    email: email.trim(),
                    password,
                    callbackUrl: "/",
                    redirect: false,
                })
            } catch {
                // signIn threw; account was created but auto sign-in failed.
                const message =
                    payload?.emailSent === false
                        ? "Account created, but verification email could not be sent. Please sign in."
                        : "Account created. Please sign in to continue."
                setStatusMessage(message)
                return
            }

            if (result?.error) {
                const message =
                    payload?.emailSent === false
                        ? "Account created, but verification email could not be sent. Please sign in."
                        : "Account created. Please sign in to continue."
                setStatusMessage(message)
                return
            }

            router.push("/")
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : "Something went wrong."
            setErrorMessage(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
                <input
                    type="text"
                    name="firstName"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="First name"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                />
                <input
                    type="text"
                    name="lastName"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="Last name"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                />
            </div>
            <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
            />
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    minLength={8}
                    required
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            <div className="relative">
                <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm your password"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    minLength={8}
                    required
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                >
                    {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-sm text-red-600">Passwords do not match.</p>
            )}
            <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
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

