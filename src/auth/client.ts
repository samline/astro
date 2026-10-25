import { createAuthClient } from 'better-auth/client'
import type { AuthState } from '../server/auth/types'

export type ClientAuthState = Omit<AuthState, 'session'> & {
  session: { id: string; expiresAt: string }
}

/** Native email/password and OAuth methods, available only when their mode is enabled. */
export const authClient = createAuthClient({ basePath: '/api/auth' })

const externalRequest = async <T>(path: string, body?: unknown): Promise<T> => {
  const response = await fetch('/api/auth/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      'x-samline-locale': document.documentElement.lang,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  if (!response.ok)
    throw Object.assign(new Error('Authentication request failed.'), {
      status: response.status
    })
  return response.json() as Promise<T>
}

/** REST mode never accepts an externally supplied token from the browser. */
export const signInExternal = (input: { email: string; password: string }) =>
  externalRequest<ClientAuthState>('external/sign-in', input)
export const refreshExternalSession = () =>
  externalRequest<ClientAuthState>('external/refresh', {})
export const signOutExternal = () =>
  externalRequest<{ success: boolean; remoteRevoked: boolean | null }>(
    'external/sign-out',
    {}
  )
export const getExternalSession = () =>
  externalRequest<ClientAuthState | null>('get-session')
