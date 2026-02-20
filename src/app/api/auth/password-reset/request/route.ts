import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import {
  createPasswordResetLink,
  passwordResetExpiry,
  sendPasswordResetEmail,
} from "@/lib/email"

function isEmailConfigured(): boolean {
  const apiKey = process.env.RESEND_API_KEY
  const from =
    process.env.RESEND_FROM || process.env.FROM_EMAIL || process.env.EMAIL_FROM
  return Boolean(apiKey && from)
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    )
  }

  const email = typeof body === "object" && body !== null && "email" in body
    ? typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : ""
    : ""

  if (!email) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    )
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error:
          "Password reset emails are not configured. Please contact support or try again later.",
      },
      { status: 503 }
    )
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ ok: true })
    }

    await prisma.passwordResetToken.deleteMany({
      where: { email },
    })

    const token = randomBytes(32).toString("hex")

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires: passwordResetExpiry(),
      },
    })

    try {
      await sendPasswordResetEmail(email, createPasswordResetLink(token, email))
    } catch (emailError) {
      console.error("Password reset email send failed:", emailError)
      return NextResponse.json(
        {
          error:
            "We could not send the reset email. Please try again later or contact support.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Password reset request error:", error)
    const errMessage = error instanceof Error ? error.message : String(error)
    if (
      errMessage.includes("RESEND_API_KEY") ||
      errMessage.includes("Email sender is not configured")
    ) {
      return NextResponse.json(
        {
          error:
            "Password reset emails are not available right now. Please try again later.",
        },
        { status: 503 }
      )
    }
    if (errMessage.includes("PasswordResetToken") || errMessage.includes("prisma") || errMessage.includes("Unknown arg")) {
      console.error("Password reset DB error (run migrations?):", error)
      return NextResponse.json(
        {
          error:
            "Password reset is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { error: "Unable to send password reset email. Please try again later." },
      { status: 500 }
    )
  }
}

