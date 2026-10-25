import {
  createAuthEndpoint,
  getSessionFromCtx,
  APIError
} from 'better-auth/api'
import { setSessionCookie, deleteSessionCookie } from 'better-auth/cookies'
import { symmetricEncrypt, symmetricDecrypt } from 'better-auth/crypto'
import { z } from 'astro/zod'
import { getDictionary } from '../../i18n'
import {
  identitySchema,
  failureStatus,
  authFailure,
  type IdentityProvider,
  type ExternalCredential
} from './types'

type CookieContext = Parameters<typeof setSessionCookie>[0]
const credentialSchema = z.object({
  token: z.string().min(1).max(1024),
  refreshToken: z.string().min(1).max(1024).optional(),
  expiresAt: z.number().optional(),
  sessionId: z.string(),
  userId: z.string(),
  validUntil: z.number()
})
const cookieName = (url: string) =>
  new URL(url).protocol === 'https:'
    ? '__Host-samline-identity'
    : 'samline-identity'
const cookieOptions = (url: string) => ({
  path: '/',
  httpOnly: true,
  secure: new URL(url).protocol === 'https:',
  sameSite: 'lax' as const
})
const keyFor = (secret: string) => `${secret}:samline-external-identity:v1`

export const readCredential = async (
  headers: Headers,
  secret: string,
  url: string,
  sessionId: string,
  userId: string
) => {
  const entry = headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookieName(url) + '='))
  if (!entry || entry.length > 3800) throw authFailure(401)
  try {
    const data = credentialSchema.parse(
      JSON.parse(
        await symmetricDecrypt({
          key: keyFor(secret),
          data: decodeURIComponent(entry.slice(entry.indexOf('=') + 1))
        })
      )
    )
    if (
      data.sessionId !== sessionId ||
      data.userId !== userId ||
      data.validUntil <= Date.now() ||
      (data.expiresAt !== undefined && data.expiresAt <= Date.now())
    )
      throw authFailure(401)
    return {
      token: data.token,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt
    }
  } catch {
    throw authFailure(401)
  }
}

export const externalIdentity = (options: {
  provider: IdentityProvider
  secret: string
  baseURL: string
  sessionSeconds: number
}) => {
  const copyFor = (headers?: Headers) =>
    getDictionary(headers?.get('x-samline-locale') ?? undefined).auth
  const issue = (error: unknown, headers?: Headers): never => {
    const status = failureStatus(error),
      copy = copyFor(headers)
    throw new APIError(
      status === 401
        ? 'UNAUTHORIZED'
        : status === 403
          ? 'FORBIDDEN'
          : 'SERVICE_UNAVAILABLE',
      {
        code:
          status === 401
            ? 'INVALID_CREDENTIALS'
            : status === 403
              ? 'FORBIDDEN'
              : 'AUTH_UNAVAILABLE',
        message:
          status === 401
            ? copy.invalidCredentials
            : status === 403
              ? copy.forbidden
              : copy.unavailable
      }
    )
  }
  const establish = async (
    ctx: CookieContext,
    userInput: unknown,
    credential: ExternalCredential
  ) => {
    credential = credentialSchema
      .pick({ token: true, refreshToken: true, expiresAt: true })
      .parse(credential)
    const user = identitySchema.parse(userInput)
    const now = new Date()
    const expiresAt = new Date(
      Math.min(
        Date.now() + options.sessionSeconds * 1000,
        credential.expiresAt ?? Infinity
      )
    )
    if (expiresAt.getTime() <= Date.now()) throw authFailure(401)
    const session = {
      id: crypto.randomUUID(),
      token: crypto.randomUUID() + crypto.randomUUID(),
      userId: user.id,
      expiresAt,
      createdAt: now,
      updatedAt: now
    }
    const payload = JSON.stringify({
      ...credential,
      sessionId: session.id,
      userId: user.id,
      validUntil: expiresAt.getTime()
    })
    const encrypted = await symmetricEncrypt({
      key: keyFor(options.secret),
      data: payload
    })
    if (encrypted.length > 3500) throw authFailure(503)
    await setSessionCookie(ctx, {
      session,
      user: { ...user, createdAt: now, updatedAt: now }
    })
    ctx.setCookie(cookieName(options.baseURL), encrypted, {
      ...cookieOptions(options.baseURL),
      maxAge: Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    })
    return { user, session: { id: session.id, expiresAt } }
  }
  return {
    id: 'samline-external-identity',
    endpoints: {
      externalSignIn: createAuthEndpoint(
        '/external/sign-in',
        {
          method: 'POST',
          body: z.object({
            email: z.email().max(254),
            password: z.string().min(1).max(1024)
          })
        },
        async (ctx) => {
          try {
            const result = await options.provider.authenticate(ctx.body)
            return ctx.json(
              await establish(ctx, result.user, result.credential)
            )
          } catch (error) {
            return issue(error, ctx.headers)
          }
        }
      ),
      externalRefresh: createAuthEndpoint(
        '/external/refresh',
        { method: 'POST', requireHeaders: true },
        async (ctx) => {
          try {
            const session = await getSessionFromCtx(ctx)
            if (!session) throw authFailure(401)
            const credential = await readCredential(
              ctx.headers,
              options.secret,
              options.baseURL,
              session.session.id,
              session.user.id
            )
            const result = options.provider.renew
              ? await options.provider.renew(credential)
              : { user: await options.provider.profile(credential), credential }
            if (String(result.user.id) !== session.user.id)
              throw authFailure(401)
            return ctx.json(
              await establish(ctx, result.user, result.credential)
            )
          } catch (error) {
            return issue(error, ctx.headers)
          }
        }
      ),
      externalSignOut: createAuthEndpoint(
        '/external/sign-out',
        { method: 'POST', requireHeaders: true },
        async (ctx) => {
          let revoked = !options.provider.revoke
          try {
            const session = await getSessionFromCtx(ctx)
            if (session && options.provider.revoke) {
              await options.provider.revoke(
                await readCredential(
                  ctx.headers,
                  options.secret,
                  options.baseURL,
                  session.session.id,
                  session.user.id
                )
              )
              revoked = true
            }
          } catch {
            revoked = false
          }
          deleteSessionCookie(ctx)
          ctx.setCookie(cookieName(options.baseURL), '', {
            ...cookieOptions(options.baseURL),
            maxAge: 0
          })
          return ctx.json({
            success: true,
            remoteRevoked: options.provider.revoke ? revoked : null
          })
        }
      )
    }
  }
}
