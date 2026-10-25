import type { AuthOptions } from './factory'

/** Configure only when this project owns its users. No automatic signup. */
export const nativeOptions: Extract<
  AuthOptions,
  { mode: 'database' }
>['native'] = {
  emailAndPassword: { enabled: true, disableSignUp: true }
}

/** Add the external authorization/token/profile endpoints for an OAuth deployment. */
export const oauthProviders: Extract<
  AuthOptions,
  { mode: 'oauth' }
>['providers'] = []
