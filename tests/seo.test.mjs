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
import { resolveIndexing } from '../src/config/seo.ts'

const root = fileURLToPath(new URL('../', import.meta.url))

test('indexing defaults to production on a non-local origin, with preview protection and an explicit override', () => {
  const origin = 'https://example.com'
  assert.equal(resolveIndexing({}, origin, true), true)
  assert.equal(resolveIndexing({}, origin, false), false)
  for (const site of [
    'http://localhost:4321',
    'http://127.0.0.1',
    'http://[::1]',
    'https://demo.localhost'
  ]) {
    assert.equal(resolveIndexing({}, site, true), false)
  }
  for (const env of [
    { VERCEL_ENV: 'preview' },
    { CONTEXT: 'deploy-preview' },
    { CONTEXT: 'branch-deploy' },
    { SITE_INDEXABLE: 'false' }
  ]) {
    assert.equal(resolveIndexing(env, origin, true), false)
  }
  assert.equal(
    resolveIndexing(
      { SITE_INDEXABLE: 'true', VERCEL_ENV: 'preview' },
      origin,
      true
    ),
    true
  )
  assert.throws(
    () => resolveIndexing({ SITE_INDEXABLE: 'yes' }, origin, true),
    /true o false/
  )
})

test(
  'built SEO, robots and sitemap stay consistent across languages and indexing modes; public files are copied verbatim',
  { timeout: 45000 },
  async (t) => {
    const fixture = await mkdtemp(path.join(tmpdir(), 'astro-kit-seo-'))
    t.after(() => rm(fixture, { recursive: true, force: true }))
    for (const entry of [
      'src',
      'public',
      'astro.config.mjs',
      'package.json',
      'tsconfig.json',
      'bunfig.toml',
      'vercel.json'
    ]) {
      await cp(path.join(root, entry), path.join(fixture, entry), {
        recursive: true
      })
    }
    await symlink(
      path.join(root, 'node_modules'),
      path.join(fixture, 'node_modules'),
      'junction'
    )
    const edit = async (file, before, after) => {
      const target = path.join(fixture, file)
      const source = await readFile(target, 'utf8')
      assert.ok(source.includes(before), before)
      await writeFile(
        target,
        source.replace(before, () => after)
      )
    }
    await edit(
      'src/i18n/config.ts',
      "// locales.push('en-mx')",
      "locales.push('en-mx')"
    )
    await edit(
      'src/config/seo.ts',
      "noindexPaths: ['/404']",
      "noindexPaths: ['/404', '/private/']"
    )
    const hostileAlt =
      '</script><script data-injected="true">bad</script> & $& \u2028\u2029'
    await edit(
      'src/i18n/dictionaries/en-us/seo/index.ts',
      "'Astro Kit website preview'",
      JSON.stringify(hostileAlt)
    )
    await writeFile(
      path.join(fixture, 'src/sections/About.astro'),
      `---
import Section from '@/components/Section/index.astro'
import Box from '@/components/Box/index.astro'
import LanguagePicker from '@/components/LanguagePicker/index.astro'
---
<Section id='about' padded={false} class='about-section' data-section='about'>
  <Box size='narrow' class='about-box' data-box='about' style='--box-gutter: 2rem;'>
    <LanguagePicker path='/about' />
  </Box>
</Section>`
    )
    const about = `---
import Main from '@/layouts/Main.astro'
import AboutSection from '@/sections/About.astro'
import { getDictionary } from '@/i18n'
import { locales, defaultLocale } from '@/i18n/config'
export const getStaticPaths = () => locales.map(locale=>({params:{locale:locale===defaultLocale?undefined:locale}}))
const dictionary=getDictionary(Astro.currentLocale)
---
<Main path='/about?campaign=test#section' title={dictionary.navigation.home} image={{src:'/img/share.png',alt:dictionary.seo.imageAlt,width:1,height:1,type:'image/png'}} structuredData={{'@type':'Thing',name:dictionary.seo.imageAlt}}>
<AboutSection />
</Main>`
    await writeFile(
      path.join(fixture, 'src/pages/[...locale]/about.astro'),
      about
    )
    await writeFile(
      path.join(fixture, 'src/pages/[...locale]/private.astro'),
      about.replace("path='/about?campaign=test#section'", "path='/private'")
    )
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64'
    )
    const resources = {
      'img/share.png': png,
      'docs/example.pdf': Buffer.from('%PDF-1.7\npublic fixture\n'),
      'video/example.mp4': Buffer.from([0, 0, 0, 8, 102, 116, 121, 112])
    }
    for (const [file, bytes] of Object.entries(resources))
      await writeFile(path.join(fixture, 'public', file), bytes)
    const build = (indexable) => {
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        SITE_URL: 'https://seo.example'
      }
      for (const name of ['SITE_INDEXABLE', 'VERCEL_ENV', 'CONTEXT'])
        delete env[name]
      if (indexable !== undefined) env.SITE_INDEXABLE = String(indexable)
      const result = spawnSync(
        process.execPath,
        [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
        { cwd: fixture, env, encoding: 'utf8', timeout: 20000 }
      )
      assert.equal(result.status, 0, result.stdout + result.stderr)
    }
    const output = (file) => readFile(path.join(fixture, 'dist', file), 'utf8')
    const schema = (html) =>
      JSON.parse(
        html.match(
          /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/
        )[1]
      )
    build()
    const home = await output('index.html')
    assert.equal((home.match(/name="theme-color"/g) || []).length, 1)
    assert.match(home, /<meta name="theme-color" content="#3245ff"/)

    assert.equal((home.match(/<title>/g) || []).length, 1)
    assert.match(home, /<title>Astro Kit<\/title>/)
    assert.ok(home.includes('content="index, follow, max-image-preview:large"'))
    assert.ok(home.includes('property="og:locale" content="en_US"'))
    assert.ok(home.includes('name="twitter:card" content="summary"'))
    assert.ok(home.includes('rel="sitemap"'))
    assert.ok(!home.includes('property="og:image"'))
    assert.ok(!home.includes('name="twitter:site"'))
    assert.ok(!home.includes('name="keywords"'))
    assert.equal(
      schema(home)['@graph'].filter((node) => node['@type'] === 'WebSite')
        .length,
      1
    )
    const english = await output('about/index.html')
    assert.match(english, /<title>Home \| Astro Kit<\/title>/)
    assert.ok(
      english.includes('rel="canonical" href="https://seo.example/about"')
    )
    assert.ok(!english.includes('campaign=test'))
    assert.ok(
      english.includes(
        'property="og:image" content="https://seo.example/img/share.png"'
      )
    )
    assert.ok(english.includes('property="og:image:width" content="1"'))
    assert.ok(
      english.includes('name="twitter:card" content="summary_large_image"')
    )
    assert.ok(!english.includes('<script data-injected="true">'))
    assert.equal(schema(english)['@graph'].at(-1).name, hostileAlt)
    const regional = await output('en-mx/about/index.html')
    assert.ok(regional.includes('property="og:locale" content="en_MX"'))
    assert.ok(
      regional.includes('property="og:locale:alternate" content="en_US"')
    )
    assert.ok(
      regional.includes(
        'rel="canonical" href="https://seo.example/en-mx/about"'
      )
    )
    assert.ok(
      regional.includes('hreflang="x-default" href="https://seo.example/about"')
    )
    const robots = await output('robots.txt')
    assert.equal(
      robots,
      'User-agent: *\nAllow: /\n\nSitemap: https://seo.example/sitemap-index.xml\n'
    )
    const sitemap = await output('sitemap-0.xml')
    assert.ok(sitemap.includes('https://seo.example/en-mx/about'))
    for (const name of ['/private', '/404', '/robots.txt'])
      assert.ok(!sitemap.includes(name), name)
    for (const file of [
      '404.html',
      'private/index.html',
      'en-mx/private/index.html'
    ]) {
      const html = await output(file)
      assert.ok(html.includes('content="noindex, follow"'), file)
      const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)[1]
      for (const marker of [
        'rel="canonical"',
        'hreflang=',
        'application/ld+json'
      ])
        assert.ok(!head.includes(marker), `${file}: ${marker}`)
    }
    for (const [file, bytes] of Object.entries(resources))
      assert.deepEqual(await readFile(path.join(fixture, 'dist', file)), bytes)
    for (const directory of ['img', 'docs', 'video']) {
      assert.equal(
        await readFile(
          path.join(root, 'public', directory, '.gitkeep'),
          'utf8'
        ),
        ''
      )
    }
    build(false)
    const blocked = await output('index.html')
    assert.ok(blocked.includes('content="noindex, follow"'))
    assert.ok(!blocked.includes('rel="sitemap"'))
    assert.ok(!blocked.includes('application/ld+json'))
    assert.equal(await output('robots.txt'), 'User-agent: *\nDisallow: /\n')
    assert.ok(
      !(await readdir(path.join(fixture, 'dist'))).some((file) =>
        file.startsWith('sitemap')
      )
    )
  }
)
