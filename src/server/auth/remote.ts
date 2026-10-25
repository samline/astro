import { z } from 'astro/zod'
import { identitySchema, authFailure, type IdentityProvider } from './types'

const profileSchema = z
  .object({
    id: z
      .union([z.string().min(1), z.number().int().nonnegative()])
      .transform(String),
    name: z.string(),
    email: z.email(),
    avatar: z.object({ url: z.url() }).nullish(),
    emailVerified: z.boolean().optional(),
    verified_at: z.string().nullable().optional(),
    role: z.string().optional(),
    roles: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional()
  })
  .transform((value) =>
    identitySchema.parse({
      id: value.id,
      name: value.name,
      email: value.email,
      emailVerified: value.emailVerified ?? Boolean(value.verified_at),
      image: value.avatar?.url ?? null,
      roles: value.roles ?? (value.role ? [value.role] : []),
      permissions: value.permissions ?? []
    })
  )
const loginSchema = z.object({
  success: z.literal(true),
  data: z.object({
    profile: profileSchema,
    token: z.string().min(1).max(1024),
    expires_at: z.iso.datetime().optional(),
    refresh_token: z.string().min(1).max(1024).optional()
  })
})
const profileResponse = z.object({
  success: z.literal(true),
  data: profileSchema
})

/** Default REST mapping follows login/profile envelopes, with no business fields. */
export const createRestIdentity = (options: {
  url: string
  apiKey?: string
  loginPath?: string
  profilePath?: string
  logoutPath?: string
  renewPath?: string
  fetcher?: typeof fetch
}): IdentityProvider => {
  const base = new URL(
    options.url.endsWith('/') ? options.url : options.url + '/'
  )
  if (
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    (base.protocol !== 'https:' &&
      !(
        base.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)
      ))
  ) {
    throw new Error('Auth API URL requires HTTPS or loopback HTTP.')
  }
  const endpoint = (path: string) => {
    if (
      !path ||
      path
        .split('/')
        .some((part) => ['.', '..'].includes(decodeURIComponent(part))) ||
      path.startsWith('/') ||
      /[\\?#:]|%2f|%5c/i.test(path)
    )
      throw new Error('Invalid auth API path.')
    const url = new URL(path, base)
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname))
      throw new Error('Auth API path escaped its base.')
    return url
  }
  const loginURL = endpoint(options.loginPath ?? 'auth/login')
  const profileURL = endpoint(options.profilePath ?? 'auth/profile')
  const renewURL = options.renewPath ? endpoint(options.renewPath) : undefined
  const logoutURL = options.logoutPath
    ? endpoint(options.logoutPath)
    : undefined
  const request = async (
    url: URL,
    token?: string,
    body?: unknown
  ): Promise<unknown> => {
    try {
      const response = await (options.fetcher ?? fetch)(url, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          Accept: 'application/json',
          ...(options.apiKey ? { 'x-api-key': options.apiKey } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
        cache: 'no-store'
      })
      if (!response.ok) {
        await response.body?.cancel()
        throw authFailure(
          response.status === 401 ? 401 : response.status === 403 ? 403 : 503
        )
      }
      if (response.status === 204) return null
      const reader = response.body?.getReader()
      let text = '',
        size = 0
      const decoder = new TextDecoder()
      try {
        while (reader) {
          const { value, done } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > 65536) {
            await reader.cancel()
            throw authFailure(503)
          }
          text += decoder.decode(value, { stream: true })
        }
        return JSON.parse(text + decoder.decode())
      } finally {
        reader?.releaseLock()
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error
      throw authFailure(503)
    }
  }
  return {
    authenticate: async (input) => {
      const result = loginSchema.safeParse(
        await request(loginURL, undefined, input)
      )
      if (!result.success) throw authFailure(401)
      const {
        profile: user,
        token,
        refresh_token,
        expires_at
      } = result.data.data
      return {
        user,
        credential: {
          token,
          refreshToken: refresh_token,
          ...(expires_at ? { expiresAt: Date.parse(expires_at) } : {})
        }
      }
    },
    profile: async ({ token }) => {
      const result = profileResponse.safeParse(await request(profileURL, token))
      if (!result.success) throw authFailure(503)
      return result.data.data
    },
    ...(renewURL
      ? {
          renew: async (credential: {
            token: string
            refreshToken?: string
          }) => {
            const result = loginSchema.safeParse(
              await request(renewURL, credential.token, {
                refresh_token: credential.refreshToken
              })
            )
            if (!result.success) throw authFailure(401)
            const {
              profile: user,
              token,
              refresh_token,
              expires_at
            } = result.data.data
            return {
              user,
              credential: {
                token,
                refreshToken: refresh_token,
                ...(expires_at ? { expiresAt: Date.parse(expires_at) } : {})
              }
            }
          }
        }
      : {}),
    ...(logoutURL
      ? {
          revoke: async ({ token }: { token: string }) => {
            await request(logoutURL, token, {})
          }
        }
      : {})
  }
}
