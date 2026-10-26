import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, access } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { recipes } from '../shared/i18n/translations/en/recipes.ts'

const cli = fileURLToPath(
  new URL('../../packages/cli/bin/samline-astro.mjs', import.meta.url)
)
const run = (args) => {
  const result = spawnSync(
    process.execPath,
    [cli, ...args, '--yes', '--no-install'],
    { encoding: 'utf8' }
  )
  assert.equal(result.status, 0, result.stderr || result.stdout)
}
for (const recipe of recipes) {
  test(`published recipe command is accepted by the actual local CLI: ${recipe.id}`, async () => {
    const parent = await mkdtemp(join(tmpdir(), 'samline-site-recipe-'))
    const project = join(parent, 'site')
    try {
      const args = recipe.command.split(' ').slice(2)
      if (args[0] === 'my-site') run([project, ...args.slice(1)])
      else {
        run([project, '--minimal', '--deploy', 'static'])
        run([...args, '--cwd', project])
      }
      const manifest = JSON.parse(
        await readFile(join(project, 'package.json'), 'utf8')
      )
      assert.ok(
        !Object.keys(manifest.scripts).some((name) => name.startsWith('site:'))
      )
      await assert.rejects(access(join(project, 'website')))
      if (recipe.id === 'forms') {
        assert.ok(manifest.dependencies['@samline/forms'])
        assert.ok(manifest.dependencies['@samline/formatter'])
        await access(join(project, 'src/components/Fields/README.md'))
      }
      if (recipe.id === 'content')
        await access(join(project, 'src/content/articles/index.ts'))
    } finally {
      await rm(parent, { recursive: true, force: true })
    }
  })
}
