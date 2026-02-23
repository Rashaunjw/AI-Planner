"use client"

import { GraduationCap, Check, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import AppNav from "@/components/app-nav"

// Free: enough to fully test the app and give feedback; clear limits on usage
const FREE_FEATURES = [
  "5 document uploads per month",
  "AI task extraction from syllabus/schedule",
  "Full dashboard, tasks, and calendar view",
  "Email reminders and push notifications",
  "ICS calendar feed and Google Calendar sync",
  "AI study plan (generate up to 5 per month)",
  "Add study blocks to calendar (limited)",
  "Weekly digest email",
]

// Pro: unrestricted usage + premium features
const PRO_FEATURES = [
  "Schedule chat (ask about your schedule with AI)",
  "Unlimited document uploads",
  "Unlimited AI study plan generations",
  "Unlimited “add study blocks to calendar”",
  "Crunch week reports (busiest week, workload insights)",
  "Custom reminder windows (1 day, 3 days, 1 week, etc.)",
  "Export to CSV / PDF (when available)",
  "Priority support",
  "Everything in Free",
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50">
      <AppNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Plans</h1>
          <p className="text-gray-600">
            Start free. Upgrade when you need more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Free</h2>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">$0</p>
            <p className="text-sm text-gray-500 mb-6">forever</p>
            <ul className="space-y-3 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup" className="mt-6">
              <Button variant="outline" className="w-full border-gray-300">
                Get started
              </Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-indigo-900 rounded-2xl border-2 border-indigo-700 shadow-lg p-8 flex flex-col relative">
            <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded">
              Coming soon
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-indigo-300" />
              <h2 className="text-xl font-semibold text-white">Pro</h2>
            </div>
            <p className="text-3xl font-bold text-white mb-1">TBD</p>
            <p className="text-sm text-indigo-200 mb-6">unlimited everything</p>
            <ul className="space-y-3 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-indigo-100">
                  <Check className="h-4 w-4 text-indigo-300 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              disabled
              className="mt-6 w-full bg-indigo-600 text-white cursor-not-allowed opacity-80"
            >
              Upgrade to Pro (coming soon)
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          All plans include a 14-day trial of Pro features when we launch.
        </p>
      </div>
    </div>
  )
}
