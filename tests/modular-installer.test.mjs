import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  mkdtemp,
  realpath,
  rm,
  writeFile,
  mkdir,
  cp,
  chmod,
  readdir,
  symlink
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dev } from 'astro'
import { spawnSync } from 'node:child_process'
import { checkTranslations } from '../scripts/check-translations.mjs'
import { createProject } from '../packages/cli/lib/project.mjs'
import {
  addIntegrations,
  addProjectLocale,
  projectStatus
} from '../packages/cli/lib/integrations.mjs'
import { localeDetails } from '../packages/cli/lib/locales.mjs'
import { dictionary } from '../packages/cli/lib/syntax.mjs'
import { selectTools } from '../packages/cli/lib/process.mjs'
import {
  read,
  json,
  exists,
  applyFiles,
  createReader
} from '../packages/cli/lib/files.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const template = path.join(root, 'packages/cli/template')
const kitVersion = (await json(root)).version
const tools = selectTools({ pnpm: '12.9.1', bun: '1.3.14', npm: '11.2.0' })
const fixture = async (t, options = {}) => {
  const parent = await realpath(
    await mkdtemp(path.join(tmpdir(), 'samline-modular-test-'))
  )
  t.after(() => rm(parent, { recursive: true, force: true }))
  const destination = path.join(parent, 'site')
  await createProject({
    template,
    destination,
    kitVersion,
    tools,
    deployment: 'vercel',
    ...options
  })
  return destination
}
const add = (directory, requested, options = {}, dryRun = false) =>
  addIntegrations({
    root: directory,
    template,
    kitVersion,
    requested,
    options,
    dryRun
  })
const build = async (directory, check = true) => {
  if (!(await exists(directory, 'node_modules')))
    await symlink(
      path.join(root, 'node_modules'),
      path.join(directory, 'node_modules'),
      'junction'
    )
  for (const command of [...(check ? ['check'] : []), 'build']) {
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'node_modules/astro/bin/astro.mjs'), command],
      {
        cwd: directory,
        env: { ...process.env, NODE_ENV: 'production' },
        encoding: 'utf8',
        timeout: 30000
      }
    )
    assert.equal(result.status, 0, result.stdout + result.stderr)
    if (command === 'check') assert.match(result.stdout, /0 errors/)
  }
}

test(
  'minimal project omits optional packages, files, env and dictionary domains; Spanish-only has no hidden English',
  { timeout: 30000 },
  async (t) => {
    const directory = await fixture(t, {
      deployment: 'static',
      locale: 'es-mx'
    })
    const manifest = await json(directory)
    assert.deepEqual(Object.keys(manifest.dependencies).sort(), [
      '@astrojs/sitemap',
      '@fontsource-variable/inter',
      'astro'
    ])
    assert.deepEqual(
      await readdir(path.join(directory, 'src/i18n/dictionaries')),
      ['es-mx']
    )
    const source = await read(directory, 'astro.config.mjs')
    assert.doesNotMatch(source, /GTM|AUTH_|SMTP_|CAPTCHA_|CONTENT_API/)
    for (const folder of [
      'src/auth',
      'src/server',
      'src/actions',
      'src/content',
      'src/components/Fields',
      'src/components/LanguagePicker',
      'src/components/Theme',
      'src/components/PageLoader',
      'src/components/FaIcon'
    ])
      assert.equal(await exists(directory, folder), false, folder)
    const routeCatalog = await read(directory, 'src/config/routes.ts')
    assert.doesNotMatch(routeCatalog, /en-us|demo|company\.about/)
    assert.match(routeCatalog, /home\.index/)
    assert.equal(await exists(directory, 'src/i18n/routes.ts'), true)
    const types = await read(directory, 'src/i18n/types.ts')
    assert.doesNotMatch(types, /themes|cookies|auth|forms|en-us/)
    assert.equal(manifest.scripts['auth:migrate'], undefined)
    await build(directory)
    const html = await read(directory, 'dist/index.html')
    assert.match(html, /lang="es-mx"/)
    assert.doesNotMatch(
      html,
      /samlineAstroTheme|cookieconsent|data-theme-switch/
    )
    await add(directory, ['welcome'])
    const welcome = await read(directory, 'src/sections/Welcome/index.astro')
    assert.doesNotMatch(welcome, /ThemeSwitch|LanguagePicker/)
    await build(directory)
  }
)

