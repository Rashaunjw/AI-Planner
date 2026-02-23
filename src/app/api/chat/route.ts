import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getScheduleContextForChat } from "@/lib/chat-schedule-context"
import { chatWithScheduleAndHistory } from "@/lib/openai"

const MAX_MESSAGES_PER_DAY = 30
const HISTORY_MESSAGES_LIMIT = 10

async function getOrCreateConversation(userId: string) {
  let conv = await prisma.conversation.findUnique({
    where: { userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  })
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { userId },
      include: { messages: true },
    })
  }
  return conv
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    })
    if (user?.plan !== "pro") {
      return NextResponse.json(
        { error: "Schedule chat is a Pro feature. Upgrade to use it.", upgrade: true },
        { status: 403 }
      )
    }

    const conv = await getOrCreateConversation(session.user.id)
    const messages = conv.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }))

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Chat GET error:", error)
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    })
    if (user?.plan !== "pro") {
      return NextResponse.json(
        { error: "Schedule chat is a Pro feature. Upgrade to use it.", upgrade: true },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    const conv = await getOrCreateConversation(session.user.id)

    // Rate limit: count user messages today
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const countToday = await prisma.chatMessage.count({
      where: {
        conversationId: conv.id,
        role: "user",
        createdAt: { gte: startOfToday },
      },
    })
    if (countToday >= MAX_MESSAGES_PER_DAY) {
      return NextResponse.json(
        {
          error: `You've reached the limit of ${MAX_MESSAGES_PER_DAY} messages per day. Try again tomorrow.`,
          rateLimited: true,
        },
        { status: 429 }
      )
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        role: "user",
        content: message,
      },
    })

    const recentMessages = await prisma.chatMessage.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_MESSAGES_LIMIT,
    })
    const history = recentMessages
      .reverse()
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))

    const scheduleContext = await getScheduleContextForChat(session.user.id)
    const reply = await chatWithScheduleAndHistory(scheduleContext, history)

    await prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        role: "assistant",
        content: reply,
      },
    })

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
