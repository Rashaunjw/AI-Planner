"use client"

import { Button } from "@/components/ui/button"
import { Brain } from "lucide-react"
import Link from "next/link"

export default function StudyPlanButton() {
  return (
    <Link href="/plan">
      <Button
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
      >
        <Brain className="h-4 w-4" />
        AI Study Plan
      </Button>
    </Link>
  )
}

