import type { Errors } from './types'

export default {
  notFound: {
    code: '404',
    title: 'Página no encontrada',
    description:
      'La página que buscas no está disponible o ha cambiado de ubicación.'
  }
} satisfies Errors
