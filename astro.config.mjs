// @ts-check
import { fileURLToPath } from 'node:url'
import { defineConfig, envField } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'
import { loadEnv } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))
const env = loadEnv(process.env.NODE_ENV ?? 'development', root, '')
const site =
  env.SITE_URL ||
  (env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:4321')

export default defineConfig({
  // Pages are prerendered. Only components marked server:defer run on demand.
  output: 'static',
  adapter: vercel({ imageService: false }),
  site,
  trailingSlash: 'never',
  integrations: [sitemap()],

  image: {
    layout: 'constrained'
  },

  env: {
    schema: {
      SITE_URL: envField.string({
        context: 'server',
        access: 'public',
        url: true,
        default: site
      }),
      PUBLIC_SITE_NAME: envField.string({
        context: 'client',
        access: 'public',
        default: 'Astro Kit'
      })
    }
  }
})
