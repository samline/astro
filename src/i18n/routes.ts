import { routes, type RouteName, type LocalizedPaths } from '@/config/routes'
import { locales, type Locale } from './config'

export type { RouteName, LocalizedPaths } from '@/config/routes'

/** Supply exactly one identity, shared by page metadata and language navigation. */
export type PageRoute =
  | { path: string; routeName?: never; localizedPaths?: never }
  | { routeName: RouteName; path?: never; localizedPaths?: never }
  | { localizedPaths: LocalizedPaths; path?: never; routeName?: never }

/** Resolve only declared, active translations; never infer a translated slug. */
export const resolveRoutePaths = (page: PageRoute): LocalizedPaths => {
  const identities = [page.path, page.routeName, page.localizedPaths].filter(
    (value) => value !== undefined
  )
  if (identities.length !== 1)
    throw new Error('Supply exactly one of path, routeName or localizedPaths.')
  const definition =
    page.routeName !== undefined
      ? Object.hasOwn(routes, page.routeName)
        ? routes[page.routeName]
        : undefined
      : (page.localizedPaths ??
        (page.path !== undefined
          ? page.path.split(/[?#]/)[0] || '/'
          : undefined))
  if (definition === undefined) throw new Error('Unknown route name.')
  const paths: LocalizedPaths = {}
  for (const locale of locales) {
    const path =
      typeof definition === 'string' ? definition : definition[locale]
    if (path === undefined) continue
    if (
      typeof path !== 'string' ||
      !path.startsWith('/') ||
      path.startsWith('//') ||
      /[\\?#\s]/.test(path) ||
      path.split('/').some((part) => part === '.' || part === '..')
    )
      throw new Error(
        'Routes must be locale-free site paths without queries or fragments.'
      )
    paths[locale] = path
  }
  return paths
}

export const routePath = (page: PageRoute, locale: Locale): string => {
  const path = resolveRoutePaths(page)[locale]
  if (path === undefined)
    throw new Error(`Route has no active translation for ${locale}.`)
  return path
}

/** Public named-page inventory for navigation or an HTML sitemap in one locale. */
export const routeEntries = (
  locale: Locale
): { routeName: RouteName; path: string }[] =>
  Object.keys(routes).flatMap((name) => {
    const routeName = name as RouteName
    const path = resolveRoutePaths({ routeName })[locale]
    return path === undefined ? [] : [{ routeName, path }]
  })
