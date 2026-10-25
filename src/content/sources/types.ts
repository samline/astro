import type { ApiOptions } from '../../server/content-api/request'
import type { Locale } from '../../i18n/config'

export type SourceOptions = ApiOptions & {
  endpoint: string
  locale: Locale
  providerLocale: string
}
export type SourceEntry = { id: string; data: Record<string, unknown> }
export type FetchEntries = (options: SourceOptions) => Promise<SourceEntry[]>
