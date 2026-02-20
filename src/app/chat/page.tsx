"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Send, Loader2, GraduationCap } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AppNav from "@/components/app-nav"
import LoadingScreen from "@/components/loading-screen"

type Message = { role: "user" | "assistant"; content: string }

export default function ChatPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/auth/signin")
    }
  }, [router, session, status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setSending(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data?.error ?? "Something went wrong. Please try again.",
          },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? "No response." },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Could not reach the server. Please try again." },
      ])
    } finally {
      setSending(false)
    }
  }

  if (status === "loading") {
    return <LoadingScreen message="Loading..." />
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      <AppNav />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
            <p className="text-sm text-gray-500">
              Ask about your schedule, due dates, and assignments.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden flex flex-col min-h-[420px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[320px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <GraduationCap className="h-12 w-12 text-indigo-200 mb-3" />
                <p className="text-sm font-medium text-gray-600">
                  Ask me anything about your schedule
                </p>
                <p className="text-xs mt-1 max-w-xs">
                  e.g. &ldquo;When is my bio midterm?&rdquo; or &ldquo;What&apos;s due this week?&rdquo;
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your schedule..."
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
