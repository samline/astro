import type { Cookies } from './types'

export default {
  title: 'Cookie preferences',
  description:
    'Choose whether analytics and advertising tools may run. You can accept all, reject optional cookies, or choose by category.',
  acceptAll: 'Accept all',
  rejectOptional: 'Reject optional',
  preferences: 'Cookie settings',
  savePreferences: 'Save preferences',
  close: 'Close cookie settings',
  preferencesDescription:
    'Your choice applies to this browser. You can review or withdraw it at any time using Cookie settings.',
  necessaryTitle: 'Necessary cookies',
  necessaryDescription:
    'Stores your cookie choices so the site can remember them. This category is always enabled.',
  analyticsTitle: 'Analytics',
  analyticsDescription:
    'Allows tools that measure visits and help us understand how the site is used.',
  marketingTitle: 'Advertising',
  marketingDescription:
    'Allows advertising storage, sharing of advertising-related user data, and ad personalization.',
  privacyPolicy: 'Privacy policy'
} satisfies Cookies
