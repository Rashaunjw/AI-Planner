import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import {
  createPasswordResetLink,
  passwordResetExpiry,
  sendPasswordResetEmail,
} from "@/lib/email"

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
    const message =
      error instanceof Error &&
      (error.message.includes("RESEND_API_KEY") ||
        error.message.includes("Email sender is not configured."))
        ? "Email service is not configured."
        : "Unable to send password reset email."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

