import type { Forms } from './types'

export default {
  controls: {
    requiredIndicator: '*',
    required: 'Required',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    clearFile: 'Clear files'
  },
  labels: {
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    message: 'Message'
  },
  placeholders: {
    name: 'Your name',
    email: 'you@example.com',
    phone: '+1 555 555 5555',
    message: 'How can we help?'
  },
  messages: {
    required: 'This field is required.',
    invalidEmail: 'Enter a valid email address.',
    invalidPhone: 'Enter a valid phone number.',
    invalidInput: 'Check the submitted information.',
    tooLong: 'This value is too long.',
    forbidden: 'Submit this form from this website.',
    success: 'Your message has been sent.',
    error: 'Your message could not be sent. Please try again.'
  }
} satisfies Forms
