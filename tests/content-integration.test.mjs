import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'
import { dev } from 'astro'
import { deserializeActionResult } from '../node_modules/astro/dist/actions/runtime/client.js'
import { getDictionary } from '../src/i18n/index.ts'

const root = fileURLToPath(new URL('../', import.meta.url))

test(
  'Astro 7 queries local and live collections, runs optional API Actions and rejects invalid build content',
  { timeout: 25000 },
  async (t) => {
    const fixture = await realpath(
      await mkdtemp(path.join(tmpdir(), 'astro-kit-content-'))
    )
    let server
    t.after(async () => {
      await server?.stop()
      await rm(fixture, { recursive: true, force: true })
    })
    const saved = {
      url: process.env.CONTENT_API_URL,
      token: process.env.CONTENT_API_TOKEN
    }
    t.after(() => {
      for (const [key, value] of [
        ['CONTENT_API_URL', saved.url],
        ['CONTENT_API_TOKEN', saved.token]
      ]) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    })
    const origin = 'http://127.0.0.1:47322'
    process.env.CONTENT_API_URL = `${origin}/upstream/`
    process.env.CONTENT_API_TOKEN = 'local-only-fake-token'
    await cp(path.join(root, 'src'), path.join(fixture, 'src'), {
      recursive: true
    })
    // This fixture exercises content integration; auth has its own HTTP fixture.
    await rm(path.join(fixture, 'src/middleware.ts'))
    await rm(path.join(fixture, 'src/pages'), { recursive: true })
    await mkdir(path.join(fixture, 'src/pages/upstream/posts'), {
      recursive: true
    })
    await cp(
      path.join(root, 'package.json'),
      path.join(fixture, 'package.json')
    )
    await cp(
      path.join(root, 'tsconfig.json'),
      path.join(fixture, 'tsconfig.json')
    )
    await symlink(
      path.join(root, 'node_modules'),
      path.join(fixture, 'node_modules'),
      'junction'
    )
    await writeFile(
      path.join(fixture, 'astro.config.mjs'),
      "import { defineConfig } from 'astro/config'; import vercel from '@astrojs/vercel'; export default defineConfig({ adapter: vercel({ imageService: false }) })"
    )
    await writeFile(
      path.join(fixture, 'src/actions/index.ts'),
      "import { contentDemo } from './content-demo'; export const server = { contentDemo }"
    )
    await writeFile(
      path.join(fixture, 'src/live.config.ts'),
      (
        await readFile(path.join(root, 'src/live.config.ts.example'), 'utf8')
      ).replace(/^\/\/ ?/gm, '')
    )
    await writeFile(
      path.join(fixture, 'src/pages/index.astro'),
      '<html><body></body></html>'
    )
    await writeFile(
      path.join(fixture, 'src/pages/snapshot.json.ts'),
      `import { getCollection, getEntry } from 'astro:content'
import { getDictionary } from '../i18n'
export const GET = async () => {
  const posts = await getCollection('posts', ({ data }) => data.locale === 'en-us' && !data.draft)
  const one = await getEntry('posts', 'en-us/getting-started')
  return Response.json({ posts: posts.map(({ id, data }) => ({ id, title: getDictionary('en-us').content.posts[data.copyKey].title, year: data.publishedAt.getUTCFullYear() })), found: Boolean(one) })
}`
    )
    await writeFile(
      path.join(fixture, 'src/pages/live.json.ts'),
      `import { getLiveCollection, getLiveEntry } from 'astro:content'
export const prerender = false
export const GET = async () => {
  const collection = await getLiveCollection('livePosts', { locale: 'en-us' })
  const one = await getLiveEntry('livePosts', { id: 'visible', locale: 'en-us' })
  return Response.json({ posts: collection.entries?.map(({ data }) => data), one: one.entry?.data, error: Boolean(collection.error || one.error) })
}`
    )
    const record = path.join(fixture, 'calls.jsonl')
    await writeFile(record, '')
    const upstream = `import { appendFile } from 'node:fs/promises'
export const prerender = false
const item = { id: 'visible', title: 'Remote title', locale: 'en-us', draft: false, privateToken: 'not-public' }
export const GET = async ({ params, request }) => {
  if (request.headers.get('authorization') !== 'Bearer local-only-fake-token') return new Response('', { status: 401 })
  await appendFile(${JSON.stringify(record)}, 'GET\\n')
  return Response.json({ data: params.id ? item : [item, { ...item, id: 'draft', draft: true }, { ...item, id: 'other-language', locale: 'en-mx' }] })
}
export const POST = () => { throw new Error('Write authorization must reject before upstream access') }
`
    await writeFile(
      path.join(fixture, 'src/pages/upstream/posts/index.ts'),
      upstream
    )
    await writeFile(
      path.join(fixture, 'src/pages/upstream/posts/[id].ts'),
      upstream
    )
    server = await dev({
      root: pathToFileURL(fixture + '/'),
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 47322, strictPort: true }
    })
    const request = async (route, input) => {
      const response = await fetch(`${origin}/_actions/contentDemo.${route}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: origin },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(10000)
      })
      const result = deserializeActionResult({
        type: response.ok ? 'data' : 'error',
        body: await response.text()
      })
      return { status: response.status, body: result.data ?? result.error }
    }
    const snapshotResponse = await fetch(`${origin}/snapshot.json`)
    const snapshotText = await snapshotResponse.text()
    assert.equal(snapshotResponse.status, 200, snapshotText.slice(0, 4000))
    const snapshot = JSON.parse(snapshotText)
    assert.deepEqual(snapshot, {
      posts: [
        {
          id: 'en-us/getting-started',
          title: getDictionary().content.posts.gettingStarted.title,
          year: 2026
        }
      ],
      found: true
    })
    const listed = await request('list', {
      locale: 'en-us',
      page: 1,
      endpoint: 'https://other.example'
    })
    assert.equal(listed.status, 200, JSON.stringify(listed.body))
    assert.deepEqual(listed.body.posts, [
      { id: 'visible', title: 'Remote title', locale: 'en-us', draft: false }
    ])
    assert.equal((await request('list', { page: 0 })).status, 400)
    const beforeWrite = await readFile(record, 'utf8')
    const denied = await request('create', {
      locale: 'en-us',
      title: 'New post'
    })
    assert.equal(denied.status, 403)
    assert.equal(
      denied.body.message,
      getDictionary().content.messages.notAuthorized
    )
    assert.equal(await readFile(record, 'utf8'), beforeWrite)
    const live = await (await fetch(`${origin}/live.json`)).json()
    assert.equal(live.error, false, JSON.stringify(live))
    assert.equal(live.posts.length, 1)
    assert.equal(live.one.id, 'visible')
    assert.doesNotMatch(
      JSON.stringify(live),
      /privateToken|not-public|fake-token/
    )
    await server.stop()
    server = undefined
    const build = () =>
      spawnSync(
        process.execPath,
        [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
        {
          cwd: fixture,
          env: { ...process.env, NODE_ENV: 'production' },
          encoding: 'utf8',
          timeout: 15000
        }
      )
    const built = build()
    assert.equal(built.status, 0, built.stdout + built.stderr)
    const staticSnapshot = await readFile(
      path.join(fixture, '.vercel/output/static/snapshot.json'),
      'utf8'
    )
    assert.equal(
      JSON.parse(staticSnapshot).posts[0].id,
      'en-us/getting-started'
    )
    assert.doesNotMatch(staticSnapshot, /fake-token|not-public/)
    await writeFile(
      path.join(fixture, 'src/content/posts/data/en-us/getting-started.json'),
      JSON.stringify({
        locale: 'invalid',
        copyKey: 'gettingStarted',
        publishedAt: '2026-01-01'
      })
    )
    const invalid = build()
    assert.notEqual(invalid.status, 0)
    assert.match(invalid.stdout + invalid.stderr, /locale|schema/i)
  }
)
