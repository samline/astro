import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cp,
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))

test('release version advances both manifests within the supported Astro major', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'astro-kit-release-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  await mkdir(path.join(directory, 'scripts'))
  await mkdir(path.join(directory, 'packages/cli'), { recursive: true })
  const script = path.join(directory, 'scripts/release-version.mjs')
  await cp(path.join(root, 'scripts/release-version.mjs'), script)
  const files = ['package.json', 'packages/cli/package.json']
  for (const file of files) {
    await writeFile(
      path.join(directory, file),
      JSON.stringify({ version: '7.0.0', dependencies: { astro: '^7.4.2' } })
    )
  }
  for (const version of ['7.0.0', '6.0.1', '8.0.0', '07.0.1', '7.00.1']) {
    assert.equal(
      spawnSync(process.execPath, [script, version]).status,
      1,
      version
    )
  }
  assert.equal(spawnSync(process.execPath, [script, '7.1.0']).status, 0)
  for (const file of files) {
    assert.equal(
      JSON.parse(await readFile(path.join(directory, file), 'utf8')).version,
      '7.1.0'
    )
  }
  assert.equal(spawnSync(process.execPath, [script, '7.0.9']).status, 1)
})

test(
  'published tarball is standalone, contains dotfiles and excludes local state',
  { skip: process.platform === 'win32' },
  async (t) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'astro-kit-package-'))
    t.after(() => rm(directory, { recursive: true, force: true }))
    const pack = spawnSync(
      'pnpm',
      [
        '--dir',
        path.join(root, 'packages/cli'),
        'pack',
        '--pack-destination',
        directory
      ],
      { encoding: 'utf8', timeout: 30000 }
    )
    assert.equal(pack.status, 0, pack.stdout + pack.stderr)
    const archive = path.join(
      directory,
      (await readdir(directory)).find((file) => file.endsWith('.tgz'))
    )
    const list = spawnSync('tar', ['-tf', archive], { encoding: 'utf8' })
    assert.equal(list.status, 0, list.stderr)
    const files = list.stdout.trim().split('\n')
    assert.ok(files.includes('package/template/_gitignore'))
    assert.ok(files.includes('package/template/.env.example'))
    assert.ok(files.includes('package/template/.vscode/settings.json'))
    assert.ok(files.includes('package/template/src/components/SEO.astro'))
    assert.ok(files.includes('package/template/src/styles/global.css'))
    assert.ok(files.includes('package/template/src/styles/tailwind.css'))
    assert.ok(files.includes('package/template/src/components/Box.astro'))
    assert.ok(files.includes('package/template/src/components/Link.astro'))
    assert.ok(
      files.includes('package/template/src/components/ThemeSwitch.astro')
    )
    assert.ok(files.includes('package/template/src/components/ThemeInit.astro'))
    assert.ok(files.includes('package/template/src/config/theme.ts'))
    assert.ok(files.includes('package/template/src/components/Section.astro'))
    assert.ok(files.includes('package/template/src/layouts/Main.astro'))
    assert.ok(
      files.includes('package/template/src/sections/Welcome/index.astro')
    )
    assert.ok(
      files.includes('package/template/src/sections/NotFound/index.astro')
    )
    for (const section of ['Welcome', 'NotFound']) {
      assert.ok(
        files.includes(
          `package/template/src/sections/${section}/${section}Content.astro`
        )
      )
      assert.ok(
        !files.includes(
          `package/template/src/components/${section}Content.astro`
        )
      )
    }
    assert.ok(!files.includes('package/template/src/layouts/Layout.astro'))
    assert.ok(!files.includes('package/template/src/components/Welcome.astro'))
    assert.ok(files.includes('package/template/src/pages/robots.txt.ts'))
    for (const folder of ['img', 'docs', 'video'])
      assert.ok(files.includes(`package/template/public/${folder}/.gitkeep`))
    for (const locale of ['en-us', 'en-mx']) {
      assert.ok(
        files.includes(
          `package/template/src/i18n/dictionaries/${locale}/common/index.ts`
        )
      )
      assert.ok(
        files.includes(
          `package/template/src/i18n/dictionaries/${locale}/common/types.ts`
        )
      )
      assert.ok(
        files.includes(
          `package/template/src/i18n/dictionaries/${locale}/buttons/index.ts`
        )
      )
      assert.ok(
        !files.includes(`package/template/src/i18n/dictionaries/${locale}.ts`)
      )
    }
    for (const file of files) {
      assert.ok(
        !/(?:^|\/)(?:node_modules|\.git|\.astro|\.vercel|\.local|dist|artifacts|AGENTS\.md)(?:\/|$)/.test(
          file
        ),
        file
      )
      assert.ok(!/(?:^|\/)\.env(?!\.example$)/.test(file), file)
      assert.ok(!file.endsWith('pnpm-lock.yaml'), file)
    }
    const unpacked = path.join(directory, 'unpacked')
    await mkdir(unpacked)
    const extract = spawnSync('tar', ['-xf', archive, '-C', unpacked])
    assert.equal(extract.status, 0)
    const pkg = JSON.parse(
      await readFile(path.join(unpacked, 'package/package.json'), 'utf8')
    )
    assert.equal(pkg.name, '@samline/astro-kit')
    assert.equal(pkg.bin['astro-kit'], 'bin/astro-kit.mjs')
    assert.equal(pkg.dependencies, undefined)
    assert.notEqual(pkg.private, true)
    const bin = path.join(directory, 'bin')
    await mkdir(bin)
    await writeFile(path.join(bin, 'npm'), '#!/bin/sh\necho 11.2.0\n', {
      mode: 0o755
    })
    const destination = path.join(directory, 'generated')
    const create = spawnSync(
      process.execPath,
      [
        path.join(unpacked, 'package/bin/astro-kit.mjs'),
        destination,
        '--deploy',
        'static',
        '--no-install'
      ],
      { env: { ...process.env, PATH: bin }, encoding: 'utf8' }
    )
    assert.equal(create.status, 0, create.stdout + create.stderr)
    const generated = JSON.parse(
      await readFile(path.join(destination, 'package.json'), 'utf8')
    )
    assert.equal(generated.scripts.build, 'astro build')
    assert.equal(generated.packageManager, 'npm@11.2.0')
    assert.ok(
      (await readFile(path.join(destination, '.gitignore'), 'utf8')).includes(
        '.env*'
      )
    )
    assert.ok(!(await readdir(destination)).includes('_gitignore'))
    assert.ok(!(await readdir(destination)).includes('node_modules'))
    // Build from the extracted tarball: the generator's config rewrite and
    // distribution boundary must preserve the entire SEO feature without Vercel.
    await symlink(
      path.join(root, 'node_modules'),
      path.join(destination, 'node_modules')
    )
    const build = spawnSync(
      process.execPath,
      [path.join(destination, 'node_modules/astro/bin/astro.mjs'), 'build'],
      {
        cwd: destination,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          SITE_URL: 'https://generated.example',
          SITE_INDEXABLE: 'true'
        },
        encoding: 'utf8',
        timeout: 20000
      }
    )
    assert.equal(build.status, 0, build.stdout + build.stderr)
    assert.ok(
      (
        await readFile(path.join(destination, 'dist/index.html'), 'utf8')
      ).includes('property="og:locale" content="en_US"')
    )
    assert.ok(
      (
        await readFile(path.join(destination, 'dist/robots.txt'), 'utf8')
      ).includes('Sitemap: https://generated.example/sitemap-index.xml')
    )
  }
)
