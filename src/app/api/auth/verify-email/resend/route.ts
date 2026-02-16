import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import {
  createVerificationLink,
  sendVerificationEmail,
  verificationExpiry,
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
      select: { emailVerified: true },
    })

    if (!user) {
      return NextResponse.json({ ok: true })
    }

    if (user.emailVerified) {
      return NextResponse.json({ ok: true })
    }

    await prisma.emailVerificationToken.deleteMany({
      where: { email },
    })

    const token = randomBytes(32).toString("hex")

    await prisma.emailVerificationToken.create({
      data: {
        email,
        token,
        expires: verificationExpiry(),
      },
    })

    await sendVerificationEmail(email, createVerificationLink(token, email))

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to resend verification email." },
      { status: 500 }
    )
  }
}

