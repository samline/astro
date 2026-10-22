import type { Errors } from './types'

export default {
  notFound: {
    code: '404',
    title: 'Page not found',
    description: 'The page you are looking for is unavailable or has moved.'
  }
} satisfies Errors
