export function parseDateInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  // Treat date-only inputs as local dates to avoid timezone shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T12:00:00`)
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

