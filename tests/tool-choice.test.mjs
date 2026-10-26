import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { selectTools, projectTools } from '../packages/cli/lib/process.mjs'
import { createProject } from '../packages/cli/lib/project.mjs'
import { addIntegrations } from '../packages/cli/lib/integrations.mjs'
import { exists, json, read } from '../packages/cli/lib/files.mjs'
const root = fileURLToPath(new URL('../', import.meta.url))
const template = path.join(root, 'packages/cli/template')
const kitVersion = (await json(root)).version
const versions = { npm: '11.2.0', pnpm: '12.9.1', bun: '1.4.4' }

test('consumer manager and runtime choices configure all adapters and survive later additions', async (t) => {
  const parent = await mkdtemp(path.join(tmpdir(), 'samline-tool-choice-'))
  t.after(() => rm(parent, { recursive: true, force: true }))
  for (const manager of ['npm', 'pnpm', 'bun']) {
    for (const runtime of ['node', 'bun']) {
      for (const deployment of [
        'static',
        'vercel',
        'netlify',
        'cloudflare',
        'custom'
      ]) {
        const tools = selectTools(versions, { manager, runtime })
        const destination = path.join(
          parent,
          `${manager}-${runtime}-${deployment}`
        )
        await createProject({
          template,
          destination,
          kitVersion,
          tools,
          deployment
        })
        const manifest = await json(destination)
        assert.equal(manifest.packageManager, `${manager}@${versions[manager]}`)
        assert.equal(manifest.samlineAstro.tools.runtime, runtime)
        assert.equal(projectTools(manifest).manager, manager)
        assert.equal(projectTools(manifest).runtime, runtime)
        assert.match(
          await read(destination, 'scripts/check-package-manager.mjs'),
          new RegExp(`${manager}/`)
        )
        if (runtime === 'node')
          assert.match(await read(destination, 'bunfig.toml'), /bun = false/)
        if (deployment === 'vercel') {
          const config = JSON.parse(await read(destination, 'vercel.json'))
          assert.equal(
            config.installCommand,
            manager === 'npm'
              ? 'npm ci'
              : `${manager} install --frozen-lockfile`
          )
          if (manager === 'bun')
            assert.deepEqual(manifest.overrides, (await json(root)).overrides)
        }
        if (manager === 'bun' && deployment === 'cloudflare')
          assert.deepEqual(manifest.trustedDependencies, ['esbuild', 'workerd'])
        if (deployment === 'static') {
          await addIntegrations({
            root: destination,
            template,
            kitVersion,
            requested: ['themes']
          })
          assert.equal(
            (await json(destination)).packageManager,
            manifest.packageManager
          )
          assert.equal(projectTools(await json(destination)).runtime, runtime)
        }
      }
    }
  }
})

test('explicit unavailable or unsupported tools fail instead of silently falling back', () => {
  assert.throws(
    () => selectTools({ npm: versions.npm }, { manager: 'bun' }),
    /not available/
  )
  assert.throws(
    () => selectTools({ npm: versions.npm }, { runtime: 'bun' }),
    /not available/
  )
  assert.throws(
    () => selectTools(versions, { manager: 'yarn' }),
    /Choose npm, pnpm or bun/
  )
  assert.throws(
    () => selectTools(versions, { runtime: 'deno' }),
    /Choose node or bun/
  )
})

