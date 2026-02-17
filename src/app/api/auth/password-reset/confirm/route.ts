import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const token = typeof body?.token === "string" ? body.token.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: "Email, token, and password are required." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    const record = await prisma.passwordResetToken.findFirst({
      where: { email, token },
    })

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or expired." },
        { status: 400 }
      )
    }

    const passwordHash = await hash(password, 10)

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    })

    await prisma.passwordResetToken.delete({
      where: { id: record.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Password reset confirm error:", error)
    return NextResponse.json(
      { error: "Unable to reset password." },
      { status: 500 }
    )
  }
}

