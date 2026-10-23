import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cp,
  mkdir,
  mkdtemp,
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

test('FaIcon renders all free styles without client scripts and preserves safe accessible SVG attributes', async (t) => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'astro-kit-fa-icon-'))
  t.after(() => rm(fixture, { recursive: true, force: true }))
  await mkdir(path.join(fixture, 'src/pages'), { recursive: true })
  await cp(
    path.join(root, 'src/components/FaIcon'),
    path.join(fixture, 'src/components/FaIcon'),
    { recursive: true }
  )
  await symlink(
    path.join(root, 'node_modules'),
    path.join(fixture, 'node_modules'),
    'junction'
  )
  await writeFile(path.join(fixture, 'package.json'), '{"type":"module"}')
  await writeFile(
    path.join(fixture, 'astro.config.mjs'),
    "import { defineConfig } from 'astro/config'; export default defineConfig({})"
  )
  await writeFile(
    path.join(fixture, 'src/pages/index.astro'),
    `---
import FaIcon from '../components/FaIcon/index.astro'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft'
import { faHeart } from '@fortawesome/free-regular-svg-icons/faHeart'
import { faGithub } from '@fortawesome/free-brands-svg-icons/faGithub'
const multi = { ...faHeart, icon: [448, 512, [], '', ['M0 0h1v1z', 'M2 2h1v1z']] }
const label = 'A "quoted" <label>'
---
<FaIcon icon={faArrowLeft} id='decorative' class='fixture-icon' data-test='forwarded' />
<FaIcon icon={faHeart} id='informative' label={label} width='2em' height='2em' />
<FaIcon icon={faGithub} id='brand' label={label} />
<FaIcon icon={faHeart} id='blank' label='  ' />
<FaIcon icon={multi} id='multi' />
<style>.fixture-icon { color: red; }</style>`
  )
  const result = spawnSync(
    process.execPath,
    [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
    {
      cwd: fixture,
      env: { ...process.env, NODE_ENV: 'production' },
      encoding: 'utf8',
      timeout: 15000
    }
  )
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const html = await readFile(path.join(fixture, 'dist/index.html'), 'utf8')
  const icons = [
    ...html.matchAll(/<svg\b((?:[^">]|"[^"]*")*)>([\s\S]*?)<\/svg>/g)
  ]
  assert.equal(icons.length, 5)
  for (const [, attributes, content] of icons) {
    assert.match(attributes, /focusable="false"/)
    assert.match(attributes, /viewBox="0 0 \d+ \d+"/)
    assert.match(attributes, /fill="currentColor"/)
    assert.match(content, /<path d="M/)
    assert.doesNotMatch(attributes, /\s(?:icon|label)=/)
  }
  const decorative = icons[0][1]
  assert.match(decorative, /aria-hidden="true"/)
  assert.doesNotMatch(decorative, /\brole=|aria-label=/)
  assert.match(decorative, /class="[^"]*fixture-icon/)
  assert.match(decorative, /data-test="forwarded"/)
  assert.match(decorative, /data-astro-cid-/)
  for (const index of [1, 2]) {
    assert.match(icons[index][1], /role="img"/)
    assert.match(icons[index][1], /aria-label="A &quot;quoted&quot; <label>"/)
    assert.doesNotMatch(icons[index][1], /aria-hidden=/)
  }
  assert.match(icons[1][1], /width="2em" height="2em"/)
  assert.match(icons[3][1], /aria-hidden="true"/)
  assert.equal((icons[4][2].match(/<path\b/g) ?? []).length, 2)
  assert.doesNotMatch(html, /<script\b|<i\b/)
})
