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

export interface ApiOptions {
  url: string
  token?: string
  fetcher?: typeof fetch
}

export const requestJson = async <Schema extends z.ZodType>(
  options: ApiOptions,
  path: string,
  schema: Schema,
  request: {
    method?: 'GET' | 'POST'
    query?: Record<string, string>
    body?: unknown
  } = {}
): Promise<z.output<Schema>> => {
  const base = new URL(
    options.url.endsWith('/') ? options.url : options.url + '/'
  )
  if (
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    (base.protocol !== 'https:' &&
      !(
        base.protocol === 'http:' &&
        ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)
      ))
  ) {
    throw new Error(
      'Content API URL requires HTTPS, or HTTP on loopback for development.'
    )
  }
  if (
    !path ||
    path.startsWith('/') ||
    path.split('/').some((part) => part === '..') ||
    path.includes(':') ||
    path.includes('\\')
  ) {
    throw new Error(
      'Content API paths must be relative to the configured base.'
    )
  }
  const url = new URL(path, base)
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname))
    throw new Error('Content API path escaped its base.')
  for (const [key, value] of Object.entries(request.query ?? {}))
    url.searchParams.set(key, value)
  const method = request.method ?? 'GET'
  const response = await (options.fetcher ?? fetch)(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {})
    },
    body: method === 'POST' ? JSON.stringify(request.body) : undefined,
    signal: AbortSignal.timeout(10000),
    redirect: 'error'
  }).catch(() => {
    throw new Error('Content API connection failed.')
  })
  if (!response.ok)
    throw Object.assign(new Error('Content API request failed.'), {
      status: response.status
    })
  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw new Error('Content API returned invalid JSON.')
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success)
    throw new Error('Content API response did not match its schema.')
  return parsed.data
}

export const createContentApi = (options: ApiOptions) => ({
  listPosts: async (locale: Locale, page = 1) => {
    const { data } = await requestJson(
      options,
      'posts',
      z.object({ data: postSchema.array().max(100) }),
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
        z.object({ data: postSchema }),
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
      z.object({ data: postSchema }),
      { method: 'POST', body: input }
    )
    return data
  }
})
