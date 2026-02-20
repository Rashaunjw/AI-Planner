"use client"

import { useState, useEffect } from "react"
import { Download, X, Smartphone, Monitor, Trash2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Platform = "ios" | "android" | "desktop"
type DesktopBrowser = "chrome" | "safari" | "edge" | "other"

function getPlatform(): { platform: Platform; browser?: DesktopBrowser } {
  if (typeof window === "undefined") return { platform: "desktop" }
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return { platform: "ios" }
  if (/Android/.test(ua)) return { platform: "android" }
  if (/Edg\//.test(ua)) return { platform: "desktop", browser: "edge" }
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return { platform: "desktop", browser: "chrome" }
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return { platform: "desktop", browser: "safari" }
  return { platform: "desktop", browser: "other" }
}

const INSTRUCTIONS: Record<
  Platform,
  { title: string; steps: string[]; icon?: React.ReactNode } | Record<DesktopBrowser, { title: string; steps: string[] }>
> = {
  ios: {
    title: "Add PlanEra to your Home Screen",
    steps: [
      "Tap the Share button at the bottom of Safari (the square with an arrow).",
      "Scroll down and tap **Add to Home Screen**.",
      "Tap **Add** in the top right. PlanEra will appear on your home screen like an app.",
    ],
  },
  android: {
    title: "Install PlanEra on your device",
    steps: [
      "Tap the menu (⋮) in Chrome’s address bar.",
      "Tap **Install app** or **Add to Home screen**.",
      "Confirm **Install**. PlanEra will open like an app from your app drawer or home screen.",
    ],
  },
  desktop: {
    chrome: {
      title: "Install PlanEra on your computer",
      steps: [
        "Look for the install icon (⊕ or computer-with-plus) in the address bar on the right.",
        "Click it and choose **Install**.",
        "Or open the menu (⋮) → **Install PlanEra**.",
      ],
    },
    edge: {
      title: "Install PlanEra on your computer",
      steps: [
        "Look for the install icon (⊕ or app-with-plus) in the address bar.",
        "Click it and choose **Install**.",
        "Or open the menu (⋯) → **Apps** → **Install this site as an app**.",
      ],
    },
    safari: {
      title: "Add PlanEra to your Dock (Mac)",
      steps: [
        "In the menu bar, click **File** → **Add to Dock**.",
        "PlanEra will appear in your Dock and open in its own window like an app.",
      ],
    },
    other: {
      title: "Install PlanEra as an app",
      steps: [
        "Use **Chrome** or **Edge** for the best install experience: open PlanEra in one of those browsers.",
        "Look for an **Install** or **Install app** option in the address bar or browser menu.",
      ],
    },
  },
}

const UNINSTALL_INSTRUCTIONS: Record<
  Platform,
  { title: string; steps: string[] } | Record<DesktopBrowser, { title: string; steps: string[] }>
> = {
  ios: {
    title: "Remove PlanEra from your iPhone or iPad",
    steps: [
      "Find the PlanEra icon on your home screen (or in App Library).",
      "**Long-press** the icon until the menu appears.",
      "Tap **Remove App** → **Delete App** (or **Remove from Home Screen** to only remove the shortcut).",
    ],
  },
  android: {
    title: "Remove PlanEra from your Android device",
    steps: [
      "Open your app drawer or home screen and find the PlanEra icon.",
      "**Long-press** the icon, then tap **Uninstall** (or the trash icon).",
      "Or go to **Settings** → **Apps** → find **PlanEra** → **Uninstall**.",
    ],
  },
  desktop: {
    chrome: {
      title: "Remove PlanEra from Chrome",
      steps: [
        "Open Chrome and go to **chrome://apps** in the address bar.",
        "**Right-click** the PlanEra icon → **Remove from Chrome**.",
        "Or open **Settings** → **Apps** → **Manage your apps** → find PlanEra → **Uninstall**.",
      ],
    },
    edge: {
      title: "Remove PlanEra from your computer (Edge)",
      steps: [
        "Open **Settings** → **Apps** → **Installed apps** (or **Apps & features**).",
        "Find **PlanEra** in the list → click the **⋯** menu → **Uninstall**.",
        "Or go to **edge://apps** in the address bar → right-click PlanEra → **Uninstall**.",
      ],
    },
    safari: {
      title: "Remove PlanEra from your Mac",
      steps: [
        "Open **Finder** and go to **Applications**.",
        "Find **PlanEra** in the list.",
        "Drag it to the **Trash**, or right-click → **Move to Trash**.",
      ],
    },
    other: {
      title: "Remove PlanEra from your device",
      steps: [
        "**Chrome:** Go to chrome://apps → right-click PlanEra → Remove from Chrome.",
        "**Edge:** Settings → Apps → find PlanEra → Uninstall.",
        "**Mac Safari:** Finder → Applications → drag PlanEra to Trash.",
      ],
    },
  },
}

interface PwaInstallWalkthroughProps {
  isOpen: boolean
  onClose: () => void
}

export function PwaInstallWalkthrough({ isOpen, onClose }: PwaInstallWalkthroughProps) {
  const [platformInfo, setPlatformInfo] = useState<{ platform: Platform; browser?: DesktopBrowser }>({
    platform: "desktop",
  })
  const [canPromptInstall, setCanPromptInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<{ prompt: () => Promise<{ outcome: string }> } | null>(null)
  const [showUninstallSteps, setShowUninstallSteps] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPlatformInfo(getPlatform())
      setShowUninstallSteps(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as unknown as { prompt: () => Promise<{ outcome: string }> })
      setCanPromptInstall(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    setDeferredPrompt(null)
    setCanPromptInstall(false)
    onClose()
  }

  const getContent = () => {
    const { platform, browser } = platformInfo
    if (platform === "ios") {
      const c = INSTRUCTIONS.ios as { title: string; steps: string[] }
      return { title: c.title, steps: c.steps }
    }
    if (platform === "android") {
      const c = INSTRUCTIONS.android as { title: string; steps: string[] }
      return { title: c.title, steps: c.steps }
    }
    const desktop = INSTRUCTIONS.desktop as Record<DesktopBrowser, { title: string; steps: string[] }>
    const key = browser ?? "other"
    return desktop[key] ?? desktop.other
  }

  const getUninstallContent = () => {
    const { platform, browser } = platformInfo
    if (platform === "ios") {
      const c = UNINSTALL_INSTRUCTIONS.ios as { title: string; steps: string[] }
      return { title: c.title, steps: c.steps }
    }
    if (platform === "android") {
      const c = UNINSTALL_INSTRUCTIONS.android as { title: string; steps: string[] }
      return { title: c.title, steps: c.steps }
    }
    const desktop = UNINSTALL_INSTRUCTIONS.desktop as Record<DesktopBrowser, { title: string; steps: string[] }>
    const key = browser ?? "other"
    return desktop[key] ?? desktop.other
  }

  const content = getContent()
  const uninstallContent = getUninstallContent()

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative bg-white rounded-2xl shadow-xl border border-indigo-100 max-w-md w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-labelledby="pwa-walkthrough-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-indigo-900 px-6 py-5 text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-700 p-2.5 rounded-xl">
              <Download className="h-6 w-6 text-indigo-200" />
            </div>
            <div>
              <h2 id="pwa-walkthrough-title" className="text-lg font-bold">
                Download PlanEra
              </h2>
              <p className="text-indigo-300 text-sm mt-0.5">
                Use it like an app from your home screen or desktop.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {showUninstallSteps ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUninstallSteps(false)}
                className="mb-4 -ml-2 text-gray-600 hover:text-gray-900 gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to install steps
              </Button>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-indigo-600" />
                {uninstallContent.title}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Follow these steps to safely remove PlanEra from your device. Your data in the browser is not affected.
              </p>
              <ol className="space-y-3">
                {uninstallContent.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span
                      className={cn(
                        "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        "bg-gray-100 text-gray-700"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: step.replace(/\*\*(.*?)\*\*/g, "<strong class='text-gray-900'>$1</strong>"),
                      }}
                    />
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              {canPromptInstall && deferredPrompt && (
                <div className="mb-5">
                  <Button
                    onClick={handleInstallClick}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Install PlanEra now
                  </Button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Your browser supports one-tap install. Or follow the steps below.
                  </p>
                </div>
              )}

              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                {platformInfo.platform === "desktop" ? (
                  <Monitor className="h-4 w-4 text-indigo-600" />
                ) : (
                  <Smartphone className="h-4 w-4 text-indigo-600" />
                )}
                {content.title}
              </h3>
              <ol className="space-y-3">
                {content.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span
                      className={cn(
                        "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        "bg-indigo-100 text-indigo-700"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: step.replace(/\*\*(.*?)\*\*/g, "<strong class='text-gray-900'>$1</strong>"),
                      }}
                    />
                  </li>
                ))}
              </ol>

              <p className="text-xs text-gray-500 mt-4">
                Once installed, PlanEra opens in its own window and you can use it offline for a faster experience.
              </p>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowUninstallSteps(true)}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-gray-400" />
                  How to remove PlanEra from your device
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Standalone trigger + dialog for use in nav or anywhere */
export function PwaInstallWalkthroughTrigger() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-indigo-200 hover:text-white hover:bg-indigo-800 transition-colors"
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Download app</span>
      </button>
      <PwaInstallWalkthrough isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
