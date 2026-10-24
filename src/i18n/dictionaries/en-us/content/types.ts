export interface Content {
  posts: {
    gettingStarted: { title: string; description: string; paragraphs: string[] }
  }
  messages: {
    invalidInput: string
    loadError: string
    createError: string
    notAuthorized: string
  }
}
