export type CurrentMatch = 'exact' | 'descendants'

const normalizePath = (value: string) => value.replace(/\/+$/, '') || '/'

/** Resolve route identity without DOM state; usable during rendering or in a browser owner. */
export const currentDestination = (
  destination: URL,
  current: URL,
  match: CurrentMatch = 'exact',
  rootPath = '/'
): 'page' | 'location' | undefined => {
  if (destination.origin !== current.origin) return
  const target = normalizePath(destination.pathname)
  const path = normalizePath(current.pathname)
  const root = normalizePath(rootPath)
  const withinRoot = (value: string) =>
    root === '/' || value === root || value.startsWith(`${root}/`)
  if (!withinRoot(target) || !withinRoot(path)) return
  if (destination.hash)
    return target === path && destination.hash === current.hash
      ? 'location'
      : undefined
  if (target === path) return 'page'
  if (
    match === 'descendants' &&
    target !== root &&
    path.startsWith(`${target}/`)
  )
    return 'location'
  return
}
