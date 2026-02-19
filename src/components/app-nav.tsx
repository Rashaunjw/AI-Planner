"use client"

import { GraduationCap, Upload, LayoutDashboard, ListTodo, Calendar, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/calendar", label: "Calendar", icon: Calendar },
]

export default function AppNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-indigo-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2 mr-6">
              <GraduationCap className="h-8 w-8 text-indigo-300" />
              <span className="text-xl font-bold text-white">PlanEra</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden sm:flex items-center space-x-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href
                return (
                  <Link key={href} href={href}>
                    <button
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-indigo-700 text-white"
                          : "text-indigo-200 hover:text-white hover:bg-indigo-800"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Link href="/upload">
              <Button
                size="sm"
                className={cn(
                  "bg-indigo-600 hover:bg-indigo-500 text-white border-0",
                  pathname === "/upload" && "bg-indigo-500"
                )}
              >
                <Upload className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Upload Syllabus</span>
              </Button>
            </Link>

            <Link href="/settings">
              <button
                className={cn(
                  "p-2 rounded-md transition-colors",
                  pathname === "/settings"
                    ? "bg-indigo-700 text-white"
                    : "text-indigo-200 hover:text-white hover:bg-indigo-800"
                )}
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-800 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile nav links */}
        <div className="sm:hidden flex items-center space-x-1 pb-2">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link key={href} href={href}>
                <button
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                    isActive
                      ? "bg-indigo-700 text-white"
                      : "text-indigo-300 hover:text-white hover:bg-indigo-800"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
