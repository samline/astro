import { getSecret, SITE_URL } from 'astro:env/server'
import { configureAuth } from './settings'
import { createAuthContext } from './access'

let service: ReturnType<typeof configureAuth> | undefined
export const getAuth = () => {
  if (service === undefined) service = configureAuth(getSecret, SITE_URL)
  return service
}

export const requestAuth = (request: Request, locale?: string) =>
  createAuthContext(request, getAuth, locale)
export { canAccess } from './access'
export type { AuthState, AccessRule, Identity, IdentityProvider } from './types'
