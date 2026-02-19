"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
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
