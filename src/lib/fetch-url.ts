/**
 * Fetch a URL and return plain text suitable for task extraction.
 * Used for "paste a link" uploads (e.g. course page, shared doc).
 */

const FETCH_TIMEOUT_MS = 12_000
const MAX_BODY_BYTES = 2 * 1024 * 1024 // 2MB

function isAllowedUrl(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  // Block localhost and common internal hosts
  if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('0.') || host.startsWith('192.168.') || host.startsWith('10.')) {
    return false
  }
  return true
}

/**
 * Strip HTML tags and collapse whitespace to get readable text.
 */
function htmlToText(html: string): string {
  const withoutScriptStyle = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
  const text = withoutScriptStyle
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text
}

/**
 * Fetch URL and return extracted plain text.
 * - Validates URL (http/https, no localhost).
 * - Timeout and max size limits.
 * - If response is HTML, strips tags; otherwise uses body as text.
 */
export async function fetchUrlToText(rawUrl: string): Promise<string> {
  const trimmed = rawUrl.trim()
  if (!trimmed) throw new Error('URL is required')

  let url: URL
  try {
    url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
  } catch {
    throw new Error('Invalid URL')
  }

  if (!isAllowedUrl(url)) {
    throw new Error('URL is not allowed')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PlanEra/1.0 (syllabus extractor)',
      },
      redirect: 'follow',
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        const isGoogleDocs = url.hostname.toLowerCase().includes('google.com')
        throw new Error(
          isGoogleDocs
            ? "This Google Doc isn't viewable by link. Share it so 'Anyone with the link' can view, or paste the document text above instead."
            : "This link requires sign-in and can't be read. Use a public page or paste the text above instead."
        )
      }
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase()
    const isHtml = contentType.includes('text/html')
    const isPlain = contentType.includes('text/plain')

    // Cap body size (use getReader() for ReadableStream)
    const stream = response.body
    if (!stream) throw new Error('Empty response body')
    const reader = stream.getReader()

    const chunks: Uint8Array[] = []
    let total = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        total += value.length
        if (total > MAX_BODY_BYTES) throw new Error('Page is too large (max 2MB)')
        chunks.push(value)
      }
    }

    const buffer = Buffer.concat(chunks)
    const body = buffer.toString('utf-8')

    if (body.length < 10) {
      throw new Error('Page has no readable content')
    }

    if (isHtml) {
      const text = htmlToText(body)
      if (text.length < 10) throw new Error('Could not extract text from page')
      return text
    }

    if (isPlain || contentType.includes('text/')) {
      return body
    }

    // Unknown type (e.g. PDF binary) – not ideal for link paste; return empty or try HTML strip
    const text = htmlToText(body)
    return text.length >= 10 ? text : body.slice(0, 50000)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error) {
      if (err.name === 'AbortError') throw new Error('Request timed out')
      throw err
    }
    throw new Error('Failed to fetch URL')
  }
}
