import { z } from 'astro/zod'
import { requestJson } from '../../server/content-api/request'
import type { FetchEntries } from './types'

export const schema = z.object({
  id: z.string(),
  title: z.string().min(1),
  locale: z.string(),
  draft: z.boolean()
})
const responseSchema = z.object({
  success: z.literal(true).optional(),
  data: z
    .array(
      z.object({
        id: z
          .union([z.string().min(1), z.number().int().nonnegative()])
          .transform(String),
        title: z.string().min(1),
        locale: z.string(),
        draft: z.boolean().default(false)
      })
    )
    .max(100),
  meta: z.object({
    page: z.number().int().positive(),
    pageCount: z.number().int().min(0).max(100)
  })
})

/** Example contract: adapt schema and pagination to the actual API. */
export const fetchEntries: FetchEntries = async (options) => {
  const entries = []
  let pages = 1
  for (let page = 1; page <= pages; page++) {
    const result = await requestJson(
      options,
      options.endpoint,
      responseSchema,
      {
        query: {
          locale: options.providerLocale,
          page: String(page),
          pageSize: '100',
          draft: 'false'
        }
      }
    )
    if (
      result.meta.page !== page ||
      (page > 1 && result.meta.pageCount !== pages)
    )
      throw new Error('Unexpected or changing API pagination.')
    pages = result.meta.pageCount
    for (const value of result.data) {
      if (value.locale !== options.providerLocale || value.draft)
        throw new Error('API returned unpublished or wrong-locale content.')
      const data = schema.parse({ ...value, locale: options.locale })
      entries.push({ id: `${options.locale}/${data.id}`, data })
    }
  }
  return entries
}
