import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { endpoint: string; keys: { p256dh: string; auth: string } }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { endpoint, keys } = body
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: "Missing endpoint or keys.p256dh or keys.auth" },
      { status: 400 }
    )
  }

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: { userId: session.user.id, endpoint },
    },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    update: { p256dh: keys.p256dh, auth: keys.auth },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { endpoint?: string }
  try {
    body = request.headers.get("content-type")?.includes("application/json")
      ? await request.json()
      : {}
  } catch {
    body = {}
  }

  if (body.endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint: body.endpoint,
      },
    })
  } else {
    await prisma.pushSubscription.deleteMany({
      where: { userId: session.user.id },
    })
  }

  return NextResponse.json({ ok: true })
}
