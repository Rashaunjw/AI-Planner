export function normalizeWeightPercent(input: unknown): number | undefined {
  if (input === null || input === undefined) {
    return undefined
  }

  if (typeof input === "number" && Number.isFinite(input)) {
    if (input < 0 || input > 100) return undefined
    return Math.round(input * 100) / 100
  }

  if (typeof input === "string") {
    const trimmed = input.trim()
    if (!trimmed) return undefined
    const numeric = trimmed.endsWith("%")
      ? trimmed.slice(0, -1).trim()
      : trimmed
    const value = Number(numeric)
    if (!Number.isFinite(value) || value < 0 || value > 100) return undefined
    return Math.round(value * 100) / 100
  }

  return undefined
}

