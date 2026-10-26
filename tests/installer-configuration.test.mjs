import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  appendExport,
  appendProperties,
  parse,
  variable
} from '../packages/cli/lib/syntax.mjs'
import {
  registerAction,
  addContactCaptchaSchema,
  contactSchemaWithoutCaptcha
} from '../packages/cli/lib/features/composition.mjs'
import { createProject } from '../packages/cli/lib/project.mjs'
import { addIntegrations } from '../packages/cli/lib/integrations.mjs'
import { exists, json, listFiles, read } from '../packages/cli/lib/files.mjs'
import { selectTools } from '../packages/cli/lib/process.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const template = path.join(root, 'packages/cli/template')
const kitVersion = (await json(root)).version
const tools = selectTools({ pnpm: '12.9.1', bun: '1.3.14', npm: '11.2.0' })
const fixture = async (t, deployment = 'vercel') => {
  const parent = await mkdtemp(path.join(tmpdir(), 'samline-config-test-'))
  t.after(() => rm(parent, { recursive: true, force: true }))
  const destination = path.join(parent, 'site')
  await createProject({
    template,
    destination,
    kitVersion,
    tools,
    deployment
  })
  return destination
}
const add = (directory, requested, options = {}) =>
  addIntegrations({
    root: directory,
    template,
    kitVersion,
    requested,
    options
  })
const snapshot = async (directory) =>
  Promise.all(
    (await listFiles(directory))
      .sort()
      .map(async (file) => [file, await readFile(path.join(directory, file))])
  )

test('object additions use parsed trailing commas and preserve trailing comments', () => {
  for (const ending of [
    'posts',
    'posts // keep posts, add products later\n',
    'posts /* keep posts, add products later */',
    'posts, // keep posts, add products later\n',
    'posts, /* keep posts, add products later */'
  ]) {
    const source = `export const collections = { ${ending} }\n`
    const result = appendExport(source, 'collections', {
      products: 'products'
    })
    const node = variable(parse(result), 'collections')
    assert.deepEqual(
      node.properties.map((property) => property.name.text),
      ['posts', 'products'],
      result
    )
    if (ending.includes('keep posts'))
      assert.match(result, /keep posts, add products later/)
  }
  const source = 'export const collections = { // keep this empty, for now\n}\n'
  const result = appendExport(source, 'collections', { products: 'products' })
  assert.equal(variable(parse(result), 'collections').properties.length, 1)
  assert.match(result, /keep this empty, for now/)
})

test('Action and collection registration collisions require review while env keys remain user-owned', () => {
  for (const registration of [
    'contact: userContact',
    "'contact': userContact",
    'contact() { return userContact() }',
    'get contact() { return userContact }'
  ])
    assert.throws(
      () =>
        registerAction(
          `const userContact = () => null\nexport const server = { ${registration} }\n`,
          'contact'
        ),
      /Registration conflict: server\.contact.*Review/
    )
  assert.throws(
    () =>
      registerAction(
        "import { contact } from './contact'\nexport const server = { contact }\n",
        'contact'
      ),
    /Registration conflict: server\.contact/
  )
  assert.throws(
    () =>
      appendExport(
        'export const collections = { posts: customPosts }',
        'collections',
        { posts: 'posts' },
        { rejectExisting: true }
      ),
    /Registration conflict: collections\.posts/
  )
  const env = 'const schema = { SMTP_HOST: customHost }'
  assert.equal(
    appendProperties(env, variable(parse(env), 'schema'), {
      SMTP_HOST: 'recipeHost'
    }),
    env
  )
})

test('adding Mail preserves every project byte when a custom active or inactive contact already exists', async (t) => {
  for (const deployment of ['vercel', 'static']) {
    const directory = await fixture(t, deployment)
    const file = `src/actions/index.ts${deployment === 'static' ? '.example' : ''}`
    await mkdir(path.join(directory, 'src/actions'))
    await writeFile(
      path.join(directory, file),
      'const userContact = () => null\nexport const server = { contact: userContact }\n'
    )
    const before = await snapshot(directory)
    await assert.rejects(
      add(directory, ['mail'], { scaffold: deployment === 'static' }),
      /Registration conflict: server\.contact/
    )
    assert.deepEqual(await snapshot(directory), before)
  }
})

