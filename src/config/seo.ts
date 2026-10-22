export interface SocialImage {
  src: string
  alt: string
  width?: number
  height?: number
  type?: string
}

export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
export type StructuredData = { [key: string]: JsonValue }

interface SEOConfig {
  themeColor: string
  image: Omit<SocialImage, 'alt'> | null
  twitter: { site?: string; creator?: string }
  appleTouchIcon?: string
  manifest?: string
  // Locale-free paths, shared by meta robots and the sitemap filter.
  noindexPaths: string[]
}

export const seoConfig: SEOConfig = {
  themeColor: '#171123',
  image: null,
  twitter: {},
  noindexPaths: ['/404']
}

export function resolveIndexing(
  env: Record<string, string | undefined>,
  site: string,
  production: boolean
): boolean {
  if (env.SITE_INDEXABLE !== undefined) {
    if (!['true', 'false'].includes(env.SITE_INDEXABLE)) {
      throw new Error('SITE_INDEXABLE debe ser true o false.')
    }
    return env.SITE_INDEXABLE === 'true'
  }
  const hostname = new URL(site).hostname
  const local =
    ['localhost', '127.0.0.1', '[::1]'].includes(hostname) ||
    hostname.endsWith('.localhost')
  const preview =
    env.VERCEL_ENV === 'preview' ||
    ['deploy-preview', 'branch-deploy'].includes(env.CONTEXT ?? '')
  return production && !local && !preview
}

export function isNoindexPath(path: string): boolean {
  const normalized = path.replace(/\/+$/, '') || '/'
  return seoConfig.noindexPaths.some(
    (entry) => (entry.replace(/\/+$/, '') || '/') === normalized
  )
}
