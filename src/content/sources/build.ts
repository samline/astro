import type { Loader } from 'astro/loaders'
import { loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import { locales, type Locale } from '../../i18n/config'
import type { FetchEntries } from './types'

export const sourceLoader = (
  name: string,
  prefix: string,
  fetchEntries: FetchEntries,
  localeMap: Partial<Record<Locale, string>>
): Loader => ({
  name: `samline-${name}`,
  load: async (context) => {
    const env = {
      ...loadEnv(
        process.env.NODE_ENV ?? 'development',
        fileURLToPath(context.config.root),
        ''
      ),
      ...process.env
    }
    const url = env[`${prefix}_URL`]
    const endpoint = env[`${prefix}_ENDPOINT`]
    if (!url || !endpoint)
      throw new Error(
        `Configure ${prefix}_URL and ${prefix}_ENDPOINT before enabling this collection.`
      )
    const entries = []
    const ids = new Set<string>()
    for (const locale of locales) {
      if (!localeMap[locale])
        throw new Error(`Configure the provider mapping for ${locale}.`)
      for (const entry of await fetchEntries({
        url,
        endpoint,
        token: env[`${prefix}_TOKEN`],
        locale,
        providerLocale: localeMap[locale]
      })) {
        if (ids.has(entry.id)) throw new Error('Duplicate collection ID.')
        ids.add(entry.id)
        entries.push({ id: entry.id, data: await context.parseData(entry) })
      }
    }
    context.store.clear()
    for (const entry of entries)
      context.store.set({
        ...entry,
        digest: context.generateDigest(entry.data)
      })
  }
})
