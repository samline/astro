import type { Captcha } from './types'

export default {
  label: 'Verificación de seguridad',
  loading: 'Completa la verificación de seguridad.',
  expired: 'La verificación ha caducado. Inténtalo de nuevo.',
  error: 'No se pudo cargar la verificación. Inténtalo de nuevo.',
  retry: 'Reintentar verificación',
  noScript:
    'Activa JavaScript para completar la verificación de seguridad y enviar este formulario.',
  invalid:
    'La verificación de seguridad falló. Complétala de nuevo y vuelve a enviar el formulario.'
} satisfies Captcha
