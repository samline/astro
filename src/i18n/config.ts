export const availableLocales = ['en-us', 'es-mx', 'es-es'] as const
export type Locale = (typeof availableLocales)[number]

export const defaultLocale: Locale = 'en-us'

// Uncomment a locale to enable its routes, language links and sitemap entries.
export const locales: Locale[] = [defaultLocale]
// locales.push('es-mx')
