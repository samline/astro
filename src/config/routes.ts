import type { Locale } from '../i18n/config'
import { localeRoutes } from '../i18n/route-tables'

/** Stable identities for public pages; URLs live with each locale's translations. */
export const routeNames = {
  home: 'home.index',
  demo: 'demo.index'
} as const

export type RouteName = (typeof routeNames)[keyof typeof routeNames]
/** null explicitly records an unavailable translation. */
export type RouteTable = Record<RouteName, string | null>
export type LocalizedPaths = Partial<Record<Locale, string>>

/** Derived cross-language view. Edit dictionaries/<locale>/routes.ts instead. */
export const routes = Object.fromEntries(
  Object.values(routeNames).map((name) => [
    name,
    Object.fromEntries(
      Object.entries(localeRoutes).flatMap(([locale, table]) => {
        const path = table[name]
        return path === null ? [] : [[locale, path]]
      })
    )
  ])
) as Record<RouteName, LocalizedPaths>
