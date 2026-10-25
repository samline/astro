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
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { randomBytes } from 'node:crypto'
import { dev } from 'astro'
import { spawnSync } from 'node:child_process'

const root = fileURLToPath(new URL('../../', import.meta.url))
export const createAuthFixture = async ({ protectShell = false } = {}) => {
  const directory = await realpath(
    await mkdtemp(path.join(tmpdir(), 'samline-auth-'))
  )
  let revoked = false,
    permitted = true
  const backend = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch: async (request) => {
      const pathname = new URL(request.url).pathname
      const profile = {
        id: 42,
        name: 'Fixture user',
        email: 'user@example.com',
        emailVerified: true,
        roles: ['editor'],
        permissions: permitted ? ['posts:update'] : []
      }
      if (pathname === '/auth/login')
        return Response.json({
          success: true,
          data: { profile, token: 'fixture-private-token' }
        })
      if (pathname === '/auth/profile') {
        if (
          revoked ||
          request.headers.get('authorization') !==
            'Bearer fixture-private-token'
        )
          return new Response(null, { status: 401 })
        return Response.json({ success: true, data: profile })
      }
      if (pathname === '/auth/logout') {
        revoked = true
        return Response.json({ success: true })
      }
      return new Response(null, { status: 404 })
    }
  })
  let server
  try {
    await cp(path.join(root, 'src'), path.join(directory, 'src'), {
      recursive: true
    })
    for (const file of ['astro.config.mjs', 'tsconfig.json', 'package.json'])
      await cp(path.join(root, file), path.join(directory, file))
    await symlink(
      path.join(root, 'node_modules'),
      path.join(directory, 'node_modules'),
      'junction'
    )
    await rm(path.join(directory, 'src/actions'), { recursive: true })
    await mkdir(path.join(directory, 'src/actions'))
    await writeFile(
      path.join(directory, 'src/actions/index.ts'),
      `import { defineAction } from 'astro:actions'
import { requestAuth } from '../server/auth'
export const server = { protected: defineAction({ handler: async (_input, context) => {
 const state = await requestAuth(context.request).requireAccess({ permissions: ['posts:update'] })
 return { id: state.user.id }
} }) }
`
    )
    await cp(
      path.join(directory, 'src/pages/api/auth/[...all].ts.example'),
      path.join(directory, 'src/pages/api/auth/[...all].ts')
    )
    await writeFile(
      path.join(directory, '.env'),
      `SITE_URL=http://127.0.0.1:47365\nAUTH_MODE=external\nAUTH_URL=http://127.0.0.1:47365\nAUTH_SECRET=${randomBytes(48).toString('base64')}\nAUTH_API_URL=${backend.url.origin}/\nAUTH_API_LOGOUT_PATH=auth/logout\n`
    )
    await writeFile(
      path.join(directory, 'src/config/auth.ts'),
      `export const authRoutes = [${protectShell ? "{ path: '/' }," : ''}{ path: '/private', permissions: ['posts:update'] }, { path: '/document.pdf', permissions: ['posts:update'] }]
export const authLoginPath = '/sign-in'
`
    )
    await writeFile(
      path.join(directory, 'src/pages/private.astro'),
      `---
export const prerender = false
const state = await Astro.locals.auth.requireSession()
---
<p data-private>{state.user.id}</p>`
    )
    await writeFile(
      path.join(directory, 'src/pages/document.pdf.ts'),
      `export const prerender = false
export const GET = () => new Response('private document')`
    )
    await writeFile(
      path.join(directory, 'src/components/AuthProbe.astro'),
      `---
import { requestAuth } from '../server/auth'
let authorized = false
try { await requestAuth(Astro.request, 'en-us').requireAccess({ permissions: ['posts:update'] }); authorized = true } catch {}
Astro.response.headers.set('Cache-Control', 'private, no-store')
---
<p data-auth-island={authorized ? 'private' : 'guest'}>{authorized ? 'Private island' : 'Guest island'}</p>`
    )
    await writeFile(
      path.join(directory, 'src/pages/index.astro'),
      `---
import AuthProbe from '../components/AuthProbe.astro'
export const prerender = true
---
<html><body><p data-public>Public static shell</p><AuthProbe server:defer /></body></html>`
    )
    const build = spawnSync(
      process.execPath,
      [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'build'],
      {
        cwd: directory,
        encoding: 'utf8',
        timeout: 30000,
        env: { ...process.env, NODE_ENV: 'production' }
      }
    )
    if (build.status !== 0) throw new Error(build.stdout + build.stderr)
    const staticHTML = await readFile(
      path.join(directory, '.vercel/output/static/index.html'),
      'utf8'
    )
    server = await dev({
      root: pathToFileURL(directory + '/'),
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 47365, strictPort: true }
    })
    return {
      directory,
      staticHTML,
      origin: `http://127.0.0.1:${server.address.port}`,
      revoke: () => {
        revoked = true
      },
      deny: () => {
        permitted = false
      },
      dispose: async () => {
        await server.stop()
        await backend.stop(true)
        await rm(directory, { recursive: true, force: true })
      }
    }
  } catch (error) {
    await server?.stop()
    await backend.stop(true)
    await rm(directory, { recursive: true, force: true })
    throw error
  }
}
