import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Redeem a beta/trial Pro code. Set BETA_PRO_CODE in env; users who enter the
 * matching code get their plan set to "pro" (for MVP/test trials).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const betaCode = process.env.BETA_PRO_CODE?.trim()
  if (!betaCode) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  let body: { code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const code = typeof body.code === "string" ? body.code.trim() : ""
  if (!code || code.toLowerCase() !== betaCode.toLowerCase()) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { plan: "pro" },
  })

  return NextResponse.json({ ok: true, plan: "pro" })
}
