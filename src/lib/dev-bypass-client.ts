/**
 * Client-side development auth bypass.
 * Enable via NEXT_PUBLIC_ENABLE_AUTH_BYPASS=true.
 */
export function isDevBypassClientEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_AUTH_BYPASS === "true"
}

