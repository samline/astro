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
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import {
  defaultTrackingEnabled,
  normalizeContainerId
} from '../src/config/gtm.ts'
import { createConsentConfig } from '../src/components/GTM/consent.ts'
import cookies from '../src/i18n/dictionaries/en-us/cookies/index.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const source = await readFile(
  path.join(root, 'src/components/GTM/Head.astro'),
  'utf8'
)
const script = source.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)[1]

const runtime = (mode = 'basic') => {
  const listeners = new Map()
  const requests = []
  const window = {}
  const document = {
    title: 'Test page',
    createElement: () => ({}),
    head: { appendChild: (node) => requests.push(node) },
    addEventListener: (name, callback) => {
      listeners.set(name, callback)
    }
  }
  const location = { pathname: '/', search: '', href: 'https://example.com/' }
  const context = {
    window,
    document,
    location,
    mode,
    containerId: 'GTM-TEST12345'
  }
  const boot = () => runInNewContext(script, context)
  boot()
  return {
    window,
    requests,
    document,
    location,
    boot,
    navigate: (url) => {
      const next = new URL(url)
      Object.assign(location, {
        pathname: next.pathname,
        search: next.search,
        href: next.href
      })
      listeners.get('astro:page-load')()
    }
  }
}
const lastConsent = (app) =>
  Array.from(
    app.window.dataLayer.filter((entry) => entry[0] === 'consent').at(-1)
  )

test('tracking defaults exclude development, local hosts and provider previews independently of SEO', () => {
  assert.equal(defaultTrackingEnabled({}, 'https://example.com', true), true)
  assert.equal(
    defaultTrackingEnabled(
      { SITE_INDEXABLE: 'false' },
      'https://example.com',
      true
    ),
    true
  )
  assert.equal(defaultTrackingEnabled({}, 'https://example.com', false), false)
  for (const host of [
    'http://localhost:4321',
    'http://demo.localhost',
    'http://127.0.0.1:4321',
    'http://[::1]:4321'
  ])
    assert.equal(defaultTrackingEnabled({}, host, true), false)
  for (const env of [
    { VERCEL_ENV: 'preview' },
    { CONTEXT: 'deploy-preview' },
    { CONTEXT: 'branch-deploy' }
  ])
    assert.equal(
      defaultTrackingEnabled(env, 'https://preview.example.com', true),
      false
    )
  assert.equal(normalizeContainerId('  GTM-ABC1234  '), 'GTM-ABC1234')
  assert.equal(normalizeContainerId(''), undefined)
  for (const id of ['G-ABC123', 'GTM-', 'GTM-a123', 'GTM-ABC&x=y', '<script>'])
    assert.throws(() => normalizeContainerId(id), /GTM_ID/)
})

test('basic mode queues denied defaults before loading anything and separates analytics from advertising', () => {
  const app = runtime()
  assert.equal(app.requests.length, 0)
  const defaults = lastConsent(app)
  assert.equal(defaults[1], 'default')
  for (const key of [
    'analytics_storage',
    'ad_storage',
    'ad_user_data',
    'ad_personalization'
  ])
    assert.equal(defaults[2][key], 'denied')
  app.window.astroKitGTM.updateConsent({ analytics: false, marketing: false })
  assert.equal(app.requests.length, 0)
  app.window.astroKitGTM.updateConsent({ analytics: true, marketing: false })
  assert.equal(lastConsent(app)[2].analytics_storage, 'granted')
  for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization'])
    assert.equal(lastConsent(app)[2][key], 'denied')
  assert.equal(app.requests.length, 1)
  assert.equal(app.requests[0].async, true)
  assert.equal(
    app.requests[0].src,
    'https://www.googletagmanager.com/gtm.js?id=GTM-TEST12345'
  )
  app.window.astroKitGTM.updateConsent({ analytics: true, marketing: true })
  app.boot()
  assert.equal(app.requests.length, 1)
  assert.equal(
    app.window.dataLayer.filter((entry) => entry.event === 'gtm.js').length,
    1
  )
})