test(
  'Forms installs Formatter without Fields; later Fields and all supported UI/server integrations build in Spanish',
  { timeout: 40000 },
  async (t) => {
    const directory = await fixture(t, { locale: 'es-es' })
    await add(directory, ['forms'])
    let manifest = await json(directory)
    assert.ok(manifest.dependencies['@samline/forms'])
    assert.ok(manifest.dependencies['@samline/formatter'])
    assert.equal(await exists(directory, 'src/components/Fields'), false)
    await add(
      directory,
      [
        'fields',
        'themes',
        'gtm',
        'language-picker',
        'pageloader',
        'actions',
        'mail',
        'auth',
        'captcha'
      ],
      { authMode: 'external', captchaProvider: 'turnstile' }
    )
    manifest = await json(directory)
    assert.equal(manifest.dependencies.pg, undefined)
    assert.equal(
      await exists(directory, 'src/server/auth/providers/database.ts'),
      false
    )
    assert.equal(
      await exists(directory, 'src/server/auth/providers/oauth.ts'),
      false
    )
    assert.equal(manifest.scripts['auth:migrate'], undefined)
    assert.match(
      await read(directory, 'src/actions/contact/index.ts'),
      /verifyCaptcha/
    )
    assert.match(await read(directory, 'src/actions/index.ts'), /basic/)
    assert.match(await read(directory, 'src/actions/index.ts'), /contact/)
    assert.match(
      await read(directory, 'src/server/auth/settings.ts'),
      /external/
    )
    assert.doesNotMatch(
      await read(directory, 'src/server/auth/settings.ts'),
      /pg|providers\/database/
    )
    const repeated = await add(
      directory,
      ['forms', 'fields', 'auth', 'mail', 'themes'],
      { authMode: 'external' }
    )
    assert.deepEqual(repeated.files, [])
    await build(directory)
  }
)

test('each auth mode installs only its provider and database migration remains explicit', async (t) => {
  for (const mode of ['external', 'database', 'oauth']) {
    const directory = await fixture(t, { features: ['auth'], authMode: mode })
    const manifest = await json(directory)
    assert.deepEqual(
      await readdir(path.join(directory, 'src/server/auth/providers')),
      [`${mode}.ts`]
    )
    assert.equal(Boolean(manifest.dependencies.pg), mode === 'database')
    assert.equal(
      await exists(directory, 'scripts/auth-migrate.mjs'),
      mode === 'database'
    )
    assert.equal(Boolean(manifest.scripts['auth:migrate']), mode === 'database')
    assert.ok(await exists(directory, 'src/pages/api/auth/[...all].ts'))
  }
})

test('Mail always includes contact without forcing Forms or CAPTCHA; CAPTCHA can be added in either order', async (t) => {
  for (const captchaFirst of [true, false]) {
    const directory = await fixture(t)
    if (captchaFirst)
      await add(directory, ['captcha'], { captchaProvider: 'recaptcha' })
    await add(directory, ['mail'])
    let manifest = await json(directory)
    assert.ok(manifest.dependencies.nodemailer)
    assert.equal(manifest.dependencies['@samline/forms'], undefined)
    assert.equal(manifest.samlineAstro.features.includes('actions'), false)
    if (!captchaFirst) {
      assert.doesNotMatch(
        await read(directory, 'src/actions/contact/index.ts'),
        /verifyCaptcha|dictionary.captcha/
      )
      await add(directory, ['captcha'], { captchaProvider: 'recaptcha' })
    }
    assert.match(
      await read(directory, 'src/actions/contact/index.ts'),
      /verifyCaptcha/
    )
    assert.match(await read(directory, 'src/actions/index.ts'), /contact/)
  }
})

