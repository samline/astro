import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'astro/zod'
import { apiLiveLoader } from '../src/content/live/api.ts'

const source = {
  id: 'stable',
  title: 'Validated title',
  secret: 'private-data'
}
const configuration = {
  name: 'test-api',
  inputSchema: z.object({ id: z.string(), title: z.string() }),
  schema: z.object({ title: z.string().min(1) }),
  id: (item) => item.id,
  map: (item) => ({ title: item.title }),
  loadCollection: async () => [source],
  loadEntry: async () => source
}

test('API live loader validates input and mapping, preserves stable IDs and forwards each request context', async () => {
  const seen = []
  const loader = apiLiveLoader({
    ...configuration,
    loadCollection: async (context) => {
      seen.push(context)
      return [source]
    },
    loadEntry: async (context) => {
      seen.push(context)
      return source
    }
  })
  const collectionContext = { collection: 'test', filter: { tenant: 'a' } }
  const entryContext = {
    collection: 'test',
    filter: { id: 'stable', tenant: 'b' }
  }
  assert.deepEqual(await loader.loadCollection(collectionContext), {
    entries: [{ id: 'stable', data: { title: source.title } }]
  })
  assert.deepEqual(await loader.loadEntry(entryContext), {
    id: 'stable',
    data: { title: source.title }
  })
  assert.deepEqual(seen, [collectionContext, entryContext])
  assert.deepEqual(
    await apiLiveLoader({
      ...configuration,
      loadCollection: async () => []
    }).loadCollection(collectionContext),
    { entries: [] }
  )
  assert.equal(
    await apiLiveLoader({
      ...configuration,
      loadEntry: async () => undefined
    }).loadEntry(entryContext),
    undefined
  )
})

test('API live loader distinguishes failures, invalid data, duplicate IDs and mismatched entry IDs without leaking details', async () => {
  for (const patch of [
    {
      loadCollection: async () => {
        throw new Error('private-data')
      }
    },
    { loadCollection: async () => [source, source] },
    { loadCollection: async () => [source, { ...source, title: null }] },
    { loadCollection: async () => ({ data: [source] }) },
    { id: () => '' },
    { map: () => ({ title: '' }) }
  ]) {
    const result = await apiLiveLoader({
      ...configuration,
      ...patch
    }).loadCollection({ collection: 'test' })
    assert.equal(result.entries, undefined)
    assert.equal(result.error.message, 'Unable to load live content.')
  }
  assert.equal(
    (
      await apiLiveLoader(configuration).loadEntry({
        collection: 'test',
        filter: { id: 'different' }
      })
    ).error.message,
    'Unable to load the live entry.'
  )
  assert.equal(
    (
      await apiLiveLoader({
        ...configuration,
        loadEntry: async () => {
          throw new Error('secret')
        }
      }).loadEntry({ collection: 'test', filter: { id: 'stable' } })
    ).error.message,
    'Unable to load the live entry.'
  )
  assert.throws(() => apiLiveLoader({ ...configuration, name: '' }))
})
