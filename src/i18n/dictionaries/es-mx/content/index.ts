import type { Content } from './types'

export default {
  posts: {
    gettingStarted: {
      title: 'Primeros pasos',
      description: 'Un ejemplo de colección de contenido multilingüe.',
      paragraphs: [
        'Las entradas de la colección definen los datos. Los diccionarios proporcionan el texto de cada idioma.'
      ]
    }
  },
  messages: {
    invalidInput: 'Revisa la información enviada.',
    loadError: 'No se pudo cargar el contenido. Inténtalo de nuevo.',
    createError: 'No se pudo guardar el contenido. Inténtalo de nuevo.',
    notAuthorized: 'No tienes permiso para modificar este contenido.'
  }
} satisfies Content
