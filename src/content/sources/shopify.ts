import { z } from 'astro/zod'
import { requestJson } from '../../server/content-api/request'
import type { FetchEntries } from './types'

export const schema = z.object({
  id: z.string().min(1),
  handle: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  featuredImage: z
    .object({ url: z.url(), altText: z.string().nullable() })
    .nullable(),
  priceRange: z.object({
    minVariantPrice: z.object({ amount: z.string(), currencyCode: z.string() })
  }),
  locale: z.string()
})
const productSchema = schema.omit({ locale: true })
const responseSchema = z.object({
  errors: z.array(z.unknown()).optional(),
  data: z
    .object({
      products: z.object({
        nodes: productSchema.array().max(100),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable()
        })
      })
    })
    .optional()
})
const query = `query Products($after: String, $language: LanguageCode!) @inContext(language: $language) {
  products(first: 100, after: $after, sortKey: ID) {
    nodes { id handle title description featuredImage { url altText } priceRange { minVariantPrice { amount currencyCode } } }
    pageInfo { hasNextPage endCursor }
  }
}`

/** Read-only Storefront example. Configure the language mapping explicitly. */
export const fetchEntries: FetchEntries = async (options) => {
  const entries = []
  const cursors = new Set<string>()
  let after: string | null = null
  for (let page = 0; page < 100; page++) {
    const result: z.output<typeof responseSchema> = await requestJson(
      {
        ...options,
        token: undefined,
        headers: { 'X-Shopify-Storefront-Access-Token': options.token ?? '' }
      },
      options.endpoint,
      responseSchema,
      {
        method: 'POST',
        body: { query, variables: { after, language: options.providerLocale } }
      }
    )
    if (result.errors?.length || !result.data)
      throw new Error('Shopify returned GraphQL errors or no data.')
    const { nodes, pageInfo } = result.data.products
    for (const value of nodes)
      entries.push({
        id: `${options.locale}/${value.id}`,
        data: { ...value, locale: options.locale }
      })
    if (!pageInfo.hasNextPage) return entries
    if (!pageInfo.endCursor || cursors.has(pageInfo.endCursor))
      throw new Error('Shopify pagination did not advance.')
    after = pageInfo.endCursor
    cursors.add(pageInfo.endCursor)
  }
  throw new Error('Shopify pagination limit exceeded.')
}
