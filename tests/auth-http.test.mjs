import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAuthFixture } from './helpers/auth-fixture.mjs'

test(
  'Astro HTTP auth protects routes and Actions independently, detects revocation and leaves SSG shell public',
  { timeout: 30000 },
  async (t) => {
    const fixture = await createAuthFixture()
    t.after(fixture.dispose)
    assert.match(fixture.staticHTML, /Public static shell/)
    assert.doesNotMatch(
      fixture.staticHTML,
      /Private island|fixture-private-token/
    )
    const { origin } = fixture
    const read = (path, options = {}) =>
      fetch(origin + path, {
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
        ...options
      })
    const shell = await read('/')
    const html = await shell.text()
    assert.equal(shell.status, 200)
    assert.match(html, /Public static shell/)
    assert.doesNotMatch(
      html,
      /fixture-private-token|data-auth-island="private"/
    )
    const anonymous = await read('/private')
    assert.equal(anonymous.status, 401, await anonymous.clone().text())
    const redirect = await read('/private', {
      headers: { accept: 'text/html' }
    })
    assert.equal(redirect.status, 302)
    assert.ok(redirect.headers.get('location').startsWith('/sign-in?returnTo='))
    assert.equal((await read('/document.pdf')).status, 401)
    const action = (cookie) =>
      read('/_actions/protected', {
        method: 'POST',
        body: '{}',
        headers: {
          origin,
          'content-type': 'application/json',
          ...(cookie ? { cookie } : {})
        }
      })
    assert.equal((await action()).status, 401)
    const login = await read('/api/auth/external/sign-in', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'password123'
      }),
      headers: {
        origin,
        'content-type': 'application/json',
        'x-samline-client-ip': 'untrusted-browser-address'
      }
    })
    assert.equal(login.status, 200, await login.clone().text())
    const cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ')
    const privatePage = await read('/private', { headers: { cookie } })
    assert.equal(privatePage.status, 200, await privatePage.clone().text())
    assert.match(privatePage.headers.get('cache-control'), /no-store/)
    assert.equal((await action(cookie)).status, 200)
    fixture.deny()
    assert.equal((await read('/private', { headers: { cookie } })).status, 403)
    assert.equal((await action(cookie)).status, 403)
    fixture.revoke()
    assert.equal((await read('/private', { headers: { cookie } })).status, 401)
    assert.equal((await action(cookie)).status, 401)
  }
)

test(
  'a protected prerendered page fails the build instead of publishing private static HTML',
  { timeout: 30000 },
  async () => {
    await assert.rejects(
      createAuthFixture({ protectShell: true }),
      /Protected pages must export prerender = false/
    )
  }
)