test('add preserves custom layouts, Actions, dependencies, secrets and project choices; dry-run and conflicts write nothing', async (t) => {
  const directory = await fixture(t, { features: ['actions'] })
  const layout = await read(directory, 'src/layouts/Main.astro')
  await writeFile(
    path.join(directory, 'src/layouts/Main.astro'),
    layout.replace('<main ', '<main data-user-layout ')
  )
  const actions = await read(directory, 'src/actions/index.ts')
  await writeFile(
    path.join(directory, 'src/actions/index.ts'),
    actions.replace(
      'export const server = {',
      'const custom = () => null\nexport const server = { custom,'
    )
  )
  await writeFile(
    path.join(directory, '.env.development'),
    'USER_SECRET=keep-this-untouched\n'
  )
  const before = await read(directory, 'package.json')
  const preview = await add(directory, ['themes'], {}, true)
  assert.ok(preview.files.length)
  assert.equal(await read(directory, 'package.json'), before)
  assert.equal(await exists(directory, 'src/components/Theme'), false)
  await add(directory, ['themes', 'mail'])
  assert.match(
    await read(directory, 'src/layouts/Main.astro'),
    /data-user-layout/
  )
  assert.match(await read(directory, 'src/actions/index.ts'), /custom/)
  assert.equal(
    await read(directory, '.env.development'),
    'USER_SECRET=keep-this-untouched\n'
  )
  assert.equal((await json(directory)).packageManager, 'pnpm@12.9.1')
  const nodeProject = await fixture(t)
  const nodeManifest = await json(nodeProject)
  for (const [name, script] of Object.entries(nodeManifest.scripts))
    nodeManifest.scripts[name] = script
      .replaceAll('bun --bun', 'node')
      .replaceAll('bun scripts/', 'node scripts/')
      .replaceAll('bun run', 'npm run')
  await writeFile(
    path.join(nodeProject, 'package.json'),
    JSON.stringify(nodeManifest)
  )
  await add(nodeProject, ['auth'], { authMode: 'database' })
  assert.equal(
    (await json(nodeProject)).scripts['auth:migrate'],
    'node scripts/auth-migrate.mjs'
  )

  await mkdir(path.join(directory, 'src/components/Captcha'), {
    recursive: true
  })
  await writeFile(
    path.join(directory, 'src/components/Captcha/index.astro'),
    'custom-owned'
  )
  const snapshot = await read(directory, 'package.json')
  await assert.rejects(
    add(directory, ['captcha'], { captchaProvider: 'turnstile' }),
    /conflict/
  )
  assert.equal(await read(directory, 'package.json'), snapshot)
  assert.equal(
    await read(directory, 'src/components/Captcha/index.astro'),
    'custom-owned'
  )
})

test(
  'later locales copy current custom keys with empty values only, retain shape and stay inactive without content',
  { timeout: 30000 },
  async (t) => {
    const directory = await fixture(t, {
      features: ['content', 'language-picker'],
      contentSource: 'local',
      locale: 'es-mx'
    })
    const domain = 'src/i18n/dictionaries/es-mx/checkout'
    await mkdir(path.join(directory, domain))
    await writeFile(
      path.join(directory, domain, 'types.ts'),
      'export interface Checkout { title: string; items: { label: string }[]; count: number }\n'
    )
    await writeFile(
      path.join(directory, domain, 'index.ts'),
      "import type { Checkout } from './types'\nexport default { title: 'Pagar', items: [{ label: 'Producto' }], count: 2 } satisfies Checkout\n"
    )
    const index = await read(directory, 'src/i18n/dictionaries/es-mx/index.ts')
    await writeFile(
      path.join(directory, 'src/i18n/dictionaries/es-mx/index.ts'),
      "import checkout from './checkout'\n" +
        index.replace('export default {', 'export default { checkout,')
    )
    const types = await read(directory, 'src/i18n/types.ts')
    await writeFile(
      path.join(directory, 'src/i18n/types.ts'),
      "import type { Checkout } from './dictionaries/es-mx/checkout/types'\n" +
        types.replace(
          'export interface Dictionary {',
          'export interface Dictionary { checkout: Checkout;'
        )
    )
    const initial = await read(directory, `${domain}/index.ts`)
    const content = await readdir(
      path.join(directory, 'src/content/posts/data')
    )
    const routeCatalog = await read(directory, 'src/config/routes.ts')
    const entry = localeDetails('fr-fr', 'Français')
    await addProjectLocale({ root: directory, kitVersion, entry })
    assert.equal(await read(directory, 'src/config/routes.ts'), routeCatalog)
    const added = dictionary(
      await read(directory, 'src/i18n/dictionaries/fr-fr/checkout/index.ts'),
      'checkout'
    )
    assert.equal(added.title, '')
    assert.equal(added.items[0].label, '')
    assert.equal(added.count, 2)
    assert.equal(await read(directory, `${domain}/index.ts`), initial)
    assert.deepEqual(
      await readdir(path.join(directory, 'src/content/posts/data')),
      content
    )
    const status = await projectStatus(directory, kitVersion)
    assert.deepEqual(status.active, ['es-mx'])
    assert.deepEqual(status.pending, ['fr-fr'])
    assert.deepEqual(await checkTranslations(directory), [])
    const localeConfig = await read(directory, 'src/i18n/config.ts')
    await writeFile(
      path.join(directory, 'src/i18n/config.ts'),
      localeConfig.replace(
        'locales: Locale[] = ["es-mx"]',
        'locales: Locale[] = ["es-mx","fr-fr"]'
      )
    )
    assert.ok(
      (await checkTranslations(directory)).some((issue) =>
        issue.includes('fr-fr:checkout.title')
      )
    )
    await writeFile(path.join(directory, 'src/i18n/config.ts'), localeConfig)

    assert.deepEqual(
      (await addProjectLocale({ root: directory, kitVersion, entry })).files,
      []
    )
    await build(directory)
    assert.equal(await exists(directory, '.vercel/output/static/fr-fr'), false)
  }
)

