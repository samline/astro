import { getSecret } from 'astro:env/server'
import { createContentApi } from './client'

export const getContentApi = () => {
  const url = getSecret('CONTENT_API_URL')
  if (!url) throw new Error('Missing CONTENT_API_URL.')
  return createContentApi({ url, token: getSecret('CONTENT_API_TOKEN') })
}
