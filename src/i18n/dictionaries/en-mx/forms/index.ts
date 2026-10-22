import type { Forms } from './types'

export default {
  labels: {
    name: 'Name',
    email: 'Email',
    message: 'Message'
  },
  placeholders: {
    name: 'Your name',
    email: 'you@example.com',
    message: 'How can we help?'
  },
  messages: {
    required: 'This field is required.',
    invalidEmail: 'Enter a valid email address.',
    success: 'Your message has been sent.',
    error: 'Your message could not be sent. Please try again.'
  }
} satisfies Forms
