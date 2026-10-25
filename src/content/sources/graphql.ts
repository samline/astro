import { z } from 'astro/zod'
import { requestJson } from '../../server/content-api/request'
import type { FetchEntries } from './types'

export const schema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  locale: z.string(),
  draft: z.boolean()
})
const responseSchema = z.object({
  errors: z.array(z.unknown()).optional(),
  data: z
    .object({
      items: z.object({
        nodes: schema.array().max(100),
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable()
        })
      })
    })
    .optional()
})

/** Custom GraphQL example: replace this query/schema with your service contract. */
const query = `query Items($after: String, $locale: String!) {
  items(first: 100, after: $after, locale: $locale, published: true) {
    nodes { id title locale draft }
    pageInfo { hasNextPage endCursor }
  }
}`
export const fetchEntries: FetchEntries = async (options) => {
  const entries = []
  const cursors = new Set<string>()
  let after: string | null = null
  for (let page = 0; page < 100; page++) {
    const result: z.output<typeof responseSchema> = await requestJson(
      options,
      options.endpoint,
      responseSchema,
      {
        method: 'POST',
        body: { query, variables: { after, locale: options.providerLocale } }
      }
    )
    if (result.errors?.length || !result.data)
      throw new Error('GraphQL returned errors or no data.')
    const { nodes, pageInfo } = result.data.items
    for (const value of nodes) {
      if (value.draft || value.locale !== options.providerLocale)
        throw new Error('GraphQL returned unpublished or wrong-locale content.')
      entries.push({
        id: `${options.locale}/${value.id}`,
        data: { ...value, locale: options.locale }
      })
    }
    if (!pageInfo.hasNextPage) return entries
    if (!pageInfo.endCursor || cursors.has(pageInfo.endCursor))
      throw new Error('GraphQL pagination did not advance.')
    after = pageInfo.endCursor
    cursors.add(pageInfo.endCursor)
  }
  throw new Error('GraphQL pagination limit exceeded.')
}
