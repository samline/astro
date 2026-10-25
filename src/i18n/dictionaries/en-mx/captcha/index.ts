import type { Captcha } from './types'

export default {
  label: 'Security verification',
  loading: 'Complete the security verification.',
  expired: 'Verification expired. Please try again.',
  error: 'Verification could not load. Please try again.',
  retry: 'Retry verification',
  noScript:
    'Enable JavaScript to complete the security verification and submit this form.',
  invalid: 'Security verification failed. Complete it again and resubmit.'
} satisfies Captcha
