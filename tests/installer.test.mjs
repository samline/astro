import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  mkdtemp,
  readFile,
  writeFile,
  mkdir,
  rm,
  readdir,
  symlink
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createProject } from '../packages/cli/lib/project.mjs'
import { selectTools } from '../packages/cli/lib/process.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const template = path.join(root, 'packages/cli/template')
const readme = path.join(root, 'packages/cli/project-readme.md')
const readJSON = async (file) => JSON.parse(await readFile(file, 'utf8'))
const kitVersion = (await readJSON(path.join(root, 'package.json'))).version

async function temporary(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'astro-kit-test-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  return directory
}

for (const pnpm of [true, false]) {
  for (const bun of [true, false]) {
    test(`generates consistent project: pnpm=${pnpm}, bun=${bun}`, async (t) => {
      const directory = await temporary(t)
      const tools = selectTools({
        npm: '11.2.0',
        ...(pnpm ? { pnpm: '12.9.1' } : {}),
        ...(bun ? { bun: '1.3.14' } : {})
      })
      const destination = path.join(directory, 'my-project')
      await createProject({
        template,
        readme,
        destination,
        tools,
        kitVersion
      })
      const pkg = await readJSON(path.join(destination, 'package.json'))
      const vercel = await readJSON(path.join(destination, 'vercel.json'))
      const runner = bun ? 'bun' : 'npm'
      const manager = pnpm ? 'pnpm' : 'npm'
      assert.equal(pkg.name, 'my-project')
      assert.equal(pkg.version, '0.0.1')
      assert.equal(pkg.private, true)
      assert.equal(pkg.astroKit.version, kitVersion)
      assert.equal(
        pkg.packageManager,
        `${manager}@${pnpm ? '12.9.1' : '11.2.0'}`
      )
      assert.equal(
        pkg.scripts.build,
        bun
          ? 'bun --bun ./node_modules/astro/bin/astro.mjs build'
          : 'astro build'
      )
      assert.equal(
        pkg.scripts.verify,
        `${runner} run format:check && ${runner} run check && ${runner} run build`
      )
      assert.equal(
        vercel.installCommand,
        pnpm ? 'pnpm install --frozen-lockfile' : 'npm ci'
      )
      assert.equal(
        vercel.buildCommand,
        `${runner} run check && ${runner} run build`
      )
      assert.equal(vercel.bunVersion, bun ? '1.x' : undefined)
      assert.equal(pkg.engines.bun, bun ? '>=1.3.14' : undefined)
      assert.equal(pkg.scripts['kit:pack'], undefined)
      assert.ok(
        (await readFile(path.join(destination, 'README.md'), 'utf8')).includes(
          `${runner} run dev`
        )
      )
      assert.ok(
        (await readFile(path.join(destination, '.gitignore'), 'utf8')).includes(
          '.env*'
        )
      )
      assert.equal(
        (await readJSON(path.join(destination, '.vscode/launch.json')))
          .configurations[0].command,
        `${runner} run dev`
      )
      assert.equal(
        await readFile(path.join(destination, '.env.development'), 'utf8'),
        await readFile(path.join(destination, '.env.example'), 'utf8')
      )
      const hook = path.join(destination, 'scripts/check-package-manager.mjs')
      for (const candidate of ['pnpm', 'npm']) {
        const result = spawnSync(process.execPath, [hook], {
          env: { ...process.env, npm_config_user_agent: `${candidate}/1.0.0` }
        })
        assert.equal(result.status, candidate === manager ? 0 : 1)
      }
      for (const forbidden of [
        'node_modules',
        'dist',
        '.astro',
        '.vercel',
        '.local',
        'AGENTS.md',
        'packages',
        'pnpm-lock.yaml',
        'package-lock.json'
      ]) {
        assert.ok(!(await readdir(destination)).includes(forbidden), forbidden)
      }
    })
  }
}

