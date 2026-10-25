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
      assert.equal(pkg.samlineAstro.version, kitVersion)
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
        `${runner} run format:check && ${runner} run check:i18n && ${runner} run check && ${runner} run build`
      )
      assert.equal(
        vercel.installCommand,
        pnpm ? 'pnpm install --frozen-lockfile' : 'npm ci'
      )
      assert.equal(
        vercel.buildCommand,
        `${runner} run check:i18n && ${runner} run check && ${runner} run build`
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
      const context = await readFile(
        path.join(destination, '.agents/AGENTS.md'),
        'utf8'
      )
      assert.ok(
        context.includes(`Install dependencies with ${manager} install`)
      )
      assert.ok(context.includes(`Run scripts with ${runner} run`))
      assert.ok(!context.includes('kit:pack'))
      const memory = await readFile(
        path.join(destination, '.agents/memory/project.md'),
        'utf8'
      )
      assert.ok(memory.includes('Project: my-project'))
      assert.ok(memory.includes(`SAM Astro ${kitVersion}`))
      assert.ok(!memory.includes('{{'))
      assert.ok(!memory.includes('2059917'))
      assert.ok(
        (await readFile(path.join(destination, 'AGENTS.md'), 'utf8')).includes(
          '.agents/README.md'
        )
      )
      assert.ok(
        (
          await readFile(path.join(destination, '.agents/todos.md'), 'utf8')
        ).includes('No pending project-specific work')
      )
      const skills = await readJSON(path.join(destination, 'skills-lock.json'))
      assert.ok(skills.skills.astro)
      assert.ok(!skills.skills['nodejs-backend-patterns'])
      assert.ok(!skills.skills['nodejs-best-practices'])
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
        const cli = path.join(root, 'packages/cli/bin/samline-astro.mjs')
        const result = spawnSync(
          process.execPath,
          [cli, destination, '--deploy', 'vercel'],
          {
            env: { ...process.env, PATH: bin },
            encoding: 'utf8'
          }
        )
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
          [cli, destination, '--no-install', '--deploy', 'vercel'],
          { env: { ...process.env, PATH: bin }, encoding: 'utf8' }
        )
        assert.equal(retry.status, 1)
      }
    }
  }
)

