// @ts-check
import { fileURLToPath } from 'node:url'
import { defineConfig, envField } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import { loadEnv } from 'vite'
import { defaultLocale, locales } from './src/i18n/config.ts'
import { seoConfig, resolveIndexing } from './src/config/seo.ts'

const root = fileURLToPath(new URL('.', import.meta.url))
const env = loadEnv(process.env.NODE_ENV ?? 'development', root, '')
const site =
  env.SITE_URL ||
  (env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4321')

const indexable = resolveIndexing(
  env,
  site,
  process.env.NODE_ENV === 'production'
)

export default defineConfig({
  output: 'static',
  adapter: vercel({ imageService: false }),
  site,
  trailingSlash: 'never',
  integrations: [
    ...(indexable
      ? [
          sitemap({
            filter: (page) => {
              const pathname = new URL(page).pathname.replace(/\/+$/, '') || '/'
              return !seoConfig.noindexPaths.some((entry) => {
                const path = entry.replace(/\/+$/, '') || '/'
                return [
                  path,
                  ...locales.map(
                    (locale) => `/${locale}${path === '/' ? '' : path}`
                  )
                ].includes(pathname)
              })
            },
            i18n: {
              defaultLocale,
              locales: Object.fromEntries(
                locales.map((locale) => [locale, locale])
              )
            }
          })
        ]
      : [])
  ],

  i18n: {
    defaultLocale,
    locales,
    routing: { prefixDefaultLocale: false }
  },

  image: {
    layout: 'constrained'
  },

  env: {
    schema: {
      SITE_INDEXABLE: envField.boolean({
        context: 'server',
        access: 'public',
        default: indexable
      }),
      SITE_URL: envField.string({
        context: 'server',
        access: 'public',
        url: true,
        default: site
      })
    }
  }
})
