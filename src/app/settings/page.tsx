"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Brain, ArrowLeft, Save, Bell, Calendar, User } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { isDevBypassClientEnabled } from "@/lib/dev-bypass-client"

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState({
    emailReminders: true,
    reminderDays: 2,
    calendarSync: false,
    notifications: true
  })
  const [saving, setSaving] = useState(false)
  const isDevBypass = isDevBypassClientEnabled()

  useEffect(() => {
    if (!isDevBypass && status !== "loading" && !session) {
      router.replace("/auth/signin")
    }
  }, [isDevBypass, router, session, status])

  if (status === "loading" && !isDevBypass) {
    return <div>Loading...</div>
  }

  if (!session && !isDevBypass) {
    return null
  }

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implement settings save to database
    setTimeout(() => {
      setSaving(false)
      alert('Settings saved successfully!')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">AI Planner</span>
              </Link>
            </div>
            
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and notification settings
          </p>
        </div>

        <div className="space-y-8">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold">Account Information</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{session?.user?.name || "Not provided"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{session?.user?.email || "Not provided"}</p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <Bell className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold">Notification Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email Reminders</label>
                  <p className="text-sm text-gray-500">Receive email reminders for upcoming tasks</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailReminders}
                  onChange={(e) => setSettings({...settings, emailReminders: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              {settings.emailReminders && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remind me how many days before due date?
                  </label>
                  <select
                    value={settings.reminderDays}
                    onChange={(e) => setSettings({...settings, reminderDays: parseInt(e.target.value)})}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value={1}>1 day</option>
                    <option value={2}>2 days</option>
                    <option value={3}>3 days</option>
                    <option value={7}>1 week</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                  <p className="text-sm text-gray-500">Receive browser notifications</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

          {/* Calendar Integration */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold">Calendar Integration</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Google Calendar Sync</label>
                  <p className="text-sm text-gray-500">Automatically sync tasks to your Google Calendar</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.calendarSync}
                  onChange={(e) => setSettings({...settings, calendarSync: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              
              {!settings.calendarSync && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Coming Soon:</strong> Calendar integration will allow you to automatically sync your tasks with Google Calendar and receive smart scheduling suggestions.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
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
        </div>
      </div>
    </div>
  )
}
