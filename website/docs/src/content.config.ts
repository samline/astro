import { defineCollection } from 'astro:content'
import { z } from 'astro/zod'
import { glob } from 'astro/loaders'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative } from 'node:path'
import references from '../../shared/data/references.json'
import en from './i18n/translations/en'
const articles = glob({
  pattern: '**/*.{md,mdx}',
  base: './src/content/docs',
  generateId: ({ entry }) => entry.replace(/\.mdx?$/, '')
})
const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url))
const sourceBody = async (source: string) => {
  const text = await readFile(resolve(repositoryRoot, source), 'utf8')
  const prose = text.replace(/^# .+\n/, '')
  // Source READMEs keep repository-relative links. Resolve those for the website.
  return prose.replace(/(\]\()([^\s)]+)(\))/g, (whole, before, href, after) => {
    if (/^(?:[a-z]+:|#|\/\/)/i.test(href)) return whole
    const path = relative(
      repositoryRoot,
      resolve(repositoryRoot, dirname(source), href)
    )
      .split('/')
      .map(encodeURIComponent)
      .join('/')
      .replace(/%23/g, '#')
    return `${before}https://github.com/samline/astro/blob/main/${path}${after}`
  })
}
const docs = defineCollection({
  loader: {
    name: 'samline-astro-documentation',
    load: async (context) => {
      await articles.load(context)
      const entries = [
        ...references,
        {
          id: 'changelog',
          title: en.changelog.title,
          description: en.changelog.description,
          source: 'website/CHANGELOG.md',
          group: 'guides',
          order: 7
        }
      ]
      for (const entry of entries) {
        const loadEntry = async () => {
          const body = await sourceBody(entry.source)
          const data = await context.parseData({
            id: entry.id,
            data: {
              title: entry.title,
              description: entry.description,
              locale: 'en',
              sidebar: { group: entry.group, order: entry.order }
            }
          })
          context.store.set({
            id: entry.id,
            data,
            body,
            digest: context.generateDigest(body + JSON.stringify(data)),
            rendered: await context.renderMarkdown(body, {
              fileURL: new URL(entry.source, `file://${repositoryRoot}/`)
            })
          })
        }
        await loadEntry()
        const source = resolve(repositoryRoot, entry.source)
        context.watcher?.add(source)
        context.watcher?.on('change', async (path) => {
          if (path === source) await loadEntry()
        })
      }
    }
  },
  schema: z.object({
    title: z.string().trim().min(1),
    titleAccent: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1),
    locale: z.enum(['en']),
    sidebar: z.object({
      group: z.enum(['start', 'guides', 'reference', 'api']),
      order: z.number().int().positive()
    })
  })
})
export const collections = { docs }
