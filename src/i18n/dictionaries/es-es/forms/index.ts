import type { Forms } from './types'

export default {
  controls: {
    requiredIndicator: '*',
    required: 'Obligatorio',
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    clearFile: 'Quitar archivos'
  },
  labels: {
    name: 'Nombre',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    message: 'Mensaje'
  },
  placeholders: {
    name: 'Tu nombre',
    email: 'tu@ejemplo.com',
    phone: '+34 600 000 000',
    message: '¿Cómo podemos ayudarte?'
  },
  messages: {
    required: 'Este campo es obligatorio.',
    invalidEmail: 'Introduce un correo electrónico válido.',
    invalidPhone: 'Introduce un número de teléfono válido.',
    invalidInput: 'Revisa la información enviada.',
    tooLong: 'Este valor es demasiado largo.',
    forbidden: 'Envía este formulario desde este sitio web.',
    success: 'Tu mensaje se ha enviado.',
    error: 'No se pudo enviar tu mensaje. Inténtalo de nuevo.'
  }
} satisfies Forms
