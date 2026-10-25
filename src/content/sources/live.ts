import type { LiveLoader } from 'astro/loaders'
import { getSecret } from 'astro:env/server'
import { locales, type Locale } from '../../i18n/config'
import type { FetchEntries, SourceEntry } from './types'

export const sourceLiveLoader = (
  prefix: string,
  fetchEntries: FetchEntries,
  localeMap: Partial<Record<Locale, string>>
): LiveLoader<
  Record<string, unknown>,
  { id: string; locale: Locale },
  { locale: Locale }
> => {
  const load = async (locale: Locale): Promise<SourceEntry[]> => {
    if (!locales.includes(locale) || !localeMap[locale])
      throw new Error('Unsupported collection locale.')
    const url = getSecret(`${prefix}_URL`)
    const endpoint = getSecret(`${prefix}_ENDPOINT`)
    if (!url || !endpoint)
      throw new Error('Configure the collection before enabling live reads.')
    const entries = await fetchEntries({
      url,
      endpoint,
      token: getSecret(`${prefix}_TOKEN`),
      locale,
      providerLocale: localeMap[locale]
    })
    if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
      throw new Error('Duplicate live entry ID.')
    return entries
  }
  return {
    name: `samline-${prefix.toLowerCase()}-live`,
    loadCollection: async ({ filter }) => {
      try {
        if (!filter) throw new Error('A locale filter is required.')
        return { entries: await load(filter.locale) }
      } catch {
        return { error: new Error('Unable to load live content.') }
      }
    },
    loadEntry: async ({ filter }) => {
      try {
        return (await load(filter.locale)).find(
          (entry) => entry.id === filter.id
        )
      } catch {
        return { error: new Error('Unable to load the live entry.') }
      }
    }
  }
}