test('dynamic dictionary expressions, key drift, symlinks and unsupported project metadata fail before changes', async (t) => {
  const directory = await fixture(t)
  const file = 'src/i18n/dictionaries/en-us/site/index.ts'
  await writeFile(
    path.join(directory, file),
    'export default { title: process.env.DO_NOT_EXECUTE }\n'
  )
  const before = await read(directory, 'package.json')
  await assert.rejects(
    addProjectLocale({
      root: directory,
      kitVersion,
      entry: localeDetails('es-es')
    }),
    /Dynamic/
  )
  assert.equal(await read(directory, 'package.json'), before)
  const target = await realpath(
    await mkdtemp(path.join(tmpdir(), 'samline-link-'))
  )
  t.after(() => rm(target, { recursive: true, force: true }))
  await symlink(target, path.join(directory, 'src/components/Theme'))
  await assert.rejects(add(directory, ['themes']), /conflict|symlink/i)
  assert.deepEqual(await readdir(target), [])
  const composed = await fixture(t)
  const indexFile = 'src/i18n/dictionaries/en-us/index.ts'
  const index = await read(composed, indexFile)
  await writeFile(
    path.join(composed, indexFile),
    index.replace("from './common'", "from '../some-other-language/common'")
  )
  await assert.rejects(
    addProjectLocale({
      root: composed,
      kitVersion,
      entry: localeDetails('es-es')
    }),
    /own locale folder/
  )
  assert.equal(await exists(composed, 'src/i18n/dictionaries/es-es'), false)
  const drift = await fixture(t, { additionalLocales: ['es-mx'] })
  const common = 'src/i18n/dictionaries/es-mx/common/index.ts'
  const value = await read(drift, common)
  await writeFile(
    path.join(drift, common),
    value.replace('export default {', "export default { extra: 'custom key',")
  )
  await assert.rejects(
    addProjectLocale({
      root: drift,
      kitVersion,
      entry: localeDetails('fr-fr', 'Français')
    }),
    /shape drift/
  )
  const legacy = await fixture(t)
  const manifest = await json(legacy)
  manifest.samlineAstro.schema = 0
  await writeFile(path.join(legacy, 'package.json'), JSON.stringify(manifest))
  await assert.rejects(
    add(legacy, ['themes']),
    /predates modular installer metadata/
  )
  assert.equal(await exists(legacy, 'src/components/Theme'), false)
})

