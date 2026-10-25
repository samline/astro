import { z } from 'astro/zod'
import { requestJson } from '../../server/content-api/request'
import type { FetchEntries } from './types'

export const schema = z.object({
  documentId: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  locale: z.string(),
  publishedAt: z.string().min(1)
})
const responseSchema = z.object({
  data: schema.array().max(100),
  meta: z.object({
    pagination: z.object({
      page: z.number().int().positive(),
      pageCount: z.number().int().min(0).max(100)
    })
  })
})

/** Strapi 5 example content type: title, slug and localization/publication enabled. */
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
          status: 'published',
          sort: 'documentId:asc',
          'pagination[page]': String(page),
          'pagination[pageSize]': '100'
        }
      }
    )
    const pagination = result.meta.pagination
    if (
      pagination.page !== page ||
      (page > 1 && pagination.pageCount !== pages)
    )
      throw new Error('Unexpected or changing Strapi pagination.')
    pages = pagination.pageCount
    for (const value of result.data) {
      if (value.locale !== options.providerLocale)
        throw new Error('Strapi returned the wrong locale.')
      entries.push({
        id: `${options.locale}/${value.documentId}`,
        data: { ...value, locale: options.locale }
      })
    }
  }
  return entries
}
