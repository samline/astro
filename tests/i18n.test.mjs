import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
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
    'seo',
    'themes',
    'cookies',
    'mail',
    'content'
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
    await writeFile(path.join(fixture, 'outside-src.txt'), 'w-[917px]')
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
    await writeFile(
      path.join(fixture, 'src/sections/About.astro'),
      `---
import Section from '@/components/Section/index.astro'
import Box from '@/components/Box/index.astro'
import LanguagePicker from '@/components/LanguagePicker/index.astro'
import Link from '@/components/Link/index.astro'
import { getDictionary } from '@/i18n'
const dictionary = getDictionary(Astro.currentLocale)
const links = [
  { id: 'route', href: '/contact?from=home#form', target: '_blank', rel: 'nofollow sponsored' },
  { id: 'home', href: '/' },
  { id: 'localized', href: '/en-mx/contact?x=1#form' },
  { id: 'similar', href: '/en-mx-extra/contact' },
  { id: 'nested', href: '/guides/en-mx/contact' },
  { id: 'hash', href: '#about' },
  { id: 'query', href: '?page=2#results' },
  { id: 'relative', href: '../contact' },
  { id: 'external', href: 'https://example.com/contact', target: '_blank', rel: 'noreferrer NOOPENER' },
  { id: 'protocol', href: '//example.com/contact' },
  { id: 'email', href: 'mailto:hello@example.com' },
  { id: 'phone', href: 'tel:+15555555555' },
  { id: 'asset', href: '/img/logo.svg', localize: false },
  { id: 'download', href: '/docs/guide.pdf', download: '' },
  { id: 'named-download', href: '/docs/guide.pdf', download: 'guide.pdf' },
  { id: 'no-download', href: '/contact', download: false },
  { id: 'opt-out', href: '/contact', localize: false }
]
---
<Section id='about' padded={false} class='about-section' data-section='about'>
  <Box size='narrow' class='about-box xs:bg-accent sm:text-state-success md:p-4 lg:flex xl:gap-2 2xl:rounded-lg 3xl:font-primary max-sm:hidden dark:bg-black light:text-white hover:bg-accent-dark focus:bg-accent-light bg-accent-sec text-accent-sec-light border-accent-sec-dark outline-accent-third decoration-accent-third-light ring-accent-third-dark placeholder:text-placeholder' data-box='about' style='--box-gutter: 2rem;'>
    <LanguagePicker path='/about' />
    {links.map(({ id, ...attributes }) => (
      <Link {...attributes} data-link={id} class='fixture-link' aria-label={dictionary.navigation.home}>
        {dictionary.navigation.home}
      </Link>
    ))}
  </Box>
</Section>
<style>.fixture-link { color: red; }</style>`
    )
    const about = `---
import { defaultLocale, locales } from '@/i18n/config'
import Main from '@/layouts/Main.astro'
import AboutSection from '@/sections/About.astro'
export const getStaticPaths = () => locales.map((locale) => ({
  params: { locale: locale === defaultLocale ? undefined : locale }
}))
---
<Main path='/about'>
  <AboutSection />
</Main>`
    await writeFile(
      path.join(fixture, 'src/pages/[...locale]/about.astro'),
      about
    )
    build()
    const home = await readFile(
      path.join(fixture, '.vercel/output/static/index.html'),
      'utf8'
    )
    assert.match(home, /lang="en-us"/)
    const cssDirectory = path.join(fixture, '.vercel/output/static/_astro')
    const css =
      (home.match(/<style[^>]*>[\s\S]*?<\/style>/g)?.join('') ?? '') +
      (
        await Promise.all(
          (await readdir(cssDirectory))
            .filter((file) => file.endsWith('.css'))
            .map((file) => readFile(path.join(cssDirectory, file), 'utf8'))
        )
      ).join('')
    for (const selector of [
      'xs:bg-accent',
      'sm:text-state-success',
      'md:p-4',
      'lg:flex',
      'xl:gap-2',
      '2xl:rounded-lg',
      '3xl:font-primary',
      'max-sm:hidden',
      'dark:bg-black',
      'light:text-white',
      'hover:bg-accent-dark',
      'focus:bg-accent-light',
      'bg-accent-sec',
      'text-accent-sec-light',
      'border-accent-sec-dark',
      'outline-accent-third',
      'decoration-accent-third-light',
      'ring-accent-third-dark',
      'placeholder:text-placeholder'
    ]) {
      const escaped = selector
        .replace(':', '\\:')
        .replace(/^[23]/, (digit) => '\\3' + digit + ' ')
      assert.ok(css.includes(escaped), selector)
    }
    for (const width of [
      '23.4375rem',
      '37.5rem',
      '48rem',
      '64rem',
      '75rem',
      '85.375rem',
      '90rem'
    ])
      assert.ok(css.includes(width), width)
    assert.match(home, /<meta name="theme-color" content="#3245ff"/)
    assert.doesNotMatch(home + css, /site-accent/)
    assert.match(css, /--color-accent:\s*#3245ff/)
    assert.match(css, /--color-accent-sec:\s*#bc52ee/)
    assert.match(css, /--color-accent-third:\s*#f041ff/)
    assert.doesNotMatch(css, /--color-(?:brand-|misc-|red-500)/)
    assert.match(css, /--color-state-success:\s*#00a854/)
    assert.match(css, /--color-placeholder:\s*#999/)
    assert.match(css, /data-theme[=\"']+dark/)
    assert.match(css, /data-theme[=\"']+light/)
    assert.ok(!css.includes('917px'))
    assert.match(css, /@font-face/)
    assert.match(css, /font-family:["']?Inter Variable["']?/)
    assert.match(css, /font-weight:100 900/)
    assert.match(css, /font-style:italic/)
    assert.match(css, /font-display:swap/)
    assert.doesNotMatch(home + css, /fonts\.(?:googleapis|gstatic)\.com/)
    const fontFiles = (await readdir(cssDirectory)).filter((file) =>
      file.endsWith('.woff2')
    )
    assert.ok(
      fontFiles.some((file) => file.includes('inter-latin-wght-normal'))
    )
    assert.ok(
      fontFiles.some((file) => file.includes('inter-latin-wght-italic'))
    )

    assert.equal((home.match(/<main\b/g) || []).length, 1)
    assert.ok(home.includes('id="welcome"'))
    assert.match(
      home,
      /<button[^>]*role="switch"[^>]*aria-checked="false"[^>]*data-theme-switch[^>]*hidden/
    )
    assert.ok(home.includes('Dark mode'))
    assert.ok(home.indexOf('window.astroKitTheme') < home.indexOf('<body'))
    assert.doesNotMatch(home, /aria-label="link"/)
    assert.match(home, /data-page-loader/)
    assert.match(home, /role="status" aria-live="polite" hidden/)
    assert.ok(home.indexOf('data-page-loader') > home.indexOf('<body'))
    assert.ok(home.includes(enUS.common.loading))
    assert.match(home, /<title>Astro Kit<\/title>/)
    assert.ok(!home.includes('hreflang="en-mx"'))
    await assert.rejects(
      readFile(path.join(fixture, '.vercel/output/static/en-mx/index.html')),
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
      path.join(fixture, '.vercel/output/static/en-mx/index.html'),
      'utf8'
    )
    assert.match(regional, /lang="en-mx"/)
    assert.equal((regional.match(/<main\b/g) || []).length, 1)
    assert.ok(regional.includes('Regional welcome'))
    assert.ok(
      regional.includes('rel="canonical" href="https://i18n.example/en-mx"')
    )
    assert.ok(regional.includes('hreflang="en-us"'))
    assert.ok(regional.includes('hreflang="en-mx"'))
    assert.ok(regional.includes('aria-label="Select language"'))
    const regionalAbout = await readFile(
      path.join(fixture, '.vercel/output/static/en-mx/about/index.html'),
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
      path.join(fixture, '.vercel/output/static/about/index.html'),
      'utf8'
    )
    assert.match(defaultAbout, /lang="en-us"/)
    for (const [html, prefix] of [
      [defaultAbout, ''],
      [regionalAbout, '/en-mx']
    ]) {
      const link = (id) =>
        html.match(new RegExp('<a\\b[^>]*data-link="' + id + '"[^>]*>'))?.[0]
      const destination = (id) => link(id)?.match(/href="([^"]*)"/)?.[1]
      assert.equal(destination('route'), prefix + '/contact?from=home#form')
      assert.equal(destination('home'), prefix || '/')
      assert.equal(destination('localized'), '/en-mx/contact?x=1#form')
      assert.equal(destination('similar'), prefix + '/en-mx-extra/contact')
      assert.equal(destination('nested'), prefix + '/guides/en-mx/contact')
      for (const [id, href] of Object.entries({
        hash: '#about',
        query: '?page=2#results',
        relative: '../contact',
        external: 'https://example.com/contact',
        protocol: '//example.com/contact',
        email: 'mailto:hello@example.com',
        phone: 'tel:+15555555555',
        asset: '/img/logo.svg',
        download: '/docs/guide.pdf',
        'named-download': '/docs/guide.pdf',
        'opt-out': '/contact'
      }))
        assert.equal(destination(id), href, id)
      assert.equal(destination('no-download'), prefix + '/contact')
      assert.match(link('route'), /rel="nofollow sponsored noopener"/)
      assert.match(link('external'), /rel="noreferrer NOOPENER"/)
      assert.doesNotMatch(link('home'), /\brel=/)
      assert.match(link('route'), /class="fixture-link"/)
      assert.match(link('route'), /data-astro-cid-/)
      assert.match(link('route'), /aria-label="Home"/)
      assert.doesNotMatch(link('route'), /localize=/)
      assert.match(link('named-download'), /download="guide.pdf"/)
      assert.doesNotMatch(link('no-download'), /\bdownload=/)
      assert.doesNotMatch(
        html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1],
        /<script\b/
      )
    }

    const sectionTag = defaultAbout.match(/<section\b[^>]*id="about"[^>]*>/)[0]
    assert.ok(sectionTag.includes('about-section'))
    assert.ok(sectionTag.includes('data-section="about"'))
    assert.ok(!sectionTag.includes('padded='))
    const boxTag = defaultAbout.match(/<div\b[^>]*data-box="about"[^>]*>/)[0]
    assert.ok(boxTag.includes('about-box'))
    assert.ok(boxTag.includes('--box-gutter: 2rem;'))
    assert.ok(!boxTag.includes('size='))
    assert.ok(
      defaultAbout.includes('rel="canonical" href="https://i18n.example/about"')
    )
    const notFound = await readFile(
      path.join(fixture, '.vercel/output/static/404.html'),
      'utf8'
    )
    assert.equal((notFound.match(/<main\b/g) || []).length, 1)
    assert.ok(notFound.includes('id="not-found"'))
    const sitemap = await readFile(
      path.join(fixture, '.vercel/output/static/sitemap-0.xml'),
      'utf8'
    )
    assert.ok(sitemap.includes('hreflang="en-mx"'))
    assert.ok(sitemap.includes('https://i18n.example/en-mx'))
    assert.ok(!sitemap.includes('/404'))
  }
)
