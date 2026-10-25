import type { AuthState, AccessRule } from './types'

export const canAccess = (state: AuthState | null, rule: AccessRule = {}) =>
  Boolean(
    state &&
    (!rule.verified || state.user.emailVerified) &&
    (!rule.roles?.length ||
      rule.roles.some((role) => state.user.roles.includes(role))) &&
    (rule.permissions ?? []).every((permission) =>
      state.user.permissions.includes(permission)
    )
  )
