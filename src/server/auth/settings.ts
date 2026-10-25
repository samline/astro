import { type AuthService, type CommonOptions } from './factory'
import external from './providers/external'
import database from './providers/database'
import oauth from './providers/oauth'

type ReadSecret = (key: string) => string | undefined
const providers: Record<
  string,
  (read: ReadSecret, common: CommonOptions) => AuthService
> = { external, database, oauth }

/** Resolve runtime configuration; creating a scaffold never connects accounts. */
export const configureAuth = (read: ReadSecret, site: string) => {
  const mode = read('AUTH_MODE') ?? 'disabled'
  if (mode === 'disabled') return null
  const provider = Object.hasOwn(providers, mode) ? providers[mode] : undefined
  if (!provider)
    throw new Error(
      'This AUTH_MODE is not installed. Add the matching auth integration first.'
    )
  const secret = read('AUTH_SECRET')
  if (!secret)
    throw new Error('Configure AUTH_SECRET before enabling authentication.')
  return provider(read, {
    secret,
    baseURL: read('AUTH_URL') ?? site,
    sessionSeconds: read('AUTH_SESSION_SECONDS')
      ? Number(read('AUTH_SESSION_SECONDS'))
      : undefined
  })
}
