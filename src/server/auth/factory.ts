import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { genericOAuth } from 'better-auth/plugins'
import { externalIdentity, readCredential } from './external'
import {
  identitySchema,
  authFailure,
  failureStatus,
  type AuthState,
  type IdentityProvider
} from './types'

import { authUserFields } from './schema.mjs'

type CommonOptions = {
  secret: string
  baseURL: string
  sessionSeconds?: number
}
type NativeOptions = Pick<
  BetterAuthOptions,
  'emailAndPassword' | 'emailVerification' | 'socialProviders' | 'databaseHooks'
>
export type AuthOptions = CommonOptions &
  (
    | { mode: 'external'; provider: IdentityProvider }
    | {
        mode: 'database'
        database: NonNullable<BetterAuthOptions['database']>
        native?: NativeOptions
      }
    | { mode: 'oauth'; providers: Parameters<typeof genericOAuth>[0]['config'] }
  )

/** Create lazily at runtime. External REST uses only signed/encrypted cookies. */
export const createAuthService = (options: AuthOptions) => {
  const base = new URL(options.baseURL)
  if (
    base.username ||
    base.password ||
    base.pathname !== '/' ||
    base.search ||
    base.hash ||
    (base.protocol !== 'https:' &&
      !(
        base.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)
      ))
  ) {
    throw new Error('AUTH_URL must be an HTTPS origin, or loopback HTTP.')
  }
  if (options.secret.length < 32)
    throw new Error('AUTH_SECRET must have at least 32 characters.')
  const sessionSeconds =
    options.sessionSeconds ?? (options.mode === 'database' ? 3600 : 900)
  if (
    !Number.isInteger(sessionSeconds) ||
    sessionSeconds < 60 ||
    sessionSeconds > 86400
  )
    throw new Error('Invalid auth session lifetime.')
  const external = options.mode === 'external'
  const auth = betterAuth({
    ...(options.mode === 'database' ? options.native : {}),
    appName: 'SAM Astro',
    baseURL: base.origin,
    basePath: '/api/auth',
    secret: options.secret,
    trustedOrigins: [base.origin],
    ...(options.mode === 'database' ? { database: options.database } : {}),
    session: {
      expiresIn: sessionSeconds,
      ...(options.mode === 'database'
        ? { cookieCache: { enabled: false } }
        : {
            disableSessionRefresh: true,
            cookieCache: {
              enabled: true,
              maxAge: sessionSeconds,
              strategy: 'jwe',
              refreshCache: false
            }
          })
    },
    user: {
      additionalFields: authUserFields as NonNullable<
        BetterAuthOptions['user']
      >['additionalFields']
    },
    account: {
      accountLinking: { enabled: false },
      storeStateStrategy: options.mode === 'database' ? 'database' : 'cookie'
    },
    advanced: {
      cookiePrefix: 'samline-astro',
      ipAddress: { ipAddressHeaders: ['x-samline-client-ip'] }
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: { '/external/sign-in': { window: 60, max: 5 } }
    },
    plugins:
      options.mode === 'external'
        ? [
            externalIdentity({
              ...options,
              provider: options.provider,
              sessionSeconds
            })
          ]
        : options.mode === 'oauth'
          ? [genericOAuth({ config: options.providers })]
          : []
  })

  const read = async (request: Request): Promise<AuthState | null> => {
    const session = await auth.api.getSession({
      headers: request.headers,
      query: {
        disableRefresh: true,
        ...(options.mode === 'database' ? { disableCookieCache: true } : {})
      }
    })
    if (!session) return null
    let user = identitySchema.parse(session.user)
    if (options.mode === 'external') {
      const credential = await readCredential(
        request.headers,
        options.secret,
        base.origin,
        session.session.id,
        user.id
      )
      const current = identitySchema.parse(
        await options.provider.profile(credential)
      )
      if (current.id !== user.id) throw authFailure(401)
      user = current
    }
    return {
      user,
      session: {
        id: session.session.id,
        expiresAt: new Date(session.session.expiresAt)
      }
    }
  }
  const sessions = new WeakMap<Request, Promise<AuthState | null>>()
  const getSession = (request: Request) => {
    const pending = sessions.get(request) ?? read(request)
    sessions.set(request, pending)
    return pending
  }
  const withExternalToken = async <T>(
    request: Request,
    operation: (token: string) => Promise<T>
  ) => {
    if (options.mode !== 'external')
      throw new Error('External token access requires external auth mode.')
    const state = await getSession(request)
    if (!state) throw authFailure(401)
    const credential = await readCredential(
      request.headers,
      options.secret,
      base.origin,
      state.session.id,
      state.user.id
    )
    return operation(credential.token)
  }
  const handler = async (request: Request) => {
    const pathname = new URL(request.url).pathname
    const path = pathname.slice('/api/auth'.length)
    if (!pathname.startsWith('/api/auth/'))
      return new Response(null, { status: 404 })
    // Credential exchange and refresh always require the configured same origin.
    if (
      !['GET', 'HEAD'].includes(request.method) &&
      request.headers.get('origin') !== base.origin
    ) {
      return Response.json(
        { code: 'FORBIDDEN' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      )
    }
    if (
      options.mode === 'oauth' &&
      ['/get-access-token', '/refresh-token', '/account-info'].includes(path)
    )
      return new Response(null, { status: 404 })
    if (external) {
      const allowed = new Map([
        ['/external/sign-in', 'POST'],
        ['/external/refresh', 'POST'],
        ['/external/sign-out', 'POST'],
        ['/get-session', 'GET']
      ])
      if (!allowed.has(path)) return new Response(null, { status: 404 })
      if (allowed.get(path) !== request.method)
        return new Response(null, { status: 405 })
      if (path === '/get-session') {
        try {
          return Response.json(await getSession(request), {
            headers: { 'Cache-Control': 'no-store' }
          })
        } catch (error) {
          return Response.json(null, {
            status: failureStatus(error),
            headers: { 'Cache-Control': 'no-store' }
          })
        }
      }
    }
    const response = await auth.handler(request)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }
  return { auth, mode: options.mode, getSession, handler, withExternalToken }
}
export type AuthService = ReturnType<typeof createAuthService>
