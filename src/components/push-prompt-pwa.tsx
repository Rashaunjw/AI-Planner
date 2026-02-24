"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { subscribeToPush } from "@/lib/push-client"
import { toast } from "sonner"

const STORAGE_KEY = "planera-push-prompt"
const DISMISS_DAYS = 7

function isPwa(): boolean {
  if (typeof window === "undefined") return false
  const standalone = (navigator as unknown as { standalone?: boolean }).standalone
  const displayMode = window.matchMedia("(display-mode: standalone)").matches
  const isStandalone = displayMode || standalone === true
  const hasPwaReferrer =
    document.referrer.includes("android-app://") ||
    (typeof window !== "undefined" && "getDisplayMode" in navigator)
  return Boolean(isStandalone || hasPwaReferrer)
}

function wasDismissed(): boolean {
  if (typeof window === "undefined") return true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw) as { at?: number; never?: boolean }
    if (data.never) return true
    if (typeof data.at === "number") {
      const elapsed = Date.now() - data.at
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return true
    }
  } catch {
    return false
  }
  return false
}

function setDismissed(never = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), never }))
  } catch {
    //
  }
}

export function PushPromptPwa() {
  const { data: session, status } = useSession()
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return
    if (!isPwa()) return
    if (wasDismissed()) return
    if (subscribed) return

    const check = async () => {
      try {
        const res = await fetch("/api/push/status")
        if (!res.ok) return
        const data = await res.json()
        if (data.subscribed) {
          setSubscribed(true)
          return
        }
        setShow(true)
      } catch {
        setShow(false)
      }
    }

    check()
  }, [session?.user, status, subscribed])

  const handleEnable = async () => {
    setLoading(true)
    try {
      const result = await subscribeToPush()
      if (result.ok) {
        setSubscribed(true)
        setShow(false)
        toast.success("Push notifications enabled")
      } else {
        toast.error(result.error || "Could not enable push")
      }
    } catch {
      toast.error("Could not enable push")
    } finally {
      setLoading(false)
    }
  }

  const handleNotNow = () => {
    setDismissed(false)
    setShow(false)
  }

  const handleNever = () => {
    setDismissed(true)
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-4 pb-[env(safe-area-inset-bottom)] sm:inset-x-4 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm"
      role="dialog"
      aria-label="Enable push notifications"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <Bell className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">Get deadline reminders</p>
            <p className="mt-0.5 text-sm text-gray-600">
              We can notify you on this device when assignments are due. Enable notifications?
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={handleEnable}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? "Enabling…" : "Enable"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleNotNow} disabled={loading}>
                Not now
              </Button>
            </div>
            <button
              type="button"
              onClick={handleNever}
              disabled={loading}
              className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              aria-label="Don't ask again"
            >
              <X className="h-3 w-3" />
              Don&apos;t ask again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
