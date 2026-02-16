import { NextResponse } from "next/server"
import { createRemoteJWKSet, jwtVerify } from "jose"

const jwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"))

export async function POST(request: Request) {
  const audience = process.env.GOOGLE_CLIENT_ID
  if (!audience) {
    console.error("CAP webhook missing GOOGLE_CLIENT_ID")
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
  }

  const token = (await request.text()).trim()
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 })
  }

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: "https://accounts.google.com",
      audience,
    })

    const events =
      typeof payload.events === "object" && payload.events !== null ? payload.events : {}
    const eventTypes = Object.keys(events)
    const subject = payload.sub

    console.info("CAP event received", {
      eventTypes,
      subject,
      issuedAt: payload.iat,
    })

    // TODO: revoke tokens / lock sessions for affected users.
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("CAP token verification failed", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}

