import type { LiveLoader } from 'astro/loaders'
import { defaultLocale, locales, type Locale } from '../../i18n/config'
import type { ApiPost, createContentApi } from '../../server/content-api/client'

export const postsLiveLoader = (
  api: () => ReturnType<typeof createContentApi>
): LiveLoader<
  ApiPost,
  { id: string; locale?: Locale },
  { locale?: Locale }
> => ({
  name: 'kit-live-posts',
  loadCollection: async ({ filter }) => {
    const locale = filter?.locale ?? defaultLocale
    if (!locales.includes(locale))
      return { error: new Error('Unsupported content locale.') }
    try {
      const posts = await api().listPosts(locale)
      return { entries: posts.map((data) => ({ id: data.id, data })) }
    } catch {
      return { error: new Error('Unable to load live posts.') }
    }
  },
  loadEntry: async ({ filter }) => {
    const locale = filter.locale ?? defaultLocale
    if (!locales.includes(locale))
      return { error: new Error('Unsupported content locale.') }
    try {
      const data = await api().getPost(filter.id, locale)
      return data ? { id: data.id, data } : undefined
    } catch {
      return { error: new Error('Unable to load the live post.') }
    }
  }
})
