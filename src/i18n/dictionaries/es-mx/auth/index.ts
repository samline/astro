import type { Auth } from './types'

export default {
  unauthorized: 'Inicia sesión para continuar.',
  forbidden: 'No tienes permiso para realizar esta acción.',
  invalidCredentials: 'No se pudo iniciar sesión con los datos proporcionados.',
  unavailable:
    'La autenticación no está disponible en este momento. Inténtalo de nuevo.'
} satisfies Auth
