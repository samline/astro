import { z } from 'astro/zod'

export const identitySchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  email: z.email().max(254),
  emailVerified: z.boolean(),
  image: z.url().max(2048).nullable().optional(),
  roles: z.array(z.string().min(1).max(80)).max(20).default([]),
  permissions: z.array(z.string().min(1).max(100)).max(100).default([])
})
export type Identity = z.output<typeof identitySchema>
export type ExternalCredential = {
  token: string
  refreshToken?: string
  expiresAt?: number
}
export type ExternalLogin = { user: Identity; credential: ExternalCredential }

/** Each project maps its provider's protocol to this server-only contract. */
export interface IdentityProvider {
  authenticate: (input: {
    email: string
    password: string
  }) => Promise<ExternalLogin>
  profile: (credential: ExternalCredential) => Promise<Identity>
  renew?: (credential: ExternalCredential) => Promise<ExternalLogin>
  revoke?: (credential: ExternalCredential) => Promise<void>
}
export type AuthState = {
  user: Identity
  session: { id: string; expiresAt: Date }
}
export type AccessRule = {
  permissions?: readonly string[]
  roles?: readonly string[]
  verified?: boolean
}

export const authFailure = (status: 401 | 403 | 503) =>
  Object.assign(new Error('Authentication request failed.'), { status })

export const failureStatus = (error: unknown): 401 | 403 | 503 => {
  if (error && typeof error === 'object' && 'status' in error) {
    if (error.status === 401 || error.status === 403) return error.status
  }
  return 503
}
