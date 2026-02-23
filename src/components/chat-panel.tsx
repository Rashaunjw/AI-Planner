"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Send, Loader2, GraduationCap, X, Sparkles } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useChatPanel } from "@/components/chat-panel-context"
import { Button } from "@/components/ui/button"

type Message = { role: "user" | "assistant"; content: string }

export function ChatPanel() {
  const { isOpen, closeChat } = useChatPanel()
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [hasFetched, setHasFetched] = useState(false)
  const [proRequired, setProRequired] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load history once when authenticated (messages persist when panel is closed)
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id || hasFetched) return
    setHasFetched(true)
    setLoadingHistory(true)
    setProRequired(false)
    fetch("/api/chat")
      .then((res) => {
        if (res.status === 403) return res.json().then((d) => ({ upgrade: d?.upgrade }))
        return res.ok ? res.json() : { messages: [] }
      })
      .then((data) => {
        if (data?.upgrade) {
          setProRequired(true)
          return
        }
        if (Array.isArray(data?.messages)) {
          setMessages(
            data.messages.map((m: Message) => ({
              role: m.role,
              content: m.content,
            }))
          )
        }
      })
      .finally(() => setLoadingHistory(false))
  }, [status, session?.user?.id, hasFetched])

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [isOpen, messages])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    if (status !== "authenticated" || !session) return

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
        if (res.status === 403 && data?.upgrade) {
          setProRequired(true)
          return
        }
        const errorMsg =
          data?.rateLimited === true
            ? data?.error ?? "Message limit reached for today. Try again tomorrow."
            : data?.error ?? "Something went wrong. Please try again."
        setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }])
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

  const showPanel = isOpen

  return (
    <>
      {/* Backdrop when open (mobile-friendly) */}
      {showPanel && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:bg-transparent"
          aria-hidden
          onClick={closeChat}
        />
      )}

      {/* Panel: fixed right, slide in. Always mounted so messages persist when closed. */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-xl border-l border-gray-200 flex flex-col transition-transform duration-300 ease-out ${
          showPanel ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Chat"
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 bg-indigo-50">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">Chat</span>
          </div>
          <button
            type="button"
            onClick={closeChat}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {status !== "authenticated" ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-gray-500 text-sm">
              Sign in to use chat.
            </div>
          ) : proRequired ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <Sparkles className="h-12 w-12 text-indigo-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">Schedule chat is a Pro feature</p>
              <p className="text-xs text-gray-500 mb-4 max-w-xs">
                Ask about your schedule, due dates, and assignments with AI. Upgrade to Pro to use it.
              </p>
              <Link href="/pricing" onClick={closeChat}>
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  View Pro plan
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {loadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-2" />
                    <p className="text-sm">Loading...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                    <GraduationCap className="h-10 w-10 text-indigo-200 mb-2" />
                    <p className="text-sm font-medium text-gray-600">
                      Ask about your schedule
                    </p>
                    <p className="text-xs mt-1 max-w-xs">
                      e.g. &ldquo;When is my bio midterm?&rdquo; or &ldquo;What&apos;s due this week?&rdquo;
                    </p>
                  </div>
                ) : null}
                {!loadingHistory &&
                  messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
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
                    <div className="bg-gray-100 rounded-2xl px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

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
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
