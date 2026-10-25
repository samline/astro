import { createAuthService, type CommonOptions } from '../factory'
import { oauthProviders } from '../config'

export default (
  read: (key: string) => string | undefined,
  common: CommonOptions
) => {
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
  return createAuthService({ ...common, mode: 'oauth', providers })
}
