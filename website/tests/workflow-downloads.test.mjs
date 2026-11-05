import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

test('standalone workflow archives retain their skill files and licenses', async () => {
  execFileSync(process.execPath, [
    fileURLToPath(new URL('../scripts/assets.mjs', import.meta.url))
  ])
  for (const [name, expected] of [
    [
      'samline-project-kickoff',
      [
        'LICENSE',
        'SKILL.md',
        'references/design-inventory.md',
        'references/kickoff-prompt.md'
      ]
    ],
    ['codebase-memory', ['LICENSE', 'SKILL.md']]
  ]) {
    const archive = fileURLToPath(
      new URL(`../docs/public/downloads/${name}.zip`, import.meta.url)
    )
    const files = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter((entry) => !entry.endsWith('/'))
    const prefix = `.agents/skills/${name}/`
    assert.deepEqual(files.sort(), expected.map((file) => prefix + file).sort())
    for (const file of files) {
      assert.equal(
        execFileSync('unzip', ['-p', archive, file], { encoding: 'utf8' }),
        await readFile(new URL('../../' + file, import.meta.url), 'utf8')
      )
    }
  }
})
