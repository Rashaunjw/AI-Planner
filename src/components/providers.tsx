"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { ChatPanelProvider } from "@/components/chat-panel-context"
import { ChatPanel } from "@/components/chat-panel"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ChatPanelProvider>
        {children}
        <ChatPanel />
      </ChatPanelProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "font-sans",
          },
        }}
        richColors
        closeButton
      />
    </SessionProvider>
  )
}
