import type { Locale } from '@/i18n/config'

/** Stable identities for real pages. Labels belong in dictionaries. */
export const routeNames = {
  home: 'home.index'
} as const

export type RouteName = (typeof routeNames)[keyof typeof routeNames]
export type LocalizedPaths = Partial<Record<Locale, string>>

/** A string shares one locale-free path; a map lists available translations. */
export const routes: Record<RouteName, string | LocalizedPaths> = {
  [routeNames.home]: '/'
}
