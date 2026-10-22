import { defaultLocale, locales, type Locale } from './config'
import enUS from './dictionaries/en-us'
import enMX from './dictionaries/en-mx'
import type { Dictionary } from './types'

const dictionaries = {
  'en-us': enUS,
  'en-mx': enMX
} satisfies Record<Locale, Dictionary>

function isLocale(value: string | undefined): value is Locale {
  return locales.some((locale) => locale === value)
}

export function resolveLocale(value?: string): Locale {
  const normalized = value?.toLowerCase()
  return isLocale(normalized) ? normalized : defaultLocale
}

export function getDictionary(locale?: string): Dictionary {
  return dictionaries[resolveLocale(locale)]
}
