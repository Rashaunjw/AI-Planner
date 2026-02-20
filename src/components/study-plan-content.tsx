"use client"

/**
 * Renders study plan text with simple formatting (headers, bullets, bold).
 * Shared by StudyPlanButton slide-over and /plan page.
 */
export default function StudyPlanContent({ text }: { text: string }) {
  const lines = text.split("\n")
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-3" />

        const boldHeader = trimmed.match(/^\*\*(.+)\*\*$/)
        if (boldHeader) {
          return (
            <h3 key={i} className="text-base font-semibold text-indigo-800 mt-5 mb-1.5">
              {boldHeader[1]}
            </h3>
          )
        }

        const numberedHeader = trimmed.match(/^(\d+)\.\s+(.+)/)
        if (numberedHeader && trimmed.length < 80) {
          return (
            <h3
              key={i}
              className="text-base font-semibold text-indigo-800 mt-5 mb-1.5 flex items-center gap-2"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold shrink-0">
                {numberedHeader[1]}
              </span>
              {numberedHeader[2]}
            </h3>
          )
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return (
            <div key={i} className="flex items-start gap-2 py-0.5 pl-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              <p className="text-sm text-gray-700">{trimmed.slice(2)}</p>
            </div>
          )
        }

        if (trimmed.includes("**")) {
          const parts = trimmed.split(/\*\*/)
          return (
            <p key={i} className="text-sm text-gray-700 py-0.5">
              {parts.map((part, j) =>
                j % 2 === 1 ? (
                  <span key={j} className="font-semibold text-gray-900">
                    {part}
                  </span>
                ) : (
                  part
                )
              )}
            </p>
          )
        }

        return (
          <p key={i} className="text-sm text-gray-700 py-0.5">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}
