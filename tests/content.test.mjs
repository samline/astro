import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'astro/zod'
import {
  createContentApi,
  postSchema,
  requestJson
} from '../src/server/content-api/client.ts'
import {
  apiPostsLoader,
  strapiStoresLoader,
  storeSchema
} from '../src/content/remote/loaders.ts'
import { postsLiveLoader } from '../src/content/live/index.ts'
import { locales } from '../src/i18n/config.ts'

const post = {
  id: 'visible',
  title: 'Remote content',
  locale: 'en-us',
  draft: false
}
const options = { url: 'https://cms.example/api/', token: 'fake-token' }
const context = (schema) => {
  const entries = new Map([['old', { id: 'old', data: {} }]])
  return {
    entries,
    collection: 'test',
    parseData: async ({ data }) => schema.parse(data),
    generateDigest: (data) => JSON.stringify(data),
    store: {
      clear: () => entries.clear(),
      set: (entry) => entries.set(entry.id, entry)
    }
  }
}

test('content API validates envelopes, filters public locale data and constrains HTTP credentials', async () => {
  let captured
  const api = createContentApi({
    ...options,
    fetcher: async (url, init) => {
      captured = { url, init }
      return Response.json({
        data: [
          post,
          { ...post, id: 2, draft: true },
          { ...post, id: 3, locale: 'en-mx' }
        ]
      })
    }
  })
  assert.deepEqual(await api.listPosts('en-us', 2), [post])
  assert.equal(
    captured.url.href,
    'https://cms.example/api/posts?locale=en-us&page=2&pageSize=100&draft=false'
  )
  assert.equal(captured.init.method, 'GET')
  assert.equal(captured.init.body, undefined)
  assert.equal(captured.init.headers.Authorization, 'Bearer fake-token')
  assert.equal(captured.init.redirect, 'error')
  assert.ok(captured.init.signal instanceof AbortSignal)
  const write = createContentApi({
    ...options,
    fetcher: async (url, init) => {
      captured = { url, init }
      return Response.json({
        data: { ...post, id: 4, privateToken: 'must-be-stripped' }
      })
    }
  })
  assert.deepEqual(
    await write.createPost({ title: post.title, locale: post.locale }),
    { ...post, id: '4' }
  )
  assert.equal(captured.init.method, 'POST')
  assert.equal(captured.init.headers['Content-Type'], 'application/json')
  assert.deepEqual(JSON.parse(captured.init.body), {
    title: post.title,
    locale: post.locale
  })
})

test('content API rejects failed HTTP, malformed JSON/schema and unsafe destinations without leaking bodies', async () => {
  for (const response of [
    new Response('fake-token private upstream response', { status: 500 }),
    new Response('invalid json'),
    Response.json({ data: [{ ...post, id: null }] })
  ]) {
    await assert.rejects(
      createContentApi({ ...options, fetcher: async () => response }).listPosts(
        'en-us'
      ),
      (error) => !error.message.includes('fake-token')
    )
  }
  await assert.rejects(
    createContentApi({
      ...options,
      fetcher: async () => {
        throw new Error('fake-token')
      }
    }).listPosts('en-us'),
    { message: 'Content API connection failed.' }
  )
  for (const [url, route] of [
    ['http://cms.example/api/', 'posts'],
    ['https://user:password@cms.example/api/', 'posts'],
    ['https://cms.example/api/?secret=1', 'posts'],
    [options.url, 'https://other.example/posts'],
    [options.url, '//other.example/posts'],
    [options.url, '../posts'],
    [options.url, '%2e%2e/posts']
  ])
    await assert.rejects(
      requestJson(
        { url, fetcher: async () => assert.fail('No request expected') },
        route,
        z.unknown()
      )
    )
})

test('single API reads distinguish missing, private and failed content', async () => {
  const api = (response) =>
    createContentApi({ ...options, fetcher: async () => response })
  assert.equal(
    await api(new Response('', { status: 404 })).getPost('missing', 'en-us'),
    undefined
  )
  assert.equal(
    await api(Response.json({ data: { ...post, draft: true } })).getPost(
      post.id,
      'en-us'
    ),
    undefined
  )
  assert.equal(
    await api(Response.json({ data: { ...post, locale: 'en-mx' } })).getPost(
      post.id,
      'en-us'
    ),
    undefined
  )
  await assert.rejects(
    api(new Response('', { status: 503 })).getPost(post.id, 'en-us')
  )
})

