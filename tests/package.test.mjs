import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cp,
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
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
  }
)
