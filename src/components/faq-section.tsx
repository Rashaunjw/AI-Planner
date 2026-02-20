"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export type FaqItem = {
  question: string
  answer: string
}

export default function FaqSection({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div
            key={index}
            className="border border-gray-200 rounded-xl bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-gray-900">{item.question}</span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4 pt-0">
                <p className="text-gray-600 text-sm leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
