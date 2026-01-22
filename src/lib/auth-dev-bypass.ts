/**
 * Development bypass for authentication.
 * Set ENABLE_AUTH_BYPASS=true in .env.local to bypass auth checks.
 */
export function getDevBypassSession() {
  if (process.env.ENABLE_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production") {
    return {
      user: {
        id: "dev-user-id",
        name: "Dev User",
        email: "dev@example.com",
        image: null,
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  return null
}

export function isAuthBypassEnabled() {
  return process.env.ENABLE_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production"
}