test('rejects existing files, nonempty folders and symlink destinations without changing contents', async (t) => {
  const directory = await temporary(t)
  const tools = selectTools({ npm: '11.2.0' })
  const full = path.join(directory, 'full')
  await mkdir(full)
  await writeFile(path.join(full, 'keep.txt'), 'keep')
  const file = path.join(directory, 'file')
  await writeFile(file, 'keep')
  const link = path.join(directory, 'link')
  await symlink(full, link)
  for (const destination of [full, file, link]) {
    await assert.rejects(
      createProject({
        template,
        readme,
        destination,
        tools,
        kitVersion
      }),
      /destino ya existe/
    )
  }
  assert.equal(await readFile(path.join(full, 'keep.txt'), 'utf8'), 'keep')
  assert.deepEqual(await readdir(full), ['keep.txt'])
  assert.equal(await readFile(file, 'utf8'), 'keep')
})

test('requires at least npm when pnpm is absent', () => {
  assert.throws(() => selectTools({ bun: '1.3.14' }), /pnpm ni npm/)
  assert.throws(
    () => selectTools({ pnpm: '12.9.1' }),
    /Sin Bun se necesita npm/
  )
})

test('invalid package directory names fail before creating files', async (t) => {
  const directory = await temporary(t)
  await assert.rejects(
    createProject({
      template,
      readme,
      destination: path.join(directory, 'bad;name'),
      tools: selectTools({ npm: '11.2.0' }),
      kitVersion
    }),
    /nombre de carpeta/
  )
  assert.deepEqual(await readdir(directory), [])
})

test(
  'CLI detects PATH tools and performs the chosen installation',
  { skip: process.platform === 'win32' },
  async (t) => {
    const directory = await temporary(t)
    for (const pnpm of [true, false]) {
      for (const bun of [true, false]) {
        const scenario = path.join(directory, `p${pnpm}-b${bun}`)
        const bin = path.join(scenario, 'bin')
        await mkdir(bin, { recursive: true })
        const versions = {
          npm: '11.2.0',
          ...(pnpm ? { pnpm: '12.9.1' } : {}),
          ...(bun ? { bun: '1.3.14' } : {})
        }
        for (const [name, version] of Object.entries(versions)) {
          await writeFile(
            path.join(bin, name),
            `#!/bin/sh\nif [ "$1" = "--version" ]; then\n  echo '${version}'\n  exit 0\nfi\necho '${name}' "$@" >> commands.log\n`,
            { mode: 0o755 }
          )
        }
        const destination = path.join(scenario, 'project with spaces')
        const cli = path.join(root, 'packages/cli/bin/astro-kit.mjs')
        const result = spawnSync(process.execPath, [cli, destination], {
          env: { ...process.env, PATH: bin },
          encoding: 'utf8'
        })
        assert.equal(result.status, 0, result.stdout + result.stderr)
        assert.equal(
          await readFile(path.join(destination, 'commands.log'), 'utf8'),
          `${pnpm ? 'pnpm' : 'npm'} install\n${bun ? 'bun' : 'npm'} run format\n`
        )
        assert.equal(
          (await readJSON(path.join(destination, 'package.json'))).name,
          'project-with-spaces'
        )
        const retry = spawnSync(
          process.execPath,
          [cli, destination, '--no-install'],
          { env: { ...process.env, PATH: bin }, encoding: 'utf8' }
        )
        assert.equal(retry.status, 1)
      }
    }
  }
)

test('CLI rejects bad arguments and prints version without requiring tools', () => {
  const cli = path.join(root, 'packages/cli/bin/astro-kit.mjs')
  const result = spawnSync(process.execPath, [cli, '--version'], {
    env: { ...process.env, PATH: '' },
    encoding: 'utf8'
  })
  assert.equal(result.status, 0)
  assert.equal(result.stdout.trim(), kitVersion)
  for (const args of [['--unknown'], ['a', 'b'], []]) {
    const invalid = spawnSync(process.execPath, [cli, ...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    })
    assert.equal(invalid.status, 1)
  }
})
