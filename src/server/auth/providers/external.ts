import { createAuthService, type CommonOptions } from '../factory'
import { createRestIdentity } from '../remote'

export default (
  read: (key: string) => string | undefined,
  common: CommonOptions
) => {
  const url = read('AUTH_API_URL')
  if (!url)
    throw new Error('Configure AUTH_API_URL for external authentication.')
  return createAuthService({
    ...common,
    mode: 'external',
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
