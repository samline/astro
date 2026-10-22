import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { defaultLocale, locales } from '../src/i18n/config.ts'
import { getDictionary, resolveLocale } from '../src/i18n/index.ts'
import enUS from '../src/i18n/dictionaries/en-us/index.ts'
import enMX from '../src/i18n/dictionaries/en-mx/index.ts'
import { findUntranslatedText } from '../scripts/check-i18n.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))

test('each locale separates translation modules into index and types files', async () => {
  const modules = [
    'common',
    'forms',
    'buttons',
    'site',
    'navigation',
    'languages',
    'welcome',
    'errors',
    'seo'
  ]
  for (const locale of ['en-us', 'en-mx']) {
    const directory = path.join(root, 'src/i18n/dictionaries', locale)
    for (const module of modules) {
      assert.ok(
        (
          await readFile(path.join(directory, module, 'index.ts'), 'utf8')
        ).includes('satisfies ')
      )
      assert.ok(
        (
          await readFile(path.join(directory, module, 'types.ts'), 'utf8')
        ).includes('export ')
      )
    }
    await assert.rejects(readFile(`${directory}.ts`), /ENOENT/)
  }
  assert.equal(enUS.buttons.backHome, 'Back to home')
  assert.equal(enUS.common.backHome, undefined)
})

test('default locale, fallback and dictionary parity', () => {
  assert.equal(defaultLocale, 'en-us')
  assert.deepEqual(locales, ['en-us'])
  assert.equal(resolveLocale('en-US'), 'en-us')
  assert.equal(resolveLocale('unknown'), 'en-us')
  assert.equal(resolveLocale('en-mx'), 'en-us')
  assert.equal(getDictionary(undefined), enUS)
  const keys = (object, prefix = '') =>
    Object.entries(object)
      .flatMap(([key, value]) => {
        const name = `${prefix}${key}`
        if (typeof value === 'object') return keys(value, `${name}.`)
        assert.equal(typeof value, 'string', name)
        assert.ok(value.trim(), name)
        return [name]
      })
      .sort()
  assert.deepEqual(keys(enMX), keys(enUS))
})

test('enabled locales select their own dictionary', () => {
  locales.push('en-mx')
  try {
    assert.equal(getDictionary('en-MX'), enMX)
  } finally {
    locales.pop()
  }
})

test('translation guard catches copy, labels and metadata while allowing dictionary expressions', () => {
  for (const source of [
    '<h1>Loose text</h1>',
    '<img alt="Loose alt" />',
    '<input placeholder="Loose placeholder" />',
    '<button aria-label="Loose label" />',
    '<p>{"Loose expression"}</p>',
    '<p>{`Loose template`}</p>',
    '<p>{enabled ? "Loose condition" : dictionary.common.loading}</p>',
    '<input placeholder={"Loose placeholder"} />',
    '<meta name="description" content="Loose description" />',
    '<meta property="og:image:alt" content="Loose description" />',
    '<meta name="twitter:image:alt" content="Loose description" />'
  ])
    assert.ok(findUntranslatedText(source).length, source)
  assert.deepEqual(
    findUntranslatedText(
      '<h1 id={"heading"}>{dictionary.site.title}</h1><img alt="" /><a href={"https://example.com"}>{dictionary.navigation.home}</a><style>h1 { color: red; }</style>'
    ),
    []
  )
})

