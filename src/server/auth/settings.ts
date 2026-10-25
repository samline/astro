import { Pool } from 'pg'
import { createAuthService } from './factory'
import { createRestIdentity } from './remote'
import { nativeOptions, oauthProviders } from './config'

/** Resolve the selected runtime identity provider without connecting when disabled. */
export const configureAuth = (
  read: (key: string) => string | undefined,
  site: string
) => {
  const mode = read('AUTH_MODE') ?? 'disabled'
  if (mode === 'disabled') return null
  const secret = read('AUTH_SECRET')
  if (!secret)
    throw new Error('Configure AUTH_SECRET before enabling authentication.')
  const common = {
    secret,
    baseURL: read('AUTH_URL') ?? site,
    sessionSeconds: read('AUTH_SESSION_SECONDS')
      ? Number(read('AUTH_SESSION_SECONDS'))
      : undefined
  }
  if (mode === 'external') {
    const url = read('AUTH_API_URL')
    if (!url)
      throw new Error('Configure AUTH_API_URL for external authentication.')
    return createAuthService({
      ...common,
      mode,
      provider: createRestIdentity({
        url,
        apiKey: read('AUTH_API_KEY'),
        loginPath: read('AUTH_API_LOGIN_PATH'),
        profilePath: read('AUTH_API_PROFILE_PATH'),
        renewPath: read('AUTH_API_REFRESH_PATH'),
        logoutPath: read('AUTH_API_LOGOUT_PATH')
      })
    })
  }
  if (mode === 'database') {
    const connectionString = read('AUTH_DATABASE_URL')
    if (!connectionString)
      throw new Error(
        'Configure AUTH_DATABASE_URL for database authentication.'
      )
    return createAuthService({
      ...common,
      mode,
      native: nativeOptions,
      database: new Pool({
        connectionString,
        max: 5,
        connectionTimeoutMillis: 8000,
        idleTimeoutMillis: 10000
      })
    })
  }
  if (mode === 'oauth') {
    const discoveryUrl = read('AUTH_OAUTH_DISCOVERY_URL')
    const clientId = read('AUTH_OAUTH_CLIENT_ID')
    const providers = oauthProviders.length
      ? oauthProviders
      : discoveryUrl && clientId
        ? [
            {
              providerId: 'identity',
              discoveryUrl,
              clientId,
              clientSecret: read('AUTH_OAUTH_CLIENT_SECRET'),
              scopes: ['openid', 'profile', 'email']
            }
          ]
        : []
    if (!providers.length)
      throw new Error(
        'Configure OAuth discovery/client settings or server/auth/config.ts providers first.'
      )
    return createAuthService({ ...common, mode, providers })
  }
  throw new Error('Unsupported AUTH_MODE.')
}
