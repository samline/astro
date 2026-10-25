import { z } from 'astro/zod'
import { availableLocales, type Locale } from '../../i18n/config'

export const postSchema = z.object({
  id: z
    .union([z.string().min(1), z.number().int().nonnegative()])
    .transform(String),
  title: z.string().min(1).max(200),
  locale: z.enum(availableLocales),
  draft: z.boolean().default(false)
})
export type ApiPost = z.output<typeof postSchema>

import { requestJson, type ApiOptions } from './request'
export { requestJson } from './request'
export type { ApiOptions, ApiRequest } from './request'

export const createContentApi = (options: ApiOptions) => ({
  listPosts: async (locale: Locale, page = 1) => {
    const { data } = await requestJson(
      options,
      'posts',
      z.object({
        success: z.literal(true).optional(),
        data: postSchema.array().max(100)
      }),
      {
        query: { locale, page: String(page), pageSize: '100', draft: 'false' }
      }
    )
    return data.filter((post) => post.locale === locale && !post.draft)
  },
  getPost: async (id: string, locale: Locale) => {
    try {
      const { data } = await requestJson(
        options,
        `posts/${encodeURIComponent(id)}`,
        z.object({ success: z.literal(true).optional(), data: postSchema }),
        { query: { locale } }
      )
      return data.locale === locale && !data.draft ? data : undefined
    } catch (error) {
      if (error instanceof Error && 'status' in error && error.status === 404)
        return undefined
      throw error
    }
  },
  createPost: async (input: { title: string; locale: Locale }) => {
    const { data } = await requestJson(
      options,
      'posts',
      z.object({ success: z.literal(true).optional(), data: postSchema }),
      { method: 'POST', body: input }
    )
    return data
  }
})
