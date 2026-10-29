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
    for (const file of [
      'LICENSE',
      'THIRD_PARTY_NOTICES.md',
      'licenses/astro-MIT.txt'
    ])
      assert.ok(files.includes(`package/${file}`), file)
    for (const file of [
      'THIRD_PARTY_NOTICES.md',
      'licenses/astro-MIT.txt',
      'licenses/samline-astro-MIT.txt',
      '.agents/memory/frontend-conventions.md',
      '.agents/memory/reveal-recipe.md'
    ])
      assert.ok(files.includes(`package/template/${file}`), file)
    const templateManifest = JSON.parse(
      await readFile(
        path.join(root, 'packages/cli/template/package.json'),
        'utf8'
      )
    )
    assert.ok(
      !Object.keys(templateManifest.scripts).some((name) =>
        name.startsWith('site:')
      )
    )
    assert.ok(!files.some((file) => /(?:^|\/)website(?:\/|$)/.test(file)))
    for (const file of [
      'AGENTS.md',
      '.agents/README.md',
      '.agents/AGENTS.md',
      '.agents/memory/project.md',
      '.agents/memory/decisions.md',
      '.agents/lessons.md',
      '.agents/todos.md',
      '.agents/skills/README.md',
      'skills-lock.json',
      'src/server/auth/index.ts',
      'src/server/auth/factory.ts',
      'src/server/auth/external.ts',
      'src/server/auth/remote.ts',
      'src/server/auth/access.ts',
      'src/server/auth/policy.ts',
      'src/server/auth/settings.ts',
      'src/server/auth/schema.mjs',
      'src/server/auth/README.md',
      'src/auth/client.ts',
      'src/config/auth.ts',
      'src/middleware.ts',
      'src/types/auth.d.ts',
      'src/pages/api/auth/[...all].ts.example',
      'scripts/auth-migrate.mjs',
      'src/components/Captcha/index.astro',
      'src/components/Captcha/scripts.ts',
      'src/components/Captcha/README.md',
      'src/server/captcha/index.ts',
      'src/server/captcha/verify.ts',
      'src/server/captcha/README.md',
      'src/server/mail/index.ts',
      'src/server/mail/mailer.ts',
      'src/server/mail/template.ts',
      'src/server/mail/README.md',
      'src/actions/index.ts',
      'src/actions/contact/index.ts',
      'src/actions/contact/schema.ts',
      'src/actions/contact/README.md',
      'src/content.config.ts',
      'src/content/README.md',
      'src/content/posts/index.ts',
      'src/content/posts/data/en-us/getting-started.json',
      'src/content/posts/data/es-mx/getting-started.json',
      'src/content/remote/loaders.ts',
      'src/content/live/index.ts',
      'src/content/live/api.ts',
      'src/content/live/README.md',
      'src/i18n/README.md',
      'src/live.config.ts.example',
      'src/server/content-api/client.ts',
      'src/server/content-api/README.md',
      'src/actions/content-demo/index.ts',
      'src/actions/content-demo/README.md',
      'src/i18n/dictionaries/en-us/mail/index.ts',
      'src/i18n/dictionaries/es-mx/mail/index.ts'
    ])
      assert.ok(files.includes(`package/template/${file}`), file)
    for (const name of [
      'astro',
      'tailwind-css-patterns',
      'typescript-advanced-types',
      'samline-astro',
      'vite',
      'seo',
      'accessibility',
      'frontend-design',
      'codebase-memory',
      'deploy-to-vercel'
    ])
      assert.ok(
        files.includes(`package/template/.agents/skills/${name}/SKILL.md`),
        name
      )
    assert.ok(
      !files.some(
        (file) =>
          file.includes('/skills/bun/') ||
          file.includes('/skills/samline-astro-maintainer/') ||
          file.includes('nodejs-backend-patterns') ||
          file.includes('nodejs-best-practices')
      )
    )

    assert.ok(files.includes('package/template/.vscode/settings.json'))
    assert.ok(files.includes('package/template/src/components/SEO/index.astro'))
    for (const name of ['Box', 'Section', 'Link', 'SEO', 'LanguagePicker']) {
      assert.ok(
        !files.includes(`package/template/src/components/${name}.astro`)
      )
      assert.ok(!files.includes(`package/template/src/components/${name}.md`))
    }
    for (const doc of [
      'README.md',
      'PageLoader/README.md',
      'Theme/README.md',
      'GTM/README.md',
      'Fields/README.md',
      'Box/README.md',
      'Section/README.md',
      'Link/README.md',
      'SEO/README.md',
      'LanguagePicker/README.md'
    ])
      assert.ok(files.includes(`package/template/src/components/${doc}`))

    for (const file of [
      'Form.astro',
      'Input.astro',
      'Select.astro',
      'Textarea.astro',
      'Checkbox.astro',
      'Radio.astro',
      'File.astro',
      'Fieldset.astro',
      'scripts.ts',
      'enhancements.ts',
      'types.ts',
      'styles.css'
    ])
      assert.ok(
        files.includes(`package/template/src/components/Fields/${file}`)
      )
    assert.ok(files.includes('package/template/src/styles/global.css'))
    assert.ok(files.includes('package/template/src/styles/tailwind.css'))
    assert.ok(files.includes('package/template/src/components/Box/index.astro'))
    for (const file of ['index.astro', 'scripts.ts'])
      assert.ok(
        files.includes(`package/template/src/components/PageLoader/${file}`)
      )
    assert.ok(
      files.includes('package/template/src/components/Link/index.astro')
    )
    assert.ok(
      files.includes('package/template/src/components/Theme/Switch.astro')
    )
    assert.ok(
      files.includes('package/template/src/components/Theme/Init.astro')
    )
    assert.ok(files.includes('package/template/src/config/theme.ts'))
    for (const file of [
      'Head.astro',
      'Consent.astro',
      'CookiePreferences.astro',
      'consent-sdk.ts',
      'consent.ts',
      'consent.css'
    ])
      assert.ok(files.includes(`package/template/src/components/GTM/${file}`))
    assert.ok(files.includes('package/template/src/config/gtm.ts'))
    assert.ok(!files.includes('package/template/src/components/GTM/Body.astro'))
    for (const locale of ['en-us', 'es-mx'])
      for (const file of ['index.ts', 'types.ts'])
        assert.ok(
          files.includes(
            `package/template/src/i18n/dictionaries/${locale}/cookies/${file}`
          )
        )
    assert.ok(
      files.includes('package/template/src/components/Section/index.astro')
    )
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
    for (const locale of ['en-us', 'es-mx']) {
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
        !/(?:^|\/)(?:node_modules|\.git|\.astro|\.vercel|\.local|dist|artifacts)(?:\/|$)/.test(
          file
        ),
        file
      )
      assert.ok(!/(?:^|\/)\.env(?!\.example$)/.test(file), file)
      assert.ok(!file.endsWith('pnpm-lock.yaml'), file)
    }
    for (const file of [
      'frontend-design/LICENSE.txt',
      'tailwind-css-patterns/references/configuration.md',
      'accessibility/references/WCAG.md'
    ])
      assert.ok(files.includes(`package/template/.agents/skills/${file}`))
    const unpacked = path.join(directory, 'unpacked')
    await mkdir(unpacked)
    const extract = spawnSync('tar', ['-xf', archive, '-C', unpacked])
    assert.equal(extract.status, 0)
    const pkg = JSON.parse(
      await readFile(path.join(unpacked, 'package/package.json'), 'utf8')
    )
    assert.equal(pkg.name, '@samline/astro')
    assert.equal(pkg.bin['samline-astro'], 'bin/samline-astro.mjs')
    assert.deepEqual(pkg.dependencies, { typescript: '6.0.3' })
    assert.notEqual(pkg.private, true)
    await symlink(
      path.join(root, 'node_modules'),
      path.join(unpacked, 'package/node_modules')
    )
    const bin = path.join(directory, 'bin')
    await mkdir(bin)
    await writeFile(path.join(bin, 'npm'), '#!/bin/sh\necho 11.2.0\n', {
      mode: 0o755
    })
    const destination = path.join(directory, 'generated')
    const create = spawnSync(
      process.execPath,
      [
        path.join(unpacked, 'package/bin/samline-astro.mjs'),
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
    const agentMemory = await readFile(
      path.join(destination, '.agents/memory/project.md'),
      'utf8'
    )
    assert.ok(agentMemory.includes('Project: generated'))
    assert.ok(agentMemory.includes('Deployment target: static'))
    assert.ok(agentMemory.includes('Server Islands require adding'))
    assert.ok(!agentMemory.includes('{{'))
    assert.ok(
      !/2059917|d9f3d8f|\/Users\/sam|git@github.com:samline/.test(agentMemory)
    )
    const skillLock = JSON.parse(
      await readFile(path.join(destination, 'skills-lock.json'), 'utf8')
    )
    assert.ok(!skillLock.skills['deploy-to-vercel'])
    assert.ok(!skillLock.skills.bun)
    assert.ok(!skillLock.skills['samline-astro'])
    const skillNames = await readdir(path.join(destination, '.agents/skills'))
    assert.ok(skillNames.includes('samline-astro'))
    assert.ok(!skillNames.includes('bun'))
    assert.ok(!skillNames.includes('samline-astro-maintainer'))
    assert.ok(
      !(await readdir(path.join(destination, '.agents/skills'))).includes(
        'deploy-to-vercel'
      )
    )
    assert.ok(
      (await readFile(path.join(destination, 'AGENTS.md'), 'utf8')).includes(
        '.agents/README.md'
      )
    )

    // Build from the extracted tarball: the generator's config rewrite and
    // distribution boundary must preserve the entire SEO feature without Vercel.
    await symlink(
      path.join(root, 'node_modules'),
      path.join(destination, 'node_modules')
    )
    const contextFormat = spawnSync(
      process.execPath,
      [
        path.join(root, 'node_modules/prettier/bin/prettier.cjs'),
        '.agents',
        'skills-lock.json',
        '--check'
      ],
      { cwd: destination, encoding: 'utf8', timeout: 20000 }
    )
    assert.equal(
      contextFormat.status,
      0,
      contextFormat.stdout + contextFormat.stderr
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

test('package validation rejects unexpected agent history and unselected skills', async (t) => {
  const directory = await mkdtemp(
    path.join(tmpdir(), 'astro-kit-agent-boundary-')
  )
  t.after(() => rm(directory, { recursive: true, force: true }))
  const fixture = path.join(directory, 'cli')
  await cp(path.join(root, 'packages/cli'), fixture, { recursive: true })
  const validate = () =>
    spawnSync(
      process.execPath,
      [path.join(fixture, 'scripts/validate-package.mjs')],
      { encoding: 'utf8' }
    )
  assert.equal(validate().status, 0)
  for (const file of [
    '.agents/memory/private-history.md',
    '.agents/skills/unselected/SKILL.md',
    'src/.agents/private.md'
  ]) {
    const target = path.join(fixture, 'template', file)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, 'Private maintainer context must not ship.')
    const result = validate()
    assert.notEqual(result.status, 0)
    assert.match(result.stderr, /Archivo no publicable/)
    const relativeDirectory = path.dirname(file)
    if (relativeDirectory === '.agents/memory') await rm(target)
    else await rm(path.dirname(target), { recursive: true })
  }
  assert.equal(validate().status, 0)
})