test('API snapshot validates all entries before replacing the store and rejects duplicate IDs', async () => {
  const current = context(postSchema)
  await apiPostsLoader({
    ...options,
    fetcher: async () => Response.json({ data: [post] })
  }).load(current)
  assert.deepEqual([...current.entries.keys()], ['en-us/visible'])
  const duplicate = context(postSchema)
  await assert.rejects(
    apiPostsLoader({
      ...options,
      fetcher: async () => Response.json({ data: [post, post] })
    }).load(duplicate),
    /duplicate/
  )
  assert.deepEqual([...duplicate.entries.keys()], ['old'])
  const invalid = context(postSchema)
  await assert.rejects(
    apiPostsLoader({
      ...options,
      fetcher: async () => Response.json({ data: [{ ...post, title: null }] })
    }).load(invalid)
  )
  assert.deepEqual([...invalid.entries.keys()], ['old'])
  await apiPostsLoader({
    ...options,
    fetcher: async () => Response.json({ data: [] })
  }).load(current)
  assert.equal(current.entries.size, 0)
})

test('Strapi snapshot follows bounded pagination per enabled locale with stable namespaced IDs', async (t) => {
  locales.push('en-mx')
  t.after(() => locales.splice(locales.indexOf('en-mx'), 1))
  const calls = []
  const current = context(storeSchema)
  await strapiStoresLoader({
    ...options,
    fetcher: async (url) => {
      const locale = url.searchParams.get('locale')
      const page = Number(url.searchParams.get('pagination[page]'))
      calls.push([locale, page])
      return Response.json({
        data: [
          {
            documentId: String(page),
            locale,
            name: `Store ${page}`,
            url: 'https://store.example'
          }
        ],
        meta: { pagination: { page, pageCount: 2 } }
      })
    }
  }).load(current)
  assert.deepEqual(calls, [
    ['en-US', 1],
    ['en-US', 2],
    ['en-MX', 1],
    ['en-MX', 2]
  ])
  assert.deepEqual(
    [...current.entries.keys()],
    ['en-us/1', 'en-us/2', 'en-mx/1', 'en-mx/2']
  )
})

test('Strapi errors, excessive pages and invalid links preserve the previous snapshot', async () => {
  for (const result of [
    { data: [], meta: { pagination: { page: 1, pageCount: 101 } } },
    {
      data: [
        {
          documentId: '1',
          locale: 'en-US',
          name: 'Store',
          url: 'javascript:alert(1)'
        }
      ],
      meta: { pagination: { page: 1, pageCount: 1 } }
    },
    { data: [], meta: { pagination: { page: 2, pageCount: 2 } } }
  ]) {
    const previous = context(storeSchema)
    await assert.rejects(
      strapiStoresLoader({
        ...options,
        fetcher: async () => Response.json(result)
      }).load(previous)
    )
    assert.deepEqual([...previous.entries.keys()], ['old'])
  }
})

test('live loaders return explicit errors and missing entries without rewriting a content store', async () => {
  const loader = postsLiveLoader(() =>
    createContentApi({
      ...options,
      fetcher: async (url) => {
        if (url.pathname.endsWith('/missing'))
          return new Response('', { status: 404 })
        return Response.json({
          data: url.pathname.endsWith('/posts') ? [post] : post
        })
      }
    })
  )
  assert.deepEqual(
    await loader.loadCollection({
      collection: 'livePosts',
      filter: { locale: 'en-us' }
    }),
    { entries: [{ id: post.id, data: post }] }
  )
  assert.deepEqual(
    await loader.loadEntry({
      collection: 'livePosts',
      filter: { id: post.id }
    }),
    { id: post.id, data: post }
  )
  assert.equal(
    await loader.loadEntry({
      collection: 'livePosts',
      filter: { id: 'missing' }
    }),
    undefined
  )
  assert.ok(
    (
      await loader.loadCollection({
        collection: 'livePosts',
        filter: { locale: 'invalid' }
      })
    ).error
  )
  const failed = postsLiveLoader(() => {
    throw new Error('private-token')
  })
  assert.equal(
    (await failed.loadCollection({ collection: 'livePosts' })).error.message,
    'Unable to load live posts.'
  )
})
