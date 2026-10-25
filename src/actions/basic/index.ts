import { ActionError, defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { getDictionary } from '../../i18n'
import { defaultLocale, locales } from '../../i18n/config'

const fallback = getDictionary().actions

/** A transport/validation example; no mail, database or upstream API required. */
export const basic = defineAction({
  accept: 'form',
  input: z.object({
    locale: z.string({ error: fallback.invalid }).default(defaultLocale),
    name: z
      .string({ error: fallback.invalid })
      .trim()
      .max(100, { error: fallback.invalid })
  }),
  handler: async ({ locale, name }, context) => {
    const copy = getDictionary(locale).actions
    if (context.request.headers.get('origin') !== context.url.origin)
      throw new ActionError({ code: 'FORBIDDEN', message: copy.forbidden })
    if (!name || !locales.some((value) => value === locale))
      throw new ActionError({ code: 'BAD_REQUEST', message: copy.invalid })
    return { message: copy.success, name }
  }
})
