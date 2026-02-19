"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, Bell, Calendar, User, Link2, Copy, Check, ExternalLink } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import AppNav from "@/components/app-nav"
import LoadingScreen from "@/components/loading-screen"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState({
    emailReminders: true,
    reminderDays: 2,
    calendarSync: false,
    notifications: true,
  })
  const [saving, setSaving] = useState(false)
  const [accounts, setAccounts] = useState<Array<{ provider: string }>>([])
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [uploads, setUploads] = useState<Array<{ id: string; fileName: string; createdAt: string }>>([])
  const [icsCopied, setIcsCopied] = useState(false)

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.replace("/auth/signin")
    }
  }, [router, session, status])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings")
        if (response.ok) {
          const data = await response.json()
          if (data.settings) {
            setSettings((prev) => ({
              ...prev,
              emailReminders: Boolean(data.settings.emailReminders),
              reminderDays: Number(data.settings.reminderDays) || 2,
              calendarSync: Boolean(data.settings.calendarSync),
            }))
          }
          if (Array.isArray(data.accounts)) {
            setAccounts(data.accounts)
          }
          if (Array.isArray(data.uploads)) {
            setUploads(data.uploads)
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast.error("Failed to load settings.")
      } finally {
        setLoadingSettings(false)
      }
    }

    if (session) {
      fetchSettings()
    } else {
      setLoadingSettings(false)
    }
  }, [session])

  if (status === "loading") {
    return <LoadingScreen message="Loading settings..." />
  }

  if (!session) {
    return null
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailReminders: settings.emailReminders,
          reminderDays: settings.reminderDays,
          calendarSync: settings.calendarSync,
        }),
      })
      if (!response.ok) {
        throw new Error("Settings update failed")
      }
      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Reusable toggle switch
  const Toggle = ({
    checked,
    onChange,
  }: {
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        checked ? "bg-indigo-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      <AppNav />

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-gray-500 text-sm">
            Manage your account preferences and notification settings
          </p>
        </div>

        <div className="space-y-5">
          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
            <div className="flex items-center mb-5">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <User className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Account Information</h2>
            </div>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Name
                  </label>
                  <p className="text-gray-900 text-sm font-medium">{session?.user?.name || "Not provided"}</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 text-sm font-medium">{session?.user?.email || "Not provided"}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-50">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  Sign out of PlanEra
                </button>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
            <div className="flex items-center mb-5">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <Link2 className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Connected Accounts</h2>
            </div>
            {loadingSettings ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : accounts.length > 0 ? (
              <ul className="space-y-2">
                {accounts.map((account) => (
                  <li
                    key={account.provider}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="capitalize text-sm text-gray-700 font-medium">
                      {account.provider}
                    </span>
                    <span className="text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Connected
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No connected accounts found.</p>
            )}
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
            <div className="flex items-center mb-5">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <Bell className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Reminders</label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Receive email reminders for upcoming assignments
                  </p>
                </div>
                <Toggle
                  checked={settings.emailReminders}
                  onChange={(v) => setSettings({ ...settings, emailReminders: v })}
                />
              </div>

              {settings.emailReminders && (
                <div className="ml-4 pl-4 border-l-2 border-indigo-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remind me how many days before the due date?
                  </label>
                  <select
                    value={settings.reminderDays}
                    onChange={(e) =>
                      setSettings({ ...settings, reminderDays: parseInt(e.target.value) })
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value={1}>1 day before</option>
                    <option value={2}>2 days before</option>
                    <option value={3}>3 days before</option>
                    <option value={7}>1 week before</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div>
                  <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                  <p className="text-xs text-gray-400 mt-0.5">Receive browser notifications</p>
                </div>
                <Toggle
                  checked={settings.notifications}
                  onChange={(v) => setSettings({ ...settings, notifications: v })}
                />
              </div>
            </div>
          </div>

          {/* Calendar Integration */}
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
            <div className="flex items-center mb-5">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Calendar Integration</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Google Calendar Sync</label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Automatically sync your assignments to Google Calendar
                  </p>
                </div>
                <Toggle
                  checked={settings.calendarSync}
                  onChange={(v) => setSettings({ ...settings, calendarSync: v })}
                />
              </div>
              {settings.calendarSync ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  <span>Automatic sync is enabled. We will sync nightly.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="self-start sm:self-auto border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => {
                      fetch("/api/calendar/sync", { method: "POST" })
                      toast.success("Sync started!")
                    }}
                  >
                    Sync Now
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-gray-400">
                  Enable to sync your assignments to Google Calendar each night.
                </p>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                <span>Having trouble syncing? Reconnect your Google account.</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start sm:self-auto border-gray-300"
                  onClick={async () => {
                    await fetch("/api/calendar/reconnect", { method: "POST" })
                    signOut({ callbackUrl: "/auth/signin" })
                  }}
                >
                  Reconnect Google
                </Button>
              </div>
            </div>
          </div>

          {/* ICS Calendar Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
            <div className="flex items-center mb-5">
              <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                <ExternalLink className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Subscribe in Any Calendar</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Works with Apple Calendar, Outlook, Fantastical, and more
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Copy the link below and paste it into any calendar app that supports
              URL subscriptions. Your assignments will sync automatically.
            </p>

            {/* URL display + copy button */}
            <div className="flex items-center gap-2 mb-5">
              <code className="flex-1 min-w-0 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-600 truncate">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/calendar/ics?userId=${session?.user?.id}`
                  : `/api/calendar/ics?userId=${session?.user?.id}`}
              </code>
              <Button
                variant="outline"
                size="sm"
                className={`shrink-0 gap-1.5 transition-colors ${
                  icsCopied
                    ? "border-green-300 text-green-700 bg-green-50"
                    : "border-gray-300"
                }`}
                onClick={() => {
                  const url = `${window.location.origin}/api/calendar/ics?userId=${session?.user?.id}`
                  navigator.clipboard.writeText(url).then(() => {
                    setIcsCopied(true)
                    toast.success("Calendar link copied!")
                    setTimeout(() => setIcsCopied(false), 2500)
                  })
                }}
              >
                {icsCopied ? (
                  <><Check className="h-3.5 w-3.5" /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </Button>
            </div>

            {/* Per-app instructions */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                How to subscribe
              </p>
              {[
                {
                  emoji: "🍎",
                  name: "Apple Calendar (Mac)",
                  steps: "File → New Calendar Subscription → paste the link",
                },
                {
                  emoji: "📱",
                  name: "Apple Calendar (iPhone)",
                  steps: "Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar",
                },
                {
                  emoji: "📧",
                  name: "Outlook (desktop or web)",
                  steps: "Add Calendar → Subscribe from web → paste the link",
                },
                {
                  emoji: "📅",
                  name: "Google Calendar",
                  steps: "⚙️ Settings → Add calendar → From URL → paste the link",
                },
              ].map(({ emoji, name, steps }) => (
                <div key={name} className="flex items-start gap-2.5 text-sm py-2 border-b border-gray-50 last:border-0">
                  <span className="text-base shrink-0">{emoji}</span>
                  <div>
                    <p className="font-medium text-gray-700 text-xs">{name}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{steps}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Upload Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Upload Activity</h2>
            {loadingSettings ? (
              <p className="text-sm text-gray-400">Loading uploads...</p>
            ) : uploads.length > 0 ? (
              <ul className="space-y-1">
                {uploads.map((upload) => (
                  <li
                    key={upload.id}
                    className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="truncate max-w-[70%] text-sm text-gray-700">{upload.fileName}</span>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(upload.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">No uploads yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
