import { ActionError } from 'astro:actions'
import { getDictionary } from '../../i18n'
import { failureStatus, type AccessRule, type AuthState } from './types'
import type { AuthService } from './factory'

import { canAccess } from './policy'
export { canAccess } from './policy'

/** Per-request memoization, never a shared user/session cache. Safe for Server Islands. */
export const createAuthContext = (
  request: Request,
  service: () => AuthService | null,
  locale?: string
) => {
  let result: Promise<AuthState | null> | undefined
  const copy = getDictionary(locale).auth
  const getSession = () => {
    result ??= Promise.resolve()
      .then(() => service()?.getSession(request) ?? null)
      .catch((error: unknown) => {
        if (failureStatus(error) === 401) return null
        throw new ActionError({
          code:
            failureStatus(error) === 403 ? 'FORBIDDEN' : 'SERVICE_UNAVAILABLE',
          message:
            failureStatus(error) === 403 ? copy.forbidden : copy.unavailable
        })
      })
    return result
  }
  const requireAccess = async (rule: AccessRule = {}) => {
    const state = await getSession()
    if (!state)
      throw new ActionError({
        code: 'UNAUTHORIZED',
        message: copy.unauthorized
      })
    if (!canAccess(state, rule))
      throw new ActionError({ code: 'FORBIDDEN', message: copy.forbidden })
    return state
  }
  const withExternalToken = async <T>(
    rule: AccessRule,
    operation: (token: string) => Promise<T>
  ) => {
    await requireAccess(rule)
    const active = service()
    if (!active)
      throw new ActionError({
        code: 'UNAUTHORIZED',
        message: copy.unauthorized
      })
    return active.withExternalToken(request, operation)
  }
  return {
    getSession,
    requireSession: () => requireAccess(),
    requireAccess,
    withExternalToken
  }
}
export type AuthContext = ReturnType<typeof createAuthContext>