test('CLI rejects bad arguments and prints version without requiring tools', () => {
  const cli = path.join(root, 'packages/cli/bin/samline-astro.mjs')
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

for (const deployment of [
  'static',
  'vercel',
  'netlify',
  'cloudflare',
  'custom'
]) {
  for (const pnpm of [true, false]) {
    for (const bun of [true, false]) {
      test(`${deployment}: pnpm=${pnpm}, bun=${bun} has a coherent deployment`, async (t) => {
        const directory = await temporary(t)
        const destination = path.join(directory, 'project.with-dots')
        const tools = selectTools({
          npm: '11.2.0',
          ...(pnpm ? { pnpm: '12.9.1' } : {}),
          ...(bun ? { bun: '1.3.14' } : {})
        })
        await createProject({
          template,
          readme,
          destination,
          tools,
          kitVersion,
          deployment,
          site: 'https://example.com/'
        })
        const pkg = await readJSON(path.join(destination, 'package.json'))
        const config = await readFile(
          path.join(destination, 'astro.config.mjs'),
          'utf8'
        )
        const files = await readdir(destination)
        const inactiveActions = ['static', 'cloudflare'].includes(deployment)
        const actionRegistration = await readFile(
          path.join(
            destination,
            inactiveActions
              ? 'src/actions/index.ts.example'
              : 'src/actions/index.ts'
          ),
          'utf8'
        )
        if (['static', 'cloudflare'].includes(deployment)) {
          assert.match(
            actionRegistration,
            /^\/\/ import \{ contact \} from '\.\/contact'$/m
          )
          assert.match(
            actionRegistration,
            /^\/\/ export const server = \{ contact \}$/m
          )
          assert.doesNotMatch(actionRegistration, /^export const server/m)
          assert.ok(
            !(await readdir(path.join(destination, 'src/actions'))).includes(
              'index.ts'
            )
          )
        } else {
          assert.match(
            actionRegistration,
            /^export const server = \{ contact \}$/m
          )
        }
        const memory = await readFile(
          path.join(destination, '.agents/memory/project.md'),
          'utf8'
        )
        assert.ok(memory.includes(`Deployment target: ${deployment}`))
        assert.ok(memory.includes(`Package manager: ${tools.manager}`))
        assert.ok(memory.includes(`Script runner: ${tools.runner}`))
        assert.ok(
          memory.includes(
            deployment === 'static'
              ? 'Server Islands require adding'
              : 'Server Islands are available'
          )
        )
        assert.ok(!memory.includes('{{'))
        const agentSkills = await readdir(
          path.join(destination, '.agents/skills')
        )
        assert.equal(
          agentSkills.includes('deploy-to-vercel'),
          deployment === 'vercel'
        )
        const skillMetadata = await readJSON(
          path.join(destination, 'skills-lock.json')
        )
        assert.equal(
          Boolean(skillMetadata.skills['deploy-to-vercel']),
          deployment === 'vercel'
        )

        const adapter = {
          vercel: '@astrojs/vercel',
          netlify: '@astrojs/netlify',
          cloudflare: '@astrojs/cloudflare',
          custom: '@astrojs/node'
        }[deployment]
        assert.deepEqual(
          Object.keys(pkg.dependencies).filter((key) =>
            [
              '@astrojs/vercel',
              '@astrojs/netlify',
              '@astrojs/cloudflare',
              '@astrojs/node'
            ].includes(key)
          ),
          adapter ? [adapter] : []
        )
        assert.equal(pkg.samlineAstro.deployment, deployment)
        const envExample = await readFile(
          path.join(destination, '.env.example'),
          'utf8'
        )
        assert.ok(envExample.includes('# CAPTCHA_PROVIDER=none'))
        assert.ok(envExample.includes('# AUTH_MODE=disabled'))
        assert.ok(envExample.includes('# AUTH_API_REFRESH_PATH=auth/refresh'))
        assert.equal(
          pkg.scripts['auth:migrate'],
          `${tools.runtime === 'bun' ? 'bun' : 'node'} scripts/auth-migrate.mjs`
        )
        assert.ok(envExample.includes('# CAPTCHA_SECRET_KEY='))
        assert.ok(config.includes("output: 'static'"))
        assert.equal(config.includes('adapter:'), deployment !== 'static')
        if (adapter) assert.ok(config.includes(`from '${adapter}'`))
        assert.equal(files.includes('vercel.json'), deployment === 'vercel')
        assert.equal(files.includes('netlify.toml'), deployment === 'netlify')
        assert.equal(
          files.includes('wrangler.jsonc'),
          deployment === 'cloudflare'
        )
        assert.equal(
          pkg.devDependencies.wrangler !== undefined,
          deployment === 'cloudflare'
        )
        assert.equal(
          pkg.scripts.deploy !== undefined,
          deployment === 'cloudflare'
        )
        assert.equal(pkg.scripts.start !== undefined, deployment === 'custom')
        const production = await readFile(
          path.join(destination, '.env.production'),
          'utf8'
        )
        assert.ok(production.includes('SITE_URL=https://example.com\n'))
        const docs = await readFile(path.join(destination, 'README.md'), 'utf8')
        assert.doesNotMatch(docs, /\{\{[A-Z_]+\}\}/)
        const env = await readFile(
          path.join(destination, '.env.example'),
          'utf8'
        )
        assert.equal(env.includes('ASTRO_KEY'), deployment !== 'static')
        assert.ok(env.includes('# MAIL_ENABLED=false'))
        assert.ok(env.includes('# SMTP_PASSWORD='))
        assert.ok(
          env.includes('# CONTENT_API_URL=https://cms.example.com/api/')
        )
        assert.ok(env.includes('# CONTENT_API_TOKEN='))
        assert.ok(config.includes('CONTENT_API_TOKEN: envField.string'))
        assert.ok(pkg.dependencies.nodemailer)
        assert.ok(config.includes('SMTP_PASSWORD: envField.string'))
        assert.ok(
          (
            await readFile(
              path.join(destination, 'src/server/mail/index.ts'),
              'utf8'
            )
          ).includes('astro:env/server')
        )
        assert.equal(env.includes('HOST=0.0.0.0'), deployment === 'custom')
        assert.equal(
          config.includes('VERCEL_PROJECT_PRODUCTION_URL'),
          deployment === 'vercel'
        )
        if (deployment === 'netlify') {
          const toml = await readFile(
            path.join(destination, 'netlify.toml'),
            'utf8'
          )
          assert.ok(toml.includes(`${tools.runner} run build`))
          assert.equal(toml.includes('BUN_VERSION'), bun)
          assert.ok(config.includes('env.URL'))
        }
        if (deployment === 'cloudflare') {
          const wrangler = await readJSON(
            path.join(destination, 'wrangler.jsonc')
          )
          assert.equal(
            pkg.scripts.build,
            'node ./node_modules/astro/bin/astro.mjs build'
          )
          assert.ok(
            pkg.scripts.deploy.includes(
              'node ./node_modules/wrangler/bin/wrangler.js deploy'
            )
          )
          assert.ok(
            (
              await readFile(path.join(destination, 'bunfig.toml'), 'utf8')
            ).includes('bun = false')
          )
          assert.equal(wrangler.name, 'project-with-dots')
          assert.equal(wrangler.main, '@astrojs/cloudflare/entrypoints/server')
          assert.ok(config.includes("imageService: 'compile'"))
          assert.ok(files.includes('.dev.vars.example'))
          assert.ok(
            (
              await readFile(path.join(destination, '.gitignore'), 'utf8')
            ).includes('.dev.vars*')
          )
        }
      })
    }
  }
}

test('invalid deployment and site fail before writing any files', async (t) => {
  const directory = await temporary(t)
  for (const options of [
    { deployment: 'wrong' },
    { deployment: '__proto__' },
    { site: 'https://example.com/path' },
    { site: 'javascript:alert(1)' },
    { site: 'https://user:pass@example.com' }
  ]) {
    await assert.rejects(
      createProject({
        template,
        readme,
        destination: path.join(directory, 'project'),
        tools: selectTools({ npm: '11.2.0' }),
        kitVersion,
        ...options
      })
    )
  }
  assert.deepEqual(await readdir(directory), [])
})

test('CLI requires a deployment without a TTY and rejects invalid choices before creating files', async (t) => {
  const directory = await temporary(t)
  const destination = path.join(directory, 'project')
  const cli = path.join(root, 'packages/cli/bin/samline-astro.mjs')
  for (const flags of [
    [],
    ['--deploy', 'other'],
    ['--deploy', 'vercel', '--site', 'https://example.com/path']
  ]) {
    const result = spawnSync(process.execPath, [cli, destination, ...flags], {
      encoding: 'utf8'
    })
    assert.equal(result.status, 1)
    assert.deepEqual(await readdir(directory), [])
  }
})
