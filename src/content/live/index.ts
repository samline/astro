import { defaultLocale, locales, type Locale } from '../../i18n/config'
import {
  postSchema,
  type ApiPost,
  type createContentApi
} from '../../server/content-api/client'
import { apiLiveLoader } from './api'

export const postsLiveLoader = (
  api: () => ReturnType<typeof createContentApi>
) =>
  apiLiveLoader<
    ApiPost,
    ApiPost,
    { id: string; locale?: Locale },
    { locale?: Locale }
  >({
    name: 'kit-live-posts',
    inputSchema: postSchema,
    schema: postSchema,
    id: (item) => item.id,
    map: (item) => item,
    errors: {
      collection: 'Unable to load live posts.',
      entry: 'Unable to load the live post.'
    },
    loadCollection: async ({ filter }) => {
      const locale = filter?.locale ?? defaultLocale
      if (!locales.includes(locale))
        throw new Error('Unsupported content locale.')
      return api().listPosts(locale)
    },
    loadEntry: async ({ filter }) => {
      const locale = filter.locale ?? defaultLocale
      if (!locales.includes(locale))
        throw new Error('Unsupported content locale.')
      return api().getPost(filter.id, locale)
    }
  })
