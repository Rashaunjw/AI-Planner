"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import ConfirmDialog from "@/components/confirm-dialog"
import { Trash2 } from "lucide-react"

export default function ActivityClearButton() {
  const [clearing, setClearing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClear = async () => {
    setClearing(true)
    try {
      const response = await fetch("/api/activity", { method: "DELETE" })
      if (response.ok) {
        toast.success("Activity cleared.")
        window.location.reload()
      } else {
        toast.error("Failed to clear activity.")
      }
    } catch (error) {
      console.error("Clear activity error:", error)
      toast.error("Failed to clear activity.")
    } finally {
      setClearing(false)
      setShowConfirm(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirm}
        title="Clear All Activity"
        message="This will permanently delete all your uploads and tasks. This cannot be undone."
        confirmLabel="Clear All"
        variant="danger"
        onConfirm={handleClear}
        onCancel={() => setShowConfirm(false)}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={clearing}
        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {clearing ? "Clearing..." : "Clear Activity"}
      </Button>
    </>
  )
}
