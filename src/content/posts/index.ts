import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'
import { availableLocales } from '../../i18n/config'

export const posts = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/posts/data' }),
  schema: z.object({
    locale: z.enum(availableLocales),
    copyKey: z.enum(['gettingStarted']),
    publishedAt: z.coerce.date(),
    draft: z.boolean().default(false)
  })
})