test(
  'SSG only publishes enabled locales with translated HTML, metadata and sitemap',
  { timeout: 30000 },
  async (t) => {
    const fixture = await mkdtemp(path.join(tmpdir(), 'astro-kit-i18n-'))
    t.after(() => rm(fixture, { recursive: true, force: true }))
    await cp(path.join(root, 'src'), path.join(fixture, 'src'), {
      recursive: true
    })
    for (const file of [
      'astro.config.mjs',
      'package.json',
      'tsconfig.json',
      'bunfig.toml',
      'vercel.json'
    ]) {
      await cp(path.join(root, file), path.join(fixture, file))
    }
    await symlink(
      path.join(root, 'node_modules'),
      path.join(fixture, 'node_modules'),
      'junction'
    )
    const build = () => {
      const result = spawnSync(
        process.execPath,
        [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
        {
          cwd: fixture,
          env: {
            ...process.env,
            NODE_ENV: 'production',
            SITE_URL: 'https://i18n.example'
          },
          encoding: 'utf8',
          timeout: 15000
        }
      )
      assert.equal(result.status, 0, result.stdout + result.stderr)
    }
    const about = `---
import { defaultLocale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n'
import Layout from '@/layouts/Layout.astro'
import LanguagePicker from '@/components/LanguagePicker.astro'
export const getStaticPaths = () => locales.map((locale) => ({
  params: { locale: locale === defaultLocale ? undefined : locale }
}))
const dictionary = getDictionary(Astro.currentLocale)
---
<Layout path='/about'>
  <main id='main-content'>{dictionary.navigation.home}</main>
  <LanguagePicker path='/about' />
</Layout>`
    await writeFile(
      path.join(fixture, 'src/pages/[...locale]/about.astro'),
      about
    )
    build()
    const home = await readFile(path.join(fixture, 'dist/index.html'), 'utf8')
    assert.match(home, /lang="en-us"/)
    assert.match(home, /<title>Astro Kit<\/title>/)
    assert.ok(!home.includes('hreflang="en-mx"'))
    await assert.rejects(
      readFile(path.join(fixture, 'dist/en-mx/index.html')),
      /ENOENT/
    )
    const config = path.join(fixture, 'src/i18n/config.ts')
    await writeFile(
      config,
      (await readFile(config, 'utf8')).replace(
        "// locales.push('en-mx')",
        "locales.push('en-mx')"
      )
    )
    const dictionary = path.join(
      fixture,
      'src/i18n/dictionaries/en-mx/welcome/index.ts'
    )
    await writeFile(
      dictionary,
      (await readFile(dictionary, 'utf8')).replace(
        'To get started, open the',
        'Regional welcome'
      )
    )
    build()
    const regional = await readFile(
      path.join(fixture, 'dist/en-mx/index.html'),
      'utf8'
    )
    assert.match(regional, /lang="en-mx"/)
    assert.ok(regional.includes('Regional welcome'))
    assert.ok(
      regional.includes('rel="canonical" href="https://i18n.example/en-mx"')
    )
    assert.ok(regional.includes('hreflang="en-us"'))
    assert.ok(regional.includes('hreflang="en-mx"'))
    assert.ok(regional.includes('aria-label="Select language"'))
    const regionalAbout = await readFile(
      path.join(fixture, 'dist/en-mx/about/index.html'),
      'utf8'
    )
    assert.match(regionalAbout, /lang="en-mx"/)
    assert.ok(
      regionalAbout.includes(
        'rel="canonical" href="https://i18n.example/en-mx/about"'
      )
    )
    assert.ok(regionalAbout.includes('href="/about"'))
    assert.ok(regionalAbout.includes('href="/en-mx/about"'))
    assert.match(regionalAbout, /href="\/en-mx\/about"[^>]*aria-current="page"/)
    assert.ok(!regionalAbout.includes('/en-mx/en-mx/'))
    const defaultAbout = await readFile(
      path.join(fixture, 'dist/about/index.html'),
      'utf8'
    )
    assert.match(defaultAbout, /lang="en-us"/)
    assert.ok(
      defaultAbout.includes('rel="canonical" href="https://i18n.example/about"')
    )
    const sitemap = await readFile(
      path.join(fixture, 'dist/sitemap-0.xml'),
      'utf8'
    )
    assert.ok(sitemap.includes('hreflang="en-mx"'))
    assert.ok(sitemap.includes('https://i18n.example/en-mx'))
    assert.ok(!sitemap.includes('/404'))
  }
)
