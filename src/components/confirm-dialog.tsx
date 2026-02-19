"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning"
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 p-2 rounded-full ${
              variant === "danger" ? "bg-red-100" : "bg-amber-100"
            }`}
          >
            <AlertTriangle
              className={`h-5 w-5 ${
                variant === "danger" ? "text-red-600" : "text-amber-600"
              }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className={
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

