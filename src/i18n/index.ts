import { defaultLocale, locales, type Locale } from './config'
import enUS from './dictionaries/en-us'
import esMX from './dictionaries/es-mx'
import esES from './dictionaries/es-es'
import type { Dictionary } from './types'

const dictionaries = {
  'en-us': enUS,
  'es-mx': esMX,
  'es-es': esES
} satisfies Record<Locale, Dictionary>

const isLocale = (value: string | undefined): value is Locale =>
  locales.some((locale) => locale === value)

export const resolveLocale = (value?: string): Locale => {
  const normalized = value?.toLowerCase()
  return isLocale(normalized) ? normalized : defaultLocale
}

export const getDictionary = (locale?: string): Dictionary =>
  dictionaries[resolveLocale(locale)]