test('Content includes only selected source examples and independent named providers can be added without network', async (t) => {
  for (const source of ['local', 'api', 'strapi', 'shopify', 'other']) {
    const directory = await fixture(t, {
      features: ['content'],
      contentSource: source,
      protocol: source === 'api' || source === 'other' ? 'graphql' : undefined
    })
    const name = source === 'shopify' ? 'products' : 'posts'
    assert.deepEqual(await readdir(path.join(directory, 'src/content')), [name])
    const contents = await readdir(path.join(directory, `src/content/${name}`))
    assert.equal(contents.includes('source.ts'), source !== 'local')
    assert.equal(contents.includes('data'), source === 'local')
    const docs = await read(directory, `src/content/${name}/README.md`)
    assert.match(docs, new RegExp(source))
    if (source !== 'local') assert.match(docs, /not registered/)
    if (source === 'local') {
      const original = await read(directory, 'src/content/posts/index.ts')
      await add(directory, ['content'], {
        contentSource: 'shopify',
        collection: 'products',
        contentMode: 'build'
      })
      assert.equal(
        await read(directory, 'src/content/posts/index.ts'),
        original
      )
      assert.deepEqual(
        (await json(directory)).samlineAstro.collections.map(
          (item) => item.name
        ),
        ['posts', 'products']
      )
      for (const identifier of ['class', 'await', 'schema'])
        await assert.rejects(
          add(directory, ['content'], {
            contentSource: 'local',
            collection: identifier
          }),
          /collection|parse/i
        )
      assert.match(
        await read(directory, 'src/content/products/source.ts'),
        /X-Shopify-Storefront-Access-Token/
      )
      await assert.rejects(
        add(directory, ['content'], {
          contentSource: 'strapi',
          collection: 'products'
        }),
        /conflict/
      )
    }
  }
})

test('unsupported server combinations require explicit inactive scaffolding and dry-run creation leaves no directory', async (t) => {
  const parent = await realpath(
    await mkdtemp(path.join(tmpdir(), 'samline-compat-'))
  )
  t.after(() => rm(parent, { recursive: true, force: true }))
  const destination = path.join(parent, 'site')
  const base = {
    template,
    destination,
    tools,
    kitVersion,
    features: ['mail'],
    deployment: 'static'
  }
  await assert.rejects(createProject(base), /server adapter/)
  assert.deepEqual(await readdir(parent), [])
  const preview = await createProject({ ...base, scaffold: true, dryRun: true })
  assert.ok(preview.files.length)
  assert.deepEqual(await readdir(parent), [])
  await createProject({ ...base, scaffold: true })
  assert.ok(await exists(destination, 'src/actions/index.ts.example'))
  assert.equal(await exists(destination, 'src/actions/index.ts'), false)
  assert.match(
    await read(destination, 'src/actions/index.ts.example'),
    /contact/
  )
})