test('adding Content preserves every project byte when its local or live name is already registered', async (t) => {
  for (const mode of ['build', 'live']) {
    const directory = await fixture(t)
    const file =
      mode === 'build' ? 'src/content.config.ts' : 'src/live.config.ts.example'
    await writeFile(
      path.join(directory, file),
      'const userPosts = {}\nexport const collections = { posts: userPosts }\n'
    )
    const before = await snapshot(directory)
    await assert.rejects(
      add(directory, ['content'], {
        contentSource: mode === 'build' ? 'local' : 'api',
        contentMode: mode,
        collection: 'posts',
        protocol: 'rest'
      }),
      /Registration conflict: collections\.posts/
    )
    assert.deepEqual(await snapshot(directory), before)
  }
})

test('adding CAPTCHA preserves schema comments containing commas and emits a valid limits array', async () => {
  const reference = await read(root, 'src/actions/contact/schema.ts')
  const original = contactSchemaWithoutCaptcha(reference)
  for (const ending of [
    "['website', 200] // keep this limit, add CAPTCHA later",
    "['website', 200] /* keep this limit, add CAPTCHA later */",
    "['website', 200], // keep this limit, add CAPTCHA later"
  ]) {
    const source = original.replace("['website', 200]", ending)
    assert.notEqual(source, original)
    const result = addContactCaptchaSchema(source, reference)
    parse(result)
    assert.match(result, /keep this limit, add CAPTCHA later/)
    assert.match(result, /\['captchaToken', 2048\]/)
  }
})

test('Vercel security policy follows the selected installer in all four tool combinations and other adapters omit it', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'samline-policy-test-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  const catalog = path.join(directory, 'catalog')
  await cp(template, catalog, { recursive: true })
  const source = await json(catalog)
  source.overrides = (await json(root)).overrides
  await writeFile(path.join(catalog, 'package.json'), JSON.stringify(source))
  for (const pnpm of [true, false]) {
    for (const bun of [true, false]) {
      const selected = selectTools({
        npm: '11.2.0',
        ...(pnpm ? { pnpm: '12.9.1' } : {}),
        ...(bun ? { bun: '1.3.14' } : {})
      })
      const destination = path.join(directory, `site-${pnpm}-${bun}`)
      await createProject({
        template: catalog,
        destination,
        kitVersion,
        tools: selected,
        deployment: 'vercel'
      })
      const manifest = await json(destination)
      assert.equal(manifest.license, undefined)
      assert.equal(manifest.dependencies.astro, source.dependencies.astro)
      assert.match(
        await read(destination, 'README.md'),
        /Created with @samline\/astro/
      )
      if (pnpm) {
        assert.equal(manifest.overrides, undefined)
        const workspace = await read(destination, 'pnpm-workspace.yaml')
        assert.match(
          workspace,
          /@vercel\/routing-utils>path-to-regexp@>=6\.0\.0 <6\.3\.0/
        )
        assert.match(workspace, /@vercel\/cli-config>zod@>=4\.0\.0 <4\.6\.6/)
        assert.match(workspace, /6\.3\.0/)
        assert.match(workspace, /4\.6\.7/)
      } else {
        assert.deepEqual(manifest.overrides, source.overrides)
        assert.equal(await exists(destination, 'pnpm-workspace.yaml'), false)
      }
    }
  }
  for (const deployment of ['static', 'netlify', 'cloudflare', 'custom']) {
    const destination = path.join(directory, deployment)
    await createProject({
      template: catalog,
      destination,
      kitVersion,
      tools,
      deployment
    })
    assert.equal((await json(destination)).overrides, undefined)
    if (await exists(destination, 'pnpm-workspace.yaml'))
      assert.doesNotMatch(
        await read(destination, 'pnpm-workspace.yaml'),
        /overrides|@vercel/
      )
  }
})
