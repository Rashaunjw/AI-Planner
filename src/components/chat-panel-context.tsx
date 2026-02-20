"use client"

import { createContext, useContext, useState, useCallback } from "react"

type ChatPanelContextValue = {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
}

const ChatPanelContext = createContext<ChatPanelContextValue | null>(null)

export function useChatPanel(): ChatPanelContextValue {
  const ctx = useContext(ChatPanelContext)
  if (!ctx) {
    throw new Error("useChatPanel must be used within ChatPanelProvider")
  }
  return ctx
}

export function ChatPanelProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])

  return (
    <ChatPanelContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
    </ChatPanelContext.Provider>
  )
}
