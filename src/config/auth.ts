import type { AccessRule } from '../server/auth/types'

/** Rules use locale-free paths and apply to descendants at segment boundaries. */
export const authRoutes: readonly ({ path: string } & AccessRule)[] = []

/** Set to an existing localized sign-in page to redirect unauthenticated page requests. */
export const authLoginPath: string | undefined = undefined
