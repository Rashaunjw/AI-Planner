"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function ActivityClearButton() {
  const [clearing, setClearing] = useState(false)

  const handleClear = async () => {
    if (!confirm("Clear recent activity? This will remove uploads and tasks.")) return

    setClearing(true)
    try {
      const response = await fetch("/api/activity", { method: "DELETE" })
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error("Clear activity error:", error)
    } finally {
      setClearing(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClear} disabled={clearing}>
      {clearing ? "Clearing..." : "Clear Activity"}
    </Button>
  )
}

