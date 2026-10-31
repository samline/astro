import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { currentDestination } from '../src/components/Link/current.ts'
import { createLinkFixture } from './helpers/link-fixture.mjs'

const resolve = (target, current, match = 'exact', root = '/') =>
  currentDestination(
    new URL(target, 'https://navigation.example'),
    new URL(current, 'https://navigation.example'),
    match,
    root
  )

test('current links match exact pages by default and opt into segment-bounded descendants', () => {
  assert.equal(resolve('/catalog/', '/catalog?view=grid'), 'page')
  assert.equal(resolve('/catalog', '/catalog/item'), undefined)
  assert.equal(resolve('/catalog', '/catalog/item/', 'descendants'), 'location')
  for (const current of ['/catalog-extra', '/catalog2/item'])
    assert.equal(resolve('/catalog', current, 'descendants'), undefined)
  assert.equal(
    resolve('https://other.example/catalog', '/catalog', 'descendants'),
    undefined
  )
})

test('home is exact-only including a base path and a localized root', () => {
  for (const root of ['/', '/site/', '/site/es-mx/']) {
    assert.equal(resolve(root, root, 'descendants', root), 'page')
    assert.equal(
      resolve(root, root + 'catalog/item', 'descendants', root),
      undefined
    )
  }
  assert.equal(
    resolve(
      '/site/es-mx/catalog',
      '/site/es-mx/catalog/item',
      'descendants',
      '/site/es-mx'
    ),
    'location'
  )
  assert.equal(
    resolve(
      '/site/es-mx/catalog',
      '/site/catalog/item',
      'descendants',
      '/site'
    ),
    undefined
  )
})

test('fragment links require both the exact page and fragment', () => {
  assert.equal(resolve('/catalog#results', '/catalog/#results'), 'location')
  assert.equal(resolve('/catalog#results', '/catalog#other'), undefined)
  assert.equal(
    resolve('/catalog#results', '/catalog', 'descendants'),
    undefined
  )
  assert.equal(
    resolve('/catalog#results', '/catalog/item#results', 'descendants'),
    undefined
  )
})

test('localized matching cannot mark a different language home or an out-of-scope route current', () => {
  assert.equal(
    resolve(
      '/site/',
      '/site/es-mx/catalog/item',
      'descendants',
      '/site/es-mx/'
    ),
    undefined
  )
  assert.equal(
    resolve(
      '/site/es',
      '/site/es-mx/catalog/item',
      'descendants',
      '/site/es-mx'
    ),
    undefined
  )
  assert.equal(
    resolve('/elsewhere', '/elsewhere', 'exact', '/site/es-mx'),
    undefined
  )
})

test('Link renders opt-in matching, localized roots and explicit overrides without client JavaScript', async (t) => {
  const fixture = await createLinkFixture()
  t.after(fixture.dispose)
  for (const locale of ['', 'es-mx/']) {
    const html = await readFile(
      path.join(fixture.directory, 'dist', locale, 'catalog/item/index.html'),
      'utf8'
    )
    const anchor = (id) =>
      html.match(new RegExp(`<a\\b[^>]*\\bid="${id}"[^>]*>`))?.[0] ?? ''
    assert.match(anchor('parent'), /aria-current="location"/)
    assert.match(
      anchor('parent'),
      new RegExp(`href="/site/${locale}catalog/?"`)
    )
    assert.match(anchor('query'), /aria-current="location"/)
    assert.match(anchor('item'), /aria-current="page"/)
    assert.match(
      anchor('new-tab'),
      new RegExp(`href="/site/${locale}catalog/?"`)
    )
    assert.match(anchor('new-tab'), /rel="noopener"/)
    for (const id of [
      'home',
      'other-home',
      'exact',
      'default',
      'external',
      'fragment'
    ])
      assert.doesNotMatch(anchor(id), /\saria-current=/, id)
    assert.match(anchor('false'), /aria-current="false"/)
    assert.match(anchor('override'), /aria-current="step"/)
    assert.doesNotMatch(
      html,
      /currentMatch=|currentmatch=|<script\b|data-nav-link/
    )
    const home = await readFile(
      path.join(fixture.directory, 'dist', locale, 'index.html'),
      'utf8'
    )
    assert.match(
      home.match(/<a\b[^>]*\bid="home"[^>]*>/)?.[0] ?? '',
      /aria-current="page"/
    )
  }
})
