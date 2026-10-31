import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

const root = fileURLToPath(new URL('../../', import.meta.url))

export const createLinkFixture = async () => {
  const directory = await realpath(
    await mkdtemp(path.join(tmpdir(), 'astro-link-'))
  )
  const dispose = () => rm(directory, { recursive: true, force: true })
  try {
    for (const feature of ['components/Link', 'i18n', 'config'])
      await cp(
        path.join(root, 'src', feature),
        path.join(directory, 'src', feature),
        { recursive: true }
      )
    await cp(
      path.join(root, 'tsconfig.json'),
      path.join(directory, 'tsconfig.json')
    )
    const config = path.join(directory, 'src/i18n/config.ts')
    await writeFile(
      config,
      (await readFile(config, 'utf8')).replace(
        "// locales.push('es-mx')",
        "locales.push('es-mx')"
      )
    )
    await writeFile(path.join(directory, 'package.json'), '{"type":"module"}')
    await symlink(
      path.join(root, 'node_modules'),
      path.join(directory, 'node_modules'),
      'junction'
    )
    await writeFile(
      path.join(directory, 'astro.config.mjs'),
      `import { defineConfig } from 'astro/config'
export default defineConfig({ site: 'https://navigation.example', base: '/site', i18n: { defaultLocale: 'en-us', locales: ['en-us', 'es-mx'], routing: { prefixDefaultLocale: false } } })`
    )
    await mkdir(path.join(directory, 'src/pages/[...locale]/catalog'), {
      recursive: true
    })
    await writeFile(
      path.join(directory, 'src/components/Navigation.astro'),
      `---
import Link from './Link/index.astro'
---
<nav aria-label="Fixture">
  <Link id="home" href="/" currentMatch="descendants">Home</Link>
  <Link id="other-home" href="/site/" localize={false} currentMatch="descendants">Default language home</Link>
  <Link id="parent" href="/catalog" currentMatch="descendants">Catalog</Link>
  <Link id="exact" href="/catalog" currentMatch="exact">Exact</Link>
  <Link id="item" href="/catalog/item" currentMatch="exact">Item</Link>
  <Link id="new-tab" href="/catalog" target="_blank">New tab</Link>
  <Link id="default" href="/catalog" variant="nav">Manual</Link>
  <Link id="false" href="/catalog" currentMatch="descendants" aria-current="false">Disabled</Link>
  <Link id="override" href="/catalog" currentMatch="descendants" aria-current="step">Override</Link>
  <Link id="external" href="https://other.example/site/catalog" currentMatch="descendants">External</Link>
  <Link id="query" href="/catalog?view=grid" currentMatch="descendants">Query</Link>
  <Link id="fragment" href="/catalog#results" currentMatch="descendants">Fragment</Link>
</nav>`
    )
    const frontmatter = `import Navigation from '../../components/Navigation.astro'
import { defaultLocale, locales } from '../../i18n/config'
export const getStaticPaths = () => locales.map(locale => ({ params: { locale: locale === defaultLocale ? undefined : locale } }))`
    await writeFile(
      path.join(directory, 'src/pages/[...locale]/index.astro'),
      `---\n${frontmatter}\n---\n<html lang={Astro.currentLocale}><head><title>Links</title></head><body><Navigation /></body></html>`
    )
    await writeFile(
      path.join(directory, 'src/pages/[...locale]/catalog/[id].astro'),
      `---
import Navigation from '../../../components/Navigation.astro'
import { defaultLocale, locales } from '../../../i18n/config'
export const getStaticPaths = () => locales.map(locale => ({ params: { locale: locale === defaultLocale ? undefined : locale, id: 'item' } }))
---
<html lang={Astro.currentLocale}><head><title>Links</title></head><body><Navigation /></body></html>`
    )
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
      { cwd: directory, encoding: 'utf8', timeout: 30000 }
    )
    assert.equal(result.status, 0, result.stdout + result.stderr)
    return { directory, dispose }
  } catch (error) {
    await dispose()
    throw error
  }
}
