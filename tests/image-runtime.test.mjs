import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:http'
import {
  cp,
  access,
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
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createProject } from '../packages/cli/lib/project.mjs'
import { selectTools } from '../packages/cli/lib/process.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const run = promisify(execFile)
const pixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64'
)

test(
  'Vercel Sharp processes SSG, SSR, island and template images from a relocated function artifact',
  { timeout: 45000 },
  async (t) => {
    const temporary = await realpath(
      await mkdtemp(path.join(tmpdir(), 'astro-images-'))
    )
    t.after(() => rm(temporary, { recursive: true, force: true }))
    const upstream = createServer((_request, response) => {
      response.setHeader('content-type', 'image/png')
      response.end(pixel)
    })
    await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve))
    t.after(() => new Promise((resolve) => upstream.close(resolve)))
    const remote = `http://127.0.0.1:${upstream.address().port}/pixel.png`
    const site = path.join(temporary, 'site')
    const manifest = JSON.parse(
      await readFile(path.join(root, 'package.json'), 'utf8')
    )
    await createProject({
      template: path.join(root, 'packages/cli/template'),
      destination: site,
      tools: selectTools({ pnpm: '12.9.1', bun: '1.4.4' }),
      kitVersion: manifest.version,
      deployment: 'vercel',
      features: []
    })
    await mkdir(path.join(site, 'node_modules'), { recursive: true })
    // Keep native runtime dependencies inside the fixture, as a real install does.
    // Out-of-project package links make NFT emit out-of-project symlinks, not a deployable fixture.
    await cp(
      path.dirname(await realpath(path.join(root, 'node_modules/sharp'))),
      path.join(site, 'node_modules'),
      { recursive: true, dereference: true }
    )
    const generated = JSON.parse(
      await readFile(path.join(site, 'package.json'), 'utf8')
    )
    for (const name of Object.keys({
      ...generated.dependencies,
      ...generated.devDependencies
    })) {
      const target = path.join(site, 'node_modules', name)
      if (
        await access(target).then(
          () => true,
          () => false
        )
      )
        continue
      await mkdir(path.dirname(target), { recursive: true })
      await symlink(
        await realpath(path.join(root, 'node_modules', name)),
        target,
        'junction'
      )
    }
    await mkdir(path.join(site, 'src/assets'), { recursive: true })
    await writeFile(path.join(site, 'src/assets/pixel.png'), pixel)
    await writeFile(
      path.join(site, 'src/components/ImageProbe.astro'),
      `---
import { Image } from 'astro:assets'
import picture from '../assets/pixel.png'
const { remote } = Astro.props
---
<Image src={remote ?? picture} width={1} height={1} format='webp' alt='' />`
    )
    await writeFile(
      path.join(site, 'src/pages/index.astro'),
      `---
import ImageProbe from '../components/ImageProbe.astro'
---
<ImageProbe /><template><ImageProbe /></template><ImageProbe server:defer remote='${remote}' />`
    )
    await writeFile(
      path.join(site, 'src/pages/live.astro'),
      `---
export const prerender = false
import ImageProbe from '../components/ImageProbe.astro'
---
<ImageProbe remote='${remote}' />`
    )
    // Keep the generated adapter/native dependency configuration under test.
    const configFile = path.join(site, 'astro.config.mjs')
    const config = await readFile(configFile, 'utf8')
    await writeFile(
      configFile,
      config.replace(
        '  image: {',
        `  image: {\n    remotePatterns: [{ protocol: 'http', hostname: '127.0.0.1', port: '${upstream.address().port}' }],`
      )
    )
    await run(
      process.execPath,
      [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
      { cwd: site, timeout: 30000 }
    )
    const output = path.join(site, '.vercel/output')
    const html = await readFile(path.join(output, 'static/index.html'), 'utf8')
    const src = html.match(/<img[^>]*src="([^"]+)"/)?.[1]
    assert.ok(src?.endsWith('.webp'), html)
    const staticImage = await readFile(path.join(output, 'static', src))
    assert.equal(staticImage.subarray(8, 12).toString(), 'WEBP')
    assert.match(html, /<template><img/)
    const islandURL = html
      .match(/href="([^\"]*\/_server-islands\/[^\"]+)"/)?.[1]
      .replaceAll('&amp;', '&')
    assert.ok(islandURL)
    const isolated = path.join(temporary, 'isolated')
    await cp(path.join(output, 'functions/_render.func'), isolated, {
      recursive: true,
      dereference: true
    })
    const functionConfig = JSON.parse(
      await readFile(path.join(isolated, '.vc-config.json'), 'utf8')
    )
    // No project node_modules in this artifact's ancestors: missing native files cannot borrow ours.
    await writeFile(
      path.join(isolated, 'check.mjs'),
      `
import assert from 'node:assert/strict'
const { default: handler } = await import(${JSON.stringify('./' + functionConfig.handler)})
for (const path of ['/live', ${JSON.stringify(islandURL)}]) {
  const page = await handler.fetch(new Request(new URL(path, 'https://images.example')))
  assert.equal(page.status, 200)
  const html = await page.text()
  const src = html.match(/src="([^"]+)"/)[1].replaceAll('&amp;', '&')
  const image = await handler.fetch(new Request(new URL(src, 'https://images.example')))
  assert.equal(image.status, 200)
  assert.equal(image.headers.get('content-type'), 'image/webp')
  assert.equal(Buffer.from(await image.arrayBuffer()).subarray(8, 12).toString(), 'WEBP')
}
`
    )
    const env = { ...process.env }
    delete env.NODE_PATH
    await run(process.execPath, [path.join(isolated, 'check.mjs')], {
      cwd: isolated,
      env,
      timeout: 15000
    })
  }
)
