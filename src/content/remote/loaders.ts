import type { Loader, LoaderContext } from 'astro/loaders'
import { z } from 'astro/zod'
import { loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import { locales, availableLocales } from '../../i18n/config'
import {
  createContentApi,
  type ApiOptions,
  requestJson
} from '../../server/content-api/client'

const buildOptions = (context: LoaderContext) => {
  const env = loadEnv(
    process.env.NODE_ENV ?? 'development',
    fileURLToPath(context.config.root),
    ''
  )
  if (!env.CONTENT_API_URL)
    throw new Error('Missing CONTENT_API_URL for the content loader.')
  return { url: env.CONTENT_API_URL, token: env.CONTENT_API_TOKEN }
}

const commitSnapshot = async (
  context: LoaderContext,
  entries: { id: string; data: Record<string, unknown> }[]
) => {
  const seen = new Set<string>()
  const validated = []
  for (const entry of entries) {
    if (seen.has(entry.id))
      throw new Error('Content API returned duplicate entry IDs.')
    seen.add(entry.id)
    validated.push({ id: entry.id, data: await context.parseData(entry) })
  }
  context.store.clear()
  for (const entry of validated)
    context.store.set({ ...entry, digest: context.generateDigest(entry.data) })
}

export const apiPostsLoader = (options?: ApiOptions): Loader => ({
  name: 'kit-api-posts',
  load: async (context) => {
    const api = createContentApi(options ?? buildOptions(context))
    const entries = []
    for (const locale of locales) {
      const posts = await api.listPosts(locale)
      entries.push(
        ...posts.map((post) => ({ id: `${locale}/${post.id}`, data: post }))
      )
    }
    await commitSnapshot(context, entries)
  }
})

export const storeSchema = z.object({
  documentId: z.string().min(1),
  locale: z
    .string()
    .transform((locale) => locale.toLowerCase())
    .pipe(z.enum(availableLocales)),
  name: z.string().min(1),
  url: z
    .url()
    .refine((url) => ['https:', 'http:'].includes(new URL(url).protocol))
})
const strapiResponse = z.object({
  data: storeSchema.array().max(100),
  meta: z.object({
    pagination: z.object({
      page: z.number().int().min(1),
      pageCount: z.number().int().min(0).max(100)
    })
  })
})

export const strapiStoresLoader = (configuration?: ApiOptions): Loader => ({
  name: 'kit-strapi-stores',
  load: async (context) => {
    const options = configuration ?? buildOptions(context)
    const entries = []
    for (const locale of locales) {
      const [language, region] = locale.split('-')
      const cmsLocale = `${language}-${region.toUpperCase()}`
      let pages = 1
      for (let page = 1; page <= pages; page++) {
        const result = await requestJson(options, 'stores', strapiResponse, {
          query: {
            locale: cmsLocale,
            status: 'published',
            sort: 'documentId:asc',
            'pagination[page]': String(page),
            'pagination[pageSize]': '100'
          }
        })
        if (result.meta.pagination.page !== page)
          throw new Error('Strapi returned an unexpected page.')
        if (page > 1 && result.meta.pagination.pageCount !== pages)
          throw new Error('Strapi pagination changed during loading.')
        pages = result.meta.pagination.pageCount
        for (const item of result.data) {
          if (item.locale.toLowerCase() !== locale)
            throw new Error('Strapi returned an unexpected locale.')
          entries.push({
            id: `${locale}/${item.documentId}`,
            data: { ...item, locale }
          })
        }
      }
    }
    await commitSnapshot(context, entries)
  }
})
