import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { findDesignIssues } from '../scripts/check-design.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const rules = (source) => findDesignIssues(source).map((issue) => issue.rule)

test('design lint flags default decoration patterns', () => {
  for (const [source, rule] of [
    ['<h1 class="bg-clip-text text-transparent">', 'gradient-text'],
    ['.title { background-clip: text; }', 'gradient-text'],
    ['<div class="border-l-4 border-accent">', 'side-accent-border'],
    ['<div class="border-s-[0.125rem]">', 'side-accent-border'],
    ['.card { border-left: 3px solid red; }', 'side-accent-border'],
    ['<div class="shadow-[0_0_20px_#f0f]">', 'zero-offset-glow'],
    ['.glow { box-shadow: 0 0 24px var(--color-accent); }', 'zero-offset-glow'],
    ['<span class="animate-ping">', 'decorative-ping'],
    ['<span class="animate-bounce">', 'bounce-easing'],
    ['<p class="text-justify">', 'justified-text'],
    ['<h1 class="tracking-tighter">', 'crushed-tracking'],
    ['.display { letter-spacing: -0.06em; }', 'crushed-tracking']
  ])
    assert.deepEqual(rules(source), [rule], source)
})

test('design lint leaves deliberate defaults and documented exceptions alone', () => {
  for (const source of [
    '<div class="border-s border-black/10">',
    '<div class="border-s-[1px]">',
    '.rule { border-left: 1px solid currentColor; }',
    '.card { box-shadow: 0 4px 12px #0003; }',
    '<div class="animate-pulse">',
    '<h1 class="tracking-tight">',
    '.display { letter-spacing: -0.02em; }',
    '<!-- design-ignore: gradient-text Brand wordmark -->\n<span class="bg-clip-text text-transparent">',
    '<span class="animate-ping"><!-- design-ignore: decorative-ping Live stream status --></span>'
  ])
    assert.deepEqual(rules(source), [], source)
  assert.deepEqual(
    rules(
      '<!-- design-ignore: gradient-text -->\n<span class="bg-clip-text text-transparent">'
    ),
    ['gradient-text'],
    'an exception needs a reason'
  )
})

test('starter source is clean and the command stays advisory unless strict', () => {
  const run = (...args) =>
    spawnSync(
      process.execPath,
      [path.join(root, 'scripts/check-design.mjs'), ...args],
      {
        cwd: root,
        encoding: 'utf8'
      }
    )
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /sin patrones por revisar/)
  assert.equal(run('--strict').status, 0)
})
