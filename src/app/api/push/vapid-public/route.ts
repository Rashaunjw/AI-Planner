import { NextResponse } from "next/server"
import { getVapidPublicKey } from "@/lib/push"

export async function GET() {
  try {
    const publicKey = getVapidPublicKey()
    return NextResponse.json({ publicKey })
  } catch (err) {
    console.error("[push/vapid-public]", err)
    return NextResponse.json(
      { error: "Push notifications are not configured" },
      { status: 503 }
    )
  }
}
