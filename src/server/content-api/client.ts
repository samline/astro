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

export type ApiRequest = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, string | readonly string[]>
  body?: unknown
  signal?: AbortSignal
}

export const requestJson = async <Schema extends z.ZodType>(
  options: ApiOptions,
  path: string,
  schema: Schema,
  request: ApiRequest = {}
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
    path.includes('\\') ||
    path.includes('?') ||
    path.includes('#') ||
    /%2f|%5c/i.test(path)
  ) {
    throw new Error(
      'Content API paths must be relative to the configured base.'
    )
  }
  const url = new URL(path, base)
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname))
    throw new Error('Content API path escaped its base.')
  for (const [key, value] of Object.entries(request.query ?? {})) {
    for (const item of typeof value === 'string' ? [value] : value)
      url.searchParams.append(key, item)
  }
  const method = request.method ?? 'GET'
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method))
    throw new Error('Unsupported content API method.')
  if (method === 'GET' && request.body !== undefined)
    throw new Error('GET requests cannot include a JSON body.')
  const signal = request.signal
    ? AbortSignal.any([request.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000)
  if (signal.aborted) throw new Error('Content API request was aborted.')
  const body =
    request.body === undefined ? undefined : JSON.stringify(request.body)
  const response = await (options.fetcher ?? fetch)(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
    },
    body,
    signal,
    redirect: 'error'
  }).catch(() => {
    throw new Error('Content API connection failed.')
  })
  if (!response.ok) {
    await response.body?.cancel().catch(() => {})
    throw Object.assign(new Error('Content API request failed.'), {
      status: response.status
    })
  }
  let json: unknown
  if (response.status !== 204) {
    const limit = 2 * 1024 * 1024
    if (Number(response.headers.get('content-length')) > limit) {
      await response.body?.cancel().catch(() => {})
      throw new Error('Content API response exceeded its size limit.')
    }
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let text = ''
    let bytes = 0
    const abort = () => {
      void reader?.cancel().catch(() => {})
    }
    signal.addEventListener('abort', abort, { once: true })
    try {
      signal.throwIfAborted()
      if (reader) {
        while (true) {
          const chunk = await reader.read()
          signal.throwIfAborted()
          if (chunk.done) break
          bytes += chunk.value.byteLength
          if (bytes > limit) {
            await reader.cancel()
            throw new Error('Content API response exceeded its size limit.')
          }
          text += decoder.decode(chunk.value, { stream: true })
        }
      }
      text += decoder.decode()
      json = JSON.parse(text)
    } catch {
      throw new Error('Content API returned unreadable or oversized JSON.')
    } finally {
      signal.removeEventListener('abort', abort)
      reader?.releaseLock()
    }
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
