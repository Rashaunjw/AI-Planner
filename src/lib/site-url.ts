/**
 * Base URL for the site (no trailing slash). Used for canonical URLs and metadata.
 */
export function getSiteBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

/** Common crawler/bot user-agent patterns so we can serve indexable content instead of redirecting. */
const CRAWLER_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /rogerbot/i,
  /linkedinbot/i,
  /embedly/i,
  /quora link preview/i,
  /showyoubot/i,
  /outbrain/i,
  /pinterest/i,
  /slackbot/i,
  /vkshare/i,
  /w3c_validator/i,
  /whatsapp/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
]

/**
 * Returns true if the given User-Agent looks like a crawler/bot.
 * Use this to avoid redirecting crawlers (e.g. on homepage) so Google can index the right URL.
 */
export function isCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  return CRAWLER_PATTERNS.some((p) => p.test(userAgent))
}
