import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { fetchEntries as shopify } from '../src/content/sources/shopify.ts'
import { fetchEntries as strapi } from '../src/content/sources/strapi.ts'
import { fetchEntries as api } from '../src/content/sources/api.ts'
import { fetchEntries as graphql } from '../src/content/sources/graphql.ts'
import { sourceLoader } from '../src/content/sources/build.ts'

const options = {
  url: 'https://store.example/',
  endpoint: 'posts',
  token: 'fixture-private',
  locale: 'en-us',
  providerLocale: 'en-US'
}
const product = {
  id: 'gid://shopify/Product/1',
  handle: 'example',
  title: 'Example',
  description: 'Description',
  featuredImage: null,
  priceRange: { minVariantPrice: { amount: '10.00', currencyCode: 'USD' } }
}

test('Shopify uses Storefront auth, fixed GraphQL variables and advancing cursor pagination; 200 errors remain failures', async () => {
  const requests = []
  const entries = await shopify({
    ...options,
    endpoint: 'api/2026-10/graphql.json',
    providerLocale: 'EN',
    fetcher: async (url, init) => {
      requests.push({ url: String(url), ...init, body: JSON.parse(init.body) })
      return Response.json({
        data: {
          products: {
            nodes: requests.length === 1 ? [product] : [],
            pageInfo: {
              hasNextPage: requests.length === 1,
              endCursor: requests.length === 1 ? 'cursor-1' : null
            }
          }
        }
      })
    }
  })
  assert.equal(entries[0].id, 'en-us/gid://shopify/Product/1')
  assert.equal(entries[0].data.locale, 'en-us')
  assert.equal(requests.length, 2)
  assert.equal(
    requests[0].headers['X-Shopify-Storefront-Access-Token'],
    'fixture-private'
  )
  assert.equal(requests[0].headers.Authorization, undefined)
  assert.equal(requests[1].body.variables.after, 'cursor-1')
  assert.equal(requests[0].body.variables.language, 'EN')
  assert.equal(requests[0].redirect, 'error')
  assert.match(requests[0].url, /2026-10\/graphql.json$/)
  await assert.rejects(
    shopify({
      ...options,
      fetcher: async () =>
        Response.json({ errors: [{ message: 'private provider detail' }] })
    }),
    /GraphQL errors/
  )
  await assert.rejects(
    shopify({
      ...options,
      fetcher: async () =>
        Response.json({
          data: {
            products: {
              nodes: [],
              pageInfo: { hasNextPage: true, endCursor: 'same' }
            }
          }
        })
    }),
    /did not advance/
  )
})

test('Strapi maps documentId, locale and publication explicitly; REST validates full pagination and rejects drafts', async () => {
  const requests = []
  const entries = await strapi({
    ...options,
    fetcher: async (url) => {
      requests.push(new URL(url))
      const page = requests.length
      return Response.json({
        data: [
          {
            documentId: String(page),
            title: 'Post',
            slug: 'post-' + page,
            locale: 'en-US',
            publishedAt: '2026-01-01'
          }
        ],
        meta: { pagination: { page, pageCount: 2 } }
      })
    }
  })
  assert.deepEqual(
    entries.map((entry) => entry.id),
    ['en-us/1', 'en-us/2']
  )
  assert.equal(requests[0].searchParams.get('status'), 'published')
  assert.equal(requests[0].searchParams.get('sort'), 'documentId:asc')
  assert.equal(requests[1].searchParams.get('pagination[page]'), '2')
  await assert.rejects(
    strapi({
      ...options,
      fetcher: async () =>
        Response.json({
          data: [],
          meta: { pagination: { page: 3, pageCount: 3 } }
        })
    }),
    /pagination/
  )
  await assert.rejects(
    api({
      ...options,
      fetcher: async () =>
        Response.json({
          data: [{ id: 1, title: 'Draft', locale: 'en-US', draft: true }],
          meta: { page: 1, pageCount: 1 }
        })
    }),
    /unpublished/
  )
  assert.deepEqual(
    await api({
      ...options,
      fetcher: async () =>
        Response.json({
          success: true,
          data: [],
          meta: { page: 1, pageCount: 0 }
        })
    }),
    []
  )
})

test('custom GraphQL contract does not accept errors as success or infinite pagination', async () => {
  const entries = await graphql({
    ...options,
    fetcher: async () =>
      Response.json({
        data: {
          items: {
            nodes: [
              { id: '1', title: 'Example', locale: 'en-US', draft: false }
            ],
            pageInfo: { hasNextPage: false, endCursor: null }
          }
        }
      })
  })
  assert.equal(entries[0].id, 'en-us/1')
  await assert.rejects(
    graphql({
      ...options,
      fetcher: async () =>
        Response.json({
          errors: [{ message: 'bad query' }],
          data: {
            items: {
              nodes: [],
              pageInfo: { hasNextPage: false, endCursor: null }
            }
          }
        })
    }),
    /errors/
  )
})

test('source loader validates a full snapshot before replacing it; duplicate and mapping failures preserve the previous store', async (t) => {
  const directory = await realpath(
    await mkdtemp(path.join(tmpdir(), 'samline-source-'))
  )
  t.after(() => rm(directory, { recursive: true, force: true }))
  await writeFile(
    path.join(directory, '.env'),
    'SAM_TEST_URL=https://provider.example/\nSAM_TEST_ENDPOINT=posts\n'
  )
  const store = new Map([['old', { id: 'old', data: { title: 'Keep' } }]])
  const context = {
    config: { root: pathToFileURL(directory + '/') },
    store: {
      clear: () => store.clear(),
      set: (entry) => store.set(entry.id, entry)
    },
    parseData: async (entry) => {
      if (entry.data.title === 'bad') throw new Error('Invalid record')
      return entry.data
    },
    generateDigest: () => 'fixture-digest'
  }
  const duplicate = sourceLoader(
    'posts',
    'SAM_TEST',
    async () => [
      { id: '1', data: { title: 'Good' } },
      { id: '1', data: { title: 'Other' } }
    ],
    { 'en-us': 'en-US' }
  )
  await assert.rejects(duplicate.load(context), /Duplicate/)
  assert.deepEqual([...store.keys()], ['old'])
  const invalid = sourceLoader(
    'posts',
    'SAM_TEST',
    async () => [
      { id: '1', data: { title: 'Good' } },
      { id: '2', data: { title: 'bad' } }
    ],
    { 'en-us': 'en-US' }
  )
  await assert.rejects(invalid.load(context), /Invalid/)
  assert.deepEqual([...store.keys()], ['old'])
  const good = sourceLoader(
    'posts',
    'SAM_TEST',
    async () => [{ id: '1', data: { title: 'Good' } }],
    { 'en-us': 'en-US' }
  )
  await good.load(context)
  assert.deepEqual([...store.keys()], ['1'])
  await assert.rejects(
    sourceLoader('posts', 'SAM_TEST', async () => [], {}).load(context),
    /mapping/
  )
  assert.deepEqual([...store.keys()], ['1'])
})