test('marketing consent does not imply analytics; revocation updates all signals and requests a clean reload', () => {
  const app = runtime()
  assert.equal(
    app.window.astroKitGTM.updateConsent({ analytics: false, marketing: true }),
    false
  )
  assert.equal(lastConsent(app)[2].analytics_storage, 'denied')
  assert.equal(lastConsent(app)[2].ad_user_data, 'granted')
  assert.equal(
    app.window.astroKitGTM.updateConsent({
      analytics: false,
      marketing: false
    }),
    true
  )
  for (const key of [
    'analytics_storage',
    'ad_storage',
    'ad_user_data',
    'ad_personalization'
  ])
    assert.equal(lastConsent(app)[2][key], 'denied')
  app.navigate('https://example.com/after-rejection')
  assert.equal(
    app.window.dataLayer.filter((entry) => entry.event === 'astro_page_view')
      .length,
    0
  )
})

test('advanced is explicit; Astro navigation avoids duplicate initial and hash page views', () => {
  const advanced = runtime('advanced')
  assert.equal(advanced.requests.length, 1)
  assert.equal(advanced.window.dataLayer[0][1], 'default')
  const app = runtime()
  app.navigate('https://example.com/not-consented')
  assert.equal(app.requests.length, 0)
  app.window.astroKitGTM.updateConsent({ analytics: true, marketing: false })
  app.navigate('https://example.com/not-consented')
  app.navigate('https://example.com/not-consented#section')
  assert.equal(
    app.window.dataLayer.filter((entry) => entry.event === 'astro_page_view')
      .length,
    0
  )
  app.navigate('https://example.com/contact?q=1')
  app.navigate('https://example.com/contact?q=1')
  const views = app.window.dataLayer.filter(
    (entry) => entry.event === 'astro_page_view'
  )
  assert.equal(views.length, 1)
  assert.equal(views[0].page_path, '/contact?q=1')
})

test('cookie configuration is opt-in, translated, escapes markup and handles saved or changed choices', () => {
  const callback = () => {}
  const config = createConsentConfig(
    'en-mx',
    { ...cookies, title: '<img src=x onerror=alert(1)>' },
    callback,
    '/privacy?x="unsafe"'
  )
  assert.equal(config.categories.necessary.readOnly, true)
  assert.equal(config.categories.analytics.enabled, false)
  assert.equal(config.categories.marketing.enabled, false)
  assert.equal(config.onConsent, callback)
  assert.equal(config.onChange, callback)
  assert.equal(config.guiOptions.consentModal.equalWeightButtons, false)
  const text = config.language.translations['en-mx']
  assert.equal(text.consentModal.title, '&lt;img src=x onerror=alert(1)&gt;')
  assert.ok(text.consentModal.footer.includes('&quot;unsafe&quot;'))
  assert.equal(text.consentModal.acceptNecessaryBtn, cookies.rejectOptional)
  assert.ok(
    config.categories.analytics.autoClear.cookies[0].name.test('_ga_test')
  )
  assert.ok(
    !config.categories.analytics.autoClear.cookies[0].name.test('_gcl_au')
  )
})

test('consent stylesheet retries preserve successful downloads without duplicate links', async () => {
  const source = (
    await readFile(path.join(root, 'src/components/GTM/consent-sdk.ts'), 'utf8')
  )
    .replace(/^import .*$/gm, '')
    .replace(/^export \{[\s\S]*?\} from '[^']+'$/gm, '')
    .replace('export const loadStyles', 'const loadStyles')
  const links = []
  const context = {
    vendorStyles: '/vendor.css',
    themeStyles: '/theme.css',
    document: {
      createElement: () => {
        const link = {
          removed: false,
          remove: () => {
            link.removed = true
          }
        }
        return link
      },
      head: { append: (link) => links.push(link) }
    }
  }
  runInNewContext(
    ts.transpileModule(source + '\nglobalThis.loadStyles = loadStyles', {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext
      }
    }).outputText,
    context
  )
  const first = context.loadStyles()
  assert.equal(links.length, 2)
  links[0].onload()
  links[1].onerror()
  await assert.rejects(first, /stylesheet/)
  assert.equal(links[1].removed, true)
  const retry = context.loadStyles()
  assert.equal(links.length, 3)
  assert.equal(links[2].href, '/theme.css')
  links[2].onload()
  await retry
  await context.loadStyles()
  assert.equal(links.length, 3)
})

