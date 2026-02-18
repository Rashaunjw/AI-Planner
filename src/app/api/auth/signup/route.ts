import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { randomBytes } from "crypto"
import {
  createVerificationLink,
  sendVerificationEmail,
  verificationExpiry,
} from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const firstName =
      typeof body?.firstName === "string" ? body.firstName.trim() : ""
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : ""
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""
    const name = [firstName, lastName].filter(Boolean).join(" ").trim()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "First name, last name, email, and password are required." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account already exists for this email." },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 10)

    await prisma.user.create({
      data: { name, email, passwordHash },
    })

    // User is now created. Wrap all post-creation steps so that a failure here
    // (e.g. missing migration for EmailVerificationToken, email service down)
    // does not surface a 500 "Unable to create account" to the client.
    let emailSent = false
    try {
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

      try {
        await sendVerificationEmail(email, createVerificationLink(token, email))
        emailSent = true
      } catch (emailError) {
        console.error("Signup verification email error:", emailError)
      }
    } catch (tokenError) {
      console.error("Signup verification token error:", tokenError)
    }

    return NextResponse.json({ ok: true, emailSent })
  } catch (error) {
    console.error("Signup error:", error)
    const message =
      error instanceof Error &&
      error.message.includes("User.passwordHash does not exist")
        ? "Database is missing the password column. Please run the latest migrations."
        : "Unable to create your account."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

