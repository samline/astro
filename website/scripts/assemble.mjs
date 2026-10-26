import { cp, readFile, writeFile } from 'node:fs/promises'
await cp(
  new URL('../docs/dist/', import.meta.url),
  new URL('../landing/dist/docs/', import.meta.url),
  { recursive: true }
)
const index = new URL('../landing/dist/sitemap-index.xml', import.meta.url)
const [landing, docs] = await Promise.all([
  readFile(index, 'utf8'),
  readFile(new URL('../docs/dist/sitemap-index.xml', import.meta.url), 'utf8')
])
await writeFile(
  index,
  landing.replace(
    '</sitemapindex>',
    (docs.match(/<sitemap>.*?<\/sitemap>/g) ?? []).join('') + '</sitemapindex>'
  )
)
await writeFile(new URL('../landing/dist/.nojekyll', import.meta.url), '')
console.log(
  'Combined landing, examples, docs, search, fonts and sitemap into landing/dist.'
)