test(
  'SSG enables GTM only when configured and keeps consent CSS out of the initial response',
  { timeout: 60000 },
  async (t) => {
    const fixture = await mkdtemp(path.join(tmpdir(), 'astro-kit-gtm-'))
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
    ])
      await cp(path.join(root, file), path.join(fixture, file))
    await symlink(
      path.join(root, 'node_modules'),
      path.join(fixture, 'node_modules'),
      'junction'
    )
    const config = path.join(fixture, 'src/i18n/config.ts')
    await writeFile(
      config,
      (await readFile(config, 'utf8')).replace(
        "// locales.push('en-mx')",
        "locales.push('en-mx')"
      )
    )
    const build = (overrides) => {
      const result = spawnSync(
        process.execPath,
        [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
        {
          cwd: fixture,
          env: {
            ...process.env,
            NODE_ENV: 'production',
            SITE_URL: 'https://tracking.example',
            GTM_ID: '',
            GTM_ENABLED: '',
            ...overrides
          },
          encoding: 'utf8',
          timeout: 20000
        }
      )
      assert.equal(result.status, 0, result.stdout + result.stderr)
    }
    build({ GTM_ID: 'GTM-TEST12345', GTM_ENABLED: 'false' })
    let home = await readFile(path.join(fixture, 'dist/index.html'), 'utf8')
    assert.ok(!home.includes('googletagmanager.com'))
    assert.ok(!home.includes('data-gtm-consent'))
    assert.ok(!home.includes('data-cookie-preferences'))
    build({ GTM_ID: 'GTM-TEST12345', GTM_ENABLED: 'true' })
    home = await readFile(path.join(fixture, 'dist/index.html'), 'utf8')
    assert.ok(home.includes('GTM-TEST12345'))
    assert.ok(home.includes('data-gtm-consent'))
    assert.ok(home.includes('data-cookie-preferences'))
    assert.ok(!home.includes('googletagmanager.com/ns.html'))
    assert.ok(home.indexOf('window.astroKitGTM') < home.indexOf('<body'))
    assert.ok(home.includes('data-locale="en-us"'))
    const regional = await readFile(
      path.join(fixture, 'dist/en-mx/index.html'),
      'utf8'
    )
    assert.ok(regional.includes('data-locale="en-mx"'))
    const inline = home.match(/<style[^>]*>[\s\S]*?<\/style>/g)?.join('') ?? ''
    const styles = [
      ...home.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)
    ].map((match) => match[0].match(/href="([^"]*)"/)[1])
    const initialCSS =
      inline +
      (
        await Promise.all(
          styles.map((href) =>
            readFile(
              path.join(fixture, 'dist', href.replace(/^\//, '')),
              'utf8'
            )
          )
        )
      ).join('')
    assert.ok(!initialCSS.includes('#cc-main'))
    const assets = path.join(fixture, 'dist/_astro')
    const allCSS = (
      await Promise.all(
        (await readdir(assets))
          .filter((file) => file.endsWith('.css'))
          .map((file) => readFile(path.join(assets, file), 'utf8'))
      )
    ).join('')
    assert.ok(allCSS.includes('#cc-main'))
    build({ GTM_ID: '' })
    assert.ok(
      !(await readFile(path.join(fixture, 'dist/index.html'), 'utf8')).includes(
        'data-gtm-consent'
      )
    )
  }
)
