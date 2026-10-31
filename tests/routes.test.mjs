import assert from 'node:assert/strict'
import { test } from 'node:test'
import { routeNames } from '../src/config/routes.ts'
import { defaultLocale } from '../src/i18n/config.ts'
import { resolveRoutePaths, routePath } from '../src/i18n/routes.ts'

test('route identities resolve named/shared paths and only explicit active translations', () => {
  assert.equal(routePath({ routeName: routeNames.home }, defaultLocale), '/')
  assert.equal(
    routePath({ path: '/company?campaign=1#team' }, defaultLocale),
    '/company'
  )
  assert.equal(routePath({ path: '' }, defaultLocale), '/')
  assert.deepEqual(resolveRoutePaths({ localizedPaths: {} }), {})
  assert.deepEqual(
    resolveRoutePaths({
      localizedPaths: { [defaultLocale]: '/company', unconfigured: '/ignored' }
    }),
    { [defaultLocale]: '/company' }
  )
  assert.throws(
    () => routePath({ localizedPaths: {} }, defaultLocale),
    /no active translation/
  )
})

test('ambiguous identities and unsafe translated paths fail instead of inventing destinations', () => {
  for (const route of [
    {},
    { path: '/', routeName: routeNames.home },
    { path: '/', localizedPaths: {} }
  ])
    assert.throws(() => resolveRoutePaths(route), /exactly one/)
  for (const routeName of ['missing.index', 'toString', '__proto__'])
    assert.throws(() => resolveRoutePaths({ routeName }), /Unknown route/)
  for (const value of [
    'https://elsewhere.example/path',
    '//elsewhere.example/path',
    '/a\\b',
    '/a?query=1',
    '/a#part',
    '/a/../b',
    '/a/./b',
    '/a b',
    42,
    null
  ])
    assert.throws(
      () => resolveRoutePaths({ localizedPaths: { [defaultLocale]: value } }),
      /locale-free site paths/
    )
})
