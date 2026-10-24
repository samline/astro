import { ActionError, defineAction } from 'astro:actions'
import type { APIContext } from 'astro'
import { z } from 'astro/zod'
import { getDictionary } from '../../i18n'
import { availableLocales, defaultLocale, locales } from '../../i18n/config'
import { getContentApi } from '../../server/content-api'

const messages = getDictionary().content.messages
const localeInput = z
  .enum(availableLocales, { error: messages.invalidInput })
  .refine((locale) => locales.includes(locale), {
    error: messages.invalidInput
  })
  .default(defaultLocale)

// Replace with the project's server-side session/role check before enabling writes.
const canCreatePost = (_context: Pick<APIContext, 'locals'>): boolean => false

export const contentDemo = {
  list: defineAction({
    input: z.object({
      locale: localeInput,
      page: z
        .number({ error: messages.invalidInput })
        .int({ error: messages.invalidInput })
        .min(1, { error: messages.invalidInput })
        .max(100, { error: messages.invalidInput })
        .default(1)
    }),
    handler: async ({ locale, page }) => {
      try {
        return { posts: await getContentApi().listPosts(locale, page) }
      } catch {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: getDictionary(locale).content.messages.loadError
        })
      }
    }
  }),
  create: defineAction({
    input: z.object({
      locale: localeInput,
      title: z
        .string({ error: messages.invalidInput })
        .trim()
        .min(1, { error: messages.invalidInput })
        .max(200, { error: messages.invalidInput })
    }),
    handler: async ({ locale, title }, context) => {
      const copy = getDictionary(locale).content.messages
      if (!canCreatePost(context))
        throw new ActionError({
          code: 'FORBIDDEN',
          message: copy.notAuthorized
        })
      if (context.request.headers.get('origin') !== context.url.origin)
        throw new ActionError({
          code: 'FORBIDDEN',
          message: copy.notAuthorized
        })
      try {
        return { post: await getContentApi().createPost({ locale, title }) }
      } catch {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: copy.createError
        })
      }
    }
  })
}
