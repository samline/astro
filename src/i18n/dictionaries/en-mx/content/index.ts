import type { Content } from './types'

export default {
  posts: {
    gettingStarted: {
      title: 'Getting started',
      description: 'A localized content collection example.',
      paragraphs: [
        'Collection entries define the data. Dictionaries provide the text for each language.'
      ]
    }
  },
  messages: {
    invalidInput: 'Check the submitted information.',
    loadError: 'Content could not be loaded. Please try again.',
    createError: 'Content could not be saved. Please try again.',
    notAuthorized: 'You are not authorized to change this content.'
  }
} satisfies Content
