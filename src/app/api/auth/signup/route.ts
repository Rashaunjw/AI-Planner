import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const email = typeof body?.email === "string" ? body.email.trim() : ""

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true },
    })

    if (existingUser) {
      if (!existingUser.name) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { name },
        })
      }
      return NextResponse.json({ ok: true })
    }

    await prisma.user.create({
      data: { name, email },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to create your account." },
      { status: 500 }
    )
  }
}

