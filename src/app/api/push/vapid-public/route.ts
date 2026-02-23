import { NextResponse } from "next/server"
import { getVapidPublicKey } from "@/lib/push"

export async function GET() {
  try {
    const publicKey = getVapidPublicKey()
    return NextResponse.json({ publicKey })
  } catch {
    return NextResponse.json(
      { error: "Push notifications are not configured" },
      { status: 503 }
    )
  }
}
