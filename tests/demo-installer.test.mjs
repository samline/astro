import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  mkdtemp,
  realpath,
  readFile,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createProject } from '../packages/cli/lib/project.mjs'
import { addIntegrations } from '../packages/cli/lib/integrations.mjs'
import { read, json, exists, listFiles } from '../packages/cli/lib/files.mjs'
import { selectTools } from '../packages/cli/lib/process.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const template = path.join(root, 'packages/cli/template')
const kitVersion = (await json(root)).version
const tools = selectTools({ pnpm: '12.9.1', bun: '1.3.14', npm: '11.2.0' })

const fixture = async (t, selected) => {
  const parent = await realpath(
    await mkdtemp(path.join(tmpdir(), 'astro-demo-test-'))
  )
  t.after(() => rm(parent, { recursive: true, force: true }))
  const destination = path.join(parent, 'site')
  await createProject({
    template,
    destination,
    tools,
    kitVersion,
    deployment: 'static',
    features: selected,
    locale: 'es-mx',
    additionalLocales: ['en-us']
  })
  return destination
}

const build = async (directory) => {
  await symlink(
    path.join(root, 'node_modules'),
    path.join(directory, 'node_modules'),
    'junction'
  )
  for (const command of ['check', 'build']) {
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

const navigation = (html, currentPath) => {
  const header = html.match(/<header\b[^>]*>([\s\S]*?)<\/header>/)?.[1]
  assert.ok(header, 'A demo header is rendered.')
  const links = [...header.matchAll(/<a\b[^>]*>/g)]
    .map((match) => match[0])
    .filter((link) => !link.includes('hreflang='))
  const active = links.filter((link) => link.includes('aria-current="page"'))
  assert.equal(
    active.length,
    1,
    'Only the current page has an active nav link.'
  )
  assert.ok(active[0].includes(`href="${currentPath}"`), active[0])
  assert.equal((html.match(/<main\b/g) ?? []).length, 1)
  assert.equal((html.match(/<head\b/g) ?? []).length, 1)
  assert.equal((html.match(/<header\b/g) ?? []).length, 1)
  assert.equal((html.match(/<footer\b/g) ?? []).length, 1)
}

test(
  'welcome builds both localized pages with correct current links and only selected controls',
  { timeout: 60000 },
  async (t) => {
    for (const controls of [false, true]) {
      const directory = await fixture(
        t,
        controls ? ['welcome', 'themes', 'language-picker'] : ['welcome']
      )
      const header = await read(
        directory,
        'src/sections/DemoHeader/index.astro'
      )
      for (const name of ['ThemeSwitch', 'LanguagePicker'])
        assert.equal(header.includes(name), controls)
      assert.equal(
        await exists(directory, 'src/sections/DemoHeader/Navigation.astro'),
        true
      )
      assert.equal(
        await exists(directory, 'src/sections/Welcome/README.md'),
        true
      )
      for (const route of ['index', 'demo']) {
        const page = await read(
          directory,
          `src/pages/[...locale]/${route}.astro`
        )
        assert.doesNotMatch(
          page,
          /DemoHeader|DemoFooter|slot=['"](?:header|footer)/
        )
      }
      await writeFile(
        path.join(directory, 'src/pages/ordinary.astro'),
        `---
import Main from '@/layouts/Main.astro'
import DemoPage from '@/sections/DemoPage/index.astro'
---
<Main path='/ordinary'><DemoPage /></Main>
`
      )
      await writeFile(
        path.join(directory, 'src/pages/overrides.astro'),
        `---
import Main from '@/layouts/Main.astro'
import DemoPage from '@/sections/DemoPage/index.astro'
---
<Main path='/overrides'>
  <meta slot='head' name='layout-override' content='preserved' />
  <header slot='header' data-custom-header />
  <DemoPage />
  <footer slot='footer' data-custom-footer />
  <div slot='body-end' data-body-end />
</Main>
`
      )
      await build(directory)
      for (const file of ['ordinary/index.html', '404.html']) {
        const html = await read(directory, `dist/${file}`)
        for (const tag of ['head', 'header', 'main', 'footer'])
          assert.equal(
            (html.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length,
            1,
            `${file}: ${tag}`
          )
        assert.match(html, /data-demo-header/)
        assert.match(html, /data-demo-footer/)
      }
      const overrides = await read(directory, 'dist/overrides/index.html')
      assert.doesNotMatch(overrides, /data-demo-header|data-demo-footer/)
      assert.match(overrides, /name="layout-override" content="preserved"/)
      assert.match(overrides, /data-custom-header/)
      assert.match(overrides, /data-custom-footer/)
      assert.match(overrides, /<\/main>[\s\S]*data-body-end/)
      for (const tag of ['head', 'header', 'main', 'footer'])
        assert.equal(
          (overrides.match(new RegExp(`<${tag}\\b`, 'g')) ?? []).length,
          1
        )
      for (const [file, currentPath, locale] of [
        ['index.html', '/', 'es-mx'],
        ['demo/index.html', '/demo', 'es-mx'],
        ['en-us/index.html', '/en-us', 'en-us'],
        ['en-us/demo/index.html', '/en-us/demo', 'en-us']
      ]) {
        const html = await read(directory, `dist/${file}`)
        navigation(html, currentPath)
        assert.match(html, new RegExp(`lang="${locale}"`))
        assert.equal(html.includes('data-theme-switch'), controls)
      }
      const secondPage = await read(directory, 'dist/demo/index.html')
      if (controls) {
        const languageLinks = [
          ...secondPage.matchAll(/<a\b[^>]*hreflang="[^"]+"[^>]*>/g)
        ].map((match) => match[0])
        assert.ok(
          languageLinks.some((link) => link.includes('href="/en-us/demo"'))
        )
      }
    }
  }
)

test(
  'core-only output omits the demo; later add preserves the homepage and supplies an inspectable demo route',
  { timeout: 75000 },
  async (t) => {
    const directory = await fixture(t, [])
    for (const file of [
      'src/pages/[...locale]/demo.astro',
      'src/sections/Welcome',
      'src/sections/DemoHeader',
      'src/sections/DemoFooter',
      'src/sections/DemoPage',
      'src/i18n/dictionaries/es-mx/welcome',
      'src/i18n/dictionaries/es-mx/navigation'
    ])
      assert.equal(await exists(directory, file), false, file)
    const homepage = await read(directory, 'src/pages/[...locale]/index.astro')
    let layout = await read(directory, 'src/layouts/Main.astro')
    assert.doesNotMatch(homepage, /DemoHeader|DemoFooter|Welcome/)
    assert.doesNotMatch(layout, /DemoHeader|DemoFooter/)
    layout = layout
      .replace(
        "<slot name='header' />",
        "<slot name='header'><header data-custom-site-header /></slot>"
      )
      .replace(
        "<slot name='footer' />",
        "<slot name='footer'><footer data-custom-site-footer /></slot>"
      )
    await writeFile(path.join(directory, 'src/layouts/Main.astro'), layout)
    await addIntegrations({
      root: directory,
      template,
      kitVersion,
      requested: ['welcome']
    })
    assert.equal(
      await read(directory, 'src/pages/[...locale]/index.astro'),
      homepage
    )
    assert.equal(await read(directory, 'src/layouts/Main.astro'), layout)
    const demoRoute = await read(directory, 'src/pages/[...locale]/demo.astro')
    assert.match(demoRoute, /@\/layouts\/Demo\.astro/)
    assert.doesNotMatch(
      demoRoute,
      /DemoHeader|DemoFooter|slot=['"](?:header|footer)/
    )
    assert.equal(
      await exists(directory, 'src/pages/[...locale]/demo.astro'),
      true
    )
    const header = await read(directory, 'src/sections/DemoHeader/index.astro')
    assert.doesNotMatch(header, /ThemeSwitch|LanguagePicker/)
    await build(directory)
    const home = await read(directory, 'dist/index.html')
    assert.match(home, /data-custom-site-header/)
    assert.match(home, /data-custom-site-footer/)
    assert.doesNotMatch(home, /data-demo-header|data-demo-footer/)
    const demo = await read(directory, 'dist/demo/index.html')
    assert.doesNotMatch(demo, /data-custom-site-header|data-custom-site-footer/)
    navigation(demo, '/demo')
  }
)

test('adding welcome refuses missing layout slots without changing any project files', async (t) => {
  for (const missing of ['header', 'footer', 'both']) {
    const directory = await fixture(t, [])
    const file = path.join(directory, 'src/layouts/Main.astro')
    let layout = await readFile(file, 'utf8')
    for (const name of ['header', 'footer'])
      if (missing === name || missing === 'both')
        layout = layout.replace(`<slot name='${name}' />`, '')
    // A comment or a script string is not an actual named slot.
    layout += `\n<!-- <slot name='header' /><slot name='footer' /> -->\n<script is:inline>const example = "<slot name='header' /><slot name='footer' />"</script>\n`
    await writeFile(file, layout)
    const snapshot = async () =>
      Promise.all(
        (await listFiles(directory)).map(async (name) => [
          name,
          await readFile(path.join(directory, name))
        ])
      )
    const before = await snapshot()
    await assert.rejects(
      addIntegrations({
        root: directory,
        template,
        kitVersion,
        requested: ['welcome']
      }),
      /welcome demo needs one static (header|footer) slot.*Main\.astro/
    )
    assert.deepEqual(await snapshot(), before)
  }
})
