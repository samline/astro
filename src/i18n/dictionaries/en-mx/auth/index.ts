import type { Auth } from './types'

export default {
  unauthorized: 'Sign in to continue.',
  forbidden: 'You do not have permission to perform this action.',
  invalidCredentials: 'Unable to sign in with the provided credentials.',
  unavailable: 'Authentication is temporarily unavailable. Please try again.'
} satisfies Auth
