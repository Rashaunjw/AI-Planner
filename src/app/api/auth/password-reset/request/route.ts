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
  try {
    const body = await request.json()
    const email = typeof body?.email === "string" ? body.email.trim() : ""

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

    await sendPasswordResetEmail(email, createPasswordResetLink(token, email))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Password reset request error:", error)
    const errMessage = error instanceof Error ? error.message : ""
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
    return NextResponse.json(
      { error: "Unable to send password reset email. Please try again later." },
      { status: 500 }
    )
  }
}

