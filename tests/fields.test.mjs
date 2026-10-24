import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { createFieldsFixture } from './helpers/fields-fixture.mjs'
import { fieldAttributes } from '../src/components/Fields/attributes.ts'

test('field associations preserve supplied IDs and description references', () => {
  assert.deepEqual(fieldAttributes('email', 'help', 'external email-help'), {
    id: 'email',
    'aria-describedby': 'external email-help email-error'
  })
  const generated = fieldAttributes(null, undefined)
  assert.match(generated.id, /^field-[\da-f-]+$/)
  assert.equal(generated['aria-describedby'], `${generated.id}-error`)
  assert.notEqual(generated.id, fieldAttributes(undefined, undefined).id)
})

test('Fields renders accessible native controls, exact values, grouped options and optional enhancement bundles in SSG', async (t) => {
  const fixture = await createFieldsFixture()
  t.after(fixture.dispose)
  const { html } = fixture
  const tag = (name, id) =>
    html.match(new RegExp(`<${name}\\b[^>]*\\bid="${id}"[^>]*>`))?.[0] ?? ''
  assert.match(tag('input', 'email'), /name="email"/)
  assert.match(
    tag('input', 'email'),
    /aria-describedby="external-help email-help email-error"/
  )
  assert.match(tag('input', 'email'), /data-native="preserved"/)
  assert.match(tag('input', 'email'), /data-astro-cid-/)
  assert.match(html, /<label for="email"/)
  assert.match(html, /id="email-error"[^>]*aria-live="polite"[^>]*hidden/)
  assert.match(tag('input', 'zero'), /value="0"/)
  assert.doesNotMatch(html, /must-not-render-secret/)
  assert.doesNotMatch(tag('input', 'password'), /value=/)
  assert.match(html, /data-password-toggle="password"[^>]*hidden/)
  assert.match(html, /<option value="0" selected/)
  assert.match(html, /<optgroup label="Email"/)
  assert.match(html, /<option value="2" disabled/)
  assert.match(html, /<option value="enabled" selected/)
  assert.match(tag('select', 'select-multiple'), /multiple/)
  assert.match(html, /&lt;script&gt;untrusted&lt;\/script&gt;/)
  assert.match(html, /&lt;b&gt;literal&lt;\/b&gt;/)
  assert.match(tag('textarea', 'message'), /aria-invalid="true"/)
  assert.match(tag('input', 'a'), /checked/)
  assert.match(tag('input', 'files'), /multiple/)
  assert.doesNotMatch(tag('input', 'files'), /accept=|value=/)
  assert.match(html, /<fieldset[^>]*disabled/)
  assert.match(tag('form', 'test-form'), /method="post" action="\/native"/)
  const assets = await readdir(path.join(fixture.directory, 'dist/_astro'))
  const css = (
    await Promise.all(
      assets
        .filter((name) => name.endsWith('.css'))
        .map((name) =>
          readFile(path.join(fixture.directory, 'dist/_astro', name), 'utf8')
        )
    )
  ).join('')
  assert.match(css, /\.field-control/)
  assert.match(css, /resize:vertical/)
  assert.match(css, /data-theme/)
})
