import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type StudyPlanPreferencesPayload = {
  whenStudying: string
  focusMinutes: string
  startsBefore: string
  commonObstacle: string
  blockPreference: string
  weeklyStudyHours: string
}

const VALID_KEYS: (keyof StudyPlanPreferencesPayload)[] = [
  "whenStudying",
  "focusMinutes",
  "startsBefore",
  "commonObstacle",
  "blockPreference",
  "weeklyStudyHours",
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prefs = await prisma.studyPlanPreferences.findUnique({
    where: { userId: session.user.id },
  })

  if (!prefs) {
    return NextResponse.json({ preferences: null })
  }

  return NextResponse.json({
    preferences: {
      whenStudying: prefs.whenStudying,
      focusMinutes: prefs.focusMinutes,
      startsBefore: prefs.startsBefore,
      commonObstacle: prefs.commonObstacle,
      blockPreference: prefs.blockPreference,
      weeklyStudyHours: prefs.weeklyStudyHours,
    },
  })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const data: StudyPlanPreferencesPayload = {} as StudyPlanPreferencesPayload
  for (const key of VALID_KEYS) {
    const v = body[key]
    if (typeof v === "string" && v.trim()) {
      data[key] = v.trim()
    }
  }

  if (Object.keys(data).length !== VALID_KEYS.length) {
    return NextResponse.json(
      { error: "Missing one or more preference fields" },
      { status: 400 }
    )
  }

  await prisma.studyPlanPreferences.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      whenStudying: data.whenStudying,
      focusMinutes: data.focusMinutes,
      startsBefore: data.startsBefore,
      commonObstacle: data.commonObstacle,
      blockPreference: data.blockPreference,
      weeklyStudyHours: data.weeklyStudyHours,
    },
    update: {
      whenStudying: data.whenStudying,
      focusMinutes: data.focusMinutes,
      startsBefore: data.startsBefore,
      commonObstacle: data.commonObstacle,
      blockPreference: data.blockPreference,
      weeklyStudyHours: data.weeklyStudyHours,
    },
  })

  return NextResponse.json({ ok: true })
}
