import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body?.email === "string" ? body.email.trim() : ""
    const token = typeof body?.token === "string" ? body.token.trim() : ""

    if (!email || !token) {
      return NextResponse.json(
        { error: "Email and token are required." },
        { status: 400 }
      )
    }

    const record = await prisma.emailVerificationToken.findFirst({
      where: { email, token },
    })

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "This verification link is invalid or expired." },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    })

    await prisma.emailVerificationToken.delete({
      where: { id: record.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Verify email error:", error)
    return NextResponse.json(
      { error: "Unable to verify email." },
      { status: 500 }
    )
  }
}

