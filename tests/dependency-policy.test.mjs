import { test } from 'node:test'
import assert from 'node:assert/strict'
import { withLatestFormsPolicy } from '../packages/cli/lib/dependency-policy.mjs'

test('latest Forms policy preserves scoped overrides and unrelated release exclusions', () => {
  const current =
    "overrides:\n  '@scope/parent>child': 1.2.3\nminimumReleaseAge: 1440\nminimumReleaseAgeExclude:\n  - 'existing@1.0.0' # reviewed\nallowBuilds:\n  sharp: true\n"
  const result = withLatestFormsPolicy(current)
  assert.match(
    result,
    /'existing@1\.0\.0' # reviewed\n  - '@samline\/forms'\n  - '@samline\/formatter'\nallowBuilds:/
  )
  assert.ok(
    result.startsWith(
      "overrides:\n  '@scope/parent>child': 1.2.3\nminimumReleaseAge: 1440\n"
    )
  )
  assert.equal(withLatestFormsPolicy(result), result)
  assert.equal(
    (withLatestFormsPolicy('').match(/minimumReleaseAgeExclude:/g) ?? [])
      .length,
    1
  )
})
test('unsupported custom release exclusion shapes fail instead of replacing them', () => {
  for (const text of [
    "minimumReleaseAgeExclude: ['existing']\n",
    "'minimumReleaseAgeExclude':\n  - existing\n"
  ])
    assert.throws(
      () => withLatestFormsPolicy(text),
      /without replacing custom settings/
    )
})