test(
  'unattended CLI follows the launcher and explicit choices override it',
  { skip: process.platform === 'win32' },
  async (t) => {
    const parent = await mkdtemp(path.join(tmpdir(), 'samline-tool-launcher-'))
    t.after(() => rm(parent, { recursive: true, force: true }))
    const bin = path.join(parent, 'bin')
    await mkdir(bin)
    for (const [tool, version] of Object.entries(versions))
      await writeFile(path.join(bin, tool), `#!/bin/sh\necho ${version}\n`, {
        mode: 0o755
      })
    for (const launcher of ['npm', 'pnpm', 'bun']) {
      for (const explicit of [false, true]) {
        const destination = path.join(parent, `${launcher}-${explicit}`)
        const result = spawnSync(
          process.execPath,
          [
            path.join(root, 'packages/cli/bin/samline-astro.mjs'),
            destination,
            '--minimal',
            '--deploy',
            'static',
            '--no-install',
            ...(explicit
              ? ['--package-manager', 'npm', '--runtime', 'bun']
              : [])
          ],
          {
            env: {
              ...process.env,
              PATH: bin,
              npm_config_user_agent: `${launcher}/${versions[launcher]}`
            },
            encoding: 'utf8'
          }
        )
        assert.equal(result.status, 0, result.stdout + result.stderr)
        const manifest = await json(destination)
        assert.equal(
          manifest.samlineAstro.tools.manager,
          explicit ? 'npm' : launcher
        )
        assert.equal(
          manifest.samlineAstro.tools.runtime,
          explicit || launcher === 'bun' ? 'bun' : 'node'
        )
      }
    }
    await rm(path.join(bin, 'bun'))
    const missing = path.join(parent, 'missing-tool')
    const failed = spawnSync(
      process.execPath,
      [
        path.join(root, 'packages/cli/bin/samline-astro.mjs'),
        missing,
        '--minimal',
        '--no-install',
        '--package-manager',
        'bun'
      ],
      { env: { ...process.env, PATH: bin }, encoding: 'utf8' }
    )
    assert.notEqual(failed.status, 0)
    assert.equal(await exists(missing, 'package.json'), false)
    assert.match(failed.stderr, /not available/)
  }
)

test('older Bun cannot silently omit the Vercel dependency policy or write files', async (t) => {
  const parent = await mkdtemp(path.join(tmpdir(), 'samline-bun-compat-'))
  t.after(() => rm(parent, { recursive: true, force: true }))
  const destination = path.join(parent, 'site')
  await assert.rejects(
    createProject({
      template,
      destination,
      kitVersion,
      deployment: 'vercel',
      tools: selectTools(
        { ...versions, bun: '1.3.14' },
        { manager: 'bun', runtime: 'node' }
      )
    }),
    /requires Bun 1.4.0/
  )
  assert.equal(await exists(destination, 'package.json'), false)
})

test(
  'creation through npm installs with the chosen manager without inheriting npm identity',
  { skip: process.platform === 'win32' },
  async (t) => {
    const parent = await mkdtemp(path.join(tmpdir(), 'samline-cross-launcher-'))
    t.after(() => rm(parent, { recursive: true, force: true }))
    const bin = path.join(parent, 'bin')
    await mkdir(bin)
    const agentLog = path.join(parent, 'install-agent.json')
    await writeFile(
      path.join(bin, 'bun'),
      `#!${process.execPath}
import { writeFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
if (process.argv[2] === '--version') console.log('1.4.4')
else if (process.argv[2] === 'install') {
  writeFileSync(${JSON.stringify(agentLog)}, JSON.stringify({ inherited: process.env.npm_config_user_agent ?? null }))
  const env = { ...process.env, npm_config_user_agent: process.env.npm_config_user_agent ?? 'bun/1.4.4' }
  const check = spawnSync(${JSON.stringify(process.execPath)}, ['scripts/check-package-manager.mjs'], { env, encoding: 'utf8' })
  if (check.status !== 0) { console.error(check.stderr); process.exit(1) }
  mkdirSync('node_modules/prettier/bin', { recursive: true })
  writeFileSync('node_modules/prettier/bin/prettier.cjs', '')
}
`,
      { mode: 0o755 }
    )
    const destination = path.join(parent, 'site')
    const result = spawnSync(
      process.execPath,
      [
        path.join(root, 'packages/cli/bin/samline-astro.mjs'),
        destination,
        '--yes',
        '--deploy',
        'static',
        '--package-manager',
        'bun',
        '--runtime',
        'node'
      ],
      {
        env: {
          ...process.env,
          PATH: `${bin}${path.delimiter}${process.env.PATH}`,
          npm_config_user_agent: 'npm/11.2.0'
        },
        encoding: 'utf8'
      }
    )
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.deepEqual(JSON.parse(await readFile(agentLog, 'utf8')), {
      inherited: null
    })
    assert.equal(
      (await json(destination)).samlineAstro.dependenciesInstalled,
      true
    )
  }
)
