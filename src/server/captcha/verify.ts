export type CaptchaProvider = 'none' | 'turnstile' | 'recaptcha'

export interface CaptchaSettings {
  provider: CaptchaProvider
  secret?: string
  hostnames: readonly string[]
}

const endpoints = {
  turnstile: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
  recaptcha: 'https://www.google.com/recaptcha/api/siteverify'
} as const

/** Tokens and provider responses must never be logged or returned to visitors. */
export const verifyToken = async (
  token: string,
  settings: CaptchaSettings,
  request: typeof fetch = fetch
): Promise<boolean> => {
  if (settings.provider === 'none') return true
  if (
    !Object.hasOwn(endpoints, settings.provider) ||
    !settings.secret?.trim() ||
    !settings.hostnames.length ||
    !token.trim() ||
    token.length > 2048
  )
    return false
  try {
    const response = await request(endpoints[settings.provider], {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: settings.secret, response: token }),
      signal: AbortSignal.timeout(8000),
      redirect: 'error'
    })
    if (!response.ok || !response.body) return false
    // Bound the provider response independently of Content-Length.
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let length = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        length += value.byteLength
        if (length > 8192) {
          await reader.cancel()
          return false
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }
    const bytes = new Uint8Array(length)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    const result: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (!result || typeof result !== 'object') return false
    return (
      'success' in result &&
      result.success === true &&
      'hostname' in result &&
      typeof result.hostname === 'string' &&
      settings.hostnames.some(
        (hostname) => hostname.toLowerCase() === result.hostname
      )
    )
  } catch {
    return false
  }
}
