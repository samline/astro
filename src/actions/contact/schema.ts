import { z } from 'astro/zod'
import { getDictionary } from '../../i18n'
import { defaultLocale, locales } from '../../i18n/config'

const fallback = getDictionary().forms.messages
const string = () => z.string({ error: fallback.invalidInput })

export const contactInput = z
  .object({
    locale: string().default(defaultLocale),
    name: string().trim(),
    email: string().trim(),
    phone: string().trim().optional().default(''),
    message: string().trim(),
    website: string().optional().default('')
  })
  .superRefine((input, context) => {
    const copy = getDictionary(input.locale).forms.messages
    const issue = (field: keyof typeof input, message: string) =>
      context.addIssue({ code: 'custom', path: [field], message })
    if (!locales.some((locale) => locale === input.locale))
      issue('locale', copy.invalidInput)
    for (const field of ['name', 'email', 'message'] as const) {
      if (!input[field]) issue(field, copy.required)
    }
    for (const [field, limit] of [
      ['name', 100],
      ['email', 254],
      ['phone', 30],
      ['message', 5000],
      ['website', 200]
    ] as const) {
      if (input[field].length > limit) issue(field, copy.tooLong)
      if (input[field].includes('\0')) issue(field, copy.invalidInput)
    }
    if (input.email && !z.email().safeParse(input.email).success)
      issue('email', copy.invalidEmail)
    if (
      input.phone &&
      (!/^\+?[\d ().-]{6,30}$/.test(input.phone) || !/\d/.test(input.phone))
    )
      issue('phone', copy.invalidPhone)
  })
