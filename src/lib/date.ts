/** Parse HH:mm or H:mm to hours and minutes (24-hour). Returns undefined if invalid. */
export function parseTimeString(timeStr: string | undefined): { hours: number; minutes: number } | undefined {
  if (!timeStr || typeof timeStr !== 'string') return undefined
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return undefined
  const hours = Math.min(23, Math.max(0, parseInt(match[1], 10)))
  const minutes = Math.min(59, Math.max(0, parseInt(match[2], 10)))
  return { hours, minutes }
}

/**
 * Parse a date string and optionally set the time. If timeStr is provided (HH:mm),
 * the returned Date uses that time; otherwise noon (12:00) for date-only inputs.
 */
export function parseDateWithTime(
  dateStr: string | undefined,
  timeStr?: string
): Date | null {
  if (!dateStr?.trim()) return null
  const trimmed = dateStr.trim()

  let base: Date | null = null

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const time = parseTimeString(timeStr)
    const h = time?.hours ?? 12
    const m = time?.minutes ?? 0
    base = new Date(`${trimmed}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
  } else {
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/)
    if (slashMatch) {
      const month = Number(slashMatch[1])
      const day = Number(slashMatch[2])
      const yearRaw = slashMatch[3]
      const year = yearRaw
        ? (yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw))
        : new Date().getFullYear()
      if (!Number.isNaN(month) && !Number.isNaN(day) && !Number.isNaN(year)) {
        const time = parseTimeString(timeStr)
        base = new Date(year, month - 1, day, time?.hours ?? 12, time?.minutes ?? 0, 0)
      }
    }
  }

  if (!base) {
    base = new Date(trimmed)
    if (Number.isNaN(base.getTime())) return null
    const time = parseTimeString(timeStr)
    if (time) {
      base.setHours(time.hours, time.minutes, 0, 0)
    }
  }

  return base
}

export function parseDateInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  // Treat date-only inputs as local dates to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00`)
  }

  // Handle M/D or M/D/YY(YY) formats by inferring year if missing.
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?$/)
  if (slashMatch) {
    const month = Number(slashMatch[1])
    const day = Number(slashMatch[2])
    const yearRaw = slashMatch[3]
    const year = yearRaw
      ? (yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw))
      : new Date().getFullYear()
    if (!Number.isNaN(month) && !Number.isNaN(day) && !Number.isNaN(year)) {
      return new Date(year, month - 1, day, 12, 0, 0)
    }
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