test('Auth composes with an existing middleware and unknown spreads/binding collisions remain conflicts', async (t) => {
  const directory = await fixture(t)
  await writeFile(
    path.join(directory, 'src/middleware.ts'),
    "import { defineMiddleware } from 'astro:middleware'\nexport const onRequest = defineMiddleware(async (context, next) => { context.locals.custom = true; return next() })\n"
  )
  await add(directory, ['auth'], { authMode: 'external' })
  const middleware = await read(directory, 'src/middleware.ts')
  assert.match(middleware, /sequence\(authMiddleware,/)
  assert.match(middleware, /context.locals.custom = true/)
  const other = await fixture(t)
  const layout = await read(other, 'src/layouts/Main.astro')
  await writeFile(
    path.join(other, 'src/layouts/Main.astro'),
    layout.replace('---\n', '---\nconst ThemeInit = () => null\n')
  )
  const before = await read(other, 'package.json')
  await assert.rejects(add(other, ['themes']), /conflict/)
  assert.equal(await read(other, 'package.json'), before)
  const spread = await fixture(t)
  const config = await read(spread, 'astro.config.mjs')
  await writeFile(
    path.join(spread, 'astro.config.mjs'),
    config.replace(
      'export default defineConfig({',
      'const customConfig = {}\nexport default defineConfig({ ...customConfig,'
    )
  )
  const previous = await read(spread, 'package.json')
  await assert.rejects(add(spread, ['mail']), /spreads/)
  assert.equal(await read(spread, 'package.json'), previous)
})

test(
  'generated basic Action and activated API Live Collection execute through Astro without Mail or auth',
  { timeout: 30000 },
  async (t) => {
    let fail = false
    const provider = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
      fetch: () =>
        fail
          ? Response.json({ success: false, data: [] }, { status: 503 })
          : Response.json({
              success: true,
              data: [
                {
                  id: '1',
                  title: 'Fixture article',
                  locale: 'en-US',
                  draft: false
                }
              ],
              meta: { page: 1, pageCount: 1 }
            })
    })
    t.after(() => provider.stop(true))
    const directory = await fixture(t, {
      features: ['actions', 'content'],
      contentSource: 'api',
      protocol: 'rest',
      contentMode: 'live',
      collection: 'news'
    })
    await symlink(
      path.join(root, 'node_modules'),
      path.join(directory, 'node_modules'),
      'junction'
    )
    await cp(
      path.join(directory, 'src/live.config.ts.example'),
      path.join(directory, 'src/live.config.ts')
    )
    await writeFile(
      path.join(directory, '.env.development'),
      `SITE_URL=http://127.0.0.1:47386\nCONTENT_NEWS_URL=${provider.url.origin}/\nCONTENT_NEWS_ENDPOINT=posts\n`
    )
    await mkdir(path.join(directory, 'src/pages/api'), { recursive: true })
    await writeFile(
      path.join(directory, 'src/pages/api/news.ts'),
      `import { getLiveCollection } from 'astro:content'
export const prerender = false
export const GET = async () => {
 const { entries, error } = await getLiveCollection('news', { locale: 'en-us' })
 return Response.json(error ? { error: true } : { entries }, { status: error ? 503 : 200, headers: { 'Cache-Control': 'no-store' } })
}`
    )
    const server = await dev({
      root: pathToFileURL(directory + '/'),
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 47386, strictPort: true }
    })
    t.after(() => server.stop())
    const origin = `http://127.0.0.1:${server.address.port}`
    const post = async (requestOrigin) => {
      const form = new FormData()
      form.set('name', 'Sam')
      form.set('locale', 'en-us')
      return fetch(origin + '/_actions/basic', {
        method: 'POST',
        headers: { Origin: requestOrigin },
        body: form,
        signal: AbortSignal.timeout(10000)
      })
    }
    assert.equal((await post(origin)).status, 200)
    assert.equal((await post('https://other.example')).status, 403)
    const live = await fetch(origin + '/api/news', {
      signal: AbortSignal.timeout(10000)
    })
    assert.equal(live.status, 200, await live.clone().text())
    const data = await live.json()
    assert.equal(data.entries[0].id, 'en-us/1')
    assert.equal(data.entries[0].data.title, 'Fixture article')
    fail = true
    assert.equal(
      (
        await fetch(origin + '/api/news', {
          signal: AbortSignal.timeout(10000)
        })
      ).status,
      503
    )
  }
)

test('Workers keeps contact inactive when adding a separate working Action', async (t) => {
  const directory = await fixture(t, {
    deployment: 'cloudflare',
    features: ['mail'],
    scaffold: true
  })
  assert.equal(await exists(directory, 'src/actions/index.ts'), false)
  await add(directory, ['actions'])
  const active = await read(directory, 'src/actions/index.ts')
  assert.match(active, /basic/)
  assert.doesNotMatch(active, /contact/)
  assert.match(await read(directory, 'src/actions/index.ts.example'), /contact/)
})

test(
  'file application detects changed source and restores its own writes after a filesystem failure',
  { skip: process.platform === 'win32' || process.getuid?.() === 0 },
  async (t) => {
    const directory = await fixture(t)
    await writeFile(path.join(directory, 'keep.txt'), 'original')
    const capture = createReader(directory)
    await capture.read('keep.txt')
    await writeFile(path.join(directory, 'keep.txt'), 'user update')
    await assert.rejects(
      applyFiles(directory, new Map([['new.txt', 'new']]), {
        expected: capture.expected
      }),
      /changed during planning/
    )
    assert.equal(await exists(directory, 'new.txt'), false)
    const locked = path.join(directory, 'locked')
    await mkdir(locked)
    await chmod(locked, 0o555)
    try {
      await assert.rejects(
        applyFiles(
          directory,
          new Map([
            ['keep.txt', 'installer update'],
            ['locked/new.txt', 'not writable']
          ])
        )
      )
      assert.equal(await read(directory, 'keep.txt'), 'user update')
      assert.equal(await exists(directory, 'locked/new.txt'), false)
    } finally {
      await chmod(locked, 0o755)
    }
  }
)
